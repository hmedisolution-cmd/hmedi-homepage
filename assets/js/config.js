/* ==========================================================================
   관리자 모드 · 데이터 연결 설정
   - Supabase 프로젝트를 만든 뒤 URL 과 anon key 를 아래에 넣으면
     팝업 · 방문 통계 · 관리자 로그인이 실제 서버(DB)에서 동작합니다.
   - 비워 두면 "데모 모드" 로 동작합니다. (이 브라우저 안에서만 저장, 체험용)
   - 설정 방법: 관리자 페이지 → 설정 탭 → "연결 가이드" 또는 admin/README.md
   ========================================================================== */
window.HMEDI_CONFIG = {
  supabaseUrl: "",   // 예: "https://abcdefghijk.supabase.co"
  supabaseKey: "",   // 예: "eyJhbGciOi..." (anon public key)
  storageBucket: "popups",
  trackAdminVisits: false, // true 면 관리자 로그인 상태의 방문도 통계에 포함
};
