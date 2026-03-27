/* ===========================
   Auth JS - 로그인/회원가입 로직
=========================== */

// ===========================
// 탭 전환
// ===========================

const tabs = document.querySelectorAll('.auth-tab');
const panels = document.querySelectorAll('.auth-panel');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    // 탭 활성화
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // 패널 전환
    panels.forEach(p => p.classList.remove('active'));
    document.getElementById(target === 'login' ? 'loginPanel' : 'signupPanel').classList.add('active');

    // 알림 초기화
    hideAlert();
  });
});

// 하단 링크로 탭 전환
document.getElementById('goSignup')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('[data-tab="signup"]').click();
});

document.getElementById('goLogin')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelector('[data-tab="login"]').click();
});

// ===========================
// 알림 메시지
// ===========================

const authAlert = document.getElementById('authAlert');

// 알림 표시
function showAlert(message, type = 'error') {
  authAlert.textContent = message;
  authAlert.className = `auth-alert ${type}`;
}

// 알림 숨기기
function hideAlert() {
  authAlert.className = 'auth-alert';
  authAlert.textContent = '';
}

// ===========================
// 유효성 검사
// ===========================

// 에러 상태 표시
function setError(input, show) {
  const group = input.closest('.form-group');
  if (show) {
    group.classList.add('has-error');
    input.classList.add('error');
  } else {
    group.classList.remove('has-error');
    input.classList.remove('error');
  }
}

// 이메일 형식 검사
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===========================
// 로그인
// ===========================

document.getElementById('loginForm')?.addEventListener('submit', async () => {
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  let valid = true;

  hideAlert();

  // 이메일 검사
  if (!isValidEmail(email.value.trim())) {
    setError(email, true);
    valid = false;
  } else {
    setError(email, false);
  }

  // 비밀번호 검사
  if (!password.value) {
    setError(password, true);
    valid = false;
  } else {
    setError(password, false);
  }

  if (!valid) return;

  // 로딩 상태
  const btn = document.getElementById('loginBtn');
  btn.classList.add('loading');
  btn.textContent = '로그인 중...';

  // Supabase 로그인
  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value,
  });

  btn.classList.remove('loading');
  btn.textContent = '로그인';

  if (error) {
    showAlert('이메일 또는 비밀번호가 올바르지 않습니다.');
    return;
  }

  // 로그인 성공 → 메인으로 이동
  showAlert('로그인 성공! 이동 중...', 'success');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
});

// ===========================
// 회원가입
// ===========================

document.getElementById('signupForm')?.addEventListener('submit', async () => {
  const email = document.getElementById('signupEmail');
  const password = document.getElementById('signupPassword');
  const passwordConfirm = document.getElementById('signupPasswordConfirm');
  let valid = true;

  hideAlert();

  // 이메일 검사
  if (!isValidEmail(email.value.trim())) {
    setError(email, true);
    valid = false;
  } else {
    setError(email, false);
  }

  // 비밀번호 길이 검사
  if (password.value.length < 6) {
    setError(password, true);
    valid = false;
  } else {
    setError(password, false);
  }

  // 비밀번호 일치 검사
  if (password.value !== passwordConfirm.value) {
    setError(passwordConfirm, true);
    valid = false;
  } else {
    setError(passwordConfirm, false);
  }

  if (!valid) return;

  // 로딩 상태
  const btn = document.getElementById('signupBtn');
  btn.classList.add('loading');
  btn.textContent = '가입 중...';

  // Supabase 회원가입
  const { error } = await supabaseClient.auth.signUp({
    email: email.value.trim(),
    password: password.value,
  });

  btn.classList.remove('loading');
  btn.textContent = '회원가입';

  if (error) {
    showAlert('회원가입에 실패했습니다. 이미 사용 중인 이메일일 수 있습니다.');
    return;
  }

  // 회원가입 성공
  showAlert('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
  setTimeout(() => {
    document.querySelector('[data-tab="login"]').click();
  }, 1500);
});
