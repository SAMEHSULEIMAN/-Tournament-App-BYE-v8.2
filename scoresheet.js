/* ============================================================
   scoresheet.js - نظام Score Sheet الاحترافي الكامل
   9 رياضات + معايير دولية رسمية + قواعد متقدمة
   النسخة 8.0
   ============================================================ */

window.ScoreSheet = (function() {
    'use strict';

    /* ============================================================
       مخططات الرياضات - وفق المعايير الدولية
       ============================================================ */
    const SPORT_SCHEMAS = {
        football11: {
            name: 'كرة قدم 11', icon: '⚽', pattern: 'football',
            scoreKey: 'goals', scoreLabel: 'الأهداف',
            periods: 2, periodLabels: ['الشوط الأول', 'الشوط الثاني'],
            periodMinutes: 45,
            hasExtraTime: true, hasExtraTimeColumn: true,
            hasPenaltyShootout: true,
            hasTimeouts: true, maxTimeouts: 3,
            hasAccumulatedFouls: false, hasGoalLog: true,
            goalTypes: ['عادي', 'جزاء', 'عكس'], hasDiscipline: true, hasPlayerStats: true,
            leaguePoints: { win: 3, draw: 1, loss: 0, forfeit: 0 },
            playerStats: [
                { key: 'goals', label: 'أهداف', type: 'number', isScore: true },
                { key: 'assists', label: 'صناعة', type: 'number' },
                { key: 'yellow', label: 'إنذار', type: 'number' },
                { key: 'red', label: 'طرد', type: 'number' },
                { key: 'minutes', label: 'دقائق', type: 'number' }
            ],
            teamStats: [
                { key: 'shots', label: 'التسديدات', type: 'number' },
                { key: 'shotsOnTarget', label: 'على المرمى', type: 'number' },
                { key: 'corners', label: 'الركنيات', type: 'number' },
                { key: 'offsides', label: 'التسلل', type: 'number' },
                { key: 'possession', label: 'الاستحواذ %', type: 'possession' }
            ]
        },
        futsal: {
            name: 'كرة قدم خماسي', icon: '🥅', pattern: 'football', isFutsal: true,
            scoreKey: 'goals', scoreLabel: 'الأهداف',
            periods: 2, periodLabels: ['الشوط الأول', 'الشوط الثاني'],
            periodMinutes: 20,
            hasExtraTime: true, hasExtraTimeColumn: true,
            hasPenaltyShootout: true,
            hasTimeouts: true, maxTimeouts: 1,
            hasAccumulatedFouls: true, maxAccumulatedFouls: 5,
            hasGoalLog: true, goalTypes: ['عادي', 'جزاء', 'عكس'],
            hasDiscipline: true, hasPlayerStats: true,
            leaguePoints: { win: 3, draw: 1, loss: 0, forfeit: 0 },
            playerStats: [
                { key: 'goals', label: 'أهداف', type: 'number', isScore: true },
                { key: 'assists', label: 'صناعة', type: 'number' },
                { key: 'yellow', label: 'إنذار', type: 'number' },
                { key: 'red', label: 'طرد', type: 'number' }
            ],
            teamStats: [
                { key: 'shots', label: 'التسديدات', type: 'number' },
                { key: 'possession', label: 'الاستحواذ %', type: 'possession' }
            ]
        },
        basketball: {
            name: 'كرة سلة', icon: '🏀', pattern: 'basketball',
            scoreKey: 'points', scoreLabel: 'النقاط',
            periods: 4, periodLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
            periodMinutes: 10,
            hasOvertime: true, overtimeMinutes: 5, canRepeatOT: true,
            hasDraw: false, hasPenaltyShootout: false,
            hasTimeouts: true, maxTimeoutsPerQuarter: 2,
            hasTeamFouls: true, foulsPerQuarter: true, maxTeamFouls: 4,
            hasPlayerStats: true, hasPointTypes: true,
            leaguePoints: { win: 2, loss: 1, forfeit: 0 },
            playerStats: [
                { key: 'points', label: 'نقاط', type: 'number', isScore: true },
                { key: 'freeThrows', label: 'رميات حرة', type: 'number' },
                { key: 'twoPts', label: '2 نقطة', type: 'number' },
                { key: 'threePts', label: '3 نقاط', type: 'number' },
                { key: 'rebounds', label: 'مرتدات', type: 'number' },
                { key: 'assists', label: 'تمريرات', type: 'number' },
                { key: 'steals', label: 'سرقات', type: 'number' },
                { key: 'blocks', label: 'صدات', type: 'number' },
                { key: 'fouls', label: 'أخطاء', type: 'number' }
            ],
            teamStats: []
        },
        handball: {
            name: 'كرة يد', icon: '🤾', pattern: 'handball',
            scoreKey: 'goals', scoreLabel: 'الأهداف',
            periods: 2, periodLabels: ['الشوط الأول', 'الشوط الثاني'],
            periodMinutes: 30,
            hasExtraTime: true,
            hasSecondExtraTime: true,
            hasPenaltyShootout: true,
            hasTimeouts: true, maxTimeouts: 3,
            hasSevenMeters: true, hasSanctions: true, hasPlayerStats: true,
            leaguePoints: { win: 2, draw: 1, loss: 0, forfeit: 0 },
            playerStats: [
                { key: 'goals', label: 'أهداف', type: 'number', isScore: true },
                { key: 'sevenM', label: '7 أمتار', type: 'number' },
                { key: 'assists', label: 'صناعة', type: 'number' },
                { key: 'saves', label: 'تصديات', type: 'number' },
                { key: 'yellow', label: 'إنذار', type: 'number' },
                { key: 'twoMin', label: '2د', type: 'number' },
                { key: 'red', label: 'استبعاد', type: 'number' }
            ],
            teamStats: [
                { key: 'shots', label: 'التسديدات', type: 'number' },
                { key: 'possession', label: 'الاستحواذ %', type: 'possession' }
            ]
        },
        volleyball: {
            name: 'كرة طائرة', icon: '🏐', pattern: 'volleyball',
            scoreKey: 'sets', scoreLabel: 'الأشواط',
            periods: 5, periodLabels: ['الشوط 1', 'الشوط 2', 'الشوط 3', 'الشوط 4', 'الشوط 5 (الفاصل)'],
            bestOf: 5,
            pointsPerSet: 25, pointsLastSet: 15, requiresLead: 2,
            hasRallyPointSystem: true,
            hasTimeouts: true, maxTimeoutsPerSet: 2, hasPlayerStats: true,
            leaguePoints: { win3_0: 3, win3_1: 3, win3_2: 2, loss0_3: 0, loss1_3: 0, loss2_3: 1 },
            playerStats: [
                { key: 'points', label: 'نقاط', type: 'number', isScore: true },
                { key: 'aces', label: 'Aces', type: 'number' },
                { key: 'blocks', label: 'صدات', type: 'number' },
                { key: 'attacks', label: 'هجمات', type: 'number' },
                { key: 'errors', label: 'أخطاء', type: 'number' }
            ],
            teamStats: []
        },
        tennis: {
            name: 'تنس أرضي', icon: '🎾', pattern: 'tennis',
            scoreKey: 'sets', scoreLabel: 'المجموعات',
            periods: 3, periodLabels: ['المجموعة 1', 'المجموعة 2', 'Tie-Break', 'المجموعة 3'],
            bestOf: 3, gamesToWinSet: 6, gamesDifferenceNeeded: 2,
            hasTieBreak: true, tieBreakPoints: 7, tieBreakMax: 18,
            hasFinalTieBreak10: true,
            hasDetailedPoints: true, pointSequence: [0, 15, 30, 40],
            hasPlayerStats: false, playerStats: [],
            leaguePoints: { win: 3, draw: 0, loss: 0 },
            teamStats: [
                { key: 'aces', label: 'Aces', type: 'number' },
                { key: 'doubleFaults', label: 'أخطاء مزدوجة', type: 'number' },
                { key: 'firstServePct', label: '% الإرسال الأول', type: 'number' },
                { key: 'winners', label: 'Winners', type: 'number' },
                { key: 'unforcedErrors', label: 'أخطاء غير إجبارية', type: 'number' },
                { key: 'breakPoints', label: 'Break Points', type: 'number' }
            ]
        },
        tableTennis: {
            name: 'تنس طاولة', icon: '🏓', pattern: 'tableTennis',
            scoreKey: 'sets', scoreLabel: 'الأشواط',
            periods: 5, periodLabels: ['G1', 'G2', 'G3', 'G4', 'G5'],
            bestOf: 5, pointsPerGame: 11, pointsTrackerMax: 20,
            hasDetailedPoints: true, hasPlayerStats: false, playerStats: [],
            leaguePoints: { win: 3, draw: 0, loss: 0 },
            teamStats: [
                { key: 'aces', label: 'إرسالات', type: 'number' },
                { key: 'winners', label: 'Winners', type: 'number' },
                { key: 'errors', label: 'أخطاء', type: 'number' }
            ]
        },
        squash: {
            name: 'أسكواش', icon: '🎾', pattern: 'tennis',
            scoreKey: 'sets', scoreLabel: 'الأشواط',
            periods: 5, periodLabels: ['الشوط 1', 'الشوط 2', 'الشوط 3', 'الشوط 4', 'الشوط 5'],
            bestOf: 5, hasTieBreak: true, tieBreakPoints: 11, tieBreakMax: 18,
            hasDetailedPoints: false, hasPlayerStats: false, playerStats: [],
            leaguePoints: { win: 3, draw: 0, loss: 0 },
            teamStats: [
                { key: 'winners', label: 'Winners', type: 'number' },
                { key: 'errors', label: 'أخطاء', type: 'number' },
                { key: 'distanceCovered', label: 'المسافة (كم)', type: 'number' }
            ]
        },
        padel: {
            name: 'بادل تنس', icon: '🎾', pattern: 'tennis',
            scoreKey: 'sets', scoreLabel: 'المجموعات',
            periods: 3, periodLabels: ['المجموعة 1', 'المجموعة 2', 'Tie-Break', 'المجموعة 3'],
            bestOf: 3, gamesToWinSet: 6, gamesDifferenceNeeded: 2,
            hasTieBreak: true, tieBreakPoints: 7, tieBreakMax: 12,
            hasDetailedPoints: false, hasPlayerStats: false, playerStats: [],
            leaguePoints: { win: 3, draw: 0, loss: 0 },
            teamStats: [
                { key: 'winners', label: 'Winners', type: 'number' },
                { key: 'errors', label: 'أخطاء', type: 'number' },
                { key: 'smash', label: 'Smash', type: 'number' }
            ]
        }
    };

    /* ============================================================
       الحالة الداخلية
       ============================================================ */
    let currentMatch = null;
    let currentMatchRef = null;
    let workingSheet = null;

    /* ============================================================
       إعدادات نوع اللعبة
       ============================================================ */
    function setGameType(type) {
        const App = window.App;
        if (!App || !App.state) return;
        App.state.gameType = type;
        App.saveSession();
        if (App.ui && App.ui.render) App.ui.render();
    }

    function getGameType() {
        const App = window.App;
        return (App && App.state && App.state.gameType) || 'football11';
    }

    function getSchema() {
        return SPORT_SCHEMAS[getGameType()] || SPORT_SCHEMAS.football11;
    }

    /* ============================================================
       إنشاء Sheet فارغ
       ============================================================ */
    function createEmptySheet(match, source) {
        const schema = getSchema();
        const team1Name = source === 'knockout' ? match.player1.name : match.team1;
        const team2Name = source === 'knockout' ? match.player2.name : match.team2;

        const emptyTeamStats = {};
        schema.teamStats.forEach(s => emptyTeamStats[s.key] = 0);

        const emptyPlayerStats = {};
        schema.playerStats.forEach(s => emptyPlayerStats[s.key] = 0);

        const emptyPeriods = [];
        for (let i = 0; i < schema.periods; i++) {
            emptyPeriods.push({
                period: i + 1, score1: null, score2: null, winner: null, games: {}
            });
        }

        const emptyTimeouts = { team1: [], team2: [] };

        const emptyAccumulatedFouls = {};
        if (schema.hasAccumulatedFouls) {
            emptyAccumulatedFouls.team1 = { h1: 0, h2: 0 };
            emptyAccumulatedFouls.team2 = { h1: 0, h2: 0 };
        }

        const emptyTeamFoulsPerQuarter = {};
        if (schema.hasTeamFouls && schema.foulsPerQuarter) {
            emptyTeamFoulsPerQuarter.team1 = new Array(schema.periods).fill(0);
            emptyTeamFoulsPerQuarter.team2 = new Array(schema.periods).fill(0);
        }

        return {
            gameType: getGameType(),
            pattern: schema.pattern,
            matchSource: source,

            matchInfo: {
                formNumber: '', facility: '', scorekeeper: '', referee: '',
                assistantReferee: '', matchNumber: '',
                date: new Date().toISOString().slice(0, 16),
                tournament: (window.App && window.App.state && window.App.state.tournamentName) || ''
            },

            teams: [
                { side: 1, name: team1Name,
                  players: schema.hasPlayerStats ? [createEmptyPlayer(emptyPlayerStats)] : [],
                  teamStats: { ...emptyTeamStats } },
                { side: 2, name: team2Name,
                  players: schema.hasPlayerStats ? [createEmptyPlayer(emptyPlayerStats)] : [],
                  teamStats: { ...emptyTeamStats } }
            ],

            periods: emptyPeriods,
            overtime: null,
            timeouts: emptyTimeouts,
            accumulatedFouls: emptyAccumulatedFouls,
            teamFoulsPerQuarter: emptyTeamFoulsPerQuarter,
            sevenMeters: { team1: 0, team2: 0 },

            goalLog: [],
            discipline: [],
            sanctions: [],

            tieBreak: { team1: [], team2: [], active: false },
            ttPoints: { games: [] },

            tennisDetailed: {
                currentGame: { team1: 0, team2: 0, advantage: null, deuce: false, isTiebreak: false },
                currentSet: { team1: 0, team2: 0 },
                server: 1, serverSide: 'right', tiebreakServeCount: 0,
                gameHistory: [], pointsLog: [], matchEnded: false, winner: null
            },

            signatures: {
                referee: '', scorekeeper: '', captainA: '', captainB: ''
            },

            motm: null
        };
    }

    function createEmptyPlayer(emptyStats) {
        return { number: '', name: '', stats: { ...emptyStats } };
    }

    /* ============================================================
       فتح Score Sheet
       ============================================================ */
    function open(roundIdx, matchIdx) {
        const App = window.App;
        if (!App || !App.state) return;
        const match = App.state.knockout.matches[roundIdx][matchIdx];
        if (!match) return;

        if (match.player1.type === 'BYE' || match.player2.type === 'BYE') {
            if (window.Toast) Toast.warning('لا يمكن فتح Score Sheet لمباراة BYE');
            return;
        }

        currentMatchRef = { type: 'knockout', roundIdx, matchIdx };
        currentMatch = match;

        workingSheet = (match.scoresheet && match.scoresheet.pattern)
            ? JSON.parse(JSON.stringify(match.scoresheet))
            : createEmptySheet(match, 'knockout');

        ensureNewFields();
        renderScoreSheet();
        document.getElementById('scoreSheetOverlay').classList.add('active');
        if (window.Sounds) Sounds.openModal();
    }

    function openGroupMatch(groupName, roundIdx, matchIdx) {
        const App = window.App;
        if (!App || !App.state) return;
        const group = App.state.groups.groups.find(g => g.name === groupName);
        if (!group) return;
        const match = group.rounds[roundIdx][matchIdx];
        if (!match) return;

        currentMatchRef = { type: 'group', groupName, roundIdx, matchIdx };
        currentMatch = match;

        workingSheet = (match.scoresheet && match.scoresheet.pattern)
            ? JSON.parse(JSON.stringify(match.scoresheet))
            : createEmptySheet(match, 'group');

        ensureNewFields();
        renderScoreSheet();
        document.getElementById('scoreSheetOverlay').classList.add('active');
        if (window.Sounds) Sounds.openModal();
    }

    function ensureNewFields() {
        if (!workingSheet.matchInfo) workingSheet.matchInfo = {};
        if (!workingSheet.matchInfo.formNumber) workingSheet.matchInfo.formNumber = '';
        if (!workingSheet.matchInfo.assistantReferee) workingSheet.matchInfo.assistantReferee = '';

        if (!workingSheet.signatures) {
            workingSheet.signatures = { referee: '', scorekeeper: '', captainA: '', captainB: '' };
        }

        if (!workingSheet.ttPoints) workingSheet.ttPoints = { games: [] };

        if (!workingSheet.tennisDetailed) {
            workingSheet.tennisDetailed = {
                currentGame: { team1: 0, team2: 0, advantage: null, deuce: false, isTiebreak: false },
                currentSet: { team1: 0, team2: 0 },
                server: 1, serverSide: 'right', tiebreakServeCount: 0,
                gameHistory: [], pointsLog: [], matchEnded: false, winner: null
            };
        }

        const td = workingSheet.tennisDetailed;
        if (!td.server) td.server = 1;
        if (!td.serverSide) td.serverSide = 'right';
        if (td.tiebreakServeCount === undefined) td.tiebreakServeCount = 0;
        if (!td.pointsLog) td.pointsLog = [];
        if (!td.currentSet) td.currentSet = { team1: 0, team2: 0 };
        if (!td.currentGame) td.currentGame = { team1: 0, team2: 0, advantage: null, deuce: false, isTiebreak: false };
        if (td.currentGame.isTiebreak === undefined) td.currentGame.isTiebreak = false;
        if (td.matchEnded === undefined) td.matchEnded = false;

        if (!workingSheet.overtime && getSchema().hasOvertime) {
            workingSheet.overtime = { score1: 0, score2: 0 };
        }
        if (!workingSheet.sevenMeters) workingSheet.sevenMeters = { team1: 0, team2: 0 };

        (workingSheet.periods || []).forEach(p => { if (!p.games) p.games = {}; });
    }

    function close() {
        document.getElementById('scoreSheetOverlay').classList.remove('active');
        currentMatch = null;
        currentMatchRef = null;
        workingSheet = null;
        if (window.Sounds) Sounds.closeModal();
    }

    function render() {
        if (workingSheet) renderScoreSheet();
    }

    /* ============================================================
       Router
       ============================================================ */
    function renderScoreSheet() {
        const schema = getSchema();
        const title = document.getElementById('scoreSheetTitle');
        const sourceLabel = currentMatchRef && currentMatchRef.type === 'group'
            ? `📋 [المجموعة ${currentMatchRef.groupName}]` : '📋';
        title.textContent = `${sourceLabel} ${schema.icon} Score Sheet — ${schema.name}`;

        const body = document.getElementById('scoreSheetBody');
        const matchInfoHTML = renderMatchInfo();

        let patternHTML = '';
        switch (schema.pattern) {
            case 'football': patternHTML = renderFootballPattern(schema); break;
            case 'basketball': patternHTML = renderBasketballPattern(schema); break;
            case 'handball': patternHTML = renderHandballPattern(schema); break;
            case 'volleyball': patternHTML = renderVolleyballPattern(schema); break;
            case 'tennis': patternHTML = renderTennisPattern(schema); break;
            case 'tableTennis': patternHTML = renderTableTennisPattern(schema); break;
            default: patternHTML = renderFootballPattern(schema);
        }

        const signaturesHTML = renderSignatures();
        const motmHTML = renderMotmSection();

        body.innerHTML = matchInfoHTML + patternHTML + motmHTML + signaturesHTML;
    }

    /* ============================================================
       معلومات المباراة
       ============================================================ */
    function renderMatchInfo() {
        const info = workingSheet.matchInfo || {};
        const schema = getSchema();
        return `
            <div class="ss-match-info-section">
                <div class="ss-official-header">
                    <div class="ss-official-badge">
                        <span class="form-num-label">الاستمارة رقم:</span>
                        <input type="text" value="${info.formNumber || ''}"
                               onchange="ScoreSheet.updateMatchInfo('formNumber', this.value)"
                               placeholder="01" class="form-num-input">
                    </div>
                    <div class="ss-official-title">
                        <h4>السجل الموحد لإدارة الصالات والبطولات الرياضية</h4>
                        <p>استمارة تسجيل وتدوين المباريات الرسمية</p>
                    </div>
                </div>
                <h3>📋 معلومات المباراة الرسمية — ${schema.icon} ${schema.name}</h3>
                <div class="ss-match-info-grid">
                    <div class="ss-info-field">
                        <label>المنشأة / الصالة:</label>
                        <input type="text" value="${info.facility || ''}"
                               onchange="ScoreSheet.updateMatchInfo('facility', this.value)"
                               placeholder="الملعب الرئيسي">
                    </div>
                    <div class="ss-info-field">
                        <label>المسجل / حكم الطاولة:</label>
                        <input type="text" value="${info.scorekeeper || ''}"
                               onchange="ScoreSheet.updateMatchInfo('scorekeeper', this.value)"
                               placeholder="اسم المسجل">
                    </div>
                    <div class="ss-info-field">
                        <label>رقم المباراة / المجموعة:</label>
                        <input type="text" value="${info.matchNumber || ''}"
                               onchange="ScoreSheet.updateMatchInfo('matchNumber', this.value)"
                               placeholder="Match #A-102">
                    </div>
                    <div class="ss-info-field">
                        <label>حكم الساحة / الرئيسي:</label>
                        <input type="text" value="${info.referee || ''}"
                               onchange="ScoreSheet.updateMatchInfo('referee', this.value)"
                               placeholder="اسم الحكم">
                    </div>
                    <div class="ss-info-field">
                        <label>الحكم المساعد (اختياري):</label>
                        <input type="text" value="${info.assistantReferee || ''}"
                               onchange="ScoreSheet.updateMatchInfo('assistantReferee', this.value)"
                               placeholder="اسم الحكم المساعد">
                    </div>
                    <div class="ss-info-field">
                        <label>التاريخ والوقت:</label>
                        <input type="datetime-local" value="${info.date || ''}"
                               onchange="ScoreSheet.updateMatchInfo('date', this.value)">
                    </div>
                    <div class="ss-info-field">
                        <label>البطولة / الفعالية:</label>
                        <input type="text" value="${info.tournament || ''}"
                               onchange="ScoreSheet.updateMatchInfo('tournament', this.value)"
                               placeholder="اسم البطولة">
                    </div>
                </div>
                <div class="ss-teams-header">
                    <div class="ss-team-header team-a">
                        <span class="team-label">الفريق (أ)</span>
                        <span class="team-name">${workingSheet.teams[0].name}</span>
                    </div>
                    <div class="ss-vs-divider">VS</div>
                    <div class="ss-team-header team-b">
                        <span class="team-label">الفريق (ب)</span>
                        <span class="team-name">${workingSheet.teams[1].name}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function updateMatchInfo(key, value) { workingSheet.matchInfo[key] = value; }

    /* ============================================================
       التوقيعات
       ============================================================ */
    function renderSignatures() {
        const sig = workingSheet.signatures || {};
        const schema = getSchema();
        let scorekeeperLabel = 'المسجل / الميقاني';
        let refereeLabel = 'حكم الساحة / الرئيسي';
        let captainALabel = 'كابتن الفريق (أ)';
        let captainBLabel = 'كابتن الفريق (ب)';

        if (schema.pattern === 'tennis' || schema.pattern === 'tableTennis') {
            refereeLabel = 'حكم الكرسي (Chair Umpire)';
            scorekeeperLabel = 'مراقب المباراة';
            captainALabel = 'توقيع الفائز';
            captainBLabel = 'توقيع الخاسر';
        } else if (schema.pattern === 'basketball' || schema.pattern === 'volleyball') {
            scorekeeperLabel = 'الميقاتي / المسجل';
        } else if (schema.pattern === 'handball') {
            scorekeeperLabel = 'مسجل كرة اليد';
        }

        return `
            <div class="ss-signatures-section">
                <h3>✍️ التوقيعات الرسمية</h3>
                <div class="ss-signatures-grid">
                    <div class="ss-sig-block">
                        <div class="ss-sig-input-wrapper">
                            <input type="text" value="${sig.referee || ''}"
                                   onchange="ScoreSheet.updateSignature('referee', this.value)" placeholder="اسم الحكم">
                        </div>
                        <div class="ss-sig-line"></div>
                        <div class="ss-sig-label">${refereeLabel}</div>
                    </div>
                    <div class="ss-sig-block">
                        <div class="ss-sig-input-wrapper">
                            <input type="text" value="${sig.scorekeeper || ''}"
                                   onchange="ScoreSheet.updateSignature('scorekeeper', this.value)" placeholder="اسم المسجل">
                        </div>
                        <div class="ss-sig-line"></div>
                        <div class="ss-sig-label">${scorekeeperLabel}</div>
                    </div>
                    <div class="ss-sig-block">
                        <div class="ss-sig-input-wrapper">
                            <input type="text" value="${sig.captainA || ''}"
                                   onchange="ScoreSheet.updateSignature('captainA', this.value)" placeholder="اسم الكابتن">
                        </div>
                        <div class="ss-sig-line"></div>
                        <div class="ss-sig-label">${captainALabel}</div>
                    </div>
                    <div class="ss-sig-block">
                        <div class="ss-sig-input-wrapper">
                            <input type="text" value="${sig.captainB || ''}"
                                   onchange="ScoreSheet.updateSignature('captainB', this.value)" placeholder="اسم الكابتن">
                        </div>
                        <div class="ss-sig-line"></div>
                        <div class="ss-sig-label">${captainBLabel}</div>
                    </div>
                </div>
            </div>
        `;
    }

    function updateSignature(key, value) {
        if (!workingSheet.signatures) workingSheet.signatures = {};
        workingSheet.signatures[key] = value;
    }

    /* ============================================================
       نمط كرة القدم
       ============================================================ */
    function renderFootballPattern(schema) {
        return `
            <div class="ss-section football-goals-section">
                <h3>⚽ سجل الأهداف (Goal Log)</h3>
                ${renderGoalsTable(schema)}
                <button class="ss-add-btn" onclick="ScoreSheet.addGoalLogEntryUI()">➕ إضافة هدف</button>
            </div>
            ${schema.hasTimeouts ? renderTimeoutsSection(schema) : ''}
            ${schema.hasAccumulatedFouls ? renderAccumulatedFoulsSection() : ''}
            ${schema.hasDiscipline ? renderDisciplineSection(schema) : ''}
            ${renderFinalScore()}
            ${renderPlayersSection(schema)}
            ${schema.teamStats.length > 0 ? renderTeamStatsSection(schema) : ''}
        `;
    }

    function renderGoalsTable(schema) {
        const goalLog = workingSheet.goalLog || [];
        const teamA = workingSheet.teams[0].name;
        const teamB = workingSheet.teams[1].name;
        const showExtraTime = schema.hasExtraTimeColumn;

        if (goalLog.length === 0) {
            return `<table class="ss-goals-table">
                <thead><tr>
                    <th>#</th><th>الدقيقة</th><th>الفريق</th>
                    <th>رقم اللاعب</th><th>اسم اللاعب</th><th>النوع</th>
                    ${showExtraTime ? '<th>إضافي</th>' : ''}<th>حذف</th>
                </tr></thead>
                <tbody><tr><td colspan="${showExtraTime ? 8 : 7}" class="ss-empty-row">لا توجد أهداف مسجلة بعد</td></tr></tbody>
            </table>`;
        }

        return `<table class="ss-goals-table">
            <thead><tr>
                <th>#</th><th>الدقيقة</th><th>الفريق</th>
                <th>رقم اللاعب</th><th>اسم اللاعب</th><th>النوع</th>
                ${showExtraTime ? '<th>إضافي</th>' : ''}<th>حذف</th>
            </tr></thead>
            <tbody>
                ${goalLog.map((g, i) => `
                    <tr class="${g.isExtraTime ? 'extra-time-row' : ''}">
                        <td>${i + 1}</td>
                        <td><input type="number" min="0" max="120" value="${g.minute || ''}"
                                   onchange="ScoreSheet.updateGoalEntry('${g.id}', 'minute', this.value)" style="width:60px;"></td>
                        <td>${g.side === 1 ? `أ: ${teamA}` : `ب: ${teamB}`}</td>
                        <td><input type="number" min="0" max="99" value="${g.playerNumber || ''}"
                                   onchange="ScoreSheet.updateGoalEntry('${g.id}', 'playerNumber', this.value)" style="width:60px;"></td>
                        <td><input type="text" value="${g.playerName || ''}"
                                   onchange="ScoreSheet.updateGoalEntry('${g.id}', 'playerName', this.value)" placeholder="اسم اللاعب"></td>
                        <td>${g.goalType || 'عادي'}</td>
                        ${showExtraTime ? `<td><input type="checkbox" ${g.isExtraTime ? 'checked' : ''}
                                           onchange="ScoreSheet.toggleGoalExtraTime('${g.id}', this.checked)"></td>` : ''}
                        <td><button class="ss-remove-row" onclick="ScoreSheet.removeGoalEntry('${g.id}')">✕</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>`;
    }

    function addGoalLogEntryUI() {
        const side = prompt('الفريق (1 = أ، 2 = ب):', '1');
        if (!side || !['1', '2'].includes(side)) return;
        const playerNumber = prompt('رقم اللاعب:', '') || '';
        const playerName = prompt('اسم اللاعب:', '') || '';
        const goalType = prompt('نوع الهدف (عادي/جزاء/عكس):', 'عادي') || 'عادي';
        const minute = prompt('الدقيقة:', '') || '';
        if (!['عادي', 'جزاء', 'عكس'].includes(goalType)) {
            if (window.Toast) Toast.error('نوع الهدف غير صحيح'); return;
        }
        addGoalLogEntry(parseInt(side), playerNumber, playerName, goalType, parseInt(minute) || 0);
        if (window.Sounds) Sounds.goal();
        renderScoreSheet();
    }

    function addGoalLogEntry(side, playerNumber, playerName, goalType, minute) {
        workingSheet.goalLog.push({
            id: Date.now() + Math.random(), side, playerNumber, playerName,
            goalType, minute, isExtraTime: false, period: 1
        });
        updateTotalsFromGoalLog();
    }

    function updateGoalEntry(id, field, value) {
        const goal = workingSheet.goalLog.find(g => String(g.id) === String(id));
        if (!goal) return;
        if (field === 'minute' || field === 'playerNumber') goal[field] = parseInt(value) || 0;
        else goal[field] = value;
        updateTotalsFromGoalLog();
    }

    function toggleGoalExtraTime(id, checked) {
        const goal = workingSheet.goalLog.find(g => String(g.id) === String(id));
        if (!goal) return;
        goal.isExtraTime = checked;
    }

    function removeGoalEntry(id) {
        if (!confirm('حذف هذا الهدف؟')) return;
        workingSheet.goalLog = workingSheet.goalLog.filter(g => String(g.id) !== String(id));
        updateTotalsFromGoalLog();
        renderScoreSheet();
    }

    function updateTotalsFromGoalLog() {
        const schema = getSchema();
        if (!schema.hasGoalLog) return;
        const score1 = workingSheet.goalLog.filter(g => g.side === 1 && g.goalType !== 'عكس').length
                     + workingSheet.goalLog.filter(g => g.side === 2 && g.goalType === 'عكس').length;
        const score2 = workingSheet.goalLog.filter(g => g.side === 2 && g.goalType !== 'عكس').length
                     + workingSheet.goalLog.filter(g => g.side === 1 && g.goalType === 'عكس').length;
        workingSheet.finalScore = { score1, score2 };
    }

    function renderTimeoutsSection(schema) {
        const t1 = workingSheet.timeouts.team1 || [];
        const t2 = workingSheet.timeouts.team2 || [];
        return `
            <div class="ss-section">
                <h3>⏱️ الأوقات المستقطعة (Time-Outs)</h3>
                <div class="ss-timeouts-grid">
                    <div class="ss-timeouts-team team-a">
                        <div class="ss-timeouts-title">${workingSheet.teams[0].name}</div>
                        <div class="ss-timeouts-list">
                            ${t1.length === 0 ? '<em>لا توجد</em>' :
                              t1.map((t, i) => `<span class="ss-timeout-chip">شوط ${t.period}
                                <button onclick="ScoreSheet.removeTimeout(1, ${t.period}, ${i})">✕</button></span>`).join('')}
                        </div>
                        <button class="ss-add-timeout" onclick="ScoreSheet.addTimeoutUI(1)">➕ إضافة</button>
                    </div>
                    <div class="ss-timeouts-team team-b">
                        <div class="ss-timeouts-title">${workingSheet.teams[1].name}</div>
                        <div class="ss-timeouts-list">
                            ${t2.length === 0 ? '<em>لا توجد</em>' :
                              t2.map((t, i) => `<span class="ss-timeout-chip">شوط ${t.period}
                                <button onclick="ScoreSheet.removeTimeout(2, ${t.period}, ${i})">✕</button></span>`).join('')}
                        </div>
                        <button class="ss-add-timeout" onclick="ScoreSheet.addTimeoutUI(2)">➕ إضافة</button>
                    </div>
                </div>
            </div>
        `;
    }

    function addTimeoutUI(side) {
        const period = prompt('رقم الشوط/الربع:', '1');
        if (!period) return;
        addTimeout(side, parseInt(period));
        renderScoreSheet();
    }

    function addTimeout(side, period) {
        const schema = getSchema();
        if (!schema.hasTimeouts) return;
        const key = side === 1 ? 'team1' : 'team2';
        if (!workingSheet.timeouts[key]) workingSheet.timeouts[key] = [];
        const maxAllowed = schema.maxTimeoutsPerSet || schema.maxTimeouts || 3;
        const periodTimeouts = workingSheet.timeouts[key].filter(t => t.period === period);
        if (periodTimeouts.length >= maxAllowed) {
            if (window.Toast) Toast.warning(`الحد الأقصى ${maxAllowed} أوقات مستقطعة`); return;
        }
        workingSheet.timeouts[key].push({ period, time: new Date().toISOString() });
    }

    function removeTimeout(side, period, index) {
        const key = side === 1 ? 'team1' : 'team2';
        if (!workingSheet.timeouts[key]) return;
        const periodTimeouts = workingSheet.timeouts[key].filter(t => t.period === period);
        if (periodTimeouts[index]) {
            const target = periodTimeouts[index];
            const globalIdx = workingSheet.timeouts[key].indexOf(target);
            if (globalIdx > -1) workingSheet.timeouts[key].splice(globalIdx, 1);
        }
        renderScoreSheet();
    }

    function removeTimeoutUI(side, period) {
        const key = side === 1 ? 'team1' : 'team2';
        const timeouts = workingSheet.timeouts[key] || [];
        const idx = timeouts.findIndex(t => t.period === period);
        if (idx > -1) { timeouts.splice(idx, 1); renderScoreSheet(); }
    }

    function toggleTimeout(side, period, checked) {
        const key = side === 1 ? 'team1' : 'team2';
        if (!workingSheet.timeouts[key]) workingSheet.timeouts[key] = [];
        if (checked) {
            if (!workingSheet.timeouts[key].some(t => t.period === period)) {
                workingSheet.timeouts[key].push({ period });
            }
        } else {
            workingSheet.timeouts[key] = workingSheet.timeouts[key].filter(t => t.period !== period);
        }
        renderScoreSheet();
    }

    function renderAccumulatedFoulsSection() {
        const af = workingSheet.accumulatedFouls || {
            team1: { h1: 0, h2: 0 }, team2: { h1: 0, h2: 0 }
        };
        return `
            <div class="ss-section">
                <h3>⚠️ الأخطاء التراكمية (Accumulated Fouls) - 5 أخطاء = ركلة حرة 10م</h3>
                <div class="ss-accum-fouls-grid">
                    <div class="team-a">
                        <div class="team-title">${workingSheet.teams[0].name}</div>
                        <div class="foul-row">
                            <label>الشوط الأول:</label>
                            <div class="fouls-checkboxes">
                                ${[1,2,3,4,5].map(n => `<label class="foul-cb">
                                    <input type="checkbox" ${af.team1.h1 >= n ? 'checked' : ''}
                                           onchange="ScoreSheet.updateAccumFoul(1, 'h1', ${n})">${n}
                                </label>`).join('')}
                                <span class="plus-six">+6</span>
                            </div>
                        </div>
                        <div class="foul-row">
                            <label>الشوط الثاني:</label>
                            <div class="fouls-checkboxes">
                                ${[1,2,3,4,5].map(n => `<label class="foul-cb">
                                    <input type="checkbox" ${af.team1.h2 >= n ? 'checked' : ''}
                                           onchange="ScoreSheet.updateAccumFoul(1, 'h2', ${n})">${n}
                                </label>`).join('')}
                                <span class="plus-six">+6</span>
                            </div>
                        </div>
                    </div>
                    <div class="team-b">
                        <div class="team-title">${workingSheet.teams[1].name}</div>
                        <div class="foul-row">
                            <label>الشوط الأول:</label>
                            <div class="fouls-checkboxes">
                                ${[1,2,3,4,5].map(n => `<label class="foul-cb">
                                    <input type="checkbox" ${af.team2.h1 >= n ? 'checked' : ''}
                                           onchange="ScoreSheet.updateAccumFoul(2, 'h1', ${n})">${n}
                                </label>`).join('')}
                                <span class="plus-six">+6</span>
                            </div>
                        </div>
                        <div class="foul-row">
                            <label>الشوط الثاني:</label>
                            <div class="fouls-checkboxes">
                                ${[1,2,3,4,5].map(n => `<label class="foul-cb">
                                    <input type="checkbox" ${af.team2.h2 >= n ? 'checked' : ''}
                                           onchange="ScoreSheet.updateAccumFoul(2, 'h2', ${n})">${n}
                                </label>`).join('')}
                                <span class="plus-six">+6</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function updateAccumFoul(side, half, value) {
        const key = side === 1 ? 'team1' : 'team2';
        if (!workingSheet.accumulatedFouls) {
            workingSheet.accumulatedFouls = { team1: { h1: 0, h2: 0 }, team2: { h1: 0, h2: 0 } };
        }
        workingSheet.accumulatedFouls[key][half] = value;
    }

    function renderDisciplineSection(schema) {
        const list = workingSheet.discipline || [];
        return `
            <div class="ss-section">
                <h3>🟨 سجل المخالفات والإنذارات (Disciplinary)</h3>
                <table class="ss-discipline-table">
                    <thead><tr><th>#</th><th>الدقيقة</th><th>الفريق</th><th>رقم اللاعب</th><th>النوع</th><th>حذف</th></tr></thead>
                    <tbody>
                        ${list.length === 0 ? '<tr><td colspan="6" class="ss-empty-row">لا توجد مخالفات</td></tr>' :
                          list.map((d, i) => `<tr>
                            <td>${i + 1}</td><td>${d.minute || '-'}</td><td>${d.side === 1 ? 'أ' : 'ب'}</td>
                            <td>${d.playerNumber || '-'}</td>
                            <td>${d.type === 'yellow' ? '🟨 إنذار' : '🟥 طرد'}</td>
                            <td><button class="ss-remove-row" onclick="ScoreSheet.removeDiscipline('${d.id}')">✕</button></td>
                          </tr>`).join('')}
                    </tbody>
                </table>
                <div class="ss-discipline-add">
                    <button onclick="ScoreSheet.addDisciplineUI(1)">🟨 إنذار/طرد للفريق أ</button>
                    <button onclick="ScoreSheet.addDisciplineUI(2)">🟨 إنذار/طرد للفريق ب</button>
                </div>
            </div>
        `;
    }

    function addDisciplineUI(side) {
        const playerNumber = prompt('رقم اللاعب:', '') || '';
        const type = prompt('النوع (yellow/red):', 'yellow') || 'yellow';
        const minute = prompt('الدقيقة:', '') || '';
        if (!['yellow', 'red'].includes(type)) return alert('نوع غير صحيح');
        addDiscipline(side, playerNumber, '', type, parseInt(minute) || 0);
        if (window.Sounds) Sounds.warning();
        renderScoreSheet();
    }

    function addDiscipline(side, playerNumber, playerName, type, minute) {
        workingSheet.discipline.push({
            id: Date.now() + Math.random(), side, playerNumber, playerName, type, minute, period: 1
        });
    }

    function removeDiscipline(id) {
        workingSheet.discipline = workingSheet.discipline.filter(d => String(d.id) !== String(id));
        renderScoreSheet();
    }

    /* ============================================================
       نمط كرة السلة - مع 1/2/3 نقاط
       ============================================================ */
    function renderBasketballPattern(schema) {
        return `
            <div class="ss-section">
                <h3>🏀 جدول تسجيل النقاط للأرباع (FIBA - 4 × 10 دقائق)</h3>
                ${renderQuartersTable(schema)}
            </div>
            <div class="ss-section">
                <h3>⚠️ أخطاء الفريق والأوقات المستقطعة</h3>
                ${renderTeamFoulsTable(schema)}
            </div>
            ${renderBasketballPointTypes()}
            ${renderPlayersSection(schema)}
        `;
    }

    function renderBasketballPointTypes() {
        return `
            <div class="ss-section basketball-points-guide">
                <h3>🎯 نظام النقاط (FIBA)</h3>
                <div class="bball-points-guide">
                    <div class="bball-point-item free">
                        <div class="bball-point-icon">🎯</div>
                        <div class="bball-point-value">1</div>
                        <div class="bball-point-label">رمية حرة</div>
                        <div class="bball-point-desc">تُنفذ بعد الأخطاء الشخصية</div>
                    </div>
                    <div class="bball-point-item two">
                        <div class="bball-point-icon">🏀</div>
                        <div class="bball-point-value">2</div>
                        <div class="bball-point-label">تسديدة عادية</div>
                        <div class="bball-point-desc">داخل قوس الثلاث نقاط</div>
                    </div>
                    <div class="bball-point-item three">
                        <div class="bball-point-icon">🎯</div>
                        <div class="bball-point-value">3</div>
                        <div class="bball-point-label">ثلاثية</div>
                        <div class="bball-point-desc">خارج قوس الثلاث نقاط</div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderQuartersTable(schema) {
        const periods = workingSheet.periods || [];
        const finalScore = computeFinalScore();
        return `
            <table class="ss-quarters-table">
                <thead><tr>
                    <th>الفريق</th>
                    ${schema.periodLabels.map(l => `<th>${l}</th>`).join('')}
                    <th>وقت إضافي (OT)</th>
                    <th>النتيجة النهائية</th>
                </tr></thead>
                <tbody>
                    <tr class="team-a-row">
                        <td><strong>${workingSheet.teams[0].name}</strong></td>
                        ${periods.map((p, i) => `<td><input type="number" min="0" value="${p.score1 ?? ''}"
                            onchange="ScoreSheet.updatePeriodScore(${i}, 1, this.value)" class="ss-period-input"></td>`).join('')}
                        <td><input type="number" min="0"
                            value="${workingSheet.overtime ? (workingSheet.overtime.score1 ?? '') : ''}"
                            onchange="ScoreSheet.updateOvertime(1, this.value)" class="ss-period-input"></td>
                        <td class="ss-final-cell"><strong>${finalScore.score1}</strong></td>
                    </tr>
                    <tr class="team-b-row">
                        <td><strong>${workingSheet.teams[1].name}</strong></td>
                        ${periods.map((p, i) => `<td><input type="number" min="0" value="${p.score2 ?? ''}"
                            onchange="ScoreSheet.updatePeriodScore(${i}, 2, this.value)" class="ss-period-input"></td>`).join('')}
                        <td><input type="number" min="0"
                            value="${workingSheet.overtime ? (workingSheet.overtime.score2 ?? '') : ''}"
                            onchange="ScoreSheet.updateOvertime(2, this.value)" class="ss-period-input"></td>
                        <td class="ss-final-cell"><strong>${finalScore.score2}</strong></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function renderTeamFoulsTable(schema) {
        const t1Fouls = workingSheet.teamFoulsPerQuarter.team1 || [];
        const t2Fouls = workingSheet.teamFoulsPerQuarter.team2 || [];
        const t1Timeouts = workingSheet.timeouts.team1 || [];
        const t2Timeouts = workingSheet.timeouts.team2 || [];
        return `
            <div class="ss-fouls-timeouts-wrapper">
                <div class="ss-fouls-block team-a">
                    <div class="block-title">${workingSheet.teams[0].name}</div>
                    <table class="ss-fouls-table">
                        <thead><tr>${schema.periodLabels.map(l => `<th>${l}</th>`).join('')}</tr></thead>
                        <tbody><tr>
                            ${t1Fouls.map((f, i) => `<td><input type="number" min="0" max="5" value="${f || 0}"
                                onchange="ScoreSheet.updateTeamFoul(1, ${i}, this.value)" class="ss-foul-input"></td>`).join('')}
                        </tr></tbody>
                    </table>
                    <div class="ss-t-outs">
                        <label>الأوقات المستقطعة:</label>
                        ${schema.periodLabels.map((l, i) => `<span class="t-out-chip">${l}:
                            <button onclick="ScoreSheet.addTimeout(1, ${i + 1}); ScoreSheet.render()">➕</button>
                            ${t1Timeouts.filter(t => t.period === i + 1).length}
                        </span>`).join('')}
                    </div>
                </div>
                <div class="ss-fouls-block team-b">
                    <div class="block-title">${workingSheet.teams[1].name}</div>
                    <table class="ss-fouls-table">
                        <thead><tr>${schema.periodLabels.map(l => `<th>${l}</th>`).join('')}</tr></thead>
                        <tbody><tr>
                            ${t2Fouls.map((f, i) => `<td><input type="number" min="0" max="5" value="${f || 0}"
                                onchange="ScoreSheet.updateTeamFoul(2, ${i}, this.value)" class="ss-foul-input"></td>`).join('')}
                        </tr></tbody>
                    </table>
                    <div class="ss-t-outs">
                        <label>الأوقات المستقطعة:</label>
                        ${schema.periodLabels.map((l, i) => `<span class="t-out-chip">${l}:
                            <button onclick="ScoreSheet.addTimeout(2, ${i + 1}); ScoreSheet.render()">➕</button>
                            ${t2Timeouts.filter(t => t.period === i + 1).length}
                        </span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function updateTeamFoul(side, quarterIdx, value) {
        const key = side === 1 ? 'team1' : 'team2';
        if (!workingSheet.teamFoulsPerQuarter[key]) workingSheet.teamFoulsPerQuarter[key] = [];
        workingSheet.teamFoulsPerQuarter[key][quarterIdx] = parseInt(value) || 0;
    }

    function updateOvertime(side, value) {
        if (!workingSheet.overtime) workingSheet.overtime = { score1: 0, score2: 0 };
        if (side === 1) workingSheet.overtime.score1 = parseInt(value) || 0;
        else workingSheet.overtime.score2 = parseInt(value) || 0;
    }

    /* ============================================================
       نمط كرة اليد
       ============================================================ */
    function renderHandballPattern(schema) {
        return `
            <div class="ss-section">
                <h3>🤾 ملخص الشوطين (2 × 30 دقيقة) والأوقات المستقطعة</h3>
                ${renderHalvesTable(schema)}
            </div>
            <div class="ss-section">
                <h3>🟨 السجل التأديبي للاعبين (IHF Sanctions)</h3>
                ${renderHandballSanctions()}
            </div>
            ${renderPlayersSection(schema)}
        `;
    }

    function renderHalvesTable(schema) {
        const periods = workingSheet.periods || [];
        const finalScore = computeFinalScore();
        return `
            <table class="ss-halves-table">
                <thead><tr>
                    <th>الفريق</th><th>الشوط الأول</th><th>الشوط الثاني</th>
                    <th>رميات 7 أمتار</th><th>الأوقات المستقطعة (T.O)</th>
                    <th>النتيجة النهائية</th>
                </tr></thead>
                <tbody>
                    <tr class="team-a-row">
                        <td><strong>${workingSheet.teams[0].name}</strong></td>
                        <td><input type="number" min="0" value="${periods[0]?.score1 ?? ''}"
                            onchange="ScoreSheet.updatePeriodScore(0, 1, this.value)" class="ss-period-input"></td>
                        <td><input type="number" min="0" value="${periods[1]?.score1 ?? ''}"
                            onchange="ScoreSheet.updatePeriodScore(1, 1, this.value)" class="ss-period-input"></td>
                        <td><input type="number" min="0" value="${workingSheet.sevenMeters?.team1 || 0}"
                            onchange="ScoreSheet.updateSevenMeters(1, this.value)" class="ss-period-input"></td>
                        <td><div class="ss-timeouts-chips">
                            ${[1, 2, 3].map(t => `<label class="t-chip">
                                <input type="checkbox"
                                       ${(workingSheet.timeouts.team1 || []).some(x => x.period === t) ? 'checked' : ''}
                                       onchange="ScoreSheet.toggleTimeout(1, ${t}, this.checked)">T${t}
                            </label>`).join('')}
                        </div></td>
                        <td class="ss-final-cell"><strong>${finalScore.score1}</strong></td>
                    </tr>
                    <tr class="team-b-row">
                        <td><strong>${workingSheet.teams[1].name}</strong></td>
                        <td><input type="number" min="0" value="${periods[0]?.score2 ?? ''}"
                            onchange="ScoreSheet.updatePeriodScore(0, 2, this.value)" class="ss-period-input"></td>
                        <td><input type="number" min="0" value="${periods[1]?.score2 ?? ''}"
                            onchange="ScoreSheet.updatePeriodScore(1, 2, this.value)" class="ss-period-input"></td>
                        <td><input type="number" min="0" value="${workingSheet.sevenMeters?.team2 || 0}"
                            onchange="ScoreSheet.updateSevenMeters(2, this.value)" class="ss-period-input"></td>
                        <td><div class="ss-timeouts-chips">
                            ${[1, 2, 3].map(t => `<label class="t-chip">
                                <input type="checkbox"
                                       ${(workingSheet.timeouts.team2 || []).some(x => x.period === t) ? 'checked' : ''}
                                       onchange="ScoreSheet.toggleTimeout(2, ${t}, this.checked)">T${t}
                            </label>`).join('')}
                        </div></td>
                        <td class="ss-final-cell"><strong>${finalScore.score2}</strong></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function updateSevenMeters(side, value) {
        if (!workingSheet.sevenMeters) workingSheet.sevenMeters = { team1: 0, team2: 0 };
        const key = side === 1 ? 'team1' : 'team2';
        workingSheet.sevenMeters[key] = parseInt(value) || 0;
    }

    function renderHandballSanctions() {
        const sanctions = workingSheet.sanctions || [];
        return `
            <table class="ss-sanctions-table">
                <thead><tr>
                    <th>رقم اللاعب</th><th>اسم اللاعب</th><th>الفريق</th>
                    <th>🟨 إنذار</th><th>⏱️ إيقاف 2د</th>
                    <th>⏱️⏱️ دقيقتين مرتين</th><th>🟥 استبعاد</th><th>حذف</th>
                </tr></thead>
                <tbody>
                    ${sanctions.length === 0 ? '<tr><td colspan="8" class="ss-empty-row">لا توجد عقوبات</td></tr>' :
                      sanctions.map(s => `<tr>
                        <td>${s.playerNumber || '-'}</td>
                        <td>${s.playerName || '-'}</td>
                        <td>${s.side === 1 ? 'أ' : 'ب'}</td>
                        <td>${s.type === 'yellow' ? '☑️' : '☐'}</td>
                        <td>${s.type === 'twoMin' ? '☑️' : '☐'}</td>
                        <td>${s.type === 'twoMinX2' ? '☑️' : '☐'}</td>
                        <td>${s.type === 'red' ? '☑️' : '☐'}</td>
                        <td><button class="ss-remove-row" onclick="ScoreSheet.removeSanction('${s.id}')">✕</button></td>
                      </tr>`).join('')}
                </tbody>
            </table>
            <button class="ss-add-btn" onclick="ScoreSheet.addSanctionUI()">➕ إضافة عقوبة</button>
        `;
    }

    function addSanctionUI() {
        const side = prompt('الفريق (1 = أ، 2 = ب):', '1');
        if (!['1', '2'].includes(side)) return;
        const playerNumber = prompt('رقم اللاعب:', '') || '';
        const playerName = prompt('اسم اللاعب:', '') || '';
        const typePrompt = prompt('النوع:\n1 = yellow (إنذار)\n2 = twoMin (إيقاف 2د)\n3 = twoMinX2 (دقيقتين مرتين)\n4 = red (استبعاد)', '1');
        const typeMap = { '1': 'yellow', '2': 'twoMin', '3': 'twoMinX2', '4': 'red' };
        const type = typeMap[typePrompt];
        if (!type) return alert('نوع غير صحيح');
        addSanction(parseInt(side), playerNumber, playerName, type);
        if (window.Sounds) Sounds.warning();
        renderScoreSheet();
    }

    function addSanction(side, playerNumber, playerName, type) {
        workingSheet.sanctions.push({
            id: Date.now() + Math.random(), side, playerNumber, playerName, type,
            timestamp: new Date().toISOString()
        });
    }

    function removeSanction(id) {
        workingSheet.sanctions = workingSheet.sanctions.filter(s => String(s.id) !== String(id));
        renderScoreSheet();
    }

    /* ============================================================
       نمط كرة الطائرة - Rally Point System
       ============================================================ */
    function renderVolleyballPattern(schema) {
        return `
            <div class="ss-section">
                <h3>🏐 نظام النقاط المباشرة (Rally Point System) - Best of 5</h3>
                <div class="volleyball-rules-info">
                    <div class="vb-rule-item">
                        <span class="vb-rule-num">25</span>
                        <span class="vb-rule-text">نقطة للشوط (بفارق 2)</span>
                    </div>
                    <div class="vb-rule-item">
                        <span class="vb-rule-num">15</span>
                        <span class="vb-rule-text">نقطة للشوط الخامس</span>
                    </div>
                    <div class="vb-rule-item">
                        <span class="vb-rule-num">3</span>
                        <span class="vb-rule-text">أشواط للفوز</span>
                    </div>
                </div>
                ${renderSetsTable(schema)}
            </div>
            ${renderPlayersSection(schema)}
        `;
    }

    function renderSetsTable(schema) {
        const periods = workingSheet.periods || [];
        return `
            <table class="ss-sets-table">
                <thead><tr>
                    <th>الشوط</th>
                    <th>${workingSheet.teams[0].name}</th>
                    <th>${workingSheet.teams[1].name}</th>
                    <th>الفائز</th>
                    <th>الأوقات المستقطعة (أ)</th>
                    <th>الأوقات المستقطعة (ب)</th>
                </tr></thead>
                <tbody>
                    ${periods.map((p, i) => {
                        const t1 = (workingSheet.timeouts.team1 || []).filter(t => t.period === i + 1).length;
                        const t2 = (workingSheet.timeouts.team2 || []).filter(t => t.period === i + 1).length;
                        const label = i === 4 ? 'الشوط 5 (الفاصل - 15 نقطة)' : `الشوط ${i + 1} (25 نقطة)`;
                        return `<tr>
                            <td><strong>${label}</strong></td>
                            <td><input type="number" min="0" max="35" value="${p.score1 ?? ''}"
                                onchange="ScoreSheet.updatePeriodScore(${i}, 1, this.value)" class="ss-period-input"></td>
                            <td><input type="number" min="0" max="35" value="${p.score2 ?? ''}"
                                onchange="ScoreSheet.updatePeriodScore(${i}, 2, this.value)" class="ss-period-input"></td>
                            <td>${p.winner === 1 ? '✅ أ' : p.winner === 2 ? '✅ ب' : '-'}</td>
                            <td><span class="t-out-inline">${t1}/2</span>
                                <button onclick="ScoreSheet.addTimeout(1, ${i + 1}); ScoreSheet.render()" class="mini-btn">➕</button>
                                ${t1 > 0 ? `<button onclick="ScoreSheet.removeTimeoutUI(1, ${i + 1})" class="mini-btn">➖</button>` : ''}</td>
                            <td><span class="t-out-inline">${t2}/2</span>
                                <button onclick="ScoreSheet.addTimeout(2, ${i + 1}); ScoreSheet.render()" class="mini-btn">➕</button>
                                ${t2 > 0 ? `<button onclick="ScoreSheet.removeTimeoutUI(2, ${i + 1})" class="mini-btn">➖</button>` : ''}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
                <tfoot><tr><td colspan="6" style="text-align:center;padding:12px;">
                    <strong>النتيجة الإجمالية:</strong>
                    الفريق (أ): <span class="ss-sets-count">${countSetWins(1)}</span> أشواط
                    — الفريق (ب): <span class="ss-sets-count">${countSetWins(2)}</span> أشواط
                </td></tr></tfoot>
            </table>
        `;
    }

    function countSetWins(side) {
        return (workingSheet.periods || []).filter(p => p.winner === side).length;
    }

    /* ============================================================
       نمط التنس الاحترافي (من النسخة السابقة)
       ============================================================ */
    function renderTennisPattern(schema) {
        return `
            ${schema.hasDetailedPoints ? `
                <div class="ss-section" style="padding:0;background:transparent;border:none;">
                    ${renderTennisDetailedPoints(schema)}
                </div>
            ` : ''}

            ${(workingSheet.tennisDetailed && workingSheet.tennisDetailed.gameHistory.length > 0) ? `
                <div class="ss-section">
                    <h3>📋 سجل الألعاب المكتملة (Games History)</h3>
                    ${renderTennisGamesHistory()}
                </div>
            ` : ''}

            ${schema.hasTieBreak ? `
                <div class="ss-section">
                    <h3>⚡ Tie-Break Score Tracker</h3>
                    ${renderTieBreakTracker(schema)}
                </div>
            ` : ''}

            ${renderTeamStatsOnly(schema)}
        `;
    }

    function renderTennisDetailedPoints(schema) {
        const td = workingSheet.tennisDetailed || {
            currentGame: { team1: 0, team2: 0, advantage: null, deuce: false, isTiebreak: false },
            currentSet: { team1: 0, team2: 0 },
            server: 1, serverSide: 'right', gameHistory: [], pointsLog: [], matchEnded: false
        };

        const cg = td.currentGame;
        const serving = td.server || 1;
        const serverSide = td.serverSide || 'right';
        const currentSet = td.currentSet || { team1: 0, team2: 0 };
        const currentSetNum = getCurrentSetNumber();
        const totalSets1 = countSetWins(1);
        const totalSets2 = countSetWins(2);
        const setsToWin = Math.ceil(schema.bestOf / 2);

        const critical = checkCriticalPoints(cg, currentSet, schema);
        const stateInfo = getTennisState(cg, critical);

        const display1 = cg.isTiebreak ? cg.team1
            : formatTennisPoint(cg.team1, cg.team2, cg.advantage, 1);
        const display2 = cg.isTiebreak ? cg.team2
            : formatTennisPoint(cg.team1, cg.team2, cg.advantage, 2);

        const pointsLog = td.pointsLog || [];
        const team1Points = pointsLog.filter(p => p === 1).length;
        const team2Points = pointsLog.filter(p => p === 2).length;

        const team1 = workingSheet.teams[0];
        const team2 = workingSheet.teams[1];

        return `
            <div class="tennis-scoreboard ${cg.isTiebreak ? 'tiebreak-mode' : ''}">
                <div class="tsb-status-bar">
                    <div class="tsb-live-indicator">
                        <span class="tsb-live-dot"></span>
                        <span>مباشر</span>
                    </div>
                    <div class="tsb-set-info">
                        المجموعة ${currentSetNum} من ${schema.bestOf}
                        <span class="tsb-games-hint">
                            ${cg.isTiebreak 
                                ? `⚡ TIEBREAK (${cg.tiebreakTarget || 7} نقاط)` 
                                : `(للفوز: 6 ألعاب بفارق 2)`}
                        </span>
                    </div>
                    <div class="tsb-state-badge ${stateInfo.className}">${stateInfo.label}</div>
                </div>

                ${critical.isMatchPoint ? `
                    <div class="tsb-critical-banner match-point">
                        🏆 MATCH POINT — <strong>${workingSheet.teams[critical.forTeam - 1].name}</strong> على بعد نقطة واحدة من الفوز بالمباراة!
                    </div>
                ` : critical.isSetPoint ? `
                    <div class="tsb-critical-banner set-point">
                        🎯 SET POINT — <strong>${workingSheet.teams[critical.forTeam - 1].name}</strong> على بعد نقطة من الفوز بالمجموعة!
                    </div>
                ` : critical.isBreakPoint ? `
                    <div class="tsb-critical-banner break-point">
                        💥 BREAK POINT — <strong>${workingSheet.teams[critical.forTeam - 1].name}</strong> على بعد نقطة لكسر إرسال الخصم!
                    </div>
                ` : critical.isGamePoint ? `
                    <div class="tsb-critical-banner game-point">
                        ⚡ GAME POINT — <strong>${workingSheet.teams[critical.forTeam - 1].name}</strong>
                    </div>
                ` : ''}

                <div class="tsb-main-board">
                    <div class="tsb-team-card team-a ${serving === 1 ? 'serving' : ''} ${cg.advantage === 1 ? 'has-advantage' : ''}">
                        <div class="tsb-team-header">
                            ${serving === 1 ? `<span class="tsb-serve-badge">
                                🎾 إرسال
                                <span class="tsb-serve-side">${serverSide === 'right' ? '◀' : '▶'}</span>
                            </span>` : ''}
                            <div class="tsb-team-name">${team1.name}</div>
                        </div>
                        <div class="tsb-team-points">
                            <div class="tsb-points-label">${cg.isTiebreak ? 'نقاط Tiebreak' : 'النقطة الحالية'}</div>
                            <div class="tsb-points-value">${display1}</div>
                        </div>
                        <div class="tsb-team-games">
                            <span class="tsb-games-label">🎮 ألعاب المجموعة</span>
                            <span class="tsb-games-value">${currentSet.team1}</span>
                        </div>
                        <div class="tsb-team-sets">
                            <span class="tsb-sets-label">المجموعات</span>
                            <span class="tsb-sets-value">${totalSets1}</span>
                            <div class="tsb-sets-dots">
                                ${Array.from({length: setsToWin}, (_, i) => `
                                    <span class="tsb-set-dot ${i < totalSets1 ? 'won' : ''}"></span>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <div class="tsb-vs-divider"><span>VS</span></div>

                    <div class="tsb-team-card team-b ${serving === 2 ? 'serving' : ''} ${cg.advantage === 2 ? 'has-advantage' : ''}">
                        <div class="tsb-team-header">
                            ${serving === 2 ? `<span class="tsb-serve-badge">
                                🎾 إرسال
                                <span class="tsb-serve-side">${serverSide === 'right' ? '◀' : '▶'}</span>
                            </span>` : ''}
                            <div class="tsb-team-name">${team2.name}</div>
                        </div>
                        <div class="tsb-team-points">
                            <div class="tsb-points-label">${cg.isTiebreak ? 'نقاط Tiebreak' : 'النقطة الحالية'}</div>
                            <div class="tsb-points-value">${display2}</div>
                        </div>
                        <div class="tsb-team-games">
                            <span class="tsb-games-label">🎮 ألعاب المجموعة</span>
                            <span class="tsb-games-value">${currentSet.team2}</span>
                        </div>
                        <div class="tsb-team-sets">
                            <span class="tsb-sets-label">المجموعات</span>
                            <span class="tsb-sets-value">${totalSets2}</span>
                            <div class="tsb-sets-dots">
                                ${Array.from({length: setsToWin}, (_, i) => `
                                    <span class="tsb-set-dot ${i < totalSets2 ? 'won' : ''}"></span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                ${renderSetScoreTable(schema, cg)}

                <div class="tsb-points-timeline">
                    <div class="tsb-timeline-title">🎯 تسلسل النقاط في اللعبة الحالية</div>
                    <div class="tsb-timeline-content">
                        <div class="tsb-timeline-team team-a">
                            <span class="tsb-timeline-label">${team1.name}</span>
                            <div class="tsb-timeline-dots">${renderPointsDots(pointsLog, 1)}</div>
                            <span class="tsb-timeline-count">${team1Points}</span>
                        </div>
                        <div class="tsb-timeline-team team-b">
                            <span class="tsb-timeline-label">${team2.name}</span>
                            <div class="tsb-timeline-dots">${renderPointsDots(pointsLog, 2)}</div>
                            <span class="tsb-timeline-count">${team2Points}</span>
                        </div>
                    </div>
                </div>

                <div class="tsb-points-controls">
                    <div class="tsb-control-team team-a">
                        <div class="tsb-control-label">${team1.name}</div>
                        <button class="tsb-point-btn plus" onclick="ScoreSheet.addTennisPoint(1)">
                            <span class="tsb-btn-icon">+1</span>
                            <span class="tsb-btn-text">نقطة</span>
                        </button>
                        <button class="tsb-point-btn minus" onclick="ScoreSheet.removeTennisPoint(1)">
                            <span class="tsb-btn-icon">↶</span>
                            <span class="tsb-btn-text">تراجع</span>
                        </button>
                    </div>
                    <div class="tsb-control-team team-b">
                        <div class="tsb-control-label">${team2.name}</div>
                        <button class="tsb-point-btn plus" onclick="ScoreSheet.addTennisPoint(2)">
                            <span class="tsb-btn-icon">+1</span>
                            <span class="tsb-btn-text">نقطة</span>
                        </button>
                        <button class="tsb-point-btn minus" onclick="ScoreSheet.removeTennisPoint(2)">
                            <span class="tsb-btn-icon">↶</span>
                            <span class="tsb-btn-text">تراجع</span>
                        </button>
                    </div>
                </div>

                <div class="tsb-serve-toggle">
                    <div class="tsb-serve-title">
                        🎾 من يُرسل الآن؟
                        ${cg.isTiebreak ? `<small>(يتبدل كل نقطتين)</small>` : `<small>(يتبدل كل لعبة)</small>`}
                    </div>
                    <div class="tsb-serve-options">
                        <label class="tsb-serve-option team-a ${serving === 1 ? 'active' : ''}">
                            <input type="radio" name="tsb-serving"
                                   ${serving === 1 ? 'checked' : ''}
                                   onchange="ScoreSheet.setTennisServer(1)">
                            <span>${team1.name}</span>
                        </label>
                        <label class="tsb-serve-option team-b ${serving === 2 ? 'active' : ''}">
                            <input type="radio" name="tsb-serving"
                                   ${serving === 2 ? 'checked' : ''}
                                   onchange="ScoreSheet.setTennisServer(2)">
                            <span>${team2.name}</span>
                        </label>
                    </div>
                </div>

                <div class="tsb-bottom-actions">
                    <button class="tsb-action-btn reset" onclick="ScoreSheet.resetCurrentGame()">
                        🔄 إعادة ضبط اللعبة
                    </button>
                    <button class="tsb-action-btn finish" onclick="ScoreSheet.finishCurrentGame()">
                        إنهاء اللعبة وحفظها
                    </button>
                </div>
            </div>
        `;
    }

    function getTennisState(cg, critical) {
        if (cg.isTiebreak) return { label: '⚡ TIEBREAK', className: 'tiebreak' };
        if (critical && critical.isMatchPoint) return { label: '🏆 MATCH POINT', className: 'match-point' };
        if (critical && critical.isSetPoint) return { label: '🎯 SET POINT', className: 'set-point' };
        if (cg.advantage === 1) return { label: '⭐ ADVANTAGE (أ)', className: 'advantage-a' };
        if (cg.advantage === 2) return { label: '⭐ ADVANTAGE (ب)', className: 'advantage-b' };
        if (cg.deuce) return { label: '⚖️ DEUCE', className: 'deuce' };
        return { label: '🎯 LIVE', className: 'live' };
    }

    function formatTennisPoint(score1, score2, advantage, side) {
        const score = side === 1 ? score1 : score2;
        const other = side === 1 ? score2 : score1;
        const sequence = [0, 15, 30, 40];
        if (advantage === side) return 'AD';
        if (advantage && advantage !== side) return '40';
        if (score >= 3 && other >= 3 && score === other) return '40';
        return sequence[Math.min(score, 3)] ?? '40';
    }

    function renderPointsDots(pointsLog, side) {
        if (pointsLog.length === 0) {
            return '<span class="tsb-timeline-empty">— لا توجد نقاط بعد —</span>';
        }
        const maxShow = 30;
        const display = pointsLog.slice(0, maxShow);
        return display.map((p, i) => {
            const isCurrent = p === side;
            return `<span class="tsb-dot ${isCurrent ? 'tsb-dot-active team-' + side : 'tsb-dot-inactive'}"
                          title="النقطة #${i + 1}"></span>`;
        }).join('') + (pointsLog.length > maxShow ? `<span class="tsb-dots-more">+${pointsLog.length - maxShow}</span>` : '');
    }

    function renderSetScoreTable(schema, cg) {
        const periods = workingSheet.periods || [];
        const currentSet = workingSheet.tennisDetailed?.currentSet || { team1: 0, team2: 0 };
        const tb1 = (workingSheet.tieBreak?.team1 || []).length;
        const tb2 = (workingSheet.tieBreak?.team2 || []).length;
        const hasTieBreak = schema.hasTieBreak;

        const maxSets = schema.pattern === 'tennis' ? 3 : schema.periods;
        const currentSetNum = getCurrentSetNumber();

        let headerCols = '';
        for (let i = 0; i < maxSets; i++) {
            const isActive = !periods[i]?.winner && (i + 1) === currentSetNum;
            headerCols += `<th class="${isActive ? 'tsb-active-set' : ''}">م${i + 1}</th>`;
        }
        if (hasTieBreak) headerCols += '<th class="tsb-tb-header">TB</th>';
        headerCols += '<th class="tsb-total-header">المجموع</th>';

        const totalSets1 = countSetWins(1);
        const totalSets2 = countSetWins(2);

        let row1 = '';
        for (let i = 0; i < maxSets; i++) {
            const isCurrentActive = !periods[i]?.winner && (i + 1) === currentSetNum;
            const score = periods[i]?.score1;
            const winner = periods[i]?.winner === 1;
            let display = score ?? '-';
            if (isCurrentActive && currentSet.team1 > 0) display = `${currentSet.team1}*`;
            row1 += `<td class="${winner ? 'tsb-winner-cell' : ''} ${isCurrentActive ? 'tsb-current-cell' : ''}">${display}</td>`;
        }
        if (hasTieBreak) row1 += `<td class="tsb-tb-cell">${tb1 > 0 ? tb1 : '-'}</td>`;
        row1 += `<td class="tsb-total-cell">${totalSets1}</td>`;

        let row2 = '';
        for (let i = 0; i < maxSets; i++) {
            const isCurrentActive = !periods[i]?.winner && (i + 1) === currentSetNum;
            const score = periods[i]?.score2;
            const winner = periods[i]?.winner === 2;
            let display = score ?? '-';
            if (isCurrentActive && currentSet.team2 > 0) display = `${currentSet.team2}*`;
            row2 += `<td class="${winner ? 'tsb-winner-cell' : ''} ${isCurrentActive ? 'tsb-current-cell' : ''}">${display}</td>`;
        }
        if (hasTieBreak) row2 += `<td class="tsb-tb-cell">${tb2 > 0 ? tb2 : '-'}</td>`;
        row2 += `<td class="tsb-total-cell">${totalSets2}</td>`;

        return `
            <div class="tsb-set-score-board">
                <div class="tsb-set-score-title">
                    📊 جدول نتائج المجموعات
                    <span class="tsb-current-hint">(* = المجموعة الحالية)</span>
                </div>
                <table class="tsb-sets-table">
                    <thead><tr>
                        <th class="tsb-team-header">الفريق</th>
                        ${headerCols}
                    </tr></thead>
                    <tbody>
                        <tr class="tsb-row team-a-row">
                            <td class="tsb-team-cell">
                                <span class="tsb-team-dot team-a-dot"></span>
                                ${workingSheet.teams[0].name}
                            </td>
                            ${row1}
                        </tr>
                        <tr class="tsb-row team-b-row">
                            <td class="tsb-team-cell">
                                <span class="tsb-team-dot team-b-dot"></span>
                                ${workingSheet.teams[1].name}
                            </td>
                            ${row2}
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    function setTennisServer(side) {
        if (!workingSheet.tennisDetailed) return;
        workingSheet.tennisDetailed.server = side;
        if (window.Sounds) Sounds.click();
        renderScoreSheet();
    }

    /* ============================================================
       محرك التنس
       ============================================================ */
    function addTennisPoint(side) {
        const schema = getSchema();
        const td = workingSheet.tennisDetailed;
        const cg = td.currentGame;

        if (td.matchEnded) {
            if (window.Toast) Toast.warning('المباراة انتهت');
            return;
        }
        if (window.Sounds) Sounds.click();
        td.pointsLog.push(side);
        updateServerPosition();

        if (cg.isTiebreak) {
            handleTiebreakPoint(side, schema);
            return;
        }

        if (cg.deuce) {
            if (cg.advantage === null) {
                cg.advantage = side;
            } else if (cg.advantage === side) {
                cg.team1 = side === 1 ? 4 : cg.team1;
                cg.team2 = side === 2 ? 4 : cg.team2;
                if (window.Sounds) Sounds.notify();
                finishCurrentGame();
                return;
            } else {
                cg.advantage = null;
            }
        } else {
            if (side === 1) cg.team1++;
            else cg.team2++;

            if (cg.team1 >= 3 && cg.team2 >= 3 && cg.team1 === cg.team2) {
                cg.deuce = true;
                cg.advantage = null;
            } else if (cg.team1 >= 4 && cg.team1 - cg.team2 >= 2) {
                if (window.Sounds) Sounds.notify();
                finishCurrentGame();
                return;
            } else if (cg.team2 >= 4 && cg.team2 - cg.team1 >= 2) {
                if (window.Sounds) Sounds.notify();
                finishCurrentGame();
                return;
            }
        }

        if (window.Sounds) Sounds.notify();
        renderScoreSheet();
    }

    function handleTiebreakPoint(side, schema) {
        const td = workingSheet.tennisDetailed;
        const cg = td.currentGame;
        if (side === 1) cg.team1++;
        else cg.team2++;

        const target = cg.tiebreakTarget || 7;
        const s1 = cg.team1;
        const s2 = cg.team2;

        if (s1 >= target && s1 - s2 >= 2) { finishCurrentGame(); return; }
        if (s2 >= target && s2 - s1 >= 2) { finishCurrentGame(); return; }

        if (window.Sounds) Sounds.notify();
        renderScoreSheet();
    }

    function updateServerPosition() {
        const td = workingSheet.tennisDetailed;
        const cg = td.currentGame;
        td.serverSide = td.serverSide === 'right' ? 'left' : 'right';

        if (cg.isTiebreak) {
            td.tiebreakServeCount++;
            if (td.tiebreakServeCount % 2 === 0) {
                td.server = td.server === 1 ? 2 : 1;
            }
        }
    }

    function checkCriticalPoints(cg, currentSet, schema) {
        const result = {
            isGamePoint: false, isBreakPoint: false,
            isSetPoint: false, isMatchPoint: false, forTeam: null
        };
        if (cg.isTiebreak) return result;

        const server = workingSheet.tennisDetailed.server;
        const returner = server === 1 ? 2 : 1;

        [1, 2].forEach(side => {
            const myScore = side === 1 ? cg.team1 : cg.team2;
            const oppScore = side === 1 ? cg.team2 : cg.team1;
            const isGamePoint = 
                (myScore === 3 && oppScore < 3) ||
                (cg.deuce && cg.advantage === side) ||
                (myScore >= 3 && myScore - oppScore === 1 && !cg.deuce);
            
            if (isGamePoint) {
                if (!result.isGamePoint) { result.isGamePoint = true; result.forTeam = side; }
                if (side === returner) result.isBreakPoint = true;

                const games1 = side === 1 ? currentSet.team1 + 1 : currentSet.team1;
                const games2 = side === 2 ? currentSet.team2 + 1 : currentSet.team2;
                const gamesToWin = schema.gamesToWinSet || 6;
                const diffNeeded = schema.gamesDifferenceNeeded || 2;
                
                if (games1 >= gamesToWin && games1 - games2 >= diffNeeded) {
                    result.isSetPoint = true;
                    const setsWon = countSetWins(side);
                    const setsToWin = Math.ceil(schema.bestOf / 2);
                    if (setsWon + 1 >= setsToWin) result.isMatchPoint = true;
                }
            }
        });
        return result;
    }

    function checkSetStatus(currentSet, schema) {
        const s1 = currentSet.team1;
        const s2 = currentSet.team2;
        const gamesToWin = schema.gamesToWinSet || 6;
        const diffNeeded = schema.gamesDifferenceNeeded || 2;

        if (s1 >= gamesToWin && s1 - s2 >= diffNeeded) 
            return { status: 'setWon', winner: 1, games1: s1, games2: s2 };
        if (s2 >= gamesToWin && s2 - s1 >= diffNeeded) 
            return { status: 'setWon', winner: 2, games1: s1, games2: s2 };
        if (s1 === 6 && s2 === 6 && schema.hasTieBreak) 
            return { status: 'tiebreak', games1: s1, games2: s2 };
        return { status: 'continue', games1: s1, games2: s2 };
    }

    function finishCurrentGame() {
        const schema = getSchema();
        const td = workingSheet.tennisDetailed;
        const cg = td.currentGame;

        let gameWinner = null;
        if (cg.isTiebreak) {
            const target = cg.tiebreakTarget || 7;
            if (cg.team1 >= target && cg.team1 - cg.team2 >= 2) gameWinner = 1;
            else if (cg.team2 >= target && cg.team2 - cg.team1 >= 2) gameWinner = 2;
        } else {
            if (cg.advantage === 1) gameWinner = 1;
            else if (cg.advantage === 2) gameWinner = 2;
            else if (cg.team1 > cg.team2) gameWinner = 1;
            else if (cg.team2 > cg.team1) gameWinner = 2;
        }

        if (!gameWinner) {
            if (window.Toast) Toast.error('لم يتم تحديد فائز اللعبة');
            return;
        }

        const wasTiebreak = cg.isTiebreak;
        td.gameHistory.push({
            id: Date.now() + Math.random(),
            setNumber: getCurrentSetNumber(),
            team1Score: cg.team1, team2Score: cg.team2,
            winner: gameWinner, isTiebreak: wasTiebreak,
            pointsLog: [...td.pointsLog],
            timestamp: new Date().toISOString()
        });

        if (wasTiebreak) {
            if (gameWinner === 1) td.currentSet.team1 = 7;
            else td.currentSet.team2 = 7;
        } else {
            if (gameWinner === 1) td.currentSet.team1++;
            else td.currentSet.team2++;
        }

        if (!wasTiebreak) {
            td.server = td.server === 1 ? 2 : 1;
            td.serverSide = 'right';
            td.tiebreakServeCount = 0;
        }

        td.currentGame = { team1: 0, team2: 0, advantage: null, deuce: false, isTiebreak: false };
        td.pointsLog = [];

        const setStatus = checkSetStatus(td.currentSet, schema);

        if (setStatus.status === 'setWon') {
            handleSetComplete(setStatus, schema);
        } else if (setStatus.status === 'tiebreak') {
            startTiebreak(schema, gameWinner);
        } else {
            if (window.Sounds) Sounds.success();
            const scoreText = `${td.currentSet.team1}-${td.currentSet.team2}`;
            if (window.Toast) {
                Toast.success(`🎾 اكتملت اللعبة — فاز ${workingSheet.teams[gameWinner - 1].name} (${scoreText})`);
            }
            renderScoreSheet();
        }
    }

    function startTiebreak(schema, lastGameWinner) {
        const td = workingSheet.tennisDetailed;
        if (window.Sounds) Sounds.victory();

        const currentSetNum = getCurrentSetNumber();
        const isFinalPossibleSet = currentSetNum === schema.bestOf;
        const use10Point = schema.hasFinalTieBreak10 && isFinalPossibleSet;

        td.currentGame = {
            team1: 0, team2: 0, advantage: null, deuce: false,
            isTiebreak: true,
            tiebreakTarget: use10Point ? 10 : 7
        };
        td.pointsLog = [];
        td.tiebreakServeCount = 0;
        td.serverSide = 'right';

        if (window.Toast) {
            Toast.info(
                use10Point 
                    ? `⚡ Tiebreak بـ 10 نقاط — المجموعة ${currentSetNum}`
                    : `⚡ Tiebreak بـ 7 نقاط — المجموعة ${currentSetNum}`,
                { duration: 5000 }
            );
        }
        renderScoreSheet();
    }

    function handleSetComplete(setStatus, schema) {
        const td = workingSheet.tennisDetailed;
        const setNumber = getCurrentSetNumber();

        if (!workingSheet.periods[setNumber - 1]) {
            workingSheet.periods[setNumber - 1] = {
                period: setNumber, score1: 0, score2: 0, winner: null, games: {}
            };
        }
        workingSheet.periods[setNumber - 1].score1 = setStatus.games1;
        workingSheet.periods[setNumber - 1].score2 = setStatus.games2;
        workingSheet.periods[setNumber - 1].winner = setStatus.winner;

        const setsWon1 = countSetWins(1);
        const setsWon2 = countSetWins(2);
        const setsToWin = Math.ceil(schema.bestOf / 2);
        const matchWon = setsWon1 >= setsToWin || setsWon2 >= setsToWin;

        td.currentSet = { team1: 0, team2: 0 };

        if (window.Sounds) Sounds.victory();
        renderScoreSheet();

        const setWinnerName = workingSheet.teams[setStatus.winner - 1].name;
        const scoreText = `${setStatus.games1}-${setStatus.games2}`;

        setTimeout(() => {
            if (matchWon) {
                td.matchEnded = true;
                td.winner = setStatus.winner;
                if (window.Toast) {
                    Toast.success(
                        `🏆 ${setWinnerName} فاز بالمجموعة ${setNumber} (${scoreText}) وبالمباراة ${setsWon1}-${setsWon2}!`,
                        { duration: 8000 }
                    );
                }
                renderScoreSheet();
            } else {
                const continuePlaying = confirm(
                    `🎾 انتهت المجموعة ${setNumber}!\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `${workingSheet.teams[0].name}: ${setStatus.games1} لعبة\n` +
                    `${workingSheet.teams[1].name}: ${setStatus.games2} لعبة\n\n` +
                    `🏆 الفائز بالمجموعة: ${setWinnerName}\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
                    `النتيجة الإجمالية: ${setsWon1} - ${setsWon2} (من أصل ${setsToWin})\n\n` +
                    `اختر:\n` +
                    `✅ [موافق] = استئناف اللعب — المجموعة ${setNumber + 1}\n` +
                    `❌ [إلغاء] = إنهاء المباراة بهذه النتيجة`
                );

                if (continuePlaying) {
                    if (window.Toast) Toast.info(`🎾 المجموعة ${setNumber + 1} جاهزة`);
                    renderScoreSheet();
                } else {
                    if (window.Toast) Toast.info('💾 جاري حفظ المباراة...');
                    setTimeout(() => save(), 500);
                }
            }
        }, 400);
    }

    function getCurrentSetNumber() {
        const periods = workingSheet.periods || [];
        for (let i = 0; i < periods.length; i++) {
            if (!periods[i].winner) return i + 1;
        }
        return periods.length + 1;
    }

    function removeTennisPoint(side) {
        const td = workingSheet.tennisDetailed;
        if (!td) return;
        const cg = td.currentGame;

        if (cg.isTiebreak) {
            if (side === 1 && cg.team1 > 0) cg.team1--;
            if (side === 2 && cg.team2 > 0) cg.team2--;
        } else {
            if (cg.advantage === side) {
                cg.advantage = null;
            } else {
                if (side === 1 && cg.team1 > 0) cg.team1--;
                if (side === 2 && cg.team2 > 0) cg.team2--;
                if (cg.team1 < 3 || cg.team2 < 3) cg.deuce = false;
            }
        }

        if (td.pointsLog) {
            const lastIdx = td.pointsLog.lastIndexOf(side);
            if (lastIdx > -1) td.pointsLog.splice(lastIdx, 1);
        }
        if (window.Sounds) Sounds.click();
        renderScoreSheet();
    }

    function resetCurrentGame() {
        if (!confirm('إعادة ضبط اللعبة الحالية؟')) return;
        const td = workingSheet.tennisDetailed;
        const wasTiebreak = td.currentGame.isTiebreak;

        td.currentGame = {
            team1: 0, team2: 0, advantage: null, deuce: false,
            isTiebreak: wasTiebreak,
            tiebreakTarget: td.currentGame.tiebreakTarget
        };
        td.pointsLog = [];
        if (wasTiebreak) td.tiebreakServeCount = 0;
        if (window.Sounds) Sounds.click();
        renderScoreSheet();
    }

    function removeTennisGameHistory(id) {
        if (!confirm('حذف هذه اللعبة من السجل؟')) return;
        workingSheet.tennisDetailed.gameHistory = workingSheet.tennisDetailed.gameHistory.filter(
            g => String(g.id) !== String(id)
        );
        renderScoreSheet();
    }

    function renderTennisGamesHistory() {
        const history = workingSheet.tennisDetailed?.gameHistory || [];
        const totalGames1 = history.filter(g => g.winner === 1).length;
        const totalGames2 = history.filter(g => g.winner === 2).length;

        return `
            <div class="td-games-history">
                <div class="td-history-summary">
                    <div class="td-history-team team-a">
                        <span class="td-ht-name">${workingSheet.teams[0].name}</span>
                        <span class="td-ht-games">${totalGames1}</span>
                    </div>
                    <div class="td-history-divider">—</div>
                    <div class="td-history-team team-b">
                        <span class="td-ht-games">${totalGames2}</span>
                        <span class="td-ht-name">${workingSheet.teams[1].name}</span>
                    </div>
                </div>
                <table class="td-history-table">
                    <thead><tr>
                        <th>#</th>
                        <th>${workingSheet.teams[0].name}</th>
                        <th>${workingSheet.teams[1].name}</th>
                        <th>الفائز</th>
                        <th>حذف</th>
                    </tr></thead>
                    <tbody>
                        ${history.map((g, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td class="${g.winner === 1 ? 'td-winner-cell' : ''}">${g.team1Score}</td>
                                <td class="${g.winner === 2 ? 'td-winner-cell' : ''}">${g.team2Score}</td>
                                <td><strong>${workingSheet.teams[g.winner - 1].name}</strong></td>
                                <td><button class="ss-remove-row" onclick="ScoreSheet.removeTennisGameHistory('${g.id}')">✕</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function getTieBreakWinner() {
        const tb = workingSheet.tieBreak;
        if (!tb || !tb.team1 || !tb.team2) return null;
        const p1 = tb.team1.length;
        const p2 = tb.team2.length;
        const schema = getSchema();
        const target = schema.tieBreakPoints || 7;
        if (p1 >= target && p1 - p2 >= 2) return 1;
        if (p2 >= target && p2 - p1 >= 2) return 2;
        return null;
    }

    function renderTieBreakTracker(schema) {
        const points = schema.tieBreakMax || 12;
        const tb = workingSheet.tieBreak || { team1: [], team2: [] };
        return `
            <div class="ss-tiebreak-wrapper">
                <div class="tb-team team-a">
                    <div class="tb-team-name">${workingSheet.teams[0].name}</div>
                    <div class="tb-points-row">
                        ${Array.from({length: points}, (_, i) => i + 1).map(n => `
                            <label class="tb-point">
                                <input type="checkbox" ${(tb.team1 || []).includes(n) ? 'checked' : ''}
                                       onchange="ScoreSheet.toggleTieBreakPoint(1, ${n}, this.checked)">${n}
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="tb-team team-b">
                    <div class="tb-team-name">${workingSheet.teams[1].name}</div>
                    <div class="tb-points-row">
                        ${Array.from({length: points}, (_, i) => i + 1).map(n => `
                            <label class="tb-point">
                                <input type="checkbox" ${(tb.team2 || []).includes(n) ? 'checked' : ''}
                                       onchange="ScoreSheet.toggleTieBreakPoint(2, ${n}, this.checked)">${n}
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    function toggleTieBreakPoint(side, point, checked) {
        if (!workingSheet.tieBreak) workingSheet.tieBreak = { team1: [], team2: [] };
        const key = side === 1 ? 'team1' : 'team2';
        if (!workingSheet.tieBreak[key]) workingSheet.tieBreak[key] = [];
        if (checked) {
            if (!workingSheet.tieBreak[key].includes(point)) {
                workingSheet.tieBreak[key].push(point);
                workingSheet.tieBreak[key].sort((a, b) => a - b);
            }
        } else {
            workingSheet.tieBreak[key] = workingSheet.tieBreak[key].filter(p => p !== point);
        }
        renderScoreSheet();
    }

    /* ============================================================
       نمط تنس الطاولة
       ============================================================ */
    function renderTableTennisPattern(schema) {
        return `
            <div class="ss-section">
                <h3>🏓 سجل الأشواط - Best of ${schema.bestOf} (${schema.pointsPerGame} نقطة)</h3>
                ${renderTTGamesTable(schema)}
            </div>
            <div class="ss-section">
                <h3>📊 تتبع تسلسل النقاط التفصيلي</h3>
                ${renderTTDetailedPoints(schema)}
            </div>
            ${renderTeamStatsOnly(schema)}
        `;
    }

    function renderTTGamesTable(schema) {
        const periods = workingSheet.periods || [];
        const gamesToShow = schema.bestOf;
        return `
            <table class="ss-tt-games-table">
                <thead><tr>
                    <th>اللاعب / الزوجي</th>
                    ${Array.from({length: gamesToShow}, (_, i) => `<th>G${i + 1}</th>`).join('')}
                    <th>إجمالي الأشواط</th>
                </tr></thead>
                <tbody>
                    <tr class="team-a-row">
                        <td><strong>${workingSheet.teams[0].name}</strong></td>
                        ${Array.from({length: gamesToShow}, (_, i) => {
                            const p = periods[i];
                            return `<td><input type="number" min="0" max="30" value="${p?.score1 ?? ''}"
                                onchange="ScoreSheet.updatePeriodScore(${i}, 1, this.value)" class="ss-period-input"></td>`;
                        }).join('')}
                        <td class="ss-final-cell"><strong>${countSetWins(1)}</strong></td>
                    </tr>
                    <tr class="team-b-row">
                        <td><strong>${workingSheet.teams[1].name}</strong></td>
                        ${Array.from({length: gamesToShow}, (_, i) => {
                            const p = periods[i];
                            return `<td><input type="number" min="0" max="30" value="${p?.score2 ?? ''}"
                                onchange="ScoreSheet.updatePeriodScore(${i}, 2, this.value)" class="ss-period-input"></td>`;
                        }).join('')}
                        <td class="ss-final-cell"><strong>${countSetWins(2)}</strong></td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    function renderTTDetailedPoints(schema) {
        const maxPoints = schema.pointsTrackerMax || 20;
        if (!workingSheet.ttPoints) workingSheet.ttPoints = { games: [] };
        const games = workingSheet.ttPoints.games;
        for (let i = 0; i < schema.bestOf; i++) {
            if (!games[i]) games[i] = { gameNum: i + 1, points: Array.from({length: maxPoints}, () => 0) };
        }
        return `
            <div class="ss-tt-detailed">
                ${games.slice(0, schema.bestOf).map((game, gameIdx) => `
                    <div class="tt-game-detail">
                        <div class="tt-game-title">
                            🏓 اللعبة ${gameIdx + 1}
                            <span class="tt-game-score">${countTTPoints(gameIdx, 1)} - ${countTTPoints(gameIdx, 2)}</span>
                        </div>
                        <div class="tt-points-track">
                            <div class="tt-team-row team-a">
                                <span class="tt-team-label">${workingSheet.teams[0].name}</span>
                                <div class="tt-points-sequence">
                                    ${Array.from({length: maxPoints}, (_, pointIdx) => `
                                        <label class="tt-point-box tt-a
                                            ${game.points[pointIdx] === 1 ? 'active-a' : ''}
                                            ${game.points[pointIdx] === 2 ? 'active-b' : ''}">
                                            <input type="radio" name="tt-g${gameIdx}-p${pointIdx}" value="1"
                                                   ${game.points[pointIdx] === 1 ? 'checked' : ''}
                                                   onchange="ScoreSheet.setTTPoint(${gameIdx}, ${pointIdx}, 1)">
                                            <span class="tt-point-num">${pointIdx + 1}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="tt-team-row team-b">
                                <span class="tt-team-label">${workingSheet.teams[1].name}</span>
                                <div class="tt-points-sequence">
                                    ${Array.from({length: maxPoints}, (_, pointIdx) => `
                                        <label class="tt-point-box tt-b
                                            ${game.points[pointIdx] === 1 ? 'active-a' : ''}
                                            ${game.points[pointIdx] === 2 ? 'active-b' : ''}">
                                            <input type="radio" name="tt-g${gameIdx}-p${pointIdx}" value="2"
                                                   ${game.points[pointIdx] === 2 ? 'checked' : ''}
                                                   onchange="ScoreSheet.setTTPoint(${gameIdx}, ${pointIdx}, 2)">
                                            <span class="tt-point-num">${pointIdx + 1}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            <button class="tt-reset-game" onclick="ScoreSheet.resetTTGame(${gameIdx})">
                                🔄 إعادة ضبط اللعبة ${gameIdx + 1}
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function setTTPoint(gameIdx, pointIdx, side) {
        if (!workingSheet.ttPoints) workingSheet.ttPoints = { games: [] };
        const game = workingSheet.ttPoints.games[gameIdx];
        if (!game) return;
        if (window.Sounds) Sounds.click();
        if (game.points[pointIdx] === side) game.points[pointIdx] = 0;
        else game.points[pointIdx] = side;

        const score1 = countTTPoints(gameIdx, 1);
        const score2 = countTTPoints(gameIdx, 2);
        if (workingSheet.periods[gameIdx]) {
            workingSheet.periods[gameIdx].score1 = score1;
            workingSheet.periods[gameIdx].score2 = score2;
            const schema = getSchema();
            const target = schema.pointsPerGame || 11;
            if (score1 >= target && score1 - score2 >= 2) workingSheet.periods[gameIdx].winner = 1;
            else if (score2 >= target && score2 - score1 >= 2) workingSheet.periods[gameIdx].winner = 2;
            else workingSheet.periods[gameIdx].winner = null;
        }
        renderScoreSheet();
    }

    function countTTPoints(gameIdx, side) {
        if (!workingSheet.ttPoints || !workingSheet.ttPoints.games[gameIdx]) return 0;
        return workingSheet.ttPoints.games[gameIdx].points.filter(p => p === side).length;
    }

    function resetTTGame(gameIdx) {
        if (!confirm('إعادة ضبط جميع نقاط هذه اللعبة؟')) return;
        if (!workingSheet.ttPoints || !workingSheet.ttPoints.games[gameIdx]) return;
        const schema = getSchema();
        const maxPoints = schema.pointsTrackerMax || 20;
        workingSheet.ttPoints.games[gameIdx].points = Array.from({length: maxPoints}, () => 0);
        if (workingSheet.periods[gameIdx]) {
            workingSheet.periods[gameIdx].score1 = 0;
            workingSheet.periods[gameIdx].score2 = 0;
            workingSheet.periods[gameIdx].winner = null;
        }
        renderScoreSheet();
    }

    function updatePeriodScore(periodIdx, side, value) {
        const score = parseInt(value) || 0;
        if (!workingSheet.periods[periodIdx]) {
            workingSheet.periods[periodIdx] = { period: periodIdx + 1, score1: null, score2: null, winner: null, games: {} };
        }
        const period = workingSheet.periods[periodIdx];
        if (side === 1) period.score1 = score;
        else period.score2 = score;

        const schema = getSchema();
        if (schema.pattern === 'volleyball' || schema.pattern === 'tennis' || schema.pattern === 'tableTennis') {
            if (period.score1 !== null && period.score2 !== null) {
                if (period.score1 > period.score2) period.winner = 1;
                else if (period.score2 > period.score1) period.winner = 2;
                else period.winner = null;
            }
        }
    }

    function computeFinalScore() {
        const periods = workingSheet.periods || [];
        let s1 = 0, s2 = 0;
        periods.forEach(p => { s1 += p.score1 || 0; s2 += p.score2 || 0; });
        if (workingSheet.overtime) {
            s1 += workingSheet.overtime.score1 || 0;
            s2 += workingSheet.overtime.score2 || 0;
        }
        return { score1: s1, score2: s2 };
    }

    function renderPlayersSection(schema) {
        if (!schema.hasPlayerStats) return '';
        return `
            <div class="ss-section">
                <h3>👥 لاعبو الفريقين والإحصائيات</h3>
                <div class="ss-teams-grid">
                    ${renderTeamCard(0, schema)}
                    ${renderTeamCard(1, schema)}
                </div>
            </div>
        `;
    }

    function renderTeamStatsOnly(schema) {
        if (!schema.teamStats || schema.teamStats.length === 0) return '';
        return `
            <div class="ss-section">
                <h3>📈 إحصائيات الفريقين</h3>
                <div class="ss-teams-grid">
                    ${renderTeamStatsCard(0, schema)}
                    ${renderTeamStatsCard(1, schema)}
                </div>
            </div>
        `;
    }

    function renderTeamStatsSection(schema) { return renderTeamStatsOnly(schema); }

    function renderTeamCard(teamIdx, schema) {
        const team = workingSheet.teams[teamIdx];
        const teamClass = teamIdx === 0 ? 'team-a' : 'team-b';
        const scoreKey = schema.scoreKey;
        const totalScore = team.players.reduce((sum, p) => sum + (parseInt(p.stats[scoreKey]) || 0), 0);
        const headers = ['#', 'الاسم', ...schema.playerStats.map(s => s.label), ''];
        return `
            <div class="ss-team-card ${teamClass}">
                <div class="ss-team-title">
                    <h3>${team.name}</h3>
                    <div class="team-score">${totalScore}</div>
                </div>
                <div class="table-wrapper-mobile">
                    <table class="ss-players-table">
                        <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                        <tbody>${team.players.map((p, pIdx) => renderPlayerRow(teamIdx, pIdx, p, schema)).join('')}</tbody>
                    </table>
                </div>
                <button class="ss-add-player-btn" onclick="ScoreSheet.addPlayer(${teamIdx})">➕ إضافة لاعب</button>
            </div>
        `;
    }

    function renderTeamStatsCard(teamIdx, schema) {
        const team = workingSheet.teams[teamIdx];
        const teamClass = teamIdx === 0 ? 'team-a' : 'team-b';
        return `
            <div class="ss-team-card ${teamClass}">
                <div class="ss-team-title"><h3>${team.name}</h3></div>
                <div class="ss-team-stats">
                    ${schema.teamStats.map(s => `
                        <div class="ss-stat-row">
                            <label>${s.label}</label>
                            <input type="number" min="0" value="${team.teamStats[s.key] || 0}"
                                   onchange="ScoreSheet.updateTeamStat(${teamIdx}, '${s.key}', this.value)">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderPlayerRow(teamIdx, pIdx, player, schema) {
        const stats = player.stats || {};
        return `
            <tr>
                <td><input type="number" min="0" max="99" value="${player.number || ''}"
                           placeholder="#" onchange="ScoreSheet.updatePlayerNumber(${teamIdx}, ${pIdx}, this.value)"
                           style="width:45px"></td>
                <td><input type="text" value="${player.name || ''}" placeholder="اسم اللاعب"
                           onchange="ScoreSheet.updatePlayerName(${teamIdx}, ${pIdx}, this.value)"></td>
                ${schema.playerStats.map(s => `
                    <td><input type="number" min="0" value="${stats[s.key] || 0}"
                               onchange="ScoreSheet.updatePlayerStat(${teamIdx}, ${pIdx}, '${s.key}', this.value)"></td>
                `).join('')}
                <td><button class="ss-remove-row" onclick="ScoreSheet.removePlayer(${teamIdx}, ${pIdx})">✕</button></td>
            </tr>
        `;
    }

    function renderFinalScore() {
        const finalScore = computeFinalScore();
        return `
            <div class="ss-final-score-banner">
                <h3>🏁 النتيجة النهائية للمباراة (Final Score)</h3>
                <div class="ss-final-score-display">
                    <div class="fs-team team-a">
                        <span class="fs-name">${workingSheet.teams[0].name}</span>
                        <span class="fs-score">${finalScore.score1}</span>
                    </div>
                    <div class="fs-divider">—</div>
                    <div class="fs-team team-b">
                        <span class="fs-score">${finalScore.score2}</span>
                        <span class="fs-name">${workingSheet.teams[1].name}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderMotmSection() {
        const options = [];
        workingSheet.teams.forEach((team, tIdx) => {
            (team.players || []).forEach((p, pIdx) => {
                if (p.name || p.number) {
                    options.push({
                        key: `${tIdx}-${pIdx}`,
                        label: `${team.name} — #${p.number || '?'} ${p.name || ''}`
                    });
                }
            });
        });
        const motmKey = workingSheet.motm ? `${workingSheet.motm.teamIdx}-${workingSheet.motm.playerIdx}` : '';
        return `
            <div class="ss-motm-section">
                <h3>🌟 رجل المباراة (Man of the Match)</h3>
                <select onchange="ScoreSheet.setMotm(this.value)">
                    <option value="">— اختر رجل المباراة —</option>
                    ${options.map(o => `<option value="${o.key}" ${o.key === motmKey ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>
            </div>
        `;
    }

    function addPlayer(teamIdx) {
        const schema = getSchema();
        const emptyStats = {};
        schema.playerStats.forEach(s => emptyStats[s.key] = 0);
        workingSheet.teams[teamIdx].players.push(createEmptyPlayer(emptyStats));
        renderScoreSheet();
    }

    function removePlayer(teamIdx, pIdx) {
        if (workingSheet.teams[teamIdx].players.length <= 1) {
            if (window.Toast) Toast.warning('يجب أن يكون هناك لاعب واحد على الأقل');
            return;
        }
        workingSheet.teams[teamIdx].players.splice(pIdx, 1);
        renderScoreSheet();
    }

    function updatePlayerNumber(teamIdx, pIdx, value) {
        workingSheet.teams[teamIdx].players[pIdx].number = parseInt(value) || '';
    }
    function updatePlayerName(teamIdx, pIdx, value) {
        workingSheet.teams[teamIdx].players[pIdx].name = value.trim();
    }
    function updatePlayerStat(teamIdx, pIdx, key, value) {
        workingSheet.teams[teamIdx].players[pIdx].stats[key] = parseInt(value) || 0;
        updateTeamScoreDisplay();
    }
    function updateTeamStat(teamIdx, key, value) {
        workingSheet.teams[teamIdx].teamStats[key] = parseInt(value) || 0;
    }
    function setMotm(key) {
        if (!key) { workingSheet.motm = null; return; }
        const [teamIdx, playerIdx] = key.split('-').map(Number);
        workingSheet.motm = { teamIdx, playerIdx };
    }
    function updateTeamScoreDisplay() {
        const schema = getSchema();
        const scoreKey = schema.scoreKey;
        workingSheet.teams.forEach((team, idx) => {
            const totalScore = team.players.reduce((sum, p) => sum + (parseInt(p.stats[scoreKey]) || 0), 0);
            const scoreEls = document.querySelectorAll('.ss-team-title .team-score');
            if (scoreEls[idx]) scoreEls[idx].textContent = totalScore;
        });
    }

    /* ============================================================
       دوال القواعد المتقدمة
       ============================================================ */
    function addExtraTimeUI() {
        if (!currentMatch) return;
        if (!window.AdvancedRules) {
            if (window.Toast) Toast.warning('وحدة القواعد المتقدمة غير محملة');
            return;
        }
        const gameType = getGameType();
        const rules = window.AdvancedRules.getExtraTimeRules(gameType);
        if (!rules) {
            if (window.Toast) Toast.warning('هذه الرياضة لا تتطلب وقتاً إضافياً');
            return;
        }
        if (!currentMatch.extraTime) {
            if (window.AdvancedRules.addExtraTime(currentMatch)) {
                if (window.Toast) Toast.info(`تم تفعيل ${rules.label}`);
                save();
            }
        }
    }

    function addPenaltyShootoutUI() {
        if (!currentMatch) return;
        if (!window.AdvancedRules) return;
        const gameType = getGameType();
        const rules = window.AdvancedRules.getExtraTimeRules(gameType);
        if (!rules || !rules.hasPenaltyShootout) {
            if (window.Toast) Toast.warning('هذه الرياضة لا تستخدم ركلات الترجيح');
            return;
        }
        if (!currentMatch.penaltyShootout) {
            if (window.AdvancedRules.addPenaltyShootout(currentMatch)) {
                if (window.Toast) Toast.info('تم تفعيل ركلات الترجيح');
                save();
            }
        }
    }

    function addPenaltyAttemptUI(side, scored) {
        if (!currentMatch || !currentMatch.penaltyShootout) return;
        window.AdvancedRules.addPenaltyAttempt(currentMatch, side, scored);
        save();
    }

    function updateExtraTimeScoreUI(periodIdx, side, value) {
        if (!currentMatch || !currentMatch.extraTime) return;
        window.AdvancedRules.updateExtraTimeScore(currentMatch, periodIdx, side, value);
        save();
    }

    /* ============================================================
       حفظ Score Sheet
       ============================================================ */
    function save() {
        const App = window.App;
        if (!App || !App.state) return;
        if (!currentMatchRef) return;

        const schema = getSchema();
        let score1 = 0, score2 = 0;

        if (schema.hasGoalLog && workingSheet.goalLog && workingSheet.goalLog.length > 0) {
            score1 = workingSheet.goalLog.filter(g => g.side === 1 && g.goalType !== 'عكس').length
                   + workingSheet.goalLog.filter(g => g.side === 2 && g.goalType === 'عكس').length;
            score2 = workingSheet.goalLog.filter(g => g.side === 2 && g.goalType !== 'عكس').length
                   + workingSheet.goalLog.filter(g => g.side === 1 && g.goalType === 'عكس').length;
        } else if (schema.pattern === 'tennis' || schema.pattern === 'tableTennis' || schema.pattern === 'volleyball') {
            score1 = countSetWins(1);
            score2 = countSetWins(2);
        } else if (schema.pattern === 'basketball' || schema.pattern === 'handball') {
            const fs = computeFinalScore();
            score1 = fs.score1;
            score2 = fs.score2;
        } else {
            score1 = schema.hasPlayerStats
                ? workingSheet.teams[0].players.reduce((s, p) => s + (parseInt(p.stats[schema.scoreKey]) || 0), 0) : 0;
            score2 = schema.hasPlayerStats
                ? workingSheet.teams[1].players.reduce((s, p) => s + (parseInt(p.stats[schema.scoreKey]) || 0), 0) : 0;
        }

        if (currentMatchRef.type === 'knockout' && score1 === score2 && score1 > 0) {
            if (!confirm(`⚠️ النتيجة متعادلة (${score1} - ${score2}).\nممنوع التعادل في خروج المغلوب. المتابعة؟`)) return;
        }

        currentMatch.scoresheet = workingSheet;
        currentMatch.score1 = score1;
        currentMatch.score2 = score2;

        if (currentMatchRef.type === 'knockout' && score1 !== score2) {
            currentMatch.winner = score1 > score2 ? currentMatch.player1 : currentMatch.player2;
        }

        if (currentMatchRef.type === 'group') {
            const group = App.state.groups.groups.find(g => g.name === currentMatchRef.groupName);
            if (group && window.Groups && window.Groups.updateStandings) {
                window.Groups.updateStandings(group);
            }
        }

        App.saveSession();
        close();
        App.ui.render();

        if (window.Sounds) Sounds.success();
        if (window.Toast) Toast.success('تم حفظ Score Sheet بنجاح');

        if (window.Bracket && currentMatchRef.type === 'knockout') {
            setTimeout(() => Bracket.render(), 100);
        }
    }

    function printScoreSheet() { window.print(); }

    function getMatchSummary(match) {
        if (!match.scoresheet) return null;
        const sheet = match.scoresheet;
        const schema = SPORT_SCHEMAS[sheet.gameType] || SPORT_SCHEMAS.football11;
        let motm = null;
        if (sheet.motm) {
            const t = sheet.teams[sheet.motm.teamIdx];
            if (t && t.players[sheet.motm.playerIdx]) {
                const p = t.players[sheet.motm.playerIdx];
                motm = `#${p.number || '?'} ${p.name || ''}`.trim();
            }
        }
        return { gameType: schema.name, icon: schema.icon, pattern: schema.pattern, motm };
    }

    function getMatchCardSummary(match) {
        if (!match.scoresheet) {
            return `<div class="scoresheet-info"><span class="badge badge-missing">📋 لم يُملأ Score Sheet</span></div>`;
        }
        const summary = getMatchSummary(match);
        let html = '<div class="scoresheet-info">';
        if (summary.motm) html += `<span class="badge badge-motm">🌟 ${summary.motm}</span>`;
        html += `<span class="badge">${summary.icon} ${summary.pattern}</span></div>`;
        return html;
    }

    function showTournamentReport() {
        const App = window.App;
        if (!App || !App.state) return;
        const schema = getSchema();
        const scoreKey = schema.scoreKey;
        const scorers = {};
        let matchCount = 0, totalGoals = 0;

        const allMatches = [];
        App.state.groups.groups.forEach(g => g.rounds.flat().forEach(m => allMatches.push(m)));
        App.state.knockout.matches.forEach(r => r.forEach(m => allMatches.push(m)));

        allMatches.forEach(m => {
            if (!m.scoresheet) return;
            matchCount++;
            m.scoresheet.teams.forEach(team => {
                (team.players || []).forEach(p => {
                    const score = parseInt((p.stats || {})[scoreKey]) || 0;
                    if (score === 0) return;
                    const key = `${p.name || 'مجهول'}|${team.name}`;
                    if (!scorers[key]) {
                        scorers[key] = { name: p.name || 'مجهول', number: p.number, team: team.name, goals: 0 };
                    }
                    scorers[key].goals += score;
                    totalGoals += score;
                });
            });
        });

        const topScorers = Object.values(scorers).sort((a, b) => b.goals - a.goals).slice(0, 30);
        renderTournamentReport(topScorers, { matchCount, totalGoals, schema, tournamentName: App.state.tournamentName || 'البطولة' });
        document.getElementById('reportOverlay').classList.add('active');
        if (window.Sounds) Sounds.openModal();
    }

    function renderTournamentReport(scorers, info) {
        const title = document.getElementById('reportTitle');
        title.textContent = `📊 هدافو ${info.tournamentName} — ${info.schema.icon} ${info.schema.name}`;
        const body = document.getElementById('reportBody');
        if (scorers.length === 0) {
            body.innerHTML = `<div class="empty-state"><p>لم يتم تسجيل أي ${info.schema.scoreLabel} بعد</p></div>`;
            return;
        }
        body.innerHTML = `
            <div class="report-section">
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="display:inline-flex;gap:20px;flex-wrap:wrap;justify-content:center;">
                        <div style="background:#dbeafe;padding:10px 20px;border-radius:10px;">
                            <div style="font-size:0.8rem;color:#1e40af;font-weight:600;">عدد المباريات</div>
                            <div style="font-size:1.5rem;font-weight:900;color:#1e40af;">${info.matchCount}</div>
                        </div>
                        <div style="background:#fef3c7;padding:10px 20px;border-radius:10px;">
                            <div style="font-size:0.8rem;color:#92400e;font-weight:600;">إجمالي ${info.schema.scoreLabel}</div>
                            <div style="font-size:1.5rem;font-weight:900;color:#92400e;">${info.totalGoals}</div>
                        </div>
                        <div style="background:#dcfce7;padding:10px 20px;border-radius:10px;">
                            <div style="font-size:0.8rem;color:#166534;font-weight:600;">عدد الهدافين</div>
                            <div style="font-size:1.5rem;font-weight:900;color:#166534;">${scorers.length}</div>
                        </div>
                    </div>
                </div>
                <table class="top-scorers-table">
                    <thead><tr><th>#</th><th>اللاعب</th><th>الفريق</th><th>${info.schema.scoreLabel}</th></tr></thead>
                    <tbody>
                        ${scorers.map((s, idx) => {
                            const rank = idx + 1;
                            let medal = '';
                            if (rank === 1) medal = '🥇';
                            else if (rank === 2) medal = '🥈';
                            else if (rank === 3) medal = '🥉';
                            return `
                                <tr>
                                    <td class="rank-cell">${medal || rank}</td>
                                    <td style="text-align:right;padding-right:15px;">
                                        <strong>${s.name}</strong>
                                        ${s.number ? `<span style="color:#666;font-size:0.8rem;">#${s.number}</span>` : ''}
                                    </td>
                                    <td>${s.team}</td>
                                    <td><strong style="font-size:1.1rem;color:#16a34a;">${s.goals}</strong></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function closeReport() {
        document.getElementById('reportOverlay').classList.remove('active');
        if (window.Sounds) Sounds.closeModal();
    }

    function printReport() { window.print(); }

    /* ============================================================
       API العام
       ============================================================ */
    return {
        setGameType, getGameType, getSchema,
        open, openGroupMatch, close, render, save, printScoreSheet,
        addPlayer, removePlayer, updatePlayerNumber, updatePlayerName,
        updatePlayerStat, updateTeamStat, setMotm,
        updateMatchInfo, updateSignature, updatePeriodScore, updateOvertime,
        updateTeamFoul, updateSevenMeters, toggleTimeout, addTimeout, addTimeoutUI,
        removeTimeout, removeTimeoutUI, updateAccumFoul,
        addGoalLogEntry, addGoalLogEntryUI, updateGoalEntry, toggleGoalExtraTime, removeGoalEntry,
        addDiscipline, addDisciplineUI, removeDiscipline,
        addSanction, addSanctionUI, removeSanction,
        toggleTieBreakPoint,
        addTennisPoint, removeTennisPoint, resetCurrentGame, finishCurrentGame,
        removeTennisGameHistory, setTennisServer,
        setTTPoint, resetTTGame,
        addExtraTimeUI, addPenaltyShootoutUI, addPenaltyAttemptUI, updateExtraTimeScoreUI,
        showTournamentReport, closeReport, printReport,
        getMatchSummary, getMatchCardSummary,
        SPORT_SCHEMAS
    };
})();