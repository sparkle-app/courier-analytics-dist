/* =============================================================================
   theme.js - ядро: реестр скинов, ленивая загрузка файлов скина, набор утилит
   для эффектов (kit) с автоматической очисткой, меню стилей.
   Подключать ДО script.js. Публичный API: window.Theme

     Theme.SKINS                       список скинов (новый скин = запись + 2 файла в skins/)
     Theme.setSkin(id) → {id,name}     применить скин (атрибут html[data-skin], css, js, меню)
     Theme.setFx(true|false)           включить/выключить динамику (запоминается)
     Theme.defineFx(id, fn)            регистрация динамики скина: fn(kit) → [cleanup]
     Theme.cssVar('--series-orders')   значение токена для JS/canvas
     Theme.onChange(fn)                подписка на смену скина

   Все эффекты работают по уже существующим id/классам приложения и НЕ вставляют ничего
   внутрь областей, которые приложение перерисовывает через innerHTML: наблюдатели
   (MutationObserver) только читают, а декор живёт в CSS или в статичных контейнерах.
   ============================================================================= */
(function () {
  'use strict';

  const KEY_SKIN = 'courier-ui-skin', KEY_FX = 'courier-ui-fx';
  const GF = 'https://fonts.googleapis.com/css2?family=';
  const SKINS = [
    { id: 'default',   name: 'Обычный',   swatch: '#3B82F6' },
    { id: 'print',     name: 'Печать',    swatch: '#FF48B0', css: 'theme/skins/print.css', js: 'theme/skins/print.js',
      fonts: GF + 'IBM+Plex+Mono:wght@400;500;600&family=Unbounded:wght@600;800&display=swap' },
    { id: 'cyberpunk', name: 'Киберпанк', swatch: '#00E5FF', css: 'theme/skins/cyberpunk.css', js: 'theme/skins/cyberpunk.js',
      fonts: GF + 'JetBrains+Mono:wght@400;500;700&family=Russo+One&display=swap' }
  ];

  // Режим «один файл»: если страница заранее поставила window.THEME_BUNDLED = true, CSS и JS скинов уже внутри неё
  // (их встраивает сборщик), и с сервера ничего догружать не нужно. Шрифты всё равно подгружаются.
  const BUNDLED = !!window.THEME_BUNDLED;
  const html = document.documentElement;
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch (_) { /* приватный режим */ } }
  };
  const listeners = new Set();
  const fxFactories = {};
  const loaded = {};                 // url → Promise
  let current = SKINS[0];
  let fxOn = store.get(KEY_FX) !== 'off';
  let cleanups = [];
  let token = 0;                     // защита от гонок при быстром переключении

  html.dataset.fx = fxOn ? 'on' : 'off';

  /* ---------- загрузка ассетов ---------- */
  function load(url, tag, isSkinAsset) {
    if (!url || (isSkinAsset && BUNDLED)) return Promise.resolve();
    if (loaded[url]) return loaded[url];
    return (loaded[url] = new Promise(resolve => {
      const el = document.createElement(tag === 'css' ? 'link' : 'script');
      if (tag === 'css') { el.rel = 'stylesheet'; el.href = url; } else { el.src = url; }
      el.onload = el.onerror = () => resolve();
      document.head.appendChild(el);
    }));
  }

  /* ---------- kit: всё, что создаёт эффект, регистрируется и снимается автоматически ---------- */
  function makeKit() {
    const undo = [];
    const kit = {
      $: (s, r) => (r || document).querySelector(s),
      $$: (s, r) => Array.from((r || document).querySelectorAll(s)),
      /** Наблюдать за узлом; cb вызывается не чаще раза в кадр. */
      watch(target, cb, opts) {
        if (!target) return;
        let raf = 0;
        const mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; cb(); }); });
        mo.observe(target, opts || { childList: true, subtree: true, characterData: true });
        undo.push(() => { mo.disconnect(); cancelAnimationFrame(raf); });
      },
      interval(fn, ms) { const id = setInterval(fn, ms); undo.push(() => clearInterval(id)); return id; },
      timeout(fn, ms) { const id = setTimeout(fn, ms); undo.push(() => clearTimeout(id)); return id; },
      /** Вставить декоративный узел (удалится при выключении). */
      add(el, parent, before) { el.classList.add('fx-deco'); (parent || document.body).insertBefore(el, before || null); undo.push(() => el.remove()); return el; },
      /** Временно повесить класс (для анимации «один раз»), снять через ms. */
      flash(el, cls, ms) {
        if (!el) return;
        el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
        const id = setTimeout(() => el.classList.remove(cls), ms || 1000);
        undo.push(() => { clearTimeout(id); el.classList.remove(cls); });
      },
      /** Добавить атрибут/класс/стиль и вернуть всё как было при выключении. */
      mark(el, attrs) {
        if (!el) return;
        Object.keys(attrs).forEach(k => {
          if (k === 'class') { const c = attrs[k].split(' '); el.classList.add(...c); undo.push(() => el.classList.remove(...c)); }
          else { const old = el.getAttribute(k); el.setAttribute(k, attrs[k]); undo.push(() => old === null ? el.removeAttribute(k) : el.setAttribute(k, old)); }
        });
      },
      /** Подпись «режима отображения»: меняется при смене периода/переключателей, но не при выборе столбца. */
      signature() {
        return kit.$$('#block1ControlsWrapper [aria-checked]').map(e => e.getAttribute('aria-checked')).join('')
          + kit.$$('#block1PeriodButtons .ya-seg-btn-active').map(e => e.textContent.trim()).join('')
          + (kit.$('#chartViewContainer') && kit.$('#chartViewContainer').classList.contains('hidden') ? 't' : 'c');
      },
      /** «Расшифровка» цифр: пока идёт анимация, текст узла - случайные цифры; финальный текст всегда принадлежит приложению. */
      scramble(el, ms) {
        if (!el) return;
        let written = el.textContent, target = written, t0 = 0, id = 0;
        const run = () => {
          const p = (performance.now() - t0) / (ms || 800);
          if (p >= 1) { clearInterval(id); id = 0; el.textContent = written = target; return; }
          el.textContent = written = Array.from(target).map((ch, i) => /\d/.test(ch) && i / target.length >= p ? String(Math.floor(Math.random() * 10)) : ch).join('');
        };
        const start = () => { t0 = performance.now(); if (!id) id = setInterval(run, 45); };
        kit.watch(el, () => { if (el.textContent === written) return; target = el.textContent; start(); }, { childList: true, characterData: true, subtree: true });
        undo.push(() => { clearInterval(id); if (el.textContent !== target) el.textContent = target; });
      },
      onUndo: fn => undo.push(fn)
    };
    return { kit, dispose: () => { undo.splice(0).reverse().forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); } };
  }

  function stopFx() { cleanups.splice(0).forEach(fn => fn()); }
  function startFx(skin, t) {
    stopFx();
    if (!fxOn || !(skin.js || BUNDLED)) return;
    load(skin.js, 'js', true).then(() => {
      if (t !== token || !fxFactories[skin.id]) return;
      const { kit, dispose } = makeKit();
      try { fxFactories[skin.id](kit); cleanups.push(dispose); } catch (e) { console.error('[Theme] fx error', e); dispose(); }
    });
  }

  /* ---------- меню стилей: строится из реестра ---------- */
  const ITEM_CLASS = 'w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition flex items-center justify-between text-main font-semibold';
  const CHECK = '<svg data-skin-check class="w-3.5 h-3.5 shrink-0 CLS" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"></path></svg>';
  function paintMenus() {
    ['styleDropdownMenu', 'styleDropdownMenuMobile'].forEach(id => {
      const menu = document.getElementById(id);
      if (!menu) return;
      menu.querySelectorAll('button[data-skin-id], button[data-fx-toggle], button[onclick*="selectUiStyle"]').forEach(b => b.remove());
      SKINS.forEach(s => {
        const b = document.createElement('button');
        b.type = 'button'; b.dataset.skinId = s.id; b.className = ITEM_CLASS;
        const row = document.createElement('div'); row.className = 'flex items-center gap-2';
        const dot = document.createElement('span'); dot.className = 'w-2 h-2 rounded-full'; dot.style.background = s.swatch;
        const name = document.createElement('span'); name.textContent = s.name;
        row.append(dot, name); b.appendChild(row);
        b.insertAdjacentHTML('beforeend', CHECK.replace('CLS', s.id === current.id ? '' : 'hidden'));
        menu.appendChild(b);
      });
      const fx = document.createElement('button');
      fx.type = 'button'; fx.dataset.fxToggle = '1'; fx.className = ITEM_CLASS + ' mt-1 border-t border-subtle';
      menu.appendChild(fx);
    });
    paintFxLabels();
  }
  function paintFxLabels() {
    document.querySelectorAll('button[data-fx-toggle]').forEach(b => { b.textContent = 'Эффекты: ' + (fxOn ? 'вкл' : 'выкл'); });
  }

  /* ---------- публичное ---------- */
  function setSkin(id, opts) {
    const skin = SKINS.find(s => s.id === id) || SKINS[0];
    current = skin;
    const t = ++token;
    html.dataset.skin = skin.id;
    if (skin.fonts) load(skin.fonts, 'css');
    load(skin.css, 'css', true);
    if (!opts || opts.persist !== false) store.set(KEY_SKIN, skin.id);
    document.querySelectorAll('button[data-skin-id]').forEach(b => {
      const c = b.querySelector('[data-skin-check]');
      if (c) c.classList.toggle('hidden', b.dataset.skinId !== skin.id);
    });
    startFx(skin, t);
    listeners.forEach(fn => { try { fn(skin); } catch (e) { console.error(e); } });
    return skin;
  }
  function setFx(on) {
    fxOn = !!on; store.set(KEY_FX, fxOn ? 'on' : 'off');
    html.dataset.fx = fxOn ? 'on' : 'off';
    paintFxLabels();
    startFx(current, ++token);
  }

  document.addEventListener('click', e => {
    const skinBtn = e.target.closest('button[data-skin-id]');
    if (skinBtn) {
      if (typeof selectUiStyle === 'function') selectUiStyle(skinBtn.dataset.skinId); else setSkin(skinBtn.dataset.skinId);
      if (typeof closeStyleDropdown === 'function') closeStyleDropdown();
      return;
    }
    if (e.target.closest('button[data-fx-toggle]')) setFx(!fxOn);
  });

  window.Theme = {
    SKINS, setSkin, setFx,
    fx: () => fxOn,
    skin: () => current,
    defineFx: (id, fn) => { fxFactories[id] = fn; },
    cssVar: (name, el) => getComputedStyle(el || document.body).getPropertyValue(name).trim(),
    onChange: fn => { listeners.add(fn); return () => listeners.delete(fn); }
  };

  // Применяем сохранённый скин сразу (CSS), а динамику - когда DOM готов
  setSkin(store.get(KEY_SKIN) || 'default', { persist: false });
  const ready = () => { paintMenus(); startFx(current, ++token); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
