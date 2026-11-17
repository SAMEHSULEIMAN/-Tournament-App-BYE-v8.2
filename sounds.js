/* ============================================================
   sounds.js - المؤثرات الصوتية باستخدام Web Audio API
   لا يحتاج ملفات صوتية خارجية
   النسخة 1.1 - إضافة openModal و closeModal
   ============================================================ */

window.Sounds = (function() {
    'use strict';

    const STORAGE_KEY = 'app-sounds-enabled';
    let audioContext = null;
    let enabled = true;

    /* ============================================================
       التهيئة
       ============================================================ */
    function init() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            enabled = saved === null ? true : saved === 'true';
        } catch (e) {
            enabled = true;
        }

        // إنشاء AudioContext عند أول تفاعل
        document.addEventListener('click', initAudioContext, { once: true });
        document.addEventListener('keydown', initAudioContext, { once: true });

        updateToggleUI();
    }

    function initAudioContext() {
        if (audioContext) return;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                audioContext = new AudioCtx();
            }
        } catch (e) {
            console.warn('AudioContext not available:', e);
        }
    }

    /* ============================================================
       تشغيل النغمة
       ============================================================ */
    function playTone(frequency, duration, options = {}) {
        if (!enabled) return;
        if (!audioContext) initAudioContext();
        if (!audioContext) return;

        // استئناف السياق إذا كان معلقاً
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const {
            type = 'sine',
            volume = 0.2,
            attack = 0.01,
            decay = 0.1,
            sustain = 0.7,
            release = 0.2
        } = options;

        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.value = frequency;

            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + attack);
            gainNode.gain.linearRampToValueAtTime(volume * sustain, audioContext.currentTime + attack + decay);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + duration);

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration + 0.05);
        } catch (e) {
            console.warn('Play tone error:', e);
        }
    }

    /* ============================================================
       نغمة متعددة
       ============================================================ */
    function playSequence(notes) {
        if (!enabled) return;
        if (!audioContext) initAudioContext();
        if (!audioContext) return;

        notes.forEach(({ freq, dur, delay = 0, type = 'sine', volume = 0.2 }) => {
            setTimeout(() => {
                playTone(freq, dur / 1000, { type, volume });
            }, delay);
        });
    }

    /* ============================================================
       المؤثرات الصوتية
       ============================================================ */

    // 🎯 صوت تسجيل هدف
    function goal() {
        playSequence([
            { freq: 523.25, dur: 150, delay: 0, type: 'triangle', volume: 0.25 },
            { freq: 659.25, dur: 150, delay: 100, type: 'triangle', volume: 0.25 },
            { freq: 783.99, dur: 250, delay: 200, type: 'triangle', volume: 0.3 }
        ]);
    }

    // 🏆 صوت الفوز بالبطولة
    function victory() {
        playSequence([
            { freq: 523.25, dur: 200, delay: 0, type: 'sine', volume: 0.3 },
            { freq: 659.25, dur: 200, delay: 180, type: 'sine', volume: 0.3 },
            { freq: 783.99, dur: 200, delay: 360, type: 'sine', volume: 0.3 },
            { freq: 1046.50, dur: 400, delay: 540, type: 'sine', volume: 0.35 },
            { freq: 783.99, dur: 200, delay: 940, type: 'triangle', volume: 0.3 },
            { freq: 1046.50, dur: 600, delay: 1140, type: 'sine', volume: 0.35 }
        ]);
    }

    // ⚽ صوت البوق (whistle)
    function whistle() {
        playTone(2800, 0.15, { type: 'square', volume: 0.15 });
        setTimeout(() => playTone(3200, 0.15, { type: 'square', volume: 0.15 }), 100);
    }

    // 🔔 صوت انتهاء المباراة
    function matchEnd() {
        playSequence([
            { freq: 880, dur: 200, delay: 0, type: 'square', volume: 0.2 },
            { freq: 880, dur: 200, delay: 250, type: 'square', volume: 0.2 },
            { freq: 880, dur: 400, delay: 500, type: 'square', volume: 0.25 }
        ]);
    }

    // 🎯 صوت النقر
    function click() {
        playTone(800, 0.05, { type: 'sine', volume: 0.1 });
    }

    // ✅ صوت النجاح
    function success() {
        playSequence([
            { freq: 660, dur: 100, delay: 0, type: 'sine', volume: 0.2 },
            { freq: 880, dur: 200, delay: 100, type: 'sine', volume: 0.25 }
        ]);
    }

    // ❌ صوت الخطأ
    function error() {
        playSequence([
            { freq: 400, dur: 150, delay: 0, type: 'square', volume: 0.15 },
            { freq: 300, dur: 250, delay: 150, type: 'square', volume: 0.15 }
        ]);
    }

    // ⚠️ صوت التحذير
    function warning() {
        playTone(600, 0.3, { type: 'triangle', volume: 0.2 });
    }

    // 🎊 صوت الإشعار
    function notify() {
        playSequence([
            { freq: 880, dur: 100, delay: 0, type: 'sine', volume: 0.15 },
            { freq: 1100, dur: 150, delay: 100, type: 'sine', volume: 0.15 }
        ]);
    }

    // 🔄 صوت التبديل
    function toggle() {
        playTone(500, 0.08, { type: 'sine', volume: 0.12 });
    }

    // ⭐ صوت فتح النافذة
    function openModal() {
        playTone(700, 0.1, { type: 'sine', volume: 0.1 });
    }

    // ⭐ صوت إغلاق النافذة
    function closeModal() {
        playTone(500, 0.1, { type: 'sine', volume: 0.1 });
    }

    /* ============================================================
       تشغيل/تعطيل
       ============================================================ */
    function enable() {
        enabled = true;
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch (e) {}
        updateToggleUI();
        notify();
    }

    function disable() {
        enabled = false;
        try {
            localStorage.setItem(STORAGE_KEY, 'false');
        } catch (e) {}
        updateToggleUI();
    }

    function toggleSounds() {
        if (enabled) disable();
        else enable();
    }

    function isEnabled() {
        return enabled;
    }

    function updateToggleUI() {
        const btn = document.getElementById('soundToggle');
        if (!btn) return;

        const icon = btn.querySelector('.sound-icon');
        if (icon) {
            icon.textContent = enabled ? '🔊' : '🔇';
        }
        btn.title = enabled ? 'تعطيل الأصوات' : 'تفعيل الأصوات';
        btn.classList.toggle('muted', !enabled);
    }

    /* ============================================================
       التهيئة
       ============================================================ */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    /* ============================================================
       API العام
       ============================================================ */
    return {
        goal,
        victory,
        whistle,
        matchEnd,
        click,
        success,
        error,
        warning,
        notify,
        openModal,      // ⭐ جديد
        closeModal,     // ⭐ جديد
        toggle: toggleSounds,
        enable,
        disable,
        isEnabled,
        updateToggleUI,
        playTone
    };
})();