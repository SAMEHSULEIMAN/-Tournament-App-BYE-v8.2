/* ============================================================
   app.js - المنسق الرئيسي
   النسخة 8.1 - مع دعم دور واحد/دورين + قواعد متقدمة
   ============================================================ */

/* ============================================================
   Toast Notifications (مدمج)
   ============================================================ */
window.Toast = (function() {
    'use strict';

    const DEFAULT_DURATION = 3500;
    const ICONS = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    function show(message, type = 'info', options = {}) {
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.log(`[Toast ${type}] ${message}`);
            return;
        }

        const { title = '', duration = DEFAULT_DURATION, closable = true } = options;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        toast.innerHTML = `
            <span class="toast-icon">${ICONS[type] || ICONS.info}</span>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
            ${closable ? '<button class="toast-close" aria-label="إغلاق">✕</button>' : ''}
        `;

        container.appendChild(toast);

        if (closable) {
            const closeBtn = toast.querySelector('.toast-close');
            closeBtn.addEventListener('click', () => remove(toast));
        }

        if (duration > 0) {
            setTimeout(() => remove(toast), duration);
        }
        return toast;
    }

    function remove(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 300);
    }

    return {
        show,
        success: (msg, opts) => show(msg, 'success', opts),
        error: (msg, opts) => show(msg, 'error', opts),
        warning: (msg, opts) => show(msg, 'warning', opts),
        info: (msg, opts) => show(msg, 'info', opts),
        clear: () => {
            const c = document.getElementById('toastContainer');
            if (c) c.innerHTML = '';
        }
    };
})();

/* ============================================================
   App - المنسق الرئيسي
   ============================================================ */
