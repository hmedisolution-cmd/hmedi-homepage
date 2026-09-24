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
SITE_URL = "https://hmedisolution-cmd.github.io/hmedi-homepage"
SITE_NAME = "에이치메디솔루션"
VERIFY = {
  "naver-site-verification": "40b84969275516de7391b2e5b76f6ba93af65bce",   # 네이버 서치어드바이저 (기존 아임웹 설정에서 이전)
  "google-site-verification": "D22YwkbVlXo0pCYqEknLPD5Iuasn8qno40CcnwMVZf8",  # 구글 서치콘솔 (기존 아임웹 설정에서 이전)
}
VERIFY_EXTRA = ['<meta name="google-site-verification" content="Hu6dVbtX4-fJMoVhIbT6oc4QSHpVhOFqQL443lvIFlU">']  # 두 번째 구글 계정 코드
ORG = {
  "name": "에이치메디솔루션", "alt": ["HMEDISOLUTION", "H MEDI SOLUTION", "에이치메디"],
  "slogan": "마케팅 잘하는 개원 컨설턴트",
  "desc": "병원 온라인 마케팅(네이버 플레이스 · 블로그 · 영수증 리뷰 · CPC 광고)과 개원 컨설팅 · MSO(입지분석 · 개원 준비 · 오프라인 마케팅 · 병원경영)를 한 팀이 실행하는 메디컬 솔루션 회사. 부천 본사와 부산 지사에서 수도권 · 부산 · 경남을 포함한 전국 병의원을 지원합니다.",
  "tel": "+82-10-8263-0982", "tel2": "+82-10-4435-4389", "email": "hmedi@hmedisolution.com", "biz": "209-37-36004",
  "founders": ["고한별", "정대호"],
  "addr": [
    {"name": "부천 본사", "street": "소향로 13번길 28-14 403-1호", "city": "부천시", "region": "경기도", "country": "KR"},
    {"name": "부산 지사", "street": "서면로 10 데시앙 2616호", "city": "부산진구", "region": "부산광역시", "country": "KR"},
  ],
  "areas": ["대한민국", "수도권", "서울특별시", "경기도", "인천광역시", "부산광역시", "경상남도", "울산광역시"],
  "knows": ["병원 마케팅", "메디컬 마케팅", "네이버 플레이스 마케팅", "플레이스 상위노출", "병원 블로그 마케팅", "영수증 리뷰", "의료광고심의", "당근 광고", "인스타그램 광고", "Meta 광고", "개원 컨설팅", "병원 개원 준비", "상권분석", "병원 입지 선정", "병원 MSO", "병원 경영 컨설팅", "의약품 CSO", "병원 홈페이지 제작", "숏폼 영상 제작"],
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
  <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
  <meta name="author" content="에이치메디솔루션">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="에이치메디솔루션">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:url" content="{canonical}">
  <meta property="og:title" content="{og_title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:image" content="{site}/assets/img/og.jpg?v={ver}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="에이치메디솔루션 - 병원 마케팅 · 개원 컨설팅 · MSO">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{og_title}">
  <meta name="twitter:description" content="{desc}">
  <meta name="twitter:image" content="{site}/assets/img/og.jpg?v={ver}">
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
    <a class="brand" href="index.html" aria-label="에이치메디솔루션 홈">
      <img class="logo-dark" src="assets/img/logo.png" alt="에이치메디솔루션 HMEDISOLUTION">
      <img class="logo-light" src="assets/img/logo-white.png" alt="에이치메디솔루션 HMEDISOLUTION">
    </a>
    <nav class="site-nav" aria-label="주요 메뉴">
      <a href="company.html" data-nav="company">회사소개</a>
      <a href="marketing.html" data-nav="marketing">온라인 마케팅</a>
      <a href="consulting.html" data-nav="consulting">개원 컨설팅</a>
      <a href="portfolio.html" data-nav="portfolio">성공사례</a>
      <a href="contact.html" data-nav="contact">문의하기</a>
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
      <a href="index.html" data-nav="home"><small>01</small>메인</a>
      <a href="company.html" data-nav="company"><small>02</small>회사소개</a>
      <a href="marketing.html" data-nav="marketing"><small>03</small>온라인 마케팅</a>
      <a href="consulting.html" data-nav="consulting"><small>04</small>개원 컨설팅 · MSO</a>
      <a href="portfolio.html" data-nav="portfolio"><small>05</small>성공사례 · 포트폴리오</a>
      <a href="contact.html" data-nav="contact"><small>06</small>문의하기</a>
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
        <p>에이치메디솔루션 · 대표 고한별 · 정대호<br>사업자등록번호 209-37-36004<br>부천 본사 · 경기도 부천시 소향로 13번길 28-14 403-1호<br>부산 지사 · 부산진구 서면로 10 데시앙 2616호</p>
      </div>
      <div>
        <h5>Menu</h5>
        <ul>
          <li><a href="company.html">회사소개</a></li>
          <li><a href="marketing.html">온라인 마케팅</a></li>
          <li><a href="consulting.html">개원 컨설팅 · MSO</a></li>
          <li><a href="portfolio.html">성공사례 · 포트폴리오</a></li>
          <li><a href="contact.html">문의하기</a></li>
        </ul>
      </div>
      <div>
        <h5>Service</h5>
        <ul>
          <li><a href="marketing.html#program-standard">마케팅 프로그램 Standard</a></li>
          <li><a href="marketing.html#program-ai">AI 실속 패키지</a></li>
          <li><a href="consulting.html#roadmap">개원 로드맵</a></li>
          <li><a href="consulting.html#allinone">ALL IN ONE 체크리스트</a></li>
          <li><a href="assets/docs/hmedisolution-company-profile.pdf" target="_blank" rel="noopener">회사소개서 다운로드</a></li>
        </ul>
      </div>
      <div class="foot-contact">
        <h5>Contact</h5>
        <b>010-8263-0982</b><span>고한별 대표 · 수도권</span>
        <b>010-4435-4389</b><span>정대호 대표 · 부산 / 경남</span>
        <b style="font-size:16px">hmedi@hmedisolution.com</b>
        <a class="foot-kakao" href="https://pf.kakao.com/_xmhxgvb" target="_blank" rel="noopener">카카오톡 채널 상담 →</a>
      </div>
    </div>
    <div class="foot-bottom">
      <span>© <span id="year">2026</span> HMEDISOLUTION. All rights reserved.</span>
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
            "병원 온라인 마케팅과 개원 컨설팅·MSO를 한 팀이 실행합니다. 네이버 플레이스 상위노출, 병원 블로그, 영수증 리뷰, 입지분석부터 개원 준비, 개원 후 병원경영까지. 부천 본사 · 부산 지사, 전국 병의원 지원.",
            "병원 마케팅, 개원 마케팅, 병원 개원 마케팅, 병원 온라인 마케팅, 개원 컨설팅, 병원 MSO, 네이버 플레이스 마케팅, 플레이스 상위노출, 병원 블로그 마케팅, 병원 바이럴 마케팅, 병원 브랜딩, 피부과 마케팅, 정형외과 마케팅, 메디컬 마케팅, 개원 준비, 상권분석, 에이치메디솔루션",
            None, None, None),
  "company": ("회사소개 | 병원 마케팅 · 개원 컨설팅 전문 에이치메디솔루션",
              "에이치메디솔루션은 온라인 마케팅 회사로 출발해 입지분석, 부동산 계약, 온·오프라인 마케팅, 개원 절차, 병원경영까지 ALL IN ONE으로 운영하는 메디컬 솔루션 회사입니다. 크몽 마케팅 카테고리 Prime 전문가.",
              "에이치메디솔루션, 병원 마케팅 회사, 개원 컨설팅 회사, 병원 MSO, 메디컬 마케팅 대행사, 부천 병원 마케팅, 부산 병원 마케팅",
              "병원 마케팅 · 개원 컨설팅 전문 메디컬 솔루션 회사", "회사소개", None),
  "marketing": ("병원 마케팅 프로그램 · 네이버 플레이스 마케팅 | 에이치메디솔루션",
                "네이버 플레이스 로직 기반 병원 마케팅 프로그램. Standard(월 150만원), Premium(월 180만원), AI 실속 패키지(월 99만원)와 홈페이지 제작, 숏폼 영상, 당근·인스타그램·Meta 광고 대행. 크몽 Prime 전문가, 만족도 100%.",
                "병원 마케팅, 병원 온라인 마케팅, 네이버 플레이스 마케팅, 플레이스 상위노출, 병원 블로그 마케팅, 병원 바이럴 마케팅, 피부과 마케팅, 정형외과 마케팅, 영수증 리뷰, 병원 마케팅 비용, 병원 마케팅 대행, 병원 홈페이지 제작, 병원 숏폼, 당근 광고 대행, 의료광고심의",
                "네이버 플레이스 기반 병원 마케팅 프로그램", "온라인 마케팅", "병원 온라인 마케팅"),
  "consulting": ("개원 컨설팅 · 병원 MSO | 마케팅 잘하는 개원 컨설턴트 에이치메디솔루션",
                 "상권분석과 입지 선정, 개원 준비, 진료 준비, 오프라인 마케팅, 개원 후 경영까지 ALL IN ONE 개원 컨설팅. 마케팅 전문성을 갖춘 개원 컨설턴트와 MSO 서비스. 크몽 Prime 전문가가 마케팅까지 직접 실행합니다.",
                 "개원 컨설팅, 개원 마케팅, 병원 개원 마케팅, 피부과 개원 마케팅, 병원 개원 준비, 병원 MSO, 상권분석, 병원 입지 선정, 개원 절차, 병원 경영 컨설팅, 의약품 CSO, 개원 컨설팅 비용, 부산 개원 컨설팅, 수도권 개원 컨설팅",
                 "마케팅 잘하는 개원 컨설팅 · 병원 MSO", "개원 컨설팅 · MSO", "병원 개원 컨설팅 · MSO"),
  "portfolio": ("병원 마케팅 · 개원 컨설팅 성공사례 | 에이치메디솔루션",
                "포항 정형외과 개원 컨설팅(개원 첫 달 일환자 120명), 부산 H피부과 플레이스 20위→3위, 인천 S외과, 광교 G피부과 등 병원 마케팅과 개원 컨설팅 성공사례 · 포트폴리오.",
                "병원 마케팅 성공사례, 개원 컨설팅 사례, 플레이스 상위노출 사례, 병원 마케팅 포트폴리오, 정형외과 개원, 피부과 마케팅",
                "병원 마케팅 · 개원 컨설팅 성공사례", "성공사례 · 포트폴리오", None),
  "contact": ("병원 마케팅 무료 진단 · 개원 상담 신청 | 에이치메디솔루션",
              "네이버 플레이스 무료 진단과 개원 컨설팅 상담 신청. 수도권 010-8263-0982(고한별 대표), 부산·경남 010-4435-4389(정대호 대표). 병원 상황에 맞는 프로그램만 제안해 드립니다.",
              "병원 마케팅 상담, 플레이스 무료 진단, 개원 상담, 병원 마케팅 문의, 개원 컨설팅 문의, 에이치메디솔루션 연락처",
              "병원 마케팅 무료 진단 · 개원 컨설팅 상담 신청", "문의하기", None),
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

