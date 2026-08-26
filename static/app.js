/* =================================
   GK MASTER GAME ENGINE
================================= */

const CATEGORY_INFO = {

    India: {
        emoji: "🇮🇳",
        description: "Indian history, culture & facts"
    },

    World: {
        emoji: "🌎",
        description: "Countries, places & world facts"
    },

    Science: {
        emoji: "🔬",
        description: "Science & discoveries"
    },

    History: {
        emoji: "🏛️",
        description: "Ancient & modern history"
    },

    Sports: {
        emoji: "⚽",
        description: "Sports & games"
    },

    Technology: {
        emoji: "💻",
        description: "Computers & technology"
    },

    Entertainment: {
        emoji: "🎬",
        description: "Movies, books & characters"
    },

    Geography: {
        emoji: "🗺️",
        description: "Earth, countries & maps"
    },

    Economy: {
        emoji: "💰",
        description: "Money & economics"
    },

    General: {
        emoji: "🧩",
        description: "A little bit of everything"
    }

};


/* =================================
   PLAYER
================================= */

let player =
    JSON.parse(localStorage.getItem("gkMasterPlayer")) || {

        xp: 0,
        coins: 0,
        streak: 0,
        bestScore: 0,
        quizzes: 0

    };


/* =================================
   GAME STATE
================================= */

let selectedCategory = "General";

let selectedMode = "classic";

let quizQuestions = [];

let currentQuestion = 0;

let score = 0;

let quizStreak = 0;

let questionAnswered = false;

let timerInterval = null;

let timeLeft = 15;

let infiniteMode = false;


/* =================================
   DOM
================================= */

const screens = {

    home: document.getElementById("homeScreen"),

    category: document.getElementById("categoryScreen"),

    mode: document.getElementById("modeScreen"),

    quiz: document.getElementById("quizScreen"),

    result: document.getElementById("resultScreen"),

    leaderboard: document.getElementById("leaderboardScreen")

};


/* =================================
   SCREEN MANAGEMENT
================================= */

