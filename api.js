/* Зв'язок сайту з Google Apps Script + демо-режим, коли адреса ще не вказана. */
(function () {
  'use strict';
  var CFG = window.LILY_CONFIG || {};
  var DEMO = !CFG.API_URL;

  function call(action, data) {
    var body = Object.assign({ action: action }, data || {});
    if (DEMO) return Demo.handle(body);
    return fetch(CFG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    })
      .then(function (r) { return r.json(); })
      .then(function (json) {
        if (!json.ok) throw new Error(json.error || 'Помилка сервера');
        return json.data;
      });
  }

  function beacon(action, data) {
    var body = Object.assign({ action: action }, data || {});
    if (DEMO) { Demo.handle(body); return; }
    var s = JSON.stringify(body);
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(CFG.API_URL, new Blob([s], { type: 'text/plain;charset=utf-8' }))) return;
    } catch (e) { /* ігноруємо */ }
    fetch(CFG.API_URL, { method: 'POST', body: s, keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' } }).catch(function () {});
  }

  /* ───────────── Демо-база в браузері ───────────── */
  var Demo = (function () {
    var KEY = 'lily_demo_v1';
    var PASSWORD = 'demo12';

    function seed() {
      var cats = [
        ['Доглядова косметика', ['Для обличчя', 'Для рук', 'Для тіла', 'Для волосся']],
        ['Декоративна косметика', ['Обличчя', 'Очі', 'Губи', 'Нігті']],
        ['Дитячі іграшки', ["М'які іграшки", 'Розвивальні', 'Для немовлят']],
        ['Декор для дому', ['Свічки та аромати', 'Вази', 'Текстиль']],
        ['Освітлення', ['Нічники', 'Настільні лампи', 'Гірлянди']]
      ];
      var categories = [];
      cats.forEach(function (c) { c[1].forEach(function (s) { categories.push({ category: c[0], subcategory: s }); }); });
      function P(id, name, cat, sub, price, old, av, qty, age, brand, badges, gifts, desc, extra) {
        return { id: id, active: true, name: name, category: cat, subcategory: sub, price: price, oldPrice: old || 0,
          availability: av, quantity: qty, age: age, brand: brand, badges: badges, gifts: gifts, description: desc,
          images: [], extra: extra, created: new Date().toISOString() };
      }
      var products = [
        P('d1', 'Зволожувальна сироватка з гіалуроновою кислотою', 'Доглядова косметика', 'Для обличчя', 520, 650, 'В наявності', 2, '16+', 'Demo Beauty', ['Хіт'], ['Мамі', 'Подрузі'],
          'Легка сироватка глибоко зволожує шкіру та повертає їй сяйво. Підходить для щоденного догляду вранці та ввечері.\nНанесіть 2–3 краплі на чисту шкіру перед кремом.',
          [{ k: "Об'єм", v: '30 мл' }, { k: 'Тип шкіри', v: 'Суха' }]),
        P('d2', 'Крем для рук з олією ши та ваніллю', 'Доглядова косметика', 'Для рук', 245, 0, 'В наявності', 12, '', 'Demo Beauty', ['Новинка'], ['Подрузі'],
          'Живильний крем швидко вбирається і не залишає липкості.', [{ k: "Об'єм", v: '75 мл' }, { k: 'Тип шкіри', v: 'Нормальна' }]),
        P('d3', 'Ароматична свічка «Кашемір» у склі', 'Декор для дому', 'Свічки та аромати', 390, 0, 'В наявності', 8, '', 'Home Glow', ['Хіт'], ['Мамі', 'Подрузі', 'До свят'],
          'Соєвий віск, бавовняний гніт, теплий аромат кашеміру та ванілі. Горить близько 40 годин.', [{ k: 'Колір', v: 'Молочний' }, { k: 'Час горіння', v: '40 год' }]),
        P('d4', 'Нічник «Хмаринка» з теплим світлом', 'Освітлення', 'Нічники', 690, 0, 'Під замовлення', null, '0+', 'Soft Light', [], ['Дитині'],
          'М\'яке тепле світло для дитячої кімнати. Живлення від USB, таймер вимкнення.', [{ k: 'Колір', v: 'Білий' }, { k: 'Живлення', v: 'USB' }]),
        P('d5', 'Помада-бальзам, відтінок «Пудра»', 'Декоративна косметика', 'Губи', 305, 360, 'В наявності', 5, '', 'Demo Beauty', [], ['Подрузі'],
          'Доглядає за губами і дає легкий природний відтінок.', [{ k: 'Колір', v: 'Пудровий' }]),
        P('d6', "М'який ведмедик з органічної бавовни", 'Дитячі іграшки', "М'які іграшки", 450, 0, 'В наявності', 1, '0+', 'Little Joy', ['Хіт'], ['Дитині', 'До свят'],
          'Приємний на дотик ведмедик, можна прати в пральній машині.', [{ k: 'Розмір', v: '30 см' }, { k: 'Колір', v: 'Бежевий' }]),
        P('d7', 'Керамічна ваза ручної роботи, молочна', 'Декор для дому', 'Вази', 560, 0, 'Немає', 0, '', 'Home Glow', [], ['Мамі'],
          'Ваза з матовою глазур\'ю, кожна трохи унікальна.', [{ k: 'Колір', v: 'Молочний' }, { k: 'Висота', v: '22 см' }]),
        P('d8', 'Суха олійка для тіла з мерехтінням', 'Доглядова косметика', 'Для тіла', 420, 0, 'В наявності', 7, '16+', 'Demo Beauty', ['Новинка'], ['Подрузі', 'До свят'],
          'Легка суха олійка з ледь помітним сяйвом.', [{ k: "Об'єм", v: '100 мл' }]),
        P('d9', 'Розвивальний сортер «Лісові друзі»', 'Дитячі іграшки', 'Розвивальні', 380, 440, 'В наявності', 4, '1+', 'Little Joy', [], ['Дитині'],
          'Дерев\'яний сортер з безпечними фарбами.', [{ k: 'Матеріал', v: 'Дерево' }]),
        P('d10', 'Гірлянда «Теплі кульки», 3 м', 'Освітлення', 'Гірлянди', 330, 0, 'В наявності', 15, '', 'Soft Light', ['Новинка'], ['До свят'],
          'Тепле біле світло, 20 кульок, живлення від батарейок.', [{ k: 'Довжина', v: '3 м' }, { k: 'Колір', v: 'Теплий білий' }])
      ];
      return {
        products: products,
        categories: categories,
        settings: { announcement: 'Відправка Новою Поштою та Укрпоштою · Післяплата з частковою передоплатою', freeShippingFrom: '1500', messengerUrl: '', instagramUrl: '' },
        orders: [],
        events: []
      };
    }

    function load() {
      try { var d = JSON.parse(localStorage.getItem(KEY)); if (d && d.products) return d; } catch (e) { /* немає */ }
      var s = seed(); save(s); return s;
    }
    function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* переповнено */ } }
    function clone(x) { return JSON.parse(JSON.stringify(x)); }
    function tokenOk(t) { try { return t && t === sessionStorage.getItem('lily_demo_token'); } catch (e) { return false; } }
    function phoneOk(raw) {
      var d = String(raw || '').replace(/\D/g, '');
      if (d.length === 10 && d[0] === '0') d = '38' + d;
      if (!/^380\d{9}$/.test(d)) throw new Error('Вкажіть номер телефону у форматі +380XXXXXXXXX');
      return '+' + d;
    }

    function run(b) {
      var db = load();
      switch (b.action) {
        case 'catalog':
          return { products: db.products.filter(function (p) { return p.active; }), categories: db.categories, settings: db.settings };
        case 'event':
          (b.events || []).forEach(function (e) { db.events.push({ date: new Date().toISOString(), type: e.type, value: String(e.value || ''), session: b.session }); });
          if (db.events.length > 5000) db.events = db.events.slice(-5000);
          save(db); return true;
        case 'order': {
          var phone = phoneOk(b.phone), lines = [], ids = [], total = 0;
          (b.items || []).forEach(function (it) {
            var p = db.products.filter(function (x) { return x.id === it.id; })[0];
            if (!p) return;
            var q = Math.max(1, parseInt(it.qty, 10) || 1);
            total += p.price * q; ids.push(p.id);
            lines.push(p.name + ' × ' + q + ' = ' + p.price * q + ' грн');
            if (p.quantity !== null && p.quantity !== '' && !isNaN(p.quantity)) {
              p.quantity = Math.max(0, p.quantity - q);
              if (p.quantity === 0 && p.availability === 'В наявності') p.availability = 'Немає';
            }
          });
          if (!lines.length) throw new Error('Кошик порожній');
          var id = 'L-' + (1001 + db.orders.length);
          db.orders.push({ id: id, date: new Date().toISOString(), type: 'Замовлення', status: 'Нове', phone: phone, name: b.name || '', delivery: b.delivery, payment: b.payment, items: lines.join('\n'), total: total, productIds: ids.join(',') });
          save(db); return { id: id, total: total };
        }
        case 'notify': {
          var ph = phoneOk(b.phone);
          var pr = db.products.filter(function (x) { return x.id === b.productId; })[0];
          db.orders.push({ id: 'N-' + Date.now().toString(36), date: new Date().toISOString(), type: 'Повідомити про наявність', status: 'Нове', phone: ph, name: '', delivery: '', payment: '', items: pr ? pr.name : '', total: '', productIds: b.productId });
          save(db); return { saved: true };
        }
        case 'login':
          if (b.password !== PASSWORD) throw new Error('Невірний пароль (у демо-режимі пароль: demo12)');
          var t = 'demo-' + Math.random().toString(36).slice(2);
          try { sessionStorage.setItem('lily_demo_token', t); } catch (e) { /* ignore */ }
          return { token: t };
      }
      if (!tokenOk(b.token)) throw new Error('AUTH');
      switch (b.action) {
        case 'adminData': return { products: db.products, categories: db.categories, settings: db.settings };
        case 'saveProduct': {
          var np = b.product; if (!np.name) throw new Error('Вкажіть назву товару');
          if (!np.id) { np.id = 'p' + Date.now().toString(36); np.created = new Date().toISOString(); db.products.push(np); }
          else db.products = db.products.map(function (x) { return x.id === np.id ? Object.assign({}, x, np) : x; });
          save(db); return { id: np.id };
        }
        case 'deleteProduct': db.products = db.products.filter(function (x) { return x.id !== b.id; }); save(db); return { deleted: true };
        case 'uploadImage': return { url: 'data:' + b.mime + ';base64,' + b.data };
        case 'orders': return clone(db.orders).reverse();
        case 'setOrderStatus': db.orders.forEach(function (o) { if (o.id === b.id) o.status = b.status; }); save(db); return { id: b.id, status: b.status };
        case 'saveCategories': {
          var rows = [];
          (b.categories || []).forEach(function (c) {
            if (!c.name) return;
            if (!c.subs || !c.subs.length) rows.push({ category: c.name, subcategory: '' });
            (c.subs || []).forEach(function (s) { rows.push({ category: c.name, subcategory: s }); });
          });
          db.categories = rows; save(db); return { saved: rows.length };
        }
        case 'saveSettings': Object.assign(db.settings, b.settings || {}); save(db); return db.settings;
        case 'report': return demoReport(db, Number(b.days) || 30);
        case 'changePassword': throw new Error('У демо-режимі пароль не змінюється');
        case 'testTelegram': return { telegram: false, demo: true };
        case 'backupNow': return { sent: false, demo: true };
      }
      throw new Error('Невідома дія');
    }

    function demoReport(db, days) {
      var since = Date.now() - days * 864e5;
      var byDay = {}, key = function (d) { return new Date(d).toISOString().slice(0, 10); };
      for (var i = days - 1; i >= 0; i--) byDay[key(Date.now() - i * 864e5)] = { visits: 0, orders: 0, revenue: 0 };
      var sessions = {}, views = {}, searches = {}, nf = {}, carts = {}, sold = {}, names = {};
      db.products.forEach(function (p) { names[p.id] = p.name; });
      db.events.forEach(function (e) {
        if (new Date(e.date) < since) return;
        if (e.type === 'visit') { if (byDay[key(e.date)]) byDay[key(e.date)].visits++; sessions[e.session] = 1; }
        if (e.type === 'view') views[e.value] = (views[e.value] || 0) + 1;
        if (e.type === 'search') searches[e.value.toLowerCase()] = (searches[e.value.toLowerCase()] || 0) + 1;
        if (e.type === 'search0') nf[e.value.toLowerCase()] = (nf[e.value.toLowerCase()] || 0) + 1;
        if (e.type === 'cart') carts[e.value] = (carts[e.value] || 0) + 1;
      });
      var orders = 0, revenue = 0;
      db.orders.forEach(function (o) {
        if (o.type !== 'Замовлення' || o.status === 'Скасоване' || new Date(o.date) < since) return;
        orders++; revenue += Number(o.total) || 0;
        if (byDay[key(o.date)]) { byDay[key(o.date)].orders++; byDay[key(o.date)].revenue += Number(o.total) || 0; }
        String(o.items).split('\n').forEach(function (l) { var m = l.match(/^(.*) × (\d+) =/); if (m) sold[m[1]] = (sold[m[1]] || 0) + Number(m[2]); });
      });
      function top(o, map) {
        return Object.keys(o).map(function (k) { return { name: map ? (names[k] || '(видалений товар)') : k, count: o[k] }; })
          .sort(function (a, b) { return b.count - a.count; }).slice(0, 15);
      }
      var visits = Object.keys(byDay).reduce(function (a, k) { return a + byDay[k].visits; }, 0);
      return {
        days: Object.keys(byDay).map(function (k) { return { day: k, visits: byDay[k].visits, orders: byDay[k].orders, revenue: byDay[k].revenue }; }),
        totals: { visits: visits, visitors: Object.keys(sessions).length, orders: orders, revenue: revenue },
        topViews: top(views, true), topCart: top(carts, true), topSold: top(sold, false), topSearch: top(searches, false), notFound: top(nf, false)
      };
    }

    return {
      handle: function (b) {
        return new Promise(function (resolve, reject) {
          setTimeout(function () { try { resolve(clone(run(b))); } catch (e) { reject(e); } }, 150);
        });
      }
    };
  })();

  window.LilyAPI = { call: call, beacon: beacon, demo: DEMO };
})();
