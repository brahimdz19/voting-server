// ===== Voting Server by Ibrahim =====
const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();

// =============== إعدادات ===============
const votesPath = path.join(__dirname, "votes.json");
const ADMIN_PASSWORD = "admin2025"; // ← غيّرها لكلمة سر قوية خاصة بك فقط

// =============== وسائط ===============
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// =============== تأكد من وجود الملف ===============
if (!fs.existsSync(votesPath)) {
  fs.writeFileSync(votesPath, "[]", "utf-8");
  console.log("🆕 تم إنشاء ملف votes.json الجديد");
}

// =============== قراءة التصويتات ===============
function getVotes() {
  try {
    const data = fs.readFileSync(votesPath, "utf-8");
    return JSON.parse(data || "[]");
  } catch (err) {
    console.error("❌ خطأ في قراءة التصويتات:", err);
    return [];
  }
}

// =============== حفظ التصويتات ===============
function saveVotes(votes) {
  fs.writeFileSync(votesPath, JSON.stringify(votes, null, 2), "utf-8");
}

// =============== نقطة النهاية الرئيسية ===============
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =============== إرجاع جميع التصويتات ===============
app.get("/votes", (req, res) => {
  try {
    const votes = getVotes();
    res.json(votes);
  } catch (err) {
    res.status(500).json({ success: false, message: "خطأ في قراءة التصويتات" });
  }
});

// =============== استقبال تصويت جديد ===============
app.post("/vote", (req, res) => {
  try {
    const { name, choice, timestamp } = req.body;

    if (!name || !choice) {
      return res.json({ success: false, message: "الرجاء إدخال جميع البيانات" });
    }

    const votes = getVotes();

    // تحقق من عدم تصويت الاسم سابقًا
    const alreadyVoted = votes.some(
      (v) => v.name.toLowerCase() === name.toLowerCase()
    );
    if (alreadyVoted) {
      return res.json({ success: false, message: "لقد قمت بالتصويت مسبقًا" });
    }

    // أضف التصويت الجديد
    votes.push({ name, choice, timestamp });
    saveVotes(votes);

    console.log(`🗳️ تصويت جديد: ${name} => ${choice}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ أثناء حفظ التصويت:", err);
    res.json({ success: false, message: "خطأ أثناء الحفظ" });
  }
});

// =============== تحقق من كلمة مرور المدير ===============
app.post("/admin-check", (req, res) => {
  const { password } = req.body || {};
  if (password && password === ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  return res.json({ success: false, message: "كلمة المرور خاطئة" });
});

// =============== حذف تصويت حسب الفهرس ===============
app.post("/delete-vote", (req, res) => {
  try {
    const { index, password } = req.body || {};

    if (!password || password !== ADMIN_PASSWORD) {
      return res.json({ success: false, message: "كلمة المرور غير صحيحة" });
    }

    const votes = getVotes();

    if (typeof index !== "number" || index < 0 || index >= votes.length) {
      return res.json({ success: false, message: "مؤشر التصويت غير صالح" });
    }

    const removed = votes.splice(index, 1);
    saveVotes(votes);

    console.log(`🗑️ تم حذف تصويت: ${removed[0]?.name}`);
    return res.json({ success: true });
  } catch (err) {
    console.error("❌ خطأ أثناء الحذف:", err);
    return res.json({ success: false, message: "خطأ أثناء الحذف" });
  }
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin2025";
const PORT = process.env.PORT || 3000;
...
app.listen(PORT, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${PORT}`);
});
