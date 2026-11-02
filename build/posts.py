#!/usr/bin/env python3
"""인사이트 정적 페이지 생성기.

Supabase posts 테이블의 공개(published) 글을 읽어 insights/<slug>.html 을 만들고,
insights/index.json(목록 색인)을 갱신한 뒤 build.py 를 실행해 insights.html · sitemap.xml · llms.txt 에 반영한다.

  python3 build/posts.py                 # Supabase 에서 읽기 (SUPABASE_URL / SUPABASE_KEY 환경변수, 없으면 assets/js/config.js 값)
  python3 build/posts.py --from posts.json   # 파일(JSON 배열)에서 읽기 (테스트)
  python3 build/posts.py --force         # 변경이 없어도 전부 다시 생성

GitHub Actions(.github/workflows/posts.yml)가 주기적으로 · 또는 Supabase 웹훅(repository_dispatch)으로 실행한다.
"""
import os, re, sys, json, html as H, urllib.request, urllib.parse, datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build as B

OUT, INS_DIR = B.OUT, B.INS_DIR
ARGS = sys.argv[1:]


# ---------- Supabase ----------
def config_from_js():
    try:
        js = open(os.path.join(OUT, "assets", "js", "config.js"), encoding="utf-8").read()
        url = re.search(r'supabaseUrl\s*:\s*"([^"]*)"', js); key = re.search(r'supabaseKey\s*:\s*"([^"]*)"', js)
        return (url.group(1) if url else ""), (key.group(1) if key else "")
    except Exception:
        return "", ""

def fetch_posts():
    if "--from" in ARGS:
        return json.load(open(ARGS[ARGS.index("--from") + 1], encoding="utf-8"))
    # HMEDI uses the confirmed public contentlab config only; hidden Actions overrides are ignored.
    url, key = config_from_js()
    if url.rstrip('/') != 'https://rcrpisjwmiorhocgxjcw.supabase.co' or not key:
        print("::error::Confirmed contentlab public read configuration is missing or mismatched."); sys.exit(1)
    q = urllib.parse.urlencode({"select": "*", "status": "eq.published", "order": "published_at.desc.nullslast,created_at.desc", "limit": "501"})
    req = urllib.request.Request("%s/rest/v1/posts?%s" % (url.rstrip("/"), q), headers={"apikey": key, "Authorization": "Bearer " + key, "Accept": "application/json"})
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs): return None
    try:
        with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as r:
            raw = r.read(12000001)
        if len(raw)>12000000: raise ValueError("feed limit")
        data = json.loads(raw.decode("utf-8"))
        if not isinstance(data,list) or len(data)>500: raise ValueError("feed shape")
        return data
    except Exception:
        # No upstream body/URL/header/key in logs. Failed read MUST stop the subsequent route conversion.
        print("::error::Published-post read failed; preserving prior static output.")
        sys.exit(1)


# ---------- 마크다운 → HTML (assets/js/insights.js 의 md() 와 동일 규칙) ----------
def esc(s): return H.escape(str(s if s is not None else ""), quote=True)

def inline(t):
    t = esc(t)
    t = re.sub(r'!\[([^\]]*)\]\(([^)\s]+)\)', r'<img src="\2" alt="\1" loading="lazy">', t)
    t = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', lambda m: '<a href="%s"%s>%s</a>' % (m.group(2), ' target="_blank" rel="noopener"' if re.match(r'https?:', m.group(2)) and "hmedisolution.com" not in m.group(2) else "", m.group(1)), t)
    t = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', t)
    t = re.sub(r'(^|[^*])\*([^*\n]+)\*', r'\1<em>\2</em>', t)
    t = re.sub(r'`([^`]+)`', r'<code>\1</code>', t)
    return t

