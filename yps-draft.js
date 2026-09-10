/* ── smooth scroll ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      closeMobileMenu();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ── nav shadow on scroll ── */
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.style.boxShadow = window.scrollY > 10 ? '0 2px 16px rgba(0,0,0,0.08)' : 'none';
}, { passive: true });

/* ── hamburger / mobile menu ── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
let menuOpen = false;

function openMobileMenu() {
  menuOpen = true;
  hamburger.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  menuOpen = false;
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
  menuOpen ? closeMobileMenu() : openMobileMenu();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOpen) closeMobileMenu();
});

/* ── demo form ── */
const form = document.getElementById('demo-form');
const formSuccess = document.getElementById('form-success');

form.addEventListener('submit', e => {
  e.preventDefault();

  /* basic validation */
  const required = form.querySelectorAll('[required]');
  let valid = true;
  required.forEach(field => {
    field.style.borderColor = '';
    if (!field.value.trim()) {
      field.style.borderColor = '#ef4444';
      valid = false;
    }
  });

  if (!valid) {
    form.querySelector('[required]').focus();
    return;
  }

  /* swap to success state */
  form.style.display = 'none';
  formSuccess.style.display = 'flex';
});

/* clear red border on input */
form.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('input', () => { field.style.borderColor = ''; });
});
