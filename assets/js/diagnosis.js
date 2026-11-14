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

  /* 개인정보 동의 [보기] */
  $("#more").addEventListener("click", (e) => { e.preventDefault(); const o = $("#terms").classList.toggle("open"); e.target.textContent = o ? "접기" : "보기"; e.target.setAttribute("aria-expanded", String(o)); });
  form.addEventListener("input", (e) => { const f = e.target.closest(".f"); if (f) f.classList.remove("bad"); });
  form.addEventListener("change", (e) => { const f = e.target.closest(".f"); if (f) f.classList.remove("bad"); });
  ok.addEventListener("change", () => $("#agree").classList.remove("bad"));

  /* 보고서 예시 — 저절로 흐르고, 손가락(PC 는 마우스)으로 잡아 옮길 수도 있다 */
  const gal = $(".gal");
  if (gal) {
    const 반 = () => gal.scrollWidth / 2;                      // 같은 카드 묶음이 두 벌이라 반 바퀴마다 제자리로 감는다
    const 감기 = () => { if (gal.scrollLeft >= 반()) gal.scrollLeft -= 반(); else if (gal.scrollLeft <= 0) gal.scrollLeft += 반(); };
    const 멈춤 = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let 쉼 = 0, 앞 = 0, 남은 = 0, 끌기 = null;
    const 흐르기 = (t) => {
      const 틈 = 앞 ? Math.min(t - 앞, 50) : 0; 앞 = t;
      if (!멈춤 && t > 쉼) { 남은 += 틈 * 0.035; const n = Math.floor(남은); if (n) { gal.scrollLeft += n; 남은 -= n; 감기(); } }
      requestAnimationFrame(흐르기);
    };
    requestAnimationFrame(흐르기);
    const 잠깐쉼 = () => { 쉼 = performance.now() + 2500; };
    gal.addEventListener("touchstart", () => { 쉼 = Infinity; }, { passive: true });
    gal.addEventListener("touchend", 잠깐쉼, { passive: true });
    gal.addEventListener("touchcancel", 잠깐쉼, { passive: true });
    gal.addEventListener("scroll", () => { if (쉼 === Infinity || performance.now() < 쉼) 감기(); }, { passive: true });
    gal.addEventListener("mouseenter", () => { 쉼 = Infinity; });
    gal.addEventListener("mouseleave", () => { if (!끌기) 잠깐쉼(); });
    // PC 마우스로 끌기
    gal.addEventListener("mousedown", (e) => { 끌기 = { x: e.clientX, l: gal.scrollLeft }; gal.classList.add("drag"); e.preventDefault(); });
    addEventListener("mousemove", (e) => { if (!끌기) return; const 갈곳 = 끌기.l - (e.clientX - 끌기.x); gal.scrollLeft = 갈곳; 감기(); if (gal.scrollLeft !== 갈곳) 끌기 = { x: e.clientX, l: gal.scrollLeft }; });
    addEventListener("mouseup", () => { if (!끌기) return; 끌기 = null; gal.classList.remove("drag"); if (!gal.matches(":hover")) 잠깐쉼(); });
    gal.scrollLeft = 1;
  }

  /* 들어온 경로 — 주소의 utm 값 (예: homepage / popup) */
  const 들어온길 = () => { const p = new URLSearchParams(location.search); return ["utm_source", "utm_medium", "utm_campaign"].map((k) => p.get(k)).filter(Boolean).join(" / "); };
  const 주소다듬기 = (v) => { v = v.trim(); return /^https?:\/\//i.test(v) ? v : "https://" + v; };

  const 맞나 = {
    role: () => !!form.querySelector("[name=who]:checked"),
    name: () => $("#name").value.trim() !== "",
    url: () => /^(https?:\/\/)?[^\s.]+\.[^\s]{2,}$/i.test($("#url").value.trim()),
    tel: () => /^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(tel.value),
  };

  /* 보내기 — 한 곳이라도 받으면 접수된 것으로 본다 */
  const 보내기 = async (d) => {
    const 글 = ["홈페이지: " + d.url, d.question.length ? "궁금한 질문\n" + d.question.map((x, i) => `${i + 1}. ${x}`).join("\n") : "궁금한 질문: 없음"].join("\n");
    const row = { type: "AI 노출 무료 진단", name: d.role, phone: d.tel, hospital: d.name, region: "", program: "AI 노출 무료 진단", situation: d.source ? "들어온 경로: " + d.source : "", message: 글, page: "diagnosis" };
    const 일 = [];
    // ① 상담 신청과 같은 저장소 — 관리자 페이지에 쌓이고, 문자 · 이메일 알림이 나간다
    일.push((async () => { const S = window.HmediStore; if (!S) throw new Error("no store"); await S.ready(); await S.saveInquiry(row); })());
    // ② 이메일 알림 (Web3Forms)
    if (cfg.notifyKey) 일.push(fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ access_key: cfg.notifyKey, subject: `[무료 진단 신청] ${d.name} · ${d.role}`, from_name: "에이치메디솔루션 홈페이지", "신청하시는 분": d.role, "병원 이름": d.name, "홈페이지 주소": d.url, "연락처": d.tel, "궁금한 질문": d.question.length ? d.question.join("\n") : "없음", "들어온 경로": d.source || "-", "관리자 페이지": location.origin + "/admin.html", botcheck: "" }) })
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
    const d = { role: form.querySelector("[name=who]:checked").value, name: $("#name").value.trim(), url: 주소다듬기($("#url").value), tel: tel.value, question: 질문들(), agree: true, source: 들어온길(), page: location.origin + location.pathname };
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
