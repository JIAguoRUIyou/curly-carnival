const STORAGE_KEY = "smart-study-planner-v1";
const DONE_KEY = "smart-study-done-v1";
const FOCUS_KEY = "smart-study-focus-v1";
const REVIEW_KEY = "smart-study-review-v1";
const THEME_KEY = "smart-study-entry-theme-v1";
const ENGLISH_FAVORITES_KEY = "smart-study-english-favorites-v1";
const MISTAKE_KEY = "smart-study-mistakes-v1";
const DICTIONARY_KEY = "smart-study-cet6-dictionary-v1";
const CET4_DICTIONARY_KEY = "smart-study-cet4-dictionary-v1";

const today = new Date();
const isoDate = (date) => date.toISOString().slice(0, 10);
const makeId = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `book-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};
const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

const initialBooks = [
  {
    id: makeId(),
    title: "英语四级",
    year: today.getFullYear(),
    examDate: isoDate(addDays(today, 82)),
    dailyMinutes: 90,
    mastery: 0.45,
    goal: "目标：词汇稳定过关，听力和阅读形成题型反应，写译积累高频表达。",
    chapters: [
      { name: "核心词汇与短语", difficulty: 3 },
      { name: "听力短篇新闻", difficulty: 4 },
      { name: "听力长对话", difficulty: 4 },
      { name: "篇章听力", difficulty: 5 },
      { name: "阅读选词填空", difficulty: 4 },
      { name: "长篇匹配阅读", difficulty: 3 },
      { name: "仔细阅读", difficulty: 5 },
      { name: "翻译高频主题", difficulty: 4 },
      { name: "作文模板与升级句", difficulty: 4 },
      { name: "整套真题模拟", difficulty: 5 }
    ]
  },
  {
    id: makeId(),
    title: "高数下同济版",
    year: today.getFullYear(),
    examDate: isoDate(addDays(today, 68)),
    dailyMinutes: 120,
    mastery: 0.35,
    goal: "目标：按高数下常见学习模块复习，先补概念与公式链条，再集中训练综合题和易错题。",
    chapters: [
      { name: "向量代数与空间解析几何", difficulty: 3 },
      { name: "多元函数微分学", difficulty: 5 },
      { name: "多元函数微分学应用", difficulty: 5 },
      { name: "重积分", difficulty: 5 },
      { name: "曲线积分与曲面积分", difficulty: 5 },
      { name: "无穷级数", difficulty: 4 },
      { name: "综合题型与错题复盘", difficulty: 5 }
    ]
  }
];

let state = loadState();
let activeId = state.activeId || state.books[0].id;
let currentView = "week";
let currentHeatmapView = "month";
let currentYearFilter = "all";
let bookSearchQuery = "";
let dictionaryPage = 1;
let dictionaryPageSize = 48;
let cet4DictionaryPage = 1;
let cet4DictionaryPageSize = 48;

const entryThemes = [
  ["forest", "#2f7d5c", "#1e5c43", "#2f6f9f", "#f8faf7", "linear-gradient(120deg, rgba(9,28,22,.82), rgba(47,125,92,.46)), url('assets/study-desk.png') center / cover", "linear-gradient(135deg,#1e5c43,#78c69a)"],
  ["ocean", "#287aa8", "#165a7c", "#21a0a0", "#f5fbfd", "radial-gradient(circle at 20% 20%, rgba(126,213,232,.55), transparent 28%), linear-gradient(135deg,#0f3554,#1b8fa6)", "linear-gradient(135deg,#0f5b8f,#64d2d8)"],
  ["sunrise", "#d96d3f", "#9b452a", "#d69b32", "#fff9f2", "radial-gradient(circle at 18% 24%, rgba(255,214,126,.8), transparent 26%), linear-gradient(135deg,#7b2d26,#e08b45)", "linear-gradient(135deg,#d96d3f,#ffd166)"],
  ["lavender", "#7357b7", "#4b3a84", "#c06fb1", "#fbf8ff", "radial-gradient(circle at 70% 20%, rgba(214,190,255,.65), transparent 24%), linear-gradient(135deg,#36245b,#8d6bd6)", "linear-gradient(135deg,#7357b7,#c9a7ff)"],
  ["ink", "#334155", "#172033", "#64748b", "#f7f8fb", "linear-gradient(135deg,#0f172a,#334155), repeating-linear-gradient(45deg, rgba(255,255,255,.06) 0 2px, transparent 2px 12px)", "linear-gradient(135deg,#111827,#64748b)"],
  ["mint", "#2fa38b", "#1f6f62", "#3aa9c9", "#f4fffb", "radial-gradient(circle at 15% 80%, rgba(169,255,221,.5), transparent 25%), linear-gradient(135deg,#0f4d46,#5cc9a7)", "linear-gradient(135deg,#2fa38b,#9df2d0)"],
  ["peach", "#dd6b6b", "#9f3f46", "#f4a261", "#fff8f6", "radial-gradient(circle at 80% 18%, rgba(255,198,184,.8), transparent 24%), linear-gradient(135deg,#6d2738,#dd6b6b)", "linear-gradient(135deg,#dd6b6b,#ffc6a8)"],
  ["gold", "#b7791f", "#7c4a03", "#d69b32", "#fffaf0", "linear-gradient(135deg,#3b2f12,#b7791f), repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 10px)", "linear-gradient(135deg,#b7791f,#f6d365)"],
  ["rose", "#c44569", "#8f2f4f", "#f06292", "#fff7fa", "radial-gradient(circle at 28% 24%, rgba(255,180,203,.65), transparent 26%), linear-gradient(135deg,#4a1630,#c44569)", "linear-gradient(135deg,#c44569,#ff9ebb)"],
  ["sky", "#3182ce", "#1e5a96", "#63b3ed", "#f5faff", "linear-gradient(180deg,#0f4c81,#6bb6ff), radial-gradient(circle at 30% 30%, rgba(255,255,255,.4), transparent 18%)", "linear-gradient(135deg,#3182ce,#90cdf4)"],
  ["lime", "#5a9f2f", "#3d6f1d", "#9ac23c", "#fbfff4", "repeating-linear-gradient(135deg, rgba(255,255,255,.09) 0 7px, transparent 7px 18px), linear-gradient(135deg,#315b1f,#7cad39)", "linear-gradient(135deg,#5a9f2f,#c8e66a)"],
  ["teal", "#0f8b8d", "#075b5d", "#2ec4b6", "#f3ffff", "radial-gradient(circle at 80% 75%, rgba(46,196,182,.7), transparent 24%), linear-gradient(135deg,#073b4c,#0f8b8d)", "linear-gradient(135deg,#0f8b8d,#2ec4b6)"],
  ["plum", "#8e44ad", "#5e3370", "#bb6bd9", "#fcf7ff", "linear-gradient(135deg,#2e1745,#8e44ad), repeating-radial-gradient(circle at 25% 25%, rgba(255,255,255,.1) 0 2px, transparent 2px 12px)", "linear-gradient(135deg,#8e44ad,#d6a4ff)"],
  ["coffee", "#8b5e34", "#5f3c21", "#b08968", "#fffaf5", "linear-gradient(135deg,#2d1b12,#8b5e34), repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 2px, transparent 2px 9px)", "linear-gradient(135deg,#8b5e34,#d8b48a)"],
  ["charcoal", "#3f4a54", "#202a33", "#7a8793", "#f6f7f8", "linear-gradient(135deg,#11161c,#3f4a54), radial-gradient(circle at 70% 20%, rgba(255,255,255,.12), transparent 24%)", "linear-gradient(135deg,#202a33,#7a8793)"],
  ["coral", "#e76f51", "#a34834", "#2a9d8f", "#fff8f4", "radial-gradient(circle at 20% 75%, rgba(42,157,143,.5), transparent 24%), linear-gradient(135deg,#783224,#e76f51)", "linear-gradient(135deg,#e76f51,#f4a261)"],
  ["navy", "#264b96", "#182d5c", "#4d7cce", "#f5f7ff", "linear-gradient(135deg,#06133a,#264b96), radial-gradient(circle at 68% 28%, rgba(120,160,255,.45), transparent 23%)", "linear-gradient(135deg,#264b96,#7ea6ff)"],
  ["bamboo", "#4f8a45", "#2f5f2b", "#8dbf67", "#f8fff5", "repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 4px, transparent 4px 24px), linear-gradient(135deg,#254d2b,#6da85c)", "linear-gradient(135deg,#4f8a45,#b9df8a)"],
  ["berry", "#9f315c", "#6e1f3e", "#d55c83", "#fff6fa", "radial-gradient(circle at 72% 72%, rgba(255,150,180,.58), transparent 25%), linear-gradient(135deg,#3d1328,#9f315c)", "linear-gradient(135deg,#9f315c,#f08fb1)"],
  ["ice", "#4f9db3", "#2b6d7f", "#a6e3e9", "#f4fdff", "linear-gradient(135deg,#173f52,#4f9db3), repeating-linear-gradient(45deg, rgba(255,255,255,.13) 0 1px, transparent 1px 14px)", "linear-gradient(135deg,#4f9db3,#c7f9ff)"],
  ["sand", "#c28f44", "#8a6128", "#e9c46a", "#fffaf0", "radial-gradient(circle at 25% 28%, rgba(255,230,170,.6), transparent 22%), linear-gradient(135deg,#5c3f21,#c28f44)", "linear-gradient(135deg,#c28f44,#f4d88c)"],
  ["orchid", "#a855a5", "#71346f", "#f0abfc", "#fff7ff", "linear-gradient(135deg,#34113f,#a855a5), radial-gradient(circle at 20% 20%, rgba(255,210,255,.4), transparent 20%)", "linear-gradient(135deg,#a855a5,#f0abfc)"],
  ["jade", "#1f9d72", "#116449", "#64d8a8", "#f4fff9", "radial-gradient(circle at 72% 18%, rgba(100,216,168,.65), transparent 23%), linear-gradient(135deg,#083b2d,#1f9d72)", "linear-gradient(135deg,#1f9d72,#91f0c0)"],
  ["ruby", "#b83242", "#7f1d2d", "#ef6f7f", "#fff7f8", "linear-gradient(135deg,#3b0d17,#b83242), repeating-linear-gradient(135deg, rgba(255,255,255,.09) 0 2px, transparent 2px 13px)", "linear-gradient(135deg,#b83242,#ff9aa7)"],
  ["steel", "#58728a", "#34495e", "#8fb3d1", "#f7fbff", "linear-gradient(135deg,#1f2f3d,#58728a), radial-gradient(circle at 80% 80%, rgba(200,230,255,.35), transparent 22%)", "linear-gradient(135deg,#58728a,#b5d4ec)"],
  ["moss", "#607d3b", "#3f5528", "#a3b65c", "#fbfff3", "repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,.11) 0 2px, transparent 2px 13px), linear-gradient(135deg,#28381e,#607d3b)", "linear-gradient(135deg,#607d3b,#c4d96b)"],
  ["midnight", "#4c51bf", "#2d2f7f", "#7f9cf5", "#f7f7ff", "radial-gradient(circle at 20% 20%, rgba(255,255,255,.23), transparent 3%), radial-gradient(circle at 70% 35%, rgba(255,255,255,.18), transparent 2%), linear-gradient(135deg,#050816,#4c51bf)", "linear-gradient(135deg,#4c51bf,#9aa8ff)"],
  ["flame", "#c2410c", "#7c2d12", "#f97316", "#fff7ed", "linear-gradient(135deg,#3f1608,#c2410c), radial-gradient(circle at 72% 30%, rgba(255,180,90,.58), transparent 23%)", "linear-gradient(135deg,#c2410c,#fb923c)"],
  ["rain", "#40798c", "#285463", "#70a9a1", "#f4fbfb", "repeating-linear-gradient(115deg, rgba(255,255,255,.12) 0 1px, transparent 1px 12px), linear-gradient(135deg,#143642,#40798c)", "linear-gradient(135deg,#40798c,#9ad1d4)"],
  ["paper", "#6b7280", "#374151", "#9ca3af", "#fafafa", "linear-gradient(135deg,#f4f1ea,#d8d3c7), repeating-linear-gradient(0deg, rgba(40,40,40,.06) 0 1px, transparent 1px 22px)", "linear-gradient(135deg,#6b7280,#d1d5db)"]
];

const themeSceneBackgrounds = [
  "radial-gradient(circle at 18% 18%, rgba(174, 241, 188, .42), transparent 25%), radial-gradient(circle at 82% 70%, rgba(28, 74, 46, .72), transparent 34%), repeating-linear-gradient(118deg, rgba(255,255,255,.08) 0 2px, transparent 2px 18px), linear-gradient(135deg, #0d2b20, #2f7d5c 54%, #10251d)",
  "radial-gradient(circle at 24% 18%, rgba(204, 245, 255, .55), transparent 24%), repeating-radial-gradient(ellipse at 72% 82%, rgba(255,255,255,.18) 0 3px, transparent 3px 18px), linear-gradient(150deg, #06334a, #287aa8 50%, #21a0a0)",
  "radial-gradient(circle at 22% 24%, rgba(255, 232, 151, .72), transparent 24%), linear-gradient(168deg, rgba(255,255,255,.12) 0 18%, transparent 18% 100%), linear-gradient(135deg, #7b2d26, #d96d3f 45%, #f4a261)",
  "radial-gradient(circle at 20% 22%, rgba(255,255,255,.45) 0 1px, transparent 2px), radial-gradient(circle at 72% 18%, rgba(214,190,255,.55), transparent 24%), linear-gradient(135deg, #24143f, #7357b7 58%, #c06fb1)",
  "repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 1px, transparent 1px 24px), linear-gradient(135deg, #0f172a, #334155 58%, #64748b)",
  "radial-gradient(circle at 16% 76%, rgba(169,255,221,.52), transparent 26%), repeating-linear-gradient(45deg, rgba(255,255,255,.09) 0 5px, transparent 5px 18px), linear-gradient(135deg, #0f4d46, #2fa38b 52%, #3aa9c9)",
  "radial-gradient(circle at 80% 18%, rgba(255,198,184,.8), transparent 24%), radial-gradient(circle at 25% 80%, rgba(255,255,255,.16), transparent 20%), linear-gradient(135deg, #6d2738, #dd6b6b 55%, #f4a261)",
  "repeating-linear-gradient(90deg, rgba(255,255,255,.09) 0 1px, transparent 1px 10px), radial-gradient(circle at 72% 28%, rgba(255,230,148,.55), transparent 25%), linear-gradient(135deg, #3b2f12, #b7791f 52%, #f6d365)",
  "radial-gradient(circle at 28% 24%, rgba(255,180,203,.65), transparent 26%), repeating-radial-gradient(circle at 78% 72%, rgba(255,255,255,.12) 0 2px, transparent 2px 14px), linear-gradient(135deg, #4a1630, #c44569 58%, #f06292)",
  "radial-gradient(circle at 28% 26%, rgba(255,255,255,.65), transparent 17%), radial-gradient(circle at 72% 34%, rgba(255,255,255,.34), transparent 18%), linear-gradient(180deg, #0f4c81, #3182ce 58%, #90cdf4)",
  "repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,.13) 0 2px, transparent 2px 16px), linear-gradient(120deg, rgba(199,232,93,.34), transparent 38%), linear-gradient(135deg, #315b1f, #5a9f2f 54%, #9ac23c)",
  "repeating-linear-gradient(120deg, rgba(255,255,255,.11) 0 2px, transparent 2px 16px), radial-gradient(circle at 80% 75%, rgba(46,196,182,.7), transparent 24%), linear-gradient(135deg, #073b4c, #0f8b8d 55%, #2ec4b6)",
  "repeating-radial-gradient(circle at 25% 25%, rgba(255,255,255,.1) 0 2px, transparent 2px 12px), radial-gradient(circle at 76% 18%, rgba(214,164,255,.48), transparent 24%), linear-gradient(135deg, #2e1745, #8e44ad 55%, #bb6bd9)",
  "repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 2px, transparent 2px 9px), radial-gradient(circle at 68% 24%, rgba(216,180,138,.35), transparent 24%), linear-gradient(135deg, #2d1b12, #8b5e34 56%, #b08968)",
  "radial-gradient(circle at 70% 20%, rgba(255,255,255,.12), transparent 24%), repeating-linear-gradient(135deg, rgba(255,255,255,.07) 0 1px, transparent 1px 14px), linear-gradient(135deg, #11161c, #3f4a54 58%, #7a8793)",
  "radial-gradient(circle at 20% 75%, rgba(42,157,143,.5), transparent 24%), radial-gradient(circle at 78% 20%, rgba(255,220,170,.28), transparent 22%), linear-gradient(135deg, #783224, #e76f51 54%, #2a9d8f)",
  "radial-gradient(circle at 18% 20%, rgba(255,255,255,.32) 0 1px, transparent 2px), radial-gradient(circle at 68% 28%, rgba(120,160,255,.45), transparent 23%), linear-gradient(135deg, #06133a, #264b96 55%, #4d7cce)",
  "repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 4px, transparent 4px 24px), radial-gradient(circle at 24% 74%, rgba(185,223,138,.46), transparent 25%), linear-gradient(135deg, #254d2b, #4f8a45 55%, #8dbf67)",
  "radial-gradient(circle at 72% 72%, rgba(255,150,180,.58), transparent 25%), repeating-linear-gradient(45deg, rgba(255,255,255,.08) 0 3px, transparent 3px 13px), linear-gradient(135deg, #3d1328, #9f315c 55%, #d55c83)",
  "repeating-linear-gradient(45deg, rgba(255,255,255,.13) 0 1px, transparent 1px 14px), radial-gradient(circle at 20% 18%, rgba(199,249,255,.52), transparent 24%), linear-gradient(135deg, #173f52, #4f9db3 54%, #a6e3e9)",
  "radial-gradient(circle at 25% 28%, rgba(255,230,170,.6), transparent 22%), linear-gradient(168deg, transparent 0 38%, rgba(255,255,255,.15) 38% 40%, transparent 40% 100%), linear-gradient(135deg, #5c3f21, #c28f44 55%, #e9c46a)",
  "radial-gradient(circle at 20% 20%, rgba(255,210,255,.4), transparent 20%), repeating-linear-gradient(135deg, rgba(255,255,255,.08) 0 2px, transparent 2px 18px), linear-gradient(135deg, #34113f, #a855a5 54%, #f0abfc)",
  "radial-gradient(circle at 72% 18%, rgba(100,216,168,.65), transparent 23%), radial-gradient(circle at 22% 78%, rgba(255,255,255,.16), transparent 20%), linear-gradient(135deg, #083b2d, #1f9d72 55%, #64d8a8)",
  "repeating-linear-gradient(135deg, rgba(255,255,255,.09) 0 2px, transparent 2px 13px), radial-gradient(circle at 75% 24%, rgba(255,154,167,.48), transparent 22%), linear-gradient(135deg, #3b0d17, #b83242 55%, #ef6f7f)",
  "radial-gradient(circle at 80% 80%, rgba(200,230,255,.35), transparent 22%), repeating-linear-gradient(90deg, rgba(255,255,255,.08) 0 1px, transparent 1px 20px), linear-gradient(135deg, #1f2f3d, #58728a 55%, #8fb3d1)",
  "repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,.11) 0 2px, transparent 2px 13px), radial-gradient(circle at 70% 70%, rgba(196,217,107,.4), transparent 24%), linear-gradient(135deg, #28381e, #607d3b 55%, #a3b65c)",
  "radial-gradient(circle at 20% 20%, rgba(255,255,255,.23), transparent 3%), radial-gradient(circle at 70% 35%, rgba(255,255,255,.18), transparent 2px), linear-gradient(135deg, #050816, #4c51bf 58%, #7f9cf5)",
  "radial-gradient(circle at 72% 30%, rgba(255,180,90,.58), transparent 23%), repeating-radial-gradient(circle at 20% 72%, rgba(255,255,255,.08) 0 1px, transparent 1px 12px), linear-gradient(135deg, #3f1608, #c2410c 55%, #f97316)",
  "repeating-linear-gradient(115deg, rgba(255,255,255,.12) 0 1px, transparent 1px 12px), radial-gradient(circle at 24% 22%, rgba(154,209,212,.34), transparent 24%), linear-gradient(135deg, #143642, #40798c 55%, #70a9a1)",
  "repeating-linear-gradient(0deg, rgba(40,40,40,.06) 0 1px, transparent 1px 22px), radial-gradient(circle at 74% 24%, rgba(255,255,255,.62), transparent 20%), linear-gradient(135deg, #f4f1ea, #d8d3c7 56%, #9ca3af)"
];

function hexToRgba(hex, alpha) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function buildStudyBackground(theme, index, strength = 1) {
  return themeSceneBackgrounds[index % themeSceneBackgrounds.length];
}

const nodes = {
  bookCount: document.querySelector("#bookCount"),
  bookList: document.querySelector("#bookList"),
  activeTitle: document.querySelector("#activeTitle"),
  form: document.querySelector("#bookForm"),
  titleInput: document.querySelector("#titleInput"),
  examInput: document.querySelector("#examInput"),
  yearInput: document.querySelector("#yearInput"),
  yearFilter: document.querySelector("#yearFilter"),
  minutesInput: document.querySelector("#minutesInput"),
  masteryInput: document.querySelector("#masteryInput"),
  chaptersInput: document.querySelector("#chaptersInput"),
  goalInput: document.querySelector("#goalInput"),
  methodOutput: document.querySelector("#methodOutput"),
  planOutput: document.querySelector("#planOutput"),
  quickAddForm: document.querySelector("#quickAddForm"),
  quickTitle: document.querySelector("#quickTitle"),
  quickAddStatus: document.querySelector("#quickAddStatus"),
  bookSearchInput: document.querySelector("#bookSearchInput"),
  dailyEnglishTitle: document.querySelector("#dailyEnglishTitle"),
  dailyEnglishText: document.querySelector("#dailyEnglishText"),
  dailyEnglishTranslation: document.querySelector("#dailyEnglishTranslation"),
  dailyEnglishGrammar: document.querySelector("#dailyEnglishGrammar"),
  favoriteEnglishBtn: document.querySelector("#favoriteEnglishBtn"),
  favoriteEnglishList: document.querySelector("#favoriteEnglishList"),
  dictionarySearchInput: document.querySelector("#dictionarySearchInput"),
  dictionaryStats: document.querySelector("#dictionaryStats"),
  dictionaryStatus: document.querySelector("#dictionaryStatus"),
  dictionaryResults: document.querySelector("#dictionaryResults"),
  dictionaryPageSize: document.querySelector("#dictionaryPageSize"),
  dictionaryPrevBtn: document.querySelector("#dictionaryPrevBtn"),
  dictionaryNextBtn: document.querySelector("#dictionaryNextBtn"),
  dictionaryPageInfo: document.querySelector("#dictionaryPageInfo"),
  importDictionaryBtn: document.querySelector("#importDictionaryBtn"),
  dictionaryImportInput: document.querySelector("#dictionaryImportInput"),
  cet4DictionarySearchInput: document.querySelector("#cet4DictionarySearchInput"),
  cet4DictionaryStats: document.querySelector("#cet4DictionaryStats"),
  cet4DictionaryStatus: document.querySelector("#cet4DictionaryStatus"),
  cet4DictionaryResults: document.querySelector("#cet4DictionaryResults"),
  cet4DictionaryPageSize: document.querySelector("#cet4DictionaryPageSize"),
  cet4DictionaryPrevBtn: document.querySelector("#cet4DictionaryPrevBtn"),
  cet4DictionaryNextBtn: document.querySelector("#cet4DictionaryNextBtn"),
  cet4DictionaryPageInfo: document.querySelector("#cet4DictionaryPageInfo"),
  importCet4DictionaryBtn: document.querySelector("#importCet4DictionaryBtn"),
  cet4DictionaryImportInput: document.querySelector("#cet4DictionaryImportInput"),
  mistakeForm: document.querySelector("#mistakeForm"),
  mistakeDate: document.querySelector("#mistakeDate"),
  mistakeSubject: document.querySelector("#mistakeSubject"),
  mistakeStars: document.querySelector("#mistakeStars"),
  mistakeImageInput: document.querySelector("#mistakeImageInput"),
  mistakeNote: document.querySelector("#mistakeNote"),
  mistakePreview: document.querySelector("#mistakePreview"),
  mistakeStatus: document.querySelector("#mistakeStatus"),
  mistakeFilterDate: document.querySelector("#mistakeFilterDate"),
  mistakeFilterSubject: document.querySelector("#mistakeFilterSubject"),
  mistakeList: document.querySelector("#mistakeList"),
  scoreTotal: document.querySelector("#scoreTotal"),
  scoreRank: document.querySelector("#scoreRank"),
  scoreProgress: document.querySelector("#scoreProgress"),
  achievementBadges: document.querySelector("#achievementBadges"),
  examCountdownList: document.querySelector("#examCountdownList"),
  dashboardStats: document.querySelector("#dashboardStats"),
  dashboardSubjects: document.querySelector("#dashboardSubjects"),
  entryScreen: document.querySelector("#entryScreen"),
  startLearningBtn: document.querySelector("#startLearningBtn"),
  entryThemeGrid: document.querySelector("#entryThemeGrid"),
  returnHomeBtn: document.querySelector("#returnHomeBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  exportTodayImageBtn: document.querySelector("#exportTodayImageBtn"),
  generateAllBtn: document.querySelector("#generateAllBtn"),
  notesBtn: document.querySelector("#notesBtn"),
  gameBtn: document.querySelector("#gameBtn"),
  relaxGameBtn: document.querySelector("#relaxGameBtn"),
  pomodoroBtn: document.querySelector("#pomodoroBtn"),
  reviewBtn: document.querySelector("#reviewBtn"),
  dataBackupBtn: document.querySelector("#dataBackupBtn"),
  notesModal: document.querySelector("#notesModal"),
  gameModal: document.querySelector("#gameModal"),
  relaxGameModal: document.querySelector("#relaxGameModal"),
  pomodoroModal: document.querySelector("#pomodoroModal"),
  reviewModal: document.querySelector("#reviewModal"),
  backupModal: document.querySelector("#backupModal"),
  exportDataBtn: document.querySelector("#exportDataBtn"),
  importDataBtn: document.querySelector("#importDataBtn"),
  compactDataBtn: document.querySelector("#compactDataBtn"),
  importDataInput: document.querySelector("#importDataInput"),
  backupStatus: document.querySelector("#backupStatus"),
  todayReminderModal: document.querySelector("#todayReminderModal"),
  todayReminderContent: document.querySelector("#todayReminderContent"),
  noteDate: document.querySelector("#noteDate"),
  noteBg: document.querySelector("#noteBg"),
  noteFont: document.querySelector("#noteFont"),
  noteSize: document.querySelector("#noteSize"),
  noteColor: document.querySelector("#noteColor"),
  noteText: document.querySelector("#noteText"),
  noteSearchInput: document.querySelector("#noteSearchInput"),
  noteSearchResults: document.querySelector("#noteSearchResults"),
  noteDatePreview: document.querySelector("#noteDatePreview"),
  gameWordBank: document.querySelector("#gameWordBank"),
  gamePromptWord: document.querySelector("#gamePromptWord"),
  gamePromptExample: document.querySelector("#gamePromptExample"),
  gameTranslationInput: document.querySelector("#gameTranslationInput"),
  gameWritingInput: document.querySelector("#gameWritingInput"),
  submitGameBtn: document.querySelector("#submitGameBtn"),
  nextGameBtn: document.querySelector("#nextGameBtn"),
  gameFeedback: document.querySelector("#gameFeedback"),
  englishWords: document.querySelector("#englishWords"),
  chineseWords: document.querySelector("#chineseWords"),
  gameScore: document.querySelector("#gameScore"),
  gameMessage: document.querySelector("#gameMessage"),
  restartGameBtn: document.querySelector("#restartGameBtn"),
  relaxStartMaleBtn: document.querySelector("#relaxStartMaleBtn"),
  relaxStartFemaleBtn: document.querySelector("#relaxStartFemaleBtn"),
  relaxHeroName: document.querySelector("#relaxHeroName"),
  relaxStageBadge: document.querySelector("#relaxStageBadge"),
  relaxEnemyName: document.querySelector("#relaxEnemyName"),
  relaxProgressText: document.querySelector("#relaxProgressText"),
  relaxScoreText: document.querySelector("#relaxScoreText"),
  relaxHeroHpText: document.querySelector("#relaxHeroHpText"),
  relaxEnemyHpText: document.querySelector("#relaxEnemyHpText"),
  relaxHeroHpBar: document.querySelector("#relaxHeroHpBar"),
  relaxEnemyHpBar: document.querySelector("#relaxEnemyHpBar"),
  relaxMuteBtn: document.querySelector("#relaxMuteBtn"),
  relaxResetBtn: document.querySelector("#relaxResetBtn"),
  relaxGameSummary: document.querySelector("#relaxGameSummary"),
  relaxGameCanvas: document.querySelector("#relaxGameCanvas"),
  relaxStageCounter: document.querySelector("#relaxStageCounter"),
  relaxPromptCn: document.querySelector("#relaxPromptCn"),
  relaxBossBadge: document.querySelector("#relaxBossBadge"),
  relaxAnswerInput: document.querySelector("#relaxAnswerInput"),
  relaxSubmitBtn: document.querySelector("#relaxSubmitBtn"),
  relaxSkipBtn: document.querySelector("#relaxSkipBtn"),
  relaxFeedback: document.querySelector("#relaxFeedback"),
  utilityNotesBtn: document.querySelector("#utilityNotesBtn"),
  utilityRelaxBtn: document.querySelector("#utilityRelaxBtn"),
  scrollTopBtn: document.querySelector("#scrollTopBtn"),
  heatmapGrid: document.querySelector("#heatmapGrid"),
  heatmapToggleButtons: document.querySelectorAll("[data-heatmap-view]"),
  exportWeeklyImageBtn: document.querySelector("#exportWeeklyImageBtn"),
  pomodoroDisplay: document.querySelector("#pomodoroDisplay"),
  pomodoroSubject: document.querySelector("#pomodoroSubject"),
  pomodoroMinutes: document.querySelector("#pomodoroMinutes"),
  startPomodoroBtn: document.querySelector("#startPomodoroBtn"),
  pausePomodoroBtn: document.querySelector("#pausePomodoroBtn"),
  finishPomodoroBtn: document.querySelector("#finishPomodoroBtn"),
  resetPomodoroBtn: document.querySelector("#resetPomodoroBtn"),
  pomodoroNote: document.querySelector("#pomodoroNote"),
  reviewForm: document.querySelector("#reviewForm"),
  reviewDate: document.querySelector("#reviewDate"),
  reviewPriority: document.querySelector("#reviewPriority"),
  reviewBlocker: document.querySelector("#reviewBlocker"),
  reviewMinimum: document.querySelector("#reviewMinimum")
};

const NOTE_KEY = "smart-study-note-v1";
function getBackupKeys() {
  return [STORAGE_KEY, DONE_KEY, FOCUS_KEY, REVIEW_KEY, THEME_KEY, NOTE_KEY, ENGLISH_FAVORITES_KEY, MISTAKE_KEY, DICTIONARY_KEY, CET4_DICTIONARY_KEY];
}

const dailyEnglishStories = [
  {
    title: "A Quiet Hour Before Sunrise",
    text: "Before sunrise, Lin opened her notebook and wrote down three small goals for the day. She knew that motivation would not always arrive on time, so she built a routine that could carry her forward when her mood was uncertain. For the first twenty minutes, she reviewed yesterday's mistakes without checking the answers. Then she read one short passage aloud, marking useful phrases in blue. By the time the city became noisy, her mind had already entered a steady rhythm. Progress, she realized, was not a sudden gift but a quiet result of returning to the desk again and again.",
    translation: "日出前，林打开笔记本，写下当天的三个小目标。她知道动力并不总会准时出现，所以建立了一套习惯，让自己在状态不稳定时也能继续前进。前二十分钟，她不看答案，先复盘昨天的错误。接着，她朗读一篇短文，并用蓝色标出有用表达。等城市渐渐喧闹起来时，她的思绪已经进入稳定节奏。她意识到，进步不是突然降临的礼物，而是一次又一次回到书桌前所产生的安静结果。",
    grammar: [
      ["Before sunrise", "时间状语放在句首，交代故事发生的时间。"],
      ["She knew that...", "that 引导宾语从句，说明“她知道”的具体内容。"],
      ["so she built...", "so 连接因果关系，前半句是原因，后半句是行动结果。"],
      ["when her mood was uncertain", "时间状语从句，也带有条件意味。"],
      ["marking useful phrases in blue", "现在分词短语，补充说明朗读时同时进行的动作。"],
      ["not a sudden gift but...", "not...but... 强调进步不是偶然，而是重复行动的结果。"]
    ]
  },
  {
    title: "The Seat by the Window",
    text: "Every afternoon, Chen chose the same seat by the library window. At first, he liked it simply because the light was warm and the corner was quiet. Later, the seat became a signal to his mind: once he sat down, he would stop checking messages and begin the hardest task first. Some days he finished a full chapter; other days he solved only three problems. Still, he recorded each attempt in a small notebook. Looking back after a month, he found that the ordinary seat had quietly trained him to begin before he felt ready.",
    translation: "每天下午，陈都会选择图书馆窗边的同一个座位。起初，他喜欢那里只是因为光线温暖、角落安静。后来，这个座位成了给大脑的信号：一坐下，他就停止查看消息，先开始最难的任务。有些日子他能完成整章内容，有些日子只解出三道题。即便如此，他仍把每次尝试记录在小本子里。一个月后回头看，他发现这个普通座位已经悄悄训练他在准备好之前就开始行动。",
    grammar: [
      ["At first", "表示时间顺序，常用于引出最初的状态。"],
      ["because the light was warm", "because 引导原因状语从句。"],
      ["once he sat down", "once 引导时间条件从句，表示“一旦”。"],
      ["the hardest task first", "first 作副词，强调优先顺序。"],
      ["Looking back after a month", "现在分词短语作状语，说明回顾时的发现。"]
    ]
  },
  {
    title: "A Mistake Worth Keeping",
    text: "Mia used to erase every wrong answer as soon as she found it. She thought a clean page meant a clear mind. One evening, however, her teacher asked her to keep the mistakes and write a short reason beside each one. The page soon looked messy, but it also became useful. She noticed that most errors came from rushing through the question, not from lacking knowledge. The next week, she slowed down before choosing an answer. Her score improved, and more importantly, she stopped treating mistakes as proof that she was failing.",
    translation: "米娅过去一发现错题就立刻擦掉。她以为干净的页面代表清晰的思路。然而有一天晚上，老师让她保留错误，并在旁边写下简短原因。页面很快变得杂乱，但也变得有用。她发现大多数错误来自匆忙读题，而不是知识不足。下一周，她在选择答案前放慢了速度。她的分数提高了，更重要的是，她不再把错误当作失败的证明。",
    grammar: [
      ["used to erase", "used to 表示过去常常做某事。"],
      ["as soon as", "引导时间状语从句，表示“一……就……”。"],
      ["however", "转折副词，用来引出变化或对比。"],
      ["not from lacking knowledge", "not from... 表示否定某个原因。"],
      ["more importantly", "插入语，用来强调后面的观点更重要。"]
    ]
  },
  {
    title: "Ten Minutes of Courage",
    text: "When the textbook looked too thick, Aaron promised himself only ten minutes. He would read one page, underline one definition, and close the book if he still felt tired. Surprisingly, ten minutes often became thirty. The hardest part was not understanding everything; it was opening the book when his mind wanted to escape. By lowering the starting line, he gave himself a chance to enter the task. This small rule did not make study effortless, but it changed his relationship with difficult work. He learned that courage can be brief and still be real.",
    translation: "当教材看起来太厚时，亚伦只要求自己坚持十分钟。他会读一页，划出一个定义；如果仍然觉得累，就合上书。令人意外的是，十分钟常常变成三十分钟。最难的部分不是理解一切，而是在大脑想逃避时打开书。通过降低开始的门槛，他给了自己进入任务的机会。这个小规则没有让学习变得毫不费力，但改变了他与困难任务的关系。他明白，勇气可以很短暂，却依然真实。",
    grammar: [
      ["When the textbook looked too thick", "when 引导时间状语从句。"],
      ["if he still felt tired", "if 引导条件状语从句。"],
      ["not understanding everything; it was opening...", "not...it was... 对真正难点进行强调。"],
      ["By lowering the starting line", "by doing 表示通过某种方式。"],
      ["that courage can be brief", "that 引导宾语从句。"]
    ]
  },
  {
    title: "The Sound of Review",
    text: "Nora discovered that review became easier when she used her own voice. After learning a new concept, she closed the book and explained it as if she were teaching a younger student. If her explanation stopped halfway, she knew exactly which part needed another look. The method felt awkward at first, especially in a quiet room, but it quickly exposed weak points that silent reading had hidden. Over time, her voice became a useful mirror. It showed whether an idea was truly clear or merely familiar because she had seen it many times.",
    translation: "诺拉发现，当她使用自己的声音时，复习会变得更容易。学完一个新概念后，她合上书，像在教低年级学生一样解释它。如果解释到一半停住，她就清楚知道哪一部分需要再看。这个方法起初有些尴尬，尤其是在安静的房间里，但它很快暴露出默读掩盖的薄弱点。随着时间推移，她的声音变成了一面有用的镜子。它能显示一个想法是真的清楚，还是只是因为看过很多遍而显得熟悉。",
    grammar: [
      ["when she used her own voice", "when 引导时间状语从句。"],
      ["as if she were teaching", "as if 引导方式状语从句，were 表示虚拟语气。"],
      ["which part needed another look", "which 引导宾语从句。"],
      ["that silent reading had hidden", "that 引导定语从句，修饰 weak points。"],
      ["whether...or...", "表示两种可能之间的判断。"]
    ]
  },
  {
    title: "A Plan That Can Bend",
    text: "David once believed that a good plan should be strict. If he missed one task, he felt the whole week had failed. Later, he learned to design a plan that could bend without breaking. He marked two tasks as essential and left one task as optional each day. When unexpected homework appeared, he could still protect the most important work. This flexible structure made him calmer, not lazier. Because the plan allowed ordinary problems to happen, he no longer abandoned it after a difficult day. A realistic plan, he found, was easier to trust.",
    translation: "大卫曾经相信，好计划就应该严格。如果漏掉一个任务，他就觉得整周都失败了。后来，他学会设计一种可以弯曲却不会断裂的计划。每天他把两个任务标为必做，把一个任务设为可选。当意外作业出现时，他仍能保护最重要的学习内容。这种灵活结构让他更平静，而不是更懒散。因为计划允许普通问题发生，他不再在困难的一天后放弃它。他发现，现实一点的计划更值得信任。",
    grammar: [
      ["that a good plan should be strict", "that 引导宾语从句。"],
      ["If he missed one task", "if 引导条件状语从句。"],
      ["without breaking", "介词 without 后接动名词。"],
      ["not lazier", "not 用于否定对比，说明灵活不等于懒散。"],
      ["Because the plan allowed...", "because 引导原因状语从句。"]
    ]
  },
  {
    title: "The Question List",
    text: "Instead of copying long notes, Sara kept a list of questions. Each question began with why, how, or what if. Why does this formula work? How would I explain this paragraph in my own words? What if the condition changes? The list made her study sessions more active. It also helped her notice the difference between recognizing an answer and producing one. Before each test, she covered the explanations and tried to answer the questions aloud. Some answers were imperfect, but the effort made her thinking sharper and her memory more reliable.",
    translation: "萨拉没有抄写大段笔记，而是保留一张问题清单。每个问题都以 why、how 或 what if 开头。这个公式为什么成立？我如何用自己的话解释这段文字？如果条件改变会怎样？这张清单让她的学习过程更主动。它还帮助她看清“认得答案”和“自己说出答案”之间的差别。每次考试前，她遮住解释，试着大声回答这些问题。有些答案并不完美，但这种努力让她的思考更清晰，记忆也更可靠。",
    grammar: [
      ["Instead of copying", "instead of 后接动名词，表示“不做……而做……”。"],
      ["Each question began with", "begin with 表示“以……开始”。"],
      ["between recognizing...and producing...", "between...and... 连接两个并列动名词。"],
      ["Before each test", "时间状语，说明动作发生在考试前。"],
      ["made her thinking sharper", "make + 宾语 + 形容词，表示使某物变得怎样。"]
    ]
  }
];
const DAILY_ENGLISH_TOTAL = 365;
const dailyEnglishSubjects = [
  ["AI Study Partner", "AI学习助手", "a student used an AI tool to compare two explanations before writing her own summary", "人工智能辅助学习"],
  ["Green Campus", "绿色校园", "a class redesigned its recycling corner after measuring how much paper was wasted", "校园环保"],
  ["Digital Payment", "数字支付", "a volunteer helped an elderly neighbor learn to pay safely with a phone", "数字生活"],
  ["Public Health", "公共健康", "a school club created posters that encouraged students to sleep earlier before exams", "健康校园"],
  ["Space News", "航天新闻", "students followed a space mission and discussed why patience matters in science", "航天探索"],
  ["Smart Library", "智慧图书馆", "a library introduced quiet sensors and seat reservations to reduce waiting time", "智慧校园"],
  ["Online Course", "在线课程", "a rural student joined a free online lecture and asked her first question in public", "教育公平"],
  ["City Transport", "城市交通", "commuters tried a new bus route that made reading on the way possible", "绿色出行"],
  ["Food Waste", "食物浪费", "a cafeteria team weighed leftovers and changed the menu with student feedback", "节约粮食"],
  ["Community Service", "社区服务", "college students taught children how to organize homework with simple checklists", "志愿服务"],
  ["Traditional Culture", "传统文化", "a young designer used local patterns in a modern poster for a school exhibition", "文化传承"],
  ["Mental Health", "心理健康", "a student learned to ask for help before pressure became too heavy", "情绪管理"],
  ["Climate Adaptation", "气候适应", "a neighborhood planted more trees after several unusually hot afternoons", "气候变化"],
  ["Data Privacy", "数据隐私", "friends discussed why a free app still deserved careful privacy settings", "网络安全"],
  ["Rural Revitalization", "乡村振兴", "a graduate returned home to help farmers sell fruit through short videos", "乡村发展"],
  ["Museum Night", "博物馆夜游", "visitors used audio guides to understand an old object from several angles", "公共文化"],
  ["Sports Habit", "运动习惯", "a tired student began with ten minutes of walking and slowly built endurance", "健康生活"],
  ["Language Corner", "英语角", "two shy learners practiced asking questions instead of memorizing perfect speeches", "语言学习"],
  ["Exam Fairness", "考试公平", "teachers discussed how clear rules could reduce anxiety during an important test", "教育评价"],
  ["Ocean Protection", "海洋保护", "students tracked plastic bottles on a beach and proposed a small deposit system", "海洋保护"],
  ["Reading Festival", "阅读节", "a school held a book exchange where every note carried a personal recommendation", "阅读推广"],
  ["Robot Helper", "机器人助手", "a service robot guided visitors while staff focused on difficult requests", "智能服务"],
  ["Energy Saving", "节能行动", "a dormitory compared electricity bills and changed small daily habits", "节能减排"],
  ["Local Market", "本地市集", "young people interviewed sellers to understand how prices and weather were connected", "社会观察"],
  ["Creative Writing", "创意写作", "a student turned a news headline into a short story about responsibility", "写作训练"],
  ["Inclusive Design", "包容设计", "a team improved signs on campus so that new students could find rooms faster", "无障碍设计"],
  ["Science Fair", "科学展", "a group explained a simple experiment to children using everyday objects", "科普表达"],
  ["Part-time Work", "兼职经历", "a student learned time management while working at a weekend bookstore", "劳动教育"],
  ["Cultural Exchange", "文化交流", "international students cooked together and compared the stories behind family dishes", "跨文化交流"],
  ["Emergency Skills", "应急技能", "a training session showed students how to respond calmly during a sudden alarm", "安全教育"],
  ["Digital Reading", "数字阅读", "a reader used an e-book app but kept a paper notebook for deeper thinking", "数字阅读"],
  ["Urban Garden", "城市花园", "neighbors turned an empty corner into a small garden for children and seniors", "社区治理"],
  ["Career Choice", "职业选择", "a senior student interviewed workers before deciding what kind of job suited him", "职业规划"],
  ["Science Podcast", "科学播客", "a podcast helped classmates discuss difficult discoveries in plain language", "媒体素养"],
  ["Water Saving", "节水行动", "a school measured water use and repaired small leaks that had been ignored", "资源节约"],
  ["Heritage Walk", "历史街区", "students walked through an old street and recorded changes in local life", "城市记忆"],
  ["Volunteer Tutor", "支教志愿者", "a volunteer learned that encouragement could be as important as correct answers", "教育支持"],
  ["Digital Museum", "数字博物馆", "an online exhibition allowed students to compare artifacts without leaving school", "数字文化"],
  ["Healthy Canteen", "健康食堂", "students voted for lighter meals and learned how choices shape public service", "饮食健康"],
  ["Shared Bike", "共享单车", "a class studied why convenience also requires users to follow public rules", "公共秩序"],
  ["Media Rumor", "网络谣言", "a student checked three sources before sharing a surprising message", "信息辨别"],
  ["Wildlife Camera", "野生动物相机", "researchers used cameras to observe animals without disturbing their habitat", "生态保护"],
  ["Micro Habit", "微习惯", "a learner used five-minute reviews to protect progress on busy days", "习惯养成"],
  ["Campus Debate", "校园辩论", "a debate taught students to listen carefully before defending their own opinion", "思辨能力"],
  ["Old Book Repair", "古籍修复", "a repair worker showed how patience can protect knowledge from disappearing", "文化保护"],
  ["New Energy Car", "新能源汽车", "a family planned a trip around charging stations and learned about clean transport", "科技生活"],
  ["Morning Market", "早市故事", "a teenager helped grandparents record prices and understand neighborhood changes", "生活观察"],
  ["Online Meeting", "线上会议", "a team learned to make remote discussion shorter, clearer and more respectful", "数字协作"],
  ["Waste Sorting", "垃圾分类", "a volunteer station made confusing labels easier for busy residents to follow", "城市管理"],
  ["Personal Budget", "个人预算", "a freshman tracked small expenses and discovered where his money really went", "财商教育"],
  ["Cloud Classroom", "云课堂", "a teacher used recorded lessons to give absent students a fair second chance", "教育技术"],
  ["Local Library", "社区图书馆", "children visited a tiny library that stayed open late during exam season", "公共服务"],
  ["Senior Smartphone", "银发数字课", "teenagers taught seniors how to avoid suspicious links and false discounts", "数字包容"],
  ["Green Factory", "绿色工厂", "visitors saw how cleaner machines reduced noise, smoke and waste at the same time", "产业升级"],
  ["Rainy Commute", "雨天通勤", "a student noticed how small acts of patience kept a crowded station orderly", "公共文明"],
  ["Campus Farm", "校园农场", "students grew vegetables and finally understood the cost of one simple meal", "劳动实践"],
  ["News Translation", "新闻翻译", "a class translated a report and learned that accuracy matters more than speed", "翻译能力"],
  ["Open Source", "开源项目", "a beginner fixed a small typo and felt connected to a global community", "开放协作"],
  ["Smart Watch", "智能手表", "a runner used health data wisely instead of letting every number control her mood", "科技与健康"],
  ["Art Therapy", "艺术疗愈", "students used drawing to express pressure that was difficult to explain in words", "心理表达"],
  ["Neighborhood Map", "社区地图", "residents marked useful places so newcomers could settle in more easily", "社区互助"],
  ["Clean River", "清洁河流", "a survey helped students see how daily behavior affected water far away", "环境责任"],
  ["Short Video", "短视频学习", "a learner turned quick videos into notes instead of letting them steal attention", "媒介使用"],
  ["Exam Room", "考场心态", "a candidate used slow breathing to regain focus before reading the first question", "考试心理"],
  ["Coffee Shop Study", "咖啡馆学习", "friends tested whether background noise helped or harmed their concentration", "学习环境"],
  ["Young Researcher", "青年研究者", "a student repeated one experiment many times before trusting the result", "科学精神"],
  ["Public Speaking", "公众表达", "a quiet student practiced one clear opening sentence before giving a presentation", "表达能力"],
  ["Repaired Bicycle", "修车经历", "a broken bicycle taught a student to ask practical questions before giving up", "解决问题"],
  ["Festival Train", "节日列车", "travelers shared snacks and stories during a long ride home", "社会温情"],
  ["Campus App", "校园应用", "students suggested a simpler app design after watching new users struggle", "用户体验"],
  ["Forest Class", "森林课堂", "a biology lesson outdoors made textbook words easier to remember", "自然教育"],
  ["Quiet Leadership", "安静领导力", "a group leader solved conflict by asking each member what they needed", "团队合作"]
];
const dailyEnglishOpenings = [
  "This week,",
  "On a busy morning,",
  "During a school project,",
  "After reading a recent report,",
  "In a small community,"
];
const dailyEnglishLessons = [
  ["careful observation can turn ordinary events into useful knowledge", "细致观察能把普通事件变成有用知识"],
  ["technology works best when people use it with judgment and kindness", "当人们带着判断力和善意使用技术时，它最能发挥作用"],
  ["small choices often reveal a person's sense of responsibility", "细小选择常常体现一个人的责任感"],
  ["real progress usually begins with a question that is honestly asked", "真正的进步通常始于一个真诚提出的问题"],
  ["public problems require patience, evidence and cooperation", "公共问题需要耐心、证据和合作"]
];
const dailyEnglishIssueMap = {
  "人工智能辅助学习": ["responsible use of artificial intelligence in education", "教育中负责任地使用人工智能"],
  "校园环保": ["environmental protection on campus", "校园环保"],
  "数字生活": ["safe and convenient digital life", "安全便捷的数字生活"],
  "健康校园": ["healthy routines at school", "校园健康习惯"],
  "航天探索": ["space exploration and scientific patience", "航天探索与科学耐心"],
  "智慧校园": ["smart campus services", "智慧校园服务"],
  "教育公平": ["fair access to education", "教育公平"],
  "绿色出行": ["green transport in daily life", "日常生活中的绿色出行"],
  "节约粮食": ["reducing food waste", "减少食物浪费"],
  "志愿服务": ["community service and responsibility", "志愿服务与责任"],
  "文化传承": ["the protection of traditional culture", "传统文化保护"],
  "情绪管理": ["mental health and emotional balance", "心理健康与情绪平衡"],
  "气候变化": ["climate change and local action", "气候变化与本地行动"],
  "网络安全": ["data privacy and online safety", "数据隐私与网络安全"],
  "乡村发展": ["rural development in the digital age", "数字时代的乡村发展"],
  "公共文化": ["public culture and museum learning", "公共文化与博物馆学习"],
  "健康生活": ["healthy habits and regular exercise", "健康习惯与规律运动"],
  "语言学习": ["active practice in language learning", "语言学习中的主动练习"],
  "教育评价": ["fair rules in educational assessment", "教育评价中的公平规则"],
  "海洋保护": ["ocean protection and plastic reduction", "海洋保护与减少塑料"],
  "阅读推广": ["reading habits and book sharing", "阅读习惯与图书分享"],
  "智能服务": ["robots and human-centered service", "机器人与以人为本的服务"],
  "节能减排": ["energy saving and carbon reduction", "节能减排"],
  "社会观察": ["observing social changes in local life", "从本地生活观察社会变化"],
  "写作训练": ["creative writing and responsible expression", "创意写作与负责任表达"],
  "无障碍设计": ["inclusive design in public spaces", "公共空间中的包容设计"],
  "科普表达": ["science communication in simple language", "用简单语言进行科普表达"],
  "劳动教育": ["work experience and time management", "劳动经历与时间管理"],
  "跨文化交流": ["cultural exchange and mutual understanding", "跨文化交流与相互理解"],
  "安全教育": ["emergency skills and calm action", "应急技能与冷静行动"],
  "数字阅读": ["digital reading and deep thinking", "数字阅读与深度思考"],
  "社区治理": ["community gardens and shared spaces", "社区花园与共享空间"],
  "职业规划": ["career planning through real interviews", "通过真实访谈进行职业规划"],
  "媒体素养": ["media literacy and scientific information", "媒体素养与科学信息"],
  "资源节约": ["saving water and public resources", "节约用水与公共资源"],
  "城市记忆": ["urban memory and historical streets", "城市记忆与历史街区"],
  "教育支持": ["volunteer tutoring and encouragement", "支教志愿服务与鼓励"],
  "数字文化": ["digital museums and cultural learning", "数字博物馆与文化学习"],
  "饮食健康": ["healthy meals and student choices", "健康饮食与学生选择"],
  "公共秩序": ["shared bikes and public rules", "共享单车与公共规则"],
  "信息辨别": ["identifying rumors and checking sources", "辨别谣言与核查来源"],
  "生态保护": ["wildlife observation and habitat protection", "野生动物观察与栖息地保护"],
  "习惯养成": ["micro habits and steady progress", "微习惯与稳定进步"],
  "思辨能力": ["debate and critical thinking", "辩论与批判性思维"],
  "文化保护": ["repairing old books and protecting knowledge", "古籍修复与知识保护"],
  "科技生活": ["new energy cars and daily technology", "新能源汽车与日常科技"],
  "生活观察": ["market life and social details", "市场生活与社会细节"],
  "数字协作": ["online meetings and teamwork", "线上会议与团队合作"],
  "城市管理": ["waste sorting and urban management", "垃圾分类与城市管理"],
  "财商教育": ["personal budgeting and financial awareness", "个人预算与财商意识"],
  "教育技术": ["cloud classrooms and learning support", "云课堂与学习支持"],
  "公共服务": ["local libraries and public service", "社区图书馆与公共服务"],
  "数字包容": ["helping seniors use digital tools", "帮助老年人使用数字工具"],
  "产业升级": ["green factories and industrial upgrading", "绿色工厂与产业升级"],
  "公共文明": ["patience and order in public places", "公共场所中的耐心与秩序"],
  "劳动实践": ["campus farming and respect for labor", "校园农场与尊重劳动"],
  "翻译能力": ["news translation and accuracy", "新闻翻译与准确性"],
  "开放协作": ["open-source projects and global cooperation", "开源项目与全球协作"],
  "科技与健康": ["health data and wise self-management", "健康数据与明智自我管理"],
  "心理表达": ["art therapy and emotional expression", "艺术疗愈与情绪表达"],
  "社区互助": ["neighborhood maps and mutual help", "社区地图与邻里互助"],
  "环境责任": ["clean rivers and environmental responsibility", "清洁河流与环境责任"],
  "媒介使用": ["short videos and attention management", "短视频与注意力管理"],
  "考试心理": ["exam pressure and calm focus", "考试压力与冷静专注"],
  "学习环境": ["study spaces and concentration", "学习环境与专注力"],
  "科学精神": ["experiments and scientific patience", "实验与科学耐心"],
  "表达能力": ["public speaking and clear expression", "公众表达与清晰表达"],
  "解决问题": ["repair experience and practical questions", "修理经历与实际问题"],
  "社会温情": ["travel stories and kindness in public life", "旅途故事与社会温情"],
  "用户体验": ["campus apps and user experience", "校园应用与用户体验"],
  "自然教育": ["outdoor lessons and nature education", "户外课堂与自然教育"],
  "团队合作": ["quiet leadership and teamwork", "安静领导力与团队合作"]
};
const dailyEnglishGrammar = [
  ["through a real campus example", "介词短语作方式状语，说明学生通过什么方式展开讨论。"],
  ["because similar themes often appear...", "because 引导原因状语从句，解释为什么该话题值得关注。"],
  ["Instead of repeating empty opinions", "instead of 后接动名词，表示“不做……而做……”。"],
  ["questions that still needed evidence", "that 引导定语从句，修饰前面的 questions。"],
  ["when each person offered...", "when 引导时间状语从句，说明讨论变得有用的时间条件。"],
  ["The more carefully..., the more naturally...", "the more..., the more... 表示“越……越……”。"]
];
const cet6WordSource = `
abundant|丰富的，充裕的|丰富,充裕,大量|The library offers abundant resources for independent study.
adapt|适应，改编|适应,改编,调整|Students need to adapt their methods to different subjects.
adequate|足够的，合格的|足够,充分,合格|Adequate preparation reduces anxiety before an exam.
advocate|提倡，拥护；倡导者|提倡,倡导,拥护|Many teachers advocate active recall instead of passive reading.
allocate|分配，配置|分配,配置,安排|She allocated more time to difficult chapters.
ambiguous|模糊的，有歧义的|模糊,歧义,不明确|An ambiguous instruction may lead to different answers.
anticipate|预期，预料|预期,预料,预计|Good learners anticipate common mistakes before practicing.
assess|评估，评价|评估,评价,判断|Weekly tests help assess whether the plan is working.
attribute|把……归因于；属性|归因,属性,特征|Do not attribute every failure to a lack of talent.
comprehensive|全面的，综合的|全面,综合,完整|A comprehensive review includes concepts, examples and errors.
concentrate|集中注意力|集中,专注,注意力|It is easier to concentrate after removing distractions.
consistent|一致的，持续的|一致,持续,稳定|Consistent practice matters more than occasional long sessions.
crucial|关键的，至关重要的|关键,重要,至关重要|Understanding definitions is crucial in advanced mathematics.
derive|获得，源于，推导出|获得,源于,推导|The formula can be derived from a basic principle.
eliminate|消除，排除|消除,排除,淘汰|Error analysis helps eliminate repeated mistakes.
emphasize|强调，重视|强调,重视,突出|The teacher emphasized the importance of reviewing notes.
enhance|提高，增强|提高,增强,改善|Short summaries can enhance long-term memory.
evaluate|评价，评估|评价,评估,估计|You should evaluate your progress at the end of each week.
inevitable|不可避免的|不可避免,必然|Some confusion is inevitable when learning a new topic.
maintain|维持，保持|维持,保持,维护|A planner helps maintain a steady learning rhythm.
obstacle|障碍，阻碍|障碍,阻碍,困难|A difficult chapter is an obstacle, not a dead end.
priority|优先事项，优先权|优先,重点,优先事项|Your weakest subject should become a priority this week.
reinforce|加强，巩固|加强,巩固,强化|Practice questions reinforce what you have just learned.
substantial|大量的，实质性的|大量,实质,显著|A substantial improvement often comes from small daily actions.
accumulate|积累，堆积|积累,堆积,累积|Knowledge accumulates when review is repeated over time.
acknowledge|承认，认可，感谢|承认,认可,感谢|It is wise to acknowledge a weakness before trying to fix it.
alternative|替代的；选择|替代,选择,备选|An alternative plan can help when the first plan fails.
apparent|明显的，表面上的|明显,表面,显然|The apparent solution was not the most efficient one.
approach|方法，接近，处理|方法,接近,处理|A new approach made the difficult passage easier to understand.
approximately|大约，近似地|大约,约,近似|The task took approximately forty minutes to finish.
capacity|能力，容量|能力,容量,承载|Daily practice increases the capacity to focus.
category|种类，类别|种类,类别,分类|The errors were divided into several categories.
circumstance|情况，环境|情况,环境,情形|Good decisions depend on the actual circumstances.
collapse|倒塌，崩溃|倒塌,崩溃,瓦解|The plan may collapse if it has no room for rest.
commitment|承诺，投入，责任|承诺,投入,责任|Long-term progress requires commitment, not only interest.
component|组成部分，部件|组成,部分,部件|Vocabulary is only one component of language ability.
consequence|后果，结果，影响|后果,结果,影响|Every choice has a consequence for future study.
considerable|相当大的，可观的|相当大,可观,重要|The new method brought considerable improvement.
constant|持续的，经常的|持续,经常,不断|Constant interruptions make deep thinking difficult.
contrast|对比，对照|对比,对照,差异|The essay asks students to contrast two opinions.
contribute|贡献，促成，有助于|贡献,促成,有助于|Sleep contributes to memory and attention.
controversial|有争议的|争议,有争议,争论|The policy remains controversial among students.
cooperate|合作，协作|合作,协作,配合|Group members must cooperate to finish the project.
coordinate|协调，配合，统筹|协调,配合,统筹|The monitor coordinated the schedule for the whole class.
decline|下降，拒绝，减少|下降,拒绝,减少|The number of mistakes began to decline.
demonstrate|证明，展示，说明|证明,展示,说明|The experiment demonstrated a basic scientific principle.
dimension|方面，维度，尺寸|方面,维度,尺寸|The problem has an economic dimension as well.
domestic|国内的，家庭的|国内,家庭,本国|Domestic news can also provide useful writing topics.
efficient|高效的，有效率的|高效,有效率,效率|An efficient learner checks results and adjusts quickly.
emerge|出现，浮现，显现|出现,浮现,显现|New problems emerge when technology changes daily life.
enable|使能够，促使|使能够,让,促使|Digital tools enable students to learn beyond the classroom.
encounter|遇到，遭遇|遇到,遭遇,碰到|Everyone may encounter difficulty in a new field.
essential|必要的，本质的|必要,重要,本质|Clear definitions are essential in mathematics.
expand|扩大，扩展，拓展|扩大,扩展,拓展|Reading can expand both vocabulary and imagination.
factor|因素，要素|因素,要素,原因|Time is only one factor in exam preparation.
flexible|灵活的，有弹性的|灵活,弹性,可变|A flexible plan is easier to follow for months.
fundamental|基础的，根本的|基础,根本,基本|Fundamental concepts should be reviewed first.
generate|产生，生成，引发|产生,生成,引发|Good questions generate deeper discussion.
guarantee|保证，担保，保障|保证,担保,保障|A plan cannot guarantee success without action.
highlight|突出，强调，亮点|突出,强调,亮点|The teacher highlighted three common mistakes.
identical|相同的，完全一致的|相同,一致,完全一样|The two answers are not identical in meaning.
illustrate|说明，阐明，举例|说明,阐明,举例|The example illustrates the rule clearly.
implement|实施，执行，落实|实施,执行,落实|The class decided to implement a new review system.
indicate|表明，指出，显示|表明,指出,显示|The data indicate that habits changed gradually.
individual|个人，个体的，单独的|个人,个体,单独|Each individual has a different learning rhythm.
initial|最初的，开始的|最初,开始,初始|The initial result was not very encouraging.
innovation|创新，革新|创新,革新,新方法|Innovation often begins with a practical problem.
interpret|解释，理解，解读|解释,理解,解读|Students should interpret charts carefully.
investigate|调查，研究，探究|调查,研究,探究|The group investigated the causes of food waste.
justify|证明……合理，为……辩护|证明合理,辩护,说明理由|You need evidence to justify your opinion.
launch|发起，启动，发射|发起,启动,发射|The school launched a reading campaign.
modify|修改，调整，改变|修改,调整,改变|A plan should be modified after feedback.
monitor|监测，监督，观察|监测,监督,观察|Students monitored their screen time for a week.
mutual|相互的，共同的|相互,共同,彼此|Mutual respect makes teamwork easier.
notion|概念，观念，想法|概念,观念,想法|The notion of success changes with experience.
objective|目标；客观的|目标,客观,目的|An objective record is better than a vague feeling.
obtain|获得，得到，取得|获得,得到,取得|Reliable information is not always easy to obtain.
occupy|占据，占用，占领|占据,占用,占领|Small tasks can occupy too much attention.
option|选择，选项，方案|选择,选项,方案|Keeping one optional task makes the plan realistic.
participate|参加，参与，加入|参加,参与,加入|More students began to participate in the discussion.
perceive|察觉，认为，感知|察觉,认为,感知|People may perceive the same event differently.
phenomenon|现象，情况|现象,情况|Online learning is now a common phenomenon.
potential|潜在的；潜力|潜在,潜力,可能|Every mistake has potential value for review.
previous|以前的，先前的|以前,先前,之前|Previous experience can guide future decisions.
principle|原则，原理，准则|原则,原理,准则|The principle is simple but powerful.
proportion|比例，部分，份额|比例,部分,份额|A large proportion of time was spent reviewing.
pursue|追求，从事，致力于|追求,从事,致力于|Many students pursue progress through steady practice.
relevant|相关的，有关的|相关,有关,切题|Relevant examples make an argument stronger.
reluctant|不情愿的，勉强的|不情愿,勉强,犹豫|He was reluctant to ask for help at first.
rely|依靠，依赖，凭借|依靠,依赖,凭借|Do not rely only on rereading.
resolve|解决，决定，下决心|解决,决定,下决心|The team resolved the problem through discussion.
resource|资源，资料，能源|资源,资料,能源|Public libraries are valuable learning resources.
restore|恢复，修复，还原|恢复,修复,还原|A short break can restore attention.
significant|重要的，显著的|重要,显著,有意义|The change produced significant results.
stimulate|刺激，激发，促进|刺激,激发,促进|Questions stimulate deeper thinking.
strategy|策略，战略，方法|策略,战略,方法|A review strategy should fit the exam.
sufficient|足够的，充分的|足够,充分,充足|Sufficient sleep supports memory.
transform|转变，改造，转换|转变,改造,转换|Feedback can transform a weak essay.
ultimate|最终的，根本的|最终,根本,极限|The ultimate goal is independent learning.
undertake|承担，从事，着手|承担,从事,着手|The group undertook a survey on campus life.
valid|有效的，合理的，正当的|有效,合理,正当|A valid argument needs evidence.
vary|变化，改变，不同|变化,改变,不同|Methods vary from subject to subject.
visible|可见的，明显的|可见,明显,看得见|Visible progress increases confidence.
welfare|福利，幸福，福祉|福利,幸福,福祉|Public welfare depends on shared responsibility.
`;
const cleanCet6Words = cet6WordSource
  .trim()
  .split("\n")
  .map((line) => {
    const [word, translation, keywordText, example] = line.split("|");
    return { word, translation, keywords: keywordText.split(","), example };
  });
const builtInCet6Source = globalThis.CET6_DICTIONARY || null;
const cleanCet6BuiltInWords = Array.isArray(builtInCet6Source?.words)
  ? builtInCet6Source.words.map((entry) => normalizeDictionaryEntry(entry, "word")).filter(Boolean)
  : [];
const cleanCet6Phrases = Array.isArray(builtInCet6Source?.phrases)
  ? builtInCet6Source.phrases.map((entry) => normalizeDictionaryEntry(entry, "phrase")).filter(Boolean)
  : [];
const builtInCet4Source = globalThis.CET4_DICTIONARY || null;
const cleanCet4BuiltInWords = Array.isArray(builtInCet4Source?.words)
  ? builtInCet4Source.words.map((entry) => normalizeDictionaryEntry(entry, "word")).filter(Boolean)
  : [];
const cleanCet4Phrases = Array.isArray(builtInCet4Source?.phrases)
  ? builtInCet4Source.phrases.map((entry) => normalizeDictionaryEntry(entry, "phrase")).filter(Boolean)
  : [];
let gameDeck = [];
let currentGameWord = null;
let gameRound = 0;
let gameTotalScore = 0;
let selectedEnglish = null;
let selectedChinese = null;
let matchedPairs = new Set();
let relaxGameState = createRelaxGameState();
let relaxGameFrame = 0;
let relaxGameAnimationId = 0;
let relaxAudioContext = null;
let relaxMusicTimer = null;
let relaxAdvanceTimer = 0;

let doneState = loadDoneState();
let focusState = loadObject(FOCUS_KEY);
let reviewState = loadObject(REVIEW_KEY);
let englishFavoriteState = loadObject(ENGLISH_FAVORITES_KEY);
let mistakeState = normalizeMistakeState(loadObject(MISTAKE_KEY));
let dictionaryState = normalizeDictionaryState(loadObject(DICTIONARY_KEY));
let cet4DictionaryState = normalizeDictionaryState(loadObject(CET4_DICTIONARY_KEY));
let currentDailyEnglishStory = null;
let currentDailyEnglishIndex = 0;
let currentMistakeStar = 3;
let currentMistakeImage = "";
let pomodoroTimer = null;
let pomodoroRemaining = 25 * 60;
let pomodoroStartedSeconds = 25 * 60;

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return normalizeState({ books: structuredClone(initialBooks), activeId: initialBooks[0].id });
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.books) && parsed.books.length) {
      return normalizeState(parsed);
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return normalizeState({ books: structuredClone(initialBooks), activeId: initialBooks[0].id });
}

function normalizeState(rawState) {
  const year = today.getFullYear();
  rawState.books = rawState.books.map((book) => ({
    ...book,
    year: Number(book.year) || year
  }));
  if (!rawState.books.some((book) => book.id === rawState.activeId)) {
    rawState.activeId = rawState.books[0].id;
  }
  return rawState;
}

function saveState() {
  state.activeId = activeId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadDoneState() {
  try {
    return JSON.parse(localStorage.getItem(DONE_KEY)) || {};
  } catch {
    localStorage.removeItem(DONE_KEY);
    return {};
  }
}

function saveDoneState() {
  localStorage.setItem(DONE_KEY, JSON.stringify(doneState));
}

function loadObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    localStorage.removeItem(key);
    return {};
  }
}

function saveFocusState() {
  localStorage.setItem(FOCUS_KEY, JSON.stringify(focusState));
}

function saveReviewState() {
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewState));
}

function saveEnglishFavorites() {
  localStorage.setItem(ENGLISH_FAVORITES_KEY, JSON.stringify(englishFavoriteState));
}

function saveMistakeState() {
  localStorage.setItem(MISTAKE_KEY, JSON.stringify(mistakeState));
}

function saveDictionaryState() {
  localStorage.setItem(DICTIONARY_KEY, JSON.stringify(dictionaryState));
}

function saveCet4DictionaryState() {
  localStorage.setItem(CET4_DICTIONARY_KEY, JSON.stringify(cet4DictionaryState));
}

function normalizeMistakeState(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function normalizeDictionaryEntry(entry, type = "word") {
  if (!entry) return null;
  if (typeof entry === "string") {
    const [term, translation = "", keywords = "", example = "", phonetic = ""] = entry.split("|");
    if (!term?.trim()) return null;
    return {
      type,
      word: term.trim(),
      translation: translation.trim(),
      keywords: keywords.split(",").map((item) => item.trim()).filter(Boolean),
      example: example.trim(),
      phonetic: phonetic.trim()
    };
  }
  const term = entry.word || entry.phrase || entry.term || entry.text;
  if (!term) return null;
  return {
    type: entry.type || type,
    word: String(term).trim(),
    translation: String(entry.translation || entry.meaning || entry.cn || entry.explain || "").trim(),
    phonetic: String(entry.phonetic || entry.pronunciation || "").trim(),
    keywords: Array.isArray(entry.keywords)
      ? entry.keywords
      : String(entry.keywords || entry.tags || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
    example: String(entry.example || entry.sentence || "").trim()
  };
}

function normalizeDictionaryState(raw) {
  const words = [];
  const phrases = [];
  const seen = new Set();
  const pushEntry = (entry, fallbackType) => {
    const normalized = normalizeDictionaryEntry(entry, fallbackType);
    if (!normalized) return;
    const key = `${normalized.type || fallbackType}::${normalized.word.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (normalized.type === "phrase") phrases.push(normalized);
    else words.push(normalized);
  };
  if (Array.isArray(raw)) {
    raw.forEach((entry) => pushEntry(entry, entry?.type || "word"));
  } else {
    (raw?.words || []).forEach((entry) => pushEntry(entry, "word"));
    (raw?.phrases || []).forEach((entry) => pushEntry(entry, "phrase"));
  }
  return { words, phrases };
}

