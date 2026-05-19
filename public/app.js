'use strict';
// ════════════════════════════════════════════════════════════════
// BuyShare v3 – app.js (status: active/inactive/suspended/archived + profit_rate)
// Key fixes:
//  • Submit Request: button properly triggers API, shows errors
//  • Notifications: real-time polling (10s), per-item mark-read
//  • Notification panel: type icons, color badges, timestamps
//  • All actions via event delegation (no inline onclick)
// ════════════════════════════════════════════════════════════════

// ── Translations ─────────────────────────────────────────────────
const T = {
  en: {
    delete_read:'Delete read',
    delete_notif:'Delete notification',
    confirm_delete_notif:'Delete this notification?',
    confirm_delete_read:'Delete all read notifications?',
    welcome_back:'Welcome Back', sign_in_sub:'Sign in to your account',
    create_account:'Create Account', reg_sub:'Join as an investor',
    email:'Email Address', email_ph:'Enter your email',
    password:'Password', password_ph:'Enter your password',
    role:'Select Role', choose_role:'Choose your role',
    r_admin:'Administrator', r_manager:'Bank Manager',
    r_bank_manager:'Bank Manager', r_investor:'Investor',
    sign_in:'Sign In', no_account:"Don't have an account?",
    register_now:' Register', back_login:'← Back to Sign In',
    full_name:'Full Name', name_ph:'Enter your full name',
    phone:'Phone Number', register:'Create Account',
    demo_creds:'Demo Credentials',
    dashboard:'Dashboard', shares:'Available Shares',
    my_requests:'My Requests', manage_requests:'Manage Requests',
    manage_users:'Manage Users', reports:'Reports',
    total_users:'Total Users', total_managers:'Bank Managers',
    total_investors:'Investors', active_shares:'Active Shares',
    pending_requests:'Pending', total_volume:'Total Volume',
    my_shares_listed:'Shares Listed', pending:'Pending',
    approved:'Approved', bank_revenue:'Revenue',
    my_requests_total:'My Requests', invested_total:'Total Invested',
    unread_notifs:'Notifications', recent_activity:'Recent Activity',
    available_shares:'Available Shares', add_share:'Add Share',
    edit_share:'Edit Share', share_name:'Share Name', bank:'Bank',
    total_shares:'Total Shares', available:'Available',
    price_per_share:'Price / Share', currency:'Currency',
    status:'Status', active:'Active', inactive:'Inactive',
    description:'Description', buy_shares:'Buy Shares',
    buy_now:'Buy Now', edit:'Edit', delete:'Delete',
    quantity:'Quantity', total:'Total',
    submit_request:'Submit Request',
    share:'Share', qty:'Qty', date:'Date', actions:'Actions',
    investor:'Investor', name:'Name',
    approve:'Approve', reject:'Reject',
    reject_request:'Reject Request',
    rejection_reason:'Reason for Rejection',
    rejection_ph:'Enter reason for rejection…',
    add_manager:'Add Manager', edit_user:'Edit User',
    save:'Save', cancel:'Cancel', confirm:'Confirm',
    confirm_delete:'Are you sure? This cannot be undone.',
    notifications:'Notifications',
    mark_all_read:'Mark all read',
    no_notifications:'No notifications yet',
    all:'All', rejected:'Rejected',
    msg_submitted:'✅ Purchase request submitted!',
    msg_approved:'✅ Request approved!',
    msg_rejected:'Request rejected.',
    msg_share_saved:'✅ Share saved successfully!',
    msg_share_del:'Share deleted.',
    msg_user_saved:'✅ User saved!',
    msg_user_del:'User deactivated.',
    msg_registered:'✅ Account created! Please sign in.',
    no_shares:'No shares available',
    no_requests:'No requests found',
    no_users:'No users found',
    invalid_creds:'Invalid email or password',
    email_exists:'Email already registered',
    account_locked:'Account locked. Try in 15 min.',
    err_required:'All required fields must be filled',
    err_quantity:'Please enter a valid quantity (min 1)',
    my_portfolio:'My Portfolio',
    current_value:'Current Value',
    gain_loss:'Gain / Loss',
    invested_total:'Total Invested',
    no_portfolio:'No approved investments yet',
    portfolio_summary:'Portfolio Summary',
    total_invested:'Total Invested',
    total_current:'Current Value',
    total_gain:'Overall Gain / Loss',
    profit:'Profit',
    loss:'Loss',
    neutral:'Neutral',
    account_deactivated:'Account Deactivated',
    contact_admin:'Contact your administrator to restore access.',
    deactivate_user:'Deactivate Account',
    activate_user:'Activate Account',
    deactivation_reason_lbl:'Reason for Deactivation',
    msg_user_activated:'✅ Account activated!',
    msg_user_deactivated:'Account deactivated.',
    suspended:'Suspended', archived:'Archived',
    profit_rate:'Monthly Profit %', profit_cycle:'Profit Cycle',
    cycle_monthly:'Monthly', cycle_quarterly:'Quarterly', cycle_yearly:'Yearly',
    profit_per_share:'Profit/Share/Cycle', earning_label:'Your Est. Earnings',
    archive_share:'Archive Share', unarchive_share:'Unarchive',
    show_archived:'Show Archived', hide_archived:'Hide Archived',
    msg_share_archived:'Share archived.',
    msg_share_perm_del:'Share permanently deleted.',
    confirm_archive:'Archive this share? It will be hidden from investors.',
    confirm_perm_del:'Permanently delete this archived share? This CANNOT be undone.',
  },
  kin: {
    delete_read:'Siba ibyanditswe',
    delete_notif:'Siba ubu butumwa',
    confirm_delete_notif:'Siba iyi notification?',
    confirm_delete_read:'Siba notifications zose zisomwe?',
    welcome_back:'Murakaza Neza', sign_in_sub:'Injira mu konti yawe',
    create_account:'Fungura Konti', reg_sub:"Iyandikishe nk'umutumateri",
    email:'Imeyili', email_ph:'Injiza imeyili yawe',
    password:"Ijambo ry'ibanga", password_ph:"Injiza ijambo ry'ibanga",
    role:'Hitamo Uruhare', choose_role:'Hitamo uruhare rwawe',
    r_admin:'Umuyobozi', r_manager:"Umugenzuzi w'Ibanki",
    r_bank_manager:"Umugenzuzi w'Ibanki", r_investor:'Umutumateri',
    sign_in:'Injira', no_account:'Nufite konti?',
    register_now:' Iyandikishe', back_login:'← Subira Injira',
    full_name:'Amazina Yuzuye', name_ph:'Injiza amazina yawe',
    phone:'Telefoni', register:'Fungura Konti',
    demo_creds:"Amakuru y'Igerageza",
    dashboard:'Ikibaho', shares:'Imigabane Iboneka',
    my_requests:'Ibisabwa Byanjye', manage_requests:'Gucunga Ibisabwa',
    manage_users:'Gucunga Abakoresha', reports:'Raporo',
    total_users:'Abakoresha Bose', total_managers:'Abagenzuzi',
    total_investors:'Abaturamteri', active_shares:'Imigabane Ikoreshwa',
    pending_requests:'Bitegereje', total_volume:'Amafaranga Yose',
    my_shares_listed:'Nanditse', pending:'Bitegereje',
    approved:'Byemejwe', bank_revenue:'Umusaruro',
    my_requests_total:'Ibisabwa Byanjye', invested_total:'Nishyuye Yose',
    unread_notifs:'Ubutumwa', recent_activity:'Ibikorwa Bya Vuba',
    available_shares:'Imigabane Iboneka', add_share:'Ongeramo Imigabane',
    edit_share:'Hindura Imigabane', share_name:"Izina ry'Imigabane",
    bank:'Ibanki', total_shares:'Imigabane Yose', available:'Iboneka',
    price_per_share:'Igiciro / Igabane', currency:'Inzura',
    status:'Inzira', active:'Ikoreshwa', inactive:'Ntikoresha',
    description:'Ibisobanuro', buy_shares:'Gura Imigabane',
    buy_now:'Gura Ubu', edit:'Hindura', delete:'Siba',
    quantity:'Ingano', total:'Igiteranyo',
    submit_request:'Ohereza Isaba',
    share:'Igabane', qty:'Umubare', date:'Itariki',
    actions:'Ibikorwa', investor:'Umutumateri', name:'Amazina',
    approve:'Emeza', reject:'Anze', reject_request:'Anze Isaba',
    rejection_reason:'Impamvu', rejection_ph:'Injiza impamvu…',
    add_manager:'Ongeramo Umugenzuzi', edit_user:'Hindura',
    save:'Bika', cancel:'Hagarika', confirm:'Emeza',
    confirm_delete:'Urishaka gusiba? Ntibizasubuka.',
    notifications:'Ubutumwa', mark_all_read:'Shyira byose bisomwa',
    no_notifications:'Nta butumwa', all:'Byose', rejected:'Byanzwe',
    msg_submitted:'✅ Isaba ryoherejwe!',
    msg_approved:'✅ Isaba ryemejwe!',
    msg_rejected:'Isaba ryanzwe.',
    msg_share_saved:'✅ Imigabane yabitswe!',
    msg_share_del:'Imigabane yasibwe.',
    msg_user_saved:'✅ Umukoresha yabitswe!',
    msg_user_del:'Umukoresha wanzwe.',
    msg_registered:'✅ Konti yafunguwe! Injira.',
    no_shares:'Nta migabane iboneka',
    no_requests:'Nta bisabwa biboneka',
    no_users:'Nta bakoresha biboneka',
    invalid_creds:'Imeyili cyangwa ijambo sibyo',
    email_exists:'Imeyili isanzwe yanditswe',
    account_locked:'Konti ifunzwe. Gerageza mu minota 15.',
    err_required:'Injiza ibisabwa byose',
    err_quantity:'Injiza umubare wemewe (nibura 1)',
    my_portfolio:'Imigabane Yanjye',
    current_value:'Agaciro Gasanzwe',
    gain_loss:'Inyungu / Igihombo',
    no_portfolio:'Nta migabane yemejwe',
    portfolio_summary:'Incamake y\'Imigabane',
    total_invested:'Nishyuye Yose',
    total_current:'Agaciro Gasanzwe',
    total_gain:'Inyungu / Igihombo Yose',
    profit:'Inyungu',
    loss:'Igihombo',
    neutral:'Ntanimpinduka',
    account_deactivated:'Konti Yanduwe',
    contact_admin:'Baza umuyobozi kugira ngo konti yawe isubizwe.',
    deactivate_user:'Fata Konti',
    activate_user:'Fungura Konti',
    deactivation_reason_lbl:'Impamvu yo Gufata Konti',
    msg_user_activated:'✅ Konti ifunguwe!',
    msg_user_deactivated:'Konti yanduwe.',
    suspended:'Ihagaritswe', archived:'Yabitswe',
    profit_rate:'Inyungu ya Buri Kwezi (%)', profit_cycle:'Inshuro yo Gutunga',
    cycle_monthly:'Buri Kwezi', cycle_quarterly:'Buri Gihembwe', cycle_yearly:'Buri Mwaka',
    profit_per_share:'Inyungu/Igabane', earning_label:'Inyungu Uzunguka',
    archive_share:'Bika Imigabane', unarchive_share:'Subiza',
    show_archived:'Erekana Byabitswe', hide_archived:'Hisha Byabitswe',
    msg_share_archived:'Imigabane yabitswe.',
    msg_share_perm_del:'Imigabane yasibwe burundu.',
    confirm_archive:'Bika iyi migabane? Abaturamteri ntibazayibona.',
    confirm_perm_del:'Siba burundu iyi migabane yabitswe? NTIBIZASUBUKA.',
  }
};

