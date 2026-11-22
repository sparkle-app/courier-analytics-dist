/**
 * analytics.worker.js (v14.5.0)
 * Фоновый Web Worker для ресурсоёмких аналитических вычислений,
 * неблокирующей сериализации JSON и обязательного обезличивания ПДн по 152-ФЗ РФ.
 */

// 152-ФЗ РФ: Разрешённые финансово-производственные поля
const ALLOWED_ORDER_FIELDS = new Set([
  'id', 'date', 'startSecs', 'endSecs', 'durationMins', 'orderCost', 'baseCost',
  'transport', 'transportKey', 'transportLabel', 'ordersCount', 'isSlotLevel',
  'distance', 'weight', 'wait', 'waitMin', 'effectiveWaitMin',
  'surgePct', 'surgeRub', 'ratingPct', 'ratingRub', 'bonus', 'tip', 'goal',
  'adjustment', 'adjustmentReason', 'expense', 'slotType', 'slotNumber',
  'year', 'seasonKey', 'dowIdx', 'dayOfWeek', 'startStr', 'endStr'
]);

// 152-ФЗ РФ: Запрещённые клиентские персональные данные (ПДн)
const FORBIDDEN_PII_FIELDS = new Set([
  'clientName', 'customerName', 'clientPhone', 'customerPhone', 'phone',
  'clientAddress', 'deliveryAddress', 'address', 'street', 'flat', 'apartment',
  'porch', 'entrance', 'intercom', 'comment', 'orderComment', 'fio', 'recipient',
  'userPhone', 'clientFio'
]);

// Регулярные выражения для цензурирования свободного текста
const RE_PHONE = /(?:\+7|8)[\s\-]?(?:\(?\d{3}\)?[\s\-]?)\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g;
const RE_ADDRESS = /(?:кв\.?|квартир[аы]?|подъезд|домофон|эт\.?|этаж)\s*\d+/gi;
const RE_CARD = /\b(?:\d{4}[\s\-]?){4}\b/g;

/**
 * Обезличивание смен по 152-ФЗ РФ
 */
function sanitizeOrders(orders) {
  if (!Array.isArray(orders)) return { sanitizedOrders: [], strippedFieldsCount: 0, scrubbedPiiCount: 0, compliant152Fz: true };

  let strippedFieldsCount = 0;
  let scrubbedPiiCount = 0;

  const sanitizedOrders = orders.map(order => {
    if (!order || typeof order !== 'object') return order;
    const clean = {};

    for (const [key, val] of Object.entries(order)) {
      if (FORBIDDEN_PII_FIELDS.has(key)) {
        strippedFieldsCount++;
        continue;
      }
      if (!ALLOWED_ORDER_FIELDS.has(key)) {
        // Удаляем неопознанные поля во избежание скрытых ПДн
        strippedFieldsCount++;
        continue;
      }

      // Если текстовое поле, проверяем и цензурируем шаблоны телефонов, карт и адресов
      // Идемпотентная замена без stateful-проверки .test() (защита от бага lastIndex в regex с флагом /g)
      if (typeof val === 'string') {
        let scrubbed = val;
        const sPhone = scrubbed.replace(RE_PHONE, '[ТЕЛЕФОН_СКРЫТ]');
        if (sPhone !== scrubbed) {
          scrubbed = sPhone;
          scrubbedPiiCount++;
        }
        const sAddr = scrubbed.replace(RE_ADDRESS, '[АДРЕС_СКРЫТ]');
        if (sAddr !== scrubbed) {
          scrubbed = sAddr;
          scrubbedPiiCount++;
        }
        const sCard = scrubbed.replace(RE_CARD, '[КАРТА_СКРЫТА]');
        if (sCard !== scrubbed) {
          scrubbed = sCard;
          scrubbedPiiCount++;
        }
        clean[key] = scrubbed;
      } else {
        clean[key] = val;
      }
    }

    return clean;
  });

  return {
    sanitizedOrders,
    strippedFieldsCount,
    scrubbedPiiCount,
    compliant152Fz: true
  };
}

/**
 * Валидация структуры и парсинг датасета
 */
