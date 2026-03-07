/* Atlas Pathway Journeys — vanilla JS */

const qs = (sel, el = document) => el.querySelector(sel);
const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];

// Year
const yearEl = qs('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mobile nav
const navToggle = qs('#navToggle');
const nav = qs('#nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });

  // Close on link click
  qsa('a', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Open menu');
  }));

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    }
  });
}

// Reveal on scroll
(() => {
  const els = qsa('.reveal');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '40px' });

  els.forEach(el => io.observe(el));
})();

// Gallery + Lightbox
let gallery = [];
let activeIndex = 0;

const grid = qs('#galleryGrid');
const lb = qs('#lightbox');
const lbImg = qs('#lightboxImg');
const lbCap = qs('#lightboxCap');
const lbClose = qs('#lightboxClose');
const lbPrev = qs('#lightboxPrev');
const lbNext = qs('#lightboxNext');

function openLightbox(index) {
  if (!lb || !lbImg) return;
  activeIndex = index;
  const item = gallery[activeIndex];
  lbImg.src = item.large;
  lbImg.alt = item.alt || 'Gallery image';
  if (lbCap) lbCap.textContent = item.alt || '';
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (!lb) return;
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  // clear to free memory
  if (lbImg) lbImg.src = '';
}

function navLightbox(dir) {
  if (!gallery.length) return;
  activeIndex = (activeIndex + dir + gallery.length) % gallery.length;
  const item = gallery[activeIndex];
  lbImg.src = item.large;
  lbImg.alt = item.alt || 'Gallery image';
  if (lbCap) lbCap.textContent = item.alt || '';
}

async function loadGallery() {
  if (!grid) return;
  try {
    const res = await fetch('assets/gallery.json', { cache: 'force-cache' });
    gallery = await res.json();
  } catch {
    gallery = [];
  }

  if (!gallery.length) {
    grid.innerHTML = '<p class="muted">Gallery is loading…</p>';
    return;
  }

  const frag = document.createDocumentFragment();
  gallery.forEach((item, idx) => {
    const figure = document.createElement('figure');
    figure.className = 'gallery__item reveal';
    figure.style.setProperty('--d', `${Math.min(idx * 40, 240)}ms`);

    const img = document.createElement('img');
    img.src = item.thumb;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = item.alt || 'Atlas Mountains photo';

    const cap = document.createElement('figcaption');
    cap.className = 'gallery__cap';
    cap.textContent = item.alt || '';

    figure.appendChild(img);
    figure.appendChild(cap);

    figure.addEventListener('click', () => openLightbox(idx));
    figure.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(idx);
      }
    });
    figure.tabIndex = 0;
    figure.setAttribute('role', 'button');
    figure.setAttribute('aria-label', `Open image: ${img.alt}`);

    frag.appendChild(figure);
  });

  grid.innerHTML = '';
  grid.appendChild(frag);

  // re-run reveal observer for dynamically added items
  const els = qsa('.reveal', grid);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.10, rootMargin: '40px' });

    els.forEach(el => io.observe(el));
  } else {
    els.forEach(el => el.classList.add('is-visible'));
  }

  // Also populate a small Instagram-style grid with 9 thumbs (static)
  const igGrid = qs('#igGrid');
  if (igGrid) {
    const picks = gallery.slice(0, 9);
    igGrid.innerHTML = picks.map(p => `<img src="${p.thumb}" alt="${p.alt}" loading="lazy" decoding="async">`).join('');
  }
}

if (lb) {
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });
}
if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lbPrev) lbPrev.addEventListener('click', () => navLightbox(-1));
if (lbNext) lbNext.addEventListener('click', () => navLightbox(1));

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!lb || !lb.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') navLightbox(-1);
  if (e.key === 'ArrowRight') navLightbox(1);
});

loadGallery();

// Contact form — opens mail app with prefilled body
const form = qs('#contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const interest = String(data.get('interest') || '').trim();
    const message = String(data.get('message') || '').trim();

    if (!name || !email || !interest || !message) {
      const hint = qs('#formHint');
      if (hint) hint.textContent = 'Please fill in all fields.';
      return;
    }

    const subject = encodeURIComponent(`Trip inquiry — ${interest}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nTrip interest: ${interest}\n\nMessage:\n${message}\n\n— Sent from Atlas Pathway Journeys website.`
    );

    window.location.href = `mailto:contact@atlaspathwayjourneys.com?subject=${subject}&body=${body}`;
  });
}
