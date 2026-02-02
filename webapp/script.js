document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing Pinhan App...");

    // Initialize Telegram WebApp
    const tg = window.Telegram.webapp;
    tg.expand();

    // --- PRIZE CONFIGURATION (EXACT WEIGHTS) ---
    const PRIZES = [
        { name: "30% Chegirma + Aroma Magic 🌸", weight: 30, color: "#800020" }, // Burgundy
        { name: "35% Chegirma + Abadiy Xotira ☁️", weight: 25, color: "#DAA520" }, // Gold
        { name: "40% Chegirma + VIP Status 🚀", weight: 20, color: "#800020" },
        { name: "50% Chegirma + NFC Smart Tag 📲", weight: 15, color: "#DAA520" },
        { name: "60% Chegirma + Sweet Compliment 🍫", weight: 9, color: "#800020" },
        { name: "90% JEKPOT 🔥", weight: 1, color: "#FFD700" }  // Bright Gold
    ];

    // --- ELEMENTS ---
    const screenGatekeeper = document.getElementById('screen-gatekeeper');
    const screenWheel = document.getElementById('screen-wheel');
    const btnEnter = document.getElementById('btn-enter');
    const btnSpin = document.getElementById('btn-spin');
    const btnClaim = document.getElementById('btn-claim');
    const modalResult = document.getElementById('modal-result');
    const resultText = document.getElementById('result-prize');
    const wheelElement = document.getElementById('wheel');
    const canvas = document.getElementById('wheelCanvas');

    // Ensure initial state
    if (screenGatekeeper) screenGatekeeper.style.display = 'flex';
    if (screenWheel) screenWheel.style.display = 'none';

    // --- GATEKEEPER LOGIC (THE FIX) ---
    if (btnEnter) {
        btnEnter.addEventListener('click', () => {
            console.log("Enter Button Clicked");

            // Explicit Display Switching as requested
            if (screenGatekeeper) screenGatekeeper.style.display = 'none';
            if (screenWheel) {
                screenWheel.style.display = 'flex';
                screenWheel.classList.add('active'); // Maintain opacity transition
            }

            // Draw immediately
            drawWheel();
        });
    } else {
        console.error("Enter button not found!");
    }

    // --- WHEEL DRAWING ---
    function drawWheel() {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const radius = canvas.width / 2;

        let startAngle = 0;
        const totalWeight = PRIZES.reduce((a, b) => a + b.weight, 0);

        PRIZES.forEach(prize => {
            // Calculate Angle based on weight
            const sliceAngle = (prize.weight / totalWeight) * 2 * Math.PI;

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();

            ctx.fillStyle = prize.color;
            ctx.fill();
            ctx.stroke();

            // Draw Text (Only if slice is big enough)
            if (prize.weight > 2) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.rotate(startAngle + sliceAngle / 2);
                ctx.textAlign = "right";
                ctx.fillStyle = (prize.color === "#DAA520" || prize.color === "#FFD700") ? "#330000" : "#FFF";
                ctx.font = "bold 20px Cinzel";
                ctx.fillText(prize.name.substring(0, 4), radius - 30, 8);
                ctx.restore();
            }

            startAngle += sliceAngle;
        });
    }

    // --- SPIN LOGIC ---
    let isSpinning = false;

    if (btnSpin) {
        btnSpin.addEventListener('click', () => {
            if (isSpinning) return;
            isSpinning = true;
            console.log("Spinning...");

            // 1. SELECT PRIZE (Weighted Random)
            const totalWeight = PRIZES.reduce((a, b) => a + b.weight, 0);
            let random = Math.random() * totalWeight;
            let selectedIndex = 0;

            for (let i = 0; i < PRIZES.length; i++) {
                random -= PRIZES[i].weight;
                if (random < 0) {
                    selectedIndex = i;
                    break;
                }
            }

            const prize = PRIZES[selectedIndex];
            console.log("Selected Prize:", prize.name);

            // 2. CALCULATE ROTATION
            let angleSoFar = 0;
            for (let i = 0; i < selectedIndex; i++) {
                angleSoFar += (PRIZES[i].weight / totalWeight) * 360;
            }
            const mySliceSize = (prize.weight / totalWeight) * 360;
            const myCenter = angleSoFar + (mySliceSize / 2);

            const spins = 3600;
            const targetRotation = spins + (270 - myCenter);

            if (wheelElement) wheelElement.style.transform = `rotate(${targetRotation}deg)`;

            // 3. SHOW RESULT
            setTimeout(() => {
                showResult(prize.name);
            }, 5000);
        });
    }

    function showResult(text) {
        if (resultText) resultText.innerText = text;
        if (modalResult) modalResult.classList.add('open');
        triggerConfetti();
    }

    // --- CLAIM PRIZE ---
    if (btnClaim) {
        btnClaim.addEventListener('click', () => {
            console.log("Claiming Prize:", resultText.innerText);
            const data = JSON.stringify({
                action: 'claim_prize',
                prize: resultText.innerText
            });

            if (window.Telegram.WebApp) {
                window.Telegram.WebApp.sendData(data);
            }
        });
    }

    // --- CONFETTI (Placeholder) ---
    function triggerConfetti() {
        const cvs = document.getElementById('confetti-canvas');
        if (cvs) {
            const ctx = cvs.getContext('2d');
            cvs.width = window.innerWidth;
            cvs.height = window.innerHeight;
            // Simple Confetti
            const particles = [];
            for (let i = 0; i < 50; i++) particles.push({ x: Math.random() * cvs.width, y: Math.random() * cvs.height, dy: 3, color: '#FFD700' });
            function draw() {
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                particles.forEach(p => {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y += p.dy, 5, 5);
                    if (p.y > cvs.height) p.y = 0;
                });
                requestAnimationFrame(draw);
            }
            draw();
        }
    }
});
