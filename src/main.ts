// 起動・タイトル・章／場面進行・HUD・頁送り・原文全文モード・読了判定．本文は DOM（Reader），演出は CSS．
import './styles.css';
import type { Block, Para, Scene, SectionText } from './data/types';
import { chapters, scenes, cards, tasks, chapterOf, sceneIndex } from './data/scenario';
import counts from './data/text/counts.json';
import { Reader } from './engine/reader';
import { loadSettings, saveSettings, loadProgress, saveProgress, resetProgress, markRead, type Settings, type Progress } from './engine/save';
import { setAudio, unlock, startAmbient, stopAmbient, page as pageSound } from './engine/audio';
import { overlay, toast, settingsPanel, codexPanel, indexPanel, taskPanel, bookOverlay, endingOverlay, stubGamePanel, choicePanel, kindLabel, trustStars } from './engine/ui';
import { playExchange } from './games/exchange';

// 本文 JSON は区分ごとに遅延読込（必要な区分だけをチャンクにする）
const textMods = import.meta.glob('./data/text/S*.json') as Record<string, () => Promise<any>>;
const texts: Record<string, SectionText> = {}; const nonblank: Record<string, Set<number>> = {};
async function loadTexts(ids: string[]) { await Promise.all(ids.filter(id => !texts[id]).map(async id => { const m = await textMods[`./data/text/${id}.json`](); texts[id] = (m.default || m) as SectionText; nonblank[id] = new Set(texts[id].paragraphs.filter(p => p.plain?.trim()).map(p => p.line)); })); }
const BASE = import.meta.env.BASE_URL;
const app = document.getElementById('app')!;
let settings: Settings = loadSettings(); let progress: Progress = loadProgress();
let cur = -1; let reader: Reader | null = null; let fullReader: Reader | null = null; let tab: 'text' | 'summary' | 'notes' = 'text'; let busy = false; let idxT: ReturnType<typeof setTimeout> | undefined;
const TOTAL_LINES = Object.values(counts as Record<string, number>).reduce((a, b) => a + b, 0);

let lastText = settings.text;
function applySettings() {
  document.body.dataset.mode = settings.mode; document.body.dataset.art = settings.art; document.body.dataset.edge = String(settings.edge);
  document.documentElement.style.setProperty('--fs', { S: '17px', M: '20px', L: '24px' }[settings.fs]);
  setAudio(settings.sound, settings.volume); saveSettings(settings); reader?.layout(); fullReader?.layout();
  if (settings.text !== lastText) { lastText = settings.text; if (cur >= 0) goto(cur, 0); } // 本文の範囲を切り替えたら場面を組み直す
}
/** 場面が担当する本文の範囲．全文モードでは，区分内で前後の場面の間を隙間なく敷き詰めた連続範囲（抜粋の外側も含めて原文をすべて読む）．抜粋モードでは章データの blocks そのまま */
function ranges(sc: Scene): Block[] {
  if (settings.text === 'digest') return sc.blocks;
  const i = sceneIndex(sc.id); const out: Block[] = [];
  for (const section of [...new Set(sc.blocks.map(b => b.section))]) {
    const mine = sc.blocks.filter(b => b.section === section); const t = texts[section];
    let from = t.line_start, to = t.line_end;
    for (let j = i - 1; j >= 0; j--) { const bs = scenes[j].blocks.filter(b => b.section === section); if (bs.length) { from = Math.max(...bs.map(b => b.to)) + 1; break; } if (scenes[j].blocks.every(b => b.section < section)) break; }
    for (let j = i + 1; j < scenes.length; j++) { const bs = scenes[j].blocks.filter(b => b.section === section); if (bs.length) { to = Math.min(...bs.map(b => b.from)) - 1; break; } if (scenes[j].blocks.every(b => b.section > section)) break; }
    // 区分冒頭の題（原文の行）まで含むときは，章データの見出し（同じ題の再掲）を出さない
    out.push({ section, from, to, heading: from < mine[0].from ? undefined : mine[0].heading });
  }
  return out;
}
function paras(sc: Scene): Para[] { return ranges(sc).flatMap(b => texts[b.section].paragraphs.filter(p => p.line >= b.from && p.line <= b.to)); }
/** 本の小口：全体（非空行 TOTAL_LINES）のうち，この行より前にある分の割合（0–1）．物理的な本の「ここまで読んだ厚み」に相当 */
const SEC_ORDER = Object.keys(counts as Record<string, number>).sort();
function bookPos(section: string, line: number): number {
  let before = 0; for (const s of SEC_ORDER) { if (s === section) break; before += (counts as Record<string, number>)[s]; }
  const nb = nonblank[section]; if (nb) for (const l of nb) if (l < line) before++;
  return Math.min(1, before / Math.max(1, TOTAL_LINES));
}
/** 原文100%＝全区分の非空行のうち閲覧済みの割合（抜粋だけでなく「原文全文」で読んだ分も含む） */
function readPct(): number {
  let r = 0; for (const [sec, lines] of Object.entries(progress.read)) { const n = (counts as Record<string, number>)[sec] || 0; const nb = nonblank[sec]; r += Math.min(n, nb ? lines.filter(l => nb.has(l)).length : new Set(lines).size); }
  return Math.min(100, r / Math.max(1, TOTAL_LINES) * 100);
}
function mark(section: string, lines: number[]) { markRead(progress, section, lines.filter(l => nonblank[section]?.has(l))); saveProgress(progress); }
function poemLines(): string[] { return texts.S01.paragraphs.filter(p => p.line >= 32 && p.line <= 40 && p.plain?.trim()).map(p => p.html!) }
function grant(ids: string[]) { const fresh = ids.filter(id => !progress.cards.includes(id) && cards.some(c => c.id === id)); fresh.forEach(id => progress.cards.push(id)); saveProgress(progress); if (fresh.length) { const c = cards.find(x => x.id === fresh[0])!; toast(`証拠カード：${c.title}${fresh.length > 1 ? ` ほか${fresh.length - 1}枚` : ''}`); } }
const openIndex = () => indexPanel(chapters, progress, readPct(), id => goto(sceneIndex(id)), fullText);
const openSettings = () => settingsPanel(settings, applySettings, () => { resetProgress(); progress = loadProgress(); title(); });

