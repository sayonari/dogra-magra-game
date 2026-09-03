# HANDOFF - 2026-09-03 21:40

## 使用ツール
Claude Code（Fable 5.1）＋並列サブエージェント（章再修正 13 本）＋ Codex（gpt-5.6-sol）＋ claude-in-chrome

## 現在のタスクと進捗
- [x] **西村方針（Q1〜Q4）による再修正**：全 13 章（14 ファイル）．原文の語の復元 64 件／Gemini 単独根拠の撤回 8 件／era1935 の参考文献付き書き直し 83 件．記録は `analysis/reviews/factcheck/applied_*.md` 末尾「2026-09-03 西村方針による再修正」．commit 00ca9ec，docs/ push 済み，Drive 同期済み
- [x] `.spec/REFERENCES.md` 新設（略号表＋史実メモ＋一般的史実 17 項目），`.spec/AUTHORING.md` に規則 3・4 と「西村方針」節
- [x] **全文モードを既定に＋本の小口**（西村の指摘）：`src/main.ts` の `ranges()` で場面を区分内の連続範囲に敷き詰め，設定「本文の範囲」「本の小口」を追加（`save.ts`／`ui.ts`／`styles.css`）．Codex 賛成（scratchpad `codex_fulltext_a.md`，要旨は SPEC.md）
- [x] 第 2 報 `.output/2026-09-03_ファクトチェック再修正報告.html` を open 済み
- [ ] **西村の宿題**：REFERENCES.md の書誌・一般的史実の現物確認，S11a-7 の「本人」の読み
- [ ] 初見者テスト，M3（人物・物品画像，BGM），M4（ミニゲーム実装）

## 試したこと・結果
- 再修正は「共通指示 `analysis/reviews/factcheck/_reedit_instructions.md`」＋章ごとエージェントで並列．Gemini 撤回は S06・S11a・S13 のみで，他章は Gemini 指摘が原文一致の訂正か Codex と重複
- エージェントが「（史実メモ外：要確認）」印を 12 箇所ゲーム内に残した → 一般的史実を REFERENCES.md に追記して親側で印を外した
- 全章 `verify_scenario.py` OK，`tsc` OK，check.mjs（カード重複なし・参照欠落なし）

## 次のセッションで最初にやること
1. 先生の REFERENCES.md 確認結果を受けて，誤りがあれば該当 era1935 を直す．復元候補（TODO 参照）は先生の指示があれば復元
2. 初見者テストの準備（TODO 参照）
3. 今後の外部査読は `analysis/factcheck.sh codex <CH>` のみ（Gemini は回さない）

## 注意点・ブロッカー
- 注釈者の文で原文の語を言い換えない．era1935 は REFERENCES.md の範囲で書く（`.spec/AUTHORING.md` 規則 3・4）
- 章題を変えたら `analysis/sections.json` の title も揃える．公開は `GH_PAGES=1 npm run build` → docs/ を push
- API キー：`~/.config/dogra/gemini_api_key`（画像生成用）．`assets/generated/` は git/Drive 同期外
