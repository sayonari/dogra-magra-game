# HANDOFF - 2026-09-03 17:20

## 使用ツール
Claude Code（Fable 5.1）＋並列サブエージェント（章校閲 13 本）＋ Codex（gpt-5.6-sol）／Gemini CLI（ファクトチェック）＋ claude-in-chrome

## 現在のタスクと進捗
- [x] **章データの出典ファクトチェック反映**：全 13 章（14 ファイル）に Codex＋Gemini の指摘 235 件を反映（採用 211・一部採用 17・自主修正 7・全面不採用 1）．採否は `analysis/reviews/factcheck/applied_*.md`，レビュー原文は同フォルダの `codex_*.md`／`gemini_*.md`
- [x] 証拠カード id 重複（S09/S11a の `ten`，S03/S11b の `mirror`）を `S11a_ten`／`S11b_mirror` に改名．S13 章題と sections.json を「時計の音とブウウン」に統一
- [x] 全章 `verify_scenario.py` OK，`tsc` OK，`GH_PAGES=1 npm run build` → docs/ 更新・push
- [ ] **西村確認待ち**：`.output/2026-09-03_ファクトチェック反映報告.html` の「確認したい点」（章横断 4 件＋章ごと約 30 件）
- [ ] 初見者テスト，M3（人物・物品画像，BGM），M4（ミニゲーム実装）

## 試したこと・結果
- Codex は usage limit で S10〜S13 が空出力 → 16:41 に自動再実行して全章取得．Gemini は S10 が「該当なし」
- 校閲エージェントはレビューの事実誤認（S11a 弥勒像，S13 年齢差）を原文で弾いた．現代知見の指摘は断定を弱める処理で統一
- 反映後の機械検査（scratchpad の check.mjs 方式：カード参照・answer 範囲・`<q>` 外の差別語）で残るのは用語見出し・原文章題・caution のメタ言及のみ

## 次のセッションで最初にやること
1. 報告 HTML の「確認したい点」への西村回答を受け，章横断の方針（「狂人」語，課題文の書式，era1935 の参考文献，場面題の差別語）を AUTHORING.md に追記してから各章へ反映
2. 反映後は `python3 analysis/verify_scenario.py src/data/chapters/*.ts` と `npx tsc --noEmit -p .`，ビルド→push→`sync_to_drive.sh`
3. 初見者テストの準備（TODO 参照）

## 注意点・ブロッカー
- 章題を変えたら `analysis/sections.json` の title も揃える（校閲エージェントは他ファイルを触らない）
- 公開は `GH_PAGES=1 npm run build` → docs/ を push．Chrome 自動テストはタブ前面で，「はじめから」（confirm）は押さない
- API キー：`~/.config/dogra/gemini_api_key`．`assets/generated/` は git/Drive 同期外