// ── State ──────────────────────────────────────────────────────
const S = {
  lang:        localStorage.getItem('bs_lang')  || 'en',
  theme:       localStorage.getItem('bs_theme') || 'dark',
  user:        null,
  shares:      [],
  banks:       [],
  page:        'dashboard',
  editShareId: null,
  editUserId:  null,
  confirmCb:   null,
  notifTimer:  null,
  currentBuyShare: null,
  showArchived: false,
};

// ── Core helpers ───────────────────────────────────────────────
const t      = k => T[S.lang][k] || T.en[k] || k;
const $      = s => document.querySelector(s);
const $$     = s => document.querySelectorAll(s);
const fmt    = n => new Intl.NumberFormat().format(Math.round(Number(n)||0));
const fmtD   = d => {
  try { return new Date(d).toLocaleDateString(S.lang==='kin'?'fr-RW':'en-US', {year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}); }
  catch { return String(d); }
};
const fmtAgo = d => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff/60000);
  if (m < 1)  return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m/60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h/24) + 'd ago';
};
const ROLE_MAP  = { admin:'r_admin', bank_manager:'r_manager', investor:'r_investor' };
const roleText  = role => t(ROLE_MAP[role] || role);
const sameId    = (a, b) => String(a) === String(b);

// Notification type → icon + accent color
const NOTIF_ICON = {
  success: { icon:'fa-check-circle',    color:'var(--ok)'  },
  danger:  { icon:'fa-times-circle',    color:'#ff4d4f'    },
  warning: { icon:'fa-exclamation-circle', color:'#faad14' },
  info:    { icon:'fa-info-circle',     color:'var(--acc)' },
};

// ── API helper ─────────────────────────────────────────────────
async function api(method, url, body) {
  const opt = { method, headers:{'Content-Type':'application/json'}, credentials:'same-origin' };
  if (body !== undefined) opt.body = JSON.stringify(body);
  const r = await fetch(url, opt);
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || r.statusText || 'Server error');
  return d;
}

// ── Toast notifications ────────────────────────────────────────
function toast(msg, type = 'ok') {
  const ICONS = { ok:'fa-check-circle', er:'fa-times-circle', in:'fa-info-circle', wa:'fa-exclamation-circle' };
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  const icon = document.createElement('i'); icon.className = 'fas ' + (ICONS[type]||ICONS.in);
  const span = document.createElement('span'); span.textContent = msg;
  const btn  = document.createElement('button'); btn.className = 'toast-x'; btn.textContent = '×';
  btn.addEventListener('click', () => el.remove());
  el.append(icon, span, btn);
  const container = $('#toasts');
  if (container) container.appendChild(el);
  setTimeout(() => { el.style.animation='fadeOut .28s ease forwards'; setTimeout(()=>el.remove(),300); }, 4500);
}

// ── Modal helpers ──────────────────────────────────────────────
function openMod(id)  { const el=$('#'+id); if(el) el.classList.remove('hidden'); }
function closeMod(id) { const el=$('#'+id); if(el) el.classList.add('hidden'); }

// ── Theme ──────────────────────────────────────────────────────
function applyTheme() {
  document.documentElement.setAttribute('data-theme', S.theme);
  const dark = S.theme === 'dark';
  $$('.fa-moon,.fa-sun').forEach(i => { i.className = dark ? 'fas fa-moon' : 'fas fa-sun'; });
}
function toggleTheme() {
  S.theme = S.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('bs_theme', S.theme);
  applyTheme();
}

