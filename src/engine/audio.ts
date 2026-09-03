// Web Audio による音（柱時計「ブウウ——ンンン」・環境音・頁音）．外部音源に依存しない．
// 低周波を強くしすぎない／音量上限／ミュートを必ず持つ（アクセシビリティ）．
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambient: { stop: () => void } | null = null;
let enabled = true; let volume = 0.6;
const CAP = 0.5; // 上限

function ac(): AudioContext {
  if (!ctx) { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); master = ctx.createGain(); master.gain.value = enabled ? volume * CAP : 0; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
export function setAudio(on: boolean, vol: number) { enabled = on; volume = vol; if (master) master.gain.setTargetAtTime(on ? vol * CAP : 0, ac().currentTime, 0.05); }
export function unlock() { try { ac() } catch {} }

/** 柱時計の唸り：ブウウ——ンンン．strike=打音，hum=残る唸り */
export function clock(times = 1, interval = 3.2): Promise<void> {
  return new Promise(res => {
    let c: AudioContext; try { c = ac() } catch { res(); return }
    const t0 = c.currentTime;
    for (let i = 0; i < times; i++) strike(c, t0 + i * interval);
    setTimeout(res, (times * interval) * 1000);
  });
}
function strike(c: AudioContext, t: number) {
  const g = c.createGain(); g.gain.value = 0; g.connect(master!);
  // 鐘の部分音（基音 98Hz，非整数倍音で金属感）
  const partials = [[1, 1], [2.0, .5], [2.76, .35], [4.1, .18], [5.43, .12]];
  partials.forEach(([r, a]) => {
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 98 * r;
    const og = c.createGain(); og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(a * .35, t + .02); og.gain.exponentialRampToValueAtTime(0.0008, t + 2.6 + r * .3);
    o.connect(og); og.connect(g); o.start(t); o.stop(t + 4);
  });
  // 唸り「ンンン」：低い二音のうねり（ビート）＋ゆっくりしたピッチ揺れ
  [55, 57.5].forEach(f => {
    const o = c.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(f, t); o.frequency.linearRampToValueAtTime(f * .96, t + 3);
    const og = c.createGain(); og.gain.setValueAtTime(0, t + .1); og.gain.linearRampToValueAtTime(.22, t + .6); og.gain.linearRampToValueAtTime(0.0001, t + 3.4);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400;
    o.connect(lp); lp.connect(og); og.connect(g); o.start(t); o.stop(t + 3.6);
  });
  g.gain.setValueAtTime(1, t);
}

/** 環境音：病室の低い唸り＋かすかな風（無音に近い）*/
export function startAmbient() {
  if (ambient) return; let c: AudioContext; try { c = ac() } catch { return }
  const g = c.createGain(); g.gain.value = 0; g.connect(master!);
  const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 50;
  const og = c.createGain(); og.gain.value = .06; o.connect(og); og.connect(g);
  const buf = c.createBuffer(1, c.sampleRate * 4, c.sampleRate); const d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
  const n = c.createBufferSource(); n.buffer = buf; n.loop = true;
  const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
  const ng = c.createGain(); ng.gain.value = .5; n.connect(lp); lp.connect(ng); ng.connect(g);
  const lfo = c.createOscillator(); lfo.frequency.value = .07; const lg = c.createGain(); lg.gain.value = .25; lfo.connect(lg); lg.connect(ng.gain);
  o.start(); n.start(); lfo.start(); g.gain.linearRampToValueAtTime(.35, c.currentTime + 3);
  ambient = { stop: () => { g.gain.linearRampToValueAtTime(0, c.currentTime + 1.5); setTimeout(() => { o.stop(); n.stop(); lfo.stop() }, 1600); ambient = null; } };
}
export function stopAmbient() { ambient?.stop() }

/** 頁をめくる音：短い擦過ノイズ．depth=入れ子の深さ（深いほど籠る）*/
export function page(depth = 0) {
  let c: AudioContext; try { c = ac() } catch { return }
  const t = c.currentTime; const buf = c.createBuffer(1, c.sampleRate * .18, c.sampleRate); const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const s = c.createBufferSource(); s.buffer = buf; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2400 / (1 + depth); f.Q.value = .7;
  const g = c.createGain(); g.gain.value = .12; s.connect(f); f.connect(g); g.connect(master!); s.start(t);
}
/** 交換局：接続音／混線音 */
export function plug(ok: boolean) {
  let c: AudioContext; try { c = ac() } catch { return }
  const t = c.currentTime; const o = c.createOscillator(); o.type = ok ? 'square' : 'sawtooth'; o.frequency.setValueAtTime(ok ? 660 : 180, t); if (!ok) o.frequency.exponentialRampToValueAtTime(60, t + .4);
  const g = c.createGain(); g.gain.setValueAtTime(.08, t); g.gain.exponentialRampToValueAtTime(.0005, t + (ok ? .15 : .45)); o.connect(g); g.connect(master!); o.start(t); o.stop(t + .5);
}