function showScreen(screen) {

    Object.values(screens).forEach(s =>
        s.classList.remove("active")
    );

    screens[screen].classList.add("active");

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


function goHome() {

    stopTimer();

    updateUI();

    showScreen("home");

}


function openCategories() {

    stopTimer();

    renderCategories();

    showScreen("category");

}


function openLeaderboard() {

    renderLeaderboard();

    showScreen("leaderboard");

}


/* =================================
   CATEGORY UI
================================= */

function renderCategories() {

    const container =
        document.getElementById("categoryGrid");

    container.innerHTML = "";

    Object.entries(CATEGORY_INFO).forEach(
        ([category, info]) => {

            const count =
                QUESTIONS.filter(
                    q => q.category === category
                ).length;

            const button =
                document.createElement("button");

            button.className =
                "category-card";

            button.innerHTML = `
                <span class="emoji">${info.emoji}</span>

                <strong>${category}</strong>

                <small>
                    ${count} questions
                </small>
            `;

            button.onclick = () =>
                selectCategory(category);

            container.appendChild(button);

        }
    );

}


/* =================================
   SELECT CATEGORY
================================= */

function selectCategory(category) {

    selectedCategory = category;

    const info =
        CATEGORY_INFO[category];

    document.getElementById(
        "selectedCategory"
    ).textContent = category;

    document.getElementById(
        "selectedEmoji"
    ).textContent = info.emoji;

    showScreen("mode");

}


/* =================================
   START DAILY
================================= */

function startDaily() {

    const categories =
        Object.keys(CATEGORY_INFO);

    const today =
        new Date();

    const dayNumber =
        Math.floor(
            Date.UTC(
                today.getFullYear(),
                today.getMonth(),
                today.getDate()
            ) / 86400000
        );

    selectedCategory =
        categories[
            dayNumber % categories.length
        ];

    startQuiz("classic");

}


/* =================================
   START QUIZ
================================= */

function startQuiz(mode) {

    selectedMode = mode;

    stopTimer();

    score = 0;

    currentQuestion = 0;

    quizStreak = 0;

    questionAnswered = false;

    infiniteMode =
        mode === "infinite";


    let pool =
        QUESTIONS.filter(
            q => q.category === selectedCategory
        );


    /* HARD MODE */

    if (mode === "hard") {

        const hardQuestions =
            pool.filter(
                q => q.difficulty === "hard"
            );

        if (hardQuestions.length >= 10) {
            pool = hardQuestions;
        } else {
            pool = QUESTIONS.filter(
                q =>
                    q.difficulty === "hard"
            );
        }

    }


    /* SHUFFLE */

    pool = shuffle(pool);


    /* CLASSIC / TIMED */

    if (
        mode === "classic" ||
        mode === "timed"
    ) {

        quizQuestions =
            pool.slice(0, 10);

    }

    /* HARD */

    else if (mode === "hard") {

        quizQuestions =
            pool.slice(0, 10);

    }

    /* INFINITE */

    else {

        quizQuestions =
            pool;

    }


    if (quizQuestions.length === 0) {

        alert(
            "Not enough questions available."
        );

        return;

    }


    showScreen("quiz");

    displayQuestion();

}


/* =================================
   DISPLAY QUESTION
================================= */

function displayQuestion() {

    stopTimer();

    questionAnswered = false;

    const question =
        quizQuestions[currentQuestion];


    if (!question) {

        finishQuiz();

        return;

    }


    document.getElementById(
        "questionText"
    ).textContent =
        question.question;


    document.getElementById(
        "questionCategory"
    ).textContent =
        question.category.toUpperCase();


    document.getElementById(
        "difficulty"
    ).textContent =
        question.difficulty.toUpperCase();


    const total =
        quizQuestions.length;


    document.getElementById(
        "questionCounter"
    ).textContent =
        `${currentQuestion + 1} / ${total}`;


    const percentage =
        (currentQuestion / total) * 100;


    document.getElementById(
        "quizProgress"
    ).style.width =
        `${percentage}%`;


    const answers =
        document.getElementById("answers");


    answers.innerHTML = "";


    const shuffledAnswers =
        shuffle(
            [...question.options]
        );


    shuffledAnswers.forEach(
        answer => {

            const button =
                document.createElement("button");

            button.className =
                "answer";

            button.textContent =
                answer;

            button.onclick = () =>
                selectAnswer(
                    button,
                    answer,
                    question
                );

            answers.appendChild(button);

        }
    );


    document.getElementById(
        "nextButton"
    ).disabled = true;


    document.getElementById(
        "quizStreak"
    ).textContent =
        quizStreak;


    if (selectedMode === "timed") {

        startTimer();

    } else {

        document.getElementById(
            "timer"
        ).textContent = "∞";

    }

}


/* =================================
   SELECT ANSWER
================================= */

function selectAnswer(
    button,
    answer,
    question
) {

    if (questionAnswered)
        return;

    questionAnswered = true;

    stopTimer();


    const allAnswers =
        document.querySelectorAll(".answer");


    allAnswers.forEach(
        btn => btn.disabled = true
    );


    if (answer === question.answer) {

        button.classList.add("correct");

        score++;

        quizStreak++;

        player.xp += 10;

        player.coins += 5;

        playSound(true);

    } else {

        button.classList.add("wrong");

        quizStreak = 0;

        playSound(false);


        allAnswers.forEach(
            btn => {

                if (
                    btn.textContent ===
                    question.answer
                ) {

                    btn.classList.add(
                        "correct"
                    );

                }

            }
        );


        if (infiniteMode) {

            setTimeout(
                () => finishQuiz(),
                700
            );

        }

    }


    document.getElementById(
        "quizStreak"
    ).textContent =
        quizStreak;


    document.getElementById(
        "nextButton"
    ).disabled = false;


    savePlayer();

}


/* =================================
   NEXT QUESTION
================================= */

function nextQuestion() {

    if (!questionAnswered)
        return;

    currentQuestion++;

    displayQuestion();

}


/* =================================
   TIMER
================================= */

function startTimer() {

    timeLeft = 15;

    updateTimer();

    timerInterval =
        setInterval(() => {

            timeLeft--;

            updateTimer();


            if (timeLeft <= 0) {

                stopTimer();

                timeExpired();

            }

        }, 1000);

}


function updateTimer() {

    document.getElementById(
        "timer"
    ).textContent =
        `⏱️ ${timeLeft}`;

}


function stopTimer() {

    if (timerInterval) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;

    }

}


/* =================================
   TIME EXPIRED
================================= */

function timeExpired() {

    if (questionAnswered)
        return;

    questionAnswered = true;

    quizStreak = 0;


    const question =
        quizQuestions[currentQuestion];


    document.querySelectorAll(
        ".answer"
    ).forEach(button => {

        button.disabled = true;

        if (
            button.textContent ===
            question.answer
        ) {

            button.classList.add(
                "correct"
            );

        }

    });


    document.getElementById(
        "quizStreak"
    ).textContent =
        quizStreak;


    document.getElementById(
        "nextButton"
    ).disabled = false;

}


/* =================================
   FINISH QUIZ
================================= */

function finishQuiz() {

    stopTimer();

    player.quizzes++;


    const total =
        quizQuestions.length;


    const bonusXP =
        score * 2;


    const bonusCoins =
        Math.floor(score / 2);


    player.xp += bonusXP;

    player.coins += bonusCoins;


    if (
        score >
        player.bestScore
    ) {

        player.bestScore =
            score;

    }


    player.streak =
        quizStreak;


    savePlayer();


    document.getElementById(
        "finalScore"
    ).textContent =
        score;


    document.getElementById(
        "finalTotal"
    ).textContent =
        `/ ${total}`;


    document.getElementById(
        "earnedXP"
    ).textContent =
        score * 10 + bonusXP;


    document.getElementById(
        "earnedCoins"
    ).textContent =
        score * 5 + bonusCoins;


    document.getElementById(
        "resultStreak"
    ).textContent =
        quizStreak;


    let title =
        "Keep going!";


    const percentage =
        (score / total) * 100;


    if (percentage === 100) {

        title =
            "🏆 Perfect Score!";

    }

    else if (percentage >= 80) {

        title =
            "🔥 Excellent!";

    }

    else if (percentage >= 60) {

        title =
            "👏 Great job!";

    }

    else if (percentage >= 40) {

        title =
            "💪 Nice effort!";

    }


    document.getElementById(
        "resultTitle"
    ).textContent =
        title;


    saveLeaderboardScore();

    showScreen("result");

}


