/* Lily — вітрина магазину */
(function () {
  'use strict';

  var CFG = window.LILY_CONFIG || {};
  var API = window.LilyAPI;

  /* ───────────── Дрібні помічники ───────────── */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₴'; }
  function enc(s) { return encodeURIComponent(s); }
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem('lily_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem('lily_' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };
  function norm(s) { return String(s || '').toLowerCase().replace(/[’ʼ`]/g, "'").replace(/ё/g, 'е'); }

  /* ───────────── Іконки та заглушки фото ───────────── */
  var ICON = {
    bottle: '<rect x="22" y="22" width="20" height="32" rx="4"/><rect x="27" y="12" width="10" height="10" rx="2"/><path d="M26 34h12"/>',
    lipstick: '<rect x="26" y="32" width="12" height="22" rx="2"/><path d="M28 32V20l8-6v18"/>',
    bear: '<circle cx="32" cy="36" r="14"/><circle cx="21" cy="22" r="5"/><circle cx="43" cy="22" r="5"/><circle cx="27" cy="34" r="1"/><circle cx="37" cy="34" r="1"/><path d="M29 41c2 2 4 2 6 0"/>',
    vase: '<path d="M26 12h12M28 12c0 8-8 12-8 24c0 10 5 16 12 16s12-6 12-16c0-12-8-16-8-24"/>',
    candle: '<rect x="22" y="28" width="20" height="26" rx="3"/><path d="M32 28v-6"/><path d="M32 10c3 4 3 7 0 9c-3-2-3-5 0-9z"/>',
    lamp: '<path d="M20 30h24l-6-16H26z"/><path d="M32 30v20"/><path d="M24 52h16"/>',
    lily: '<path d="M32 8C38 18 38 30 32 40C26 30 26 18 32 8Z"/><path d="M32 40C22 38 13 30 12 18C21 20 28 28 32 40Z"/><path d="M32 40C42 38 51 30 52 18C43 20 36 28 32 40Z"/><path d="M32 40V54"/>'
  };
  var LILY_MARK = '<svg width="56" height="56" viewBox="0 0 48 48" fill="none" stroke="#9A5249" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M24 6C29 14 29 24 24 32C19 24 19 14 24 6Z"/><path d="M24 32C16 30 9 24 8 14C15 16 21 22 24 32Z"/><path d="M24 32C32 30 39 24 40 14C33 16 27 22 24 32Z"/><path d="M24 32V42"/></svg>';
  var HEART = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#33241F" stroke-width="1.6" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  var CLOSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#33241F" stroke-width="1.8" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var CHEV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  function themeFor(cat, sub) {
    var c = norm(cat + ' ' + (sub || ''));
    if (c.indexOf('свіч') >= 0) return { bg: '#EFE5D8', st: '#7A6450', icon: 'candle' };
    if (c.indexOf('догляд') >= 0) return { bg: '#F3E3DE', st: '#8C5A50', icon: 'bottle' };
    if (c.indexOf('декоратив') >= 0 || c.indexOf('макіяж') >= 0) return { bg: '#EBD3CB', st: '#8C5A50', icon: 'lipstick' };
    if (c.indexOf('іграш') >= 0 || c.indexOf('дит') >= 0) return { bg: '#DCE3D3', st: '#4E6045', icon: 'bear' };
    if (c.indexOf('освітл') >= 0 || c.indexOf('світ') >= 0 || c.indexOf('ламп') >= 0 || c.indexOf('нічник') >= 0 || c.indexOf('гірлянд') >= 0) return { bg: '#ECE4EC', st: '#6B5670', icon: 'lamp' };
    if (c.indexOf('декор') >= 0) return { bg: '#EFE5D8', st: '#7A6450', icon: 'vase' };
    return { bg: '#F3E3DE', st: '#9A5249', icon: 'lily' };
  }
  function iconSvg(cat, sub, size) {
    var t = themeFor(cat, sub);
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" fill="none" stroke="' + t.st + '" stroke-width="1.3" stroke-linejoin="round" aria-hidden="true">' + ICON[t.icon] + '</svg>';
  }
  function photo(p, i, size) {
    var src = p.images && p.images[i || 0];
    if (src) return '<img src="' + esc(src) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">';
    return iconSvg(p.category, p.subcategory, size || 88);
  }
  function tint(p) { return (p.images && p.images.length) ? '#FFFFFF' : themeFor(p.category, p.subcategory).bg; }

  /* ───────────── Стан ───────────── */
  var DATA = { products: [], categories: [], settings: {} };
  var byId = {};
  var cats = [];               // [{name, subs:[]}]
  var cart = store.get('cart', []);
  var favs = store.get('favs', []);
  var recent = store.get('recent', []);
  var F = freshFilters();
  var sortBy = 'popular';
  var listKey = '';
  var query = '';

  function freshFilters() { return { avail: [], ages: [], brands: [], subs: [], extra: {}, min: '', max: '', sale: false, isNew: false }; }

  /* ───────────── Статистика ───────────── */
  var sid = store.get('sid', null);
  if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('sid', sid); }
  var evq = [], evTimer = null;
  function track(type, value) {
    evq.push({ type: type, value: String(value || '').slice(0, 120) });
    clearTimeout(evTimer);
    evTimer = setTimeout(flush, 2500);
  }
  function flush() { if (evq.length) API.beacon('event', { events: evq.splice(0), session: sid }); }
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
  try { if (!sessionStorage.getItem('lily_visit')) { sessionStorage.setItem('lily_visit', '1'); track('visit', document.referrer ? new URL(document.referrer).hostname : 'direct'); } } catch (e) { /* ignore */ }

  /* ───────────── Дані ───────────── */
  function setData(d) {
    DATA = d || DATA;
    byId = {};
    DATA.products.forEach(function (p) {
      p.images = p.images || []; p.extra = p.extra || []; p.badges = p.badges || []; p.gifts = p.gifts || [];
      byId[p.id] = p;
    });
    var map = {}, order = [];
    (DATA.categories || []).forEach(function (r) {
      if (!r.category) return;
      if (!map[r.category]) { map[r.category] = []; order.push(r.category); }
      if (r.subcategory && map[r.category].indexOf(r.subcategory) < 0) map[r.category].push(r.subcategory);
    });
    DATA.products.forEach(function (p) {
      if (!p.category) return;
      if (!map[p.category]) { map[p.category] = []; order.push(p.category); }
      if (p.subcategory && map[p.category].indexOf(p.subcategory) < 0) map[p.category].push(p.subcategory);
    });
    cats = order.map(function (n) { return { name: n, subs: map[n] }; });
    cart = cart.filter(function (it) { return byId[it.id]; }).map(function (it) { return { id: it.id, qty: Math.min(it.qty, maxQty(byId[it.id])) }; });
    saveCart();
    applySettings();
    renderNav();
  }

  function load() {
    var cached = store.get('catalog', null);
    if (cached && cached.products && !API.demo) { setData(cached); render(); }
    return API.call('catalog').then(function (d) {
      store.set('catalog', d);
      setData(d);
      render();
    }).catch(function (err) {
      if (!cached) $('#view').innerHTML = '<div class="empty"><h3>Не вдалося завантажити каталог</h3><p>' + esc(err.message) + '</p><p><button class="btn" onclick="location.reload()">Спробувати ще раз</button></p></div>';
    });
  }

  function applySettings() {
    var s = DATA.settings || {};
    var ann = $('#announce');
    if (s.announcement) { ann.textContent = s.announcement; ann.hidden = false; } else ann.hidden = true;
    $('#demoNote').hidden = !API.demo;
    $$('[data-phone]').forEach(function (a) { a.href = 'tel:' + CFG.PHONE; a.textContent = CFG.PHONE_TEXT; });
    $$('[data-phone-text]').forEach(function (a) { a.textContent = CFG.PHONE_TEXT; });
    $$('[data-contact-name]').forEach(function (a) { a.textContent = CFG.CONTACT_NAME; });
    $$('[data-messengers]').forEach(function (el) { el.innerHTML = messengers().map(function (m) { return '<a class="msg-btn" href="' + esc(m.href) + '" target="_blank" rel="noopener" aria-label="' + m.name + '">' + m.icon + '</a>'; }).join(''); });
    $$('[data-instagram]').forEach(function (a) { if (s.instagramUrl) { a.href = s.instagramUrl; a.hidden = false; a.target = '_blank'; a.rel = 'noopener'; } });
  }

  function messengers() {
    var s = DATA.settings || {};
    var list = [];
    if (CFG.VIBER_PHONE) list.push({ name: 'Viber', href: 'viber://chat?number=%2B' + CFG.VIBER_PHONE, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#665CAC" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c5 0 8 3 8 7.5S17 18 12 18c-1 0-2 0-3-.3L6 20v-3.2C4.8 15.4 4 13.6 4 10.5 4 6 7 3 12 3z"/><path d="M9.5 8.5c.5 2 2 3.6 4 4.2"/></svg>' });
    if (CFG.TELEGRAM) list.push({ name: 'Telegram', href: 'https://t.me/' + CFG.TELEGRAM, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1F7FBF" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M21 4L3 11l6 2 2 6 3-4 5 4 2-15z"/><path d="M9 13l8-6"/></svg>' });
    if (CFG.WHATSAPP_PHONE) list.push({ name: 'WhatsApp', href: 'https://wa.me/' + CFG.WHATSAPP_PHONE, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#178C43" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-3.8A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2 2.2 4 4.5 4.5"/></svg>' });
    if (s.messengerUrl) list.push({ name: 'Messenger', href: s.messengerUrl, icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A6FE0" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="M12 3C7 3 3 6.7 3 11.3c0 2.6 1.3 4.9 3.3 6.4V21l3-1.7c.9.2 1.8.4 2.7.4 5 0 9-3.7 9-8.4S17 3 12 3z"/><path d="M7.5 13.5l3-3 2.5 2 3.5-3"/></svg>' });
    return list;
  }

  /* ───────────── Меню зліва ───────────── */
  function renderNav() {
    var r = route();
    var curCat = r[0] === 'c' ? r[1] : (r[0] === 'p' && byId[r[1]] ? byId[r[1]].category : '');
    var curSub = r[0] === 'c' ? r[2] : '';
    $('#catnav').innerHTML = cats.map(function (c) {
      var active = c.name === curCat;
      var h = '<a class="cat-link' + (active ? ' active open' : '') + '" href="#/c/' + enc(c.name) + '" data-close>' + esc(c.name) + (c.subs.length ? CHEV : '') + '</a>';
      if (active && c.subs.length) {
        h += '<div class="subnav">' + c.subs.map(function (s) {
          return '<a class="sub-link' + (s === curSub ? ' active' : '') + '" href="#/c/' + enc(c.name) + '/' + enc(s) + '" data-close>' + esc(s) + '</a>';
        }).join('') + '</div>';
      }
      return h;
    }).join('');
  }

  /* ───────────── Маршрути ───────────── */
  function route() {
    var h = location.hash.replace(/^#\/?/, '');
    return h.split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
  }

  function render() {
    closeAll();
    renderNav();
    updateCounts();
    var r = route();
    var view = $('#view');
    if (r[0] !== 's') { query = ''; $('#q').value = ''; $('#qClear').hidden = true; }
    if (r[0] === 'p') return renderProduct(r[1]);
    if (r[0] === 'info') return renderInfo(r[1]);

    var cfg;
    if (!r.length) cfg = { key: 'home', home: true, title: 'Популярне зараз', eyebrow: 'Каталог', list: DATA.products };
    else if (r[0] === 'all') cfg = { key: 'all', title: 'Весь каталог', eyebrow: 'Lily', list: DATA.products };
    else if (r[0] === 'c') {
      var sub = r[2];
      cfg = { key: 'c/' + r[1] + '/' + (sub || ''), title: sub || r[1], eyebrow: sub ? r[1] : 'Категорія', cat: r[1], sub: sub,
        list: DATA.products.filter(function (p) { return p.category === r[1] && (!sub || p.subcategory === sub); }) };
    }
    else if (r[0] === 'sale') cfg = { key: 'sale', title: 'Знижки', eyebrow: 'Вигідно', list: DATA.products.filter(function (p) { return p.oldPrice > p.price; }) };
    else if (r[0] === 'new') cfg = { key: 'new', title: 'Новинки', eyebrow: 'Щойно надійшло', list: DATA.products.filter(function (p) { return p.badges.indexOf('Новинка') >= 0; }) };
    else if (r[0] === 'fav') cfg = { key: 'fav', title: 'Обране', eyebrow: 'Вам сподобалось', list: favs.map(function (id) { return byId[id]; }).filter(Boolean), emptyText: 'Натискайте ♡ на товарах, щоб зберегти їх тут.' };
    else if (r[0] === 'gifts') cfg = { key: 'gifts/' + (r[1] || ''), gifts: true, title: r[1] ? 'Подарунки: ' + r[1].toLowerCase() : 'Ідеї подарунків', eyebrow: 'Не знаєте, що подарувати?',
      list: DATA.products.filter(function (p) { return r[1] ? p.gifts.indexOf(r[1]) >= 0 : p.gifts.length > 0; }) };
    else if (r[0] === 's') {
      query = r[1] || '';
      if ($('#q').value !== query) $('#q').value = query;
      cfg = { key: 's', title: query ? 'Пошук: «' + query + '»' : 'Пошук', eyebrow: 'Результати', list: DATA.products.filter(function (p) { return matches(p, query); }), search: true,
        emptyText: 'Нічого не знайшли. Спробуйте інше слово або напишіть Лілії — підкажемо!' };
    }
    else { location.hash = '#/'; return; }

    if (cfg.key !== listKey && !(cfg.search && listKey === 's')) { F = freshFilters(); }
    listKey = cfg.key;
    if (r[0] !== 's') { query = ''; $('#q').value = ''; $('#qClear').hidden = true; }

    var html = '';
    if (cfg.home) html += heroHTML() + catTilesHTML();
    if (cfg.gifts) html += '<div style="margin-bottom:48px">' + giftTilesHTML() + '</div>';
    html += '<section class="' + (cfg.home ? 'section' : '') + '" id="listing"></section>';
    if (cfg.home) html += '<section class="section"><div class="section-head"><div><div class="eyebrow">Не знаєте, що подарувати?</div><h2>Ідеї подарунків</h2></div></div>' + giftTilesHTML() + '</section>' + trustHTML() + recentHTML();
    view.innerHTML = html;
    renderListing(cfg);
    document.title = (cfg.home ? 'Lily — косметика, іграшки, декор і світло для дому' : cfg.title + ' — Lily');
  }

  var currentCfg = null;
  function renderListing(cfg) {
    currentCfg = cfg || currentCfg;
    cfg = currentCfg;
    var el = $('#listing');
    if (!el) return;
    var list = sortList(applyFilters(cfg.list));
    var total = list.length;
    var limited = cfg.home && !activeCount() ? list.slice(0, 12) : list;
    var head = '<div class="section-head"><div><div class="eyebrow">' + esc(cfg.eyebrow) + '</div>' + (cfg.home ? '<h2>' : '<h1 class="page-title">') + esc(cfg.title) + (cfg.home ? '</h2>' : '</h1>') + '</div></div>';
    var html = head + toolbarHTML(cfg);
    if (!cfg.home) html += '<p class="result-info">' + total + ' ' + plural(total, 'товар', 'товари', 'товарів') + '</p>';
    if (!list.length) {
      html += '<div class="empty"><h3>' + (cfg.list.length ? 'Нічого не підходить' : 'Поки порожньо') + '</h3><p>' + esc(cfg.list.length ? 'Спробуйте прибрати частину фільтрів.' : (cfg.emptyText || 'Скоро тут з\'являться товари.')) + '</p>' +
        (activeCount() ? '<p><button class="btn btn-soft" data-reset-filters>Скинути фільтри</button></p>' : '<p><a class="btn" href="#/all">Дивитись каталог</a></p>') + '</div>';
    } else {
      html += '<div class="grid">' + limited.map(cardHTML).join('') + '</div>';
      if (limited.length < list.length) html += '<p style="text-align:center;margin-top:40px"><a class="btn btn-outline btn-lg" href="#/all">Дивитись весь каталог · ' + DATA.products.length + '</a></p>';
    }
    el.innerHTML = html;
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return one;
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
    return many;
  }

  /* ───────────── Блоки головної ───────────── */
  function heroHTML() {
    var s = DATA.settings || {};
    var withPhotos = DATA.products.filter(function (p) { return p.images.length; }).slice(0, 3);
    var art = [0, 1, 2].map(function (i) {
      var p = withPhotos[i];
      var bg = ['#EBD3CB', '#EFE5D8', '#DCE3D3'][i];
      if (p) return '<div style="background:' + bg + '"><img src="' + esc(p.images[0]) + '" alt=""></div>';
      var c = [['Доглядова косметика'], ['Декор для дому', 'Свічки'], ['Дитячі іграшки']][i];
      return '<div style="background:' + bg + '">' + iconSvg(c[0], c[1], i ? 72 : 120) + '</div>';
    }).join('');
    var title = s.heroTitle ? esc(s.heroTitle) : 'Маленькі радості <em>для вас</em> і вашого дому';
    var text = s.heroText ? esc(s.heroText) : "Догляд, м'які іграшки, свічки та світло, що створює затишок. Добираємо кожну річ з любов'ю.";
    return '<section class="hero"><div class="hero-text"><span class="eyebrow">Lily · beauty · kids · home</span><h1>' + title + '</h1><p>' + text + '</p>' +
      '<div class="hero-actions"><a class="btn btn-lg" href="#/all">Перейти до каталогу</a><a class="btn btn-outline btn-lg" href="#/gifts">Ідеї подарунків</a></div></div>' +
      '<div class="hero-art" aria-hidden="true">' + art + '</div></section>';
  }

  function catTilesHTML() {
    if (!cats.length) return '';
    return '<section class="section" aria-label="Категорії"><div class="cat-tiles">' + cats.map(function (c) {
      var t = themeFor(c.name);
      return '<a class="cat-tile" href="#/c/' + enc(c.name) + '"><span class="circle" style="background:' + t.bg + '">' + iconSvg(c.name, '', 60) + '</span>' + esc(c.name) + '</a>';
    }).join('') + '</div></section>';
  }

  var GIFTS = [
    { name: 'Мамі', text: 'Догляд і затишок', bg: '#F3E3DE' },
    { name: 'Подрузі', text: 'Приємні дрібнички', bg: '#EFE5D8' },
    { name: 'Дитині', text: 'Іграшки за віком', bg: '#DCE3D3' },
    { name: 'До свят', text: 'Миколай · Новий рік · 8 березня', bg: '#EAD7B2' }
  ];
  function giftTilesHTML() {
    return '<div class="gift-tiles">' + GIFTS.map(function (g) {
      return '<a class="gift-tile" href="#/gifts/' + enc(g.name) + '" style="background:' + g.bg + '"><b>' + g.name + '</b><span>' + g.text + '</span></a>';
    }).join('') + '</div>';
  }

  function trustHTML() {
    return '<section class="section trust">' +
      '<div><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.4" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg><div><b>Доставка</b><span>Нова Пошта та Укрпошта по всій Україні</span></div></div>' +
      '<div><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.4" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/></svg><div><b>Оплата</b><span>Післяплата з частковою передоплатою або повна передоплата</span></div></div>' +
      '<div><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.4" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/></svg><div><b>Жива консультація</b><span>' + esc(CFG.CONTACT_NAME) + ' допоможе з вибором у Viber, Telegram чи WhatsApp</span></div></div>' +
      '</section>';
  }

  function recentHTML(exclude) {
    var list = recent.filter(function (id) { return id !== exclude && byId[id]; }).slice(0, 4).map(function (id) { return byId[id]; });
    if (!list.length) return '';
    return '<section class="section"><div class="section-head"><div><div class="eyebrow">Для вас</div><h2>Ви нещодавно переглядали</h2></div></div><div class="grid">' + list.map(cardHTML).join('') + '</div></section>';
  }

  /* ───────────── Картка товару в сітці ───────────── */
  function stockHTML(p) {
    if (p.availability === 'Немає') return '<span class="stock none">Немає в наявності</span>';
    if (p.availability === 'Під замовлення') return '<span class="stock order">Під замовлення</span>';
    if (p.quantity !== null && p.quantity !== '' && p.quantity > 0 && p.quantity <= 3) return '<span class="stock low">Залишилось ' + p.quantity + ' шт</span>';
    return '<span class="stock ok">В наявності</span>';
  }
  function badgesHTML(p) {
    var b = [];
    if (p.oldPrice > p.price && p.price > 0) b.push('<span class="badge sale">−' + Math.round((1 - p.price / p.oldPrice) * 100) + '%</span>');
    if (p.badges.indexOf('Новинка') >= 0) b.push('<span class="badge new">Новинка</span>');
    if (p.badges.indexOf('Хіт') >= 0) b.push('<span class="badge">Хіт</span>');
    return b.length ? '<span class="badges">' + b.join('') + '</span>' : '';
  }
  function priceHTML(p) {
    var sale = p.oldPrice > p.price;
    return '<div class="price-row"><span class="price' + (sale ? ' sale' : '') + '">' + money(p.price) + '</span>' + (sale ? '<s class="old">' + money(p.oldPrice) + '</s>' : '') + '</div>';
  }
  function favBtn(p, cls) {
    var on = favs.indexOf(p.id) >= 0;
    return '<button type="button" class="' + (cls || 'fav-btn') + (on ? ' on' : '') + '" data-fav="' + esc(p.id) + '" aria-pressed="' + on + '" aria-label="' + (on ? 'Прибрати з обраного' : 'Додати в обране') + '">' + HEART + '</button>';
  }
  function actionBtn(p) {
    if (p.availability === 'Немає') return '<button type="button" class="btn btn-soft" data-notify="' + esc(p.id) + '">Повідомити, коли з\'явиться</button>';
    if (p.availability === 'Під замовлення') return '<button type="button" class="btn btn-outline" data-add="' + esc(p.id) + '">Замовити</button>';
    return '<button type="button" class="btn" data-add="' + esc(p.id) + '">У кошик</button>';
  }
  function cardHTML(p) {
    var link = '#/p/' + enc(p.id);
    return '<article class="card">' +
      '<div style="position:relative"><a class="card-media" href="' + link + '" style="background:' + tint(p) + '" aria-label="' + esc(p.name) + '">' + photo(p, 0, 88) + '</a>' +
      badgesHTML(p) + (p.age ? '<span class="badge age">' + esc(p.age) + '</span>' : '') + favBtn(p) + '</div>' +
      '<div class="card-info"><span class="card-cat">' + esc(p.subcategory || p.category) + '</span>' +
      '<a class="card-name" href="' + link + '">' + esc(p.name) + '</a>' + priceHTML(p) + stockHTML(p) + '</div>' +
      actionBtn(p) + '</article>';
  }

  /* ───────────── Фільтри ───────────── */
  function matches(p, q) {
    var words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return true;
    var hay = norm([p.name, p.brand, p.category, p.subcategory, p.description, p.age, p.extra.map(function (x) { return x.k + ' ' + x.v; }).join(' ')].join(' '));
    return words.every(function (w) { return hay.indexOf(w) >= 0; });
  }
  function extraVal(p, k) { for (var i = 0; i < p.extra.length; i++) if (p.extra[i].k === k) return p.extra[i].v; return undefined; }
  function applyFilters(list) {
    return list.filter(function (p) {
      if (F.min !== '' && p.price < Number(F.min)) return false;
      if (F.max !== '' && p.price > Number(F.max)) return false;
      if (F.avail.length && F.avail.indexOf(p.availability) < 0) return false;
      if (F.ages.length && F.ages.indexOf(p.age) < 0) return false;
      if (F.brands.length && F.brands.indexOf(p.brand) < 0) return false;
      if (F.subs.length && F.subs.indexOf(p.subcategory) < 0) return false;
      if (F.sale && !(p.oldPrice > p.price)) return false;
      if (F.isNew && p.badges.indexOf('Новинка') < 0) return false;
      for (var k in F.extra) if (F.extra[k].length && F.extra[k].indexOf(extraVal(p, k)) < 0) return false;
      return true;
    });
  }
  function activeCount() {
    var n = F.avail.length + F.ages.length + F.brands.length + F.subs.length + (F.sale ? 1 : 0) + (F.isNew ? 1 : 0) + (F.min !== '' || F.max !== '' ? 1 : 0);
    for (var k in F.extra) n += F.extra[k].length;
    return n;
  }
  var AV_RANK = { 'В наявності': 0, 'Під замовлення': 1, 'Немає': 2 };
  function sortList(list) {
    var l = list.slice();
    if (sortBy === 'cheap') l.sort(function (a, b) { return AV_RANK[a.availability] - AV_RANK[b.availability] || a.price - b.price; });
    else if (sortBy === 'expensive') l.sort(function (a, b) { return AV_RANK[a.availability] - AV_RANK[b.availability] || b.price - a.price; });
    else if (sortBy === 'new') l.sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
    else if (sortBy === 'sale') l.sort(function (a, b) { return disc(b) - disc(a); });
    else l.sort(function (a, b) {
      return AV_RANK[a.availability] - AV_RANK[b.availability] ||
        (b.badges.indexOf('Хіт') >= 0) - (a.badges.indexOf('Хіт') >= 0) ||
        String(b.created).localeCompare(String(a.created));
    });
    return l;
  }
  function disc(p) { return p.oldPrice > p.price ? 1 - p.price / p.oldPrice : 0; }

  function facets(list) {
    function uniq(fn) { var m = {}; list.forEach(function (p) { var v = fn(p); if (v) m[v] = (m[v] || 0) + 1; }); return Object.keys(m).sort(function (a, b) { return a.localeCompare(b, 'uk', { numeric: true }); }); }
    var extraKeys = {};
    list.forEach(function (p) { p.extra.forEach(function (x) { (extraKeys[x.k] = extraKeys[x.k] || {})[x.v] = 1; }); });
    var extras = Object.keys(extraKeys).filter(function (k) { var n = Object.keys(extraKeys[k]).length; return n >= 2 && n <= 30; })
      .map(function (k) { return { key: k, values: Object.keys(extraKeys[k]).sort(function (a, b) { return a.localeCompare(b, 'uk', { numeric: true }); }) }; });
    var prices = list.map(function (p) { return p.price; });
    return {
      subs: uniq(function (p) { return p.subcategory; }),
      avail: ['В наявності', 'Під замовлення', 'Немає'].filter(function (a) { return list.some(function (p) { return p.availability === a; }); }),
      ages: uniq(function (p) { return p.age; }),
      brands: uniq(function (p) { return p.brand; }),
      extras: extras,
      minPrice: prices.length ? Math.min.apply(null, prices) : 0,
      maxPrice: prices.length ? Math.max.apply(null, prices) : 0
    };
  }

  function toolbarHTML(cfg) {
    var n = activeCount();
    var h = '<div class="toolbar">';
    h += '<button type="button" class="chip dark" data-open-filters><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>Фільтри' + (n ? ' · ' + n : '') + '</button>';
    if (cfg.sub === undefined && cfg.cat) {
      var c = cats.filter(function (x) { return x.name === cfg.cat; })[0];
      if (c) c.subs.forEach(function (s) { h += '<a class="chip" href="#/c/' + enc(c.name) + '/' + enc(s) + '">' + esc(s) + '</a>'; });
    }
    h += '<button type="button" class="chip' + (F.avail.length === 1 && F.avail[0] === 'В наявності' ? ' on' : '') + '" data-quick="instock">В наявності</button>';
    if (listKey !== 'sale') h += '<button type="button" class="chip' + (F.sale ? ' on' : '') + '" data-quick="sale">Зі знижкою</button>';
    if (listKey !== 'new') h += '<button type="button" class="chip' + (F.isNew ? ' on' : '') + '" data-quick="new">Новинки</button>';
    // активні фільтри
    var act = [];
    if (F.min !== '' || F.max !== '') act.push(['price', '', 'Ціна: ' + (F.min || 0) + '–' + (F.max || '∞') + ' ₴']);
    F.ages.forEach(function (v) { act.push(['ages', v, 'Вік ' + v]); });
    F.brands.forEach(function (v) { act.push(['brands', v, v]); });
    F.subs.forEach(function (v) { act.push(['subs', v, v]); });
    if (F.avail.length && !(F.avail.length === 1 && F.avail[0] === 'В наявності')) F.avail.forEach(function (v) { act.push(['avail', v, v]); });
    Object.keys(F.extra).forEach(function (k) { F.extra[k].forEach(function (v) { act.push(['extra', k + '\u0001' + v, k + ': ' + v]); }); });
    act.forEach(function (a) { h += '<button type="button" class="chip on" data-unset="' + a[0] + '" data-val="' + esc(a[1]) + '" aria-label="Прибрати фільтр ' + esc(a[2]) + '">' + esc(a[2]) + ' ✕</button>'; });
    h += '<label class="sort">Сортувати:<select id="sortSel">' +
      [['popular', 'Спершу популярні'], ['cheap', 'Від дешевих'], ['expensive', 'Від дорогих'], ['new', 'Новинки'], ['sale', 'Найбільші знижки']]
        .map(function (o) { return '<option value="' + o[0] + '"' + (sortBy === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>';
    return h + '</div>';
  }

  function toggle(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }

  function renderFilterPanel() {
    if (!currentCfg) return;
    var fc = facets(currentCfg.list);
    function group(title, key, values, labelFn) {
      if (!values.length) return '';
      var cur = key.indexOf('extra:') === 0 ? (F.extra[key.slice(6)] || []) : F[key];
      return '<div class="fgroup"><h3>' + esc(title) + '</h3><div class="fopts">' + values.map(function (v) {
        return '<button type="button" class="chip' + (cur.indexOf(v) >= 0 ? ' on' : '') + '" data-f="' + esc(key) + '" data-v="' + esc(v) + '" aria-pressed="' + (cur.indexOf(v) >= 0) + '">' + esc(labelFn ? labelFn(v) : v) + '</button>';
      }).join('') + '</div></div>';
    }
    var h = '<div class="fgroup"><h3>Ціна, ₴</h3><div class="price-inputs">' +
      '<label class="sr-only" for="fMin">Ціна від</label><input class="input" id="fMin" type="number" inputmode="numeric" min="0" placeholder="від ' + fc.minPrice + '" value="' + esc(F.min) + '">' +
      '<span>—</span><label class="sr-only" for="fMax">Ціна до</label><input class="input" id="fMax" type="number" inputmode="numeric" min="0" placeholder="до ' + fc.maxPrice + '" value="' + esc(F.max) + '"></div></div>';
    if (fc.subs.length > 1) h += group('Підкатегорія', 'subs', fc.subs);
    h += group('Наявність', 'avail', fc.avail);
    h += '<div class="fgroup"><h3>Пропозиції</h3><div class="fopts">' +
      '<button type="button" class="chip' + (F.sale ? ' on' : '') + '" data-fbool="sale" aria-pressed="' + F.sale + '">Зі знижкою</button>' +
      '<button type="button" class="chip' + (F.isNew ? ' on' : '') + '" data-fbool="isNew" aria-pressed="' + F.isNew + '">Новинки</button></div></div>';
    if (fc.ages.length) h += group('Вік', 'ages', fc.ages);
    if (fc.brands.length > 1) h += group('Бренд', 'brands', fc.brands);
    fc.extras.forEach(function (e) { h += group(e.key, 'extra:' + e.key, e.values); });
    $('#filterBody').innerHTML = h;
    var n = applyFilters(currentCfg.list).length;
    $('#fApply').textContent = 'Показати ' + n + ' ' + plural(n, 'товар', 'товари', 'товарів');
  }

  function filtersChanged() { renderListing(); if ($('#filters').classList.contains('on')) renderFilterPanel(); }

  /* ───────────── Сторінка товару ───────────── */
  var galleryIdx = 0;
  function maxQty(p) {
    if (!p) return 0;
    if (p.availability === 'В наявності' && p.quantity !== null && p.quantity !== '' && !isNaN(p.quantity) && p.quantity > 0) return Math.min(99, p.quantity);
    return 99;
  }

  function renderProduct(id) {
    var p = byId[id];
    var view = $('#view');
    if (!p) {
      if (!DATA.products.length) return;
      view.innerHTML = '<div class="empty"><h3>Товар не знайдено</h3><p>Можливо, його вже прибрали з каталогу.</p><p><a class="btn" href="#/all">До каталогу</a></p></div>';
      return;
    }
    listKey = '';
    galleryIdx = 0;
    recent = [p.id].concat(recent.filter(function (x) { return x !== p.id; })).slice(0, 12);
    store.set('recent', recent);
    track('view', p.id);
    document.title = p.name + ' — Lily';

    var catLink = '#/c/' + enc(p.category);
    var imgs = p.images.length ? p.images : [''];
    var specs = [];
    if (p.brand) specs.push(['Бренд', p.brand]);
    if (p.age) specs.push(['Вік', p.age]);
    p.extra.forEach(function (x) { specs.push([x.k, x.v]); });

    var avail = p.availability === 'Немає'
      ? '<div class="avail none"><span class="dot"></span>Немає в наявності</div>'
      : p.availability === 'Під замовлення'
        ? '<div class="avail order"><span class="dot"></span>Під замовлення<span class="left" style="color:inherit;font-weight:500">термін уточнить продавець</span></div>'
        : '<div class="avail"><span class="dot"></span>В наявності' + (p.quantity !== null && p.quantity !== '' && p.quantity > 0 && p.quantity <= 5 ? '<span class="left">Залишилось ' + p.quantity + ' шт</span>' : '') + '</div>';

    var buy;
    if (p.availability === 'Немає') {
      buy = '<div class="buy-row"><button type="button" class="btn btn-lg" style="flex:1" data-notify="' + esc(p.id) + '">Повідомити, коли з\'явиться</button>' + favBtn(p, 'icon-btn fav-inline') + '</div>';
    } else {
      buy = '<div class="buy-row"><div class="qty" role="group" aria-label="Кількість"><button type="button" data-pq="-1" aria-label="Менше">−</button><span id="pq">1</span><button type="button" data-pq="1" aria-label="Більше">+</button></div>' +
        '<button type="button" class="btn btn-lg" style="flex:1" data-add="' + esc(p.id) + '" data-with-qty>' + (p.availability === 'Під замовлення' ? 'Замовити' : 'Додати в кошик') + '</button>' +
        favBtn(p, 'icon-btn fav-inline') + '</div>' +
        '<button type="button" class="btn btn-outline btn-lg" data-quick-buy="' + esc(p.id) + '">Купити в 1 клік — лише номер телефону</button>';
    }

    var related = DATA.products.filter(function (x) { return x.id !== p.id && x.category === p.category; })
      .sort(function (a, b) { return (a.subcategory === p.subcategory ? 0 : 1) - (b.subcategory === p.subcategory ? 0 : 1) || AV_RANK[a.availability] - AV_RANK[b.availability]; }).slice(0, 4);

    view.innerHTML =
      '<nav class="crumbs" aria-label="Навігація"><a href="#/">Головна</a><span>/</span><a href="' + catLink + '">' + esc(p.category) + '</a>' +
      (p.subcategory ? '<span>/</span><a href="' + catLink + '/' + enc(p.subcategory) + '">' + esc(p.subcategory) + '</a>' : '') + '</nav>' +
      '<div class="product">' +
        '<div class="gallery' + (imgs.length > 1 ? '' : ' single') + '">' +
          (imgs.length > 1 ? '<div class="thumbs">' + imgs.map(function (src, i) {
            return '<button type="button" class="thumb' + (i === 0 ? ' on' : '') + '" data-thumb="' + i + '" aria-label="Фото ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
          }).join('') + '</div>' : '') +
          '<div class="main-photo" id="mainPhoto" style="background:' + tint(p) + '">' + photo(p, 0, 200) + badgesHTML(p) + '</div>' +
        '</div>' +
        '<div class="pinfo">' +
          '<div style="display:flex;flex-direction:column;gap:10px"><span class="meta">' + esc([p.brand, p.subcategory || p.category].filter(Boolean).join(' · ')) + '</span><h1>' + esc(p.name) + '</h1></div>' +
          '<div class="price-row">' + '<span class="price' + (p.oldPrice > p.price ? ' sale' : '') + '">' + money(p.price) + '</span>' +
            (p.oldPrice > p.price ? '<s class="old" style="font-size:18px">' + money(p.oldPrice) + '</s><span class="save">економія ' + money(p.oldPrice - p.price) + '</span>' : '') + '</div>' +
          avail +
          (specs.length ? '<div class="specs">' + specs.map(function (s) { return '<div><span>' + esc(s[0]) + '</span><b>' + esc(s[1]) + '</b></div>'; }).join('') + '</div>' : '') +
          buy +
          '<div class="info-box">' +
            '<div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.5" aria-hidden="true"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg><div><b>Нова Пошта, Укрпошта</b><span>Відправка по всій Україні</span></div></div>' +
            '<div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.5" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg><div><b>Післяплата або передоплата</b><span>Післяплата — з частковою передоплатою</span></div></div>' +
            '<div><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.5" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/></svg><div><b>Є питання?</b><span>' + esc(CFG.CONTACT_NAME) + ': <a href="tel:' + esc(CFG.PHONE) + '">' + esc(CFG.PHONE_TEXT) + '</a></span></div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (p.description ? '<h2 class="desc-title">Опис</h2><div class="desc">' + esc(p.description) + '</div>' : '') +
      (related.length ? '<section class="section"><div class="section-head"><div><div class="eyebrow">' + esc(p.category) + '</div><h2>Вам також сподобається</h2></div></div><div class="grid">' + related.map(cardHTML).join('') + '</div></section>' : '') +
      recentHTML(p.id);
    window.scrollTo(0, 0);
  }

  function showPhoto(i) {
    var r = route(); var p = byId[r[1]]; if (!p || !p.images[i]) return;
    galleryIdx = i;
    var mp = $('#mainPhoto');
    var img = mp.querySelector('img'); if (img) img.src = p.images[i];
    $$('.thumb').forEach(function (t, j) { t.classList.toggle('on', j === i); });
  }

  /* ───────────── Інформаційні сторінки ───────────── */
  function renderInfo(which) {
    var v = $('#view');
    listKey = '';
    if (which === 'returns') {
      v.innerHTML = '<div style="max-width:760px"><div class="eyebrow">Інформація</div><h1 class="page-title">Обмін і повернення</h1><div class="desc" style="margin-top:20px">' +
        'Якщо товар прийшов пошкодженим або не відповідає опису — будь ласка, зв\'яжіться з нами протягом 14 днів після отримання. Ми разом знайдемо рішення: заміна або повернення коштів.\n\n' +
        'Зверніть увагу: відповідно до законодавства України парфумерно-косметичні товари належної якості обміну та поверненню не підлягають.\n\n' +
        'Телефон: ' + esc(CFG.PHONE_TEXT) + ' (' + esc(CFG.CONTACT_NAME) + ').</div></div>';
    } else {
      var free = Number((DATA.settings || {}).freeShippingFrom) || 0;
      v.innerHTML = '<div style="max-width:760px"><div class="eyebrow">Інформація</div><h1 class="page-title">Оплата і доставка</h1><div class="desc" style="margin-top:20px">' +
        'Доставка\nНовою Поштою або Укрпоштою по всій Україні. Вартість — за тарифами перевізника' + (free ? ', а від ' + money(free) + ' — безкоштовно' : '') + '.\n\n' +
        'Оплата\n• Післяплата з частковою передоплатою.\n• Повна передоплата на картку.\n\n' +
        'Як це працює\nПісля оформлення замовлення ' + esc(CFG.CONTACT_NAME) + ' зателефонує вам, підтвердить наявність, уточнить адресу доставки і реквізити для оплати.</div></div>';
    }
    window.scrollTo(0, 0);
  }

  /* ───────────── Обране ───────────── */
  function toggleFav(id) {
    var i = favs.indexOf(id);
    if (i >= 0) favs.splice(i, 1); else favs.unshift(id);
    store.set('favs', favs);
    $$('[data-fav="' + cssEsc(id) + '"]').forEach(function (b) {
      var on = favs.indexOf(id) >= 0;
      b.classList.toggle('on', on); b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Прибрати з обраного' : 'Додати в обране');
    });
    updateCounts();
    toast(i >= 0 ? 'Прибрано з обраного' : 'Додано в обране');
    if (route()[0] === 'fav') render();
  }
  function cssEsc(s) { return String(s).replace(/["\\]/g, '\\$&'); }

  /* ───────────── Кошик ───────────── */
  function saveCart() { store.set('cart', cart); }
  function cartTotal() { return cart.reduce(function (a, it) { var p = byId[it.id]; return a + (p ? p.price * it.qty : 0); }, 0); }
  function cartQty() { return cart.reduce(function (a, it) { return a + it.qty; }, 0); }

  function addToCart(id, qty, silent) {
    var p = byId[id]; if (!p) return;
    if (p.availability === 'Немає') return openNotify(id);
    qty = qty || 1;
    var it = cart.filter(function (x) { return x.id === id; })[0];
    var max = maxQty(p);
    if (it) it.qty = Math.min(max, it.qty + qty); else cart.push({ id: id, qty: Math.min(max, qty) });
    saveCart(); updateCounts(); track('cart', id);
    if (!silent) toast('Додано в кошик · ' + p.name);
  }

  function updateCounts() {
    var q = cartQty();
    $('#cartCount').textContent = q;
    var fc = $('#favCount'); fc.textContent = favs.length; fc.hidden = !favs.length;
    var mc = $('#mobileCart');
    mc.hidden = !q;
    $('#mobileCartLabel').textContent = 'Кошик · ' + q + ' ' + plural(q, 'товар', 'товари', 'товарів');
    $('#mobileCartSum').textContent = money(cartTotal());
  }

  var checkoutDraft = store.get('checkout', { phone: '+380 ', name: '', delivery: 'Нова Пошта', payment: 'Післяплата (часткова передоплата)' });

  function renderCart() {
    var body = $('#cartBody'), foot = $('#cartFoot');
    if (!cart.length) {
      body.innerHTML = '<div class="empty" style="padding:40px 0"><div class="modal-mark" style="margin:0 auto 16px">' + LILY_MARK + '</div><h3>Кошик порожній</h3><p>Загляньте в каталог — там багато приємного.</p></div>';
      foot.innerHTML = '<a class="btn btn-lg btn-block" href="#/all" data-close-drawer>До каталогу</a>';
      return;
    }
    var total = cartTotal();
    var free = Number((DATA.settings || {}).freeShippingFrom) || 0;
    var h = '';
    if (free > 0) {
      var left = free - total;
      h += '<div class="ship-bar"><span>' + (left > 0 ? 'Ще <b style="color:#7A3E36">' + money(left) + '</b> до безкоштовної доставки' : '<b style="color:#7A3E36">Доставка для вас безкоштовна</b>') + '</span>' +
        '<div class="track"><div class="fill" style="width:' + Math.min(100, Math.round(total / free * 100)) + '%"></div></div></div>';
    }
    h += cart.map(function (it) {
      var p = byId[it.id];
      return '<div class="line-item"><a class="thumbimg" href="#/p/' + enc(p.id) + '" style="background:' + tint(p) + '" data-close-drawer>' + photo(p, 0, 36) + '</a>' +
        '<div><a class="nm" href="#/p/' + enc(p.id) + '" data-close-drawer>' + esc(p.name) + '</a><div class="price-row"><span class="price' + (p.oldPrice > p.price ? ' sale' : '') + '" style="font-size:15px">' + money(p.price) + '</span></div>' +
        (p.availability === 'Під замовлення' ? '<span class="stock order">Під замовлення</span><br>' : '') +
        '<button type="button" class="rm" data-rm="' + esc(p.id) + '">Видалити</button></div>' +
        '<div class="line-right"><div class="qty sm" role="group" aria-label="Кількість"><button type="button" data-cq="-1" data-id="' + esc(p.id) + '" aria-label="Менше">−</button><span>' + it.qty + '</span><button type="button" data-cq="1" data-id="' + esc(p.id) + '" aria-label="Більше">+</button></div></div></div>';
    }).join('');
    var d = checkoutDraft;
    h += '<div style="height:1px;background:var(--line)"></div>' +
      '<form id="orderForm" novalidate style="display:flex;flex-direction:column;gap:14px">' +
      '<label class="field"><span>Номер телефону <span class="req">*</span></span><input class="input" id="oPhone" type="tel" inputmode="tel" autocomplete="tel" required value="' + esc(d.phone) + '"></label>' +
      '<span class="err" id="oErr" hidden></span>' +
      '<label class="field"><span>Ім\'я <span class="hint">(необов\'язково)</span></span><input class="input" id="oName" type="text" autocomplete="name" placeholder="Як до вас звертатися?" value="' + esc(d.name) + '"></label>' +
      '<fieldset><legend>Доставка</legend><div class="choices">' +
        ['Нова Пошта', 'Укрпошта'].map(function (x) { return '<label class="choice"><input type="radio" name="delivery" value="' + x + '"' + (d.delivery === x ? ' checked' : '') + '>' + x + '</label>'; }).join('') + '</div></fieldset>' +
      '<fieldset><legend>Оплата</legend><div class="choices">' +
        ['Післяплата (часткова передоплата)', 'Передоплата'].map(function (x) { return '<label class="choice"><input type="radio" name="payment" value="' + x + '"' + (d.payment === x ? ' checked' : '') + '>' + x + '</label>'; }).join('') + '</div></fieldset>' +
      '</form>';
    body.innerHTML = h;
    foot.innerHTML = '<div class="total-row"><span>Разом</span><b>' + money(total) + '</b></div>' +
      '<button type="submit" form="orderForm" class="btn btn-lg btn-block" id="orderBtn">Купити</button>' +
      '<span style="font-size:12px;color:var(--muted);text-align:center">' + esc(CFG.CONTACT_NAME) + ' зателефонує вам для підтвердження замовлення</span>';
  }

  function normPhone(raw) {
    var d = String(raw || '').replace(/\D/g, '');
    if (d.length === 10 && d[0] === '0') d = '38' + d;
    if (d.length === 9) d = '380' + d;
    return /^380\d{9}$/.test(d) ? '+' + d : '';
  }

  function submitOrder(e) {
    e.preventDefault();
    var form = $('#orderForm');
    var phoneEl = $('#oPhone');
    var phone = normPhone(phoneEl.value);
    var err = $('#oErr');
    if (!phone) {
      phoneEl.classList.add('bad'); err.textContent = 'Вкажіть номер телефону, наприклад +380 67 123 45 67'; err.hidden = false; phoneEl.focus(); return;
    }
    phoneEl.classList.remove('bad'); err.hidden = true;
    var payload = {
      phone: phone,
      name: $('#oName').value.trim(),
      delivery: (form.querySelector('[name=delivery]:checked') || {}).value || 'Нова Пошта',
      payment: (form.querySelector('[name=payment]:checked') || {}).value || 'Післяплата (часткова передоплата)',
      items: cart.map(function (it) { return { id: it.id, qty: it.qty }; })
    };
    checkoutDraft = { phone: phoneEl.value, name: payload.name, delivery: payload.delivery, payment: payload.payment };
    store.set('checkout', checkoutDraft);
    var btn = $('#orderBtn'); btn.disabled = true; btn.textContent = 'Надсилаємо…';
    API.call('order', payload).then(function (res) {
      cart = []; saveCart(); updateCounts();
      closeAll();
      openModal('<div class="modal-mark">' + LILY_MARK + '</div><h2 id="modalTitle">Дякуємо за замовлення!</h2><p>Найближчим часом з Вами зв\'яжеться продавець!</p>' +
        (res && res.id ? '<p style="font-size:13px;color:var(--muted)">Номер замовлення: ' + esc(res.id) + '</p>' : '') +
        '<button type="button" class="btn btn-outline btn-lg" data-close-modal>Повернутися до покупок</button>');
      API.call('catalog').then(function (d) { store.set('catalog', d); setData(d); if (route()[0] !== 'p') renderListing(); }).catch(function () {});
    }).catch(function (e2) {
      btn.disabled = false; btn.textContent = 'Купити';
      err.textContent = e2.message || 'Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.'; err.hidden = false;
    });
  }

  /* ───────────── Модальні вікна ───────────── */
  var lastFocus = null;
  function openModal(html) {
    lastFocus = document.activeElement;
    $('#modalBox').innerHTML = '<button type="button" class="icon-btn modal-close" data-close-modal aria-label="Закрити">' + CLOSE + '</button>' + html;
    $('#modal').hidden = false;
    $('#overlay').classList.add('on');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var f = $('#modalBox input, #modalBox .btn'); if (f) f.focus(); }, 30);
  }
  function closeModal() {
    if ($('#modal').hidden) return;
    $('#modal').hidden = true;
    if (!$('.drawer.on') && !$('#sidebar.on')) { $('#overlay').classList.remove('on'); document.body.style.overflow = ''; }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function openNotify(id) {
    var p = byId[id]; if (!p) return;
    openModal('<div class="modal-mark">' + LILY_MARK + '</div><h2 id="modalTitle">Повідомимо, щойно з\'явиться</h2><p>' + esc(p.name) + '</p>' +
      '<form id="notifyForm" data-id="' + esc(id) + '" novalidate><label class="field">Ваш номер телефону<input class="input" id="nPhone" type="tel" inputmode="tel" autocomplete="tel" value="' + esc(checkoutDraft.phone || '+380 ') + '"></label>' +
      '<span class="err" id="nErr" hidden></span><button type="submit" class="btn btn-lg btn-block">Повідомити мене</button></form>');
  }
  function submitNotify(e) {
    e.preventDefault();
    var f = e.target, phone = normPhone($('#nPhone').value);
    if (!phone) { $('#nErr').textContent = 'Вкажіть номер телефону'; $('#nErr').hidden = false; return; }
    var b = f.querySelector('button'); b.disabled = true; b.textContent = 'Надсилаємо…';
    API.call('notify', { phone: phone, productId: f.getAttribute('data-id') }).then(function () {
      closeModal(); toast('Дякуємо! ' + CFG.CONTACT_NAME + ' повідомить вам, щойно товар з\'явиться');
    }).catch(function (er) { b.disabled = false; b.textContent = 'Повідомити мене'; $('#nErr').textContent = er.message; $('#nErr').hidden = false; });
  }

  function openContacts() {
    var s = DATA.settings || {};
    var items = '<a href="tel:' + esc(CFG.PHONE) + '"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.6" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg><span>' + esc(CFG.PHONE_TEXT) + '<br><small style="font-weight:400;color:var(--muted)">Зателефонувати</small></span></a>';
    items += messengers().map(function (m) { return '<a href="' + esc(m.href) + '" target="_blank" rel="noopener">' + m.icon + '<span>' + m.name + '</span></a>'; }).join('');
    if (s.instagramUrl) items += '<a href="' + esc(s.instagramUrl) + '" target="_blank" rel="noopener"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9A5249" stroke-width="1.6" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg><span>Instagram</span></a>';
    openModal('<h2 id="modalTitle">Контакти</h2><p>' + esc(CFG.CONTACT_NAME) + ' відповість на всі питання</p><div class="contact-list">' + items + '</div>');
  }

  /* ───────────── Панелі ───────────── */
  function openDrawer(id) {
    closeAll(true);
    var d = $('#' + id);
    if (id === 'cart') renderCart();
    if (id === 'filters') renderFilterPanel();
    d.classList.add('on'); d.setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('on');
    document.body.style.overflow = 'hidden';
    setTimeout(function () { var b = d.querySelector('button, a, input'); if (b) b.focus(); }, 50);
  }
  function closeAll(keepOverlay) {
    $$('.drawer.on').forEach(function (d) { d.classList.remove('on'); d.setAttribute('aria-hidden', 'true'); });
    $('#sidebar').classList.remove('on');
    if (!keepOverlay) {
      $('#modal').hidden = true;
      $('#overlay').classList.remove('on');
      document.body.style.overflow = '';
    }
  }

  var toastTimer;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2400);
  }

  /* ───────────── Пошук ───────────── */
  var searchTimer, lastLogged = '';
  function onSearchInput() {
    var q = $('#q').value.trim();
    $('#qClear').hidden = !q;
    clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
      if (q) {
        var target = '#/s/' + enc(q);
        if (route()[0] === 's') history.replaceState(null, '', target); else history.pushState(null, '', target);
        render();
        if (q.length >= 2 && q !== lastLogged) {
          lastLogged = q;
          setTimeout(function () {
            if ($('#q').value.trim() !== q) return;
            var n = DATA.products.filter(function (p) { return matches(p, q); }).length;
            track('search', q); if (!n) track('search0', q);
          }, 1200);
        }
      } else if (route()[0] === 's') { location.hash = '#/'; }
    }, 250);
  }

  /* ───────────── Події ───────────── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a');
    if (!t) { if (e.target.id === 'overlay' || e.target.id === 'modal') { closeModal(); closeAll(); } return; }
    var v;
    if ((v = t.getAttribute('data-add')) !== null) {
      var qty = t.hasAttribute('data-with-qty') ? Number(($('#pq') || {}).textContent) || 1 : 1;
      addToCart(v, qty);
      return;
    }
    if ((v = t.getAttribute('data-quick-buy')) !== null) { addToCart(v, Number(($('#pq') || {}).textContent) || 1, true); openDrawer('cart'); setTimeout(function () { var ph = $('#oPhone'); if (ph) ph.focus(); }, 300); return; }
    if ((v = t.getAttribute('data-fav')) !== null) { e.preventDefault(); toggleFav(v); return; }
    if ((v = t.getAttribute('data-notify')) !== null) { openNotify(v); return; }
    if (t.hasAttribute('data-open-contacts')) { closeAll(); openContacts(); return; }
    if (t.hasAttribute('data-close-modal')) { closeModal(); return; }
    if (t.hasAttribute('data-close-drawer')) { closeAll(); return; }
    if (t.hasAttribute('data-open-filters')) { openDrawer('filters'); return; }
    if (t.hasAttribute('data-reset-filters')) { F = freshFilters(); filtersChanged(); return; }
    if ((v = t.getAttribute('data-thumb')) !== null) { showPhoto(Number(v)); return; }
    if ((v = t.getAttribute('data-pq')) !== null) {
      var pel = $('#pq'), p = byId[route()[1]];
      pel.textContent = Math.max(1, Math.min(maxQty(p), Number(pel.textContent) + Number(v)));
      return;
    }
    if ((v = t.getAttribute('data-cq')) !== null) {
      var id = t.getAttribute('data-id');
      cart.forEach(function (it) { if (it.id === id) it.qty = Math.max(1, Math.min(maxQty(byId[id]), it.qty + Number(v))); });
      saveCart(); updateCounts(); saveDraftFromForm(); renderCart(); return;
    }
    if ((v = t.getAttribute('data-rm')) !== null) { cart = cart.filter(function (it) { return it.id !== v; }); saveCart(); updateCounts(); saveDraftFromForm(); renderCart(); return; }
    if ((v = t.getAttribute('data-quick')) !== null) {
      if (v === 'instock') F.avail = (F.avail.length === 1 && F.avail[0] === 'В наявності') ? [] : ['В наявності'];
      if (v === 'sale') F.sale = !F.sale;
      if (v === 'new') F.isNew = !F.isNew;
      filtersChanged(); return;
    }
    if ((v = t.getAttribute('data-unset')) !== null) {
      var val = t.getAttribute('data-val');
      if (v === 'price') { F.min = ''; F.max = ''; }
      else if (v === 'extra') { var kv = val.split('\u0001'); toggle(F.extra[kv[0]], kv[1]); }
      else toggle(F[v], val);
      filtersChanged(); return;
    }
    if ((v = t.getAttribute('data-f')) !== null) {
      var fv = t.getAttribute('data-v');
      if (v.indexOf('extra:') === 0) { var k = v.slice(6); F.extra[k] = F.extra[k] || []; toggle(F.extra[k], fv); }
      else toggle(F[v], fv);
      filtersChanged(); return;
    }
    if ((v = t.getAttribute('data-fbool')) !== null) { F[v] = !F[v]; filtersChanged(); return; }
    if (t.hasAttribute('data-close')) { closeAll(); }
  });

  function saveDraftFromForm() {
    var ph = $('#oPhone'); if (!ph) return;
    var f = $('#orderForm');
    checkoutDraft = { phone: ph.value, name: $('#oName').value, delivery: (f.querySelector('[name=delivery]:checked') || {}).value, payment: (f.querySelector('[name=payment]:checked') || {}).value };
    store.set('checkout', checkoutDraft);
  }

  document.addEventListener('submit', function (e) {
    if (e.target.id === 'orderForm') submitOrder(e);
    else if (e.target.id === 'notifyForm') submitNotify(e);
    else if (e.target.id === 'searchForm') { e.preventDefault(); onSearchInput(); $('#q').blur(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'sortSel') { sortBy = e.target.value; renderListing(); }
    if (e.target.id === 'fMin' || e.target.id === 'fMax') { F[e.target.id === 'fMin' ? 'min' : 'max'] = e.target.value === '' ? '' : Math.max(0, Number(e.target.value)); filtersChanged(); }
    if (e.target.closest && e.target.closest('#orderForm')) saveDraftFromForm();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeModal(); closeAll(); } });

  $('#q').addEventListener('input', onSearchInput);
  $('#qClear').addEventListener('click', function () { $('#q').value = ''; onSearchInput(); $('#q').focus(); });
  $('#cartBtn').addEventListener('click', function () { openDrawer('cart'); });
  $('#mobileCart').addEventListener('click', function () { openDrawer('cart'); });
  $('#burger').addEventListener('click', function () { $('#sidebar').classList.add('on'); $('#overlay').classList.add('on'); document.body.style.overflow = 'hidden'; });
  $('#overlay').addEventListener('click', function () { closeModal(); closeAll(); });
  $('#fApply').addEventListener('click', function () { closeAll(); });
  $('#fReset').addEventListener('click', function () { F = freshFilters(); filtersChanged(); });
  window.addEventListener('hashchange', function () { render(); if (route()[0] !== 'p') window.scrollTo(0, 0); });

  updateCounts();
  applySettings();
  load();
})();
