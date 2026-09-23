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