function renderDailyEnglish() {
  const startDate = new Date("2026-06-09T00:00:00");
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((todayStart - startDate) / 86400000);
  const story = createDailyEnglishStory(dayIndex);
  currentDailyEnglishStory = story;
  currentDailyEnglishIndex = ((dayIndex % DAILY_ENGLISH_TOTAL) + DAILY_ENGLISH_TOTAL) % DAILY_ENGLISH_TOTAL;
  nodes.dailyEnglishTitle.textContent = story.title;
  nodes.dailyEnglishText.textContent = story.text;
  nodes.dailyEnglishTranslation.textContent = story.translation;
  nodes.dailyEnglishGrammar.innerHTML = "";
  story.grammar.forEach(([pattern, explanation]) => {
    const item = document.createElement("p");
    item.innerHTML = `<strong>${pattern}</strong> ${explanation}`;
    nodes.dailyEnglishGrammar.append(item);
  });
  renderEnglishFavorites();
}

function toggleDailyEnglishFavorite() {
  if (!currentDailyEnglishStory) return;
  const key = `story-${currentDailyEnglishIndex}`;
  if (englishFavoriteState[key]) {
    delete englishFavoriteState[key];
  } else {
    englishFavoriteState[key] = {
      index: currentDailyEnglishIndex,
      date: isoDate(new Date()),
      title: currentDailyEnglishStory.title,
      text: currentDailyEnglishStory.text,
      translation: currentDailyEnglishStory.translation
    };
  }
  saveEnglishFavorites();
  renderEnglishFavorites();
  renderDashboard();
}

