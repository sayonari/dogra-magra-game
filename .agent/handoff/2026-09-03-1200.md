# HANDOFF - 2026-09-03 12:00

## 使用ツール
Claude Code（Opus 5）／レビュー：Gemini CLI 0.55，Codex CLI 0.147（gpt-5.6-sol）

## 現在のタスクと進捗
- [x] M0 立ち上げ：プロジェクト構築・青空文庫原文取得（42.3万字）・13区分＋S11 11サブ区分の構造解析・SPEC v0.1→Gemini/Codex レビュー→v0.2・計画書 HTML（`.output/2026-09-03_実装計画書.html`）
- [ ] SPEC v1.0 確定：西村の確認事項（SPEC §10）の回答待ち
- [ ] M1 理解検証用縦切り（TODO.md 優先度高）

## 試したこと・結果
- Codex は新規フォルダだと "Not inside a trusted directory" で失敗 → `--skip-git-repo-check` で成功
- 章見出しは青空文庫の「見出し」注記ではなく「５段階大きな文字」注記で抽出できた
- Gemini と Codex で周回設計の推奨が対立 → Codex 案採用（理由は KNOWLEDGE.md）

## 次のセッションで最初にやること
1. SPEC §10 の確認事項の回答を反映して v1.0 に
2. `analysis/aozora2json.py` を書き S01/S02/S04/S07 を JSON 化
3. Vite+TS 骨組み＋DOM 縦書きエンジン＋時計音 Web Audio

## 注意点・ブロッカー
- GEMINI_API_KEY 未設定（画像生成自動化に必要）．Suno は解約済みの可能性
- 原文 `.references/aozora/` は改変禁止．ゲーム内本文は自動変換のみ
- 精神医学注釈は三時点分離＋公開前外部レビュー必須
