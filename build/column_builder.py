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

# Exact inline URLs only; a sources list never implies a sentence citation.
def citation_url(raw):
    try:
        raw=html.unescape(raw)
        if not isinstance(raw,str) or len(raw)>2048 or re.search(r'[\s\\\x00-\x1f\x7f]',raw):return None
        u=urlsplit(raw)
        if u.scheme not in ('https','http') or not u.hostname or u.username or u.password:return None
        host=u.hostname.encode('idna').decode('ascii').lower()
        if ':' in host:host='['+host+']'
        port=u.port
        return u.scheme+'://'+host+(':'+str(port) if port and port!=(443 if u.scheme=='https' else 80) else '')+(u.path or '/')+('?' + u.query if u.query else '')+('#'+u.fragment if u.fragment else '')
    except (ValueError,UnicodeError):return None

class Citations:
    def __init__(self):self.entries=[];self.by_url={}
    def add(self,raw,label='',prefer=False):
        target=citation_url(raw)
        if not target:return None
        if target not in self.by_url:
            self.by_url[target]=len(self.entries)+1;self.entries.append({'url':target,'label':label or target})
        elif prefer and label:self.entries[self.by_url[target]-1]['label']=label
        return self.by_url[target]
    def marker(self,raw,label=''):
        n=self.add(raw,label)
        return '<a class="column-citation" href="#reference-'+str(n)+'" aria-label="참고자료 '+str(n)+'">['+str(n)+']</a>' if n else E(label or raw)
    def inline(self,raw):
        out=[];i=0
        while i<len(raw):
            # Support source-wrapper parentheses and balanced parentheses inside URL.
            start=i
            match=re.match(r'\[([^\]\n]{1,500})\]\s*\(',raw[start:])
            if match:
                begin=start+match.end();j=begin;depth=1
                while j<len(raw) and depth:
                    if raw[j]=='(':depth+=1
                    elif raw[j]==')':depth-=1
                    if depth:j+=1
                if depth==0:
                    target=raw[begin:j];end=j+1
                    if start!=i and raw[end:end+1]==')':end+=1
                    elif start!=i and citation_url(target):out.append(E('('))
                    out.append(self.marker(target,match[1]) if citation_url(target) else E(raw[i:end]));i=end;continue
            out.append(E(raw[i]));i+=1
        return ''.join(out)
    def render(self):
        if not self.entries:return ''
        return '<aside class="column-references" aria-labelledby="references-title"><h2 id="references-title">참고자료</h2><ol>'+''.join('<li id="reference-'+str(i+1)+'"><span class="reference-number">['+str(i+1)+']</span> <a href="'+E(x['url'])+'" target="_blank" rel="noopener noreferrer">'+E(x['label'])+'</a><span class="reference-url">'+E(urlsplit(x['url']).hostname)+'</span></li>' for i,x in enumerate(self.entries))+'</ol></aside>'

def body_paragraph(value, faq=False, render=E):
    """Presentation only: split complete legacy FAQ pairs, never rewrite stored text."""
    raw=text(value,5000)
    if faq and re.match(r'^Q[.:．]\s*',raw,re.I):
        markers=list(re.finditer(r'(?:^|\s)([QA])[.:．]\s*',raw,re.I))
        if len(markers)>=2 and len(markers)%2==0 and all(m.group(1).upper()==('A' if i%2 else 'Q') for i,m in enumerate(markers)):
            segments=[raw[m.start(1):(markers[i+1].start() if i+1<len(markers) else len(raw))].strip() for i,m in enumerate(markers)]
            if all(re.sub(r'^[QA][.:．]\s*','',part,flags=re.I).strip() for part in segments):
                return ''.join('<p class="faq-answer">'+render(part)+'</p>' if i%2 else '<p class="faq-question"><strong>'+render(part)+'</strong></p>' for i,part in enumerate(segments))
    return '<p>'+render(raw)+'</p>'

def doc_body(doc):
    title=text(doc['title'],200,True);summary=text(doc['summary'],1000,True);citations=Citations();pending_sources=[]
    sections=doc.get('sections',[])
    if not isinstance(sections,list) or not 1<=len(sections)<=24:raise ValueError('invalid sections')
    images=doc.get('images',[])
    if len(images)>2:raise ValueError('too many images')
    def image(i):return '<figure><img src="'+E(url(i['url'],True))+'" alt="'+E(text(i.get('alt',''),500))+'" width="1440" height="640"><figcaption>'+E(text(i.get('caption',''),1000))+'</figcaption></figure>'
    body=('<div class="column-hero">'+image(images[0])+'</div>') if images else ''
    body+='<h1>'+E(title)+'</h1><section class="column-summary"><h2>칼럼 요약</h2><p>'+citations.inline(summary)+'</p></section>'
    body+='<nav class="column-toc" aria-label="목차"><h2>목차</h2><ol>'+''.join('<li><a href="#section-'+str(i+1)+'">'+E(text(s['heading'],200,True))+'</a></li>' for i,s in enumerate(sections))+'</ol></nav>'
    for i,s in enumerate(sections):
        level=s.get('level',2)
        if level not in [2,3]:raise ValueError('invalid heading')
        body+='<section id="section-'+str(i+1)+'"><h'+str(level)+'>'+E(s['heading'])+'</h'+str(level)+'>'
        paras=s.get('body',[])
        if not isinstance(paras,list) or len(paras)>40:raise ValueError('invalid paragraphs')
        body+=''.join(body_paragraph(p,bool(re.search(r'faq|자주.*질문|질문.*답변',s['heading'],re.I)),citations.inline) for p in paras)
        if s.get('list'):
            items=s['list']['items'];tag='ol' if s['list'].get('ordered') else 'ul'
            if len(items)>20:raise ValueError('list too long')
            body+='<'+tag+'>'+''.join('<li>'+citations.inline(text(x,1000))+'</li>' for x in items)+'</'+tag+'>'
        if s.get('table'):
            t=s['table'];cols=t['columns'];rows=t['rows']
            if not 1<=len(cols)<=10 or len(rows)>50 or any(len(r)!=len(cols) for r in rows):raise ValueError('table shape')
            body+='<div class="column-table" tabindex="0"><table><caption>'+E(text(t.get('caption',''),500))+'</caption><thead><tr>'+''.join('<th scope="col">'+citations.inline(text(c,1200))+'</th>' for c in cols)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+citations.inline(text(c,1200))+'</td>' for c in r)+'</tr>' for r in rows)+'</tbody></table></div>'
        for f in s.get('faq',[]):body+='<div class="column-faq"><h3>'+citations.inline(text(f['question'],300,True))+'</h3><p>'+citations.inline(text(f['answer'],5000,True))+'</p></div>'
        sources=s.get('sources',[])
        if len(sources)>30:raise ValueError('sources limit')
        pending_sources.extend(sources)
        body+='</section>'
    if len(images)>1:body+=image(images[1])
    related=doc.get('relatedLinks',[])
    if not isinstance(related,list) or len(related)>30:raise ValueError('related links limit')
    if related:body+='<aside class="column-related"><h2>관련 링크</h2><ul>'+''.join('<li><a href="'+E(url(x['url']))+'" rel="noopener noreferrer">'+E(text(x['label'],200,True))+'</a></li>' for x in related)+'</ul></aside>'
    for source in pending_sources:citations.add(url(source['url']),text(source['label'],200,True),True)
    return body+citations.render()

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

