/* ==========================================================================
   HmediStore — 데이터 계층
   Supabase 가 설정되면 서버 DB, 아니면 브라우저 localStorage(데모 모드)
   공용 페이지(팝업 표시 · 방문 기록)와 관리자 페이지가 함께 사용
   ========================================================================== */
(function () {
  "use strict";
  const cfg = window.HMEDI_CONFIG || {};
  const configured = !!(cfg.supabaseUrl && cfg.supabaseKey);
  const LS = { popups: "hmedi_popups", events: "hmedi_events", inquiries: "hmedi_inquiries", auth: "hmedi_admin_session", pw: "hmedi_admin_pw", demoSeeded: "hmedi_demo_seeded" };
  const MAX_LOCAL_EVENTS = 8000;

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* quota */ } };
  const sha256 = async (t) => { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join(""); };

  let sb = null, sbReady = null;
  const loadSupabase = () => {
    if (sbReady) return sbReady;
    sbReady = new Promise((resolve, reject) => {
      if (window.supabase && window.supabase.createClient) return resolve();
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
      s.onload = resolve; s.onerror = () => reject(new Error("supabase-js 로드 실패"));
      document.head.appendChild(s);
    }).then(() => { sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: true } }); return sb; });
    return sbReady;
  };

  /* ---------- 이미지 압축 (업로드 전 공통) ---------- */
  const compressImage = (file, maxW = 1080, quality = 0.82) => new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas"); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((blob) => blob ? resolve(blob) : reject(new Error("압축 실패")), "image/jpeg", quality);
    };
    img.onerror = () => reject(new Error("이미지를 읽을 수 없습니다")); img.src = url;
  });
  const blobToDataUrl = (blob) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });

  /* ---------- 로컬(데모) 구현 ---------- */
  const local = {
    mode: "local",
    async ready() { return true; },
    async listPopups() {
      let has = false; try { has = localStorage.getItem(LS.popups) !== null; } catch (e) {}
      if (!has && Array.isArray(cfg.defaultPopups) && cfg.defaultPopups.length) { const now = new Date().toISOString(); lsSet(LS.popups, cfg.defaultPopups.map((p) => Object.assign({ created_at: now }, p))); }
      return lsGet(LS.popups, []).sort((a, b) => (a.sort || 0) - (b.sort || 0));
    },
    async savePopup(p) {
      const list = lsGet(LS.popups, []); const now = new Date().toISOString();
      if (!p.id) { p.id = uid(); p.created_at = now; list.push(p); } else { const i = list.findIndex((x) => x.id === p.id); p.updated_at = now; if (i >= 0) list[i] = p; else list.push(p); }
      lsSet(LS.popups, list); return p;
    },
    async deletePopup(id) { lsSet(LS.popups, lsGet(LS.popups, []).filter((x) => x.id !== id)); },
    async uploadImage(file) { const blob = await compressImage(file, 960, 0.78); return blobToDataUrl(blob); },
    async logEvent(ev) {
      const list = lsGet(LS.events, []); list.push(ev); if (list.length > MAX_LOCAL_EVENTS) list.splice(0, list.length - MAX_LOCAL_EVENTS); lsSet(LS.events, list);
    },
    async queryEvents(from, to) { const f = +new Date(from), t = +new Date(to); return lsGet(LS.events, []).filter((e) => { const ts = +new Date(e.created_at); return ts >= f && ts <= t; }); },
    async countEventsAll() { return lsGet(LS.events, []).length; },
    async saveInquiry(d) { const list = lsGet(LS.inquiries, []); const row = Object.assign({ id: uid(), created_at: new Date().toISOString(), status: "new", memo: "" }, d); list.unshift(row); lsSet(LS.inquiries, list.slice(0, 500)); return row; },
    async listInquiries() { return lsGet(LS.inquiries, []); },
    async updateInquiry(id, patch) { const list = lsGet(LS.inquiries, []); const i = list.findIndex((x) => x.id === id); if (i >= 0) { list[i] = Object.assign({}, list[i], patch, { updated_at: new Date().toISOString() }); lsSet(LS.inquiries, list); return list[i]; } },
    async deleteInquiry(id) { lsSet(LS.inquiries, lsGet(LS.inquiries, []).filter((x) => x.id !== id)); },
    auth: {
      async session() { return sessionStorage.getItem(LS.auth) === "1" ? { user: { email: "admin (demo)" } } : null; },
      async signIn(email, password) {
        const stored = lsGet(LS.pw, null) || (await sha256("hmedi1234"));
        if ((await sha256(password)) !== stored) throw new Error("비밀번호가 올바르지 않습니다.");
        sessionStorage.setItem(LS.auth, "1"); return { user: { email: email || "admin (demo)" } };
      },
      async signOut() { sessionStorage.removeItem(LS.auth); },
      async changePassword(pw) { lsSet(LS.pw, await sha256(pw)); },
    },
    async clearDemo() { lsSet(LS.events, []); localStorage.removeItem(LS.demoSeeded); },
    async seedDemo() { if (lsGet(LS.demoSeeded, false)) return false; lsSet(LS.events, makeDemoEvents()); lsSet(LS.demoSeeded, true); return true; },
  };

  /* ---------- Supabase 구현 ---------- */
  const remote = {
    mode: "supabase",
    async ready() { await loadSupabase(); return true; },
    async listPopups() { await loadSupabase(); const { data, error } = await sb.from("popups").select("*").order("sort", { ascending: true }); if (error) throw error; return data || []; },
    async savePopup(p) {
      await loadSupabase(); const row = { ...p }; delete row.created_at; delete row.updated_at;
      if (!row.id) delete row.id;
      const { data, error } = await sb.from("popups").upsert(row).select().single(); if (error) throw error; return data;
    },
    async deletePopup(id) { await loadSupabase(); const { error } = await sb.from("popups").delete().eq("id", id); if (error) throw error; },
    async uploadImage(file) {
      await loadSupabase(); const blob = await compressImage(file, 1080, 0.82);
      const path = `popup-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
      const { error } = await sb.storage.from(cfg.storageBucket || "popups").upload(path, blob, { contentType: "image/jpeg", upsert: false }); if (error) throw error;
      return sb.storage.from(cfg.storageBucket || "popups").getPublicUrl(path).data.publicUrl;
    },
    async logEvent(ev) { try { await loadSupabase(); const row = { ...ev }; delete row.id; await sb.from("events").insert(row); } catch (e) { /* 통계 실패는 조용히 무시 */ } },
    async queryEvents(from, to) {
      await loadSupabase(); const out = []; let off = 0; const size = 1000;
      while (true) { const { data, error } = await sb.from("events").select("*").gte("created_at", from).lte("created_at", to).order("created_at", { ascending: true }).range(off, off + size - 1); if (error) throw error; out.push(...(data || [])); if (!data || data.length < size) break; off += size; if (off > 100000) break; }
      return out;
    },
    async countEventsAll() { await loadSupabase(); const { count } = await sb.from("events").select("*", { count: "exact", head: true }); return count || 0; },
    async saveInquiry(d) { await loadSupabase(); const { data, error } = await sb.from("inquiries").insert(d).select().single(); if (error) throw error; return data; },
    async listInquiries() { await loadSupabase(); const { data, error } = await sb.from("inquiries").select("*").order("created_at", { ascending: false }).limit(500); if (error) throw error; return data || []; },
    async updateInquiry(id, patch) { await loadSupabase(); const { data, error } = await sb.from("inquiries").update(Object.assign({}, patch, { updated_at: new Date().toISOString() })).eq("id", id).select().single(); if (error) throw error; return data; },
    async deleteInquiry(id) { await loadSupabase(); const { error } = await sb.from("inquiries").delete().eq("id", id); if (error) throw error; },
    auth: {
      async session() { await loadSupabase(); const { data } = await sb.auth.getSession(); return data.session; },
      async signIn(email, password) { await loadSupabase(); const { data, error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw new Error("이메일 또는 비밀번호가 올바르지 않습니다."); return data; },
      async signOut() { await loadSupabase(); await sb.auth.signOut(); },
      async changePassword(pw) { await loadSupabase(); const { error } = await sb.auth.updateUser({ password: pw }); if (error) throw error; },
    },
    async clearDemo() {}, async seedDemo() { return false; },
  };

  /* ---------- 데모 데이터 생성 (데모 모드 전용, 최근 35일) ---------- */
  function makeDemoEvents() {
    const pages = [["/index.html", 0.38], ["/marketing.html", 0.2], ["/consulting.html", 0.17], ["/portfolio.html", 0.12], ["/company.html", 0.07], ["/contact.html", 0.06]];
    const refs = [["", 0.34], ["https://search.naver.com/", 0.3], ["https://m.search.naver.com/", 0.08], ["https://www.google.com/", 0.1], ["https://www.instagram.com/", 0.07], ["https://blog.naver.com/", 0.06], ["https://kmong.com/", 0.05]];
    const pick = (arr) => { let r = Math.random(); for (const [v, w] of arr) { r -= w; if (r <= 0) return v; } return arr[0][0]; };
    const ev = []; const now = Date.now();
    for (let d = 34; d >= 0; d--) {
      const day = new Date(now - d * 864e5); const dow = day.getDay();
      const base = 26 + Math.round(Math.sin(d / 5) * 6) + (dow === 0 || dow === 6 ? -9 : 0) + Math.round((34 - d) * 0.5);
      for (let s = 0; s < base; s++) {
        const visitor = "v" + Math.floor(Math.random() * 900 + 100) + (Math.random() < 0.7 ? d : "");
        const session = uid(); const device = Math.random() < 0.72 ? "mobile" : "desktop"; const ref = pick(refs);
        const hour = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 8, 7, 0, 1, 2][Math.floor(Math.random() * 20)];
        let t = new Date(day); t.setHours(hour, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0);
        const n = 1 + (Math.random() < 0.55 ? 0 : Math.floor(Math.random() * 3) + 1);
        let path = pick(pages);
        for (let i = 0; i < n; i++) {
          ev.push({ id: uid(), created_at: new Date(+t + i * 42000).toISOString(), type: "pageview", path, referrer: i === 0 ? ref : "", device, session_id: session, visitor_id: visitor, demo: true });
          if (i === 0 && path === "/index.html" && Math.random() < 0.9) { ev.push({ id: uid(), created_at: new Date(+t + 1500).toISOString(), type: "popup_view", path, popup_id: "demo-popup", session_id: session, visitor_id: visitor, device, demo: true }); if (Math.random() < 0.11) ev.push({ id: uid(), created_at: new Date(+t + 6000).toISOString(), type: "popup_click", path, popup_id: "demo-popup", session_id: session, visitor_id: visitor, device, demo: true }); }
          path = pick(pages);
        }
        if (Math.random() < 0.12) ev.push({ id: uid(), created_at: new Date(+t + n * 42000 + 12000).toISOString(), type: "click", path, meta: Math.random() < 0.6 ? { kind: "contact_link", label: "상담 신청" } : { kind: "program_detail", label: pick([["standard", 0.5], ["premium", 0.2], ["ai", 0.3]]) }, session_id: session, visitor_id: visitor, device, demo: true });
        if (Math.random() < 0.045) ev.push({ id: uid(), created_at: new Date(+t + n * 42000 + 20000).toISOString(), type: "conversion", path: "/contact.html", meta: { kind: Math.random() < 0.5 ? "tel" : "form" }, session_id: session, visitor_id: visitor, device, demo: true });
      }
    }
    return ev.sort((a, b) => a.created_at < b.created_at ? -1 : 1);
  }

  const store = configured ? remote : local;
  store.configured = configured; store.uid = uid; store.compressImage = compressImage;
  window.HmediStore = store;
})();
