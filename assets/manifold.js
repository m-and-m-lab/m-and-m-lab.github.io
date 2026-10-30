// Hero: an M-shaped manifold in deep space, with a trajectory crossing its surface.
// Plain WebGL with no libraries. Illustration only; it shows no data.
(function () {
  var canvas = document.getElementById("manifold");
  if (!canvas) return;
  var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var gl = canvas.getContext("webgl", { antialias: true, alpha: true, preserveDrawingBuffer: still });
  if (!gl) { canvas.style.display = "none"; return; }
  gl.getExtension("OES_standard_derivatives");

  // Centre line of the M: x, y, radius in the image plane, thickness in depth.
  var KEYS = [
    [-2.02, -0.92, 0.40, 0.40], [-1.72, -0.72, 0.50, 0.50], [-1.28, -0.20, 0.34, 0.40],
    [-0.98,  0.46, 0.17, 0.36], [-0.56,  0.30, 0.09, 0.30], [-0.24, -0.20, 0.06, 0.24],
    [ 0.04, -0.30, 0.05, 0.22], [ 0.30, -0.02, 0.10, 0.26], [ 0.72,  0.74, 0.36, 0.58],
    [ 1.14,  0.04, 0.12, 0.30], [ 1.20, -0.34, 0.07, 0.20], [ 1.62, -0.72, 0.50, 0.50],
    [ 1.98, -0.86, 0.40, 0.40]
  ];
  function catmull(a, b, c, d, t) {
    return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
  }
  function centre(u) {
    var n = KEYS.length - 1, s = Math.min(u, 0.99999) * n, i = Math.floor(s), t = s - i;
    var k = function (j) { return KEYS[Math.max(0, Math.min(n, j))]; };
    var out = [0, 1, 2, 3].map(function (c) { return catmull(k(i - 1)[c], k(i)[c], k(i + 1)[c], k(i + 2)[c], t); });
    // Round the two ends off as bulbs.
    var e = Math.min(u, 1 - u) / 0.07;
    if (e < 1) { var cap = Math.sqrt(Math.max(1 - (1 - e) * (1 - e), 0)); out[2] *= cap; out[3] *= cap; }
    return out;
  }
  function point(u, v) {
    var a = centre(u), b = centre(Math.min(u + 0.002, 1)), dx = b[0] - a[0], dy = b[1] - a[1];
    var l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
    var twist = v + 2.4 * Math.sin(u * Math.PI * 2.0);
    var c = Math.cos(twist), s = Math.sin(twist), rx = Math.max(a[2], 0.01), rz = Math.max(a[3], 0.01);
    return [a[0] + nx * rx * c, a[1] + ny * rx * c, rz * s];
  }

  var NU = 320, NV = 64, pos = [], nor = [], uv = [], idx = [];
  var grid = [];
  for (var i = 0; i <= NU; i++) {
    grid.push([]);
    for (var j = 0; j <= NV; j++) grid[i].push(point(i / NU, j / NV * Math.PI * 2));
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  for (i = 0; i <= NU; i++) for (j = 0; j <= NV; j++) {
    var du = sub(grid[Math.min(i + 1, NU)][j], grid[Math.max(i - 1, 0)][j]);
    var dv = sub(grid[i][(j + 1) % NV], grid[i][(j + NV - 1) % NV]);
    var n = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]];
    var m = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]) || 1;
    pos.push.apply(pos, grid[i][j]);
    nor.push(n[0] / m, n[1] / m, n[2] / m);
    uv.push(i / NU, j / NV);
    if (i < NU && j < NV) {
      var p = i * (NV + 1) + j, q = p + NV + 1;
      idx.push(p, q, p + 1, p + 1, q, q + 1);
    }
  }

  var PROJECT = [
    "uniform float T; uniform vec2 C; uniform float S; uniform float A;",
    "vec3 warp(vec3 p) {",
    "  return p + 0.055 * vec3(sin(1.9 * p.y + T * 0.5), sin(1.6 * p.x + T * 0.42), sin(2.2 * p.x + T * 0.36));",
    "}",
    "mat3 turn() {",
    "  float y = -0.38 + 0.2 * sin(T * 0.13), x = 0.2 + 0.07 * sin(T * 0.09);",
    "  float cy = cos(y), sy = sin(y), cx = cos(x), sx = sin(x);",
    "  return mat3(cy, 0., -sy, 0., 1., 0., sy, 0., cy) * mat3(1., 0., 0., 0., cx, sx, 0., -sx, cx);",
    "}",
    "vec4 cam(vec3 p) {",
    "  float k = 4.6 / (4.6 - p.z);",
    "  return vec4(S * p.x * k / A + C.x, S * p.y * k + C.y, p.z * 0.1, 1.);",
    "}"
  ].join("\n");

  var surfaceV = PROJECT + [
    "attribute vec3 P; attribute vec3 N; attribute vec2 UV;",
    "varying vec3 vN; varying vec2 vUV; varying vec3 vP;",
    "void main() {",
    "  mat3 R = turn(); vec3 p = R * warp(P);",
    "  vN = R * N; vUV = UV; vP = p;",
    "  gl_Position = cam(p);",
    "}"
  ].join("\n");
  var surfaceF = [
    "#extension GL_OES_standard_derivatives : enable",
    "precision highp float;",
    "varying vec3 vN; varying vec2 vUV; varying vec3 vP;",
    "vec3 ramp(float u) {",
    "  vec3 maize = vec3(1.0, 0.76, 0.26), blue = vec3(0.16, 0.42, 0.95), sky = vec3(0.30, 0.62, 1.0), violet = vec3(0.62, 0.46, 1.0);",
    "  if (u < 0.30) return mix(maize, blue, smoothstep(0.10, 0.30, u));",
    "  if (u < 0.70) return mix(blue, sky, smoothstep(0.30, 0.70, u));",
    "  return mix(sky, violet, smoothstep(0.76, 0.96, u));",
    "}",
    "void main() {",
    "  vec3 n = normalize(vN), v = vec3(0., 0., 1.), l = normalize(vec3(-0.45, 0.7, 0.6));",
    "  if (dot(n, v) < 0.) n = -n;",
    "  float f = pow(1. - dot(n, v), 2.2);",
    "  float d = 0.5 + 0.5 * dot(n, l);",
    "  vec3 base = ramp(vUV.x);",
    "  vec3 col = mix(vec3(0.02, 0.07, 0.24), base, 0.16 + 0.84 * d * d);",
    "  col += base * f * 0.75;",
    "  vec2 g = vec2(vUV.x * 54., vUV.y * 28.);",
    "  vec2 e = fwidth(g) * 1.1;",
    "  vec2 a = abs(fract(g - 0.5) - 0.5) / e;",
    "  float line = 1. - min(min(a.x, a.y), 1.);",
    "  float fade = clamp(1.6 - max(e.x, e.y) * 3.5, 0., 1.);",
    "  col += line * fade * vec3(1.0, 0.96, 0.88) * (0.20 + 0.45 * f);",
    "  float ribbon = smoothstep(0.015, 0.0, abs(dot(n, v) - 0.10));",
    "  col += ribbon * vec3(1.0, 0.93, 0.8) * 0.25;",
    "  gl_FragColor = vec4(col, 0.97);",
    "}"
  ].join("\n");
  var dotsV = PROJECT + [
    "attribute vec3 P; attribute vec2 D;",
    "varying float vA;",
    "void main() {",
    "  vec3 p = D.y > 1.5 ? P : turn() * P;",
    "  vA = D.x; gl_PointSize = D.y > 1.5 ? P.z : D.y * 11.;",
    "  if (D.y > 1.5) { gl_Position = vec4(P.xy, -0.99, 1.); vA = D.x * (0.72 + 0.28 * sin(T * 0.8 + P.x * 91.)); }",
    "  else gl_Position = cam(p);",
    "  gl_PointSize *= " + "1.0;",
    "}"
  ].join("\n");
  var dotsF = [
    "precision mediump float;",
    "uniform vec3 K; varying float vA;",
    "void main() {",
    "  float r = length(gl_PointCoord - 0.5) * 2.;",
    "  gl_FragColor = vec4(K, vA * smoothstep(1., 0.55, r));",
    "}"
  ].join("\n");

  function program(vs, fs) {
    var p = gl.createProgram();
    [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]].forEach(function (x) {
      var s = gl.createShader(x[0]);
      gl.shaderSource(s, x[1]); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    });
    gl.linkProgram(p);
    return p;
  }
  function buffer(data, type) {
    var b = gl.createBuffer();
    gl.bindBuffer(type || gl.ARRAY_BUFFER, b);
    gl.bufferData(type || gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  function attr(prog, name, buf, size) {
    var at = gl.getAttribLocation(prog, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(at);
    gl.vertexAttribPointer(at, size, gl.FLOAT, false, 0, 0);
  }

  var surface = program(surfaceV, surfaceF), dots = program(dotsV, dotsF);
  var pBuf = buffer(new Float32Array(pos)), nBuf = buffer(new Float32Array(nor)), uBuf = buffer(new Float32Array(uv));
  var iBuf = buffer(new Uint16Array(idx), gl.ELEMENT_ARRAY_BUFFER);

  // Stars sit in clip space. P.z holds the point size.
  var STARS = 420, sp = [], sd = [];
  function rnd(s) { var x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); }
  for (i = 0; i < STARS; i++) {
    var big = rnd(i + 0.7) > 0.93;
    sp.push(rnd(i + 0.1) * 2 - 1, rnd(i + 0.3) * 2 - 1, big ? 3.4 : 1.8);
    sd.push(0.25 + 0.65 * rnd(i + 0.5), 2);
  }
  var sBuf = buffer(new Float32Array(sp)), dBuf = buffer(new Float32Array(sd));
  var TRAIL = 46, tBuf = gl.createBuffer(), tdBuf = gl.createBuffer();

  // The same warp as the shader, so the path stays on the surface.
  function warp(p, t) {
    return [p[0] + 0.055 * Math.sin(1.9 * p[1] + t * 0.5), p[1] + 0.055 * Math.sin(1.6 * p[0] + t * 0.42), p[2] + 0.055 * Math.sin(2.2 * p[0] + t * 0.36)];
  }

  var W = 1, H = 1, A = 1, scale = 0.5, cx = 0.3, cy = 0;
  function resize() {
    var r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(r.width * d); H = Math.round(r.height * d); A = W / H;
    canvas.width = W; canvas.height = H;
    gl.viewport(0, 0, W, H);
    if (r.width > 960) { scale = Math.min(0.62, 0.27 * A); cx = 0.32; cy = 0.02; }
    else { scale = Math.min(0.42, 0.4 * A); cx = 0; cy = -0.5; }
  }
  function uniforms(prog, t) {
    gl.uniform1f(gl.getUniformLocation(prog, "T"), t);
    gl.uniform2f(gl.getUniformLocation(prog, "C"), cx, cy);
    gl.uniform1f(gl.getUniformLocation(prog, "S"), scale);
    gl.uniform1f(gl.getUniformLocation(prog, "A"), A);
  }
  function drawDots(buf, dataBuf, count, colour, t) {
    gl.useProgram(dots); uniforms(dots, t);
    gl.uniform3fv(gl.getUniformLocation(dots, "K"), colour);
    attr(dots, "P", buf, 3); attr(dots, "D", dataBuf, 2);
    gl.drawArrays(gl.POINTS, 0, count);
  }
  function frame(t) {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    drawDots(sBuf, dBuf, STARS, [0.85, 0.92, 1.0], t);

    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
    gl.useProgram(surface); uniforms(surface, t);
    attr(surface, "P", pBuf, 3); attr(surface, "N", nBuf, 3); attr(surface, "UV", uBuf, 2);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);

    // Trajectory: dashes behind a bright head, moving along the ridge of the surface.
    gl.disable(gl.DEPTH_TEST);
    var head = (t * 0.035) % 1, tp = [], td = [];
    for (var k = 0; k < TRAIL; k++) {
      var u = head - k * 0.0072;
      if (u < 0.02 || k % 2) continue;
      var c = centre(u), w = warp([c[0], c[1], Math.max(c[3], 0.02) * 1.02], t);
      tp.push(w[0], w[1], w[2]);
      td.push(k === 0 ? 1 : 0.9 * (1 - k / TRAIL), k === 0 ? 1.15 : 0.42);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tp), gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, tdBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(td), gl.DYNAMIC_DRAW);
    drawDots(tBuf, tdBuf, tp.length / 3, [1.0, 0.8, 0.02], t);
  }

  resize();
  window.addEventListener("resize", function () { resize(); if (still) frame(11); });
  if (still) { frame(11); return; }
  var visible = true, running = false;
  function loop(ms) {
    if (!visible || document.hidden) { running = false; return; }
    frame(ms / 1000 + 11);
    requestAnimationFrame(loop);
  }
  function wake() { if (!running && visible && !document.hidden) { running = true; requestAnimationFrame(loop); } }
  new IntersectionObserver(function (e) { visible = e[0].isIntersecting; wake(); }).observe(canvas);
  document.addEventListener("visibilitychange", wake);
  wake();
})();
