// =========================================================
// このプログラムを Google Apps Script にコピペしてください
// =========================================================

const SHEET_STATE = "現在の貸出状況";
const SHEET_HISTORY = "履歴";

// 【初期設定】初めて使う時に一度だけ「setup」を選択して「実行」ボタンを押してください。
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 状況シートの作成
  if(!ss.getSheetByName(SHEET_STATE)) {
    const s = ss.insertSheet(SHEET_STATE);
    s.appendRow(["アイテムID", "ステータス", "所属", "氏名", "返却予定", "最終更新日時"]);
    s.getRange("A1:F1").setFontWeight("bold").setBackground("#d9ead3");
  }
  
  // 履歴シートの作成
  if(!ss.getSheetByName(SHEET_HISTORY)) {
    const s = ss.insertSheet(SHEET_HISTORY);
    s.appendRow(["貸出日時", "アイテム名", "所属", "氏名", "返却予定", "返却日時"]);
    s.getRange("A1:F1").setFontWeight("bold").setBackground("#c9daf8");
  }
}

// アプリからの「データ取得(GET)」要求を処理
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_STATE);
  
  // シートがない場合は空を返す
  if (!sheet) return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
  
  const data = sheet.getDataRange().getValues();
  const state = {};
  
  // 2行目から読み込み
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      state[row[0]] = {
        status: row[1],
        dept: row[2],
        name: row[3],
        returnTime: row[4],
        timestamp: row[5]
      };
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(state))
    .setMimeType(ContentService.MimeType.JSON);
}

// アプリからの「貸出・返却(POST)」要求を処理
function doPost(e) {
  let params;
  try {
    params = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({error: "Invalid JSON"})).setMimeType(ContentService.MimeType.JSON);
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const stateSheet = ss.getSheetByName(SHEET_STATE);
  const historySheet = ss.getSheetByName(SHEET_HISTORY);
  
  // 1. 現在の貸出状況シートを更新
  let data = stateSheet.getDataRange().getValues();
  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.itemId) {
      // 既存のアイテムの場合はその行を上書き
      stateSheet.getRange(i + 1, 2, 1, 5).setValues([[params.status, params.dept, params.name, params.returnTime || "", new Date().toISOString()]]);
      found = true;
      break;
    }
  }
  if (!found) {
    // 初めて使われるアイテムの場合は末尾に追記
    stateSheet.appendRow([params.itemId, params.status, params.dept, params.name, params.returnTime || "", new Date().toISOString()]);
  }
  
  // 2. 履歴シートに追記・更新
  const dateStr = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
  
  if (params.action === "貸出") {
    // 貸出時は新しい行を追加
    historySheet.appendRow([
      dateStr,             // A: 貸出日時
      params.itemName,     // B: アイテム名
      params.dept,         // C: 所属
      params.name,         // D: 氏名
      params.returnTime || "", // E: 返却予定
      ""                   // F: 返却日時（貸出時は空）
    ]);
  } else if (params.action === "返却") {
    // 返却時は、同じアイテムの「返却日時が空」の最新の貸出記録を探して日時を追記
    const histData = historySheet.getDataRange().getValues();
    let updated = false;
    
    // 下から上に向かって検索（最新の貸出を探すため）
    for (let i = histData.length - 1; i > 0; i--) {
      const row = histData[i];
      // B列(インデックス1)がアイテム名、F列(インデックス5)が返却日時
      if (row[1] === params.itemName && (row[5] === "" || row[5] === null)) {
        historySheet.getRange(i + 1, 6).setValue(dateStr); // F列(6列目)に返却日時を記録
        updated = true;
        break;
      }
    }
    
    // もし該当する貸出記録が見つからなかった場合（エラー防止用）
    if (!updated) {
      historySheet.appendRow([
        "", 
        params.itemName, 
        params.dept, 
        params.name, 
        "", 
        dateStr + " (返却のみ記録)"
      ]);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
