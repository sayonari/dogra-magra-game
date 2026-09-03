export interface Para { line: number; html?: string; plain?: string; indent?: number; box?: boolean; center?: boolean; type?: 'pagebreak'; cls?: string }
export interface SectionText { id: string; title: string; kind: string; line_start: number; line_end: number; paragraphs: Para[] }
export type SourceKind = 'perception' | 'explanation' | 'document' | 'inference' | 'meta';
export interface Source { who: string; kind: SourceKind; trust: 1 | 2 | 3; note: string }
export interface Block { section: string; from: number; to: number; heading?: string[] }
export interface Scene {
  id: string; title: string; bg: string; depth: number;      // depth: 入れ子の深さ（0=語りの現在，1=作中文書）
  source: Source; blocks: Block[]; summary: string; notes: { era1926: string; era1935: string; modern: string; roles?: string };
  event?: 'card' | 'book' | 'game:exchange' | 'task' | 'clock'; cards?: string[];
}
export interface Card { id: string; title: string; fact: string; who: string; inference: string; contra: string; src: string; info?: boolean }
