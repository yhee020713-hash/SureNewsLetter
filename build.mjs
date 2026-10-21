// newsletter-data.mjs 를 읽어 뉴스레터 HTML 을 생성합니다.
//   node build.mjs
// 출력: suresoft_newsletter.html (항상 최신본) + archive/newsletter-<발행일>.html (일자별 보관)
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import data from './newsletter-data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const issued = new Date(data.issued + 'T00:00:00');
const issuedLabel = `${data.issued.replace(/-/g, '.')} (${DOW[issued.getDay()]})`;

/* ---------- 조각 렌더러 ---------- */
const links = (ls = []) => ls.length
  ? `<div class="lk">${ls.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`).join(' &nbsp;·&nbsp; ')}</div>` : '';

const block = (b) => `
  <article class="block"${b.anchor ? ` id="b-${esc(b.anchor)}"` : ''}>
    <div class="bh"><span class="chip">${esc(b.chip)}</span>${b.isNew ? '<span class="new">NEW</span>' : ''}${
      (b.date || b.by) ? `<span class="date">${esc([b.date, b.by].filter(Boolean).join(' · '))}</span>` : ''}</div>
    <h3>${b.title}</h3>
    ${b.body || ''}
    ${links(b.links)}
  </article>`;

// 연속된 half 블록은 한 줄 그리드로 묶는다.
const blocks = (list) => {
  let out = '', buf = [];
  const flush = () => { if (buf.length) { out += `<div class="grid">${buf.map(block).join('')}</div>`; buf = []; } };
  for (const b of list) { if (b.half) buf.push(b); else { flush(); out += block(b); } }
  flush();
  return out;
};

const deadlineCards = () => {
  const cards = data.deadlines.filter(d => d.card).sort((a, b) => a.date.localeCompare(b.date));
  if (!cards.length) return '';
  return `<div class="kd-row" id="kdRow">${cards.map(d => `
    <div class="kd${d.hot ? ' hot' : ''}" data-dl="${d.date}"><div class="d">${d.big}<small>${d.small || ''}</small></div><div class="t">${d.text}</div></div>`).join('')}
  </div>`;
};

const upcoming = () => {
  const ups = data.deadlines.filter(d => d.side).sort((a, b) => a.date.localeCompare(b.date));
  return `<div class="upcoming" id="upcoming"><h2>다가오는 일정</h2>${ups.map(d => {
    const md = d.sideShort || d.big || d.date.slice(5).replace('-', '/');
    return `<div class="up${d.hot ? ' hot' : ''}" data-dl="${d.date}"><b>${md}</b><span>${d.side}</span></div>`;
  }).join('')}
    <div class="hint"><kbd>1</kbd>~<kbd>4</kbd> 키로 탭 이동 · <kbd>←</kbd><kbd>→</kbd> 이전/다음</div></div>`;
};

const tabBtn = (t, i) => `
  <button class="tab" role="tab" data-t="${t.id}" aria-selected="${i === 0}" aria-controls="p${t.id}">
    <span class="no">${t.id}</span><span class="tx"><span class="tt">${esc(t.title)}</span><span class="ts">${esc(t.sub)}</span></span>
    ${t.blocks.some(b => b.isNew) ? '<span class="dot" title="새 글 있음"></span>' : ''}
  </button>`;

const panel = (t, i) => {
  const subs = t.blocks.filter(b => b.anchor);
  return `
  <section class="panel${i === 0 ? ' on' : ''}" id="p${t.id}" role="tabpanel">
    <div class="ph"><div class="big">${t.id}</div><div><h2>${esc(t.title)}</h2><p>${esc(t.desc)}</p></div></div>
    ${subs.length ? `<div class="subnav">${subs.map(b => `<button data-go="b-${esc(b.anchor)}">${esc(b.anchor)}</button>`).join('')}</div>` : ''}
    ${t.showDeadlines ? deadlineCards() : ''}
    ${blocks(t.blocks)}
  </section>`;
};

/* ---------- 스타일 (그룹웨어 톤: 청록 사이드바 · 연한 회청색 배경 · 청록 테두리 카드) ---------- */
const css = `
  :root{
    --teal:#00a0b9; --teal-d:#008aa1; --teal-l:#2ab8cf; --teal-s:#e3f5f8;
    --bg:#eceff4; --surface:#fff; --ink:#2b3340; --ink2:#566070; --muted:#8c96a5; --line:#dde3ea; --soft:#f5f7fa;
    --red:#e8533f; --red-s:#fdeeeb;
  }
  *{box-sizing:border-box}
  html,body{height:100%}
  body{margin:0;background:var(--bg);color:var(--ink);font-size:14px;line-height:1.6;
       font-family:"Malgun Gothic","Apple SD Gothic Neo","Pretendard",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  a{color:var(--teal-d);text-decoration:none;font-weight:600}
  a:hover{text-decoration:underline}
  button{font:inherit;color:inherit;cursor:pointer}
  .app{display:grid;grid-template-columns:248px 1fr;min-height:100%}

  /* sidebar */
  aside.side{background:var(--teal);color:#fff;position:sticky;top:0;height:100vh;display:flex;flex-direction:column;padding:22px 14px 16px}
  .brand{padding:0 10px 16px;border-bottom:1px solid rgba(255,255,255,.22)}
  .brand .eb{font-size:10px;letter-spacing:.2em;font-weight:700;color:rgba(255,255,255,.75)}
  .brand h1{margin:5px 0 4px;font-size:20px;letter-spacing:-.03em;line-height:1.25}
  .brand .dt{font-size:12px;color:rgba(255,255,255,.8)}
  nav.tabs{margin-top:14px;display:flex;flex-direction:column;gap:4px}
  .tab{display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:10px;position:relative;transition:background .15s}
  .tab:hover{background:rgba(255,255,255,.14)}
  .tab .no{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:14px;flex:none;background:rgba(255,255,255,.2)}
  .tab .tx{display:flex;flex-direction:column;min-width:0;flex:1}
  .tab .tt{font-weight:700;font-size:14px}
  .tab .ts{font-size:11.5px;color:rgba(255,255,255,.78)}
  .tab[aria-selected="true"]{background:#fff;color:var(--teal-d);box-shadow:0 2px 8px rgba(0,60,75,.25)}
  .tab[aria-selected="true"] .no{background:var(--teal);color:#fff}
  .tab[aria-selected="true"] .ts{color:var(--muted)}
  .tab .dot{width:8px;height:8px;border-radius:50%;background:var(--red);flex:none;box-shadow:0 0 0 2px var(--teal)}
  .tab[aria-selected="true"] .dot{box-shadow:0 0 0 2px #fff}
  .upcoming{margin-top:auto;border-top:1px solid rgba(255,255,255,.22);padding:14px 10px 0}
  .upcoming h2{margin:0 0 8px;font-size:11px;letter-spacing:.14em;color:rgba(255,255,255,.75);font-weight:700}
  .up{display:flex;gap:10px;align-items:baseline;margin:6px 0;font-size:12.5px;color:rgba(255,255,255,.92)}
  .up b{font-weight:800;min-width:44px;color:#fff;font-variant-numeric:tabular-nums}
  .up.hot b{background:var(--red);padding:0 6px;border-radius:4px;min-width:0}
  .hint{margin-top:12px;font-size:11px;color:rgba(255,255,255,.7)}
  .hint kbd{font:inherit;font-weight:700;padding:0 5px;border-radius:4px;background:rgba(255,255,255,.22);color:#fff}

  /* content */
  .main{min-width:0}
  .topbar{background:var(--surface);border-bottom:1px solid var(--line);padding:0 40px;height:54px;display:flex;align-items:flex-end;justify-content:space-between}
  .topbar .t{font-size:14px;font-weight:700;padding:0 4px 14px;border-bottom:2px solid var(--teal);color:var(--ink)}
  .topbar .d{padding-bottom:16px;font-size:12.5px;color:var(--muted)}
  main.content{padding:26px 40px 56px;max-width:1040px}
  .stale{display:none;background:var(--red-s);border:1px solid #f3c2ba;color:#b13a28;border-radius:6px;padding:9px 14px;margin-bottom:16px;font-size:13px;font-weight:600}
  .panel{display:none}
  .panel.on{display:block;animation:fade .2s ease}
  @keyframes fade{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}

  .ph{display:flex;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap}
  .ph .big{width:44px;height:44px;border-radius:10px;background:var(--teal);color:#fff;display:grid;place-items:center;font-size:21px;font-weight:800;flex:none}
  .ph h2{margin:0;font-size:24px;letter-spacing:-.03em;line-height:1.2}
  .ph p{margin:1px 0 0;color:var(--muted);font-size:13px}
  .subnav{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px}
  .subnav button{border:1px solid var(--teal-l);background:var(--surface);border-radius:99px;padding:4px 13px;font-size:12.5px;font-weight:700;color:var(--teal-d)}
  .subnav button:hover{background:var(--teal);color:#fff}

  /* unified block */
  .block{background:var(--surface);border:1.5px solid var(--teal-l);border-radius:8px;padding:18px 20px;margin-bottom:14px;scroll-margin-top:70px}
  .bh{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px}
  .chip{font-size:11.5px;font-weight:800;padding:2px 10px;border-radius:99px;background:var(--teal-s);color:var(--teal-d)}
  .new{font-size:10px;font-weight:800;color:#fff;background:var(--red);padding:2px 7px;border-radius:99px;letter-spacing:.04em}
  .bh .date{margin-left:auto;font-size:12px;color:var(--muted)}
  .block h3{margin:0 0 8px;font-size:17px;letter-spacing:-.03em;line-height:1.4}
  .block p{margin:6px 0;color:var(--ink2)}
  .block ul{margin:6px 0 0;padding-left:18px;color:var(--ink2)}
  .block li{margin:5px 0}
  .m{color:var(--muted);font-size:12.5px}
  .lk{margin-top:12px;font-size:13px;padding-top:11px;border-top:1px dashed var(--line)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-bottom:14px}
  .grid .block{margin-bottom:0}

  .kd-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px}
  .kd{background:var(--surface);border:1.5px solid var(--teal-l);border-radius:8px;padding:13px 15px}
  .kd.hot{border-color:var(--red);background:var(--red-s)}
  .kd .d{font-size:23px;font-weight:800;letter-spacing:-.03em;line-height:1.15}
  .kd.hot .d{color:var(--red)}
  .kd .d small{font-size:12px;font-weight:600;color:var(--muted);margin-left:4px}
  .kd .t{margin-top:4px;font-size:12.5px;color:var(--ink2)}

  .stat-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
  .stat .num{font-size:46px;font-weight:800;letter-spacing:-.05em;line-height:1;color:var(--teal)}
  .stat .num sup{font-size:20px}
  .stat .cap{font-size:12px;color:var(--muted);margin-top:4px}
  .stat-row .txt{flex:1;min-width:220px}

  .tw{overflow-x:auto;border:1px solid var(--line);border-radius:6px;margin-top:6px}
  table{border-collapse:collapse;width:100%;font-size:13.5px;min-width:500px}
  th{background:var(--soft);text-align:left;font-weight:700;color:var(--muted);font-size:12px;padding:8px 13px}
  td{padding:9px 13px;border-top:1px solid var(--line);vertical-align:top}
  td.dl{font-weight:800;color:var(--red);white-space:nowrap}
  td.pay{font-weight:700;white-space:nowrap}
  .note{font-size:12.5px;color:var(--muted);margin-top:8px}

  .menu{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:6px}
  .day{border:1px solid var(--line);background:var(--soft);border-radius:8px;padding:10px 11px 12px}
  .day.today{border:1.5px solid var(--teal);background:var(--teal-s)}
  .day .dh{font-size:12px;font-weight:800;color:var(--muted)}
  .day.today .dh{color:var(--teal-d)}
  .day .dh em{font-style:normal;margin-left:5px;font-size:10px;background:var(--teal);color:#fff;padding:1px 6px;border-radius:99px}
  .day dl{margin:6px 0 0}
  .day dt{font-size:10.5px;font-weight:800;color:var(--muted);margin-top:8px}
  .day dd{margin:1px 0 0;font-size:13px;font-weight:600;line-height:1.35}
  .day dd.s{font-weight:500;color:var(--ink2);font-size:12.5px}
  .tags{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0 8px}
  .tags span{font-size:12.5px;font-weight:700;padding:3px 11px;border-radius:99px;background:var(--teal-s);color:var(--teal-d)}

  footer{margin-top:26px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}

  @media (max-width:860px){
    .app{grid-template-columns:1fr}
    aside.side{position:sticky;top:0;z-index:20;height:auto;flex-direction:row;align-items:center;padding:8px 10px;overflow-x:auto}
    .brand,.upcoming{display:none}
    nav.tabs{margin:0;flex-direction:row;gap:6px;width:100%}
    .tab{flex:1;justify-content:center;padding:7px 6px;gap:7px;min-width:0}
    .tab .ts{display:none} .tab .tx{flex:none} .tab .tt{font-size:12.5px;white-space:nowrap}
    .tab .no{width:24px;height:24px;font-size:12px;border-radius:6px}
    .topbar{padding:0 16px} main.content{padding:20px 16px 44px}
    .menu{grid-template-columns:1fr 1fr}
    .ph h2{font-size:21px}
  }
  @media (max-width:520px){ .tab .tx{display:none} .menu{grid-template-columns:1fr} .bh .date{margin-left:0;width:100%} }
`;

/* ---------- 클라이언트 스크립트 ---------- */
const script = `
(function(){
  var tabs=[].slice.call(document.querySelectorAll('.tab')), panels=[].slice.call(document.querySelectorAll('.panel')), KEY='suresoft-newsletter-tab';
  function pad(n){return n<10?'0'+n:''+n}
  var now=new Date(), today=now.getFullYear()+'-'+pad(now.getMonth()+1)+'-'+pad(now.getDate());

  // 오늘 식단 강조
  [].forEach.call(document.querySelectorAll('.day[data-date]'),function(d){
    if(d.dataset.date===today){d.classList.add('today');var h=d.querySelector('.dh');if(h&&!h.querySelector('em'))h.insertAdjacentHTML('beforeend','<em>TODAY</em>');}
  });
  // 지난 일정 숨김
  [].forEach.call(document.querySelectorAll('[data-dl]'),function(el){ if(el.dataset.dl<today) el.style.display='none'; });
  var ups=[].filter.call(document.querySelectorAll('#upcoming .up'),function(e){return e.style.display!=='none'});
  ups.slice(5).forEach(function(e){e.style.display='none'});
  var up=document.getElementById('upcoming'); if(up&&!ups.length){var h2=up.querySelector('h2'); if(h2)h2.style.display='none';}
  var kr=document.getElementById('kdRow');
  if(kr&&![].some.call(kr.children,function(c){return c.style.display!=='none'})) kr.style.display='none';
  // 오래된 발행본 안내
  var issued=document.body.dataset.issued;
  if(issued&&issued<today){
    var days=Math.round((new Date(today)-new Date(issued))/864e5), s=document.getElementById('stale');
    if(s){s.textContent='이 뉴스레터는 '+days+'일 전('+issued.replace(/-/g,'.')+') 발행본입니다. 최신 내용은 갱신 후 확인하세요.';s.style.display='block';}
  }

  function show(n,push){
    n=String(n);
    tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.t===n?'true':'false')});
    panels.forEach(function(p){p.classList.toggle('on',p.id==='p'+n)});
    window.scrollTo(0,0);
    if(push){try{history.replaceState(null,'','#tab'+n)}catch(e){}}
    try{localStorage.setItem(KEY,n)}catch(e){}
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.t,true)})});
  [].forEach.call(document.querySelectorAll('[data-go]'),function(b){b.addEventListener('click',function(){var el=document.getElementById(b.dataset.go);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})})});
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    var cur=tabs.findIndex(function(t){return t.getAttribute('aria-selected')==='true'}), n=tabs.length;
    if(e.key>='1'&&e.key<='4'&&Number(e.key)<=n)show(e.key,true);
    else if(e.key==='ArrowRight')show(((cur+1)%n)+1,true);
    else if(e.key==='ArrowLeft')show(((cur-1+n)%n)+1,true);
  });
  var m=/^#tab([1-9])$/.exec(location.hash), start=m?m[1]:null;
  if(!start){try{start=localStorage.getItem(KEY)}catch(e){}}
  if(start&&document.getElementById('p'+start))show(start,false);
})();
`;

/* ---------- 조립 ---------- */
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>슈어소프트 뉴스레터 ${data.issued.replace(/-/g, '.')}</title>
<style>${css}</style>
</head>
<body data-issued="${data.issued}">
<div class="app">
  <aside class="side">
    <div class="brand">
      <div class="eb">SURESOFT NEWSLETTER</div>
      <h1>슈어소프트<br>뉴스레터</h1>
      <div class="dt">${issuedLabel} · ${esc(data.range)} 소식</div>
    </div>
    <nav class="tabs" role="tablist" aria-label="뉴스레터 분류">${data.tabs.map(tabBtn).join('')}</nav>
    ${upcoming()}
  </aside>
  <div class="main">
    <div class="topbar"><div class="t">뉴스레터</div><div class="d">${issuedLabel} 발행</div></div>
    <main class="content">
      <div class="stale" id="stale"></div>
      ${data.tabs.map(panel).join('')}
      <footer>출처: ${esc(data.source)} (${data.issued.replace(/-/g, '.')} 열람). 링크는 사내 그룹웨어 로그인 후 열립니다.</footer>
    </main>
  </div>
</div>
<script>${script}</script>
</body>
</html>
`;

mkdirSync(join(here, 'archive'), { recursive: true });
writeFileSync(join(here, 'suresoft_newsletter.html'), html);
writeFileSync(join(here, 'archive', `newsletter-${data.issued}.html`), html);
console.log(`built suresoft_newsletter.html + archive/newsletter-${data.issued}.html (${html.length} bytes)`);