def markdown(src):
    if not src: return ""
    if re.match(r'^\s*<(p|h[1-6]|div|ul|ol|figure|section|table)\b', src, re.I): return src  # 이미 HTML
    lines = src.replace("\r", "").split("\n"); out = []; i = 0; n = len(lines)
    def cells(r): return [c.strip() for c in re.sub(r'^\||\|$', '', r).split("|")]
    while i < n:
        l = lines[i]
        if not l.strip(): i += 1; continue
        m = re.match(r'^(#{1,4})\s+(.*)', l)
        if m:
            lv = min(len(m.group(1)) + 1, 4); out.append("<h%d>%s</h%d>" % (lv, inline(m.group(2)), lv)); i += 1; continue
        if re.match(r'^(-{3,}|\*{3,})$', l.strip()): out.append("<hr>"); i += 1; continue
        if l.startswith("```"):
            buf = []; i += 1
            while i < n and not lines[i].startswith("```"): buf.append(lines[i]); i += 1
            i += 1; out.append("<pre><code>%s</code></pre>" % esc("\n".join(buf))); continue
        if l.startswith("|"):
            rows = []
            while i < n and lines[i].startswith("|"): rows.append(lines[i]); i += 1
            head = cells(rows[0]); body = rows[2:] if len(rows) > 1 and re.match(r'^\|?\s*:?-+', rows[1]) else rows[1:]
            out.append("<table><thead><tr>%s</tr></thead><tbody>%s</tbody></table>" % ("".join("<th>%s</th>" % inline(c) for c in head), "".join("<tr>%s</tr>" % "".join("<td>%s</td>" % inline(c) for c in cells(r)) for r in body))); continue
        if re.match(r'^>\s?', l):
            buf = []
            while i < n and re.match(r'^>\s?', lines[i]): buf.append(re.sub(r'^>\s?', '', lines[i])); i += 1
            out.append("<blockquote><p>%s</p></blockquote>" % inline(" ".join(buf))); continue
        if re.match(r'^\d+\.\s', l):
            buf = []
            while i < n and re.match(r'^\d+\.\s', lines[i]): buf.append(re.sub(r'^\d+\.\s', '', lines[i])); i += 1
            out.append("<ol>%s</ol>" % "".join("<li>%s</li>" % inline(x) for x in buf)); continue
        if re.match(r'^[-*]\s', l):
            buf = []
            while i < n and re.match(r'^[-*]\s', lines[i]): buf.append(re.sub(r'^[-*]\s', '', lines[i])); i += 1
            out.append("<ul>%s</ul>" % "".join("<li>%s</li>" % inline(x) for x in buf)); continue
        buf = []
        while i < n and lines[i].strip() and not re.match(r'^(#{1,4}\s|[-*]\s|\d+\.\s|>|\||```)', lines[i]): buf.append(lines[i]); i += 1
        out.append("<p>%s</p>" % inline(" ".join(buf)))
    return "\n".join(out)


# ---------- 글 페이지 ----------
def read_min(content):
    return max(1, round(len(re.sub(r'<[^>]+>', '', content or "")) / 500))

def article_ld(p, url, body_html):
    site = B.SITE_URL
    text = B.strip_tags(body_html)
    art = {"@type": ["Article", "BlogPosting"], "@id": url + "#article", "headline": p["title"], "description": p.get("excerpt") or "", "url": url, "mainEntityOfPage": {"@id": url + "#webpage"},
           **B.post_dates(p),
           "author": {"@type": "Organization", "name": p.get("author") or B.ORG["name"], "url": site + "/"}, "publisher": {"@id": site + "/#org"},
           "inLanguage": "ko-KR", "keywords": ", ".join(B.tags_of(p)), "wordCount": len(text), "articleSection": (B.tags_of(p) or ["인사이트"])[0], "isAccessibleForFree": True}
    if p.get("cover_url"): art["image"] = p["cover_url"]
    graph = [B.org_ld(),
             {"@type": "WebSite", "@id": site + "/#website", "url": site + "/", "name": B.ORG["name"], "inLanguage": "ko-KR", "publisher": {"@id": site + "/#org"}},
             {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": p["title"], "description": p.get("excerpt") or "", "inLanguage": "ko-KR", "isPartOf": {"@id": site + "/#website"}, "breadcrumb": {"@id": url + "#breadcrumb"}, **({"dateModified":art["dateModified"]} if "dateModified" in art else {})},
             {"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": [
                 {"@type": "ListItem", "position": 1, "name": "홈", "item": site + "/"},
                 {"@type": "ListItem", "position": 2, "name": "인사이트", "item": site + "/insights.html"},
                 {"@type": "ListItem", "position": 3, "name": p["title"], "item": url}]},
             art]
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))

