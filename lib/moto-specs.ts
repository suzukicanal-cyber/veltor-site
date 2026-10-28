// Engine displacement and class of motorcycles by model — for catalog filters.
// Posts rarely mention the displacement, so it comes from this table; a value written in the post wins.
// New models: add a line here (brand, pattern for the model, cc, class). Unknown models fall back to keywords.
import type { Lot } from "./lots";

export const MOTO_CLASSES = [
  "Спортбайки",
  "Нейкеды",
  "Круизеры",
  "Туристические",
  "Спорт-туристы",
  "Эндуро-туристы",
  "Ретро и классика",
  "Скутеры",
  "Трициклы",
] as const;
export type MotoClass = (typeof MOTO_CLASSES)[number];

type Rule = [brand: string, model: RegExp, cc: number | null, cls: MotoClass];

const R: Rule[] = [
  // BMW
  ["BMW", /^CE ?0?4/i, null, "Скутеры"],
  ["BMW", /^C ?(400|650)/i, 350, "Скутеры"],
  ["BMW", /^F ?800 ?R\b/i, 798, "Нейкеды"],
  ["BMW", /^F ?(850|900) ?GS/i, 895, "Эндуро-туристы"],
  ["BMW", /^F ?900 ?XR/i, 895, "Спорт-туристы"],
  ["BMW", /^F ?900 ?R\b/i, 895, "Нейкеды"],
  ["BMW", /^HP4/i, 999, "Спортбайки"],
  ["BMW", /^K ?1600 ?(B|Grand America)/i, 1649, "Туристические"],
  ["BMW", /^K ?1600/i, 1649, "Туристические"],
  ["BMW", /^M ?1000 ?RR/i, 999, "Спортбайки"],
  ["BMW", /^M ?1000 ?XR/i, 999, "Спорт-туристы"],
  ["BMW", /^M ?1000 ?R\b/i, 999, "Нейкеды"],
  ["BMW", /^R ?12 ?nine ?T/i, 1170, "Ретро и классика"],
  ["BMW", /^R ?12\b/i, 1170, "Круизеры"],
  ["BMW", /^R ?nine ?T/i, 1170, "Ретро и классика"],
  ["BMW", /^R ?18/i, 1802, "Круизеры"],
  ["BMW", /^R ?1200 ?GS/i, 1170, "Эндуро-туристы"],
  ["BMW", /^R ?1200 ?RT/i, 1170, "Туристические"],
  ["BMW", /^R ?1250 ?GS/i, 1254, "Эндуро-туристы"],
  ["BMW", /^R ?1250 ?RT/i, 1254, "Туристические"],
  ["BMW", /^R ?1250 ?RS/i, 1254, "Спорт-туристы"],
  ["BMW", /^R ?1300 ?GS/i, 1300, "Эндуро-туристы"],
  ["BMW", /^R ?1300 ?RT/i, 1300, "Туристические"],
  ["BMW", /^R ?1300 ?R(S|\b)/i, 1300, "Спорт-туристы"],
  ["BMW", /^S ?1000 ?RR/i, 999, "Спортбайки"],
  ["BMW", /^S ?1000 ?XR/i, 999, "Спорт-туристы"],
  ["BMW", /^S ?1000 ?R\b/i, 999, "Нейкеды"],
  // Ducati
  ["Ducati", /^959/i, 955, "Спортбайки"],
  ["Ducati", /^Panigale V2/i, 955, "Спортбайки"],
  ["Ducati", /Panigale V4/i, 1103, "Спортбайки"],
  ["Ducati", /^XDiavel/i, 1158, "Круизеры"],
  ["Ducati", /^Diavel 1260/i, 1262, "Круизеры"],
  ["Ducati", /^Diavel/i, 1158, "Круизеры"],
  ["Ducati", /^Monster 821/i, 821, "Нейкеды"],
  ["Ducati", /^Monster/i, 937, "Нейкеды"],
  ["Ducati", /^Multistrada 1200/i, 1198, "Эндуро-туристы"],
  ["Ducati", /^Multistrada V2/i, 937, "Эндуро-туристы"],
  ["Ducati", /^Multistrada V4/i, 1158, "Эндуро-туристы"],
  ["Ducati", /^Streetfighter V2/i, 955, "Нейкеды"],
  ["Ducati", /^Streetfighter V4/i, 1103, "Нейкеды"],
  ["Ducati", /^Scrambler/i, 803, "Ретро и классика"],
  // Harley-Davidson
  ["Harley-Davidson", /117/, 1923, "Круизеры"],
  ["Harley-Davidson", /^(Street|Road) Glide|^Ultra|^Electra|^Road King/i, 1868, "Туристические"],
  ["Harley-Davidson", /^Low Rider ST/i, 1923, "Круизеры"],
  ["Harley-Davidson", /^Sportster S\b/i, 1252, "Круизеры"],
  ["Harley-Davidson", /^Nightster/i, 975, "Круизеры"],
  ["Harley-Davidson", /^Sportster.*1200|Forty-Eight|Iron 1200/i, 1202, "Круизеры"],
  ["Harley-Davidson", /^Sportster.*883|Iron 883/i, 883, "Круизеры"],
  ["Harley-Davidson", /107/, 1746, "Круизеры"],
  ["Harley-Davidson", /114/, 1868, "Круизеры"],
  ["Harley-Davidson", /^V-?Rod/i, 1247, "Круизеры"],
  ["Harley-Davidson", /^Pan America/i, 1252, "Эндуро-туристы"],
  // Honda
  ["Honda", /^CBR ?1000/i, 999, "Спортбайки"],
  ["Honda", /^CBR ?650/i, 649, "Спортбайки"],
  ["Honda", /^CBR ?600/i, 599, "Спортбайки"],
  ["Honda", /^CB ?650/i, 649, "Нейкеды"],
  ["Honda", /^CB ?1000/i, 998, "Нейкеды"],
  ["Honda", /^Gold ?Wing/i, 1833, "Туристические"],
  ["Honda", /^NSR ?150/i, 150, "Спортбайки"],
  ["Honda", /^NT ?1100/i, 1084, "Спорт-туристы"],
  ["Honda", /^Rebel ?1100/i, 1084, "Круизеры"],
  ["Honda", /^Rebel ?500/i, 471, "Круизеры"],
  ["Honda", /^Shadow ?1100/i, 1099, "Круизеры"],
  ["Honda", /^(CRF ?1100|Africa Twin)/i, 1084, "Эндуро-туристы"],
  ["Honda", /^(PCX|Forza|ADV|X-ADV)/i, null, "Скутеры"],
  // others
  ["Husqvarna", /^Norden ?901/i, 889, "Эндуро-туристы"],
  ["Indian", /^Scout/i, 1250, "Круизеры"],
  ["Indian", /^(Chief|Chieftain|Roadmaster|Challenger)/i, 1890, "Туристические"],
  ["KTM", /^1290 Super Adventure/i, 1301, "Эндуро-туристы"],
  ["KTM", /^1290 Super Duke/i, 1301, "Нейкеды"],
  ["KTM", /^(790|890) Adventure/i, 889, "Эндуро-туристы"],
  ["KTM", /^990 Duke/i, 947, "Нейкеды"],
  ["KTM", /^(790|890) Duke/i, 889, "Нейкеды"],
  ["Kawasaki", /^H2 ?SX/i, 998, "Спорт-туристы"],
  ["Kawasaki", /^Ninja ?(1000 ?SX|1000SX)/i, 1043, "Спорт-туристы"],
  ["Kawasaki", /^Z ?1000 ?SX/i, 1043, "Спорт-туристы"],
  ["Kawasaki", /^Ninja ZX-10R/i, 998, "Спортбайки"],
  ["Kawasaki", /^Ninja ZX-6R/i, 636, "Спортбайки"],
  ["Kawasaki", /^Ninja H2/i, 998, "Спортбайки"],
  ["Kawasaki", /^Z ?H2/i, 998, "Нейкеды"],
  ["Kawasaki", /^Z ?900 ?RS/i, 948, "Ретро и классика"],
  ["Kawasaki", /^Z ?900/i, 948, "Нейкеды"],
  ["Kawasaki", /^Z ?650/i, 649, "Нейкеды"],
  ["Kawasaki", /^Vulcan/i, 649, "Круизеры"],
  ["MV Agusta", /^F3/i, 798, "Спортбайки"],
  ["MV Agusta", /^(Rush|Brutale) ?1000/i, 998, "Нейкеды"],
  ["MV Agusta", /^Brutale/i, 798, "Нейкеды"],
  ["Rewaco", /.*/, 1499, "Трициклы"],
  ["Suzuki", /^GSX-8R/i, 776, "Спортбайки"],
  ["Suzuki", /^GSX-8S/i, 776, "Нейкеды"],
  ["Suzuki", /^GSX-R ?1000/i, 999, "Спортбайки"],
  ["Suzuki", /^GSX-R ?750/i, 750, "Спортбайки"],
  ["Suzuki", /^GSX-R ?600/i, 599, "Спортбайки"],
  ["Suzuki", /^GSX-S ?1000 ?GT/i, 999, "Спорт-туристы"],
  ["Suzuki", /^GSX-S ?1000/i, 999, "Нейкеды"],
  ["Suzuki", /^Hayabusa/i, 1340, "Спортбайки"],
  ["Suzuki", /^V-?Strom ?1050/i, 1037, "Эндуро-туристы"],
  ["Suzuki", /^V-?Strom ?(650|800)/i, 776, "Эндуро-туристы"],
  ["Triumph", /^Rocket ?3/i, 2458, "Круизеры"],
  ["Triumph", /^Speed Triple/i, 1160, "Нейкеды"],
  ["Triumph", /^Street Triple/i, 765, "Нейкеды"],
  ["Triumph", /^Tiger ?(1200|900)/i, 1160, "Эндуро-туристы"],
  ["Triumph", /^(Bonneville|Thruxton|Speed Twin|Scrambler)/i, 1200, "Ретро и классика"],
  ["Yamaha", /^MT-03/i, 321, "Нейкеды"],
  ["Yamaha", /^MT-07/i, 689, "Нейкеды"],
  ["Yamaha", /^MT-09/i, 890, "Нейкеды"],
  ["Yamaha", /^MT-10/i, 998, "Нейкеды"],
  ["Yamaha", /^Niken/i, 847, "Спорт-туристы"],
  ["Yamaha", /^Tracer ?9/i, 890, "Спорт-туристы"],
  ["Yamaha", /^XSR ?900/i, 890, "Ретро и классика"],
  ["Yamaha", /^XSR ?700/i, 689, "Ретро и классика"],
  ["Yamaha", /^YZF-R1/i, 998, "Спортбайки"],
  ["Yamaha", /^YZF-R3/i, 321, "Спортбайки"],
  ["Yamaha", /^YZF-R6/i, 599, "Спортбайки"],
  ["Yamaha", /^YZF-R7/i, 689, "Спортбайки"],
  ["Yamaha", /^YZF-R9/i, 890, "Спортбайки"],
  ["Yamaha", /^(TMAX|XMAX|NMAX)/i, null, "Скутеры"],
  ["Yamaha", /^Tenere/i, 689, "Эндуро-туристы"],
];

