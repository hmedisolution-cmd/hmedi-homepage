/* 인사이트: 목록 · 글 보기 (Supabase posts 또는 데모 localStorage) */
(function init() {
  "use strict";
  const S = window.HmediStore; if (!S) { document.addEventListener("DOMContentLoaded", init, { once: true }); return; }
  const $ = (q, el) => (el || document).querySelector(q);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const postISO = value => { if(typeof value!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(value))return null;const t=new Date(value);if(!Number.isFinite(t.getTime()))return null;return new Date(t.getTime()+9*3600000).toISOString().slice(0,19)+'+09:00'; };
  const fmtDate = value => { const iso=postISO(value);return iso?iso.slice(0,10).replaceAll('-','.')+' '+iso.slice(11,16)+' KST':'날짜 미확인'; };
  const postDates = p => {const pub=postISO(p.published_at),mod=postISO(p.content_modified_at);return {...(pub?{datePublished:pub}:{}),...(pub&&mod&&mod>pub?{dateModified:mod}:{})};};
  const postMetadata = p => {const d=postDates(p);return `<span>${esc(p.author||'에이치메디솔루션')}</span>${d.datePublished?`<time datetime="${d.datePublished}">발행 ${fmtDate(d.datePublished)}</time>`:'<span>날짜 미확인</span>'}${d.dateModified?`<time datetime="${d.dateModified}">수정 ${fmtDate(d.dateModified)}</time>`:''}`;};
  const tagsOf = (p) => Array.isArray(p.tags) ? p.tags : String(p.tags || "").split(",").map((x) => x.trim()).filter(Boolean);
  const readMin = (t) => Math.max(1, Math.round(String(t || "").replace(/<[^>]+>/g, "").length / 500));

  /* 간단 마크다운 → HTML (제목 · 목록 · 인용 · 굵게 · 링크 · 이미지 · 표 · 코드) */
  const md = (src) => {
    if (!src) return "";
    if (/^\s*<(p|h[1-6]|div|ul|ol|figure|section|table)\b/i.test(src)) return src; // 이미 HTML
    const inline = (t) => esc(t)
      .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, a, b) => `<a href="${b}" ${/^https?:/.test(b) && !b.includes(location.host) ? 'target="_blank" rel="noopener"' : ""}>${a}</a>`)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>").replace(/`([^`]+)`/g, "<code>$1</code>");
    const lines = src.replace(/\r/g, "").split("\n"); const out = []; let i = 0;
    while (i < lines.length) {
      const l = lines[i];
      if (!l.trim()) { i++; continue; }
      let m;
      if ((m = l.match(/^(#{1,4})\s+(.*)/))) { const lv = Math.min(m[1].length + 1, 4); out.push(`<h${lv}>${inline(m[2])}</h${lv}>`); i++; continue; }
      if (/^(-{3,}|\*{3,})$/.test(l.trim())) { out.push("<hr>"); i++; continue; }
      if (/^```/.test(l)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`); continue; }
      if (/^\|/.test(l)) { const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]); const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()); const head = cells(rows[0]); const body = rows.slice(/^\|?\s*:?-+/.test(rows[1] || "") ? 2 : 1); out.push(`<table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`); continue; }
      if (/^>\s?/.test(l)) { const buf = []; while (i < lines.length && /^>\s?/.test(lines[i])) buf.push(lines[i++].replace(/^>\s?/, "")); out.push(`<blockquote><p>${inline(buf.join(" "))}</p></blockquote>`); continue; }
      if (/^(\d+)\.\s/.test(l)) { const buf = []; while (i < lines.length && /^\d+\.\s/.test(lines[i])) buf.push(lines[i++].replace(/^\d+\.\s/, "")); out.push(`<ol>${buf.map((x) => `<li>${inline(x)}</li>`).join("")}</ol>`); continue; }
      if (/^[-*]\s/.test(l)) { const buf = []; while (i < lines.length && /^[-*]\s/.test(lines[i])) buf.push(lines[i++].replace(/^[-*]\s/, "")); out.push(`<ul>${buf.map((x) => `<li>${inline(x)}</li>`).join("")}</ul>`); continue; }
      const buf = []; while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|[-*]\s|\d+\.\s|>|\||```)/.test(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${inline(buf.join(" "))}</p>`);
    }
    return out.join("\n");
  };
  window.HmediMarkdown = md;

  // Public aeomaster documents only. No HTML from aeo_doc is trusted or executed.
  const structuredPost = (p) => {
    if (!p || p.source !== 'aeomaster' || !p.aeo_doc) return null;
    const escape = (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const textParts = [];
    const txt = (v, max, required = false) => { if (typeof v !== 'string' || v.length > max || (required && !v.trim())) throw Error('INVALID_DOCUMENT'); textParts.push(v); return escape(v.trim()); };
    const arr = (v, max) => { if (!Array.isArray(v) || v.length > max) throw Error('INVALID_DOCUMENT'); return v; };
    const url = (v, image = false) => {
      if (typeof v !== 'string' || v.length > 2048 || /[\s\\\x00-\x1f\x7f]/.test(v)) throw Error('INVALID_URL');
      if (image && /^\/column\/assets\/[A-Za-z0-9_-]+\.(?:png|jpg|jpeg|webp)$/.test(v)) return 'https://hmedisolution.com' + v;
      const u = new URL(v); if (u.protocol !== 'https:' || !u.hostname || u.username || u.password) throw Error('INVALID_URL');
      if (image && !/^https:\/\/rcrpisjwmiorhocgxjcw\.supabase\.co\/storage\/v1\/object\/public\/aeo-hmedi-column-images\/b7271da3-02da-4ff9-b8c1-6a1f89477ba1\/[a-f0-9]{64}\/r[1-9][0-9]*\/[a-f0-9]{64}\.png$/.test(v) && !/^https:\/\/hmedisolution\.com\/column\/assets\/[A-Za-z0-9_-]+\.(?:png|jpg|jpeg|webp)$/.test(v)) throw Error('IMAGE_NOT_PUBLIC_ASSET');
      return u.href;
    };
    // Only explicit inline Markdown links create sentence markers; no inferred claims.
    const citations = (() => {
      const entries=[], byUrl=new Map();
      const normalize=raw=>{try{if(typeof raw!=='string'||raw.length>2048||/[\s\\\x00-\x1f\x7f]/.test(raw))return null;const u=new URL(raw.replace(/&amp;/g,'&'));return ['https:','http:'].includes(u.protocol)&&u.hostname&&!u.username&&!u.password?u.href:null}catch{return null}};
      const add=(raw,label='',prefer=false)=>{const target=normalize(raw);if(!target)return null;if(!byUrl.has(target)){byUrl.set(target,entries.length+1);entries.push({url:target,label:label||target})}else if(prefer&&label){entries[byUrl.get(target)-1].label=label}return byUrl.get(target)};
      const inline=raw=>{let out='',i=0;while(i<raw.length){const start=i,m=raw.slice(start).match(/^\[([^\]\n]{1,500})\]\s*\(/);if(m){const begin=start+m[0].length;let j=begin,depth=1;while(j<raw.length&&depth){if(raw[j]==='(')depth++;else if(raw[j]===')')depth--;if(depth)j++}if(depth===0){const target=raw.slice(begin,j),n=add(target,m[1]);let end=j+1;if(start!==i&&raw[end]===')')end++;if(n){if(start!==i&&end===j+1)out+='(';out+=`<a class="column-citation" href="#reference-${n}" aria-label="참고자료 ${n}">[${n}]</a>`}else out+=escape(raw.slice(i,end));i=end;continue}}out+=escape(raw[i++])}return out.replace(/\*\*([^*\n]{1,120})\*\*/g,'<strong>$1</strong>')};
      const render=()=>entries.length?`<aside class="column-references" aria-labelledby="references-title"><h2 id="references-title">참고자료</h2><ol>${entries.map((x,i)=>`<li id="reference-${i+1}"><span class="reference-number">[${i+1}]</span> <a href="${escape(x.url)}" target="_blank" rel="noopener noreferrer">${escape(x.label)}</a><span class="reference-url">${escape(new URL(x.url).hostname)}</span></li>`).join('')}</ol></aside>`:'';
      return {add,inline,render};
    })();
    const rich=(v,max,required=false)=>{txt(v,max,required);return citations.inline(v.trim())};
    const pendingSources=[];
    try {
      const d = p.aeo_doc; if (!d || typeof d !== 'object' || Array.isArray(d) || JSON.stringify(d).length > 524288) throw Error('INVALID_DOCUMENT');
      const title = txt(d.title, 200, true), summary = txt(d.summary, 1000, true);
      const sections = arr(d.sections, 24); if (!sections.length) throw Error('INVALID_DOCUMENT');
      const images = arr(d.images || [], 2).map(i => ({url:url(i.url,true),alt:txt(i.alt || '',500),caption:txt(i.caption || '',1000)}));
      const image = i => `<figure><img src="${escape(i.url)}" alt="${i.alt}" loading="lazy" width="1536" height="1024"><figcaption>${i.caption}</figcaption></figure>`;
      const links = (items, cls) => { const all = arr(items || [],30); return all.length ? `<ul class="${cls}">${all.map(x => `<li><a href="${escape(url(x.url))}" rel="noopener noreferrer">${txt(x.label,200,true)}</a></li>`).join('')}</ul>` : ''; };
      const summaryItems=arr(d.summaryItems || [],3).map(item=>{if(!item||typeof item!=='object'||Array.isArray(item)||Object.keys(item).some(k=>!['label','text'].includes(k)))throw Error('INVALID_SUMMARY_ITEM');return {label:txt(item.label,40,true),text:rich(item.text,240,true)}});
      let body = (images[0]?.caption ? `<p class="column-image-caption">${images[0].caption}</p>` : '') + `<section class="column-summary"><h2>칼럼 요약</h2>${summaryItems.length?`<ol class="column-summary-items">${summaryItems.map((item,i)=>`<li><span class="summary-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><strong>${item.label}</strong><p>${item.text}</p></div></li>`).join('')}</ol>`:`<p>${rich(d.summary,1000,true)}</p>`}</section>`;
      const major=sections.map((s,i)=>({s,i})).filter(({s})=>(s.level ?? 2)===2);
      body += `<details class="column-toc"><summary>목차 <span>${major.length}개 주요 항목</span></summary><nav aria-label="목차"><ol>${major.map(({s,i})=>`<li><a href="#section-${i+1}">${txt(s.heading,200,true)}</a></li>`).join('')}</ol></nav></details>`;
      body += sections.map((s,i) => {
        const level = s.level === undefined ? 2 : s.level; if (level !== 2 && level !== 3) throw Error('INVALID_HEADING');
        let html = `<section id="section-${i+1}"><h${level}>${txt(s.heading,200,true)}</h${level}>`;
        html += arr(s.body || [],40).map(x=>{const safe=rich(x,5000),raw=x.trim();if(/faq|자주.*질문|질문.*답변/i.test(s.heading)&&/^Q[.:．]\s*/i.test(raw)){const markers=[...raw.matchAll(/(?:^|\s)([QA])[.:．]\s*/gi)];if(markers.length>=2&&markers.length%2===0&&markers.every((m,k)=>m[1].toUpperCase()===(k%2?'A':'Q'))){const parts=markers.map((m,k)=>raw.slice(m.index+(m[0].length-m[0].trimStart().length),markers[k+1]?.index??raw.length).trim());if(parts.every(v=>v.replace(/^[QA][.:．]\s*/i,'').trim()))return parts.map((v,k)=>k%2?`<p class="faq-answer">${citations.inline(v)}</p>`:`<p class="faq-question"><strong>${citations.inline(v)}</strong></p>`).join('');}}return `<p>${safe}</p>`}).join('');
        if (s.list) { if (s.list.ordered !== undefined && typeof s.list.ordered !== 'boolean') throw Error('INVALID_LIST'); const items=arr(s.list.items,20),tag=s.list.ordered?'ol':'ul'; html+=`<${tag}>${items.map(x=>`<li>${rich(x,1000,true)}</li>`).join('')}</${tag}>`; }
        if (s.table) { const t=s.table,cols=arr(t.columns,10),rows=arr(t.rows,50);if(!cols.length)throw Error('INVALID_TABLE');html+=`<div class="column-table" tabindex="0"><table><caption>${txt(t.caption || '',500)}</caption><thead><tr>${cols.map(x=>`<th scope="col">${rich(x,1200)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>{arr(row,10);if(row.length!==cols.length)throw Error('INVALID_TABLE');return `<tr>${row.map(x=>`<td>${rich(x,1200)}</td>`).join('')}</tr>`}).join('')}</tbody></table></div>`; }
        html += arr(s.faq || [],20).map(f=>`<div class="column-faq"><h3>${rich(f.question,300,true)}</h3><p>${rich(f.answer,5000,true)}</p></div>`).join('');
        pendingSources.push(...arr(s.sources || [],30));return html + '</section>';
      }).join('');
      if (images[1]) body += image(images[1]);
      const related = links(d.relatedLinks,'column-related-links'); const relatedHTML=related? `<aside class="column-related"><h2>관련 링크</h2>${related}</aside>`:'';
      for(const x of pendingSources){txt(x.label,200,true);citations.add(url(x.url),x.label,true)}
      body+=citations.render()+relatedHTML;
      return {body,text:textParts.join(' '),title:d.title.trim(),summary:d.summary.trim(),cover:images[0]?.url || '',coverAlt:images[0] ? String(d.images[0].alt || '') : '',coverCaption:images[0] ? String(d.images[0].caption || '') : '',valid:true};
    } catch (_) { return {body:'<p>구조화된 본문을 표시할 수 없습니다. 잠시 후 다시 확인해 주세요.</p>',text:'',summary:'',cover:'',coverAlt:'',valid:false}; }
  };
  window.HmediStructuredPost = structuredPost;

  /* 정적 글 페이지 색인 (build/posts.py 가 생성): 있으면 insights/<slug>.html 로, 아직 생성 전이면 post.html?slug= 로 */
  let STATIC = null;
  const staticIndex = async () => { if (STATIC) return STATIC; try { const r = await fetch("/insights/index.json", { cache: "no-cache" }); const j = r.ok ? await r.json() : null; STATIC = { set: new Set(((j && j.posts) || []).map((p) => p.slug)), posts: (j && j.posts) || [] }; } catch (e) { STATIC = { set: new Set(), posts: [] }; } return STATIC; };
  const href = (p) => (STATIC && STATIC.set.has(p.slug)) ? `/%EC%B9%BC%EB%9F%BC/${encodeURIComponent(p.slug)}/` : `/post.html?slug=${encodeURIComponent(p.slug)}`;
  const card = (p) => { const structured=structuredPost(p);if(structured)p={...p,cover_url:structured.cover,excerpt:structured.summary};return `<a class="ins-card" href="${href(p)}">
      <div class="ins-thumb" ${p.cover_url ? `style="background-image:url('${esc(p.cover_url)}')"` : ""}>${p.cover_url ? "" : `<span>${esc((tagsOf(p)[0] || "Insight"))}</span>`}</div>
      <div class="ins-body"><div class="ins-tagline">${tagsOf(p).slice(0, 2).map((t) => `<span>${esc(t)}</span>`).join("")}</div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt || "")}</p><div class="ins-meta">${postMetadata(p)}</div></div></a>`; };

  async function list() {
    const grid = $("#insGrid"); if (!grid) return;
    let posts = [];
    const [idx] = await Promise.all([staticIndex(), S.ready().catch(() => {})]);
    try { posts = await S.listPosts(); } catch (e) { posts = idx.posts; }
    if (!posts.length && idx.posts.length) posts = idx.posts;
    const tags = {}; posts.forEach((p) => tagsOf(p).forEach((t) => (tags[t] = (tags[t] || 0) + 1)));
    const tagBox = $("#insTags"); let cur = "", q = "";
    const draw = () => {
      const ql = q.toLowerCase();
      const list = posts.filter((p) => (!cur || tagsOf(p).includes(cur)) && (!ql || (p.title + " " + (p.excerpt || "") + " " + tagsOf(p).join(" ")).toLowerCase().includes(ql)));
      grid.innerHTML = list.length ? list.map(card).join("") : '<div class="ins-empty">아직 등록된 글이 없습니다. 곧 첫 인사이트를 올릴게요.</div>';
    };
    tagBox.innerHTML = `<button type="button" class="is-active" data-t="">전체 ${posts.length}</button>` + Object.entries(tags).sort((a, b) => b[1] - a[1]).map(([t, n]) => `<button type="button" data-t="${esc(t)}">${esc(t)} ${n}</button>`).join("");
    tagBox.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; cur = b.dataset.t; tagBox.querySelectorAll("button").forEach((x) => x.classList.toggle("is-active", x === b)); draw(); });
    $("#insSearch").addEventListener("input", (e) => { q = e.target.value.trim(); draw(); });
    draw();
  }

  async function post() {
    const el = $("#post"); if (!el) return;
    const slug = new URLSearchParams(location.search).get("slug");
    try {
      await S.ready(); const p = slug ? await S.getPost(slug) : null;
      if (p && p.status === "published") { const idx = await staticIndex(); if (idx.set.has(p.slug)) { location.replace(`/%EC%B9%BC%EB%9F%BC/${encodeURIComponent(p.slug)}/`); return; } }
      if (!p || (p.status !== "published" && !sessionStorage.getItem("hmedi_admin_session") && !localStorage.getItem("hmedi_is_admin"))) { $("#postTitle").textContent = "글을 찾을 수 없습니다"; $("#postBody").innerHTML = '<p>삭제되었거나 아직 공개되지 않은 글입니다.</p>'; return; }
      const structured=structuredPost(p), contentText=structured?structured.text:p.content, cover=structured?structured.cover:p.cover_url, excerpt=structured?structured.summary:(p.excerpt || '');
      document.title = `${p.title} | 에이치메디솔루션 인사이트`;
      const setMeta = (sel, v) => { const m = document.querySelector(sel); if (m && v) m.setAttribute("content", v); };
      setMeta('meta[name="description"]', excerpt); setMeta('meta[property="og:title"]', p.title); setMeta('meta[property="og:description"]', excerpt); if (cover) { setMeta('meta[property="og:image"]', cover); setMeta('meta[name="twitter:image"]', cover); }
      const canon = document.querySelector('link[rel="canonical"]'); if (canon) canon.setAttribute("href", location.origin + location.pathname + "?slug=" + encodeURIComponent(p.slug));
      $("#postTitle").textContent = p.title;
      $("#postTags").innerHTML = tagsOf(p).map((t) => `<a href="/%EC%B9%BC%EB%9F%BC/">${esc(t)}</a>`).join("");
      $("#postMeta").innerHTML = `${postMetadata(p)}<span>${readMin(contentText)}분 읽기</span>`;
      if (cover) { const f = $("#postCover"); f.classList.remove("hidden"); f.querySelector("img").src = cover; f.querySelector("img").alt = structured ? structured.coverAlt : p.title; }
      if (structured) { document.body.classList.add("aeo-reading"); const bodyNode = $("#postBody"); bodyNode.classList.add("column-content"); if (!document.querySelector('link[data-aeo-column-style]')) { const style = document.createElement("link"); style.rel = "stylesheet"; style.href = "/%EC%B9%BC%EB%9F%BC/column.css?v=reading-layout-20261102"; style.setAttribute("data-aeo-column-style", "true"); document.head.appendChild(style); } }
      $("#postBody").innerHTML = structured ? structured.body : md(p.content);
      const ld = document.createElement("script"); ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: p.title, description: excerpt, image: cover || undefined, ...postDates(p), author: (() => { const n = (p.author || "에이치메디솔루션").trim(); if (n === "에이치메디솔루션") return { "@type": "Organization", name: n }; const m = n.match(/^(.+?)\s+(대표|원장|이사|실장)$/); return m ? { "@type": "Person", name: m[1], jobTitle: m[2], worksFor: { "@type": "Organization", name: "에이치메디솔루션" } } : { "@type": "Person", name: n }; })(), publisher: { "@type": "Organization", name: "에이치메디솔루션" }, mainEntityOfPage: location.href });
      document.head.appendChild(ld);
      try { await staticIndex(); const all = await S.listPosts(); const rel = all.filter((x) => x.slug !== p.slug).slice(0, 3); if (rel.length) $("#postRelated").innerHTML = `<h3>다른 인사이트</h3><div class="ins-grid">${rel.map(card).join("")}</div>`; } catch (e) {}
    } catch (e) { $("#postTitle").textContent = "글을 불러오지 못했습니다"; }
  }
  list(); post();
})();




