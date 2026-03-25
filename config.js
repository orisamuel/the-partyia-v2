/**
 * config.js — הגדרות המערכת
 * הפרתיה v3 — פאב קהילתי נופי פרת
 *
 * ← ערוך כאן את כל ההגדרות הנדרשות
 */
const CONFIG = {

    // ── Google Apps Script ──────────────────────────────────
    // העתק כאן את ה-URL של ה-Deployment החדש שלך ב-Apps Script
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwatJBJsYvJeF65FFe4CNmL0NI28_cGtIwDo9a01xlB8rpyVpOOCsLcj00KcgDL0Y3LiQ/exec',

    // ── Google Sheets ────────────────────────────────────────
    // קישור ישיר לגיליון הנתונים (לכפתור "פתח Sheets" בממשק)
    SHEETS_URL: 'https://docs.google.com/spreadsheets/d/1b7i4Nn0ajOVKwZSWUpDVanezscA50Jdh1harmJqiSZY',

    // ── שם האפליקציה ─────────────────────────────────────────
    APP_NAME: 'הפרתיה',
    APP_SUBTITLE: 'פאב קהילתי נופי פרת',

    // ── הגדרות מערכת ─────────────────────────────────────────
    // זמן בין polling בדף הבונים (מילי-שניות)
    POLL_INTERVAL_MS: 3000,

    // הפעל/בטל צליל התראה להזמנה חדשה בדף הבונים
    NEW_ORDER_SOUND: true,

    // כמה שעות עד שהמערכת נכבית אוטומטית בדף הבונים
    AUTO_STOP_HOURS: 5,

    // כמה הזמנות אחרונות להציג בפאנל ב-index.html
    RECENT_ORDERS_DISPLAY: 10,

    // ── ערכת נושא ────────────────────────────────────────────
    // ערכת ברירת מחדל: 'dark' או 'light'
    DEFAULT_THEME: 'dark',
};