import json, html as htmlmod, subprocess, datetime

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
      "founder": [{"@type": "Person", "name": n} for n in ORG["founders"]],
      "address": [{"@type": "PostalAddress", "name": a["name"], "streetAddress": a["street"], "addressLocality": a["city"], "addressRegion": a["region"], "addressCountry": a["country"]} for a in ORG["addr"]],
      "areaServed": ORG["areas"], "knowsAbout": ORG["knows"],
      "contactPoint": [
        {"@type": "ContactPoint", "telephone": ORG["tel"], "contactType": "sales", "name": "고한별 대표 · 수도권", "areaServed": "KR", "availableLanguage": "ko"},
        {"@type": "ContactPoint", "telephone": ORG["tel2"], "contactType": "sales", "name": "정대호 대표 · 부산 / 경남", "areaServed": "KR", "availableLanguage": "ko"},
      ],
      "sameAs": ["https://pf.kakao.com/_xmhxgvb"],
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
    if crumb: crumbs.append({"@type": "ListItem", "position": 2, "name": crumb, "item": url})
    web["breadcrumb"] = {"@id": url + "#breadcrumb"}
    graph.append(web); graph.append({"@type": "BreadcrumbList", "@id": url + "#breadcrumb", "itemListElement": crumbs})
    if service:
        sv = {"@type": "Service", "@id": url + "#service", "name": service, "serviceType": service, "provider": {"@id": SITE_URL + "/#org"}, "areaServed": ORG["areas"], "url": url, "description": desc}
        if page == "marketing" and PROGRAMS: sv["hasOfferCatalog"] = offers_ld(PROGRAMS)
        graph.append(sv)
    faq = extract_faq(body)
    if faq:
        graph.append({"@type": "FAQPage", "@id": url + "#faq", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]})
    return json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False, separators=(",", ":"))

