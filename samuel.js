// Removed top-level blocking imports to ensure the site logic runs immediately.
// External services like Firebase are now loaded dynamically at the bottom.

/* ============================================================
   SUPABASE CONFIGURATION
============================================================ */
const supabaseUrl = 'https://nzrmcmswxdyheaxjvyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cm1jbXN3eGR5aGVheGp2eXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAwMzIsImV4cCI6MjA5NDM4NjAzMn0.gpLjFE4f6TOQxCVE6bePDgYSY-XX2O3YCogJEYXr-bQ';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const PAYSTACK_PUBLIC_KEY = 'pk_live_da0319d19293dcb1623e785588fe1506671c2df0'; 
let ADVERTISEMENTS = [];
let homeAdInterval = null;
let pendingAdData = null;

/* ============================================================
   DATA
============================================================ */
const PRODUCTS = [
  { id:1, name:'Pep Diamond Empire', category:'web', price:5200, oldPrice:null, badge:'Live', stars:5, color:'#D4AF37',
    img:'asset/screenshot-valid.png', url: 'https://pepdiamondempire.netlify.app/#shop' },
  { id:2, name:'Luxury Naija Boutique', category:'web', price:5500, oldPrice:null, badge:'Live', stars:5, color:'#3B82F6',
    img:'asset/temitope.png', url: 'https://luxurynaijabuotique.netlify.app/' },
  { id:3, name:'God Favor Lifestyle', category:'web', price:4200, oldPrice:null, badge:'Live', stars:5, color:'#3B82F6',
    img:'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80', url: 'https://godfavor.netlify.app/' },
  { id:4, name:'Temitope Boutique', category:'web', price:3800, oldPrice:null, badge:'Live', stars:5, color:'#3B82F6',
    img:'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80', url: 'https://temitopeboutique.netlify.app/' },

  { id:11, name:'Aura Fintech App', category:'app', price:4500, oldPrice:null, badge:'Award', stars:5, color:'#8B5CF6',
    img:'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80' },
  { id:10, name:'Vanta E-Commerce', category:'web', price:8200, oldPrice:null, badge:'Hot', stars:5, color:'#3B82F6',
    img:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80' },
  { id:7, name:'Cyber Brand Identity', category:'design', price:3500, oldPrice:null, badge:'New', stars:5, color:'#F472B6',
    img:'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80' },
  { id:8, name:'Neo-Fitness Platform', category:'app', price:5500, oldPrice:null, badge:'Trending', stars:5, color:'#8B5CF6',
    img:'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&q=80' },
  { id:5, name:'Obsidian Portfolio', category:'web', price:2900, oldPrice:null, badge:'Pro', stars:5, color:'#3B82F6',
    img:'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80' },
  
  
];

const TESTIMONIALS = [
  { text:'Samuel transformed our vision into a digital masterpiece. The animations are world-class.', name:'Tobi Adeyemi', handle:'@tobi_ceo', initials:'TA' },
  { text:'PraxionHub design is unmatched. Our app downloads tripled after the redesign.', name:'Chioma Okoro', handle:'@chioma_dev', initials:'CO' },
  { text:'Fast, efficient, and creatively brilliant. Samuel is the greatest developer we have worked with.', name:'Olumide Bakare', handle:'@olu_founder', initials:'OB' },
];

const BRANDS = ['Boutiques', 'Professional businesses', 'Catering', 'Bakery', 'Schools', 'Stations', 'Churches', 'Salons', 'Freelancers', 'Agencies', 'Restaurants', 'Fitness Centers', 'Singers', 'industries', 'and more...'];

const SERVICES_DATA = [
  { icon:'fa-solid fa-code', title:'Web Development', desc:'Scalable, responsive, and blazing-fast websites built with modern frameworks.' },
  { icon:'fa-solid fa-mobile-screen', title:'App Development', desc:'Cross-platform mobile applications that offer native performance and seamless transitions.' },
  { icon:'fa-solid fa-palette', title:'Graphic Design', desc:'Visual storytelling through high-impact graphics, typography, and professional layouts.' },
  { icon:'fa-solid fa-fingerprint', title:'Branding', desc:'Complete brand identity systems including logos, style guides, and digital brand voice.' },
];

const TEAM_DATA = [{ name:'Samuel Arogundade', role:'Founder & Creative Lead', bio:'Engineer at heart, designer by soul. Building the future of the web.', initials:'SA', color:'#7c3aed', img:'asset/sam business pic.png', xUrl: 'https://x.com/SamuelArog24541' }];
const FAVORITES = new Set();

function loadFavorites() {
  const stored = localStorage.getItem('praxionhubFavorites');
  if (stored) {
    try { JSON.parse(stored).forEach(id => FAVORITES.add(id)); } catch { /* ignore */ }
  }
  updateFavoriteCount();
}

function saveFavorites() {
  localStorage.setItem('praxionhubFavorites', JSON.stringify([...FAVORITES]));
}

function updateFavoriteCount() {
  const countEl = document.getElementById('favorite-count');
  if (!countEl) return;
  countEl.textContent = FAVORITES.size;
  countEl.classList.toggle('visible', FAVORITES.size > 0);
}

function getFavoriteItem(id) {
  if (id.startsWith('project-')) {
    const product = PRODUCTS.find(p => `project-${p.id}` === id);
    if (!product) return null;
    return { id, type:'Project', name: product.name, subtitle: product.category, img: product.img, url: product.url };
  }
  if (id.startsWith('business-')) {
    const ad = ADVERTISEMENTS.find(a => `business-${a.id}` === id);
    if (!ad) return null;
    return { id, type:'Business', name: ad.ad_title, subtitle: ad.advertisers?.business_name || 'Featured Business', img: ad.banner_url, url: ad.advertisers?.website_url || '' };
  }
  return null;
}

function toggleFavorite(id) {
  if (FAVORITES.has(id)) {
    FAVORITES.delete(id);
    showToast('Removed from saved items', 'info', 'fa-solid fa-heart-broken');
  } else {
    FAVORITES.add(id);
    showToast('Saved to favorites', 'success', 'fa-solid fa-heart');
  }
  saveFavorites();
  updateFavoriteCount();
  refreshFavoriteButtons();
  renderFavoritesPanel();
}

function refreshFavoriteButtons() {
  document.querySelectorAll('[data-favorite-id]').forEach(el => {
    const id = el.dataset.favoriteId;
    el.classList.toggle('active', FAVORITES.has(id));
  });
}

function getFeaturedBusinessTitles() {
  const now = new Date();
  return ADVERTISEMENTS
    .filter(ad => ad.status === 'approved' && (!ad.expiration_date || new Date(ad.expiration_date) > now))
    .map(ad => ad.ad_title || ad.advertisers?.business_name || 'Featured Business');
}

function showNewUserPopupIfNeeded() {
  // Show once per session by default, but still update counts every page load
  if (sessionStorage.getItem('praxionhubNewUserSessionSeen')) return;
  const businessTitles = getFeaturedBusinessTitles();
  if (!businessTitles.length) return;
  const countEl = document.getElementById('new-user-business-count');
  const listEl = document.getElementById('new-user-business-list');
  const titleEl = document.getElementById('new-user-title');
  if (countEl) countEl.textContent = businessTitles.length;
  if (titleEl) titleEl.textContent = `Join ${businessTitles.length} brands showcasing their products`;
  if (listEl) {
    const visibleTitles = businessTitles.slice(0, 5);
    listEl.innerHTML = visibleTitles.map(name => `<li>${name}</li>`).join('');
    if (businessTitles.length > 5) {
      listEl.innerHTML += `<li>and ${businessTitles.length - 5} more brands...</li>`;
    }
  }

  // Add a featured ad preview (first approved ad)
  const featuredContainer = document.getElementById('new-user-featured');
  if (featuredContainer) {
    const now = new Date();
    const approvedAds = ADVERTISEMENTS.filter(ad => ad.status === 'approved' && (!ad.expiration_date || new Date(ad.expiration_date) > now));
    const first = approvedAds[0];
    if (first) {
      const img = first.banner_url || 'asset/praxionhub1.png';
      const title = first.ad_title || (first.advertisers && first.advertisers.business_name) || 'Featured Business';
      const desc = (first.ad_description || '').substring(0, 80) + (first.ad_description && first.ad_description.length > 80 ? '…' : '');
      const url = first.advertisers?.website_url || '#';
      featuredContainer.innerHTML = `
        <div style="display:flex;gap:10px;align-items:center">
          <img src="${img}" alt="${title}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;" />
          <div style="flex:1">
            <div style="font-weight:700">${title}</div>
            <div style="font-size:13px;color:var(--text-muted);">${desc}</div>
            <div style="margin-top:6px"><button class="btn-secondary" onclick="window.open('${url}')">Visit</button></div>
          </div>
        </div>`;
    } else {
      featuredContainer.innerHTML = '';
    }
  }

  document.getElementById('new-user-popup')?.classList.add('open');
  sessionStorage.setItem('praxionhubNewUserSessionSeen', 'true');
}

function closeNewUserPopup() {
  const popup = document.getElementById('new-user-popup');
  if (popup) {
    popup.classList.remove('open');
  }
}

function openFavoritesPanel() {
  renderFavoritesPanel();
  document.getElementById('favorites-panel')?.classList.add('open');
}

function closeFavoritesPanel(event) {
  if (event && event.target && event.target.id !== 'favorites-panel' && !event.target.closest('.favorites-panel') && event.target.closest('.favorite-item-remove') == null) return;
  document.getElementById('favorites-panel')?.classList.remove('open');
}

function renderFavoritesPanel() {
  const list = document.getElementById('favorites-list');
  if (!list) return;
  const items = [...FAVORITES].map(getFavoriteItem).filter(Boolean);
  const empty = document.querySelector('.favorites-panel-empty');

  if (items.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';
  list.innerHTML = items.map(item => `
    <div class="favorite-item">
      <div class="favorite-item-img"><img src="${item.img || 'asset/praxionhub1.png'}" alt="${item.name}" /></div>
      <div class="favorite-item-details">
        <div class="favorite-item-type">${item.type}</div>
        <div class="favorite-item-name">${item.name}</div>
        <div style="font-size:13px;color:var(--text-muted);">${item.subtitle}</div>
      </div>
      <button class="favorite-item-remove" onclick="toggleFavorite('${item.id}')" aria-label="Remove saved item"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('');
}

/* ============================================================
   ADVERTISING LOGIC
============================================================ */
async function fetchAdvertisements() {
  try {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*, advertisers(*), categories(name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    ADVERTISEMENTS = data || [];
    renderHomeFeaturedAds();
    renderFeatured();
    populateBusinessCategoryFilters();
  } catch (err) {
    console.error('Error fetching advertisements:', err);
  }
}

function renderBusinessCard(ad) {
  const biz = ad.advertisers || {};
  const banner = ad.banner_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';
  const categoryName = ad.categories?.name || biz.business_name || 'Promoted Business';
  
  const now = new Date();
  const isExpired = ad.expiration_date && new Date(ad.expiration_date) < now;
  const isPending = ad.status === 'pending';
  const isInactive = isPending || isExpired;

  if (isInactive) {
    const statusLabel = isPending ? 'Awaiting Approval' : 'Ad Expired';
    return `
      <div class="business-card inactive reveal">
        <div class="inactive-overlay"><span>${statusLabel}</span></div>
        <img src="${banner}" class="business-banner blurred" alt="Restricted">
        <div class="business-card-content" style="filter: blur(1px); opacity: 0.5;">
          <div class="business-logo"><img src="asset/praxionhub1.png" alt="logo"></div>
          <div class="business-category">Locked Content</div>
          <h3 class="business-name">Business Restricted</h3>
          <p class="business-description">This advertisement is currently inactive. Details are hidden until approval or renewal.</p>
          <div class="business-actions-bottom">
            <button class="btn-primary" disabled style="opacity: 0.5;">Access Restricted</button>
          </div>
        </div>
      </div>`;
  }

  const favId = `business-${ad.id}`;
  const favActive = FAVORITES.has(favId) ? 'active' : '';
  return `
    <div class="business-card reveal">
      <img src="${banner}" class="business-banner" alt="${ad.ad_title}" loading="lazy">
      <button class="favorite-btn ${favActive}" data-favorite-id="${favId}" onclick="toggleFavorite('${favId}')" title="Save business"><i class="fa-solid fa-heart"></i></button>
      <div class="business-card-content">
        <div class="business-logo"><img src="asset/praxionhub1.png" alt="logo"></div>
        <div class="business-category">${categoryName}</div>
        <h3 class="business-name">${ad.ad_title}</h3>
        <p class="business-description">${ad.ad_description.substring(0, 100)}...</p>
        <div class="business-actions-bottom">
          <button class="btn-primary" onclick="openAdDetails('${ad.id}')">View Details</button>
          ${biz.whatsapp_number ? `<a href="https://wa.me/${biz.whatsapp_number.replace(/\D/g,'')}" class="btn-secondary" target="_blank"><i class="fa-brands fa-whatsapp"></i></a>` : ''}
        </div>
      </div>
    </div>`;
}

function renderHomeFeaturedAds() {
  const grid = document.getElementById('home-featured-businesses');
  if (!grid) return;
  
  const header = grid.closest('section')?.querySelector('.section-header');
  const now = new Date();
  
  // Filter strictly for Approved and Active ads
  const approvedAds = ADVERTISEMENTS.filter(ad => 
    ad.status === 'approved' && (!ad.expiration_date || new Date(ad.expiration_date) > now)
  );

  // Calculate stats for pending/expired
  const pendingCount = ADVERTISEMENTS.filter(ad => ad.status === 'pending').length;
  const expiredCount = ADVERTISEMENTS.filter(ad => ad.expiration_date && new Date(ad.expiration_date) < now).length;

  // Update header with stats if they exist
  if (header) {
    const existingBar = header.querySelector('.ad-status-bar');
    if (existingBar) existingBar.remove();
    
    if (pendingCount > 0 || expiredCount > 0) {
      const statsHtml = `
        <div class="ad-status-bar reveal">
          ${pendingCount > 0 ? `<span class="ad-stat-pill" style="cursor:pointer" onclick="showToast('${pendingCount} advertisement(s) are currently pending approval.', 'info', 'fa-solid fa-clock')">
            <i class="fa-solid fa-clock"></i> ${pendingCount} Pending
          </span>` : ''}
          ${expiredCount > 0 ? `<span class="ad-stat-pill"><i class="fa-solid fa-calendar-xmark"></i> ${expiredCount} Expired Ads</span>` : ''}
        </div>`;
      header.insertAdjacentHTML('beforeend', statsHtml);
    }
  }

  if (approvedAds.length > 0) {
    grid.classList.add('business-slider');
    grid.innerHTML = approvedAds.map(renderBusinessCard).join('');
    
    // Auto-swipe Logic (Every 6 seconds)
    if (homeAdInterval) clearInterval(homeAdInterval);
    if (approvedAds.length > 1) {
      homeAdInterval = setInterval(() => {
        const firstCard = grid.querySelector('.business-card');
        if (!firstCard) return;
        
        const scrollAmount = firstCard.offsetWidth + 20; // card width + gap
        const isAtEnd = grid.scrollLeft >= (grid.scrollWidth - grid.clientWidth - 10);
        
        grid.scrollTo({
          left: isAtEnd ? 0 : grid.scrollLeft + scrollAmount,
          behavior: 'smooth'
        });
      }, 6000);
    }
  } else {
    grid.classList.remove('business-slider');
    grid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted);">No featured businesses at the moment.</p>';
  }

  observeReveal();
}

// Show a small live popup for a given ad
function openLiveAdPopup(ad) {
  try {
    const imgEl = document.getElementById('live-ad-img');
    const titleEl = document.getElementById('live-ad-title');
    const descEl = document.getElementById('live-ad-desc');
    const popup = document.getElementById('live-ad-popup');
    if (imgEl) imgEl.src = ad.banner_url || 'asset/praxionhub1.png';
    if (titleEl) titleEl.textContent = ad.ad_title || (ad.advertisers && ad.advertisers.business_name) || 'New Advertisement';
    if (descEl) descEl.textContent = (ad.ad_description || '').substring(0, 120);
    window.liveAdUrl = ad.advertisers?.website_url || '#';
    if (popup) {
      popup.style.display = 'block';
      setTimeout(() => { try { popup.style.display = 'none'; } catch(e){} }, 8000);
    }
  } catch (e) { console.warn('openLiveAdPopup error', e); }
}

// Subscribe to Supabase realtime changes for advertisements and show notifications
function subscribeToAdChanges() {
  try {
    if (!supabase || typeof supabase.channel !== 'function') return;
    // Avoid creating multiple identical channels
    if (window._adsRealtimeSubscribed) return; window._adsRealtimeSubscribed = true;

    const ch = supabase.channel('public:advertisements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'advertisements' }, payload => {
        const newAd = payload.new;
        if (!newAd) return;
        // Keep local cache fresh
        ADVERTISEMENTS.unshift(newAd);
        renderHomeFeaturedAds(); renderBusinessDirectory(); renderFeatured();
        const approvedCount = ADVERTISEMENTS.filter(ad => ad.status === 'approved').length;
        showToast(`${approvedCount} advertisers live — ${newAd.ad_title}`, 'info', 'fa-solid fa-bell');
        openLiveAdPopup(newAd);
      })
      .subscribe();

    // Also listen for updates to status so we can refresh counts
    supabase.channel('public:advertisements').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'advertisements' }, payload => {
      // Refresh full data from DB to stay in sync
      fetchAdvertisements();
    }).subscribe();
  } catch (e) { console.warn('Realtime subscribe failed', e); }
}

async function renderAdminDashboard() {
  const table = document.getElementById('admin-ad-table');
  const statsGrid = document.getElementById('admin-stats-grid');
  if (!table) return;

  const searchTerm = (document.getElementById('admin-search')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('admin-status-filter')?.value || 'all';

  const filtered = ADVERTISEMENTS.filter(ad => {
    const biz = ad.advertisers || {};
    const matchesSearch = ad.ad_title.toLowerCase().includes(searchTerm) || 
                          (biz.business_name || '').toLowerCase().includes(searchTerm) ||
                          (biz.email || '').toLowerCase().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Render Stats
  if (statsGrid) {
    const totalRev = ADVERTISEMENTS.reduce((sum, ad) => sum + (Number(ad.amount_paid) || 0), 0);
    const pendingCount = ADVERTISEMENTS.filter(ad => ad.status === 'pending').length;
    const activeCount = ADVERTISEMENTS.filter(ad => ad.status === 'approved').length;
    
    statsGrid.innerHTML = `
      <div class="admin-stat-card"><span>Total Revenue</span><strong>₦${totalRev.toLocaleString()}</strong></div>
      <div class="admin-stat-card"><span>Active Ads</span><strong>${activeCount}</strong></div>
      <div class="admin-stat-card"><span>Pending Review</span><strong>${pendingCount}</strong></div>
    `;
  }

  // Render Table
  let html = `
    <div class="admin-row header">
      <span>Business & Title</span>
      <span>Package</span>
      <span>Amount</span>
      <span>Status</span>
      <span>Actions</span>
    </div>
  `;

  html += filtered.map(ad => {
    const biz = ad.advertisers || {};
    return `
      <div class="admin-row">
        <div>
          <div style="font-weight:700">${biz.business_name || 'Unknown'}</div>
          <div style="font-size:11px; color:var(--text-muted)">${ad.ad_title}</div>
        </div>
        <span>${ad.ad_package} (${ad.duration_days}d)</span>
        <span>₦${(Number(ad.amount_paid) || 0).toLocaleString()}</span>
        <span class="badge ${ad.status}">${ad.status.toUpperCase()}</span>
        <div class="admin-actions">
          ${ad.status === 'pending' ? `<button class="admin-action-btn approve" onclick="updateAdStatus('${ad.id}', 'approved')">Approve</button>` : ''}
          ${ad.status !== 'rejected' ? `<button class="admin-action-btn reject" onclick="updateAdStatus('${ad.id}', 'rejected')">Reject</button>` : ''}
          <button class="admin-action-btn delete" onclick="deleteAd('${ad.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');

  table.innerHTML = html || '<div style="padding:40px; text-align:center; color:var(--text-muted);">No advertisements to display.</div>';
}

async function updateAdStatus(id, status) {
  try {
    const { error } = await supabase.from('advertisements').update({ status }).eq('id', id);
    if (error) throw error;
    showToast(`Ad ${status} successfully`, 'success');
    await fetchAdvertisements();
    renderAdminDashboard();
  } catch (err) { 
    console.error('Update Status Error:', err); 
    showToast(`Update failed: ${err.message}`, 'error'); 
  }
}

async function deleteAd(id) {
  if (!confirm('Are you sure you want to delete this advertisement?')) return;
  try {
    const { error } = await supabase.from('advertisements').delete().eq('id', id);
    if (error) throw error;
    showToast('Ad deleted', 'info');
    await fetchAdvertisements();
    renderAdminDashboard();
  } catch (err) { console.error(err); showToast('Delete failed', 'error'); }
}

function renderBusinessDirectory() {
  const grid = document.getElementById('business-directory-grid');
  if (!grid) return;

  const searchTerm = (document.getElementById('business-search')?.value || '').toLowerCase();
  const catFilter = document.getElementById('business-category-filter')?.value || 'all';
  const statusFilter = document.getElementById('business-status-filter')?.value || 'all';
  const now = new Date();

  const filtered = ADVERTISEMENTS.filter(ad => {
    const biz = ad.advertisers || {};
    const matchesSearch = ad.ad_title.toLowerCase().includes(searchTerm) || 
                          (biz.business_name || '').toLowerCase().includes(searchTerm);
    const matchesCat = catFilter === 'all' || String(ad.category_id) === String(catFilter);
    
    let matchesStatus = true;
    if (statusFilter === 'approved') matchesStatus = ad.status === 'approved';
    else if (statusFilter === 'expired') matchesStatus = ad.expiration_date && new Date(ad.expiration_date) < now;
    else if (statusFilter !== 'all') matchesStatus = ad.status === statusFilter;

    return matchesSearch && matchesCat && matchesStatus;
  });

  grid.innerHTML = filtered.length 
    ? filtered.map(renderBusinessCard).join('') 
    : '<div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--text-muted);">No businesses found matching your criteria.</div>';
  observeReveal();
}

async function populateBusinessCategoryFilters() {
  const filter = document.getElementById('business-category-filter');
  if (!filter) return;

  try {
    const { data: categories } = await supabase.from('categories').select('*');
    if (categories) {
      const options = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      filter.innerHTML = `<option value="all">All Categories</option>` + options;
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }
}

async function populateAdvertiseCategoryOptions() {
  const select = document.getElementById('ad-category');
  if (!select) return;
  try {
    const { data: categories } = await supabase.from('categories').select('*');
    if (categories) {
      const options = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
      select.innerHTML = options;
    }
  } catch (err) {
    console.error('Error loading ad categories:', err);
  }
}

function updatePackageAmount() {
  const durationEl = document.getElementById('ad-duration');
  const pkgEl = document.getElementById('ad-package');
  if (!durationEl || !pkgEl) return 1000;

  const duration = durationEl.value;
  const pkg = pkgEl.value;
  
  // User defined pricing
  const pricing = { '1': 200, '2': 500, '7': 1500, '30': 5000 };
  let amount = pricing[duration] || 0;

  // Optional multipliers for packages
  if (pkg === 'standard') amount *= 1.5;
  if (pkg === 'premium') amount *= 2.5;

  const formattedAmount = amount.toLocaleString();

  // Update Advertise Page Summary
  const summaryFields = {
    'summary-amount': '₦' + formattedAmount,
    'summary-package': pkg.charAt(0).toUpperCase() + pkg.slice(1),
    'summary-duration': duration + (duration === '1' ? ' day' : ' days'),
    'payment-modal-amount': formattedAmount,
    'transfer-amt': formattedAmount
  };

  Object.entries(summaryFields).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) {
      if (el.tagName === 'SPAN' || el.tagName === 'STRONG') el.textContent = val;
      else el.value = val;
    }
  });

  return amount;
}

async function handleAdvertiseSubmit() {
  const bizName = document.getElementById('ad-business-name').value.trim();
  const email = document.getElementById('ad-email').value.trim();
  const adTitle = document.getElementById('ad-title').value.trim();
  const adDesc = document.getElementById('ad-description').value.trim();

  if (!bizName || !email || !adTitle || !adDesc) { 
    showToast('Please fill in all required business details', 'error'); 
    return; 
  }

  const amount = updatePackageAmount();

  const submitBtn = document.getElementById('ad-submit-btn');
  if (!submitBtn) return;
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Processing...';

  try {
    const bannerInput = document.getElementById('ad-banner');
    const bannerFile = bannerInput?.files?.[0];
    let bannerUrl = null;

    if (bannerFile) {
      const bannerPath = `banners/${Date.now()}-${bannerFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('advertisement-media')
        .upload(bannerPath, bannerFile);

      if (uploadError) throw uploadError;

      bannerUrl = supabase.storage.from('advertisement-media').getPublicUrl(bannerPath).data.publicUrl;
    }

    // Store data to use after payment selection
    pendingAdData = {
      email, amount, bannerUrl,
      bizName, owner: document.getElementById('ad-owner-name').value,
      phone: document.getElementById('ad-phone').value,
      wa: document.getElementById('ad-whatsapp').value,
      web: document.getElementById('ad-website').value,
      catId: document.getElementById('ad-category').value,
      title: document.getElementById('ad-title').value,
      description: document.getElementById('ad-description').value,
      location: document.getElementById('ad-location').value,
      package: document.getElementById('ad-package').value,
      duration: parseInt(document.getElementById('ad-duration').value),
      // Generate a unique reference before payment starts
      reference: 'PH-' + Math.floor(Math.random() * 1000000000 + 1)
    };

    // IMPROVEMENT: You should ideally save the ad as 'unpaid' here 
    // so you have a record if the user's browser crashes during payment.

    // Instructional popup for the multi-step payment process
    alert("Final Steps: \n1. Select your payment method in the next window.\n2. Complete the payment process.\n3. Click the button to know what next.\n4. Your ad will be automatically submitted once payment is confirmed!");

    const modal = document.getElementById('payment-modal');
    const amtSpan = document.getElementById('payment-modal-amount');
    if (amtSpan) amtSpan.textContent = amount.toLocaleString();
    if (modal) modal.classList.add('open');

    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Pay & Submit Advertisement';

  } catch (err) {
    console.error('Storage Error:', err);
    showToast(`Image upload failed: ${err.message}. Please check your Supabase Storage settings.`, 'error');
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    return; // Stop here if upload fails so user doesn't pay for an ad without a banner
  }
}

function showPaymentMethods() {
  const details = document.getElementById('manual-transfer-details');
  const selectionDiv = document.getElementById('payment-methods-selection');
  if (details) details.style.display = 'none';
  if (selectionDiv) selectionDiv.style.display = 'block';
}

function closePaymentModal() {
  document.getElementById('payment-modal')?.classList.remove('open');
}

async function initiateSelectedPayment(method) {
  if (!pendingAdData) return;
  closePaymentModal();

  if (method === 'paystack') {
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: pendingAdData.email,
      amount: pendingAdData.amount * 100,
      currency: 'NGN',
      reference: pendingAdData.reference,
      callback: async (response) => {
        await finalizeAdvertisement(response.reference, pendingAdData.amount, pendingAdData.bannerUrl);
      },
      onClose: () => showToast('Payment cancelled', 'info')
    });
    handler.openIframe();
  } else if (method === 'opay') {
    const details = document.getElementById('manual-transfer-details');
    const amtSpan = document.getElementById('transfer-amt');
    const selectionDiv = document.getElementById('payment-methods-selection');
    
    if (amtSpan) amtSpan.textContent = pendingAdData.amount.toLocaleString();
    if (details) details.style.display = 'block';
    if (selectionDiv) selectionDiv.style.display = 'none';
  }
}

async function confirmManualTransfer() {
  if (!pendingAdData) return;
  showToast('Submitting with manual payment...', 'info');
  // Reset modal UI for next time
  showPaymentMethods();
  
  closePaymentModal();
  // Process as 'pending' with a custom OPay reference
  await finalizeAdvertisement('OPAY-MANUAL-' + Date.now(), pendingAdData.amount, pendingAdData.bannerUrl);
}

async function finalizeAdvertisement(reference, amount, bannerUrl) {
  const data = pendingAdData || {};
  try {
    const { data: advertiser, error: advErr } = await supabase.from('advertisers').upsert({
      business_name: data.bizName, owner_name: data.owner, email: data.email,
      phone_number: data.phone, whatsapp_number: data.wa, website_url: data.web, category_id: data.catId
    }, { onConflict: 'email', ignoreDuplicates: false }) // ignoreDuplicates: false ensures update if exists
    .select().single();
    if (advErr) throw advErr;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + data.duration);

    const { error: adErr } = await supabase.from('advertisements').insert([{
      advertiser_id: advertiser.id,
      ad_title: data.title,
      category_id: data.catId, // Add category_id here
      ad_description: data.description,
      location: data.location,
      banner_url: bannerUrl,
      ad_package: data.package,
      duration_days: data.duration,
      amount_paid: amount,
      payment_reference: reference,
      status: 'pending',
      expiration_date: expiryDate.toISOString()
    }]);
    if (adErr) throw adErr;

    await fetchAdvertisements();
    showPage('home');
    
    // Celebration
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 20000 });
    showToast('Ad submitted successfully!', 'success');
    setTimeout(() => {
      pendingAdData = null;
      // Scroll to ads section to show the user their pending ad is in the list
      document.getElementById('home-featured-businesses')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 800);
  } catch (err) {
    console.error('Finalize Advertisement Error:', err);
    showToast(`Data save failed: ${err.message}`, 'error');
  }
}

function handleAdBannerPreview(event) {
  const input = event.target;
  const previewContainer = document.getElementById('ad-banner-preview');
  if (!previewContainer) return;
  previewContainer.innerHTML = '';

  const file = input.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    previewContainer.innerHTML = `
      <div class="ad-banner-preview-card">
        <img src="${reader.result}" alt="Banner preview" />
        <div class="preview-actions">
          <button type="button" class="preview-remove" onclick="removeAdBanner()" title="Remove banner image"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

function removeAdBanner() {
  const input = document.getElementById('ad-banner');
  const previewContainer = document.getElementById('ad-banner-preview');
  if (!input) return;
  input.value = '';
  if (previewContainer) previewContainer.innerHTML = '';
}

function openAdDetails(id) {
  const ad = ADVERTISEMENTS.find(a => a.id === id);
  if (!ad) return;
  
  const isExpired = ad.expiration_date && new Date(ad.expiration_date) < new Date();
  if (ad.status !== 'approved' || isExpired) {
    showToast('This advertisement is currently restricted.', 'info', 'fa-solid fa-lock');
    return;
  }
  
  // Store the current detail in a global variable and switch page
  window.currentAdDetail = ad;
  showPage('ad-details');
  renderAdDetail(ad);
}

/* ============================================================
   PORTFOLIO LOGIC
============================================================ */
let activeFilter = 'all';
function showToast(msg, type='success', icon='fa-solid fa-check') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="${icon}"></i><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 350); }, 2800);
}

