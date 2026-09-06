// ==========================================
// YASIR JAVED KHAN - PORTFOLIO JAVASCRIPT
// Lightweight, Vanilla ES6+, Zero Frameworks
// ==========================================

try { lucide.createIcons(); } catch (e) {}

// Dynamic footer copyright year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Hero image fallback (CSP-safe, replaces inline onerror)
const heroImg = document.getElementById('heroImg');
if (heroImg) heroImg.addEventListener('error', () => { heroImg.onerror = null; heroImg.src = 'assets/me.png'; });

// Navbar scrolled state — premium shadow
const navbar = document.getElementById('navbar');
if (navbar) {
  const onScrollNav = () => navbar.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();
}

// ==========================================
// THEME — dark mode deep, respects system, persists, no break
// ==========================================
(function(){
  const docEl = document.documentElement;
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  const t1 = document.getElementById('themeToggle');
  const t2 = document.getElementById('themeToggleMobile');
  function getPreferred(){ try{ const s=localStorage.getItem('theme'); if(s==='dark'||s==='light') return s; }catch(e){} return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function applyTheme(theme){
    docEl.setAttribute('data-theme', theme);
    try{ localStorage.setItem('theme', theme); }catch(e){}
    if(metaTheme) metaTheme.setAttribute('content', theme==='dark' ? '#0F1115' : '#0B1220');
    const isDark = theme==='dark';
    [t1, t2].forEach(btn=>{
      if(!btn) return;
      btn.setAttribute('aria-pressed', String(isDark));
      const moon = btn.querySelector('.icon-moon');
      const sun = btn.querySelector('.icon-sun');
      if(moon && sun){ moon.style.display = isDark ? 'none' : ''; sun.style.display = isDark ? '' : 'none'; }
      btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    });
    try{ lucide.createIcons(); }catch(e){}
  }
  // init from early script (already set) but ensure icons sync
  applyTheme(docEl.getAttribute('data-theme') || getPreferred());
  function toggle(){ applyTheme(docEl.getAttribute('data-theme')==='dark' ? 'light' : 'dark'); }
  if(t1) t1.addEventListener('click', toggle);
  if(t2) t2.addEventListener('click', toggle);
  // follow system if no explicit choice
  try{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', e=>{
      try{ if(!localStorage.getItem('theme')) applyTheme(e.matches ? 'dark' : 'light'); }catch(err){}
    });
  }catch(e){}
})();

// ==========================================
// 1. MOBILE NAVIGATION
// ==========================================
const ham = document.getElementById('hamburger');
const mobile = document.getElementById('mobileMenu');
if (ham && mobile) {
  const iconMenu = ham.querySelector('.icon-menu');
  const iconClose = ham.querySelector('.icon-close');
  function setMenuState(open){
    mobile.classList.toggle('open', open);
    ham.setAttribute('aria-expanded', String(open));
    ham.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    mobile.setAttribute('aria-hidden', String(!open));
    if(iconMenu) iconMenu.style.display = open ? 'none' : '';
    if(iconClose) iconClose.style.display = open ? '' : 'none';
    document.body.style.overflow = open ? 'hidden' : '';
    // a11y: make background inert when menu open
    const mainEl = document.getElementById('main-content');
    if(mainEl){ if(open) mainEl.setAttribute('inert',''); else mainEl.removeAttribute('inert'); }
  }
  ham.addEventListener('click', () => {
    const open = !mobile.classList.contains('open');
    setMenuState(open);
  });

  mobile.querySelectorAll('a, button').forEach(a => a.addEventListener('click', () => setMenuState(false)));

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (mobile.classList.contains('open') && !mobile.contains(e.target) && !ham.contains(e.target)) {
      setMenuState(false);
    }
  });
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobile.classList.contains('open')) setMenuState(false);
  });
}

// ==========================================
// 2. SMOOTH SCROLLING (with header offset)
// ==========================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      if (href === '#home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      history.pushState(null, '', href);

      // Close mobile drawer if open
      if (mobile && mobile.classList.contains('open')) {
        mobile.classList.remove('open');
        mobile.setAttribute('aria-hidden', 'true');
        if (ham) {
          ham.setAttribute('aria-expanded', 'false');
          ham.setAttribute('aria-label', 'Open menu');
          const im = ham.querySelector('.icon-menu'), ic = ham.querySelector('.icon-close');
          if(im) im.style.display=''; if(ic) ic.style.display='none';
          document.body.style.overflow = '';
          const mainEl2 = document.getElementById('main-content');
          if(mainEl2) mainEl2.removeAttribute('inert');
        }
      }

      // Autofocus contact form input when clicking "Let's Connect"
      if (href === '#contact') {
        setTimeout(() => {
          const n = document.getElementById('name');
          if (n) n.focus();
        }, 500);
      }
    }
  });
});

