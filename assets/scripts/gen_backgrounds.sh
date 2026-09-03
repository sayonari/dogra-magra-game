#!/bin/bash
# M2 用の背景をまとめて生成 → 1600px JPEG に縮小して public/img/real/ へ
cd "$(dirname "$0")/../.."
P="1926 Japan, Kyushu Imperial University psychiatric hospital, early Showa-era photograph aesthetic, sepia monochrome with a single muted vermilion accent, film grain, soft vignette, etching texture, no modern objects, no text, no letters, no numerals, no signage, no brand marks, no people, cinematic wide shot."
M=gemini-3.1-flash-image
gen() { id=$1; shift; [ -f assets/generated/$id.png ] && { echo "skip $id"; return; }; python3 assets/scripts/gen_image.py "$id" "$M" 16:9 "$P $*" && sips -Z 1600 -s format jpeg -s formatOptions 82 assets/generated/$id.png --out public/img/real/$id.jpg >/dev/null; }
gen corridor "Long empty hospital corridor at night, wooden floor, rows of closed doors with small barred windows, a single dim bulb far away, deep perspective, oppressive silence"
gen ward "Open-air 'free treatment ground' of a psychiatric hospital: a wide courtyard garden inside high walls, patients' handmade objects scattered, a small stage, autumn light, empty"
gen street "A Taisho-era street corner in Fukuoka at dusk, a street performer's spot with a folding lantern and a wooden clapper on the ground, paper flyers on a wall, no readable text"
gen lecture "An old university lecture hall / professor's study with tall bookshelves, a lectern, anatomical brain models, a slide projector, dust in the light beam"
gen paper "Extreme close-up of aged manuscript paper texture with faint vertical ruled lines, ink stains, slightly curled edge, warm sepia, soft focus, no writing"
gen scroll "An unrolled ancient Chinese-style painted hand scroll on a wooden desk, faded pigments, silk border, a portion showing a woman's figure blurred, candlelight"
gen newspaper "A folded Taisho-era Japanese newspaper on a wooden table beside a teacup, halftone texture, headlines blurred beyond legibility, morning light"
gen letter "An old handwritten letter on thin paper with an envelope, a brush and ink stone, on a low wooden table, lamp light, characters blurred beyond legibility"
gen night "Night sea seen from a pine-covered shore, a full moon, a distant lighthouse, calm dark water, mist"
gen dark "Near-black frame with a faint sepia glow at the center like an old film leader, dust and scratches, nothing else"
ls -la public/img/real/
