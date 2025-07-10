const TelegramBot = require("node-telegram-bot-api");
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const ADMIN_ID = process.env.ADMIN_ID; // آیدی عددی ادمین (جایگزین کن با آیدی خودت)

const userData = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : "ندارد";

  userData[userId] = {
    telegramId: username, // آی‌دی با @ ذخیره میشه
    step: "fullName",
  };

  bot.sendMessage(
    chatId,
    `سلام دوست عزیز! 👋🥰  

به ربات ثبت نام لایوتریدهای شکارگاه سهند خوش آمدی 💫
  
برای دریافت نام کاربری و رمز عبور لایوترید اول از همه، نام و نام خانوادگی خودت رو بنویس ✍️`
  );
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text?.trim();

  if (text === "/start") return;

  const user = userData[userId];
  if (!user) return;

  switch (user.step) {
    case "fullName":
      user.fullName = text;
      user.step = "phone";
      bot.sendMessage(
        chatId,
        `بسیار عالی 🌟  
لطفاً **شماره موبایلت رو هم ارسال کن 📱  
(مثلاً: 09123456789)
`
      );
      break;

    case "phone":
      const phoneRegex = /^(\+98|0)?9\d{9}$/;
      if (!phoneRegex.test(text)) {
        return bot.sendMessage(
          chatId,
          `اوه اوه 😅  
به‌نظر می‌رسه شماره‌ات درست نیست 😕  
یه بار دیگه و با دقت واردش کن 📞`
        );
      }

      user.phoneNumber = text;
      user.step = "capitalXtend";
      bot.sendMessage(
        chatId,
        `تشکر 🌺   
در مرحله آخر لطفاً شناسه‌ی CapitalXtend خودت رو وارد کن. شناسه‌ی CapitalXtend برای مثال باید به این شکل باشه:  
CX786123456  
یعنی با CX(حروف بزرگ) شروع بشه و دقیقاً 9 رقم عددی بعدش بیاد.🧾
`
      );
      break;

    case "capitalXtend":
      const capitalXtendRegex = /^CX786\d{6}$/;
      if (!capitalXtendRegex.test(text)) {
        return bot.sendMessage(
          chatId,
          `😕 اوه نه!  
شناسه‌ی CapitalXtend باید دقیقاً به این شکل باشه:  
CX786123456  
یعنی با CX(حروف بزرگ) شروع بشه و دقیقاً 9 رقم عددی بعدش بیاد.  
یه بار دیگه لطفاً با دقت واردش کن 🌟`
        );
      }

      user.capitalXtendId = text;

      saveToExcel(user);

      bot.sendMessage(
        chatId,
        `اطلاعاتت با موفقیت ذخیره شد ✅  
ممنون ازت که وقت گذاشتی ❤️
تا دقایقی دیگه اطلاعات دسترسی به کانال واستون ارسال میشه.⏳
برای پشتیبانی میتونی به آی دی @imehmandoost پیام بدی. 📩  
نام کاربری و رمز عبورت به ترتیب آی دی CapitalXtend و شماره موبایل هست.🗝️`
      );

      delete userData[userId];
      break;

    default:
      bot.sendMessage(
        chatId,
        `برای شروع لطفاً دستور /start رو بزن تا همه‌چی از اول شروع کنیم 🚀`
      );
  }
});

function saveToExcel(data) {
  const filePath = path.join(__dirname, "users.xlsx");
  let workbook;
  let worksheet;

  if (fs.existsSync(filePath)) {
    workbook = XLSX.readFile(filePath);
    worksheet = workbook.Sheets[workbook.SheetNames[0]];
  } else {
    workbook = XLSX.utils.book_new();
    worksheet = XLSX.utils.aoa_to_sheet([
      ["نام کامل", "شماره موبایل", "آی‌دی تلگرام", "شناسه CapitalXtend"],
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
  }

  const newRow = [
    data.fullName,
    data.phoneNumber,
    data.telegramId,
    data.capitalXtendId,
  ];
  const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  sheetData.push(newRow);

  const newSheet = XLSX.utils.aoa_to_sheet(sheetData);
  workbook.Sheets["Users"] = newSheet;

  XLSX.writeFile(workbook, filePath);

  // 💌 ارسال فایل برای ادمین
  bot.sendDocument(ADMIN_ID, filePath, {
    caption: `📦 فایل اطلاعات جدید ذخیره شد ✨  
👤 نام: ${data.fullName}  
📱 شماره موبایل: ${data.phoneNumber}  
💬 آیدی تلگرام: ${data.telegramId}  
🧾 شناسه CapitalXtend: ${data.capitalXtendId}`,
  });
}
