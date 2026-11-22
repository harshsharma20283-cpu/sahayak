export interface QuestionOption {
  label_hi: string;
  label_en: string;
  value: unknown;
}

export interface QuestionEntry {
  field: string;
  ask_hi: string;
  ask_en: string;
  type?: "select" | "numeric";
  note_hi?: string;
  note_en?: string;
  options: QuestionOption[];
}

const NOT_SURE_HI = "पता नहीं";
const NOT_SURE_EN = "Not sure";

export const QUESTION_BANK: Record<string, QuestionEntry> = {
  annual_family_income: {
    field: "annual_family_income",
    ask_hi: "परिवार की सालाना आय कितनी है?",
    ask_en: "What is the annual family income?",
    options: [
      { label_hi: "60,000 से कम", label_en: "Less than 60,000", value: 60000 },
      { label_hi: "60,000 से ज़्यादा", label_en: "More than 60,000", value: 60001 },
      { label_hi: NOT_SURE_HI, label_en: NOT_SURE_EN, value: null },
    ],
  },
  land_bigha: {
    field: "land_bigha",
    ask_hi: "कितनी ज़मीन है?",
    ask_en: "How much land do you have?",
    options: [
      { label_hi: "ज़मीन नहीं", label_en: "No land", value: 0 },
      { label_hi: "1-2 बीघा", label_en: "1-2 bigha", value: 2 },
      { label_hi: "3 या ज़्यादा बीघा", label_en: "3 or more bigha", value: 3 },
      { label_hi: NOT_SURE_HI, label_en: NOT_SURE_EN, value: null },
    ],
  },
  occupation: {
    field: "occupation",
    ask_hi: "मुख्य काम क्या है?",
    ask_en: "What is the main occupation?",
    options: [
      { label_hi: "किसान", label_en: "Farmer", value: "farmer" },
      { label_hi: "मज़दूर", label_en: "Labour", value: "labour" },
      { label_hi: "विद्यार्थी / छात्र", label_en: "Student", value: "student" },
      { label_hi: "बेरोज़गार", label_en: "Unemployed", value: "unemployed" },
      { label_hi: "अन्य", label_en: "Other", value: "other" },
      { label_hi: NOT_SURE_HI, label_en: NOT_SURE_EN, value: null },
    ],
  },
  marital: {
    field: "marital",
    ask_hi: "वैवाहिक स्थिति क्या है?",
    ask_en: "What is the marital status?",
    options: [
      { label_hi: "अविवाहित", label_en: "Single", value: "single" },
      { label_hi: "शादीशुदा", label_en: "Married", value: "married" },
      { label_hi: "विधवा", label_en: "Widow", value: "widow" },
      { label_hi: "तलाकशुदा / अलग", label_en: "Divorced / Separated", value: "divorced" },
      { label_hi: NOT_SURE_HI, label_en: NOT_SURE_EN, value: null },
    ],
  },
  disability: {
    field: "disability",
    ask_hi: "क्या कोई दिव्यांग है?",
    ask_en: "Is anyone in the family disabled?",
    options: [
      { label_hi: "हाँ", label_en: "Yes", value: true },
      { label_hi: "नहीं", label_en: "No", value: false },
      { label_hi: NOT_SURE_HI, label_en: NOT_SURE_EN, value: null },
    ],
  },
  children_count: {
    field: "children_count",
    ask_hi: "कितने बच्चे हैं?",
    ask_en: "How many children are there?",
    options: [
      { label_hi: "कोई नहीं", label_en: "None", value: 0 },
      { label_hi: "1-2", label_en: "1-2", value: 2 },
      { label_hi: "3 या ज़्यादा", label_en: "3 or more", value: 3 },
      { label_hi: NOT_SURE_HI, label_en: NOT_SURE_EN, value: null },
    ],
  },
  age: {
    field: "age",
    ask_hi: "उम्र कितनी है?",
    ask_en: "What is your exact age?",
    type: "numeric",
    options: [],
  },
};

export function questionFor(field: string): QuestionEntry | null {
  return Object.prototype.hasOwnProperty.call(QUESTION_BANK, field)
    ? QUESTION_BANK[field]
    : null;
}