function renderEnglishFavorites() {
  if (!nodes.favoriteEnglishBtn || !nodes.favoriteEnglishList || !currentDailyEnglishStory) return;
  const key = `story-${currentDailyEnglishIndex}`;
  const isFavorite = Boolean(englishFavoriteState[key]);
  nodes.favoriteEnglishBtn.textContent = isFavorite ? "取消收藏" : "收藏今日短篇";
  nodes.favoriteEnglishBtn.classList.toggle("active", isFavorite);
  const favorites = Object.values(englishFavoriteState).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  nodes.favoriteEnglishList.innerHTML = "";
  if (!favorites.length) {
    nodes.favoriteEnglishList.innerHTML = `<div class="empty-book-list">还没有收藏。遇到适合作文和翻译积累的短篇，可以先收藏起来。</div>`;
    return;
  }
  favorites.slice(0, 12).forEach((item) => {
    const card = document.createElement("article");
    card.className = "favorite-card";
    card.innerHTML = `
      <div>
        <strong>${item.title}</strong>
        <span>${item.date}</span>
      </div>
      <p>${item.text.slice(0, 150)}...</p>
      <p class="translation">${item.translation.slice(0, 92)}...</p>
    `;
    nodes.favoriteEnglishList.append(card);
  });
}

function withBuiltInSource(entries, type) {
  return entries.map((item) => ({ ...item, type, source: "built-in" }));
}

