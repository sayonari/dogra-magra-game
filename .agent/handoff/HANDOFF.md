# HANDOFF - 2026-09-03 14:40

## 使用ツール
Claude Code（Fable 5.1）＋ claude-in-chrome＋並列サブエージェント（章データ執筆 8 本）＋ Codex（gpt-5.6-sol，エンジン監査）

## 現在のタスクと進捗
- [x] **M2 全章通し版 完成・公開**（https://sayonari.github.io/dogra-magra-game/ ，commit 22f159c）：14 章ファイル・69 場面・カード 47・課題 13・用語／人物／文書・命題台帳・原文全文モード・3 バッジ・索引再読・終幕
- [x] Codex エンジン監査 14 件中 12 件反映（`analysis/reviews/codex_review_m2_engine.md`）．未対応：保存失敗通知，課題の radio 化
- [x] 背景 10 枚生成・組込み，CREDITS.md，STYLE.md 追記
- [ ] 章データの出典ファクトチェック（Codex/Gemini → 西村確認），エージェント報告の要検討点（TODO 参照），初見者テスト
- [ ] M3（人物・物品画像，BGM），M4（ミニゲーム実装：saimon/whoismad/totsuki/emaki/assistant/trial は stub 表示）

## 試したこと・結果
- Chrome 自動操作で S02→終章まで通し：全場面到達，物語版バッジ達成，周回 1，終幕後に索引が開く．例外なし
- つづきから：場面＋頁を復元（`progress.page`）．要旨・注釈タブでは頁送りキー無効．Escape で設定／図鑑／索引／全文を閉じる
- 原文全文モードで S05 を 26 頁送って閲覧 68%（同期報告に変えてから正しく増える）

## 次のセッションで最初にやること
1. ユーザーの通しプレイ感想を聞く（章導入・課題の難度・stub ゲームの要旨表示で十分か）
2. ファクトチェック：`src/data/chapters/*.ts` の notes/terms/claims を Codex・Gemini に検証させ，指摘を `analysis/reviews/` に保存
3. `.spec/TODO.md` 優先度高の「要検討点」を処理（S13 課題順序，S11 境界，S09 desc）

## 注意点・ブロッカー
- API キー：`~/.config/dogra/gemini_api_key`．`assets/generated/` は git/Drive 同期外
- 公開は `GH_PAGES=1 npm run build` → docs/ を push．検証は `npx tsc --noEmit -p .` と `python3 analysis/verify_scenario.py src/data/chapters/*.ts`
- Chrome 自動テストはタブを前面に（背景では rAF 停止）．`confirm()` を出す「はじめから」は押さず「つづきから」／索引から入る
