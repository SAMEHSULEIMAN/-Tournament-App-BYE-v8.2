/* ============================================================
   groups.js - نظام دوري المجموعات
   يطابق المعايير الدولية + يدعم الدوري من دور واحد أو دورين
   النسخة 8.0
   ============================================================ */

window.Groups = (function() {
    'use strict';

    /* ============================================================
       أنظمة النقاط الرسمية لكل رياضة
       ============================================================ */
    const LEAGUE_POINTS = {
        football11:  { win: 3, draw: 1, loss: 0, forfeit: 0, name: '3-1-0' },
        futsal:      { win: 3, draw: 1, loss: 0, forfeit: 0, name: '3-1-0' },
        handball:    { win: 2, draw: 1, loss: 0, forfeit: 0, name: '2-1-0 (IHF)' },
        basketball:  { win: 2, draw: 0, loss: 1, forfeit: 0, name: '2-1-0 (FIBA)' },
        volleyball:  { name: 'FIVB', win3_0: 3, win3_1: 3, win3_2: 2, loss2_3: 1, loss0_3: 0, loss1_3: 0 },
        tennis:      { win: 3, draw: 0, loss: 0, forfeit: 0, name: '3-0-0' },
        tableTennis: { win: 3, draw: 0, loss: 0, forfeit: 0, name: '3-0-0' },
        squash:      { win: 3, draw: 0, loss: 0, forfeit: 0, name: '3-0-0' },
        padel:       { win: 3, draw: 0, loss: 0, forfeit: 0, name: '3-0-0' }
    };

    function getPointsSystem(gameType) {
        return LEAGUE_POINTS[gameType] || LEAGUE_POINTS.football11;
    }

    /* ============================================================
       إضافة مجموعة جديدة (مع دعم دور واحد أو دورين)
       ============================================================ */
    function addGroup(name, teamNames, twoLegged = false) {
        const App = window.App;
        if (!App || !App.state) return;

        const g = {
            name: name,
            twoLegged: twoLegged,           // ⭐ دور واحد أو دورين
            teams: teamNames.map(n => ({
                name: n,
                played: 0, won: 0, drawn: 0, lost: 0,
                goalsFor: 0, goalsAgainst: 0, points: 0,
                setsFor: 0, setsAgainst: 0,
                forfeitCount: 0
            })),
            rounds: generateRounds(teamNames, twoLegged)
        };

        App.state.groups.groups.push(g);
        App.saveSession();
        App.ui.render();

        if (window.Toast) {
            Toast.success(
                `تمت إضافة المجموعة ${name} — ${twoLegged ? 'دورين (ذهاب وإياب)' : 'دور واحد'} — ${g.rounds.length} جولة`
            );
        }
    }

    /* ============================================================
       حذف مجموعة
       ============================================================ */
    function deleteGroup(name) {
        if (!confirm(`حذف المجموعة "${name}"؟`)) return;
        const App = window.App;
        if (!App || !App.state) return;
        App.state.groups.groups = App.state.groups.groups.filter(g => g.name !== name);
        App.saveSession();
        App.ui.render();
    }

    /* ============================================================
       ⭐ توليد الجولات (دور واحد أو دورين)
       ============================================================ */
    function generateRounds(teams, twoLegged = false) {
        const t = [...teams];
        if (t.length % 2) t.push(null);
        const n = t.length;
        const firstLegRounds = [];

        // ===== توليد جولات الذهاب =====
        for (let r = 0; r < n - 1; r++) {
            const matches = [];
            for (let i = 0; i < n / 2; i++) {
                const a = t[i], b = t[n - 1 - i];
                if (a && b) {
                    matches.push({
                        team1: a,
                        team2: b,
                        score1: null,
                        score2: null,
                        scoresheet: null,
                        isForfeit: false,
                        forfeitTeam: null,
                        isReturn: false            // ⭐ مباراة ذهاب
                    });
                }
            }
            firstLegRounds.push(matches);
            t.splice(1, 0, t.pop());
        }

        // ===== إذا كان دور واحد: نكتفي بجولات الذهاب =====
        if (!twoLegged) {
            return firstLegRounds;
        }

        // ===== إذا كان دورين: نضيف جولات الإياب =====
        const allRounds = [...firstLegRounds];
        // عكس ترتيب الجولات في الإياب لتنويع الملاعب
        const reversedLegs = [...firstLegRounds].reverse();

        for (const legMatches of reversedLegs) {
            const returnMatches = legMatches.map(m => ({
                team1: m.team2,                    // ⭐ عكس الفريقين
                team2: m.team1,
                score1: null,
                score2: null,
                scoresheet: null,
                isForfeit: false,
                forfeitTeam: null,
                isReturn: true                     // ⭐ مباراة إياب
            }));
            allRounds.push(returnMatches);
        }

        return allRounds;
    }

    /* ============================================================
       تحديث نتيجة مباراة (يدوياً)
       ============================================================ */
    function updateMatch(groupName, roundIdx, matchIdx) {
        const App = window.App;
        if (!App || !App.state) return;
        const g = App.state.groups.groups.find(x => x.name === groupName);
        if (!g) return;
        const m = g.rounds[roundIdx][matchIdx];
        const current = `${m.score1 ?? 0}-${m.score2 ?? 0}`;
        const inp = prompt('أدخل النتيجة (مثال: 2-1):', current);
        if (!inp) return;

        const parts = inp.split('-').map(x => parseInt(x.trim()));
        if (parts.length !== 2 || parts.some(isNaN) || parts.some(v => v < 0)) {
            return alert('تنسيق غير صالح. استخدم: 2-1');
        }

        if (m.scoresheet) {
            if (!confirm('⚠️ تعديل النتيجة يدوياً سيمسح Score Sheet المرتبط.\nهل تريد المتابعة؟')) {
                return;
            }
            m.scoresheet = null;
        }

        m.score1 = parts[0];
        m.score2 = parts[1];
        updateStandings(g);
        App.saveSession();
        App.ui.render();
    }

    /* ============================================================
       حساب الترتيب وفق المعايير الرسمية
       ============================================================ */
    function updateStandings(g) {
        const gameType = window.ScoreSheet ? window.ScoreSheet.getGameType() : 'football11';
        const pointsSystem = getPointsSystem(gameType);

        g.teams.forEach(t => {
            t.played = 0; t.won = 0; t.drawn = 0; t.lost = 0;
            t.goalsFor = 0; t.goalsAgainst = 0; t.points = 0;
            t.setsFor = 0; t.setsAgainst = 0;
            t.forfeitCount = 0;
        });

        g.rounds.flat().forEach(m => {
            if (m.score1 === null || m.score2 === null) return;
            const A = g.teams.find(t => t.name === m.team1);
            const B = g.teams.find(t => t.name === m.team2);
            if (!A || !B) return;

            A.played++;
            B.played++;

            // معالجة الانسحاب (Forfeit)
            if (m.isForfeit) {
                if (m.forfeitTeam === 1) {
                    A.forfeitCount++;
                    A.lost++;
                    B.won++;
                    B.points += pointsSystem.win || 3;
                    A.points += pointsSystem.forfeit || 0;
                } else if (m.forfeitTeam === 2) {
                    B.forfeitCount++;
                    B.lost++;
                    A.won++;
                    A.points += pointsSystem.win || 3;
                    B.points += pointsSystem.forfeit || 0;
                }
                return;
            }

            A.goalsFor += m.score1;
            A.goalsAgainst += m.score2;
            B.goalsFor += m.score2;
            B.goalsAgainst += m.score1;

            applyMatchPoints(A, B, m.score1, m.score2, gameType, pointsSystem);
        });

        g.teams.sort((a, b) => sortStandings(a, b, gameType, g));
    }

    /* ============================================================
       تطبيق نقاط المباراة حسب اللعبة
       ============================================================ */
    function applyMatchPoints(A, B, scoreA, scoreB, gameType, pointsSystem) {
        if (gameType === 'volleyball') {
            // 🏐 نظام FIVB الرسمي
            A.setsFor += scoreA;
            A.setsAgainst += scoreB;
            B.setsFor += scoreB;
            B.setsAgainst += scoreA;

            if (scoreA === 3 && (scoreB === 0 || scoreB === 1)) {
                A.won++; B.lost++; A.points += 3;
            } else if (scoreA === 3 && scoreB === 2) {
                A.won++; B.lost++; A.points += 2; B.points += 1;
            } else if (scoreB === 3 && (scoreA === 0 || scoreA === 1)) {
                B.won++; A.lost++; B.points += 3;
            } else if (scoreB === 3 && scoreA === 2) {
                B.won++; A.lost++; B.points += 2; A.points += 1;
            }
        } else if (gameType === 'basketball') {
            // 🏀 FIBA: لا تعادل، فوز=2، خسارة=1
            if (scoreA > scoreB) {
                A.won++; B.lost++; A.points += 2; B.points += 1;
            } else if (scoreB > scoreA) {
                B.won++; A.lost++; B.points += 2; A.points += 1;
            }
        } else if (gameType === 'handball') {
            // 🤾 IHF: 2-1-0
            if (scoreA > scoreB) {
                A.won++; B.lost++; A.points += 2;
            } else if (scoreB > scoreA) {
                B.won++; A.lost++; B.points += 2;
            } else {
                A.drawn++; B.drawn++; A.points += 1; B.points += 1;
            }
        } else {
            // ⚽ كرة القدم والخماسي: 3-1-0
            if (scoreA > scoreB) {
                A.won++; B.lost++; A.points += pointsSystem.win;
            } else if (scoreB > scoreA) {
                B.won++; A.lost++; B.points += pointsSystem.win;
            } else {
                A.drawn++; B.drawn++;
                A.points += pointsSystem.draw;
                B.points += pointsSystem.draw;
            }
        }
    }

    /* ============================================================
       ترتيب الفرق وفق المعايير الرسمية
       ============================================================ */
    function sortStandings(a, b, gameType, g) {
        // 1️⃣ النقاط
        if (b.points !== a.points) return b.points - a.points;

        // 2️⃣ نسبة الأشواط (كرة الطائرة) أو نسبة الأهداف (كرة السلة)
        if (gameType === 'volleyball') {
            const aSetRatio = a.setsAgainst > 0 ? a.setsFor / a.setsAgainst : a.setsFor * 10;
            const bSetRatio = b.setsAgainst > 0 ? b.setsFor / b.setsAgainst : b.setsFor * 10;
            if (Math.abs(aSetRatio - bSetRatio) > 0.001) return bSetRatio - aSetRatio;

            const aPtsRatio = a.goalsAgainst > 0 ? a.goalsFor / a.goalsAgainst : a.goalsFor * 10;
            const bPtsRatio = b.goalsAgainst > 0 ? b.goalsFor / b.goalsAgainst : b.goalsFor * 10;
            if (Math.abs(aPtsRatio - bPtsRatio) > 0.001) return bPtsRatio - aPtsRatio;
        } else if (gameType === 'basketball') {
            const aRatio = a.goalsAgainst > 0 ? a.goalsFor / a.goalsAgainst : a.goalsFor * 10;
            const bRatio = b.goalsAgainst > 0 ? b.goalsFor / b.goalsAgainst : b.goalsFor * 10;
            if (Math.abs(aRatio - bRatio) > 0.001) return bRatio - aRatio;
        }

        // 3️⃣ فارق الأهداف
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;

        // 4️⃣ الأهداف المسجلة
        if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

        // 5️⃣ المواجهات المباشرة (إذا كانت مفعّلة)
        const directToggle = document.getElementById('directEncounterToggle');
        if (directToggle && directToggle.checked) {
            const hh = g.rounds.flat().find(x =>
                (x.team1 === a.name && x.team2 === b.name) ||
                (x.team1 === b.name && x.team2 === a.name)
            );
            if (hh && hh.score1 !== null) {
                const winner = hh.score1 > hh.score2 ? hh.team1 :
                               hh.score2 > hh.score1 ? hh.team2 : null;
                if (winner === a.name) return -1;
                if (winner === b.name) return 1;
            }
        }

        return 0;
    }

    /* ============================================================
       فحص اكتمال المجموعات
       ============================================================ */
    function isGroupComplete(g) {
        return g.rounds.flat().every(m => m.score1 !== null && m.score2 !== null);
    }

    function allGroupsComplete() {
        const App = window.App;
        if (!App || !App.state) return false;
        const groups = App.state.groups.groups;
        if (groups.length === 0) return false;
        return groups.every(isGroupComplete);
    }

    /* ============================================================
       استخراج الفرق المتأهلة
       ============================================================ */
    function getQualifiedTeams(qualifiersPerGroup) {
        const App = window.App;
        if (!App || !App.state) return [];
        const qualifiers = [];
        App.state.groups.groups.forEach(g => {
            updateStandings(g);
            const qualified = g.teams.slice(0, qualifiersPerGroup);
            qualified.forEach((t, idx) => {
                qualifiers.push({
                    name: t.name,
                    groupName: g.name,
                    position: idx + 1,
                    teamId: `${g.name}-${idx + 1}`,
                    points: t.points,
                    goalsFor: t.goalsFor,
                    goalsAgainst: t.goalsAgainst,
                    setsFor: t.setsFor,
                    setsAgainst: t.setsAgainst
                });
            });
        });
        return qualifiers;
    }

    /* ============================================================
       تصدير Word
       ============================================================ */
    function exportToWord() {
        const App = window.App;
        if (!App || !App.state) return alert('التطبيق غير جاهز');
        const groups = App.state.groups.groups;
        const ko = App.state.knockout;
        const tournamentName = App.state.tournamentName || 'البطولة';
        const gameType = window.ScoreSheet ? window.ScoreSheet.getGameType() : 'football11';
        const schema = window.ScoreSheet ? window.ScoreSheet.getSchema() : null;
        const pointsName = getPointsSystem(gameType).name;

        if (groups.length === 0 && ko.matches.length === 0) {
            return alert('لا توجد بيانات للتصدير');
        }

        let html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office'
                  xmlns:w='urn:schemas-microsoft-com:office:word'
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${tournamentName}</title>
                <style>
                    body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
                    h1 { color: #1e293b; text-align: center; border-bottom: 3px solid #f59e0b; padding-bottom: 10px; }
                    h2 { color: #16a34a; margin-top: 30px; border-bottom: 2px solid #dcfce7; padding-bottom: 6px; }
                    h3 { color: #2563eb; margin-top: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th { background: #16a34a; color: white; padding: 8px; border: 1px solid #333; }
                    td { padding: 6px; border: 1px solid #999; text-align: center; }
                    .gold { background: #fef3c7; font-weight: bold; }
                    .return-row { background: #eff6ff; }
                    .round-title { background: #f0fdf4; padding: 8px 12px; margin: 12px 0; border-right: 4px solid #16a34a; font-weight: bold; }
                    .podium-box { padding: 15px; margin: 10px 0; border-right: 5px solid; }
                    .podium-gold { background: #fef3c7; border-color: #f59e0b; }
                    .podium-silver { background: #f1f5f9; border-color: #94a3b8; }
                    .podium-bronze { background: #fed7aa; border-color: #ea580c; }
                </style>
            </head>
            <body dir="rtl">
            <h1>🏆 ${tournamentName}</h1>
            <p style="text-align:center;color:#666;">
                ${schema ? schema.icon + ' ' + schema.name : ''} — نظام النقاط: ${pointsName}<br>
                تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}
            </p>
        `;

        // ===== مرحلة المجموعات =====
        if (groups.length > 0) {
            html += `<h2>📋 مرحلة دوري المجموعات</h2>`;
            groups.forEach(group => {
                updateStandings(group);
                const legLabel = group.twoLegged ? ' — 🔄 دورين (ذهاب وإياب)' : ' — ➡️ دور واحد';
                html += `<h3>المجموعة ${group.name}${legLabel}</h3>`;

                // جدول الترتيب
                html += `<table><thead><tr>
                    <th>الترتيب</th><th>الفريق</th><th>لعب</th><th>فاز</th>
                    <th>تعادل</th><th>خسر</th><th>له</th><th>عليه</th>
                    <th>الفرق</th><th>النقاط</th>
                </tr></thead><tbody>`;
                group.teams.forEach((t, idx) => {
                    const gd = t.goalsFor - t.goalsAgainst;
                    const gdStr = gd > 0 ? '+' + gd : String(gd);
                    const rowClass = idx < 2 ? 'gold' : '';
                    html += `<tr class="${rowClass}">
                        <td>${idx + 1}</td>
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
                });
                html += `</tbody></table>`;

                // جدول المباريات
                group.rounds.forEach((matches, r) => {
                    const isReturn = matches.some(m => m.isReturn);
                    const legTag = group.twoLegged ? (isReturn ? ' (إياب)' : ' (ذهاب)') : '';
                    html += `<div class="round-title">الجولة ${r + 1}${legTag}</div>`;
                    html += `<table><thead><tr>
                        <th>فريق 1</th><th>فريق 2</th><th>النتيجة</th><th>رجل المباراة</th>
                    </tr></thead><tbody>`;
                    matches.forEach(m => {
                        const score = m.score1 !== null ? `${m.score1} - ${m.score2}` : '—';
                        let motm = '—';
                        if (m.scoresheet && m.scoresheet.motm) {
                            const t = m.scoresheet.teams[m.scoresheet.motm.teamIdx];
                            if (t && t.players[m.scoresheet.motm.playerIdx]) {
                                const p = t.players[m.scoresheet.motm.playerIdx];
                                motm = `#${p.number || '?'} ${p.name || ''}`;
                            }
                        }
                        const rowClass = m.isReturn ? 'return-row' : '';
                        html += `<tr class="${rowClass}">
                            <td>${m.team1}</td>
                            <td>${m.team2}</td>
                            <td><strong>${score}</strong></td>
                            <td>${motm}</td>
                        </tr>`;
                    });
                    html += `</tbody></table>`;
                });
            });
        }

        // ===== مرحلة خروج المغلوب =====
        if (ko.matches.length > 0) {
            html += `<h2>🎯 مرحلة خروج المغلوب</h2>`;
            ko.matches.forEach((roundMatches, roundIdx) => {
                let roundTitle = `الجولة ${roundIdx + 1}`;
                const hasFinal = roundMatches.some(m => m.matchType === 'final');
                const hasThird = roundMatches.some(m => m.matchType === 'thirdPlace');
                if (hasFinal && hasThird) roundTitle = 'الجولة النهائية — النهائي + المركز الثالث';
                else if (hasFinal) roundTitle = '🏆 المباراة النهائية';
                else if (roundMatches.length === 2) roundTitle = `الجولة ${roundIdx + 1} — نصف النهائي`;
                else if (roundMatches.length === 4) roundTitle = `الجولة ${roundIdx + 1} — ربع النهائي`;

                html += `<div class="round-title">${roundTitle}</div>`;
                html += `<table><thead><tr>
                    <th>اللاعب 1</th><th>النتيجة</th><th>اللاعب 2</th><th>الفائز</th>
                </tr></thead><tbody>`;
                roundMatches.forEach(m => {
                    const p1Name = m.player1.type === 'BYE' ? 'BYE' : (m.player1.name || '—');
                    const p2Name = m.player2.type === 'BYE' ? 'BYE' : (m.player2.name || '—');
                    let score = (m.score1 !== null && m.score2 !== null) ? `${m.score1} - ${m.score2}` : '—';
                    if (m.penaltyShootout && m.penaltyShootout.isComplete) {
                        score += ` (ترجيح: ${m.penaltyShootout.score1}-${m.penaltyShootout.score2})`;
                    }
                    const winner = m.winner ? (m.winner.type === 'BYE' ? '—' : m.winner.name) : '—';
                    html += `<tr>
                        <td>${p1Name}</td>
                        <td><strong>${score}</strong></td>
                        <td>${p2Name}</td>
                        <td><strong>${winner}</strong></td>
                    </tr>`;
                });
                html += `</tbody></table>`;
            });

            const lastRound = ko.matches[ko.matches.length - 1];
            if (lastRound) {
                const finalMatch = lastRound.find(m => m.matchType === 'final') ||
                                   (lastRound.length === 1 ? lastRound[0] : null);
                const thirdMatch = lastRound.find(m => m.matchType === 'thirdPlace');
                if (finalMatch && finalMatch.winner) {
                    html += `<h2>🏆 منصة التتويج</h2>`;
                    const champ = finalMatch.winner;
                    if (champ && champ.type !== 'BYE') {
                        html += `<div class="podium-box podium-gold">
                            <h3 style="margin:0;">🥇 المركز الأول — بطل البطولة</h3>
                            <p style="font-size:18px;margin:8px 0;"><strong>${champ.name}</strong></p>
                            <p style="color:#666;margin:0;">🏢 ${champ.team}</p>
                        </div>`;
                    }
                    const runner = (finalMatch.winner === finalMatch.player1) ? finalMatch.player2 : finalMatch.player1;
                    if (runner && runner.type !== 'BYE') {
                        html += `<div class="podium-box podium-silver">
                            <h3 style="margin:0;">🥈 المركز الثاني — الوصيف</h3>
                            <p style="font-size:18px;margin:8px 0;"><strong>${runner.name}</strong></p>
                            <p style="color:#666;margin:0;">🏢 ${runner.team}</p>
                        </div>`;
                    }
                    if (thirdMatch && thirdMatch.winner && thirdMatch.winner.type !== 'BYE') {
                        const third = thirdMatch.winner;
                        html += `<div class="podium-box podium-bronze">
                            <h3 style="margin:0;">🥉 المركز الثالث</h3>
                            <p style="font-size:18px;margin:8px 0;"><strong>${third.name}</strong></p>
                            <p style="color:#666;margin:0;">🏢 ${third.team}</p>
                        </div>`;
                    }
                }
            }
        }

        // ===== جدول الهدافين =====
        if (schema) {
            const scoreKey = schema.scoreKey;
            const scorers = {};
            let hasGoals = false;
            const allMatches = [];
            groups.forEach(g => g.rounds.flat().forEach(m => allMatches.push(m)));
            ko.matches.forEach(r => r.forEach(m => allMatches.push(m)));
            allMatches.forEach(m => {
                if (!m.scoresheet) return;
                m.scoresheet.teams.forEach(team => {
                    team.players.forEach(p => {
                        const score = parseInt(p.stats[scoreKey]) || 0;
                        if (score === 0) return;
                        hasGoals = true;
                        const key = `${p.name || 'مجهول'}|${team.name}`;
                        if (!scorers[key]) {
                            scorers[key] = { name: p.name || 'مجهول', number: p.number, team: team.name, goals: 0 };
                        }
                        scorers[key].goals += score;
                    });
                });
            });
            if (hasGoals) {
                const sorted = Object.values(scorers).sort((a, b) => b.goals - a.goals).slice(0, 20);
                html += `<h2>⚽ ${schema.scoreLabel} هدافو البطولة</h2>`;
                html += `<table><thead><tr>
                    <th>#</th><th>اللاعب</th><th>الفريق</th><th>${schema.scoreLabel}</th>
                </tr></thead><tbody>`;
                sorted.forEach((s, i) => {
                    html += `<tr>
                        <td>${i + 1}</td>
                        <td>${s.name} ${s.number ? '#' + s.number : ''}</td>
                        <td>${s.team}</td>
                        <td><strong>${s.goals}</strong></td>
                    </tr>`;
                });
                html += `</tbody></table>`;
            }
        }

        html += `</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeName = tournamentName.replace(/[^\w\u0600-\u06FF-]+/g, '_') || 'البطولة';
        link.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.doc`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    window.exportToWord = exportToWord;

    /* ============================================================
       API
       ============================================================ */
    return {
        addGroup,
        deleteGroup,
        updateMatch,
        updateStandings,
        isGroupComplete,
        allGroupsComplete,
        getQualifiedTeams,
        generateRounds,
        exportToWord,
        getPointsSystem,
        LEAGUE_POINTS
    };
})();