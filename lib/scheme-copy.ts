export type SchemeCopy = {
  who_hi: string;
  who_en: string;
  apply_hi: string;
  apply_en: string;
};

export const SCHEME_COPY: Record<string, SchemeCopy> = {
  old_age_pension: {
    who_hi: "राजस्थान में रहने वाले बुज़ुर्गों के लिए, जिनकी आयु 60 वर्ष या अधिक है।",
    who_en: "For elderly residents of Rajasthan who are 60 years or older.",
    apply_hi: "e-Mitra kendra ya ssp.rajasthan.gov.in par form bhariye. Apply karna FREE hai।",
    apply_en: "Visit an e-Mitra kendra or ssp.rajasthan.gov.in and fill the form. Applying is FREE.",
  },
  widow_pension: {
    who_hi: "राजस्थान की उन महिलाओं के लिए जो विधवा हैं।",
    who_en: "For widowed women residents of Rajasthan.",
    apply_hi: "e-Mitra kendra ya ssp.rajasthan.gov.in par form bhariye। पति का मृत्यु प्रमाण पत्र लगाएँ।",
    apply_en: "Visit an e-Mitra kendra or ssp.rajasthan.gov.in. Attach your husband's death certificate.",
  },
  old_age_farmer_pension: {
    who_hi: "राजस्थान के बुज़ुर्ग किसानों के लिए, जो खेती करते हैं।",
    who_en: "For elderly farmers in Rajasthan who work the land.",
    apply_hi: "e-Mitra kendra ya ssp.rajasthan.gov.in par form bhariye। ज़मीन के कागज़ (जमाबंदी) लगाएँ।",
    apply_en: "Visit an e-Mitra kendra or ssp.rajasthan.gov.in. Attach land records (Jamabandi).",
  },
  disability_pension: {
    who_hi: "राजस्थान के उन निवासियों के लिए जिन्हें दिव्यांगता है।",
    who_en: "For residents of Rajasthan who have a disability.",
    apply_hi: "e-Mitra kendra ya ssp.rajasthan.gov.in par form bhariye। दिव्यांगता प्रमाण पत्र लगाएँ।",
    apply_en: "Visit an e-Mitra kendra or ssp.rajasthan.gov.in. Attach your disability certificate.",
  },
  state_health_insurance: {
    who_hi: "राजस्थान के कम आय वाले परिवारों के लिए स्वास्थ्य बीमा।",
    who_en: "Health insurance for lower-income families in Rajasthan.",
    apply_hi: "e-Mitra kendra ya myscheme.gov.in par form bhariye। आय का प्रमाण लगाएँ।",
    apply_en: "Visit an e-Mitra kendra or myscheme.gov.in. Attach income proof.",
  },
  palanhar_yojana: {
    who_hi: "राजस्थान में विधवा, अलग रह रही या तलाकशुदा माताओं के बच्चों की देखभाल के लिए।",
    who_en: "For children's care when the mother is widowed, separated or divorced, in Rajasthan.",
    apply_hi: "e-Mitra kendra ya myscheme.gov.in par form bhariye। बच्चों के जन्म प्रमाण पत्र लगाएँ।",
    apply_en: "Visit an e-Mitra kendra or myscheme.gov.in. Attach children's birth certificates.",
  },
  maternity_nutrition_support: {
    who_hi: "गर्भवती महिलाओं के लिए राजस्थान में पोषण सहायता।",
    who_en: "Nutrition support for pregnant women in Rajasthan.",
    apply_hi: "e-Mitra kendra ya myscheme.gov.in par form bhariye। MCP card लगाएँ।",
    apply_en: "Visit an e-Mitra kendra or myscheme.gov.in. Attach your MCP card.",
  },
  central_nsap_pension: {
    who_hi: "60 वर्ष या अधिक आयु के बुज़ुर्गों के लिए केंद्र सरकार की पेंशन।",
    who_en: "Central government pension for elderly people aged 60 or above.",
    apply_hi: "e-Mitra kendra ya myscheme.gov.in par form bhariye। आधार कार्ड की मूल प्रति और फोटोकॉपी रखें।",
    apply_en: "Visit an e-Mitra kendra or myscheme.gov.in. Keep the original Aadhaar card and a photocopy.",
  },
};

const DEFAULT_COPY: SchemeCopy = {
  who_hi: "यह सरकारी योजना है। पात्रता की शर्तें नीचे देखें।",
  who_en: "This is a government scheme. Check the conditions below.",
  apply_hi: "सरकारी पोर्टल या e-Mitra kendra par form bhariye। आवेदन FREE है।",
  apply_en: "Use the official portal or an e-Mitra kendra to apply. Applying is FREE.",
};

export function copyFor(id: string): SchemeCopy {
  return SCHEME_COPY[id] ?? DEFAULT_COPY;
}
