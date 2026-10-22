export const SACRED_MESSAGES: string[] = [
  'Some doors never open to force—only to quiet sincerity. What you have released into silence already knows its destination.',
  'No seed buried in dark earth mourns the absence of light; roots require stillness first. When its season arrives, nothing can keep it beneath the ground.',
  'Between what lives in your chest and what awaits you ahead runs an invisible thread. You took the quiet step today; let time weave the rest.',
  'The deepest waters move without sound. Do not rush what is forming—clarity always arrives in the moment your mind grows still.',
  'To commit a wish to paper is to turn longing into architecture. It is no longer merely a thought; it is a motion already underway.',
  'A single ember alters the geometry of an entire dark room. Never underestimate how far the quiet light inside you reaches.',
  'Certain delays are not refusals, only alignments. When the unseen pieces lock into place, you will understand why it could not have happened a day sooner.',
  'You cannot command the wind, yet the helm remains entirely yours. The direction you chose today leads toward calmer, wider shores.',
  'We only recognize the miracles we have made room to receive. Keep your hands unhurried and your heart unguarded.',
  'You grow lighter by what you lay down, and larger by what you dare to believe. Today you chose tomorrow over yesterday’s weight.',
  'Every true turning point begins silently, long before anyone around you notices. The universe hears whispers far more clearly than noise.',
  'Patience is not passive waiting—it is quiet certainty in a law that never fails. What you planted today is already at work beneath the surface.',
  'Some paths do not exist on any map; they appear stone by stone beneath the feet willing to walk them.',
  'Water carves through granite not by violence, but by devotion. Hold steady to the quiet persistence inside you.',
  'Nothing you have endured was wasted motion. Every detour shaped the exact person capable of holding what you just wished for.',
  'Night grows sharpest just before the horizon breaks into gold. Stay facing forward; daybreak is closer than it appears.',
  'The mind exhausts itself calculating every step, yet life keeps its finest turns just beyond calculation.',
  'What belongs to your life cannot be misplaced by distance or delayed out of existence. You have done your part—now trust the current.',
  'The moment you trust your own inner compass, all outside noise loses its authority over you. You stand in the right place.',
  'Gold is never harmed by fire; it is only freed of everything that wasn’t gold. What tested you has refined you.',
  'Sometimes strength is unclenching your hands so something rarer can rest inside them. Make room for ease.',
  'Invisible bonds outlast visible walls. Every honest intention sent outward eventually returns in an unexpected form.',
  'Stars are always present, yet only stillness and night allow us to see them. Trust the quiet passage you are walking through.',
  'A single quiet decision can tilt the arc of decades. Consider this silent moment the first page of a new chapter.',
  'Right timing is measured not by calendars, but by readiness of heart—and yours is ready for what comes next.',
  'Every locked door has its own key: some yield to effort, some to patience, and the rarest ones exclusively to pure intention.',
  'What feels distant is often just one brave thought away. Draw your horizons by the scale of your hope, never your fear.',
  'Serenity is not a harbor at the end of the voyage; it is the keel that steadies the ship through every wave.',
  'Life keeps a faithful ledger of quiet courage. In its own season, it answers generously.',
  'Do not let the shadow of what has passed dim the light of what is arriving. Unwritten pages lie wide open before you.',
  'Some answers arrive not as words, but as an unexplainable calm settling over your shoulders. When you feel it, know you were heard.',
  'When you honor what truly matters to you, the world quietly rearranges itself to meet your standard.',
  'A river never doubts that it will reach the sea, no matter how many valleys it winds through. Trust your course.',
  'There is a wisdom that belongs only to silence. Having sealed your words, let the days ahead answer you by living them out.',
  'No genuine wish vanishes into emptiness. What you placed into the dark today will return wearing light.',
  'Breathe deeply and let your shoulders drop. Everything required for your next beginning is quietly gathering in your favor.',
];

const STORAGE_KEY = 'sanctuary_global_deck_v2';

export function pickNextSacredMessage(): { message: string; numeral: string } {
  let queue: number[] = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        queue = parsed;
      }
    }
  } catch {
    queue = [];
  }

  if (queue.length === 0) {
    queue = Array.from({ length: SACRED_MESSAGES.length }, (_, i) => i);
    for (let i = queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue[i], queue[j]] = [queue[j], queue[i]];
    }
  }

  const nextIdx = queue.shift() ?? 0;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore private mode restrictions
  }

  return {
    message: SACRED_MESSAGES[nextIdx % SACRED_MESSAGES.length],
    numeral: toRoman((nextIdx % SACRED_MESSAGES.length) + 1),
  };
}

function toRoman(num: number): string {
  const lookup: Array<[string, number]> = [
    ['XL', 40],
    ['X', 10],
    ['IX', 9],
    ['V', 5],
    ['IV', 4],
    ['I', 1],
  ];
  let res = '';
  let n = num;
  for (const [sym, val] of lookup) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res;
}
