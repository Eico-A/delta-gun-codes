const DATA_CSV_URL = "data.csv";

const GUN_TYPES = ["全部", "突击步枪", "冲锋枪", "射手步枪", "狙击步枪", "轻机枪", "霰弹枪", "手枪"];
const FAVORITES_KEY = "delta_firezone_gunsmith_favorites_v2";

const fallbackData = [
  {
    "枪械类型": "突击步枪",
    "枪名": "M4A1",
    "方案名": "低成本｜稳定过渡",
    "改枪码": "这里放改枪码",
    "备注": "便宜够用",
    "是否显示": "是",
  },
  {
    "枪械类型": "突击步枪",
    "枪名": "M4A1",
    "方案名": "满改｜极限稳压",
    "改枪码": "这里放改枪码",
    "备注": "贵但很稳",
    "是否显示": "是",
  },
  {
    "枪械类型": "冲锋枪",
    "枪名": "MP5",
    "方案名": "近战｜高机动跑图",
    "改枪码": "这里放改枪码",
    "备注": "贴脸舒服",
    "是否显示": "是",
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
  let loadedFromCsv = false;

  try {
    const response = await fetch(DATA_CSV_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const csvText = await response.text();
    rows = parseCsv(csvText);
    loadedFromCsv = true;
  } catch (error) {
    rows = fallbackData;
    showNotice("data.csv 加载失败，已使用本地备用数据。部署到 GitHub Pages 后会正常读取同目录 data.csv。");
    console.warn("data.csv load failed:", error);
  }

  allRows = normalizeRows(rows).filter((row) => isVisible(row.visible));
  elements.dataStatus.textContent = loadedFromCsv ? "数据来源：data.csv" : "数据来源：本地备用数据";
  elements.dataUpdated.textContent = `可显示方案：${allRows.length} 条`;
  updateMeta();
  render();
}

function normalizeRows(rows) {
  return rows
    .map((row, index) => {
      const normalized = {
        id: stableId(row, index),
        gun_type: String(row["枪械类型"] || "").trim(),
        weapon: String(row["枪名"] || "").trim(),
        build_name: String(row["方案名"] || "").trim(),
        code: String(row["改枪码"] || "").trim(),
        note: String(row["备注"] || "").trim(),
        visible: String(row["是否显示"] || "").trim(),
        order: index,
      };
      normalized.searchText = [
        normalized.gun_type,
        normalized.weapon,
        normalized.build_name,
        normalized.note,
      ].join(" ").toLowerCase();
      return normalized;
    })
    .filter((row) => row.gun_type && row.weapon && row.build_name && row.code);
}

function stableId(row, index) {
  const raw = [
    row["枪械类型"] || "",
    row["枪名"] || "",
    row["方案名"] || "",
    row["改枪码"] || "",
    index,
  ].join("|");
  return simpleHash(raw);
}

function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  return `row-${Math.abs(hash)}`;
}

function isVisible(value) {
  return String(value || "").trim() === "是";
}

function getVisibleRows() {
  return allRows
    .filter((row) => currentType === "全部" || row.gun_type === currentType)
    .filter((row) => !currentSearch || row.searchText.includes(currentSearch))
    .filter((row) => !favoritesOnly || favoriteIds.has(row.id))
    .sort((a, b) => a.order - b.order);
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
        minOrder: row.order,
        rows: [],
      });
    }
    const group = map.get(row.weapon);
    group.rows.push(row);
    group.minOrder = Math.min(group.minOrder, row.order);
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      rows: group.rows.sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.minOrder - b.minOrder);
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

  card.innerHTML = `
    <div class="build-main">
      <div>
        <div class="build-name-row">
          <button class="favorite-button" type="button" data-favorite-id="${escapeHtml(row.id)}" aria-label="收藏或取消收藏">${favoriteText}</button>
          <h3 class="build-name">${escapeHtml(row.build_name)}</h3>
        </div>
        ${noteHtml}
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
  } catch {
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
  const loadedTime = new Date().toLocaleString("zh-CN", { hour12: false });
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
