document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('downloadCsvBtn').addEventListener('click', downloadCsv);
    renderQrCodes();
});

function downloadCsv() {
    const history = JSON.parse(localStorage.getItem('smartKey_history') || '[]');
    if(history.length === 0) {
        alert('履歴データがありません。');
        return;
    }

    // CSVヘッダー
    let csvContent = "日時,操作,アイテム名,所属,氏名\n";
    
    history.forEach(row => {
        const date = new Date(row.time).toLocaleString('ja-JP');
        csvContent += `"${date}","${row.action}","${row.itemName}","${row.dept}","${row.name}"\n`;
    });

    // BOM付きで文字化け防止
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "貸出履歴_" + new Date().getTime() + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function renderQrCodes() {
    const container = document.getElementById('qrList');
    
    // 現在のURL（admin.htmlを除去してindex.htmlを基準にする）
    const baseUrl = window.location.href.split('admin.html')[0];
    const indexUrl = baseUrl.endsWith('/') ? baseUrl + 'index.html' : baseUrl + '/index.html';

    let html = `<ul style="line-height: 2.5; list-style: none; padding: 0;">`;
    
    ITEMS.forEach(item => {
        // 例: https://username.github.io/SmartKeyApp/index.html?item=room1
        const itemUrl = `${indexUrl}?item=${item.id}`;
        html += `
            <li style="margin-bottom: 1rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.5rem;">
                <strong>${item.name}</strong><br>
                <a href="${itemUrl}" target="_blank" style="color:var(--primary); text-decoration:none; word-break: break-all;">${itemUrl}</a>
            </li>`;
    });
    html += `</ul>`;
    
    html += `
    <div style="margin-top: 2rem; padding: 1.5rem; background: #F1F5F9; border-radius: 0.5rem;">
        <strong>💡 QRコードの作り方</strong><br><br>
        1. 上記の青いURLをコピーします。<br>
        2. 無料のQRコード作成サイト（例: <a href="https://qr.quel.jp/" target="_blank">QRのススメ</a>等）を開きます。<br>
        3. URLを貼り付けてQRコード画像をダウンロードし、印刷して鍵や保管場所に貼り付けます。
    </div>`;
    
    container.innerHTML = html;
}
