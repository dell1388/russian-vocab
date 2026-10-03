// Flat, poster-style SVG art generated from small specs. No external images.

const INK = '#141414';
const RED = '#c8102e';
const PAPER = '#f3e9d2';
const GOLD = '#d9a441';

const eyes = (y = 62, gap = 9, r = 2.6, color = INK) =>
  `<circle cx="${60 - gap}" cy="${y}" r="${r}" fill="${color}"/><circle cx="${60 + gap}" cy="${y}" r="${r}" fill="${color}"/>`;
const brows = (y = 55, angry = true) => angry
  ? `<path d="M46 ${y - 2} L56 ${y + 2} M74 ${y - 2} L64 ${y + 2}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`
  : `<path d="M46 ${y} L56 ${y - 1} M64 ${y - 1} L74 ${y}" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;

function body(coat) {
  return `<path d="M18 140 L26 104 Q60 86 94 104 L102 140 Z" fill="${coat}"/>
    <path d="M60 92 L52 140 M60 92 L68 140" stroke="rgba(0,0,0,.18)" stroke-width="2"/>`;
}

function hat(type, a) {
  const hair = a.hair || '#4a3020';
  switch (type) {
    case 'cap': return `<path d="M36 52 Q60 30 84 50 L90 54 L36 56 Z" fill="${INK}"/><path d="M84 52 L98 56 L84 57 Z" fill="${INK}"/>`;
    case 'peaked': return `<rect x="38" y="34" width="44" height="16" rx="3" fill="#24324a"/><rect x="36" y="48" width="48" height="5" fill="${INK}"/><path d="M60 52 L80 58 L40 58 Z" fill="${INK}"/><circle cx="60" cy="42" r="4" fill="${GOLD}"/>`;
    case 'budenovka': return `<path d="M34 58 Q34 34 60 22 Q86 34 86 58 Z" fill="#6b5b3a"/><path d="M60 22 L60 12" stroke="#6b5b3a" stroke-width="4"/>${star(60, 44, 8, RED)}`;
    case 'helmet': return `<circle cx="60" cy="60" r="34" fill="#f5f5f5" stroke="${INK}" stroke-width="2"/><path d="M38 56 Q60 44 82 56 L82 72 Q60 84 38 72 Z" fill="rgba(80,140,200,.35)"/><text x="60" y="34" font-size="9" text-anchor="middle" font-family="Russo One, sans-serif" fill="${RED}">СССР</text>`;
    case 'kerchief': return `<path d="M32 66 Q30 32 60 30 Q90 32 88 66 L96 92 L60 74 L24 92 Z" fill="${a.scarf || RED}"/><g fill="#fff" opacity=".85"><circle cx="48" cy="40" r="2"/><circle cx="66" cy="36" r="2"/><circle cx="78" cy="48" r="2"/><circle cx="40" cy="56" r="2"/><circle cx="84" cy="64" r="2"/></g>`;
    case 'ushanka': return `<path d="M30 56 Q30 26 60 26 Q90 26 90 56 Z" fill="#7a5a3a"/><rect x="26" y="52" width="14" height="30" rx="6" fill="#7a5a3a"/><rect x="80" y="52" width="14" height="30" rx="6" fill="#7a5a3a"/><rect x="32" y="46" width="56" height="12" rx="5" fill="#8f6c48"/>${star(60, 40, 7, RED)}`;
    case 'beret': return `<ellipse cx="56" cy="40" rx="28" ry="10" fill="${INK}" transform="rotate(-10 56 40)"/><circle cx="56" cy="30" r="3" fill="${INK}"/>`;
    case 'bun': return `<circle cx="60" cy="32" r="11" fill="${hair}"/><path d="M36 56 Q38 34 60 36 Q82 34 84 56 Q74 44 60 44 Q46 44 36 56 Z" fill="${hair}"/>`;
    case 'hockey': return `<path d="M34 60 Q34 30 60 30 Q86 30 86 60 Z" fill="${RED}"/><path d="M40 60 L80 60 M40 68 L80 68 M40 76 L80 76 M48 58 L48 82 M60 58 L60 84 M72 58 L72 82" stroke="#bbb" stroke-width="1.6"/>`;
    case 'pilotka': return `<path d="M40 44 L82 38 L80 48 L42 50 Z" fill="#1f3d6b"/><circle cx="72" cy="43" r="2.5" fill="${GOLD}"/><path d="M36 60 Q36 42 50 40 L40 66 Z M84 60 Q84 42 72 40 L82 66 Z" fill="${hair}"/>`;
    case 'kokoshnik': return `<path d="M30 58 Q30 10 60 10 Q90 10 90 58 Z" fill="${RED}"/><path d="M36 56 Q36 18 60 18 Q84 18 84 56" fill="none" stroke="${GOLD}" stroke-width="3"/><circle cx="60" cy="30" r="5" fill="#2bb673"/><circle cx="46" cy="40" r="3" fill="${GOLD}"/><circle cx="74" cy="40" r="3" fill="${GOLD}"/>`;
    case 'crown': return `<path d="M36 44 L40 22 L50 36 L60 16 L70 36 L80 22 L84 44 Z" fill="${GOLD}" stroke="${INK}" stroke-width="2"/>`;
    case 'antlers': return `<path d="M44 42 L34 22 M34 22 L26 26 M34 22 L32 12 M76 42 L86 22 M86 22 L94 26 M86 22 L88 12" stroke="#5a4028" stroke-width="4" stroke-linecap="round"/>`;
    case 'bucket': return `<path d="M42 24 L78 24 L74 46 L46 46 Z" fill="#8a8f96"/><rect x="40" y="44" width="40" height="4" fill="#6c7178"/>`;
    case 'ears': return `<path d="M36 50 L32 22 L52 40 Z M84 50 L88 22 L68 40 Z" fill="${a.coat}"/><path d="M38 46 L36 30 L48 42 Z M82 46 L84 30 L72 42 Z" fill="#e8a0a0" opacity=".6"/>`;
    default: return '';
  }
}

function acc(type, a) {
  switch (type) {
    case 'stripes': return `<path d="M30 108 L24 140 M36 106 L30 140 M42 104 L36 140 M90 108 L96 140 M84 106 L90 140 M78 104 L84 140" stroke="#fff" stroke-width="2.4"/>`;
    case 'badge': return `<rect x="70" y="108" width="12" height="8" fill="${GOLD}"/>`;
    case 'beard': return `<path d="M40 66 Q42 98 60 104 Q78 98 80 66 Q70 78 60 78 Q50 78 40 66 Z" fill="${a.beard || '#d8d0b8'}"/>`;
    case 'beardwhite': return `<path d="M36 64 Q36 108 60 116 Q84 108 84 64 Q72 80 60 80 Q48 80 36 64 Z" fill="#ffffff" stroke="#c8d4e0" stroke-width="1.5"/>`;
    case 'glasses': return `<circle cx="51" cy="62" r="7" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="69" cy="62" r="7" fill="none" stroke="${INK}" stroke-width="2"/><path d="M58 62 L62 62" stroke="${INK}" stroke-width="2"/>`;
    case 'scarf': return `<path d="M44 90 L76 90 L72 100 L48 100 Z" fill="${RED}"/>`;
    case 'nose': return `<path d="M60 60 L72 76 L60 74 Z" fill="#b8916b"/>`;
    case 'gems': return `<circle cx="60" cy="104" r="5" fill="#2bb673"/><circle cx="48" cy="100" r="3" fill="#2bb673"/><circle cx="72" cy="100" r="3" fill="#2bb673"/>`;
    case 'carrot': return `<path d="M60 64 L84 68 L60 70 Z" fill="#e8742a"/>`;
    case 'cccp': return `<text x="60" y="124" font-size="11" text-anchor="middle" font-family="Russo One, sans-serif" fill="${RED}">СССР</text>`;
    case 'tigerstripes': return `<path d="M46 44 L50 52 M60 40 L60 50 M74 44 L70 52 M40 62 L46 64 M80 62 L74 64" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    default: return '';
  }
}