// ── Language ───────────────────────────────────────────────────
function toggleLang() {
  S.lang = S.lang === 'en' ? 'kin' : 'en';
  localStorage.setItem('bs_lang', S.lang);
  document.documentElement.lang = S.lang === 'kin' ? 'rw' : 'en';
  applyI18n();
  if (S.user) { buildSidebar(); loadPage(S.page); }
}
function applyI18n() {
  $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $$('[data-tp]').forEach(el => { el.placeholder = t(el.dataset.tp); });
  ['a-lang-lbl','lang-lbl'].forEach(id => { const el=$('#'+id); if(el) el.textContent = S.lang.toUpperCase(); });
  if ($('#page-ttl') && S.user) $('#page-ttl').textContent = t(S.page.replace(/-/g,'_'));
}

// ── Auth ───────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const d = await api('GET', '/api/auth/me');
    if (d.user) { S.user = d.user; showApp(); return; }
  } catch(_) {}
  showAuth();
}
function showAuth() {
  $('#auth-container').classList.remove('hidden');
  $('#app').classList.add('hidden');
  stopNotifTimer();
}
function showApp() {
  $('#auth-container').classList.add('hidden');
  $('#app').classList.remove('hidden');
  buildSidebar();
  loadNotifs();
  goPage('dashboard');
  startNotifTimer();
}

async function doLogin(e) {
  e.preventDefault();
  const errEl = $('#l-err');
  const deactBox = $('#l-deact-box');
  errEl.classList.add('hidden');
  if (deactBox) deactBox.classList.add('hidden');
  const email    = ($('#l-email').value || '').trim();
  const password = $('#l-pass').value || '';
  const role     = $('#l-role').value || '';
  if (!email || !password || !role) {
    errEl.textContent = t('err_required'); errEl.classList.remove('hidden'); return;
  }
  try {
    const d = await api('POST', '/api/auth/login', { email, password, role });
    S.user = d.user;
    showApp();
  } catch(ex) {
    const msg = ex.message.toLowerCase();
    if (msg.includes('deactivated') && deactBox) {
      const reasonEl = $('#l-deact-reason');
      if (reasonEl) {
        // Extract reason after "Reason:" if present
        const match = ex.message.match(/Reason:\s*(.+)/);
        reasonEl.textContent = match ? match[1] : t('contact_admin');
      }
      deactBox.classList.remove('hidden');
    } else if (msg.includes('lock')) {
      errEl.textContent = t('account_locked');
      errEl.classList.remove('hidden');
    } else if (msg.includes('init')) {
      errEl.textContent = '⏳ Server is initializing… wait 5s and retry.';
      errEl.classList.remove('hidden');
    } else {
      errEl.textContent = t('invalid_creds');
      errEl.classList.remove('hidden');
    }
  }
}

async function doRegister(e) {
  e.preventDefault();
  const errEl = $('#r-err'), okEl = $('#r-ok');
  errEl.classList.add('hidden'); okEl.classList.add('hidden');
  const full_name = ($('#r-name').value  || '').trim();
  const email     = ($('#r-email').value || '').trim();
  const phone     = ($('#r-phone').value || '').trim();
  const password  = $('#r-pass').value || '';
  if (!full_name || !email || !password) {
    errEl.textContent = t('err_required'); errEl.classList.remove('hidden'); return;
  }
  try {
    await api('POST', '/api/auth/register', { full_name, email, phone, password });
    okEl.textContent = t('msg_registered'); okEl.classList.remove('hidden');
    setTimeout(() => $('#go-login').click(), 1800);
  } catch(ex) {
    errEl.textContent = ex.message.toLowerCase().includes('email') ? t('email_exists') : ex.message;
    errEl.classList.remove('hidden');
  }
}

async function doLogout() {
  await api('POST', '/api/auth/logout').catch(() => {});
  S.user = null; S.page = 'dashboard'; S.shares = []; S.banks = [];
  stopNotifTimer();
  showAuth();
}

// ── Sidebar ────────────────────────────────────────────────────
function buildSidebar() {
  const NAV = {
    admin:        [['dashboard','fa-chart-pie'],['shares','fa-layer-group'],['manage-requests','fa-clipboard-list'],['users','fa-users'],['reports','fa-chart-bar']],
    bank_manager: [['dashboard','fa-chart-pie'],['shares','fa-layer-group'],['manage-requests','fa-clipboard-list'],['reports','fa-chart-bar']],
    investor:     [['dashboard','fa-chart-pie'],['shares','fa-layer-group'],['my-requests','fa-receipt'],['my-portfolio','fa-chart-line']],
  };
  const nav = $('#sb-nav');
  nav.innerHTML = '';
  (NAV[S.user.role] || []).forEach(([p, ic]) => {
    const div = document.createElement('div');
    div.className = 'ni' + (S.page === p ? ' active' : '');
    div.dataset.p = p;
    div.innerHTML = '<i class="fas '+ic+'"></i><span>'+t(p.replace(/-/g,'_'))+'</span>';
    div.addEventListener('click', () => goPage(p));
    nav.appendChild(div);
  });
  $('#u-name').textContent = S.user.full_name;
  $('#u-role').textContent = roleText(S.user.role);
  $('#u-av').textContent   = S.user.full_name.charAt(0).toUpperCase();
}

function goPage(p) {
  S.page = p;
  $$('.page').forEach(x => x.classList.remove('active'));
  const pg = $('#pg-'+p); if (pg) pg.classList.add('active');
  $$('.ni').forEach(n => n.classList.toggle('active', n.dataset.p === p));
  $('#page-ttl').textContent = t(p.replace(/-/g,'_'));
  loadPage(p);
  if (window.innerWidth <= 768) closeSidebar();
}
function loadPage(p) {
  const MAP = { dashboard:loadDash, shares:loadShares, 'my-requests':loadMyReqs, 'manage-requests':loadMngReqs, users:loadUsers, reports:loadReports, 'my-portfolio':loadPortfolio };
  if (MAP[p]) MAP[p]();
}

// ── Mobile sidebar ─────────────────────────────────────────────
function openSidebar()  { $('#sidebar').classList.add('open');    $('#sb-overlay').classList.add('show'); }
function closeSidebar() { $('#sidebar').classList.remove('open'); $('#sb-overlay').classList.remove('show'); }

// ── Notification panel (real-time polling 10s) ─────────────────
function startNotifTimer() {
  stopNotifTimer();
  S.notifTimer = setInterval(loadNotifs, 10000);
}
function stopNotifTimer() {
  if (S.notifTimer) { clearInterval(S.notifTimer); S.notifTimer = null; }
}

async function loadNotifs() {
  if (!S.user) return;
  try {
    const list   = await api('GET', '/api/notifications');
    const unread = list.filter(n => !n.is_read).length;

    // Update badge
    const cnt = $('#notif-cnt');
    if (cnt) { cnt.textContent = unread; cnt.classList.toggle('hidden', unread === 0); }

    // Render notification list
    const panel = $('#notif-list');
    if (!panel) return;
    if (!list.length) {
      panel.innerHTML = '<div class="np-empty"><i class="fas fa-bell-slash"></i><p>'+t('no_notifications')+'</p></div>';
      return;
    }
    panel.innerHTML = list.map(n => {
  const ti   = NOTIF_ICON[n.type] || NOTIF_ICON.info;
  const cls  = 'np-item' + (n.is_read ? '' : ' unread');
  return '<div class="'+cls+'" data-notif-id="'+n.id+'">' +
    '<div class="np-icon" style="color:'+ti.color+'"><i class="fas '+ti.icon+'"></i></div>' +
    '<div class="np-body">' +
      '<div class="np-ttl">'+escHtml(n.title)+'</div>' +
      '<div class="np-msg">'+escHtml(n.message)+'</div>' +
      '<div class="np-time">'+fmtAgo(n.created_at)+'</div>' +
    '</div>' +
    '<div style="display:flex;gap:4px;">' +
      (n.is_read ? '' : '<button class="np-read-btn" data-action="read-one" data-id="'+n.id+'" title="Mark read">✓</button>') +
      '<button class="np-read-btn" data-action="delete-notif" data-id="'+n.id+'" title="Delete" style="color:var(--err)">✗</button>' +
    '</div>' +
  '</div>';
}).join('');
  } catch(_) {}
}

