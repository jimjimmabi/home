// ================================================================
// Dotoriverse Homepage — App Logic
// ================================================================

// ================================================================
// STATIC DATA
// ================================================================
const UPDATES = [
  { text: 'MyDesk에 워드 스타일 툴바 추가됨', date: '10/07' },
  { text: 'MyDesk 클라우드 동기화 안정화', date: '10/07' },
  { text: 'Dotorisup 테마 커스터마이저 개발 중', date: '10/06' },
  { text: 'Dotorisup 일촌 시스템 개선', date: '10/05' },
  { text: '새 캘린더 구독 기능 계획 중', date: '10/04' },
  { text: '도토리 광장 홈페이지 공개', date: '10/03' },
  { text: '취향 찾기 알고리즘 개선', date: '10/02' },
  { text: 'Time Capsule 애니메이션 완성', date: '10/01' }
];

const ALL_TOOLS = [
  { name: '도토리숲', desc: '커뮤니티', url: 'https://jimjimmabi.github.io/Dotorisuop/', icon: '🌳', live: true },
  { name: '마이데스크', desc: '작업실', url: 'https://jimjimmabi.github.io/MyDesk/', icon: '🖥️', live: true },
  { name: '가계부', desc: '준비 중', url: '#', icon: '💰', live: false },
  { name: '지도', desc: '준비 중', url: '#', icon: '🗺️', live: false }
];

const ALL_SOCIALS = [
  { name: 'GitHub', desc: '코드', url: 'https://github.com/jimjimmabi', icon: '💻' },
  { name: 'Gitee', desc: '코드', url: 'https://gitee.com/jimjimmabi/projects', icon: '📦' },
  { name: 'YouTube', desc: '영상', url: 'https://www.youtube.com/@jimjimmabi', icon: '📺' },
  { name: 'TikTok', desc: '숏폼', url: 'https://www.tiktok.com/@jimjimmabi', icon: '🎵' }
];

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
  renderVisitCounter();
  renderUpdatesPreview();
  await renderAccount();
  await renderInbox();

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => { if (e.target === m) closeHomeModal(); });
  });
});

// ================================================================
// VISIT COUNTER
// ================================================================
function renderVisitCounter() {
  const today = new Date().toISOString().slice(0, 10);
  const raw = localStorage.getItem('dotoriverse_visits');
  const visits = raw ? JSON.parse(raw) : { today: '', todayCount: 0, total: 0 };

  if (visits.today !== today) {
    visits.today = today;
    visits.todayCount = 0;
  }
  visits.todayCount += 1;
  visits.total += 1;
  localStorage.setItem('dotoriverse_visits', JSON.stringify(visits));

  const t = document.getElementById('todayCount');
  const tot = document.getElementById('totalCount');
  if (t) t.innerText = visits.todayCount;
  if (tot) tot.innerText = visits.total;
}

// ================================================================
// ACCOUNT (top-right)
// ================================================================
async function renderAccount() {
  const area = document.getElementById('accountArea');
  if (!area) return;

  let profile = null;
  try { profile = await DotoriStorage.getMyAcorn(); } catch (e) {}

  if (profile) {
    // Logged in
    const avatarHtml = profile.mini_me_image_url
      ? `<span class="chip-avatar"><img src="${profile.mini_me_image_url}" alt=""></span>`
      : `<span class="chip-avatar">${profile.mini_me || '🌰'}</span>`;

    area.innerHTML = `
      <span class="profile-chip" title="${profile.dotori_id}">
        ${avatarHtml}
        ${escapeHtml(profile.nickname)}
      </span>
      <button class="logout-mini" onclick="doLogout()" title="로그아웃">⏻</button>
    `;

    // Also update mini-profile card
    const miniName = document.getElementById('miniName');
    const miniTag = document.getElementById('miniTag');
    const miniAvatar = document.getElementById('miniAvatar');

    if (miniName) miniName.innerText = profile.nickname;
    if (miniTag) miniTag.innerText = profile.status_message || '도토리숲의 일원';
    if (miniAvatar) {
      if (profile.mini_me_image_url) {
        miniAvatar.innerHTML = `<img src="${profile.mini_me_image_url}" alt="">`;
      } else {
        miniAvatar.innerText = profile.mini_me || '🌰';
      }
    }
  } else {
    // Not logged in
    area.innerHTML = `
      <button class="login-btn" onclick="openLoginModal()">
        <i class="fa-solid fa-right-to-bracket"></i> 로그인
      </button>
      <a href="https://jimjimmabi.github.io/Dotorisuop/" class="login-btn" style="margin-left:4px;">
        <i class="fa-solid fa-user-plus"></i> 회원가입
      </a>
    `;
  }
}

