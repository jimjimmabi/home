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
        <span style="font-size:10px;color:#BBB;">"관리" 버튼으로 RSS 주소를 등록해보세요.</span>
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

  // Try multiple CORS proxies in order
  const proxies = [
  `https://api.allorigins.win/raw?url=${encodeURIComponent(feed.url)}`,
  `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(feed.url)}`,
  `https://cors.eu.org/${feed.url}`,
  `https://corsproxy.io/?url=${encodeURIComponent(feed.url)}`
  ];

  let xml = null;
  let lastError = null;

  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl);
      if (!res.ok) continue;
      const text = await res.text();
      if (text && text.includes('<')) {
        xml = text;
        break;
      }
    } catch (e) {
      lastError = e;
      continue;
    }
  }

  if (!xml) {
    console.error('All proxies failed for:', feed.url, lastError);
    tags.forEach(tag => {
      const bodyEl = document.getElementById('rss-body-' + cssSafe(tag));
      if (!bodyEl) return;
      const loading = bodyEl.querySelector('.rss-loading');
      if (loading) loading.remove();
      if (!bodyEl.querySelector(`[data-feed-id="${feed.id}"]`)) {
        const err = document.createElement('div');
        err.className = 'rss-error';
        err.dataset.feedId = feed.id;
        err.innerHTML = `
          <strong>${escapeHtml(feed.name)}</strong><br>
          불러올 수 없어요
          <div style="margin-top:4px;display:flex;gap:4px;">
            <button class="rss-mini-btn" style="font-size:9px;padding:2px 6px;" onclick="openEditFeed('${feed.id}')">수정</button>
            <button class="rss-mini-btn" style="font-size:9px;padding:2px 6px;color:#C04040;" onclick="removeRssFeed('${feed.id}')">삭제</button>
          </div>
        `;
        bodyEl.appendChild(err);
      }
    });
    return;
  }

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
      ${items.length === 0
        ? '<div class="rss-error" style="padding:2px 0;">아이템이 없어요</div>'
        : items.slice(0, 8).map(item => `
          <a href="${escapeHtml(item.link)}" target="_blank" class="rss-item">
            ${escapeHtml(item.title)}
            <span class="item-date">${item.date}</span>
          </a>
        `).join('')}
    `;
    bodyEl.appendChild(group);
  });
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
  document.querySelectorAll('.rss-column-body').forEach(b => {
    b.innerHTML = '<div class="rss-loading">불러오는 중...</div>';
  });
  for (const feed of rssFeeds) await fetchFeedItems(feed);
  showToast('✅ 모든 피드를 새로고침했어요');
};

// ================================================================
// RSS MANAGER (list + edit + add + delete)
// ================================================================
window.openFeedManager = async function() {
  const me = await DotoriStorage.getMyAcorn();
  if (!me) { showToast('로그인이 필요해요'); return; }

  let feeds = [];
  try { feeds = await DotoriStorage.getMyRssFeeds(); } catch (e) {}

  const feedsHtml = feeds.length === 0
    ? `<p style="text-align:center;color:#999;font-size:11px;padding:20px 0;">아직 등록된 피드가 없어요.<br>아래에서 새 피드를 추가해보세요.</p>`
    : feeds.map(f => `
      <div style="border:1px solid #E0E0E0;border-radius:4px;padding:10px;margin-bottom:8px;background:#FAFAFA;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:bold;color:var(--acorn-dark);margin-bottom:3px;">
              ${escapeHtml(f.name)}
            </div>
            <div style="font-size:10px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:5px;">
              ${escapeHtml(f.url)}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:3px;">
              ${(f.tags || []).map(t => `<span style="background:var(--cream);border:1px solid var(--cream-dark);border-radius:8px;padding:1px 7px;font-size:9px;color:var(--acorn-dark);">#${escapeHtml(t)}</span>`).join('')}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <button class="rss-mini-btn" onclick="openEditFeed('${f.id}')" style="font-size:10px;">
              <i class="fa-solid fa-pen"></i> 수정
            </button>
            <button class="rss-mini-btn" onclick="removeRssFeed('${f.id}');setTimeout(openFeedManager,300);" style="font-size:10px;color:#C04040;">
              <i class="fa-solid fa-trash"></i> 삭제
            </button>
          </div>
        </div>
      </div>
    `).join('');

  openHomeModal('📡 RSS 피드 관리', `
    <div>
      <div style="font-size:11px;color:#888;margin-bottom:10px;line-height:1.6;">
        총 <strong>${feeds.length}개</strong>의 피드가 등록되어 있어요. 수정하거나 삭제하거나 새 피드를 추가할 수 있어요.
      </div>

      <div style="max-height:320px;overflow-y:auto;margin-bottom:14px;">
        ${feedsHtml}
      </div>

      <div style="border-top:1px dashed #DDD;padding-top:12px;">
        <div style="font-size:11px;font-weight:bold;color:var(--acorn-dark);margin-bottom:8px;">
          <i class="fa-solid fa-plus" style="color:var(--pink-dark);"></i> 새 피드 추가
        </div>
        <input type="text" id="mgrName" placeholder="피드 이름" maxlength="30"
          style="width:100%;padding:7px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;margin-bottom:6px;">
        <input type="text" id="mgrUrl" placeholder="https://example.com/feed.xml" maxlength="300"
          style="width:100%;padding:7px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;margin-bottom:6px;">
        <input type="text" id="mgrTags" placeholder="태그 (쉼표로 구분)" maxlength="100"
          style="width:100%;padding:7px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;margin-bottom:8px;">
        <button onclick="doAddFeedFromManager()"
          style="width:100%;padding:9px;background:linear-gradient(to bottom, #FFB8D4, #FF9EC4);border:1px solid #E87BA8;border-radius:4px;color:#fff;font-size:12px;font-weight:bold;cursor:pointer;font-family:inherit;">
          <i class="fa-solid fa-plus"></i> 피드 추가
        </button>
      </div>
    </div>
  `);
};

window.doAddFeedFromManager = async function() {
  const name = document.getElementById('mgrName').value.trim();
  const url = document.getElementById('mgrUrl').value.trim();
  const tagsRaw = document.getElementById('mgrTags').value.trim();

  if (!name) { alert('피드 이름을 입력해주세요.'); return; }
  if (!url) { alert('RSS 주소를 입력해주세요.'); return; }

  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : ['기타'];

  try {
    await DotoriStorage.addRssFeed(name, url, tags);
    showToast(`📡 "${name}" 피드를 추가했어요`);
    await initRss();
    await openFeedManager();
  } catch (e) {
    console.error(e);
    alert('피드를 추가할 수 없어요: ' + (e.message || ''));
  }
};

window.openEditFeed = async function(id) {
  const me = await DotoriStorage.getMyAcorn();
  if (!me) return;

  // Reload to make sure we have fresh data
  try { rssFeeds = await DotoriStorage.getMyRssFeeds(); } catch (e) {}
  const feed = rssFeeds.find(f => f.id === id);
  if (!feed) { showToast('피드를 찾을 수 없어요'); return; }

  openHomeModal('✏️ 피드 수정', `
    <div style="padding:6px 0;">
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11px;font-weight:bold;color:var(--acorn-dark);margin-bottom:5px;">피드 이름</label>
        <input type="text" id="editName" maxlength="30" value="${escapeHtml(feed.name)}"
          style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;">
      </div>
      <div style="margin-bottom:12px;">
        <label style="display:block;font-size:11px;font-weight:bold;color:var(--acorn-dark);margin-bottom:5px;">RSS 주소</label>
        <input type="text" id="editUrl" maxlength="300" value="${escapeHtml(feed.url)}"
          style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;">
      </div>
      <div style="margin-bottom:14px;">
        <label style="display:block;font-size:11px;font-weight:bold;color:var(--acorn-dark);margin-bottom:5px;">
          태그 <span style="font-weight:normal;color:#999;">(쉼표로 구분)</span>
        </label>
        <input type="text" id="editTags" maxlength="100" value="${escapeHtml((feed.tags || []).join(', '))}"
          style="width:100%;padding:8px 10px;border:1px solid #ccc;border-radius:3px;background:#FFF8F0;font-size:12px;font-family:inherit;outline:none;">
      </div>
      <div style="display:flex;gap:6px;">
        <button onclick="openFeedManager()" style="flex:1;padding:9px;background:#F0F0F0;border:1px solid #ccc;border-radius:4px;color:#333;font-size:12px;font-weight:bold;cursor:pointer;font-family:inherit;">
          취소
        </button>
        <button onclick="doUpdateFeed('${feed.id}')" style="flex:2;padding:9px;background:linear-gradient(to bottom, #FFB8D4, #FF9EC4);border:1px solid #E87BA8;border-radius:4px;color:#fff;font-size:12px;font-weight:bold;cursor:pointer;font-family:inherit;">
          <i class="fa-solid fa-save"></i> 저장
        </button>
      </div>
    </div>
  `);
};

window.doUpdateFeed = async function(id) {
  const name = document.getElementById('editName').value.trim();
  const url = document.getElementById('editUrl').value.trim();
  const tagsRaw = document.getElementById('editTags').value.trim();

  if (!name) { alert('피드 이름을 입력해주세요.'); return; }
  if (!url) { alert('RSS 주소를 입력해주세요.'); return; }

  const tags = tagsRaw
    ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
    : ['기타'];

  try {
    await DotoriStorage.updateRssFeed(id, name, url, tags);
    showToast('✅ 피드를 수정했어요');
    await initRss();
    await openFeedManager();
  } catch (e) {
    console.error(e);
    alert('수정할 수 없어요: ' + (e.message || ''));
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