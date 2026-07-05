(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;

  // Процедурная фоновая музыка: тёмный эмбиент в ре миноре.
  // Слои: дрон (два расстроенных саза через фильтр) + перезвон по пентатонике + бас/перкуссия в бою.

  const ROOTS = [73.42, 58.27, 87.31, 65.41]; // D2, Bb1, F2, C2 — i–VI–III–VII
  const SCALE = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00, 523.25]; // ре-минорная пентатоника, 3-5 октавы

  const SCENES = {
    title:  { bpm: 58,  density: 0.28, bass: false, hat: false, cutoff: 900,  decay: 1.8, droneGain: 0.050, low: false },
    map:    { bpm: 72,  density: 0.34, bass: false, hat: false, cutoff: 1100, decay: 1.2, droneGain: 0.055, low: false },
    combat: { bpm: 104, density: 0.50, bass: true,  hat: true,  cutoff: 1500, decay: 0.55, droneGain: 0.042, low: false },
    boss:   { bpm: 124, density: 0.62, bass: true,  hat: true,  cutoff: 1900, decay: 0.45, droneGain: 0.048, low: true },
    end:    { bpm: 46,  density: 0.10, bass: false, hat: false, cutoff: 600,  decay: 2.4, droneGain: 0.045, low: true },
  };

  const Music = {
    ctx: null,
    master: null,
    muted: false,
    scene: 'title',
    started: false,
    timer: null,
    nextTime: 0,
    step: 0,
    lastNote: 4,
    drone: null,

    ensureCtx() {
      if (!this.ctx) {
        const AC = G.AudioContext || G.webkitAudioContext;
        if (!AC) return null;
        this.ctx = new AC();
      }
      return this.ctx;
    },

    setMuted(m) {
      this.muted = m;
      if (this.master) {
        this.master.gain.setTargetAtTime(m ? 0 : 0.16, this.ctx.currentTime, 0.1);
      }
      if (!m) this.start();
    },

    setScene(name) {
      if (!SCENES[name]) return;
      this.scene = name;
      if (this.drone && this.ctx) {
        const sc = SCENES[name];
        this.drone.gain.gain.setTargetAtTime(sc.droneGain, this.ctx.currentTime, 1.2);
      }
    },

    start() {
      if (this.muted || this.started) return;
      const ctx = this.ensureCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => { });
        if (ctx.state === 'suspended') return; // ждём жеста пользователя
      }
      this.started = true;

      this.master = ctx.createGain();
      this.master.gain.value = 0;
      this.master.connect(ctx.destination);
      this.master.gain.setTargetAtTime(0.16, ctx.currentTime, 2.0); // плавное появление

      // ---- дрон ----
      const sc = SCENES[this.scene];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 420;
      filter.Q.value = 0.8;
      const dGain = ctx.createGain();
      dGain.gain.value = sc.droneGain;
      filter.connect(dGain); dGain.connect(this.master);

      const o1 = ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = ROOTS[0];
      const o2 = ctx.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = ROOTS[0]; o2.detune.value = 8;
      const o5 = ctx.createOscillator(); o5.type = 'sine'; o5.frequency.value = ROOTS[0] * 1.5; // квинта
      const g5 = ctx.createGain(); g5.gain.value = 0.4;
      o1.connect(filter); o2.connect(filter); o5.connect(g5); g5.connect(filter);

      // медленное дыхание фильтра
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 180;
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency);

      o1.start(); o2.start(); o5.start(); lfo.start();
      this.drone = { o1, o2, o5, gain: dGain, filter };

      // ---- секвенсор ----
      this.nextTime = ctx.currentTime + 0.1;
      this.step = 0;
      this.timer = setInterval(() => this.tick(), 100);
    },

    tick() {
      const ctx = this.ctx;
      if (!ctx || this.muted) return;
      const sc = SCENES[this.scene] || SCENES.map;
      const stepDur = 30 / sc.bpm; // восьмые
      while (this.nextTime < ctx.currentTime + 0.4) {
        this.scheduleStep(this.step, this.nextTime, sc);
        this.nextTime += stepDur;
        this.step++;
      }
    },

    scheduleStep(step, t, sc) {
      const bar = Math.floor(step / 8);
      const inBar = step % 8;

      // смена аккорда дрона раз в такт
      if (inBar === 0 && this.drone) {
        let root = ROOTS[bar % ROOTS.length];
        if (sc.low) root /= 2;
        const tc = 0.6;
        this.drone.o1.frequency.setTargetAtTime(root, t, tc);
        this.drone.o2.frequency.setTargetAtTime(root, t, tc);
        this.drone.o5.frequency.setTargetAtTime(root * 1.5, t, tc);
      }

      // бас-пульс и перкуссия в бою
      if (sc.bass && (inBar === 0 || inBar === 4 || (this.scene === 'boss' && inBar === 6))) {
        this.kick(t);
      }
      if (sc.hat && inBar % 2 === 1) this.hat(t, inBar === 7 ? 0.02 : 0.012);

      // перезвон: случайное блуждание по пентатонике
      if (Math.random() < sc.density) {
        let idx = this.lastNote + (Math.floor(Math.random() * 5) - 2);
        idx = Math.max(0, Math.min(SCALE.length - 1, idx));
        this.lastNote = idx;
        this.pluck(SCALE[idx], t, sc);
        // изредка — квинта сверху, как далёкий хор
        if (Math.random() < 0.12 && idx + 2 < SCALE.length) this.pluck(SCALE[idx + 2], t + 0.02, sc, 0.5);
      }
    },

    pluck(freq, t, sc, mul) {
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      o.type = this.scene === 'title' || this.scene === 'end' ? 'sine' : 'triangle';
      o.frequency.value = freq;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = sc.cutoff;
      const g = ctx.createGain();
      const vol = 0.10 * (mul || 1) * (0.7 + Math.random() * 0.5);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0008, t + sc.decay);
      o.connect(f); f.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + sc.decay + 0.1);
      // лёгкое «стекло» — вторая гармоника у титульного колокола
      if (o.type === 'sine') {
        const h = ctx.createOscillator(); h.type = 'sine'; h.frequency.value = freq * 2.01;
        const hg = ctx.createGain();
        hg.gain.setValueAtTime(0, t);
        hg.gain.linearRampToValueAtTime(vol * 0.3, t + 0.015);
        hg.gain.exponentialRampToValueAtTime(0.0006, t + sc.decay * 0.7);
        h.connect(hg); hg.connect(this.master);
        h.start(t); h.stop(t + sc.decay);
      }
    },

    kick(t) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.11, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 0.25);
    },

    hat(t, vol) {
      const ctx = this.ctx;
      const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 6200 + Math.random() * 1500;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
      o.connect(f); f.connect(g); g.connect(this.master);
      o.start(t); o.stop(t + 0.07);
    },
  };

  // сворачивание приложения — глушим звук
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!Music.ctx) return;
      if (document.hidden) Music.ctx.suspend().catch(() => { });
      else if (!Music.muted) Music.ctx.resume().catch(() => { });
    });
  }

  GAME.Music = Music;
})();
