const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "C:/Users/PC/OneDrive/Desktop/Chatbot/.env" });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const models = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest", "gemini-3-flash-preview"];
const results = [];
function withTimeout(p, ms, label) {
  return new Promise((resolve) => {
    const t = setTimeout(() => { resolve(label + " HANG >" + ms + "ms"); }, ms);
    p.then((v) => { clearTimeout(t); resolve(v); }).catch((e) => { clearTimeout(t); resolve(label + " FAIL " + e.message.slice(0,80)); });
  });
}
(async () => {
  for (const m of models) {
    const t0 = Date.now();
    const p = (async () => {
      const r = await genAI.getGenerativeModel({ model: m }).generateContentStream({ contents: [{ role: "user", parts: [{ text: "hey" }] }] });
      let out = "";
      for await (const c of r.stream) out += c.text();
      return m + " OK " + (Date.now()-t0) + "ms " + JSON.stringify(out.slice(0,30));
    })();
    console.log(await withTimeout(p, 15000, m));
  }
})();
