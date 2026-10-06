/**
 * quiz.js: השאלון הרשמי, "מה התחום שלכם בפרתיה?"
 * נטען בתוך כרטיס בעמוד (לא overlay). כרטיס אחד שמתהפך משאלה לשאלה, והצד האחרון שלו הוא התוצאה.
 *
 * window.PartyiaQuiz.mount(el, ctx) -> { destroy() }
 *   ctx = { Deer, onResult(areaKey, areaLabel), joinTeam(), volunteersUrl, share(text) }
 *
 * ניקוד: כל תשובה מוסיפה 1 לתג שלה. התג הגבוה מנצח, ובשוויון מנצח התג שנבחר בשאלה המאוחרת ביותר.
 */
(function () {
    'use strict';

    const LABELS = {
        gizbar: 'גזברות',
        pirsum: 'פרסום',
        kesher: 'קשר עם היישוב',
        melai: 'ניהול מלאי',
        design: 'עיצוב',
        logistics: 'לוגיסטיקה',
        bar: 'מתנדבים לערב',
    };

    const QUESTIONS = [
        {
            q: 'נכנסתם לפרתיה בערב פתוח. הדבר הראשון שאתם קולטים:',
            a: [
                ['gizbar', 'שאתם כבר מחשבים בראש את החשבון של השולחן ליד'],
                ['pirsum', 'שבחוץ עוברים אנשים שלא יודעים שפתוח. איך זה קרה?'],
                ['kesher', 'שאתם מכירים את כולם בחדר חוץ משניים. עוד מעט גם אותם'],
                ['design', 'ששרשרת הנורות השלישית תלויה עקום בשתי מעלות'],
            ],
        },
        {
            q: 'קבוצת הוואטסאפ של היישוב לא מפסיקה לצפצף. מה אתם עושים?',
            a: [
                ['pirsum', 'מנסחים בראש הודעה טובה יותר, עם כותרת ואימוג\'י אחד מדויק'],
                ['kesher', 'עונים לחצי מההודעות, כי אתם מכירים את כל מי שכותבים'],
                ['melai', 'מישהו מוסר מקרר ישן, ואתם כבר יודעים מה ייכנס בכל מדף'],
                ['logistics', 'מחכים ל"מישהו יכול להקפיץ שולחנות?" ועונים תוך שש שניות'],
            ],
        },
        {
            q: 'באמצע ערב פתוח נגמרת הקולה זירו. מה אתם עושים?',
            a: [
                ['melai', 'רושמים "להזמין עוד קולה זירו" ומוסיפים לרשימה'],
                ['design', 'מצמידים למקרר שלט קטן ויפה "הקולה זירו בהפסקה", בפונט שמתאים לאווירה'],
                ['logistics', 'הולכים לאוטו. יש שם צידנית, מאריך ושני סוגי סקוטש'],
                ['bar', 'כבר מאחורי הבר, ומציעים לכולם קולה רגילה עם חיוך'],
            ],
        },
        {
            q: 'מה יש לכם בטלפון עכשיו?',
            a: [
                ['bar', 'שלוש קבוצות שבהן כתבתם "רשמו אותי" החודש'],
                ['gizbar', 'טבלה צבעונית בשם "הוצאות, גרסה סופית 3"'],
                ['pirsum', 'צילומי מסך של פוסטים טובים. "להשראה"'],
                ['melai', 'טאבים פתוחים של שלושה ספקים והשוואת מחירים'],
            ],
        },
    ];

    const RESULTS = {
        gizbar: {
            desc: 'אתם מאמינים שלכל שקל מגיע בית. קבלה מקומטת בכיס? אתם מיישרים אותה לפני שאתם מתייקים.',
            roleLabel: 'בצוות:',
            role: 'מעקב אחרי הכנסות והוצאות, והתשובה לשאלה "יש לנו כסף לזה?".',
            quote: 'מעולם לא ראיתי טבלה כל כך מסודרת. בכיתי קצת.',
            mood: 'closed',
        },
        pirsum: {
            desc: 'כשאתם כותבים "פתוח הערב", אנשים נועלים נעליים. להודעה טובה יש כותרת, תמונה ואימוג\'י אחד. שניים זה כבר הצהרה.',
            roleLabel: 'בצוות:',
            role: 'לדאוג שכל נופי פרת יודעת מתי פתוח ומה קורה.',
            quote: 'קראתי את ההודעה שלכם פעמיים. ובאתי.',
            mood: 'wink',
        },
        kesher: {
            desc: 'אתם מכירים את כולם, כולל מי שעברו לגור כאן בשבוע שעבר. כשצריך אישור, מפתח או מישהו עם טנדר, יש לכם מספר.',
            roleLabel: 'בצוות:',
            role: 'החיבור בין הפרתיה ליישוב, כדי שהפרתיה תהיה של כולם.',
            quote: 'הם הכירו אותי לשכנים. עכשיו מזמינים אותי לקפה.',
            mood: 'happy',
        },
        melai: {
            desc: 'אתם יודעים כמה קולה זירו נשארה במקרר. עכשיו. בלי לבדוק.',
            roleLabel: 'בצוות:',
            role: 'לדעת מה יש, מה חסר ומה להזמין, כדי שאף ערב לא ייגמר ב"מישהו יכול לקפוץ למכולת?".',
            quote: 'ספרו גם אותי. פעמיים.',
            mood: 'wink',
        },
        design: {
            desc: 'הזמנה ליום הולדת בפונט אריאל עושה לכם משהו בגוף. נורה עקומה בשרשרת לא נותנת לכם לישון.',
            roleLabel: 'בצוות:',
            role: 'פוסטרים, תפריטים, שלטים, ואיך המקום נראה.',
            quote: 'מאז שהגעתם, השמש מאחוריי כתומה יותר.',
            mood: 'closed',
        },
        logistics: {
            desc: 'יש לכם באוטו מאריך, סקוטש בשני עוביים ושולחן מתקפל, ליתר ביטחון. כשמישהו שואל "איפה ה...?", אתם עונים לפני שהשאלה נגמרת.',
            roleLabel: 'בצוות:',
            role: 'ציוד, הובלות, סידור המקום, ולדעת איפה כל דבר נמצא.',
            quote: 'שאלתי איפה הקרניים שלי. הם ידעו.',
            mood: 'happy',
        },
        bar: {
            desc: 'אתם רוצים להיות על הבר ערב אחד, למזוג, לצחוק עם מי שבא ולשאול "מה להביא לכם?". בלי אנשים כמוכם אין ערב פתוח.',
            roleLabel: 'המקום שלכם:',
            role: 'קבוצת המתנדבים. שם כותבים כשצריך ידיים, ואתם עונים כשמתאים לכם.',
            quote: 'הכי אהבתי את הערב שהייתם על הבר.',
            mood: 'happy',
        },
    };

    const TEAM_EXTRA = 'וחוץ מהתחום: ערב אחד שלכם בערך כל חודשיים, עם מתנדבים לצידכם.';
    const KEYS = ['א', 'ב', 'ג', 'ד'];
    const CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const CSS = `
.quiz {
    --q-ink: var(--brown, #3a1a10);
    --q-or: var(--orange, #E8873B);
    --q-deep: var(--orange-deep, #D35400);
    --q-paper: #FFF9EE;
    position: relative;
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
    direction: rtl;
    text-align: right;
    font-family: var(--font, 'Heebo', 'Segoe UI', sans-serif);
    color: var(--cream, #F2E8D5);
    -webkit-tap-highlight-color: transparent;
}
.quiz *, .quiz *::before, .quiz *::after { box-sizing: border-box; }
/* איפוס ב-:where, כדי שהמרווחים של המחלקות (.quiz-sub, .quiz-res-desc וכו') יגברו עליו */
.quiz :where(h3, h4, p) { margin: 0; }
.quiz-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* כותרת */
.quiz-head { text-align: center; }
.quiz-title { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.quiz-eyebrow {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 5px 13px 6px;
    border: 1.5px solid rgba(232, 135, 59, .55);
    border-radius: 999px;
    background: rgba(232, 135, 59, .1);
    color: var(--q-or);
    font-size: 13.5px; font-weight: 900; letter-spacing: .03em;
}
.quiz-eyebrow .sparkle { display: block; }
.quiz-title-main {
    font-size: 27px; line-height: 1.15; font-weight: 900; color: var(--cream, #F2E8D5);
    text-wrap: balance;
}
.quiz-title-main em { font-style: normal; color: var(--q-or); }
.quiz-sub {
    margin-top: 8px;
    font-size: 15px; line-height: 1.5; color: var(--cream-dim, #cfc4ad);
    text-wrap: balance;
}

/* פס התקדמות + הצבי שמציץ מאחורי הכרטיס */
.quiz-rail {
    position: relative;
    height: 66px;
    margin-top: 6px;
    display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-start; gap: 6px;
    padding: 0 10px 13px 112px;
}
.quiz-progress { display: flex; align-items: center; gap: 8px; flex: none; }
.quiz-dot {
    width: 12px; height: 12px; border-radius: 50%;
    border: 2px solid rgba(242, 232, 213, .35);
    transition: background .25s, border-color .25s;
}
.quiz-dot.is-current { border-color: var(--q-or); animation: quiz-pulse 1.6s infinite; }
.quiz-dot.is-done { background: var(--q-or); border-color: var(--q-or); animation: quiz-dotpop .45s cubic-bezier(.2, 1.6, .4, 1); }
.quiz-dot-star { width: 18px; height: 18px; border: none; display: grid; place-items: center; opacity: .35; transition: opacity .3s; }
.quiz-dot-star .sparkle { display: block; }
.quiz-dot-star.is-done { background: none; opacity: 1; animation: quiz-starpop .7s cubic-bezier(.2, 1.6, .4, 1); }
.quiz-progress.is-wave .quiz-dot { animation: quiz-wave .5s ease-in-out infinite; }
.quiz-progress.is-wave .quiz-dot:nth-child(2) { animation-delay: .08s; }
.quiz-progress.is-wave .quiz-dot:nth-child(3) { animation-delay: .16s; }
.quiz-progress.is-wave .quiz-dot:nth-child(4) { animation-delay: .24s; }
.quiz-progress.is-wave .quiz-dot:nth-child(5) { animation-delay: .32s; }
.quiz-status {
    order: -1; max-width: 100%; min-height: 19px;
    font-size: 13.5px; line-height: 19px; font-weight: 700; color: var(--cream-dim, #cfc4ad);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    opacity: 0; transform: translateY(4px); transition: opacity .25s, transform .25s;
}
.quiz-status.is-on { opacity: 1; transform: none; }
.quiz-peek {
    position: absolute; left: 22px; bottom: 0;
    width: 84px; height: 78px; overflow: hidden;
    pointer-events: none;
}
.quiz-peek-deer {
    position: absolute; left: 0; bottom: -8px; width: 84px;
    transition: transform .45s cubic-bezier(.3, 1.4, .5, 1);
}
.quiz-peek-deer.is-down { transform: translateY(105%); transition: transform .35s ease-in; }
.quiz-peek-bob { transform-origin: 50% 100%; }
.quiz-peek-bob.is-hop { animation: quiz-hop .6s cubic-bezier(.3, 1.3, .5, 1); }
.quiz-peek-bob.is-shake { animation: quiz-shake .45s ease-in-out infinite; }
.quiz-peek .deer { display: block; width: 100%; height: auto; }

/* הכרטיס המתהפך */
.quiz-stage { position: relative; }
.quiz-stage::before {
    content: ''; position: absolute; inset: 8% 6% -6%;
    background: radial-gradient(closest-side, rgba(232, 135, 59, .3), rgba(232, 135, 59, 0));
    pointer-events: none;
}
.quiz-lift { position: relative; perspective: 1600px; }
.quiz-lift.is-flipping { animation: quiz-lift var(--q-flip, .7s) ease-in-out; }
.quiz-card {
    position: relative;
    transform-style: preserve-3d;
    -webkit-transform-style: preserve-3d;
    transition: transform var(--q-flip, .7s) cubic-bezier(.5, .05, .2, 1), height .45s ease;
}
.quiz-card.is-instant, .quiz-card.is-instant .quiz-face { transition: none; }
.quiz-face {
    position: absolute; top: 0; left: 0; right: 0;
    padding: 20px 18px 22px;
    border-radius: 22px;
    color: var(--q-ink);
    background:
        radial-gradient(140% 70% at 50% -8%, #FFFBF2 0%, rgba(255, 251, 242, 0) 60%),
        linear-gradient(180deg, #FAEEDA 0%, #F3E0C0 100%);
    border: 2.5px solid var(--q-ink);
    box-shadow: 0 0 0 5px rgba(232, 135, 59, .38), 0 22px 44px rgba(0, 0, 0, .5);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transform: rotateY(0deg);
}
.quiz-face-b { transform: rotateY(180deg); }
.quiz-face.is-hidden { pointer-events: none; }
.quiz-face::before {
    content: ''; position: absolute; inset: 6px;
    border: 1.5px solid rgba(58, 26, 16, .2); border-radius: 16px;
    pointer-events: none;
}
.quiz-face-in { position: relative; }
/* הברק שעובר על הכרטיס: בשכבה נפרדת, כדי שהצד עצמו לא יהיה אזור גלילה */
.quiz-shine {
    position: absolute; inset: 0; border-radius: 20px;
    overflow: hidden; pointer-events: none;
}
.quiz-shine::after {
    content: ''; position: absolute; top: -10%; bottom: -10%; left: 0; width: 45%;
    background: linear-gradient(100deg, rgba(255, 255, 255, 0) 25%, rgba(255, 255, 255, .3) 50%, rgba(255, 255, 255, 0) 75%);
    transform: translateX(-180%);
}
/* קצר ועדין: עובר על הכרטיס בזמן הנחיתה ונגמר מיד אחריה, כדי לא להחוויר את הטקסט בזמן הקריאה */
.quiz-face.is-shine .quiz-shine::after { animation: quiz-shine .75s ease-out var(--q-shine, .3s) both; }

/* צד של שאלה */
.quiz-face-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.quiz-qnum { font-size: 14px; font-weight: 900; color: var(--q-deep); letter-spacing: .02em; }
.quiz-qnum b { font-size: 19px; font-weight: 900; }
.quiz-face-top .sparkle { display: block; flex: none; }
.quiz-q {
    margin-top: 8px;
    font-size: 21px; line-height: 1.32; font-weight: 900; color: var(--q-ink);
    outline: none;
}
.quiz-answers { display: flex; flex-direction: column; gap: 11px; margin-top: 16px; }
.quiz-ans {
    position: relative;
    display: flex; align-items: center; gap: 12px;
    width: 100%; min-height: 58px;
    margin: 0; padding: 10px 12px 10px 14px;
    text-align: right;
    font-family: inherit; font-size: 16px; font-weight: 700; line-height: 1.38;
    color: var(--q-ink);
    background: var(--q-paper);
    border: 2px solid var(--q-ink);
    border-radius: 15px;
    box-shadow: 0 4px 0 var(--q-ink);
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: transform .1s ease-out, box-shadow .1s ease-out, background .2s, color .2s, opacity .3s;
}
.quiz-ans:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--q-ink); }
.quiz-ans:focus-visible { outline: 3px solid var(--q-deep); outline-offset: 3px; }
.quiz-ans-key {
    flex: none; display: grid; place-items: center;
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--q-or); color: #fff;
    border: 2px solid var(--q-ink);
    font-size: 16px; font-weight: 900; line-height: 1;
    transition: background .2s, color .2s;
}
.quiz-ans-key svg { display: block; }
.quiz-ans-text { flex: 1; }
/* בלי מילה בודדת בשורה האחרונה (בדפדפנים שתומכים) */
.quiz-q, .quiz-ans-text, .quiz-res-desc, .quiz-res-role, .quiz-bubble { text-wrap: pretty; }
.quiz-res-extra { text-wrap: balance; }
.quiz-ans.is-picked {
    background: linear-gradient(135deg, var(--q-or) 0%, var(--q-deep) 100%);
    color: #fff;
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--q-ink);
    animation: quiz-pick .45s cubic-bezier(.2, 1.5, .4, 1);
}
.quiz-ans.is-picked .quiz-ans-key { background: #FFF6E6; color: var(--q-deep); }
.quiz-answers.is-locked .quiz-ans { cursor: default; }
.quiz-answers.is-locked .quiz-ans:not(.is-picked) { opacity: .4; transform: scale(.97); }
@media (hover: hover) {
    .quiz-answers:not(.is-locked) .quiz-ans:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 5px 0 var(--q-ink); }
    .quiz-answers:not(.is-locked) .quiz-ans:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--q-ink); }
}

/* צד התוצאה */
.quiz-res-head { text-align: center; outline: none; }
.quiz-res-eyebrow {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-size: 15px; font-weight: 900; color: var(--q-deep);
}
.quiz-res-eyebrow .sparkle { display: block; }
.quiz-res-label {
    display: block; margin-top: 2px;
    font-size: 36px; line-height: 1.12; font-weight: 900; color: var(--q-ink);
    text-wrap: balance;
}
.quiz-res-label::after {
    content: ''; display: block; width: 64px; height: 5px; margin: 8px auto 0;
    border-radius: 3px; background: linear-gradient(90deg, var(--q-or), var(--q-deep));
}
.quiz-res-desc { margin-top: 12px; font-size: 16px; line-height: 1.55; font-weight: 500; }
.quiz-res-role {
    margin-top: 12px; padding: 10px 13px;
    font-size: 15.5px; line-height: 1.5;
    background: rgba(232, 135, 59, .14);
    border-right: 4px solid var(--q-or);
    border-radius: 12px;
}
.quiz-res-role b { color: var(--q-deep); font-weight: 900; }
.quiz-res-quote { display: flex; align-items: flex-end; gap: 4px; margin-top: 14px; }
.quiz-bubble {
    position: relative; flex: 1;
    margin-bottom: 14px;
    padding: 9px 13px 10px;
    background: #fff;
    border: 2px solid var(--q-ink);
    border-radius: 16px 16px 16px 8px;
    font-size: 15px; line-height: 1.45; font-weight: 700;
}
.quiz-bubble b { display: block; font-size: 13px; font-weight: 900; color: var(--q-deep); }
/* הזנב של הבועה: משולש חום, ומעליו משולש לבן קטן ממנו, כדי שהקו יהיה רציף */
.quiz-bubble::before, .quiz-bubble::after {
    content: ''; position: absolute;
    -webkit-clip-path: polygon(100% 0, 100% 100%, 0 85%);
    clip-path: polygon(100% 0, 100% 100%, 0 85%);
}
.quiz-bubble::before { left: -15px; bottom: 8px; width: 15px; height: 20px; background: var(--q-ink); }
.quiz-bubble::after { left: -11px; bottom: 10px; width: 12px; height: 16px; background: #fff; }
.quiz-res-deer { flex: none; width: 70px; }
.quiz-res-deer .deer { display: block; width: 100%; height: auto; }
.quiz-res-deer .deer-ear-l { animation: quiz-ear 3.2s ease-in-out 2s infinite; }
.quiz-res-extra {
    margin-top: 12px; padding: 9px 12px;
    font-size: 14.5px; line-height: 1.5; font-weight: 700; text-align: center;
    color: rgba(58, 26, 16, .85);
    border: 1.5px dashed rgba(58, 26, 16, .32);
    border-radius: 12px;
}
.quiz-res-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.quiz-res-actions .btn { padding: 8px 18px; line-height: 1.25; text-align: center; }
.quiz-res-actions .btn-primary { border: 2px solid var(--q-ink); box-shadow: 0 4px 0 var(--q-ink), 0 12px 22px rgba(211, 84, 0, .28); }
.quiz-res-actions .btn-primary:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--q-ink); }
.quiz-res-row { display: flex; align-items: center; gap: 8px; }
.quiz-res-row .btn-ghost {
    flex: 1; min-height: 48px; font-size: 17px;
    color: var(--q-deep); background: rgba(211, 84, 0, .07); border-color: rgba(211, 84, 0, .6);
}
.quiz-res-row .btn-quiet { color: var(--q-ink); font-weight: 700; }
.quiz-link {
    align-self: center;
    min-height: 40px; padding: 4px 10px; margin-top: -4px;
    background: none; border: none; cursor: pointer;
    font-family: inherit; font-size: 15.5px; font-weight: 900; color: var(--q-deep);
    text-decoration: underline; text-underline-offset: 4px;
    -webkit-tap-highlight-color: transparent;
}
.quiz .btn:focus-visible, .quiz-link:focus-visible { outline: 3px solid var(--q-deep); outline-offset: 3px; }

.quiz-res-anim > * { animation: quiz-rise .5s cubic-bezier(.2, 1.2, .4, 1) both; }
.quiz-res-anim .quiz-res-label { animation: quiz-slam .6s cubic-bezier(.2, 1.5, .4, 1) both; animation-delay: calc(var(--q-base) + .05s); }
.quiz-res-anim > :nth-child(1) { animation-delay: var(--q-base); }
.quiz-res-anim > :nth-child(2) { animation-delay: calc(var(--q-base) + .3s); }
.quiz-res-anim > :nth-child(3) { animation-delay: calc(var(--q-base) + .4s); }
.quiz-res-anim > :nth-child(4) { animation-delay: calc(var(--q-base) + .5s); }
.quiz-res-anim > :nth-child(5) { animation-delay: calc(var(--q-base) + .6s); }
.quiz-res-anim > :nth-child(6) { animation-delay: calc(var(--q-base) + .7s); }
.quiz-res-anim .quiz-res-deer { animation: quiz-pop .7s cubic-bezier(.2, 1.6, .4, 1) both; animation-delay: calc(var(--q-base) + .6s); transform-origin: 50% 100%; }

/* ניצוצות */
.quiz-fx { position: absolute; inset: -60px 0 -10px 0; overflow: hidden; pointer-events: none; }
.quiz-spark {
    position: absolute; width: 0; height: 0;
    animation: quiz-burst var(--t, .8s) cubic-bezier(.15, .7, .3, 1) var(--d, 0s) both;
}
.quiz-spark svg { position: absolute; left: 0; top: 0; transform: translate(-50%, -50%); display: block; }

@keyframes quiz-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(232, 135, 59, .55); } 60% { box-shadow: 0 0 0 6px rgba(232, 135, 59, 0); } }
@keyframes quiz-dotpop { 0% { transform: scale(1); } 45% { transform: scale(1.7); } 100% { transform: scale(1); } }
@keyframes quiz-starpop { 0% { transform: scale(.4) rotate(-90deg); } 60% { transform: scale(1.6) rotate(15deg); } 100% { transform: scale(1) rotate(0); } }
@keyframes quiz-wave { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes quiz-hop { 0%, 100% { transform: translateY(0) rotate(0); } 30% { transform: translateY(-13px) rotate(-6deg); } 60% { transform: translateY(0) rotate(3deg); } 80% { transform: translateY(-3px) rotate(0); } }
@keyframes quiz-shake { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } }
@keyframes quiz-lift { 0%, 100% { transform: scale(1); } 50% { transform: scale(.94); } }
@keyframes quiz-shine { from { transform: translateX(-180%); } to { transform: translateX(260%); } }
@keyframes quiz-pick { 0% { transform: translateY(3px) scale(1); } 40% { transform: translateY(1px) scale(1.035); } 100% { transform: translateY(3px) scale(1); } }
@keyframes quiz-rise { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
@keyframes quiz-slam { 0% { opacity: 0; transform: scale(1.9); } 55% { opacity: 1; transform: scale(.93); } 100% { opacity: 1; transform: scale(1); } }
@keyframes quiz-pop { 0% { opacity: 0; transform: translateY(18px) scale(.4); } 65% { opacity: 1; transform: translateY(0) scale(1.12); } 100% { opacity: 1; transform: none; } }
@keyframes quiz-ear { 0%, 84%, 100% { transform: rotate(0); } 89% { transform: rotate(-16deg); } 94% { transform: rotate(6deg); } }
@keyframes quiz-burst {
    0% { opacity: 1; transform: translate(0, 0) scale(.2) rotate(0); }
    65% { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1) rotate(var(--r)); }
}

@media (prefers-reduced-motion: reduce) {
    .quiz *, .quiz *::before, .quiz *::after { animation: none !important; }
    .quiz-card { transition: height .2s; }
}
`;

    function injectCSS() {
        if (document.getElementById('quiz-style')) return;
        const s = document.createElement('style');
        s.id = 'quiz-style';
        s.textContent = CSS;
        document.head.appendChild(s);
    }

    function shuffle(list) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    // התג הגבוה מנצח. בשוויון: התג שנבחר בשאלה המאוחרת ביותר.
    function winner(picks) {
        const count = {};
        picks.forEach(t => { count[t] = (count[t] || 0) + 1; });
        let max = 0;
        Object.keys(count).forEach(k => { if (count[k] > max) max = count[k]; });
        for (let i = picks.length - 1; i >= 0; i--) {
            if (count[picks[i]] === max) return picks[i];
        }
        return picks[picks.length - 1];
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    function mount(el, ctx) {
        ctx = ctx || {};
        injectCSS();
        const Deer = ctx.Deer || window.Deer;
        const reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        const T = reduced ? { pick: 260, flip: 0, calc: 500 } : { pick: 540, flip: 700, calc: 850 };
        const C = (Deer && Deer.COLORS) || { orange: '#E8873B', orangeDeep: '#D35400', creamLight: '#FBEBCB' };
        const spark = (size, color) => (Deer ? Deer.sparkle(size, color) : '');

        const timers = new Set();
        const later = (fn, ms) => {
            const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
            timers.add(id);
            return id;
        };

        const st = { step: 0, picks: [], rot: 0, active: 0, locked: true, flipping: false, result: null, destroyed: false };

        const root = document.createElement('div');
        root.className = 'quiz';
        root.setAttribute('dir', 'rtl');
        root.style.setProperty('--q-flip', (T.flip / 1000) + 's');
        root.innerHTML = `
            <div class="quiz-head">
                <h3 class="quiz-title">
                    <span class="quiz-eyebrow">${spark(11, C.orange)}השאלון הרשמי:${spark(11, C.orange)}</span>
                    <span class="quiz-title-main">מה התחום שלכם <em>בפרתיה?</em></span>
                </h3>
                <p class="quiz-sub">ארבע שאלות. תוצאה אחת.<br>התוצאה סופית (אפשר לעשות שוב).</p>
            </div>
            <div class="quiz-rail">
                <div class="quiz-progress" aria-hidden="true">
                    ${QUESTIONS.map(() => '<span class="quiz-dot"></span>').join('')}
                    <span class="quiz-dot quiz-dot-star">${spark(18, C.orange)}</span>
                </div>
                <span class="quiz-status" aria-hidden="true"></span>
                <div class="quiz-peek" aria-hidden="true">
                    <div class="quiz-peek-deer"><div class="quiz-peek-bob"></div></div>
                </div>
            </div>
            <div class="quiz-stage">
                <div class="quiz-lift">
                    <div class="quiz-card is-instant">
                        <section class="quiz-face quiz-face-a"><div class="quiz-face-in"></div><div class="quiz-shine"></div></section>
                        <section class="quiz-face quiz-face-b is-hidden" inert aria-hidden="true"><div class="quiz-face-in"></div><div class="quiz-shine"></div></section>
                    </div>
                </div>
                <div class="quiz-fx" aria-hidden="true"></div>
            </div>
            <div class="quiz-sr" aria-live="polite"></div>`;
        el.appendChild(root);

        const $ = s => root.querySelector(s);
        const card = $('.quiz-card');
        const lift = $('.quiz-lift');
        const faces = [$('.quiz-face-a'), $('.quiz-face-b')];
        const inners = faces.map(f => f.querySelector('.quiz-face-in'));
        const dots = Array.prototype.slice.call(root.querySelectorAll('.quiz-dot'));
        const progress = $('.quiz-progress');
        const status = $('.quiz-status');
        const peekDeer = $('.quiz-peek-deer');
        const peekBob = $('.quiz-peek-bob');
        const fx = $('.quiz-fx');
        const sr = $('.quiz-sr');

        /* ---------- הצבי שמציץ ---------- */
        let peekMood = '';
        function peek(mood, anim) {
            if (!Deer) return;
            if (mood !== peekMood) {
                peekBob.innerHTML = Deer.svg({ mood: mood, title: 'הצבי' });
                peekMood = mood;
            }
            peekBob.classList.remove('is-hop', 'is-shake');
            if (anim) {
                void peekBob.offsetWidth;
                peekBob.classList.add(anim);
            }
        }

        /* ---------- ניצוצות ---------- */
        function burst(x, y, n, o) {
            if (reduced || !Deer) return;
            const colors = o.colors || [C.orange, C.orangeDeep, '#F4B860'];
            const nodes = [];
            for (let i = 0; i < n; i++) {
                const a = o.a0 + (o.spread * (i + Math.random() * 0.8)) / n;
                const dist = o.dist * (0.55 + Math.random() * 0.6);
                const s = document.createElement('span');
                s.className = 'quiz-spark';
                s.style.cssText = `left:${x}px;top:${y}px;--dx:${(Math.cos(a) * dist).toFixed(1)}px;--dy:${(Math.sin(a) * dist).toFixed(1)}px;--r:${Math.round(Math.random() * 240 - 120)}deg;--d:${Math.round(Math.random() * (o.jitter || 60))}ms;--t:${o.t || 0.8}s`;
                s.innerHTML = Deer.sparkle(Math.round(o.size * (0.6 + Math.random() * 0.7)), colors[i % colors.length]);
                nodes.push(s);
                fx.appendChild(s);
            }
            later(() => nodes.forEach(s => s.remove()), (o.t || 0.8) * 1000 + 200);
        }

        function fxPoint(node, fx0, fy0) {
            const r = node.getBoundingClientRect();
            const b = fx.getBoundingClientRect();
            return { x: r.left - b.left + r.width * fx0, y: r.top - b.top + r.height * fy0 };
        }

        /* ---------- תוכן הצדדים ---------- */
        function questionHTML(i) {
            const q = QUESTIONS[i];
            const answers = shuffle(q.a);
            return `
                <div class="quiz-face-top">
                    <span class="quiz-qnum">שאלה <b>${i + 1}</b> מתוך ${QUESTIONS.length}</span>
                    ${spark(16, C.orange)}
                </div>
                <h4 class="quiz-q" tabindex="-1">${q.q}</h4>
                <div class="quiz-answers">
                    ${answers.map((a, k) => `
                        <button type="button" class="quiz-ans" data-act="pick" data-tag="${a[0]}">
                            <span class="quiz-ans-key" aria-hidden="true">${KEYS[k]}</span>
                            <span class="quiz-ans-text">${a[1]}</span>
                        </button>`).join('')}
                </div>`;
        }

        function resultHTML(key) {
            const r = RESULTS[key];
            const label = LABELS[key];
            const isBar = key === 'bar';
            const actions = isBar
                ? `<a class="btn btn-primary btn-block" data-act="volunteers" href="${esc(ctx.volunteersUrl || '#')}" target="_blank" rel="noopener">לקבוצת המתנדבים</a>
                   <button type="button" class="quiz-link" data-act="join-bar">ואם בכל זאת מתחשק צוות</button>`
                : `<button type="button" class="btn btn-primary btn-block" data-act="join">זה התחום שלי, להצטרפות</button>`;
            return `
                <div class="quiz-res quiz-res-anim" style="--q-base:${(T.flip * 0.7 / 1000).toFixed(2)}s">
                    <h4 class="quiz-res-head" tabindex="-1">
                        <span class="quiz-res-eyebrow">${spark(13, C.orange)}יצא לכם:${spark(13, C.orange)}</span>
                        <span class="quiz-res-label">${label}</span>
                    </h4>
                    <p class="quiz-res-desc">${r.desc}</p>
                    <p class="quiz-res-role"><b>${r.roleLabel}</b> ${r.role}</p>
                    <div class="quiz-res-quote">
                        <p class="quiz-bubble"><b>הצבי:</b>"${r.quote}"</p>
                        <div class="quiz-res-deer">${Deer ? Deer.svg({ body: true, mood: r.mood, title: 'הצבי' }) : ''}</div>
                    </div>
                    ${isBar ? '' : `<p class="quiz-res-extra">${TEAM_EXTRA}</p>`}
                    <div class="quiz-res-actions">
                        ${actions}
                        <div class="quiz-res-row">
                            <button type="button" class="btn btn-ghost" data-act="restart">לעשות שוב</button>
                            <button type="button" class="btn btn-quiet" data-act="share">לשתף</button>
                        </div>
                    </div>
                </div>`;
        }

        /* ---------- גובה הכרטיס ---------- */
        function syncHeight() {
            if (st.flipping || st.destroyed) return;
            card.style.height = faces[st.active].offsetHeight + 'px';
        }

        /* ---------- היפוך ---------- */
        // מי שגללו למטה כדי להגיע לתשובה האחרונה: ראש הכרטיס חוזר למסך, כדי שהשאלה הבאה (או התוצאה) תיראה מההתחלה
        function bringIntoView(node, pad) {
            const top = node.getBoundingClientRect().top;
            if (top >= 0) return;
            try { window.scrollBy({ top: top - pad, behavior: reduced ? 'auto' : 'smooth' }); } catch (e) { window.scrollBy(0, top - pad); }
        }

        function flipTo(html, focusSel, done, noScroll) {
            if (!noScroll) bringIntoView(lift, 12);
            const cur = faces[st.active];
            const next = faces[1 - st.active];
            inners[1 - st.active].innerHTML = html;
            next.classList.remove('is-hidden', 'is-shine');
            next.removeAttribute('inert');
            next.removeAttribute('aria-hidden');
            cur.classList.add('is-hidden');
            cur.setAttribute('inert', '');
            cur.setAttribute('aria-hidden', 'true');

            const curInner = inners[st.active];
            st.flipping = true;
            st.active = 1 - st.active;
            st.rot -= 180;
            card.style.height = Math.max(cur.offsetHeight, next.offsetHeight) + 'px';
            card.style.transform = `rotateY(${st.rot}deg)`;
            if (!reduced) {
                lift.classList.remove('is-flipping');
                void lift.offsetWidth;
                lift.classList.add('is-flipping');
                next.style.setProperty('--q-shine', (T.flip * 0.4 / 1000).toFixed(2) + 's');
                next.classList.add('is-shine');
            }
            later(() => {
                st.flipping = false;
                lift.classList.remove('is-flipping');
                curInner.innerHTML = '';
                cur.classList.remove('is-shine');
                syncHeight();
                const head = next.querySelector('h4');
                if (head) sr.textContent = head.textContent.replace(/\s+/g, ' ').trim();
                if (focusSel) {
                    const f = next.querySelector(focusSel);
                    if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
                }
                if (done) done();
            }, T.flip + 30);
        }

        function setDots() {
            dots.forEach((d, i) => {
                d.classList.toggle('is-done', i < st.step || (i === QUESTIONS.length && st.result));
                d.classList.toggle('is-current', i === st.step && !st.result && i < QUESTIONS.length);
            });
        }

        function setStatus(text) {
            status.textContent = text || '';
            status.classList.toggle('is-on', !!text);
        }

        /* ---------- בחירה ---------- */
        function pick(btn, kb) {
            if (st.locked || st.flipping) return;
            if (!faces[st.active].contains(btn)) return;
            st.locked = true;
            const tag = btn.getAttribute('data-tag');
            st.picks.push(tag);
            btn.classList.add('is-picked');
            btn.parentNode.classList.add('is-locked');
            const key = btn.querySelector('.quiz-ans-key');
            if (key) key.innerHTML = CHECK;

            const p = fxPoint(key || btn, 0.5, 0.5);
            burst(p.x, p.y, 9, { a0: 0, spread: Math.PI * 2, dist: 46, size: 13, t: 0.7 });
            peek(st.step % 2 ? 'wink' : 'happy', 'is-hop');

            st.step += 1;
            setDots();
            const focusSel = kb ? 'h4' : null;

            if (st.step < QUESTIONS.length) {
                later(() => {
                    flipTo(questionHTML(st.step), focusSel, () => {
                        st.locked = false;
                        peek('neutral');
                    });
                }, T.pick);
                return;
            }

            // אחרי השאלה האחרונה: רגע של ספירה רשמית, ואז התוצאה
            const res = winner(st.picks);
            later(() => {
                setStatus('מחשבים את התוצאה...');
                progress.classList.add('is-wave');
                peek('closed', 'is-shake');
                later(() => {
                    progress.classList.remove('is-wave');
                    st.result = res;
                    setDots();
                    setStatus('תוצאה רשמית');
                    peek('happy');
                    peekDeer.classList.add('is-down');
                    flipTo(resultHTML(res), focusSel, () => {
                        st.locked = false;
                        const face = faces[st.active];
                        const b = fx.getBoundingClientRect();
                        const fr = face.getBoundingClientRect();
                        const cx = fr.left - b.left + fr.width / 2;
                        const top = fr.top - b.top + 10;
                        burst(cx, top, 22, { a0: Math.PI * 1.05, spread: Math.PI * 0.9, dist: 120, size: 18, t: 1.1, jitter: 160, colors: [C.orange, '#F4B860', C.creamLight, C.orangeDeep] });
                        const lab = face.querySelector('.quiz-res-label');
                        if (lab) {
                            const p2 = fxPoint(lab, 0.5, 0.5);
                            burst(p2.x, p2.y, 12, { a0: 0, spread: Math.PI * 2, dist: 90, size: 14, t: 0.9, jitter: 120 });
                        }
                    });
                }, T.calc);
            }, T.pick);
        }

        function restart(kb) {
            if (st.flipping) return;
            st.step = 0;
            st.picks = [];
            st.result = null;
            st.locked = true;
            setDots();
            setStatus('');
            peekDeer.classList.remove('is-down');
            peek('neutral', 'is-hop');
            const r = root.getBoundingClientRect();
            if (r.top < 0 && root.scrollIntoView) {
                try { root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); } catch (e) { root.scrollIntoView(); }
            }
            flipTo(questionHTML(0), kb ? 'h4' : null, () => { st.locked = false; peek('neutral'); }, true);
        }

        /* ---------- אירועים ---------- */
        function onClick(e) {
            const t = e.target.closest ? e.target.closest('[data-act]') : null;
            if (!t || !root.contains(t)) return;
            const act = t.getAttribute('data-act');
            const kb = e.detail === 0;
            if (act === 'pick') return pick(t, kb);
            if (act === 'restart') return restart(kb);
            const key = st.result;
            if (!key) return;
            if (act === 'join') {
                if (ctx.onResult) ctx.onResult(key, LABELS[key]);
                if (ctx.joinTeam) ctx.joinTeam();
            } else if (act === 'join-bar') {
                if (ctx.onResult) ctx.onResult('bar', LABELS.bar);
                if (ctx.joinTeam) ctx.joinTeam();
            } else if (act === 'share') {
                if (ctx.share) ctx.share(`יצא לי ${LABELS[key]} בשאלון הרשמי של הפרתיה. ומה יוצא לכם?`);
            } else if (act === 'volunteers') {
                if (!ctx.volunteersUrl) e.preventDefault();
            }
        }
        root.addEventListener('click', onClick);
        // ב-iOS מצב :active (תחושת הלחיצה של הכפתורים) עובד רק כשיש מאזין touchstart
        const noop = () => {};
        root.addEventListener('touchstart', noop, { passive: true });

        let ro = null;
        if ('ResizeObserver' in window) {
            ro = new ResizeObserver(syncHeight);
            faces.forEach(f => ro.observe(f));
        }
        window.addEventListener('resize', syncHeight);

        /* ---------- התחלה ---------- */
        inners[0].innerHTML = questionHTML(0);
        peek('neutral');
        setDots();
        card.style.height = faces[0].offsetHeight + 'px';
        later(() => { card.classList.remove('is-instant'); st.locked = false; }, 60);

        return {
            destroy() {
                st.destroyed = true;
                timers.forEach(clearTimeout);
                timers.clear();
                root.removeEventListener('click', onClick);
                root.removeEventListener('touchstart', noop, { passive: true });
                window.removeEventListener('resize', syncHeight);
                if (ro) ro.disconnect();
                root.remove();
            },
        };
    }

    window.PartyiaQuiz = { mount: mount };
})();
