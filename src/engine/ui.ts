// 画面部品：オーバーレイ／トースト／設定／記憶図鑑（証拠カード・用語・人物文書・命題台帳）／索引とバッジ／理解課題／入れ子の本／ミニゲーム代替／結末の選択／終幕
import type { Card, Chapter, Scene, Task, TaskQ, Term, Claim } from '../data/types';
import type { Settings, Progress } from './save';
import { clock, page as pageSound } from './audio';
import { GAME_NAMES } from '../data/scenario';

const app = () => document.getElementById('app')!;

export function overlay(inner: string, cls = 'panel'): { el: HTMLElement; body: HTMLElement; close: () => void } {
  const el = document.createElement('div'); el.className = 'overlay';
  const body = document.createElement('div'); body.className = cls; body.setAttribute('role', 'dialog'); body.setAttribute('aria-modal', 'true'); body.tabIndex = -1; body.innerHTML = inner; el.appendChild(body); app().appendChild(el);
  const prevFocus = document.activeElement as HTMLElement | null;
  // Escape は「閉じる」ボタン（.close / [data-close]）を持つオーバーレイだけを閉じる（課題・ゲームは閉じない）
  const onKey = (e: KeyboardEvent) => { if (e.key !== 'Escape' || !el.isConnected) return; const last = app().querySelectorAll('.overlay'); if (last[last.length - 1] !== el) return; const b = body.querySelector<HTMLButtonElement>('.close,[data-close]'); if (b) { e.preventDefault(); e.stopPropagation(); b.click(); } };
  document.addEventListener('keydown', onKey, true);
  const close = () => { document.removeEventListener('keydown', onKey, true); el.remove(); prevFocus?.focus?.(); };
  queueMicrotask(() => (body.querySelector<HTMLElement>('button,[href],input,[tabindex]') || body).focus());
  return { el, body, close };
}
export function toast(msg: string) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; app().appendChild(t); setTimeout(() => t.remove(), 3500); }

export function settingsPanel(s: Settings, onChange: (s: Settings) => void, onReset: () => void) {
  const seg = (k: keyof Settings, opts: [string, string][]) => `<span class="seg" data-k="${k}">${opts.map(([v, l]) => `<button data-v="${v}" class="${String(s[k]) === v ? 'on' : ''}">${l}</button>`).join('')}</span>`;
  const o = overlay(`<button class="close">閉じる</button><h2>設定</h2>
    <div class="row"><label>本文の向き</label>${seg('mode', [['v', '縦書き'], ['h', '横書き']])}</div>
    <div class="row"><label>文字の大きさ</label>${seg('fs', [['S', '小'], ['M', '中'], ['L', '大']])}</div>
    <div class="row"><label>絵柄</label>${seg('art', [['real', 'A 写実（セピア）'], ['shadow', 'B 影絵']])}</div>
    <div class="row"><label>本文の範囲</label>${seg('text', [['full', '全文（原文をすべて読む）'], ['digest', '抜粋（要所だけ）']])}<span class="small">全文が既定．抜粋は再読や時短用で，読んでも「原文100%」にはなりません</span></div>
    <div class="row"><label>本の小口</label>${seg('edge', [['true', '見せる'], ['false', '隠す']])}<span class="small">物理的な本の厚みのように，全体のどのあたりを読んでいるかを帯で示します（数字は出しません）</span></div>
    <div class="row"><label>音</label>${seg('sound', [['true', 'あり'], ['false', 'なし']])}<input type="range" min="0" max="1" step="0.05" value="${s.volume}" id="vol"><span class="small">上限は控えめに固定．低音が苦手な方は「なし」を</span></div>
    <h3>進捗</h3><div class="row"><button class="btn sub" id="reset">記録を消して最初から</button><span class="small">証拠カード・読了記録・周回数を消します</span></div>
    <p class="small">底本：青空文庫『ドグラ・マグラ』（夢野久作，パブリックドメイン）．原文は改変していません．出典・素材の一覧は CREDITS.md を参照．</p>`);
  o.body.querySelector('.close')!.addEventListener('click', o.close);
  o.body.querySelectorAll('.seg').forEach(sg => sg.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button'); if (!b) return; const k = (sg as HTMLElement).dataset.k as keyof Settings; const v = b.dataset.v!;
    (s as any)[k] = (v === 'true' || v === 'false') ? v === 'true' : v; sg.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); onChange(s);
  }));
  o.body.querySelector('#vol')!.addEventListener('input', e => { s.volume = Number((e.target as HTMLInputElement).value); onChange(s); });
  o.body.querySelector('#reset')!.addEventListener('click', () => { if (confirm('記録を消して最初からにします．よろしいですか？')) { onReset(); o.close(); } });
}

