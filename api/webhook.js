// DEBUG MODE: SIMPLE ECHO
// Bypassing all libraries to test Vercel execution context.

const TOKEN = process.env.BOT_TOKEN;

export default async function handler(request, response) {
    console.log("--- DEBUG: REQUEST RECEIVED ---");

    try {
        if (!TOKEN) {
            console.error("ERROR: BOT_TOKEN is missing");
            return response.status(500).send("BOT_TOKEN Missing");
        }

        const body = request.body;
        console.log("BODY:", JSON.stringify(body, null, 2));

        if (body && body.message) {
            const chatId = body.message.chat.id;
            const text = "✅ DEBUG: I am alive! Vercel is working.";

            console.log(`Sending message to ${chatId}`);

            // Use raw fetch to bypass library issues
            const telegramUrl = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
            const payload = {
                chat_id: chatId,
                text: text
            };

            const res = await fetch(telegramUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            console.log("Telegram API Response:", JSON.stringify(result));
        }

    } catch (e) {
        console.error("--- DEBUG ERROR ---");
        console.error(e);
        // Do not crash the function, just log it.
    }

    // Always finish 200 OK
    response.status(200).send('OK');
}
