/* ============================================================
   bracket.js - عرض شجرة البطولة مع خطوط ربط احترافية
   النسخة 5.0 - مع Connectors + Print + Animation
   ============================================================ */

window.Bracket = (function() {
    'use strict';

    let currentZoom = 1;
    const ZOOM_STEP = 0.15;
    const MIN_ZOOM = 0.4;
    const MAX_ZOOM = 2;

    /* ============================================================
       فتح النافذة
       ============================================================ */
    function open() {
        const App = window.App;
        if (!App || !App.state) return;

        if (App.state.knockout.matches.length === 0) {
            if (window.Toast) {
                Toast.warning('قم بإجراء القرعة أولاً لعرض شجرة البطولة');
            } else {
                alert('قم بإجراء القرعة أولاً لعرض شجرة البطولة');
            }
            return;
        }

        render();
        document.getElementById('bracketOverlay').classList.add('active');
        currentZoom = 1;
        applyZoom();

        if (window.Sounds) Sounds.openModal();
    }

    function close() {
        document.getElementById('bracketOverlay').classList.remove('active');
        if (window.Sounds) Sounds.closeModal();
    }

    /* ============================================================
       Zoom
       ============================================================ */
    function zoomIn() {
        if (currentZoom < MAX_ZOOM) {
            currentZoom = Math.min(currentZoom + ZOOM_STEP, MAX_ZOOM);
            applyZoom();
            if (window.Sounds) Sounds.click();
        }
    }

    function zoomOut() {
        if (currentZoom > MIN_ZOOM) {
            currentZoom = Math.max(currentZoom - ZOOM_STEP, MIN_ZOOM);
            applyZoom();
            if (window.Sounds) Sounds.click();
        }
    }

    function zoomReset() {
        currentZoom = 1;
        applyZoom();
        if (window.Sounds) Sounds.click();
    }

    function applyZoom() {
        const container = document.getElementById('bracketContainer');
        if (container) {
            container.style.transform = `scale(${currentZoom})`;
        }
    }

    /* ============================================================
       الطباعة
       ============================================================ */
    function print() {
        if (window.Sounds) Sounds.notify();

        // حفظ الـ zoom الحالي
        const savedZoom = currentZoom;
        const container = document.getElementById('bracketContainer');
        if (container) {
            container.style.transform = 'scale(1)';
        }

        setTimeout(() => {
            window.print();

            // استعادة الـ zoom
            setTimeout(() => {
                if (container) {
                    container.style.transform = `scale(${savedZoom})`;
                }
            }, 500);
        }, 200);
    }

    /* ============================================================
       عرض الشجرة
       ============================================================ */
    function render() {
        const App = window.App;
        if (!App || !App.state) return;

        const matches = App.state.knockout.matches;
        const title = document.getElementById('bracketTitle');
        const tournamentName = App.state.tournamentName || 'البطولة';

        title.textContent = `🌳 شجرة ${tournamentName}`;

        // تحديد البطل
        const lastRound = matches[matches.length - 1];
        let champion = null;
        if (lastRound) {
            const finalMatch = lastRound.find(m => m.matchType === 'final') ||
                               (lastRound.length === 1 ? lastRound[0] : null);
            if (finalMatch && finalMatch.winner && finalMatch.winner.type !== 'BYE') {
                champion = finalMatch.winner;
            }
        }

        const container = document.getElementById('bracketContainer');
        container.innerHTML = matches.map((round, roundIdx) => {
            return renderRound(round, roundIdx, matches.length, champion);
        }).join('');
    }

    function renderRound(roundMatches, roundIdx, totalRounds, champion) {
        const roundName = getRoundName(roundIdx, totalRounds);

        // ترتيب المباريات: مباراة المركز الثالث أولاً إذا وُجدت
        let displayMatches = [...roundMatches];
        const hasThird = roundMatches.some(m => m.matchType === 'thirdPlace');
        const hasFinal = roundMatches.some(m => m.matchType === 'final');

        if (hasThird && hasFinal) {
            const third = roundMatches.find(m => m.matchType === 'thirdPlace');
            const final = roundMatches.find(m => m.matchType === 'final');
            displayMatches = [third, final].filter(Boolean);
        }

        const matchesHtml = displayMatches.map((match) => {
            const originalIdx = roundMatches.indexOf(match);
            return renderBracketMatch(match, roundIdx, originalIdx, champion);
        }).join('');

        return `
            <div class="bracket-round" data-round="${roundIdx}">
                <div class="bracket-round-title">${roundName}</div>
                ${matchesHtml}
            </div>
        `;
    }

    function renderBracketMatch(match, roundIdx, matchIdx, champion) {
        const isBye = match.player1.type === 'BYE' || match.player2.type === 'BYE';
        const isThird = match.matchType === 'thirdPlace';
        const isFinal = match.matchType === 'final';

        let extraClass = '';
        if (isBye) extraClass += ' bye';
        if (isThird) extraClass += ' third-bracket';
        if (isFinal) extraClass += ' final-bracket';

        const p1 = renderBracketPlayer(match.player1, match.score1, match.winner === match.player1, champion);
        const p2 = renderBracketPlayer(match.player2, match.score2, match.winner === match.player2, champion);

        const clickHandler = isBye ? '' : `onclick="Bracket.openScoreSheet(${roundIdx}, ${matchIdx})"`;
        const title = isBye ? 'مباراة BYE' : 'انقر لفتح Score Sheet';

        return `
            <div class="bracket-match${extraClass}"
                 title="${title}"
                 ${clickHandler}
                 style="${isBye ? '' : 'cursor: pointer;'}">
                ${p1}
                ${p2}
            </div>
        `;
    }

    function renderBracketPlayer(player, score, isWinner, champion) {
        if (player.type === 'BYE') {
            return `<div class="bracket-player bye-player-bracket">— BYE —</div>`;
        }

        const winnerClass = isWinner ? ' winner' : '';
        const seed = player.isSeeded && player.seedRank
            ? `<span class="bp-seed">${player.seedRank}</span>`
            : '';
        const scoreDisplay = score !== null && score !== undefined
            ? `<span class="bp-score">${score}</span>`
            : `<span class="bp-score">-</span>`;

        const isChampion = champion && champion.id === player.id;
        const championIcon = isChampion ? ' 🏆' : '';

        return `
            <div class="bracket-player${winnerClass}">
                ${seed}
                <span class="bp-name">${player.name}${championIcon}</span>
                ${scoreDisplay}
            </div>
        `;
    }

    function getRoundName(idx, total) {
        const rem = total - idx;
        if (rem === 1) return '🏆 النهائي';
        if (rem === 2) return '🥈 نصف النهائي';
        if (rem === 3) return '🥉 ربع النهائي';
        if (rem === 4) return 'دور الـ 16';
        if (rem === 5) return 'دور الـ 32';
        if (rem === 6) return 'دور الـ 64';
        if (rem === 7) return 'دور الـ 128';
        return `الجولة ${idx + 1}`;
    }

    /* ============================================================
       فتح Score Sheet من الشجرة
       ============================================================ */
    function openScoreSheet(roundIdx, matchIdx) {
        const App = window.App;
        if (!App || !App.state) return;

        const match = App.state.knockout.matches[roundIdx][matchIdx];
        if (!match) return;

        if (match.player1.type === 'BYE' || match.player2.type === 'BYE') {
            return; // لا Score Sheet لمباريات BYE
        }

        if (window.Sounds) Sounds.click();

        close();
        if (window.ScoreSheet) {
            setTimeout(() => {
                window.ScoreSheet.open(roundIdx, matchIdx);
            }, 100);
        }
    }

    /* ============================================================
       التهيئة
       ============================================================ */
    function init() {
        const overlay = document.getElementById('bracketOverlay');
        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target.id === 'bracketOverlay') close();
            });
        }

        // دعم Ctrl + scroll للـ Zoom
        const bracketBody = document.querySelector('.bracket-body');
        if (bracketBody) {
            bracketBody.addEventListener('wheel', e => {
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.deltaY < 0) zoomIn();
                    else zoomOut();
                }
            }, { passive: false });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        open,
        close,
        render,
        zoomIn,
        zoomOut,
        zoomReset,
        print,
        openScoreSheet
    };
})();