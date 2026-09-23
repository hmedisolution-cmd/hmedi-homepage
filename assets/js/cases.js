/* 성공사례 · 포트폴리오 상세 */
window.HMEDI_CASES = {
  market: { no: "01", cat: "개원 컨설팅", title: "상권분석 리포트", lead: "감이 아니라 숫자로 입지를 정합니다.",
    spec: [["후보지", "3~5곳 비교"], ["소요", "7일"], ["산출물", "입지 리포트 1부"]],
    visual: `<div class="cs-board"><div class="cs-board-h"><span>Site Report</span><b>포항시 남구 오천읍</b></div>
      <div class="cs-nums"><div><b>7,000</b><small>배후 세대</small></div><div><b>1<i>곳</i></b><small>경쟁 정형외과</small></div><div><b>3,010</b><small>월 검색량</small></div><div><b>42<i>세</i></b><small>평균 연령</small></div></div>
      <div class="cs-board-f">원동부영 1~5차 · 힐스테이트 · 초 1 · 중 1 (26년 개교) → <b>S급 입지 확정</b></div></div>`,
    keys: ["행정동 인구 · 세대 · 연령 통계", "반경 1km 경쟁병원 현장 조사", "네이버 검색량으로 온라인 수요 측정"],
    link: ["consulting.html", "개원 컨설팅"] },
  checklist: { no: "02", cat: "개원 컨설팅", title: "개원 체크리스트", lead: "70여 개 항목을 담당자와 기한을 정해 끝까지 관리합니다.",
    spec: [["항목", "70+"], ["단계", "5단계"], ["보고", "주 1회"]],
    visual: `<ul class="cs-list">
      <li><i>01</i><b>입지 선정</b><span>상권 분석 · 마케팅 플랜 · 타임테이블</span></li>
      <li><i>02</i><b>개원 준비</b><span>사업자 등록 · 개설 신고 · 협력병원 · 보험사 · 채용 · 노무</span></li>
      <li><i>03</i><b>진료 준비</b><span>약품 · 주사제 · 소모품 · 의료폐기물 · 전자차트 · 장비</span></li>
      <li><i>04</i><b>오프라인</b><span>현수막 · 포스터 · 의료광고심의 · 아파트 게시</span></li>
      <li><i>05</i><b>온라인</b><span>홈페이지 · 블로그 · 지도 등록 · 사진 촬영 · 리뷰</span></li></ul>`,
    keys: ["에이치메디 진행 항목과 원장님 결정 항목 분리", "개원일 기준 D-day 타임테이블", "포항 정형외과 예정일 개원"],
    link: ["consulting.html", "개원 로드맵"] },
  print: { no: "03", cat: "오프라인", title: "개원 포스터 · 배너", lead: "개원 한 달 전, 동네가 먼저 알게 합니다.",
    spec: [["시안", "2~3종"], ["심의", "의료광고 대행"], ["제작", "7~10일"]],
    visual: `<div class="cs-print"><div class="cs-poster"><span>GRAND OPEN</span><strong>정형외과</strong><em>3월 중 개원예정</em><small>정형외과 전문의 직접 진료</small><i>3F</i></div>
      <figure><img src="assets/img/portfolio/banner-building.jpg" alt="건물 외벽 현수막"></figure><figure><img src="assets/img/portfolio/banner-x.jpg" alt="실내 X배너"></figure></div>`,
    keys: ["포스터 · 외벽 현수막 · X배너 · 물티슈 한 번에", "심의 문구 정리부터 필증까지 대행", "인근 상가 · 엘리베이터 게시 대행"],
    link: ["consulting.html", "개원 컨설팅"] },
  local: { no: "04", cat: "오프라인", title: "지역 매체 게시", lead: "아파트 게시판부터 마트 카트까지, 개원지 주민에게 직접 닿습니다.",
    spec: [["리스트업", "아파트 37개"], ["게시비", "무료~55,000"], ["매체", "5종"]],
    visual: `<div class="cs-local"><table class="cs-table"><tr><th>단지</th><th>게시비</th><th>기간</th></tr><tr><td>한덕한신타워</td><td>무료</td><td>-</td></tr><tr><td>대동한마을</td><td>55,000</td><td>7일</td></tr><tr><td>동아2차</td><td>12,000</td><td>10일</td></tr><tr><td>서희스타힐스</td><td>27,000</td><td>7일</td></tr></table>
      <figure><img src="assets/img/portfolio/lamp.jpg" alt="가로등 배너"></figure><figure><img src="assets/img/portfolio/cart.jpg" alt="마트 카트 광고"></figure></div>`,
    keys: ["단지별 게시비 · 기간 · 연락처 표로 정리", "무료 단지 먼저, 유료는 개원 직전 2주 집중", "가로등 배너 · 현수막 · 카트 · 버스 게시 대행"],
    link: ["consulting.html", "개원 컨설팅"] },
  notice1: { no: "05", cat: "디자인", title: "휴진 안내문", lead: "급하게 만든 티가 나지 않는 원내 공지.",
    spec: [["제작", "당일"], ["형태", "게시 · SNS용"], ["비용", "계약 병원 무료"]],
    visual: `<div class="cs-shot"><img src="assets/img/portfolio/notice-closed.jpg" alt="휴진 안내문"></div>`,
    keys: ["카톡으로 내용만 주시면 당일 제작", "원내 게시용 · 플레이스 · 인스타 공지용 함께 제공"],
    link: ["marketing.html", "마케팅 프로그램"] },
  notice2: { no: "06", cat: "디자인", title: "영수증 리뷰 안내", lead: "대기 중에 QR로 바로 참여하게 만듭니다.",
    spec: [["참여", "QR 4단계"], ["게시", "데스크 · 대기실"], ["효과", "플레이스 순위"]],
    visual: `<div class="cs-shot"><img src="assets/img/portfolio/notice-review.jpg" alt="영수증 리뷰 참여 안내"></div>`,
    keys: ["영수증 리뷰는 플레이스 순위의 핵심 신호", "리뷰 답글 · 악성 리뷰 밀어내기까지 함께 관리"],
    link: ["marketing.html", "마케팅 프로그램"] },
  insta: { no: "07", cat: "인스타그램", title: "피부과 피드 운영", lead: "정보 · 이벤트 · 리뷰를 한 톤으로.",
    spec: [["제작", "월 8~12건"], ["범위", "기획 → 디자인 → 게시"], ["연계", "당근 · Meta 광고"]],
    visual: `<div class="cs-photos two"><figure><img src="assets/img/portfolio/insta-1.jpg" alt="피드 디자인"></figure><figure><img src="assets/img/portfolio/insta-2.jpg" alt="리프팅 패키지 기획"></figure></div>`,
    keys: ["시즌 · 이벤트 주제를 월 단위로 기획", "광고 소재와 공유해 제작비 절감"],
    link: ["marketing.html#program-instagram", "인스타그램 프로그램"] },
};
