/* ============================================================
   IMPORTS (Must be at the top)
============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

/* ============================================================
   SUPABASE CONFIGURATION
============================================================ */
const supabaseUrl = 'https://nzrmcmswxdyheaxjvyuk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56cm1jbXN3eGR5aGVheGp2eXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTAwMzIsImV4cCI6MjA5NDM4NjAzMn0.gpLjFE4f6TOQxCVE6bePDgYSY-XX2O3YCogJEYXr-bQ';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
  { text:'Samuel transformed our vision into a digital masterpiece. The animations are world-class.', name:'Sarah Jenkins', handle:'@ceo_vanta', initials:'SJ' },
  { text:'PraxionHub design is unmatched. Our app downloads tripled after the redesign.', name:'Marcus Chen', handle:'@marcus_dev', initials:'MC' },
  { text:'Fast, efficient, and creatively brilliant. Samuel is the greatest developer we have worked with.', name:'David Okafor', handle:'@startup_founder', initials:'DO' },
];

const BRANDS = ['Boutiques', 'Professional businesses', 'Catering', 'Bakery', 'Schools', 'Stations', 'Churches', 'Salons', 'Freelancers', 'Agencies', 'Restaurants', 'Fitness Centers', 'Singers', 'industries', 'and more...'];

const SERVICES_DATA = [
  { icon:'fa-solid fa-code', title:'Web Development', desc:'Scalable, responsive, and blazing-fast websites built with modern frameworks.' },
  { icon:'fa-solid fa-mobile-screen', title:'App Development', desc:'Cross-platform mobile applications that offer native performance and seamless transitions.' },
  { icon:'fa-solid fa-palette', title:'Graphic Design', desc:'Visual storytelling through high-impact graphics, typography, and professional layouts.' },
  { icon:'fa-solid fa-fingerprint', title:'Branding', desc:'Complete brand identity systems including logos, style guides, and digital brand voice.' },
];

const TEAM_DATA = [{ name:'Samuel Arogundade', role:'Founder & Creative Lead', bio:'Engineer at heart, designer by soul. Building the future of the web.', initials:'SA', color:'#7c3aed', img:'asset/sam business pic.png' }];

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
  const oldPriceHtml = p.oldPrice ? `<span class="product-price-old">$${p.oldPrice}</span>` : '';
  return `<div class="product-card reveal">
      <div class="product-img-wrap"><img src="${p.img}" alt="${p.name}" loading="lazy" />${badgeHtml}
        <div class="product-overlay"><div class="product-quick-view" onclick="openProductModal(${p.id})">View Project</div></div>
      </div>
      <div class="product-info"><div class="product-category">${p.category.toUpperCase()}</div><div class="product-name" style="margin-top:8px">${p.name}</div>
        <div class="product-bottom"><div><span class="product-price">Case Study Available</span></div><button class="add-to-cart-btn" onclick="openProductModal(${p.id})"><i class="fa-solid fa-arrow-right"></i></button></div>
      </div>
    </div>`;
}

function renderFeatured() { const grid = document.getElementById('featured-grid'); if (!grid) return; grid.innerHTML = PRODUCTS.slice(0, 4).map(renderProductCard).join(''); observeReveal(); }
function renderShop() {
  const grid = document.getElementById('shop-grid');
  const count = document.getElementById('shop-results-count');
  const search = (document.getElementById('shop-search')?.value || '').toLowerCase();
  const filtered = PRODUCTS.filter(p => { const catMatch = activeFilter === 'all' || p.category === activeFilter; const searchMatch = !search || p.name.toLowerCase().includes(search) || p.category.includes(search); return catMatch && searchMatch; });
  grid.innerHTML = filtered.length ? filtered.map(renderProductCard).join('') : `<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--text-muted)"><i class="fa-solid fa-magnifying-glass" style="font-size:40px;opacity:0.2;margin-bottom:16px;display:block"></i>No projects found.</div>`;
  count.innerHTML = `Showing <span>${filtered.length}</span> of <span>${PRODUCTS.length}</span> projects`;
  observeReveal();
}
function filterProducts() { renderShop(); }
function setFilter(btn, cat) { activeFilter = cat; document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); renderShop(); }
function renderServices() { const grid = document.getElementById('services-grid'); if (!grid) return; grid.innerHTML = SERVICES_DATA.map(s => `<div class="service-card reveal"><div class="service-icon"><i class="${s.icon}"></i></div><div class="service-title">${s.title}</div><div class="service-desc">${s.desc}</div></div>`).join(''); observeReveal(); }
function renderTeam() { const grid = document.getElementById('team-grid'); if (!grid) return; grid.innerHTML = TEAM_DATA.map(m => `<div class="team-card reveal"><div class="team-avatar" style="${m.img ? '' : `background:linear-gradient(135deg,${m.color}aa,${m.color}44)`}">${m.img ? `<img src="${m.img}" alt="${m.name}" style="width:100%;height:100%;object-fit:cover">` : m.initials}</div><div class="team-name">${m.name}</div><div class="team-role">${m.role}</div><div class="team-bio">${m.bio}</div><div class="team-social"><a href="#"><i class="fa-brands fa-x-twitter"></i></a><a href="#"><i class="fa-brands fa-linkedin-in"></i></a><a href="#"><i class="fa-brands fa-instagram"></i></a></div></div>`).join(''); observeReveal(); }
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
    home: () => { renderFeatured(); renderTestimonials(); renderBrands(); },
    portfolio: () => renderShop(),
    services: () => renderServices(),
    request: () => { initVoice(); initFileUpload(); },
    about: () => { renderTeam(); setTimeout(animateSkills, 500); }
  };

  if (pageInitializers[name]) {
    pageInitializers[name]();
  }
  
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
        subject: 'Project Request: ' + desc.substring(0, 20) + '...',
        first_name: 'Quick',
        last_name: 'Request',
        email: 'request@praxionhub.local', 
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
    // allows NULL values for 'first_name' and 'email', as this form doesn't collect them.
    document.getElementById('request-description').value = '';
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
const words = ["Designer.", "Web Developer.", "App Architect.", "Graphics Expert."];
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

