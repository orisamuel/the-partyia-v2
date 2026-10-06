/**
 * pour.js: המזיגה המושלמת.
 * מחזיקים כדי למזוג, משחררים כדי לעצור. אחרי השחרור הקצף עולה עוד קצת, תמיד באותה מידה.
 * 5 הזמנות, ציון לפי המרחק מהקו המקווקו, חותמת "מאושר" והצבי מהנהן.
 *
 * מבנה: canvas אחד לבר (רקע, צבי, דלפק, כוס, נוזל, ברז), ו-DOM לפתק, לחותמת, לכפתור ולמסכים.
 * הסצנה מצוירת ביחידות עיצוב (360x446) ומוגדלת לפי גודל המסך.
 *
 * גרסת team-v2: אותו משחק בדיוק (תוכן, תזמון, ניקוד), בשפה של העמוד החדש.
 * מסגרת נייר קרם (ניקוד, כפתור, מסך פתיחה וסיום), והבר עצמו בכרטיס ערב כהה עם מסגרת דיו.
 * Karantina לכותרות ולמספרים, Rubik לשאר. לא תלוי ב-team/brand.css.
 */
(function () {
    'use strict';

    const STYLE_ID = 'g-pour-style';
    // שפת העמוד החדש: נייר קרם, דיו חום, שמש כתומה. הבר עצמו נשאר בערב, בכרטיס כהה עם מסגרת דיו.
    // לא תלוי ב-team/brand.css: כל מה שצריך מוזרק כאן, עם ערכי גיבוי לטוקנים של team-v2/style.css.
    const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .33 0 0 0 0 .2 0 0 0 0 .1 0 0 0 .18 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
    const INK_MASK = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='s'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.6' numOctaves='2' seed='4' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.4 0 0 0 2.75'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23s)'/%3E%3C/svg%3E\")";
    const CSS = `
.g-pour-wrap{--gp-paper:var(--paper,#F4EADB);--gp-paper2:var(--paper-2,#EBDDC7);--gp-paper3:var(--paper-3,#E2D1B6);--gp-ink:var(--ink,#2E1710);--gp-ink2:var(--ink-2,#5E4135);--gp-ink3:var(--ink-3,#8B6E5F);--gp-sun:var(--sun,#E8873B);--gp-burnt:var(--burnt,#C4531A);--gp-burnt-text:var(--burnt-text,#9C3F0E);--gp-line:var(--line,rgba(46,23,16,.14));--gp-slip:#F7EEE0;--gp-display:var(--display,'Karantina','Rubik',sans-serif);--gp-body:var(--body,'Rubik','Segoe UI',Tahoma,sans-serif)}
.g-pour-wrap{position:absolute;inset:0;display:flex;flex-direction:column;direction:rtl;background:var(--gp-paper) ${GRAIN};font-family:var(--gp-body);color:var(--gp-ink);-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;overflow:hidden;-webkit-tap-highlight-color:transparent}
.g-pour-col{position:relative;width:100%;max-width:480px;margin:0 auto}
.g-pour-hud{flex-shrink:0;padding:6px 20px 8px}
.g-pour-hudrow{display:flex;align-items:center;justify-content:space-between;height:42px}
.g-pour-dots{display:flex;gap:7px;align-items:flex-end}
.g-pour-dot{position:relative;width:16px;height:20px;border:2px solid rgba(46,23,16,.22);border-top-width:0;border-radius:2px 2px 6px 6px;overflow:hidden;transition:border-color .3s,transform .3s}
.g-pour-dot i{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(180deg,#F0A05A,var(--gp-burnt));transition:height .7s cubic-bezier(.2,1.3,.4,1)}
.g-pour-dot.is-done{border-color:var(--gp-ink)}
.g-pour-dot.is-cur{border-color:var(--gp-burnt);transform:translateY(-4px)}
.g-pour-score{display:flex;align-items:baseline;gap:8px;font-size:14px;font-weight:500;color:var(--gp-ink3)}
.g-pour-score b{display:inline-block;min-width:1.6em;font-family:var(--gp-display);font-size:42px;font-weight:700;line-height:.8;color:var(--gp-ink);text-align:right;font-variant-numeric:tabular-nums;transform-origin:85% 70%}
.g-pour-score b.is-bump{animation:g-pour-bump .4s cubic-bezier(.2,1.6,.4,1)}
@keyframes g-pour-bump{0%{transform:scale(1)}40%{transform:scale(1.28)}100%{transform:scale(1)}}
.g-pour-board{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;width:calc(100% - 24px);max-width:480px;margin:0 auto;border:2px solid var(--gp-ink);border-radius:20px;overflow:hidden;isolation:isolate;background:linear-gradient(180deg,#1F3353 0%,#17263D 48%,#111D30 100%);box-shadow:0 4px 0 var(--gp-ink)}
.g-pour-rail{position:relative;z-index:2;flex-shrink:0;height:124px}
.g-pour-rail .g-pour-col{height:100%}
.g-pour-rail .g-pour-col::before{content:'';position:absolute;top:12px;left:14px;right:14px;height:6px;border-radius:3px;background:linear-gradient(180deg,#e4e5e8,#7f838b);box-shadow:0 2px 5px rgba(0,0,0,.45)}
.g-pour-slipbox{position:absolute;top:14px;left:0;right:0;margin:0 auto;width:min(300px,calc(100% - 56px))}
.g-pour-slip{position:absolute;top:0;left:0;right:0;padding:12px 16px 7px;background:var(--gp-slip);color:var(--gp-ink);border-radius:2px 2px 0 0;box-shadow:0 12px 22px rgba(0,0,0,.34);transform-origin:50% 0;transform:rotate(-1.4deg)}
.g-pour-slip::before{content:'';position:absolute;top:-6px;left:50%;width:44px;height:13px;margin-left:-22px;border-radius:3px;background:linear-gradient(180deg,#eef0f3,#959aa3);box-shadow:0 2px 3px rgba(0,0,0,.35)}
.g-pour-slip::after{content:'';position:absolute;left:0;right:0;bottom:-7px;height:7px;background:linear-gradient(135deg,var(--gp-slip) 50%,transparent 50%) 0 0/10px 7px repeat-x,linear-gradient(225deg,var(--gp-slip) 50%,transparent 50%) 0 0/10px 7px repeat-x}
.g-pour-slip.is-in{animation:g-pour-slip-in .55s cubic-bezier(.2,1.25,.4,1) both}
.g-pour-slip.is-out{animation:g-pour-slip-out .42s ease-in both}
.g-pour-slip.is-thud{animation:g-pour-thud .3s ease-out}
@keyframes g-pour-slip-in{0%{transform:translateY(-150%) rotate(6deg)}100%{transform:rotate(-1.4deg)}}
@keyframes g-pour-slip-out{0%{transform:rotate(-1.4deg);opacity:1}100%{transform:translate(-120%,-30px) rotate(-16deg);opacity:0}}
@keyframes g-pour-thud{0%{transform:rotate(-1.4deg) translateY(0)}35%{transform:rotate(-.6deg) translateY(4px)}100%{transform:rotate(-1.4deg) translateY(0)}}
.g-pour-slip-head{display:flex;justify-content:space-between;gap:10px;padding-bottom:5px;margin-bottom:5px;border-bottom:1.5px dashed rgba(46,23,16,.25);font-size:12px;font-weight:700;letter-spacing:.2px;color:var(--gp-ink3)}
.g-pour-slip-text{font-family:var(--gp-display);font-size:31px;font-weight:700;line-height:.98;letter-spacing:.2px;text-wrap:balance}
.g-pour-stamp{position:absolute;left:12px;top:6px;padding:5px 12px 1px;border:3px solid currentColor;border-radius:9px;color:var(--gp-burnt);font-family:var(--gp-display);font-size:34px;font-weight:700;line-height:1;letter-spacing:1px;opacity:0;pointer-events:none;mix-blend-mode:multiply;box-shadow:inset 0 0 0 2px var(--gp-slip),inset 0 0 0 3.5px currentColor;-webkit-mask-image:${INK_MASK};mask-image:${INK_MASK};-webkit-mask-size:120px;mask-size:120px;transform:rotate(-13deg) scale(2.2)}
.g-pour-stamp.is-on{animation:g-pour-stamp .34s cubic-bezier(.3,1.5,.5,1) forwards}
@keyframes g-pour-stamp{0%{opacity:0;transform:rotate(-26deg) scale(2.4)}60%{opacity:.95}100%{opacity:.92;transform:rotate(-13deg) scale(1)}}
.g-pour-scene{position:relative;flex:1;min-height:0}
.g-pour-canvas{position:absolute;inset:0;display:block;width:100%;height:100%}
.g-pour-pop{position:absolute;z-index:2;text-align:center;white-space:nowrap;pointer-events:none;transform:translate(-50%,-100%);animation:g-pour-pop 1.5s cubic-bezier(.2,1,.3,1) forwards}
.g-pour-pop b{display:block;font-family:var(--gp-display);font-size:62px;font-weight:700;line-height:.86;color:var(--gp-sun);text-shadow:0 3px 0 var(--gp-ink)}
.g-pour-pop span{display:inline-block;margin-top:6px;padding:2px 11px 3px;border:1.5px solid var(--gp-ink);border-radius:99px;background:var(--gp-slip);font-size:14px;font-weight:700;color:var(--gp-ink)}
@keyframes g-pour-pop{0%{opacity:0;transform:translate(-50%,-60%) scale(.5)}14%{opacity:1;transform:translate(-50%,-100%) scale(1.12)}26%{transform:translate(-50%,-100%) scale(1)}78%{opacity:1;transform:translate(-50%,-112%)}100%{opacity:0;transform:translate(-50%,-150%)}}
.g-pour-say{position:absolute;left:0;bottom:0;z-index:3;box-sizing:border-box;max-width:172px;text-wrap:balance;padding:8px 12px 9px;border:2px solid var(--gp-ink);border-radius:14px;background:var(--gp-slip);color:var(--gp-ink);font-size:14px;font-weight:500;line-height:1.35;box-shadow:0 3px 0 rgba(0,0,0,.3);opacity:0;transform:scale(.5);transform-origin:var(--tail,20px) 100%;transition:opacity .18s,transform .28s cubic-bezier(.2,1.5,.4,1);pointer-events:none}
.g-pour-say.is-on{opacity:1;transform:scale(1)}
.g-pour-say::before,.g-pour-say::after{content:'';position:absolute;border-style:solid;border-color:transparent;border-bottom:0}
.g-pour-say::before{left:calc(var(--tail,20px) - 3px);bottom:-12px;border-width:12px 11px 0;border-top-color:var(--gp-ink)}
.g-pour-say::after{left:var(--tail,20px);bottom:-8px;border-width:9px 8px 0;border-top-color:var(--gp-slip)}
.g-pour-controls{flex-shrink:0;padding:16px 16px max(16px,env(safe-area-inset-bottom))}
.g-pour-controls .g-pour-col{display:flex;justify-content:center}
.g-pour-hold{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:360px;height:64px;border:2px solid var(--gp-ink);border-radius:16px;background:var(--gp-sun);color:var(--gp-ink);font-family:var(--gp-body);font-size:19px;font-weight:700;cursor:pointer;touch-action:none;-webkit-tap-highlight-color:transparent;box-shadow:0 5px 0 var(--gp-ink);transition:transform .08s,box-shadow .08s,background-color .25s,color .25s,border-color .25s}
.g-pour-hold svg{width:22px;height:22px;flex-shrink:0}
.g-pour-hold.is-on{transform:translateY(4px);box-shadow:0 1px 0 var(--gp-ink)}
.g-pour-hold.is-on svg{animation:g-pour-drip .35s ease-in-out infinite alternate}
.g-pour-hold.is-off{background:var(--gp-paper2);color:var(--gp-ink3);border-color:rgba(46,23,16,.3);box-shadow:0 5px 0 rgba(46,23,16,.3)}
.g-pour-hold.is-off.is-on{box-shadow:0 1px 0 rgba(46,23,16,.3)}
.g-pour-hold.is-hint::after{content:'';position:absolute;inset:-8px;border:2px solid rgba(196,83,26,.7);border-radius:22px;animation:g-pour-ring 1.5s ease-out infinite;pointer-events:none}
@keyframes g-pour-ring{0%{opacity:.9;transform:scale(.96)}100%{opacity:0;transform:scale(1.07)}}
@keyframes g-pour-drip{0%{transform:translateY(-2px)}100%{transform:translateY(3px)}}
.g-pour-screen{position:absolute;inset:0;z-index:5;background:var(--gp-paper) ${GRAIN};color:var(--gp-ink);touch-action:auto}
.g-pour-hero{position:relative;flex-shrink:0;width:168px;height:132px}
.g-pour-sun{position:absolute;left:50%;bottom:0;width:128px;height:128px;margin-left:-64px;border-radius:50%;background:var(--gp-sun);overflow:hidden}
.g-pour-sun::before,.g-pour-sun::after{content:'';position:absolute;height:4px;border-radius:2px;background:var(--gp-paper)}
.g-pour-sun::before{top:38%;right:-6px;width:40px}
.g-pour-sun::after{top:70%;left:-6px;width:34px}
.g-pour-hero .g-pour-spark{position:absolute;top:10px;left:16px;width:15px;height:15px}
.g-pour-hero .deer{position:absolute;left:50%;bottom:-2px;width:118px;height:auto;margin-left:-59px}
.g-pour-wrap .deer .deer-eye{transform-box:fill-box;transform-origin:center;animation:g-pour-blink 4.2s infinite}
.g-pour-wrap .deer .deer-eye:nth-child(2){animation-delay:.04s}
@keyframes g-pour-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
.g-pour-intro{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px 26px;text-align:center;transition:opacity .3s}
.g-pour-intro.is-gone{opacity:0;pointer-events:none}
.g-pour-intro .g-pour-hero .deer{animation:g-pour-bob 2.6s ease-in-out infinite}
.g-pour-intro h3{margin:8px 0 2px;font-family:var(--gp-display);font-size:66px;font-weight:700;line-height:.86;letter-spacing:.3px;color:var(--gp-ink)}
.g-pour-intro h3 span,.g-pour-end h3 span{display:block;color:var(--gp-burnt)}
.g-pour-intro p{margin:0;max-width:320px;font-size:17px;line-height:1.55;color:var(--gp-ink2)}
.g-pour-intro small{font-size:14.5px;line-height:1.45;color:var(--gp-ink3)}
.g-pour-intro .btn{min-width:220px;min-height:58px;margin-top:12px;font-size:20px}
@keyframes g-pour-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
.g-pour-end{display:flex;flex-direction:column;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;animation:g-pour-endin .4s cubic-bezier(.2,1.2,.4,1) both}
@keyframes g-pour-endin{0%{opacity:0;transform:translateY(14px)}100%{opacity:1;transform:none}}
.g-pour-end-in{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:380px;margin:auto;padding:22px 20px max(20px,env(safe-area-inset-bottom));text-align:center}
.g-pour-end .g-pour-hero{width:140px;height:108px}
.g-pour-end .g-pour-sun{width:104px;height:104px;margin-left:-52px}
.g-pour-end .g-pour-hero .deer{width:98px;margin-left:-49px}
.g-pour-end .g-pour-hero .g-pour-spark{top:6px;left:12px}
.g-pour-end h3{margin:6px 0 0;font-family:var(--gp-display);font-size:62px;font-weight:700;line-height:.86;letter-spacing:.3px;color:var(--gp-ink)}
.g-pour-end p{margin:0;font-size:16px;line-height:1.55;color:var(--gp-ink2);text-wrap:balance}
.g-pour-end p b{font-weight:700;color:var(--gp-ink)}
.g-pour-end .g-pour-bar{font-weight:700;color:var(--gp-burnt-text)}
.g-pour-receipt{display:grid;grid-template-columns:repeat(5,1fr);width:100%;margin:4px 0 2px;border-top:1.5px solid var(--gp-ink);border-bottom:1.5px solid var(--gp-ink)}
.g-pour-chip{display:flex;flex-direction:column;align-items:center;padding:9px 2px 7px}
.g-pour-chip + .g-pour-chip{border-right:1px solid var(--gp-line)}
.g-pour-chip small{font-size:12.5px;font-weight:500;line-height:1.2;color:var(--gp-ink3)}
.g-pour-chip b{margin-top:4px;font-family:var(--gp-display);font-size:34px;font-weight:700;line-height:.85;color:var(--gp-ink)}
.g-pour-chip.is-top b{color:var(--gp-burnt)}
.g-pour-actions{display:flex;flex-direction:column;gap:10px;width:100%;margin-top:6px}
.g-pour-quiet{align-self:center;min-height:44px;padding:0 12px;border:none;background:none;font-family:var(--gp-body);font-size:15.5px;font-weight:500;color:var(--gp-ink2);text-decoration:underline;text-decoration-thickness:1.5px;text-underline-offset:4px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.g-pour-quiet:active{color:var(--gp-ink)}
@media (min-width:480px){.g-pour-slipbox{width:min(400px,calc(100% - 56px))}}
/* פתק קומפקטי כשהסצנה מוגבלת בגובה: ההזמנה של שתי שורות לא מסתירה את ידית הברז */
@media (max-height:680px),(max-width:479px) and (max-height:800px){
.g-pour-rail{height:108px}
.g-pour-rail .g-pour-col::before{top:8px}
.g-pour-slipbox{top:10px}
.g-pour-slip{padding:9px 14px 5px}
.g-pour-slip-head{padding-bottom:4px;margin-bottom:4px}
.g-pour-slip-text{font-size:25px;line-height:.93}
.g-pour-stamp{font-size:30px}
}
@media (max-height:680px){
.g-pour-hud{padding:4px 20px 6px}
.g-pour-hudrow{height:38px}
.g-pour-score b{font-size:38px}
.g-pour-controls{padding-top:13px;padding-bottom:max(12px,env(safe-area-inset-bottom))}
.g-pour-hold{height:56px;font-size:18px}
.g-pour-intro .g-pour-hero{width:150px;height:112px}
.g-pour-intro .g-pour-sun{width:108px;height:108px;margin-left:-54px}
.g-pour-intro .g-pour-hero .deer{width:100px;margin-left:-50px}
.g-pour-intro h3{font-size:58px}
.g-pour-end-in{gap:10px;padding-top:16px}
.g-pour-end .g-pour-hero{width:120px;height:86px}
.g-pour-end .g-pour-sun{width:84px;height:84px;margin-left:-42px}
.g-pour-end .g-pour-hero .deer{width:80px;margin-left:-40px}
.g-pour-end h3{font-size:54px}
.g-pour-end p{font-size:15px}
}
@media (prefers-reduced-motion:reduce){.g-pour-intro .g-pour-hero .deer,.g-pour-hold.is-hint::after,.g-pour-wrap .deer .deer-eye{animation:none}}
`;

    function injectCSS() {
        if (document.getElementById(STYLE_ID)) return;
        const st = document.createElement('style');
        st.id = STYLE_ID;
        st.textContent = CSS;
        document.head.appendChild(st);
    }

    /* ---------- עולם ביחידות עיצוב ---------- */
    const SW = 360, SH = 446;      // גודל הסצנה
    const C = 386;                 // קו הדלפק (תחתית הכוס)
    const GX = 200;                // מרכז הברז
    const NOZ_Y = 130;             // קצה הברז
    const PIVOT_Y = 90;            // ציר הידית
    const RISE_D = 24;             // כמה הקצף עולה אחרי השחרור. תמיד אותו דבר.
    const RISE_DUR = 0.8, RISE_HOLD = 0.22;
    const STREAM_V = 1500;
    const DEER_W = 116, DEER_H = 145, DEER_HOME = 60, DEER_TOP = C - 130;

    const DRINKS = {
        beer: { top: '#f7b538', bot: '#cf7414', surf: '#fbcf6a', foam: '#f3e2c0', foamTop: '#fff8ea', dots: 'rgba(176,128,70,.28)', stream: '#f2a936', streamW: 7, fizz: 'rgba(255,246,220,.55)', handle: '#E8873B', label: 'בירה' },
        lager: { top: '#fbd45a', bot: '#e6a028', surf: '#fde58f', foam: '#f5e8c9', foamTop: '#fffaf0', dots: 'rgba(176,128,70,.25)', stream: '#f8c94c', streamW: 6.5, fizz: 'rgba(255,250,228,.6)', handle: '#E8873B', label: 'בירה' },
        cola: { top: '#6a2c14', bot: '#230b04', surf: '#8a4524', foam: '#b98b62', foamTop: '#dcbb95', dots: 'rgba(90,45,20,.35)', stream: '#4c1e0c', streamW: 6, fizz: 'rgba(255,230,200,.32)', handle: '#a8321f', label: 'קולה' },
        zero: { top: '#5e2711', bot: '#1d0903', surf: '#7e3f20', foam: '#b08460', foamTop: '#d8b892', dots: 'rgba(90,45,20,.35)', stream: '#44190a', streamW: 6, fizz: 'rgba(255,230,200,.32)', handle: '#1f2227', label: 'זירו' },
        water: { top: 'rgba(190,226,255,.40)', bot: 'rgba(140,196,242,.55)', surf: 'rgba(228,244,255,.75)', foam: null, foamTop: null, dots: null, stream: 'rgba(205,234,255,.85)', streamW: 4, fizz: null, handle: '#6fb2e0', label: 'מים' },
    };

    const GLASSES = {
        mug: { H: 170, base: 16, wB: 48, wT: 48, wall: 6, curve: 1, r: 10, kind: 'mug' },
        highball: { H: 200, base: 12, wB: 34, wT: 40, wall: 4, curve: 1, r: 8, kind: 'highball' },
        pilsner: { H: 196, base: 30, wB: 16, wT: 42, wall: 3.5, curve: 0.75, r: 7, kind: 'pilsner' },
        tiny: { H: 60, base: 10, wB: 19, wT: 24, wall: 3, curve: 1, r: 6, kind: 'tiny' },
    };

    const ORDERS = [
        { text: 'בירה, שתי אצבעות קצף', table: 'שולחן 4', short: 'בירה', drink: 'beer', glass: 'mug', target: 146, rate: 72, foamRatio: 0.2, riseFoam: 1 },
        { text: 'קולה, עד הקו', table: 'שולחן 9', short: 'קולה', drink: 'cola', glass: 'highball', target: 138, rate: 82, foamRatio: 0.035, riseFoam: 0.55 },
        { text: 'קולה זירו, בלי לגלוש', table: 'שולחן 9', short: 'זירו', drink: 'zero', glass: 'highball', target: 186, rate: 86, foamRatio: 0.035, riseFoam: 0.55 },
        { text: 'בירה, כמעט בלי קצף', table: 'שולחן 2', short: 'בירה', drink: 'lager', glass: 'pilsner', target: 170, rate: 88, foamRatio: 0.03, riseFoam: 0.25 },
        { text: 'כוס מים קטנטנה לצבי, בלי קצף (הוא רגיש)', table: 'מאחורי הבר', short: 'מים', drink: 'water', glass: 'tiny', target: 42, rate: 30, foamRatio: 0, riseFoam: 0 },
    ];

    /* ---------- עזרים ---------- */
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const lerp = (a, b, t) => a + (b - a) * t;
    const rand = (a, b) => a + Math.random() * (b - a);
    const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
    const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOutBack = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
    const easeInBack = t => { const c1 = 1.5, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; };

    function hw(g, h) {
        const t = clamp(h / g.H, 0, 1);
        return g.wB + (g.wT - g.wB) * Math.pow(t, g.curve);
    }

    function roundRect(c, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        c.beginPath();
        c.moveTo(x + rr, y);
        c.lineTo(x + w - rr, y);
        c.quadraticCurveTo(x + w, y, x + w, y + rr);
        c.lineTo(x + w, y + h - rr);
        c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        c.lineTo(x + rr, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - rr);
        c.lineTo(x, y + rr);
        c.quadraticCurveTo(x, y, x + rr, y);
        c.closePath();
    }

    // צורת כוס: fw(y) = חצי רוחב בגובה y. open = בלי קו עליון (לקו המתאר)
    function shapePath(c, cx, yBot, yTop, fw, r, open) {
        const N = 12, yr = yBot - r;
        c.beginPath();
        for (let i = 0; i <= N; i++) {
            const y = yTop + (yr - yTop) * i / N;
            if (i) c.lineTo(cx - fw(y), y); else c.moveTo(cx - fw(y), y);
        }
        const wb = fw(yBot);
        c.quadraticCurveTo(cx - wb, yBot, cx - wb + r, yBot);
        c.lineTo(cx + wb - r, yBot);
        c.quadraticCurveTo(cx + wb, yBot, cx + fw(yr), yr);
        for (let i = N - 1; i >= 0; i--) {
            const y = yTop + (yr - yTop) * i / N;
            c.lineTo(cx + fw(y), y);
        }
        if (!open) c.closePath();
    }

    function starPath(c, x, y, r) {
        const k = r * 0.12;
        c.beginPath();
        c.moveTo(x, y - r);
        c.bezierCurveTo(x + k, y - k * 1.8, x + k * 1.8, y - k, x + r, y);
        c.bezierCurveTo(x + k * 1.8, y + k, x + k, y + k * 1.8, x, y + r);
        c.bezierCurveTo(x - k, y + k * 1.8, x - k * 1.8, y + k, x - r, y);
        c.bezierCurveTo(x - k * 1.8, y - k, x - k, y - k * 1.8, x, y - r);
        c.closePath();
    }

    function chrome(c, x0, x1) {
        const g = c.createLinearGradient(x0, 0, x1, 0);
        g.addColorStop(0, '#5a5f69');
        g.addColorStop(0.3, '#e8eaee');
        g.addColorStop(0.52, '#b4b8c0');
        g.addColorStop(1, '#4b5059');
        return g;
    }

    function scoreLabel(sc, over) {
        if (over) return 'נדיב';
        if (sc === 100) return 'בול על הקו';
        if (sc >= 90) return 'מילימטרים';
        if (sc >= 70) return 'יפה מאוד';
        if (sc >= 40) return 'יפה';
        return 'נמזג';
    }

    function tierFor(total) {
        if (total >= 480) return 'יד של יהלום';
        if (total >= 420) return 'יד של זהב';
        if (total >= 340) return 'יד של כסף';
        if (total >= 250) return 'יד של ארד';
        return 'יד נדיבה';
    }

    // רווח קשיח בתוך הסוגריים, כדי ש"(צבי אחד)" לא יישבר בין שתי שורות
    const COMMITTEE = 'הוועדה המקצועית (צבי אחד)';
    function committeeLine(n) {
        if (n === 0) return COMMITTEE + ' צפתה בעניין רב.';
        if (n === 1) return COMMITTEE + ' הנהנה פעם אחת.';
        if (n === 2) return COMMITTEE + ' הנהנה פעמיים.';
        if (n === 5) return COMMITTEE + ' הנהנה 5 פעמים מתוך 5.';
        return COMMITTEE + ' הנהנה ' + n + ' פעמים.';
    }

    function wipeLine(n) {
        if (!n) return '';
        if (n === 1) return ' הצבי ניגב את הבר פעם אחת, ברצון.';
        if (n === 2) return ' הצבי ניגב את הבר פעמיים, ברצון.';
        return ' הצבי ניגב את הבר ' + n + ' פעמים, ברצון.';
    }

    // לחיצה במצבים האלה נשמרת, ואם עדיין מחזיקים כשהכוס מוכנה, המזיגה מתחילה
    const QUEUE_STATES = ['rising', 'wipe', 'judge', 'exit', 'enter'];

    const DROP_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c3.3 4.6 6.5 8.2 6.5 11.8a6.5 6.5 0 0 1-13 0c0-3.6 3.2-7.2 6.5-11.8z" fill="currentColor"/><path d="M9 14.5a3.2 3.2 0 0 0 2.6 3.2" fill="none" stroke="rgba(244,234,219,.8)" stroke-width="1.8" stroke-linecap="round"/></svg>';
    const SPARK = '<svg class="g-pour-spark" viewBox="-10 -10 20 20" aria-hidden="true"><path d="M0 -10 C 1.2 -2.2, 2.2 -1.2, 10 0 C 2.2 1.2, 1.2 2.2, 0 10 C -1.2 2.2, -2.2 1.2, -10 0 C -2.2 -1.2, -1.2 -2.2, 0 -10 Z" fill="#E8873B"/></svg>';

    // השמש מהלוגו מאחורי הצבי, למסך הפתיחה והסיום
    function hero(Deer, mood) {
        return '<div class="g-pour-hero" aria-hidden="true"><span class="g-pour-sun"></span>' + SPARK + (Deer ? Deer.svg({ mood: mood }) : '') + '</div>';
    }

    // פונטים של העמוד לטקסט שמצויר על הקנבס (לוח הגיר, הידית, הכוס של הצבי)
    const F_DISPLAY = "'Karantina', 'Rubik', sans-serif";
    const F_BODY = "'Rubik', 'Segoe UI', sans-serif";

    /* ---------- המשחק ---------- */
    function mount(stage, ctx) {
        injectCSS();
        const Deer = (ctx && ctx.Deer) || window.Deer;
        let destroyed = false;
        const timers = [];
        const later = (fn, ms) => { timers.push(setTimeout(() => { if (!destroyed) fn(); }, ms)); };

        const wrap = document.createElement('div');
        wrap.className = 'g-pour-wrap';
        wrap.innerHTML = `
            <div class="g-pour-hud"><div class="g-pour-col g-pour-hudrow">
                <div class="g-pour-dots">${ORDERS.map(() => '<div class="g-pour-dot"><i></i></div>').join('')}</div>
                <div class="g-pour-score">ניקוד <b>0</b></div>
            </div></div>
            <div class="g-pour-board">
                <div class="g-pour-rail"><div class="g-pour-col"><div class="g-pour-slipbox"></div></div></div>
                <div class="g-pour-scene">
                    <canvas class="g-pour-canvas"></canvas>
                    <div class="g-pour-say"></div>
                </div>
            </div>
            <div class="g-pour-controls"><div class="g-pour-col">
                <button type="button" class="g-pour-hold is-off">${DROP_ICON}<span class="g-pour-hold-txt">להחזיק כדי למזוג</span></button>
            </div></div>
            <div class="g-pour-screen g-pour-intro">
                ${hero(Deer, 'happy')}
                <h3>המזיגה <span>המושלמת</span></h3>
                <p>מחזיקים כדי למזוג, משחררים כדי לעצור.<br>הקצף ממשיך לעלות עוד קצת.</p>
                <small>5 הזמנות. הוועדה המקצועית כבר במקום.</small>
                <button type="button" class="btn btn-primary g-pour-start">מתחילים</button>
            </div>`;
        stage.appendChild(wrap);

        const q = sel => wrap.querySelector(sel);
        const scene = q('.g-pour-scene');
        const canvas = q('.g-pour-canvas');
        const holdBtn = q('.g-pour-hold');
        const holdTxt = q('.g-pour-hold-txt');
        const scoreEl = q('.g-pour-score b');
        const slipBox = q('.g-pour-slipbox');
        const sayEl = q('.g-pour-say');
        const intro = q('.g-pour-intro');
        const startBtn = q('.g-pour-start');
        const dots = Array.prototype.slice.call(wrap.querySelectorAll('.g-pour-dot'));
        const g2d = canvas.getContext('2d');
        const bgLayer = document.createElement('canvas');
        const fgLayer = document.createElement('canvas');

        /* ----- מצב ----- */
        let state = 'intro', st = 0, time = 0;
        let idx = 0, total = 0, shownTotal = 0, nods = 0, wipes = 0;
        let judgeDur = 1.5, lessonShown = false, tipShown = false;
        let slipEl = null, endEl = null, sayUntil = 0, pendingPtr = null;
        const results = [];
        const glass = { ox: 330, L: 0, F: 0, relTop: -1, riseT: 0, spill: 0, score: 0, over: false, diff: 0, bracketA: 0 };
        const pour = { on: false, active: false, head: NOZ_Y, tail: NOZ_Y, hitT: 0, overT: 0, pointer: null };
        const deer = { x: DEER_HOME, lean: 0, hop: 0, mood: 'happy', moodBack: 0, nodT: -1, blink: 0, blinkNext: 2.2 };
        const handle = { ang: 0, flip: 1, drink: ORDERS[0].drink, nextDrink: ORDERS[0].drink };
        const puddle = { rx: 0, a: 0 };
        const rag = { x: 0, a: 0 };
        let drips = [], bubbles = [], drops = [], sparks = [];
        const foamDots = [];
        for (let i = 0; i < 26; i++) foamDots.push({ u: rand(-0.88, 0.88), v: rand(0.12, 0.9), r: rand(0.8, 2.1) });

        /* ----- פריסה ----- */
        let cssW = 0, cssH = 0, dpr = 1, s = 1, ox = 0, oy = 0;
        const sprites = { pw: 0, gen: 0, ready: {} };

        function layout() {
            const w = scene.clientWidth, h = scene.clientHeight;
            if (!w || !h) { cssW = 0; return; }
            dpr = Math.min(2, window.devicePixelRatio || 1);
            cssW = w; cssH = h;
            canvas.width = Math.round(w * dpr);
            canvas.height = Math.round(h * dpr);
            s = Math.min(w / SW, h / SH, 1.5);
            ox = (w - SW * s) / 2;
            oy = h - SH * s;
            bgLayer.width = fgLayer.width = canvas.width;
            bgLayer.height = fgLayer.height = canvas.height;
            buildLayers();
            buildDeerSprites();
        }

        function buildDeerSprites() {
            if (!Deer) return;
            const pw = Math.max(8, Math.round(DEER_W * s * dpr));
            if (sprites.pw === pw) return;
            sprites.pw = pw;
            const ph = Math.round(pw * 1.25);
            const gen = ++sprites.gen;
            const ready = {};
            ['happy', 'neutral', 'wink', 'closed'].forEach(m => {
                const markup = Deer.svg({ body: true, mood: m }).replace('<svg ', '<svg width="' + pw + '" height="' + ph + '" ');
                const img = new Image();
                img.onload = () => {
                    if (destroyed || gen !== sprites.gen) return;
                    const cv = document.createElement('canvas');
                    cv.width = pw; cv.height = ph;
                    cv.getContext('2d').drawImage(img, 0, 0, pw, ph);
                    ready[m] = cv;
                    sprites.ready = ready;
                };
                img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(markup);
            });
        }

        function duTransform(c) { c.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy); }

        function buildLayers() {
            const b = bgLayer.getContext('2d');
            b.setTransform(1, 0, 0, 1, 0, 0);
            b.clearRect(0, 0, bgLayer.width, bgLayer.height);
            duTransform(b);
            drawDecor(b);
            const f = fgLayer.getContext('2d');
            f.setTransform(1, 0, 0, 1, 0, 0);
            f.clearRect(0, 0, fgLayer.width, fgLayer.height);
            f.setTransform(dpr, 0, 0, dpr, 0, 0);
            drawCounter(f);
        }

        function drawDecor(b) {
            // אור חם מאחורי הברז
            let gr = b.createRadialGradient(GX, 250, 10, GX, 250, 210);
            gr.addColorStop(0, 'rgba(232,135,59,0.17)');
            gr.addColorStop(1, 'rgba(232,135,59,0)');
            b.fillStyle = gr;
            b.fillRect(-300, -200, 960, 700);

            // השמש מהלוגו, מאחורי הצבי
            gr = b.createRadialGradient(48, 296, 8, 60, 312, 64);
            gr.addColorStop(0, '#EE9349');
            gr.addColorStop(1, '#E2803A');
            b.fillStyle = gr;
            b.beginPath(); b.arc(60, 312, 62, 0, Math.PI * 2); b.fill();
            b.globalCompositeOperation = 'destination-out';
            b.fillRect(86, 294, 50, 3.4); b.fillRect(100, 301, 30, 1.6);
            b.fillRect(-12, 342, 44, 3.4); b.fillRect(-6, 349, 24, 1.6);
            b.globalCompositeOperation = 'source-over';

            b.fillStyle = '#F4EADB';
            starPath(b, 116, 252, 6.5); b.fill();
            starPath(b, 14, 262, 4); b.fill();
            b.globalAlpha = 0.7;
            starPath(b, 250, 52, 4); b.fill();
            starPath(b, 132, 40, 3); b.fill();
            b.globalAlpha = 1;

            // לוח גיר עם התפריט
            roundRect(b, 284, 30, 70, 122, 6); b.fillStyle = '#5E4135'; b.fill();
            roundRect(b, 288, 34, 62, 114, 3); b.fillStyle = '#1d2a29'; b.fill();
            gr = b.createRadialGradient(312, 70, 4, 312, 70, 60);
            gr.addColorStop(0, 'rgba(255,255,255,0.07)');
            gr.addColorStop(1, 'rgba(255,255,255,0)');
            b.fillStyle = gr; b.fillRect(288, 34, 62, 114);
            b.fillStyle = 'rgba(244,234,219,0.94)';
            b.direction = 'rtl';
            b.textAlign = 'center';
            b.textBaseline = 'alphabetic';
            b.font = '700 18px ' + F_DISPLAY;
            b.fillText('תפריט', 319, 52);
            b.strokeStyle = 'rgba(232,135,59,0.85)'; b.lineWidth = 1.2;
            b.beginPath(); b.moveTo(302, 56); b.quadraticCurveTo(319, 53, 336, 56); b.stroke();
            b.textAlign = 'right';
            b.font = '400 8.6px ' + F_BODY;
            b.fillStyle = 'rgba(244,234,219,0.8)';
            ['בירה', 'יין', 'קוקטיילים', 'ערק', 'קולה', 'קולה זירו', 'מים לצבי'].forEach((t, i) => b.fillText(t, 344, 69 + i * 11.4));

            // מדף עם בקבוקים
            b.fillStyle = '#22375A';
            const bottle = (x, w, h, neck) => {
                const y = 206;
                roundRect(b, x - w / 2, y - h, w, h, 3); b.fill();
                roundRect(b, x - 2, y - h - neck, 4, neck + 2, 1.5); b.fill();
            };
            bottle(274, 10, 26, 9); bottle(290, 12, 30, 11); bottle(326, 9, 22, 8); bottle(342, 11, 28, 10);
            roundRect(b, 299, 186, 16, 20, 3); b.fill();
            b.fillStyle = 'rgba(244,234,219,0.08)';
            b.fillRect(287, 180, 2, 20); b.fillRect(339, 182, 2, 18);
            b.fillStyle = '#2D4670';
            b.fillRect(262, 206, 100, 5);

            // לוח עץ על הקיר, עליו הברז
            roundRect(b, 156, 64, 88, 62, 9); b.fillStyle = '#2E1710'; b.fill();
            roundRect(b, 159, 67, 82, 56, 7);
            gr = b.createLinearGradient(0, 67, 0, 123);
            gr.addColorStop(0, '#6a3720'); gr.addColorStop(1, '#4a2414');
            b.fillStyle = gr; b.fill();
            b.fillStyle = 'rgba(0,0,0,0.18)';
            b.fillRect(159, 84, 82, 1.2); b.fillRect(159, 104, 82, 1.2);
            b.fillStyle = '#b4b8c0';
            [[166, 74], [234, 74], [166, 116], [234, 116]].forEach(p => { b.beginPath(); b.arc(p[0], p[1], 2.2, 0, Math.PI * 2); b.fill(); });
            b.fillStyle = chrome(b, 168, 232);
            roundRect(b, 168, 86, 64, 24, 11); b.fill();
            b.fillStyle = chrome(b, 193, 207);
            roundRect(b, 193, 106, 14, 19, 3); b.fill();
            b.fillStyle = '#3a3f48';
            roundRect(b, 195.5, 122, 9, 8, 2); b.fill();
            b.fillStyle = '#E8873B';
            b.beginPath(); b.arc(GX, 98, 6.5, 0, Math.PI * 2); b.fill();
            b.fillStyle = '#F4EADB';
            starPath(b, GX, 98, 3.6); b.fill();
        }

        function drawCounter(f) {
            const yTop = oy + (C - 2) * s, slab = 14 * s;
            let gr = f.createLinearGradient(0, yTop, 0, yTop + slab);
            gr.addColorStop(0, '#8d4f2c');
            gr.addColorStop(1, '#5e321d');
            f.fillStyle = gr;
            f.fillRect(0, yTop, cssW, slab);
            f.fillStyle = 'rgba(255,214,170,0.35)';
            f.fillRect(0, yTop, cssW, Math.max(1, 1.4 * s));
            const yF = yTop + slab;
            gr = f.createLinearGradient(0, yF, 0, cssH);
            gr.addColorStop(0, '#3E1D12');
            gr.addColorStop(1, '#2E1710');
            f.fillStyle = gr;
            f.fillRect(0, yF, cssW, cssH - yF);
            f.fillStyle = 'rgba(0,0,0,0.22)';
            const step = 44 * s;
            for (let x = ox % step; x < cssW; x += step) f.fillRect(x, yF + 10 * s, Math.max(1, 1.5 * s), cssH - yF);
            f.fillStyle = '#C4531A';
            f.fillRect(0, yF + 5 * s, cssW, 2.5 * s);
            gr = f.createLinearGradient(0, yF, 0, yF + 8 * s);
            gr.addColorStop(0, 'rgba(0,0,0,0.4)');
            gr.addColorStop(1, 'rgba(0,0,0,0)');
            f.fillStyle = gr;
            f.fillRect(0, yF, cssW, 8 * s);
            // מגש טפטוף מתחת לברז
            const tx = ox + (GX - 64) * s, tw = 128 * s, ty = oy + (C - 3) * s;
            f.fillStyle = '#23262c';
            roundRect(f, tx, ty, tw, 10 * s, 3 * s); f.fill();
            f.fillStyle = '#4b5059';
            for (let i = 1; i < 16; i++) f.fillRect(tx + tw * i / 16, ty + 2 * s, Math.max(1, 1.2 * s), 6 * s);
            f.fillStyle = 'rgba(255,255,255,0.35)';
            f.fillRect(tx + 3 * s, ty, tw - 6 * s, Math.max(1, 1.1 * s));
        }

        /* ----- DOM ----- */
        function cur() { return ORDERS[idx]; }

        function setState(n) {
            state = n; st = 0;
            wrap.setAttribute('data-state', n);
            updateHold();
            // לחצו קצת מוקדם ועדיין מחזיקים: מתחילים למזוג ברגע שהכוס מוכנה
            if (n === 'ready' && pendingPtr !== null) {
                const p = pendingPtr;
                pendingPtr = null;
                startPour(p);
            }
        }

        function updateHold() {
            const o = cur();
            holdBtn.classList.toggle('is-on', state === 'pouring' || pendingPtr !== null);
            holdBtn.classList.toggle('is-off', state !== 'ready' && state !== 'pouring');
            holdBtn.classList.toggle('is-hint', state === 'ready' && idx === 0 && !lessonShown);
            let t = 'להחזיק כדי למזוג';
            if (state === 'pouring') t = 'מוזגים';
            else if (state === 'rising') t = o.drink === 'water' ? 'המים עוד עולים' : 'הקצף עוד עולה';
            if (holdTxt.textContent !== t) holdTxt.textContent = t;
        }

        function updateDots() {
            dots.forEach((d, i) => {
                d.classList.toggle('is-cur', i === idx && state !== 'end');
                d.classList.toggle('is-done', !!results[i] && results[i].judged);
                d.firstChild.style.height = results[i] && results[i].judged ? Math.max(18, results[i].score) * 0.86 + '%' : '0';
            });
        }

        function showSlip() {
            const o = cur();
            if (slipEl) {
                const old = slipEl;
                old.classList.remove('is-in', 'is-thud');
                old.classList.add('is-out');
                later(() => old.remove(), 450);
            }
            slipEl = document.createElement('div');
            slipEl.className = 'g-pour-slip is-in';
            slipEl.innerHTML = '<div class="g-pour-slip-head"><span>הזמנה ' + (idx + 1) + ' מתוך 5</span><span>' + o.table + '</span></div>' +
                '<div class="g-pour-slip-text">' + o.text + '</div><div class="g-pour-stamp">מאושר</div>';
            slipBox.appendChild(slipEl);
        }

        function stampSlip() {
            if (!slipEl) return;
            slipEl.querySelector('.g-pour-stamp').classList.add('is-on');
            later(() => {
                if (!slipEl) return;
                slipEl.classList.remove('is-in', 'is-thud');
                void slipEl.offsetWidth;
                slipEl.classList.add('is-thud');
            }, 200);
            try { if (navigator.vibrate) navigator.vibrate(14); } catch (e) { /* בלי רטט */ }
        }

        function say(text, dur) {
            sayEl.textContent = text;
            sayEl.classList.remove('is-on');
            void sayEl.offsetWidth;
            sayEl.classList.add('is-on');
            sayUntil = time + dur;
            positionSay();
        }

        // הבועה נשארת משמאל לכוס: לא מסתירה את הקו המקווקו ואת סימון העלייה (הסוגר הכתום)
        function positionSay() {
            const head = ox + deer.x * s;
            let left = Math.max(6, head - 52 * s);
            let maxW = 172;
            if (state !== 'wipe' && state !== 'sip' && state !== 'end') {
                const o = cur(), g = GLASSES[o.glass];
                const lineX = GX - (hw(g, o.target) + g.wall + 9) - 2;
                const bracketX = GX - (Math.max(hw(g, 0), hw(g, g.H)) + g.wall) - 18 - 4;
                const clear = ox + Math.min(lineX, bracketX) * s - 6;
                left = Math.max(6, Math.min(left, clear - 150));
                maxW = clamp(clear - left, 120, 172);
            }
            sayEl.style.left = left + 'px';
            sayEl.style.maxWidth = maxW + 'px';
            sayEl.style.setProperty('--tail', clamp(head - 24 * s - left - 8, 10, maxW - 30) + 'px');
            sayEl.style.bottom = (cssH - (oy + (DEER_TOP + 4) * s)) + 'px';
        }

        function popScore(sc, over) {
            const g = GLASSES[cur().glass];
            const rimY = C - g.base - g.H;
            const el = document.createElement('div');
            el.className = 'g-pour-pop';
            el.innerHTML = '<b dir="ltr">+' + sc + '</b><span>' + scoreLabel(sc, over) + '</span>';
            el.style.left = (ox + (GX + 76) * s) + 'px';
            el.style.top = (oy + Math.min(rimY + 10, 230) * s) + 'px';
            scene.appendChild(el);
            later(() => el.remove(), 1600);
        }

        /* ----- זרימת משחק ----- */
        function startGame() {
            intro.classList.add('is-gone');
            later(() => { intro.style.display = 'none'; }, 320);
            enterGlass();
        }

        function enterGlass() {
            const o = cur();
            glass.ox = 330; glass.L = 0; glass.F = 0; glass.relTop = -1; glass.riseT = 0;
            glass.spill = 0; glass.over = false; glass.bracketA = 0;
            drips = []; bubbles = []; drops = [];
            puddle.rx = 0; puddle.a = 0;
            handle.nextDrink = o.drink;
            if (handle.drink !== o.drink) handle.flip = 0;
            deer.mood = 'happy';
            showSlip();
            setState('enter');
            updateDots();
            if (idx === 4) later(() => { if (state === 'enter' || state === 'ready') say('אותו כלל גם במים.', 2.4); }, 450);
        }

        function startPour(pid) {
            pour.on = true; pour.active = true; pour.pointer = pid;
            pour.head = NOZ_Y; pour.tail = NOZ_Y; pour.hitT = 0; pour.overT = 0;
            glass.relTop = -1;
            deer.mood = 'neutral';
            if (time < sayUntil && idx !== 4) sayUntil = time;
            setState('pouring');
        }

        function release() {
            if (!pour.on) return;
            pour.on = false; pour.pointer = null;
            glass.relTop = glass.L + glass.F;
            glass.riseT = 0;
            glass.bracketA = 1;
            setState('rising');
        }

        function addVolume(dh) {
            const o = cur();
            glass.F += dh * o.foamRatio;
            glass.L += dh * (1 - o.foamRatio);
        }

        function evaluate() {
            const o = cur(), g = GLASSES[o.glass];
            const top = glass.L + glass.F;
            const over = top > g.H + 0.5;
            if (!over && top < o.target * 0.5) {
                say('עוד קצת?', 1.8);
                deer.mood = 'happy';
                glass.relTop = -1;
                glass.bracketA = 0;
                setState('ready');
                return;
            }
            let sc;
            if (over) sc = 25;
            else {
                const dd = Math.abs(top - o.target);
                sc = dd <= 3 ? 100 : Math.max(5, Math.round(100 - (dd - 3) * 2.2));
            }
            glass.score = sc; glass.over = over; glass.diff = top - o.target;
            results[idx] = { score: sc, over: over, judged: false };
            if (over) {
                wipes++;
                deer.mood = 'happy';
                say('אין בעיה.', 1.5);
                setState('wipe');
            } else {
                judge();
            }
        }

        function judge() {
            const sc = glass.score;
            total += sc;
            results[idx].judged = true;
            stampSlip();
            popScore(sc, glass.over);
            updateDots();
            scoreEl.classList.remove('is-bump'); void scoreEl.offsetWidth; scoreEl.classList.add('is-bump');
            const headX = deer.x, headY = DEER_TOP + 50;
            if (sc >= 90) {
                nods++;
                deer.nodT = 0;
                deer.mood = sc === 100 ? 'wink' : 'happy';
                burst(headX + 10, headY - 30, sc === 100 ? 9 : 5);
                if (sc === 100) burst(GX, C - GLASSES[cur().glass].base - cur().target, 8);
            } else if (sc >= 60 || glass.over) {
                deer.mood = 'happy';
            } else {
                deer.mood = 'neutral';
                deer.moodBack = 0.9;
            }
            judgeDur = 1.5;
            if (idx === 0 && !lessonShown) {
                lessonShown = true;
                judgeDur = 2.7;
                say('אחרי השחרור הקצף עולה עוד אצבע. תמיד אצבע.', 2.9);
            } else if (idx > 0 && idx < 4 && !tipShown) {
                if (glass.over || glass.diff > 12) {
                    tipShown = true; judgeDur = 2.4;
                    say('טיפ מקצועי: לשחרר בערך אצבע לפני הקו.', 2.6);
                } else if (glass.diff < -12) {
                    tipShown = true; judgeDur = 2.2;
                    say('אפשר להחזיק עוד רגע.', 2.2);
                }
            }
            setState('judge');
        }

        function burst(x, y, n) {
            for (let i = 0; i < n; i++) {
                const a = rand(0, Math.PI * 2), v = rand(40, 95);
                sparks.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, t: 0, life: rand(0.55, 0.9), r: rand(3, 6.5), c: Math.random() < 0.5 ? '#F4EADB' : '#E8873B' });
            }
        }

        function nextGlass() {
            idx++;
            enterGlass();
        }

        function showEnd() {
            pendingPtr = null;
            setState('end');
            updateDots();
            sayEl.classList.remove('is-on');
            const tier = tierFor(total);
            let best = 0;
            results.forEach(r => { if (r.score > best) best = r.score; });
            const chips = ORDERS.map((o, i) => {
                const r = results[i];
                const top = r.score === best && !r.over;
                return '<div class="g-pour-chip' + (top ? ' is-top' : '') + '"><small>' + o.short + '</small><b>' + r.score + '</b></div>';
            }).join('');
            endEl = document.createElement('div');
            endEl.className = 'g-pour-screen g-pour-end';
            endEl.innerHTML = '<div class="g-pour-end-in">' +
                hero(Deer, total >= 420 ? 'wink' : 'happy') +
                '<h3>' + tier + '</h3>' +
                '<div class="g-pour-receipt">' + chips + '</div>' +
                '<p>ציון כולל: <b>' + total + '</b> מתוך 500.<br>' + committeeLine(nods) + wipeLine(wipes) + '</p>' +
                '<p class="g-pour-bar">הסף הנדרש לבר בפרתיה: להגיע.</p>' +
                '<div class="g-pour-actions">' +
                '<button type="button" class="btn btn-primary btn-block" data-act="join">להצטרף לצוות</button>' +
                '<button type="button" class="btn btn-ghost btn-block" data-act="again">עוד סבב</button>' +
                '<button type="button" class="g-pour-quiet" data-act="share">לשלוח לחברים</button>' +
                '</div></div>';
            endEl.addEventListener('click', onEndClick);
            wrap.appendChild(endEl);
        }

        function onEndClick(e) {
            const b = e.target.closest ? e.target.closest('[data-act]') : null;
            if (!b) return;
            const act = b.getAttribute('data-act');
            const h = ctx || {};
            if (act === 'join' && h.joinTeam) h.joinTeam();
            else if (act === 'again' && h.restart) h.restart();
            else if (act === 'share' && h.share) h.share('קיבלתי ' + total + ' מתוך 500 במזיגה המושלמת של הפרתיה.');
        }

        /* ----- עדכון ----- */
        function update(dt) {
            time += dt; st += dt;
            const o = cur(), g = GLASSES[o.glass];
            const yB = C - g.base;

            // ידית
            const targetAng = pour.on ? -0.36 : 0;
            handle.ang += (targetAng - handle.ang) * Math.min(1, dt * 16);
            if (handle.flip < 1) {
                handle.flip += dt;
                if (handle.flip >= 0.15) handle.drink = handle.nextDrink;
            }

            // סילון
            const topNow = Math.min(glass.L + glass.F, g.H);
            const surfY = yB - topNow;
            if (pour.on) {
                pour.tail = NOZ_Y;
                pour.head = Math.min(surfY, pour.head + STREAM_V * dt);
            } else if (pour.active) {
                pour.tail += STREAM_V * dt;
                pour.head = surfY;
                if (pour.tail >= surfY) pour.active = false;
            }
            const hitting = pour.active && pour.head >= surfY - 0.5;

            switch (state) {
                case 'enter': {
                    const t = Math.min(1, st / 0.6);
                    glass.ox = 330 * (1 - easeOutBack(t));
                    if (t >= 1) { glass.ox = 0; setState('ready'); }
                    break;
                }
                case 'pouring': {
                    if (hitting) {
                        pour.hitT += dt;
                        addVolume(o.rate * Math.min(1, pour.hitT / 0.12) * dt);
                    }
                    if (glass.L + glass.F > g.H) {
                        pour.overT += dt;
                        if (pour.overT > 0.45) release();
                    }
                    break;
                }
                case 'rising': {
                    if (glass.riseT < RISE_DUR) {
                        const t0 = glass.riseT;
                        glass.riseT = Math.min(RISE_DUR, t0 + dt);
                        const dE = RISE_D * (easeOutCubic(glass.riseT / RISE_DUR) - easeOutCubic(t0 / RISE_DUR));
                        glass.F += dE * o.riseFoam;
                        glass.L += dE * (1 - o.riseFoam);
                    } else if (st >= RISE_DUR + RISE_HOLD) {
                        evaluate();
                    }
                    break;
                }
                case 'wipe': {
                    // הצבי נעמד ליד הכוס (לא מאחוריה) ומנגב בסמרטוט
                    const cx = GX + glass.ox;
                    const outer = Math.max(hw(g, 0), hw(g, g.H)) + g.wall;
                    const stand = cx - outer - 44;
                    const sweep = Math.max(outer + 20, puddle.rx * 0.95);
                    if (st < 0.45) {
                        const t = easeInOut(st / 0.45);
                        deer.x = lerp(DEER_HOME, stand - sweep * 0.1, t);
                        rag.x = lerp(DEER_HOME + 46, cx - sweep, t);
                        rag.a = Math.min(1, st / 0.2);
                    } else if (st < 1.85) {
                        const u = st - 0.45;
                        rag.x = cx - sweep * Math.cos(u * Math.PI * 4 / 1.4);
                        rag.a = 1;
                        deer.x = stand + (rag.x - cx) * 0.1;
                        deer.mood = 'closed';
                        const k = clamp(u / 1.3, 0, 1);
                        puddle.a = 0.75 * (1 - k);
                        drips.forEach(d => { d.a = 1 - k; });
                    } else {
                        const t = easeInOut(Math.min(1, (st - 1.85) / 0.45));
                        deer.x = lerp(stand - sweep * 0.1, DEER_HOME, t);
                        rag.x = lerp(cx - sweep, DEER_HOME + 46, t);
                        rag.a = 1 - t;
                        deer.mood = 'happy';
                        puddle.a = 0;
                        drips = [];
                    }
                    if (st >= 2.3) {
                        // אחרי הניגוב: הכוס מלאה עד השפה, הבר יבש
                        const excess = glass.L + glass.F - (g.H - 0.8);
                        if (excess > 0) {
                            const fromF = Math.min(glass.F, excess);
                            glass.F -= fromF;
                            glass.L -= excess - fromF;
                        }
                        glass.spill = 0; drips = []; puddle.a = 0;
                        deer.x = DEER_HOME; rag.a = 0;
                        judge();
                    }
                    break;
                }
                case 'judge': {
                    if (st >= judgeDur) {
                        if (idx === 4) setState('sip');
                        else {
                            if (slipEl) { slipEl.classList.remove('is-in', 'is-thud'); slipEl.classList.add('is-out'); }
                            setState('exit');
                        }
                    }
                    break;
                }
                case 'exit': {
                    const t = Math.min(1, st / 0.5);
                    glass.ox = -360 * easeInBack(t);
                    glass.bracketA = Math.max(0, 1 - t * 3);
                    if (t >= 1) nextGlass();
                    break;
                }
                case 'sip': {
                    const t = Math.min(1, st / 0.6);
                    glass.ox = (DEER_HOME + 66 - GX) * easeInOut(t);
                    glass.bracketA = Math.max(0, 1 - t * 2);
                    if (st >= 0.6 && st - dt < 0.6) {
                        deer.mood = 'closed';
                        burst(DEER_HOME + 30, DEER_TOP + 40, 7);
                        say('תודה.', 1.3);
                    }
                    if (st > 0.7 && st < 1.5) glass.L = Math.max(glass.L * 0.55, glass.L - dt * 20);
                    if (st >= 1.5 && deer.mood === 'closed') deer.mood = 'happy';
                    if (st >= 2.0) showEnd();
                    break;
                }
                default: break;
            }

            // גלישה: שלוליות וטפטופים
            const over = glass.L + glass.F - g.H;
            if (over > 0) {
                glass.spill = over;
                if (!drips.length && (state === 'pouring' || state === 'rising')) {
                    drips.push({ side: -1, len: 0, sp: rand(70, 100), a: 1 });
                    drips.push({ side: 1, len: 0, sp: rand(55, 85), a: 1, delay: 0.15 });
                }
                if (state !== 'wipe') {
                    puddle.rx = Math.min(78, 14 + glass.spill * 1.8);
                    puddle.a = Math.min(0.75, puddle.a + dt * 2);
                }
            }
            const rimY = yB - g.H;
            drips.forEach(d => {
                if (d.delay > 0) { d.delay -= dt; return; }
                d.len = Math.min(C - rimY - 2, d.len + d.sp * dt);
            });

            // בועות
            const dk = DRINKS[o.drink];
            if (dk.fizz && glass.L > 6 && state !== 'exit') {
                const rate = pour.on ? 40 : 18;
                if (bubbles.length < 46 && Math.random() < rate * dt) {
                    bubbles.push({ u: rand(-0.82, 0.82), h: rand(0, glass.L * 0.5), v: rand(16, 42), r: rand(0.7, 1.9), ph: rand(0, 6) });
                }
            }
            for (let i = bubbles.length - 1; i >= 0; i--) {
                const b = bubbles[i];
                b.h += b.v * dt;
                if (b.h > Math.min(glass.L, g.H) - 1.5) bubbles.splice(i, 1);
            }

            // התזות בנקודת הפגיעה
            if (hitting && drops.length < 28 && Math.random() < 0.7) {
                drops.push({ x: GX + rand(-3, 3), y: surfY, vx: rand(-48, 48), vy: rand(-120, -50), t: 0 });
            }
            for (let i = drops.length - 1; i >= 0; i--) {
                const d = drops[i];
                d.t += dt; d.vy += 700 * dt; d.x += d.vx * dt; d.y += d.vy * dt;
                if (d.t > 0.4 || (d.vy > 0 && d.y > surfY + 2)) drops.splice(i, 1);
            }

            // ניצוצות
            for (let i = sparks.length - 1; i >= 0; i--) {
                const p = sparks[i];
                p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy = p.vy * 0.95 + 26 * dt;
                if (p.t > p.life) sparks.splice(i, 1);
            }

            // הצבי
            if (deer.nodT >= 0) { deer.nodT += dt; if (deer.nodT > 0.9) deer.nodT = -1; }
            if (deer.moodBack > 0) { deer.moodBack -= dt; if (deer.moodBack <= 0) deer.mood = 'happy'; }
            deer.blinkNext -= dt;
            if (deer.blinkNext <= 0) { deer.blink = 0.13; deer.blinkNext = rand(2.4, 5); }
            if (deer.blink > 0) deer.blink -= dt;
            const leanT = state === 'pouring' ? 5 : 0;
            deer.lean += (leanT - deer.lean) * Math.min(1, dt * 6);

            // בועת דיבור
            if (sayEl.classList.contains('is-on')) {
                if (time > sayUntil) sayEl.classList.remove('is-on');
                else positionSay();
            }

            // ניקוד
            if (shownTotal !== total) {
                shownTotal += (total - shownTotal) * Math.min(1, dt * 7);
                if (Math.abs(total - shownTotal) < 0.6) shownTotal = total;
                const v = String(Math.round(shownTotal));
                if (scoreEl.textContent !== v) scoreEl.textContent = v;
            }
        }

        /* ----- ציור ----- */
        function render() {
            const c = g2d;
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, canvas.width, canvas.height);
            if (!cssW) return;
            c.drawImage(bgLayer, 0, 0);
            duTransform(c);
            drawDeer(c);
            c.setTransform(1, 0, 0, 1, 0, 0);
            c.drawImage(fgLayer, 0, 0);
            duTransform(c);
            drawPuddle(c);
            drawGlass(c);
            drawDrips(c);
            drawStream(c);
            drawDrops(c);
            drawHandle(c);
            drawRag(c);
            drawSparks(c);
        }

        function drawDeer(c) {
            let mood = deer.mood;
            if ((mood === 'happy' || mood === 'neutral') && deer.blink > 0) mood = 'closed';
            const sp = sprites.ready[mood] || sprites.ready.happy;
            if (!sp) return;
            let dip = 0;
            if (deer.nodT >= 0 && deer.nodT < 0.84) dip = Math.pow(Math.sin(Math.PI * deer.nodT / 0.42), 2) * 8;
            const breathe = Math.sin(time * 2.1) * 0.9;
            c.drawImage(sp, deer.x + deer.lean - DEER_W / 2, DEER_TOP + dip + breathe, DEER_W, DEER_H);
        }

        function drawPuddle(c) {
            const o = cur(), g = GLASSES[o.glass], d = DRINKS[o.drink];
            const cx = GX + glass.ox;
            // צל הכוס
            c.fillStyle = 'rgba(0,0,0,0.28)';
            c.beginPath(); c.ellipse(cx, C + 1, (g.kind === 'pilsner' ? 30 : hw(g, 0) + g.wall) + 5, 3.2, 0, 0, Math.PI * 2); c.fill();
            if (puddle.a <= 0.01 || puddle.rx <= 0) return;
            c.globalAlpha = puddle.a;
            c.fillStyle = d.top;
            c.beginPath(); c.ellipse(cx, C + 3, puddle.rx, 4.6, 0, 0, Math.PI * 2); c.fill();
            if (d.foamTop) {
                c.fillStyle = d.foamTop;
                c.beginPath(); c.ellipse(cx + puddle.rx * 0.45, C + 2.5, puddle.rx * 0.22, 2, 0, 0, Math.PI * 2); c.fill();
                c.beginPath(); c.ellipse(cx - puddle.rx * 0.6, C + 3.5, puddle.rx * 0.14, 1.6, 0, 0, Math.PI * 2); c.fill();
            }
            c.fillStyle = 'rgba(255,255,255,0.35)';
            c.beginPath(); c.ellipse(cx - puddle.rx * 0.3, C + 2, puddle.rx * 0.35, 1.3, 0, 0, Math.PI * 2); c.fill();
            c.globalAlpha = 1;
        }

        function drawGlass(c) {
            const o = cur(), g = GLASSES[o.glass], d = DRINKS[o.drink];
            const cx = GX + glass.ox;
            if (cx < -120 || cx > SW + 160) return;
            const yB = C - g.base, rimY = yB - g.H;
            const fwIn = y => hw(g, yB - y);
            const fwOut = y => hw(g, yB - y) + g.wall;
            const bodyBot = g.kind === 'pilsner' ? yB + 10 : C;
            const rOut = g.r + g.wall * 0.7;
            const edge = 'rgba(242,232,213,0.74)';

            if (g.kind === 'pilsner') {
                c.fillStyle = 'rgba(205,228,250,0.2)';
                c.strokeStyle = edge; c.lineWidth = 1.8;
                roundRect(c, cx - 4.5, yB + 6, 9, C - 6 - (yB + 6), 2); c.fill(); c.stroke();
                c.beginPath(); c.ellipse(cx, C - 3, 30, 3.6, 0, 0, Math.PI * 2); c.fill(); c.stroke();
            }

            if (g.kind === 'mug') {
                const x0 = cx + g.wT + g.wall - 1, y0 = rimY + 24, y1 = yB - 4;
                c.beginPath();
                c.moveTo(x0, y0);
                c.bezierCurveTo(x0 + 50, y0 - 6, x0 + 50, y1 + 6, x0, y1);
                c.lineTo(x0, y1 - 14);
                c.bezierCurveTo(x0 + 31, y1 - 10, x0 + 31, y0 + 10, x0, y0 + 14);
                c.closePath();
                c.fillStyle = 'rgba(190,215,245,0.16)'; c.fill();
                c.strokeStyle = edge; c.lineWidth = 2; c.stroke();
            }

            // גוף הזכוכית
            shapePath(c, cx, bodyBot, rimY, fwOut, rOut);
            c.fillStyle = 'rgba(190,215,245,0.10)';
            c.fill();

            // נוזל וקצף
            c.save();
            shapePath(c, cx, yB, rimY, fwIn, g.r);
            c.clip();
            drawLiquid(c, o, g, d, cx, yB);
            c.restore();

            // תחתית עבה
            c.save();
            shapePath(c, cx, bodyBot, rimY, fwOut, rOut);
            c.clip();
            c.fillStyle = 'rgba(205,228,250,0.17)';
            c.fillRect(cx - 90, yB, 180, bodyBot - yB + 2);
            c.fillStyle = 'rgba(255,255,255,0.22)';
            c.fillRect(cx - hw(g, 0) + 2, yB + 2, (hw(g, 0) - 2) * 2, 1.4);
            c.restore();

            // דקורציה
            if (g.kind === 'mug') {
                c.strokeStyle = 'rgba(255,255,255,0.09)'; c.lineWidth = 1.4;
                for (let row = 0; row < 4; row++) {
                    for (let col = -1; col <= 1; col++) {
                        roundRect(c, cx + col * 28 - 7, rimY + 34 + row * 34, 14, 22, 6);
                        c.stroke();
                    }
                }
            }
            if (g.kind === 'tiny') {
                c.fillStyle = 'rgba(255,255,255,0.5)';
                c.direction = 'rtl';
                c.textAlign = 'center';
                c.font = '700 10px ' + F_BODY;
                c.fillText('צבי', cx, yB - 18);
                starPath(c, cx + 11, yB - 38, 3); c.fill();
            }

            // הברקות
            c.lineCap = 'round';
            c.strokeStyle = 'rgba(255,255,255,0.3)'; c.lineWidth = g.kind === 'tiny' ? 2.4 : 3.6;
            c.beginPath();
            c.moveTo(cx - hw(g, g.H * 0.9) * 0.7, rimY + g.H * 0.1);
            c.lineTo(cx - hw(g, g.H * 0.08) * 0.7, yB - g.H * 0.08);
            c.stroke();
            c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1.8;
            c.beginPath();
            c.moveTo(cx - hw(g, g.H * 0.85) * 0.45, rimY + g.H * 0.15);
            c.lineTo(cx - hw(g, g.H * 0.2) * 0.45, yB - g.H * 0.2);
            c.stroke();

            // קווי מתאר
            shapePath(c, cx, bodyBot, rimY, fwOut, rOut, true);
            c.strokeStyle = edge; c.lineWidth = 2; c.stroke();
            shapePath(c, cx, yB, rimY, fwIn, g.r, true);
            c.strokeStyle = 'rgba(242,232,213,0.2)'; c.lineWidth = 1; c.stroke();
            const rw = hw(g, g.H) + g.wall * 0.5;
            c.strokeStyle = 'rgba(242,232,213,0.45)'; c.lineWidth = 1.5;
            c.beginPath(); c.ellipse(cx, rimY, rw, 3.2, 0, Math.PI, Math.PI * 2); c.stroke();
            c.strokeStyle = edge; c.lineWidth = 1.8;
            c.beginPath(); c.ellipse(cx, rimY, rw, 3.2, 0, 0, Math.PI); c.stroke();

            // כיפה מעל השפה כשגולש
            if (glass.L + glass.F > g.H - 0.2 && glass.spill > 0) {
                const dome = Math.min(6, 2 + glass.spill * 0.35);
                const w = hw(g, g.H) + g.wall * 0.6;
                c.fillStyle = d.foamTop || d.surf;
                c.beginPath(); c.ellipse(cx, rimY + 1, w + 2, dome + 2, 0, Math.PI, Math.PI * 2); c.fill();
                c.fillRect(cx - w - 2, rimY, (w + 2) * 2, 3);
                if (d.foamTop) {
                    const n = Math.max(3, Math.round(w / 9));
                    for (let i = 0; i <= n; i++) {
                        const x = cx - w * 0.85 + (w * 1.7) * i / n;
                        c.beginPath(); c.arc(x, rimY - dome * 0.7 + Math.sin(i * 2.3) * 1.2, 3.6, 0, Math.PI * 2); c.fill();
                    }
                }
            }

            // הקו המקווקו
            const ty = yB - o.target;
            const tw = hw(g, o.target) + g.wall + 9;
            const showLine = state !== 'exit' || glass.ox > -60;
            if (showLine) {
                c.save();
                c.lineCap = 'butt';
                c.setLineDash([7, 5]);
                c.lineDashOffset = state === 'ready' ? -time * 10 : 0;
                c.strokeStyle = 'rgba(17,29,48,0.6)'; c.lineWidth = 4.2;
                c.beginPath(); c.moveTo(cx - tw, ty); c.lineTo(cx + tw, ty); c.stroke();
                c.strokeStyle = '#FFF9F0'; c.lineWidth = 2.2;
                c.beginPath(); c.moveTo(cx - tw, ty); c.lineTo(cx + tw, ty); c.stroke();
                c.restore();
                c.fillStyle = '#E8873B';
                c.strokeStyle = '#2E1710'; c.lineWidth = 1.2;
                c.beginPath(); c.moveTo(cx - tw - 1, ty - 6); c.lineTo(cx - tw + 8, ty); c.lineTo(cx - tw - 1, ty + 6); c.closePath(); c.fill(); c.stroke();
                if (g.kind !== 'mug') {
                    c.beginPath(); c.moveTo(cx + tw + 1, ty - 6); c.lineTo(cx + tw - 8, ty); c.lineTo(cx + tw + 1, ty + 6); c.closePath(); c.fill(); c.stroke();
                }
            }

            // סוגר: מכאן שחררתם, עד כאן הקצף עלה
            if (glass.relTop >= 0 && glass.relTop < g.H - 2 && glass.bracketA > 0) {
                const top = Math.min(glass.L + glass.F, g.H + 3);
                const y1 = yB - glass.relTop, y2 = yB - top;
                const bx = cx - (hw(g, glass.relTop) + g.wall) - 18;
                c.globalAlpha = glass.bracketA;
                c.strokeStyle = '#E8873B'; c.lineWidth = 2.4; c.lineCap = 'round';
                c.beginPath();
                c.moveTo(bx + 5, y1); c.lineTo(bx, y1); c.lineTo(bx, y2); c.lineTo(bx + 5, y2);
                c.stroke();
                c.fillStyle = '#F4EADB';
                c.beginPath(); c.arc(bx, y1, 2.4, 0, Math.PI * 2); c.fill();
                c.globalAlpha = 1;
            }
        }

        function drawLiquid(c, o, g, d, cx, yB) {
            const Lv = Math.min(glass.L, g.H);
            const Tv = Math.min(glass.L + glass.F, g.H);
            if (Tv < 0.4) return;
            const yL = yB - Lv, yT = yB - Tv;
            const wob = pour.active ? Math.sin(time * 19) * 0.9 : Math.sin(time * 3) * 0.3;
            const maxW = hw(g, g.H) + 4;

            if (Lv > 0.3) {
                const gr = c.createLinearGradient(0, yL, 0, yB);
                gr.addColorStop(0, d.top);
                gr.addColorStop(1, d.bot);
                c.fillStyle = gr;
                c.fillRect(cx - maxW, yL, maxW * 2, yB - yL + 2);
                if (d.fizz) {
                    c.fillStyle = d.fizz;
                    for (let i = 0; i < bubbles.length; i++) {
                        const b = bubbles[i];
                        if (b.h > Lv) continue;
                        const x = cx + b.u * hw(g, b.h) * 0.9 + Math.sin(time * 4 + b.ph) * 0.8;
                        c.beginPath(); c.arc(x, yB - b.h, b.r, 0, Math.PI * 2); c.fill();
                    }
                }
                if (Tv - Lv < 1) {
                    c.fillStyle = d.surf;
                    c.beginPath(); c.ellipse(cx, yL + wob, hw(g, Lv), 3.4, 0, 0, Math.PI * 2); c.fill();
                }
            }

            if (d.foam && Tv - Lv >= 0.5) {
                const fg = c.createLinearGradient(0, yT, 0, yL);
                fg.addColorStop(0, d.foamTop);
                fg.addColorStop(1, d.foam);
                c.fillStyle = fg;
                c.fillRect(cx - maxW, yT, maxW * 2, yL - yT + 1);
                // גבול מסולסל בין קצף לנוזל
                if (Lv > 2) {
                    c.fillStyle = d.foam;
                    for (let x = cx - maxW, i = 0; x <= cx + maxW; x += 7, i++) {
                        c.beginPath(); c.arc(x, yL + (i % 2 ? 0.6 : -0.4), 2.4, 0, Math.PI * 2); c.fill();
                    }
                }
                if (yL - yT > 5 && d.dots) {
                    c.strokeStyle = d.dots; c.lineWidth = 0.9;
                    for (let i = 0; i < foamDots.length; i++) {
                        const p = foamDots[i];
                        const y = yT + 2 + p.v * (yL - yT - 3);
                        c.beginPath(); c.arc(cx + p.u * hw(g, yB - y), y, p.r, 0, Math.PI * 2); c.stroke();
                    }
                }
                c.fillStyle = d.foamTop;
                c.beginPath(); c.ellipse(cx, yT + wob * 0.4, hw(g, Tv), 3.6, 0, 0, Math.PI * 2); c.fill();
            }

            // הצללה בצדדים לתחושת נפח
            const sh = c.createLinearGradient(cx - maxW, 0, cx + maxW, 0);
            sh.addColorStop(0, 'rgba(0,0,0,0.24)');
            sh.addColorStop(0.24, 'rgba(0,0,0,0)');
            sh.addColorStop(0.7, 'rgba(0,0,0,0)');
            sh.addColorStop(1, 'rgba(0,0,0,0.28)');
            c.fillStyle = sh;
            c.fillRect(cx - maxW, yT, maxW * 2, yB - yT + 2);
        }

        function drawDrips(c) {
            if (!drips.length) return;
            const o = cur(), g = GLASSES[o.glass], d = DRINKS[o.drink];
            const cx = GX + glass.ox, yB = C - g.base, rimY = yB - g.H;
            c.strokeStyle = d.foamTop || 'rgba(205,234,255,0.9)';
            c.fillStyle = c.strokeStyle;
            c.lineWidth = 4.4; c.lineCap = 'round';
            drips.forEach(dr => {
                if (dr.len <= 0 || dr.a <= 0) return;
                c.globalAlpha = dr.a;
                c.beginPath();
                const steps = 6;
                let x = 0, y = 0;
                for (let i = 0; i <= steps; i++) {
                    y = rimY + 1 + dr.len * i / steps;
                    const h = clamp(yB - y, 0, g.H);
                    x = cx + dr.side * (hw(g, h) + g.wall * 0.7);
                    if (y > yB && g.kind === 'pilsner') x = cx + dr.side * (hw(g, 0) + g.wall * 0.7);
                    if (i) c.lineTo(x, y); else c.moveTo(x, y);
                }
                c.stroke();
                c.beginPath(); c.arc(x, y + 1.5, 3.6, 0, Math.PI * 2); c.fill();
            });
            c.globalAlpha = 1;
        }

        function drawStream(c) {
            if (!pour.active) return;
            const d = DRINKS[cur().drink];
            const y0 = Math.max(NOZ_Y, pour.tail), y1 = pour.head;
            if (y1 - y0 < 0.5) return;
            const span = Math.max(1, C - NOZ_Y);
            const wAt = y => d.streamW * (1 - 0.3 * clamp((y - NOZ_Y) / span, 0, 1));
            const w0 = wAt(y0), w1 = wAt(y1);
            const x = GX + Math.sin(time * 37) * 0.45;
            c.fillStyle = d.stream;
            c.beginPath();
            c.moveTo(x - w0 / 2, y0); c.lineTo(x + w0 / 2, y0);
            c.lineTo(x + w1 / 2, y1); c.lineTo(x - w1 / 2, y1);
            c.closePath(); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.3)';
            c.fillRect(x - w0 * 0.22, y0, 1.3, y1 - y0);
        }

        function drawDrops(c) {
            if (!drops.length) return;
            c.fillStyle = DRINKS[cur().drink].stream;
            for (let i = 0; i < drops.length; i++) {
                const p = drops[i];
                c.beginPath(); c.arc(p.x, p.y, 1.5, 0, Math.PI * 2); c.fill();
            }
        }

        function drawHandle(c) {
            const d = DRINKS[handle.drink];
            c.save();
            c.translate(GX, PIVOT_Y);
            c.rotate(handle.ang);
            let sx = 1;
            if (handle.flip < 0.3) sx = Math.max(0.06, Math.abs(Math.cos(Math.PI * handle.flip / 0.3)));
            c.scale(sx, 1);
            c.fillStyle = '#2E1710';
            roundRect(c, -3.5, -12, 7, 13, 2); c.fill();
            c.fillStyle = chrome(c, -9, 9);
            roundRect(c, -9, -20, 18, 9, 2); c.fill();
            roundRect(c, -15, -80, 30, 62, 11);
            c.fillStyle = d.handle; c.fill();
            c.strokeStyle = '#2E1710'; c.lineWidth = 2; c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.2)';
            roundRect(c, -11, -74, 5, 50, 2.5); c.fill();
            c.fillStyle = '#F7EEE0';
            roundRect(c, -12.5, -68, 25, 17, 3); c.fill();
            c.fillStyle = '#2E1710';
            c.direction = 'rtl';
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.font = '700 10px ' + F_BODY;
            c.fillText(d.label, 0, -59);
            c.textBaseline = 'alphabetic';
            c.restore();
        }

        function drawRag(c) {
            if (rag.a <= 0.01) return;
            c.save();
            c.globalAlpha = rag.a;
            c.translate(rag.x, C - 3);
            c.rotate(Math.sin(time * 12) * 0.08);
            roundRect(c, -23, -8, 46, 15, 4);
            c.fillStyle = '#F7EEE0'; c.fill();
            c.save(); c.clip();
            c.fillStyle = '#E8873B';
            for (let x = -20; x < 23; x += 9) c.fillRect(x, -8, 3.6, 15);
            c.restore();
            roundRect(c, -23, -8, 46, 15, 4);
            c.strokeStyle = '#2E1710'; c.lineWidth = 1.4; c.stroke();
            c.fillStyle = '#2E1710';
            roundRect(c, -7, -13, 14, 9, 4); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.18)';
            c.fillRect(-0.6, -12, 1.2, 7);
            c.restore();
        }

        function drawSparks(c) {
            for (let i = 0; i < sparks.length; i++) {
                const p = sparks[i];
                const k = p.t / p.life;
                c.globalAlpha = 1 - k * k;
                c.fillStyle = p.c;
                starPath(c, p.x, p.y, p.r * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) * 0.6));
                c.fill();
            }
            c.globalAlpha = 1;
        }

        /* ----- קלט ----- */
        function setPending(v) {
            if (pendingPtr === v) return;
            pendingPtr = v;
            updateHold();
        }
        function onDown(e) {
            if (state === 'intro' || state === 'end') return;
            if (e.target && e.target.closest && e.target.closest('.g-pour-screen')) return;
            if (typeof e.button === 'number' && e.button > 0) return;
            if (e.cancelable) e.preventDefault();
            if (pour.on) return;
            if (state === 'ready') startPour(e.pointerId);
            else if (QUEUE_STATES.indexOf(state) >= 0) setPending(e.pointerId);
        }
        function onUp(e) {
            if (pendingPtr !== null && pendingPtr === e.pointerId) setPending(null);
            if (pour.on && pour.pointer === e.pointerId) release();
        }
        function onBlur() { setPending(null); if (pour.on) release(); }
        function onVis() { if (document.hidden) { setPending(null); if (pour.on) release(); } }
        // רווח או Enter על כפתור של הגיליון (למשל הסגירה) מפעילים את הכפתור, לא את המזיגה
        const dialog = stage.closest ? stage.closest('[role="dialog"]') : null;
        function onHostControl(t) {
            return !!(dialog && t && t !== holdBtn && t.closest && !wrap.contains(t) && dialog.contains(t) &&
                t.closest('button, a[href], input, select, textarea'));
        }
        function onKeyDown(e) {
            if (e.key !== ' ' && e.key !== 'Enter') return;
            if (onHostControl(e.target)) return;
            if (state === 'ready' || state === 'pouring') {
                e.preventDefault();
                if (state === 'ready' && !e.repeat && !pour.on) startPour('key');
            } else if (QUEUE_STATES.indexOf(state) >= 0) {
                e.preventDefault();
                if (!e.repeat) setPending('key');
            }
        }
        function onKeyUp(e) {
            if (e.key !== ' ' && e.key !== 'Enter') return;
            if (pendingPtr === 'key') setPending(null);
            if (pour.on && pour.pointer === 'key') { e.preventDefault(); release(); }
        }
        function onCtx(e) { e.preventDefault(); }
        function onStart(e) { e.preventDefault(); if (state === 'intro') startGame(); }

        wrap.addEventListener('pointerdown', onDown);
        wrap.addEventListener('contextmenu', onCtx);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
        window.addEventListener('blur', onBlur);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        document.addEventListener('visibilitychange', onVis);
        startBtn.addEventListener('click', onStart);

        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(() => { if (!destroyed) layout(); });
            ro.observe(scene);
        } else {
            window.addEventListener('resize', layout);
        }
        layout();
        // לוח הגיר מצויר פעם אחת לשכבה: מציירים שוב כשהפונטים העבריים של העמוד זמינים
        if (document.fonts && document.fonts.load) {
            Promise.all([
                document.fonts.load('700 18px Karantina', 'תפריט'),
                document.fonts.load('400 9px Rubik', 'בירה'),
                document.fonts.load('700 10px Rubik', 'בירה'),
            ]).catch(() => {}).then(() => { if (!destroyed && cssW) buildLayers(); });
        }

        /* ----- לולאה ----- */
        let raf = 0, last = performance.now();
        function frame(now) {
            raf = 0;
            if (destroyed) return;
            let dt = (now - last) / 1000;
            last = now;
            if (dt > 0.05) dt = 0.05;
            if (dt < 0) dt = 0;
            update(dt);
            render();
            if (state !== 'end') raf = requestAnimationFrame(frame);
        }
        wrap.setAttribute('data-state', state);
        raf = requestAnimationFrame(frame);

        return {
            destroy() {
                destroyed = true;
                if (raf) cancelAnimationFrame(raf);
                raf = 0;
                timers.forEach(clearTimeout);
                wrap.removeEventListener('pointerdown', onDown);
                wrap.removeEventListener('contextmenu', onCtx);
                window.removeEventListener('pointerup', onUp);
                window.removeEventListener('pointercancel', onUp);
                window.removeEventListener('blur', onBlur);
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);
                window.removeEventListener('resize', layout);
                document.removeEventListener('visibilitychange', onVis);
                startBtn.removeEventListener('click', onStart);
                if (endEl) endEl.removeEventListener('click', onEndClick);
                if (ro) ro.disconnect();
                if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
            },
        };
    }

    window.PartyiaGames = window.PartyiaGames || {};
    window.PartyiaGames.pour = { title: 'המזיגה המושלמת', mount: mount };
})();
