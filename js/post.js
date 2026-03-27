/* ===========================
   post.js - 게시글 상세보기 로직
=========================== */

// ===========================
// 초기화
// ===========================
document.addEventListener('DOMContentLoaded', async () => {
  const postId = getPostId();
  if (!postId) {
    alert('잘못된 접근입니다.');
    window.location.href = 'board.html';
    return;
  }

  const post = await loadPost(postId);
  if (!post) return;

  renderPost(post);
  await incrementViews(postId, post.views);

  // 세션 확인
  const { data: { session } } = await supabaseClient.auth.getSession();

  // 본인 글 여부 → 수정/삭제 버튼 표시
  if (session?.user?.id === post.user_id) {
    document.getElementById('postActions').style.display = 'flex';
    initEditDelete(postId, post);
  }

  // 댓글 초기화
  await loadComments(postId);
  initCommentForm(postId, session);
});

// ===========================
// URL에서 게시글 ID 추출
// ===========================
function getPostId() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));
  return isNaN(id) ? null : id;
}

// ===========================
// 게시글 불러오기
// ===========================
async function loadPost(postId) {
  const { data, error } = await supabaseClient
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  document.getElementById('postLoading').style.display = 'none';

  if (error || !data) {
    document.getElementById('postLoading').textContent = '게시글을 찾을 수 없습니다.';
    document.getElementById('postLoading').style.display = 'block';
    return null;
  }

  return data;
}

// ===========================
// 게시글 렌더링
// ===========================
function renderPost(post) {
  document.title = `${post.title} - CATHOME`;

  document.getElementById('postTitle').textContent = post.title;
  document.getElementById('postAuthor').textContent = post.author_name;
  document.getElementById('postViews').textContent = (post.views ?? 0).toLocaleString();
  document.getElementById('postContent').textContent = post.content;

  // 날짜
  const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '');
  document.getElementById('postDate').textContent = date;

  // 이미지
  if (post.image_url) {
    document.getElementById('postImage').src = post.image_url;
    document.getElementById('postImageWrap').style.display = 'block';
  }

  document.getElementById('postArticle').style.display = 'block';
}

// ===========================
// 조회수 증가
// ===========================
async function incrementViews(postId, currentViews) {
  await supabaseClient
    .from('posts')
    .update({ views: (currentViews ?? 0) + 1 })
    .eq('id', postId);
}

// ===========================
// 수정 / 삭제
// ===========================
function initEditDelete(postId, post) {
  // 수정 → 글쓰기 페이지로 이동 (쿼리스트링으로 ID 전달)
  document.getElementById('postEditBtn').addEventListener('click', () => {
    window.location.href = `write.html?edit=${postId}`;
  });

  // 삭제
  document.getElementById('postDeleteBtn').addEventListener('click', async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;

    // 이미지가 있으면 Storage에서도 삭제
    if (post.image_url) {
      const fileName = post.image_url.split('/').pop();
      await supabaseClient.storage.from('post-images').remove([fileName]);
    }

    const { error } = await supabaseClient
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) {
      alert('삭제에 실패했습니다.');
      return;
    }

    window.location.href = 'board.html';
  });
}

// ===========================
// 댓글 목록 불러오기
// ===========================
async function loadComments(postId) {
  const { data, error } = await supabaseClient
    .from('comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('댓글 불러오기 실패:', error);
    return;
  }

  renderComments(data);
}

// ===========================
// 댓글 렌더링
// ===========================
function renderComments(comments) {
  const list = document.getElementById('commentList');
  const countEl = document.getElementById('commentCount');

  countEl.textContent = comments.length;

  if (comments.length === 0) {
    list.innerHTML = '<li class="comment-empty">첫 번째 댓글을 남겨보세요!</li>';
    return;
  }

  // 현재 로그인 유저 ID (삭제 버튼 표시용)
  supabaseClient.auth.getSession().then(({ data: { session } }) => {
    list.innerHTML = comments.map(c => {
      const date = new Date(c.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric', month: '2-digit', day: '2-digit'
      }).replace(/\. /g, '-').replace('.', '');

      const isOwner = session?.user?.id === c.user_id;
      const deleteBtn = isOwner
        ? `<button class="comment-item__delete" data-id="${c.id}">삭제</button>`
        : '';

      return `
        <li class="comment-item">
          <div class="comment-item__header">
            <span class="comment-item__author">${escapeHtml(c.author_name)}</span>
            <div class="comment-item__meta">
              <span class="comment-item__date">${date}</span>
              ${deleteBtn}
            </div>
          </div>
          <p class="comment-item__content">${escapeHtml(c.content)}</p>
        </li>`;
    }).join('');

    // 삭제 버튼 이벤트
    list.querySelectorAll('.comment-item__delete').forEach(btn => {
      btn.addEventListener('click', () => deleteComment(Number(btn.dataset.id), getPostId()));
    });
  });
}

// ===========================
// 댓글 작성 폼 초기화
// ===========================
function initCommentForm(postId, session) {
  if (session) {
    document.getElementById('commentFormWrap').style.display = 'block';
  } else {
    document.getElementById('commentLoginMsg').style.display = 'block';
    return;
  }

  const form = document.getElementById('commentForm');
  const input = document.getElementById('commentInput');
  const submitBtn = document.getElementById('commentSubmitBtn');

  form.addEventListener('submit', async () => {
    const content = input.value.trim();
    if (!content) return;

    submitBtn.classList.add('loading');
    submitBtn.textContent = '등록 중';

    const authorName = session.user.email.split('@')[0];

    const { error } = await supabaseClient.from('comments').insert({
      post_id: postId,
      content,
      author_name: authorName,
      user_id: session.user.id,
    });

    submitBtn.classList.remove('loading');
    submitBtn.textContent = '등록';

    if (error) {
      alert('댓글 등록에 실패했습니다.');
      return;
    }

    input.value = '';
    await loadComments(postId);
  });
}

// ===========================
// 댓글 삭제
// ===========================
async function deleteComment(commentId, postId) {
  if (!confirm('댓글을 삭제하시겠습니까?')) return;

  const { error } = await supabaseClient
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    alert('삭제에 실패했습니다.');
    return;
  }

  await loadComments(postId);
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