function escHtml(s) {
  const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
}

// ── Dashboard ──────────────────────────────────────────────────
async function loadDash() {
  const stats = await api('GET', '/api/stats').catch(() => ({}));
  const role  = S.user.role;
  const CARDS = {
    admin: [
      {ic:'fa-users',cl:'ic-bl',v:stats.total_users,l:'total_users'},
      {ic:'fa-user-tie',cl:'ic-or',v:stats.total_managers,l:'total_managers'},
      {ic:'fa-chart-line',cl:'ic-gn',v:stats.total_investors,l:'total_investors'},
      {ic:'fa-layer-group',cl:'ic-pu',v:stats.total_shares,l:'active_shares'},
      {ic:'fa-clock',cl:'ic-or',v:stats.pending_requests,l:'pending_requests'},
      {ic:'fa-money-bill-wave',cl:'ic-gn',v:fmt(stats.total_volume||0)+' RWF',l:'total_volume'},
    ],
    bank_manager: [
      {ic:'fa-layer-group',cl:'ic-bl',v:stats.my_shares,l:'my_shares_listed'},
      {ic:'fa-clock',cl:'ic-or',v:stats.pending,l:'pending'},
      {ic:'fa-check-circle',cl:'ic-gn',v:stats.approved,l:'approved'},
      {ic:'fa-money-bill-wave',cl:'ic-pu',v:fmt(stats.revenue||0)+' RWF',l:'bank_revenue'},
    ],
    investor: [
      {ic:'fa-receipt',cl:'ic-bl',v:stats.my_requests,l:'my_requests_total'},
      {ic:'fa-check-circle',cl:'ic-gn',v:stats.approved,l:'approved'},
      {ic:'fa-coins',cl:'ic-pu',v:fmt(stats.invested||0)+' RWF',l:'invested_total'},
      {ic:'fa-bell',cl:'ic-or',v:stats.unread,l:'unread_notifs'},
    ],
  };
  const grid = $('#stats-grid');
  grid.innerHTML = '';
  (CARDS[role]||[]).forEach(c => {
    const div = document.createElement('div');
    div.className = 'stat glass';
    div.innerHTML = '<div class="stat-ic '+c.cl+'"><i class="fas '+c.ic+'"></i></div>'+
      '<div><div class="stat-v">'+(c.v != null ? c.v : '–')+'</div><div class="stat-l">'+t(c.l)+'</div></div>';
    grid.appendChild(div);
  });

  const reqs = await api('GET', '/api/requests').catch(() => []);
  const wrap = $('#recent-wrap');
  if (!reqs.length) {
    wrap.innerHTML = '<div class="empty"><i class="fas fa-inbox"></i><p>'+t('no_requests')+'</p></div>'; return;
  }
  const isInv = role === 'investor';
  const hdrs  = isInv
    ? [t('share'),t('bank'),t('qty'),t('total'),t('status'),t('date')]
    : [t('investor'),t('share'),t('qty'),t('total'),t('status'),t('date')];
  wrap.innerHTML = '<table class="tbl"><thead><tr>'+hdrs.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
    reqs.slice(0,8).map(r => buildReqRow(r, isInv, false)).join('') + '</tbody></table>';
}

// ── Request row builder ────────────────────────────────────────
function buildReqRow(r, isInv, showActs) {
  const mc = isInv
    ? '<td>'+escHtml(r.share_name)+'</td><td>'+escHtml(r.bank_name)+'</td>'
    : '<td><strong>'+escHtml(r.investor_name)+'</strong><small style="display:block;color:var(--txt3)">'+escHtml(r.investor_email)+'</small></td>'+
      '<td>'+escHtml(r.share_name)+'<small style="display:block;color:var(--txt3)">'+escHtml(r.bank_name)+'</small></td>';

  const stBadge = '<span class="st st-'+r.status+'">'+t(r.status)+'</span>';
  let actCell = '';
  if (showActs) {
    actCell = r.status === 'pending'
      ? '<td class="td-acts">'+
          '<button class="btn btn-success btn-sm" data-action="approve" data-id="'+r.id+'"><i class="fas fa-check"></i> '+t('approve')+'</button> '+
          '<button class="btn btn-danger  btn-sm" data-action="reject"  data-id="'+r.id+'"><i class="fas fa-times"></i> '+t('reject')+'</button>'+
          '</td>'
      : '<td>'+stBadge+'</td>';
  }

  return '<tr>'+mc+
    '<td>'+fmt(r.quantity)+'</td>'+
    '<td>'+fmt(r.total_amount)+' '+(r.currency||'RWF')+'</td>'+
    (showActs ? '' : '<td>'+stBadge+'</td>')+
    '<td>'+fmtD(r.created_at)+'</td>'+
    actCell+'</tr>';
}

// ── Shares page ────────────────────────────────────────────────
async function loadShares() {
  try {
    const url = S.showArchived ? '/api/shares?archived=1' : '/api/shares';
    S.shares = await api('GET', url);
    // Load investor's approved requests for profit calc
    if (S.user.role === 'investor') {
      try {
        const reqs = await api('GET', '/api/requests');
        S.myApprovedShares = reqs.filter(r => r.status === 'approved');
      } catch { S.myApprovedShares = []; }
    }
  } catch { S.shares = []; }

  const addBtn = $('#add-share-btn');
  // Only bank_manager can add shares; admin and investor cannot
  if (addBtn) addBtn.classList.toggle('hidden', S.user.role !== 'bank_manager');

  // Show/hide archived toggle for admin
  const archBtn = $('#toggle-archived-btn');
  if (archBtn) {
    archBtn.classList.toggle('hidden', S.user.role !== 'admin');
    const lbl = $('#archived-btn-lbl');
    if (lbl) lbl.textContent = S.showArchived ? t('hide_archived') : t('show_archived');
  }

  // Show archived option in status select for admin
  const archOption = document.querySelector('#sh-status option[value="archived"]');
  if (archOption) archOption.style.display = S.user.role === 'admin' ? '' : 'none';

  const grid = $('#shares-grid');
  if (!S.shares.length) {
    grid.innerHTML = '<div class="empty"><i class="fas fa-layer-group"></i><p>'+t('no_shares')+'</p></div>'; return;
  }
  grid.innerHTML = '';
  S.shares.forEach(s => grid.appendChild(buildShareCard(s)));
}

function toggleArchived() {
  S.showArchived = !S.showArchived;
  loadShares();
}

