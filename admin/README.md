# 관리자 모드 연결 가이드 (Supabase, 무료)

관리자 페이지 주소: `https://<사이트주소>/admin.html` (사이트 메뉴에는 노출되지 않습니다)

설정 전에는 **데모 모드**로 동작합니다. 이 브라우저 안에서만 저장되며 체험용입니다.
데모 비밀번호: `hmedi1234`

## 실제 서버 연결 (약 10분)

1. https://supabase.com 가입 → **New project** (이름 자유, Region: Northeast Asia (Seoul), 비밀번호 저장)
2. 프로젝트 → **SQL Editor** → `admin/schema.sql` 내용 전체 붙여넣기 → **Run**
3. **Authentication → Providers → Email** 에서 *Confirm email* 끄기
4. **Authentication → Users → Add user** 로 관리자 이메일 · 비밀번호 생성
5. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키 복사
6. `assets/js/config.js` 에 붙여넣기:
   ```js
   supabaseUrl: "https://xxxx.supabase.co",
   supabaseKey: "eyJ...",
   ```
7. 저장 후 GitHub 에 반영하면 끝. 관리자 페이지에서 4번 계정으로 로그인합니다.

## 보안
- 팝업은 누구나 읽을 수 있고, 관리자만 쓸 수 있습니다.
- 방문 통계는 누구나 기록되지만 관리자만 볼 수 있습니다. 이름 · 전화번호 등 개인정보는 저장하지 않습니다.
- `anon` 키는 공개용 키이며, 권한은 위 RLS 정책으로 제한됩니다. `service_role` 키는 절대 넣지 마세요.

> 스키마에는 `popups` · `events` · `inquiries`(상담 신청) 테이블이 포함됩니다. 이미 이전 버전 스키마를 실행했다면 `admin/schema.sql` 의 4) 상담 신청 부분만 다시 실행하면 됩니다.

## 상담 접수 알림 — 이메일(fgfg0982@naver.com) · 문자(010-8263-0982)

문의 폼이 접수되면 담당자에게 이메일과 문자가 갑니다. 같은 함수 하나가 두 채널을 처리하며, 시크릿을 넣은 채널만 동작합니다. (이메일만 쓰려면 솔라피 단계는 건너뜀)

