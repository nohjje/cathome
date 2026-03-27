/* ===========================
   Supabase 클라이언트 초기화
=========================== */

// Supabase CDN에서 createClient 함수를 가져옴
const { createClient } = supabase;

const SUPABASE_URL = 'https://xznemwinfguockvcuecj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bmVtd2luZmd1b2NrdmN1ZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NjM4MDksImV4cCI6MjA5MDEzOTgwOX0.YnrIWIJjp5u1aW63Bb2LFqy8wjCOHSWX5L9SvLFlFoY';

// sessionStorage 사용 → 브라우저 닫으면 자동 로그아웃
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: sessionStorage,
    persistSession: true,
  }
});
