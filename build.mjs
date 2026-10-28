// newsletter-data.mjs 를 읽어 뉴스레터 HTML 을 생성합니다.
//   node build.mjs
// 출력: suresoft_newsletter.html (항상 최신본) + archive/newsletter-<발행일>.html (일자별 보관)
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import data from './newsletter-data.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 마스코트(슈구리) 이미지는 파일 하나로 동작하도록 base64 로 HTML 에 직접 넣는다. (assets/ 폴더)
const asset = (n) => 'data:image/png;base64,' + readFileSync(join(here, 'assets', n)).toString('base64');
const FACE = asset('mascot-face.png');
const FULL = asset('mascot-full.png');
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
const issued = new Date(data.issued + 'T00:00:00');
const issuedLabel = `${data.issued.replace(/-/g, '.')} (${DOW[issued.getDay()]})`;

/* ---------- 조각 렌더러 ---------- */
const links = (ls = []) => ls.length
  ? `<div class="lk">${ls.map(([t, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${t}</a>`).join(' &nbsp;·&nbsp; ')}</div>` : '';

let blockSeq = 0;
for (const t of data.tabs) for (const b of t.blocks) b._id = b.anchor ? `b-${b.anchor}` : `blk-${++blockSeq}`;

const block = (b) => `
  <article class="block" id="${esc(b._id)}">
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

// 달력에 찍을 일정: deadlines 중 side 문구가 있는 항목 (date = 해당 일자)
const calEvents = data.deadlines.filter(d => d.side)
  .map(d => ({ d: d.date, t: d.side, h: d.hot ? 1 : 0 }))
  .sort((a, b) => a.d.localeCompare(b.d));

const upcoming = () => `<div class="upcoming cal" id="upcoming">
    <div class="cal-head"><button class="cal-nav" id="calPrev" aria-label="이전 달">‹</button><button class="cal-title" id="calTitle" title="이달 일정 모아보기"></button><button class="cal-nav" id="calNext" aria-label="다음 달">›</button></div>
    <div class="cal-dow"><span class="sun">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span class="sat">토</span></div>
    <div class="cal-grid" id="calGrid"></div>
    <div class="cal-pop" id="calEv" role="status" hidden></div>
    <div class="hint"><kbd>1</kbd>~<kbd>${data.tabs.length + 1}</kbd> 키로 탭 이동 · <kbd>←</kbd><kbd>→</kbd> 이전/다음</div></div>`;

