import type { Gender, Marital, Occupation, Profile } from "./types";

const LETTER = "\\p{L}\\p{M}\\p{N}";
const NOT_AFTER_NUM = `(?<![${LETTER}.])`;

const nfc = (s: string) => s.normalize("NFC");
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function word(alts: string[]): string {
  return `(?<![${LETTER}])(?:${alts.map((a) => escapeRe(nfc(a))).join("|")})(?![${LETTER}])`;
}

const NUM_WORDS: Record<string, number> = Object.fromEntries(
  Object.entries({
    "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "पाँच": 5, "छह": 6, "छः": 6,
    "सात": 7, "आठ": 8, "नौ": 9, "दस": 10, "आधा": 0.5,
    ek: 1, do: 2, teen: 3, char: 4, paanch: 5, aadha: 0.5,
  }).map(([k, v]) => [nfc(k), v]),
);
const NUM_WORD_ALT = Object.keys(NUM_WORDS).map(escapeRe).join("|");
const NUM_ANY = `\\d+(?:\\.\\d+)?|${NUM_WORD_ALT}`;

function normalize(text: string): string {
  return nfc(text).replace(/[\u0966-\u096F]/g, (d) => String(d.charCodeAt(0) - 0x0966));
}

function parseNum(raw: string): number | null {
  const t = nfc(raw).toLowerCase().replace(/,/g, "").trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  return Object.prototype.hasOwnProperty.call(NUM_WORDS, t) ? NUM_WORDS[t] : null;
}

function pickOne<T>(text: string, table: [T, string][]): T | null {
  const hits = new Set<T>();
  for (const [value, pattern] of table) {
    if (new RegExp(pattern, "iu").test(text)) hits.add(value);
  }
  return hits.size === 1 ? [...hits][0] : null;
}

const WIDOW_PHRASE = word(["पति नहीं रहे", "pati nahi rahe"]);

const GENDER_TABLE: [Gender, string][] = [
  ["F", word([
    "beti", "बेटी", "daughter", "mother", "maa", "माँ", "मां", "wife", "patni", "पत्नी", "bahu", "बहू", "dadi", "दादी", "nani", "नानी",
    "vidhwa", "vidhva", "widow", "विधवा", "woman", "महिला", "औरत", "बहन"
  ])],
  ["M", word([
    "beta", "बेटा", "son", "father", "pita", "पिता", "husband", "pati", "पति", "dada", "दादा", "nana", "नाना",
    "man", "पुरुष", "आदमी", "भाई"
  ])],
];

const MARITAL_TABLE: [Marital, string][] = [
  ["widow", word(["विधवा", "vidhwa", "vidhva", "widow", "पति नहीं रहे", "pati nahi rahe"])],
  ["married", word(["पत्नी", "wife", "patni", "married", "शादीशुदा"])],
  ["divorced", word(["तलाक", "तलाकशुदा", "divorced"])],
  ["single", word(["अविवाहित", "unmarried", "single"])],
];

const OCCUPATION_TABLE: [Occupation, string][] = [
  ["farmer", word(["किसान", "farmer", "kisan"])],
  ["labour", word(["मज़दूर", "mazdoor", "labour", "labor"])],
  ["unemployed", word(["बेरोज़गार", "unemployed"])],
  ["student", word([
    "student", "students", "विद्यार्थी", "छात्र", "छात्रा",
    "padhai karti hai", "padhai karta hai", "padhai karti", "padhai karta",
    "padhti hai", "padhta hai", "padhti", "padhta",
    "पढ़ाई करती है", "पढ़ाई करता है", "पढ़ाई करती", "पढ़ाई करता", "पढ़ाई", "padhai",
    "school/college mein", "school / college mein", "school/college me", "school / college me", "school/college",
    "school mein", "school me", "college mein", "college me", "स्कूल में", "कॉलेज में"
  ])],
];

const DISABILITY_RE = new RegExp(word(["दिव्यांग", "विकलांग", "disabled"]), "iu");
const LANDLESS_RE = new RegExp(word(["भूमिहीन", "bhoomiheen", "bhoomihin", "landless", "ज़मीन नहीं", "zameen nahi", "khet nahi"]), "iu");
const STATE_RE = new RegExp(word(["राजस्थान", "rajasthan"]), "iu");
const NO_CHILD_RE = new RegExp(word(["बच्चा नहीं", "बच्चे नहीं", "no children", "no kids"]), "iu");

// Suffix age patterns: "65 year old", "65 years", "65 yrs", "65 saal", "65 साल", "65 की उम्र", "65 ki umar"
const AGE_SUFFIX_RE = new RegExp(
  `(?<!\\d)(\\d{1,3})\\s*(?:year(?:s)?\\s*old|years|year|yrs|saal|साल|varsh|वर्ष|(?:ki|की)?\\s*(?:उम्र|umar|age))(?![${LETTER}])`,
  "iu"
);

// Prefix age patterns: "age 65", "उम्र 65", "umar 65"
const AGE_PREFIX_RE = new RegExp(
  `${word(["age", "उम्र", "umar"])}\\s*(?:is|hai|h|की|ki|:)?\\s*(\\d{1,3})(?![\\d${LETTER}])`,
  "iu"
);