function builtInDictionaryWords() {
  const sourceWords = cleanCet6BuiltInWords.length ? cleanCet6BuiltInWords : cleanCet6Words;
  return withBuiltInSource(sourceWords, "word");
}

function builtInDictionaryPhrases() {
  return withBuiltInSource(cleanCet6Phrases, "phrase");
}

function builtInCet4DictionaryWords() {
  return withBuiltInSource(cleanCet4BuiltInWords, "word");
}

function builtInCet4DictionaryPhrases() {
  return withBuiltInSource(cleanCet4Phrases, "phrase");
}

function getDictionaryEntriesFromSources(builtInWords, builtInPhrases, customDictionaryState) {
  const entries = [...builtInWords, ...builtInPhrases, ...customDictionaryState.words, ...customDictionaryState.phrases];
  const seen = new Set();
  return entries.filter((entry) => {
    const key = `${entry.type || "word"}::${entry.word.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getDictionaryEntries() {
  return getDictionaryEntriesFromSources(builtInDictionaryWords(), builtInDictionaryPhrases(), dictionaryState);
}

function getCet4DictionaryEntries() {
  return getDictionaryEntriesFromSources(builtInCet4DictionaryWords(), builtInCet4DictionaryPhrases(), cet4DictionaryState);
}

function getGameWordPool() {
  return getDictionaryEntries()
    .filter((item) => item.type !== "phrase")
    .filter((item) => item.word && item.translation)
    .map((item) => ({
      word: item.word,
      translation: item.translation,
      keywords: item.keywords?.length ? item.keywords : item.translation.split(/[，,、\s]+/).filter(Boolean),
      example: item.example || `A good learner can use ${item.word} in a clear sentence.`
    }));
}

function renderDictionaryPanel(panelNodes, panelState, allEntries, counts) {
  if (!panelNodes.results) return panelState;
  const query = panelNodes.searchInput?.value.trim().toLowerCase() || "";
  const matches = allEntries
    .filter((entry) => {
      if (!query) return true;
      return [entry.word, entry.translation, entry.example, entry.phonetic, ...(entry.keywords || [])].join(" ").toLowerCase().includes(query);
    });

  const showAll = panelState.pageSize === "all";
  const pageSize = showAll ? matches.length || 1 : Math.max(1, Number(panelState.pageSize) || 48);
  const totalPages = showAll ? 1 : Math.max(1, Math.ceil(matches.length / pageSize));
  const nextPage = Math.min(Math.max(1, panelState.page), totalPages);
  const startIndex = showAll ? 0 : (nextPage - 1) * pageSize;
  const endIndex = showAll ? matches.length : Math.min(matches.length, startIndex + pageSize);
  const visibleMatches = matches.slice(startIndex, endIndex);

  panelNodes.stats.innerHTML = `
    <span>当前单词 ${counts.wordCount}</span>
    <span>当前词组 ${counts.phraseCount}</span>
    <span>搜索结果 ${matches.length}</span>
  `;
  if (panelNodes.pageInfo) {
    panelNodes.pageInfo.textContent = showAll
      ? `已显示全部 ${matches.length} 条`
      : `第 ${nextPage} / ${totalPages} 页 · ${matches.length ? `${startIndex + 1}-${endIndex}` : "0"} / ${matches.length}`;
  }
  if (panelNodes.prevBtn) panelNodes.prevBtn.disabled = showAll || nextPage <= 1;
  if (panelNodes.nextBtn) panelNodes.nextBtn.disabled = showAll || nextPage >= totalPages;
  panelNodes.results.innerHTML = "";
  if (!matches.length) {
    panelNodes.results.innerHTML = `<div class="empty-book-list">没有找到匹配项。可以换个英文、中文释义或音标关键词试试。</div>`;
    return { page: nextPage, pageSize: panelState.pageSize };
  }
  visibleMatches.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "dictionary-card";
    card.innerHTML = `
      <div>
        <strong>${entry.word}</strong>
        <span>${entry.type === "phrase" ? "词组" : "单词"}</span>
      </div>
      ${entry.phonetic ? `<p class="dictionary-phonetic">${entry.phonetic}</p>` : ""}
      <p>${entry.translation || "暂无释义"}</p>
      ${entry.example ? `<em>${entry.example}</em>` : ""}
    `;
    panelNodes.results.append(card);
  });
  return { page: nextPage, pageSize: panelState.pageSize };
}

function renderDictionary() {
  const nextState = renderDictionaryPanel(
    {
      searchInput: nodes.dictionarySearchInput,
      stats: nodes.dictionaryStats,
      results: nodes.dictionaryResults,
      pageInfo: nodes.dictionaryPageInfo,
      prevBtn: nodes.dictionaryPrevBtn,
      nextBtn: nodes.dictionaryNextBtn
    },
    { page: dictionaryPage, pageSize: dictionaryPageSize },
    getDictionaryEntries(),
    {
      wordCount: builtInDictionaryWords().length + dictionaryState.words.length,
      phraseCount: builtInDictionaryPhrases().length + dictionaryState.phrases.length
    }
  );
  dictionaryPage = nextState.page;
  dictionaryPageSize = nextState.pageSize;
}

function renderCet4Dictionary() {
  const nextState = renderDictionaryPanel(
    {
      searchInput: nodes.cet4DictionarySearchInput,
      stats: nodes.cet4DictionaryStats,
      results: nodes.cet4DictionaryResults,
      pageInfo: nodes.cet4DictionaryPageInfo,
      prevBtn: nodes.cet4DictionaryPrevBtn,
      nextBtn: nodes.cet4DictionaryNextBtn
    },
    { page: cet4DictionaryPage, pageSize: cet4DictionaryPageSize },
    getCet4DictionaryEntries(),
    {
      wordCount: builtInCet4DictionaryWords().length + cet4DictionaryState.words.length,
      phraseCount: builtInCet4DictionaryPhrases().length + cet4DictionaryState.phrases.length
    }
  );
  cet4DictionaryPage = nextState.page;
  cet4DictionaryPageSize = nextState.pageSize;
}

function mergeDictionaryState(currentState, nextDictionary) {
  return normalizeDictionaryState({
    words: [...currentState.words, ...nextDictionary.words],
    phrases: [...currentState.phrases, ...nextDictionary.phrases]
  });
}

function mergeDictionary(nextDictionary) {
  dictionaryState = mergeDictionaryState(dictionaryState, nextDictionary);
  saveDictionaryState();
}

function mergeCet4Dictionary(nextDictionary) {
  cet4DictionaryState = mergeDictionaryState(cet4DictionaryState, nextDictionary);
  saveCet4DictionaryState();
}

function importDictionaryFile(file, options) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      const nextDictionary = normalizeDictionaryState(parsed);
      if (!nextDictionary.words.length && !nextDictionary.phrases.length) {
        throw new Error("没有识别到 words 或 phrases 数据");
      }
      options.merge(nextDictionary);
      options.statusNode.textContent = `导入成功：新增 ${nextDictionary.words.length} 个单词、${nextDictionary.phrases.length} 个词组。`;
      options.render();
      options.afterImport?.();
    } catch (error) {
      options.statusNode.textContent = `导入失败：${error.message}`;
    } finally {
      options.inputNode.value = "";
    }
  });
  reader.readAsText(file, "utf-8");
}

function renderMistakeSubjects() {
  const addSubjects = [...new Set(state.books.map((book) => book.title))];
  const filterSubjects = ["全部科目", ...addSubjects];
  [nodes.mistakeSubject, nodes.mistakeFilterSubject].forEach((select, index) => {
    if (!select) return;
    const subjects = index === 0 ? addSubjects : filterSubjects;
    const currentValue =
      index === 0 ? nodes.mistakeSubject?.value || state.books[0]?.title : nodes.mistakeFilterSubject?.value || "全部科目";
    select.innerHTML = "";
    subjects.forEach((subject) => {
      const option = document.createElement("option");
      option.value = subject;
      option.textContent = subject;
      select.append(option);
    });
    select.value = subjects.includes(currentValue) ? currentValue : index === 0 ? state.books[0]?.title || "英语四级" : "全部科目";
  });
}

function renderMistakeStars() {
  if (!nodes.mistakeStars) return;
  nodes.mistakeStars.innerHTML = "";
  Array.from({ length: 5 }, (_, index) => index + 1).forEach((value) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `star-btn${value <= currentMistakeStar ? " active" : ""}`;
    button.textContent = value <= currentMistakeStar ? "★" : "☆";
    button.title = `${value} 星`;
    button.addEventListener("click", () => {
      currentMistakeStar = value;
      renderMistakeStars();
    });
    nodes.mistakeStars.append(button);
  });
}

function resizeImageFile(file, maxSide = 1200, quality = 0.86) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("图片加载失败"));
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

async function prepareMistakeImage(file) {
  if (!file) return "";
  const dataUrl = await resizeImageFile(file);
  currentMistakeImage = dataUrl;
  nodes.mistakePreview.innerHTML = `<img src="${dataUrl}" alt="错题预览" class="mistake-image-preview" />`;
  return dataUrl;
}

function renderMistakes() {
  if (!nodes.mistakeList) return;
  const filterDate = nodes.mistakeFilterDate?.value || "";
  const filterSubject = nodes.mistakeFilterSubject?.value || "全部科目";
  const items = [...mistakeState]
    .sort((a, b) => (b.stars || 0) - (a.stars || 0) || String(b.date).localeCompare(String(a.date)))
    .filter((item) => !filterDate || item.date === filterDate)
    .filter((item) => filterSubject === "全部科目" || item.subject === filterSubject);

  nodes.mistakeList.innerHTML = "";
  if (!items.length) {
    nodes.mistakeList.innerHTML = `<div class="empty-book-list">这里还没有错题图片。你可以按日期、科目和星级慢慢积累。</div>`;
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "mistake-card";
    card.innerHTML = `
      <img src="${item.image}" alt="错题图片" />
      <div class="mistake-card-head">
        <strong>${item.subject}</strong>
        <span>${item.date}</span>
      </div>
      <div class="mistake-stars">${"★".repeat(item.stars)}${"☆".repeat(5 - item.stars)}</div>
      <p>${item.note || "暂无备注"}</p>
      <button class="ghost-light-btn" type="button">删除</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      mistakeState = mistakeState.filter((entry) => entry.id !== item.id);
      saveMistakeState();
      renderMistakes();
      renderDashboard();
    });
    nodes.mistakeList.append(card);
  });
}

async function saveMistake(event) {
  event.preventDefault();
  const file = nodes.mistakeImageInput.files?.[0];
  if (!file) {
    nodes.mistakeStatus.textContent = "请先选择一张错题图片。";
    return;
  }
  const image = await prepareMistakeImage(file);
  const entry = {
    id: `mistake-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: nodes.mistakeDate.value || isoDate(new Date()),
    subject: nodes.mistakeSubject.value || state.books[0]?.title || "未命名科目",
    stars: currentMistakeStar,
    note: nodes.mistakeNote.value.trim(),
    image
  };
  mistakeState.push(entry);
  saveMistakeState();
  nodes.mistakeForm.reset();
  nodes.mistakeDate.value = isoDate(new Date());
  renderMistakeSubjects();
  currentMistakeStar = 3;
  currentMistakeImage = "";
  nodes.mistakePreview.textContent = "选择图片后会显示预览。";
  renderMistakeStars();
  renderMistakes();
  renderDashboard();
  nodes.mistakeStatus.textContent = "错题已保存到本地。";
}

function setupMistakes() {
  nodes.mistakeDate.value = isoDate(new Date());
  nodes.mistakeFilterDate.value = "";
  nodes.mistakeFilterSubject.value = "全部科目";
  renderMistakeSubjects();
  renderMistakeStars();
  renderMistakes();

  nodes.mistakeForm.addEventListener("submit", saveMistake);
  nodes.mistakeImageInput.addEventListener("change", async () => {
    const file = nodes.mistakeImageInput.files?.[0];
    if (!file) {
      nodes.mistakePreview.textContent = "选择图片后会显示预览。";
      currentMistakeImage = "";
      return;
    }
    try {
      nodes.mistakeStatus.textContent = "正在压缩图片...";
      await prepareMistakeImage(file);
      nodes.mistakeStatus.textContent = "图片已选中，保存即可加入错题集。";
    } catch (error) {
      currentMistakeImage = "";
      nodes.mistakePreview.textContent = "图片预览失败。";
      nodes.mistakeStatus.textContent = `图片处理失败：${error.message}`;
    }
  });
  nodes.mistakeFilterDate.addEventListener("change", renderMistakes);
  nodes.mistakeFilterSubject.addEventListener("change", renderMistakes);
}

function startEntryExperience() {
  document.body.classList.add("entry-active");
  nodes.startLearningBtn.addEventListener("click", () => {
    nodes.entryScreen.classList.remove("reopen");
    nodes.entryScreen.classList.add("hidden");
    document.body.classList.remove("entry-active");
    setTimeout(() => {
      renderTodayReminder();
      openModal(nodes.todayReminderModal);
    }, 520);
  });
}

function returnToEntryExperience() {
  document.body.classList.add("entry-active");
  nodes.entryScreen.classList.add("reopen");
  nodes.entryScreen.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => {
    nodes.entryScreen.classList.remove("reopen");
  }, 900);
}

function setupEntryThemes() {
  nodes.entryThemeGrid.innerHTML = "";
  entryThemes.forEach((theme, index) => {
    const button = document.createElement("button");
    button.className = "theme-swatch";
    button.type = "button";
    button.title = `背景 ${index + 1}`;
    button.style.setProperty("--swatch-bg", buildStudyBackground(theme, index, 0.86));
    button.dataset.theme = theme[0];
    button.addEventListener("click", () => {
      applyEntryTheme(theme[0]);
      localStorage.setItem(THEME_KEY, theme[0]);
    });
    nodes.entryThemeGrid.append(button);
  });
  applyEntryTheme(localStorage.getItem(THEME_KEY) || entryThemes[0][0]);
}

function applyEntryTheme(themeName) {
  const theme = entryThemes.find((item) => item[0] === themeName) || entryThemes[0];
  const themeIndex = Math.max(0, entryThemes.findIndex((item) => item[0] === theme[0]));
  const [, green, greenDark, blue, paper] = theme;
  const studyBackground = buildStudyBackground(theme, themeIndex);
  const root = document.documentElement;
  root.style.setProperty("--green", green);
  root.style.setProperty("--green-dark", greenDark);
  root.style.setProperty("--blue", blue);
  root.style.setProperty("--paper", paper);
  root.style.setProperty("--entry-bg", studyBackground);
  root.style.setProperty("--app-bg", studyBackground);
  root.style.setProperty("--hero-overlay", `linear-gradient(90deg, ${hexToRgba(greenDark, 0.82)}, ${hexToRgba(blue, 0.42)} 54%, rgba(10, 22, 18, 0.08))`);
  root.style.setProperty("--study-flow-bg", `linear-gradient(180deg, ${hexToRgba(paper, 0.96)}, ${hexToRgba(paper, 0.92)}), ${studyBackground}`);
  document.querySelectorAll(".theme-swatch").forEach((button) => {
    button.classList.toggle("active", button.dataset.theme === theme[0]);
  });
}

function showFeaturePanel(panelId, shouldScroll = false) {
  const panel = document.querySelector(`#${panelId}`);
  if (!panel) return;
  document.querySelectorAll(".feature-panel").forEach((item) => {
    item.classList.toggle("active", item.id === panelId);
  });
  document.querySelectorAll("[data-feature-target]").forEach((button) => {
    button.classList.toggle("active", button.dataset.featureTarget === panelId);
  });
  if (shouldScroll) {
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setupFeatureNavigation() {
  document.querySelectorAll("[data-feature-target]").forEach((button) => {
    button.addEventListener("click", () => showFeaturePanel(button.dataset.featureTarget, true));
  });
  showFeaturePanel(document.querySelector(".feature-panel.active")?.id || "plannerPanel");
}

function createDailyEnglishStory(dayIndex) {
  const index = ((dayIndex % DAILY_ENGLISH_TOTAL) + DAILY_ENGLISH_TOTAL) % DAILY_ENGLISH_TOTAL;
  const subject = dailyEnglishSubjects[index % dailyEnglishSubjects.length];
  const opening = dailyEnglishOpenings[index % dailyEnglishOpenings.length];
  const openingCn = {
    "This week,": "本周，",
    "On a busy morning,": "在一个忙碌的早晨，",
    "During a school project,": "在一次学校项目中，",
    "After reading a recent report,": "读完一份近期报道后，",
    "In a small community,": "在一个小社区里，"
  }[opening];
  const lesson = dailyEnglishLessons[index % dailyEnglishLessons.length];
  const [issueEn, issueCn] = dailyEnglishIssueMap[subject[3]] || ["a common college English topic", subject[3]];
  const grammar = dailyEnglishGrammar;
  const title = `${String(index + 1).padStart(3, "0")} ${subject[0]}`;
  const text = `${opening} a class explored ${issueEn} through a real campus example. The teacher asked students to connect the case with college English reading and writing, because similar themes often appear in exams. Instead of repeating empty opinions, they observed details, compared different views and wrote down questions that still needed evidence. The discussion became more useful when each person offered one practical suggestion. By the end of the activity, they understood that ${lesson[0]}. The more carefully they looked at real life, the more naturally they found ideas for clear writing.`;
  const translation = `${openingCn}一个班级通过真实的校园案例探讨了“${issueCn}”。老师要求学生把这个案例和大学英语阅读、写作联系起来，因为类似主题常出现在考试中。学生们没有重复空泛观点，而是观察细节、比较不同看法，并写下仍需要证据支持的问题。当每个人都提出一个实际建议时，讨论变得更有价值。活动结束时，他们明白了：${lesson[1]}。他们越仔细观察真实生活，就越自然地找到清晰写作的素材。`;
  return { title, text, translation, grammar };
}

function addFocusMinutes(subject, minutes) {
  const key = isoDate(new Date());
  focusState[key] ||= {};
  focusState[key][subject] = (focusState[key][subject] || 0) + minutes;
  saveFocusState();
  renderHeatmap();
  renderDashboard();
}

function getActiveBook() {
  return state.books.find((book) => book.id === activeId) || state.books[0];
}

function selectedLibraryYear() {
  return currentYearFilter === "all" ? today.getFullYear() : Number(currentYearFilter);
}

function normalizeTitle(title) {
  return title.replace(/\s+/g, "").toLowerCase();
}

function findDuplicateBook(title, ignoredId = "") {
  const normalizedTitle = normalizeTitle(title);
  return state.books.find((book) => book.id !== ignoredId && normalizeTitle(book.title) === normalizedTitle);
}

function parseChapters(text) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, rawDifficulty] = line.split("|").map((part) => part.trim());
      const difficulty = Math.min(5, Math.max(1, Number(rawDifficulty) || 3));
      return { name, difficulty };
    });
}

function formatChapters(chapters) {
  return chapters.map((chapter) => `${chapter.name} | ${chapter.difficulty}`).join("\n");
}

function chapterTemplateFor(title, subject = "") {
  const text = `${title} ${subject}`.toLowerCase();
  if (/英语|english|cet|四级|六级|阅读|听力|写作|翻译/.test(text)) {
    return [
      { name: "词汇与短语", difficulty: 3 },
      { name: "听力训练", difficulty: 4 },
      { name: "阅读理解", difficulty: 5 },
      { name: "写作表达", difficulty: 4 },
      { name: "翻译练习", difficulty: 4 },
      { name: "真题模拟", difficulty: 5 }
    ];
  }
  if (/数学|高等数学|微积分|calculus|algebra|线性代数|概率|统计/.test(text)) {
    return [
      { name: "概念与公式梳理", difficulty: 3 },
      { name: "基础例题", difficulty: 3 },
      { name: "核心题型", difficulty: 4 },
      { name: "综合应用", difficulty: 5 },
      { name: "错题复盘", difficulty: 5 },
      { name: "模拟测试", difficulty: 5 }
    ];
  }
  if (/计算机|programming|computer|操作系统|数据结构|算法|软件|network/.test(text)) {
    return [
      { name: "基础概念", difficulty: 3 },
      { name: "关键机制", difficulty: 4 },
      { name: "例题与代码", difficulty: 4 },
      { name: "综合应用", difficulty: 5 },
      { name: "错题与薄弱点", difficulty: 5 },
      { name: "项目或实验复盘", difficulty: 4 }
    ];
  }
  return [
    { name: "第一章：基础概念", difficulty: 3 },
    { name: "第二章：核心内容", difficulty: 3 },
    { name: "第三章：重点难点", difficulty: 4 },
    { name: "第四章：综合应用", difficulty: 5 },
    { name: "错题与薄弱点", difficulty: 5 },
    { name: "阶段模拟", difficulty: 4 }
  ];
}

function createBookFromTitle(title, extra = {}) {
  return {
    id: makeId(),
    title,
    year: extra.year || today.getFullYear(),
    examDate: isoDate(addDays(today, 60)),
    dailyMinutes: 90,
    mastery: 0.25,
    goal: extra.goal || "目标：建立基础框架，持续复盘薄弱点。",
    chapters: extra.chapters || chapterTemplateFor(title, extra.subject)
  };
}

function daysUntil(dateString) {
  const target = new Date(`${dateString}T23:59:59`);
  return Math.max(1, Math.ceil((target - new Date()) / 86400000));
}

function renderBooks() {
  nodes.bookList.innerHTML = "";
  renderYearFilter();
  const booksInYear =
    currentYearFilter === "all"
      ? state.books
      : state.books.filter((book) => String(book.year) === String(currentYearFilter));
  const query = bookSearchQuery.trim().toLowerCase();
  const visibleBooks = query
    ? booksInYear.filter((book) => {
        const chapterText = book.chapters.map((chapter) => chapter.name).join(" ");
        return `${book.title} ${book.goal} ${chapterText}`.toLowerCase().includes(query);
      })
    : booksInYear;
  nodes.bookCount.textContent = visibleBooks.length;

  if (!visibleBooks.some((book) => book.id === activeId) && visibleBooks.length) {
    activeId = visibleBooks[0].id;
  }

  if (!visibleBooks.length) {
    const empty = document.createElement("div");
    empty.className = "empty-book-list";
    empty.textContent = query ? "没有找到匹配教材。" : "这个年份还没有教材。";
    nodes.bookList.append(empty);
    return;
  }

  visibleBooks.forEach((book) => {
    const item = document.querySelector("#bookTemplate").content.firstElementChild.cloneNode(true);
    item.classList.toggle("active", book.id === activeId);
    item.querySelector(".book-name").textContent = book.title;
    item.querySelector(".book-meta").textContent = `${book.year} · ${daysUntil(book.examDate)} 天后考试 · ${book.chapters.length} 个模块`;
    item.addEventListener("click", () => {
      activeId = book.id;
      saveState();
      render();
    });
    nodes.bookList.append(item);
  });
}

function renderYearFilter() {
  const years = [...new Set(state.books.map((book) => Number(book.year) || today.getFullYear()))].sort((a, b) => b - a);
  const options = [`<option value="all">全部年份</option>`, ...years.map((year) => `<option value="${year}">${year} 年</option>`)];
  const html = options.join("");
  if (nodes.yearFilter.innerHTML !== html) nodes.yearFilter.innerHTML = html;
  nodes.yearFilter.value = years.includes(Number(currentYearFilter)) ? currentYearFilter : "all";
}

function renderForm(book) {
  nodes.activeTitle.textContent = book.title;
  nodes.titleInput.value = book.title;
  nodes.examInput.value = book.examDate;
  nodes.yearInput.value = book.year || today.getFullYear();
  nodes.minutesInput.value = book.dailyMinutes;
  nodes.masteryInput.value = String(book.mastery);
  nodes.chaptersInput.value = formatChapters(book.chapters);
  nodes.goalInput.value = book.goal;
}

