(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined) e.innerHTML = html;
    return e;
  };

  const STATUS_INFO = {
    strength: ['💪', 'Сила', 'Увеличивает урон каждого удара.'],
    dexterity: ['🦶', 'Ловкость', 'Увеличивает блок от карт.'],
    weak: ['😩', 'Слабость', 'Атаки наносят на 25% меньше урона.'],
    vulnerable: ['💔', 'Уязвимость', 'Получаемый урон увеличен на 50%.'],
    frail: ['🍂', 'Хрупкость', 'Блок от карт снижен на 25%.'],
    poison: ['☠️', 'Яд', 'В начале хода теряет HP, затем яд слабеет на 1.'],
    regen: ['💚', 'Регенерация', 'В начале хода лечит HP, затем слабеет на 1.'],
    thorns: ['🌵', 'Шипы', 'Атакующий в ближнем бою получает урон.'],
    artifact: ['🔮', 'Артефакт', 'Блокирует следующий дебафф.'],
    ritual: ['🩸', 'Ритуал', 'В конце хода даёт Силу.'],
    metallicize: ['⚙️', 'Металлизация', 'В конце хода даёт блок.'],
  };
  const INTENT_ICON = { attack: '⚔️', defend: '🛡️', buff: '💪', debuff: '🌀', attack_debuff: '⚔️🌀', unknown: '❓' };
  const NODE_ICON = { monster: '⚔️', elite: '👹', event: '❓', rest: '🔥', shop: '🛒', treasure: '🎁', boss: '👑' };
  const TYPE_RU = { attack: 'атака', skill: 'умение', power: 'мощь', status: 'статус', curse: 'проклятие' };

  // ---------- звук ----------
  let audioCtx = null;
  const Sfx = {
    muted: false,
    play(kind) {
      if (this.muted) return;
      try {
        audioCtx = audioCtx || new (G.AudioContext || G.webkitAudioContext)();
        const t = audioCtx.currentTime;
        const seqs = {
          click: [[700, .05, 'square', .04]],
          hit: [[140, .12, 'sawtooth', .1], [90, .1, 'sawtooth', .08]],
          block: [[320, .08, 'triangle', .08]],
          heal: [[520, .09, 'sine', .07], [720, .12, 'sine', .06]],
          gold: [[880, .06, 'square', .05], [1180, .09, 'square', .05]],
          win: [[523, .12, 'triangle', .09], [659, .12, 'triangle', .09], [784, .22, 'triangle', .1]],
          lose: [[300, .2, 'sawtooth', .09], [220, .25, 'sawtooth', .09], [150, .4, 'sawtooth', .1]],
        };
        (seqs[kind] || []).forEach(([f, d, w, v], i) => {
          const o = audioCtx.createOscillator(), g = audioCtx.createGain();
          o.type = w; o.frequency.value = f;
          g.gain.setValueAtTime(v, t + i * .09);
          g.gain.exponentialRampToValueAtTime(.001, t + i * .09 + d);
          o.connect(g); g.connect(audioCtx.destination);
          o.start(t + i * .09); o.stop(t + i * .09 + d + .02);
        });
      } catch (e) { /* без звука */ }
    },
  };

  const UI = {
    sel: null,          // uid выбранной карты
    rewardShown: false,

    // =============== запуск ===============
    boot() {
      const missing = ['cards', 'enemies', 'relics', 'events'].filter(k => !GAME.DATA[k]);
      if (missing.length) {
        document.body.innerHTML = '<div style="padding:40px;color:#f88">Ошибка данных: ' + missing.join(', ') + '</div>';
        return;
      }
      Sfx.muted = !!GAME.State.settings().muted;
      $('#tb-deck').addEventListener('click', () => { Sfx.play('click'); this.showDeckOverlay({ title: 'Ваша колода' }); });
      $('#tb-menu').addEventListener('click', () => { Sfx.play('click'); this.showMenu(); });
      this.showTitle();
    },

    showScreen(name) {
      document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
      $('#screen-' + name).classList.remove('hidden');
      $('#topbar').classList.toggle('hidden', name === 'title');
      this.closeOverlay();
      this.renderTopbar();
    },

    renderTopbar() {
      const run = GAME.State.run;
      if (!run) return;
      $('#tb-hp-val').textContent = run.hp + '/' + run.maxHp;
      $('#tb-gold-val').textContent = run.gold;
      $('#tb-floor-val').textContent = 'Акт ' + run.act;
      $('#tb-deck-val').textContent = run.deck.length;
    },

    // =============== титул ===============
    showTitle() {
      const s = $('#screen-title');
      s.innerHTML = '';
      s.append(el('div', 'logo-emoji', '🗼'), el('h1', null, 'ETERNAL'), el('h2', null, 'ВЕЧНАЯ БАШНЯ'));
      if (GAME.State.hasSave()) {
        const cont = el('button', 'btn primary', 'Продолжить восхождение');
        cont.onclick = () => {
          Sfx.play('click');
          if (GAME.State.load()) this.resumeRun();
          else this.newRun();
        };
        s.append(cont);
      }
      const nb = el('button', 'btn', 'Новое восхождение');
      nb.onclick = () => {
        Sfx.play('click');
        if (GAME.State.hasSave()) this.confirm('Начать заново? Текущее сохранение будет потеряно.', () => this.newRun());
        else this.newRun();
      };
      const help = el('button', 'btn', 'Как играть');
      help.onclick = () => { Sfx.play('click'); this.showHelp(); };
      s.append(nb, help, el('div', 'foot', 'тёмное фэнтези • колода • рогалик'));
      this.showScreen('title');
    },

    newRun() {
      GAME.State.clearSave();
      GAME.State.newRun();
      GAME.State.save();
      this.showMap();
    },

    resumeRun() {
      const run = GAME.State.run;
      if (run.pending && run.pending.type === 'combat') {
        GAME.Combat.start(run.pending.enemies, run.pending.tier);
        this.showCombat();
      } else {
        this.showMap();
      }
    },

    // =============== карта ===============
    showMap() {
      const S = GAME.State, run = S.run, map = run.map;
      const s = $('#screen-map');
      s.innerHTML = '';
      const ROW_H = 96, PAD = 60;
      const H = GAME.MapGen.ROWS * ROW_H + PAD * 2;
      const wrap = el('div');
      wrap.id = 'map-wrap';
      wrap.style.height = H + 'px';
      const W = s.clientWidth || document.body.clientWidth || 360;

      const y = (row) => H - PAD - row * ROW_H;
      const x = (node) => Math.round(node.x * (W - 70)) + 35;

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'map-svg';
      svg.setAttribute('width', W); svg.setAttribute('height', H);

      const reachable = this.reachableNodes();
      for (const id in map.nodes) {
        const n = map.nodes[id];
        for (const to of n.edges) {
          const m = map.nodes[to];
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', x(n)); line.setAttribute('y1', y(n.row));
          line.setAttribute('x2', x(m)); line.setAttribute('y2', y(m.row));
          if (n.id === run.node && reachable.includes(m.id)) line.classList.add('lit');
          svg.appendChild(line);
        }
      }
      wrap.appendChild(svg);

      for (const id in map.nodes) {
        const n = map.nodes[id];
        const d = el('div', 'map-node ' + (n.type === 'boss' ? 'boss' : ''), NODE_ICON[n.type]);
        d.style.left = x(n) + 'px';
        d.style.top = y(n.row) + 'px';
        if (n.visited) d.classList.add('visited');
        if (n.id === run.node) d.classList.add('current');
        if (reachable.includes(n.id)) {
          d.classList.add('reachable');
          d.onclick = () => { Sfx.play('click'); this.travel(n.id); };
        }
        wrap.appendChild(d);
      }

      const title = el('div', null, '');
      title.id = 'map-title';
      title.textContent = 'АКТ ' + run.act + ' — ' + ['', 'Подножие башни', 'Проклятые залы', 'Обитель дракона'][run.act];
      s.append(title, wrap);
      this.showScreen('map');
      // прокрутка к текущей позиции
      const curRow = run.node ? map.nodes[run.node].row : 0;
      s.scrollTop = Math.max(0, y(curRow) - s.clientHeight * 0.6);
    },

    reachableNodes() {
      const run = GAME.State.run, map = run.map;
      if (!run.node) return map.rows[0].slice();
      const cur = map.nodes[run.node];
      if (cur.row >= GAME.MapGen.ROWS - 1) return [];
      return cur.edges.slice();
    },

    travel(nodeId) {
      const S = GAME.State, run = S.run;
      const node = run.map.nodes[nodeId];
      node.visited = true;
      run.node = nodeId;
      run.stats.floorsClimbed++;
      switch (node.type) {
        case 'monster': return this.enterCombat('normal');
        case 'elite': return this.enterCombat('elite');
        case 'boss': return this.enterCombat('boss');
        case 'event': return this.showEvent();
        case 'rest': return this.showRest();
        case 'shop': run.shop = S.generateShop(); S.save(); return this.showShop();
        case 'treasure': return this.showTreasure();
      }
    },

    // =============== бой ===============
    enterCombat(tier) {
      const S = GAME.State, run = S.run;
      const pool = GAME.DATA.encounters[run.act][tier === 'normal' ? 'normal' : tier];
      const enc = S.rng.pick(pool);
      run.pending = { type: 'combat', enemies: enc, tier };
      S.save();
      GAME.Combat.start(enc, tier);
      this.rewardShown = false;
      this.showCombat();
    },

    showCombat() {
      const s = $('#screen-combat');
      s.innerHTML = [
        '<div id="relic-strip"></div>',
        '<div id="enemies"></div>',
        '<div id="player-zone">',
        '  <div class="statuses" id="player-statuses"></div>',
        '  <div id="player-row">',
        '    <div id="player-hp-wrap"><div class="hpbar"><div class="fill" id="p-fill"></div><div class="txt" id="p-txt"></div></div></div>',
        '    <div class="blk" id="p-block"></div>',
        '  </div>',
        '</div>',
        '<div id="potions-row"></div>',
        '<div id="piles"><span id="pile-draw"></span><span id="pile-exhaust"></span><span id="pile-discard"></span></div>',
        '<div id="combat-bottom">',
        '  <div id="energy-orb"></div>',
        '  <div id="hand"></div>',
        '  <button id="end-turn">Конец<br>хода</button>',
        '</div>',
      ].join('');
      $('#end-turn').onclick = () => {
        Sfx.play('click');
        this.sel = null;
        GAME.Combat.endTurn();
        this.afterAction();
      };
      $('#pile-draw').onclick = () => this.showPile('Колода добора', GAME.Combat.c.draw, true);
      $('#pile-discard').onclick = () => this.showPile('Сброс', GAME.Combat.c.discard);
      $('#pile-exhaust').onclick = () => this.showPile('Истощено', GAME.Combat.c.exhaust);
      this.showScreen('combat');
      this.renderCombat();
      GAME.Combat.drainFx(); // стартовые эффекты без флоатеров
    },

    renderCombat() {
      const C = GAME.Combat, c = C.c, S = GAME.State, run = S.run;
      if (!c) return;
      this.renderTopbar();

      // реликвии
      const rs = $('#relic-strip');
      rs.innerHTML = '';
      for (const id of run.relics) {
        const r = GAME.DATA.relics[id];
        const d = el('span', 'relic', r.emoji);
        d.onclick = () => this.toast(r.emoji + ' ' + r.name, r.desc);
        rs.appendChild(d);
      }

      // враги
      const en = $('#enemies');
      en.innerHTML = '';
      c.enemies.forEach((e, i) => {
        const d = el('div', 'enemy' + (e.dead ? ' dead' : '') + (e.def.tier === 'boss' ? ' boss-e' : ''));
        d.id = 'enemy-' + i;
        const pv = e.dead ? null : C.intentPreview(e);
        let intentTxt = '';
        if (pv) {
          intentTxt = INTENT_ICON[pv.intent] || '❓';
          if (pv.damage !== null) intentTxt += ' ' + (pv.hits > 1 ? Math.round(pv.damage / pv.hits) + '×' + pv.hits : pv.damage);
        }
        d.append(
          el('div', 'intent', intentTxt),
          el('div', 'sprite', e.def.emoji),
          el('div', 'e-name', e.def.name + (e.block ? ' <span class="blk">🛡' + e.block + '</span>' : '')),
        );
        const bar = el('div', 'hpbar');
        bar.append(el('div', 'fill'), el('div', 'txt', e.hp + '/' + e.maxHp));
        bar.querySelector('.fill').style.width = Math.max(0, e.hp / e.maxHp * 100) + '%';
        d.appendChild(bar);
        d.appendChild(this.statusesRow(e.statuses));
        if (this.sel !== null) {
          const selInst = c.hand.find(x => x.uid === this.sel);
          if (selInst && ['enemy'].includes(C.def(selInst).target) && !e.dead) {
            d.classList.add('targetable');
            d.onclick = () => {
              Sfx.play('hit');
              const uid = this.sel; this.sel = null;
              C.playCard(uid, i);
              this.afterAction();
            };
          }
        }
        en.appendChild(d);
      });

      // игрок
      $('#p-fill').style.width = Math.max(0, run.hp / run.maxHp * 100) + '%';
      $('#p-txt').textContent = run.hp + '/' + run.maxHp;
      $('#p-block').innerHTML = c.player.block ? '🛡' + c.player.block : '';
      const ps = $('#player-statuses');
      ps.innerHTML = '';
      ps.replaceWith(this.statusesRow(c.player.statuses, 'player-statuses'));

      // зелья
      const pr = $('#potions-row');
      pr.innerHTML = '';
      run.potions.forEach((pid, i) => {
        const d = el('div', 'potion-slot' + (pid ? ' full' : ''), pid ? GAME.DATA.potions[pid].emoji : '');
        if (pid) d.onclick = () => this.potionMenu(i);
        pr.appendChild(d);
      });

      // стопки, энергия
      $('#pile-draw').textContent = '📥 ' + c.draw.length;
      $('#pile-discard').textContent = '📤 ' + c.discard.length;
      $('#pile-exhaust').textContent = '♨️ ' + c.exhaust.length;
      $('#energy-orb').textContent = c.player.energy + '/' + c.player.energyMax;

      // рука
      const hand = $('#hand');
      hand.innerHTML = '';
      hand.classList.toggle('many', c.hand.length > 5);
      for (const inst of c.hand) {
        const d = this.cardEl(C.def(inst), inst);
        if (!C.canPlay(inst)) d.classList.add('unaffordable');
        if (this.sel === inst.uid) d.classList.add('selected');
        d.onclick = () => this.tapCard(inst);
        this.addLongPress(d, () => this.zoomCard(C.def(inst)));
        hand.appendChild(d);
      }

      // исход боя
      if (c.result === 'victory' && !this.rewardShown) {
        this.rewardShown = true;
        Sfx.play('win');
        setTimeout(() => this.showRewards(), 500);
      } else if (c.result === 'defeat') {
        Sfx.play('lose');
        setTimeout(() => this.showGameOver(), 600);
      }
    },

    statusesRow(statuses, id) {
      const d = el('div', 'statuses');
      if (id) d.id = id;
      for (const k in statuses) {
        const info = STATUS_INFO[k];
        if (!info || !statuses[k]) continue;
        const chip = el('span', 'status-chip', info[0] + statuses[k]);
        chip.onclick = (ev) => { ev.stopPropagation(); this.toast(info[0] + ' ' + info[1], info[2]); };
        d.appendChild(chip);
      }
      return d;
    },

    tapCard(inst) {
      const C = GAME.Combat, c = C.c;
      if (c.result) return;
      const d = C.def(inst);
      if (!C.canPlay(inst)) { this.toast('⚡ Не хватает энергии', d.unplayable ? 'Эту карту нельзя разыграть.' : 'Нужно энергии: ' + d.cost + '.'); return; }
      if (d.target === 'enemy') {
        this.sel = (this.sel === inst.uid) ? null : inst.uid;
        Sfx.play('click');
        this.renderCombat();
      } else {
        Sfx.play('click');
        this.sel = null;
        C.playCard(inst.uid, null);
        this.afterAction();
      }
    },

    afterAction() {
      this.renderCombat();
      this.processFx();
      GAME.State.renderTopbarHook && GAME.State.renderTopbarHook();
      this.renderTopbar();
    },

    potionMenu(slot) {
      const S = GAME.State;
      const pid = S.run.potions[slot];
      const p = GAME.DATA.potions[pid];
      const inCombat = GAME.Combat.c && !GAME.Combat.c.result && !$('#screen-combat').classList.contains('hidden');
      const o = this.openOverlay();
      o.append(el('h3', null, p.emoji + ' ' + p.name), el('div', 'ov-sub', p.desc));
      const act = el('div', 'ov-actions');
      const canDrink = inCombat || !p.combatOnly;
      const drink = el('button', 'btn primary' + (canDrink ? '' : ' disabled'), 'Выпить');
      drink.onclick = () => {
        this.closeOverlay();
        if (p.target === 'enemy' && inCombat) {
          // выбор цели: подсветим врагов
          this.pickEnemyTarget((idx) => {
            GAME.Combat.usePotion(slot, idx);
            Sfx.play('heal');
            this.afterAction();
          });
        } else if (inCombat) {
          GAME.Combat.usePotion(slot, null);
          Sfx.play('heal');
          this.afterAction();
        } else {
          // вне боя — только heal/maxhp эффекты
          S.removePotion(slot);
          for (const ef of p.effects) {
            if (ef.type === 'heal') S.heal(ef.value);
            if (ef.type === 'gainMaxHP') S.gainMaxHp(ef.value);
          }
          Sfx.play('heal');
          S.save();
          this.renderTopbar();
          if (!$('#screen-map').classList.contains('hidden')) this.showMap();
        }
      };
      const drop = el('button', 'btn danger', 'Выбросить');
      drop.onclick = () => { S.removePotion(slot); S.save(); this.closeOverlay(); inCombat ? this.renderCombat() : this.showMap(); };
      const cancel = el('button', 'btn', 'Отмена');
      cancel.onclick = () => { this.closeOverlay(); };
      act.append(drink, drop, cancel);
      o.append(act);
    },

    pickEnemyTarget(cb) {
      const alive = GAME.Combat.alive();
      if (alive.length === 1) { cb(GAME.Combat.c.enemies.indexOf(alive[0])); return; }
      this.toast('🎯 Цель', 'Коснитесь врага, чтобы применить.');
      GAME.Combat.c.enemies.forEach((e, i) => {
        if (e.dead) return;
        const d = $('#enemy-' + i);
        if (!d) return;
        d.classList.add('targetable');
        d.onclick = () => cb(i);
      });
    },

    // флоатеры из очереди боевых эффектов
    processFx() {
      const fx = GAME.Combat.drainFx();
      let delay = 0;
      for (const f of fx) {
        const target = f.who === 'player' ? $('#player-zone') : $('#enemy-' + f.who);
        if (f.t === 'hit') {
          setTimeout(() => {
            if (f.amount > 0) {
              this.floater(target, '-' + f.amount, 'dmg');
              if (f.who === 'player' && navigator.vibrate) navigator.vibrate(40);
              Sfx.play('hit');
              target && target.classList.add('shake');
              setTimeout(() => target && target.classList.remove('shake'), 350);
            } else if (f.blocked > 0) {
              this.floater(target, '🛡', 'blocked');
              Sfx.play('block');
            }
          }, delay);
          delay += 130;
        } else if (f.t === 'loseHp' && f.amount > 0) {
          setTimeout(() => this.floater(target, '-' + f.amount, 'dmg'), delay);
          delay += 100;
        } else if (f.t === 'heal' && f.amount > 0) {
          setTimeout(() => { this.floater(target, '+' + f.amount, 'heal'); }, delay);
          delay += 100;
        } else if (f.t === 'block' && f.amount > 0) {
          setTimeout(() => this.floater(target, '🛡+' + f.amount, 'blocked'), delay);
          delay += 80;
        }
      }
      if (delay > 0) setTimeout(() => this.renderCombat(), delay + 200);
    },

    floater(target, text, cls) {
      if (!target) return;
      const r = target.getBoundingClientRect();
      const f = el('div', 'floater ' + cls, text);
      f.style.left = (r.left + r.width / 2 - 20 + (Math.random() * 30 - 15)) + 'px';
      f.style.top = (r.top + r.height / 3) + 'px';
      $('#floaters').appendChild(f);
      setTimeout(() => f.remove(), 1100);
    },

    // =============== награды ===============
    showRewards() {
      const C = GAME.Combat, c = C.c, S = GAME.State;
      const rw = c.rewards;
      S.run.pending = null;

      const panel = el('div', 'reward-panel');
      panel.append(el('h2', null, '⚔️ Победа!'));

      const addBtn = (label, taken, fn) => {
        const b = el('button', 'btn' + (taken ? ' disabled' : ''), label);
        b.onclick = () => { fn(b); };
        panel.appendChild(b);
        return b;
      };

      addBtn('💰 Забрать ' + rw.gold + ' золота', rw.taken.gold, (b) => {
        rw.taken.gold = true;
        S.gainGold(rw.gold, true);
        Sfx.play('gold');
        b.classList.add('disabled');
        this.renderTopbar();
      });

      if (rw.relic) {
        const r = GAME.DATA.relics[rw.relic];
        addBtn(r.emoji + ' Реликвия: ' + r.name, rw.taken.relic, (b) => {
          rw.taken.relic = true;
          S.addRelic(rw.relic);
          Sfx.play('gold');
          b.classList.add('disabled');
          this.toast(r.emoji + ' ' + r.name, r.desc);
        });
      }

      if (rw.potion) {
        const p = GAME.DATA.potions[rw.potion];
        addBtn(p.emoji + ' Зелье: ' + p.name, rw.taken.potion, (b) => {
          if (S.addPotion(rw.potion)) {
            rw.taken.potion = true;
            Sfx.play('gold');
            b.classList.add('disabled');
          } else this.toast('🧪 Нет места', 'Все слоты зелий заняты.');
        });
      }

      addBtn('🃏 Выбрать карту', rw.taken.card, (b) => {
        this.cardChoiceOverlay(rw.cards, (id) => {
          if (id) { S.addCard(id); Sfx.play('gold'); }
          rw.taken.card = true;
          b.classList.add('disabled');
          this.renderTopbar();
        });
      });

      const cont = el('button', 'btn primary', 'Продолжить путь');
      cont.style.marginTop = '18px';
      cont.onclick = () => {
        panel.remove();
        this.finishCombat();
      };
      panel.appendChild(cont);
      $('#screen-combat').appendChild(panel);
    },

    finishCombat() {
      const S = GAME.State, run = S.run;
      const wasBoss = GAME.Combat.c && GAME.Combat.c.tier === 'boss';
      GAME.Combat.c = null;
      if (wasBoss) {
        if (run.act >= 3) { this.showVictory(); return; }
        // выбор босс-реликвии
        const pool = Object.values(GAME.DATA.relics).filter(r => r.rarity === 'boss' && !run.relics.includes(r.id));
        S.rng.shuffle(pool);
        const choices = pool.slice(0, 3);
        if (choices.length) {
          const o = this.openOverlay();
          o.append(el('h3', null, '👑 Трофей владыки'), el('div', 'ov-sub', 'Выберите одну реликвию'));
          for (const r of choices) {
            const b = el('button', 'btn', r.emoji + ' <b>' + r.name + '</b><span class="hint">' + r.desc + '</span>');
            b.onclick = () => {
              S.addRelic(r.id);
              this.closeOverlay();
              S.nextAct(); S.save();
              this.showMap();
            };
            o.appendChild(b);
          }
        } else {
          S.nextAct(); S.save();
          this.showMap();
        }
      } else {
        S.save();
        this.showMap();
      }
    },

    // =============== событие ===============
    showEvent() {
      const S = GAME.State, run = S.run;
      const pool = Object.values(GAME.DATA.events).filter(ev =>
        (!ev.minAct || run.act >= ev.minAct) &&
        (!ev.maxAct || run.act <= ev.maxAct) &&
        (!ev.once || !run.eventsSeen.includes(ev.id)));
      const ev = pool.length ? S.rng.pick(pool) : S.rng.pick(Object.values(GAME.DATA.events));
      run.eventsSeen.push(ev.id);

      const s = $('#screen-event');
      s.innerHTML = '';
      const n = el('div', 'narrative');
      n.append(el('div', 'ev-emoji', ev.emoji), el('h2', null, ev.name), el('div', 'ev-text', ev.text));
      for (const ch of ev.choices) {
        const ok = !ch.require || ((ch.require.gold === undefined || run.gold >= ch.require.gold) && (ch.require.hp === undefined || run.hp >= ch.require.hp));
        const b = el('button', 'btn' + (ok ? '' : ' disabled'),
          ch.label + (ch.hint ? '<span class="hint">' + ch.hint + '</span>' : ''));
        b.onclick = () => {
          Sfx.play('click');
          this.applyOutcomes(ch.outcomes.slice(), () => {
            if (GAME.State.run.hp <= 0) { this.showGameOver(); return; }
            n.innerHTML = '';
            n.append(el('div', 'ev-emoji', ev.emoji), el('h2', null, ev.name), el('div', 'ev-text', ch.resultText));
            const done = el('button', 'btn primary', 'Продолжить путь');
            done.onclick = () => { S.save(); this.showMap(); };
            n.append(done);
            this.renderTopbar();
          });
        };
        n.appendChild(b);
      }
      s.appendChild(n);
      this.showScreen('event');
    },

    applyOutcomes(list, done) {
      const S = GAME.State;
      const next = () => this.applyOutcomes(list, done);
      if (!list.length) { done(); return; }
      const o = list.shift();
      switch (o.type) {
        case 'gold': S.gainGold(o.value); return next();
        case 'hp': o.value >= 0 ? S.heal(o.value) : S.hurt(-o.value); return next();
        case 'maxhp': S.gainMaxHp(o.value); return next();
        case 'heal_full': S.heal(S.run.maxHp); return next();
        case 'add_random_card': {
          const pool = o.rarity ? S.cardPool(o.rarity) : S.cardPool(S.rollRewardRarity('normal'));
          if (pool.length) {
            const c = S.rng.pick(pool);
            S.addCard(c.id);
            this.toast('🃏 Новая карта', c.name);
          }
          return next();
        }
        case 'add_card_choice': {
          const ids = o.rarity
            ? S.rng.shuffle(S.cardPool(o.rarity).map(c => c.id)).slice(0, 3)
            : S.randomCardChoices('normal');
          this.cardChoiceOverlay(ids, (id) => { if (id) S.addCard(id); next(); });
          return;
        }
        case 'remove_card_choice':
          this.showDeckOverlay({
            title: 'Удалить карту', pick: true,
            onPick: (inst) => { S.removeCard(inst.uid); next(); },
            onCancel: next,
          });
          return;
        case 'upgrade_card_choice':
          this.showDeckOverlay({
            title: 'Улучшить карту', pick: true,
            filter: (inst) => !inst.upgraded && GAME.DATA.cards[inst.id].upgrade,
            onPick: (inst) => { S.upgradeCard(inst.uid); next(); },
            onCancel: next,
          });
          return;
        case 'random_relic': {
          const id = S.randomRelic(o.rarity);
          if (id) { S.addRelic(id); const r = GAME.DATA.relics[id]; this.toast(r.emoji + ' ' + r.name, r.desc); }
          return next();
        }
        case 'potion_random': {
          const id = S.randomPotion();
          if (S.addPotion(id)) this.toast('🧪 Зелье', GAME.DATA.potions[id].name);
          return next();
        }
        case 'curse': {
          const id = S.randomCurse();
          if (id) { S.addCard(id); this.toast('🕸 Проклятие!', GAME.DATA.cards[id].name); }
          return next();
        }
        default: return next();
      }
    },

    // =============== магазин ===============
    showShop() {
      const S = GAME.State, run = S.run;
      const shop = run.shop;
      const s = $('#screen-shop');
      s.innerHTML = '';
      const n = el('div', 'narrative');
      n.append(el('div', 'ev-emoji', '🧙'), el('h2', null, 'Странствующий торговец'), el('div', 'ev-text', '«Золото за товар, путник. Честнее сделки не найдёшь во всей башне.»'));
      const list = el('div', 'shop-list');

      const row = (emoji, name, desc, price, sold, onBuy) => {
        const r = el('div', 'shop-row' + (sold ? ' sold' : ''));
        r.append(el('div', 's-emoji', emoji));
        const info = el('div', 's-info');
        info.append(el('div', 's-name', name), el('div', 's-desc', desc));
        r.append(info, el('div', 's-price', sold ? '—' : price + ' 💰'));
        if (!sold) r.onclick = () => {
          if (run.gold < price) { this.toast('💰 Не хватает золота', 'Нужно ' + price + '.'); return; }
          onBuy(r);
        };
        list.appendChild(r);
        return r;
      };

      for (const item of shop.cards) {
        const c = GAME.DATA.cards[item.id];
        row(c.emoji, c.name, c.desc, item.price, item.sold, () => {
          run.gold -= item.price; item.sold = true;
          S.addCard(item.id); Sfx.play('gold'); S.save();
          this.showShop();
        });
      }
      for (const item of shop.relics) {
        const r = GAME.DATA.relics[item.id];
        row(r.emoji, r.name, r.desc, item.price, item.sold, () => {
          run.gold -= item.price; item.sold = true;
          S.addRelic(item.id); Sfx.play('gold'); S.save();
          this.showShop();
        });
      }
      for (const item of shop.potions) {
        const p = GAME.DATA.potions[item.id];
        row(p.emoji, p.name, p.desc, item.price, item.sold, () => {
          if (!S.addPotion(item.id)) { this.toast('🧪 Нет места', 'Все слоты зелий заняты.'); return; }
          run.gold -= item.price; item.sold = true;
          Sfx.play('gold'); S.save();
          this.showShop();
        });
      }
      row('🗑', 'Удаление карты', 'Убрать одну карту из колоды навсегда', shop.removePrice, shop.removeUsed, () => {
        this.showDeckOverlay({
          title: 'Удалить карту', pick: true,
          onPick: (inst) => {
            run.gold -= shop.removePrice;
            shop.removeUsed = true;
            run.removalsBought++;
            S.removeCard(inst.uid);
            Sfx.play('gold'); S.save();
            this.showShop();
          },
          onCancel: () => { },
        });
      });

      n.appendChild(list);
      const leave = el('button', 'btn primary', 'Уйти');
      leave.style.marginTop = '14px';
      leave.onclick = () => { S.save(); this.showMap(); };
      n.appendChild(leave);
      s.appendChild(n);
      this.showScreen('shop');
    },

    // =============== отдых ===============
    showRest() {
      const S = GAME.State, run = S.run;
      const s = $('#screen-rest');
      s.innerHTML = '';
      const heal = Math.round(run.maxHp * 0.30 * (1 + S.passiveSum('restBonusPct') / 100));
      const n = el('div', 'narrative');
      n.append(el('div', 'ev-emoji', '🔥'), el('h2', null, 'Костёр'), el('div', 'ev-text', 'Пламя дрожит в темноте. Здесь безопасно — можно перевести дух или поработать над колодой.'));
      const b1 = el('button', 'btn', '😴 Отдохнуть <span class="hint">Восстановить ' + heal + ' HP</span>');
      b1.onclick = () => {
        S.heal(heal); Sfx.play('heal'); S.save();
        this.showMap();
      };
      const b2 = el('button', 'btn', '⚒️ Ковать <span class="hint">Улучшить одну карту</span>');
      b2.onclick = () => {
        this.showDeckOverlay({
          title: 'Улучшить карту', pick: true,
          filter: (inst) => !inst.upgraded && GAME.DATA.cards[inst.id].upgrade,
          onPick: (inst) => { S.upgradeCard(inst.uid); Sfx.play('gold'); S.save(); this.showMap(); },
          onCancel: () => { },
        });
      };
      n.append(b1, b2);
      s.appendChild(n);
      this.showScreen('rest');
    },

    // =============== сокровище ===============
    showTreasure() {
      const S = GAME.State;
      const s = $('#screen-treasure');
      s.innerHTML = '';
      const id = S.randomRelic();
      const n = el('div', 'narrative');
      n.append(el('div', 'ev-emoji', '🎁'), el('h2', null, 'Сундук'));
      if (id) {
        const r = GAME.DATA.relics[id];
        S.addRelic(id);
        n.append(el('div', 'ev-text', 'Внутри вы находите:\n\n' + r.emoji + ' ' + r.name + '\n' + r.desc));
      } else {
        n.append(el('div', 'ev-text', 'Сундук пуст. Кто-то побывал здесь раньше.'));
      }
      const b = el('button', 'btn primary', 'Продолжить путь');
      b.onclick = () => { S.save(); this.showMap(); };
      n.appendChild(b);
      s.appendChild(n);
      this.showScreen('treasure');
    },

    // =============== финалы ===============
    showGameOver() {
      const S = GAME.State, st = S.run.stats;
      S.clearSave();
      const s = $('#screen-gameover');
      s.className = 'screen finale';
      s.innerHTML = '';
      s.append(
        el('div', 'big-emoji', '💀'),
        el('h1', null, 'Тьма поглотила вас'),
        el('div', 'stats', 'Акт: ' + S.run.act + ' • Боёв выиграно: ' + st.battles + '<br>Урона нанесено: ' + st.damageDealt + ' • Карт сыграно: ' + st.cardsPlayed),
      );
      const b = el('button', 'btn primary', 'Попробовать снова');
      b.style.maxWidth = '280px';
      b.onclick = () => this.showTitle();
      s.appendChild(b);
      this.showScreen('gameover');
    },

    showVictory() {
      const S = GAME.State, st = S.run.stats;
      S.clearSave();
      const s = $('#screen-victory');
      s.className = 'screen finale';
      s.innerHTML = '';
      s.append(
        el('div', 'big-emoji', '🐉'),
        el('h1', null, 'Дракон повержен!'),
        el('div', 'stats', 'Вечная Башня покорена.<br>Боёв: ' + st.battles + ' • Урона: ' + st.damageDealt + '<br>Карт сыграно: ' + st.cardsPlayed + ' • Золота добыто: ' + st.goldEarned),
      );
      const b = el('button', 'btn primary', 'Новое восхождение');
      b.style.maxWidth = '280px';
      b.onclick = () => this.showTitle();
      s.appendChild(b);
      this.showScreen('victory');
    },

    // =============== оверлеи ===============
    openOverlay() {
      const o = $('#overlay');
      o.innerHTML = '';
      o.classList.remove('hidden');
      return o;
    },
    closeOverlay() {
      $('#overlay').classList.add('hidden');
      $('#overlay').innerHTML = '';
    },

    cardChoiceOverlay(ids, cb) {
      const o = this.openOverlay();
      o.append(el('h3', null, '🃏 Выберите карту'));
      const row = el('div', 'card-row');
      for (const id of ids) {
        const def = GAME.DATA.cards[id];
        const d = this.cardEl(def, null, true);
        d.onclick = () => { this.closeOverlay(); cb(id); };
        row.appendChild(d);
      }
      o.appendChild(row);
      const skip = el('button', 'btn ov-actions', 'Пропустить');
      skip.onclick = () => { this.closeOverlay(); cb(null); };
      o.appendChild(skip);
    },

    showDeckOverlay(opts) {
      const S = GAME.State;
      const o = this.openOverlay();
      o.append(el('h3', null, opts.title || 'Колода'));
      const grid = el('div', 'card-grid');
      let cards = S.run.deck.slice().sort((a, b) => GAME.DATA.cards[a.id].name.localeCompare(GAME.DATA.cards[b.id].name));
      if (opts.filter) cards = cards.filter(opts.filter);
      if (!cards.length) o.append(el('div', 'ov-sub', 'Нет подходящих карт.'));
      for (const inst of cards) {
        const def = S.cardDef(inst);
        const d = this.cardEl(def, inst);
        if (opts.pick) d.onclick = () => { this.closeOverlay(); opts.onPick(inst); };
        else this.addLongPress(d, () => this.zoomCard(def));
        grid.appendChild(d);
      }
      o.appendChild(grid);
      const close = el('button', 'btn ov-actions', opts.pick ? 'Отмена' : 'Закрыть');
      close.onclick = () => { this.closeOverlay(); if (opts.onCancel) opts.onCancel(); };
      o.appendChild(close);
    },

    showPile(title, pile, hideOrder) {
      const C = GAME.Combat;
      const o = this.openOverlay();
      o.append(el('h3', null, title + ' (' + pile.length + ')'));
      const grid = el('div', 'card-grid');
      let list = pile.slice();
      if (hideOrder) list.sort((a, b) => C.def(a).name.localeCompare(C.def(b).name));
      for (const inst of list) grid.appendChild(this.cardEl(C.def(inst), inst));
      o.appendChild(grid);
      const close = el('button', 'btn ov-actions', 'Закрыть');
      close.onclick = () => this.closeOverlay();
      o.appendChild(close);
    },

    zoomCard(def) {
      const o = this.openOverlay();
      const d = this.cardEl(def, null, true);
      o.appendChild(d);
      const close = el('button', 'btn ov-actions', 'Закрыть');
      close.onclick = () => this.closeOverlay();
      o.appendChild(close);
      o.onclick = (e) => { if (e.target === o) this.closeOverlay(); };
    },

    toast(title, text) {
      const o = this.openOverlay();
      o.append(el('h3', null, title), el('div', 'ov-sub', text || ''));
      const close = el('button', 'btn ov-actions', 'Понятно');
      close.onclick = () => this.closeOverlay();
      o.appendChild(close);
      o.onclick = (e) => { if (e.target === o) this.closeOverlay(); };
    },

    confirm(text, yes) {
      const o = this.openOverlay();
      o.append(el('h3', null, '⚠️'), el('div', 'ov-sub', text));
      const act = el('div', 'ov-actions');
      const y = el('button', 'btn danger', 'Да');
      y.onclick = () => { this.closeOverlay(); yes(); };
      const n = el('button', 'btn', 'Отмена');
      n.onclick = () => this.closeOverlay();
      act.append(y, n);
      o.appendChild(act);
    },

    showMenu() {
      const o = this.openOverlay();
      o.append(el('h3', null, '☰ Меню'));
      const act = el('div', 'ov-actions');
      const resume = el('button', 'btn', 'Вернуться к игре');
      resume.onclick = () => this.closeOverlay();
      const snd = el('button', 'btn', Sfx.muted ? '🔇 Звук: выкл' : '🔊 Звук: вкл');
      snd.onclick = () => {
        Sfx.muted = !Sfx.muted;
        GAME.State.saveSettings({ muted: Sfx.muted });
        snd.textContent = Sfx.muted ? '🔇 Звук: выкл' : '🔊 Звук: вкл';
      };
      const help = el('button', 'btn', '📖 Как играть');
      help.onclick = () => this.showHelp();
      const abandon = el('button', 'btn danger', '🏳 Сдаться');
      abandon.onclick = () => this.confirm('Завершить забег? Прогресс будет потерян.', () => {
        GAME.State.clearSave();
        this.showTitle();
      });
      act.append(resume, snd, help, abandon);
      o.appendChild(act);
    },

    showHelp() {
      this.toast('📖 Как играть',
        'Поднимайтесь по башне, выбирая путь на карте. В бою разыгрывайте карты за энергию ⚡: атаки бьют врагов, умения дают блок 🛡 и эффекты. ' +
        'Над врагом показано его намерение: ⚔️ — атака, 🛡 — защита, 💪 — усиление, 🌀 — помеха. ' +
        'После боя выбирайте новые карты, собирайте реликвии и зелья. Смерть окончательна — но башня вечна. ' +
        'Совет: не берите каждую карту — тонкая колода сильнее.');
    },

    // =============== карточка (DOM) ===============
    cardEl(def, inst, big) {
      const d = el('div', 'card ' + def.type + (big ? ' big' : ''));
      const upgraded = inst ? inst.upgraded : def.__upgraded;
      if (!def.unplayable || def.cost > 0) d.appendChild(el('div', 'cost', def.cost === 'X' ? 'X' : def.cost));
      d.append(
        el('div', 'cname' + (upgraded ? ' upg' : ''), def.name),
        el('div', 'cart', def.emoji),
        el('div', 'cdesc', def.desc),
        el('div', 'ctype', TYPE_RU[def.type] || def.type),
      );
      return d;
    },

    addLongPress(elem, fn) {
      let timer = null;
      const start = (e) => { timer = setTimeout(() => { timer = null; fn(); }, 480); };
      const cancel = () => { if (timer) clearTimeout(timer); timer = null; };
      elem.addEventListener('touchstart', start, { passive: true });
      elem.addEventListener('touchend', cancel);
      elem.addEventListener('touchmove', cancel);
      elem.addEventListener('contextmenu', (e) => { e.preventDefault(); fn(); });
    },
  };

  GAME.UI = UI;
  GAME.Sfx = Sfx;
})();
