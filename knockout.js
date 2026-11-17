/* ============================================================
   knockout.js - نظام خروج المغلوب
   النسخة 8.3 - توزيع متوازن للبايات (BYE) في الجداول الكبيرة
   ============================================================ */

window.Knockout = (function() {
    'use strict';

    const validSizes = [4, 8, 16, 32, 64, 128];
    const ROUND_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function getValidSize(s) {
        return validSizes.find(x => x >= s) || validSizes[validSizes.length - 1];
    }

    function createBye(type = 'seeded') {
        return {
            id: `BYE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'BYE',
            byeType: type,
            name: 'BYE',
            team: ''
        };
    }

    function getStandardSeedPositions(N) {
        return [
            1, N,
            Math.floor(N / 4) + 1,
            Math.floor(3 * N / 4),
            Math.floor(N / 4),
            Math.floor(N / 2),
            Math.floor(N / 2) + 1,
            Math.floor(3 * N / 4) + 1
        ];
    }

    function arrangeSeedsAndPositions(N, seededPlayers) {
        const base = getStandardSeedPositions(N);
        const maxSeeds = Math.min(seededPlayers.length, 8, Math.floor(N / 2));
        const ranked = seededPlayers.filter(p => p.seedRank && p.seedRank > 0);
        const unranked = seededPlayers.filter(p => !p.seedRank || p.seedRank <= 0);
        ranked.sort((a, b) => a.seedRank - b.seedRank);
        const allRanked = unranked.length === 0 && ranked.length === seededPlayers.length;

        if (allRanked) {
            return {
                seeds: ranked.slice(0, maxSeeds),
                positions: Array.from({ length: maxSeeds }, (_, i) => base[i])
            };
        }

        const usedRanks = new Set(ranked.slice(0, maxSeeds).map(p => p.seedRank));
        const remainingPositions = [];
        for (let r = 1; r <= maxSeeds; r++) {
            if (!usedRanks.has(r)) remainingPositions.push(base[r - 1]);
        }
        const shuffledPos = shuffle(remainingPositions);
        const shuffledUnranked = shuffle(unranked);

        const finalSeeds = [];
        const finalPositions = [];
        const assignedRanks = new Set();

        for (let r = 1; r <= maxSeeds; r++) {
            const found = ranked.find(p => p.seedRank === r);
            if (found && !assignedRanks.has(r)) {
                finalSeeds.push(found);
                finalPositions.push(base[r - 1]);
                assignedRanks.add(r);
            }
        }

        for (let i = 0; i < shuffledUnranked.length && finalSeeds.length < maxSeeds; i++) {
            finalSeeds.push(shuffledUnranked[i]);
            finalPositions.push(shuffledPos[i]);
        }

        return { seeds: finalSeeds, positions: finalPositions };
    }

    /* ============================================================
       ⭐ إجراء القرعة - خوارزمية التباعد الدقيق
       ============================================================ */
    function conductDraw() {
        const App = window.App;
        if (!App || !App.state) return;

        const players = App.state.knockout.players;

        if (players.length < 2) {
            return alert('يجب إضافة لاعبين على الأقل (2 على الأقل)');
        }

        if (App.state.knockout.matches.length > 0 && App.state.knockout.currentRound > 0) {
            if (!confirm('يوجد بطولة جارية. هل تريد إجراء قرعة جديدة؟ سيتم مسح النتائج الحالية.')) return;
        }

        const N = getValidSize(players.length);
        let numByes = N - players.length;
        const bracket = new Array(N + 1).fill(null);

        const seeded = players.filter(p => p.isSeeded);
        const nonSeeded = shuffle(players.filter(p => !p.isSeeded));

        const { seeds: orderedSeeds, positions: seedPositions } = arrangeSeedsAndPositions(N, seeded);

        // 1. توزيع المصنفين
        const maxSeeds = orderedSeeds.length;
        for (let i = 0; i < maxSeeds; i++) {
            bracket[seedPositions[i]] = orderedSeeds[i];
        }

        // 2. توزيع البايات أمام المصنفين أولاً
        for (let i = 0; i < maxSeeds && numByes > 0; i++) {
            const sp = seedPositions[i];
            const opp = (sp % 2 === 1) ? sp + 1 : sp - 1;
            if (bracket[opp] === null) {
                bracket[opp] = createBye('seeded');
                numByes--;
            }
        }

        // 3. توزيع البايات المتبقية بشكل متوازن (Even Distribution)
        if (numByes > 0) {
            const emptyMatches = [];
            for (let i = 1; i <= N; i += 2) {
                if (bracket[i] === null && bracket[i + 1] === null) {
                    emptyMatches.push(i);
                }
            }
            
            // توزيع البايات بشكل رياضي متساوٍ لمنع تكتلها
            const step = emptyMatches.length / numByes;
            for (let i = 0; i < numByes; i++) {
                const idx = Math.min(Math.floor(i * step), emptyMatches.length - 1);
                const matchStart = emptyMatches[idx];
                
                // نضع الباي في الخانة الثانية لتجنب أي تعارض
                if (bracket[matchStart + 1] === null) {
                    bracket[matchStart + 1] = createBye('nonSeeded');
                } else if (bracket[matchStart] === null) {
                    bracket[matchStart] = createBye('nonSeeded');
                }
            }
        }

        // 4. توزيع باقي اللاعبين (خوارزمية التباعد الدقيق)
        const extraSeeds = players.filter(p => p.isSeeded && !orderedSeeds.includes(p));
        const remainingPlayers = shuffle([...nonSeeded, ...extraSeeds]);
        
        const teamCounts = {};
        players.forEach(p => {
            if (p.team) teamCounts[p.team] = (teamCounts[p.team] || 0) + 1;
        });
        remainingPlayers.sort((a, b) => (teamCounts[b.team] || 0) - (teamCounts[a.team] || 0));

        const emptyPositions = [];
        for (let i = 1; i <= N; i++) {
            if (bracket[i] === null) emptyPositions.push(i);
        }

        const totalRounds = Math.log2(N);

        function getMeetingRound(pos1, pos2) {
            if (Math.ceil(pos1 / 2) === Math.ceil(pos2 / 2)) return 1;
            if (Math.ceil(pos1 / 4) === Math.ceil(pos2 / 4)) return 2;
            if (Math.ceil(pos1 / 8) === Math.ceil(pos2 / 8)) return 3;
            if (Math.ceil(pos1 / 16) === Math.ceil(pos2 / 16)) return 4;
            if (Math.ceil(pos1 / 32) === Math.ceil(pos2 / 32)) return 5;
            if (Math.ceil(pos1 / 64) === Math.ceil(pos2 / 64)) return 6;
            return 7;
        }

        function calculatePenalty(player, pos) {
            if (!player.team) return 0;
            let penalty = 0;
            for (let i = 1; i <= N; i++) {
                if (bracket[i] && bracket[i].type !== 'BYE' && bracket[i].team === player.team) {
                    const meetRound = getMeetingRound(pos, i);
                    penalty += Math.pow((totalRounds - meetRound + 1), 3) * 1000;
                }
            }
            return penalty;
        }

        for (const player of remainingPlayers) {
            let bestPos = emptyPositions[0];
            let minPenalty = Infinity;
            const shuffledEmpty = shuffle(emptyPositions);
            
            for (const pos of shuffledEmpty) {
                const penalty = calculatePenalty(player, pos);
                if (penalty < minPenalty) {
                    minPenalty = penalty;
                    bestPos = pos;
                    if (penalty === 0) break;
                }
            }

            bracket[bestPos] = player;
            emptyPositions.splice(emptyPositions.indexOf(bestPos), 1);
        }

        // 5. تحويل الجدول إلى مباريات
        const r1 = [];
        for (let i = 1; i <= N; i += 2) {
            const p1 = bracket[i] || createBye();
            const p2 = bracket[i + 1] || createBye();
            const m = {
                round: 1,
                player1: p1,
                player2: p2,
                score1: null,
                score2: null,
                winner: null,
                matchType: null,
                scoresheet: null
            };
            if (p1.type === 'BYE' || p2.type === 'BYE') {
                m.winner = (p1.type !== 'BYE') ? p1 : p2;
                m.score1 = (m.winner === p1) ? 1 : 0;
                m.score2 = (m.winner === p2) ? 1 : 0;
            }
            r1.push(m);
        }

        App.state.knockout.matches = [r1];
        App.state.knockout.currentRound = 1;
        App.saveSession();
        App.ui.render();
        document.getElementById('tournamentRounds').scrollIntoView({ behavior: 'smooth' });

        if (window.Bracket) {
            setTimeout(() => Bracket.render(), 100);
        }
    }

    function updateScore(match, side, value) {
        const score = parseInt(value);
        if (isNaN(score) || score < 0) return alert('الرجاء إدخال رقم صحيح موجب');

        if (side === 1) match.score1 = score;
        if (side === 2) match.score2 = score;

        if (match.score1 !== null && match.score2 !== null) {
            if (match.score1 === match.score2) return alert('ممنوع التعادل!');
            match.winner = match.score1 > match.score2 ? match.player1 : match.player2;
        }

        const App = window.App;
        App.saveSession();
        App.ui.render();

        if (window.Bracket) {
            setTimeout(() => Bracket.render(), 100);
        }
    }

    function nextRound() {
        const App = window.App;
        if (!App || !App.state) return;

        const ko = App.state.knockout;
        const current = ko.matches[ko.currentRound - 1];
        if (!current) return;

        if (current.some(m => !m.winner)) {
            return alert('الرجاء إكمال جميع النتائج');
        }

        const finalM = current.find(m => m.matchType === 'final');
        if (finalM && finalM.winner) return announceWinner();

        const next = [];
        const isSemis = current.length === 2 && !current.some(m => m.matchType);

        if (isSemis) {
            const s1 = current[0], s2 = current[1];
            const l1 = (s1.winner === s1.player1) ? s1.player2 : s1.player1;
            const l2 = (s2.winner === s2.player1) ? s2.player2 : s2.player1;

            if (ko.enableThirdPlaceMatch && l1.type !== 'BYE' && l2.type !== 'BYE') {
                next.push({
                    round: ko.currentRound + 1,
                    player1: l1,
                    player2: l2,
                    score1: null,
                    score2: null,
                    winner: null,
                    matchType: 'thirdPlace',
                    scoresheet: null
                });
            }

            next.push({
                round: ko.currentRound + 1,
                player1: s1.winner,
                player2: s2.winner,
                score1: null,
                score2: null,
                winner: null,
                matchType: 'final',
                scoresheet: null
            });
        } else {
            for (let i = 0; i < current.length; i += 2) {
                const m1 = current[i], m2 = current[i + 1];
                const m = {
                    round: ko.currentRound + 1,
                    player1: m1.winner,
                    player2: m2 ? m2.winner : createBye(),
                    score1: null,
                    score2: null,
                    winner: null,
                    matchType: null,
                    scoresheet: null
                };
                if (m.player1.type === 'BYE' || m.player2.type === 'BYE') {
                    m.winner = (m.player1.type !== 'BYE') ? m.player1 : m.player2;
                    m.score1 = (m.winner === m.player1) ? 1 : 0;
                    m.score2 = (m.winner === m.player2) ? 1 : 0;
                }
                next.push(m);
            }
        }

        ko.matches.push(next);
        ko.currentRound++;
        App.saveSession();
        App.ui.render();

        const last = document.getElementById('tournamentRounds').lastElementChild;
        if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });

        if (window.Bracket) {
            setTimeout(() => Bracket.render(), 100);
        }
    }

    function announceWinner() {
        const App = window.App;
        if (!App || !App.state) return;

        const ko = App.state.knockout;
        const last = ko.matches[ko.matches.length - 1];
        const final = last.find(m => m.matchType === 'final') ||
                      (last.length === 1 ? last[0] : null);
        const third = last.find(m => m.matchType === 'thirdPlace');

        if (!final || !final.winner) {
            return alert('يجب إكمال المباراة النهائية');
        }

        const titleEl = document.getElementById('winnerCardTitle');
        titleEl.textContent = App.state.tournamentName
            ? `منصة التتويج — ${App.state.tournamentName}`
            : 'منصة التتويج';

        let html = '';
        const champ = final.winner;
        html += `
            <div class="podium-entry gold-entry">
                <div class="podium-medal">🥇</div>
                <div class="podium-info">
                    <div class="podium-position">المركز الأول — بطل البطولة</div>
                    <h3>${champ.name}</h3>
                    <p>🏢 ${champ.team} ${champ.isSeeded && champ.seedRank ? `• ⭐ #${champ.seedRank}` : ''}</p>
                </div>
            </div>
        `;

        const runner = (final.winner === final.player1) ? final.player2 : final.player1;
        if (runner && runner.type !== 'BYE') {
            html += `
                <div class="podium-entry silver-entry">
                    <div class="podium-medal">🥈</div>
                    <div class="podium-info">
                        <div class="podium-position">المركز الثاني — الوصيف</div>
                        <h3>${runner.name}</h3>
                        <p>🏢 ${runner.team} ${runner.isSeeded && runner.seedRank ? `• ⭐ #${runner.seedRank}` : ''}</p>
                    </div>
                </div>
            `;
        }

        if (third && third.winner) {
            const t = third.winner;
            html += `
                <div class="podium-entry bronze-entry">
                    <div class="podium-medal">🥉</div>
                    <div class="podium-info">
                        <div class="podium-position">المركز الثالث</div>
                        <h3>${t.name}</h3>
                        <p>🏢 ${t.team} ${t.isSeeded && t.seedRank ? `• ⭐ #${t.seedRank}` : ''}</p>
                    </div>
                </div>
            `;
        }

        document.getElementById('winnerDetails').innerHTML = html;
        document.getElementById('winnerOverlay').classList.add('active');

        if (window.Bracket) {
            setTimeout(() => Bracket.render(), 100);
        }
    }

    return {
        conductDraw,
        updateScore,
        nextRound,
        announceWinner,
        shuffle,
        getValidSize,
        createBye,
        getStandardSeedPositions,
        arrangeSeedsAndPositions,
        getRoundColor: (i) => ROUND_COLORS[i % ROUND_COLORS.length]
    };
})();