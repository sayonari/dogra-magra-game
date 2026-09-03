# HANDOFF - 2026-09-03 15:30

## 使用ツール
Claude Code（Opus 5）／レビュー：Gemini CLI，Codex CLI（gpt-5.6-sol）／動作確認：claude-in-chrome

## 現在のタスクと進捗
- [x] M0 立ち上げ・構造解析・SPEC v1.0
- [x] M1 理解検証用縦切り：実装完了・Chrome で全行程確認・GitHub push・Pages 有効化（https://sayonari.github.io/dogra-magra-game/）
- [ ] M1 残り：Nano Banana テスト画像3枚（API キー待ち）／CREDITS.md／初見者テスト（合格判定）
- [ ] M2 着手前：Codex/Gemini に M1 のプレイ体験レビュー（`.output/2026-09-03_M1動作確認.html` と `src/data/scenario_m1.ts` を渡す）

## 試したこと・結果
- `src/engine/reader.ts`：flow を clip 用 `.view` に入れ，可視判定を offset ベースに変更（KNOWLEDGE.md 参照）
- 本文 JSON は遅延 glob で区分ごとチャンク化．初期ロードは S01/S02/S03/S04/S07 のみ
- `docs/` は `GH_PAGES=1 npm run build` で生成（base `/dogra-magra-game/`）．ローカル確認は `npm run dev`

## 次のセッションで最初にやること
1. Pages の公開状態を確認（`gh api repos/sayonari/dogra-magra-game/pages --jq .status` が built なら URL を開く）
2. `~/.config/dogra/gemini_api_key` があれば Nano Banana で room7/clock/manuscript を生成し `public/img/real/*.webp` に置換，`assets/LEDGER.csv` に記録
3. M1 のレビュー（Codex/Gemini）→ 指摘反映 → M2（全13区分の場面スクリプト）設計へ

## 注意点・ブロッカー
- ゲーム内引用は原文 JSON 経由のみ．`scenario_m1.ts` の要旨・注釈は注釈者の言葉として書き，作中の主張と区別している（公開前に外部レビュー）
- 交換局ミニゲームの引用文（「股を抓ねれば股だけが痛いのですよ」等）は S07 行1063–1108 と一致確認済み．変更時は再照合
- `confirm()` を使う「はじめから」は Chrome 自動化を止める