function generateMethod(book) {
  const days = daysUntil(book.examDate);
  const totalDifficulty = book.chapters.reduce((sum, chapter) => sum + chapter.difficulty, 0);
  const pressure = totalDifficulty / Math.max(1, days * (book.dailyMinutes / 90));
  const stage =
    days > 56 ? "基础-强化-冲刺三段式" : days > 21 ? "强化与回忆并行" : "高频回忆与模拟冲刺";
  const recallRatio = book.mastery < 0.45 ? "40%" : book.mastery < 0.7 ? "55%" : "70%";
  const priority = [...book.chapters].sort((a, b) => b.difficulty - a.difficulty).slice(0, 3);
  const [sprintTitle, sprintTip] = sprintLabel(days);

  return [
    {
      title: stage,
      text: `距离考试 ${days} 天，建议每天 ${book.dailyMinutes} 分钟。先按章节难度分配首轮学习，再用 1-3-7-14 天间隔复习回收记忆。`
    },
    {
      title: "主动回忆优先",
      text: `每次学习至少 ${recallRatio} 时间用于闭卷默写、限时做题、错因复述，不把重读教材当作主要复习。`
    },
    {
      title: "高权重模块前置",
      text: `优先处理：${priority.map((item) => item.name).join("、")}。难度越高越早进入错题本和二刷队列。`
    },
    {
      title: pressure > 1.4 ? "压缩策略" : "稳定策略",
      text:
        pressure > 1.4
          ? "时间偏紧，减少抄笔记，把学习单元压缩成“例题拆解-同类题-错因标签-次日复盘”。"
          : "时间相对充足，保持每周一次综合回顾，每两周安排一次模拟检测并调整薄弱模块。"
    },
    {
      title: sprintTitle,
      text: sprintTip
    }
  ];
}

function renderMethod(book) {
  nodes.methodOutput.innerHTML = "";
  generateMethod(book).forEach((item) => {
    const block = document.createElement("div");
    block.className = "method-item";
    block.innerHTML = `<strong>${item.title}</strong><p>${item.text}</p>`;
    nodes.methodOutput.append(block);
  });
}

function buildPlan(book) {
  const days = daysUntil(book.examDate);
  const weeks = Math.min(12, Math.max(2, Math.ceil(days / 7)));
  const sorted = [...book.chapters].sort((a, b) => b.difficulty - a.difficulty);
  const weighted = sorted.flatMap((chapter) => Array.from({ length: chapter.difficulty }, () => chapter));
  const dailyBlocks = [];

  for (let day = 1; day <= Math.min(days, 42); day += 1) {
    const chapter = weighted[(day - 1) % weighted.length];
    const date = addDays(today, day - 1);
    const phase = day / days;
    const tasks =
      days <= 7
        ? [`终极冲刺：${chapter.name}`, "完成一组限时真题或综合题", "只整理高频错因和考前清单"]
        : days <= 14
          ? [`压缩冲刺：${chapter.name}`, "用错题反推薄弱概念", "完成真题片段并复述得分点"]
          : days <= 30
            ? [`冲刺强化：${chapter.name}`, "主动回忆核心公式、词汇或题型", "完成限时训练并标记错因"]
            : phase < 0.45
              ? [`首轮理解：${chapter.name}`, "整理 3 个核心问题并闭卷复述", "完成对应基础题，记录错因标签"]
              : phase < 0.78
                ? [`二轮强化：${chapter.name}`, "限时做题并讲出解题路径", "复盘 1 天前和 7 天前的错题"]
                : [`冲刺检测：${chapter.name}`, "完成混合题或真题片段", "把错误压缩成考前清单"];

    dailyBlocks.push({
      type: "day",
      bookId: book.id,
      bookTitle: book.title,
      dateKey: isoDate(date),
      title: `${date.getMonth() + 1}月${date.getDate()}日 · 第 ${day} 天`,
      minutes: book.dailyMinutes,
      tasks
    });
  }

  const weeklyBlocks = Array.from({ length: weeks }, (_, index) => {
    const weekItems = sorted.filter((_, chapterIndex) => chapterIndex % weeks === index % weeks);
    const focus = weekItems.length ? weekItems : [sorted[index % sorted.length]];
    const phase = (index + 1) / weeks;
    const tasks =
      phase < 0.45
        ? ["完成新内容首轮学习", "建立章节问题清单", "每 2 天回看一次错题"]
        : phase < 0.8
          ? ["进行题型归类训练", "执行 1-3-7 天间隔复习", "每周末做一次限时小测"]
          : ["套题或综合题冲刺", "只保留高频错因", "考前 3 天回归公式、词汇或模板清单"];

    return {
      type: "week",
      bookId: book.id,
      bookTitle: book.title,
      dateKey: `week-${index + 1}`,
      title: `第 ${index + 1} 周 · ${focus.map((item) => item.name).join("、")}`,
      minutes: book.dailyMinutes * 6,
      tasks
    };
  });

  return { dailyBlocks, weeklyBlocks };
}

function taskKey(block, task, index) {
  return `${block.bookId}::${block.dateKey}::${index}::${task}`;
}

function renderPlan(book) {
  const { dailyBlocks, weeklyBlocks } = buildPlan(book);
  const blocks = currentView === "week" ? weeklyBlocks : dailyBlocks;
  nodes.planOutput.innerHTML = "";

  blocks.forEach((block) => {
    const card = document.createElement("article");
    card.className = "plan-card";
    card.innerHTML = `
      <header>
        <h4>${block.title}</h4>
        <span class="time-pill">${block.minutes} 分钟</span>
      </header>
      <ul class="task-list">
        ${block.tasks
          .map((task, index) => {
            const key = taskKey(block, task, index);
            const checked = doneState[key] ? "checked" : "";
            const disabled = block.type === "week" ? "disabled" : "";
            return `
              <li>
                <label class="task-check">
                  <input type="checkbox" data-task-key="${key}" ${checked} ${disabled} />
                  <span>${task}</span>
                </label>
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
    nodes.planOutput.append(card);
  });

  nodes.planOutput.querySelectorAll("input[type='checkbox']").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      doneState[checkbox.dataset.taskKey] = checkbox.checked;
      saveDoneState();
      renderHeatmap();
      renderDashboard();
    });
  });
}

function getTodayCompletion() {
  const dateKey = isoDate(new Date());
  const items = [];

  state.books.forEach((book) => {
    const { dailyBlocks } = buildPlan(book);
    const todayBlock = dailyBlocks.find((block) => block.dateKey === dateKey);
    if (!todayBlock) return;

    const completedTasks = todayBlock.tasks.filter((task, index) => doneState[taskKey(todayBlock, task, index)]);
    if (completedTasks.length) {
      items.push({
        subject: book.title,
        tasks: completedTasks
      });
    }
  });

  return items;
}

function getDateStats(dateKey) {
  let completedTasks = 0;
  const subjects = new Set();

  state.books.forEach((book) => {
    const { dailyBlocks } = buildPlan(book);
    const block = dailyBlocks.find((item) => item.dateKey === dateKey);
    if (!block) return;
    block.tasks.forEach((task, index) => {
      if (doneState[taskKey(block, task, index)]) {
        completedTasks += 1;
        subjects.add(book.title);
      }
    });
  });

  const focusBySubject = focusState[dateKey] || {};
  Object.entries(focusBySubject).forEach(([subject, minutes]) => {
    if (minutes > 0) subjects.add(subject);
  });

  return {
    completedTasks,
    focusMinutes: Object.values(focusBySubject).reduce((sum, minutes) => sum + minutes, 0),
    subjects: [...subjects]
  };
}

