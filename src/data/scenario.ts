// 章データの集約：src/data/chapters/S*.ts を id 順に並べ，場面・カード・用語・命題・課題を平坦化する
import type { Chapter, Scene, Card, Term, Claim, Task } from './types';
const mods = import.meta.glob('./chapters/S*.ts', { eager: true }) as Record<string, { chapter: Chapter }>;
export const chapters: Chapter[] = Object.keys(mods).sort().map(k => mods[k].chapter);
export const scenes: Scene[] = chapters.flatMap(c => c.scenes);
export const cards: Card[] = chapters.flatMap(c => c.cards);
export const terms: Term[] = chapters.flatMap(c => c.terms);
export const claims: Claim[] = chapters.flatMap(c => c.claims);
export const tasks: Task[] = chapters.filter(c => c.task).map(c => c.task!);
export function chapterOf(sceneId: string): Chapter { return chapters.find(c => c.scenes.some(s => s.id === sceneId))! }
export function sceneIndex(sceneId: string): number { return scenes.findIndex(s => s.id === sceneId) }
export const GAME_NAMES: Record<string, string> = { exchange: '電話交換局', saimon: '外道祭文（節回し）', whoismad: '誰が狂人か', totsuki: '十月十日', emaki: '絵巻物照合', assistant: '助手モード（時系列の再構成）', trial: '証拠カード対審', choice: '結末の選択' };