// ---------- タイトル ----------
function title() {
  stopAmbient(); clearTimeout(idxT); cur = -1; reader?.destroy(); reader = null;
  const canContinue = !!progress.last && sceneIndex(progress.last) >= 0;
  app.innerHTML = `<div class="bg" style="background-image:url(${BASE}img/real/dark.jpg),url(${BASE}img/real/dark.svg)"></div><div class="grain"></div>
    <div class="title"><div class="poem">${poemLines().map(l => `<div>${l}</div>`).join('')}</div><h1>ドグラ・マグラ</h1><div class="sub">遊べば読了する——全章通し版（M2）　全${chapters.length}章・${scenes.length}場面</div>
    <div class="menu"><button id="new">はじめから</button><button id="cont" ${canContinue ? '' : 'disabled'}>つづきから</button><button id="idx" ${progress.reached.length ? '' : 'disabled'}>索引・再読</button><button id="codex" ${progress.reached.length ? '' : 'disabled'}>記憶図鑑</button><button id="set">設定</button></div></div>
    <div class="credit">原作：夢野久作『ドグラ・マグラ』（青空文庫・パブリックドメイン，原文は改変していません）／音・画は本作の制作物（CREDITS.md）</div>`;
  app.querySelector('#new')!.addEventListener('click', () => { unlock(); if (progress.reached.length && !confirm('進捗（証拠カード・読了記録）は残したまま，最初の場面から読み直します．よろしいですか？')) return; goto(0); });
  app.querySelector('#cont')!.addEventListener('click', () => { unlock(); goto(Math.max(0, sceneIndex(progress.last!)), progress.page || 0); });
  app.querySelector('#idx')!.addEventListener('click', openIndex);
  app.querySelector('#codex')!.addEventListener('click', () => codexPanel(chapters, progress));
  app.querySelector('#set')!.addEventListener('click', openSettings);
}

