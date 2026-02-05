const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');

// --- CONFIG ---
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const MONGO_URI = process.env.MONGO_URI; // Check .env
const WEBHOOK_DOMAIN = process.env.WEBHOOK_DOMAIN;

if (!TOKEN) throw new Error("BOT_TOKEN missing");
if (!MONGO_URI) console.error("WARNING: MONGO_URI is missing. Database features will fail.");

// --- INIT (Singleton) ---
const bot = new TelegramBot(TOKEN);

// --- DATABASE (Connection Caching) ---
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;

    try {
        const client = await MongoClient.connect(MONGO_URI, {
            useNewUrlParser: true, // Legacy options, safe to keep or remove in v4+
            useUnifiedTopology: true
        });
        cachedDb = client.db('pinhan_box'); // Database Name
        return cachedDb;
    } catch (error) {
        console.error("Database Connection Error:", error);
        return null;
    }
}

// --- HANDLER ---
export default async function handler(request, response) {
    try {
        if (request.body) {
            const body = request.body;
            // Process Update manually to await async operations
            // bot.processUpdate(body) is sync-ish for event emitters.
            // We need to parse logic here or let the event listeners handle it.
            // Serverless Issue: Event listeners attached globally might run for *previous* requests if container reused?
            // Safer Pattern: Handle logic directly in the handler or ensure listeners are idempotent.
            // Given node-telegram-bot-api structure, we pass body to it, but we need to ensure the DB connection is ready.

            await connectToDatabase();

            // We handle the update. 
            // Since we can't easily "await" the event listener completion, we might miss the execution window if Vercel kills the process.
            // BUT for simple bots, usually the event loop clears before response.send is effective if we await inside listeners?
            // Actually, best practice for Serverless Bots is to use a framework that supports await, or just handle raw body.
            // Let's stick to the Event Listener pattern but rely on Vercel waiting for promises if we keep the connection alive?
            // No, response.send kills it.
            // FIX: We will parse the body MANUALLY here for critical logical steps to ensure they await.

            const msg = body.message || body.callback_query?.message;
            if (!msg) {
                return response.status(200).send('OK');
            }

            const chatId = msg.chat.id;
            const text = body.message?.text;
            const webAppData = body.message?.web_app_data;

            // 1. START COMMAND
            if (text === '/start') {
                const welcomeText = "Assalomu alaykum! Xush kelibsiz.\n\n<b>Pinhan Box</b> maxsus yutuqli o'yiniga marhamat.\nSovg'ani olish uchun tugmani bosing:";
                await bot.sendMessage(chatId, welcomeText, {
                    parse_mode: 'HTML',
                    reply_markup: {
                        keyboard: [[{
                            text: "🎁 Yutuqni olish",
                            web_app: { url: `${WEBHOOK_DOMAIN}/index.html` }
                        }]],
                        resize_keyboard: true
                    }
                });
            }

            // 2. WEB APP DATA (PRIZE)
            else if (webAppData) {
                try {
                    const data = JSON.parse(webAppData.data);
                    if (data.action === 'claim_prize') {
                        const prize = data.prize;
                        const user = body.message.from;
                        const name = user.first_name + (user.last_name ? ' ' + user.last_name : '');
                        const username = user.username ? `@${user.username}` : 'No Username';

                        // A. Save to DB
                        const db = await connectToDatabase();
                        if (db) {
                            await db.collection('leads').insertOne({
                                userId: user.id,
                                name: name,
                                username: username,
                                prize: prize,
                                date: new Date()
                            });
                        }

                        // B. Contextual Reply to User
                        const replyText = `🎉 <b>Tabriklaymiz!</b>\n\nSiz <b>${prize}</b> yutib oldingiz!\n\n🗓 <i>Bu chegirma 1 oy davomida amal qiladi.</i>\nMenedjerimiz tez orada siz bilan bog'lanadi.`;
                        await bot.sendMessage(chatId, replyText, { parse_mode: 'HTML' });

                        // C. Notify Admin
                        if (ADMIN_CHAT_ID) {
                            const adminMsg = `🔔 <b>Yangi Yutuq!</b>\n👤 User: <a href="tg://user?id=${user.id}">${name}</a> (${username})\n🎁 Yutuq: ${prize}`;
                            await bot.sendMessage(ADMIN_CHAT_ID, adminMsg, { parse_mode: 'HTML' });
                        }
                    }
                } catch (e) {
                    console.error("Web App Data Error:", e);
                }
            }

            // 3. CUSTOMER SUPPORT (Forwarding)
            else if (text && text !== '/start' && !webAppData) {
                if (ADMIN_CHAT_ID) {
                    const user = body.message.from;
                    const forwardText = `📨 <b>Xabar</b>:\nKimdan: ${user.first_name} (@${user.username || '-id-'})\n\n${text}`;
                    await bot.sendMessage(ADMIN_CHAT_ID, forwardText, { parse_mode: 'HTML' });
                }
            }
        }
    } catch (e) {
        console.error("General Handler Error:", e);
    }

    response.status(200).send('OK');
}
