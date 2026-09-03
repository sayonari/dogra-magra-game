#!/bin/bash
# 本プロジェクトの整理済みデータを Google Drive（自動バックアップ領域）へ同期する
set -e
SRC="$(cd "$(dirname "$0")/../.." && pwd)"
DST="/Users/sayonari/Library/CloudStorage/GoogleDrive-sayonari@gmail.com/マイドライブ/nishimura/work/同人活動/ドグラマグラ_ゲーム化"
mkdir -p "$DST"
EXC=(--exclude '.git' --exclude '.DS_Store' --exclude '_ocr' --exclude 'node_modules' --exclude '*.log')
rsync -av --delete "${EXC[@]}" "$SRC/.references/" "$DST/01_受領書類・メール/"
rsync -av --delete "${EXC[@]}" "$SRC/.output/"     "$DST/02_成果物/"
rsync -av --delete "${EXC[@]}" "$SRC/.spec/"       "$DST/03_記録/spec/"
rsync -av --delete "${EXC[@]}" --exclude 'scripts' "$SRC/.agent/" "$DST/03_記録/agent/"
rsync -av --delete "${EXC[@]}" "$SRC/analysis/"    "$DST/03_記録/analysis/"
cp "$SRC/README.md" "$SRC/AGENTS.md" "$DST/03_記録/" 2>/dev/null || true
echo "synced -> $DST"
