# 에이치메디솔루션 홈페이지

네이버 플레이스 기반 병원 전문 마케팅 회사 **에이치메디솔루션**의 반응형 홈페이지입니다.
빌드 도구 없이 순수 HTML / CSS / JavaScript로 만들어져 어떤 정적 호스팅(GitHub Pages, Netlify, 아임웹 외부 연결 등)에도 바로 올릴 수 있습니다.

## 구조

```
index.html                 # 메인 (히어로 슬라이더 · 요약)
company.html               # 회사소개 · 플레이스 로직 · 자가진단 · 오시는 길
service.html               # 마케팅 프로그램 (카드 + 상세 모달 · 비교표 · 프로세스 · FAQ)
portfolio.html             # 성공사례 · 포트폴리오
contact.html               # 문의 (무료 진단 신청 폼)
assets/css/site.css        # 디자인 시스템 · 반응형 · 모션
assets/js/programs.js      # 마케팅 프로그램 데이터 (가격·구성 수정은 여기서)
assets/js/site.js          # 헤더 · 메뉴 · 슬라이더 · 리빌 · 차트 · 모달 · 폼
assets/img/                # 로고 · 파비콘 · 채널 로고 (사진 없이 CSS/SVG로 비주얼 구성)
assets/docs/hmedisolution-company-profile.pdf   # 회사소개서 (다운로드용, 압축본)
```

## 로컬에서 보기

```
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000 접속
```

## 자주 수정하는 항목

- **프로그램 가격·포함 구성**: `assets/js/programs.js`의 `price`, `items`, `highlights` 값을 수정하면 카드와 상세 모달에 모두 반영됩니다. `price: null`이면 "별도 문의"로 표시됩니다.
- **연락처·주소**: 각 페이지 푸터와 `contact.html`, `company.html`의 오시는 길.
- **포트폴리오 항목**: `portfolio.html`의 `.tile` 블록 (제목, 설명, 네이버 블로그 링크).
- **문의 폼**: 백엔드 없이 메일 작성 창(mailto)을 여는 방식입니다. 수신 주소는 `assets/js/site.js`의 `CONTACT_EMAIL`.

## 브랜드 컬러

- 스카이블루 `#0690FC` (로고 포인트)
- 인디고 `#3648A8` (로고 본문)
- 잉크 네이비 `#0A1020` (다크 섹션·텍스트), 화이트 배경
