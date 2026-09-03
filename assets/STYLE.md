# STYLE — グラフィック・スタイルガイド（v0.1，M1 仮）

## 2系統（設定で切替）
| 系統 | ID | 方針 |
|---|---|---|
| A 写実 | `real` | 昭和初期の古写真／銅版画／水彩調．セピア＋差し色1色（朱）．画面側で `sepia(.55) contrast(1.05) saturate(.7)` と粒状ノイズを重ねる |
| B 影絵 | `shadow` | 同じ画像を `grayscale(1) contrast(2.2) brightness(.45)` でシルエット化．象徴パーツ（モヨ子の赤，正木の鼻眼鏡，柱時計の文字盤）だけ別レイヤーで1色を残す（M3 で実装） |

M1 の背景は `public/img/real/*.svg` の仮絵（room7／lab／paper／dark）．Nano Banana 生成物に差し替える際は同名 `.webp` を `public/img/real/` に置き，`shadow/` は自動生成（輪郭抽出＋単色化）を試す．

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