/* =================================
   PLAYER STORAGE
================================= */

function savePlayer() {

    localStorage.setItem(
        "gkMasterPlayer",
        JSON.stringify(player)
    );

    updateUI();

}


function updateUI() {

    document.getElementById(
        "xp"
    ).textContent =
        player.xp;


    document.getElementById(
        "coins"
    ).textContent =
        player.coins;


    document.getElementById(
        "streak"
    ).textContent =
        player.streak;


    document.getElementById(
        "bestScore"
    ).textContent =
        player.bestScore;


    const level =
        Math.floor(
            player.xp / 100
        ) + 1;


    const currentXP =
        player.xp % 100;


    document.getElementById(
        "level"
    ).textContent =
        level;


    document.getElementById(
        "currentXP"
    ).textContent =
        currentXP;


    document.getElementById(
        "xpProgress"
    ).style.width =
        `${currentXP}%`;

}


/* =================================
   LEADERBOARD
================================= */

function saveLeaderboardScore() {

    let leaderboard =
        JSON.parse(
            localStorage.getItem(
                "gkMasterLeaderboard"
            )
        ) || [];


    leaderboard.push({

        name: "You",

        score: score,

        category:
            selectedCategory,

        date:
            new Date().toLocaleDateString()

    });


    leaderboard.sort(
        (a, b) =>
            b.score - a.score
    );


    leaderboard =
        leaderboard.slice(0, 20);


    localStorage.setItem(
        "gkMasterLeaderboard",
        JSON.stringify(
            leaderboard
        )
    );

}


function renderLeaderboard() {

    const container =
        document.getElementById(
            "leaderboard"
        );


    let leaderboard =
        JSON.parse(
            localStorage.getItem(
                "gkMasterLeaderboard"
            )
        ) || [];


    container.innerHTML = "";


    if (
        leaderboard.length === 0
    ) {

        container.innerHTML = `
            <div class="question-card">
                <h2>No scores yet.</h2>
                <p class="muted">
                    Play your first quiz!
                </p>
            </div>
        `;

        return;

    }


    leaderboard.forEach(
        (entry, index) => {

            const row =
                document.createElement("div");


            row.className =
                "leader-row";


            if (
                entry.name === "You"
            ) {

                row.classList.add(
                    "you"
                );

            }


            let medal = "";

            if (index === 0)
                medal = "🥇";

            else if (index === 1)
                medal = "🥈";

            else if (index === 2)
                medal = "🥉";


            row.innerHTML = `

                <div class="rank">
                    ${medal || index + 1}
                </div>

                <div class="player-name">
                    <strong>
                        ${escapeHTML(entry.name)}
                    </strong>

                    <small class="muted">
                        ${escapeHTML(entry.category)}
                    </small>
                </div>

                <div class="score">
                    ${entry.score}
                </div>

            `;


            container.appendChild(row);

        }
    );

}


function clearLeaderboard() {

    if (
        !confirm(
            "Reset your leaderboard?"
        )
    )
        return;


    localStorage.removeItem(
        "gkMasterLeaderboard"
    );


    renderLeaderboard();

}


/* =================================
   QUIT QUIZ
================================= */

function quitQuiz() {

    if (
        !confirm(
            "Quit this quiz?"
        )
    )
        return;


    stopTimer();

    goHome();

}


/* =================================
   SHUFFLE
================================= */

function shuffle(array) {

    for (
        let i = array.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() * (i + 1)
            );


        [
            array[i],
            array[j]
        ] =
        [
            array[j],
            array[i]
        ];

    }

    return array;

}


/* =================================
   SIMPLE SOUND
================================= */

function playSound(correct) {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext)
            return;


        const audio =
            new AudioContext();


        const oscillator =
            audio.createOscillator();


        const gain =
            audio.createGain();


        oscillator.connect(gain);

        gain.connect(
            audio.destination
        );


        oscillator.frequency.value =
            correct ? 700 : 180;


        gain.gain.value =
            0.04;


        oscillator.start();


        oscillator.stop(
            audio.currentTime + 0.12
        );

    }

    catch (error) {

        console.log(
            "Sound unavailable."
        );

    }

}


/* =================================
   SECURITY HELPER
================================= */

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =================================
   START APP
================================= */

renderCategories();

updateUI();

showScreen("home");