function renderProductCard(p) {
  const badgeHtml = p.badge ? `<div class="product-badge ${p.badge==='Sale'?'sale':''}">${p.badge}</div>` : '';
  const clickHandler = p.isAd ? `openAdDetails('${p.id}')` : `openProductModal(${p.id})`;
  const favId = `project-${p.id}`;
  const favActive = FAVORITES.has(favId) ? 'active' : '';
  return `<div class="product-card reveal" data-id="${p.id}">
      <div class="product-img-wrap"><img src="${p.img}" alt="${p.name}" loading="lazy" />${badgeHtml}
        <button class="favorite-btn ${favActive}" data-favorite-id="${favId}" onclick="toggleFavorite('${favId}')" title="Save project"><i class="fa-solid fa-heart"></i></button>
        <div class="product-overlay"><div class="product-quick-view" onclick="${clickHandler}">View ${p.isAd ? 'Ad' : 'Project'}</div></div>
      </div>
      <div class="product-info"><div class="product-category">${p.category.toUpperCase()}</div><div class="product-name" style="margin-top:8px">${p.name}</div>
        <div class="product-bottom"><div><span class="product-price">${p.isAd ? 'Featured Business' : 'Case Study Available'}</span></div><button class="add-to-cart-btn" onclick="${clickHandler}"><i class="fa-solid fa-arrow-right"></i></button></div>
      </div>
    </div>`;
}

