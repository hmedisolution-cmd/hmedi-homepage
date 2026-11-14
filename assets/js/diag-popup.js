/* ==========================================================================
   AI 노출 무료 진단 팝업 (공용 페이지)
   - 들어오면 바로 한 번 뜬다. 신청폼 페이지(/diagnosis)에서는 띄우지 않는다
   - 위쪽에 진단 보고서 예시 카드(신청폼의 것과 같은 7장)가 흘러간다 — 병원 이름은 전부 예시
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

  /* 진단 보고서 예시 카드 7장 — build/src/diagnosis.html 의 카드와 같은 내용 (모양은 site.css 의 .dgp-prev) */
  const 보고서 = "<figure class=\"pg\"><div class=\"pg-in\"><div class=\"sheet\"><div class=\"sh-top\"><div><span>AI 검색 노출 진단 보고서<\/span><b>○○피부과의원<\/b><\/div><em>에이치메디솔루션<\/em><\/div><div class=\"tl\"><div><p>검색 환경 점수<\/p><b>64<small>/ 100<\/small><\/b><i>SEO · GEO · AI 크롤러<\/i><\/div><div><p>언급<\/p><b>7.5<small>%<\/small><\/b><i>3 / 40 답변<\/i><\/div><div><p>추천<\/p><b>2.5<small>%<\/small><\/b><i>1 / 40 답변<\/i><\/div><div><p>자사 인용<\/p><b>0<small>%<\/small><\/b><i>0 / 40 답변<\/i><\/div><\/div><div class=\"bar2\"><p>진단 요약<\/p><i class=\"ln\" style=\"width:94%\"><\/i><i class=\"ln\" style=\"width:80%\"><\/i><i class=\"ln\" style=\"width:58%\"><\/i><\/div><\/div><\/div><figcaption>요약 지표<\/figcaption><\/figure><figure class=\"pg\"><div class=\"pg-in\"><div class=\"sheet\"><div class=\"sh-top\"><div><span>AI 검색 노출 진단 보고서<\/span><b>○○피부과의원<\/b><\/div><em>에이치메디솔루션<\/em><\/div><table class=\"mx\"><tr><th>질문<\/th><th>ChatGPT<\/th><th>Gemini<\/th><th>네이버<\/th><th>구글<\/th><\/tr><tr><td>리프팅 잘하는 곳<\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j m\">언급<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><\/tr><tr><td>울쎄라 가격<\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><\/tr><tr><td>기미 레이저<\/td><td><span class=\"j r\">추천<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><\/tr><tr><td>여드름 흉터<\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j m\">언급<\/span><\/td><\/tr><tr><td>보톡스 잘하는 곳<\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><\/tr><tr><td>피부과 추천<\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j m\">언급<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><\/tr><tr><td>써마지 후기<\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><td><span class=\"j n\">없음<\/span><\/td><\/tr><\/table><div class=\"dgp-lg\"><span><span class=\"j r\">추천<\/span> 권함<\/span><span><span class=\"j m\">언급<\/span> 이름만<\/span><span><span class=\"j n\">없음<\/span><\/span><\/div><\/div><\/div><figcaption>질문별 AI 답변<\/figcaption><\/figure><figure class=\"pg\"><div class=\"pg-in\"><div class=\"sheet\"><div class=\"sh-top\"><div><span>AI 검색 노출 진단 보고서<\/span><b>○○피부과의원<\/b><\/div><em>에이치메디솔루션<\/em><\/div><p class=\"rk-h\">경쟁사 순위 <small>우리 7위 · 답 40개<\/small><\/p><div class=\"rk \"><b>1<\/b><span>A피부과<\/span><i><u style=\"width:100%\"><\/u><\/i><em>13회<\/em><\/div><div class=\"rk \"><b>2<\/b><span>B피부과<\/span><i><u style=\"width:92%\"><\/u><\/i><em>12회<\/em><\/div><div class=\"rk \"><b>3<\/b><span>C의원<\/span><i><u style=\"width:84%\"><\/u><\/i><em>11회<\/em><\/div><div class=\"rk \"><b>4<\/b><span>D피부과<\/span><i><u style=\"width:76%\"><\/u><\/i><em>10회<\/em><\/div><div class=\"rk \"><b>5<\/b><span>E의원<\/span><i><u style=\"width:61%\"><\/u><\/i><em>8회<\/em><\/div><div class=\"rk \"><b>6<\/b><span>F피부과<\/span><i><u style=\"width:38%\"><\/u><\/i><em>5회<\/em><\/div><div class=\"rk me\"><b>7<\/b><span>○○피부과의원 <small>우리<\/small><\/span><i><u style=\"width:23%\"><\/u><\/i><em>3회<\/em><\/div><\/div><\/div><figcaption>경쟁사 순위<\/figcaption><\/figure><figure class=\"pg\"><div class=\"pg-in\"><div class=\"sheet\"><div class=\"sh-top\"><div><span>AI 검색 노출 진단 보고서<\/span><b>○○피부과의원<\/b><\/div><em>에이치메디솔루션<\/em><\/div><div class=\"dgp-ring\"><svg viewBox=\"0 0 120 120\"><defs><linearGradient id=\"dgpRg\" x1=\"0\" x2=\"1\" y1=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#6D3DF5\"/><stop offset=\"1\" stop-color=\"#12B5D6\"/><\/linearGradient><\/defs><circle cx=\"60\" cy=\"60\" r=\"50\" fill=\"none\" stroke=\"#ececf1\" stroke-width=\"12\"/><circle cx=\"60\" cy=\"60\" r=\"50\" fill=\"none\" stroke=\"url(#dgpRg)\" stroke-width=\"12\" stroke-linecap=\"round\" pathLength=\"100\" stroke-dasharray=\"64 100\" transform=\"rotate(-90 60 60)\"/><\/svg><b>64<\/b><small>/ 100<\/small><\/div><div class=\"sc\"><span>SEO<\/span><i><u style=\"width:72%\"><\/u><\/i><em>72<\/em><\/div><div class=\"sc\"><span>GEO<\/span><i><u style=\"width:55%\"><\/u><\/i><em>55<\/em><\/div><div class=\"sc\"><span>AI 크롤러<\/span><i><u style=\"width:61%\"><\/u><\/i><em>61<\/em><\/div><div class=\"bar2\"><p>검색엔진 등록<\/p><div class=\"sc\" style=\"margin-top:2px\"><span>네이버<\/span><i><u style=\"width:100%\"><\/u><\/i><em>O<\/em><\/div><div class=\"sc\"><span>구글 · 빙<\/span><i><u style=\"width:0\"><\/u><\/i><em>X<\/em><\/div><\/div><\/div><\/div><figcaption>검색 환경 점수<\/figcaption><\/figure><figure class=\"pg\"><div class=\"pg-in\"><div class=\"sheet\"><div class=\"sh-top\"><div><span>AI 검색 노출 진단 보고서<\/span><b>○○피부과의원<\/b><\/div><em>에이치메디솔루션<\/em><\/div><div class=\"tk\"><b>1<\/b><span>병원 정보 구조화 데이터<i>AI가 병원 이름 · 주소 · 진료를 읽게 합니다<\/i><\/span><em class=\"\">높음<\/em><\/div><div class=\"tk\"><b>2<\/b><span>질문 · 답변(FAQ) 페이지<i>환자가 묻는 질문에 답하는 페이지<\/i><\/span><em class=\"\">높음<\/em><\/div><div class=\"tk\"><b>3<\/b><span>AI 크롤러 허용<i>GPTBot 등이 막혀 있습니다<\/i><\/span><em class=\"mid\">중간<\/em><\/div><div class=\"tk\"><b>4<\/b><span>구글 · 빙 등록<i>검색 등록이 되어 있지 않습니다<\/i><\/span><em class=\"mid\">중간<\/em><\/div><div class=\"tk\"><b>5<\/b><span>페이지 제목 · 설명 정비<i>12개 페이지 제목이 같습니다<\/i><\/span><em class=\"mid\">중간<\/em><\/div><\/div><\/div><figcaption>먼저 고칠 일<\/figcaption><\/figure><figure class=\"pg\"><div class=\"pg-in\"><div class=\"sheet\"><div class=\"sh-top\"><div><span>AI 검색 노출 진단 보고서<\/span><b>○○피부과의원<\/b><\/div><em>에이치메디솔루션<\/em><\/div><p class=\"qq-h\">병원 이름이 나오지 않은 질문 5개<\/p><div class=\"qq\"><p><small>Q02<\/small>강남역 울쎄라 가격 괜찮은 피부과<\/p><span>대신 언급된 곳: A피부과 · B피부과<\/span><\/div><div class=\"qq\"><p><small>Q05<\/small>강남 보톡스 잘하는 곳 추천<\/p><span>대신 언급된 곳: A피부과 · C의원<\/span><\/div><div class=\"qq\"><p><small>Q07<\/small>써마지 후기 좋은 피부과<\/p><span>대신 언급된 곳: B피부과<\/span><\/div><div class=\"qq\"><p><small>Q09<\/small>강남역 피부과 어디가 좋아<\/p><span>대신 언급된 곳: A피부과 · D피부과<\/span><\/div><\/div><\/div><figcaption>놓친 질문<\/figcaption><\/figure><figure class=\"pg\"><div class=\"pg-in\"><div class=\"sheet\"><div class=\"sh-top\"><div><span>AI 검색 노출 진단 보고서<\/span><b>○○피부과의원<\/b><\/div><em>에이치메디솔루션<\/em><\/div><p class=\"op\"><b>리프팅 · 보톡스 질문에서 경쟁 병원 두 곳이 반복해서 추천됩니다.<\/b> 홈페이지에 시술별 설명은 있으나 AI가 읽을 수 있는 병원 정보와 질문 · 답변이 없어, 답변의 근거로 쓰이지 못하고 있습니다.<\/p><div class=\"bar2\"><p>개선 방향<\/p><i class=\"ln\" style=\"width:96%\"><\/i><i class=\"ln\" style=\"width:88%\"><\/i><i class=\"ln\" style=\"width:92%\"><\/i><i class=\"ln\" style=\"width:64%\"><\/i><\/div><\/div><\/div><figcaption>진단 의견<\/figcaption><\/figure>";

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
      '<div class="dgp-prev" aria-hidden="true"><p class="dgp-prev-h"><span>진단 보고서 예시</span><small>실제 보고서 구성</small></p><div class="dgp-flow"><div class="dgp-track">' + 보고서 + 보고서 + '</div></div></div>' +
      '<div class="dgp-body"><span class="dgp-tag">무료 진단</span>' +
      '<strong class="dgp-title" id="dgpTitle">우리 병원, <span>AI가 추천하고 있을까요?</span></strong>' +
      '<p class="dgp-desc">AI 추천 현황과 홈페이지 SEO · GEO 점수를 무료로 진단하여 드립니다.</p>' +
      '<a class="dgp-go" href="' + 링크("popup") + '">무료 진단 신청하기</a>' +
      '<div class="dgp-bar"><button type="button" class="dgp-today">오늘 하루 보지 않기</button><i></i><button type="button" class="dgp-close">닫기</button></div></div></div>';
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

  // 메뉴 · 상세 창이 떠 있거나 탭이 가려져 있으면 기다린다. 메인 안내 팝업(popup.js)이 먼저 떠 있으면 겹쳐 띄우지 않고 단추만 남긴다
  // (보통은 이 팝업이 먼저 뜨고, popup.js 는 이 팝업이 떠 있으면 그 화면에서는 나오지 않는다)
  const 시도 = () => {
    if (오늘안봄() || 닫았음()) return 단추();
    if (document.querySelector(".hpop")) return 단추();
    if (document.querySelector(".modal.is-open") || document.body.classList.contains("is-locked") || document.body.classList.contains("menu-open") || document.hidden) return setTimeout(시도, 1200);
    열기();
  };
  if (오늘안봄() || 닫았음()) 단추(); else setTimeout(시도, 350);
})();
