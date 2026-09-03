// 画面部品：オーバーレイ／トースト／設定／記憶図鑑（証拠カード）／索引とバッジ／理解課題／入れ子の本／終幕
import type { Card, Scene } from '../data/types';
import type { Settings, Progress } from './save';
import type { TaskQ } from '../data/scenario_m1';
import { clock, page as pageSound } from './audio';

const app = () => document.getElementById('app')!;

export function overlay(inner: string, cls = 'panel'): { el: HTMLElement; body: HTMLElement; close: () => void } {
  const el = document.createElement('div'); el.className = 'overlay';
  const body = document.createElement('div'); body.className = cls; body.innerHTML = inner; el.appendChild(body); app().appendChild(el);
  const close = () => el.remove();
  return { el, body, close };
}
export function toast(msg: string) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; app().appendChild(t); setTimeout(() => t.remove(), 3500); }

export function settingsPanel(s: Settings, onChange: (s: Settings) => void, onReset: () => void) {
  const seg = (k: keyof Settings, opts: [string, string][]) => `<span class="seg" data-k="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(s[k]) === v ? 'on' : ''}">${l}</button>`).join('')}</span>`;
  const o = overlay(`<button class="close">閉じる</button><h2>設定</h2>
    <div class="row"><label>本文の向き</label>${seg('mode', [['v', '縦書き'], ['h', '横書き']])}</div>
    <div class="row"><label>文字の大きさ</label>${seg('fs', [['S', '小'], ['M', '中'], ['L', '大']])}</div>
    <div class="row"><label>絵柄</label>${seg('art', [['real', 'A 写実（セピア）'], ['shadow', 'B 影絵']])}</div>
    <div class="row"><label>音</label>${seg('sound', [['true', 'あり'], ['false', 'なし']])}<input type="range" min="0" max="1" step="0.05" value="${s.volume}" id="vol"><span class="small">上限は控えめに固定．低音が苦手な方は「なし」を</span></div>
    <h3>進捗</h3><div class="row"><button class="btn sub" id="reset">記録を消して最初から</button><span class="small">証拠カード・読了記録・周回数を消します</span></div>
    <p class="small">底本：青空文庫『ドグラ・マグラ』（夢野久作，パブリックドメイン）．原文は改変していません．</p>`);
  o.body.querySelector('.close')!.addEventListener('click', o.close);
  o.body.querySelectorAll('.seg').forEach(sg => sg.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button'); if (!b) return; const k = (sg as HTMLElement).dataset.k as keyof Settings; const v = b.dataset.v!;
    (s as any)[k] = k === 'sound' ? v === 'true' : v; sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); onChange(s);
  }));
  o.body.querySelector('#vol')!.addEventListener('input', e => { s.volume = Number((e.target as HTMLInputElement).value); onChange(s); });
  o.body.querySelector('#reset')!.addEventListener('click', () => { if (confirm('記録を消して最初からにします．よろしいですか？')) { onReset(); o.close(); } });
}

const KIND: Record<string, string> = { perception: '知覚', explanation: '説明', document: '文書', inference: '推測', meta: '作者' };
export function kindLabel(k: string) { return KIND[k] || k }
export function trustStars(t: number) { return '★'.repeat(t) + '☆'.repeat(3 - t) }

export function cardHtml(c: Card, owned: boolean) {
  if (!owned) return `<div class="card locked"><h4>？？？</h4><div class="small">まだ手に入れていない</div></div>`;
  return `<div class="card ${c.info ? 'info' : ''}"><h4>${c.title}</h4>
    <div><span class="k fact">${c.info ? '要点' : '事実'}</span>${c.fact}</div>
    <div><span class="k who">発言者</span>${c.who}</div>
    <div><span class="k inf">推測</span>${c.inference}</div>
    <div><span class="k contra">反証</span>${c.contra}</div><div class="src">出典：${c.src}</div></div>`;
}
export function cardsPanel(all: Card[], owned: string[]) {
  const o = overlay(`<button class="close">閉じる</button><h2>記憶図鑑——証拠カード</h2>
    <p class="small">各カードは「事実（誰が見た／言った）」と「推測」「反証」を分けて記録します．事実と推測を分けて持つことが，この物語を読む唯一の武器です．</p>
    <div class="cards">${all.map(c => cardHtml(c, owned.includes(c.id))).join('')}</div>`);
  o.body.querySelector('.close')!.addEventListener('click', o.close);
}

export function badges(p: Progress, scenes: Scene[], taskId: string, pct: number) {
  const story = scenes.every(s => p.reached.includes(s.id)); const points = p.tasks.includes(taskId); const full = pct >= 100;
  return `<div class="badges">
    <div class="badge ${story ? 'on' : ''}"><b>物語版 読了</b>${story ? '達成' : `${p.reached.length}/${scenes.length} 場面`}</div>
    <div class="badge ${points ? 'on' : ''}"><b>論点版 読了</b>${points ? '達成' : '理解課題 未達成'}</div>
    <div class="badge ${full ? 'on' : ''}"><b>原文100%</b>${pct.toFixed(0)}% 閲覧</div>
    <div class="badge"><b>周回</b>${p.loops} 回</div></div>`;
}
export function indexPanel(scenes: Scene[], p: Progress, taskId: string, pct: number, onJump: (i: number) => void) {
  const o = overlay(`<button class="close">閉じる</button><h2>索引（再読モード）</h2>${badges(p, scenes, taskId, pct)}
    <div class="index"><ol>${scenes.map((s, i) => `<li>${p.reached.includes(s.id) ? `<button data-i="${i}">${s.title}</button>` : `<span>${s.title}</span>`}<span class="st">${p.reached.includes(s.id) ? '到達済み' : '未到達'}</span></li>`).join('')}</ol></div>
    <p class="small">M1（理解検証用縦切り）では5場面のみ．到達済みの場面へ戻れます．</p>`);
  o.body.querySelector('.close')!.addEventListener('click', o.close);
  o.body.querySelectorAll('.index button').forEach(b => b.addEventListener('click', () => { o.close(); onJump(Number((b as HTMLElement).dataset.i)); }));
}

export function taskPanel(title: string, qs: TaskQ[]): Promise<boolean> {
  return new Promise(res => {
    const o = overlay(`<h2>${title}</h2><p class="small">「正解を当てる」のではなく，「その言葉は誰のものか」を割り当てます．すべて割り当てると判定できます．間違えても解説が出るだけで，選び直して何度でも判定できます．</p>
      <div class="task">${qs.map(q => `<div class="q" data-id="${q.id}"><div class="stmt">${q.stmt}</div><div class="opts">${q.opts.map((op, i) => `<button data-i="${i}">${op}</button>`).join('')}</div><div class="fb"></div></div>`).join('')}</div>
      <div class="row"><button class="btn" id="judge" disabled>判定する</button><button class="btn" id="go" style="display:none">つづける</button><button class="btn sub" id="skip" style="display:none">解説を読んで，このまま進む（論点版バッジは未取得）</button><span class="small" id="cnt"></span></div>`);
    const picks: Record<string, number> = {}; const judge = o.body.querySelector('#judge') as HTMLButtonElement; const go = o.body.querySelector('#go') as HTMLButtonElement; const skip = o.body.querySelector('#skip') as HTMLButtonElement; const cnt = o.body.querySelector('#cnt')!;
    let attempts = 0;
    o.body.querySelectorAll('.q').forEach(q => q.querySelectorAll('.opts button').forEach(b => b.addEventListener('click', () => {
      q.querySelectorAll('.opts button').forEach(x => x.classList.toggle('sel', x === b)); picks[(q as HTMLElement).dataset.id!] = Number((b as HTMLElement).dataset.i);
      q.classList.remove('ok', 'ng'); q.querySelector('.fb')!.textContent = '';
      const n = Object.keys(picks).length; cnt.textContent = `${n}/${qs.length}`; judge.disabled = n < qs.length; judge.textContent = attempts ? '選び直して再判定' : '判定する';
    })));
    judge.addEventListener('click', () => {
      attempts++; let ok = 0;
      qs.forEach(q => { const el = o.body.querySelector(`.q[data-id="${q.id}"]`)!; const good = picks[q.id] === q.answer; if (good) ok++; el.classList.add(good ? 'ok' : 'ng'); el.querySelector('.fb')!.innerHTML = (good ? '○ ' : `× 正しくは「${q.opts[q.answer]}」．`) + q.fb; });
      cnt.textContent = `${ok}/${qs.length} 正解`;
      if (ok === qs.length) { judge.style.display = 'none'; skip.style.display = 'none'; go.style.display = ''; go.textContent = 'すべて割り当てられた——つづける'; }
      else { judge.textContent = '選び直して再判定'; skip.style.display = ''; }
    });
    go.addEventListener('click', () => { o.close(); res(true); });
    skip.addEventListener('click', () => { o.close(); res(false); });
  });
}

/** 入れ子の本：標本室で見つけた原稿の1〜2頁目を開く．同じ巻頭歌・同じ第一行 */
export function bookOverlay(poem: string[], firstLine: string): Promise<void> {
  return new Promise(res => {
    const o = overlay(`<div class="pg l"><div class="stamp">一</div><div class="v">${poem.map(l => `<div>${l}</div>`).join('')}</div><div class="num">— 1 —</div></div>
      <div class="pg r"><div class="v"><div class="t">ドグラ・マグラ</div><div>${firstLine}</div></div><div class="num">— 2 —</div></div>`, 'book');
    pageSound(1);
    const note = document.createElement('div'); note.className = 'booknote'; note.innerHTML = `この原稿は，あなたがいま読んでいる物語と同じ歌，同じ音で始まっている．<button class="btn">原稿を閉じる</button>`; o.el.appendChild(note);
    note.querySelector('button')!.addEventListener('click', () => { pageSound(1); o.close(); res(); });
  });
}

/** 終幕：暗転して時計の唸り．3回鳴らしてタイトルへ */
export function endingOverlay(): Promise<void> {
  return new Promise(async res => {
    const e = document.createElement('div'); e.className = 'ending'; e.innerHTML = `<div class="buun">……ブウウ——————ンンン——————ンンンン………………</div>`; app().appendChild(e);
    await clock(3, 3.2); setTimeout(() => { e.remove(); res(); }, 800);
  });
}