// ================================================================
// INBOX (쪽지함)
// ================================================================
async function renderInbox() {
  const list = document.getElementById('inboxList');
  const countEl = document.getElementById('inboxCount');
  if (!list) return;

  let profile = null;
  try { profile = await DotoriStorage.getMyAcorn(); } catch (e) {}

  if (!profile) {
    list.innerHTML = '<li style="color:#999;">로그인하면 쪽지가 보여요</li>';
    if (countEl) countEl.innerText = '';
    return;
  }

  try {
    const { unread, latest } = await DotoriStorage.getInboxPreview();

    if (countEl) countEl.innerText = unread > 0 ? `${unread}개 안읽음` : '';

    if (!latest || latest.length === 0) {
      list.innerHTML = '<li style="color:#999;">아직 쪽지가 없어요</li>';
      return;
    }

    list.innerHTML = latest.map(n => `
      <li style="cursor:pointer;" onclick="window.location.href='https://jimjimmabi.github.io/Dotorisuop/'">
        <strong>${escapeHtml(n.sender.nickname)}</strong>:
        ${escapeHtml((n.message || '').slice(0, 30))}${n.message && n.message.length > 30 ? '…' : ''}
        ${!n.is_read ? '<span style="color:#E87BA8;font-weight:bold;"> ●</span>' : ''}
      </li>
    `).join('');
  } catch (e) {
    list.innerHTML = '<li style="color:#999;">쪽지를 불러올 수 없어요</li>';
  }
}

// ================================================================
// SEARCH
// ================================================================
function doSearch() {
  const input = document.getElementById('searchInput');
  const engine = document.getElementById('searchEngine').value;
  const q = input.value.trim();
  if (!q) return;

  const engines = {
    google: 'https://www.google.com/search?q=',
    naver: 'https://search.naver.com/search.naver?query=',
    daum: 'https://search.daum.net/search?q=',
    baidu: 'https://www.baidu.com/s?wd='
  };

  const url = (engines[engine] || engines.google) + encodeURIComponent(q);
  window.open(url, '_blank');
}

// ================================================================
// UPDATES PREVIEW
// ================================================================
function renderUpdatesPreview() {
  const list = document.getElementById('updatesPreview');
  if (!list) return;
  list.innerHTML = UPDATES.slice(0, 4).map(u => `
    <li>${escapeHtml(u.text)} <span class="date">${u.date}</span></li>
  `).join('');
}

// ================================================================
// MODALS
// ================================================================
function openHomeModal(title, html) {
  document.getElementById('homeModalTitle').innerText = title;
  document.getElementById('homeModalBody').innerHTML = html;
  document.getElementById('homeModal').classList.remove('hidden');
}

function closeHomeModal() {
  document.getElementById('homeModal').classList.add('hidden');
}