function buildShareCard(s) {
  const pct    = s.total_shares > 0 ? Math.min(100, Math.round(s.available_shares/s.total_shares*100)) : 0;
  const isInv  = S.user.role === 'investor';
  const isAdmin= S.user.role === 'admin';
  const isArc  = s.status === 'archived';
  const card   = document.createElement('div');
  card.className = 'sc' + (isArc ? ' sc-archived' : '');

  // Profit display
  const profitRate = Number(s.profit_rate) || 0;
  const profitHtml = profitRate > 0
    ? '<div class="sc-row sc-profit"><span><i class="fas fa-percentage"></i> '+t('profit_rate')+'</span>'+
      '<span class="profit-badge">'+profitRate+'% / '+t('cycle_'+s.profit_cycle)+'</span></div>'
    : '';

  // Investor earning estimate (based on approved requests)
  let earningHtml = '';
  if (isInv && profitRate > 0) {
    const myReq = (S.myApprovedShares || []).find(r => String(r.share_id)===String(s.id));
    if (myReq) {
      const perCycle = (myReq.quantity * s.price_per_share * profitRate / 100);
      earningHtml = '<div class="sc-row sc-earning"><span>'+t('earning_label')+'</span>'+
        '<span style="color:var(--ok)">+'+fmt(perCycle)+' '+(s.currency||'RWF')+'/'+t('cycle_'+s.profit_cycle)+'</span></div>';
    }
  }

  let acts = '';
  if (isArc && isAdmin) {
    // Archived: only permanent delete button
    acts = '<button class="btn btn-danger btn-sm" data-action="perm-del-share" data-id="'+s.id+'"><i class="fas fa-trash"></i> Delete Forever</button>';
  } else if (isInv) {
    // Investor: buy if active & available
    acts = s.status==='active' && s.available_shares>0
      ? '<button class="btn btn-primary btn-sm" data-action="buy" data-id="'+s.id+'"><i class="fas fa-shopping-cart"></i> '+t('buy_now')+'</button>'
      : '<span style="color:var(--txt3);font-size:.8rem">Unavailable</span>';
  } else if (isAdmin) {
    // Admin: Deactivate/Activate toggle + Archive button (NO edit, NO add)
    const isOff = s.status === 'inactive' || s.status === 'suspended';
    const togBtn = isOff
      ? '<button class="btn btn-success btn-sm" data-action="activate-share" data-id="'+s.id+'"><i class="fas fa-toggle-on"></i> '+t('activate_user')+'</button>'
      : '<button class="btn btn-secondary btn-sm" data-action="deactivate-share" data-id="'+s.id+'"><i class="fas fa-toggle-off"></i> '+t('deactivate_user')+'</button>';
    acts = togBtn + ' <button class="btn btn-warning btn-sm" data-action="archive-share" data-id="'+s.id+'" title="'+t('archive_share')+'"><i class="fas fa-archive"></i></button>';
  } else {
    // Manager: Edit + Delete
    acts = '<button class="btn btn-secondary btn-sm" data-action="edit-share" data-id="'+s.id+'"><i class="fas fa-edit"></i> '+t('edit')+'</button>'+
           ' <button class="btn btn-danger btn-sm" data-action="del-share-mgr" data-id="'+s.id+'"><i class="fas fa-trash"></i></button>';
  }

  card.innerHTML =
    '<div class="sc-hd"><div><div class="sc-name">'+escHtml(s.share_name)+'</div>'+
    '<div class="sc-bank"><i class="fas fa-university"></i> '+escHtml(s.bank_name)+'</div></div>'+
    '<span class="st st-'+s.status+'">'+t(s.status)+'</span></div>'+
    '<div class="sc-price">'+fmt(s.price_per_share)+' '+(s.currency||'RWF')+'</div>'+
    '<div class="sc-row"><span>'+t('total_shares')+'</span><span>'+fmt(s.total_shares)+'</span></div>'+
    '<div class="sc-row"><span>'+t('available')+'</span><span style="color:var(--ok)">'+fmt(s.available_shares)+'</span></div>'+
    profitHtml + earningHtml +
    '<div class="prog"><div class="prog-fill" style="width:'+pct+'%"></div></div>'+
    '<div class="sc-row" style="font-size:.75rem;color:var(--txt3)"><span>'+pct+'% '+t('available').toLowerCase()+'</span></div>'+
    '<div class="sc-ft">'+acts+'</div>';
  return card;
}

// ── Event Delegation (permanent listeners on static containers) ─
function attachDelegates() {
  // Shares grid
  const grid = $('#shares-grid');
  if (grid) grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const { action, id } = btn.dataset;
    if (action==='buy')                 openBuy(id);
    else if (action==='edit-share')     openEditShare(id);
    else if (action==='archive-share')  archiveShare(id);
    else if (action==='perm-del-share') permDelShare(id);
    else if (action==='activate-share')   toggleShareStatus(id, 'active');
    else if (action==='deactivate-share') toggleShareStatus(id, 'inactive');
    else if (action==='del-share-mgr')    delShareManager(id);
    // Mu mwanya wa attachDelegates(), ongeraho iyi portion:

// Notification panel: delete one
const notifList = $('#notif-list');
if (notifList) {
  notifList.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const { action, id } = btn.dataset;
    
    if (action === 'read-one') {
      e.stopPropagation();
      await api('PUT', '/api/notifications/' + id + '/read').catch(() => {});
      loadNotifs();
    }
    
    // ⚠️ ONGERAHO IKI GICE GISHYA:
    else if (action === 'delete-notif') {
      e.stopPropagation();
      if (confirm('Siba iyi notification?')) {
        await api('DELETE', '/api/notifications/' + id).catch(() => {});
        loadNotifs();
      }
    }
  });
}
  });

  // Manage requests table body
  const mngBody = $('#mng-req-body');
  if (mngBody) mngBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const { action, id } = btn.dataset;
    if (action==='approve') doApprove(id);
    else if (action==='reject') openRej(id);
  });

  // Users table body
  const usersBody = $('#users-body');
  if (usersBody) usersBody.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const { action, id } = btn.dataset;
    if (action==='edit-user') openEditUser(id);
    else if (action==='del-user')  delUser(id);
    else if (action==='act-user')  activateUser(id);
  });

  // Notification panel: mark one read
  const notifList = $('#notif-list');
  if (notifList) notifList.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action="read-one"]'); if (!btn) return;
    e.stopPropagation();
    const id = btn.dataset.id;
    await api('PUT', '/api/notifications/'+id+'/read').catch(() => {});
    loadNotifs();
  });
}

// ── Buy Share modal ────────────────────────────────────────────
async function openBuy(sid) {
  // Always fetch fresh to get latest available count
  try { S.shares = await api('GET', '/api/shares'); } catch { S.shares = []; }
  const s = S.shares.find(x => sameId(x.id, sid));
  if (!s) { toast('Share not found', 'er'); return; }

  S.currentBuyShare = s;

  // Reset form completely
  $('#buy-form').reset();
  const qtyEl = $('#buy-qty');
  const errEl = $('#buy-err');

  $('#buy-sid').value       = s.id;
  qtyEl.value               = '';
  qtyEl.min                 = '1';
  qtyEl.max                 = String(s.available_shares);
  qtyEl.removeAttribute('required'); // avoid browser native required tooltip interfering
  errEl.classList.add('hidden');

  $('#s-price').textContent = fmt(s.price_per_share) + ' ' + (s.currency||'RWF');
  $('#s-qty').textContent   = '0';
  $('#s-total').textContent = '0 ' + (s.currency||'RWF');

  $('#buy-info').innerHTML =
    '<div class="bi-row"><span>'+t('share')+'</span><strong>'+escHtml(s.share_name)+'</strong></div>'+
    '<div class="bi-row"><span>'+t('bank')+'</span><span>'+escHtml(s.bank_name)+'</span></div>'+
    '<div class="bi-row"><span>'+t('price_per_share')+'</span>'+
    '<strong style="color:var(--acc)">'+fmt(s.price_per_share)+' '+(s.currency||'RWF')+'</strong></div>'+
    '<div class="bi-row"><span>'+t('available')+'</span>'+
    '<span style="color:var(--ok)">'+fmt(s.available_shares)+' shares</span></div>';

  // Live total on input
  qtyEl.oninput = () => {
    const q = Math.max(0, parseInt(qtyEl.value) || 0);
    $('#s-qty').textContent   = fmt(q);
    $('#s-total').textContent = fmt(q * s.price_per_share) + ' ' + (s.currency||'RWF');
  };

  openMod('buy-ov');
  setTimeout(() => qtyEl.focus(), 120);
}

