# STYLE — グラフィック・スタイルガイド（v0.1，M1 仮）

## 2系統（設定で切替）
| 系統 | ID | 方針 |
|---|---|---|
| A 写実 | `real` | 昭和初期の古写真／銅版画／水彩調．セピア＋差し色1色（朱）．画面側で `sepia(.55) contrast(1.05) saturate(.7)` と粒状ノイズを重ねる |
| B 影絵 | `shadow` | 同じ画像を `grayscale(1) contrast(2.2) brightness(.45)` でシルエット化．象徴パーツ（モヨ子の赤，正木の鼻眼鏡，柱時計の文字盤）だけ別レイヤーで1色を残す（M3 で実装） |

背景は `public/img/real/<id>.jpg`（Nano Banana 生成，1600px・JPEG 82）を第一層，同名 `.svg` の仮絵を第二層として CSS の多重背景で重ねる（jpg が無い場面は svg が見える）．2026-09-03 に room7／lab（標本室）／clock を `gemini-3.1-flash-image` で試作．生成は `assets/scripts/gen_image.py <id> <model> <aspect> "<prompt>"`，原本は `assets/generated/`（git 管理外・Drive 同期外），台帳は `assets/LEDGER.csv`．

試作で分かったこと：数字は「7」のような算用数字で出やすい（作中は「第七号室」）→ 漢数字指定か，後で消す．時計の文字盤に商標風の文字が入ることがある→ `no brand text` を追加．

## プロンプト共通接頭辞（案，Nano Banana 用）
```
1926 Japan, Kyushu Imperial University psychiatric ward, early Showa-era photograph aesthetic,
sepia monochrome with a single muted vermilion accent, film grain, soft vignette, etching texture,
no modern objects, no text, cinematic wide shot, 16:9
```
- 人物はキャラクターシート（正面・側面・全身・色見本）を先に確定し，参照画像として毎回添付
- 生成物は `assets/LEDGER.csv` に記録（ID／モデル／プロンプト／参照画像／ライセンス／日付）

## パレット
- 紙：#efe6d3 / #e4d8c0，墨：#241c17，朱：#8b1e2d，青緑（注釈者）：#2f5d62，金（情報源）：#a67c2e

## タイポグラフィ
- 本文：Shippori Mincho → Noto Serif JP → Hiragino Mincho ProN．縦書き既定，行間 2.0，ルビ 0.5em
- 見出し（作中文書の題）：朱・太字・字間 .2em．本文の列ピッチを崩さないため文字サイズは変えない
