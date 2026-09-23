/* ==========================================================================
   관리자 모드
   ========================================================================== */
(function () {
  "use strict";
  const S = window.HmediStore;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const fmt = (n) => Math.round(n).toLocaleString("ko-KR");
  const pct = (n) => (isFinite(n) ? (Math.round(n * 10) / 10) + "%" : "-");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const day = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  const toast = (m, err) => { const t = $("#toast"); t.textContent = m; t.className = "toast on" + (err ? " err" : ""); clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = "toast"), 2800); };
  const PAGE_NAME = { "/index.html": "메인", "/": "메인", "/marketing.html": "온라인 마케팅", "/consulting.html": "개원 컨설팅", "/portfolio.html": "성공사례", "/company.html": "회사소개", "/contact.html": "문의하기", "/admin.html": "관리자" };
  const pageName = (p) => PAGE_NAME[p] || p || "-";
  const sourceOf = (e) => {
    if (e.utm && e.utm.utm_source) return e.utm.utm_source;
    const r = (e.referrer || "").toLowerCase(); if (!r) return "직접 접속";
    if (r.includes("naver")) return r.includes("blog") ? "네이버 블로그" : r.includes("cafe") ? "네이버 카페" : "네이버 검색";
    if (r.includes("google")) return "구글"; if (r.includes("instagram")) return "인스타그램"; if (r.includes("kakao")) return "카카오"; if (r.includes("kmong")) return "크몽"; if (r.includes("daum")) return "다음"; if (r.includes("facebook") || r.includes("fb.")) return "페이스북"; if (r.includes("youtube")) return "유튜브"; if (r.includes("daangn")) return "당근";
    try { return new URL(e.referrer).hostname.replace(/^www\./, ""); } catch (x) { return "기타"; }
  };

  /* ---------- 로그인 ---------- */
  const loginView = $("#loginView"), appView = $("#appView");
  $("#loginMode").innerHTML = S.configured ? "서버(Supabase)에 연결되어 있습니다." : "<b>데모 모드</b> · 서버가 연결되지 않아 이 브라우저 안에서만 저장됩니다.<br>데모 비밀번호: <b>hmedi1234</b> (이메일은 비워도 됩니다) · 실제 연결은 설정 탭 참고";
  if (!S.configured) $("#emailField").classList.add("hidden");
  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const btn = $("#loginBtn"); btn.disabled = true; $("#loginErr").textContent = "";
    try { await S.ready(); await S.auth.signIn($("#l-email").value.trim(), $("#l-pw").value); localStorage.setItem("hmedi_is_admin", "1"); await enter(); }
    catch (err) { $("#loginErr").textContent = err.message || "로그인 실패"; }
    btn.disabled = false;
  });
  $("#logoutBtn").addEventListener("click", async () => { await S.auth.signOut(); localStorage.removeItem("hmedi_is_admin"); appView.classList.add("hidden"); loginView.classList.remove("hidden"); $("#l-pw").value = ""; });

  const enter = async () => {
    const sess = await S.auth.session(); const email = sess && sess.user ? sess.user.email : "admin";
    $("#userBox").textContent = email;
    $("#modeBox").innerHTML = S.configured ? "<b>Connected</b>Supabase 서버 연결됨" : "<b>Demo mode</b>이 브라우저에만 저장됩니다.<br>실제 연결은 설정 탭 참고";
    loginView.classList.add("hidden"); appView.classList.remove("hidden");
    if (!S.configured) { const seeded = await S.seedDemo(); if (seeded) toast("데모 데이터를 채웠습니다 (설정에서 삭제 가능)"); }
    await loadPopups(); await loadDash();
  };

  /* ---------- 내비 ---------- */
  $$(".nav-btn[data-panel]").forEach((b) => b.addEventListener("click", () => { $$(".nav-btn").forEach((x) => x.classList.remove("is-active")); b.classList.add("is-active"); $$(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + b.dataset.panel)); $("#side").classList.remove("open"); if (b.dataset.panel === "conv") renderConv(); if (b.dataset.panel === "set") renderSettings(); }));
  $("#mobMenu").addEventListener("click", () => $("#side").classList.toggle("open"));

  /* ---------- 기간 ---------- */
  let range = { days: 7, from: null, to: null };
  const setRange = (days) => { const to = new Date(); to.setHours(23, 59, 59, 999); const from = new Date(); from.setDate(from.getDate() - (days - 1)); from.setHours(0, 0, 0, 0); range = { days, from, to }; $("#dFrom").value = day(from); $("#dTo").value = day(to); };
  setRange(7);
  $$("#rangeSeg button").forEach((b) => b.addEventListener("click", () => { $$("#rangeSeg button").forEach((x) => x.classList.remove("is-active")); b.classList.add("is-active"); setRange(+b.dataset.days); loadDash(); }));
  const onCustom = () => { const f = $("#dFrom").value, t = $("#dTo").value; if (!f || !t) return; $$("#rangeSeg button").forEach((x) => x.classList.remove("is-active")); const from = new Date(f + "T00:00:00"), to = new Date(t + "T23:59:59.999"); range = { days: Math.round((to - from) / 864e5) + 1, from, to }; loadDash(); };
  $("#dFrom").addEventListener("change", onCustom); $("#dTo").addEventListener("change", onCustom);
  $("#refreshBtn").addEventListener("click", loadDash);
  let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (cur && $("#panel-dash").classList.contains("is-active")) renderDash(); }, 250); });

  /* ---------- 통계 집계 ---------- */
  let cur = null, prev = null, popupsCache = [];
  const agg = (events) => {
    const pv = events.filter((e) => e.type === "pageview");
    const sessions = new Map(); pv.forEach((e) => { const s = sessions.get(e.session_id) || { n: 0, first: e, device: e.device }; s.n++; sessions.set(e.session_id, s); });
    const visitors = new Set(pv.map((e) => e.visitor_id));
    const conv = events.filter((e) => e.type === "conversion");
    const bounce = [...sessions.values()].filter((s) => s.n === 1).length;
    const stay = events.filter((e) => e.type === "leave" && e.meta && e.meta.seconds); const avgStay = stay.length ? stay.reduce((a, e) => a + e.meta.seconds, 0) / stay.length : 0;
    const byDay = {}; pv.forEach((e) => { const k = day(e.created_at); byDay[k] = byDay[k] || { pv: 0, s: new Set(), c: 0 }; byDay[k].pv++; byDay[k].s.add(e.session_id); }); conv.forEach((e) => { const k = day(e.created_at); byDay[k] = byDay[k] || { pv: 0, s: new Set(), c: 0 }; byDay[k].c++; });
    const count = (arr, fn) => { const m = {}; arr.forEach((e) => { const k = fn(e); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
    const pages = count(pv, (e) => pageName(e.path));
    const sources = count([...sessions.values()].map((s) => s.first), sourceOf);
    const devices = count([...sessions.values()], (s) => s.device === "mobile" ? "모바일" : "PC");
    const heat = Array.from({ length: 7 }, () => Array(24).fill(0)); pv.forEach((e) => { const d = new Date(e.created_at); heat[d.getDay()][d.getHours()]++; });
    const popStats = {}; events.forEach((e) => { if (!e.popup_id) return; const p = popStats[e.popup_id] = popStats[e.popup_id] || { view: 0, click: 0, close: 0 }; if (e.type === "popup_view") p.view++; if (e.type === "popup_click") p.click++; if (e.type === "popup_close") p.close++; });
    const entry = count([...sessions.values()].map((s) => s.first), (e) => pageName(e.path));
    return { pv: pv.length, sessions: sessions.size, visitors: visitors.size, conv: conv.length, bounce: sessions.size ? (bounce / sessions.size) * 100 : 0, pps: sessions.size ? pv.length / sessions.size : 0, avgStay, byDay, pages, sources, devices, heat, popStats, entry, convList: conv, clicks: events.filter((e) => e.type === "click") };
  };

  async function loadDash() {
    const body = $("#dashBody"); body.innerHTML = '<div class="loading">불러오는 중…</div>';
    try {
      await S.ready();
      const span = range.to - range.from; const pFrom = new Date(range.from - span - 1), pTo = new Date(range.from - 1);
      const [ev, pev] = await Promise.all([S.queryEvents(range.from.toISOString(), range.to.toISOString()), S.queryEvents(pFrom.toISOString(), pTo.toISOString())]);
      cur = agg(ev); prev = agg(pev);
      $("#dashSub").textContent = `${day(range.from)} ~ ${day(range.to)} · ${fmt(range.days)}일 · 이전 기간과 비교`;
      renderDash(); renderConv();
    } catch (e) { body.innerHTML = `<div class="empty">데이터를 불러오지 못했습니다: ${esc(e.message)}</div>`; }
  }

  const delta = (a, b, invert, unit) => { if (!b) return `<div class="d flat">이전 기간 데이터 없음</div>`; const d = ((a - b) / b) * 100; const up = d > 0; const good = invert ? !up : up; return `<div class="d ${Math.abs(d) < 0.5 ? "flat" : good ? "up" : "down"}">${up ? "▲" : d < 0 ? "▼" : "–"} ${pct(Math.abs(d))} <span>이전 ${unit ? b + unit : fmt(b)}</span></div>`; };
  const kpi = (l, n, unit, d) => `<div class="kpi"><div class="l">${l}</div><div class="n">${n}<small>${unit}</small></div>${d}</div>`;

  function renderDash() {
    const c = cur, p = prev; const body = $("#dashBody");
    if (!c.pv && !c.conv) { body.innerHTML = `<div class="kpis">${kpi("페이지뷰", 0, "", "")}${kpi("방문(세션)", 0, "", "")}${kpi("방문자", 0, "", "")}${kpi("상담 전환", 0, "", "")}${kpi("전환율", "0", "%", "")}${kpi("이탈률", "0", "%", "")}</div><div class="card" style="margin-top:14px"><div class="empty">선택한 기간에 방문 기록이 없습니다.${S.configured ? "" : " 설정 탭에서 데모 데이터를 채우면 화면 구성을 미리 볼 수 있습니다."}</div></div>`; return; }
    const ins = insights(c, p);
    const days = []; for (let d = new Date(range.from); d <= range.to; d.setDate(d.getDate() + 1)) days.push(day(d));
    const series = days.map((k) => ({ k, pv: c.byDay[k] ? c.byDay[k].pv : 0, s: c.byDay[k] ? c.byDay[k].s.size : 0, c: c.byDay[k] ? c.byDay[k].c : 0 }));
    const maxHeat = Math.max(1, ...c.heat.flat());
    body.innerHTML = `
      <div class="kpis">
        ${kpi("페이지뷰", fmt(c.pv), "", delta(c.pv, p.pv))}
        ${kpi("방문 (세션)", fmt(c.sessions), "", delta(c.sessions, p.sessions))}
        ${kpi("순 방문자", fmt(c.visitors), "", delta(c.visitors, p.visitors))}
        ${kpi("상담 전환", fmt(c.conv), "건", delta(c.conv, p.conv))}
        ${kpi("전환율", (c.sessions ? Math.round((c.conv / c.sessions) * 1000) / 10 : 0), "%", delta(c.sessions ? Math.round((c.conv / c.sessions) * 1000) / 10 : 0, p.sessions ? Math.round((p.conv / p.sessions) * 1000) / 10 : 0, false, "%"))}
        ${kpi("이탈률", Math.round(c.bounce), "%", delta(Math.round(c.bounce), Math.round(p.bounce), true, "%"))}
      </div>
      <div class="insights"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z"/></svg></div><div><h3>한눈에 보는 요약</h3><ul>${ins.map((s) => `<li>${s}</li>`).join("")}</ul></div></div>
      <div class="grid">
        <div class="card c-8"><h3>일별 방문 추이 <small>페이지뷰 · 방문(세션) · 상담</small></h3>${lineChart(series)}<div class="legend"><span><i style="background:var(--sky)"></i>페이지뷰</span><span><i style="background:#3648a8"></i>방문(세션)</span><span><i style="background:#16a34a"></i>상담 전환</span></div></div>
        <div class="card c-4"><h3>기기 비율</h3><p class="help">어떤 기기로 들어오는지</p>${donut(c.devices, c.sessions)}</div>
        <div class="card c-6"><h3>유입 경로 <small>방문 기준</small></h3><p class="help">방문자가 어디에서 왔는지</p>${bars(c.sources, c.sessions)}</div>
        <div class="card c-6"><h3>많이 본 페이지 <small>페이지뷰 기준</small></h3>${bars(c.pages, c.pv)}</div>
        <div class="card c-6"><h3>첫 방문 페이지 <small>세션 시작 기준</small></h3><p class="help">어느 페이지로 처음 들어오는지</p>${bars(c.entry, c.sessions)}</div>
        <div class="card c-6"><h3>팝업 성과</h3><p class="help">노출 대비 클릭률(CTR)</p>${popupTable(c.popStats)}</div>
        <div class="card c-12"><h3>요일 · 시간대별 방문 <small>진할수록 많음</small></h3><p class="help">상담 전화가 몰리는 시간대 파악과 광고 시간 설정에 활용하세요</p>${heatmap(c.heat, maxHeat)}</div>
      </div>`;
    $$(".bar .t i", body).forEach((i) => requestAnimationFrame(() => (i.style.width = i.dataset.w + "%")));
    hookTips(body);
  }

  function insights(c, p) {
    const out = [];
    const ch = (a, b) => (b ? Math.round(((a - b) / b) * 100) : null);
    const s = ch(c.sessions, p.sessions);
    out.push(s == null ? `이 기간 방문은 <b>${fmt(c.sessions)}회</b>, 순 방문자는 <b>${fmt(c.visitors)}명</b>입니다.` : s >= 0 ? `방문이 이전 기간보다 <b>${s}% 늘었습니다</b> (${fmt(p.sessions)} → ${fmt(c.sessions)}회).` : `방문이 이전 기간보다 <b>${Math.abs(s)}% 줄었습니다</b> (${fmt(p.sessions)} → ${fmt(c.sessions)}회).`);
    if (c.sources[0]) out.push(`유입은 <b>${esc(c.sources[0][0])}</b>이 가장 많습니다 (${pct((c.sources[0][1] / c.sessions) * 100)}).${c.sources[1] ? ` 다음은 ${esc(c.sources[1][0])} ${pct((c.sources[1][1] / c.sessions) * 100)}.` : ""}`);
    if (c.pages[0]) out.push(`가장 많이 본 페이지는 <b>${esc(c.pages[0][0])}</b>입니다. 방문 1회당 평균 <b>${(Math.round(c.pps * 10) / 10)}페이지</b>를 봅니다.`);
    const cr = c.sessions ? (c.conv / c.sessions) * 100 : 0;
    out.push(c.conv ? `상담 전환은 <b>${fmt(c.conv)}건</b>, 전환율 <b>${pct(cr)}</b>입니다.${cr < 2 ? " 문의 버튼 위치나 첫 화면 문구를 점검해 보세요." : cr >= 5 ? " 좋은 수준입니다." : ""}` : `이 기간 상담 전환이 아직 없습니다. 전화·문의 버튼 클릭이 기록되면 여기에 표시됩니다.`);
    const mob = c.devices.find((d) => d[0] === "모바일"); if (mob && c.sessions) out.push(`방문의 <b>${pct((mob[1] / c.sessions) * 100)}</b>가 모바일입니다.${mob[1] / c.sessions > 0.65 ? " 모바일 화면 점검이 가장 중요합니다." : ""}`);
    if (c.bounce > 70) out.push(`이탈률이 <b>${Math.round(c.bounce)}%</b>로 높습니다. 첫 화면에서 다음 페이지로 이어지는 버튼을 강화해 보세요.`);
    let best = [0, 0, 0]; c.heat.forEach((row, d) => row.forEach((v, h) => { if (v > best[2]) best = [d, h, v]; })); if (best[2]) out.push(`방문이 가장 많은 시간은 <b>${["일", "월", "화", "수", "목", "금", "토"][best[0]]}요일 ${best[1]}시</b>입니다.`);
    const pk = Object.entries(c.popStats).sort((a, b) => b[1].view - a[1].view)[0]; if (pk && pk[1].view) out.push(`팝업 클릭률은 <b>${pct((pk[1].click / pk[1].view) * 100)}</b>입니다.${pk[1].click / pk[1].view < 0.05 ? " 이미지나 문구를 바꿔 보세요." : ""}`);
    return out.slice(0, 6);
  }

  /* ---------- 차트 ---------- */
  function lineChart(series) {
    const cw = ($("#dashBody") && $("#dashBody").clientWidth) || 800; const narrow = cw < 560; const W = Math.max(340, Math.min(900, cw - 48)), H = narrow ? 200 : 240, L = 36, R = 12, T = 14, B = 30;
    const max = Math.max(5, ...series.map((s) => s.pv)); const n = series.length; const x = (i) => L + (n === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (n - 1)); const y = (v) => T + (H - T - B) * (1 - v / max);
    const path = (key) => series.map((s, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(s[key]).toFixed(1)).join(" ");
    const ticks = 4; const grid = Array.from({ length: ticks + 1 }, (_, i) => { const v = (max * i) / ticks; return `<line class="grid-l" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`; }).join("");
    const step = Math.ceil(n / (narrow ? 5 : 10)); const labels = series.map((s, i) => i % step === 0 || i === n - 1 ? `<text x="${x(i)}" y="${H - 10}" text-anchor="middle">${s.k.slice(5).replace("-", "/")}</text>` : "").join("");
    const dots = series.map((s, i) => `<circle class="dot" cx="${x(i)}" cy="${y(s.pv)}" r="3.5" data-tip="<b>${s.k}</b><br>페이지뷰 ${fmt(s.pv)} · 방문 ${fmt(s.s)} · 상담 ${fmt(s.c)}"/>`).join("");
    const convDots = series.map((s, i) => s.c ? `<circle cx="${x(i)}" cy="${y(s.c)}" r="4" fill="#16a34a" data-tip="<b>${s.k}</b><br>상담 전환 ${fmt(s.c)}건"/>` : "").join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0690fc" stop-opacity=".25"/><stop offset="1" stop-color="#0690fc" stop-opacity="0"/></linearGradient></defs>${grid}<path class="a1" d="${path("pv")} L ${x(n - 1)} ${y(0)} L ${x(0)} ${y(0)} Z"/><path class="l2" d="${path("s")}"/><path class="l1" d="${path("pv")}"/>${convDots}${dots}${labels}</svg>`;
  }
  const bars = (rows, total) => rows.length ? `<div class="bars">${rows.slice(0, 8).map(([k, v]) => `<div class="bar"><span class="k" title="${esc(k)}">${esc(k)}</span><span class="t"><i data-w="${total ? (v / (rows[0][1] || 1)) * 100 : 0}"></i></span><span class="v">${fmt(v)}<small>${total ? pct((v / total) * 100) : ""}</small></span></div>`).join("")}</div>` : `<div class="empty">데이터 없음</div>`;
  function donut(rows, total) {
    if (!total) return `<div class="empty">데이터 없음</div>`; const cols = ["#0690fc", "#3648a8", "#16a34a", "#d97706"]; let acc = 0; const r = 44, C = 2 * Math.PI * r;
    const segs = rows.map(([k, v], i) => { const f = v / total; const s = `<circle r="${r}" cx="60" cy="60" fill="none" stroke="${cols[i % cols.length]}" stroke-width="16" stroke-dasharray="${(f * C).toFixed(1)} ${C}" stroke-dashoffset="${(-acc * C).toFixed(1)}" transform="rotate(-90 60 60)"/>`; acc += f; return s; }).join("");
    return `<div class="donut"><svg viewBox="0 0 120 120">${segs}<text x="60" y="56" text-anchor="middle" style="font-size:18px;font-weight:700;fill:#0a1020">${fmt(total)}</text><text x="60" y="72" text-anchor="middle">방문</text></svg><ul>${rows.map(([k, v], i) => `<li><span><i style="background:${cols[i % cols.length]}"></i>${esc(k)}</span><b>${pct((v / total) * 100)}</b></li>`).join("")}</ul></div>`;
  }
  const heatmap = (heat, max) => `<div class="heat-wrap"><div class="heat"><span></span>${Array.from({ length: 24 }, (_, h) => `<span class="h">${h % 3 === 0 ? h : ""}</span>`).join("")}${["일", "월", "화", "수", "목", "금", "토"].map((d, i) => `<span>${d}</span>` + heat[i].map((v, h) => `<span class="cell" data-l="${v ? Math.min(4, Math.ceil((v / max) * 4)) : 0}" data-tip="<b>${d}요일 ${h}시</b><br>페이지뷰 ${fmt(v)}"></span>`).join("")).join("")}</div></div>`;
  function popupTable(stats) {
    const rows = Object.entries(stats); if (!rows.length) return `<div class="empty">팝업 노출 기록이 없습니다</div>`;
    const name = (id) => { const p = popupsCache.find((x) => x.id === id); return p ? (p.title || "(제목 없음)").replace(/\n/g, " ") : id === "demo-popup" ? "데모 팝업" : id.slice(0, 8); };
    return `<table class="tbl"><thead><tr><th>팝업</th><th class="num">노출</th><th class="num">클릭</th><th class="num">CTR</th><th class="num">닫기</th></tr></thead><tbody>${rows.sort((a, b) => b[1].view - a[1].view).map(([id, s]) => `<tr><td>${esc(name(id))}</td><td class="num">${fmt(s.view)}</td><td class="num">${fmt(s.click)}</td><td class="num"><b>${s.view ? pct((s.click / s.view) * 100) : "-"}</b></td><td class="num">${fmt(s.close)}</td></tr>`).join("")}</tbody></table>`;
  }
  function hookTips(root) { const tip = $("#tip"); $$("[data-tip]", root).forEach((el) => { el.addEventListener("mouseenter", (e) => { tip.innerHTML = el.dataset.tip; tip.classList.add("on"); }); el.addEventListener("mousemove", (e) => { tip.style.left = e.clientX + 12 + "px"; tip.style.top = e.clientY - 36 + "px"; }); el.addEventListener("mouseleave", () => tip.classList.remove("on")); }); }

  /* ---------- 상담 · 전환 ---------- */
  function renderConv() {
    const body = $("#convBody"); if (!cur) { body.innerHTML = '<div class="loading">대시보드를 먼저 불러옵니다…</div>'; return; }
    const kinds = {}; cur.convList.forEach((e) => { const k = (e.meta && e.meta.kind) || "기타"; kinds[k] = (kinds[k] || 0) + 1; });
    const kn = { tel: "전화 걸기", mail: "이메일", form: "문의 폼 제출" };
    const list = [...cur.convList].reverse().slice(0, 60);
    const pn = { ai: "AI 실속 패키지", standard: "스탠다드 패키지", premium: "프리미엄 패키지", daangn: "당근 광고", instagram: "인스타그램 광고", meta: "Meta 광고" }; const clicks = {}; cur.clicks.forEach((e) => { const m = e.meta || {}; const k = m.kind === "program_detail" ? (pn[m.label] || m.label || "프로그램") + " 상세" : m.kind === "contact_link" ? "상담 신청 버튼" : m.label || m.kind || "-"; clicks[k] = (clicks[k] || 0) + 1; });
    body.innerHTML = `
      <div class="kpis" style="grid-template-columns:repeat(4,1fr)">${kpi("상담 전환 합계", fmt(cur.conv), "건", delta(cur.conv, prev.conv))}${["tel", "form", "mail"].map((k) => kpi(kn[k], fmt(kinds[k] || 0), "건", "")).join("")}</div>
      <div class="grid">
        <div class="card c-7" style="grid-column:span 7"><h3>최근 상담 전환 <small>최근 60건</small></h3>${list.length ? `<table class="tbl"><thead><tr><th>일시</th><th>종류</th><th>페이지</th><th>상세</th><th>기기</th></tr></thead><tbody>${list.map((e) => `<tr><td>${esc(new Date(e.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }))}</td><td><span class="badge">${esc(kn[(e.meta || {}).kind] || (e.meta || {}).kind || "-")}</span></td><td>${esc(pageName(e.path))}</td><td>${esc((e.meta || {}).type || (e.meta || {}).program || (e.meta || {}).label || "")}</td><td>${e.device === "mobile" ? "모바일" : "PC"}</td></tr>`).join("")}</tbody></table>` : `<div class="empty">이 기간 상담 전환이 없습니다</div>`}</div>
        <div class="card" style="grid-column:span 5"><h3>관심 버튼 클릭 <small>상담 신청 · 상세 보기</small></h3><p class="help">전환 전 단계에서 어떤 버튼을 눌렀는지</p>${bars(Object.entries(clicks).sort((a, b) => b[1] - a[1]), cur.clicks.length)}</div>
      </div>`;
    $$(".bar .t i", body).forEach((i) => requestAnimationFrame(() => (i.style.width = i.dataset.w + "%")));
  }

  /* ---------- CSV ---------- */
  $("#csvBtn").addEventListener("click", async () => {
    const ev = await S.queryEvents(range.from.toISOString(), range.to.toISOString());
    const cols = ["created_at", "type", "path", "referrer", "device", "session_id", "visitor_id", "popup_id", "meta"];
    const csv = "﻿" + [cols.join(",")].concat(ev.map((e) => cols.map((c) => `"${String(c === "meta" ? JSON.stringify(e.meta || {}) : e[c] == null ? "" : e[c]).replace(/"/g, '""')}"`).join(","))).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `hmedi-events-${day(range.from)}_${day(range.to)}.csv`; a.click();
  });

  /* ---------- 팝업 관리 ---------- */
  const F = { id: $("#p-id"), file: $("#p-file"), image: $("#p-image"), preview: $("#p-preview"), brand: $("#p-brand"), title: $("#p-title"), sub: $("#p-sub"), btn: $("#p-btn"), link: $("#p-link"), start: $("#p-start"), end: $("#p-end"), show: $("#p-show"), sort: $("#p-sort"), color: $("#p-color"), colorT: $("#p-color-t"), align: $("#p-align"), active: $("#p-active") };
  let selected = null, pendingFile = null;
  const status = (p) => { const now = Date.now(); if (!p.active) return ["off", "비활성"]; if (p.starts_at && +new Date(p.starts_at) > now) return ["sched", "예약"]; if (p.ends_at && +new Date(p.ends_at) < now) return ["end", "종료"]; return ["on", "노출 중"]; };
  async function loadPopups() {
    try { popupsCache = await S.listPopups(); } catch (e) { toast("팝업 목록 실패: " + e.message, true); popupsCache = []; }
    const list = $("#popList");
    list.innerHTML = popupsCache.length ? popupsCache.map((p) => { const [cls, txt] = status(p); const st = cur && cur.popStats[p.id]; return `
      <div class="pop-item ${selected === p.id ? "is-sel" : ""}" data-id="${p.id}">
        <div class="th" style="background:${p.bg_color || "#0a1020"}">${p.image_url ? `<img src="${p.image_url}" alt="">` : ""}</div>
        <div><b>${esc((p.title || "(제목 없음)").replace(/\n/g, " "))}</b><small>${esc(p.brand || "")}${p.starts_at || p.ends_at ? ` · ${p.starts_at ? day(p.starts_at) : ""} ~ ${p.ends_at ? day(p.ends_at) : "계속"}` : ""} · 순서 ${p.sort || 0}</small>${st ? `<small class="stats">노출 ${fmt(st.view)} · 클릭 ${fmt(st.click)} · CTR ${st.view ? pct((st.click / st.view) * 100) : "-"}</small>` : ""}</div>
        <div class="st"><span class="badge ${cls}">${txt}</span><span class="switch ${p.active ? "on" : ""}" data-toggle="${p.id}" title="노출 켜기/끄기"></span></div>
      </div>`; }).join("") : `<div class="card"><div class="empty">등록된 팝업이 없습니다. "새 팝업"으로 만들어 보세요.</div></div>`;
    if (!selected) blankForm(); renderPreview();
  }
  $("#popList").addEventListener("click", async (e) => {
    const sw = e.target.closest("[data-toggle]"); if (sw) { const p = popupsCache.find((x) => x.id === sw.dataset.toggle); p.active = !p.active; try { await S.savePopup(p); toast(p.active ? "노출을 켰습니다" : "노출을 껐습니다"); } catch (err) { toast(err.message, true); } await loadPopups(); return; }
    const item = e.target.closest(".pop-item"); if (item) { selected = item.dataset.id; fillForm(popupsCache.find((x) => x.id === selected)); await loadPopups(); }
  });
  const blankForm = () => { selected = null; pendingFile = null; $("#popFormTitle").textContent = "새 팝업"; Object.values(F).forEach((el) => { if (el.type === "checkbox") el.checked = true; else if (el.type === "file") el.value = ""; else if (el.tagName === "SELECT") el.selectedIndex = 0; else if (el.type !== "color" && el.tagName !== "IMG") el.value = ""; }); F.sort.value = 0; F.color.value = F.colorT.value = "#0a1020"; F.start.value = day(new Date()); F.preview.classList.add("hidden"); $("#uploadText").textContent = "클릭 또는 드래그해서 이미지 올리기"; $("#delBtn").classList.add("hidden"); $("#dupBtn").classList.add("hidden"); };
  const fillForm = (p) => { pendingFile = null; $("#popFormTitle").textContent = "팝업 수정"; F.id.value = p.id; F.image.value = p.image_url && !p.image_url.startsWith("data:") ? p.image_url : ""; F.brand.value = p.brand || ""; F.title.value = p.title || ""; F.sub.value = p.subtitle || ""; F.btn.value = p.button_text || ""; F.link.value = p.link_url || ""; F.start.value = p.starts_at ? day(p.starts_at) : ""; F.end.value = p.ends_at ? day(p.ends_at) : ""; F.show.value = "index"; F.sort.value = p.sort || 0; F.color.value = F.colorT.value = p.bg_color || "#0a1020"; F.align.value = p.text_align || "left"; F.active.checked = !!p.active; F.file.value = ""; if (p.image_url) { F.preview.src = p.image_url; F.preview.classList.remove("hidden"); $("#uploadText").textContent = "이미지 바꾸려면 클릭"; } else { F.preview.classList.add("hidden"); $("#uploadText").textContent = "클릭 또는 드래그해서 이미지 올리기"; } $("#delBtn").classList.remove("hidden"); $("#dupBtn").classList.remove("hidden"); };
  $("#newPopBtn").addEventListener("click", () => { blankForm(); loadPopups(); $("#popForm").scrollIntoView({ behavior: "smooth" }); });
  const formData = () => ({ id: F.id.value || undefined, image_url: F.preview.classList.contains("hidden") ? (F.image.value.trim() || null) : (F.preview.src || null), brand: F.brand.value.trim(), title: F.title.value.trim(), subtitle: F.sub.value.trim(), button_text: F.btn.value.trim(), link_url: F.link.value.trim(), starts_at: F.start.value ? new Date(F.start.value + "T00:00:00").toISOString() : null, ends_at: F.end.value ? new Date(F.end.value + "T23:59:59").toISOString() : null, show_on: "index", sort: +F.sort.value || 0, bg_color: F.colorT.value || "#0a1020", text_align: F.align.value, active: F.active.checked });
  const setFile = async (file) => { if (!file) return; pendingFile = file; const url = URL.createObjectURL(file); F.preview.src = url; F.preview.classList.remove("hidden"); $("#uploadText").textContent = file.name; renderPreview(); };
  F.file.addEventListener("change", () => setFile(F.file.files[0]));
  const ub = $("#uploadBox"); ["dragenter", "dragover"].forEach((t) => ub.addEventListener(t, (e) => { e.preventDefault(); ub.classList.add("drag"); })); ["dragleave", "drop"].forEach((t) => ub.addEventListener(t, (e) => { e.preventDefault(); ub.classList.remove("drag"); })); ub.addEventListener("drop", (e) => setFile(e.dataTransfer.files[0]));
  F.image.addEventListener("input", () => { if (F.image.value.trim()) { pendingFile = null; F.preview.src = F.image.value.trim(); F.preview.classList.remove("hidden"); } renderPreview(); });
  F.color.addEventListener("input", () => { F.colorT.value = F.color.value; renderPreview(); }); F.colorT.addEventListener("input", () => { if (/^#[0-9a-f]{6}$/i.test(F.colorT.value)) F.color.value = F.colorT.value; renderPreview(); });
  ["brand", "title", "sub", "btn", "align"].forEach((k) => F[k].addEventListener("input", renderPreview));
  function renderPreview() {
    const p = formData(); const host = $("#previewHost");
    host.innerHTML = `<div class="hpop is-open"><div class="hpop-bg"></div><div class="hpop-card"><div class="hpop-track"><div class="hpop-slide" style="background:${esc(p.bg_color)}">${p.image_url ? `<img src="${esc(p.image_url)}" alt="">` : ""}<div class="hpop-shade"></div><div class="hpop-text ${p.text_align}">${p.brand ? `<span class="hpop-brand">${esc(p.brand)}</span>` : ""}${p.title ? `<strong class="hpop-title">${esc(p.title).replace(/\n/g, "<br>")}</strong>` : `<strong class="hpop-title" style="opacity:.5">제목을 입력하세요</strong>`}${p.subtitle ? `<span class="hpop-sub">${esc(p.subtitle)}</span>` : ""}${p.button_text ? `<span class="hpop-btn">${esc(p.button_text)}</span>` : ""}</div></div></div><div class="hpop-dots"><i class="on"></i></div><div class="hpop-bar"><button type="button">오늘 하루 닫기</button><button type="button">닫기</button></div></div></div>`;
  }
  $("#popForm").addEventListener("submit", async (e) => {
    e.preventDefault(); const btn = $("#saveBtn"); btn.disabled = true; btn.textContent = "저장 중…";
    try {
      const p = formData(); if (!p.title && !p.image_url && !pendingFile) throw new Error("제목이나 이미지를 넣어 주세요.");
      if (pendingFile) { p.image_url = await S.uploadImage(pendingFile); pendingFile = null; }
      const saved = await S.savePopup(p); selected = saved.id; fillForm(saved); toast("저장했습니다"); await loadPopups();
    } catch (err) { toast(err.message || "저장 실패", true); }
    btn.disabled = false; btn.textContent = "저장";
  });
  $("#delBtn").addEventListener("click", async () => { if (!selected || !confirm("이 팝업을 삭제할까요?")) return; try { await S.deletePopup(selected); toast("삭제했습니다"); blankForm(); await loadPopups(); } catch (err) { toast(err.message, true); } });
  $("#dupBtn").addEventListener("click", async () => { const p = formData(); delete p.id; p.title = (p.title || "") + " (복사)"; p.active = false; try { const saved = await S.savePopup(p); selected = saved.id; fillForm(saved); await loadPopups(); toast("복제했습니다 (비활성 상태)"); } catch (err) { toast(err.message, true); } });

  /* ---------- 설정 ---------- */
  $("#pwForm").addEventListener("submit", async (e) => { e.preventDefault(); const a = $("#s-pw1").value, b = $("#s-pw2").value; if (a.length < 8) return toast("8자 이상 입력해 주세요", true); if (a !== b) return toast("비밀번호가 서로 다릅니다", true); try { await S.auth.changePassword(a); toast("비밀번호를 변경했습니다"); $("#s-pw1").value = $("#s-pw2").value = ""; } catch (err) { toast(err.message, true); } });
  $("#seedBtn").addEventListener("click", async () => { if (S.configured) return toast("서버 연결 상태에서는 데모 데이터를 넣지 않습니다"); localStorage.removeItem("hmedi_demo_seeded"); await S.seedDemo(); toast("데모 데이터를 채웠습니다"); loadDash(); renderSettings(); });
  $("#clearBtn").addEventListener("click", async () => { if (!confirm("통계 데이터를 모두 지울까요? (팝업은 유지)")) return; if (S.configured) { toast("서버 데이터 삭제는 Supabase 대시보드에서 진행해 주세요"); return; } await S.clearDemo(); toast("비웠습니다"); loadDash(); renderSettings(); });
  async function renderSettings() { try { const n = await S.countEventsAll(); $("#dataInfo").textContent = `${S.configured ? "서버" : "이 브라우저"}에 저장된 이벤트 ${fmt(n)}건`; } catch (e) { $("#dataInfo").textContent = ""; } if (!renderSettings.done) { renderSettings.done = true; try { const t = await (await fetch("admin/schema.sql")).text(); $("#schemaBox").textContent = t; } catch (e) { $("#schemaBox").textContent = "admin/schema.sql 파일을 열어 복사해 주세요."; } } }
  $("#copySchema").addEventListener("click", async () => { try { await navigator.clipboard.writeText($("#schemaBox").textContent); toast("복사했습니다"); } catch (e) { toast("복사 실패. 직접 선택해 복사해 주세요", true); } });

  /* ---------- 시작 ---------- */
  (async () => { try { await S.ready(); if (await S.auth.session()) await enter(); } catch (e) { $("#loginErr").textContent = "연결 확인 중 문제: " + e.message; } })();
})();
