// 【重要】Google Apps Scriptをデプロイしたら、そのURLをここに貼り付けてください。
// 例: const GAS_URL = "https://script.google.com/a/macros/soka-u.jp/s/AKfycby_h3NI0n2SpUUAhtAAj5GmyRtEnoRLYOZYh4d_bO2E99KhzzsVpBt-WKME5YAGoMtt/exec";
// 空のままだとローカル（スマホ本体）にのみデータが保存されます。
const GAS_URL = "https://script.google.com/a/macros/soka-u.jp/s/AKfycbx2gWr4zbs9zNI-6RZ9wb-NpEXSGTcTIcFR0XeDQLx0JITwi7pybEGkO2XvAx0bMY6X_Q/exec";

// 貸出アイテムのリスト（ご指定のリストに更新済み）
const ITEMS = [
    { id: "room1", type: "room", name: "第1会議室", info: "" },
    { id: "room2A", type: "room", name: "第2会議室A", info: "" },
    { id: "room2B", type: "room", name: "第2会議室B", info: "" },
    { id: "room2C", type: "room", name: "第2会議室C", info: "" },
    { id: "room8", type: "room", name: "第8会議室", info: "" },
    { id: "room9", type: "room", name: "第9会議室", info: "" },
    { id: "room9_kitchen", type: "room", name: "第9会議室給湯室", info: "" },
    { id: "room10", type: "room", name: "第10会議室", info: "" },
    { id: "recep1", type: "room", name: "第1応接", info: "" },
    { id: "recep2", type: "room", name: "第2応接", info: "" },
    { id: "recep3", type: "room", name: "第3応接", info: "" },
    { id: "recep4", type: "room", name: "第4応接", info: "" },
    { id: "discovery", type: "room", name: "ディスカバリーホール", info: "" },
    { id: "print_room", type: "room", name: "1階印刷室", info: "" },
    { id: "gakuji_car", type: "vehicle", name: "学事車両", info: "※アルコールチェック必須" }
];
