/* ============================================================
   export.js - التصدير والمشاركة
   PDF + Excel + QR Code + Share
   النسخة 1.0
   ============================================================ */

window.Export = (function() {
    'use strict';

    /* ============================================================
       تصدير PDF
       ============================================================ */
    async function toPDF() {
        const App = window.App;
        if (!App || !App.state) return;

        if (typeof jspdf === 'undefined' && typeof window.jspdf === 'undefined') {
            alert('مكتبة PDF قيد التحميل. يرجى المحاولة بعد لحظة.');
            return;
        }

        if (typeof html2canvas === 'undefined') {
            alert('مكتبة التصدير قيد التحميل. يرجى المحاولة بعد لحظة.');
            return;
        }

        if (window.Sounds) Sounds.notify();
        if (window.Toast) Toast.info('جاري إنشاء PDF... قد يستغرق بضع ثوان');

        try {
            // إخفاء العناصر التفاعلية مؤقتاً
            document.body.classList.add('exporting-pdf');

            // الانتظار قليلاً
            await new Promise(r => setTimeout(r, 200));

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            // تجميع المحتوى للتصدير
            const contentSections = [];

            // 1. العنوان
            contentSections.push(createTitleElement());

            // 2. جدول البطولة
            const tournamentRounds = document.getElementById('tournamentRounds');
            if (tournamentRounds && tournamentRounds.innerHTML.trim()) {
                contentSections.push(createSectionFromElement(tournamentRounds, 'جدول البطولة'));
            }

            // 3. المجموعات
            const groupsContainer = document.getElementById('groupsContainer');
            if (groupsContainer && groupsContainer.innerHTML.trim()) {
                contentSections.push(createSectionFromElement(groupsContainer, 'دوري المجموعات'));
            }

            // 4. اللاعبون
            const playersList = document.getElementById('playersList');
            if (playersList && playersList.children.length > 0) {
                const playersSection = createSectionFromElement(
                    document.querySelector('#playersSection .table-wrapper'),
                    'قائمة اللاعبين'
                );
                if (playersSection) contentSections.push(playersSection);
            }

            // 5. التقارير
            const reportBody = document.getElementById('reportBody');
            if (reportBody && reportBody.innerHTML.trim()) {
                const reportClone = reportBody.cloneNode(true);
                contentSections.push({
                    title: 'تقرير هدافي البطولة',
                    element: reportClone
                });
            }

            // إنشاء حاوية مؤقتة
            const tempContainer = document.createElement('div');
            tempContainer.style.cssText = `
                position: fixed;
                left: -9999px;
                top: 0;
                width: 800px;
                background: white;
                padding: 20px;
                font-family: 'Cairo', sans-serif;
                direction: rtl;
            `;

            document.body.appendChild(tempContainer);

            let pageNum = 1;
            const pageWidth = 210;  // mm
            const pageHeight = 297;
            const margin = 10;
            const contentWidth = pageWidth - 2 * margin;

            for (let i = 0; i < contentSections.length; i++) {
                const section = contentSections[i];

                // إعداد المحتوى
                tempContainer.innerHTML = '';
                tempContainer.appendChild(section.element);

                // تحويل إلى صورة
                const canvas = await html2canvas(tempContainer, {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 800
                });

                const imgWidth = contentWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                // إذا احتاج صفحة جديدة
                if (i > 0) {
                    doc.addPage();
                    pageNum++;
                }

                // إضافة العنوان
                doc.setFontSize(16);
                doc.setTextColor(30, 41, 59);
                doc.text(section.title || '', pageWidth - margin, margin + 8, { align: 'right' });

                // إضافة الصورة
                const imgData = canvas.toDataURL('image/jpeg', 0.85);
                doc.addImage(imgData, 'JPEG', margin, margin + 15, imgWidth, imgHeight);
            }

            // تنظيف
            document.body.removeChild(tempContainer);
            document.body.classList.remove('exporting-pdf');

            // حفظ الملف
            const tournamentName = App.state.tournamentName || 'البطولة';
            const safeName = tournamentName.replace(/[^\w\u0600-\u06FF-]+/g, '_');
            doc.save(`${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);

            if (window.Sounds) Sounds.victory();
            if (window.Toast) Toast.success('تم إنشاء PDF بنجاح');

        } catch (error) {
            console.error('PDF Export Error:', error);
            document.body.classList.remove('exporting-pdf');
            if (window.Sounds) Sounds.error();
            alert('فشل تصدير PDF: ' + error.message);
        }
    }

    function createTitleElement() {
        const div = document.createElement('div');
        div.style.cssText = 'text-align: center; padding: 20px 0;';
        const tournamentName = (window.App && window.App.state.tournamentName) || 'البطولة';
        div.innerHTML = `
            <h1 style="font-size: 28px; color: #1e293b; margin-bottom: 10px;">
                🏆 ${tournamentName}
            </h1>
            <p style="color: #64748b; font-size: 14px;">
                تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}
            </p>
        `;
        return { title: 'الغلاف', element: div };
    }

    function createSectionFromElement(element, title) {
        const clone = element.cloneNode(true);

        // إزالة العناصر التفاعلية
        clone.querySelectorAll('button, input[type="file"], .action-btn, .update-match, .gs-scoresheet-btn, .scoresheet-toggle, .mini-btn, .ss-add-btn, .ss-add-player-btn, .ss-remove-row, .tt-reset-game, .ss-add-timeout, .install-prompt').forEach(el => el.remove());

        // تحويل input إلى نص
        clone.querySelectorAll('input').forEach(input => {
            const span = document.createElement('span');
            span.textContent = input.value || input.placeholder || '';
            span.style.cssText = 'display: inline-block; padding: 4px; font-weight: 700;';
            input.parentNode.replaceChild(span, input);
        });

        return { title, element: clone };
    }

    /* ============================================================
       تصدير Excel (CSV)
       ============================================================ */
    function toExcel() {
        const App = window.App;
        if (!App || !App.state) return;

        if (window.Sounds) Sounds.notify();

        const state = App.state;
        const schema = window.ScoreSheet ? window.ScoreSheet.getSchema() : null;
        const scoreLabel = schema ? schema.scoreLabel : 'الأهداف';

        // بناء CSV
        let csv = '\uFEFF'; // BOM للعربية

        // عنوان
        csv += `"${state.tournamentName || 'البطولة'}"\n`;
        csv += `"تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}"\n\n`;

        // ===== ورقة 1: قائمة اللاعبين =====
        if (state.knockout.players.length > 0) {
            csv += `"═══ قائمة اللاعبين ═══"\n`;
            csv += `"#","الاسم","الفريق","التصنيف","ترتيب التصنيف"\n`;
            state.knockout.players.forEach((p, i) => {
                csv += `${i + 1},"${p.name}","${p.team}","${p.isSeeded ? 'نعم' : 'لا'}","${p.seedRank || '-'}"\n`;
            });
            csv += '\n';
        }

        // ===== ورقة 2: المجموعات =====
        if (state.groups.groups.length > 0) {
            csv += `"═══ دوري المجموعات ═══"\n\n`;

            state.groups.groups.forEach(g => {
                csv += `"المجموعة ${g.name}"\n`;
                csv += `"الفريق","لعب","فاز","تعادل","خسر","له","عليه","النقاط"\n`;
                g.teams.forEach(t => {
                    csv += `"${t.name}",${t.played},${t.won},${t.drawn},${t.lost},${t.goalsFor},${t.goalsAgainst},${t.points}\n`;
                });

                csv += `\n"مباريات المجموعة ${g.name}:"\n`;
                csv += `"الجولة","فريق 1","فريق 2","النتيجة"\n`;
                g.rounds.forEach((round, rIdx) => {
                    round.forEach(m => {
                        const score = m.score1 !== null ? `${m.score1} - ${m.score2}` : 'لم تُلعب';
                        csv += `"${rIdx + 1}","${m.team1}","${m.team2}","${score}"\n`;
                    });
                });
                csv += '\n';
            });
        }

        // ===== ورقة 3: الإقصائي =====
        if (state.knockout.matches.length > 0) {
            csv += `"═══ مرحلة خروج المغلوب ═══"\n\n`;

            state.knockout.matches.forEach((round, rIdx) => {
                let roundName = `الجولة ${rIdx + 1}`;
                const hasFinal = round.some(m => m.matchType === 'final');
                const hasThird = round.some(m => m.matchType === 'thirdPlace');

                if (hasFinal && hasThird) roundName = 'النهائي + المركز الثالث';
                else if (hasFinal) roundName = 'المباراة النهائية';
                else if (round.length === 2) roundName = 'نصف النهائي';
                else if (round.length === 4) roundName = 'ربع النهائي';

                csv += `"${roundName}"\n`;
                csv += `"اللاعب 1","النتيجة","اللاعب 2","الفائز"\n`;

                round.forEach(m => {
                    const p1 = m.player1.type === 'BYE' ? 'BYE' : m.player1.name;
                    const p2 = m.player2.type === 'BYE' ? 'BYE' : m.player2.name;
                    const score = (m.score1 !== null && m.score2 !== null)
                        ? `${m.score1} - ${m.score2}` : 'لم تُلعب';
                    const winner = m.winner
                        ? (m.winner.type === 'BYE' ? 'BYE' : m.winner.name)
                        : '-';

                    csv += `"${p1}","${score}","${p2}","${winner}"\n`;
                });
                csv += '\n';
            });
        }

        // ===== ورقة 4: الهدافون =====
        const scorers = {};
        const allMatches = [];
        state.groups.groups.forEach(g => g.rounds.flat().forEach(m => allMatches.push(m)));
        state.knockout.matches.forEach(r => r.forEach(m => allMatches.push(m)));

        if (schema) {
            allMatches.forEach(m => {
                if (!m.scoresheet) return;
                m.scoresheet.teams.forEach(team => {
                    (team.players || []).forEach(p => {
                        const score = parseInt((p.stats || {})[schema.scoreKey]) || 0;
                        if (score === 0) return;
                        const key = `${p.name || 'مجهول'}|${team.name}`;
                        if (!scorers[key]) {
                            scorers[key] = {
                                name: p.name || 'مجهول',
                                number: p.number,
                                team: team.name,
                                goals: 0
                            };
                        }
                        scorers[key].goals += score;
                    });
                });
            });

            const topScorers = Object.values(scorers).sort((a, b) => b.goals - a.goals);

            if (topScorers.length > 0) {
                csv += `"═══ هدافو البطولة ═══"\n`;
                csv += `"#","اللاعب","الرقم","الفريق","${scoreLabel}"\n`;
                topScorers.forEach((s, i) => {
                    csv += `${i + 1},"${s.name}","${s.number || '-'}","${s.team}",${s.goals}\n`;
                });
            }
        }

        // تنزيل الملف
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        const tournamentName = state.tournamentName || 'البطولة';
        const safeName = tournamentName.replace(/[^\w\u0600-\u06FF-]+/g, '_');
        link.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;

        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (window.Sounds) Sounds.success();
        if (window.Toast) Toast.success('تم تصدير Excel بنجاح');
    }

    function reportToExcel() {
        const App = window.App;
        if (!App || !App.state) return;

        const schema = window.ScoreSheet ? window.ScoreSheet.getSchema() : null;
        const scoreKey = schema ? schema.scoreKey : 'goals';
        const scoreLabel = schema ? schema.scoreLabel : 'الأهداف';

        const scorers = {};
        const allMatches = [];
        App.state.groups.groups.forEach(g => g.rounds.flat().forEach(m => allMatches.push(m)));
        App.state.knockout.matches.forEach(r => r.forEach(m => allMatches.push(m)));

        allMatches.forEach(m => {
            if (!m.scoresheet) return;
            m.scoresheet.teams.forEach(team => {
                (team.players || []).forEach(p => {
                    const score = parseInt((p.stats || {})[scoreKey]) || 0;
                    if (score === 0) return;
                    const key = `${p.name || 'مجهول'}|${team.name}`;
                    if (!scorers[key]) {
                        scorers[key] = {
                            name: p.name || 'مجهول',
                            number: p.number,
                            team: team.name,
                            goals: 0
                        };
                    }
                    scorers[key].goals += score;
                });
            });
        });

        const topScorers = Object.values(scorers).sort((a, b) => b.goals - a.goals);

        if (topScorers.length === 0) {
            alert('لا توجد بيانات لتصديرها');
            return;
        }

        let csv = '\uFEFF';
        csv += `"تقرير هدافي ${App.state.tournamentName || 'البطولة'}"\n`;
        csv += `"${new Date().toLocaleDateString('ar-EG')}"\n\n`;
        csv += `"#","اللاعب","الرقم","الفريق","${scoreLabel}"\n`;

        topScorers.forEach((s, i) => {
            csv += `${i + 1},"${s.name}","${s.number || '-'}","${s.team}",${s.goals}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = (App.state.tournamentName || 'البطولة').replace(/[^\w\u0600-\u06FF-]+/g, '_');
        link.download = `Scorers_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (window.Sounds) Sounds.success();
        if (window.Toast) Toast.success('تم تصدير تقرير الهدافين');
    }

    /* ============================================================
       مشاركة - QR Code + Link
       ============================================================ */
    function share() {
        const App = window.App;
        if (!App || !App.state) return;

        if (window.Sounds) Sounds.notify();

        const snapshot = App.getSnapshot();
        const jsonData = JSON.stringify(snapshot);

        // ضغط البيانات (إزالة المسافات)
        const compactData = JSON.stringify(JSON.parse(jsonData));

        // تشفير Base64
        let encoded;
        try {
            encoded = btoa(unescape(encodeURIComponent(compactData)));
        } catch (e) {
            encoded = btoa(compactData);
        }

        // حساب الحجم
        const sizeKB = (encoded.length / 1024).toFixed(1);
        const tooLarge = encoded.length > 8000;

        // عرض النافذة
        renderShareModal(encoded, snapshot, sizeKB, tooLarge);
        document.getElementById('shareOverlay').classList.add('active');
    }

    function renderShareModal(encoded, snapshot, sizeKB, tooLarge) {
        const body = document.getElementById('shareBody');
        const tournamentName = snapshot.tournamentName || 'البطولة';

        if (tooLarge) {
            // البيانات كبيرة جداً للـ QR
            body.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 12px;">📦</div>
                    <h3 style="color: #1e293b; margin-bottom: 8px;">البطولة كبيرة للمشاركة عبر QR</h3>
                    <p style="color: #64748b; margin-bottom: 20px; font-size: 0.9rem;">
                        حجم البيانات: ${sizeKB} KB (الحد الأقصى للـ QR هو 8 KB)
                    </p>
                    <p style="color: #64748b; margin-bottom: 20px;">
                        استخدم <strong>تصدير JSON</strong> لمشاركة البطولة كاملة عبر البريد أو الوسائط.
                    </p>
                    <div class="share-actions">
                        <button class="btn btn-gold" onclick="Export.closeShare(); App.current.exportData();">
                            📥 تصدير JSON
                        </button>
                        <button class="btn btn-secondary" onclick="Export.closeShare()">إغلاق</button>
                    </div>
                </div>
            `;
            return;
        }

        // توليد QR عبر API مجاني
        const qrData = encodeURIComponent(encoded);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qrData}&margin=10`;

        // رابط المشاركة (مع البيانات المُشفرة)
        const currentUrl = window.location.href.split('?')[0].split('#')[0];
        const shareUrl = `${currentUrl}#import=${encoded}`;

        body.innerHTML = `
            <div style="text-align: center;">
                <h3 style="color: #1e293b; margin-bottom: 8px;">🔗 ${tournamentName}</h3>
                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 16px;">
                    حجم البيانات: ${sizeKB} KB
                </p>

                <div class="qr-container">
                    <img src="${qrUrl}"
                         alt="QR Code"
                         style="width: 280px; height: 280px; display: block;"
                         onerror="this.parentElement.innerHTML='<p style=\\'color:#dc2626;\\'>فشل تحميل QR - تحقق من الاتصال بالإنترنت</p>'">
                </div>

                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 12px;">
                    امسح الرمز بالكاميرا لتحميل البطولة على جهاز آخر
                </p>

                <div style="margin-top: 16px;">
                    <label style="font-size: 0.8rem; color: #64748b; display: block; margin-bottom: 6px;">
                        أو انسخ الرابط:
                    </label>
                    <div class="share-link" id="shareLinkBox">${shareUrl}</div>
                </div>

                <div class="share-actions">
                    <button class="btn btn-primary" onclick="Export.copyLink('${shareUrl}')">
                        📋 نسخ الرابط
                    </button>
                    <button class="btn btn-excel" onclick="Export.downloadQR('${qrUrl}')">
                        💾 تحميل QR
                    </button>
                    <button class="btn btn-gold" onclick="Export.shareNative('${tournamentName}')">
                        📤 مشاركة
                    </button>
                    <button class="btn btn-secondary" onclick="Export.closeShare()">
                        إغلاق
                    </button>
                </div>
            </div>
        `;
    }

    function closeShare() {
        document.getElementById('shareOverlay').classList.remove('active');
        if (window.Sounds) Sounds.closeModal();
    }

    function copyLink(link) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(() => {
                if (window.Toast) Toast.success('تم نسخ الرابط');
                if (window.Sounds) Sounds.success();
            }).catch(() => {
                fallbackCopy(link);
            });
        } else {
            fallbackCopy(link);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            if (window.Toast) Toast.success('تم نسخ الرابط');
            if (window.Sounds) Sounds.success();
        } catch (e) {
            alert('فشل النسخ. الرابط:\n' + text);
        }
        document.body.removeChild(textarea);
    }

    function downloadQR(qrUrl) {
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = `QR_${new Date().toISOString().slice(0, 10)}.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (window.Toast) Toast.success('جاري تحميل QR');
    }

    function shareNative(tournamentName) {
        const url = window.location.href;
        if (navigator.share) {
            navigator.share({
                title: `بطولة ${tournamentName}`,
                text: `شارك في بطولة ${tournamentName}`,
                url
            }).catch(() => {});
        } else {
            copyLink(url);
        }
    }

    /* ============================================================
       استيراد تلقائي من الرابط (عند فتح رابط مشاركة)
       ============================================================ */
    function checkAutoImport() {
        const hash = window.location.hash;
        if (!hash || !hash.startsWith('#import=')) return;

        try {
            const encoded = hash.substring(8); // إزالة '#import='
            const jsonString = decodeURIComponent(escape(atob(encoded)));
            const data = JSON.parse(jsonString);

            if (!data.knockout && !data.groups) {
                throw new Error('بيانات غير صالحة');
            }

            setTimeout(() => {
                if (confirm(`📥 تم اكتشاف بطولة "${data.tournamentName || 'بدون اسم'}".\nهل تريد تحميلها؟`)) {
                    if (window.App && window.App.applySnapshot) {
                        window.App.applySnapshot(data);
                        window.App.saveSession();
                        if (window.Toast) Toast.success('تم تحميل البطولة بنجاح');
                        if (window.Sounds) Sounds.victory();
                        // إزالة الـ hash من الرابط
                        history.replaceState(null, '', window.location.pathname);
                    }
                }
            }, 500);
        } catch (e) {
            console.error('Auto-import failed:', e);
        }
    }

    /* ============================================================
       التهيئة
       ============================================================ */
    function init() {
        // فحص الاستيراد التلقائي
        if (document.readyState === 'complete') {
            setTimeout(checkAutoImport, 1000);
        } else {
            window.addEventListener('load', () => setTimeout(checkAutoImport, 1000));
        }

        // إغلاق نافذة المشاركة عند النقر خارجها
        const shareOverlay = document.getElementById('shareOverlay');
        if (shareOverlay) {
            shareOverlay.addEventListener('click', e => {
                if (e.target.id === 'shareOverlay') closeShare();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        toPDF,
        toExcel,
        reportToExcel,
        share,
        closeShare,
        copyLink,
        downloadQR,
        shareNative
    };
})();