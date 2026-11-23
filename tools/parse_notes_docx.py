# Regenerates frontend/src/content/notes.json from the four note .docx files (python-docx). Usage: edit the input paths below, then run it.
import docx, json, re, sys
from docx.table import Table
from docx.text.paragraph import Paragraph
SRC='/mnt/user-data/attachments/95bc1e24-e19c-58a8-a8e1-bcc60c165b66/'
FILES={'m1-r5':'9cac11ca-CCC_One_Liner_Notes_Hindi_English_2','m2-r5':'240a7fa2-O_Level_M2R5_Web_Designing_Notes_Hindi_English','m3-r5':'58396144-O_Level_M3R5_Python_Notes_Hindi_English','m4-r5':'9f78b90f-O_Level_M4R5_IoT_Notes_Hindi_English'}
HEAD=re.compile(r'^(?:Chapter|Unit)\s+(\d+):\s*(.+)$')
DEVA=re.compile(r'[ऀ-ॿ]')
STAR=re.compile(r'\s*★\s*')
def clean(t):
    t=STAR.sub(' ',t).replace(' ',' ')
    return re.sub(r'[ \t]+',' ',t).strip()
def split_bi(text):
    """Paragraph 'hindi\nenglish' -> (hi,en). Falls back to detecting script."""
    parts=[clean(x) for x in text.split('\n') if clean(x)]
    if len(parts)>=2: return parts[0],' '.join(parts[1:])
    t=parts[0] if parts else ''
    return (t,'') if DEVA.search(t) else ('',t)
out={}
report=[]
for mod,f in FILES.items():
    d=docx.Document(SRC+f+'.docx')
    chapters=[];cur=None;sec=None
    def new_sec(title_hi,title_en):
        global sec
        sec={'hi':title_hi,'en':title_en,'blocks':[]}
        cur['sections'].append(sec)
    for el in d.element.body.iterchildren():
        tag=el.tag.split('}')[1]
        if tag=='p':
            p=Paragraph(el,d); t=p.text
            if not clean(t): continue
            st=p.style.name
            if st=='Heading 1' or (cur is None and st!='Heading 2'): continue
            if st=='Heading 2':
                m=HEAD.match(clean(t))
                if not m: print('BAD HEAD',mod,t); continue
                cur={'n':int(m.group(1)),'title':m.group(2),'sections':[]}; chapters.append(cur); sec=None; continue
            if cur is None: continue
            if st=='First Paragraph' and '\n' not in t:
                if ' / ' in t:
                    a,b=[clean(x) for x in t.split(' / ',1)]
                    hi,en=(a,b) if DEVA.search(a) else (b,a)
                else:
                    hi=en=clean(t)
                new_sec(hi,en); continue
            if sec is None: new_sec('','')
            if clean(t).startswith('Extra Points'):
                new_sec('अतिरिक्त बिंदु','Extra Points'); continue
            hi,en=split_bi(t)
            hi=re.sub(r'\s*Exam में अक्सर 1024 पूछा जाता है।','',hi); en=re.sub(r'\s*Exams usually ask 1024\.','',en)
            sec['blocks'].append({'p':[hi,en]})
        elif tag=='tbl':
            if cur is None: continue
            if sec is None: new_sec('','')
            tb=Table(el,d)
            rows=[[clean(c.text.replace('\n',' / ')) for c in r.cells] for r in tb.rows]
            sec['blocks'].append({'table':rows})
    out[mod]=chapters
    n=sum(1 for c in chapters for s in c['sections'] for b in s['blocks'] if 'p' in b)
    report.append((mod,len(chapters),n,sum(1 for c in chapters for s in c['sections'] for b in s['blocks'] if 'table' in b)))
json.dump(out,open('/home/claude/olevel/quiz-platform/frontend/src/content/notes.json','w'),ensure_ascii=False,separators=(',',':'))
for r in report: print(r)
# diagnostics
for mod,chs in out.items():
    for c in chs:
        for s in c['sections']:
            for b in s['blocks']:
                if 'p' in b and (not b['p'][0] or not b['p'][1]): print('ONE-LANG',mod,c['n'],b)
