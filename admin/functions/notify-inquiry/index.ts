// ==========================================================================
// 상담 신청 문자 알림 (Supabase Edge Function)
//  - inquiries 테이블에 새 행이 들어오면(Database Webhook) 담당자 휴대폰으로 SMS 발송
//  - 문자 발송 API: 솔라피(SOLAPI, 구 쿨SMS) https://solapi.com  — 건당 약 20원, 발신번호 사전 등록 필요
//  - 배포/설정 절차는 admin/README.md 의 "상담 접수 문자 알림" 참고
// ==========================================================================
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SOLAPI_KEY = Deno.env.get("SOLAPI_API_KEY") ?? "";
const SOLAPI_SECRET = Deno.env.get("SOLAPI_API_SECRET") ?? "";
const SMS_FROM = (Deno.env.get("SMS_FROM") ?? "01082630982").replace(/\D/g, "");
const SMS_TO = (Deno.env.get("SMS_TO") ?? "01082630982").split(",").map((s) => s.replace(/\D/g, "")).filter(Boolean);
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://hmedisolution.com";

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
  for (const to of SMS_TO) {
    try { results[to] = await sendSms(to, text); } catch (e) { results[to] = "ERROR " + (e as Error).message; console.error(e); }
  }
  return new Response(JSON.stringify({ ok: true, results }), { headers: { "Content-Type": "application/json" } });
});
