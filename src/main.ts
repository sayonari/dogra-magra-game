// 起動・タイトル・場面進行・HUD・頁送り・読了判定．本文は DOM（Reader），演出は CSS．
import './styles.css';
import type { Card, Para, Scene, SectionText } from './data/types';
import { scenes, cards, task } from './data/scenario_m1';
import { Reader } from './engine/reader';
import { loadSettings, saveSettings, loadProgress, saveProgress, resetProgress, markRead, type Settings, type Progress } from './engine/save';
import { setAudio, unlock, startAmbient, stopAmbient, page as pageSound } from './engine/audio';
import { overlay, toast, settingsPanel, cardsPanel, indexPanel, taskPanel, bookOverlay, endingOverlay, kindLabel, trustStars } from './engine/ui';
import { playExchange } from './games/exchange';

// 本文 JSON は区分ごとに遅延読込（必要な区分だけをチャンクにする）
const textMods = import.meta.glob('./data/text/S*.json') as Record<string, () => Promise<any>>;
const texts: Record<string, SectionText> = {};
async function loadTexts(ids: string[]) { await Promise.all(ids.filter(id => !texts[id]).map(async id => { const m = await textMods[`./data/text/${id}.json`](); texts[id] = (m.default || m) as SectionText; })); }
const BASE = import.meta.env.BASE_URL;
const app = document.getElementById('app')!;
let settings: Settings = loadSettings(); let progress: Progress = loadProgress();
let cur = -1; let reader: Reader | null = null; let tab: 'text' | 'summary' | 'notes' = 'text'; let busy = false;

function applySettings() {
  document.body.dataset.mode = settings.mode; document.body.dataset.art = settings.art;
  document.documentElement.style.setProperty('--fs', { S: '17px', M: '20px', L: '24px' }[settings.fs]);
  setAudio(settings.sound, settings.volume); saveSettings(settings); reader?.layout();
}
function paras(sc: Scene): Para[] { return sc.blocks.flatMap(b => texts[b.section].paragraphs.filter(p => p.line >= b.from && p.line <= b.to)); }
function totalLines(): number { return scenes.reduce((n, s) => n + paras(s).filter(p => p.plain?.trim()).length, 0) }
function readPct(): number {
  let r = 0; for (const s of scenes) for (const b of s.blocks) { const set = new Set(progress.read[b.section] || []); r += texts[b.section].paragraphs.filter(p => p.line >= b.from && p.line <= b.to && p.plain?.trim() && set.has(p.line)).length; }
  return Math.min(100, r / Math.max(1, totalLines()) * 100);
}
function poemLines(): string[] { return texts.S01.paragraphs.filter(p => p.line >= 32 && p.line <= 40 && p.plain?.trim()).map(p => p.html!) }
function grant(ids: string[]) { const fresh = ids.filter(id => !progress.cards.includes(id)); fresh.forEach(id => progress.cards.push(id)); saveProgress(progress); if (fresh.length) { const c = cards.find(x => x.id === fresh[0])!; toast(`証拠カード：${c.title}${fresh.length > 1 ? ` ほか${fresh.length - 1}枚` : ''}`); } }

// ---------- タイトル ----------
function title() {
  stopAmbient(); cur = -1; reader = null;
  const canContinue = !!progress.last && scenes.some(s => s.id === progress.last);
  app.innerHTML = `<div class="bg" style="background-image:url(${BASE}img/real/dark.svg)"></div><div class="grain"></div>
    <div class="title"><div class="poem">${poemLines().map(l => `<div>${l}</div>`).join('')}</div><h1>ドグラ・マグラ</h1><div class="sub">遊べば読了する——理解検証版（M1）</div>
    <div class="menu"><button id="new">はじめから</button><button id="cont" ${canContinue ? '' : 'disabled'}>つづきから</button><button id="idx" ${progress.loops > 0 || progress.reached.length ? '' : 'disabled'}>再読（索引）</button><button id="set">設定</button></div></div>
    <div class="credit">原作：夢野久作『ドグラ・マグラ』（青空文庫・パブリックドメイン）／音・画は本作の制作物</div>`;
  app.querySelector('#new')!.addEventListener('click', () => { unlock(); if (progress.reached.length && !confirm('進捗（証拠カード・読了記録）は残したまま，最初の場面から読み直します．よろしいですか？')) return; goto(0); });
  app.querySelector('#cont')!.addEventListener('click', () => { unlock(); goto(Math.max(0, scenes.findIndex(s => s.id === progress.last))); });
  app.querySelector('#idx')!.addEventListener('click', () => indexPanel(scenes, progress, task.id, readPct(), goto));
  app.querySelector('#set')!.addEventListener('click', () => settingsPanel(settings, applySettings, () => { resetProgress(); progress = loadProgress(); title(); }));
}

