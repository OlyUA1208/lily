/* Lily — адмінка */
(function () {
  'use strict';
  var API = window.LilyAPI;
  var CFG = window.LILY_CONFIG || {};

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₴'; }
  function fmtDate(iso) { var d = new Date(iso); if (isNaN(d)) return ''; return d.toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }

  var token = null;
  try { token = sessionStorage.getItem('lily_admin_token'); } catch (e) { /* ignore */ }
  var DATA = { products: [], categories: [], settings: {} };
  var tab = 'products';
  var ORDER_STATUSES = ['Нове', 'Підтверджене', 'Відправлене', 'Виконане', 'Скасоване'];
  var AVAIL = ['В наявності', 'Під замовлення', 'Немає'];
  var GIFTS = ['Мамі', 'Подрузі', 'Дитині', 'До свят'];
  var FIELD_SUGGEST = ["Об'єм", 'Тип шкіри', 'Колір', 'Відтінок', 'Країна', 'Матеріал', 'Розмір', 'Вага', 'Склад', 'Тип цоколя', 'Потужність', 'Живлення', 'Довжина', 'Висота', 'Аромат', 'Час горіння'];

  function call(action, data) {
    return API.call(action, Object.assign({ token: token }, data || {})).catch(function (e) {
      if (e.message === 'AUTH') { logout(); throw new Error('Сесія завершилась — увійдіть ще раз'); }
      throw e;
    });
  }

  var toastT;
  function toast(msg) { var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('on'); }, 2600); }
  function fail(e) { toast('Помилка: ' + (e && e.message || e)); }

  /* ───────────── Вхід ───────────── */
  function showLogin() { $('#login').hidden = false; $('#app').hidden = true; setTimeout(function () { $('#pw').focus(); }, 50); }
  function logout() { token = null; try { sessionStorage.removeItem('lily_admin_token'); } catch (e) { /* ignore */ } showLogin(); }
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Перевіряємо…';
    API.call('login', { password: $('#pw').value }).then(function (r) {
      token = r.token; try { sessionStorage.setItem('lily_admin_token', token); } catch (e2) { /* ignore */ }
      $('#pw').value = ''; $('#loginErr').hidden = true;
      start();
    }).catch(function (er) { $('#loginErr').textContent = er.message; $('#loginErr').hidden = false; })
      .then(function () { btn.disabled = false; btn.textContent = 'Увійти'; });
  });
  $('#logout').addEventListener('click', logout);

  function start() {
    $('#login').hidden = true; $('#app').hidden = false;
    $('#panel').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    return reloadData().then(function () { showTab(tab); refreshNewOrders(); });
  }
  function reloadData() { return call('adminData').then(function (d) { DATA = d; DATA.products.forEach(normP); }); }
  function normP(p) { p.images = p.images || []; p.extra = p.extra || []; p.badges = p.badges || []; p.gifts = p.gifts || []; }

  /* ───────────── Вкладки ───────────── */
  $$('.a-tabs button').forEach(function (b) { b.addEventListener('click', function () { showTab(b.getAttribute('data-tab')); }); });
  function showTab(t) {
    tab = t;
    $$('.a-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-tab') === t); });
    ({ products: renderProducts, orders: renderOrders, reports: renderReports, categories: renderCategories, settings: renderSettings })[t]();
    window.scrollTo(0, 0);
  }

  function catMap() {
    var map = {}, order = [];
    DATA.categories.forEach(function (r) { if (!r.category) return; if (!map[r.category]) { map[r.category] = []; order.push(r.category); } if (r.subcategory && map[r.category].indexOf(r.subcategory) < 0) map[r.category].push(r.subcategory); });
    DATA.products.forEach(function (p) { if (!p.category) return; if (!map[p.category]) { map[p.category] = []; order.push(p.category); } if (p.subcategory && map[p.category].indexOf(p.subcategory) < 0) map[p.category].push(p.subcategory); });
    return { map: map, order: order };
  }

  /* ───────────── Товари ───────────── */
  var pSearch = '', pCat = '';
  function availPill(a) { return '<span class="pill ' + (a === 'Немає' ? 'none' : a === 'Під замовлення' ? 'order' : 'ok') + '">' + esc(a) + '</span>'; }
  function thumb(p) {
    if (p.images[0]) return '<div class="pthumb"><img src="' + esc(p.images[0]) + '" alt="" loading="lazy"></div>';
    return '<div class="pthumb" style="background:#F3E3DE"><svg width="28" height="28" viewBox="0 0 48 48" fill="none" stroke="#9A5249" stroke-width="1.6" aria-hidden="true"><path d="M24 6C29 14 29 24 24 32C19 24 19 14 24 6Z"/><path d="M24 32V42"/></svg></div>';
  }
  function renderProducts() {
    var cm = catMap();
    var list = DATA.products.filter(function (p) {
      if (pCat && p.category !== pCat) return false;
      if (pSearch && (p.name + ' ' + p.brand + ' ' + p.subcategory).toLowerCase().indexOf(pSearch.toLowerCase()) < 0) return false;
      return true;
    }).sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
    $('#panel').innerHTML =
      '<div class="a-title"><h1>Товари</h1><button type="button" class="btn btn-lg" id="addP">+ Додати товар</button></div>' +
      '<div class="a-bar"><label class="sr-only" for="pSearch">Пошук товару</label><input class="input" id="pSearch" type="search" placeholder="Пошук за назвою або брендом" value="' + esc(pSearch) + '">' +
      '<label class="sr-only" for="pCat">Категорія</label><select class="input" id="pCat"><option value="">Усі категорії</option>' + cm.order.map(function (c) { return '<option' + (c === pCat ? ' selected' : '') + '>' + esc(c) + '</option>'; }).join('') + '</select>' +
      '<span style="color:var(--muted);font-size:14px">' + list.length + ' з ' + DATA.products.length + '</span></div>' +
      '<div class="card-box plist">' +
      '<div class="prow head"><span></span><span>Назва</span><span>Ціна</span><span>Наявність</span><span>К-сть</span><span></span></div>' +
      (list.length ? list.map(function (p) {
        return '<div class="prow' + (p.active === false ? ' off' : '') + '">' + thumb(p) +
          '<div class="c-name"><div class="pname">' + esc(p.name) + (p.active === false ? ' <span class="pill none">приховано</span>' : '') + '</div><div class="psub">' + esc([p.category, p.subcategory].filter(Boolean).join(' / ')) + '</div></div>' +
          '<div class="c-meta"><div class="c-price"><b>' + money(p.price) + '</b>' + (p.oldPrice > p.price ? ' <s style="color:var(--muted);font-size:13px">' + money(p.oldPrice) + '</s>' : '') + '</div>' +
          '<div class="c-av">' + availPill(p.availability) + '</div>' +
          '<div class="c-qty">' + (p.quantity === null || p.quantity === '' ? '—' : esc(p.quantity)) + '</div></div>' +
          '<div class="pactions"><button type="button" class="link-btn" data-edit="' + esc(p.id) + '">Редагувати</button><button type="button" class="link-btn" data-copy="' + esc(p.id) + '">Копія</button><button type="button" class="link-btn danger" data-del="' + esc(p.id) + '">Видалити</button></div></div>';
      }).join('') : '<div class="empty"><h3>Товарів ще немає</h3><p>Натисніть «Додати товар», щоб створити перший.</p></div>') +
      '</div>';
    $('#addP').onclick = function () { openEditor(null); };
    $('#pSearch').oninput = function (e) { pSearch = e.target.value; var pos = e.target.selectionStart; renderProducts(); var el = $('#pSearch'); el.focus(); el.setSelectionRange(pos, pos); };
    $('#pCat').onchange = function (e) { pCat = e.target.value; renderProducts(); };
  }

  /* ───────────── Редактор товару ───────────── */
  var ed = null; // редагований товар
  function openEditor(id, copy) {
    var src = id ? DATA.products.filter(function (p) { return p.id === id; })[0] : null;
    ed = src ? JSON.parse(JSON.stringify(src)) : { name: '', category: pCat || '', subcategory: '', price: '', oldPrice: '', availability: 'В наявності', quantity: '', age: '', brand: '', badges: [], gifts: [], description: '', images: [], extra: [], active: true };
    if (copy) { delete ed.id; ed.name = ed.name + ' (копія)'; }
    normP(ed);
    $('#edTitle').textContent = ed.id ? 'Редагування' : 'Новий товар';
    renderEditor();
    $('#editor').classList.add('on'); $('#editor').setAttribute('aria-hidden', 'false');
    $('#overlay').classList.add('on'); document.body.style.overflow = 'hidden';
    setTimeout(function () { $('#eName').focus(); }, 60);
  }
  function closeEditor() {
    $('#editor').classList.remove('on'); $('#editor').setAttribute('aria-hidden', 'true');
    $('#overlay').classList.remove('on'); document.body.style.overflow = '';
  }

  function renderEditor() {
    var cm = catMap();
    var subs = cm.map[ed.category] || [];
    var f = $('#edForm');
    f.innerHTML =
      '<label class="field">Назва товару <span class="req">*</span><input class="input" id="eName" required value="' + esc(ed.name) + '"></label>' +
      '<div class="grid2">' +
        '<label class="field">Категорія<input class="input" id="eCat" list="catList" value="' + esc(ed.category) + '" placeholder="Оберіть або впишіть нову"></label>' +
        '<label class="field">Підкатегорія<input class="input" id="eSub" list="subList" value="' + esc(ed.subcategory) + '" placeholder="Оберіть або впишіть нову"></label>' +
      '</div>' +
      '<datalist id="catList">' + cm.order.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
      '<datalist id="subList">' + subs.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
      '<div class="grid3">' +
        '<label class="field">Ціна, ₴ <span class="req">*</span><input class="input" id="ePrice" type="number" min="0" inputmode="numeric" value="' + esc(ed.price) + '"></label>' +
        '<label class="field">Стара ціна, ₴ <span class="hint">для знижки</span><input class="input" id="eOld" type="number" min="0" inputmode="numeric" value="' + esc(ed.oldPrice || '') + '"></label>' +
        '<label class="field">Бренд<input class="input" id="eBrand" value="' + esc(ed.brand) + '"></label>' +
      '</div>' +
      '<div class="grid3">' +
        '<label class="field">Наявність<select class="input" id="eAvail">' + AVAIL.map(function (a) { return '<option' + (a === ed.availability ? ' selected' : '') + '>' + a + '</option>'; }).join('') + '</select></label>' +
        '<label class="field">Кількість, шт<input class="input" id="eQty" type="number" min="0" inputmode="numeric" value="' + esc(ed.quantity === null ? '' : ed.quantity) + '" placeholder="не обмежено"></label>' +
        '<label class="field">Вік<input class="input" id="eAge" list="ageList" value="' + esc(ed.age) + '" placeholder="напр. 3+"></label>' +
      '</div>' +
      '<datalist id="ageList"><option value="0+"><option value="1+"><option value="3+"><option value="6+"><option value="12+"><option value="16+"><option value="18+"></datalist>' +
      '<label class="field">Опис<textarea class="input" id="eDesc" rows="5">' + esc(ed.description) + '</textarea></label>' +

      '<div class="ed-section"><h3>Фото</h3><p class="note">Перше фото — головне. Можна додати кілька фото одразу; великі фото зменшуються автоматично.</p><div class="photos" id="ePhotos"></div></div>' +

      '<div class="ed-section"><h3>Додаткові характеристики</h3><p class="note">Будь-які поля: об\'єм, тип шкіри, колір, матеріал… Вони показуються в картці товару й автоматично стають фільтрами.</p><div id="eExtra" style="display:flex;flex-direction:column;gap:10px"></div>' +
        '<button type="button" class="btn btn-soft" id="eAddX" style="align-self:flex-start">+ Додати поле</button>' +
        '<datalist id="fieldList">' + FIELD_SUGGEST.map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist></div>' +

      '<div class="ed-section"><h3>Позначки</h3><div class="checks">' +
        ['Новинка', 'Хіт'].map(function (b) { return '<label class="check"><input type="checkbox" name="badge" value="' + b + '"' + (ed.badges.indexOf(b) >= 0 ? ' checked' : '') + '>' + b + '</label>'; }).join('') +
      '</div><h3 style="margin-top:6px">Ідеї подарунків</h3><div class="checks">' +
        GIFTS.map(function (g) { return '<label class="check"><input type="checkbox" name="gift" value="' + g + '"' + (ed.gifts.indexOf(g) >= 0 ? ' checked' : '') + '>' + g + '</label>'; }).join('') +
      '</div></div>' +
      '<div class="ed-section"><label class="check" style="align-self:flex-start"><input type="checkbox" id="eActive"' + (ed.active !== false ? ' checked' : '') + '>Показувати на сайті</label></div>' +
      '<span class="err" id="eErr" hidden></span>';
    renderPhotos(); renderExtra();
    $('#eCat').addEventListener('input', function () {
      var s = catMap().map[$('#eCat').value] || [];
      $('#subList').innerHTML = s.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('');
    });
    $('#eAddX').onclick = function () { collectExtra(); ed.extra.push({ k: '', v: '' }); renderExtra(); var ins = $$('#eExtra input'); ins[ins.length - 2].focus(); };
  }

  function renderExtra() {
    $('#eExtra').innerHTML = ed.extra.map(function (x, i) {
      return '<div class="xrow"><label class="sr-only" for="xk' + i + '">Назва поля</label><input class="input" id="xk' + i + '" list="fieldList" placeholder="Назва, напр. Колір" value="' + esc(x.k) + '">' +
        '<label class="sr-only" for="xv' + i + '">Значення</label><input class="input" id="xv' + i + '" placeholder="Значення" value="' + esc(x.v) + '">' +
        '<button type="button" class="icon-btn" data-xdel="' + i + '" aria-label="Видалити поле">✕</button></div>';
    }).join('') || '<p class="note" style="margin:0;font-size:13px;color:var(--muted)">Поки немає додаткових полів.</p>';
  }
  function collectExtra() {
    ed.extra = ed.extra.map(function (x, i) { var k = $('#xk' + i), v = $('#xv' + i); return { k: k ? k.value.trim() : x.k, v: v ? v.value.trim() : x.v }; });
  }

  function renderPhotos() {
    var h = ed.images.map(function (src, i) {
      return '<div class="ph"><img src="' + esc(src) + '" alt="Фото ' + (i + 1) + '">' + (i === 0 ? '<span class="pill dark main-tag">Головне</span>' : '') +
        '<div class="ph-tools"><button type="button" data-pmove="' + i + '" data-dir="-1" aria-label="Перемістити ліворуч"' + (i === 0 ? ' disabled' : '') + '>←</button>' +
        '<button type="button" data-pdel="' + i + '" aria-label="Видалити фото">✕</button>' +
        '<button type="button" data-pmove="' + i + '" data-dir="1" aria-label="Перемістити праворуч"' + (i === ed.images.length - 1 ? ' disabled' : '') + '>→</button></div></div>';
    }).join('');
    h += '<label class="ph-add"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Додати фото<input type="file" id="eFiles" accept="image/*" multiple class="sr-only"></label>';
    $('#ePhotos').innerHTML = h;
    $('#eFiles').onchange = function (e) { uploadFiles(Array.prototype.slice.call(e.target.files)); };
  }

  function resizeImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
        var k = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
        var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Не вдалося прочитати фото ' + file.name)); };
      img.src = url;
    });
  }

  var uploading = 0;
  function uploadFiles(files) {
    files = files.filter(function (f) { return /^image\//.test(f.type); });
    if (!files.length) return;
    uploading += files.length;
    $('#edSave').disabled = true; $('#edSave').textContent = 'Завантажуємо фото… ' + uploading;
    var chain = Promise.resolve();
    files.forEach(function (file) {
      chain = chain.then(function () {
        return resizeImage(file).then(function (b64) {
          return call('uploadImage', { data: b64, mime: 'image/jpeg', name: file.name.replace(/\.[^.]+$/, '') + '.jpg' });
        }).then(function (r) { ed.images.push(r.url); renderPhotos(); })
          .catch(fail)
          .then(function () { uploading--; $('#edSave').textContent = uploading ? 'Завантажуємо фото… ' + uploading : 'Зберегти товар'; if (!uploading) $('#edSave').disabled = false; });
      });
    });
  }

  $('#edForm').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var v;
    if ((v = b.getAttribute('data-xdel')) !== null) { collectExtra(); ed.extra.splice(Number(v), 1); renderExtra(); }
    if ((v = b.getAttribute('data-pdel')) !== null) { ed.images.splice(Number(v), 1); renderPhotos(); }
    if ((v = b.getAttribute('data-pmove')) !== null) {
      var i = Number(v), j = i + Number(b.getAttribute('data-dir'));
      if (j < 0 || j >= ed.images.length) return;
      var t = ed.images[i]; ed.images[i] = ed.images[j]; ed.images[j] = t; renderPhotos();
    }
  });

  $('#edForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (uploading) return;
    collectExtra();
    var err = $('#eErr');
    var p = {
      id: ed.id,
      name: $('#eName').value.trim(),
      category: $('#eCat').value.trim(),
      subcategory: $('#eSub').value.trim(),
      price: $('#ePrice').value === '' ? '' : Number($('#ePrice').value),
      oldPrice: $('#eOld').value === '' ? '' : Number($('#eOld').value),
      brand: $('#eBrand').value.trim(),
      availability: $('#eAvail').value,
      quantity: $('#eQty').value === '' ? '' : Number($('#eQty').value),
      age: $('#eAge').value.trim(),
      description: $('#eDesc').value.trim(),
      images: ed.images.slice(),
      extra: ed.extra.filter(function (x) { return x.k && x.v; }),
      badges: $$('#edForm [name=badge]:checked').map(function (x) { return x.value; }),
      gifts: $$('#edForm [name=gift]:checked').map(function (x) { return x.value; }),
      active: $('#eActive').checked
    };
    if (!p.name) { err.textContent = 'Вкажіть назву товару'; err.hidden = false; $('#eName').focus(); return; }
    if (p.price === '' || p.price < 0) { err.textContent = 'Вкажіть ціну'; err.hidden = false; $('#ePrice').focus(); return; }
    if (p.oldPrice !== '' && p.oldPrice <= p.price) { err.textContent = 'Стара ціна має бути більшою за нову (або залиште поле порожнім)'; err.hidden = false; $('#eOld').focus(); return; }
    if (!p.category) { err.textContent = 'Вкажіть категорію'; err.hidden = false; $('#eCat').focus(); return; }
    err.hidden = true;
    var btn = $('#edSave'); btn.disabled = true; btn.textContent = 'Зберігаємо…';
    call('saveProduct', { product: p }).then(function () { return reloadData(); }).then(function () {
      closeEditor(); renderProducts(); toast('Товар збережено');
    }).catch(fail).then(function () { btn.disabled = false; btn.textContent = 'Зберегти товар'; });
  });

  $('#panel').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var v;
    if ((v = b.getAttribute('data-edit')) !== null) openEditor(v);
    if ((v = b.getAttribute('data-copy')) !== null) openEditor(v, true);
    if ((v = b.getAttribute('data-del')) !== null) {
      var p = DATA.products.filter(function (x) { return x.id === v; })[0];
      if (!p || !confirm('Видалити «' + p.name + '»? Це не можна скасувати.\n\nПорада: щоб тимчасово сховати товар, зніміть галочку «Показувати на сайті».')) return;
      call('deleteProduct', { id: v }).then(reloadData).then(function () { renderProducts(); toast('Товар видалено'); }).catch(fail);
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-close-editor]') || e.target.id === 'overlay') closeEditor();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && $('#editor').classList.contains('on')) closeEditor(); });

  /* ───────────── Замовлення ───────────── */
  var ORDERS = [], oFilter = 'active';
  function refreshNewOrders() {
    return call('orders').then(function (o) {
      ORDERS = o;
      var n = o.filter(function (x) { return x.status === 'Нове'; }).length;
      var el = $('#newOrders'); el.textContent = n; el.hidden = !n;
      return o;
    });
  }
  function renderOrders() {
    $('#panel').innerHTML = '<div class="a-title"><h1>Замовлення</h1></div><div class="loading"><div class="spinner"></div></div>';
    refreshNewOrders().then(drawOrders).catch(fail);
  }
  function drawOrders() {
    var list = ORDERS.filter(function (o) {
      if (oFilter === 'active') return o.status !== 'Виконане' && o.status !== 'Скасоване';
      if (oFilter === 'all') return true;
      return o.status === oFilter;
    });
    var h = '<div class="a-title"><h1>Замовлення</h1><div class="seg" role="group" aria-label="Фільтр замовлень">' +
      [['active', 'В роботі'], ['Нове', 'Нові'], ['Виконане', 'Виконані'], ['Скасоване', 'Скасовані'], ['all', 'Усі']].map(function (x) {
        return '<button type="button" data-of="' + x[0] + '" class="' + (oFilter === x[0] ? 'on' : '') + '">' + x[1] + '</button>';
      }).join('') + '</div></div>';
    if (!list.length) h += '<div class="card-box empty"><h3>Тут поки порожньо</h3><p>Нові замовлення з\'являться тут, а також прийдуть вам у Telegram і на пошту.</p></div>';
    h += '<div class="orders">' + list.map(function (o) {
      var digits = String(o.phone).replace(/\D/g, '');
      var isNotify = o.type !== 'Замовлення';
      return '<div class="card-box order' + (o.status === 'Нове' ? ' is-new' : '') + '">' +
        '<div><h3>' + esc(o.id) + (isNotify ? ' <span class="pill order">Повідомити про наявність</span>' : '') + (o.status === 'Нове' ? ' <span class="pill new">нове</span>' : '') + '</h3>' +
          '<div class="when">' + fmtDate(o.date) + '</div>' +
          '<div style="margin-top:10px"><a class="phone" href="tel:+' + digits + '">' + esc(o.phone) + '</a>' + (o.name ? '<div>' + esc(o.name) + '</div>' : '') +
          '<div class="quick"><a href="viber://chat?number=%2B' + digits + '">Viber</a><a href="https://wa.me/' + digits + '" target="_blank" rel="noopener">WhatsApp</a></div></div></div>' +
        '<div><div class="items">' + esc(o.items) + '</div>' + (isNotify ? '' : '<div class="sum">' + money(o.total) + '</div><div style="font-size:13px;color:var(--muted)">' + esc(o.delivery) + ' · ' + esc(o.payment) + '</div>') + '</div>' +
        '<label class="field">Статус<select class="input" data-status="' + esc(o.id) + '">' + ORDER_STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></label>' +
        '</div>';
    }).join('') + '</div>';
    $('#panel').innerHTML = h;
    $$('[data-of]').forEach(function (b) { b.onclick = function () { oFilter = b.getAttribute('data-of'); drawOrders(); }; });
    $$('[data-status]').forEach(function (s) {
      s.onchange = function () {
        var id = s.getAttribute('data-status');
        call('setOrderStatus', { id: id, status: s.value }).then(function () {
          ORDERS.forEach(function (o) { if (o.id === id) o.status = s.value; });
          var n = ORDERS.filter(function (x) { return x.status === 'Нове'; }).length; $('#newOrders').textContent = n; $('#newOrders').hidden = !n;
          toast('Статус змінено: ' + s.value);
        }).catch(fail);
      };
    });
  }

  /* ───────────── Звіти ───────────── */
  var days = 30;
  function renderReports() {
    $('#panel').innerHTML = reportHead() + '<div class="loading"><div class="spinner"></div></div>';
    bindReportHead();
    call('report', { days: days }).then(drawReport).catch(fail);
  }
  function reportHead() {
    return '<div class="a-title"><h1>Звіти</h1><div class="seg" role="group" aria-label="Період">' +
      [[7, '7 днів'], [30, '30 днів'], [90, '90 днів'], [365, 'Рік']].map(function (x) { return '<button type="button" data-days="' + x[0] + '" class="' + (days === x[0] ? 'on' : '') + '">' + x[1] + '</button>'; }).join('') + '</div></div>';
  }
  function bindReportHead() { $$('[data-days]').forEach(function (b) { b.onclick = function () { days = Number(b.getAttribute('data-days')); renderReports(); }; }); }

  function barChart(title, data, key, fmt) {
    var W = 560, H = 200, padL = 36, padB = 22, padT = 8;
    var max = Math.max(1, Math.max.apply(null, data.map(function (d) { return d[key]; })));
    var nice = niceMax(max);
    var n = data.length, slot = (W - padL) / n, bw = Math.max(2, Math.min(28, slot - 2));
    var y = function (v) { return padT + (H - padT - padB) * (1 - v / nice); };
    var ticks = nice / 2 === Math.round(nice / 2) ? [0, nice / 2, nice] : [0, nice];
    var grid = ticks.map(function (v) {
      return '<line x1="' + padL + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '" stroke="#EFE4DC"/><text class="axis" x="' + (padL - 6) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + (fmt ? fmt(v, true) : Math.round(v)) + '</text>';
    }).join('');
    var bars = data.map(function (d, i) {
      var v = d[key], x = padL + i * slot + (slot - bw) / 2, top = y(v), h = Math.max(0, H - padB - top);
      var r = Math.min(4, bw / 2, h);
      var path = h > 0 ? 'M' + x + ',' + (H - padB) + 'V' + (top + r) + 'Q' + x + ',' + top + ' ' + (x + r) + ',' + top + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + top + ' ' + (x + bw) + ',' + (top + r) + 'V' + (H - padB) + 'Z' : '';
      var label = dayLabel(d.day) + ': ' + (fmt ? fmt(v) : v);
      return '<g data-tip="' + esc(label) + '"><rect x="' + (padL + i * slot) + '" y="' + padT + '" width="' + slot + '" height="' + (H - padT - padB) + '" fill="transparent"/>' + (path ? '<path class="bar" d="' + path + '"/>' : '') + '</g>';
    }).join('');
    var step = Math.ceil(n / 6);
    var ticks = data.map(function (d, i) { return i % step === 0 ? '<text class="axis" x="' + (padL + i * slot + slot / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + dayLabel(d.day) + '</text>' : ''; }).join('');
    return '<div class="card-box chart"><h3>' + title + '</h3><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(title) + '">' + grid + '<line x1="' + padL + '" x2="' + W + '" y1="' + (H - padB) + '" y2="' + (H - padB) + '" stroke="#D9CBC1"/>' + bars + ticks + '</svg></div>';
  }
  function niceMax(v) { var p = Math.pow(10, Math.floor(Math.log10(v))); var m = v / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p; }
  function dayLabel(s) { var p = String(s).split('-'); return p[2] + '.' + p[1]; }
  function short(v, axis) { v = Math.round(v); if (axis && v >= 1000) return (v / 1000).toFixed(v >= 10000 ? 0 : 1).replace('.0', '') + 'k'; return money(v); }

  function tbl(title, rows, unit) {
    return '<div class="card-box tbl"><h3>' + title + '</h3>' + (rows.length ? '<table>' + rows.map(function (r) { return '<tr><td>' + esc(r.name) + '</td><td>' + r.count + (unit ? ' ' + unit : '') + '</td></tr>'; }).join('') + '</table>' : '<p class="none">Поки немає даних</p>') + '</div>';
  }

  function drawReport(r) {
    var t = r.totals;
    var avg = t.orders ? t.revenue / t.orders : 0;
    var conv = t.visits ? (t.orders / t.visits * 100) : 0;
    var h = reportHead() +
      '<div class="kpis">' +
        kpi('Відвідувачі', t.visitors) + kpi('Візити', t.visits) + kpi('Замовлення', t.orders) +
        kpi('Сума замовлень', money(t.revenue)) + kpi('Середній чек', money(avg)) + kpi('Конверсія', conv.toFixed(1).replace('.', ',') + '%') +
      '</div>' +
      '<div class="charts">' + barChart('Візити по днях', r.days, 'visits') + barChart('Замовлення по днях', r.days, 'orders') + '</div>' +
      '<div class="tables">' +
        tbl('Найбільше переглядали', r.topViews, 'перегл.') +
        tbl('Найбільше купували', r.topSold, 'шт') +
        tbl('Що шукали клієнти', r.topSearch, 'раз') +
        tbl('Шукали, але не знайшли', r.notFound, 'раз') +
        tbl('Додавали в кошик', r.topCart, 'раз') +
      '</div>' +
      '<p style="font-size:13px;color:var(--muted);margin-top:16px">«Візити» — скільки разів відкривали сайт; «Відвідувачі» — скільки різних людей (пристроїв). Скасовані замовлення в сумах не враховуються.</p>';
    $('#panel').innerHTML = h;
    bindReportHead();
  }
  function kpi(label, val) { return '<div class="card-box kpi"><span>' + label + '</span><b>' + esc(val) + '</b></div>'; }

  // підказки на графіках
  document.addEventListener('mousemove', function (e) {
    var g = e.target.closest && e.target.closest('[data-tip]');
    var tip = $('#tip');
    $$('.bar.hl').forEach(function (b) { b.classList.remove('hl'); });
    if (!g) { tip.hidden = true; return; }
    var bar = g.querySelector('.bar'); if (bar) bar.classList.add('hl');
    tip.textContent = g.getAttribute('data-tip'); tip.hidden = false;
    var x = Math.min(window.innerWidth - tip.offsetWidth - 8, e.clientX + 12);
    tip.style.left = x + 'px'; tip.style.top = (e.clientY - 40) + 'px';
  });

  /* ───────────── Категорії ───────────── */
  var CATS = [];
  function renderCategories() {
    var cm = catMap();
    CATS = cm.order.map(function (c) { return { name: c, subs: cm.map[c].slice() }; });
    drawCats();
  }
  function drawCats() {
    var counts = {};
    DATA.products.forEach(function (p) { counts[p.category] = (counts[p.category] || 0) + 1; });
    $('#panel').innerHTML = '<div class="a-title"><h1>Категорії</h1><div style="display:flex;gap:10px"><button type="button" class="btn btn-soft" id="cAdd">+ Категорія</button><button type="button" class="btn" id="cSave">Зберегти</button></div></div>' +
      '<p style="margin:-8px 0 16px;color:var(--ink-2);font-size:14px">Порядок тут = порядок у меню зліва. Підкатегорії — кожна з нового рядка.</p>' +
      '<div class="card-box">' + CATS.map(function (c, i) {
        return '<div class="catrow"><label class="field">Категорія' + (counts[c.name] ? ' <span class="hint">· товарів: ' + counts[c.name] + '</span>' : '') + '<input class="input" data-cn="' + i + '" value="' + esc(c.name) + '"></label>' +
          '<label class="field">Підкатегорії<textarea class="input" data-cs="' + i + '" rows="4">' + esc(c.subs.join('\n')) + '</textarea></label>' +
          '<div class="cat-tools" style="padding-top:22px"><button type="button" class="icon-btn" data-cup="' + i + '" aria-label="Вище"' + (i === 0 ? ' disabled' : '') + '>↑</button><button type="button" class="icon-btn" data-cdown="' + i + '" aria-label="Нижче"' + (i === CATS.length - 1 ? ' disabled' : '') + '>↓</button><button type="button" class="icon-btn" data-cdel="' + i + '" aria-label="Видалити категорію">✕</button></div></div>';
      }).join('') + '</div>' +
      '<p style="font-size:13px;color:var(--muted);margin-top:12px">Якщо перейменувати категорію, не забудьте змінити її і в товарах (у редакторі товару). Категорія, в якій є товари, все одно показується в меню.</p>';
    $('#cAdd').onclick = function () { collectCats(); CATS.push({ name: '', subs: [] }); drawCats(); $$('[data-cn]').pop().focus(); };
    $('#cSave').onclick = function () {
      collectCats();
      var b = $('#cSave'); b.disabled = true; b.textContent = 'Зберігаємо…';
      call('saveCategories', { categories: CATS.filter(function (c) { return c.name; }) }).then(reloadData).then(function () { renderCategories(); toast('Категорії збережено'); })
        .catch(fail).then(function () { var bb = $('#cSave'); if (bb) { bb.disabled = false; bb.textContent = 'Зберегти'; } });
    };
  }
  function collectCats() {
    CATS = CATS.map(function (c, i) {
      var n = $('[data-cn="' + i + '"]'), s = $('[data-cs="' + i + '"]');
      return { name: n ? n.value.trim() : c.name, subs: s ? s.value.split(/[\n,]+/).map(function (x) { return x.trim(); }).filter(String) : c.subs };
    });
  }
  $('#panel').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || tab !== 'categories') return;
    var v;
    if ((v = b.getAttribute('data-cup')) !== null) { collectCats(); var i = Number(v); var t = CATS[i - 1]; CATS[i - 1] = CATS[i]; CATS[i] = t; drawCats(); }
    if ((v = b.getAttribute('data-cdown')) !== null) { collectCats(); var j = Number(v); var t2 = CATS[j + 1]; CATS[j + 1] = CATS[j]; CATS[j] = t2; drawCats(); }
    if ((v = b.getAttribute('data-cdel')) !== null) { collectCats(); if (confirm('Прибрати категорію «' + (CATS[Number(v)].name || 'без назви') + '» з меню?')) { CATS.splice(Number(v), 1); drawCats(); } }
  });

  /* ───────────── Налаштування ───────────── */
  function renderSettings() {
    var s = DATA.settings || {};
    $('#panel').innerHTML = '<div class="a-title"><h1>Налаштування</h1></div><div class="settings-grid">' +
      '<form class="card-box set-card" id="setForm"><h2>Сайт</h2>' +
        '<label class="field">Рядок оголошення вгорі сайту<input class="input" id="sAnn" value="' + esc(s.announcement) + '"></label>' +
        '<label class="field">Безкоштовна доставка від, ₴ <span class="hint">порожньо — вимкнено</span><input class="input" id="sFree" type="number" min="0" value="' + esc(s.freeShippingFrom) + '"></label>' +
        '<label class="field">Заголовок на головній <span class="hint">порожньо — стандартний</span><input class="input" id="sHT" value="' + esc(s.heroTitle) + '" placeholder="Маленькі радості для вас і вашого дому"></label>' +
        '<label class="field">Текст на головній<textarea class="input" id="sHX" rows="3">' + esc(s.heroText) + '</textarea></label>' +
        '<label class="field">Посилання на Facebook Messenger <span class="hint">напр. https://m.me/ваша.сторінка</span><input class="input" id="sMsg" type="url" value="' + esc(s.messengerUrl) + '"></label>' +
        '<label class="field">Посилання на Instagram<input class="input" id="sIg" type="url" value="' + esc(s.instagramUrl) + '"></label>' +
        '<button type="submit" class="btn btn-lg">Зберегти</button></form>' +
      '<div style="display:flex;flex-direction:column;gap:16px">' +
        '<form class="card-box set-card" id="pwForm"><h2>Пароль адмінки</h2>' +
          '<label class="field">Новий пароль<input class="input" id="pw1" type="password" autocomplete="new-password" minlength="6"></label>' +
          '<label class="field">Повторіть пароль<input class="input" id="pw2" type="password" autocomplete="new-password"></label>' +
          '<button type="submit" class="btn btn-outline">Змінити пароль</button></form>' +
        '<div class="card-box set-card"><h2>Сповіщення і бекап</h2>' +
          '<p>Нові замовлення приходять у Telegram і на пошту. Бекап бази щодня близько 6:00 приходить на пошту.</p>' +
          '<button type="button" class="btn btn-soft" id="tgTest">Надіслати тест у Telegram</button>' +
          '<button type="button" class="btn btn-soft" id="bkNow">Надіслати бекап зараз</button></div>' +
      '</div></div>';
    $('#setForm').onsubmit = function (e) {
      e.preventDefault();
      var btn = e.target.querySelector('button'); btn.disabled = true;
      call('saveSettings', { settings: { announcement: $('#sAnn').value.trim(), freeShippingFrom: $('#sFree').value.trim(), heroTitle: $('#sHT').value.trim(), heroText: $('#sHX').value.trim(), messengerUrl: $('#sMsg').value.trim(), instagramUrl: $('#sIg').value.trim() } })
        .then(function (st) { DATA.settings = st; toast('Налаштування збережено. На сайті оновиться за кілька хвилин'); }).catch(fail).then(function () { btn.disabled = false; });
    };
    $('#pwForm').onsubmit = function (e) {
      e.preventDefault();
      var a = $('#pw1').value, b = $('#pw2').value;
      if (a.length < 6) return toast('Пароль має бути не коротший за 6 символів');
      if (a !== b) return toast('Паролі не збігаються');
      call('changePassword', { newPassword: a }).then(function () { $('#pw1').value = ''; $('#pw2').value = ''; toast('Пароль змінено'); }).catch(fail);
    };
    $('#tgTest').onclick = function () {
      call('testTelegram').then(function (r) { toast(r.demo ? 'У демо-режимі Telegram не підключено' : r.telegram ? 'Надіслано — перевірте Telegram' : 'Telegram ще не підключено (див. інструкцію, крок 5)'); }).catch(fail);
    };
    $('#bkNow').onclick = function () {
      var b = $('#bkNow'); b.disabled = true; b.textContent = 'Надсилаємо…';
      call('backupNow').then(function (r) { toast(r.demo ? 'У демо-режимі бекап не надсилається' : 'Бекап надіслано на пошту'); }).catch(fail).then(function () { b.disabled = false; b.textContent = 'Надіслати бекап зараз'; });
    };
  }

  /* ───────────── Старт ───────────── */
  $('#demoNote').hidden = !API.demo;
  if (token) start().catch(function () { showLogin(); }); else showLogin();
  setInterval(function () { if (token && document.visibilityState === 'visible') refreshNewOrders().then(function () { if (tab === 'orders') drawOrders(); }).catch(function () {}); }, 120000);
})();
