"""Offline /column renderer. No network, repo writes, provider calls or secret access.
Extracts only literal shared-shell constants from the audited source via AST; never imports it.
"""
import ast, html, json, re, hashlib
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET
ORIGIN='https://hmedisolution.com'
E=lambda x:html.escape(str(x or ''),quote=True)

def shell(source):
    values={}
    def literal(n):
        if isinstance(n,ast.Constant) and isinstance(n.value,str): return n.value
        if isinstance(n,ast.Name) and n.id in values:return values[n.id]
        if isinstance(n,ast.BinOp) and isinstance(n.op,ast.Add):return literal(n.left)+literal(n.right)
        raise ValueError('nonliteral shell expression')
    for n in ast.parse(source).body:
        if isinstance(n,ast.Assign) and len(n.targets)==1 and isinstance(n.targets[0],ast.Name) and n.targets[0].id in {'ARROW','HEAD','HEADER','FOOTER'}:
            values[n.targets[0].id]=literal(n.value)
    if not all(k in values for k in ['HEAD','HEADER','FOOTER']):raise ValueError('shared shell missing')
    return values

def text(value,limit=5000,required=False):
    if not isinstance(value,str) or len(value)>limit or (required and not value.strip()):raise ValueError('invalid text')
    return value.strip()

def url(value,image=False):
    value=text(value,2048,True)
    if re.search(r'[\s\\\x00-\x1f]',value):raise ValueError('unsafe URL')
    if image:
        # Images must already be exported to this public namespace, not private app URLs.
        if not (re.fullmatch(r'/column/assets/[A-Za-z0-9_-]+\.(?:png|jpg|jpeg|webp)',value) or re.fullmatch(r'https://rcrpisjwmiorhocgxjcw\.supabase\.co/storage/v1/object/public/aeo-hmedi-column-images/b7271da3-02da-4ff9-b8c1-6a1f89477ba1/[a-f0-9]{64}/r[1-9][0-9]*/[a-f0-9]{64}\.png',value)):raise ValueError('image not a public column asset')
        return value
    u=urlsplit(value)
    if u.scheme!='https' or not u.netloc or u.username or u.password:raise ValueError('unsafe URL')
    return value

def path(slug):
    if not isinstance(slug,str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug) or len(slug)>80 or slug in {'index','api','admin','new','edit'}:raise ValueError('invalid slug')
    return '/column/'+slug+'/'

def doc_body(doc):
    title=text(doc['title'],200,True);summary=text(doc['summary'],1000,True)
    sections=doc.get('sections',[])
    if not isinstance(sections,list) or not 1<=len(sections)<=24:raise ValueError('invalid sections')
    images=doc.get('images',[])
    if len(images)>2:raise ValueError('too many images')
    def image(i):return '<figure><img src="'+E(url(i['url'],True))+'" alt="'+E(text(i.get('alt',''),500))+'" width="1440" height="640"><figcaption>'+E(text(i.get('caption',''),1000))+'</figcaption></figure>'
    body=('<div class="column-hero">'+image(images[0])+'</div>') if images else ''
    body+='<h1>'+E(title)+'</h1><section class="column-summary"><h2>칼럼 요약</h2><p>'+E(summary)+'</p></section>'
    body+='<nav class="column-toc" aria-label="목차"><h2>목차</h2><ol>'+''.join('<li><a href="#section-'+str(i+1)+'">'+E(text(s['heading'],200,True))+'</a></li>' for i,s in enumerate(sections))+'</ol></nav>'
    for i,s in enumerate(sections):
        level=s.get('level',2)
        if level not in [2,3]:raise ValueError('invalid heading')
        body+='<section id="section-'+str(i+1)+'"><h'+str(level)+'>'+E(s['heading'])+'</h'+str(level)+'>'
        paras=s.get('body',[])
        if not isinstance(paras,list) or len(paras)>40:raise ValueError('invalid paragraphs')
        body+=''.join('<p>'+E(text(p,5000))+'</p>' for p in paras)
        if s.get('list'):
            items=s['list']['items'];tag='ol' if s['list'].get('ordered') else 'ul'
            if len(items)>20:raise ValueError('list too long')
            body+='<'+tag+'>'+''.join('<li>'+E(text(x,1000))+'</li>' for x in items)+'</'+tag+'>'
        if s.get('table'):
            t=s['table'];cols=t['columns'];rows=t['rows']
            if not 1<=len(cols)<=10 or len(rows)>50 or any(len(r)!=len(cols) for r in rows):raise ValueError('table shape')
            body+='<div class="column-table" tabindex="0"><table><caption>'+E(text(t.get('caption',''),500))+'</caption><thead><tr>'+''.join('<th scope="col">'+E(text(c,1200))+'</th>' for c in cols)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(text(c,1200))+'</td>' for c in r)+'</tr>' for r in rows)+'</tbody></table></div>'
        for f in s.get('faq',[]):body+='<div class="column-faq"><h3>'+E(text(f['question'],300,True))+'</h3><p>'+E(text(f['answer'],5000,True))+'</p></div>'
        sources=s.get('sources',[])
        if len(sources)>30:raise ValueError('sources limit')
        if sources:body+='<ul class="column-sources">'+''.join('<li><a href="'+E(url(x['url']))+'" rel="noopener noreferrer">'+E(text(x['label'],200,True))+'</a></li>' for x in sources)+'</ul>'
        body+='</section>'
    if len(images)>1:body+=image(images[1])
    return body

