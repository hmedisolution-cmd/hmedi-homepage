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

## 상담 접수 문자 알림 (010-8263-0982)

문의 폼이 접수되면 담당자 휴대폰으로 문자가 갑니다. Supabase 연결이 끝난 뒤 한 번만 설정하면 됩니다. (약 20분)

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