function renderFeatured() { 
  const grid = document.getElementById('featured-grid'); 
  if (!grid) return; 
  // Show strictly only professional portfolio projects in this section
  const combined = PRODUCTS.slice(0, 8);
  grid.innerHTML = combined.map(renderProductCard).join(''); 
  observeReveal();
}

function renderShop() {
  const grid = document.getElementById('shop-grid');
  const count = document.getElementById('shop-results-count');
  const search = (document.getElementById('shop-search')?.value || '').toLowerCase();
  const filtered = PRODUCTS.filter(p => { const catMatch = activeFilter === 'all' || p.category === activeFilter; const searchMatch = !search || p.name.toLowerCase().includes(search) || p.category.includes(search); return catMatch && searchMatch; });
  grid.innerHTML = filtered.length ? filtered.map(renderProductCard).join('') : `<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--text-muted)"><i class="fa-solid fa-magnifying-glass" style="font-size:40px;opacity:0.2;margin-bottom:16px;display:block"></i>No projects found.</div>`;
  count.innerHTML = `Showing <span>${filtered.length}</span> of <span>${PRODUCTS.length}</span> projects`;
}
function filterProducts() { renderShop(); }
function setFilter(btn, cat) { activeFilter = cat; document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderShop(); }
function renderServices() { const grid = document.getElementById('services-grid'); if (!grid) return; grid.innerHTML = SERVICES_DATA.map(s => `<div class="service-card reveal"><div class="service-icon"><i class="${s.icon}"></i></div><div class="service-title">${s.title}</div><div class="service-desc">${s.desc}</div></div>`).join(''); observeReveal(); }
function renderTeam() { const grid = document.getElementById('team-grid'); if (!grid) return; grid.innerHTML = TEAM_DATA.map(m => `<div class="team-card reveal"><div class="team-avatar" style="${m.img ? '' : `background:linear-gradient(135deg,${m.color}aa,${m.color}44)`}">${m.img ? `<img src="${m.img}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover">` : m.initials}</div><div class="team-name">${m.name}</div><div class="team-role">${m.role}</div><div class="team-bio">${m.bio}</div><div class="team-social"><a href="${m.xUrl || '#'}" target="_blank"><i class="fa-brands fa-x-twitter"></i></a><a href="#"><i class="fa-brands fa-linkedin-in"></i></a><a href="#"><i class="fa-brands fa-instagram"></i></a></div></div>`).join(''); observeReveal(); }
function renderTestimonials() { const track = document.getElementById('testimonials-track'); if (!track) return; const all = [...TESTIMONIALS, ...TESTIMONIALS]; track.innerHTML = all.map(t => `<div class="testimonial-card"><div class="testimonial-stars">${'★'.repeat(5)}</div><div class="testimonial-text">"${t.text}"</div><div class="testimonial-author"><div class="testimonial-avatar">${t.initials}</div><div><div class="testimonial-name">${t.name}</div><div class="testimonial-handle">${t.handle}</div></div></div></div>`).join(''); }
function renderBrands() { const track = document.getElementById('brand-track'); if (!track) return; const all = [...BRANDS, ...BRANDS]; track.innerHTML = all.map(b => `<div class="brand-item">${b}</div>`).join(''); }

