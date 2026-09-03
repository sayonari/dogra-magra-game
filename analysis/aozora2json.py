#!/usr/bin/env python3
"""青空文庫記法（ルビ・注記付き）→ 段落 JSON（ruby HTML）変換．
出力は自動生成物であり手編集禁止．原文一致を保証するため plain も併記する．
usage: python3 analysis/aozora2json.py  → src/data/text/S01.json ... と index.json
"""
import re, json, os, sys
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'.references/aozora/dogura_magura_utf8.txt')
OUT=os.path.join(ROOT,'src/data/text'); os.makedirs(OUT,exist_ok=True)
lines=open(SRC,encoding='utf-8').read().split('\n')
secs=json.load(open(os.path.join(ROOT,'analysis/sections.json'),encoding='utf-8'))['sections']

# 外字（第3/4水準・Unicode 指定）の置換表．注記文字列 → 実文字
GAIJI={
 '「虫＋夾」、第3水準1-91-54':'蛺','「王＋干」、第3水準1-87-83':'玕','ローマ数字1、1-13-21':'Ⅰ','ローマ数字2、1-13-22':'Ⅱ',
 'ローマ数字3、1-13-23':'Ⅲ','ローマ数字4、1-13-24':'Ⅳ','ローマ数字5、1-13-25':'Ⅴ','感嘆符二つ、1-8-75':'‼','感嘆符三つ、626-10':'!!!',
 '「隱」の「こざとへん」に代えて「りっしんべん」、U+61DA、487-14':'懚','「需＋頁」、第3水準1-94-6':'顬',
 '「走」の「土」に代えて「彡」、第3水準1-92-51':'𧺇','「（屮／（師のへん＋辛）／子」、第4水準2-5-90':'孼',
}
def esc(s): return s.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')

def conv_inline(s):
    """1行を (html, plain) に変換"""
    # 外字 ※［＃…］
    def gai(m):
        key=m.group(1)
        for k,v in GAIJI.items():
            if k in key: return v
        return '〓'
    s=re.sub(r'※［＃([^］]*)］',gai,s)
    plain=re.sub(r'《[^》]*》','',s).replace('｜','')
    plain=re.sub(r'［＃[^］]*］','',plain)
    # 傍点 ［＃「xxx」に傍点］ → 直前の xxx を <em class=bouten>
    def bouten(m):
        return m.group(0)
    html=esc(s)
    # 注記（傍点・大きな文字）を先に処理
    def emph(m):
        word=m.group(1)
        return f'<em class="bouten">{word}</em>'
    html=re.sub(r'([^《》｜［］]+?)［＃「\1」に傍点］',lambda m:f'<em class="bouten">{m.group(1)}</em>',html)
    html=re.sub(r'([^《》｜［］]+?)［＃「\1」は太字］',lambda m:f'<b>{m.group(1)}</b>',html)
    html=re.sub(r'([^《》｜［］]+?)［＃「\1」は([０-９]+)段階大きな文字］',lambda m:f'<span class="big b{m.group(2)}">{m.group(1)}</span>',html)
    html=re.sub(r'([^《》｜［］]+?)［＃「\1」は縦中横］',lambda m:f'<span class="tcy">{m.group(1)}</span>',html)
    html=re.sub(r'［＃([０-９]+)段階大きな文字］(.*?)［＃大きな文字終わり］',lambda m:f'<span class="big b{m.group(1)}">{m.group(2)}</span>',html)
    # ルビ：｜base《ruby》 または 漢字連続《ruby》
    html=re.sub(r'｜([^《｜]+?)《([^》]+?)》',lambda m:f'<ruby>{m.group(1)}<rt>{m.group(2)}</rt></ruby>',html)
    html=re.sub(r'([一-龥々〆ヵヶ仝〇𠀋-𯨟]+)《([^》]+?)》',lambda m:f'<ruby>{m.group(1)}<rt>{m.group(2)}</rt></ruby>',html)
    html=re.sub(r'([ぁ-ゖァ-ヺーA-Za-zＡ-Ｚａ-ｚ0-9０-９]+)《([^》]+?)》',lambda m:f'<ruby>{m.group(1)}<rt>{m.group(2)}</rt></ruby>',html)
    # 残った注記は削除（返り点等はそのまま文字化）
    html=re.sub(r'［＃[^］]*］','',html)
    return html, plain

def convert(start,end):
    paras=[]; indent=0; box=False; center=False
    for ln in range(start,end+1):
        raw=lines[ln-1]
        st=raw.strip()
        m=re.fullmatch(r'［＃ここから([０-９]+)字下げ］',st)
        if m: indent=int(m.group(1).translate(str.maketrans('０１２３４５６７８９','0123456789'))); continue
        if st=='［＃ここで字下げ終わり］': indent=0; continue
        if st.startswith('［＃ここから罫囲み］'): box=True; continue
        if st.startswith('［＃ここで罫囲み終わり］'): box=False; continue
        if st=='［＃ページの左右中央］': center=True; continue
        if st in ('［＃改ページ］',): paras.append({'line':ln,'type':'pagebreak'}); center=False; continue
        if re.fullmatch(r'［＃[^］]*(字詰め|字上げ)[^］]*］',st): continue
        if st=='' : continue
        html,plain=conv_inline(raw.rstrip('\n'))
        if not plain.strip(): continue
        p={'line':ln,'html':html,'plain':plain}
        if indent: p['indent']=indent
        if box: p['box']=True
        if center: p['center']=True
        paras.append(p)
    return paras

index=[]
for s in secs:
    paras=convert(s['line_start'],s['line_end'])
    data={'id':s['id'],'title':s['title'],'kind':s['kind'],'line_start':s['line_start'],'line_end':s['line_end'],'paragraphs':paras}
    json.dump(data,open(os.path.join(OUT,f"{s['id']}.json"),'w',encoding='utf-8'),ensure_ascii=False)
    chars=sum(len(re.sub(r'\s|　','',p.get('plain',''))) for p in paras)
    index.append({'id':s['id'],'title':s['title'],'kind':s['kind'],'paragraphs':len(paras),'chars':chars})
    print(s['id'],len(paras),'paras',chars,'chars')
json.dump({'source':'青空文庫 No.2093（底本：ちくま文庫『夢野久作全集9』）','generated_by':'analysis/aozora2json.py','sections':index},open(os.path.join(OUT,'index.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
# 検証：plain 連結が原文（ルビ・注記除去）と一致するか
full=''.join(p.get('plain','') for s in secs for p in json.load(open(os.path.join(OUT,f"{s['id']}.json"),encoding='utf-8'))['paragraphs'])
ref='\n'.join(lines[secs[0]['line_start']-1:secs[-1]['line_end']])
ref=re.sub(r'※［＃[^］]*］','',ref); ref=re.sub(r'《[^》]*》','',ref).replace('｜',''); ref=re.sub(r'［＃[^］]*］','',ref)
norm=lambda x:re.sub(r'\s|　|[ⅠⅡⅢⅣⅤ‼!蛺玕懚顬𧺇孼〓]','',x)
print('plain==ref (ignoring whitespace/gaiji):', norm(full)==norm(ref), len(norm(full)), len(norm(ref)))
