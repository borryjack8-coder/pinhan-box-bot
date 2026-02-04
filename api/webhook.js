const TelegramBot = require('node-telegram-bot-api');

// --- CONFIG ---
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;

if (!TOKEN) throw new Error("BOT_TOKEN missing");

// --- INIT (Singleton pattern for Serverless) ---
// Note: In serverless, global vars *might* persist between hot invocations.
const bot = new TelegramBot(TOKEN);

// --- STATE (In-Memory) ---
// WARNING: In serverless, this state will be lost on cold starts.
// For production, use Redis/MongoDB. For MVP, this relies on Vercel container reuse.
const userSessions = {};
const STATES = { WAITING_FOR_NAME: 'WAITING_FOR_NAME', COMPLETED: 'COMPLETED' };

// --- LOGIC SETUP ---
// We attach listeners only once to avoid duplicates on re-use?
// Actually, node-telegram-bot-api listeners are attached to the bot instance.
// If the bot instance is global, we need to ensure we don't re-attach listeners every request.
// A simple check: if bot.has_listeners, skip. But 'has_listeners' isn't standard property.
// Better strategy: Attach them. If container is reused, they persist.
// But if we re-execute this file, does it re-run?
// Vercel caches the *module*. So top-level code runs once per cold start.
// So attaching listeners at top level is correct.

// --- BOT EVENT LISTENERS ---

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
        // Fallback for Web App URL
        const url = WEBHOOK_DOMAIN ?
            `${WEBHOOK_DOMAIN}/index.html` :
            `https://pinhan-box-bot.vercel.app/index.html`;

        bot.sendMessage(chatId, "Omad Charxpalagini ishga tushiring:", {
            reply_markup: {
                keyboard: [[{ text: "🎰 O'YINNI BOSHLASH", web_app: { url: url } }]],
                resize_keyboard: true
            }
        });
    }
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // 1. DATA from Web App
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
            console.error("Parse Error", e);
        }
    }

    // 2. Name Input
    if (msg.text && !msg.web_app_data && userSessions[chatId]?.state === STATES.WAITING_FOR_NAME) {
        userSessions[chatId].data.customName = msg.text;
        userSessions[chatId].state = STATES.COMPLETED;

        bot.sendMessage(chatId, "Telefon raqamingizni yuboring:", {
            reply_markup: { keyboard: [[{ text: "📞 Yuborish", request_contact: true }]], resize_keyboard: true }
        });
    }
});

bot.on('contact', (msg) => {
    const chatId = msg.chat.id;
    const session = userSessions[chatId];
    if (session && session.data.prize) {
        const report = `💎 WEB APP LEAD:\nUser: ${session.data.username}\nPrize: ${session.data.prize}\n💌 Tabriknoma Ismi: ${session.data.customName}\nPhone: ${msg.contact.phone_number}`;
        bot.sendMessage(ADMIN_CHAT_ID, report);
        bot.sendMessage(chatId, "Rahmat. Menejer tez orada bog'lanadi.", { reply_markup: { remove_keyboard: true } });
    }
});

// --- VERCEL ENTRY POINT ---
export default async function handler(request, response) {
    try {
        if (request.body) {
            // Process Telegram Update
            bot.processUpdate(request.body);
        }
    } catch (e) {
        console.error("Error processing update", e);
    }

    // Always return 200 to telegram to acknowledge receipt
    response.status(200).send('OK');
}
