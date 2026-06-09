const STORAGE_KEY = "smart-study-planner-v1";
const DONE_KEY = "smart-study-done-v1";
const FOCUS_KEY = "smart-study-focus-v1";
const REVIEW_KEY = "smart-study-review-v1";

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
  importSearchForm: document.querySelector("#importSearchForm"),
  importQuery: document.querySelector("#importQuery"),
  importStatus: document.querySelector("#importStatus"),
  importResults: document.querySelector("#importResults"),
  resetBtn: document.querySelector("#resetBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  exportTodayImageBtn: document.querySelector("#exportTodayImageBtn"),
  generateAllBtn: document.querySelector("#generateAllBtn"),
  notesBtn: document.querySelector("#notesBtn"),
  gameBtn: document.querySelector("#gameBtn"),
  pomodoroBtn: document.querySelector("#pomodoroBtn"),
  reviewBtn: document.querySelector("#reviewBtn"),
  notesModal: document.querySelector("#notesModal"),
  gameModal: document.querySelector("#gameModal"),
  pomodoroModal: document.querySelector("#pomodoroModal"),
  reviewModal: document.querySelector("#reviewModal"),
  noteBg: document.querySelector("#noteBg"),
  noteFont: document.querySelector("#noteFont"),
  noteSize: document.querySelector("#noteSize"),
  noteColor: document.querySelector("#noteColor"),
  noteText: document.querySelector("#noteText"),
  englishWords: document.querySelector("#englishWords"),
  chineseWords: document.querySelector("#chineseWords"),
  gameScore: document.querySelector("#gameScore"),
  gameMessage: document.querySelector("#gameMessage"),
  restartGameBtn: document.querySelector("#restartGameBtn"),
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
  reviewPriority: document.querySelector("#reviewPriority"),
  reviewBlocker: document.querySelector("#reviewBlocker"),
  reviewMinimum: document.querySelector("#reviewMinimum")
};

const NOTE_KEY = "smart-study-note-v1";
const wordPairs = [
  { en: "review", zh: "复习" },
  { en: "focus", zh: "专注" },
  { en: "effort", zh: "努力" },
  { en: "habit", zh: "习惯" },
  { en: "progress", zh: "进步" },
  { en: "memory", zh: "记忆" }
];
let selectedEnglish = null;
let selectedChinese = null;
let matchedCount = 0;

let doneState = loadDoneState();
let focusState = loadObject(FOCUS_KEY);
let reviewState = loadObject(REVIEW_KEY);
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

function addFocusMinutes(subject, minutes) {
  const key = isoDate(new Date());
  focusState[key] ||= {};
  focusState[key][subject] = (focusState[key][subject] || 0) + minutes;
  saveFocusState();
  renderHeatmap();
}

function getActiveBook() {
  return state.books.find((book) => book.id === activeId) || state.books[0];
}

