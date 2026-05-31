// GASの「ウェブアプリとして公開」した時のURLを入力
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzDWfvL-uMa7OEDPpJZZ3BYHd89mLpBzeghwvt2fun4BDAT9HLQXK_2nDsFT-FEv5Fm/exec";

const resultDiv = document.getElementById('commentary-result');

// 画像送信を廃止し、ログ記録用のリクエストのみ送信する
async function triggerCMLog() {
  resultDiv.innerText = "GASにCM再生ログを送信中...";

  const payload = {
    name: "福田", // 必要に応じて入力欄から取得
    goal: "GAS開発", 
    reason: "集中力チェック(外部テスト)"
  };

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (result.status === "success") {
      resultDiv.innerText = "✅ CM再生ログの送信に成功しました。";
    } else {
      resultDiv.innerText = "エラー: " + result.message;
    }
  } catch (error) {
    console.error("送信エラー:", error);
    resultDiv.innerText = "通信に失敗しました。";
  }
}

// 初期化（※カメラ取得機能はここでは不要になったため削除しました）
document.getElementById("some-button-id").addEventListener("click", triggerCMLog);