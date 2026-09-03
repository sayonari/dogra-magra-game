# CREDITS — 出典・素材

## 原作
- 夢野久作『ドグラ・マグラ』．青空文庫 作品 No.2093（`2093_ruby_28087`）．底本：ちくま文庫『夢野久作全集9』（筑摩書房）．パブリックドメイン．
- 本作はゲーム内に原文を**改変せずに**引用・表示する．ルビは `<ruby>` に変換しているが文字は変えていない（変換：`analysis/aozora2json.py`）．
- 抜粋・要旨・注釈・理解課題・用語・命題台帳は本作の制作物（執筆：Claude，出典検証：Codex／Gemini，確認：西村）．

## 画像
- 背景画像は Google Gemini API の画像生成（Nano Banana，`gemini-3.1-flash-image` ほか）で本作のために生成したもの．プロンプト・モデル・日付は `assets/LEDGER.csv` に記録．
- 仮絵（SVG）は本作の制作物．

## 音
- 柱時計の唸り・環境音・頁音・交換局の音はすべて Web Audio API による合成（`src/engine/audio.ts`）．外部音源は使用していない．

## フォント
- Shippori Mincho／Noto Serif JP（利用者の環境にあれば），Hiragino Mincho ProN，Yu Mincho（システムフォント）．Web フォントの同梱はしていない．

## ソフトウェア
- Vite，TypeScript．依存ライブラリは `package.json` のとおり．
