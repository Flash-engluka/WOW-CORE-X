/* ============================================================
   online.js — Firebase Realtime Database 연동
   ──────────────────────────────────────────────────────────────
   ⚠ FIREBASE_CONFIG 부분은 placeholder. 사용 전 직접 채워야 함.
     (사용자에게 별도 안내 메시지 예정)
   ============================================================ */
(() => {
  'use strict';

  // ===========================================================
  // ⚠️ TODO: 아래 객체에 본인 Firebase 프로젝트 설정을 채우세요.
  //   Firebase Console → 프로젝트 설정 → 일반 → "내 앱"에서 복사
  // ===========================================================
  const FIREBASE_CONFIG = {
    apiKey:            'YOUR_API_KEY',
    authDomain:        'YOUR_PROJECT.firebaseapp.com',
    databaseURL:       'https://YOUR_PROJECT-default-rtdb.firebaseio.com',
    projectId:         'YOUR_PROJECT',
    storageBucket:     'YOUR_PROJECT.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId:             'YOUR_APP_ID',
  };

  let db = null;
  let initialized = false;
  let currentRoomRef = null;
  let currentRoomCode = null;
  let myUid = null;
  let listeners = [];     // 외부 등록 콜백: (snapshot) => void

  /** Firebase 초기화 시도. config가 placeholder이면 false 반환. */
  function init() {
    if (initialized) return true;
    if (FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
      console.warn('[online] Firebase config가 비어있습니다. online.js 상단 FIREBASE_CONFIG를 채우세요.');
      return false;
    }
    if (typeof firebase === 'undefined' || !firebase) {
      console.warn('[online] Firebase SDK가 로드되지 않았습니다.');
      return false;
    }
    try {
      firebase.initializeApp(FIREBASE_CONFIG);
      // eslint-disable-next-line no-undef
      db = firebase.database();
      myUid = generateUid();
      initialized = true;
      return true;
    } catch (e) {
      console.error('[online] Firebase init failed:', e);
      return false;
    }
  }

  function isConfigured() {
    return FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY';
  }

  function generateUid() {
    return 'u_' + Math.random().toString(36).slice(2, 10);
  }

  function generateRoomCode() {
    // 4글자 영숫자 (대문자)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  /**
   * 방 생성. nickname을 받아 새 룸 코드와 함께 DB에 기록.
   * @returns {Promise<{roomCode, uid}>}
   */
  async function createRoom(nickname) {
    if (!init()) throw new Error('Firebase not configured');

    let code;
    let attempts = 0;
    // 충돌 회피
    while (attempts < 10) {
      code = generateRoomCode();
      const snap = await db.ref('rooms/' + code).get();
      if (!snap.exists()) break;
      attempts++;
    }
    if (attempts >= 10) throw new Error('방 코드 생성 실패');

    const roomData = {
      host: myUid,
      createdAt: Date.now(),
      players: {
        [myUid]: {
          name: nickname || 'Player1',
          character: null,
          ready: false,
          joinedAt: Date.now(),
        },
      },
      gameState: {
        phase: 'waiting',   // waiting | char-select | playing | ended
        currentTurn: 0,
        round: 1,
        logs: [],
      },
    };
    await db.ref('rooms/' + code).set(roomData);
    currentRoomCode = code;
    currentRoomRef = db.ref('rooms/' + code);
    _attachListener();
    return { roomCode: code, uid: myUid };
  }

  /**
   * 방 참가. 방 코드가 존재하고 4명 이하일 때만 가능.
   */
  async function joinRoom(roomCode, nickname) {
    if (!init()) throw new Error('Firebase not configured');
    const code = (roomCode || '').toUpperCase();
    const ref = db.ref('rooms/' + code);
    const snap = await ref.get();
    if (!snap.exists()) throw new Error('존재하지 않는 방입니다');

    const data = snap.val();
    const players = data.players || {};
    if (Object.keys(players).length >= 4) throw new Error('방이 가득 찼습니다');
    if (data.gameState && data.gameState.phase !== 'waiting') throw new Error('이미 게임이 시작되었습니다');

    await ref.child('players/' + myUid).set({
      name: nickname || 'Player',
      character: null,
      ready: false,
      joinedAt: Date.now(),
    });
    currentRoomCode = code;
    currentRoomRef = ref;
    _attachListener();
    return { roomCode: code, uid: myUid };
  }

  async function leaveRoom() {
    if (currentRoomRef) {
      await currentRoomRef.child('players/' + myUid).remove();
      // 호스트가 떠나면 방 자체 정리 (간단 정책)
      const snap = await currentRoomRef.child('players').get();
      if (!snap.exists()) {
        await currentRoomRef.remove();
      }
      _detachListener();
      currentRoomRef = null;
      currentRoomCode = null;
    }
  }

  function _attachListener() {
    if (!currentRoomRef) return;
    currentRoomRef.on('value', (snap) => {
      const data = snap.val();
      listeners.forEach((cb) => {
        try { cb(data); } catch (e) { console.error('[online] listener error:', e); }
      });
    });
  }
  function _detachListener() {
    if (!currentRoomRef) return;
    currentRoomRef.off();
  }

  /** 룸 데이터 변경 감지 콜백 등록. */
  function onRoomChange(cb) {
    listeners.push(cb);
    return () => {
      listeners = listeners.filter((f) => f !== cb);
    };
  }

  /** 부분 업데이트 (예: 캐릭터 선택, ready 토글) */
  async function updateMyState(patch) {
    if (!currentRoomRef) return;
    await currentRoomRef.child('players/' + myUid).update(patch);
  }

  async function updateGameState(patch) {
    if (!currentRoomRef) return;
    await currentRoomRef.child('gameState').update(patch);
  }

  async function pushLog(entry) {
    if (!currentRoomRef) return;
    await currentRoomRef.child('gameState/logs').push({
      ...entry,
      ts: Date.now(),
    });
  }

  // 페이지 닫기 시 자동 정리
  window.addEventListener('beforeunload', () => {
    if (currentRoomRef) {
      currentRoomRef.child('players/' + myUid).remove();
    }
  });

  window.Online = {
    init,
    isConfigured,
    createRoom,
    joinRoom,
    leaveRoom,
    onRoomChange,
    updateMyState,
    updateGameState,
    pushLog,
    getMyUid: () => myUid,
    getRoomCode: () => currentRoomCode,
  };
})();
