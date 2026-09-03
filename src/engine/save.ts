// セーブ／設定（localStorage）．3種の読了判定を別々に記録する．
export interface Settings { mode: 'v'|'h'; fs: 'S'|'M'|'L'; art: 'real'|'shadow'; sound: boolean; volume: number }
export interface Progress {
  reached: string[];                    // 到達した場面 id（物語版）
  read: Record<string, number[]>;       // 原文閲覧：section id → 閲覧済み行番号（原文100%）
  tasks: string[];                      // 達成した理解課題 id（論点版）
  cards: string[];                      // 取得した証拠カード
  loops: number;                        // 結末到達回数（再読モード解禁）
  last?: string;                        // 最後の場面
}
const KS = 'dogra.settings.v1', KP = 'dogra.progress.v1';
export const defaultSettings: Settings = { mode: 'v', fs: 'M', art: 'real', sound: true, volume: 0.6 };
export function loadSettings(): Settings { try { return { ...defaultSettings, ...JSON.parse(localStorage.getItem(KS) || '{}') } } catch { return { ...defaultSettings } } }
export function saveSettings(s: Settings) { try { localStorage.setItem(KS, JSON.stringify(s)) } catch {} }
export function loadProgress(): Progress { try { return { reached: [], read: {}, tasks: [], cards: [], loops: 0, ...JSON.parse(localStorage.getItem(KP) || '{}') } } catch { return { reached: [], read: {}, tasks: [], cards: [], loops: 0 } } }
export function saveProgress(p: Progress) { try { localStorage.setItem(KP, JSON.stringify(p)) } catch {} }
export function resetProgress() { try { localStorage.removeItem(KP) } catch {} }
export function markRead(p: Progress, section: string, lines: number[]) {
  const set = new Set(p.read[section] || []); lines.forEach(l => set.add(l)); p.read[section] = [...set].sort((a, b) => a - b);
}