window.App = (function() {
    'use strict';

    const SAVED_KEY = 'savedTournaments';
    const SESSION_KEY = 'tournamentData';

    const state = {
        system: 'knockout',
        tournamentName: '',
        gameType: 'football11',
        knockout: {
            players: [],
            matches: [],
            currentRound: 0,
            enableThirdPlaceMatch: true
        },
        groups: {
            groups: []
        }
    };

    let savedTournaments = [];
    let isInitialized = false;

    /* ============================================================
       دوال مساعدة
       ============================================================ */
    function getSystemLabel(sys) {
        const labels = { knockout: 'إقصائي', groups: 'مجموعات', hybrid: 'هجين' };
        return labels[sys] || sys;
    }

    function sanitizePlayer(p) {
        if (!p || p.type === 'BYE') return p ? { ...p } : p;
        return {
            id: p.id, name: p.name, team: p.team,
            isSeeded: p.isSeeded, seedRank: p.seedRank || null
        };
    }

    function getSnapshot() {
        return {
            tournamentName: state.tournamentName,
            system: state.system,
            gameType: state.gameType,
            knockout: {
                players: state.knockout.players.map(sanitizePlayer),
                matches: state.knockout.matches.map(round =>
                    round.map(m => ({
                        round: m.round,
                        player1: sanitizePlayer(m.player1),
                        player2: sanitizePlayer(m.player2),
                        score1: m.score1,
                        score2: m.score2,
                        winner: sanitizePlayer(m.winner),
                        matchType: m.matchType || null,
                        scoresheet: m.scoresheet || null,
                        extraTime: m.extraTime || null,
                        penaltyShootout: m.penaltyShootout || null,
                        originalScore1: m.originalScore1,
                        originalScore2: m.originalScore2
                    }))
                ),
                currentRound: state.knockout.currentRound,
                enableThirdPlaceMatch: state.knockout.enableThirdPlaceMatch
            },
            groups: JSON.parse(JSON.stringify(state.groups))
        };
    }

    function revivePlayer(p) {
        if (!p) return null;
        if (p.type === 'BYE') return { ...p };
        return state.knockout.players.find(x => x.id === p.id) || p;
    }

    function applySnapshot(data) {
        if (!data) return;

        state.tournamentName = data.tournamentName || '';
        state.system = data.system || 'knockout';
        state.gameType = data.gameType || 'football11';

        if (data.knockout) {
            state.knockout.players = data.knockout.players || [];
            state.knockout.matches = (data.knockout.matches || []).map(round =>
                round.map(m => ({
                    round: m.round,
                    player1: revivePlayer(m.player1),
                    player2: revivePlayer(m.player2),
                    score1: m.score1,
                    score2: m.score2,
                    winner: revivePlayer(m.winner),
                    matchType: m.matchType || null,
                    scoresheet: m.scoresheet || null,
                    extraTime: m.extraTime || null,
                    penaltyShootout: m.penaltyShootout || null,
                    originalScore1: m.originalScore1,
                    originalScore2: m.originalScore2
                }))
            );
            state.knockout.currentRound = data.knockout.currentRound || 0;
            state.knockout.enableThirdPlaceMatch =
                data.knockout.enableThirdPlaceMatch !== false;
        }

        if (data.groups && data.groups.groups) {
            state.groups.groups = data.groups.groups.map(g => ({
                ...g,
                twoLegged: g.twoLegged || false,   // ⭐ ضمان وجود الحقل
                rounds: (g.rounds || []).map(round =>
                    round.map(m => ({ ...m, scoresheet: m.scoresheet || null }))
                )
            }));
        } else {
            state.groups.groups = [];
        }

        const nameEl = document.getElementById('tournamentName');
        if (nameEl) nameEl.value = state.tournamentName;

        const tpEl = document.getElementById('enableThirdPlace');
        if (tpEl) tpEl.checked = state.knockout.enableThirdPlaceMatch;

        const gtEl = document.getElementById('gameType');
        if (gtEl) gtEl.value = state.gameType;

        updateTabs();
        updateSections();
        renderAll();
    }

    /* ============================================================
       حفظ / تحميل
       ============================================================ */
    function saveSession() {
        try {
            localStorage.setItem(SESSION_KEY, JSON.stringify(getSnapshot()));
        } catch (e) {
            console.error('Save error:', e);
        }
    }

    function loadSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return false;
            applySnapshot(JSON.parse(raw));
            return true;
        } catch (e) {
            console.error('Load error:', e);
            return false;
        }
    }

    function persistSaved() {
        try {
            localStorage.setItem(SAVED_KEY, JSON.stringify(savedTournaments));
        } catch (e) {
            console.error('Persist error:', e);
            if (window.Toast) Toast.error('فشل حفظ البطولات');
        }
    }

    function loadSaved() {
        try {
            const raw = localStorage.getItem(SAVED_KEY);
            savedTournaments = raw ? JSON.parse(raw) : [];
        } catch (e) {
            savedTournaments = [];
        }
    }

    function renderSavedList() {
        const container = document.getElementById('savedTournamentsList');
        if (!container) return;

        if (savedTournaments.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد بطولات محفوظة بعد</p>';
            return;
        }

        const sorted = [...savedTournaments].sort(
            (a, b) => new Date(b.savedAt) - new Date(a.savedAt)
        );

        container.innerHTML = sorted.map(t => {
            const d = new Date(t.savedAt);
            const dateStr = d.toLocaleDateString('ar-EG');
            const timeStr = d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            const koPlayers = t.data?.knockout?.players?.length || 0;
            const groupsCount = t.data?.groups?.groups?.length || 0;
            const sysLabel = getSystemLabel(t.system || t.data?.system || 'knockout');
            const isCurrent = state.tournamentName === t.name;
            let countText = groupsCount > 0 ? `📋 ${groupsCount} مجموعة` : `👥 ${koPlayers} لاعب`;

            return `
                <div class="saved-tournament-card">
                    <div class="saved-tournament-info">
                        <h4>${isCurrent ? '🟢' : '🏆'} ${t.name}</h4>
                        <p class="saved-meta">
                            ${sysLabel} • ${countText}<br>
                            🕐 ${dateStr} - ${timeStr}
                        </p>
                    </div>
                    <div class="saved-tournament-actions">
                        <button class="action-btn action-edit"
                                onclick="App.current.loadSaved(${t.id})">📂 استرجاع</button>
                        <button class="action-btn action-delete"
                                onclick="App.current.deleteSaved(${t.id})">🗑️ حذف</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    /* ============================================================
       تحديث الواجهة
       ============================================================ */
    function updateTabs() {
        document.querySelectorAll('.tab').forEach(t =>
            t.classList.toggle('active', t.dataset.system === state.system)
        );
    }

    function updateSections() {
        const playersSection = document.getElementById('playersSection');
        const groupsSection = document.getElementById('groupsSection');
        const thirdPlace = document.getElementById('thirdPlaceToggleWrap');
        const bridgeSettings = document.getElementById('bridgeSettings');

        if (!playersSection || !groupsSection) return;

        if (state.system === 'knockout') {
            playersSection.hidden = false;
            groupsSection.hidden = true;
            if (thirdPlace) thirdPlace.hidden = false;
            if (bridgeSettings) bridgeSettings.hidden = true;
        } else if (state.system === 'groups') {
            playersSection.hidden = true;
            groupsSection.hidden = false;
            if (thirdPlace) thirdPlace.hidden = true;
            if (bridgeSettings) bridgeSettings.hidden = true;
        } else {
            playersSection.hidden = true;
            groupsSection.hidden = false;
            if (thirdPlace) thirdPlace.hidden = false;
            if (bridgeSettings) bridgeSettings.hidden = false;
        }
    }

    function renderModeBanner() {
        const banner = document.getElementById('modeBanner');
        if (!banner) return;
        const labels = {
            knockout: '🎯 نظام خروج المغلوب — إقصائي مباشر',
            groups: '🔄 نظام دوري المجموعات — Round Robin',
            hybrid: '🏆 النظام الهجين — دوري مجموعات ثم أدوار إقصائية'
        };
        banner.className = 'mode-banner visible ' + state.system + '-banner';
        banner.textContent = labels[state.system];
    }

    function renderPlayers() {
        const tbody = document.getElementById('playersList');
        const summary = document.getElementById('playersSummary');
        if (!tbody || !summary) return;

        const players = state.knockout.players;

        if (players.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">لا يوجد لاعبون بعد</td></tr>';
            summary.innerHTML = '';
            return;
        }

        const sorted = [...players].sort((a, b) => {
            if (a.isSeeded && !b.isSeeded) return -1;
            if (!a.isSeeded && b.isSeeded) return 1;
            if (a.isSeeded && b.isSeeded) return (a.seedRank || 999) - (b.seedRank || 999);
            return 0;
        });

        tbody.innerHTML = sorted.map((p, i) => {
            const seedDisplay = p.isSeeded
                ? '<span class="seed-badge">⭐ مصنف</span>'
                : '<span class="no-seed-badge">—</span>';
            const rankDisplay = p.isSeeded
                ? (p.seedRank ? `<span class="seed-rank-badge">#${p.seedRank}</span>` : '<span class="no-seed-badge">غير محدد</span>')
                : '<span class="no-seed-badge">—</span>';
            return `<tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.team}</td>
                <td>${seedDisplay}</td>
                <td>${rankDisplay}</td>
                <td>
                    <button class="action-btn action-edit"
                            onclick="App.knockout.editPlayer(${p.id})">تعديل</button>
                    <button class="action-btn action-delete"
                            onclick="App.knockout.deletePlayer(${p.id})">حذف</button>
                </td>
            </tr>`;
        }).join('');

        const seeded = players.filter(p => p.isSeeded).length;
        const ranked = players.filter(p => p.isSeeded && p.seedRank).length;
        const teams = new Set(players.map(p => p.team)).size;

        summary.innerHTML = `
            <span class="summary-badge badge-total">👥 ${players.length} لاعب</span>
            <span class="summary-badge badge-seeded">⭐ ${seeded} مصنف (${ranked} مرتب)</span>
            <span class="summary-badge badge-teams">🏢 ${teams} فريق</span>
        `;
    }

    /* ============================================================
       ⭐ renderGroups - مع دعم دور واحد/دورين
       ============================================================ */
    function renderGroups() {
        const container = document.getElementById('groupsContainer');
        const summary = document.getElementById('groupsSummary');
        if (!container || !summary) return;

        if (state.system !== 'groups' && state.system !== 'hybrid') {
            container.innerHTML = '';
            summary.innerHTML = '';
            return;
        }

        const groups = state.groups.groups;

        if (groups.length === 0) {
            container.innerHTML = '<p class="empty-state">لا توجد مجموعات بعد</p>';
            summary.innerHTML = '';
            return;
        }

        container.innerHTML = groups.map(g => {
            if (window.Groups && window.Groups.updateStandings) {
                window.Groups.updateStandings(g);
            }

            const standingsTable = `
                <table>
                    <thead><tr>
                        <th>الفريق</th><th>لعب</th><th>فاز</th><th>تعادل</th>
                        <th>خسر</th><th>له</th><th>عليه</th><th>الفرق</th>
                        <th>النقاط</th>
                    </tr></thead>
                    <tbody>
                        ${g.teams.map(t => {
                            const gd = t.goalsFor - t.goalsAgainst;
                            const gdStr = gd > 0 ? '+' + gd : String(gd);
                            return `<tr>
                                <td>${t.name}</td>
                                <td>${t.played}</td>
                                <td>${t.won}</td>
                                <td>${t.drawn}</td>
                                <td>${t.lost}</td>
                                <td>${t.goalsFor}</td>
                                <td>${t.goalsAgainst}</td>
                                <td>${gdStr}</td>
                                <td><strong>${t.points}</strong></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>`;

            const roundsHtml = g.rounds.map((matches, r) => {
                const isReturn = matches.some(m => m.isReturn);
                const legTag = g.twoLegged ? (isReturn ? ' 🔄 إياب' : ' ➡️ ذهاب') : '';
                return `
                <div class="round-title">الجولة ${r + 1}${legTag}</div>
                <table class="group-matches-table">
                    <thead><tr>
                        <th>فريق 1</th><th>فريق 2</th>
                        <th>النتيجة</th><th>تحديث</th><th>Score Sheet</th>
                    </tr></thead>
                    <tbody>
                        ${matches.map((m, i) => {
                            const hasSheet = !!m.scoresheet;
                            const motm = hasSheet && m.scoresheet.motm
                                ? (() => {
                                    const t = m.scoresheet.teams[m.scoresheet.motm.teamIdx];
                                    if (t && t.players[m.scoresheet.motm.playerIdx]) {
                                        const p = t.players[m.scoresheet.motm.playerIdx];
                                        return `🌟 #${p.number || '?'} ${p.name || ''}`;
                                    }
                                    return '';
                                })()
                                : '';
                            const motmBadge = motm ? `<div class="gs-motm-badge">${motm}</div>` : '';
                            return `
                                <tr>
                                    <td>${m.team1}</td>
                                    <td>${m.team2}</td>
                                    <td><strong>${m.score1 !== null ? `${m.score1} - ${m.score2}` : '—'}</strong></td>
                                    <td>
                                        <button class="update-match"
                                                onclick="Groups.updateMatch('${g.name}',${r},${i})">
                                            ✏️ تحديث
                                        </button>
                                    </td>
                                    <td>
                                        <button class="gs-scoresheet-btn ${hasSheet ? 'filled' : 'empty'}"
                                                onclick="ScoreSheet.openGroupMatch('${g.name}', ${r}, ${i})">
                                            📋 ${hasSheet ? 'عرض' : 'فتح'}
                                        </button>
                                        ${motmBadge}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                `;
            }).join('');

            const legBadge = g.twoLegged
                ? '<span class="group-type-badge">🔄 دورين (ذهاب وإياب)</span>'
                : '<span class="group-type-badge">➡️ دور واحد</span>';

            return `
                <div class="group">
                    <h3>
                        <span>📋 المجموعة ${g.name}</span>
                        <span class="group-teams-count">
                            ${g.teams.length} فرق
                            ${legBadge}
                            <button class="action-btn action-delete"
                                    style="margin-right:10px"
                                    onclick="Groups.deleteGroup('${g.name}')">🗑️ حذف</button>
                        </span>
                    </h3>
                    ${standingsTable}
                    ${roundsHtml}
                </div>
            `;
        }).join('');

        const totalTeams = groups.reduce((s, g) => s + g.teams.length, 0);
        const completedMatches = groups.reduce((s, g) =>
            s + g.rounds.flat().filter(m => m.score1 !== null).length, 0);
        const totalMatches = groups.reduce((s, g) =>
            s + g.rounds.flat().length, 0);
        const sheetsFilled = groups.reduce((s, g) =>
            s + g.rounds.flat().filter(m => m.scoresheet).length, 0);

        summary.innerHTML = `
            <span class="summary-badge badge-total">📋 ${groups.length} مجموعة</span>
            <span class="summary-badge badge-teams">👥 ${totalTeams} فريق</span>
            <span class="summary-badge badge-seeded">⚽ ${completedMatches}/${totalMatches} مباراة</span>
            <span class="summary-badge badge-total">📋 ${sheetsFilled} Score Sheet</span>
        `;
    }

    function renderTournament() {
        const container = document.getElementById('tournamentRounds');
        if (!container) return;

        if (state.system === 'groups') {
            container.innerHTML = '';
            return;
        }

        const ko = state.knockout;

        if (ko.matches.length === 0) {
            container.innerHTML = '<p class="empty-state">قم بإجراء القرعة لبدء البطولة</p>';
            return;
        }

        container.innerHTML = ko.matches.map((roundMatches, roundIdx) => {
            const isCurrent = (roundIdx + 1) === ko.currentRound;
            const hasFinal = roundMatches.some(m => m.matchType === 'final');
            const hasThird = roundMatches.some(m => m.matchType === 'thirdPlace');
            const allCompleted = roundMatches.every(m => m.winner);
            const isFinished = hasFinal && allCompleted;

            const color = window.Knockout && window.Knockout.getRoundColor
                ? window.Knockout.getRoundColor(roundIdx) : '#3b82f6';

            let displayMatches = roundMatches;
            if (hasThird && hasFinal) {
                const t = roundMatches.find(m => m.matchType === 'thirdPlace');
                const f = roundMatches.find(m => m.matchType === 'final');
                displayMatches = [t, f].filter(Boolean);
            }

            let title = `الجولة ${roundIdx + 1} — ${getRoundName(roundIdx, ko.matches.length)}`;
            if (hasFinal && hasThird) title = '🏆 الجولة النهائية — النهائي + المركز الثالث';
            else if (hasFinal) title = '🏆 المباراة النهائية';

            let buttonHTML = '';
            if (isCurrent && allCompleted && !isFinished) {
                buttonHTML = `
                    <div class="next-round-container">
                        <p>✅ اكتملت الجولة ${roundIdx + 1}</p>
                        <button class="next-round-btn" onclick="App.knockout.nextRound()">
                            الانتقال إلى الجولة ${roundIdx + 2} ⏭️
                        </button>
                    </div>`;
            } else if (isFinished) {
                buttonHTML = `
                    <div class="next-round-container"
                         style="background:linear-gradient(135deg,#fef3c7,#fde68a);border-color:#f59e0b">
                        <p style="color:#92400e">🏆 البطولة انتهت!</p>
                        <button class="next-round-btn" style="background:#f59e0b"
                                onclick="App.knockout.announceWinner()">
                            عرض منصة التتويج 🏆
                        </button>
                    </div>`;
            } else if (isCurrent && !allCompleted && hasFinal) {
                buttonHTML = `
                    <div class="next-round-container"
                         style="background:#fef9c3;border-color:#f59e0b">
                        <p style="color:#92400e">
                            ⏳ الرجاء إكمال نتائج الجولة النهائية
                            ${hasThird ? ' (النهائي + المركز الثالث)' : ''}
                        </p>
                    </div>`;
            }

            return `
                <div class="round" style="border-right-color:${color}">
                    <h3 style="color:${color}">${title}</h3>
                    <div class="match-grid">
                        ${displayMatches.map(m => {
                            const idx = roundMatches.indexOf(m);
                            return renderMatch(m, roundIdx, idx);
                        }).join('')}
                    </div>
                    ${buttonHTML}
                </div>
            `;
        }).join('');
    }

    /* ============================================================
       renderMatch - مع الوقت الإضافي وركلات الترجيح
       ============================================================ */
    function renderMatch(match, roundIdx, matchIdx) {
        const isBye = match.player1.type === 'BYE' || match.player2.type === 'BYE';
        const isCompleted = !!match.winner;
        const isThird = match.matchType === 'thirdPlace';
        const isFinal = match.matchType === 'final';

        const p1Class = match.winner === match.player1 ? 'winner' : '';
        const p2Class = match.winner === match.player2 ? 'winner' : '';
        const byeNotice = isBye
            ? '<div class="auto-advance">⚡ فوز تلقائي (BYE)</div>' : '';

        let typeLabel = '';
        if (isThird) typeLabel = '<div class="match-type-label third-place-label">🥉 مباراة المركز الثالث</div>';
        else if (isFinal) typeLabel = '<div class="match-type-label final-label">🏆 المباراة النهائية</div>';

        const extraClass = isThird ? 'third-place' : (isFinal ? 'final-match' : '');

        // عرض الوقت الإضافي
        let extraTimeHTML = '';
        if (match.extraTime && match.extraTime.periods) {
            extraTimeHTML = `
                <div class="extra-time-banner">
                    <div class="extra-time-title">
                        ⏱️ الوقت الإضافي${match.extraTime.isSecondExtraTime ? ' الثاني' : ''}
                        <span class="extra-total">(${match.extraTime.total.score1} - ${match.extraTime.total.score2})</span>
                    </div>
                    ${match.extraTime.periods.map((p, idx) => `
                        <div class="extra-time-period">
                            <span class="period-label">${p.period}</span>
                            <input type="number" min="0" value="${p.score1 ?? ''}"
                                   onchange="App.current.updateExtraTimeScore(${roundIdx}, ${matchIdx}, ${idx}, 1, this.value)"
                                   class="extra-input">
                            <span>—</span>
                            <input type="number" min="0" value="${p.score2 ?? ''}"
                                   onchange="App.current.updateExtraTimeScore(${roundIdx}, ${matchIdx}, ${idx}, 2, this.value)"
                                   class="extra-input">
                        </div>
                    `).join('')}
                </div>
            `;
        }

        // عرض ركلات الترجيح
        let penaltyHTML = '';
        if (match.penaltyShootout) {
            const ps = match.penaltyShootout;
            penaltyHTML = `
                <div class="penalty-shootout-banner ${ps.isComplete ? 'completed' : ''}">
                    <div class="penalty-title">
                        🥅 ركلات الترجيح ${ps.isSuddenDeath ? '(الموت المفاجئ)' : ''}
                        ${ps.isComplete ? '✅ انتهت' : ''}
                    </div>
                    <div class="penalty-score">
                        <div class="penalty-team team-a">
                            <span class="pt-name">${match.player1.name}</span>
                            <span class="pt-score">${ps.score1}</span>
                            <span class="pt-attempts">(${ps.attempts1}/${ps.maxAttempts})</span>
                            ${!ps.isComplete ? `
                                <div class="pt-actions">
                                    <button class="pt-btn score"
                                            onclick="App.current.addPenaltyAttempt(${roundIdx}, ${matchIdx}, 1, true)"
                                            title="سجل">⚽</button>
                                    <button class="pt-btn miss"
                                            onclick="App.current.addPenaltyAttempt(${roundIdx}, ${matchIdx}, 1, false)"
                                            title="أهدر">❌</button>
                                </div>
                            ` : ''}
                        </div>
                        <div class="penalty-vs">VS</div>
                        <div class="penalty-team team-b">
                            <span class="pt-name">${match.player2.name}</span>
                            <span class="pt-score">${ps.score2}</span>
                            <span class="pt-attempts">(${ps.attempts2}/${ps.maxAttempts})</span>
                            ${!ps.isComplete ? `
                                <div class="pt-actions">
                                    <button class="pt-btn score"
                                            onclick="App.current.addPenaltyAttempt(${roundIdx}, ${matchIdx}, 2, true)"
                                            title="سجل">⚽</button>
                                    <button class="pt-btn miss"
                                            onclick="App.current.addPenaltyAttempt(${roundIdx}, ${matchIdx}, 2, false)"
                                            title="أهدر">❌</button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }

        let scoreSheetHTML = '';
        if (!isBye && window.ScoreSheet) {
            scoreSheetHTML = `
                <div class="match-scoresheet-dropdown">
                    <button class="scoresheet-toggle"
                            onclick="ScoreSheet.open(${roundIdx}, ${matchIdx})">
                        <span>📋 Score Sheet</span>
                        <span class="arrow">▼</span>
                    </button>
                    ${window.ScoreSheet.getMatchCardSummary(match)}
                </div>
            `;
        }

        return `
            <div class="match ${isBye ? 'bye' : ''} ${isCompleted ? 'completed' : ''} ${extraClass}"
                 data-round="${roundIdx}" data-match="${matchIdx}">
                ${typeLabel}
                <div class="player ${p1Class}">${renderPlayerContent(match.player1)}</div>
                <div class="vs-row">
                    <input type="number" min="0"
                           value="${match.score1 ?? ''}"
                           onchange="handleScore(this,${roundIdx},${matchIdx},1)"
                           ${match.player1.type === 'BYE' ? 'disabled' : ''}>
                    <span class="vs-label">VS</span>
                    <input type="number" min="0"
                           value="${match.score2 ?? ''}"
                           onchange="handleScore(this,${roundIdx},${matchIdx},2)"
                           ${match.player2.type === 'BYE' ? 'disabled' : ''}>
                </div>
                <div class="player ${p2Class}">${renderPlayerContent(match.player2)}</div>
                ${extraTimeHTML}
                ${penaltyHTML}
                ${byeNotice}
                ${scoreSheetHTML}
            </div>
        `;
    }

    function renderPlayerContent(p) {
        if (p.type === 'BYE') return '<div class="bye-player">BYE</div>';
        const rankTag = p.isSeeded && p.seedRank
            ? `<span class="seed-rank-tag">#${p.seedRank}</span>` : '';
        return `
            <span class="name">${rankTag}${p.name}</span>
            <span class="team">${p.team}</span>
            ${p.isSeeded && !p.seedRank ? '<span>⭐</span>' : ''}
        `;
    }

    function getRoundName(idx, total) {
        const rem = total - idx;
        if (rem === 1) return 'النهائي 🏆';
        if (rem === 2) return 'نصف النهائي';
        if (rem === 3) return 'ربع النهائي';
        if (rem === 4) return 'دور الـ 16';
        if (rem === 5) return 'دور الـ 32';
        if (rem === 6) return 'دور الـ 64';
        return '';
    }

    function renderAll() {
        renderModeBanner();
        renderPlayers();
        renderGroups();
        renderTournament();
        renderSavedList();
        if (window.Bridge && window.Bridge.updateBridgeBanner) {
            window.Bridge.updateBridgeBanner();
        }
    }

    /* ============================================================
       إدارة اللاعبين
       ============================================================ */
    function addPlayer() {
        const nameEl = document.getElementById('playerName');
        const teamEl = document.getElementById('team');
        const seededEl = document.getElementById('isSeeded');
        const rankEl = document.getElementById('seedRank');
        if (!nameEl || !teamEl) return;

        const p = {
            id: Date.now() + Math.random(),
            name: nameEl.value.trim(),
            team: teamEl.value.trim().toUpperCase(),
            isSeeded: seededEl.checked,
            seedRank: null
        };

        if (!p.name || !p.team) {
            if (window.Toast) Toast.error('أدخل اسم اللاعب واسم الفريق');
            return;
        }

        if (state.knockout.players.some(x => x.name === p.name)) {
            if (window.Toast) Toast.error('اسم اللاعب موجود مسبقاً');
            if (window.Sounds) Sounds.error();
            return;
        }

        if (p.isSeeded) {
            const r = parseInt(rankEl.value);
            if (!isNaN(r) && r > 0) {
                if (state.knockout.players.some(x => x.isSeeded && x.seedRank === r)) {
                    if (window.Toast) Toast.error(`ترتيب التصنيف #${r} مستخدم`);
                    return;
                }
                p.seedRank = r;
            }
        }

        state.knockout.players.push(p);
        nameEl.value = '';
        teamEl.value = '';
        seededEl.checked = false;
        rankEl.value = '';
        rankEl.disabled = true;
        nameEl.focus();

        saveSession();
        renderAll();
        if (window.Sounds) Sounds.success();
        if (window.Toast) Toast.success(`تمت إضافة ${p.name}`);
    }

    function editPlayer(id) {
        const p = state.knockout.players.find(x => x.id === id);
        if (!p) return;

        document.getElementById('editId').value = id;
        document.getElementById('editName').value = p.name;
        document.getElementById('editTeam').value = p.team;
        document.getElementById('editSeeded').checked = p.isSeeded;
        document.getElementById('editSeedRank').value = p.seedRank || '';
        document.getElementById('editSeedRank').disabled = !p.isSeeded;
        document.getElementById('editOverlay').classList.add('active');
        if (window.Sounds) Sounds.click();
    }

    function saveEdit() {
        const id = parseFloat(document.getElementById('editId').value);
        const p = state.knockout.players.find(x => x.id === id);
        if (!p) return;

        const newName = document.getElementById('editName').value.trim();
        const newTeam = document.getElementById('editTeam').value.trim().toUpperCase();
        const newSeeded = document.getElementById('editSeeded').checked;
        const rankVal = document.getElementById('editSeedRank').value;

        if (!newName || !newTeam) {
            if (window.Toast) Toast.error('أدخل البيانات'); return;
        }

        if (state.knockout.players.some(x => x.id !== id && x.name === newName)) {
            if (window.Toast) Toast.error('الاسم موجود مسبقاً'); return;
        }

        let newRank = null;
        if (newSeeded && rankVal) {
            const r = parseInt(rankVal);
            if (isNaN(r) || r < 1) {
                if (window.Toast) Toast.error('ترتيب غير صالح'); return;
            }
            if (state.knockout.players.some(x =>
                    x.id !== id && x.isSeeded && x.seedRank === r)) {
                if (window.Toast) Toast.error('الترتيب مستخدم'); return;
            }
            newRank = r;
        }

        p.name = newName;
        p.team = newTeam;
        p.isSeeded = newSeeded;
        p.seedRank = newRank;

        closeEdit();
        saveSession();
        renderAll();
        if (window.Sounds) Sounds.success();
        if (window.Toast) Toast.success('تم حفظ التعديلات');
    }

    function deletePlayer(id) {
        const p = state.knockout.players.find(x => x.id === id);
        if (!p) return;
        if (!confirm(`حذف اللاعب "${p.name}"؟`)) return;

        state.knockout.players = state.knockout.players.filter(p => p.id !== id);
        saveSession();
        renderAll();
        if (window.Sounds) Sounds.click();
        if (window.Toast) Toast.info(`تم حذف ${p.name}`);
    }

    function closeEdit() {
        const overlay = document.getElementById('editOverlay');
        if (overlay) overlay.classList.remove('active');
        if (window.Sounds) Sounds.closeModal();
    }

    function closeWinner() {
        const overlay = document.getElementById('winnerOverlay');
        if (overlay) overlay.classList.remove('active');
        if (window.Sounds) Sounds.closeModal();
    }

    /* ============================================================
       current - الإجراءات العامة
       ============================================================ */
    const current = {
        save() {
            saveSession();
            if (window.Bridge && window.Bridge.updateBridgeBanner) {
                window.Bridge.updateBridgeBanner();
            }
        },

        draw() {
            if (state.system === 'groups') {
                if (window.Toast) Toast.warning('لا توجد قرعة في نظام المجموعات');
                return;
            }
            if (window.Knockout && window.Knockout.conductDraw) {
                window.Knockout.conductDraw();
            }
        },

        updateExtraTimeScore(roundIdx, matchIdx, periodIdx, side, value) {
            const m = state.knockout.matches[roundIdx]?.[matchIdx];
            if (!m) return;
            if (window.ScoreSheet && window.ScoreSheet.updateExtraTimeScoreUI) {
                window.ScoreSheet.updateExtraTimeScoreUI(periodIdx, side, value);
            }
            saveSession();
            renderAll();
        },

        addPenaltyAttempt(roundIdx, matchIdx, side, scored) {
            const m = state.knockout.matches[roundIdx]?.[matchIdx];
            if (!m) return;
            if (window.ScoreSheet && window.ScoreSheet.addPenaltyAttemptUI) {
                window.ScoreSheet.addPenaltyAttemptUI(side, scored);
            }
            saveSession();
            renderAll();
        },

        saveTournamentAs() {
            const defaultName = state.tournamentName ||
                `${getSystemLabel(state.system)} - ${new Date().toLocaleDateString('ar-EG')}`;
            const name = prompt('اسم البطولة للحفظ:', defaultName);
            if (!name || !name.trim()) return;
            const trimmed = name.trim();
            const existing = savedTournaments.find(t => t.name === trimmed);

            if (existing) {
                if (!confirm(`بطولة "${trimmed}" موجودة. استبدالها؟`)) return;
                existing.data = getSnapshot();
                existing.data.tournamentName = trimmed;
                existing.savedAt = new Date().toISOString();
                existing.system = state.system;
            } else {
                const snapshot = getSnapshot();
                snapshot.tournamentName = trimmed;
                savedTournaments.push({
                    id: Date.now() + Math.random(),
                    name: trimmed,
                    savedAt: new Date().toISOString(),
                    system: state.system,
                    data: snapshot
                });
            }

            state.tournamentName = trimmed;
            const nameEl = document.getElementById('tournamentName');
            if (nameEl) nameEl.value = trimmed;

            persistSaved();
            saveSession();
            renderSavedList();
            if (window.Sounds) Sounds.success();
            if (window.Toast) Toast.success(`تم حفظ "${trimmed}"`);
        },

        loadSaved(id) {
            const t = savedTournaments.find(x => x.id === id);
            if (!t) {
                if (window.Toast) Toast.error('البطولة غير موجودة'); return;
            }
            if (!confirm(`استرجاع "${t.name}"؟\nسيتم استبدال البطولة الحالية.`)) return;

            saveSession();
            applySnapshot(t.data);
            saveSession();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (window.Sounds) Sounds.success();
            if (window.Toast) Toast.success(`تم استرجاع "${t.name}"`);
        },

        deleteSaved(id) {
            const t = savedTournaments.find(x => x.id === id);
            if (!t) return;
            if (!confirm(`حذف "${t.name}" نهائياً؟`)) return;
            savedTournaments = savedTournaments.filter(x => x.id !== id);
            persistSaved();
            renderSavedList();
            if (window.Sounds) Sounds.click();
            if (window.Toast) Toast.info(`تم حذف "${t.name}"`);
        },

        exportData() {
            const data = getSnapshot();
            data.version = '8.1';
            data.exportedAt = new Date().toISOString();

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const safe = (state.tournamentName || 'tournament').replace(/[^\w\u0600-\u06FF-]+/g, '_');
            a.download = `${safe}_${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            if (window.Sounds) Sounds.success();
            if (window.Toast) Toast.success('تم تصدير JSON');
        },

        importData(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = e => {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.knockout && !data.groups) throw new Error('ملف غير صالح');
                    if (!confirm('سيتم استبدال البيانات الحالية. متابعة؟')) {
                        input.value = '';
                        return;
                    }
                    applySnapshot(data);
                    saveSession();
                    if (window.Sounds) Sounds.victory();
                    if (window.Toast) Toast.success('تم استيراد البيانات بنجاح');
                } catch (err) {
                    if (window.Sounds) Sounds.error();
                    if (window.Toast) Toast.error('خطأ: ' + err.message);
                    else alert('خطأ: ' + err.message);
                }
                input.value = '';
            };
            reader.readAsText(file);
        },

        newTournament() {
            if (!confirm('بدء بطولة جديدة؟\nيُفضل حفظ البطولة الحالية أولاً.')) return;

            state.knockout.players = [];
            state.knockout.matches = [];
            state.knockout.currentRound = 0;
            state.groups.groups = [];
            state.tournamentName = '';

            localStorage.removeItem(SESSION_KEY);

            const playerForm = document.getElementById('playerForm');
            const groupForm = document.getElementById('groupForm');
            const nameEl = document.getElementById('tournamentName');
            const rankEl = document.getElementById('seedRank');

            if (playerForm) playerForm.reset();
            if (groupForm) groupForm.reset();
            if (nameEl) nameEl.value = '';
            if (rankEl) rankEl.disabled = true;

            closeWinner();
            closeEdit();
            renderAll();
            if (window.Sounds) Sounds.success();
            if (window.Toast) Toast.info('بطولة جديدة جاهزة');
        }
    };

    /* ============================================================
       ui
       ============================================================ */
    const ui = {
        switchSystem(system) {
            if (system === state.system) return;

            if (state.knockout.matches.length > 0 || state.groups.groups.length > 0) {
                if (!confirm('التبديل بين الأنظمة قد يؤثر على البيانات الحالية. متابعة؟')) return;
            }

            state.system = system;
            updateTabs();
            updateSections();
            renderAll();
            saveSession();
            if (window.Sounds) Sounds.toggle();
            if (window.Toast) Toast.info(`تم التبديل إلى النظام ${getSystemLabel(system)}`);
        },

        render() { renderAll(); },
        closeWinner,
        closeEdit,

        toggleSeedRank() {
            const checked = document.getElementById('isSeeded').checked;
            const rankEl = document.getElementById('seedRank');
            rankEl.disabled = !checked;
            if (!checked) rankEl.value = '';
        },

        toggleEditSeedRank() {
            const checked = document.getElementById('editSeeded').checked;
            const rankEl = document.getElementById('editSeedRank');
            rankEl.disabled = !checked;
            if (!checked) rankEl.value = '';
        }
    };

    /* ============================================================
       handleScore
       ============================================================ */
    window.handleScore = function(input, roundIdx, matchIdx, side) {
        const m = state.knockout.matches[roundIdx]?.[matchIdx];
        if (!m) return;

        if (m.scoresheet) {
            if (!confirm('⚠️ تعديل النتيجة يدوياً سيمسح Score Sheet المرتبط.\nهل تريد المتابعة؟')) {
                input.value = m[side === 1 ? 'score1' : 'score2'] ?? '';
                return;
            }
            m.scoresheet = null;
            if (window.Toast) Toast.warning('تم مسح Score Sheet المرتبط');
        }

        if (window.Knockout && window.Knockout.updateScore) {
            window.Knockout.updateScore(m, side, input.value);
        }
    };

    /* ============================================================
       ربط الأحداث
       ============================================================ */
    function bindEvents() {
        // التبويبات
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => ui.switchSystem(tab.dataset.system));
        });

        // اسم البطولة
        const nameEl = document.getElementById('tournamentName');
        if (nameEl) {
            nameEl.addEventListener('input', e => {
                state.tournamentName = e.target.value.trim();
                saveSession();
            });
        }

        // نوع اللعبة
        const gtEl = document.getElementById('gameType');
        if (gtEl) {
            gtEl.addEventListener('change', e => {
                if (window.ScoreSheet) window.ScoreSheet.setGameType(e.target.value);
                const schema = window.ScoreSheet?.getSchema();
                if (window.Toast && schema) {
                    Toast.info(`تم تغيير نوع اللعبة إلى ${schema.icon} ${schema.name}`);
                }
            });
        }

        // نموذج اللاعب
        const playerForm = document.getElementById('playerForm');
        if (playerForm) {
            playerForm.addEventListener('submit', e => {
                e.preventDefault();
                addPlayer();
            });
        }

        // مفتاح التصنيف
        const isSeededEl = document.getElementById('isSeeded');
        if (isSeededEl) isSeededEl.addEventListener('change', ui.toggleSeedRank);

        const editSeededEl = document.getElementById('editSeeded');
        if (editSeededEl) editSeededEl.addEventListener('change', ui.toggleEditSeedRank);

        // ⭐ نموذج المجموعة - مع قراءة نوع الدوري
        const groupForm = document.getElementById('groupForm');
        if (groupForm) {
            groupForm.addEventListener('submit', e => {
                e.preventDefault();
                const nameEl2 = document.getElementById('groupName');
                const teamsEl = document.getElementById('teamNames');
                const name = nameEl2.value.trim();
                const teams = teamsEl.value.split(',').map(t => t.trim()).filter(Boolean);

                if (!name || teams.length < 2) {
                    if (window.Toast) Toast.error('أدخل اسم المجموعة وفريقين على الأقل');
                    return;
                }
                if (state.groups.groups.some(g => g.name === name)) {
                    if (window.Toast) Toast.error('اسم المجموعة موجود');
                    return;
                }

                // ⭐ قراءة نوع الدوري من الواجهة
                const legRadio = document.querySelector('input[name="groupLegs"]:checked');
                const twoLegged = legRadio && legRadio.value === '2';

                if (window.Groups && window.Groups.addGroup) {
                    window.Groups.addGroup(name, teams, twoLegged);
                    e.target.reset();
                    if (window.Sounds) Sounds.success();
                }
            });
        }

        // مفتاح المواجهات المباشرة
        const directToggle = document.getElementById('directEncounterToggle');
        if (directToggle) {
            directToggle.addEventListener('change', () => {
                state.groups.groups.forEach(g => {
                    if (window.Groups && window.Groups.updateStandings) {
                        window.Groups.updateStandings(g);
                    }
                });
                renderAll();
                if (window.Toast) {
                    Toast.info(directToggle.checked
                        ? 'تم تفعيل المواجهات المباشرة'
                        : 'تم تعطيل المواجهات المباشرة');
                }
            });
        }

        // مفتاح المركز الثالث
        const thirdToggle = document.getElementById('enableThirdPlace');
        if (thirdToggle) {
            thirdToggle.addEventListener('change', e => {
                state.knockout.enableThirdPlaceMatch = e.target.checked;
                saveSession();
                if (window.Toast) {
                    Toast.info(e.target.checked
                        ? 'تم تفعيل مباراة المركز الثالث'
                        : 'تم تعطيل مباراة المركز الثالث');
                }
            });
        }

        // استيراد ملف
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.addEventListener('change', e => current.importData(e.target));
        }

        // زر الأصوات
        const soundToggle = document.getElementById('soundToggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                if (window.Sounds) {
                    Sounds.toggle();
                    if (Sounds.isEnabled()) setTimeout(() => Sounds.notify(), 100);
                }
            });
        }

        // إغلاق النوافذ
        const winnerOverlay = document.getElementById('winnerOverlay');
        if (winnerOverlay) {
            winnerOverlay.addEventListener('click', e => {
                if (e.target.id === 'winnerOverlay') closeWinner();
            });
        }

        const editOverlay = document.getElementById('editOverlay');
        if (editOverlay) {
            editOverlay.addEventListener('click', e => {
                if (e.target.id === 'editOverlay') closeEdit();
            });
        }

        const ssOverlay = document.getElementById('scoreSheetOverlay');
        if (ssOverlay) {
            ssOverlay.addEventListener('click', e => {
                if (e.target.id === 'scoreSheetOverlay' && window.ScoreSheet) {
                    window.ScoreSheet.close();
                }
            });
        }

        const reportOverlay = document.getElementById('reportOverlay');
        if (reportOverlay) {
            reportOverlay.addEventListener('click', e => {
                if (e.target.id === 'reportOverlay' && window.ScoreSheet) {
                    window.ScoreSheet.closeReport();
                }
            });
        }

        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') {
                closeWinner();
                closeEdit();
                if (window.ScoreSheet) {
                    window.ScoreSheet.close();
                    window.ScoreSheet.closeReport();
                }
                if (window.Bracket) window.Bracket.close();
                if (window.Dashboard) window.Dashboard.close();
                if (window.Export) window.Export.closeShare();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                current.saveTournamentAs();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                if (window.Dashboard) Dashboard.open();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault();
                if (window.Bracket) Bracket.open();
            }

            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault();
                window.print();
            }
        });

        // إعادة رسم Dashboard عند تغيير الثيم
        document.addEventListener('themeChanged', () => {
            const dash = document.getElementById('dashboardOverlay');
            if (dash && dash.classList.contains('active') && window.Dashboard) {
                setTimeout(() => Dashboard.render(), 200);
            }
        });
    }

    /* ============================================================
       التهيئة
       ============================================================ */
    function init() {
        if (isInitialized) return;
        isInitialized = true;

        const AppRef = window.App;

        AppRef.knockout = {
            conductDraw: () => window.Knockout && window.Knockout.conductDraw(),
            updateScore: (m, s, v) => window.Knockout && window.Knockout.updateScore(m, s, v),
            nextRound: () => window.Knockout && window.Knockout.nextRound(),
            announceWinner: () => window.Knockout && window.Knockout.announceWinner(),
            editPlayer: editPlayer,
            deletePlayer: deletePlayer,
            saveEdit: saveEdit
        };

        AppRef.bridge = {
            transfer: () => window.Bridge && window.Bridge.transfer()
        };

        loadSaved();
        const hasSession = loadSession();
        bindEvents();

        updateTabs();
        updateSections();
        renderAll();

        if (!hasSession) {
            setTimeout(() => {
                if (window.Toast) {
                    Toast.info('مرحباً بك! ابدأ بإضافة اللاعبين أو إنشاء مجموعات', {
                        title: '🏆 نظام إدارة البطولات',
                        duration: 5000
                    });
                }
            }, 800);
        } else {
            setTimeout(() => {
                if (window.Toast) {
                    Toast.success(`تم استرجاع بطولة "${state.tournamentName || 'بدون اسم'}"`, {
                        duration: 3000
                    });
                }
            }, 800);
        }

        console.log('%c🏆 Tournament App v8.1 Ready', 'color: #2563eb; font-size: 16px; font-weight: bold;');
        console.log('%c9 Sports + Intl Standards + Advanced Rules + 1/2 Legged Groups', 'color: #16a34a; font-size: 12px;');
    }

    const App = {
        state: state,
        current: current,
        ui: ui,
        knockout: {},
        bridge: {},
        getSnapshot: getSnapshot,
        applySnapshot: applySnapshot,
        saveSession: saveSession,
        render: renderAll
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return App;
})();