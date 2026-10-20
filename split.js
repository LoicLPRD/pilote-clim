/* Pilote Clim : unite murale animee.
   Dessin Canvas 2D, flux d'air en particules projetees en perspective, orientation au doigt.
   API : SplitView.create(canvas, {mini, interactive, onVane, onPreview}) -> vue
         vue.set({power, effect: "heat"|"cool"|"dry"|"fan", fan: 0..5 (0 = auto), vv, vh}) */
(function () {
  "use strict";
  var VV_DEG = { One: 10, Two: 24, Three: 38, Four: 54, Five: 70, Auto: 32 };
  var VV_KEYS = ["One", "Two", "Three", "Four", "Five"];
  var VH_DEG = { Left: -38, LeftCentre: -19, Centre: 0, RightCentre: 19, Right: 38, Auto: 0 };
  var VH_KEYS = ["Left", "LeftCentre", "Centre", "RightCentre", "Right"];
  var COL_D = { heat: [255, 122, 60], cool: [74, 142, 255], dry: [56, 214, 188], fan: [214, 222, 232] };
  var COL_L = { heat: [234, 90, 30], cool: [36, 104, 228], dry: [16, 158, 138], fan: [104, 116, 130] };
  var LIFT = { heat: -26, cool: 30, dry: 10, fan: 0 };

  var mq = window.matchMedia ? function (q) { return window.matchMedia(q).matches; } : function () { return false; };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  function isDark() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t === "light") return false; if (t === "dark") return true;
    return !mq("(prefers-color-scheme: light)");
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function nearest(map, keys, deg) {
    var best = keys[0], d = 1e9;
    keys.forEach(function (k) { var x = Math.abs(map[k] - deg); if (x < d) { d = x; best = k; } });
    return best;
  }
  function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms || 8); } catch (e) {} }

  var views = [], raf = 0, last = 0;
  function loop(ts) {
    raf = 0;
    var dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
    views = views.filter(function (v) { return v.c.isConnected || v.keep; });
    var any = false;
    views.forEach(function (v) { if (v.c.isConnected) { v.frame(dt); any = true; } });
    if (any && !document.hidden) raf = requestAnimationFrame(loop); else last = 0;
  }
  function kick() { if (!raf && !document.hidden) raf = requestAnimationFrame(loop); }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) kick(); });

  function View(canvas, o) {
    this.c = canvas; this.x = canvas.getContext("2d"); this.o = o || {};
    this.st = { power: false, effect: "fan", fan: 3, vv: "Auto", vh: "Auto" };
    this.pitch = VV_DEG.Auto; this.yaw = 0; this.tp = this.pitch; this.ty = 0;
    this.open = 0; this.flow = 0; this.parts = []; this.acc = 0; this.t = Math.random() * 10;
    this.drag = null; this.keep = false;
    var self = this;
    this.resize();
    if (window.ResizeObserver) { this.ro = new ResizeObserver(function () { self.resize(); }); this.ro.observe(canvas); }
    else window.addEventListener("resize", function () { self.resize(); });
    if (this.o.interactive) this.bind();
    views.push(this); kick();
  }

  View.prototype.resize = function () {
    var r = this.c.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.w = r.width || this.c.clientWidth || 300; this.h = r.height || this.c.clientHeight || 200; this.dpr = dpr;
    this.c.width = Math.round(this.w * dpr); this.c.height = Math.round(this.h * dpr);
  };

  View.prototype.set = function (s) {
    var was = this.st.power;
    for (var k in s) if (s[k] !== undefined) this.st[k] = s[k];
    if (!this.drag) this.target();
    if (this.st.power && !was) this.acc = 0;
    kick();
  };

  View.prototype.target = function () {
    if (this.st.vv !== "Swing") this.tp = VV_DEG[this.st.vv] != null ? VV_DEG[this.st.vv] : VV_DEG.Auto;
    if (this.st.vh !== "Swing") this.ty = VH_DEG[this.st.vh] != null ? VH_DEG[this.st.vh] : 0;
  };

  // ---- Geste : glisser pour orienter, appui long pour le balayage ----
  View.prototype.bind = function () {
    var self = this, c = this.c;
    c.style.touchAction = "none";
    c.addEventListener("pointerdown", function (e) {
      if (!self.st.power) return;
      c.setPointerCapture && c.setPointerCapture(e.pointerId);
      self.drag = { x: e.clientX, y: e.clientY, p: self.tp, yw: self.ty, axis: null, moved: false, id: e.pointerId };
      self.drag.lt = setTimeout(function () {
        if (!self.drag || self.drag.moved) return;
        var on = self.st.vv === "Swing";
        self.st.vv = on ? nearest(VV_DEG, VV_KEYS, self.pitch) : "Swing";
        self.drag = null; self.target(); buzz(18);
        self.o.onVane && self.o.onVane({ vv: self.st.vv });
      }, 550);
    });
    c.addEventListener("pointermove", function (e) {
      var d = self.drag; if (!d || e.pointerId !== d.id) return;
      var dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.axis && Math.abs(dx) + Math.abs(dy) > 9) { d.axis = Math.abs(dy) >= Math.abs(dx) ? "v" : "h"; d.moved = true; clearTimeout(d.lt); }
      if (d.axis === "v") { self.tp = clamp(d.p + dy * 64 / Math.max(120, self.h * 0.6), 8, 72); preview("v"); }
      if (d.axis === "h") { self.ty = clamp(d.yw + dx * 40 / Math.max(100, self.w * 0.34), -40, 40); preview("h"); }
      kick();
    });
    function preview(ax) {
      var k = ax === "v" ? nearest(VV_DEG, VV_KEYS, self.tp) : nearest(VH_DEG, VH_KEYS, self.ty);
      if (self.drag.last !== k) { if (self.drag.last) buzz(4); self.drag.last = k; }
      self.o.onPreview && self.o.onPreview(ax, k);
    }
    function end(e) {
      var d = self.drag; if (!d || (e && e.pointerId !== d.id)) return;
      clearTimeout(d.lt); self.drag = null;
      if (!d.moved) { self.target(); return; }
      var ch = {};
      if (d.axis === "v") { self.st.vv = nearest(VV_DEG, VV_KEYS, self.tp); ch.vv = self.st.vv; }
      else { self.st.vh = nearest(VH_DEG, VH_KEYS, self.ty); ch.vh = self.st.vh; }
      self.target(); buzz(10);
      self.o.onVane && self.o.onVane(ch);
    }
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
  };

  // ---- Geometrie ----
  View.prototype.geo = function () {
    var w = this.w, h = this.h, mini = this.o.mini;
    var uw = mini ? Math.min(w * 0.84, 150) : Math.min(w * 0.8, 360);
    var uh = uw * 0.27, top = mini ? h * 0.12 : Math.max(12, h * 0.06);
    var cx = w / 2, sy = top + uh * 0.8, sw = uw * 0.84;
    return { w: w, h: h, cx: cx, uw: uw, uh: uh, top: top, sy: sy, sw: sw, sh: uh * 0.12 };
  };

  View.prototype.frame = function (dt) {
    var st = this.st, g = this.geo(), x = this.x, dark = isDark();
    this.t += dt;
    // Balayage
    if (st.vv === "Swing" && !this.drag) this.tp = 40 + 28 * Math.sin(this.t * 2 * Math.PI / 7);
    if (st.vh === "Swing" && !this.drag) this.ty = 34 * Math.sin(this.t * 2 * Math.PI / 9);
    var k = Math.min(1, dt * (this.drag ? 14 : 4));
    this.pitch += (this.tp - this.pitch) * k; this.yaw += (this.ty - this.yaw) * k;
    this.open += ((st.power ? 1 : 0) - this.open) * Math.min(1, dt * 3);
    this.flow += ((st.power ? 1 : 0) - this.flow) * Math.min(1, dt * (st.power ? 1.6 : 3));

    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    x.clearRect(0, 0, g.w, g.h);

    var fan = st.fan || 3, col = (dark ? COL_D : COL_L)[st.effect] || COL_D.fan;
    var flapH = g.uh * 0.36 * Math.sin(this.pitch * Math.PI / 180) * this.open;
    var ey = g.sy + g.sh * this.open + flapH * 0.55;
    var pr = this.pitch * Math.PI / 180, yr = this.yaw * Math.PI / 180;
    var dir = [Math.sin(yr) * Math.cos(pr), Math.sin(pr), Math.cos(yr) * Math.cos(pr)];
    var D = this.o.mini ? 360 : 720;

    if (this.flow > 0.02) this.flows(g, ey, dir, D, col, dark, fan);
    this.unit(g, flapH, col, dark);
    if (this.o.interactive && this.flow > 0.3 && this.end) this.handle(col, dark);
  };

  // Lignes de flux facon Tesla : traits nets en eventail, impulsions qui avancent avec la ventilation.
  View.prototype.flows = function (g, ey, dir, D, col, dark, fan) {
    var x = this.x, mini = this.o.mini, n = mini ? 5 : 9, fl = this.flow;
    var lift = { heat: -1, cool: 1, dry: 0.4, fan: 0 }[this.st.effect] || 0;
    var pulse = (mini ? 22 : 44) + fan * (mini ? 8 : 18), seg = mini ? 8 : 20, gap = mini ? 14 : 34;
    // Point vise : la hauteur suit le volet vertical, la position laterale suit le volet horizontal.
    var pv = (this.pitch - 8) / 64, ph = this.yaw / 40;
    var bottom = g.h * (mini ? 0.96 : 0.8);
    var hx = g.cx + ph * g.w * (mini ? 0.3 : 0.34), hy = ey + (mini ? 10 : 34) + pv * (bottom - ey - (mini ? 10 : 34));
    this.end = [hx, hy];
    var spread = g.sw * (mini ? 0.16 : 0.12), paths = [];
    for (var i = 0; i < n; i++) {
      var u = i / (n - 1) - 0.5, x0 = g.cx + u * g.sw * 0.9, pts = [];
      var tx = hx + u * spread, ty = hy + lift * (mini ? 3 : 10) * (1 - Math.abs(u));
      var c1x = x0 + (tx - x0) * 0.15, c1y = ey + (ty - ey) * 0.55;
      var ex = tx + (tx - x0) * 0.45 + u * spread, ey2 = ty + (ty - ey) * 0.35 + lift * (mini ? 8 : 26);
      for (var j = 0; j <= 14; j++) {
        var t = j / 14, mt = 1 - t;
        pts.push([mt * mt * x0 + 2 * mt * t * c1x + t * t * tx, mt * mt * ey + 2 * mt * t * c1y + t * t * ty]);
      }
      for (var k = 1; k <= 6; k++) { var r = k / 6; pts.push([tx + (ex - tx) * r, ty + (ey2 - ty) * r]); }
      paths.push(pts);
    }
    var hr = g.uw * (mini ? 0.5 : 0.45), gr = x.createRadialGradient(hx, hy, 0, hx, hy, hr);
    gr.addColorStop(0, "rgba(" + col + "," + ((dark ? 0.18 : 0.1) * fl) + ")"); gr.addColorStop(1, "rgba(" + col + ",0)");
    x.fillStyle = gr; x.beginPath(); x.arc(hx, hy, hr, 0, 7); x.fill();

    x.lineCap = "round"; x.lineJoin = "round";
    x.globalCompositeOperation = dark ? "lighter" : "source-over";
    for (var p = 0; p < paths.length; p++) {
      var pts = paths[p], a = pts[0], z = pts[pts.length - 1], edge = 1 - Math.abs(p / (n - 1) - 0.5) * 0.8;
      var lg = x.createLinearGradient(a[0], a[1], z[0], z[1]);
      lg.addColorStop(0, "rgba(" + col + "," + (0.18 * fl * edge).toFixed(3) + ")");
      lg.addColorStop(0.7, "rgba(" + col + "," + (0.5 * fl * edge).toFixed(3) + ")");
      lg.addColorStop(1, "rgba(" + col + ",0)");
      x.strokeStyle = lg; x.lineWidth = mini ? 1 : 1.5; x.setLineDash([]); line(x, pts);
      if (!reduce) {
        var pg = x.createLinearGradient(a[0], a[1], z[0], z[1]);
        pg.addColorStop(0, "rgba(" + col + "," + (0.5 * fl * edge).toFixed(3) + ")");
        pg.addColorStop(0.72, "rgba(" + (dark ? "255,255,255" : col) + "," + (0.95 * fl * edge).toFixed(3) + ")");
        pg.addColorStop(1, "rgba(" + col + ",0)");
        x.strokeStyle = pg; x.lineWidth = mini ? 1.5 : 2.4;
        x.setLineDash([seg, gap]); x.lineDashOffset = -(this.t * pulse + p * 9); line(x, pts);
      }
    }
    x.setLineDash([]);
    x.globalCompositeOperation = "source-over";
  };
  function line(x, pts) {
    x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
    for (var k = 1; k < pts.length - 1; k++) {
      var mx = (pts[k][0] + pts[k + 1][0]) / 2, my = (pts[k][1] + pts[k + 1][1]) / 2;
      x.quadraticCurveTo(pts[k][0], pts[k][1], mx, my);
    }
    var l = pts[pts.length - 1]; x.lineTo(l[0], l[1]); x.stroke();
  }

  // Poignee a saisir, comme sur l'ecran de climatisation d'une Tesla
  View.prototype.handle = function (col, dark) {
    var x = this.x, e = this.end, r = this.drag ? 17 : 13, a = Math.min(1, (this.flow - 0.3) / 0.5);
    x.beginPath(); x.arc(e[0], e[1], r, 0, 7);
    x.fillStyle = "rgba(" + col + "," + (0.22 * a) + ")"; x.fill();
    x.lineWidth = 2; x.strokeStyle = "rgba(" + col + "," + (0.95 * a) + ")"; x.stroke();
    x.beginPath(); x.arc(e[0], e[1], 3.5, 0, 7); x.fillStyle = dark ? "rgba(255,255,255," + a + ")" : "rgba(" + col + "," + a + ")"; x.fill();
  };

  function rr(x, X, Y, W, H, r1, r2) {
    x.beginPath();
    x.moveTo(X + r1, Y); x.lineTo(X + W - r1, Y); x.quadraticCurveTo(X + W, Y, X + W, Y + r1);
    x.lineTo(X + W, Y + H - r2); x.quadraticCurveTo(X + W, Y + H, X + W - r2, Y + H);
    x.lineTo(X + r2, Y + H); x.quadraticCurveTo(X, Y + H, X, Y + H - r2);
    x.lineTo(X, Y + r1); x.quadraticCurveTo(X, Y, X + r1, Y); x.closePath();
  }

  View.prototype.unit = function (g, flapH, col, dark) {
    var x = this.x, X = g.cx - g.uw / 2, Y = g.top, W = g.uw, H = g.uh;
    // Corps
    x.save();
    x.shadowColor = dark ? "rgba(0,0,0,.55)" : "rgba(23,26,32,.16)";
    x.shadowBlur = this.o.mini ? 10 : 28; x.shadowOffsetY = this.o.mini ? 4 : 12;
    rr(x, X, Y, W, H, H * 0.16, H * 0.34);
    var bg = x.createLinearGradient(0, Y, 0, Y + H);
    bg.addColorStop(0, "#fbfbfc"); bg.addColorStop(0.55, "#e6e8eb"); bg.addColorStop(1, "#c9cdd3");
    x.fillStyle = bg; x.fill();
    x.restore();
    if (!dark) { rr(x, X, Y, W, H, H * 0.16, H * 0.34); x.strokeStyle = "rgba(23,26,32,.09)"; x.lineWidth = 1; x.stroke(); }
    // Reflet superieur et jonction de facade
    x.strokeStyle = "rgba(255,255,255,.9)"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(X + H * 0.2, Y + 1.2); x.lineTo(X + W - H * 0.2, Y + 1.2); x.stroke();
    x.strokeStyle = "rgba(20,30,40,.08)";
    x.beginPath(); x.moveTo(X + W * 0.04, Y + H * 0.6); x.lineTo(X + W * 0.96, Y + H * 0.6); x.stroke();
    // Voyant
    var lx = X + W * 0.9, ly = Y + H * 0.42, lr = Math.max(1.4, H * 0.035);
    if (this.flow > 0.05) {
      var lg = x.createRadialGradient(lx, ly, 0, lx, ly, lr * 5);
      lg.addColorStop(0, "rgba(" + col + "," + (0.55 * this.flow) + ")"); lg.addColorStop(1, "rgba(" + col + ",0)");
      x.fillStyle = lg; x.beginPath(); x.arc(lx, ly, lr * 5, 0, 7); x.fill();
    }
    x.fillStyle = this.flow > 0.05 ? "rgb(" + col + ")" : "#a9aeb5";
    x.beginPath(); x.arc(lx, ly, lr, 0, 7); x.fill();

    // Bouche de soufflage
    var sx = g.cx - g.sw / 2, sh = Math.max(1, g.sh * (0.18 + 0.82 * this.open));
    var sg = x.createLinearGradient(0, g.sy, 0, g.sy + sh);
    sg.addColorStop(0, "#0d0f12"); sg.addColorStop(1, "#2a2e34");
    rr(x, sx, g.sy, g.sw, sh, sh * 0.4, sh * 0.4); x.fillStyle = sg; x.fill();
    // Ailettes horizontales (gauche / droite), inclinees selon l'orientation
    if (this.open > 0.1) {
      var n = this.o.mini ? 7 : 13, sk = Math.tan(this.yaw * Math.PI / 180) * sh * 1.1;
      x.strokeStyle = "rgba(255,255,255," + (0.16 * this.open) + ")"; x.lineWidth = this.o.mini ? 0.8 : 1.2;
      for (var i = 1; i < n; i++) {
        var lx2 = sx + (g.sw * i) / n;
        x.beginPath(); x.moveTo(lx2 - sk / 2, g.sy + 1); x.lineTo(lx2 + sk / 2, g.sy + sh - 1); x.stroke();
      }
    }
    // Volet (haut / bas)
    if (flapH > 0.6) {
      var fy = g.sy + sh, fw = g.sw * 1.02, fx = g.cx - fw / 2;
      var fg = x.createLinearGradient(0, fy, 0, fy + flapH);
      fg.addColorStop(0, "#d5d9de"); fg.addColorStop(1, "#f3f4f6");
      rr(x, fx, fy - 0.5, fw, flapH, 1, Math.min(flapH * 0.5, 6)); x.fillStyle = fg; x.fill();
      x.strokeStyle = "rgba(20,30,40,.12)"; x.lineWidth = 0.8; x.stroke();
    }
  };

  // A rappeler quand le canvas est replace dans la page apres un nouveau rendu.
  View.prototype.wake = function () { if (views.indexOf(this) < 0) views.push(this); this.resize(); kick(); };

  View.prototype.destroy = function () { this.keep = false; if (this.ro) this.ro.disconnect(); this.parts = []; };

  window.SplitView = {
    create: function (canvas, o) { return new View(canvas, o); },
    VV_DEG: VV_DEG, VH_DEG: VH_DEG, kick: kick
  };
})();
