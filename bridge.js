/* ============================================================
   bridge.js - جسر الربط من المجموعات إلى الإقصائيات
   ============================================================ */

window.Bridge = (function() {
    'use strict';

    function isBridgeReady() {
        return window.Groups.allGroupsComplete();
    }

    function updateBridgeBanner() {
        const App = window.App;
        if (!App || !App.state) return;

        const banner = document.getElementById('bridgeBanner');
        if (!banner) return;

        if (App.state.system !== 'hybrid') {
            banner.hidden = true;
            return;
        }

        if (App.state.knockout.matches.length > 0) {
            banner.hidden = true;
            return;
        }

        if (!isBridgeReady()) {
            banner.hidden = true;
            return;
        }

        banner.hidden = false;
        const qpgEl = document.getElementById('qualifiersPerGroup');
        const qpg = qpgEl ? parseInt(qpgEl.value) || 2 : 2;
        const qualified = window.Groups.getQualifiedTeams(qpg);

        document.getElementById('bridgeInfo').textContent =
            `✅ ${qualified.length} فريق متأهل (${qpg} من كل مجموعة) — جاهزون للأدوار الإقصائية`;
    }

    function arrangeQualifiedForKnockout(qualified, groupsCount) {
        const byGroup = {};
        qualified.forEach(t => {
            if (!byGroup[t.groupName]) byGroup[t.groupName] = {};
            byGroup[t.groupName][t.position] = t;
        });

        const groupNames = Object.keys(byGroup).sort();
        const arranged = [];

        if (groupNames.length === 2) {
            arranged.push(byGroup[groupNames[0]][1], byGroup[groupNames[1]][2]);
            arranged.push(byGroup[groupNames[1]][1], byGroup[groupNames[0]][2]);
        } else if (groupNames.length === 4) {
            arranged.push(byGroup[groupNames[0]][1], byGroup[groupNames[1]][2]);
            arranged.push(byGroup[groupNames[2]][1], byGroup[groupNames[3]][2]);
            arranged.push(byGroup[groupNames[1]][1], byGroup[groupNames[0]][2]);
            arranged.push(byGroup[groupNames[3]][1], byGroup[groupNames[2]][2]);
        } else if (groupNames.length === 8) {
            const pairings = [
                [0, 1], [2, 3], [4, 5], [6, 7],
                [1, 0], [3, 2], [5, 4], [7, 6]
            ];
            pairings.forEach(([g1, g2]) => {
                if (byGroup[groupNames[g1]] && byGroup[groupNames[g2]]) {
                    arranged.push(byGroup[groupNames[g1]][1], byGroup[groupNames[g2]][2]);
                }
            });
        } else {
            for (let i = 0; i < groupNames.length; i += 2) {
                const g1 = groupNames[i];
                const g2 = groupNames[i + 1] || groupNames[0];
                if (byGroup[g1] && byGroup[g2]) {
                    arranged.push(byGroup[g1][1], byGroup[g2][2]);
                    if (byGroup[g2][1] && byGroup[g1][2]) {
                        arranged.push(byGroup[g2][1], byGroup[g1][2]);
                    }
                }
            }
        }

        return arranged.filter(Boolean);
    }

    function transfer() {
        const App = window.App;
        if (!App || !App.state) return;

        if (!isBridgeReady()) {
            return alert('لم يكتمل دور المجموعات بعد');
        }

        if (!confirm('سيتم نقل الفرق المتأهلة إلى الأدوار الإقصائية.\nهل تريد المتابعة؟')) return;

        const qpgEl = document.getElementById('qualifiersPerGroup');
        const qpg = qpgEl ? parseInt(qpgEl.value) || 2 : 2;
        const qualified = window.Groups.getQualifiedTeams(qpg);

        const groupsCount = App.state.groups.groups.length;
        const totalQualified = qualified.length;

        const validSizes = [4, 8, 16, 32, 64, 128];
        const targetSize = validSizes.find(s => s >= totalQualified);

        if (!targetSize) {
            return alert(`عدد الفرق المتأهلة (${totalQualified}) كبير جداً`);
        }

        const arranged = arrangeQualifiedForKnockout(qualified, groupsCount);

        const players = arranged.map((team, index) => ({
            id: Date.now() + index + Math.random(),
            name: team.name,
            team: team.groupName,
            isSeeded: team.position === 1,
            seedRank: team.position === 1 ? index + 1 : null,
            fromGroup: team.groupName,
            groupPosition: team.position
        }));

        qualified.forEach(t => {
            if (!players.find(p => p.name === t.name && p.team === t.groupName)) {
                players.push({
                    id: Date.now() + players.length + Math.random(),
                    name: t.name,
                    team: t.groupName,
                    isSeeded: t.position === 1,
                    seedRank: null,
                    fromGroup: t.groupName,
                    groupPosition: t.position
                });
            }
        });

        App.state.knockout.players = players;
        App.state.knockout.matches = [];
        App.state.knockout.currentRound = 0;

        App.saveSession();
        App.ui.switchSystem('knockout');

        setTimeout(() => {
            window.Knockout.conductDraw();
            alert(`✅ تم ترحيل ${players.length} فريق. جاهز للأدوار الإقصائية!`);
        }, 200);
    }

    return {
        transfer,
        updateBridgeBanner,
        isBridgeReady,
        arrangeQualifiedForKnockout
    };
})();