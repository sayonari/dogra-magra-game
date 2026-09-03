export interface Para { line: number; html?: string; plain?: string; indent?: number; box?: boolean; center?: boolean; type?: 'pagebreak'; cls?: string }
export interface SectionText { id: string; title: string; kind: string; line_start: number; line_end: number; paragraphs: Para[] }
export type SourceKind = 'perception' | 'explanation' | 'document' | 'inference' | 'meta';
export interface Source { who: string; kind: SourceKind; trust: 1 | 2 | 3; note: string }
export interface Block { section: string; from: number; to: number; heading?: string[] }
export type GameId = 'exchange' | 'saimon' | 'totsuki' | 'emaki' | 'assistant' | 'trial' | 'whoismad' | 'choice';
export interface Scene {
  id: string; title: string; bg: string; depth: number;      // depth: 入れ子の深さ（0=語りの現在，1=作中文書，2=文書内の文書）
  source: Source; blocks: Block[]; summary: string; notes: { era1926: string; era1935: string; modern: string; roles?: string };
  style?: 'paper' | 'newspaper' | 'letter' | 'scroll';        // 紙面の見た目（既定 paper）
  event?: 'card' | 'book' | 'game' | 'task';                  // 場面末尾の出来事．task＝章の理解課題
  cards?: string[];                                           // 場面末尾で得る証拠カード id
  game?: GameId; gameNote?: { title: string; lines: string[] }; // ミニゲーム．未実装のものは gameNote（自動実演の代わりの要旨3〜5行）を表示
}
export interface Card { id: string; title: string; fact: string; who: string; inference: string; contra: string; src: string; info?: boolean }
export interface TaskQ { id: string; stmt: string; opts: string[]; answer: number; fb: string }
export interface Task { id: string; title: string; qs: TaskQ[] }
export interface Term { id: string; term: string; reading?: string; kind: 'term' | 'person' | 'doc' | 'place'; inText: string; quote?: string; src: string; modern: string; caution?: string }
export interface Claim { id: string; stmt: string; who: string; kind: SourceKind; trust: 1 | 2 | 3; support: string; contra: string; src: string }
export interface Chapter { id: string; title: string; section: string; kicker: string; scenes: Scene[]; cards: Card[]; task?: Task; terms: Term[]; claims: Claim[] }