export function star(cx, cy, r, fill, rot = -90) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.42 : r;
    const ang = ((rot + i * 36) * Math.PI) / 180;
    pts.push(`${(cx + rr * Math.cos(ang)).toFixed(1)},${(cy + rr * Math.sin(ang)).toFixed(1)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

function rays(color, n = 16) {
  let s = '';
  for (let i = 0; i < n; i += 2) {
    const a1 = (i / n) * Math.PI * 2;
    const a2 = ((i + 1) / n) * Math.PI * 2;
    s += `<path d="M60 70 L${60 + 140 * Math.cos(a1)} ${70 + 140 * Math.sin(a1)} L${60 + 140 * Math.cos(a2)} ${70 + 140 * Math.sin(a2)} Z" fill="${color}"/>`;
  }
  return s;
}

function head(a) {
  const skin = a.skin || '#efc6a0';
  switch (a.kind) {
    case 'beast': {
      let snout = '';
      if (a.snout === 'wolf') snout = `<path d="M48 66 L60 92 L72 66 Z" fill="${a.skin}"/><circle cx="60" cy="88" r="4" fill="${INK}"/>`;
      if (a.snout === 'bear') snout = `<ellipse cx="60" cy="76" rx="13" ry="10" fill="#c49a6c"/><ellipse cx="60" cy="71" rx="5" ry="3.5" fill="${INK}"/>`;
      if (a.snout === 'cat') snout = `<ellipse cx="60" cy="76" rx="11" ry="8" fill="#f4e6d0"/><path d="M57 71 L63 71 L60 75 Z" fill="${INK}"/><path d="M40 74 L28 72 M40 78 L28 80 M80 74 L92 72 M80 78 L92 80" stroke="${INK}" stroke-width="1.5"/>`;
      return `${body(a.coat)}${hat('ears', a)}<ellipse cx="60" cy="64" rx="27" ry="25" fill="${skin}"/>${acc(a.acc, a)}${snout}${eyes(60, 10, 3)}${brows(52)}`;
    }
    case 'insect':
      return `<ellipse cx="34" cy="70" rx="26" ry="10" fill="rgba(200,220,240,.7)" transform="rotate(-25 34 70)"/><ellipse cx="86" cy="70" rx="26" ry="10" fill="rgba(200,220,240,.7)" transform="rotate(25 86 70)"/>
        <ellipse cx="60" cy="100" rx="12" ry="26" fill="${a.coat}"/><path d="M50 92 L30 120 M50 100 L32 132 M70 92 L90 120 M70 100 L88 132" stroke="${INK}" stroke-width="2"/>
        <circle cx="60" cy="64" r="15" fill="${a.skin}"/><path d="M60 72 L60 104" stroke="${INK}" stroke-width="2.5" transform="rotate(30 60 72)"/>${eyes(60, 7, 4.5, RED)}`;
    case 'seal':
      return `<path d="M20 140 Q20 70 60 56 Q100 70 100 140 Z" fill="${a.coat}"/><circle cx="60" cy="72" r="26" fill="${a.skin}"/>${eyes(66, 10, 5)}<circle cx="49" cy="64" r="1.5" fill="#fff"/><circle cx="69" cy="64" r="1.5" fill="#fff"/><ellipse cx="60" cy="80" rx="5" ry="3" fill="${INK}"/><path d="M50 84 L32 82 M50 87 L32 90 M70 84 L88 82 M70 87 L88 90" stroke="${INK}" stroke-width="1.2"/>`;
    case 'snow':
      return `<circle cx="60" cy="122" r="28" fill="${a.coat}" stroke="#cfd8e0" stroke-width="2"/><circle cx="60" cy="88" r="20" fill="#fff" stroke="#cfd8e0" stroke-width="2"/><circle cx="60" cy="60" r="16" fill="#fff" stroke="#cfd8e0" stroke-width="2"/>${hat(a.hat, a)}${acc(a.acc, a)}<circle cx="54" cy="56" r="2.5" fill="${INK}"/><circle cx="66" cy="56" r="2.5" fill="${INK}"/><circle cx="60" cy="86" r="2.5" fill="${INK}"/><circle cx="60" cy="96" r="2.5" fill="${INK}"/><path d="M38 88 L18 70 M82 88 L102 72" stroke="#5a4028" stroke-width="3"/>`;
    case 'storm':
      return `<path d="M20 90 Q14 62 40 60 Q44 36 70 42 Q92 34 98 60 Q114 70 100 90 Z" fill="${a.coat}"/><path d="M26 104 Q60 92 96 104 M32 118 Q60 108 90 118 M40 132 Q60 124 82 132" stroke="#9fb3c8" stroke-width="3" fill="none"/>${eyes(68, 12, 3.5, '#2b4a6b')}${brows(60)}<path d="M52 80 Q60 76 68 80" stroke="#2b4a6b" stroke-width="2.5" fill="none"/>`;
    case 'dragon': {
      const h = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y + 40})"><path d="M${x - 6} ${y + 40} Q${x} ${y + 20} ${x} ${y}" stroke="${a.coat}" stroke-width="12" fill="none"/><ellipse cx="${x}" cy="${y}" rx="14" ry="11" fill="${a.skin}"/><path d="M${x + 6} ${y + 2} L${x + 20} ${y + 4} L${x + 8} ${y + 8} Z" fill="${a.skin}"/><circle cx="${x - 4}" cy="${y - 3}" r="2.5" fill="${GOLD}"/><path d="M${x - 10} ${y - 8} L${x - 14} ${y - 18} M${x - 2} ${y - 10} L${x} ${y - 20}" stroke="${a.coat}" stroke-width="3"/></g>`;
      return `<path d="M14 140 Q30 96 60 94 Q90 96 106 140 Z" fill="${a.coat}"/><path d="M24 104 L4 80 L30 96 M96 104 L116 80 L90 96" fill="#245224" stroke="#245224" stroke-width="4"/>${h(32, 58, -12)}${h(60, 40, 0)}${h(88, 58, 12)}`;
    }
    case 'skeleton':
      return `<path d="M22 140 L30 100 Q60 88 90 100 L98 140 Z" fill="${a.coat}"/><path d="M48 102 L48 132 M60 100 L60 136 M72 102 L72 132" stroke="#e9e4d4" stroke-width="2"/>${hat(a.hat, a)}<ellipse cx="60" cy="62" rx="20" ry="23" fill="${a.skin}"/><circle cx="52" cy="60" r="5.5" fill="${INK}"/><circle cx="68" cy="60" r="5.5" fill="${INK}"/><circle cx="52" cy="60" r="1.5" fill="${RED}"/><circle cx="68" cy="60" r="1.5" fill="${RED}"/><path d="M58 70 L60 74 L62 70 Z" fill="${INK}"/><path d="M50 79 L70 79 M53 76 L53 82 M57 76 L57 82 M61 76 L61 82 M65 76 L65 82" stroke="${INK}" stroke-width="1.5"/>`;
    case 'spirit':
    case 'human':
    default: {
      const glow = a.kind === 'spirit' ? '#f2d16b' : INK;
      const medals = a.medals ? `${star(44, 112, 5, GOLD)}${star(56, 114, 5, RED)}<rect x="66" y="108" width="14" height="4" fill="${RED}"/><rect x="66" y="113" width="14" height="4" fill="${GOLD}"/>` : '';
      const behindHat = ['kerchief', 'helmet'].includes(a.hat);
      return `${body(a.coat)}${medals}${behindHat && a.hat === 'kerchief' ? hat(a.hat, a) : ''}<rect x="52" y="80" width="16" height="12" fill="${skin}"/>
        <ellipse cx="60" cy="62" rx="22" ry="24" fill="${skin}"/>${eyes(62, 9, 2.6, glow)}${brows(55, a.kind === 'spirit' || !!a.angry)}
        <path d="M52 76 Q60 79 68 76" stroke="${INK}" stroke-width="2" fill="none"/>${acc(a.acc, a)}${behindHat && a.hat === 'kerchief' ? '' : hat(a.hat, a)}`;
    }
  }
}

