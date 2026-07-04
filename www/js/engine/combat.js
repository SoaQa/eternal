(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;

  const HAND_LIMIT = 10;

  const Combat = {
    c: null,

    // ================= запуск боя =================
    start(encounterIds, tier) {
      const S = GAME.State, run = S.run, rng = S.rng;
      const c = {
        tier: tier || 'normal',
        turn: 0,
        result: null, // 'victory' | 'defeat'
        player: {
          isPlayer: true,
          block: 0,
          statuses: {},
          energy: 0,
          energyMax: run.baseEnergy + S.passiveSum('maxEnergy'),
        },
        enemies: [],
        hand: [], draw: [], discard: [], exhaust: [],
        cardsPlayed: 0, attacksThisTurn: 0, cardsThisTurn: 0,
        relicCounters: {},
        tempUid: 0,
        rewards: null,
        fx: [],
      };
      this.c = c;

      // групповые бои: каждый враг слабее, чтобы суммарная угроза не взрывалась;
      // акты 2-3 дополнительно смягчены — рост колоды отстаёт от роста цифр врагов
      const n = encounterIds.length;
      const actTune = { 1: [0.95, 1], 2: [0.82, 0.88], 3: [0.82, 0.85] }[run.act] || [1, 1];
      const dmgScale = (n === 1 ? 1 : (n === 2 ? 0.8 : 0.65)) * actTune[0];
      const hpScale = (n === 1 ? 1 : (n === 2 ? 0.85 : 0.7)) * actTune[1];
      for (const id of encounterIds) {
        const base = GAME.DATA.enemies[id];
        let def = base;
        if (dmgScale !== 1) {
          const moves = {};
          for (const k in base.moves) {
            const m = base.moves[k];
            moves[k] = {
              name: m.name, intent: m.intent,
              effects: m.effects.map(ef => ef.type === 'damage'
                ? Object.assign({}, ef, { value: Math.max(1, Math.round(ef.value * dmgScale)) })
                : ef),
            };
          }
          def = Object.assign({}, base, { moves });
        }
        const hp = Math.max(1, Math.round(rng.int(base.hpMin, base.hpMax) * hpScale));
        c.enemies.push({
          isPlayer: false, id, def,
          hp, maxHp: hp, block: 0, statuses: {},
          history: [], usedOnce: {}, intent: null, dead: false,
        });
      }

      // колода боя — копии карт забега
      c.draw = run.deck.map(x => ({ uid: x.uid, id: x.id, upgraded: x.upgraded }));
      rng.shuffle(c.draw);
      // innate — наверх
      c.draw.sort((a, b) => (this.def(a).innate ? 1 : 0) - (this.def(b).innate ? 1 : 0));

      for (const r of S.relicsWithHook('combatStart')) this.execEffects(r.hooks.combatStart, { source: c.player, raw: true });

      for (const e of c.enemies) this.pickIntent(e);
      this.startPlayerTurn();
      return c;
    },

    def(inst) { return GAME.State.cardDef(inst); },

    alive() { return this.c.enemies.filter(e => !e.dead); },

    fx(o) { this.c.fx.push(o); },
    drainFx() { const f = this.c.fx; this.c.fx = []; return f; },

    // ================= ход игрока =================
    startPlayerTurn() {
      const c = this.c, S = GAME.State;
      c.endPhase = false;
      if (this.checkEnd()) return; // победа/поражение могли случиться в фазе врагов (яд и т.п.)
      c.turn++;
      if (c.turn > 1) c.player.block = 0; // блок от combatStart-реликвий доживает до конца 1-го хода
      c.player.energy = c.player.energyMax;
      c.attacksThisTurn = 0;
      c.cardsThisTurn = 0;

      for (const r of S.relicsWithHook('turnStart')) this.execEffects(r.hooks.turnStart, { source: c.player, raw: true });

      this.tickDots(c.player);
      if (this.checkEnd()) return;

      const n = S.run.handSize + S.passiveSum('drawPerTurn');
      this.drawCards(n);
    },

    drawCards(n) {
      const c = this.c, S = GAME.State;
      for (let i = 0; i < n; i++) {
        if (c.hand.length >= HAND_LIMIT) break;
        if (!c.draw.length) {
          if (!c.discard.length) break;
          c.draw = c.discard; c.discard = [];
          S.rng.shuffle(c.draw);
          for (const r of S.relicsWithHook('onShuffle')) this.execEffects(r.hooks.onShuffle, { source: c.player, raw: true });
          this.fx({ t: 'shuffle' });
        }
        const card = c.draw.pop();
        c.hand.push(card);
        this.fx({ t: 'draw', uid: card.uid });
      }
    },

    canPlay(inst) {
      const c = this.c, d = this.def(inst);
      if (d.unplayable) return false;
      const cost = d.cost === 'X' ? 0 : d.cost;
      return c.player.energy >= cost;
    },

    playCard(uid, targetIdx) {
      const c = this.c, S = GAME.State;
      const hi = c.hand.findIndex(x => x.uid === uid);
      if (hi < 0 || c.result) return false;
      const inst = c.hand[hi];
      const d = this.def(inst);
      if (!this.canPlay(inst)) return false;

      let x = 0;
      if (d.cost === 'X') { x = c.player.energy; c.player.energy = 0; }
      else c.player.energy -= d.cost;

      c.hand.splice(hi, 1);
      c.cardsPlayed++; c.cardsThisTurn++;
      if (d.type === 'attack') c.attacksThisTurn++;
      S.run.stats.cardsPlayed++;

      const target = (targetIdx !== undefined && targetIdx !== null) ? c.enemies[targetIdx] : null;
      this.execEffects(d.effects || [], { source: c.player, target, card: d, x });

      // реликвии на розыгрыш
      for (const r of S.relicsWithHook('onCardPlayed')) {
        const h = r.hooks.onCardPlayed;
        if (h.cardType && h.cardType !== d.type) continue;
        if (h.everyN) {
          c.relicCounters[r.id] = (c.relicCounters[r.id] || 0) + 1;
          if (c.relicCounters[r.id] % h.everyN !== 0) continue;
        }
        this.execEffects(h.effects, { source: c.player, raw: true });
      }

      // куда уходит карта
      if (d.type === 'power') this.fx({ t: 'power', id: inst.id });
      else if (d.exhaust) { c.exhaust.push(inst); this.fx({ t: 'exhaust', uid: inst.uid }); }
      else c.discard.push(inst);

      this.checkEnd();
      return true;
    },

    usePotion(slot, targetIdx) {
      const c = this.c, S = GAME.State;
      const pid = S.run.potions[slot];
      if (!pid || (c && c.result)) return false;
      const p = GAME.DATA.potions[pid];
      const target = (targetIdx !== undefined && targetIdx !== null && c) ? c.enemies[targetIdx] : null;
      if (p.target === 'enemy' && (!target || target.dead)) return false;
      S.removePotion(slot);
      // зелья действуют «как написано»: без модификаторов Силы/Ловкости/Слабости
      this.execEffects(p.effects, { source: c ? c.player : { isPlayer: true, statuses: {}, block: 0 }, target, raw: true });
      this.fx({ t: 'potion', id: pid });
      this.checkEnd();
      return true;
    },

    endTurn() {
      const c = this.c, S = GAME.State;
      if (c.result) return;
      c.endPhase = true; // статусы, наложенные в этой фазе, не должны истечь в этот же ход

      for (const r of S.relicsWithHook('turnEnd')) this.execEffects(r.hooks.turnEnd, { source: c.player, raw: true });
      this.tickEndStatuses(c.player);

      // проклятия в руке
      for (const inst of [...c.hand]) {
        const d = this.def(inst);
        if (d.endTurnInHand) this.execEffects(d.endTurnInHand, { source: c.player, card: d });
      }
      if (this.checkEnd()) return;

      // сброс руки
      const keep = [];
      for (const inst of c.hand) {
        const d = this.def(inst);
        if (d.retain) keep.push(inst);
        else if (d.ethereal) { c.exhaust.push(inst); this.fx({ t: 'exhaust', uid: inst.uid }); }
        else c.discard.push(inst);
      }
      c.hand = keep;

      // ход врагов
      for (const e of this.alive()) {
        e.block = 0;
        this.tickDots(e);
        if (this.checkEnd()) return; // последний враг мог умереть от яда — фиксируем победу до тика игрока
        if (e.dead) continue;
        if (e.intent) {
          const move = e.def.moves[e.intent];
          this.execEffects(move.effects, { source: e, target: c.player, enemyMove: true });
          e.history.push(e.intent);
          if (this.checkEnd()) return;
        }
      }
      for (const e of this.alive()) {
        this.endOwnerTurn(e);
        this.decrementTurnStatuses(e, ['weak', 'vulnerable', 'frail']);
        this.pickIntent(e);
      }
      // дебаффы игрока истекают в конце раунда — после фазы врагов,
      // чтобы Уязвимость N усиливала ровно N вражеских фаз
      this.decrementTurnStatuses(c.player, ['weak', 'vulnerable', 'frail']);
      // ritual/metallicize игрока срабатывают в его конце хода
      this.startPlayerTurn();
    },

    endOwnerTurn(who) {
      const st = who.statuses;
      if (st.ritual) this.applyStatus(who, 'strength', st.ritual, who);
      if (st.metallicize) this.gainBlock(who, st.metallicize, true);
    },

    tickEndStatuses(player) {
      // ritual/metallicize игрока
      this.endOwnerTurn(player);
    },

    tickDots(who) {
      const st = who.statuses;
      if (st.poison) {
        this.loseHp(who, st.poison);
        st.poison--;
        if (st.poison <= 0) delete st.poison;
        this.fx({ t: 'poison', who: this.whoRef(who) });
      }
      if (st.regen) {
        this.healUnit(who, st.regen);
        st.regen--;
        if (st.regen <= 0) delete st.regen;
      }
      this.checkDeaths();
    },

    decrementTurnStatuses(who, keys) {
      for (const k of keys) {
        // статус, наложенный в текущей конечной фазе, пропускает первый декремент
        if (who.freshStatuses && who.freshStatuses[k]) {
          delete who.freshStatuses[k];
          continue;
        }
        if (who.statuses[k]) {
          who.statuses[k]--;
          if (who.statuses[k] <= 0) delete who.statuses[k];
        }
      }
    },

    // ================= ИИ врагов =================
    pickIntent(e) {
      const rng = GAME.State.rng;
      const hpPct = e.hp / e.maxHp * 100;
      if (e.def.ai.first && !e.history.length) { e.intent = e.def.ai.first; return; }
      let rules = e.def.ai.rules.filter(r => {
        if (r.minHpPct !== undefined && hpPct < r.minHpPct) return false;
        if (r.maxHpPct !== undefined && hpPct > r.maxHpPct) return false;
        if (r.onceOnly && e.usedOnce[r.move]) return false;
        if (r.maxRepeat) {
          const h = e.history;
          let streak = 0;
          for (let i = h.length - 1; i >= 0 && h[i] === r.move; i--) streak++;
          if (streak >= r.maxRepeat) return false;
        }
        return true;
      });
      if (!rules.length) rules = e.def.ai.rules;
      const rule = rng.weighted(rules, r => r.weight);
      e.intent = rule.move;
      if (rule.onceOnly) e.usedOnce[rule.move] = true;
    },

    // предпросмотр урона намерения (для UI)
    intentPreview(e) {
      if (!e.intent) return null;
      const move = e.def.moves[e.intent];
      let total = 0, hits = 0;
      for (const ef of move.effects) {
        if (ef.type === 'damage') {
          const times = ef.times === 'X' ? 1 : (ef.times || 1);
          total += this.calcAttack(e, this.c.player, ef.value) * times;
          hits += times;
        }
      }
      return { intent: move.intent, name: move.name, damage: hits ? total : null, hits };
    },

    // ================= исполнение эффектов =================
    execEffects(effects, ctx) {
      for (const ef of effects || []) {
        if (this.c && this.c.result) return;
        if (ctx.source && ctx.source.dead) break; // убитый (шипами) враг не доигрывает ход
        this.execEffect(ef, ctx);
      }
      this.checkDeaths();
    },

    execEffect(ef, ctx) {
      const c = this.c, S = GAME.State, rng = S.rng;
      const src = ctx.source;
      const isPlayerSrc = !!src.isPlayer;
      const times = ef.times === 'X' ? (ctx.x || 0) : (ef.times || 1);

      const resolveTarget = () => {
        if (!isPlayerSrc) return c.player;
        if (ctx.card && ctx.card.target === 'random') {
          const a = this.alive();
          return a.length ? rng.pick(a) : null;
        }
        if (ctx.target && !ctx.target.dead) return ctx.target;
        const a = this.alive();
        return a.length ? a[0] : null;
      };

      switch (ef.type) {
        case 'damage': {
          const locked = isPlayerSrc && ctx.card && ctx.card.target === 'enemy' && ctx.target;
          for (let i = 0; i < times; i++) {
            if (src.dead) break;
            if (locked && ctx.target.dead) break; // мультиудар не перенацеливается после смерти цели
            const t = isPlayerSrc ? resolveTarget() : c.player;
            if (!t) break;
            this.attack(src, t, ef.value, ctx.raw);
          }
          break;
        }
        case 'damageAll': {
          for (let i = 0; i < times; i++) {
            if (src.dead) break;
            for (const e of this.alive()) this.attack(src, e, ef.value, ctx.raw);
          }
          break;
        }
        case 'block': {
          for (let i = 0; i < times; i++) this.gainBlock(src, ef.value, ctx.raw);
          break;
        }
        case 'draw': this.drawCards(ef.value); break;
        case 'energy': c.player.energy += ef.value; this.fx({ t: 'energy', v: ef.value }); break;
        case 'heal': this.healUnit(src, ef.value); break;
        case 'loseHP': this.loseHp(src, ef.value); break;
        case 'gainMaxHP': if (isPlayerSrc) S.gainMaxHp(ef.value); break;
        case 'gold': S.gainGold(ef.value); break;
        case 'applyTarget': {
          const t = resolveTarget();
          if (t) this.applyStatus(t, ef.status, ef.value, src);
          break;
        }
        case 'applyAllEnemies':
          for (const e of this.alive()) this.applyStatus(e, ef.status, ef.value, src);
          break;
        case 'applySelf': this.applyStatus(src, ef.status, ef.value, src); break;
        case 'applyPlayer': this.applyStatus(c.player, ef.status, ef.value, src); break;
        case 'addCard': case 'addCardPlayer': {
          const count = ef.count || 1;
          for (let i = 0; i < count; i++) {
            const inst = { uid: 't' + (++c.tempUid), id: ef.card, upgraded: !!ef.upgraded };
            if (ef.where === 'hand' && c.hand.length < HAND_LIMIT) c.hand.push(inst);
            else if (ef.where === 'draw') c.draw.splice(rng.int(0, c.draw.length), 0, inst);
            else c.discard.push(inst);
          }
          this.fx({ t: 'addCard', id: ef.card, n: count });
          break;
        }
        case 'exhaustRandomHand': {
          for (let i = 0; i < ef.value && c.hand.length; i++) {
            const idx = rng.int(0, c.hand.length - 1);
            const inst = c.hand.splice(idx, 1)[0];
            c.exhaust.push(inst);
            this.fx({ t: 'exhaust', uid: inst.uid });
          }
          break;
        }
        case 'discardRandomHand': {
          for (let i = 0; i < ef.value && c.hand.length; i++) {
            const idx = rng.int(0, c.hand.length - 1);
            c.discard.push(c.hand.splice(idx, 1)[0]);
          }
          break;
        }
        case 'special': this.execSpecial(ef, ctx, resolveTarget); break;
      }
    },

    execSpecial(ef, ctx, resolveTarget) {
      const c = this.c;
      const src = ctx.source;
      switch (ef.id) {
        case 'bodyslam': {
          const t = resolveTarget();
          if (t) this.attack(src, t, src.block);
          break;
        }
        case 'execute': {
          const t = resolveTarget();
          if (!t) break;
          const base = t.hp < t.maxHp / 2 ? ef.value * 2 : ef.value;
          this.attack(src, t, base);
          break;
        }
        case 'drain': {
          const t = resolveTarget();
          if (!t) break;
          const dealt = this.attack(src, t, ef.value);
          if (dealt > 0) this.healUnit(src, dealt);
          break;
        }
        case 'finisher': {
          const t = resolveTarget();
          if (!t) break;
          for (let i = 0; i < c.attacksThisTurn; i++) {
            if (t.dead) break;
            this.attack(src, t, ef.value);
          }
          break;
        }
        case 'second_wind': {
          const keep = [];
          for (const inst of c.hand) {
            const d = this.def(inst);
            if (d.type !== 'attack') {
              c.exhaust.push(inst);
              this.fx({ t: 'exhaust', uid: inst.uid });
              this.gainBlock(src, ef.value);
            } else keep.push(inst);
          }
          c.hand = keep;
          break;
        }
        case 'catalyst': {
          const t = resolveTarget();
          if (t && t.statuses.poison) {
            t.statuses.poison *= 2;
            this.fx({ t: 'status', who: this.whoRef(t), status: 'poison', v: t.statuses.poison });
          }
          break;
        }
      }
    },

    // ================= урон / блок / статусы =================
    calcAttack(attacker, defender, base) {
      let dmg = base + (attacker.statuses.strength || 0);
      if (attacker.statuses.weak) dmg = Math.floor(dmg * 0.75);
      if (defender.statuses.vulnerable) dmg = Math.floor(dmg * 1.5);
      return Math.max(0, dmg);
    },

    // возвращает нанесённый по HP урон (без оверкилла)
    attack(attacker, defender, base, raw) {
      if (!defender || defender.dead) return 0;
      const dmg = raw ? Math.max(0, base) : this.calcAttack(attacker, defender, base);
      const dealt = this.applyHit(defender, dmg, true);
      if (attacker.isPlayer) GAME.State.run.stats.damageDealt += dealt;
      // шипы
      if (defender.statuses.thorns && !attacker.dead) {
        this.applyHit(attacker, defender.statuses.thorns, false);
      }
      this.checkDeaths();
      return dealt;
    },

    applyHit(defender, amount, isAttack) {
      const S = GAME.State;
      const blocked = Math.min(defender.block, amount);
      defender.block -= blocked;
      const rest = amount - blocked;
      const hpBefore = defender.isPlayer ? S.run.hp : defender.hp;
      if (rest > 0) {
        if (defender.isPlayer) {
          S.hurt(rest);
          this.fireOnDamaged();
        } else {
          defender.hp = Math.max(0, defender.hp - rest);
        }
      }
      const actual = Math.min(rest, hpBefore);
      this.fx({ t: 'hit', who: this.whoRef(defender), amount: actual, blocked });
      return actual;
    },

    fireOnDamaged() {
      if (this._dmgGuard || !this.c) return; // защита от рекурсии (реликвия с loseHP в onDamaged)
      this._dmgGuard = true;
      for (const r of GAME.State.relicsWithHook('onDamaged')) {
        this.execEffects(r.hooks.onDamaged, { source: this.c.player, raw: true });
      }
      this._dmgGuard = false;
    },

    loseHp(who, n) {
      if (who.isPlayer) {
        GAME.State.hurt(n);
        if (n > 0) this.fireOnDamaged();
      } else {
        who.hp = Math.max(0, who.hp - n);
      }
      this.fx({ t: 'loseHp', who: this.whoRef(who), amount: n });
    },

    healUnit(who, n) {
      if (who.isPlayer) GAME.State.heal(n);
      else who.hp = Math.min(who.maxHp, who.hp + n);
      this.fx({ t: 'heal', who: this.whoRef(who), amount: n });
    },

    gainBlock(who, base, raw) {
      let v = base;
      if (!raw) {
        v += who.statuses.dexterity || 0;
        if (who.statuses.frail) v = Math.floor(v * 0.75);
      }
      v = Math.max(0, v);
      who.block += v;
      this.fx({ t: 'block', who: this.whoRef(who), amount: v });
    },

    applyStatus(who, status, value, source) {
      const DEBUFFS = ['weak', 'vulnerable', 'frail', 'poison'];
      const isDebuff = DEBUFFS.includes(status) || (status === 'strength' && value < 0);
      if (isDebuff && who.statuses.artifact) {
        who.statuses.artifact--;
        if (who.statuses.artifact <= 0) delete who.statuses.artifact;
        this.fx({ t: 'artifact', who: this.whoRef(who) });
        return;
      }
      who.statuses[status] = (who.statuses[status] || 0) + value;
      if (who.statuses[status] === 0 && status !== 'strength') delete who.statuses[status];
      // дебафф, полученный игроком в конечной фазе (ход врагов, проклятия),
      // должен пережить декремент конца этого раунда
      if (who.isPlayer && this.c && this.c.endPhase && ['weak', 'vulnerable', 'frail'].includes(status)) {
        (who.freshStatuses = who.freshStatuses || {})[status] = true;
      }
      this.fx({ t: 'status', who: this.whoRef(who), status, v: who.statuses[status] || 0 });
    },

    whoRef(who) {
      if (who.isPlayer) return 'player';
      return this.c ? this.c.enemies.indexOf(who) : -1;
    },

    // ================= завершение =================
    checkDeaths() {
      const c = this.c;
      if (!c) return;
      for (const e of c.enemies) {
        if (!e.dead && e.hp <= 0) {
          e.dead = true;
          this.fx({ t: 'die', who: c.enemies.indexOf(e) });
        }
      }
    },

    checkEnd() {
      const c = this.c, S = GAME.State;
      if (!c || c.result) return true;
      this.checkDeaths();
      if (S.run.hp <= 0) {
        c.result = 'defeat';
        return true;
      }
      if (c.enemies.every(e => e.dead)) {
        c.result = 'victory';
        for (const r of S.relicsWithHook('combatEnd')) {
          for (const ef of r.hooks.combatEnd) {
            if (ef.type === 'heal') S.heal(ef.value);
            else if (ef.type === 'gold') S.gainGold(ef.value);
          }
        }
        this.buildRewards();
        S.run.stats.battles++;
        if (c.tier === 'elite') S.run.stats.elites++;
        if (c.tier === 'boss') S.run.stats.bosses++;
        return true;
      }
      return false;
    },

    buildRewards() {
      const c = this.c, S = GAME.State;
      const rewards = {
        gold: S.combatGold(c.tier),
        cards: S.randomCardChoices(c.tier),
        potion: S.rng.chance(0.35) ? S.randomPotion() : null,
        relic: c.tier === 'elite' ? S.randomRelic() : null,
        taken: { gold: false, card: false, potion: false, relic: false },
      };
      c.rewards = rewards;
    },
  };

  GAME.Combat = Combat;
})();
