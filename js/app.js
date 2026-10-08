// ================================================================
// Dotoriverse Homepage — App Logic
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

let myTasks = [];

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
  renderVisitCounter();
  renderUpdatesPreview();
  await renderAccount();
  await renderInbox();
  await renderTasksPanel();

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

  const st = document.getElementById('statToday');
  const stot = document.getElementById('statTotal');
  if (st) st.innerText = visits.todayCount;
  if (stot) stot.innerText = visits.total;
}

// ================================================================
// ACCOUNT
// ================================================================
async function renderAccount() {
  const area = document.getElementById('accountArea');
  if (!area) return;

  let profile = null;
  try { profile = await DotoriStorage.getMyAcorn(); } catch (e) {}

  if (profile) {
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
// INBOX
// ================================================================
async function renderInbox() {
  const list = document.getElementById('inboxList');
  const countEl = document.getElementById('inboxCount');
  if (!list) return;

  let profile = null;
  try { profile = await DotoriStorage.getMyAcorn(); } catch (e) {}

  if (!profile) {
    list.innerHTML = '<li style="color:#999;padding:6px;">로그인하면 쪽지가 보여요</li>';
    if (countEl) countEl.innerText = '';
    return;
  }

  try {
    const { unread, latest } = await DotoriStorage.getInboxPreview();

    if (countEl) {
      countEl.innerHTML = unread > 0
        ? `<span style="background:#FF9EC4;color:#fff;padding:1px 6px;border-radius:8px;font-size:9px;font-weight:bold;">${unread}</span>`
        : '';
    }

    if (!latest || latest.length === 0) {
      list.innerHTML = '<li style="color:#999;padding:6px;">아직 쪽지가 없어요</li>';
      return;
    }

    list.innerHTML = latest.map(n => {
      const senderName = n.sender?.nickname || '알 수 없음';
      const preview = (n.message || '').slice(0, 22);
      const isUnread = !n.is_read;
      const dotoriLink = `https://jimjimmabi.github.io/Dotorisuop/`;

      return `
        <li style="cursor:pointer;padding:6px 4px;border-bottom:1px dotted #EEEEEE;transition:background 0.15s;"
            onmouseover="this.style.background='#FFF8F0'"
            onmouseout="this.style.background=''"
            onclick="window.open('${dotoriLink}', '_blank')">
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="font-size:14px;">${n.sender?.mini_me || '🌰'}</span>
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong style="color:var(--acorn-dark);font-size:11px;">${escapeHtml(senderName)}</strong>
                ${isUnread ? '<span style="color:#E87BA8;font-size:14px;line-height:1;">●</span>' : ''}
              </div>
              <div style="font-size:10px;color:#777;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">
                ${escapeHtml(preview)}${n.message && n.message.length > 22 ? '…' : ''}
              </div>
            </div>
          </div>
        </li>
      `;
    }).join('');
  } catch (e) {
    list.innerHTML = '<li style="color:#999;padding:6px;">쪽지를 불러올 수 없어요</li>';
  }
}

// ================================================================
// TASKS PANEL (from MyDesk)
// ================================================================
async function renderTasksPanel() {
  const grid = document.getElementById('taskGrid');
  const countEl = document.getElementById('taskCount');
  if (!grid) return;

  let profile = null;
  try { profile = await DotoriStorage.getMyAcorn(); } catch (e) {}

  if (!profile) {
    grid.innerHTML = '<p style="color:#999;padding:14px;text-align:center;font-size:11px;grid-column:1/-1;">로그인하면 할 일이 보여요</p>';
    if (countEl) countEl.innerText = '';
    return;
  }

  grid.innerHTML = '<p style="color:#BBB;padding:14px;text-align:center;font-size:11px;grid-column:1/-1;font-style:italic;">불러오는 중...</p>';

  try {
    myTasks = await DotoriStorage.getMyDeskTasks();
  } catch (e) {
    console.error('Tasks load failed:', e);
    myTasks = [];
  }

  if (countEl) {
    countEl.innerText = myTasks.length > 0 ? `${myTasks.length}개` : '';
  }

  if (myTasks.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;padding:24px;text-align:center;color:#999;font-size:11px;">
        할 일이 없어요 🎉<br>
        <span style="font-size:10px;color:#BBB;">MyDesk에서 새 할 일을 추가해보세요.</span>
      </div>
    `;
    return;
  }

  const groups = {
    High: myTasks.filter(t => t.priority === 'High'),
    Medium: myTasks.filter(t => t.priority === 'Medium'),
    Low: myTasks.filter(t => t.priority === 'Low')
  };

  const meta = {
    High:   { emoji: '🔴', label: '높음', color: '#C04040' },
    Medium: { emoji: '🟡', label: '보통', color: '#B8860B' },
    Low:    { emoji: '🟢', label: '낮음', color: '#4A8A4A' }
  };

  grid.innerHTML = Object.keys(groups).map(level => {
    const tasks = groups[level];
    const m = meta[level];

    const listHtml = tasks.length === 0
      ? `<div style="padding:14px 10px;text-align:center;color:#CCC;font-size:10px;font-style:italic;">없음</div>`
    : tasks.map(t => `
    <div style="padding:6px 8px;border-bottom:1px dotted #EEEEEE;transition:background 0.15s;display:flex;gap:8px;align-items:flex-start;"
           onmouseover="this.style.background='#FFF8F0'"
           onmouseout="this.style.background=''">
     <input type="checkbox"
              onclick="toggleTaskFromHome('${t.id}', event)"
              style="margin-top:2px;cursor:pointer;accent-color:#E87BA8;flex-shrink:0;width:14px;height:14px;">
     <div style="flex:1;min-width:0;cursor:pointer;"
           onclick="window.open('https://jimjimmabi.github.io/MyDesk/', '_blank')">
          <div style="font-size:11px;color:#333;line-height:1.4;word-break:break-word;">
           ${escapeHtml(t.title || '(제목 없음)')}
         </div>
         <div style="font-size:9px;color:#999;margin-top:2px;">
         ${t.category ? escapeHtml(t.category) : '일반'}${t.due ? ' · 📅 ' + escapeHtml(t.due) : ''}
        </div>
     </div>
     </div>
    `).join('')
    return `
      <div class="rss-column" data-priority="${level}">
        <div class="rss-column-header">
          <span class="tag-name">
            <i class="fa-solid fa-circle" style="color:${m.color};font-size:8px;"></i>
            ${m.emoji} ${m.label}
          </span>
          <span class="feed-count">${tasks.length}개</span>
        </div>
        <div class="rss-column-body">
          ${listHtml}
        </div>
      </div>
    `;
  }).join('');
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

  window.open((engines[engine] || engines.google) + encodeURIComponent(q), '_blank');
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

window.openAllTools = function() {
  const html = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${ALL_TOOLS.map(t => t.live
        ? `<a href="${t.url}" target="_blank" style="display:flex;align-items:center;gap:10px;padding:10px;background:#fff;border:1px solid #ddd;border-radius:4px;text-decoration:none;color:#333;">
            <span style="font-size:22px;">${t.icon}</span>
            <div>
              <div style="font-weight:bold;color:var(--acorn-dark);font-size:12px;">${t.name}</div>
              <div style="font-size:10px;color:#888;">${t.desc}</div>
            </div>
          </a>`
        : `<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#fafafa;border:1px solid #ddd;border-radius:4px;opacity:0.6;">
            <span style="font-size:22px;">${t.icon}</span>
            <div>
              <div style="font-weight:bold;color:#888;font-size:12px;">${t.name}</div>
              <div style="font-size:10px;color:#aaa;">${t.desc}</div>
            </div>
          </div>`
      ).join('')}
    </div>
  `;
  openHomeModal('📦 모든 도구', html);
};

window.openAllUpdates = function() {
  const html = `<ul class="dense-list">
    ${UPDATES.map(u => `<li>${escapeHtml(u.text)} <span class="date">${u.date}</span></li>`).join('')}
  </ul>`;
  openHomeModal('🌳 모든 업데이트', html);
};

window.openComingSoon = function(name) {
  openHomeModal('⏳ 준비 중', `
    <div style="text-align:center;padding:20px 10px;">
      <div style="font-size:40px;margin-bottom:12px;">🌱</div>
      <div style="font-size:14px;font-weight:bold;color:var(--acorn-dark);margin-bottom:6px;">${escapeHtml(name)}</div>
      <div style="font-size:11px;color:#888;line-height:1.7;">
        아직 만들고 있어요.<br>조금만 기다려 주세요.
      </div>
    </div>
  `);
};

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
      await renderTasksPanel();
    } else {
      alert('그런 도토리를 찾을 수 없어요: ' + id);
    }
  } catch (err) {
    console.error(err);
    alert('로그인 실패: ' + (err.message || '알 수 없는 오류'));
  }
};

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