function getWeekDates() {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = addDays(now, 1 - day);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

function getPlannedTasksForDate(dateKey) {
  let totalTasks = 0;
  state.books.forEach((book) => {
    const { dailyBlocks } = buildPlan(book);
    const block = dailyBlocks.find((item) => item.dateKey === dateKey);
    if (block) totalTasks += block.tasks.length;
  });
  return totalTasks;
}

function getStreakDays() {
  let streak = 0;
  for (let offset = 0; offset < 365; offset += 1) {
    const key = isoDate(addDays(new Date(), -offset));
    const stats = getDateStats(key);
    if (stats.completedTasks > 0 || stats.focusMinutes > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

function getReviewCount() {
  return Object.values(reviewState).filter((item) => item?.priority || item?.blocker || item?.minimum).length;
}

function getTotalFocusMinutes() {
  return Object.values(focusState).reduce(
    (sum, subjects) => sum + Object.values(subjects || {}).reduce((inner, minutes) => inner + Number(minutes || 0), 0),
    0
  );
}

function getCompletedTaskCount() {
  return Object.values(doneState).filter(Boolean).length;
}

function getDashboardMetrics() {
  const weekDates = getWeekDates().map(isoDate);
  let weekCompleted = 0;
  let weekPlanned = 0;
  let weekFocus = 0;
  const subjectTotals = {};

  weekDates.forEach((dateKey) => {
    const stats = getDateStats(dateKey);
    weekCompleted += stats.completedTasks;
    weekPlanned += getPlannedTasksForDate(dateKey);
    weekFocus += stats.focusMinutes;
    Object.entries(focusState[dateKey] || {}).forEach(([subject, minutes]) => {
      subjectTotals[subject] = (subjectTotals[subject] || 0) + Number(minutes || 0);
    });
  });

  const completedTasks = getCompletedTaskCount();
  const totalFocus = getTotalFocusMinutes();
  const reviewCount = getReviewCount();
  const favoriteCount = Object.keys(englishFavoriteState).length;
  const mistakeCount = mistakeState.length;
  const streak = getStreakDays();
  const score = completedTasks * 10 + Math.floor(totalFocus / 5) + reviewCount * 8 + favoriteCount * 6 + mistakeCount * 12 + streak * 15;

  return {
    weekCompleted,
    weekPlanned,
    weekFocus,
    completionRate: weekPlanned ? Math.round((weekCompleted / weekPlanned) * 100) : 0,
    subjectTotals,
    completedTasks,
    totalFocus,
    reviewCount,
    favoriteCount,
    mistakeCount,
    streak,
    score
  };
}

function getScoreRank(score) {
  if (score >= 1800) return "自律冲刺王";
  if (score >= 1000) return "稳定推进者";
  if (score >= 500) return "节奏建立者";
  if (score >= 160) return "认真起步者";
  return "新手学习者";
}

function getNextScoreTarget(score) {
  return [160, 500, 1000, 1800, 2600].find((target) => score < target) || 2600;
}

function sprintLabel(days) {
  if (days <= 7) return ["终极冲刺", "只保留真题、错题和高频清单，每天做一次限时检测。"];
  if (days <= 14) return ["压缩冲刺", "减少新内容，把错因标签和套题复盘放到最前面。"];
  if (days <= 30) return ["冲刺模式", "提高模拟题和主动回忆比例，弱项章节优先。"];
  return ["常规推进", "继续按章节难度推进，每周做一次综合回顾。"];
}

function renderDashboard() {
  if (!nodes.scoreTotal) return;
  const metrics = getDashboardMetrics();
  const nextTarget = getNextScoreTarget(metrics.score);
  nodes.scoreTotal.textContent = String(metrics.score);
  nodes.scoreRank.textContent = getScoreRank(metrics.score);
  nodes.scoreProgress.style.width = `${Math.min(100, Math.round((metrics.score / nextTarget) * 100))}%`;

  const achievements = [
    ["初露锋芒", metrics.score >= 160, "积分达到 160"],
    ["三日不断", metrics.streak >= 3, "连续学习 3 天"],
    ["七日稳定", metrics.streak >= 7, "连续学习 7 天"],
    ["任务十连", metrics.completedTasks >= 10, "完成 10 个任务"],
    ["任务五十", metrics.completedTasks >= 50, "完成 50 个任务"],
    ["专注 300", metrics.totalFocus >= 300, "累计专注 300 分钟"],
    ["复盘习惯", metrics.reviewCount >= 7, "保存 7 次每日复盘"],
    ["英文收藏家", metrics.favoriteCount >= 5, "收藏 5 篇英文短篇"],
    ["错题整理", metrics.mistakeCount >= 3, "保存 3 张错题图片"]
  ];
  nodes.achievementBadges.innerHTML = achievements
    .map(([title, unlocked, desc]) => `<span class="badge ${unlocked ? "unlocked" : ""}"><strong>${title}</strong>${desc}</span>`)
    .join("");

  const countdownItems = [...state.books]
    .sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate))
    .slice(0, 6);
  nodes.examCountdownList.innerHTML = countdownItems
    .map((book) => {
      const days = daysUntil(book.examDate);
      const [label, tip] = sprintLabel(days);
      return `<article class="countdown-item"><strong>${book.title}</strong><span>${days} 天 · ${label}</span><p>${tip}</p></article>`;
    })
    .join("");

  nodes.dashboardStats.innerHTML = `
    <div><strong>${metrics.completionRate}%</strong><span>本周完成率</span></div>
    <div><strong>${metrics.weekCompleted}/${metrics.weekPlanned}</strong><span>本周任务</span></div>
    <div><strong>${metrics.weekFocus}</strong><span>本周专注分钟</span></div>
    <div><strong>${metrics.streak}</strong><span>连续学习天数</span></div>
  `;

  const subjectEntries = Object.entries(metrics.subjectTotals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  nodes.dashboardSubjects.innerHTML = subjectEntries.length
    ? subjectEntries
        .map(([subject, minutes]) => {
          const width = Math.max(8, Math.round((minutes / Math.max(1, metrics.weekFocus)) * 100));
          return `<div class="subject-bar"><span>${subject}</span><strong>${minutes} 分钟</strong><i style="width:${width}%"></i></div>`;
        })
        .join("")
    : `<div class="empty-book-list">本周还没有番茄钟记录，完成一次专注后这里会显示科目分布。</div>`;
}

function exportAllData() {
  const backup = {
    app: "smart-study-planner",
    version: 1,
    exportedAt: new Date().toISOString(),
    items: {}
  };
  getBackupKeys().forEach((key) => {
    backup.items[key] = localStorage.getItem(key);
  });
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `智习计划-数据备份-${isoDate(new Date())}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  nodes.backupStatus.textContent = `已导出 ${getBackupKeys().length} 类本地数据。`;
}

function refreshStateAfterImport() {
  state = loadState();
  activeId = state.activeId || state.books[0].id;
  doneState = loadDoneState();
  focusState = loadObject(FOCUS_KEY);
  reviewState = loadObject(REVIEW_KEY);
  englishFavoriteState = loadObject(ENGLISH_FAVORITES_KEY);
  mistakeState = normalizeMistakeState(loadObject(MISTAKE_KEY));
  dictionaryState = normalizeDictionaryState(loadObject(DICTIONARY_KEY));
  cet4DictionaryState = normalizeDictionaryState(loadObject(CET4_DICTIONARY_KEY));
  applyEntryTheme(localStorage.getItem(THEME_KEY) || entryThemes[0][0]);
  renderDailyEnglish();
  render();
}

function importAllData(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const backup = JSON.parse(String(reader.result || ""));
      if (backup?.app !== "smart-study-planner" || typeof backup.items !== "object") {
        throw new Error("文件格式不匹配");
      }
      const confirmed = window.confirm("导入会覆盖当前浏览器里的学习数据。确定继续吗？");
      if (!confirmed) {
        nodes.backupStatus.textContent = "已取消导入。";
        return;
      }
      getBackupKeys().forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(backup.items, key)) {
          const value = backup.items[key];
          if (value === null || value === undefined) {
            localStorage.removeItem(key);
          } else {
            localStorage.setItem(key, String(value));
          }
        }
      });
      refreshStateAfterImport();
      nodes.backupStatus.textContent = `导入成功：${backup.exportedAt ? `备份时间 ${new Date(backup.exportedAt).toLocaleString()}` : "已恢复备份数据"}。`;
    } catch (error) {
      nodes.backupStatus.textContent = `导入失败：${error.message}`;
    } finally {
      nodes.importDataInput.value = "";
    }
  });
  reader.readAsText(file, "utf-8");
}

function resizeDataUrl(dataUrl, maxSide = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error("图片压缩失败"));
    image.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.src = dataUrl;
  });
}

async function compactMistakeImages() {
  if (!mistakeState.length) {
    nodes.backupStatus.textContent = "当前没有错题图片需要瘦身。";
    return;
  }
  nodes.backupStatus.textContent = "正在压缩错题图片...";
  let before = 0;
  let after = 0;
  const compacted = [];
  for (const item of mistakeState) {
    before += item.image?.length || 0;
    if (item.image?.startsWith("data:image/")) {
      const image = await resizeDataUrl(item.image);
      after += image.length;
      compacted.push({ ...item, image });
    } else {
      after += item.image?.length || 0;
      compacted.push(item);
    }
  }
  mistakeState = compacted;
  saveMistakeState();
  renderMistakes();
  renderDashboard();
  const saved = Math.max(0, before - after);
  nodes.backupStatus.textContent = `数据瘦身完成，约减少 ${Math.round(saved / 1024)} KB。`;
}

function getTodayPlanItems(limit = 6) {
  const dateKey = isoDate(new Date());
  const items = [];
  state.books.forEach((book) => {
    const { dailyBlocks } = buildPlan(book);
    const block = dailyBlocks.find((item) => item.dateKey === dateKey);
    if (!block) return;
    block.tasks.forEach((task, index) => {
      items.push({
        subject: book.title,
        task,
        done: Boolean(doneState[taskKey(block, task, index)])
      });
    });
  });
  return items.slice(0, limit);
}

function renderTodayReminder() {
  if (!nodes.todayReminderContent) return;
  const metrics = getDashboardMetrics();
  const todayTasks = getTodayPlanItems();
  const topMistakes = [...mistakeState]
    .sort((a, b) => (b.stars || 0) - (a.stars || 0) || String(b.date).localeCompare(String(a.date)))
    .slice(0, 3);
  const nearestExam = [...state.books].sort((a, b) => daysUntil(a.examDate) - daysUntil(b.examDate))[0];
  const examDays = nearestExam ? daysUntil(nearestExam.examDate) : 0;
  const [mode] = nearestExam ? sprintLabel(examDays) : ["暂无考试"];

  nodes.todayReminderContent.innerHTML = `
    <article class="today-card">
      <strong>今日计划</strong>
      ${
        todayTasks.length
          ? `<ul>${todayTasks.map((item) => `<li>${item.done ? "已完成" : "待完成"} · ${item.subject}：${item.task}</li>`).join("")}</ul>`
          : `<p>今天暂无计划，先在教材库生成计划。</p>`
      }
    </article>
    <article class="today-card">
      <strong>高星错题</strong>
      ${
        topMistakes.length
          ? `<ul>${topMistakes.map((item) => `<li>${"★".repeat(item.stars)} · ${item.subject} · ${item.date}</li>`).join("")}</ul>`
          : `<p>还没有错题图片，遇到卡点时先拍一张。</p>`
      }
    </article>
    <article class="today-card">
      <strong>英语短篇</strong>
      <p>${currentDailyEnglishStory?.title || "今日英文短篇"}</p>
    </article>
    <article class="today-card">
      <strong>状态</strong>
      <p>连续学习 ${metrics.streak} 天，当前积分 ${metrics.score}。${nearestExam ? `${nearestExam.title || nearestExam.title} 距离考试 ${examDays} 天，${mode}。` : ""}</p>
    </article>
  `;
}

function renderHeatmap() {
  nodes.heatmapGrid.innerHTML = "";
  const isYear = currentHeatmapView === "year";
  const days = isYear ? 365 : 42;
  nodes.heatmapGrid.classList.toggle("year-view", isYear);
  const start = addDays(new Date(), -(days - 1));
  for (let index = 0; index < days; index += 1) {
    const date = addDays(start, index);
    const dateKey = isoDate(date);
    const stats = getDateStats(dateKey);
    const score = stats.completedTasks + Math.floor(stats.focusMinutes / 25);
    const level = score >= 6 ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;
    const cell = document.createElement("div");
    cell.className = "heat-cell";
    cell.dataset.level = String(level);
    cell.title = `${date.getMonth() + 1}/${date.getDate()}：${stats.completedTasks} 个任务，${stats.focusMinutes} 分钟`;
    nodes.heatmapGrid.append(cell);
  }
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const lines = [];
  let line = "";
  Array.from(text).forEach((char) => {
    const testLine = line + char;
    if (context.measureText(testLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  lines.forEach((item, index) => context.fillText(item, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function exportTodayImage() {
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const now = new Date();
  const dateText = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`;
  const completed = getTodayCompletion();
  const taskCount = completed.reduce((sum, item) => sum + item.tasks.length, 0);
  const height = Math.max(520, 270 + taskCount * 54 + completed.length * 46);
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f8faf7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2f7d5c";
  ctx.fillRect(0, 0, canvas.width, 18);

  ctx.fillStyle = "#18201f";
  ctx.font = "bold 54px Microsoft YaHei, sans-serif";
  ctx.fillText("今日学习完成记录", 72, 92);
  ctx.font = "28px Microsoft YaHei, sans-serif";
  ctx.fillStyle = "#64706d";
  ctx.fillText(dateText, 72, 138);

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#dbe4df";
  ctx.lineWidth = 2;
  roundRect(ctx, 72, 178, 936, height - 250, 22);
  ctx.fill();
  ctx.stroke();

  let y = 235;
  if (!completed.length) {
    ctx.fillStyle = "#64706d";
    ctx.font = "30px Microsoft YaHei, sans-serif";
    ctx.fillText("今天还没有勾选完成任务。", 116, y);
  } else {
    completed.forEach((item) => {
      ctx.fillStyle = "#2f7d5c";
      ctx.font = "bold 32px Microsoft YaHei, sans-serif";
      ctx.fillText(`科目：${item.subject}`, 116, y);
      y += 44;
      item.tasks.forEach((task) => {
        ctx.fillStyle = "#d8684c";
        ctx.beginPath();
        ctx.arc(126, y - 9, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#18201f";
        ctx.font = "26px Microsoft YaHei, sans-serif";
        y = wrapCanvasText(ctx, task, 150, y, 780, 34) + 14;
      });
      y += 16;
    });
  }

  ctx.fillStyle = "#64706d";
  ctx.font = "22px Microsoft YaHei, sans-serif";
  ctx.fillText("由智习计划生成", 72, height - 54);

  const link = document.createElement("a");
  link.download = `今日完成任务-${isoDate(now)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function exportWeeklyImage() {
  const dates = getWeekDates();
  const stats = dates.map((date) => ({ date, dateKey: isoDate(date), ...getDateStats(isoDate(date)) }));
  const totalTasks = stats.reduce((sum, item) => sum + item.completedTasks, 0);
  const totalMinutes = stats.reduce((sum, item) => sum + item.focusMinutes, 0);
  const subjects = [...new Set(stats.flatMap((item) => item.subjects))];
  const canvas = document.createElement("canvas");
  canvas.width = 1180;
  canvas.height = 860;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#f8faf7";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2f6f9f";
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillStyle = "#18201f";
  ctx.font = "bold 54px Microsoft YaHei, sans-serif";
  ctx.fillText("本周学习周报", 72, 92);
  ctx.font = "26px Microsoft YaHei, sans-serif";
  ctx.fillStyle = "#64706d";
  ctx.fillText(`${isoDate(dates[0])} 至 ${isoDate(dates[6])}`, 72, 136);

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#dbe4df";
  ctx.lineWidth = 2;
  roundRect(ctx, 72, 174, 1036, 160, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#2f7d5c";
  ctx.font = "bold 38px Microsoft YaHei, sans-serif";
  ctx.fillText(`${totalTasks}`, 118, 245);
  ctx.fillText(`${totalMinutes}`, 360, 245);
  ctx.fillText(`${subjects.length}`, 650, 245);
  ctx.font = "24px Microsoft YaHei, sans-serif";
  ctx.fillStyle = "#64706d";
  ctx.fillText("完成任务", 118, 288);
  ctx.fillText("专注分钟", 360, 288);
  ctx.fillText("涉及科目", 650, 288);

  let y = 400;
  const weekday = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  stats.forEach((item) => {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 72, y - 34, 1036, 58, 14);
    ctx.fill();
    ctx.strokeStyle = "#dbe4df";
    ctx.stroke();
    ctx.fillStyle = item.completedTasks || item.focusMinutes ? "#2f7d5c" : "#87908d";
    ctx.font = "bold 24px Microsoft YaHei, sans-serif";
    ctx.fillText(`${item.date.getMonth() + 1}/${item.date.getDate()} ${weekday[item.date.getDay()]}`, 108, y);
    ctx.fillStyle = "#18201f";
    ctx.font = "23px Microsoft YaHei, sans-serif";
    ctx.fillText(`任务 ${item.completedTasks} 个 · 专注 ${item.focusMinutes} 分钟`, 300, y);
    ctx.fillStyle = "#64706d";
    const subjectText = item.subjects.length ? item.subjects.join("、") : "暂无科目";
    ctx.fillText(subjectText.slice(0, 26), 650, y);
    y += 72;
  });

  ctx.fillStyle = "#64706d";
  ctx.font = "22px Microsoft YaHei, sans-serif";
  const todayReview = reviewState[isoDate(new Date())];
  if (todayReview?.priority || todayReview?.minimum) {
    ctx.fillText(`今日复盘：${todayReview.priority || todayReview.minimum}`.slice(0, 42), 72, 790);
  }
  ctx.fillText("由智习计划生成", 72, 824);

  const link = document.createElement("a");
  link.download = `学习周报-${isoDate(new Date())}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function importBook(book) {
  const duplicate = findDuplicateBook(book.title);
  if (duplicate) {
    activeId = duplicate.id;
    if (nodes.quickAddStatus) nodes.quickAddStatus.textContent = `“${duplicate.title}”已存在，已为你切换到这本教材。`;
    saveState();
    render();
    document.querySelector(".planner").scrollIntoView({ behavior: "smooth", block: "start" });
    return false;
  }
  state.books.push(book);
  activeId = book.id;
  if (nodes.quickAddStatus) nodes.quickAddStatus.textContent = `已添加“${book.title}”，可以继续编辑考试日期、章节和难度。`;
  saveState();
  render();
  document.querySelector(".planner").scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

function render() {
  renderBooks();
  const book = getActiveBook();
  renderForm(book);
  renderMethod(book);
  renderPlan(book);
  renderPomodoroSubjects();
  renderHeatmap();
  renderMistakeSubjects();
  renderMistakeStars();
  renderMistakes();
  renderDictionary();
  renderCet4Dictionary();
  renderDashboard();
}

function openModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  if (modal === nodes.relaxGameModal) {
    renderRelaxScene();
    if (!relaxGameState.muted) startRelaxMusic();
  }
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  if (modal === nodes.relaxGameModal) {
    resetRelaxAdvanceTimer();
    stopRelaxMusic();
    stopRelaxSceneLoop();
  }
}

function loadNote() {
  try {
    const saved = JSON.parse(localStorage.getItem(NOTE_KEY)) || {};
    if (saved.entries) return saved;
    if (saved.text || saved.bg || saved.font || saved.size || saved.color) {
      return {
        settings: {
          bg: saved.bg || "white",
          font: saved.font || "'Microsoft YaHei', sans-serif",
          size: saved.size || "16",
          color: saved.color || "#18201f"
        },
        entries: {
          [isoDate(new Date())]: saved.text || ""
        }
      };
    }
    return { settings: {}, entries: {} };
  } catch {
    return { settings: {}, entries: {} };
  }
}

function getNoteState() {
  const note = loadNote();
  note.settings ||= {};
  note.entries ||= {};
  note.recentDates ||= Object.entries(note.entries)
    .filter(([, text]) => text.trim())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 2)
    .map(([dateKey]) => dateKey);
  return note;
}

function touchRecentNoteDate(dateKey) {
  const note = getNoteState();
  note.recentDates = [dateKey, ...(note.recentDates || []).filter((item) => item !== dateKey)].slice(0, 2);
  localStorage.setItem(NOTE_KEY, JSON.stringify(note));
}

function saveNote() {
  const note = getNoteState();
  note.settings = {
    bg: nodes.noteBg.value,
    font: nodes.noteFont.value,
    size: nodes.noteSize.value,
    color: nodes.noteColor.value
  };
  note.entries[nodes.noteDate.value || isoDate(new Date())] = nodes.noteText.value;
  note.recentDates = [nodes.noteDate.value || isoDate(new Date()), ...(note.recentDates || []).filter((item) => item !== (nodes.noteDate.value || isoDate(new Date())))].slice(0, 2);
  localStorage.setItem(NOTE_KEY, JSON.stringify(note));
  renderNoteSearchResults();
}

function loadNoteForDate(dateKey) {
  const note = getNoteState();
  nodes.noteDate.value = dateKey;
  nodes.noteText.value = note.entries[dateKey] || "";
  touchRecentNoteDate(dateKey);
  renderNoteSearchResults();
  showNotePreview(dateKey);
}

function renderNoteSearchResults() {
  const note = getNoteState();
  const query = nodes.noteSearchInput.value.trim().toLowerCase();
  const entries = (note.recentDates || [])
    .map((dateKey) => [dateKey, note.entries[dateKey] || ""])
    .filter(([dateKey, text]) => !query || dateKey.includes(query) || text.toLowerCase().includes(query))
    .slice(0, 2);

  nodes.noteSearchResults.innerHTML = "";
  if (!entries.length) {
    nodes.noteSearchResults.textContent = query ? "最近两次里没有匹配记录。" : "暂无最近快捷记录。";
    return;
  }

  entries.forEach(([dateKey, text]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "note-result";
    button.innerHTML = `<strong>${dateKey}</strong><span>${text.slice(0, 32) || "空白记事"}</span>`;
    button.addEventListener("click", () => loadNoteForDate(dateKey));
    button.addEventListener("mouseenter", () => showNotePreview(dateKey));
    nodes.noteSearchResults.append(button);
  });
}

function showNotePreview(dateKey) {
  const note = getNoteState();
  const text = (note.entries[dateKey] || "").trim();
  nodes.noteDatePreview.textContent = text ? `${dateKey}：${text.slice(0, 90)}` : `${dateKey} 暂无记事内容。`;
}

function persistNoteSettings() {
  const note = getNoteState();
  note.settings = {
    bg: nodes.noteBg.value,
    font: nodes.noteFont.value,
    size: nodes.noteSize.value,
    color: nodes.noteColor.value
  };
  localStorage.setItem(
    NOTE_KEY,
    JSON.stringify(note)
  );
}

function applyNoteStyle() {
  nodes.noteText.classList.remove("note-white", "note-black", "note-beige");
  nodes.noteText.classList.add(`note-${nodes.noteBg.value}`);
  nodes.noteText.style.fontFamily = nodes.noteFont.value;
  nodes.noteText.style.fontSize = `${nodes.noteSize.value}px`;
  nodes.noteText.style.color = nodes.noteColor.value;
  persistNoteSettings();
}

function setupNote() {
  const note = getNoteState();
  const settings = note.settings || {};
  nodes.noteDate.value = isoDate(new Date());
  nodes.noteText.value = note.entries?.[nodes.noteDate.value] || "";
  nodes.noteBg.value = settings.bg || "white";
  nodes.noteFont.value = settings.font || "'Microsoft YaHei', sans-serif";
  nodes.noteSize.value = settings.size || "16";
  nodes.noteColor.value = settings.color || "#18201f";
  applyNoteStyle();
  renderNoteSearchResults();

  nodes.noteBg.addEventListener("change", () => {
    const defaults = { white: "#18201f", black: "#f6f7f3", beige: "#2d261d" };
    nodes.noteColor.value = defaults[nodes.noteBg.value];
    applyNoteStyle();
  });
  [nodes.noteFont, nodes.noteSize, nodes.noteColor].forEach((control) => {
    control.addEventListener("input", applyNoteStyle);
    control.addEventListener("change", applyNoteStyle);
  });
  nodes.noteDate.addEventListener("change", () => loadNoteForDate(nodes.noteDate.value || isoDate(new Date())));
  nodes.noteDate.addEventListener("mouseenter", () => showNotePreview(nodes.noteDate.value || isoDate(new Date())));
  nodes.noteSearchInput.addEventListener("input", renderNoteSearchResults);
  nodes.noteText.addEventListener("input", saveNote);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function setupGame() {
  gameDeck = shuffle(getGameWordPool()).slice(0, 6);
  gameRound = 0;
  gameTotalScore = 0;
  selectedEnglish = null;
  selectedChinese = null;
  matchedPairs = new Set();
  nodes.gameWordBank.innerHTML = "";
  nodes.englishWords.innerHTML = "";
  nodes.chineseWords.innerHTML = "";
  gameDeck.forEach((item, index) => {
    const chip = document.createElement("span");
    chip.className = "word-chip";
    chip.textContent = `${index + 1}. ${item.word}`;
    nodes.gameWordBank.append(chip);
  });
  shuffle(gameDeck).forEach((item) => nodes.englishWords.append(createMatchCard(item.word, item.word, "en")));
  shuffle(gameDeck).forEach((item) => nodes.chineseWords.append(createMatchCard(item.translation, item.word, "zh")));
  nodes.gameScore.textContent = "得分：0";
  nodes.gameMessage.textContent = "随机抽取 6 个六级词汇：先配对，再翻译续写。";
  nextGameQuestion();
}

function createMatchCard(text, pair, side) {
  const button = document.createElement("button");
  button.className = "match-card";
  button.type = "button";
  button.textContent = text;
  button.dataset.pair = pair;
  button.addEventListener("click", () => {
    if (button.classList.contains("matched")) return;
    if (side === "en") {
      selectedEnglish?.classList.remove("selected");
      selectedEnglish = button;
    } else {
      selectedChinese?.classList.remove("selected");
      selectedChinese = button;
    }
    button.classList.add("selected");
    checkMatch();
  });
  return button;
}

function checkMatch() {
  if (!selectedEnglish || !selectedChinese) return;
  if (selectedEnglish.dataset.pair === selectedChinese.dataset.pair) {
    selectedEnglish.classList.add("matched");
    selectedChinese.classList.add("matched");
    selectedEnglish.disabled = true;
    selectedChinese.disabled = true;
    if (!matchedPairs.has(selectedEnglish.dataset.pair)) {
      matchedPairs.add(selectedEnglish.dataset.pair);
      gameTotalScore += 10;
    }
    nodes.gameScore.textContent = `得分：${gameTotalScore}`;
    nodes.gameMessage.textContent = matchedPairs.size === gameDeck.length ? "配对完成，可以继续做翻译续写。" : "配对正确，继续找下一组。";
    selectedEnglish = null;
    selectedChinese = null;
    return;
  }
  nodes.gameMessage.textContent = "这组不匹配，再看一下中文核心含义。";
  setTimeout(() => {
    selectedEnglish?.classList.remove("selected");
    selectedChinese?.classList.remove("selected");
    selectedEnglish = null;
    selectedChinese = null;
  }, 500);
}

function nextGameQuestion() {
  currentGameWord = gameDeck[gameRound % gameDeck.length];
  nodes.gamePromptWord.textContent = currentGameWord.word;
  nodes.gamePromptExample.textContent = currentGameWord.example;
  nodes.gameTranslationInput.value = "";
  nodes.gameWritingInput.value = "";
  nodes.gameFeedback.textContent = "";
  nodes.gameMessage.textContent = `第 ${gameRound + 1} 题：写翻译，再用它续写一句英文。`;
}

function scoreTranslation(answer, word) {
  const text = answer.trim().toLowerCase();
  if (!text) return 0;
  const keywordScore = word.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 14 : 0), 0);
  const lengthScore = Math.min(18, text.length * 1.5);
  return Math.min(60, Math.round(keywordScore + lengthScore));
}

function scoreWriting(answer, word) {
  const text = answer.trim();
  if (!text) return 0;
  const hasWord = text.toLowerCase().includes(word.word.toLowerCase());
  const hasSentenceShape = /[a-zA-Z]{2,}.+\s+[a-zA-Z]{2,}/.test(text);
  const lengthScore = Math.min(18, Math.floor(text.length / 4));
  return Math.min(40, (hasWord ? 16 : 0) + (hasSentenceShape ? 10 : 0) + lengthScore);
}

function submitGameAnswer() {
  if (!currentGameWord) return;
  const translationScore = scoreTranslation(nodes.gameTranslationInput.value, currentGameWord);
  const writingScore = scoreWriting(nodes.gameWritingInput.value, currentGameWord);
  const roundScore = translationScore + writingScore;
  gameTotalScore += roundScore;
  nodes.gameScore.textContent = `得分：${gameTotalScore}`;
  nodes.gameFeedback.innerHTML = `
    <strong>本题 ${roundScore} 分</strong>
    <p>参考翻译：${currentGameWord.translation}</p>
    <p>翻译 ${translationScore}/60，续写 ${writingScore}/40。续写里用到 <strong>${currentGameWord.word}</strong> 且句子完整，分数会更高。</p>
  `;
  nodes.gameMessage.textContent =
    roundScore >= 80 ? "很稳，翻译和输出都不错。" : roundScore >= 55 ? "方向对了，再把核心含义写完整一点。" : "先抓关键词，再尝试写一个完整英文句子。";
}

function advanceGame() {
  gameRound += 1;
  if (gameRound >= gameDeck.length) {
    nodes.gameMessage.textContent = `本轮结束，总分 ${gameTotalScore}/${gameDeck.length * 110}。点击重新开始会换一组题。`;
    nodes.gameFeedback.innerHTML += "<p>已经完成这一轮。可以重新开始抽取新的六级词汇。</p>";
    return;
  }
  nextGameQuestion();
}

const relaxEnemyCatalog = [
  { name: "草团史莱姆", kind: "slime" },
  { name: "跳跳角兔", kind: "rabbit" },
  { name: "苔原野猪", kind: "boar" },
  { name: "风羽乌鸦", kind: "crow" },
  { name: "仙人掌兽", kind: "cactus" },
  { name: "蘑菇守卫", kind: "mushroom" }
];

const relaxBossCatalog = [
  { name: "巨角草原王", kind: "buffalo" },
  { name: "岩甲魔像", kind: "golem" },
  { name: "烈日狮王", kind: "lion" },
  { name: "雷羽鹰王", kind: "hawk" },
  { name: "荒野幼龙", kind: "dragon" }
];

const RELAX_SCENE = {
  width: 160,
  height: 90,
  pixel: 10,
  finePixel: 5,
  canvasWidth: 1600,
  canvasHeight: 900
};

const relaxMelody = [64, 67, 71, 72, 71, 67, 64, 62, 64, 67, 69, 71, 69, 67, 64, 62];
const relaxBossMelody = [48, 52, 55, 60, 55, 52, 48, 43, 48, 52, 57, 60, 57, 52, 48, 45];

function createRelaxGameState() {
  return {
    active: false,
    heroGender: "",
    heroName: "待选择",
    heroHp: 100,
    heroMaxHp: 100,
    enemyHp: 0,
    enemyMaxHp: 0,
    stage: 1,
    score: 0,
    defeated: 0,
    wordCursor: 0,
    queue: [],
    currentWord: null,
    currentEnemy: null,
    isBoss: false,
    locked: true,
    muted: false,
    fxType: "",
    fxFrame: 0,
    fxMax: 0,
    fxSide: "",
    bossIntro: 0,
    screenShake: 0,
    enemyFlash: 0,
    heroFlash: 0,
    feedback: "选好角色后，按中文提示写出英语单词，答对就能击退敌人。"
  };
}

function buildRelaxGameQueue() {
  const seen = new Set();
  return shuffle(getGameWordPool()).filter((item) => {
    const key = String(item.word || "").toLowerCase();
    if (!key || seen.has(key) || !/^[a-z][a-z-]*$/i.test(key)) return false;
    seen.add(key);
    return Boolean(item.translation);
  });
}

function resetRelaxAdvanceTimer() {
  if (relaxAdvanceTimer) {
    clearTimeout(relaxAdvanceTimer);
    relaxAdvanceTimer = 0;
  }
}

function resetRelaxGameLobby() {
  const muted = relaxGameState.muted;
  resetRelaxAdvanceTimer();
  relaxGameState = createRelaxGameState();
  relaxGameState.muted = muted;
  stopRelaxMusic();
  if (nodes.relaxGameModal?.classList.contains("open") && !relaxGameState.muted) startRelaxMusic();
  renderRelaxGame();
}

function ensureRelaxQueue() {
  if (!relaxGameState.queue.length) {
    relaxGameState.queue = buildRelaxGameQueue();
  }
}

function pickRelaxEnemy(stage, isBoss) {
  const source = isBoss ? relaxBossCatalog : relaxEnemyCatalog;
  const profile = source[(Math.max(stage, 1) - 1) % source.length];
  return { ...profile, stage };
}

function currentRelaxWord() {
  ensureRelaxQueue();
  const word = relaxGameState.queue[relaxGameState.wordCursor % relaxGameState.queue.length];
  return word || { word: "challenge", translation: "挑战", keywords: ["挑战"], example: "" };
}

function triggerRelaxVisualFx(type, duration = 12, side = "enemy", shake = 0) {
  relaxGameState.fxType = type;
  relaxGameState.fxFrame = duration;
  relaxGameState.fxMax = duration;
  relaxGameState.fxSide = side;
  relaxGameState.screenShake = Math.max(relaxGameState.screenShake, shake);
  if (side === "enemy") relaxGameState.enemyFlash = Math.max(relaxGameState.enemyFlash, duration);
  if (side === "hero") relaxGameState.heroFlash = Math.max(relaxGameState.heroFlash, duration);
  if (nodes.relaxGameModal?.classList.contains("open")) startRelaxSceneLoop();
}

function stepRelaxVisualFx() {
  if (relaxGameState.fxFrame > 0) relaxGameState.fxFrame -= 1;
  else relaxGameState.fxType = "";
  if (relaxGameState.bossIntro > 0) relaxGameState.bossIntro -= 1;
  if (relaxGameState.screenShake > 0) relaxGameState.screenShake -= 1;
  if (relaxGameState.enemyFlash > 0) relaxGameState.enemyFlash -= 1;
  if (relaxGameState.heroFlash > 0) relaxGameState.heroFlash -= 1;
}

function spawnRelaxStage() {
  relaxGameState.isBoss = relaxGameState.stage % 10 === 0;
  relaxGameState.currentEnemy = pickRelaxEnemy(relaxGameState.stage, relaxGameState.isBoss);
  relaxGameState.enemyMaxHp = relaxGameState.isBoss ? 3 : 1;
  relaxGameState.enemyHp = relaxGameState.enemyMaxHp;
  relaxGameState.currentWord = currentRelaxWord();
  relaxGameState.locked = false;
  relaxGameState.bossIntro = relaxGameState.isBoss ? 34 : 0;
  relaxGameState.feedback = relaxGameState.isBoss
    ? `Boss 登场：${relaxGameState.currentEnemy.name}。连续答对 3 次才能击退它。`
    : `第 ${relaxGameState.stage} 关开始，答对当前中文提示就能击退 ${relaxGameState.currentEnemy.name}。`;
  triggerRelaxVisualFx(relaxGameState.isBoss ? "boss-intro" : "spawn", relaxGameState.isBoss ? 22 : 10, "enemy", relaxGameState.isBoss ? 4 : 2);
  if (nodes.relaxAnswerInput) nodes.relaxAnswerInput.value = "";
  renderRelaxGame();
}

function startRelaxGame(gender) {
  resetRelaxAdvanceTimer();
  const muted = relaxGameState.muted;
  relaxGameState = createRelaxGameState();
  relaxGameState.muted = muted;
  relaxGameState.active = true;
  relaxGameState.heroGender = gender;
  relaxGameState.heroName = gender === "male" ? "蓝铠剑士" : "红巾游侠";
  relaxGameState.queue = buildRelaxGameQueue();
  spawnRelaxStage();
  startRelaxMusic();
  nodes.relaxAnswerInput?.focus();
}

function normalizeRelaxAnswer(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z-]/g, "");
}

function updateRelaxPromptForNextHit() {
  relaxGameState.currentWord = currentRelaxWord();
  if (nodes.relaxAnswerInput) nodes.relaxAnswerInput.value = "";
}

function finishRelaxRun(message) {
  relaxGameState.active = false;
  relaxGameState.locked = true;
  relaxGameState.feedback = message;
  stopRelaxMusic();
  renderRelaxGame();
}

function submitRelaxGameAnswer() {
  if (relaxGameState.locked || !relaxGameState.heroGender || !relaxGameState.currentWord) return;
  const answer = nodes.relaxAnswerInput.value.trim();
  if (!answer) {
    relaxGameState.feedback = "先写出英文答案，再出招。";
    renderRelaxGame();
    return;
  }
  const target = normalizeRelaxAnswer(relaxGameState.currentWord.word);
  const given = normalizeRelaxAnswer(answer);
  if (given === target) {
    relaxGameState.score += relaxGameState.isBoss ? 26 : 12;
    relaxGameState.enemyHp = Math.max(0, relaxGameState.enemyHp - 1);
    relaxGameState.wordCursor += 1;
    if (relaxGameState.enemyHp === 0) {
      triggerRelaxVisualFx(relaxGameState.isBoss ? "boss-clear" : "enemy-burst", relaxGameState.isBoss ? 24 : 16, "enemy", relaxGameState.isBoss ? 7 : 4);
      playRelaxSfx(relaxGameState.isBoss ? "boss-clear" : "enemy-clear");
      relaxGameState.defeated += 1;
      relaxGameState.locked = true;
      relaxGameState.heroHp = Math.min(relaxGameState.heroMaxHp, relaxGameState.heroHp + (relaxGameState.isBoss ? 18 : 6));
      const clearedEnemy = relaxGameState.currentEnemy?.name || "敌人";
      relaxGameState.feedback = relaxGameState.isBoss
        ? `Boss ${clearedEnemy} 被击退了，生命恢复了一些，继续前进。`
        : `${clearedEnemy} 被击退，继续向前。`;
      relaxGameState.stage += 1;
      renderRelaxGame();
      resetRelaxAdvanceTimer();
      relaxAdvanceTimer = setTimeout(() => {
        if (!nodes.relaxGameModal.classList.contains("open")) return;
        spawnRelaxStage();
      }, 820);
      return;
    }
    triggerRelaxVisualFx(relaxGameState.isBoss ? "boss-slash" : "slash", relaxGameState.isBoss ? 14 : 10, "enemy", relaxGameState.isBoss ? 4 : 2);
    playRelaxSfx(relaxGameState.isBoss ? "boss-hit" : "hit");
    updateRelaxPromptForNextHit();
    relaxGameState.feedback = `命中了 ${relaxGameState.currentEnemy?.name || "敌人"}，继续答下一题。还剩 ${relaxGameState.enemyHp} 点敌方生命。`;
    renderRelaxGame();
    nodes.relaxAnswerInput?.focus();
    return;
  }
  triggerRelaxVisualFx(relaxGameState.isBoss ? "boss-strike" : "hero-hit", relaxGameState.isBoss ? 18 : 12, "hero", relaxGameState.isBoss ? 6 : 4);
  playRelaxSfx(relaxGameState.isBoss ? "boss-strike" : "hurt");
  relaxGameState.heroHp = Math.max(0, relaxGameState.heroHp - (relaxGameState.isBoss ? 16 : 10));
  relaxGameState.feedback = `失手了。正确答案是 ${relaxGameState.currentWord.word}，再来一题稳住节奏。`;
  relaxGameState.wordCursor += 1;
  if (relaxGameState.heroHp === 0) {
    playRelaxSfx("hero-fall");
    finishRelaxRun(`这次倒在了第 ${relaxGameState.stage} 关，最终得分 ${relaxGameState.score}。重新选择角色就能再来一轮。`);
    return;
  }
  updateRelaxPromptForNextHit();
  renderRelaxGame();
  nodes.relaxAnswerInput?.focus();
}

function skipRelaxQuestion() {
  if (relaxGameState.locked || !relaxGameState.heroGender || !relaxGameState.currentWord) return;
  triggerRelaxVisualFx(relaxGameState.isBoss ? "boss-strike" : "hero-hit", relaxGameState.isBoss ? 16 : 10, "hero", relaxGameState.isBoss ? 5 : 3);
  playRelaxSfx(relaxGameState.isBoss ? "boss-strike" : "skip");
  relaxGameState.heroHp = Math.max(0, relaxGameState.heroHp - (relaxGameState.isBoss ? 12 : 6));
  relaxGameState.score = Math.max(0, relaxGameState.score - 4);
  relaxGameState.feedback = `已跳过。参考答案是 ${relaxGameState.currentWord.word}，敌人趁机反击了一下。`;
  relaxGameState.wordCursor += 1;
  if (relaxGameState.heroHp === 0) {
    playRelaxSfx("hero-fall");
    finishRelaxRun(`体力耗尽，最终停在第 ${relaxGameState.stage} 关，得分 ${relaxGameState.score}。`);
    return;
  }
  updateRelaxPromptForNextHit();
  renderRelaxGame();
}

function renderRelaxGame() {
  if (!nodes.relaxHeroName) return;
  const heroPercent = Math.max(0, Math.min(100, Math.round((relaxGameState.heroHp / relaxGameState.heroMaxHp) * 100)));
  const enemyPercent = relaxGameState.enemyMaxHp ? Math.max(0, Math.min(100, Math.round((relaxGameState.enemyHp / relaxGameState.enemyMaxHp) * 100))) : 0;
  nodes.relaxHeroName.textContent = relaxGameState.heroName;
  nodes.relaxStageBadge.textContent = `第 ${relaxGameState.stage} 关`;
  nodes.relaxEnemyName.textContent = relaxGameState.currentEnemy?.name || "草原守望者";
  nodes.relaxProgressText.textContent = `${relaxGameState.defeated} 个敌人已击退`;
  nodes.relaxScoreText.textContent = String(relaxGameState.score);
  nodes.relaxHeroHpText.textContent = `${relaxGameState.heroHp} / ${relaxGameState.heroMaxHp}`;
  nodes.relaxEnemyHpText.textContent = `${relaxGameState.enemyHp} / ${relaxGameState.enemyMaxHp}`;
  nodes.relaxHeroHpBar.style.width = `${heroPercent}%`;
  nodes.relaxEnemyHpBar.style.width = `${enemyPercent}%`;
  nodes.relaxPromptCn.textContent = relaxGameState.currentWord ? relaxGameState.currentWord.translation : "点击左侧角色开始闯关";
  nodes.relaxBossBadge.textContent = relaxGameState.isBoss ? "Boss 关" : "普通关";
  nodes.relaxStageCounter.textContent = relaxGameState.active
    ? `${relaxGameState.heroName} 正在第 ${relaxGameState.stage} 关作战${relaxGameState.isBoss ? " · Boss 来袭" : ""}`
    : "请选择角色，准备出发。";
  nodes.relaxFeedback.textContent = relaxGameState.feedback;
  nodes.relaxGameSummary.textContent = relaxGameState.active
    ? `每 10 关会出现一次 Boss。当前总分 ${relaxGameState.score}，已击退 ${relaxGameState.defeated} 个敌人。`
    : "每次进入都会重新选择角色，然后从第 1 关开始。";
  nodes.relaxMuteBtn.textContent = relaxGameState.muted ? "取消静音" : "静音";
  nodes.relaxStartMaleBtn.classList.toggle("active", relaxGameState.heroGender === "male");
  nodes.relaxStartFemaleBtn.classList.toggle("active", relaxGameState.heroGender === "female");
  nodes.relaxAnswerInput.disabled = !relaxGameState.active || relaxGameState.locked;
  nodes.relaxSubmitBtn.disabled = !relaxGameState.active || relaxGameState.locked;
  nodes.relaxSkipBtn.disabled = !relaxGameState.active || relaxGameState.locked;
  renderRelaxScene();
}

function drawRelaxPixel(ctx, x, y, w, h, color) {
  const unit = RELAX_SCENE.pixel;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x) * unit, Math.round(y) * unit, Math.round(w) * unit, Math.round(h) * unit);
}

