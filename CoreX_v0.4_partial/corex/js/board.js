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
  const boardImg=new Image();
  let boardImgLoaded=false;
  boardImg.src='assets/board.png';
  boardImg.onload=()=>{ boardImgLoaded=true; render(); };

  function init(canvasEl, clickHandler){
    canvas=canvasEl; ctx=canvas.getContext('2d');
    onCellClick=clickHandler||null;
    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleHover);
    canvas.addEventListener('mouseleave', ()=>{hoverCell=null; render();});
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

    // 보드 이미지 배경
    if(boardImgLoaded){
      ctx.drawImage(boardImg, 0, 0, W, H);
    } else {
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
    }

    const baseR=Math.max(8, W*0.018);

    // 하이라이트 + 호버
    for(const [id,node] of Object.entries(BOARD.nodes)){
      const p=toCanvas(node);
      let r=baseR;
      if(node.isCore) r=baseR*1.8;
      else if(node.isFaction) r=baseR*1.5;

      if(highlightCells.has(id)){
        ctx.save(); ctx.shadowColor='#f5c842'; ctx.shadowBlur=20;
        ctx.strokeStyle='#f5c842'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(p.x,p.y,r+5,0,Math.PI*2); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.globalAlpha=0.25; ctx.fillStyle='#f5c842';
        ctx.beginPath(); ctx.arc(p.x,p.y,r+5,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
      if(hoverCell===id){
        ctx.save(); ctx.globalAlpha=0.3; ctx.fillStyle='#ffb3f0';
        ctx.beginPath(); ctx.arc(p.x,p.y,r+3,0,Math.PI*2); ctx.fill(); ctx.restore();
      }
    }

    // 토큰
    for(const [faction,cellId] of Object.entries(tokens)){
      const node=BOARD.nodes[cellId]; if(!node) continue;
      const p=toCanvas(node); const r=baseR*0.75;
      ctx.save();
      ctx.shadowColor='#000'; ctx.shadowBlur=6;
      ctx.beginPath(); ctx.arc(p.x, p.y, r,0,Math.PI*2);
      ctx.fillStyle=FACTION_COLORS[faction]||'#fff'; ctx.fill();
      ctx.lineWidth=2.5; ctx.strokeStyle='#fff'; ctx.stroke();
      ctx.restore();
      // 진영 첫 글자
      ctx.fillStyle='#000';
      ctx.font=`bold ${Math.max(7,r*0.85)}px "Press Start 2P", monospace`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(faction[0], p.x, p.y);
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