// ==========================================
// 3. ACTIVE NAV HIGHLIGHT ON SCROLL — 4-item nav (maps subsections)
// ==========================================
const mainSections = document.querySelectorAll('#home, #about, #projects, #contact');
const navLinks = document.querySelectorAll('.nav-links a');
const sectionToNav = { home:'#home', about:'#about', why:'#about', skills:'#about', approach:'#about', achievements:'#about', projects:'#projects', flagship:'#projects', lab:'#projects', contact:'#contact' };
if ('IntersectionObserver' in window && mainSections.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const navId = sectionToNav[e.target.id] || `#${e.target.id}`;
        navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === navId));
      }
    });
  }, { rootMargin: '-20% 0px -55% 0px', threshold: 0 });
  mainSections.forEach(s => observer.observe(s));
  // also observe key subsections to keep parent active on deep scroll
  document.querySelectorAll('#flagship, #lab, #skills, #why, #achievements').forEach(el => { if(el) observer.observe(el); });
}

// ==========================================
// 4. TOAST NOTIFICATIONS
// ==========================================
let toastTimer = null;
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ==========================================
// 5. CONTACT FORM (MAILTO)
// ==========================================
// Static hosting cannot receive form submissions. The form opens the visitor's
// configured email app with a prefilled message instead of pretending to send it.
const form = document.getElementById('contactForm');
if (form) {
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const subjectEl = document.getElementById('subject');
  const msgEl = document.getElementById('message');

  [nameEl, emailEl, subjectEl, msgEl].forEach(el => {
    if (!el) return;
    el.addEventListener('input', () => {
      el.style.borderColor = '';
      el.removeAttribute('aria-invalid');
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    let valid = true;
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const subject = subjectEl.value.trim();
    const message = msgEl.value.trim();

    [nameEl, emailEl, subjectEl, msgEl].forEach(el => el.style.borderColor = '');

    if (!name) { nameEl.style.borderColor = '#dc2626'; nameEl.setAttribute('aria-invalid', 'true'); valid = false; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { emailEl.style.borderColor = '#dc2626'; emailEl.setAttribute('aria-invalid', 'true'); valid = false; }
    if (!subject) { subjectEl.style.borderColor = '#dc2626'; subjectEl.setAttribute('aria-invalid', 'true'); valid = false; }
    if (!message || message.length < 10) {
      msgEl.style.borderColor = '#dc2626';
      msgEl.setAttribute('aria-invalid', 'true');
      valid = false;
      if (message && message.length < 10) toast('Message should be at least 10 characters');
    }

    if (!valid) {
      [nameEl, emailEl, subjectEl, msgEl].find(el => el.getAttribute('aria-invalid') === 'true')?.focus();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) toast('Please enter a valid email');
      else if (!message || message.length < 10) {}
      else toast('Please fill all fields correctly');
      return;
    }

    const mailto = `mailto:codewithyazzy@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailto;
    form.reset();
    toast('Your email app is opening.');
  });
}

// ==========================================
// 6. MODAL & DEMO CONTROLLERS
// ==========================================
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalDemo = document.getElementById('modalDemo');
const modalGithub = document.getElementById('modalGithub');
const modalDesc = document.getElementById('modalDesc');
let lastFocus = null;

function openDemoTab(title) {
  const isFile = location.protocol === 'file:';
  const pageRoot = location.pathname.includes('/pages/') ? '../' : '';
  const demoPrefix = `${pageRoot}pages/demo${isFile ? '.html' : ''}`;
  const url = `${demoPrefix}?project=${encodeURIComponent(title)}`;
  const win = window.open(url, '_blank');
  if (!win) toast('Please allow popups for demo');
}

function isDirectoryRoute(segment) {
  const path = decodeURIComponent(location.pathname).replace(/\\/g, '/').toLowerCase();
  return path.includes(`/pages/${segment}.html`);
}

function openModal(title, github, demo) {
  if (!modal || !modalTitle) return;
  lastFocus = document.activeElement;
  modalTitle.textContent = title;

  if (modalGithub) {
    modalGithub.href = github || 'https://github.com/CodeWithYazzy';
    modalGithub.setAttribute('aria-label', 'GitHub profile for ' + title);
  }
  if (modalDemo) {
    modalDemo.href = '#';
    modalDemo.setAttribute('aria-label', 'Project preview for ' + title);
    modalDemo.dataset.demoTitle = title;
  }
  if (modalDesc) {
    modalDesc.textContent = `${title} — open the project preview or browse the GitHub profile.`;
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const _mainA = document.getElementById('main-content');
  const _navA = document.getElementById('navbar');
  if(_mainA) _mainA.setAttribute('inert','');
  if(_navA) _navA.setAttribute('inert','');
  try { lucide.createIcons(); } catch (e) {}

  const closeBtn = document.getElementById('modalClose');
  if (closeBtn) closeBtn.focus();
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  const _mainB = document.getElementById('main-content');
  const _navB = document.getElementById('navbar');
  if(_mainB) _mainB.removeAttribute('inert');
  if(_navB) _navB.removeAttribute('inert');
  if (lastFocus) lastFocus.focus();
}

// Attach modal events
const modalCloseBtn = document.getElementById('modalClose');
if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
if (modal) {
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  modal.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
    const focusable = modal.querySelectorAll('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal && modal.classList.contains('open')) closeModal();
});

if (modalDemo) {
  modalDemo.addEventListener('click', e => {
    e.preventDefault();
    openDemoTab(modalDemo.dataset.demoTitle || modalTitle.textContent);
  });
}
if (modalGithub) {
  modalGithub.addEventListener('click', e => {
    const href = modalGithub.getAttribute('href');
    if (!href || href === '#') {
      e.preventDefault();
      toast('GitHub profile is unavailable for this project.');
    }
  });
}

// ==========================================
// 6b. LAB EXPERIMENT MODAL
// ==========================================
const LAB_EXPERIMENTS = [
  {
    title: 'CNN vs Transfer Learning',
    desc: 'Comparing training from scratch against pretrained backbones on image classification.',
    hypothesis: 'Pretrained features reduce training time and improve generalization on small datasets.',
    setup: 'CIFAR-10, 50k train / 10k test, 80/20 train/val split, fixed seed, same augmentation for both arms.',
    baseline: '3-layer CNN from scratch — 1.2M params, trained 50 epochs.',
    method: 'Fine-tune ResNet-18 (ImageNet pretrained, last block unfrozen) for 10 epochs; same optimizer and schedule.',
    metrics: 'Held-out accuracy, training time, and per-class F1 — logged per epoch.',
    result: '',
    conclusion: ''
  },
  {
    title: 'Model Evaluation',
    desc: 'Systematic evaluation with train/validation/test discipline.',
    hypothesis: 'Held-out evaluation reveals true generalization beyond training metrics.',
    setup: 'Stratified 70/15/15 split; 5-fold CV on train; test locked until final reporting.',
    baseline: 'Training accuracy alone — optimistic and not trusted for decisions.',
    method: 'Train/val/test splits, cross-validation where applicable, and per-class reporting.',
    metrics: 'Accuracy, precision/recall, F1, ROC-AUC, and confusion matrices on held-out test.',
    result: '',
    conclusion: ''
  },
  {
    title: 'Hyperparameter Experiments',
    desc: 'Grid and randomized search for learning rate, depth, and regularization.',
    hypothesis: 'Learning rate and regularization dominate validation performance.',
    setup: 'Single dataset, fixed split, early stopping on validation loss.',
    baseline: 'Default hyperparameters from library defaults.',
    method: 'Grid and randomized search for learning rate, depth, weight decay, batch size.',
    metrics: 'Validation loss/accuracy curves and best-config test score.',
    result: '',
    conclusion: ''
  },
  {
    title: 'Transformer Experiments',
    desc: 'Exploring attention-based models for text.',
    hypothesis: 'Attention handles long-range dependencies better than bag-of-words baselines.',
    setup: 'Same text corpus, 80/20 split, shared tokenizer vocabulary and max length.',
    baseline: 'TF-IDF + Logistic Regression (bag-of-words, no sequence).',
    method: 'Transformer-style model: tokenization, positional encoding, fine-tuning with held-out evaluation.',
    metrics: 'Accuracy, F1, and qualitative generation samples on held-out set.',
    result: '',
    conclusion: ''
  },
  {
    title: 'Data Analysis',
    desc: 'Exploratory analysis of feature distributions and preprocessing decisions.',
    hypothesis: 'Understanding distributions and correlations informs better feature engineering.',
    setup: 'Raw CSV loaded, profiling with Pandas; no modeling yet.',
    baseline: 'Raw features without scaling or imputation.',
    method: 'Pandas profiling, visualization, and preprocessing ablations.',
    metrics: 'Distribution plots, correlation heatmaps, and missing-value impact on baseline model.',
    result: '',
    conclusion: ''
  },
  {
    title: 'Model Optimization',
    desc: 'Profiling inference latency and model size trade-offs.',
    hypothesis: 'Smaller models can retain accuracy while improving latency for deployment.',
    setup: 'Fixed test set, batch sizes 1/16/32, same hardware (CPU/GPU) for all runs.',
    baseline: 'Full-precision, unoptimized model.',
    method: 'Quantization, pruning, and export (ONNX/TorchScript) with latency profiling.',
    metrics: 'Latency (ms), model size (MB), and accuracy delta vs baseline.',
    result: '',
    conclusion: ''
  }
];
const labModal = document.getElementById('labModal');
const labModalTitle = document.getElementById('labModalTitle');
const labModalDesc = document.getElementById('labModalDesc');
const labModalBody = document.getElementById('labModalBody');
let labLastFocus = null;
function openLabModal(index) {
  const exp = LAB_EXPERIMENTS[index];
  if (!exp || !labModal || !labModalTitle) return;
  labLastFocus = document.activeElement;
  document.querySelectorAll('.lab-card').forEach(c=>c.setAttribute('aria-expanded','false'));
  const trigger = document.querySelector(`.lab-card[data-lab="${index}"]`);
  if(trigger) trigger.setAttribute('aria-expanded','true');
  labModalTitle.textContent = exp.title;
  if (labModalDesc) labModalDesc.textContent = exp.desc;
  if (labModalBody) {
    labModalBody.replaceChildren();
    const fields = [
      ['Hypothesis', exp.hypothesis],
      ['Setup', exp.setup],
      ['Baseline', exp.baseline],
      ['Model / Method', exp.method],
      ['Metrics', exp.metrics],
      ['Result', exp.result || 'Evaluation pending — documented after held-out testing. No fabricated results.'],
      ['Conclusion', exp.conclusion || 'Pending — updated when measurements are available.']
    ];
    fields.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.style.cssText = 'border:1px solid var(--border);border-radius:6px;padding:12px;background:var(--light)';
      const h = document.createElement('div');
      h.textContent = label;
      h.style.cssText = 'font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--blue);margin-bottom:4px';
      const p = document.createElement('div');
      p.textContent = value;
      p.style.cssText = 'font-size:13px;color:var(--muted);line-height:1.6';
      row.append(h, p);
      labModalBody.appendChild(row);
    });
  }
  labModal.classList.add('open');
  labModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  const _mainC = document.getElementById('main-content');
  const _navC = document.getElementById('navbar');
  if(_mainC) _mainC.setAttribute('inert','');
  if(_navC) _navC.setAttribute('inert','');
  try { lucide.createIcons(); } catch (e) {}
  const c = document.getElementById('labModalClose');
  if (c) c.focus();
}
function closeLabModal() {
  if (!labModal) return;
  labModal.classList.remove('open');
  labModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  const _mainD = document.getElementById('main-content');
  const _navD = document.getElementById('navbar');
  if(_mainD) _mainD.removeAttribute('inert');
  if(_navD) _navD.removeAttribute('inert');
  document.querySelectorAll('.lab-card').forEach(c=>c.setAttribute('aria-expanded','false'));
  if (labLastFocus) labLastFocus.focus();
}
const labModalCloseBtn = document.getElementById('labModalClose');
if (labModalCloseBtn) labModalCloseBtn.addEventListener('click', closeLabModal);
if (labModal) {
  labModal.addEventListener('click', e => { if (e.target === labModal) closeLabModal(); });
  labModal.addEventListener('keydown', e => {
    if (e.key !== 'Tab' || !labModal.classList.contains('open')) return;
    const focusable = labModal.querySelectorAll('button, a[href], input, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && labModal && labModal.classList.contains('open')) closeLabModal(); });
document.querySelectorAll('.lab-card').forEach(card => {
  const idx = Number(card.getAttribute('data-lab'));
  if (Number.isNaN(idx)) return;
  card.addEventListener('click', () => openLabModal(idx));
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLabModal(idx); } });
});

// "View All Projects" button on homepage
const viewAllBtn = document.getElementById('viewAllBtn');
if (viewAllBtn) {
  viewAllBtn.addEventListener('click', e => {
    e.preventDefault();
    const isFile = location.protocol === 'file:';
    const target = location.pathname.includes('/pages/') ? `all-projects${isFile ? '.html' : ''}` : `pages/all-projects${isFile ? '.html' : ''}`;
    window.location.href = target;
  });
}

// ==========================================
// 7. DYNAMIC PROJECT RENDERING (from data/projects.json)
// ==========================================

// Built-in fallback projects ensuring offline/file:// protocol support
const FALLBACK_PROJECTS = [
    {
      "name": "Iris Flower Classifier",
      "badge": "scikit-learn",
      "image": "assets/iris-classifier.webp",
      "description": "Multi-class classification on the Iris dataset — stratified split, scikit-learn pipeline, 97% test accuracy.",
      "technologies": ["Python", "scikit-learn", "Pandas", "Model Evaluation"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/iris-classifier",
      "demo": "",
      "featured": true,
      "signal": "Scikit-learn · Classification · Tabular",
      "metrics": [{"label": "Accuracy", "value": "97%", "note": "held-out test"}],
      "problem": "Classify iris species from sepal and petal measurements.",
      "approach": "Stratified train/test split, preprocessing pipeline, cross-validation, and model comparison.",
      "dataset": "Iris dataset — 150 samples, 4 numeric features, 3 classes.",
      "model": "Scikit-learn pipeline (e.g., Logistic Regression / Random Forest) with scaling.",
      "results": "97% accuracy on held-out test set. Confusion matrix and classification report in notebook.",
      "engineering": "Notebook + reusable Python module, reproducible train/evaluate scripts.",
      "dataPreprocessing": "StandardScaler on 4 numeric features; stratified 80/20 split.",
      "features": "Sepal length/width, petal length/width (4 inputs).",
      "architecture": "Single-stage classification pipeline.",
      "training": "Cross-validated hyperparameter comparison; fit on training split.",
      "evaluation": "Held-out test set, confusion matrix, classification report.",
      "deployment": "Exported pipeline for inference; notebook demo.",
      "limitations": "Small, clean tabular dataset — not representative of noisy production data.",
      "inference": "Single-row prediction via scikit-learn predict().",
      "demoUrl": "",
      "localDemo": "iris",
    },
    {
      "name": "Sales Data Dashboard",
      "badge": "Matplotlib",
      "image": "assets/sales-dashboard.webp",
      "description": "Exploratory sales analysis with Pandas and Matplotlib — distributions, trends, and aggregation.",
      "technologies": ["Python", "Pandas", "Matplotlib", "EDA"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/sales-dashboard",
      "demo": "",
      "featured": false,
      "problem": "Surface trends in sales data for operational decisions.",
      "approach": "Load and clean tabular data, aggregate by time/category, and generate reproducible charts.",
      "dataset": "Tabular sales records (transactions, time, category, amount).",
      "model": "Not applicable — analytical dashboards and summary statistics.",
      "results": "",
      "engineering": "Pandas/Matplotlib figures with consistent styling; Streamlit-ready layout.",
      "demoUrl": "",
    },
    {
      "name": "PyTorch Image Classifier",
      "badge": "PyTorch",
      "image": "assets/pytorch-classifier.webp",
      "description": "CNN image classifier built with PyTorch on CIFAR-10 — data pipeline, training loop, and held-out evaluation.",
      "technologies": ["PyTorch", "CNN", "Python", "Computer Vision"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/pytorch-image-classifier",
      "demo": "",
      "featured": true,
      "signal": "PyTorch · CNN · Computer Vision",
      "metrics": [],
      "problem": "Classify 32×32 color images into 10 categories.",
      "approach": "CIFAR-10 data pipeline, augmentation, train/validation split, training loop with validation tracking.",
      "dataset": "CIFAR-10 — 60,000 32×32 color images across 10 classes.",
      "model": "CNN with convolutional, pooling, and fully-connected layers (PyTorch).",
      "results": "Evaluation on held-out test set; accuracy and loss curves logged — see training output.",
      "engineering": "PyTorch Dataset/DataLoader, checkpointing, and reproducible training script.",
      "dataPreprocessing": "Normalization to [0,1], random crop/flip augmentation.",
      "features": "32×32×3 pixel inputs.",
      "architecture": "Conv → ReLU → Pool blocks + fully-connected classifier.",
      "training": "Adam optimizer, cross-entropy loss, train/val split with early stopping.",
      "evaluation": "Held-out test accuracy and loss curves; confusion matrix.",
      "deployment": "Saved .pt checkpoint for offline inference.",
      "limitations": "Baseline CNN — not yet compared to transfer learning at scale.",
      "inference": "Batch inference via DataLoader; checkpoint loading.",
      "demoUrl": "",
    },
    {
      "name": "House Price Predictor",
      "badge": "Machine Learning",
      "image": "assets/house-price-predictor.webp",
      "description": "Regression system for house prices — feature engineering, scikit-learn model, and validation on test split.",
      "technologies": ["Python", "scikit-learn", "Regression", "Feature Engineering"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/house-price-predictor",
      "demo": "",
      "featured": true,
      "signal": "Scikit-learn · Regression · Tabular",
      "metrics": [],
      "problem": "Estimate house price from structural and location features.",
      "approach": "Feature engineering, train/test split, model training, and error analysis on residuals.",
      "dataset": "House price tabular dataset with numeric and categorical features.",
      "model": "Regression model (e.g., Linear / Random Forest) via scikit-learn.",
      "results": "Evaluation via RMSE and R² on held-out test set — metrics reported in notebook.",
      "engineering": "Scikit-learn pipeline with preprocessing and model persistence.",
      "dataPreprocessing": "Missing-value handling, one-hot encoding for categoricals, scaling.",
      "features": "Bedrooms, area, location, age, and engineered interactions.",
      "training": "Train/test split, cross-validated model selection.",
      "evaluation": "Held-out RMSE and R²; residual analysis.",
      "deployment": "Serialized pipeline for batch prediction.",
      "limitations": "Market drift and unseen location categories require retraining.",
      "demoUrl": "",
    },
    {
      "name": "Portfolio Website",
      "badge": "HTML",
      "image": "assets/portfolio-website.webp",
      "description": "Static site architecture — semantic HTML, responsive CSS, vanilla JS, no framework.",
      "technologies": ["HTML", "CSS", "JavaScript"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/portfolio-website",
      "demo": "",
      "featured": false,
      "problem": "Present engineering work credibly across devices and without build tooling.",
      "approach": "Semantic HTML, responsive CSS grid, vanilla JS, and progressive enhancement.",
      "dataset": "Not applicable.",
      "model": "Not applicable.",
      "results": "Responsive verification and Lighthouse checks for performance and accessibility.",
      "engineering": "Static hosting, file:// fallback, and zero-framework deployment.",
      "demoUrl": "",
    },
    {
      "name": "Sentiment Analysis Tool",
      "badge": "NLP",
      "image": "assets/sentiment-analysis.webp",
      "description": "NLP sentiment classifier — text preprocessing, vectorization, scikit-learn training, and test-set evaluation.",
      "technologies": ["Python", "scikit-learn", "NLP", "Model Evaluation"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/sentiment-analysis",
      "demo": "",
      "featured": true,
      "signal": "Scikit-learn · NLP · Text Classification",
      "metrics": [],
      "problem": "Classify sentiment (positive/negative) from short text.",
      "approach": "Text cleaning, TF-IDF vectorization, train/test split, and classifier training.",
      "dataset": "Text corpus of labeled reviews/messages.",
      "model": "Linear classifier (Logistic Regression / SVM) via scikit-learn.",
      "results": "Test-set precision/recall reported in notebook; confusion matrix included.",
      "engineering": "Reusable preprocessing pipeline and evaluation script.",
      "dataPreprocessing": "Lowercasing, tokenization, stop-word handling, TF-IDF vectorization.",
      "features": "Sparse TF-IDF vectors from text tokens.",
      "training": "Stratified split, vectorizer fit on train only, classifier training.",
      "evaluation": "Held-out precision, recall, F1, and confusion matrix.",
      "limitations": "Bag-of-words baseline — no contextual embeddings yet.",
      "inference": "Single-text predict via fitted vectorizer + classifier.",
      "demoUrl": "",
    },
    {
      "name": "Numpy Data Explorer",
      "badge": "Numpy",
      "image": "assets/numpy-explorer.webp",
      "description": "Explore datasets with Numpy and Pandas — filtering, grouping, stats.",
      "technologies": ["Numpy", "Pandas", "Advanced Python"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/numpy-explorer",
      "demo": "",
      "featured": false,
      "problem": "Enable fast, programmatic exploration of tabular datasets.",
      "approach": "NumPy operations, Pandas grouping, and statistical summaries.",
      "dataset": "Sample tabular datasets.",
      "model": "Not applicable.",
      "results": "",
      "engineering": "Notebook utilities for filtering, aggregation, and descriptive stats.",
      "demoUrl": "",
    },
    {
      "name": "Matplotlib Visualizer",
      "badge": "Matplotlib",
      "image": "assets/matplotlib-visualizer.webp",
      "description": "Custom chart gallery — bar, line, scatter with Matplotlib styling.",
      "technologies": ["Matplotlib", "Pandas", "Python"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/matplotlib-visualizer",
      "demo": "",
      "featured": false,
      "problem": "Generate reproducible, publication-quality charts.",
      "approach": "Matplotlib figure/axes composition with consistent style and export.",
      "dataset": "Synthetic and sample datasets for chart demos.",
      "model": "Not applicable.",
      "results": "",
      "engineering": "Style configuration and figure export utilities.",
      "demoUrl": "",
    },
    {
      "name": "PyTorch Chatbot",
      "badge": "PyTorch",
      "image": "assets/pytorch-chatbot.webp",
      "description": "Sequence model for conversational text — tokenization, PyTorch training, and inference pipeline.",
      "technologies": ["PyTorch", "NLP", "Deep Learning"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/pytorch-chatbot",
      "demo": "",
      "featured": false,
      "problem": "Generate coherent responses to short prompts.",
      "approach": "Tokenization, sequence modeling, and training/inference loop.",
      "dataset": "Dialogue corpus with prompt-response pairs.",
      "model": "RNN/Transformer-style PyTorch sequence model.",
      "results": "Qualitative evaluation and loss tracking — see notebook.",
      "engineering": "PyTorch training loop and inference pipeline.",
      "demoUrl": "",
    },
    {
      "name": "Heart Disease Predictor",
      "badge": "scikit-learn",
      "image": "assets/heart-disease-predictor.webp",
      "description": "Machine Learning classifier for heart disease using scikit-learn.",
      "technologies": ["Machine Learning", "scikit-learn", "Pandas"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/heart-disease-predictor",
      "demo": "",
      "featured": false,
      "problem": "Predict heart disease presence from clinical features.",
      "approach": "Missing-value handling, scaling, train/test split, and classifier training.",
      "dataset": "Heart disease tabular dataset (e.g., Cleveland, 303 samples).",
      "model": "Classifier (Logistic Regression / Random Forest) via scikit-learn.",
      "results": "Test-set metrics (accuracy, precision/recall) reported in notebook.",
      "engineering": "Scikit-learn pipeline with preprocessing.",
      "demoUrl": "",
    },
    {
      "name": "Customer Segmentation",
      "badge": "Machine Learning",
      "image": "assets/customer-segmentation.webp",
      "description": "Unsupervised clustering for customer segments — feature scaling, k-means, and cluster analysis.",
      "technologies": ["Python", "scikit-learn", "Clustering"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/customer-segmentation",
      "demo": "",
      "featured": false,
      "problem": "Segment customers for targeted analysis.",
      "approach": "Feature scaling, clustering, and cluster profiling.",
      "dataset": "Customer purchase/behavior table.",
      "model": "K-Means clustering via scikit-learn.",
      "results": "Cluster visualizations and summary statistics — see notebook.",
      "engineering": "Preprocessing + clustering pipeline.",
      "demoUrl": "",
    },
    {
      "name": "Handwritten Digit Classifier",
      "badge": "Deep Learning",
      "image": "assets/digit-classifier.webp",
      "description": "MNIST digit recognition with PyTorch — CNN, data pipeline, and test-set evaluation.",
      "technologies": ["PyTorch", "CNN", "Python", "Computer Vision"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/handwritten-digit-classifier",
      "demo": "",
      "featured": false,
      "problem": "Recognize handwritten digits (0–9).",
      "approach": "MNIST loading, normalization, CNN training, and evaluation on test split.",
      "dataset": "MNIST — 70,000 28×28 grayscale images.",
      "model": "CNN (PyTorch) with convolutional and fully-connected layers.",
      "results": "Test accuracy and confusion matrix reported — see training logs.",
      "engineering": "PyTorch Dataset/DataLoader and training script.",
      "demoUrl": "",
    },
    {
      "name": "Stock Price Predictor",
      "badge": "Machine Learning",
      "image": "assets/stock-predictor.webp",
      "description": "Time-series forecasting prototype — windowing, baseline models, and trend evaluation.",
      "technologies": ["Python", "Pandas", "Time Series"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/stock-predictor",
      "demo": "",
      "featured": false,
      "problem": "Forecast near-term price movement from historical data.",
      "approach": "Time-based split, windowing, baseline models, and trend evaluation.",
      "dataset": "Historical price time series.",
      "model": "Regression / sequence baseline.",
      "results": "Baseline metrics and trend plots — see notebook.",
      "engineering": "Pandas time-series utilities and evaluation plots.",
      "demoUrl": "",
    },
    {
      "name": "AI Assistant",
      "badge": "AI/ML",
      "image": "assets/ai-assistant.webp",
      "description": "AI concepts prototype — Python, deep learning components, and retrieval exploration.",
      "technologies": ["Python", "LLMs", "RAG", "Deep Learning"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/ai-assistant",
      "demo": "",
      "featured": false,
      "problem": "Prototype an AI assistant that can retrieve and generate answers.",
      "approach": "Prompt handling, retrieval, and generation workflow.",
      "dataset": "Document collection and prompts.",
      "model": "LLM + RAG prototype.",
      "results": "Qualitative retrieval and generation examples — see notebook.",
      "engineering": "Python workflow for retrieval and generation.",
      "demoUrl": "",
    },
    {
      "name": "Calculator App",
      "badge": "Utility",
      "image": "assets/calculator-app.webp",
      "description": "Scientific calculator with history — Advanced Python.",
      "technologies": ["Advanced Python", "HTML", "CSS"],
      "github": "https://github.com/CodeWithYazzy/projects/tree/main/calculator-app",
      "demo": "",
      "featured": false,
      "problem": "Evaluate arithmetic reliably with history and correct precedence.",
      "approach": "Tokenization and safe evaluation with precedence handling.",
      "dataset": "Not applicable.",
      "model": "Parser + evaluator (Python AST in backend, recursive descent in browser).",
      "results": "Deterministic evaluation; error handling for invalid input and division by zero.",
      "engineering": "Tkinter desktop app and browser preview with sandboxed evaluation.",
      "demoUrl": "",
      "localDemo": "calculator",
    },
];
window.PROJECT_CATALOG = FALLBACK_PROJECTS;

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  })[character]);
}

function safeExternalUrl(value, fallback = 'https://github.com/CodeWithYazzy') {
  try {
    const url = new URL(value || fallback, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : fallback;
  } catch (error) {
    return fallback;
  }
}

function buildCardHTML(p, basePath) {
  const projectName = escapeHTML(p.name || 'Project');
  const projectDescription = escapeHTML(p.description || 'Project details are not available.');
  let imgUrl = p.image || '';
  if (imgUrl && !imgUrl.startsWith('http') && !imgUrl.startsWith('data:') && !imgUrl.startsWith('/')) {
    imgUrl = basePath + imgUrl;
  }
  const badge = p.badge || 'Project';
  const tagsHTML = (p.technologies || []).map(t => `<span>${escapeHTML(t)}</span>`).join('');
  const isFileNow = location.protocol === 'file:';
  const demoUrl = p.demo || `${basePath}pages/demo${isFileNow ? '.html' : ''}?project=${encodeURIComponent(p.name)}`;
  const githubUrl = safeExternalUrl(p.github);
  const signal = p.signal ? escapeHTML(p.signal) : '';
  const imageHTML = imgUrl
    ? `<img src="${escapeHTML(imgUrl)}" alt="${projectName} preview" loading="lazy" decoding="async" width="600" height="400" style="aspect-ratio:600/400;object-fit:cover">`
    : `<div class="proj-placeholder" role="img" aria-label="${projectName} project preview"><span>${escapeHTML((p.name || 'Project').slice(0, 1))}</span></div>`;

  return `
    <div class="project-card">
      <div class="proj-img">
        ${imageHTML}
        <span class="badge">${escapeHTML(badge)}</span>
      </div>
      <h3>${projectName}</h3>
      <p>${projectDescription}</p>
      ${signal ? `<p class="card-signal">${signal}</p>` : ``}
      <div class="tags">${tagsHTML}</div>
      <div class="project-actions">
        <a href="#" class="view-link" data-title="${projectName}" data-github="${escapeHTML(githubUrl)}" data-demo="${escapeHTML(demoUrl)}">View Demo <i data-lucide="arrow-right" style="width:14px;height:14px"></i></a>
        <a href="${escapeHTML(githubUrl)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub for ${projectName}" class="gh-link"><i data-lucide="github" style="width:16px;height:16px"></i></a>
      </div>
    </div>
  `;
}

function bindProjectCardEvents() {
  // Click on .view-link
  document.querySelectorAll('.view-link').forEach(l => {
    l.addEventListener('click', e => {
      e.preventDefault();
      openModal(l.dataset.title || l.textContent.trim(), l.dataset.github, l.dataset.demo);
    });
  });

  // Click anywhere on .project-card
  document.querySelectorAll('.project-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', e => {
      if (e.target.closest('a')) return;
      const link = card.querySelector('.view-link');
      if (link) {
        e.preventDefault();
        openModal(link.dataset.title || card.querySelector('h3')?.textContent.trim(), link.dataset.github, link.dataset.demo);
      }
    });
  });

  try { lucide.createIcons(); } catch (e) {}

  // Trigger scroll-reveal for newly rendered elements
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const revealEls = document.querySelectorAll('.project-card');
    revealEls.forEach(el => el.classList.add('reveal'));
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = (i % 4) * 0.04 + 's';
      revealObserver.observe(el);
    });
  }
}

async function loadAndRenderProjects() {
  const grid = document.getElementById('projectsGrid');
  if (!grid) return;

  const isHomepage = !!document.getElementById('home');
  const basePath = location.pathname.includes('/pages/') ? '../' : '';
  const dataUrl = `${basePath}assets/projects.json`;

  let projectList = null;

  try {
    const res = await fetch(dataUrl);
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.projects)) {
        projectList = data.projects;
      }
    }
  } catch (err) {
    // Network or file:// CORS error fallback
    console.info('Using local projects fallback');
  }

  if (!projectList || projectList.length === 0) {
    projectList = FALLBACK_PROJECTS;
  }

  // If on homepage, show featured projects excluding flagship (to avoid duplicate with flagship case study)
  const displayProjects = isHomepage
    ? (() => {
        const featuredNoFlagship = projectList.filter(p => p.featured && p.name !== "Iris Flower Classifier");
        // show 3 featured + 1 additional to keep 4 cards without duplicating flagship
        const extra = projectList.find(p => !p.featured && p.name !== "Iris Flower Classifier");
        const list = featuredNoFlagship.slice(0, 3);
        if (extra && list.length < 4) list.push(extra);
        return list.length ? list : projectList.filter(p => p.featured !== false).slice(0, 4);
      })()
    : projectList;

  grid.innerHTML = displayProjects.map(p => buildCardHTML(p, basePath)).join('');
  bindProjectCardEvents();
}

// Initial project load
loadAndRenderProjects();

// ==========================================
// 8. SCROLL REVEAL (STATIC SECTIONS)
// ==========================================
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const revealEls = document.querySelectorAll('.drive-card, .ach-card, .lab-card, .skill-group, .skill, .stat, .info, .mini-stats > div, .contact-right, .section-head, .demo-banner');
  revealEls.forEach(el => el.classList.add('reveal'));
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach((el, i) => {
    el.style.transitionDelay = (i % 4) * 0.04 + 's';
    revealObserver.observe(el);
  });
}

// Broken image fallback handling
document.querySelectorAll('img').forEach(img => {
  img.addEventListener('error', () => {
    img.style.background = 'var(--light)';
    img.style.minHeight = '120px';
    img.alt += ' (image failed to load)';
  });
});

// ==========================================
// 9. BACK TO TOP
// ==========================================
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  const toggleBackToTop = () => {
    const show = window.scrollY > 600;
    backToTop.classList.toggle('show', show);
    backToTop.setAttribute('aria-hidden', String(!show));
    backToTop.tabIndex = show ? 0 : -1;
  };
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}
