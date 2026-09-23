# 에이치메디솔루션 홈페이지

네이버 플레이스 기반 병원 전문 마케팅 회사 **에이치메디솔루션**의 반응형 홈페이지입니다.
빌드 도구 없이 순수 HTML / CSS / JavaScript로 만들어져 어떤 정적 호스팅(GitHub Pages, Netlify, 아임웹 외부 연결 등)에도 바로 올릴 수 있습니다.

## 구조

```
index.html                 # 메인 (히어로 슬라이더 · 요약)
company.html               # 회사소개 · 플레이스 로직 · 자가진단 · 오시는 길
marketing.html             # 온라인 마케팅 (프로그램 카드 + 상세 모달 · 비교표 · 프로세스 · FAQ)
consulting.html            # 개원 컨설팅 · MSO
portfolio.html             # 성공사례 · 포트폴리오
contact.html               # 문의 (무료 진단 신청 폼)
admin.html                 # 관리자 모드 (팝업 관리 · 방문 통계 · 로그인) — 메뉴에 노출되지 않음, noindex
admin/schema.sql           # Supabase 스키마 (실제 서버 연결 시 SQL Editor에 붙여넣기)
admin/README.md            # 관리자 모드 연결 가이드
assets/css/site.css        # 디자인 시스템 · 반응형 · 모션 · 메인 팝업
assets/css/admin.css       # 관리자 화면 스타일
assets/js/config.js        # Supabase 연결 정보 (비워 두면 브라우저 저장 데모 모드)
assets/js/store.js         # 데이터 계층 (팝업 · 이벤트 · 인증) — Supabase / localStorage 자동 전환
assets/js/track.js         # 방문 · 클릭 · 상담 전환 기록 (관리자 · 봇 제외)
assets/js/popup.js         # 메인 팝업 표시 (바텀시트 · 오늘 하루 닫기)
assets/js/admin.js         # 관리자 대시보드 · 팝업 CRUD · 설정
assets/js/programs.js      # 마케팅 프로그램 데이터 (가격·구성 수정은 여기서)
assets/js/site.js          # 헤더 · 메뉴 · 슬라이더 · 리빌 · 차트 · 모달 · 폼
assets/img/                # 로고 · 파비콘 · 채널 로고 (사진 없이 CSS/SVG로 비주얼 구성)
assets/docs/hmedisolution-company-profile.pdf   # 회사소개서 (다운로드용, 압축본)
```

## 페이지 수정 · 빌드

페이지 본문은 `build/src/*.html` 에 있고, `build/build.py` 가 공통 head(SEO 메타 · JSON-LD) · 헤더 · 푸터를 붙여 저장소 루트에 출력합니다.
본문을 고친 뒤 아래를 실행하면 `index.html` 등과 `robots.txt` · `sitemap.xml` · `llms.txt` 가 함께 갱신됩니다.

```
python3 build/build.py
```

## SEO · GEO · AEO

- **검색엔진(SEO)**: 페이지별 제목 · 설명 · 키워드, canonical, Open Graph · Twitter 카드(`assets/img/og.jpg`), 한국어 키워드 `h1`, `robots.txt`, `sitemap.xml`
- **구조화 데이터(JSON-LD)**: Organization(ProfessionalService · 주소 2곳 · 연락처 · 서비스 지역), WebSite, WebPage, BreadcrumbList, Service, 마케팅 프로그램 OfferCatalog(가격), FAQPage
- **AI 검색(GEO · AEO)**: `llms.txt`(회사 · 서비스 · 가격 · FAQ 요약), 각 페이지의 FAQ 직접 답변, `robots.txt` 에서 GPTBot · ClaudeBot · PerplexityBot 등 AI 크롤러 허용
- **직접 해야 하는 등록** (한 번만):
  1. [네이버 서치어드바이저](https://searchadvisor.naver.com) → 사이트 등록 → HTML 태그 값을 `build/build.py` 의 `VERIFY["naver-site-verification"]` 에 넣고 빌드 → 사이트맵 제출(`/sitemap.xml`), RSS 없음
  2. [구글 서치콘솔](https://search.google.com/search-console) → URL 접두어로 등록 → HTML 태그 값을 `VERIFY["google-site-verification"]` 에 → 사이트맵 제출
  3. 커스텀 도메인 연결 후 `build/build.py` 의 `SITE_URL` 을 `https://hmedisolution.com` 으로 바꾸고 다시 빌드 · 푸시
  4. 네이버 플레이스(스마트플레이스) · 구글 비즈니스 프로필에 회사 등록 후 홈페이지 주소 연결

## 로컬에서 보기

```
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 자주 수정하는 항목

- **프로그램 가격·포함 구성**: `assets/js/programs.js`의 `price`, `items`, `highlights` 값을 수정하면 카드와 상세 모달에 모두 반영됩니다. `price: null`이면 "별도 문의"로 표시됩니다.
- **연락처·주소**: 각 페이지 푸터와 `contact.html`, `company.html`의 오시는 길.
- **포트폴리오 항목**: `portfolio.html`의 `.tile` 블록 (제목, 설명, 네이버 블로그 링크).
- **문의 폼**: 제출 내용은 관리자 페이지 → 상담 신청 탭에 쌓입니다. 서버(Supabase) 연결 전 데모 모드에서는 제출한 브라우저에만 저장되므로, 실제 운영은 `admin/README.md` 의 연결 절차가 필요합니다. 서버에 연결할 수 없을 때만 메일 작성 창(mailto)으로 대체됩니다.
- **카카오톡 채널**: `https://pf.kakao.com/_xmhxgvb` — 플로팅 버튼 · 문의 페이지 · 푸터 · 메뉴에 연결되어 있습니다.

## 관리자 모드

- 주소: `/admin.html` (사이트 메뉴에는 없고 검색엔진에도 노출되지 않습니다)
- 상담 신청 탭: 문의 폼 접수함 (신규 · 연락함 · 완료 상태, 메모). 접수 시 담당자 문자 알림은 `admin/README.md` 의 문자 알림 절차 참고
- 기본 상태는 **데모 모드**로, 데이터가 접속한 브라우저에만 저장됩니다. 데모 비밀번호 `hmedi1234`
- 실제 운영은 Supabase(무료)를 연결합니다. 절차는 `admin/README.md` 또는 관리자 화면의 설정 탭 참고.
- `assets/js/config.js`에는 **anon public 키만** 넣습니다. service_role 키는 절대 넣지 마세요.

## 브랜드 컬러

- 스카이블루 `#0690FC` (로고 포인트)
- 인디고 `#3648A8` (로고 본문)
- 잉크 네이비 `#0A1020` (다크 섹션·텍스트), 화이트 배경
