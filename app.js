document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

let currentItemsState = {};
let selectedItemForCheckout = null;
let selectedItemForReturn = null;

function checkAdminPassword(e) {
    e.preventDefault();
    const pw = prompt('管理者パスワードを入力してください:');
    if (pw === 'gakuji1') {
        window.location.href = 'admin.html';
    } else if (pw !== null) {
        alert('パスワードが違います。');
    }
}

async function initApp() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetItemId = urlParams.get('item');

    // 通信中の表示
    document.getElementById('mainContainer').innerHTML = '<div style="text-align:center; padding: 3rem; color: #64748B;">🔄 貸出状況を取得しています...</div>';

    await fetchState();
    renderTabs();

    // QRコードのパラメータがある場合は自動で画面遷移
    if (targetItemId) {
        const item = ITEMS.find(i => i.id === targetItemId);
        if (item) {
            switchTab(item.type === 'room' ? 'rooms' : 'vehicles');
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

// データの読み込み（GAS対応）
async function fetchState() {
    if (GAS_URL) {
        try {
            const response = await fetch(GAS_URL);
            const data = await response.json();
            currentItemsState = data || {};
        } catch(e) {
            console.error("スプレッドシート連携エラー:", e);
            alert("クラウドからのデータ取得に失敗しました。一時的にローカルデータを使用します。");
            currentItemsState = JSON.parse(localStorage.getItem('smartKey_state') || '{}');
        }
    } else {
        // GAS設定がない場合はローカルストレージを使用
        currentItemsState = JSON.parse(localStorage.getItem('smartKey_state') || '{}');
    }
}

// データの保存（GAS対応）
async function saveStateToCloud(itemId, status, action, itemName, dept, name, returnTime = '') {
    // ローカルにも一応保存しておく
    currentItemsState[itemId] = { status, dept, name, returnTime, timestamp: new Date().toISOString() };
    localStorage.setItem('smartKey_state', JSON.stringify(currentItemsState));

    if (GAS_URL) {
        const payload = {
            itemId: itemId,
            status: status, // 'in_use' or 'available'
            action: action, // '貸出' or '返却'
            itemName: itemName,
            dept: dept,
            name: name,
            returnTime: returnTime
        };
        try {
            // text/plainとして送信することでCORSエラーを回避しつつGASにJSONを渡す
            await fetch(GAS_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        } catch(e) {
            console.error("GAS送信エラー:", e);
            alert("クラウドへの保存に失敗しました。電波の良いところで再度お試しください。");
        }
    } else {
        // GASがない場合は履歴もローカルに記録（デモ用）
        const history = JSON.parse(localStorage.getItem('smartKey_history') || '[]');
        history.push({ time: new Date().toISOString(), action, itemId, itemName, dept, name, returnTime });
        localStorage.setItem('smartKey_history', JSON.stringify(history));
    }
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
                    ${!isAvailable ? `<strong style="color:#B91C1C; display:block; margin-top:0.5rem;">${state.dept} ${state.name} さんが利用中<br>（返却予定: ${state.returnTime || '未定'}）</strong>` : ''}
                </div>
                ${isAvailable 
                    ? `<button class="action-btn btn-scan" onclick="openModal('${item.id}')">📱 鍵を借りる</button>` 
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
    
    document.getElementById('modalTitle').innerText = item.name + ' の鍵を借りる';
    document.getElementById('vehicleFields').style.display = item.type === 'vehicle' ? 'block' : 'none';
    
    const alcoholCheck = document.getElementById('alcoholCheck');
    if (alcoholCheck) alcoholCheck.checked = false;
    
    // スマホに記憶された情報を復元
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
    
    window.history.replaceState({}, document.title, window.location.pathname);
}

async function submitCheckout() {
    if (!selectedItemForCheckout) return;

    const dept = document.getElementById('deptInput').value.trim();
    const name = document.getElementById('nameInput').value.trim();
    const returnTime = document.getElementById('returnTimeInput').value;

    if (!dept || !name) {
        alert('所属と氏名を入力してください。');
        return;
    }

    if (!returnTime) {
        alert('返却予定時間を入力してください。');
        return;
    }

    if (selectedItemForCheckout.type === 'vehicle') {
        if (!document.getElementById('alcoholCheck').checked) {
            alert('アルコールチェックの確認にチェックを入れてください。');
            return;
        }
    }

    localStorage.setItem('smartKey_dept', dept);
    localStorage.setItem('smartKey_name', name);

    // 通信中のボタン制御
    const btn = document.getElementById('btnSubmit');
    btn.innerText = "通信中...";
    btn.disabled = true;

    await saveStateToCloud(selectedItemForCheckout.id, 'in_use', '貸出', selectedItemForCheckout.name, dept, name, returnTime);

    btn.innerText = "貸出確定";
    btn.disabled = false;

    alert('貸出処理が完了しました！');
    closeModal();
    renderTabs();
}

function handleReturn(itemId) {
    const item = ITEMS.find(i => i.id === itemId);
    selectedItemForReturn = item;
    
    document.getElementById('returnModalDesc').innerText = `${item.name} の鍵の返却処理を行いますか？`;
    document.getElementById('returnVehicleFields').style.display = item.type === 'vehicle' ? 'block' : 'none';
    
    const accidentCheck = document.getElementById('accidentCheck');
    if (accidentCheck) accidentCheck.checked = false;

    const modal = document.getElementById('returnModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeReturnModal() {
    const modal = document.getElementById('returnModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
    selectedItemForReturn = null;
}

async function submitReturn() {
    if (!selectedItemForReturn) return;

    if (selectedItemForReturn.type === 'vehicle') {
        if (!document.getElementById('accidentCheck').checked) {
            alert('事故や車両の損傷等がないかの確認にチェックを入れてください。');
            return;
        }
    }

    const state = currentItemsState[selectedItemForReturn.id] || {};

    const btn = document.getElementById('btnReturnSubmit');
    btn.innerText = "通信中...";
    btn.disabled = true;

    await saveStateToCloud(selectedItemForReturn.id, 'available', '返却', selectedItemForReturn.name, state.dept || '-', state.name || '-');

    btn.innerText = "返却確定";
    btn.disabled = false;

    alert('返却が完了しました。');
    closeReturnModal();
    window.history.replaceState({}, document.title, window.location.pathname);
    renderTabs();
}

function renderTabs() {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'rooms';
    renderCards(activeTab);
}