const KIND: Record<string, string> = { perception: '知覚', explanation: '説明', document: '文書', inference: '推測', meta: '作者' };
const TKIND: Record<string, string> = { term: '用語', person: '人物', doc: '文書', place: '場所' };
export function kindLabel(k: string) { return KIND[k] || k }
export function trustStars(t: number) { return '★'.repeat(t) + '☆'.repeat(3 - t) }
const opened = (ch: Chapter, p: Progress) => ch.scenes.some(s => p.reached.includes(s.id));

export function cardHtml(c: Card, owned: boolean) {
  if (!owned) return `<div class="card locked"><h4>？？？</h4><div class="small">まだ手に入れていない</div></div>`;
  return `<div class="card ${c.info ? 'info' : ''}"><h4>${c.title}</h4>
    <div><span class="k fact">${c.info ? '要点' : '事実'}</span>${c.fact}</div>
    <div><span class="k who">発言者</span>${c.who}</div>
    <div><span class="k inf">推測</span>${c.inference}</div>
    <div><span class="k contra">反証</span>${c.contra}</div><div class="src">出典：${c.src}</div></div>`;
}
function termHtml(t: Term) {
  return `<div class="term"><h4><span class="tk">${TKIND[t.kind]}</span>${t.term}${t.reading ? `<small>（${t.reading}）</small>` : ''}</h4>
    <div>${t.inText}</div>${t.quote ? `<div class="quote">${t.quote}</div>` : ''}
    <div class="modern"><span class="era">現代</span>${t.modern}</div>${t.caution ? `<div class="warn">${t.caution}</div>` : ''}<div class="src">出典：${t.src}</div></div>`;
}
function claimHtml(c: Claim) {
  return `<tr><td class="stmt">${c.stmt}</td><td>${kindLabel(c.kind)}：${c.who}<br><span class="trust">${trustStars(c.trust)}</span></td><td>${c.support}</td><td>${c.contra}</td><td class="src">${c.src}</td></tr>`;
}
/** 記憶図鑑：証拠カード／用語／人物・文書／命題台帳．到達した章のぶんだけ開く */
export function codexPanel(chapters: Chapter[], p: Progress, initial: 'cards' | 'terms' | 'people' | 'claims' = 'cards') {
  const o = overlay(`<button class="close">閉じる</button><h2>記憶図鑑</h2>
    <div class="tabs2"><button data-t="cards">証拠カード</button><button data-t="terms">用語</button><button data-t="people">人物・文書</button><button data-t="claims">命題台帳</button></div><div class="codexbody"></div>`, 'panel codex');
  const body = o.body.querySelector('.codexbody')!;
  const render = (t: string) => {
    o.body.querySelectorAll('.tabs2 button').forEach(b => b.classList.toggle('on', (b as HTMLElement).dataset.t === t));
    const chs = chapters.filter(c => opened(c, p)); const locked = chapters.length - chs.length;
    if (t === 'cards') body.innerHTML = `<p class="small">各カードは「事実（誰が見た／言った）」と「推測」「反証」を分けて記録します．事実と推測を分けて持つことが，この物語を読む唯一の武器です．</p>
      ${chapters.map(c => c.cards.length ? `<h3>${c.kicker}　${c.title}</h3><div class="cards">${c.cards.map(x => cardHtml(x, p.cards.includes(x.id))).join('')}</div>` : '').join('')}`;
    else if (t === 'terms' || t === 'people') {
      const pick = (c: Chapter) => c.terms.filter(x => t === 'terms' ? (x.kind === 'term' || x.kind === 'place') : (x.kind === 'person' || x.kind === 'doc'));
      body.innerHTML = `<p class="small">${t === 'terms' ? '作中の語の意味と，現代からの注釈．差別語・虚構の医学には注意書きがあります．' : '登場人物と作中文書．誰が何を書き，誰が何を説明したかを分けて覚えておくための一覧．'}</p>
        ${chs.map(c => pick(c).length ? `<h3>${c.kicker}　${c.title}</h3><div class="terms">${pick(c).map(termHtml).join('')}</div>` : '').join('')}
        ${locked ? `<p class="small">未到達の章の項目 ${locked} 章ぶんは伏せてあります．</p>` : ''}`;
    } else body.innerHTML = `<p class="small">命題台帳（矛盾台帳）：作中の主要な主張を「誰の言葉か・信頼度・支持証拠・反証」で並べます．同じ命題に食い違う証言があるのがこの作品の読みどころです．</p>
        <div class="tablewrap"><table class="claims"><thead><tr><th>命題</th><th>誰の言葉か</th><th>支持</th><th>反証</th><th>出典</th></tr></thead><tbody>
        ${chs.flatMap(c => c.claims).map(claimHtml).join('')}</tbody></table></div>${locked ? `<p class="small">未到達の章の命題 ${locked} 章ぶんは伏せてあります．</p>` : ''}`;
  };
  o.body.querySelectorAll('.tabs2 button').forEach(b => b.addEventListener('click', () => render((b as HTMLElement).dataset.t!)));
  o.body.querySelector('.close')!.addEventListener('click', o.close); render(initial);
}