// ── Submit Request ─────────────────────────────────────────────
let _buyInProgress = false; // guard against accidental double-submit
async function doBuy(e) {
  e.preventDefault();
  if (_buyInProgress) return;

  const errEl = $('#buy-err');
  errEl.classList.add('hidden');

  const share_id = parseInt($('#buy-sid').value);
  const qtyRaw   = ($('#buy-qty').value || '').trim();
  const quantity = parseInt(qtyRaw);

  // Validate
  if (!share_id) {
    errEl.textContent = t('err_required');
    errEl.classList.remove('hidden');
    return;
  }
  if (!qtyRaw || isNaN(quantity) || quantity < 1) {
    errEl.textContent = t('err_quantity');
    errEl.classList.remove('hidden');
    $('#buy-qty').focus();
    return;
  }
  if (S.currentBuyShare && quantity > S.currentBuyShare.available_shares) {
    errEl.textContent = 'Only ' + fmt(S.currentBuyShare.available_shares) + ' shares available';
    errEl.classList.remove('hidden');
    return;
  }

  // Lock UI
  _buyInProgress = true;
  const submitBtn = e.target.querySelector('[type=submit]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…'; }

  try {
    await api('POST', '/api/requests', { share_id, quantity });
    closeMod('buy-ov');
    toast(t('msg_submitted'), 'ok');
    S.currentBuyShare = null;
    loadNotifs();
    if      (S.page === 'shares')      loadShares();
    else if (S.page === 'dashboard')   loadDash();
    else if (S.page === 'my-requests') loadMyReqs();
  } catch(ex) {
    errEl.textContent = ex.message;
    errEl.classList.remove('hidden');
  } finally {
    _buyInProgress = false;
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-check"></i> <span>'+t('submit_request')+'</span>'; }
  }
}

// ── Share CRUD ─────────────────────────────────────────────────
async function loadBanksIntoSel(sel, selId) {
  if (!S.banks.length) S.banks = await api('GET', '/api/banks').catch(() => []);
  const el = $(sel); if (!el) return;
  el.innerHTML = '<option value="">— Select bank —</option>' +
    S.banks.map(b => '<option value="'+b.id+'"'+(selId != null && sameId(b.id,selId) ? ' selected' : '')+'>'+escHtml(b.name)+'</option>').join('');
}

async function openAddShare() {
  S.editShareId = null;
  $('#share-form').reset(); $('#sh-id').value = '';
  $('#sh-err').classList.add('hidden');
  $('#share-mod-ttl span').textContent = t('add_share');
  if (S.user.role === 'admin') { await loadBanksIntoSel('#sh-bank'); $('#sh-bank-grp').style.display='block'; }
  else $('#sh-bank-grp').style.display = 'none';
  openMod('share-ov');
  setTimeout(() => $('#sh-name').focus(), 120);
}

async function openEditShare(sid) {
  if (!S.shares.length) { try { S.shares=await api('GET','/api/shares'); } catch { S.shares=[]; } }
  const s = S.shares.find(x => sameId(x.id, sid)); if (!s) { toast('Share not found','er'); return; }
  S.editShareId = s.id;
  $('#sh-id').value    = s.id;    $('#sh-name').value  = s.share_name;
  $('#sh-total').value = s.total_shares; $('#sh-avail').value = s.available_shares;
  $('#sh-price').value = s.price_per_share; $('#sh-cur').value = s.currency||'RWF';
  $('#sh-status').value= s.status; $('#sh-desc').value  = s.description||'';
  $('#sh-profit-rate').value = Number(s.profit_rate)||0;
  $('#sh-profit-cycle').value = s.profit_cycle || 'monthly';
  // Only show archived option for admin
  const archOpt = document.querySelector('#sh-status option[value="archived"]');
  if (archOpt) archOpt.style.display = S.user.role==='admin' ? '' : 'none';
  $('#sh-err').classList.add('hidden');
  $('#share-mod-ttl span').textContent = t('edit_share');
  if (S.user.role === 'admin') { await loadBanksIntoSel('#sh-bank', s.bank_id); $('#sh-bank-grp').style.display='block'; }
  else $('#sh-bank-grp').style.display = 'none';
  openMod('share-ov');
}

async function doShareSave(e) {
  e.preventDefault();
  const errEl = $('#sh-err'); errEl.classList.add('hidden');
  const share_name = ($('#sh-name').value||'').trim();
  if (!share_name) { errEl.textContent=t('err_required'); errEl.classList.remove('hidden'); return; }
  const body = {
    share_name,
    bank_id:          $('#sh-bank').value || undefined,
    total_shares:     Number($('#sh-total').value),
    available_shares: Number($('#sh-avail').value),
    price_per_share:  Number($('#sh-price').value),
    currency:         $('#sh-cur').value || 'RWF',
    status:           $('#sh-status').value || 'active',
    description:      ($('#sh-desc').value||'').trim(),
    profit_rate:      Number($('#sh-profit-rate').value)||0,
    profit_cycle:     $('#sh-profit-cycle').value || 'monthly',
  };
  if (!body.price_per_share) { errEl.textContent=t('err_required'); errEl.classList.remove('hidden'); return; }
  try {
    if (S.editShareId) await api('PUT',  '/api/shares/'+S.editShareId, body);
    else               await api('POST', '/api/shares', body);
    closeMod('share-ov'); toast(t('msg_share_saved'),'ok'); loadShares();
  } catch(ex) { errEl.textContent=ex.message; errEl.classList.remove('hidden'); }
}

function archiveShare(id) {
  $('#conf-msg').textContent = t('confirm_archive');
  S.confirmCb = async () => {
    try {
      await api('PATCH','/api/shares/'+id+'/archive');
      closeMod('conf-ov'); toast(t('msg_share_archived'),'in'); loadShares();
    } catch(ex) { toast(ex.message,'er'); }
  };
  openMod('conf-ov');
}

function permDelShare(id) {
  $('#conf-msg').textContent = t('confirm_perm_del');
  S.confirmCb = async () => {
    try {
      await api('DELETE','/api/shares/'+id);
      closeMod('conf-ov'); toast(t('msg_share_perm_del'),'wa'); loadShares();
    } catch(ex) { toast(ex.message,'er'); }
  };
  openMod('conf-ov');
}

// Admin: toggle share active/inactive without editing
async function toggleShareStatus(id, newStatus) {
  const share = S.shares.find(x => String(x.id)===String(id));
  if (!share) return;
  const label = newStatus==='active' ? t('activate_user') : t('deactivate_user');
  $('#conf-msg').textContent = label + ' "' + share.share_name + '"?';
  S.confirmCb = async () => {
    try {
      await api('PUT', '/api/shares/'+id, {
        share_name: share.share_name,
        total_shares: share.total_shares,
        available_shares: share.available_shares,
        price_per_share: share.price_per_share,
        currency: share.currency,
        status: newStatus,
        description: share.description || '',
        profit_rate: share.profit_rate || 0,
        profit_cycle: share.profit_cycle || 'monthly',
      });
      closeMod('conf-ov');
      toast(newStatus==='active' ? t('msg_user_activated') : t('msg_user_deactivated'), newStatus==='active'?'ok':'in');
      loadShares();
    } catch(ex) { toast(ex.message,'er'); }
  };
  openMod('conf-ov');
}

// Manager: delete share (with purchase-request guard from API)
function delShareManager(id) {
  const share = S.shares.find(x => String(x.id)===String(id));
  const name = share ? share.share_name : 'this share';
  $('#conf-msg').textContent = t('confirm_delete') + '\n"' + name + '"';
  S.confirmCb = async () => {
    try {
      // Manager routes through archive first if requests exist; API returns error if blocked
      await api('DELETE', '/api/shares/'+id);
      closeMod('conf-ov'); toast(t('msg_share_del'),'in'); loadShares();
    } catch(ex) { closeMod('conf-ov'); toast(ex.message,'er'); }
  };
  openMod('conf-ov');
}

// ── My Requests (investor) ─────────────────────────────────────
async function loadMyReqs() {
  const reqs = await api('GET', '/api/requests').catch(() => []);
  const tb = $('#my-req-body');
  tb.innerHTML = !reqs.length
    ? '<tr><td colspan="6" class="empty"><i class="fas fa-inbox"></i><p>'+t('no_requests')+'</p></td></tr>'
    : reqs.map(r => buildReqRow(r, true, false)).join('');
}