// ---------- 読書画面 ----------
async function goto(i: number, startPage = 0) {
  const sc = scenes[i]; const ch = chapterOf(sc.id); tab = 'text'; clearTimeout(idxT);
  await loadTexts(sc.blocks.map(b => b.section)); cur = i; reader?.destroy();
  if (!progress.reached.includes(sc.id)) progress.reached.push(sc.id); progress.last = sc.id; progress.page = startPage; saveProgress(progress);
  startAmbient();
  const depthChip = sc.depth ? `<span class="chip depth">作中文書（入れ子 ${sc.depth}）</span>` : '';
  app.innerHTML = `<div class="bg" style="background-image:url(${BASE}img/real/${sc.bg}.jpg),url(${BASE}img/real/${sc.bg}.svg)"></div><div class="grain"></div>
    <div class="stage">
      <div class="hud"><span class="scene"><small>${ch.kicker}</small>${sc.title}</span>
        <span class="chip src" title="${sc.source.note}">${kindLabel(sc.source.kind)}：${sc.source.who}　<span class="trust">${trustStars(sc.source.trust)}</span></span>${depthChip}
        <div class="tabs"><button data-t="text" class="on">${settings.text === 'digest' ? '抜粋' : '本文'}</button><button data-t="summary">要旨</button><button data-t="notes">注釈</button></div>
        <div class="icons"><button id="b-full" title="この区分の原文を最初から最後まで続けて読む">区分全文</button><button id="b-peek" title="本文を隠して背景を見る（Bキー）">景</button><button id="b-codex">図鑑 ${progress.cards.length}</button><button id="b-index">索引</button><button id="b-set">設定</button><button id="b-title">題</button></div></div>
      <div class="caption"><small>${ch.kicker}　${ch.title}</small>${sc.title}<small>${kindLabel(sc.source.kind)}：${sc.source.who}</small></div>
      <div class="paperwrap" data-depth="${sc.depth}"><div class="paper ${sc.style || ''}" id="paper"></div></div>
      <div class="pgnav"><button id="prev">← 前の頁</button><span class="pg" id="pg"></span><span class="hint" id="hint"></span><button id="next" class="next">次の頁 →</button></div>
      <div class="edge" id="edge" title="本の小口：全体のどのあたりを読んでいるか（設定で隠せます）"><i></i><b></b></div>
    </div>`;
  // 場面導入：背景と題だけを数秒見せてから本文の紙を出す（クリック／キーで短縮）
  const stage = app.querySelector('.stage') as HTMLElement; stage.classList.add('intro');
  const endIntro = () => { stage.classList.remove('intro'); clearTimeout(introT); };
  const introT = setTimeout(endIntro, 2600); stage.addEventListener('click', endIntro, { once: true });
  const peek = app.querySelector('#b-peek') as HTMLButtonElement; peek.addEventListener('click', e => { e.stopPropagation(); endIntro(); stage.classList.toggle('peek'); peek.classList.toggle('on'); });
  const paper = app.querySelector('#paper') as HTMLElement; const pg = app.querySelector('#pg')!; const hint = app.querySelector('#hint')!; const edge = app.querySelector('#edge') as HTMLElement;
  const prevB = app.querySelector('#prev') as HTMLButtonElement, nextB = app.querySelector('#next') as HTMLButtonElement;
  reader = new Reader(paper, { depth: sc.depth, onPage: (lines, p, total) => {
    progress.page = p; const rs = ranges(sc); rs.forEach(b => mark(b.section, lines.filter(l => l >= b.from && l <= b.to)));
    pg.textContent = `${p + 1} / ${total}`; prevB.disabled = p === 0;
    if (lines.length) { const pos = bookPos(rs[0].section, Math.min(...lines)); (edge.querySelector('i') as HTMLElement).style.width = `${pos * 100}%`; (edge.querySelector('b') as HTMLElement).style.left = `${(settings.mode === 'v' ? 1 - pos : pos) * 100}%`; } // 縦書きの本は右から読み進むので，読んだ厚みを右側に積む
    // 縦書きは左へ進むので，次＝左側「←」，前＝右側「→」に置く（CSS の row-reverse と対）
    const V = settings.mode === 'v'; const nx = p >= total - 1 ? (i === scenes.length - 1 ? '結末へ' : (chapterOf(scenes[i + 1].id) !== ch ? '次の章へ' : '次の場面へ')) : '次の頁';
    nextB.textContent = V ? `← ${nx}` : `${nx} →`; prevB.textContent = V ? '前の頁 →' : '← 前の頁';
    hint.textContent = settings.mode === 'v' ? '←キー／画面左で進む' : '↓キー／Space で進む';
  } });
  reader.set(paras(sc), ranges(sc)[0].heading); if (startPage > 0) reader.goPage(startPage);
  const panes: Record<string, HTMLElement> = {};
  const mk = (id: string, html: string) => { const d = document.createElement('div'); d.className = 'pane hidden'; d.innerHTML = html; paper.appendChild(d); panes[id] = d; };
  mk('summary', `<h3>要旨（注釈者による）</h3>${sc.summary}<p class="src">${settings.text === 'digest' ? '抜粋の出典' : 'この場面の本文'}：${ranges(sc).map(b => `${b.section} 行${b.from}–${b.to}`).join('，')}${settings.text === 'digest' ? '' : `（要所：${sc.blocks.map(b => `行${b.from}–${b.to}`).join('，')}）`}．<button class="link" id="p-full">この区分の原文を最初から続けて読む</button></p>`);
  mk('notes', `<h3>注釈——三つの時点</h3>
    <p><span class="era">大正15年（作中）</span>${sc.notes.era1926}</p><p><span class="era">昭和10年（刊行）</span>${sc.notes.era1935}</p><p><span class="era">現代</span>${sc.notes.modern}</p>${sc.notes.roles ? `<p><span class="era">物語上の役割</span>${sc.notes.roles}</p>` : ''}
    <h4>情報源</h4><p class="who">${kindLabel(sc.source.kind)}：${sc.source.who}（信頼度 ${trustStars(sc.source.trust)}）——${sc.source.note}</p>
    <div class="warn">「作中の主張」と「現代の知見」は別のものです．正木の学説は物語の中の仮説であり，医学的な事実ではありません．</div>`);
  const setTab = (t: typeof tab) => { tab = t; app.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.t === t)); reader!.view.classList.toggle('hidden', t !== 'text'); reader!.heading?.classList.toggle('hidden', t !== 'text'); Object.entries(panes).forEach(([k, d]) => d.classList.toggle('hidden', k !== t)); };
  app.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => setTab((b as HTMLElement).dataset.t as typeof tab)));
  prevB.addEventListener('click', () => { if (reader!.prev()) pageSound(sc.depth); });
  nextB.addEventListener('click', advance);
  paper.addEventListener('click', e => { if (tab !== 'text' || (e.target as HTMLElement).closest('.pane')) return; const r = paper.getBoundingClientRect(); const fwd = settings.mode === 'v' ? e.clientX < r.left + r.width / 2 : e.clientY > r.top + r.height / 2; fwd ? advance() : (reader!.prev() && pageSound(sc.depth)); });
  app.querySelector('#b-full')!.addEventListener('click', () => fullText(sc.blocks[0].section));
  app.querySelector('#p-full')!.addEventListener('click', () => fullText(sc.blocks[0].section));
  app.querySelector('#b-codex')!.addEventListener('click', () => codexPanel(chapters, progress));
  app.querySelector('#b-index')!.addEventListener('click', openIndex);
  app.querySelector('#b-set')!.addEventListener('click', openSettings);
  app.querySelector('#b-title')!.addEventListener('click', title);
}
async function advance() {
  if (busy || !reader) return; const sc = scenes[cur];
  if (reader.next()) { pageSound(sc.depth); return; }
  busy = true; try { await runEvent(sc); } finally { busy = false; }
}
async function runEvent(sc: Scene) {
  const ch = chapterOf(sc.id);
  if (sc.event === 'book') { await loadTexts(['S02']); await bookOverlay(poemLines(), texts.S02.paragraphs.find(p => p.line === 46)!.html!); }
  if (sc.game === 'exchange') { const o = overlay('', 'panel'); await playExchange(o.body); o.close(); }
  else if (sc.game && sc.game !== 'choice') { await stubGamePanel(sc.game, sc.gameNote); }
  grant(sc.cards || []);
  if (sc.event === 'task' && ch.task) {
    await sleep(700); const ok = await taskPanel(ch.task.title, ch.task.qs);
    if (ok && !progress.tasks.includes(ch.task.id)) { progress.tasks.push(ch.task.id); saveProgress(progress); const done = tasks.filter(t => progress.tasks.includes(t.id)).length; toast(done === tasks.length ? '論点版 読了バッジ：獲得' : `理解課題 達成（${done}/${tasks.length}）`); await sleep(1400); }
  } else if (sc.event === 'card' || sc.cards?.length) await sleep(500);
  if (sc.game === 'choice') await choicePanel(sc.gameNote); // 結末の選択は課題のあと（終幕の直前）
  if (cur >= scenes.length - 1) {
    stopAmbient(); await endingOverlay(); progress.loops++; progress.last = undefined; saveProgress(progress); title();
    idxT = setTimeout(openIndex, 600);
  } else await goto(cur + 1);
}
/** 原文全文モード：区分の原文を最初から最後まで頁送りで読む（閲覧は原文100%に反映） */
async function fullText(section: string) {
  busy = true; try { await loadTexts([section]) } finally { busy = false } const t = texts[section];
  const o = overlay(`<div class="fullhead"><span>原文全文：${t.title}（行${t.line_start}–${t.line_end}）</span><span class="pg" id="fpg"></span><button class="btn sub" id="fclose" data-close>閉じる</button></div>
    <div class="paper full" id="fpaper"></div>
    <div class="pgnav"><button id="fprev">前の頁</button><span class="hint">紙の左半分／←キーで進む（横書きは下半分／↓）</span><button id="fnext" class="next">次の頁</button></div>`, 'fullwrap');
  const paper = o.body.querySelector('#fpaper') as HTMLElement; const fpg = o.body.querySelector('#fpg')!;
  const prevB = o.body.querySelector('#fprev') as HTMLButtonElement, nextB = o.body.querySelector('#fnext') as HTMLButtonElement;
  const r = new Reader(paper, { onPage: (lines, p, total) => { mark(section, lines); fpg.textContent = `${p + 1} / ${total}　閲覧 ${(Math.min((counts as any)[section], (progress.read[section] || []).length) / (counts as any)[section] * 100).toFixed(0)}%`; prevB.disabled = p === 0; nextB.disabled = p >= total - 1; const V = settings.mode === 'v'; nextB.textContent = V ? '← 次の頁' : '次の頁 →'; prevB.textContent = V ? '前の頁 →' : '← 前の頁'; } });
  fullReader = r; r.set(t.paragraphs);
  const close = () => { fullReader = null; r.destroy(); o.close(); };
  o.body.querySelector('#fclose')!.addEventListener('click', close);
  prevB.addEventListener('click', () => { if (r.prev()) pageSound(0); }); nextB.addEventListener('click', () => { if (r.next()) pageSound(0); });
  paper.addEventListener('click', e => { const b = paper.getBoundingClientRect(); const fwd = settings.mode === 'v' ? e.clientX < b.left + b.width / 2 : e.clientY > b.top + b.height / 2; (fwd ? r.next() : r.prev()) && pageSound(0); });
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

document.addEventListener('keydown', e => {
  const tg = e.target; if (tg instanceof Element && tg.closest('button,input,select,textarea,a,[contenteditable]')) return; // 操作要素にフォーカス中は頁送りしない
  const v = settings.mode === 'v'; const fwd = v ? (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'ArrowDown') : (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown');
  const back = v ? (e.key === 'ArrowRight' || e.key === 'ArrowUp') : (e.key === 'ArrowLeft' || e.key === 'ArrowUp');
  if (fullReader) { if (fwd) { e.preventDefault(); fullReader.next() && pageSound(0); } else if (back) { e.preventDefault(); fullReader.prev() && pageSound(0); } else if (e.key === 'Escape') (document.getElementById('fclose') as HTMLButtonElement)?.click(); return; }
  if (cur < 0 || document.querySelector('.overlay,.ending')) return;
  const stage = document.querySelector('.stage'); if (stage?.classList.contains('intro')) { stage.classList.remove('intro'); return; }
  if (e.key === 'b' || e.key === 'B') { (document.getElementById('b-peek') as HTMLButtonElement)?.click(); return; }
  if (stage?.classList.contains('peek')) { (document.getElementById('b-peek') as HTMLButtonElement)?.click(); return; }
  if (tab !== 'text') return; // 要旨・注釈タブでは頁送りキーを無効化（意図せぬ場面終了を防ぐ）
  if (fwd) { e.preventDefault(); advance(); } else if (back) { e.preventDefault(); if (reader?.prev()) pageSound(scenes[cur].depth); }
});
applySettings();
loadTexts(['S01', 'S02']).then(title, e => { app.innerHTML = `<div class="title"><p>本文データの読込に失敗しました：${e}</p></div>`; });
