// =========================================
// THE SYSTEM
// V0.1
// =========================================


// =========================================
// SYSTEM CLOCK
// =========================================

function updateClock() {

    const now = new Date();

    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    document.getElementById("systemTime").textContent =
        `${hours}:${minutes}:${seconds}`;
}

setInterval(updateClock, 1000);

updateClock();


// =========================================
// PLAYER DATA
// =========================================

const player = {

    level: 27,

    xp: 8200,

    xpRequired: 10000,

    completedQuests: 0

};

const testPlayer = {

    STR: {
        pushups: 20,
        pullups: 3,
        squats: 40,
        plankSeconds: 60
    },

    INT: {
        academicAccuracy: 85,
        problemSolvingAccuracy: 80,
        recallAccuracy: 90,
        learningSpeed: 1
    },

    DIS: {
        tasksPlanned: 10,
        tasksCompleted: 8,
        consistencyPercent: 80,
        followThroughPercent: 85
    },

    AGI: {
        reactionPerformance: 1,
        balanceSeconds: 40,
        coordinationAccuracy: 80,
        movementPerformance: 1
    },

    VIT: {
        endurancePerformance: 1,
        activityConsistency: 80,
        sleepConsistency: 80,
        recoveryScore: 80
    },

    SKL: {
        skillMastery: 70,
        skillDifficulty: 60,
        projectsCompleted: 4,
        skillsDemonstrated: 3
    },

    CHA: {
        speakingScore: 70,
        writingScore: 80,
        listeningScore: 75,
        presentationScore: 65
    }

};


const result =
    ProgressionEngine.calculateProgression(
        testPlayer
    );

console.log("===== SYSTEM PROGRESSION =====");

console.log(result);
// =========================================
// UPDATE PLAYER UI
// =========================================

function updatePlayerUI() {

    document.getElementById("level").textContent =
        player.level;

    document.getElementById("xpText").textContent =
        `${player.xp} / ${player.xpRequired}`;

    const percentage =
        (player.xp / player.xpRequired) * 100;

    document.getElementById("xpFill").style.width =
        `${percentage}%`;

}


// =========================================
// ADD XP
// =========================================

function addXP(amount) {

    player.xp += amount;

    checkLevelUp();

    updatePlayerUI();

}


// =========================================
// LEVEL UP
// =========================================

function checkLevelUp() {

    while (player.xp >= player.xpRequired) {

        player.xp -= player.xpRequired;

        player.level++;

        player.xpRequired =
            Math.floor(player.xpRequired * 1.15);

        showSystemMessage(
            `LEVEL UP — LEVEL ${player.level}`
        );

    }

}


// =========================================
// QUEST COMPLETION
// =========================================

document.querySelectorAll(".complete-btn")
    .forEach(button => {

        button.addEventListener("click", () => {

            const quest =
                button.closest(".quest");

            const xp =
                Number(quest.dataset.xp);

            if (quest.classList.contains("completed")) {
                return;
            }

            quest.classList.add("completed");

            button.textContent = "COMPLETED";

            button.disabled = true;

            player.completedQuests++;

            addXP(xp);

            updateQuestCounter();

        });

    });


// =========================================
// QUEST COUNTER
// =========================================

function updateQuestCounter() {

    const counter =
        document.querySelector(".quest-count");

    counter.textContent =
        `${player.completedQuests} / 3`;

}


// =========================================
// SYSTEM MESSAGE
// =========================================

function showSystemMessage(message) {

    console.log(
        `[SYSTEM] ${message}`
    );

}


// =========================================
// INITIALIZE
// =========================================

updatePlayerUI();

updateQuestCounter();

console.log("SYSTEM INITIALIZED.");