const LAND_RE = new RegExp(
  `${NOT_AFTER_NUM}(${NUM_ANY})\\s*${word(["बीघा", "बीघे", "bigha", "bighas", "bighe"])}`,
  "iu",
);

const CHILD_RE = new RegExp(
  `${NOT_AFTER_NUM}(${NUM_ANY})\\s*${word(["बच्चे", "बच्चों", "बच्चा", "children", "child", "kids", "बेटे", "बेटी"])}`,
  "iu",
);

const INCOME_KW_RE = new RegExp(
  word(["आय", "इनकम", "income", "कमाई", "salana", "सालाना", "annual", "aay", "salary"]),
  "iu"
);

const AMOUNT_RE = new RegExp(
  `(\\d[\\d,]*(?:\\.\\d+)?|${NUM_WORD_ALT})\\s*(${word(["लाख", "lakh", "lac", "हज़ार", "हजार", "hazar", "hazaar", "thousand"])})?`,
  "iu",
);

const CLAUSE_SPLIT = /[।;!?\n]|\.(?!\d)|,(?!\d)/;

const DISTRICTS: [string, string[]][] = [
  ["Jaipur", ["जयपुर", "Jaipur"]],
  ["Kota", ["कोटा", "Kota"]],
  ["Alwar", ["अलवर", "Alwar"]],
  ["Dausa", ["दौसा", "Dausa"]],
  ["Ajmer", ["अजमेर", "Ajmer"]],
  ["Jodhpur", ["जोधपुर", "Jodhpur"]],
  ["Udaipur", ["उदयपुर", "Udaipur"]],
  ["Bikaner", ["बीकानेर", "Bikaner"]],
  ["Sikar", ["सीकर", "Sikar"]],
  ["Bhilwara", ["भीलवाड़ा", "Bhilwara"]],
];

function parseAge(t: string): number | null {
  const mSuffix = AGE_SUFFIX_RE.exec(t);
  if (mSuffix) {
    const n = Number(mSuffix[1]);
    if (n >= 1 && n <= 120) return n;
  }
  const mPrefix = AGE_PREFIX_RE.exec(t);
  if (mPrefix) {
    const n = Number(mPrefix[1]);
    if (n >= 1 && n <= 120) return n;
  }
  return null;
}

function parseLand(t: string): number | null {
  if (LANDLESS_RE.test(t)) return 0;
  const m = LAND_RE.exec(t);
  if (!m) return null;
  const n = parseNum(m[1]);
  return n !== null && n >= 0 ? n : null;
}

function parseChildren(t: string): number | null {
  const m = CHILD_RE.exec(t);
  if (m) {
    const n = parseNum(m[1]);
    return n !== null && Number.isInteger(n) && n >= 0 ? n : null;
  }
  return NO_CHILD_RE.test(t) ? 0 : null;
}

function parseIncome(t: string): number | null {
  for (const clause of t.split(CLAUSE_SPLIT)) {
    const kwMatch = INCOME_KW_RE.exec(clause);
    if (!kwMatch) continue;

    // Check after the keyword
    const after = clause.slice(kwMatch.index + kwMatch[0].length);
    const mAfter = AMOUNT_RE.exec(after);
    if (mAfter) {
      const base = parseNum(mAfter[1]);
      if (base !== null) {
        const mult = mAfter[2] ? (/लाख|lakh|lac/i.test(mAfter[2]) ? 100000 : 1000) : 1;
        const val = base * mult;
        if (Number.isFinite(val) && val >= 0) return val;
      }
    }

    // Check before the keyword in the same clause
    const before = clause.slice(0, kwMatch.index);
    const mBefore = AMOUNT_RE.exec(before);
    if (mBefore) {
      const base = parseNum(mBefore[1]);
      if (base !== null) {
        const mult = mBefore[2] ? (/लाख|lakh|lac/i.test(mBefore[2]) ? 100000 : 1000) : 1;
        const val = base * mult;
        if (Number.isFinite(val) && val >= 0) return val;
      }
    }
  }
  return null;
}

function parseDistrict(t: string): string | null {
  let best: { index: number; name: string } | null = null;
  for (const [name, names] of DISTRICTS) {
    const m = new RegExp(word(names), "iu").exec(t);
    if (m && (best === null || m.index < best.index)) best = { index: m.index, name };
  }
  return best?.name ?? null;
}

export function fallbackParse(text: string): Partial<Profile> {
  const t = normalize(text);
  const genderText = t.replace(new RegExp(WIDOW_PHRASE, "giu"), " ");
  return {
    age: parseAge(t),
    gender: pickOne(genderText, GENDER_TABLE),
    marital: pickOne(t, MARITAL_TABLE),
    state: STATE_RE.test(t) ? "Rajasthan" : null,
    district: parseDistrict(t),
    annual_family_income: parseIncome(t),
    land_bigha: parseLand(t),
    occupation: pickOne(t, OCCUPATION_TABLE),
    disability: DISABILITY_RE.test(t) ? true : null,
    children_count: parseChildren(t),
  };
}
