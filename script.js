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

  setupGalleryCarousel();
}

// Gallery carousel: dots, arrows, gentle autoplay (pauses on hover/touch/reduced-motion)
function setupGalleryCarousel() {
  const track = qs('#galleryGrid');
  const dotsWrap = qs('#galleryDots');
  const prevBtn = qs('#galleryPrev');
  const nextBtn = qs('#galleryNext');
  if (!track) return;

  const items = qsa('.gallery__item', track);
  if (!items.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const perView = () => (window.innerWidth <= 700 ? 1 : window.innerWidth <= 1000 ? 2 : 4);
  const dotCount = Math.max(1, Math.ceil(items.length / perView()));

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    for (let i = 0; i < dotCount; i++) {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Go to slide group ${i + 1}`);
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', () => scrollToGroup(i));
      dotsWrap.appendChild(b);
    }
  }

  function groupWidth() {
    const item = items[0];
    const gap = 14;
    return (item.offsetWidth + gap) * perView();
  }

  function scrollToGroup(i) {
    track.scrollTo({ left: i * groupWidth(), behavior: 'smooth' });
  }

  function updateDots() {
    if (!dotsWrap) return;
    const gw = groupWidth();
    const idx = Math.round(track.scrollLeft / gw);
    qsa('button', dotsWrap).forEach((b, i) => b.classList.toggle('is-active', i === idx));
  }

  track.addEventListener('scroll', () => {
    window.clearTimeout(track._dotTimer);
    track._dotTimer = window.setTimeout(updateDots, 80);
  }, { passive: true });

  if (prevBtn) prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -groupWidth(), behavior: 'smooth' });
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    if (atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
    else track.scrollBy({ left: groupWidth(), behavior: 'smooth' });
  });

  // Gentle autoplay
  if (!reducedMotion) {
    let paused = false;
    ['mouseenter', 'touchstart', 'pointerdown'].forEach(ev =>
      track.addEventListener(ev, () => { paused = true; }, { passive: true })
    );
    ['mouseleave', 'touchend'].forEach(ev =>
      track.addEventListener(ev, () => { paused = false; }, { passive: true })
    );

    setInterval(() => {
      if (paused) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
      if (atEnd) track.scrollTo({ left: 0, behavior: 'smooth' });
      else track.scrollBy({ left: groupWidth(), behavior: 'smooth' });
    }, 4200);
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

/* ---------- Highlights hero slider ---------- */
(() => {
  const section = qs('#highlight');
  if (!section) return;
  const slides = qsa('.highlight__slide', section);
  const dotsWrap = qs('#highlightDots');
  const prevBtn = qs('#highlightPrev');
  const nextBtn = qs('#highlightNext');
  if (!slides.length) return;

  let idx = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (dotsWrap) {
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Show photo ${i + 1}`);
      if (i === 0) b.classList.add('is-active');
      b.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(b);
    });
  }

  function goTo(i) {
    slides[idx].classList.remove('is-active');
    idx = (i + slides.length) % slides.length;
    slides[idx].classList.add('is-active');
    if (dotsWrap) qsa('button', dotsWrap).forEach((b, n) => b.classList.toggle('is-active', n === idx));
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goTo(idx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(idx + 1));

  // Touch swipe
  let touchX = null;
  section.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  section.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) goTo(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  }, { passive: true });

  // Autoplay
  if (!reducedMotion) {
    let paused = false;
    section.addEventListener('mouseenter', () => { paused = true; });
    section.addEventListener('mouseleave', () => { paused = false; });
    setInterval(() => { if (!paused) goTo(idx + 1); }, 4800);
  }
})();

