// ==========================================================================
// 상담 신청 문자 알림 (Supabase Edge Function)
//  - inquiries 테이블에 새 행이 들어오면(Database Webhook) 담당자 휴대폰으로 SMS 발송
//  - 문자: 솔라피(SOLAPI, 구 쿨SMS) https://solapi.com  — 건당 약 20원, 발신번호 사전 등록 필요 (SOLAPI_* 시크릿이 있을 때만)
//  - 이메일: 브레보(Brevo) https://brevo.com — 무료 하루 300통, 발신 이메일 인증만 하면 됨 (BREVO_API_KEY 가 있을 때만)
//  - 배포/설정 절차는 admin/README.md 의 "상담 접수 문자 알림" 참고
// ==========================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SOLAPI_KEY = Deno.env.get("SOLAPI_API_KEY") ?? "";
const SOLAPI_SECRET = Deno.env.get("SOLAPI_API_SECRET") ?? "";
const SMS_FROM = (Deno.env.get("SMS_FROM") ?? "01082630982").replace(/\D/g, "");
const SMS_TO = (Deno.env.get("SMS_TO") ?? "01082630982").split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean);
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://hmedisolution.com";
const BREVO_KEY = Deno.env.get("BREVO_API_KEY") ?? "";
const MAIL_FROM = Deno.env.get("MAIL_FROM") ?? "";
const MAIL_TO = (Deno.env.get("MAIL_TO") ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
async function solapiAuth() {
  const date = new Date().toISOString();
  const salt = crypto.randomUUID().replace(/-/g, "");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SOLAPI_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(date + salt)));
  return `HMAC-SHA256 apiKey=${SOLAPI_KEY}, date=${date}, salt=${salt}, signature=${sig}`;
}

async function sendSms(to: string, text: string) {
  const res = await fetch("https://api.solapi.com/messages/v4/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: await solapiAuth() },
    body: JSON.stringify({ message: { to, from: SMS_FROM, text } }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`solapi ${res.status}: ${body}`);
  return body;
}

async function sendMail(subject: string, text: string, html: string) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": BREVO_KEY },
    body: JSON.stringify({ sender: { name: "에이치메디솔루션 홈페이지", email: MAIL_FROM }, to: MAIL_TO.map((email) => ({ email })), subject, textContent: text, htmlContent: html }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`brevo ${res.status}: ${body}`);
  return body;
}
const escapeHtml = (v: unknown) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

serve(async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) return new Response("unauthorized", { status: 401 });
  let payload: any;
  try { payload = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
  const r = payload?.record ?? payload;
  if (!r || (payload?.type && payload.type !== "INSERT")) return new Response("ignored", { status: 200 });

  const line = (k: string, v?: string) => (v ? `${k}: ${v}\n` : "");
  // 90byte(SMS) 를 넘으면 솔라피가 자동으로 LMS 로 보냅니다.
  const text =
    `[에이치메디 상담신청]\n` +
    line("성함", r.name) + line("연락처", r.phone) + line("분야", r.type) + line("병원", r.hospital) +
    line("지역", r.region) + line("프로그램", r.program) + line("상황", r.situation) +
    (r.message ? `내용: ${String(r.message).slice(0, 300)}\n` : "") +
    `확인: ${SITE_URL}/admin.html`;

  const results: Record<string, string> = {};
  if (SOLAPI_KEY && SOLAPI_SECRET) {
    for (const to of SMS_TO) {
      try { results["sms:" + to] = await sendSms(to, text); } catch (e) { results["sms:" + to] = "ERROR " + (e as Error).message; console.error(e); }
    }
  }
  if (BREVO_KEY && MAIL_FROM && MAIL_TO.length) {
    const rows = [["성함", r.name], ["연락처", r.phone], ["상담 분야", r.type], ["병원명", r.hospital], ["지역", r.region], ["관심 프로그램", r.program], ["현재 상황", r.situation]]
      .filter(([, v]) => v).map(([k, v]) => `<tr><th style="text-align:left;padding:6px 12px 6px 0;color:#667;white-space:nowrap">${k}</th><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`).join("");
    const html = `<div style="font-family:Apple SD Gothic Neo,Malgun Gothic,sans-serif;font-size:15px;color:#111;line-height:1.6">
      <h2 style="margin:0 0 14px;font-size:20px">새 상담 신청이 접수되었습니다</h2>
      <table style="border-collapse:collapse">${rows}</table>
      ${r.message ? `<p style="margin:16px 0 0;padding:14px 16px;background:#f5f7fa;border-radius:10px;white-space:pre-wrap">${escapeHtml(r.message)}</p>` : ""}
      <p style="margin:20px 0 0"><a href="${SITE_URL}/admin.html" style="display:inline-block;padding:11px 18px;background:#0690fc;color:#fff;border-radius:8px;text-decoration:none;font-weight:700">관리자 페이지에서 확인</a></p>
      <p style="margin:16px 0 0;font-size:12px;color:#889">에이치메디솔루션 홈페이지 문의 폼 · ${escapeHtml(r.created_at ?? new Date().toISOString())}</p></div>`;
    const subject = `[상담신청] ${r.name ?? ""}${r.hospital ? " · " + r.hospital : ""}${r.type ? " · " + r.type : ""}`;
    try { results["mail"] = await sendMail(subject, text, html); } catch (e) { results["mail"] = "ERROR " + (e as Error).message; console.error(e); }
  }
  if (!Object.keys(results).length) console.warn("알림 채널이 설정되지 않았습니다 (SOLAPI_* 또는 BREVO_API_KEY/MAIL_FROM/MAIL_TO)");
  return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
});
