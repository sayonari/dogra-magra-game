// 縦書き／横書きの頁送り本文レンダラ．DOM のみ．行ピッチの整数倍で頁幅を決め，列が頁境界を跨がないようにする．
import type { Para } from '../data/types';
export interface ReaderOpts { onPage?: (visibleLines: number[], page: number, total: number) => void; depth?: number }

export class Reader {
  root: HTMLElement; view: HTMLElement; flow: HTMLElement; heading?: HTMLElement; page = 0; total = 1; private pageSize = 0; private opts: ReaderOpts; private paras: Para[] = []; private ro: ResizeObserver;
  constructor(root: HTMLElement, opts: ReaderOpts = {}) {
    this.root = root; this.opts = opts; this.view = document.createElement('div'); this.view.className = 'view'; this.flow = document.createElement('div'); this.flow.className = 'flow'; this.view.appendChild(this.flow); root.appendChild(this.view);
    this.ro = new ResizeObserver(() => this.layout()); this.ro.observe(root);
  }
  set(paras: Para[], heading?: string[]) {
    this.paras = paras; this.flow.innerHTML = ''; this.heading?.remove(); this.heading = undefined;
    if (heading?.length) { this.heading = document.createElement('div'); this.heading.className = 'heading'; this.heading.innerHTML = heading.map(h => `<div>${h}</div>`).join(''); this.root.appendChild(this.heading); }
    for (const p of paras) {
      if (p.type === 'pagebreak') continue;
      const el = document.createElement('p'); el.innerHTML = p.html || ''; el.dataset.line = String(p.line);
      if (p.indent) el.classList.add('indent' + Math.min(p.indent, 5)); if (p.box) el.classList.add('box'); if (p.cls) el.classList.add(p.cls);
      this.flow.appendChild(el);
    }
    this.page = 0; this.layout();
  }
  private vertical() { return document.body.dataset.mode !== 'h' }
  layout() {
    const cs = getComputedStyle(this.root); const fs = parseFloat(cs.fontSize); const lh = parseFloat(cs.lineHeight) || fs * 2; const pitch = lh;
    const headSpace = this.heading ? (this.vertical() ? this.heading.offsetWidth + fs : this.heading.offsetHeight + fs * .5) : 0;
    if (this.vertical()) {
      const avail = this.root.clientWidth - fs * 1.2 - headSpace; this.pageSize = Math.max(pitch, Math.floor(avail / pitch) * pitch);
      Object.assign(this.view.style, { top: `${fs * .7}px`, bottom: `${fs * .7}px`, right: `${fs * .6 + headSpace}px`, left: 'auto', width: `${this.pageSize}px`, height: 'auto' }); // 幅を頁幅ぴったりにし，次頁の列が端に覗かないようにする
      this.flow.style.height = '100%'; this.flow.style.top = '0'; this.flow.style.right = '0'; this.flow.style.left = 'auto'; this.flow.style.width = 'max-content';
      const totalW = this.flow.scrollWidth; this.total = Math.max(1, Math.ceil(totalW / this.pageSize));
    } else {
      const avail = this.root.clientHeight - fs * 1.2 - headSpace; this.pageSize = Math.max(pitch, Math.floor(avail / pitch) * pitch);
      Object.assign(this.view.style, { top: `${fs * .6 + headSpace}px`, bottom: 'auto', height: `${this.pageSize}px`, left: `${fs * 1.5}px`, right: `${fs * 1.5}px`, width: 'auto' });
      this.flow.style.width = '100%'; this.flow.style.left = '0'; this.flow.style.top = '0'; this.flow.style.right = 'auto'; this.flow.style.height = 'max-content';
      const totalH = this.flow.scrollHeight; this.total = Math.max(1, Math.ceil(totalH / this.pageSize));
    }
    this.page = Math.min(this.page, this.total - 1); this.apply();
  }
  private apply() {
    // 縦書き：flow の右端を root の右端に揃え，頁数×頁幅だけ右へずらして左の列を見せる
    this.flow.style.transform = this.vertical() ? `translateX(${this.page * this.pageSize}px)` : `translateY(${-this.page * this.pageSize}px)`;
    this.root.classList.add('paged');
    this.report(); // 同期で報告（背景タブでは rAF が止まり閲覧記録が漏れるため）
  }
  private report() {
    const vis: number[] = []; const ps = this.pageSize;
    if (this.vertical()) { const W = this.flow.scrollWidth; const lo = W - (this.page + 1) * ps, hi = W - this.page * ps;
      this.flow.querySelectorAll('p').forEach(p => { const l = p.offsetLeft, r = l + p.offsetWidth; if (r > lo && l < hi) vis.push(Number(p.dataset.line)); });
    } else { const lo = this.page * ps, hi = (this.page + 1) * ps;
      this.flow.querySelectorAll('p').forEach(p => { const t = p.offsetTop, b = t + p.offsetHeight; if (b > lo && t < hi) vis.push(Number(p.dataset.line)); }); }
    this.opts.onPage?.(vis, this.page, this.total);
  }
  next(): boolean { if (this.page >= this.total - 1) return false; this.page++; this.apply(); return true }
  prev(): boolean { if (this.page <= 0) return false; this.page--; this.apply(); return true }
  atEnd() { return this.page >= this.total - 1 }
  /** 場面変更・全文モード終了時に呼ぶ（ResizeObserver を切る）*/
  destroy() { this.ro.disconnect(); }
  /** 途中の頁から再開（レイアウト後に呼ぶ）*/
  goPage(p: number) { this.page = Math.max(0, Math.min(p, this.total - 1)); this.apply(); }
}