// ── Manage Requests (manager/admin) ───────────────────────────
async function loadMngReqs(filter) {
  let reqs = await api('GET', '/api/requests').catch(() => []);
  if (filter) reqs = reqs.filter(r => r.status === filter);
  const tb = $('#mng-req-body');
  tb.innerHTML = !reqs.length
    ? '<tr><td colspan="7" class="empty"><i class="fas fa-inbox"></i><p>'+t('no_requests')+'</p></td></tr>'
    : reqs.map(r => buildReqRow(r, false, true)).join('');
}

async function doApprove(id) {
  try {
    await api('PUT', '/api/requests/'+id+'/approve');
    toast(t('msg_approved'),'ok');
    const f = $('#req-filter'); loadMngReqs(f ? f.value : '');
    await loadNotifs();
  } catch(ex) { toast(ex.message,'er'); }
}

function openRej(id) {
  $('#rej-id').value = id; $('#rej-reason').value = '';
  openMod('rej-ov'); setTimeout(() => $('#rej-reason').focus(), 120);
}

async function doReject(e) {
  e.preventDefault();
  const id     = $('#rej-id').value;
  const reason = ($('#rej-reason').value||'').trim();
  if (!reason) { toast('Please enter a reason','wa'); return; }
  try {
    await api('PUT', '/api/requests/'+id+'/reject', { reason });
    closeMod('rej-ov'); toast(t('msg_rejected'),'in');
    const f = $('#req-filter'); loadMngReqs(f ? f.value : '');
    await loadNotifs();
  } catch(ex) { toast(ex.message,'er'); }
}

// ── Users (admin) ──────────────────────────────────────────────
async function loadUsers() {
  const users = await api('GET', '/api/users').catch(() => []);
  const badge = r => ({admin:'bg-red',bank_manager:'bg-org',investor:'bg-grn'}[r]||'bg-blu');
  const tb = $('#users-body');
  tb.innerHTML = '';
  if (!users.length) { tb.innerHTML='<tr><td colspan="6" class="empty"><p>'+t('no_users')+'</p></td></tr>'; return; }
  users.forEach(u => {
    const tr = document.createElement('tr');
    const statusCell = u.is_active
      ? '<span class="st st-active">'+t('active')+'</span>'
      : '<span class="st st-inactive" title="'+(u.deactivation_reason ? escHtml(u.deactivation_reason) : '')+'" style="cursor:help">'+t('inactive')+(u.deactivation_reason ? ' ⓘ' : '')+'</span>';
    const toggleBtn = sameId(u.id,S.user.id) ? '' :
      (u.is_active
        ? ' <button class="btn btn-danger btn-sm" data-action="del-user" data-id="'+u.id+'"><i class="fas fa-user-slash"></i></button>'
        : ' <button class="btn btn-success btn-sm" data-action="act-user" data-id="'+u.id+'"><i class="fas fa-user-check"></i></button>');
    tr.innerHTML =
      '<td>'+escHtml(u.full_name)+'</td>'+
      '<td>'+escHtml(u.email)+'</td>'+
      '<td><span class="badge '+badge(u.role)+'">'+roleText(u.role)+'</span></td>'+
      '<td>'+(u.bank_name ? escHtml(u.bank_name) : '–')+'</td>'+
      '<td>'+statusCell+'</td>'+
      '<td class="td-acts">'+
        '<button class="btn btn-secondary btn-sm" data-action="edit-user" data-id="'+u.id+'"><i class="fas fa-edit"></i></button>'+
        toggleBtn+
      '</td>';
    $('#users-body').appendChild(tr);
  });
}

async function openAddUser() {
  S.editUserId = null;
  $('#user-form').reset(); $('#u-eid').value='';
  $('#u-err').classList.add('hidden');
  $('#user-mod-ttl span').textContent = t('add_manager');
  $('#u-email-grp').style.display='block'; $('#u-pass-grp').style.display='block';
  await loadBanksIntoSel('#u-bank');
  openMod('user-ov'); setTimeout(() => $('#uf-name').focus(), 120);
}

async function openEditUser(id) {
  try {
    const users = await api('GET', '/api/users');
    const u = users.find(x => sameId(x.id, id)); if (!u) { toast('User not found','er'); return; }
    S.editUserId = u.id;
    $('#u-eid').value  = u.id; $('#uf-name').value = u.full_name; $('#u-phone').value = u.phone||'';
    $('#u-err').classList.add('hidden');
    $('#user-mod-ttl span').textContent = t('edit_user');
    $('#u-email-grp').style.display='none'; $('#u-pass-grp').style.display='none';
    await loadBanksIntoSel('#u-bank', u.bank_id);
    openMod('user-ov'); setTimeout(() => $('#uf-name').focus(), 120);
  } catch(ex) { toast(ex.message,'er'); }
}

async function doUserSave(e) {
  e.preventDefault();
  const errEl = $('#u-err'); errEl.classList.add('hidden');
  const full_name = ($('#uf-name').value||'').trim();
  if (!full_name) { errEl.textContent=t('err_required'); errEl.classList.remove('hidden'); return; }
  const phone   = ($('#u-phone').value||'').trim();
  const bank_id = $('#u-bank').value || null;
  try {
    if (S.editUserId) {
      await api('PUT', '/api/users/'+S.editUserId, { full_name, phone, role:'bank_manager', bank_id, is_active:1 });
    } else {
      const email    = ($('#u-email').value||'').trim();
      const password = $('#u-pass').value || 'manager123';
      if (!email) { errEl.textContent=t('err_required'); errEl.classList.remove('hidden'); return; }
      await api('POST', '/api/users', { full_name, email, phone, password, role:'bank_manager', bank_id });
    }
    closeMod('user-ov'); toast(t('msg_user_saved'),'ok'); loadUsers();
  } catch(ex) {
    errEl.textContent = ex.message.toLowerCase().includes('email') ? t('email_exists') : ex.message;
    errEl.classList.remove('hidden');
  }
}

function delUser(id) {
  if (sameId(id, S.user.id)) { toast('Cannot deactivate yourself','wa'); return; }
  // Open deactivation reason modal
  $('#deact-uid').value = id;
  $('#deact-reason').value = '';
  const errEl = $('#deact-err');
  if (errEl) errEl.classList.add('hidden');
  openMod('deact-ov');
  setTimeout(() => $('#deact-reason').focus(), 120);
}

async function doDeactivate(e) {
  e.preventDefault();
  const id     = $('#deact-uid').value;
  const reason = ($('#deact-reason').value || '').trim();
  const errEl  = $('#deact-err');
  if (!reason) {
    if (errEl) { errEl.textContent = t('err_required'); errEl.classList.remove('hidden'); }
    return;
  }
  try {
    await api('DELETE', '/api/users/'+id, { reason });
    closeMod('deact-ov');
    toast(t('msg_user_deactivated'), 'in');
    loadUsers();
  } catch(ex) {
    if (errEl) { errEl.textContent = ex.message; errEl.classList.remove('hidden'); }
  }
}

async function activateUser(id) {
  try {
    await api('PUT', '/api/users/'+id+'/activate');
    toast(t('msg_user_activated'), 'ok');
    loadUsers();
  } catch(ex) { toast(ex.message, 'er'); }
}

