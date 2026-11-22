/* Динамика скина «Печать». Всё снимается автоматически при смене скина/выключении эффектов. */
Theme.defineFx('print', function (kit) {
  const root = document.documentElement;

  // 1. Число-«оттиск»: data-t питает розовый слой ::after; при смене значения - новая «печать»
  const hero = kit.$('#allTimeHourlyProfit');
  if (hero) {
    let last = '';
    const sync = () => {
      const t = hero.textContent.trim();
      if (t === last) return;
      last = t;
      hero.dataset.t = t;
      kit.flash(hero, 'fx-pr', 1400);
    };
    kit.onUndo(() => hero.removeAttribute('data-t'));
    sync();
    kit.watch(hero, sync);
  }

  // 2. Столбцы «печатаются» заново только когда сменился режим (период, сумма/час, брутто/нетто), а не при выборе столбца
  const canvas = kit.$('#barChartCanvas');
  if (canvas) {
    let sig = kit.signature();
    const index = () => kit.$$('.chart-bar-item', canvas).forEach((c, i) => c.style.setProperty('--i', i));
    index();
    kit.watch(canvas, () => {
      index();
      const s = kit.signature();
      if (s !== sig) { sig = s; kit.flash(root, 'fx-reprint', 1700); }
    }, { childList: true });
  }

  // 3. Штрихкод внизу «чека» = реальный состав выбранного периода (читаем значения легенды)
  const det = kit.$('#selectedBarDetails'), legend = kit.$('#chartLegendContainer');
  const KEYS = [['Orders', 'orders'], ['Surge', 'surge'], ['Rating', 'rating'], ['Bonuses', 'bonus'], ['Goals', 'goals'], ['Tips', 'tips']];
  const barcode = () => {
    if (!det) return;
    const parts = KEYS.map(([id, key]) => {
      const b = kit.$('#legend' + id + 'Item b');
      const v = b ? parseFloat(b.textContent.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0;
      return { v: Number.isFinite(v) && v > 0 ? v : 0, c: 'var(--series-' + key + ')' };
    }).filter(p => p.v > 0);
    if (!parts.length) { det.style.removeProperty('--bc'); return; }
    const total = parts.reduce((s, p) => s + p.v, 0);
    let acc = 0;
    const stops = parts.map(p => {                       // цветные блоки пропорционально вкладу; «штрихи» даёт маска в CSS
      const a = acc / total * 100; acc += p.v; const b = acc / total * 100;
      return p.c + ' ' + a.toFixed(2) + '% ' + b.toFixed(2) + '%';
    });
    det.style.setProperty('--bc', 'linear-gradient(90deg,' + stops.join(',') + ')');
  };
  kit.onUndo(() => det && det.style.removeProperty('--bc'));
  barcode();
  kit.watch(legend, barcode);
});
