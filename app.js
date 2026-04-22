document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let currentItemsState = {};
let selectedItemForCheckout = null;

function initApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetItemId = urlParams.get('item');

    fetchState();
    renderTabs();

    // QRコードのURLパラメータ(?item=〇〇)から直接アクセスされた場合の処理
    if (targetItemId) {
        const item = ITEMS.find(i => i.id === targetItemId);
        if (item) {
            switchTab(item.type === 'room' ? 'rooms' : 'vehicles');
            // すでに貸出中なら確認後返却、貸出可ならモーダルを開く
            if (currentItemsState[item.id] && currentItemsState[item.id].status === 'in_use') {
                handleReturn(item.id);
            } else {
                openModal(item.id);
            }
        }
    } else {
        switchTab('rooms');
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    document.getElementById('btnCancel').addEventListener('click', closeModal);
    document.getElementById('btnSubmit').addEventListener('click', submitCheckout);
}

// データの読み込み
function fetchState() {
    // ※今回はローカル環境(LocalStorage)での動作としています
    const saved = localStorage.getItem('smartKey_state');
    if (saved) {
        currentItemsState = JSON.parse(saved);
    } else {
        currentItemsState = {};
    }
}

function saveState() {
    localStorage.setItem('smartKey_state', JSON.stringify(currentItemsState));
}

// 履歴の記録 (管理者のCSV用)
function logHistory(type, itemId, itemName, dept, name) {
    const history = JSON.parse(localStorage.getItem('smartKey_history') || '[]');
    history.push({
        time: new Date().toISOString(),
        action: type,
        itemId: itemId,
        itemName: itemName,
        dept: dept || '-',
        name: name || '-'
    });
    localStorage.setItem('smartKey_history', JSON.stringify(history));
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    renderCards(tabId);
}

function renderCards(tabType) {
    const container = document.getElementById('mainContainer');
    const filteredItems = ITEMS.filter(i => {
        if (tabType === 'rooms') return i.type === 'room';
        if (tabType === 'vehicles') return i.type === 'vehicle';
        return false;
    });

    let html = `<div class="grid">`;
    filteredItems.forEach(item => {
        const state = currentItemsState[item.id] || { status: 'available' };
        const isAvailable = state.status === 'available';
        
        html += `
            <div class="card">
                <span class="status-badge ${isAvailable ? 'status-available' : 'status-in-use'}">
                    ${isAvailable ? '貸出可' : '貸出中'}
                </span>
                <h3 class="card-title">${item.name}</h3>
                <div class="card-info">
                    ${item.info}<br>
                    ${!isAvailable ? `<strong style="color:#B91C1C; display:block; margin-top:0.5rem;">${state.dept} ${state.name} さんが利用中</strong>` : ''}
                </div>
                ${isAvailable 
                    ? `<button class="action-btn btn-scan" onclick="openModal('${item.id}')">📱 これを借りる</button>` 
                    : `<button class="action-btn btn-return" onclick="handleReturn('${item.id}')">↩ 返却する</button>`
                }
            </div>
        `;
    });
    html += `</div>`;
    container.innerHTML = html;
}

function openModal(itemId) {
    const item = ITEMS.find(i => i.id === itemId);
    selectedItemForCheckout = item;
    
    document.getElementById('modalTitle').innerText = item.name + ' を借りる';
    document.getElementById('vehicleFields').style.display = item.type === 'vehicle' ? 'block' : 'none';
    
    const alcoholCheck = document.getElementById('alcoholCheck');
    if (alcoholCheck) alcoholCheck.checked = false;
    
    // ブラウザに記憶された名前と所属を復元
    const savedDept = localStorage.getItem('smartKey_dept') || '';
    const savedName = localStorage.getItem('smartKey_name') || '';
    document.getElementById('deptInput').value = savedDept;
    document.getElementById('nameInput').value = savedName;

    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal() {
    const modal = document.getElementById('checkoutModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
    selectedItemForCheckout = null;
    
    // URLのクエリパラメータを消してスッキリさせる
    window.history.replaceState({}, document.title, window.location.pathname);
}

function submitCheckout() {
    if (!selectedItemForCheckout) return;

    const dept = document.getElementById('deptInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();

    if (!dept || !name) {
        alert('所属と氏名を入力してください。');
        return;
    }

    if (selectedItemForCheckout.type === 'vehicle') {
        if (!document.getElementById('alcoholCheck').checked) {
            alert('アルコールチェックの確認にチェックを入れてください。');
            return;
        }
    }

    // 次回のために保存
    localStorage.setItem('smartKey_dept', dept);
    localStorage.setItem('smartKey_name', name);

    // 状態更新
    currentItemsState[selectedItemForCheckout.id] = {
        status: 'in_use',
        dept: dept,
        name: name,
        timestamp: new Date().toISOString()
    };
    saveState();
    logHistory('貸出', selectedItemForCheckout.id, selectedItemForCheckout.name, dept, name);

    alert('貸出処理が完了しました！');
    closeModal();
    renderTabs();
}

function handleReturn(itemId) {
    if(confirm('返却処理を行いますか？')) {
        const state = currentItemsState[itemId];
        logHistory('返却', itemId, ITEMS.find(i=>i.id===itemId).name, state?.dept, state?.name);
        
        currentItemsState[itemId] = { status: 'available' };
        saveState();
        alert('返却が完了しました。');
        
        window.history.replaceState({}, document.title, window.location.pathname);
        renderTabs();
    }
}

function renderTabs() {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'rooms';
    renderCards(activeTab);
}
