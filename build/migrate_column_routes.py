"""Run AFTER a successful forced original posts build. No network/DB operations.
Existing posts/index preserved. HMEDI only: /insights.html → /칼럼/ with HTML redirects, not301.
"""
import html,json,re,shutil
from pathlib import Path
from urllib.parse import quote
from xml.etree import ElementTree as ET
ORIGIN='https://hmedisolution.com'
PREFIX='/'+quote('칼럼')+'/'
def slug_path(slug):
    if not isinstance(slug,str) or not re.fullmatch(r'[a-z0-9가-힣-]+',slug) or len(slug)>200:raise ValueError('invalid legacy slug')
    return PREFIX+quote(slug,safe='')+'/'
def redirect(target):
    safe=html.escape(target,quote=True)
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="'+ORIGIN+safe+'"><meta http-equiv="refresh" content="0;url='+safe+'"><title>이동 안내</title></head><body><a href="'+safe+'">인사이트로 이동</a></body></html>'
def migrate(root):
    root=Path(root);idx=json.loads((root/'insights/index.json').read_text());posts=idx.get('posts',[])
    mapping={'/insights.html':PREFIX,'insights.html':PREFIX}
    for p in posts:
        target=slug_path(p['slug']);mapping['/insights/'+p['slug']+'.html']=target;mapping['insights/'+p['slug']+'.html']=target
    def rewrite(text):
        # Exact attribute/path URLs only; never replace article prose.
        for old,new in sorted(mapping.items(),key=lambda x:-len(x[0])):
            text=text.replace('"'+ORIGIN+('/' if not old.startswith('/') else '')+old+'"','"'+ORIGIN+new+'"')
            text=text.replace('"'+old+'"','"'+new+'"')
        return text
    staged={}
    listing=(root/'insights.html').read_text()
    staged[root/'칼럼/index.html']=re.sub(r'(href|src)="(?!https?:|//|#|mailto:|tel:|data:|javascript:|/)',r'\1="/',rewrite(listing))
    for p in posts:
        old=root/'insights'/ (p['slug']+'.html');body=old.read_text()
        if 'http-equiv="refresh"' in body:raise ValueError('force fresh original article build first')
        staged[root/'칼럼'/p['slug']/'index.html']=rewrite(body)
        staged[old]=redirect(slug_path(p['slug']))
    staged[root/'insights.html']=redirect(PREFIX)
    # Existing root pages retain logo/menu text and body; only exact insights href/canonical paths change.
    for page in root.glob('*.html'):
        if page.name!='insights.html':staged[page]=rewrite(page.read_text())
    sitemap=ET.parse(root/'sitemap.xml');ns='{http://www.sitemaps.org/schemas/sitemap/0.9}'
    for loc in sitemap.getroot().iter(ns+'loc'):
        for old,new in mapping.items():
            if loc.text==ORIGIN+('/' if not old.startswith('/') else '')+old:loc.text=ORIGIN+new;break
    llms=root/'llms.txt'
    if llms.exists():
        text=llms.read_text()
        for old,new in sorted(mapping.items(),key=lambda x:-len(x[0])):
            absolute=ORIGIN+('/' if not old.startswith('/') else '')+old
            text=text.replace(absolute,ORIGIN+new)
        staged[llms]=text
    # All inputs checked before output changes. No original posts data/index is removed.
    for path,body in staged.items():path.parent.mkdir(parents=True,exist_ok=True);path.write_text(body)
    sitemap.write(root/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    shutil.copyfile(Path(__file__).with_name('column.css'),root/'칼럼/column.css')
if __name__=='__main__':migrate(Path(__file__).resolve().parents[1])
