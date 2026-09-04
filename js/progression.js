/* =========================================================
   LIFE SYSTEM — PROGRESSION ENGINE v0.1
   ---------------------------------------------------------
   RAW MEASUREMENTS
        ↓
   VALIDATION
        ↓
   NORMALIZATION
        ↓
   COMPONENT SCORES
        ↓
   STAT SCORE
        ↓
   STAT XP
        ↓
   OVERALL SCORE
        ↓
   OVERALL XP
        ↓
   LEVEL + RANK
   ========================================================= */


/* =========================================================
   CONFIGURATION
   ========================================================= */

const PROGRESSION_CONFIG = {

    // Maximum meaningful score for an individual component
    MAX_COMPONENT_SCORE: 1000,

    // Maximum stat score
    MAX_STAT_SCORE: 1000,

    // XP needed for each overall level.
    // Level n requires this much total XP.
    LEVEL_BASE_XP: 100,

    // How strongly improvement contributes to XP
    IMPROVEMENT_WEIGHT: 0.65,

    // How strongly consistency contributes to XP
    CONSISTENCY_WEIGHT: 0.35,

    // Overall stat weights
    STAT_WEIGHTS: {
        STR: 1.00,
        VIT: 1.00,
        AGI: 0.90,
        INT: 1.10,
        DIS: 1.10,
        SKL: 1.00,
        CHA: 0.80
    },

    RANKS: [
        {
            rank: "E",
            minXP: 0,
            minScore: 0
        },
        {
            rank: "D",
            minXP: 1000,
            minScore: 100
        },
        {
            rank: "C",
            minXP: 5000,
            minScore: 250
        },
        {
            rank: "B",
            minXP: 15000,
            minScore: 450
        },
        {
            rank: "A",
            minXP: 40000,
            minScore: 650
        },
        {
            rank: "S",
            minXP: 100000,
            minScore: 850
        }
    ]
};


/* =========================================================
   SAFETY / INPUT VALIDATION
   ========================================================= */

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}


function safeNumber(value, fallback = 0) {

    const number = Number(value);

    if (!Number.isFinite(number)) {
        return fallback;
    }

    return number;
}


/* =========================================================
   NORMALIZATION
   =========================================================

   Converts a real-world measurement into a 0–1000 score.

   Instead of:

       score = current / benchmark

   we use a saturating curve.

   This means:

       5 → 10     matters a lot

       50 → 55    matters somewhat

       150 → 155  matters much less

   This prevents endless grinding of tiny improvements.
   ========================================================= */

function normalize(value, benchmark) {

    value = Math.max(0, safeNumber(value));
    benchmark = Math.max(0.0001, safeNumber(benchmark, 1));

    const ratio = value / benchmark;

    const score =
        1000 * (1 - Math.exp(-ratio));

    return clamp(score, 0, 1000);
}


/* =========================================================
   INVERSE NORMALIZATION
   Useful later when displaying progression targets.
   ========================================================= */

function scoreToMeasurement(score, benchmark) {

    score = clamp(safeNumber(score), 0, 999.999);
    benchmark = Math.max(0.0001, safeNumber(benchmark, 1));

    const normalized = score / 1000;

    return -Math.log(1 - normalized) * benchmark;
}


/* =========================================================
   WEIGHTED AVERAGE
   ========================================================= */

function weightedAverage(components) {

    let total = 0;
    let weightTotal = 0;

    for (const component of components) {

        const value = safeNumber(component.score);
        const weight = Math.max(
            0,
            safeNumber(component.weight, 1)
        );

        total += value * weight;
        weightTotal += weight;
    }

    if (weightTotal === 0) {
        return 0;
    }

    return total / weightTotal;
}


/* =========================================================
   STR ENGINE
   =========================================================

   Current V0.1 measurements:

   Push-ups
   Pull-ups
   Squats
   Plank

   Benchmarks are calibration values, NOT biological ideals.
   They should eventually be replaced with age/experience-
   appropriate benchmark profiles.
   ========================================================= */

