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
    `سلام دوست عزیزم! 👋🥰  
خوش اومدی به ربات ثبت‌نام 💫  
بی‌زحمت اول از همه، **نام و نام خانوادگی**‌ت رو برام بنویس ✍️`
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
        `عالیه 🌟  
حالا لطفاً **شماره موبایلت** رو هم برام بنویس 📱  
(مثلاً: 09123456789)`
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
        `مرررسی 🌺  
فقط یه مرحله‌ی کوچولو مونده!  
لطفاً **شناسه‌ی CapitalXtend** خودت رو هم وارد کن 🧾`
      );
      break;

    case "capitalXtend":
      user.capitalXtendId = text;

      saveToExcel(user);

      bot.sendMessage(
        chatId,
        `🎉 همه‌چی عالی بود!  
اطلاعاتت با موفقیت ذخیره شد ✅  
ممنونم ازت که وقت گذاشتی ❤️  
اگر سوالی داشتی یا خواستی اطلاعاتتو تغییر بدی، فقط کافیه دوباره /start بزنی 🌈`
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
    caption: `📦 فایل اطلاعات جدید ذخیره شد ✨\n👤 کاربر: ${data.fullName}`,
  });
}