def korean_h1(body, h1):
    """페이지 히어로: 영문 장식 제목은 <p>로, 한국어 키워드 제목을 실제 <h1>으로."""
    if not h1: return body
    return re.sub(r'<h1 class="title-en split">(.*?)</h1>', lambda m: '<p class="title-en split" aria-hidden="true">%s</p>\n    <h1 class="ph-h1">%s</h1>' % (m.group(1), h1), body, count=1, flags=re.S)

ALL_FAQ = {}
for page, (title, desc, keywords, h1, crumb, service) in PAGES.items():
    body = open(os.path.join(SRC, page + ".html"), encoding="utf-8").read()
    body = body.replace("{{ARROW}}", ARROW).replace("{ver}", VER)
    body = korean_h1(body, h1)
    ALL_FAQ[page] = extract_faq(body)
    jsonld = build_jsonld(page, title, desc, body, crumb, service)
    body = wrap_sentences(body)
    verify = "".join('  <meta name="%s" content="%s">\n' % (k, v) for k, v in VERIFY.items() if v) + "".join("  %s\n" % x for x in VERIFY_EXTRA)
    og_title = ("%s | 에이치메디솔루션" % crumb) if crumb else "에이치메디솔루션 | 마케팅 잘하는 개원 컨설턴트"
    html = HEAD.format(title=title, desc=desc, keywords=keywords, canonical=page_url(page), site=SITE_URL, verify=verify, jsonld=jsonld, page=page, ver=VER, og_title=og_title) + wrap_sentences(HEADER) + '<main id="top">\n' + body + '\n</main>\n' + wrap_sentences(FOOTER).replace('{ver}', VER)
    with open(os.path.join(OUT, page + ".html"), "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", page + ".html", len(html))

