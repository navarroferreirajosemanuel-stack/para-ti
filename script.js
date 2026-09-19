/* =====================================================================
   Carta digital · Feliz Día del Amor y la Amistad
   JavaScript vanilla, sin dependencias ni backend.

   Extras por URL (opcionales, útiles al compartir el enlace):
     ?para=Ana   → "Hay algo para ti, Ana..."
     ?auto       → la carta se abre sola (cómodo para grabar en video/GIF)
   ===================================================================== */
(() => {
  'use strict';

  /* ---------- Ajustes ---------- */
  // Debe coincidir con la línea de tiempo de style.css (opening → open).
  const OPEN_AFTER_MS = 2250;
  // Cuándo empiezan a caer los pétalos, contado desde que la carta está abierta.
  const PETALS_AT_MS = 1700;
  // Cuándo se habilita el botón "Volver a abrir" (coincide con su fade-in).
  const REPLAY_READY_MS = 4300;
  const PETAL_COUNT = 12;

  /* ---------- Referencias ---------- */
  const $ = (sel) => document.querySelector(sel);
  const stage = $('#stage');
  const envelope = $('#envelope');
  const openBtn = $('#openBtn');
  const replayBtn = $('#replayBtn');
  const soundBtn = $('#soundBtn');
  const letter = $('#letter');
  const hint = $('#hint');
  const bg = $('#bg');
  const fx = $('#fx');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(window.location.search);

  let state = 'closed'; // closed → opening → open → leaving → closed
  let timers = [];

  const rand = (a, b) => a + Math.random() * (b - a);
  const later = (fn, ms) => { timers.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.forEach(window.clearTimeout); timers = []; };

  function setState(next) {
    state = next;
    stage.dataset.state = next;
    stage.classList.toggle('show', next === 'open' || next === 'leaving');
  }

  /* ---------- Personalización por URL ---------- */
  const para = (params.get('para') || '').trim().slice(0, 30);
  if (para) hint.textContent = 'Hay algo para ti, ' + para + '...';

  /* ---------- Fondo: estrellas y corazones flotando ---------- */
  function buildBackground() {
    if (reduceMotion) return;
    const frag = document.createDocumentFragment();

    for (let i = 0; i < 10; i++) {
      const s = document.createElement('i');
      s.className = 'star';
      s.style.cssText =
        '--x:' + rand(4, 96).toFixed(1) + '%;' +
        '--y:' + rand(3, 52).toFixed(1) + '%;' +
        '--s:' + rand(2, 4).toFixed(1) + 'px;' +
        '--dur:' + rand(2.5, 5).toFixed(1) + 's;' +
        '--delay:' + rand(-5, 0).toFixed(1) + 's';
      frag.appendChild(s);
    }
    for (let i = 0; i < 8; i++) {
      const h = document.createElement('i');
      h.className = 'float-heart';
      h.style.cssText =
        '--x:' + rand(4, 92).toFixed(1) + '%;' +
        '--w:' + rand(12, 24).toFixed(0) + 'px;' +
        '--dx:' + rand(-40, 40).toFixed(0) + 'px;' +
        '--dur:' + rand(10, 17).toFixed(1) + 's;' +
        '--delay:' + rand(-17, 0).toFixed(1) + 's';
      frag.appendChild(h);
    }
    bg.appendChild(frag);
  }

  /* ---------- Pétalos cayendo ---------- */
  function startPetals() {
    if (reduceMotion) return;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < PETAL_COUNT; i++) {
      const p = document.createElement('i');
      p.className = 'petal';
      p.style.cssText =
        '--x:' + rand(2, 96).toFixed(1) + '%;' +
        '--w:' + rand(11, 19).toFixed(0) + 'px;' +
        '--drift:' + rand(-70, 70).toFixed(0) + 'px;' +
        '--rot:' + rand(200, 520).toFixed(0) + 'deg;' +
        '--dur:' + rand(7, 12).toFixed(1) + 's;' +
        '--delay:' + (i * 0.55 + rand(0, 0.5)).toFixed(2) + 's;' +
        '--flut:' + rand(1.1, 2.1).toFixed(2) + 's';
      frag.appendChild(p);
    }
    fx.appendChild(frag);
  }

  /* ---------- Sonido opcional (Web Audio, sin archivos) ----------
     Nunca suena solo: se crea al tocar el botón de sonido. */
  const Sound = (() => {
    const NOTE = {
      C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
      C6: 1046.5, E6: 1318.51, G6: 1567.98, C7: 2093.0
    };
    // Melodía sencilla y original (escala pentatónica), estilo cajita de música.
    const TUNE = [
      'E5', 'G5', 'A5', 'G5', 'E5', 'D5', 'C5', null,
      'D5', 'E5', 'G5', 'E5', 'D5', 'C5', 'D5', null,
      'E5', 'G5', 'A5', 'C6', 'A5', 'G5', 'E5', null,
      'G5', 'E5', 'D5', 'E5', 'C5', null, null, null
    ];
    const STEP = 0.42; // segundos por nota

    let ctx = null;
    let master = null;
    let on = false;
    let timer = 0;
    let nextT = 0;
    let idx = 0;

    function ensure() {
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return true;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0;
        master.connect(ctx.destination);
        return true;
      } catch (e) {
        ctx = null;
        return false;
      }
    }

    function note(freq, t, dur, vol) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      g.connect(master);
      [[1, 1], [2, 0.28]].forEach(([mult, amp]) => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = freq * mult;
        og.gain.value = amp;
        o.connect(og);
        og.connect(g);
        o.start(t);
        o.stop(t + dur + 0.05);
      });
    }

    function schedule() {
      while (nextT < ctx.currentTime + 0.35) {
        const n = TUNE[idx % TUNE.length];
        if (n) note(NOTE[n], nextT, 1.8, 0.07);
        nextT += STEP;
        idx++;
      }
    }

    function start() {
      if (!ensure()) return false;
      on = true;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(1, ctx.currentTime, 0.05);
      nextT = ctx.currentTime + 0.1;
      schedule();
      window.clearInterval(timer);
      timer = window.setInterval(schedule, 120);
      return true;
    }

    function stop() {
      on = false;
      window.clearInterval(timer);
      if (ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
      }
    }

    // pequeño "cling" para acompañar cada aparición
    function chime(level) {
      if (!on || !ctx) return;
      const seq = level === 2 ? ['E6', 'G6', 'C7'] : ['C6', 'E6', 'G6'];
      const t = ctx.currentTime + 0.02;
      seq.forEach((n, k) => note(NOTE[n], t + k * 0.09, 1.3, 0.05));
    }

    return {
      get on() { return on; },
      toggle() { return on ? (stop(), false) : start(); },
      chime,
      pause() { if (ctx && ctx.state === 'running') ctx.suspend(); },
      resume() { if (on && ctx && ctx.state === 'suspended') ctx.resume(); }
    };
  })();

  function updateSoundButton() {
    const active = Sound.on;
    soundBtn.setAttribute('aria-pressed', String(active));
    soundBtn.setAttribute('aria-label', active ? 'Silenciar sonido' : 'Activar sonido');
  }

  soundBtn.addEventListener('click', () => {
    Sound.toggle();
    updateSoundButton();
    if (Sound.on) Sound.chime(1);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Sound.pause(); else Sound.resume();
  });

  /* ---------- Abrir la carta ---------- */
  function openLetter() {
    if (state !== 'closed') return;
    setState('opening');

    // vibración suave si el navegador la permite (Android); en iOS se ignora
    try { if (navigator.vibrate) navigator.vibrate(15); } catch (e) { /* opcional */ }

    if (Sound.on) Sound.chime(1);

    later(() => {
      setState('open');
      try { letter.focus({ preventScroll: true }); } catch (e) { /* opcional */ }

      // pequeños "clings" sincronizados con cada aparición (si el sonido está activo)
      later(() => Sound.chime(1), 500);   // ramo
      later(() => Sound.chime(2), 1550);  // personaje
      later(() => Sound.chime(1), 2400);  // título
      later(startPetals, PETALS_AT_MS);
      later(() => replayBtn.classList.add('ready'), REPLAY_READY_MS);
    }, reduceMotion ? 60 : OPEN_AFTER_MS);
  }

  /* ---------- Volver a abrir ---------- */
  function replay() {
    if (state !== 'open') return;
    clearTimers();
    setState('leaving');
    replayBtn.classList.remove('ready');
    later(() => {
      fx.textContent = '';
      setState('closed');
      try { openBtn.focus({ preventScroll: true }); } catch (e) { /* opcional */ }
    }, 480);
  }

  envelope.addEventListener('click', openLetter);
  openBtn.addEventListener('click', openLetter);
  replayBtn.addEventListener('click', replay);

  /* ---------- Inicio ---------- */
  buildBackground();
  if (params.has('auto')) later(openLetter, 900);
})();
