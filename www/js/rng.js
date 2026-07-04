(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;

  // mulberry32 — детерминированный ГПСЧ с сохраняемым состоянием
  function RNG(seed) {
    this.s = seed >>> 0;
  }
  RNG.prototype.next = function () {
    this.s = (this.s + 0x6D2B79F5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  RNG.prototype.int = function (a, b) { // включительно
    return a + Math.floor(this.next() * (b - a + 1));
  };
  RNG.prototype.pick = function (arr) {
    return arr[Math.floor(this.next() * arr.length)];
  };
  RNG.prototype.shuffle = function (arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  };
  RNG.prototype.chance = function (p) { return this.next() < p; };
  RNG.prototype.weighted = function (items, weightFn) {
    let total = 0;
    for (const it of items) total += weightFn(it);
    let r = this.next() * total;
    for (const it of items) {
      r -= weightFn(it);
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  };

  GAME.RNG = RNG;
})();