function drawRelaxFinePixel(ctx, x, y, w, h, color) {
  const unit = RELAX_SCENE.finePixel;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x) * unit, Math.round(y) * unit, Math.round(w) * unit, Math.round(h) * unit);
}

function drawRelaxShadow(ctx, x, y, width, alpha = 0.18) {
  drawRelaxPixel(ctx, x, y, width, 2, `rgba(34, 53, 24, ${alpha})`);
}

function drawRelaxCloud(ctx, x, y, width = 12) {
  drawRelaxPixel(ctx, x + 2, y + 1, width - 4, 4, "rgba(124, 172, 198, .16)");
  drawRelaxPixel(ctx, x + 3, y, width - 5, 2, "rgba(255,255,255,.54)");
  drawRelaxPixel(ctx, x, y + 2, width - 5, 4, "rgba(255,255,255,.88)");
  drawRelaxPixel(ctx, x + 4, y + 1, width - 2, 5, "rgba(255,255,255,.94)");
  drawRelaxFinePixel(ctx, (x + 2) * 2, (y + 3) * 2, (width - 5) * 2, 2, "rgba(255,255,255,.24)");
}

function drawRelaxFlower(ctx, x, y, petal, center) {
  drawRelaxFinePixel(ctx, x, y + 1, 1, 1, petal);
  drawRelaxFinePixel(ctx, x + 2, y + 1, 1, 1, petal);
  drawRelaxFinePixel(ctx, x + 1, y, 1, 1, petal);
  drawRelaxFinePixel(ctx, x + 1, y + 2, 1, 1, petal);
  drawRelaxFinePixel(ctx, x + 1, y + 1, 1, 1, center);
}

function drawRelaxDust(ctx, x, y, size = 2, color = "rgba(245, 232, 171, .55)") {
  drawRelaxFinePixel(ctx, x, y, size, size, color);
  drawRelaxFinePixel(ctx, x + size + 1, y + 1, 1, 1, color);
}

function drawRelaxBanner(ctx, x, y, body, edge) {
  drawRelaxPixel(ctx, x, y, 1, 16, "#70563b");
  drawRelaxPixel(ctx, x + 1, y + 2, 5, 3, body);
  drawRelaxPixel(ctx, x + 1, y + 5, 4, 3, edge);
  drawRelaxPixel(ctx, x + 1, y + 8, 3, 2, body);
  drawRelaxFinePixel(ctx, (x + 2) * 2, (y + 3) * 2, 4, 2, "rgba(255,255,255,.22)");
}

function drawRelaxTree(ctx, x, y, crown = "#4a8346", shadow = "#325f30", trunk = "#7d5b34") {
  drawRelaxPixel(ctx, x + 4, y + 8, 4, 10, trunk);
  drawRelaxPixel(ctx, x + 3, y + 15, 6, 2, "#5a3e25");
  drawRelaxPixel(ctx, x + 1, y + 6, 10, 7, shadow);
  drawRelaxPixel(ctx, x + 2, y + 2, 8, 7, crown);
  drawRelaxPixel(ctx, x, y + 8, 4, 5, crown);
  drawRelaxPixel(ctx, x + 8, y + 8, 4, 5, crown);
  drawRelaxFinePixel(ctx, (x + 4) * 2, (y + 4) * 2, 6, 4, "rgba(255,255,255,.14)");
}

function drawRelaxBush(ctx, x, y, body = "#5e9d4c", shade = "#43773d") {
  drawRelaxPixel(ctx, x + 1, y + 2, 10, 4, body);
  drawRelaxPixel(ctx, x, y + 4, 12, 5, shade);
  drawRelaxPixel(ctx, x + 2, y + 1, 8, 2, "#82c567");
}

function drawRelaxTallGrass(ctx, x, y, color = "#5ba347", tip = "#9ee27b") {
  for (let i = 0; i < 6; i += 1) {
    const offset = i * 2;
    drawRelaxFinePixel(ctx, x + offset, y + (i % 2), 1, 4 + (i % 3), color);
    drawRelaxFinePixel(ctx, x + offset + 1, y + 2 + (i % 2), 1, 2, tip);
  }
}

function drawRelaxRoutePath(ctx, x, y, width, height) {
  drawRelaxPixel(ctx, x - 2, y, width + 4, height, "#b1844c");
  drawRelaxPixel(ctx, x, y, width, height, "#e0c483");
  drawRelaxPixel(ctx, x + 3, y, width - 6, height, "#efd99a");
  for (let step = 0; step < height; step += 6) {
    drawRelaxPixel(ctx, x + 4 + (step % 8 === 0 ? 0 : 2), y + step, Math.max(4, width - 10), 1, "rgba(197,154,84,.35)");
  }
}

function drawRelaxGrassPatch(ctx, x, y, width, height) {
  drawRelaxPixel(ctx, x + 2, y, width - 4, 1, "#b8ef8e");
  drawRelaxPixel(ctx, x + 1, y + 1, width - 2, 1, "#a4df7c");
  drawRelaxPixel(ctx, x, y + 2, width, height - 4, "#7fc85c");
  drawRelaxPixel(ctx, x + 1, y + 3, width - 2, height - 6, "#72b852");
  drawRelaxPixel(ctx, x + 3, y + height - 3, width - 6, 2, "#5f9b42");
  for (let offset = 4; offset < width - 4; offset += 5) {
    drawRelaxPixel(ctx, x + offset, y + 1 + (offset % 3), 1, 4, "#aef084");
    drawRelaxPixel(ctx, x + offset + 1, y + 2 + (offset % 2), 1, 3, "#8bdb68");
  }
}

function drawRelaxHero(ctx, gender, offsetY) {
  const baseX = 24;
  const baseY = 49 + offsetY;
  const skin = "#efc59c";
  drawRelaxShadow(ctx, baseX + 1, baseY + 27, 21, 0.2);
  if (gender === "female") {
    drawRelaxPixel(ctx, baseX + 6, baseY, 8, 2, "#6b2a24");
    drawRelaxPixel(ctx, baseX + 5, baseY + 2, 10, 4, "#8d3a2f");
    drawRelaxPixel(ctx, baseX + 7, baseY + 3, 6, 4, skin);
    drawRelaxPixel(ctx, baseX + 13, baseY + 3, 2, 9, "#7e2f2a");
    drawRelaxPixel(ctx, baseX + 5, baseY + 7, 10, 3, "#efdfc9");
    drawRelaxPixel(ctx, baseX + 4, baseY + 9, 11, 8, "#cc5e68");
    drawRelaxPixel(ctx, baseX + 5, baseY + 11, 9, 8, "#b34959");
    drawRelaxPixel(ctx, baseX + 3, baseY + 9, 2, 7, skin);
    drawRelaxPixel(ctx, baseX + 15, baseY + 9, 2, 7, skin);
    drawRelaxPixel(ctx, baseX + 2, baseY + 10, 2, 7, "#fff0a9");
    drawRelaxPixel(ctx, baseX + 16, baseY + 9, 5, 1, "#dce8ff");
    drawRelaxPixel(ctx, baseX + 7, baseY + 18, 3, 8, "#3c3457");
    drawRelaxPixel(ctx, baseX + 11, baseY + 18, 3, 8, "#3c3457");
    drawRelaxPixel(ctx, baseX + 6, baseY + 26, 4, 2, "#151b2f");
    drawRelaxPixel(ctx, baseX + 10, baseY + 26, 4, 2, "#151b2f");
    drawRelaxFinePixel(ctx, (baseX + 8) * 2, (baseY + 5) * 2, 1, 1, "#312224");
    drawRelaxFinePixel(ctx, (baseX + 11) * 2, (baseY + 5) * 2, 1, 1, "#312224");
    drawRelaxFinePixel(ctx, (baseX + 18) * 2, (baseY + 7) * 2, 3, 1, "#eff6ff");
    drawRelaxFinePixel(ctx, (baseX + 18) * 2, (baseY + 8) * 2, 2, 3, "#9bc7ff");
  } else {
    drawRelaxPixel(ctx, baseX + 6, baseY, 9, 2, "#1c2638");
    drawRelaxPixel(ctx, baseX + 5, baseY + 2, 10, 4, skin);
    drawRelaxPixel(ctx, baseX + 4, baseY + 6, 12, 3, "#6a95f0");
    drawRelaxPixel(ctx, baseX + 4, baseY + 9, 12, 9, "#3f66c8");
    drawRelaxPixel(ctx, baseX + 7, baseY + 10, 6, 4, "#bceaff");
    drawRelaxPixel(ctx, baseX + 3, baseY + 9, 2, 8, skin);
    drawRelaxPixel(ctx, baseX + 16, baseY + 9, 2, 8, skin);
    drawRelaxPixel(ctx, baseX + 2, baseY + 10, 2, 8, "#2c4876");
    drawRelaxPixel(ctx, baseX + 17, baseY + 10, 2, 8, "#2c4876");
    drawRelaxPixel(ctx, baseX + 7, baseY + 18, 3, 9, "#26344f");
    drawRelaxPixel(ctx, baseX + 11, baseY + 18, 3, 9, "#26344f");
    drawRelaxPixel(ctx, baseX + 6, baseY + 27, 4, 2, "#10182b");
    drawRelaxPixel(ctx, baseX + 10, baseY + 27, 4, 2, "#10182b");
    drawRelaxPixel(ctx, baseX + 17, baseY + 11, 6, 2, "#d3efff");
    drawRelaxFinePixel(ctx, (baseX + 8) * 2, (baseY + 4) * 2, 1, 1, "#1f2331");
    drawRelaxFinePixel(ctx, (baseX + 11) * 2, (baseY + 4) * 2, 1, 1, "#1f2331");
    drawRelaxFinePixel(ctx, (baseX + 18) * 2, (baseY + 12) * 2, 5, 2, "#94dbff");
  }
}

function drawRelaxEnemy(ctx, profile, offsetY, blink) {
  const isBoss = Boolean(profile?.stage && profile.stage % 10 === 0);
  const baseX = isBoss ? 98 : 104;
  const baseY = (isBoss ? 27 : 35) + offsetY;
  const eye = blink ? "#223" : "#fff";
  const auraPulse = Math.sin(relaxGameFrame / 10) > 0 ? 1 : 0;
  drawRelaxShadow(ctx, baseX - 1, baseY + (isBoss ? 30 : 22), isBoss ? 26 : 18, 0.2);
  switch (profile?.kind) {
    case "slime":
      drawRelaxPixel(ctx, baseX + 2, baseY + 6, 12, 8, "#71cc63");
      drawRelaxPixel(ctx, baseX + 4, baseY + 3, 8, 4, "#91e07e");
      drawRelaxPixel(ctx, baseX + 3, baseY + 14, 10, 3, "#59a94d");
      drawRelaxPixel(ctx, baseX + 5, baseY + 9, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 10, baseY + 9, 1, 1, eye);
      drawRelaxFinePixel(ctx, (baseX + 7) * 2, (baseY + 4) * 2, 3, 2, "rgba(255,255,255,.28)");
      break;
    case "rabbit":
      drawRelaxPixel(ctx, baseX + 5, baseY - 5, 2, 8, "#d8d7de");
      drawRelaxPixel(ctx, baseX + 12, baseY - 5, 2, 8, "#d8d7de");
      drawRelaxPixel(ctx, baseX + 3, baseY + 1, 13, 10, "#f5f3f8");
      drawRelaxPixel(ctx, baseX + 4, baseY + 10, 11, 5, "#d1ced7");
      drawRelaxPixel(ctx, baseX + 7, baseY + 5, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 11, baseY + 5, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 7, baseY + 11, 5, 2, "#9a6d4a");
      drawRelaxFinePixel(ctx, (baseX + 8) * 2, (baseY + 3) * 2, 4, 2, "rgba(255,255,255,.34)");
      break;
    case "boar":
      drawRelaxPixel(ctx, baseX + 1, baseY + 6, 18, 9, "#8d5b36");
      drawRelaxPixel(ctx, baseX + 3, baseY + 2, 13, 5, "#6f4326");
      drawRelaxPixel(ctx, baseX + 10, baseY + 7, 2, 1, eye);
      drawRelaxPixel(ctx, baseX + 16, baseY + 6, 3, 2, "#f4eadc");
      drawRelaxPixel(ctx, baseX + 4, baseY + 14, 2, 5, "#533018");
      drawRelaxPixel(ctx, baseX + 12, baseY + 14, 2, 5, "#533018");
      drawRelaxFinePixel(ctx, (baseX + 5) * 2, (baseY + 4) * 2, 6, 2, "rgba(255,220,188,.12)");
      break;
    case "crow":
      drawRelaxPixel(ctx, baseX + 5, baseY + 4, 10, 8, "#30354d");
      drawRelaxPixel(ctx, baseX, baseY + 7, 6, 4, "#1b2137");
      drawRelaxPixel(ctx, baseX + 14, baseY + 7, 6, 4, "#1b2137");
      drawRelaxPixel(ctx, baseX + 8, baseY + 6, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 13, baseY + 8, 5, 1, "#f7b647");
      drawRelaxFinePixel(ctx, (baseX + 3) * 2, (baseY + 9) * 2, 3, 2, "#576182");
      break;
    case "cactus":
      drawRelaxPixel(ctx, baseX + 6, baseY, 7, 15, "#53a24c");
      drawRelaxPixel(ctx, baseX + 2, baseY + 5, 4, 7, "#53a24c");
      drawRelaxPixel(ctx, baseX + 13, baseY + 7, 4, 7, "#53a24c");
      drawRelaxPixel(ctx, baseX + 7, baseY + 4, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 10, baseY + 4, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 7, baseY + 10, 5, 2, "#3b7c39");
      drawRelaxFinePixel(ctx, (baseX + 5) * 2, (baseY + 2) * 2, 1, 1, "#ffd66d");
      drawRelaxFinePixel(ctx, (baseX + 12) * 2, (baseY + 3) * 2, 1, 1, "#ffd66d");
      break;
    case "mushroom":
      drawRelaxPixel(ctx, baseX + 1, baseY + 2, 16, 6, "#d95b5b");
      drawRelaxPixel(ctx, baseX + 3, baseY + 8, 11, 9, "#f3e7d2");
      drawRelaxPixel(ctx, baseX + 6, baseY + 10, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 10, baseY + 10, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 6, baseY + 3, 2, 2, "#fff1f0");
      drawRelaxPixel(ctx, baseX + 11, baseY + 3, 2, 2, "#fff1f0");
      drawRelaxPixel(ctx, baseX + 5, baseY + 15, 7, 2, "#d4c6ab");
      break;
    case "buffalo":
      drawRelaxPixel(ctx, baseX, baseY + 7, 24, 13, "#6b4f31");
      drawRelaxPixel(ctx, baseX + 3, baseY + 1, 17, 7, "#83613c");
      drawRelaxPixel(ctx, baseX - 2, baseY + 2, 5, 2, auraPulse ? "#fff0df" : "#f4e7d7");
      drawRelaxPixel(ctx, baseX + 21, baseY + 2, 5, 2, auraPulse ? "#fff0df" : "#f4e7d7");
      drawRelaxPixel(ctx, baseX + 15, baseY + 10, 2, 1, eye);
      drawRelaxPixel(ctx, baseX + 3, baseY + 20, 3, 6, "#4e361f");
      drawRelaxPixel(ctx, baseX + 17, baseY + 20, 3, 6, "#4e361f");
      drawRelaxFinePixel(ctx, (baseX + 6) * 2, (baseY + 4) * 2, 8, 2, "rgba(255,230,198,.12)");
      break;
    case "golem":
      drawRelaxPixel(ctx, baseX + 2, baseY + 1, 18, 15, "#7e858d");
      drawRelaxPixel(ctx, baseX + 5, baseY - 2, 12, 5, "#959da5");
      drawRelaxPixel(ctx, baseX + 7, baseY + 6, 2, 1, "#8bd7ff");
      drawRelaxPixel(ctx, baseX + 13, baseY + 6, 2, 1, "#8bd7ff");
      drawRelaxPixel(ctx, baseX + 2, baseY + 12, 3, 8, "#646b73");
      drawRelaxPixel(ctx, baseX + 16, baseY + 12, 3, 8, "#646b73");
      drawRelaxFinePixel(ctx, (baseX + 5) * 2, (baseY + 8) * 2, 10, 2, "rgba(255,255,255,.1)");
      break;
    case "lion":
      drawRelaxPixel(ctx, baseX + 2, baseY + 5, 18, 12, "#e09d43");
      drawRelaxPixel(ctx, baseX + 5, baseY - 2, 12, 8, "#7d4b22");
      drawRelaxPixel(ctx, baseX + 12, baseY + 7, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 17, baseY + 9, 4, 2, "#b86424");
      drawRelaxFinePixel(ctx, (baseX + 7) * 2, (baseY + 3) * 2, 7, 2, "#b66d2b");
      break;
    case "hawk":
      drawRelaxPixel(ctx, baseX + 5, baseY + 4, 11, 8, "#596088");
      drawRelaxPixel(ctx, baseX, baseY + 7, 7, 4, "#404b70");
      drawRelaxPixel(ctx, baseX + 15, baseY + 7, 7, 4, "#404b70");
      drawRelaxPixel(ctx, baseX + 10, baseY + 5, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 15, baseY + 8, 4, 1, "#f4c654");
      drawRelaxFinePixel(ctx, (baseX + 6) * 2, (baseY + 10) * 2, 8, 2, "#8790b5");
      break;
    case "dragon":
      drawRelaxPixel(ctx, baseX + 1, baseY + 4, 22, 12, "#5a9472");
      drawRelaxPixel(ctx, baseX + 7, baseY - 1, 12, 7, "#84b96f");
      drawRelaxPixel(ctx, baseX + 18, baseY + 8, 5, 5, auraPulse ? "#d35e49" : "#b84c3b");
      drawRelaxPixel(ctx, baseX + 13, baseY + 7, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 4, baseY + 16, 4, 6, "#487658");
      drawRelaxPixel(ctx, baseX + 15, baseY + 16, 4, 6, "#487658");
      drawRelaxFinePixel(ctx, (baseX + 10) * 2, (baseY + 2) * 2, 8, 2, "#a8d784");
      break;
    default:
      drawRelaxPixel(ctx, baseX + 2, baseY + 4, 14, 10, "#73c658");
      drawRelaxPixel(ctx, baseX + 6, baseY + 7, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 10, baseY + 7, 1, 1, eye);
      drawRelaxPixel(ctx, baseX + 6, baseY + 12, 5, 1, "#4c8f36");
  }
  if (isBoss) {
    drawRelaxPixel(ctx, baseX - 3, baseY - 3, 28, 1, "rgba(255, 205, 88, .18)");
    drawRelaxPixel(ctx, baseX, baseY + 22, 22, 1, "rgba(255,255,255,.08)");
  }
}

function drawRelaxFlashRect(ctx, x, y, w, h, color, alpha) {
  if (alpha <= 0) return;
  drawRelaxPixel(ctx, x, y, w, h, color.replace("ALPHA", String(alpha)));
}

function drawRelaxCombatFx(ctx) {
  if (!relaxGameState.fxType || relaxGameState.fxFrame <= 0) return;
  const progress = 1 - relaxGameState.fxFrame / Math.max(1, relaxGameState.fxMax);
  const flash = Math.max(0.1, relaxGameState.fxFrame / Math.max(1, relaxGameState.fxMax));
  switch (relaxGameState.fxType) {
    case "spawn":
      for (let i = 0; i < 5; i += 1) {
        drawRelaxFinePixel(ctx, 210 + i * 10, 112 - Math.round(progress * 8) * 2, 2, 2, "rgba(255,255,255,.58)");
        drawRelaxFinePixel(ctx, 214 + i * 10, 116 + Math.round(progress * 5) * 2, 1, 1, "rgba(255,245,188,.72)");
      }
      break;
    case "slash":
    case "boss-slash":
      for (let i = 0; i < (relaxGameState.fxType === "boss-slash" ? 7 : 5); i += 1) {
        drawRelaxPixel(ctx, 56 + i * 8, 60 - i * 2, 4, 1, "rgba(226,245,255,.92)");
        drawRelaxPixel(ctx, 58 + i * 8, 61 - i * 2, 5, 1, "rgba(138,214,255,.78)");
      }
      drawRelaxPixel(ctx, 112, 45, relaxGameState.fxType === "boss-slash" ? 7 : 5, 4, `rgba(255,243,153,${0.25 + flash * 0.5})`);
      break;
    case "enemy-burst":
    case "boss-clear":
      for (const [dx, dy] of [[0, -8], [0, 8], [-10, 0], [10, 0], [-7, -6], [7, -6], [-7, 6], [7, 6]]) {
        drawRelaxPixel(ctx, 117 + dx, 48 + dy, relaxGameState.fxType === "boss-clear" ? 3 : 2, relaxGameState.fxType === "boss-clear" ? 3 : 2, "rgba(255,236,124,.88)");
      }
      if (relaxGameState.fxType === "boss-clear") {
        drawRelaxPixel(ctx, 98, 28, 32, 2, `rgba(255,255,255,${0.18 + flash * 0.35})`);
        drawRelaxPixel(ctx, 104, 58, 20, 2, `rgba(255,208,92,${0.18 + flash * 0.45})`);
      }
      break;
    case "hero-hit":
    case "boss-strike":
      for (const [dx, dy] of [[0, -6], [0, 6], [-6, 0], [6, 0], [-5, -5], [5, -5]]) {
        drawRelaxPixel(ctx, 40 + dx, 64 + dy, 2, 2, `rgba(255,118,104,${0.24 + flash * 0.45})`);
      }
      if (relaxGameState.fxType === "boss-strike") {
        drawRelaxPixel(ctx, 28, 57, 14, 1, "rgba(255,175,64,.72)");
        drawRelaxPixel(ctx, 30, 59, 12, 1, "rgba(255,223,128,.82)");
      }
      break;
    case "boss-intro":
      drawRelaxPixel(ctx, 0, 0, 160, 8, `rgba(22,28,44,${0.3 + flash * 0.3})`);
      drawRelaxPixel(ctx, 0, 82, 160, 8, `rgba(22,28,44,${0.3 + flash * 0.3})`);
      drawRelaxPixel(ctx, 98, 24, 36, 2, `rgba(255,214,112,${0.15 + flash * 0.4})`);
      drawRelaxPixel(ctx, 103, 29, 26, 2, `rgba(255,255,255,${0.1 + flash * 0.35})`);
      break;
  }
}

