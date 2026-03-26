/**
 * utils.js — פונקציות עזר משותפות לכל הדפים
 * הפרתיה v3
 */

// ── Theme ──────────────────────────────────────────────────

function initTheme() {
    const saved = localStorage.getItem('partyia-theme') || (typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_THEME : 'dark');
    document.documentElement.dataset.theme = saved;
    updateThemeToggleIcon(saved);
}

function toggleTheme() {
    const current = document.documentElement.dataset.theme || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('partyia-theme', next);
    updateThemeToggleIcon(next);
}

function updateThemeToggleIcon(theme) {
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ── Loading Screen ─────────────────────────────────────────

function updateLoadingProgress(text) {
    const el = document.getElementById('loadingProgress');
    if (el) el.textContent = text;
}

function hideLoadingScreen(delay = 400) {
    setTimeout(() => {
        const screen = document.getElementById('loadingScreen');
        const content = document.getElementById('mainContent');
        if (screen) screen.classList.add('hidden');
        if (content) content.classList.add('visible');
    }, delay);
}

// ── API ────────────────────────────────────────────────────

// שולח warm-up ping לפני הקריאה הראשית (מונע cold start)
function warmupServer() {
    if (typeof CONFIG === 'undefined') return;
    fetch(CONFIG.SCRIPT_URL + '?action=ping').catch(() => {});
}

async function apiCall(action, params = {}) {
    if (typeof CONFIG === 'undefined') throw new Error('CONFIG לא טעון');
    const url = CONFIG.SCRIPT_URL + '?' + new URLSearchParams({ action, ...params });
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error('שגיאת שרת: ' + res.status);
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { success: true, raw: text }; }
}

// ── Toast Notifications ────────────────────────────────────

(function initToastContainer() {
    if (typeof document === 'undefined') return;
    document.addEventListener('DOMContentLoaded', () => {
        if (!document.getElementById('toastContainer')) {
            const el = document.createElement('div');
            el.id = 'toastContainer';
            el.className = 'toast-container';
            document.body.appendChild(el);
        }
    });
})();

function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ'}</span><span class="toast-msg">${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-show'));
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 350);
    }, duration);
}

// backward-compat alias
function showStatus(message, type = 'info', duration = 5000) {
    showToast(message, type, duration);
}

// ── Auth ────────────────────────────────────────────────────

const AUTH_KEY     = 'partyia_auth';
const AUTH_TTL_MS  = 12 * 60 * 60 * 1000; // 12 שעות

function getAuthSession() {
    try {
        const raw = sessionStorage.getItem(AUTH_KEY);
        if (!raw) return null;
        const s = JSON.parse(raw);
        if (!s.loggedIn || Date.now() > s.exp) {
            sessionStorage.removeItem(AUTH_KEY);
            return null;
        }
        return s;
    } catch (_) { return null; }
}

function setAuthSession(username) {
    sessionStorage.setItem(AUTH_KEY, JSON.stringify({
        loggedIn: true,
        user: username,
        exp: Date.now() + AUTH_TTL_MS
    }));
}

function clearAuthSession() {
    sessionStorage.removeItem(AUTH_KEY);
}

function logout() {
    clearAuthSession();
    window.location.href = 'login.html';
}

// קרא בתחילת כל דף מוגן — מפנה ל-login.html אם אין סשן
function requireAuth() {
    if (!getAuthSession()) {
        sessionStorage.setItem('partyia_redirect', window.location.href);
        window.location.href = 'login.html';
    }
}

// ── Re-auth dialog for critical operations ──────────────────

let _reAuthCallback = null;

function requirePassword(callback) {
    _reAuthCallback = callback;
    const modal = document.getElementById('reAuthModal');
    if (!modal) { _buildReAuthModal(); }
    document.getElementById('reAuthPassword').value = '';
    document.getElementById('reAuthError').textContent = '';
    document.getElementById('reAuthModal').classList.add('open');
    setTimeout(() => document.getElementById('reAuthPassword').focus(), 100);
}

function _buildReAuthModal() {
    const div = document.createElement('div');
    div.id = 'reAuthModal';
    div.className = 'modal-backdrop';
    div.onclick = (e) => { if (e.target === div) div.classList.remove('open'); };
    div.innerHTML = `
      <div class="modal" style="max-width:360px;">
        <div class="modal-header">
          <span class="modal-title">🔐 אימות לפעולה קריטית</span>
          <button class="modal-close" onclick="document.getElementById('reAuthModal').classList.remove('open')">✕</button>
        </div>
        <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:16px;">הכנס סיסמה כדי לאשר את הפעולה</p>
        <div class="form-group">
          <input type="password" id="reAuthPassword" class="form-input" placeholder="סיסמה"
            onkeydown="if(event.key==='Enter') submitReAuth()">
        </div>
        <div id="reAuthError" style="color:var(--danger);font-size:0.82rem;min-height:18px;"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('reAuthModal').classList.remove('open')">ביטול</button>
          <button class="btn btn-primary" onclick="submitReAuth()">✓ אשר</button>
        </div>
      </div>`;
    document.body.appendChild(div);
}

async function submitReAuth() {
    const pwd = document.getElementById('reAuthPassword').value;
    const session = getAuthSession();
    if (!session) { window.location.href = 'login.html'; return; }
    try {
        const res = await apiCall('validateCredentials', { username: session.user, password: pwd });
        if (res.success) {
            document.getElementById('reAuthModal').classList.remove('open');
            if (_reAuthCallback) { _reAuthCallback(); _reAuthCallback = null; }
        } else {
            document.getElementById('reAuthError').textContent = 'סיסמה שגויה';
        }
    } catch (_) {
        document.getElementById('reAuthError').textContent = 'שגיאת חיבור';
    }
}

// ── Formatting ─────────────────────────────────────────────

function formatCurrency(amount) {
    return '₪' + Math.abs(amount).toLocaleString('he-IL');
}

function formatTime(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d)) return ts;
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

// ── Sound (Web Audio API) ──────────────────────────────────

function playNewOrderSound() {
    if (typeof CONFIG !== 'undefined' && CONFIG.NEW_ORDER_SOUND === false) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const play = (freq, start, dur) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
            gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
            osc.start(ctx.currentTime + start);
            osc.stop(ctx.currentTime + start + dur);
        };
        play(880, 0, 0.18);
        play(1100, 0.2, 0.22);
    } catch (e) {}
}
