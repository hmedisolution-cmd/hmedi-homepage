#!/usr/bin/env python3
"""페이지 조립기: src/*.html 의 본문에 공통 head/header/footer 를 끼워 넣어 저장소 루트에 출력."""
import os, re, sys

SRC = os.path.join(os.path.dirname(__file__), "src")
OUT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ==========================================================================
# SEO 설정
#  - SITE_URL: 커스텀 도메인 연결 후 "https://hmedisolution.com" 으로 바꾸고 다시 빌드 (canonical · sitemap · og:url 에 사용)
#  - 검색엔진 소유 확인 코드는 발급받은 값을 넣으면 <meta> 로 출력됩니다. (비우면 출력 안 함)
# ==========================================================================
SITE_URL = "https://hmedisolution.com"
SITE_NAME = "에이치메디솔루션"
VERIFY = {
  "naver-site-verification": "f20b6018ba6607ab3304346f78b105c0b0797721",   # 네이버 서치어드바이저 (hmedisolution.com 신규 등록)
  "google-site-verification": "D22YwkbVlXo0pCYqEknLPD5Iuasn8qno40CcnwMVZf8",  # 구글 서치콘솔 (기존 아임웹 설정에서 이전)
}
VERIFY_EXTRA = ['<meta name="google-site-verification" content="Hu6dVbtX4-fJMoVhIbT6oc4QSHpVhOFqQL443lvIFlU">']  # 두 번째 구글 계정 코드
ORG = {
  "name": "에이치메디솔루션", "alt": ["HMEDISOLUTION", "H MEDI SOLUTION", "에이치메디"],
  "slogan": "마케팅 잘하는 개원 컨설턴트",
  "desc": "병원 온라인 마케팅(네이버 플레이스 · 블로그 · 리뷰 운영 지원 · CPC 광고)과 개원 컨설팅 · MSO(입지분석 · 개원 준비 · 오프라인 마케팅 · 병원경영)를 한 팀이 실행하는 메디컬 솔루션 회사. 부천 본사와 부산 지사에서 수도권 · 부산 · 경남을 포함한 전국 병의원을 지원합니다.",
  "tel": "+82-10-8263-0982", "tel2": "+82-10-4435-4389", "email": "hmedi@hmedisolution.com", "biz": "209-37-36004",
  "founders": ["고한별"], "founded": "2020-04-15",
  "addr": [
    {"name": "부천 본사", "street": "소향로 13번길 28-14 403-1호", "city": "부천시", "region": "경기도", "country": "KR"},
    {"name": "부산 지사", "street": "서면로 10 데시앙 2616호", "city": "부산진구", "region": "부산광역시", "country": "KR"},
  ],
  "areas": ["대한민국", "수도권", "서울특별시", "경기도", "인천광역시", "부산광역시", "경상남도", "울산광역시"],
  "knows": ["병원 마케팅", "메디컬 마케팅", "네이버 플레이스 마케팅", "플레이스 상위노출", "병원 블로그 마케팅", "병원 리뷰 관리", "의료광고심의", "당근 광고", "인스타그램 광고", "Meta 광고", "개원 컨설팅", "병원 개원 준비", "상권분석", "병원 입지 선정", "병원 MSO", "병원 경영 컨설팅", "의약품 CSO", "병원 홈페이지 제작", "숏폼 영상 제작"],
}

ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

HEAD = """<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="keywords" content="{keywords}">
  <meta name="robots" content="{robots}">
  <meta name="author" content="에이치메디솔루션">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="에이치메디솔루션">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{og_image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="에이치메디솔루션 - 병원 마케팅 · 개원 컨설팅 · MSO">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{og_image}">
{verify}  <meta name="theme-color" content="#0a1020">
  <link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
  <link rel="stylesheet" href="assets/css/site.css?v={ver}">
  <script type="application/ld+json">{jsonld}</script>
</head>
<body data-page="{page}">
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38a9ff" stop-opacity=".45"/><stop offset="1" stop-color="#38a9ff" stop-opacity="0"/></linearGradient>
    <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0690fc" stop-opacity=".28"/><stop offset="1" stop-color="#0690fc" stop-opacity="0"/></linearGradient>
  </defs>
</svg>
"""

HEADER = """
<header class="site-header" id="siteHeader">
  <div class="header-inner">
    <a class="brand" href="/" aria-label="에이치메디솔루션 홈">
      <img class="logo-dark" src="assets/img/logo.png" alt="에이치메디솔루션 HMEDISOLUTION">
      <img class="logo-light" src="assets/img/logo-white.png" alt="에이치메디솔루션 HMEDISOLUTION">
    </a>
    <nav class="site-nav" aria-label="주요 메뉴">
      <a href="company.html" data-nav="company">회사소개</a>
      <a href="ai.html" data-nav="ai">AI 마케팅</a>
      <a href="marketing.html" data-nav="marketing">온라인 마케팅</a>
      <a href="consulting.html" data-nav="consulting">개원 컨설팅</a>
      <a href="portfolio.html" data-nav="portfolio">성공사례</a>
      <a href="/칼럼/" data-nav="insights">인사이트</a>
    </nav>
    <div class="header-right">
      <span class="header-tel">Tel. 010-8263-0982</span>
      <a class="btn btn-accent btn-sm" href="contact.html">무료 상담 신청</a>
      <button class="menu-btn" type="button" aria-label="메뉴 열기" aria-expanded="false"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="menu-overlay" aria-hidden="true">
  <div class="wrap menu-grid">
    <nav class="menu-links" aria-label="전체 메뉴">
      <a href="/" data-nav="home"><small>01</small>메인</a>
      <a href="company.html" data-nav="company"><small>02</small>회사소개</a>
      <a href="ai.html" data-nav="ai"><small>03</small>AI 마케팅 · AEO</a>
      <a href="marketing.html" data-nav="marketing"><small>04</small>온라인 마케팅</a>
      <a href="consulting.html" data-nav="consulting"><small>05</small>개원 컨설팅 · MSO</a>
      <a href="portfolio.html" data-nav="portfolio"><small>06</small>성공사례 · 포트폴리오</a>
      <a href="/칼럼/" data-nav="insights"><small>07</small>인사이트</a>
      <a href="contact.html" data-nav="contact"><small>08</small>문의하기</a>
    </nav>
    <aside class="menu-aside">
      <strong>마케팅 잘하는 개원 컨설턴트</strong>
      입지분석부터 개원, 마케팅, 병원경영까지.<br>지금 무료로 상담받아 보세요.
      <span class="big">010-8263-0982</span>
      hmedi@hmedisolution.com<br><a href="https://pf.kakao.com/_xmhxgvb" target="_blank" rel="noopener">카카오톡 채널로 문의하기 →</a>
      <div><a class="btn btn-accent" href="contact.html">무료 진단 신청 """ + ARROW + """</a></div>
    </aside>
  </div>
</div>
"""

