// ============================================
// Dotoriverse Homepage — Supabase Adapter
// ============================================

const SUPABASE_URL_FALLBACK = 'https://xdqmsrferkstomzytkoh.supabase.co';
const SUPABASE_ANON_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkcW1zcmZlcmtzdG9tenl0a29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NzU5NzksImV4cCI6MjEwNjQ1MTk3OX0.d-XCXnr8LVDcoFpZCKRMfBY3x0YdupUsJHDcyX7zEB4';

const sb = window.supabase.createClient(
  window.SUPABASE_URL || SUPABASE_URL_FALLBACK,
  window.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY_FALLBACK
);

// ---------- Auth ----------

async function getMyAcorn() {
  const myId = localStorage.getItem('dotori_my_id');
  if (!myId) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('dotori_id', myId)
    .single();

  if (error) return null;
  return data;
}

async function loginByDotoriId(dotoriId) {
  const cleaned = String(dotoriId).trim().toLowerCase();

  const { data: profile, error } = await sb
    .from('profiles')
    .select('*')
    .eq('dotori_id', cleaned)
    .single();

  if (error || !profile) return null;

  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    const { error: authError } = await sb.auth.signInAnonymously();
    if (authError) throw authError;
  }

  localStorage.setItem('dotori_my_id', profile.dotori_id);
  localStorage.setItem('dotori_session', JSON.stringify({
    loggedIn: true,
    dotori_id: profile.dotori_id,
    user_id: profile.id,
    is_owner: true
  }));

  return profile;
}

async function logout() {
  await sb.auth.signOut();
  localStorage.removeItem('dotori_session');
  localStorage.removeItem('dotori_my_id');
}

// ---------- Inbox (쪽지) ----------

async function getInboxPreview() {
  const me = await getMyAcorn();
  if (!me) return { unread: 0, latest: [] };

  // Fetch the latest 5 notes for this user
  const { data, error } = await sb
    .from('notes')
    .select('*')
    .eq('recipient_id', me.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) return { unread: 0, latest: [] };

  // Count unread notes
  const { count } = await sb
    .from('notes')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', me.id)
    .eq('is_read', false);

  // Get sender profiles for the fetched notes
  const senderIds = [...new Set((data || []).map((n) => n.sender_id))];
  let senders = {};
  if (senderIds.length > 0) {
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, nickname, mini_me, mini_me_image_url')
      .in('id', senderIds);
    (profiles || []).forEach((p) => { senders[p.id] = p; });
  }

  return {
    unread: count || 0,
    latest: (data || []).map((n) => ({
      ...n,
      sender: senders[n.sender_id] || { nickname: '알 수 없음', mini_me: '🌰' }
    }))
  };
}

// ---------- Expose ----------

window.DotoriStorage = {
  getMyAcorn,
  loginByDotoriId,
  logout,
  getInboxPreview
};