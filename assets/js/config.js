/* ==========================================================================
   관리자 모드 · 데이터 연결 설정
   - Supabase 프로젝트를 만든 뒤 URL 과 anon key 를 아래에 넣으면
     팝업 · 방문 통계 · 관리자 로그인이 실제 서버(DB)에서 동작합니다.
   - 비워 두면 "데모 모드" 로 동작합니다. (이 브라우저 안에서만 저장, 체험용)
   - 설정 방법: 관리자 페이지 → 설정 탭 → "연결 가이드" 또는 admin/README.md
   ========================================================================== */
window.HMEDI_CONFIG = {
  supabaseUrl: "https://rcrpisjwmiorhocgxjcw.supabase.co",
  supabaseKey: "sb_publishable_8VkhnMOUw6gTf2HWNUnCuw_sAFtfPZ-",   // publishable(공개) 키 — secret 키는 절대 넣지 말 것
  storageBucket: "popups",
  trackAdminVisits: false, // true 면 관리자 로그인 상태의 방문도 통계에 포함
  /* 상담 신청 이메일 알림 (Web3Forms, 무료 · 서버 불필요)
     web3forms.com 에서 받을 이메일을 입력해 발급받은 Access Key 를 넣으면, 문의 폼 접수 시 그 이메일로 바로 알림이 갑니다. */
  notifyKey: "",
  /* 기본 팝업: 데모 모드에서 팝업이 하나도 없을 때 처음 한 번 채워집니다.
     관리자 페이지에서 수정 · 삭제할 수 있습니다. (서버 연결 후에는 사용되지 않음) */
  defaultPopups: [
    {
      id: "default-open-consult",
      image_url: "assets/img/popup-open.jpg",
      brand: "H MEDI SOLUTION",
      title: "개원 준비부터\n마케팅까지 한 번에",
      subtitle: "무료 상담 신청 시 상권·경쟁 분석 리포트 제공",
      button_text: "무료 상담 신청",
      link_url: "contact.html",
      bg_color: "#0a1020",
      text_align: "left",
      show_on: "index",
      sort: 0,
      active: true,
    },
  ],
};
