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

      /* Scrolling alone does not move focus, so a keyboard user stays where
         they were and the next Tab continues from the link rather than from
         the section. Sections are not focusable by default, so give the
         target a tabindex and focus it. preventScroll stops the browser
         jumping ahead of the smooth scroll. */
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
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
  hamburger.setAttribute('aria-label', 'Close menu');
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu(restoreFocus = false) {
  menuOpen = false;
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Open menu');
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';

  /* Only reclaim focus when asked. Following a link should leave focus with
     the section it navigated to, which the smooth scroll handler sets. */
  if (restoreFocus) hamburger.focus();
}

hamburger.addEventListener('click', () => {
  menuOpen ? closeMobileMenu(true) : openMobileMenu();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuOpen) closeMobileMenu(true);
});

/* The menu covers the page but does not remove what is underneath from the
   tab order, so tabbing past the last link sends focus somewhere invisible.
   Watch focus arriving anywhere on the page rather than focus leaving the
   menu, because the hamburger sits outside the menu and focus moving off it
   would otherwise go unnoticed. */
document.addEventListener('focusin', e => {
  if (!menuOpen) return;
  if (e.target === hamburger || mobileMenu.contains(e.target)) return;
  closeMobileMenu();
});

/* ── demo form ── */
const FORM_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbym0Z-SV_Wr_C1br2yKjq8DMamoZ3jH-NNj6hV-1s6cu9tlSWCCTgOq3HGMBiC08Zga/exec';
const SUBMIT_TIMEOUT_MS = 15000;

const form = document.getElementById('demo-form');
const formSuccess = document.getElementById('form-success');
const formError = document.getElementById('form-error');
const submitBtn = form.querySelector('button[type="submit"]');

let submitting = false;

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearFieldError(field) {
  field.style.borderColor = '';
  field.removeAttribute('aria-invalid');
}

form.addEventListener('submit', async e => {
  e.preventDefault();

  /* A second submit while one is in flight would create a duplicate row.
     The disabled button covers most of it, but not a double Enter press
     landing before the disable takes effect. */
  if (submitting) return;

  formError.hidden = true;

  /* validation */
  let firstInvalid = null;

  form.querySelectorAll('[required]').forEach(field => {
    clearFieldError(field);
    const value = field.value.trim();
    const empty = !value;
    const badEmail = field.type === 'email' && !isValidEmail(value);
    if (empty || badEmail) {
      field.style.borderColor = '#ef4444';
      field.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = field;
    }
  });

  if (firstInvalid) {
    /* Describe the field focus is about to land on, not whichever problem
       happened to be detected. An empty first name plus a bad email would
       otherwise focus the name and talk about the email. */
    const firstIsBadEmail =
      firstInvalid.type === 'email' && firstInvalid.value.trim() !== '';

    showError(
      firstIsBadEmail
        ? 'Enter a valid email address, for example jane@yourcompany.com.'
        : 'Please fill in every field marked with an asterisk.'
    );
    firstInvalid.focus();
    return;
  }

  submitting = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);

  try {
    /* Trim on the way out so what is stored matches what was validated. */
    const payload = {};
    new FormData(form).forEach((value, key) => {
      payload[key] = typeof value === 'string' ? value.trim() : value;
    });

    const res = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      /* text/plain keeps this a "simple request" so the browser sends no
         preflight. Apps Script cannot answer a preflight OPTIONS request, so
         an application/json content type fails here with a CORS error. */
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    /* fetch does not reject on a 4xx or 5xx, so this has to be explicit. */
    if (!res.ok) throw new Error('http ' + res.status);

    const result = await res.json();
    if (result.ok !== true) throw new Error(result.error || 'rejected');

    form.style.display = 'none';
    formSuccess.style.display = 'flex';

    /* The submit button was inside the form we just hid, so focus has nowhere
       to go. Move it to the confirmation. */
    document.getElementById('form-success-heading').focus();

  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel;

    /* A timeout or a dropped connection means we genuinely do not know
       whether the server saved it. Telling someone it failed invites a
       duplicate submission, so say we could not confirm instead. */
    const unconfirmed = err.name === 'AbortError' || err instanceof TypeError;

    showError(
      unconfirmed
        ? 'We could not confirm your request went through. Please email info@yourpartssolution.com rather than submitting again and we will check for you.'
        : 'Something went wrong sending your request. Please email info@yourpartssolution.com and we will follow up.'
    );

  } finally {
    clearTimeout(timeout);
    submitting = false;
  }
});

/* clear the error state as soon as the field is touched */
form.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('input', () => clearFieldError(field));
});
