/* 인사이트: 목록 · 글 보기 (Supabase posts 또는 데모 localStorage) */
(function init() {
  "use strict";
  const S = window.HmediStore; if (!S) { document.addEventListener("DOMContentLoaded", init, { once: true }); return; }
  const $ = (q, el) => (el || document).querySelector(q);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d) => { if (!d) return ""; const t = new Date(d); return `${t.getFullYear()}.${String(t.getMonth() + 1).padStart(2, "0")}.${String(t.getDate()).padStart(2, "0")}`; };
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

  const card = (p) => `<a class="ins-card" href="post.html?slug=${encodeURIComponent(p.slug)}">
      <div class="ins-thumb" ${p.cover_url ? `style="background-image:url('${esc(p.cover_url)}')"` : ""}>${p.cover_url ? "" : `<span>${esc((tagsOf(p)[0] || "Insight"))}</span>`}</div>
      <div class="ins-body"><div class="ins-tagline">${tagsOf(p).slice(0, 2).map((t) => `<span>${esc(t)}</span>`).join("")}</div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt || "")}</p><div class="ins-meta"><span>${fmtDate(p.published_at || p.created_at)}</span>${p.author ? `<span>${esc(p.author)}</span>` : ""}</div></div></a>`;

  async function list() {
    const grid = $("#insGrid"); if (!grid) return;
    let posts = [];
    try { await S.ready(); posts = await S.listPosts(); } catch (e) { grid.innerHTML = '<div class="ins-empty">글을 불러오지 못했습니다.</div>'; return; }
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
      if (!p || (p.status !== "published" && !sessionStorage.getItem("hmedi_admin_session") && !localStorage.getItem("hmedi_is_admin"))) { $("#postTitle").textContent = "글을 찾을 수 없습니다"; $("#postBody").innerHTML = '<p>삭제되었거나 아직 공개되지 않은 글입니다.</p>'; return; }
      document.title = `${p.title} | 에이치메디솔루션 인사이트`;
      const setMeta = (sel, v) => { const m = document.querySelector(sel); if (m && v) m.setAttribute("content", v); };
      setMeta('meta[name="description"]', p.excerpt || ""); setMeta('meta[property="og:title"]', p.title); setMeta('meta[property="og:description"]', p.excerpt || ""); if (p.cover_url) { setMeta('meta[property="og:image"]', p.cover_url); setMeta('meta[name="twitter:image"]', p.cover_url); }
      const canon = document.querySelector('link[rel="canonical"]'); if (canon) canon.setAttribute("href", location.origin + location.pathname + "?slug=" + encodeURIComponent(p.slug));
      $("#postTitle").textContent = p.title;
      $("#postTags").innerHTML = tagsOf(p).map((t) => `<a href="insights.html">${esc(t)}</a>`).join("");
      $("#postMeta").innerHTML = `<span>${fmtDate(p.published_at || p.created_at)}</span><span>${esc(p.author || "에이치메디솔루션")}</span><span>${readMin(p.content)}분 읽기</span>`;
      if (p.cover_url) { const f = $("#postCover"); f.classList.remove("hidden"); f.querySelector("img").src = p.cover_url; f.querySelector("img").alt = p.title; }
      $("#postBody").innerHTML = md(p.content);
      const ld = document.createElement("script"); ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: p.title, description: p.excerpt || "", image: p.cover_url || undefined, datePublished: p.published_at || p.created_at, dateModified: p.updated_at || p.published_at || p.created_at, author: { "@type": "Organization", name: p.author || "에이치메디솔루션" }, publisher: { "@type": "Organization", name: "에이치메디솔루션" }, mainEntityOfPage: location.href });
      document.head.appendChild(ld);
      try { const all = await S.listPosts(); const rel = all.filter((x) => x.slug !== p.slug).slice(0, 3); if (rel.length) $("#postRelated").innerHTML = `<h3>다른 인사이트</h3><div class="ins-grid">${rel.map(card).join("")}</div>`; } catch (e) {}
    } catch (e) { $("#postTitle").textContent = "글을 불러오지 못했습니다"; }
  }
  list(); post();
})();