function parseAndValidate(jsonText) {
  let parsed;
  try {
    parsed = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
  } catch (err) {
    return {
      valid: false,
      errors: ['Невалидный формат JSON: ' + err.message],
      recordCount: 0,
      data: null,
      stats: null
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      valid: false,
      errors: ['Корневой элемент JSON должен быть объектом'],
      recordCount: 0,
      data: null,
      stats: null
    };
  }

  let orders = [];
  if (Array.isArray(parsed)) {
    orders = parsed;
  } else if (Array.isArray(parsed.orders)) {
    orders = parsed.orders;
  } else {
    return {
      valid: false,
      errors: ['Отсутствует массив смен (orders) в структуре данных'],
      recordCount: 0,
      data: null,
      stats: null
    };
  }

  const errors = [];
  let minDate = null;
  let maxDate = null;

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (!o || typeof o !== 'object') {
      errors.push(`Смена #${i}: не является объектом`);
      break;
    }
    const d = o.date;
    if (d && typeof d === 'string') {
      if (!minDate || d < minDate) minDate = d;
      if (!maxDate || d > maxDate) maxDate = d;
    }
  }

  const str = typeof jsonText === 'string' ? jsonText : JSON.stringify(parsed);
  const sizeKB = Math.round((str.length / 1024) * 10) / 10;

  return {
    valid: errors.length === 0,
    errors,
    recordCount: orders.length,
    data: parsed,
    stats: {
      earliestDate: minDate || '',
      latestDate: maxDate || '',
      totalShifts: orders.length,
      totalOrders: orders.reduce((sum, o) => sum + (Number(o.ordersCount) || 1), 0),
      sizeKB
    }
  };
}

/**
 * Расчёт матрицы спроса (тепловой карты) 6 временных окон на 7 дней недели
 */
function computeHeatmapMatrix(orders) {
  // 6 интервалов по 4 часа: 00-04, 04-08, 08-12, 12-16, 16-20, 20-24
  const matrix = Array.from({ length: 6 }, () =>
    Array.from({ length: 7 }, () => ({
      ordersCount: 0,
      totalGross: 0,
      hours: 0,
      avgPerHour: 0
    }))
  );

  if (!Array.isArray(orders)) return matrix;

  orders.forEach(o => {
    let dow = typeof o.dowIdx === 'number' ? o.dowIdx : -1;
    if (dow < 0 && o.date) {
      const dt = new Date(o.date);
      if (!isNaN(dt.getTime())) {
        dow = (dt.getDay() + 6) % 7; // 0=Пн .. 6=Вс
      }
    }
    if (dow < 0 || dow > 6) dow = 0;

    let hour = 12;
    if (typeof o.startSecs === 'number') {
      hour = Math.floor(o.startSecs / 3600) % 24;
    } else if (typeof o.startStr === 'string') {
      const parts = o.startStr.split(':');
      hour = parseInt(parts[0], 10) || 12;
    }

    const windowIdx = Math.min(5, Math.floor(hour / 4));
    const cell = matrix[windowIdx][dow];
    const cnt = Number(o.ordersCount) || 1;
    const gross = Number(o.orderCost || o.baseCost) || 0;
    const durHrs = (Number(o.durationMins) || 60) / 60;

    cell.ordersCount += cnt;
    cell.totalGross += gross;
    cell.hours += durHrs;
  });

  for (let w = 0; w < 6; w++) {
    for (let d = 0; d < 7; d++) {
      const c = matrix[w][d];
      c.avgPerHour = c.hours > 0 ? Math.round(c.totalGross / c.hours) : 0;
    }
  }

  return matrix;
}

/**
 * Агрегация периодов (дни, недели, месяцы) и финансовых показателей
 */