function calculateSTR(data) {

    const components = [

        {
            name: "Push-ups",
            score: normalize(data.pushups, 30),
            weight: 0.30
        },

        {
            name: "Pull-ups",
            score: normalize(data.pullups, 10),
            weight: 0.30
        },

        {
            name: "Squats",
            score: normalize(data.squats, 50),
            weight: 0.20
        },

        {
            name: "Core",
            score: normalize(data.plankSeconds, 120),
            weight: 0.20
        }

    ];

    const score = weightedAverage(components);

    return {
        score: Math.round(score),
        components
    };
}


/* =========================================================
   INT ENGINE
   =========================================================

   Intelligence is NOT simply "hours studied".

   V0.1:

   Academic accuracy
   Problem solving
   Recall
   Learning speed
   ========================================================= */

function calculateINT(data) {

    const components = [

        {
            name: "Academic Accuracy",
            score: clamp(
                safeNumber(data.academicAccuracy) * 10,
                0,
                1000
            ),
            weight: 0.35
        },

        {
            name: "Problem Solving",
            score: clamp(
                safeNumber(data.problemSolvingAccuracy) * 10,
                0,
                1000
            ),
            weight: 0.25
        },

        {
            name: "Recall",
            score: clamp(
                safeNumber(data.recallAccuracy) * 10,
                0,
                1000
            ),
            weight: 0.20
        },

        {
            name: "Learning Speed",
            score: normalize(
                data.learningSpeed,
                1
            ),
            weight: 0.20
        }

    ];

    return {
        score: Math.round(weightedAverage(components)),
        components
    };
}


/* =========================================================
   DIS ENGINE
   =========================================================

   Discipline is measured through execution.

   Planned tasks
   Completed tasks
   Follow-through
   Consistency
   ========================================================= */

function calculateDIS(data) {

    const planned = Math.max(
        1,
        safeNumber(data.tasksPlanned)
    );

    const completed = clamp(
        safeNumber(data.tasksCompleted),
        0,
        planned
    );

    const executionRate =
        completed / planned;

    const executionScore =
        executionRate * 1000;

    const consistencyScore =
        clamp(
            safeNumber(data.consistencyPercent) * 10,
            0,
            1000
        );

    const followThroughScore =
        clamp(
            safeNumber(data.followThroughPercent) * 10,
            0,
            1000
        );

    const components = [

        {
            name: "Execution",
            score: executionScore,
            weight: 0.45
        },

        {
            name: "Consistency",
            score: consistencyScore,
            weight: 0.30
        },

        {
            name: "Follow Through",
            score: followThroughScore,
            weight: 0.25
        }

    ];

    return {
        score: Math.round(weightedAverage(components)),
        components
    };
}


/* =========================================================
   AGI ENGINE
   ========================================================= */

function calculateAGI(data) {

    const components = [

        {
            name: "Reaction",
            score: normalize(
                data.reactionPerformance,
                1
            ),
            weight: 0.30
        },

        {
            name: "Balance",
            score: normalize(
                data.balanceSeconds,
                60
            ),
            weight: 0.20
        },

        {
            name: "Coordination",
            score: clamp(
                safeNumber(data.coordinationAccuracy) * 10,
                0,
                1000
            ),
            weight: 0.30
        },

        {
            name: "Movement",
            score: normalize(
                data.movementPerformance,
                1
            ),
            weight: 0.20
        }

    ];

    return {
        score: Math.round(weightedAverage(components)),
        components
    };
}


/* =========================================================
   VIT ENGINE
   ========================================================= */

