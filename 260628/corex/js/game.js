/* ============================================================
   game.js — 게임 상태/규칙 엔진
   ──────────────────────────────────────────────────────────────
   ⚠ 보드/이동 관련 로직은 Q1~Q3 답변 후 본격 추가 예정.
     현재 구현된 부분:
       · 캐릭터 / 진영 정의
       · 라운드 시작 +15G
       · To-do 정의 (PDF 확정본)
       · 100G 달성 시 최종 승리 판정
       · 라운드 종료 시 G만 유지 / 나머지 리셋
       · 조커 매 라운드 랜덤 지급 + 다음 라운드 소멸
   ============================================================ */
(() => {
  'use strict';

  // ============================================================
  // 정적 정의 (FACTIONS / TODO / 아이템)
  // ============================================================

  const FACTIONS = {
    ruins:     { key: 'ruins',     color: '#ff0000', char: 'toriel',   charName: 'Toriel'   },
    snowdin:   { key: 'snowdin',   color: '#0099ff', char: 'papyrus',  charName: 'Papyrus'  },
    waterfall: { key: 'waterfall', color: '#15ff00', char: 'undyne',   charName: 'Undyne'   },
    hotland:   { key: 'hotland',   color: '#fbff00', char: 'mettaton', charName: 'Mettaton' },
  };

  // To-do 정의 (확정본)
  // 각 항목 완료 시 +5G. 모든 항목 완료 시 라운드 종료.
  const TODOS = {
    ruins: [
      { id: 'r-final-froggit-2', label: 'Final Froggit 2마리 확보' },
      { id: 'r-whimsalot-2',     label: 'Whimsalot 2마리 확보' },
      { id: 'r-napstablook',     label: 'Napstablook 데려오기 (-10G)' },
    ],
    snowdin: [
      { id: 's-greater-dog-3',   label: 'Greater Dog 3마리 확보' },
      { id: 's-sans',            label: 'Sans 데려오기 (-5G)' },
      { id: 's-flowey',          label: 'Flowey 데려오기 (-7G)' },
    ],
    waterfall: [
      { id: 'w-moldbygg-2',      label: 'Moldbygg 2마리 확보' },
      { id: 'w-undying',         label: 'Undyne the Undying 달성' },
      { id: 'w-asgore',          label: 'Asgore 데려오기 (-10G)' },
    ],
    hotland: [
      { id: 'h-mettaton-neo',    label: 'Mettaton NEO 달성' },
      { id: 'h-alphys',          label: 'Alphys 부르기 (NEO+Alphys)' },
      { id: 'h-monster-kid',     label: 'Monster Kid 데려오기 (-10G)' },
    ],
  };

  // 캐릭터 업그레이드 경로 (Pre-Undying 등은 자기 자신)
  // null = 더 이상 업그레이드 불가
  const CHAR_UPGRADE = {
    toriel:   null,
    papyrus:  null,
    undyne:   'pre-undying',
    'pre-undying': 'undyne-the-undying',
    'undyne-the-undying': null,
    mettaton: 'mettaton-ex',
    'mettaton-ex': 'mettaton-neo',
    'mettaton-neo': 'mettaton-neo-alphys',
    'mettaton-neo-alphys': null,
  };

  // 아이템 업그레이드 경로 (Core에서)
  const ITEM_UPGRADE = {
    'Froggit':     'Final Froggit',
    'Whimsun':     'Whimsalot',
    'Lesser Dog':  'Greater Dog',
    'Moldsmal':    'Moldbygg',
  };

  // 특수 아이템 줍기 비용 (자기 진영에서)
  const PICKUP_COST = {
    'Napstablook': { faction: 'ruins',     cost: 10 },
    'Sans':        { faction: 'snowdin',   cost: 5  },
    'Flowey':      { faction: 'snowdin',   cost: 7  },
    'Asgore':      { faction: 'waterfall', cost: 10 },
    'Monster Kid': { faction: 'hotland',   cost: 10 },
  };

  const ROUND_INCOME    = 15;   // 매 라운드 +15G
  const TODO_REWARD     = 5;    // To-do 1개 완료
  const SANS_FLOWEY_BONUS = 2;  // Sans+Flowey 동시 보유 첫 순간
  const WIN_GOLD        = 100;
  const INVENTORY_CAP   = 8;

  // ============================================================
  // 게임 상태
  // ============================================================

  function createPlayer(uid, name, faction) {
    return {
      uid,
      name,
      faction,
      character: FACTIONS[faction].char,
      gold: 0,
      // 라운드별 리셋 대상 (G만 유지)
      inventory: [],     // [{ key: 'Froggit', upgraded: false }, ...]
      box: [],           // 자기 진영 상자
      position: faction.toUpperCase(), // 보드 노드 id (대문자). 시작은 자기 진영 홈 칸
      todo: TODOS[faction].map((t) => ({ ...t, done: false })),
      upgradedChar: false,   // 라운드 내 업그레이드 단계 진행도 (별도 키로 관리 가능)
      sansFloweyBonusTaken: false,
      pendingUpgradeToken: false,  // Core 도착 직후 다음 행동까지 유효
      hasJoker: false,
      hasMoved: false,
      hasActed: false,
    };
  }

  const State = {
    mode: 'local',          // 'local' | 'online'
    players: [],            // 4명
    currentTurnIdx: 0,
    round: 1,
    phase: 'idle',          // idle | playing | round-end | game-over
    pool: null,             // 보드 위 일반 아이템 풀 (Q3 확정 후 구체화)
    logs: [],

    reset() {
      this.mode = 'local';
      this.players = [];
      this.currentTurnIdx = 0;
      this.round = 1;
      this.phase = 'idle';
      this.pool = null;
      this.logs = [];
    },

    setupPlayers(specs) {
      this.players = specs.map(({ uid, name, faction }) =>
        createPlayer(uid, name, faction)
      );
      // 턴 순서: 랜덤 셔플
      shuffle(this.players);
      this.currentTurnIdx = 0;
      this.phase = 'playing';
      this.round = 1;
      // 1라운드 시작 +15G 전원 지급
      this.players.forEach((p) => (p.gold += ROUND_INCOME));
      // 조커 랜덤 1명
      this._assignJoker();
      // 보드 아이템 초기 배치
      this._respawnBoardItems();
      this.log('Round 1 시작 — 전원 +15G');
    },

    // board_data.json의 nodes[i].items를 boardItems 상태로 복사 (라운드마다 리스폰)
    _respawnBoardItems() {
      this.boardItems = {};   // { nodeId: [{name, type, owner?, cost?}, ...] }
      const data = window.Board && window.Board.getData ? window.Board.getData() : null;
      if (!data) return;
      for (const [nid, node] of Object.entries(data.nodes)) {
        if (node.items && node.items.length) {
          // 깊은 복사
          this.boardItems[nid] = node.items.map((it) => ({ ...it }));
        }
      }
    },

    _assignJoker() {
      this.players.forEach((p) => (p.hasJoker = false));
      const lucky = this.players[Math.floor(Math.random() * this.players.length)];
      lucky.hasJoker = true;
      this.log(`${lucky.name}에게 조커 카드 지급!`);
    },

    currentPlayer() {
      return this.players[this.currentTurnIdx];
    },

    endTurn() {
      const cur = this.currentPlayer();
      cur.hasMoved = false;
      cur.hasActed = false;
      cur.pendingUpgradeToken = false;  // 사용 안 한 업그레이드권 소멸
      this.currentTurnIdx = (this.currentTurnIdx + 1) % this.players.length;
    },

    // ─── To-do / 점수 계산 ────────────────────────────────────
    checkTodos(player) {
      const inv = player.inventory;
      const invCount = (key) => inv.filter((i) => i.key === key).length;

      for (const t of player.todo) {
        if (t.done) continue;
        let ok = false;
        switch (t.id) {
          case 'r-final-froggit-2':  ok = invCount('Final Froggit') >= 2; break;
          case 'r-whimsalot-2':      ok = invCount('Whimsalot') >= 2; break;
          case 'r-napstablook':      ok = invCount('Napstablook') >= 1; break;
          case 's-greater-dog-3':    ok = invCount('Greater Dog') >= 3; break;
          case 's-sans':             ok = invCount('Sans') >= 1; break;
          case 's-flowey':           ok = invCount('Flowey') >= 1; break;
          case 'w-moldbygg-2':       ok = invCount('Moldbygg') >= 2; break;
          case 'w-undying':          ok = player.character === 'undyne-the-undying'; break;
          case 'w-asgore':           ok = invCount('Asgore') >= 1; break;
          case 'h-mettaton-neo':     ok = ['mettaton-neo', 'mettaton-neo-alphys'].includes(player.character); break;
          case 'h-alphys':           ok = player.character === 'mettaton-neo-alphys'; break;
          case 'h-monster-kid':      ok = invCount('Monster Kid') >= 1; break;
        }
        if (ok) {
          t.done = true;
          player.gold += TODO_REWARD;
          this.log(`${player.name}: To-do "${t.label}" 완료! +${TODO_REWARD}G`);
        }
      }

      // Snowdin Sans+Flowey 동시 첫 순간 보너스
      if (player.faction === 'snowdin' && !player.sansFloweyBonusTaken) {
        if (invCount('Sans') >= 1 && invCount('Flowey') >= 1) {
          player.gold += SANS_FLOWEY_BONUS;
          player.sansFloweyBonusTaken = true;
          this.log(`${player.name}: Sans + Flowey 동시 보유 보너스 +${SANS_FLOWEY_BONUS}G`);
        }
      }

      // 라운드 종료 체크: 모든 To-do 완료
      if (player.todo.every((t) => t.done)) {
        this.endRound(player);
      }
    },

    // ─── 라운드 종료 ─────────────────────────────────────────
    endRound(winner) {
      this.log(`★ Round ${this.round} 종료 — ${winner.name} 우승!`);

      // 최종 승리 체크 (100G)
      const champ = this.players.find((p) => p.gold >= WIN_GOLD);
      if (champ) {
        this.phase = 'game-over';
        this.log(`★★ 최종 승자: ${champ.name} (${champ.gold}G) ★★`);
        return { ended: true, winner: champ };
      }

      // 다음 라운드: G만 유지하고 나머지 리셋
      this.round += 1;
      this.players.forEach((p) => {
        p.inventory = [];
        p.box = [];
        p.position = p.faction.toUpperCase();
        p.todo = TODOS[p.faction].map((t) => ({ ...t, done: false }));
        p.character = FACTIONS[p.faction].char;  // 캐릭터 업그레이드 리셋
        p.sansFloweyBonusTaken = false;
        p.pendingUpgradeToken = false;
        p.hasMoved = false;
        p.hasActed = false;
        p.gold += ROUND_INCOME;     // 매 라운드 시작 +15G
      });
      this._assignJoker();  // 조커 재배정 (이전 라운드 조커는 자동 소멸)
      this._respawnBoardItems();  // 보드 아이템 리스폰
      this.currentTurnIdx = 0;
      this.log(`Round ${this.round} 시작 — 전원 +15G`);
      return { ended: false };
    },

    log(msg) {
      const entry = { ts: Date.now(), msg };
      this.logs.push(entry);
      if (this.logs.length > 200) this.logs.shift();
    },

    // ─── 아이템: 칸에 있는 아이템 조회 ─────────────────────
    itemsAt(nodeId) {
      return this.boardItems && this.boardItems[nodeId] || [];
    },

    // ─── 줍기: 현재 플레이어가 이 칸에서 주울 수 있는 아이템 ──
    pickableHere(player) {
      const items = this.itemsAt(player.position);
      const data = window.Board.getData();
      const rights = (data.characterPickupRights || {})[player.character] || { regular: [], special: [] };
      const allowedReg = new Set(rights.regular || []);
      const allowedSp  = new Set(rights.special || []);
      return items.filter((it) => {
        if (it.type === 'regular') return allowedReg.has(it.name);
        if (it.type === 'special') return allowedSp.has(it.name);
        return false;
      });
    },

    // ─── 줍기 실행 ────────────────────────────────────────
    pickup(player, itemIndex) {
      const items = this.itemsAt(player.position);
      const target = items[itemIndex];
      if (!target) return { ok: false, reason: 'no-item' };
      if (player.inventory.length >= INVENTORY_CAP) return { ok: false, reason: 'inv-full' };

      // 권한 체크
      const data = window.Board.getData();
      const rights = (data.characterPickupRights || {})[player.character] || { regular: [], special: [] };
      const allowed = (target.type === 'regular' ? rights.regular : rights.special) || [];
      if (!allowed.includes(target.name)) return { ok: false, reason: 'not-allowed' };

      // 비용
      let cost = 0;
      if (target.type === 'special') {
        cost = target.cost || 0;
        if (player.gold < cost) return { ok: false, reason: 'no-gold' };
        player.gold -= cost;
      }

      // 아이템 이동
      player.inventory.push({ key: target.name, upgraded: false });
      this.boardItems[player.position].splice(itemIndex, 1);

      player.hasActed = true;
      this.log(`${player.name}이(가) ${target.name} 줍기${cost > 0 ? ` (-${cost}G)` : ''}`);
      this.checkTodos(player);
      return { ok: true, item: target, cost };
    },

    // ─── 업그레이드: 현재 가능한 옵션 목록 ─────────────────
    upgradeOptions(player) {
      const opts = [];
      // 캐릭터 다음 단계 (있을 때만)
      const nextChar = CHAR_UPGRADE[player.character];
      if (nextChar) {
        // Mettaton-NEO → NEO+Alphys 는 "Alphys 부르기"로 표기
        const label = (player.character === 'mettaton-neo')
          ? { ko: 'Alphys 부르기', en: 'Call Alphys' }
          : { ko: `캐릭터 → ${nextChar}`, en: `Character → ${nextChar}` };
        opts.push({ kind: 'char', value: nextChar, label });
      }
      // 인벤토리 중 업그레이드 가능한 아이템 (각각 한 번씩 옵션)
      player.inventory.forEach((inv, idx) => {
        const next = ITEM_UPGRADE[inv.key];
        if (next) {
          opts.push({
            kind: 'item',
            value: next,
            invIndex: idx,
            label: { ko: `${inv.key} → ${next}`, en: `${inv.key} → ${next}` },
          });
        }
      });
      return opts;
    },

    // ─── 업그레이드 실행 ──────────────────────────────────
    applyUpgrade(player, choice) {
      if (!player.pendingUpgradeToken) return { ok: false, reason: 'no-token' };

      if (choice.kind === 'char') {
        player.character = choice.value;
        this.log(`${player.name}: 캐릭터 → ${choice.value}`);
      } else if (choice.kind === 'item') {
        const inv = player.inventory[choice.invIndex];
        if (!inv) return { ok: false, reason: 'no-item' };
        inv.key = choice.value;
        inv.upgraded = true;
        this.log(`${player.name}: ${choice.value}로 아이템 업그레이드`);
      }
      player.pendingUpgradeToken = false;
      this.checkTodos(player);
      return { ok: true };
    },

    // ─── 상자 교체 (인벤토리 ↔ 상자) ─────────────────────
    // 액션 자체는 1턴 소모, 안에서 swap은 여러 번 가능
    swapBox(player, from, fromIdx, to, toIdx) {
      // from/to: 'inv' | 'box'
      const fromArr = from === 'inv' ? player.inventory : player.box;
      const toArr   = to === 'inv'   ? player.inventory : player.box;
      if (fromIdx < 0 || fromIdx >= fromArr.length) return false;
      const item = fromArr[fromIdx];

      if (toIdx == null || toIdx >= toArr.length) {
        // 그냥 추가
        if (toArr.length >= INVENTORY_CAP) return false;
        fromArr.splice(fromIdx, 1);
        toArr.push(item);
      } else {
        // 자리 교환 (swap)
        const otherItem = toArr[toIdx];
        toArr[toIdx] = item;
        if (otherItem) fromArr[fromIdx] = otherItem;
        else fromArr.splice(fromIdx, 1);
      }
      return true;
    },
  };

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // ============================================================
  // 외부 노출
  // ============================================================
  window.Game = {
    State,
    FACTIONS,
    TODOS,
    CHAR_UPGRADE,
    ITEM_UPGRADE,
    PICKUP_COST,
    ROUND_INCOME,
    WIN_GOLD,
    INVENTORY_CAP,
  };
})();
