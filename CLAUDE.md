- セッション開始時に共通ルールである、AGENTS.mdを必ず読み込むこと。
- 読み込んだことを最初に報告すること
- 以下は Claude Code固有の差分のみ記載する

## 本プロジェクトの正本アーカイブ先（Google Drive）
- `/Users/sayonari/Library/CloudStorage/GoogleDrive-sayonari@gmail.com/マイドライブ/nishimura/work/同人活動/ドグラマグラ_ゲーム化`
- 成果物・記録は作業の区切りごとに `.agent/scripts/sync_to_drive.sh` で同期すること
- 生成画像・音源の生データ（assets/ 配下の大容量ファイル）は Drive 同期の対象外．完成ビルド（.output/）のみ同期

## 本プロジェクト固有ルール
- 原文は `.references/aozora/` に置く（改変禁止・参照専用）．ゲーム内に引用する本文は必ず原文と一致させること（ハルシネーション禁止）
- ゲーム内で提示する精神医学・文学的解説は「作中の主張」と「現代の知見／注釈」を明確に区別して書く
- 計画・仕様の大きな変更は codex / gemini によるセカンドオピニオンを取ってから確定する
