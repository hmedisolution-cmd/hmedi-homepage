/* 성공사례 · 포트폴리오 상세 (타일 클릭 시 열리는 케이스 상세) */
window.HMEDI_CASES = {
  market: {
    theme: "t-market", kicker: "Opening Consulting · 상권분석", title: "지역 통계 · 경쟁병원 · 검색량 분석",
    summary: "감으로 고르는 입지가 아니라 숫자로 확인한 입지입니다. 후보지마다 인구 · 세대 · 연령 통계, 경쟁병원 분포, 온라인 검색량을 한 장의 리포트로 정리해 개원 위치를 결정합니다.",
    facts: [["3~5곳", "후보지 비교"], ["7일", "리포트 소요"], ["무료", "1차 진단"]],
    steps: [
      ["행정동 통계 분석", "총 거주자 · 세대수 · 세대당 인구 · 남녀 비율 · 평균 연령을 행정동 단위로 비교합니다."],
      ["경쟁병원 분포 조사", "반경 1km 안의 진료과별 병원 수와 위치를 지도에 표시하고, 현장 방문으로 규모 · 대기시간 · 시설 수준을 확인합니다."],
      ["온라인 수요 측정", "네이버 월간 검색량과 콘텐츠 발행량으로 지역 환자의 온라인 수요와 마케팅 경쟁 강도를 봅니다."],
      ["배후 세대 · 동선 확인", "아파트 단지 세대수, 학교 · 상가 · 교통 동선을 확인해 실제 내원 가능 인구를 추산합니다."],
    ],
    deliver: ["입지 리포트 (PDF)", "후보지 비교표", "경쟁병원 현장 조사서", "추천 입지 · 임대 조건 검토"],
    visual: `
      <div class="cm-grid2">
        <div class="cm-card"><span class="cm-lbl">행정동 통계 · 김해시 장유1동</span><div class="cm-stats"><div><b>57,522</b><small>거주자</small></div><div><b>23,033</b><small>세대</small></div><div><b>2.5</b><small>세대당 인구</small></div><div><b>40대</b><small>중심 연령</small></div></div><p>남녀 모두 40대 비율이 높은 가족 단위 구성. 정형외과 · 가족 진료 수요가 큰 지역입니다.</p></div>
        <div class="cm-card"><span class="cm-lbl">경쟁병원 분포 · 반경 1km</span><ul class="cm-bars"><li><span>정형외과</span><i style="--w:100%"></i><b>2</b></li><li><span>GP · 가정의학과</span><i style="--w:100%"></i><b>2</b></li><li><span>신경외과</span><i style="--w:50%"></i><b>1</b></li><li><span>마취통증의학과</span><i style="--w:50%"></i><b>1</b></li></ul></div>
        <div class="cm-card"><span class="cm-lbl">온라인 검색량 · 월</span><div class="cm-kw"><div><b>김해정형외과</b><span>3,010회</span><small>PC 340 · 모바일 2,670</small></div><div><b>장유정형외과</b><span>1,480회</span><small>PC 180 · 모바일 1,300</small></div></div></div>
        <div class="cm-card"><span class="cm-lbl">배후 세대 · 포항 오천읍</span><div class="cm-stats"><div><b>7,000</b><small>세대</small></div><div><b>42세</b><small>평균 연령</small></div><div><b>1곳</b><small>경쟁 정형외과</small></div></div><p>원동부영 1~5차 · 힐스테이트 · 초등학교 1 · 중학교 1(26년 개교 예정). 이 데이터로 포항 정형외과 입지를 확정했습니다.</p></div>
      </div>`,
    points: ["경쟁병원 현장 조사에서 데스크 · 진료실 · 치료실 규모, 대기시간, 직원 연령대까지 기록해 차별화 포인트를 잡습니다.", "검색량이 높은데 콘텐츠가 적은 지역은 온라인 선점 효과가 큽니다."],
    link: ["consulting.html", "개원 컨설팅 자세히"],
  },
  checklist: {
    theme: "t-check", kicker: "Opening Consulting · 개원 준비", title: "ALL IN ONE 개원 체크리스트",
    summary: "개원 절차는 빠뜨리면 개원일이 밀립니다. 입지 선정부터 진료 준비, 온 · 오프라인 마케팅까지 70여 개 항목을 담당자와 기한을 정해 하나씩 지워 나갑니다.",
    facts: [["70+", "관리 항목"], ["5단계", "입지 → 마케팅"], ["주간", "진행 보고"]],
    steps: [
      ["입지 선정", "상권분석과 마케팅 플랜을 함께 세워 입지를 확정합니다."],
      ["개원 준비", "사업자 등록 · 의료기관 개설 신고 · 지급계좌 · 공인인증서 · 자동차보험 사업자 등록, 협력병원 체결, 상호 · 로고, 전화 · 인터넷, 직원 채용 · 교육, 개원 DM."],
      ["진료 준비", "원외처방 약품 · 주사제 · 소모품 · 수액세트 · 의료폐기물 계약, 원내 물품 · 서류, 진료 안내 영상, 가전 · 비품."],
      ["오프라인 · 온라인 마케팅", "현수막 · 포스터 · 의료광고심의 · 개원 확정 홍보와 홈페이지 · 블로그 · 지도 등록 · 포털 등록 · 사진 촬영 · 리뷰 관리."],
    ],
    deliver: ["항목별 체크리스트 (담당 · 기한)", "협력 업체 · 서류 양식 세트", "개원 D-day 타임테이블", "주간 진행 보고"],
    visual: `
      <div class="cm-check">
        <div><h5>01 입지 선정</h5><ul><li>상권 분석</li><li>마케팅 플랜</li><li>타임테이블 수립</li></ul></div>
        <div><h5>02 개원 준비</h5><ul><li>사업자 등록 · 개설 신고</li><li>지급계좌 · 공인인증서</li><li>협력병원 · 보험사 등록</li><li>상호 · 로고 · 간판</li><li>직원 채용 · 교육 · 노무</li><li>개원 DM 발송</li></ul></div>
        <div><h5>03 진료 준비</h5><ul><li>원외처방 약품 세팅</li><li>주사제 · 소모품 · 수액</li><li>의료폐기물 계약</li><li>원내 물품 · 서류</li><li>전자차트 · 장비</li></ul></div>
        <div><h5>04 오프라인</h5><ul><li>현수막 · 포스터</li><li>의료광고심의</li><li>개원 확정 홍보</li><li>아파트 · 상가 게시</li></ul></div>
        <div><h5>05 온라인</h5><ul><li>홈페이지 · 블로그</li><li>네이버 · 카카오 지도 등록</li><li>포털 사이트 등록</li><li>사진 촬영 · 리뷰 관리</li></ul></div>
      </div>
      <div class="cm-legend"><span><i class="a"></i>에이치메디 진행</span><span><i class="b"></i>원장님 확인</span></div>`,
    points: ["항목마다 에이치메디가 진행하는 일과 원장님이 결정할 일을 나눠 두어, 원장님은 진료 준비에 집중하실 수 있습니다.", "포항 정형외과는 이 체크리스트로 2025년 2월 예정일에 맞춰 개원했습니다."],
    link: ["consulting.html", "개원 로드맵 보기"],
  },
  print: {
    theme: "t-print", kicker: "Offline · 디자인 시안", title: "개원 포스터 · 배너 · 판촉물",
    summary: "개원 전부터 동네에 병원을 알리는 인쇄물입니다. 개원 예정 · GRAND OPEN · 진료 안내 포스터부터 건물 외벽 현수막, 실내 X배너, 물티슈 같은 판촉물까지 시안 제작과 의료광고심의, 인쇄 · 설치를 한 번에 진행합니다.",
    facts: [["2~3종", "시안 제안"], ["심의", "의료광고 대행"], ["7~10일", "제작 · 설치"]],
    steps: [
      ["기획 · 시안", "진료과목과 병원 컬러에 맞춰 개원 예정 · 오픈 · 진료 안내 등 목적별 시안을 2~3종 제안합니다."],
      ["의료광고심의", "심의 대상 문구를 정리해 대한의사협회 사전심의를 대행합니다."],
      ["인쇄 · 제작", "포스터 · 현수막 · X배너 · 물티슈 · 안내 봉투를 규격에 맞춰 제작합니다."],
      ["설치 · 배포", "건물 외벽 · 엘리베이터 · 원내 게시와 인근 상가 배포까지 진행합니다."],
    ],
    deliver: ["개원 예정 · GRAND OPEN · 진료 안내 포스터", "건물 외벽 대형 현수막", "실내 X배너", "물티슈 · 안내 봉투 등 판촉물", "의료광고심의 필증"],
    visual: `
      <div class="cm-posters">
        <div class="cm-poster p1"><span>GRAND OPEN</span><b>정형외과 전문의<br>직접 진료</b><em>3월 중</em><strong>정형외과<br>개원예정</strong><i>3F</i></div>
        <div class="cm-poster p2"><i>3F</i><strong>정형외과<br>GRAND OPEN</strong><em>3월 중 개원예정</em><span>정형외과 전문의 직접 진료</span></div>
        <div class="cm-poster p3"><i>3F</i><strong>정형외과<br>3월 중 개원</strong><span>정형외과 전문의 진료</span><em>GRAND OPEN</em></div>
      </div>
      <div class="cm-photos three">
        <figure><img src="assets/img/portfolio/banner-building.jpg" alt="건물 외벽 대형 현수막"><figcaption>건물 외벽 현수막</figcaption></figure>
        <figure><img src="assets/img/portfolio/banner-x.jpg" alt="실내 X배너"><figcaption>실내 X배너</figcaption></figure>
        <figure><img src="assets/img/portfolio/wipes.jpg" alt="판촉용 물티슈"><figcaption>물티슈 · 안내 봉투</figcaption></figure>
      </div>`,
    points: ["개원 한 달 전부터 외벽 현수막과 포스터를 게시해 개원일에 첫 환자가 오도록 준비합니다.", "판촉물은 인근 상가 · 아파트 배포용으로 병원 이름과 진료과목을 반복 노출합니다."],
    link: ["consulting.html", "개원 컨설팅 자세히"],
  },
  local: {
    theme: "t-local", kicker: "Offline · 지역 매체", title: "아파트 게시 · 현수막 · 카트 광고",
    summary: "개원지 주변 주민에게 직접 닿는 지역 매체입니다. 아파트 게시판 리스트를 만들어 게시 가능 여부와 가격을 확인하고, 전단 시안을 심의받아 아파트 · 가로등 배너 · 현수막 · 마트 카트 · 버스까지 게시합니다.",
    facts: [["37개", "아파트 리스트업"], ["무료~", "단지별 게시비"], ["5종", "게시 매체"]],
    steps: [
      ["게시처 리스트업", "개원지 반경 아파트 단지를 조사해 단지명 · 주소 · 게시 가격 · 게시 기간 · 관리사무소 연락처를 표로 정리합니다."],
      ["전단 · 배너 시안", "병원 소개 · 진료 안내 전단과 가로등 배너 · 현수막 시안을 제작하고 의료광고심의를 받습니다."],
      ["게시 · 설치", "아파트 게시판, 가로등 배너, 현수막, 이마트 카트, 버스 광고를 일정에 맞춰 게시합니다."],
      ["게시 확인 · 보고", "게시 사진과 기간을 확인해 보고하고, 종료 시점에 맞춰 교체 · 연장을 제안합니다."],
    ],
    deliver: ["아파트 게시 리스트 (가격 · 기간 · 연락처)", "전단 · 배너 · 현수막 시안", "게시 대행 · 게시 확인 사진", "카트 · 버스 광고 매체 연결"],
    visual: `
      <div class="cm-card cm-table"><span class="cm-lbl">아파트 게시 리스트 · 예시</span>
        <table><thead><tr><th>단지</th><th>게시비</th><th>기간</th><th>비고</th></tr></thead><tbody>
          <tr><td>한덕한신타워</td><td>무료</td><td>-</td><td>광고업체 통해 부착</td></tr>
          <tr><td>대동한마을</td><td>55,000</td><td>7일</td><td>비어있으면 계속 가능</td></tr>
          <tr><td>동아2차</td><td>12,000</td><td>10일</td><td>계속 가능</td></tr>
          <tr><td>서희스타힐스</td><td>27,000</td><td>7일</td><td>7일 단위 갱신</td></tr>
          <tr><td>동신아파트</td><td>11,000</td><td>7일</td><td>최대 2주</td></tr>
        </tbody></table></div>
      <div class="cm-chips"><span>아파트 게시판</span><span>가로등 배너</span><span>현수막</span><span>이마트 카트</span><span>버스 광고</span></div>
      <div class="cm-photos four">
        <figure><img src="assets/img/portfolio/site-1.jpg" alt="가로등 배너 게시"><figcaption>가로등 배너</figcaption></figure>
        <figure><img src="assets/img/portfolio/site-2.jpg" alt="현수막 게시"><figcaption>현수막</figcaption></figure>
        <figure><img src="assets/img/portfolio/site-3.jpg" alt="아파트 게시판 · 마트 카트"><figcaption>아파트 게시판 · 카트</figcaption></figure>
        <figure><img src="assets/img/portfolio/site-4.jpg" alt="아파트 게시판 · 버스"><figcaption>게시판 · 버스</figcaption></figure>
      </div>`,
    points: ["게시비가 무료인 단지부터 우선 게시해 예산을 아끼고, 유료 단지는 개원 직전 2주에 집중합니다.", "오프라인 게시와 네이버 플레이스 세팅을 같은 시기에 맞춰 검색 → 방문으로 이어지게 합니다."],
    link: ["consulting.html", "개원 컨설팅 자세히"],
  },
  notice1: {
    theme: "t-design", kicker: "Design · 원내 안내물", title: "휴진 안내문",
    summary: "휴진 · 진료시간 변경 같은 원내 공지를 병원 톤에 맞춰 디자인합니다. 원장님이 카톡으로 내용을 보내주시면 당일 안에 게시용 이미지와 인쇄용 파일로 드립니다.",
    facts: [["당일", "제작 소요"], ["무료", "마케팅 계약 병원"], ["2종", "게시 · SNS용"]],
    steps: [["내용 접수", "휴진 날짜 · 사유 · 정상 진료 시간을 받습니다."], ["디자인", "병원 컬러와 캐릭터 톤을 유지해 한눈에 읽히게 구성합니다."], ["전달", "원내 게시용 A4 · 출입문용, 네이버 플레이스 · 인스타그램 게시용으로 함께 드립니다."]],
    deliver: ["원내 게시용 인쇄 파일", "플레이스 · SNS 공지 이미지", "필요 시 문자 안내 문구"],
    visual: `<div class="cm-shot"><img src="assets/img/portfolio/notice-closed.jpg" alt="오전 휴진 안내문 디자인"></div>`,
    points: ["공지 이미지도 병원 브랜드의 일부입니다. 급하게 만든 티가 나지 않게 원내 안내물의 톤을 통일합니다."],
    link: ["marketing.html", "마케팅 프로그램 보기"],
  },
  notice2: {
    theme: "t-design", kicker: "Design · 원내 안내물", title: "영수증 리뷰 참여 안내",
    summary: "플레이스 순위에 가장 큰 영향을 주는 것이 영수증 리뷰입니다. 환자가 대기 중에 바로 참여할 수 있도록 QR 코드와 4단계 안내를 담은 포스터를 제작해 데스크 · 대기실에 게시합니다.",
    facts: [["QR", "바로 참여"], ["4단계", "참여 안내"], ["데스크", "게시 위치"]],
    steps: [["동선 설계", "접수 → 대기 → 수납 동선에서 안내물이 보이는 위치를 정합니다."], ["디자인", "네이버 영수증 리뷰 검색 → 마이플레이스 → 리뷰 쓰기 → 영수증 촬영 4단계를 그림으로 안내합니다."], ["운영", "리뷰 답글 작성과 악성 리뷰 밀어내기(영수증 리뷰)까지 마케팅 프로그램에서 함께 관리합니다."]],
    deliver: ["영수증 리뷰 안내 포스터 (A4 · A3)", "데스크 미니 배너", "QR 코드 · 링크"],
    visual: `<div class="cm-shot"><img src="assets/img/portfolio/notice-review.jpg" alt="영수증 리뷰 참여 안내 포스터"></div>`,
    points: ["리뷰 유도 안내물만으로도 월 영수증 리뷰 수가 눈에 띄게 늘어나는 병원이 많습니다."],
    link: ["marketing.html", "마케팅 프로그램 보기"],
  },
  insta: {
    theme: "t-insta", kicker: "Instagram · 컨텐츠 기획 및 디자인", title: "피부과 인스타그램 피드",
    summary: "진료 정보, 장비 소개, 이벤트, 리뷰를 병원 톤에 맞춰 기획하고 디자인해 피드를 일관되게 운영합니다. 리프팅 패키지 같은 기획 게시물은 한 달 단위로 캠페인처럼 구성합니다.",
    facts: [["월 8~12건", "게시물 제작"], ["기획 → 디자인", "원스톱"], ["피드 톤", "통일"]],
    steps: [["월간 기획", "시즌 · 이벤트 · 진료 정보 주제를 월 단위로 잡습니다."], ["디자인 · 카피", "썸네일 · 본문 카피 · 해시태그까지 디자이너와 마케터가 제작합니다."], ["게시 · 관리", "게시 일정에 맞춰 업로드하고 댓글 · DM 응대 가이드를 드립니다."]],
    deliver: ["피드 게시물 디자인", "이벤트 · 패키지 기획 게시물", "스토리 · 릴스 커버", "해시태그 · 카피"],
    visual: `<div class="cm-photos two big"><figure><img src="assets/img/portfolio/insta-1.jpg" alt="피부과 인스타그램 피드 디자인"><figcaption>진료 · 장비 · 리뷰 게시물</figcaption></figure><figure><img src="assets/img/portfolio/insta-2.jpg" alt="리프팅 패키지 기획 게시물"><figcaption>리프팅 패키지 기획</figcaption></figure></div>`,
    points: ["광고 계정처럼 보이지 않도록 정보 · 이벤트 · 일상 게시물 비율을 조절합니다.", "당근 · Meta 광고와 소재를 공유해 제작 비용을 줄입니다."],
    link: ["marketing.html#program-instagram", "인스타그램 프로그램 보기"],
  },
};