def render_post(p, others):
    if p.get("source") == "aeomaster" and p.get("aeo_doc"):
        from column_builder import doc_body
        doc = p["aeo_doc"]
        body = '<div class="column-main"><div class="wrap"><article class="column-content">' + doc_body(doc).replace('</h1>', '</h1><div class="post-meta">'+B.post_metadata(p)+'</div>', 1) + '</article></div></div>'
        result = B.render_page("post", esc(doc["title"]) + " | 에이치메디솔루션", esc(doc["summary"]), "", B.post_url(p), json.dumps({"@context":"https://schema.org","@type":"Article","headline":doc["title"],"description":doc["summary"],"url":B.post_url(p),"author":{"@type":"Organization","name":p.get("author") or B.ORG["name"]},**B.post_dates(p)},ensure_ascii=False).replace("<","\\u003c"), body, root_abs=True)
        fingerprint = p.get('aeo_publication_hash') or ''
        if not re.fullmatch(r'[a-f0-9]{64}', fingerprint): raise ValueError('missing publication proof')
        return result.replace('<body data-page="post">', '<body data-page="post" class="aeo-reading">').replace('</head>', '<meta name="aeo-publication-hash" content="' + fingerprint + '"><link rel="stylesheet" href="/칼럼/column.css"></head>')
    url = B.post_url(p); tags = B.tags_of(p)
    body_html = markdown(p.get("content") or "")
    cover = '<figure class="post-cover"><img src="%s" alt="%s"></figure>' % (esc(p["cover_url"]), esc(p["title"])) if p.get("cover_url") else ""
    related = ""
    if others:
        related = '<div class="post-related"><h3>다른 인사이트</h3><div class="ins-grid">%s</div></div>' % "".join(B.post_card(x, root_abs=True) for x in others[:3])
    body = '''<article class="post" id="post" data-slug="%s">
  <div class="post-hero"><div class="wrap-narrow"><div class="crumbs"><a href="/">Home</a><span>/</span><a href="/insights.html">Insight</a></div><div class="post-tags">%s</div><h1>%s</h1><div class="post-meta">%s<span>%d분 읽기</span></div></div></div>
  <div class="wrap-narrow">%s<div class="post-body">%s</div>
    <div class="post-foot"><a class="btn btn-line" href="/insights.html">목록으로 %s</a><a class="btn btn-accent js-inquiry" href="/contact.html">무료 상담 신청 %s</a></div>
    %s
  </div>
</article>''' % (esc(p["slug"]), "".join('<a href="/insights.html">%s</a>' % esc(t) for t in tags), esc(p["title"]), B.post_metadata(p), read_min(p.get("content")), cover, body_html, B.ARROW, B.ARROW, related)
    desc = (p.get("excerpt") or B.strip_tags(body_html)[:150]).strip()
    keywords = ", ".join(tags + ["병원 마케팅 칼럼", "에이치메디솔루션 인사이트"])
    return B.render_page("post", "%s | 에이치메디솔루션 인사이트" % p["title"], desc, keywords, url, article_ld(p, url, body_html), body,
                         og_title=p["title"], og_type="article", og_image=p.get("cover_url") or None, root_abs=True)


def main():
    posts = [p for p in fetch_posts() if p.get("slug") and p.get("title") and p.get("status", "published") == "published"]
    posts = [p for p in posts if re.match(r'^[a-z0-9가-힣-]+$', p["slug"])]  # 파일명으로 안전한 slug 만
    index = {"generated": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
             "posts": [{k: p.get(k) for k in ("slug", "title", "excerpt", "cover_url", "tags", "author", "published_at", "updated_at", "created_at", "content_modified_at")} for p in posts]}
    os.makedirs(INS_DIR, exist_ok=True)
    old = B.load_posts_index()
    existing = {f[:-5] for f in os.listdir(INS_DIR) if f.endswith(".html")}
    wanted = {p["slug"] for p in posts}
    if "--force" not in ARGS and old == index["posts"] and existing == wanted:
        print("변경 없음 (공개 글 %d건)" % len(posts)); return
    # 공개 해제 · 삭제된 글의 정적 파일 제거
    for slug in existing - wanted:
        os.remove(os.path.join(INS_DIR, slug + ".html")); print("removed insights/%s.html" % slug)
    for p in posts:
        html = render_post(p, [x for x in posts if x["slug"] != p["slug"]])
        open(os.path.join(INS_DIR, p["slug"] + ".html"), "w", encoding="utf-8").write(html)
        print("wrote insights/%s.html" % p["slug"], len(html))
    json.dump(index, open(os.path.join(INS_DIR, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    B.main()  # insights.html 목록 · sitemap.xml · llms.txt 갱신
    print("공개 글 %d건 반영" % len(posts))


if __name__ == "__main__":
    main()


