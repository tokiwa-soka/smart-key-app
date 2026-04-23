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
    s.appendRow(["日時", "操作", "アイテム名", "所属", "氏名", "返却予定"]);
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
  
  // 2. 履歴シートに追記
  // 日本時間(JST)に変換して見やすくする
  const dateStr = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss");
  historySheet.appendRow([
    dateStr,
    params.action,
    params.itemName,
    params.dept,
    params.name,
    params.returnTime || ""
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}))
    .setMimeType(ContentService.MimeType.JSON);
}
