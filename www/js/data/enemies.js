(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;
  GAME.DATA = GAME.DATA || {};

  // ===========================================================
  // Враги Вечной Башни. Акт 1 — гнилые подвалы: гоблины, волки,
  // кости. Акт 2 — залы Пустой Луны: культ, призраки, мертвецы
  // в латах. Акт 3 — верхние ярусы: демоны, стихии и та, что
  // спит под самой крышей.
  // ===========================================================

  GAME.DATA.enemies = {

    // ------------------------- АКТ 1 -------------------------

    goblin_scout: {
      id: 'goblin_scout', name: 'Гоблин-лазутчик', emoji: '👺',
      hpMin: 22, hpMax: 26,
      act: 1, tier: 'normal',
      moves: {
        stab: { name: 'Ржавый нож', intent: 'attack', effects: [{ type: 'damage', value: 7 }] },
        dirty_trick: {
          name: 'Грязный приём', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 4 }, { type: 'applyPlayer', status: 'weak', value: 1 }]
        }
      },
      ai: {
        rules: [
          { move: 'stab', weight: 3, maxRepeat: 2 },
          { move: 'dirty_trick', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    goblin_shaman: {
      id: 'goblin_shaman', name: 'Гоблин-костоправ', emoji: '🧿',
      hpMin: 18, hpMax: 22,
      act: 1, tier: 'normal',
      moves: {
        rotten_word: { name: 'Гнилое слово', intent: 'debuff', effects: [{ type: 'applyPlayer', status: 'weak', value: 2 }] },
        bog_spark: { name: 'Болотная искра', intent: 'attack', effects: [{ type: 'damage', value: 6 }] },
        cackle: { name: 'Визгливый хохот', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 2 }] }
      },
      ai: {
        first: 'rotten_word',
        rules: [
          { move: 'bog_spark', weight: 3, maxRepeat: 2 },
          { move: 'rotten_word', weight: 1, maxRepeat: 1 },
          { move: 'cackle', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    hungry_wolf: {
      id: 'hungry_wolf', name: 'Оголодавший волк', emoji: '🐺',
      hpMin: 24, hpMax: 28,
      act: 1, tier: 'normal',
      moves: {
        bite: { name: 'Клыки', intent: 'attack', effects: [{ type: 'damage', value: 8 }] },
        lunge: {
          name: 'Бросок к горлу', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 5 }, { type: 'applyPlayer', status: 'vulnerable', value: 1 }]
        },
        howl: { name: 'Вой на Пустую Луну', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 1 }] }
      },
      ai: {
        rules: [
          { move: 'bite', weight: 3, maxRepeat: 2 },
          { move: 'lunge', weight: 2, maxRepeat: 1 },
          { move: 'howl', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    skeleton_warrior: {
      id: 'skeleton_warrior', name: 'Скелет-ратник', emoji: '💀',
      hpMin: 28, hpMax: 32,
      act: 1, tier: 'normal',
      moves: {
        slash: { name: 'Зазубренный меч', intent: 'attack', effects: [{ type: 'damage', value: 9 }] },
        bone_wall: { name: 'Костяной заслон', intent: 'defend', effects: [{ type: 'block', value: 8 }] }
      },
      ai: {
        rules: [
          { move: 'slash', weight: 3, maxRepeat: 2 },
          { move: 'bone_wall', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    skeleton_archer: {
      id: 'skeleton_archer', name: 'Скелет-лучник', emoji: '🏹',
      hpMin: 18, hpMax: 22,
      act: 1, tier: 'normal',
      moves: {
        shot: { name: 'Стрела в упор', intent: 'attack', effects: [{ type: 'damage', value: 6 }] },
        volley: { name: 'Скрип тетивы', intent: 'attack', effects: [{ type: 'damage', value: 3, times: 2 }] },
        take_aim: { name: 'Пустые глазницы целятся', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 2 }] }
      },
      ai: {
        rules: [
          { move: 'shot', weight: 3, maxRepeat: 2 },
          { move: 'volley', weight: 2, maxRepeat: 2 },
          { move: 'take_aim', weight: 1, maxRepeat: 1, onceOnly: true }
        ]
      }
    },

    grave_slime: {
      id: 'grave_slime', name: 'Могильный слизень', emoji: '🟢',
      hpMin: 32, hpMax: 36,
      act: 1, tier: 'normal',
      moves: {
        engulf: {
          name: 'Обволочь', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 5 }, { type: 'addCardPlayer', card: 'slimed', where: 'discard', count: 1 }]
        },
        acid_spit: { name: 'Кислотный плевок', intent: 'attack', effects: [{ type: 'damage', value: 7 }] }
      },
      ai: {
        rules: [
          { move: 'acid_spit', weight: 3, maxRepeat: 2 },
          { move: 'engulf', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    wolf_alpha: {
      id: 'wolf_alpha', name: 'Седой вожак', emoji: '🐺',
      hpMin: 48, hpMax: 54,
      act: 1, tier: 'elite',
      moves: {
        rend: { name: 'Рваная рана', intent: 'attack', effects: [{ type: 'damage', value: 11 }] },
        pack_fury: { name: 'Ярость стаи', intent: 'attack', effects: [{ type: 'damage', value: 6, times: 2 }] },
        alpha_howl: { name: 'Вой вожака', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 2 }] }
      },
      ai: {
        first: 'alpha_howl',
        rules: [
          { move: 'rend', weight: 3, maxRepeat: 2 },
          { move: 'pack_fury', weight: 2, maxRepeat: 2 },
          { move: 'alpha_howl', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    bone_golem: {
      id: 'bone_golem', name: 'Голем из костей', emoji: '🦴',
      hpMin: 52, hpMax: 58,
      act: 1, tier: 'elite',
      moves: {
        crush: { name: 'Раздавить', intent: 'attack', effects: [{ type: 'damage', value: 12 }] },
        bone_armor: {
          name: 'Костяной панцирь', intent: 'defend',
          effects: [{ type: 'block', value: 9 }, { type: 'applySelf', status: 'metallicize', value: 2 }]
        },
        shard_spray: {
          name: 'Осколки чужих рёбер', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 7 }, { type: 'addCardPlayer', card: 'wound', where: 'discard', count: 1 }]
        }
      },
      ai: {
        rules: [
          { move: 'crush', weight: 3, maxRepeat: 2 },
          { move: 'bone_armor', weight: 2, maxRepeat: 1 },
          { move: 'shard_spray', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    goblin_king: {
      id: 'goblin_king', name: 'Гнилозуб, король-под-полом', emoji: '👑',
      hpMin: 138, hpMax: 146,
      act: 1, tier: 'boss',
      moves: {
        scepter: { name: 'Скипетр из бедренной кости', intent: 'attack', effects: [{ type: 'damage', value: 12 }] },
        war_drums: { name: 'Барабаны из краденой кожи', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 3 }] },
        shrieking_court: { name: 'Визг свиты', intent: 'attack', effects: [{ type: 'damage', value: 4, times: 3 }] },
        royal_tantrum: {
          name: 'Королевская истерика', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 9 }, { type: 'applyPlayer', status: 'vulnerable', value: 2 }]
        }
      },
      ai: {
        first: 'war_drums',
        rules: [
          // Пока корона сидит крепко — бьёт размеренно.
          { move: 'scepter', weight: 3, maxRepeat: 2, minHpPct: 50 },
          { move: 'shrieking_court', weight: 2, maxRepeat: 1, minHpPct: 50 },
          { move: 'war_drums', weight: 1, maxRepeat: 1, minHpPct: 50 },
          // Полкороля позади — начинается истерика.
          { move: 'royal_tantrum', weight: 3, maxRepeat: 2, maxHpPct: 50 },
          { move: 'shrieking_court', weight: 2, maxRepeat: 2, maxHpPct: 50 },
          { move: 'war_drums', weight: 1, maxRepeat: 1, maxHpPct: 50 }
        ]
      }
    },

    // ------------------------- АКТ 2 -------------------------

    void_cultist: {
      id: 'void_cultist', name: 'Культист Пустой Луны', emoji: '🕯️',
      hpMin: 44, hpMax: 50,
      act: 2, tier: 'normal',
      moves: {
        dark_vow: { name: 'Тёмный обет', intent: 'buff', effects: [{ type: 'applySelf', status: 'ritual', value: 2 }] },
        sacrificial_dagger: { name: 'Жертвенный кинжал', intent: 'attack', effects: [{ type: 'damage', value: 9 }] }
      },
      ai: {
        first: 'dark_vow',
        rules: [
          { move: 'sacrificial_dagger', weight: 4, maxRepeat: 3 },
          { move: 'dark_vow', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    blade_fanatic: {
      id: 'blade_fanatic', name: 'Фанатик-бичеватель', emoji: '🔪',
      hpMin: 48, hpMax: 54,
      act: 2, tier: 'normal',
      moves: {
        frenzied_cuts: { name: 'Исступлённые порезы', intent: 'attack', effects: [{ type: 'damage', value: 6, times: 2 }] },
        deep_cut: {
          name: 'Глубокий надрез', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 8 }, { type: 'applyPlayer', status: 'weak', value: 1 }]
        },
        blood_whisper: { name: 'Кровавый шёпот', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 2 }] }
      },
      ai: {
        rules: [
          { move: 'frenzied_cuts', weight: 3, maxRepeat: 2 },
          { move: 'deep_cut', weight: 2, maxRepeat: 1 },
          { move: 'blood_whisper', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    weeping_shade: {
      id: 'weeping_shade', name: 'Плакальщица', emoji: '👻',
      hpMin: 40, hpMax: 46,
      act: 2, tier: 'normal',
      moves: {
        funeral_wail: { name: 'Погребальный плач', intent: 'debuff', effects: [{ type: 'applyPlayer', status: 'frail', value: 2 }] },
        cold_touch: {
          name: 'Стылое касание', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 10 }, { type: 'applyPlayer', status: 'weak', value: 1 }]
        },
        fade: { name: 'Растаять во тьме', intent: 'defend', effects: [{ type: 'block', value: 10 }] }
      },
      ai: {
        first: 'funeral_wail',
        rules: [
          { move: 'cold_touch', weight: 3, maxRepeat: 2 },
          { move: 'funeral_wail', weight: 1, maxRepeat: 1 },
          { move: 'fade', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    grave_wraith: {
      id: 'grave_wraith', name: 'Могильный морок', emoji: '🌫️',
      hpMin: 50, hpMax: 56,
      act: 2, tier: 'normal',
      moves: {
        steal_warmth: {
          name: 'Высосать тепло', intent: 'attack',
          effects: [{ type: 'damage', value: 9 }, { type: 'heal', value: 4 }]
        },
        sepulchral_dread: { name: 'Загробный ужас', intent: 'debuff', effects: [{ type: 'applyPlayer', status: 'vulnerable', value: 2 }] }
      },
      ai: {
        rules: [
          { move: 'steal_warmth', weight: 3, maxRepeat: 2 },
          { move: 'sepulchral_dread', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    crypt_ghoul: {
      id: 'crypt_ghoul', name: 'Гуль из склепа', emoji: '🧟',
      hpMin: 55, hpMax: 62,
      act: 2, tier: 'normal',
      moves: {
        corpse_claws: { name: 'Трупные когти', intent: 'attack', effects: [{ type: 'damage', value: 12 }] },
        rotten_bite: {
          name: 'Гнилой укус', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 7 }, { type: 'applyPlayer', status: 'poison', value: 3 }]
        }
      },
      ai: {
        rules: [
          { move: 'corpse_claws', weight: 3, maxRepeat: 2 },
          { move: 'rotten_bite', weight: 2, maxRepeat: 2 }
        ]
      }
    },

    plague_priest: {
      id: 'plague_priest', name: 'Жрец Гнили', emoji: '☠️',
      hpMin: 46, hpMax: 52,
      act: 2, tier: 'normal',
      moves: {
        rot_wave: {
          name: 'Гнилостная волна', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 6 }, { type: 'applyPlayer', status: 'poison', value: 4 }]
        },
        censer_flail: { name: 'Кадило на цепи', intent: 'attack', effects: [{ type: 'damage', value: 11 }] },
        rot_blessing: { name: 'Благословение Гнили', intent: 'buff', effects: [{ type: 'applySelf', status: 'regen', value: 5 }] }
      },
      ai: {
        rules: [
          { move: 'rot_wave', weight: 3, maxRepeat: 2 },
          { move: 'censer_flail', weight: 2, maxRepeat: 2 },
          { move: 'rot_blessing', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    death_knight: {
      id: 'death_knight', name: 'Рыцарь погасшего герба', emoji: '⚔️',
      hpMin: 95, hpMax: 105,
      act: 2, tier: 'elite',
      moves: {
        sorrow_blade: { name: 'Клинок скорби', intent: 'attack', effects: [{ type: 'damage', value: 16 }] },
        black_bulwark: {
          name: 'Чёрная стена щита', intent: 'defend',
          effects: [{ type: 'block', value: 12 }, { type: 'applySelf', status: 'metallicize', value: 3 }]
        },
        soul_rend: {
          name: 'Расколоть душу', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 10 }, { type: 'applyPlayer', status: 'frail', value: 2 }]
        }
      },
      ai: {
        rules: [
          { move: 'sorrow_blade', weight: 3, maxRepeat: 2 },
          { move: 'black_bulwark', weight: 2, maxRepeat: 1 },
          { move: 'soul_rend', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    specter_executioner: {
      id: 'specter_executioner', name: 'Призрачный палач', emoji: '🪓',
      hpMin: 88, hpMax: 96,
      act: 2, tier: 'elite',
      moves: {
        axe_falls: { name: 'Топор падает', intent: 'attack', effects: [{ type: 'damage', value: 18 }] },
        death_mark: { name: 'Метка приговорённого', intent: 'debuff', effects: [{ type: 'applyPlayer', status: 'vulnerable', value: 3 }] },
        into_mist: { name: 'Уйти в туман', intent: 'defend', effects: [{ type: 'block', value: 14 }] }
      },
      ai: {
        first: 'death_mark',
        rules: [
          { move: 'axe_falls', weight: 3, maxRepeat: 2 },
          { move: 'death_mark', weight: 1, maxRepeat: 1 },
          { move: 'into_mist', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    hierophant: {
      id: 'hierophant', name: 'Иерофант Пустой Луны', emoji: '🌑',
      hpMin: 216, hpMax: 226,
      act: 2, tier: 'boss',
      moves: {
        void_spear: { name: 'Копьё пустоты', intent: 'attack', effects: [{ type: 'damage', value: 14 }] },
        empty_prayer: { name: 'Молитва в никуда', intent: 'buff', effects: [{ type: 'applySelf', status: 'ritual', value: 3 }] },
        sermon_of_despair: {
          name: 'Проповедь отчаяния', intent: 'debuff',
          effects: [
            { type: 'applyPlayer', status: 'weak', value: 2 },
            { type: 'applyPlayer', status: 'frail', value: 2 }
          ]
        },
        eclipse: { name: 'Затмение', intent: 'attack', effects: [{ type: 'damage', value: 6, times: 3 }] },
        black_communion: { name: 'Чёрное причастие', intent: 'buff', effects: [{ type: 'heal', value: 20 }] }
      },
      ai: {
        first: 'empty_prayer',
        rules: [
          // Пока луна высоко — служба идёт по чину.
          { move: 'void_spear', weight: 3, maxRepeat: 2, minHpPct: 60 },
          { move: 'sermon_of_despair', weight: 2, maxRepeat: 1, minHpPct: 60 },
          { move: 'empty_prayer', weight: 1, maxRepeat: 1, minHpPct: 60 },
          // Служба сорвана — начинается затмение.
          { move: 'eclipse', weight: 3, maxRepeat: 2, maxHpPct: 60 },
          { move: 'void_spear', weight: 2, maxRepeat: 2, maxHpPct: 60 },
          { move: 'sermon_of_despair', weight: 1, maxRepeat: 1, maxHpPct: 60 },
          { move: 'black_communion', weight: 1, maxRepeat: 1, maxHpPct: 60, onceOnly: true }
        ]
      }
    },

    // ------------------------- АКТ 3 -------------------------

    ember_imp: {
      id: 'ember_imp', name: 'Бес-головня', emoji: '😈',
      hpMin: 70, hpMax: 78,
      act: 3, tier: 'normal',
      moves: {
        fire_spit: { name: 'Горящий плевок', intent: 'attack', effects: [{ type: 'damage', value: 7, times: 2 }] },
        singe: {
          name: 'Подпалить пятки', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 10 }, { type: 'applyPlayer', status: 'vulnerable', value: 1 }]
        },
        coal_crackle: { name: 'Треск углей', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 3 }] }
      },
      ai: {
        rules: [
          { move: 'fire_spit', weight: 3, maxRepeat: 2 },
          { move: 'singe', weight: 2, maxRepeat: 1 },
          { move: 'coal_crackle', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    flame_elemental: {
      id: 'flame_elemental', name: 'Пламенный элементаль', emoji: '🔥',
      hpMin: 78, hpMax: 86,
      act: 3, tier: 'normal',
      moves: {
        flare: { name: 'Вспышка', intent: 'attack', effects: [{ type: 'damage', value: 16 }] },
        firestorm: { name: 'Языки пламени', intent: 'attack', effects: [{ type: 'damage', value: 7, times: 3 }] },
        kindle: { name: 'Раздуться жаром', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 3 }] }
      },
      ai: {
        rules: [
          { move: 'flare', weight: 3, maxRepeat: 2 },
          { move: 'firestorm', weight: 1, maxRepeat: 1 },
          { move: 'kindle', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    frost_elemental: {
      id: 'frost_elemental', name: 'Стылый элементаль', emoji: '❄️',
      hpMin: 82, hpMax: 90,
      act: 3, tier: 'normal',
      moves: {
        ice_spear: {
          name: 'Ледяное копьё', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 14 }, { type: 'applyPlayer', status: 'weak', value: 1 }]
        },
        hail: { name: 'Град осколков', intent: 'attack', effects: [{ type: 'damage', value: 6, times: 3 }] },
        rime_shell: { name: 'Обрасти льдом', intent: 'defend', effects: [{ type: 'block', value: 15 }] }
      },
      ai: {
        rules: [
          { move: 'ice_spear', weight: 3, maxRepeat: 2 },
          { move: 'hail', weight: 2, maxRepeat: 1 },
          { move: 'rime_shell', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    stone_colossus: {
      id: 'stone_colossus', name: 'Базальтовый истукан', emoji: '🪨',
      hpMin: 110, hpMax: 120,
      act: 3, tier: 'normal',
      moves: {
        avalanche_slam: { name: 'Обрушиться всей тушей', intent: 'attack', effects: [{ type: 'damage', value: 20 }] },
        petrify: { name: 'Окаменеть', intent: 'buff', effects: [{ type: 'applySelf', status: 'metallicize', value: 4 }] },
        quake: {
          name: 'Дрожь земли', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 12 }, { type: 'addCardPlayer', card: 'dazed', where: 'discard', count: 1 }]
        }
      },
      ai: {
        rules: [
          { move: 'avalanche_slam', weight: 3, maxRepeat: 2 },
          { move: 'petrify', weight: 1, maxRepeat: 1 },
          { move: 'quake', weight: 2, maxRepeat: 1 }
        ]
      }
    },

    hell_hound: {
      id: 'hell_hound', name: 'Гончая преисподней', emoji: '👿',
      hpMin: 72, hpMax: 80,
      act: 3, tier: 'normal',
      moves: {
        burning_maw: { name: 'Пылающая пасть', intent: 'attack', effects: [{ type: 'damage', value: 15 }] },
        pounce: {
          name: 'Прыжок из тени', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 12 }, { type: 'applyPlayer', status: 'weak', value: 1 }]
        },
        ash_howl: { name: 'Пепельный вой', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 2 }] }
      },
      ai: {
        rules: [
          { move: 'burning_maw', weight: 3, maxRepeat: 2 },
          { move: 'pounce', weight: 2, maxRepeat: 1 },
          { move: 'ash_howl', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    demon_legionnaire: {
      id: 'demon_legionnaire', name: 'Демон-легионер', emoji: '👹',
      hpMin: 95, hpMax: 105,
      act: 3, tier: 'normal',
      moves: {
        obsidian_halberd: { name: 'Обсидиановая алебарда', intent: 'attack', effects: [{ type: 'damage', value: 18 }] },
        shield_wall: { name: 'Стена щитов', intent: 'defend', effects: [{ type: 'block', value: 16 }] },
        legion_cry: { name: 'Клич легиона', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 3 }] }
      },
      ai: {
        rules: [
          { move: 'obsidian_halberd', weight: 3, maxRepeat: 2 },
          { move: 'shield_wall', weight: 2, maxRepeat: 1 },
          { move: 'legion_cry', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    demon_butcher: {
      id: 'demon_butcher', name: 'Мясник Девятого яруса', emoji: '🩸',
      hpMin: 160, hpMax: 175,
      act: 3, tier: 'elite',
      moves: {
        soul_cleaver: { name: 'Тесак для душ', intent: 'attack', effects: [{ type: 'damage', value: 24 }] },
        rib_hook: {
          name: 'Крюк под рёбра', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 16 }, { type: 'applyPlayer', status: 'vulnerable', value: 2 }]
        },
        whetstone: { name: 'Точить о чужую кость', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 4 }] }
      },
      ai: {
        rules: [
          { move: 'soul_cleaver', weight: 3, maxRepeat: 2 },
          { move: 'rib_hook', weight: 2, maxRepeat: 1 },
          { move: 'whetstone', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    storm_elemental: {
      id: 'storm_elemental', name: 'Элементаль грозы', emoji: '⛈️',
      hpMin: 150, hpMax: 165,
      act: 3, tier: 'elite',
      moves: {
        thunderbolt: { name: 'Удар молнии', intent: 'attack', effects: [{ type: 'damage', value: 22 }] },
        static_field: {
          name: 'Наэлектризованный воздух', intent: 'debuff',
          effects: [
            { type: 'applyPlayer', status: 'weak', value: 2 },
            { type: 'addCardPlayer', card: 'dazed', where: 'draw', count: 2 }
          ]
        },
        tempest: { name: 'Шквал', intent: 'attack', effects: [{ type: 'damage', value: 8, times: 3 }] }
      },
      ai: {
        rules: [
          { move: 'thunderbolt', weight: 3, maxRepeat: 2 },
          { move: 'tempest', weight: 2, maxRepeat: 1 },
          { move: 'static_field', weight: 1, maxRepeat: 1 }
        ]
      }
    },

    black_dragon: {
      id: 'black_dragon', name: 'Умбра, Пожирательница Небес', emoji: '🐉',
      hpMin: 315, hpMax: 330,
      act: 3, tier: 'boss',
      moves: {
        scythe_claw: { name: 'Коготь-коса', intent: 'attack', effects: [{ type: 'damage', value: 18 }] },
        tail_lash: {
          name: 'Хлёсткий хвост', intent: 'attack_debuff',
          effects: [{ type: 'damage', value: 12 }, { type: 'applyPlayer', status: 'weak', value: 2 }]
        },
        black_flame: { name: 'Чёрное пламя', intent: 'attack', effects: [{ type: 'damage', value: 10, times: 3 }] },
        hurricane_wings: { name: 'Крылья урагана', intent: 'defend', effects: [{ type: 'block', value: 20 }] },
        star_snuffing_roar: { name: 'Рёв, гасящий звёзды', intent: 'buff', effects: [{ type: 'applySelf', status: 'strength', value: 4 }] }
      },
      ai: {
        first: 'star_snuffing_roar',
        rules: [
          // Фаза 1: дракониха лениво играет с добычей.
          { move: 'scythe_claw', weight: 3, maxRepeat: 2, minHpPct: 65 },
          { move: 'tail_lash', weight: 2, maxRepeat: 1, minHpPct: 65 },
          { move: 'hurricane_wings', weight: 1, maxRepeat: 1, minHpPct: 65 },
          // Фаза 2: чешуя пробита — в ход идёт пламя.
          { move: 'black_flame', weight: 3, maxRepeat: 1, minHpPct: 30, maxHpPct: 65 },
          { move: 'scythe_claw', weight: 2, maxRepeat: 2, minHpPct: 30, maxHpPct: 65 },
          { move: 'star_snuffing_roar', weight: 1, maxRepeat: 1, minHpPct: 30, maxHpPct: 65 },
          // Фаза 3: агония. Небо горит вместе с ней.
          { move: 'black_flame', weight: 3, maxRepeat: 2, maxHpPct: 30 },
          { move: 'tail_lash', weight: 2, maxRepeat: 1, maxHpPct: 30 },
          { move: 'star_snuffing_roar', weight: 2, maxRepeat: 1, maxHpPct: 30 }
        ]
      }
    }
  };

  // ===========================================================
  // Пулы боёв: 1-3 врага, tier и act строго соответствуют пулу.
  // ===========================================================

  GAME.DATA.encounters = {
    1: {
      normal: [
        ['goblin_scout'],
        ['hungry_wolf'],
        ['skeleton_warrior'],
        ['grave_slime'],
        ['skeleton_archer', 'skeleton_warrior'],
        ['goblin_scout', 'goblin_shaman'],
        ['hungry_wolf', 'hungry_wolf'],
        ['goblin_shaman', 'goblin_scout', 'goblin_scout']
      ],
      elite: [
        ['wolf_alpha'],
        ['bone_golem']
      ],
      boss: [
        ['goblin_king']
      ]
    },
    2: {
      normal: [
        ['blade_fanatic'],
        ['weeping_shade'],
        ['crypt_ghoul'],
        ['void_cultist', 'void_cultist'],
        ['grave_wraith', 'weeping_shade'],
        ['plague_priest', 'void_cultist'],
        ['crypt_ghoul', 'blade_fanatic']
      ],
      elite: [
        ['death_knight'],
        ['specter_executioner']
      ],
      boss: [
        ['hierophant']
      ]
    },
    3: {
      normal: [
        ['flame_elemental'],
        ['frost_elemental'],
        ['stone_colossus'],
        ['demon_legionnaire'],
        ['ember_imp', 'ember_imp'],
        ['hell_hound', 'ember_imp'],
        ['hell_hound', 'hell_hound'],
        ['flame_elemental', 'frost_elemental']
      ],
      elite: [
        ['demon_butcher'],
        ['storm_elemental']
      ],
      boss: [
        ['black_dragon']
      ]
    }
  };
})();
