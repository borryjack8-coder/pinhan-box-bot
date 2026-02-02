# Pinhan Box QA Checklist

Use this checklist to verify the bot functions correctly before deployment.

## 1. Start & Gatekeeper
- [ ] Send `/start` command.
- [ ] Verify the "Secret Workshop" welcome message appears.
- [ ] Check buttons: `[✅ Ha, ID bor]` and `[❌ Yo'q, yangi mehmonman]`.
- [ ] Click `[✅ Ha, ID bor]` -> Should ask for code (placeholder).
- [ ] Click `[❌ Yo'q, yangi mehmonman]` -> Should start Survey.

## 2. Survey Flow
- [ ] **Question 1**: "Qaysi shahardansiz?" -> Select "Toshkent".
- [ ] **Question 2**: "Biz haqimizda...?" -> Select "Instagram".
- [ ] **Question 3**: "Sovg'a kim uchun?" -> Select any option.

## 3. The Wheel (Logic & Animation)
- [ ] Verify "🎰 Spinning..." message appears briefly.
- [ ] Verify it changes to "🎉 TABRIKLAYMIZ!" with a prize.
- [ ] **Check Prize**: Ensure the prize text looks correct (e.g., "30% Chegirma...").

## 4. Personalization (Emotional Hook)
- [ ] Verify the bot asks for the "Special for..." banderole name.
- [ ] Type a name (e.g., "Azizam uchun").

## 5. Contact & Admin Report
- [ ] Click `[📞 Raqamimni yuborish]`.
- [ ] **User Side**: Receive "Ma'lumotlaringiz ustaxonaga yuborildi..." confirmation.
- [ ] **Admin Side** (Chat ID 1039318355):
    - [ ] Check if a new message arrived.
    - [ ] Verify format: `💎 YANGI PREMIUM MIJOZ...`
    - [ ] Verify all details (Phone, City, Prize, Custom Name) are correct.

## 6. Stability
- [ ] Check the console window (`test_bot.bat`) for any crash errors.