def rooted(s):return re.sub(r'(href|src)="(?!https?:|//|#|mailto:|tel:|data:|javascript:|/)',r'\1="/',s)

def page(parts,title,description,canonical,body,preview=True,article=False):
    graph={'@context':'https://schema.org','@type':'Article' if article else 'CollectionPage','headline':title,'description':description,'url':canonical,'publisher':{'@id':ORIGIN+'/#org'}}
    js=json.dumps(graph,ensure_ascii=False).replace('<','\\u003c')
    head=parts['HEAD'].format(title=E(title),desc=E(description),keywords='',robots='noindex, nofollow' if preview else 'index, follow',canonical=E(canonical),og_type='article' if article else 'website',og_title=E(title),og_image=ORIGIN+'/assets/img/og.jpg',verify='',jsonld=js,page='column',ver='column-v1')
    head=head.replace('</head>','<link rel="stylesheet" href="/column/column.css">\n</head>')
    notice='<p class="column-preview-note">비공개 템플릿 검토용 · 실제 게시글이 아닙니다</p>' if preview else ''
    return rooted(head+parts['HEADER']+'<main id="top" class="column-main"><div class="wrap"><article class="column-content">'+notice+body+'</article></div></main>'+parts['FOOTER'].replace('{ver}','column-v1'))

def build(source,records,out,preview=True,existing_sitemap=None):
    parts=shell(Path(source).read_text());out=Path(out);out.mkdir(parents=True,exist_ok=True)
    if len(records)>500:raise ValueError('record limit')
    seen=set();cards=[];urls=[];receipts=[]
    for r in records:
        if r.get('channel')!='publish' or r.get('visibility')!='public_confirmed':raise ValueError('only explicitly confirmed homepage snapshot')
        slug=r['slug'];p=path(slug)
        if slug in seen:raise ValueError('duplicate slug')
        seen.add(slug);d=r['doc'];content=doc_body(d)
        full=page(parts,d['title'],d['summary'],ORIGIN+p,content,preview,True)
        target=out/p.lstrip('/')/'index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(full)
        cards.append('<a class="ins-card" href="'+p+'"><div class="ins-body"><h2>'+E(d['title'])+'</h2><p>'+E(d['summary'])+'</p></div></a>');urls.append(ORIGIN+p)
        receipts.append({'articleId':r['articleId'],'path':p,'sha256':hashlib.sha256(full.encode()).hexdigest(),'state':'local_prepared','publicVerified':False})
    listing='<h1>칼럼</h1><div class="ins-grid">'+(''.join(cards) or '<p>등록된 칼럼이 없습니다.</p>')+'</div>'
    target=out/'column/index.html';target.parent.mkdir(parents=True,exist_ok=True);target.write_text(page(parts,'칼럼 | 에이치메디솔루션','에이치메디솔루션 칼럼',ORIGIN+'/column/',listing,preview))
    (out/'column/column.css').write_text(Path(__file__).with_name('column.css').read_text())
    # Separate sitemap is always generated; no production root files are overwritten by this offline builder.
    ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);root=ET.Element('{'+ns+'}urlset')
    for u in ([] if preview else [ORIGIN+'/column/']+urls):ET.SubElement(ET.SubElement(root,'{'+ns+'}url'),'{'+ns+'}loc').text=u
    ET.ElementTree(root).write(out/'column/sitemap.xml',encoding='utf-8',xml_declaration=True)
    (out/'column/manifest.json').write_text(json.dumps({'schemaVersion':1,'preview':preview,'receipts':receipts},ensure_ascii=False,indent=2))
    return receipts