# ---------- robots.txt · sitemap.xml · llms.txt ----------
open(os.path.join(OUT, "robots.txt"), "w", encoding="utf-8").write("""# 에이치메디솔루션 - 검색엔진 · AI 크롤러 모두 허용 (관리자 페이지 제외)
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
""" % SITE_URL)

prio = {"index": "1.0", "marketing": "0.9", "consulting": "0.9", "contact": "0.8", "company": "0.7", "portfolio": "0.7"}
urls = "".join("  <url><loc>%s</loc><lastmod>%s</lastmod><changefreq>%s</changefreq><priority>%s</priority></url>\n" % (page_url(p), TODAY, "weekly" if p in ("index", "marketing") else "monthly", prio[p]) for p in PAGES)
open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n%s</urlset>\n' % urls)

def price_txt(p):
    if not p.get("price"): return "별도 문의 (병원 규모 · 예산에 맞춰 견적)"
    n = "{:,}".format(p["price"])
    if p.get("priceFrom"): return "%s원부터 (%s, VAT 별도)" % (n, p.get("priceNote", ""))
    return "월 %s원 (VAT 별도 · 최소 계약 3개월)" % n

lines = ["# 에이치메디솔루션 (HMEDISOLUTION)", "",
  "> " + ORG["desc"], "",
  "- 슬로건: " + ORG["slogan"],
  "- 사업 영역: ① 병원 온라인 마케팅 (네이버 플레이스 · 병원 블로그 · 영수증 리뷰 · CPC 광고 · 당근 · 인스타그램 · Meta) ② 개원 컨설팅 · MSO (입지분석 · 개원 준비 · 진료 준비 · 오프라인 마케팅 · 개원 후 경영 · 의약품 CSO) ③ 병원 홈페이지 제작 · 숏폼 영상 제작",
  "- 검증: 프리랜서 마켓 크몽 마케팅 카테고리 Prime 전문가 · 평점 5.0 (109개 평가) · 총 작업 171개 · 만족도 100%",
  "- 성과 예시: 포항 정형외과 개원 첫 달 일환자 120명 (성공사례 페이지), 부산 서면 피부과 플레이스 20위→3위, 운영 병원 50+, 누적 마케팅 계약 300건+, 재계약률 97%, 평균 매출 30%+ 증가",
  "- 대표: 고한별 (수도권, 010-8263-0982), 정대호 (부산 · 경남, 010-4435-4389)",
  "- 이메일: " + ORG["email"] + " · 사업자등록번호 " + ORG["biz"],
  "- 주소: 부천 본사 경기도 부천시 소향로 13번길 28-14 403-1호 / 부산 지사 부산 부산진구 서면로 10 데시앙 2616호",
  "- 서비스 지역: 수도권 · 부산 · 경남을 중심으로 전국 병의원", "",
  "## 페이지", ""]
