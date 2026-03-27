/* ===========================
   board.js - 게시판 목록 로직
=========================== */

const PAGE_SIZE = 10; // 페이지당 글 수
let currentPage = 1;
let currentKeyword = '';

// ===========================
// 초기화
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  loadPosts();
  initSearch();
  initWriteBtn();
});

// ===========================
// 글 목록 불러오기
// ===========================
async function loadPosts(page = 1, keyword = '') {
  currentPage = page;
  currentKeyword = keyword;

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabaseClient
    .from('posts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  // 제목 검색
  if (keyword) {
    query = query.ilike('title', `%${keyword}%`);
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('게시글 불러오기 실패:', error);
    return;
  }

  renderPostList(data, count);
  renderPagination(count, page);
}

// ===========================
// 글 목록 렌더링
// ===========================
function renderPostList(posts, total) {
  const tbody = document.getElementById('postList');
  const countEl = document.getElementById('postCount');

  countEl.textContent = total ?? 0;

  if (!posts || posts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding:40px; color:var(--color-text-light);">
          등록된 게시글이 없습니다.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = posts.map(post => {
    const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).replace(/\. /g, '-').replace('.', '');

    const imgIcon = post.image_url
      ? `<span class="img-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </span>`
      : '';

    return `
      <tr>
        <td>${post.id}</td>
        <td class="col-title">
          <a href="post.html?id=${post.id}" class="post-title-link">
            ${escapeHtml(post.title)}${imgIcon}
          </a>
        </td>
        <td>${escapeHtml(post.author_name)}</td>
        <td>${date}</td>
        <td>${(post.views ?? 0).toLocaleString()}</td>
      </tr>`;
  }).join('');
}

// ===========================
// 페이지네이션 렌더링
// ===========================
function renderPagination(total, currentPage) {
  const pagination = document.querySelector('.board-pagination');
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  // 최대 5개 페이지 버튼 표시
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);

  let html = `<button class="page-btn arrow" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">‹</button>`;

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  html += `<button class="page-btn arrow" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">›</button>`;

  pagination.innerHTML = html;

  // 페이지 버튼 이벤트
  pagination.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      loadPosts(Number(btn.dataset.page), currentKeyword);
    });
  });
}

// ===========================
// 검색
// ===========================
function initSearch() {
  const form = document.querySelector('.board-search-form');
  const input = document.getElementById('searchInput');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    loadPosts(1, input.value.trim());
  });
}

// ===========================
// 글쓰기 버튼 - 비로그인 시 로그인 페이지로
// ===========================
async function initWriteBtn() {
  const writeBtn = document.querySelector('.write-btn');
  if (!writeBtn) return;

  writeBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
      alert('로그인 후 글을 작성할 수 있습니다.');
      window.location.href = 'login.html';
      return;
    }
    window.location.href = 'write.html';
  });
}

// ===========================
// XSS 방지 이스케이프
// ===========================
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