FOOTER = """
<footer class="site-footer">
  <div class="wrap">
    <p class="statement">From opening<br>to <span class="a">growth.</span></p>
    <div class="foot-grid">
      <div class="foot-brand">
        <img src="assets/img/logo-white.png" alt="HMEDISOLUTION">
        <p>에이치메디솔루션 · 대표 고한별<br>사업자등록번호 209-37-36004<br>부천 본사 · 경기도 부천시 소향로 13번길 28-14 403-1호<br>부산 지사 · 부산진구 서면로 10 데시앙 2616호</p>
      </div>
      <div>
        <p class="foot-h">Menu</p>
        <ul>
          <li><a href="company.html">회사소개</a></li>
          <li><a href="ai.html">AI 마케팅 · AEO</a></li>
          <li><a href="marketing.html">온라인 마케팅</a></li>
          <li><a href="consulting.html">개원 컨설팅 · MSO</a></li>
          <li><a href="portfolio.html">성공사례 · 포트폴리오</a></li>
          <li><a href="/칼럼/">인사이트</a></li>
          <li><a href="contact.html">문의하기</a></li>
        </ul>
      </div>
      <div>
        <p class="foot-h">Service</p>
        <ul>
          <li><a href="marketing.html#program-standard">마케팅 프로그램 Standard</a></li>
          <li><a href="marketing.html#program-ai">AI 실속 패키지</a></li>
          <li><a href="consulting.html#roadmap">개원 로드맵</a></li>
          <li><a href="consulting.html#allinone">ALL IN ONE 체크리스트</a></li>
          <li><a href="assets/docs/hmedisolution-company-profile.pdf" target="_blank" rel="noopener">회사소개서 다운로드</a></li>
        </ul>
      </div>
      <div class="foot-contact">
        <p class="foot-h">Contact</p>
        <b>010-8263-0982</b><span>고한별 대표 · 수도권</span>
        <b>010-4435-4389</b><span>부산 지사 · 부산 / 경남</span>
        <b style="font-size:16px">hmedi@hmedisolution.com</b>
        <a class="foot-kakao" href="https://pf.kakao.com/_xmhxgvb" target="_blank" rel="noopener">카카오톡 채널 상담 →</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© <span id="year">2026</span> HMEDISOLUTION. All rights reserved. · <a href="privacy.html">개인정보 처리방침</a></span>
      <span>Medical Marketing · Opening Consulting · MSO</span>
    </div>
  </div>
</footer>

<div class="quick">
  <a class="top" href="#top" aria-label="맨 위로"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></a>
  <a class="kakao" href="https://pf.kakao.com/_xmhxgvb" target="_blank" rel="noopener" aria-label="카카오톡 채널 상담"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.5 3 2 6.6 2 11c0 2.8 1.8 5.2 4.6 6.6L5.5 21l4.3-2.7c.7.1 1.4.2 2.2.2 5.5 0 10-3.6 10-8S17.5 3 12 3z"/></svg></a>
  <a href="tel:01082630982" aria-label="전화 상담"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg></a>
</div>
<div class="modal" id="programModal" aria-hidden="true" role="dialog" aria-modal="true" aria-label="마케팅 프로그램 상세"><div class="modal-bg"></div><div class="modal-panel"></div></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script src="assets/js/config.js?v={ver}"></script>
<script src="assets/js/store.js?v={ver}"></script>
<script src="assets/js/programs.js?v={ver}"></script>
<script src="assets/js/site.js?v={ver}"></script>
<script src="assets/js/track.js?v={ver}"></script>
<script src="assets/js/popup.js?v={ver}"></script>
</body>
</html>
"""

