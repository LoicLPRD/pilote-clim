(function () {
  "use strict";
  var FN = "https://lwftspnyvoqejetemyhu.supabase.co/functions/v1/melcloud";
  var KEY = "sb_publishable_6yruO30gDX8L3LfXWXWB2Q_54fg6Wme";
  var MAX_FAILS = 3, LOCK_MS = 10000;

  var MODES = [
    ["Cool", "Froid", '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17M12 2 9 5M12 2l3 3M12 22l-3-3M12 22l3-3"/>'],
    ["Heat", "Chaud", '<path d="M12 22c4 0 7-2.6 7-6.6 0-3.4-2.2-5.6-3.6-7.2-.4 1.7-1.5 2.8-2.6 3.2C13.4 8 12.6 4.6 9.8 2c0 3.6-4.8 6.4-4.8 12.4C5 19.4 8 22 12 22Z"/>'],
    ["Automatic", "Auto", '<path d="M5 19 10.5 5h3L19 19M7.4 13.5h9.2"/>'],
    ["Dry", "Déshum.", '<path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z"/>'],
    ["Fan", "Vent", '<path d="M12 12c0-4 1-8 4-8s3 4 0 6l-4 2Zm0 0c4 0 8 1 8 4s-4 3-6 0l-2-4Zm0 0c0 4-1 8-4 8s-3-4 0-6l4-2Zm0 0c-4 0-8-1-8-4s4-3 6 0l2 4Z"/>']
  ];
  var MODE_FR = {}; MODES.forEach(function (m) { MODE_FR[m[0]] = m[1]; });
  var MODE_C = { Cool: "var(--cool)", Heat: "var(--heat)", Automatic: "#6b5fe0", Dry: "var(--dry)", Fan: "#5c6672" };
  var FANS = ["One", "Two", "Three", "Four", "Five"];

  var SCENES = [
    { n: "Confort", c: { power: true, operationMode: "Automatic", setTemperature: 21 }, i: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>' },
    { n: "Nuit", c: { power: true, setTemperature: 19 }, i: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5Z"/>' },
    { n: "Absent", c: { power: true, operationMode: "Heat", setTemperature: 16 }, i: '<path d="M3 21V9l9-6 9 6v12M9 21v-6h6v6"/>' },
    { n: "Hors-gel", c: { power: true, operationMode: "Heat", setTemperature: 10 }, i: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17"/>' },
    { n: "Tout éteindre", c: { power: false }, i: '<path d="M12 3v9M6.5 7a8 8 0 1 0 11 0"/>' }
  ];

  // ---- Stockage local : jeton de session uniquement, jamais le mot de passe ----
  var mem = {};
  function put(k, v) { try { if (v === null) localStorage.removeItem("pc_" + k); else localStorage.setItem("pc_" + k, v); } catch (e) {} mem[k] = v; }
  function get(k) { try { var v = localStorage.getItem("pc_" + k); if (v !== null) return v; } catch (e) {} return mem[k] != null ? mem[k] : null; }

  var S = {
    email: get("email"), access: get("access"), refresh: get("refresh"), expiry: +(get("expiry") || 0),
    tariff: parseFloat(get("tariff") || "0.2016"),
    fails: +(get("fails") || 0), lockUntil: +(get("lockUntil") || 0),
    units: [], view: get("view") || "home", energy: {}, busyUntil: 0
  };

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

  function api(action, extra) {
    var body = Object.assign({ action: action }, extra || {});
    var isLogin = !!(extra && extra.password);
    if (!isLogin) {
      if (S.access && Date.now() < S.expiry - 60000) body.token = S.access;
      else if (S.refresh) body.refresh = S.refresh;
    }
    return fetch(FN, {
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

  // ---- Outils ----
  var app = document.getElementById("app"), toastEl = document.getElementById("toast"), toastT;
  function toast(m) { toastEl.textContent = m; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1800); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function svg(p, sw) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 1.6) + '" stroke-linecap="round" stroke-linejoin="round">' + p + "</svg>"; }
  function fmt(v) { if (v == null) return "—"; return (Math.round(v * 10) / 10).toString().replace(".", ","); }
  function buzz() { try { navigator.vibrate && navigator.vibrate(8); } catch (e) {} }
  function unitById(id) { for (var i = 0; i < S.units.length; i++) if (S.units[i].id === id) return S.units[i]; return null; }
  function hold() { S.busyUntil = Date.now() + 4000; }

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
  function renderApp() {
    app.innerHTML =
      '<div class="gut"><div class="top"><span class="word">Pilote Clim</span>' +
      '<button class="gear" id="gear" aria-label="Réglages">' + svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>') + '</button></div></div>' +
      '<main class="gut" id="main"><div class="loading">Chargement</div></main>' +
      '<nav class="dock"><div class="in gut" id="dock"></div></nav>';
    document.getElementById("gear").addEventListener("click", openSettings);
    document.getElementById("main").addEventListener("click", onMainClick);
    document.getElementById("dock").addEventListener("click", onDockClick);
    draw();
    api("list", {}).then(function (d) { if (d.units) { S.units = d.units; draw(); loadEnergy(); } }).catch(onErr);
    startAuto();
  }
  function onErr(e) { if (e.needLogin) renderLogin("Session expirée. Reconnectez-vous."); else toast("Connexion au serveur interrompue"); }

  function draw() {
    drawDock();
    var main = document.getElementById("main"); if (!main) return;
    if (!S.units.length) { main.innerHTML = '<div class="loading">Chargement</div>'; return; }
    var u = S.view !== "home" ? unitById(S.view) : null;
    if (!u) { S.view = "home"; main.innerHTML = homeHTML(); }
    else main.innerHTML = roomHTML(u);
  }

  function drawDock() {
    var d = document.getElementById("dock"); if (!d) return;
    var html = '<button class="tab" data-v="home" aria-current="' + (S.view === "home") + '"><span class="ic">' + svg('<path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>') + '</span>Maison</button>';
    S.units.forEach(function (u) {
      html += '<button class="tab' + (u.power ? " on" : "") + '" data-v="' + esc(u.id) + '" aria-current="' + (S.view === u.id) + '" style="--tabc:' + (MODE_C[u.mode] || "var(--ok)") + '">' +
        '<span class="ic"><span class="t">' + esc((u.name || "?").trim().charAt(0).toUpperCase()) + '</span></span>' + esc(u.name) + '</button>';
    });
    d.innerHTML = html;
  }

  // ---- Vue maison ----
  function homeHTML() {
    var on = S.units.filter(function (u) { return u.power; }).length;
    var ts = S.units.map(function (u) { return u.room_temperature; }).filter(function (v) { return v != null; });
    var avg = ts.length ? ts.reduce(function (a, b) { return a + b; }, 0) / ts.length : null;
    var rows = S.units.map(function (u) {
      var st = u.in_error ? "Erreur" : u.power ? (MODE_FR[u.mode] || "En marche") + " · consigne " + fmt(u.set_temperature) + "°" : "Arrêt";
      return '<button class="row' + (u.power ? " on" : "") + '" data-open="' + esc(u.id) + '" style="--rowc:' + (MODE_C[u.mode] || "var(--ok)") + '">' +
        '<span class="dot"></span><span><div class="nm">' + esc(u.name) + '</div><div class="sm">' + esc(st) + '</div></span>' +
        '<span class="t">' + fmt(u.room_temperature) + '<small>°</small></span>' + svg('<path d="m9 6 6 6-6 6"/>').replace("<svg", '<svg class="go"') + '</button>';
    }).join("");
    var scenes = SCENES.map(function (s, i) { return '<button class="scene" data-scene="' + i + '">' + svg(s.i) + esc(s.n) + '</button>'; }).join("");
    var kwh = 0, have = false; S.units.forEach(function (u) { if (S.energy[u.id] != null) { kwh += S.energy[u.id]; have = true; } });
    var conso = have
      ? '<span class="eur">' + (kwh * S.tariff).toFixed(2).replace(".", ",") + ' €</span><span class="k">' + fmt(kwh) + ' kWh · 30 jours</span><span class="n">Estimation fournie par Mitsubishi, non mesurée.</span>'
      : '<span class="k">Lecture de la consommation…</span>';
    return '<section class="home-v">' +
      '<div class="hero"><div class="avg">' + (avg != null ? fmt(avg) : "—") + '<sup>°</sup></div>' +
      '<div class="sub">Moyenne intérieure · ' + on + ' sur ' + S.units.length + ' en marche</div></div>' +
      '<div class="lbl">Pièces</div><div class="rows">' + rows + '</div>' +
      '<div class="lbl">Scènes</div><div class="scenes">' + scenes + '</div>' +
      '<div class="lbl">Consommation</div><div class="conso">' + conso + '</div>' +
      '</section>';
  }

  // ---- Vue piece ----
  function roomHTML(u) {
    var acc = MODE_C[u.mode] || "var(--auto)";
    document.documentElement.style.setProperty("--acc", acc);
    var sp = u.set_temperature, whole = sp == null ? "—" : String(Math.floor(sp)), half = sp != null && sp % 1 !== 0;
    var status = u.in_error ? '<b>Erreur unité</b>' : u.connected === false ? '<b>Hors ligne</b>' :
      u.power ? '<b>' + esc(MODE_FR[u.mode] || "En marche") + '</b> · pièce ' + fmt(u.room_temperature) + '°' : 'Arrêt · pièce ' + fmt(u.room_temperature) + '°';
    var modes = MODES.map(function (m) {
      return '<button class="mode" data-mode="' + m[0] + '" data-m="' + m[0] + '" aria-pressed="' + (u.mode === m[0]) + '">' + svg(m[2]) + m[1] + '</button>';
    }).join("");
    var lvl = FANS.indexOf(u.fan_speed);
    var bars = FANS.map(function (f, i) {
      return '<button data-fan="' + f + '" aria-label="Ventilation ' + (i + 1) + '"><span class="bar' + (lvl >= i ? " on" : "") + '" style="height:' + (36 + i * 16) + '%"></span></button>';
    }).join("");
    var kwh = S.energy[u.id];
    return '<section class="room' + (u.power ? "" : " off") + '">' +
      '<h2>' + esc(u.name) + '</h2><p class="status">' + status + '</p>' +
      '<div class="dial">' +
        '<button class="chev" data-step="-1" aria-label="Baisser">' + svg('<path d="m15 6-6 6 6 6"/>', 2) + '</button>' +
        '<div class="setpoint" aria-live="polite"><span class="num">' + whole + '</span><span class="side"><span class="deg">°</span><span class="dec">' + (half ? ",5" : "") + '</span></span></div>' +
        '<button class="chev" data-step="1" aria-label="Monter">' + svg('<path d="m9 6 6 6-6 6"/>', 2) + '</button>' +
      '</div>' +
      '<button class="pwr" data-power aria-pressed="' + !!u.power + '" aria-label="Marche / arrêt">' + svg('<path d="M12 3v9M6.5 7a8 8 0 1 0 11 0"/>', 1.8) + '</button>' +
      '<div class="pwrlbl">' + (u.power ? "En marche" : "Arrêt") + '</div>' +
      '<div class="lbl">Mode</div><div class="modes">' + modes + '</div>' +
      '<div class="lbl">Ventilation</div><div class="fans"><button class="fauto" data-fan="Auto" aria-pressed="' + (u.fan_speed === "Auto") + '">AUTO</button><div class="fanlvl">' + bars + '</div></div>' +
      '<div class="meta"><span>Pièce <b>' + fmt(u.room_temperature) + '°</b></span><span>30 jours <b>' + (kwh != null ? fmt(kwh) + " kWh" : "…") + '</b></span></div>' +
      '</section>';
  }

  // ---- Interactions ----
  function onDockClick(e) {
    var t = e.target.closest(".tab"); if (!t) return;
    S.view = t.getAttribute("data-v"); put("view", S.view); buzz();
    if (S.view === "home") document.documentElement.style.setProperty("--acc", "var(--auto)");
    draw(); window.scrollTo(0, 0);
  }
  function onMainClick(e) {
    var b = e.target.closest("button"); if (!b) return;
    if (b.hasAttribute("data-open")) { S.view = b.getAttribute("data-open"); put("view", S.view); buzz(); draw(); window.scrollTo(0, 0); return; }
    if (b.hasAttribute("data-scene")) { runScene(SCENES[+b.getAttribute("data-scene")]); return; }
    var u = unitById(S.view); if (!u) return;
    buzz(); hold();
    if (b.hasAttribute("data-step")) {
      var base = u.set_temperature == null ? 21 : u.set_temperature;
      var lo = u.mode === "Heat" ? 10 : 16;
      u.set_temperature = Math.min(31, Math.max(lo, base + (+b.getAttribute("data-step")) * 0.5));
      draw(); debounceSet(u); return;
    }
    if (b.hasAttribute("data-power")) { u.power = !u.power; draw(); send(u, { power: u.power }, u.power ? "Allumée" : "Éteinte"); return; }
    if (b.hasAttribute("data-mode")) { var m = b.getAttribute("data-mode"); if (m === u.mode) return; u.mode = m; draw(); send(u, { operationMode: m }, MODE_FR[m]); return; }
    if (b.hasAttribute("data-fan")) { var f = b.getAttribute("data-fan"); if (f === u.fan_speed) return; u.fan_speed = f; draw(); send(u, { setFanSpeed: f }, f === "Auto" ? "Ventilation auto" : "Ventilation " + (FANS.indexOf(f) + 1)); return; }
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
  function runScene(sc) {
    buzz(); hold();
    var st = {}; if ("power" in sc.c) st.power = sc.c.power; if (sc.c.operationMode) st.mode = sc.c.operationMode; if (sc.c.setTemperature != null) st.set_temperature = sc.c.setTemperature;
    var list = S.units.slice(); list.forEach(function (u) { Object.assign(u, st); }); draw();
    toast(sc.n + "…");
    var fails = 0;
    (function next(i) {
      if (i >= list.length) { toast(fails ? sc.n + " · " + fails + " échec(s)" : sc.n + " appliqué"); later(); return; }
      api("control", { unit_id: list[i].id, changes: sc.c }).then(function () { next(i + 1); }).catch(function () { fails++; next(i + 1); });
    })(0);
  }

  var laterT;
  function later() { clearTimeout(laterT); laterT = setTimeout(refresh, 2500); }
  function refresh() {
    api("list", {}).then(function (d) {
      if (!d.units) return;
      var byId = {}; d.units.forEach(function (u) { byId[u.id] = u; });
      if (Date.now() < S.busyUntil) return;
      S.units = d.units; draw();
    }).catch(function (e) { if (e.needLogin) onErr(e); });
  }
  function loadEnergy() {
    S.units.forEach(function (u) {
      api("energy", { unit_id: u.id, days: 30 }).then(function (d) {
        S.energy[u.id] = (d.values || []).reduce(function (a, v) { return a + (Number(v.value) || 0); }, 0) / 1000;
        if (Date.now() >= S.busyUntil) draw();
      }).catch(function () {});
    });
  }

  var autoT;
  function startAuto() { stopAuto(); autoT = setInterval(function () { if (!document.hidden) refresh(); }, 12000); document.addEventListener("visibilitychange", onVis); }
  function stopAuto() { clearInterval(autoT); document.removeEventListener("visibilitychange", onVis); }
  function onVis() { if (!document.hidden) refresh(); }

  // ---- Reglages ----
  function openSettings() {
    var v = document.createElement("div"); v.className = "veil";
    v.innerHTML = '<div class="sheet gut" role="dialog" aria-label="Réglages"><h3>Réglages</h3>' +
      '<label class="fld"><span>Prix du kWh (€)</span><input id="tf" type="number" step="0.0001" inputmode="decimal" value="' + S.tariff + '"></label>' +
      '<p class="hint">Sert à estimer le coût. Tarif réglementé base : environ 0,2016 €.</p>' +
      '<button class="cta" id="sv">Enregistrer</button>' +
      '<button class="ghost" id="lo">Se déconnecter</button></div>';
    v.addEventListener("click", function (e) { if (e.target === v) v.remove(); });
    document.body.appendChild(v);
    v.querySelector("#sv").addEventListener("click", function () { var x = parseFloat(v.querySelector("#tf").value); if (x > 0) { S.tariff = x; put("tariff", String(x)); } v.remove(); draw(); toast("Enregistré"); });
    v.querySelector("#lo").addEventListener("click", function () { v.remove(); logout(); });
  }

  // ---- Service worker (installation) ----
  if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); }); }

  if (S.access || S.refresh) renderApp(); else renderLogin();
})();
