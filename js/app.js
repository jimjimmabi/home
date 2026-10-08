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

let rssFeeds = [];

// ================================================================
// INIT
// ================================================================
document.addEventListener('DOMContentLoaded', async () => {
  renderVisitCounter();
  renderUpdatesPreview();
  await renderAccount();
  await renderInbox();
  await initRss();

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
      await initRss();
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
// RSS FEEDS
// ================================================================
async function initRss() {
  const grid = document.getElementById('rssGrid');
  if (!grid) return;

  let profile = null;
  try { profile = await DotoriStorage.getMyAcorn(); } catch (e) {}

  const countEl = document.getElementById('rssCount');

  if (!profile) {
    grid.innerHTML = '<p style="color:#999;padding:20px;text-align:center;grid-column:1/-1;">로그인하면 RSS 피드를 추가할 수 있어요</p>';
    if (countEl) countEl.innerText = '';
    return;
  }

  try {
    rssFeeds = await DotoriStorage.getMyRssFeeds();
  } catch (e) {
    rssFeeds = [];
  }

  if (countEl) countEl.innerText = rssFeeds.length > 0 ? `${rssFeeds.length}개` : '';

  if (rssFeeds.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;padding:24px;text-align:center;color:#999;font-size:11px;">
        아직 등록된 피드가 없어요.<br>
        <span style="font-size:10px;color:#BBB;">"피드 추가" 버튼으로 RSS 주소를 등록해보세요.</span>
      </div>
    `;
    return;
  }

  // Group by tag
  const byTag = {};
  rssFeeds.forEach(feed => {
    const tags = (feed.tags && feed.tags.length > 0) ? feed.tags : ['기타'];
    tags.forEach(tag => {
      if (!byTag[tag]) byTag[tag] = [];
      byTag[tag].push(feed);
    });
  });

  const tags = Object.keys(byTag).sort();

  grid.innerHTML = tags.map(tag => `
    <div class="rss-column" data-tag="${escapeHtml(tag)}">
      <div class="rss-column-header">
        <span class="tag-name"><i class="fa-solid fa-tag"></i> ${escapeHtml(tag)}</span>
        <span class="feed-count">${byTag[tag].length}개</span>
      </div>
      <div class="rss-column-body" id="rss-body-${cssSafe(tag)}">
        <div class="rss-loading">불러오는 중...</div>
      </div>
    </div>
  `).join('');

  // Fetch each feed
  for (const feed of rssFeeds) {
    fetchFeedItems(feed);
  }
}

function cssSafe(str) {
  return String(str).replace(/[^a-zA-Z0-9가-힣]/g, '_');
}

async function fetchFeedItems(feed) {
  const tags = (feed.tags && feed.tags.length > 0) ? feed.tags : ['기타'];
  const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent(feed.url);

  try {
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const wrapper = await res.json();
    const xml = wrapper.contents;
    const items = parseRssItems(xml, feed.name);

    tags.forEach(tag => {
      const bodyEl = document.getElementById('rss-body-' + cssSafe(tag));
      if (!bodyEl) return;
      const loading = bodyEl.querySelector('.rss-loading');
      if (loading) loading.remove();
      const oldGroup = bodyEl.querySelector(`[data-feed-id="${feed.id}"]`);
      if (oldGroup) oldGroup.remove();

      const group = document.createElement('div');
      group.className = 'rss-feed-group';
      group.dataset.feedId = feed.id;
      group.innerHTML = `
        <div class="rss-feed-name">
          <span>${escapeHtml(feed.name)}</span>
          <button class="feed-remove" onclick="removeRssFeed('${feed.id}')" title="삭제">✕</button>
        </div>
        ${items.slice(0, 8).map(item => `
          <a href="${escapeHtml(item.link)}" target="_blank" class="rss-item">
            ${escapeHtml(item.title)}
            <span class="item-date">${item.date}</span>
          </a>
        `).join('')}
      `;
      bodyEl.appendChild(group);
    });
  } catch (e) {
    console.error('Feed fetch failed:', feed.url, e);
    tags.forEach(tag => {
      const bodyEl = document.getElementById('rss-body-' + cssSafe(tag));
      if (!bodyEl) return;
      const loading = bodyEl.querySelector('.rss-loading');
      if (loading) loading.remove();
      if (!bodyEl.querySelector(`[data-feed-id="${feed.id}"]`)) {
        const err = document.createElement('div');
        err.className = 'rss-error';
        err.dataset.feedId = feed.id;
        err.innerHTML = `<strong>${escapeHtml(feed.name)}</strong><br>불러올 수 없어요<br><button class="feed-remove" onclick="removeRssFeed('${feed.id}')" style="margin-top:4px;">✕ 삭제</button>`;
        bodyEl.appendChild(err);
      }
    });
  }
}

function parseRssItems(xml) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');
  const items = [];
  const entries = doc.querySelectorAll('item, entry');

  entries.forEach(entry => {
    const title = entry.querySelector('title')?.textContent || '(제목 없음)';
    let link = '';
    const linkEl = entry.querySelector('link');
    if (linkEl) link = linkEl.getAttribute('href') || linkEl.textContent || '';
    const pubDate = entry.querySelector('pubDate, published, updated')?.textContent || '';
    let date = '';
    if (pubDate) {
      try {
        const d = new Date(pubDate);
        date = `${d.getMonth() + 1}/${d.getDate()}`;
      } catch (e) {}
    }
    if (link) items.push({ title: title.trim(), link, date });
  });

  return items;
}

window.refreshAllFeeds = async function() {
  if (rssFeeds.length === 0) { showToast('등록된 피드가 없어요'); return; }
  const grid = document.getElementById('rssGrid');
  if (grid) {
    // Reset bodies to loading state
    document.querySelectorAll('.rss-column-body').forEach(b => {
      b.innerHTML = '<div class="rss-loading">불러오는 중...</div>';
    });
  }
  for (const feed of rssFeeds) await fetchFeedItems(feed);
  showToast('✅ 모든 피드를 새로고침했어요');
};

window.openAddFeedModal = async function() {
  const me = await DotoriStorage.getMyAcorn();
  if (!me) { showToast('로그인이 필요해요'); return; }

  openHomeModal('📡 RSS 피드 추가', `
    <div style="padding:6px 0;">
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11px;font-weight:bold;color:var(--acorn-dark);margin-bottom:5px;">피드 이름</label>
        <input type="text" id="rssName" placeholder="예: 기술 블로그" maxlength="30"
          style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11px;font-weight:bold;color:var(--acorn-dark);margin-bottom:5px;">RSS 주소</label>
        <input type="text" id="rssUrl" placeholder="https://example.com/feed.xml" maxlength="300"
          style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;">
      </div>
      <div style="margin-bottom:14px;">
        <label style="display:block;font-size:11px;font-weight:bold;color:var(--acorn-dark);margin-bottom:5px;">
          태그 <span style="font-weight:normal;color:#999;">(쉼표로 구분 · 각 태그가 하나의 열이 돼요)</span>
        </label>
        <input type="text" id="rssTags" placeholder="예: 기술, 뉴스, 블로그" maxlength="100"
          style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;">
      </div>
      <button onclick="doAddFeed()" style="width:100%;padding:10px;background:linear-gradient(to bottom, #FFB8D4, #FF9EC4);border:1px solid #E87BA8;border-radius:4px;color:#fff;font-size:13px;font-weight:bold;cursor:pointer;font-family:inherit;">
        <i class="fa-solid fa-plus"></i> 피드 추가
      </button>
      <p style="font-size:10px;color:#aaa;margin-top:12px;line-height:1.6;">
        RSS 주소는 보통 <code style="background:#f5f5f5;padding:1px 4px;border-radius:2px;">/feed</code>, <code style="background:#f5f5f5;padding:1px 4px;border-radius:2px;">/rss</code>, <code style="background:#f5f5f5;padding:1px 4px;border-radius:2px;">/atom.xml</code> 같은 경로예요.
      </p>
    </div>
  `);

  setTimeout(() => {
    const input = document.getElementById('rssName');
    if (input) input.focus();
  }, 50);
};

window.doAddFeed = async function() {
  const name = document.getElementById('rssName').value.trim();
  const url = document.getElementById('rssUrl').value.trim();
  const tagsRaw = document.getElementById('rssTags').value.trim();

  if (!name) { alert('피드 이름을 입력해주세요.'); return; }
  if (!url) { alert('RSS 주소를 입력해주세요.'); return; }

  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : ['기타'];

  try {
    await DotoriStorage.addRssFeed(name, url, tags);
    closeHomeModal();
    showToast(`📡 "${name}" 피드를 추가했어요`);
    await initRss();
  } catch (e) {
    console.error(e);
    alert('피드를 추가할 수 없어요: ' + (e.message || ''));
  }
};

window.removeRssFeed = async function(id) {
  if (!confirm('이 피드를 삭제할까요?')) return;
  try {
    await DotoriStorage.deleteRssFeed(id);
    showToast('삭제했어요');
    await initRss();
  } catch (e) {
    console.error(e);
    alert('삭제할 수 없어요');
  }
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