PAGES = {
  # page: (title, description, keywords, 한국어 h1(페이지 히어로), 빵부스러기 이름, 서비스 타입)
  "index": ("병원 마케팅 · 개원 컨설팅 전문 에이치메디솔루션 | 마케팅 잘하는 개원 컨설턴트",
            "병원 온라인 마케팅과 개원 컨설팅·MSO를 한 팀이 실행합니다. 네이버 플레이스 상위노출, 병원 블로그, 리뷰 운영 지원, 입지분석부터 개원 준비, 개원 후 병원경영까지. 부천 본사 · 부산 지사, 전국 병의원 지원.",
            "병원 마케팅, 개원 마케팅, 병원 개원 마케팅, 병원 온라인 마케팅, 개원 컨설팅, 병원 MSO, 네이버 플레이스 마케팅, 플레이스 상위노출, 병원 블로그 마케팅, 병원 바이럴 마케팅, 병원 브랜딩, 피부과 마케팅, 정형외과 마케팅, 메디컬 마케팅, 개원 준비, 상권분석, 에이치메디솔루션",
            None, None, None),
  "company": ("회사소개 | 병원 마케팅 · 개원 컨설팅 전문 에이치메디솔루션",
              "에이치메디솔루션은 온라인 마케팅 회사로 출발해 입지분석, 부동산 계약, 온·오프라인 마케팅, 개원 절차, 병원경영까지 ALL IN ONE으로 운영하는 메디컬 솔루션 회사입니다. 크몽 마케팅 카테고리 Prime 전문가.",
              "에이치메디솔루션, 병원 마케팅 회사, 개원 컨설팅 회사, 병원 MSO, 메디컬 마케팅 대행사, 부천 병원 마케팅, 부산 병원 마케팅",
              "병원 마케팅 · 개원 컨설팅 전문 메디컬 솔루션 회사", "회사소개", None),
  "marketing": ("병원 마케팅 프로그램 · 네이버 플레이스 마케팅 | 에이치메디솔루션",
                "네이버 플레이스 로직 기반 병원 마케팅 프로그램. Standard(월 150만원), Premium(월 180만원), AI 실속 패키지(월 99만원)와 홈페이지 제작, 숏폼 영상, 당근·인스타그램·Meta 광고 대행. 크몽 Prime 전문가, 만족도 100%.",
                "병원 마케팅, 병원 온라인 마케팅, 네이버 플레이스 마케팅, 플레이스 상위노출, 병원 블로그 마케팅, 병원 바이럴 마케팅, 피부과 마케팅, 정형외과 마케팅, 병원 리뷰 관리, 병원 마케팅 비용, 병원 마케팅 대행, 병원 홈페이지 제작, 병원 숏폼, 당근 광고 대행, 의료광고심의",
                "네이버 플레이스 기반 병원 마케팅 프로그램", "온라인 마케팅", "병원 온라인 마케팅"),
  "consulting": ("개원 컨설팅 · 병원 MSO | 마케팅 잘하는 개원 컨설턴트 에이치메디솔루션",
                 "상권분석과 입지 선정, 개원 준비, 진료 준비, 오프라인 마케팅, 개원 후 경영까지 ALL IN ONE 개원 컨설팅. 마케팅 전문성을 갖춘 개원 컨설턴트와 MSO 서비스. 크몽 Prime 전문가가 마케팅까지 직접 실행합니다.",
                 "개원 컨설팅, 개원 마케팅, 병원 개원 마케팅, 피부과 개원 마케팅, 병원 개원 준비, 병원 MSO, 상권분석, 병원 입지 선정, 개원 절차, 병원 경영 컨설팅, 의약품 CSO, 개원 컨설팅 비용, 부산 개원 컨설팅, 수도권 개원 컨설팅",
                 "마케팅 잘하는 개원 컨설팅 · 병원 MSO", "개원 컨설팅 · MSO", "병원 개원 컨설팅 · MSO"),
  "portfolio": ("병원 마케팅 · 개원 컨설팅 성공사례 | 에이치메디솔루션",
                "포항 정형외과 개원 컨설팅(개원 첫 달 일환자 120명), 부산 H피부과 플레이스 20위→3위, 인천 S외과, 광교 G피부과 등 병원 마케팅과 개원 컨설팅 성공사례 · 포트폴리오.",
                "병원 마케팅 성공사례, 개원 컨설팅 사례, 플레이스 상위노출 사례, 병원 마케팅 포트폴리오, 정형외과 개원, 피부과 마케팅",
                "병원 마케팅 · 개원 컨설팅 성공사례", "성공사례 · 포트폴리오", None),
  "ai": ("AI 검색 노출 마케팅 AEO·GEO·SEO | 에이치메디솔루션",
         "홈페이지 콘텐츠와 외부 칼럼 콘텐츠 제작·발행, SEO 점검과 AI 측정 계획을 확인하고 병원에 맞는 운영 범위를 상담하세요. 월 150만원부터, VAT 별도.",
         "AEO, GEO, SEO, AI 검색 노출 마케팅, AI 검색 최적화, 병원 AI 마케팅, ChatGPT 병원 노출, 생성형 AI 검색, 병원 콘텐츠 운영, 병원 칼럼 사이트, 병원 SEO 점검, AI 답변 출처, 에이치메디솔루션",
         "AI 검색 노출 마케팅 · AEO·GEO·SEO", "AI 마케팅", "AI 검색 최적화(AEO) 마케팅"),
  "insights": ("인사이트 · 병원 마케팅 · 개원 칼럼 | 에이치메디솔루션",
               "네이버 플레이스, AI 검색(AEO), 개원 준비와 병원 경영에 대한 에이치메디솔루션의 인사이트 칼럼.",
               "병원 마케팅 칼럼, 개원 인사이트, 플레이스 마케팅 팁, AEO 가이드, 병원 경영 칼럼",
               "병원 마케팅 · 개원 인사이트", "인사이트", None),
  "post": ("인사이트 | 에이치메디솔루션",
           "에이치메디솔루션 인사이트 칼럼.",
           "병원 마케팅 칼럼, 개원 인사이트",
           None, "인사이트", None),
  "contact": ("병원 마케팅 무료 진단 · 개원 상담 신청 | 에이치메디솔루션",
              "네이버 플레이스 무료 진단과 개원 컨설팅 상담 신청. 수도권 010-8263-0982(고한별 대표), 부산·경남 010-4435-4389(부산 지사). 병원 상황에 맞는 프로그램만 제안해 드립니다.",
              "병원 마케팅 상담, 플레이스 무료 진단, 개원 상담, 병원 마케팅 문의, 개원 컨설팅 문의, 에이치메디솔루션 연락처",
              "병원 마케팅 무료 진단 · 개원 컨설팅 상담 신청", "문의하기", None),
  "ceo": ("고한별 대표 소개 · 경력 | 에이치메디솔루션",
          "에이치메디솔루션 고한별 대표 소개. 동원그룹 전략기획, KT&G 마케팅기획을 거쳐 2019년 크몽 네이버 플레이스 마케팅 서비스 론칭 · Prime 전문가 인증. 마케팅 컨설팅 200회 이상, 강연 20회 이상.",
          "고한별, 에이치메디솔루션 대표, 병원 마케팅 전문가, 네이버 플레이스 마케팅 전문가, 크몽 Prime 전문가, 개원 컨설턴트",
          "고한별 대표 소개 · 경력", "대표 소개", None),
  "case-pohang": ("포항 정형외과 개원 컨설팅 사례 · 개원 첫 달 일환자 120명 | 에이치메디솔루션",
          "포항 오천읍 1인 진료 정형외과 개원 사례. 상권분석으로 입지를 정하고 개원 준비와 사전마케팅을 함께 진행해 2025년 2월 개원, 4주차 일환자 121명을 기록한 과정을 정리했습니다.",
          "정형외과 개원 컨설팅 사례, 포항 병원 개원, 병원 입지분석 사례, 개원 사전마케팅, 1인 정형외과 개원",
          "포항 정형외과 개원 컨설팅 사례 · 개원 첫 달 일환자 120명", "포항 O정형외과 사례", None),
  "case-busan": ("부산 서면 피부과 플레이스 마케팅 사례 · 조회수 83.5% 증가 | 에이치메디솔루션",
          "부산 H피부과 네이버 플레이스 마케팅 사례. 저품질 블로그를 정리하고 콘텐츠를 다시 쌓아 8개월 동안 플레이스 월 조회수가 5,690회에서 10,443회로 늘고, 20위권에서 부산피부과 4위 · 서면피부과 3위까지 오른 과정입니다.",
          "피부과 마케팅 사례, 부산 피부과 마케팅, 서면 피부과 플레이스, 네이버 플레이스 마케팅 사례, 병원 블로그 저품질",
          "부산 서면 피부과 플레이스 마케팅 사례 · 조회수 83.5% 증가", "부산 H피부과 사례", None),
  "case-incheon": ("인천 외과 플레이스 마케팅 사례 · 조회수 48.7% 증가 | 에이치메디솔루션",
          "인천 S외과 네이버 플레이스 마케팅 사례. 비슷한 상호가 많아 분산되던 검색 유입을 상호 키워드부터 모으고 진료 항목 키워드로 넓혀, 6개월 동안 월 조회수가 4,970회에서 7,393회로 늘어난 과정입니다.",
          "외과 마케팅 사례, 인천 병원 마케팅, 병원 상호 키워드, 네이버 플레이스 마케팅 사례, 내과 외과 마케팅",
          "인천 외과 플레이스 마케팅 사례 · 상호 키워드 전략으로 조회수 48.7% 증가", "인천 S외과 사례", None),
  "case-gwanggyo": ("광교 피부과 개원 사전마케팅 사례 · 조회수 54% 증가 | 에이치메디솔루션",
          "광교 G피부과 개원 사전마케팅 사례. 신규 개원 피부과가 많은 경쟁 지역에서 개원 1개월 전부터 플레이스 · 블로그를 준비해, 7개월 동안 월 조회수가 6,085회에서 9,409회로 늘고 광교피부과 5위(최대 1위)에 오른 과정입니다.",
          "피부과 개원 마케팅 사례, 광교 피부과 마케팅, 개원 사전마케팅, 네이버 플레이스 마케팅 사례, 신규 개원 병원 마케팅",
          "광교 피부과 개원 사전마케팅 사례 · 조회수 54% 증가", "광교 G피부과 사례", None),
  "privacy": ("개인정보 처리방침 | 에이치메디솔루션",
              "에이치메디솔루션 홈페이지 상담 신청 과정에서 수집하는 개인정보 항목, 이용 목적, 보유 기간(3년), 처리 위탁, 이용자 권리와 개인정보 보호책임자 안내.",
              "에이치메디솔루션 개인정보 처리방침",
              "개인정보 처리방침", "개인정보 처리방침", None),
}

