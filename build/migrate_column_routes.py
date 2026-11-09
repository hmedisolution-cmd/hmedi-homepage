"""Run AFTER a successful forced original posts build. No network/DB operations.
Existing posts/index preserved. HMEDI only: /insights.html → /칼럼/ with HTML redirects, not301.
"""
import html,json,re,hashlib
from pathlib import Path
from urllib.parse import quote
from xml.etree import ElementTree as ET
ORIGIN='https://hmedisolution.com'
PREFIX='/'+quote('칼럼')+'/'
MANIFEST='.aeo-column-routes.json'
def digest(text):return hashlib.sha256(text.encode('utf-8')).hexdigest()
def generated(text):return '<!-- aeo-column-route:v1 sha256='+digest(text)+' -->\n'+text
def safe_path(root,relative):
    parts=Path(relative).parts
    if len(parts)==3 and parts[0]=='칼럼' and parts[2]=='index.html':slug_path(parts[1])
    elif len(parts)==2 and parts[0]=='insights' and parts[1].endswith('.html'):slug_path(parts[1][:-5])
    else:raise ValueError('invalid generated path')
    path=root.joinpath(*parts)
    for node in [path,*path.parents]:
        if node==root:break
        if node.is_symlink():raise ValueError('symlink generated path')
    return path
def known_generated(root):
    records={};manifest=root/MANIFEST
    if manifest.is_symlink():raise ValueError('symlink manifest')
    if manifest.exists():
        value=json.loads(manifest.read_text())
        if not isinstance(value,dict) or value.get('version')!=1 or not isinstance(value.get('files'),dict) or len(value['files'])>2000:raise ValueError('invalid route manifest')
        for relative,sha in value['files'].items():
            safe_path(root,relative)
            if not isinstance(sha,str) or not re.fullmatch('[a-f0-9]{64}',sha):raise ValueError('invalid route hash')
            records[relative]=sha
    # A checksum marker also identifies generated files when the manifest is not
    # carried between builds. Never adopt/delete unmarked legacy or unrelated files.
    for pattern in ['칼럼/*/index.html','insights/*.html']:
        for path in root.glob(pattern):
            relative=str(path.relative_to(root))
            if any(node.is_symlink() for node in [path,*path.parents] if node!=root):continue
            text=path.read_text();match=re.match(r'<!-- aeo-column-route:v1 sha256=([a-f0-9]{64}) -->\n',text)
            if match:
                safe_path(root,relative)
                if digest(text[match.end():])!=match[1]:raise ValueError('modified generated route: '+relative)
                records.setdefault(relative,digest(text))
    return records
def slug_path(slug):
    if not isinstance(slug,str) or not re.fullmatch(r'[a-z0-9가-힣-]+',slug) or len(slug)>200:raise ValueError('invalid legacy slug')
    return PREFIX+quote(slug,safe='')+'/'
def redirect(target):
    safe=html.escape(target,quote=True)
    return '<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="'+ORIGIN+safe+'"><meta http-equiv="refresh" content="0;url='+safe+'"><title>이동 안내</title></head><body><a href="'+safe+'">인사이트로 이동</a></body></html>'
def migrate(root):
    root=Path(root).resolve();previous=known_generated(root);idx=json.loads((root/'insights/index.json').read_text());posts=idx.get('posts',[])
    if not isinstance(posts,list) or len(posts)>1000:raise ValueError('invalid posts index')
    slugs=[p['slug'] for p in posts]
    if len(set(slugs))!=len(slugs):raise ValueError('duplicate slug')
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
    if 'http-equiv="refresh"' in listing:raise ValueError('force fresh original listing build first')
    staged[root/'칼럼/index.html']=re.sub(r'(href|src)="(?!https?:|//|#|mailto:|tel:|data:|javascript:|/)',r'\1="/',rewrite(listing))
    for p in posts:
        old=root/'insights'/ (p['slug']+'.html');body=old.read_text()
        if 'http-equiv="refresh"' in body:raise ValueError('force fresh original article build first')
        staged[safe_path(root,'칼럼/'+p['slug']+'/index.html')]=generated(rewrite(body))
        staged[safe_path(root,'insights/'+p['slug']+'.html')]=generated(redirect(slug_path(p['slug'])))
    staged[root/'insights.html']=redirect(PREFIX)
    # Existing root pages retain logo/menu text and body; only exact insights href/canonical paths change.
    for page in root.glob('*.html'):
        if page.name!='insights.html':staged[page]=rewrite(page.read_text())
    # 기본 이름공간으로 다시 써야 <ns0:urlset> 꼴이 안 된다 (검색엔진이 못 읽는 일이 있다)
    ET.register_namespace('','http://www.sitemaps.org/schemas/sitemap/0.9')
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
    # Validate all stale ownership hashes and required assets before writing/deleting.
    assets=Path(__file__).with_name('column.css').read_bytes()
    current={str(path.relative_to(root)):digest(body) for path,body in staged.items() if body.startswith('<!-- aeo-column-route:v1 ')}
    stale=[]
    for relative,sha in previous.items():
        if relative in current:continue
        path=safe_path(root,relative)
        if path.exists():
            if not path.is_file() or digest(path.read_text())!=sha:raise ValueError('modified stale generated route: '+relative)
            stale.append(path)
    if (root/'칼럼').is_symlink():raise ValueError('symlink column directory')
    # All inputs checked before output changes. No original posts data/index is removed.
    for path,body in staged.items():path.parent.mkdir(parents=True,exist_ok=True);path.write_text(body)
    sitemap.write(root/'sitemap.xml',encoding='utf-8',xml_declaration=True)
    (root/'칼럼/column.css').write_bytes(assets)
    for path in stale:
        path.unlink()
        # Remove only now-empty article directory; never remove adjacent assets/files.
        if path.parent.parent==root/'칼럼' and not any(path.parent.iterdir()):path.parent.rmdir()
    (root/MANIFEST).write_text(json.dumps({'version':1,'files':current},ensure_ascii=False,sort_keys=True))
if __name__=='__main__':migrate(Path(__file__).resolve().parents[1])
