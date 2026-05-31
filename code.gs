// ==========================================
// 設定エリア
// ==========================================
const ENABLE_LOGGING = true; 
// 保存したいスプレッドシートのID（URLの /d/ と /edit の間の文字列）を記入してください
// 空のままでも、スクリプトに紐づくシートがあればそこに書き込みます
const SPREADSHEET_ID = "1fCZF203mfj2cmgBOPJ4LCLW9I-aNajOq7XtILdg5t-M"; 

function callGemini(promptText, base64Image = null) {
  const API_KEY = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY が設定されていません。");
  }

  let parts = [];
  if (base64Image) {
    parts.push({
      inline_data: {
        mime_type: "image/jpeg",
        data: base64Image
      }
    });
  }
  parts.push({ text: promptText });

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=" + API_KEY;
  
  const payload = { 
    contents: [{ parts: parts }] 
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response.getContentText());

  if (response.getResponseCode() !== 200) {
    throw new Error(`API Error (${response.getResponseCode()}): ${json.error ? json.error.message : 'Unknown Error'}`);
  }
  
  return json.candidates[0];
}

/**
 * スプレッドシートにログを保存する関数
 */
function saveToSpreadsheet(userName, userGoal, reason, commentary) {
  try {
    const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return; // シートが見つからなければスキップ
    
    let sheet = ss.getSheetByName("実況ログ");
    // シートがなければ作成
    if (!sheet) {
      sheet = ss.insertSheet("実況ログ");
      sheet.appendRow(["日時", "名前", "目標", "検知理由", "実況内容"]);
    }
    
    // データの追加
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, "JST", "yyyy/MM/dd HH:mm:ss");
    sheet.appendRow([formattedDate, userName, userGoal, reason, commentary]);
  } catch (e) {
    console.error("スプレッドシート保存エラー: " + e.message);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const userName = data.name || "選手";
    const userGoal = data.goal || "作業";
    const triggerReason = data.reason || "集中力の変化";
    
    const prompt = `あなたは熱血かつユーモア溢れる「作業見守り実況者」です。
現在、${userGoal}に挑む${userName}選手を全力で応援しています。

# 今起きたこと
システムが「${triggerReason}」を検知しました。

# 指示
画像から${userName}選手の様子を読み取り、状況をズバッと指摘しつつ、やる気を爆上げする「魂の一言」を実況してください。

# 制約事項
* 文字数は【30文字〜60文字】を厳守。
* 出力は「実況文のみ」とすること。前置きや解説は一切不要。
* 「変化なし」「判定不能」は絶対に禁止。必ず何か言い放ってください。
* 絵文字・顔文字は禁止。
* キャラクター：親しみやすく、少し強引だけど愛のある熱血コーチ風。

# 実況例
「おいおい${userName}選手！スマホに吸い込まれそうな顔になってるぞ！${userGoal}の頂上はまだ先だ、今すぐ視線を戻してギアを上げろ！」`;

    const geminiResponse = callGemini(prompt, data.currentImage.data);
    const result = geminiResponse.content; 
    
    // 実況文を取得
    const generatedText = result.parts[0].text.trim();

    // --- スプレッドシートに保存 ---
    saveToSpreadsheet(userName, userGoal, triggerReason, generatedText);

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      error: err.message,
      parts: [{ text: "エラーが発生しました。" }] 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
function forceAuth() {
  SpreadsheetApp.getActiveSpreadsheet();
  DriveApp.getRootFolder();
}