SENT_SPLIT = re.compile(r'(?<=[.!?。])\s+(?=\S)')
def wrap_sentences(html):
    """<p>/<li> 안의 문장을 <span class="sn">으로 감싸 문장 단위로 줄바꿈되게 한다 (중첩 태그가 없는 경우만)."""
    def repl(m):
        open_tag, inner, close = m.group(1), m.group(2), m.group(3)
        if re.search(r'<(?!/?(strong|b|em|br)\b)', inner):  # 다른 태그 포함 시 건너뜀
            return m.group(0)
        parts = [x.strip() for x in SENT_SPLIT.split(inner.replace("<br>", " ")) if x.strip()]
        if len(parts) < 2:
            return m.group(0)
        return open_tag + " ".join(f'<span class="sn">{x}</span>' for x in parts) + close
    return re.sub(r'(<p(?:\s[^>]*)?>)(.*?)(</p>)', repl, html, flags=re.S)

import json, html as htmlmod, subprocess, datetime, hashlib

def strip_tags(x):
    return re.sub(r"\s+", " ", htmlmod.unescape(re.sub(r"<[^>]+>", " ", x))).strip()

def extract_faq(body):
    items = re.findall(r'<div class="faq-item">.*?<button class="faq-q"[^>]*>(.*?)</button>.*?<div class="faq-a">(.*?)</div>\s*</div>', body, flags=re.S)
    out = []
    for q, a in items:
        q = strip_tags(q).replace("Q.", "", 1).strip()
        a = strip_tags(a)
        if q and a: out.append((q, a))
    return out

def load_programs():
    js = os.path.join(OUT, "assets", "js", "programs.js")
    try:
        code = "const w={};global.window=w;require(%s);console.log(JSON.stringify(w.HMEDI_PROGRAMS))" % json.dumps(js)
        return json.loads(subprocess.check_output(["node", "-e", code], text=True))
    except Exception as e:
        print("programs.js 읽기 실패 (node 필요):", e); return []

def page_url(page):
    return SITE_URL + "/" if page == "index" else "%s/%s.html" % (SITE_URL, page)

def org_ld():
    return {
      "@type": ["Organization", "ProfessionalService"], "@id": SITE_URL + "/#org",
      "name": ORG["name"], "alternateName": ORG["alt"], "url": SITE_URL + "/", "logo": SITE_URL + "/assets/img/logo.png",
      "image": SITE_URL + "/assets/img/og.jpg", "description": ORG["desc"], "slogan": ORG["slogan"],
      "telephone": ORG["tel"], "email": ORG["email"], "taxID": ORG["biz"], "priceRange": "₩₩",
      "founder": [{"@type": "Person", "@id": SITE_URL + "/ceo.html#person", "name": n, "url": SITE_URL + "/ceo.html"} for n in ORG["founders"]], "foundingDate": ORG["founded"],
      "address": [{"@type": "PostalAddress", "name": a["name"], "streetAddress": a["street"], "addressLocality": a["city"], "addressRegion": a["region"], "addressCountry": a["country"]} for a in ORG["addr"]],
      "areaServed": ORG["areas"], "knowsAbout": ORG["knows"],
      "contactPoint": [
        {"@type": "ContactPoint", "telephone": ORG["tel"], "contactType": "sales", "name": "고한별 대표 · 수도권", "areaServed": "KR", "availableLanguage": "ko"},
        {"@type": "ContactPoint", "telephone": ORG["tel2"], "contactType": "sales", "name": "부산 지사 · 부산 / 경남", "areaServed": "KR", "availableLanguage": "ko"},
      ],
      "sameAs": ["https://pf.kakao.com/_xmhxgvb", "https://kmong.com/@%EC%97%90%EC%9D%B4%EC%B9%98%EB%A9%94%EB%94%94"],
      "makesOffer": [{"@type": "Offer", "itemOffered": {"@type": "Service", "name": n}} for n in ["병원 온라인 마케팅", "네이버 플레이스 마케팅", "개원 컨설팅", "병원 MSO · 경영 컨설팅", "병원 홈페이지 제작"]],
    }