function calculateVIT(data) {

    const components = [

        {
            name: "Endurance",
            score: normalize(
                data.endurancePerformance,
                1
            ),
            weight: 0.35
        },

        {
            name: "Activity Consistency",
            score: clamp(
                safeNumber(data.activityConsistency) * 10,
                0,
                1000
            ),
            weight: 0.25
        },

        {
            name: "Sleep Consistency",
            score: clamp(
                safeNumber(data.sleepConsistency) * 10,
                0,
                1000
            ),
            weight: 0.25
        },

        {
            name: "Recovery",
            score: clamp(
                safeNumber(data.recoveryScore) * 10,
                0,
                1000
            ),
            weight: 0.15
        }

    ];

    return {
        score: Math.round(weightedAverage(components)),
        components
    };
}


/* =========================================================
   SKL ENGINE
   ========================================================= */

function calculateSKL(data) {

    const components = [

        {
            name: "Demonstrated Skill",
            score: clamp(
                safeNumber(data.skillMastery) * 10,
                0,
                1000
            ),
            weight: 0.40
        },

        {
            name: "Difficulty",
            score: clamp(
                safeNumber(data.skillDifficulty) * 10,
                0,
                1000
            ),
            weight: 0.25
        },

        {
            name: "Projects",
            score: normalize(
                data.projectsCompleted,
                10
            ),
            weight: 0.20
        },

        {
            name: "Breadth",
            score: normalize(
                data.skillsDemonstrated,
                8
            ),
            weight: 0.15
        }

    ];

    return {
        score: Math.round(weightedAverage(components)),
        components
    };
}


/* =========================================================
   CHA ENGINE
   ========================================================= */

function calculateCHA(data) {

    const components = [

        {
            name: "Speaking",
            score: clamp(
                safeNumber(data.speakingScore) * 10,
                0,
                1000
            ),
            weight: 0.30
        },

        {
            name: "Writing",
            score: clamp(
                safeNumber(data.writingScore) * 10,
                0,
                1000
            ),
            weight: 0.25
        },

        {
            name: "Listening",
            score: clamp(
                safeNumber(data.listeningScore) * 10,
                0,
                1000
            ),
            weight: 0.25
        },

        {
            name: "Presentation",
            score: clamp(
                safeNumber(data.presentationScore) * 10,
                0,
                1000
            ),
            weight: 0.20
        }

    ];

    return {
        score: Math.round(weightedAverage(components)),
        components
    };
}


/* =========================================================
   STAT CALCULATOR
   ========================================================= */

function calculateStats(data) {

    return {

        STR: calculateSTR(data.STR || {}),

        VIT: calculateVIT(data.VIT || {}),

        AGI: calculateAGI(data.AGI || {}),

        INT: calculateINT(data.INT || {}),

        DIS: calculateDIS(data.DIS || {}),

        SKL: calculateSKL(data.SKL || {}),

        CHA: calculateCHA(data.CHA || {})

    };
}


/* =========================================================
   OVERALL CAPABILITY SCORE
   =========================================================

   Weighted geometric mean.

   Why?

   Normal average:

       900 + 900 + 900 + 900 + 100
       --------------------------------
                     5

   = 740

   That makes the player look extremely strong despite
   one major weakness.

   Geometric mean punishes extreme weaknesses more.
   ========================================================= */

function calculateOverallScore(stats) {

    let logarithmicTotal = 0;
    let weightTotal = 0;

    for (const [statName, weight] of
        Object.entries(PROGRESSION_CONFIG.STAT_WEIGHTS)) {

        const score = clamp(
            safeNumber(stats[statName]?.score),
            1,
            1000
        );

        logarithmicTotal +=
            Math.log(score) * weight;

        weightTotal += weight;
    }

    if (weightTotal === 0) {
        return 0;
    }

    const geometricMean =
        Math.exp(logarithmicTotal / weightTotal);

    return Math.round(
        clamp(geometricMean, 0, 1000)
    );
}


/* =========================================================
   XP FROM CAPABILITY SCORE
   ========================================================= */

function capabilityToXP(score) {

    score = clamp(
        safeNumber(score),
        0,
        1000
    );

    // Non-linear conversion.
    // Higher capability requires increasingly more XP.
    return Math.round(
        Math.pow(score, 1.35)
    );
}


