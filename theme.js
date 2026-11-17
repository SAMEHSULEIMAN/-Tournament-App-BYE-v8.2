/* ============================================================
   theme.js - الوضع الليلي / النهاري
   ============================================================ */

window.Theme = (function() {
    'use strict';

    const STORAGE_KEY = 'app-theme';
    let currentTheme = 'light';

    function init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'dark') {
            applyTheme('dark');
        } else if (saved === 'light') {
            applyTheme('light');
        } else {
            const prefersDark = window.matchMedia &&
                window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
        }

        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                if (!localStorage.getItem(STORAGE_KEY)) {
                    applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    function applyTheme(theme) {
        currentTheme = theme;
        const btn = document.getElementById('themeToggle');
        const icon = btn ? btn.querySelector('.theme-icon') : null;

        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if (icon) icon.textContent = '☀️';
            if (btn) btn.title = 'تبديل الوضع النهاري';
        } else {
            document.body.classList.remove('dark-mode');
            if (icon) icon.textContent = '🌙';
            if (btn) btn.title = 'تبديل الوضع الليلي';
        }
    }

    function toggle() {
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
    }

    function getTheme() {
        return currentTheme;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        toggle,
        applyTheme,
        getTheme
    };
})();