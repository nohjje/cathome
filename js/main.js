/* ===========================
   main.js - 메인 페이지 인터랙션
=========================== */

/* ===========================
   DOMContentLoaded 초기화
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
  initCategoryTabs();
  initRankingAccordion();
  initScrollEvents();
  initFadeIn();
});

/* ===========================
   히어로 슬라이더
=========================== */
function initHeroSlider() {
  const track = document.querySelector('.slider-track');
  const items = document.querySelectorAll('.slider-item');
  const prevBtn = document.querySelector('.slider-btn--prev');
  const nextBtn = document.querySelector('.slider-btn--next');
  const counterEl = document.querySelector('.slider-counter');

  if (!track || items.length === 0) return;

  let current = 0;
  const total = items.length;
  let autoTimer = null;
  let isDragging = false;
  let startX = 0;
  let dragThreshold = 50;

  // 슬라이드 이동
  function goTo(index) {
    // 범위 순환 처리
    if (index < 0) index = total - 1;
    if (index >= total) index = 0;
    current = index;
    track.style.transform = `translateX(-${current * 100}%)`;
    if (counterEl) counterEl.textContent = `${current + 1} / ${total}`;
  }

  // 자동 슬라이드 (4초)
  function startAuto() {
    stopAuto();
    autoTimer = setInterval(() => goTo(current + 1), 4000);
  }

  function stopAuto() {
    if (autoTimer) clearInterval(autoTimer);
  }

  // 버튼 클릭
  if (prevBtn) prevBtn.addEventListener('click', () => { goTo(current - 1); startAuto(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { goTo(current + 1); startAuto(); });

  // 터치/드래그 스와이프
  const sliderEl = document.querySelector('.hero-slider');

  function onDragStart(e) {
    isDragging = true;
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    stopAuto();
  }

  function onDragEnd(e) {
    if (!isDragging) return;
    isDragging = false;
    const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const diff = startX - endX;

    if (Math.abs(diff) > dragThreshold) {
      goTo(diff > 0 ? current + 1 : current - 1);
    }
    startAuto();
  }

  if (sliderEl) {
    sliderEl.addEventListener('mousedown', onDragStart);
    sliderEl.addEventListener('mouseup', onDragEnd);
    sliderEl.addEventListener('touchstart', onDragStart, { passive: true });
    sliderEl.addEventListener('touchend', onDragEnd);
  }

  // 초기화
  goTo(0);
  startAuto();
}

/* ===========================
   카테고리 탭
=========================== */
function initCategoryTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const grids = document.querySelectorAll('.category-grid');

  if (tabBtns.length === 0) return;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 활성 탭 변경
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // 해당 그리드 표시
      const target = btn.dataset.tab;
      grids.forEach(grid => {
        grid.classList.remove('active');
        if (grid.dataset.grid === target) {
          grid.classList.add('active');
        }
      });
    });
  });
}

/* ===========================
   나캣랭킹 어코디언
=========================== */
function initRankingAccordion() {
  const headers = document.querySelectorAll('.ranking-item__header');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.ranking-item');
      const isOpen = item.classList.contains('open');

      // 다른 항목 닫기
      document.querySelectorAll('.ranking-item').forEach(el => el.classList.remove('open'));

      // 클릭한 항목 토글
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ===========================
   스크롤 이벤트
=========================== */
function initScrollEvents() {
  const header = document.querySelector('.header');
  const scrollTopBtn = document.querySelector('.scroll-top-btn');

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // 헤더 shadow 처리
    if (header) {
      header.classList.toggle('scrolled', scrollY > 0);
    }

    // 상단 스크롤 버튼 표시 (300px 이후)
    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle('visible', scrollY > 300);
    }
  }, { passive: true });

  // 상단으로 스크롤
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ===========================
   섹션 fadeIn 애니메이션
=========================== */
function initFadeIn() {
  const targets = document.querySelectorAll('.fade-in');
  if (targets.length === 0) return;

  // IntersectionObserver로 뷰포트 진입 감지
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // 한 번만 실행
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(el => observer.observe(el));
}
