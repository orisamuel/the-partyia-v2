/**
 * deer.js: הצבי של הפרתיה, גרסה חמודה ב-SVG.
 * משמש את team.html, את המשחקים ואת הטריילר.
 *
 * Deer.svg({ body, mood, className, title }) -> SVG markup string
 *   body:  true  = צוואר, חזה ופרסות (viewBox 200x250)
 *          false = ראש בלבד (viewBox 200x192)
 *   mood:  'happy' | 'neutral' | 'wink' | 'closed'
 * Deer.sparkle(size, color) -> 4-point star SVG (כמו בלוגו)
 *
 * מצמוץ: כל מה שמסומן .deer-eye ממצמץ דרך CSS (ב-brand.css).
 * חלקים עם class לאנימציה: .deer-antlers .deer-ear-l .deer-ear-r .deer-head .deer-hooves
 */
(function () {
    const C = {
        brown: '#3a1a10',
        eye: '#2a120a',
        orange: '#E8873B',
        orangeDeep: '#D35400',
        orangeMid: '#DE7A33',
        cream: '#F6DDB0',
        creamLight: '#FBEBCB',
        night: '#0e1a2e',
    };

    function antler(mirror) {
        // ענף ראשי + שני פיצולים. mirror = הצד הימני
        const m = mirror ? 'transform="translate(200,0) scale(-1,1)"' : '';
        return `<g ${m}>
            <path d="M80 74 C 72 54, 64 40, 54 20" />
            <path d="M68 48 C 58 45, 48 46, 38 40" />
            <path d="M61 35 C 66 25, 68 16, 72 8" />
        </g>`;
    }

    function ear(side) {
        const isR = side === 'r';
        const cx = isR ? 150 : 50;
        const rot = isR ? 25 : -25;
        return `<g class="deer-ear-${side}" style="transform-origin:${isR ? 132 : 68}px 104px">
            <ellipse cx="${cx}" cy="100" rx="28" ry="13" transform="rotate(${rot} ${cx} 100)"
                fill="${C.orange}" stroke="${C.brown}" stroke-width="5"/>
            <ellipse cx="${isR ? cx - 2 : cx + 2}" cy="100" rx="16" ry="6" transform="rotate(${rot} ${cx} 100)"
                fill="${C.cream}"/>
        </g>`;
    }

    function eyes(mood) {
        if (mood === 'closed') {
            return `<g class="deer-eyes" fill="none" stroke="${C.eye}" stroke-width="4.5" stroke-linecap="round">
                <path d="M69 120 Q78 128 87 120"/><path d="M113 120 Q122 128 131 120"/>
            </g>`;
        }
        const left = mood === 'wink'
            ? `<path d="M69 120 Q78 127 87 120" fill="none" stroke="${C.eye}" stroke-width="4.5" stroke-linecap="round"/>`
            : `<g class="deer-eye"><ellipse cx="78" cy="118" rx="9.5" ry="11.5" fill="${C.eye}"/>
                <circle cx="81.5" cy="113.5" r="3.4" fill="#fff"/><circle cx="75" cy="123" r="1.6" fill="#fff" opacity=".7"/></g>`;
        const right = `<g class="deer-eye"><ellipse cx="122" cy="118" rx="9.5" ry="11.5" fill="${C.eye}"/>
                <circle cx="125.5" cy="113.5" r="3.4" fill="#fff"/><circle cx="119" cy="123" r="1.6" fill="#fff" opacity=".7"/></g>`;
        return `<g class="deer-eyes">${left}${right}</g>`;
    }

    function mouth(mood) {
        if (mood === 'neutral') {
            return `<path d="M94 170 L106 170" fill="none" stroke="${C.brown}" stroke-width="3.5" stroke-linecap="round"/>`;
        }
        return `<path d="M91 166 Q100 175 109 166" fill="none" stroke="${C.brown}" stroke-width="3.5" stroke-linecap="round"/>`;
    }

    function body() {
        return `<g class="deer-body">
            <path d="M78 170 C 74 196, 66 222, 58 246 L 142 246 C 134 222, 126 196, 122 170 Z"
                fill="${C.orangeMid}" stroke="${C.brown}" stroke-width="5" stroke-linejoin="round"/>
            <path d="M88 186 C 84 206, 82 226, 80 246 L 120 246 C 118 226, 116 206, 112 186 C 104 196, 96 196, 88 186 Z"
                fill="${C.creamLight}"/>
            <circle cx="70" cy="214" r="2.6" fill="${C.cream}"/><circle cx="130" cy="220" r="2.6" fill="${C.cream}"/>
            <circle cx="76" cy="228" r="2" fill="${C.cream}"/>
        </g>
        <g class="deer-hooves" fill="${C.brown}">
            <rect x="62" y="226" width="22" height="18" rx="8"/>
            <rect x="116" y="226" width="22" height="18" rx="8"/>
        </g>`;
    }

    function svg(opts) {
        const o = Object.assign({ body: false, mood: 'happy', className: '', title: 'הצבי של הפרתיה' }, opts || {});
        const vb = o.body ? '0 0 200 250' : '0 0 200 192';
        return `<svg class="deer ${o.className}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.title}">
            ${o.body ? body() : ''}
            <g class="deer-antlers" fill="none" stroke="${C.brown}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
                ${antler(false)}${antler(true)}
            </g>
            ${ear('l')}${ear('r')}
            <g class="deer-head">
                <path d="M100 66 C 137 66, 153 94, 149 126 C 145 158, 128 182, 100 186 C 72 182, 55 158, 51 126 C 47 94, 63 66, 100 66 Z"
                    fill="${C.orange}" stroke="${C.brown}" stroke-width="5"/>
                <path d="M100 70 C 128 72, 142 92, 144 116 C 132 98, 118 88, 100 86 C 82 88, 68 98, 56 116 C 58 92, 72 72, 100 70 Z"
                    fill="${C.orangeDeep}" opacity=".18"/>
                <g fill="${C.cream}">
                    <circle cx="90" cy="84" r="3.2"/><circle cx="101" cy="80" r="3.8"/><circle cx="112" cy="85" r="3"/>
                    <circle cx="95" cy="93" r="2.2"/><circle cx="107" cy="94" r="2"/>
                </g>
                <ellipse cx="100" cy="160" rx="31" ry="23" fill="${C.cream}"/>
                <circle cx="64" cy="142" r="8.5" fill="${C.orangeDeep}" opacity=".35"/>
                <circle cx="136" cy="142" r="8.5" fill="${C.orangeDeep}" opacity=".35"/>
                ${eyes(o.mood)}
                <ellipse cx="100" cy="150" rx="12" ry="8.5" fill="${C.brown}"/>
                <ellipse cx="96" cy="147.5" rx="3.6" ry="2.2" fill="#fff" opacity=".55"/>
                ${mouth(o.mood)}
            </g>
        </svg>`;
    }

    function sparkle(size, color) {
        const s = size || 16;
        return `<svg class="sparkle" width="${s}" height="${s}" viewBox="-10 -10 20 20" aria-hidden="true">
            <path d="M0 -10 C 1.2 -2.2, 2.2 -1.2, 10 0 C 2.2 1.2, 1.2 2.2, 0 10 C -1.2 2.2, -2.2 1.2, -10 0 C -2.2 -1.2, -1.2 -2.2, 0 -10 Z"
                fill="${color || '#FBEBCB'}"/>
        </svg>`;
    }

    window.Deer = { svg, sparkle, COLORS: C };
})();
