/* ==========================================================================
   HMEDISOLUTION — shared behaviour
   header · menu overlay · hero slider · reveal · counters · charts ·
   programs (cards + modal) · portfolio filter · tabs · faq · checklist · form
   ========================================================================== */
(function () {
  "use strict";

  /* ---------- 모바일 히어로 높이 고정 ----------
     모바일 브라우저는 스크롤 중 주소창이 접히며 뷰포트 높이가 계속 바뀐다.
     첫 진입 시의 높이를 한 번만 기억해 두고, 화면 너비(회전)가 바뀔 때만 다시 잰다. */
  const heroH = () => {
    if (window.innerWidth > 640) { document.documentElement.style.removeProperty("--hero-h"); return; }
    document.documentElement.style.setProperty("--hero-h", window.innerHeight + "px");
  };
  let heroW = window.innerWidth; heroH();
  window.addEventListener("resize", () => { if (window.innerWidth !== heroW) { heroW = window.innerWidth; heroH(); } });
  window.addEventListener("orientationchange", () => setTimeout(() => { heroW = window.innerWidth; heroH(); }, 350));
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const fmt = (n) => n.toLocaleString("ko-KR");
  const sent = (t) => { const parts = String(t).split(/(?<=[.!?])\s+(?=\S)/).filter(Boolean); return parts.length < 2 ? t : parts.map((x) => `<span class="sn">${x}</span>`).join(" "); };
  $$(".faq-item.is-open .faq-a").forEach((a) => (a.style.maxHeight = "none"));
  const CONTACT_EMAIL = "hmedi@hmedisolution.com";
  const ICON_ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ---------- Header ---------- */
  const header = $("#siteHeader");
  const heroDark = $("[data-hero-dark]");
  const topBtn = $(".quick a.top");
  const syncHeader = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 24);
    const onDark = heroDark ? y < heroDark.offsetHeight - 70 : false;
    header.classList.toggle("on-dark", onDark);
    if (topBtn) topBtn.classList.toggle("is-visible", y > 700);
  };
  let ticking = false;
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { syncHeader(); ticking = false; }); } }, { passive: true });
  syncHeader();
  if (heroDark && "IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => heroDark.classList.toggle("is-offscreen", !e.isIntersecting)), { threshold: 0 }).observe(heroDark);
  }

  const page = document.body.dataset.page;
  $$(".site-nav a, .menu-links a").forEach((a) => {
    if (a.dataset.nav === page) a.classList.add("is-current");
  });

  const menuBtn = $(".menu-btn");
  const setMenu = (open) => {
    document.body.classList.toggle("menu-open", open);
    document.body.classList.toggle("is-locked", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".menu-overlay a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- Reveal ---------- */
  const splitWords = (el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w) => `<span class="w"><span>${w}</span></span>`).join(" ");
  };
  $$(".split").forEach(splitWords);
  const revealEls = $$("[data-reveal], [data-stagger], .split, .chat, .case");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else revealEls.forEach((el) => el.classList.add("is-in"));

  /* ---------- Counters ---------- */
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1700);
      const v = target * (1 - Math.pow(1 - p, 3));
      el.textContent = dec ? v.toFixed(dec) : fmt(Math.round(v));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); co.unobserve(e.target); } }), { threshold: 0.6 });
    $$("[data-count]").forEach((c) => co.observe(c));
  } else $$("[data-count]").forEach((c) => (c.textContent = c.dataset.count));

  /* ---------- Hero slider ---------- */
  const slider = $(".hero-slider");
  if (slider) {
    const slides = $$(".slide", slider);
    const dots = $(".slider-dots", slider);
    const count = $(".slider-count", slider);
    const DUR = 7000;
    let idx = 0, timer;
    slides.forEach((_, i) => { const d = document.createElement("button"); d.className = "slider-dot"; d.setAttribute("aria-label", `슬라이드 ${i + 1}`); d.addEventListener("click", () => go(i)); dots.appendChild(d); });
    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === idx));
      $$(".slider-dot", dots).forEach((d, i) => { d.classList.remove("is-active"); if (i === idx) { void d.offsetWidth; d.classList.add("is-active"); } });
      if (count) count.innerHTML = `<b>0${idx + 1}</b> / 0${slides.length}`;
      const dur = idx === 0 ? DUR * 1.6 : DUR; slider.style.setProperty("--dur", dur + "ms"); clearTimeout(timer); timer = setTimeout(() => go(idx + 1), dur);
    };
    $(".slider-btn.prev", slider).addEventListener("click", () => go(idx - 1));
    $(".slider-btn.next", slider).addEventListener("click", () => go(idx + 1));
    slider.style.setProperty("--dur", DUR + "ms");
    let sx = 0;
    slider.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    slider.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) go(dx < 0 ? idx + 1 : idx - 1); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearTimeout(timer); else go(idx); });
    go(0);
  }

  /* ---------- Line charts (SVG path from data) ---------- */
  const buildPath = (data, w, h, pad) => {
    const max = Math.max(...data), min = Math.min(...data) * 0.85;
    const pts = data.map((v, i) => [pad + (i * (w - pad * 2)) / (data.length - 1), h - pad - ((v - min) / (max - min)) * (h - pad * 2)]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    return { d, area: d + ` L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z` };
  };
  $$("svg[data-chart]").forEach((svg) => {
    const data = svg.dataset.chart.split(",").map(Number);
    const vb = svg.getAttribute("viewBox").split(" ").map(Number);
    const { d, area } = buildPath(data, vb[2], vb[3], 8);
    const ln = $(".line, .ln", svg), ar = $(".area, .ar", svg);
    if (ln) ln.setAttribute("d", d);
    if (ar) ar.setAttribute("d", area);
  });

  /* ---------- Programs ---------- */
  const programs = window.HMEDI_PROGRAMS || [];
  const grid = $("#programGrid");
  const badges = (p) => p.badges.map((b) => `<span class="badge ${b.cls}">${b.text}</span>`).join("");
  const priceHtml = (p) => p.price == null ? `<span class="p kr">별도 문의</span>` : p.priceFrom ? `<span class="p">${fmt(p.price)}<small>원부터</small></span>` : `<span class="p">${fmt(p.price)}<small>원 / ${p.unit}</small></span>`;
  const renderPrograms = (filter) => {
    if (!grid) return;
    const list = programs.filter((p) => filter === "all" || p.group === filter);
    grid.innerHTML = list.map((p, i) => `
      <article class="pcard ${p.featured ? "is-featured" : ""}" data-id="${p.id}" style="animation-delay:${i * 0.07}s" tabindex="0" role="button" aria-label="${p.name} 상세 보기">
        <div class="pcard-top ${p.theme}">
          <div class="badges">${badges(p)}</div>
          ${p.logo ? `<img class="plogo" src="${p.logo}" alt="${p.name}">` : ""}
          <div class="pname ${p.nameKr ? "kr" : ""}">${p.name}</div>
          <div class="ptag">${sent(p.tagline)}</div>
        </div>
        <div class="pcard-body">
          <ul>${p.highlights.map((h) => typeof h === "string" ? `<li>${h}</li>` : `<li class="${h.isNew ? "plus" : ""}">${h.text}</li>`).join("")}</ul>
          <div class="pcard-price"><div>${priceHtml(p)}<span class="vat">${p.priceNote || (p.price == null ? "병원 규모·예산에 맞춰 견적" : "VAT 별도 · 최소 계약 3개월")}</span></div></div>
          <div class="pcard-actions">
            <button class="btn btn-line btn-sm js-detail" type="button">상세 보기</button>
            <a class="btn btn-ink btn-sm js-inquiry" href="contact.html?program=${encodeURIComponent(p.name)}" data-program="${p.name}">상담 신청</a>
          </div>
        </div>
      </article>`).join("");
  };
  renderPrograms(grid ? grid.dataset.filter || "all" : "all");
  $$(".program-tabs button").forEach((t) => t.addEventListener("click", () => {
    $$(".program-tabs button").forEach((x) => x.classList.remove("is-active")); t.classList.add("is-active"); renderPrograms(t.dataset.filter);
  }));

  const modal = $("#programModal");
  const panel = modal && $(".modal-panel", modal);
  let lastFocus = null;
  const ICON_X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const openModal = (id) => {
    const p = programs.find((x) => x.id === id);
    if (!p || !panel) return;
    const rows = p.items.map((it) => `<tr class="${it.cls || ""}"><th>${it.name}</th><td>${it.desc}</td><td class="q">${it.qty}</td></tr>`).join("");
    const notes = p.notes.map((n) => typeof n === "string" ? `<li>${n}</li>` : `<li class="${n.hl ? "hl" : ""}">${n.text}</li>`).join("");
    const aiBox = p.aiBox ? `<div class="ai-box">${p.aiBox.map((r) => `<div class="row"><i>${r.icon}</i><div><b>${r.title}</b><span>${sent(r.text)}</span></div></div>`).join("")}</div>` : "";
    panel.innerHTML = `
      <button class="modal-close" type="button" aria-label="닫기">${ICON_X}</button>
      <div class="modal-hero pcard-top ${p.theme}" style="min-height:0;display:block">
        <div class="badges">${badges(p)}</div>
        ${p.logo ? `<img class="plogo" src="${p.logo}" alt="">` : ""}
        <h2 class="${p.nameKr ? "kr" : ""}">${p.name}</h2>
        <p>${sent(p.desc)}</p>
        <div class="price">${p.price == null ? `<b>별도 문의</b><span>병원 규모·예산에 맞춰 견적을 드립니다</span>` : p.priceFrom ? `<b>${fmt(p.price)}원~</b><span>${p.priceNote || ""} · VAT 별도</span>` : `<b>${fmt(p.price)}원</b><span>/ ${p.unit} · VAT 별도 · 최소 계약 3개월</span>`}</div>
      </div>
      <div class="modal-body">
        ${aiBox}
        <h4>포함 구성</h4>
        <table class="dt"><thead><tr><th>항목</th><th>상세</th><th style="text-align:right">제공</th></tr></thead><tbody>${rows}</tbody></table>
        <ul class="mnotes">${notes}</ul>
        <div class="mcta">
          <a class="btn btn-accent js-inquiry" href="contact.html?program=${encodeURIComponent(p.name)}">이 프로그램 상담 신청 ${ICON_ARROW}</a>
          <a class="btn btn-line" href="tel:01082630982">전화 문의 010-8263-0982</a>
        </div>
      </div>`;
    lastFocus = document.activeElement;
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-locked"); panel.scrollTop = 0;
    $(".modal-close", panel).focus();
    history.replaceState(null, "", "#program-" + p.id);
  };
  const closeModal = () => {
    if (!modal || !modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus) lastFocus.focus();
  };
  if (grid) {
    grid.addEventListener("click", (e) => { if (e.target.closest(".js-inquiry")) return; const c = e.target.closest(".pcard"); if (c) openModal(c.dataset.id); });
    grid.addEventListener("keydown", (e) => { if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("pcard")) { e.preventDefault(); openModal(e.target.dataset.id); } });
  }
  $$("[data-open-program]").forEach((el) => el.addEventListener("click", (e) => { e.preventDefault(); openModal(el.dataset.openProgram); }));
  if (modal) {
    modal.addEventListener("click", (e) => { if (e.target.closest(".modal-close") || e.target.classList.contains("modal-bg")) closeModal(); });
    const h = (location.hash.match(/^#program-([a-z0-9-]+)$/) || [])[1];
    if (h) setTimeout(() => openModal(h), 350);
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); setMenu(false); } });

  /* ---------- Generic tabs (case / portfolio) ---------- */
  $$("[data-tabs]").forEach((root) => {
    const btns = $$("button[data-tab]", root);
    const panels = $$("[data-panel]", root.closest("section") || document);
    btns.forEach((b) => b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("is-active")); b.classList.add("is-active");
      panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === b.dataset.tab));
    }));
  });
  const pfGrid = $("#pfGrid");
  if (pfGrid) {
    $$(".pf-filters button").forEach((b) => b.addEventListener("click", () => {
      $$(".pf-filters button").forEach((x) => x.classList.remove("is-active")); b.classList.add("is-active");
      const f = b.dataset.filter;
      $$(".tile", pfGrid).forEach((t, i) => { const show = f === "all" || t.dataset.cat === f; t.style.display = show ? "" : "none"; if (show) { t.style.animation = "none"; void t.offsetWidth; t.style.animation = ""; t.style.animationDelay = (i % 6) * 0.06 + "s"; } });
    }));
  }

  /* ---------- FAQ ---------- */
  $$(".faq-item").forEach((item) => {
    const q = $(".faq-q", item), a = $(".faq-a", item);
    q.addEventListener("click", () => {
      const open = item.classList.toggle("is-open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0";
      q.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- Checklist ---------- */
  const checks = $$(".checklist input");
  const result = $("#checkResult");
  if (checks.length && result) {
    const update = () => {
      const n = checks.filter((c) => c.checked).length, total = checks.length;
      const msg = n === 0 ? "항목을 체크해 보세요. 빠진 부분이 성과가 나지 않던 이유일 수 있습니다."
        : n === total ? "모든 항목을 갖추셨습니다. 그래도 성과가 없다면 로직 점검이 필요합니다."
        : n >= total - 2 ? "기본기는 갖추셨습니다. 빠진 항목만 보완해도 결과가 달라집니다."
        : "놓친 항목이 많습니다. 지금까지의 마케팅이 효과를 보지 못한 이유일 수 있습니다.";
      result.innerHTML = `<span><b>${n} / ${total}</b>&nbsp; ${msg}</span><a class="btn btn-white btn-sm" href="contact.html">무료 진단 받기</a>`;
    };
    checks.forEach((c) => c.addEventListener("change", update)); update();
  }

  /* ---------- Contact form ---------- */
  const form = $("#inquiryForm");
  const toast = $("#toast");
  const showToast = (m) => { if (!toast) return; toast.textContent = m; toast.classList.add("is-visible"); clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove("is-visible"), 3200); };
  if (form) {
    const qs = new URLSearchParams(location.search);
    const pre = qs.get("program");
    const type = qs.get("type");
    if (type) { const map = { marketing: "온라인 마케팅", consulting: "개원 컨설팅 · MSO" }; const r = form.querySelector(`input[name="type"][value="${map[type] || ""}"]`); if (r) r.checked = true; }
    const sel = $("#f-program");
    if (pre && sel && Array.from(sel.options).some((o) => o.value === pre)) sel.value = pre;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (!d.name || !d.phone) { showToast("성함과 연락처를 입력해 주세요."); return; }
      const btn = form.querySelector('[type="submit"]'); if (btn) { btn.disabled = true; btn.style.opacity = ".7"; }
      const row = { type: d.type || "", name: d.name.trim(), phone: d.phone.trim(), hospital: (d.hospital || "").trim(), region: (d.region || "").trim(), program: d.program || "", situation: d.status || "", message: (d.message || "").trim(), page: location.pathname.replace(/^.*\//, "") };
      const notify = () => { const key = (window.HMEDI_CONFIG || {}).notifyKey; if (!key) return Promise.resolve();
        return fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ access_key: key, subject: `[상담신청] ${row.name}${row.hospital ? " · " + row.hospital : ""}${row.type ? " · " + row.type : ""}`, from_name: "에이치메디솔루션 홈페이지", "성함": row.name, "연락처": row.phone, "상담 분야": row.type, "병원명": row.hospital, "지역": row.region, "관심 프로그램": row.program, "현재 상황": row.situation, "문의 내용": row.message, "관리자 페이지": location.origin + location.pathname.replace(/[^/]*$/, "") + "admin.html", botcheck: "" }) }).catch(() => {}); };
      try {
        const S = window.HmediStore; if (!S) throw new Error("no store");
        await S.ready(); await S.saveInquiry(row); notify();
        form.reset();
        form.innerHTML = '<div class="form-done"><b>상담 신청이 접수되었습니다.</b><span>빠르게 확인하고 연락드리겠습니다. 급하시면 전화나 카카오톡 채널로 주세요.</span><div><a class="btn btn-accent" href="tel:01082630982">010-8263-0982</a><a class="btn btn-line" href="https://pf.kakao.com/_xmhxgvb" target="_blank" rel="noopener">카카오톡 채널</a></div></div>';
        form.scrollIntoView({ behavior: "smooth", block: "center" });
        showToast("상담 신청이 접수되었습니다.");
      } catch (err) {
        const subject = `[홈페이지 문의 · ${row.type || "일반"}] ${row.hospital || row.name} · ${row.program || "프로그램 미정"}`;
        const body = [`상담 분야: ${row.type || "-"}`, `성함: ${row.name}`, `병원명: ${row.hospital || "-"}`, `연락처: ${row.phone}`, `지역: ${row.region || "-"}`, `관심 프로그램: ${row.program || "-"}`, `현재 상황: ${row.situation || "-"}`, "", "문의 내용:", row.message || "-"].join("\n");
        location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showToast("접수 서버에 연결할 수 없어 메일 작성 창을 열었습니다.");
        if (btn) { btn.disabled = false; btn.style.opacity = ""; }
      }
    });
  }

  /* ---------- 포트폴리오 케이스 상세 ---------- */
  (() => {
    const C = window.HMEDI_CASES; const tiles = $$("[data-case]"); if (!C || !tiles.length) return;
    const m = document.createElement("div"); m.className = "modal"; m.id = "caseModal"; m.setAttribute("aria-hidden", "true"); m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-label", "포트폴리오 상세");
    m.innerHTML = '<div class="modal-bg"></div><div class="modal-panel"></div>'; document.body.appendChild(m);
    const panel = $(".modal-panel", m); let lastFocus = null;
    const open = (id) => {
      const c = C[id]; if (!c) return;
      panel.innerHTML = `
        <button class="modal-close" type="button" aria-label="닫기">${ICON_X}</button>
        <div class="cs">
          <div class="cs-head"><div><div class="cs-idx"><b>${c.no}</b><span>${c.cat}</span></div><h2>${c.title}</h2><p>${c.lead}</p></div>
            <div class="cs-spec">${c.spec.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div></div>
          <div class="cs-vis">${c.visual}</div>
          <ul class="cs-keys">${c.keys.map((k, i) => `<li><i>${String(i + 1).padStart(2, "0")}</i>${k}</li>`).join("")}</ul>
          <div class="cs-foot"><a class="btn btn-accent js-inquiry" href="contact.html">무료 상담 신청 ${ICON_ARROW}</a><a class="btn btn-line" href="${c.link[0]}">${c.link[1]} ${ICON_ARROW}</a></div>
        </div>`;
      lastFocus = document.activeElement; m.classList.add("is-open"); m.setAttribute("aria-hidden", "false"); document.body.classList.add("is-locked"); panel.scrollTop = 0; $(".modal-close", panel).focus();
    };
    const close = () => { if (!m.classList.contains("is-open")) return; m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true"); document.body.classList.remove("is-locked"); if (lastFocus) lastFocus.focus(); };
    tiles.forEach((t) => { t.addEventListener("click", () => open(t.dataset.case)); t.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(t.dataset.case); } }); });
    m.addEventListener("click", (e) => { if (e.target.closest(".modal-close") || e.target.classList.contains("modal-bg")) close(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
  })();

  const y = $("#year"); if (y) y.textContent = new Date().getFullYear();
})();
