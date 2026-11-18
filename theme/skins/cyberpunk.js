/* Динамика скина «Киберпанк». Всё снимается автоматически при смене скина/выключении эффектов. */
Theme.defineFx('cyberpunk', function (kit) {
  const root = document.documentElement;
  const hero = kit.$('#allTimeHourlyProfit');
  const det = kit.$('#selectedBarDetails');
  const plan = kit.$('#plannedProfitEstimate');
  const squash = s => (s || '').replace(/\s+/g, ' ').trim();

  // 1. Глитч-заголовки: data-t питает псевдо-слои ::before/::after
  ['#block1Title', '#block2Title'].forEach(sel => {
    const h = kit.$(sel);
    if (!h) return;
    const sync = () => h.setAttribute('data-t', squash(h.textContent));
    sync();
    kit.mark(h, { class: 'cp-gt' });
    kit.onUndo(() => h.removeAttribute('data-t'));
    kit.watch(h, sync);
  });

  // 2. Главное число «расшифровывается»; конечный текст всегда за приложением
  kit.scramble(hero, 800);

  // 3. Бегущая строка: данные берём из того, что уже показано на экране
  if (hero) {
    const anchor = hero.closest('div');                  // строка «Прибыль в час за все время…»
    const tk = document.createElement('div');
    tk.className = 'cp-tk';
    tk.setAttribute('aria-hidden', 'true');              // дублирует видимые данные, экранным читалкам не нужна
    const track = document.createElement('div');
    track.className = 'cp-tki';
    tk.appendChild(track);
    kit.add(tk, anchor.parentNode, anchor.nextSibling);

    const build = () => {
      const items = [
        ['Прибыль/ч за все время', squash(hero.textContent)],
        ['Выбрано', squash(det && det.textContent).slice(0, 110)],
        ['План', squash(plan && plan.textContent).replace(/^Расчет прибыли:\s*/i, '')]
      ].filter(i => i[1]);
      const half = () => {
        const frag = document.createDocumentFragment();
        items.forEach(([k, v]) => {
          const s = document.createElement('span');
          const b = document.createElement('b'); b.textContent = k + ': ';
          s.append(b, document.createTextNode(v + '   ▮   '));
          frag.appendChild(s);
        });
        return frag;
      };
      track.textContent = '';
      track.append(half(), half());                      // два одинаковых куска → бесшовный цикл на -50%
      const len = items.reduce((n, i) => n + i[0].length + i[1].length + 8, 0);
      tk.style.setProperty('--cp-tk-dur', Math.max(18, len * 0.3) + 's');
    };
    build();
    [hero, det, plan].forEach(n => kit.watch(n, build));
    kit.onUndo(() => tk.style.removeProperty('--cp-tk-dur'));
  }

  // 4. При смене режима диаграммы: RGB-расслоение + «зарядка» столбцов снизу вверх
  const canvas = kit.$('#barChartCanvas');
  if (canvas) {
    let sig = kit.signature();
    const index = () => kit.$$('.chart-bar-item', canvas).forEach((c, i) => c.style.setProperty('--i', i));
    index();
    kit.watch(canvas, () => {
      index();
      const s = kit.signature();
      if (s === sig) return;
      sig = s;
      kit.flash(root, 'fx-reprint', 1700);
      kit.flash(canvas, 'cp-gx', 600);
      kit.flash(hero, 'cp-gx', 600);
    }, { childList: true });
  }
});