export function badges(p: Progress, scenes: Scene[], tasks: Task[], pct: number) {
  const reached = scenes.filter(s => p.reached.includes(s.id)).length; const story = reached === scenes.length;
  const done = tasks.filter(t => p.tasks.includes(t.id)).length; const points = tasks.length > 0 && done === tasks.length; const full = pct >= 100;
  return `<div class="badges">
    <div class="badge ${story ? 'on' : ''}"><b>物語版 読了</b>${story ? '達成' : `${reached}/${scenes.length} 場面`}</div>
    <div class="badge ${points ? 'on' : ''}"><b>論点版 読了</b>${points ? '達成' : `理解課題 ${done}/${tasks.length}`}</div>
    <div class="badge ${full ? 'on' : ''}"><b>原文100%</b>${pct.toFixed(1)}% 閲覧（全文）</div>
    <div class="badge"><b>周回</b>${p.loops} 回</div></div>`;
}
export function indexPanel(chapters: Chapter[], p: Progress, pct: number, onJump: (sceneId: string) => void, onFull: (section: string) => void) {
  const scenes = chapters.flatMap(c => c.scenes); const tasks = chapters.filter(c => c.task).map(c => c.task!);
  const o = overlay(`<button class="close">閉じる</button><h2>索引（再読モード）</h2>${badges(p, scenes, tasks, pct)}
    <div class="index">${chapters.map(c => `<h3>${c.kicker}　${c.title}${c.task ? `<span class="st">${p.tasks.includes(c.task.id) ? '課題達成' : '課題未達'}</span>` : ''}<button class="full" data-s="${c.section}">原文全文</button></h3>
      <ol>${c.scenes.map(s => `<li>${p.reached.includes(s.id) ? `<button data-i="${s.id}">${s.title}</button>` : `<span>${s.title}</span>`}<span class="st">${p.reached.includes(s.id) ? '到達済み' : '未到達'}</span></li>`).join('')}</ol>`).join('')}</div>
    <p class="small">到達済みの場面へ戻れます．「原文全文」はその区分の原文を最初から最後まで読めます（原文100%バッジに反映）．</p>`);
  o.body.querySelector('.close')!.addEventListener('click', o.close);
  o.body.querySelectorAll('.index li button').forEach(b => b.addEventListener('click', () => { o.close(); onJump((b as HTMLElement).dataset.i!); }));
  o.body.querySelectorAll('.index button.full').forEach(b => b.addEventListener('click', () => { o.close(); onFull((b as HTMLElement).dataset.s!); }));
}

