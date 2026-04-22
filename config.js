// 【将来的な拡張用】Google Apps ScriptのURL（現状は空でOK。空の場合はスマホ内保存モードになります）
const GAS_URL = ""; 

// 貸出アイテムのリスト（必要に応じて追加・変更してください）
const ITEMS = [
    { id: "room1", type: "room", name: "第1会議室", info: "定員: 10名" },
    { id: "room2", type: "room", name: "第2会議室", info: "定員: 8名" },
    { id: "room3", type: "room", name: "大会議室A", info: "定員: 50名" },
    { id: "car1", type: "vehicle", name: "1号車 (プリウス)", info: "品川 500 あ 1234" },
    { id: "car2", type: "vehicle", name: "2号車 (ノート)", info: "品川 500 い 5678" },
    { id: "car3", type: "vehicle", name: "3号車 (ステップワゴン)", info: "品川 300 う 9012" }
];