// ---------- 読書画面 ----------
function goto(i: number) {
  cur = i; const sc = scenes[i]; tab = 'text';
  if (!progress.reached.includes(sc.id)) progress.reached.push(sc.id); progress.last = sc.id; saveProgress(progress);
  startAmbient();
  app.innerHTML = `<div class="bg" style="background-image:url(${BASE}img/real/${sc.bg}.jpg),url(${BASE}img/real/${sc.bg}.svg)"></div><div class="grain"></div>
    <div class="stage">
      <div class="hud"><span class="scene">${sc.title}</span>
        <span class="chip src" title="${sc.source.note}">${kindLabel(sc.source.kind)}：${sc.source.who}　<span class="trust">${trustStars(sc.source.trust)}</span></span>
        ${sc.depth ? '<span class="chip">作中文書（入れ子 1）</span>' : ''}
        <div class="tabs"><button data-t="text" class="on">原文</button><button data-t="summary">要旨</button><button data-t="notes">注釈</button></div>
        <div class="icons"><button id="b-peek" title="本文を隠して背景を見る（Bキー）">景</button><button id="b-cards">図鑑 ${progress.cards.length}</button><button id="b-index">索引</button><button id="b-set">設定</button><button id="b-title">題</button></div></div>
      <div class="caption">${sc.title}<small>${kindLabel(sc.source.kind)}：${sc.source.who}</small></div>
      <div class="paperwrap"><div class="paper" id="paper"></div></div>
      <div class="pgnav"><button id="prev">← 前の頁</button><span class="pg" id="pg"></span><span class="hint" id="hint"></span><button id="next" class="next">次の頁 →</button></div>
    </div>`;
  // 場面導入：背景と題だけを数秒見せてから本文の紙を出す（クリック／キーで短縮）
  const stage = app.querySelector('.stage') as HTMLElement; stage.classList.add('intro');
  const endIntro = () => { stage.classList.remove('intro'); clearTimeout(introT); };
  const introT = setTimeout(endIntro, 2600); stage.addEventListener('click', endIntro, { once: true });
  const peek = app.querySelector('#b-peek') as HTMLButtonElement; peek.addEventListener('click', e => { e.stopPropagation(); endIntro(); stage.classList.toggle('peek'); peek.classList.toggle('on'); });
  const paper = app.querySelector('#paper') as HTMLElement; const pg = app.querySelector('#pg')!; const hint = app.querySelector('#hint')!;
  const prevB = app.querySelector('#prev') as HTMLButtonElement, nextB = app.querySelector('#next') as HTMLButtonElement;
  reader = new Reader(paper, { depth: sc.depth, onPage: (lines, p, total) => {
    sc.blocks.forEach(b => markRead(progress, b.section, lines.filter(l => l >= b.from && l <= b.to))); saveProgress(progress);
    pg.textContent = `${p + 1} / ${total}`; prevB.disabled = p === 0; nextB.textContent = p >= total - 1 ? (i === scenes.length - 1 ? '結末へ →' : '次の場面へ →') : '次の頁 →';
    hint.textContent = settings.mode === 'v' ? '←キー／画面左で進む' : '↓キー／Space で進む';
  } });
  reader.set(paras(sc), sc.blocks[0].heading);
  const panes: Record<string, HTMLElement> = {};
  const mk = (id: string, html: string) => { const d = document.createElement('div'); d.className = 'pane hidden'; d.innerHTML = html; paper.appendChild(d); panes[id] = d; };
  mk('summary', `<h3>要旨（注釈者による）</h3>${sc.summary}<p class="src">出典：${sc.blocks.map(b => `${b.section} 行${b.from}–${b.to}`).join('，')}</p>`);
  mk('notes', `<h3>注釈——三つの時点</h3>
    <p><span class="era">大正15年（作中）</span>${sc.notes.era1926}</p><p><span class="era">昭和10年（刊行）</span>${sc.notes.era1935}</p><p><span class="era">現代</span>${sc.notes.modern}</p>${sc.notes.roles ? `<p><span class="era">物語上の役割</span>${sc.notes.roles}</p>` : ''}
    <h4>情報源</h4><p class="who">${kindLabel(sc.source.kind)}：${sc.source.who}（信頼度 ${trustStars(sc.source.trust)}）——${sc.source.note}</p>
    <div class="warn">「作中の主張」と「現代の知見」は別のものです．正木の学説は物語の中の仮説であり，医学的な事実ではありません．</div>`);
  const setTab = (t: typeof tab) => { tab = t; app.querySelectorAll('.tabs button').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.t === t)); reader!.view.classList.toggle('hidden', t !== 'text'); reader!.heading?.classList.toggle('hidden', t !== 'text'); Object.entries(panes).forEach(([k, d]) => d.classList.toggle('hidden', k !== t)); };
  app.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => setTab((b as HTMLElement).dataset.t as typeof tab)));
  prevB.addEventListener('click', () => { if (reader!.prev()) pageSound(sc.depth); });
  nextB.addEventListener('click', advance);
  paper.addEventListener('click', e => { if (tab !== 'text' || (e.target as HTMLElement).closest('.pane')) return; const r = paper.getBoundingClientRect(); const fwd = settings.mode === 'v' ? e.clientX < r.left + r.width / 2 : e.clientY > r.top + r.height / 2; fwd ? advance() : (reader!.prev() && pageSound(sc.depth)); });
  app.querySelector('#b-cards')!.addEventListener('click', () => cardsPanel(cards, progress.cards));
  app.querySelector('#b-index')!.addEventListener('click', () => indexPanel(scenes, progress, task.id, readPct(), goto));
  app.querySelector('#b-set')!.addEventListener('click', () => settingsPanel(settings, applySettings, () => { resetProgress(); progress = loadProgress(); title(); }));
  app.querySelector('#b-title')!.addEventListener('click', title);
}
async function advance() {
  if (busy || !reader) return; const sc = scenes[cur];
  if (reader.next()) { pageSound(sc.depth); return; }
  busy = true; try { await runEvent(sc); } finally { busy = false; }
}
async function runEvent(sc: Scene) {
  switch (sc.event) {
    case 'card': grant(sc.cards || []); await sleep(600); break;
    case 'book': await bookOverlay(poemLines(), texts.S02.paragraphs.find(p => p.line === 46)!.html!); grant(sc.cards || []); await sleep(600); break;
    case 'game:exchange': {
      const o = overlay('', 'panel'); await playExchange(o.body); o.close(); grant(sc.cards || []);
      await sleep(900); const ok = await taskPanel(task.title, task.qs);
      if (ok && !progress.tasks.includes(task.id)) { progress.tasks.push(task.id); saveProgress(progress); toast('論点版 読了バッジ：獲得'); await sleep(1500); }
      break;
    }
  }
  if (cur >= scenes.length - 1) {
    stopAmbient(); await endingOverlay(); progress.loops++; progress.last = undefined; saveProgress(progress); title();
    setTimeout(() => indexPanel(scenes, progress, task.id, readPct(), goto), 600);
  } else goto(cur + 1);
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

document.addEventListener('keydown', e => {
  if (cur < 0 || document.querySelector('.overlay,.ending')) return;
  const stage = document.querySelector('.stage'); if (stage?.classList.contains('intro')) { stage.classList.remove('intro'); return; }
  if (e.key === 'b' || e.key === 'B') { (document.getElementById('b-peek') as HTMLButtonElement)?.click(); return; }
  if (stage?.classList.contains('peek')) { (document.getElementById('b-peek') as HTMLButtonElement)?.click(); return; }
  const v = settings.mode === 'v'; const fwd = v ? (e.key === 'ArrowLeft' || e.key === ' ' || e.key === 'ArrowDown') : (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'ArrowDown');
  const back = v ? (e.key === 'ArrowRight' || e.key === 'ArrowUp') : (e.key === 'ArrowLeft' || e.key === 'ArrowUp');
  if (fwd) { e.preventDefault(); advance(); } else if (back) { e.preventDefault(); if (reader?.prev()) pageSound(scenes[cur].depth); }
});
applySettings();
loadTexts(['S01', 'S02', ...new Set(scenes.flatMap(s => s.blocks.map(b => b.section)))]).then(title, e => { app.innerHTML = `<div class="title"><p>本文データの読込に失敗しました：${e}</p></div>`; });
