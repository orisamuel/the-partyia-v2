# הפרתיה (the-partyia-v2)

מערכת ואתרים של הפרתיה, פאב קהילתי בהתנדבות בנופי פרת. אתר סטטי (HTML/JS בלי build) על GitHub Pages, ו-Google Apps Script + Google Sheets כבקאנד.

- **חי:** https://orisamuel.github.io/the-partyia-v2/ (פריסה: push ל-`master`, Pages מ-branch).
- **מערכת ההזמנות** (`index.html`, `orders.html`, `admin.html` ועוד) דורשת כניסה (`login.html`).
- **עמודים ציבוריים:** `volunteers.html` (ערב מתנדבים), `team.html` (גיוס לצוות, אוקטובר 2026).

## Apps Script
- `appscript.gs` בריפו הוא **עותק** של הסקריפט. הסקריפט עצמו לא נמצא בחשבון 42 ש-clasp מחובר אליו, אז עדכון = להדביק את הקובץ בעורך Apps Script ואז Deploy > Manage deployments > עריכת הפריסה הקיימת > New version (כך ה-URL ב-`config.js` לא משתנה).
- בדיקה: `?action=ping` מחזיר את מספר הגרסה (`v5-team-2026-10-06` כולל `joinTeam`).
- `getRecentOrdersFromMain` עם limit גדול מאוד מחזיר דף שגיאה של גוגל ("הדף לא נמצא"). זה לא אומר שהפריסה נפלה; לבדוק עם `ping`.
- `joinTeam` כותב ללשונית "הצטרפות לצוות" (נוצרת לבד בשליחה הראשונה).

## עמוד הצוות (`team.html` + `team/`)
- `team/brand.css` טוקנים ורכיבים משותפים. `team/deer.js` הצבי (SVG בקוד, `Deer.svg({body, mood})`).
- משחקים: `team/games/{pour,list,tower}.js`, כל אחד `window.PartyiaGames[id].mount(stage, ctx)`. שאלון התחומים: `team/quiz.js`. סביבות בדיקה: `team/games/_harness.html?game=<id>`, `team/games/_quiz-harness.html` (לא בפריסה).
- תמונת וואטסאפ: `team/og.jpg` (1122x1402, הפורמט שעובד בוואטסאפ), מקור: `team/og-card.html`.
- **החלטות טון (מאורי):** הפקה מוגזמת בפנים רציניות, אבל העמוד אף פעם לא אומר שהוא מוגזם ולא קורץ על זה. קליל, לא מסע מובנה. התפקיד לא נראה קשה. השאלות הנפוצות: ערבוב של רגילות ומשונות, בלי חותמות. האתר הוא לגיוס לצוות; קבוצת המתנדבים וקבוצת העדכונים הן "על הדרך". החיה היא **צבי**. "הפרתיה" נהגה HA-PARTIYA.
- **מה התפקיד בפועל:** ערב הפעלה בערך כל חודשיים (גיוס מתנדבים, הקמה, הפעלה, ניקיון), ישיבה פעם בחודש או חודשיים, זמינות בוואטסאפ, ובדרך כלל תחום אחריות (גזברות, פרסום, קשר עם היישוב, מלאי, עיצוב, לוגיסטיקה ועוד).

## הטריילר (`team/trailer/`)
- `cues.json` הוא מקור האמת לתזמון (קריינות, כותרות, אפקטים). `mix.mjs` בונה ממנו את `audio/mix.wav`. `trailer.html` האנימציה (GSAP, 1080x1920, `window.__seek(t)`), `render.mjs` מצלם פריימים ומוציא `team/trailer.mp4` (720p לעמוד) ו-`team/trailer-1080.mp4`.
- רינדור מחדש: שרת סטטי על הריפו בפורט 8765 (`python -m http.server 8765`), `node team/trailer/mix.mjs`, ואז `node team/trailer/render.mjs` (צריך puppeteer-core ו-ffmpeg).
- קול: ElevenLabs ישיר (`ELEVENLABS_API_KEY`), מודל `eleven_v4`, קול Adam (`pNInz6obpgDQGcFmaJgB`). "הפרתיה" נכתב לקריין `הַפָּארְטִיָּה`. "שֶׁלָּכֶם" בניקוד יצא "של לוחם", בלי ניקוד יצא נכון. לבדוק כל טייק בתמלול (scribe) לפני שמשתמשים. המוזיקה והאפקטים מ-ElevenLabs (music + sound-generation).
