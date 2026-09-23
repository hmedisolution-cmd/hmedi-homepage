/* ==========================================================================
   에이치메디솔루션 홈페이지 스크립트
   - 헤더 스크롤 / 모바일 메뉴
   - 스크롤 리빌 · 숫자 카운터 · 성공사례 막대
   - 마케팅 프로그램 카드 렌더링 + 상세 모달
   - 포트폴리오 탭 + 라이트박스
   - 자가진단 체크리스트
   - 문의 폼 (메일 작성 창 열기)
   ========================================================================== */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const fmt = (n) => n.toLocaleString("ko-KR");
  const CONTACT_EMAIL = "hmedi@hmedisolution.com";

  /* ---------- 헤더 ---------- */
  const header = $(".header");
  const topBtn = $(".quick a.top");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 10);
    if (topBtn) topBtn.classList.toggle("is-visible", y > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const burger = $(".burger");
  const mobileNav = $(".mobile-nav");
  const closeMobile = () => {
    burger.classList.remove("is-open");
    mobileNav.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    burger.setAttribute("aria-expanded", "false");
  };
  burger.addEventListener("click", () => {
    const open = !mobileNav.classList.contains("is-open");
    burger.classList.toggle("is-open", open);
    mobileNav.classList.toggle("is-open", open);
    document.body.classList.toggle("no-scroll", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  $$(".mobile-nav a").forEach((a) => a.addEventListener("click", closeMobile));

  /* 현재 섹션 내비 활성화 */
  const navLinks = $$(".nav a[href^='#']");
  const sections = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const navObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + e.target.id));
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );
    sections.forEach((s) => navObs.observe(s));
  }

  /* ---------- 스크롤 리빌 ---------- */
  const revealEls = $$("[data-reveal], [data-stagger]");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => obs.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- 숫자 카운터 ---------- */
  const counters = $$("[data-count]");
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const dur = 1600;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = target * eased;
      el.textContent = decimals ? val.toFixed(decimals) : fmt(Math.round(val));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const cObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            runCounter(e.target);
            cObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cObs.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = c.dataset.count));
  }

  /* ---------- 성공사례 막대 ---------- */
  const bars = $$(".bar .fill[data-width]");
  if ("IntersectionObserver" in window) {
    const bObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.style.width = e.target.dataset.width + "%";
            bObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    bars.forEach((b) => bObs.observe(b));
  } else {
    bars.forEach((b) => (b.style.width = b.dataset.width + "%"));
  }

  /* ---------- 마케팅 프로그램 ---------- */
  const programs = window.HMEDI_PROGRAMS || [];
  const grid = $("#programGrid");
  const priceHtml = (p, big) => {
    if (p.price == null) {
      return `<span class="price">별도 문의</span>`;
    }
    return `<span class="price">${fmt(p.price)}<small>원 / ${p.unit}</small></span>`;
  };
  const badgesHtml = (p) => p.badges.map((b) => `<span class="badge ${b.cls}">${b.text}</span>`).join("");

  const renderPrograms = (filter) => {
    if (!grid) return;
    const list = programs.filter((p) => filter === "all" || p.group === filter);
    grid.innerHTML = list
      .map((p, i) => {
        const hl = p.highlights
          .map((h) => (typeof h === "string" ? `<li>${h}</li>` : `<li class="${h.isNew ? "is-new" : ""}">${h.text}</li>`))
          .join("");
        const icon = p.logo ? `<img src="${p.logo}" alt="${p.name} 로고">` : p.icon;
        return `
          <article class="product ${p.featured ? "is-featured" : ""}" data-id="${p.id}" style="animation: fadeUp .6s cubic-bezier(.22,1,.36,1) ${i * 0.08}s both" tabindex="0" role="button" aria-label="${p.name} 상세 보기">
            <div class="product-badges">${badgesHtml(p)}</div>
            <div class="product-thumb ${p.theme}"><span class="icon">${icon}</span></div>
            <div class="product-body">
              <h3>${p.name}</h3>
              <p class="desc">${p.tagline}</p>
              <ul>${hl}</ul>
              <div class="product-price">
                <div>${priceHtml(p)}<span class="vat">${p.price == null ? "병원 규모·예산에 맞춰 견적" : "VAT 별도 · 최소 3개월"}</span></div>
              </div>
              <div class="product-actions">
                <button class="btn btn--ghost btn--sm js-detail" type="button">자세히 보기</button>
                <a class="btn btn--primary btn--sm js-inquiry" href="#contact" data-program="${p.name}">상담 신청</a>
              </div>
            </div>
          </article>`;
      })
      .join("");
  };
  renderPrograms("all");

  $$(".program-tabs .tab").forEach((t) =>
    t.addEventListener("click", () => {
      $$(".program-tabs .tab").forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
      renderPrograms(t.dataset.filter);
    })
  );

  /* 상세 모달 */
  const modal = $("#programModal");
  const panel = $(".modal-panel", modal);
  let lastFocus = null;
  const openModal = (id) => {
    const p = programs.find((x) => x.id === id);
    if (!p) return;
    const rows = p.items
      .map(
        (it) => `<tr class="${it.cls || ""}"><th>${it.name}</th><td>${it.desc}</td><td class="qty">${it.qty}</td></tr>`
      )
      .join("");
    const notes = p.notes
      .map((n) => (typeof n === "string" ? `<li>${n}</li>` : `<li class="${n.hl ? "hl" : ""}">${n.text}</li>`))
      .join("");
    const aiBox = p.aiBox
      ? `<div class="ai-box">${p.aiBox
          .map((r) => `<div class="row"><i>${r.icon}</i><div><strong>${r.title}</strong><span>${r.text}</span></div></div>`)
          .join("")}</div>`
      : "";
    const icon = p.logo ? `<img src="${p.logo}" alt="" style="height:36px;background:#fff;padding:6px 10px;border-radius:10px">` : `<span style="font-size:36px">${p.icon}</span>`;
    panel.innerHTML = `
      <button class="modal-close" type="button" aria-label="닫기">✕</button>
      <div class="modal-hero product-thumb ${p.theme}" style="height:auto;display:block">
        <div class="badges">${badgesHtml(p)}</div>
        <div style="position:relative;margin-bottom:10px">${icon}</div>
        <h2>${p.name}</h2>
        <p>${p.desc}</p>
        <div class="mprice">${p.price == null ? `<strong>별도 문의</strong><span>병원 규모·예산에 맞춰 견적을 드립니다</span>` : `<strong>${fmt(p.price)}원</strong><span>/ ${p.unit} · VAT 별도</span>`}</div>
      </div>
      <div class="modal-body">
        ${aiBox}
        <h4>포함 구성</h4>
        <table class="detail-table">
          <thead><tr><th>항목</th><th>상세설명</th><th style="text-align:right">제공</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <ul class="modal-notes">${notes}</ul>
        <div class="modal-cta">
          <a class="btn btn--primary js-inquiry" href="#contact" data-program="${p.name}">이 프로그램 상담 신청</a>
          <a class="btn btn--ghost" href="tel:01082630982">전화 문의 010-8263-0982</a>
        </div>
      </div>`;
    lastFocus = document.activeElement;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    panel.scrollTop = 0;
    $(".modal-close", panel).focus();
    if (history.replaceState) history.replaceState(null, "", "#program-" + p.id);
  };
  const closeModal = () => {
    if (!modal.classList.contains("is-open")) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (history.replaceState) history.replaceState(null, "", "#programs");
    if (lastFocus) lastFocus.focus();
  };
  if (grid) {
    grid.addEventListener("click", (e) => {
      const inquiry = e.target.closest(".js-inquiry");
      if (inquiry) return; // 상담 신청은 아래 공통 핸들러에서 처리
      const card = e.target.closest(".product");
      if (card) openModal(card.dataset.id);
    });
    grid.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("product")) {
        e.preventDefault();
        openModal(e.target.dataset.id);
      }
    });
  }
  modal.addEventListener("click", (e) => {
    if (e.target.closest(".modal-close") || e.target.classList.contains("modal-backdrop")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeModal();
      closeLightbox();
    }
  });
  /* 딥링크: #program-standard 등 */
  const hashId = (location.hash.match(/^#program-([a-z]+)$/) || [])[1];
  if (hashId) setTimeout(() => openModal(hashId), 400);

  /* 상담 신청 → 폼에 프로그램 자동 선택 */
  document.addEventListener("click", (e) => {
    const a = e.target.closest(".js-inquiry");
    if (!a) return;
    const sel = $("#f-program");
    if (sel && a.dataset.program) {
      const opt = Array.from(sel.options).find((o) => o.value === a.dataset.program);
      if (opt) sel.value = a.dataset.program;
    }
    closeModal();
  });

  /* ---------- 포트폴리오 ---------- */
  const PORTFOLIO = {
    blog: {
      desc: "병원별 맞춤 디자인 · 재사용 없이 새 이미지 제작 · 정확한 정보전달",
      items: [
        { img: "assets/img/pf-blog-01.webp", title: "질환정보 · 궤양성 대장염", sub: "인천 송도외과 병원 블로그", url: "https://blog.naver.com/songdogs2/223242091909" },
        { img: "assets/img/pf-blog-02.webp", title: "질환정보 · 인대 재건술", sub: "금천구 정형외과 병원 블로그", url: "https://blog.naver.com/csm5678/223229043453" },
        { img: "assets/img/pf-blog-03.webp", title: "건강정보 · 고혈압 관리방법", sub: "신기시장 내과 병원 블로그", url: "https://blog.naver.com/incheonjckim/223244056137" },
        { img: "assets/img/pf-blog-04.webp", title: "시술정보 · 여드름 골드PTT", sub: "도곡동 피부과 병원 블로그", url: "https://blog.naver.com/galleriaderma/223387286028" },
        { img: "assets/img/pf-blog-05.webp", title: "시술정보 · 풀페이스 필러", sub: "압구정 피부과 병원 블로그", url: "https://blog.naver.com/reyou_clinicp/223241130231" },
        { img: "assets/img/pf-blog-06.webp", title: "시술정보 · BMAC 주사치료", sub: "부천 재활병원 병원 블로그", url: "https://blog.naver.com/ysfirst9119/223381121075" },
      ],
    },
    external: {
      desc: "생생한 방문후기 · 실제 환자 동선 그대로 · 실제 블로거 섭외하여 진행",
      items: [
        { img: "assets/img/pf-ext-01.webp", title: "투데이라섹 후기", sub: "방문후기형 외부 블로그 포스팅", url: "https://blog.naver.com/brunchnyang/223329227449" },
        { img: "assets/img/pf-ext-02.webp", title: "임플란트 후기", sub: "방문후기형 외부 블로그 포스팅", url: "https://blog.naver.com/jiwoo01029/223251795930" },
        { img: "assets/img/pf-ext-03.webp", title: "치질수술 후기", sub: "방문후기형 외부 블로그 포스팅", url: "https://blog.naver.com/fgfg0982/223245291264" },
      ],
    },
    design: {
      desc: "원내 이미지 제작 · 홈페이지형 블로그 제작 · 온오프라인 이미지 제작",
      items: [
        { img: "assets/img/pf-design-01.webp", title: "오전 휴진 안내문", sub: "원내 안내 이미지" },
        { img: "assets/img/pf-design-02.webp", title: "영수증 리뷰 참여 안내", sub: "원내 안내 이미지" },
        { img: "assets/img/pf-design-03.webp", title: "송도외과 홈페이지형 블로그", sub: "홈페이지형 블로그 제작", square: true },
        { img: "assets/img/pf-design-04.webp", title: "갤러리아피부과 홈페이지형 블로그", sub: "홈페이지형 블로그 제작", square: true },
      ],
    },
    instagram: {
      desc: "진료정보 안내 · 이벤트 이미지 제작 · 기획부터 디자인까지",
      items: [
        { img: "assets/img/pf-insta-01.webp", title: "피부과 인스타그램 피드", sub: "시술 안내 · 리얼 리뷰 · 패키지 기획", square: true },
        { img: "assets/img/pf-insta-02.webp", title: "리프팅 패키지 피드", sub: "장비 소개 · 이벤트 기획 게시물", square: true },
      ],
    },
    cafe: {
      desc: "질의응답 형식 · 병원 추천 게시물 · 맘카페 침투 마케팅",
      items: [
        { img: "assets/img/pf-cafe-01.webp", title: "부산 코재수술 질문글", sub: "질의응답 형식 병원 추천" },
        { img: "assets/img/pf-cafe-02.webp", title: "부산맘 카페 후기글", sub: "자연스러운 병원 상호 노출" },
      ],
    },
  };
  const pfGrid = $("#pfGrid");
  const pfDesc = $("#pfDesc");
  const renderPortfolio = (key) => {
    const cat = PORTFOLIO[key];
    if (!cat || !pfGrid) return;
    pfDesc.textContent = cat.desc;
    pfGrid.innerHTML = cat.items
      .map(
        (it, i) => `
        <figure class="pf-item ${it.square ? "is-square" : ""}" data-idx="${i}" style="animation-delay:${i * 0.07}s" tabindex="0" role="button" aria-label="${it.title} 크게 보기">
          <img src="${it.img}" alt="${it.title}" loading="lazy">
          <figcaption class="pf-cap"><strong>${it.title}</strong><span>${it.sub}</span>${it.url ? `<a class="link" href="${it.url}" target="_blank" rel="noopener">포스팅 보기 ↗</a>` : ""}</figcaption>
        </figure>`
      )
      .join("");
    pfGrid.dataset.cat = key;
  };
  renderPortfolio("blog");
  $$(".pf-tabs .tab").forEach((t) =>
    t.addEventListener("click", () => {
      $$(".pf-tabs .tab").forEach((x) => x.classList.remove("is-active"));
      t.classList.add("is-active");
      renderPortfolio(t.dataset.cat);
    })
  );

  /* 라이트박스 */
  const lightbox = $("#lightbox");
  const lbImg = $("img", lightbox);
  const lbCap = $(".lightbox-cap", lightbox);
  const openLightbox = (it) => {
    lbImg.src = it.img;
    lbImg.alt = it.title;
    lbCap.innerHTML = `<span>${it.title} · ${it.sub}</span>${it.url ? `<a href="${it.url}" target="_blank" rel="noopener">네이버 블로그에서 보기 ↗</a>` : ""}`;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };
  const closeLightbox = () => {
    if (!lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };
  if (pfGrid) {
    pfGrid.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const fig = e.target.closest(".pf-item");
      if (!fig) return;
      openLightbox(PORTFOLIO[pfGrid.dataset.cat].items[fig.dataset.idx]);
    });
    pfGrid.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("pf-item")) {
        e.preventDefault();
        openLightbox(PORTFOLIO[pfGrid.dataset.cat].items[e.target.dataset.idx]);
      }
    });
  }
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.closest(".lightbox-close")) closeLightbox();
  });

  /* ---------- 자가진단 체크리스트 ---------- */
  const checks = $$(".checklist input");
  const result = $("#checkResult");
  const updateCheck = () => {
    const n = checks.filter((c) => c.checked).length;
    const total = checks.length;
    let msg;
    if (n === 0) msg = "항목을 체크해 보세요. 마케팅 진행 시 놓친 부분이 있는지 확인해 드립니다.";
    else if (n === total) msg = "모든 항목을 갖추셨네요! 그래도 성과가 없다면 로직 점검이 필요합니다.";
    else if (n >= total - 2) msg = "기본기는 갖추셨습니다. 빠진 항목 보완만으로도 성과가 달라질 수 있어요.";
    else msg = "놓친 항목이 많습니다. 지금까지의 마케팅이 효과를 보지 못한 이유일 수 있어요.";
    result.innerHTML = `<span><strong>${n} / ${total}</strong> 항목 충족 · ${msg}</span><a class="btn btn--white btn--sm" href="#contact">무료 진단 받기</a>`;
  };
  checks.forEach((c) => c.addEventListener("change", updateCheck));
  if (result) updateCheck();

  /* ---------- 문의 폼 ---------- */
  const form = $("#inquiryForm");
  const toast = $("#toast");
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      if (!d.name || !d.phone) {
        showToast("성함과 연락처를 입력해 주세요.");
        return;
      }
      const subject = `[홈페이지 문의] ${d.hospital || d.name} - ${d.program || "프로그램 미정"}`;
      const body = [
        `성함: ${d.name}`,
        `병원명: ${d.hospital || "-"}`,
        `연락처: ${d.phone}`,
        `관심 프로그램: ${d.program || "-"}`,
        `지역: ${d.region || "-"}`,
        "",
        "문의 내용:",
        d.message || "-",
      ].join("\n");
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      showToast("메일 작성 창을 열었습니다. 전송 버튼을 눌러 주세요.");
    });
  }

  /* ---------- 히어로 스파크라인 ---------- */
  const spark = $("#sparkPath");
  if (spark) {
    const data = [56, 62, 48, 70, 58, 74, 66, 80, 72, 88, 78, 96, 90, 104];
    const w = 360, h = 110, pad = 6;
    const max = Math.max(...data), min = Math.min(...data);
    const pts = data.map((v, i) => [
      pad + (i * (w - pad * 2)) / (data.length - 1),
      h - pad - ((v - min) / (max - min)) * (h - pad * 2),
    ]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    spark.setAttribute("d", d);
    const fill = $("#sparkFill");
    if (fill) fill.setAttribute("d", d + ` L ${pts[pts.length - 1][0].toFixed(1)} ${h} L ${pts[0][0].toFixed(1)} ${h} Z`);
  }

  /* ---------- 푸터 연도 ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
