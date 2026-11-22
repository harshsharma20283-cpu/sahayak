import hiJson from "./hi.json";
import enJson from "./en.json";

export type Lang = "hi" | "en";

export type TranslationKey = keyof typeof hiJson | keyof typeof enJson | string;

export const translations: Record<Lang, Record<string, string>> = {
  hi: hiJson,
  en: enJson,
};

const FIELD_ALIASES: Record<string, { hi: string; en: string }> = {
  land_bigha: { hi: "ज़मीन (बीघा)", en: "Land (bigha)" },
  annual_family_income: { hi: "सालाना आय", en: "Annual family income" },
  children_count: { hi: "बच्चे", en: "Children" },
  age: { hi: "उम्र", en: "Age" },
  gender: { hi: "लिंग", en: "Gender" },
  marital: { hi: "वैवाहिक स्थिति", en: "Marital status" },
  state: { hi: "राज्य", en: "State" },
  district: { hi: "ज़िला", en: "District" },
  occupation: { hi: "काम", en: "Occupation" },
  disability: { hi: "दिव्यांगता", en: "Disability" },
  is_bpl: { hi: "BPL", en: "BPL" },
};

function humanize(key: string, lang: Lang): string {
  if (key.startsWith("fields.")) {
    const field = key.replace(/^fields\./, "");
    if (FIELD_ALIASES[field]) {
      return lang === "hi" ? FIELD_ALIASES[field].hi : FIELD_ALIASES[field].en;
    }
    return field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (key.includes(".")) {
    const lastPart = key.split(".").pop() || key;
    return lastPart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return key;
}

export function translate(
  key: string,
  lang: Lang = "hi",
  vars?: Record<string, string | number>
): string {
  const dict = translations[lang] || translations.hi;
  let text = dict[key] ?? translations.hi[key] ?? humanize(key, lang);

  if (vars) {
    for (const [vKey, val] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${vKey}\\}`, "g"), String(val));
    }
  }

  return text;
}