function aggregateDataset(payload) {
  const orders = payload.orders || [];
  const settings = payload.settings || {};
  const isNet = settings.isNet !== false;
  const taxRate = 0.06; // Налог НПД 6%

  const daysMap = new Map();
  let totalGross = 0;
  let totalOrders = 0;
  let totalDurationSecs = 0;

  orders.forEach(o => {
    const dStr = o.date || '1970-01-01';
    let day = daysMap.get(dStr);
    if (!day) {
      day = {
        date: dStr,
        ordersCount: 0,
        gross: 0,
        tax: 0,
        net: 0,
        tips: 0,
        bonus: 0,
        durationSecs: 0,
        distanceKm: 0,
        shiftsCount: 0,
        transportKey: o.transportKey || 'ebike'
      };
      daysMap.set(dStr, day);
    }

    const gross = Number(o.orderCost || o.baseCost) || 0;
    const tips = Number(o.tip) || 0;
    const bonus = Number(o.bonus) || 0;
    const cnt = Number(o.ordersCount) || 1;
    const dur = (Number(o.durationMins) || 0) * 60 || (Number(o.endSecs) - Number(o.startSecs)) || 3600;
    const dist = Number(o.distance) || 0;

    day.gross += gross;
    day.tips += tips;
    day.bonus += bonus;
    day.ordersCount += cnt;
    day.durationSecs += Math.max(0, dur);
    day.distanceKm += dist;
    day.shiftsCount += 1;

    totalGross += gross;
    totalOrders += cnt;
    totalDurationSecs += Math.max(0, dur);
  });

  const days = Array.from(daysMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  days.forEach(d => {
    d.tax = Math.round(d.gross * taxRate);
    d.net = isNet ? (d.gross - d.tax) : d.gross;
    d.hours = Math.round((d.durationSecs / 3600) * 10) / 10;
    d.profitPerHr = d.hours > 0 ? Math.round(d.net / d.hours) : 0;
  });

  // Группировка по неделям (YYYY-Www)
  const weeksMap = new Map();
  days.forEach(d => {
    const dt = new Date(d.date);
    const yr = dt.getFullYear();
    const startOfYear = new Date(yr, 0, 1);
    const dayOfYear = Math.floor((dt - startOfYear) / (24 * 3600 * 1000));
    const weekNum = Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7);
    const weekKey = `${yr}-W${String(weekNum).padStart(2, '0')}`;

    let wk = weeksMap.get(weekKey);
    if (!wk) {
      wk = { weekKey, gross: 0, tax: 0, net: 0, tips: 0, bonus: 0, ordersCount: 0, hours: 0, daysCount: 0 };
      weeksMap.set(weekKey, wk);
    }
    wk.gross += d.gross;
    wk.tax += d.tax;
    wk.net += d.net;
    wk.tips += d.tips;
    wk.bonus += d.bonus;
    wk.ordersCount += d.ordersCount;
    wk.hours += d.hours;
    wk.daysCount += 1;
  });
  const weeks = Array.from(weeksMap.values()).map(w => {
    w.hours = Math.round(w.hours * 10) / 10;
    w.profitPerHr = w.hours > 0 ? Math.round(w.net / w.hours) : 0;
    return w;
  });

  // Группировка по месяцам (YYYY-MM)
  const monthsMap = new Map();
  days.forEach(d => {
    const monthKey = d.date.substring(0, 7);
    let m = monthsMap.get(monthKey);
    if (!m) {
      m = { monthKey, gross: 0, tax: 0, net: 0, tips: 0, bonus: 0, ordersCount: 0, hours: 0, daysCount: 0 };
      monthsMap.set(monthKey, m);
    }
    m.gross += d.gross;
    m.tax += d.tax;
    m.net += d.net;
    m.tips += d.tips;
    m.bonus += d.bonus;
    m.ordersCount += d.ordersCount;
    m.hours += d.hours;
    m.daysCount += 1;
  });
  const months = Array.from(monthsMap.values()).map(m => {
    m.hours = Math.round(m.hours * 10) / 10;
    m.profitPerHr = m.hours > 0 ? Math.round(m.net / m.hours) : 0;
    return m;
  });

  const totalHours = Math.round((totalDurationSecs / 3600) * 10) / 10;
  const totalTax = Math.round(totalGross * taxRate);
  const totalNet = isNet ? (totalGross - totalTax) : totalGross;
  const avgCheck = totalOrders > 0 ? Math.round(totalGross / totalOrders) : 0;
  const profitPerHr = totalHours > 0 ? Math.round(totalNet / totalHours) : 0;
  const heatmapMatrix = computeHeatmapMatrix(orders);

  return {
    days,
    weeks,
    months,
    heatmapMatrix,
    avgCheck,
    stats: {
      totalOrders,
      totalHours,
      totalGross,
      totalNet,
      totalTax,
      profitPerHr
    }
  };
}

/**
 * Обработчик входящих сообщений postMessage
 */
self.onmessage = function (e) {
  const t0 = performance.now();
  const data = e.data || {};
  const { id, action, payload } = data;

  try {
    let result;
    switch (action) {
      case 'AGGREGATE':
        result = aggregateDataset(payload || {});
        break;

      case 'SERIALIZE': {
        const json = JSON.stringify(payload.data || {}, null, payload.pretty ? 2 : 0);
        const sizeBytes = new Blob([json]).size;
        result = {
          json,
          sizeBytes,
          sizeKB: Math.round((sizeBytes / 1024) * 10) / 10,
          recordCount: Array.isArray(payload.data?.orders) ? payload.data.orders.length : 0
        };
        break;
      }

      case 'PARSE_AND_VALIDATE':
        result = parseAndValidate(payload.jsonText || payload);
        break;

      case 'SANITIZE':
        result = sanitizeOrders(payload.orders || payload);
        break;

      default:
        throw new Error(`Неизвестное действие Web Worker: ${action}`);
    }

    const executionMs = Math.round((performance.now() - t0) * 100) / 100;
    self.postMessage({
      id,
      success: true,
      result,
      executionMs
    });
  } catch (err) {
    const executionMs = Math.round((performance.now() - t0) * 100) / 100;
    self.postMessage({
      id,
      success: false,
      error: err.message || String(err),
      executionMs
    });
  }
};
