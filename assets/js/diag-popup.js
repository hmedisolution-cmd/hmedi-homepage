/* ==========================================================================
   AI 노출 무료 진단 팝업 (공용 페이지)
   - 들어온 지 5초 뒤 한 번. 신청폼 페이지(/diagnosis)에서는 띄우지 않는다
   - [오늘 하루 보지 않기] 는 그날 동안, [닫기] 는 그 방문 동안 다시 띄우지 않는다
   - 닫은 뒤에는 오른쪽 아래에 [무료 진단] 단추를 남긴다
   ========================================================================== */
(function () {
  "use strict";
  if (document.body.getAttribute("data-page") === "diagnosis" || /\/diagnosis(\.html)?\/?$/.test(location.pathname)) return;
  if (/bot|crawl|spider|yeti|lighthouse|pagespeed/i.test(navigator.userAgent)) return;   // 검색 로봇에게는 띄우지 않는다
  const 링크 = (어디) => "/diagnosis?utm_source=homepage&utm_medium=" + 어디;
  const 오늘 = (() => { const n = new Date(); return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`; })();
  const 읽기 = (s, k) => { try { return s.getItem(k); } catch (e) { return null; } };
  const 쓰기 = (s, k, v) => { try { s.setItem(k, v); } catch (e) {} };
  const 오늘안봄 = () => 읽기(localStorage, "hmedi_diag_hide") === 오늘;
  const 닫았음 = () => 읽기(sessionStorage, "hmedi_diag_closed") === "1";
  const 기록 = (label) => { try { if (window.HmediTrack) window.HmediTrack("click", { meta: { kind: "diagnosis", label } }); } catch (e) {} };

  const 단추 = () => {
    if (document.querySelector(".dgp-pill")) return;
    const a = document.createElement("a"); a.className = "dgp-pill"; a.href = 링크("button"); a.textContent = "무료 진단"; a.setAttribute("aria-label", "AI 노출 무료 진단 신청");
    a.addEventListener("click", () => 기록("button"));
    document.body.appendChild(a);
    requestAnimationFrame(() => requestAnimationFrame(() => a.classList.add("is-in")));
  };

  const 열기 = () => {
    const 앞초점 = document.activeElement;
    const w = document.createElement("div"); w.className = "dgp"; w.setAttribute("role", "dialog"); w.setAttribute("aria-modal", "true"); w.setAttribute("aria-labelledby", "dgpTitle");
    w.innerHTML = '<div class="dgp-bg"></div><div class="dgp-card">' +
      '<span class="dgp-tag">무료 진단</span>' +
      '<strong class="dgp-title" id="dgpTitle">우리 병원, <span>AI가 추천하고 있을까요?</span></strong>' +
      '<p class="dgp-desc">AI 추천 현황과 홈페이지 SEO · GEO 점수를 무료로 진단하여 드립니다.</p>' +
      '<a class="dgp-go" href="' + 링크("popup") + '">무료 진단 신청하기</a>' +
      '<div class="dgp-bar"><button type="button" class="dgp-today">오늘 하루 보지 않기</button><i></i><button type="button" class="dgp-close">닫기</button></div></div>';
    document.body.appendChild(w);
    document.body.classList.add("is-locked");
    requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add("is-open")));
    const go = w.querySelector(".dgp-go");
    setTimeout(() => { try { go.focus({ preventScroll: true }); } catch (e) {} }, 60);
    const 키 = (e) => {
      if (e.key === "Escape") return 닫기();
      if (e.key !== "Tab") return;
      const 칸 = Array.from(w.querySelectorAll("a, button")), 처음 = 칸[0], 끝 = 칸[칸.length - 1];
      if (e.shiftKey && document.activeElement === 처음) { e.preventDefault(); 끝.focus(); }
      else if (!e.shiftKey && document.activeElement === 끝) { e.preventDefault(); 처음.focus(); }
    };
    function 닫기(하루) {
      if (하루) 쓰기(localStorage, "hmedi_diag_hide", 오늘);
      쓰기(sessionStorage, "hmedi_diag_closed", "1");
      document.removeEventListener("keydown", 키);
      w.classList.remove("is-open"); document.body.classList.remove("is-locked");
      setTimeout(() => w.remove(), 420);
      if (앞초점 && 앞초점.focus && 앞초점 !== document.body) { try { 앞초점.focus({ preventScroll: true }); } catch (e) {} }
      단추();
    }
    document.addEventListener("keydown", 키);
    w.querySelector(".dgp-bg").addEventListener("click", () => 닫기());
    w.querySelector(".dgp-close").addEventListener("click", () => 닫기());
    w.querySelector(".dgp-today").addEventListener("click", () => 닫기(true));
    go.addEventListener("click", () => { 쓰기(sessionStorage, "hmedi_diag_closed", "1"); 기록("popup"); });
  };

  // 다른 팝업 · 메뉴 · 상세 창이 떠 있으면 기다린다. 메인 안내 팝업이 떴던 화면에서는 겹쳐 띄우지 않고 단추만 남긴다
  let 다른팝업 = false;
  const 바쁨 = () => { if (document.querySelector(".hpop")) 다른팝업 = true; return !!document.querySelector(".hpop, .modal.is-open") || document.body.classList.contains("is-locked") || document.body.classList.contains("menu-open") || document.hidden; };
  const 시도 = () => {
    if (오늘안봄() || 닫았음()) return 단추();
    if (바쁨()) return setTimeout(시도, 1500);
    if (다른팝업) return 단추();
    열기();
  };
  if (오늘안봄() || 닫았음()) 단추(); else setTimeout(시도, 5000);
})();
