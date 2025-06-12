document.addEventListener('DOMContentLoaded', () => {
    // Elemen DOM
    const body = document.body;
    const clockElement = document.getElementById('clock');
    const calendarElement = document.getElementById('calendar');
    const themeLightButton = document.getElementById('theme-light');
    const themeDarkButton = document.getElementById('theme-dark');
    const themeAnimatedButton = document.getElementById('theme-animated');

    const startScreen = document.getElementById('start-screen');
    const playerNameInput = document.getElementById('player-name');
    const timerToggle = document.getElementById('timer-toggle');
    const timerDurationInput = document.getElementById('timer-duration');
    const startButton = document.getElementById('start-button');

    const questionScreen = document.getElementById('question-screen');
    const levelDisplay = document.getElementById('level-display');
    const scoreDisplay = document.getElementById('score-display');
    const questionTimerDisplay = document.getElementById('question-timer');
    const timeLeftDisplay = document.getElementById('time-left');
    const questionTextElement = document.getElementById('question-text');
    const answerInput = document.getElementById('answer-input');
    const submitAnswerButton = document.getElementById('submit-answer');
    const giveUpButton = document.getElementById('give-up-button');
    const feedbackElement = document.getElementById('feedback');

    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreElement = document.getElementById('final-score');
    const answerHistoryList = document.getElementById('answer-history-list');
    const restartButton = document.getElementById('restart-button');

    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const leaderboardTableBody = document.getElementById('leaderboard-table').getElementsByTagName('tbody')[0];
    const clearLeaderboardButton = document.getElementById('clear-leaderboard');
    const showLeaderboardButton = document.getElementById('show-leaderboard');
    const backToStartButton = document.getElementById('back-to-start');

    // Audio
    const correctSound = document.getElementById('correct-sound');
    const wrongSound = document.getElementById('wrong-sound');
    const clickSound = document.getElementById('click-sound');

    // Variabel Game
    let currentLevel = 1;
    let score = 0;
    let questionsPerLevel = 10;
    let currentQuestionInLevel = 0;
    let currentQuestion = {};
    let answerHistory = [];
    let playerName = "Pemain";
    let useTimer = false;
    let timerDuration = 10;
    let countdownTimer;
    let leaderboard = JSON.parse(localStorage.getItem('mathGameLeaderboard')) || [];

    // --- Fungsi Utilitas ---
    function playSound(sound) {
        sound.currentTime = 0;
        sound.play().catch(error => console.log("Error playing sound:", error)); // Handle autoplay policy
    }

    function updateClockAndCalendar() {
        const now = new Date();
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        clockElement.textContent = now.toLocaleTimeString('id-ID', timeOptions);
        calendarElement.textContent = now.toLocaleDateString('id-ID', dateOptions);
    }
    setInterval(updateClockAndCalendar, 1000);
    updateClockAndCalendar(); // Panggil sekali saat load

    // --- Tema ---
    function setTheme(themeName) {
        playSound(clickSound);
        body.setAttribute('data-theme', themeName);
        localStorage.setItem('mathGameTheme', themeName);
    }
    themeLightButton.addEventListener('click', () => setTheme('light'));
    themeDarkButton.addEventListener('click', () => setTheme('dark'));
    themeAnimatedButton.addEventListener('click', () => setTheme('animated'));
    // Load tema dari local storage
    const savedTheme = localStorage.getItem('mathGameTheme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
    }

    // --- Pengaturan Timer ---
    timerToggle.addEventListener('change', () => {
        timerDurationInput.disabled = !timerToggle.checked;
        useTimer = timerToggle.checked;
    });

    // --- Validasi Nama Pemain ---
    playerNameInput.addEventListener('input', () => {
        playerNameInput.value = playerNameInput.value.replace(/[^a-zA-Z0-9 ]/g, ''); // Hanya alphanumeric dan spasi
    });

    // --- Logika Game ---
    function generateQuestion() {
        let num1, num2, operator, correctAnswer;
        const difficulty = Math.ceil(currentLevel / 2); // Tingkat kesulitan meningkat setiap 2 level

        // Operator dasar untuk level awal
        if (currentLevel <= 3) {
            operator = ['+', '-'][Math.floor(Math.random() * 2)];
        } else if (currentLevel <= 6) {
            operator = ['+', '-', '*'][Math.floor(Math.random() * 3)];
        } else {
            operator = ['+', '-', '*', '/'][Math.floor(Math.random() * 4)];
        }

        switch (operator) {
            case '+':
                num1 = Math.floor(Math.random() * (10 * difficulty)) + 1;
                num2 = Math.floor(Math.random() * (10 * difficulty)) + 1;
                correctAnswer = num1 + num2;
                break;
            case '-':
                num1 = Math.floor(Math.random() * (10 * difficulty)) + 5; // Pastikan num1 cukup besar
                num2 = Math.floor(Math.random() * (num1 -1)) + 1; // num2 lebih kecil dari num1
                correctAnswer = num1 - num2;
                break;
            case '*':
                num1 = Math.floor(Math.random() * (5 * difficulty)) + 1;
                num2 = Math.floor(Math.random() * (5 * difficulty)) + 1;
                correctAnswer = num1 * num2;
                break;
            case '/':
                // Pastikan hasil bagi adalah bilangan bulat
                correctAnswer = Math.floor(Math.random() * (3 * difficulty)) + 1;
                num2 = Math.floor(Math.random() * (3 * difficulty)) + 1;
                if (num2 === 0) num2 = 1; // Hindari pembagian dengan nol
                num1 = correctAnswer * num2;
                break;
        }
        return { text: `${num1} ${operator} ${num2} = ?`, answer: correctAnswer, num1, operator, num2 };
    }

    function displayQuestion() {
        questionScreen.classList.remove('fade-out');
        questionScreen.classList.add('fade-in');

        currentQuestion = generateQuestion();
        questionTextElement.textContent = currentQuestion.text;
        answerInput.value = '';
        answerInput.focus();
        levelDisplay.textContent = `Level: ${currentLevel}`;
        scoreDisplay.textContent = `Skor: ${score}`;
        feedbackElement.textContent = '';
        feedbackElement.className = 'feedback'; // Reset kelas feedback

        if (useTimer) {
            questionTimerDisplay.classList.remove('hidden');
            timerDuration = parseInt(timerDurationInput.value) || 10;
            timeLeftDisplay.textContent = timerDuration;
            startCountdown();
        } else {
            questionTimerDisplay.classList.add('hidden');
        }
    }

    function startCountdown() {
        clearInterval(countdownTimer);
        let timeLeft = timerDuration;
        countdownTimer = setInterval(() => {
            timeLeft--;
            timeLeftDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdownTimer);
                feedbackElement.textContent = "Waktu Habis!";
                feedbackElement.classList.add('wrong');
                playSound(wrongSound);
                setTimeout(gameOver, 1500);
            }
        }, 1000);
    }

    function checkAnswer() {
        clearInterval(countdownTimer); // Hentikan timer jika ada
        const userAnswer = parseInt(answerInput.value);
        const correctAnswer = currentQuestion.answer;
        const isCorrect = userAnswer === correctAnswer;

        answerHistory.push({
            question: currentQuestion.text,
            userAnswer: userAnswer || "Tidak dijawab",
            correctAnswer: correctAnswer,
            isCorrect: isCorrect
        });

        if (isCorrect) {
            score += 10 * currentLevel; // Skor berdasarkan level
            feedbackElement.textContent = "Benar!";
            feedbackElement.classList.add('correct');
            playSound(correctSound);
            // Animasi jawaban benar (bisa ditambahkan di CSS)
            document.getElementById('question-container').classList.add('correct-answer-animation');
            setTimeout(() => {
                 document.getElementById('question-container').classList.remove('correct-answer-animation');
            }, 500);


            currentQuestionInLevel++;
            if (currentQuestionInLevel >= questionsPerLevel) {
                levelUp();
            } else {
                setTimeout(() => {
                    questionScreen.classList.add('fade-out');
                    setTimeout(displayQuestion, 500); // Waktu untuk transisi fade-out
                }, 1000);
            }
        } else {
            feedbackElement.textContent = `Salah! Jawaban yang benar: ${correctAnswer}`;
            feedbackElement.classList.add('wrong');
            playSound(wrongSound);
             // Animasi jawaban salah
            document.getElementById('question-container').classList.add('wrong-answer-animation');
            setTimeout(() => {
                 document.getElementById('question-container').classList.remove('wrong-answer-animation');
            }, 500); // Goyang
            setTimeout(gameOver, 2000);
        }
        updateDisplays();
    }

    function levelUp() {
        currentLevel++;
        currentQuestionInLevel = 0;
        playSound(clickSound); // Atau suara level up khusus
        showLevelUpAnimation();
        setTimeout(() => {
            questionScreen.classList.add('fade-out');
            setTimeout(displayQuestion, 500);
        }, 1500); // Tunggu animasi level up selesai
    }

    function showLevelUpAnimation() {
        const levelUpDiv = document.createElement('div');
        levelUpDiv.textContent = `Level Up! Ke Level ${currentLevel}`;
        levelUpDiv.className = 'level-up-animation';
        document.body.appendChild(levelUpDiv);
        setTimeout(() => {
            document.body.removeChild(levelUpDiv);
        }, 1500); // Durasi animasi
    }

    function gameOver() {
        playSound(wrongSound); // Suara game over
        clearInterval(countdownTimer);
        finalScoreElement.textContent = `Skor Akhir Anda: ${score}`;
        displayAnswerHistory();
        updateLeaderboard();

        questionScreen.classList.add('hidden');
        gameOverScreen.classList.remove('hidden');
        startScreen.classList.add('hidden');
        leaderboardScreen.classList.add('hidden');
    }

    function displayAnswerHistory() {
        answerHistoryList.innerHTML = ''; // Kosongkan list sebelumnya
        answerHistory.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.question} Jawabanmu: ${item.userAnswer}. Benar: ${item.correctAnswer}. (${item.isCorrect ? 'Benar' : 'Salah'})`;
            li.style.color = item.isCorrect ? 'green' : 'red';
            answerHistoryList.appendChild(li);
        });
    }

    function updateDisplays() {
        levelDisplay.textContent = `Level: ${currentLevel}`;
        scoreDisplay.textContent = `Skor: ${score}`;
    }

    function resetGame() {
        currentLevel = 1;
        score = 0;
        currentQuestionInLevel = 0;
        answerHistory = [];
        feedbackElement.textContent = '';
        feedbackElement.className = 'feedback';
        answerInput.value = '';
        if(useTimer) timerDuration = parseInt(timerDurationInput.value) || 10;

        gameOverScreen.classList.add('hidden');
        leaderboardScreen.classList.add('hidden');
        questionScreen.classList.add('hidden'); // Sembunyikan layar pertanyaan jika masih terlihat
        startScreen.classList.remove('hidden');
        playerNameInput.focus();
    }

    // --- Leaderboard ---
    function updateLeaderboard() {
        const now = new Date();
        leaderboard.push({
            name: playerName,
            score: score,
            date: now.toLocaleString('id-ID')
        });
        // Urutkan leaderboard berdasarkan skor (tertinggi dulu)
        leaderboard.sort((a, b) => b.score - a.score);
        // Batasi jumlah entri di leaderboard (misal, 10 teratas)
        leaderboard = leaderboard.slice(0, 10);
        localStorage.setItem('mathGameLeaderboard', JSON.stringify(leaderboard));
        displayLeaderboard();
    }

    function displayLeaderboard() {
        leaderboardTableBody.innerHTML = ''; // Kosongkan tabel
        if (leaderboard.length === 0) {
            const row = leaderboardTableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 4;
            cell.textContent = "Belum ada data di papan peringkat.";
            cell.style.textAlign = "center";
        } else {
            leaderboard.forEach((entry, index) => {
                const row = leaderboardTableBody.insertRow();
                row.insertCell().textContent = index + 1;
                row.insertCell().textContent = entry.name;
                row.insertCell().textContent = entry.score;
                row.insertCell().textContent = entry.date;
            });
        }
    }

    function clearLeaderboard() {
        playSound(clickSound);
        if (confirm("Apakah Anda yakin ingin menghapus semua data papan peringkat?")) {
            leaderboard = [];
            localStorage.removeItem('mathGameLeaderboard');
            displayLeaderboard();
        }
    }

    // --- Event Listeners ---
    startButton.addEventListener('click', () => {
        playSound(clickSound);
        playerName = playerNameInput.value.trim() || "Pemain";
        if (playerName.length === 0) { // Validasi dasar jika hanya spasi
            alert("Nama tidak boleh kosong atau hanya spasi.");
            return;
        }
        useTimer = timerToggle.checked;
        if(useTimer) timerDuration = parseInt(timerDurationInput.value) || 10;

        startScreen.classList.add('hidden');
        questionScreen.classList.remove('hidden');
        displayQuestion();
    });

    submitAnswerButton.addEventListener('click', () => {
        playSound(clickSound);
        if (answerInput.value.trim() === '') {
            feedbackElement.textContent = "Silakan masukkan jawaban!";
            feedbackElement.classList.add('wrong'); // Atau kelas warning
            return;
        }
        checkAnswer();
    });

    answerInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            playSound(clickSound);
            if (answerInput.value.trim() === '') {
                feedbackElement.textContent = "Silakan masukkan jawaban!";
                feedbackElement.classList.add('wrong');
                return;
            }
            checkAnswer();
        }
    });

    giveUpButton.addEventListener('click', () => {
        playSound(clickSound);
        gameOver();
    });

    restartButton.addEventListener('click', () => {
        playSound(clickSound);
        resetGame();
    });

    showLeaderboardButton.addEventListener('click', () => {
        playSound(clickSound);
        displayLeaderboard();
        startScreen.classList.add('hidden');
        questionScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        leaderboardScreen.classList.remove('hidden');
    });

    clearLeaderboardButton.addEventListener('click', clearLeaderboard);

    backToStartButton.addEventListener('click', () => {
        playSound(clickSound);
        leaderboardScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    });


    // Inisialisasi awal
    displayLeaderboard(); // Tampilkan leaderboard saat load jika ada data
    resetGame(); // Mulai dari layar awal
});

// CSS Tambahan untuk animasi jawaban (bisa dimasukkan ke style.css)
/*
.correct-answer-animation {
    animation: pulseGreen 0.5s;
}
@keyframes pulseGreen {
    0% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(76, 175, 80, 0); }
    100% { box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
}

.wrong-answer-animation {
    animation: shakeRed 0.5s;
}
@keyframes shakeRed {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
}
*/