function showPage(name, updateHash = true) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.getAttribute('data-page') === name);
  });
  
  const target = document.getElementById('page-' + name);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (updateHash) window.location.hash = name;
  }

  // Page-specific initialization logic
  const pageInitializers = {
    home: () => { renderFeatured(); renderTestimonials(); renderBrands(); renderHomeFeaturedAds(); },
    portfolio: () => renderShop(),
    'featured-businesses': () => { renderBusinessDirectory(); populateBusinessCategoryFilters(); },
    advertise: () => { populateAdvertiseCategoryOptions(); updatePackageAmount(); },
    admin: () => renderAdminDashboard(),
    'ad-details': () => { if (window.currentAdDetail) renderAdDetail(window.currentAdDetail); }, // Render ad details if navigating directly
    request: () => { initVoice(); initFileUpload(); },
    about: () => { renderTeam(); setTimeout(animateSkills, 500); }
  };

  if (pageInitializers[name]) {
    try {
      pageInitializers[name]();
    } catch (e) {
      console.error(`Error initializing page ${name}:`, e);
    }
  }
  
  observeReveal();
}

function renderAdDetail(ad) {
  const biz = ad.advertisers || {};
  const banner = ad.banner_url || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';
  
  const statusEl = document.getElementById('detail-status');
  const titleEl = document.getElementById('detail-business-name');
  const metaEl = document.getElementById('detail-business-category');
  const bannerEl = document.getElementById('detail-banner');
  const descEl = document.getElementById('detail-description');
  const webBtn = document.getElementById('detail-website');
  const waBtn = document.getElementById('detail-whatsapp');

  if (titleEl) titleEl.textContent = ad.ad_title;
  if (metaEl) metaEl.textContent = `${biz.business_name || 'Business'} • ${ad.location || 'Global'}`;
  if (bannerEl) bannerEl.style.backgroundImage = `url(${banner})`;
  if (descEl) descEl.textContent = ad.ad_description;
  if (statusEl) {
    statusEl.textContent = ad.status.toUpperCase();
    statusEl.className = `badge ${ad.status}`;
  }
  
  if (webBtn) biz.website_url ? (webBtn.href = biz.website_url, webBtn.style.display = 'inline-flex') : webBtn.style.display = 'none';
  if (waBtn) biz.whatsapp_number ? (waBtn.href = `https://wa.me/${biz.whatsapp_number.replace(/\D/g,'')}`, waBtn.style.display = 'inline-flex') : waBtn.style.display = 'none';
  
  observeReveal();
}

