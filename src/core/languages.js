// -----------------
// Global variables
// -----------------

const alliances = ["555", "DIF", "FNB", "KSM", "LoU", "OGs", "OPG", "OPS", "PrO","TAR", "TDS", "TIR", "wlf", "WTF"];

const languages = ["English", "Russian", "German", "Spanish", "Japanese","French", "Thai", "Portuguese"];

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
   value: "Japanese"},
{name: "Thai",
   value: "Thai"},
{name: "Portuguese",
   value: "Portuguese"}
];

const language_labels = ["English", "Русский", "Deutsch", "Español", "日本語", "Français", "ภาษาไทย", "Português" ];

const ranks = ["R5", "R4", "R3", "R2", "R1"];

module.exports.alliances = alliances;
module.exports.languages = languages;
module.exports.langMap = langMap;
module.exports.ranks = ranks;
module.exports.language_labels = language_labels;
module.exports.cmdLang = cmdLang;