function toggleMobileNav() { const nav = document.getElementById('mobile-nav'); const btn = document.getElementById('hamburger'); nav.classList.toggle('open'); btn.classList.toggle('open'); }

// --- Cursor Logic ---
const dot = document.getElementById('cursor-dot');
const ring = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { 
  mx = e.clientX; my = e.clientY; 
  if(dot) { dot.style.left = mx+'px'; dot.style.top = my+'px'; }
});

function animRing() { rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12; ring.style.left = rx+'px'; ring.style.top = ry+'px'; requestAnimationFrame(animRing); }
if (ring) animRing();

document.addEventListener('mousedown', () => { dot.style.transform = 'translate(-50%,-50%) scale(0.6)'; ring.style.transform = 'translate(-50%,-50%) scale(0.8)'; });
document.addEventListener('mouseup', () => { dot.style.transform = 'translate(-50%,-50%) scale(1)'; ring.style.transform = 'translate(-50%,-50%) scale(1)'; });
document.addEventListener('mouseover', e => { if (e.target.closest('button, a, input, textarea, [onclick]')) { dot.style.width = '12px'; dot.style.height = '12px'; ring.style.width = '50px'; ring.style.height = '50px'; ring.style.borderColor = 'rgba(232,255,71,0.8)'; } });
document.addEventListener('mouseout', e => { if (e.target.closest('button, a, input, textarea, [onclick]')) { dot.style.width = '8px'; dot.style.height = '8px'; ring.style.width = '36px'; ring.style.height = '36px'; ring.style.borderColor = 'rgba(232,255,71,0.5)'; } });


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

  setTimeout(() => { 
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('done'); 
    }
    // Safe-check: only run if the page is currently 'home' or empty hash
    const initialHash = window.location.hash.replace('#', '') || 'home';
    showPage(initialHash, false);
    typeWriter();
  }, 2100); 
});

document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeProductModal(); } });

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3DIt_p9FL4Rk6Y5qUa3cz2FSGqFxvJvM",
  authDomain: "pixelpulse-de.firebaseapp.com",
  projectId: "pixelpulse-de",
  storageBucket: "pixelpulse-de.firebasestorage.app",
  messagingSenderId: "1042215042839",
  appId: "1:1042215042839:web:888a6010c8ec87c375c152",
  measurementId: "G-BPYCNS3K4L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only if supported (prevents crashes if blocked by ad-blockers)
isSupported().then(yes => yes ? getAnalytics(app) : null);

/* ============================================================
   EXPOSE FUNCTIONS TO GLOBAL SCOPE
   (Required because type="module" scopes functions locally)
============================================================ */
const globalFunctions = {
  showPage,
  toggleTheme,
  toggleMobileNav,
  filterProducts,
  setFilter,
  openProductModal,
  closeProductModal,
  handleProductOverlayClick,
  handleProjectRequest,
  handleContact,
  getRequests,
  updateRequest,
  deleteRequest,
  removeFile
};
Object.entries(globalFunctions).forEach(([name, fn]) => window[name] = fn);