**이메일 (Brevo, 무료 하루 300통)**
1. [brevo.com](https://www.brevo.com) 가입 → Senders & IP → Senders → "Add a sender" 에 발신 이메일(예: hmedisolution@gmail.com) 등록 → 받은 인증 메일의 링크 클릭.
2. 오른쪽 위 프로필 → SMTP & API → API Keys → "Generate a new API key" → 키 복사 (`xkeysib-...`).
3. Supabase → Edge Functions → Secrets 에 `BREVO_API_KEY`, `MAIL_FROM`(1번에서 인증한 이메일), `MAIL_TO`(받을 주소, 쉼표로 여러 개 가능) 추가.

**문자 (솔라피)**

1. **문자 발송 계정**: [솔라피 solapi.com](https://solapi.com) 가입 → 발신번호 등록에서 `010-8263-0982` 본인 인증 → API Key · API Secret 발급. 문자는 건당 약 20원(LMS 약 50원)으로 선불 충전합니다.
2. **함수 배포** (PC에 Supabase CLI 설치 후, 저장소 폴더에서):
   ```
   supabase login
   supabase link --project-ref <프로젝트 ref>
   supabase secrets set SOLAPI_API_KEY=... SOLAPI_API_SECRET=... SMS_FROM=01082630982 SMS_TO=01082630982 WEBHOOK_SECRET=<아무 긴 문자열> SITE_URL=https://hmedisolution.com
   supabase functions deploy notify-inquiry --no-verify-jwt --project-ref <프로젝트 ref>
   ```
   `SMS_TO` 에 번호를 쉼표로 여러 개 넣으면 모두에게 갑니다. (예: `01082630982,01044354389`)
3. **웹훅 연결**: Supabase 대시보드 → Database → Webhooks → Create → 테이블 `inquiries`, 이벤트 `Insert`, 타입 `Supabase Edge Functions` → `notify-inquiry` 선택 → HTTP Headers 에 `x-webhook-secret` = 위에서 정한 `WEBHOOK_SECRET` 추가 → 저장.
4. 홈페이지 문의 폼으로 테스트 접수 → 문자 수신 확인. 실패하면 Edge Functions → notify-inquiry → Logs 에서 원인을 볼 수 있습니다.

> 함수 코드: `admin/functions/notify-inquiry/index.ts`. 카카오 알림톡으로 바꾸고 싶으면 솔라피의 알림톡 API(채널 · 템플릿 심사 필요)로 같은 함수에서 교체할 수 있습니다.

## 인사이트(블로그) 글 · 자동 글쓰기 연동

관리자 → 인사이트 탭에서 글을 쓰면 `posts` 테이블에 저장되고, 공개 상태면 홈페이지 인사이트 탭과 `post.html?slug=…` 에 바로 노출됩니다. 본문은 마크다운(또는 HTML)입니다.

**외부 CMS · 자동 글쓰기(n8n · Make · 자체 스크립트)에서 글 넣기** — Supabase REST API로 바로 넣습니다. 서버 쪽(자동화 도구)에서만 `service_role` 키를 쓰고, 홈페이지 코드에는 절대 넣지 않습니다.

```
POST https://<프로젝트>.supabase.co/rest/v1/posts
apikey: <service_role 키>
Authorization: Bearer <service_role 키>
Content-Type: application/json
Prefer: return=representation

{
  "slug": "place-first-month",
  "title": "개원 첫 달, 플레이스에서 먼저 할 3가지",
  "excerpt": "목록에 보이는 1~2문장 요약",
  "content": "## 소제목\n\n본문 마크다운…",
  "cover_url": "https://…/cover.jpg",
  "tags": ["플레이스", "개원"],
  "author": "에이치메디솔루션",
  "status": "published",
  "published_at": "2026-11-01T09:00:00+09:00",
  "source": "cms"
}
```

- `status` 를 `draft` 로 넣으면 관리자가 검수 후 공개할 수 있습니다(권장). `source` 에 도구 이름을 넣으면 관리자 목록에 표시됩니다.
- 같은 `slug` 로 다시 보내면 중복 오류가 나므로, 수정은 `PATCH …/posts?slug=eq.<slug>` 로 합니다.
- 이미지는 Storage `popups` 버킷에 올리거나(공개 URL), 외부 URL을 그대로 써도 됩니다.

### 검색엔진용 정적 글 페이지 (자동)

공개 글은 GitHub Actions(`.github/workflows/posts.yml`)가 **30분마다** `insights/<slug>.html` 로 만들어 커밋합니다. 목록(`insights.html`)·`sitemap.xml`·`llms.txt` 도 함께 갱신되므로 네이버·구글·AI 크롤러가 JS 없이 본문을 읽습니다.

- 글 주소: `https://hmedisolution.com/insights/<slug>.html` (예전 `post.html?slug=…` 주소는 자동으로 이 주소로 이동)
- 바로 반영하고 싶을 때: GitHub 저장소 → Actions → "인사이트 정적 페이지 생성" → Run workflow
- 글을 저장하자마자 자동 반영(선택): Supabase → Database → Webhooks → Create: 테이블 `posts`, 이벤트 Insert·Update·Delete, HTTP POST
  `https://api.github.com/repos/hmedisolution-cmd/hmedi-homepage/dispatches`, 헤더 `Authorization: Bearer <GitHub 개인 토큰(repo 권한)>` · `Accept: application/vnd.github+json`, 본문 `{"event_type":"posts-updated"}`.
  토큰은 Supabase 웹훅 설정에만 넣고 홈페이지 코드에는 넣지 않습니다.
- 공개 해제·삭제한 글의 정적 파일은 다음 실행 때 자동으로 지워집니다. slug 는 영문 소문자·숫자·한글·하이픈만 사용합니다.
- 수동 실행: `python3 build/posts.py` (Supabase 설정은 `assets/js/config.js` 값 사용).