def offers_ld(programs):
    items = []
    for p in programs:
        o = {"@type": "Offer", "name": p["name"], "description": p.get("desc", ""), "url": SITE_URL + "/marketing.html#program-" + p["id"], "availability": "https://schema.org/InStock", "seller": {"@id": SITE_URL + "/#org"}}
        if p.get("price"):
            o["priceCurrency"] = "KRW"; o["price"] = p["price"]
            spec = {"@type": "UnitPriceSpecification", "price": p["price"], "priceCurrency": "KRW", "valueAddedTaxIncluded": False}
            if p.get("priceFrom"): spec["minPrice"] = p["price"]; spec["description"] = p.get("priceNote", "")
            elif p.get("unit") == "월": spec["unitCode"] = "MON"; spec["billingIncrement"] = 1; spec["description"] = "월 단위 · VAT 별도 · 최소 계약 3개월"
            o["priceSpecification"] = spec
        items.append({"@type": "ListItem", "position": len(items) + 1, "item": o})
    return {"@type": "OfferCatalog", "name": "병원 마케팅 프로그램", "itemListElement": items}

PROGRAMS = load_programs()
TODAY = datetime.date.today().isoformat()
VER = datetime.datetime.now().strftime("%Y%m%d%H%M")

def build_jsonld(page, title, desc, body, crumb, service):
    url = page_url(page)
    graph = [org_ld(), {"@type": "WebSite", "@id": SITE_URL + "/#website", "url": SITE_URL + "/", "name": ORG["name"], "alternateName": "HMEDISOLUTION", "inLanguage": "ko-KR", "publisher": {"@id": SITE_URL + "/#org"}}]
    web = {"@type": "WebPage", "@id": url + "#webpage", "url": url, "name": title, "description": desc, "inLanguage": "ko-KR", "isPartOf": {"@id": SITE_URL + "/#website"}, "about": {"@id": SITE_URL + "/#org"}, "dateModified": TODAY}
    crumbs = [{"@type": "ListItem", "position": 1, "name": "홈", "item": SITE_URL + "/"}]
    if page.startswith("case-"): crumbs.append({"@type": "ListItem", "position": 2, "name": "성공사례", "item": SITE_URL + "/portfolio.html"})
    if page.startswith("marketing-"): crumbs.append({"@type": "ListItem", "position": 2, "name": "온라인 마케팅", "item": SITE_URL + "/marketing.html"})
    if crumb: crumbs.append({"@type": "ListItem", "position": len(crumbs) + 1, "name": crumb, "item": url})
    web["breadcrumb"] = {"@id": url + "#breadcrumb"}
    graph.append(web); graph.append({"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": crumbs})
    if service:
        sv = {"@type": "Service", "@id": url + "#service", "name": service, "serviceType": service, "provider": {"@id": SITE_URL + "/#org"}, "areaServed": ORG["areas"], "url": url, "description": desc}
        if page == "marketing" and PROGRAMS: sv["hasOfferCatalog"] = offers_ld(PROGRAMS)
        graph.append(sv)
    if page.startswith("case-"):
        graph.append({"@type": "Article", "@id": url + "#article", "headline": title.split(" | ")[0], "description": desc, "url": url, "mainEntityOfPage": {"@id": url + "#webpage"},
          "datePublished": "2026-11-11", "inLanguage": "ko-KR", "articleSection": "성공사례",
          "author": {"@type": "Person", "@id": SITE_URL + "/ceo.html#person", "name": "고한별", "url": SITE_URL + "/ceo.html"}, "publisher": {"@id": SITE_URL + "/#org"}})
    if page == "ceo":
        web["@type"] = "ProfilePage"; web["mainEntity"] = {"@id": url + "#person"}
        graph.append({"@type": "Person", "@id": url + "#person", "name": "고한별", "jobTitle": "대표", "url": url,
          "worksFor": {"@id": SITE_URL + "/#org"},
          "description": "에이치메디솔루션 대표. 동원그룹 전략기획(2017), KT&G 마케팅기획(2018)을 거쳐 2019년 크몽에서 네이버 플레이스 마케팅 서비스를 론칭하고 Prime 전문가로 인증받았다. 2020년 에이치메디솔루션 설립, 2023년 개원 컨설팅 시작. 크몽 마케팅 컨설팅 200회 이상, 탈잉 마케팅 강연 20회 이상, 크몽 온라인 마케팅 전자책 200부 이상 판매.",
          "knowsAbout": ["네이버 플레이스 마케팅", "병원 온라인 마케팅", "병원 개원 컨설팅", "상권분석", "프랜차이즈 마케팅 교육"],
          "sameAs": ["https://kmong.com/@%EC%97%90%EC%9D%B4%EC%B9%98%EB%A9%94%EB%94%94"],
          "hasCredential": {"@type": "EducationalOccupationalCredential", "name": "크몽 마케팅 Prime 전문가 인증", "dateCreated": "2019"}})
    faq = extract_faq(body)
    if faq:
        graph.append({"@type": "FAQPage", "@id": url + "#faq", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))

def korean_h1(body, h1):
    """페이지 히어로: 영문 장식 제목은 <p>로, 한국어 키워드 제목을 실제 <h1>으로."""
    if not h1: return body
    return re.sub(r'<h1 class="title-en split">(.*?)</h1>', lambda m: '<p class="title-en split" aria-hidden="true">%s</p>\n    <h1 class="ph-h1">%s</h1>' % (m.group(1), h1), body, count=1, flags=re.S)


# ---------- 공통 렌더 · 인사이트 정적 글 색인 ----------
INS_DIR = os.path.join(OUT, "insights")
DEFAULT_OG = SITE_URL + "/assets/img/og.jpg?v=" + VER
ROBOTS_INDEX = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"

def absolutize(html):
    """하위 폴더(insights/)에서 서빙되는 페이지용: 상대 경로 href/src 를 루트 절대 경로(/...)로."""
    return re.sub(r'(href|src)="(?!https?:|//|#|mailto:|tel:|data:|javascript:|/)', r'\1="/', html)

def render_page(page, title, desc, keywords, canonical, jsonld, body, robots=ROBOTS_INDEX, og_title=None, og_type="website", og_image=None, root_abs=False):
    verify = "".join('  <meta name="%s" content="%s">\n' % (k, v) for k, v in VERIFY.items() if v) + "".join("  %s\n" % x for x in VERIFY_EXTRA)
    html = HEAD.format(title=title, desc=desc, keywords=keywords, canonical=canonical, site=SITE_URL, verify=verify, jsonld=jsonld, page=page, ver=VER,
                       og_title=og_title or title, robots=robots, og_type=og_type, og_image=og_image or DEFAULT_OG)
    html += wrap_sentences(HEADER) + '<main id="top">\n' + body + '\n</main>\n' + wrap_sentences(FOOTER).replace('{ver}', VER)
    return absolutize(html) if root_abs else html

