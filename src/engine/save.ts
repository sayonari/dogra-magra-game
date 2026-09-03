// セーブ／設定（localStorage）．3種の読了判定を別々に記録する．
export interface Settings { mode: 'v'|'h'; fs: 'S'|'M'|'L'; art: 'real'|'shadow'; sound: boolean; volume: number }
export interface Progress {
  reached: string[];                    // 到達した場面 id（物語版）
  read: Record<string, number[]>;       // 原文閲覧：section id → 閲覧済み行番号（原文100%）
  tasks: string[];                      // 達成した理解課題 id（論点版）
  cards: string[];                      // 取得した証拠カード
  loops: number;                        // 結末到達回数（再読モード解禁）
  last?: string;                        // 最後の場面
  page?: number;                        // 最後の場面の頁（つづきから用）
}
const KS = 'dogra.settings.v1', KP = 'dogra.progress.v1';
export const defaultSettings: Settings = { mode: 'v', fs: 'M', art: 'real', sound: true, volume: 0.6 };
export function loadSettings(): Settings { try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KS) || '{}') } } catch { return { ...defaultSettings } } }
export function saveSettings(s: Settings) { try { localStorage.setItem(KS, JSON.stringify(s)) } catch {} }
const empty = (): Progress => ({ reached: [], read: {}, tasks: [], cards: [], loops: 0 });
/** 保存値の実行時検証：壊れた localStorage でも起動できるよう，項目ごとに既定値へ戻す */
function sanitize(x: any): Progress {
  const p = empty(); if (!x || typeof x !== 'object') return p;
  const strs = (v: any) => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : [];
  p.reached = strs(x.reached); p.tasks = strs(x.tasks); p.cards = strs(x.cards);
  if (x.read && typeof x.read === 'object') for (const [k, v] of Object.entries(x.read)) if (/^S\d\d$/.test(k) && Array.isArray(v)) p.read[k] = [...new Set(v.map(Number).filter(n => Number.isInteger(n) && n > 0))].sort((a, b) => a - b);
  p.loops = Number.isInteger(x.loops) && x.loops >= 0 ? x.loops : 0;
  if (typeof x.last === 'string') p.last = x.last; if (Number.isInteger(x.page) && x.page >= 0) p.page = x.page;
  return p;
}
export function loadProgress(): Progress { try { return sanitize(JSON.parse(localStorage.getItem(KP) || '{}')) } catch { return empty() } }
export function saveProgress(p: Progress) { try { localStorage.setItem(KP, JSON.stringify(p)) } catch {} }
export function resetProgress() { try { localStorage.removeItem(KP) } catch {} }
export function markRead(p: Progress, section: string, lines: number[]) {
  const set = new Set(p.read[section] || []); lines.forEach(l => set.add(l)); p.read[section] = [...set].sort((a, b) => a - b);
}