function selectedLibraryYear() {
  return currentYearFilter === "all" ? today.getFullYear() : Number(currentYearFilter);
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
  const visibleBooks =
    currentYearFilter === "all"
      ? state.books
      : state.books.filter((book) => String(book.year) === String(currentYearFilter));
  nodes.bookCount.textContent = visibleBooks.length;

  if (!visibleBooks.some((book) => book.id === activeId) && visibleBooks.length) {
    activeId = visibleBooks[0].id;
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
      phase < 0.45
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
  state.books.push(book);
  activeId = book.id;
  saveState();
  render();
  document.querySelector(".planner").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderImportResults(results, query) {
  nodes.importResults.innerHTML = "";

  if (!results.length) {
    nodes.importStatus.textContent = "没有搜到匹配结果，可以用当前关键词手动创建教材。";
    const fallback = document.createElement("article");
    fallback.className = "import-card";
    fallback.innerHTML = `
      <h3>${query}</h3>
      <p>使用关键词生成一个可编辑教材，并自动填入通用章节模板。</p>
      <button class="primary-btn" type="button">导入</button>
    `;
    fallback.querySelector("button").addEventListener("click", () => importBook(createBookFromTitle(query, { year: selectedLibraryYear() })));
    nodes.importResults.append(fallback);
    return;
  }

  nodes.importStatus.textContent = `找到 ${results.length} 个结果，选择最接近的一本导入。`;
  results.forEach((item) => {
    const author = item.author_name?.slice(0, 2).join("、") || "作者未知";
    const year = item.first_publish_year ? `${item.first_publish_year} 年` : "年份未知";
    const subject = item.subject?.slice(0, 3).join("、") || "暂无分类";
    const title = item.title || query;
    const card = document.createElement("article");
    card.className = "import-card";
    card.innerHTML = `
      <h3>${title}</h3>
      <p>${author} · ${year}</p>
      <p>${subject}</p>
      <button class="primary-btn" type="button">导入</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      importBook(
        createBookFromTitle(title, {
          year: selectedLibraryYear(),
          subject,
          goal: `目标：围绕《${title}》建立章节框架，按难度逐步完成复习与检测。`
        })
      );
    });
    nodes.importResults.append(card);
  });
}

function render() {
  renderBooks();
  const book = getActiveBook();
  renderForm(book);
  renderMethod(book);
  renderPlan(book);
  renderPomodoroSubjects();
  renderHeatmap();
}

function openModal(modal) {
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
}

function loadNote() {
  try {
    return JSON.parse(localStorage.getItem(NOTE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveNote() {
  localStorage.setItem(
    NOTE_KEY,
    JSON.stringify({
      text: nodes.noteText.value,
      bg: nodes.noteBg.value,
      font: nodes.noteFont.value,
      size: nodes.noteSize.value,
      color: nodes.noteColor.value
    })
  );
}

function applyNoteStyle() {
  nodes.noteText.classList.remove("note-white", "note-black", "note-beige");
  nodes.noteText.classList.add(`note-${nodes.noteBg.value}`);
  nodes.noteText.style.fontFamily = nodes.noteFont.value;
  nodes.noteText.style.fontSize = `${nodes.noteSize.value}px`;
  nodes.noteText.style.color = nodes.noteColor.value;
  saveNote();
}

function setupNote() {
  const note = loadNote();
  nodes.noteText.value = note.text || "";
  nodes.noteBg.value = note.bg || "white";
  nodes.noteFont.value = note.font || "'Microsoft YaHei', sans-serif";
  nodes.noteSize.value = note.size || "16";
  nodes.noteColor.value = note.color || "#18201f";
  applyNoteStyle();

  nodes.noteBg.addEventListener("change", () => {
    const defaults = { white: "#18201f", black: "#f6f7f3", beige: "#2d261d" };
    nodes.noteColor.value = defaults[nodes.noteBg.value];
    applyNoteStyle();
  });
  [nodes.noteFont, nodes.noteSize, nodes.noteColor].forEach((control) => {
    control.addEventListener("input", applyNoteStyle);
    control.addEventListener("change", applyNoteStyle);
  });
  nodes.noteText.addEventListener("input", saveNote);
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function resetSelection() {
  selectedEnglish?.classList.remove("selected");
  selectedChinese?.classList.remove("selected");
  selectedEnglish = null;
  selectedChinese = null;
}

function checkMatch() {
  if (!selectedEnglish || !selectedChinese) return;

  if (selectedEnglish.dataset.pair === selectedChinese.dataset.pair) {
    selectedEnglish.classList.add("matched");
    selectedChinese.classList.add("matched");
    selectedEnglish.disabled = true;
    selectedChinese.disabled = true;
    matchedCount += 1;
    nodes.gameScore.textContent = `得分：${matchedCount}`;
    nodes.gameMessage.textContent =
      matchedCount === wordPairs.length ? "全部配对完成，今天的状态很在线。" : "配对正确，继续下一组。";
    selectedEnglish = null;
    selectedChinese = null;
    return;
  }

  nodes.gameMessage.textContent = "这组不匹配，再观察一下意思。";
  setTimeout(resetSelection, 450);
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

function setupGame() {
  nodes.englishWords.innerHTML = "";
  nodes.chineseWords.innerHTML = "";
  matchedCount = 0;
  selectedEnglish = null;
  selectedChinese = null;
  nodes.gameScore.textContent = "得分：0";
  nodes.gameMessage.textContent = "点击一个英文，再点击对应中文。";

  shuffle(wordPairs).forEach((pair) => {
    nodes.englishWords.append(createMatchCard(pair.en, pair.en, "en"));
  });
  shuffle(wordPairs).forEach((pair) => {
    nodes.chineseWords.append(createMatchCard(pair.zh, pair.en, "zh"));
  });
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
  const key = isoDate(new Date());
  const review = reviewState[key] || {};
  nodes.reviewPriority.value = review.priority || "";
  nodes.reviewBlocker.value = review.blocker || "";
  nodes.reviewMinimum.value = review.minimum || "";
}

function saveReview(event) {
  event.preventDefault();
  const key = isoDate(new Date());
  reviewState[key] = {
    priority: nodes.reviewPriority.value.trim(),
    blocker: nodes.reviewBlocker.value.trim(),
    minimum: nodes.reviewMinimum.value.trim()
  };
  saveReviewState();
  closeModal(nodes.reviewModal);
}

nodes.form.addEventListener("submit", (event) => {
  event.preventDefault();
  const book = getActiveBook();
  book.title = nodes.titleInput.value.trim();
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

  importBook(createBookFromTitle(title, { year: selectedLibraryYear() }));
  nodes.quickTitle.value = "";
});

nodes.yearFilter.addEventListener("change", () => {
  currentYearFilter = nodes.yearFilter.value;
  render();
});

nodes.importSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = nodes.importQuery.value.trim();
  if (!query) return;

  nodes.importStatus.textContent = "正在联网搜索教材...";
  nodes.importResults.innerHTML = "";

  try {
    const encodedQuery = encodeURIComponent(query);
    const isLocalServer = ["localhost", "127.0.0.1"].includes(location.hostname);
    const searchUrls = [];

    if (isLocalServer && location.protocol !== "file:") {
      searchUrls.push(`/api/search-books?q=${encodedQuery}`);
    }

    if (location.protocol !== "file:") {
      searchUrls.push(`/.netlify/functions/search-books?q=${encodedQuery}`);
    }

    searchUrls.push(`https://openlibrary.org/search.json?title=${encodedQuery}&limit=9&fields=title,author_name,first_publish_year,subject`);

    let data = null;
    for (const url of searchUrls) {
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        data = await response.json();
        break;
      } catch {
        // Try the next search route before showing the offline fallback.
      }
    }

    if (!data) throw new Error("search failed");
    renderImportResults(data.docs || [], query);
  } catch {
    nodes.importStatus.textContent = "联网搜索暂时不可用，可以先用关键词导入本地教材模板。";
    renderImportResults([], query);
  }
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
nodes.notesBtn.addEventListener("click", () => openModal(nodes.notesModal));
nodes.gameBtn.addEventListener("click", () => {
  setupGame();
  openModal(nodes.gameModal);
});
nodes.restartGameBtn.addEventListener("click", setupGame);
nodes.pomodoroBtn.addEventListener("click", () => {
  renderPomodoroSubjects();
  setPomodoroDuration();
  openModal(nodes.pomodoroModal);
});
nodes.reviewBtn.addEventListener("click", () => {
  loadReview();
  openModal(nodes.reviewModal);
});
nodes.pomodoroMinutes.addEventListener("change", setPomodoroDuration);
nodes.startPomodoroBtn.addEventListener("click", startPomodoro);
nodes.pausePomodoroBtn.addEventListener("click", pausePomodoro);
nodes.finishPomodoroBtn.addEventListener("click", finishPomodoro);
nodes.resetPomodoroBtn.addEventListener("click", setPomodoroDuration);
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
    closeModal(nodes.pomodoroModal);
    closeModal(nodes.reviewModal);
  }
});

setupNote();
setupGame();
setPomodoroDuration();
render();