def load_posts_index():
    """build/posts.py 가 만든 insights/index.json (공개 글 목록). 없으면 빈 목록."""
    try:
        return json.load(open(os.path.join(INS_DIR, "index.json"), encoding="utf-8")).get("posts", [])
    except Exception:
        return []

def post_url(p):
    return "%s/insights/%s.html" % (SITE_URL, p["slug"])

def post_timestamp(value):
    if not isinstance(value,str) or not re.search(r'(Z|[+-]\d{2}:\d{2})$',value): return None
    try:
        dt=datetime.datetime.fromisoformat(value.replace('Z','+00:00'))
        if dt.tzinfo is None: return None
        return dt.astimezone(datetime.timezone(datetime.timedelta(hours=9)))
    except (ValueError,OverflowError): return None

def fmt_date(value):
    dt=post_timestamp(value)
    return dt.strftime('%Y.%m.%d %H:%M')+' KST' if dt else '날짜 미확인'

def post_dates(p):
    pub=post_timestamp(p.get('published_at'))
    # Raw updated_at is not content-change evidence in the current receiver.
    mod=post_timestamp(p.get('content_modified_at'))
    out={}
    if pub: out['datePublished']=pub.isoformat(timespec='seconds')
    if pub and mod and mod>pub: out['dateModified']=mod.isoformat(timespec='seconds')
    return out

# 칼럼 작성자 → 사람 정보 (2026-11-11 대표 지시: 「고한별 대표」 는 대표 소개 페이지로 잇고 구조화 데이터는 그 사람의 @id 로 묶는다)
AUTHORS = {"고한별 대표": {"name": "고한별", "url": SITE_URL + "/ceo.html"}}

def author_person(p):
    """알려진 작성자면 {name, url}, 아니면 None"""
    return AUTHORS.get((p.get('author') or '').strip())

def post_metadata(p, link=False):
    """link=True 는 글 페이지에서만 — 목록 카드는 통째로 <a> 라 안에 링크를 또 넣으면 안 된다"""
    dates=post_dates(p); e=htmlmod.escape
    author=p.get('author') or ORG['name']
    who=author_person(p)
    stamp='<time datetime="%s">발행 %s</time>' % (e(dates['datePublished'],quote=True),e(fmt_date(dates['datePublished']))) if dates.get('datePublished') else '<span>날짜 미확인</span>'
    if dates.get('dateModified'): stamp+='<time datetime="%s">수정 %s</time>' % (e(dates['dateModified'],quote=True),e(fmt_date(dates['dateModified'])))
    name='<a href="%s" rel="author">%s</a>' % (e(who['url'],quote=True), e(author)) if (link and who) else e(author)
    return '<span>'+name+'</span>'+stamp

def tags_of(p):
    t = p.get("tags") or []
    return t if isinstance(t, list) else [x.strip() for x in str(t).split(",") if x.strip()]

def post_card(p, root_abs=False):
    """insights.js 의 card() 와 같은 마크업 (정적 목록 · 관련 글)."""
    e = htmlmod.escape
    href = ("/insights/%s.html" if root_abs else "insights/%s.html") % p["slug"]
    tags = tags_of(p)
    cover = p.get("cover_url") or ""
    thumb = '<div class="ins-thumb" style="background-image:url(\'%s\')"></div>' % e(cover, quote=True) if cover else '<div class="ins-thumb"><span>%s</span></div>' % e(tags[0] if tags else "Insight")
    meta = post_metadata(p)
    return ('<a class="ins-card" href="%s">%s<div class="ins-body"><div class="ins-tagline">%s</div><h3>%s</h3><p>%s</p><div class="ins-meta">%s</div></div></a>'
            % (href, thumb, "".join('<span>%s</span>' % e(t) for t in tags[:2]), e(p.get("title", "")), e(p.get("excerpt") or ""), meta))

def inject_posts(body, posts):
    """insights.html: 공개 글 카드 · 태그 버튼을 미리 채워 JS 없이도(검색엔진 · AI 크롤러) 목록이 보이게."""
    if not posts:
        return body.replace('<div class="ins-tags" id="insTags"></div>', '<div class="ins-tags" id="insTags"><button type="button" class="is-active" data-t="">전체 0</button></div>').replace('불러오는 중…', '아직 등록된 글이 없습니다.')
    tags = {}
    for p in posts:
        for t in tags_of(p): tags[t] = tags.get(t, 0) + 1
    e = htmlmod.escape
    tag_html = '<button type="button" class="is-active" data-t="">전체 %d</button>' % len(posts) + "".join('<button type="button" data-t="%s">%s %d</button>' % (e(t, quote=True), e(t), n) for t, n in sorted(tags.items(), key=lambda x: -x[1]))
    body = body.replace('<div class="ins-tags" id="insTags"></div>', '<div class="ins-tags" id="insTags">%s</div>' % tag_html)
    return body.replace('<div class="ins-grid" id="insGrid"><div class="ins-empty">불러오는 중…</div></div>', '<div class="ins-grid" id="insGrid">%s</div>' % "".join(post_card(p) for p in posts))

def load_clients():
    try: return json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "clients.json"), encoding="utf-8"))
    except Exception: return []

def client_counts(key):
    """clients.json 을 key(sido · group)로 세어 많은 순으로 돌려준다."""
    out = {}
    for c in load_clients(): out[c[key]] = out.get(c[key], 0) + 1
    return sorted(out.items(), key=lambda x: -x[1])