/* ============================================================
   PROJECT REQUEST LOGIC
============================================================ */
let selectedFiles = [];
let recognition;
function initVoice() {
  const btn = document.getElementById('voice-btn');
  const textarea = document.getElementById('request-description');
  const status = document.getElementById('voice-status');
  if (!btn) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    btn.style.display = 'none';
    return;
  }

  if (!recognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      textarea.value += (textarea.value ? ' ' : '') + transcript;
    };

    recognition.onend = () => {
      status.style.display = 'none';
      btn.style.background = 'var(--bg-glass)';
    };
  }

  btn.onclick = () => {
    if (status.style.display === 'block') {
      recognition.stop();
    } else {
      recognition.start();
      status.style.display = 'block';
      btn.style.background = 'var(--accent-2)';
    }
  };
}

function initFileUpload() {
  const dropZone = document.getElementById('drop-zone');
  const input = document.getElementById('request-files');
  const preview = document.getElementById('file-preview-container');
  if (!dropZone) return;

  dropZone.onclick = () => input.click();
  input.onchange = (e) => handleFiles(e.target.files);
  dropZone.ondragover = (e) => { e.preventDefault(); dropZone.classList.add('active'); };
  dropZone.ondragleave = () => { dropZone.classList.remove('active'); };
  dropZone.ondrop = (e) => { e.preventDefault(); dropZone.classList.remove('active'); handleFiles(e.dataTransfer.files); };

  function handleFiles(files) {
    const newFiles = Array.from(files);
    selectedFiles = [...selectedFiles, ...newFiles];
    renderFilePreviews();
  }
}