for p, (t, d, *_ ) in PAGES.items():
    lines.append("- [%s](%s): %s" % (t.split(" | ")[0], page_url(p), d))
lines += ["", "## 병원 마케팅 프로그램 · 가격 (marketing.html)", ""]
for p in PROGRAMS:
    lines.append("- **%s** — %s. %s 가격: %s" % (p["name"], p.get("tagline", ""), p.get("desc", ""), price_txt(p)))
lines += ["", "## 개원 컨설팅 · MSO (consulting.html)", "",
  "- 01 입지 선정: 상권 분석, 인구 · 세대 · 연령 통계, 경쟁병원 분포, 개원 입지 확보, 부동산 계약 조율",
  "- 02 개원 준비: 개원 절차 · 신고, 인테리어 · 장비 조율, 노무 · 세무 연결",
  "- 03 진료 준비: 진료 프로세스, 원내 게시자료, 의약품 · 심평원 업무",
  "- 04 오프라인 마케팅: 현수막 · 전단 · 의료광고심의, 지역 홍보",
  "- 05 온라인 마케팅: 네이버 플레이스 · 블로그 · 리뷰 · 광고 (사전마케팅부터 개원 후까지)",
  "- 06 개원 후 경영: 매출 · 활동량 관리, 월별 보고, MSO 운영 지원", "",
  "## 자주 묻는 질문", ""]
for p in ("index", "marketing", "consulting"):
    for q, a in ALL_FAQ.get(p, []):
        lines.append("- Q. %s\n  A. %s" % (q, a))
lines += ["", "## 문의", "", "- 무료 플레이스 진단 · 개원 상담: %s/contact.html" % SITE_URL, "- 전화: 010-8263-0982 (수도권) · 010-4435-4389 (부산 · 경남)", ""]
open(os.path.join(OUT, "llms.txt"), "w", encoding="utf-8").write("\n".join(lines))
print("wrote robots.txt, sitemap.xml, llms.txt")
