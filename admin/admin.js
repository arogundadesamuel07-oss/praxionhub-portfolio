(function () {
  const supabaseUrl = 'https://nzrmcmswxdyheaxjvyuk.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cm1jbXN3eGR5aGVheGp2eXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAwMzIsImV4cCI6MjA5NDM4NjAzMn0.gpLjFE4f6TOQxCVE6bePDgYSY-XX2O3YCogJEYXr-bQ';
  const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

  const state = {
    currentView: 'overview',
    ads: [],
    requests: [],
    customers: [],
    visitorCount: 0,
    adminUser: null,
    user: null,
  };

  const els = {
    authScreen: document.getElementById('auth-screen'),
    dashboardScreen: document.getElementById('dashboard-screen'),
    authMessage: document.getElementById('auth-message'),
    adminLoginForm: document.getElementById('admin-login-form'),
    adminSignInBtn: document.getElementById('admin-signin-btn'),
    adminLogoutBtn: document.getElementById('admin-logout-btn'),
    overviewStats: document.getElementById('overview-stats'),
    recentAdsList: document.getElementById('recent-ads-list'),
    recentRequestsList: document.getElementById('recent-requests-list'),
    adSearch: document.getElementById('ad-search'),
    adStatusFilter: document.getElementById('ad-status-filter'),
    requestSearch: document.getElementById('request-search'),
    requestStatusFilter: document.getElementById('request-status-filter'),
    advertisementTableBody: document.getElementById('advertisement-table-body'),
    requestTableBody: document.getElementById('request-table-body'),
    analyticsStats: document.getElementById('analytics-stats'),
    statusChart: document.getElementById('status-chart'),
    topAdsList: document.getElementById('top-ads-list'),
    pageTitle: document.getElementById('page-title'),
  };

  function updateAuthMessage(message, type) {
    els.authMessage.textContent = message;
    els.authMessage.className = `auth-message ${type === 'error' ? 'is-error' : 'is-info'}`;
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  }

  function setLoading(isLoading) {
    els.adminSignInBtn.disabled = isLoading;
    els.adminSignInBtn.querySelector('span').textContent = isLoading ? 'Signing in...' : 'Sign in';
  }

  function renderView(viewName) {
    state.currentView = viewName;
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    document.querySelectorAll('.view-panel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `view-${viewName}`);
    });

    const labels = {
      overview: 'Overview',
      advertisements: 'Advertisements',
      requests: 'Requests',
      analytics: 'Analytics',
    };

    els.pageTitle.textContent = labels[viewName] || 'Overview';
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatCurrency(value) {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function safeText(value, fallback = '—') {
    return value ?? fallback;
  }

  function getAdminAccessError(error) {
    if (error?.code === '42P01' || /admin_users/i.test(error?.message || '')) {
      return 'Admin setup is incomplete. Run admin/supabase-admin.sql in the Supabase SQL Editor, then try again.';
    }

    return 'Unable to validate admin permissions.';
  }

  async function ensureAdminAccess() {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      throw new Error('User is not authenticated.');
    }

    const { data: adminRow, error: adminError } = await supabase
      .from('admin_users')
      .select('id, is_active, email')
      .eq('user_id', authData.user.id)
      .maybeSingle();

    if (adminError) throw new Error(getAdminAccessError(adminError));

    if (!adminRow || !adminRow.is_active) {
      throw new Error('This account does not have admin authorization.');
    }

    state.user = authData.user;
    state.adminUser = adminRow;
    return authData.user;
  }

  function showDashboard() {
    els.authScreen.classList.add('hidden');
    els.dashboardScreen.classList.remove('hidden');
  }

  function showAuthScreen(message, type = 'info') {
    els.dashboardScreen.classList.add('hidden');
    els.authScreen.classList.remove('hidden');
    updateAuthMessage(message, type);
  }

  async function signIn(event) {
    event.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;

    if (!email || !password) {
      updateAuthMessage('Please enter your admin email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user = data?.user;
      if (!user) throw new Error('No user returned from authentication.');

      const { data: adminRow, error: adminError } = await supabase
        .from('admin_users')
        .select('id, is_active, email')
        .eq('user_id', user.id)
        .maybeSingle();

      if (adminError) throw new Error(getAdminAccessError(adminError));
      if (!adminRow || !adminRow.is_active) {
        await supabase.auth.signOut();
        throw new Error('This account is not an authorized administrator.');
      }

      state.user = user;
      state.adminUser = adminRow;
      showDashboard();
      renderView('overview');
      await loadDashboardData();
      showToast('Admin access granted.', 'success');
    } catch (error) {
      console.error(error);
      showAuthScreen(error.message || 'Unable to sign in.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    state.user = null;
    state.adminUser = null;
    showAuthScreen('Sign in with an authorized admin account.', 'info');
  }

  function buildStatCard(label, value, accent = '') {
    return `
      <div class="stat-card">
        <span>${label}</span>
        <strong>${value}</strong>
      </div>
    `;
  }

  function renderOverviewStats() {
    const approved = state.ads.filter((ad) => ad.status === 'approved').length;
    const pending = state.ads.filter((ad) => ad.status === 'pending').length;
    const rejected = state.ads.filter((ad) => ad.status === 'rejected').length;
    const totalRevenue = state.ads.reduce((sum, ad) => sum + Number(ad.amount_paid || 0), 0);
    const totalRequests = state.requests.length;
    const totalCustomers = state.customers.length;

    els.overviewStats.innerHTML = [
      buildStatCard('Total advertisements', state.ads.length),
      buildStatCard('Approved', approved),
      buildStatCard('Pending review', pending),
      buildStatCard('Rejected', rejected),
      buildStatCard('Revenue', formatCurrency(totalRevenue)),
      buildStatCard('Project requests', totalRequests),
      buildStatCard('Customer contacts', totalCustomers),
      buildStatCard('Unique visitors', state.visitorCount),
    ].join('');
  }

  function buildCustomerContacts() {
    const businessContacts = (state.ads || []).filter((ad) => ad.advertisers?.email).map((ad) => ({
      id: `advertiser-${ad.id || ad.advertisers?.id || ad.advertisers?.email}`,
      name: ad.advertisers?.owner_name || ad.advertisers?.business_name || 'Business owner',
      email: ad.advertisers.email,
      source: 'Featured Business',
      company: ad.advertisers?.business_name || 'Business',
      created_at: ad.created_at || ad.advertisers?.created_at,
    }));

    const requestContacts = (state.requests || []).filter((request) => request.email).map((request) => ({
      id: `request-${request.id}`,
      name: [request.first_name, request.last_name].filter(Boolean).join(' ') || request.company || 'Contact client',
      email: request.email,
      source: 'Contact Form',
      company: request.company || 'Client',
      created_at: request.created_at,
    }));

    state.customers = [...businessContacts, ...requestContacts]
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  function buildNewsletterMailto(customer) {
    const name = customer?.name || 'there';
    const email = customer?.email || '';
    const subject = encodeURIComponent('PraxionHub Update');
    const body = encodeURIComponent(
      `Hello ${name},\n\nThanks for being with us.\n\nWe would love to keep you updated with our latest news, offers, and business opportunities.\n\nBest regards,\nPraxionHub Team`
    );

    return `mailto:${email}?subject=${subject}&body=${body}`;
  }

  function renderCustomerContacts() {
    const listEl = document.getElementById('customer-contact-list');
    if (!listEl) return;

    if (!state.customers.length) {
      listEl.innerHTML = '<div class="list-item"><div><strong>No customer contacts</strong><small>No business or contact emails have been submitted yet.</small></div></div>';
      return;
    }

    listEl.innerHTML = state.customers.slice(0, 8).map((customer) => {
      const safeEmail = safeText(customer.email || 'No email');
      const mailto = buildNewsletterMailto(customer);

      return `
        <div class="list-item">
          <div>
            <strong>${safeText(customer.name || customer.company || 'Customer')}</strong>
            <small>
              <a href="${mailto}" style="color: #a5d8ff; text-decoration: none;">${safeEmail}</a>
              • ${safeText(customer.company || customer.source || 'Customer')}
            </small>
          </div>
          <span class="badge ${customer.source === 'Featured Business' ? 'approved' : 'new'}">${safeText(customer.source || 'Customer')}</span>
        </div>
      `;
    }).join('');
  }

  function renderRecentAds() {
    const recent = [...state.ads].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    if (!recent.length) {
      els.recentAdsList.innerHTML = '<div class="list-item"><div><strong>No advertisements found</strong><small>Once ads are submitted they will appear here.</small></div></div>';
      return;
    }

    els.recentAdsList.innerHTML = recent.map((ad) => `
      <div class="list-item">
        <div>
          <strong>${safeText(ad.ad_title || ad.advertisers?.business_name || 'Untitled ad')}</strong>
          <small>${safeText(ad.advertisers?.business_name || 'Business')} • ${formatDate(ad.created_at)}</small>
        </div>
        <span class="badge ${ad.status || 'pending'}">${safeText(ad.status || 'pending')}</span>
      </div>
    `).join('');
  }

  function renderRecentRequests() {
    const recent = [...state.requests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);

    if (!recent.length) {
      els.recentRequestsList.innerHTML = '<div class="list-item"><div><strong>No project requests</strong><small>No client requests have been submitted yet.</small></div></div>';
      return;
    }

    els.recentRequestsList.innerHTML = recent.map((request) => `
      <div class="list-item">
        <div>
          <strong>${safeText(request.first_name || request.company || 'Client')} ${safeText(request.last_name || '')}</strong>
          <small>${safeText(request.request_type || 'project')} • ${safeText(request.subject || request.project_description || 'Message')} • ${formatDate(request.created_at)}</small>
        </div>
        <span class="badge ${request.status || 'new'}">${safeText(request.status || 'new')}</span>
      </div>
    `).join('');
  }

  function renderAdvertismentTable() {
    const term = (document.getElementById('ad-search')?.value || '').toLowerCase();
    const filter = document.getElementById('ad-status-filter')?.value || 'all';

    const filtered = state.ads.filter((ad) => {
      const haystack = [
        ad.ad_title,
        ad.advertisers?.business_name,
        ad.advertisers?.email,
        ad.ad_package,
      ].join(' ').toLowerCase();

      const matchSearch = !term || haystack.includes(term);
      const matchStatus = filter === 'all' || ad.status === filter;
      return matchSearch && matchStatus;
    });

    if (!filtered.length) {
      els.advertisementTableBody.innerHTML = '<tr><td colspan="5">No ads match the current filters.</td></tr>';
      return;
    }

    els.advertisementTableBody.innerHTML = filtered.map((ad) => `
      <tr>
        <td>
          <strong>${safeText(ad.ad_title || ad.advertisers?.business_name || 'Untitled ad')}</strong><br />
          <small>${safeText(ad.advertisers?.business_name || 'Business')}</small>
        </td>
        <td>${safeText(ad.ad_package || '—')}</td>
        <td><span class="badge ${ad.status || 'pending'}">${safeText(ad.status || 'pending')}</span></td>
        <td>${formatDate(ad.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="action-btn approve" data-action="approve" data-id="${ad.id}">Approve</button>
            <button class="action-btn reject" data-action="reject" data-id="${ad.id}">Reject</button>
            <button class="action-btn suspend" data-action="suspend" data-id="${ad.id}">Suspend</button>
            <button class="action-btn delete" data-action="delete" data-id="${ad.id}">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  function renderRequestTable() {
    const term = (document.getElementById('request-search')?.value || '').toLowerCase();
    const filter = document.getElementById('request-status-filter')?.value || 'all';

    const filtered = state.requests.filter((request) => {
      const haystack = [
        request.first_name,
        request.last_name,
        request.company,
        request.email,
        request.subject,
        request.project_description,
      ].join(' ').toLowerCase();

      const matchSearch = !term || haystack.includes(term);
      const matchStatus = filter === 'all' || request.status === filter;
      return matchSearch && matchStatus;
    });

    if (!filtered.length) {
      els.requestTableBody.innerHTML = '<tr><td colspan="6">No client requests match the current filters.</td></tr>';
      return;
    }

    els.requestTableBody.innerHTML = filtered.map((request) => `
      <tr>
        <td>${safeText(request.first_name || 'Client')} ${safeText(request.last_name || '')}</td>
        <td>${safeText(request.company || '—')}</td>
        <td><span class="badge ${request.request_type || 'project'}">${safeText(request.request_type || 'project')}</span></td>
        <td>
          <strong>${safeText(request.subject || 'No subject')}</strong><br />
          <small>${safeText(request.project_description || 'No message')}</small><br />
          <small>${safeText(request.email || 'No email')} ${request.phone ? `• ${safeText(request.phone)}` : ''}</small>
        </td>
        <td><span class="badge ${request.status || 'new'}">${safeText(request.status || 'new')}</span></td>
        <td>${formatDate(request.created_at)}</td>
      </tr>
    `).join('');
  }

  function renderAnalyticsStats() {
    const approved = state.ads.filter((ad) => ad.status === 'approved').length;
    const pending = state.ads.filter((ad) => ad.status === 'pending').length;
    const totalImpressions = state.ads.reduce((sum, ad) => sum + Number(ad.impressions || 0), 0);
    const totalClicks = state.ads.reduce((sum, ad) => sum + Number(ad.clicks || 0), 0);
    const ctr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;

    els.analyticsStats.innerHTML = [
      buildStatCard('Approved ads', approved),
      buildStatCard('Pending', pending),
      buildStatCard('Impressions', totalImpressions),
      buildStatCard('Clicks', totalClicks),
      buildStatCard('CTR', `${ctr.toFixed(2)}%`),
      buildStatCard('Revenue', formatCurrency(state.ads.reduce((sum, ad) => sum + Number(ad.amount_paid || 0), 0))),
    ].join('');
  }

  function renderStatusChart() {
    const counts = {
      pending: state.ads.filter((ad) => ad.status === 'pending').length,
      approved: state.ads.filter((ad) => ad.status === 'approved').length,
      rejected: state.ads.filter((ad) => ad.status === 'rejected').length,
      suspended: state.ads.filter((ad) => ad.status === 'suspended').length,
    };

    const total = Object.values(counts).reduce((sum, count) => sum + count, 0) || 1;
    const rows = [
      ['Pending', counts.pending],
      ['Approved', counts.approved],
      ['Rejected', counts.rejected],
      ['Suspended', counts.suspended],
    ];

    els.statusChart.innerHTML = rows.map(([label, value]) => `
      <div class="chart-row">
        <div class="chart-label">${label}</div>
        <div class="chart-track"><div class="chart-fill" style="width:${(value / total) * 100}%"></div></div>
        <div class="chart-label">${value}</div>
      </div>
    `).join('');
  }

  function renderTopAds() {
    const ranked = [...state.ads]
      .map((ad) => ({
        title: ad.ad_title || ad.advertisers?.business_name || 'Untitled ad',
        clicks: Number(ad.clicks || 0),
        impressions: Number(ad.impressions || 0),
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    if (!ranked.length) {
      els.topAdsList.innerHTML = '<div class="list-item"><div><strong>No analytics yet</strong><small>No ad performance data exists yet.</small></div></div>';
      return;
    }

    els.topAdsList.innerHTML = ranked.map((ad) => {
      const ctr = ad.impressions ? (ad.clicks / ad.impressions) * 100 : 0;
      return `
        <div class="list-item">
          <div>
            <strong>${ad.title}</strong>
            <small>${ad.clicks} clicks • ${ad.impressions} impressions • ${ctr.toFixed(2)}% CTR</small>
          </div>
        </div>
      `;
    }).join('');
  }

  async function loadAdvertisements() {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*, advertisers(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      throw new Error('Unable to load advertisements.');
    }

    state.ads = data || [];
  }

  async function loadRequests() {
    const { data, error } = await supabase
      .from('client_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      throw new Error('Unable to load client requests.');
    }

    state.requests = data || [];
  }

  async function loadVisitorCount() {
    const { count, error } = await supabase
      .from('site_visits')
      .select('id', { count: 'exact', head: true });

    if (error) {
      console.error(error);
      state.visitorCount = 0;
      return;
    }

    state.visitorCount = count || 0;
  }

  async function loadDashboardData() {
    try {
      await Promise.all([loadAdvertisements(), loadRequests(), loadVisitorCount()]);
      buildCustomerContacts();
      renderOverviewStats();
      renderRecentAds();
      renderRecentRequests();
      renderCustomerContacts();
      renderAdvertismentTable();
      renderRequestTable();
      renderAnalyticsStats();
      renderStatusChart();
      renderTopAds();
    } catch (error) {
      console.error(error);
      showToast(error.message || 'Unable to load dashboard data.', 'error');
    }
  }

  async function updateAdvertisementStatus(id, status) {
    const { error } = await supabase
      .from('advertisements')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error(error);
      showToast('Action failed. Check your admin permissions or RLS policy.', 'error');
      return;
    }

    await loadDashboardData();
    showToast(`Advertisement marked as ${status}.`, 'success');
  }

  async function deleteAdvertisement(id) {
    if (!window.confirm('Delete this advertisement permanently?')) return;

    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(error);
      showToast('Delete failed. Run the admin SQL policies and try again.', 'error');
      return;
    }

    await loadDashboardData();
    showToast('Advertisement deleted.', 'success');
  }

  function bindEvents() {
    els.adminLoginForm.addEventListener('submit', signIn);
    els.adminLogoutBtn.addEventListener('click', signOut);

    document.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', () => renderView(item.dataset.view));
    });

    els.adSearch.addEventListener('input', renderAdvertismentTable);
    els.adStatusFilter.addEventListener('change', renderAdvertismentTable);
    els.requestSearch.addEventListener('input', renderRequestTable);
    els.requestStatusFilter.addEventListener('change', renderRequestTable);

    document.body.addEventListener('click', async (event) => {
      const button = event.target.closest('[data-action]');
      if (!button) return;

      const { action, id } = button.dataset;
      if (!id) return;

      if (action === 'approve') await updateAdvertisementStatus(id, 'approved');
      if (action === 'reject') await updateAdvertisementStatus(id, 'rejected');
      if (action === 'suspend') await updateAdvertisementStatus(id, 'suspended');
      if (action === 'delete') await deleteAdvertisement(id);
    });
  }

  async function init() {
    bindEvents();
    renderView('overview');

    try {
      const { data: userData } = await supabase.auth.getSession();
      if (userData?.session?.user) {
        await ensureAdminAccess();
        showDashboard();
        renderView('overview');
        await loadDashboardData();
      } else {
        showAuthScreen('Sign in with an authorized admin account.', 'info');
      }
    } catch (error) {
      console.error(error);
      showAuthScreen(error.message || 'You are not authorized to access this dashboard.', 'error');
    }
  }

  init();
})();
