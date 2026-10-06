/**
 * tower.js: מגדל הכיסאות.
 * סוף ערב בפרתיה. כיסא פלסטיק לבן נע מעל הערימה, טאפ מוריד אותו.
 * ככל שהמגדל עקום יותר הוא מתנדנד יותר, ובסוף הוא נופל בהילוך איטי. קלונק.
 *
 * window.PartyiaGames.tower = { title, mount(stage, ctx) -> { destroy() } }
 * ctx: { Deer, joinTeam(), share(text), close(), restart() }
 *
 * גרסה 2 (team-v2.html): אותו משחק, בשפה של האתר החדש. נייר קרם, דיו חום, שמש כתומה,
 * Karantina לכותרות ולמספרים, Rubik לטקסט. לא תלוי ב-team/brand.css: כל הסגנון מוזרק כאן.
 *
 * ציור: קנבס אחד (שמיים, נוף, נורות, סימוני גובה, כיסאות). הצבי, ה-HUD והכיתובים ב-DOM.
 * יחידות עולם: 1 יחידה = פיקסל אחד במסך ברוחב 375. y עולה כלפי מעלה, 0 = הרצפה.
 */
(function () {
    'use strict';

    const ID = 'tower';

    // ---- מידות (יחידות עולם) ----
    const CW = 96;         // רוחב כיסא
    const CH = 118;        // גובה כיסא
    const STEP = 34;       // כמה כל כיסא מוסיף לגובה כשהוא נכנס לקודם
    const GROUND = 92;     // עומק הדק שנראה מתחת לקו הרצפה
    const HOVER = 40;      // הכיסא שנע מרחף מעל ראש המגדל
    const HUD_ROOM = 106;  // מקום פנוי בראש המסך (פיקסלים)
    const PERFECT = 7;     // סטייה שנחשבת "בול"
    const topH = n => CH + (n - 1) * STEP;

    const MARKERS = [
        { key: 'bar', name: 'הבר', chair: 2 },
        { key: 'deer', name: 'גובה הצבי עם הקרניים', chair: 5 },
        { key: 'lights', name: 'שרשרת הנורות', chair: 10 },
        { key: 'prat', name: 'מכאן רואים את הפרת', chair: 19 },
        { key: 'moon', name: 'הירח', chair: 30 },
    ];
    MARKERS.forEach(m => { m.y = topH(m.chair) - 6; });
    const DEER_H = MARKERS[1].y;

    const LINES = {
        bar: c => `מכיסא מספר ${c} אפשר להזמין מהבר בלי לקום.`,
        deer: c => `מכיסא מספר ${c} המגדל עבר את הצבי. הצבי לקח את זה יפה.`,
        lights: c => `מכיסא מספר ${c} אפשר להחליף נורה בשרשרת בלי סולם.`,
        prat: c => `מכיסא מספר ${c} רואים את הפרת.`,
        moon: c => `מכיסא מספר ${c} מגיעים לירח. המדידה נבדקה פעמיים.`,
    };

    // הפלטה של האתר החדש (team-v2/style.css), והלילה במשפחה של --night
    const COL = {
        orange: '#E8873B', orangeDeep: '#C4531A', cream: '#F4EADB', creamLight: '#FBF3E6',
        creamDim: '#D9CBB4', brown: '#2E1710', ink2: '#5E4135', ink3: '#6F5345',
        night0: '#0D1626', night1: '#111D30', night2: '#17263D', night3: '#203455',
    };
    const DISPLAY = "'Karantina','Rubik',sans-serif";
    const BODY = "'Rubik','Segoe UI',Tahoma,sans-serif";
    // גרעין נייר, כמו ברקע של האתר (שם הוא בשקיפות .32 ו-multiply, כאן אותה עוצמה בתוך הצבע)
    const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .22 0 0 0 0 .12 0 0 0 .14 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
    const GRAIN_LIGHT = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .96 0 0 0 0 .92 0 0 0 0 .86 0 0 0 .5 -.12'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const rand = (a, b) => a + Math.random() * (b - a);

    // קו מתאר עבה לטקסט (קלונק, בול): כמו הדפס, דיו חום מסביב וצל "הדפסה" מתחת
    function inkOutline(r, drop) {
        const out = [];
        for (let i = 0; i < 16; i++) {
            const a = i / 16 * Math.PI * 2;
            out.push(`${(Math.cos(a) * r).toFixed(1)}px ${(Math.sin(a) * r).toFixed(1)}px 0 ${COL.brown}`);
        }
        if (drop) out.push(`0 ${drop}px 0 ${COL.brown}`, `${(r * .7).toFixed(1)}px ${drop}px 0 ${COL.brown}`, `${(-r * .7).toFixed(1)}px ${drop}px 0 ${COL.brown}`);
        return out.join(',');
    }

    // ---- CSS (פעם אחת) ----
    const CSS = `
.g-tower{position:absolute;inset:0;overflow:hidden;direction:rtl;font-family:${BODY};color:${COL.cream};background:${COL.night2};-webkit-tap-highlight-color:transparent;cursor:pointer;outline:none}
.g-tower *{box-sizing:border-box}
.g-tower-canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.g-tower-grain{position:absolute;inset:0;pointer-events:none;background-image:${GRAIN_LIGHT};background-size:200px 200px;opacity:.22}
.g-tower-hud{position:absolute;top:12px;left:50%;width:100%;max-width:480px;transform:translateX(-50%);padding:0 12px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none;transition:opacity .35s,transform .35s}
.g-tower.is-intro .g-tower-hud{opacity:0;transform:translate(-50%,-8px)}
.g-tower-chip{background:${COL.cream};color:${COL.brown};border:2px solid ${COL.brown};border-radius:14px;box-shadow:0 3px 0 ${COL.brown},0 10px 22px rgba(5,10,20,.32)}
.g-tower-count{display:flex;flex-direction:column;align-items:center;min-width:64px;padding:7px 10px 5px}
.g-tower-count b{font-family:${DISPLAY};font-size:42px;line-height:.8;font-weight:700;color:${COL.brown};letter-spacing:.5px}
.g-tower-count span{margin-top:3px;font-size:12px;font-weight:500;line-height:1.2;color:${COL.ink3}}
.g-tower-count.is-bump{animation:g-tower-bump .38s cubic-bezier(.2,1.7,.4,1)}
.g-tower-next{display:flex;flex-direction:column;align-items:flex-start;padding:7px 13px 8px;max-width:64%;transition:background .25s}
.g-tower-next span{font-size:12px;font-weight:500;line-height:1.3;color:${COL.ink3};transition:color .25s}
.g-tower-next b{font-size:15px;font-weight:700;line-height:1.3;color:${COL.brown}}
.g-tower-next.is-hit{background:${COL.orange};animation:g-tower-bump .45s cubic-bezier(.2,1.7,.4,1)}
.g-tower-next.is-hit span{color:${COL.brown}}
.g-tower-deer{position:absolute;bottom:0;left:0;pointer-events:none;transform-origin:50% 100%;transform:rotate(5deg);transition:transform .6s cubic-bezier(.3,1.4,.5,1)}
.g-tower-deer-in{transform-origin:50% 100%}
.g-tower .deer{display:block;width:100%;height:auto}
.g-tower .deer .deer-eye{transform-box:fill-box;transform-origin:center;animation:g-tower-blink 4.2s infinite}
.g-tower .deer .deer-eye:nth-child(2){animation-delay:.04s}
.g-tower-deer.is-nervous .deer{animation:g-tower-shiver .14s linear infinite}
.g-tower-deer-in.is-hop{animation:g-tower-hop .6s cubic-bezier(.3,1.6,.5,1)}
.g-tower-deer-in.is-nod{animation:g-tower-nod .5s ease}
.g-tower-deer-in.is-duck{animation:g-tower-duck .5s ease forwards}
.g-tower-deer-in.is-jolt{animation:g-tower-jolt .5s ease}
.g-tower-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.g-tower-pop{position:absolute;left:0;top:0;white-space:nowrap;font-family:${DISPLAY};font-weight:700;line-height:1;letter-spacing:.5px;pointer-events:none;will-change:transform,opacity}
.g-tower-bul{font-size:46px;color:${COL.orange};text-shadow:${inkOutline(2.2, 4)};animation:g-tower-rise .9s ease-out forwards}
.g-tower-klunk{font-size:96px;color:${COL.orange};text-shadow:${inkOutline(3.4, 8)};animation:g-tower-klunk 1.9s cubic-bezier(.2,1.6,.4,1) forwards}
.g-tower-klunk.is-small{font-size:60px;text-shadow:${inkOutline(2.6, 6)};animation-duration:1.5s}
.g-tower-spark{position:absolute;left:0;top:0;pointer-events:none;animation:g-tower-spark .75s ease-out forwards}
.g-tower-spark svg{display:block}
.g-tower-intro{position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding:max(64px,13vh) 16px 0;background:linear-gradient(180deg,rgba(13,22,38,.62) 0%,rgba(13,22,38,.18) 60%,rgba(13,22,38,0) 85%);cursor:default;transition:opacity .25s}
.g-tower-intro.is-out{opacity:0;pointer-events:none}
.g-tower-card{position:relative;width:100%;max-width:340px;text-align:center;color:${COL.brown};background:${GRAIN} ${COL.cream};background-size:180px 180px;border:2px solid ${COL.brown};border-radius:20px;padding:24px 20px 20px;box-shadow:0 6px 0 ${COL.brown},0 24px 48px rgba(5,10,20,.45);animation:g-tower-pop .42s cubic-bezier(.2,1.4,.4,1)}
.g-tower-card h3{margin:0 0 10px;font-family:${DISPLAY};font-size:min(54px,14.5vw);font-weight:700;line-height:.9;letter-spacing:.3px;color:${COL.brown}}
.g-tower-card h3 em,.g-tower-end h3 em{font-style:normal;color:${COL.orangeDeep}}
.g-tower-card p{margin:0 0 20px;font-size:min(16.5px,4.6vw);line-height:1.5;color:${COL.ink2}}
.g-tower-start{min-height:58px;font-size:19px}
.g-tower-end{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;padding:24px 22px calc(22px + env(safe-area-inset-bottom));text-align:center;color:${COL.brown};background:${GRAIN} ${COL.cream};background-size:180px 180px;overflow-y:auto;overscroll-behavior:contain;touch-action:pan-y;cursor:default;animation:g-tower-endin .5s cubic-bezier(.2,.9,.3,1)}
.g-tower-end-in{margin:auto 0;width:100%;max-width:340px;display:flex;flex-direction:column;align-items:center}
.g-tower-end-art{position:relative;width:150px;height:142px;flex-shrink:0;animation:g-tower-pop .55s .08s cubic-bezier(.2,1.5,.4,1) backwards}
.g-tower-end-sun{position:absolute;left:50%;bottom:0;width:120px;height:120px;margin-left:-60px;border-radius:50%;background:${COL.orange};border:2px solid ${COL.brown}}
.g-tower-end-art .deer{position:absolute;left:50%;bottom:0;width:112px;margin-left:-56px;-webkit-mask:linear-gradient(#000,#000) top/100% calc(100% - 50px) no-repeat,radial-gradient(circle at 50% calc(100% - 60px),#000 58.5px,transparent 59.5px);mask:linear-gradient(#000,#000) top/100% calc(100% - 50px) no-repeat,radial-gradient(circle at 50% calc(100% - 60px),#000 58.5px,transparent 59.5px)}
.g-tower-end-ring{position:absolute;left:50%;bottom:0;width:120px;height:120px;margin-left:-60px;border-radius:50%;border:2px solid ${COL.brown};pointer-events:none;-webkit-mask:linear-gradient(transparent 70px,#000 70px);mask:linear-gradient(transparent 70px,#000 70px)}
.g-tower-end h3{margin:16px 0 12px;font-family:${DISPLAY};font-size:68px;font-weight:700;line-height:.86;letter-spacing:.3px;color:${COL.brown}}
.g-tower-end p{margin:0;font-size:17px;line-height:1.55;color:${COL.brown};text-wrap:balance}
.g-tower-end p b{font-weight:700}
.g-tower-end p.g-tower-end-tail{margin-top:8px;font-size:16px;color:${COL.ink2}}
.g-tower-end-actions{display:flex;flex-direction:column;gap:12px;width:100%;max-width:320px;margin-top:24px}
.g-tower-quiet{align-self:center;min-height:44px;padding:0 14px;border:0;background:none;color:${COL.ink2};font-family:${BODY};font-size:16px;font-weight:500;text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:5px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.g-tower-quiet:active{color:${COL.brown}}
@keyframes g-tower-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
@keyframes g-tower-pop{0%{transform:scale(.9);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes g-tower-endin{0%{opacity:0;transform:translateY(18px)}100%{opacity:1;transform:none}}
@keyframes g-tower-bump{0%{transform:scale(1)}40%{transform:scale(1.14)}100%{transform:scale(1)}}
@keyframes g-tower-shiver{0%{transform:translateX(0)}25%{transform:translateX(-1.5px) rotate(-1deg)}75%{transform:translateX(1.5px) rotate(1deg)}100%{transform:translateX(0)}}
@keyframes g-tower-hop{0%{transform:translateY(0)}35%{transform:translateY(-16%) scale(1.04,.98)}70%{transform:translateY(0) scale(1.03,.96)}100%{transform:translateY(0) scale(1)}}
@keyframes g-tower-nod{0%,100%{transform:rotate(0)}40%{transform:rotate(-4deg) translateY(3%)}}
@keyframes g-tower-duck{0%{transform:translateY(0)}100%{transform:translateY(18%) scale(.96)}}
@keyframes g-tower-jolt{0%{transform:translateY(18%) scale(.96)}30%{transform:translateY(4%) scale(1.04,.94)}60%{transform:translateY(-6%)}100%{transform:translateY(0)}}
@keyframes g-tower-rise{0%{transform:translate(-50%,-50%) scale(.4);opacity:0}25%{transform:translate(-50%,-80%) scale(1.15);opacity:1}100%{transform:translate(-50%,-190%) scale(1);opacity:0}}
@keyframes g-tower-klunk{0%{transform:translate(-50%,-50%) rotate(-8deg) scale(.2);opacity:0}18%{transform:translate(-50%,-50%) rotate(-8deg) scale(1.18);opacity:1}32%{transform:translate(-50%,-50%) rotate(-6deg) scale(1)}80%{transform:translate(-50%,-62%) rotate(-6deg) scale(1);opacity:1}100%{transform:translate(-50%,-80%) rotate(-6deg) scale(.96);opacity:0}}
@keyframes g-tower-spark{0%{transform:translate(-50%,-50%) scale(.3) rotate(0);opacity:1}100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(1) rotate(90deg);opacity:0}}
@media (max-height:700px){.g-tower-end{padding-top:16px}.g-tower-end-art{zoom:.8}.g-tower-end h3{margin:12px 0 10px;font-size:60px}.g-tower-end-actions{margin-top:18px;gap:10px}}
@media (max-height:600px){.g-tower-end{padding-top:12px;padding-bottom:calc(12px + env(safe-area-inset-bottom))}.g-tower-end-art{zoom:.66}.g-tower-end h3{margin:8px 0 8px;font-size:52px}.g-tower-end p{font-size:16px;line-height:1.5}.g-tower-end p.g-tower-end-tail{margin-top:6px;font-size:15px}.g-tower-end-actions{margin-top:14px;gap:8px}.g-tower-end-actions .btn{min-height:50px}}
@media (prefers-reduced-motion:reduce){.g-tower-deer.is-nervous .deer,.g-tower .deer .deer-eye{animation:none}.g-tower-end,.g-tower-end-art,.g-tower-card{animation:none}}
`;

    function injectStyle() {
        if (document.getElementById('g-' + ID + '-style')) return;
        const s = document.createElement('style');
        s.id = 'g-' + ID + '-style';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    // ---- ציור הכיסא (מבט צד, החזית ימינה). ראשית = מרכז כף הרגליים, y למטה שלילי ----
    function drawChairShape(g) {
        const line = '#2E1710';
        const white = '#FCF8F0';
        const shade = '#EADFCB';
        g.lineJoin = 'round';
        g.lineCap = 'round';
        g.lineWidth = 2.1;
        g.strokeStyle = line;

        // משענת
        g.beginPath();
        g.moveTo(-40, -56);
        g.bezierCurveTo(-41, -80, -43, -99, -46, -112);
        g.quadraticCurveTo(-47.5, -119, -41, -118.5);
        g.lineTo(-31, -117.5);
        g.quadraticCurveTo(-26.5, -116.5, -27.5, -111);
        g.bezierCurveTo(-28, -97, -27, -78, -25.5, -58);
        g.closePath();
        g.fillStyle = white; g.fill(); g.stroke();
        g.beginPath();
        g.moveTo(-31, -108); g.bezierCurveTo(-31.5, -95, -31, -80, -30, -66);
        g.strokeStyle = 'rgba(46,23,16,.22)'; g.lineWidth = 1.4; g.stroke();
        g.strokeStyle = line; g.lineWidth = 2.1;

        // ידית: קשת מהמשענת אל קדמת המושב
        const arm = () => {
            g.beginPath();
            g.moveTo(-33, -93);
            g.bezierCurveTo(-12, -99, 16, -96, 31, -86);
            g.bezierCurveTo(40, -79, 43, -71, 42, -61);
        };
        arm(); g.lineWidth = 11; g.strokeStyle = line; g.stroke();
        arm(); g.lineWidth = 7; g.strokeStyle = white; g.stroke();
        g.beginPath();
        g.moveTo(-28, -94.5); g.bezierCurveTo(-10, -99, 14, -96.5, 28, -88);
        g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,1)'; g.stroke();
        g.lineWidth = 2.1; g.strokeStyle = line;

        // צל רך מתחת לסינר (נופל על הכיסא שמתחת בערימה)
        const sh = g.createLinearGradient(0, -40, 0, -26);
        sh.addColorStop(0, 'rgba(46,23,16,.3)');
        sh.addColorStop(1, 'rgba(46,23,16,0)');
        g.fillStyle = sh;
        g.fillRect(-30, -40, 66, 14);

        // רגל אחורית
        g.beginPath();
        g.moveTo(-38, -52); g.lineTo(-22, -52); g.lineTo(-38, -4);
        g.quadraticCurveTo(-39, 0, -43, 0); g.lineTo(-46, 0);
        g.quadraticCurveTo(-49.5, 0, -48.5, -4); g.closePath();
        g.fillStyle = shade; g.fill(); g.stroke();

        // רגל קדמית
        g.beginPath();
        g.moveTo(24, -52); g.lineTo(41, -52); g.lineTo(48.5, -4);
        g.quadraticCurveTo(49, 0, 45, 0); g.lineTo(42, 0);
        g.quadraticCurveTo(38.5, 0, 38, -4); g.closePath();
        g.fillStyle = white; g.fill(); g.stroke();

        // סינר מתחת למושב
        g.beginPath();
        g.moveTo(-35, -58); g.lineTo(43, -58); g.lineTo(40, -40); g.lineTo(-31, -40); g.closePath();
        g.fillStyle = shade; g.fill(); g.stroke();
        g.beginPath();
        g.moveTo(-31, -46); g.lineTo(40.5, -46);
        g.lineWidth = 1.2; g.strokeStyle = 'rgba(46,23,16,.24)'; g.stroke();
        g.lineWidth = 2.1; g.strokeStyle = line;

        // מושב
        g.beginPath();
        g.moveTo(-42, -62.5); g.lineTo(42, -62.5);
        g.quadraticCurveTo(50.5, -62.5, 50.5, -56.5);
        g.quadraticCurveTo(50.5, -51, 45, -51);
        g.lineTo(-38, -52);
        g.quadraticCurveTo(-44.5, -53, -43.5, -58.5);
        g.closePath();
        g.fillStyle = white; g.fill(); g.stroke();
        g.beginPath();
        g.moveTo(-37, -59.6); g.lineTo(40, -59.6);
        g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.5; g.stroke();
    }

    function sparklePath(g, x, y, s) {
        g.moveTo(x, y - s);
        g.bezierCurveTo(x + s * .12, y - s * .22, x + s * .22, y - s * .12, x + s, y);
        g.bezierCurveTo(x + s * .22, y + s * .12, x + s * .12, y + s * .22, x, y + s);
        g.bezierCurveTo(x - s * .12, y + s * .22, x - s * .22, y + s * .12, x - s, y);
        g.bezierCurveTo(x - s * .22, y - s * .12, x - s * .12, y - s * .22, x, y - s);
    }

    function roundRect(g, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        g.moveTo(x + r, y);
        g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
        g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
        g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y);
    }

    function glowSprite(rgb, a, size) {
        const cv = document.createElement('canvas');
        cv.width = cv.height = size;
        const g = cv.getContext('2d');
        const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        gr.addColorStop(0, `rgba(${rgb},${a})`);
        gr.addColorStop(.35, `rgba(${rgb},${a * .45})`);
        gr.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = gr;
        g.fillRect(0, 0, size, size);
        return cv;
    }

    function mount(stage, ctx) {
        injectStyle();
        const Deer = (ctx && ctx.Deer) || window.Deer;

        const root = document.createElement('div');
        root.className = 'g-tower is-intro';
        root.tabIndex = -1; // מקבל פוקוס, כדי שרווח יגיע למשחק ולא לכפתור שפתח אותו (שנשאר בפוקוס מאחורי הגיליון)
        root.innerHTML = `
            <canvas class="g-tower-canvas" aria-hidden="true"></canvas>
            <div class="g-tower-grain" aria-hidden="true"></div>
            <div class="g-tower-hud">
                <div class="g-tower-chip g-tower-count"><b>1</b><span>כיסא</span></div>
                <div class="g-tower-chip g-tower-next"><span>הגובה הבא</span><b>הבר</b></div>
            </div>
            <div class="g-tower-deer"><div class="g-tower-deer-in"></div></div>
            <div class="g-tower-fx"></div>
            <div class="g-tower-intro">
                <div class="g-tower-card">
                    <h3>נשארו רק <em>הכיסאות.</em></h3>
                    <p>לוחצים כדי להוריד כיסא על הערימה.<br>כמה שיותר גבוה.</p>
                    <button type="button" class="btn btn-primary btn-block g-tower-start">להתחיל</button>
                </div>
            </div>`;
        stage.appendChild(root);

        const canvas = root.querySelector('.g-tower-canvas');
        const g = canvas.getContext('2d');
        const countEl = root.querySelector('.g-tower-count');
        const countNum = countEl.querySelector('b');
        const countLbl = countEl.querySelector('span');
        const nextEl = root.querySelector('.g-tower-next');
        const deerEl = root.querySelector('.g-tower-deer');
        const deerIn = root.querySelector('.g-tower-deer-in');
        const fxEl = root.querySelector('.g-tower-fx');
        const introEl = root.querySelector('.g-tower-intro');

        // ---- מצב ----
        let W = 0, H = 0, dpr = 1, k = 1, cx = 0, colW = 0, colX0 = 0, groundY = 0, viewWorld = 0;
        let chairSprite = null, spriteW = 0, spriteH = 0;
        const bulbGlow = glowSprite('255,196,120', .75, 64);
        const softGlow = glowSprite('251,243,230', .5, 128);
        const barGlow = glowSprite('232,135,59', .55, 128);

        let state = 'intro';    // intro | swing | drop | wait | fall | end
        let chairs = [{ ox: 0, lt: 9 }];
        let cur = null;
        let side = Math.random() < .5 ? 1 : -1;
        let camY = 0;
        let oscX = 0, oscV = 0, ambPhase = 0, amb = 1, ambTarget = 1, dBase = 0;
        let t = 0, last = 0, raf = 0, shake = 0;
        let passed = 0, streak = 0;
        let fall = null;
        let particles = [];
        let deerMood = '', nervous = false;
        let destroyed = false;
        const timers = [];
        const markers = MARKERS.map(m => Object.assign({}, m, { at: 0, flash: 0 }));

        // רקע: כוכבים, נצנצים, עננים בסגנון הלוגו, חלונות ביישוב
        const stars = Array.from({ length: 160 }, () => ({
            u: Math.random(), y: rand(40, 2300), r: Math.random() < .86 ? rand(.6, 1.3) : rand(1.5, 2.1),
            a: rand(.3, .9), ph: rand(0, 6.28), sp: rand(.6, 2.2),
        }));
        const sparks = Array.from({ length: 11 }, (_, i) => ({
            u: rand(.04, .96), y: 300 + i * 190 + rand(-60, 60), s: rand(4, 7.5), ph: rand(0, 6.28),
            c: Math.random() < .35 ? COL.orange : COL.creamLight,
        }));
        // בתים ביישוב (מיקום יחסי לרוחב העמודה, יחידות עולם)
        const houses = [
            { x: -168, w: 26, h: 18, win: [1, 0] }, { x: -132, w: 20, h: 14, win: [1] },
            { x: -96, w: 30, h: 20, win: [0, 1, 1] }, { x: -58, w: 22, h: 15, win: [1] },
            { x: -22, w: 26, h: 17, win: [1, 1] }, { x: 18, w: 20, h: 13, win: [0, 1] },
            { x: 52, w: 24, h: 16, win: [1] },
        ];
        // אורות רחוקים על הרכס
        const farLights = Array.from({ length: 9 }, () => ({ u: rand(.04, .96), d: rand(.1, .5), ph: rand(0, 6.28) }));

        // ---- עזרים ----
        const later = (fn, ms) => { const id = setTimeout(() => { if (!destroyed) fn(); }, ms); timers.push(id); return id; };
        let camX = 0;           // מצלמה אופקית: עוקבת אחרי ראש המגדל כשהוא נסחף לצד במסך צר
        const sx = x => cx + (x - camX) * k;
        const sy = y => groundY - (y - camY) * k;
        const colHalfW = () => (colW / 2) / k;

        function sway() { return oscX + amb * Math.sin(ambPhase); }
        function swayAt(i, n, s) {
            const f = (i * STEP + CH / 2) / topH(n);
            return s * Math.pow(f, 1.5);
        }
        function chairRot(i, n, s) {
            const f = (i * STEP + CH / 2) / topH(n);
            let r = (s / topH(n)) * 1.25 * Math.sqrt(f);
            if (i > 0) r += clamp((chairs[i].ox - chairs[i - 1].ox) / (STEP * 3.4), -.2, .2);
            return r;
        }
        function dangerBase() {
            const n = chairs.length;
            let sum = 0, sq = 0;
            for (let i = 0; i < n; i++) {
                sum += chairs[i].ox;
                if (i > 0) { const r = (chairs[i].ox - chairs[i - 1].ox) / CW; sq += r * r; }
            }
            const com = sum / n;
            const crook = n > 1 ? Math.sqrt(sq / (n - 1)) : 0;
            return { d: Math.abs(com) / (.9 * CW) + Math.max(0, n - 6) * .021 + crook * .5, com };
        }

        // ---- גודל ----
        function buildSprite() {
            const pad = 5;
            const wU = CW + pad * 2, hU = CH + pad * 2;
            const sc = k * dpr;
            const cv = document.createElement('canvas');
            cv.width = Math.ceil(wU * sc);
            cv.height = Math.ceil(hU * sc);
            const c2 = cv.getContext('2d');
            c2.scale(sc, sc);
            c2.translate(wU / 2, pad + CH);
            drawChairShape(c2);
            chairSprite = cv;
            spriteW = wU * k;
            spriteH = hU * k;
        }

        let skyGrad = null, duskGrad = null;
        function resize() {
            const w = stage.clientWidth, h = stage.clientHeight;
            if (!w || !h) return;
            const newDpr = Math.min(window.devicePixelRatio || 1, 2);
            if (w === W && h === H && newDpr === dpr && chairSprite) return;
            W = w; H = h; dpr = newDpr;
            colW = Math.min(W, 480);
            colX0 = (W - colW) / 2;
            cx = W / 2;
            k = clamp(Math.min(colW / 375, H / 640), .6, 1.25);
            groundY = H - GROUND * k;
            viewWorld = groundY / k;
            canvas.width = Math.round(W * dpr);
            canvas.height = Math.round(H * dpr);
            buildSprite();
            skyGrad = g.createLinearGradient(0, 0, 0, H);
            skyGrad.addColorStop(0, COL.night0);
            skyGrad.addColorStop(.5, COL.night2);
            skyGrad.addColorStop(1, COL.night3);
            // שארית שקיעה כתומה ונמוכה מעל הרכס, בצבע של השמש מהלוגו
            const hy = Math.round(H * .6);
            duskGrad = g.createLinearGradient(0, hy - 260 * k, 0, hy + 10 * k);
            duskGrad.addColorStop(0, 'rgba(232,135,59,0)');
            duskGrad.addColorStop(.7, 'rgba(232,135,59,.07)');
            duskGrad.addColorStop(1, 'rgba(232,135,59,.16)');
            const dw = Math.round(96 * k);
            deerEl.style.width = dw + 'px';
            deerEl.style.left = Math.round(colX0 + 4) + 'px';
            deerEl.style.bottom = Math.round(-20 * k) + 'px';
            camY = camTarget();
            camX = camXTarget();
            render();
        }

        function camTarget() {
            if (state === 'intro') return 0;
            const n = chairs.length;
            return Math.max(0, topH(n) + HOVER + CH + HUD_ROOM / k - viewWorld);
        }
        // הבסיס נשאר באמצע, אלא אם ראש המגדל (כולל מקום לנדנוד) היה יוצא מהמסך
        function camXTarget() {
            if (state === 'intro' || fall) return 0;
            const tx = chairs[chairs.length - 1].ox;
            const hw = (W / 2) / k, m = CW / 2 + 34;
            if (hw <= m) return tx;
            return clamp(0, tx + m - hw, tx - m + hw);
        }

        // ---- הצבי ----
        function setDeer(mood) {
            if (mood === deerMood) return;
            deerMood = mood;
            deerIn.innerHTML = Deer.svg({ body: true, mood, title: 'הצבי של הפרתיה' });
        }
        function deerAnim(cls) {
            deerIn.classList.remove('is-hop', 'is-nod', 'is-duck', 'is-jolt');
            void deerIn.offsetWidth;
            if (cls) deerIn.classList.add(cls);
        }
        let moodTimer = 0;
        function deerReact(mood, anim, ms) {
            setDeer(mood);
            if (anim) deerAnim(anim);
            clearTimeout(moodTimer);
            moodTimer = later(() => { if (state !== 'fall' && state !== 'end') setDeer(nervous ? 'neutral' : 'happy'); }, ms || 900);
        }
        function setNervous(v) {
            if (v === nervous) return;
            nervous = v;
            deerEl.classList.toggle('is-nervous', v);
            if (state === 'swing' || state === 'wait' || state === 'drop') setDeer(v ? 'neutral' : 'happy');
        }

        // ---- אפקטים ב-DOM ----
        function addFx(el, x, y, ms) {
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            fxEl.appendChild(el);
            later(() => el.remove(), ms);
        }
        function popText(text, x, y, cls, ms) {
            const el = document.createElement('div');
            el.className = 'g-tower-pop ' + cls;
            el.textContent = text;
            addFx(el, x, y, ms || 1000);
            return el;
        }
        function burst(x, y, count, color) {
            for (let i = 0; i < count; i++) {
                const el = document.createElement('div');
                el.className = 'g-tower-spark';
                const a = (i / count) * Math.PI * 2 + rand(-.3, .3);
                const d = rand(26, 46) * k;
                el.style.setProperty('--dx', Math.cos(a) * d + 'px');
                el.style.setProperty('--dy', Math.sin(a) * d + 'px');
                el.innerHTML = Deer.sparkle(Math.round(rand(10, 16) * k), color || COL.creamLight);
                addFx(el, x, y, 800);
            }
        }
        function bump(el, cls) {
            el.classList.remove(cls);
            void el.offsetWidth;
            el.classList.add(cls);
        }
        function vibrate(p) {
            try { if (navigator.vibrate && navigator.userActivation && navigator.userActivation.hasBeenActive) navigator.vibrate(p); } catch (e) { /* לא חובה */ }
        }

        // ---- HUD ----
        function setCount(n) {
            countNum.textContent = n;
            countLbl.textContent = n === 1 ? 'כיסא' : 'כיסאות';
        }
        let nextTimer = 0;
        function showNext() {
            const m = markers[passed];
            nextEl.classList.remove('is-hit');
            nextEl.innerHTML = m ? `<span>הגובה הבא</span><b>${m.name}</b>` : '<span>הגובה הבא</span><b>עוד לא נמדד</b>';
        }
        function announce(m) {
            clearTimeout(nextTimer);
            nextEl.innerHTML = `<span>גובה חדש</span><b>${m.name}</b>`;
            bump(nextEl, 'is-hit');
            nextTimer = later(showNext, 1700);
        }

        // ---- משחק ----
        function focusRoot() {
            try { root.focus({ preventScroll: true }); } catch (e) { /* לא חובה */ }
        }
        function start() {
            if (state !== 'intro') return;
            if (introEl.contains(document.activeElement)) focusRoot(); // כפתור "להתחיל" עומד להיעלם
            root.classList.remove('is-intro');
            introEl.classList.add('is-out');
            later(() => introEl.remove(), 300);
            showNext();
            spawn();
        }

        function spawn() {
            const n = chairs.length;
            const A = 84 + Math.min(n, 30) * .5;
            const lim = Math.max(0, colHalfW() - CW / 2 - A - 4);
            const cX = camXTarget();
            const xc = clamp(chairs[n - 1].ox, cX - lim, cX + lim);
            side = -side;
            cur = {
                xc, A, T: Math.max(1.5, 2.05 - n * .015), phase: side * Math.PI / 2,
                x: xc + side * A, base: topH(n) + HOVER, vy: 0, rot: 0, age: 0,
            };
            state = 'swing';
        }

        function drop() {
            if (state !== 'swing' || !cur) return;
            state = 'drop';
            cur.vy = 0;
        }

        function land() {
            const n = chairs.length;
            const top = chairs[n - 1];
            const s = sway();
            const topX = top.ox + swayAt(n - 1, n, s);
            let dx = cur.x - topX;
            const perfect = Math.abs(dx) <= PERFECT;
            if (perfect) dx = 0;
            const d = Math.abs(dx) / CW;
            chairs.push({ ox: top.ox + dx, lt: 0 });
            const N = chairs.length;
            const ramp = Math.min(1, (N + 1) / 8);
            const dir = dx ? Math.sign(dx) : (oscV >= 0 ? 1 : -1);
            oscV += dir * (perfect ? 9 : 20 + 150 * d) * (.45 + .55 * ramp);

            const db = dangerBase();
            dBase = db.d;
            ambTarget = (1.2 + 34 * dBase * dBase) * Math.min(1, topH(N) / 350);
            const D = dBase + Math.abs(s) / 120 + d * .4 * ramp + .04;
            const landX = cur.x;
            cur = null;

            // אבק קטן משני צדי המושב
            const seatY = (N - 1) * STEP + 60;
            for (let i = 0; i < 8; i++) {
                const sd = i < 4 ? -1 : 1;
                particles.push({ x: landX + sd * rand(40, 52), y: seatY + rand(-4, 4), vx: sd * rand(40, 130), vy: rand(10, 70), life: rand(.3, .5), max: .5, r: rand(1.4, 2.6) });
            }

            setCount(N);
            bump(countEl, 'is-bump');
            vibrate(perfect ? [6, 40, 6] : 8);

            const px = sx(landX), py = sy(topH(N)) - 16 * k;
            if (perfect) {
                streak++;
                popText(streak >= 3 ? 'בול. שוב.' : 'בול', px, py, 'g-tower-bul', 950);
                burst(px, py + 20 * k, 4);
            } else {
                streak = 0;
            }

            // סימוני גובה
            let hit = null;
            while (passed < markers.length && topH(N) >= markers[passed].y) {
                hit = markers[passed];
                hit.at = N;
                hit.flash = 1;
                passed++;
            }

            if (N >= 5 && D >= 1) {
                if (hit) announce(hit); // גם הכיסא האחרון נחשב: ה-HUD לא נשאר על "הגובה הבא" שכבר הושג
                startFall(Math.sign(db.com + s + dx) || dir);
                return;
            }

            if (hit) {
                announce(hit);
                const ly = sy(hit.y) - 14 * k;
                burst(colX0 + colW - 50 * k, ly, 6, COL.orange);
                deerReact('happy', 'is-hop', 1100);
            } else if (perfect) {
                deerReact('wink', 'is-hop', 800);
            } else if (d > .24) {
                deerReact('neutral', 'is-nod', 900);
            } else {
                deerAnim('is-nod');
            }

            state = 'wait';
            later(spawn, 230);
        }

        function startFall(dir) {
            state = 'fall';
            const n = chairs.length;
            const s = sway();
            const pieces = chairs.map((c, i) => ({
                x0: c.ox + swayAt(i, n, s), y0: i * STEP + CH / 2, r0: chairRot(i, n, s),
                x: 0, y: 0, rot: 0, vx: 0, vy: 0, spin: 0, hit: false, done: false,
            }));
            fall = {
                dir, theta: .015, omega: .14, t: 0, detached: false,
                thetaD: clamp(Math.asin(Math.min(1, 130 / topH(n))), .15, .34),
                px: chairs[0].ox + dir * CW * .46, py: 0, pieces,
                klunks: 0, klunkT: -1, pile: {},
            };
            rigidPose();
            setNervous(false);
            clearTimeout(moodTimer);
            setDeer('closed');
            deerAnim('is-duck');
            vibrate(15);
        }

        function rigidPose() {
            const a = -fall.dir * fall.theta, ca = Math.cos(a), sa = Math.sin(a);
            for (const p of fall.pieces) {
                const rx = p.x0 - fall.px, ry = p.y0 - fall.py;
                p.x = fall.px + rx * ca - ry * sa;
                p.y = fall.py + rx * sa + ry * ca;
                p.rot = p.r0 + fall.dir * fall.theta;
            }
        }

        let klunkPos = null;
        function klunk(p, big) {
            let X, Y;
            if (big || !klunkPos) {
                X = clamp(sx(p.x), colX0 + 125 * k, colX0 + colW - 95 * k);
                Y = clamp(sy(p.y) - 70 * k, 150, H - 150 * k);
                klunkPos = { X, Y };
            } else {
                X = clamp(klunkPos.X - fall.dir * 105 * k, colX0 + 70 * k, colX0 + colW - 70 * k);
                Y = klunkPos.Y - 82 * k;
            }
            const el = popText('קלונק', X, Y, 'g-tower-klunk' + (big ? '' : ' is-small'), big ? 2000 : 1600);
            el.style.fontSize = Math.round((big ? 96 : 60) * clamp(k, .85, 1.15)) + 'px';
            burst(X, Y, big ? 6 : 3, big ? COL.creamLight : COL.orange);
            shake = big ? 11 : 6;
            vibrate(big ? 35 : 15);
            if (big) {
                deerAnim('is-jolt');
                later(() => { if (state === 'fall') setDeer('wink'); }, 650);
            }
        }

        function updateFall(dt) {
            const f = fall;
            f.t += dt;
            const dts = dt * .62;
            if (!f.detached) {
                f.omega += (2.2 * Math.sin(f.theta) + .35) * dts;
                f.theta += f.omega * dts;
                rigidPose();
                if (f.theta > f.thetaD) {
                    f.detached = true;
                    const w = -f.dir * f.omega;
                    const edge = colHalfW() - 56;
                    const G = 1500;
                    for (const p of f.pieces) {
                        // מהירות טבעית של הסיבוב, ואז נחיתה בתוך המסך כדי שהערימה תיראה
                        const vx0 = -w * (p.y - f.py);
                        p.vy = w * (p.x - f.px);
                        const hgt = Math.max(0, p.y - 27);
                        const T = (p.vy + Math.sqrt(p.vy * p.vy + 2 * G * hgt)) / G || .2;
                        const xt = clamp(f.px + f.dir * rand(-15, 85) + vx0 * T * .06, -edge, edge);
                        p.vx = clamp((xt - p.x) / Math.max(T, .15), -520, 520);
                        p.spin = f.dir * f.omega * rand(.6, 1.6) + rand(-.6, .6);
                    }
                }
            } else {
                const groundVisible = sy(0) < H - 12;
                const lim = (W / 2) / k + 160;
                for (const p of f.pieces) {
                    if (p.done) continue;
                    p.vy -= 1500 * dts;
                    p.x += p.vx * dts;
                    p.y += p.vy * dts;
                    p.rot += p.spin * dts;
                    const b = Math.round(p.x / 55);
                    const rest = 27 + Math.min(7, f.pile[b] || 0) * 9;
                    if (p.y <= rest) {
                        const speed = Math.abs(p.vy);
                        p.y = rest;
                        if (!p.hit) {
                            p.hit = true;
                            for (let i = 0; i < 5; i++) particles.push({ x: p.x + rand(-30, 30), y: rest - 18, vx: rand(-90, 90), vy: rand(30, 120), life: rand(.35, .6), max: .6, r: rand(1.6, 3) });
                            if (groundVisible && speed > 90) {
                                if (f.klunks === 0) { f.klunks = 1; f.klunkT = f.t; klunk(p, true); }
                                else if (f.klunks === 1 && f.t - f.klunkT > .4) { f.klunks = 2; klunk(p, false); }
                            }
                        }
                        p.vy = -p.vy * .24;
                        p.vx *= .5;
                        p.spin *= .4;
                        if (Math.abs(p.vy) < 70) {
                            p.vy = 0; p.vx = 0; p.spin = 0; p.done = true;
                            f.pile[b] = (f.pile[b] || 0) + 1;
                        }
                    }
                    if (Math.abs(p.x) > lim) p.done = true;
                }
                const allDone = f.pieces.every(p => p.done);
                if (allDone && f.klunks === 0 && camY < 24) {
                    const vis = f.pieces.filter(p => Math.abs(p.x) < colHalfW());
                    f.klunks = 1; f.klunkT = f.t; klunk(vis[vis.length - 1] || f.pieces[0], true);
                }
                if (f.klunkT >= 0 && f.t - f.klunkT > 1.35 && (allDone || f.t - f.klunkT > 2.6)) showEnd();
            }
            if (f.t > 9) showEnd();
        }

        // ---- לולאה ----
        function update(dt) {
            t += dt;
            const n = chairs.length;
            const Ht = topH(n);
            const om = 2 * Math.PI / (1.0 + Ht / 800);
            if (state !== 'fall') {
                oscV += (-om * om * oscX - 2 * .11 * om * oscV) * dt;
                oscX += oscV * dt;
                ambPhase += dt * om * .85;
                amb += (ambTarget - amb) * Math.min(1, dt * 2);
            }
            const lastC = chairs[n - 1];
            if (lastC.lt < 9) lastC.lt += dt;

            if (state === 'swing' && cur) {
                cur.phase += dt * 2 * Math.PI / cur.T;
                cur.x = cur.xc + cur.A * Math.sin(cur.phase);
                cur.rot = -Math.sin(cur.phase) * .09;
                cur.age += dt;
            } else if (state === 'drop' && cur) {
                cur.age += dt;
                cur.vy += 3400 * dt;
                cur.base -= cur.vy * dt;
                cur.rot *= Math.pow(.0005, dt);
                if (cur.base <= n * STEP) { cur.base = n * STEP; land(); }
            } else if (state === 'fall') {
                updateFall(dt);
            }

            if (state === 'swing' || state === 'wait' || state === 'drop') {
                setNervous(dBase + Math.abs(sway()) / 120 > .7 && chairs.length >= 5);
            }

            // מצלמה
            // (גם במסך הסיום: המצלמה נשארת למטה על הערימה ולא חוזרת לראש המגדל)
            let target;
            if (fall) target = fall.detached ? 0 : camY;
            else target = camTarget();
            const ease = 1 - Math.exp(-dt * (fall ? 2.2 : 4.5));
            camY += (target - camY) * ease;
            camX += (camXTarget() - camX) * ease;

            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= dt;
                if (p.life <= 0) { particles.splice(i, 1); continue; }
                p.vy -= 260 * dt;
                p.x += p.vx * dt;
                p.y += p.vy * dt;
            }
            for (const m of markers) if (m.flash > 0) m.flash = Math.max(0, m.flash - dt * 1.2);
            shake *= Math.pow(.015, dt);
        }

        // ---- ציור ----
        function drawChair(x, y, rot, scale, alpha) {
            g.save();
            g.translate(sx(x), sy(y));
            if (rot) g.rotate(rot);
            if (scale !== 1) g.scale(scale, scale);
            if (alpha < 1) g.globalAlpha = alpha;
            g.drawImage(chairSprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
            g.restore();
        }

        function drawStars() {
            const par = .55;
            for (const s of stars) {
                const Y = groundY - (s.y - camY * par) * k;
                if (Y < -4 || Y > H) continue;
                const a = s.a * (.65 + .35 * Math.sin(t * s.sp + s.ph));
                g.globalAlpha = a;
                g.fillStyle = COL.creamLight;
                const r = s.r * Math.max(k, .8);
                g.fillRect(s.u * W - r / 2, Y - r / 2, r, r);
            }
            g.globalAlpha = 1;
            for (const s of sparks) {
                const Y = groundY - (s.y - camY * par) * k;
                if (Y < -20 || Y > H) continue;
                const sc = s.s * k * (.8 + .25 * Math.sin(t * 1.3 + s.ph));
                g.globalAlpha = .75;
                g.fillStyle = s.c;
                g.beginPath();
                sparklePath(g, s.u * W, Y, sc);
                g.fill();
            }
            g.globalAlpha = 1;
        }

        function drawMoon() {
            const m = markers[4];
            const r = 60;
            const X = sx(-84), Y = sy(m.y + r + 8), R = r * k;
            if (Y - R * 3 > H || Y + R * 3 < 0) return;
            g.globalAlpha = .55;
            g.drawImage(softGlow, X - R * 2.8, Y - R * 2.8, R * 5.6, R * 5.6);
            g.globalAlpha = 1;
            g.fillStyle = COL.creamLight;
            g.beginPath(); g.arc(X, Y, R, 0, Math.PI * 2); g.fill();
            g.fillStyle = 'rgba(214,180,128,.35)';
            g.beginPath(); g.arc(X - R * .32, Y - R * .22, R * .2, 0, 6.29); g.fill();
            g.beginPath(); g.arc(X + R * .3, Y + R * .28, R * .14, 0, 6.29); g.fill();
            g.beginPath(); g.arc(X + R * .1, Y - R * .45, R * .09, 0, 6.29); g.fill();
            g.beginPath(); g.arc(X - R * .1, Y + R * .48, R * .08, 0, 6.29); g.fill();
            g.fillStyle = 'rgba(232,135,59,.12)';
            g.beginPath(); g.arc(X + R * .18, Y + R * .1, R * .86, 0, Math.PI * 2); g.arc(X, Y, R, 0, Math.PI * 2, true); g.fill();
        }

        const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

        // הנוף הרחוק: קו אופק קבוע במסך. כשעולים, הקרקע הקרובה יורדת ומתגלה הפרת
        function drawFar() {
            const hy = Math.round(H * .6);
            const ridgeAt = x => {
                const u = (x - cx) / k;
                return hy - (16 + 11 * Math.sin(u * .013 + 1.1) + 6 * Math.sin(u * .037 + .3) + 3 * Math.sin(u * .09 + 2)) * k;
            };
            if (duskGrad) { g.fillStyle = duskGrad; g.fillRect(0, hy - 260 * k, W, 270 * k); }
            let gr = g.createLinearGradient(0, hy - 34 * k, 0, H);
            gr.addColorStop(0, '#2A4164');
            gr.addColorStop(.18, '#1D304E');
            gr.addColorStop(1, '#0F1A2D');
            g.fillStyle = gr;
            g.beginPath();
            g.moveTo(-4, H + 4);
            for (let x = -4; x <= W + 12; x += 10) g.lineTo(x, ridgeAt(x));
            g.lineTo(W + 12, H + 4);
            g.closePath();
            g.fill();
            // אורות רחוקים על הרכס
            for (const l of farLights) {
                const x = l.u * W;
                const y = ridgeAt(x) + (6 + l.d * 26) * k;
                g.globalAlpha = .45 + .25 * Math.sin(t * 1.7 + l.ph);
                g.fillStyle = '#F7C77E';
                g.fillRect(x, y, 1.8 * k, 1.8 * k);
            }
            g.globalAlpha = 1;
            // רכס שני, קרוב יותר
            gr = g.createLinearGradient(0, hy + 40 * k, 0, H);
            gr.addColorStop(0, '#16253D');
            gr.addColorStop(1, '#0C1526');
            g.fillStyle = gr;
            g.beginPath();
            g.moveTo(-4, H + 4);
            for (let x = -4; x <= W + 12; x += 10) {
                const u = (x - cx) / k;
                g.lineTo(x, hy + (70 + 14 * Math.sin(u * .016 + 4.2) + 5 * Math.sin(u * .05)) * k);
            }
            g.lineTo(W + 12, H + 4);
            g.closePath();
            g.fill();

            // הפרת
            const rv = smooth(200, 470, camY);
            if (rv <= .01) return;
            const pratDone = passed > 3;
            const L = [], R = [];
            const N = 30;
            for (let i = 0; i <= N; i++) {
                const q = i / N;
                const y = hy + 6 * k + Math.pow(q, 1.5) * (H - hy + 20 * k);
                const x = cx + (50 + 70 * q) * k + 70 * k * Math.sin(q * 5.2 + .3) * (.2 + q);
                const w = (1 + 34 * Math.pow(q, 1.7)) * k;
                L.push([x - w / 2, y]);
                R.push([x + w / 2, y]);
            }
            gr = g.createLinearGradient(0, hy, 0, H);
            gr.addColorStop(0, 'rgba(200,225,245,.95)');
            gr.addColorStop(1, 'rgba(110,160,205,.75)');
            g.globalAlpha = rv;
            g.fillStyle = gr;
            g.beginPath();
            g.moveTo(L[0][0], L[0][1]);
            for (let i = 1; i <= N; i++) g.lineTo(L[i][0], L[i][1]);
            for (let i = N; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
            g.closePath();
            g.fill();
            // נצנוץ על המים
            g.fillStyle = COL.creamLight;
            for (let i = 4; i < N; i += 3) {
                const tw = .5 + .5 * Math.sin(t * 2.6 + i * 1.3);
                const x = (L[i][0] + R[i][0]) / 2, y = L[i][1];
                g.globalAlpha = rv * tw * (pratDone ? 1 : .55);
                g.beginPath(); sparklePath(g, x, y, (2.2 + i * .12) * k); g.fill();
            }
            g.globalAlpha = 1;
        }

        // היישוב: גבעה קרובה עם בתים וחלונות דולקים
        function drawNearHills() {
            if (sy(170) > H + 5) return;
            const ridge = u => 96 + 16 * Math.sin(u * .012 + 2.3) + 6 * Math.sin(u * .04 + .7);
            g.fillStyle = '#0B1424';
            g.beginPath();
            g.moveTo(-4, sy(-2));
            for (let x = -4; x <= W + 12; x += 10) g.lineTo(x, sy(ridge((x - cx) / k + camX)));
            g.lineTo(W + 12, sy(-2));
            g.closePath();
            g.fill();
            for (const h of houses) {
                const base = ridge(h.x + h.w / 2) - 5;
                const X = sx(h.x), Y = sy(base), w = h.w * k, hh = h.h * k;
                g.fillStyle = '#0B1424';
                g.fillRect(X, Y - hh, w, hh + 6 * k);
                g.beginPath();
                g.moveTo(X - 3 * k, Y - hh + .5);
                g.lineTo(X + w / 2, Y - hh - 9 * k);
                g.lineTo(X + w + 3 * k, Y - hh + .5);
                g.closePath();
                g.fill();
                const n = h.win.length;
                for (let i = 0; i < n; i++) {
                    if (!h.win[i]) continue;
                    g.fillStyle = 'rgba(247,199,126,.88)';
                    g.fillRect(X + (w / (n + 1)) * (i + 1) - 2 * k, Y - hh * .62, 4 * k, 4 * k);
                }
            }
        }

        function drawLights() {
            const ly = markers[2].y;
            const yEnd = ly + 44;
            const p0 = sy(yEnd), p1 = sy(ly - 44) + Math.sin(t * .9) * 2 * k;
            if (Math.min(p0, p1) > H + 30 || Math.max(p0, p1) < -40) return;
            g.strokeStyle = 'rgba(46,23,16,.95)';
            g.lineWidth = 1.6;
            g.beginPath();
            g.moveTo(-6, p0);
            g.quadraticCurveTo(W / 2, p1, W + 6, p0);
            g.stroke();
            const N = Math.max(8, Math.round(W / (34 * k)));
            const cols = ['#F7C77E', COL.orange, COL.creamLight, '#F7C77E'];
            for (let i = 0; i <= N; i++) {
                const u = (i + .5) / (N + 1);
                const x = -6 + (W + 12) * u;
                const y = (1 - u) * (1 - u) * p0 + 2 * u * (1 - u) * p1 + u * u * p0;
                const tw = .78 + .22 * Math.sin(t * 2.1 + i * 1.7);
                const R = 18 * k;
                g.globalAlpha = tw;
                g.drawImage(bulbGlow, x - R, y + 3 * k - R, R * 2, R * 2);
                g.globalAlpha = 1;
                g.fillStyle = COL.brown;
                g.fillRect(x - 2 * k, y - 1 * k, 4 * k, 4 * k);
                g.fillStyle = cols[i % cols.length];
                g.beginPath();
                g.ellipse(x, y + 7 * k, 3.6 * k, 4.8 * k, 0, 0, Math.PI * 2);
                g.fill();
            }
        }

        function drawGroundAndBar() {
            const yG = sy(0);
            if (yG > H + 4 && sy(markers[0].y + 30) > H) return;
            // הבר
            const top = markers[0].y;
            const bx0 = sx(104);
            const bx1 = W + 6;
            const yTop = sy(top);
            g.globalAlpha = .9;
            g.drawImage(barGlow, bx0 - 120 * k, yTop - 150 * k, 340 * k, 300 * k);
            g.globalAlpha = 1;
            // גוף הבר
            g.fillStyle = COL.brown;
            g.fillRect(bx0 + 4 * k, yTop + 8 * k, bx1 - bx0, yG - yTop - 8 * k);
            g.fillStyle = 'rgba(0,0,0,.22)';
            for (let x = bx0 + 18 * k; x < bx1; x += 17 * k) g.fillRect(x, yTop + 14 * k, 2 * k, yG - yTop - 20 * k);
            g.fillStyle = 'rgba(232,135,59,.25)';
            g.fillRect(bx0 + 4 * k, yG - 24 * k, bx1 - bx0, 2.5 * k);
            // משטח עליון
            g.fillStyle = COL.orangeDeep;
            g.beginPath(); roundRect(g, bx0 - 8 * k, yTop + 2 * k, bx1 - bx0 + 8 * k, 9 * k, 3 * k); g.fill();
            g.fillStyle = COL.orange;
            g.beginPath(); roundRect(g, bx0 - 8 * k, yTop - 1 * k, bx1 - bx0 + 8 * k, 7 * k, 3 * k); g.fill();
            // ברז
            const tx = sx(160);
            g.fillStyle = '#d9d3c7';
            g.fillRect(tx - 3 * k, yTop - 30 * k, 6 * k, 30 * k);
            g.fillRect(tx - 3 * k, yTop - 30 * k, 14 * k, 5 * k);
            g.fillRect(tx + 8 * k, yTop - 30 * k, 4 * k, 10 * k);
            g.fillStyle = COL.orange;
            g.beginPath(); roundRect(g, tx - 3.5 * k, yTop - 46 * k, 7 * k, 17 * k, 3 * k); g.fill();
            // כוסות
            const glass = (gx, fill, foam) => {
                const X = sx(gx);
                g.fillStyle = 'rgba(244,234,219,.22)';
                g.beginPath();
                g.moveTo(X - 7 * k, yTop - 22 * k); g.lineTo(X + 7 * k, yTop - 22 * k);
                g.lineTo(X + 5.5 * k, yTop); g.lineTo(X - 5.5 * k, yTop); g.closePath(); g.fill();
                g.fillStyle = fill;
                g.beginPath();
                g.moveTo(X - 6.4 * k, yTop - 15 * k); g.lineTo(X + 6.4 * k, yTop - 15 * k);
                g.lineTo(X + 5.4 * k, yTop - 1 * k); g.lineTo(X - 5.4 * k, yTop - 1 * k); g.closePath(); g.fill();
                if (foam) { g.fillStyle = foam; g.fillRect(X - 6.6 * k, yTop - 18 * k, 13.2 * k, 3.5 * k); }
            };
            glass(130, '#4A2416', 'rgba(244,234,219,.5)');
            glass(192, '#E9A64A', COL.creamLight);

            // הדק
            if (yG < H + 2) {
                g.fillStyle = '#26140D';
                g.fillRect(0, yG, W, H - yG + 20);
                g.fillStyle = '#6A3A22';
                g.fillRect(0, yG, W, 3 * k);
                g.fillStyle = 'rgba(0,0,0,.28)';
                for (let y = yG + 16 * k; y < H; y += 16 * k) g.fillRect(0, y, W, 1.5 * k);
                g.globalAlpha = .45;
                g.drawImage(barGlow, sx(0) - 200 * k, yG - 40 * k, 400 * k, 110 * k);
                g.globalAlpha = 1;
            }
        }

        function drawMarkers() {
            const fk = clamp(k, .9, 1.15);
            g.font = `700 ${Math.round(12.5 * fk)}px Rubik, 'Segoe UI', sans-serif`;
            g.textBaseline = 'middle';
            g.textAlign = 'right';
            try { g.direction = 'rtl'; } catch (e) { /* דפדפן ישן */ }
            const x0 = colX0 + 8, x1 = colX0 + colW - 8;
            markers.forEach((m, i) => {
                const Y = sy(m.y);
                if (Y < -40 || Y > H + 10) return;
                // מתחת לשבבי ה-HUD בראש המסך התווית נעלמת בהדרגה, כדי שלא תציץ מאחוריהם
                const fade = state === 'intro' ? 1 : clamp((Y - 86) / 32, 0, 1);
                if (fade <= 0) return;
                g.globalAlpha = fade;
                const done = i < passed;
                g.setLineDash([5 * k, 7 * k]);
                g.lineWidth = 1.5;
                g.strokeStyle = done ? 'rgba(232,135,59,.75)' : 'rgba(244,234,219,.26)';
                g.beginPath(); g.moveTo(x0, Y); g.lineTo(x1, Y); g.stroke();
                g.setLineDash([]);
                const tw = g.measureText(m.name).width;
                const ph = 22 * fk, pw = tw + 20 * fk;
                const pop = 1 + .22 * Math.sin(m.flash * Math.PI) * (m.flash > 0 ? 1 : 0);
                g.save();
                g.translate(x1, Y - 3);
                g.scale(pop, pop);
                g.beginPath();
                roundRect(g, -pw, -ph, pw, ph, ph / 2);
                g.fillStyle = done ? COL.orange : 'rgba(13,22,38,.84)';
                g.fill();
                g.lineWidth = done ? 1.6 : 1;
                g.strokeStyle = done ? COL.brown : 'rgba(244,234,219,.3)';
                g.stroke();
                g.fillStyle = done ? COL.brown : COL.creamDim;
                g.fillText(m.name, -10 * fk, -ph / 2 + .5);
                g.restore();
            });
            g.globalAlpha = 1;
        }

        function drawTower() {
            const n = chairs.length;
            const s = sway();
            for (let i = 0; i < n; i++) {
                const c = chairs[i];
                const cy = i * STEP + CH / 2;
                const Y = sy(cy);
                if (Y < -spriteH || Y > H + spriteH) continue;
                let yo = 0;
                if (i === n - 1 && c.lt < 1) yo = -5 * Math.exp(-c.lt * 9) * Math.cos(c.lt * 26);
                drawChair(c.ox + swayAt(i, n, s), cy + yo, chairRot(i, n, s), 1, 1);
            }
        }

        function drawCurrent() {
            if (!cur) return;
            const n = chairs.length;
            const cyw = cur.base + CH / 2;
            if (state === 'swing') {
                // קו כיוון עדין אל ראש המגדל
                const X = sx(cur.x);
                g.setLineDash([2 * k, 6 * k]);
                g.strokeStyle = 'rgba(244,234,219,.3)';
                g.lineWidth = 1.5;
                g.beginPath(); g.moveTo(X, sy(cur.base) + 4); g.lineTo(X, sy(topH(n)) - 4); g.stroke();
                g.setLineDash([]);
            }
            const R = 80 * k;
            g.globalAlpha = .22;
            g.drawImage(softGlow, sx(cur.x) - R, sy(cyw) - R, R * 2, R * 2);
            g.globalAlpha = 1;
            const a = Math.min(1, cur.age / .18);
            const sc = a < 1 ? .6 + .4 * (1 - Math.pow(1 - a, 3)) + Math.sin(a * Math.PI) * .08 : 1;
            drawChair(cur.x, cyw, cur.rot, sc, Math.min(1, .5 + a));
        }

        function drawFall() {
            for (const p of fall.pieces) {
                if (Math.abs(p.x) > (W / 2) / k + 150) continue;
                drawChair(p.x, p.y, p.rot, 1, 1);
            }
        }

        function drawParticles() {
            g.fillStyle = COL.creamLight;
            for (const p of particles) {
                g.globalAlpha = Math.max(0, p.life / p.max) * .8;
                const r = p.r * k;
                g.fillRect(sx(p.x) - r / 2, sy(p.y) - r / 2, r, r);
            }
            g.globalAlpha = 1;
        }

        function render() {
            if (!W || !chairSprite) return;
            g.setTransform(dpr, 0, 0, dpr, 0, 0);
            g.fillStyle = skyGrad;
            g.fillRect(0, 0, W, H);
            if (shake > .3) g.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);
            drawStars();
            drawMoon();
            drawFar();
            drawNearHills();
            drawLights();
            drawGroundAndBar();
            drawMarkers();
            if (state === 'fall' || (state === 'end' && fall)) drawFall();
            else drawTower();
            drawCurrent();
            drawParticles();
        }

        function frame(now) {
            if (destroyed) return;
            raf = requestAnimationFrame(frame);
            let dt = last ? (now - last) / 1000 : 0;
            last = now;
            if (!(dt > 0)) dt = 0;
            if (dt > .05) dt = .05;
            update(dt);
            render();
        }

        // ---- סוף ----
        function fmt(v) { return String(v); } // הערך כבר מעוגל לספרה אחת (או שתיים ליד צבי אחד)
        function showEnd() {
            if (state === 'end') return;
            state = 'end';
            const n = chairs.length;
            let deers = Math.round(topH(n) / DEER_H * 10) / 10;
            // מגדל שעבר את הצבי בקצת לא יוצג כ"צבי אחד": מדייקים לשתי ספרות (1.02)
            if (deers === 1 && topH(n) > DEER_H) deers = Math.floor(topH(n) / DEER_H * 100) / 100;
            const NB = '\u00a0'; // רווח שלא נשבר: "(כולל קרניים)" ו"3.6 צבאים" נשארים באותה שורה
            const deerTxt = deers < 1 ? `${fmt(deers)}${NB}צבי` : deers === 1 ? `צבי${NB}אחד` : `${fmt(deers)}${NB}צבאים`;
            const best = markers.slice(0, passed).pop();
            const tailTxt = best ? LINES[best.key](best.at) : '';
            const tail = tailTxt ? ' ' + tailTxt : '';
            const line = `מגדל של ${n} כיסאות. גובה: ${deerTxt} (כולל${NB}קרניים).${tail}`;
            const shareLine = `בניתי מגדל של ${n} כיסאות במשחק של הפרתיה.`;
            const end = document.createElement('div');
            end.className = 'g-tower-end';
            // אותו טקסט בדיוק, רק בשתי שורות: המדידה, ואז מה שרואים מהגובה הזה
            end.innerHTML = `<div class="g-tower-end-in">
                <div class="g-tower-end-art" aria-hidden="true"><span class="g-tower-end-sun"></span>${Deer.svg({ body: true, mood: 'happy', title: 'הצבי של הפרתיה' })}<span class="g-tower-end-ring"></span></div>
                <h3>סוף <em>ערב.</em></h3>
                <p>מגדל של <b>${n}${NB}כיסאות</b>. גובה:${NB}<b>${deerTxt}</b> (כולל${NB}קרניים).</p>
                ${tailTxt ? `<p class="g-tower-end-tail">${tailTxt}</p>` : ''}
                <div class="g-tower-end-actions">
                    <button type="button" class="btn btn-primary btn-block" data-act="join">להצטרף לצוות</button>
                    <button type="button" class="btn btn-ghost btn-block" data-act="again">עוד סבב</button>
                    <button type="button" class="g-tower-quiet" data-act="share">לשלוח לחברים</button>
                </div>
            </div>`;
            end.addEventListener('click', e => {
                const b = e.target.closest('button');
                if (!b) return;
                const act = b.getAttribute('data-act');
                if (act === 'join') ctx.joinTeam();
                else if (act === 'again') ctx.restart();
                else if (act === 'share') ctx.share(shareLine);
            });
            root.appendChild(end);
            root.__result = { chairs: n, line, shareLine };
            later(() => { if (raf) { cancelAnimationFrame(raf); raf = 0; } }, 450);
        }

        // ---- קלט ----
        function onDown(e) {
            if (e.button != null && e.button > 0) return;
            if (e.target.closest && e.target.closest('button, a, .g-tower-end')) return;
            if (state === 'intro') { e.preventDefault(); start(); return; }
            if (state === 'swing') {
                e.preventDefault();
                drop();
            }
        }
        function onKey(e) {
            if (e.code !== 'Space' && e.key !== ' ') return;
            const ae = document.activeElement;
            if (ae && (ae.tagName === 'BUTTON' || ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
            if (state === 'intro') { e.preventDefault(); start(); }
            else if (state === 'swing') { e.preventDefault(); drop(); }
        }
        const startBtn = root.querySelector('.g-tower-start');
        startBtn.addEventListener('click', start);
        root.addEventListener('pointerdown', onDown);
        window.addEventListener('keydown', onKey);
        window.addEventListener('resize', resize);
        let ro = null;
        if (window.ResizeObserver) { ro = new ResizeObserver(() => resize()); ro.observe(stage); }

        setDeer('happy');
        resize();
        raf = requestAnimationFrame(frame);
        focusRoot();

        // ממשק בדיקה קטן (לא בשימוש בעמוד)
        root.__tower = {
            get state() { return state; },
            get chairs() { return chairs.length; },
            get cur() { return cur; },
            get topX() { const n = chairs.length; return chairs[n - 1].ox + swayAt(n - 1, n, sway()); },
            drop, start,
        };

        return {
            destroy() {
                destroyed = true;
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
                timers.forEach(clearTimeout);
                root.removeEventListener('pointerdown', onDown);
                window.removeEventListener('keydown', onKey);
                window.removeEventListener('resize', resize);
                startBtn.removeEventListener('click', start);
                if (ro) ro.disconnect();
                root.remove();
            },
        };
    }

    window.PartyiaGames = window.PartyiaGames || {};
    window.PartyiaGames[ID] = { title: 'מגדל הכיסאות', mount };
})();