/** Portrait SVG string. opts: {bg: 'circle'|'rays'|'none', bgColor, flip} */
export function portrait(a, opts = {}) {
  const bg = opts.bg || 'circle';
  const bgColor = opts.bgColor || RED;
  let back = '';
  if (bg === 'circle') back = `<circle cx="60" cy="70" r="56" fill="${bgColor}" opacity=".9"/>`;
  if (bg === 'rays') back = `<rect width="120" height="140" fill="${bgColor}"/>${rays('rgba(255,255,255,.14)')}`;
  if (bg === 'square') back = `<rect x="6" y="10" width="108" height="124" fill="${bgColor}" transform="rotate(-4 60 70)"/>`;
  const flip = opts.flip ? ' transform="translate(120 0) scale(-1 1)"' : '';
  return `<svg viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" class="portrait" aria-hidden="true">${back}<g${flip}>${head(a)}</g></svg>`;
}

// ---- Badges (значки) for relics ----
const PICTO = {
  star: (c) => star(32, 33, 13, c),
  matryoshka: (c) => `<ellipse cx="32" cy="38" rx="11" ry="13" fill="${c}"/><circle cx="32" cy="22" r="8" fill="${c}"/><circle cx="32" cy="23" r="5" fill="${PAPER}"/>`,
  samovar: (c) => `<path d="M22 44 L42 44 L46 28 Q32 18 18 28 Z" fill="${c}"/><rect x="28" y="14" width="8" height="6" fill="${c}"/><path d="M46 34 L54 30" stroke="${c}" stroke-width="3"/><rect x="24" y="44" width="16" height="4" fill="${c}"/>`,
  ushanka: (c) => `<path d="M16 36 Q16 16 32 16 Q48 16 48 36 Z" fill="${c}"/><rect x="14" y="32" width="8" height="14" rx="3" fill="${c}"/><rect x="42" y="32" width="8" height="14" rx="3" fill="${c}"/>`,
  balalaika: (c) => `<path d="M32 50 L18 46 L32 22 L46 46 Z" fill="${c}"/><rect x="30" y="8" width="4" height="16" fill="${c}"/>`,
  valenki: (c) => `<path d="M22 14 L34 14 L34 38 L48 38 Q50 48 40 48 L22 48 Z" fill="${c}"/>`,
  bowl: (c) => `<path d="M14 30 L50 30 Q48 48 32 48 Q16 48 14 30 Z" fill="${c}"/><path d="M24 26 Q26 18 24 12 M34 26 Q36 18 34 12" stroke="${c}" stroke-width="2.5" fill="none"/>`,
  pie: (c) => `<path d="M14 40 Q32 14 50 40 Z" fill="${c}"/><path d="M22 34 L26 30 M30 32 L34 28 M38 34 L42 30" stroke="${PAPER}" stroke-width="2"/>`,
  feather: (c) => `<path d="M18 50 Q24 18 48 12 Q42 40 18 50 Z" fill="${c}"/><path d="M18 50 L40 22" stroke="${PAPER}" stroke-width="2"/>`,
  ice: (c) => `<path d="M32 12 L32 52 M14 22 L50 42 M50 22 L14 42" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`,
  egg: (c) => `<ellipse cx="32" cy="34" rx="13" ry="17" fill="${c}"/><path d="M20 32 L44 32 M21 40 L43 40" stroke="${PAPER}" stroke-width="2"/>`,
  tea: (c) => `<path d="M20 18 L44 18 L40 48 L24 48 Z" fill="${c}"/><path d="M44 24 Q54 28 44 38" stroke="${c}" stroke-width="3" fill="none"/>`,
  typewriter: (c) => `<rect x="12" y="28" width="40" height="18" rx="3" fill="${c}"/><rect x="20" y="14" width="24" height="12" fill="${c}" opacity=".6"/>`,
  abacus: (c) => `<rect x="14" y="14" width="36" height="36" fill="none" stroke="${c}" stroke-width="3"/><path d="M14 26 L50 26 M14 38 L50 38" stroke="${c}" stroke-width="2"/><circle cx="22" cy="26" r="3" fill="${c}"/><circle cx="30" cy="26" r="3" fill="${c}"/><circle cx="40" cy="38" r="3" fill="${c}"/>`,
  shoe: (c) => `<path d="M14 44 Q30 36 40 20 L48 24 Q44 44 22 50 Z" fill="${c}"/>`,
  helmet: (c) => `<circle cx="32" cy="32" r="18" fill="${c}"/><rect x="20" y="26" width="24" height="12" rx="5" fill="${PAPER}"/>`,
  dumpling: (c) => `<path d="M12 38 Q32 12 52 38 Q32 46 12 38 Z" fill="${c}"/>`,
  book: (c) => `<rect x="16" y="14" width="32" height="36" fill="${c}"/><rect x="20" y="20" width="24" height="4" fill="${PAPER}"/>`,
  accordion: (c) => `<rect x="12" y="20" width="10" height="26" fill="${c}"/><rect x="42" y="20" width="10" height="26" fill="${c}"/><path d="M22 20 L27 46 L32 20 L37 46 L42 20" stroke="${c}" stroke-width="3" fill="none"/>`,
  hammer: (c) => `<path d="M20 44 L40 20 M34 14 L46 26" stroke="${c}" stroke-width="5" stroke-linecap="round"/><path d="M18 22 Q14 40 32 48" stroke="${c}" stroke-width="4" fill="none"/>`,
  horse: (c) => `<path d="M18 48 L22 28 Q24 16 36 16 L46 22 L42 28 L36 26 L34 48 Z" fill="${c}"/>`,
  mug: (c) => `<rect x="18" y="16" width="22" height="32" fill="${c}"/><path d="M40 22 Q50 26 40 40" stroke="${c}" stroke-width="3" fill="none"/>`,
  telegram: (c) => `<rect x="12" y="18" width="40" height="28" fill="${c}"/><path d="M12 18 L32 34 L52 18" stroke="${PAPER}" stroke-width="2.5" fill="none"/>`,
  newspaper: (c) => `<rect x="14" y="14" width="36" height="36" fill="${c}"/><path d="M20 22 L44 22 M20 30 L44 30 M20 36 L36 36 M20 42 L40 42" stroke="${PAPER}" stroke-width="2.5"/>`,
  sputnik: (c) => `<circle cx="28" cy="30" r="10" fill="${c}"/><path d="M34 38 L52 52 M30 40 L40 56 M20 38 L12 54" stroke="${c}" stroke-width="2"/>`,
  clock: (c) => `<circle cx="32" cy="34" r="16" fill="${c}"/><path d="M32 34 L32 24 M32 34 L40 38" stroke="${PAPER}" stroke-width="3"/><rect x="28" y="12" width="8" height="5" fill="${c}"/>`,
  medal: (c) => `<path d="M24 10 L32 26 L40 10" stroke="${c}" stroke-width="5" fill="none"/><circle cx="32" cy="38" r="12" fill="${c}"/>${star(32, 38, 7, PAPER)}`,
  lapti: (c) => `<ellipse cx="32" cy="38" rx="18" ry="10" fill="${c}"/><path d="M18 36 L46 36 M20 42 L44 42" stroke="${PAPER}" stroke-width="1.5"/>`,
  crown: (c) => `<path d="M14 46 Q14 14 32 14 Q50 14 50 46 Z" fill="${c}"/><circle cx="32" cy="28" r="4" fill="${PAPER}"/>`,
  crown2: (c) => `<path d="M14 44 Q14 20 32 16 Q50 20 50 44 Z" fill="${c}"/><path d="M32 16 L32 6 M27 10 L37 10" stroke="${c}" stroke-width="3"/><rect x="12" y="42" width="40" height="6" fill="${c}"/>`,
  caviar: (c) => `<ellipse cx="32" cy="40" rx="20" ry="8" fill="${c}"/><g fill="${PAPER}"><circle cx="26" cy="36" r="3"/><circle cx="33" cy="34" r="3"/><circle cx="39" cy="37" r="3"/></g>`,
  train: (c) => `<rect x="12" y="24" width="30" height="18" fill="${c}"/><rect x="34" y="16" width="10" height="10" fill="${c}"/><rect x="16" y="12" width="6" height="12" fill="${c}"/><circle cx="20" cy="46" r="5" fill="${c}"/><circle cx="36" cy="46" r="5" fill="${c}"/>`,
  bear: (c) => `<circle cx="32" cy="34" r="15" fill="${c}"/><circle cx="20" cy="20" r="6" fill="${c}"/><circle cx="44" cy="20" r="6" fill="${c}"/><circle cx="32" cy="38" r="5" fill="${PAPER}"/>`,
  key: (c) => `<circle cx="22" cy="24" r="9" fill="none" stroke="${c}" stroke-width="5"/><path d="M28 30 L48 50 M40 42 L46 36 M44 46 L50 40" stroke="${c}" stroke-width="5"/>`,
  honey: (c) => `<path d="M20 22 L44 22 L46 48 L18 48 Z" fill="${c}"/><rect x="18" y="14" width="28" height="8" fill="${c}" opacity=".6"/>`,
  sugar: (c) => `<rect x="18" y="18" width="28" height="28" fill="${c}"/><path d="M18 18 L26 12 L54 12 L46 18 M46 46 L54 40 L54 12" fill="${c}" opacity=".6"/>`,
  paper: (c) => `<path d="M18 12 L40 12 L48 20 L48 52 L18 52 Z" fill="${c}"/><path d="M24 24 L42 24 M24 32 L42 32 M24 40 L36 40" stroke="${PAPER}" stroke-width="2.5"/>`,
  snowball: (c) => `<circle cx="32" cy="34" r="16" fill="${c}"/><circle cx="26" cy="28" r="4" fill="${PAPER}" opacity=".7"/>`,
  mirror: (c) => `<ellipse cx="32" cy="28" rx="14" ry="17" fill="${c}"/><ellipse cx="32" cy="28" rx="9" ry="12" fill="${PAPER}" opacity=".6"/><rect x="29" y="44" width="6" height="12" fill="${c}"/>`,
  cards: (c) => `<rect x="14" y="16" width="20" height="30" rx="2" fill="${c}" transform="rotate(-12 24 31)"/><rect x="30" y="16" width="20" height="30" rx="2" fill="${c}" transform="rotate(12 40 31)"/>`,
  eye: (c) => `<path d="M10 32 Q32 12 54 32 Q32 52 10 32 Z" fill="${c}"/><circle cx="32" cy="32" r="7" fill="${PAPER}"/>`,
  knight: (c) => `<path d="M20 50 L44 50 L42 42 L38 42 Q44 30 38 18 L30 12 L28 18 Q18 24 20 34 L28 32 L24 42 Z" fill="${c}"/>`,
  passport: (c) => `<rect x="18" y="12" width="28" height="40" rx="2" fill="${c}"/>${star(32, 28, 7, GOLD)}`,
  tree: (c) => `<path d="M32 10 L48 34 L40 34 L52 50 L12 50 L24 34 L16 34 Z" fill="${c}"/>`,
  steam: (c) => `<path d="M20 50 Q14 40 20 32 Q26 24 20 14 M32 50 Q26 40 32 32 Q38 24 32 14 M44 50 Q38 40 44 32 Q50 24 44 14" stroke="${c}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  box: (c) => `<rect x="14" y="24" width="36" height="24" fill="${c}"/><rect x="12" y="18" width="40" height="8" fill="${c}"/><text x="32" y="44" font-size="16" text-anchor="middle" fill="${PAPER}" font-family="Russo One">?</text>`,
  quill: (c) => `<path d="M16 50 Q20 20 50 12 Q40 36 16 50 Z" fill="${c}"/>`,
  fist: (c) => `<rect x="18" y="20" width="28" height="22" rx="6" fill="${c}"/><rect x="24" y="40" width="16" height="14" fill="${c}"/><path d="M25 20 L25 32 M32 20 L32 32 M39 20 L39 32" stroke="${PAPER}" stroke-width="2"/>`,
  skull: (c) => `<path d="M16 32 Q16 12 32 12 Q48 12 48 32 L44 40 L44 48 L20 48 L20 40 Z" fill="${c}"/><circle cx="25" cy="30" r="5" fill="${PAPER}"/><circle cx="39" cy="30" r="5" fill="${PAPER}"/>`,
  rouble: (c) => `<text x="32" y="46" font-size="38" text-anchor="middle" fill="${c}" font-family="Russo One, sans-serif">₽</text>`,
  question: (c) => `<text x="32" y="48" font-size="42" text-anchor="middle" fill="${c}" font-family="Russo One, sans-serif">?</text>`,
  chest: (c) => `<rect x="12" y="26" width="40" height="22" fill="${c}"/><path d="M12 26 Q32 8 52 26 Z" fill="${c}"/><rect x="28" y="30" width="8" height="8" fill="${GOLD}"/>`,
  city: (c) => `<rect x="10" y="30" width="12" height="20" fill="${c}"/><rect x="26" y="20" width="12" height="30" fill="${c}"/><path d="M26 20 Q32 6 38 20 Z" fill="${c}"/><rect x="42" y="26" width="12" height="24" fill="${c}"/>`,
};

const RARITY_COLOR = { common: '#8c1d1d', rare: '#1d4e89', legendary: '#b8860b' };

export function badge(icon, rarity = 'common', size = 56) {
  const c = RARITY_COLOR[rarity] || RED;
  const shape = rarity === 'legendary'
    ? star(32, 32, 31, GOLD) + `<circle cx="32" cy="33" r="17" fill="${PAPER}"/>`
    : rarity === 'rare'
      ? `<polygon points="32,2 60,22 50,58 14,58 4,22" fill="${c}"/><polygon points="32,9 53,24 45,52 19,52 11,24" fill="${PAPER}"/>`
      : `<circle cx="32" cy="32" r="29" fill="${c}"/><circle cx="32" cy="32" r="23" fill="${PAPER}"/>`;
  const pic = (PICTO[icon] || PICTO.star)(rarity === 'legendary' ? RED : c);
  const scale = rarity === 'legendary' ? 0.55 : 0.72;
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" class="badge" aria-hidden="true">${shape}<g transform="translate(32 33) scale(${scale}) translate(-32 -32)">${pic}</g></svg>`;
}

export function icon(name, color = INK, size = 28) {
  const pic = (PICTO[name] || PICTO.star)(color);
  return `<svg viewBox="0 0 64 64" width="${size}" height="${size}" aria-hidden="true">${pic}</svg>`;
}