function renderFilePreviews() {
  const preview = document.getElementById('file-preview-container');
  if (!preview) return;
  preview.innerHTML = selectedFiles.map((file, index) => {
    let icon = file.type.startsWith('image/') ? 'fa-file-image' : (file.type.startsWith('video/') ? 'fa-file-video' : (file.type.includes('pdf') ? 'fa-file-pdf' : 'fa-file-lines'));
    return `
      <div class="file-preview-card">
        <i class="fa-solid ${icon}"></i>
        <div class="file-name">${file.name}</div>
        <button class="file-remove" onclick="removeFile(${index})"><i class="fa-solid fa-xmark"></i></button>
      </div>`;
  }).join('');
}

function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFilePreviews();
}

async function handleProjectRequest() {
  const desc = document.getElementById('request-description').value.trim();
  if (!desc) { showToast('Please describe your project', 'error'); return; }

  const submitBtn = document.querySelector('#page-request .submit-btn');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    // 1. Upload files to Supabase Storage first to get their URLs
    const uploadedUrls = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      // Sanitize filename: remove special characters and add timestamp to prevent collisions
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
      const fileName = `${Date.now()}-${i}-${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Storage Upload Error:', uploadError);
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(fileName);
      uploadedUrls.push(urlData.publicUrl);
    }

    // 2. Insert the main request including the voice_note_url
    const { data: requestData, error: requestError } = await supabase
      .from('client_requests')
      .insert([{ 
        project_description: desc,
        subject: 'Project Request: ' + (document.getElementById('request-name').value || 'Quick Request') + ' - ' + desc.substring(0, 20) + '...',
        first_name: document.getElementById('request-name').value || null,
        last_name: '', // Assuming no separate last name field for quick request
        email: document.getElementById('request-email').value || null, 
        company: 'N/A',
        phone: 'N/A',
        voice_note_url: uploadedUrls.length > 0 ? uploadedUrls.join(', ') : null
      }])
      .select();

    if (requestError) {
      console.error('Database Insert Error:', requestError);
      console.error('Hint: Ensure "voice_note_url" column exists in "client_requests" table.');
      throw new Error(requestError.message);
    }

    // 3. If there are files, also insert detailed records into request_attachments
    if (requestData && requestData.length > 0 && selectedFiles.length > 0) {
      const attachments = selectedFiles.map((file, index) => ({
        request_id: requestData[0].id,
        file_name: file.name,
        file_type: file.type,
        file_url: uploadedUrls[index] // Actual URL from storage
      }));

      const { error: attachError } = await supabase
        .from('request_attachments')
        .insert(attachments);

      if (attachError) {
        console.error('Supabase Attachment Error:', attachError);
        // We don't throw here so the user knows the main message at least went through
        showToast('Message sent, but files failed to attach.', 'info');
      }
    }

    showToast('Project request sent to PraxionHub!', 'success', 'fa-solid fa-paper-plane');
    
    // Note: If this still fails, ensure your 'client_requests' table 
    // allows NULL values for 'first_name' and 'email', as this form doesn't collect them. (Corrected below)
    ['request-name', 'request-email', 'request-description'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('file-preview-container').innerHTML = '';
    selectedFiles = [];
  } catch (err) {
    console.error('Project Request Failure:', err);
    showToast(`Error: ${err.message}`, 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

/* ============================================================
   SUPABASE CRUD OPERATIONS (Read, Update, Delete)
============================================================ */

/**
 * Reads requests from the database. 
 * Note: Ensure RLS policies allow 'anon' to read if testing publicly.
 */
async function getRequests(emailFilter = null) {
  try {
    let query = supabase.from('client_requests').select('*');
    if (emailFilter) {
      query = query.eq('email', emailFilter);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    console.log('Fetched Requests:', data);
    return data;
  } catch (err) {
    console.error('Error fetching data:', err.message);
    showToast('Failed to load requests', 'error');
  }
}

/**
 * Updates an existing request (e.g., marking it as "contacted")
 */
async function updateRequest(id, updates) {
  try {
    const { data, error } = await supabase
      .from('client_requests')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
    showToast('Request updated successfully', 'success');
    return data;
  } catch (err) {
    console.error('Error updating data:', err.message);
    showToast('Update failed', 'error');
  }
}

/**
 * Deletes a request by ID
 */
async function deleteRequest(id) {
  try {
    const { error } = await supabase.from('client_requests').delete().eq('id', id);
    if (error) throw error;
    showToast('Request deleted', 'info');
  } catch (err) {
    console.error('Error deleting data:', err.message);
    showToast('Delete failed', 'error');
  }
}

function animateSkills() {
  const bars = document.querySelectorAll('.skill-progress');
  bars.forEach(bar => {
    const targetWidth = bar.getAttribute('data-width');
    bar.style.width = targetWidth;
  });
}

/* ============================================================
   PRODUCT DETAIL MODAL LOGIC
============================================================ */
function openProductModal(id) {
  const p = PRODUCTS.find(item => item.id === id);
  if (!p) return;

  const content = document.getElementById('product-detail-content');
  content.innerHTML = ` 
    <div class="product-detail-img"><img src="${p.img}" alt="${p.name}" /></div>
    <div class="product-detail-info">
      <div class="product-category">${p.category.toUpperCase()}</div>
      <h2 class="product-name">${p.name}</h2>
      <div class="product-price">Digital Experience</div>
      <p class="product-detail-desc">A premium ${p.category} solution designed to push boundaries. Engineered for high-performance and visual impact.</p>
      <button class="submit-btn" onclick="showToast('Loading full case study...', 'info'); closeProductModal();">
        <i class="fa-solid fa-book-open"></i> View Full Case Study
      </button>
      ${p.url ? `<a href="${p.url}" target="_blank" class="submit-btn" style="text-decoration:none; display:flex; margin-top:12px; background:var(--accent-3)">
        <i class="fa-solid fa-globe"></i> Visit Live Website
      </a>` : ''}
    </div>
  `;

  document.getElementById('product-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function handleProductOverlayClick(e) {
  if (e.target.id === 'product-modal') closeProductModal();
}

function observeReveal() {
  setTimeout(() => {
    const els = document.querySelectorAll('.reveal:not(.visible)');
    const io = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }); }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => io.observe(el));
  }, 50);
}

let scrollTicking = false;
window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      document.getElementById('scroll-progress').style.width = (scrolled * 100) + '%';
      document.getElementById('back-to-top').classList.toggle('visible', window.scrollY > 400);
      scrollTicking = false;
    });
    scrollTicking = true;
  }
});

/* ============================================================
   TYPEWRITER EFFECT
============================================================ */
const words = ["Digital solutions for businesses.", "UI/UX.", "Web development.", "Startups.", "Branding.", "Ambitious creators.", "Graphics expert."];
let wordIdx = 0, charIdx = 0, isDeleting = false;
let typewriterEl = null;
function typeWriter() {
  if (!typewriterEl) typewriterEl = document.getElementById('typewriter');
  if (!typewriterEl) return;
  const currentWord = words[wordIdx];
  if (isDeleting) {
    typewriterEl.textContent = currentWord.substring(0, charIdx--);
    if (charIdx < 0) { isDeleting = false; wordIdx = (wordIdx + 1) % words.length; }
  } else {
    typewriterEl.textContent = currentWord.substring(0, charIdx++);
    if (charIdx > currentWord.length) { isDeleting = true; setTimeout(typeWriter, 2000); return; }
  }
  setTimeout(typeWriter, isDeleting ? 50 : 150);
}

async function loginAsAdmin() {
  // SECURE IMPROVEMENT: Use Supabase Auth instead of LocalStorage
  // This is a placeholder for the actual implementation
  const password = prompt("Enter Admin Access Code:");
  if (password === "0000") { // Replace with real Auth logic
    localStorage.setItem('isAdmin', 'true');
    showPage('admin');
    showToast('Logged in as Admin', 'success');
  } else {
    showToast('Unauthorized Access', 'error');
  }
}

function checkAdminAuth() {
  return localStorage.getItem('isAdmin') === 'true';
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('Account number copied!', 'info', 'fa-solid fa-copy');
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
}

function updateConnectionStatus() {
  const statusBtn = document.getElementById('connection-status');
  const statusText = document.getElementById('connection-text');
  if (!statusBtn || !statusText) return;

  if (navigator.onLine) {
    statusBtn.classList.remove('offline');
    statusBtn.classList.add('online');
    statusText.textContent = 'Online';
  } else {
    statusBtn.classList.remove('online');
    statusBtn.classList.add('offline');
    statusText.textContent = 'Offline';
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem('theme', isDark ? 'light' : 'dark'); // Save user preference
  const icon = document.querySelector('#theme-toggle i');
  
  // If we just switched to light (isDark was true), show moon. If switched to dark, show sun.
  icon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
  
  const toastIcon = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  showToast(isDark ? 'Light mode on' : 'Dark mode on', 'info', toastIcon);
}

async function handleContact() { 
  const fname = document.getElementById('contact-fname').value.trim(); 
  const lname = document.getElementById('contact-lname').value.trim(); 
  const email = document.getElementById('contact-email').value.trim(); 
  const company = document.getElementById('contact-company').value.trim(); 
  const phone = document.getElementById('contact-phone').value.trim(); 
  const subject = document.getElementById('contact-subject').value.trim(); 
  const msg = document.getElementById('contact-message').value.trim(); 
  
  if (!fname || !email || !msg) { showToast('Please complete the form', 'error', 'fa-solid fa-exclamation'); return; } 
  if (!/\S+@\S+\.\S+/.test(email)) { showToast('Enter a valid email', 'error', 'fa-solid fa-exclamation'); return; } 

  const submitBtn = document.querySelector('#page-contact .submit-btn');
  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  try {
    const { error } = await supabase
      .from('client_requests')
      .insert([{ 
        first_name: fname, 
        last_name: lname,
        email: email, 
        company: company,
        phone: phone,
        subject: subject,
        project_description: msg,
        voice_note_url: null
      }]);

    if (error) {
      console.error('Contact Form Supabase Error:', error);
      throw new Error(error.message);
    }

    ['contact-fname','contact-lname','contact-email','contact-company','contact-phone','contact-subject','contact-message'].forEach(id => { 
      const el = document.getElementById(id); if (el) el.value = ''; 
    }); 
    showToast('Message sent! We\'ll be in touch.', 'success', 'fa-solid fa-paper-plane');
  } catch (err) {
    console.error('Contact Save Error:', err);
    showToast(`Error: ${err.message || 'Check console for details'}`, 'error');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  }
}

function toggleFAQ(el) { const item = el.closest('.faq-item'); if (item) item.classList.toggle('open'); }

function toggleMobileNav() { const nav = document.getElementById('mobile-nav'); const btn = document.getElementById('hamburger'); nav.classList.toggle('open'); btn.classList.toggle('open'); }

// --- Cursor Logic ---
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { 
  mx = e.clientX; my = e.clientY; 
  if(dot) { dot.style.left = mx+'px'; dot.style.top = my+'px'; }
});

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

function animRing() { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; if(ring) { ring.style.left = rx+'px'; ring.style.top = ry+'px'; } requestAnimationFrame(animRing); }
if (ring) animRing();

document.addEventListener('mousedown', () => { if(dot) dot.style.transform = 'translate(-50%,-50%) scale(0.6)'; if(ring) ring.style.transform = 'translate(-50%,-50%) scale(0.8)'; });
document.addEventListener('mouseup', () => { if(dot) dot.style.transform = 'translate(-50%,-50%) scale(1)'; if(ring) ring.style.transform = 'translate(-50%,-50%) scale(1)'; });
document.addEventListener('mouseover', e => { if (dot && ring && e.target.closest('button, a, input, textarea, [onclick]')) { dot.style.width = '12px'; dot.style.height = '12px'; ring.style.width = '50px'; ring.style.height = '50px'; ring.style.borderColor = 'rgba(232,255,71,0.8)'; } });
document.addEventListener('mouseout', e => { if (dot && ring && e.target.closest('button, a, input, textarea, [onclick]')) { dot.style.width = '8px'; dot.style.height = '8px'; ring.style.width = '36px'; ring.style.height = '36px'; ring.style.borderColor = 'rgba(232,255,71,0.5)'; } });


window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '') || 'home';
  showPage(hash, false);
});

window.addEventListener('load', () => { 
  // Initialize Theme from LocalStorage (Default to Light)
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  const themeIcon = document.querySelector('#theme-toggle i');
  if (themeIcon) {
    themeIcon.className = savedTheme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  setTimeout(async () => { // Made this async to await fetchAdvertisements
    loadFavorites();
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('done'); 
    }
    // Safe-check: only run if the page is currently 'home' or empty hash
    const initialHash = window.location.hash.replace('#', '') || 'home';
    showPage(initialHash, false);
    typeWriter(); // Start typewriter after initial page load
    updateConnectionStatus();
    await fetchAdvertisements(); // Ensure ads are fetched before rendering
    subscribeToAdChanges(); // Listen for live ad updates and show popups
    refreshFavoriteButtons();
    showNewUserPopupIfNeeded();
  }, 800); 
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProductModal(); } });

// Load Firebase dynamically to avoid blocking the main execution thread
async function initFirebase() {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    const { getAnalytics, isSupported } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js");
    const firebaseConfig = {
      apiKey: "AIzaSyC3DIt_p9FL4Rk6Y5qUa3cz2FSGqFxvJvM",
      authDomain: "pixelpulse-de.firebaseapp.com",
      projectId: "pixelpulse-de",
      storageBucket: "pixelpulse-de.firebasestorage.app",
      messagingSenderId: "1042215042839",
      appId: "1:1042215042839:web:888a6010c8ec87c375c152",
      measurementId: "G-BPYCNS3K4L"
    };
    const app = initializeApp(firebaseConfig);
    const yes = await isSupported();
    if (yes) getAnalytics(app);
  } catch (e) { console.warn("Firebase Analytics could not be loaded."); }
}
initFirebase();

/* ============================================================
   EXPOSE FUNCTIONS TO GLOBAL SCOPE
   (Required because type="module" scopes functions locally)
============================================================ */
const globalFunctions = {
  showPage,
  toggleTheme,
  toggleMobileNav,
  toggleFAQ,
  renderBusinessDirectory,
  renderAdminDashboard,
  updateAdStatus,
  deleteAd,
  openAdDetails,
  handleAdvertiseSubmit,
  updatePackageAmount,
  fetchAdvertisements,
  renderHomeFeaturedAds,
  renderAdDetail,
  filterProducts,
  setFilter,
  openProductModal,
  closeProductModal,
  showPaymentMethods,
  initiateSelectedPayment,
  confirmManualTransfer,
  handleProductOverlayClick,
  handleProjectRequest,
  handleContact,
  getRequests,
  updateRequest,
  deleteRequest,
  removeFile,
  copyToClipboard,
  loginAsAdmin,
  openFavoritesPanel,
  closeFavoritesPanel,
  toggleFavorite,
  refreshFavoriteButtons,
  renderFavoritesPanel
};
Object.entries(globalFunctions).forEach(([name, fn]) => window[name] = fn);