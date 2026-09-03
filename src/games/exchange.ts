// ミニゲーム「電話交換局」：正木博士の脳髄論を操作で体得する．
// 前半：身体各部からの信号を，交換手（脳髄）として正しい相手へ取り次ぐ（脳髄は取り次ぐだけで感じない）
// 後半：交換が乱れ（反射交感の破綻），信号が別の場所へ届く．夢中遊行・複数解釈の発生．
// 即スキップ可．スキップ時も自動実演＋要旨を表示して内容を消さない．
import { plug } from '../engine/audio';

interface Pair { from: string; to: string; quote: string }
const PAIRS: Pair[] = [
  { from: '股が抓られた', to: '股：痛い', quote: '「股を抓ねれば股だけが痛いのですよ」' },
  { from: '蚤が喰った皮膚', to: '皮膚：痒い', quote: '「蚤が喰えばそこだけが痒いのですよ」' },
  { from: '眼が光を受けた', to: '眼：見える', quote: '「私たちは全身が脳髄なのですよ」' },
  { from: '耳が音を受けた', to: '耳：聞こえる', quote: '「お尻でも見たり聞いたりしているのですよ」' },
  { from: '手足が動こうとする', to: '手足：動く', quote: '「あなた方の手足だってチャント物を考えているのですよ」' },
];
const CHAOS = [
  { from: '股が抓られた', to: '耳：聞こえる', note: '痛みが「声」として聞こえる' },
  { from: '眼が光を受けた', to: '手足：動く', note: '眠ったまま歩き出す——夢中遊行' },
  { from: '耳が音を受けた', to: '眼：見える', note: '時計の音が「顔」に見える' },
];

export function playExchange(host: HTMLElement): Promise<'done' | 'skip'> {
  return new Promise(resolve => {
    host.innerHTML = `
      <h2>電話交換局——脳髄は取り次ぐだけ</h2>
      <p class="small">あなたは<b>脳髄＝交換手</b>です．左の「細胞からの呼び出し」を選び，右の「届け先」を選んで取り次いでください．交換手は痛みも痒みも感じません．取り次ぐだけです．</p>
      <div class="exchange">
        <div class="col" id="ex-from"><h4>細胞からの呼び出し</h4></div>
        <div class="board" id="ex-board"><div class="op">交換手：脳髄</div><div class="log" id="ex-log">……回線を開きます……</div><div><div class="meter"><i id="ex-meter" style="width:0"></i></div></div></div>
        <div class="col" id="ex-to"><h4>届け先（反応する細胞）</h4></div>
      </div>
      <div class="skipbar"><span class="small" id="ex-hint">前半：正しく取り次ぐと，論文の言葉が回線に流れます</span><span><button class="btn sub" id="ex-skip">スキップ（自動実演＋要旨）</button> <button class="btn hidden" id="ex-next">つづける</button></span></div>`;
    const fromCol = host.querySelector('#ex-from')!, toCol = host.querySelector('#ex-to')!, log = host.querySelector('#ex-log')!, meter = host.querySelector('#ex-meter') as HTMLElement, board = host.querySelector('#ex-board')!, hint = host.querySelector('#ex-hint')!;
    const skipBtn = host.querySelector('#ex-skip') as HTMLButtonElement, nextBtn = host.querySelector('#ex-next') as HTMLButtonElement;
    let sel: HTMLElement | null = null; let done = 0; let phase = 1; let finished = false;
    const shuffled = [...PAIRS].sort(() => Math.random() - .5);
    PAIRS.forEach(p => { const b = document.createElement('div'); b.className = 'jack'; b.textContent = p.from; b.dataset.k = p.from; fromCol.appendChild(b); });
    shuffled.forEach(p => { const b = document.createElement('div'); b.className = 'jack'; b.textContent = p.to; b.dataset.k = p.to; toCol.appendChild(b); });
    const add = (html: string) => { const d = document.createElement('div'); d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; };

    fromCol.addEventListener('click', e => {
      const t = (e.target as HTMLElement).closest('.jack') as HTMLElement | null; if (!t || t.classList.contains('done') || phase !== 1) return;
      sel?.classList.remove('sel'); sel = t; t.classList.add('sel');
    });
    toCol.addEventListener('click', e => {
      const t = (e.target as HTMLElement).closest('.jack') as HTMLElement | null; if (!t || !sel || t.classList.contains('done') || phase !== 1) return;
      const pair = PAIRS.find(p => p.from === sel!.dataset.k)!;
      if (pair.to === t.dataset.k) {
        plug(true); sel.classList.remove('sel'); sel.classList.add('done'); t.classList.add('done'); sel = null; done++;
        add(`<span class="ok">接続：${pair.from} → ${pair.to}</span><br><span class="quote">${pair.quote}</span>`); meter.style.width = `${done / PAIRS.length * 100}%`;
        if (done === PAIRS.length) startChaos();
      } else { plug(false); t.classList.add('wrong'); setTimeout(() => t.classList.remove('wrong'), 400); add(`<span class="ng">混線．交換手は「痛い」かどうか分からない——分かるのは細胞だけ．</span>`); }
    });

    function startChaos() {
      phase = 2; board.classList.add('chaos'); hint.textContent = '後半：交換が乱れます．あなたは何もできません．';
      add(`<br><span class="ng">……反射交感の乱れ……回線が勝手に繋ぎ変わる……</span>`);
      let i = 0; const iv = setInterval(() => {
        const c = CHAOS[i++]; if (!c) { clearInterval(iv); finish(); return }
        plug(false); add(`<span class="ng">誤接続：${c.from} → ${c.to}</span>　<span class="quote">${c.note}</span>`);
      }, 1500);
    }
    function finish() {
      if (finished) return; finished = true; board.classList.remove('chaos');
      add(`<br><span class="quote">「……脳髄は物を考える処に非ず……」</span><br><span class="small">交換が乱れると，身体は本人の知らないうちに動き，同じ信号が別の意味で届く——正木はここから夢・精神病・心理遺伝を説明しようとします．</span>`);
      nextBtn.classList.remove('hidden'); skipBtn.classList.add('hidden'); nextBtn.onclick = () => resolve('done');
    }
    skipBtn.onclick = () => {
      // 自動実演：全接続→乱れ→要旨．内容は消さない
      phase = 0; fromCol.querySelectorAll('.jack').forEach(j => j.classList.add('done')); toCol.querySelectorAll('.jack').forEach(j => j.classList.add('done'));
      PAIRS.forEach(p => add(`<span class="ok">接続：${p.from} → ${p.to}</span>　<span class="quote">${p.quote}</span>`)); meter.style.width = '100%';
      CHAOS.forEach(c => add(`<span class="ng">誤接続：${c.from} → ${c.to}</span>　<span class="quote">${c.note}</span>`));
      add(`<br><b>正木の要旨（3行）</b><br>一，考えたり感じたりするのは全身の細胞である．<br>二，脳髄はその間を取り次ぐ交換局にすぎない．<br>三，交換が乱れると夢中遊行のように身体が勝手に動く——ここから夢・精神病・心理遺伝を説明する．`);
      finished = true; nextBtn.classList.remove('hidden'); skipBtn.classList.add('hidden'); nextBtn.onclick = () => resolve('skip');
    };
  });
}