// View All tools
window.openAllTools = function() {
  const html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${ALL_TOOLS.map(t => {
        if (t.live) {
          return `<a href="${t.url}" target="${t.url.startsWith('http') ? '_blank' : '_self'}"
            style="display:flex;align-items:center;gap:10px;padding:10px;background:#fff;border:1px solid #ddd;border-radius:4px;text-decoration:none;color:#333;">
            <span style="font-size:22px;">${t.icon}</span>
            <div>
              <div style="font-weight:bold;color:var(--acorn-dark);font-size:12px;">${t.name}</div>
              <div style="font-size:10px;color:#888;">${t.desc}</div>
            </div>
          </a>`;
        }
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#fafafa;border:1px solid #ddd;border-radius:4px;opacity:0.6;">
          <span style="font-size:22px;">${t.icon}</span>
          <div>
            <div style="font-weight:bold;color:#888;font-size:12px;">${t.name}</div>
            <div style="font-size:10px;color:#aaa;">${t.desc}</div>
          </div>
        </div>`;
      }).join('')}
    </div>
  `;
  openHomeModal('📦 모든 도구', html);
};

// See more updates
window.openAllUpdates = function() {
  const html = `
    <ul class="dense-list">
      ${UPDATES.map(u => `<li>${escapeHtml(u.text)} <span class="date">${u.date}</span></li>`).join('')}
    </ul>
  `;
  openHomeModal('🌳 모든 업데이트', html);
};

// Coming soon
window.openComingSoon = function(name) {
  openHomeModal('⏳ 준비 중', `
    <div style="text-align:center;padding:20px 10px;">
      <div style="font-size:40px;margin-bottom:12px;">🌱</div>
      <div style="font-size:14px;font-weight:bold;color:var(--acorn-dark);margin-bottom:6px;">${escapeHtml(name)}</div>
      <div style="font-size:11px;color:#888;line-height:1.7;">
        아직 만들고 있어요.<br>
        조금만 기다려 주세요.
      </div>
    </div>
  `);
};

// Login modal
window.openLoginModal = function() {
  openHomeModal('🌰 로그인', `
    <div style="padding:6px 0;">
      <p style="font-size:11px;color:#888;margin-bottom:14px;line-height:1.7;">
        도토리숲에서 만든 도토리 ID를 입력해주세요.
      </p>
      <input type="text" id="loginDotoriId" placeholder="dotori-xxxx" maxlength="20"
        autocomplete="off" style="width:100%;padding:9px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:13px;font-family:inherit;outline:none;margin-bottom:12px;"
        onfocus="this.style.borderColor='#FF9EC4';this.style.background='#fff'"
        onblur="this.style.borderColor='#ccc';this.style.background='#FFF8F0'">
      <button onclick="doLogin()" style="width:100%;padding:10px;background:linear-gradient(to bottom, #FFB8D4, #FF9EC4);border:1px solid #E87BA8;border-radius:4px;color:#fff;font-size:13px;font-weight:bold;cursor:pointer;font-family:inherit;">
        🌰 들어가기
      </button>
      <p style="font-size:10px;color:#aaa;margin-top:12px;text-align:center;">
        아직 도토리가 없나요?
        <a href="https://jimjimmabi.github.io/Dotorisuop/" style="color:#0066CC;">도토리숲에서 만들기 →</a>
      </p>
    </div>
  `);
  setTimeout(() => {
    const input = document.getElementById('loginDotoriId');
    if (input) {
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doLogin();
      });
    }
  }, 50);
};

// Actually log in
window.doLogin = async function() {
  const input = document.getElementById('loginDotoriId');
  if (!input) return;
  const id = input.value.trim().toLowerCase();
  if (!id) { alert('도토리 ID를 입력해주세요.'); return; }

  try {
    const result = await DotoriStorage.loginByDotoriId(id);
    if (result) {
      closeHomeModal();
      showToast(`🌰 ${result.nickname}님, 환영해요!`);
      await renderAccount();
      await renderInbox();
    } else {
      alert('그런 도토리를 찾을 수 없어요: ' + id);
    }
  } catch (err) {
    console.error(err);
    alert('로그인 실패: ' + (err.message || '알 수 없는 오류'));
  }
};

// Log out
window.doLogout = async function() {
  if (!confirm('로그아웃하시겠어요?')) return;
  try { await DotoriStorage.logout(); } catch (e) {}
  location.reload();
};

// ================================================================
// HELPERS
// ================================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.innerText = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}