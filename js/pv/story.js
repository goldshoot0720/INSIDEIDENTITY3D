// Per-song direction for the PVs: who is on stage (left → right), colours, which moves
// flavour the choreography, and the words that bring a character into close-up.
// Cast keys are the 2D characters in ./art.js.

export const STORY = {
  s023: { cast: ['bubu', 'feng', 'tu', 'baibai'], theme: 'dream', extra: ['roll', 'point'],
    pal: { center: '#4a36b8', edge: '#0b0726', accent: '#ffd23f', accent2: '#5fd0ff' } },
  s024: { cast: ['gugu', 'feng', 'tu', 'whale'], theme: 'volt', extra: ['guitar', 'mic'],
    pal: { center: '#0b8fc0', edge: '#021624', accent: '#ffe23f', accent2: '#3fffd0' } },
  s026: { cast: ['feng', 'bubu', 'baibai', 'tu'], theme: 'meow', extra: ['paw', 'paw'],
    pal: { center: '#e2407e', edge: '#36061c', accent: '#ffe0ec', accent2: '#ffb03f' } },
  s027: { cast: ['ya', 'feng', 'tu', 'bubu'], theme: 'crown', extra: ['cash', 'point'],
    pal: { center: '#d0122e', edge: '#260005', accent: '#ffd23f', accent2: '#ffffff' } },
  s028: { cast: ['gugu', 'tu', 'feng', 'whale'], theme: 'blaze', extra: ['wrench', 'step'],
    pal: { center: '#e2541a', edge: '#260700', accent: '#ffd23f', accent2: '#3fd7ff' } },
  s029: { cast: ['ya', 'feng', 'tu', 'yu'], theme: 'wed', extra: ['heart', 'heart'],
    pal: { center: '#e8607e', edge: '#3c0c1c', accent: '#ffffff', accent2: '#ffd0dc' } },
  s062: { cast: ['whale', 'feng', 'tu', 'gugu'], theme: 'neon', extra: ['flame', 'vanish'],
    pal: { center: '#a8129e', edge: '#10001c', accent: '#3fd7ff', accent2: '#ff3fa0' } },
  s101: { cast: ['baibai', 'feng', 'whale', 'bubu'], theme: 'memo', extra: ['wave', 'heart'],
    pal: { center: '#2e7c7a', edge: '#061c1b', accent: '#ffe6a8', accent2: '#ff9a7a' } },
  s102: { cast: ['bubu', 'feng', 'tu', 'ya'], theme: 'money', extra: ['cash', 'paw'],
    pal: { center: '#1f8f4c', edge: '#03200e', accent: '#ffd23f', accent2: '#ff4a5a' } },
};

export const ORDER = ['s023', 's024', 's026', 's027', 's028', 's029', 's062', 's101', 's102'];

// a lyric that names a character pulls them into the close-up
export const MENTION = [
  ['喵布布', 'bubu'], ['喵白白', 'baibai'], ['招財喵', 'bubu'], ['本喵', 'bubu'], ['鋒', 'feng'],
  ['塗', 'tu'], ['牙妹', 'ya'], ['魚妹', 'yu'], ['鯨', 'whale'], ['咕咕', 'gugu'], ['樂團', 'gugu'],
];

// signature move for the solo roll call (moves in js/choreo.js)
export const SIG = {
  whale: 'vanish', gugu: 'guitar', ya: 'mic', yu: 'heart', feng: 'cash', tu: 'wrench', bubu: 'paw', baibai: 'paw',
};