/** 選択肢の表示順を毎回シャッフルする（データ上の正解位置の偏りで当てられないように．data-i は元の添字）*/
function shuffled(n: number): number[] { const a = Array.from({ length: n }, (_, i) => i); for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function taskPanel(title: string, qs: TaskQ[]): Promise<boolean> {
  return new Promise(res => {
    const o = overlay(`<h2>${title}</h2><p class="small">「正解を当てる」のではなく，「その言葉は誰のものか」「支持する証拠・反証はどれか」を割り当てます．すべて割り当てると判定できます．間違えても解説が出るだけで，選び直して何度でも判定できます．</p>
      <div class="task">${qs.map(q => `<div class="q" data-id="${q.id}"><div class="stmt">${q.stmt}</div><div class="opts">${shuffled(q.opts.length).map(i => `<button data-i="${i}">${q.opts[i]}</button>`).join('')}</div><div class="fb"></div></div>`).join('')}</div>
      <div class="row"><button class="btn" id="judge" disabled>判定する</button><button class="btn" id="go" style="display:none">つづける</button><button class="btn sub" id="skip" style="display:none">解説を読んで，このまま進む（この章の課題は未達成のまま）</button><span class="small" id="cnt"></span></div>`);
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

/** 未実装ミニゲームの代替：自動実演の代わりに要旨を読む（理解を操作技量で遮断しない） */
export function stubGamePanel(game: string, note?: { title: string; lines: string[] }): Promise<void> {
  return new Promise(res => {
    const o = overlay(`<h2>${note?.title || GAME_NAMES[game] || game}</h2>
      <p class="small">ミニゲーム「${GAME_NAMES[game] || game}」は後の版で実装します．いまは自動実演の代わりに要旨を読んで進みます．</p>
      <ol class="gamenote">${(note?.lines || []).map(l => `<li>${l}</li>`).join('')}</ol>
      <div class="row"><button class="btn" id="go">つづける</button></div>`);
    o.body.querySelector('#go')!.addEventListener('click', () => { o.close(); res(); });
  });
}
/** 結末の選択：「私は誰か」．どれを選んでも「その選択自体が実験の手のひらの上」 */
export function choicePanel(note?: { title: string; lines: string[] }): Promise<number> {
  return new Promise(res => {
    const lines = note?.lines || []; const opts = lines.slice(0, 3); const meta = lines.slice(3).join('<br>');
    const o = overlay(`<h2>${note?.title || '私は誰か'}</h2><p class="small">ここまでの証拠カードと命題台帳を思い出して，ひとつ選んでください．</p>
      <div class="choice">${opts.map((l, i) => `<button class="opt" data-i="${i}">${l}</button>`).join('')}</div>
      <div class="meta hidden"><p>${meta}</p><div class="row"><button class="btn" id="go">……時計の音へ</button></div></div>`);
    o.body.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
      o.body.querySelectorAll('.opt').forEach(x => { x.classList.toggle('sel', x === b); (x as HTMLButtonElement).disabled = true; });
      o.body.querySelector('.meta')!.classList.remove('hidden');
      o.body.querySelector('#go')!.addEventListener('click', () => { o.close(); res(Number((b as HTMLElement).dataset.i)); });
    }));
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
