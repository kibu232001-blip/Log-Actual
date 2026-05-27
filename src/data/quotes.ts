// LOG ACTUAL — Logistics Quote Library
// KibuglogalVentures LLC

export interface LogisticsQuote {
  text: string
  attribution: string
}

export const LOGISTICS_QUOTES: LogisticsQuote[] = [
  { text: "Amateurs study tactics. Professionals study logistics.", attribution: "— Gen Omar Bradley, U.S. Army" },
  { text: "An army marches on its stomach.", attribution: "— Napoleon Bonaparte" },
  { text: "The line between disorder and order lies in logistics.", attribution: "— Sun Tzu, The Art of War" },
  { text: "Logistics is the ball and chain of armored warfare.", attribution: "— Field Marshal Erwin Rommel" },
  { text: "You will not find it difficult to prove that battles, campaigns, and even wars have been won or lost primarily because of logistics.", attribution: "— Gen Dwight D. Eisenhower" },
  { text: "The officer who doesn't know his communications and supply as well as his tactics is totally useless.", attribution: "— Gen George S. Patton" },
  { text: "Victory is the bright-colored flower. Transport is the stem without which it could never have blossomed.", attribution: "— Winston Churchill" },
  { text: "The history of war is the history of logistics.", attribution: "— Gen John J. Pershing" },
  { text: "In war, the first principle is to ensure your own supply lines while disrupting those of the enemy.", attribution: "— Field Marshal Helmuth von Moltke" },
  { text: "Supply is the sinew of war.", attribution: "— Chinese military proverb" },
  { text: "It takes 10 tons of supplies to keep one soldier fighting for one day.", attribution: "— U.S. Army Sustainment Doctrine" },
  { text: "The strength of an army lies in its preparation. Preparation lies in logistics.", attribution: "— ADP 4-0, U.S. Army" },
  { text: "Invincibility lies in the defense; the possibility of victory in the attack. But the possibility of sustained victory lies entirely in logistics.", attribution: "— adapted from Sun Tzu" },
  { text: "The side which is better able to sustain its forces in the field will ultimately prevail.", attribution: "— FM 4-0, Sustainment" },
  { text: "Wars are not won by fighting battles; wars are won by choosing battles.", attribution: "— Gen George S. Marshall" },
  { text: "The most difficult thing in the world is to move an army. After that, everything is easy.", attribution: "— adapted, Frederick the Great" },
  { text: "To move, shoot, and communicate — the Army requires logistics for all three.", attribution: "— U.S. Army Sustainment Center of Excellence" },
  { text: "I am convinced that successful commanders know their logistics as well as they know their tactical plans.", attribution: "— Gen Creighton Abrams" },
  { text: "The mission of sustainment is to provide support and services to ensure freedom of action, extend operational reach, and prolong endurance.", attribution: "— ADP 4-0" },
  { text: "Every time I came to a new position I tried to find out what was wanted in the way of supply before anything else.", attribution: "— Gen William T. Sherman" },
]

export function getRandomQuote(): LogisticsQuote {
  return LOGISTICS_QUOTES[Math.floor(Math.random() * LOGISTICS_QUOTES.length)]
}

export function getUniqueQuotes(count: number): LogisticsQuote[] {
  const shuffled = [...LOGISTICS_QUOTES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
