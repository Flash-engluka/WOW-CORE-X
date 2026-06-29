/* ============================================================
   board.js — 보드 렌더링 + 이동 그래프 (Canvas 2D)
   ──────────────────────────────────────────────────────────────
   · 43칸 (정밀번호 1~39 + 진영4 + Core)
   · 이동 단위 = 정밀번호. 인접칸으로 1턴 1칸 이동.
   · Core 진입은 관문(16/17/23/24)에서만 가능.
   · 단순번호(zone)는 라벨 용도로 데이터에 보관.
   ============================================================ */
(() => {
  'use strict';

  const BOARD = {"meta":{"imageW":1414,"imageH":2000,"moveUnit":"precise","totalCells":43},"coreGates":["16","17","23","24"],"factions":{"RUINS":{"char":"toriel","color":"#ff0000","homeCell":"RUINS","entryFrom":1},"HOTLAND":{"char":"mettaton","color":"#fbff00","homeCell":"HOTLAND","entryFrom":4},"SNOWDIN":{"char":"papyrus","color":"#0099ff","homeCell":"SNOWDIN","entryFrom":38},"WATERFALL":{"char":"undyne","color":"#15ff00","homeCell":"WATERFALL","entryFrom":39}},"zoneGroups":{"RUINS":["1","2","5","8","9","13","15"],"HOTLAND":["3","4","6","7","12","14","18"],"WATERFALL":["25","27","32","33","36","37","39"],"SNOWDIN":["22","26","28","29","34","35","38"],"CORE":["20"],"zone1":["19"],"zone2":["10"],"zone3":["11"],"zone4":["21"],"zone5":["30"],"zone6":["31"],"zone7":["16"],"zone8":["17"],"zone9":["23"],"zone10":["24"]},"nodes":{"RUINS":{"x":0.0707,"y":0.0255,"adj":["1"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":true,"isDeadend":true},"1":{"x":0.1252,"y":0.067,"adj":["5","8","RUINS"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"8":{"x":0.0283,"y":0.0965,"adj":["1","9"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"9":{"x":0.0835,"y":0.1255,"adj":["5","8"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"5":{"x":0.1365,"y":0.07,"adj":["1","2","9"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"2":{"x":0.2115,"y":0.1075,"adj":["5","13"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"13":{"x":0.1132,"y":0.15,"adj":["2","15"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"HOTLAND":{"x":0.925,"y":0.025,"adj":["4"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":true,"isDeadend":true},"4":{"x":0.5728,"y":0.045,"adj":["6","7","HOTLAND"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"7":{"x":0.6223,"y":0.0965,"adj":["4","12"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"12":{"x":0.5693,"y":0.1275,"adj":["6","7","14"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"6":{"x":0.5205,"y":0.0715,"adj":["3","4","12"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"3":{"x":0.4498,"y":0.0535,"adj":["6","14"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"14":{"x":0.5446,"y":0.151,"adj":["3","12","18"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"10":{"x":0.2744,"y":0.1075,"adj":["16"],"zone":"zone2","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":true},"11":{"x":0.3819,"y":0.1065,"adj":["17"],"zone":"zone3","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":true},"15":{"x":0.0566,"y":0.2175,"adj":["13","19"],"zone":"RUINS","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"16":{"x":0.2242,"y":0.2175,"adj":["10","19","CORE"],"zone":"zone7","isCore":false,"isCoreGate":true,"isFaction":false,"isDeadend":false},"17":{"x":0.4293,"y":0.2175,"adj":["11","21","CORE"],"zone":"zone8","isCore":false,"isCoreGate":true,"isFaction":false,"isDeadend":false},"18":{"x":0.599,"y":0.2175,"adj":["14","21"],"zone":"HOTLAND","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"19":{"x":0.111,"y":0.325,"adj":["15","16","22","23"],"zone":"zone1","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"21":{"x":0.5446,"y":0.325,"adj":["17","18","24","25"],"zone":"zone4","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"CORE":{"x":0.5035,"y":0.5015,"adj":["16","17","23","24"],"zone":"CORE","isCore":true,"isCoreGate":false,"isFaction":false,"isDeadend":false},"22":{"x":0.0566,"y":0.435,"adj":["19","26"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"23":{"x":0.2242,"y":0.435,"adj":["19","30","CORE"],"zone":"zone9","isCore":false,"isCoreGate":true,"isFaction":false,"isDeadend":false},"24":{"x":0.4293,"y":0.435,"adj":["21","31","CORE"],"zone":"zone10","isCore":false,"isCoreGate":true,"isFaction":false,"isDeadend":false},"25":{"x":0.599,"y":0.435,"adj":["21","27"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"30":{"x":0.2744,"y":0.545,"adj":["23"],"zone":"zone5","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":true},"31":{"x":0.3819,"y":0.545,"adj":["24"],"zone":"zone6","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":true},"SNOWDIN":{"x":0.0891,"y":0.983,"adj":["38"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":true,"isDeadend":true},"38":{"x":0.0835,"y":0.6095,"adj":["28","SNOWDIN"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"28":{"x":0.0283,"y":0.5585,"adj":["29","38"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"29":{"x":0.0835,"y":0.521,"adj":["28","34"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"34":{"x":0.1365,"y":0.5585,"adj":["29","35"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"35":{"x":0.2242,"y":0.5585,"adj":["26","34"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"26":{"x":0.1167,"y":0.505,"adj":["22","35"],"zone":"SNOWDIN","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"WATERFALL":{"x":0.9158,"y":0.9835,"adj":["39"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":true,"isDeadend":true},"39":{"x":0.5728,"y":0.6095,"adj":["33","WATERFALL"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"33":{"x":0.6223,"y":0.5585,"adj":["32","39"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"32":{"x":0.5693,"y":0.54,"adj":["33","37"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"37":{"x":0.5205,"y":0.565,"adj":["32","36"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"36":{"x":0.4498,"y":0.585,"adj":["27","37"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false},"27":{"x":0.5446,"y":0.505,"adj":["25","36"],"zone":"WATERFALL","isCore":false,"isCoreGate":false,"isFaction":false,"isDeadend":false}}};

  const FACTION_COLORS = {
    RUINS:'#ff0000', SNOWDIN:'#0099ff', WATERFALL:'#15ff00', HOTLAND:'#fbff00', CORE:'#9080dc',
  };

  let canvas=null, ctx=null;
  let onCellClick=null;
  let highlightCells=new Set();
  let tokens={};
  let hoverCell=null;

  function init(canvasEl, clickHandler){
    canvas=canvasEl; ctx=canvas.getContext('2d');
    onCellClick=clickHandler||null;
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleHover);
    canvas.addEventListener('mouseleave', ()=>{hoverCell=null; render();});
    // 부모 컨테이너 크기 변화 자동 추적 (화면 전환 시 안정적인 리사이즈)
    if (window.ResizeObserver && canvas.parentElement) {
      new ResizeObserver(() => resize()).observe(canvas.parentElement);
    }
  }

  function resize(){
    if(!canvas) return;
    const wrap=canvas.parentElement;
    const W=wrap.clientWidth-8, H=wrap.clientHeight-8;
    const ratio=BOARD.meta.imageW/BOARD.meta.imageH;
    let cw=W, ch=W/ratio;
    if(ch>H){ ch=H; cw=H*ratio; }
    canvas.width=cw; canvas.height=ch;
    canvas.style.width=cw+'px'; canvas.style.height=ch+'px';
    render();
  }

  function toCanvas(node){ return { x:node.x*canvas.width, y:node.y*canvas.height }; }

  function render(){
    if(!ctx) return;
    const W=canvas.width, H=canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle='rgba(13,0,16,0.55)'; ctx.fillRect(0,0,W,H);

    // 간선
    ctx.lineWidth=Math.max(1.5, W*0.004);
    const drawn=new Set();
    for(const [id,node] of Object.entries(BOARD.nodes)){
      const a=toCanvas(node);
      for(const nb of node.adj){
        const key=[id,nb].sort().join('-');
        if(drawn.has(key)) continue; drawn.add(key);
        const nbNode=BOARD.nodes[nb]; if(!nbNode) continue;
        const b=toCanvas(nbNode);
        const isCoreEdge=(id==='CORE'||nb==='CORE');
        ctx.strokeStyle=isCoreEdge?'rgba(224,127,212,0.9)':'rgba(160,112,232,0.45)';
        ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      }
    }

    // 노드
    const baseR=Math.max(8, W*0.018);
    for(const [id,node] of Object.entries(BOARD.nodes)){
      const p=toCanvas(node);
      let r=baseR, fill='rgba(40,30,60,0.85)', stroke='#a070e8';
      if(node.isCore){ r=baseR*1.8; fill=FACTION_COLORS.CORE; stroke='#fff'; }
      else if(node.isFaction){ r=baseR*1.5; fill=FACTION_COLORS[id]; stroke='#fff'; }
      else if(node.isCoreGate){ stroke='#e87fd4'; fill='rgba(80,40,90,0.9)'; }

      if(highlightCells.has(id)){
        ctx.save(); ctx.shadowColor='#f5c842'; ctx.shadowBlur=18;
        ctx.strokeStyle='#f5c842'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(p.x,p.y,r+4,0,Math.PI*2); ctx.stroke(); ctx.restore();
      }
      if(hoverCell===id) stroke='#ffb3f0';

      ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
      ctx.fillStyle=fill; ctx.fill();
      ctx.lineWidth=2; ctx.strokeStyle=stroke; ctx.stroke();

      ctx.fillStyle=(node.isCore||node.isFaction)?'#0d0010':'#f0e8ff';
      ctx.font=`${Math.max(8,r*0.9)}px "Press Start 2P", monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      const lbl = node.isFaction ? id[0] : (node.isCore ? 'C' : id);
      ctx.fillText(lbl, p.x, p.y);

      // 아이템 표시 (안개 처리)
      drawItemsOnCell(ctx, id, p, baseR);
    }

    // 토큰
    for(const [faction,cellId] of Object.entries(tokens)){
      const node=BOARD.nodes[cellId]; if(!node) continue;
      const p=toCanvas(node); const r=baseR*0.7;
      ctx.beginPath(); ctx.arc(p.x, p.y-baseR*1.3, r,0,Math.PI*2);
      ctx.fillStyle=FACTION_COLORS[faction]||'#fff'; ctx.fill();
      ctx.lineWidth=3; ctx.strokeStyle='#fff'; ctx.stroke();
      ctx.lineWidth=1.5; ctx.strokeStyle='#0d0010'; ctx.stroke();
    }
  }

  function pickCell(mx,my){
    const baseR=Math.max(8, canvas.width*0.018);
    let best=null, bestD=Infinity;
    for(const [id,node] of Object.entries(BOARD.nodes)){
      const p=toCanvas(node);
      const d=Math.hypot(mx-p.x,my-p.y);
      let r=baseR; if(node.isCore) r=baseR*1.8; else if(node.isFaction) r=baseR*1.5;
      if(d<=r+6 && d<bestD){ best=id; bestD=d; }
    }
    return best;
  }
  function handleClick(e){
    const rect=canvas.getBoundingClientRect();
    const id=pickCell(e.clientX-rect.left, e.clientY-rect.top);
    if(id && onCellClick) onCellClick(id);
  }
  function handleHover(e){
    const rect=canvas.getBoundingClientRect();
    const id=pickCell(e.clientX-rect.left, e.clientY-rect.top);
    if(id!==hoverCell){ hoverCell=id; render();
      canvas.style.cursor=(id && highlightCells.has(id))?'pointer':'default'; }
  }

  function setTokens(map){ tokens={...map}; render(); }
  function moveToken(faction, cellId){ tokens[faction]=cellId; render(); }
  function setHighlight(cellIds){ highlightCells=new Set(cellIds.map(String)); render(); }
  function clearHighlight(){ highlightCells.clear(); render(); }
  function getNode(id){ return BOARD.nodes[id]; }
  function getAdjacent(id){ return (BOARD.nodes[id]?.adj)||[]; }
  function getMovableCells(fromId){ const n=BOARD.nodes[fromId]; return n?n.adj.slice():[]; }
  function getData(){ return BOARD; }

  window.Board = {
    init, render, resize, setTokens, moveToken, setHighlight, clearHighlight,
    getNode, getAdjacent, getMovableCells, getData, FACTION_COLORS,
  };
})();
