/**
 * utils.js - פונקציות עזר משותפות לכל הדפים
 * הפרתיה - פאב קהילתי נופי פרת
 */

// עדכון טקסט מסך הטעינה
function updateLoadingProgress(text) {
    const el = document.getElementById('loadingProgress');
    if (el) el.textContent = text;
}

// הסתרת מסך טעינה והצגת תוכן ראשי
function hideLoadingScreen(delay = 500) {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainContent = document.getElementById('mainContent');
        if (loadingScreen) loadingScreen.classList.add('hidden');
        if (mainContent) mainContent.classList.add('visible');
    }, delay);
}

// קריאה ל-API של גוגל סקריפט
async function apiCall(action, params = {}) {
    const urlParams = new URLSearchParams({ action, ...params });
    const response = await fetch(CONFIG.SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: urlParams,
    });
    if (!response.ok) {
        throw new Error(`שגיאת שרת: ${response.status}`);
    }
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        return { success: true, raw: text };
    }
}

// הצגת הודעת סטטוס
function showStatus(message, type = 'info', duration = 5000) {
    const statusDiv = document.getElementById('status');
    if (!statusDiv) return;
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    if (duration > 0) {
        setTimeout(() => {
            statusDiv.textContent = '';
            statusDiv.className = '';
        }, duration);
    }
}
