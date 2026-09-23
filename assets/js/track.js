/* ==========================================================================
   방문 통계 수집 (공용 페이지)
   - 개인정보 없이 페이지뷰 · 유입경로 · 기기 · 전환(전화/메일/상담 클릭)만 기록
   - 관리자 로그인 상태 · 자동화 브라우저 방문은 제외
   ========================================================================== */
(function () {
  "use strict";
  const S = window.HmediStore; if (!S) return;
  if (navigator.webdriver) return;
  const cfg = window.HMEDI_CONFIG || {};
  if (!cfg.trackAdminVisits && (sessionStorage.getItem("hmedi_admin_session") === "1" || localStorage.getItem("hmedi_is_admin") === "1")) return;

  const get = (k, s = localStorage) => { try { return s.getItem(k); } catch (e) { return null; } };
  const set = (k, v, s = localStorage) => { try { s.setItem(k, v); } catch (e) {} };
  let visitor = get("hmedi_vid"); if (!visitor) { visitor = S.uid(); set("hmedi_vid", visitor); }
  let session = get("hmedi_sid", sessionStorage); const last = +get("hmedi_slast", sessionStorage) || 0;
  if (!session || Date.now() - last > 30 * 60 * 1000) { session = S.uid(); set("hmedi_sid", session, sessionStorage); }
  set("hmedi_slast", String(Date.now()), sessionStorage);

  const base = () => ({
    id: S.uid(), created_at: new Date().toISOString(),
    path: location.pathname.replace(/\/$/, "/index.html").replace(/^.*\//, "/"),
    referrer: document.referrer && !document.referrer.includes(location.host) ? document.referrer : "",
    device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? "mobile" : "desktop",
    screen_w: window.innerWidth, session_id: session, visitor_id: visitor,
    utm: (() => { const q = new URLSearchParams(location.search); const u = {}; ["utm_source", "utm_medium", "utm_campaign"].forEach((k) => { if (q.get(k)) u[k] = q.get(k); }); return Object.keys(u).length ? u : null; })(),
  });
  const log = (type, extra) => S.logEvent({ ...base(), type, ...(extra || {}) });
  window.HmediTrack = log;

  log("pageview");

  /* 전환 클릭: 전화 · 메일 · 상담 신청 버튼 · 문의 폼 제출 */
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a, button"); if (!a) return;
    const href = a.getAttribute("href") || "";
    if (href.startsWith("tel:")) return log("conversion", { meta: { kind: "tel", label: href.slice(4) } });
    if (href.startsWith("mailto:")) return log("conversion", { meta: { kind: "mail" } });
    if (href.includes("pf.kakao.com")) return log("conversion", { meta: { kind: "kakao" } });
    if (a.classList.contains("js-inquiry") || /contact\.html/.test(href)) return log("click", { meta: { kind: "contact_link", label: (a.textContent || "").trim().slice(0, 40) } });
    if (a.classList.contains("js-detail")) return log("click", { meta: { kind: "program_detail", label: (a.closest(".pcard") || {}).dataset ? a.closest(".pcard").dataset.id : "" } });
  }, true);
  const form = document.getElementById("inquiryForm");
  if (form) form.addEventListener("submit", () => { const d = new FormData(form); log("conversion", { meta: { kind: "form", type: d.get("type") || "", program: d.get("program") || "" } }); });

  /* 체류 시간 (페이지 이탈 시) */
  const t0 = Date.now();
  window.addEventListener("pagehide", () => { const sec = Math.round((Date.now() - t0) / 1000); if (sec >= 2) log("leave", { meta: { seconds: Math.min(sec, 3600) } }); });
})();
