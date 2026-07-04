(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;

  const SAVE_KEY = 'eternal_save_v1';
  const SETTINGS_KEY = 'eternal_settings_v1';

  const State = {
    run: null,
    rng: null,

    // ---------- жизненный цикл забега ----------
    newRun(seed) {
      if (seed === undefined) seed = Math.floor(Math.random() * 0xFFFFFFFF);
      this.rng = new GAME.RNG(seed);
      const run = {
        version: 1,
        seed,
        hp: 80, maxHp: 80,
        gold: 99,
        baseEnergy: 3,
        handSize: 5,
        uidCounter: 1,
        deck: [],
        relics: [],
        potions: [null, null, null],
        act: 1,
        node: null,          // id текущего узла карты
        map: null,
        pending: null,       // {type:'combat', enemies:[...], tier} — незавершённый бой
        removalsBought: 0,
        eventsSeen: [],
        stats: { battles: 0, elites: 0, bosses: 0, cardsPlayed: 0, damageDealt: 0, floorsClimbed: 0, goldEarned: 0 },
        shop: null,          // сгенерированный магазин текущего узла
        rewards: null,       // награды текущего боя
      };
      this.run = run;
      for (const id of GAME.DATA.startingDeck) this.addCard(id, false);
      this.addRelic(GAME.DATA.startingRelic);
      run.map = GAME.MapGen.generate(run.act, this.rng);
      return run;
    },

    // ---------- сохранение ----------
    save() {
      if (!this.run) return;
      try {
        this.run.rngState = this.rng.s;
        G.localStorage && G.localStorage.setItem(SAVE_KEY, JSON.stringify(this.run));
      } catch (e) { /* нет localStorage — играем без сохранений */ }
    },
    hasSave() {
      try { return !!(G.localStorage && G.localStorage.getItem(SAVE_KEY)); } catch (e) { return false; }
    },
    load() {
      try {
        const raw = G.localStorage && G.localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const run = JSON.parse(raw);
        if (!run || run.version !== 1 || !run.map || !Array.isArray(run.deck)) return false;
        this.run = run;
        this.rng = new GAME.RNG(run.seed);
        this.rng.s = run.rngState >>> 0;
        return true;
      } catch (e) { return false; }
    },
    clearSave() {
      try { G.localStorage && G.localStorage.removeItem(SAVE_KEY); } catch (e) { }
    },

    settings() {
      try { return JSON.parse(G.localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; }
    },
    saveSettings(s) {
      try { G.localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (e) { }
    },

    // ---------- карты ----------
    cardDef(inst) {
      const base = GAME.DATA.cards[inst.id];
      if (!inst.upgraded || !base.upgrade) return base;
      const merged = Object.assign({}, base, base.upgrade);
      merged.name = base.name + '+';
      merged.__upgraded = true;
      return merged;
    },
    addCard(id, upgraded) {
      if (!GAME.DATA.cards[id]) return null;
      const inst = { uid: this.run.uidCounter++, id, upgraded: !!upgraded };
      this.run.deck.push(inst);
      return inst;
    },
    removeCard(uid) {
      const i = this.run.deck.findIndex(c => c.uid === uid);
      if (i >= 0) return this.run.deck.splice(i, 1)[0];
      return null;
    },
    upgradeCard(uid) {
      const c = this.run.deck.find(c => c.uid === uid);
      if (c) c.upgraded = true;
      return c;
    },

    // ---------- реликвии, пассивы ----------
    addRelic(id) {
      if (!GAME.DATA.relics[id] || this.run.relics.includes(id)) return false;
      this.run.relics.push(id);
      const p = GAME.DATA.relics[id].passive;
      if (p) {
        if (p.maxHp) { this.run.maxHp += p.maxHp; this.run.hp = Math.min(this.run.maxHp, this.run.hp + Math.max(0, p.maxHp)); }
        if (p.potionSlots) for (let i = 0; i < p.potionSlots; i++) this.run.potions.push(null);
      }
      return true;
    },
    passiveSum(key) {
      let sum = 0;
      for (const id of this.run.relics) {
        const p = GAME.DATA.relics[id] && GAME.DATA.relics[id].passive;
        if (p && typeof p[key] === 'number') sum += p[key];
      }
      return sum;
    },
    relicsWithHook(hook) {
      const out = [];
      for (const id of this.run.relics) {
        const r = GAME.DATA.relics[id];
        if (r && r.hooks && r.hooks[hook]) out.push(r);
      }
      return out;
    },

    // ---------- HP / золото ----------
    heal(n) {
      this.run.hp = Math.min(this.run.maxHp, this.run.hp + Math.max(0, Math.round(n)));
    },
    hurt(n) {
      this.run.hp = Math.max(0, this.run.hp - Math.max(0, Math.round(n)));
      return this.run.hp <= 0;
    },
    gainMaxHp(n) {
      this.run.maxHp = Math.max(1, this.run.maxHp + Math.round(n));
      if (n > 0) this.run.hp += Math.round(n);
      this.run.hp = Math.min(this.run.hp, this.run.maxHp);
    },
    gainGold(n, fromCombat) {
      let amount = Math.round(n);
      if (fromCombat && amount > 0) amount = Math.round(amount * (1 + this.passiveSum('goldPct') / 100));
      this.run.gold = Math.max(0, this.run.gold + amount);
      if (amount > 0) this.run.stats.goldEarned += amount;
      return amount;
    },

    // ---------- зелья ----------
    addPotion(id) {
      const i = this.run.potions.indexOf(null);
      if (i < 0) return false;
      this.run.potions[i] = id;
      return true;
    },
    removePotion(slot) {
      const id = this.run.potions[slot];
      this.run.potions[slot] = null;
      return id;
    },

    // ---------- генераторы наград ----------
    cardPool(rarity) {
      return Object.values(GAME.DATA.cards).filter(c => c.rarity === rarity);
    },
    rollRewardRarity(tier) {
      const r = this.rng.next();
      if (tier === 'boss') return 'rare';
      if (tier === 'elite') return r < 0.45 ? 'common' : (r < 0.85 ? 'uncommon' : 'rare');
      return r < 0.60 ? 'common' : (r < 0.93 ? 'uncommon' : 'rare');
    },
    randomCardChoices(tier, n) {
      n = n || 3;
      const chosen = [];
      let guard = 0;
      while (chosen.length < n && guard++ < 100) {
        const pool = this.cardPool(this.rollRewardRarity(tier));
        if (!pool.length) continue;
        const c = this.rng.pick(pool);
        if (!chosen.includes(c.id)) chosen.push(c.id);
      }
      return chosen;
    },
    randomRelic(rarity) {
      const unowned = Object.values(GAME.DATA.relics).filter(r => !this.run.relics.includes(r.id));
      let pool;
      if (rarity) {
        pool = unowned.filter(r => r.rarity === rarity);
        if (!pool.length) return null; // обещанную редкость не подменяем
      } else {
        pool = unowned.filter(r => ['common', 'uncommon', 'rare'].includes(r.rarity));
        if (!pool.length) pool = unowned.filter(r => !['boss', 'starter'].includes(r.rarity));
        if (!pool.length) return null;
      }
      return this.rng.pick(pool).id;
    },
    randomPotion() {
      return this.rng.pick(Object.keys(GAME.DATA.potions));
    },
    randomCurse() {
      const pool = Object.values(GAME.DATA.cards).filter(c => c.type === 'curse');
      return pool.length ? this.rng.pick(pool).id : null;
    },
    combatGold(tier) {
      if (tier === 'boss') return this.rng.int(80, 100);
      if (tier === 'elite') return this.rng.int(30, 45);
      return this.rng.int(12, 20);
    },

    // ---------- магазин ----------
    generateShop() {
      const discount = 1 - this.passiveSum('shopDiscountPct') / 100;
      const price = (base) => Math.max(5, Math.round(base * discount));
      const cardBase = { common: [50, 65], uncommon: [75, 95], rare: [130, 160] };
      const relicBase = { common: [140, 160], uncommon: [180, 220], rare: [250, 300], shop: [160, 200], boss: [280, 320], starter: [100, 120] };
      const cards = [];
      let guard = 0;
      while (cards.length < 5 && guard++ < 60) {
        const rarity = this.rollRewardRarity('normal');
        const pool = this.cardPool(rarity);
        if (!pool.length) continue;
        const c = this.rng.pick(pool);
        if (cards.some(x => x.id === c.id)) continue;
        const [lo, hi] = cardBase[rarity] || cardBase.common;
        cards.push({ kind: 'card', id: c.id, price: price(this.rng.int(lo, hi)), sold: false });
      }
      const relics = [];
      const relicPool = Object.values(GAME.DATA.relics)
        .filter(r => !this.run.relics.includes(r.id) && ['common', 'uncommon', 'rare', 'shop'].includes(r.rarity));
      this.rng.shuffle(relicPool);
      for (const r of relicPool.slice(0, 2)) {
        const [lo, hi] = relicBase[r.rarity] || relicBase.common;
        relics.push({ kind: 'relic', id: r.id, price: price(this.rng.int(lo, hi)), sold: false });
      }
      const potions = [];
      for (let i = 0; i < 2; i++) {
        potions.push({ kind: 'potion', id: this.randomPotion(), price: price(this.rng.int(45, 75)), sold: false });
      }
      return {
        cards, relics, potions,
        removePrice: price(75 + this.run.removalsBought * 25),
        removeUsed: false,
      };
    },

    // ---------- переход между актами ----------
    nextAct() {
      this.run.act++;
      this.run.node = null;
      this.run.pending = null;
      this.run.map = GAME.MapGen.generate(this.run.act, this.rng);
    },
  };

  GAME.State = State;
})();
