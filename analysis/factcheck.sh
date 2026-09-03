#!/bin/bash
# 2026-09-03 西村方針：外部査読は codex（gpt-5.6-sol）のみ使う．gemini は指摘の質が低く不採用（AUTHORING.md「西村方針」）．gemini 引数は履歴互換のため残す
# 使い方: analysis/factcheck.sh <codex|gemini> <章ファイル名(拡張子なし)>  例: analysis/factcheck.sh codex S05
set -u
cd "$(dirname "$0")/.."
R="$1"; CH="$2"; SEC="${CH%[ab]}"
OUT="analysis/reviews/factcheck/${R}_${CH}.md"
PROMPT="$(sed -e "s/__CH__/${CH}/g" -e "s/__SEC__/${SEC}/g" analysis/factcheck_prompt.txt)"
if [ "$R" = codex ]; then
  codex exec --skip-git-repo-check -m gpt-5.6-sol -s read-only -c 'model_reasoning_effort="high"' "$PROMPT" > "$OUT" 2> "analysis/reviews/factcheck/${R}_${CH}.stderr"
else
  gemini --skip-trust --approval-mode plan -p "$PROMPT" > "$OUT" 2> "analysis/reviews/factcheck/${R}_${CH}.stderr"
fi
echo "done $R $CH exit=$?"
