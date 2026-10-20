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
      if (d.axis === "v") { self.tp = clamp(d.p + dy * 0.24, 8, 72); preview("v"); }
      if (d.axis === "h") { self.ty = clamp(d.yw + dx * 0.2, -40, 40); preview("h"); }
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

    // Halo diffus dans la direction du souffle
    if (this.flow > 0.02) {
      var reach = (this.o.mini ? 60 : 150) * (0.7 + fan * 0.12);
      var Z = dir[2] * reach, s = D / (D - Z);
      var hx = g.cx + dir[0] * reach * s, hy = ey + dir[1] * reach * s, hr = g.uw * (this.o.mini ? 0.55 : 0.62);
      var gr = x.createRadialGradient(hx, hy, 0, hx, hy, hr);
      var a0 = (dark ? 0.2 : 0.12) * this.flow;
      gr.addColorStop(0, "rgba(" + col + "," + a0 + ")"); gr.addColorStop(1, "rgba(" + col + ",0)");
      x.fillStyle = gr; x.fillRect(0, 0, g.w, g.h);
    }

    // Particules
    if (reduce) this.rays(g, ey, dir, D, col, dark, fan);
    else this.particles(dt, g, ey, dir, D, col, dark, fan);

    this.unit(g, flapH, col, dark);
  };

  View.prototype.particles = function (dt, g, ey, dir, D, col, dark, fan) {
    var x = this.x, mini = this.o.mini, st = this.st;
    var rate = (mini ? 70 : 240) * (0.45 + fan * 0.22) * this.flow;
    var speed = (mini ? 58 : 118) * (0.62 + fan * 0.16);
    if (st.power) {
      this.acc += rate * dt;
      while (this.acc >= 1) {
        this.acc -= 1;
        var jp = (Math.random() - 0.5) * 0.16, jy = (Math.random() - 0.5) * 0.2;
        var pr = this.pitch * Math.PI / 180 + jp, yr = this.yaw * Math.PI / 180 + jy, sp = speed * (0.75 + Math.random() * 0.5);
        this.parts.push({
          X: (Math.random() - 0.5) * g.sw * 0.92, Y: 0, Z: 0,
          vx: Math.sin(yr) * Math.cos(pr) * sp, vy: Math.sin(pr) * sp, vz: Math.cos(yr) * Math.cos(pr) * sp,
          l: 0, m: (mini ? 1.3 : 1.9) + Math.random() * 0.9, w: 0.6 + Math.random() * 0.8
        });
      }
    }
    var lift = LIFT[st.effect] || 0, drag = Math.max(0, 1 - 0.5 * dt), keep = [];
    x.globalCompositeOperation = dark ? "lighter" : "source-over";
    x.lineCap = "round";
    for (var i = 0; i < this.parts.length; i++) {
      var p = this.parts[i];
      p.l += dt; if (p.l >= p.m) continue;
      p.vx *= drag; p.vy = p.vy * drag + lift * dt; p.vz *= drag;
      p.vx += (Math.random() - 0.5) * 14 * dt; p.vy += (Math.random() - 0.5) * 14 * dt;
      p.X += p.vx * dt; p.Y += p.vy * dt; p.Z += p.vz * dt;
      if (p.Z > D * 0.82) continue;
      keep.push(p);
      var tr = mini ? 0.22 : 0.3, s1 = D / (D - p.Z), Zb = p.Z - p.vz * tr, s0 = D / (D - Zb);
      var x1 = g.cx + p.X * s1, y1 = ey + p.Y * s1;
      var x0 = g.cx + (p.X - p.vx * tr) * s0, y0 = ey + (p.Y - p.vy * tr) * s0;
      var life = p.l / p.m, a = Math.sin(Math.PI * Math.min(1, life * 1.15)) * (dark ? 0.3 : 0.26) * (0.55 + 0.45 * this.flow);
      x.strokeStyle = "rgba(" + col + "," + a.toFixed(3) + ")";
      x.lineWidth = (mini ? 1 : 1.5) * s1 * p.w * (0.7 + fan * 0.07);
      x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke();
    }
    this.parts = keep;
    x.globalCompositeOperation = "source-over";
  };

  // Mouvement reduit : rayons fixes, aucune animation continue.
  View.prototype.rays = function (g, ey, dir, D, col, dark) {
    if (this.flow < 0.05) return;
    var x = this.x, n = 7, len = this.o.mini ? 70 : 170;
    for (var i = 0; i < n; i++) {
      var X0 = (i / (n - 1) - 0.5) * g.sw * 0.8, Z = dir[2] * len, s = D / (D - Z);
      var gx = g.cx + (X0 + dir[0] * len) * s, gy = ey + dir[1] * len * s;
      var lg = x.createLinearGradient(g.cx + X0, ey, gx, gy);
      lg.addColorStop(0, "rgba(" + col + ",0.5)"); lg.addColorStop(1, "rgba(" + col + ",0)");
      x.strokeStyle = lg; x.lineWidth = this.o.mini ? 2 : 4; x.lineCap = "round";
      x.beginPath(); x.moveTo(g.cx + X0, ey); x.lineTo(gx, gy); x.stroke();
    }
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
    x.shadowColor = dark ? "rgba(0,0,0,.55)" : "rgba(30,40,60,.18)";
    x.shadowBlur = this.o.mini ? 10 : 28; x.shadowOffsetY = this.o.mini ? 4 : 12;
    rr(x, X, Y, W, H, H * 0.16, H * 0.34);
    var bg = x.createLinearGradient(0, Y, 0, Y + H);
    bg.addColorStop(0, "#fbfbfc"); bg.addColorStop(0.55, "#e6e8eb"); bg.addColorStop(1, "#c9cdd3");
    x.fillStyle = bg; x.fill();
    x.restore();
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