def clients_html():
    """메인 페이지 고객사 섹션: 같은 크기의 카드(흰색 로고 + 병원명)가 두 줄로 흐르고, 아래에 지역별 병의원 수를 보여 준다."""
    cl = load_clients()
    if not cl: return ""
    e = htmlmod.escape
    n = len(cl)
    # 지점이 여러 곳인 브랜드(갤러리아 · 더힐)는 붙여서 보여 주고, 나머지는 진료과목이 섞이게 흩는다
    brand = lambda c: c["slug"].split("-")[0] if c["slug"].split("-")[0] in ("galleria", "theheal") else ""
    rest = [c for c in cl if not brand(c)]
    step = next(k for k in (7, 5, 3, 1) if len(rest) % k)
    rest = [rest[(i * step) % len(rest)] for i in range(len(rest))]
    g1 = [c for c in cl if brand(c) == "galleria"]; g2 = [c for c in cl if brand(c) == "theheal"]
    k1 = max(0, (n + 1) // 2 - len(g1))
    order = g1 + rest[:k1] + g2 + rest[k1:]
    def card(c, clone=False):
        return ('<a class="logo-card" href="%s" target="_blank" rel="noopener"%s><img src="assets/img/clients/white/%s.png?v={ver}" alt="" width="150" height="52" loading="lazy" decoding="async"><span>%s</span></a>'
                % (e(c["place"], quote=True), ' aria-hidden="true" tabindex="-1"' if clone else '', c["slug"], e(c["name"])))
    def row(items, cls=""):
        return '<div class="logo-row%s"><div class="logo-track">%s%s</div></div>' % (cls, "".join(card(c) for c in items), "".join(card(c, True) for c in items))
    half = (n + 1) // 2
    stats = "".join('<li><span>%s</span><b>%d</b><i>곳</i></li>' % (e(k), v) for k, v in client_counts("sido"))
    return ('<div class="logo-marquee" aria-label="함께하고 있는 병의원">%s%s</div>\n  <div class="wrap"><ul class="client-stats" data-reveal aria-label="지역별 병의원 수">%s</ul></div>'
            % (row(order[:half]), row(order[half:], " slow"), stats)).replace("{ver}", VER)

def main():
    POSTS = load_posts_index()
    ALL_FAQ = {}
    lm_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lastmod.json")
    try: LASTMOD = json.load(open(lm_path, encoding="utf-8"))
    except Exception: LASTMOD = {}
    for page, (title, desc, keywords, h1, crumb, service) in PAGES.items():
        body = open(os.path.join(SRC, page + ".html"), encoding="utf-8").read()
        body = body.replace("{{ARROW}}", ARROW).replace("{ver}", VER)
        body = korean_h1(body, h1)
        ALL_FAQ[page] = extract_faq(body)
        jsonld = build_jsonld(page, title, desc, body, crumb, service)
        body = wrap_sentences(body)
        if page == "insights": body = inject_posts(body, POSTS)
        if "{{CLIENTS}}" in body: body = body.replace("{{CLIENTS}}", clients_html()).replace("{{CLIENT_COUNT}}", str(len(load_clients())))
        og_title = ("%s | 에이치메디솔루션" % crumb) if crumb else "에이치메디솔루션 | 마케팅 잘하는 개원 컨설턴트"
        html = render_page(page, title, desc, keywords, page_url(page), jsonld, body, robots=("noindex, follow" if page == "post" else ROBOTS_INDEX), og_title=og_title)
        # 버전 문자열 · 오늘 날짜를 뺀 내용이 그대로면 수정일을 유지한다 (sitemap lastmod · dateModified)
        sig = hashlib.sha1(html.replace(VER, "").replace(TODAY, "").encode("utf-8")).hexdigest()
        if LASTMOD.get(page, {}).get("sig") != sig: LASTMOD[page] = {"sig": sig, "date": TODAY}
        html = html.replace('"dateModified":"%s"' % TODAY, '"dateModified":"%s"' % LASTMOD[page]["date"])
        with open(os.path.join(OUT, page + ".html"), "w", encoding="utf-8") as f:
            f.write(html)
        print("wrote", page + ".html", len(html))

    # ---------- robots.txt · sitemap.xml · llms.txt ----------
    # robots.txt 는 줄 앞 빈칸을 걷어 낸다 — 네이버 Yeti 는 들여쓴 줄을 규칙으로 못 읽는다
    open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8").write(("""# 에이치메디솔루션 - 검색엔진 · AI 크롤러 모두 허용 (관리자 페이지 제외)
    User-agent: *
    Allow: /
    Disallow: /admin.html
    Disallow: /admin/

    # 네이버 · 구글 · 빙
    User-agent: Yeti
    Allow: /
    User-agent: Googlebot
    Allow: /
    User-agent: Bingbot
    Allow: /

    # AI 검색 · LLM 크롤러 (GEO / AEO)
    User-agent: GPTBot
    Allow: /
    User-agent: OAI-SearchBot
    Allow: /
    User-agent: ChatGPT-User
    Allow: /
    User-agent: ClaudeBot
    Allow: /
    User-agent: Claude-SearchBot
    Allow: /
    User-agent: anthropic-ai
    Allow: /
    User-agent: PerplexityBot
    Allow: /
    User-agent: Google-Extended
    Allow: /
    User-agent: Applebot-Extended
    Allow: /
    User-agent: CCBot
    Allow: /
    User-agent: Amazonbot
    Allow: /
    User-agent: meta-externalagent
    Allow: /

    Sitemap: %s/sitemap.xml
    """ % SITE_URL).replace("\n    ", "\n").rstrip() + "\n")

    json.dump(LASTMOD, open(lm_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    prio = {"index": "1.0", "ai": "0.9", "marketing": "0.9", "consulting": "0.9", "insights": "0.8", "contact": "0.8", "company": "0.7", "portfolio": "0.7", "post": "0.3", "privacy": "0.2", "ceo": "0.7", "case-pohang": "0.7", "case-busan": "0.7", "case-incheon": "0.7", "case-gwanggyo": "0.7", "marketing-dermatology": "0.8", "marketing-internal": "0.8", "marketing-orthopedics": "0.8"}
    urls = "".join("  <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%s</priority></url>\n" % (page_url(p), LASTMOD.get(p, {}).get("date", TODAY), "weekly" if p in ("index", "marketing", "insights") else "monthly", prio[p]) for p in PAGES if p != "post")
    urls += "".join("  <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>\n" % (post_url(p), (p.get("updated_at") or p.get("published_at") or TODAY)[:10]) for p in POSTS)
    open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls)

    def price_txt(p):
        if not p.get("price"): return "별도 문의 (병원 규모 · 예산에 맞춰 견적)"
        n = "{:,}".format(p["price"])
        if p.get("priceFrom"): return "%s원부터 (%s, VAT 별도)" % (n, p.get("priceNote", ""))
        return "월 %s원 (VAT 별도 · 최소 계약 3개월)" % n

    lines = ["# 에이치메디솔루션 (HMEDISOLUTION)", "",
      "> " + ORG["desc"], "",
      "- 슬로건: " + ORG["slogan"],
      "- 사업 영역: ① 병원 온라인 마케팅 (네이버 플레이스 · 병원 블로그 · 리뷰 운영 지원 · CPC 광고 · 당근 · 인스타그램 · Meta) ② 개원 컨설팅 · MSO (입지분석 · 개원 준비 · 진료 준비 · 오프라인 마케팅 · 개원 후 경영 · 의약품 CSO) ③ 병원 홈페이지 제작 · 숏폼 영상 제작",
      "- 검증: 프리랜서 마켓 크몽 마케팅 카테고리 Prime 전문가 (프로필: https://kmong.com/@%EC%97%90%EC%9D%B4%EC%B9%98%EB%A9%94%EB%94%94) · 평점 5.0 (109개 평가) · 총 작업 171개 · 만족도 100%",
      "- 성과 예시: 포항 정형외과 개원 첫 달 일환자 120명 (성공사례 페이지), 부산 서면 피부과 플레이스 20위→3위, 운영 병원 50+, 누적 마케팅 계약 300건+, 재계약률 97%, 평균 매출 30%+ 증가",
      "- 대표: 고한별 (010-8263-0982) · 설립 2020년 4월 15일 · 부산 지사 개설 2021년 5월 · 개원 컨설팅 시작 2023년 2월",
      "- 의료법 대응: 의료법 기준에 맞춰 콘텐츠를 제작하고 심의 대상 광고물은 의료광고 심의를 거쳐 집행합니다. 신고가 들어오면 보건소 담당 주무관과 직접 소통하며 대응하고, 필요하면 변호사 자문을 받습니다. 에이치메디솔루션이 진행한 마케팅으로 거래 병원이 행정처분이나 법적 조치를 받은 사례는 0건입니다 (2026년 11월 기준, 자체 집계, %s/marketing.html#compliance)" % SITE_URL,
      "- 현재 함께하고 있는 병의원: %d곳 (지역별 %s / 진료과목별 %s)" % (len(load_clients()), " · ".join("%s %d곳" % kv for kv in client_counts("sido")), " · ".join("%s %d곳" % (k.replace(" · ", "·"), v) for k, v in client_counts("group"))),
      "- 대표 경력: 동원그룹 전략기획(2017), KT&G 마케팅기획(2018), 크몽 네이버 플레이스 마케팅 서비스 론칭 · Prime 전문가 인증(2019), 크몽 마케팅 컨설팅 200회 이상, 탈잉 마케팅 강연 20회 이상, 크몽 온라인 마케팅 전자책 200부 이상 판매 (%s/ceo.html)" % SITE_URL,
      "- 이메일: " + ORG["email"] + " · 사업자등록번호 " + ORG["biz"],
      "- 주소: 부천 본사 경기도 부천시 소향로 13번길 28-14 403-1호 / 부산 지사 부산 부산진구 서면로 10 데시앙 2616호",
      "- 서비스 지역: 수도권 · 부산 · 경남을 중심으로 전국 병의원", "",
      "## 페이지", ""]
    for p, (t, d, *_ ) in PAGES.items():
        if p in ("post", "privacy"): continue
        lines.append("- [%s](%s): %s" % (t.split(" | ")[0], page_url(p), d))
    lines += ["", "## 병원 마케팅 프로그램 · 가격 (marketing.html)", ""]
    for p in PROGRAMS:
        lines.append("- **%s** — %s. %s 가격: %s" % (p["name"], p.get("tagline", ""), p.get("desc", ""), price_txt(p)))
    lines += ["", "## AI 마케팅 · AEO 마스터 (ai.html)", "",
      "- 병원 홈페이지와 전용 외부 칼럼 사이트를 운영하고, ChatGPT · Gemini · Claude 등 AI 검색 노출을 측정 · 개선하는 서비스",
      "- 제공 업무: 콘텐츠 제작(홈페이지 · 외부 칼럼 신규 원고 + 대표 이미지) → 발행 → 전체 SEO 월 1회 점검 → AI 측정 · 월간 보고",
      "- 월 운영 플랜(VAT 별도): Basic 150만원(콘텐츠 8건 · AI 질문 20개) / Standard 250만원(16건 · 40개) / Premium 400만원(24건 · 60개)",
      "- 초기 세팅(1회, VAT 별도): A 100만원(기존 페이지 2개 개선) / B 150만원(4개) / C 200만원(6개). 월 플랜과 자유 조합",
      "- 홈페이지 제작 옵션: 최소형 150만원 정액 / 전체형 350만원부터",
      "- 특정 순위 · 노출 · 예약 · 매출을 보장하지 않으며, 제공 범위 · 가격 · 조건은 계약 전 확정", "",
      "## 개원 컨설팅 · MSO (consulting.html)", "",
      "- 01 입지 선정: 상권 분석, 인구 · 세대 · 연령 통계, 경쟁병원 분포, 개원 입지 확보, 부동산 계약 조율",
      "- 02 개원 준비: 개원 절차 · 신고, 인테리어 · 장비 조율, 노무 · 세무 연결",
      "- 03 진료 준비: 진료 프로세스, 원내 게시자료, 의약품 · 심평원 업무",
      "- 04 오프라인 마케팅: 현수막 · 전단 · 의료광고심의, 지역 홍보",
      "- 05 온라인 마케팅: 네이버 플레이스 · 블로그 · 리뷰 · 광고 (사전마케팅부터 개원 후까지)",
      "- 06 개원 후 경영: 매출 · 활동량 관리, 월별 보고, MSO 운영 지원", "",
      "## 자주 묻는 질문", ""]
    for p in ("index", "marketing", "ai", "consulting"):
        for q, a in ALL_FAQ.get(p, []):
            lines.append("- Q. %s\n  A. %s" % (q, a))
    if POSTS:
        lines += ["", "## 인사이트 칼럼 (insights.html)", ""]
        for p in POSTS[:50]:
            lines.append("- [%s](%s)%s" % (p.get("title", ""), post_url(p), (": " + p["excerpt"]) if p.get("excerpt") else ""))
    lines += ["", "## 문의", "", "- 무료 플레이스 진단 · 개원 상담: %s/contact.html" % SITE_URL, "- 전화: 010-8263-0982 (고한별 대표 · 수도권) · 010-4435-4389 (부산 지사 · 부산 / 경남)", ""]
    open(os.path.join(OUT, "llms.txt"), "w", encoding="utf-8").write("\n".join(lines))
    print("wrote robots.txt, sitemap.xml, llms.txt")


if __name__ == "__main__":
    main()


