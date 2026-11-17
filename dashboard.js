/* ============================================================
   dashboard.js - لوحة الإحصائيات الشاملة مع الرسوم البيانية
   النسخة 5.0 - مع Chart.js
   ============================================================ */

window.Dashboard = (function() {
    'use strict';

    let chartInstances = {};

    /* ============================================================
       فتح النافذة
       ============================================================ */
    function open() {
        const App = window.App;
        if (!App || !App.state) return;

        // انتظار تحميل Chart.js
        if (typeof Chart === 'undefined') {
            alert('جاري تحميل مكتبة الرسوم البيانية... يرجى المحاولة بعد لحظة');
            return;
        }

        render();
        document.getElementById('dashboardOverlay').classList.add('active');

        // إعادة رسم الرسوم بعد فتح النافذة
        setTimeout(() => {
            renderCharts();
        }, 100);

        if (window.Sounds) Sounds.openModal();
    }

    function close() {
        // تدمير جميع الرسوم البيانية
        Object.keys(chartInstances).forEach(key => {
            if (chartInstances[key]) {
                chartInstances[key].destroy();
                chartInstances[key] = null;
            }
        });
        chartInstances = {};

        document.getElementById('dashboardOverlay').classList.remove('active');
        if (window.Sounds) Sounds.closeModal();
    }

    function printReport() {
        window.print();
    }

    /* ============================================================
       جمع الإحصائيات
       ============================================================ */
    function collectStats() {
        const App = window.App;
        const state = App.state;

        const stats = {
            tournamentName: state.tournamentName || 'البطولة',
            system: state.system,
            gameType: state.gameType,
            players: 0,
            teams: 0,
            groups: 0,
            totalMatches: 0,
            playedMatches: 0,
            pendingMatches: 0,
            totalGoals: 0,
            scoreSheets: 0,
            scorers: {},
            teamStats: {},
            averageGoalsPerMatch: 0,
            motm: {},
            timelineData: [],
            goalsPerMatch: []
        };

        // ===== دوري المجموعات =====
        const groups = state.groups.groups;
        stats.groups = groups.length;

        groups.forEach(g => {
            stats.teams += g.teams.length;

            g.rounds.flat().forEach(m => {
                stats.totalMatches++;
                if (m.score1 !== null) {
                    stats.playedMatches++;
                    stats.totalGoals += m.score1 + m.score2;
                    stats.goalsPerMatch.push(m.score1 + m.score2);
                } else {
                    stats.pendingMatches++;
                }

                [m.team1, m.team2].forEach(name => {
                    if (name && !stats.teamStats[name]) {
                        stats.teamStats[name] = {
                            name,
                            goalsFor: 0,
                            goalsAgainst: 0,
                            wins: 0,
                            draws: 0,
                            losses: 0,
                            matches: 0,
                            group: g.name
                        };
                    }
                });

                if (m.score1 !== null && m.score2 !== null) {
                    const A = stats.teamStats[m.team1];
                    const B = stats.teamStats[m.team2];
                    if (A) {
                        A.goalsFor += m.score1;
                        A.goalsAgainst += m.score2;
                        A.matches++;
                        if (m.score1 > m.score2) A.wins++;
                        else if (m.score1 < m.score2) A.losses++;
                        else A.draws++;
                    }
                    if (B) {
                        B.goalsFor += m.score2;
                        B.goalsAgainst += m.score1;
                        B.matches++;
                        if (m.score2 > m.score1) B.wins++;
                        else if (m.score2 < m.score1) B.losses++;
                        else B.draws++;
                    }
                }
            });
        });

        // ===== خروج المغلوب =====
        const ko = state.knockout;
        stats.players = ko.players.length;

        ko.matches.forEach((round, roundIdx) => {
            round.forEach(m => {
                stats.totalMatches++;
                if (m.score1 !== null && m.score2 !== null) {
                    stats.playedMatches++;
                    stats.totalGoals += m.score1 + m.score2;
                    stats.goalsPerMatch.push(m.score1 + m.score2);

                    if (m.player1.name && m.player1.type !== 'BYE') {
                        if (!stats.teamStats[m.player1.name]) {
                            stats.teamStats[m.player1.name] = {
                                name: m.player1.name,
                                team: m.player1.team,
                                goalsFor: 0, goalsAgainst: 0,
                                wins: 0, draws: 0, losses: 0,
                                matches: 0, isKnockout: true
                            };
                        }
                        const A = stats.teamStats[m.player1.name];
                        A.goalsFor += m.score1;
                        A.goalsAgainst += m.score2;
                        A.matches++;
                        if (m.score1 > m.score2) A.wins++;
                        else if (m.score1 < m.score2) A.losses++;
                    }

                    if (m.player2.name && m.player2.type !== 'BYE') {
                        if (!stats.teamStats[m.player2.name]) {
                            stats.teamStats[m.player2.name] = {
                                name: m.player2.name,
                                team: m.player2.team,
                                goalsFor: 0, goalsAgainst: 0,
                                wins: 0, draws: 0, losses: 0,
                                matches: 0, isKnockout: true
                            };
                        }
                        const B = stats.teamStats[m.player2.name];
                        B.goalsFor += m.score2;
                        B.goalsAgainst += m.score1;
                        B.matches++;
                        if (m.score2 > m.score1) B.wins++;
                        else if (m.score2 < m.score1) B.losses++;
                    }
                } else {
                    stats.pendingMatches++;
                }
            });
        });

        // ===== Score Sheets =====
        const schema = window.ScoreSheet ? window.ScoreSheet.getSchema() : null;
        const scoreKey = schema ? schema.scoreKey : 'goals';
        const scoreLabel = schema ? schema.scoreLabel : 'الأهداف';

        const allMatches = [];
        groups.forEach(g => g.rounds.flat().forEach(m => allMatches.push(m)));
        ko.matches.forEach(r => r.forEach(m => allMatches.push(m)));

        allMatches.forEach(m => {
            if (!m.scoresheet) return;
            stats.scoreSheets++;

            m.scoresheet.teams.forEach(team => {
                (team.players || []).forEach(p => {
                    const score = parseInt((p.stats || {})[scoreKey]) || 0;
                    if (score === 0) return;

                    const key = `${p.name || 'مجهول'}|${team.name}`;
                    if (!stats.scorers[key]) {
                        stats.scorers[key] = {
                            name: p.name || 'مجهول',
                            number: p.number,
                            team: team.name,
                            goals: 0
                        };
                    }
                    stats.scorers[key].goals += score;
                });
            });

            if (m.scoresheet.motm) {
                const t = m.scoresheet.teams[m.scoresheet.motm.teamIdx];
                if (t && t.players[m.scoresheet.motm.playerIdx]) {
                    const p = t.players[m.scoresheet.motm.playerIdx];
                    const key = `${p.name || 'مجهول'}|${t.name}`;
                    if (!stats.motm[key]) {
                        stats.motm[key] = {
                            name: p.name || 'مجهول',
                            number: p.number,
                            team: t.name,
                            count: 0
                        };
                    }
                    stats.motm[key].count++;
                }
            }
        });

        stats.scoreLabel = scoreLabel;
        stats.averageGoalsPerMatch = stats.playedMatches > 0
            ? (stats.totalGoals / stats.playedMatches).toFixed(1)
            : 0;

        return stats;
    }

    /* ============================================================
       عرض اللوحة
       ============================================================ */
    function render() {
        const stats = collectStats();
        const title = document.getElementById('dashboardTitle');
        title.textContent = `📈 إحصائيات ${stats.tournamentName}`;

        const container = document.getElementById('dashboardContainer');

        const topScorers = Object.values(stats.scorers)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10);

        const topMotm = Object.values(stats.motm)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const topTeams = Object.values(stats.teamStats)
            .filter(t => t.matches > 0)
            .sort((a, b) => {
                const gdA = a.goalsFor - a.goalsAgainst;
                const gdB = b.goalsFor - b.goalsAgainst;
                if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
                return gdB - gdA;
            })
            .slice(0, 10);

        const progressPercent = stats.totalMatches > 0
            ? Math.round((stats.playedMatches / stats.totalMatches) * 100)
            : 0;

        container.innerHTML = `
            <!-- البطاقات الرئيسية -->
            <div class="dashboard-section">
                <h3 class="dashboard-section-title">📊 الملخص العام</h3>
                <div class="stats-grid">
                    <div class="stat-card blue">
                        <span class="stat-icon">🏆</span>
                        <div class="stat-value">${stats.totalMatches}</div>
                        <div class="stat-label">إجمالي المباريات</div>
                    </div>
                    <div class="stat-card green">
                        <span class="stat-icon">✅</span>
                        <div class="stat-value">${stats.playedMatches}</div>
                        <div class="stat-label">مباريات مكتملة</div>
                    </div>
                    <div class="stat-card gold">
                        <span class="stat-icon">⚽</span>
                        <div class="stat-value">${stats.totalGoals}</div>
                        <div class="stat-label">إجمالي ${stats.scoreLabel}</div>
                    </div>
                    <div class="stat-card purple">
                        <span class="stat-icon">📋</span>
                        <div class="stat-value">${stats.scoreSheets}</div>
                        <div class="stat-label">Score Sheets</div>
                    </div>
                    <div class="stat-card cyan">
                        <span class="stat-icon">📈</span>
                        <div class="stat-value">${stats.averageGoalsPerMatch}</div>
                        <div class="stat-label">متوسط لكل مباراة</div>
                    </div>
                    <div class="stat-card red">
                        <span class="stat-icon">⏳</span>
                        <div class="stat-value">${stats.pendingMatches}</div>
                        <div class="stat-label">مباريات متبقية</div>
                    </div>
                </div>
            </div>

            <!-- الرسوم البيانية -->
            <div class="dashboard-section">
                <h3 class="dashboard-section-title">📊 الرسوم البيانية</h3>
                <div class="charts-grid">
                    ${topScorers.length > 0 ? `
                        <div class="chart-card">
                            <div class="chart-card-title">🥇 أفضل 10 هدافين</div>
                            <div class="chart-wrapper">
                                <canvas id="chartTopScorers"></canvas>
                            </div>
                        </div>
                    ` : ''}

                    ${topTeams.length > 0 ? `
                        <div class="chart-card">
                            <div class="chart-card-title">⚽ الأهداف حسب الفريق</div>
                            <div class="chart-wrapper">
                                <canvas id="chartTeamGoals"></canvas>
                            </div>
                        </div>
                    ` : ''}

                    ${topTeams.length > 0 ? `
                        <div class="chart-card">
                            <div class="chart-card-title">📊 نتائج الفرق (فاز/تعادل/خسر)</div>
                            <div class="chart-wrapper">
                                <canvas id="chartTeamResults"></canvas>
                            </div>
                        </div>
                    ` : ''}

                    ${stats.goalsPerMatch.length > 1 ? `
                        <div class="chart-card">
                            <div class="chart-card-title">📈 توزيع الأهداف في المباريات</div>
                            <div class="chart-wrapper">
                                <canvas id="chartGoalsDistribution"></canvas>
                            </div>
                        </div>
                    ` : ''}

                    ${topScorers.length >= 3 ? `
                        <div class="chart-card">
                            <div class="chart-card-title">🎯 مقارنة أهداف أفضل 5 هدافين</div>
                            <div class="chart-wrapper">
                                <canvas id="chartTopScorersRadar"></canvas>
                            </div>
                        </div>
                    ` : ''}

                    ${topTeams.length >= 3 ? `
                        <div class="chart-card">
                            <div class="chart-card-title">⚖️ فارق الأهداف - أفضل 8 فرق</div>
                            <div class="chart-wrapper">
                                <canvas id="chartGoalDifference"></canvas>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- شريط التقدم -->
            <div class="dashboard-section">
                <h3 class="dashboard-section-title">📅 تقدم البطولة</h3>
                <div class="progress-bar-container">
                    <div class="progress-header">
                        <span>نسبة الاكتمال</span>
                        <span><strong>${progressPercent}%</strong></span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-header">
                        <span>Score Sheets المكتملة</span>
                        <span><strong>${stats.scoreSheets} / ${stats.playedMatches}</strong></span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill"
                             style="width: ${stats.playedMatches > 0 ? (stats.scoreSheets / stats.playedMatches * 100) : 0}%; background: linear-gradient(90deg, #0891b2, #06b6d4);">
                        </div>
                    </div>
                </div>
            </div>

            <!-- الهدافون -->
            ${topScorers.length > 0 ? `
                <div class="dashboard-section">
                    <h3 class="dashboard-section-title">🥇 هدافو البطولة — Top ${Math.min(10, topScorers.length)}</h3>
                    <div class="top-scorers-dash">
                        ${topScorers.map((s, i) => `
                            <div class="scorer-row ${i < 3 ? 'rank-' + (i + 1) : ''}">
                                <div class="scorer-rank">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</div>
                                <div class="scorer-info">
                                    <div class="scorer-name">
                                        ${s.name}
                                        ${s.number ? `<span style="color: #64748b; font-size: 0.8rem;">#${s.number}</span>` : ''}
                                    </div>
                                    <div class="scorer-team">🏢 ${s.team}</div>
                                </div>
                                <div class="scorer-goals">
                                    ${s.goals}<small> ${stats.scoreLabel}</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- نجوم المباريات -->
            ${topMotm.length > 0 ? `
                <div class="dashboard-section">
                    <h3 class="dashboard-section-title">🌟 نجوم المباريات (MOTM)</h3>
                    <div class="top-scorers-dash">
                        ${topMotm.map((s, i) => `
                            <div class="scorer-row ${i === 0 ? 'rank-1' : ''}">
                                <div class="scorer-rank">${i === 0 ? '👑' : i + 1}</div>
                                <div class="scorer-info">
                                    <div class="scorer-name">
                                        ${s.name}
                                        ${s.number ? `<span style="color: #64748b; font-size: 0.8rem;">#${s.number}</span>` : ''}
                                    </div>
                                    <div class="scorer-team">🏢 ${s.team}</div>
                                </div>
                                <div class="scorer-goals" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                                    ${s.count}<small> مرة</small>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- إحصائيات الفرق -->
            ${topTeams.length > 0 ? `
                <div class="dashboard-section">
                    <h3 class="dashboard-section-title">🏢 إحصائيات الفرق</h3>
                    <div style="overflow-x: auto;">
                        <table class="teams-stats-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>الفريق</th>
                                    <th>مباريات</th>
                                    <th>فاز</th>
                                    <th>تعادل</th>
                                    <th>خسر</th>
                                    <th>له</th>
                                    <th>عليه</th>
                                    <th>الفرق</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${topTeams.map((t, i) => {
                                    const gd = t.goalsFor - t.goalsAgainst;
                                    const gdStr = gd > 0 ? '+' + gd : String(gd);
                                    return `
                                        <tr>
                                            <td><strong>${i + 1}</strong></td>
                                            <td style="text-align: right; padding-right: 15px;">
                                                <strong>${t.name}</strong>
                                                ${t.group ? `<div style="font-size: 0.75rem; color: #64748b;">مجموعة ${t.group}</div>` : ''}
                                            </td>
                                            <td>${t.matches}</td>
                                            <td style="color: #16a34a; font-weight: 700;">${t.wins}</td>
                                            <td style="color: #64748b;">${t.draws}</td>
                                            <td style="color: #dc2626; font-weight: 700;">${t.losses}</td>
                                            <td><strong>${t.goalsFor}</strong></td>
                                            <td>${t.goalsAgainst}</td>
                                            <td style="color: ${gd > 0 ? '#16a34a' : gd < 0 ? '#dc2626' : '#64748b'}; font-weight: 700;">
                                                ${gdStr}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}

            ${Object.keys(stats.scorers).length === 0 ? `
                <div class="empty-state" style="padding: 60px 20px;">
                    <div style="font-size: 4rem; margin-bottom: 16px;">📊</div>
                    <p style="font-size: 1.1rem; margin-bottom: 8px;">لا توجد بيانات كافية بعد</p>
                    <p style="font-size: 0.9rem; color: var(--text-light);">
                        املأ Score Sheets للمباريات لعرض الإحصائيات التفصيلية
                    </p>
                </div>
            ` : ''}
        `;
    }

    /* ============================================================
       رسم الرسوم البيانية
       ============================================================ */
    function renderCharts() {
        const stats = collectStats();
        const isDark = document.body.classList.contains('dark-mode');
        const textColor = isDark ? '#f1f5f9' : '#1e293b';
        const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

        const topScorers = Object.values(stats.scorers)
            .sort((a, b) => b.goals - a.goals)
            .slice(0, 10);

        const topTeams = Object.values(stats.teamStats)
            .filter(t => t.matches > 0)
            .sort((a, b) => b.goalsFor - a.goalsFor)
            .slice(0, 10);

        // إعدادات Chart.js العامة
        Chart.defaults.font.family = "'Cairo', sans-serif";
        Chart.defaults.font.size = 12;
        Chart.defaults.color = textColor;

        // 1) Bar Chart - أفضل 10 هدافين
        renderTopScorersChart(topScorers, textColor, gridColor);

        // 2) Bar Chart - الأهداف حسب الفريق
        renderTeamGoalsChart(topTeams, textColor, gridColor);

        // 3) Stacked Bar - نتائج الفرق
        renderTeamResultsChart(topTeams, textColor, gridColor);

        // 4) Line Chart - توزيع الأهداف
        renderGoalsDistributionChart(stats.goalsPerMatch, textColor, gridColor);

        // 5) Radar Chart - مقارنة أفضل 5 هدافين
        renderTopScorersRadarChart(topScorers, textColor, gridColor);

        // 6) Horizontal Bar - فارق الأهداف
        renderGoalDifferenceChart(topTeams, textColor, gridColor);
    }

    function renderTopScorersChart(scorers, textColor, gridColor) {
        const canvas = document.getElementById('chartTopScorers');
        if (!canvas || scorers.length === 0) return;

        if (chartInstances.topScorers) chartInstances.topScorers.destroy();

        const ctx = canvas.getContext('2d');
        const labels = scorers.map(s => `#${s.number || '?'} ${s.name}`);
        const data = scorers.map(s => s.goals);

        // تدرج لوني
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, '#2563eb');
        gradient.addColorStop(1, '#60a5fa');

        chartInstances.topScorers = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'الأهداف',
                    data,
                    backgroundColor: gradient,
                    borderRadius: 8,
                    borderSkipped: false,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#fbbf24',
                        bodyColor: '#fff',
                        padding: 12,
                        cornerRadius: 8,
                        titleFont: { weight: 'bold' },
                        callbacks: {
                            label: (ctx) => `⚽ ${ctx.parsed.y} هدف`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            stepSize: 1,
                            font: { weight: 'bold' }
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderTeamGoalsChart(teams, textColor, gridColor) {
        const canvas = document.getElementById('chartTeamGoals');
        if (!canvas || teams.length === 0) return;

        if (chartInstances.teamGoals) chartInstances.teamGoals.destroy();

        const ctx = canvas.getContext('2d');
        const labels = teams.map(t => t.name);
        const goalsFor = teams.map(t => t.goalsFor);
        const goalsAgainst = teams.map(t => t.goalsAgainst);

        chartInstances.teamGoals = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'أهداف له',
                        data: goalsFor,
                        backgroundColor: 'rgba(22, 163, 74, 0.85)',
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: 'أهداف عليه',
                        data: goalsAgainst,
                        backgroundColor: 'rgba(220, 38, 38, 0.85)',
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: { weight: 'bold' },
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor, stepSize: 1 },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderTeamResultsChart(teams, textColor, gridColor) {
        const canvas = document.getElementById('chartTeamResults');
        if (!canvas || teams.length === 0) return;

        if (chartInstances.teamResults) chartInstances.teamResults.destroy();

        const ctx = canvas.getContext('2d');
        const labels = teams.map(t => t.name);
        const wins = teams.map(t => t.wins);
        const draws = teams.map(t => t.draws);
        const losses = teams.map(t => t.losses);

        chartInstances.teamResults = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'فاز',
                        data: wins,
                        backgroundColor: 'rgba(22, 163, 74, 0.9)',
                        borderRadius: 6
                    },
                    {
                        label: 'تعادل',
                        data: draws,
                        backgroundColor: 'rgba(148, 163, 184, 0.9)',
                        borderRadius: 6
                    },
                    {
                        label: 'خسر',
                        data: losses,
                        backgroundColor: 'rgba(220, 38, 38, 0.9)',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: textColor,
                            font: { weight: 'bold' },
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            color: textColor,
                            font: { size: 10 },
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { display: false }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: { color: textColor, stepSize: 1 },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }

    function renderGoalsDistributionChart(goalsPerMatch, textColor, gridColor) {
        const canvas = document.getElementById('chartGoalsDistribution');
        if (!canvas || goalsPerMatch.length < 2) return;

        if (chartInstances.goalsDistribution) chartInstances.goalsDistribution.destroy();

        const ctx = canvas.getContext('2d');

        // توزيع الأهداف (0، 1، 2، 3، 4+)
        const distribution = { '0-1': 0, '2-3': 0, '4-5': 0, '6-7': 0, '8+': 0 };
        goalsPerMatch.forEach(g => {
            if (g <= 1) distribution['0-1']++;
            else if (g <= 3) distribution['2-3']++;
            else if (g <= 5) distribution['4-5']++;
            else if (g <= 7) distribution['6-7']++;
            else distribution['8+']++;
        });

        chartInstances.goalsDistribution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(distribution),
                datasets: [{
                    label: 'عدد المباريات',
                    data: Object.values(distribution),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#fbbf24',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => `📊 ${ctx.parsed.y} مباراة`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor, stepSize: 1 },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor, font: { weight: 'bold' } },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    function renderTopScorersRadarChart(scorers, textColor, gridColor) {
        const canvas = document.getElementById('chartTopScorersRadar');
        if (!canvas || scorers.length < 3) return;

        if (chartInstances.topScorersRadar) chartInstances.topScorersRadar.destroy();

        const ctx = canvas.getContext('2d');
        const top5 = scorers.slice(0, 5);
        const labels = top5.map(s => `#${s.number || '?'} ${s.name}`);
        const data = top5.map(s => s.goals);

        const colors = [
            'rgba(37, 99, 235, 0.6)',
            'rgba(22, 163, 74, 0.6)',
            'rgba(245, 158, 11, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(236, 72, 153, 0.6)'
        ];

        chartInstances.topScorersRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels,
                datasets: [{
                    label: 'الأهداف',
                    data,
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: '#2563eb',
                    borderWidth: 2,
                    pointBackgroundColor: colors,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#fbbf24',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => `⚽ ${ctx.parsed.r} هدف`
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            backdropColor: 'transparent',
                            stepSize: 1
                        },
                        grid: { color: gridColor },
                        angleLines: { color: gridColor },
                        pointLabels: {
                            color: textColor,
                            font: { size: 11, weight: 'bold' }
                        }
                    }
                }
            }
        });
    }

    function renderGoalDifferenceChart(teams, textColor, gridColor) {
        const canvas = document.getElementById('chartGoalDifference');
        if (!canvas || teams.length < 3) return;

        if (chartInstances.goalDifference) chartInstances.goalDifference.destroy();

        const ctx = canvas.getContext('2d');
        const top8 = teams
            .map(t => ({ ...t, gd: t.goalsFor - t.goalsAgainst }))
            .sort((a, b) => b.gd - a.gd)
            .slice(0, 8);

        const labels = top8.map(t => t.name);
        const data = top8.map(t => t.gd);

        const bgColors = data.map(gd =>
            gd > 0 ? 'rgba(22, 163, 74, 0.85)' :
            gd < 0 ? 'rgba(220, 38, 38, 0.85)' :
            'rgba(148, 163, 184, 0.85)'
        );

        chartInstances.goalDifference = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'فارق الأهداف',
                    data,
                    backgroundColor: bgColors,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1200,
                    easing: 'easeOutQuart'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        titleColor: '#fbbf24',
                        padding: 12,
                        cornerRadius: 8,
                        callbacks: {
                            label: (ctx) => {
                                const v = ctx.parsed.x;
                                return `⚖️ ${v > 0 ? '+' : ''}${v}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: textColor, font: { weight: 'bold' } },
                        grid: { color: gridColor }
                    },
                    y: {
                        ticks: {
                            color: textColor,
                            font: { size: 11, weight: 'bold' }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    /* ============================================================
       تصدير الرسوم كـ PNG
       ============================================================ */
    function exportCharts() {
        const canvas = document.getElementById('dashboardContainer');
        if (!canvas) return;

        if (typeof html2canvas === 'undefined') {
            alert('مكتبة التصدير قيد التحميل. حاول مرة أخرى بعد لحظة.');
            return;
        }

        if (window.Sounds) Sounds.notify();

        // انتظار تحميل جميع الرسوم
        setTimeout(() => {
            html2canvas(canvas, {
                backgroundColor: document.body.classList.contains('dark-mode') ? '#0f172a' : '#f8fafc',
                scale: 2,
                useCORS: true,
                logging: false
            }).then(canvasEl => {
                const link = document.createElement('a');
                const tournamentName = (window.App && window.App.state.tournamentName) || 'dashboard';
                const safeName = tournamentName.replace(/[^\w\u0600-\u06FF-]+/g, '_');
                link.download = `Dashboard_${safeName}_${new Date().toISOString().slice(0, 10)}.png`;
                link.href = canvasEl.toDataURL('image/png');
                link.click();

                if (window.Toast) {
                    Toast.success('تم تصدير لوحة الإحصائيات بنجاح');
                }
            }).catch(err => {
                console.error('Export error:', err);
                alert('فشل التصدير: ' + err.message);
            });
        }, 300);
    }

    /* ============================================================
       التهيئة
       ============================================================ */
    function init() {
        const overlay = document.getElementById('dashboardOverlay');
        if (overlay) {
            overlay.addEventListener('click', e => {
                if (e.target.id === 'dashboardOverlay') close();
            });
        }

        // إعادة رسم الرسوم عند تغيير الثيم
        document.addEventListener('themeChanged', () => {
            const overlay = document.getElementById('dashboardOverlay');
            if (overlay && overlay.classList.contains('active')) {
                setTimeout(() => renderCharts(), 200);
            }
        });
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
        printReport,
        exportCharts,
        collectStats
    };
})();