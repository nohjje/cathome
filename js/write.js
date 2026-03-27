/* ===========================
   write.js - 글쓰기 로직
=========================== */

let selectedImageFile = null;

// ===========================
// 초기화
// ===========================
document.addEventListener('DOMContentLoaded', async () => {
  // 비로그인 차단
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    alert('로그인 후 이용할 수 있습니다.');
    window.location.href = 'login.html';
    return;
  }

  initImageUpload();

  // 수정 모드 여부 확인
  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');

  if (editId) {
    await initEditMode(parseInt(editId), session);
  } else {
    initWriteForm(session);
  }
});

// ===========================
// 이미지 업로드 UI
// ===========================
function initImageUpload() {
  const uploadBtn = document.getElementById('imageUploadBtn');
  const imageInput = document.getElementById('imageInput');
  const previewWrap = document.getElementById('imagePreviewWrap');
  const preview = document.getElementById('imagePreview');
  const removeBtn = document.getElementById('imageRemoveBtn');

  // 버튼 클릭 → 파일 선택
  uploadBtn.addEventListener('click', () => imageInput.click());

  // 파일 선택 시 미리보기
  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;

    selectedImageFile = file;
    const url = URL.createObjectURL(file);
    preview.src = url;
    previewWrap.style.display = 'block';
    uploadBtn.style.display = 'none';
  });

  // 이미지 제거
  removeBtn.addEventListener('click', () => {
    selectedImageFile = null;
    imageInput.value = '';
    preview.src = '';
    previewWrap.style.display = 'none';
    uploadBtn.style.display = 'flex';
  });
}

// ===========================
// 글 등록
// ===========================
function initWriteForm(session) {
  const form = document.getElementById('writeForm');
  const submitBtn = document.getElementById('writeSubmitBtn');

  form.addEventListener('submit', async () => {
    const title = document.getElementById('writeTitle').value.trim();
    const content = document.getElementById('writeContent').value.trim();

    if (!title) { alert('제목을 입력해주세요.'); return; }
    if (!content) { alert('내용을 입력해주세요.'); return; }

    submitBtn.classList.add('loading');
    submitBtn.textContent = '등록 중...';

    // 이미지 업로드 (있을 경우)
    let imageUrl = null;
    if (selectedImageFile) {
      imageUrl = await uploadImage(selectedImageFile, session.user.id);
      if (!imageUrl) {
        submitBtn.classList.remove('loading');
        submitBtn.textContent = '등록';
        return;
      }
    }

    // 작성자명: 이메일 앞자리
    const authorName = session.user.email.split('@')[0];

    // posts 테이블에 삽입
    const { error } = await supabaseClient.from('posts').insert({
      title,
      content,
      author_name: authorName,
      user_id: session.user.id,
      image_url: imageUrl,
    });

    if (error) {
      alert('글 등록에 실패했습니다. 다시 시도해주세요.');
      console.error(error);
      submitBtn.classList.remove('loading');
      submitBtn.textContent = '등록';
      return;
    }

    // 성공 → 게시판으로 이동
    window.location.href = 'board.html';
  });
}

// ===========================
// 수정 모드 초기화
// ===========================
async function initEditMode(postId, session) {
  const { data: post, error } = await supabaseClient
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !post || post.user_id !== session.user.id) {
    alert('수정 권한이 없습니다.');
    window.location.href = 'board.html';
    return;
  }

  // 기존 내용 채우기
  document.getElementById('writeTitle').value = post.title;
  document.getElementById('writeContent').value = post.content;

  // 기존 이미지 미리보기
  if (post.image_url) {
    document.getElementById('imagePreview').src = post.image_url;
    document.getElementById('imagePreviewWrap').style.display = 'block';
    document.getElementById('imageUploadBtn').style.display = 'none';
  }

  // 버튼 텍스트 변경
  document.querySelector('h1').textContent = '글 수정';
  document.getElementById('writeSubmitBtn').textContent = '수정 완료';

  // 수정 제출
  const form = document.getElementById('writeForm');
  const submitBtn = document.getElementById('writeSubmitBtn');

  form.addEventListener('submit', async () => {
    const title = document.getElementById('writeTitle').value.trim();
    const content = document.getElementById('writeContent').value.trim();

    if (!title) { alert('제목을 입력해주세요.'); return; }
    if (!content) { alert('내용을 입력해주세요.'); return; }

    submitBtn.classList.add('loading');
    submitBtn.textContent = '수정 중...';

    let imageUrl = post.image_url;

    // 새 이미지 선택 시 업로드
    if (selectedImageFile) {
      // 기존 이미지 삭제
      if (post.image_url) {
        const oldFileName = post.image_url.split('/').pop();
        await supabaseClient.storage.from('post-images').remove([oldFileName]);
      }
      imageUrl = await uploadImage(selectedImageFile, session.user.id);
    }

    // 이미지 제거 시 (미리보기 없고 selectedImageFile도 없으면)
    const previewWrap = document.getElementById('imagePreviewWrap');
    if (previewWrap.style.display === 'none' && !selectedImageFile && post.image_url) {
      const oldFileName = post.image_url.split('/').pop();
      await supabaseClient.storage.from('post-images').remove([oldFileName]);
      imageUrl = null;
    }

    const { error } = await supabaseClient
      .from('posts')
      .update({ title, content, image_url: imageUrl })
      .eq('id', postId);

    if (error) {
      alert('수정에 실패했습니다.');
      submitBtn.classList.remove('loading');
      submitBtn.textContent = '수정 완료';
      return;
    }

    window.location.href = `post.html?id=${postId}`;
  });
}

// ===========================
// Supabase Storage 이미지 업로드
// ===========================
async function uploadImage(file, userId) {
  // 파일명: userId_타임스탬프.확장자
  const ext = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${ext}`;

  const { error } = await supabaseClient.storage
    .from('post-images')
    .upload(fileName, file, { upsert: false });

  if (error) {
    alert('이미지 업로드에 실패했습니다.');
    console.error(error);
    return null;
  }

  // Public URL 반환
  const { data } = supabaseClient.storage
    .from('post-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