const tabBtn = (t, i) => `
  <button class="tab" role="tab" data-t="${t.id}" aria-selected="${i === 0}" aria-controls="p${t.id}">
    <span class="no">${t.id}</span><span class="tx"><span class="tt">${esc(t.title)}</span><span class="tm">${esc(t.short || t.title)}</span><span class="ts">${esc(t.sub)}</span></span>
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

/* ---------- 카드뉴스 (1080x1080) ---------- */
const CARD_TAB = data.tabs.length + 1;   // 카드뉴스는 마지막 탭
// 카드 스타일은 화면 미리보기와 PNG 내보내기(SVG foreignObject)에서 함께 쓰므로 독립된 문자열로 둔다.
const cardCss = `
  .cn{--t:#00a0b9;--td:#008aa1;--ts:#e3f5f8;--r:#e8533f;--ink:#232b38;--mu:#7b8696;
      width:1080px;height:1080px;position:relative;overflow:hidden;background:#fff;color:#232b38;box-sizing:border-box;
      font-family:"Malgun Gothic","Apple SD Gothic Neo","Pretendard",sans-serif}
  .cn *{box-sizing:border-box;margin:0;padding:0}
  .cn .top{display:flex;align-items:center;justify-content:space-between;padding:56px 72px 0}
  .cn .lab{display:flex;align-items:center;gap:18px;font-size:34px;font-weight:700;color:#008aa1}
  .cn .tier{width:58px;height:58px;border-radius:16px;background:#00a0b9;color:#fff;font-size:34px;font-weight:800;
            display:flex;align-items:center;justify-content:center}
  .cn .pg{font-size:30px;font-weight:700;color:#7b8696}
  .cn .body{padding:46px 72px 0}
  .cn h2{font-size:72px;line-height:1.22;letter-spacing:-2px;font-weight:800;color:#232b38}
  .cn .sub{margin-top:20px;font-size:38px;color:#7b8696;font-weight:600}
  .cn .big{margin-top:48px;display:flex;align-items:baseline;gap:6px;color:#00a0b9;font-weight:800}
  .cn .big .n{font-size:250px;line-height:1;letter-spacing:-8px}
  .cn .big .u{font-size:100px}
  .cn .bigcap{margin-top:8px;font-size:40px;font-weight:700;color:#232b38}
  .cn .rows{margin-top:38px;display:flex;flex-direction:column;gap:16px}
  .cn .row{display:flex;align-items:center;gap:28px;background:#f3f6f9;border-radius:22px;padding:22px 32px}
  .cn .row .k{flex:none;min-width:180px;font-size:40px;font-weight:800;color:#008aa1}
  .cn .row .v{font-size:40px;font-weight:700;line-height:1.3}
  .cn .row.hot{background:#fdeeeb}
  .cn .row.hot .k{color:#e8533f}
  .cn .bul{margin-top:48px;display:flex;flex-direction:column;gap:22px}
  .cn .bul div{font-size:44px;font-weight:700;line-height:1.35;padding-left:46px;position:relative}
  .cn .bul div:before{content:"";position:absolute;left:0;top:18px;width:20px;height:20px;border-radius:50%;background:#00a0b9}
  .cn .foot{position:absolute;left:0;right:0;bottom:0;height:96px;background:#00a0b9;color:#fff;
            display:flex;align-items:center;justify-content:space-between;padding:0 72px}
  .cn .foot .brand{font-size:28px;font-weight:700;opacity:.95;display:flex;align-items:center;gap:14px}
  .cn .foot .mf{width:68px;height:68px;background:#fff;border-radius:50%;object-fit:cover}
  .cn .mc{position:absolute;right:46px;bottom:56px;width:360px;height:360px;filter:drop-shadow(0 10px 18px rgba(0,0,0,.22))}
  .cn .foot .pg2{font-size:28px;font-weight:700;opacity:.85}
  .cn .note{margin-top:34px;font-size:36px;font-weight:700;color:#008aa1;line-height:1.35}
  .cn.cover,.cn.end{background:linear-gradient(150deg,#0a7f95 0%,#00a0b9 55%,#2ab8cf 100%);color:#fff;
      display:flex;flex-direction:column;justify-content:center;padding:0 90px}
  .cn.cover .eb,.cn.end .eb{font-size:32px;letter-spacing:8px;font-weight:700;opacity:.85}
  .cn.cover h1,.cn.end h1{margin-top:26px;font-size:128px;line-height:1.15;letter-spacing:-4px;font-weight:800}
  .cn.end h1{font-size:92px;letter-spacing:-3px}
  .cn.end .mc{width:250px;height:250px;bottom:50px}
  .cn.cover .dt,.cn.end .dt{margin-top:40px;font-size:46px;font-weight:700}
  .cn.cover .tg{margin-top:24px;font-size:36px;font-weight:600;opacity:.9}
  .cn.cover .pill,.cn.end .pill{margin-top:56px;align-self:flex-start;background:rgba(255,255,255,.2);border-radius:99px;padding:16px 36px;font-size:34px;font-weight:700}
`;

const cardInner = (c) => {
  if (c.big) return `<div class="big"><span class="n">${esc(c.big.num)}</span><span class="u">${esc(c.big.unit || '')}</span></div><div class="bigcap">${esc(c.big.cap || '')}</div>`;
  if (c.rows) return `<div class="rows">${c.rows.map(r => `<div class="row${r.hot ? ' hot' : ''}"><span class="k">${esc(r.k)}</span><span class="v">${esc(r.v)}</span></div>`).join('')}</div>`;
  if (c.bullets) return `<div class="bul">${c.bullets.map(b => `<div>${esc(b)}</div>`).join('')}</div>`;
  return '';
};

const newItems = data.tabs.flatMap(t => (t.blocks || []).filter(b => b.isNew).map(b => ({ tab: t, b })));
const newCount = newItems.length;
const stripTags = (h = '') => String(h).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const newsList = newItems.length
  ? newItems.map(({ tab, b }) => `<li><button type="button" data-nt="${tab.id}" data-nb="${esc(b._id)}"><span class="nt">${tab.id} ${esc(tab.title)} · ${esc(b.chip)}</span><span class="ntt">${esc(stripTags(b.title))}</span>${b.date ? `<span class="ntd">${esc(b.date)}</span>` : ''}</button></li>`).join('')
  : '<li class="nnone">오늘은 새로 배달된 소식이 없어요.</li>';
const cardList = () => {
  const mid = data.cards || [];
  const total = mid.length + 2;
  const cover = { type: 'cover' };
  const end = { type: 'end' };
  return [cover, ...mid, end].map((c, i) => {
    if (c.type === 'cover') return `
      <div class="cn cover"><img class="mc" data-m="full" alt=""><div class="eb">SURESOFT NEWSLETTER</div><h1>슈구리<br>편지</h1>
        <div class="dt">${issuedLabel}</div><div class="tg">슈구리가 물어다 준 이번 주 사내 소식</div><div class="pill">1/${total}</div></div>`;
    if (c.type === 'end') return `
      <div class="cn end"><img class="mc" data-m="full" alt=""><div class="eb">SEE YOU SOON</div><h1>더 궁금하다면?<br>게시판으로 뒤뚱뒤뚱</h1>
        <div class="dt">공지사항부터 슈구리랑 같이 확인!</div><div class="pill">${total}/${total}</div></div>`;
    return `
      <div class="cn"><div class="top"><div class="lab"><span class="tier">${esc(c.tier)}</span><span>${esc(c.label)}</span></div></div>
        <div class="body"><h2>${esc(c.title)}</h2>${c.sub ? `<div class="sub">${esc(c.sub)}</div>` : ''}${cardInner(c)}${c.foot ? `<div class="note">${esc(c.foot)}</div>` : ''}</div>
        <div class="foot"><span class="brand"><img class="mf" data-m="face" alt="">슈구리 편지 · ${data.issued.replace(/-/g, '.')}</span><span class="pg2">${i + 1}/${total}</span></div></div>`;
  });
};

const cardsPanel = (id) => {
  const cards = cardList();
  return `
  <section class="panel" id="p${id}" role="tabpanel">
    <div class="ph"><div class="big">${id}</div><div><h2>카드뉴스</h2><p>오늘의 핵심 소식을 이미지 카드로 · 1080×1080 PNG로 저장해 공유하세요</p></div></div>
    <div class="cnbar">
      <button class="btn" id="cnAll">전체 PNG 저장 (${cards.length}장)</button>
      <span class="m">여러 파일 다운로드 요청이 나오면 허용해 주세요. 한 장만 저장되면 각 카드의 PNG 저장을 이용해 주세요.</span>
    </div>
    <div class="cngrid">${cards.map((h, i) => `
      <div class="cnitem">
        <div class="cnbox" data-i="${i}"><div class="cnscale">${h}</div></div>
        <div class="cnact"><button class="btn sm" data-view="${i}">크게 보기</button><button class="btn sm ghost" data-save="${i}">PNG 저장</button></div>
      </div>`).join('')}
    </div>
  </section>`;
};

const cardsModal = () => `
  <div class="cnmodal" id="cnModal" role="dialog" aria-modal="true" aria-label="카드뉴스" hidden>
    <button class="cnx" id="cnClose" aria-label="닫기">×</button>
    <div class="cnviewer">
      <div class="cnstage" id="cnStage"></div>
      <button class="cnnav prev" id="cnPrev" aria-label="이전">‹</button>
      <button class="cnnav next" id="cnNext" aria-label="다음">›</button>
    </div>
    <div class="cnbottom">
      <button class="btn ghost" id="cnSkip">오늘 하루 보지 않기</button>
      <span class="cncount" id="cnCount"></span>
      <button class="btn" id="cnSaveOne">이 카드 PNG 저장</button>
    </div>
  </div>`;

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
  aside.side{background:var(--teal);color:#fff;position:sticky;top:0;height:100vh;overflow-y:auto;display:flex;flex-direction:column;padding:18px 14px 12px}
  .brand{padding:0 10px 12px;border-bottom:1px solid rgba(255,255,255,.22)}
  .brand .eb{font-size:10px;letter-spacing:.2em;font-weight:700;color:rgba(255,255,255,.75)}
  .brand h1{margin:5px 0 4px;font-size:20px;letter-spacing:-.03em;line-height:1.25}
  .brand .dt{font-size:12px;color:rgba(255,255,255,.8)}
  .brand .mascot{width:62px;height:62px;border-radius:50%;background:#fff;object-fit:cover;margin-bottom:8px;box-shadow:0 2px 8px rgba(0,0,0,.2)}
  nav.tabs{margin-top:14px;display:flex;flex-direction:column;gap:4px}
  .tab{display:flex;align-items:center;gap:11px;width:100%;text-align:left;background:none;border:0;border-radius:8px;padding:7px 10px;position:relative;transition:background .15s}
  .tab:hover{background:rgba(255,255,255,.14)}
  .tab .no{width:30px;height:30px;border-radius:8px;display:grid;place-items:center;font-weight:800;font-size:14px;flex:none;background:rgba(255,255,255,.2)}
  .tab .tx{display:flex;flex-direction:column;min-width:0;flex:1}
  .tab .tt{font-weight:700;font-size:14px}
  .tab .ts{font-size:11.5px;color:rgba(255,255,255,.78)}
  .tab[aria-selected="true"]{background:#fff;color:var(--teal-d);box-shadow:0 2px 8px rgba(0,60,75,.25)}
  .tab[aria-selected="true"] .no{background:var(--teal);color:#fff}
  .tab[aria-selected="true"] .ts{color:var(--muted)}
  .tab .tm{display:none}
  .tab .dot{width:8px;height:8px;border-radius:50%;background:var(--red);flex:none;box-shadow:0 0 0 2px var(--teal)}
  .tab[aria-selected="true"] .dot{box-shadow:0 0 0 2px #fff}
  .upcoming{margin-top:auto;position:relative;border-top:1px solid rgba(255,255,255,.22);padding:12px 4px 0}
  .cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
  .cal-title{background:none;border:0;color:#fff;font-size:14px;font-weight:800;letter-spacing:.02em;padding:3px 8px;border-radius:6px}
  .cal-title:hover{background:rgba(255,255,255,.16)}
  .cal-nav{width:26px;height:26px;border:0;border-radius:6px;background:rgba(255,255,255,.14);color:#fff;font-size:17px;line-height:1}
  .cal-nav:hover{background:rgba(255,255,255,.28)}
  .cal-dow,.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);text-align:center}
  .cal-dow span{font-size:10.5px;font-weight:700;color:rgba(255,255,255,.7);padding:2px 0}
  .cal-dow .sun,.cal-grid .sun{color:#ffc7bf} .cal-dow .sat{color:#bfe7ff}
  .cal-grid button{position:relative;height:25px;padding:0;border:0;background:none;color:#fff;font-size:12px;border-radius:7px;font-variant-numeric:tabular-nums}
  .cal-grid button.sun{color:#ffc7bf}
  .cal-grid button.out{visibility:hidden}
  .cal-grid button:hover{background:rgba(255,255,255,.16)}
  .cal-grid button.today{background:#fff;color:var(--teal-d);font-weight:800}
  .cal-grid button.sel{box-shadow:inset 0 0 0 2px #fff}
  .cal-grid button.has::after{content:"";position:absolute;left:50%;bottom:3px;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:#7ff0ff}
  .cal-grid button.hot::after{background:#ff7a6b}
  .cal-grid button.today.has::after{background:var(--teal)} .cal-grid button.today.hot::after{background:var(--red)}
  .cal-pop{position:absolute;left:0;right:0;bottom:calc(100% + 10px);z-index:30;background:#fff;color:var(--ink);border-radius:10px;
           padding:10px 12px;box-shadow:0 8px 24px rgba(0,50,65,.35);font-size:12.5px}
  .cal-pop[hidden]{display:none}
  .cal-pop::after{content:"";position:absolute;left:50%;bottom:-6px;width:12px;height:12px;margin-left:-6px;background:#fff;transform:rotate(45deg)}
  .cal-pop .ph2{font-size:11px;font-weight:800;color:var(--muted);margin-bottom:6px;letter-spacing:.04em}
  .cal-pop .e{display:flex;gap:8px;align-items:baseline;margin:5px 0}
  .cal-pop .e b{flex:none;font-weight:800;min-width:40px;color:var(--teal-d);font-variant-numeric:tabular-nums}
  .cal-pop .e.hot b{background:var(--red);color:#fff;padding:0 6px;border-radius:4px;min-width:0}
  .cal-pop .e.past{opacity:.5}
  .cal-pop .none{color:var(--muted)}
  .hint{margin-top:8px;font-size:11px;color:rgba(255,255,255,.7)}
  .hint kbd{font:inherit;font-weight:700;padding:0 5px;border-radius:4px;background:rgba(255,255,255,.22);color:#fff}

  /* content */
  .main{min-width:0}
  .topbar{background:var(--surface);border-bottom:1px solid var(--line);padding:0 40px;height:54px;display:flex;align-items:flex-end;justify-content:space-between}
  .topbar .t{font-size:14px;font-weight:700;padding:0 4px 14px;border-bottom:2px solid var(--teal);color:var(--ink)}
  .topbar .d{padding-bottom:10px;font-size:12.5px;color:var(--muted)}
  main.content{padding:26px 40px 56px}
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

  /* 슈구리 버튼: 기본(모바일·좁은 화면)은 원형 얼굴 버튼, 1500px 이상은 큰 슈구리 + 말풍선 */
  .mate{position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom));z-index:30;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent}
  .mate .bub,.mate .mfull{display:none}
  .mate .mface{display:block;width:62px;height:62px;border-radius:50%;background:#fff;border:3px solid var(--teal);object-fit:cover;box-shadow:0 6px 16px rgba(0,60,80,.3);animation:bob 3.2s ease-in-out infinite}
  .mate .mbadge{position:absolute;top:-5px;right:-5px;min-width:22px;height:22px;padding:0 6px;border-radius:99px;background:var(--red);color:#fff;font-size:12px;font-weight:800;line-height:1;display:grid;place-items:center;border:2px solid #fff}
  .mate:focus-visible .mface{box-shadow:0 0 0 4px rgba(0,160,185,.4)}
  @keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  @media (prefers-reduced-motion:reduce){.mate .mface,.mate .mfull{animation:none}}
  @media (min-width:1900px){
    main.content{padding-right:270px}
    .mate{right:30px;bottom:26px;width:210px;text-align:center}
    .mate .mface,.mate .mbadge{display:none}
    .mate .bub{position:relative;display:inline-block;background:#fff;border:2px solid var(--teal);color:var(--ink);border-radius:16px;padding:10px 14px;font-size:13px;font-weight:700;line-height:1.45;box-shadow:0 6px 18px rgba(0,90,110,.12)}
    .mate .bub b{color:var(--red)}
    .mate .bub:after{content:'';position:absolute;left:50%;bottom:-9px;width:14px;height:14px;margin-left:-7px;background:#fff;border-right:2px solid var(--teal);border-bottom:2px solid var(--teal);transform:rotate(45deg)}
    .mate .mfull{display:block;width:190px;height:190px;margin:12px auto 0;filter:drop-shadow(0 8px 12px rgba(0,60,80,.2));animation:bob 3.2s ease-in-out infinite}
    .mate:hover .mfull{animation-duration:1.4s}
    .mate:focus-visible .bub{box-shadow:0 0 0 3px rgba(0,160,185,.35)}
  }
  .nmodal{position:fixed;inset:0;z-index:60;background:rgba(15,30,40,.55);display:flex;align-items:center;justify-content:center;padding:20px}
  .nmodal[hidden]{display:none}
  .nbox{position:relative;width:min(520px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:16px;padding:22px 22px 16px;box-shadow:0 24px 60px rgba(0,0,0,.35)}
  .nclose{position:absolute;right:12px;top:8px;border:0;background:none;font-size:28px;line-height:1;color:var(--muted)}
  .nhead{display:flex;align-items:center;gap:12px;margin-bottom:14px}
  .nhead img{width:56px;height:56px;border-radius:50%;background:var(--soft);object-fit:cover;flex:none}
  .nhead h2{margin:0;font-size:17px;letter-spacing:-.02em}
  .nhead p{margin:2px 0 0;font-size:12.5px;color:var(--muted)}
  .nlist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
  .nlist button{width:100%;text-align:left;background:var(--soft);border:1px solid var(--line);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:2px;transition:background .15s,border-color .15s}
  .nlist button:hover{background:#e6f6f9;border-color:var(--teal)}
  .nlist .nt{font-size:11.5px;font-weight:700;color:var(--teal-d)}
  .nlist .ntt{font-size:14px;font-weight:700;color:var(--ink);line-height:1.4}
  .nlist .ntd{font-size:11.5px;color:var(--muted)}
  .nlist .nnone{padding:18px 4px;text-align:center;color:var(--muted);font-size:13.5px}
  .nfoot{margin-top:12px;text-align:center;font-size:11.5px;color:var(--muted)}
  .blk-flash{animation:flash 1.6s ease}
  @keyframes flash{0%,100%{box-shadow:none}25%{box-shadow:0 0 0 4px rgba(0,160,185,.45)}}

  footer{margin-top:26px;padding-top:14px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}

  /* card news UI */
  .btn{background:var(--teal);color:#fff;border:0;border-radius:6px;padding:9px 16px;font-weight:700;font-size:13px}
  .btn:hover{background:var(--teal-d)}
  .btn.sm{padding:6px 12px;font-size:12.5px}
  .btn.ghost{background:var(--surface);color:var(--teal-d);border:1px solid var(--teal-l)}
  .btn.ghost:hover{background:var(--teal-s)}
  .btn[disabled]{opacity:.6;cursor:progress}
  .cnbar{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}
  .cngrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
  .cnitem{background:var(--surface);border:1.5px solid var(--teal-l);border-radius:8px;padding:12px}
  .cnbox{position:relative;width:100%;aspect-ratio:1/1;overflow:hidden;border-radius:6px;cursor:zoom-in;background:#fff;border:1px solid var(--line)}
  .cnscale{position:absolute;left:0;top:0;width:1080px;height:1080px;transform-origin:0 0;transform:scale(var(--s,.25))}
  .cnact{display:flex;gap:8px;margin-top:10px}
  .cnmodal{position:fixed;inset:0;z-index:100;background:rgba(10,20,30,.82);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;padding:max(72px,calc(env(safe-area-inset-top,0px) + 60px)) max(16px,env(safe-area-inset-right,0px)) max(20px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px));overflow-y:auto}
  .cnmodal[hidden]{display:none}
  .cnviewer{position:relative;flex:none}
  .cnstage{position:relative;overflow:hidden;border-radius:10px;background:#fff;box-shadow:0 10px 40px rgba(0,0,0,.5)}
  .cnstage .cnscale{transform:scale(var(--s,.6))}
  .cnx,.cnnav{position:absolute;z-index:2;display:grid;place-items:center;background:rgba(10,20,30,.88);color:#fff;border:1px solid rgba(255,255,255,.65);border-radius:50%;width:46px;height:46px;padding:0;font-size:32px;line-height:1;box-shadow:0 2px 10px rgba(0,0,0,.3);touch-action:manipulation}
  .cnx{z-index:3;top:max(12px,calc(env(safe-area-inset-top,0px) + 8px));right:max(16px,env(safe-area-inset-right,0px))}
  .cnnav{top:50%;transform:translateY(-50%)} .cnnav.prev{left:-60px} .cnnav.next{right:-60px}
  .cnx:hover,.cnnav:hover{background:#008aa1}
  .cnx:focus-visible,.cnnav:focus-visible{outline:3px solid #fff;outline-offset:3px}
  .cnbottom{flex:none;width:100%;display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}
  @media (max-width:699px){.cnnav.prev{left:8px}.cnnav.next{right:8px}.cnbottom{gap:8px}.cnbottom .btn{padding:8px 10px}}
  .cncount{color:#fff;font-weight:700;font-size:13px;min-width:44px;text-align:center}
  .cnmodal .btn.ghost{background:rgba(255,255,255,.14);color:#fff;border-color:rgba(255,255,255,.35)}
  .cnmodal .btn.ghost:hover{background:rgba(255,255,255,.26)}
  .topbar .d{display:flex;align-items:center;gap:14px}
  .topbar .d .btn{padding:5px 12px}
  .topbar .tbf{display:none}

  @media (max-width:860px){
    body{font-size:15px;line-height:1.65}
    .app{grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr}
    aside.side{position:sticky;top:0;z-index:20;height:auto;flex-direction:row;align-items:center;padding:6px 8px;overflow:visible}
    .brand,.upcoming{display:none}
    nav.tabs{margin:0;flex-direction:row;gap:4px;width:100%}
    .tab{flex:1 1 0;min-width:0;flex-direction:column;justify-content:flex-start;align-items:center;gap:4px;padding:7px 2px 6px;text-align:center}
    .tab .no{width:26px;height:26px;font-size:13px;border-radius:7px}
    .tab .tx{display:flex;flex:none;width:100%;justify-content:center}
    .tab .ts{display:none}
    .tab{padding-left:0;padding-right:0}
    .tab .tt{display:none}
    .tab .tm{display:block;font-size:12px;line-height:1.2;font-weight:700;text-align:center;white-space:nowrap}
    .block li .m{display:block;line-height:1.4}
    .tab .dot{position:absolute;top:5px;right:calc(50% - 22px)}
    .topbar{height:auto;padding:10px 14px;flex-direction:column;align-items:stretch;gap:8px}
    .topbar .t{display:flex;align-items:center;gap:9px;padding:0;border:0;font-size:17px}
    .topbar .tbf{display:block;width:34px;height:34px;border-radius:50%;background:var(--soft);border:2px solid var(--teal);object-fit:cover}
    .topbar .d{width:100%;padding:0;justify-content:space-between;flex-direction:row-reverse}
    .topbar .d span{font-size:12.5px}
    main.content{padding:16px 14px 96px;max-width:none}
    .ph{gap:12px;margin-bottom:14px;flex-wrap:nowrap;align-items:flex-start}
    .ph .big{width:40px;height:40px;font-size:19px}
    .ph h2{font-size:22px}
    .ph p{font-size:13px;line-height:1.5}
    .subnav{gap:8px;margin-bottom:14px}
    .subnav button{padding:7px 14px;font-size:13px}
    .kd-row{grid-template-columns:1fr 1fr;gap:10px}
    .kd{padding:11px 12px}
    .kd .d{font-size:21px}
    .kd .t{font-size:12.5px;line-height:1.45}
    .block{padding:16px 15px;margin-bottom:12px}
    .block h3{font-size:16.5px}
    .grid{grid-template-columns:1fr;gap:12px}
    .stat-row{gap:10px}
    .stat-row .txt{min-width:0;flex:1 1 100%}
    table{min-width:0;font-size:13px}
    th,td{padding:8px 9px}
    th{font-size:11.5px}
    .menu{grid-template-columns:1fr 1fr}
    .day dd{font-size:13.5px}
    .lk a{display:inline-block;padding:4px 0}
    .bh .date{margin-left:0;width:100%}
    .nmodal{align-items:flex-end;padding:0}
    .nbox{width:100%;border-radius:18px 18px 0 0;padding-bottom:calc(16px + env(safe-area-inset-bottom))}
  }
  @media (max-width:520px){ .menu{grid-template-columns:1fr} .kd .d{font-size:20px} }
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
  /* ===== 미니 달력 (틀은 6주로 고정, 일정은 달력 위 팝오버) ===== */
  var EV=${JSON.stringify(calEvents)};
  var cy=now.getFullYear(), cm=now.getMonth(), selDate=null, pop=null; // pop: null | 'YYYY-MM-DD' | 'month'
  function ymd(y,m,d){return y+'-'+pad(m+1)+'-'+pad(d)}
  function evOf(d){return EV.filter(function(e){return e.d===d})}
  function monthKey(){return cy+'-'+pad(cm+1)}
  function renderPop(){
    var box=document.getElementById('calEv'); if(!box)return;
    if(!pop){box.hidden=true;box.textContent='';return;}
    var list=pop==='month'?EV.filter(function(e){return e.d.slice(0,7)===monthKey()}):evOf(pop);
    box.textContent='';
    var h=document.createElement('div'); h.className='ph2';
    h.textContent=pop==='month'?(cy+'년 '+(cm+1)+'월 일정'):(pop.slice(5).replace('-','월 ')+'일 일정'); box.appendChild(h);
    if(!list.length){var n=document.createElement('div');n.className='none';n.textContent='등록된 일정이 없습니다.';box.appendChild(n);}
    list.forEach(function(e){
      var r=document.createElement('div'); r.className='e'+(e.h?' hot':'')+(e.d<today?' past':'');
      var b=document.createElement('b'); b.textContent=e.d.slice(5).replace('-','/');
      var t=document.createElement('span'); t.textContent=e.t; r.appendChild(b); r.appendChild(t); box.appendChild(r);
    });
    box.hidden=false;
  }
  function renderCal(){
    var grid=document.getElementById('calGrid'); if(!grid)return;
    document.getElementById('calTitle').textContent=cy+'.'+pad(cm+1);
    var first=new Date(cy,cm,1).getDay(), days=new Date(cy,cm+1,0).getDate(), html='';
    for(var i=0;i<42;i++){
      var d=i-first+1;
      if(d<1||d>days){html+='<button class="out" disabled tabindex="-1"></button>';continue;}
      var key=ymd(cy,cm,d), ev=evOf(key), c=[];
      if(i%7===0)c.push('sun'); if(key===today)c.push('today'); if(key===selDate)c.push('sel');
      if(ev.length){c.push('has'); if(ev.some(function(e){return e.h}))c.push('hot');}
      html+='<button class="'+c.join(' ')+'" data-d="'+key+'">'+d+'</button>';
    }
    grid.innerHTML=html; renderPop();
  }
  function closePop(){ if(pop||selDate){pop=null;selDate=null;renderCal();} }
  var calGrid=document.getElementById('calGrid');
  if(calGrid){
    calGrid.addEventListener('click',function(e){
      var b=e.target.closest('button[data-d]'); if(!b)return; var k=b.dataset.d;
      if(selDate===k){selDate=null;pop=null;}
      else{selDate=k; pop=evOf(k).length?k:null;}
      renderCal();
    });
    document.getElementById('calTitle').addEventListener('click',function(){ selDate=null; pop=(pop==='month')?null:'month'; renderCal(); });
    document.getElementById('calPrev').addEventListener('click',function(){cm--; if(cm<0){cm=11;cy--} selDate=null; pop=null; renderCal();});
    document.getElementById('calNext').addEventListener('click',function(){cm++; if(cm>11){cm=0;cy++} selDate=null; pop=null; renderCal();});
    // 달력 칸은 클릭 직후 다시 그려져 e.target 이 DOM 에서 떨어질 수 있으므로 isConnected 로 거른다.
    document.addEventListener('click',function(e){ if(pop&&e.target.isConnected&&!e.target.closest('#upcoming')) closePop(); });
    renderCal();
  }
  // 오래된 발행본 안내
  var issued=document.body.dataset.issued;
  if(issued&&issued<today){
    var days=Math.round((new Date(today)-new Date(issued))/864e5), s=document.getElementById('stale');
    if(s){s.textContent='이 뉴스레터는 '+days+'일 전('+issued.replace(/-/g,'.')+') 발행본입니다. 최신 내용은 갱신 후 확인하세요.';s.style.display='block';}
  }

  /* ===== 카드뉴스 ===== */
  var CARD_CSS=${JSON.stringify(cardCss)};
  function fitCards(){
    [].forEach.call(document.querySelectorAll('.cnbox'),function(b){
      var w=b.clientWidth; if(w) b.firstElementChild.style.setProperty('--s',(w/1080).toFixed(4));
    });
  }
  window.addEventListener('resize',fitCards);
  function cardEl(i){ return document.querySelectorAll('.cnbox')[i].querySelector('.cn'); }
  function cardPng(i){
    return new Promise(function(resolve,reject){
      var xml=new XMLSerializer().serializeToString(cardEl(i).cloneNode(true));
      var svg='<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><foreignObject x="0" y="0" width="1080" height="1080">'+
              '<style><![CDATA['+CARD_CSS+']]></style>'+xml+'</foreignObject></svg>';
      var img=new Image();
      img.onload=function(){
        try{
          var c=document.createElement('canvas'); c.width=1080; c.height=1080;
          var x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,1080,1080); x.drawImage(img,0,0);
          c.toBlob(function(b){b?resolve(b):reject(new Error('toBlob'))},'image/png');
        }catch(e){reject(e)}
      };
      img.onerror=function(){reject(new Error('render'))};
      img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    });
  }
  function cardName(i){
    return 'suresoft-cardnews-'+(document.body.dataset.issued||'')+'-'+(i<9?'0':'')+(i+1)+'.png';
  }
  function downloadBlob(blob,name){
    var url=URL.createObjectURL(blob), a=document.createElement('a');
    a.href=url; a.download=name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url)},60000);
  }
  function saveCard(i){
    return cardPng(i).then(function(b){downloadBlob(b,cardName(i));})
      .catch(function(){ alert('이미지 저장에 실패했습니다. 브라우저를 Chrome/Edge 최신 버전으로 사용하거나 카드를 화면 캡처해 주세요.'); });
  }
  [].forEach.call(document.querySelectorAll('[data-save]'),function(b){b.addEventListener('click',function(){saveCard(+b.dataset.save)})});
  var allBtn=document.getElementById('cnAll');
  if(allBtn) allBtn.addEventListener('click',async function(){
    var n=document.querySelectorAll('.cnbox').length, label=allBtn.textContent, files=[];
    allBtn.disabled=true;
    try{
      for(var i=0;i<n;i++){
        allBtn.textContent='PNG 만드는 중 ('+(i+1)+'/'+n+')';
        files.push({name:cardName(i),blob:await cardPng(i)});
      }
      for(var j=0;j<files.length;j++){
        allBtn.textContent='PNG 저장 요청 중 ('+(j+1)+'/'+n+')';
        downloadBlob(files[j].blob,files[j].name);
        await new Promise(function(resolve){setTimeout(resolve,1000)});
      }
    }catch(e){
      alert('전체 PNG 저장에 실패했습니다. 다시 시도하거나 개별 PNG 저장을 이용해 주세요.');
    }finally{
      allBtn.disabled=false; allBtn.textContent=label;
    }
  });
  var modal=document.getElementById('cnModal'), stage=document.getElementById('cnStage'), cur=0;
  function openCard(i,mode){
    var n=document.querySelectorAll('.cnbox').length; cur=(i+n)%n;
    if(mode) modal.dataset.mode=mode;
    document.getElementById('cnCount').textContent=(cur+1)+' / '+n;
    modal.hidden=false;
    var style=getComputedStyle(modal), bottom=modal.querySelector('.cnbottom');
    var height=modal.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-bottom.offsetHeight-parseFloat(style.rowGap);
    var width=modal.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-(window.innerWidth<700?0:120);
    var s=Math.max(1/1080,Math.min(height/1080,width/1080,1));
    stage.style.width=stage.style.height=Math.round(1080*s)+'px';
    stage.innerHTML='<div class="cnscale" style="--s:'+s.toFixed(4)+'">'+cardEl(cur).outerHTML+'</div>';
  }
  window.addEventListener('resize',function(){if(modal&&!modal.hidden)openCard(cur)});
  [].forEach.call(document.querySelectorAll('.cnbox'),function(b){b.addEventListener('click',function(){openCard(+b.dataset.i,'view')})});
  [].forEach.call(document.querySelectorAll('[data-view]'),function(b){b.addEventListener('click',function(){openCard(+b.dataset.view,'view')})});
  var SNOOZE='suresoft-cardnews-snooze';
  function snoozed(){ try{ return localStorage.getItem(SNOOZE)===today; }catch(e){ return false; } }
  function snoozeToday(){ try{ localStorage.setItem(SNOOZE,today); }catch(e){} }
  if(modal){
    document.getElementById('cnSkip').addEventListener('click',function(){ snoozeToday(); modal.hidden=true; });
    var re=document.getElementById('cnReopen'); if(re) re.addEventListener('click',function(){ openCard(0,'view'); });
    document.getElementById('cnClose').addEventListener('click',function(){modal.hidden=true});
    document.getElementById('cnPrev').addEventListener('click',function(){openCard(cur-1)});
    document.getElementById('cnNext').addEventListener('click',function(){openCard(cur+1)});
    document.getElementById('cnSaveOne').addEventListener('click',function(){saveCard(cur)});
    modal.addEventListener('click',function(e){if(e.target===modal)modal.hidden=true});
  }

  function show(n,push){
    n=String(n);
    tabs.forEach(function(t){t.setAttribute('aria-selected',t.dataset.t===n?'true':'false')});
    panels.forEach(function(p){p.classList.toggle('on',p.id==='p'+n)});
    window.scrollTo(0,0);
    fitCards();
    if(push){try{history.replaceState(null,'','#tab'+n)}catch(e){}}
    try{localStorage.setItem(KEY,n)}catch(e){}
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){show(t.dataset.t,true)})});
  /* ===== 새 소식 팝업 (슈구리 클릭) ===== */
  var nm=document.getElementById('newsModal'), mate=document.getElementById('mate');
  function openNews(){ if(nm){nm.hidden=false;var c=document.getElementById('newsClose');if(c)c.focus();} }
  function closeNews(){ if(nm){nm.hidden=true;if(mate)mate.focus();} }
  if(mate&&nm){
    mate.addEventListener('click',openNews);
    mate.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();openNews();}});
    document.getElementById('newsClose').addEventListener('click',closeNews);
    nm.addEventListener('click',function(e){if(e.target===nm)closeNews()});
    [].forEach.call(nm.querySelectorAll('button[data-nb]'),function(b){b.addEventListener('click',function(){
      nm.hidden=true; show(b.dataset.nt,true);
      var el=document.getElementById(b.dataset.nb);
      if(el){setTimeout(function(){el.scrollIntoView({behavior:'smooth',block:'start'});el.classList.add('blk-flash');setTimeout(function(){el.classList.remove('blk-flash')},1700);},60);}
    })});
  }
  [].forEach.call(document.querySelectorAll('[data-go]'),function(b){b.addEventListener('click',function(){var el=document.getElementById(b.dataset.go);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})})});
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey||e.metaKey||e.altKey)return;
    if(nm&&!nm.hidden){if(e.key==='Escape')closeNews();return;}
    if(e.key==='Escape'&&pop&&!(modal&&!modal.hidden)){closePop();return;}
    if(modal&&!modal.hidden){
      if(e.key==='Escape')modal.hidden=true;
      else if(e.key==='ArrowRight')openCard(cur+1);
      else if(e.key==='ArrowLeft')openCard(cur-1);
      return;
    }
    var at=tabs.findIndex(function(t){return t.getAttribute('aria-selected')==='true'}), n=tabs.length;
    if(e.key>='1'&&e.key<='9'&&Number(e.key)<=n)show(e.key,true);
    else if(e.key==='ArrowRight')show(((at+1)%n)+1,true);
    else if(e.key==='ArrowLeft')show(((at-1+n)%n)+1,true);
  });
  var m=/^#tab([1-9])$/.exec(location.hash), start=m?m[1]:null;
  if(!start){try{start=localStorage.getItem(KEY)}catch(e){}}
  if(start&&document.getElementById('p'+start))show(start,false);
  if(modal&&document.querySelector('.cnbox')&&!snoozed()) openCard(0,'popup');
})();
`;

/* ---------- 조립 ---------- */
const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>슈구리 편지 ${data.issued.replace(/-/g, '.')}</title>
<link rel="icon" id="fav" href="data:,">
<style>${css}${cardCss}</style>
</head>
<body data-issued="${data.issued}">
<div class="app">
  <aside class="side">
    <div class="brand">
      <img class="mascot" data-m="face" alt="슈구리">
      <div class="eb">SURESOFT NEWSLETTER</div>
      <h1>슈구리 편지</h1>
      <div class="dt">${issuedLabel} · ${esc(data.range)} 소식</div>
    </div>
    <nav class="tabs" role="tablist" aria-label="뉴스레터 분류">${data.tabs.map(tabBtn).join('')}
      <button class="tab" role="tab" data-t="${CARD_TAB}" aria-selected="false" aria-controls="p${CARD_TAB}">
        <span class="no">${CARD_TAB}</span><span class="tx"><span class="tt">카드뉴스</span><span class="tm">카드뉴스</span><span class="ts">이미지로 저장 · 공유</span></span>
      </button></nav>
    ${upcoming()}
  </aside>
  <div class="main">
    <div class="topbar"><div class="t"><img class="tbf" data-m="face" alt="">슈구리 편지</div><div class="d"><button class="btn sm ghost" id="cnReopen">카드뉴스 보기</button><span>${issuedLabel} 발행</span></div></div>
    <main class="content">
      <div class="stale" id="stale"></div>
      ${data.tabs.map(panel).join('')}
      ${cardsPanel(CARD_TAB)}
      <footer>출처: ${esc(data.source)} (${data.issued.replace(/-/g, '.')} 열람). 링크는 사내 그룹웨어 로그인 후 열립니다.</footer>
    </main>
  </div>
</div>
${cardsModal()}
<aside class="mate" id="mate" role="button" tabindex="0" aria-label="새로 갱신된 소식 보기"><div class="bub">${newCount ? '오늘 배달된 새 소식 <b>' + newCount + '건</b>!<br>나를 눌러 확인하세요' : '오늘도 편지 배달 완료!<br>나를 눌러 확인해 보세요'}</div><img class="mfull" data-m="full" alt=""><img class="mface" data-m="face" alt="">${newCount ? '<span class="mbadge">' + newCount + '</span>' : ''}</aside>
<div class="nmodal" id="newsModal" role="dialog" aria-modal="true" aria-label="새 소식" hidden>
  <div class="nbox">
    <button type="button" class="nclose" id="newsClose" aria-label="닫기">&times;</button>
    <div class="nhead"><img data-m="face" alt=""><div><h2>슈구리가 배달해 온 새 소식</h2><p>${issuedLabel} 기준 · ${newCount}건</p></div></div>
    <ul class="nlist">${newsList}</ul>
    <div class="nfoot">누르면 해당 글로 이동해요</div>
  </div>
</div>
<script>(function(){var M={face:"${FACE}",full:"${FULL}"};document.querySelectorAll("img[data-m]").forEach(function(i){i.src=M[i.dataset.m]});document.getElementById("fav").href=M.face;})();</script>
<script>${script}</script>
</body>
</html>
`;

mkdirSync(join(here, 'archive'), { recursive: true });
writeFileSync(join(here, 'suresoft_newsletter.html'), html);
writeFileSync(join(here, 'archive', `newsletter-${data.issued}.html`), html);
console.log(`built suresoft_newsletter.html + archive/newsletter-${data.issued}.html (${html.length} bytes)`);

// 배포: publish.config.json 의 targets(공유 폴더 경로 목록)가 있으면 그곳에도 복사한다.
//   예) { "targets": ["\\\\fileserver\\share\\newsletter"] }
const cfgPath = join(here, 'publish.config.json');
if (existsSync(cfgPath)) {
  const { targets = [] } = JSON.parse(readFileSync(cfgPath, 'utf8'));
  for (const dir of targets) {
    try {
      mkdirSync(join(dir, 'archive'), { recursive: true });
      writeFileSync(join(dir, 'suresoft_newsletter.html'), html);
      writeFileSync(join(dir, 'archive', `newsletter-${data.issued}.html`), html);
      console.log(`published -> ${dir}`);
    } catch (e) {
      console.error(`publish failed: ${dir} (${e.message})`);
      process.exitCode = 1;
    }
  }
}