// ── My Portfolio (investor) ────────────────────────────────────
async function loadPortfolio() {
  const rows = await api('GET', '/api/requests/portfolio').catch(() => []);
  const tb   = $('#portfolio-body');
  const sumEl = $('#portfolio-summary');

  if (!rows.length) {
    if (tb) tb.innerHTML = '<tr><td colspan="7" class="empty"><i class="fas fa-chart-line"></i><p>'+t('no_portfolio')+'</p></td></tr>';
    if (sumEl) sumEl.innerHTML = '';
    return;
  }

  // Summary totals
  const totalInvested = rows.reduce((s,r) => s + Number(r.invested), 0);
  const totalCurrent  = rows.reduce((s,r) => s + Number(r.current_value), 0);
  const totalGain     = totalCurrent - totalInvested;
  const gainPct       = totalInvested > 0 ? ((totalGain / totalInvested) * 100).toFixed(2) : '0.00';
  const gainColor     = totalGain > 0 ? 'var(--ok)' : totalGain < 0 ? 'var(--err)' : 'var(--txt2)';
  const gainIcon      = totalGain > 0 ? 'fa-arrow-trend-up' : totalGain < 0 ? 'fa-arrow-trend-down' : 'fa-minus';

  if (sumEl) {
    sumEl.innerHTML =
      '<div class="stat glass"><div class="stat-ic ic-bl"><i class="fas fa-coins"></i></div>'+
      '<div><div class="stat-v">'+fmt(totalInvested)+' RWF</div><div class="stat-l">'+t('total_invested')+'</div></div></div>'+
      '<div class="stat glass"><div class="stat-ic ic-pu"><i class="fas fa-chart-bar"></i></div>'+
      '<div><div class="stat-v">'+fmt(totalCurrent)+' RWF</div><div class="stat-l">'+t('total_current')+'</div></div></div>'+
      '<div class="stat glass"><div class="stat-ic" style="background:'+gainColor+'22;color:'+gainColor+'"><i class="fas '+gainIcon+'"></i></div>'+
      '<div><div class="stat-v" style="color:'+gainColor+'">'+(totalGain>=0?'+':'')+fmt(totalGain)+' RWF <small>('+gainPct+'%)</small></div>'+
      '<div class="stat-l">'+t('total_gain')+'</div></div></div>';
  }

  if (tb) {
    tb.innerHTML = rows.map(r => {
      const gain      = Number(r.gain);
      const gainPct   = r.gain_pct;
      const gainColor = gain > 0 ? 'var(--ok)' : gain < 0 ? 'var(--err)' : 'var(--txt2)';
      const gainLabel = (gain >= 0 ? '+' : '') + fmt(gain) + ' RWF <small>('+gainPct+'%)</small>';
      return '<tr>'+
        '<td><strong>'+escHtml(r.share_name)+'</strong></td>'+
        '<td>'+escHtml(r.bank_name)+'</td>'+
        '<td>'+fmt(r.quantity)+'</td>'+
        '<td>'+fmt(r.invested)+' '+(r.currency||'RWF')+'</td>'+
        '<td>'+fmt(r.current_value)+' '+(r.currency||'RWF')+'</td>'+
        '<td style="color:'+gainColor+';font-weight:600">'+gainLabel+'</td>'+
        '<td>'+fmtD(r.created_at)+'</td>'+
      '</tr>';
    }).join('');
  }
}


async function loadReports() {
  const d = await api('GET', '/api/stats/reports').catch(() => ({byStatus:[],topShares:[]}));
  const lbl = { pending:t('pending'), approved:t('approved'), rejected:t('rejected') };
  const total = d.byStatus.reduce((s,r)=>s+(Number(r.cnt)||0), 0);
  $('#reports-grid').innerHTML =
    '<div class="rcard glass"><h4><i class="fas fa-chart-pie"></i> '+t('manage_requests')+' ('+total+')</h4>'+
    (d.byStatus.map(r=>'<div class="rrow"><span class="st st-'+r.status+'">'+(lbl[r.status]||r.status)+'</span>'+
      '<span class="rval">'+fmt(r.cnt)+' requests &nbsp;('+fmt(r.total)+' RWF)</span></div>').join('')||'<p class="no-data">No data yet</p>')+
    '</div>'+
    '<div class="rcard glass"><h4><i class="fas fa-trophy"></i> Top Shares by Revenue</h4>'+
    (d.topShares.map((s,i)=>'<div class="rrow">'+
      '<span>#'+(i+1)+' '+escHtml(s.share_name)+' <small style="color:var(--txt3)">('+escHtml(s.bank_name)+')</small></span>'+
      '<span class="rval" style="color:var(--ok)">'+fmt(s.revenue)+' RWF</span></div>').join('')||'<p class="no-data">No data yet</p>')+
    '</div>';
}

// ── DOM Ready ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(); applyI18n(); checkAuth();

  // Auth
  $('#login-form').addEventListener('submit', doLogin);
  $('#reg-form').addEventListener('submit', doRegister);
  $('#go-reg').addEventListener('click',   e => { e.preventDefault(); $('#login-box').classList.add('hidden');  $('#reg-box').classList.remove('hidden'); });
  $('#go-login').addEventListener('click', e => { e.preventDefault(); $('#reg-box').classList.add('hidden');   $('#login-box').classList.remove('hidden'); });
  $$('.cred').forEach(c => c.addEventListener('click', () => {
    $('#l-email').value=c.dataset.e; $('#l-pass').value=c.dataset.p; $('#l-role').value=c.dataset.r;
  }));

  // Theme + Lang
  ['a-theme','theme-btn'].forEach(id => { const el=$('#'+id); if(el) el.addEventListener('click', toggleTheme); });
  ['a-lang','lang-btn'].forEach(id   => { const el=$('#'+id); if(el) el.addEventListener('click', toggleLang); });

  // Logout + mobile
  $('#logout-btn').addEventListener('click', doLogout);
  $('#menu-btn').addEventListener('click', openSidebar);
  $('#sb-overlay').addEventListener('click', closeSidebar);

  // Notification bell
  $('#notif-btn').addEventListener('click', e => {
    e.stopPropagation();
    $('#notif-panel').classList.toggle('hidden');
    loadNotifs();
  });
  // Mark all as read
$('#mark-read').addEventListener('click', async () => {
  await api('PUT','/api/notifications/read-all').catch(()=>{});
  loadNotifs();
});

// ⚠️ ONGERAHO: Delete all read
$('#delete-read').addEventListener('click', async () => {
  if (confirm('Siba notifications zose zisomwe?')) {
    await api('DELETE','/api/notifications/read/all').catch(()=>{});
    loadNotifs();
  }
});
  
  document.addEventListener('click', e => {
    if (!e.target.closest('#notif-btn') && !e.target.closest('#notif-panel')) {
      const panel = $('#notif-panel');
      if (panel) panel.classList.add('hidden');
    }
  });

  // Shares
  $('#add-share-btn').addEventListener('click', openAddShare);
  $('#share-form').addEventListener('submit', doShareSave);

  // ── BUY FORM ─────────────────────────────────────────────────
  // Only ONE listener: the form submit event.
  // Do NOT add a click listener on the submit button — it would fire doBuy twice.
  $('#buy-form').addEventListener('submit', doBuy);

  // Users + Reject + Filter + Confirm
  $('#add-user-btn').addEventListener('click', openAddUser);
  $('#user-form').addEventListener('submit', doUserSave);
  const deactForm = $('#deact-form');
  if (deactForm) deactForm.addEventListener('submit', doDeactivate);
  $('#rej-form').addEventListener('submit', doReject);
  $('#req-filter').addEventListener('change', e => loadMngReqs(e.target.value));
  $('#conf-yes').addEventListener('click', () => { if (S.confirmCb) { const cb=S.confirmCb; S.confirmCb=null; cb(); } });

  // Close modals (data-m) + click outside
  $$('[data-m]').forEach(b => b.addEventListener('click', () => closeMod(b.dataset.m)));
  $$('.modal-ov').forEach(o => o.addEventListener('click', e => { if (e.target===o) o.classList.add('hidden'); }));

  // ── Attach event delegation on static containers ─────────────
  attachDelegates();
});
