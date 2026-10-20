/* Pilote Clim : logique de programmation partagee entre l'application et le moteur serveur.
   Ce fichier est recopie tel quel dans la fonction serveur « engine » : toute modification
   doit etre reportee des deux cotes (script de construction : engine/build.sh). */
var Prog = (function () {
  "use strict";
  var DEFAULT_RHYTHM = {
    wake_wd: "07:00", sleep_wd: "23:00", wake_we: "08:30", sleep_we: "23:30",
    leave: "08:30", back: "18:30", work: [1, 2, 3, 4, 5], remote: []
  };
  var PRE = 30; // minutes d'anticipation avant une periode de confort
  var STATES = { confort: "Confort", eco: "Éco", off: "Arrêt" };

  function m(hhmm) { var p = String(hhmm || "0:0").split(":"); return ((+p[0] || 0) * 60 + (+p[1] || 0) + 1440) % 1440; }
  function hhmm(min) { min = ((min % 1440) + 1440) % 1440; return ("0" + Math.floor(min / 60)).slice(-2) + ":" + ("0" + (min % 60)).slice(-2); }
  function rhythm(r) { var o = {}, k; for (k in DEFAULT_RHYTHM) o[k] = DEFAULT_RHYTHM[k]; if (r) for (k in r) if (r[k] != null) o[k] = r[k]; return o; }

  // Construit une journee a partir de bornes [minute, etat], en partant de l'etat de minuit.
  function day(start, steps) {
    var list = [{ t: 0, s: start }];
    steps.forEach(function (x) { list.push({ t: ((x[0] % 1440) + 1440) % 1440, s: x[1] }); });
    list.sort(function (a, b) { return a.t - b.t; });
    var out = [];
    list.forEach(function (x) {
      if (out.length && out[out.length - 1].t === x.t) out[out.length - 1] = x;
      else if (!out.length || out[out.length - 1].s !== x.s) out.push(x);
    });
    return out.map(function (x) { return { t: hhmm(x.t), s: x.s }; });
  }

  // Programme hebdomadaire genere a partir du rythme de vie et du type de piece (jours ISO : 1 = lundi).
  function generate(r, type) {
    r = rhythm(r);
    var days = {};
    for (var d = 1; d <= 7; d++) {
      var we = d >= 6, works = r.work.indexOf(d) >= 0 && !we, remote = r.remote.indexOf(d) >= 0;
      var wake = m(we ? r.wake_we : r.wake_wd), sleep = m(we ? r.sleep_we : r.sleep_wd);
      var leave = m(r.leave), back = m(r.back), away = works && !remote;
      if (type === "chambre") {
        days[d] = day("confort", [[wake + 30, "eco"], [sleep - 60, "confort"]]);
      } else if (type === "bureau") {
        days[d] = works && remote ? day("off", [[leave - PRE, "confort"], [back, "off"]]) : day("off", []);
      } else {
        days[d] = away
          ? day("eco", [[wake - PRE, "confort"], [leave, "eco"], [back - PRE, "confort"], [sleep, "eco"]])
          : day("eco", [[wake - PRE, "confort"], [sleep, "eco"]]);
      }
    }
    return days;
  }

  // Etat du programme a un instant donne, et prochaine etape.
  function stateAt(days, dow, min) {
    var list = days[dow] || [], cur = null, i;
    for (i = 0; i < list.length; i++) if (m(list[i].t) <= min) cur = list[i];
    if (!cur) { var prev = days[dow === 1 ? 7 : dow - 1] || []; cur = prev[prev.length - 1] || { t: "00:00", s: "off" }; }
    var next = null;
    for (var k = 0; k < 8 && !next; k++) {
      var dd = ((dow - 1 + k) % 7) + 1, l = days[dd] || [];
      for (i = 0; i < l.length; i++) {
        var lm = m(l[i].t) + k * 1440;
        if (lm > min && l[i].s !== cur.s) { next = { t: l[i].t, s: l[i].s, inDays: k }; break; }
      }
    }
    return { s: cur.s, next: next };
  }

  function season(doc, month) {
    if (doc && (doc.season === "heat" || doc.season === "cool")) return doc.season;
    return month >= 5 && month <= 8 ? "cool" : "heat"; // juin a septembre : rafraichissement
  }

  // Consigne correspondant a un etat symbolique.
  function setting(state, comfort, sea) {
    if (state === "off") return { power: false };
    if (state === "horsgel") return sea === "cool" ? { power: false } : { power: true, mode: "Heat", set: 10 };
    if (sea === "cool") {
      if (state === "confort") return { power: true, mode: "Cool", set: Math.max(24, comfort + 3) };
      return { power: false };
    }
    if (state === "eco3") return { power: true, mode: "Heat", set: Math.max(16, comfort - 3) };
    if (state === "eco") return { power: true, mode: "Heat", set: Math.max(16, comfort - 2) };
    return { power: true, mode: "Heat", set: comfort };
  }
  function key(t) { return t.power ? t.mode + "|" + t.set : "off"; }

  function roomOf(doc, unit) {
    var r = (doc.rooms || {})[unit.id];
    if (r) return r;
    var t = /chambre|parent|enfant|bed/i.test(unit.name || "") ? "chambre" : /bureau|office/i.test(unit.name || "") ? "bureau" : "vie";
    return { type: t, comfort: t === "vie" ? 21 : t === "chambre" ? 19 : 20 };
  }
  function daysOf(doc, unit) {
    var p = doc.program || {}, c = (p.custom || {})[unit.id];
    return c || generate(p.rhythm, roomOf(doc, unit).type);
  }

  // Cible du moteur pour une piece. now = { dow (1-7), min (minutes locales), ms (horodatage) }.
  // Renvoie null quand le moteur ne doit rien imposer.
  function target(doc, unit, now, month) {
    var r = roomOf(doc, unit), sea = season(doc, month), h = doc.house || { k: "maison" };
    var active = h.until == null || now.ms < h.until;
    var st = null, why = "";
    if (h.k === "vacances" && active) { st = "horsgel"; why = "Vacances"; }
    else if (h.k === "absent" && active) { st = "eco3"; why = "Absent"; }
    else if (h.k === "nuit" && active) { st = r.type === "chambre" ? "confort" : "eco"; why = "Nuit"; }
    else if (doc.program && doc.program.enabled) {
      var p = stateAt(daysOf(doc, unit), now.dow, now.min);
      st = p.s; why = "Programme";
    }
    if (!st) return null;
    var t = setting(st, r.comfort, sea);
    t.key = key(t); t.state = st; t.why = why;
    return t;
  }

  return {
    DEFAULT_RHYTHM: DEFAULT_RHYTHM, STATES: STATES, generate: generate, stateAt: stateAt, season: season,
    setting: setting, key: key, target: target, roomOf: roomOf, daysOf: daysOf, m: m, hhmm: hhmm, rhythm: rhythm
  };
})();
if (typeof module !== "undefined") module.exports = Prog;
