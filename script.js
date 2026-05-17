const GOOGLE_SHEET_CSV_URL = "这里粘贴我的 Google Sheets CSV 链接";

const GUN_TYPES = ["全部", "突击步枪", "冲锋枪", "射手步枪", "狙击步枪", "轻机枪", "霰弹枪", "手枪"];
const FAVORITES_KEY = "delta_firezone_gunsmith_favorites";

const fallbackData = [
  {
    id: "001",
    gun_type: "突击步枪",
    weapon: "M4A1",
    build_name: "低成本｜稳定过渡",
    code: "M4A1-FIRE-LOW-001",
    note: "适合刚开始囤物资时用，压枪轻松。",
    tags: "低成本,稳定,新手",
    sort: "10",
    enabled: "是",
    updated_at: "2026-05-17",
  },
  {
    id: "002",
    gun_type: "突击步枪",
    weapon: "M4A1",
    build_name: "中价位｜低后坐通用",
    code: "M4A1-FIRE-MID-002",
    note: "近中距离都能打，比较万金油。",
    tags: "中价位,通用,低后坐",
    sort: "20",
    enabled: "是",
    updated_at: "2026-05-17",
  },
  {
    id: "003",
    gun_type: "突击步枪",
    weapon: "AKM",
    build_name: "低成本｜架点稳一点",
    code: "AKM-FIRE-LOW-003",
    note: "优先控制后坐，适合稳扎稳打。",
    tags: "低成本,架点,稳定",
    sort: "30",
    enabled: "是",
    updated_at: "2026-05-17",
  },
  {
    id: "004",
    gun_type: "突击步枪",
    weapon: "AKM",
    build_name: "满改｜极限稳压",
    code: "AKM-FIRE-FULL-004",
    note: "预算充足时用，手感更沉稳。",
    tags: "满改,稳压,中远距离",
    sort: "40",
    enabled: "是",
    updated_at: "2026-05-17",
  },
  {
    id: "005",
    gun_type: "冲锋枪",
    weapon: "MP5",
    build_name: "近战｜高机动跑图",
    code: "MP5-FIRE-RUN-005",
    note: "适合摸点和室内近战。",
    tags: "近战,高机动,跑图",
    sort: "50",
    enabled: "是",
    updated_at: "2026-05-17",
  },
  {
    id: "006",
    gun_type: "冲锋枪",
    weapon: "MP5",
    build_name: "低成本｜新手冲锋",
    code: "MP5-FIRE-LOW-006",
    note: "",
    tags: "低成本,新手",
    sort: "60",
    enabled: "是",
    updated_at: "2026-05-17",
  },
  {
    id: "007",
    gun_type: "射手步枪",
    weapon: "SVD",
    build_name: "架点｜中远距离稳定",
    code: "SVD-FIRE-MID-007",
    note: "适合队友推进时补枪。",
    tags: "架点,中远距离,稳定",
    sort: "70",
    enabled: "是",
    updated_at: "2026-05-17",
  },
  {
    id: "008",
    gun_type: "狙击步枪",
    weapon: "M700",
    build_name: "远点｜轻装偷人",
    code: "M700-FIRE-SNIPE-008",
    note: "轻量思路，方便转点。",
    tags: "远点,轻装,狙击",
    sort: "80",
    enabled: "是",
    updated_at: "2026-05-17",
  },
];

let allRows = [];
let currentType = "全部";
let currentSearch = "";
let favoritesOnly = false;
let favoriteIds = loadFavorites();

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initFilters();
  bindEvents();
  loadData();
});

function cacheElements() {
  elements.typeFilter = document.querySelector("#typeFilter");
  elements.searchInput = document.querySelector("#searchInput");
  elements.favoritesOnly = document.querySelector("#favoritesOnly");
  elements.copyVisibleBtn = document.querySelector("#copyVisibleBtn");
  elements.content = document.querySelector("#content");
  elements.emptyState = document.querySelector("#emptyState");
  elements.notice = document.querySelector("#notice");
  elements.dataStatus = document.querySelector("#dataStatus");
  elements.dataUpdated = document.querySelector("#dataUpdated");
  elements.lastLoaded = document.querySelector("#lastLoaded");
  elements.manualCopyDialog = document.querySelector("#manualCopyDialog");
  elements.manualCopyText = document.querySelector("#manualCopyText");
}

