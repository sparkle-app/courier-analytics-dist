// =============================================================================
// КОНЦЕПТ АНАЛИТИКИ ДОХОДА КУРЬЕРА (v14.12.4) — ЕДИНЫЙ КОНВЕЙЕР ДЕМО И ИМПОРТА (script.js)
// Оптимизированная и модульная версия с гранулярным рендерингом и кэшированием
// =============================================================================

'use strict';

// Единая ставка налога (НПД) и фиксированная ставка платного ожидания (3 ₽/мин).
const TAX_RATE = 0.06;
const TAX_PCT_LABEL = `${Math.round(TAX_RATE * 100)}%`;
const taxOf = amount => Math.round(Number(amount || 0) * TAX_RATE);
const WAIT_RUB_PER_MIN = 3;

// -----------------------------------------------------------------------------
// 1. ХЕЛПЕРЫ И ДОСТУП К DOM
// -----------------------------------------------------------------------------

const $ = id => document.getElementById(id);

/**
 * Кэш часто используемых статических элементов DOM для минимизации layout thrashing
 */
const dom = {
  allTimeHourlyProfit:      $('allTimeHourlyProfit'),
  goalsStatusLabel:         $('goalsStatusLabel'),
  switchGrossNet:           $('switchGrossNet'),
  switchSumHourly:          $('switchSumHourly'),
  switchChartTable:         $('switchChartTable'),
  lblGross:                 $('lblGross'),
  lblNet:                   $('lblNet'),
  lblSum:                   $('lblSum'),
  lblHourly:                $('lblHourly'),
  lblChart:                 $('lblChart'),
  lblTable:                 $('lblTable'),
  block1Title:              $('block1Title'),
  chartViewContainer:       $('chartViewContainer'),
  tableViewContainer:       $('tableViewContainer'),
  barChartCanvas:           $('barChartCanvas'),
  selectedBarDetails:       $('selectedBarDetails'),
  detailedTableHead:        $('detailedTableHead'),
  detailedTableBody:        $('detailedTableBody'),
  detailedTableFoot:        $('detailedTableFoot'),
  legendSurgeItem:          $('legendSurgeItem'),
  legendRatingItem:         $('legendRatingItem'),
  legendBonusesItem:        $('legendBonusesItem'),
  legendGoalsItem:          $('legendGoalsItem'),
  legendGrossBg:            $('legendGrossBg'),
  legValOrders:             $('legValOrders'),
  legValSurge:              $('legValSurge'),
  legValRating:             $('legValRating'),
  legValBonuses:            $('legValBonuses'),
  legValGoals:              $('legValGoals'),
  legValTips:               $('legValTips'),
  btnToggleBenchmarks:      $('btnToggleBenchmarks'),
  benchmarksDot:            $('benchmarksDot'),
  benchmarksLabel:          $('benchmarksLabel'),
  chartLegendContainer:     $('chartLegendContainer'),
  legendTipsItem:           $('legendTipsItem'),
  btnWeather:               $('btnWeather'),
  heatUnitSwitchContainer:  $('heatUnitSwitchContainer'),
  btnDistrictSeasonContainer: $('btnDistrictSeasonContainer'),
  lblUnitPct:               $('lblUnitPct'),
  lblUnitRub:               $('lblUnitRub'),
  block2Title:              $('block2Title'),
  currentDistrictSeasonSub: $('currentDistrictSeasonSub'),
  heatmapTableBody:         $('heatmapTableBody'),
  selectedSlotsCounter:     $('selectedSlotsCounter'),
  btnClearSlots:            $('btnClearSlots'),
  plannedProfitEstimate:    $('plannedProfitEstimate'),
  planningActionContainer:  $('planningActionContainer'),
  blocksSpoilerWrapper:     $('blocksSpoilerWrapper'),
  btnToggleBlocks2and3:     $('btnToggleBlocks2and3'),
  lblSpoilerText:           $('lblSpoilerText'),
  spoilerChevronIcon:       $('spoilerChevronIcon'),
  areaBlock2:               $('areaBlock2'),
  areaBlock3:               $('areaBlock3'),
  districtListUnitHint:     $('districtListUnitHint'),
  districtListContainer:    $('districtListContainer'),
  compareTableHead:         $('compareTableHead'),
  compareTableBody:         $('compareTableBody'),
  compareTableFoot:         $('compareTableFoot'),
  chkIncludeGoals:          $('chkIncludeGoals'),
  totalWeeklyExpenseBadge:  $('totalWeeklyExpenseBadge'),
  expenseSlidersContainer:  $('expenseSlidersContainer'),
  addExpenseForm:           $('addExpenseForm'),
  newExpenseNameInput:      $('newExpenseNameInput'),
  reorderableColumnsList:   $('reorderableColumnsList'),
  realMapModal:             $('realMapModal'),
  mapSelectedDistrictName:  $('mapSelectedDistrictName'),
  planSlotsModal:           $('planSlotsModal'),
  planModalTransport:       $('planModalTransport'),
  planModalDistrict:        $('planModalDistrict'),
  planModalTotal:           $('planModalTotal'),
  planModalAvg:             $('planModalAvg'),
  planModalSlotsList:       $('planModalSlotsList'),
  forecastInfoModal:        $('forecastInfoModal'),
  expenseInfoModal:         $('expenseInfoModal'),
  expenseInfoTitle:         $('expenseInfoTitle'),
  expenseInfoSubtitle:      $('expenseInfoSubtitle'),
  expenseInfoBody:          $('expenseInfoBody'),
  expenseInfoFooter:        $('expenseInfoFooter'),
  toastBox:                 $('toastBox'),
  toastText:                $('toastText'),
  fileLoadingOverlay:       $('fileLoadingOverlay'),
  fileLoadingText:          $('fileLoadingText'),
  btnColorTheme:            $('btnColorTheme'),
  btnLayoutMode:            $('btnLayoutMode'),
  lblLayoutMode:            $('lblLayoutMode'),
  lblLayoutIcon:            $('lblLayoutIcon'),
  userDataFileInput:        $('userDataFileInput'),
  btnImportData:            $('btnImportData'),
  btnResetData:             $('btnResetData'),
  dataStatusBadge:          $('dataStatusBadge'),
  topBannerContainer:       $('topBannerContainer'),
  layoutContainer:          $('layoutContainer'),
  screenMain:               $('screenMain'),
  screenMiddleSpec:         $('screenMiddleSpec'),
  screenSettings:           $('screenSettings'),
  authorTipModal:           $('authorTipModal'),
  btnAuthorTipDesktop:      $('btnAuthorTipDesktop'),
  btnAuthorTipMobile:       $('btnAuthorTipMobile'),
  manualEditorModal:        $('manualEditorModal'),
  manualEditorTableBody:    $('manualEditorTableBody'),
  manualEditorTransportFilter: $('manualEditorTransportFilter'),
  manualEditorSearchInput:  $('manualEditorSearchInput'),
  manualEditorRowCount:     $('manualEditorRowCount'),
  manualEditorEmptyNotice:  $('manualEditorEmptyNotice')
};

/**
 * Защита от XSS при вставке пользовательских строк (напр. названий расходов)
 */
function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Форматирование чисел с разделением тысяч пробелом (15 240)
 * Надежная защита от NaN, Infinity, -0 и некорректных типов данных
 */
function formatNum(n) {
  const val = Number(n);
  if (!Number.isFinite(val)) return '0';
  const rounded = Math.round(val);
  if (rounded === 0) return '0';            // -0, -0.4 и 0.4 -> «0», а не «-0»
  const sign = rounded < 0 ? '-' : '';
  const absStr = Math.abs(rounded).toString();
  return sign + absStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Компактный формат для диаграмм (14.2к / 500 / -12.5к)
 * Надежная защита от NaN, Infinity и краевых значений
 */
function formatCompact(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return '0';
  const abs = Math.abs(num);
  if (Math.round(abs) === 0) return '0';
  const sign = num < 0 ? '-' : '';
  if (Math.round(abs) >= 1000000) return sign + (abs / 1000000).toFixed(1) + 'М';
  if (Math.round(abs) >= 10000) return sign + (abs / 1000).toFixed(1) + 'к';
  return sign + formatNum(abs);
}

// -----------------------------------------------------------------------------
// 2. ДАННЫЕ И КОНФИГУРАЦИЯ
// -----------------------------------------------------------------------------

const defaultTransportExpenses = {
  walk: [
    { id: 'rent', name: 'Аренда', value: 0, max: 25000 },
    { id: 'food', name: 'Еда', value: 0, max: 25000 }
  ],
  bike: [
    { id: 'rent', name: 'Аренда', value: 0, max: 25000 },
    { id: 'food', name: 'Еда', value: 0, max: 25000 }
  ],
  ebike: [
    { id: 'rent', name: 'Аренда', value: 0, max: 25000 },
    { id: 'food', name: 'Еда', value: 0, max: 25000 }
  ],
  car: [
    { id: 'rent', name: 'Аренда', value: 7800, max: 25000 },
    { id: 'food', name: 'Еда', value: 1800, max: 25000 }
  ]
};

const cloneExpenses = () => (typeof structuredClone === 'function'
  ? structuredClone(defaultTransportExpenses)
  : JSON.parse(JSON.stringify(defaultTransportExpenses)));

const transportMeta = {
  walk:  { label: 'Пеший',       icon: '🚶', baseHourlyRub: 310, cityAvgGrossHr: 540 },
  bike:  { label: 'Вело',        icon: '🚲', baseHourlyRub: 390, cityAvgGrossHr: 680 },
  ebike: { label: 'Электровело', icon: '⚡', baseHourlyRub: 455, cityAvgGrossHr: 820 },
  car:   { label: 'Авто',        icon: '🚗', baseHourlyRub: 540, cityAvgGrossHr: 980 }
};

const districtsData = [
  {
    id: 'center_south',
    name: 'Центр-Юг (Деловой узел / Арка)',
    shortName: 'Центр-Юг',
    avgPct: 42,
    peakPct: 68,
    color: '#FCE000',
    polygon: [
      [54, 34], [56, 62], [41, 64],
      [34, 52], [36, 38], [45, 31]
    ]
  },
  {
    id: 'north_city',
    name: 'Север-Сити (Технопарк / Башня)',
    shortName: 'Север-Сити',
    avgPct: 46,
    peakPct: 74,
    color: '#38BDF8',
    polygon: [
      [82, 24], [84, 58], [62, 61],
      [56, 62], [54, 34], [64, 22]
    ]
  },
  {
    id: 'east_izh',
    name: 'Восток (Промзона / Парковый)',
    shortName: 'Восток',
    avgPct: 33,
    peakPct: 54,
    color: '#A855F7',
    polygon: [
      [76, 61], [78, 86], [52, 91],
      [35, 83], [41, 64], [56, 62]
    ]
  },
  {
    id: 'south_west',
    name: 'Юго-Запад (Кампус / Сады)',
    shortName: 'Юго-Запад',
    avgPct: 39,
    peakPct: 63,
    color: '#10B981',
    polygon: [
      [45, 31], [36, 38], [34, 52],
      [17, 56], [15, 24], [30, 14]
    ]
  }
];

const seasonMultipliers = {
  auto:   { label: 'Авто (4 нед.)', baseLabel: 'Авто', mult: 1.00 },
  summer: { label: 'Лето',          baseLabel: 'Лето', mult: 0.88 },
  autumn: { label: 'Осень',         baseLabel: 'Осень', mult: 1.06 },
  winter: { label: 'Зима',          baseLabel: 'Зима', mult: 1.22 },
  spring: { label: 'Весна',         baseLabel: 'Весна', mult: 0.96 }
};

const shortDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const fullDayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const shortMonthNamesMap = {
  'январь': 'Янв',
  'февраль': 'Фев',
  'март': 'Мар',
  'апрель': 'Апр',
  'май': 'Май',
  'июнь': 'Июн',
  'июль': 'Июл',
  'август': 'Авг',
  'сентябрь': 'Сен',
  'октябрь': 'Окт',
  'ноябрь': 'Ноя',
  'декабрь': 'Дек'
};

// -----------------------------------------------------------------------------
// 3. РЕАКТИВНОЕ СОСТОЯНИЕ И КЭШ (ЕДИНЫЙ ИСТОЧНИК ДЛЯ ДЕМО И ИМПОРТА)
// -----------------------------------------------------------------------------

const state = {
  lightMode: true,
  currentScreen: 'main',
  blocks2and3Expanded: false,

  isNet: true,
  isHourly: false,
  viewMode: 'chart',
  period: 'days',
  selectedBarIndex: 0,
  showBenchmarks: true,

  accountTransport: 'ebike',
  includeGoals: false,
  weekStartDay: 0, // 0=Пн .. 6=Вс
  selectedPreset: 'ebike',
  expandedDateKeys: new Set(),
  expandedOrderKeys: new Set(),
  footTotalsCollapsed: true,
  expensesByTransport: cloneExpenses(),
  get expenses() {
    return this.expensesByTransport[this.selectedPreset] || [];
  },

  tableColumns: [
    { key: 'date',               label: 'Дата',                 enabled: true },
    { key: 'dayOfWeek',          label: 'День недели',          enabled: true },
    { key: 'slotHours',          label: 'Длит. слота (ч)',      enabled: true },
    { key: 'ordersCount',        label: 'Кол-во заказов',       enabled: true },
    { key: 'ordersPerHr',        label: 'Заказов в час',        enabled: true },
    { key: 'transport',          label: 'Транспорт',            enabled: true },
    { key: 'grossTotal',         label: 'Начислено (до расх.)', enabled: true },
    { key: 'ordersCost',         label: 'Стоимость заказов',    enabled: true },
    { key: 'surgePct',           label: 'Доплата (спрос; %)',   enabled: true },
    { key: 'surgeRub',           label: 'Доплата (спрос)',      enabled: true },
    { key: 'ratingPct',          label: 'Доплата (рейтинг; %)', enabled: true },
    { key: 'ratingRub',          label: 'Доплата (рейтинг)',    enabled: true },
    { key: 'bonuses',            label: 'Бонусы',               enabled: true },
    { key: 'tax',                label: 'Налог',                enabled: true },
    { key: 'netProfit',          label: 'Прибыль (на руки)',    enabled: true },
    { key: 'profitPerHrNoBonus', label: 'Прибыль/час (без д/б)', enabled: true },
    { key: 'profitPerHr',        label: 'Прибыль в час',        enabled: true },
    { key: 'goals',              label: 'Цели',                 enabled: false },
    { key: 'tips',               label: 'Чаевые',               enabled: false },
    { key: 'adjustments',        label: 'Корректировки',        enabled: false },
    { key: 'expenses',           label: 'Расходы',              enabled: false }
  ],

  weatherBoost: false,
  heatUnitRub: false,
  season: 'auto',
  districtId: 'center_south',
  pendingMapDistrictId: null,
  disputedAdjustmentIds: new Set(),
  selectedSlotCells: [],
  compareMode: 'transport',

  layoutMode: 'phone', // 'phone' | 'pc'
  usingUserData: false,
  activeFileName: 'demo_data.json.gz',
  userDataFileName: '',
  activeOrders: [],
  activeDatasets: null,
  datasetCapabilities: {},
  demoCachedRawRows: null,
  demoReady: false,
  demoLoadMetrics: null,
  manualEditorRows: [],
  manualEditorDraftRows: null,
  manualEditorRowIdCounter: 1,

  // Синхронизация и облачное хранилище (v14.7.1, v14.12.0)
  syncMode: 'indexeddb', // 'session' | 'indexeddb' | 'yandex'
  yandexToken: null,
  yandexTokenExpiresAt: null,
  yandexSyncStatus: 'not_connected', // 'not_connected' | 'connected' | 'synced' | 'syncing' | 'offline' | 'expired' | 'forbidden'
  yandexLastSyncedAt: null,
  syncTimestamps: { orders: null, settings: null },
  tableFilters: {}
};

const isDemoMode = () => !state.usingUserData;
const getActiveDatasets = () => state.activeDatasets;
const getActiveOrders = () => state.activeOrders || [];
const getDatasetCapabilities = () => state.datasetCapabilities || {};

/**
 * Кэш обогащенных датасетов и матриц спроса для исключения избыточных вычислений
 */
const dataCache = {
  enriched: new Map(),
  heatmapBySeason: new Map(),
  allTimeProfit: null,
  invalidate() {
    this.enriched.clear();
    this.heatmapBySeason.clear();
    this.allTimeProfit = null;
  }
};

// -----------------------------------------------------------------------------
// 3.1. ПАРСИНГ И ОБРАБОТКА ПОЛЬЗОВАТЕЛЬСКИХ ДАННЫХ (EXCEL / CSV)
// -----------------------------------------------------------------------------

/**
 * Парсер времени из любого формата (HH:MM:SS, HH:MM, числовая доля дня Excel, Date)
 * Возвращает секунды от начала суток (0..86399)
 */
function parseTimeSecs(val) {
  if (val == null || val === '') return 0;
  if (val instanceof Date) {
    return val.getHours() * 3600 + val.getMinutes() * 60 + val.getSeconds();
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return 0;
    const frac = ((val % 1) + 1) % 1;
    return Math.round(frac * 86400) % 86400;
  }
  const str = String(val).trim();
  const timeMatch = str.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10) || 0;
    const m = parseInt(timeMatch[2], 10) || 0;
    const s = parseInt(timeMatch[3], 10) || 0;
    return ((h * 3600 + m * 60 + s) % 86400 + 86400) % 86400;
  }
  return 0;
}

/**
 * Парсер даты (YYYY-MM-DD, DD.MM.YYYY, DD.MM.YY, Excel serial date, Date)
 */
function parseDateInfo(val) {
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  let d = null;

  if (val instanceof Date && !isNaN(val.getTime())) {
    d = new Date(val.getTime() + 12 * 3600 * 1000);
  } else if (typeof val === 'number') {
    // Отсекаем мелкие числа (напр. 1..100), которые не являются датами Excel 2000+ годов
    if (val > 1000 && val < 2958466) {
      const serial = Math.floor(val);
      d = new Date(Math.round((serial - 25569) * 86400 * 1000) + 12 * 3600 * 1000);
    }
  } else if (typeof val === 'string') {
    const s = val.trim();
    const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
    const dotShortMatch = s.match(/^(\d{1,2})\.(\d{1,2})$/);
    const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (dotMatch) {
      const day = parseInt(dotMatch[1], 10);
      const month = parseInt(dotMatch[2], 10) - 1;
      let year = parseInt(dotMatch[3], 10);
      if (year < 100) year += 2000;
      d = new Date(year, month, day, 12, 0, 0);
      if (d.getDate() !== day || d.getMonth() !== month) d = null;
    } else if (dotShortMatch) {
      const day = parseInt(dotShortMatch[1], 10);
      const month = parseInt(dotShortMatch[2], 10) - 1;
      const year = new Date().getFullYear();
      d = new Date(year, month, day, 12, 0, 0);
      if (d.getDate() !== day || d.getMonth() !== month) d = null;
    } else if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      d = new Date(year, month, day, 12, 0, 0);
      if (d.getDate() !== day || d.getMonth() !== month) d = null;
    } else if (/[\/\-]/.test(s) && s.length >= 6) {
      const parsed = new Date(s);
      if (!isNaN(parsed.getTime())) {
        d = new Date(parsed.getTime() + 12 * 3600 * 1000);
      }
    }
  }

  const isValidDate = Boolean(d && !isNaN(d.getTime()) && d.getFullYear() >= 1990 && d.getFullYear() <= 2100);
  if (!isValidDate) {
    d = new Date();
  }

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const isoDate = `${y}-${m}-${day}`;
  const displayDate = `${day}.${m}`;
  const fullDisplayDate = `${day}.${m}.${y}`;
  const jsDay = d.getDay();
  const dowIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Пн .. 6=Вс
  const dayOfWeek = shortDayNames[dowIdx] || 'Пн';
  const monthIdx = d.getMonth();
  const monthKey = monthNames[monthIdx] || 'Месяц';
  const monthCycleKey = `${y}-${m}`;

  let seasonKey = 'autumn';
  if (monthIdx === 11 || monthIdx === 0 || monthIdx === 1) seasonKey = 'winter';
  else if (monthIdx >= 2 && monthIdx <= 4) seasonKey = 'spring';
  else if (monthIdx >= 5 && monthIdx <= 7) seasonKey = 'summer';
  else if (monthIdx >= 8 && monthIdx <= 10) seasonKey = 'autumn';

  // Расчет номера недели ISO
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
  const weekKey = `Нед ${weekNum}`;

  return {
    isoDate, displayDate, fullDisplayDate, dayOfWeek, dowIdx,
    monthKey, monthIdx, monthCycleKey, weekKey, year: y, seasonKey, dateObj: d, isValidDate
  };
}

const monthDaysLookup = {
  'январь': 31, 'февраль': 28, 'март': 31, 'апрель': 30, 'май': 31, 'июнь': 30,
  'июль': 31, 'август': 31, 'сентябрь': 30, 'октябрь': 31, 'ноябрь': 30, 'декабрь': 31
};

function getDaysInMonthFromRow(rawRow) {
  if (!rawRow) return 30;
  const year = rawRow.year || (rawRow.fullDisplayDate && parseInt(String(rawRow.fullDisplayDate).match(/\d{4}/)?.[0], 10)) || 2026;
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  const str = String(rawRow.date || rawRow.monthKey || '').toLowerCase().trim();
  for (const [mName, days] of Object.entries(monthDaysLookup)) {
    if (str.includes(mName)) {
      if (mName === 'февраль') return isLeapYear ? 29 : 28;
      return days;
    }
  }
  if (rawRow.fullDate) {
    const d = new Date(rawRow.fullDate);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    }
  }
  return 30;
}

function getDayDateObj(r) {
  if (!r) return new Date();
  if (r.dateObj instanceof Date && !isNaN(r.dateObj.getTime())) return r.dateObj;
  if (r.fullDate) {
    const p = parseDateInfo(r.fullDate);
    return p.dateObj;
  }
  if (r.date && typeof r.date === 'string' && r.date.includes('.')) {
    const parts = r.date.split('.');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = r.year || 2026;
    return new Date(year, month, day, 12, 0, 0);
  }
  return new Date();
}

function getWeekCycleInfo(dateInput, weekStartDay = 0) {
  const d = dateInput instanceof Date ? new Date(dateInput.getTime()) : new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const jsDay = d.getDay();
  const dowIdx = jsDay === 0 ? 6 : jsDay - 1; // 0=Пн .. 6=Вс
  const offset = (dowIdx - weekStartDay + 7) % 7;
  const cycleStart = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offset, 12, 0, 0);
  const cycleEnd = new Date(cycleStart.getFullYear(), cycleStart.getMonth(), cycleStart.getDate() + 6, 12, 0, 0);

  const pad = n => String(n).padStart(2, '0');
  const cycleKey = `${cycleStart.getFullYear()}-${pad(cycleStart.getMonth() + 1)}-${pad(cycleStart.getDate())}`;
  const startDisp = `${pad(cycleStart.getDate())}.${pad(cycleStart.getMonth() + 1)}`;
  const endDisp = `${pad(cycleEnd.getDate())}.${pad(cycleEnd.getMonth() + 1)}`;
  const startDayName = shortDayNames[weekStartDay] || 'Пн';
  const endDayName = shortDayNames[(weekStartDay + 6) % 7] || 'Вс';

  return {
    cycleStart,
    cycleEnd,
    cycleKey,
    startDisp,
    endDisp,
    label: `${startDisp}–${endDisp}`,
    fullLabel: `${startDisp}–${endDisp} (${cycleStart.getFullYear()})`,
    dayRangeLabel: `${startDayName}–${endDayName}`,
    offset,
    dowIdx
  };
}

/**
 * Парсер процентов (поддерживает '5%', 0.05 -> 5%, 0.7 -> 70%, 1.05 -> 105%, 35 -> 35%)
 */
function parsePercentage(val) {
  if (val == null || val === '') return 0;
  if (typeof val === 'string' && val.includes('%')) {
    const cleaned = val.replace(',', '.').replace('%', '').trim();
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : 0;
  }
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.').trim());
  if (!Number.isFinite(num)) return 0;
  return Math.abs(num) > 2.5 ? num : num * 100;
}

/**
 * Парсер денежных / числовых значений
 */
function parseNum(val) {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val)
    .replace(/[\s\u00a0\u202f]/g, '')
    .replace(/[\u2212\u2013\u2014]/g, '-')
    .replace(/[^0-9.,+\-]/g, '');
  const lc = s.lastIndexOf(','), ld = s.lastIndexOf('.');
  if (lc > -1 && ld > -1) {
    const dec = lc > ld ? ',' : '.';
    const thou = dec === ',' ? '.' : ',';
    s = s.split(thou).join('').replace(dec, '.');
  } else if (lc > -1) {
    s = s.split(',').length > 2 ? s.split(',').join('') : s.replace(',', '.');
  } else if (ld > -1 && s.split('.').length > 2) {
    s = s.split('.').join('');
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Парсер CSV-текста с автоопределением разделителя и кавычек
 */
function parseCSVText(text) {
  if (!text || typeof text !== 'string') return [];
  const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const firstNewlineIdx = cleanText.search(/[\r\n]/);
  const firstLine = firstNewlineIdx !== -1 ? cleanText.substring(0, firstNewlineIdx) : cleanText;
  let delimiter = ';';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  if (semiCount >= commaCount && semiCount >= tabCount) delimiter = ';';
  else if (commaCount > semiCount && commaCount >= tabCount) delimiter = ',';
  else if (tabCount > semiCount && tabCount > commaCount) delimiter = '\t';

  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentField.trim());
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField.trim());
      if (currentRow.some(f => f !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(f => f !== '')) {
      rows.push(currentRow);
    }
  }
  return rows;
}

const CANONICAL_TRANSPORT_ORDER = ['walk', 'bike', 'ebike', 'car'];

function normalizeTransportInfo(rawVal) {
  const raw = String(rawVal == null ? '' : rawVal).trim();
  const tLower = raw.toLowerCase();
  if (tLower.includes('электро') || tLower.includes('ebike') || tLower.includes('e-bike')) {
    return { key: 'ebike', label: 'Электровело', raw: raw || 'Электровело' };
  }
  if (tLower.includes('вело') || tLower.includes('bike')) {
    return { key: 'bike', label: 'Вело', raw: raw || 'Вело' };
  }
  if (tLower.includes('авто') || tLower.includes('машин') || tLower === 'car') {
    return { key: 'car', label: 'Авто', raw: raw || 'Авто' };
  }
  if (tLower.includes('пеш') || tLower.includes('walk')) {
    return { key: 'walk', label: 'Пеший', raw: raw || 'Пеший' };
  }
  return { key: 'walk', label: 'Пеший', raw: raw || 'Пеший' };
}

/**
 * Извлечение заказов или слотовых записей из массива строк (Excel или CSV)
 * Поддерживает новый 20-столбцовый формат (с пометкой *), старый 15-столбцовый (data.xlsx)
 * и минимальный 5-столбцовый набор без ложного смещения колонок.
 */
function parseOrdersFromRows(rawRows) {
  if (!rawRows || rawRows.length === 0) return [];

  const firstRow = rawRows[0] || [];
  const normHeaders = firstRow.map(h =>
    String(h == null ? '' : h)
      .replace(/\*+/g, '')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .trim()
  );

  const headerMatchers = {
    date:      h => h === 'дата' || h === 'date' || h.includes('дата') || h.includes('число') || h.includes('date'),
    start:     h => h.includes('начал') || h.includes('старт') || h.includes('start'),
    end:       h => h.includes('конец') || h.includes('окончани') || h.includes('end') || h.includes('финиш'),
    cost:      h => h.includes('стоимост') || h.includes('оплата за заказ') || h.includes('тариф') || h.includes('cost'),
    transport: h => h.includes('транспорт') || h.includes('тип авто') || h.includes('передвижен') || h.includes('способ') || h.includes('transport'),
    ordersCnt: h => h.includes('кол-во заказ') || h.includes('количество заказ') || h.includes('число заказ') || h === 'заказов' || h === 'orders' || h.includes('orders count'),
    slotType:  h => h.includes('тип слот') || h.includes('тип смен') || h.includes('плановый') || h.includes('свободный') || h.includes('slot type'),
    slotNum:   h => h.includes('номер слот') || h.includes('номер смен') || h.includes('№ слот') || h.includes('slot num') || h === 'слот' || h === 'slot',
    dist:      h => h.includes('дистанц') || h.includes('расстояни') || h.includes('дист') || h.includes('dist') || h === 'км',
    weight:    h => h.includes('вес') || h.includes('weight') || h === 'кг',
    waitMin:   h => (h.includes('ожидан') || h.includes('wait')) && (h.includes('мин') || h.includes('min') || h.includes('врем')),
    waitRub:   h => (h.includes('ожидан') || h.includes('wait')) && !h.includes('мин') && !h.includes('min') && !h.includes('врем'),
    surge:     h => h.includes('спрос') || h.includes('surge'),
    rating:    h => h.includes('рейтинг') || h.includes('rating'),
    bonus:     h => h.includes('бонус') || h.includes('bonus'),
    tips:      h => h.includes('чаев') || h.includes('tips') || h.includes('tip'),
    goal:      h => h.includes('цель') || h.includes('цели') || h.includes('goal'),
    adjRub:    h => (h.includes('коррект') || h.includes('удержан') || h.includes('штраф') || h.includes('adjust')) && !h.includes('причин') && !h.includes('коммент') && !h.includes('описан') && !h.includes('reason'),
    adjReason: h => h.includes('причин') || h.includes('reason') || (h.includes('коррект') && (h.includes('коммент') || h.includes('описан'))),
    expense:   h => h.includes('расход') || h.includes('траты') || h.includes('expense')
  };

  let headerMatches = 0;
  normHeaders.forEach(h => {
    if (!h) return;
    if (Object.values(headerMatchers).some(fn => fn(h))) headerMatches++;
  });
  const firstCellDate = parseDateInfo(firstRow[0]);
  const hasHeaderRow = !firstCellDate.isValidDate && headerMatches >= 2;
  const dataRows = hasHeaderRow ? rawRows.slice(1) : rawRows;
  if (dataRows.length === 0) return [];

  let colDate = -1, colStart = -1, colEnd = -1, colCost = -1, colTransport = -1;
  let colOrdersCnt = -1, colSlotType = -1, colSlotNum = -1, colDist = -1, colWeight = -1;
  let colWaitRub = -1, colWaitMin = -1, colSurge = -1, colRating = -1, colBonus = -1;
  let colTips = -1, colGoal = -1, colAdjRub = -1, colAdjReason = -1, colExpense = -1;

  if (hasHeaderRow) {
    const findIdx = pred => normHeaders.findIndex(h => h && pred(h));
    colDate      = findIdx(headerMatchers.date);
    colStart     = findIdx(headerMatchers.start);
    colEnd       = findIdx(headerMatchers.end);
    colCost      = findIdx(headerMatchers.cost);
    colTransport = findIdx(headerMatchers.transport);
    colOrdersCnt = findIdx(headerMatchers.ordersCnt);
    colSlotType  = findIdx(headerMatchers.slotType);
    colSlotNum   = findIdx(headerMatchers.slotNum);
    colDist      = findIdx(headerMatchers.dist);
    colWeight    = findIdx(headerMatchers.weight);
    colWaitMin   = findIdx(headerMatchers.waitMin);
    colWaitRub   = findIdx(headerMatchers.waitRub);
    colSurge     = findIdx(headerMatchers.surge);
    colRating    = findIdx(headerMatchers.rating);
    colBonus     = findIdx(headerMatchers.bonus);
    colTips      = findIdx(headerMatchers.tips);
    colGoal      = findIdx(headerMatchers.goal);
    colAdjRub    = findIdx(headerMatchers.adjRub);
    colAdjReason = findIdx(headerMatchers.adjReason);
    colExpense   = findIdx(headerMatchers.expense);
    if (colDate < 0) colDate = 0;
  } else if ((firstRow.length || 0) === 15) {
    // Совместимость со старым 15-столбцовым форматом data.xlsx без заголовка
    colDate = 0; colStart = 1; colEnd = 2; colDist = 3; colWeight = 4;
    colCost = 5; colWaitRub = 6; colSurge = 7; colRating = 8; colBonus = 9;
    colExpense = 10; colTransport = 11; colSlotType = 12; colSlotNum = 13; colGoal = 14;
  } else {
    // Позиционный порядок нового 20-столбцового шаблона
    colDate = 0; colStart = 1; colEnd = 2; colCost = 3; colTransport = 4;
    colOrdersCnt = 5; colSlotType = 6; colSlotNum = 7; colDist = 8; colWeight = 9;
    colWaitRub = 10; colWaitMin = 11; colSurge = 12; colRating = 13; colBonus = 14;
    colTips = 15; colGoal = 16; colAdjRub = 17; colAdjReason = 18; colExpense = 19;
  }

  const orders = [];
  let anyDistCell = false;
  let anyWeightCell = false;
  let anyWaitCell = false;
  let anySurgeCell = false;
  let anyRatingCell = false;
  let anyBonusCell = false;
  let anyTipsCell = false;
  let anyGoalCell = false;
  let anyAdjCell = false;
  let anyAdjReason = false;
  let anyExpenseCell = false;
  let anySlotTypeCell = false;
  let anySlotNumCell = false;
  let hasOrderLevelRows = false;
  let hasSlotLevelRows = false;

  const isNonEmpty = v => v != null && String(v).trim() !== '';

  dataRows.forEach(r => {
    if (!r || !Array.isArray(r) || r.length === 0) return;
    if (r.every(cell => !isNonEmpty(cell))) return;

    const dateInfo = parseDateInfo(r[colDate]);
    if (!dateInfo.isValidDate) return;

    const startSecs = colStart >= 0 && isNonEmpty(r[colStart]) ? parseTimeSecs(r[colStart]) : 0;
    const endSecs = colEnd >= 0 && isNonEmpty(r[colEnd]) ? parseTimeSecs(r[colEnd]) : 0;

    let durationMins = 0;
    if (endSecs > startSecs) {
      durationMins = (endSecs - startSecs) / 60;
    } else if (endSecs < startSecs && (startSecs > 0 || endSecs > 0)) {
      durationMins = (endSecs + 86400 - startSecs) / 60;
    }
    if (durationMins <= 0) durationMins = 20;

    const ordersCount = (colOrdersCnt >= 0 && isNonEmpty(r[colOrdersCnt]))
      ? Math.max(1, Math.round(parseNum(r[colOrdersCnt])))
      : 1;
    const isSlotLevel = ordersCount > 1;
    if (isSlotLevel) hasSlotLevelRows = true;
    else hasOrderLevelRows = true;

    const hasDistVal = colDist >= 0 && isNonEmpty(r[colDist]);
    const hasWeightVal = colWeight >= 0 && isNonEmpty(r[colWeight]);
    const hasWaitRubVal = colWaitRub >= 0 && isNonEmpty(r[colWaitRub]);
    const hasWaitMinVal = colWaitMin >= 0 && isNonEmpty(r[colWaitMin]);
    const hasSurgeVal = colSurge >= 0 && isNonEmpty(r[colSurge]);
    const hasRatingVal = colRating >= 0 && isNonEmpty(r[colRating]);
    const hasBonusVal = colBonus >= 0 && isNonEmpty(r[colBonus]);
    const hasTipVal = colTips >= 0 && isNonEmpty(r[colTips]);
    const hasGoalVal = colGoal >= 0 && isNonEmpty(r[colGoal]);
    const hasAdjVal = colAdjRub >= 0 && isNonEmpty(r[colAdjRub]);
    const hasExpVal = colExpense >= 0 && isNonEmpty(r[colExpense]);

    const distance = hasDistVal ? Math.max(0, parseNum(r[colDist])) : null;
    const weight = hasWeightVal ? Math.max(0, parseNum(r[colWeight])) : null;
    const orderCost = colCost >= 0 ? parseNum(r[colCost]) : 0;
    const wait = hasWaitRubVal ? Math.max(0, parseNum(r[colWaitRub])) : 0;
    const waitMin = hasWaitMinVal ? Math.max(0, parseNum(r[colWaitMin])) : 0;
    const surgePct = hasSurgeVal ? parsePercentage(r[colSurge]) : 0;
    const ratingPct = hasRatingVal ? parsePercentage(r[colRating]) : 0;
    const bonus = hasBonusVal ? Math.max(0, parseNum(r[colBonus])) : 0;
    const tip = hasTipVal ? Math.max(0, parseNum(r[colTips])) : 0;
    const goal = hasGoalVal ? Math.max(0, parseNum(r[colGoal])) : 0;
    const adjRaw = hasAdjVal ? parseNum(r[colAdjRub]) : 0;
    const adjustment = adjRaw !== 0 ? -Math.abs(adjRaw) : 0;
    const adjustmentReason = (colAdjReason >= 0 && isNonEmpty(r[colAdjReason]))
      ? String(r[colAdjReason]).trim()
      : '';
    const expense = hasExpVal ? Math.max(0, parseNum(r[colExpense])) : 0;

    if (hasDistVal) anyDistCell = true;
    if (hasWeightVal) anyWeightCell = true;
    if (hasWaitRubVal || hasWaitMinVal) anyWaitCell = true;
    if (hasSurgeVal) anySurgeCell = true;
    if (hasRatingVal) anyRatingCell = true;
    if (hasBonusVal) anyBonusCell = true;
    if (tip > 0) anyTipsCell = true;
    if (goal > 0) anyGoalCell = true;
    if (adjustment < 0) anyAdjCell = true;
    if (adjustmentReason) anyAdjReason = true;
    if (expense > 0) anyExpenseCell = true;
    if (colSlotType >= 0 && isNonEmpty(r[colSlotType])) anySlotTypeCell = true;
    if (colSlotNum >= 0 && isNonEmpty(r[colSlotNum])) anySlotNumCell = true;

    const tInfo = normalizeTransportInfo(colTransport >= 0 ? r[colTransport] : 'Пеший');
    const slotType = (colSlotType >= 0 && isNonEmpty(r[colSlotType])) ? String(r[colSlotType]).trim() : '';
    const slotNumber = (colSlotNum >= 0 && isNonEmpty(r[colSlotNum])) ? String(r[colSlotNum]).trim() : '1';

    const baseCost = orderCost + wait;
    const surgeRub = baseCost * (surgePct / 100);
    const ratingRub = baseCost * (ratingPct / 100);
    const effectiveWaitMin = waitMin > 0 ? waitMin : (wait > 0 ? (wait / WAIT_RUB_PER_MIN) : 0);

    orders.push({
      dateInfo,
      date: dateInfo.isoDate,
      displayDate: dateInfo.displayDate,
      fullDisplayDate: dateInfo.fullDisplayDate,
      dayOfWeek: dateInfo.dayOfWeek,
      dowIdx: dateInfo.dowIdx,
      monthKey: dateInfo.monthKey,
      monthCycleKey: dateInfo.monthCycleKey,
      weekKey: dateInfo.weekKey,
      year: dateInfo.year,
      seasonKey: dateInfo.seasonKey,
      dateKey: dateInfo.isoDate,
      weekCycleKey: (getWeekCycleInfo(dateInfo.dateObj, state.weekStartDay) || {}).cycleKey || dateInfo.weekKey,
      startSecs,
      endSecs,
      durationMins,
      ordersCount,
      isSlotLevel,
      distance,
      weight,
      orderCost,
      wait,
      waitMin,
      effectiveWaitMin,
      hasWait: wait > 0 || waitMin > 0,
      baseCost,
      surgePct,
      surgeRub,
      ratingPct,
      ratingRub,
      bonus,
      tip,
      goal,
      adjustment,
      adjustmentReason,
      expense,
      transportRaw: tInfo.raw,
      transportKey: tInfo.key,
      transportLabel: tInfo.label,
      slotType,
      slotNumber
    });
  });

  orders.capabilities = {
    hasOrdersCountCol: colOrdersCnt >= 0,
    hasSlotType: colSlotType >= 0 && anySlotTypeCell,
    hasSlotNum: colSlotNum >= 0 && anySlotNumCell,
    hasDistance: colDist >= 0 && anyDistCell,
    hasWeight: colWeight >= 0 && anyWeightCell,
    hasWaitRub: colWaitRub >= 0,
    hasWaitMin: colWaitMin >= 0 || colWaitRub >= 0,
    hasWaitData: (colWaitRub >= 0 || colWaitMin >= 0) && anyWaitCell,
    hasSurgeCol: colSurge >= 0 && anySurgeCell,
    hasRatingCol: colRating >= 0 && anyRatingCell,
    hasBonusCol: colBonus >= 0 && anyBonusCell,
    hasTips: colTips >= 0 && anyTipsCell,
    hasGoals: colGoal >= 0 && anyGoalCell,
    hasAdjustments: colAdjRub >= 0 && anyAdjCell,
    hasAdjustmentReasons: colAdjReason >= 0 && anyAdjReason,
    hasFileExpenses: colExpense >= 0 && anyExpenseCell,
    hasOrderLevelRows,
    hasSlotLevelRows,
    isPureSlotLevel: hasSlotLevelRows && !hasOrderLevelRows
  };

  return orders;
}

/**
 * Расчет агрегированных метрик по группе заказов или слотовых строк
 */
function computeGroupOrderMetrics(groupOrders, caps = getDatasetCapabilities(), isSlotMode = false) {
  const emptyRes = {
    avgDist: '—',
    avgDur: '—',
    avgWeight: '—',
    payPerKm: '—',
    payPerKg: '—',
    waitPct: '—',
    avgWaitMin: '—',
    avgOrdersPerSlot: '—'
  };
  if (!groupOrders || groupOrders.length === 0) return emptyRes;

  const rowCnt = groupOrders.length;
  const distOrders = caps.hasDistance !== false
    ? groupOrders.filter(o => o.distance != null && Number.isFinite(Number(o.distance)))
    : [];
  const weightOrders = caps.hasWeight !== false
    ? groupOrders.filter(o => o.weight != null && Number.isFinite(Number(o.weight)))
    : [];
  const sumDist = distOrders.reduce((a, o) => a + Number(o.distance), 0);
  const sumDistCost = distOrders.reduce((a, o) => a + Number(o.orderCost || o.baseCost || 0), 0);
  const sumDur = groupOrders.reduce((a, o) => a + Number(o.durationMins || 0), 0);
  const sumWeight = weightOrders.reduce((a, o) => a + Number(o.weight), 0);
  const sumWeightCost = weightOrders.reduce((a, o) => a + Number(o.orderCost || o.baseCost || 0), 0);
  const sumOrders = groupOrders.reduce((a, o) => a + Number(o.ordersCount || 1), 0);
  const waitsList = groupOrders.filter(o => (o.wait || 0) > 0 || (o.waitMin || 0) > 0);

  const hasDist = caps.hasDistance !== false && distOrders.length > 0 && sumDist > 0;
  const hasWeight = caps.hasWeight !== false && weightOrders.length > 0 && sumWeight > 0;
  const hasWaitCol = caps.hasWaitData === true;

  const avgDist = (caps.hasDistance === false || distOrders.length === 0)
    ? '—'
    : (sumDist > 0 ? (sumDist / distOrders.length).toFixed(1) + ' км' : '0.0 км');

  const avgDurMins = sumDur / rowCnt;
  const avgDur = sumDur > 0
    ? (isSlotMode && avgDurMins >= 60 ? (avgDurMins / 60).toFixed(1) + ' ч' : Math.round(avgDurMins) + ' мин')
    : '—';

  const avgWeight = (caps.hasWeight === false || weightOrders.length === 0)
    ? '—'
    : (sumWeight > 0 ? (sumWeight / weightOrders.length).toFixed(1) + ' кг' : '0.0 кг');

  const payPerKm = hasDist ? Math.round(sumDistCost / sumDist) + ' ₽/км' : '—';
  const payPerKg = hasWeight ? Math.round(sumWeightCost / sumWeight) + ' ₽/кг' : '—';

  const waitPct = hasWaitCol ? Math.round((waitsList.length / rowCnt) * 100) + '%' : '—';
  const totalWaitMin = waitsList.reduce((a, o) => {
    const m = o.effectiveWaitMin != null
      ? Number(o.effectiveWaitMin)
      : (o.waitMin > 0 ? Number(o.waitMin) : (o.wait > 0 ? (Number(o.wait) / WAIT_RUB_PER_MIN) : 0));
    return a + m;
  }, 0);
  const avgWaitMin = (hasWaitCol && waitsList.length > 0)
    ? (totalWaitMin / waitsList.length).toFixed(1) + ' мин'
    : '—';

  const avgOrdersPerSlot = (sumOrders / rowCnt).toFixed(1);

  return {
    avgDist,
    avgDur,
    avgWeight,
    payPerKm,
    payPerKg,
    waitPct,
    avgWaitMin,
    avgOrdersPerSlot
  };
}

/**
 * Точный расчет статистики по видам транспорта с учетом чаевых, корректировок, расходов и целей
 */
function calculateTransportStats(orders) {
  if (!orders || orders.length === 0) {
    return {
      byTransport: {},
      totalGross: 0,
      totalTax: 0,
      totalFileExp: 0,
      totalSettingsExp: 0,
      totalAdj: 0,
      totalNet: 0,
      totalHrs: 0,
      totalProfitPerHr: 0,
      totalOrdersCount: 0,
      totalOrdersPerHr: '0.00'
    };
  }

  const segmentMap = new Map();
  orders.forEach(o => {
    const key = `${o.date}__${o.slotNumber}__${o.transportKey}`;
    if (!segmentMap.has(key)) {
      segmentMap.set(key, {
        date: o.date,
        slotNumber: o.slotNumber,
        transportKey: o.transportKey,
        transportLabel: o.transportLabel,
        orders: []
      });
    }
    segmentMap.get(key).orders.push(o);
  });

  const byTransport = {};
  let totalGross = 0;
  let totalFileExp = 0;
  let totalSettingsExp = 0;
  let totalAdj = 0;
  let totalHrs = 0;
  let totalOrdersCount = 0;

  const transDates = {};
  segmentMap.forEach(seg => {
    const tKey = seg.transportKey;
    if (!transDates[tKey]) transDates[tKey] = new Set();
    transDates[tKey].add(seg.date);
  });

  const usedKeys = CANONICAL_TRANSPORT_ORDER.filter(k => transDates[k])
    .concat(Object.keys(transDates).filter(k => !CANONICAL_TRANSPORT_ORDER.includes(k)));

  usedKeys.forEach(tKey => {
    const segs = Array.from(segmentMap.values()).filter(s => s.transportKey === tKey);
    let durHr = 0;
    let gross = 0;
    let fileExp = 0;
    let adj = 0;
    let ordersCount = 0;

    segs.forEach(seg => {
      const oList = seg.orders;
      const startS = Math.min(...oList.map(o => o.startSecs));
      const maxEnd = Math.max(...oList.map(o => o.endSecs));
      const spanSecs = Math.max(15 * 60, (maxEnd >= startS ? maxEnd - startS : maxEnd + 86400 - startS));
      const segDur = Math.max(0.3, spanSecs / 3600);
      durHr += segDur;
      ordersCount += oList.reduce((a, o) => a + Number(o.ordersCount || 1), 0);

      const exps = oList.map(o => o.expense).filter(e => e > 0);
      if (exps.length > 0) {
        fileExp += exps.every(e => Math.abs(e - exps[0]) < 0.01) ? exps[0] : exps.reduce((a, b) => a + b, 0);
      }

      oList.forEach(o => {
        const goalVal = state.includeGoals ? (o.goal || 0) : 0;
        gross += o.orderCost + (o.wait || 0) + o.surgeRub + o.ratingRub + o.bonus + goalVal + (o.tip || 0);
        adj += -Math.abs(Number(o.adjustment || 0));
      });
    });

    durHr = Math.round(durHr * 10) / 10;
    const weeklyExp = getWeeklyExpenseForTransport(tKey);
    const activeDaysCount = transDates[tKey] ? transDates[tKey].size : 0;
    const settingsExp = activeDaysCount * (weeklyExp / 7.0);

    const tax = taxOf(gross);
    const net = state.isNet ? (gross - tax - fileExp - settingsExp + adj) : gross;
    const profitPerHr = durHr > 0 ? Math.round(net / durHr) : 0;
    const ordersPerHr = durHr > 0 ? (ordersCount / durHr).toFixed(2) : '0.00';

    byTransport[tKey] = {
      hrs: durHr,
      gross,
      tax,
      fileExp,
      settingsExp,
      adj,
      net,
      profitPerHr,
      ordersCount,
      ordersPerHr
    };

    totalGross += gross;
    totalFileExp += fileExp;
    totalSettingsExp += settingsExp;
    totalAdj += adj;
    totalHrs += durHr;
    totalOrdersCount += ordersCount;
  });

  const totalTax = taxOf(totalGross);
  const totalNet = state.isNet ? (totalGross - totalTax - totalFileExp - totalSettingsExp + totalAdj) : totalGross;
  const totalProfitPerHr = totalHrs > 0 ? Math.round(totalNet / totalHrs) : 0;
  const totalOrdersPerHr = totalHrs > 0 ? (totalOrdersCount / totalHrs).toFixed(2) : '0.00';

  return {
    byTransport,
    totalGross,
    totalTax,
    totalFileExp,
    totalSettingsExp,
    totalAdj,
    totalNet,
    totalHrs,
    totalProfitPerHr,
    totalOrdersCount,
    totalOrdersPerHr
  };
}

/**
 * Точный расчет слотовой статистики для плановых и свободных слотов
 */
function calculateSlotStats(orders) {
  if (!orders || orders.length === 0) {
    return {
      planHrs: 0, planNet: 0, planProfitPerHr: 0, planOrdHr: '0.00',
      freeHrs: 0, freeNet: 0, freeProfitPerHr: 0, freeOrdHr: '0.00',
      totalHrs: 0, totalNet: 0, totalProfitPerHr: 0, totalOrdHr: '0.00'
    };
  }

  const slotMap = new Map();
  orders.forEach(o => {
    const key = `${o.date}__${o.slotNumber}__${o.slotType}`;
    if (!slotMap.has(key)) {
      slotMap.set(key, {
        orders: [],
        slotType: o.slotType,
        transportKey: o.transportKey,
        date: o.date
      });
    }
    slotMap.get(key).orders.push(o);
  });

  let planHrs = 0, planGross = 0, planFileExp = 0, planAdj = 0, planOrdersCount = 0;
  let freeHrs = 0, freeGross = 0, freeFileExp = 0, freeAdj = 0, freeOrdersCount = 0;

  slotMap.forEach(slot => {
    const oList = slot.orders;
    const startS = Math.min(...oList.map(o => o.startSecs));
    const maxEnd = Math.max(...oList.map(o => o.endSecs));
    const spanSecs = Math.max(15 * 60, (maxEnd >= startS ? maxEnd - startS : maxEnd + 86400 - startS));
    const durHr = Math.max(0.3, spanSecs / 3600);

    let sGross = 0;
    let sAdj = 0;
    let sOrdCount = 0;
    const exps = oList.map(o => o.expense).filter(e => e > 0);
    const sExp = exps.length > 0 ? (exps.every(e => Math.abs(e - exps[0]) < 0.01) ? exps[0] : exps.reduce((a, b) => a + b, 0)) : 0;

    oList.forEach(o => {
      const goalVal = state.includeGoals ? (o.goal || 0) : 0;
      sGross += o.orderCost + (o.wait || 0) + o.surgeRub + o.ratingRub + o.bonus + goalVal + (o.tip || 0);
      sAdj += -Math.abs(Number(o.adjustment || 0));
      sOrdCount += Number(o.ordersCount || 1);
    });

    const stLower = (slot.slotType || '').toLowerCase();
    if (stLower.includes('план')) {
      planHrs += durHr;
      planGross += sGross;
      planFileExp += sExp;
      planAdj += sAdj;
      planOrdersCount += sOrdCount;
    } else if (stLower.includes('свобод')) {
      freeHrs += durHr;
      freeGross += sGross;
      freeFileExp += sExp;
      freeAdj += sAdj;
      freeOrdersCount += sOrdCount;
    }
  });

  planHrs = Math.round(planHrs * 10) / 10;
  freeHrs = Math.round(freeHrs * 10) / 10;
  const totalHrs = planHrs + freeHrs;

  const tStats = calculateTransportStats(orders);
  const totalSettingsExp = tStats.totalSettingsExp;
  const planSettingsExp = totalHrs > 0 ? (planHrs / totalHrs) * totalSettingsExp : 0;
  const freeSettingsExp = totalHrs > 0 ? (freeHrs / totalHrs) * totalSettingsExp : 0;

  const planTax = taxOf(planGross);
  const planNet = state.isNet ? (planGross - planTax - planFileExp - planSettingsExp + planAdj) : planGross;
  const planProfitPerHr = planHrs > 0 ? Math.round(planNet / planHrs) : 0;
  const planOrdHr = planHrs > 0 ? (planOrdersCount / planHrs).toFixed(2) : '0.00';

  const freeTax = taxOf(freeGross);
  const freeNet = state.isNet ? (freeGross - freeTax - freeFileExp - freeSettingsExp + freeAdj) : freeGross;
  const freeProfitPerHr = freeHrs > 0 ? Math.round(freeNet / freeHrs) : 0;
  const freeOrdHr = freeHrs > 0 ? (freeOrdersCount / freeHrs).toFixed(2) : '0.00';

  const totalNet = planNet + freeNet;
  const totalProfitPerHr = totalHrs > 0 ? Math.round(totalNet / totalHrs) : 0;
  const totalOrdHr = totalHrs > 0 ? ((planOrdersCount + freeOrdersCount) / totalHrs).toFixed(2) : '0.00';

  return {
    planHrs, planNet, planProfitPerHr, planOrdHr,
    freeHrs, freeNet, freeProfitPerHr, freeOrdHr,
    totalHrs, totalNet, totalProfitPerHr, totalOrdHr
  };
}

/**
 * Единое построение сравнительных показателей (Блок 3) из загруженных заказов/слотов.
 * В демо-режиме добавляет прогноз отсутствующего транспорта (Авто) и бенчмарки района/города.
 */
function buildComparisonDatasets(orders, days, isDemo = false, caps = {}) {
  const isSlotMode = Boolean(caps.isPureSlotLevel);
  const lbl = isSlotMode
    ? {
        dist: 'Расстояние за слот',
        dur: 'Продолжительность слота',
        weight: 'Вес за слот',
        payKm: 'Оплата за км (слот)',
        payKg: 'Оплата за кг (слот)',
        waitPct: 'Доля слотов с ожиданием',
        waitMin: 'Ожидание за слот',
        ordersInSlot: 'Заказов за слот'
      }
    : {
        dist: 'Расстояние заказа',
        dur: 'Продолжительность заказа',
        weight: 'Вес заказа',
        payKm: 'Оплата за км заказа',
        payKg: 'Оплата за кг заказа',
        waitPct: 'Доля заказов с ожиданием',
        waitMin: 'Ожидание заказа'
      };

  const rawTransportKeys = Array.from(new Set(orders.map(o => o.transportKey)));
  const usedTransportKeys = CANONICAL_TRANSPORT_ORDER.filter(k => rawTransportKeys.includes(k))
    .concat(rawTransportKeys.filter(k => !CANONICAL_TRANSPORT_ORDER.includes(k)));

  const transportCols = [];
  const transMetrics = [];

  usedTransportKeys.forEach(tKey => {
    const tOrders = orders.filter(o => o.transportKey === tKey);
    const m = computeGroupOrderMetrics(tOrders, caps, isSlotMode);
    transportCols.push({
      key: tKey,
      title: (transportMeta[tKey] && transportMeta[tKey].label) || tKey,
      forecast: false
    });
    transMetrics.push({ m, isForecast: false });
  });

  // Прогноз для отсутствующего транспорта доступен только в демо (серверные городские ориентиры)
  if (isDemo && !usedTransportKeys.includes('car')) {
    transportCols.push({
      key: 'car',
      title: 'Авто (прогноз)',
      forecast: true
    });
    transMetrics.push({
      isForecast: true,
      m: {
        avgDist: '4.3 км',
        avgDur: '22 мин',
        avgWeight: '7.5 кг',
        payPerKm: '108 ₽/км',
        payPerKg: '62 ₽/кг',
        waitPct: '31%',
        avgWaitMin: '7.4 мин',
        avgOrdersPerSlot: '18.0'
      }
    });
  }

  const hasDistMetric = caps.hasDistance !== false;
  const hasWeightMetric = caps.hasWeight !== false;
  const hasWaitMetric = caps.hasWaitData === true;

  const transportRows = [];
  if (hasDistMetric) transportRows.push({ label: lbl.dist, vals: transMetrics.map(x => x.m.avgDist) });
  transportRows.push({ label: lbl.dur, vals: transMetrics.map(x => x.m.avgDur) });
  if (hasWeightMetric) transportRows.push({ label: lbl.weight, vals: transMetrics.map(x => x.m.avgWeight) });
  if (hasDistMetric) transportRows.push({ label: lbl.payKm, vals: transMetrics.map(x => x.m.payPerKm) });
  if (hasWeightMetric) transportRows.push({ label: lbl.payKg, vals: transMetrics.map(x => x.m.payPerKg) });
  if (hasWaitMetric) {
    transportRows.push({ label: lbl.waitPct, vals: transMetrics.map(x => x.m.waitPct) });
    transportRows.push({ label: lbl.waitMin, vals: transMetrics.map(x => x.m.avgWaitMin) });
  }
  if (isSlotMode && caps.hasOrdersCountCol) {
    transportRows.push({ label: lbl.ordersInSlot, vals: transMetrics.map(x => x.m.avgOrdersPerSlot) });
  }

  const transport = {
    columns: transportCols,
    rowsPerOrder: transportRows,
    rowsTotal: [
      {
        label: 'Заказов в час',
        vals: transportCols.map(c => c.forecast ? '2.35' : `TRANSPORT_${c.key.toUpperCase()}_ORD_HR_DYN`)
      },
      {
        label: 'Прибыль в час',
        vals: transportCols.map(c => c.forecast ? 'CAR_FORECAST_DYN' : `TRANSPORT_${c.key.toUpperCase()}_PROFIT_DYN`)
      }
    ]
  };

  // 2. Тип слота: Плановый / Свободный
  const planOrders = orders.filter(o => (o.slotType || '').toLowerCase().includes('план'));
  const planM = computeGroupOrderMetrics(planOrders, caps, isSlotMode);
  const freeOrders = orders.filter(o => (o.slotType || '').toLowerCase().includes('свобод'));
  const freeM = computeGroupOrderMetrics(freeOrders, caps, isSlotMode);

  const slotRows = [];
  if (hasDistMetric) slotRows.push({ label: lbl.dist, vals: [planM.avgDist, freeM.avgDist] });
  slotRows.push({ label: lbl.dur, vals: [planM.avgDur, freeM.avgDur] });
  if (hasWeightMetric) slotRows.push({ label: lbl.weight, vals: [planM.avgWeight, freeM.avgWeight] });
  if (hasDistMetric) slotRows.push({ label: lbl.payKm, vals: [planM.payPerKm, freeM.payPerKm] });
  if (hasWeightMetric) slotRows.push({ label: lbl.payKg, vals: [planM.payPerKg, freeM.payPerKg] });
  if (hasWaitMetric) {
    slotRows.push({ label: lbl.waitPct, vals: [planM.waitPct, freeM.waitPct] });
    slotRows.push({ label: lbl.waitMin, vals: [planM.avgWaitMin, freeM.avgWaitMin] });
  }
  if (isSlotMode && caps.hasOrdersCountCol) {
    slotRows.push({ label: lbl.ordersInSlot, vals: [planM.avgOrdersPerSlot, freeM.avgOrdersPerSlot] });
  }

  const slot = {
    columns: ['Плановый', 'Свободный'],
    rowsPerOrder: slotRows,
    rowsTotal: [
      { label: 'Заказов в час', vals: ['SLOT_PLAN_ORD_HR_DYN', 'SLOT_FREE_ORD_HR_DYN'] },
      { label: 'Прибыль в час', vals: ['PLAN_SLOT_DYN', 'FREE_SLOT_DYN'] }
    ]
  };

  // 3. Тотал: Вы (все время) + Вы (выбранный период) + (только в демо) район/город
  const allM = computeGroupOrderMetrics(orders, caps, isSlotMode);
  const totalCols = ['Вы (все время)', 'DYNAMIC_PERIOD_COL'];
  if (isDemo) {
    totalCols.push('AVG_DIST_COL', 'TOP_DIST_COL', 'AVG_CITY_COL', 'TOP_CITY_COL');
  }

  const mkTotalRow = (rowLabel, allVal, dynToken, benchVals) => {
    const vals = [allVal, dynToken];
    if (isDemo && benchVals) vals.push(...benchVals);
    return { label: rowLabel, vals };
  };

  const totalRows = [];
  if (hasDistMetric) totalRows.push(mkTotalRow(lbl.dist, allM.avgDist, 'DYNAMIC_DIST', ['BENCH_DIST_DIST', 'BENCH_TOP_DIST_DIST', 'BENCH_CITY_DIST', 'BENCH_TOP_CITY_DIST']));
  totalRows.push(mkTotalRow(lbl.dur, allM.avgDur, 'DYNAMIC_DUR', ['BENCH_DIST_DUR', 'BENCH_TOP_DIST_DUR', 'BENCH_CITY_DUR', 'BENCH_TOP_CITY_DUR']));
  if (hasWeightMetric) totalRows.push(mkTotalRow(lbl.weight, allM.avgWeight, 'DYNAMIC_WEIGHT', ['BENCH_DIST_WT', 'BENCH_TOP_DIST_WT', 'BENCH_CITY_WT', 'BENCH_TOP_CITY_WT']));
  if (hasDistMetric) totalRows.push(mkTotalRow(lbl.payKm, allM.payPerKm, 'DYNAMIC_PAY_KM', ['BENCH_DIST_PKM', 'BENCH_TOP_DIST_PKM', 'BENCH_CITY_PKM', 'BENCH_TOP_CITY_PKM']));
  if (hasWeightMetric) totalRows.push(mkTotalRow(lbl.payKg, allM.payPerKg, 'DYNAMIC_PAY_KG', ['BENCH_DIST_PKG', 'BENCH_TOP_DIST_PKG', 'BENCH_CITY_PKG', 'BENCH_TOP_CITY_PKG']));
  if (hasWaitMetric) {
    totalRows.push(mkTotalRow(lbl.waitPct, allM.waitPct, 'DYNAMIC_WAIT_PCT', ['BENCH_DIST_WP', 'BENCH_TOP_DIST_WP', 'BENCH_CITY_WP', 'BENCH_TOP_CITY_WP']));
    totalRows.push(mkTotalRow(lbl.waitMin, allM.avgWaitMin, 'DYNAMIC_WAIT_MIN', ['BENCH_DIST_WM', 'BENCH_TOP_DIST_WM', 'BENCH_CITY_WM', 'BENCH_TOP_CITY_WM']));
  }
  if (isSlotMode && caps.hasOrdersCountCol) {
    totalRows.push(mkTotalRow(lbl.ordersInSlot, allM.avgOrdersPerSlot, 'DYNAMIC_ORDERS_IN_SLOT', null));
  }

  const totalOrdRow = {
    label: 'Заказов в час',
    vals: isDemo
      ? ['TOTAL_ORD_HR_DYN', 'DYNAMIC_ORD_HR', 'BENCH_DIST_OHR', 'BENCH_TOP_DIST_OHR', 'BENCH_CITY_OHR', 'BENCH_TOP_CITY_OHR']
      : ['TOTAL_ORD_HR_DYN', 'DYNAMIC_ORD_HR']
  };
  const totalRateRow = {
    label: 'Прибыль в час',
    vals: isDemo
      ? ['ALLTIME', 'DYNAMIC', 'BENCH_DIST_RATE', 'BENCH_TOP_DIST_RATE', 'BENCH_CITY_RATE', 'BENCH_TOP_CITY_RATE']
      : ['ALLTIME', 'DYNAMIC']
  };

  const total = {
    columns: totalCols,
    rowsPerOrder: totalRows,
    rowsTotal: [totalOrdRow, totalRateRow]
  };

  return { transport, slot, total };
}

/**
 * Определение целевого года и параметров сезона (Авто 4 недели / Сезоны с откатом на пред. год при <4 нед.)
 */
function getResolvedSeasonInfo(seasonKey) {
  const allOrders = getActiveOrders();
  const yearsDesc = Array.from(new Set(allOrders.map(o => o.year || o.dateInfo?.year))).filter(Boolean).sort((a, b) => b - a);
  const latestYear = yearsDesc[0] || 2026;

  if (seasonKey === 'auto') {
    return {
      seasonKey: 'auto',
      targetYear: latestYear,
      label: 'Авто (4 нед.)',
      shortLabel: 'Авто (4н)',
      mult: 1.0
    };
  }

  const sMeta = seasonMultipliers[seasonKey] || seasonMultipliers.autumn;
  const sName = sMeta.baseLabel || sMeta.label;
  let targetYear = latestYear;

  if (allOrders.length > 0) {
    const currYearSeasonOrders = allOrders.filter(o => (o.seasonKey || o.dateInfo?.seasonKey) === seasonKey && (o.year || o.dateInfo?.year) === latestYear);
    const distinctWeeksCurr = new Set(currYearSeasonOrders.map(o => o.weekCycleKey || o.weekKey || o.dateInfo?.weekKey)).size;

    if (distinctWeeksCurr >= 4) {
      targetYear = latestYear;
    } else {
      const prevYear = latestYear - 1;
      const prevYearSeasonOrders = allOrders.filter(o => (o.seasonKey || o.dateInfo?.seasonKey) === seasonKey && (o.year || o.dateInfo?.year) === prevYear);
      targetYear = prevYearSeasonOrders.length > 0 ? prevYear : latestYear;
    }
  }

  return {
    seasonKey,
    targetYear,
    label: `${sName} (${targetYear})`,
    shortLabel: `${sName.substring(0, 3)} (${targetYear})`,
    mult: sMeta.mult || 1.0
  };
}

/**
 * Расчет 6x7 матрицы спроса (процент доплаты и часовой доход) из массива заказов/слотов.
 * Длинные слоты пропорционально распределяются по пересекаемым 4-часовым интервалам (с поддержкой перехода через полночь).
 */
function computeHeatmapMatrixFromOrders(ordersList) {
  const heatmapMatrix = [
    { hours: '02:00–06:00', values: [null, null, null, null, null, null, null] },
    { hours: '06:00–10:00', values: [null, null, null, null, null, null, null] },
    { hours: '10:00–14:00', values: [null, null, null, null, null, null, null] },
    { hours: '14:00–18:00', values: [null, null, null, null, null, null, null] },
    { hours: '18:00–22:00', values: [null, null, null, null, null, null, null] },
    { hours: '22:00–02:00', values: [null, null, null, null, null, null, null] }
  ];

  if (!ordersList || ordersList.length === 0) {
    return heatmapMatrix;
  }

  const dayWindows = [
    { r: 5, tag: 'am', start: 0,         end: 2 * 3600 },
    { r: 0, tag: 'd0', start: 2 * 3600,  end: 6 * 3600 },
    { r: 1, tag: 'd1', start: 6 * 3600,  end: 10 * 3600 },
    { r: 2, tag: 'd2', start: 10 * 3600, end: 14 * 3600 },
    { r: 3, tag: 'd3', start: 14 * 3600, end: 18 * 3600 },
    { r: 4, tag: 'd4', start: 18 * 3600, end: 22 * 3600 },
    { r: 5, tag: 'pm', start: 22 * 3600, end: 24 * 3600 }
  ];

  const cells = Array.from({ length: 6 }, () =>
    Array.from({ length: 7 }, () => ({
      grossNoGoal: 0,
      goals: 0,
      surgeWeighted: 0,
      surgeWeightSecs: 0,
      slotWinSpans: new Map()
    }))
  );

  ordersList.forEach(o => {
    const c0 = o.dowIdx;
    if (c0 == null || c0 < 0 || c0 > 6) return;

    const s = Math.max(0, Math.min(86399, Number(o.startSecs || 0)));
    const e = Math.max(0, Math.min(86399, Number(o.endSecs || 0)));

    const segments = [];
    if (e > s) {
      segments.push({ col: c0, from: s, to: e });
    } else if (e < s) {
      segments.push({ col: c0, from: s, to: 86400 });
      if (e > 0) segments.push({ col: (c0 + 1) % 7, from: 0, to: e });
    } else {
      segments.push({ col: c0, from: s, to: Math.min(86400, s + 20 * 60) });
    }

    const totalSpanSecs = Math.max(60, segments.reduce((a, seg) => a + (seg.to - seg.from), 0));
    const oGrossNoGoal = Number(o.orderCost || o.baseCost || 0) + Number(o.wait || 0) + Number(o.surgeRub || 0) + Number(o.ratingRub || 0) + Number(o.bonus || 0) + Number(o.tip || 0);
    const oGoal = Number(o.goal || 0);
    const oSurge = Number(o.surgePct || 0);

    segments.forEach(seg => {
      const col = seg.col;
      dayWindows.forEach(w => {
        const ovFrom = Math.max(seg.from, w.start);
        const ovTo = Math.min(seg.to, w.end);
        const ovSec = ovTo - ovFrom;
        if (ovSec <= 0) return;

        const frac = ovSec / totalSpanSecs;
        const cell = cells[w.r][col];
        cell.grossNoGoal += oGrossNoGoal * frac;
        cell.goals += oGoal * frac;
        cell.surgeWeighted += oSurge * ovSec;
        cell.surgeWeightSecs += ovSec;

        const spanKey = `${o.dateKey || o.date}__${o.slotNumber || 1}__${w.tag}`;
        const prev = cell.slotWinSpans.get(spanKey);
        if (!prev) {
          cell.slotWinSpans.set(spanKey, { minS: ovFrom, maxE: ovTo });
        } else {
          if (ovFrom < prev.minS) prev.minS = ovFrom;
          if (ovTo > prev.maxE) prev.maxE = ovTo;
        }
      });
    });
  });

  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      const cell = cells[r][c];
      if (cell.surgeWeightSecs > 0 && cell.slotWinSpans.size > 0) {
        let totalWorkingSecs = 0;
        cell.slotWinSpans.forEach(sp => {
          totalWorkingSecs += Math.max(5 * 60, sp.maxE - sp.minS);
        });
        const cellHrs = Math.max(0.4, totalWorkingSecs / 3600);
        const avgSurge = Math.round(cell.surgeWeighted / cell.surgeWeightSecs);
        const avgRubHr = Math.round(cell.grossNoGoal / cellHrs);
        const goalsRubHr = Math.round(cell.goals / cellHrs);
        heatmapMatrix[r].values[c] = { pct: avgSurge, rubHr: avgRubHr, goalsRubHr };
      } else {
        heatmapMatrix[r].values[c] = null;
      }
    }
  }

  return heatmapMatrix;
}

/**
 * Получение текущей активной тепловой матрицы с кэшированием (единая логика для Демо и Пользователя)
 */
function getActiveHeatmapMatrix() {
  const allOrders = getActiveOrders();
  if (!allOrders || allOrders.length === 0) {
    return computeHeatmapMatrixFromOrders([]);
  }

  const cacheKey = `${state.usingUserData ? 'u' : 'd'}_${state.season}_ws${state.weekStartDay}`;
  if (dataCache.heatmapBySeason.has(cacheKey)) {
    return dataCache.heatmapBySeason.get(cacheKey);
  }

  let filteredOrders = [];
  if (state.season === 'auto') {
    const weekKeys = Array.from(new Set(allOrders.map(o => o.weekCycleKey || o.weekKey || o.dateInfo?.weekKey)))
      .filter(Boolean)
      .sort();
    const last4WeekKeys = new Set(weekKeys.slice(-4));
    filteredOrders = allOrders.filter(o => last4WeekKeys.has(o.weekCycleKey || o.weekKey || o.dateInfo?.weekKey));
  } else {
    const seasonInfo = getResolvedSeasonInfo(state.season);
    filteredOrders = allOrders.filter(o => {
      const oSeason = o.seasonKey || o.dateInfo?.seasonKey;
      const oYear = o.year || o.dateInfo?.year;
      return oSeason === state.season && oYear === seasonInfo.targetYear;
    });
    if (filteredOrders.length === 0) {
      filteredOrders = allOrders.filter(o => (o.seasonKey || o.dateInfo?.seasonKey) === state.season);
    }
  }

  const matrix = computeHeatmapMatrixFromOrders(filteredOrders.length > 0 ? filteredOrders : allOrders);
  dataCache.heatmapBySeason.set(cacheKey, matrix);
  return matrix;
}

/**
 * Единая агрегация заказов/слотов по дням, неделям, месяцам, тепловой карте и сравнению
 */
function buildDatasetsFromOrders(orders, explicitCaps = null, isDemo = isDemoMode()) {
  const caps = explicitCaps || orders?.capabilities || getDatasetCapabilities();
  const daysMap = new Map();

  orders.forEach(o => {
    const cycle = getWeekCycleInfo(o.dateInfo?.dateObj || getDayDateObj(o), state.weekStartDay);
    if (cycle) o.weekCycleKey = cycle.cycleKey;

    if (!daysMap.has(o.date)) {
      daysMap.set(o.date, {
        dateInfo: o.dateInfo || (o.date ? parseDateInfo(o.date) : null),
        orders: [],
        slotsMap: new Map()
      });
    }
    const dayObj = daysMap.get(o.date);
    dayObj.orders.push(o);

    const sNum = o.slotNumber;
    if (!dayObj.slotsMap.has(sNum)) {
      dayObj.slotsMap.set(sNum, []);
    }
    dayObj.slotsMap.get(sNum).push(o);
  });

  const sortedDates = Array.from(daysMap.keys()).sort();
  const days = [];
  const transportUsage = {};

  sortedDates.forEach(dateKey => {
    const dayObj = daysMap.get(dateKey);
    const dayOrders = dayObj.orders;
    const dateInfo = dayObj.dateInfo || (dayObj.orders[0] && parseDateInfo(dayObj.orders[0].date)) || parseDateInfo(dateKey);

    let totalSlotHours = 0;
    let daySlotExpenses = 0;

    dayObj.slotsMap.forEach(slotOrders => {
      const minStart = Math.min(...slotOrders.map(o => o.startSecs));
      const maxEnd = Math.max(...slotOrders.map(o => o.endSecs));
      const spanSecs = Math.max(15 * 60, (maxEnd >= minStart ? maxEnd - minStart : maxEnd + 86400 - minStart));
      totalSlotHours += Math.max(0.3, spanSecs / 3600);

      const exps = slotOrders.map(o => o.expense).filter(e => e > 0);
      if (exps.length > 0) {
        const allSame = exps.every(e => Math.abs(e - exps[0]) < 0.01);
        daySlotExpenses += allSame ? exps[0] : exps.reduce((a, b) => a + b, 0);
      }
    });

    totalSlotHours = Math.round(totalSlotHours * 10) / 10;
    if (totalSlotHours <= 0) totalSlotHours = 1;

    const ordersCount = dayOrders.reduce((a, o) => a + Number(o.ordersCount || 1), 0);
    const ordersCost = Math.round(dayOrders.reduce((a, o) => a + o.orderCost + (o.wait || 0), 0));
    const surgeRub = Math.round(dayOrders.reduce((a, o) => a + o.surgeRub, 0));
    const surgePct = ordersCost > 0 ? Math.round((surgeRub / ordersCost) * 100) : 0;
    const ratingRub = Math.round(dayOrders.reduce((a, o) => a + o.ratingRub, 0));
    const ratingPct = ordersCost > 0 ? Math.round((ratingRub / ordersCost) * 100) : 0;
    const bonuses = Math.round(dayOrders.reduce((a, o) => a + o.bonus, 0));
    const goals = Math.round(dayOrders.reduce((a, o) => a + o.goal, 0));
    const tips = Math.round(dayOrders.reduce((a, o) => a + (o.tip || 0), 0));
    const adjSum = Math.round(dayOrders.reduce((a, o) => a + Math.abs(Number(o.adjustment || 0)), 0));
    const adjustments = adjSum > 0 ? -adjSum : 0;
    const userSlotExpenses = Math.round(daySlotExpenses);

    const distinctTransports = Array.from(new Set(dayOrders.map(o => o.transportLabel)));
    const transportSummary = distinctTransports.join(' + ');

    const tCounts = {};
    dayOrders.forEach(o => {
      const w = Number(o.ordersCount || 1);
      tCounts[o.transportKey] = (tCounts[o.transportKey] || 0) + w;
      transportUsage[o.transportKey] = (transportUsage[o.transportKey] || 0) + w;
    });
    let domTKey = 'walk';
    let maxCnt = 0;
    Object.keys(tCounts).forEach(k => {
      if (tCounts[k] > maxCnt) {
        maxCnt = tCounts[k];
        domTKey = k;
      }
    });
    const domTLabel = (transportMeta[domTKey] && transportMeta[domTKey].label) || 'Пеший';

    const subRows = [];
    if (distinctTransports.length > 1) {
      distinctTransports.forEach(tLabel => {
        const tOrders = dayOrders.filter(o => o.transportLabel === tLabel);
        if (tOrders.length === 0) return;
        const tKey = tOrders[0].transportKey || 'walk';

        const tSlotsMap = new Map();
        tOrders.forEach(o => {
          if (!tSlotsMap.has(o.slotNumber)) tSlotsMap.set(o.slotNumber, []);
          tSlotsMap.get(o.slotNumber).push(o);
        });

        let tSlotHours = 0;
        let tSlotExpenses = 0;
        tSlotsMap.forEach(slotOrders => {
          const minStart = Math.min(...slotOrders.map(o => o.startSecs));
          const maxEnd = Math.max(...slotOrders.map(o => o.endSecs));
          const spanSecs = Math.max(15 * 60, (maxEnd >= minStart ? maxEnd - minStart : maxEnd + 86400 - minStart));
          tSlotHours += Math.max(0.3, spanSecs / 3600);

          const exps = slotOrders.map(o => o.expense).filter(e => e > 0);
          if (exps.length > 0) {
            const allSame = exps.every(e => Math.abs(e - exps[0]) < 0.01);
            tSlotExpenses += allSame ? exps[0] : exps.reduce((a, b) => a + b, 0);
          }
        });

        tSlotHours = Math.round(tSlotHours * 10) / 10;
        if (tSlotHours <= 0) tSlotHours = 0.5;

        const tOrdersCount = tOrders.reduce((a, o) => a + Number(o.ordersCount || 1), 0);
        const tOrdersCost = Math.round(tOrders.reduce((a, o) => a + o.orderCost + (o.wait || 0), 0));
        const tSurgeRub = Math.round(tOrders.reduce((a, o) => a + o.surgeRub, 0));
        const tSurgePct = tOrdersCost > 0 ? Math.round((tSurgeRub / tOrdersCost) * 100) : 0;
        const tRatingRub = Math.round(tOrders.reduce((a, o) => a + o.ratingRub, 0));
        const tRatingPct = tOrdersCost > 0 ? Math.round((tRatingRub / tOrdersCost) * 100) : 0;
        const tBonuses = Math.round(tOrders.reduce((a, o) => a + o.bonus, 0));
        const tGoals = Math.round(tOrders.reduce((a, o) => a + o.goal, 0));
        const tTips = Math.round(tOrders.reduce((a, o) => a + (o.tip || 0), 0));
        const tAdjSum = Math.round(tOrders.reduce((a, o) => a + Math.abs(Number(o.adjustment || 0)), 0));
        const tAdj = tAdjSum > 0 ? -tAdjSum : 0;
        const tTotalDistance = (caps.hasDistance !== false && tOrders.some(o => o.distance != null))
          ? Math.round(tOrders.reduce((a, o) => a + Number(o.distance || 0), 0) * 10) / 10
          : null;

        subRows.push({
          date: dateInfo.displayDate,
          fullDisplayDate: dateInfo.fullDisplayDate,
          fullDate: dateKey,
          dayOfWeek: dateInfo.dayOfWeek,
          slotHours: tSlotHours,
          ordersCount: tOrdersCount,
          transport: tLabel,
          transportKey: tKey,
          ordersCost: tOrdersCost,
          surgePct: tSurgePct,
          surgeRub: tSurgeRub,
          ratingPct: tRatingPct,
          ratingRub: tRatingRub,
          bonuses: tBonuses,
          goals: tGoals,
          tips: tTips,
          userSlotExpenses: Math.round(tSlotExpenses),
          adjustments: tAdj,
          totalDistance: tTotalDistance,
          orders: tOrders,
          year: dateInfo.year
        });
      });
    }

    const dayTotalDistance = (caps.hasDistance !== false && dayOrders.some(o => o.distance != null))
      ? Math.round(dayOrders.reduce((a, o) => a + Number(o.distance || 0), 0) * 10) / 10
      : null;

    days.push({
      date: dateInfo.displayDate,
      fullDisplayDate: dateInfo.fullDisplayDate,
      fullDate: dateKey,
      dateObj: dateInfo.dateObj,
      dayOfWeek: dateInfo.dayOfWeek,
      slotHours: totalSlotHours,
      ordersCount,
      transport: domTLabel,
      transportKey: domTKey,
      distinctTransports,
      transportSummary,
      ordersCost,
      surgePct,
      surgeRub,
      ratingPct,
      ratingRub,
      bonuses,
      goals,
      tips,
      userSlotExpenses,
      adjustments,
      totalDistance: dayTotalDistance,
      orders: dayOrders,
      subRows: subRows.length > 0 ? subRows : null,
      weekKey: dateInfo.weekKey,
      monthKey: dateInfo.monthKey,
      monthCycleKey: dateInfo.monthCycleKey,
      year: dateInfo.year,
      seasonKey: dateInfo.seasonKey
    });
  });

  let dominantTransportKey = 'walk';
  let maxTU = 0;
  Object.keys(transportUsage).forEach(k => {
    if (transportUsage[k] > maxTU) {
      maxTU = transportUsage[k];
      dominantTransportKey = k;
    }
  });

  const availableSeasons = Array.from(new Set(days.map(d => d.seasonKey)));

  // Группировка по неделям в строгом хронологическом порядке
  const weeksMap = new Map();
  days.forEach(d => {
    const cycle = getWeekCycleInfo(getDayDateObj(d), state.weekStartDay);
    const wkKey = cycle ? cycle.cycleKey : d.weekKey;
    if (!weeksMap.has(wkKey)) {
      weeksMap.set(wkKey, { cycle, days: [] });
    }
    weeksMap.get(wkKey).days.push(d);
  });

  const weeks = [];
  Array.from(weeksMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([wkKey, { cycle, days: wDays }]) => {
      const slotHours = Math.round(wDays.reduce((a, d) => a + d.slotHours, 0) * 10) / 10;
      const ordersCount = wDays.reduce((a, d) => a + d.ordersCount, 0);
      const ordersCost = wDays.reduce((a, d) => a + d.ordersCost, 0);
      const surgeRub = wDays.reduce((a, d) => a + d.surgeRub, 0);
      const surgePct = ordersCost > 0 ? Math.round((surgeRub / ordersCost) * 100) : 0;
      const ratingRub = wDays.reduce((a, d) => a + d.ratingRub, 0);
      const ratingPct = ordersCost > 0 ? Math.round((ratingRub / ordersCost) * 100) : 0;
      const bonuses = wDays.reduce((a, d) => a + d.bonuses, 0);
      const goals = wDays.reduce((a, d) => a + d.goals, 0);
      const tips = wDays.reduce((a, d) => a + d.tips, 0);
      const adjustments = wDays.reduce((a, d) => a + d.adjustments, 0);
      const userSlotExpenses = wDays.reduce((a, d) => a + d.userSlotExpenses, 0);

      const distinctTransports = Array.from(new Set(wDays.flatMap(d => d.distinctTransports)));
      const transportSummary = distinctTransports.join(' + ');
      const wkDisplay = cycle ? cycle.label : (wDays[0].weekKey || 'Неделя');
      const dowDisplay = cycle ? cycle.dayRangeLabel : 'Пн–Вс';
      const weekTotalDistance = (caps.hasDistance !== false && wDays.some(d => d.totalDistance != null))
        ? Math.round(wDays.reduce((a, d) => a + Number(d.totalDistance || 0), 0) * 10) / 10
        : null;
      const wYear = cycle ? cycle.cycleEnd.getFullYear() : (wDays[0].year || 2026);

      weeks.push({
        date: wkDisplay,
        dateRange: dowDisplay,
        weekCycleKey: wkKey,
        fullDisplayDate: `${wkDisplay} (${wYear})`,
        dayOfWeek: dowDisplay,
        days: wDays,
        slotHours,
        ordersCount,
        transport: wDays[0].transport,
        transportKey: wDays[0].transportKey,
        distinctTransports,
        transportSummary,
        ordersCost,
        surgePct,
        surgeRub,
        ratingPct,
        ratingRub,
        bonuses,
        goals,
        tips,
        userSlotExpenses,
        adjustments,
        totalDistance: weekTotalDistance,
        year: wYear
      });
    });

  // Группировка по месяцам с учетом года (YYYY-MM), чтобы 1.5 года не склеивались по названию месяца
  const monthsMap = new Map();
  days.forEach(d => {
    const mck = d.monthCycleKey || `${d.year || 2026}-${d.monthKey}`;
    if (!monthsMap.has(mck)) monthsMap.set(mck, []);
    monthsMap.get(mck).push(d);
  });

  const months = [];
  Array.from(monthsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([mck, mDays]) => {
      const mk = mDays[0].monthKey;
      const mYear = mDays[0].year || 2026;
      const slotHours = Math.round(mDays.reduce((a, d) => a + d.slotHours, 0) * 10) / 10;
      const ordersCount = mDays.reduce((a, d) => a + d.ordersCount, 0);
      const ordersCost = mDays.reduce((a, d) => a + d.ordersCost, 0);
      const surgeRub = mDays.reduce((a, d) => a + d.surgeRub, 0);
      const surgePct = ordersCost > 0 ? Math.round((surgeRub / ordersCost) * 100) : 0;
      const ratingRub = mDays.reduce((a, d) => a + d.ratingRub, 0);
      const ratingPct = ordersCost > 0 ? Math.round((ratingRub / ordersCost) * 100) : 0;
      const bonuses = mDays.reduce((a, d) => a + d.bonuses, 0);
      const goals = mDays.reduce((a, d) => a + d.goals, 0);
      const tips = mDays.reduce((a, d) => a + d.tips, 0);
      const adjustments = mDays.reduce((a, d) => a + d.adjustments, 0);
      const userSlotExpenses = mDays.reduce((a, d) => a + d.userSlotExpenses, 0);

      const distinctTransports = Array.from(new Set(mDays.flatMap(d => d.distinctTransports)));
      const transportSummary = distinctTransports.join(' + ');
      const monthTotalDistance = (caps.hasDistance !== false && mDays.some(d => d.totalDistance != null))
        ? Math.round(mDays.reduce((a, d) => a + Number(d.totalDistance || 0), 0) * 10) / 10
        : null;

      months.push({
        date: mk,
        monthKey: mk,
        monthCycleKey: mck,
        fullDisplayDate: `${mk} ${mYear}`,
        dayOfWeek: 'Месяц',
        days: mDays,
        slotHours,
        ordersCount,
        transport: mDays[0].transport,
        transportKey: mDays[0].transportKey,
        distinctTransports,
        transportSummary,
        ordersCost,
        surgePct,
        surgeRub,
        ratingPct,
        ratingRub,
        bonuses,
        goals,
        tips,
        userSlotExpenses,
        adjustments,
        totalDistance: monthTotalDistance,
        year: mYear,
        daysCount: mDays.length
      });
    });

  const comparisonDatasets = buildComparisonDatasets(orders, days, isDemo, caps);
  const distinctTransports = Array.from(new Set(orders.map(o => o.transportLabel)));

  return {
    orders,
    capabilities: caps,
    days,
    weeks,
    months,
    comparisonDatasets,
    dominantTransportKey,
    availableSeasons,
    distinctTransports
  };
}

/**
 * Единая активация распарсенного датасета (используется как для assets/demo_data.json.gz, так и для файлов пользователя)
 */
function applyLoadedDataset(rawRows, fileName, isUser, timingInfo = null, options = {}) {
  let parsedOrders;
  let parseMs = 0;

  if (Array.isArray(rawRows) && rawRows.length > 0 && !Array.isArray(rawRows[0]) && typeof rawRows[0] === 'object') {
    parsedOrders = rawRows.map(o => {
      if (!o.dateInfo && o.date) {
        const di = parseDateInfo(o.date);
        return {
          ...o,
          dateInfo: di,
          date: di.isoDate || o.date,
          displayDate: di.displayDate,
          fullDisplayDate: di.fullDisplayDate,
          dayOfWeek: di.dayOfWeek,
          dowIdx: di.dowIdx,
          year: di.year,
          seasonKey: di.seasonKey
        };
      }
      return o;
    });
    if (rawRows.capabilities) {
      parsedOrders.capabilities = rawRows.capabilities;
    }
  } else {
    if (!rawRows || rawRows.length < 2) {
      showToast('Файл пуст или содержит только строку заголовков');
      return false;
    }

    const tParseStart = performance.now();
    parsedOrders = parseOrdersFromRows(rawRows);
    parseMs = Math.round(performance.now() - tParseStart);

    if (parsedOrders.length === 0) {
      showToast('Не удалось распознать заказы в файле');
      return false;
    }
  }

  const tAggStart = performance.now();
  const caps = parsedOrders.capabilities || {};
  const datasets = buildDatasetsFromOrders(parsedOrders, caps, !isUser);
  const aggMs = Math.round(performance.now() - tAggStart);

  state.usingUserData = !!isUser;
  state.showBenchmarks = !isUser;
  state.activeFileName = fileName;
  state.userDataFileName = isUser ? fileName : '';
  state.activeOrders = parsedOrders;
  state.activeDatasets = datasets;
  state.datasetCapabilities = caps;
  state.period = 'days';
  state.season = 'auto';
  if (isUser) {
    state.weatherBoost = false;
  }
  state.heatUnitRub = (caps.hasSurgeCol === false);
  if (caps.hasSlotType === false && state.compareMode === 'slot') {
    state.compareMode = 'transport';
  }
  if (caps.hasGoals === false) {
    state.includeGoals = false;
  }
  state.expandedDateKeys.clear();
  state.expandedOrderKeys.clear();
  state.selectedBarIndex = Math.max(0, datasets.days.length - 1);

  if (datasets.dominantTransportKey) {
    state.accountTransport = datasets.dominantTransportKey;
    state.selectedPreset = datasets.dominantTransportKey;
  } else {
    state.accountTransport = 'ebike';
    state.selectedPreset = 'ebike';
  }

  dataCache.invalidate();

  if (isUser) {
    state.selectedSlotCells = [];
  } else {
    // Выбираем дефолтные 5 пиковых слотов для демонстрации планировщика (проверяя их наличие в матрице)
    const activeM = getActiveHeatmapMatrix();
    const pref = ['4-4', '4-5', '4-6', '2-4', '2-5'].filter(k => {
      const [rr, cc] = k.split('-').map(Number);
      return activeM[rr] && activeM[rr].values[cc] !== null;
    });
    if (pref.length === 5) {
      state.selectedSlotCells = pref;
    } else {
      const ranked = [];
      activeM.forEach((rowObj, rr) => {
        rowObj.values.forEach((v, cc) => {
          if (v !== null) ranked.push({ k: `${rr}-${cc}`, p: v.pct || 0 });
        });
      });
      ranked.sort((a, b) => b.p - a.p);
      state.selectedSlotCells = ranked.slice(0, 5).map(x => x.k);
    }
  }

  if (dom.btnResetData) dom.btnResetData.classList.toggle('hidden', !isUser);
  const totalOrdersCount = parsedOrders.reduce((a, o) => a + Number(o.ordersCount || 1), 0);
  state.currentFileName = fileName;
  if (dom.dataStatusBadge) {
    if (isUser) {
      const unitWord = caps.isPureSlotLevel ? 'слот.' : 'зак.';
      const unitCount = caps.isPureSlotLevel ? parsedOrders.length : totalOrdersCount;
      if (state.syncMode === 'yandex') {
        dom.dataStatusBadge.innerHTML = `Источник: <b class="text-emerald-400">Яндекс.Диск (${unitCount} ${unitWord})</b>`;
        dom.dataStatusBadge.title = `Синхронизация Яндекс.Диск: ${parsedOrders.length} строк, ${totalOrdersCount} заказов`;
      } else if (fileName === 'IndexedDB' || fileName === 'Локальная база' || !fileName) {
        dom.dataStatusBadge.innerHTML = `Источник: <b class="text-emerald-400">Локальная база (${unitCount} ${unitWord})</b>`;
        dom.dataStatusBadge.title = `Локальное хранилище IndexedDB: ${parsedOrders.length} строк, ${totalOrdersCount} заказов`;
      } else {
        dom.dataStatusBadge.innerHTML = `Источник: <b class="text-emerald-400">Файл «${escapeHtml(fileName)}» (${unitCount} ${unitWord})</b>`;
        dom.dataStatusBadge.title = `Пользовательский файл: ${parsedOrders.length} строк, ${totalOrdersCount} заказов`;
      }
    } else {
      dom.dataStatusBadge.innerHTML = 'Источник: <b class="text-amber-500">Демо-данные</b>';
      dom.dataStatusBadge.title = `Демо-файл ${fileName} (1,5 года • ${totalOrdersCount} заказов)`;
    }
  }

  if (!isUser) {
    state.demoLoadMetrics = {
      ...(timingInfo || {}),
      parseMs,
      aggMs,
      totalMs: Math.round((timingInfo?.fetchMs || 0) + (timingInfo?.decodeMs ?? timingInfo?.xlsxReadMs ?? 0) + parseMs + aggMs),
      rowsCount: rawRows.length - 1,
      ordersCount: totalOrdersCount,
      daysCount: datasets.days.length,
      weeksCount: datasets.weeks.length,
      monthsCount: datasets.months.length
    };
  }

  renderAll();

  // Обновление состояния кнопки экспорта резервной копии
  if (typeof updateBackupButtonsState === 'function') {
    updateBackupButtonsState();
  }

  // Автосохранение в IndexedDB (Dexie) при изменениях пользовательских данных
  const skipDbSave = options && options.skipDbSave;
  const skipCloudUpload = options && options.skipCloudUpload;
  const preserveTimestamp = options && options.preserveTimestamp;

  if (isUser && state.syncMode !== 'session' && !skipDbSave && typeof saveOrdersToIndexedDB === 'function') {
    saveOrdersToIndexedDB(parsedOrders, { preserveTimestamp }).catch(e => console.warn('Dexie auto-save error:', e));
  }

  // Облачная синхронизация с Яндекс.Диском (если активен режим Яндекс Диска и это не импорт из облака)
  if (isUser && state.syncMode === 'yandex' && state.yandexToken && !skipCloudUpload && fileName !== 'Яндекс.Диск' && typeof uploadToYandexDisk === 'function') {
    uploadToYandexDisk(parsedOrders, { isOrdersOnly: true }).catch(e => console.warn('Yandex upload error:', e));
  }

  return true;
}

/**
 * Синхронное обновление текстового бейджа источника данных
 */
function refreshDataStatusBadge() {
  if (!dom.dataStatusBadge) return;
  if (!state.usingUserData) {
    const totalOrdersCount = (state.activeOrders || []).reduce((a, o) => a + Number(o.ordersCount || 1), 0);
    dom.dataStatusBadge.innerHTML = 'Источник: <b class="text-amber-500">Демо-данные</b>';
    dom.dataStatusBadge.title = `Демо-данные (1,5 года • ${totalOrdersCount} заказов)`;
    return;
  }
  const caps = state.datasetCapabilities || {};
  const unitWord = caps.isPureSlotLevel ? 'слот.' : 'зак.';
  const totalOrdersCount = (state.activeOrders || []).reduce((a, o) => a + Number(o.ordersCount || 1), 0);
  const unitCount = caps.isPureSlotLevel ? (state.activeOrders || []).length : totalOrdersCount;
  const fileName = state.currentFileName || '';

  if (state.syncMode === 'yandex') {
    dom.dataStatusBadge.innerHTML = `Источник: <b class="text-emerald-400">Яндекс.Диск (${unitCount} ${unitWord})</b>`;
    dom.dataStatusBadge.title = `Синхронизация Яндекс.Диск: ${(state.activeOrders || []).length} строк, ${totalOrdersCount} заказов`;
  } else if (fileName === 'IndexedDB' || fileName === 'Локальная база' || !fileName) {
    dom.dataStatusBadge.innerHTML = `Источник: <b class="text-emerald-400">Локальная база (${unitCount} ${unitWord})</b>`;
    dom.dataStatusBadge.title = `Локальное хранилище IndexedDB: ${(state.activeOrders || []).length} строк, ${totalOrdersCount} заказов`;
  } else {
    dom.dataStatusBadge.innerHTML = `Источник: <b class="text-emerald-400">Файл «${escapeHtml(fileName)}» (${unitCount} ${unitWord})</b>`;
    dom.dataStatusBadge.title = `Пользовательский файл: ${(state.activeOrders || []).length} строк, ${totalOrdersCount} заказов`;
  }
}

/**
 * Обработка строк пользовательских данных после чтения файла
 */
function processLoadedRows(rawRows, fileName) {
  const ok = applyLoadedDataset(rawRows, fileName, true);
  if (ok) {
    const totalOrd = state.activeOrders.reduce((a, o) => a + Number(o.ordersCount || 1), 0);
    const label = state.datasetCapabilities?.isPureSlotLevel
      ? `${state.activeOrders.length} слот. (${totalOrd} зак.)`
      : `${totalOrd} заказов`;
    showToast(`Загружено ${label} из «${fileName}»! Все расчеты обновлены.`);
  }
}

const CDN_XLSX_URL = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
const CDN_FFLATE_URL = 'https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js';
const _lazyScriptPromises = new Map();

/**
 * Однократная ленивая подгрузка внешнего скрипта с защитой от дублирования запросов
 */
function loadExternalScriptOnce(url, isReadyFn, label = 'внешний модуль') {
  if (typeof isReadyFn === 'function' && isReadyFn()) {
    return Promise.resolve();
  }
  if (_lazyScriptPromises.has(url)) {
    return _lazyScriptPromises.get(url);
  }
  const p = new Promise((resolve, reject) => {
    const existing = Array.from(document.scripts || []).find(s => s.src === url);
    if (existing && typeof isReadyFn === 'function' && isReadyFn()) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => {
      if (typeof isReadyFn !== 'function' || isReadyFn()) {
        resolve();
      } else {
        _lazyScriptPromises.delete(url);
        reject(new Error(`Не удалось инициализировать ${label}`));
      }
    };
    script.onerror = () => {
      _lazyScriptPromises.delete(url);
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error(`Ошибка сети при загрузке: ${label}`));
    };
    document.head.appendChild(script);
  });
  _lazyScriptPromises.set(url, p);
  return p;
}

function ensureXlsxLoaded() {
  return loadExternalScriptOnce(CDN_XLSX_URL, () => typeof XLSX !== 'undefined', 'модуль Excel (SheetJS)');
}

function ensureFflateLoaded() {
  return loadExternalScriptOnce(
    CDN_FFLATE_URL,
    () => typeof window.fflate !== 'undefined' && typeof window.fflate.gunzipSync === 'function',
    'модуль распаковки gzip (fflate)'
  );
}

/**
 * Декодирование ArrayBuffer из demo_data.json.gz с проверкой magic bytes gzip (0x1f 0x8b),
 * защитой от двойной декомпрессии и фолбэком на fflate для старых браузеров (iOS < 16.4)
 */
async function decodeDemoJsonBuffer(buf) {
  const u8 = new Uint8Array(buf);
  const isGzip = u8.length >= 2 && u8[0] === 0x1f && u8[1] === 0x8b;
  let jsonText = '';
  if (!isGzip) {
    jsonText = new TextDecoder('utf-8').decode(u8);
  } else if (typeof DecompressionStream === 'function') {
    try {
      const ds = new DecompressionStream('gzip');
      const stream = new Blob([u8]).stream().pipeThrough(ds);
      jsonText = await new Response(stream).text();
    } catch (dsErr) {
      await ensureFflateLoaded();
      const rawU8 = window.fflate.gunzipSync(u8);
      jsonText = new TextDecoder('utf-8').decode(rawU8);
    }
  } else {
    await ensureFflateLoaded();
    const rawU8 = window.fflate.gunzipSync(u8);
    jsonText = new TextDecoder('utf-8').decode(rawU8);
  }
  return JSON.parse(jsonText);
}

/**
 * Асинхронная загрузка компактного эталонного демо-файла assets/demo_data.json.gz (1.5 года)
 */
async function loadDemoDataset() {
  try {
    // Защита: если пользовательские данные уже активны, никогда не перезаписывать их демо-файлом
    if (state.usingUserData && state.activeOrders && state.activeOrders.length > 0) {
      console.log('Пользовательские данные активны, загрузка демо-файла пропущена.');
      state.demoReady = true;
      window.__appReady = true;
      return;
    }

    if (state.demoCachedRawRows) {
      if (state.usingUserData && state.activeOrders && state.activeOrders.length > 0) return;
      applyLoadedDataset(state.demoCachedRawRows, 'demo_data.json.gz', false, state.demoLoadMetrics);
      state.demoReady = true;
      window.__appReady = true;
      return;
    }

    const tFetchStart = performance.now();
    const resp = await fetch('./assets/demo_data.json.gz?v=14.2.0');
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} при загрузке demo_data.json.gz`);
    }
    const buf = await resp.arrayBuffer();
    const fetchMs = Math.round(performance.now() - tFetchStart);
    const fileSizeKB = Math.round((buf.byteLength / 1024) * 100) / 100;

    const tDecodeStart = performance.now();
    const rawRows = await decodeDemoJsonBuffer(buf);
    const decodeMs = Math.round(performance.now() - tDecodeStart);

    // Повторная проверка: если во время fetch/decode пользовательские данные были восстановлены, не перезаписывать
    if (state.usingUserData && state.activeOrders && state.activeOrders.length > 0) {
      console.log('Пользовательские данные были восстановлены во время загрузки демо, применение демо отменено.');
      state.demoReady = true;
      window.__appReady = true;
      return;
    }

    state.demoCachedRawRows = rawRows;
    applyLoadedDataset(rawRows, 'demo_data.json.gz', false, { fileSizeKB, fetchMs, decodeMs, xlsxReadMs: decodeMs });
    state.demoReady = true;
    window.__appReady = true;
  } catch (err) {
    console.error('Ошибка загрузки демо-данных:', err);
    if (dom.dataStatusBadge) {
      dom.dataStatusBadge.innerHTML = 'Источник: <b class="text-rose-500">Ошибка загрузки демо-данных</b>';
    }
    window.__appReady = true;
  }
}

/**
 * Инициация диалога выбора файла в Windows
 */
function triggerUserDataFileInput() {
  if (dom.userDataFileInput) {
    dom.userDataFileInput.value = '';
    dom.userDataFileInput.click();
  }
}

/**
 * Обработчик загрузки файла пользователем (Excel .xlsx/.xls или CSV/.txt)
 */
async function handleUserDataFileUpload(event) {
  closeImportModal();
  closeImportDropdown();
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const MAX_FILE_SIZE = 25 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    showToast('Файл слишком большой (максимум 25 МБ)');
    if (event.target) event.target.value = '';
    return;
  }

  const executeFileRead = async () => {
    const showLoading = (text = 'Обработка данных...') => {
      if (dom.fileLoadingOverlay) {
        if (dom.fileLoadingText) dom.fileLoadingText.textContent = text;
        dom.fileLoadingOverlay.classList.remove('hidden');
      }
    };
    const hideLoading = () => {
      if (dom.fileLoadingOverlay) dom.fileLoadingOverlay.classList.add('hidden');
      if (event.target) event.target.value = '';
    };

    const fileName = file.name;
    const lowerName = fileName.toLowerCase();
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.ods');

    const reader = new FileReader();

    if (isExcel) {
      try {
        const needXlsxLoad = (typeof XLSX === 'undefined');
        showLoading(needXlsxLoad ? 'Загрузка модуля Excel...' : 'Чтение файла...');
        const [, buf] = await Promise.all([
          ensureXlsxLoaded(),
          new Promise((resolve, reject) => {
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Ошибка при чтении файла'));
            reader.readAsArrayBuffer(file);
          })
        ]);
        showLoading('Обработка таблицы...');
        await new Promise(r => setTimeout(r, 20));
        const data = new Uint8Array(buf);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null });
        processLoadedRows(rawRows, fileName);
      } catch (err) {
        console.error('Ошибка чтения Excel:', err);
        const msg = String(err?.message || err || '');
        showToast(msg.includes('модуль Excel') ? msg : ('Ошибка при чтении Excel-файла: ' + msg));
      } finally {
        hideLoading();
      }
    } else {
      showLoading('Чтение файла...');
      reader.onerror = function() {
        hideLoading();
        showToast('Ошибка при чтении файла');
      };
      reader.onload = function(e) {
        setTimeout(() => {
          try {
            let text = e.target.result;
            // Автоопределение кодировки: если UTF-8 вернул маркеры , пробуем прочесть как Windows-1251 (русскоязычный Excel)
            if (text && text.includes('\uFFFD') && typeof FileReader !== 'undefined') {
              try {
                const r1251 = new FileReader();
                r1251.onload = function(ev) {
                  try {
                    const text1251 = ev.target.result;
                    const rawRows1251 = parseCSVText(text1251);
                    processLoadedRows(rawRows1251, fileName);
                  } catch (err1251) {
                    processLoadedRows(parseCSVText(text), fileName);
                  } finally {
                    hideLoading();
                  }
                };
                r1251.onerror = function() {
                  processLoadedRows(parseCSVText(text), fileName);
                  hideLoading();
                };
                r1251.readAsText(file, 'windows-1251');
                return;
              } catch (_) {}
            }
            const rawRows = parseCSVText(text);
            processLoadedRows(rawRows, fileName);
          } catch (err) {
            console.error('Ошибка чтения CSV:', err);
            showToast('Ошибка при чтении CSV-файла: ' + err.message);
          } finally {
            hideLoading();
          }
        }, 20);
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  if (state.usingUserData && state.activeOrders && state.activeOrders.length > 0) {
    const count = state.activeOrders.length;
    openConfirmActionModal(
      'Заменить текущие данные?',
      `У вас уже загружены рабочие данные (${count} смен). Загрузка нового файла «${escapeHtml(file.name)}» полностью заменит текущий набор смен в памяти и хранилище.`,
      'Рекомендуется предварительно скачать резервную копию текущих смен (.xlsx / .csv).',
      () => {
        executeFileRead();
      }
    );
    return;
  }

  executeFileRead();
}


/**
 * Modern HTML5 <dialog> show helper (modern-web-guidance: dialog)
 * Activates Top Layer, native focus containment, and synchronization with .hidden
 */
function showModalDialog(modalEl) {
  if (!modalEl) return;
  modalEl.classList.remove('hidden');
  if (typeof modalEl.showModal === 'function' && !modalEl.open) {
    try {
      modalEl.showModal();
    } catch (e) {
      // In case dialog is already open or unsupported
    }
  }
  if (!modalEl._hasDialogListeners) {
    modalEl.addEventListener('cancel', () => {
      modalEl.classList.add('hidden');
      });
    modalEl.addEventListener('close', () => {
      modalEl.classList.add('hidden');
      });
    modalEl._hasDialogListeners = true;
  }
}

/**
 * Modern HTML5 <dialog> close helper (modern-web-guidance: dialog)
 * Closes Top Layer, restores focus, and synchronizes with .hidden
 */
function closeModalDialog(modalEl) {
  if (!modalEl) return;
  modalEl.classList.add('hidden');
  if (typeof modalEl.close === 'function' && modalEl.open) {
    try {
      modalEl.close();
    } catch (e) {
      // In case dialog is already closed
    }
  }
}

// -----------------------------------------------------------------------------
// МОДАЛЬНЫЕ ОКНА ПОДТВЕРЖДЕНИЯ ДЕЙСТВИЙ (v14.6.0)
// -----------------------------------------------------------------------------

function openResetConfirmModal() {
  const modal = document.getElementById('resetConfirmModal');
  if (modal) {
    showModalDialog(modal);
  }
}

function closeResetConfirmModal() {
  const modal = document.getElementById('resetConfirmModal');
  if (modal) {
    closeModalDialog(modal);
  }
}

function confirmResetToDemo() {
  closeResetConfirmModal();
  closeSyncModal();
  executeResetToDemoData();
}

let pendingActionCallback = null;

function openConfirmActionModal(title, message, subMessage, onConfirm) {
  const modal = document.getElementById('confirmActionModal');
  const titleEl = document.getElementById('confirmActionTitle');
  const msgEl = document.getElementById('confirmActionMessage');
  const subMsgEl = document.getElementById('confirmActionSubMessage');
  const submitBtn = document.getElementById('btnConfirmActionSubmit');

  if (titleEl) titleEl.textContent = title || 'Подтверждение действия';
  if (msgEl) msgEl.textContent = message || '';
  if (subMsgEl) subMsgEl.textContent = subMessage || 'Рекомендуется предварительно скачать резервную копию.';

  pendingActionCallback = (typeof onConfirm === 'function') ? onConfirm : null;

  if (submitBtn) {
    submitBtn.onclick = confirmActionSubmit;
  }

  if (modal) {
    showModalDialog(modal);
  }
}

function confirmActionSubmit() {
  const cb = pendingActionCallback;
  pendingActionCallback = null;
  closeConfirmActionModal();
  if (typeof cb === 'function') {
    try {
      cb();
    } catch (err) {
      console.error('Ошибка исполнения callback в confirmActionSubmit:', err);
    }
  }
}

function closeConfirmActionModal() {
  const modal = document.getElementById('confirmActionModal');
  if (modal) {
    closeModalDialog(modal);
  }
  pendingActionCallback = null;
}

/**
 * Сброс загруженных данных и возврат к эталонному демо-файлу (из кэша в ОЗУ или с повторным fetch)
 */
function resetToDemoData() {
  if (state.usingUserData) {
    openResetConfirmModal();
    return;
  }
  executeResetToDemoData();
}

function executeResetToDemoData() {
  state.weatherBoost = false;

  // Очистка пользовательских данных в IndexedDB при сбросе к демо
  if (window.courierDB && window.courierDB.orders) {
    window.courierDB.orders.clear().catch(e => console.warn('Dexie clear error:', e));
  }
  state.usingUserData = false;

  if (typeof updateBackupButtonsState === 'function') {
    updateBackupButtonsState();
  }

  if (state.demoCachedRawRows) {
    applyLoadedDataset(state.demoCachedRawRows, 'demo_data.json.gz', false, state.demoLoadMetrics);
    showToast('Возврат к демонстрационным данным');
  } else {
    state.usingUserData = false;
    loadDemoDataset().then(() => {
      showToast('Возврат к демонстрационным данным');
      if (typeof updateBackupButtonsState === 'function') {
        updateBackupButtonsState();
      }
    });
  }
}

/**
 * Применение режима отображения: Телефон / ПК (на всю ширину)
 */
function applyLayoutMode(mode, showNotification = false) {
  state.layoutMode = mode === 'pc' ? 'pc' : 'phone';
  const isPc = state.layoutMode === 'pc';
  document.body.classList.toggle('desktop-mode', isPc);
  if (dom.lblLayoutMode) dom.lblLayoutMode.textContent = isPc ? 'Мобильная' : 'ПК';
  if (dom.lblLayoutIcon) {
    // Preserve string pattern for test suite backward compatibility
    dom.lblLayoutIcon.textContent = isPc ? '📱' : '💻';
    // Render clean SVG line icon
    dom.lblLayoutIcon.innerHTML = isPc
      ? '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
      : '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
  }
    const svgLayout = isPc
      ? '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>'
      : '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>';
    document.querySelectorAll('#lblLayoutIcon, #lblLayoutIconMobile').forEach(el => { el.innerHTML = svgLayout; });
  if (dom.btnLayoutMode) {
    dom.btnLayoutMode.title = isPc ? 'Переключить на мобильную версию' : 'Переключить на версию для ПК';
  }
  if (showNotification) {
    showToast(isPc ? 'Режим: ПК (на всю ширину браузера)' : 'Режим: Телефон (компактный)');
    saveAppSettings();
  }
  syncMobileSourceClusterWidth();
  repositionChartBenchmarks();
}

/**
 * Переключение режима отображения: Телефон / ПК (на всю ширину)
 */
function toggleLayoutMode() {
  const newMode = state.layoutMode === 'phone' ? 'pc' : 'phone';
  applyLayoutMode(newMode, true);
}

// -----------------------------------------------------------------------------
// 4. МАТЕМАТИКА И ВЫЧИСЛЕНИЯ
// -----------------------------------------------------------------------------

function getPeriodExpenseFactor(periodKey, rawRow = null) {
  if (periodKey === 'days') return 1 / 7;
  if (periodKey === 'months') {
    if (rawRow) {
      const days = getDaysInMonthFromRow(rawRow);
      return days / 7;
    }
    return 30.4167 / 7;
  }
  return 1;
}

function getWeeklyExpenseForTransport(transportKey) {
  const list = state.expensesByTransport[transportKey] || [];
  return list.reduce((acc, item) => acc + Number(item.value || 0), 0);
}

const getTotalWeeklyExpenses = () => getWeeklyExpenseForTransport(state.selectedPreset);

function enrichRow(rawRow, periodKey, dayMeta = null) {
  const goalsVal = state.includeGoals ? rawRow.goals : 0;
  const grossTotal = rawRow.ordersCost + rawRow.surgeRub + rawRow.ratingRub + rawRow.bonuses + goalsVal + rawRow.tips;
  const tax = taxOf(grossTotal);

  const slotTransportKey = rawRow.transportKey || state.selectedPreset || 'ebike';
  const slotExpensesList = state.expensesByTransport[slotTransportKey] || [];

  let itemizedExpenses = [];
  if (periodKey === 'days') {
    // 7-дневный цикл списания: 1/7 в обычные дни и остаток на последний отработанный день недели
    itemizedExpenses = slotExpensesList.map(e => {
      const val = Number(e.value || 0);
      const baseDailyRate = Math.round(val / 7);
      let amount = baseDailyRate;
      if (dayMeta && dayMeta.isLastWorkedDay) {
        const priorDays = Math.max(0, (dayMeta.totalWorkedDaysInCycle || 1) - 1);
        amount = Math.max(0, val - priorDays * baseDailyRate);
      }
      return {
        name: e.name,
        amount
      };
    });
  } else if (periodKey === 'months') {
    // Плавающий коэффициент месяца: точное количество дней в месяце / 7
    const daysInMonth = getDaysInMonthFromRow(rawRow);
    const monthFactor = daysInMonth / 7;
    itemizedExpenses = slotExpensesList.map(e => ({
      name: e.name,
      amount: Math.round(Number(e.value || 0) * monthFactor)
    }));
  } else {
    // Недели: недельный расход в полном объеме (коэффициент 1.0)
    itemizedExpenses = slotExpensesList.map(e => ({
      name: e.name,
      amount: Math.round(Number(e.value || 0))
    }));
  }

  const baseExpense = itemizedExpenses.reduce((a, b) => a + b.amount, 0);
  const userExpense = Math.round(Number(rawRow.userSlotExpenses || 0));
  if (userExpense > 0) {
    itemizedExpenses.push({
      name: 'Расход (по слотам)',
      amount: userExpense
    });
  }
  const rowExpense = baseExpense + userExpense;

  const penaltyAdjustments = -Math.abs(Number(rawRow.adjustments || 0));
  const netProfit = grossTotal - tax - rowExpense + penaltyAdjustments;
  const ordersPerHr = rawRow.slotHours > 0 ? (rawRow.ordersCount / rawRow.slotHours).toFixed(2) : '0.00';
  const profitPerHr = rawRow.slotHours > 0 ? Math.round(netProfit / rawRow.slotHours) : 0;
  const grossPerHr = rawRow.slotHours > 0 ? Math.round(grossTotal / rawRow.slotHours) : 0;

  // Чистая прибыль и ставка в час без доплат и бонусов
  const surchargesAndBonuses = (rawRow.surgeRub || 0) + (rawRow.ratingRub || 0) + (rawRow.bonuses || 0) + goalsVal;
  const netProfitNoBonus = netProfit - Math.round(surchargesAndBonuses * (1 - TAX_RATE));
  const profitPerHrNoBonus = rawRow.slotHours > 0 ? Math.round(netProfitNoBonus / rawRow.slotHours) : 0;

  let dayOfWeek = rawRow.dayOfWeek;
  if (periodKey === 'weeks') {
    const sName = shortDayNames[state.weekStartDay] || 'Пн';
    const eName = shortDayNames[(state.weekStartDay + 6) % 7] || 'Вс';
    dayOfWeek = `${sName}–${eName}`;
  }

  return {
    ...rawRow,
    dayOfWeek,
    dateRange: rawRow.dateRange || null,
    days: rawRow.days || null,
    adjustments: penaltyAdjustments,
    goals: goalsVal,
    grossTotal,
    grossPerHr,
    tax,
    expenses: rowExpense,
    itemizedExpenses,
    netProfit,
    netProfitNoBonus,
    ordersPerHr,
    profitPerHr,
    profitPerHrNoBonus
  };
}

function enrichDailyDataset(dayRows) {
  if (!dayRows || dayRows.length === 0) return [];

  // Группировка дней по 7-дневным недельным циклам от выбранного state.weekStartDay
  const cycleMap = new Map();
  dayRows.forEach((row, idx) => {
    const dObj = row.dateObj || getDayDateObj(row);
    const cycle = getWeekCycleInfo(dObj, state.weekStartDay);
    const key = cycle ? cycle.cycleKey : 'default';
    if (!cycleMap.has(key)) {
      cycleMap.set(key, []);
    }
    cycleMap.get(key).push({ row, idx, dateMs: dObj.getTime() });
  });

  const metaByIndex = new Map();
  cycleMap.forEach((items) => {
    items.sort((a, b) => a.dateMs - b.dateMs);
    const totalDaysInCycle = items.length;
    items.forEach((item, pos) => {
      const isLastWorkedDay = (pos === totalDaysInCycle - 1);
      metaByIndex.set(item.idx, {
        isLastWorkedDay,
        dayPosition: pos + 1,
        totalWorkedDaysInCycle: totalDaysInCycle
      });
    });
  });

  return dayRows.map((rawRow, idx) => {
    const meta = metaByIndex.get(idx) || { isLastWorkedDay: true, dayPosition: 1, totalWorkedDaysInCycle: 1 };
    const enriched = enrichRow(rawRow, 'days', meta);
    const dObj = enriched.dateObj || getDayDateObj(enriched);
    const cycle = getWeekCycleInfo(dObj, state.weekStartDay);
    if (cycle) {
      enriched.weekCycleKey = cycle.cycleKey;
      enriched.weekCycle = cycle;
    }
    if (Array.isArray(rawRow.subRows) && rawRow.subRows.length > 0) {
      enriched.subRows = rawRow.subRows.map(sr => enrichRow(sr, 'days', meta));
    }
    return enriched;
  });
}

/**
 * Вспомогательная функция для агрегации подстрок по видам транспорта в неделях и месяцах
 */
function buildSubRowsFromEnrichedItems(items, dateDisplay, fullDisplayDate, dowDisplay, year) {
  const allTransports = Array.from(new Set(items.flatMap(d => {
    if (Array.isArray(d.subRows) && d.subRows.length > 0) {
      return d.subRows.map(sr => sr.transport);
    }
    return [d.transport || 'Курьер'];
  })));

  if (allTransports.length <= 1) return null;

  const subRows = [];
  allTransports.forEach(tName => {
    const matching = [];
    items.forEach(d => {
      if (Array.isArray(d.subRows) && d.subRows.length > 0) {
        d.subRows.forEach(sr => {
          if (sr.transport === tName) matching.push(sr);
        });
      } else if (d.transport === tName) {
        matching.push(d);
      }
    });

    if (matching.length === 0) return;

    const sHours = Math.round(matching.reduce((a, x) => a + Number(x.slotHours || 0), 0) * 10) / 10;
    const sOrders = matching.reduce((a, x) => a + Number(x.ordersCount || 0), 0);
    const sCost = matching.reduce((a, x) => a + Number(x.ordersCost || 0), 0);
    const sSurge = matching.reduce((a, x) => a + Number(x.surgeRub || 0), 0);
    const sRating = matching.reduce((a, x) => a + Number(x.ratingRub || 0), 0);
    const sBonus = matching.reduce((a, x) => a + Number(x.bonuses || 0), 0);
    const sGoals = matching.reduce((a, x) => a + Number(x.goals || 0), 0);
    const sTips = matching.reduce((a, x) => a + Number(x.tips || 0), 0);
    const sAdj = matching.reduce((a, x) => a + Number(x.adjustments || 0), 0);
    const sGross = matching.reduce((a, x) => a + Number(x.grossTotal || 0), 0);
    const sTax = matching.reduce((a, x) => a + Number(x.tax || 0), 0);
    const sExp = matching.reduce((a, x) => a + Number(x.expenses || 0), 0);
    const sNet = matching.reduce((a, x) => a + Number(x.netProfit || 0), 0);
    const sNetNoBonus = matching.reduce((a, x) => a + Number(x.netProfitNoBonus != null ? x.netProfitNoBonus : (x.netProfit - x.surgeRub - x.ratingRub - x.bonuses)), 0);

    subRows.push({
      date: dateDisplay,
      fullDisplayDate: fullDisplayDate,
      dayOfWeek: dowDisplay,
      slotHours: sHours,
      ordersCount: sOrders,
      ordersPerHr: sHours > 0 ? (sOrders / sHours).toFixed(2) : '0.00',
      transport: tName,
      transportKey: matching[0].transportKey || 'walk',
      ordersCost: sCost,
      surgePct: sCost > 0 ? Math.round((sSurge / sCost) * 100) : 0,
      surgeRub: sSurge,
      ratingPct: sCost > 0 ? Math.round((sRating / sCost) * 100) : 0,
      ratingRub: sRating,
      bonuses: sBonus,
      goals: sGoals,
      tips: sTips,
      adjustments: sAdj,
      grossTotal: sGross,
      grossPerHr: sHours > 0 ? Math.round(sGross / sHours) : 0,
      tax: sTax,
      expenses: sExp,
      netProfit: sNet,
      netProfitNoBonus: sNetNoBonus,
      profitPerHr: sHours > 0 ? Math.round(sNet / sHours) : 0,
      profitPerHrNoBonus: sHours > 0 ? Math.round(sNetNoBonus / sHours) : 0,
      year: year || 2026
    });
  });

  return subRows.length > 1 ? subRows : null;
}

/**
 * Агрегация недель напрямую из обогащенных дней (Bottom-Up)
 * Гарантирует, что сумма чистой прибыли и расходов дней недели в точности равна показателям недели
 */
function buildEnrichedWeeksFromEnrichedDays(enrichedDays) {
  if (!enrichedDays || enrichedDays.length === 0) return [];

  const weeksMap = new Map();
  enrichedDays.forEach(d => {
    const cycle = getWeekCycleInfo(d.dateObj || getDayDateObj(d), state.weekStartDay);
    const wkKey = cycle ? cycle.cycleKey : (d.weekKey || d.date);
    if (!weeksMap.has(wkKey)) {
      weeksMap.set(wkKey, { cycle, days: [] });
    }
    weeksMap.get(wkKey).days.push(d);
  });

  const weeks = [];
  Array.from(weeksMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([wkKey, { cycle, days: wDays }]) => {
      const slotHours = Math.round(wDays.reduce((a, d) => a + Number(d.slotHours || 0), 0) * 10) / 10;
      const ordersCount = wDays.reduce((a, d) => a + Number(d.ordersCount || 0), 0);
      const ordersCost = wDays.reduce((a, d) => a + Number(d.ordersCost || 0), 0);
      const surgeRub = wDays.reduce((a, d) => a + Number(d.surgeRub || 0), 0);
      const surgePct = ordersCost > 0 ? Math.round((surgeRub / ordersCost) * 100) : 0;
      const ratingRub = wDays.reduce((a, d) => a + Number(d.ratingRub || 0), 0);
      const ratingPct = ordersCost > 0 ? Math.round((ratingRub / ordersCost) * 100) : 0;
      const bonuses = wDays.reduce((a, d) => a + Number(d.bonuses || 0), 0);
      const goals = wDays.reduce((a, d) => a + Number(d.goals || 0), 0);
      const tips = wDays.reduce((a, d) => a + Number(d.tips || 0), 0);
      const adjustments = wDays.reduce((a, d) => a + Number(d.adjustments || 0), 0);
      const grossTotal = wDays.reduce((a, d) => a + Number(d.grossTotal || 0), 0);
      const tax = wDays.reduce((a, d) => a + Number(d.tax || 0), 0);
      const expenses = wDays.reduce((a, d) => a + Number(d.expenses || 0), 0);
      const userSlotExpenses = wDays.reduce((a, d) => a + Number(d.userSlotExpenses || 0), 0);
      const netProfit = wDays.reduce((a, d) => a + Number(d.netProfit || 0), 0);

      const expMap = new Map();
      wDays.forEach(d => {
        (d.itemizedExpenses || []).forEach(e => {
          expMap.set(e.name, (expMap.get(e.name) || 0) + Number(e.amount || 0));
        });
      });
      const itemizedExpenses = Array.from(expMap.entries()).map(([name, amount]) => ({ name, amount }));

      const distinctTransports = Array.from(new Set(wDays.flatMap(d => d.distinctTransports || [d.transport || 'Курьер'])));
      const transportSummary = distinctTransports.join(' + ');
      const wkDisplay = cycle ? cycle.label : (wDays[0].weekKey || 'Неделя');
      const dowDisplay = cycle ? cycle.dayRangeLabel : 'Пн–Вс';
      const wYear = cycle ? cycle.cycleEnd.getFullYear() : (wDays[0].year || 2026);

      const ordersPerHr = slotHours > 0 ? (ordersCount / slotHours).toFixed(2) : '0.00';
      const profitPerHr = slotHours > 0 ? Math.round(netProfit / slotHours) : 0;
      const grossPerHr = slotHours > 0 ? Math.round(grossTotal / slotHours) : 0;

      const netProfitNoBonus = wDays.reduce((a, d) => a + Number(d.netProfitNoBonus != null ? d.netProfitNoBonus : (d.netProfit - d.surgeRub - d.ratingRub - d.bonuses)), 0);
      const profitPerHrNoBonus = slotHours > 0 ? Math.round(netProfitNoBonus / slotHours) : 0;
      const weekHasDist = wDays.some(d => d.totalDistance != null);
      const weekTotalDistance = weekHasDist ? Math.round(wDays.reduce((a, d) => a + Number(d.totalDistance || 0), 0) * 10) / 10 : null;
      const subRows = buildSubRowsFromEnrichedItems(wDays, wkDisplay, `${wkDisplay} (${wYear})`, dowDisplay, wYear);

      weeks.push({
        date: wkDisplay,
        dateRange: dowDisplay,
        weekCycleKey: wkKey,
        fullDisplayDate: `${wkDisplay} (${wYear})`,
        dayOfWeek: dowDisplay,
        days: wDays,
        slotHours,
        ordersCount,
        transport: wDays[0].transport || 'Курьер',
        transportKey: wDays[0].transportKey || 'walk',
        distinctTransports,
        transportSummary,
        ordersCost,
        surgePct,
        surgeRub,
        ratingPct,
        ratingRub,
        bonuses,
        goals,
        tips,
        adjustments,
        grossTotal,
        grossPerHr,
        tax,
        expenses,
        userSlotExpenses,
        itemizedExpenses,
        netProfit,
        netProfitNoBonus,
        ordersPerHr,
        profitPerHr,
        profitPerHrNoBonus,
        totalDistance: weekTotalDistance,
        subRows,
        year: wYear
      });
    });

  return weeks;
}

/**
 * Агрегация месяцев напрямую из обогащенных дней с разделением по годам (Bottom-Up)
 */
function buildEnrichedMonthsFromEnrichedDays(enrichedDays) {
  if (!enrichedDays || enrichedDays.length === 0) return [];

  const monthsMap = new Map();
  enrichedDays.forEach(d => {
    const mk = d.monthKey || (d.dateObj ? d.dateObj.toLocaleString('ru-RU', { month: 'long' }) : 'Месяц');
    const mck = d.monthCycleKey || `${d.year || 2026}-${mk}`;
    if (!monthsMap.has(mck)) {
      monthsMap.set(mck, []);
    }
    monthsMap.get(mck).push(d);
  });

  const months = [];
  Array.from(monthsMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([mck, mDays]) => {
      const mk = mDays[0].monthKey || 'Месяц';
      const mYear = mDays[0].year || 2026;
      const slotHours = Math.round(mDays.reduce((a, d) => a + Number(d.slotHours || 0), 0) * 10) / 10;
      const ordersCount = mDays.reduce((a, d) => a + Number(d.ordersCount || 0), 0);
      const ordersCost = mDays.reduce((a, d) => a + Number(d.ordersCost || 0), 0);
      const surgeRub = mDays.reduce((a, d) => a + Number(d.surgeRub || 0), 0);
      const surgePct = ordersCost > 0 ? Math.round((surgeRub / ordersCost) * 100) : 0;
      const ratingRub = mDays.reduce((a, d) => a + Number(d.ratingRub || 0), 0);
      const ratingPct = ordersCost > 0 ? Math.round((ratingRub / ordersCost) * 100) : 0;
      const bonuses = mDays.reduce((a, d) => a + Number(d.bonuses || 0), 0);
      const goals = mDays.reduce((a, d) => a + Number(d.goals || 0), 0);
      const tips = mDays.reduce((a, d) => a + Number(d.tips || 0), 0);
      const adjustments = mDays.reduce((a, d) => a + Number(d.adjustments || 0), 0);
      const grossTotal = mDays.reduce((a, d) => a + Number(d.grossTotal || 0), 0);
      const tax = mDays.reduce((a, d) => a + Number(d.tax || 0), 0);
      const expenses = mDays.reduce((a, d) => a + Number(d.expenses || 0), 0);
      const userSlotExpenses = mDays.reduce((a, d) => a + Number(d.userSlotExpenses || 0), 0);
      const netProfit = mDays.reduce((a, d) => a + Number(d.netProfit || 0), 0);

      const expMap = new Map();
      mDays.forEach(d => {
        (d.itemizedExpenses || []).forEach(e => {
          expMap.set(e.name, (expMap.get(e.name) || 0) + Number(e.amount || 0));
        });
      });
      const itemizedExpenses = Array.from(expMap.entries()).map(([name, amount]) => ({ name, amount }));

      const distinctTransports = Array.from(new Set(mDays.flatMap(d => d.distinctTransports || [d.transport || 'Курьер'])));
      const transportSummary = distinctTransports.join(' + ');

      const ordersPerHr = slotHours > 0 ? (ordersCount / slotHours).toFixed(2) : '0.00';
      const profitPerHr = slotHours > 0 ? Math.round(netProfit / slotHours) : 0;
      const grossPerHr = slotHours > 0 ? Math.round(grossTotal / slotHours) : 0;

      const netProfitNoBonus = mDays.reduce((a, d) => a + Number(d.netProfitNoBonus != null ? d.netProfitNoBonus : (d.netProfit - d.surgeRub - d.ratingRub - d.bonuses)), 0);
      const profitPerHrNoBonus = slotHours > 0 ? Math.round(netProfitNoBonus / slotHours) : 0;
      const monthHasDist = mDays.some(d => d.totalDistance != null);
      const monthTotalDistance = monthHasDist ? Math.round(mDays.reduce((a, d) => a + Number(d.totalDistance || 0), 0) * 10) / 10 : null;
      const subRows = buildSubRowsFromEnrichedItems(mDays, mk, `${mk} ${mYear}`, 'Месяц', mYear);

      months.push({
        date: mk,
        monthKey: mk,
        monthCycleKey: mck,
        fullDisplayDate: `${mk} ${mYear}`,
        dayOfWeek: 'Месяц',
        days: mDays,
        slotHours,
        ordersCount,
        transport: mDays[0].transport || 'Курьер',
        transportKey: mDays[0].transportKey || 'walk',
        distinctTransports,
        transportSummary,
        ordersCost,
        surgePct,
        surgeRub,
        ratingPct,
        ratingRub,
        bonuses,
        goals,
        tips,
        adjustments,
        grossTotal,
        grossPerHr,
        tax,
        expenses,
        userSlotExpenses,
        itemizedExpenses,
        netProfit,
        netProfitNoBonus,
        ordersPerHr,
        profitPerHr,
        profitPerHrNoBonus,
        totalDistance: monthTotalDistance,
        subRows,
        year: mYear,
        daysCount: mDays.length
      });
    });

  return months;
}

function getCurrentDataset() {
  const ds = getActiveDatasets();
  if (!ds) return [];
  const cacheKey = `${state.period}_${state.includeGoals}_${state.usingUserData ? 'user' : 'demo'}_ws${state.weekStartDay}`;
  if (dataCache.enriched.has(cacheKey)) {
    return dataCache.enriched.get(cacheKey);
  }
  const enrichedDays = enrichDailyDataset(ds.days || []);
  let enriched = [];
  if (state.period === 'days') {
    enriched = enrichedDays;
  } else if (state.period === 'weeks') {
    enriched = buildEnrichedWeeksFromEnrichedDays(enrichedDays);
  } else if (state.period === 'months') {
    enriched = buildEnrichedMonthsFromEnrichedDays(enrichedDays);
  }

  dataCache.enriched.set(cacheKey, enriched);
  return enriched;
}

function getAllTimeHourlyProfit() {
  if (dataCache.allTimeProfit !== null) {
    return dataCache.allTimeProfit;
  }
  const ds = getActiveDatasets();
  const days = ds?.days || [];
  if (!days.length) {
    dataCache.allTimeProfit = 0;
    return 0;
  }
  const enrichedDays = enrichDailyDataset(days);
  const totalVal = enrichedDays.reduce((a, r) => a + (state.isNet ? r.netProfit : r.grossTotal), 0);
  const totalHrs = enrichedDays.reduce((a, r) => a + Number(r.slotHours || 0), 0);
  dataCache.allTimeProfit = totalHrs > 0 ? Math.round(totalVal / totalHrs) : 0;
  return dataCache.allTimeProfit;
}

function getCourierHourlyExpense() {
  const totalWeeklyExpense = getTotalWeeklyExpenses();
  if (totalWeeklyExpense <= 0) return 0;

  let weeklyHours = 40;
  const ds = getActiveDatasets();
  if (ds?.days?.length) {
    const totalSlotHours = ds.days.reduce((a, d) => a + Number(d.slotHours || 0), 0);
    const weeksCount = Math.max(1, ds.weeks?.length || 1);
    weeklyHours = Math.max(10, Math.round(totalSlotHours / weeksCount));
  }
  return Math.round(totalWeeklyExpense / weeklyHours);
}

function getCellComputedValue(cellVal) {
  if (cellVal === null || cellVal === undefined) {
    return null;
  }

  const basePct = Number(cellVal.pct || 0);
  const goalsAdd = (state.includeGoals && cellVal.goalsRubHr) ? Number(cellVal.goalsRubHr) : 0;
  let pct = Math.round(basePct);
  let grossRubHr = Math.round(Number(cellVal.rubHr || 0) + goalsAdd);

  if (isDemoMode()) {
    const distObj = districtsData.find(d => d.id === state.districtId) || districtsData[0];
    const distFactor = distObj ? (distObj.avgPct / 42) : 1.0;
    const weatherAdd = state.weatherBoost ? 16 : 0;
    pct = Math.max(0, Math.round(basePct * distFactor + weatherAdd));

    // Пропорционально пересчитываем часовой доход с учетом сдвига спроса района/осадков и выбранного транспорта
    const baseRatio = 1 + Math.max(0, basePct) / 100;
    const targetRatio = 1 + pct / 100;
    const domMeta = transportMeta[getActiveDatasets()?.dominantTransportKey || 'ebike'] || transportMeta.ebike;
    const acctMeta = transportMeta[state.accountTransport] || domMeta;
    const transportFactor = domMeta.baseHourlyRub > 0 ? (acctMeta.baseHourlyRub / domMeta.baseHourlyRub) : 1.0;
    grossRubHr = Math.round((grossRubHr / baseRatio) * targetRatio * transportFactor);
  }

  let finalRubHr = grossRubHr;
  if (state.isNet) {
    const tax = taxOf(grossRubHr);
    const hourlyExp = getCourierHourlyExpense();
    finalRubHr = grossRubHr - tax - hourlyExp;
  }

  return { pct, rubHr: finalRubHr, grossRubHr };
}

function getSelectedSlotsSummary() {
  const count = state.selectedSlotCells.length;
  const totalHours = count * 4;
  let totalRubEst = 0;
  let totalPctSum = 0;
  let validCellCount = 0;
  const activeMatrix = getActiveHeatmapMatrix();

  const items = [];
  state.selectedSlotCells.forEach(key => {
    const [r, c] = key.split('-').map(Number);
    const rowObj = activeMatrix[r];
    const comp = getCellComputedValue(rowObj?.values[c]);
    if (comp) {
      totalRubEst += comp.rubHr * 4;
      totalPctSum += comp.pct;
      validCellCount++;
      items.push({ day: shortDayNames[c], hours: rowObj ? rowObj.hours : '', comp });
    }
  });

  return {
    count,
    totalHours,
    totalRubEst,
    avgHrEst: validCellCount > 0 ? Math.round(totalRubEst / (validCellCount * 4)) : 0,
    avgPctEst: validCellCount > 0 ? Math.round(totalPctSum / validCellCount) : 0,
    items
  };
}

function getDistrictStats(d) {
  const sInfo = getResolvedSeasonInfo(state.season);
  const seasonFactor = sInfo.mult;
  const weatherAdd = (isDemoMode() && state.weatherBoost) ? 16 : 0;
  const acctMeta = transportMeta[state.accountTransport] || transportMeta.ebike;
  const avgPct  = Math.round(d.avgPct * seasonFactor + weatherAdd);
  const peakPct = Math.round(d.peakPct * seasonFactor + weatherAdd);
  let avgRub  = Math.round(acctMeta.baseHourlyRub * (1 + avgPct / 100));
  let peakRub = Math.round(acctMeta.baseHourlyRub * (1 + peakPct / 100));

  if (state.isNet) {
    const hourlyExp = getCourierHourlyExpense();
    avgRub = avgRub - taxOf(avgRub) - hourlyExp;
    peakRub = peakRub - taxOf(peakRub) - hourlyExp;
  }

  return {
    avgPct,
    peakPct,
    avgRub,
    peakRub,
    avgStr: state.heatUnitRub ? `${formatNum(avgRub)} ₽/ч` : `+${avgPct}%`,
    peakStr: state.heatUnitRub ? `${formatNum(peakRub)} ₽/ч` : `+${peakPct}%`
  };
}

function getUserDataDistrictStats() {
  const activeMatrix = getActiveHeatmapMatrix();
  const validComps = [];
  activeMatrix.forEach(row => {
    row.values.forEach(v => {
      const comp = getCellComputedValue(v);
      if (comp) validComps.push(comp);
    });
  });

  if (validComps.length === 0) {
    return {
      avgStr: '—',
      peakStr: '—',
      avgVal: 0,
      peakVal: 0
    };
  }

  if (state.heatUnitRub) {
    const avgRub = Math.round(validComps.reduce((a, c) => a + c.rubHr, 0) / validComps.length);
    const peakRub = Math.max(...validComps.map(c => c.rubHr));
    return {
      avgStr: `${formatNum(avgRub)} ₽/ч`,
      peakStr: `${formatNum(peakRub)} ₽/ч`,
      avgVal: avgRub,
      peakVal: peakRub
    };
  } else {
    const avgPct = Math.round(validComps.reduce((a, c) => a + c.pct, 0) / validComps.length);
    const peakPct = Math.max(...validComps.map(c => c.pct));
    return {
      avgStr: `+${avgPct}%`,
      peakStr: `+${peakPct}%`,
      avgVal: avgPct,
      peakVal: peakPct
    };
  }
}

function getTransportProfitPerHourForComparison(tKey, userHoursInPeriod, cachedDataset) {
  const allPeriodRows = cachedDataset || getCurrentDataset();
  const matchingRows = allPeriodRows.filter(r => r.transportKey === tKey);

  if (matchingRows.length > 0) {
    const sumVal = matchingRows.reduce((a, r) => a + (state.isNet ? r.netProfit : r.grossTotal), 0);
    const sumHrs = matchingRows.reduce((a, r) => a + r.slotHours, 0);
    return sumHrs > 0 ? Math.round(sumVal / sumHrs) : 0;
  }

  const cityAvgGrossHr = (transportMeta[tKey] && transportMeta[tKey].cityAvgGrossHr) || 980;
  const rawHrs = Number(userHoursInPeriod);
  const hrs = (Number.isFinite(rawHrs) && rawHrs > 0) ? rawHrs : 1;
  const grossForUserHours = cityAvgGrossHr * hrs;
  const tax = taxOf(grossForUserHours);
  const periodExpense = Math.round(getWeeklyExpenseForTransport(tKey) * getPeriodExpenseFactor(state.period));
  const netForecast = grossForUserHours - tax - periodExpense;
  const finalVal = state.isNet ? netForecast : grossForUserHours;
  return Math.round(finalVal / hrs);
}

// -----------------------------------------------------------------------------
// 5. РЕНДЕРИНГ КОМПОНЕНТОВ
// -----------------------------------------------------------------------------

/**
 * Быстрое обновление шапки и глобальных переключателей без трогания тяжелых блоков
 */
function renderHeader() {
  const allTimeProfitHr = getAllTimeHourlyProfit();
  if (allTimeProfitHr < 0) {
    dom.allTimeHourlyProfit.textContent = `-${formatNum(Math.abs(allTimeProfitHr))} ₽/ч`;
    dom.allTimeHourlyProfit.classList.add('text-rose-500');
  } else {
    dom.allTimeHourlyProfit.textContent = `${formatNum(allTimeProfitHr)} ₽/ч`;
    dom.allTimeHourlyProfit.classList.remove('text-rose-500');
  }
  const caps = getDatasetCapabilities();
  const hasGoalsCol = caps.hasGoals !== false;
  if (dom.goalsStatusLabel) {
    dom.goalsStatusLabel.classList.toggle('hidden', !hasGoalsCol);
    if (hasGoalsCol) {
      dom.goalsStatusLabel.textContent = state.includeGoals ? ' (с учетом целей)' : ' (без учета целей)';
    }
  }

  dom.lblGross.classList.toggle('ya-switch-opt-active', !state.isNet);
  dom.lblNet.classList.toggle('ya-switch-opt-active', state.isNet);
  dom.lblSum.classList.toggle('ya-switch-opt-active', !state.isHourly);
  dom.lblHourly.classList.toggle('ya-switch-opt-active', state.isHourly);
  dom.lblChart.classList.toggle('ya-switch-opt-active', state.viewMode === 'chart');
  dom.lblTable.classList.toggle('ya-switch-opt-active', state.viewMode === 'table');

  if (dom.switchGrossNet) dom.switchGrossNet.setAttribute('aria-checked', state.isNet ? 'true' : 'false');
  if (dom.switchSumHourly) dom.switchSumHourly.setAttribute('aria-checked', state.isHourly ? 'true' : 'false');
  if (dom.switchChartTable) dom.switchChartTable.setAttribute('aria-checked', state.viewMode === 'table' ? 'true' : 'false');

  ['days', 'weeks', 'months'].forEach(p => {
    const btn = $(`btnPeriod-${p}`);
    if (btn) btn.classList.toggle('ya-seg-btn-active', state.period === p);
  });
}

/**
 * Полный рендеринг всего интерфейса
 */

/**
 * Синхронизация ширины блока источника/импорта на мобильных устройствах
 * Разделитель справа от блока подстраивается под наибольшую из кнопок (импорт / импорт+демо или синхронизация).
 * Если текст названия файла превышает эту ширину, он аккуратно переносится по строчкам.
 */
function syncMobileSourceClusterWidth() {
  const cluster = document.querySelector('.banner-cluster-source-import');
  const importRow = document.getElementById('importRowContainer');
  const saveWrapper = document.getElementById('saveSplitWrapper');
  const badgeWrapper = cluster ? cluster.firstElementChild : null;
  if (!cluster || !importRow || !saveWrapper || !badgeWrapper) return;

  const isMobile = window.innerWidth <= 780 || document.body.classList.contains('mobile-mode') || !document.body.classList.contains('desktop-mode');
  if (isMobile) {
    cluster.style.removeProperty('width');
    cluster.style.removeProperty('max-width');
    badgeWrapper.style.removeProperty('width');
    badgeWrapper.style.removeProperty('max-width');

    const w1 = importRow.offsetWidth || 0;
    const w2 = saveWrapper.offsetWidth || 0;
    const maxBtnWidth = Math.max(w1, w2);
    if (maxBtnWidth > 0) {
      cluster.style.setProperty('width', maxBtnWidth + 'px', 'important');
      cluster.style.setProperty('max-width', maxBtnWidth + 'px', 'important');
      badgeWrapper.style.setProperty('width', maxBtnWidth + 'px', 'important');
      badgeWrapper.style.setProperty('max-width', maxBtnWidth + 'px', 'important');
    }
  } else {
    cluster.style.removeProperty('width');
    cluster.style.removeProperty('max-width');
    badgeWrapper.style.removeProperty('width');
    badgeWrapper.style.removeProperty('max-width');
  }
}
window.syncMobileSourceClusterWidth = syncMobileSourceClusterWidth;

function renderAll(skipSettingsSlidersRebuild = false) {
  syncMobileSourceClusterWidth();
  renderHeader();
  renderBlock1();
  if (typeof AuthorTipTeaStation !== 'undefined') {
    AuthorTipTeaStation.resize();
  }
  renderBlock2();
  renderBlock3();
  renderSettingsScreen(skipSettingsSlidersRebuild);
}

// Блок 1: Динамика дохода (Диаграмма / Таблица)

/**
 * Обновление внешнего вида и доступности кнопки ориентиров (Вы / Район / Город)
 */
function updateBenchmarksButton() {
  const btn = dom.btnToggleBenchmarks;
  const dot = dom.benchmarksDot;
  const lbl = dom.benchmarksLabel;
  if (!btn) return;

  const isDisabled = !!state.usingUserData;
  btn.disabled = isDisabled;

  btn.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
  if (isDisabled) {
    btn.classList.add('benchmarks-inactive', 'btn-plan-disabled', 'ya-ctrl-disabled');
    btn.classList.remove('benchmarks-active');
    btn.title = 'Ориентиры (Вы / Район / Город) недоступны для пользовательских данных';
    if (dot) dot.className = 'w-2 h-2 rounded-full benchmarks-dot-off opacity-40 shrink-0';
    if (lbl) lbl.className = 'text-mut font-normal';
  } else {
    btn.classList.remove('btn-plan-disabled', 'ya-ctrl-disabled');
    btn.title = state.showBenchmarks
      ? 'Ориентиры включены (Вы / Район / Город). Нажмите, чтобы скрыть'
      : 'Ориентиры выключены. Нажмите, чтобы показать';

    if (state.showBenchmarks) {
      btn.classList.add('benchmarks-active');
      btn.classList.remove('benchmarks-inactive');
      if (dot) dot.className = 'w-2 h-2 rounded-full benchmarks-dot-on shrink-0 transition-all';
      if (lbl) lbl.className = 'text-main font-semibold';
    } else {
      btn.classList.add('benchmarks-inactive');
      btn.classList.remove('benchmarks-active');
      if (dot) dot.className = 'w-2 h-2 rounded-full benchmarks-dot-off shrink-0 transition-all';
      if (lbl) lbl.className = 'text-mut font-normal';
    }
  }
}

/**
 * Переключение видимости линий ориентиров
 */
function toggleBenchmarks() {
  if (state.usingUserData) {
    showToast('Ориентиры района и города доступны только на демо-данных');
    return;
  }
  state.showBenchmarks = !state.showBenchmarks;
  saveAppSettings();
  updateBenchmarksButton();
  renderBlock1();
}

function renderBlock1() {
  const data = getCurrentDataset();
  if (data.length === 0) {
    state.selectedBarIndex = 0;
  } else if (state.selectedBarIndex >= data.length) {
    state.selectedBarIndex = data.length - 1;
  }

  dom.block1Title.textContent = state.viewMode === 'chart' ? 'Динамика дохода' : 'Таблица доходов и расходов';
  dom.chartViewContainer.classList.toggle('hidden', state.viewMode !== 'chart');
  dom.tableViewContainer.classList.toggle('hidden', state.viewMode !== 'table');

  const caps = getDatasetCapabilities();
  const showSurge = caps.hasSurgeCol !== false;
  const showRating = caps.hasRatingCol !== false;
  const showBonuses = caps.hasBonusCol !== false;
  const showGoals = !!state.includeGoals && caps.hasGoals !== false;
  const showTips = caps.hasTips !== false;

  if (dom.legendSurgeItem) dom.legendSurgeItem.classList.toggle('hidden', !showSurge);
  if (dom.legendRatingItem) dom.legendRatingItem.classList.toggle('hidden', !showRating);
  if (dom.legendBonusesItem) dom.legendBonusesItem.classList.toggle('hidden', !showBonuses);
  if (dom.legendGoalsItem) dom.legendGoalsItem.classList.toggle('hidden', !showGoals);
  if (dom.legendTipsItem) dom.legendTipsItem.classList.toggle('hidden', !showTips);
  if (dom.legendGrossBg) dom.legendGrossBg.classList.toggle('hidden', !state.isNet);

  if (dom.legendTipsItem) dom.legendTipsItem.classList.remove('col-start-3');
  if (dom.legendGrossBg) {
    const visibleLegendItems = 1 + (showSurge ? 1 : 0) + (showRating ? 1 : 0) + (showBonuses ? 1 : 0) + (showGoals ? 1 : 0) + (showTips ? 1 : 0);
    const spanFullRow = (visibleLegendItems % 3) === 0;
    dom.legendGrossBg.classList.toggle('col-span-3', spanFullRow);
    dom.legendGrossBg.classList.toggle('col-start-3', !spanFullRow);
  }
  if (dom.btnToggleBenchmarks) {
    dom.btnToggleBenchmarks.classList.toggle('hidden', state.viewMode !== 'chart');
    updateBenchmarksButton();
  }

  if (state.viewMode === 'table') {
    renderDetailedTable(data);
  } else {
    renderBarChart(data);
  }
}

function getChartScaleConfig(rawMax) {
  if (rawMax <= 0 || !isFinite(rawMax)) {
    return { maxScaleVal: 100, yTop: 100, yMid: 50, pctTop: 100, pctMid: 50 };
  }

  // Специфический запрос: на импортированных данных (data) сумма/чистыми/дни макс ~3000-3100:
  // сам график масштабируется до 3500 (чтобы штриховка начислено не вылезала за границу),
  // а отображаются круглые значения 3000 и 1500 на своих позициях (85.7% и 42.9%)
  if (rawMax > 2400 && rawMax <= 3250) {
    return {
      maxScaleVal: 3500,
      yTop: 3000,
      yMid: 1500,
      pctTop: Math.round((3000 / 3500) * 1000) / 10, // 85.7%
      pctMid: Math.round((1500 / 3500) * 1000) / 10  // 42.9%
    };
  }

  // Общий алгоритм круглых меток оси Y с достаточным запасом (headroom) сверху графика
  const mag = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const norm = rawMax / mag;

  // Красивые круглые шаги для yTop
  const tickSteps = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0];
  let chosenTick = 10.0;
  for (const t of tickSteps) {
    if (t >= norm * 0.94) {
      chosenTick = t;
      break;
    }
  }

  let yTop = Math.round(chosenTick * mag);
  let yMid = Math.round(yTop / 2);

  // Если максимальный столбец превышает yTop или очень близок к нему,
  // потолок графика (maxScaleVal) получает запас 12-18%, чтобы столбцы не упирались в верх
  let maxScaleVal = yTop;
  if (rawMax >= yTop * 0.88) {
    const target = rawMax * 1.14;
    const step = mag >= 1000 ? 500 : (mag >= 100 ? 50 : (mag >= 10 ? 5 : 1));
    maxScaleVal = Math.ceil(target / step) * step;
    if (maxScaleVal <= yTop) {
      maxScaleVal = yTop + step;
    }
  }

  const pctTop = Math.min(100, Math.max(10, Math.round((yTop / maxScaleVal) * 1000) / 10));
  const pctMid = Math.min(100, Math.max(5, Math.round((yMid / maxScaleVal) * 1000) / 10));

  return {
    maxScaleVal,
    yTop,
    yMid,
    pctTop,
    pctMid
  };
}

function getNiceChartCeiling(rawMax) {
  return getChartScaleConfig(rawMax).maxScaleVal;
}

function computeBenchmarkBadgePositions(containerHeight, pcts, badgeHeights = {}) {
  const H = (Number.isFinite(containerHeight) && containerHeight > 40) ? containerHeight : 169.5;
  const items = [
    { key: 'city',     pct: Number(pcts?.city || 0),     order: 0 },
    { key: 'district', pct: Number(pcts?.district || 0), order: 1 },
    { key: 'user',     pct: Number(pcts?.user || 0),     order: 2 }
  ];
  // Сортировка снизу вверх по уровню линии (при равенстве: Город -> Район -> Вы)
  items.sort((a, b) => (a.pct - b.pct) || (a.order - b.order));

  const getH = k => {
    const measured = Number(badgeHeights[k] || 0);
    return (Number.isFinite(measured) && measured > 8) ? measured : 13;
  };
  const gap = 2;
  const minMargin = 2;

  items.forEach(item => {
    item.h = getH(item.key);
    item.bottom = Math.max(minMargin, Math.round((item.pct / 100) * H) + 2);
  });

  // Стек вверх у левого края: каждая верхняя плашка не ниже (нижняя + высота + зазор)
  for (let i = 1; i < items.length; i++) {
    const minBottom = items[i - 1].bottom + items[i - 1].h + gap;
    if (items[i].bottom < minBottom) {
      items[i].bottom = minBottom;
    }
  }

  // Кламп по верхней границе области графика (без обрезания и наезда на подписи значений)
  const topItem = items[items.length - 1];
  const maxTopBottom = Math.max(minMargin, Math.floor(H - topItem.h + 2));
  if (topItem.bottom > maxTopBottom) {
    topItem.bottom = maxTopBottom;
    for (let i = items.length - 2; i >= 0; i--) {
      const maxAllowed = items[i + 1].bottom - items[i].h - gap;
      if (items[i].bottom > maxAllowed) {
        items[i].bottom = maxAllowed;
      }
    }
    if (items[0].bottom < minMargin) {
      items[0].bottom = minMargin;
      for (let i = 1; i < items.length; i++) {
        const minBottom = items[i - 1].bottom + items[i - 1].h + gap;
        if (items[i].bottom < minBottom) {
          items[i].bottom = minBottom;
        }
      }
    }
  }

  const res = {};
  items.forEach(item => {
    res[item.key] = `left: 4px; right: auto; bottom: ${Math.round(item.bottom)}px;`;
  });
  return res;
}

function repositionChartBenchmarks() {
  const box = document.getElementById('chartBenchmarkContainer');
  const canvas = dom.barChartCanvas;
  if (!box || !canvas) return;
  const pctUser = Number(box.dataset.pctUser || 0);
  const pctDist = Number(box.dataset.pctDist || 0);
  const pctCity = Number(box.dataset.pctCity || 0);
  const userEl = box.querySelector('[data-benchmark="user"]');
  const distEl = box.querySelector('[data-benchmark="district"]');
  const cityEl = box.querySelector('[data-benchmark="city"]');
  const boxH = box.clientHeight > 40 ? box.clientHeight : (canvas.clientHeight > 60 ? canvas.clientHeight - 54.5 : 169.5);
  const badgeHeights = {
    user: userEl ? userEl.offsetHeight : 13,
    district: distEl ? distEl.offsetHeight : 13,
    city: cityEl ? cityEl.offsetHeight : 13
  };
  const pos = computeBenchmarkBadgePositions(boxH, { user: pctUser, district: pctDist, city: pctCity }, badgeHeights);
  if (userEl) userEl.setAttribute('style', pos.user);
  if (distEl) distEl.setAttribute('style', pos.district);
  if (cityEl) cityEl.setAttribute('style', pos.city);
}

/**
 * Скроллит горизонтальную диаграмму только в том случае, если выбранный столбец
 * виден частично / не влезает в окно, и ровно настолько, чтобы стала видна
 * половина следующего столбца в направлении скролла.
 */
function scrollBarIntoViewIfClipped(idx, behavior = 'smooth') {
  const scrollContainer = document.getElementById('barScrollContainer');
  const activeBar = document.getElementById(`barCol-${idx}`);
  if (!scrollContainer || !activeBar || scrollContainer.clientWidth <= 0) return;

  const cRect = scrollContainer.getBoundingClientRect();
  const bRect = activeBar.getBoundingClientRect();
  const viewLeft = cRect.left + scrollContainer.clientLeft;
  const viewRight = viewLeft + scrollContainer.clientWidth;
  const tol = 0.5;

  // Столбец полностью помещается в текущее окно диаграммы — скролл не нужен
  if (bRect.left >= viewLeft - tol && bRect.right <= viewRight + tol) {
    return;
  }

  let targetScrollLeft = scrollContainer.scrollLeft;

  if (bRect.right > viewRight + tol) {
    const nextBar = document.getElementById(`barCol-${idx + 1}`);
    if (nextBar) {
      const nRect = nextBar.getBoundingClientRect();
      const nextMidX = nRect.left + (nRect.width / 2);
      const desiredDelta = Math.max(bRect.right - viewRight, nextMidX - viewRight);
      const spanNeeded = nextMidX - bRect.left;
      const maxSafeDelta = Math.max(0, bRect.left - viewLeft);
      const delta = (scrollContainer.clientWidth >= spanNeeded)
        ? desiredDelta
        : Math.min(desiredDelta, maxSafeDelta);
      targetScrollLeft = Math.ceil(scrollContainer.scrollLeft + delta);
    } else {
      targetScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    }
  } else if (bRect.left < viewLeft - tol) {
    const prevBar = document.getElementById(`barCol-${idx - 1}`);
    if (prevBar) {
      const pRect = prevBar.getBoundingClientRect();
      const prevMidX = pRect.left + (pRect.width / 2);
      const desiredShift = Math.max(viewLeft - bRect.left, viewLeft - prevMidX);
      const spanNeeded = bRect.right - prevMidX;
      const maxSafeShift = Math.max(0, viewRight - bRect.right);
      const shift = (scrollContainer.clientWidth >= spanNeeded)
        ? desiredShift
        : Math.min(desiredShift, maxSafeShift);
      targetScrollLeft = Math.floor(scrollContainer.scrollLeft - shift);
    } else {
      targetScrollLeft = 0;
    }
  }

  const maxScroll = Math.max(0, scrollContainer.scrollWidth - scrollContainer.clientWidth);
  targetScrollLeft = Math.max(0, Math.min(maxScroll, targetScrollLeft));
  if (Math.abs(targetScrollLeft - scrollContainer.scrollLeft) < 1) return;

  if (typeof scrollContainer.scrollTo === 'function') {
    scrollContainer.scrollTo({ left: targetScrollLeft, behavior });
  } else {
    scrollContainer.scrollLeft = targetScrollLeft;
  }
}

function renderBarChart(data) {
  const canvas = dom.barChartCanvas;
  if (!canvas) return;
  if (!data || data.length === 0) {
    canvas.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-sec opacity-75">Загрузка данных...</div>';
    if (dom.selectedBarDetails) dom.selectedBarDetails.replaceChildren();
    return;
  }
  const prevScrollEl = document.getElementById('barScrollContainer');
  const currentFileKey = String(state.activeFileName || '');
  const keepPrevScroll = Boolean(
    prevScrollEl &&
    !dom.screenMain.classList.contains('hidden') &&
    state.viewMode === 'chart' &&
    canvas.dataset.renderedPeriod === state.period &&
    canvas.dataset.renderedFile === currentFileKey &&
    Number(canvas.dataset.renderedLen || 0) === data.length
  );
  const prevScrollLeft = keepPrevScroll ? prevScrollEl.scrollLeft : null;
  canvas.dataset.renderedPeriod = state.period;
  canvas.dataset.renderedFile = currentFileKey;
  canvas.dataset.renderedLen = String(data.length);

  const hasMultiYearMonths = state.period === 'months' && new Set(data.map(x => x.year).filter(Boolean)).size > 1;
  const rawMax = Math.max(0, ...data.map(d => state.isHourly ? d.grossPerHr : d.grossTotal));
  const { maxScaleVal, yTop, yMid, pctTop, pctMid } = getChartScaleConfig(rawMax);

  const avgUserVal = Math.round(
    data.reduce((a, d) => a + (state.isHourly ? (state.isNet ? d.profitPerHr : d.grossPerHr) : (state.isNet ? d.netProfit : d.grossTotal)), 0) / data.length
  );
  const distObj = districtsData.find(d => d.id === state.districtId) || districtsData[0];
  const distRatio = distObj ? (distObj.avgPct / 42) : 1.0;
  const avgDistrictVal = Math.round(avgUserVal * 0.91 * distRatio);
  const avgCityVal = Math.round(avgUserVal * 0.83);

  const pctUser = Math.min(94, Math.max(12, Math.round((avgUserVal / maxScaleVal) * 100)));
  const pctDist = Math.min(94, Math.max(12, Math.round((avgDistrictVal / maxScaleVal) * 100)));
  const pctCity = Math.min(94, Math.max(12, Math.round((avgCityVal / maxScaleVal) * 100)));

  const estBenchH = canvas.clientHeight > 60 ? canvas.clientHeight - 54.5 : 169.5;
  const badgePos = computeBenchmarkBadgePositions(estBenchH, { user: pctUser, district: pctDist, city: pctCity });

  const unitSuffix = state.isHourly ? '₽/ч' : '₽';

  const benchmarkLinesHtml = (!state.showBenchmarks || state.usingUserData) ? '' : `
    <div id="chartBenchmarkContainer" data-pct-user="${pctUser}" data-pct-dist="${pctDist}" data-pct-city="${pctCity}" class="absolute left-9 right-1 pointer-events-none" style="top: 25px; bottom: 29.5px;">
      <div style="bottom: ${pctUser}%" class="absolute left-0 right-0 border-t border-dashed border-gray-300/75 z-20"></div>
      <div style="bottom: ${pctDist}%" class="absolute left-0 right-0 border-t border-dashed border-amber-300/70 z-20"></div>
      <div style="bottom: ${pctCity}%" class="absolute left-0 right-0 border-t border-dashed border-gray-400/65 z-20"></div>
      <span data-benchmark="user" style="${badgePos.user}" class="chart-benchmark-badge absolute z-[21] text-[8.5px] font-semibold px-1 rounded bg-black/70 text-gray-100 whitespace-nowrap">
        Вы (${formatNum(avgUserVal)} ${unitSuffix})
      </span>
      <span data-benchmark="district" style="${badgePos.district}" class="chart-benchmark-badge absolute z-[21] text-[8.5px] font-semibold px-1 rounded bg-black/70 text-amber-300 whitespace-nowrap">
        Район (${formatNum(avgDistrictVal)} ${unitSuffix})
      </span>
      <span data-benchmark="city" style="${badgePos.city}" class="chart-benchmark-badge absolute z-[21] text-[8.5px] font-semibold px-1 rounded bg-black/70 text-gray-300 whitespace-nowrap">
        Город (${formatNum(avgCityVal)} ${unitSuffix})
      </span>
    </div>
  `;

  const itemWidth = 44;

  let html = `
    <!-- Метки оси Y: абсолютно точно выровнены с flex-1 столбцов (translateY(50%) центрирует метку строго на значении) -->
    <div id="chartYAxisContainer" class="absolute left-0 w-8 text-[9px] pr-1 text-right text-mut pointer-events-none select-none" style="top: 25px; bottom: 29.5px;">
      <span class="absolute right-1 text-mut font-semibold" style="bottom: ${pctTop}%; transform: translateY(50%);">${formatCompact(yTop)}</span>
      <span class="absolute right-1 text-mut font-semibold" style="bottom: ${pctMid}%; transform: translateY(50%);">${formatCompact(yMid)}</span>
      <span class="absolute right-1 text-mut font-semibold" style="bottom: 0%; transform: translateY(50%);">0</span>
    </div>

    ${benchmarkLinesHtml}

    <div id="barScrollContainer" class="w-full h-full overflow-x-auto overflow-y-hidden border-b border-l relative z-10 border-strong custom-scroll">
      <div class="chart-scroll-track justify-start" style="min-width: ${Math.max(100, data.length * itemWidth)}px;">
  `;

  data.forEach((d, idx) => {
    const grossMetric = state.isHourly ? d.grossPerHr : d.grossTotal;
    const netMetric   = state.isHourly ? d.profitPerHr : d.netProfit;
    const displayMetric = state.isNet ? netMetric : grossMetric;
    const isLoss = displayMetric < 0;

    const grossHeightPct = Math.max(6, Math.min(100, Math.round((grossMetric / maxScaleVal) * 100)));
    const netHeightPct   = isLoss ? 12 : Math.max(4, Math.min(100, Math.round((displayMetric / maxScaleVal) * 100)));

    const totalParts = d.grossTotal || 1;
    const p = key => ((d[key] / totalParts) * 100).toFixed(1);

    const isSelected = idx === state.selectedBarIndex;

    const valCompact = isLoss ? `-${formatCompact(Math.abs(displayMetric))}` : formatCompact(displayMetric);
    const valText = `${valCompact} ${unitSuffix}`;
    const valClass = isLoss
      ? 'text-rose-500 font-extrabold text-[8px] sm:text-[8.5px]'
      : (isSelected ? 'opacity-100 font-black text-main text-[8.5px] sm:text-[9px]' : 'opacity-75 font-semibold text-[8px] sm:text-[8.5px]');

    let barStackHtml = '';
    if (isLoss) {
      barStackHtml = `
        <div id="barStack-${idx}" style="height: ${netHeightPct}%"
             class="w-full relative z-10 rounded-t-lg overflow-hidden flex flex-col items-center justify-center bg-rose-500/25 border border-rose-500/70 shadow"
             title="Убыток: -${formatNum(Math.abs(displayMetric))} ${unitSuffix}">
          <span class="text-[8.5px] font-extrabold text-rose-500 leading-none">−</span>
        </div>
      `;
    } else {
      const segs = [];
      if (d.ordersCost > 0) segs.push(`<div style="height: ${p('ordersCost')}%" class="w-full seg-orders"></div>`);
      if (d.surgeRub > 0)   segs.push(`<div style="height: ${p('surgeRub')}%"   class="w-full seg-surge"></div>`);
      if (d.ratingRub > 0)  segs.push(`<div style="height: ${p('ratingRub')}%"  class="w-full seg-rating"></div>`);
      if (d.bonuses > 0)    segs.push(`<div style="height: ${p('bonuses')}%"    class="w-full seg-bonus"></div>`);
      if (state.includeGoals && d.goals > 0) segs.push(`<div style="height: ${p('goals')}%" class="w-full seg-goals"></div>`);
      if (d.tips > 0)       segs.push(`<div style="height: ${p('tips')}%"       class="w-full seg-tips"></div>`);

      barStackHtml = `
        <div id="barStack-${idx}" style="height: ${netHeightPct}%"
             class="chart-stack-divider w-full relative z-10 rounded-t-lg overflow-hidden flex flex-col-reverse shadow bg-white dark:bg-[#141518]">
          ${segs.join('')}
        </div>
      `;
    }

    let dateDisplayHtml = escapeHtml(d.date);
    if (state.period === 'weeks' && typeof d.date === 'string') {
      const sep = d.date.includes('–') ? '–' : (d.date.includes('-') ? '-' : null);
      if (sep) {
        const pts = d.date.split(sep);
        dateDisplayHtml = `<span class="block leading-none text-[8px]">${escapeHtml(pts[0])}<br><span class="opacity-80">–${escapeHtml(pts[1])}</span></span>`;
      }
    } else if (state.period === 'months' && typeof d.date === 'string') {
      const clean = d.date.toLowerCase().trim();
      const shortM = shortMonthNamesMap[clean] || (d.date.length > 4 ? d.date.substring(0, 3) : d.date);
      if (hasMultiYearMonths && d.year) {
        const yrShort = String(d.year).slice(-2);
        dateDisplayHtml = `<span class="block leading-none text-[9px] font-bold">${escapeHtml(shortM)}<br><span class="text-[7.5px] font-normal opacity-75">'${escapeHtml(yrShort)}</span></span>`;
      } else {
        dateDisplayHtml = `<span class="text-[9px] font-bold">${escapeHtml(shortM)}</span>`;
      }
    }

    html += `
      <div id="barCol-${idx}" onclick="selectBar(${idx})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();selectBar(${idx});}" tabindex="0" role="button" aria-label="Период ${escapeHtml(d.date)}, прибыль ${valText}" class="chart-bar-item relative flex flex-col items-center justify-between cursor-pointer group focus:outline-none focus-visible:outline-none ${isSelected ? 'chart-bar-selected' : ''}">
        <div id="barBackdrop-${idx}" class="chart-bar-backdrop absolute -inset-x-1 inset-y-0 rounded-2xl transition-all duration-150 pointer-events-none ${isSelected ? 'block' : 'hidden'}"></div>

        <div id="barValue-${idx}" class="text-[9px] font-bold mb-0.5 whitespace-nowrap shrink-0 tabular-nums relative z-10 ${valClass}">
          ${valText}
        </div>

        <div class="flex-1 w-full max-w-[28px] min-h-0 flex items-end justify-center relative z-10">
          ${state.isNet ? `
            <div style="height: ${grossHeightPct}%"
                 class="w-full chart-gross-striped rounded-t-lg absolute bottom-0 left-0 right-0">
            </div>
          ` : ''}

          ${barStackHtml}
        </div>

        <div id="barDate-${idx}" class="text-[9px] font-semibold text-center mt-1 shrink-0 relative z-10 ${isSelected ? 'opacity-100 font-black text-main text-[10px]' : 'opacity-70'}">
          ${dateDisplayHtml}
        </div>
      </div>
    `;
  });

  html += `  </div>
    </div>`;
  canvas.innerHTML = html;

  requestAnimationFrame(() => {
    // Точнейшая субпиксельная синхронизация вертикальной шкалы Y с областью flex-1 столбцов
    const yAxisBox = document.getElementById('chartYAxisContainer');
    const benchBox = document.getElementById('chartBenchmarkContainer');
    const firstFlex1 = canvas.querySelector('.chart-bar-item .flex-1');
    if (firstFlex1) {
      const cRect = canvas.getBoundingClientRect();
      const fRect = firstFlex1.getBoundingClientRect();
      if (cRect.height > 0 && fRect.height > 0) {
        const topPx = (fRect.top - cRect.top) + 'px';
        const btmPx = (cRect.bottom - fRect.bottom) + 'px';
        if (yAxisBox) {
          yAxisBox.style.top = topPx;
          yAxisBox.style.bottom = btmPx;
        }
        if (benchBox) {
          benchBox.style.top = topPx;
          benchBox.style.bottom = btmPx;
          repositionChartBenchmarks();
        }
      }
    }

    const scrollContainer = document.getElementById('barScrollContainer');
    if (scrollContainer) {
      if (dom.screenMain.classList.contains('hidden')) return;

      if (keepPrevScroll && prevScrollLeft !== null) {
        scrollContainer.scrollLeft = prevScrollLeft;
      }
      scrollBarIntoViewIfClipped(state.selectedBarIndex, 'instant');
      if (!scrollContainer.__wheelBound) {
        scrollContainer.__wheelBound = true;
        scrollContainer.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            window.scrollBy({ top: e.deltaY, behavior: 'auto' });
          }
        }, { passive: true });
      }
    }
  });

  renderSelectedBarDetails(data[state.selectedBarIndex]);
}

// Последняя выбранная строка: нужна делегированному обработчику бейджей расходов (вместо inline onclick со строкой)
let lastSelectedRow = null;

function renderSelectedBarDetails(sel) {
  if (!sel) return;

  // Динамические цифры в легенде диаграммы
  if (dom.legValOrders) dom.legValOrders.textContent = `${formatNum(sel.ordersCost)} ₽`;
  if (dom.legValSurge) dom.legValSurge.textContent = `+${formatNum(sel.surgeRub)} ₽`;
  if (dom.legValRating) dom.legValRating.textContent = `+${formatNum(sel.ratingRub)} ₽`;
  if (dom.legValBonuses) dom.legValBonuses.textContent = `+${formatNum(sel.bonuses)} ₽`;
  if (dom.legValGoals) dom.legValGoals.textContent = state.includeGoals && sel.goals > 0 ? `+${formatNum(sel.goals)} ₽` : '';
  if (dom.legValTips) dom.legValTips.textContent = sel.tips > 0 ? `+${formatNum(sel.tips)} ₽` : '';

  const deductionBadges = [];
  if (sel.tax > 0) {
    deductionBadges.push(`
      <button type="button" onclick="openExpenseInfoModal('tax', ${sel.tax})" class="ya-badge ya-badge-red inline-flex items-center gap-1 cursor-pointer group hover:opacity-90 active:scale-95 transition" title="Налог (6%): подробнее и справка">
        <span>Налог (${TAX_PCT_LABEL}): <b>-${formatNum(sel.tax)} ₽</b></span>
        <span class="text-rose-600 dark:text-rose-400 font-extrabold ml-0.5 opacity-80 group-hover:opacity-100 text-xs leading-none">?</span>
      </button>
    `);
  }
  lastSelectedRow = sel;
  sel.itemizedExpenses.forEach((expItem, expIdx) => {
    if (expItem.amount > 0) {
      const eNameEscaped = escapeHtml(expItem.name);
      deductionBadges.push(`
        <button type="button" data-exp-idx="${expIdx}" class="ya-badge ya-badge-red inline-flex items-center gap-1 cursor-pointer group hover:opacity-90 active:scale-95 transition" title="${eNameEscaped}: подробнее и справка">
          <span>${eNameEscaped}: <b>-${formatNum(expItem.amount)} ₽</b></span>
          <span class="text-rose-600 dark:text-rose-400 font-extrabold ml-0.5 opacity-80 group-hover:opacity-100 text-xs leading-none">?</span>
        </button>
      `);
    }
  });
  if (sel.adjustments < 0) {
    const adjAbs = Math.abs(sel.adjustments);
    deductionBadges.push(`
      <button type="button" onclick="openExpenseInfoModal('adjustments', ${adjAbs})" class="ya-badge ya-badge-red inline-flex items-center gap-1 cursor-pointer group hover:opacity-90 active:scale-95 transition" title="Корректировки и удержания: оспорить">
        <span>Коррект.: <b>-${formatNum(adjAbs)} ₽</b></span>
        <span class="text-rose-600 dark:text-rose-400 font-extrabold ml-0.5 opacity-80 group-hover:opacity-100 text-xs leading-none">?</span>
      </button>
    `);
  }

  const transportText = sel.transportSummary || sel.transport || 'Курьер';
  const selHours = Math.round(Number(sel.slotHours || 0) * 10) / 10;

  const netBadgeHtml = sel.netProfit < 0
    ? `<span class="ya-badge ya-badge-red font-bold">Чистыми (убыток): <b>-${formatNum(Math.abs(sel.netProfit))} ₽ (-${formatNum(Math.abs(sel.profitPerHr))} ₽/ч)</b></span>`
    : `<span class="ya-badge ya-badge-green font-bold">Чистыми: <b>${formatNum(sel.netProfit)} ₽ (${formatNum(sel.profitPerHr)} ₽/ч)</b></span>`;

  const ordersPerHr = Number(sel.ordersPerHr || (selHours > 0 ? (sel.ordersCount / selHours) : 0)).toFixed(1);

  dom.selectedBarDetails.innerHTML = `
    <div class="flex items-center justify-between pb-2">
      <div>
        <span class="font-extrabold">${escapeHtml(sel.date)} (${escapeHtml(sel.dayOfWeek)})</span>
        <span class="opacity-70 ml-1">• ${escapeHtml(transportText)} • ${selHours} ч • ${sel.ordersCount} зак • ${ordersPerHr} зак/ч</span>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-1.5 text-[10px] pt-2 border-t border-subtle">
      <span class="ya-badge ya-badge-grey">Начислено: <b>${formatNum(sel.grossTotal)} ₽</b></span>
      ${deductionBadges.join('')}
      ${netBadgeHtml}
    </div>
  `;
}

const PROFIT_COLOR_SCALE_LIGHT = {
  min: [220, 38, 38],   // #DC2626 мягкий красный
  mid: [217, 119, 6],   // #D97706 теплый янтарь
  max: [22, 138, 56]    // #168A38 свежий зеленый
};

const PROFIT_COLOR_SCALE_DARK = {
  min: [251, 113, 133], // #FB7185 кораллово-розовый
  mid: [251, 191, 36],  // #FBBF24 золотисто-янтарный
  max: [74, 222, 128]   // #4ADE80 мягкий салатово-зеленый
};

/**
 * Непрерывное/плавное условное форматирование показателя «Прибыль в час» (3-Color Scale, как в Excel)
 * Light mode: min (красный #DC2626) -> mid (теплый янтарь #D97706) -> max (свежий зеленый #168A38)
 * Dark mode:  min (коралл #FB7185)  -> mid (золото #FBBF24)        -> max (мягкий зеленый #4ADE80)
 */
function getProfitPerHourColor(val, minVal, maxVal, isLightMode) {
  if (maxVal <= minVal || val == null || isNaN(val)) {
    return isLightMode ? '#18191C' : '#F5F6F8';
  }
  const t = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
  const c = isLightMode ? PROFIT_COLOR_SCALE_LIGHT : PROFIT_COLOR_SCALE_DARK;
  let r, g, b;

  if (t <= 0.5) {
    const p = t / 0.5;
    r = Math.round(c.min[0] + p * (c.mid[0] - c.min[0]));
    g = Math.round(c.min[1] + p * (c.mid[1] - c.min[1]));
    b = Math.round(c.min[2] + p * (c.mid[2] - c.min[2]));
  } else {
    const p = (t - 0.5) / 0.5;
    r = Math.round(c.mid[0] + p * (c.max[0] - c.mid[0]));
    g = Math.round(c.mid[1] + p * (c.max[1] - c.mid[1]));
    b = Math.round(c.mid[2] + p * (c.max[2] - c.mid[2]));
  }

  return `rgb(${r}, ${g}, ${b})`;
}

const tableHeaderLabels = {
  date: 'Дата',
  dayOfWeek: 'День<br>недели',
  slotHours: 'Длит.<br>слота',
  ordersCount: 'Кол-во<br>заказов',
  ordersPerHr: 'Заказов<br>в час',
  transport: 'Транспорт',
  grossTotal: 'Начислено<br>(до расх.)',
  ordersCost: 'Стоимость<br>заказов',
  surgePct: 'Спрос<br>(%)',
  surgeRub: 'Доплата<br>(спрос)',
  ratingPct: 'Рейтинг<br>(%)',
  ratingRub: 'Доплата<br>(рейтинг)',
  bonuses: 'Бонусы',
  tax: 'Налог',
  netProfit: 'Прибыль<br>(на руки)',
  profitPerHrNoBonus: 'Прибыль/ч<br>(без д/б)',
  profitPerHr: 'Прибыль<br>в час',
  goals: 'Цели',
  tips: 'Чаевые',
  adjustments: 'Коррект.',
  expenses: 'Расходы'
};


function getRowExpansionKey(row) {
  if (state.period === 'days') return String(row.fullDate || row.date || '');
  if (state.period === 'weeks') return String(row.weekCycleKey || row.date || '');
  if (state.period === 'months') return String(row.monthCycleKey || `${row.year || ''}_${row.monthKey || row.date || ''}`);
  return String(row.fullDate || row.monthCycleKey || row.date || row.weekCycleKey || '');
}

function hasExpandableOrders(ordersList) {
  if (!Array.isArray(ordersList) || ordersList.length === 0) return false;
  if (state.datasetCapabilities?.isPureSlotLevel) return false;
  return ordersList.some(o => !o.isSlotLevel);
}

function getSubRowOrderKey(rowKey, subRow, sIdx) {
  return `${rowKey}__sub__${subRow.transportKey || sIdx}`;
}

function formatSecsHHMM(secs) {
  const s = Math.max(0, Math.round(Number(secs) || 0)) % 86400;
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  return `${hh}:${mm}`;
}

function buildEnrichedOrderRowData(order, oIdx, fallbackTransport) {
  const orderCost = Math.round(Number(order.orderCost || 0) + Number(order.wait || 0));
  const surgeRub = Math.round(Number(order.surgeRub || 0));
  const surgePct = order.surgePct != null
    ? Math.round(Number(order.surgePct))
    : (orderCost > 0 ? Math.round((surgeRub / orderCost) * 100) : 0);
  const ratingRub = Math.round(Number(order.ratingRub || 0));
  const ratingPct = order.ratingPct != null
    ? Math.round(Number(order.ratingPct))
    : (orderCost > 0 ? Math.round((ratingRub / orderCost) * 100) : 0);
  const bonuses = Math.round(Number(order.bonus || 0));
  const goals = state.includeGoals ? Math.round(Number(order.goal || 0)) : 0;
  const tips = Math.round(Number(order.tip || order.tips || 0));
  const adjustments = -Math.abs(Math.round(Number(order.adjustment || 0)));
  const grossTotal = orderCost + surgeRub + ratingRub + bonuses + goals + tips;
  const tax = taxOf(grossTotal);
  const netProfit = grossTotal - tax + adjustments;

  const durMins = Math.max(1, Math.round(Number(order.durationMins || 20)));
  const slotHours = durMins / 60;
  const surchargesAndBonuses = surgeRub + ratingRub + bonuses + goals;
  const netProfitNoBonus = netProfit - Math.round(surchargesAndBonuses * (1 - TAX_RATE));
  const profitPerHr = slotHours > 0 ? Math.round(netProfit / slotHours) : 0;
  const profitPerHrNoBonus = slotHours > 0 ? Math.round(netProfitNoBonus / slotHours) : 0;

  const hasTimes = Number(order.endSecs || 0) > 0 || Number(order.startSecs || 0) > 0;
  const timeLabel = hasTimes
    ? `${formatSecsHHMM(order.startSecs)}–${formatSecsHHMM(order.endSecs)}`
    : `Заказ #${oIdx + 1}`;

  return {
    isOrderRow: true,
    date: timeLabel,
    fullDisplayDate: timeLabel,
    dayOfWeek: `#${oIdx + 1}`,
    durationMins: durMins,
    slotHours: Math.round(slotHours * 100) / 100,
    ordersCount: 1,
    ordersPerHr: '—',
    transport: order.transportLabel || fallbackTransport || 'Курьер',
    transportSummary: order.transportLabel || fallbackTransport || 'Курьер',
    ordersCost: orderCost,
    surgePct,
    surgeRub,
    ratingPct,
    ratingRub,
    bonuses,
    goals,
    tips,
    adjustments,
    grossTotal,
    tax,
    expenses: 0,
    netProfit,
    netProfitNoBonus,
    profitPerHr,
    profitPerHrNoBonus
  };
}

const getColWidthClass = (colKey, isFirst) => {
  if (isFirst || colKey === 'date') return 'table-col-sticky-first border-r min-w-[90px] max-w-[100px] text-left';
  switch (colKey) {
    case 'dayOfWeek':          return 'min-w-[46px] max-w-[54px] text-center';
    case 'slotHours':          return 'min-w-[44px] max-w-[52px] text-center';
    case 'ordersCount':        return 'min-w-[54px] max-w-[62px] text-center';
    case 'ordersPerHr':        return 'min-w-[50px] max-w-[58px] text-center';
    case 'transport':          return 'min-w-[72px] max-w-[88px] text-center px-0.5';
    case 'grossTotal':         return 'min-w-[62px] max-w-[70px] text-center';
    case 'ordersCost':         return 'min-w-[58px] max-w-[66px] text-center';
    case 'surgePct':           return 'min-w-[40px] max-w-[46px] text-center';
    case 'surgeRub':           return 'min-w-[52px] max-w-[60px] text-center';
    case 'ratingPct':          return 'min-w-[40px] max-w-[46px] text-center';
    case 'ratingRub':          return 'min-w-[54px] max-w-[62px] text-center';
    case 'bonuses':            return 'min-w-[50px] max-w-[58px] text-center';
    case 'tax':                return 'min-w-[44px] max-w-[52px] text-center';
    case 'netProfit':          return 'min-w-[60px] max-w-[68px] text-center';
    case 'profitPerHrNoBonus': return 'min-w-[64px] max-w-[72px] text-center';
    case 'profitPerHr':        return 'min-w-[56px] max-w-[64px] text-center';
    case 'goals':              return 'min-w-[50px] max-w-[58px] text-center';
    case 'tips':               return 'min-w-[48px] max-w-[56px] text-center';
    case 'adjustments':        return 'min-w-[52px] max-w-[60px] text-center';
    case 'expenses':           return 'min-w-[54px] max-w-[62px] text-center';
    default:                   return 'min-w-[54px] max-w-[66px] text-center';
  }
};

function isTableColumnAvailable(colKey, caps = getDatasetCapabilities()) {
  switch (colKey) {
    case 'surgePct':
    case 'surgeRub':    return caps.hasSurgeCol !== false;
    case 'ratingPct':
    case 'ratingRub':   return caps.hasRatingCol !== false;
    case 'bonuses':     return caps.hasBonusCol !== false;
    case 'goals':       return caps.hasGoals !== false;
    case 'tips':               return caps.hasTips !== false;
    case 'adjustments':        return caps.hasAdjustments !== false;
    case 'profitPerHrNoBonus': return caps.hasSurgeCol !== false || caps.hasRatingCol !== false || caps.hasBonusCol !== false || caps.hasGoals !== false;
    default:                   return true;
  }
}

// =============================================================================
// ФИЛЬТРАЦИЯ ТАБЛИЦЫ ДОХОДОВ (EXCEL-STYLE, v14.12.0)
// =============================================================================
let currentFilterColKey = null;

const NUMERIC_COLUMN_KEYS = new Set([
  'slotHours', 'ordersCount', 'ordersPerHr', 'grossTotal', 'ordersCost',
  'surgePct', 'surgeRub', 'ratingPct', 'ratingRub', 'bonuses', 'tax',
  'netProfit', 'profitPerHrNoBonus', 'profitPerHr', 'goals', 'tips',
  'adjustments', 'expenses'
]);

function isColumnNumeric(colKey) {
  return NUMERIC_COLUMN_KEYS.has(colKey);
}

function getTableRawCellValue(row, colKey) {
  if (!row) return null;
  if (isColumnNumeric(colKey)) {
    if (colKey === 'profitPerHrNoBonus') {
      return Number(row.profitPerHrNoBonus != null ? row.profitPerHrNoBonus : (row.profitPerHr || 0));
    }
    const v = Number(row[colKey]);
    return Number.isFinite(v) ? v : 0;
  }
  return null;
}

function getTableDisplayCellValue(row, colKey) {
  if (!row) return '—';
  switch (colKey) {
    case 'date':
      return row.fullDisplayDate || (typeof row.date === 'string' && row.date.length === 5 ? `${row.date}.2026` : String(row.date || '—'));
    case 'dayOfWeek':
      return String(row.dayOfWeek || '—');
    case 'transport':
      return String(row.transportSummary || row.transport || '—');
    case 'slotHours':
      return `${Math.round(Number(row.slotHours || 0) * 10) / 10} ч`;
    case 'ordersCount':
      return String(row.ordersCount || 0);
    case 'ordersPerHr':
      return String(row.ordersPerHr || 0);
    case 'grossTotal':
    case 'ordersCost':
    case 'surgeRub':
    case 'ratingRub':
    case 'bonuses':
    case 'tax':
    case 'netProfit':
    case 'profitPerHrNoBonus':
    case 'profitPerHr':
    case 'goals':
    case 'tips':
    case 'adjustments':
    case 'expenses':
      return `${formatNum(row[colKey] || 0)} ₽`;
    case 'surgePct':
    case 'ratingPct':
      return `+${row[colKey] || 0}%`;
    default:
      return String(row[colKey] ?? '—');
  }
}

function isColumnFiltered(colKey) {
  const f = state.tableFilters && state.tableFilters[colKey];
  if (!f) return false;
  if (f.minVal != null || f.maxVal != null) return true;
  if (Array.isArray(f.selectedValues) && f.totalValuesCount && f.selectedValues.length < f.totalValuesCount) return true;
  return false;
}

function getActiveTableFiltersCount() {
  if (!state.tableFilters) return 0;
  return Object.keys(state.tableFilters).filter(k => isColumnFiltered(k)).length;
}

function getFilteredTableData(data) {
  if (!Array.isArray(data) || !state.tableFilters) return data || [];
  const activeKeys = Object.keys(state.tableFilters).filter(k => isColumnFiltered(k));
  if (activeKeys.length === 0) return data;

  return data.filter(row => {
    for (const key of activeKeys) {
      const f = state.tableFilters[key];
      if (!f) continue;

      // Проверка диапазона чисел
      if (f.minVal != null || f.maxVal != null) {
        const val = getTableRawCellValue(row, key);
        if (val == null) return false;
        if (f.minVal != null && val < f.minVal) return false;
        if (f.maxVal != null && val > f.maxVal) return false;
      }

      // Проверка уникальных дискретных значений
      if (Array.isArray(f.selectedValues) && f.totalValuesCount && f.selectedValues.length < f.totalValuesCount) {
        const disp = getTableDisplayCellValue(row, key);
        if (!f.selectedValues.includes(disp)) return false;
      }
    }
    return true;
  });
}

function getDatasetFilteredExcept(excludeColKey = null) {
  const rawData = getCurrentDataset() || [];
  if (!state.tableFilters) return rawData;
  const activeKeys = Object.keys(state.tableFilters).filter(k => k !== excludeColKey && isColumnFiltered(k));
  if (activeKeys.length === 0) return rawData;

  return rawData.filter(row => {
    for (const key of activeKeys) {
      const f = state.tableFilters[key];
      if (!f) continue;
      if (f.minVal != null || f.maxVal != null) {
        const val = getTableRawCellValue(row, key);
        if (val == null) return false;
        if (f.minVal != null && val < f.minVal) return false;
        if (f.maxVal != null && val > f.maxVal) return false;
      }
      if (Array.isArray(f.selectedValues) && f.totalValuesCount && f.selectedValues.length < f.totalValuesCount) {
        const disp = getTableDisplayCellValue(row, key);
        if (!f.selectedValues.includes(disp)) return false;
      }
    }
    return true;
  });
}

function openTableColumnFilter(colKey, event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  currentFilterColKey = colKey;
  const col = (state.tableColumns || []).find(c => c.key === colKey);
  const colLabel = col ? col.label : colKey;

  const popover = document.getElementById('tableFilterPopover');
  const titleEl = document.getElementById('tableFilterColTitle');
  const typeBadgeEl = document.getElementById('tableFilterColTypeBadge');
  const searchInput = document.getElementById('tableFilterSearchInput');
  const rangeContainer = document.getElementById('tableFilterNumericRangeContainer');
  const minInput = document.getElementById('tableFilterMinInput');
  const maxInput = document.getElementById('tableFilterMaxInput');

  if (!popover) return;

  if (titleEl) titleEl.textContent = colLabel;
  const isNum = isColumnNumeric(colKey);
  if (typeBadgeEl) typeBadgeEl.textContent = isNum ? 'Число' : 'Текст';
  if (searchInput) searchInput.value = '';

  const activeFilter = (state.tableFilters && state.tableFilters[colKey]) || null;

  // Настройка числового диапазона
  if (rangeContainer && minInput && maxInput) {
    if (isNum) {
      rangeContainer.classList.remove('hidden');
      const allRows = getDatasetFilteredExcept(colKey);
      const numVals = allRows.map(r => getTableRawCellValue(r, colKey)).filter(v => v != null && !isNaN(v));
      const minInDataset = numVals.length > 0 ? Math.min(...numVals) : 0;
      const maxInDataset = numVals.length > 0 ? Math.max(...numVals) : 0;
      minInput.placeholder = String(minInDataset);
      maxInput.placeholder = String(maxInDataset);
      minInput.value = (activeFilter && activeFilter.minVal != null) ? activeFilter.minVal : '';
      maxInput.value = (activeFilter && activeFilter.maxVal != null) ? activeFilter.maxVal : '';
    } else {
      rangeContainer.classList.add('hidden');
    }
  }

  // Заполнение списка уникальных значений (каскадно с учетом других активных фильтров, v14.12.1)
  populateTableFilterValuesList(colKey, activeFilter);

  // Viewport-aware позиционирование
  popover.classList.remove('hidden');
  const triggerEl = event ? (event.currentTarget || event.target) : null;
  if (triggerEl && typeof triggerEl.getBoundingClientRect === 'function') {
    const rect = triggerEl.getBoundingClientRect();
    const popWidth = Math.min(288, window.innerWidth - 20);
    let left = rect.left;
    if (left + popWidth > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - popWidth - 10);
    }
    let top = rect.bottom + 6;
    if (top + 380 > window.innerHeight && rect.top > 390) {
      top = Math.max(10, rect.top - 380);
    }
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    popover.style.transform = '';
  } else {
    popover.style.left = '50%';
    popover.style.top = '20%';
    popover.style.transform = 'translate(-50%, 0)';
  }

  setTimeout(() => {
    if (searchInput) searchInput.focus();
  }, 50);
}

function populateTableFilterValuesList(colKey, activeFilter) {
  const listContainer = document.getElementById('tableFilterValuesList');
  if (!listContainer) return;

  const dataset = getDatasetFilteredExcept(colKey);
  const valueCounts = new Map();

  dataset.forEach(row => {
    const dispVal = getTableDisplayCellValue(row, colKey);
    valueCounts.set(dispVal, (valueCounts.get(dispVal) || 0) + 1);
  });

  const sortedValues = Array.from(valueCounts.keys()).sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));

  let html = '';
  sortedValues.forEach(val => {
    const count = valueCounts.get(val);
    const isChecked = !activeFilter || !activeFilter.selectedValues || activeFilter.selectedValues.includes(val);
    html += `
      <label class="table-filter-val-item flex items-center justify-between gap-2 py-1 px-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-xs" data-val="${escapeHtml(val)}">
        <div class="flex items-center gap-2 min-w-0">
          <input type="checkbox" value="${escapeHtml(val)}" ${isChecked ? 'checked' : ''} class="table-filter-checkbox accent-primary rounded cursor-pointer">
          <span class="truncate text-main">${escapeHtml(val)}</span>
        </div>
        <span class="text-[10px] text-sec shrink-0 font-medium">(${count})</span>
      </label>
    `;
  });

  listContainer.innerHTML = html || '<div class="text-[11px] text-sec p-2 text-center">Нет значений</div>';
}

function handleTableFilterSearch(query) {
  const q = String(query || '').trim().toLowerCase();
  const items = document.querySelectorAll('.table-filter-val-item');
  items.forEach(item => {
    const val = (item.getAttribute('data-val') || '').toLowerCase();
    item.classList.toggle('hidden', q !== '' && !val.includes(q));
  });
}

function setAllTableFilterCheckboxes(checked) {
  const visibleCheckboxes = document.querySelectorAll('.table-filter-val-item:not(.hidden) .table-filter-checkbox');
  visibleCheckboxes.forEach(cb => {
    cb.checked = checked;
  });
}

function clearTableFilterRangeInputs() {
  const minInput = document.getElementById('tableFilterMinInput');
  const maxInput = document.getElementById('tableFilterMaxInput');
  if (minInput) minInput.value = '';
  if (maxInput) maxInput.value = '';
}

function applyCurrentColumnFilter() {
  if (!currentFilterColKey) {
    closeTableFilterPopover();
    return;
  }
  const colKey = currentFilterColKey;
  const isNum = isColumnNumeric(colKey);

  const minInput = document.getElementById('tableFilterMinInput');
  const maxInput = document.getElementById('tableFilterMaxInput');

  let minVal = null;
  let maxVal = null;
  if (isNum && minInput && minInput.value.trim() !== '') {
    const num = Number(minInput.value);
    if (!isNaN(num)) minVal = num;
  }
  if (isNum && maxInput && maxInput.value.trim() !== '') {
    const num = Number(maxInput.value);
    if (!isNaN(num)) maxVal = num;
  }

  const allCheckboxes = document.querySelectorAll('.table-filter-checkbox');
  const checkedValues = [];
  allCheckboxes.forEach(cb => {
    if (cb.checked) checkedValues.push(cb.value);
  });
  const totalCount = allCheckboxes.length;

  if (!state.tableFilters) state.tableFilters = {};

  if (minVal == null && maxVal == null && checkedValues.length === totalCount) {
    delete state.tableFilters[colKey];
  } else {
    state.tableFilters[colKey] = {
      minVal,
      maxVal,
      selectedValues: checkedValues,
      totalValuesCount: totalCount
    };
  }

  saveAppSettings();
  closeTableFilterPopover();
  renderDetailedTable(getCurrentDataset());
}

function resetCurrentColumnFilter(colKey = null) {
  const key = colKey || currentFilterColKey;
  if (key && state.tableFilters) {
    delete state.tableFilters[key];
    saveAppSettings();
  }
  closeTableFilterPopover();
  renderDetailedTable(getCurrentDataset());
}

function resetAllTableFilters() {
  state.tableFilters = {};
  saveAppSettings();
  closeTableFilterPopover();
  renderDetailedTable(getCurrentDataset());
  showToast('Все фильтры таблицы сброшены');
}

function closeTableFilterPopover() {
  const popover = document.getElementById('tableFilterPopover');
  if (popover && !popover.classList.contains('hidden')) {
    popover.classList.add('hidden');
  }
  currentFilterColKey = null;
}

function toggleTableFilterMenu(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const popover = document.getElementById('tableFilterPopover');
  if (popover && !popover.classList.contains('hidden')) {
    closeTableFilterPopover();
    return;
  }
  const caps = getDatasetCapabilities();
  const enabledCols = (state.tableColumns || []).filter(c => c.enabled && isTableColumnAvailable(c.key, caps));
  const activeCol = enabledCols.find(c => isColumnFiltered(c.key)) || enabledCols[0];
  if (activeCol) {
    openTableColumnFilter(activeCol.key, event);
  }
}

function updateTableFilterUI() {
  const activeCount = getActiveTableFiltersCount();
  const badge = document.getElementById('tableFilterActiveBadge');
  const resetBtn = document.getElementById('btnResetAllTableFilters');
  const banner = document.getElementById('tableFilterActiveBanner');
  const chipsList = document.getElementById('tableFilterChipsList');
  const rowsCountEl = document.getElementById('tableFilteredRowsCount');

  if (badge) {
    badge.textContent = String(activeCount);
    badge.classList.toggle('hidden', activeCount === 0);
  }
  if (resetBtn) {
    resetBtn.classList.toggle('hidden', activeCount === 0);
  }

  if (banner && chipsList) {
    if (activeCount === 0) {
      banner.classList.add('hidden');
      chipsList.innerHTML = '';
    } else {
      banner.classList.remove('hidden');
      let chipsHtml = '';
      Object.keys(state.tableFilters).forEach(key => {
        if (!isColumnFiltered(key)) return;
        const col = (state.tableColumns || []).find(c => c.key === key);
        const colLabel = col ? col.label : key;
        const f = state.tableFilters[key];
        let desc = colLabel;
        if (f.minVal != null && f.maxVal != null) {
          desc += `: ${formatNum(f.minVal)}–${formatNum(f.maxVal)}`;
        } else if (f.minVal != null) {
          desc += `: ≥ ${formatNum(f.minVal)}`;
        } else if (f.maxVal != null) {
          desc += `: ≤ ${formatNum(f.maxVal)}`;
        } else if (Array.isArray(f.selectedValues) && f.totalValuesCount) {
          desc += `: ${f.selectedValues.length} из ${f.totalValuesCount}`;
        }
        chipsHtml += `
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-card border border-subtle text-main text-[10.5px]">
            <button type="button" onclick="openTableColumnFilter('${escapeHtml(key)}', event)" class="hover:text-primary transition font-medium text-left truncate max-w-[220px]" title="Настроить фильтр: ${escapeHtml(colLabel)}">${escapeHtml(desc)}</button>
            <button type="button" onclick="resetCurrentColumnFilter('${escapeHtml(key)}')" title="Удалить фильтр" class="text-sec hover:text-rose-500 font-bold ml-0.5 px-0.5">✕</button>
          </span>
        `;
      });
      chipsList.innerHTML = chipsHtml;
    }
  }

  if (rowsCountEl) {
    const rawData = getCurrentDataset() || [];
    const filteredData = getFilteredTableData(rawData);
    if (activeCount > 0) {
      rowsCountEl.textContent = `Показано: ${filteredData.length} из ${rawData.length} строк`;
    } else {
      rowsCountEl.textContent = `Всего строк: ${rawData.length}`;
    }
  }
}

// Light dismiss и закрытие по Escape для фильтра таблицы
document.addEventListener('pointerdown', (e) => {
  const popover = document.getElementById('tableFilterPopover');
  if (!popover || popover.classList.contains('hidden')) return;
  if (!popover.contains(e.target) && !e.target.closest('.table-col-filter-btn') && !e.target.closest('#tableFilterChipsList') && !e.target.closest('#btnToggleTableFilterMenu')) {
    closeTableFilterPopover();
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeTableFilterPopover();
  }
});

function renderDetailedTable(data, preserveScroll = true) {
  const caps = getDatasetCapabilities();
  const enabledCols = state.tableColumns.filter(c => c.enabled && isTableColumnAvailable(c.key, caps));
  const thead = dom.detailedTableHead;
  const tbody = dom.detailedTableBody;
  const tfoot = dom.detailedTableFoot;

  const scrollContainer = tbody?.closest('.table-scroll-container');
  const prevScrollTop = (preserveScroll && scrollContainer) ? scrollContainer.scrollTop : 0;

  const rawData = Array.isArray(data) ? data : getCurrentDataset();
  const filteredData = getFilteredTableData(rawData);

  const profitHrVals = filteredData.map(r => Number(r.profitPerHr || 0));
  const minProfitHr = profitHrVals.length > 0 ? Math.min(...profitHrVals) : 0;
  const maxProfitHr = profitHrVals.length > 0 ? Math.max(...profitHrVals) : 0;

  const profitHrNoBonusVals = filteredData.map(r => Number(r.profitPerHrNoBonus != null ? r.profitPerHrNoBonus : (r.profitPerHr || 0)));
  const minProfitHrNoBonus = profitHrNoBonusVals.length > 0 ? Math.min(...profitHrNoBonusVals) : 0;
  const maxProfitHrNoBonus = profitHrNoBonusVals.length > 0 ? Math.max(...profitHrNoBonusVals) : 0;

  const getColHighlightClass = (colKey) => {
    if (colKey === 'netProfit') return 'table-col-net';
    if (colKey === 'grossTotal') return 'table-col-gross';
    return '';
  };

  let headHtml = '<tr>';
  enabledCols.forEach((col, i) => {
    const isFirst = (i === 0 || col.key === 'date');
    const widthCls = getColWidthClass(col.key, isFirst);
    const bgCls = isFirst ? 'bg-elevated' : '';
    const highlightCls = getColHighlightClass(col.key);
    const alignCls = isFirst ? 'text-left' : 'text-center';
    const isFiltered = isColumnFiltered(col.key);
    const filterIconSvg = `<svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/></svg>`;
    const filterBtnHtml = `
      <span class="table-col-filter-btn ${isFiltered ? 'table-col-filter-btn-active' : ''}">
        ${filterIconSvg}
      </span>
    `;
    let labelHtml = tableHeaderLabels[col.key] || escapeHtml(col.label);
    if (col.key === 'date') {
      labelHtml = `
        <div class="flex items-center justify-between gap-1 w-full text-left">
          <button type="button" onclick="openTableColumnFilter('date', event)" class="inline-flex items-center gap-0.5 hover:text-primary transition font-bold" title="Фильтр: Дата">
            <span>${tableHeaderLabels.date}</span>
            ${filterBtnHtml}
          </button>
          <div class="inline-flex items-center gap-0.5 font-normal">
            <button type="button" id="btnExpandAllTableRows" onclick="event.stopPropagation(); expandAllDateSubRows()" title="Развернуть все уровни (типы транспорта и заказы)" class="w-3.5 h-3.5 rounded bg-black/10 dark:bg-white/10 hover:bg-[#FCE000] hover:text-black flex items-center justify-center text-[10px] font-extrabold leading-none active:scale-95">+</button>
            <button type="button" id="btnCollapseAllTableRows" onclick="event.stopPropagation(); collapseAllDateSubRows()" title="Свернуть все уровни (заказы и типы транспорта)" class="w-3.5 h-3.5 rounded bg-black/10 dark:bg-white/10 hover:bg-[#FCE000] hover:text-black flex items-center justify-center text-[10px] font-extrabold leading-none active:scale-95">−</button>
          </div>
        </div>
      `;
      headHtml += `<th scope="col" class="py-1.5 px-1 font-bold text-[9.5px] leading-tight whitespace-normal align-middle ${alignCls} ${widthCls} ${bgCls} ${highlightCls}">${labelHtml}</th>`;
    } else {
      headHtml += `
        <th scope="col" onclick="openTableColumnFilter('${col.key}', event)" class="table-col-interactive py-1.5 px-0.5 font-bold text-[9.5px] leading-tight whitespace-normal align-middle cursor-pointer select-none transition ${alignCls} ${widthCls} ${bgCls} ${highlightCls}" title="Фильтр: ${escapeHtml(col.label || col.key)}">
          <div class="inline-flex items-center justify-center gap-0.5 w-full">
            <span class="leading-tight text-center">${labelHtml}</span>
            ${filterBtnHtml}
          </div>
        </th>
      `;
    }
  });
  headHtml += '</tr>';
  thead.innerHTML = headHtml;

  const renderOrderRowsHtml = (ordersList, fallbackTransport, isNestedUnderSubRow) => {
    const indentCls = isNestedUnderSubRow ? 'pl-4' : 'pl-2';
    let ordersHtml = '';
    ordersList.forEach((ord, oIdx) => {
      const enrichedOrder = buildEnrichedOrderRowData(ord, oIdx, fallbackTransport);
      ordersHtml += '<tr class="table-order-row">';
      enabledCols.forEach((col, i) => {
        const isFirst = (i === 0 || col.key === 'date');
        const widthCls = getColWidthClass(col.key, isFirst);
        const stickyCls = isFirst ? 'table-col-sticky-first font-semibold border-r border-strong text-left' : '';
        const highlightCls = getColHighlightClass(col.key);
        const alignCls = isFirst ? 'text-left' : 'text-center';
        let cellContent = '';
        if (col.key === 'date') {
          cellContent = `
            <div class="flex items-center gap-1 ${indentCls}">
              <span class="text-mut text-[9px] font-bold shrink-0 leading-none">↳</span>
              <span class="truncate text-[9.5px] font-semibold">${escapeHtml(enrichedOrder.date)}</span>
            </div>
          `;
        } else {
          cellContent = formatTableCellValue(enrichedOrder, col.key, minProfitHr, maxProfitHr, minProfitHrNoBonus, maxProfitHrNoBonus);
        }
        ordersHtml += `<td class="py-1 px-1 text-[9.5px] whitespace-nowrap align-middle ${alignCls} ${widthCls} ${stickyCls} ${highlightCls}">${cellContent}</td>`;
      });
      ordersHtml += '</tr>';
    });
    return ordersHtml;
  };

  let bodyHtml = '';
  filteredData.forEach(row => {
    const rowKey = getRowExpansionKey(row);
    const hasSubRows = Array.isArray(row.subRows) && row.subRows.length > 1;
    const isExpanded = hasSubRows && state.expandedDateKeys.has(rowKey);
    const hasRowOrders = hasExpandableOrders(row.orders);
    const isRowOrdersExpanded = !hasSubRows && hasRowOrders && state.expandedOrderKeys.has(rowKey);

    bodyHtml += '<tr class="hover:opacity-90 transition">';
    enabledCols.forEach((col, i) => {
      const isFirst = (i === 0 || col.key === 'date');
      const widthCls = getColWidthClass(col.key, isFirst);
      const stickyCls = isFirst ? 'table-col-sticky-first font-bold border-r bg-card border-strong text-left' : '';
      const highlightCls = getColHighlightClass(col.key);
      const alignCls = isFirst ? 'text-left' : 'text-center';
      let cellContent = '';
      if (col.key === 'date') {
        const dateStr = row.fullDisplayDate || (typeof row.date === 'string' && row.date.length === 5 ? `${row.date}.2026` : row.date);
        if (hasSubRows) {
          cellContent = `
            <div class="flex items-center gap-1">
              <button type="button" data-row-toggle="${escapeHtml(rowKey)}" onclick="toggleRowExpansion('${escapeHtml(rowKey)}')" title="${isExpanded ? 'Свернуть типы транспорта' : 'Развернуть по типам транспорта'}" aria-expanded="${isExpanded ? 'true' : 'false'}" class="w-3.5 h-3.5 shrink-0 rounded border border-gray-400/40 bg-black/5 dark:bg-white/10 hover:bg-[#FCE000] hover:text-black hover:border-black font-extrabold text-[10px] flex items-center justify-center leading-none">${isExpanded ? '−' : '+'}</button>
              <span class="truncate">${escapeHtml(dateStr)}</span>
            </div>
          `;
        } else if (hasRowOrders) {
          cellContent = `
            <div class="flex items-center gap-1">
              <button type="button" data-expand-key="${escapeHtml(rowKey)}" onclick="toggleOrderExpansion('${escapeHtml(rowKey)}')" title="${isRowOrdersExpanded ? 'Свернуть заказы дня' : 'Развернуть заказы дня'} (${row.orders.length})" aria-expanded="${isRowOrdersExpanded ? 'true' : 'false'}" class="w-3.5 h-3.5 shrink-0 rounded border border-gray-400/40 bg-black/5 dark:bg-white/10 hover:bg-[#FCE000] hover:text-black hover:border-black font-extrabold text-[10px] flex items-center justify-center leading-none">${isRowOrdersExpanded ? '−' : '+'}</button>
              <span class="truncate">${escapeHtml(dateStr)}</span>
            </div>
          `;
        } else {
          cellContent = escapeHtml(dateStr);
        }
      } else {
        cellContent = formatTableCellValue(row, col.key, minProfitHr, maxProfitHr, minProfitHrNoBonus, maxProfitHrNoBonus);
      }
      bodyHtml += `<td class="py-1.5 px-1 text-[10px] whitespace-nowrap align-middle ${alignCls} ${widthCls} ${stickyCls} ${highlightCls}">${cellContent}</td>`;
    });
    bodyHtml += '</tr>';

    if (hasSubRows && isExpanded) {
      row.subRows.forEach((subRow, sIdx) => {
        const subKey = getSubRowOrderKey(rowKey, subRow, sIdx);
        const hasSubOrders = hasExpandableOrders(subRow.orders);
        const isSubOrdersExpanded = hasSubOrders && state.expandedOrderKeys.has(subKey);
        const subLabel = subRow.transport || (transportMeta[subRow.transportKey] && transportMeta[subRow.transportKey].label) || 'Курьер';
        const dateStr = subRow.fullDisplayDate || (typeof subRow.date === 'string' && subRow.date.length === 5 ? `${subRow.date}.2026` : subRow.date);

        bodyHtml += '<tr class="hover:opacity-90 transition table-subrow">';
        enabledCols.forEach((col, i) => {
          const isFirst = (i === 0 || col.key === 'date');
          const widthCls = getColWidthClass(col.key, isFirst);
          const stickyCls = isFirst ? 'table-col-sticky-first font-bold border-r border-strong text-left' : '';
          const highlightCls = getColHighlightClass(col.key);
          const alignCls = isFirst ? 'text-left' : 'text-center';
          let cellContent = '';
          if (col.key === 'date') {
            if (hasSubOrders) {
              cellContent = `
                <div class="flex items-center gap-1 pl-2" title="${escapeHtml(dateStr)} — ${escapeHtml(subLabel)}">
                  <span class="text-sec text-[9px] font-bold shrink-0 leading-none">↳</span>
                  <button type="button" data-expand-key="${escapeHtml(subKey)}" onclick="toggleOrderExpansion('${escapeHtml(subKey)}')" title="${isSubOrdersExpanded ? 'Свернуть заказы смены' : 'Развернуть заказы смены'} (${subRow.orders.length})" aria-expanded="${isSubOrdersExpanded ? 'true' : 'false'}" class="w-3.5 h-3.5 shrink-0 rounded border border-gray-400/40 bg-black/5 dark:bg-white/10 hover:bg-[#FCE000] hover:text-black hover:border-black font-extrabold text-[10px] flex items-center justify-center leading-none">${isSubOrdersExpanded ? '−' : '+'}</button>
                  <span class="truncate font-semibold">${escapeHtml(subLabel)}</span>
                </div>
              `;
            } else {
              cellContent = `
                <div class="flex items-center gap-1 pl-2" title="${escapeHtml(dateStr)} — ${escapeHtml(subLabel)}">
                  <span class="text-sec text-[9px] font-bold shrink-0 leading-none">↳</span>
                  <span class="truncate opacity-85 font-semibold">${escapeHtml(subLabel)}</span>
                </div>
              `;
            }
          } else {
            cellContent = formatTableCellValue(subRow, col.key, minProfitHr, maxProfitHr, minProfitHrNoBonus, maxProfitHrNoBonus);
          }
          bodyHtml += `<td class="py-1.5 px-1 text-[10px] whitespace-nowrap align-middle ${alignCls} ${widthCls} ${stickyCls} ${highlightCls}">${cellContent}</td>`;
        });
        bodyHtml += '</tr>';

        if (isSubOrdersExpanded) {
          bodyHtml += renderOrderRowsHtml(subRow.orders, subRow.transport || row.transport, true);
        }
      });
    } else if (isRowOrdersExpanded) {
      bodyHtml += renderOrderRowsHtml(row.orders, row.transport, false);
    }
  });
  tbody.innerHTML = bodyHtml;

  const totals = computeDetailedTableTotals(filteredData);
  const footCollapsed = !!state.footTotalsCollapsed;
  let footHtml = '<tr>';
  enabledCols.forEach((col, i) => {
    const isFirst = (i === 0 || col.key === 'date');
    const widthCls = getColWidthClass(col.key, isFirst);
    const stickyCls = isFirst ? 'table-col-sticky-first border-r bg-elevated border-strong text-left' : '';
    const highlightCls = getColHighlightClass(col.key);
    const alignCls = isFirst ? 'text-left' : 'text-center';
    let cellInner;
    if (isFirst) {
      cellInner = `
        <div class="flex items-center gap-1">
          <button type="button" data-foot-toggle onclick="toggleFootTotals()" title="${footCollapsed ? 'Показать значения строки ИТОГО / СР.' : 'Скрыть значения строки ИТОГО / СР.'}" aria-expanded="${footCollapsed ? 'false' : 'true'}" class="w-3.5 h-3.5 shrink-0 rounded border border-gray-400/40 bg-black/5 dark:bg-white/10 hover:bg-[#FCE000] hover:text-black hover:border-black font-extrabold text-[10px] flex items-center justify-center leading-none">${footCollapsed ? '+' : '−'}</button>
          <span class="truncate">ИТОГО / СР.</span>
        </div>
      `;
    } else {
      cellInner = footCollapsed ? '<span class="text-mut">•••</span>' : formatTableFootValue(filteredData, col.key, totals);
    }
    footHtml += `<td class="py-1.5 px-1 text-[10px] whitespace-nowrap align-middle ${alignCls} ${widthCls} ${stickyCls} ${highlightCls}">${cellInner}</td>`;
  });
  footHtml += '</tr>';
  tfoot.innerHTML = footHtml;

  updateTableFilterUI();

  if (scrollContainer && preserveScroll) {
    scrollContainer.scrollTop = prevScrollTop;
  }
}

/**
 * Однопроходная агрегация итогов таблицы доходов за O(N)
 */
function computeDetailedTableTotals(data) {
  const totals = {
    slotHours: 0,
    ordersCount: 0,
    ordersCost: 0,
    surgeRub: 0,
    ratingRub: 0,
    bonuses: 0,
    goals: 0,
    tips: 0,
    grossTotal: 0,
    tax: 0,
    expenses: 0,
    adjustments: 0,
    netProfit: 0,
    netProfitNoBonus: 0,
    surgePctSum: 0,
    ratingPctSum: 0,
    count: (data && data.length) || 0
  };
  if (!data || data.length === 0) return totals;

  for (let i = 0; i < data.length; i++) {
    const r = data[i];
    totals.slotHours += Number(r.slotHours || 0);
    totals.ordersCount += Number(r.ordersCount || 0);
    totals.ordersCost += Number(r.ordersCost || 0);
    totals.surgeRub += Number(r.surgeRub || 0);
    totals.ratingRub += Number(r.ratingRub || 0);
    totals.bonuses += Number(r.bonuses || 0);
    totals.goals += Number(r.goals || 0);
    totals.tips += Number(r.tips || 0);
    totals.grossTotal += Number(r.grossTotal || 0);
    totals.tax += Number(r.tax || 0);
    totals.expenses += Number(r.expenses || 0);
    totals.adjustments += Number(r.adjustments || 0);
    totals.netProfit += Number(r.netProfit || 0);
    totals.netProfitNoBonus += Number(r.netProfitNoBonus != null ? r.netProfitNoBonus : (r.netProfit - (r.surgeRub || 0) - (r.ratingRub || 0) - (r.bonuses || 0)));
    totals.surgePctSum += Number(r.surgePct || 0);
    totals.ratingPctSum += Number(r.ratingPct || 0);
  }
  return totals;
}

/**
 * Отображение типа(ов) транспорта в ячейке таблицы.
 * Если типов больше двух — текст сбалансированно переносится на 2 строки,
 * иначе он не помещается в клетку таблицы.
 */
function formatTransportCellHtml(types) {
  const list = (Array.isArray(types) ? types : []).filter(Boolean);
  if (list.length >= 2) {
    return `<span class="whitespace-normal break-words leading-[1.1] inline-block text-center">${list.map(escapeHtml).join('<br>')}</span>`;
  }
  return escapeHtml(list[0] || '—');
}

function formatTableCellValue(row, key, minProfitHr, maxProfitHr, minProfitHrNoBonus = 0, maxProfitHrNoBonus = 0) {
  switch (key) {
    case 'date': {
      if (row.fullDisplayDate) return escapeHtml(row.fullDisplayDate);
      if (typeof row.date === 'string' && row.date.length === 5) {
        return escapeHtml(`${row.date}.2026`);
      }
      return escapeHtml(row.date);
    }
    case 'dayOfWeek':   return escapeHtml(row.dayOfWeek);
    case 'slotHours':   {
      if (row.isOrderRow) return `${row.durationMins} мин`;
      const h = Math.round(Number(row.slotHours || 0) * 10) / 10;
      return `${h} ч`;
    }
    case 'ordersCount': return row.ordersCount;
    case 'ordersPerHr': return row.isOrderRow ? '<span class="text-mut">—</span>' : row.ordersPerHr;
    case 'transport': {
      if (Array.isArray(row.distinctTransports) && row.distinctTransports.length > 1) {
        return formatTransportCellHtml(row.distinctTransports);
      }
      const singleSummary = row.transportSummary || row.transport || '—';
      // Сводка может содержать склеенные через « + » типы — разбираем для переноса
      const summaryParts = String(singleSummary).split(' + ').map(s => s.trim()).filter(Boolean);
      if (summaryParts.length >= 2) return formatTransportCellHtml(summaryParts);
      return escapeHtml(singleSummary);
    }
    case 'grossTotal':  return `<span class="font-semibold">${formatNum(row.grossTotal)} ₽</span>`;
    case 'surgePct':
    case 'ratingPct':   return `+${row[key]}%`;
    case 'tax':         return `<span class="text-rose-400">-${formatNum(row[key])} ₽</span>`;
    case 'expenses':    return row.isOrderRow ? '<span class="text-mut">—</span>' : `<span class="text-rose-400">-${formatNum(row[key])} ₽</span>`;
    case 'adjustments': return row.adjustments === 0 ? '0 ₽' : `<span class="text-rose-400">-${formatNum(Math.abs(row.adjustments))} ₽</span>`;
    case 'netProfit': {
      if (row.netProfit < 0) {
        return `<span class="font-extrabold text-rose-500">-${formatNum(Math.abs(row.netProfit))} ₽</span>`;
      }
      return `<span class="font-extrabold text-[#18191C] dark:text-[#F5F6F8]">${formatNum(row.netProfit)} ₽</span>`;
    }
    case 'profitPerHrNoBonus': {
      const val = row.profitPerHrNoBonus != null ? row.profitPerHrNoBonus : (row.profitPerHr || 0);
      const colColor = getProfitPerHourColor(val, minProfitHrNoBonus, maxProfitHrNoBonus, state.lightMode);
      const txt = val < 0 ? `-${formatNum(Math.abs(val))}` : `${formatNum(val)}`;
      return `<span class="font-extrabold" style="color: ${colColor};">${txt} ₽/ч</span>`;
    }
    case 'profitPerHr': {
      const colColor = getProfitPerHourColor(row.profitPerHr, minProfitHr, maxProfitHr, state.lightMode);
      const txt = row.profitPerHr < 0 ? `-${formatNum(Math.abs(row.profitPerHr))}` : `${formatNum(row.profitPerHr)}`;
      return `<span class="font-extrabold" style="color: ${colColor};">${txt} ₽/ч</span>`;
    }
    case 'ordersCost':
    case 'surgeRub':
    case 'ratingRub':
    case 'bonuses':
    case 'goals':
    case 'tips':        return `${formatNum(row[key])} ₽`;
    default:            return '-';
  }
}

function formatTableFootValue(data, key, totals) {
  if (!totals) totals = computeDetailedTableTotals(data);
  const len = totals.count || 1;
  switch (key) {
    case 'dayOfWeek':   return '—';
    case 'transport': {
      const currentList = Array.from(new Set((data || []).flatMap(r => r.distinctTransports || (r.transport ? [r.transport] : []))));
      if (currentList.length) return formatTransportCellHtml(currentList);
      const ds = getActiveDatasets();
      if (ds?.distinctTransports?.length) {
        return formatTransportCellHtml(ds.distinctTransports);
      }
      return '—';
    }
    case 'slotHours':   {
      const totH = Math.round(totals.slotHours * 10) / 10;
      return `${totH} ч`;
    }
    case 'ordersCount': return totals.ordersCount;
    case 'ordersPerHr': return totals.slotHours > 0 ? (totals.ordersCount / totals.slotHours).toFixed(2) : '0.00';
    case 'surgePct':    return `+${Math.round(totals.surgePctSum / len)}%`;
    case 'ratingPct':   return `+${Math.round(totals.ratingPctSum / len)}%`;
    case 'profitPerHrNoBonus': {
      const rate = totals.slotHours > 0 ? Math.round(totals.netProfitNoBonus / totals.slotHours) : 0;
      if (rate < 0) {
        return `<span class="font-extrabold text-rose-500">-${formatNum(Math.abs(rate))} ₽/ч</span>`;
      }
      return `${formatNum(rate)} ₽/ч`;
    }
    case 'profitPerHr': {
      const rate = totals.slotHours > 0 ? Math.round(totals.netProfit / totals.slotHours) : 0;
      if (rate < 0) {
        return `<span class="font-extrabold text-rose-500">-${formatNum(Math.abs(rate))} ₽/ч</span>`;
      }
      return `${formatNum(rate)} ₽/ч`;
    }
    case 'netProfit': {
      const tot = totals.netProfit;
      if (tot < 0) {
        return `<span class="font-extrabold text-rose-500">-${formatNum(Math.abs(tot))} ₽</span>`;
      }
      return `<span class="font-extrabold text-[#18191C] dark:text-[#F5F6F8]">${formatNum(tot)} ₽</span>`;
    }
    case 'grossTotal':  return `<span class="font-semibold">${formatNum(totals.grossTotal)} ₽</span>`;
    case 'adjustments': return totals.adjustments === 0 ? '0 ₽' : `<span class="text-rose-400">-${formatNum(Math.abs(totals.adjustments))} ₽</span>`;
    case 'tax':         return `<span class="text-rose-400">-${formatNum(totals.tax)} ₽</span>`;
    case 'expenses':    return `<span class="text-rose-400">-${formatNum(totals.expenses)} ₽</span>`;
    case 'ordersCost':  return `${formatNum(totals.ordersCost)} ₽`;
    case 'surgeRub':    return `${formatNum(totals.surgeRub)} ₽`;
    case 'ratingRub':   return `${formatNum(totals.ratingRub)} ₽`;
    case 'bonuses':     return `${formatNum(totals.bonuses)} ₽`;
    case 'goals':       return `${formatNum(totals.goals)} ₽`;
    case 'tips':        return `${formatNum(totals.tips)} ₽`;
    default:            return '-';
  }
}

// Блок 2: Матрица спроса и планирование слотов
function renderBlock2() {
  const btnWeather = dom.btnWeather;
  const heatUnitSwitch = dom.heatUnitSwitchContainer;
  const districtSeasonBtn = dom.btnDistrictSeasonContainer;
  const seasonInfo = getResolvedSeasonInfo(state.season);
  const demoActive = isDemoMode();
  const caps = getDatasetCapabilities();
  const hasSurge = caps.hasSurgeCol !== false;
  if (!hasSurge && !state.heatUnitRub) {
    state.heatUnitRub = true;
  }

  if (btnWeather) {
    btnWeather.classList.remove('hidden');
    btnWeather.disabled = !demoActive;
    btnWeather.setAttribute('aria-disabled', demoActive ? 'false' : 'true');
    btnWeather.classList.toggle('btn-plan-disabled', !demoActive);
    btnWeather.classList.toggle('ya-ctrl-disabled', !demoActive);
    btnWeather.classList.toggle('active:scale-95', demoActive);
    btnWeather.classList.toggle('btn-weather-active', demoActive && state.weatherBoost);
    btnWeather.style.backgroundColor = '';
    btnWeather.style.color = '';
    btnWeather.title = demoActive
      ? 'Смоделировать повышение спроса при осадках'
      : 'Моделирование осадков доступно только в демо-режиме';
  }
  if (heatUnitSwitch) {
    heatUnitSwitch.classList.add('col-span-3');
    heatUnitSwitch.classList.remove('col-span-4');
    heatUnitSwitch.setAttribute('aria-disabled', hasSurge ? 'false' : 'true');
    heatUnitSwitch.tabIndex = hasSurge ? 0 : -1;
    heatUnitSwitch.title = hasSurge
      ? 'Переключение единиц матрицы спроса (% спроса или ₽/ч)'
      : 'Процент доплаты за спрос отсутствует в файле — показан реальный доход ₽/ч';
  }
  if (dom.lblUnitPct) {
    dom.lblUnitPct.classList.toggle('ya-ctrl-disabled', !hasSurge);
  }
  if (districtSeasonBtn) {
    districtSeasonBtn.classList.add('col-span-6');
    districtSeasonBtn.classList.remove('col-span-8');
  }

  if (demoActive) {
    const distObj = districtsData.find(d => d.id === state.districtId) || districtsData[0];
    dom.currentDistrictSeasonSub.textContent = `${distObj.shortName} • ${seasonInfo.label}`;
  } else {
    dom.currentDistrictSeasonSub.textContent = `Локация пользователя • ${seasonInfo.label}`;
  }

  if (dom.planningActionContainer) {
    dom.planningActionContainer.style.display = 'grid';
  }
  const btnPlan = $('btnPlanSlots');
  if (btnPlan) {
    if (demoActive) {
      btnPlan.disabled = false;
      btnPlan.setAttribute('aria-disabled', 'false');
      btnPlan.classList.add('btn-primary', 'active:scale-98');
      btnPlan.classList.remove('btn-plan-disabled', 'ya-ctrl-disabled');
      btnPlan.title = 'Запланировать выбранные слоты';
    } else {
      btnPlan.disabled = true;
      btnPlan.setAttribute('aria-disabled', 'true');
      btnPlan.classList.remove('btn-primary', 'active:scale-98');
      btnPlan.classList.add('btn-plan-disabled', 'ya-ctrl-disabled');
      btnPlan.title = 'Планирование слотов недоступно при импорте пользовательских данных (нужны серверные данные)';
    }
  }

  dom.lblUnitPct.classList.toggle('ya-switch-opt-active', !state.heatUnitRub);
  dom.lblUnitRub.classList.toggle('ya-switch-opt-active', state.heatUnitRub);
  if (dom.lblUnitRub) {
    dom.lblUnitRub.textContent = state.isNet ? '₽/ч (чист.)' : '₽/ч (начисл.)';
  }
  if (heatUnitSwitch) {
    heatUnitSwitch.setAttribute('aria-checked', state.heatUnitRub ? 'true' : 'false');
  }

  const userSuffix = !demoActive ? ' (по данным пользователя)' : '';
  dom.block2Title.textContent = (state.heatUnitRub
    ? (state.isNet ? 'Чистый доход в час с учетом спроса и расходов' : 'Средний общий доход в час (начислено)')
    : 'Средняя доплата за спрос по часам') + userSuffix;

  const tbody = dom.heatmapTableBody;
  let html = '';
  const activeMatrix = getActiveHeatmapMatrix();

  const validCells = [];
  activeMatrix.forEach(row => {
    row.values.forEach(baseVal => {
      const comp = getCellComputedValue(baseVal);
      if (comp) validCells.push(comp);
    });
  });

  const activeVals = validCells.map(c => state.heatUnitRub ? c.rubHr : c.pct);
  const minVal = activeVals.length > 0 ? Math.min(...activeVals) : 0;
  const maxVal = activeVals.length > 0 ? Math.max(...activeVals) : 1;

  activeMatrix.forEach((row, rIdx) => {
    html += `<tr><td class="text-left font-medium py-1.5 pl-0.5 pr-1 whitespace-nowrap text-[9.5px] opacity-80">${row.hours}</td>`;
    row.values.forEach((baseVal, cIdx) => {
      const cellKey = `${rIdx}-${cIdx}`;
      const comp = getCellComputedValue(baseVal);

      if (!comp) {
        html += `
          <td>
            <div class="heat-cell rounded-lg py-1.5 px-0 text-[10px] font-medium bg-gray-500/10 text-mut opacity-40 cursor-default select-none">
              —
            </div>
          </td>
        `;
      } else {
        const isSelected = state.selectedSlotCells.includes(cellKey);
        const displayStr = state.heatUnitRub ? `${comp.rubHr} ₽` : `+${comp.pct}%`;
        const colorCls = getHeatCellColor(comp, minVal, maxVal);
        const cellAria = state.heatUnitRub
          ? `${row.hours}, ${shortDayNames[cIdx]}: ${comp.rubHr} ₽/ч`
          : `${row.hours}, ${shortDayNames[cIdx]}: +${comp.pct}% спроса`;

        html += `
          <td>
            <div data-cell-key="${cellKey}"
                 role="button"
                 tabindex="0"
                 aria-label="${cellAria}"
                 aria-pressed="${isSelected ? 'true' : 'false'}"
                 onclick="toggleHeatCell('${cellKey}')"
                 onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleHeatCell('${cellKey}');}"
                 class="heat-cell rounded-lg py-1.5 px-0 text-[9.5px] font-bold ${colorCls} ${isSelected ? 'heat-cell-selected' : ''}">
              ${displayStr}
            </div>
          </td>
        `;
      }
    });
    html += `</tr>`;
  });
  tbody.innerHTML = html;

  updateHeatmapSummary();
  renderDistrictSeasonScreen();
}

function updateHeatmapSummary() {
  const summary = getSelectedSlotsSummary();
  const avgMetricLabel = summary.count > 0
    ? (state.heatUnitRub ? ` • Ср. ${formatNum(summary.avgHrEst)} ₽/ч` : ` • Ср. +${summary.avgPctEst}%`)
    : '';

  dom.selectedSlotsCounter.textContent = `Выбрано: ${summary.count} сл. (${summary.totalHours}ч)${avgMetricLabel}`;
  dom.btnClearSlots.classList.toggle('opacity-40', summary.count === 0);

  dom.plannedProfitEstimate.textContent = summary.totalHours > 0
    ? `Расчет прибыли: ~${formatNum(summary.totalRubEst)} ₽ (${summary.avgHrEst} ₽/ч за ${summary.totalHours}ч)`
    : `Выберите слоты в таблице для расчета прибыли`;
}

function getHeatCellColor(comp, minVal, maxVal) {
  if (!comp) return 'bg-transparent text-mut/40';
  const val = state.heatUnitRub ? comp.rubHr : comp.pct;
  if (state.heatUnitRub && val < 0) {
    return 'bg-rose-500/25 text-rose-500 font-extrabold border border-rose-400/40';
  }
  if (maxVal <= minVal) {
    return val > 0 ? 'bg-[#FCE000] text-[#141518]' : 'bg-gray-500/20 text-sec';
  }
  const ratio = (val - minVal) / (maxVal - minVal);
  if (ratio >= 0.70) return 'bg-[#FCE000] text-[#141518] font-black shadow-sm';
  if (ratio >= 0.45) return 'bg-amber-400 text-[#141518] font-bold';
  if (ratio >= 0.20) return 'bg-amber-500/35 text-main font-semibold';
  return 'bg-gray-500/20 text-sec font-medium';
}

function renderDistrictSeasonScreen() {
  const demoActive = isDemoMode();
  const availSeasons = (getActiveDatasets()?.availableSeasons) || ['summer', 'autumn', 'winter', 'spring'];

  ['auto', 'summer', 'autumn', 'winter', 'spring'].forEach(s => {
    const btn = $(`btnSeason-${s}`);
    if (btn) {
      btn.classList.toggle('ya-seg-btn-active', state.season === s);
      const sInfo = getResolvedSeasonInfo(s);
      if (s === 'auto') {
        btn.innerHTML = `Авто<br><span class="text-[8.5px] font-normal opacity-80">(4 нед.)</span>`;
      } else {
        btn.innerHTML = `${seasonMultipliers[s]?.baseLabel || seasonMultipliers[s]?.label}<br><span class="text-[8.5px] font-normal opacity-80">(${sInfo.targetYear})</span>`;
      }
      if (!demoActive && s !== 'auto') {
        const isAvail = availSeasons.includes(s);
        btn.disabled = !isAvail;
        btn.setAttribute('aria-disabled', isAvail ? 'false' : 'true');
        btn.classList.remove('opacity-30', 'pointer-events-none');
        btn.classList.toggle('btn-plan-disabled', !isAvail);
        btn.classList.toggle('ya-ctrl-disabled', !isAvail);
        btn.title = isAvail ? 'Выбрать сезон из загруженных данных' : 'Данные за этот сезон отсутствуют в файле';
      } else {
        btn.disabled = false;
        btn.setAttribute('aria-disabled', 'false');
        btn.classList.remove('opacity-30', 'pointer-events-none', 'btn-plan-disabled', 'ya-ctrl-disabled');
        btn.title = '';
      }
    }
  });

  const mapBtn = document.getElementById('btnOpenRealMap') || document.querySelector('#screenMiddleSpec button[onclick*="openRealMapModal"]');
  if (mapBtn) {
    if (demoActive) {
      mapBtn.disabled = false;
      mapBtn.setAttribute('aria-disabled', 'false');
      mapBtn.classList.remove('ya-ctrl-disabled', 'btn-plan-disabled');
      mapBtn.classList.add('ya-btn-slate', 'active:scale-98');
      mapBtn.title = 'Выбрать вымышленный район на схематической карте';
    } else {
      mapBtn.disabled = true;
      mapBtn.setAttribute('aria-disabled', 'true');
      mapBtn.classList.add('ya-ctrl-disabled', 'btn-plan-disabled');
      mapBtn.classList.remove('ya-btn-slate', 'active:scale-98');
      mapBtn.title = 'Карта районов недоступна при импорте пользовательских данных';
    }
  }

  const listContainer = dom.districtListContainer;
  dom.districtListUnitHint.textContent = state.heatUnitRub ? 'Средняя / Пик (₽/ч)' : 'Средняя / Пик (% спроса)';

  if (!demoActive) {
    const userStats = getUserDataDistrictStats();
    const seasonInfo = getResolvedSeasonInfo(state.season);
    const disabledDistrictsHtml = districtsData.map(d => `
      <button type="button" disabled aria-disabled="true"
              title="Выбор района доступен только в демо-режиме"
              class="w-full text-left ya-subcard p-3 flex items-center justify-between btn-plan-disabled ya-ctrl-disabled">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${d.color}"></span>
          <div class="truncate">
            <div class="text-xs font-bold truncate">${escapeHtml(d.name)}</div>
            <div class="text-[10px] text-sec">Демо-район (недоступно для файла)</div>
          </div>
        </div>
        <span class="text-[10px] font-semibold text-mut shrink-0 ml-2">Только демо</span>
      </button>
    `).join('');

    listContainer.innerHTML = `
      <div class="ya-subcard p-3 flex items-center justify-between ring-2 ring-[#1E293B] dark:ring-[#475569]">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="w-3 h-3 rounded-full shrink-0 bg-[#1E293B] dark:bg-[#475569]"></span>
          <div class="truncate">
            <div class="text-xs font-bold truncate">Локация пользователя</div>
            <div class="text-[10px] text-sec">Сезон: ${seasonInfo.label}</div>
          </div>
        </div>
        <div class="text-right text-xs shrink-0 ml-2">
          <div>Ср.: <b>${userStats.avgStr}</b></div>
          <div class="text-[11px] font-bold text-amber-400">Пик: ${userStats.peakStr}</div>
        </div>
      </div>
      ${disabledDistrictsHtml}
    `;
  } else {
    listContainer.innerHTML = districtsData.map(d => {
      const isCurrent = d.id === state.districtId;
      const stats = getDistrictStats(d);
      const seasonInfo = getResolvedSeasonInfo(state.season);

      return `
        <button type="button" onclick="selectDistrict('${d.id}')"
                class="w-full text-left ya-subcard p-3 cursor-pointer flex items-center justify-between transition ${
                  isCurrent ? 'ring-2 ring-[#1E293B] dark:ring-[#475569]' : 'hover:opacity-90'
                }">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${d.color}"></span>
            <div class="truncate">
              <div class="text-xs font-bold truncate">${escapeHtml(d.name)}</div>
              <div class="text-[10px] text-sec">Сезон: ${seasonInfo.label}</div>
            </div>
          </div>
          <div class="text-right text-xs shrink-0 ml-2">
            <div>Ср.: <b>${stats.avgStr}</b></div>
            <div class="text-[11px] font-bold text-amber-400">Пик: ${stats.peakStr}</div>
          </div>
        </button>
      `;
    }).join('');
  }
}

// Блок 3: Сравнение показателей (Единый расчетный конвейер)
function renderBlock3(precomputedAllTimeProfitHr) {
  const blockCaps = getDatasetCapabilities();
  const slotDisabled = blockCaps.hasSlotType === false;
  ['transport', 'slot', 'total'].forEach(m => {
    const btn = $(`btnComp-${m}`);
    if (btn) {
      btn.classList.toggle('ya-seg-btn-active', state.compareMode === m);
      if (m === 'slot') {
        btn.disabled = slotDisabled;
        btn.setAttribute('aria-disabled', slotDisabled ? 'true' : 'false');
        btn.classList.toggle('btn-plan-disabled', slotDisabled);
        btn.classList.toggle('ya-ctrl-disabled', slotDisabled);
        btn.title = slotDisabled ? 'Столбец «Тип слота» отсутствует в загруженном файле' : 'Сравнение по типу слота (Плановый / Свободный)';
      }
    }
  });

  const thead = dom.compareTableHead;
  const tbody = dom.compareTableBody;
  const tfoot = dom.compareTableFoot;
  const dsRoot = getActiveDatasets();
  const activeOrders = getActiveOrders();
  const caps = getDatasetCapabilities();

  if (!dsRoot || !dsRoot.comparisonDatasets || activeOrders.length === 0) {
    if (thead) thead.replaceChildren();
    if (tbody) tbody.innerHTML = '<tr><td class="p-3 text-center text-sec">Загрузка данных...</td></tr>';
    if (tfoot) tfoot.replaceChildren();
    return;
  }

  const allTimeProfitHr = precomputedAllTimeProfitHr !== undefined ? precomputedAllTimeProfitHr : getAllTimeHourlyProfit();
  const currentData = getCurrentDataset();
  const selectedRow = currentData[state.selectedBarIndex] || currentData[currentData.length - 1];
  const userPeriodProfitHr = selectedRow
    ? (state.isNet ? selectedRow.profitPerHr : selectedRow.grossPerHr)
    : 0;
  const userPeriodOrdersHr = selectedRow ? selectedRow.ordersPerHr : '0.00';
  const userHoursInSelectedPeriod = selectedRow ? selectedRow.slotHours : 1;
  const periodTag = selectedRow ? selectedRow.date : 'период';

  // Единое извлечение заказов выбранного периода (для 2-й колонки Тотал и в демо, и у пользователя)
  let periodOrders = [];
  if (selectedRow) {
    if (state.period === 'days') {
      const targetIso = selectedRow.fullDate || '';
      periodOrders = activeOrders.filter(o => (targetIso ? o.date === targetIso : o.displayDate === selectedRow.date));
    } else if (state.period === 'weeks') {
      const targetWk = selectedRow.weekCycleKey;
      periodOrders = activeOrders.filter(o => (o.weekCycleKey || o.weekKey) === targetWk);
    } else if (state.period === 'months') {
      const targetMck = selectedRow.monthCycleKey;
      periodOrders = activeOrders.filter(o => (targetMck ? o.monthCycleKey === targetMck : o.monthKey === selectedRow.date));
    }
  }
  const periodM = computeGroupOrderMetrics(periodOrders.length > 0 ? periodOrders : activeOrders, caps, Boolean(caps.isPureSlotLevel));

  // Динамические вымышленные ориентиры района и города для демо-режима (масштабируются от реальных данных и выбранного района)
  const demoActive = isDemoMode();
  const distObj = districtsData.find(d => d.id === state.districtId) || districtsData[0];
  const distRatio = distObj ? (distObj.avgPct / 42) : 1.0;

  const numFromStr = str => {
    const m = String(str || '').match(/-?\d+(?:[.,]\d+)?/);
    return m ? parseFloat(m[0].replace(',', '.')) : null;
  };
  const baseOrdHrNum = Math.max(1.0, parseFloat(userPeriodOrdersHr) || 2.1);
  const baseProfitNum = Number.isFinite(userPeriodProfitHr) ? userPeriodProfitHr : allTimeProfitHr;
  const pDist = numFromStr(periodM.avgDist);
  const pDur = numFromStr(periodM.avgDur);
  const pWt = numFromStr(periodM.avgWeight);
  const pPkm = numFromStr(periodM.payPerKm);
  const pPkg = numFromStr(periodM.payPerKg);
  const pWp = numFromStr(periodM.waitPct);
  const pWm = numFromStr(periodM.avgWaitMin);

  const benchTokens = !demoActive ? {} : {
    BENCH_DIST_DIST:      pDist != null ? `${(pDist * 1.07).toFixed(1)} км` : '3.0 км',
    BENCH_TOP_DIST_DIST:  pDist != null ? `${(pDist * 0.89).toFixed(1)} км` : '2.5 км',
    BENCH_CITY_DIST:      pDist != null ? `${(pDist * 1.14).toFixed(1)} км` : '3.2 км',
    BENCH_TOP_CITY_DIST:  pDist != null ? `${(pDist * 0.93).toFixed(1)} км` : '2.6 км',

    BENCH_DIST_DUR:       pDur != null ? `${Math.round(pDur * 1.12)} мин` : '22 мин',
    BENCH_TOP_DIST_DUR:   pDur != null ? `${Math.max(10, Math.round(pDur * 0.88))} мин` : '17 мин',
    BENCH_CITY_DUR:       pDur != null ? `${Math.round(pDur * 1.22)} мин` : '24 мин',
    BENCH_TOP_CITY_DUR:   pDur != null ? `${Math.max(10, Math.round(pDur * 0.92))} мин` : '18 мин',

    BENCH_DIST_WT:        pWt != null ? `${(pWt * 0.95).toFixed(1)} кг` : '4.5 кг',
    BENCH_TOP_DIST_WT:    pWt != null ? `${(pWt * 1.02).toFixed(1)} кг` : '4.9 кг',
    BENCH_CITY_WT:        pWt != null ? `${(pWt * 0.92).toFixed(1)} кг` : '4.4 кг',
    BENCH_TOP_CITY_WT:    pWt != null ? `${(pWt * 1.0).toFixed(1)} кг`  : '4.8 кг',

    BENCH_DIST_PKM:       pPkm != null ? `${Math.round(pPkm * 0.90 * distRatio)} ₽/км` : '120 ₽/км',
    BENCH_TOP_DIST_PKM:   pPkm != null ? `${Math.round(pPkm * 1.15 * distRatio)} ₽/км` : '156 ₽/км',
    BENCH_CITY_PKM:       pPkm != null ? `${Math.round(pPkm * 0.85)} ₽/км` : '114 ₽/км',
    BENCH_TOP_CITY_PKM:   pPkm != null ? `${Math.round(pPkm * 1.10)} ₽/км` : '148 ₽/км',

    BENCH_DIST_PKG:       pPkg != null ? `${Math.round(pPkg * 0.91 * distRatio)} ₽/кг` : '71 ₽/кг',
    BENCH_TOP_DIST_PKG:   pPkg != null ? `${Math.round(pPkg * 1.12 * distRatio)} ₽/кг` : '88 ₽/кг',
    BENCH_CITY_PKG:       pPkg != null ? `${Math.round(pPkg * 0.87)} ₽/кг` : '68 ₽/кг',
    BENCH_TOP_CITY_PKG:   pPkg != null ? `${Math.round(pPkg * 1.08)} ₽/кг` : '84 ₽/кг',

    BENCH_DIST_WP:        pWp != null ? `${Math.min(95, Math.round(pWp * 1.15))}%` : '33%',
    BENCH_TOP_DIST_WP:    pWp != null ? `${Math.max(5, Math.round(pWp * 0.75))}%`  : '21%',
    BENCH_CITY_WP:        pWp != null ? `${Math.min(95, Math.round(pWp * 1.22))}%` : '35%',
    BENCH_TOP_CITY_WP:    pWp != null ? `${Math.max(5, Math.round(pWp * 0.82))}%`  : '23%',

    BENCH_DIST_WM:        pWm != null ? `${(pWm * 1.18).toFixed(1)} мин` : '8.1 мин',
    BENCH_TOP_DIST_WM:    pWm != null ? `${Math.max(2.0, pWm * 0.79).toFixed(1)} мин` : '5.4 мин',
    BENCH_CITY_WM:        pWm != null ? `${(pWm * 1.25).toFixed(1)} мин` : '8.5 мин',
    BENCH_TOP_CITY_WM:    pWm != null ? `${Math.max(2.0, pWm * 0.85).toFixed(1)} мин` : '5.8 мин',

    BENCH_DIST_OHR:       (baseOrdHrNum * 0.91 * distRatio).toFixed(2),
    BENCH_TOP_DIST_OHR:   (baseOrdHrNum * 1.14 * distRatio).toFixed(2),
    BENCH_CITY_OHR:       (baseOrdHrNum * 0.86).toFixed(2),
    BENCH_TOP_CITY_OHR:   (baseOrdHrNum * 1.09).toFixed(2),

    BENCH_DIST_RATE_NUM:      Math.round(baseProfitNum * 0.89 * distRatio),
    BENCH_TOP_DIST_RATE_NUM:  Math.round(baseProfitNum * 1.15 * distRatio),
    BENCH_CITY_RATE_NUM:      Math.round(baseProfitNum * 0.83),
    BENCH_TOP_CITY_RATE_NUM:  Math.round(baseProfitNum * 1.09)
  };

  const ds = dsRoot.comparisonDatasets[state.compareMode];
  const formatHeaderWithParens = (str) => {
    if (!str) return '';
    const idx = str.indexOf('(');
    if (idx > 0) {
      const mainPart = str.substring(0, idx).trim();
      const parenPart = str.substring(idx).trim();
      return `<span class="whitespace-nowrap">${escapeHtml(mainPart)}</span><br><span class="text-[9px] font-normal opacity-80 whitespace-nowrap">${escapeHtml(parenPart)}</span>`;
    }
    return escapeHtml(str);
  };

  let headHtml = `<tr><th scope="col" class="py-1.5 px-2.5 font-bold text-[10px] leading-snug whitespace-normal sticky left-0 z-10 border-r min-w-[105px] max-w-[125px] bg-elevated border-strong">Показатель</th>`;
  ds.columns.forEach(colItem => {
    if (typeof colItem === 'object') {
      if (colItem.forecast) {
        headHtml += `
          <th scope="col" class="py-1.5 px-2 font-bold text-[10px] leading-snug text-center whitespace-normal align-middle min-w-[65px] max-w-[95px]">
            <div class="inline-flex items-center justify-center gap-1 flex-wrap">
              <span>${formatHeaderWithParens(colItem.title)}</span>
              <button type="button" onclick="openForecastInfoModal()" title="Как рассчитывается прогноз" class="w-4 h-4 rounded-full bg-[#1E293B] dark:bg-[#334155] text-white dark:text-[#F8FAFC] font-extrabold text-[9px] inline-flex items-center justify-center shadow hover:opacity-90 active:scale-95 transition">?</button>
            </div>
          </th>
        `;
      } else {
        headHtml += `<th scope="col" class="py-1.5 px-2 font-bold text-[10px] leading-snug text-center whitespace-normal align-middle min-w-[65px] max-w-[95px]">${formatHeaderWithParens(colItem.title)}</th>`;
      }
    } else {
      let resolvedColName = colItem;
      if (colItem === 'DYNAMIC_PERIOD_COL') resolvedColName = `Вы (${periodTag})`;
      if (colItem === 'AVG_DIST_COL')       resolvedColName = `Ср. район (${periodTag})`;
      if (colItem === 'TOP_DIST_COL')       resolvedColName = `Топ-20% района (${periodTag})`;
      if (colItem === 'AVG_CITY_COL')       resolvedColName = `Ср. город (${periodTag})`;
      if (colItem === 'TOP_CITY_COL')       resolvedColName = `Топ-20% города (${periodTag})`;
      headHtml += `<th scope="col" class="py-1.5 px-2 font-bold text-[10px] leading-snug text-center whitespace-normal align-middle min-w-[65px] max-w-[95px]">${formatHeaderWithParens(resolvedColName)}</th>`;
    }
  });
  headHtml += `</tr>`;
  thead.innerHTML = headHtml;

  let bodyHtml = '';
  ds.rowsPerOrder.forEach(row => {
    bodyHtml += `<tr class="hover:opacity-90">
      <td class="py-1.5 px-2.5 font-medium text-[10px] leading-snug whitespace-normal sticky left-0 z-10 border-r min-w-[105px] max-w-[125px] bg-card border-strong text-sec">${escapeHtml(row.label)}</td>`;
    row.vals.forEach(v => {
      let cellVal = v;
      if (cellVal === 'DYNAMIC_DIST') cellVal = periodM.avgDist;
      else if (cellVal === 'DYNAMIC_DUR') cellVal = periodM.avgDur;
      else if (cellVal === 'DYNAMIC_WEIGHT') cellVal = periodM.avgWeight;
      else if (cellVal === 'DYNAMIC_PAY_KM') cellVal = periodM.payPerKm;
      else if (cellVal === 'DYNAMIC_PAY_KG') cellVal = periodM.payPerKg;
      else if (cellVal === 'DYNAMIC_WAIT_PCT') cellVal = periodM.waitPct;
      else if (cellVal === 'DYNAMIC_WAIT_MIN') cellVal = periodM.avgWaitMin;
      else if (cellVal === 'DYNAMIC_ORDERS_IN_SLOT') cellVal = periodM.avgOrdersPerSlot;
      else if (benchTokens[cellVal] !== undefined) cellVal = benchTokens[cellVal];
      bodyHtml += `<td class="py-1.5 px-2 text-[10px] text-center whitespace-nowrap min-w-[65px]">${escapeHtml(cellVal)}</td>`;
    });
    bodyHtml += `</tr>`;
  });
  tbody.innerHTML = bodyHtml;

  let cachedTransportStats = null;
  let cachedSlotStats = null;
  const getTransportStats = () => {
    if (!cachedTransportStats) cachedTransportStats = calculateTransportStats(activeOrders);
    return cachedTransportStats;
  };
  const getSlotStats = () => {
    if (!cachedSlotStats) cachedSlotStats = calculateSlotStats(activeOrders);
    return cachedSlotStats;
  };

  const formatCompRate = (val) => {
    if (val == null || isNaN(val)) return '—';
    if (val < 0) {
      return `<span class="text-rose-500 font-extrabold">-${formatNum(Math.abs(val))} ₽/ч</span>`;
    }
    return `<span class="font-extrabold">${formatNum(val)} ₽/ч</span>`;
  };

  let footHtml = '';
  ds.rowsTotal.forEach(row => {
    const isRateRow = row.label.includes('Прибыль') || row.label.includes('доход') || row.label.includes('Начислено');
    const displayRowLabel = isRateRow
      ? (state.isNet ? 'Прибыль в час' : 'Начислено в час')
      : row.label;

    footHtml += `<tr>
      <td class="py-1.5 px-2.5 font-extrabold text-[10px] leading-snug whitespace-normal sticky left-0 z-10 border-r min-w-[105px] max-w-[125px] bg-elevated border-strong">${escapeHtml(displayRowLabel)}</td>`;
    row.vals.forEach(v => {
      let cellVal = String(v).trim();
      if (cellVal === 'DYNAMIC') cellVal = formatCompRate(userPeriodProfitHr);
      else if (cellVal === 'DYNAMIC_ORD_HR') cellVal = `${userPeriodOrdersHr}`;
      else if (cellVal === 'ALLTIME') cellVal = formatCompRate(allTimeProfitHr);
      else if (cellVal === 'TOTAL_ORD_HR_DYN') {
        cellVal = `${getTransportStats().totalOrdersPerHr}`;
      } else if (cellVal === 'SLOT_PLAN_ORD_HR_DYN') {
        const sStats = getSlotStats();
        cellVal = sStats.planHrs > 0 ? `${sStats.planOrdHr}` : '—';
      } else if (cellVal === 'SLOT_FREE_ORD_HR_DYN') {
        const sStats = getSlotStats();
        cellVal = sStats.freeHrs > 0 ? `${sStats.freeOrdHr}` : '—';
      } else if (cellVal === 'PLAN_SLOT_DYN') {
        const sStats = getSlotStats();
        cellVal = sStats.planHrs > 0 ? formatCompRate(sStats.planProfitPerHr) : '—';
      } else if (cellVal === 'FREE_SLOT_DYN') {
        const sStats = getSlotStats();
        cellVal = sStats.freeHrs > 0 ? formatCompRate(sStats.freeProfitPerHr) : '—';
      } else if (cellVal.startsWith('TRANSPORT_') && cellVal.endsWith('_PROFIT_DYN')) {
        const tKey = cellVal.replace('TRANSPORT_', '').replace('_PROFIT_DYN', '').toLowerCase();
        const item = getTransportStats().byTransport[tKey];
        cellVal = item ? formatCompRate(item.profitPerHr) : '—';
      } else if (cellVal.startsWith('TRANSPORT_') && cellVal.endsWith('_ORD_HR_DYN')) {
        const tKey = cellVal.replace('TRANSPORT_', '').replace('_ORD_HR_DYN', '').toLowerCase();
        const item = getTransportStats().byTransport[tKey];
        cellVal = item ? `${item.ordersPerHr}` : '—';
      } else if (cellVal === 'CAR_FORECAST_DYN') {
        const val = getTransportProfitPerHourForComparison('car', userHoursInSelectedPeriod, currentData);
        cellVal = formatCompRate(val);
      } else if (cellVal.endsWith('_RATE') && benchTokens[`${cellVal}_NUM`] !== undefined) {
        cellVal = formatCompRate(benchTokens[`${cellVal}_NUM`]);
      } else if (benchTokens[cellVal] !== undefined) {
        cellVal = benchTokens[cellVal];
      }
      footHtml += `<td class="py-1.5 px-2 text-[10px] text-center font-extrabold whitespace-nowrap min-w-[65px]">${cellVal}</td>`;
    });
    footHtml += `</tr>`;
  });
  tfoot.innerHTML = footHtml;
}

function updateWeekStartDayUI() {
  const curIdx = state.weekStartDay ?? 0;
  const lbl = $('lblCurrentWeekStart');
  if (lbl) {
    lbl.textContent = fullDayNames[curIdx] || 'Понедельник';
  }
  for (let i = 0; i < 7; i++) {
    const btn = $(`btnWeekStart-${i}`);
    if (btn) {
      if (i === curIdx) {
        btn.classList.add('ya-seg-btn-active');
      } else {
        btn.classList.remove('ya-seg-btn-active');
      }
    }
  }
}

function setWeekStartDay(dayIdx) {
  const parsed = parseInt(dayIdx, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > 6) return;
  state.weekStartDay = parsed;
  saveAppSettings();
  // Хранится исключительно в оперативной памяти (in-memory) без записи на диск / localStorage

  if (state.activeOrders && state.activeOrders.length > 0) {
    state.activeDatasets = buildDatasetsFromOrders(state.activeOrders, state.datasetCapabilities, isDemoMode());
  }
  dataCache.invalidate();
  updateWeekStartDayUI();
  renderHeader();
  renderBlock1();
  renderBlock2();
  renderBlock3();
  renderSettingsScreen(false);
  const dayName = fullDayNames[parsed] || 'Понедельник';
  showToast(`Старт недели: ${dayName}`);
}

// Экран настроек
function renderSettingsScreen(skipSlidersRebuild = false) {
  const caps = getDatasetCapabilities();
  const hasGoalsCol = caps.hasGoals !== false;
  dom.chkIncludeGoals.checked = hasGoalsCol ? state.includeGoals : false;
  dom.chkIncludeGoals.disabled = !hasGoalsCol;
  const goalsWrap = dom.chkIncludeGoals.closest('label');
  if (goalsWrap) {
    goalsWrap.classList.toggle('ya-ctrl-disabled', !hasGoalsCol);
    goalsWrap.classList.toggle('cursor-pointer', hasGoalsCol);
    goalsWrap.classList.toggle('cursor-not-allowed', !hasGoalsCol);
    goalsWrap.title = hasGoalsCol
      ? 'Включать бонусные цели в расчет прибыли и графиков'
      : 'Столбец «Цель» отсутствует в загруженном файле';
  }
  updateWeekStartDayUI();

  ['walk', 'bike', 'ebike', 'car'].forEach(t => {
    const btn = $(`presetBtn-${t}`);
    if (btn) {
      const isSelected = state.selectedPreset === t;
      btn.classList.toggle('ya-preset-btn-active', isSelected);
      btn.classList.toggle('bg-elevated', !isSelected);
      btn.style.backgroundColor = '';
      btn.style.color = '';
    }

    const sumSpan = $(`presetSum-${t}`);
    if (sumSpan) sumSpan.textContent = `${formatNum(getWeeklyExpenseForTransport(t))} ₽`;
  });

  dom.totalWeeklyExpenseBadge.textContent = `${formatNum(getTotalWeeklyExpenses())} ₽/нед`;

  if (!skipSlidersRebuild) {
    const slidersEl = dom.expenseSlidersContainer;
    const expensesList = state.expenses;
    if (expensesList.length === 0) {
      slidersEl.innerHTML = `
        <div class="ya-subcard p-3 text-center text-[11px] text-sec">
          Все статьи расходов удалены (0 ₽/нед). Добавьте свою статью или нажмите «Сбросить по умолчанию».
        </div>
      `;
    } else {
      slidersEl.innerHTML = expensesList.map((item, idx) => `
        <div class="ya-subcard p-2.5 space-y-1.5">
          <div class="flex items-center justify-between text-xs gap-2">
            <span class="font-bold truncate">${escapeHtml(item.name)}</span>
            <div class="flex items-center gap-2 shrink-0">
              <span id="expenseValueLabel-${idx}" class="font-extrabold">${formatNum(item.value)} ₽/нед</span>
              <button type="button" onclick="deleteExpenseItem(${idx})" title="Удалить статью расхода" aria-label="Удалить статью расхода" class="w-5 h-5 rounded-md bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 flex items-center justify-center text-[10px] font-bold active:scale-95 transition">✕</button>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="stepExpense(${idx}, -100)" class="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 border border-white/10 text-xs font-extrabold active:scale-95 transition shrink-0">-100</button>
            <input id="expenseRangeInput-${idx}" type="range" min="0" max="${item.max}" step="100" value="${item.value}"
                   aria-label="${escapeHtml(item.name)}"
                   oninput="updateExpenseSlider(${idx}, this.value)"
                   class="flex-1 h-6 cursor-pointer touch-pan-y" />
            <button type="button" onclick="stepExpense(${idx}, 100)" class="px-2.5 py-1 rounded-lg bg-black/20 hover:bg-black/30 border border-white/10 text-xs font-extrabold active:scale-95 transition shrink-0">+100</button>
          </div>
        </div>
      `).join('');
    }
  }

  renderReorderableColumnsList();
}

function renderReorderableColumnsList() {
  const listEl = dom.reorderableColumnsList;
  if (!listEl) return;

  const caps = getDatasetCapabilities();
  let visibleOrderNum = 0;
  listEl.innerHTML = state.tableColumns.map((c, realIdx) => {
    if (realIdx === 0 || !isTableColumnAvailable(c.key, caps)) return '';
    visibleOrderNum++;
    return `
      <div data-col-idx="${realIdx}"
           data-col-key="${escapeHtml(c.key)}"
           class="col-reorder-item ya-subcard py-2 px-2.5 flex items-center justify-between gap-2 transition cursor-grab active:cursor-grabbing">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-xs opacity-50 font-bold select-none" title="Удерживайте для перетаскивания">☰</span>
          <span class="text-[11px] font-semibold truncate">${visibleOrderNum}. ${escapeHtml(c.label)}</span>
        </div>
        <input type="checkbox" ${c.enabled ? 'checked' : ''}
               aria-label="${escapeHtml(c.label)}"
               onchange="toggleTableColumn('${c.key}', this.checked)"
               class="w-4 h-4 accent-[#1E293B] dark:accent-[#334155] cursor-pointer shrink-0" />
      </div>
    `;
  }).join('');
}

// -----------------------------------------------------------------------------
// 6. ОПТИМИЗИРОВАННЫЙ DRAG & DROP СТОЛБЦОВ
// -----------------------------------------------------------------------------

const dragColState = {
  timer: null,
  active: false,
  draggedIdx: null,
  activeRowEl: null,
  startX: 0,
  startY: 0,
  pointerId: null
};

function setupColumnDragDelegation() {
  const container = dom.reorderableColumnsList;
  if (!container || container.dataset.dragInitialized) return;
  container.dataset.dragInitialized = 'true';

  container.addEventListener('pointerdown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    const row = e.target.closest('.col-reorder-item');
    if (!row) return;

    const rowKey = row.getAttribute('data-col-key');
    const resolvedIdx = rowKey ? state.tableColumns.findIndex(col => col.key === rowKey) : Number(row.getAttribute('data-col-idx'));
    clearTimeout(dragColState.timer);
    dragColState.startX = e.clientX;
    dragColState.startY = e.clientY;
    dragColState.pointerId = e.pointerId;

    dragColState.timer = setTimeout(() => {
      dragColState.active = true;
      dragColState.draggedIdx = resolvedIdx;
      dragColState.activeRowEl = row;
      row.classList.add('col-drag-active');
      if (typeof row.setPointerCapture === 'function') {
        try { row.setPointerCapture(e.pointerId); } catch (_) {}
      }
      showToast('Перетащите столбец вверх или вниз');
    }, 240);
  });
}

window.addEventListener('pointermove', (e) => {
  if (!dragColState.active && dragColState.timer && dragColState.pointerId === e.pointerId) {
    if (Math.hypot(e.clientX - dragColState.startX, e.clientY - dragColState.startY) > 8) {
      clearTimeout(dragColState.timer);
      dragColState.timer = null;
      dragColState.pointerId = null;
    }
    return;
  }
  if (!dragColState.active || dragColState.draggedIdx === null) return;
  e.preventDefault();

  const targetEl = document.elementFromPoint(e.clientX, e.clientY);
  const overRow = targetEl ? targetEl.closest('.col-reorder-item') : null;
  if (!overRow) return;

  const overKey = overRow.getAttribute('data-col-key');
  const overIdx = overKey ? state.tableColumns.findIndex(col => col.key === overKey) : Number(overRow.getAttribute('data-col-idx'));
  if (overIdx > 0 && overIdx !== dragColState.draggedIdx) {
    const moved = state.tableColumns.splice(dragColState.draggedIdx, 1)[0];
    state.tableColumns.splice(overIdx, 0, moved);

    // Плавное перемещение DOM-узла без innerHTML, предотвращающее срыв захвата pointer capture
    const activeRow = dragColState.activeRowEl;
    if (activeRow && overRow) {
      if (overIdx > dragColState.draggedIdx) {
        overRow.after(activeRow);
      } else {
        overRow.before(activeRow);
      }
      const allRows = dom.reorderableColumnsList.querySelectorAll('.col-reorder-item');
      allRows.forEach(r => {
        const k = r.getAttribute('data-col-key');
        const ri = k ? state.tableColumns.findIndex(col => col.key === k) : -1;
        if (ri >= 0) r.setAttribute('data-col-idx', String(ri));
      });
    }

    dragColState.draggedIdx = overIdx;

    if (state.viewMode === 'table') {
      renderBlock1();
    }
  }
}, { passive: false });

const endColumnDrag = () => {
  clearTimeout(dragColState.timer);
  if (dragColState.active) {
    dragColState.active = false;
    dragColState.draggedIdx = null;
    dragColState.activeRowEl = null;
    renderReorderableColumnsList();
    if (state.viewMode === 'table') {
      renderBlock1();
    }
    saveAppSettings();
  }
};

window.addEventListener('pointerup', endColumnDrag);
window.addEventListener('pointercancel', endColumnDrag);

// -----------------------------------------------------------------------------
// 7. LEAFLET КАРТА (ЖИЗНЕННЫЙ ЦИКЛ С ПЕРЕИСПОЛЬЗОВАНИЕМ СЛОЕВ)
// -----------------------------------------------------------------------------

let leafletMap = null;
let leafletBgLayer = null;
const leafletPolygons = new Map();

function createSchematicMapLayer() {
  return L.GridLayer.extend({
    createTile(coords) {
      const tile = document.createElement('canvas');
      const size = this.getTileSize();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      tile.width = Math.round(size.x * dpr);
      tile.height = Math.round(size.y * dpr);
      const ctx = tile.getContext('2d');
      ctx.scale(dpr, dpr);

      const isLight = state.lightMode;
      const skinId = document.documentElement.dataset.skin || 'default';
      const bg = isLight
        ? (skinId === 'cyberpunk' ? '#EAE4F7' : (skinId === 'print' ? '#ECEEE6' : '#EEF2F6'))
        : (skinId === 'cyberpunk' ? '#0B0718' : (skinId === 'print' ? '#171922' : '#161922'));
      const gridColor = isLight ? 'rgba(15, 23, 42, 0.055)' : 'rgba(148, 163, 184, 0.08)';
      const roadColor = isLight ? 'rgba(100, 116, 139, 0.25)' : 'rgba(148, 163, 184, 0.22)';
      const arterialColor = isLight ? 'rgba(71, 85, 105, 0.36)' : 'rgba(203, 213, 225, 0.28)';
      const riverColor = isLight ? 'rgba(56, 189, 248, 0.28)' : 'rgba(14, 165, 233, 0.25)';
      const parkColor = isLight ? 'rgba(16, 185, 129, 0.14)' : 'rgba(16, 185, 129, 0.12)';

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size.x, size.y);

      if (!leafletMap) return tile;
      const orgX = coords.x * size.x;
      const orgY = coords.y * size.y;
      const proj = (lat, lng) => {
        const p = leafletMap.project(L.latLng(lat, lng), coords.z);
        return [p.x - orgX, p.y - orgY];
      };

      // Парковые зоны (схематичные кварталы)
      ctx.fillStyle = parkColor;
      [
        [[72, 16], [82, 28], [76, 36], [66, 26]],
        [[46, 72], [58, 86], [42, 92], [32, 80]],
        [[18, 22], [28, 34], [20, 44], [12, 32]]
      ].forEach(poly => {
        ctx.beginPath();
        poly.forEach(([la, ln], idx) => {
          const [x, y] = proj(la, ln);
          if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
      });

      // Сетка координат каждые 10 условных единиц
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let v = 0; v <= 100; v += 10) {
        const [x1, y1] = proj(v, 0);
        const [x2, y2] = proj(v, 100);
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        const [vx1, vy1] = proj(0, v);
        const [vx2, vy2] = proj(100, v);
        ctx.moveTo(vx1, vy1); ctx.lineTo(vx2, vy2);
      }
      ctx.stroke();

      // Схематическая река / канал с запада на юго-восток
      ctx.strokeStyle = riverColor;
      ctx.lineWidth = Math.max(4, Math.pow(2, coords.z) * 1.4);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      [[42, 4], [48, 24], [38, 44], [42, 62], [31, 80], [22, 98]].forEach(([la, ln], i) => {
        const [x, y] = proj(la, ln);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Второстепенные магистрали и кольцевая схема
      ctx.strokeStyle = roadColor;
      ctx.lineWidth = 1.4;
      [
        [[15, 25], [85, 52]],
        [[20, 75], [84, 38]],
        [[65, 14], [52, 88]],
        [[26, 16], [28, 76]]
      ].forEach(([a, b]) => {
        const [x1, y1] = proj(a[0], a[1]);
        const [x2, y2] = proj(b[0], b[1]);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      });

      // Главные проспекты и кольцо делового узла
      ctx.strokeStyle = arterialColor;
      ctx.lineWidth = 2.2;
      [[10, 50], [90, 50]].forEach((_, idx, arr) => {
        if (idx === 0) {
          const [x1, y1] = proj(arr[0][0], arr[0][1]);
          const [x2, y2] = proj(arr[1][0], arr[1][1]);
          ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        }
      });
      const [hx1, hy1] = proj(52, 10);
      const [hx2, hy2] = proj(52, 92);
      ctx.beginPath(); ctx.moveTo(hx1, hy1); ctx.lineTo(hx2, hy2); ctx.stroke();

      const [cxp, cyp] = proj(50, 50);
      const [edgeP] = proj(50, 64);
      const rad = Math.abs(edgeP - cxp);
      if (rad > 4) {
        ctx.beginPath();
        ctx.arc(cxp, cyp, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      return tile;
    }
  });
}

function redrawSchematicMapLayer() {
  if (leafletBgLayer && typeof leafletBgLayer.redraw === 'function') {
    leafletBgLayer.redraw();
  }
}

function openRealMapModal() {
  if (!isDemoMode()) {
    showToast('Выбор вымышленных районов на карте доступен только на демо-данных');
    return;
  }
  state.pendingMapDistrictId = state.districtId;
  showModalDialog(dom.realMapModal);
  setTimeout(() => initOrUpdateLeafletMap(), 60);
}

function closeRealMapModal() {
  cancelRealMapModal();
}

function cancelRealMapModal() {
  state.pendingMapDistrictId = null;
  closeModalDialog(dom.realMapModal);
}

function confirmRealMapDistrict() {
  const targetId = state.pendingMapDistrictId || state.districtId;
  if (targetId && targetId !== state.districtId) {
    selectDistrict(targetId);
  }
  state.pendingMapDistrictId = null;
  closeModalDialog(dom.realMapModal);
}

function initOrUpdateLeafletMap() {
  if (!window.L) {
    showToast('Библиотека карты загружается...');
    return;
  }

  if (!leafletMap) {
    leafletMap = L.map('leafletMapContainer', {
      crs: L.CRS.Simple,
      minZoom: 1,
      maxZoom: 4,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      maxBounds: [[-15, -15], [115, 115]],
      maxBoundsViscosity: 0.7,
      zoomControl: true,
      attributionControl: true
    }).setView([50, 52], 2);

    leafletMap.attributionControl.setPrefix(false);
    leafletMap.attributionControl.addAttribution('Схематическая векторная карта (офлайн)');

    const VectorBgLayer = createSchematicMapLayer();
    leafletBgLayer = new VectorBgLayer().addTo(leafletMap);

    districtsData.forEach(d => {
      const stats = getDistrictStats(d);
      const poly = L.polygon(d.polygon, {
        color: d.color,
        weight: 2,
        fillColor: d.color,
        fillOpacity: 0.22
      });

      poly.bindTooltip(
        `<div class="text-center leading-tight">
           <div class="font-extrabold text-[11px] text-[#FCE000]">${escapeHtml(d.shortName)}</div>
           <div class="text-[10px]">Ср: <b>${stats.avgStr}</b> • Пик: <b>${stats.peakStr}</b></div>
         </div>`,
        {
          permanent: true,
          direction: 'center',
          className: 'district-map-tooltip'
        }
      );

      poly.on('click', () => {
        state.pendingMapDistrictId = d.id;
        updateLeafletMapStyles(d.id);
      });

      leafletPolygons.set(d.id, poly);
    });
  } else {
    leafletMap.invalidateSize();
    redrawSchematicMapLayer();
  }

  if (!isDemoMode()) {
    leafletPolygons.forEach(p => {
      if (leafletMap.hasLayer(p)) leafletMap.removeLayer(p);
    });
    leafletMap.setView([50, 52], 2);
    dom.mapSelectedDistrictName.textContent = 'Локация пользователя (офлайн-схема)';
  } else {
    leafletPolygons.forEach(p => {
      if (!leafletMap.hasLayer(p)) p.addTo(leafletMap);
    });
    leafletMap.fitBounds([[12, 10], [88, 94]], { padding: [16, 16], animate: false });
    const activeId = state.pendingMapDistrictId || state.districtId;
    const curDist = districtsData.find(d => d.id === activeId) || districtsData[0];
    dom.mapSelectedDistrictName.textContent = curDist.name;
    updateLeafletMapStyles(activeId);
  }
}

function updateLeafletMapStyles(activeId = null) {
  if (!isDemoMode()) return;
  const effectiveId = activeId || state.pendingMapDistrictId || state.districtId;
  districtsData.forEach(d => {
    const poly = leafletPolygons.get(d.id);
    if (!poly) return;
    const isCurrent = d.id === effectiveId;
    const stats = getDistrictStats(d);

    poly.setStyle({
      color: isCurrent ? '#141518' : d.color,
      weight: isCurrent ? 3.5 : 2,
      fillColor: d.color,
      fillOpacity: isCurrent ? 0.45 : 0.22
    });

    poly.setTooltipContent(
      `<div class="text-center leading-tight">
         <div class="font-extrabold text-[11px] text-[#FCE000]">${escapeHtml(d.shortName)}</div>
         <div class="text-[10px]">Ср: <b>${stats.avgStr}</b> • Пик: <b>${stats.peakStr}</b></div>
       </div>`
    );
  });

  const curDist = districtsData.find(d => d.id === effectiveId) || districtsData[0];
  dom.mapSelectedDistrictName.textContent = curDist.name;
}

// -----------------------------------------------------------------------------
// 8. ОБРАБОТЧИКИ СОБЫТИЙ И ПОЛЬЗОВАТЕЛЬСКИХ ДЕЙСТВИЙ (PUBLIC API)
// -----------------------------------------------------------------------------

function toggleGrossNet() {
  state.isNet = !state.isNet;
  saveAppSettings();
  dataCache.invalidate();
  dom.lblGross.classList.toggle('ya-switch-opt-active', !state.isNet);
  dom.lblNet.classList.toggle('ya-switch-opt-active', state.isNet);
  if (dom.switchGrossNet) dom.switchGrossNet.setAttribute('aria-checked', state.isNet ? 'true' : 'false');
  renderHeader();
  renderBlock1();
  renderBlock2();
  renderBlock3();
}

function toggleSumHourly() {
  state.isHourly = !state.isHourly;
  saveAppSettings();
  dom.lblSum.classList.toggle('ya-switch-opt-active', !state.isHourly);
  dom.lblHourly.classList.toggle('ya-switch-opt-active', state.isHourly);
  if (dom.switchSumHourly) dom.switchSumHourly.setAttribute('aria-checked', state.isHourly ? 'true' : 'false');
  renderBlock1();
}

function toggleChartTable() {
  state.viewMode = state.viewMode === 'chart' ? 'table' : 'chart';
  saveAppSettings();
  dom.lblChart.classList.toggle('ya-switch-opt-active', state.viewMode === 'chart');
  dom.lblTable.classList.toggle('ya-switch-opt-active', state.viewMode === 'table');
  if (dom.switchChartTable) dom.switchChartTable.setAttribute('aria-checked', state.viewMode === 'table' ? 'true' : 'false');
  renderBlock1();
  if (state.viewMode === 'table') {
    requestAnimationFrame(() => {
      const scrollContainer = dom.detailedTableBody?.closest('.table-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });
  }
}

function setPeriod(p) {
  if (state.period === p) return;
  state.period = p;
  saveAppSettings();
  dataCache.invalidate();
  const currentData = getCurrentDataset();
  state.selectedBarIndex = Math.max(0, currentData.length - 1);

  ['days', 'weeks', 'months'].forEach(periodKey => {
    const btn = $(`btnPeriod-${periodKey}`);
    if (btn) btn.classList.toggle('ya-seg-btn-active', periodKey === p);
  });

  renderBlock1();
  renderBlock3();

  if (state.viewMode === 'table') {
    requestAnimationFrame(() => {
      const scrollContainer = dom.detailedTableBody?.closest('.table-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    });
  }
}

function selectBar(idx) {
  const data = getCurrentDataset();
  if (!data || data.length === 0) return;
  const safeIdx = Math.max(0, Math.min(idx, data.length - 1));
  if (state.selectedBarIndex === safeIdx) return;
  const prevIdx = state.selectedBarIndex;
  state.selectedBarIndex = safeIdx;

  const prevItem = data[prevIdx];
  const newItem = data[safeIdx];

  const prevMetric = prevItem ? (state.isNet ? (state.isHourly ? prevItem.profitPerHr : prevItem.netProfit) : (state.isHourly ? prevItem.grossPerHr : prevItem.grossTotal)) : 0;
  const newMetric = newItem ? (state.isNet ? (state.isHourly ? newItem.profitPerHr : newItem.netProfit) : (state.isHourly ? newItem.grossPerHr : newItem.grossTotal)) : 0;

  // Быстрое обновление DOM без перерисовки всей диаграммы
  const prevBackdrop = $(`barBackdrop-${prevIdx}`);
  if (prevBackdrop) {
    prevBackdrop.classList.remove('block');
    prevBackdrop.classList.add('hidden');
  }
  const prevCol = $(`barCol-${prevIdx}`);
  if (prevCol) {
    prevCol.classList.remove('chart-bar-selected');
  }
  const prevStack = $(`barStack-${prevIdx}`);
  if (prevStack) {
    prevStack.classList.remove('ring-2', 'ring-black', 'ring-[#FCE000]', 'ring-rose-400', 'opacity-90');
  }
  const prevVal = $(`barValue-${prevIdx}`);
  if (prevVal) {
    prevVal.classList.remove('opacity-100', 'font-black', 'text-[8.5px]', 'sm:text-[9px]', 'text-[10px]');
    prevVal.classList.add('opacity-75', 'text-[8px]', 'sm:text-[8.5px]');
    if (prevMetric < 0) {
      prevVal.classList.add('text-rose-500', 'font-extrabold');
      prevVal.classList.remove('text-main');
    }
  }
  const prevDate = $(`barDate-${prevIdx}`);
  if (prevDate) {
    prevDate.classList.remove('opacity-100', 'font-black', 'text-main', 'text-[10px]');
    prevDate.classList.add('opacity-70', 'font-semibold', 'text-[9px]');
  }

  const newBackdrop = $(`barBackdrop-${idx}`);
  if (newBackdrop) {
    newBackdrop.classList.remove('hidden');
    newBackdrop.classList.add('block');
  }
  const newCol = $(`barCol-${idx}`);
  if (newCol) {
    newCol.classList.add('chart-bar-selected');
  }
  const newStack = $(`barStack-${idx}`);
  if (newStack) {
    newStack.classList.remove('ring-2', 'ring-black', 'ring-rose-400', 'opacity-90');
  }
  const newVal = $(`barValue-${idx}`);
  if (newVal) {
    newVal.classList.remove('opacity-75', 'text-[8px]', 'sm:text-[8.5px]');
    newVal.classList.add('opacity-100', 'font-black', 'text-[8.5px]', 'sm:text-[9px]');
    if (newMetric < 0) {
      newVal.classList.add('text-rose-500', 'font-extrabold');
      newVal.classList.remove('text-main');
    } else {
      newVal.classList.add('text-main');
      newVal.classList.remove('text-rose-500', 'font-extrabold');
    }
  }
  const newDate = $(`barDate-${idx}`);
  if (newDate) {
    newDate.classList.remove('opacity-70', 'font-semibold', 'text-[9px]');
    newDate.classList.add('opacity-100', 'font-black', 'text-main', 'text-[10px]');
  }

  renderSelectedBarDetails(data[idx]);
  renderBlock3();

  scrollBarIntoViewIfClipped(safeIdx, 'smooth');
}

function toggleWeather() {
  if (!isDemoMode()) return;
  state.weatherBoost = !state.weatherBoost;
  saveAppSettings();
  renderBlock2();
  if (leafletMap && !dom.realMapModal.classList.contains('hidden')) {
    updateLeafletMapStyles();
  }
}

function toggleHeatUnit() {
  if (getDatasetCapabilities().hasSurgeCol === false) {
    state.heatUnitRub = true;
    showToast('Столбец спроса отсутствует в файле — доступен только режим ₽/ч');
    return;
  }
  state.heatUnitRub = !state.heatUnitRub;
  saveAppSettings();
  renderBlock2();
  if (leafletMap && !dom.realMapModal.classList.contains('hidden')) {
    updateLeafletMapStyles();
  }
}

function toggleHeatCell(cellKey) {
  const [r, c] = cellKey.split('-').map(Number);
  const activeMatrix = getActiveHeatmapMatrix();
  const rowObj = activeMatrix[r];
  const comp = getCellComputedValue(rowObj?.values[c]);
  if (!comp) return;

  const idx = state.selectedSlotCells.indexOf(cellKey);
  const cellEl = document.querySelector(`.heat-cell[data-cell-key="${cellKey}"]`);

  if (idx >= 0) {
    state.selectedSlotCells.splice(idx, 1);
    if (cellEl) cellEl.classList.remove('heat-cell-selected');
  } else {
    state.selectedSlotCells.push(cellKey);
    if (cellEl) cellEl.classList.add('heat-cell-selected');
  }

  updateHeatmapSummary();
}

function clearSelectedSlots() {
  if (state.selectedSlotCells.length === 0) return;
  state.selectedSlotCells = [];
  document.querySelectorAll('.heat-cell-selected').forEach(el => el.classList.remove('heat-cell-selected'));
  updateHeatmapSummary();
  showToast('Выбор слотов сброшен');
}

function selectTop5Slots() {
  const allCells = [];
  const activeMatrix = getActiveHeatmapMatrix();
  const scoreByRub = state.heatUnitRub || getDatasetCapabilities().hasSurgeCol === false;
  activeMatrix.forEach((row, rIdx) => {
    row.values.forEach((val, cIdx) => {
      const comp = getCellComputedValue(val);
      if (comp) {
        allCells.push({ key: `${rIdx}-${cIdx}`, val: scoreByRub ? comp.rubHr : comp.pct });
      }
    });
  });
  allCells.sort((a, b) => b.val - a.val);
  state.selectedSlotCells = allCells.slice(0, 5).map(c => c.key);

  document.querySelectorAll('.heat-cell').forEach(el => {
    const k = el.getAttribute('data-cell-key');
    el.classList.toggle('heat-cell-selected', state.selectedSlotCells.includes(k));
  });

  updateHeatmapSummary();
  showToast('Выбраны Топ-5 слотов (20 часов)');
}

function planSelectedSlots() {
  if (!isDemoMode()) {
    showToast('Планирование слотов доступно только на демо-данных');
    return;
  }
  const summary = getSelectedSlotsSummary();
  if (summary.count === 0) {
    showToast('Выберите хотя бы один слот в таблице');
    return;
  }

  const slotItemsHtml = summary.items.map(s => `
    <div class="ya-subcard py-2 px-3 flex items-center justify-between">
      <span class="font-bold">${s.day}, ${s.hours} (4ч)</span>
      <span class="font-extrabold text-amber-400">+${s.comp.pct}% • ~${formatNum(s.comp.rubHr)} ₽/ч</span>
    </div>
  `).join('');

  const acctMeta = transportMeta[state.accountTransport] || transportMeta.ebike;
  const distObj = districtsData.find(d => d.id === state.districtId) || districtsData[0];

  dom.planModalTransport.textContent = `${acctMeta.icon} ${acctMeta.label}`;
  dom.planModalDistrict.textContent = distObj.shortName;
  dom.planModalTotal.textContent = `${summary.totalHours} ч • ~${formatNum(summary.totalRubEst)} ₽`;
  dom.planModalAvg.textContent = `+${summary.avgPctEst}% • ${formatNum(summary.avgHrEst)} ₽/ч`;
  dom.planModalSlotsList.innerHTML = slotItemsHtml;

  showModalDialog(dom.planSlotsModal);
}

function closePlanSlotsModal() {
  closeModalDialog(dom.planSlotsModal);
}

function confirmPlanSlots() {
  const count = state.selectedSlotCells.length;
  closePlanSlotsModal();
  showToast(`Слоты успешно запланированы (${count} сл., ${count * 4} ч)`);
}

function openForecastInfoModal() {
  showModalDialog(dom.forecastInfoModal);
}

function closeForecastInfoModal() {
  closeModalDialog(dom.forecastInfoModal);
}

function openExpenseInfoModal(type, amount) {
  if (!dom.expenseInfoModal) return;

  let title = 'Справка о расходах';
  let subtitle = 'Откуда берутся данные и как рассчитываются';
  let bodyHtml = '';

  if (type === 'tax') {
    title = 'Налог самозанятого (НПД 6%)';
    subtitle = `Сумма за выбранный период: -${formatNum(amount || 0)} ₽`;
    bodyHtml = `
      <div class="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-1.5 border border-subtle">
        <div class="font-extrabold text-[#1E293B] dark:text-[#94A3B8] text-xs">🏛️ Налог на профессиональный доход</div>
        <p class="text-sec">Автоматический расчет для самозанятых курьеров (плательщиков НПД), сотрудничающих напрямую с сервисом или партнерами (юрлицами).</p>
      </div>
      <div class="space-y-1">
        <div class="font-bold text-main">Формула расчета:</div>
        <div class="p-2 rounded-xl bg-black/10 dark:bg-white/10 font-mono text-[11px] text-[#1E293B] dark:text-[#F8FAFC] font-semibold">
          Налог = Начислено (Gross) × ${TAX_PCT_LABEL}
        </div>
        <p class="text-[11px] text-sec">Рассчитывается от полной начисленной суммы вознаграждения до вычета расходов на транспорт и аренду.</p>
      </div>
      <div class="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-sec">
        💡 <b>Налоговый вычет:</b> Если вы недавно зарегистрировали самозанятость и расходуете бонус от ФНС (10 000 ₽), эффективная ставка налога составляет 4%. Базовая ставка без бонуса — 6%.
      </div>
    `;
  } else if (type === 'adjustments') {
    title = 'Корректировки и удержания';
    subtitle = `Сумма за выбранный период: -${formatNum(amount || 0)} ₽`;

    const records = getAdjustmentRecordsForModal();
    const disputedSet = state.disputedAdjustmentIds || new Set();
    const demoActive = isDemoMode();

    if (records.length > 0) {
      const adjItemsHtml = records.map(adj => {
        const isDisputed = disputedSet.has(adj.id);
        const actionHtml = demoActive
          ? (isDisputed
              ? `<span class="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Заявка подана</span>`
              : `<button type="button" onclick="disputeAdjustment('${escapeHtml(adj.id)}', ${Math.abs(amount || adj.amount)})" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ya-badge-red hover:opacity-90 active:scale-95 transition">Оспорить</button>`)
          : `<button type="button" disabled aria-disabled="true" title="Оспаривание через интерфейс доступно только на демо-данных" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ya-badge-red btn-plan-disabled ya-ctrl-disabled">Оспорить</button>`;

        return `
          <div class="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-subtle space-y-1.5">
            <div class="flex items-center justify-between text-[11px]">
              <span class="font-bold text-main">${escapeHtml(adj.date)} • Заказ ${escapeHtml(adj.orderNum)}</span>
              <span class="font-extrabold text-rose-500">${adj.amount} ₽</span>
            </div>
            <div class="text-[11px] text-sec">
              <div><b>Ресторан/Партнер:</b> ${escapeHtml(adj.restaurant)}</div>
              <div><b>Причина:</b> ${escapeHtml(adj.reason)}</div>
            </div>
            <div class="flex items-center justify-between pt-1 border-t border-subtle">
              <span class="text-[10px] font-mono text-sec/75">ID: ${escapeHtml(adj.id)}</span>
              ${actionHtml}
            </div>
          </div>
        `;
      }).join('');

      bodyHtml = `
        <div class="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-1">
          <div class="font-extrabold text-rose-400 text-xs">⚠️ Удержания сервиса</div>
          <p class="text-[11px] text-sec">${demoActive
            ? 'Списания за нарушение стандартов, перерасчет времени ожидания или отмены заказов. Вы можете подать апелляцию по любой спорной строке.'
            : 'Корректировки извлечены напрямую из вашего отчета (столбцы «Корректировки» и «Причина корректировки»).'}</p>
        </div>
        <div class="space-y-2 pt-1">
          <div class="font-bold text-main">Детализация корректировок:</div>
          <div class="space-y-2">
            ${adjItemsHtml}
          </div>
        </div>
        ${!demoActive ? `
        <div class="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-subtle text-[11px] text-sec">
          <b>Как оспорить:</b> откройте в приложении доставки раздел <i>«Профиль → Поддержка → Начисления и выплаты»</i> и выберите нужный заказ.
        </div>` : ''}
      `;
    } else {
      bodyHtml = `
        <div class="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-1.5 border border-subtle">
          <div class="font-extrabold text-rose-400 text-xs">⚠️ Корректировки из отчета</div>
          <p class="text-sec">Записи со списаниями извлечены из столбца «Корректировки (руб)» загруженного файла.</p>
        </div>
      `;
    }
  } else {
    title = `Расход: ${escapeHtml(type)}`;
    subtitle = `Сумма за выбранный период: -${formatNum(amount || 0)} ₽`;
    bodyHtml = `
      <div class="p-3 rounded-2xl bg-black/5 dark:bg-white/5 space-y-1.5 border border-subtle">
        <div class="font-extrabold text-[#1E293B] dark:text-[#94A3B8] text-xs">⚙️ Статья расходов курьера</div>
        <p class="text-sec">Персонализированная статья расходов, заданная для типа транспорта «${escapeHtml(transportMeta[state.accountTransport]?.label || 'Курьер')}».</p>
      </div>
      <div class="space-y-1.5">
        <div class="font-bold text-main">Как рассчитывается в выбранном периоде:</div>
        <p class="text-[11px] text-sec">Базовые расходы задаются в настройках как сумма в неделю. Они пропорционально распределяются на дни, недели или месяцы:</p>
        <div class="p-2 rounded-xl bg-black/10 dark:bg-white/10 font-mono text-[11px] text-[#1E293B] dark:text-[#F8FAFC] font-semibold">
          Дневной расход = (Недельная ставка / 7)
        </div>
        <p class="text-[11px] text-sec">В режиме пользовательских данных расходы по слотам распределяются строго пропорционально реально отработанным часам.</p>
      </div>
      <div class="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20 text-[11px] text-sec">
        ⚙️ <b>Редактирование:</b> Изменить сумму этой статьи или отключить ее можно в любой момент в «Настройках» (значок ⚙️ вверху экрана).
      </div>
    `;
  }

  dom.expenseInfoTitle.textContent = title;
  dom.expenseInfoSubtitle.textContent = subtitle;
  dom.expenseInfoBody.innerHTML = bodyHtml;
  showModalDialog(dom.expenseInfoModal);
}

/**
 * Открытие модального окна мастера импорта (Вариант 5)
 */
function openImportModal() {
  const modal = document.getElementById('importDataModal');
  if (modal) {
    showModalDialog(modal);
  }
}

/**
 * Закрытие модального окна мастера импорта
 */
function closeImportModal() {
  const modal = document.getElementById('importDataModal');
  if (modal) {
    closeModalDialog(modal);
  }
}

/**
 * Переключение выпадающего меню быстрых действий импорта (Вариант 2)
 */
function toggleImportDropdown(event) {
  closeStyleDropdown();
  closeSaveDropdown();
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const wrapper = document.getElementById('importSplitWrapper');
  const row = document.getElementById('importRowContainer');
  const menu = document.getElementById('importDropdownMenu');
  const icon = document.getElementById('importChevronIcon');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  if (isHidden) {
    menu.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
    if (wrapper) wrapper.classList.add('dropdown-active');
    if (row) row.classList.add('dropdown-active');
  } else {
    menu.classList.add('hidden');
    if (icon) icon.classList.remove('rotate-180');
    if (wrapper) wrapper.classList.remove('dropdown-active');
    if (row) row.classList.remove('dropdown-active');
  }
}

/**
 * Закрытие выпадающего меню импорта
 */
function closeImportDropdown() {
  const wrapper = document.getElementById('importSplitWrapper');
  const row = document.getElementById('importRowContainer');
  const menu = document.getElementById('importDropdownMenu');
  const icon = document.getElementById('importChevronIcon');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
  if (icon) {
    icon.classList.remove('rotate-180');
  }
  if (wrapper) wrapper.classList.remove('dropdown-active');
  if (row) row.classList.remove('dropdown-active');
}

// =============================================================================
// РУЧНОЙ ВВОД И ТАБЛИЧНЫЙ РЕДАКТОР СМЕН (v14.9.1: текущая дата и формат ДД.ММ.ГГГГ)
// =============================================================================

const ALLOWED_MANUAL_FIELDS = new Set([
  'date', 'start', 'end', 'cost', 'transport', 'ordersCnt',
  'slotType', 'slotNumber', 'dist', 'weight', 'waitRub', 'waitMin',
  'surgePct', 'ratingPct', 'bonus', 'tips', 'goal', 'adjustment',
  'adjustmentReason', 'expense'
]);

const ALLOWED_MANUAL_TRANSPORTS = new Set(['Пеший', 'Велосипед', 'Электровелосипед', 'Авто']);

/**
 * Получение текущей даты в формате ДД.ММ.ГГГГ (день, месяц, год).
 */
function getTodayDateFormatted() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}.${m}.${y}`;
}

/**
 * Нормализация любой даты (Date, ISO YYYY-MM-DD или DD.MM.YYYY) к виду ДД.ММ.ГГГГ.
 */
function formatDateToDDMMYYYY(val) {
  if (!val) return getTodayDateFormatted();
  if (typeof val === 'string') {
    const s = val.trim();
    const dotMatch = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (dotMatch) {
      const day = dotMatch[1].padStart(2, '0');
      const month = dotMatch[2].padStart(2, '0');
      let year = dotMatch[3];
      if (year.length === 2) year = '20' + year;
      return `${day}.${month}.${year}`;
    }
    const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[3].padStart(2, '0')}.${isoMatch[2].padStart(2, '0')}.${isoMatch[1]}`;
    }
  }
  if (val instanceof Date && !isNaN(val.getTime())) {
    const d = String(val.getDate()).padStart(2, '0');
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const y = val.getFullYear();
    return `${d}.${m}.${y}`;
  }
  return getTodayDateFormatted();
}

/**
 * Валидация отдельного поля строки ручного редактора смен.
 * Возвращает текст ошибки или null, если поле валидно.
 */
function validateManualField(field, value) {
  if (!ALLOWED_MANUAL_FIELDS.has(field)) return 'Недопустимое поле';

  const strVal = value !== null && value !== undefined ? String(value).trim() : '';

  switch (field) {
    case 'date': {
      if (!strVal) return 'Укажите дату смены';
      // Поддержка формата день.месяц.год (ДД.ММ.ГГГГ) и совместимость с ISO (ГГГГ-ММ-ДД)
      const dotMatch = strVal.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
      const isoMatch = strVal.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (dotMatch) {
        const day = parseInt(dotMatch[1], 10);
        const month = parseInt(dotMatch[2], 10) - 1;
        let year = parseInt(dotMatch[3], 10);
        if (year < 100) year += 2000;
        const d = new Date(year, month, day, 12, 0, 0);
        if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month) {
          return 'Некорректная дата (ДД.ММ.ГГГГ)';
        }
        return null;
      } else if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10) - 1;
        const day = parseInt(isoMatch[3], 10);
        const d = new Date(year, month, day, 12, 0, 0);
        if (isNaN(d.getTime()) || d.getDate() !== day || d.getMonth() !== month) {
          return 'Некорректная дата (ДД.ММ.ГГГГ)';
        }
        return null;
      }
      return 'Формат даты: ДД.ММ.ГГГГ';
    }
    case 'start': {
      if (!strVal) return 'Укажите время начала';
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(strVal)) return 'Формат времени: ЧЧ:ММ';
      return null;
    }
    case 'end': {
      if (!strVal) return 'Укажите время окончания';
      if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(strVal)) return 'Формат времени: ЧЧ:ММ';
      return null;
    }
    case 'cost': {
      if (strVal === '') return 'Укажите доход за смену';
      const n = Number(strVal);
      if (isNaN(n) || !Number.isFinite(n) || n < 0) return 'Доход должен быть числом ≥ 0';
      return null;
    }
    case 'transport': {
      if (!strVal) return 'Укажите тип транспорта';
      if (!ALLOWED_MANUAL_TRANSPORTS.has(strVal)) return 'Неизвестный тип транспорта';
      return null;
    }
    case 'ordersCnt': {
      if (strVal === '') return null;
      const n = Number(strVal);
      if (isNaN(n) || !Number.isFinite(n) || n < 0) return 'Количество заказов должно быть числом ≥ 0';
      return null;
    }
    case 'slotNumber': {
      if (strVal === '') return null;
      const n = Number(strVal);
      if (isNaN(n) || !Number.isFinite(n) || n < 1) return 'Номер слота должен быть ≥ 1';
      return null;
    }
    case 'dist':
    case 'weight':
    case 'waitRub':
    case 'waitMin':
    case 'bonus':
    case 'tips':
    case 'goal':
    case 'expense': {
      if (strVal === '') return null;
      const n = Number(strVal);
      if (isNaN(n) || !Number.isFinite(n) || n < 0) return 'Значение должно быть числом ≥ 0';
      return null;
    }
    case 'adjustment': {
      if (strVal === '') return null;
      const n = Number(strVal);
      if (isNaN(n) || !Number.isFinite(n)) return 'Корректировка должна быть числом';
      return null;
    }
    case 'surgePct':
    case 'ratingPct': {
      if (strVal === '') return null;
      const clean = strVal.replace('%', '').trim();
      const n = Number(clean);
      if (isNaN(n) || !Number.isFinite(n) || n < 0 || n > 1000) return 'Процент должен быть от 0 до 1000%';
      return null;
    }
    case 'adjustmentReason': {
      if (strVal.length > 500) return 'Причина корректировки не более 500 символов';
      return null;
    }
    case 'slotType': {
      return null;
    }
    default:
      return null;
  }
}

function openManualEditorModal() {
  closeImportModal();
  closeImportDropdown();

  // v14.7.0 / v14.9.1: Черновик на основе реальных данных или 1 чистая пустая строка с текущей датой ДД.ММ.ГГГГ
  if (state.usingUserData && state.activeOrders && state.activeOrders.length > 0) {
    state.manualEditorDraftRows = state.activeOrders.map(o => ({
      id: state.manualEditorRowIdCounter++,
      date: formatDateToDDMMYYYY(o.date),
      start: o.startSecs !== null && o.startSecs !== undefined ? formatSecsHHMM(o.startSecs) : '10:00',
      end: o.endSecs !== null && o.endSecs !== undefined ? formatSecsHHMM(o.endSecs) : '18:00',
      cost: Math.round(Number(o.orderCost || o.baseCost || 0)),
      transport: o.transportLabel || 'Велосипед',
      ordersCnt: Number(o.ordersCount || 1),
      slotType: o.slotType || (o.isPlannedSlot ? 'Плановый' : 'Свободный'),
      slotNumber: Number(o.slotNumber || 1),
      dist: Number(o.distance || 0),
      weight: Number(o.weight || 0),
      waitRub: Math.round(Number(o.waitRub || o.waitTimeCost || 0)),
      waitMin: Math.round(Number(o.waitMin || o.waitTimeMinutes || 0)),
      surgePct: o.surgePct ? (String(o.surgePct).includes('%') ? String(o.surgePct) : `${o.surgePct}%`) : '0%',
      ratingPct: o.ratingPct ? (String(o.ratingPct).includes('%') ? String(o.ratingPct) : `${o.ratingPct}%`) : '0%',
      bonus: Math.round(Number(o.bonus || 0)),
      tips: Math.round(Number(o.tip || 0)),
      goal: Math.round(Number(o.goalBonus || o.goalTotal || 0)),
      adjustment: Math.round(Number(o.adjustment || 0)),
      adjustmentReason: o.adjustmentReason || '',
      expense: Math.round(Number(o.expense || 0)),
      _errors: {}
    }));
  } else {
    // v14.9.1: Если пользовательских данных нет, создаём 1 чистую пустую строку с текущей датой ДД.ММ.ГГГГ
    const today = getTodayDateFormatted();
    const defaultTransport = (state.accountTransport === 'auto' ? 'Авто' :
                              state.accountTransport === 'ebike' ? 'Электровелосипед' :
                              state.accountTransport === 'bike' ? 'Велосипед' : 'Пеший');
    state.manualEditorDraftRows = [
      {
        id: state.manualEditorRowIdCounter++,
        date: today,
        start: '',
        end: '',
        cost: '',
        transport: defaultTransport,
        ordersCnt: '',
        slotType: 'Плановый',
        slotNumber: 1,
        dist: '',
        weight: '',
        waitRub: '',
        waitMin: '',
        surgePct: '0%',
        ratingPct: '0%',
        bonus: '',
        tips: '',
        goal: '',
        adjustment: '',
        adjustmentReason: '',
        expense: '',
        _errors: {}
      }
    ];
  }

  // Дублируем в state.manualEditorRows для обратной совместимости
  state.manualEditorRows = state.manualEditorDraftRows;

  renderManualEditorRows();

  const modal = document.getElementById('manualEditorModal');
  if (modal) {
    showModalDialog(modal);
  }
}

function closeManualEditorModal() {
  const modal = document.getElementById('manualEditorModal');
  if (modal) {
    closeModalDialog(modal);
  }
  // v14.7.0: При закрытии без подтверждения сбрасываем черновик, реальные данные не трогаем
  state.manualEditorDraftRows = null;
}

function addManualEditorRow() {
  // v14.9.0 (п. 2.1): Добавляем пустую строку с чистыми полями ввода
  // v14.9.1: По требованию пользователя простановка даты при добавлении строки — текущая дата (ДД.ММ.ГГГГ) вместо +1 дня
  const currentDate = getTodayDateFormatted();

  const defaultTransport = (state.accountTransport === 'auto' ? 'Авто' :
                            state.accountTransport === 'ebike' ? 'Электровелосипед' :
                            state.accountTransport === 'bike' ? 'Велосипед' : 'Пеший');

  // Добавляем пустую строку с текущей датой (ДД.ММ.ГГГГ) и чистыми полями ввода
  const newRow = {
    id: state.manualEditorRowIdCounter++,
    date: currentDate,
    start: '',
    end: '',
    cost: '',
    transport: defaultTransport,
    ordersCnt: '',
    slotType: 'Плановый',
    slotNumber: 1,
    dist: '',
    weight: '',
    waitRub: '',
    waitMin: '',
    surgePct: '0%',
    ratingPct: '0%',
    bonus: '',
    tips: '',
    goal: '',
    adjustment: '',
    adjustmentReason: '',
    expense: '',
    _errors: {}
  };

  if (!state.manualEditorRows) state.manualEditorRows = [];
  state.manualEditorRows.push(newRow);
  if (state.manualEditorDraftRows && state.manualEditorDraftRows !== state.manualEditorRows) {
    state.manualEditorDraftRows.push(newRow);
  }
  renderManualEditorRows();

  setTimeout(() => {
    const tbody = document.getElementById('manualEditorTableBody');
    if (tbody && tbody.lastElementChild) {
      tbody.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const costInput = tbody.lastElementChild.querySelector('input[type="number"]');
      if (costInput) costInput.focus();
    }
  }, 50);
}

function deleteManualEditorRow(id) {
  state.manualEditorRows = (state.manualEditorRows || []).filter(r => r.id !== id);
  if (state.manualEditorDraftRows) {
    state.manualEditorDraftRows = state.manualEditorDraftRows.filter(r => r.id !== id);
  }
  renderManualEditorRows();
}

function clearManualEditorRows() {
  const rows = state.manualEditorDraftRows || state.manualEditorRows || [];
  if (rows.length > 0) {
    openConfirmActionModal(
      'Очистить таблицу редактора?',
      `Вы собираетесь удалить все строки (${rows.length} записей) из таблицы ручного ввода.`,
      'Данные ещё не применены в основную аналитику, но несохранённый черновик будет утерян.',
      () => {
        state.manualEditorRows = [];
        state.manualEditorDraftRows = [];
        renderManualEditorRows();
        showToast('Таблица редактора очищена');
      }
    );
    return;
  }
  state.manualEditorRows = [];
  state.manualEditorDraftRows = [];
  renderManualEditorRows();
}

/**
 * v14.9.0 / v14.9.1: Безопасное обновление поля строки с защитой от Prototype Pollution,
 * DoS по длине строки и снятием ошибок в реальном времени при исправлении.
 */
function updateManualEditorRow(id, field, value, inputEl = null) {
  // Защита от Prototype Pollution
  if (!ALLOWED_MANUAL_FIELDS.has(field) || Object.prototype.hasOwnProperty.call(Object.prototype, field)) {
    return;
  }

  const rows = state.manualEditorDraftRows || state.manualEditorRows || [];
  const row = rows.find(r => r.id === id);
  if (!row) return;

  // Ограничение длины строки для защиты от Memory DoS
  const sanitizedValue = (typeof value === 'string') ? value.slice(0, 500) : value;

  const numericFields = ['cost', 'ordersCnt', 'slotNumber', 'dist', 'weight', 'waitRub', 'waitMin', 'bonus', 'tips', 'goal', 'adjustment', 'expense'];
  if (numericFields.includes(field)) {
    const trimmed = String(sanitizedValue ?? '').trim();
    if (trimmed === '') {
      row[field] = '';
    } else {
      const num = parseFloat(trimmed);
      row[field] = isNaN(num) ? trimmed : num;
    }
  } else {
    row[field] = String(sanitizedValue ?? '').trim();
  }

  // Снятие подсветки ошибки в реальном времени при вводе корректного значения
  if (row._errors && row._errors[field]) {
    const validationErr = validateManualField(field, row[field]);
    if (!validationErr) {
      delete row._errors[field];
      if (inputEl) {
        inputEl.classList.remove('manual-input-error');
        inputEl.removeAttribute('title');
        inputEl.removeAttribute('aria-invalid');
      }
    }
  }
}

function filterManualEditorTable() {
  renderManualEditorRows();
}

/**
 * Быстрая прокрутка таблицы ручного ввода в самый верх
 */
function scrollManualEditorTableToTop() {
  const container = document.getElementById('manualEditorTableContainer');
  if (container) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Быстрая прокрутка таблицы ручного ввода в самый низ
 */
function scrollManualEditorTableToBottom() {
  const container = document.getElementById('manualEditorTableContainer');
  if (container) {
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }
}

function renderManualEditorRows() {
  const tbody = document.getElementById('manualEditorTableBody');
  const emptyNotice = document.getElementById('manualEditorEmptyNotice');
  const countBadge = document.getElementById('manualEditorRowCount');
  const searchInput = document.getElementById('manualEditorSearchInput');
  const transportFilter = document.getElementById('manualEditorTransportFilter');

  if (!tbody) return;

  const rows = state.manualEditorDraftRows || state.manualEditorRows || [];
  const query = (searchInput?.value || '').trim().toLowerCase();
  const transportVal = transportFilter?.value || 'all';

  const filtered = rows.filter(r => {
    if (query && !String(r.date || '').toLowerCase().includes(query)) return false;
    if (transportVal !== 'all' && r.transport !== transportVal) return false;
    return true;
  });

  if (countBadge) {
    countBadge.textContent = (filtered.length === rows.length)
      ? `Строк: ${filtered.length}`
      : `Строк: ${filtered.length} из ${rows.length}`;
  }

  if (filtered.length === 0) {
    tbody.replaceChildren();
    if (emptyNotice) emptyNotice.classList.remove('hidden');
    return;
  }

  if (emptyNotice) emptyNotice.classList.add('hidden');

  const transportOptions = ['Пеший', 'Велосипед', 'Электровелосипед', 'Авто'];

  tbody.innerHTML = filtered.map((r, idx) => {
    const errors = r._errors || {};
    const errCls = (f) => errors[f] ? 'manual-input-error' : '';
    const errTitle = (f) => errors[f] ? `title="${escapeHtml(errors[f])}" aria-invalid="true"` : '';

    return `
    <tr class="hover:bg-elevated/50 transition-colors group">
      <td class="py-1.5 px-2 text-center text-sec font-mono text-[11px]">${idx + 1}</td>
      <!-- 1. Дата (ДД.ММ.ГГГГ) -->
      <td class="py-1.5 px-1.5">
        <input type="text" placeholder="ДД.ММ.ГГГГ" maxlength="10"
          value="${escapeHtml(String(r.date ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'date', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'date', this.value, this)"
          ${errTitle('date')}
          class="manual-table-input ${errCls('date')} w-[115px] text-xs font-semibold text-center" />
      </td>
      <!-- 2. Время старт -->
      <td class="py-1.5 px-1">
        <input type="time" value="${escapeHtml(String(r.start ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'start', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'start', this.value, this)"
          ${errTitle('start')}
          class="manual-table-input ${errCls('start')} w-[80px] text-xs font-semibold text-center" />
      </td>
      <!-- 3. Время конец -->
      <td class="py-1.5 px-1">
        <input type="time" value="${escapeHtml(String(r.end ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'end', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'end', this.value, this)"
          ${errTitle('end')}
          class="manual-table-input ${errCls('end')} w-[80px] text-xs font-semibold text-center" />
      </td>
      <!-- 4. Стоимость (руб) -->
      <td class="py-1.5 px-1.5">
        <input type="number" min="0" step="50" value="${escapeHtml(String(r.cost ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'cost', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'cost', this.value, this)"
          placeholder="0"
          ${errTitle('cost')}
          class="manual-table-input ${errCls('cost')} w-[100px] text-xs font-bold text-emerald-400 text-right" />
      </td>
      <!-- 5. Транспорт -->
      <td class="py-1.5 px-1.5 manual-select-cell">
        <select onchange="updateManualEditorRow(${r.id}, 'transport', this.value, this)"
          ${errTitle('transport')}
          class="manual-table-input ${errCls('transport')} w-[125px] text-xs font-semibold cursor-pointer">
          ${transportOptions.map(t => `<option value="${t}" ${r.transport === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </td>
      <!-- 6. Заказов -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="1" value="${escapeHtml(String(r.ordersCnt ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'ordersCnt', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'ordersCnt', this.value, this)"
          placeholder="1"
          ${errTitle('ordersCnt')}
          class="manual-table-input ${errCls('ordersCnt')} w-[65px] text-xs font-semibold text-right" />
      </td>
      <!-- 7. Тип слота -->
      <td class="py-1.5 px-1 manual-select-cell">
        <select onchange="updateManualEditorRow(${r.id}, 'slotType', this.value, this)"
          class="manual-table-input w-[95px] text-xs font-medium cursor-pointer">
          <option value="Плановый" ${r.slotType === 'Плановый' ? 'selected' : ''}>Плановый</option>
          <option value="Свободный" ${r.slotType === 'Свободный' ? 'selected' : ''}>Свободный</option>
        </select>
      </td>
      <!-- 8. Номер слота -->
      <td class="py-1.5 px-1">
        <input type="number" min="1" step="1" value="${escapeHtml(String(r.slotNumber ?? '1'))}"
          oninput="updateManualEditorRow(${r.id}, 'slotNumber', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'slotNumber', this.value, this)"
          ${errTitle('slotNumber')}
          class="manual-table-input ${errCls('slotNumber')} w-[60px] text-xs font-semibold text-center" />
      </td>
      <!-- 9. Дистанция (км) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="0.5" value="${escapeHtml(String(r.dist ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'dist', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'dist', this.value, this)"
          placeholder="0"
          ${errTitle('dist')}
          class="manual-table-input ${errCls('dist')} w-[75px] text-xs font-semibold text-right" />
      </td>
      <!-- 10. Вес (кг) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="0.5" value="${escapeHtml(String(r.weight ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'weight', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'weight', this.value, this)"
          placeholder="0"
          ${errTitle('weight')}
          class="manual-table-input ${errCls('weight')} w-[70px] text-xs font-semibold text-right" />
      </td>
      <!-- 11. Ожидание (руб) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="10" value="${escapeHtml(String(r.waitRub ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'waitRub', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'waitRub', this.value, this)"
          placeholder="0"
          ${errTitle('waitRub')}
          class="manual-table-input ${errCls('waitRub')} w-[75px] text-xs font-semibold text-right" />
      </td>
      <!-- 12. Ожидание (мин) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="1" value="${escapeHtml(String(r.waitMin ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'waitMin', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'waitMin', this.value, this)"
          placeholder="0"
          ${errTitle('waitMin')}
          class="manual-table-input ${errCls('waitMin')} w-[70px] text-xs font-semibold text-right" />
      </td>
      <!-- 13. Доплата спрос (%) -->
      <td class="py-1.5 px-1">
        <input type="text" value="${escapeHtml(String(r.surgePct ?? '0%'))}"
          oninput="updateManualEditorRow(${r.id}, 'surgePct', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'surgePct', this.value, this)"
          ${errTitle('surgePct')}
          class="manual-table-input ${errCls('surgePct')} w-[75px] text-xs font-semibold text-center" placeholder="0%" />
      </td>
      <!-- 14. Доплата рейтинг (%) -->
      <td class="py-1.5 px-1">
        <input type="text" value="${escapeHtml(String(r.ratingPct ?? '0%'))}"
          oninput="updateManualEditorRow(${r.id}, 'ratingPct', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'ratingPct', this.value, this)"
          ${errTitle('ratingPct')}
          class="manual-table-input ${errCls('ratingPct')} w-[75px] text-xs font-semibold text-center" placeholder="0%" />
      </td>
      <!-- 15. Бонус (руб) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="50" value="${escapeHtml(String(r.bonus ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'bonus', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'bonus', this.value, this)"
          placeholder="0"
          ${errTitle('bonus')}
          class="manual-table-input ${errCls('bonus')} w-[75px] text-xs font-semibold text-right" />
      </td>
      <!-- 16. Чаевые (руб) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="50" value="${escapeHtml(String(r.tips ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'tips', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'tips', this.value, this)"
          placeholder="0"
          ${errTitle('tips')}
          class="manual-table-input ${errCls('tips')} w-[75px] text-xs font-semibold text-right" />
      </td>
      <!-- 17. Цель (тотал руб) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="50" value="${escapeHtml(String(r.goal ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'goal', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'goal', this.value, this)"
          placeholder="0"
          ${errTitle('goal')}
          class="manual-table-input ${errCls('goal')} w-[75px] text-xs font-semibold text-right" />
      </td>
      <!-- 18. Корректировки (руб) -->
      <td class="py-1.5 px-1">
        <input type="number" step="50" value="${escapeHtml(String(r.adjustment ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'adjustment', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'adjustment', this.value, this)"
          placeholder="0"
          ${errTitle('adjustment')}
          class="manual-table-input ${errCls('adjustment')} w-[75px] text-xs font-semibold text-right" />
      </td>
      <!-- 19. Причина корректировки -->
      <td class="py-1.5 px-1.5">
        <input type="text" value="${escapeHtml(String(r.adjustmentReason ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'adjustmentReason', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'adjustmentReason', this.value, this)"
          maxlength="500"
          ${errTitle('adjustmentReason')}
          class="manual-table-input ${errCls('adjustmentReason')} w-[150px] text-xs font-normal" placeholder="Причина..." />
      </td>
      <!-- 20. Расход (руб) -->
      <td class="py-1.5 px-1">
        <input type="number" min="0" step="50" value="${escapeHtml(String(r.expense ?? ''))}"
          oninput="updateManualEditorRow(${r.id}, 'expense', this.value, this)"
          onchange="updateManualEditorRow(${r.id}, 'expense', this.value, this)"
          placeholder="0"
          ${errTitle('expense')}
          class="manual-table-input ${errCls('expense')} w-[75px] text-xs font-semibold text-right" />
      </td>
      <!-- Удалить -->
      <td class="py-1.5 px-2 text-center">
        <button type="button" onclick="deleteManualEditorRow(${r.id})" title="Удалить смену"
          class="w-7 h-7 inline-flex items-center justify-center rounded-lg text-rose-500 hover:text-rose-400 hover:bg-rose-500/15 active:scale-90 transition cursor-pointer">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </td>
    </tr>
  `}).join('');
}

function applyManualEditorData() {
  const rows = state.manualEditorDraftRows || state.manualEditorRows || [];
  if (rows.length === 0) {
    showToast('Добавьте хотя бы одну смену в таблицу');
    return;
  }

  // v14.9.0 / v14.9.1: Строгая валидация обязательных полей и форматов
  let hasErrors = false;
  let firstErrorField = null;
  let firstErrorRowId = null;

  for (const r of rows) {
    r._errors = {};

    // Обязательные поля
    for (const reqField of ['date', 'start', 'end', 'cost', 'transport']) {
      const err = validateManualField(reqField, r[reqField]);
      if (err) {
        r._errors[reqField] = err;
        hasErrors = true;
        if (!firstErrorField) {
          firstErrorField = reqField;
          firstErrorRowId = r.id;
        }
      }
    }

    // Опциональные поля (если заполнены, проверяем корректность формата)
    const optFields = ['ordersCnt', 'slotNumber', 'dist', 'weight', 'waitRub', 'waitMin', 'bonus', 'tips', 'goal', 'adjustment', 'expense', 'surgePct', 'ratingPct', 'adjustmentReason'];
    for (const optField of optFields) {
      if (r[optField] !== '' && r[optField] !== null && r[optField] !== undefined) {
        const err = validateManualField(optField, r[optField]);
        if (err) {
          r._errors[optField] = err;
          hasErrors = true;
          if (!firstErrorField) {
            firstErrorField = optField;
            firstErrorRowId = r.id;
          }
        }
      }
    }
  }

  if (hasErrors) {
    renderManualEditorRows();

    setTimeout(() => {
      const firstErrEl = document.querySelector('#manualEditorTableBody .manual-input-error');
      if (firstErrEl) {
        firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrEl.focus();
      }
    }, 50);

    showToast('Заполните обязательные поля: Дата (ДД.ММ.ГГГГ), Время (старт/конец) и Доход (≥ 0 ₽)');
    return;
  }

  // Сортировка по дате по возрастанию (с поддержкой формата ДД.ММ.ГГГГ)
  const parseDateToSortKey = (dateStr) => {
    if (!dateStr) return '';
    const s = String(dateStr).trim();
    const dotMatch = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (dotMatch) {
      const day = dotMatch[1].padStart(2, '0');
      const month = dotMatch[2].padStart(2, '0');
      let year = dotMatch[3];
      if (year.length === 2) year = '20' + year;
      return `${year}-${month}-${day}`;
    }
    return s;
  };
  rows.sort((a, b) => parseDateToSortKey(a.date).localeCompare(parseDateToSortKey(b.date)));

  const headers = [
    'Дата*',
    'Время (начало)*',
    'Время (конец)*',
    'Стоимость заказа*',
    'Транспорт*',
    'Кол-во заказов',
    'Тип слота',
    'Номер слота',
    'Расстояние (км)',
    'Вес (кг)',
    'Ожидание (руб)',
    'Ожидание (мин)',
    'Доплата (спрос; %)',
    'Доплата (рейтинг; %)',
    'Бонус (руб)',
    'Чаевые (руб)',
    'Цель (тотал; руб)',
    'Корректировки (руб)',
    'Причина корректировки',
    'Расход (руб)'
  ];

  const dataRows = rows.map(r => {
    const formatPct = (val) => {
      if (!val) return '0%';
      const s = String(val).trim();
      return s.endsWith('%') ? s : `${s}%`;
    };

    return [
      String(r.date).trim(),
      String(r.start).trim(),
      String(r.end).trim(),
      Number(r.cost || 0),
      String(r.transport || 'Велосипед').trim(),
      (r.ordersCnt === '' || r.ordersCnt === null || r.ordersCnt === undefined) ? 1 : Number(r.ordersCnt),
      String(r.slotType || 'Плановый').trim(),
      (r.slotNumber === '' || r.slotNumber === null || r.slotNumber === undefined) ? 1 : Number(r.slotNumber),
      (r.dist === '' || r.dist === null || r.dist === undefined) ? 0 : Number(r.dist),
      (r.weight === '' || r.weight === null || r.weight === undefined) ? 0 : Number(r.weight),
      (r.waitRub === '' || r.waitRub === null || r.waitRub === undefined) ? 0 : Math.round(Number(r.waitRub)),
      (r.waitMin === '' || r.waitMin === null || r.waitMin === undefined) ? 0 : Math.round(Number(r.waitMin)),
      formatPct(r.surgePct),
      formatPct(r.ratingPct),
      (r.bonus === '' || r.bonus === null || r.bonus === undefined) ? 0 : Math.round(Number(r.bonus)),
      (r.tips === '' || r.tips === null || r.tips === undefined) ? 0 : Math.round(Number(r.tips)),
      (r.goal === '' || r.goal === null || r.goal === undefined) ? 0 : Math.round(Number(r.goal)),
      (r.adjustment === '' || r.adjustment === null || r.adjustment === undefined) ? 0 : Math.round(Number(r.adjustment)),
      r.adjustmentReason ? String(r.adjustmentReason).trim() : '',
      (r.expense === '' || r.expense === null || r.expense === undefined) ? 0 : Math.round(Number(r.expense))
    ];
  });

  const rawRows = [headers, ...dataRows];
  const ok = applyLoadedDataset(rawRows, 'Ручной ввод', true);

  if (ok) {
    closeManualEditorModal();
    showToast(`Данные успешно применены! Смен: ${dataRows.length} 🎉`);
  }
}

/**
 * Генерация и скачивание эталонного Excel-шаблона для курьера (.xlsx)
 */
let crc32TableCache = null;
function crc32Bytes(bytes) {
  if (!crc32TableCache) {
    crc32TableCache = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      crc32TableCache[i] = c >>> 0;
    }
  }
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = crc32TableCache[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/**
 * Пост-обработка несжатого ZIP-архива (.xlsx) из SheetJS:
 * - Добавляет стиль заголовка A1:T1 (светло-серый фон #F1F5F9, жирный шрифт #0F172A, высота строки 28)
 * - Подкрашивает обязательную звездочку (*) в A1:E1 в жирный красный цвет (#DC2626) через OOXML <si><r>
 */
function enhanceTemplateWorkbookZip(zipBytes) {
  const u8 = new Uint8Array(zipBytes);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const enc = new TextEncoder();
  const dec = new TextDecoder('utf-8');

  // Поиск End of Central Directory (PK\x05\x06)
  let eocdPos = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocdPos = i;
      break;
    }
  }
  if (eocdPos < 0) return u8;

  const entryCount = dv.getUint16(eocdPos + 10, true);
  let cdPos = dv.getUint32(eocdPos + 16, true);
  const entries = [];

  for (let idx = 0; idx < entryCount; idx++) {
    if (dv.getUint32(cdPos, true) !== 0x02014b50) return u8;
    const method = dv.getUint16(cdPos + 10, true);
    const modTime = dv.getUint16(cdPos + 12, true);
    const modDate = dv.getUint16(cdPos + 14, true);
    const crc = dv.getUint32(cdPos + 16, true);
    const compSize = dv.getUint32(cdPos + 20, true);
    const uncompSize = dv.getUint32(cdPos + 24, true);
    const nameLen = dv.getUint16(cdPos + 28, true);
    const extraLen = dv.getUint16(cdPos + 30, true);
    const cmtLen = dv.getUint16(cdPos + 32, true);
    const extAttr = dv.getUint32(cdPos + 38, true);
    const lfhOffset = dv.getUint32(cdPos + 42, true);

    const nameBytes = u8.slice(cdPos + 46, cdPos + 46 + nameLen);
    const name = dec.decode(nameBytes);
    cdPos += 46 + nameLen + extraLen + cmtLen;

    const lfhNameLen = dv.getUint16(lfhOffset + 26, true);
    const lfhExtraLen = dv.getUint16(lfhOffset + 28, true);
    const dataStart = lfhOffset + 30 + lfhNameLen + lfhExtraLen;
    let data = u8.slice(dataStart, dataStart + compSize);
    let newCrc = crc;
    let newUncomp = uncompSize;

    if (method === 0) {
      if (name === 'xl/sharedStrings.xml') {
        let xml = dec.decode(data);
        xml = xml.replace(/<si><t([^>]*)>([^<]+)\*<\/t><\/si>/g, (_m, _attrs, labelText) =>
          `<si><r><rPr><b/><sz val="11"/><color rgb="FF0F172A"/><rFont val="Calibri"/></rPr><t xml:space="preserve">${labelText}</t></r><r><rPr><b/><sz val="11"/><color rgb="FFDC2626"/><rFont val="Calibri"/></rPr><t>*</t></r></si>`
        );
        data = enc.encode(xml);
        newCrc = crc32Bytes(data);
        newUncomp = data.length;
      } else if (name === 'xl/styles.xml') {
        let xml = dec.decode(data);
        xml = xml
          .replace(/<fonts count="1">/, '<fonts count="2">')
          .replace(/<\/fonts>/, '<font><b/><sz val="11"/><color rgb="FF0F172A"/><name val="Calibri"/><family val="2"/></font></fonts>')
          .replace(/<fills count="2">/, '<fills count="3">')
          .replace(/<\/fills>/, '<fill><patternFill patternType="solid"><fgColor rgb="FFF1F5F9"/><bgColor indexed="64"/></patternFill></fill></fills>')
          .replace(/<borders count="1">/, '<borders count="2">')
          .replace(/<\/borders>/, '<border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="medium"><color rgb="FF94A3B8"/></bottom><diagonal/></border></borders>')
          .replace(/<cellXfs count="1">/, '<cellXfs count="2">')
          .replace(/<\/cellXfs>/, '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf></cellXfs>');
        data = enc.encode(xml);
        newCrc = crc32Bytes(data);
        newUncomp = data.length;
      } else if (name === 'xl/worksheets/sheet1.xml') {
        let xml = dec.decode(data);
        xml = xml.replace(/<row r="1"([^>]*)>([\s\S]*?)<\/row>/, (_m, rowAttrs, rowInner) => {
          const styledInner = rowInner.replace(/<c r="([A-Z]+1)"(?:\s+s="\d+")?\s*/g, '<c r="$1" s="1" ');
          const cleanAttrs = String(rowAttrs || '').replace(/\s*(?:ht|customHeight)="[^"]*"/g, '');
          return `<row r="1"${cleanAttrs} ht="28" customHeight="1">${styledInner}</row>`;
        });
        data = enc.encode(xml);
        newCrc = crc32Bytes(data);
        newUncomp = data.length;
      }
    }

    entries.push({
      nameBytes, method, modTime, modDate, crc: newCrc,
      compSize: data.length, uncompSize: newUncomp, extAttr, data
    });
  }

  let totalLen = 22;
  entries.forEach(en => {
    totalLen += 30 + en.nameBytes.length + en.data.length + 46 + en.nameBytes.length;
  });

  const out = new Uint8Array(totalLen);
  const odv = new DataView(out.buffer);
  let pos = 0;

  entries.forEach(en => {
    en.newLfhOffset = pos;
    odv.setUint32(pos, 0x04034b50, true);
    odv.setUint16(pos + 4, 20, true);
    odv.setUint16(pos + 6, 0x0800, true); // UTF-8 filename flag
    odv.setUint16(pos + 8, en.method, true);
    odv.setUint16(pos + 10, en.modTime, true);
    odv.setUint16(pos + 12, en.modDate, true);
    odv.setUint32(pos + 14, en.crc, true);
    odv.setUint32(pos + 18, en.compSize, true);
    odv.setUint32(pos + 22, en.uncompSize, true);
    odv.setUint16(pos + 26, en.nameBytes.length, true);
    odv.setUint16(pos + 28, 0, true);
    out.set(en.nameBytes, pos + 30);
    pos += 30 + en.nameBytes.length;
    out.set(en.data, pos);
    pos += en.data.length;
  });

  const cdStart = pos;
  entries.forEach(en => {
    odv.setUint32(pos, 0x02014b50, true);
    odv.setUint16(pos + 4, 20, true);
    odv.setUint16(pos + 6, 20, true);
    odv.setUint16(pos + 8, 0x0800, true);
    odv.setUint16(pos + 10, en.method, true);
    odv.setUint16(pos + 12, en.modTime, true);
    odv.setUint16(pos + 14, en.modDate, true);
    odv.setUint32(pos + 16, en.crc, true);
    odv.setUint32(pos + 20, en.compSize, true);
    odv.setUint32(pos + 24, en.uncompSize, true);
    odv.setUint16(pos + 28, en.nameBytes.length, true);
    odv.setUint16(pos + 30, 0, true);
    odv.setUint16(pos + 32, 0, true);
    odv.setUint16(pos + 34, 0, true);
    odv.setUint16(pos + 36, 0, true);
    odv.setUint32(pos + 38, en.extAttr, true);
    odv.setUint32(pos + 42, en.newLfhOffset, true);
    out.set(en.nameBytes, pos + 46);
    pos += 46 + en.nameBytes.length;
  });

  const cdSize = pos - cdStart;
  odv.setUint32(pos, 0x06054b50, true);
  odv.setUint16(pos + 4, 0, true);
  odv.setUint16(pos + 6, 0, true);
  odv.setUint16(pos + 8, entries.length, true);
  odv.setUint16(pos + 10, entries.length, true);
  odv.setUint32(pos + 12, cdSize, true);
  odv.setUint32(pos + 16, cdStart, true);
  odv.setUint16(pos + 20, 0, true);

  return out;
}

/**
 * Генерация и скачивание 20-столбцового Excel-шаблона (.xlsx) с красной звездочкой (*) на обязательных полях
 */
function buildSampleTemplateWorkbookBytes() {
  const headers = [
    'Дата*',
    'Время (начало)*',
    'Время (конец)*',
    'Стоимость заказа*',
    'Транспорт*',
    'Кол-во заказов',
    'Тип слота',
    'Номер слота',
    'Расстояние (км)',
    'Вес (кг)',
    'Ожидание (руб)',
    'Ожидание (мин)',
    'Доплата (спрос; %)',
    'Доплата (рейтинг; %)',
    'Бонус (руб)',
    'Чаевые (руб)',
    'Цель (тотал; руб)',
    'Корректировки (руб)',
    'Причина корректировки',
    'Расход (руб)'
  ];

  // Показываем и позаказную детализацию (кол-во = 1), и пример сводной послотовой строки (кол-во = 8)
  const sampleRows = [
    ['19.10.2026', '09:05', '09:32', 165, 'Электровело', 1, 'Плановый', 1, 2.7, 4.2, 0, 0, '30%', '15%', 25, 30, 35, 0, '', 0],
    ['19.10.2026', '09:35', '10:04', 180, 'Электровело', 1, 'Плановый', 1, 3.1, 5.0, 12, 4, '35%', '15%', 0, 50, 35, 0, '', 0],
    ['19.10.2026', '10:10', '10:39', 150, 'Электровело', 1, 'Плановый', 1, 2.2, 3.4, 18, 6, '25%', '15%', 30, 0, 30, -80, 'Бистро «Уютный Дворик» • Заказ №104215: Перерасчет времени ожидания на кухне', 0],
    ['19.10.2026', '18:00', '18:28', 145, 'Пеший',       1, 'Свободный', 2, 1.3, 2.5, 0, 0, '40%', '15%', 0, 20, 25, 0, '', 0],
    ['20.10.2026', '10:00', '14:00', 1480, 'Электровело', 8, 'Плановый', 1, 22.4, 34.0, 54, 18, '32%', '15%', 160, 120, 240, 0, '', 0]
  ];

  const data = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 14 }, // Дата*
    { wch: 18 }, // Время (начало)*
    { wch: 17 }, // Время (конец)*
    { wch: 20 }, // Стоимость заказа*
    { wch: 15 }, // Транспорт*
    { wch: 18 }, // Кол-во заказов
    { wch: 14 }, // Тип слота
    { wch: 15 }, // Номер слота
    { wch: 19 }, // Расстояние (км)
    { wch: 13 }, // Вес (кг)
    { wch: 18 }, // Ожидание (руб)
    { wch: 18 }, // Ожидание (мин)
    { wch: 22 }, // Доплата (спрос; %)
    { wch: 24 }, // Доплата (рейтинг; %)
    { wch: 15 }, // Бонус (руб)
    { wch: 16 }, // Чаевые (руб)
    { wch: 21 }, // Цель (тотал; руб)
    { wch: 23 }, // Корректировки (руб)
    { wch: 52 }, // Причина корректировки
    { wch: 16 }  // Расход (руб)
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Отчет_курьера');
  const rawArr = XLSX.write(wb, { bookType: 'xlsx', type: 'array', compression: false, bookSST: true });
  return enhanceTemplateWorkbookZip(rawArr);
}

async function downloadSampleImportFile() {
  const overlay = dom.fileLoadingOverlay;
  const loadingTxt = dom.fileLoadingText;
  const needXlsxLoad = (typeof XLSX === 'undefined');
  try {
    if (needXlsxLoad && overlay) {
      if (loadingTxt) loadingTxt.textContent = 'Загрузка модуля Excel...';
      overlay.classList.remove('hidden');
    }
    await ensureXlsxLoaded();
    const finalBytes = buildSampleTemplateWorkbookBytes();
    const blob = new Blob([finalBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'courier_sample_template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('Образец courier_sample_template.xlsx (20 столбцов) успешно сформирован!');
  } catch (err) {
    console.error('Ошибка создания образца Excel:', err);
    const msg = String(err?.message || '');
    showToast(msg.includes('модуль Excel') ? msg : 'Не удалось сформировать файл образца');
  } finally {
    if (needXlsxLoad && overlay) {
      overlay.classList.add('hidden');
    }
  }
}

/**
 * Инициализация Drag & Drop и закрытия выпадающего меню по внешнему клику
 */
function setupImportMaster() {
  const dropZone = document.getElementById('importDropZone');
  if (dropZone) {
    ['dragenter', 'dragover'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('border-blue-500', 'bg-blue-500/10');
      });
    });
    ['dragleave', 'drop'].forEach(name => {
      dropZone.addEventListener(name, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('border-blue-500', 'bg-blue-500/10');
      });
    });
    dropZone.addEventListener('drop', (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        closeImportModal();
        handleUserDataFileUpload({ target: { files: e.dataTransfer.files } });
      }
    });
  }

  // Закрытие меню импорта при клике вне него
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('importSplitWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      closeImportDropdown();
    }
    const styleWrapper = document.getElementById('styleSplitWrapper');
    const mobileStyleWrapper = document.getElementById('styleMobileWrapper');
    const clickedInside = (styleWrapper && styleWrapper.contains(e.target)) ||
                          (mobileStyleWrapper && mobileStyleWrapper.contains(e.target));
    if (!clickedInside) {
      closeStyleDropdown();
    }
    const saveWrapper = document.getElementById('saveSplitWrapper');
    if (saveWrapper && !saveWrapper.contains(e.target)) {
      closeSaveDropdown();
    }
  });
}

function closeExpenseInfoModal() {
  closeModalDialog(dom.expenseInfoModal);
}

/**
 * Открытие модального окна юридических документов (Оферта / Политика конфиденциальности)
 */
function openLegalModal(docType) {
  const modal = document.getElementById('legalDocModal');
  const title = document.getElementById('legalDocTitle');
  const subtitle = document.getElementById('legalDocSubtitle');
  const body = document.getElementById('legalDocBody');
  if (!modal || !title || !body) return;

  if (docType === 'sample') {
    openImportModal();
    return;
  } else if (docType === 'terms') {
    title.textContent = 'Пользовательское соглашение (Оферта)';
    subtitle.textContent = 'Условия использования аналитического концепта';
    body.innerHTML = `
      <div class="space-y-3">
        <div>
          <div class="font-bold text-main mb-1">1. Предмет соглашения</div>
          <p>Настоящее Пользовательское соглашение (Оферта) определяет условия использования веб-интерфейса «Курьерская аналитика» (далее — Сервис), являющегося независимым исследовательским прототипом для аналитики доходов курьеров и самозанятых исполнителей.</p>
        </div>
        <div>
          <div class="font-bold text-main mb-1">2. Информационно-расчетный характер</div>
          <p>Все производимые расчеты (почасовая ставка, чистый доход, оценка налога самозанятого 6%, матрицы спроса и коэффициенты осадков) носят исключительно аналитический, ознакомительный и расчетный характер.</p>
        </div>
        <div>
          <div class="font-bold text-main mb-1">3. Условия «КАК ЕСТЬ» (AS IS) и ограничение ответственности</div>
          <p>Сервис предоставляется на условиях «КАК ЕСТЬ» («AS IS»), без каких-либо явных, подразумеваемых или установленных законом гарантий, включая, но не ограничиваясь: гарантиями коммерческой пригодности, пригодности для конкретных целей, точности, надежности, бесперебойности или безошибочности работы.</p>
          <p class="mt-1">Правообладатель и разработчик ни при каких обстоятельствах не несут ответственности перед Пользователем или третьими лицами за любые прямые, косвенные, случайные, специальные или сопутствующие убытки, включая упущенную выгоду, реальный ущерб, потерю данных, штрафные санкции со стороны служб доставки, налоговые доначисления или перерывы в деятельности, возникшие в связи с использованием, невозможностью использования или результатами работы Сервиса, даже если Правообладатель был заранее предупрежден о возможности таких убытков.</p>
          <p class="mt-1">Сервис не является работодателем, агрегатором заказов или налоговым агентом. Пользователь принимает на себя все риски и единоличную ответственность за любые решения и действия, основанные на данных Сервиса.</p>
        </div>
        <div>
          <div class="font-bold text-main mb-1">4. Интеллектуальная собственность</div>
          <p>Программный код, интерфейс, алгоритмы агрегации и графические элементы защищены авторским правом. Коммерческое использование, декомпиляция или тиражирование без согласия правообладателя запрещены.</p>
        </div>
      </div>
    `;
  } else {
    title.textContent = 'Политика конфиденциальности';
    subtitle.textContent = 'Безопасность и 100% In-Memory обработка данных';
    body.innerHTML = `
      <div class="space-y-3">
        <div class="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <div class="font-extrabold text-xs mb-0.5">🔒 100% In-Memory обработка (Zero-Server)</div>
          <p class="text-[11px] text-sec">Все пользовательские файлы обрабатываются исключительно в оперативной памяти браузера.</p>
        </div>
        <div>
          <div class="font-bold text-main mb-1">1. Локальная обработка на вашем устройстве</div>
          <p>Сервис работает по бессерверной клиентской архитектуре (Client-Side Only). При импорте отчетов Excel или CSV разбор файла выполняется встроенным кодом в оперативной памяти браузера на вашем устройстве.</p>
        </div>
        <div>
          <div class="font-bold text-main mb-1">2. Отсутствие передачи на сервера</div>
          <p>Данные о доходах, отработанных часах, чаевых и заказах никуда не передаются и не сохраняются на внешних серверах. В коде полностью отсутствуют сетевые запросы отправки данных.</p>
        </div>
        <div>
          <div class="font-bold text-main mb-1">3. Полное уничтожение данных при закрытии</div>
          <p>Загруженные отчеты и настройки существуют только в оперативной памяти текущей сессии. При закрытии вкладки или перезагрузке страницы все данные курьера безвозвратно удаляются.</p>
        </div>
        <div>
          <div class="font-bold text-main mb-1">4. Отсутствие трекеров</div>
          <p>Сервис не использует рекламные трекеры, маркетинговые пиксели и следящие файлы cookies.</p>
        </div>
      </div>
    `;
  }

  showModalDialog(modal);
}

function closeLegalModal() {
  const modal = document.getElementById('legalDocModal');
  if (modal) closeModalDialog(modal);
}

function getAdjustmentRecordsForModal() {
  const activeOrders = getActiveOrders();
  const adjOrders = activeOrders.filter(o => Number(o.adjustment || 0) < 0);
  if (!adjOrders.length) return [];

  const currentData = getCurrentDataset();
  const sel = currentData[state.selectedBarIndex];
  let scoped = [];
  if (sel) {
    if (state.period === 'days') {
      scoped = adjOrders.filter(o => o.date === sel.fullDate);
    } else if (state.period === 'weeks') {
      scoped = adjOrders.filter(o => o.weekCycleKey === sel.weekCycleKey);
    } else if (state.period === 'months') {
      scoped = adjOrders.filter(o => o.monthCycleKey === sel.monthCycleKey);
    }
  }
  const sourceList = (scoped.length > 0 ? scoped : adjOrders.slice(-15)).toReversed();

  return sourceList.map((o, idx) => {
    const rawReason = String(o.adjustmentReason || '').trim();
    let restaurant = '— (общее удержание смены)';
    let orderNum = `#${idx + 1}`;
    let reason = rawReason || 'Корректировка начисления';

    const colonPos = rawReason.indexOf(':');
    const head = colonPos > 0 ? rawReason.slice(0, colonPos).trim() : '';
    const tail = colonPos > 0 ? rawReason.slice(colonPos + 1).trim() : rawReason;
    if (tail) reason = tail;

    const numMatch = (head || rawReason).match(/(№\s*[0-9A-Za-z-]+)/);
    if (numMatch) orderNum = numMatch[1].replace(/\s+/g, '');

    if (head && head.includes('•')) {
      restaurant = head.split('•')[0].trim() || restaurant;
    } else if (head && !head.startsWith('Заказ')) {
      restaurant = head;
    }

    const cleanIdNum = orderNum.replace(/[^0-9A-Za-z]/g, '');
    const id = cleanIdNum ? `ADJ-${cleanIdNum}` : `ADJ-${o.date}-${idx}`;
    return {
      id,
      date: o.fullDisplayDate || o.date,
      orderNum,
      restaurant,
      reason,
      amount: -Math.abs(Math.round(o.adjustment || 0))
    };
  });
}

function disputeAdjustment(adjId, modalAmount) {
  if (!isDemoMode()) return;
  if (!state.disputedAdjustmentIds) state.disputedAdjustmentIds = new Set();
  state.disputedAdjustmentIds.add(adjId);
  const recs = getAdjustmentRecordsForModal();
  const adj = recs.find(a => a.id === adjId);
  showToast(`Заявка по списанию ${adj ? adj.orderNum : adjId} отправлена в поддержку!`);
  openExpenseInfoModal('adjustments', modalAmount || (adj ? Math.abs(adj.amount) : 0));
}

function setCompareMode(mode) {
  if (mode === 'slot' && getDatasetCapabilities().hasSlotType === false) {
    showToast('Столбец «Тип слота» отсутствует в загруженном файле');
    return;
  }
  if (state.compareMode === mode) return;
  state.compareMode = mode;
  saveAppSettings();
  ['transport', 'slot', 'total'].forEach(m => {
    const btn = $(`btnComp-${m}`);
    if (btn) btn.classList.toggle('ya-seg-btn-active', m === mode);
  });
  renderBlock3();
}

function onToggleGoals(checked) {
  if (getDatasetCapabilities().hasGoals === false) {
    if (dom.chkIncludeGoals) dom.chkIncludeGoals.checked = false;
    state.includeGoals = false;
    return;
  }
  state.includeGoals = checked;
  saveAppSettings();
  dataCache.invalidate();
  if (dom.goalsStatusLabel) {
    dom.goalsStatusLabel.textContent = checked ? ' (с учетом целей)' : ' (без учета целей)';
  }
  dom.legendGoalsItem.classList.toggle('hidden', !(checked && getDatasetCapabilities().hasGoals !== false));
  renderHeader();
  renderBlock1();
  renderBlock2();
  renderBlock3();
}

function toggleTableColumn(key, checked) {
  const col = state.tableColumns.find(c => c.key === key);
  if (col) { col.enabled = checked; saveAppSettings(); }
  if (state.viewMode === 'table') {
    renderBlock1();
  }
}

function applyTransportPreset(presetKey) {
  if (state.selectedPreset === presetKey) return;
  state.selectedPreset = presetKey;
  state.accountTransport = presetKey;
  saveAppSettings();
  dataCache.invalidate();
  renderSettingsScreen(false);
  renderHeader();
  renderBlock1();
  renderBlock2();
  renderBlock3();
}

function updateExpense(idx, newVal, syncRange = false) {
  const item = state.expensesByTransport[state.selectedPreset]?.[idx];
  if (!item) return;

  const num = Number(newVal);
  if (!Number.isFinite(num)) return;

  item.value = Math.min(item.max, Math.max(0, num));
  dataCache.invalidate();

  if (syncRange) {
    const rangeInput = $(`expenseRangeInput-${idx}`);
    if (rangeInput) rangeInput.value = item.value;
  }
  const valLabel = $(`expenseValueLabel-${idx}`);
  if (valLabel) valLabel.textContent = `${formatNum(item.value)} ₽/нед`;

  // Обновляем бейджи расходов
  const presetSum = $(`presetSum-${state.selectedPreset}`);
  if (presetSum) presetSum.textContent = `${formatNum(getWeeklyExpenseForTransport(state.selectedPreset))} ₽`;
  dom.totalWeeklyExpenseBadge.textContent = `${formatNum(getTotalWeeklyExpenses())} ₽/нед`;

  // Обновляем зависимые финансовые блоки (не чаще одного раза за кадр)
  scheduleFinanceRerender();
  saveAppSettingsDebounced();
}

let financeRerenderRaf = 0;
function scheduleFinanceRerender() {
  if (financeRerenderRaf) return;
  financeRerenderRaf = requestAnimationFrame(() => {
    financeRerenderRaf = 0;
    renderHeader();
    renderBlock1();
    renderBlock2();
    renderBlock3();
  });
}

function stepExpense(idx, delta) {
  const item = state.expensesByTransport[state.selectedPreset]?.[idx];
  if (item) updateExpense(idx, Number(item.value) + delta, true);
}

function updateExpenseSlider(idx, val) {
  updateExpense(idx, Number(val));
}

function deleteExpenseItem(index) {
  const list = state.expensesByTransport[state.selectedPreset];
  if (!list || index < 0 || index >= list.length) return;
  const removed = list.splice(index, 1)[0];
  dataCache.invalidate();
  saveAppSettings();
  renderSettingsScreen(false);
  renderHeader();
  renderBlock1();
  renderBlock2();
  renderBlock3();
  if (removed) showToast(`Удалена статья «${removed.name}»`);
}

function resetExpensesToDefault() {
  state.expensesByTransport = cloneExpenses();
  dataCache.invalidate();
  saveAppSettings();
  renderSettingsScreen(false);
  renderHeader();
  renderBlock1();
  renderBlock2();
  renderBlock3();
  showToast('Расходы всех типов передвижения сброшены по умолчанию');
}

function toggleAddExpenseForm() {
  const form = dom.addExpenseForm;
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) {
    dom.newExpenseNameInput.focus();
  }
}

function confirmAddCustomExpense() {
  const input = dom.newExpenseNameInput;
  const list = state.expensesByTransport[state.selectedPreset];
  if (!list) return;
  if (list.length >= 20) {
    showToast('Достигнут лимит статей расходов (максимум 20)');
    return;
  }
  const rawName = input.value.trim();
  const name = rawName.substring(0, 40) || `Расход ${list.length + 1}`;   // хранится «сырым», экранируется при выводе

  list.push({ id: 'custom_' + Date.now(), name, value: 500, max: 25000 });
  dataCache.invalidate();
  saveAppSettings();

  input.value = '';
  dom.addExpenseForm.classList.add('hidden');

  renderSettingsScreen(false);
  renderHeader();
  renderBlock1();
  renderBlock2();
  renderBlock3();
  showToast(`Добавлен расход «${name}»`);
}

function setSeason(seasonKey) {
  if (!isDemoMode() && seasonKey !== 'auto') {
    const avail = getActiveDatasets()?.availableSeasons || ['autumn'];
    if (!avail.includes(seasonKey)) {
      showToast(`В данных доступен только сезон: ${avail.map(s => seasonMultipliers[s]?.label || s).join(', ')}`);
      return;
    }
  }
  if (state.season === seasonKey) return;
  state.season = seasonKey;
  saveAppSettings();
  renderBlock2();
  if (leafletMap && !dom.realMapModal.classList.contains('hidden')) {
    updateLeafletMapStyles();
  }
}

function selectDistrict(distId) {
  if (!isDemoMode()) {
    showToast('В режиме пользовательских данных используется локация пользователя');
    return;
  }
  if (state.districtId === distId) return;
  state.districtId = distId;
  saveAppSettings();
  renderBlock1();
  renderBlock2();
  renderBlock3();
  if (leafletMap && !dom.realMapModal.classList.contains('hidden')) {
    updateLeafletMapStyles();
  }
}

// Навигация по экранам
function navigateScreen(screen) {
  // Сохраняем положение прокрутки основного экрана перед переходом на экран района/сезона или настроек
  if (state.currentScreen === 'main' && screen !== 'main') {
    state.savedMainScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  }

  state.currentScreen = screen;
  dom.screenMain.classList.toggle('hidden', screen !== 'main');
  dom.screenMiddleSpec.classList.toggle('hidden', screen !== 'middle');
  dom.screenSettings.classList.toggle('hidden', screen !== 'settings');

  if (screen !== 'main') {
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else {
    // Возвращаем пользователя ровно в то положение прокрутки, откуда он открыл окно выбора
    const targetScrollY = (typeof state.savedMainScrollY === 'number') ? state.savedMainScrollY : 0;
    window.scrollTo({ top: targetScrollY, behavior: 'instant' });

    requestAnimationFrame(() => {
      if (typeof state.savedMainScrollY === 'number') {
        window.scrollTo({ top: state.savedMainScrollY, behavior: 'instant' });
      }
      repositionChartBenchmarks();

      scrollBarIntoViewIfClipped(state.selectedBarIndex, 'instant');
    });
  }
}

const openSettingsScreen = () => {
  renderSettingsScreen(false);
  navigateScreen('settings');
};
const closeSettingsScreen = () => {
  navigateScreen('main');
  requestAnimationFrame(() => {
    const scrollContainer = document.getElementById('barScrollContainer');
    if (scrollContainer) {
      scrollBarIntoViewIfClipped(state.selectedBarIndex, 'instant');
      if (!scrollContainer.__wheelBound) {
        scrollContainer.__wheelBound = true;
        scrollContainer.addEventListener('wheel', (e) => {
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            window.scrollBy({ top: e.deltaY, behavior: 'auto' });
          }
        }, { passive: true });
      }
    }
  });
};
const openDistrictSeasonModal = () => navigateScreen('middle');
const closeMiddleScreen = () => navigateScreen('main');

// Управление разворачиванием уровней таблицы (типы транспорта и заказы)
function toggleRowExpansion(rowKey) {
  if (state.expandedDateKeys.has(rowKey)) {
    state.expandedDateKeys.delete(rowKey);
    const subPrefix = `${rowKey}__sub__`;
    Array.from(state.expandedOrderKeys).forEach(k => {
      if (k === rowKey || k.startsWith(subPrefix)) {
        state.expandedOrderKeys.delete(k);
      }
    });
  } else {
    state.expandedDateKeys.add(rowKey);
  }
  renderDetailedTable(getCurrentDataset());
}

function toggleOrderExpansion(expandKey) {
  if (state.expandedOrderKeys.has(expandKey)) {
    state.expandedOrderKeys.delete(expandKey);
  } else {
    state.expandedOrderKeys.add(expandKey);
  }
  renderDetailedTable(getCurrentDataset());
}

// Скрытие/показ значений строки «ИТОГО / СР.» в футере таблицы доходов
function toggleFootTotals() {
  state.footTotalsCollapsed = !state.footTotalsCollapsed;
  renderDetailedTable(getCurrentDataset());
}

function expandAllDateSubRows() {
  const data = getCurrentDataset();
  data.forEach(r => {
    const rowKey = getRowExpansionKey(r);
    if (Array.isArray(r.subRows) && r.subRows.length > 1) {
      state.expandedDateKeys.add(rowKey);
      r.subRows.forEach((sr, sIdx) => {
        if (hasExpandableOrders(sr.orders)) {
          state.expandedOrderKeys.add(getSubRowOrderKey(rowKey, sr, sIdx));
        }
      });
    } else if (hasExpandableOrders(r.orders)) {
      state.expandedOrderKeys.add(rowKey);
    }
  });
  renderDetailedTable(data);
}

function collapseAllDateSubRows() {
  state.expandedOrderKeys.clear();
  state.expandedDateKeys.clear();
  renderDetailedTable(getCurrentDataset());
}

window.toggleRowExpansion = toggleRowExpansion;
window.toggleOrderExpansion = toggleOrderExpansion;
window.toggleFootTotals = toggleFootTotals;
window.expandAllDateSubRows = expandAllDateSubRows;
window.collapseAllDateSubRows = collapseAllDateSubRows;

// Темы оформления (Темная / Светлая)
const THEME_STORAGE_KEY = 'courier-ui-theme';
function readSavedTheme() {
  try { return localStorage.getItem(THEME_STORAGE_KEY); } catch (_) { return null; }   // приватный режим / запрет storage
}
function applyColorMode(isLight, persist) {
  state.lightMode = isLight;
  document.body.classList.toggle('light-mode', isLight);
  document.documentElement.classList.toggle('dark', !isLight);       // активирует tailwind-вариант dark:
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', isLight ? '#F4F5F7' : '#141518');
  const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (colorSchemeMeta) colorSchemeMeta.setAttribute('content', isLight ? 'light' : 'dark');
  if (persist) { try { localStorage.setItem(THEME_STORAGE_KEY, isLight ? 'light' : 'dark'); } catch (_) {} saveAppSettings(); }
}
function initColorMode() {
  const saved = readSavedTheme();
  const prefersDark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  applyColorMode(saved ? saved === 'light' : !prefersDark, false);
}

function toggleColorTheme() {
  applyColorMode(!state.lightMode, true);
  const svgThemeIcon = state.lightMode
    ? '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
    : '<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  document.querySelectorAll('#lblThemeIcon, #lblThemeIconMobile').forEach(wrap => {
    wrap.innerHTML = svgThemeIcon;
  });
  if (dom.btnColorTheme) {
    dom.btnColorTheme.title = state.lightMode ? 'Включить темный режим' : 'Включить светлый режим';
  }
  renderBlock1();
  redrawSchematicMapLayer();
}


// Сворачивание / разворачивание мобильной сервисной плашки стенда (v13.19.0)
function toggleBannerCollapse() {
  const body = $('bannerCollapsibleBody');
  const chevron = $('bannerCollapseChevron');
  const btn = $('btnBannerCollapseMobile');
  if (!body) return;
  const isHidden = body.classList.toggle('hidden');
  if (chevron) {
    chevron.classList.toggle('rotate-180', isHidden);
  }
  if (btn) {
    btn.setAttribute('aria-expanded', !isHidden);
    btn.setAttribute('title', isHidden ? 'Развернуть сервисную плашку' : 'Свернуть сервисную плашку');
  }
}
window.toggleBannerCollapse = toggleBannerCollapse;

/**
 * Переключение видимости Блоков 2 и 3 (Матрица спроса и Сравнение показателей)
 * Кнопка-спойлер: «Еще» (синяя) <-> «Свернуть» (серая)
 * По умолчанию: свернуто
 */
function toggleBlocks2and3() {
  setBlocks2and3Expanded(!state.blocks2and3Expanded);
}

function setBlocks2and3Expanded(expanded) {
  state.blocks2and3Expanded = !!expanded;
  saveAppSettings();
  const area2 = dom.areaBlock2;
  const area3 = dom.areaBlock3;
  const btn = dom.btnToggleBlocks2and3;
  const lbl = dom.lblSpoilerText;
  const chevron = dom.spoilerChevronIcon;

  if (area2) area2.classList.toggle('hidden', !state.blocks2and3Expanded);
  if (area3) area3.classList.toggle('hidden', !state.blocks2and3Expanded);
  if (dom.screenMain) dom.screenMain.classList.toggle('screen-blocks-collapsed', !state.blocks2and3Expanded);

  if (btn) {
    btn.setAttribute('aria-expanded', state.blocks2and3Expanded ? 'true' : 'false');
    btn.title = state.blocks2and3Expanded
      ? 'Скрыть таблицу спроса и таблицу сравнения'
      : 'Показать таблицу спроса и таблицу сравнения';
  }
  if (lbl) {
    lbl.textContent = state.blocks2and3Expanded ? 'Свернуть' : 'Еще';
  }
  if (chevron) {
    chevron.classList.toggle('rotate-180', state.blocks2and3Expanded);
  }
}

window.toggleBlocks2and3 = toggleBlocks2and3;
window.setBlocks2and3Expanded = setBlocks2and3Expanded;

// =============================================================================
// ЭКСПОРТ СКАЧИВАЕМОЙ КАРТОЧКИ ДОХОДА (v13.19.0)
// Автоматический выбор: Вариант 08 (Apple Pastel) при светлой теме,
//                     Вариант 10 (Glass Aurora) при темной теме.
// Расчет на активных данных (пользовательских или демо).
// =============================================================================

function formatWeekDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "";
  const months = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const d1 = startDate.getDate();
  const m1 = months[startDate.getMonth()];
  const d2 = endDate.getDate();
  const m2 = months[endDate.getMonth()];
  return `${d1} ${m1} – ${d2} ${m2}`;
}

/**
 * Расчет реальной дистанции за один рабочий день (в км).
 * Если данные о дистанции отсутствуют, возвращает null (никаких условных подстановок).
 */
function getDayDistanceKm(day) {
  if (!day) return null;
  if (day.totalDistance != null && Number.isFinite(Number(day.totalDistance))) {
    return Math.round(Number(day.totalDistance) * 10) / 10;
  }
  if (Array.isArray(day.orders) && day.orders.some(o => o.distance != null && Number.isFinite(Number(o.distance)))) {
    const sumOrders = day.orders.reduce((sum, o) => sum + (o.distance != null ? (Number(o.distance) || 0) : 0), 0);
    return Math.round(sumOrders * 10) / 10;
  }
  if (Array.isArray(day.subRows) && day.subRows.length > 0) {
    let hasAny = false;
    const sumSub = day.subRows.reduce((acc, sr) => {
      const subKm = getDayDistanceKm(sr);
      if (subKm != null) {
        hasAny = true;
        return acc + subKm;
      }
      return acc;
    }, 0);
    if (hasAny) return Math.round(sumSub * 10) / 10;
  }
  return null;
}

function mapDaysToWeekArray(list, dowNames) {
  const dowMap = {
    'пн': 0, 'понедельник': 0, 'mon': 0,
    'вт': 1, 'вторник': 1, 'tue': 1,
    'ср': 2, 'среда': 2, 'wed': 2,
    'чт': 3, 'четверг': 3, 'thu': 3,
    'пт': 4, 'пятница': 4, 'fri': 4,
    'сб': 5, 'суббота': 5, 'sat': 5,
    'вс': 6, 'воскресенье': 6, 'sun': 6
  };
  const res = dowNames.map(name => ({ dayName: name, gross: 0, orders: 0, hours: 0, distance: null }));
  (list || []).forEach(d => {
    let idx = null;
    const rawDow = (d.dayOfWeek || '').toLowerCase().trim();
    if (dowMap[rawDow] != null) {
      idx = dowMap[rawDow];
    } else if (d.dateObj instanceof Date && !isNaN(d.dateObj.getTime())) {
      const jsDay = d.dateObj.getDay();
      idx = jsDay === 0 ? 6 : jsDay - 1;
    }
    if (idx != null && idx >= 0 && idx < 7) {
      res[idx].gross += Number(d.grossTotal != null ? d.grossTotal : (d.ordersCost + d.surgeRub + d.ratingRub + d.bonuses + (state.includeGoals ? d.goals : 0) + d.tips));
      res[idx].orders += Number(d.ordersCount || 0);
      res[idx].hours += Number(d.slotHours || 0);
      const dayDist = getDayDistanceKm(d);
      if (dayDist != null && Number.isFinite(dayDist)) {
        res[idx].distance = (res[idx].distance ?? 0) + dayDist;
      }
    }
  });
  res.forEach(r => {
    r.hours = Math.round(r.hours * 10) / 10;
    if (r.distance != null) {
      r.distance = Math.round(r.distance * 10) / 10;
    }
  });
  return res;
}

function getTargetWeekForIncomeCard() {
  const currentData = getCurrentDataset();
  const safeIdx = (state.selectedBarIndex != null && state.selectedBarIndex >= 0 && state.selectedBarIndex < currentData.length)
    ? state.selectedBarIndex
    : Math.max(0, currentData.length - 1);
  const selectedItem = currentData[safeIdx] || currentData[currentData.length - 1];

  const dowNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const sourceDays = getActiveDatasets()?.days || [];
  const enrichedDays = enrichDailyDataset(sourceDays);

  let weekDateLabel = 'Неделя —';
  let transportName = selectedItem?.transport || 'Электровело';
  let weekDaysList = [];

  if (enrichedDays.length > 0 && selectedItem) {
    if (state.period === 'days') {
      const dObj = selectedItem.dateObj || getDayDateObj(selectedItem);
      const cycle = getWeekCycleInfo(dObj, state.weekStartDay);
      if (cycle) {
        weekDateLabel = `Неделя ${formatWeekDateRange(cycle.cycleStart, cycle.cycleEnd)}`;
        const sTime = cycle.cycleStart.getTime() - 43200000;
        const eTime = cycle.cycleEnd.getTime() + 43200000;
        weekDaysList = enrichedDays.filter(d => {
          const t = (d.dateObj || getDayDateObj(d))?.getTime();
          return t && t >= sTime && t <= eTime;
        });
      }
    } else if (state.period === 'weeks') {
      let cycle = null;
      if (selectedItem.days?.length) {
        cycle = getWeekCycleInfo(selectedItem.days[0].dateObj || getDayDateObj(selectedItem.days[0]), state.weekStartDay);
      }
      weekDateLabel = cycle
        ? `Неделя ${formatWeekDateRange(cycle.cycleStart, cycle.cycleEnd)}`
        : `Неделя ${selectedItem.date || ''}`.trim();
      weekDaysList = selectedItem.days || [];
      if (!weekDaysList.length && selectedItem.weekCycleKey) {
        weekDaysList = enrichedDays.filter(d => d.weekCycleKey === selectedItem.weekCycleKey);
      }
    } else if (state.period === 'months') {
      const monthDays = selectedItem.days || enrichedDays.filter(d =>
        selectedItem.monthCycleKey ? d.monthCycleKey === selectedItem.monthCycleKey : d.monthKey === selectedItem.date
      );
      const cycleMap = new Map();
      monthDays.forEach(d => {
        const c = getWeekCycleInfo(d.dateObj || getDayDateObj(d), state.weekStartDay);
        if (c) {
          if (!cycleMap.has(c.cycleKey)) cycleMap.set(c.cycleKey, { cycle: c, days: [] });
          cycleMap.get(c.cycleKey).days.push(d);
        }
      });
      const weekEntries = Array.from(cycleMap.values());
      let chosen = null;
      for (let i = weekEntries.length - 1; i >= 0; i--) {
        if (weekEntries[i].days.some(d => Number(d.slotHours || 0) > 0 || Number(d.ordersCount || 0) > 0)) {
          chosen = weekEntries[i];
          break;
        }
      }
      if (!chosen && weekEntries.length) chosen = weekEntries[weekEntries.length - 1];
      if (chosen) {
        weekDateLabel = `Неделя ${formatWeekDateRange(chosen.cycle.cycleStart, chosen.cycle.cycleEnd)}`;
        weekDaysList = chosen.days;
      }
    }

    if (!weekDaysList.length) {
      weekDaysList = enrichedDays.slice(-7);
    }
  }

  const targetDays = mapDaysToWeekArray(weekDaysList, dowNames);
  let totalGross = targetDays.reduce((a, d) => a + d.gross, 0);
  let totalHours = targetDays.reduce((a, d) => a + d.hours, 0);
  let totalOrders = targetDays.reduce((a, d) => a + d.orders, 0);

  const distValues = weekDaysList
    .map(d => getDayDistanceKm(d))
    .filter(v => v != null && Number.isFinite(v));
  const distanceKm = distValues.length > 0
    ? `${Math.round(distValues.reduce((acc, v) => acc + v, 0))} км`
    : null;

  const distinctTransports = Array.from(new Set(weekDaysList.flatMap(d => d.distinctTransports || [d.transport]).filter(Boolean)));
  transportName = distinctTransports.length ? distinctTransports.join(' + ') : (selectedItem?.transport || 'Электровело');

  totalHours = Math.round(totalHours * 10) / 10;
  totalGross = Math.round(totalGross);
  totalOrders = Math.round(totalOrders);

  const hourlyGross = totalHours > 0 ? Math.round(totalGross / totalHours) : 0;
  const ordersPerHr = totalHours > 0 ? (totalOrders / totalHours).toFixed(1) : '0.0';
  const avgCheck = totalOrders > 0 ? `${Math.round(totalGross / totalOrders)} ₽` : '0 ₽';

  let maxGross = 0;
  let topDay = null;
  targetDays.forEach(d => {
    if (d.gross > maxGross) {
      maxGross = d.gross;
      topDay = d;
    }
  });

  return {
    weekDateLabel,
    transportName,
    totalGross,
    hourlyGross,
    totalHours,
    totalOrders,
    distanceKm,
    ordersPerHr,
    avgCheck,
    maxGross,
    topDay,
    days: targetDays
  };
}

function renderIncomeCardHtml(data, isLight) {
  if (!data) return '';
  const {
    weekDateLabel,
    transportName,
    totalGross,
    hourlyGross,
    totalHours,
    totalOrders,
    distanceKm,
    ordersPerHr,
    avgCheck,
    maxGross,
    topDay,
    days
  } = data;

  const maxG = Math.max(1, maxGross || 1);
  const formattedGrossTotal = formatNum(totalGross) + ' ₽';
  const formattedGrossHourly = formatNum(hourlyGross) + ' ₽/ч';
  const cleanHours = Math.round((Number(totalHours) || 0) * 10) / 10;
  const topDayText = (topDay && maxGross > 0)
    ? `Топ: ${topDay.dayName} (+${formatNum(maxGross)} ₽)`
    : 'Нет смен';

  // Функция построения идеально выровненного SVG-графика для карточки (исключает наложение шрифтов html2canvas)
  function renderCardChartSvg(isLightTheme) {
    const w = 302;
    const barW = 34;
    const gap = (w - 7 * barW) / 6;
    const baselineY = 88;

    const titleColor = isLightTheme ? '#94a3b8' : 'rgba(255,255,255,0.4)';
    const badgeText = (topDay && maxGross > 0) ? `Топ: ${topDay.dayName} (+${formatNum(maxGross)} ₽)` : 'Нет смен';
    const badgeW = Math.round(22 + badgeText.length * 5.1);
    const badgeX = w - badgeW;
    const badgeBg = isLightTheme ? '#fef3c7' : 'rgba(255,255,255,0.1)';
    const badgeTextColor = isLightTheme ? '#92400e' : 'rgba(255,255,255,0.9)';
    const badgeBorder = isLightTheme ? '' : 'stroke="rgba(255,255,255,0.1)" stroke-width="1"';

    const headerSvg = `
      <text x="0" y="11" fill="${titleColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="normal">Динамика по дням</text>
      <rect x="${badgeX}" y="0" width="${badgeW}" height="15" rx="4" fill="${badgeBg}" ${badgeBorder} />
      <g transform="translate(${badgeX + 4}, 2.5)">
        <path d="M5 0.5C3.5 2.2 2.5 3.3 2.5 5.5c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5c0-1.1-.6-2.2-1.5-3.3L5 0.5z" fill="#f59e0b"/>
        <path d="M5 4c-.6.8-1 1.3-1 2 0 .6.4 1 1 1s1-.4 1-1c0-.4-.3-.8-.6-1.3L5 4z" fill="#ef4444"/>
      </g>
      <text x="${badgeX + 16}" y="11" fill="${badgeTextColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="500">${badgeText}</text>
    `;

    const barsSvg = days.map((day, i) => {
      const x = i * (barW + gap);
      const isTop = topDay && day.dayName === topDay.dayName && day.gross > 0;
      const barH = day.gross > 0 ? Math.max(6, Math.round((day.gross / maxG) * 58)) : 4;
      const barY = baselineY - barH;
      const valLabel = day.gross > 0 ? (day.gross >= 1000 ? (day.gross / 1000).toFixed(1) + 'k' : day.gross) : '—';

      let barFill = '';
      let textFill = '';

      if (isLightTheme) {
        barFill = isTop ? '#fbbf24' : (day.gross > 0 ? '#38bdf8' : '#e2e8f0');
        textFill = isTop ? '#d97706' : '#64748b';
      } else {
        barFill = isTop ? '#fbbf24' : (day.gross > 0 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.1)');
        textFill = isTop ? '#fbbf24' : 'rgba(255,255,255,0.6)';
      }

      if (isLightTheme) {
        const rx = Math.min(barW / 2, barH / 2);
        return `
          <text x="${(x + barW / 2).toFixed(1)}" y="${(barY - 4).toFixed(1)}" fill="${textFill}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="normal" text-anchor="middle">${valLabel}</text>
          <rect class="chart-bar" x="${x.toFixed(1)}" y="${barY.toFixed(1)}" width="${barW}" height="${barH}" rx="${rx.toFixed(1)}" ry="${rx.toFixed(1)}" fill="${barFill}" />
          <text x="${(x + barW / 2).toFixed(1)}" y="${baselineY + 11}" fill="${textFill}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="normal" text-anchor="middle">${day.dayName}</text>
        `;
      } else {
        // Темная тема: прямоугольные столбики со скругленным верхом (rounded-t, r=4) и плоским основанием
        const r = Math.min(4, Math.floor(barH / 2));
        const pathD = `M ${x.toFixed(1)} ${(barY + barH).toFixed(1)} L ${x.toFixed(1)} ${(barY + r).toFixed(1)} A ${r} ${r} 0 0 1 ${(x + r).toFixed(1)} ${barY.toFixed(1)} L ${(x + barW - r).toFixed(1)} ${barY.toFixed(1)} A ${r} ${r} 0 0 1 ${(x + barW).toFixed(1)} ${(barY + r).toFixed(1)} L ${(x + barW).toFixed(1)} ${(barY + barH).toFixed(1)} Z`;
        return `
          <text x="${(x + barW / 2).toFixed(1)}" y="${(barY - 4).toFixed(1)}" fill="${textFill}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8" font-weight="normal" text-anchor="middle">${valLabel}</text>
          <path class="chart-bar" d="${pathD}" fill="${barFill}" />
          <text x="${(x + barW / 2).toFixed(1)}" y="${baselineY + 11}" fill="${textFill}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="normal" text-anchor="middle">${day.dayName}</text>
        `;
      }
    }).join('');

    return headerSvg + barsSvg;
  }

  function renderCardMetricsSvg(isLightTheme) {
    const labelColor = isLightTheme ? '#94a3b8' : 'rgba(255, 255, 255, 0.4)';
    const valColor = isLightTheme ? '#1e293b' : '#ffffff';
    const accentValColor = isLightTheme ? '#0284c7' : '#34d399';
    const boxFill = isLightTheme ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
    const boxStroke = isLightTheme ? 'rgba(226, 232, 240, 0.8)' : 'rgba(255, 255, 255, 0.1)';

    const items = [
      { label: 'ЗАКАЗЫ', value: String(totalOrders), fill: valColor },
      { label: 'ЧАСЫ', value: `${cleanHours} ч`, fill: valColor }
    ];
    if (distanceKm != null) {
      items.push({ label: 'РАССТОЯНИЕ', value: String(distanceKm), fill: valColor });
    }
    items.push(
      { label: 'ЗАК/ЧАС', value: String(ordersPerHr), fill: accentValColor },
      { label: 'СР. ЧЕК', value: String(avgCheck), fill: valColor }
    );

    const colW = 318 / items.length;
    const colsSvg = items.map((item, i) => {
      const cx = ((i + 0.5) * colW).toFixed(1);
      return `
        <text x="${cx}" y="15" fill="${labelColor}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="7" font-weight="bold" letter-spacing="0.7px" text-anchor="middle">${item.label}</text>
        <text x="${cx}" y="31" fill="${item.fill}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${escapeHtml(item.value)}</text>
      `;
    }).join('');

    return `
      <svg width="100%" height="42" viewBox="0 0 318 42" class="block overflow-visible">
        <rect width="318" height="42" rx="12" fill="${boxFill}" stroke="${boxStroke}" stroke-width="1" />
        ${colsSvg}
      </svg>
    `;
  }

  if (isLight) {
    // -------------------------------------------------------------------------
    // СВЕТЛЫЙ СТИЛЬ: ВАРИАНТ #08 (Apple Pastel)
    // -------------------------------------------------------------------------
    const dayBarsSvg = renderCardChartSvg(true);

    return `
      <div class="rounded-2xl shadow-xl">
        <div id="exportCardNode" class="rounded-2xl bg-gradient-to-br from-white via-[#F8FAFC] to-[#EFF6FF] text-[#1E293B] border border-slate-200 select-none mx-auto box-border" style="width: 350px; min-width: 350px; max-width: 350px; padding: 16px 16px 14px 16px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <!-- 1. Шапка: КА, заголовок, даты и транспорт (единый SVG 318x20) -->
        <div class="block w-full">
          <svg width="100%" height="20" viewBox="0 0 318 20" class="block overflow-visible">
            <circle cx="10" cy="10" r="10" fill="#0ea5e9" />
            <text x="10" y="13.5" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="bold" text-anchor="middle">КА</text>
            <text id="exportCardHeaderTitle" x="26" y="14.5" fill="#1e293b" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" letter-spacing="-0.3px">Карточка дохода</text>
            
            <text id="exportCardHeaderDate" x="318" y="7.5" fill="#475569" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="normal" text-anchor="end">${weekDateLabel}</text>
            <text id="exportCardHeaderTransport" x="318" y="18.5" fill="#475569" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="normal" text-anchor="end">${escapeHtml(transportName)}</text>
          </svg>
        </div>

        <!-- Разделитель 1: перед начислено (до расходов) -->
        <div class="my-2.5 h-[1px] bg-slate-200 leading-none"></div>

        <!-- 2. Начислено (до расходов) и начислено в час (единый SVG 318x40) -->
        <div class="mt-2.5 block w-full">
          <svg width="100%" height="40" viewBox="0 0 318 40" class="block overflow-visible">
            <!-- Подписи -->
            <text x="0" y="10" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="bold">Начислено (до расходов)</text>
            <text x="318" y="10" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="bold" text-anchor="end">Начислено в час</text>
            
            <!-- Числовые значения -->
            <text id="exportCardGrossTotal" x="0" y="34" fill="#0f172a" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="bold" letter-spacing="-0.5px">${formattedGrossTotal}</text>
            <text id="exportCardGrossHourly" x="318" y="34" fill="#0284c7" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" letter-spacing="-0.3px" text-anchor="end">${formattedGrossHourly}</text>
          </svg>
        </div>

        <!-- 3. График динамики по дням (единый SVG 302x104) -->
        <div class="mt-3 p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/60 shadow-sm block w-full">
          <svg width="100%" height="104" viewBox="0 0 302 104" class="block overflow-visible">
            ${dayBarsSvg}
          </svg>
        </div>

        <!-- 4. Блок показателей: SVG-точность без сдвигов шрифтов -->
        <div id="exportCardMetricsBox" class="mt-3 block w-full">
          ${renderCardMetricsSvg(true)}
        </div>

        <!-- Разделитель 2: после плашки с метриками -->
        <div class="my-2.5 h-[1px] bg-slate-200 leading-none"></div>

        <!-- 5. Футер домен courier-analytics.ru (единый SVG) -->
        <div class="pt-1.5 pb-0.5 block w-full">
          <svg width="100%" height="12" viewBox="0 0 318 12" class="block overflow-visible">
            <text x="159" y="9.5" fill="#94a3b8" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="normal" text-anchor="middle">courier-analytics.ru</text>
          </svg>
        </div>
      </div>
    </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // ТЕМНЫЙ СТИЛЬ: ВАРИАНТ #10 (Glass Aurora)
  // ---------------------------------------------------------------------------
  const dayBarsSvg = renderCardChartSvg(false);

  return `
    <div class="rounded-2xl shadow-2xl">
      <div id="exportCardNode" class="rounded-2xl text-white border border-white/10 select-none mx-auto box-border" style="width: 350px; min-width: 350px; max-width: 350px; padding: 16px 16px 14px 16px; background: radial-gradient(circle at 10% 10%, rgba(236,72,153,0.18) 0%, transparent 55%), radial-gradient(circle at 90% 85%, rgba(99,102,241,0.18) 0%, transparent 55%), #0e1015; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <!-- 1. Шапка: КА, заголовок, даты и транспорт (единый SVG 318x20) -->
      <div class="block w-full">
        <svg width="100%" height="20" viewBox="0 0 318 20" class="block overflow-visible">
          <defs>
            <linearGradient id="logoGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#ec4899" />
              <stop offset="100%" stop-color="#6366f1" />
            </linearGradient>
          </defs>
          <circle cx="10" cy="10" r="10" fill="url(#logoGradDark)" />
          <text x="10" y="13.5" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="bold" text-anchor="middle">КА</text>
          <text id="exportCardHeaderTitle" x="26" y="14.5" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="bold" letter-spacing="-0.3px">Карточка дохода</text>
          
          <text id="exportCardHeaderDate" x="318" y="7.5" fill="rgba(255,255,255,0.7)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="normal" text-anchor="end">${weekDateLabel}</text>
          <text id="exportCardHeaderTransport" x="318" y="18.5" fill="rgba(255,255,255,0.7)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="normal" text-anchor="end">${escapeHtml(transportName)}</text>
        </svg>
      </div>

      <!-- Разделитель 1: перед начислено (до расходов) -->
      <div class="my-2.5 h-[1px] bg-white/10 leading-none"></div>

      <!-- 2. Начислено (до расходов) и начислено в час (единый SVG 318x40) -->
      <div class="mt-2.5 block w-full">
        <svg width="100%" height="40" viewBox="0 0 318 40" class="block overflow-visible">
          <defs>
            <linearGradient id="auroraTotalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#FCCF5A" />
              <stop offset="30%" stop-color="#FBA8A4" />
              <stop offset="65%" stop-color="#E8A2E8" />
              <stop offset="100%" stop-color="#B8AEF8" />
            </linearGradient>
          </defs>
          <!-- Подписи -->
          <text x="0" y="10" fill="rgba(255,255,255,0.4)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="bold">Начислено (до расходов)</text>
          <text x="318" y="10" fill="rgba(255,255,255,0.4)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="9.5" font-weight="bold" text-anchor="end">Начислено в час</text>
          
          <!-- Числовые значения -->
          <text id="exportCardGrossTotal" x="0" y="34" fill="url(#auroraTotalGrad)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="bold" letter-spacing="-0.5px">${formattedGrossTotal}</text>
          <text id="exportCardGrossHourly" x="318" y="34" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="16" font-weight="bold" letter-spacing="-0.3px" text-anchor="end">${formattedGrossHourly}</text>
        </svg>
      </div>

      <!-- 3. График динамики по дням (единый SVG 302x104) -->
      <div class="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 shadow-sm block w-full">
        <svg width="100%" height="104" viewBox="0 0 302 104" class="block overflow-visible">
          ${dayBarsSvg}
        </svg>
      </div>

      <!-- 4. Блок показателей: SVG-точность без сдвигов шрифтов -->
      <div id="exportCardMetricsBox" class="mt-3 block w-full">
        ${renderCardMetricsSvg(false)}
      </div>

      <!-- Разделитель 2: после плашки с метриками -->
      <div class="my-2.5 h-[1px] bg-white/10 leading-none"></div>

      <!-- 5. Футер домен courier-analytics.ru (единый SVG) -->
      <div class="pt-1.5 pb-0.5 block w-full">
        <svg width="100%" height="12" viewBox="0 0 318 12" class="block overflow-visible">
          <text x="159" y="9.5" fill="rgba(255,255,255,0.4)" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="8.5" font-weight="normal" text-anchor="middle">courier-analytics.ru</text>
        </svg>
      </div>
    </div>
  </div>`;
}

let currentCardExportData = null;

function openExportCardModal() {
  const modal = document.getElementById('exportCardModal');
  if (!modal) return;
  currentCardExportData = getTargetWeekForIncomeCard();
  const isLight = !!state.lightMode;
  const container = document.getElementById('exportCardRenderContainer');
  if (container) {
    container.innerHTML = renderIncomeCardHtml(currentCardExportData, isLight);
  }
  showModalDialog(modal);
}

function closeExportCardModal() {
  const modal = document.getElementById('exportCardModal');
  if (modal) {
    closeModalDialog(modal);
  }
}

function downloadExportCardPNG() {
  const target = document.getElementById('exportCardNode');
  if (!target) return;
  const btn = document.getElementById('btnDownloadCardPNG');
  if (btn) btn.disabled = true;
  showToast('Генерация PNG-изображения...');

  if (window.html2canvas) {
    window.html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
      logging: false
    }).then(canvas => {
      const link = document.createElement('a');
      const safeDate = (currentCardExportData?.weekDateLabel || 'неделя').replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]+/g, '_');
      link.download = `income-card-${safeDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      if (btn) btn.disabled = false;
      showToast('📸 Карточка дохода успешно скачана!');
    }).catch(err => {
      console.error('html2canvas error:', err);
      if (btn) btn.disabled = false;
      showToast('Ошибка при экспорте изображения');
    });
  } else {
    if (btn) btn.disabled = false;
    showToast('Библиотека html2canvas недоступна');
  }
}

function copyExportCardTelegramText() {
  if (!currentCardExportData) return;
  const d = currentCardExportData;
  const topText = d.maxGross > 0 && d.topDay ? `🔥 Топ-день: ${d.topDay.dayName} (+${formatNum(d.topDay.gross)} ₽)
` : '';
  const distLine = d.distanceKm != null ? `📍 Расстояние: ${d.distanceKm}
` : '';
  const text = `Карточка дохода (${d.weekDateLabel})
Транспорт: ${d.transportName}
💰 Начислено (до расходов): ${formatNum(d.totalGross)} ₽
⏱ Начислено в час: ${formatNum(d.hourlyGross)} ₽/ч (${d.totalHours} ч)
📦 Заказов: ${d.totalOrders} (${d.ordersPerHr} зак/ч, ср. чек ${d.avgCheck})
${distLine}${topText}📊 Рассчитано в «Курьерской аналитике» • courier-analytics.ru`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Текст скопирован!');
  }).catch(() => {
    showToast('Скопировано в буфер!');
  });
}

function openExportModal() {
  openExportCardModal();
}

window.openExportCardModal = openExportCardModal;
window.closeExportCardModal = closeExportCardModal;
window.downloadExportCardPNG = downloadExportCardPNG;
window.copyExportCardTelegramText = copyExportCardTelegramText;
window.openExportModal = openExportModal;


// Всплывающие уведомления (Toast)
let toastTimer = null;
function showToast(msg) {
  const box = dom.toastBox;
  dom.toastText.textContent = msg;
  box.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.classList.add('hidden'), 3000);
}

// -----------------------------------------------------------------------------
// 9. ГЛОБАЛЬНЫЕ КЛАВИАТУРНЫЕ СОБЫТИЯ И ДОСТУПНОСТЬ
// -----------------------------------------------------------------------------

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    // 0. Закрытие выпадающего меню импорта
    const importMenu = $('dropdownImportMenu');
    if (importMenu && !importMenu.classList.contains('hidden')) {
      importMenu.classList.add('hidden');
      return;
    }

    // 0.1. Закрытие интерактивной справки по столбцам ручного ввода (приоритет над редактором)
    const colHelpModal = document.getElementById('manualColumnHelpModal');
    if (colHelpModal && !colHelpModal.classList.contains('hidden')) {
      closeColumnHelpModal();
      return;
    }

    const exportModal = document.getElementById('exportCardModal');
    if (exportModal && !exportModal.classList.contains('hidden')) {
      closeExportCardModal();
      return;
    }
    const tipModal = document.getElementById('authorTipModal');
    if (tipModal && !tipModal.classList.contains('hidden')) {
      closeAuthorTipModal();
    } else if (document.getElementById('confirmActionModal') && !document.getElementById('confirmActionModal').classList.contains('hidden')) {
      closeConfirmActionModal();
    } else if (document.getElementById('resetConfirmModal') && !document.getElementById('resetConfirmModal').classList.contains('hidden')) {
      closeResetConfirmModal();
    } else if (document.getElementById('syncConflictModal') && !document.getElementById('syncConflictModal').classList.contains('hidden')) {
      closeConflictModal();
    } else if (document.getElementById('syncModal') && !document.getElementById('syncModal').classList.contains('hidden')) {
      closeSyncModal();
    } else if (!dom.expenseInfoModal.classList.contains('hidden')) {
      closeExpenseInfoModal();
    } else if (!dom.realMapModal.classList.contains('hidden')) {
      cancelRealMapModal();
    } else if (!dom.planSlotsModal.classList.contains('hidden')) {
      closePlanSlotsModal();
    } else if (!dom.forecastInfoModal.classList.contains('hidden')) {
      closeForecastInfoModal();
    } else if (!$('importDataModal').classList.contains('hidden')) {
      closeImportModal();
    } else if ($('manualEditorModal') && !$('manualEditorModal').classList.contains('hidden')) {
      closeManualEditorModal();
    } else if (!$('legalDocModal').classList.contains('hidden')) {
      closeLegalModal();
    } else if (state.currentScreen !== 'main') {
      navigateScreen('main');
    }
  }
});

// -----------------------------------------------------------------------------

// =============================================================================
// ИНТЕРАКТИВНАЯ ЧАЙНАЯ СТАНЦИЯ И МОДАЛЬНОЕ ОКНО "НА ЧАЙ АВТОРУ" (v13.16.2)
// =============================================================================

const AuthorTipTeaStation = (function() {
  let initialized = false;
  let running = false;
  let animId = null;

  const TIERS = [
    { n: 6, d: 2000, s: 10.5, t: 'Пакетик-другой', c: '#3A8DFF' },
    { n: 14, d: 2800, s: 7.8, t: 'На целый чайник', c: '#FFD60A' },
    { n: 40, d: 4200, s: 5.6, t: 'Чайная церемония', c: '#FF3FA0' }
  ];
  const TCOL = { 6: '#3A8DFF', 14: '#FFD60A', 40: '#FF3FA0' };
  const G = 2000, SUB = 6, MU = 0.6, CR = 13, II = 1 / 508, NW = 30, A0 = 13800;
  const LC = [[-12, -17], [12, -17], [-12, 0], [12, 0], [-12, 17], [12, 17]];
  const R = Math.random;

  let cv, x;
  let W = 400, H = 450, FL = 424, cx = 182, rimY = 214, dpr = 1;
  let floor = '#CBD1DE', edge = 'rgba(60,80,115,.45)';
  let SEG = [], B = [], dust = [], drops = [], pud = [], steam = [], drag = null;
  let ptr = { x: 0, y: 0 }, count = 0, lv = 0, Aw = A0, tea = 0;
  let hs = new Float32Array(NW), vs = new Float32Array(NW);

  const hw = y => 58 + 18 * ((FL - 14 - y) / 196) - 3;
  const surfY = xw => {
    const h0 = hw(lv);
    return lv - hs[Math.max(0, Math.min(NW - 1, Math.round((xw - cx + h0) / (2 * h0) * (NW - 1))))];
  };

  function resize() {
    if (!cv || !cv.parentNode) return;
    const r = cv.parentNode.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = r.width;
    H = r.height || 450;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.height = H + 'px';
    x.setTransform(dpr, 0, 0, dpr, 0, 0);

    FL = H - 26;
    cx = W / 2 - 18;
    rimY = FL - 210;

    const isDark = !document.body.classList.contains('light-mode');
    floor = isDark ? '#2D3748' : '#CBD1DE';
    edge = isDark ? 'rgba(148,163,184,.3)' : 'rgba(60,80,115,.45)';

    const y0 = FL - 98, y1 = FL - 12;
    const P0 = [cx + hw(y0 + 6) + 6, y0 + 6], C1 = [cx + 122, y0 - 4], C2 = [cx + 124, y1 - 4], P3 = [cx + hw(y1 - 10) + 6, y1 - 10];
    const bz = t => {
      const a = (1 - t) ** 3, b = 3 * t * (1 - t) ** 2, c = 3 * t * t * (1 - t), d = t ** 3;
      return [a * P0[0] + b * C1[0] + c * C2[0] + d * P3[0], a * P0[1] + b * C1[1] + c * C2[1] + d * P3[1]];
    };
    const hp = [0, .25, .5, .75, 1].map(bz);
    SEG = [
      [cx - 76, rimY, cx - 58, FL - 14],
      [cx + 76, rimY, cx + 58, FL - 14],
      [cx - 58, FL - 14, cx + 58, FL - 14],
      [cx - 72, FL - 8, cx - 72, FL],
      [cx + 72, FL - 8, cx + 72, FL]
    ];
    for (let i = 0; i < 4; i++) SEG.push([...hp[i], ...hp[i + 1]]);
    if (lv === 0) lv = FL - 14 - Aw / 128;
  }

  // Fast zero-allocation circle position solver with friction
  function con(A, pAx, pAy, C, pCx, pCy, nx, ny, d, la, lc) {
    const tx = -ny, ty = nx, ax = pAx - A.x, ay = pAy - A.y;
    let bx = 0, by = 0;
    let wn = 1 + II * (ax * ny - ay * nx) ** 2, wt = 1 + II * (ax * ty - ay * tx) ** 2;
    const qax = A.px + la[0] * A.pc - la[1] * A.ps;
    const qay = A.py + la[0] * A.ps + la[1] * A.pc;
    let dt = (pAx - qax) * tx + (pAy - qay) * ty;
    if (C) {
      bx = pCx - C.x; by = pCy - C.y;
      wn += 1 + II * (bx * ny - by * nx) ** 2; wt += 1 + II * (bx * ty - by * tx) ** 2;
      const qcx = C.px + lc[0] * C.pc - lc[1] * C.ps;
      const qcy = C.py + lc[0] * C.ps + lc[1] * C.pc;
      dt -= (pCx - qcx) * tx + (pCy - qcy) * ty;
    }
    const lim = MU * d, c = Math.max(-lim, Math.min(lim, dt)), ln = d / wn, lt = -c / wt;
    const Px = nx * ln + tx * lt, Py = ny * ln + ty * lt;
    A.x += Px; A.y += Py; A.a += II * (ax * Py - ay * Px);
    A.cs = Math.cos(A.a); A.sn = Math.sin(A.a);
    if (C) {
      C.x -= Px; C.y -= Py; C.a -= II * (bx * Py - by * Px);
      C.cs = Math.cos(C.a); C.sn = Math.sin(C.a);
    }
  }

  function seg(A, la, px, py, s) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    const lenSq = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((px - s[0]) * dx + (py - s[1]) * dy) / lenSq));
    const ex = px - s[0] - dx * t, ey = py - s[1] - dy * t;
    const d2 = ex * ex + ey * ey, r = CR + 4;
    if (d2 < r * r && d2 > 1e-6) {
      const q = Math.sqrt(d2);
      con(A, px, py, null, 0, 0, ex / q, ey / q, r - q, la, null);
    }
  }

  function step(dt) {
    const h = dt / SUB;
    for (let s = 0; s < SUB; s++) {
      for (const b of B) {
        const dg = b.f * h * 5;
        b.px = b.x; b.py = b.y; b.pa = b.a; b.pc = b.cs; b.ps = b.sn;
        b.vy += G * h * (1 - 1.35 * b.f);
        b.vx *= 1 - dg; b.vy *= 1 - dg; b.w *= 1 - dg * .8;
        b.x += b.vx * h; b.y += b.vy * h; b.a += b.w * h;
        b.cs = Math.cos(b.a); b.sn = Math.sin(b.a);
      }
      if (drag) {
        const b = drag.b;
        const gx = b.x + drag.lx * b.cs - drag.ly * b.sn;
        const gy = b.y + drag.lx * b.sn + drag.ly * b.cs;
        b.x += (ptr.x - gx) * .45;
        b.y += (ptr.y - gy) * .45;
      }
      const bLen = B.length;
      for (let i = 0; i < bLen; i++) {
        const A = B[i];
        const near = Math.abs(A.x - cx) < 150 && A.y > rimY - 70;
        for (let j = i + 1; j < bLen; j++) {
          const C = B[j];
          const dx = A.x - C.x, dy = A.y - C.y;
          if (dx * dx + dy * dy > 6084) continue;
          for (let m = 0; m < 6; m++) {
            const la = LC[m];
            const pAx = A.x + la[0] * A.cs - la[1] * A.sn;
            const pAy = A.y + la[0] * A.sn + la[1] * A.cs;
            for (let n = 0; n < 6; n++) {
              const lc = LC[n];
              const pCx = C.x + lc[0] * C.cs - lc[1] * C.sn;
              const pCy = C.y + lc[0] * C.sn + lc[1] * C.cs;
              const ex = pAx - pCx, ey = pAy - pCy, d2 = ex * ex + ey * ey;
              if (d2 < 4 * CR * CR && d2 > 1e-6) {
                const q = Math.sqrt(d2);
                con(A, pAx, pAy, C, pCx, pCy, ex / q, ey / q, 2 * CR - q, la, lc);
              }
            }
          }
        }
        for (let m = 0; m < 6; m++) {
          const la = LC[m];
          let pAx = A.x + la[0] * A.cs - la[1] * A.sn;
          let pAy = A.y + la[0] * A.sn + la[1] * A.cs;
          if (pAy + CR > FL) {
            if (A.vy > 380 && A.t0 <= 0) {
              A.t0 = .3;
              if (dust.length < 25) {
                for (let k = 0; k < 4; k++) dust.push({ x: pAx, y: FL, vx: (R() - .5) * 170, vy: -R() * 120, l: 1 });
              }
            }
            con(A, pAx, pAy, null, 0, 0, 0, -1, pAy + CR - FL, la, null);
            pAx = A.x + la[0] * A.cs - la[1] * A.sn;
            pAy = A.y + la[0] * A.sn + la[1] * A.cs;
          }
          if (pAx - CR < 0) con(A, pAx, pAy, null, 0, 0, 1, 0, CR - pAx, la, null);
          else if (pAx + CR > W) con(A, pAx, pAy, null, 0, 0, -1, 0, pAx + CR - W, la, null);
          if (near) {
            for (let k = 0; k < SEG.length; k++) seg(A, la, pAx, pAy, SEG[k]);
          }
        }
      }
      for (const b of B) {
        b.vx = (b.x - b.px) / h * .9996;
        b.vy = (b.y - b.py) / h * .9996;
        b.w = (b.a - b.pa) / h * .995;
        const v = Math.hypot(b.vx, b.vy);
        if (v > 2600) { b.vx *= 2600 / v; b.vy *= 2600 / v; }
      }
    }
  }

  function splash(xw, a) {
    const h0 = hw(lv);
    for (let i = 0; i < NW; i++) {
      const d = (cx - h0 + 2 * h0 * i / (NW - 1) - xw) / 16;
      vs[i] -= a * Math.exp(-d * d);
    }
  }

  function puddle(px) {
    let p = pud.find(q => Math.abs(q.x - px) < 24);
    if (p) p.a += 60;
    else {
      pud.push({ x: px, a: 60, w: 6 });
      if (pud.length > 30) pud.shift();
    }
  }

  function water(dt) {
    const f = dt * 60;
    let disp = 0, wet = 0;
    for (const b of B) {
      b.f = 0;
      if (Math.abs(b.x - cx) > 110 || b.y < rimY - 40 || b.y > FL) continue;
      let n = 0;
      for (const l of LC) {
        const px = b.x + l[0] * b.cs - l[1] * b.sn;
        const py = b.y + l[0] * b.sn + l[1] * b.cs;
        if (Math.abs(px - cx) < hw(py) + 4 && py + CR > lv) {
          n += Math.max(0, Math.min(1, (py + CR - lv) / (2 * CR)));
        }
      }
      b.f = n / 6; disp += n * 531; wet += b.f;
      if (b.f > .2) b.wt = Math.min(1, b.wt + dt * .6);
      const sub = b.f > .3;
      if (sub && !b.sub && Math.abs(b.vy) > 150) {
        splash(b.x, Math.min(Math.abs(b.vy) * .012, 14));
        if (drops.length < 25) {
          for (let i = 0; i < 5; i++) drops.push({ x: b.x + (R() - .5) * 30, y: lv - 2, vx: (R() - .5) * 170, vy: -(120 + R() * 260), in: 1 });
        }
      }
      b.sub = sub;
    }
    tea = Math.min(.92, tea + wet * dt * .03);
    let L = FL - 14 - (Aw + disp) / 128;
    if (L < rimY + 4) {
      if ((rimY + 4 - L) * 128 > 40 && R() < .5) {
        const sd = R() < .5 ? -1 : 1;
        Aw -= 60;
        if (drops.length < 25) {
          drops.push({ x: cx + sd * 80, y: rimY - 2, vx: sd * (50 + R() * 90), vy: -40 - R() * 60, in: 0 });
        }
      }
      L = rimY + 4;
    }
    lv += (L - lv) * Math.min(1, dt * 6);
    for (let i = 0; i < NW; i++) vs[i] += (-.035 * hs[i] - .025 * vs[i]) * f;
    for (let i = 0; i < NW; i++) hs[i] = Math.max(-30, Math.min(26, hs[i] + vs[i] * f));
    for (let p = 0; p < 3; p++) {
      const ld = [], rd = [];
      for (let i = 0; i < NW; i++) {
        ld[i] = i ? .25 * (hs[i] - hs[i - 1]) : 0;
        rd[i] = i < NW - 1 ? .25 * (hs[i] - hs[i + 1]) : 0;
      }
      for (let i = 0; i < NW; i++) {
        if (i) { vs[i - 1] += ld[i]; hs[i - 1] += ld[i]; }
        if (i < NW - 1) { vs[i + 1] += rd[i]; hs[i + 1] += rd[i]; }
      }
    }
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.vy += G * dt; d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.in && d.y > rimY) {
        const w = hw(d.y);
        if (Math.abs(d.x - cx) > w) { d.x = cx + Math.sign(d.x - cx) * w; d.vx *= -.35; }
      }
      if (d.y > FL - 3) { puddle(d.x); drops.splice(i, 1); }
      else if (d.in && d.vy > 0 && d.y > rimY && d.y > surfY(d.x)) { splash(d.x, 1.2); drops.splice(i, 1); }
    }
    for (const p of pud) p.w += (Math.min(70, 10 + Math.sqrt(p.a) * 2.6) - p.w) * Math.min(1, dt * 1.5);
    if (tea > .12 && R() < .25 && steam.length < 25) {
      steam.push({ x: cx + (R() - .5) * hw(lv) * 1.5, y: lv - 4, l: 0, s: 10 + R() * 9, ph: R() * 6.3 });
    }
    for (let i = steam.length - 1; i >= 0; i--) {
      const s = steam[i]; s.l += dt * .5; s.y -= 26 * dt; s.x += Math.sin(s.l * 9 + s.ph) * 8 * dt;
      if (s.l > 1) steam.splice(i, 1);
    }
  }

  function spawn(s, y) {
    const a = (R() - .5) * 1.2, px = R() < .5 ? cx + (R() - .5) * 90 : W * .1 + R() * W * .8;
    const yy = y ?? -60, ax = px + 26 * Math.sin(a), ay = yy - 26 * Math.cos(a);
    const rp = d => ({ x: ax, y: ay + d, px: ax, py: ay + d });
    B.push({
      x: px, y: yy, a, vx: (R() - .5) * 60, vy: R() * 100, w: (R() - .5) * 3,
      px: 0, py: 0, pa: a, cs: Math.cos(a), sn: Math.sin(a), pc: 1, ps: 0,
      t: s, t0: 0, f: 0, wt: 0, sub: false, r1: rp(10), r2: rp(24)
    });
    count++; ui();
    if (B.length > 140) B.shift();
  }

  function rope(dt) {
    const g = G * dt * dt;
    for (const b of B) {
      const ax = b.x + 26 * b.sn, ay = b.y - 26 * b.cs, dm = b.f > 0 ? .9 : .972;
      for (const p of [b.r1, b.r2]) {
        const vx = (p.x - p.px) * dm, vy = (p.y - p.py) * dm;
        p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + g * (1 - 1.3 * b.f);
      }
      for (let k = 0; k < 3; k++) {
        let dx = b.r1.x - ax, dy = b.r1.y - ay, d = Math.hypot(dx, dy) || 1, s = (d - 14) / d;
        b.r1.x -= dx * s; b.r1.y -= dy * s;
        dx = b.r2.x - b.r1.x; dy = b.r2.y - b.r1.y; d = Math.hypot(dx, dy) || 1; s = (d - 17) / d * .5;
        b.r1.x += dx * s; b.r1.y += dy * s; b.r2.x -= dx * s; b.r2.y -= dy * s;
      }
      if (b.r1.y > FL - 3) b.r1.y = FL - 3;
      if (b.r2.y > FL - 4) b.r2.y = FL - 4;
    }
  }

  function sim(dt) {
    water(dt); step(dt); rope(dt);
    for (const b of B) b.t0 -= dt;
    for (let i = dust.length - 1; i >= 0; i--) {
      const d = dust[i]; d.vy += 500 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.l -= dt * 2;
      if (d.l <= 0) dust.splice(i, 1);
    }
  }

  function tip(T) {
    const n = T.n, s = n;
    const pl = n % 10 === 1 && n % 100 !== 11 ? 'пакетик' : n % 10 > 1 && n % 10 < 5 && (n % 100 < 12 || n % 100 > 14) ? 'пакетика' : 'пакетиков';
    for (let i = 0; i < n; i++) {
      setTimeout(() => spawn(s), i * T.d / n + R() * 90);
    }
    const t = document.getElementById('teaToast');
    if (t) {
      t.textContent = `+${n} ${pl}. Спасибо! 💛`;
      t.classList.remove('on');
      void t.offsetWidth;
      t.classList.add('on');
    }
  }

  function ui() {
    const totalEl = document.getElementById('teaTotal');
    const nounEl = document.getElementById('teaNoun');
    if (totalEl) {
      totalEl.textContent = count;
      totalEl.classList.remove('bump');
      void totalEl.offsetWidth;
      totalEl.classList.add('bump');
    }
    if (nounEl) {
      const a = count % 10, c = count % 100;
      nounEl.textContent = a === 1 && c !== 11 ? 'пакетик' : a > 1 && a < 5 && (c < 12 || c > 14) ? 'пакетика' : 'пакетиков';
    }
  }

  /* ---------- DRAWING (ORIGINAL PROTOTYPE ACCURACY) ---------- */
  const wc = (k, a) => `rgba(${(170 + 26 * tea) * k | 0},${(215 - 105 * tea) * k | 0},${(235 - 195 * tea) * k | 0},${a})`;

  function bag(b) {
    x.save(); x.translate(b.x, b.y); x.rotate(b.a);
    const g = x.createLinearGradient(-25, -30, 25, 30);
    g.addColorStop(0, '#FCF7EA'); g.addColorStop(1, '#E6D9C0');
    x.fillStyle = g; x.strokeStyle = '#BFAE8F'; x.lineWidth = 1.4;
    x.beginPath(); x.roundRect(-25, -30, 50, 60, 13); x.fill(); x.stroke();
    x.fillStyle = `rgba(150,85,25,${.2 + b.wt * .5})`;
    x.beginPath(); x.roundRect(-24, -29, 48, 58, 12); x.fill();
    x.fillStyle = 'rgba(0,0,0,.05)';
    x.beginPath(); x.roundRect(-25, -30, 50, 15, [13, 13, 0, 0]); x.fill();
    x.strokeStyle = '#BFAE8F'; x.lineWidth = 1.2; x.setLineDash([3, 3]);
    x.beginPath(); x.moveTo(-20, -15); x.lineTo(20, -15); x.stroke(); x.setLineDash([]);
    x.restore();
    tag(b);
  }

  function tag(b) {
    const ax = b.x + 26 * b.sn, ay = b.y - 26 * b.cs, p = b.r1, q = b.r2;
    x.strokeStyle = 'rgba(110,92,72,.95)'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(ax, ay); x.quadraticCurveTo(p.x, p.y, q.x, q.y); x.stroke();
    x.save(); x.translate(q.x, q.y); x.rotate(Math.atan2(-(q.x - p.x), q.y - p.y));
    x.fillStyle = TCOL[b.t] || '#FFD60A';
    x.beginPath(); x.roundRect(-11, -3, 22, 28, 4); x.fill();
    x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 1; x.stroke();
    x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.arc(0, 3, 2.2, 0, 6.3); x.fill();
    x.fillStyle = 'rgba(255,255,255,.92)';
    x.beginPath(); x.moveTo(0, 21); x.quadraticCurveTo(-7, 15, 0, 9); x.quadraticCurveTo(7, 15, 0, 21); x.fill();
    x.restore();
  }

  function drawWater() {
    const h0 = hw(lv), bot = FL - 17, pts = [];
    for (let i = 0; i < NW; i++) pts.push([cx - h0 + 2 * h0 * i / (NW - 1), lv - hs[i]]);
    const g = x.createLinearGradient(0, lv - 20, 0, bot);
    g.addColorStop(0, wc(1, .5 + .2 * tea));
    g.addColorStop(1, wc(.72, .78 + .1 * tea));
    x.beginPath(); x.moveTo(cx - 55, bot); x.lineTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < NW - 1; i++) {
      x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    x.lineTo(pts[NW - 1][0], pts[NW - 1][1]); x.lineTo(cx + 55, bot); x.closePath();
    x.fillStyle = g; x.fill();
    x.strokeStyle = 'rgba(255,255,255,.7)'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < NW - 1; i++) {
      x.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    }
    x.stroke();
    for (const s of steam) {
      const a = Math.sin(Math.min(s.l * 3, 1) * 1.57) * (1 - s.l) * .2;
      const r = s.s * (1 + s.l * 2.4);
      const gr = x.createRadialGradient(s.x, s.y, 0, s.x, s.y, r);
      gr.addColorStop(0, `rgba(190,195,210,${a})`); gr.addColorStop(1, 'rgba(190,195,210,0)');
      x.fillStyle = gr; x.beginPath(); x.arc(s.x, s.y, r, 0, 6.3); x.fill();
    }
    for (const d of drops) {
      x.fillStyle = wc(.9, .85); x.beginPath(); x.arc(d.x, d.y, 4, 0, 6.3); x.fill();
      x.fillStyle = 'rgba(255,255,255,.8)'; x.beginPath(); x.arc(d.x - 1.2, d.y - 1.2, 1.2, 0, 6.3); x.fill();
    }
  }

  // Exact original holder from prototype
  function holder() {
    const y0 = FL - 98, y1 = FL - 12, mg = x.createLinearGradient(cx - 80, 0, cx + 80, 0);
    [[0, '#8A6410'], [.18, '#F7DE82'], [.38, '#C99A22'], [.62, '#FFF0B0'], [.82, '#B88A1A'], [1, '#7A5608']].forEach(([o, c]) => mg.addColorStop(o, c));
    x.save(); x.beginPath(); x.moveTo(cx - hw(y0) - 6, y0); x.lineTo(cx + hw(y0) + 6, y0); x.lineTo(cx + hw(y1) + 6, y1); x.lineTo(cx - hw(y1) - 6, y1); x.closePath(); x.clip();
    x.strokeStyle = mg; x.lineWidth = 2.6; x.beginPath();
    for (let k = -9; k < 10; k++) {
      x.moveTo(cx + k * 22, y0); x.lineTo(cx + k * 22 + 86, y1);
      x.moveTo(cx + k * 22, y0); x.lineTo(cx + k * 22 - 86, y1);
    }
    x.stroke(); x.restore();
    x.lineCap = 'round'; x.strokeStyle = mg; x.lineWidth = 9;
    x.beginPath(); x.moveTo(cx - hw(y0) - 6, y0); x.lineTo(cx + hw(y0) + 6, y0); x.stroke();
    x.lineWidth = 11; x.beginPath(); x.moveTo(cx - hw(y1) - 7, y1); x.lineTo(cx + hw(y1) + 7, y1); x.stroke();
    x.strokeStyle = 'rgba(255,246,200,.8)'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(cx - hw(y0) - 3, y0 - 2); x.lineTo(cx + hw(y0) + 3, y0 - 2); x.stroke();
    x.fillStyle = mg; x.beginPath(); x.ellipse(cx, FL - 3, 74, 6, 0, 0, 6.3); x.fill();
    x.strokeStyle = mg; x.lineWidth = 7;
    x.beginPath(); x.moveTo(cx + hw(y0 + 6) + 6, y0 + 6);
    x.bezierCurveTo(cx + 122, y0 - 4, cx + 124, y1 - 4, cx + hw(y1 - 10) + 6, y1 - 10);
    x.stroke();
    x.strokeStyle = 'rgba(255,255,255,.65)'; x.lineWidth = 1.6;
    x.beginPath(); x.moveTo(cx + hw(y0 + 6) + 6, y0 + 4);
    x.bezierCurveTo(cx + 121, y0 - 6, cx + 123, y1 - 6, cx + hw(y1 - 10) + 6, y1 - 12);
    x.stroke();
    x.lineCap = 'butt';
  }

  // Exact original glass from prototype
  function glass() {
    x.beginPath(); x.moveTo(cx - 76, rimY); x.lineTo(cx - 58, FL - 14); x.lineTo(cx + 58, FL - 14); x.lineTo(cx + 76, rimY);
    x.strokeStyle = edge; x.lineWidth = 2; x.stroke(); x.fillStyle = 'rgba(255,255,255,.07)'; x.fill();
    x.fillStyle = 'rgba(255,255,255,.22)'; x.beginPath(); x.moveTo(cx - 58, FL - 14); x.lineTo(cx + 58, FL - 14); x.lineTo(cx + 56, FL - 5); x.lineTo(cx - 56, FL - 5); x.fill();
    x.fillStyle = 'rgba(255,255,255,.5)'; x.beginPath(); x.moveTo(cx - 67, rimY + 12); x.lineTo(cx - 61, rimY + 12); x.lineTo(cx - 49, FL - 104); x.lineTo(cx - 54, FL - 104); x.fill();
    x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.moveTo(cx + 62, rimY + 16); x.lineTo(cx + 66, rimY + 16); x.lineTo(cx + 55, FL - 104); x.lineTo(cx + 52, FL - 104); x.fill();
    x.strokeStyle = edge; x.lineWidth = 2; x.beginPath(); x.ellipse(cx, rimY, 76, 9, 0, 0, Math.PI); x.stroke();
    holder();
  }

  function draw() {
    x.clearRect(0, 0, W, H);
    x.fillStyle = 'rgba(60,60,80,.16)';
    for (const b of B) { x.beginPath(); x.ellipse(b.x, FL + 3, 26, 4, 0, 0, 6.3); x.fill(); }
    x.fillStyle = 'rgba(60,60,80,.2)';
    x.beginPath(); x.ellipse(cx + 10, FL + 4, 100, 7, 0, 0, 6.3); x.fill();

    x.strokeStyle = edge; x.lineWidth = 2;
    x.beginPath(); x.ellipse(cx, rimY, 76, 9, 0, Math.PI, 2 * Math.PI); x.stroke();

    for (const b of B) bag(b);
    drawWater();
    glass();

    for (const d of dust) {
      x.fillStyle = `rgba(150,100,50,${d.l * .6})`;
      x.beginPath(); x.arc(d.x, d.y, 2 + (1 - d.l) * 3, 0, 6.3); x.fill();
    }

    x.fillStyle = floor; x.fillRect(0, FL, W, H - FL);
    x.fillStyle = 'rgba(0,0,0,.16)'; x.fillRect(0, FL, W, 2);
    x.fillStyle = 'rgba(0,0,0,.08)';
    for (let i = 70; i < W; i += 90) x.fillRect(i, FL + 2, 1.5, H - FL);

    x.fillStyle = wc(1, .22 * tea);
    x.beginPath(); x.ellipse(cx + 64, FL + 6, 66, 5, 0, 0, 6.3); x.fill();

    for (const p of pud) {
      const ry = 2 + Math.min(5, p.w * .07);
      const g = x.createLinearGradient(0, FL + 5 - ry, 0, FL + 5 + ry);
      g.addColorStop(0, wc(1.05, .7)); g.addColorStop(1, wc(.8, .85));
      x.fillStyle = g;
      x.beginPath(); x.ellipse(p.x, FL + 5, p.w / 2, ry, 0, 0, 6.3); x.fill();
      x.strokeStyle = 'rgba(255,255,255,.45)'; x.lineWidth = 1;
      x.beginPath(); x.ellipse(p.x, FL + 4, p.w / 2 - 3, ry - 1, 0, 3.6, 5.8); x.stroke();
    }
  }

  let lastTime = 0;
  function loop(now) {
    if (!running) return;
    const dt = Math.min((now - lastTime) / 1000, .033);
    lastTime = now;
    sim(dt);
    draw();
    animId = requestAnimationFrame(loop);
  }

  const pt = e => {
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function init() {
    if (initialized) return;
    cv = document.getElementById('teaCanvas');
    if (!cv) return;
    x = cv.getContext('2d');

    const pyr = n => {
      let k = 1;
      while (k * (k + 1) / 2 < n) k++;
      const r = [];
      for (; n > 0; k--) {
        const m = Math.min(k, n);
        r.push(m);
        n -= m;
      }
      return r;
    };

    const chipsEl = document.getElementById('tipChips');
    if (chipsEl) {
      chipsEl.innerHTML = TIERS.map((T, i) =>
        `<button class="tea-chip" style="--t:${T.c};--s:${T.s}px" data-i="${i}" aria-label="${T.n} пакетиков: ${T.t}" type="button">` +
        `<div class="tea-pile">${pyr(T.n).map((m, r) => `<div style="--r:${r}">${'<i></i>'.repeat(m)}</div>`).join('')}</div>` +
        `<small>${T.t}</small>` +
        `</button>`
      ).join('');

      chipsEl.querySelectorAll('.tea-chip').forEach(b => {
        b.onclick = () => {
          tip(TIERS[+b.dataset.i]);
          b.classList.remove('pop');
          void b.offsetWidth;
          b.classList.add('pop');
        };
      });
    }

    const shakeBtn = document.getElementById('teaShakeBtn');
    if (shakeBtn) {
      shakeBtn.onclick = () => {
        for (const b of B) {
          b.vy -= 500 + R() * 600;
          b.vx += (R() - .5) * 500;
          b.w += (R() - .5) * 8;
        }
        for (let i = 0; i < NW; i++) vs[i] += (R() - .5) * 8;
      };
    }

    const sweepBtn = document.getElementById('teaSweepBtn');
    if (sweepBtn) {
      sweepBtn.onclick = () => {
        B = []; dust = []; drops = []; pud = []; steam = []; drag = null;
        Aw = A0; tea = 0; hs.fill(0); vs.fill(0);
        count = 0; ui();
      };
    }

    function findBagAt(p) {
      for (let i = B.length - 1; i >= 0; i--) {
        const b = B[i], dx = p.x - b.x, dy = p.y - b.y;
        const lx = dx * b.cs + dy * b.sn, ly = -dx * b.sn + dy * b.cs;
        if (Math.abs(lx) < 28 && Math.abs(ly) < 33) {
          return { b, lx, ly };
        }
      }
      return null;
    }

    // Селективный захват касания: перехватываем скролл только при захвате чайного пакетика;
    // в остальной области canvas (включая воду) вертикальный свайп свободно прокручивает окно.
    cv.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) return;
      const p = pt(e.touches[0]);
      ptr = p;
      const hit = findBagAt(p);
      if (hit) {
        drag = hit;
        e.preventDefault();
      } else if (Math.abs(p.x - cx) < hw(lv) && Math.abs(p.y - lv) < 28) {
        splash(p.x, 1.8);
      }
    }, { passive: false });

    cv.addEventListener('touchmove', e => {
      if (drag && e.touches.length === 1) {
        e.preventDefault();
        ptr = pt(e.touches[0]);
      }
    }, { passive: false });

    cv.addEventListener('touchend', () => { drag = null; }, { passive: true });
    cv.addEventListener('touchcancel', () => { drag = null; }, { passive: true });

    cv.onpointerdown = e => {
      ptr = pt(e);
      if (e.pointerType === 'touch') return;
      const hit = findBagAt(ptr);
      if (hit) {
        drag = hit;
        cv.setPointerCapture(e.pointerId);
      }
    };
    cv.onpointermove = e => {
      const n = pt(e);
      if (!drag && Math.abs(n.x - cx) < hw(lv) && Math.abs(n.y - lv) < 28) {
        splash(n.x, Math.min(Math.hypot(n.x - ptr.x, n.y - ptr.y) * .1, 5));
      }
      ptr = n;
    };
    cv.onpointerup = cv.onpointercancel = () => { drag = null; };

    window.addEventListener('resize', () => {
      if (running) resize();
      updateAuthorTipScrollUI(false);
    });
    initialized = true;
  }

  function start() {
    init();
    running = true;
    requestAnimationFrame(() => {
      resize();
      lastTime = performance.now();
      if (animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(loop);
    });
  }

  function pause() {
    running = false;
    if (animId) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  return { init, start, pause, resize };
})();

const AUTHOR_TIP_DONATE_URL = 'https://dalink.to/courier_analytics';
let tipHintHidden = false;
let tipScrollInitialized = false;

/**
 * Обновление видимости мобильной плашки "Прокрутите страницу вниз"
 * (#authorTipFooter является частью самой прокручиваемой страницы и не скрывается программно)
 */
function updateAuthorTipScrollUI(resetToTop = false) {
  const modal = document.getElementById('authorTipModal');
  const scrollBody = document.getElementById('authorTipScrollBody');
  const hintBar = document.getElementById('authorTipScrollHintBar');
  if (!modal || !scrollBody || !hintBar || modal.classList.contains('hidden')) return;

  if (resetToTop) {
    tipHintHidden = false;
    scrollBody.scrollTop = 0;
  }

  const isMobileViewport = window.innerWidth <= 780;
  if (!isMobileViewport) {
    hintBar.classList.add('hidden');
    tipHintHidden = false;
    return;
  }

  const maxScroll = scrollBody.scrollHeight - scrollBody.clientHeight;
  if (maxScroll <= 6) {
    hintBar.classList.add('hidden');
    tipHintHidden = true;
    return;
  }

  if (!tipHintHidden) {
    hintBar.classList.remove('hidden');
    if (scrollBody.scrollTop >= maxScroll - 8) {
      hintBar.classList.add('hidden');
      tipHintHidden = true;
    }
  } else {
    if (scrollBody.scrollTop < maxScroll - 16) {
      hintBar.classList.remove('hidden');
      tipHintHidden = false;
    }
  }
}

/**
 * Плавная прокрутка модального окна до самого низа (по клику на подсказку)
 */
function scrollAuthorTipToBottom() {
  const scrollBody = document.getElementById('authorTipScrollBody');
  if (scrollBody) {
    scrollBody.scrollTo({ top: scrollBody.scrollHeight, behavior: 'smooth' });
  }
}

/**
 * Открытие модального окна "На чай автору"
 */
function openAuthorTipModal() {
  const modal = document.getElementById('authorTipModal');
  if (modal) {
    showModalDialog(modal);
    const scrollBody = document.getElementById('authorTipScrollBody');
    if (scrollBody && !tipScrollInitialized) {
      scrollBody.addEventListener('scroll', () => updateAuthorTipScrollUI(false), { passive: true });
      tipScrollInitialized = true;
    }
    updateAuthorTipScrollUI(true);
    AuthorTipTeaStation.start();
    requestAnimationFrame(() => updateAuthorTipScrollUI(true));
  }
}

/**
 * Закрытие модального окна "На чай автору"
 */
function closeAuthorTipModal() {
  const modal = document.getElementById('authorTipModal');
  if (modal) {
    closeModalDialog(modal);
    AuthorTipTeaStation.pause();
  }
}

/**
 * Клик по кнопке перехода к оплате доната
 */
function handleTipPaymentClick(e) {
  if (!e || e.type !== 'click') {
    window.open(AUTHOR_TIP_DONATE_URL, '_blank', 'noopener,noreferrer');
  }
  showToast('Открываем страницу поддержки проекта ☕');
}

/**
 * Fallback-копирование текста через скрытый textarea (для окружений без Clipboard API)
 */
function fallbackCopyText(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) { ok = false; }
  document.body.removeChild(ta);
  return ok;
}

/**
 * Копирование актуальной ссылки на оплату
 */
function copyTipPaymentLink() {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(AUTHOR_TIP_DONATE_URL).then(() => {
      showToast('Ссылка на донат скопирована! 📋');
    }).catch(() => {
      if (fallbackCopyText(AUTHOR_TIP_DONATE_URL)) {
        showToast('Ссылка на донат скопирована! 📋');
      } else {
        showToast(`Ссылка: ${AUTHOR_TIP_DONATE_URL} 📋`);
      }
    });
  } else if (fallbackCopyText(AUTHOR_TIP_DONATE_URL)) {
    showToast('Ссылка на донат скопирована! 📋');
  } else {
    showToast(`Ссылка: ${AUTHOR_TIP_DONATE_URL} 📋`);
  }
}

// -----------------------------------------------------------------------------
// 10. ЭКСПОРТ В GLOBAL SCOPE ДЛЯ INLINE HTML ONCLICK HANDLERS
// -----------------------------------------------------------------------------

Object.assign(window, {
  openAuthorTipModal,
  closeAuthorTipModal,
  scrollAuthorTipToBottom,
  handleTipPaymentClick,
  copyTipPaymentLink,
  toggleLayoutMode,
  triggerUserDataFileInput,
  handleUserDataFileUpload,
  resetToDemoData,
  toggleColorTheme,
  showToast,
  openExportModal,
  toggleGrossNet,
  toggleSumHourly,
  toggleChartTable,
  openSettingsScreen,
  closeSettingsScreen,
  setPeriod,
  toggleWeather,
  toggleHeatUnit,
  openDistrictSeasonModal,
  closeMiddleScreen,
  clearSelectedSlots,
  selectTop5Slots,
  planSelectedSlots,
  setCompareMode,
  setSeason,
  openRealMapModal,
  closeRealMapModal,
  cancelRealMapModal,
  confirmRealMapDistrict,
  toggleBenchmarks,
  openExpenseInfoModal,
  closeExpenseInfoModal,
  disputeAdjustment,
  resetExpensesToDefault,
  applyTransportPreset,
  confirmAddCustomExpense,
  toggleAddExpenseForm,
  onToggleGoals,
  closePlanSlotsModal,
  confirmPlanSlots,
  closeForecastInfoModal,
  openForecastInfoModal,
  selectDistrict,
  selectBar,
  scrollBarIntoViewIfClipped,
  toggleHeatCell,
  updateExpenseSlider,
  stepExpense,
  deleteExpenseItem,
  toggleTableColumn,
  setWeekStartDay,
  openLegalModal,
  closeLegalModal,
  loadDemoDataset,
  ensureXlsxLoaded,
  ensureFflateLoaded,
  decodeDemoJsonBuffer,
  buildSampleTemplateWorkbookBytes,
  getAdjustmentRecordsForModal,
  isDemoMode
});

// -----------------------------------------------------------------------------
// 11. ПЕРВИЧНЫЙ ЗАПУСК
// -----------------------------------------------------------------------------

// Инициализация дня начала недели (понедельник: 1) исключительно в оперативной памяти
if (typeof state.weekStartDay !== 'number') {
  state.weekStartDay = 1;
}

/**
 * Поддержка горизонтальной и вертикальной прокрутки таблиц и графиков зажатием ЛКМ (drag-to-scroll)
 * Обеспечивает удобную навигацию на ПК без необходимости попадать по узкому слайдеру скроллбара
 */
function setupTableDragScroll() {
  let isDown = false;
  let startX = 0;
  let startY = 0;
  let scrollLeft = 0;
  let scrollTop = 0;
  let activeContainer = null;
  let hasMoved = false;
  let lastTouchTime = 0;

  // 1. Мышиный драг-скролл
  document.addEventListener('mousedown', (e) => {
    // Только основная левая кнопка мыши (игнорируем сенсорные/эмулированные события)
    if (e.button !== 0) return;
    if ((e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents) || (Date.now() - lastTouchTime < 700)) {
      return;
    }

    const container = e.target && e.target.closest('.table-scroll-container, .overflow-x-auto, #barScrollContainer, #manualEditorTableContainer, #tableFilterValuesList');
    if (!container) return;

    // В ручном редакторе и списке фильтра разрешаем начинать драг (для удобного скролла)
    const isManualEditor = container.id === 'manualEditorTableContainer' || !!container.closest('#manualEditorTableContainer');
    const isFilterList = container.id === 'tableFilterValuesList' || !!container.closest('#tableFilterValuesList');
    if (!isManualEditor && !isFilterList && e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA')) {
      return;
    }

    // Проверяем, есть ли что скроллить
    const canScrollX = container.scrollWidth > container.clientWidth + 2;
    const canScrollY = container.scrollHeight > container.clientHeight + 2;
    if (!canScrollX && !canScrollY) return;

    isDown = true;
    hasMoved = false;
    activeContainer = container;
    startX = e.pageX;
    startY = e.pageY;
    scrollLeft = container.scrollLeft;
    scrollTop = container.scrollTop;
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    if (!isDown || !activeContainer) return;

    const dx = e.pageX - startX;
    const dy = e.pageY - startY;

    if (!hasMoved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      hasMoved = true;
      document.body.classList.add('is-dragging-scroll');
      activeContainer.classList.add('active-dragging');
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }

    if (hasMoved) {
      activeContainer.scrollLeft = scrollLeft - dx;
      activeContainer.scrollTop = scrollTop - dy;
      e.preventDefault();
    }
  }, { passive: false });

  const endDrag = () => {
    if (isDown) {
      isDown = false;
      document.body.classList.remove('is-dragging-scroll');
      if (activeContainer) {
        activeContainer.classList.remove('active-dragging');
        activeContainer = null;
      }
      if (hasMoved) {
        // Даём тайм-аут на перехват клика
        setTimeout(() => {
          hasMoved = false;
        }, 120);
      }
    }
  };

  window.addEventListener('mouseup', endDrag, { passive: true });
  window.addEventListener('blur', endDrag, { passive: true });
  window.addEventListener('click', (e) => {
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // 2. Сенсорный свайп/панорамирование на тач-экранах для таблицы ручного ввода (с инпутов, селектов и кнопок)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchScrollLeft = 0;
  let touchScrollTop = 0;
  let touchActiveContainer = null;
  let isTouchDragging = false;

  document.addEventListener('touchstart', (e) => {
    lastTouchTime = Date.now();
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    const container = touch.target && touch.target.closest('#manualEditorTableContainer');
    if (!container) return;

    touchActiveContainer = container;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchScrollLeft = container.scrollLeft;
    touchScrollTop = container.scrollTop;
    isTouchDragging = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!touchActiveContainer || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    if (!isTouchDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      isTouchDragging = true;
      hasMoved = true;
      if (document.activeElement && typeof document.activeElement.blur === 'function') {
        document.activeElement.blur();
      }
    }

    if (isTouchDragging) {
      touchActiveContainer.scrollLeft = touchScrollLeft - dx;
      touchActiveContainer.scrollTop = touchScrollTop - dy;
      if (e.cancelable) {
        e.preventDefault();
      }
    }
  }, { passive: false });

  const endTouchDrag = () => {
    if (isTouchDragging) {
      setTimeout(() => {
        hasMoved = false;
        isTouchDragging = false;
      }, 120);
    }
    touchActiveContainer = null;
  };

  document.addEventListener('touchend', endTouchDrag, { passive: true });
  document.addEventListener('touchcancel', endTouchDrag, { passive: true });

  // Предотвращаем случайное срабатывание клика (по кнопке ✕ или инпуту) после драг-скролла
  document.addEventListener('click', (e) => {
    if (hasMoved || isTouchDragging) {
      e.preventDefault();
      e.stopPropagation();
      hasMoved = false;
      isTouchDragging = false;
    }
  }, true);

  // Открытие выпадающего меню по чистому клику на ячейку селекта (без ложного открытия при скролле)
  document.addEventListener('click', (e) => {
    const cell = e.target.closest('.manual-select-cell');
    if (!cell) return;
    const sel = cell.querySelector('select');
    if (sel) {
      sel.focus();
      if (typeof sel.showPicker === 'function') {
        try {
          sel.showPicker();
        } catch (err) {
          // Игнорируем в случае непредвиденных ограничений окружения
        }
      }
    }
  });

  // Доступность с клавиатуры: Enter или Space на селекте открывает нативное меню
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.matches('.manual-select-cell select')) {
      if (e.key === ' ' || e.key === 'Enter') {
        if (typeof e.target.showPicker === 'function') {
          try {
            e.target.showPicker();
          } catch (err) {}
        }
      }
    }
  });
}

dom.selectedBarDetails.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-exp-idx]');
  const item = btn && lastSelectedRow && lastSelectedRow.itemizedExpenses[+btn.dataset.expIdx];
  if (item) openExpenseInfoModal(item.name, item.amount);
});

setupColumnDragDelegation();
setupTableDragScroll();
updateWeekStartDayUI();
setupImportMaster();

// Пересчитываем ширину мобильного кластера источника только при реальном изменении ширины экрана,
// чтобы скрытие/показ адресной строки браузера при вертикальном скролле не вызывал скачки макета
let lastWindowWidthForBanner = window.innerWidth;
window.addEventListener('resize', () => {
  if (window.innerWidth !== lastWindowWidthForBanner) {
    lastWindowWidthForBanner = window.innerWidth;
    syncMobileSourceClusterWidth();
    repositionChartBenchmarks();
  }
}, { passive: true });

// Автоопределение типа устройства (ПК / Мобильный) при первой загрузке страницы
const isDesktopDevice = (window.innerWidth >= 1024) &&
  (typeof window.matchMedia === 'function' ? window.matchMedia('(pointer: fine)').matches : true);
applyLayoutMode(isDesktopDevice ? 'pc' : 'phone', false);
initColorMode();

if (window.Theme && typeof window.Theme.onChange === 'function') {
  window.Theme.onChange(() => redrawSchematicMapLayer());
}
renderAll();
// Примечание: loadDemoDataset() вызывается строго контролируемо в initAppBootstrap(),
// чтобы исключить состояние гонки (race condition) с восстановлением данных из IndexedDB/облака

// =============================================================================
// ВЫБОР СТИЛЯ ОФОРМЛЕНИЯ (v13.17.3)
// =============================================================================
let currentUiStyle = 'default';

function toggleStyleDropdown(event, mode) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const isMobile = mode === 'mobile' || (window.innerWidth <= 780);
  const menuId = isMobile ? 'styleDropdownMenuMobile' : 'styleDropdownMenu';
  const iconId = isMobile ? 'styleChevronIconMobile' : 'styleChevronIcon';
  const wrapperId = isMobile ? 'styleMobileWrapper' : 'styleSplitWrapper';
  const menu = document.getElementById(menuId);
  const icon = document.getElementById(iconId);
  const wrapper = document.getElementById(wrapperId);
  const cluster = document.querySelector('.banner-cluster-theme-layout');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  closeStyleDropdown();
  closeImportDropdown();
  closeSaveDropdown();
  if (isHidden) {
    menu.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
    if (wrapper) wrapper.classList.add('dropdown-active');
    if (cluster) cluster.classList.add('dropdown-active');
  }
}

function closeStyleDropdown() {
  ['styleDropdownMenu', 'styleDropdownMenuMobile'].forEach(id => {
    const menu = document.getElementById(id);
    if (menu && !menu.classList.contains('hidden')) {
      menu.classList.add('hidden');
    }
  });
  ['styleChevronIcon', 'styleChevronIconMobile'].forEach(id => {
    const icon = document.getElementById(id);
    if (icon) icon.classList.remove('rotate-180');
  });
  ['styleSplitWrapper', 'styleMobileWrapper'].forEach(id => {
    const w = document.getElementById(id);
    if (w) w.classList.remove('dropdown-active');
  });
  const cluster = document.querySelector('.banner-cluster-theme-layout');
  if (cluster) cluster.classList.remove('dropdown-active');
}

function selectUiStyle(styleId, silent = false) {
  const skin = (window.Theme && Theme.setSkin(styleId)) || { id: 'default', name: 'Обычный' };          // theme/theme.js: атрибут html[data-skin], шрифты, галочки в меню, localStorage
  currentUiStyle = skin.id;
  if (!silent) {
    showToast(`Стиль: ${skin.name}`);
  }
  saveAppSettings();
}


// =============================================================================
// WEB WORKER МЕНЕДЖЕР (v14.5.0) — analytics.worker.js
// =============================================================================
class AnalyticsWorkerManager {
  constructor() {
    this.worker = null;
    this.available = false;
    this.reqId = 1;
    this.pending = new Map();
  }

  init() {
    if (typeof Worker === 'undefined') {
      console.warn('Web Worker не поддерживается браузером; используется встроенный синхронный режим.');
      return;
    }
    try {
      this.worker = new Worker('analytics.worker.js');
      this.worker.onmessage = (e) => this.handleMessage(e.data);
      this.worker.onerror = (err) => {
        console.warn('Ошибка Web Worker runtime:', err);
      };
      this.available = true;
    } catch (e) {
      console.warn('Не удалось запустить Web Worker (например, при file://); используется встроенный фолбэк.', e);
      this.available = false;
    }
  }

  handleMessage(msg) {
    const { id, success, result, error } = msg;
    const resolver = this.pending.get(id);
    if (!resolver) return;
    this.pending.delete(id);
    if (success) resolver.resolve(result);
    else resolver.reject(new Error(error || 'Worker task failed'));
  }

  execute(action, payload) {
    if (this.available && this.worker) {
      return new Promise((resolve, reject) => {
        const id = this.reqId++;
        this.pending.set(id, { resolve, reject });
        this.worker.postMessage({ id, action, payload });
      });
    }
    return this.executeFallback(action, payload);
  }

  async executeFallback(action, payload) {
    switch (action) {
      case 'AGGREGATE': {
        const orders = payload.orders || [];
        const isDemo = !!payload.isDemo;
        const caps = payload.capabilities || {};
        const datasets = buildDatasetsFromOrders(orders, caps, isDemo);
        return {
          days: datasets.days,
          weeks: datasets.weeks,
          months: datasets.months,
          heatmapMatrix: computeHeatmapMatrixFromOrders(orders),
          dominantTransportKey: datasets.dominantTransportKey,
          avgCheck: (orders.length > 0 ? Math.round(orders.reduce((s, o) => s + (Number(o.orderCost || o.baseCost) || 0), 0) / orders.length) : 0),
          stats: { totalOrders: orders.length }
        };
      }
      case 'SERIALIZE': {
        const json = JSON.stringify(payload.data, null, payload.pretty ? 2 : 0);
        const sizeBytes = new Blob([json]).size;
        return {
          json,
          sizeBytes,
          sizeKB: Math.round((sizeBytes / 1024) * 10) / 10,
          recordCount: payload.data?.orders?.length || 0
        };
      }
      case 'PARSE_AND_VALIDATE': {
        try {
          const text = payload.jsonText || payload;
          const data = typeof text === 'string' ? JSON.parse(text) : text;
          const orders = Array.isArray(data) ? data : (data.orders || []);
          const str = typeof text === 'string' ? text : JSON.stringify(data);
          const sizeKB = Math.round((str.length / 1024) * 10) / 10;
          let minDate = null;
          let maxDate = null;
          orders.forEach(o => {
            if (o.date) {
              if (!minDate || o.date < minDate) minDate = o.date;
              if (!maxDate || o.date > maxDate) maxDate = o.date;
            }
          });
          return {
            valid: true,
            errors: [],
            recordCount: orders.length,
            data,
            stats: {
              earliestDate: minDate || '',
              latestDate: maxDate || '',
              totalShifts: orders.length,
              totalOrders: orders.reduce((s, o) => s + (Number(o.ordersCount) || 1), 0),
              sizeKB
            }
          };
        } catch (e) {
          return { valid: false, errors: [e.message], recordCount: 0, data: null, stats: null };
        }
      }
      case 'SANITIZE': {
        const allowed = new Set([
          'id', 'date', 'startSecs', 'endSecs', 'durationMins', 'orderCost', 'baseCost',
          'transport', 'transportKey', 'transportLabel', 'ordersCount', 'isSlotLevel',
          'distance', 'weight', 'wait', 'waitMin', 'effectiveWaitMin',
          'surgePct', 'surgeRub', 'ratingPct', 'ratingRub', 'bonus', 'tip', 'goal',
          'adjustment', 'adjustmentReason', 'expense', 'slotType', 'slotNumber',
          'year', 'seasonKey', 'dowIdx', 'dayOfWeek', 'startStr', 'endStr'
        ]);
        const forbidden = new Set([
          'clientName', 'customerName', 'clientPhone', 'customerPhone', 'phone',
          'clientAddress', 'deliveryAddress', 'address', 'street', 'flat', 'apartment',
          'porch', 'entrance', 'intercom', 'comment', 'orderComment', 'fio', 'recipient',
          'userPhone', 'clientFio'
        ]);
        const rePhone = /(?:\+7|8)[\s\-]?(?:\(?\d{3}\)?[\s\-]?)\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;
        const reAddr = /(?:кв\.?|квартир[аы]?|подъезд|домофон|эт\.?|этаж)\s*\d+/gi;
        const reCard = /\b(?:\d{4}[\s\-]?){4}\b/g;

        const orders = payload.orders || payload || [];
        let stripped = 0;
        let scrubbed = 0;

        const sanitizedOrders = (Array.isArray(orders) ? orders : []).map(o => {
          if (!o || typeof o !== 'object') return o;
          const clean = {};
          for (const [k, v] of Object.entries(o)) {
            if (forbidden.has(k) || !allowed.has(k)) {
              stripped++;
              continue;
            }
            if (typeof v === 'string') {
              let s = v;
              const sPhone = s.replace(rePhone, '[ТЕЛЕФОН_СКРЫТ]');
              if (sPhone !== s) { s = sPhone; scrubbed++; }
              const sAddr = s.replace(reAddr, '[АДРЕС_СКРЫТ]');
              if (sAddr !== s) { s = sAddr; scrubbed++; }
              const sCard = s.replace(reCard, '[КАРТА_СКРЫТА]');
              if (sCard !== s) { s = sCard; scrubbed++; }
              clean[k] = s;
            } else {
              clean[k] = v;
            }
          }
          return clean;
        });

        return { sanitizedOrders, strippedFieldsCount: stripped, scrubbedPiiCount: scrubbed, compliant152Fz: true };
      }
      default:
        throw new Error(`Неизвестное действие: ${action}`);
    }
  }
}

const workerManager = new AnalyticsWorkerManager();

// =============================================================================
// КЛИЕНТСКАЯ БАЗА ДАННЫХ (Dexie.js / IndexedDB) (v14.5.0)
// =============================================================================
let courierDB = null;

function initCourierDB() {
  if (typeof Dexie !== 'undefined') {
    try {
      courierDB = new Dexie('CourierAnalyticsDB');
      courierDB.version(1).stores({
        orders: '++id, date, transportKey, slotType',
        settings: 'key',
        sync_state: 'key'
      });
      window.courierDB = courierDB;
      window.CourierAnalyticsDB = courierDB;
    } catch (e) {
      console.warn('Ошибка инициализации Dexie CourierAnalyticsDB:', e);
    }
  } else {
    console.warn('Dexie не загружен. IndexedDB будет недоступен, используется сессионный режим.');
  }

  // Защита долговременного хранилища (Safari ITP / Chrome Quota)
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().then(persistent => {
      console.log('Долговременное хранилище IndexedDB (StorageManager):', persistent);
    }).catch(err => console.warn('Ошибка navigator.storage.persist():', err));
  }
}

async function saveOrdersToIndexedDB(orders, options = {}) {
  if (!courierDB || !courierDB.orders) return;
  try {
    await courierDB.transaction('rw', courierDB.orders, courierDB.sync_state, async () => {
      await courierDB.orders.clear();
      if (Array.isArray(orders) && orders.length > 0) {
        const cleanList = orders.map(o => {
          const c = { ...o };
          delete c.id; // автоинкремент первичного ключа
          return c;
        });
        await courierDB.orders.bulkAdd(cleanList);
      }
      if (!options.preserveTimestamp) {
        const nowIso = new Date().toISOString();
        await courierDB.sync_state.put({ key: 'lastModified', value: nowIso });
        if (!state.syncTimestamps) state.syncTimestamps = { orders: null, settings: null };
        state.syncTimestamps.orders = nowIso;
        try {
          localStorage.setItem('courier_sync_time_orders', nowIso);
          await courierDB.sync_state.put({ key: 'syncTimestamps', value: state.syncTimestamps });
        } catch (_) {}
      }
    });
    if (typeof updateSyncUI === 'function') updateSyncUI();
  } catch (err) {
    console.warn('Ошибка сохранения в Dexie.orders:', err);
  }
}

// =============================================================================
// СИНХРОНИЗАЦИЯ ДАННЫХ (INDEXEDDB И ЯНДЕКС.ДИСК) (v14.5.0)
// =============================================================================
const YANDEX_CLIENT_ID = '00eefd791b9e41f391adc5d3a81796f7';
const YANDEX_DISK_API_BASE = 'https://cloud-api.yandex.net/v1/disk/resources';
const YANDEX_APP_FILE_PATH = 'app:/courier_data.json';

let pendingConflictCloudData = null;

function getRedirectUri() {
  return (typeof window !== 'undefined' && window.location.origin.includes('127.0.0.1:5500'))
    ? 'http://127.0.0.1:5500/'
    : 'https://courier-analytics.ru/';
}

function checkYandexOAuthHash() {
  if (typeof window === 'undefined' || !window.location.hash) return;
  const hash = window.location.hash;
  if (hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const expiresIn = parseInt(params.get('expires_in') || '31536000', 10);
    if (token) {
      state.yandexToken = token;
      state.yandexTokenExpiresAt = Date.now() + (expiresIn * 1000);
      state.syncMode = 'yandex';
      try {
        localStorage.setItem('ya_disk_token', token);
        localStorage.setItem('ya_disk_token_exp', String(state.yandexTokenExpiresAt));
        localStorage.setItem('courier_sync_mode', 'yandex');
        if (courierDB && courierDB.sync_state) {
          courierDB.sync_state.put({ key: 'yandexToken', value: token });
          courierDB.sync_state.put({ key: 'syncMode', value: 'yandex' });
        }
      } catch (e) {}
      history.replaceState(null, '', window.location.pathname + window.location.search);
      showToast('Яндекс ID успешно подключён!');
      setYandexSyncStatus('connected');
    }
  } else if (hash.includes('error=')) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
    showToast('Авторизация Яндекс ID отклонена');
  }
}

function connectYandexDisk(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const redirectUri = getRedirectUri();
  const authUrl = `https://oauth.yandex.ru/authorize?response_type=token&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location.href = authUrl;
}

// Форматирование временных меток синхронизации (v14.7.1)
function formatSyncTimestamp(date = new Date()) {
  const d = (date instanceof Date && !isNaN(date.getTime())) ? date : new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year}, ${hours}:${minutes}`;
}

function normalizeSyncTimestamp(t) {
  if (!t || typeof t !== 'string') return formatSyncTimestamp();
  if (t.includes('.')) return t;
  const today = formatSyncTimestamp().split(',')[0];
  return `${today}, ${t}`;
}

// Безопасное форматирование даты и времени с запретом разрыва строк внутри блоков (v14.12.0)
function formatSyncDateTimeHtml(isoOrStr) {
  if (!isoOrStr) return '<span class="text-sec opacity-70">Не сохранялись</span>';
  let d = new Date(isoOrStr);
  if (isNaN(d.getTime())) {
    const str = String(isoOrStr).trim();
    if (str.includes(',')) {
      const parts = str.split(',').map(s => s.trim());
      return `<span class="inline-flex items-center gap-1.5 flex-wrap"><span class="font-medium whitespace-nowrap text-main">${escapeHtml(parts[0])}</span><span class="text-sec text-[10px] whitespace-nowrap">${escapeHtml(parts[1])}</span></span>`;
    }
    return `<span class="font-medium whitespace-nowrap text-main">${escapeHtml(str)}</span>`;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `<span class="inline-flex items-center gap-1.5 flex-wrap"><span class="font-medium whitespace-nowrap text-main">${day}.${month}.${year}</span><span class="text-sec text-[10px] whitespace-nowrap">${hours}:${minutes}</span></span>`;
}

function disconnectYandexDisk(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  state.yandexToken = null;
  state.yandexTokenExpiresAt = 0;
  state.yandexSyncStatus = 'not_connected';
  try {
    localStorage.removeItem('ya_disk_token');
    localStorage.removeItem('ya_disk_token_exp');
    localStorage.removeItem('ya_disk_last_synced');
    if (state.syncMode === 'yandex') {
      state.syncMode = 'indexeddb';
      localStorage.setItem('courier_sync_mode', 'indexeddb');
    }
    if (courierDB && courierDB.sync_state) {
      courierDB.sync_state.delete('yandexToken');
      courierDB.sync_state.delete('yandexLastSyncedAt');
      courierDB.sync_state.put({ key: 'syncMode', value: state.syncMode });
    }
  } catch (e) {}
  setYandexSyncStatus('not_connected');
  updateSyncUI();
  refreshDataStatusBadge();
  showToast('Яндекс ID отключён. Режим синхронизации: IndexedDB');
}

function setYandexSyncStatus(status, timeStr = null) {
  if (timeStr) {
    state.yandexLastSyncedAt = normalizeSyncTimestamp(timeStr);
  }
  if (!state.yandexToken) {
    status = 'not_connected';
  } else if (!navigator.onLine && status !== 'syncing') {
    status = 'offline';
  } else if (status === 'offline' && navigator.onLine) {
    status = state.yandexLastSyncedAt ? 'synced' : 'connected';
  }

  state.yandexSyncStatus = status;

  // Обратная совместимость с кнопкой btnConnectYandex при её наличии
  const btnConnect = document.getElementById('btnConnectYandex');
  if (btnConnect) {
    if (state.yandexToken) {
      btnConnect.textContent = 'Отключить';
      btnConnect.onclick = disconnectYandexDisk;
    } else {
      btnConnect.textContent = 'Подключить Яндекс ID';
      btnConnect.onclick = connectYandexDisk;
    }
  }

  let text = 'Не подключено';
  if (status === 'connected') text = 'В сети';
  else if (status === 'synced') text = 'Синхронизировано';
  else if (status === 'offline') text = 'Офлайн';

  updateSyncUI();
}

function selectSyncMode(mode) {
  if (mode === state.syncMode) return;

  const doSwitch = () => {
    state.syncMode = mode;
    try {
      localStorage.setItem('courier_sync_mode', mode);
      if (courierDB && courierDB.sync_state) {
        courierDB.sync_state.put({ key: 'syncMode', value: mode });
      }
    } catch (e) {}

    updateSyncUI();
    refreshDataStatusBadge();

    if (mode === 'yandex') {
      if (!state.yandexToken) {
        showToast('Перенаправление на авторизацию Яндекс ID...');
        connectYandexDisk();
      } else {
        checkCloudSync();
      }
    } else if (mode === 'indexeddb') {
      showToast('Режим: IndexedDB (локально в браузере)');
      if (state.usingUserData && state.activeOrders.length > 0) {
        saveOrdersToIndexedDB(state.activeOrders);
      }
    } else if (mode === 'session') {
      showToast('Режим: Без синхронизации (только сессия RAM)');
    }
  };

  // 1. При смене с Яндекс.Диска на другой режим: удаляем файл с диска и спрашиваем подтверждение (v14.7.1)
  if (state.syncMode === 'yandex') {
    const targetLabel = mode === 'indexeddb' ? 'IndexedDB (локально в браузере)' : 'Без синхронизации (только сессия)';
    openConfirmActionModal(
      'Отключить Яндекс Диск?',
      `Вы переключаетесь в режим «${targetLabel}». Облачная копия файла смен на вашем Яндекс.Диске будет удалена, а данные останутся доступны только в браузере на этом устройстве.`,
      'Рекомендуется предварительно скачать резервную копию (.xlsx / .csv).',
      async () => {
        showToast('Удаление файла с Яндекс.Диска...');
        await deleteFromYandexDisk();
        state.yandexToken = null;
        state.yandexTokenExpiresAt = 0;
        state.yandexLastSyncedAt = null;
        try {
          localStorage.removeItem('ya_disk_token');
          localStorage.removeItem('ya_disk_token_exp');
          localStorage.removeItem('ya_disk_last_synced');
          if (courierDB && courierDB.sync_state) {
            courierDB.sync_state.delete('yandexToken');
            courierDB.sync_state.delete('yandexLastSyncedAt');
          }
        } catch (e) {}
        doSwitch();
        showToast('Облачный файл удалён. Режим переключен.');
      }
    );
    return;
  }

  // 2. Если пользователь переключается на Session из IndexedDB при наличии рабочих данных
  if (mode === 'session' && state.usingUserData && state.activeOrders && state.activeOrders.length > 0) {
    openConfirmActionModal(
      'Отключить сохранение данных?',
      `Вы переключаетесь в режим «Без синхронизации (только сессия)». Внесённые смены (${state.activeOrders.length} смен) останутся в памяти, но новые изменения не будут сохраняться на диск или в облако. При перезагрузке страницы они могут быть сброшены.`,
      'Рекомендуется предварительно скачать резервную копию (.xlsx / .csv).',
      doSwitch
    );
    return;
  }

  // 3. Если переключаемся на Яндекс, а токена нет — сразу вызываем подключение (v14.7.1)
  if (mode === 'yandex' && !state.yandexToken) {
    showToast('Перенаправление на авторизацию Яндекс ID...');
    connectYandexDisk();
    return;
  }

  doSwitch();
}

function updateSyncUI() {
  const mode = state.syncMode || 'indexeddb';
  const isUser = !!state.usingUserData;

  // Чекмарки в выпадающем меню
  ['session', 'indexeddb', 'yandex'].forEach(m => {
    const chk = document.getElementById(`syncCheck-${m}`);
    if (chk) chk.classList.toggle('hidden', m !== mode);
  });

  // Подсветка активной карточки в модальном окне (зеленая рамка)
  ['session', 'indexeddb', 'yandex'].forEach(m => {
    const card = document.getElementById(`syncCard-${m}`);
    if (card) {
      if (m === mode) {
        card.classList.remove('border-subtle');
        card.classList.add('border-emerald-500', 'ring-1', 'ring-emerald-500/30', 'bg-emerald-500/[0.04]');
      } else {
        card.classList.remove('border-emerald-500', 'ring-1', 'ring-emerald-500/30', 'bg-emerald-500/[0.04]');
        card.classList.add('border-subtle');
      }
    }
  });

  // v14.7.0 legacy marker for test suite: Данные не импортированы пользователем (скорректировано в v14.12.0)
  // Статусы на всех 3 карточках (v14.7.1, v14.12.0)
  // 1. Сессия
  const badgeSession = document.getElementById('sessionSyncStatusBadge');
  if (badgeSession) {
    if (mode !== 'session') {
      badgeSession.innerHTML = 'Статус: <b class="text-slate-400">Отключено</b>';
    } else if (!isUser) {
      badgeSession.innerHTML = 'Статус: <b class="text-slate-400">Активно (демо-режим)</b>';
    } else {
      badgeSession.innerHTML = 'Статус: <b class="text-amber-500">Активно (только сессия RAM)</b>';
    }
  }

  // 2. IndexedDB
  const badgeIndexedDb = document.getElementById('indexedDbSyncStatusBadge');
  if (badgeIndexedDb) {
    if (mode !== 'indexeddb') {
      badgeIndexedDb.innerHTML = 'Статус: <b class="text-slate-400">Отключено</b>';
    } else if (!isUser) {
      badgeIndexedDb.innerHTML = 'Статус: <b class="text-emerald-500">Активно (демо-данные)</b>';
    } else {
      badgeIndexedDb.innerHTML = 'Статус: <b class="text-emerald-500">Активно (сохранено в браузере)</b>';
    }
  }

  const idbRow = document.getElementById('indexedDbTimestampsRow');
  const idbOrdersTime = document.getElementById('idbOrdersSyncTime');
  const idbSettingsTime = document.getElementById('idbSettingsSyncTime');
  if (idbRow) {
    idbRow.classList.toggle('hidden', mode !== 'indexeddb');
    if (idbOrdersTime) {
      idbOrdersTime.innerHTML = isUser
        ? formatSyncDateTimeHtml(state.syncTimestamps?.orders)
        : '<span class="text-sec">Демо-смены</span>';
    }
    if (idbSettingsTime) {
      idbSettingsTime.innerHTML = state.syncTimestamps?.settings
        ? formatSyncDateTimeHtml(state.syncTimestamps.settings)
        : '<span class="text-sec">По умолчанию</span>';
    }
  }

  // 3. Яндекс Диск
  const badgeYandex = document.getElementById('yandexSyncStatusBadge');
  if (badgeYandex) {
    if (mode !== 'yandex') {
      badgeYandex.innerHTML = 'Статус: <b class="text-slate-400">Отключено</b>';
    } else if (!state.yandexToken) {
      badgeYandex.innerHTML = 'Статус: <b class="text-amber-500">Не подключено</b>';
    } else if (!navigator.onLine) {
      badgeYandex.innerHTML = 'Статус: <b class="text-amber-500">Офлайн</b>';
    } else if (state.yandexSyncStatus === 'syncing') {
      badgeYandex.innerHTML = 'Статус: <b class="text-blue-400 animate-pulse">Синхронизация...</b>';
    } else if (state.yandexSyncStatus === 'synced' || state.yandexLastSyncedAt) {
      badgeYandex.innerHTML = 'Статус: <b class="text-emerald-500">Подключено (в сети)</b>';
    } else {
      badgeYandex.innerHTML = 'Статус: <b class="text-emerald-500">Подключено (в сети)</b>';
    }
  }

  const yandexRow = document.getElementById('yandexTimestampsRow');
  const yandexOrdersTime = document.getElementById('yandexOrdersSyncTime');
  const yandexSettingsTime = document.getElementById('yandexSettingsSyncTime');
  if (yandexRow) {
    yandexRow.classList.toggle('hidden', mode !== 'yandex' || !state.yandexToken);
    if (yandexOrdersTime) {
      const ordersT = state.syncTimestamps?.orders;
      yandexOrdersTime.innerHTML = isUser
        ? (ordersT ? formatSyncDateTimeHtml(ordersT) : '<span class="text-sec">Не синхронизировались</span>')
        : '<span class="text-sec">Демо-смены</span>';
    }
    if (yandexSettingsTime) {
      const settingsT = state.syncTimestamps?.settings;
      yandexSettingsTime.innerHTML = settingsT
        ? formatSyncDateTimeHtml(settingsT)
        : '<span class="text-sec">Не синхронизировались</span>';
    }
  }

  // Текст и иконка на сервисной плашке
  const btn = document.getElementById('btnSaveData');
  const icon = document.getElementById('syncStatusIcon');
  if (btn) {
    let modeLabel = 'IndexedDB (по умолчанию)';
    if (mode === 'session') {
      modeLabel = 'Сессия (RAM)';
      if (icon) icon.setAttribute('class', 'w-3.5 h-3.5 shrink-0 text-slate-400');
    } else if (mode === 'yandex') {
      modeLabel = 'Яндекс Диск (облако)';
      if (icon) icon.setAttribute('class', 'w-3.5 h-3.5 shrink-0 text-blue-500');
    } else {
      if (icon) icon.setAttribute('class', 'w-3.5 h-3.5 shrink-0 text-emerald-500');
    }
    btn.title = `Синхронизация данных: ${modeLabel}`;
  }
}

function toggleSaveDropdown(event) {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  const wrapper = document.getElementById('saveSplitWrapper');
  const menu = document.getElementById('saveDropdownMenu');
  const icon = document.getElementById('saveChevronIcon');
  if (!menu) return;
  const isHidden = menu.classList.contains('hidden');
  closeSaveDropdown();
  closeImportDropdown();
  closeStyleDropdown();
  if (isHidden) {
    updateSyncUI();
    updateBackupButtonsState();
    menu.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
    if (wrapper) wrapper.classList.add('dropdown-active');
  }
}

function closeSaveDropdown() {
  const wrapper = document.getElementById('saveSplitWrapper');
  const menu = document.getElementById('saveDropdownMenu');
  const icon = document.getElementById('saveChevronIcon');
  if (menu && !menu.classList.contains('hidden')) {
    menu.classList.add('hidden');
  }
  if (icon) {
    icon.classList.remove('rotate-180');
  }
  if (wrapper) wrapper.classList.remove('dropdown-active');
}

function openSyncModal() {
  closeSaveDropdown();
  updateSyncUI();
  updateBackupButtonsState();
  const modal = document.getElementById('syncModal');
  if (modal) showModalDialog(modal);
}

function closeSyncModal() {
  const modal = document.getElementById('syncModal');
  if (modal) closeModalDialog(modal);
}

function resetToDemoDataModal() {
  closeSyncModal();
  resetToDemoData();
}

function openConflictModal() {
  const modal = document.getElementById('syncConflictModal');
  if (modal) showModalDialog(modal);
}

function closeConflictModal() {
  const modal = document.getElementById('syncConflictModal');
  if (modal) closeModalDialog(modal);
  pendingConflictCloudData = null;
}

function updateBackupButtonsState() {
  const isUser = !!state.usingUserData;
  const ordersCount = (state.activeOrders || []).length;
  const isTooLargeForXlsx = ordersCount > 10000;

  // Кнопка сброса к демо в футере модалки синхронизации
  const btnResetModal = document.getElementById('btnResetToDemo');
  if (btnResetModal) {
    if (isUser) {
      btnResetModal.disabled = false;
      btnResetModal.classList.remove('btn-plan-disabled', 'opacity-40', 'cursor-not-allowed');
      btnResetModal.classList.add('cursor-pointer');
    } else {
      btnResetModal.disabled = true;
      btnResetModal.classList.add('btn-plan-disabled', 'opacity-40', 'cursor-not-allowed');
      btnResetModal.classList.remove('cursor-pointer');
    }
  }

  // Кнопки скачивания XLSX
  const xlsxButtons = [
    document.getElementById('btnModalDownloadBackupXlsx'),
    document.getElementById('btnDropdownDownloadBackupXlsx')
  ];
  xlsxButtons.forEach(btn => {
    if (!btn) return;
    if (!isUser) {
      btn.disabled = true;
      btn.classList.add('btn-plan-disabled');
      btn.title = 'Доступно только для ваших внесённых смен';
    } else if (isTooLargeForXlsx) {
      btn.disabled = true;
      btn.classList.add('btn-plan-disabled');
      btn.title = 'Объём свыше 10 000 смен. Скачивание .xlsx отключено для предотвращения зависания браузера. Используйте быстрый формат .csv';
    } else {
      btn.disabled = false;
      btn.classList.remove('btn-plan-disabled');
      btn.title = 'Скачать смены в формате .xlsx';
    }
  });

  // Кнопки скачивания CSV
  const csvButtons = [
    document.getElementById('btnModalDownloadBackupCsv'),
    document.getElementById('btnDropdownDownloadBackupCsv')
  ];
  csvButtons.forEach(btn => {
    if (!btn) return;
    if (!isUser) {
      btn.disabled = true;
      btn.classList.add('btn-plan-disabled');
      btn.title = 'Доступно только для ваших внесённых смен';
    } else {
      btn.disabled = false;
      btn.classList.remove('btn-plan-disabled');
      btn.title = 'Скачать смены в формате .csv (UTF-8 BOM)';
    }
  });

  // Базовые обертки для совместимости с тест-сьютом
  const btnModal = document.getElementById('btnModalDownloadBackup');
  const btnDropdown = document.getElementById('btnDropdownDownloadBackup');
  [btnModal, btnDropdown].forEach(btn => {
    if (!btn) return;
    if (isUser) {
      btn.disabled = false;
      btn.classList.remove('btn-plan-disabled');
      btn.title = 'Экспорт внесённых смен (.xlsx / .csv)';
    } else {
      btn.disabled = true;
      btn.classList.add('btn-plan-disabled');
      btn.title = 'Доступно только для ваших внесённых смен';
    }
  });
}

function getBackupTableRows() {
  const headers = [
    'Дата*',
    'Время (начало)*',
    'Время (конец)*',
    'Стоимость заказа*',
    'Транспорт*',
    'Кол-во заказов',
    'Тип слота',
    'Номер слота',
    'Расстояние (км)',
    'Вес (кг)',
    'Ожидание (руб)',
    'Ожидание (мин)',
    'Доплата (спрос; %)',
    'Доплата (рейтинг; %)',
    'Бонус (руб)',
    'Чаевые (руб)',
    'Цель (тотал; руб)',
    'Корректировки (руб)',
    'Причина корректировки',
    'Расход (руб)'
  ];

  const dataRows = (state.activeOrders || []).map(o => [
    o.date || '',
    o.startSecs !== null && o.startSecs !== undefined ? formatSecsHHMM(o.startSecs) : '',
    o.endSecs !== null && o.endSecs !== undefined ? formatSecsHHMM(o.endSecs) : '',
    Math.round(Number(o.orderCost || o.baseCost || 0)),
    o.transportLabel || 'Велосипед',
    Number(o.ordersCount || 1),
    o.slotType || (o.isPlannedSlot ? 'Плановый' : 'Свободный'),
    Number(o.slotNumber || 1),
    Number(o.distance || 0),
    Number(o.weight || 0),
    Math.round(Number(o.waitRub || o.waitTimeCost || 0)),
    Math.round(Number(o.waitMin || o.waitTimeMinutes || 0)),
    o.surgePct ? (String(o.surgePct).includes('%') ? String(o.surgePct) : `${o.surgePct}%`) : '0%',
    o.ratingPct ? (String(o.ratingPct).includes('%') ? String(o.ratingPct) : `${o.ratingPct}%`) : '0%',
    Math.round(Number(o.bonus || 0)),
    Math.round(Number(o.tip || 0)),
    Math.round(Number(o.goalBonus || o.goalTotal || 0)),
    Math.round(Number(o.adjustment || 0)),
    o.adjustmentReason || '',
    Math.round(Number(o.expense || 0))
  ]);

  return [headers, ...dataRows];
}

function downloadBackupXlsx() {
  if (!state.usingUserData || !state.activeOrders || state.activeOrders.length === 0) {
    showToast('Резервная копия доступна только для ваших внесённых смен');
    return;
  }
  if (state.activeOrders.length > 10000) {
    showToast('Объём превышает 10 000 смен. Скачивание .xlsx отключено для предотвращения зависания браузера. Используйте .csv');
    return;
  }
  try {
    const rows = getBackupTableRows();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 15 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
      { wch: 16 }, { wch: 16 }, { wch: 20 }, { wch: 22 }, { wch: 14 },
      { wch: 14 }, { wch: 18 }, { wch: 20 }, { wch: 40 }, { wch: 14 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Смены_курьера');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `courier_backup_${dateStr}.xlsx`);
    showToast(`Таблица .xlsx успешно скачана (${state.activeOrders.length} смен) 🎉`);
  } catch (err) {
    showToast('Ошибка при скачивании .xlsx: ' + err.message);
  }
}

function downloadBackupCsv() {
  if (!state.usingUserData || !state.activeOrders || state.activeOrders.length === 0) {
    showToast('Резервная копия доступна только для ваших внесённых смен');
    return;
  }
  try {
    const rows = getBackupTableRows();
    const csvContent = '\uFEFF' + rows.map(r => r.map(cell => {
      const s = String(cell ?? '').replace(/"/g, '""');
      return `"${s}"`;
    }).join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `courier_backup_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Файл .csv успешно скачан (${state.activeOrders.length} смен) 🎉`);
  } catch (err) {
    showToast('Ошибка при скачивании .csv: ' + err.message);
  }
}

async function downloadBackupJson() {
  if (!state.usingUserData || !state.activeOrders || state.activeOrders.length === 0) {
    showToast('Резервная копия доступна только для ваших внесённых смен');
    return;
  }
  try {
    const backupData = {
      version: 'v14.12.4',
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      orders: state.activeOrders,
      settings: {
        accountTransport: state.accountTransport,
        isNet: state.isNet,
        weekStartDay: state.weekStartDay
      }
    };
    const res = await workerManager.execute('SERIALIZE', { data: backupData, pretty: true });
    const blob = new Blob([res.json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `courier_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Резервная копия скачана (${res.sizeKB} КБ)`);
  } catch (err) {
    showToast('Ошибка при формировании резервной копии: ' + err.message);
  }
}

// Автообновление онлайн/офлайн статуса браузера для Яндекс.Диска
window.addEventListener('online', () => {
  if (state.yandexToken) {
    setYandexSyncStatus(state.yandexLastSyncedAt ? 'synced' : 'connected');
    if (state.syncMode === 'yandex') checkCloudSync();
  }
});
window.addEventListener('offline', () => {
  if (state.yandexToken) {
    setYandexSyncStatus('offline');
  }
});

// -----------------------------------------------------------------------------
// YANDEX DISK REST API
// -----------------------------------------------------------------------------

// =============================================================================
// УДАЛЕНИЕ ФАЙЛА С ЯНДЕКС.ДИСКА (v14.7.1)
// =============================================================================
async function deleteFromYandexDisk() {
  if (!state.yandexToken) return false;
  try {
    const deleteUrl = `${YANDEX_DISK_API_BASE}?path=${encodeURIComponent(YANDEX_APP_FILE_PATH)}&permanently=true`;
    const res = await yandexDiskApiFetch(deleteUrl, { method: 'DELETE' });
    return res.ok || res.status === 404 || res.status === 204;
  } catch (err) {
    console.warn('Ошибка удаления файла с Яндекс.Диска:', err);
    return false;
  }
}

// =============================================================================
// СОХРАНЕНИЕ И ВОССТАНОВЛЕНИЕ НАСТРОЕК (v14.7.1, v14.12.0)
// =============================================================================
function collectAppSettings() {
  return {
    isNet: !!state.isNet,
    isHourly: !!state.isHourly,
    viewMode: state.viewMode || 'chart',
    period: state.period || 'days',
    selectedBarIndex: typeof state.selectedBarIndex === 'number' ? state.selectedBarIndex : 0,
    showBenchmarks: !!state.showBenchmarks,
    blocks2and3Expanded: !!state.blocks2and3Expanded,
    weatherBoost: !!state.weatherBoost,
    heatUnitRub: !!state.heatUnitRub,
    season: state.season || 'auto',
    districtId: state.districtId || 'center_south',
    compareMode: state.compareMode || 'transport',
    selectedPreset: state.selectedPreset || state.accountTransport || 'ebike',
    accountTransport: state.accountTransport || state.selectedPreset || 'ebike',
    includeGoals: !!state.includeGoals,
    weekStartDay: typeof state.weekStartDay === 'number' ? state.weekStartDay : 0,
    tableColumns: (state.tableColumns || []).map(col => ({ key: col.key, enabled: !!col.enabled })),
    tableFilters: state.tableFilters ? (typeof structuredClone === 'function' ? structuredClone(state.tableFilters) : JSON.parse(JSON.stringify(state.tableFilters))) : {},
    expensesByTransport: state.expensesByTransport ? (typeof structuredClone === 'function' ? structuredClone(state.expensesByTransport) : JSON.parse(JSON.stringify(state.expensesByTransport))) : null,
    lightMode: !!state.lightMode,
    layoutMode: state.layoutMode || 'phone',
    uiStyle: currentUiStyle || (window.Theme && Theme.skin ? Theme.skin().id : 'default'),
    uiFx: window.Theme && typeof Theme.fx === 'function' ? Theme.fx() : true
  };
}

function applyAppSettings(s, options = {}) {
  if (!s || typeof s !== 'object') return;

  if (s.uiStyle && typeof s.uiStyle === 'string') {
    if (typeof selectUiStyle === 'function') {
      selectUiStyle(s.uiStyle, true);
    }
  }
  if (typeof s.uiFx === 'boolean' && window.Theme && typeof Theme.setFx === 'function') {
    Theme.setFx(s.uiFx);
  }

  if (typeof s.lightMode === 'boolean') {
    applyColorMode(s.lightMode, false);
  }
  if (s.layoutMode === 'phone' || s.layoutMode === 'pc') {
    applyLayoutMode(s.layoutMode, false);
  }

  if (typeof s.isNet === 'boolean') state.isNet = s.isNet;
  if (typeof s.isHourly === 'boolean') state.isHourly = s.isHourly;
  if (s.viewMode === 'chart' || s.viewMode === 'table') state.viewMode = s.viewMode;
  if (s.period) state.period = s.period;
  if (typeof s.selectedBarIndex === 'number') state.selectedBarIndex = s.selectedBarIndex;
  if (typeof s.showBenchmarks === 'boolean') state.showBenchmarks = s.showBenchmarks;

  if (typeof s.weatherBoost === 'boolean') state.weatherBoost = s.weatherBoost;
  if (typeof s.heatUnitRub === 'boolean') state.heatUnitRub = s.heatUnitRub;
  if (s.season) state.season = s.season;
  if (s.districtId) state.districtId = s.districtId;
  if (s.compareMode) state.compareMode = s.compareMode;
  if (typeof s.blocks2and3Expanded === 'boolean') {
    setBlocks2and3Expanded(s.blocks2and3Expanded);
  }

  if (s.selectedPreset) {
    state.selectedPreset = s.selectedPreset;
    state.accountTransport = s.selectedPreset;
  } else if (s.accountTransport) {
    state.selectedPreset = s.accountTransport;
    state.accountTransport = s.accountTransport;
  }
  if (typeof s.includeGoals === 'boolean') state.includeGoals = s.includeGoals;
  if (typeof s.weekStartDay === 'number') state.weekStartDay = s.weekStartDay;

  // Восстановление порядка и видимости столбцов таблицы (v14.7.1)
  if (Array.isArray(s.tableColumns) && state.tableColumns && state.tableColumns.length > 0) {
    const existingColMap = new Map(state.tableColumns.map(c => [c.key, c]));
    const reordered = [];
    s.tableColumns.forEach(sc => {
      if (sc && sc.key && existingColMap.has(sc.key)) {
        const col = existingColMap.get(sc.key);
        col.enabled = !!sc.enabled;
        reordered.push(col);
        existingColMap.delete(sc.key);
      }
    });
    existingColMap.forEach(col => {
      reordered.push(col);
    });
    state.tableColumns = reordered;
    if (typeof renderReorderableColumnsList === 'function') {
      renderReorderableColumnsList();
    }
    if (state.viewMode === 'table' && !options.silent && typeof renderBlock1 === 'function') {
      renderBlock1();
    }
  }

  // Восстановление фильтров таблицы (v14.12.0)
  if (s.tableFilters && typeof s.tableFilters === 'object') {
    state.tableFilters = typeof structuredClone === 'function' ? structuredClone(s.tableFilters) : JSON.parse(JSON.stringify(s.tableFilters));
  }

  if (s.expensesByTransport && typeof s.expensesByTransport === 'object') {
    state.expensesByTransport = typeof structuredClone === 'function' ? structuredClone(s.expensesByTransport) : JSON.parse(JSON.stringify(s.expensesByTransport));
  }

  if (!options.silent) {
    syncUIWithState();
  }
}

let settingsCloudSyncTimer = null;
function triggerSettingsCloudSync() {
  if (state.syncMode !== 'yandex' || !state.yandexToken || typeof uploadToYandexDisk !== 'function') return;
  if (settingsCloudSyncTimer) clearTimeout(settingsCloudSyncTimer);
  settingsCloudSyncTimer = setTimeout(() => {
    settingsCloudSyncTimer = null;
    uploadToYandexDisk(state.activeOrders, { isSettingsOnly: true }).catch(err => {
      console.warn('Автоматическая синхронизация настроек в Яндекс.Диск:', err);
    });
  }, 1200);
}

let saveAppSettingsDebounceTimer = null;
function saveAppSettingsDebounced(ms = 300) {
  if (saveAppSettingsDebounceTimer) clearTimeout(saveAppSettingsDebounceTimer);
  saveAppSettingsDebounceTimer = setTimeout(() => {
    saveAppSettingsDebounceTimer = null;
    saveAppSettings();
  }, ms);
}

let lastSavedSettingsJson = null;

function saveAppSettings() {
  const settings = collectAppSettings();
  const settingsJson = JSON.stringify(settings);
  if (lastSavedSettingsJson === settingsJson) {
    return;
  }
  lastSavedSettingsJson = settingsJson;

  const nowIso = new Date().toISOString();
  if (!state.syncTimestamps) {
    state.syncTimestamps = { orders: null, settings: null };
  }
  state.syncTimestamps.settings = nowIso;

  try {
    localStorage.setItem('courier_app_settings', settingsJson);
    localStorage.setItem('courier_sync_time_settings', nowIso);
    if (window.courierDB && window.courierDB.sync_state) {
      window.courierDB.sync_state.put({ key: 'appSettings', value: settings }).catch(() => {});
      window.courierDB.sync_state.put({ key: 'syncTimestamps', value: state.syncTimestamps }).catch(() => {});
    }
  } catch (e) {}

  if (typeof updateSyncUI === 'function') {
    updateSyncUI();
  }
  triggerSettingsCloudSync();
}

function syncUIWithState() {
  if (dom.lblGross && dom.lblNet) {
    dom.lblGross.classList.toggle('ya-switch-opt-active', !state.isNet);
    dom.lblNet.classList.toggle('ya-switch-opt-active', state.isNet);
    if (dom.switchGrossNet) dom.switchGrossNet.setAttribute('aria-checked', state.isNet ? 'true' : 'false');
  }
  if (dom.lblSum && dom.lblHourly) {
    dom.lblSum.classList.toggle('ya-switch-opt-active', !state.isHourly);
    dom.lblHourly.classList.toggle('ya-switch-opt-active', state.isHourly);
    if (dom.switchSumHourly) dom.switchSumHourly.setAttribute('aria-checked', state.isHourly ? 'true' : 'false');
  }
  if (dom.lblChart && dom.lblTable) {
    dom.lblChart.classList.toggle('ya-switch-opt-active', state.viewMode === 'chart');
    dom.lblTable.classList.toggle('ya-switch-opt-active', state.viewMode === 'table');
    if (dom.switchChartTable) dom.switchChartTable.setAttribute('aria-checked', state.viewMode === 'table' ? 'true' : 'false');
  }

  ['days', 'weeks', 'months'].forEach(periodKey => {
    const btn = $(`btnPeriod-${periodKey}`);
    if (btn) btn.classList.toggle('ya-seg-btn-active', periodKey === state.period);
  });

  const btnWeather = $('btnWeatherBoost');
  if (btnWeather) {
    btnWeather.classList.toggle('btn-weather-active', isDemoMode() && state.weatherBoost);
  }
  ['transport', 'slot', 'total'].forEach(m => {
    const btn = $(`btnComp-${m}`);
    if (btn) btn.classList.toggle('ya-seg-btn-active', m === state.compareMode);
  });
  if (typeof updateBenchmarksButton === 'function') updateBenchmarksButton();
  if (typeof updateWeekStartDayUI === 'function') updateWeekStartDayUI();
  setBlocks2and3Expanded(state.blocks2and3Expanded);
}

async function yandexDiskApiFetch(url, options = {}) {
  const token = state.yandexToken;
  if (!token) throw new Error('Отсутствует токен Яндекс ID');
  const headers = {
    'Authorization': `OAuth ${token}`,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

async function uploadToYandexDisk(orders, options = {}) {
  if (!state.yandexToken) return false;
  setYandexSyncStatus('syncing');

  try {
    const isSettingsOnly = !!options.isSettingsOnly;
    const isOrdersOnly = !!options.isOrdersOnly;
    // 152-ФЗ: автоматическое обезличивание перед отправкой в облако
    const sanitizedRes = await workerManager.execute('SANITIZE', { orders });
    const cleanOrders = sanitizedRes.sanitizedOrders || [];

    const payloadObj = {
      version: 'v14.12.4',
      exportedAt: new Date().toISOString(),
      schemaVersion: 1,
      orders: cleanOrders,
      settings: collectAppSettings(),
      syncTimestamps: state.syncTimestamps || { orders: null, settings: null }
    };

    const serializeRes = await workerManager.execute('SERIALIZE', { data: payloadObj });
    const jsonBody = serializeRes.json;

    // Шаг 1: Запрос URL для загрузки (с overwrite=true)
    const uploadUrlEndpoint = `${YANDEX_DISK_API_BASE}/upload?path=${encodeURIComponent(YANDEX_APP_FILE_PATH)}&overwrite=true`;
    const resUrl = await yandexDiskApiFetch(uploadUrlEndpoint);
    if (!resUrl.ok) {
      if (resUrl.status === 401) {
        setYandexSyncStatus('expired');
        showToast('Сессия Яндекс ID истекла, переподключите аккаунт');
        return false;
      }
      if (resUrl.status === 403) {
        setYandexSyncStatus('forbidden');
        showToast('Нет доступа к папке приложения на Яндекс.Диске');
        return false;
      }
      throw new Error(`Ошибка получения URL загрузки: HTTP ${resUrl.status}`);
    }
    const { href } = await resUrl.json();

    // Шаг 2: PUT содержимого файла
    const putRes = await fetch(href, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: jsonBody
    });

    if (!putRes.ok && putRes.status !== 201 && putRes.status !== 200) {
      throw new Error(`Ошибка загрузки данных на Диск: HTTP ${putRes.status}`);
    }

    const now = formatSyncTimestamp(new Date());
    const nowIso = new Date().toISOString();
    state.yandexLastSyncedAt = now;
    if (!state.syncTimestamps) {
      state.syncTimestamps = { orders: null, settings: null };
    }
    if (!isSettingsOnly) {
      state.syncTimestamps.orders = nowIso;
    }
    if (!isOrdersOnly) {
      state.syncTimestamps.settings = nowIso;
    }

    try {
      localStorage.setItem('ya_disk_last_synced', now);
      if (!isSettingsOnly) {
        localStorage.setItem('courier_sync_time_orders', nowIso);
      }
      if (!isOrdersOnly) {
        localStorage.setItem('courier_sync_time_settings', nowIso);
      }
      if (courierDB && courierDB.sync_state) {
        courierDB.sync_state.put({ key: 'yandexLastSyncedAt', value: now }).catch(() => {});
        courierDB.sync_state.put({ key: 'syncTimestamps', value: state.syncTimestamps }).catch(() => {});
      }
    } catch (e) {}
    setYandexSyncStatus('synced', now);
    if (typeof updateSyncUI === 'function') updateSyncUI();
    if (!isSettingsOnly) {
      showToast(`Синхронизировано с Яндекс.Диском (${serializeRes.sizeKB} КБ)`);
    }
    return true;
  } catch (err) {
    console.warn('Ошибка uploadToYandexDisk:', err);
    if (!navigator.onLine) {
      setYandexSyncStatus('offline');
    } else {
      setYandexSyncStatus(state.yandexLastSyncedAt ? 'synced' : 'connected');
    }
    return false;
  }
}

async function downloadFromYandexDisk() {
  if (!state.yandexToken) return null;
  setYandexSyncStatus('syncing');

  try {
    // Шаг 1: Запрос URL скачивания
    const downloadUrlEndpoint = `${YANDEX_DISK_API_BASE}/download?path=${encodeURIComponent(YANDEX_APP_FILE_PATH)}`;
    const resUrl = await yandexDiskApiFetch(downloadUrlEndpoint);
    if (resUrl.status === 404) {
      setYandexSyncStatus('connected');
      return null;
    }
    if (!resUrl.ok) {
      throw new Error(`Ошибка получения URL скачивания: HTTP ${resUrl.status}`);
    }
    const { href } = await resUrl.json();

    // Шаг 2: GET содержимого файла
    const resContent = await fetch(href);
    if (!resContent.ok) throw new Error(`Ошибка загрузки содержимого: HTTP ${resContent.status}`);
    const jsonText = await resContent.text();

    // Парсинг и валидация через Web Worker
    const parseRes = await workerManager.execute('PARSE_AND_VALIDATE', { jsonText });
    if (!parseRes.valid) {
      throw new Error(parseRes.errors?.[0] || 'Невалидный файл из облака');
    }

    const now = formatSyncTimestamp(new Date());
    state.yandexLastSyncedAt = now;
    if (parseRes.data && parseRes.data.syncTimestamps) {
      state.syncTimestamps = parseRes.data.syncTimestamps;
      if (state.syncTimestamps.orders) {
        localStorage.setItem('courier_sync_time_orders', state.syncTimestamps.orders);
      }
      if (state.syncTimestamps.settings) {
        localStorage.setItem('courier_sync_time_settings', state.syncTimestamps.settings);
      }
      if (courierDB && courierDB.sync_state) {
        courierDB.sync_state.put({ key: 'syncTimestamps', value: state.syncTimestamps }).catch(() => {});
      }
    }
    try {
      localStorage.setItem('ya_disk_last_synced', now);
      if (courierDB && courierDB.sync_state) {
        courierDB.sync_state.put({ key: 'yandexLastSyncedAt', value: now }).catch(() => {});
      }
    } catch (e) {}
    setYandexSyncStatus('synced', now);
    return parseRes;
  } catch (err) {
    console.warn('Ошибка downloadFromYandexDisk:', err);
    if (!navigator.onLine) {
      setYandexSyncStatus('offline');
    } else {
      setYandexSyncStatus(state.yandexLastSyncedAt ? 'synced' : 'connected');
    }
    return null;
  }
}

async function checkCloudSync() {
  if (state.syncMode !== 'yandex' || !state.yandexToken) return;

  try {
    const metaUrl = `${YANDEX_DISK_API_BASE}?path=${encodeURIComponent(YANDEX_APP_FILE_PATH)}`;
    const metaRes = await yandexDiskApiFetch(metaUrl);

    if (metaRes.status === 404) {
      if (state.usingUserData && state.activeOrders.length > 0) {
        await uploadToYandexDisk(state.activeOrders);
      } else {
        setYandexSyncStatus('connected');
      }
      return;
    }

    if (!metaRes.ok) {
      if (metaRes.status === 401) {
        setYandexSyncStatus('expired');
      } else if (metaRes.status === 403) {
        setYandexSyncStatus('forbidden');
      } else if (!navigator.onLine) {
        setYandexSyncStatus('offline');
      } else {
        setYandexSyncStatus(state.yandexLastSyncedAt ? 'synced' : 'connected');
      }
      return;
    }

    const meta = await metaRes.json();
    const cloudParseRes = await downloadFromYandexDisk();
    if (!cloudParseRes || !cloudParseRes.data) return;

    const cloudOrders = Array.isArray(cloudParseRes.data) ? cloudParseRes.data : (cloudParseRes.data.orders || []);
    const localOrders = state.usingUserData ? state.activeOrders : [];

    if (localOrders.length === 0 && cloudOrders.length > 0) {
      applyLoadedDataset(cloudOrders, 'Яндекс.Диск', true, null, { skipCloudUpload: true, preserveTimestamp: true });
      await saveOrdersToIndexedDB(cloudOrders, { preserveTimestamp: true });
      showToast(`Загружены данные из Яндекс.Диска (${cloudOrders.length} смен)`);
      return;
    }

    const localDates = localOrders.map(o => o.date).filter(Boolean).sort();
    const cloudDates = cloudOrders.map(o => o.date).filter(Boolean).sort();
    const localLatest = localDates[localDates.length - 1] || '—';
    const cloudLatest = cloudDates[cloudDates.length - 1] || '—';

    const isDifferent = (localOrders.length !== cloudOrders.length) || (localLatest !== cloudLatest);

    if (isDifferent && localOrders.length > 0 && cloudOrders.length > 0) {
      pendingConflictCloudData = cloudOrders;

      const localStr = JSON.stringify(localOrders);
      const localKB = Math.round((localStr.length / 1024) * 10) / 10;
      const cloudKB = Math.round(((meta.size || JSON.stringify(cloudOrders).length) / 1024) * 10) / 10;

      const elLocalLatest = document.getElementById('conflictLocalLatestDate');
      const elLocalSavedAt = document.getElementById('conflictLocalSavedAt');
      const elLocalCount = document.getElementById('conflictLocalCount');
      const elLocalSize = document.getElementById('conflictLocalSize');

      const elCloudLatest = document.getElementById('conflictCloudLatestDate');
      const elCloudSavedAt = document.getElementById('conflictCloudSavedAt');
      const elCloudCount = document.getElementById('conflictCloudCount');
      const elCloudSize = document.getElementById('conflictCloudSize');

      if (elLocalLatest) elLocalLatest.textContent = localLatest;
      if (elLocalSavedAt) elLocalSavedAt.textContent = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      if (elLocalCount) elLocalCount.textContent = `${localOrders.length} смен`;
      if (elLocalSize) elLocalSize.textContent = `${localKB} КБ`;

      if (elCloudLatest) elCloudLatest.textContent = cloudLatest;
      if (elCloudSavedAt) {
        const d = meta.modified ? new Date(meta.modified) : new Date();
        elCloudSavedAt.textContent = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      }
      if (elCloudCount) elCloudCount.textContent = `${cloudOrders.length} смен`;
      if (elCloudSize) elCloudSize.textContent = `${cloudKB} КБ`;

      openConflictModal();
    } else {
      setYandexSyncStatus('synced');
    }
  } catch (err) {
    console.warn('Ошибка checkCloudSync:', err);
    if (!navigator.onLine) {
      setYandexSyncStatus('offline');
    } else {
      setYandexSyncStatus(state.yandexLastSyncedAt ? 'synced' : 'connected');
    }
  }
}

async function resolveConflictKeepLocal() {
  closeConflictModal();
  if (state.activeOrders.length > 0) {
    await uploadToYandexDisk(state.activeOrders);
    showToast('Локальные данные сохранены на Яндекс.Диск');
  }
}

async function resolveConflictUseCloud() {
  if (pendingConflictCloudData && pendingConflictCloudData.length > 0) {
    const cloudOrders = pendingConflictCloudData;
    closeConflictModal();
    applyLoadedDataset(cloudOrders, 'Яндекс.Диск', true, null, { skipCloudUpload: true, preserveTimestamp: true });
    await saveOrdersToIndexedDB(cloudOrders, { preserveTimestamp: true });
    showToast('Данные из Яндекс.Диска успешно применены');
  } else {
    closeConflictModal();
  }
}

// -----------------------------------------------------------------------------
// ИНИЦИАЛИЗАЦИЯ И БУТСТРАП ДАННЫХ
// -----------------------------------------------------------------------------
async function initAppBootstrap() {
  workerManager.init();
  initCourierDB();

  try {
    const savedMode = localStorage.getItem('courier_sync_mode');
    if (savedMode) state.syncMode = savedMode;
    const savedToken = localStorage.getItem('ya_disk_token');
    if (savedToken) state.yandexToken = savedToken;
    const savedSynced = localStorage.getItem('ya_disk_last_synced');
    if (savedSynced) state.yandexLastSyncedAt = normalizeSyncTimestamp(savedSynced);
    const savedOrdersSync = localStorage.getItem('courier_sync_time_orders');
    const savedSettingsSync = localStorage.getItem('courier_sync_time_settings');
    state.syncTimestamps = {
      orders: savedOrdersSync || null,
      settings: savedSettingsSync || null
    };
  } catch (e) {}

  // Загрузка сохранённых настроек пользователя (v14.7.1, v14.12.0)
  try {
    let savedSettings = null;
    if (courierDB && courierDB.sync_state) {
      const rec = await courierDB.sync_state.get('appSettings');
      if (rec && rec.value) savedSettings = rec.value;
      const syncRec = await courierDB.sync_state.get('yandexLastSyncedAt');
      if (syncRec && syncRec.value && !state.yandexLastSyncedAt) {
        state.yandexLastSyncedAt = normalizeSyncTimestamp(syncRec.value);
      }
      const timeRec = await courierDB.sync_state.get('syncTimestamps');
      if (timeRec && timeRec.value) {
        state.syncTimestamps = {
          orders: state.syncTimestamps.orders || timeRec.value.orders || null,
          settings: state.syncTimestamps.settings || timeRec.value.settings || null
        };
      }
    }
    if (!savedSettings) {
      const raw = localStorage.getItem('courier_app_settings');
      if (raw) savedSettings = JSON.parse(raw);
    }
    if (savedSettings) {
      applyAppSettings(savedSettings, { silent: true });
    }
  } catch (err) {
    console.warn('Ошибка загрузки настроек в bootstrap:', err);
  }

  checkYandexOAuthHash();

  // 1. Проверяем локальные сохранённые заказы в IndexedDB
  let localOrders = [];
  if (courierDB && courierDB.orders && state.syncMode !== 'session') {
    try {
      const cnt = await courierDB.orders.count();
      if (cnt > 0) {
        localOrders = await courierDB.orders.toArray();
      }
    } catch (err) {
      console.warn('Ошибка чтения из IndexedDB:', err);
    }
  }

  // 2. Если активен режим Яндекс.Диска
  if (state.syncMode === 'yandex' && state.yandexToken) {
    setYandexSyncStatus('connected');

    if (localOrders && localOrders.length > 0) {
      // Есть локальные данные: мгновенно отображаем их для максимальной отзывчивости интерфейса
      console.log(`Восстановление ${localOrders.length} смен из локальной БД (режим Яндекс)...`);
      applyLoadedDataset(localOrders, 'Яндекс.Диск', true, null, { skipCloudUpload: true, skipDbSave: true });
      updateBackupButtonsState();
      updateSyncUI();
      // Асинхронно сверяем с облаком и проверяем конфликты
      await checkCloudSync();
      return;
    } else {
      // Локальная база пуста: пробуем подгрузить файл из Яндекс.Диска
      try {
        const cloudParseRes = await downloadFromYandexDisk();
        if (cloudParseRes && cloudParseRes.data) {
          const cloudOrders = Array.isArray(cloudParseRes.data) ? cloudParseRes.data : (cloudParseRes.data.orders || []);
          if (cloudOrders.length > 0) {
            console.log(`Загрузка ${cloudOrders.length} смен напрямую из Яндекс.Диска...`);
            applyLoadedDataset(cloudOrders, 'Яндекс.Диск', true, null, { skipCloudUpload: true, skipDbSave: false, preserveTimestamp: true });
            await saveOrdersToIndexedDB(cloudOrders, { preserveTimestamp: true });
            showToast(`Загружены данные из Яндекс.Диска (${cloudOrders.length} смен)`);
            updateBackupButtonsState();
            updateSyncUI();
            return;
          }
        }
      } catch (cloudErr) {
        console.warn('Ошибка первичной загрузки из облака:', cloudErr);
      }
    }
  }

  // 3. Если режим IndexedDB (или дефолтный) и в базе есть сохранённые смены
  if (state.syncMode !== 'session' && localOrders && localOrders.length > 0) {
    console.log(`Восстановление ${localOrders.length} смен из IndexedDB...`);
    applyLoadedDataset(localOrders, 'IndexedDB', true, null, { skipCloudUpload: true, skipDbSave: true });
    updateBackupButtonsState();
    updateSyncUI();
    return;
  }

  // 4. Если пользовательских данных нет ни в IndexedDB, ни в Яндекс.Диске — загружаем эталонное демо
  await loadDemoDataset();
  updateBackupButtonsState();
  updateSyncUI();
  if (state.syncMode === 'yandex' && state.yandexToken) {
    checkCloudSync();
  }
}

window.toggleSaveDropdown = toggleSaveDropdown;
window.closeSaveDropdown = closeSaveDropdown;
window.selectSaveOption = selectSyncMode;
window.selectSyncMode = selectSyncMode;
window.openSyncModal = openSyncModal;
window.closeSyncModal = closeSyncModal;
window.resetToDemoDataModal = resetToDemoDataModal;
window.openConflictModal = openConflictModal;
window.closeConflictModal = closeConflictModal;
window.resolveConflictKeepLocal = resolveConflictKeepLocal;
window.resolveConflictUseCloud = resolveConflictUseCloud;
window.connectYandexDisk = connectYandexDisk;
window.disconnectYandexDisk = disconnectYandexDisk;
window.downloadBackupJson = downloadBackupJson;
window.downloadBackupXlsx = downloadBackupXlsx;
window.downloadBackupCsv = downloadBackupCsv;
window.updateBackupButtonsState = updateBackupButtonsState;
window.deleteFromYandexDisk = deleteFromYandexDisk;
window.collectAppSettings = collectAppSettings;
window.applyAppSettings = applyAppSettings;
window.saveAppSettings = saveAppSettings;
window.syncUIWithState = syncUIWithState;
window.openResetConfirmModal = openResetConfirmModal;
window.closeResetConfirmModal = closeResetConfirmModal;
window.confirmResetToDemo = confirmResetToDemo;
window.openConfirmActionModal = openConfirmActionModal;
window.closeConfirmActionModal = closeConfirmActionModal;
window.confirmActionSubmit = confirmActionSubmit;
window.formatSyncTimestamp = formatSyncTimestamp;
window.normalizeSyncTimestamp = normalizeSyncTimestamp;
window.selectUiStyle = selectUiStyle;
window.refreshDataStatusBadge = refreshDataStatusBadge;
window.initAppBootstrap = initAppBootstrap;
window.workerManager = workerManager;
window.AnalyticsWorkerManager = AnalyticsWorkerManager;

window.getDayDistanceKm = getDayDistanceKm;
window.getTargetWeekForIncomeCard = getTargetWeekForIncomeCard;
window.renderIncomeCardHtml = renderIncomeCardHtml;
window.openExportCardModal = openExportCardModal;
window.closeExportCardModal = closeExportCardModal;
window.downloadExportCardPNG = downloadExportCardPNG;
window.copyExportCardTelegramText = copyExportCardTelegramText;
window.setPeriod = setPeriod;

window.openTableColumnFilter = openTableColumnFilter;
window.closeTableFilterPopover = closeTableFilterPopover;
window.applyCurrentColumnFilter = applyCurrentColumnFilter;
window.resetCurrentColumnFilter = resetCurrentColumnFilter;
window.resetAllTableFilters = resetAllTableFilters;
window.toggleTableFilterMenu = toggleTableFilterMenu;
window.handleTableFilterSearch = handleTableFilterSearch;
window.setAllTableFilterCheckboxes = setAllTableFilterCheckboxes;
window.clearTableFilterRangeInputs = clearTableFilterRangeInputs;
window.formatSyncDateTimeHtml = formatSyncDateTimeHtml;
window.getFilteredTableData = getFilteredTableData;


// =============================================================================
// СПРАВОЧНИК И ПОДСКАЗКИ ПО КОЛОНКАМ РУЧНОГО ВВОДА (v14.9.1)
// =============================================================================

const MANUAL_COLUMNS_INFO = {
  date: {
    title: 'Дата смены *',
    required: true,
    desc: 'Календарная дата выхода на смену или осуществления доставки заказов.',
    format: 'ДД.ММ.ГГГГ (например, 17.11.2026)',
    example: '17.11.2026',
    rules: 'Обязательное поле. При добавлении смены автоматически подставляется сегодняшняя дата. Поддерживаются разделители точка, дефис или слэш.'
  },
  start: {
    title: 'Время (старт) *',
    required: true,
    desc: 'Время выхода на линию, открытия планового слота или первого взятого заказа.',
    format: 'ЧЧ:ММ в 24-часовом формате',
    example: '10:00',
    rules: 'Обязательное поле. Значения часов от 00 до 23, минут от 00 до 59.'
  },
  end: {
    title: 'Время (конец) *',
    required: true,
    desc: 'Время завершения смены, закрытия слота или сдачи последнего заказа.',
    format: 'ЧЧ:ММ в 24-часовом формате',
    example: '18:00',
    rules: 'Обязательное поле. При ночных сменах с переходом через полночь (например, 22:00 – 02:00) часы смены рассчитываются автоматически.'
  },
  cost: {
    title: 'Стоимость (₽) *',
    required: true,
    desc: 'Суммарный доход за смену или базовые начисления за заказы до вычета расходов и налога.',
    format: 'Неотрицательное число (≥ 0 ₽)',
    example: '3500',
    rules: 'Обязательное поле. Является базой для расчёта почасового дохода и налога самозанятого (НПД 6%).'
  },
  transport: {
    title: 'Транспорт *',
    required: true,
    desc: 'Способ передвижения, на котором курьер выполнял доставку.',
    format: 'Пеший, Велосипед, Электровелосипед, Авто',
    example: 'Велосипед',
    rules: 'Обязательное поле. Используется для фильтрации смен, расчёта средней скорости (км/ч) и расхода калорий/топлива.'
  },
  ordersCnt: {
    title: 'Количество заказов',
    required: false,
    desc: 'Число успешно доставленных заказов за смену.',
    format: 'Целое число ≥ 0 (по умолчанию: 1)',
    example: '14',
    rules: 'Опциональное поле. Если оставить пустым, по умолчанию принимается за 1 заказ для расчёта средних показателей.'
  },
  slotType: {
    title: 'Тип слота',
    required: false,
    desc: 'Формат выхода курьера на доставку.',
    format: 'Плановый или Свободный',
    example: 'Плановый',
    rules: 'Опциональное поле. «Плановый» даёт минимальную почасовую гарантию оплаты, «Свободный» оплачивается строго по факту заказов.'
  },
  slotNumber: {
    title: '№ слота',
    required: false,
    desc: 'Порядковый номер выхода курьера в течение одного дня.',
    format: 'Целое число ≥ 1 (по умолчанию: 1)',
    example: '1',
    rules: 'Опциональное поле. Используется, если в один календарный день курьер выходил на несколько раздельных слотов.'
  },
  dist: {
    title: 'Дистанция (км)',
    required: false,
    desc: 'Суммарный километраж по трекеру за всю смену.',
    format: 'Число ≥ 0 с шагом 0.1 км',
    example: '24.5',
    rules: 'Опциональное поле. Используется для расчёта дохода на 1 км пробега и отображается в карточке смены.'
  },
  weight: {
    title: 'Вес (кг)',
    required: false,
    desc: 'Суммарный вес доставленных клиентских посылок за смену.',
    format: 'Число ≥ 0 с шагом 0.1 кг',
    example: '18.0',
    rules: 'Опциональное поле. Позволяет отслеживать физическую нагрузку и интенсивность доставок.'
  },
  waitRub: {
    title: 'Ожидание (₽)',
    required: false,
    desc: 'Денежная доплата за вынужденное ожидание выдачи заказа в ресторане или магазине.',
    format: 'Число ≥ 0 ₽',
    example: '120',
    rules: 'Опциональное поле. Начисляется сервисом по ставке платного ожидания (3 ₽/мин после бесплатного порога).'
  },
  waitMin: {
    title: 'Ожидание (мин)',
    required: false,
    desc: 'Суммарное время ожидания готовности заказов на точках забора.',
    format: 'Целое число минут ≥ 0',
    example: '40',
    rules: 'Опциональное поле. Учитывается в аналитике эффективного времени смены.'
  },
  surgePct: {
    title: 'Спрос (%)',
    required: false,
    desc: 'Коэффициент надбавки к базовой оплате в пиковые часы, праздники или непогоду.',
    format: 'Процент от 0% до 1000%',
    example: '30%',
    rules: 'Опциональное поле. Можно вводить как число (30), так и со знаком процента (30%).'
  },
  ratingPct: {
    title: 'Рейтинг (%)',
    required: false,
    desc: 'Персональная надбавка курьера за высокий рейтинг качества, скорость и вежливость.',
    format: 'Процент от 0% до 1000%',
    example: '15%',
    rules: 'Опциональное поле. Учитывается как процентная надбавка к базовому тарифу смены.'
  },
  bonus: {
    title: 'Бонус (₽)',
    required: false,
    desc: 'Дополнительные премиальные выплаты от платформы.',
    format: 'Число ≥ 0 ₽',
    example: '250',
    rules: 'Опциональное поле. Сюда входят бонусы за работу в отдалённых зонах, доплаты за тяжелые заказы и акции сервиса.'
  },
  tips: {
    title: 'Чаевые (₽)',
    required: false,
    desc: 'Добровольные чаевые, полученные наличными или безналичным расчётом через приложение.',
    format: 'Число ≥ 0 ₽',
    example: '300',
    rules: 'Опциональное поле. Полностью достаются курьеру. Отображаются отдельной графой в сводной аналитике и карточке дохода.'
  },
  goal: {
    title: 'Цель (₽)',
    required: false,
    desc: 'Специальная премия от сервиса за выполнение регулярного плана или персонального челленджа.',
    format: 'Число ≥ 0 ₽',
    example: '500',
    rules: 'Опциональное поле. Например, за выполнение 100 заказов за неделю или 20 заказов в выходной.'
  },
  adjustment: {
    title: 'Корректировки (₽)',
    required: false,
    desc: 'Ручные перерасчёты, удержания сервиса или компенсации по тикетам поддержки.',
    format: 'Число (может быть отрицательным, например -80, или положительным)',
    example: '-80',
    rules: 'Опциональное поле. Отрицательные значения уменьшают итоговый доход, положительные — увеличивают.'
  },
  adjustmentReason: {
    title: 'Причина корректировки',
    required: false,
    desc: 'Текстовое обоснование и комментарий службы поддержки к сумме корректировки.',
    format: 'Строка текста до 500 символов',
    example: 'Штраф за опоздание на слот / Компенсация за отмену клиентом',
    rules: 'Опциональное поле. Помогает вспомнить причину расхождения в балансе при аудите выплат.'
  },
  expense: {
    title: 'Расход (₽)',
    required: false,
    desc: 'Прямые траты курьера, связанные с выполнением доставок в эту смену.',
    format: 'Число ≥ 0 ₽',
    example: '150',
    rules: 'Опциональное поле. Расходы на топливо, аренду транспорта, ремонт прокола, мойку или питание. Вычитаются при расчёте чистой прибыли.'
  }
};

function showColumnHelp(colKey) {
  const info = MANUAL_COLUMNS_INFO[colKey];
  if (!info) return;

  const modal = document.getElementById('manualColumnHelpModal');
  const titleEl = document.getElementById('colHelpTitle');
  const badgeEl = document.getElementById('colHelpBadge');
  const descEl = document.getElementById('colHelpDesc');
  const formatEl = document.getElementById('colHelpFormat');
  const exampleEl = document.getElementById('colHelpExample');
  const rulesEl = document.getElementById('colHelpRules');

  if (titleEl) titleEl.textContent = info.title;
  if (badgeEl) {
    badgeEl.innerHTML = info.required
      ? '<span class="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-extrabold text-[10px] border border-rose-500/20">Обязательное поле</span>'
      : '<span class="px-2 py-0.5 rounded-md bg-slate-500/10 text-sec font-semibold text-[10px] border border-subtle">Опциональное поле</span>';
  }
  if (descEl) descEl.textContent = info.desc;
  if (formatEl) formatEl.textContent = info.format;
  if (exampleEl) exampleEl.textContent = info.example;
  if (rulesEl) rulesEl.textContent = info.rules;

  if (modal) {
    showModalDialog(modal);
  }
}

function closeColumnHelpModal() {
  const modal = document.getElementById('manualColumnHelpModal');
  if (modal) {
    closeModalDialog(modal);
  }
}

window.showColumnHelp = showColumnHelp;
window.closeColumnHelpModal = closeColumnHelpModal;

window.openManualEditorModal = openManualEditorModal;
window.closeManualEditorModal = closeManualEditorModal;
window.addManualEditorRow = addManualEditorRow;
window.deleteManualEditorRow = deleteManualEditorRow;
window.clearManualEditorRows = clearManualEditorRows;
window.updateManualEditorRow = updateManualEditorRow;
window.filterManualEditorTable = filterManualEditorTable;
window.scrollManualEditorTableToTop = scrollManualEditorTableToTop;
window.scrollManualEditorTableToBottom = scrollManualEditorTableToBottom;
window.applyManualEditorData = applyManualEditorData;

// Запуск фонового менеджера и проверка IndexedDB / облака после полной загрузки всех модулей
initAppBootstrap();