function renderRelaxScene() {
  if (!nodes.relaxGameCanvas) return;
  const ctx = nodes.relaxGameCanvas.getContext("2d");
  nodes.relaxGameCanvas.width = RELAX_SCENE.canvasWidth;
  nodes.relaxGameCanvas.height = RELAX_SCENE.canvasHeight;
  ctx.clearRect(0, 0, RELAX_SCENE.canvasWidth, RELAX_SCENE.canvasHeight);
  ctx.imageSmoothingEnabled = false;
  const shake = relaxGameState.screenShake > 0
    ? ((relaxGameFrame % 2 === 0 ? 1 : -1) * Math.min(2, relaxGameState.screenShake))
    : 0;
  ctx.save();
  ctx.translate(shake * RELAX_SCENE.pixel, 0);
  const skyShift = Math.sin(relaxGameFrame / 90) * 0.8;
  const cloudDrift = Math.sin(relaxGameFrame / 40) * 2;
  const bob = Math.sin(relaxGameFrame / 18) * 1.6;
  drawRelaxPixel(ctx, 0, 0, 160, 14, "#92dcff");
  drawRelaxPixel(ctx, 0, 14, 160, 10, "#a6e5ff");
  drawRelaxPixel(ctx, 0, 24, 160, 12, "#bfefff");
  drawRelaxPixel(ctx, 0, 36, 160, 8, "#a7d8a4");
  drawRelaxPixel(ctx, 0, 44, 160, 10, "#8dc785");
  drawRelaxPixel(ctx, 0, 54, 160, 9, "#6dad66");
  drawRelaxPixel(ctx, 0, 63, 160, 27, "#87d36b");
  drawRelaxPixel(ctx, 7, 7, 10, 10, "#ffe17b");
  drawRelaxPixel(ctx, 9, 9, 6, 6, "#fff4c2");
  drawRelaxCloud(ctx, 16 + cloudDrift, 9 + skyShift, 14);
  drawRelaxCloud(ctx, 60 - cloudDrift * 0.25, 7, 10);
  drawRelaxCloud(ctx, 118 - cloudDrift * 0.45, 12, 12);
  drawRelaxPixel(ctx, 0, 30, 24, 16, "#5f8d56");
  drawRelaxPixel(ctx, 18, 28, 24, 18, "#6a995f");
  drawRelaxPixel(ctx, 40, 32, 20, 14, "#5f8f55");
  drawRelaxPixel(ctx, 102, 30, 20, 15, "#5c8a52");
  drawRelaxPixel(ctx, 122, 34, 18, 12, "#6e9c61");
  drawRelaxPixel(ctx, 138, 37, 22, 10, "#5f8d56");
  drawRelaxPixel(ctx, 0, 47, 160, 3, "#467647");
  drawRelaxPixel(ctx, 0, 50, 160, 4, "#68ae59");
  drawRelaxPixel(ctx, 0, 54, 160, 2, "#5a964c");
  drawRelaxRoutePath(ctx, 67, 25, 25, 56);
  drawRelaxPixel(ctx, 63, 23, 2, 58, "#7bac56");
  drawRelaxPixel(ctx, 94, 23, 2, 58, "#7bac56");
  drawRelaxGrassPatch(ctx, 17, 68, 36, 10);
  drawRelaxGrassPatch(ctx, 101, 43, 30, 9);
  for (const tree of [
    [2, 34], [13, 33], [25, 35], [36, 34],
    [112, 33], [124, 34], [136, 35], [147, 36]
  ]) {
    drawRelaxTree(ctx, tree[0], tree[1]);
  }
  for (const bush of [[52, 57], [100, 58], [10, 61], [136, 61]]) {
    drawRelaxBush(ctx, bush[0], bush[1]);
  }
  for (const grass of [
    [14, 128], [28, 124], [46, 130], [58, 125],
    [204, 112], [224, 118], [244, 115], [270, 120]
  ]) {
    drawRelaxTallGrass(ctx, grass[0], grass[1]);
  }
  drawRelaxBanner(ctx, 58, 44, "#e7f0b4", "#9caf66");
  drawRelaxBanner(ctx, 96, 43, "#b6dff2", "#6aa0b8");
  drawRelaxPixel(ctx, 0, 78, 160, 12, "#95de74");
  for (const tuft of [6, 12, 18, 25, 34, 42, 52, 63, 74, 84, 96, 108, 121, 133, 145, 154]) {
    const sway = Math.sin(relaxGameFrame / 22 + tuft / 8) > 0 ? 1 : 0;
    drawRelaxPixel(ctx, tuft, 74 - sway, 1, 7 + sway, "#79c95d");
    drawRelaxPixel(ctx, tuft + 1, 77, 1, 4, "#a8ef84");
  }
  for (const flower of [
    [30, 164, "#ffb6c9", "#ffeb7a"],
    [56, 168, "#c8b8ff", "#fff2a1"],
    [116, 162, "#ffd3a4", "#fff0a6"],
    [144, 168, "#a8f1ff", "#fff4ae"]
  ]) {
    drawRelaxFlower(ctx, flower[0], flower[1], flower[2], flower[3]);
  }
  for (const dust of [
    [48 + bob, 151],
    [144 - bob, 131],
    [164 + skyShift, 146],
    [244, 136]
  ]) {
    drawRelaxDust(ctx, dust[0], dust[1]);
  }
  drawRelaxHero(ctx, relaxGameState.heroGender || "male", bob);
  drawRelaxEnemy(ctx, relaxGameState.currentEnemy, -bob, Math.floor(relaxGameFrame / 24) % 6 === 0);
  if (relaxGameState.enemyFlash > 0) {
    drawRelaxPixel(ctx, 100, 28, 28, 24, `rgba(255,255,255,${Math.min(.24, relaxGameState.enemyFlash / 48)})`);
  }
  if (relaxGameState.heroFlash > 0) {
    drawRelaxPixel(ctx, 26, 50, 22, 26, `rgba(255,134,122,${Math.min(.22, relaxGameState.heroFlash / 44)})`);
  }
  drawRelaxCombatFx(ctx);
  if (relaxGameState.heroHp <= 35) {
    drawRelaxPixel(ctx, 0, 0, 160, 90, "rgba(86, 24, 24, 0.08)");
  }
  drawRelaxPixel(ctx, 18, 82, 12, 3, "#84c85d");
  drawRelaxPixel(ctx, 50, 83, 14, 3, "#84c85d");
  drawRelaxPixel(ctx, 108, 82, 15, 3, "#84c85d");
  drawRelaxPixel(ctx, 135, 85, 9, 2, "#93d96a");
  ctx.restore();
}

function relaxGameTick() {
  if (!nodes.relaxGameModal?.classList.contains("open")) return;
  relaxGameFrame += 1;
  stepRelaxVisualFx();
  renderRelaxScene();
  if (
    relaxGameState.fxFrame > 0 ||
    relaxGameState.bossIntro > 0 ||
    relaxGameState.screenShake > 0 ||
    relaxGameState.enemyFlash > 0 ||
    relaxGameState.heroFlash > 0
  ) {
    relaxGameAnimationId = requestAnimationFrame(relaxGameTick);
  } else {
    stopRelaxSceneLoop();
  }
}

function startRelaxSceneLoop() {
  if (relaxGameAnimationId) return;
  relaxGameAnimationId = requestAnimationFrame(relaxGameTick);
}

function stopRelaxSceneLoop() {
  if (relaxGameAnimationId) cancelAnimationFrame(relaxGameAnimationId);
  relaxGameAnimationId = 0;
}

function midiToFrequency(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}

async function ensureRelaxAudioContext() {
  if (!relaxAudioContext) {
    const AudioContextCtor = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!AudioContextCtor) return null;
    relaxAudioContext = new AudioContextCtor();
  }
  if (relaxAudioContext.state === "suspended") {
    await relaxAudioContext.resume();
  }
  return relaxAudioContext;
}

function playRelaxTone(midi, duration = 0.18, volume = 0.03, type = "square") {
  if (relaxGameState.muted || !relaxAudioContext || midi === null) return;
  const osc = relaxAudioContext.createOscillator();
  const gain = relaxAudioContext.createGain();
  osc.type = type;
  osc.frequency.value = midiToFrequency(midi);
  gain.gain.setValueAtTime(0.0001, relaxAudioContext.currentTime);
  gain.gain.linearRampToValueAtTime(volume, relaxAudioContext.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, relaxAudioContext.currentTime + duration);
  osc.connect(gain);
  gain.connect(relaxAudioContext.destination);
  osc.start();
  osc.stop(relaxAudioContext.currentTime + duration);
}

function playRelaxChord(notes, duration = 0.18, volume = 0.03, waveTypes = ["square", "triangle"]) {
  notes.forEach((midi, index) => playRelaxTone(midi, duration, Math.max(0.012, volume - index * 0.005), waveTypes[index % waveTypes.length]));
}

async function startRelaxMusic() {
  const ctx = await ensureRelaxAudioContext();
  if (!ctx || relaxMusicTimer || relaxGameState.muted) return;
  let step = 0;
  relaxMusicTimer = setInterval(() => {
    if (!nodes.relaxGameModal?.classList.contains("open") || relaxGameState.muted) return;
    const isBoss = relaxGameState.isBoss;
    const melody = isBoss ? relaxBossMelody : relaxMelody;
    const midi = melody[step % melody.length];
    playRelaxTone(midi, isBoss ? 0.19 : 0.16, isBoss ? 0.03 : 0.026, isBoss ? "sawtooth" : "square");
    playRelaxTone(midi - 12, 0.12, isBoss ? 0.018 : 0.012, "triangle");
    if (isBoss && step % 2 === 0) playRelaxTone(midi - 19, 0.08, 0.014, "square");
    if (!isBoss && step % 4 === 0) playRelaxTone(midi + 7, 0.07, 0.01, "triangle");
    step += 1;
  }, 210);
}

function stopRelaxMusic() {
  if (relaxMusicTimer) {
    clearInterval(relaxMusicTimer);
    relaxMusicTimer = null;
  }
}

function playRelaxSfx(type) {
  ensureRelaxAudioContext().then(() => {
    if (relaxGameState.muted) return;
    switch (type) {
      case "hit":
        playRelaxChord([76, 83], 0.08, 0.042, ["square", "triangle"]);
        break;
      case "enemy-clear":
        playRelaxChord([72, 76, 81], 0.16, 0.034, ["square", "triangle", "sine"]);
        break;
      case "boss-hit":
        playRelaxChord([48, 55, 62], 0.14, 0.044, ["sawtooth", "square", "triangle"]);
        playRelaxTone(69, 0.07, 0.02, "triangle");
        break;
      case "boss-clear":
        playRelaxChord([50, 57, 62, 69], 0.28, 0.04, ["square", "triangle", "sawtooth", "sine"]);
        playRelaxTone(74, 0.12, 0.022, "triangle");
        break;
      case "boss-strike":
        playRelaxChord([43, 39], 0.18, 0.045, ["sawtooth", "square"]);
        break;
      case "hero-fall":
        playRelaxChord([52, 47, 40], 0.26, 0.038, ["triangle", "sawtooth", "square"]);
        break;
      case "skip":
        playRelaxTone(58, 0.07, 0.022, "square");
        playRelaxTone(54, 0.09, 0.018, "triangle");
        break;
      default:
        playRelaxChord([52, 45], 0.12, 0.04, ["sawtooth", "square"]);
    }
  });
}

function toggleRelaxMute() {
  relaxGameState.muted = !relaxGameState.muted;
  if (relaxGameState.muted) stopRelaxMusic();
  else if (nodes.relaxGameModal?.classList.contains("open")) startRelaxMusic();
  renderRelaxGame();
}

function renderPomodoroSubjects() {
  nodes.pomodoroSubject.innerHTML = "";
  state.books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.title;
    option.textContent = book.title;
    nodes.pomodoroSubject.append(option);
  });
}

function updatePomodoroDisplay() {
  const minutes = Math.floor(pomodoroRemaining / 60);
  const seconds = pomodoroRemaining % 60;
  nodes.pomodoroDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function setPomodoroDuration() {
  if (pomodoroTimer) clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  pomodoroStartedSeconds = Number(nodes.pomodoroMinutes.value) * 60;
  pomodoroRemaining = pomodoroStartedSeconds;
  updatePomodoroDisplay();
}

function startPomodoro() {
  if (pomodoroTimer) return;
  nodes.pomodoroNote.textContent = "专注中。完成后点击“完成并记录”，会计入今日学习时长。";
  pomodoroTimer = setInterval(() => {
    pomodoroRemaining = Math.max(0, pomodoroRemaining - 1);
    updatePomodoroDisplay();
    if (pomodoroRemaining === 0) {
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;
      nodes.pomodoroNote.textContent = "时间到，可以完成并记录了。";
    }
  }, 1000);
}

function pausePomodoro() {
  if (pomodoroTimer) clearInterval(pomodoroTimer);
  pomodoroTimer = null;
  nodes.pomodoroNote.textContent = "已暂停。继续时点击“开始”。";
}

function finishPomodoro() {
  pausePomodoro();
  const studiedSeconds = Math.max(60, pomodoroStartedSeconds - pomodoroRemaining);
  const minutes = Math.max(1, Math.round(studiedSeconds / 60));
  addFocusMinutes(nodes.pomodoroSubject.value || getActiveBook().title, minutes);
  nodes.pomodoroNote.textContent = `已记录 ${minutes} 分钟到今日学习时长。`;
  setPomodoroDuration();
}

function loadReview() {
  const key = nodes.reviewDate.value || isoDate(new Date());
  nodes.reviewDate.value = key;
  const review = reviewState[key] || {};
  nodes.reviewPriority.value = review.priority || "";
  nodes.reviewBlocker.value = review.blocker || "";
  nodes.reviewMinimum.value = review.minimum || "";
}

function saveReview(event) {
  event.preventDefault();
  const key = nodes.reviewDate.value || isoDate(new Date());
  reviewState[key] = {
    priority: nodes.reviewPriority.value.trim(),
    blocker: nodes.reviewBlocker.value.trim(),
    minimum: nodes.reviewMinimum.value.trim()
  };
  saveReviewState();
  renderDashboard();
  closeModal(nodes.reviewModal);
}

nodes.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const book = getActiveBook();
  const nextTitle = nodes.titleInput.value.trim();
  const duplicate = findDuplicateBook(nextTitle, book.id);
  if (duplicate) {
    nodes.titleInput.setCustomValidity("已存在同名教材，请换一个名称。");
    nodes.titleInput.reportValidity();
    return;
  }
  nodes.titleInput.setCustomValidity("");
  book.title = nextTitle;
  book.examDate = nodes.examInput.value;
  book.year = Number(nodes.yearInput.value) || today.getFullYear();
  book.dailyMinutes = Number(nodes.minutesInput.value);
  book.mastery = Number(nodes.masteryInput.value);
  book.chapters = parseChapters(nodes.chaptersInput.value);
  book.goal = nodes.goalInput.value.trim();
  saveState();
  render();
});

nodes.quickAddForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = nodes.quickTitle.value.trim();
  if (!title) return;
  const duplicate = findDuplicateBook(title);
  if (duplicate) {
    nodes.quickTitle.setCustomValidity("已存在同名教材，不能重复添加。");
    nodes.quickTitle.reportValidity();
    nodes.quickAddStatus.textContent = `“${duplicate.title}”已存在，不能重复添加。`;
    return;
  }
  nodes.quickTitle.setCustomValidity("");

  if (importBook(createBookFromTitle(title, { year: selectedLibraryYear() }))) {
    nodes.quickTitle.value = "";
  }
});

nodes.quickTitle.addEventListener("input", () => {
  nodes.quickTitle.setCustomValidity("");
  nodes.quickAddStatus.textContent = "输入教材名后会自动生成可编辑章节模板；已存在的同名教材不会重复添加。";
});

nodes.yearFilter.addEventListener("change", () => {
  currentYearFilter = nodes.yearFilter.value;
  render();
});

nodes.bookSearchInput.addEventListener("input", () => {
  bookSearchQuery = nodes.bookSearchInput.value.trim();
  renderBooks();
});

document.querySelectorAll(".segment button").forEach((button) => {
  button.addEventListener("click", () => {
    if (!button.dataset.view) return;
    currentView = button.dataset.view;
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderPlan(getActiveBook());
  });
});

nodes.heatmapToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentHeatmapView = button.dataset.heatmapView;
    nodes.heatmapToggleButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderHeatmap();
  });
});

nodes.resetBtn.addEventListener("click", () => {
  state = { books: structuredClone(initialBooks), activeId: initialBooks[0].id };
  activeId = state.activeId;
  saveState();
  render();
});

nodes.returnHomeBtn.addEventListener("click", returnToEntryExperience);

nodes.deleteBtn.addEventListener("click", () => {
  if (state.books.length === 1) return;
  state.books = state.books.filter((book) => book.id !== activeId);
  activeId = state.books[0].id;
  saveState();
  render();
});

nodes.generateAllBtn.addEventListener("click", () => {
  renderMethod(getActiveBook());
  renderPlan(getActiveBook());
  showFeaturePanel("recordPanel");
  document.querySelector(".plan-section").scrollIntoView({ behavior: "smooth", block: "start" });
});

nodes.exportBtn.addEventListener("click", () => {
  const book = getActiveBook();
  const { weeklyBlocks } = buildPlan(book);
  const content = [
    `# ${book.title} 学习计划`,
    "",
    `考试日期：${book.examDate}`,
    `每日学习：${book.dailyMinutes} 分钟`,
    "",
    "## 科学复习方法",
    ...generateMethod(book).flatMap((item) => [`### ${item.title}`, item.text, ""]),
    "## 周计划",
    ...weeklyBlocks.flatMap((block) => [`### ${block.title}`, ...block.tasks.map((task) => `- ${task}`), ""])
  ].join("\n");

  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${book.title}-学习计划.md`;
  link.click();
  URL.revokeObjectURL(link.href);
});

nodes.exportTodayImageBtn.addEventListener("click", exportTodayImage);
nodes.exportWeeklyImageBtn.addEventListener("click", exportWeeklyImage);
nodes.favoriteEnglishBtn.addEventListener("click", toggleDailyEnglishFavorite);
nodes.dictionarySearchInput.addEventListener("input", () => {
  dictionaryPage = 1;
  renderDictionary();
});
nodes.dictionaryPageSize?.addEventListener("change", () => {
  dictionaryPageSize = nodes.dictionaryPageSize.value === "all" ? "all" : Number(nodes.dictionaryPageSize.value) || 48;
  dictionaryPage = 1;
  renderDictionary();
});
nodes.dictionaryPrevBtn?.addEventListener("click", () => {
  dictionaryPage = Math.max(1, dictionaryPage - 1);
  renderDictionary();
});
nodes.dictionaryNextBtn?.addEventListener("click", () => {
  dictionaryPage += 1;
  renderDictionary();
});
nodes.importDictionaryBtn.addEventListener("click", () => nodes.dictionaryImportInput.click());
nodes.dictionaryImportInput.addEventListener("change", () =>
  importDictionaryFile(nodes.dictionaryImportInput.files?.[0], {
    merge: mergeDictionary,
    statusNode: nodes.dictionaryStatus,
    render: renderDictionary,
    inputNode: nodes.dictionaryImportInput,
    afterImport: setupGame
  })
);
nodes.cet4DictionarySearchInput?.addEventListener("input", () => {
  cet4DictionaryPage = 1;
  renderCet4Dictionary();
});
nodes.cet4DictionaryPageSize?.addEventListener("change", () => {
  cet4DictionaryPageSize =
    nodes.cet4DictionaryPageSize.value === "all" ? "all" : Number(nodes.cet4DictionaryPageSize.value) || 48;
  cet4DictionaryPage = 1;
  renderCet4Dictionary();
});
nodes.cet4DictionaryPrevBtn?.addEventListener("click", () => {
  cet4DictionaryPage = Math.max(1, cet4DictionaryPage - 1);
  renderCet4Dictionary();
});
nodes.cet4DictionaryNextBtn?.addEventListener("click", () => {
  cet4DictionaryPage += 1;
  renderCet4Dictionary();
});
nodes.importCet4DictionaryBtn?.addEventListener("click", () => nodes.cet4DictionaryImportInput?.click());
nodes.cet4DictionaryImportInput?.addEventListener("change", () =>
  importDictionaryFile(nodes.cet4DictionaryImportInput.files?.[0], {
    merge: mergeCet4Dictionary,
    statusNode: nodes.cet4DictionaryStatus,
    render: renderCet4Dictionary,
    inputNode: nodes.cet4DictionaryImportInput
  })
);
nodes.dataBackupBtn.addEventListener("click", () => openModal(nodes.backupModal));
nodes.exportDataBtn.addEventListener("click", exportAllData);
nodes.importDataBtn.addEventListener("click", () => nodes.importDataInput.click());
nodes.compactDataBtn.addEventListener("click", compactMistakeImages);
nodes.importDataInput.addEventListener("change", () => importAllData(nodes.importDataInput.files?.[0]));
nodes.notesBtn.addEventListener("click", () => openModal(nodes.notesModal));
nodes.utilityNotesBtn?.addEventListener("click", () => openModal(nodes.notesModal));
nodes.gameBtn.addEventListener("click", () => {
  setupGame();
  openModal(nodes.gameModal);
});
nodes.relaxGameBtn?.addEventListener("click", () => {
  resetRelaxGameLobby();
  openModal(nodes.relaxGameModal);
});
nodes.utilityRelaxBtn?.addEventListener("click", () => {
  resetRelaxGameLobby();
  openModal(nodes.relaxGameModal);
});
nodes.restartGameBtn.addEventListener("click", setupGame);
nodes.submitGameBtn.addEventListener("click", submitGameAnswer);
nodes.nextGameBtn.addEventListener("click", advanceGame);
nodes.relaxStartMaleBtn?.addEventListener("click", () => startRelaxGame("male"));
nodes.relaxStartFemaleBtn?.addEventListener("click", () => startRelaxGame("female"));
nodes.relaxSubmitBtn?.addEventListener("click", submitRelaxGameAnswer);
nodes.relaxSkipBtn?.addEventListener("click", skipRelaxQuestion);
nodes.relaxResetBtn?.addEventListener("click", resetRelaxGameLobby);
nodes.relaxMuteBtn?.addEventListener("click", toggleRelaxMute);
nodes.relaxAnswerInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    submitRelaxGameAnswer();
  }
});
nodes.scrollTopBtn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
nodes.pomodoroBtn.addEventListener("click", () => {
  renderPomodoroSubjects();
  setPomodoroDuration();
  openModal(nodes.pomodoroModal);
});
nodes.reviewBtn.addEventListener("click", () => {
  nodes.reviewDate.value = isoDate(new Date());
  loadReview();
  openModal(nodes.reviewModal);
});
nodes.pomodoroMinutes.addEventListener("change", setPomodoroDuration);
nodes.startPomodoroBtn.addEventListener("click", startPomodoro);
nodes.pausePomodoroBtn.addEventListener("click", pausePomodoro);
nodes.finishPomodoroBtn.addEventListener("click", finishPomodoro);
nodes.resetPomodoroBtn.addEventListener("click", setPomodoroDuration);
nodes.reviewDate.addEventListener("change", loadReview);
nodes.reviewForm.addEventListener("submit", saveReview);

document.querySelectorAll(".close-modal").forEach((button) => {
  button.addEventListener("click", () => closeModal(document.querySelector(`#${button.dataset.close}`)));
});

document.querySelectorAll(".modal-layer").forEach((layer) => {
  layer.addEventListener("click", (event) => {
    if (event.target === layer) closeModal(layer);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal(nodes.notesModal);
    closeModal(nodes.gameModal);
    closeModal(nodes.relaxGameModal);
    closeModal(nodes.pomodoroModal);
    closeModal(nodes.reviewModal);
    closeModal(nodes.backupModal);
    closeModal(nodes.todayReminderModal);
  }
});

setupNote();
setupGame();
resetRelaxGameLobby();
setPomodoroDuration();
setupEntryThemes();
setupFeatureNavigation();
setupMistakes();
startEntryExperience();
renderDailyEnglish();
render();

