const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

// --- CREDENTIALS ---
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN; // e.g., https://my-app.vercel.app

if (!TOKEN) {
    console.error("CRITICAL ERROR: BOT_TOKEN is missing in Environment Variables!");
    process.exit(1);
}

// --- INIT ---
let bot;
if (WEBHOOK_DOMAIN) {
    // VERCEL / SERVERLESS MODE (Webhook)
    bot = new TelegramBot(TOKEN);
    bot.setWebHook(`${WEBHOOK_DOMAIN}/bot${TOKEN}`);
    console.log(`Setting Webhook to: ${WEBHOOK_DOMAIN}/bot${TOKEN}`);
} else {
    // LOCAL MODE (Polling)
    bot = new TelegramBot(TOKEN, { polling: true });
    console.log("Running in Polling Mode (Local)");
}

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parser for Webhooks
app.use(express.json());

// --- ROUTES ---

// 1. Telegram Webhook Endpoint
app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// 2. Serve Static Web App
app.use(express.static('webapp'));
// Explicit index fallback for Vercel static handling if needed
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/webapp/index.html');
});

// --- LOCAL SERVER START (Only for local dev) ---
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running.`);
        console.log(`\n🔥🔥🔥 [INFO] Web App Local URL: http://localhost:${PORT}/index.html 🔥🔥🔥\n`);
    });
}

// Export for Vercel Serverless
module.exports = app;

// --- STATE MANAGER ---
const userSessions = {};
const STATES = { WAITING_FOR_NAME: 'WAITING_FOR_NAME', COMPLETED: 'COMPLETED' };

// --- BOT LOGIC (Shared) ---
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    userSessions[chatId] = { state: 'START', data: { username: msg.from.username || 'NoUser' } };

    bot.sendMessage(chatId, "Pinhan Box Secret Workshop.\n\nSizda Club ID bormi?", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "✅ Ha, ID bor", callback_data: "has_id" }],
                [{ text: "❌ Yo'q, yangi mehmonman", callback_data: "new_guest" }]
            ]
        }
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    if (query.data === 'new_guest') {
        const url = WEBHOOK_DOMAIN ?
            `${WEBHOOK_DOMAIN}/index.html` :
            `http://localhost:${PORT}/index.html`;

        bot.sendMessage(chatId, "Omad Charxpalagini ishga tushiring:", {
            reply_markup: {
                keyboard: [[{ text: "🎰 O'YINNI BOSHLASH", web_app: { url: url } }]],
                resize_keyboard: true
            }
        });
    }
});

// --- HANDLE WEB APP DATA ---
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // 1. Handle DATA from Mini App
    if (msg.web_app_data) {
        try {
            const parsed = JSON.parse(msg.web_app_data.data);
            if (parsed.action === 'claim_prize') {
                if (!userSessions[chatId]) userSessions[chatId] = { data: {} };
                userSessions[chatId].data.prize = parsed.prize;
                userSessions[chatId].state = STATES.WAITING_FOR_NAME;

                bot.sendMessage(chatId, `🎉 YUTUQ QABUL QILINDI: ${parsed.prize}\n\nSovg'a qutisiga qo'shiladigan Maxsus Tabriknomaga (Otkritka) kimning ismini yozib qo'yaylik?`, {
                    reply_markup: { remove_keyboard: true }
                });
            }
        } catch (e) {
            console.error("Data Parse Error", e);
        }
    }

    // 2. Handle Name Input
    if (msg.text && !msg.web_app_data && userSessions[chatId]?.state === STATES.WAITING_FOR_NAME) {
        userSessions[chatId].data.customName = msg.text;
        userSessions[chatId].state = STATES.COMPLETED;

        bot.sendMessage(chatId, "Telefon raqamingizni yuboring:", {
            reply_markup: { keyboard: [[{ text: "📞 Yuborish", request_contact: true }]], resize_keyboard: true }
        });
    }
});

// 3. Handle Contact & Report
bot.on('contact', (msg) => {
    const chatId = msg.chat.id;
    const session = userSessions[chatId];
    if (session && session.data.prize) {
        const report = `💎 WEB APP LEAD:\nUser: ${session.data.username}\nPrize: ${session.data.prize}\n💌 Tabriknoma Ismi: ${session.data.customName}\nPhone: ${msg.contact.phone_number}`;
        bot.sendMessage(ADMIN_CHAT_ID, report);
        bot.sendMessage(chatId, "Rahmat. Menejer tez orada bog'lanadi.", { reply_markup: { remove_keyboard: true } });
    }
});
