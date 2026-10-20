(function () {
  "use strict";
  var FN = "https://lwftspnyvoqejetemyhu.supabase.co/functions/v1/melcloud";
  var FN_LINKY = "https://lwftspnyvoqejetemyhu.supabase.co/functions/v1/linky";
  var FN_ENGINE = "https://lwftspnyvoqejetemyhu.supabase.co/functions/v1/engine";
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
    tariff: parseFloat(get("tariff") && get("tariff") !== "0.2016" ? get("tariff") : "0.1923"),
    sub: parseFloat(get("sub") || "16.811"),
    fails: +(get("fails") || 0), lockUntil: +(get("lockUntil") || 0),
    units: [], view: get("view") || "home", energy: {}, busyUntil: 0,
    rooms: getJ("rooms", {}), season: get("season") || "auto", house: getJ("house", null),
    hinted: get("hinted") === "1", linky: null,
    doc: getJ(DEMO ? "demo_doc" : "doc", {}), server: null, elog: [], clim: [], view2: null
  };
  if (DEMO) { S.rooms = getJ("demo_rooms", {}); S.house = getJ("demo_house", null); }
  function saveRooms() { put(DEMO ? "demo_rooms" : "rooms", JSON.stringify(S.rooms)); }
  // Reglages partages (serveur) : le document du serveur fait foi, une copie locale sert hors ligne.
  function adoptDoc(d) {
    if (!d) return;
    S.doc = d; put(DEMO ? "demo_doc" : "doc", JSON.stringify(d));
    if (d.rooms) { S.rooms = d.rooms; saveRooms(); }
    if (d.tariff) { S.tariff = d.tariff; put("tariff", String(d.tariff)); }
    if (d.sub != null) { S.sub = d.sub; put("sub", String(d.sub)); }
    if (d.season) { S.season = d.season; put("season", d.season); }
    if (d.house) { S.house = d.house; put(DEMO ? "demo_house" : "house", JSON.stringify(d.house)); }
  }
  function mergeLocal(doc, p) {
    var d = JSON.parse(JSON.stringify(doc || {}));
    ["tariff", "sub", "season"].forEach(function (k) { if (p[k] != null) d[k] = p[k]; });
    if (p.rooms) { d.rooms = d.rooms || {}; for (var id in p.rooms) d.rooms[id] = p.rooms[id]; }
    if (p.house) d.house = { k: p.house.k, at: Date.now(), until: p.house.until || null };
    if (p.program) {
      d.program = d.program || {};
      if (typeof p.program.enabled === "boolean") d.program.enabled = p.program.enabled;
      if (p.program.rhythm) d.program.rhythm = p.program.rhythm;
      if (p.program.custom) { d.program.custom = d.program.custom || {}; for (var u in p.program.custom) { if (p.program.custom[u]) d.program.custom[u] = p.program.custom[u]; else delete d.program.custom[u]; } }
    }
    return d;
  }
  function saveDoc(patch, okMsg) {
    adoptDoc(mergeLocal(S.doc, patch)); draw();
    return api("save", { patch: patch }, FN_ENGINE).then(function (d) { if (d.doc) adoptDoc(d.doc); if (okMsg) toast(okMsg); draw(); })
      .catch(function (e) { if (e.needLogin) return onErr(e); toast("Enregistré sur ce téléphone seulement"); });
  }
  function loadEngine() {
    return api("state", {}, FN_ENGINE).then(function (d) {
      var local = S.doc || {};
      // Premiere synchronisation : on envoie au serveur les reglages deja faits sur ce telephone.
      if (d.doc && !d.doc.rooms && local.rooms === undefined && Object.keys(S.rooms || {}).length) {
        api("save", { patch: { rooms: S.rooms } }, FN_ENGINE).then(function (r) { if (r.doc) { adoptDoc(r.doc); draw(); } }).catch(function () {});
      }
      adoptDoc(d.doc || {}); S.server = d.server || null; S.elog = d.log || []; S.clim = d.clim || [];
      if (Date.now() >= S.busyUntil && !document.querySelector(".veil")) draw();
    }).catch(function (e) { if (e.needLogin) onErr(e); });
  }
  function nowP() { var d = new Date(); return { dow: (d.getDay() + 6) % 7 + 1, min: d.getHours() * 60 + d.getMinutes(), ms: d.getTime() }; }
  function docNow() {
    return { rooms: S.rooms, season: S.season, program: (S.doc && S.doc.program) || {}, house: S.house || { k: "maison" } };
  }

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
  function api(action, extra, fn, raw) {
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
      if (res.d.token && !raw) saveTokens(res.d.token);
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
        if (fn === FN_ENGINE) {
          var dd = getJ("demo_doc", {});
          if (action === "save") { dd = mergeLocal(dd, x.patch || {}); put("demo_doc", JSON.stringify(dd)); return ok({ ok: true, doc: dd }); }
          if (action === "state") return ok({ doc: dd, server: { linked: get("demo_srv") === "1", status: get("demo_srv") === "1" ? "actif" : null, last_tick: new Date(Date.now() - 140e3).toISOString() }, log: [{ ts: new Date(Date.now() - 3600e3).toISOString(), unit_id: "d1", text: "Programme : chauffage 21°." }], clim: [] });
          if (action === "link") { put("demo_srv", "1"); return ok({ ok: true }); }
          if (action === "unlink") { put("demo_srv", "0"); return ok({ ok: true }); }
          return ok({ ok: true });
        }
        if (action === "login") return ok({ ok: true, units: [], token: { access_token: "demo", refresh_token: "demo", expires_in: 3600 } });
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
  function eurS(v) { return eur(v, Math.abs(v) < 10 ? 2 : 0); }
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
    api("list", {}).then(function (d) { if (d.units) { S.units = d.units; draw(); loadEngine(); loadEnergy(); } }).catch(onErr);
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
    if (S.view === "prog") { drawTopTitle("Programmation"); main.innerHTML = progHTML(); document.documentElement.style.setProperty("--acc", "var(--blue)"); return; }
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
    var cap = hd ? hd.d + ' <span class="when">' + (S.house.until ? "Jusqu’au " + new Date(S.house.until).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + " à " + hm(S.house.until) : "Depuis " + hm(S.house.at)) + '.</span>' : "Un geste règle toute la maison.";

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
      '<p class="segcap">' + cap + '</p>' + progRow() +
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
      return '<div class="sp"><span>' + esc(u.name) + '</span><span class="tr"><b style="width:' + p.toFixed(1) + '%"></b></span><span class="v">' + eurS(v * S.tariff) + '<small>' + fmt(v) + ' kWh</small></span></div>';
    }).join("") + '</div>';
  }

  // Part des clims pour un jour : deduite de la courbe Linky quand le moteur a releve l'etat des clims
  // sur la quasi-totalite de la journee, sinon estimation Mitsubishi.
  function climDay(k, c) {
    for (var i = 0; i < (S.clim || []).length; i++) {
      var r = S.clim[i];
      if (String(r.day).slice(0, 10) === k && +r.slots > 0 && +r.covered / +r.slots >= 0.8) return { kwh: +r.clim_kwh, measured: true };
    }
    return { kwh: c.days[k] || 0, measured: false };
  }
  // Consommation reelle (Linky) : maison mesuree, part de la climatisation sur les memes jours.
  function linkyHTML(c, D) {
    var t = S.tariff, now = new Date(), mk = iso(now).slice(0, 7);
    var pk = iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)).slice(0, 7);
    var dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    var cur = 0, prev = 0, n = 0, clim = 0, meas = 0;
    Object.keys(D).forEach(function (k) {
      if (k.slice(0, 7) === mk) { var cd = climDay(k, c); cur += D[k]; n++; clim += cd.kwh; if (cd.measured) meas++; }
      else if (k.slice(0, 7) === pk) prev += D[k];
    });
    var proj = n ? cur / n * dim : 0;
    // Facture estimee : energie mesuree + abonnement au prorata des jours mesures.
    var subCur = S.sub * n / dim, billCur = cur * t + subCur, billProj = proj * t + S.sub, billPrev = prev * t + S.sub;
    var delta = prev > 0 && n ? (billProj - billPrev) / billPrev * 100 : null;
    var share = cur > 0 ? Math.min(100, clim / cur * 100) : 0, other = Math.max(0, cur - clim);
    var keys = Object.keys(D).sort().slice(-30), max = 0;
    keys.forEach(function (k) { if (D[k] > max) max = D[k]; });
    var bars = keys.map(function (k) {
      var h = max ? Math.max(4, D[k] / max * 100) : 4, cp = D[k] > 0 ? Math.min(100, climDay(k, c).kwh / D[k] * 100) : 0;
      return '<i style="height:' + h.toFixed(1) + '%" title="' + esc(k) + ' · ' + fmt(D[k]) + ' kWh"><b style="height:' + cp.toFixed(1) + '%"></b></i>';
    }).join("");
    var dl = delta == null ? "" : '<span class="dl ' + (delta > 0 ? "up" : "dn") + '">' + (delta > 0 ? "+" : "−") + Math.abs(Math.round(delta)) + ' % vs ' + c.pmonth + '</span>';
    var lastK = keys[keys.length - 1];
    return '<div class="cons lk">' +
      '<div class="ch"><div><div class="cm">Facture · ' + c.month + ' à ce jour</div><div class="eur">' + eur(billCur) + '</div></div>' +
      '<div class="pj"><div class="cm">Projection fin de mois</div><div class="pv">' + eur(billProj, 0) + '</div>' + dl + '</div></div>' +
      '<p class="bk">Électricité ' + eur(cur * t) + ' · abonnement ' + eur(subCur) + '</p>' +
      '<div class="mix"><div><span class="sw cl"></span>Climatisation<b>' + eurS(clim * t) + '</b><small>' + fmt(clim) + ' kWh · ' + (share > 0 && share < 1 ? "moins de 1" : Math.round(share)) + ' %</small></div>' +
      '<div><span class="sw ot"></span>Autres usages<b>' + eurS(other * t) + '</b><small>' + fmt(other) + ' kWh · ' + Math.round(100 - share) + ' %</small></div></div>' +
      '<div class="bars stack" aria-label="Consommation de la maison, 30 derniers jours">' + bars + '</div>' +
      splitsHTML(c) +
      '<p class="n">Maison : ' + fmt(cur) + ' kWh mesurés par le compteur Linky' + (lastK ? ', jusqu’au ' + lastK.slice(8, 10) + '/' + lastK.slice(5, 7) : "") + ' (Enedis publie les données le lendemain). ' +
      cap1(c.pmonth) + ' : ' + eur(billPrev, 0) + ' abonnement compris. Prix de votre contrat : ' + String(t).replace(".", ",") + ' €/kWh, abonnement ' + String(S.sub).replace(".", ",") + ' €/mois TTC. Part de la climatisation : ' + (meas === n && n ? "déduite de la courbe Linky, demi-heure par demi-heure." : meas ? "déduite de la courbe Linky sur " + meas + " jour" + (meas > 1 ? "s" : "") + ", estimation Mitsubishi sur les autres." : "estimation Mitsubishi. Elle sera déduite de la courbe Linky dès que le pilotage automatique relèvera l’état des clims.") + '</p>' +
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
      '<p class="status">' + status + '</p>' + progLine(u) +
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
    if (b.hasAttribute("data-house")) { pickHouse(b.getAttribute("data-house")); return; }
    if (S.view === "prog" && onProgClick(b)) return;
    if (b.hasAttribute("data-prog")) { S.view = "prog"; put("view", "prog"); buzz(); draw(); window.scrollTo(0, 0); return; }
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
  function houseChanges(k, u, until) {
    var d = docNow(); d.house = { k: k, until: until || null };
    var t = Prog.target(d, u, nowP(), new Date().getMonth()) || Prog.setting("confort", room(u).comfort, season());
    return t.power ? { power: true, operationMode: t.mode, setTemperature: t.set } : { power: false };
  }
  // Choix du mode : demande l'heure de retour quand elle a un sens, puis applique.
  function pickHouse(k) {
    if (k === "maison") return applyHouse("maison", null);
    if (k === "nuit") {
      var r = Prog.rhythm(S.doc && S.doc.program && S.doc.program.rhythm), d = new Date(), n = new Date(d);
      n.setDate(d.getDate() + (d.getHours() >= 12 ? 1 : 0));
      var we = n.getDay() === 0 || n.getDay() === 6, w = Prog.m(we ? r.wake_we : r.wake_wd);
      n.setHours(Math.floor(w / 60), w % 60, 0, 0);
      if (n.getTime() <= Date.now()) n.setDate(n.getDate() + 1);
      return applyHouse("nuit", n.getTime());
    }
    var rh = Prog.rhythm(S.doc && S.doc.program && S.doc.program.rhythm);
    function at(dayOffset, hhmm) { var x = new Date(); x.setDate(x.getDate() + dayOffset); var mm = Prog.m(hhmm); x.setHours(Math.floor(mm / 60), mm % 60, 0, 0); return x; }
    function fmtD(x) { return x.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) + " à " + Prog.hhmm(x.getHours() * 60 + x.getMinutes()); }
    if (k === "absent") {
      var back = at(0, rh.back); if (back.getTime() <= Date.now() + 15 * 60e3) back = at(1, rh.back);
      var tomorrow = at(back.getDate() === new Date().getDate() ? 1 : 2, rh.back);
      sheet('<h3>Absent</h3><p class="hint" style="margin-top:0">' + (season() === "cool" ? "Clims arrêtées pendant votre absence." : "Chauffage abaissé de 3° partout.") + ' La maison reprend son programme à votre retour.</p>' +
        '<div class="opts2">' +
          '<button class="lkrow" data-u="' + back.getTime() + '"><span><b>Retour ' + (back.getDate() === new Date().getDate() ? "ce soir" : "demain") + '</b><small>' + fmtD(back) + '</small></span></button>' +
          '<button class="lkrow" data-u="' + tomorrow.getTime() + '"><span><b>Retour le lendemain</b><small>' + fmtD(tomorrow) + '</small></span></button>' +
          '<button class="lkrow" data-u=""><span><b>Sans date de retour</b><small>Choisissez Maison en rentrant</small></span></button>' +
        '</div>' +
        '<label class="fld" style="margin-top:14px"><span>Ou retour le</span><input id="dt" type="datetime-local"></label>' +
        '<button class="cta" id="okdt">Valider cette date</button>', function (v) {
        v.querySelector(".opts2").addEventListener("click", function (e) {
          var b = e.target.closest("button"); if (!b) return; v.remove();
          applyHouse("absent", b.getAttribute("data-u") ? +b.getAttribute("data-u") : null);
        });
        v.querySelector("#okdt").addEventListener("click", function () {
          var x = new Date(v.querySelector("#dt").value); if (isNaN(x) || x.getTime() <= Date.now()) { toast("Choisissez une date à venir"); return; }
          v.remove(); applyHouse("absent", x.getTime());
        });
      });
      return;
    }
    if (k === "vacances") {
      var def = at(7, "08:00");
      sheet('<h3>Vacances</h3><p class="hint" style="margin-top:0">Hors-gel en hiver, arrêt complet en été. La maison est remise en température le matin de votre retour.</p>' +
        '<label class="fld"><span>Date de retour</span><input id="dd" type="date" value="' + iso(def) + '" min="' + iso(new Date()) + '"></label>' +
        '<button class="cta" id="okv">Partir en vacances</button>', function (v) {
        v.querySelector("#okv").addEventListener("click", function () {
          var val = v.querySelector("#dd").value; if (!val) return;
          var x = new Date(val + "T06:00:00"); if (x.getTime() <= Date.now()) { toast("Choisissez une date à venir"); return; }
          v.remove(); applyHouse("vacances", x.getTime());
        });
      });
    }
  }
  function applyHouse(k, until) {
    var h = HOUSE.filter(function (x) { return x.k === k; })[0]; if (!h) return;
    buzz(); hold(8000);
    saveDoc({ house: { k: k, until: until || null } });
    var plan = S.units.map(function (u) { return { u: u, c: houseChanges(k, u, until) }; });
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
  var engT;
  function startAuto() {
    stopAuto(); autoT = setInterval(function () { if (!document.hidden) refresh(); }, 12000);
    engT = setInterval(function () { if (!document.hidden && !document.querySelector(".veil")) loadEngine(); }, 60000);
    document.addEventListener("visibilitychange", onVis);
  }
  function stopAuto() { clearInterval(autoT); clearInterval(engT); document.removeEventListener("visibilitychange", onVis); }
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
      '<label class="fld"><span>Prix du kWh TTC (€)</span><input id="tf" type="number" step="0.0001" inputmode="decimal" value="' + S.tariff + '"></label>' +
      '<label class="fld"><span>Abonnement TTC (€ par mois)</span><input id="sb" type="number" step="0.001" inputmode="decimal" value="' + S.sub + '"></label>' +
      '<p class="hint">Valeurs de votre contrat Base. À modifier seulement si votre fournisseur change ses prix.</p>' +
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
        var y = parseFloat(String(v.querySelector("#sb").value).replace(",", ".")); if (y >= 0) { S.sub = y; put("sub", String(y)); }
        S.season = pick; put("season", pick); v.remove(); draw();
        saveDoc({ tariff: S.tariff, sub: S.sub, season: pick }, "Enregistré");
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
          '<li>À la fin, copiez le premier bloc, celui qui commence par « ey ». Le second bloc, « linky auth -t … », contient le même jeton : inutile de le copier.</li></ol>' +
          '<label class="fld"><span>Jeton Conso API</span><input id="ct" type="password" autocomplete="off" autocapitalize="off" spellcheck="false"></label>' +
          '<label class="fld" id="prf"><span>Point de livraison (PRM, 14 chiffres)</span><input id="pr" inputmode="numeric" autocomplete="off" maxlength="17"></label>' +
          '<p class="hint" id="prh">Rempli automatiquement à partir du jeton. Sinon : sur votre facture, dans votre compte Enedis, ou sur le Linky avec la touche +.</p>' +
          '<button class="cta" id="go">Relier le compteur</button><p class="err" id="le"></p>';
        // Le jeton Conso API est un JWT dont le champ « sub » liste les PRM autorises.
        function clean(v) { return String(v || "").replace(/^\s*linky\s+auth\s+-t\s+/i, "").replace(/\s+/g, ""); }
        function prmsOf(tk) {
          try { var p = JSON.parse(atob(tk.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub; return Array.isArray(p) ? p : p ? [p] : []; } catch (e) { return []; }
        }
        box.querySelector("#ct").addEventListener("input", function () {
          var list = prmsOf(clean(this.value)), pr = box.querySelector("#pr"), h = box.querySelector("#prh");
          if (list.length === 1) { pr.value = list[0]; h.textContent = "Compteur détecté dans le jeton."; }
          else if (list.length > 1) { h.textContent = "Ce jeton couvre plusieurs compteurs : " + list.join(", ") + ". Saisissez celui de la maison."; }
        });
        box.querySelector("#go").addEventListener("click", function () {
          var ct = clean(box.querySelector("#ct").value), pr = box.querySelector("#pr").value.replace(/\s/g, ""), go = box.querySelector("#go"), le = box.querySelector("#le");
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
        S.rooms[u.id] = { type: t, comfort: c }; saveRooms(); v.remove();
        var pr = {}; pr[u.id] = { type: t, comfort: c }; saveDoc({ rooms: pr }, "Pièce enregistrée");
      });
    });
  }

  // ================= PROGRAMMATION =================
  var DOW = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  var ST_C = { confort: "var(--acc)", eco: "color-mix(in srgb, var(--acc) 38%, var(--panel-2))", off: "var(--panel-2)" };
  function prog() { return (S.doc && S.doc.program) || {}; }
  function srvOn() { return !!(S.server && S.server.linked); }
  function ago(ts) {
    if (!ts) return "jamais";
    var m = Math.round((Date.now() - new Date(ts).getTime()) / 60e3);
    return m < 1 ? "à l’instant" : m < 60 ? "il y a " + m + " min" : "à " + hm(ts);
  }
  function drawTopTitle(title) {
    var t = document.getElementById("top"); if (!t) return;
    t.innerHTML = '<button class="ib" data-back aria-label="Retour">' + svg(BACK, 1.8) + '</button><span class="ttl">' + esc(title) + '</span><span></span>';
  }
  function stLabel(t, u) {
    if (!t.power) return "arrêt";
    return (t.mode === "Cool" ? "froid " : "") + fmt(t.set) + "°";
  }
  // Prochaine etape la plus proche toutes pieces confondues (pour l'accueil).
  function nextStep() {
    var best = null, now = nowP();
    S.units.forEach(function (u) {
      var st = Prog.stateAt(Prog.daysOf(docNow(), u), now.dow, now.min);
      if (!st.next) return;
      var dist = st.next.inDays * 1440 + Prog.m(st.next.t) - now.min;
      if (!best || dist < best.dist) best = { dist: dist, u: u, n: st.next };
    });
    return best;
  }
  function progRow() {
    var p = prog(), sub;
    if (!srvOn()) sub = "Désactivée · le téléphone pilote seulement à la demande";
    else if (S.house && S.house.k !== "maison" && (!S.house.until || S.house.until > Date.now())) {
      var hh = HOUSE.filter(function (x) { return x.k === S.house.k; })[0];
      sub = (hh ? hh.n : "Mode") + " en cours" + (S.house.until ? " · reprise le " + new Date(S.house.until).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }) + " à " + hm(S.house.until) : "");
    }
    else if (!p.enabled) sub = "Pilotage automatique actif, programmes en pause";
    else {
      var n = nextStep();
      sub = n ? "Prochaine étape " + (n.n.inDays ? DOW[((nowP().dow - 1 + n.n.inDays) % 7)].toLowerCase() + ". " : "") + n.n.t + " · " + n.u.name + " en " + Prog.STATES[n.n.s].toLowerCase() : "Programmes actifs";
    }
    return '<button class="lkrow prow" data-prog><span><b>Programmation</b><small>' + esc(sub) + '</small></span>' + svg('<path d="m9 6 6 6-6 6"/>', 1.8) + '</button>';
  }
  // Ligne d'etat du programme sur l'ecran d'une piece.
  function progLine(u) {
    var d = docNow(), now = nowP(), t = Prog.target(d, u, now, new Date().getMonth());
    if (!t) return "";
    var h = S.house || {}, txt;
    if (t.why !== "Programme") txt = t.why + (h.until ? " jusqu’au " + new Date(h.until).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " " + hm(h.until) : "") + " · " + stLabel(t, u);
    else {
      var st = Prog.stateAt(Prog.daysOf(d, u), now.dow, now.min), n = st.next;
      var match = t.power ? (u.power && u.mode === t.mode && Number(u.set_temperature) === t.set) : !u.power;
      txt = match ? "Programme · " + Prog.STATES[t.state].toLowerCase() + " " + stLabel(t, u) + (n ? " jusqu’à " + n.t : "")
        : "Réglage manuel" + (n ? " · le programme reprend à " + n.t : "");
    }
    if (!srvOn()) txt += " · pilotage automatique inactif";
    return '<p class="pline">' + esc(txt) + '</p>';
  }
  function bar(days, d) {
    var l = days[d] || [], segs = "";
    for (var i = 0; i < l.length; i++) {
      var a = Prog.m(l[i].t), b = i + 1 < l.length ? Prog.m(l[i + 1].t) : 1440;
      segs += '<i style="left:' + (a / 14.4).toFixed(2) + '%;width:' + ((b - a) / 14.4).toFixed(2) + '%;background:' + ST_C[l[i].s] + '"></i>';
    }
    return '<span class="tl">' + segs + '</span>';
  }
  function progHTML() {
    var p = prog(), r = Prog.rhythm(p.rhythm), today = nowP().dow;
    var srv = srvOn()
      ? '<div class="pcard"><div class="prow2"><span><b>Pilotage automatique</b><small>' + esc(S.server.status === "actif" ? "Actif · dernier relevé " + ago(S.server.last_tick) : "Attention : " + (S.server.status || "état inconnu")) + '</small></span>' +
        '<button class="sw on" data-srv aria-label="Désactiver le pilotage automatique"><i></i></button></div></div>'
      : '<div class="pcard"><div class="prow2"><span><b>Pilotage automatique</b><small>Inactif. Le serveur applique les modes et les programmes toutes les 5 minutes, téléphone éteint.</small></span>' +
        '<button class="sw" data-srv aria-label="Activer le pilotage automatique"><i></i></button></div></div>';
    var en = '<div class="pcard"><div class="prow2"><span><b>Programmes</b><small>' + (p.enabled ? "Actifs : chaque pièce suit son programme." : "En pause : les clims ne changent que sur votre demande.") + '</small></span>' +
      '<button class="sw' + (p.enabled ? " on" : "") + '" data-pen aria-label="Programmes"><i></i></button></div></div>';
    var work = r.work.map(function (d) { return DOW[d - 1].toLowerCase(); }).join(", ");
    var rem = r.remote.length ? " · télétravail " + r.remote.map(function (d) { return DOW[d - 1].toLowerCase(); }).join(", ") : "";
    var rh = '<div class="pcard"><div class="prow2"><span><b>Mon rythme</b><small>Semaine : lever ' + r.wake_wd + ', coucher ' + r.sleep_wd + '. Week-end : lever ' + r.wake_we + ', coucher ' + r.sleep_we + '. Absents de ' + r.leave + ' à ' + r.back + ' (' + esc(work) + ')' + esc(rem) + '.</small></span>' +
      '<button class="lnk" data-rhythm>Modifier</button></div></div>';
    var rooms = S.units.map(function (u) {
      var d = docNow(), days = Prog.daysOf(d, u), rm = room(u), custom = !!((p.custom || {})[u.id]);
      var rows = "";
      for (var k = 1; k <= 7; k++) rows += '<div class="tlr' + (k === today ? " today" : "") + '"><span>' + DOW[k - 1] + '</span>' + bar(days, k) + '</div>';
      return '<button class="pcard proom" data-rprog="' + esc(u.id) + '"><div class="prow2"><span><b>' + esc(u.name) + '</b><small>' +
        esc(TYPES.filter(function (t) { return t[0] === rm.type; })[0][1]) + ' · confort ' + fmt(rm.comfort) + '°' + (custom ? " · personnalisé" : " · selon mon rythme") + '</small></span>' + svg('<path d="m9 6 6 6-6 6"/>', 1.8) + '</div>' +
        '<div class="tls">' + rows + '<div class="tlx"><span></span><span class="ax"><em>0h</em><em>6h</em><em>12h</em><em>18h</em><em>24h</em></span></div></div></button>';
    }).join("");
    var legend = '<div class="leg"><span><i style="background:' + ST_C.confort + '"></i>Confort</span><span><i style="background:' + ST_C.eco + '"></i>Éco (−2°)</span><span><i style="background:' + ST_C.off + '"></i>Arrêt</span></div>';
    var logs = (S.elog || []).slice(0, 12).map(function (l) {
      var u = unitById(l.unit_id);
      return '<li><time>' + new Date(l.ts).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + ' ' + hm(l.ts) + '</time>' + (u ? esc(u.name) + " · " : "") + esc(l.text) + '</li>';
    }).join("");
    return '<section class="progv">' + srv + en + rh +
      '<div class="sh"><span>Programmes par pièce</span></div>' + legend + rooms +
      '<p class="note2">En hiver, Confort chauffe à la température de la pièce et Éco l’abaisse de 2°. En été, Confort rafraîchit à 24° au moins et Éco arrête la clim. Les périodes de confort démarrent 30 minutes à l’avance. Un réglage fait à la main reste en place jusqu’à l’étape suivante.</p>' +
      (logs ? '<div class="sh"><span>Journal du moteur</span></div><ul class="elog">' + logs + '</ul>' : "") +
      '</section>';
  }

  function onProgClick(b) {
    if (b.hasAttribute("data-pen")) {
      if (!srvOn() && !prog().enabled) toast("Activez aussi le pilotage automatique pour que les programmes tournent téléphone éteint");
      saveDoc({ program: { enabled: !prog().enabled } }, prog().enabled ? "Programmes en pause" : "Programmes actifs");
      return true;
    }
    if (b.hasAttribute("data-srv")) { if (srvOn()) unlinkServer(); else openServer(); return true; }
    if (b.hasAttribute("data-rhythm")) { openRhythm(); return true; }
    if (b.hasAttribute("data-rprog")) { openRoomProg(unitById(b.getAttribute("data-rprog"))); return true; }
    return false;
  }

  // Selecteur d'heure independant de la langue du telephone (toujours sur 24 heures, pas de 5 minutes).
  function timeSel(val, attrs, disabled) {
    var m0 = Prog.m(val), h = Math.floor(m0 / 60), mi = m0 % 60 - (m0 % 60) % 5, o = "", i;
    for (i = 0; i < 24; i++) o += '<option value="' + i + '"' + (i === h ? " selected" : "") + '>' + ("0" + i).slice(-2) + '</option>';
    var o2 = "";
    for (i = 0; i < 60; i += 5) o2 += '<option value="' + i + '"' + (i === mi ? " selected" : "") + '>' + ("0" + i).slice(-2) + '</option>';
    var dis = disabled ? " disabled" : "";
    return '<span class="tsel" ' + (attrs || "") + '><select data-h aria-label="Heure"' + dis + '>' + o + '</select><b>:</b><select data-mi aria-label="Minutes"' + dis + '>' + o2 + '</select></span>';
  }
  function timeVal(el) { return Prog.hhmm(+el.querySelector("[data-h]").value * 60 + +el.querySelector("[data-mi]").value); }
  function chips(id, sel) {
    return '<div class="pick days" id="' + id + '">' + DOW.map(function (d, i) { return '<button data-d="' + (i + 1) + '" aria-pressed="' + (sel.indexOf(i + 1) >= 0) + '">' + d + '</button>'; }).join("") + '</div>';
  }
  function chipVals(v, id) { return Array.prototype.filter.call(v.querySelectorAll("#" + id + " button"), function (b) { return b.getAttribute("aria-pressed") === "true"; }).map(function (b) { return +b.getAttribute("data-d"); }); }
  function openRhythm() {
    var r = Prog.rhythm(prog().rhythm);
    function t(id, lab, val) { return '<div class="fld half"><span>' + lab + '</span>' + timeSel(val, 'id="' + id + '"') + '</div>'; }
    sheet('<h3>Mon rythme</h3>' +
      '<p class="hint" style="margin-top:0">Cinq réponses suffisent : les programmes de toutes les pièces en sont déduits.</p>' +
      '<div class="grid2">' + t("wake_wd", "Lever en semaine", r.wake_wd) + t("sleep_wd", "Coucher en semaine", r.sleep_wd) + t("wake_we", "Lever le week-end", r.wake_we) + t("sleep_we", "Coucher le week-end", r.sleep_we) +
      t("leave", "Départ de la maison", r.leave) + t("back", "Retour à la maison", r.back) + '</div>' +
      '<div class="fld"><span>Jours où vous partez travailler</span>' + chips("wk", r.work) + '</div>' +
      '<div class="fld"><span>Jours de télétravail</span>' + chips("rm", r.remote) + '</div>' +
      '<button class="cta" id="sv">Enregistrer</button>', function (v) {
      v.addEventListener("click", function (e) {
        var b = e.target.closest(".days button"); if (!b) return;
        b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true");
      });
      v.querySelector("#sv").addEventListener("click", function () {
        var nr = {};
        ["wake_wd", "sleep_wd", "wake_we", "sleep_we", "leave", "back"].forEach(function (k) { nr[k] = timeVal(v.querySelector("#" + k)); });
        nr.work = chipVals(v, "wk"); nr.remote = chipVals(v, "rm");
        v.remove(); saveDoc({ program: { rhythm: nr } }, "Rythme enregistré");
      });
    });
  }

  function openRoomProg(u) {
    if (!u) return;
    var base = Prog.daysOf(docNow(), u), days = JSON.parse(JSON.stringify(base)), cur = nowP().dow;
    var custom = !!((prog().custom || {})[u.id]);
    sheet('<h3>' + esc(u.name) + '</h3><div class="pick days" id="pd"></div><div id="steps"></div>' +
      '<button class="ghost" id="add">Ajouter une étape</button>' +
      '<div class="fld" style="margin-top:18px"><span>Copier cette journée sur</span><div class="pick" id="cp"><button data-c="wd">Lundi à vendredi</button><button data-c="we">Week-end</button><button data-c="all">Tous les jours</button></div></div>' +
      '<button class="cta" id="sv">Enregistrer</button>' +
      (custom ? '<button class="ghost" id="rs">Revenir au programme selon mon rythme</button>' : ""), function (v) {
      function render() {
        v.querySelector("#pd").innerHTML = DOW.map(function (d, i) { return '<button data-d="' + (i + 1) + '" aria-pressed="' + (cur === i + 1) + '">' + d + '</button>'; }).join("");
        var l = days[cur];
        v.querySelector("#steps").innerHTML = '<div class="tlr big">' + bar(days, cur) + '</div>' + l.map(function (x, i) {
          return '<div class="step2" data-i="' + i + '">' + timeSel(x.t, "", i === 0) +
            '<div class="seg3">' + ["confort", "eco", "off"].map(function (s2) { return '<button data-s="' + s2 + '" aria-pressed="' + (x.s === s2) + '">' + Prog.STATES[s2] + '</button>'; }).join("") + '</div>' +
            (i === 0 ? '<span class="rmv"></span>' : '<button class="rmv" data-rm aria-label="Supprimer">' + svg('<path d="M6 6l12 12M18 6 6 18"/>', 1.8) + '</button>') + '</div>';
        }).join("");
      }
      function norm() {
        var l = days[cur].slice().sort(function (a, b) { return Prog.m(a.t) - Prog.m(b.t); });
        l[0].t = "00:00"; days[cur] = l;
      }
      v.querySelector("#pd").addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; cur = +b.getAttribute("data-d"); render(); });
      v.querySelector("#steps").addEventListener("click", function (e) {
        var row = e.target.closest(".step2"); if (!row) return; var i = +row.getAttribute("data-i");
        var sb = e.target.closest("[data-s]"); if (sb) { days[cur][i].s = sb.getAttribute("data-s"); render(); return; }
        if (e.target.closest("[data-rm]")) { days[cur].splice(i, 1); render(); }
      });
      v.querySelector("#steps").addEventListener("change", function (e) {
        var row = e.target.closest(".step2"); if (!row || e.target.tagName !== "SELECT") return;
        days[cur][+row.getAttribute("data-i")].t = timeVal(row); norm(); render();
      });
      v.querySelector("#add").addEventListener("click", function () {
        var l = days[cur], last = l[l.length - 1], t = Math.min(1435, Prog.m(last.t) + 120);
        if (l.length >= 12) return;
        l.push({ t: Prog.hhmm(t - t % 5), s: last.s === "confort" ? "eco" : "confort" }); norm(); render();
      });
      v.querySelector("#cp").addEventListener("click", function (e) {
        var b = e.target.closest("button"); if (!b) return; var c = b.getAttribute("data-c");
        for (var d = 1; d <= 7; d++) if (d !== cur && (c === "all" || (c === "wd" && d <= 5) || (c === "we" && d >= 6))) days[d] = JSON.parse(JSON.stringify(days[cur]));
        toast("Journée copiée");
      });
      v.querySelector("#sv").addEventListener("click", function () {
        var cu = {}; cu[u.id] = days; v.remove(); saveDoc({ program: { custom: cu } }, "Programme enregistré");
      });
      var rs = v.querySelector("#rs");
      if (rs) rs.addEventListener("click", function () { var cu = {}; cu[u.id] = null; v.remove(); saveDoc({ program: { custom: cu } }, "Programme selon mon rythme"); });
      render();
    });
  }

  // Liaison de la session dediee au serveur : le mot de passe ne sert qu'une fois et n'est conserve nulle part.
  function openServer() {
    sheet('<h3>Pilotage automatique</h3>' +
      '<p class="hint" style="margin-top:0">Le serveur ouvre sa propre session MELCloud pour appliquer vos modes et programmes toutes les 5 minutes, téléphone éteint. Saisissez une dernière fois votre mot de passe : il n’est conservé nulle part, seule la session chiffrée l’est.</p>' +
      '<label class="fld"><span>E-mail MELCloud</span><input id="se" type="email" autocomplete="username" value="' + esc(S.email || "") + '"></label>' +
      '<label class="fld"><span>Mot de passe</span><input id="sp" type="password" autocomplete="current-password"></label>' +
      '<button class="cta" id="go">Activer</button><p class="err" id="er"></p>', function (v) {
      var go = v.querySelector("#go"), er = v.querySelector("#er");
      function lockTick() {
        var left = Math.ceil((S.lockUntil - Date.now()) / 1000);
        if (left > 0) { go.disabled = true; go.textContent = "Réessayer dans " + left + " s"; setTimeout(lockTick, 250); }
        else if (go.textContent.indexOf("Réessayer") === 0) { go.disabled = false; go.textContent = "Activer"; }
      }
      lockTick();
      go.addEventListener("click", function () {
        if (Date.now() < S.lockUntil) return;
        var email = v.querySelector("#se").value.trim(), pw = v.querySelector("#sp");
        if (!email || !pw.value) { er.textContent = "Saisissez votre e-mail et votre mot de passe."; return; }
        go.disabled = true; go.textContent = "Connexion…"; er.textContent = "";
        api("login", { email: email, password: pw.value }, FN, true).then(function (d) {
          pw.value = "";
          if (!d.token) throw new Error("Session non obtenue");
          S.fails = 0; put("fails", "0");
          return api("link", { server: d.token }, FN_ENGINE);
        }).then(function () {
          v.remove(); toast("Pilotage automatique activé");
          api("run", {}, FN_ENGINE).catch(function () {}).then(loadEngine);
        }).catch(function (e) {
          pw.value = "";
          if (/incorrect/i.test(e.message || "")) {
            S.fails += 1;
            if (S.fails >= MAX_FAILS) { S.fails = 0; S.lockUntil = Date.now() + LOCK_MS; put("lockUntil", String(S.lockUntil)); er.textContent = "Trop de tentatives. Patientez quelques secondes."; }
            else er.textContent = "E-mail ou mot de passe incorrect.";
            put("fails", String(S.fails));
          } else er.textContent = e.message || "Activation impossible.";
          go.disabled = false; go.textContent = "Activer"; lockTick();
        });
      });
    });
  }
  function unlinkServer() {
    sheet('<h3>Désactiver le pilotage automatique ?</h3><p class="hint" style="margin-top:0">Les modes et programmes ne seront plus appliqués téléphone éteint. Vos réglages sont conservés.</p>' +
      '<button class="cta" id="ok">Désactiver</button><button class="ghost" id="no">Annuler</button>', function (v) {
      v.querySelector("#no").addEventListener("click", function () { v.remove(); });
      v.querySelector("#ok").addEventListener("click", function () {
        v.remove(); api("unlink", {}, FN_ENGINE).then(function () { toast("Pilotage automatique désactivé"); loadEngine(); }).catch(function () { toast("Opération impossible"); });
      });
    });
  }

  // ---------- Installation ----------
  if ("serviceWorker" in navigator && !DEMO) { window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); }); }

  if (DEMO || S.access || S.refresh) renderApp(); else renderLogin();
})();
