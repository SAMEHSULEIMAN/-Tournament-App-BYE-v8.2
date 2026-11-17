/* ============================================================
   advanced-rules.js - القواعد المتقدمة الرسمية
   الوقت الإضافي + ركلات الترجيح + Rally Points + 1/2/3 نقاط
   النسخة 1.0
   ============================================================ */

window.AdvancedRules = (function() {
    'use strict';

    /* ============================================================
       قواعد الوقت الإضافي الرسمية لكل رياضة
       ============================================================ */
    const EXTRA_TIME_RULES = {
        football11: {
            periods: 2,
            periodMinutes: 15,
            hasPenaltyShootout: true,
            penaltyShots: 5,
            label: 'وقت إضافي (2 × 15 دقيقة)'
        },
        futsal: {
            periods: 2,
            periodMinutes: 5,
            hasPenaltyShootout: true,
            penaltyShots: 5,
            label: 'وقت إضافي (2 × 5 دقائق)'
        },
        handball: {
            periods: 2,
            periodMinutes: 5,
            hasSecondExtraTime: true,
            secondPeriods: 2,
            secondPeriodMinutes: 5,
            hasPenaltyShootout: true,
            penaltyShots: 5,
            label: 'وقت إضافي (2 × 5 دقائق)'
        },
        basketball: {
            periods: 1,
            periodMinutes: 5,
            isOvertime: true,
            canRepeat: true,
            hasPenaltyShootout: false,
            label: 'وقت إضافي (5 دقائق)'
        },
        volleyball: {
            hasPenaltyShootout: false,
            isGoldenSet: true,
            goldenSetPoints: 15,
            label: 'الشوط الذهبي (15 نقطة)'
        }
    };

    function getExtraTimeRules(gameType) {
        return EXTRA_TIME_RULES[gameType] || null;
    }

    function needsExtraTimeOnDraw(gameType) {
        const rules = getExtraTimeRules(gameType);
        return rules && (rules.periods || rules.isOvertime || rules.isGoldenSet);
    }

    /* ============================================================
       إضافة وقت إضافي لمباراة
       ============================================================ */
    function addExtraTime(match, schema) {
        const gameType = window.ScoreSheet.getGameType();
        const rules = getExtraTimeRules(gameType);

        if (!rules) return false;

        if (!match.extraTime) {
            match.originalScore1 = match.score1 || 0;
            match.originalScore2 = match.score2 || 0;
            
            match.extraTime = {
                periods: [],
                total: {
                    score1: match.originalScore1,
                    score2: match.originalScore2
                },
                isSecondExtraTime: false
            };

            const numPeriods = rules.isOvertime ? 1 : (rules.periods || 1);
            for (let i = 0; i < numPeriods; i++) {
                match.extraTime.periods.push({
                    period: i + 1,
                    minutes: rules.periodMinutes || 5,
                    score1: null,
                    score2: null
                });
            }
        }

        return true;
    }

    /* ============================================================
       إضافة الوقت الإضافي الثاني (كرة اليد فقط)
       ============================================================ */
    function addSecondExtraTime(match) {
        const gameType = window.ScoreSheet.getGameType();
        const rules = getExtraTimeRules(gameType);

        if (!rules || !rules.hasSecondExtraTime) return false;
        if (!match.extraTime) return false;
        if (match.extraTime.isSecondExtraTime) return false;

        const firstPeriodsCount = match.extraTime.periods.length;

        for (let i = 0; i < (rules.secondPeriods || 2); i++) {
            match.extraTime.periods.push({
                period: firstPeriodsCount + i + 1,
                minutes: rules.secondPeriodMinutes || 5,
                score1: null,
                score2: null
            });
        }

        match.extraTime.isSecondExtraTime = true;
        return true;
    }

    /* ============================================================
       إضافة ركلات الترجيح
       ============================================================ */
    function addPenaltyShootout(match) {
        const gameType = window.ScoreSheet.getGameType();
        const rules = getExtraTimeRules(gameType);

        if (!rules || !rules.hasPenaltyShootout) return false;

        if (!match.penaltyShootout) {
            match.penaltyShootout = {
                score1: 0,
                score2: 0,
                attempts1: 0,
                attempts2: 0,
                maxAttempts: rules.penaltyShots || 5,
                isSuddenDeath: false,
                history: [],
                isComplete: false,
                winner: null
            };
        }

        return true;
    }

    /* ============================================================
       إضافة ركلة ترجيح
       ============================================================ */
    function addPenaltyAttempt(match, side, scored) {
        if (!match.penaltyShootout) return false;
        const ps = match.penaltyShootout;

        if (ps.isComplete) return false;

        if (side === 1) {
            ps.attempts1++;
            if (scored) ps.score1++;
        } else {
            ps.attempts2++;
            if (scored) ps.score2++;
        }

        ps.history.push({
            side,
            scored: !!scored,
            attemptNum: side === 1 ? ps.attempts1 : ps.attempts2,
            timestamp: new Date().toISOString()
        });

        return checkPenaltyShootoutComplete(match);
    }

    /* ============================================================
       فحص اكتمال ركلات الترجيح
       ============================================================ */
    function checkPenaltyShootoutComplete(match) {
        if (!match.penaltyShootout) return false;
        const ps = match.penaltyShootout;

        if (!ps.isSuddenDeath) {
            const remaining1 = ps.maxAttempts - ps.attempts1;
            const remaining2 = ps.maxAttempts - ps.attempts2;

            // هل الفريق 1 مضمون الفوز؟
            if (ps.score1 > ps.score2 + remaining2) {
                ps.isComplete = true;
                ps.winner = 1;
                match.winner = match.player1;
                return true;
            }
            // هل الفريق 2 مضمون الفوز؟
            if (ps.score2 > ps.score1 + remaining1) {
                ps.isComplete = true;
                ps.winner = 2;
                match.winner = match.player2;
                return true;
            }

            // اكتملت 5 ركلات لكل فريق
            if (ps.attempts1 >= ps.maxAttempts && ps.attempts2 >= ps.maxAttempts) {
                if (ps.score1 === ps.score2) {
                    ps.isSuddenDeath = true;
                } else {
                    ps.isComplete = true;
                    ps.winner = ps.score1 > ps.score2 ? 1 : 2;
                    match.winner = ps.winner === 1 ? match.player1 : match.player2;
                    return true;
                }
            }
        } else {
            // Sudden Death
            if (ps.attempts1 === ps.attempts2 && ps.attempts1 > ps.maxAttempts) {
                const team1Attempts = ps.history.filter(h => h.side === 1);
                const team2Attempts = ps.history.filter(h => h.side === 2);
                const last1 = team1Attempts[team1Attempts.length - 1];
                const last2 = team2Attempts[team2Attempts.length - 1];
                
                if (last1 && last2) {
                    if (last1.scored && !last2.scored) {
                        ps.isComplete = true;
                        ps.winner = 1;
                        match.winner = match.player1;
                        return true;
                    } else if (!last1.scored && last2.scored) {
                        ps.isComplete = true;
                        ps.winner = 2;
                        match.winner = match.player2;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /* ============================================================
       تحديث نتيجة الوقت الإضافي
       ============================================================ */
    function updateExtraTimeScore(match, periodIdx, side, value) {
        if (!match.extraTime) return;
        const score = parseInt(value) || 0;
        const period = match.extraTime.periods[periodIdx];
        if (!period) return;

        if (side === 1) period.score1 = score;
        else period.score2 = score;

        // إعادة حساب الإجمالي
        let total1 = match.originalScore1 || 0;
        let total2 = match.originalScore2 || 0;
        
        match.extraTime.periods.forEach(p => {
            total1 += p.score1 || 0;
            total2 += p.score2 || 0;
        });

        match.extraTime.total = { score1: total1, score2: total2 };
        match.score1 = total1;
        match.score2 = total2;

        if (total1 !== total2) {
            match.winner = total1 > total2 ? match.player1 : match.player2;
        } else {
            match.winner = null;
        }
    }

    /* ============================================================
       حساب النتيجة الإجمالية (الأساسي + الإضافي)
       ============================================================ */
    function computeTotalScore(match) {
        if (match.extraTime && match.extraTime.total) {
            return {
                score1: match.extraTime.total.score1,
                score2: match.extraTime.total.score2,
                hasExtraTime: true
            };
        }
        return {
            score1: match.score1 || 0,
            score2: match.score2 || 0,
            hasExtraTime: false
        };
    }

    /* ============================================================
       🏐 نظام Rally Point (كرة الطائرة)
       ============================================================ */
    function createVolleyballSetTracker() {
        return {
            sets: [
                { num: 1, score1: 0, score2: 0, winner: null, target: 25 },
                { num: 2, score1: 0, score2: 0, winner: null, target: 25 },
                { num: 3, score1: 0, score2: 0, winner: null, target: 25 },
                { num: 4, score1: 0, score2: 0, winner: null, target: 25 },
                { num: 5, score1: 0, score2: 0, winner: null, target: 15 }
            ],
            currentSet: 0,
            serving: 1,
            setsWon1: 0,
            setsWon2: 0,
            isComplete: false,
            winner: null
        };
    }

    function addVolleyballRally(tracker, side) {
        if (!tracker || tracker.isComplete) return;
        const set = tracker.sets[tracker.currentSet];
        if (!set || set.winner) return;

        if (side === 1) set.score1++;
        else set.score2++;

        // فحص الفوز بالشوط (25 نقطة أو 15 للشوط الخامس، بفارق 2)
        const target = set.target || 25;
        const lead = Math.abs(set.score1 - set.score2);

        if (set.score1 >= target && lead >= 2 && set.score1 > set.score2) {
            set.winner = 1;
            tracker.setsWon1++;
            advanceVolleyballSet(tracker);
        } else if (set.score2 >= target && lead >= 2 && set.score2 > set.score1) {
            set.winner = 2;
            tracker.setsWon2++;
            advanceVolleyballSet(tracker);
        }
    }

    function advanceVolleyballSet(tracker) {
        if (tracker.setsWon1 >= 3 || tracker.setsWon2 >= 3) {
            tracker.isComplete = true;
            tracker.winner = tracker.setsWon1 >= 3 ? 1 : 2;
        } else {
            tracker.currentSet++;
        }
    }

    /* ============================================================
       🏀 كرة السلة - تتبع التسديدات (1/2/3)
       ============================================================ */
    function createBasketballScoreTracker() {
        return {
            freeThrows: { team1: 0, team2: 0 },
            twoPointers: { team1: 0, team2: 0 },
            threePointers: { team1: 0, team2: 0 }
        };
    }

    function addBasketballScore(tracker, side, type) {
        const key = side === 1 ? 'team1' : 'team2';
        let points = 0;
        
        if (type === 'freeThrow') {
            tracker.freeThrows[key]++;
            points = 1;
        } else if (type === 'twoPointer') {
            tracker.twoPointers[key]++;
            points = 2;
        } else if (type === 'threePointer') {
            tracker.threePointers[key]++;
            points = 3;
        }
        
        return points;
    }

    function computeBasketballTotal(tracker) {
        return {
            score1: tracker.freeThrows.team1 + (tracker.twoPointers.team1 * 2) + (tracker.threePointers.team1 * 3),
            score2: tracker.freeThrows.team2 + (tracker.twoPointers.team2 * 2) + (tracker.threePointers.team2 * 3)
        };
    }

    /* ============================================================
       🥅 Futsal - فحص منطقة الجزاء (5 أخطاء)
       ============================================================ */
    function checkFutsalPenaltyZone(accumulatedFouls, team, half) {
        const key = `team${team}`;
        if (!accumulatedFouls[key]) return false;
        const fouls = accumulatedFouls[key][half] || 0;
        return fouls >= 5;
    }

    /* ============================================================
       API
       ============================================================ */
    return {
        getExtraTimeRules,
        needsExtraTimeOnDraw,
        addExtraTime,
        addSecondExtraTime,
        computeTotalScore,
        updateExtraTimeScore,
        addPenaltyShootout,
        addPenaltyAttempt,
        checkPenaltyShootoutComplete,
        createVolleyballSetTracker,
        addVolleyballRally,
        createBasketballScoreTracker,
        addBasketballScore,
        computeBasketballTotal,
        checkFutsalPenaltyZone,
        EXTRA_TIME_RULES
    };
})();