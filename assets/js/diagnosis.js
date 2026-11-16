/* ==========================================================================
   AI 노출 무료 진단 신청폼 (/diagnosis)
   - 접수: 상담 신청과 같은 길(inquiries 테이블)로 저장한다 → 문자 · 이메일 알림이 같이 간다
   - HMEDI_CONFIG.diagnosisEndpoint 가 있으면 AI 매니저에도 같은 내용을 보낸다
   ========================================================================== */
(function () {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const form = $("#form"), tel = $("#tel"), ok = $("#ok");
  if (!form) return;
  const cfg = window.HMEDI_CONFIG || {};
  const 열린때 = Date.now();

  /* 연락처 — 숫자만 쳐도 하이픈이 붙는다 */
  tel.addEventListener("input", () => {
    const d = tel.value.replace(/\D/g, "").slice(0, 11);
    tel.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : d.length < 11 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  });

  /* 궁금한 질문 — 한 줄에 하나, 6줄까지 */
  const q = $("#q"), qn = $("#qn"), qf = $("#qf");
  const 질문들 = () => q.value.split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 6);
  const 줄세기 = () => { const 줄 = q.value.split("\n"); if (줄.length > 6) q.value = 줄.slice(0, 6).join("\n"); qn.textContent = 질문들().length; };
  const 높이 = () => { q.style.height = "auto"; q.style.height = q.scrollHeight + 3 + "px"; };
  const 꽉참 = () => { qf.classList.add("full"); clearTimeout(꽉참.t); 꽉참.t = setTimeout(() => qf.classList.remove("full"), 1800); };
  q.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.isComposing && q.value.split("\n").length >= 6) { e.preventDefault(); 꽉참(); } });
  q.addEventListener("input", () => { 줄세기(); 높이(); });

  /* 홈페이지 없음 — 체크하면 주소 칸을 잠그고, 주소 없이 신청할 수 있다 (AI 추천 현황만 진단) */
  const url = $("#url"), 없음 = $("#nosite");
  없음.addEventListener("change", () => {
    url.disabled = 없음.checked;
    if (없음.checked) { url.dataset.v = url.value; url.value = ""; url.placeholder = "홈페이지 없음"; }
    else { url.value = url.dataset.v || ""; url.placeholder = "https://"; }
  });

  /* 개인정보 동의 [보기] */
  $("#more").addEventListener("click", (e) => { e.preventDefault(); const o = $("#terms").classList.toggle("open"); e.target.textContent = o ? "접기" : "보기"; e.target.setAttribute("aria-expanded", String(o)); });
  form.addEventListener("input", (e) => { const f = e.target.closest(".f"); if (f) f.classList.remove("bad"); });
  form.addEventListener("change", (e) => { const f = e.target.closest(".f"); if (f) f.classList.remove("bad"); });
  ok.addEventListener("change", () => $("#agree").classList.remove("bad"));

  /* 보고서 예시 — 저절로 흐르고, 손가락(PC 는 마우스)으로 잡아 옮길 수도 있다.
     transform 으로 흘린다 — scrollLeft 로 옮기면 한 프레임에 1px 씩만 움직여 끊겨 보인다 (site.js 의 flowRow 와 같은 코드) */
  const flowRow = (row, track, speed) => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const n = track.children.length / 2;                // 한 벌의 카드 수 (같은 묶음이 두 벌 들어 있다)
    let period = 0, pos = 0, last = 0, hold = false, hover = false, inView = true, timer = 0, drag = null;
    const measure = () => {
      period = track.children[n].offsetLeft - track.children[0].offsetLeft;   // 한 벌의 너비 = 되감는 거리
      let guard = 0;                                    // 넓은 화면에서 오른쪽이 비지 않게 묶음을 더 붙인다
      while (period && track.scrollWidth < period + row.clientWidth + 40 && guard++ < 6) for (let i = 0; i < n; i++) { const c = track.children[i].cloneNode(true); c.setAttribute("aria-hidden", "true"); track.appendChild(c); }
    };
    const put = () => { if (period) pos = ((pos % period) + period) % period; track.style.transform = "translate3d(" + (-pos).toFixed(2) + "px,0,0)"; };
    const release = (ms) => { clearTimeout(timer); timer = setTimeout(() => { hold = false; }, ms); };
    row.classList.add("is-js"); measure(); put();
    window.addEventListener("resize", measure); window.addEventListener("load", measure);
    // 손가락 · 마우스로 잡아 끌기 (세로로 미는 것은 브라우저가 페이지를 스크롤한다 — CSS touch-action: pan-y)
    row.addEventListener("pointerdown", (e) => { if (e.pointerType === "mouse" && e.button !== 0) return; drag = { x: e.clientX, p: pos, on: false, id: e.pointerId }; hold = true; clearTimeout(timer); });
    row.addEventListener("pointermove", (e) => {
      if (!drag) return; const dx = e.clientX - drag.x;
      if (!drag.on) { if (Math.abs(dx) < 4) return; drag.on = true; row.classList.add("is-drag"); try { row.setPointerCapture(drag.id); } catch (err) {} }
      pos = drag.p - dx; put();
    });
    const end = () => { if (!drag) return; drag = null; row.classList.remove("is-drag"); release(1500); };
    row.addEventListener("pointerup", end); row.addEventListener("pointercancel", end);
    row.addEventListener("wheel", (e) => { if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; e.preventDefault(); pos += e.deltaX; put(); hold = true; release(1200); }, { passive: false });
    row.addEventListener("mouseenter", () => { hover = true; });
    row.addEventListener("mouseleave", () => { hover = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver((es) => es.forEach((e) => { inView = e.isIntersecting; }), { threshold: 0 }).observe(row);
    const tick = (now) => {
      const dt = Math.min(64, now - (last || now)); last = now;
      if (!still && !hold && !hover && inView && !document.hidden) { pos += speed * dt / 1000; put(); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const gal = $(".gal");
  if (gal && gal.querySelector(".track")) flowRow(gal, gal.querySelector(".track"), 35);

  /* 들어온 경로 — 주소의 utm 값 (예: homepage / popup) */
  const 들어온길 = () => { const p = new URLSearchParams(location.search); return ["utm_source", "utm_medium", "utm_campaign"].map((k) => p.get(k)).filter(Boolean).join(" / "); };
  const 주소다듬기 = (v) => { v = v.trim(); return /^https?:\/\//i.test(v) ? v : "https://" + v; };

  const 맞나 = {
    role: () => !!form.querySelector("[name=who]:checked"),
    name: () => $("#name").value.trim() !== "",
    url: () => 없음.checked || /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test(url.value.trim()),
    tel: () => /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(tel.value),
  };

  /* 보내기 — 한 곳이라도 받으면 접수된 것으로 본다 */
  const 보내기 = async (d) => {
    const 글 = ["홈페이지: " + (d.url || "없음"), d.question.length ? "궁금한 질문\n" + d.question.map((x, i) => `${i + 1}. ${x}`).join("\n") : "궁금한 질문: 없음"].join("\n");
    const row = { type: "AI 노출 무료 진단", name: d.role, phone: d.tel, hospital: d.name, region: "", program: "AI 노출 무료 진단", situation: d.source ? "들어온 경로: " + d.source : "", message: 글, page: "diagnosis" };
    const 일 = [];
    // ① 상담 신청과 같은 저장소 — 관리자 페이지에 쌓이고, 문자 · 이메일 알림이 나간다
    일.push((async () => { const S = window.HmediStore; if (!S) throw new Error("no store"); await S.ready(); await S.saveInquiry(row); })());
    // ② 이메일 알림 (Web3Forms)
    if (cfg.notifyKey) 일.push(fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: cfg.notifyKey, subject: `[무료 진단 신청] ${d.name} · ${d.role}`, from_name: "에이치메디솔루션 홈페이지", "신청하시는 분": d.role, "병원 이름": d.name, "홈페이지 주소": d.url || "없음", "연락처": d.tel, "궁금한 질문": d.question.length ? d.question.join("\n") : "없음", "들어온 경로": d.source || "-", "관리자 페이지": location.origin + "/admin.html", botcheck: "" }) })
      .then((r) => { if (!r.ok) throw new Error("mail " + r.status); }));
    // ③ AI 매니저 (받는 주소가 정해지면)
    if (cfg.diagnosisEndpoint) 일.push(fetch(cfg.diagnosisEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }).then((r) => { if (!r.ok) throw new Error("endpoint " + r.status); }));
    const 결과 = await Promise.allSettled(일);
    결과.forEach((x) => { if (x.status === "rejected") console.error("diagnosis send:", x.reason); });
    return 결과.some((x) => x.status === "fulfilled");
  };

  const btn = form.querySelector(".submit"), 오류 = $("#sendErr");
  let 보내는중 = false;
  const 끝 = () => {
    $("#page").style.display = "none"; $("#done").classList.add("show"); scrollTo(0, 0);
    try { const n = new Date(); localStorage.setItem("hmedi_diag_hide", `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`); } catch (e) {}
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (보내는중) return;
    let first = null;
    for (const k in 맞나) { const f = form.querySelector(`[data-f="${k}"]`), good = 맞나[k](); f.classList.toggle("bad", !good); if (!good && !first) first = f.querySelector(".in, input"); }
    $("#agree").classList.toggle("bad", !ok.checked);
    if (first) return first.focus();
    if (!ok.checked) return ok.focus();
    // 스팸: 사람 눈에 안 보이는 칸이 채워졌거나, 열자마자 보낸 신청은 받은 척만 한다
    if ($("#company").value || Date.now() - 열린때 < 2500) return 끝();
    보내는중 = true; btn.disabled = true; btn.textContent = "보내는 중…"; 오류.classList.remove("show");
    const d = { role: form.querySelector("[name=who]:checked").value, name: $("#name").value.trim(), url: 없음.checked ? "" : 주소다듬기(url.value), noSite: 없음.checked, tel: tel.value, question: 질문들(), agree: true, source: 들어온길(), page: location.origin + location.pathname };
    let 됐나 = false;
    try { 됐나 = await 보내기(d); } catch (err) { console.error(err); }
    if (됐나) {
      try { if (window.HmediTrack) window.HmediTrack("conversion", { meta: { kind: "form", type: "AI 노출 무료 진단", program: d.source || "" } }); } catch (err) {}
      끝();
    } else {
      보내는중 = false; btn.disabled = false; btn.textContent = "무료 진단 신청하기"; 오류.classList.add("show");
    }
  });
})();
