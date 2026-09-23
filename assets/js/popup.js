/* ==========================================================================
   메인 팝업 (공용 페이지) — 관리자에서 등록한 팝업을 표시
   - 기간 · 노출 페이지 · 활성 여부 확인, "오늘 하루 닫기" 기억
   - 여러 개면 좌우 스와이프 · 점 표시 · 자동 넘김
   ========================================================================== */
(function () {
  "use strict";
  const S = window.HmediStore; if (!S) return;
  const path = location.pathname.replace(/\/$/, "/index.html").replace(/^.*\//, "/");
  const page = path.replace(/^\//, "").replace(/\.html$/, "") || "index";
  const today = new Date().toISOString().slice(0, 10);
  const hidden = (id) => { try { return localStorage.getItem("hmedi_popup_hide_" + id) === today; } catch (e) { return false; } };

  const render = (list) => {
    const wrap = document.createElement("div"); wrap.className = "hpop"; wrap.setAttribute("role", "dialog"); wrap.setAttribute("aria-label", "안내 팝업");
    wrap.innerHTML = `
      <div class="hpop-bg"></div>
      <div class="hpop-card">
        <div class="hpop-track">${list.map((p) => `
          <a class="hpop-slide" ${p.link_url ? `href="${p.link_url}" ${/^https?:/.test(p.link_url) && !p.link_url.includes(location.host) ? 'target="_blank" rel="noopener"' : ""}` : 'href="javascript:void(0)"'} data-id="${p.id}" style="background:${p.bg_color || "#0a1020"}">
            ${p.image_url ? `<img src="${p.image_url}" alt="${p.title || ""}">` : ""}
            <div class="hpop-shade"></div>
            <div class="hpop-text ${p.text_align || "left"}">
              ${p.brand ? `<span class="hpop-brand">${p.brand}</span>` : ""}
              ${p.title ? `<strong class="hpop-title">${p.title.replace(/\n/g, "<br>")}</strong>` : ""}
              ${p.subtitle ? `<span class="hpop-sub">${p.subtitle}</span>` : ""}
              ${p.button_text ? `<span class="hpop-btn">${p.button_text}</span>` : ""}
            </div>
          </a>`).join("")}</div>
        ${list.length > 1 ? `<div class="hpop-dots">${list.map((_, i) => `<i class="${i === 0 ? "on" : ""}"></i>`).join("")}</div>` : ""}
        <div class="hpop-bar"><button type="button" class="hpop-today">오늘 하루 닫기</button><button type="button" class="hpop-close">닫기</button></div>
      </div>`;
    document.body.appendChild(wrap);
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => wrap.classList.add("is-open"));
    const track = wrap.querySelector(".hpop-track"), dots = Array.from(wrap.querySelectorAll(".hpop-dots i"));
    let idx = 0, timer;
    const go = (n) => { idx = (n + list.length) % list.length; track.style.transform = `translateX(-${idx * 100}%)`; dots.forEach((d, i) => d.classList.toggle("on", i === idx)); if (window.HmediTrack) window.HmediTrack("popup_view", { popup_id: list[idx].id }); clearTimeout(timer); if (list.length > 1) timer = setTimeout(() => go(idx + 1), 5000); };
    go(0);
    let sx = 0; track.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    track.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1); });
    const close = () => { clearTimeout(timer); wrap.classList.remove("is-open"); document.body.classList.remove("is-locked"); setTimeout(() => wrap.remove(), 350); };
    wrap.querySelector(".hpop-close").addEventListener("click", () => { if (window.HmediTrack) window.HmediTrack("popup_close", { popup_id: list[idx].id }); close(); });
    wrap.querySelector(".hpop-today").addEventListener("click", () => { list.forEach((p) => { try { localStorage.setItem("hpop_hide_" + p.id, today); localStorage.setItem("hmedi_popup_hide_" + p.id, today); } catch (e) {} }); if (window.HmediTrack) window.HmediTrack("popup_close", { popup_id: list[idx].id, meta: { today: true } }); close(); });
    wrap.querySelector(".hpop-bg").addEventListener("click", close);
    wrap.querySelectorAll(".hpop-slide").forEach((a) => a.addEventListener("click", (e) => { const id = a.dataset.id; if (window.HmediTrack) window.HmediTrack("popup_click", { popup_id: id }); if (a.getAttribute("href") === "javascript:void(0)") { e.preventDefault(); return; } if (!a.target) close(); }));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); }, { once: true });
  };

  const run = async () => {
    try {
      await S.ready();
      const all = await S.listPopups();
      const now = Date.now();
      const list = all.filter((p) => p.active && !hidden(p.id) && (!p.starts_at || +new Date(p.starts_at) <= now) && (!p.ends_at || +new Date(p.ends_at) >= now) && (!p.show_on || p.show_on === "all" || p.show_on.split(",").map((x) => x.trim()).includes(page)));
      if (list.length) render(list);
    } catch (e) { /* 팝업 실패는 사이트 이용에 영향 없음 */ }
  };
  if (document.readyState === "complete") setTimeout(run, 400); else window.addEventListener("load", () => setTimeout(run, 400));
})();