/* =========================================================
   LEVEL CALCULATION
   ========================================================= */

function calculateLevel(xp) {

    xp = Math.max(0, safeNumber(xp));

    const base =
        PROGRESSION_CONFIG.LEVEL_BASE_XP;

    /*
        XP required for level:

        100 × level²

        Therefore:

        Level 1 → 100 XP
        Level 2 → 400 XP
        Level 3 → 900 XP
        Level 10 → 10,000 XP
        etc.
    */

    return Math.max(
        1,
        Math.floor(
            Math.sqrt(xp / base)
        ) + 1
    );
}


/* =========================================================
   RANK CALCULATION
   ========================================================= */

function calculateRank(xp, score) {

    let currentRank = "E";

    for (const rank of PROGRESSION_CONFIG.RANKS) {

        if (
            xp >= rank.minXP &&
            score >= rank.minScore
        ) {
            currentRank = rank.rank;
        }
    }

    return currentRank;
}


/* =========================================================
   PROGRESSION RESULT
   ========================================================= */

function calculateProgression(data) {

    const stats =
        calculateStats(data);

    const overallScore =
        calculateOverallScore(stats);

    /*
       Overall XP is based on the capability score.

       This is deliberately deterministic.
       AI does NOT get to invent XP.
    */

    const overallXP =
        capabilityToXP(overallScore);

    const level =
        calculateLevel(overallXP);

    const rank =
        calculateRank(
            overallXP,
            overallScore
        );

    return {

        stats,

        overall: {

            score: overallScore,

            xp: overallXP,

            level,

            rank

        }

    };
}


/* =========================================================
   XP FROM IMPROVEMENT
   =========================================================

   Used when new measurements are submitted.

   Example:

       old STR score = 320
       new STR score = 350

   The engine calculates XP for the improvement rather than
   giving massive XP simply because someone already has
   high capability.
   ========================================================= */

function calculateImprovementXP(
    oldScore,
    newScore,
    consistencyPercent = 0
) {

    oldScore =
        clamp(safeNumber(oldScore), 0, 1000);

    newScore =
        clamp(safeNumber(newScore), 0, 1000);

    const improvement =
        Math.max(0, newScore - oldScore);

    const improvementXP =
        Math.pow(improvement, 1.25) *
        PROGRESSION_CONFIG.IMPROVEMENT_WEIGHT;

    const consistencyBonus =
        Math.sqrt(
            clamp(
                safeNumber(consistencyPercent),
                0,
                100
            )
        ) * 2 *
        PROGRESSION_CONFIG.CONSISTENCY_WEIGHT;

    return Math.round(
        improvementXP + consistencyBonus
    );
}


/* =========================================================
   DAILY PROGRESSION
   ========================================================= */

function calculateDailyProgression(
    previousData,
    currentData
) {

    const previous =
        calculateProgression(previousData);

    const current =
        calculateProgression(currentData);

    const xpEarned = {};

    for (const statName of Object.keys(current.stats)) {

        xpEarned[statName] =
            calculateImprovementXP(
                previous.stats[statName].score,
                current.stats[statName].score,
                currentData[statName]?.consistencyPercent || 0
            );
    }

    let totalXP = 0;

    for (const value of Object.values(xpEarned)) {
        totalXP += value;
    }

    return {

        previous,

        current,

        xpEarned,

        totalXP

    };
}


/* =========================================================
   EXPORT
   =========================================================

   Browser version.
   ========================================================= */

window.ProgressionEngine = {

    clamp,

    normalize,

    scoreToMeasurement,

    calculateSTR,

    calculateINT,

    calculateDIS,

    calculateAGI,

    calculateVIT,

    calculateSKL,

    calculateCHA,

    calculateStats,

    calculateOverallScore,

    capabilityToXP,

    calculateLevel,

    calculateRank,

    calculateProgression,

    calculateImprovementXP,

    calculateDailyProgression

};
