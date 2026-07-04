(function () {
  const G = (typeof window !== 'undefined' ? window : globalThis);
  G.GAME = G.GAME || {};
  const GAME = G.GAME;

  const ROWS = 15; // 0..14, где 14 — босс

  // Типы узлов: monster, elite, event, rest, shop, treasure, boss
  const MapGen = {
    ROWS,
    generate(act, rng) {
      // 1) количество узлов в каждом ряду
      const counts = [];
      for (let r = 0; r < ROWS; r++) {
        if (r === ROWS - 1) counts.push(1);            // босс
        else if (r === 0) counts.push(rng.int(2, 3));
        else counts.push(rng.int(2, 4));
      }

      // 2) узлы
      const rows = [];
      let idc = 0;
      for (let r = 0; r < ROWS; r++) {
        const row = [];
        for (let c = 0; c < counts[r]; c++) {
          row.push({
            id: 'n' + act + '_' + (idc++),
            row: r, col: c,
            type: null,
            edges: [],   // id узлов следующего ряда
            x: (c + 1) / (counts[r] + 1) + (rng.next() - 0.5) * 0.06, // 0..1 для отрисовки
            visited: false,
          });
        }
        rows.push(row);
      }

      // 3) связи: каждый узел ряда r ведёт к 1-2 ближайшим узлам ряда r+1;
      //    каждый узел ряда r+1 обязан иметь вход
      for (let r = 0; r < ROWS - 1; r++) {
        const cur = rows[r], next = rows[r + 1];
        for (const node of cur) {
          const t = node.col / Math.max(1, cur.length - 1 || 1);
          const nearest = Math.round(t * (next.length - 1)) || 0;
          node.edges.push(next[Math.min(nearest, next.length - 1)].id);
          if (next.length > 1 && rng.chance(0.42)) {
            const alt = Math.min(next.length - 1, Math.max(0, nearest + (rng.chance(0.5) ? 1 : -1)));
            if (next[alt].id !== node.edges[0]) node.edges.push(next[alt].id);
          }
        }
        for (const nn of next) {
          if (!cur.some(c => c.edges.includes(nn.id))) {
            // ближайший узел текущего ряда получает дополнительное ребро
            let best = cur[0], bd = Infinity;
            for (const c of cur) {
              const d = Math.abs(c.x - nn.x);
              if (d < bd) { bd = d; best = c; }
            }
            best.edges.push(nn.id);
          }
        }
      }

      // 4) типы
      for (let r = 0; r < ROWS; r++) {
        for (const node of rows[r]) {
          if (r === ROWS - 1) node.type = 'boss';
          else if (r === ROWS - 2) node.type = 'rest';
          else if (r === 7) node.type = 'treasure';
          else if (r === 0) node.type = 'monster';
          else node.type = pickType(r, rng);
        }
        // не допускаем ряд целиком из отдыха/магазинов
        if (r > 0 && r < ROWS - 2 && r !== 7 && rows[r].every(n => n.type === 'rest' || n.type === 'shop')) {
          rows[r][rng.int(0, rows[r].length - 1)].type = 'monster';
        }
      }

      const nodes = {};
      for (const row of rows) for (const n of row) nodes[n.id] = n;
      return { act, rows: rows.map(row => row.map(n => n.id)), nodes };
    },
  };

  function pickType(row, rng) {
    const table = [
      ['monster', 0.44],
      ['event', 0.22],
      ['elite', row >= 4 ? 0.16 : 0],
      ['rest', row >= 4 ? 0.10 : 0],
      ['shop', row >= 2 ? 0.08 : 0],
    ];
    let total = 0;
    for (const [, w] of table) total += w;
    let x = rng.next() * total;
    for (const [t, w] of table) {
      x -= w;
      if (x <= 0) return t;
    }
    return 'monster';
  }

  GAME.MapGen = MapGen;
})();
