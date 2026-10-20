(function () {
  "use strict";
  var FN = "https://lwftspnyvoqejetemyhu.supabase.co/functions/v1/melcloud";
  var FN_LINKY = "https://lwftspnyvoqejetemyhu.supabase.co/functions/v1/linky";
  var KEY = "sb_publishable_6yruO30gDX8L3LfXWXWB2Q_54fg6Wme";
  var MAX_FAILS = 3, LOCK_MS = 10000;
  var DEMO = /[?&]demo\b/.test(location.search);

  // ---------- Libelles ----------
  var MODES = [
    ["Heat", "Chaud", '<path d="M12 22c4 0 7-2.6 7-6.6 0-3.4-2.2-5.6-3.6-7.2-.4 1.7-1.5 2.8-2.6 3.2C13.4 8 12.6 4.6 9.8 2c0 3.6-4.8 6.4-4.8 12.4C5 19.4 8 22 12 22Z"/>'],
    ["Cool", "Froid", '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M12 2 9 5M12 2l3 3M12 22l-3-3M12 22l3-3"/>'],
    ["Automatic", "Auto", '<path d="M5 19 10.5 5h3L19 19M7.4 13.5h9.2"/>'],
    ["Dry", "Déshum.", '<path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z"/>'],
    ["Fan", "Vent", '<path d="M12 12c0-4 1-8 4-8s3 4 0 6l-4 2Zm0 0c4 0 8 1 8 4s-4 3-6 0l-2-4Zm0 0c0 4-1 8-4 8s-3-4 0-6l4-2Zm0 0c-4 0-8-1-8-4s4-3 6 0l2 4Z"/>']
  ];
  var MODE_FR = {}; MODES.forEach(function (m) { MODE_FR[m[0]] = m[1]; });
  var EFFECT_C = { heat: "var(--heat)", cool: "var(--cool)", dry: "var(--dry)", fan: "var(--fanc)" };
  var FANS = ["One", "Two", "Three", "Four", "Five"];
  var VV_FR = { Auto: "Automatique", One: "Haut", Two: "Mi-haut", Three: "Milieu", Four: "Mi-bas", Five: "Bas", Swing: "Balayage" };
  var VH_FR = { Auto: "Automatique", Left: "Gauche", LeftCentre: "Gauche-centre", Centre: "Centre", RightCentre: "Droite-centre", Right: "Droite", Swing: "Balayage" };
  function arw(ox, oy, deg, len) {
    var r = deg * Math.PI / 180, x = ox + Math.cos(r) * len, y = oy + Math.sin(r) * len, h1 = r + Math.PI - 0.5, h2 = r + Math.PI + 0.5;
    return "M" + ox + " " + oy + "L" + x.toFixed(1) + " " + y.toFixed(1) +
      "M" + x.toFixed(1) + " " + y.toFixed(1) + "l" + (Math.cos(h1) * 4).toFixed(1) + " " + (Math.sin(h1) * 4).toFixed(1) +
      "M" + x.toFixed(1) + " " + y.toFixed(1) + "l" + (Math.cos(h2) * 4).toFixed(1) + " " + (Math.sin(h2) * 4).toFixed(1);
  }
  var UV = '<path d="M3 4h7" stroke-width="2.4"/>', UH = '<path d="M7 4h10" stroke-width="2.4"/>', AI = '<path d="M7 18 12 6l5 12M8.8 14h6.4"/>';
  var VV = [["Auto", "Automatique", AI], ["One", "Haut", UV + '<path d="' + arw(5, 7, 8, 15) + '"/>'], ["Two", "Mi-haut", UV + '<path d="' + arw(5, 7, 26, 15) + '"/>'],
    ["Three", "Milieu", UV + '<path d="' + arw(5, 7, 45, 15) + '"/>'], ["Four", "Mi-bas", UV + '<path d="' + arw(5, 7, 64, 15) + '"/>'], ["Five", "Bas", UV + '<path d="' + arw(5, 7, 82, 15) + '"/>'],
    ["Swing", "Balayage", UV + '<path d="M8 8a12 12 0 0 1 10 12M8 8l.4 3.6M8 8l3.4 1.2M18 20l-3.4-.8M18 20l.8-3.4"/>']];
  var VH = [["Auto", "Automatique", AI], ["Left", "Gauche", UH + '<path d="' + arw(12, 7, 145, 13) + '"/>'], ["LeftCentre", "Gauche-centre", UH + '<path d="' + arw(12, 7, 118, 14) + '"/>'],
    ["Centre", "Centre", UH + '<path d="' + arw(12, 7, 90, 14) + '"/>'], ["RightCentre", "Droite-centre", UH + '<path d="' + arw(12, 7, 62, 14) + '"/>'], ["Right", "Droite", UH + '<path d="' + arw(12, 7, 35, 13) + '"/>'],
    ["Swing", "Balayage", UH + '<path d="M5 15h14M5 15l3-3M5 15l3 3M19 15l-3-3M19 15l-3 3"/>']];
  var TYPES = [["vie", "Pièce de vie", 21], ["chambre", "Chambre", 19], ["bureau", "Bureau", 20]];

  var HOUSE = [
    { k: "maison", n: "Maison", d: "Chaque pièce à sa température de confort.", i: '<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>' },
    { k: "nuit", n: "Nuit", d: "Chambres au confort, pièces de vie abaissées de 2°.", i: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"/>' },
    { k: "absent", n: "Absent", d: "Abaissement de 3° partout, relance rapide au retour.", i: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>' },
    { k: "vacances", n: "Vacances", d: "Hors-gel à 10° en hiver, arrêt complet en été.", i: '<path d="M4 8h16v11H4zM9 8V5h6v3M4 13h16"/>' }
  ];

  // ---------- Stockage local (jamais de mot de passe) ----------
  var mem = {};
  function put(k, v) { try { if (v === null) localStorage.removeItem("pc_" + k); else localStorage.setItem("pc_" + k, v); } catch (e) {} mem[k] = v; }
  function get(k) { try { var v = localStorage.getItem("pc_" + k); if (v !== null) return v; } catch (e) {} return mem[k] != null ? mem[k] : null; }
  function getJ(k, d) { try { return JSON.parse(get(k)) || d; } catch (e) { return d; } }

  var S = {
    email: get("email"), access: get("access"), refresh: get("refresh"), expiry: +(get("expiry") || 0),
    tariff: parseFloat(get("tariff") || "0.2016"),
    fails: +(get("fails") || 0), lockUntil: +(get("lockUntil") || 0),
    units: [], view: get("view") || "home", energy: {}, busyUntil: 0,
    rooms: getJ("rooms", {}), season: get("season") || "auto", house: getJ("house", null),
    hinted: get("hinted") === "1", linky: null
  };
  if (DEMO) { S.rooms = getJ("demo_rooms", {}); S.house = getJ("demo_house", null); }
  function saveRooms() { put(DEMO ? "demo_rooms" : "rooms", JSON.stringify(S.rooms)); }

  function saveTokens(t) {
    if (!t) return;
    S.access = t.access_token; S.refresh = t.refresh_token; S.expiry = Date.now() + (t.expires_in || 3600) * 1000;
    put("access", S.access); put("refresh", S.refresh); put("expiry", String(S.expiry));
  }
  function logout() {
    S.access = S.refresh = null; S.expiry = 0; S.units = [];
    ["access", "refresh", "expiry"].forEach(function (k) { put(k, null); });
    stopAuto(); renderLogin();
  }

  // ---------- Serveur ----------
  function api(action, extra, fn) {
    if (DEMO) return demoApi(action, extra || {}, fn);
    var body = Object.assign({ action: action }, extra || {});
    var isLogin = !!(extra && extra.password);
    if (!isLogin) {
      if (S.access && Date.now() < S.expiry - 60000) body.token = S.access;
      else if (S.refresh) body.refresh = S.refresh;
    }
    return fetch(fn || FN, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": KEY, "Authorization": "Bearer " + KEY },
      body: JSON.stringify(body)
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { return { status: r.status, d: d || {} }; });
    }).then(function (res) {
      if (res.d.token) saveTokens(res.d.token);
      if (!isLogin && (res.status === 401 || res.d.needLogin)) { var e = new Error("session"); e.needLogin = true; throw e; }
      if (res.d.error && !res.d.ok) throw new Error(res.d.error);
      return res.d;
    });
  }

  // ---------- Demonstration : donnees simulees, aucune clim pilotee ----------
  var DU = [
    { id: "d1", name: "Salon", power: true, mode: "Heat", set_temperature: 21, room_temperature: 19.5, fan_speed: "Auto", in_error: false, connected: true },
    { id: "d2", name: "Chambre", power: true, mode: "Heat", set_temperature: 19, room_temperature: 18.5, fan_speed: "Two", in_error: false, connected: true },
    { id: "d3", name: "Bureau", power: false, mode: "Heat", set_temperature: 20, room_temperature: 18, fan_speed: "Three", in_error: false, connected: true }
  ];
  var DE = {};
  function demoApi(action, x, fn) {
    return new Promise(function (ok) {
      setTimeout(function () {
        if (fn === FN_LINKY) {
          if (action !== "daily") return ok({ linked: true, prm: "•••• 4821" });
          var vals = [], now = new Date();
          for (var i = (x.days || 62); i >= 1; i--) {
            var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i), k = iso(d);
            var sd = Math.sin(d.getTime() / 864e5 * 7.13) * 9999; sd = sd - Math.floor(sd);
            var clim = ["d1", "d2", "d3"].reduce(function (a, id) { var e = (DE[id] || {})[k]; return a + (e || 0); }, 0);
            vals.push({ day: k, wh: Math.round(clim + 6200 + sd * 3800) });
          }
          return ok({ linked: true, values: vals });
        }
        if (action === "list") return ok({ units: DU.map(function (u) { return Object.assign({}, u); }) });
        if (action === "control") {
          var u = DU.filter(function (v) { return v.id === x.unit_id; })[0], c = x.changes || {};
          if (u) {
            if ("power" in c) u.power = c.power;
            if (c.operationMode) u.mode = c.operationMode;
            if (c.setTemperature != null) u.set_temperature = c.setTemperature;
            if (c.setFanSpeed) u.fan_speed = c.setFanSpeed;
          }
          return ok({ ok: true });
        }
        if (action === "energy") {
          var base = { d1: 4200, d2: 2100, d3: 900 }[x.unit_id] || 1500, out = [], now = new Date();
          for (var i = (x.days || 30) - 1; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            var seed = Math.sin(d.getTime() / 864e5 * 12.9898 + base) * 43758.5453; seed = seed - Math.floor(seed);
            var cold = 1 + 0.35 * Math.cos((d.getMonth() + d.getDate() / 30) / 12 * 2 * Math.PI);
            var val = Math.round(base * cold * (0.55 + seed * 0.9) / 100) * 100 * (i === 0 ? 0.6 : 1);
            (DE[x.unit_id] = DE[x.unit_id] || {})[iso(d)] = val;
            out.push({ time: iso(d) + "T00:00:00", value: val });
          }
          return ok({ values: out });
        }
        ok({});
      }, 140);
    });
  }

  // ---------- Outils ----------
  var app = document.getElementById("app"), toastEl = document.getElementById("toast"), toastT;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1900); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function svg(p, sw) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.6) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + "</svg>"; }
  function fmt(v) { if (v == null || isNaN(v)) return "–"; return (Math.round(v * 10) / 10).toString().replace(".", ","); }
  function eur(v, d) { if (v == null || isNaN(v)) return "–"; return v.toFixed(d == null ? 2 : d).replace(".", ",") + " €"; }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function hm(t) { var d = new Date(t); return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  function buzz() { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }
  function unitById(id) { for (var i = 0; i < S.units.length; i++) if (S.units[i].id === id) return S.units[i]; return null; }
  function hold(ms) { S.busyUntil = Date.now() + (ms || 4000); }
  var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  function room(u) {
    var r = S.rooms[u.id];
    if (!r) {
      var t = /chambre|parent|enfant|bed/i.test(u.name || "") ? "chambre" : /bureau|office/i.test(u.name || "") ? "bureau" : "vie";
      r = { type: t, comfort: TYPES.filter(function (x) { return x[0] === t; })[0][2] };
    }
    return r;
  }
  function season() {
    if (S.season === "heat" || S.season === "cool") return S.season;
    var m = new Date().getMonth(); return m >= 5 && m <= 8 ? "cool" : "heat";
  }
  function effect(u) {
    if (u.mode === "Heat") return "heat"; if (u.mode === "Cool") return "cool";
    if (u.mode === "Dry") return "dry"; if (u.mode === "Fan") return "fan";
    var r = u.room_temperature, s = u.set_temperature;
    if (r != null && s != null) { if (r < s - 0.2) return "heat"; if (r > s + 0.2) return "cool"; }
    return "fan";
  }
  function fanN(u) { var i = FANS.indexOf(u.fan_speed); return i < 0 ? 0 : i + 1; }
  function getVane(u, k) { return get("vane_" + k + "_" + u.id) || "Auto"; }
  function setVane(u, k, v) { put("vane_" + k + "_" + u.id, v); }
  function lo(u) { return u.mode === "Heat" ? 10 : 16; }

  // ---------- Canvas persistants (les particules survivent aux rendus) ----------
  var CV = {};
  function mount(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-cv]"), function (ph) {
      var key = ph.getAttribute("data-cv"), id = key.split(":")[1], mini = key.indexOf("mini") === 0, c = CV[key];
      if (!c) {
        var el = document.createElement("canvas"); el.className = mini ? "cv mini" : "cv big";
        el.setAttribute("role", "img");
        c = CV[key] = { el: el, view: null, id: id };
        ph.replaceWith(el);
        c.view = SplitView.create(el, mini ? { mini: true } : { interactive: true, onVane: onVane(id), onPreview: onPreview });
      } else { ph.replaceWith(c.el); c.view.wake(); }
      var u = unitById(id); if (!u) return;
      c.view.set({ power: !!u.power && !u.in_error, effect: effect(u), fan: fanN(u), vv: getVane(u, "vv"), vh: getVane(u, "vh") });
      c.el.setAttribute("aria-label", u.power ? "Flux d'air " + VV_FR[getVane(u, "vv")].toLowerCase() + ", " + VH_FR[getVane(u, "vh")].toLowerCase() : "Unité arrêtée");
    });
  }

  // ================= CONNEXION =================
  var lockTimer;
  function renderLogin(msg) {
    stopAuto();
    app.innerHTML =
      '<form class="login gut" id="lf" novalidate>' +
        '<p class="word">Pilote Clim</p>' +
        '<p class="tag">Compte MELCloud Home</p>' +
        '<label class="fld"><span>E-mail</span><input id="em" type="email" inputmode="email" autocomplete="username" autocapitalize="off" required></label>' +
        '<label class="fld"><span>Mot de passe</span><input id="pw" type="password" autocomplete="current-password" required></label>' +
        '<button class="cta" id="go" type="submit">Se connecter</button>' +
        '<p class="err" id="er">' + esc(msg || "") + '</p>' +
        '<p class="fine">Votre mot de passe n’est jamais conservé.<br>Seul un jeton de session reste sur cet appareil.</p>' +
        '<a class="demo-link" href="?demo">Découvrir en démonstration</a>' +
      '</form>';
    var em = document.getElementById("em"), pw = document.getElementById("pw"), go = document.getElementById("go"), er = document.getElementById("er");
    if (S.email) { em.value = S.email; setTimeout(function () { pw.focus(); }, 50); }
    tickLock();

    document.getElementById("lf").addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (Date.now() < S.lockUntil) return;
      var email = em.value.trim(), password = pw.value;
      if (!email || !password) { er.textContent = "Saisissez votre e-mail et votre mot de passe."; return; }
      go.disabled = true; go.textContent = "Connexion…"; er.textContent = "";
      S.email = email; put("email", email);
      api("login", { email: email, password: password }).then(function (d) {
        pw.value = "";
        S.fails = 0; put("fails", "0");
        S.units = d.units || [];
        if (S.view !== "home" && !unitById(S.view)) S.view = "home";
        renderApp(); loadEnergy();
      }).catch(function (e) {
        pw.value = "";
        var wrong = /incorrect/i.test(e.message);
        if (wrong) {
          S.fails += 1;
          if (S.fails >= MAX_FAILS) {
            S.fails = 0; S.lockUntil = Date.now() + LOCK_MS; put("lockUntil", String(S.lockUntil));
            er.textContent = "Trop de tentatives. Patientez quelques secondes.";
          } else {
            er.textContent = "E-mail ou mot de passe incorrect. Encore " + (MAX_FAILS - S.fails) + " essai" + (MAX_FAILS - S.fails > 1 ? "s" : "") + ".";
          }
          put("fails", String(S.fails));
        } else {
          er.textContent = "Connexion impossible pour le moment. Réessayez.";
        }
        go.disabled = false; go.textContent = "Se connecter";
        tickLock();
      });
    });
  }
  function tickLock() {
    clearInterval(lockTimer);
    var go = document.getElementById("go"); if (!go) return;
    function upd() {
      var left = Math.ceil((S.lockUntil - Date.now()) / 1000);
      if (left > 0) { go.disabled = true; go.textContent = "Réessayer dans " + left + " s"; }
      else { clearInterval(lockTimer); if (go.textContent.indexOf("Réessayer") === 0) { go.disabled = false; go.textContent = "Se connecter"; } }
    }
    upd(); if (S.lockUntil > Date.now()) lockTimer = setInterval(upd, 250);
  }

  // ================= APPLICATION =================
  var GEAR = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>';
  function renderApp() {
    app.innerHTML =
      '<header class="gut"><div class="top" id="top"></div></header>' +
      '<main class="gut" id="main"><div class="loading">Chargement</div></main>';
    document.getElementById("main").addEventListener("click", onMainClick);
    document.getElementById("top").addEventListener("click", onMainClick);
    draw();
    api("list", {}).then(function (d) { if (d.units) { S.units = d.units; draw(); loadEnergy(); } }).catch(onErr);
    startAuto();
  }
  function onErr(e) { if (e.needLogin) renderLogin("Session expirée. Reconnectez-vous."); else toast("Connexion au serveur interrompue"); }

  var BACK = '<path d="m15 5-7 7 7 7"/>', SLIDERS = '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>';
  function drawTop(u) {
    var t = document.getElementById("top"); if (!t) return;
    if (!u) {
      t.innerHTML = '<span></span><span class="word">Pilote Clim</span><button class="ib" data-settings aria-label="Réglages">' + svg(GEAR, 1.5) + '</button>';
      return;
    }
    var rsw = S.units.map(function (x) {
      return '<button class="rp' + (x.power ? " on" : "") + '" data-go="' + esc(x.id) + '" aria-current="' + (x.id === u.id) + '" style="--pc:' + EFFECT_C[effect(x)] + '"><i></i>' + esc(x.name) + '</button>';
    }).join("");
    t.innerHTML = '<button class="ib" data-back aria-label="Retour">' + svg(BACK, 1.8) + '</button>' +
      '<nav class="rsw" aria-label="Pièces">' + rsw + '</nav>' +
      '<button class="ib" data-roomset aria-label="Réglages de la pièce">' + svg(SLIDERS, 1.6) + '</button>';
  }
  function draw() {
    var main = document.getElementById("main"); if (!main) return;
    if (!S.units.length) { main.innerHTML = '<div class="loading">Chargement</div>'; return; }
    var u = S.view !== "home" ? unitById(S.view) : null;
    if (!u) { S.view = "home"; drawTop(null); main.innerHTML = homeHTML(); document.documentElement.style.setProperty("--acc", "var(--blue)"); }
    else { drawTop(u); main.innerHTML = roomHTML(u); }
    mount(main);
  }

  // ---------- Consommation ----------
  function consumption() {
    var now = new Date(), mk = iso(now).slice(0, 7);
    var pd = new Date(now.getFullYear(), now.getMonth() - 1, 1), pk = iso(pd).slice(0, 7);
    var dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var elapsed = Math.max(0.5, now.getDate() - 1 + now.getHours() / 24);
    var out = { cur: 0, prev: 0, have: false, per: {}, days: {} };
    S.units.forEach(function (u) {
      var e = S.energy[u.id]; if (!e) return; out.have = true; out.per[u.id] = 0;
      e.forEach(function (v) {
        var m = v.d.slice(0, 7);
        if (m === mk) { out.cur += v.kwh; out.per[u.id] += v.kwh; }
        else if (m === pk) out.prev += v.kwh;
        out.days[v.d] = (out.days[v.d] || 0) + v.kwh;
      });
    });
    out.proj = out.cur / elapsed * dim;
    out.month = MONTHS[now.getMonth()]; out.pmonth = MONTHS[pd.getMonth()];
    return out;
  }

  // ---------- Vue maison ----------
  function homeHTML() {
    var on = S.units.filter(function (u) { return u.power; }).length;
    var ts = S.units.map(function (u) { return u.room_temperature; }).filter(function (v) { return v != null; });
    var avg = ts.length ? ts.reduce(function (a, b) { return a + b; }, 0) / ts.length : null;
    var cur = S.house && S.house.k, hd = HOUSE.filter(function (h) { return h.k === cur; })[0];

    var seg = HOUSE.map(function (h) {
      return '<button data-house="' + h.k + '" aria-pressed="' + (h.k === cur) + '"><span class="c">' + svg(h.i, 1.6) + '</span>' + h.n + '</button>';
    }).join("") + '<button data-alloff aria-pressed="false"' + (on ? "" : " disabled") + '><span class="c">' + svg('<path d="M12 3v9M6.5 7a8 8 0 1 0 11 0"/>', 1.7) + '</span>Éteindre</button>';
    var cap = hd ? hd.d + ' <span class="when">Appliqué à ' + hm(S.house.at) + '.</span>' : "Un geste règle toute la maison.";

    var cards = S.units.map(function (u) {
      var r = room(u), ef = effect(u);
      var st = u.in_error ? "Erreur unité" : u.connected === false ? "Hors ligne" : u.power ? (u.mode === "Automatic" ? "Auto · " : "") + (ef === "heat" ? "Chauffe" : ef === "cool" ? "Refroidit" : ef === "dry" ? "Déshum." : "Ventile") + " " + fmt(u.set_temperature) + "°" : "Arrêt";
      return '<div class="card' + (u.power ? " on" : "") + '" data-open="' + esc(u.id) + '" role="button" tabindex="0" style="--cc:' + EFFECT_C[ef] + '">' +
        '<div data-cv="mini:' + esc(u.id) + '"></div>' +
        '<span class="cbody"><span class="nm">' + esc(u.name) + '</span><span class="sm">' + (u.power ? "<i></i>" : "") + esc(st) + '</span>' +
        '<span class="ty">Confort ' + fmt(r.comfort) + '°</span></span>' +
        '<span class="t">' + fmt(u.room_temperature) + '<small>°</small></span>' +
        '<button class="qp" data-qpower="' + esc(u.id) + '" aria-pressed="' + !!u.power + '" aria-label="' + (u.power ? "Éteindre " : "Allumer ") + esc(u.name) + '">' + svg('<path d="M12 3v9M6.5 7a8 8 0 1 0 11 0"/>', 2) + '</button></div>';
    }).join("");

    return '<section class="home-v">' +
      '<div class="hstat"><h1>Maison</h1><p>' + (on ? on + " sur " + S.units.length + " en marche" : "Tout est arrêté") + (DEMO ? " · démonstration" : "") + '</p></div>' +
      '<div class="hero"><div class="avg">' + (avg != null ? fmt(avg) : "–") + '<sup>°</sup></div></div>' +
      '<p class="segcap" style="margin-top:4px">Moyenne intérieure</p>' +
      '<div class="qa" role="group" aria-label="Mode de la maison">' + seg + '</div>' +
      '<p class="segcap">' + cap + '</p>' +
      '<div class="sh"><span>Pièces</span></div><div class="cards">' + cards + '</div>' +
      '<div class="sh"><span>Consommation</span><small>' + (S.linky && S.linky.days ? "Linky mesuré" : "Estimation") + '</small></div>' + consoHTML() +
      '</section>';
  }

  function consoHTML() {
    var c = consumption(), L = S.linky, t = S.tariff;
    if (L && L.days && Object.keys(L.days).length) return linkyHTML(c, L.days);
    if (!c.have) return '<div class="cons"><span class="k">Lecture de la consommation…</span></div>';
    var delta = c.prev > 0 ? (c.proj - c.prev) / c.prev * 100 : null;
    var keys = Object.keys(c.days).sort().slice(-30), max = 0;
    keys.forEach(function (k) { if (c.days[k] > max) max = c.days[k]; });
    var today = iso(new Date());
    var bars = keys.map(function (k) {
      var h = max ? Math.max(4, c.days[k] / max * 100) : 4;
      return '<i style="height:' + h.toFixed(1) + '%"' + (k === today ? ' class="part"' : "") + ' title="' + esc(k) + '"></i>';
    }).join("");
    var dl = delta == null ? "" : '<span class="dl ' + (delta > 0 ? "up" : "dn") + '">' + (delta > 0 ? "+" : "−") + Math.abs(Math.round(delta)) + ' % vs ' + c.pmonth + '</span>';
    var lk = !L ? "" : L.error ? '<p class="n">Compteur Linky momentanément indisponible : ' + esc(L.error) + '</p>'
      : '<button class="lkrow" data-linky><span><b>Relier le compteur Linky</b><small>Pour la consommation réelle de la maison, mesurée par Enedis.</small></span>' + svg('<path d="m9 6 6 6-6 6"/>', 1.8) + '</button>';
    return '<div class="cons">' +
      '<div class="ch"><div><div class="cm">' + cap1(c.month) + ' à ce jour</div><div class="eur">' + eur(c.cur * t) + '</div></div>' +
      '<div class="pj"><div class="cm">Projection fin de mois</div><div class="pv">' + eur(c.proj * t, 0) + '</div>' + dl + '</div></div>' +
      '<div class="bars" aria-label="Consommation des 30 derniers jours">' + bars + '</div>' +
      splitsHTML(c) +
      '<p class="n">' + fmt(c.cur) + ' kWh ce mois · ' + c.pmonth + ' : ' + eur(c.prev * t, 0) + '. Estimation fournie par Mitsubishi, non mesurée.</p>' +
      lk + '</div>';
  }
  function cap1(m) { return m.charAt(0).toUpperCase() + m.slice(1); }
  function splitsHTML(c) {
    return '<div class="splits">' + S.units.map(function (u) {
      var v = c.per[u.id] || 0, p = c.cur > 0 ? v / c.cur * 100 : 0;
      return '<div class="sp"><span>' + esc(u.name) + '</span><span class="tr"><b style="width:' + p.toFixed(1) + '%"></b></span><span class="v">' + eur(v * S.tariff, 0) + '</span></div>';
    }).join("") + '</div>';
  }

  // Consommation reelle (Linky) : maison mesuree, part de la climatisation estimee sur les memes jours.
  function linkyHTML(c, D) {
    var t = S.tariff, now = new Date(), mk = iso(now).slice(0, 7);
    var pk = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
    var dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var cur = 0, prev = 0, n = 0, clim = 0;
    Object.keys(D).forEach(function (k) {
      if (k.slice(0, 7) === mk) { cur += D[k]; n++; clim += c.days[k] || 0; }
      else if (k.slice(0, 7) === pk) prev += D[k];
    });
    var proj = n ? cur / n * dim : 0, delta = prev > 0 && n ? (proj - prev) / prev * 100 : null;
    var share = cur > 0 ? Math.min(100, clim / cur * 100) : 0, other = Math.max(0, cur - clim);
    var keys = Object.keys(D).sort().slice(-30), max = 0;
    keys.forEach(function (k) { if (D[k] > max) max = D[k]; });
    var bars = keys.map(function (k) {
      var h = max ? Math.max(4, D[k] / max * 100) : 4, cp = D[k] > 0 ? Math.min(100, (c.days[k] || 0) / D[k] * 100) : 0;
      return '<i style="height:' + h.toFixed(1) + '%" title="' + esc(k) + ' · ' + fmt(D[k]) + ' kWh"><b style="height:' + cp.toFixed(1) + '%"></b></i>';
    }).join("");
    var dl = delta == null ? "" : '<span class="dl ' + (delta > 0 ? "up" : "dn") + '">' + (delta > 0 ? "+" : "−") + Math.abs(Math.round(delta)) + ' % vs ' + c.pmonth + '</span>';
    var lastK = keys[keys.length - 1];
    return '<div class="cons lk">' +
      '<div class="ch"><div><div class="cm">Maison · ' + c.month + ' à ce jour</div><div class="eur">' + eur(cur * t) + '</div></div>' +
      '<div class="pj"><div class="cm">Projection fin de mois</div><div class="pv">' + eur(proj * t, 0) + '</div>' + dl + '</div></div>' +
      '<div class="mix"><div><span class="sw cl"></span>Climatisation<b>' + eur(clim * t, 0) + '</b><small>' + Math.round(share) + ' %</small></div>' +
      '<div><span class="sw ot"></span>Autres usages<b>' + eur(other * t, 0) + '</b><small>' + Math.round(100 - share) + ' %</small></div></div>' +
      '<div class="bars stack" aria-label="Consommation de la maison, 30 derniers jours">' + bars + '</div>' +
      splitsHTML(c) +
      '<p class="n">Maison : ' + fmt(cur) + ' kWh mesurés par le compteur Linky' + (lastK ? ', jusqu’au ' + lastK.slice(8, 10) + '/' + lastK.slice(5, 7) : "") + ' (Enedis publie les données le lendemain). ' +
      cap1(c.pmonth) + ' : ' + eur(prev * t, 0) + '. Part de la climatisation : estimation Mitsubishi rapportée à la mesure.</p>' +
      '</div>';
  }

  // ---------- Vue piece ----------
  function roomHTML(u) {
    var ef = effect(u), r = room(u);
    document.documentElement.style.setProperty("--acc", u.power ? EFFECT_C[ef] : "var(--auto)");
    var sp = u.set_temperature, whole = sp == null ? "–" : String(Math.floor(sp)), half = sp != null && sp % 1 !== 0;
    var status = u.in_error ? "<b>Erreur unité</b>" : u.connected === false ? "<b>Hors ligne</b>" :
      u.power ? "<b>" + (ef === "heat" ? "Chauffe" : ef === "cool" ? "Rafraîchit" : ef === "dry" ? "Déshumidifie" : "Ventile") + "</b> · pièce " + fmt(u.room_temperature) + "°" : "Arrêt · pièce " + fmt(u.room_temperature) + "°";
    var c = consumption(), kwh = c.per[u.id];
    var target = season() === "cool" ? Math.max(24, r.comfort + 3) : r.comfort;
    var chip = u.power && sp != null && Math.abs(sp - target) >= 0.5
      ? '<button class="chip" data-comfort>Revenir au confort · ' + fmt(target) + '°</button>' : "";
    var vv = getVane(u, "vv"), vh = getVane(u, "vh");

    var modes = MODES.map(function (m) {
      return '<button class="mode" data-mode="' + m[0] + '" data-m="' + m[0] + '" aria-pressed="' + (u.mode === m[0]) + '"><span class="c">' + svg(m[2]) + '</span>' + m[1] + '</button>';
    }).join("");
    var lvl = FANS.indexOf(u.fan_speed);
    var bars = FANS.map(function (f, i) {
      return '<button data-fan="' + f + '" aria-label="Ventilation ' + (i + 1) + '"><span class="bar' + (lvl >= i ? " on" : "") + '"></span></button>';
    }).join("");
    function grid(list, k, cur) {
      var name = "";
      var b = list.map(function (v) {
        var on = v[0] === cur; if (on) name = v[1];
        return '<button data-' + k + '="' + v[0] + '" aria-label="' + v[1] + '" title="' + v[1] + '" aria-pressed="' + on + '">' + svg(v[2], 1.8) + '</button>';
      }).join("");
      return '<div class="vgrid">' + b + '</div><div class="vcap">' + name + '</div>';
    }
    var modeCap = { Heat: "Chauffage vers la consigne.", Cool: "Rafraîchissement vers la consigne.", Automatic: "La clim choisit seule entre chaud et froid pour tenir la consigne.", Dry: "Assèche l’air, température peu modifiée.", Fan: "Brasse l’air, sans chauffer ni refroidir." }[u.mode] || "";

    return '<section class="room' + (u.power ? "" : " off") + '">' +
      '<p class="status">' + status + '</p>' +
      '<div class="stage"><div data-cv="room:' + esc(u.id) + '"></div>' +
        '<div class="vp" id="vp">' + vaneCap(u.power, vv, vh) + '</div>' +
        (u.power && !S.hinted ? '<div class="ghint" id="hint">Glissez le flux pour l’orienter · appui long : balayage</div>' : "") +
      '</div>' +
      '<div class="dial">' +
        '<button class="chev" data-step="-1" aria-label="Baisser">' + svg('<path d="m15 6-6 6 6 6"/>', 2) + '</button>' +
        '<div class="setpoint" aria-live="polite"><span class="num">' + whole + '</span><span class="side"><span class="deg">°</span><span class="dec">' + (half ? ",5" : "") + '</span></span></div>' +
        '<button class="chev" data-step="1" aria-label="Monter">' + svg('<path d="m9 6 6 6-6 6"/>', 2) + '</button>' +
      '</div>' + chip +
      '<button class="pwr" data-power aria-pressed="' + !!u.power + '" aria-label="Marche / arrêt">' + svg('<path d="M12 3v9M6.5 7a8 8 0 1 0 11 0"/>', 1.8) + '</button>' +
      '<div class="pwrlbl">' + (u.power ? "En marche" : "Arrêt") + '</div>' +
      '<div class="lbl">Mode</div><div class="modes">' + modes + '</div><div class="vcap">' + modeCap + '</div>' +
      '<div class="lbl">Ventilation</div><div class="fans"><button class="fauto" data-fan="Auto" aria-pressed="' + (u.fan_speed === "Auto") + '">Auto</button><div class="fanlvl">' + bars + '</div></div>' +
      '<div class="lbl">Orientation haut / bas</div>' + grid(VV, "vv", vv) +
      '<div class="lbl">Orientation gauche / droite</div>' + grid(VH, "vh", vh) +
      '<div class="meta"><span>Confort <b>' + fmt(r.comfort) + '°</b></span><span>Ce mois <b>' + (kwh != null ? eur(kwh * S.tariff) : "…") + '</b></span>' +
        '<button class="lnk" data-roomset>Pièce</button></div>' +
      '</section>';
  }

  // ---------- Volets depuis le geste ----------
  function vaneCap(on, vv, vh) {
    if (!on) return "Volet fermé";
    if (vv === "Auto" && vh === "Auto") return "Orientation automatique";
    return (vv === "Auto" ? "Hauteur auto" : VV_FR[vv]) + " · " + (vh === "Auto" ? "largeur auto" : VH_FR[vh].toLowerCase());
  }
  function onPreview(axis, k) {
    hold(); var vp = document.getElementById("vp"), u = unitById(S.view); if (!vp || !u) return;
    vp.classList.add("live");
    vp.textContent = axis === "v" ? vaneCap(true, k, getVane(u, "vh")) : vaneCap(true, getVane(u, "vv"), k);
    dismissHint();
  }
  function onVane(id) {
    return function (ch) {
      var u = unitById(id); if (!u) return;
      var changes = {};
      if (ch.vv) { setVane(u, "vv", ch.vv); changes.vaneVerticalDirection = ch.vv; }
      if (ch.vh) { setVane(u, "vh", ch.vh); changes.vaneHorizontalDirection = ch.vh; }
      dismissHint(); draw();
      send(u, changes, ch.vv ? "Volet : " + VV_FR[ch.vv].toLowerCase() : "Flux : " + VH_FR[ch.vh].toLowerCase());
    };
  }
  function dismissHint() { if (!S.hinted) { S.hinted = true; put("hinted", "1"); var h = document.getElementById("hint"); if (h) h.remove(); } }

  // ---------- Interactions ----------
  function onMainClick(e) {
    var b = e.target.closest("button");
    if (!b) { var cd = e.target.closest("[data-open]"); if (cd) { S.view = cd.getAttribute("data-open"); put("view", S.view); buzz(); draw(); window.scrollTo(0, 0); } return; }
    if (b.hasAttribute("data-open")) { S.view = b.getAttribute("data-open"); put("view", S.view); buzz(); draw(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-house")) { applyHouse(b.getAttribute("data-house")); return; }
    if (b.hasAttribute("data-settings")) { openSettings(); return; }
    if (b.hasAttribute("data-back")) { S.view = "home"; put("view", "home"); buzz(); draw(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-go")) { S.view = b.getAttribute("data-go"); put("view", S.view); buzz(); draw(); return; }
    if (b.hasAttribute("data-alloff")) { allOff(); return; }
    if (b.hasAttribute("data-linky")) { openLinky(); return; }
    if (b.hasAttribute("data-qpower")) {
      var q = unitById(b.getAttribute("data-qpower")); if (!q) return;
      buzz(); hold(); q.power = !q.power; draw(); send(q, { power: q.power }, q.name + (q.power ? " allumée" : " éteinte")); return;
    }
    var u = unitById(S.view); if (!u) return;
    if (b.hasAttribute("data-roomset")) { openRoom(u); return; }
    buzz(); hold();
    if (b.hasAttribute("data-step")) {
      var base = u.set_temperature == null ? 21 : u.set_temperature;
      u.set_temperature = Math.min(31, Math.max(lo(u), base + (+b.getAttribute("data-step")) * 0.5));
      draw(); debounceSet(u); return;
    }
    if (b.hasAttribute("data-comfort")) {
      var r = room(u); u.set_temperature = season() === "cool" ? Math.max(24, r.comfort + 3) : r.comfort;
      draw(); send(u, { setTemperature: u.set_temperature }, "Confort " + fmt(u.set_temperature) + "°"); return;
    }
    if (b.hasAttribute("data-power")) { u.power = !u.power; draw(); send(u, { power: u.power }, u.power ? "Allumée" : "Éteinte"); return; }
    if (b.hasAttribute("data-mode")) { var m = b.getAttribute("data-mode"); if (m === u.mode) return; u.mode = m; draw(); send(u, { operationMode: m }, MODE_FR[m]); return; }
    if (b.hasAttribute("data-fan")) { var f = b.getAttribute("data-fan"); if (f === u.fan_speed) return; u.fan_speed = f; draw(); send(u, { setFanSpeed: f }, f === "Auto" ? "Ventilation auto" : "Ventilation " + (FANS.indexOf(f) + 1)); return; }
    if (b.hasAttribute("data-vv")) { onVane(u.id)({ vv: b.getAttribute("data-vv") }); return; }
    if (b.hasAttribute("data-vh")) { onVane(u.id)({ vh: b.getAttribute("data-vh") }); return; }
  }

  var setTimers = {};
  function debounceSet(u) {
    clearTimeout(setTimers[u.id]);
    setTimers[u.id] = setTimeout(function () { send(u, { setTemperature: u.set_temperature }, "Consigne " + fmt(u.set_temperature) + "°"); }, 700);
  }
  function send(u, changes, label) {
    hold();
    api("control", { unit_id: u.id, changes: changes })
      .then(function () { if (label) toast(label); later(); })
      .catch(function (e) { if (e.needLogin) return onErr(e); toast("Commande refusée"); later(); });
  }

  // ---------- Mode de la maison (applique en une fois a toutes les pieces) ----------
  function houseChanges(k, u) {
    var r = room(u), cool = season() === "cool", c = r.comfort;
    if (!cool) {
      if (k === "maison") return { power: true, operationMode: "Heat", setTemperature: c };
      if (k === "nuit") return { power: true, operationMode: "Heat", setTemperature: r.type === "chambre" ? c : Math.max(16, c - 2) };
      if (k === "absent") return { power: true, operationMode: "Heat", setTemperature: Math.max(16, c - 3) };
      return { power: true, operationMode: "Heat", setTemperature: 10 };
    }
    var t = Math.max(24, c + 3);
    if (k === "maison") return { power: true, operationMode: "Cool", setTemperature: t };
    if (k === "nuit") return r.type === "chambre" ? { power: true, operationMode: "Cool", setTemperature: t } : { power: false };
    return { power: false };
  }
  function applyHouse(k) {
    var h = HOUSE.filter(function (x) { return x.k === k; })[0]; if (!h) return;
    buzz(); hold(8000);
    S.house = { k: k, at: Date.now() }; put(DEMO ? "demo_house" : "house", JSON.stringify(S.house));
    var plan = S.units.map(function (u) { return { u: u, c: houseChanges(k, u) }; });
    plan.forEach(function (p) {
      if ("power" in p.c) p.u.power = p.c.power;
      if (p.c.operationMode) p.u.mode = p.c.operationMode;
      if (p.c.setTemperature != null) p.u.set_temperature = p.c.setTemperature;
    });
    draw(); toast(h.n + "…");
    var fails = 0;
    (function next(i) {
      if (i >= plan.length) { toast(fails ? h.n + " · " + fails + " pièce(s) en échec" : h.n + " appliqué"); later(); return; }
      api("control", { unit_id: plan[i].u.id, changes: plan[i].c }).then(function () { next(i + 1); }).catch(function () { fails++; next(i + 1); });
    })(0);
  }

  function allOff() {
    buzz(); hold(8000);
    var list = S.units.filter(function (u) { return u.power; }); if (!list.length) return;
    list.forEach(function (u) { u.power = false; }); draw(); toast("Extinction…");
    var fails = 0;
    (function next(i) {
      if (i >= list.length) { toast(fails ? fails + " pièce(s) en échec" : "Tout est éteint"); later(); return; }
      api("control", { unit_id: list[i].id, changes: { power: false } }).then(function () { next(i + 1); }).catch(function () { fails++; next(i + 1); });
    })(0);
  }

  var laterT;
  function later() { clearTimeout(laterT); laterT = setTimeout(refresh, 2500); }
  function refresh() {
    api("list", {}).then(function (d) {
      if (!d.units || Date.now() < S.busyUntil || document.querySelector(".veil")) return;
      S.units = d.units; draw();
    }).catch(function (e) { if (e.needLogin) onErr(e); });
  }
  function loadLinky() {
    api("daily", { days: 62 }, FN_LINKY).then(function (d) {
      if (!d.linked) { S.linky = { linked: false }; }
      else {
        var m = {}; (d.values || []).forEach(function (v) { m[String(v.day).slice(0, 10)] = (Number(v.wh) || 0) / 1000; });
        S.linky = { linked: true, days: m };
      }
      if (Date.now() >= S.busyUntil) draw();
    }).catch(function (e) { S.linky = { linked: true, error: e.message || "indisponible" }; draw(); });
  }
  function loadEnergy() {
    setTimeout(loadLinky, DEMO ? 300 : 1200);
    S.units.forEach(function (u) {
      api("energy", { unit_id: u.id, days: 62 }).then(function (d) {
        S.energy[u.id] = (d.values || []).map(function (v) { return { d: String(v.time).slice(0, 10), kwh: (Number(v.value) || 0) / 1000 }; });
        if (Date.now() >= S.busyUntil) draw();
      }).catch(function () {});
    });
  }

  var autoT;
  function startAuto() { stopAuto(); autoT = setInterval(function () { if (!document.hidden) refresh(); }, 12000); document.addEventListener("visibilitychange", onVis); }
  function stopAuto() { clearInterval(autoT); document.removeEventListener("visibilitychange", onVis); }
  function onVis() { if (!document.hidden) refresh(); }

  // ---------- Feuilles ----------
  function sheet(html, onReady) {
    var v = document.createElement("div"); v.className = "veil";
    v.innerHTML = '<div class="sheet gut" role="dialog">' + html + '</div>';
    v.addEventListener("click", function (e) { if (e.target === v) v.remove(); });
    document.body.appendChild(v); onReady(v);
  }
  function openSettings() {
    var seasons = [["auto", "Selon la saison"], ["heat", "Chauffage"], ["cool", "Rafraîchissement"]];
    sheet('<h3>Réglages</h3>' +
      '<div class="fld"><span>Saison</span><div class="pick" id="ss">' + seasons.map(function (s) { return '<button data-s="' + s[0] + '" aria-pressed="' + (S.season === s[0]) + '">' + s[1] + '</button>'; }).join("") + '</div></div>' +
      '<p class="hint">Détermine ce que font les modes Maison, Nuit, Absent et Vacances. Actuellement : ' + (season() === "cool" ? "rafraîchissement" : "chauffage") + '.</p>' +
      '<label class="fld"><span>Prix du kWh (€)</span><input id="tf" type="number" step="0.0001" inputmode="decimal" value="' + S.tariff + '"></label>' +
      '<p class="hint">Tarif réglementé base : environ 0,2016 €.</p>' +
      '<button class="lkrow" id="lk"><span><b>Compteur Linky</b><small>' + (S.linky && S.linky.linked ? "Relié, consommation réelle affichée" : "Non relié") + '</small></span>' + svg('<path d="m9 6 6 6-6 6"/>', 1.8) + '</button>' +
      '<button class="cta" id="sv">Enregistrer</button>' +
      (DEMO ? '<a class="ghost" href="./">Quitter la démonstration</a>' : '<button class="ghost" id="lo">Se déconnecter</button>'), function (v) {
      var pick = S.season;
      v.querySelector("#lk").addEventListener("click", function () { v.remove(); openLinky(); });
      v.querySelector("#ss").addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return; pick = b.getAttribute("data-s");
        Array.prototype.forEach.call(v.querySelectorAll("#ss button"), function (x) { x.setAttribute("aria-pressed", x === b); });
      });
      v.querySelector("#sv").addEventListener("click", function () {
        var x = parseFloat(String(v.querySelector("#tf").value).replace(",", ".")); if (x > 0) { S.tariff = x; put("tariff", String(x)); }
        S.season = pick; put("season", pick); v.remove(); draw(); toast("Enregistré");
      });
      var l = v.querySelector("#lo"); if (l) l.addEventListener("click", function () { v.remove(); logout(); });
    });
  }
  function openLinky() {
    var linked = S.linky && S.linky.linked;
    sheet('<h3>Compteur Linky</h3><div id="lkb"><p class="hint" style="margin:0">Vérification…</p></div>', function (v) {
      var box = v.querySelector("#lkb");
      api("status", {}, FN_LINKY).then(function (d) { render(d.linked, d.prm); }).catch(function () { render(linked, null); });
      function render(isLinked, prm) {
        if (isLinked) {
          box.innerHTML = '<p class="lkok">Relié au point de livraison ' + esc(prm || "") + '.</p>' +
            '<p class="hint" style="margin-top:0">La consommation de la maison est lue chez Enedis une fois par jour, puis conservée sur le serveur. Le jeton d’accès est chiffré et n’est jamais renvoyé à l’application.</p>' +
            '<button class="ghost" id="ul">Délier le compteur</button>';
          box.querySelector("#ul").addEventListener("click", function () {
            api("unlink", {}, FN_LINKY).then(function () { S.linky = { linked: false }; v.remove(); draw(); toast("Compteur délié"); })
              .catch(function () { toast("Opération impossible"); });
          });
          return;
        }
        box.innerHTML =
          '<ol class="steps"><li>Autorisez le partage de vos données Enedis avec Conso API, un service gratuit. Connectez-vous avec votre compte Enedis.' +
          '<a class="ghost" href="https://conso.boris.sh/api/auth" target="_blank" rel="noopener">Ouvrir Conso API</a></li>' +
          '<li>À la fin, copiez le jeton affiché et collez-le ci-dessous.</li></ol>' +
          '<label class="fld"><span>Jeton Conso API</span><input id="ct" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"></label>' +
          '<label class="fld"><span>Point de livraison (PRM, 14 chiffres)</span><input id="pr" inputmode="numeric" autocomplete="off" maxlength="17"></label>' +
          '<p class="hint">Le PRM figure sur votre facture, dans votre compte Enedis, ou sur le Linky en appuyant sur la touche +.</p>' +
          '<button class="cta" id="go">Relier le compteur</button><p class="err" id="le"></p>';
        box.querySelector("#go").addEventListener("click", function () {
          var ct = box.querySelector("#ct").value.trim(), pr = box.querySelector("#pr").value.replace(/\s/g, ""), go = box.querySelector("#go"), le = box.querySelector("#le");
          if (!/^\d{14}$/.test(pr)) { le.textContent = "Le PRM compte 14 chiffres."; return; }
          if (ct.length < 20) { le.textContent = "Collez le jeton complet."; return; }
          go.disabled = true; go.textContent = "Vérification auprès d’Enedis…"; le.textContent = "";
          api("setup", { conso_token: ct, prm: pr }, FN_LINKY).then(function () {
            box.querySelector("#ct").value = "";
            v.remove(); toast("Compteur relié"); S.linky = null; loadLinky();
          }).catch(function (e) {
            box.querySelector("#ct").value = "";
            go.disabled = false; go.textContent = "Relier le compteur"; le.textContent = e.message || "Liaison impossible.";
          });
        });
      }
    });
  }
  function openRoom(u) {
    var r = room(u), t = r.type, c = r.comfort;
    sheet('<h3>' + esc(u.name) + '</h3>' +
      '<div class="fld"><span>Type de pièce</span><div class="pick" id="rt">' + TYPES.map(function (x) { return '<button data-t="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + '</button>'; }).join("") + '</div></div>' +
      '<div class="fld"><span>Température de confort</span><div class="step"><button data-d="-1" aria-label="Baisser">' + svg('<path d="M6 12h12"/>', 2) + '</button><b id="cv">' + fmt(c) + '°</b><button data-d="1" aria-label="Monter">' + svg('<path d="M12 6v12M6 12h12"/>', 2) + '</button></div></div>' +
      '<p class="hint">La seule valeur à régler. Nuit, absence et vacances en découlent automatiquement.</p>' +
      '<button class="cta" id="sv">Enregistrer</button>', function (v) {
      v.querySelector("#rt").addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return;
        var prevDef = TYPES.filter(function (x) { return x[0] === t; })[0][2];
        t = b.getAttribute("data-t");
        if (c === prevDef) { c = TYPES.filter(function (x) { return x[0] === t; })[0][2]; v.querySelector("#cv").textContent = fmt(c) + "°"; }
        Array.prototype.forEach.call(v.querySelectorAll("#rt button"), function (x) { x.setAttribute("aria-pressed", x === b); });
      });
      v.querySelector(".step").addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return; buzz();
        c = Math.min(26, Math.max(16, c + (+b.getAttribute("data-d")) * 0.5)); v.querySelector("#cv").textContent = fmt(c) + "°";
      });
      v.querySelector("#sv").addEventListener("click", function () {
        S.rooms[u.id] = { type: t, comfort: c }; saveRooms(); v.remove(); draw(); toast("Pièce enregistrée");
      });
    });
  }

  // ---------- Installation ----------
  if ("serviceWorker" in navigator && !DEMO) { window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); }); }

  if (DEMO || S.access || S.refresh) renderApp(); else renderLogin();
})();