/** Fallback by words in the model name, for models not in the table. */
function guessClass(model: string): MotoClass | null {
  const m = model.toLowerCase();
  if (/adventure|\bgs\b|tenere|africa|v-?strom|tiger|multistrada|norden/.test(m)) return "Эндуро-туристы";
  if (/glide|gold ?wing|\brt\b|ultra|k ?1600/.test(m)) return "Туристические";
  if (/\brr\b|r1\b|r6\b|cbr|ninja zx|gsx-r|panigale|hayabusa|fireblade/.test(m)) return "Спортбайки";
  if (/scooter|tmax|xmax|forza|pcx|ce ?04/.test(m)) return "Скутеры";
  if (/cruiser|bob|boy|softail|rebel|shadow|vulcan|chief|scout|diavel/.test(m)) return "Круизеры";
  if (/duke|monster|streetfighter|\bmt-|\bz ?\d|naked/.test(m)) return "Нейкеды";
  return null;
}

const ccOf = (v: string | null) => {
  if (!v) return null;
  const n = parseFloat(v.replace(",", "."));
  if (!n) return null;
  return /л/.test(v) ? Math.round(n * 1000) : Math.round(n);
};

export type MotoSpec = { cc: number | null; cls: MotoClass | null };

export function motoSpec(l: Pick<Lot, "type" | "brand" | "model" | "name" | "volume">): MotoSpec {
  if (l.type !== "moto") return { cc: null, cls: null };
  const rule = R.find(([b, rx]) => b === l.brand && (rx.test(l.model) || rx.test(l.name.slice(l.brand.length).trim())));
  const fromPost = ccOf(l.volume);
  return { cc: fromPost ?? rule?.[2] ?? null, cls: rule?.[3] ?? guessClass(l.model) };
}

/** Displacement steps for the filter. */
export const CC_STEPS = [
  { v: "0-400", t: "до 400 см³" },
  { v: "401-800", t: "401–800 см³" },
  { v: "801-1000", t: "801–1000 см³" },
  { v: "1001-1300", t: "1001–1300 см³" },
  { v: "1301-", t: "свыше 1300 см³" },
];