function initFilters() {
  elements.typeFilter.innerHTML = "";
  GUN_TYPES.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-button";
    button.textContent = type;
    button.dataset.type = type;
    if (type === currentType) {
      button.classList.add("active");
    }
    elements.typeFilter.appendChild(button);
  });
}

function bindEvents() {
  elements.typeFilter.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-type]");
    if (!button) return;
    currentType = button.dataset.type;
    document.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    render();
  });

  elements.searchInput.addEventListener("input", (event) => {
    currentSearch = event.target.value.trim().toLowerCase();
    render();
  });

  elements.favoritesOnly.addEventListener("change", (event) => {
    favoritesOnly = event.target.checked;
    render();
  });

  elements.copyVisibleBtn.addEventListener("click", () => {
    const visibleRows = getVisibleRows();
    if (!visibleRows.length) {
      showNotice("当前没有可复制的可见方案。");
      return;
    }
    const text = visibleRows
      .map((row) => `${row.weapon}｜${row.build_name}\n${row.code}`)
      .join("\n\n");
    copyText(text, elements.copyVisibleBtn, "已复制全部");
  });

  elements.content.addEventListener("click", (event) => {
    const copyButton = event.target.closest("[data-copy-id]");
    if (copyButton) {
      const row = allRows.find((item) => item.id === copyButton.dataset.copyId);
      if (row) copyText(row.code, copyButton, "已复制");
      return;
    }

    const favoriteButton = event.target.closest("[data-favorite-id]");
    if (favoriteButton) {
      toggleFavorite(favoriteButton.dataset.favoriteId);
      render();
    }
  });
}

async function loadData() {
  let rows = [];
  let loadedFromOnline = false;
  const url = GOOGLE_SHEET_CSV_URL.trim();

  if (url && !url.includes("这里粘贴")) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const csvText = await response.text();
      rows = parseCsv(csvText);
      loadedFromOnline = true;
    } catch (error) {
      rows = fallbackData;
      showNotice("在线数据加载失败，已使用本地备用数据");
      console.warn("CSV load failed:", error);
    }
  } else {
    rows = fallbackData;
    showNotice("还没有填写 Google Sheets CSV 链接，当前使用本地备用数据");
  }

  allRows = normalizeRows(rows).filter((row) => isEnabled(row.enabled));
  elements.dataStatus.textContent = loadedFromOnline ? "在线数据已加载" : "本地备用数据已加载";
  updateMeta();
  render();
}

function normalizeRows(rows) {
  return rows.map((row, index) => {
    const normalized = {
      id: String(row.id || `row-${index + 1}`).trim(),
      gun_type: String(row.gun_type || "").trim(),
      weapon: String(row.weapon || "").trim(),
      build_name: String(row.build_name || "").trim(),
      code: String(row.code || "").trim(),
      note: String(row.note || "").trim(),
      tags: String(row.tags || "").trim(),
      sort: parseSort(row.sort),
      enabled: String(row.enabled || "").trim(),
      updated_at: String(row.updated_at || "").trim(),
    };
    normalized.searchText = [
      normalized.weapon,
      normalized.build_name,
      normalized.note,
      normalized.tags,
    ].join(" ").toLowerCase();
    normalized.tagList = splitTags(normalized.tags);
    return normalized;
  }).filter((row) => row.weapon && row.build_name && row.code);
}

function parseSort(value) {
  const parsed = Number.parseInt(String(value || "").trim(), 10);
  return Number.isFinite(parsed) ? parsed : 9999;
}

function isEnabled(value) {
  return ["是", "yes", "true", "1"].includes(String(value || "").trim().toLowerCase());
}