/* ---------- Language switcher ---------- */
(() => {
  const i18n = {
    en: {
      'nav.about': 'About', 'nav.tours': 'Experiences', 'nav.gallery': 'Gallery', 'nav.reviews': 'Reviews',
      'nav.contact': 'Contact', 'nav.cta': 'Book on WhatsApp', 'nav.install': 'Install App',
      'hero.eyebrow': 'Atlas Mountains · Imlil · Morocco',
      'hero.title': 'Walk the Atlas with someone who calls it home.',
      'hero.subtitle': 'Private day trips, treks and Berber culture — guided, not staged.',
      'hero.lead': "Abdulaziz grew up in these mountains. He leads small groups from Imlil and Marrakech into the valleys, villages and trails that shaped him — at a pace that's actually yours.",
      'hero.viewTrips': 'View trips',
      'highlight.eyebrow': 'Real Trips · Real Faces · Real Atlas Mountains',
      'highlight.title': 'See why travelers choose Atlas Pathway Journeys',
      'highlight.desc': "Handpicked moments from recent Atlas Mountains hikes, waterfall walks and Berber village visits guided by Abdulaziz — Imlil and Marrakech's most personal way to explore the High Atlas.",
      'highlight.reviews': 'See Reviews on TripAdvisor',
      'tours.eyebrow': 'Our Experiences', 'tours.title': 'Pick a route, or tell us your vibe',
      'tours.desc': 'Sunrise hikes, village life, waterfalls, or a challenging High Atlas trek — every route can flex to your dates, group size and fitness level.',
      'gallery.eyebrow': 'In The Mountains', 'gallery.title': 'Gallery',
      'gallery.desc': "A glimpse of the trails, villages, waterfalls, and moments you'll experience in the Atlas Mountains.",
      'gallery.instagram': 'See more on Instagram',
      'promo.eyebrow': 'Limited-Time Offer', 'promo.title': 'Get 10% off your Atlas Mountains trip',
      'promo.desc': 'Message us on WhatsApp today and mention code ATLAS10 when planning your Imlil hike, waterfall walk or Berber culture day trip.',
      'promo.cta': 'Claim on WhatsApp', 'promo.dismiss': 'Not now',
    },
    fr: {
      'nav.about': 'À propos', 'nav.tours': 'Excursions', 'nav.gallery': 'Galerie', 'nav.reviews': 'Avis',
      'nav.contact': 'Contact', 'nav.cta': 'Réserver sur WhatsApp', 'nav.install': "Installer l'app",
      'hero.eyebrow': 'Montagnes de l\u2019Atlas · Imlil · Maroc',
      'hero.title': "Parcourez l'Atlas avec quelqu'un qui est chez lui.",
      'hero.subtitle': 'Excursions privées, treks et culture berbère — un guide, pas une mise en scène.',
      'hero.lead': "Abdulaziz a grandi dans ces montagnes. Il guide de petits groupes depuis Imlil et Marrakech vers les vallées, villages et sentiers qui l'ont façonné — à votre propre rythme.",
      'hero.viewTrips': 'Voir les excursions',
      'highlight.eyebrow': 'Vraies excursions · Vrais visages · Vrai Atlas',
      'highlight.title': 'Découvrez pourquoi les voyageurs choisissent Atlas Pathway Journeys',
      'highlight.desc': "Moments choisis de récentes randonnées dans l'Atlas, cascades et visites de villages berbères guidées par Abdulaziz — la façon la plus authentique d'explorer le Haut Atlas depuis Imlil et Marrakech.",
      'highlight.reviews': 'Voir les avis sur TripAdvisor',
      'tours.eyebrow': 'Nos Excursions', 'tours.title': 'Choisissez un itinéraire, ou dites-nous votre envie',
      'tours.desc': "Randonnées au lever du soleil, vie de village, cascades ou trek exigeant dans le Haut Atlas — chaque itinéraire s'adapte à vos dates, à la taille du groupe et à votre niveau.",
      'gallery.eyebrow': 'Dans les Montagnes', 'gallery.title': 'Galerie',
      'gallery.desc': "Un aperçu des sentiers, villages, cascades et moments vécus dans les montagnes de l'Atlas.",
      'gallery.instagram': 'Voir plus sur Instagram',
      'promo.eyebrow': 'Offre à durée limitée', 'promo.title': "10% de réduction sur votre excursion dans l'Atlas",
      'promo.desc': "Contactez-nous sur WhatsApp dès aujourd'hui et mentionnez le code ATLAS10 pour votre randonnée à Imlil, cascade ou journée culture berbère.",
      'promo.cta': 'Profiter sur WhatsApp', 'promo.dismiss': 'Plus tard',
    },
    es: {
      'nav.about': 'Sobre nosotros', 'nav.tours': 'Excursiones', 'nav.gallery': 'Galería', 'nav.reviews': 'Reseñas',
      'nav.contact': 'Contacto', 'nav.cta': 'Reservar por WhatsApp', 'nav.install': 'Instalar app',
      'hero.eyebrow': 'Montañas del Atlas · Imlil · Marruecos',
      'hero.title': 'Recorre el Atlas con alguien que lo llama hogar.',
      'hero.subtitle': 'Excursiones privadas, trekking y cultura bereber — guiado, no escenificado.',
      'hero.lead': 'Abdulaziz creció en estas montañas. Guía a grupos pequeños desde Imlil y Marrakech por los valles, pueblos y senderos que lo formaron, al ritmo que tú marques.',
      'hero.viewTrips': 'Ver excursiones',
      'highlight.eyebrow': 'Excursiones reales · Caras reales · Atlas real',
      'highlight.title': 'Descubre por qué los viajeros eligen Atlas Pathway Journeys',
      'highlight.desc': 'Momentos seleccionados de recientes caminatas por el Atlas, cascadas y visitas a pueblos bereberes guiadas por Abdulaziz, la forma más auténtica de explorar el Alto Atlas desde Imlil y Marrakech.',
      'highlight.reviews': 'Ver reseñas en TripAdvisor',
      'tours.eyebrow': 'Nuestras Excursiones', 'tours.title': 'Elige una ruta o cuéntanos qué buscas',
      'tours.desc': 'Caminatas al amanecer, vida de pueblo, cascadas o un trekking exigente por el Alto Atlas — cada ruta se adapta a tus fechas, grupo y nivel físico.',
      'gallery.eyebrow': 'En las Montañas', 'gallery.title': 'Galería',
      'gallery.desc': 'Un vistazo a los senderos, pueblos, cascadas y momentos que vivirás en las montañas del Atlas.',
      'gallery.instagram': 'Ver más en Instagram',
      'promo.eyebrow': 'Oferta por tiempo limitado', 'promo.title': 'Obtén 10% de descuento en tu excursión al Atlas',
      'promo.desc': 'Escríbenos hoy por WhatsApp y menciona el código ATLAS10 al planear tu caminata en Imlil, cascada o día de cultura bereber.',
      'promo.cta': 'Reclamar por WhatsApp', 'promo.dismiss': 'Ahora no',
    },
  };

  const btn = qs('#langBtn');
  const label = qs('#langLabel');
  const menu = qs('#langMenu');
  if (!btn || !menu) return;

  function applyLang(lang) {
    const dict = i18n[lang] || i18n.en;
    qsa('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    if (label) label.textContent = lang.toUpperCase();
    qsa('li', menu).forEach(li => li.setAttribute('aria-selected', String(li.dataset.lang === lang)));
    document.documentElement.setAttribute('lang', lang);
    try { localStorage.setItem('apj_lang', lang); } catch {}
  }

  btn.addEventListener('click', () => {
    const open = menu.hasAttribute('hidden') ? false : true;
    if (open) { menu.setAttribute('hidden', ''); btn.setAttribute('aria-expanded', 'false'); }
    else { menu.removeAttribute('hidden'); btn.setAttribute('aria-expanded', 'true'); }
  });

  qsa('li', menu).forEach(li => {
    li.addEventListener('click', () => {
      applyLang(li.dataset.lang);
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !btn.contains(e.target)) {
      menu.setAttribute('hidden', '');
      btn.setAttribute('aria-expanded', 'false');
    }
  });

  let saved = 'en';
  try { saved = localStorage.getItem('apj_lang') || 'en'; } catch {}
  if (i18n[saved]) applyLang(saved);
})();

/* ---------- PWA install button ---------- */
(() => {
  const installBtn = qs('#installBtn');
  if (!installBtn) return;
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    installBtn.hidden = true;
  });

  window.addEventListener('appinstalled', () => { installBtn.hidden = true; });
})();

/* ---------- Discount popup ---------- */
(() => {
  const promo = qs('#promo');
  if (!promo) return;
  const closeBtn = qs('#promoClose');
  const dismissBtn = qs('#promoDismiss');
  const KEY = 'apj_promo_dismissed_at';
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

  function alreadyDismissed() {
    try {
      const t = Number(localStorage.getItem(KEY) || 0);
      return t && (Date.now() - t) < SEVEN_DAYS;
    } catch { return false; }
  }

  function open() {
    if (alreadyDismissed()) return;
    promo.classList.add('is-open');
    promo.setAttribute('aria-hidden', 'false');
  }

  function close() {
    promo.classList.remove('is-open');
    promo.setAttribute('aria-hidden', 'true');
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
  }

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (dismissBtn) dismissBtn.addEventListener('click', close);
  promo.addEventListener('click', (e) => { if (e.target === promo) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && promo.classList.contains('is-open')) close();
  });

  if (!alreadyDismissed()) {
    setTimeout(open, 12000);
  }
})();
