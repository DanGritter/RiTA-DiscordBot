// -----------------
// Global variables
// -----------------

const alliances = ["555", "BOA", "DIF", "FNB", "KSM", "OGs", "OPG", "OPS", "PrO","TAR", "TDS", "TIR", "wlf"];

const languages = ["English", "Russian", "German", "Spanish", "Japanese","French"];

const langMap = {"English": "en-US",
   "French": "fr-FR",
   "Spanish": "es-ES",
   "Japanese": "jp-JP",
   "Russian": "ru-RU",
   "German": "de-DE",
   "Thai": "th-TH",
   "Portuguese": "pt-PT"};

const cmdLang = [ {name: "English",
   value: "English"},
{name: "German",
   value: "German"},
{name: "Russian",
   value: "Russian"},
{name: "Spanish",
   value: "Spanish"},
{name: "French",
   value: "French"},
{name: "Japanese",
   value: "Japanese"}
];

const language_labels = ["English", "Русский", "Deutsch", "Español", "日本語", "Français"];

const ranks = ["R5", "R4", "R3", "R2", "R1"];

module.exports.alliances = alliances;
module.exports.languages = languages;
module.exports.langMap = langMap;
module.exports.ranks = ranks;
module.exports.language_labels = language_labels;
module.exports.cmdLang = cmdLang;

