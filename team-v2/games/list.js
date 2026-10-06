/**
 * list.js: המשחק "רשמו אותי!".
 * קבוצת צ'אט כללית בשם "מתנדבים לערב בפרתיה", ובראשה רשימה נעוצה ריקה של 8 מקומות.
 * טאפ על "רשמו אותי" מכניס את השם לשורה הפנויה הבאה. טאפ על הודעה אחרת עולה שנייה.
 * הסבב נגמר כשהרשימה מלאה, או אחרי 40 שניות.
 *
 * window.PartyiaGames.list = { title, mount(stage, ctx) -> { destroy() } }
 *
 * גרסה לעמוד team-v2: צ'אט בנייר חם בשפה של הלוגו. כל העיצוב כאן, בקידומת g-list-,
 * בלי תלות ב-team/brand.css. מהעמוד נלקחים רק .btn .btn-primary .btn-ghost .btn-block.
 */
(function () {
    'use strict';

    var ID = 'list';
    var P = 'g-list-';
    var ROUND = 40;
    var SLOT_ROLES = ['הקמה', 'הקמה', 'בר', 'בר', 'בר', 'קופה', 'סידור בסוף', 'סידור בסוף'];

    var RSVP_NAMES = ['נועה', 'יוסי', 'מיכל', 'אבי', 'שירה', 'דני', 'תמר', 'עמית', 'הדס', 'אליה',
        'יעל', 'אורן', 'רוני', 'עידו', 'חן', 'אסף', 'מירב', 'ליאת', 'גיל', 'נדב', 'שני', 'איתי',
        'טל', 'שקד', 'הילה', 'עדי', 'ירדן', 'עומר'];
    var RSVP_TEXTS = ['רשמו אותי', 'רשמו אותי!', 'רשמו אותי 🙋', 'רשמו אותי, איפה שצריך',
        'אני בפנים, רשמו אותי', 'גם אותי רשמו', 'רשמו אותי בבקשה'];
    var MORNING_NAMES = ['רותי', 'אילנה', 'שולה', 'דליה', 'ברכה', 'מוטי'];
    var MORNING_CAPTIONS = ['', 'בוקר טוב לכולם', '', 'בוקר אור'];
    var CANT_NAMES = ['אלעד', 'קרן', 'מאיר', 'נוי', 'רועי', 'ענבל'];
    var CANT_TEXTS = ['השבוע לא מסתדר, בפעם הבאה בטוח'];
    var CAT_NAME = 'סיגל';
    var CAT_MSGS = [
        { photo: true, text: 'מישהו ראה חתול כתום?' },
        { photo: false, text: 'עדיין מחפשים את החתול הכתום. עונה לשם מנגו.' },
        { photo: true, text: 'מישהו ראה חתול כתום? (זה לא אותו חתול)' },
    ];
    var VOICE_NAME = 'חיים';
    // צבעי שמות כהים, שנקראים טוב על בועה בהירה
    var NAME_COLORS = ['#B84D14', '#2F7A4F', '#9A6508', '#2C6497', '#B23E6A', '#6B4FA8', '#1F7D74', '#8A4B2A'];

    var ICON = {
        pin: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path fill="currentColor" d="M15.5 2.5l6 6-2.2.9-3.4 3.4.4 4.6-1.6 1.6-4-4-5.3 5.3-1.1-1.1 5.3-5.3-4-4 1.6-1.6 4.6.4 3.4-3.4z"/></svg>',
        clock: '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 9v4.5l2.6 1.6M9.5 2.8h5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
        heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F2545B" d="M12 21.2l-1.5-1.3C5.4 15.3 2 12.3 2 8.5 2 5.4 4.4 3 7.5 3c1.7 0 3.4.8 4.5 2.1C13.1 3.8 14.8 3 16.5 3 19.6 3 22 5.4 22 8.5c0 3.8-3.4 6.8-8.5 11.4L12 21.2z"/></svg>',
        play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13l10.5-6.5z"/></svg>',
        pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>',
        mic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 15a3.5 3.5 0 003.5-3.5v-6a3.5 3.5 0 10-7 0v6A3.5 3.5 0 0012 15zm6-3.5h-1.8a4.2 4.2 0 01-8.4 0H6a6 6 0 005.1 5.9V21h1.8v-3.6A6 6 0 0018 11.5z"/></svg>',
    };

    // נייר: גרעין עדין, וטפט של קבוצה עם ניצוצות מהלוגו
    var GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .35 0 0 0 0 .22 0 0 0 0 .12 0 0 0 .2 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
    var STAR = "M0-10C1.2-2.2 2.2-1.2 10 0 2.2 1.2 1.2 2.2 0 10-1.2 2.2-2.2 1.2-10 0-2.2-1.2-1.2-2.2 0-10Z";
    var WALL = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150'%3E" +
        "%3Cg fill='%232E1710' fill-opacity='.07'%3E" +
        "%3Cpath transform='translate(28 30) scale(.75)' d='" + STAR + "'/%3E" +
        "%3Cpath transform='translate(112 96) scale(.5) rotate(20)' d='" + STAR + "'/%3E" +
        "%3Ccircle cx='86' cy='24' r='2'/%3E%3Ccircle cx='38' cy='116' r='1.7'/%3E%3Ccircle cx='140' cy='138' r='1.5'/%3E%3C/g%3E" +
        "%3Cg fill='%23E8873B' fill-opacity='.28'%3E" +
        "%3Ccircle cx='128' cy='42' r='2.6'/%3E%3Ccircle cx='70' cy='72' r='1.8'/%3E" +
        "%3Cpath transform='translate(54 134) scale(.45) rotate(-15)' d='" + STAR + "'/%3E%3C/g%3E%3C/svg%3E\")";

    var CSS = `
.${P}root,.${P}end{--l-paper:#F4EADB;--l-paper2:#EBDDC7;--l-paper3:#E2D1B6;--l-card:#FFFBF4;--l-ink:#2E1710;--l-ink2:#5E4135;--l-ink3:#6F5345;
  --l-sun:#E8873B;--l-burnt:#C4531A;--l-burnt-text:#9C3F0E;--l-line:rgba(46,23,16,.14);--l-out:#F9DCBC;
  --l-display:'Karantina','Rubik',sans-serif;--l-body:'Rubik','Segoe UI',Tahoma,sans-serif}
.${P}root{position:absolute;inset:0;display:flex;justify-content:center;overflow:hidden;direction:rtl;
  font-family:var(--l-body);color:var(--l-ink);-webkit-touch-callout:none;z-index:0;isolation:isolate;
  background-color:var(--l-paper2);background-image:${WALL};background-size:150px 150px}
.${P}app{position:relative;width:100%;max-width:480px;height:100%;display:flex;flex-direction:column}
@media (min-width:500px){.${P}app{border-left:1.5px solid var(--l-ink);border-right:1.5px solid var(--l-ink)}}

.${P}head{position:relative;z-index:16;display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--l-paper);flex-shrink:0}
.${P}gav{width:42px;height:42px;border-radius:50%;background:var(--l-sun);border:2px solid var(--l-ink);display:grid;place-items:center;overflow:hidden;flex-shrink:0}
.${P}gav svg{width:38px;height:auto;transform:translateY(4px)}
.${P}gtxt{min-width:0;flex:1}
.${P}gtitle{font-size:16px;font-weight:700;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${P}gsub{font-size:12.5px;color:var(--l-ink3);line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${P}gsub.typing{color:var(--l-burnt-text);font-weight:500}
.${P}clock{position:relative;display:flex;align-items:center;gap:5px;height:38px;padding:0 11px 0 10px;border-radius:999px;background:var(--l-card);
  border:2px solid var(--l-ink);box-shadow:0 3px 0 var(--l-ink);direction:ltr;flex-shrink:0;color:var(--l-ink);margin-bottom:3px}
.${P}clock span{font-weight:700;font-size:18px;line-height:1;min-width:38px;text-align:center;font-variant-numeric:tabular-nums}
.${P}clock svg{color:var(--l-burnt);flex-shrink:0}
.${P}plus{position:absolute;top:100%;left:50%;margin-top:8px;direction:rtl;padding:2px 9px;border-radius:999px;background:var(--l-burnt);color:#FFFBF4;
  font-family:var(--l-body);font-size:12.5px;font-weight:700;line-height:1.5;white-space:nowrap;pointer-events:none;z-index:5;opacity:0}
.${P}prog{height:5px;background:var(--l-paper3);flex-shrink:0;overflow:hidden;border-bottom:1.5px solid var(--l-ink);box-sizing:content-box}
.${P}prog i{display:block;height:100%;width:100%;transform-origin:100% 50%;transform:scaleX(0);background:linear-gradient(270deg,var(--l-sun),var(--l-burnt))}

.${P}pin{position:relative;margin:10px 10px 0;padding:9px 12px 10px;border-radius:16px;background:var(--l-card);color:var(--l-ink);
  border:2px solid var(--l-ink);box-shadow:0 4px 0 var(--l-ink);flex-shrink:0;transition:background-color .35s,box-shadow .35s;z-index:15}
.${P}pin.full{background:#FCE4C6;box-shadow:0 4px 0 var(--l-ink),0 0 0 6px rgba(232,135,59,.4)}
.${P}pinh{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;margin-bottom:6px}
.${P}pinh svg{color:var(--l-burnt);flex-shrink:0}
.${P}pint{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.${P}count{margin-inline-start:auto;flex-shrink:0;background:var(--l-ink);color:var(--l-paper);font-size:13.5px;font-weight:700;
  line-height:1.5;padding:1px 10px;border-radius:999px;direction:ltr;display:inline-block;font-variant-numeric:tabular-nums}
.${P}pin.full .${P}count{background:var(--l-sun);color:var(--l-ink);box-shadow:inset 0 0 0 2px var(--l-ink)}
.${P}slots{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,auto);grid-auto-flow:column;column-gap:14px;row-gap:2px}
.${P}slot{display:flex;align-items:center;gap:4px;height:22px;font-size:13.5px;line-height:20px;white-space:nowrap;min-width:0}
.${P}slot .n{color:var(--l-burnt);font-weight:700;min-width:15px}
.${P}slot .r{color:var(--l-ink3);font-weight:400;flex-shrink:0}
.${P}slot .v{position:relative;flex:1;min-width:22px;height:19px;line-height:19px;border-bottom:1.5px dashed rgba(46,23,16,.26);font-weight:700;color:var(--l-ink);overflow:visible}
.${P}slot.next .v{animation:${P}next 1.1s ease-in-out infinite}
.${P}slot.filled .v{border-bottom-color:transparent;animation:none}
.${P}slot .v b{display:inline-block;position:relative;padding:0 3px;margin-inline-start:-3px;border-radius:5px;line-height:20px;font-weight:700;animation:${P}name .5s cubic-bezier(.2,1.6,.4,1) both}
.${P}slot .v b::before{content:'';position:absolute;inset:0;border-radius:5px;background:rgba(232,135,59,.55);animation:${P}glow 1.2s ease-out both;z-index:-1}
@keyframes ${P}next{0%,100%{border-bottom-color:rgba(196,83,26,.22)}50%{border-bottom-color:rgba(196,83,26,.95)}}
@keyframes ${P}name{0%{transform:scale(.2) translateY(6px);opacity:0}100%{transform:none;opacity:1}}
@keyframes ${P}glow{0%{opacity:1}100%{opacity:0}}

.${P}lower{position:relative;flex:1;min-height:0;display:flex;flex-direction:column}
.${P}chat{position:relative;flex:1;min-height:0;overflow:hidden}
.${P}chat::before{content:'';position:absolute;top:0;left:0;right:0;height:22px;background:linear-gradient(var(--l-paper2),rgba(235,221,199,0));z-index:2;pointer-events:none}
.${P}feed{position:absolute;left:0;right:0;bottom:0;padding:0 10px 44px;display:flex;flex-direction:column;align-items:flex-start;gap:7px;will-change:transform}
.${P}day{align-self:center;font-size:12px;font-weight:500;color:var(--l-ink2);background:var(--l-paper);border:1px solid var(--l-line);padding:2px 12px;border-radius:999px;margin:4px 0}

.${P}msg{display:flex;align-items:flex-start;gap:6px;max-width:86%;cursor:pointer;transform-origin:100% 100%}
.${P}msg.out{align-self:flex-end;transform-origin:0 100%;cursor:default}
.${P}msg.k-morning,.${P}msg.k-cant{margin-bottom:9px}
.${P}av{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;color:#FFFBF4;flex-shrink:0;margin-top:2px}
.${P}bub{position:relative;min-width:96px;padding:5px 10px 4px;border-radius:14px;border-start-start-radius:4px;background:var(--l-card);color:var(--l-ink);
  box-shadow:0 1px 0 rgba(46,23,16,.14),0 1px 4px rgba(46,23,16,.05);transition:box-shadow .25s}
.${P}msg.out .${P}bub{background:var(--l-out);border-start-start-radius:14px;border-start-end-radius:4px}
.${P}from{font-size:13px;font-weight:700;line-height:1.35}
.${P}text{font-size:16px;line-height:1.4;overflow-wrap:anywhere}
.${P}text svg{width:15px;height:15px;vertical-align:-2px;margin-inline-start:3px}
.${P}meta{display:flex;justify-content:flex-start;align-items:center;gap:6px;direction:ltr;font-size:11px;color:var(--l-ink3);line-height:1.4;margin-top:1px}
.${P}ok{display:none;color:var(--l-burnt-text);font-weight:700;font-size:12px}
.${P}msg.${P}done .${P}ok{display:inline-block;animation:${P}pop .4s cubic-bezier(.2,1.8,.4,1) both}
.${P}msg.${P}done .${P}bub{box-shadow:inset 0 0 0 2px var(--l-sun),0 1px 0 rgba(46,23,16,.14)}
.${P}quote{display:flex;align-items:center;gap:5px;margin:2px 0 3px;padding:4px 8px;border-radius:8px;background:rgba(46,23,16,.06);
  border-inline-start:3px solid var(--l-sun);font-size:12.5px;color:var(--l-ink2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:230px}
.${P}msg.out .${P}quote{background:rgba(46,23,16,.07)}
.${P}quote span{min-width:0;overflow:hidden;text-overflow:ellipsis}
.${P}quote svg{color:var(--l-burnt);flex-shrink:0;width:12px;height:12px}
.${P}quote b{color:var(--l-burnt-text);font-weight:700;margin-inline-end:4px;flex-shrink:0}
.${P}img{display:block;width:176px;height:106px;border-radius:9px;overflow:hidden;margin:3px 0 2px}
.${P}img svg{display:block;width:100%;height:100%}
.${P}cat{display:block;width:168px;height:104px;border-radius:9px;overflow:hidden;margin:3px 0 3px}
.${P}cat svg{display:block;width:100%;height:100%}
.${P}react{position:absolute;bottom:-14px;right:10px;display:flex;align-items:center;padding:2px 6px;border-radius:999px;background:var(--l-card);
  border:2px solid var(--l-paper2);box-shadow:0 1px 2px rgba(46,23,16,.18);animation:${P}pop .45s cubic-bezier(.2,1.8,.4,1) both}
.${P}react svg{width:14px;height:14px;display:block}

.${P}voice{display:flex;align-items:center;gap:9px;width:206px;padding:4px 0 0}
.${P}play{width:36px;height:36px;border-radius:50%;background:var(--l-sun);color:var(--l-ink);border:2px solid var(--l-ink);display:grid;place-items:center;flex-shrink:0}
.${P}play svg{width:18px;height:18px}
.${P}wbox{flex:1;min-width:0}
.${P}wave{display:block;width:100%;height:26px}
.${P}wave rect{fill:rgba(46,23,16,.24)}
.${P}wave rect.on{fill:var(--l-burnt)}
.${P}vdur{font-size:11.5px;color:var(--l-ink3);direction:ltr;text-align:right;font-variant-numeric:tabular-nums;margin-top:1px}
.${P}vav{position:relative;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:16px;font-weight:700;color:#FFFBF4;flex-shrink:0}
.${P}vav i{position:absolute;bottom:-3px;left:-3px;width:18px;height:18px;border-radius:50%;background:var(--l-card);color:var(--l-burnt);display:grid;place-items:center}
.${P}vav i svg{width:12px;height:12px}

.${P}typing{position:absolute;right:44px;bottom:9px;display:flex;gap:4px;padding:9px 12px;border-radius:14px;border-start-start-radius:4px;background:var(--l-card);
  box-shadow:0 1px 0 rgba(46,23,16,.14);opacity:0;transition:opacity .25s}
.${P}typing.on{opacity:1}
.${P}typing span{width:7px;height:7px;border-radius:50%;background:var(--l-ink3);animation:${P}dot 1s infinite}
.${P}typing span:nth-child(2){animation-delay:.15s}.${P}typing span:nth-child(3){animation-delay:.3s}
@keyframes ${P}dot{0%,60%,100%{transform:none;opacity:.45}30%{transform:translateY(-4px);opacity:1}}

.${P}input{position:relative;height:58px;flex-shrink:0;display:flex;align-items:center;padding:0 12px 0 96px;background:var(--l-paper);border-top:1.5px solid var(--l-ink)}
.${P}field{flex:1;height:40px;border-radius:999px;background:var(--l-card);border:1.5px solid var(--l-line);color:var(--l-ink3);display:flex;align-items:center;padding:0 16px;font-size:15px}
.${P}deer{position:absolute;left:12px;bottom:12px;width:78px;z-index:4;transform-origin:50% 100%;cursor:pointer}
.${P}deer svg{display:block;width:100%;height:auto}

.${P}fx{position:absolute;inset:0;pointer-events:none;z-index:20}
.${P}chip{position:absolute;left:0;top:0;padding:2px 13px;border-radius:999px;background:var(--l-sun);color:var(--l-ink);border:2px solid var(--l-ink);
  font-weight:700;font-size:15px;line-height:1.5;white-space:nowrap;box-shadow:0 3px 0 var(--l-ink);will-change:transform}
.${P}pen{position:absolute;left:0;top:0;padding:2px 11px;border-radius:999px;background:var(--l-burnt);color:#FFFBF4;font-weight:700;font-size:15px;line-height:1.5;
  white-space:nowrap;box-shadow:0 5px 14px rgba(46,23,16,.28);will-change:transform}
.${P}hf{position:absolute;left:0;top:0;width:34px;height:34px;will-change:transform}
.${P}hf svg{width:100%;height:100%;display:block}
.${P}spk{position:absolute;left:0;top:0;will-change:transform}
.${P}spk svg{display:block}

.${P}intro{position:absolute;inset:0;z-index:10;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:10px;
  padding:18px 24px 22px;text-align:center;touch-action:auto;color:var(--l-ink);overflow-y:auto;overscroll-behavior:contain;
  background-color:var(--l-paper);background-image:${GRAIN};background-size:180px 180px;transition:opacity .3s}
.${P}intro>:first-child{margin-top:auto}
.${P}intro>:last-child{margin-bottom:auto}
.${P}intro.hide{opacity:0;pointer-events:none}
.${P}tight .${P}intro .${P}sun{display:none}
.${P}intro h3{margin:4px 0 0;font-family:var(--l-display);font-weight:700;font-size:54px;line-height:.92;letter-spacing:.3px;color:var(--l-ink);text-wrap:balance}
.${P}intro p{margin:0;font-size:17px;line-height:1.5;max-width:320px;color:var(--l-ink2);text-wrap:balance}
.${P}intro .${P}hint{font-size:14.5px;color:var(--l-ink3)}
.${P}intro .btn{width:100%;max-width:320px;min-height:58px;font-size:19px;margin-top:10px}
.${P}up{font-size:13px;font-weight:700;color:var(--l-ink2);display:flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:var(--l-card);border:1.5px solid var(--l-ink)}
.${P}up svg{width:14px;height:14px;color:var(--l-burnt)}

.${P}sun{position:relative;width:104px;height:104px;border-radius:50%;background:var(--l-sun);border:2px solid var(--l-ink);overflow:hidden;flex-shrink:0;display:grid;place-items:center}
.${P}sun .deer{width:92px;height:auto;transform:translateY(9px)}
.${P}intro .${P}sun{animation:${P}bob 2.4s ease-in-out infinite}
.${P}num{font-family:var(--l-body);font-weight:700;font-size:.68em;letter-spacing:0}
@keyframes ${P}bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes ${P}pop{0%{transform:scale(0)}100%{transform:scale(1)}}

/* הצבי ממצמץ */
.${P}root .deer-eye,.${P}end .deer-eye{transform-box:fill-box;transform-origin:center;animation:${P}blink 4.2s infinite}
.${P}root .deer-eye:nth-child(2),.${P}end .deer-eye:nth-child(2){animation-delay:.04s}
@keyframes ${P}blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}

/* מסך סיום */
.${P}end{position:absolute;inset:0;z-index:40;display:flex;flex-direction:column;overflow-y:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;
  direction:rtl;font-family:var(--l-body);color:var(--l-ink);background-color:var(--l-paper);background-image:${GRAIN};background-size:180px 180px}
.${P}endin{margin:auto;width:100%;max-width:370px;display:flex;flex-direction:column;align-items:center;gap:12px;
  padding:22px 22px calc(22px + env(safe-area-inset-bottom));text-align:center;animation:${P}rise .45s cubic-bezier(.2,1.2,.4,1) both}
.${P}end .${P}sun{width:112px;height:112px}
.${P}end .${P}sun .deer{width:100px;transform:translateY(10px)}
.${P}end h3{margin:6px 0 0;font-family:var(--l-display);font-weight:700;font-size:66px;line-height:.88;letter-spacing:.3px;color:var(--l-ink);text-wrap:balance}
.${P}score{font-family:var(--l-display);font-weight:700;font-size:34px;line-height:1;color:var(--l-burnt);letter-spacing:.3px;margin-top:-2px}
.${P}end p{margin:0;text-wrap:pretty}
.${P}end p.${P}line{font-size:16px;line-height:1.6;color:var(--l-ink2)}
.${P}end p.${P}note{width:100%;font-size:14.5px;line-height:1.55;color:var(--l-ink2);background:var(--l-paper2);border:1px solid var(--l-line);border-radius:16px;padding:12px 14px}
.${P}actions{display:flex;flex-direction:column;gap:10px;width:100%;margin-top:4px}
.${P}actions .btn{min-height:54px}
.${P}quiet{align-self:center;min-height:44px;padding:0 12px;background:none;border:none;color:var(--l-ink2);font-family:var(--l-body);font-size:16px;font-weight:500;
  text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1.5px;cursor:pointer;-webkit-tap-highlight-color:transparent}
.${P}quiet:active{color:var(--l-ink)}
@keyframes ${P}rise{0%{transform:translateY(14px) scale(.97);opacity:0}100%{transform:none;opacity:1}}

.${P}compact .${P}head{padding:6px 12px}
.${P}compact .${P}gav{width:36px;height:36px}
.${P}compact .${P}gav svg{width:32px;transform:translateY(3px)}
.${P}compact .${P}clock{height:34px}
.${P}compact .${P}clock span{font-size:17px}
.${P}compact .${P}slot{font-size:12.5px;height:19px}
.${P}compact .${P}pin{padding:6px 12px 7px;margin-top:7px}
.${P}compact .${P}pinh{margin-bottom:4px}
.${P}compact .${P}text{font-size:15px}
.${P}compact .${P}input{height:50px}
.${P}compact .${P}deer{width:66px;bottom:10px}
.${P}compact .${P}intro{gap:7px;padding-top:12px}
.${P}compact .${P}intro .${P}sun{width:78px;height:78px}
.${P}compact .${P}intro .${P}sun .deer{width:70px;transform:translateY(7px)}
.${P}compact .${P}intro h3{font-size:44px}
.${P}compact .${P}intro p{font-size:15.5px}
.${P}compact .${P}intro .${P}hint{font-size:13.5px}
.${P}compact .${P}intro .btn{min-height:52px;margin-top:6px}
.${P}end.${P}compact .${P}endin{gap:9px;padding-top:16px;padding-bottom:16px}
.${P}end.${P}compact .${P}sun{width:80px;height:80px}
.${P}end.${P}compact .${P}sun .deer{width:72px;transform:translateY(7px)}
.${P}end.${P}compact h3{font-size:52px}
.${P}end.${P}compact .${P}score{font-size:29px}
.${P}end.${P}compact p.${P}line{font-size:14.5px;line-height:1.5}
.${P}end.${P}compact p.${P}note{font-size:13.5px;line-height:1.5;padding:9px 12px}
.${P}end.${P}compact .${P}actions{gap:8px}
.${P}end.${P}compact .${P}actions .btn{min-height:48px;font-size:16px}
.${P}end.${P}compact .${P}quiet{min-height:38px;font-size:15px}

@media (prefers-reduced-motion: reduce){
  .${P}intro .${P}sun,.${P}slot.next .v,.${P}typing span,.${P}root .deer-eye,.${P}end .deer-eye,.${P}endin{animation:none}
}
`;

    function injectStyle() {
        if (document.getElementById('g-' + ID + '-style')) return;
        var s = document.createElement('style');
        s.id = 'g-' + ID + '-style';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

    // ב-Karantina הספרה 8 נראית כמו 0, אז ספרות בכותרות גדולות נכתבות ב-Rubik
    function numHTML(t) {
        return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/\d+/g, function (d) { return '<span class="' + P + 'num">' + d + '</span>'; });
    }

    function colorFor(name) {
        var h = 0;
        for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
        return NAME_COLORS[h % NAME_COLORS.length];
    }

    var uid = 0;

    // תמונת "בוקר טוב" עם פרחים, כמו שמגיעות בקבוצות
    function flower(cx, cy, r, petal, center, rot) {
        var s = '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + rot + ')">';
        for (var i = 0; i < 6; i++) {
            s += '<ellipse cx="0" cy="' + (-r * 0.6).toFixed(1) + '" rx="' + (r * 0.4).toFixed(1) + '" ry="' + (r * 0.6).toFixed(1) +
                '" fill="' + petal + '" transform="rotate(' + (i * 60) + ')"/>';
        }
        return s + '<circle r="' + (r * 0.36).toFixed(1) + '" fill="' + center + '"/></g>';
    }

    var MORNING_THEMES = [
        { a: '#ff9fb8', b: '#ffd8a8', p1: '#ff5d8f', p2: '#fff4f7', c: '#ffd23f', stroke: '#c2185b', sub: 'המון אור ושמחה' },
        { a: '#8fd0ff', b: '#fff3b0', p1: '#ffc93c', p2: '#ffb000', c: '#6b3e1e', stroke: '#1f6fb2', sub: 'שיהיה יום מקסים' },
        { a: '#c7b5ff', b: '#ffd0e6', p1: '#9d7bff', p2: '#ffffff', c: '#ffe066', stroke: '#6a3fd1', sub: 'יום נפלא לכולם' },
    ];

    function morningSVG(t) {
        var id = P + 'mg' + (++uid);
        var leaves = '<g fill="#4f9a4a">' +
            '<ellipse cx="22" cy="104" rx="16" ry="6" transform="rotate(-30 22 104)"/>' +
            '<ellipse cx="60" cy="110" rx="15" ry="5" transform="rotate(20 60 110)"/>' +
            '<ellipse cx="146" cy="108" rx="16" ry="6" transform="rotate(-20 146 108)"/>' +
            '<ellipse cx="184" cy="100" rx="15" ry="5" transform="rotate(35 184 100)"/></g>';
        var flowers = flower(14, 92, 16, t.p1, t.c, 10) + flower(44, 106, 13, t.p2, t.c, 30) +
            flower(78, 112, 11, t.p1, t.c, 0) + flower(124, 112, 12, t.p2, t.c, 20) +
            flower(158, 100, 15, t.p1, t.c, 5) + flower(190, 84, 13, t.p2, t.c, 40) +
            flower(186, 16, 9, t.p2, t.c, 10) + flower(12, 18, 8, t.p1, t.c, 25);
        return '<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + t.a + '"/><stop offset="1" stop-color="' + t.b + '"/></linearGradient></defs>' +
            '<rect width="200" height="120" fill="url(#' + id + ')"/>' +
            '<circle cx="100" cy="64" r="44" fill="#fff" opacity=".22"/>' +
            leaves + flowers +
            '<text x="100" y="52" text-anchor="middle" direction="rtl" font-family="Rubik, sans-serif" font-weight="700" font-size="33" fill="#fff" stroke="' + t.stroke + '" stroke-width="5" stroke-linejoin="round" paint-order="stroke">בוקר טוב</text>' +
            '<text x="100" y="74" text-anchor="middle" direction="rtl" font-family="Rubik, sans-serif" font-weight="700" font-size="12.5" fill="' + t.stroke + '">' + t.sub + '</text>' +
            '<path transform="translate(150 30) scale(.7)" d="M0 -10 C 1.2 -2.2, 2.2 -1.2, 10 0 C 2.2 1.2, 1.2 2.2, 0 10 C -1.2 2.2, -2.2 1.2, -10 0 C -2.2 -1.2, -1.2 -2.2, 0 -10 Z" fill="#fff"/>' +
            '<path transform="translate(48 30) scale(.5)" d="M0 -10 C 1.2 -2.2, 2.2 -1.2, 10 0 C 2.2 1.2, 1.2 2.2, 0 10 C -1.2 2.2, -2.2 1.2, -10 0 C -2.2 -1.2, -1.2 -2.2, 0 -10 Z" fill="#fff"/>' +
            '</svg>';
    }

    // "תמונה" של החתול הכתום: רחוק, על גדר, בשעת ערב
    function catSVG() {
        var id = P + 'cg' + (++uid);
        return '<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
            '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb3c8"/><stop offset="1" stop-color="#e9d9c0"/></linearGradient></defs>' +
            '<rect width="160" height="100" fill="url(#' + id + ')"/>' +
            '<circle cx="22" cy="58" r="20" fill="#5f8a55"/><circle cx="44" cy="62" r="16" fill="#6e9a62"/><circle cx="8" cy="66" r="14" fill="#557d4c"/>' +
            '<rect x="0" y="70" width="160" height="30" fill="#c9b28f"/>' +
            '<g stroke="#b39c78" stroke-width="1.5"><path d="M0 80H160M0 90H160M30 70V80M70 70V80M110 70V80M150 70V80M50 80V90M90 80V90M130 80V90M10 80V90"/></g>' +
            '<g transform="translate(112 52)">' +
            '<path d="M10 16 C 22 16, 22 4, 16 2" fill="none" stroke="#e07a1f" stroke-width="3.2" stroke-linecap="round"/>' +
            '<ellipse cx="0" cy="11" rx="9" ry="8" fill="#ef8a2a"/>' +
            '<circle cx="-5" cy="1" r="5.6" fill="#ef8a2a"/>' +
            '<path d="M-10 -2 L-9.5 -9 L-5.5 -4 Z M-4 -4 L-1 -9.5 L0 -2 Z" fill="#ef8a2a"/>' +
            '<path d="M-3 8 h6 M-2 12 h7" stroke="#c96513" stroke-width="1.4" stroke-linecap="round"/>' +
            '</g>' +
            '<rect width="160" height="100" fill="#fff" opacity=".06"/>' +
            '</svg>';
    }

    function waveSVG() {
        var s = '<svg class="' + P + 'wave" viewBox="0 0 120 26" preserveAspectRatio="none" aria-hidden="true">';
        var seed = 7;
        for (var i = 0; i < 30; i++) {
            seed = (seed * 9301 + 49297) % 233280;
            var h = 5 + Math.round((seed / 233280) * 18 * (0.55 + 0.45 * Math.sin(i * 0.7) * Math.sin(i * 0.7)));
            // הבר הימני ביותר (i=29) הוא הראשון שמתנגן, כי הנגן מימין
            s += '<rect data-i="' + (29 - i) + '" x="' + (i * 4 + 0.6) + '" y="' + ((26 - h) / 2) + '" width="2.6" height="' + h + '" rx="1.3"/>';
        }
        return s + '</svg>';
    }

    function mount(stage, ctx) {
        injectStyle();
        var Deer = (ctx && ctx.Deer) || window.Deer;
        var dead = false;
        var raf = 0, lastNow = 0;
        var timers = [];
        var listeners = [];
        var ro = null;
        var endEl = null;
        var shiftAnim = null;
        var shiftFrom = 0, shiftAt = -1e9;
        var deerRevert = 0;
        var typingTimer = 0;

        var S = {
            phase: 'intro', t: 0, pen: 0, reserved: 0, filled: 0, hearts: 0, voiceSec: 0, catTaps: 0,
            idx: 0, nextAt: 0.3, voiceDone: false, lastD: '', catI: 0, final: 0,
            minute: 20 * 60 + 31, shownSec: -1, nameIdx: 0,
        };

        function on(el, type, fn, opt) { el.addEventListener(type, fn, opt); listeners.push([el, type, fn, opt]); }
        function later(fn, ms) {
            var id = setTimeout(function () {
                var k = timers.indexOf(id);
                if (k >= 0) timers.splice(k, 1);
                if (!dead) fn();
            }, ms);
            timers.push(id);
            return id;
        }
        function cancel(id) { clearTimeout(id); var k = timers.indexOf(id); if (k >= 0) timers.splice(k, 1); }
        function q(sel, root) { return (root || app).querySelector(sel); }

        // ===== מבנה =====
        var root = document.createElement('div');
        root.className = P + 'root';
        var slotsHTML = '';
        for (var i = 0; i < 8; i++) {
            slotsHTML += '<div class="' + P + 'slot' + (i === 0 ? ' next' : '') + '" data-i="' + i + '"><span class="n">' + (i + 1) +
                '.</span><span class="r">' + SLOT_ROLES[i] + ':</span><span class="v"></span></div>';
        }
        root.innerHTML =
            '<div class="' + P + 'app">' +
            '<div class="' + P + 'head">' +
            '<div class="' + P + 'gav">' + Deer.svg({ mood: 'happy', title: 'תמונת הקבוצה' }) + '</div>' +
            '<div class="' + P + 'gtxt"><div class="' + P + 'gtitle">מתנדבים לערב בפרתיה</div><div class="' + P + 'gsub">48 משתתפים</div></div>' +
            '<div class="' + P + 'clock" aria-label="זמן">' + ICON.clock + '<span>0:00</span></div>' +
            '</div>' +
            '<div class="' + P + 'prog"><i></i></div>' +
            '<div class="' + P + 'pin">' +
            '<div class="' + P + 'pinh">' + ICON.pin + '<span class="' + P + 'pint">ערב בפרתיה: רשימת מתנדבים</span><span class="' + P + 'count">0/8</span></div>' +
            '<div class="' + P + 'slots">' + slotsHTML + '</div>' +
            '</div>' +
            '<div class="' + P + 'lower">' +
            '<div class="' + P + 'chat"><div class="' + P + 'feed"></div>' +
            '<div class="' + P + 'typing" aria-hidden="true"><span></span><span></span><span></span></div></div>' +
            '<div class="' + P + 'input"><div class="' + P + 'field">הודעה</div></div>' +
            '<div class="' + P + 'deer" aria-hidden="true"></div>' +
            '<div class="' + P + 'intro">' +
            '<div class="' + P + 'up"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 4l7 8h-4.5v8h-5v-8H5z"/></svg>הרשימה למעלה, ריקה</div>' +
            '<div class="' + P + 'sun">' + Deer.svg({ mood: 'happy' }) + '</div>' +
            '<h3><span class="' + P + 'num">8</span> מקומות. קבוצה אחת.</h3>' +
            '<p>לוחצים על כל "רשמו אותי" עד שהרשימה מלאה.</p>' +
            '<p class="' + P + 'hint">כל הודעה אחרת עולה שנייה. גם בוקר טוב.</p>' +
            '<button class="btn btn-primary ' + P + 'go" type="button">מתחילים</button>' +
            '</div>' +
            '</div>' +
            '<div class="' + P + 'fx"></div>' +
            '</div>';
        stage.appendChild(root);

        var app = q('.' + P + 'app', root);
        var feed = q('.' + P + 'feed');
        var chat = q('.' + P + 'chat');
        var typing = q('.' + P + 'typing');
        var fx = q('.' + P + 'fx');
        var deerEl = q('.' + P + 'deer');
        var clockEl = q('.' + P + 'clock');
        var clockTxt = clockEl.querySelector('span');
        var progEl = q('.' + P + 'prog i');
        var pinEl = q('.' + P + 'pin');
        var countEl = q('.' + P + 'count');
        var pinTitle = q('.' + P + 'pint');
        var subEl = q('.' + P + 'gsub');
        var intro = q('.' + P + 'intro');
        var slots = Array.prototype.slice.call(app.querySelectorAll('.' + P + 'slot'));

        deerEl.innerHTML = Deer.svg({ mood: 'happy' });

        // הודעות פתיחה: יום, וההודעה שלכם לקבוצה
        function dayChip(t) {
            var d = document.createElement('div');
            d.className = P + 'day';
            d.textContent = t;
            feed.appendChild(d);
        }
        dayChip('אתמול');
        S.minute = 7 * 60 + 12;
        feed.appendChild(msgShell('morning', 'רותי', '<div class="' + P + 'img">' + morningSVG(MORNING_THEMES[0]) + '</div>'));
        S.minute = 18 * 60 + 47;
        feed.appendChild(msgShell('chat', 'דליה', '<div class="' + P + 'text">מתי הערב הבא בפרתיה?</div>'));
        dayChip('היום');
        S.minute = 20 * 60 + 30;
        feed.appendChild(outMsg('<div class="' + P + 'text">ערב בפרתיה בשבוע הבא! מחפשים 8 מתנדבים. הרשימה נעוצה למעלה, מי בא?</div>'));

        // ===== גודל =====
        function fit() {
            var compact = stage.clientHeight < 640;
            root.classList.toggle(P + 'compact', compact);
            if (endEl) endEl.classList.toggle(P + 'compact', compact);
            // מסך נמוך מאוד (טלפון קטן או לרוחב): אם מסך הפתיחה לא נכנס, מוותרים על הצבי שבו, והשאר נגלל
            if (S.phase === 'intro') {
                root.classList.remove(P + 'tight');
                if (intro.scrollHeight > intro.clientHeight + 1) root.classList.add(P + 'tight');
            }
        }
        fit();
        if (window.ResizeObserver) { ro = new ResizeObserver(fit); ro.observe(stage); }
        on(window, 'resize', fit);

        // ===== עזרים =====
        function tick() {
            if (Math.random() < 0.3) S.minute++;
            var h = Math.floor(S.minute / 60) % 24, m = S.minute % 60;
            return h + ':' + (m < 10 ? '0' : '') + m;
        }

        function rel(el) {
            var a = app.getBoundingClientRect(), r = el.getBoundingClientRect();
            return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height, cx: r.left - a.left + r.width / 2, cy: r.top - a.top + r.height / 2 };
        }
        function pointIn(e) {
            var a = app.getBoundingClientRect();
            return { x: e.clientX - a.left, y: e.clientY - a.top };
        }

        function anim(el, frames, opts) {
            if (!el.animate) return null;
            return el.animate(frames, opts);
        }

        function bump(el) {
            anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 220, easing: 'ease-out' });
        }

        function wiggle(el) {
            anim(el, [
                { transform: 'translateX(0)' }, { transform: 'translateX(-7px) rotate(-1.5deg)' }, { transform: 'translateX(6px) rotate(1deg)' },
                { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'translateX(0)' },
            ], { duration: 380, easing: 'ease-out' });
        }

        function sparkles(x, y, n, spread, big) {
            var cols = ['#E8873B', '#C4531A', '#F2B33D', '#E8873B'];
            for (var i = 0; i < n; i++) {
                var el = document.createElement('div');
                el.className = P + 'spk';
                var size = (big ? 12 : 9) + Math.random() * (big ? 12 : 8);
                el.innerHTML = Deer.sparkle(Math.round(size), rnd(cols));
                fx.appendChild(el);
                var a = (Math.PI * 2 * i) / n + Math.random() * 0.6;
                var d = spread * (0.6 + Math.random() * 0.6);
                var x0 = x - size / 2, y0 = y - size / 2;
                var p = anim(el, [
                    { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.2) rotate(0deg)', opacity: 1 },
                    { transform: 'translate(' + (x0 + Math.cos(a) * d) + 'px,' + (y0 + Math.sin(a) * d) + 'px) scale(1.1) rotate(90deg)', opacity: 1, offset: 0.6 },
                    { transform: 'translate(' + (x0 + Math.cos(a) * d * 1.15) + 'px,' + (y0 + Math.sin(a) * d * 1.15 + 8) + 'px) scale(.4) rotate(140deg)', opacity: 0 },
                ], { duration: 650 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
                if (p) p.onfinish = (function (e) { return function () { e.remove(); }; })(el);
                else el.remove();
            }
        }

        function floatText(html, x, y, cls) {
            var el = document.createElement('div');
            el.className = P + cls;
            el.innerHTML = html;
            fx.appendChild(el);
            var w = el.offsetWidth, h = el.offsetHeight;
            var x0 = Math.max(6, Math.min(app.clientWidth - w - 6, x - w / 2)), y0 = y - h / 2;
            var p = anim(el, [
                { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.6)', opacity: 0 },
                { transform: 'translate(' + x0 + 'px,' + (y0 - 18) + 'px) scale(1.1)', opacity: 1, offset: 0.25 },
                { transform: 'translate(' + x0 + 'px,' + (y0 - 56) + 'px) scale(1)', opacity: 0 },
            ], { duration: 900, easing: 'ease-out', fill: 'forwards' });
            if (p) p.onfinish = function () { el.remove(); };
            else el.remove();
        }

        function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* לא נתמך */ } }

        // ===== הצבי =====
        function deerMood(mood, ms) {
            deerEl.innerHTML = Deer.svg({ mood: mood });
            if (deerRevert) cancel(deerRevert);
            deerRevert = ms ? later(function () { deerRevert = 0; deerEl.innerHTML = Deer.svg({ mood: 'happy' }); }, ms) : 0;
        }
        function deerJump(h) {
            h = h || 20;
            anim(deerEl, [
                { transform: 'translateY(0) scale(1)' },
                { transform: 'translateY(4px) scale(1.06,.92)', offset: 0.15 },
                { transform: 'translateY(-' + h + 'px) scale(.96,1.06) rotate(-5deg)', offset: 0.45 },
                { transform: 'translateY(0) scale(1.05,.94)', offset: 0.78 },
                { transform: 'translateY(0) scale(1)' },
            ], { duration: 560, easing: 'ease-out' });
        }
        function deerCheer() {
            deerMood('happy', 0);
            deerJump(22);
            var r = rel(deerEl);
            sparkles(r.cx, r.y + 10, 4, 34, false);
        }
        on(deerEl, 'pointerdown', function () {
            if (S.phase === 'intro') return;
            deerMood('wink', 600);
            deerJump(12);
        });

        // ===== הודעות =====
        function msgShell(kind, name, inner, extraMeta) {
            var col = colorFor(name);
            var el = document.createElement('div');
            el.className = P + 'msg in k-' + kind;
            el.setAttribute('data-k', kind);
            el.setAttribute('data-name', name);
            el.innerHTML = '<div class="' + P + 'av" style="background:' + col + '">' + name.charAt(0) + '</div>' +
                '<div class="' + P + 'bub"><div class="' + P + 'from" style="color:' + col + '">' + name + '</div>' + inner +
                '<div class="' + P + 'meta"><span>' + tick() + '</span>' + (extraMeta || '') + '</div></div>';
            return el;
        }

        function outMsg(inner) {
            var el = document.createElement('div');
            el.className = P + 'msg out';
            el.innerHTML = '<div class="' + P + 'bub">' + inner + '<div class="' + P + 'meta"><span>' + tick() + '</span></div></div>';
            return el;
        }

        function pickName() {
            // שם שעוד לא ברשימה ולא מחכה כרגע בצ'אט
            var busy = {};
            slots.forEach(function (s) { if (s.getAttribute('data-name')) busy[s.getAttribute('data-name')] = 1; });
            Array.prototype.forEach.call(feed.querySelectorAll('.k-rsvp:not(.' + P + 'done)'), function (m) { busy[m.getAttribute('data-name')] = 1; });
            for (var k = 0; k < RSVP_NAMES.length; k++) {
                var n = RSVP_NAMES[(S.nameIdx + k) % RSVP_NAMES.length];
                if (!busy[n]) { S.nameIdx = (S.nameIdx + k + 1) % RSVP_NAMES.length; return n; }
            }
            return rnd(RSVP_NAMES);
        }

        function buildMsg(kind) {
            if (kind === 'rsvp') {
                var quote = Math.random() < 0.3
                    ? '<div class="' + P + 'quote">' + ICON.pin + '<span>ערב בפרתיה: רשימת מתנדבים</span></div>' : '';
                return msgShell('rsvp', pickName(), quote + '<div class="' + P + 'text">' + rnd(RSVP_TEXTS) + '</div>',
                    '<span class="' + P + 'ok" dir="rtl">✓ ברשימה</span>');
            }
            if (kind === 'morning') {
                var cap = rnd(MORNING_CAPTIONS);
                return msgShell('morning', rnd(MORNING_NAMES), '<div class="' + P + 'img">' + morningSVG(rnd(MORNING_THEMES)) + '</div>' +
                    (cap ? '<div class="' + P + 'text">' + cap + '</div>' : ''));
            }
            if (kind === 'cat') {
                var c = CAT_MSGS[S.catI++ % CAT_MSGS.length];
                return msgShell('cat', CAT_NAME, (c.photo ? '<div class="' + P + 'cat">' + catSVG() + '</div>' : '') +
                    '<div class="' + P + 'text">' + c.text + '</div>');
            }
            if (kind === 'cant') {
                return msgShell('cant', rnd(CANT_NAMES), '<div class="' + P + 'text">' + rnd(CANT_TEXTS) + '</div>');
            }
            // הודעה קולית של 4:37
            var vc = colorFor(VOICE_NAME);
            return msgShell('voice', VOICE_NAME,
                '<div class="' + P + 'voice"><span class="' + P + 'play">' + ICON.play + '</span>' +
                '<div class="' + P + 'wbox">' + waveSVG() + '<div class="' + P + 'vdur">4:37</div></div>' +
                '<span class="' + P + 'vav" style="background:' + vc + '">' + VOICE_NAME.charAt(0) + '<i>' + ICON.mic + '</i></span></div>');
        }

        function currentShift() {
            if (!shiftAnim || shiftAnim.playState !== 'running') return 0;
            var t = getComputedStyle(feed).transform;
            var m = t && t.match(/matrix\(([^)]+)\)/);
            return m ? parseFloat(m[1].split(',')[5]) || 0 : 0;
        }

        function addMessage(el) {
            var before = feed.offsetHeight;
            feed.appendChild(el);
            var h = feed.offsetHeight - before;
            var cur = currentShift();
            if (shiftAnim) shiftAnim.cancel();
            // נשמר בשביל טאפ סלחני: איפה התוכן היה רגע לפני שהצ'אט זז
            shiftFrom = cur + h;
            shiftAt = performance.now();
            shiftAnim = anim(feed, [{ transform: 'translateY(' + (cur + h) + 'px)' }, { transform: 'translateY(0)' }],
                { duration: 280, easing: 'cubic-bezier(.2,.85,.3,1)' });
            anim(el, [
                { opacity: 0, transform: 'scale(.8)' },
                { opacity: 1, transform: 'scale(1.03)', offset: 0.7 },
                { opacity: 1, transform: 'scale(1)' },
            ], { duration: 300, easing: 'ease-out' });
            while (feed.children.length > 18) feed.removeChild(feed.firstChild);
        }

        // תמהיל קבוע: בכל שבע הודעות יש שלוש "רשמו אותי", בסדר אקראי
        var bag = [];
        function shuffle(a) {
            for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[j]; a[j] = x; }
            return a;
        }
        function pickKind() {
            if (!bag.length) {
                if (S.idx === 0) bag = ['r'].concat(shuffle(['r', 'r', 'd', 'd', 'd', 'd']));
                else bag = shuffle(['r', 'r', 'r', 'd', 'd', 'd', 'd']);
            }
            if (bag.shift() === 'r') return 'rsvp';
            if (!S.voiceDone && S.idx >= 5) { S.voiceDone = true; return 'voice'; }
            var r = Math.random();
            var k = r < 0.45 ? 'morning' : (r < 0.73 ? 'cant' : 'cat');
            if (k === S.lastD) k = k === 'morning' ? 'cant' : 'morning';
            return k;
        }

        function spawn() {
            var kind = pickKind();
            S.idx++;
            if (kind !== 'rsvp') S.lastD = kind;
            var gap = 0.74 + Math.random() * 0.26 - Math.min(0.1, S.t * 0.005);
            if (kind === 'morning' || kind === 'cat') gap += 0.12;
            S.nextAt = S.t + gap;
            addMessage(buildMsg(kind));
        }

        // ===== רשימה =====
        function setNext(i) {
            slots.forEach(function (s, k) { s.classList.toggle('next', k === i); });
        }

        function fillSlot(i, name) {
            var s = slots[i];
            s.classList.add('filled');
            s.querySelector('.v').innerHTML = '<b>' + name + '</b>';
            S.filled++;
            countEl.textContent = S.filled + '/8';
            anim(countEl, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.2,1.6,.4,1)' });
            var r = rel(s.querySelector('.v b'));
            sparkles(r.cx, r.cy, 6, 26, false);
        }

        function flyName(name, fromEl, slotIdx) {
            var chip = document.createElement('div');
            chip.className = P + 'chip';
            chip.textContent = name;
            fx.appendChild(chip);
            var w = chip.offsetWidth, h = chip.offsetHeight;
            var a = rel(fromEl);
            var v = rel(slots[slotIdx].querySelector('.v'));
            var x0 = a.x + a.w - w, y0 = a.cy - h / 2;
            var x1 = v.x + v.w - w * 0.85 - 2, y1 = v.cy - h / 2;
            var xm = (x0 + x1) / 2 + 30, ym = Math.min(y0, y1) - 26;
            var done = false;
            function land() {
                if (done || dead) return;
                done = true;
                chip.remove();
                fillSlot(slotIdx, name);
            }
            var p = anim(chip, [
                { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.7)', opacity: 0.4 },
                { transform: 'translate(' + x0 + 'px,' + (y0 - 8) + 'px) scale(1.15)', opacity: 1, offset: 0.15 },
                { transform: 'translate(' + xm + 'px,' + ym + 'px) scale(1.1)', offset: 0.55 },
                { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.85)', opacity: 1 },
            ], { duration: 460, easing: 'cubic-bezier(.45,.05,.35,1)', fill: 'forwards' });
            if (p) p.onfinish = land;
            later(land, 520);
        }

        // ===== שעון =====
        function setClock(el) {
            var sec = Math.min(ROUND, Math.floor(el));
            progEl.style.transform = 'scaleX(' + Math.min(1, el / ROUND).toFixed(4) + ')';
            if (sec === S.shownSec) return;
            S.shownSec = sec;
            clockTxt.textContent = '0:' + (sec < 10 ? '0' : '') + sec;
        }

        function penalty(e, quiet) {
            S.pen += 1;
            if (!quiet) {
                var pt = pointIn(e);
                floatText('<span dir="ltr">+1</span> שנייה', pt.x, pt.y - 20, 'pen');
            }
            anim(clockEl, [
                { transform: 'scale(1)', background: '#FFFBF4' },
                { transform: 'scale(1.14)', background: '#E8873B' },
                { transform: 'scale(1)', background: '#FFFBF4' },
            ], { duration: 420, easing: 'ease-out' });
            var b = document.createElement('span');
            b.className = P + 'plus';
            b.innerHTML = '<span dir="ltr">+1</span> שנייה';
            clockEl.appendChild(b);
            var p = anim(b, [
                { transform: 'translate(-50%,-6px) scale(.5)', opacity: 0 },
                { transform: 'translate(-50%,2px) scale(1.1)', opacity: 1, offset: 0.2 },
                { transform: 'translate(-50%,4px) scale(1)', opacity: 1, offset: 0.7 },
                { transform: 'translate(-50%,10px) scale(1)', opacity: 0 },
            ], { duration: 1000, easing: 'ease-out', fill: 'forwards' });
            if (p) p.onfinish = function () { b.remove(); };
            else b.remove();
        }

        function setTyping() {
            if (S.phase !== 'play') { subEl.textContent = '48 משתתפים'; subEl.classList.remove('typing'); return; }
            var a = rnd(RSVP_NAMES.concat(MORNING_NAMES)), b = rnd(RSVP_NAMES);
            if (a === b) b = rnd(CANT_NAMES);
            subEl.textContent = a + ' ו' + b + ' מקלידים…';
            subEl.classList.add('typing');
            typingTimer = later(setTyping, 1700 + Math.random() * 900);
        }

        // ===== טאפים =====
        function msgFrom(node) {
            var m = node && node.closest ? node.closest('.' + P + 'msg') : null;
            return m && feed.contains(m) && !m.classList.contains('out') ? m : null;
        }
        function openRsvp(m) { return !!m && m.getAttribute('data-k') === 'rsvp' && !m.classList.contains(P + 'done'); }

        // הצ'אט זז כשמגיעה הודעה, והאצבע נוחתת איפה שההודעה הייתה רגע קודם (זמן תגובה של יד).
        // לכן בודקים מה היה מתחת לאצבע בערך LAG מילישניות לפני הטאפ, ומעדיפים "רשמו אותי" פתוח.
        var SHIFT_MS = 280, LAG = 200;
        function shiftEase(t) {
            // cubic-bezier(.2,.85,.3,1), אותה עקומה של תזוזת הצ'אט
            var lo = 0, hi = 1, s = t;
            for (var i = 0; i < 14; i++) {
                s = (lo + hi) / 2;
                var x = 3 * (1 - s) * (1 - s) * s * 0.2 + 3 * (1 - s) * s * s * 0.3 + s * s * s;
                if (x < t) lo = s; else hi = s;
            }
            return 3 * (1 - s) * (1 - s) * s * 0.85 + 3 * (1 - s) * s * s + s * s * s;
        }
        function offsetAt(ms) {
            if (ms <= 0) return shiftFrom;
            if (ms >= SHIFT_MS) return 0;
            return shiftFrom * (1 - shiftEase(ms / SHIFT_MS));
        }
        function resolveTap(e) {
            var actual = msgFrom(e.target);
            if (openRsvp(actual)) return actual;
            var since = performance.now() - shiftAt;
            if (since > SHIFT_MS + LAG) return actual;
            var nowOff = currentShift();
            var top = chat.getBoundingClientRect().top;
            function at(off) {
                var d = off - nowOff;
                if (d < 6) return actual;
                var y = e.clientY - d;
                return y > top ? msgFrom(document.elementFromPoint(e.clientX, y)) : null;
            }
            var aimed = at(offsetAt(since - LAG));
            if (openRsvp(aimed)) return aimed;
            var early = at(shiftFrom);
            if (openRsvp(early)) return early;
            // אחרת: ההודעה שהייתה מתחת לאצבע כשהחלטתם ללחוץ. הודעה שרק החליקה לשם לא עולה שנייה.
            return aimed;
        }

        function onFeedDown(e) {
            if (S.phase !== 'play') return;
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            var m = resolveTap(e);
            if (!m) return;
            var k = m.getAttribute('data-k');
            var bub = m.querySelector('.' + P + 'bub');
            if (k === 'rsvp') {
                if (m.classList.contains(P + 'done') || S.reserved >= 8) { bump(bub); return; }
                var slot = S.reserved++;
                slots[slot].setAttribute('data-name', m.getAttribute('data-name'));
                m.classList.add(P + 'done');
                anim(bub, [{ transform: 'scale(1)' }, { transform: 'scale(.92)', offset: 0.3 }, { transform: 'scale(1.06)', offset: 0.65 }, { transform: 'scale(1)' }],
                    { duration: 340, easing: 'ease-out' });
                buzz(12);
                flyName(m.getAttribute('data-name'), m.querySelector('.' + P + 'from'), slot);
                later(deerCheer, 380);
                setNext(S.reserved < 8 ? S.reserved : -1);
                if (S.reserved >= 8) finishFull();
                return;
            }
            var pt = pointIn(e);
            if (k === 'morning' || k === 'cant') {
                if (m.classList.contains('hearted')) { bump(bub); return; }
                m.classList.add('hearted');
                var rc = document.createElement('div');
                rc.className = P + 'react';
                rc.innerHTML = ICON.heart;
                bub.appendChild(rc);
                floatText(ICON.heart, pt.x, pt.y - 10, 'hf');
                bump(bub);
                penalty(e, true);
                deerMood('wink', 700);
                if (k === 'morning') S.hearts++;
                else {
                    var who = m.getAttribute('data-name');
                    later(function () {
                        if (S.phase !== 'play') return;
                        addMessage(outMsg('<div class="' + P + 'quote"><b>' + who + '</b><span>השבוע לא מסתדר, בפעם הבאה בטוח</span></div>' +
                            '<div class="' + P + 'text">גם זה מעולה' + ICON.heart + '</div>'));
                    }, 420);
                }
                return;
            }
            if (k === 'cat' || k === 'chat') {
                if (k === 'cat') S.catTaps++;
                wiggle(bub);
                penalty(e);
                deerMood('neutral', 800);
                return;
            }
            if (k === 'voice') {
                if (m.classList.contains('playing')) return;
                m.classList.add('playing');
                S.voiceSec++;
                var play = m.querySelector('.' + P + 'play');
                var dur = m.querySelector('.' + P + 'vdur');
                var sec = S.voiceSec;
                play.innerHTML = ICON.pause;
                bump(play);
                dur.textContent = '0:00';
                var bars = m.querySelectorAll('rect');
                var first = null;
                for (var b = 0; b < bars.length; b++) if (bars[b].getAttribute('data-i') === '0') first = bars[b];
                penalty(e);
                deerMood('closed', 1100);
                later(function () {
                    if (first) first.classList.add('on');
                    dur.textContent = '0:' + (sec < 10 ? '0' : '') + sec;
                    play.innerHTML = ICON.play;
                    m.classList.remove('playing');
                }, 1000);
            }
        }
        on(chat, 'pointerdown', onFeedDown);

        // ===== לולאה =====
        function frame(now) {
            // הלולאה רצה רק בזמן משחק, ונעצרת לבד כשהסבב נגמר
            if (dead || S.phase !== 'play') { raf = 0; return; }
            raf = requestAnimationFrame(frame);
            var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
            lastNow = now;
            S.t += dt;
            while (S.t >= S.nextAt && S.phase === 'play') spawn();
            var el = S.t + S.pen;
            setClock(el);
            if (el >= ROUND) timeUp();
        }

        function start() {
            if (S.phase !== 'intro') return;
            S.phase = 'play';
            intro.classList.add('hide');
            later(function () { intro.style.display = 'none'; }, 320);
            typing.classList.add('on');
            setTyping();
            deerJump(10);
            lastNow = 0;
            raf = requestAnimationFrame(frame);
        }
        on(q('.' + P + 'go'), 'click', start);

        function stopPlay() {
            typing.classList.remove('on');
            if (typingTimer) cancel(typingTimer);
            subEl.textContent = '48 משתתפים';
            subEl.classList.remove('typing');
        }

        function finishFull() {
            S.phase = 'ending';
            S.final = Math.min(ROUND, S.t + S.pen);
            setClock(S.final);
            stopPlay();
            later(function () {
                pinEl.classList.add('full');
                pinTitle.textContent = 'ערב בפרתיה: הרשימה מלאה';
                var r = rel(pinEl);
                sparkles(r.cx, r.cy, 14, Math.min(170, r.w / 2), true);
                deerMood('happy', 0);
                deerJump(30);
                later(function () { deerJump(18); }, 600);
                addMessage(outMsg('<div class="' + P + 'text">הרשימה מלאה, תודה לכולם!' + ICON.heart + '</div>'));
                buzz(30);
            }, 560);
            later(showEnd, 2100);
        }

        function timeUp() {
            S.phase = 'ending';
            S.final = ROUND;
            setClock(ROUND);
            stopPlay();
            deerMood('wink', 0);
            deerJump(14);
            later(showEnd, 1000);
        }

        // ===== מסך סיום =====
        function showEnd() {
            if (dead || endEl) return;
            S.phase = 'end';
            var full = S.filled >= 8 || S.reserved >= 8;
            var n = full ? 8 : S.filled;
            var s = Math.max(1, Math.floor(S.final));
            var title, score, share;
            if (full) {
                title = 'הרשימה מלאה!';
                score = '8 מתוך 8, תוך ' + s + ' שניות.';
                share = 'מילאתי רשימת מתנדבים תוך ' + s + ' שניות במשחק של הפרתיה.';
            } else {
                title = n >= 6 ? 'כמעט מלאה!' : (n > 0 ? 'הרשימה בדרך!' : 'הרשימה מחכה!');
                score = n > 0 ? n + ' מתוך 8, תוך 40 שניות.' : '40 שניות של קריאה בקבוצה.';
                share = n > 0 ? 'מילאתי ' + n + ' מתוך 8 ברשימת מתנדבים במשחק של הפרתיה.' : 'ניסיתי למלא רשימת מתנדבים במשחק של הפרתיה.';
            }
            // התוצאה מוצגת בנפרד, בגדול, והשאר מתחתיה. הטקסט עצמו לא השתנה.
            var line = 'הודעות בוקר טוב שקיבלו מכם לב בדרך: ' + S.hearts + '.';
            // רווח קשיח בין "של" ל-4:37, כדי שהזמן לא יישבר לשורה הבאה
            if (S.voiceSec === 0) line += ' הודעה קולית של 4:37: נשמרה לנסיעה הביתה.';
            else line += ' מההודעה הקולית של 4:37 שמעתם ' + (S.voiceSec === 1 ? 'שנייה אחת' : S.voiceSec + ' שניות') + '. השאר נשמר לנסיעה הביתה.';
            if (S.catTaps > 0) line += ' החתול הכתום: עדיין מחפשים.';
            var missing = 8 - n;
            var note = 'בצוות, זה החלק שלכם לפני הערב: הודעה בקבוצת המתנדבים, וכמה "רשמו אותי". ' +
                (missing === 0 ? 'ואם חסר מישהו, הצוות עוזר להשלים.'
                    : missing === 1 ? 'ואם חסר עוד שם אחד, הצוות עוזר להשלים.'
                        : missing === 8 ? 'ואם הרשימה עוד ריקה, הצוות עוזר למלא אותה.'
                            : 'ואם חסרים עוד ' + missing + ' שמות, הצוות עוזר להשלים.');

            endEl = document.createElement('div');
            endEl.className = P + 'end';
            endEl.innerHTML = '<div class="' + P + 'endin">' +
                '<div class="' + P + 'sun">' + Deer.svg({ mood: full ? 'happy' : 'wink' }) + '</div>' +
                '<h3></h3><div class="' + P + 'score"></div><p class="' + P + 'line"></p><p class="' + P + 'note"></p>' +
                '<div class="' + P + 'actions">' +
                '<button class="btn btn-primary btn-block" type="button" data-a="join">להצטרף לצוות</button>' +
                '<button class="btn btn-ghost btn-block" type="button" data-a="again">עוד סבב</button>' +
                '<button class="' + P + 'quiet" type="button" data-a="share">לשלוח לחברים</button>' +
                '</div></div>';
            endEl.querySelector('h3').textContent = title;
            endEl.querySelector('.' + P + 'score').innerHTML = numHTML(score);
            endEl.querySelector('.' + P + 'line').textContent = line;
            endEl.querySelector('.' + P + 'note').textContent = note;
            stage.appendChild(endEl);
            fit();
            on(endEl, 'click', function (e) {
                var b = e.target.closest ? e.target.closest('[data-a]') : null;
                if (!b) return;
                var a = b.getAttribute('data-a');
                if (a === 'join') ctx.joinTeam();
                else if (a === 'again') ctx.restart();
                else if (a === 'share') ctx.share(share);
            });
        }

        return {
            destroy: function () {
                if (dead) return;
                dead = true;
                cancelAnimationFrame(raf);
                timers.slice().forEach(clearTimeout);
                timers.length = 0;
                listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
                listeners.length = 0;
                if (ro) ro.disconnect();
                if (shiftAnim) shiftAnim.cancel();
                if (root.parentNode) root.parentNode.removeChild(root);
                if (endEl && endEl.parentNode) endEl.parentNode.removeChild(endEl);
            },
        };
    }

    window.PartyiaGames = window.PartyiaGames || {};
    window.PartyiaGames[ID] = { title: 'רשמו אותי!', mount: mount };
})();
