/* ============================================================
   main.js — 진입점, 화면 전환, 배경 별 애니메이션
   ============================================================ */
(() => {
  'use strict';

  // ─── 화면 전환 ────────────────────────────────────────────
  const screens = ['title', 'mode-select', 'online-entry', 'lobby', 'char-select', 'game', 'result'];
  function show(name) {
    screens.forEach((s) => {
      document.getElementById('screen-' + s)?.classList.toggle('active', s === name);
    });
    if (name === 'game') {
      // 인게임 화면이 grid 레이아웃을 잡고 board-wrap의 크기가 확정된 뒤에 캔버스 리사이즈.
      // 한 프레임으로 부족할 수 있으니 짧은 지연 추가.
      requestAnimationFrame(() => {
        Board.resize?.();
        setTimeout(() => Board.resize?.(), 50);
      });
    }
  }

  // ─── 별 배경 ───────────────────────────────────────────────
  function initStarfield() {
    const canvas = document.getElementById('bg-stars');
    const ctx = canvas.getContext('2d');
    let stars = [];
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.floor((canvas.width * canvas.height) / 6000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random(),
        speed: Math.random() * 0.015 + 0.005,
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of stars) {
        s.a += s.speed;
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(s.a));
        ctx.fillStyle = `rgba(232, 127, 212, ${alpha})`;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.r, s.r);
        // 일부는 흰색
        if (Math.random() < 0.0005) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(s.x, s.y, 2, 2);
        }
      }
      requestAnimationFrame(tick);
    }
    resize();
    window.addEventListener('resize', resize);
    tick();
  }

  // ─── 모달 ──────────────────────────────────────────────────
  function showModal({ title, body, buttons }) {
    const bd = document.getElementById('modal-backdrop');
    document.getElementById('modal-title').textContent = title || '';
    document.getElementById('modal-body').innerHTML = body || '';
    const btnBox = document.getElementById('modal-buttons');
    btnBox.innerHTML = '';
    (buttons || [{ label: 'OK' }]).forEach((b) => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.class || 'btn-primary');
      el.textContent = b.label;
      el.onclick = () => {
        bd.hidden = true;
        if (b.onClick) b.onClick();
      };
      btnBox.appendChild(el);
    });
    bd.hidden = false;
  }
  function hideModal() { document.getElementById('modal-backdrop').hidden = true; }

  // ─── 토스트 ────────────────────────────────────────────────
  function toast(msg, kind = '') {
    const box = document.getElementById('log-toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ─── 캐릭터 카드 렌더링 ────────────────────────────────────
  const CHAR_SPEC = [
    { faction: 'ruins',     char: 'toriel',   name: 'TORIEL' },
    { faction: 'snowdin',   char: 'papyrus',  name: 'PAPYRUS' },
    { faction: 'waterfall', char: 'undyne',   name: 'UNDYNE' },
    { faction: 'hotland',   char: 'mettaton', name: 'METTATON' },
  ];

  let selectedFaction = null;      // 온라인 모드: 본인이 고른 진영
  let takenFactions = new Set();    // 온라인 모드: 다른 사람이 이미 고른 진영
  // 로컬 모드: 4진영 각각의 닉네임 (key=faction, value=name string)
  let localNicknames = { ruins: '', snowdin: '', waterfall: '', hotland: '' };

  function renderCharGrid() {
    const grid = document.getElementById('char-grid');
    const msg = document.getElementById('char-msg');   // 있으면 사용
    const btn = document.getElementById('btn-start-game');
    if (!grid) return;
    grid.innerHTML = '';
    const isLocal = Game.State.mode === 'local';

    CHAR_SPEC.forEach((c) => {
      const card = document.createElement('div');   // local에선 input 들어가니 button → div
      card.className = 'char-card';
      card.dataset.faction = c.faction;

      // ONLINE 모드 표시: 다른 사람이 가져갔는지 / 본인 선택
      if (!isLocal) {
        if (takenFactions.has(c.faction)) card.classList.add('taken');
        if (selectedFaction === c.faction) card.classList.add('selected');
      }

      const port = document.createElement('div');
      port.className = 'char-portrait';
      const sprite = Sprites.drawCharacter(c.char);
      sprite.style.width = '100%';
      sprite.style.height = '100%';
      port.appendChild(sprite);
      card.appendChild(port);

      const name = document.createElement('div');
      name.className = 'char-name';
      name.textContent = c.name;
      card.appendChild(name);

      const fac = document.createElement('div');
      fac.className = 'char-faction';
      fac.textContent = c.faction.toUpperCase();
      card.appendChild(fac);

      if (isLocal) {
        // LOCAL: 각 카드에 닉네임 입력칸 추가 (4명 동시 입력)
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'form-input char-nick-input';
        input.maxLength = 10;
        input.placeholder = c.name;
        input.value = localNicknames[c.faction] || '';
        input.addEventListener('input', () => {
          localNicknames[c.faction] = input.value.trim();
          updateLocalStartButton();
        });
        card.appendChild(input);
      } else {
        // ONLINE: 클릭으로 진영 선택
        card.style.cursor = 'pointer';
        card.onclick = () => {
          if (card.classList.contains('taken')) return;
          selectedFaction = c.faction;
          renderCharGrid();
          btn.disabled = false;
        };
      }
      grid.appendChild(card);
    });

    if (isLocal) {
      if (msg) msg.textContent = '4명 각자의 닉네임을 입력하세요 (비워두면 기본 이름 사용)';
      updateLocalStartButton();
    } else {
      if (msg) msg.textContent = '진영을 선택하세요';
    }
  }

  function updateLocalStartButton() {
    // 로컬은 닉네임이 비어도 기본값으로 시작 가능 → 항상 활성
    document.getElementById('btn-start-game').disabled = false;
  }

  // ─── 인게임 HUD 렌더링 ────────────────────────────────────
  function renderHUD() {
    const cur = Game.State.currentPlayer();
    if (!cur) return;

    // 인벤토리
    const inv = document.getElementById('inv-slots');
    inv.innerHTML = '';
    for (let i = 0; i < Game.INVENTORY_CAP; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot' + (cur.inventory[i] ? ' filled' : '');
      slot.textContent = cur.inventory[i] ? cur.inventory[i].key.slice(0, 4) : '';
      inv.appendChild(slot);
    }
    // 상자
    const box = document.getElementById('box-slots');
    box.innerHTML = '';
    for (let i = 0; i < Game.INVENTORY_CAP; i++) {
      const slot = document.createElement('div');
      slot.className = 'inv-slot' + (cur.box[i] ? ' filled' : '');
      slot.textContent = cur.box[i] ? cur.box[i].key.slice(0, 4) : '';
      box.appendChild(slot);
    }

    // 플레이어 정보
    const info = document.getElementById('player-info');
    const faction = Game.FACTIONS[cur.faction];
    info.innerHTML = `
      <div class="pname">${escape(cur.name)}</div>
      <div class="pfaction" style="color:${faction.color}">${cur.faction.toUpperCase()}</div>
    `;
    const port = document.createElement('div');
    port.style.width = '60px';
    port.style.height = '60px';
    port.style.margin = '8px auto';
    port.appendChild(Sprites.drawCharacter(cur.character.startsWith('mettaton') ? 'mettaton' : cur.character.includes('undy') ? 'undyne' : cur.character));
    info.appendChild(port);

    // To-do
    const todoUl = document.getElementById('todo-list');
    todoUl.innerHTML = '';
    cur.todo.forEach((t) => {
      const li = document.createElement('li');
      li.className = t.done ? 'done' : '';
      li.textContent = t.label;
      todoUl.appendChild(li);
    });

    // 골드
    document.getElementById('gold-display').innerHTML = `${cur.gold}<span class="gold-unit">G</span>`;

    // 스코어보드
    const sb = document.getElementById('players-scoreboard');
    sb.innerHTML = '';
    Game.State.players.forEach((p, idx) => {
      const row = document.createElement('div');
      row.className = 'ps-row' + (idx === Game.State.currentTurnIdx ? ' current' : '');
      row.style.setProperty('--fc', Game.FACTIONS[p.faction].color);
      row.innerHTML = `<span class="ps-name">${escape(p.name)}</span><span class="ps-gold">${p.gold}G</span>`;
      sb.appendChild(row);
    });

    // 현재 차례
    document.getElementById('turn-player').textContent = cur.name;
    document.getElementById('round-num').textContent = Game.State.round;

    // 조커 버튼
    document.getElementById('act-joker').disabled = !cur.hasJoker;
    // 이동: 아직 이번 턴 행동 안 했을 때만
    const canAct = !cur.hasActed;
    document.getElementById('act-move').disabled = !canAct;
    // 줍기/업그레이드/교체는 다음 단계(아이템 시스템)에서 활성화
    ['act-pickup', 'act-upgrade', 'act-replace'].forEach((id) => {
      document.getElementById(id).disabled = true;
    });
    document.getElementById('act-end-turn').disabled = false;
  }

  function escape(s) {
    return String(s).replace(/[<>&"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
  }

  // ─── 게임 시작 (로컬) ──────────────────────────────────────
  function startLocalGame() {
    // 로컬 핫시트: 4명 각자 닉네임 + 캐릭터 동시 선택 (캐릭터 선택 화면에서 입력받음)
    Game.State.reset();
    Game.State.mode = 'local';
    const specs = CHAR_SPEC.map((c, i) => {
      const nick = (localNicknames[c.faction] || '').trim();
      return {
        uid: 'local_' + i,
        name: nick || c.name,   // 비어있으면 캐릭터 이름(TORIEL 등)을 기본값으로
        faction: c.faction,
      };
    });
    Game.State.setupPlayers(specs);
    show('game');
    syncBoardTokens();
    const ov = document.getElementById('board-overlay');
    if (ov) ov.style.display = 'none';
    renderHUD();
    toast('LOCAL 모드 — Round 1 시작', 'gold');
  }

  // 모든 플레이어 말을 보드에 배치
  function syncBoardTokens() {
    const map = {};
    Game.State.players.forEach((p) => {
      map[p.faction.toUpperCase()] = p.position;
    });
    Board.setTokens(map);
  }

  // ─── 이동 모드 ────────────────────────────────────────────
  let moveMode = false;
  function enterMoveMode() {
    const cur = Game.State.currentPlayer();
    if (cur.hasMoved || cur.hasActed) {
      toast('이번 턴엔 이미 행동했어요', 'warn');
      return;
    }
    const movable = Board.getMovableCells(cur.position);
    if (movable.length === 0) { toast('갈 수 있는 칸이 없어요', 'warn'); return; }
    moveMode = true;
    Board.setHighlight(movable);
    toast('이동할 칸을 클릭하세요 (노란 테두리)');
  }
  function exitMoveMode() {
    moveMode = false;
    Board.clearHighlight();
  }
  function handleBoardClick(cellId) {
    if (!moveMode) return;
    const cur = Game.State.currentPlayer();
    const movable = Board.getMovableCells(cur.position);
    if (!movable.includes(cellId)) {
      toast('인접한 칸만 이동 가능해요', 'warn');
      return;
    }
    cur.position = cellId;
    cur.hasMoved = true;
    cur.hasActed = true;   // 이동 = 그 턴의 행동 소모 (이동 OR 줍기)
    Board.moveToken(cur.faction.toUpperCase(), cellId);
    exitMoveMode();
    const node = Board.getNode(cellId);
    const where = node.isCore ? 'CORE' : (node.isFaction ? cellId : cellId + '번 칸');
    toast(`${cur.name} → ${where} 이동`);
    if (node.isCore) {
      cur.pendingUpgradeToken = true;
      toast('Core 도착! 업그레이드권 1장 (이번에 안 쓰면 소멸)', 'gold');
    }
    renderHUD();
  }

  // ─── 이벤트 와이어링 ──────────────────────────────────────
  function wireEvents() {
    // data-goto 네비게이션
    document.querySelectorAll('[data-goto]').forEach((el) => {
      el.addEventListener('click', () => show(el.dataset.goto));
    });

    // 모드 카드
    document.querySelectorAll('.mode-card').forEach((el) => {
      el.addEventListener('click', () => {
        const mode = el.dataset.mode;
        if (mode === 'online') {
          if (!Online.isConfigured()) {
            showModal({
              title: '⚠ Firebase 미설정',
              body: '<p style="font-family:var(--f-pixel);font-size:11px;color:var(--c-gold);line-height:1.7">온라인 플레이를 사용하려면<br/><code style="color:var(--c-accent)">js/online.js</code> 상단의<br/><code style="color:var(--c-accent)">FIREBASE_CONFIG</code>를 채워야 합니다.</p><p style="margin-top:12px;font-size:12px;color:var(--c-text-dim)">자세한 안내는 README.md 참고.</p>',
              buttons: [
                { label: '로컬로 시작', class: 'btn-secondary', onClick: () => { show('char-select'); Game.State.mode = 'local'; renderCharGrid(); } },
                { label: 'OK', class: 'btn-ghost' },
              ],
            });
            return;
          }
          show('online-entry');
        } else {
          Game.State.mode = 'local';
          show('char-select');
          selectedFaction = null;
          takenFactions = new Set();
          localNicknames = { ruins: '', snowdin: '', waterfall: '', hotland: '' };
          renderCharGrid();
        }
      });
    });

    // 온라인 — 방 생성
    document.getElementById('btn-create-room').addEventListener('click', async () => {
      const name = document.getElementById('online-name').value.trim() || 'Frisk';
      try {
        const { roomCode } = await Online.createRoom(name);
        document.getElementById('lobby-code-display').textContent = roomCode;
        show('lobby');
        wireLobby();
      } catch (e) {
        document.getElementById('online-msg').textContent = e.message;
      }
    });

    // 온라인 — 방 참가
    document.getElementById('btn-join-room').addEventListener('click', async () => {
      const name = document.getElementById('online-name').value.trim() || 'Frisk';
      const code = document.getElementById('online-code').value.trim().toUpperCase();
      if (code.length !== 4) {
        document.getElementById('online-msg').textContent = '4자리 코드를 입력하세요';
        return;
      }
      try {
        await Online.joinRoom(code, name);
        document.getElementById('lobby-code-display').textContent = code;
        show('lobby');
        wireLobby();
      } catch (e) {
        document.getElementById('online-msg').textContent = e.message;
      }
    });

    document.getElementById('btn-leave-lobby').addEventListener('click', async () => {
      await Online.leaveRoom().catch(() => {});
      show('mode-select');
    });

    // 캐릭터 선택 시작 버튼
    document.getElementById('btn-start-game').addEventListener('click', () => {
      if (Game.State.mode === 'local') {
        startLocalGame();
      } else {
        // 온라인 모드: 본인이 진영을 골랐어야 함
        if (!selectedFaction) return;
        // 온라인 게임 시작 로직 (다른 플레이어가 다 고르면 자동 시작 — 현재는 보류)
        toast('온라인 게임 시작 — Firebase 동기화 후 자동 진행', 'gold');
      }
    });

    // 이동
    document.getElementById('act-move').addEventListener('click', () => {
      if (moveMode) { exitMoveMode(); toast('이동 취소'); }
      else enterMoveMode();
    });

    // 턴 종료
    document.getElementById('act-end-turn').addEventListener('click', () => {
      exitMoveMode();
      const endingPlayer = Game.State.currentPlayer();
      // To-do 달성 여부 체크 (라운드 종료/최종 승리 트리거 가능)
      const before = Game.State.round;
      Game.State.checkTodos(endingPlayer);
      if (Game.State.phase === 'game-over') {
        showResult();
        return;
      }
      // 라운드가 넘어갔으면 보드 토큰 전부 홈으로 리셋
      if (Game.State.round !== before) {
        syncBoardTokens();
        toast(`Round ${Game.State.round} 시작 — 전원 +15G / 보드 초기화`, 'gold');
      } else {
        Game.State.endTurn();
      }
      renderHUD();
      syncBoardTokens();
      toast(`다음 차례: ${Game.State.currentPlayer().name}`);
    });

    // 조커 (임시)
    document.getElementById('act-joker').addEventListener('click', () => {
      showModal({
        title: 'JOKER',
        body: '<p style="font-size:12px">셋 중 하나 선택:</p>',
        buttons: [
          { label: '① Core 즉시 이동', onClick: () => useJoker(1) },
          { label: '② 아이템 강탈', class: 'btn-secondary', onClick: () => useJoker(2) },
          { label: '③ 더블 턴', class: 'btn-secondary', onClick: () => useJoker(3) },
          { label: '취소', class: 'btn-ghost' },
        ],
      });
    });
  }

  function useJoker(choice) {
    const cur = Game.State.currentPlayer();
    cur.hasJoker = false;
    switch (choice) {
      case 1:
        cur.position = 'CORE';
        cur.pendingUpgradeToken = true;
        Board.moveToken(cur.faction.toUpperCase(), 'CORE');
        // 조커 ①은 이동 행위가 아니므로 hasActed 건드리지 않음 (조커는 행위로 인정 X)
        toast('조커 ① — Core로 즉시 이동', 'gold');
        break;
      case 2:
        toast('조커 ② — 강탈 (아이템 시스템 후 구현)', 'warn');
        break;
      case 3:
        // 더블 턴: 이번 턴 행동 플래그 리셋
        cur.hasMoved = false;
        cur.hasActed = false;
        toast('조커 ③ — 더블 턴! 한 번 더 행동하세요', 'gold');
        break;
    }
    renderHUD();
  }

  // ─── 로비 ──────────────────────────────────────────────────
  function wireLobby() {
    Online.onRoomChange((data) => {
      if (!data) return;
      const players = data.players ? Object.entries(data.players) : [];
      const list = document.getElementById('lobby-players');
      list.innerHTML = '';
      for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.className = 'lobby-player' + (players[i] ? ' filled' : '');
        if (players[i]) {
          const [uid, p] = players[i];
          slot.innerHTML = `<div class="name">${escape(p.name)}</div>`;
        } else {
          slot.innerHTML = '<div class="waiting">대기 중...</div>';
        }
        list.appendChild(slot);
      }
      if (players.length === 4) {
        document.getElementById('lobby-msg').textContent = '4명 모임! 캐릭터 선택으로 이동...';
        setTimeout(() => {
          show('char-select');
          // 온라인 모드: 캐릭터 선택 시 takenFactions를 다른 플레이어가 고른 것으로 채워야 함 (후속 작업)
          selectedFaction = null;
          takenFactions = new Set();
          renderCharGrid();
        }, 1200);
      }
    });
  }

  // ─── 결과 ──────────────────────────────────────────────────
  function showResult() {
    const sorted = [...Game.State.players].sort((a, b) => b.gold - a.gold);
    const champ = sorted[0];
    document.getElementById('result-title').textContent = `${champ.name}  VICTORY!`;
    const lb = document.getElementById('leaderboard');
    lb.innerHTML = '';
    sorted.forEach((p, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${idx + 1}. ${escape(p.name)}</span><span>${p.gold}G</span>`;
      lb.appendChild(li);
    });
    show('result');
  }

  // ─── 부트스트랩 ────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    initStarfield();
    Board.init(document.getElementById('board-canvas'), handleBoardClick);
    wireEvents();
    show('title');
    // 스프라이트가 다 로드되면 보이는 화면들 재렌더 (캐릭터 선택 카드 등)
    Sprites.onLoaded(() => {
      const charScreen = document.getElementById('screen-char-select');
      if (charScreen && charScreen.classList.contains('active')) renderCharGrid();
      // HUD 캐릭터 초상화도 다시
      if (Game.State.players.length > 0) renderHUD();
    });
  });
})();