function splitTags(tags) {
  return String(tags || "")
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getVisibleRows() {
  return allRows
    .filter((row) => currentType === "全部" || row.gun_type === currentType)
    .filter((row) => !currentSearch || row.searchText.includes(currentSearch))
    .filter((row) => !favoritesOnly || favoriteIds.has(row.id))
    .sort((a, b) => a.sort - b.sort || a.weapon.localeCompare(b.weapon, "zh-Hans-CN"));
}

function render() {
  const visibleRows = getVisibleRows();
  const groups = groupByWeapon(visibleRows);
  elements.content.innerHTML = "";
  elements.emptyState.hidden = groups.length > 0;

  groups.forEach((group) => {
    elements.content.appendChild(createWeaponCard(group));
  });
}

function groupByWeapon(rows) {
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.weapon)) {
      map.set(row.weapon, {
        weapon: row.weapon,
        gun_type: row.gun_type,
        minSort: row.sort,
        rows: [],
      });
    }
    const group = map.get(row.weapon);
    group.rows.push(row);
    group.minSort = Math.min(group.minSort, row.sort);
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      rows: group.rows.sort((a, b) => a.sort - b.sort || a.build_name.localeCompare(b.build_name, "zh-Hans-CN")),
    }))
    .sort((a, b) => a.minSort - b.minSort || a.weapon.localeCompare(b.weapon, "zh-Hans-CN"));
}

function createWeaponCard(group) {
  const card = document.createElement("article");
  card.className = "weapon-card";

  const head = document.createElement("div");
  head.className = "weapon-head";
  head.innerHTML = `
    <div class="weapon-title">
      <h2>${escapeHtml(group.weapon)}</h2>
      <span class="gun-type">${escapeHtml(group.gun_type)}</span>
    </div>
    <div class="build-count">${group.rows.length} 个方案</div>
  `;

  const list = document.createElement("div");
  list.className = "build-list";
  group.rows.forEach((row) => {
    list.appendChild(createBuildCard(row));
  });

  card.appendChild(head);
  card.appendChild(list);
  return card;
}

function createBuildCard(row) {
  const card = document.createElement("div");
  card.className = "build-card";

  const favoriteText = favoriteIds.has(row.id) ? "★" : "☆";
  const noteHtml = row.note ? `<p class="note">${escapeHtml(row.note)}</p>` : "";
  const tagsHtml = row.tagList.length
    ? `<div class="tag-list">${row.tagList.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";

  card.innerHTML = `
    <div class="build-main">
      <div>
        <div class="build-name-row">
          <button class="favorite-button" type="button" data-favorite-id="${escapeHtml(row.id)}" aria-label="收藏或取消收藏">${favoriteText}</button>
          <h3 class="build-name">${escapeHtml(row.build_name)}</h3>
        </div>
        ${noteHtml}
        ${tagsHtml}
        <div class="build-meta">更新时间：${escapeHtml(row.updated_at || "-")}</div>
      </div>
      <button class="copy-button" type="button" data-copy-id="${escapeHtml(row.id)}">复制改枪码</button>
    </div>
  `;
  return card;
}

async function copyText(text, button, successText) {
  const originalText = button.textContent;
  try {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error("Clipboard API unavailable");
    }
    await navigator.clipboard.writeText(text);
    button.textContent = successText;
    button.classList.add("copied");
    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
    }, 1200);
  } catch (error) {
    showManualCopy(text);
  }
}

function showManualCopy(text) {
  elements.manualCopyText.value = text;
  if (typeof elements.manualCopyDialog.showModal === "function") {
    elements.manualCopyDialog.showModal();
    elements.manualCopyText.focus();
    elements.manualCopyText.select();
  } else {
    window.prompt("复制失败，请手动复制：", text);
  }
}

function toggleFavorite(id) {
  if (favoriteIds.has(id)) {
    favoriteIds.delete(id);
  } else {
    favoriteIds.add(id);
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoriteIds)));
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function showNotice(message) {
  elements.notice.textContent = message;
  elements.notice.hidden = false;
}

function updateMeta() {
  const dates = allRows.map((row) => row.updated_at).filter(Boolean).sort();
  const latest = dates.length ? dates[dates.length - 1] : "-";
  const loadedTime = new Date().toLocaleString("zh-CN", { hour12: false });
  elements.dataUpdated.textContent = `数据更新时间：${latest}`;
  elements.lastLoaded.textContent = `最后加载时间：${loadedTime}`;
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      continue;
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell !== "")) {
    rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows.shift().map((header) => header.trim());
  return rows
    .filter((cells) => cells.some((cell) => cell.trim() !== ""))
    .map((cells) => {
      const item = {};
      headers.forEach((header, index) => {
        item[header] = cells[index] ?? "";
      });
      return item;
    });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
