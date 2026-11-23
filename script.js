/* script.js - behaviour for the PixelPulse Tech Fest registration page */
(function () {
  'use strict';

  /* ---------- Element references ---------- */
  const root = document.documentElement;
  const regModalEl = document.getElementById('registerModal');
  const regForm = document.getElementById('registerForm');
  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const ticketSelect = document.getElementById('ticketType');
  const termsCheck = document.getElementById('terms');
  const modalEventName = document.getElementById('modalEventName');
  const regCountEl = document.getElementById('regCount');
  const seatsTotalEl = document.getElementById('seatsTotal');
  const toastEl = document.getElementById('successToast');
  const toastMessage = document.getElementById('toastMessage');
  const filterGroup = document.getElementById('filterGroup');
  const themeBtn = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const exploreBtn = document.getElementById('exploreBtn');
  const navCollapseEl = document.getElementById('mainNav');
  const eventCols = document.querySelectorAll('.event-col');

  const registerModal = bootstrap.Modal.getOrCreateInstance(regModalEl);
  const successToast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 6000 });

  let registrationCount = 0; // total successful registrations
  let activeCol = null;      // the event column whose Register button opened the modal
  let activeEvent = '';      // the title of that event

  /* ---------- Seats: show, update, and disable when sold out ---------- */
  function renderSeats(col) {
    const seats = Number(col.dataset.seats);
    const badge = col.querySelector('.seats-badge');
    const button = col.querySelector('.register-btn');

    badge.classList.remove('bg-success-subtle', 'text-success-emphasis',
      'bg-warning-subtle', 'text-warning-emphasis', 'text-bg-danger');

    if (seats <= 0) {
      badge.textContent = 'Sold out';
      badge.classList.add('text-bg-danger');
      button.disabled = true;
      button.textContent = 'Sold out';
      button.classList.remove('btn-accent');
      button.classList.add('btn-secondary');
    } else {
      badge.innerHTML = '<span class="seats-left">' + seats + '</span> ' +
        (seats === 1 ? 'seat' : 'seats') + ' left';
      if (seats <= 3) {
        badge.classList.add('bg-warning-subtle', 'text-warning-emphasis');
      } else {
        badge.classList.add('bg-success-subtle', 'text-success-emphasis');
      }
    }
  }

  function updateTotals() {
    let totalSeats = 0;
    eventCols.forEach(function (col) {
      totalSeats += Number(col.dataset.seats);
    });
    seatsTotalEl.textContent = totalSeats;
    regCountEl.textContent = registrationCount;
  }

  /* ---------- Form validation (Bootstrap is-valid / is-invalid) ---------- */
  const namePattern = /^[A-Za-z][A-Za-z\s.'-]+$/;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setFieldState(field, isValid, message) {
    field.classList.toggle('is-valid', isValid);
    field.classList.toggle('is-invalid', !isValid);
    field.setAttribute('aria-invalid', String(!isValid));
    if (!isValid && message) {
      const feedback = document.getElementById(field.id + 'Error');
      if (feedback) {
        feedback.textContent = message;
      }
    }
  }

  function validateName() {
    const value = nameInput.value.trim();
    let message = '';
    if (value === '') {
      message = 'Please enter your full name.';
    } else if (value.length < 3) {
      message = 'Your name must be at least 3 characters long.';
    } else if (!namePattern.test(value)) {
      message = 'Use letters, spaces, dots, apostrophes or hyphens only.';
    }
    setFieldState(nameInput, message === '', message);
    return message === '';
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    let message = '';
    if (value === '') {
      message = 'Please enter your email address.';
    } else if (!emailPattern.test(value)) {
      message = 'Please enter a valid email, for example name@example.com.';
    }
    setFieldState(emailInput, message === '', message);
    return message === '';
  }

  function validateTicket() {
    const isValid = ticketSelect.value !== '';
    setFieldState(ticketSelect, isValid, 'Please choose a ticket type.');
    return isValid;
  }

  function validateTerms() {
    const isValid = termsCheck.checked;
    setFieldState(termsCheck, isValid, 'You must agree to the terms before registering.');
    return isValid;
  }

  // Validate a field when the user leaves it, and re-check while typing once it has been checked
  [[nameInput, validateName], [emailInput, validateEmail]].forEach(function (pair) {
    const field = pair[0];
    const validator = pair[1];
    field.addEventListener('blur', validator);
    field.addEventListener('input', function () {
      if (field.classList.contains('is-invalid') || field.classList.contains('is-valid')) {
        validator();
      }
    });
  });
  ticketSelect.addEventListener('change', validateTicket);
  termsCheck.addEventListener('change', validateTerms);

  function resetForm() {
    regForm.reset();
    regForm.querySelectorAll('.is-valid, .is-invalid').forEach(function (field) {
      field.classList.remove('is-valid', 'is-invalid');
      field.removeAttribute('aria-invalid');
    });
  }

  /* ---------- Register modal ---------- */
  regModalEl.addEventListener('show.bs.modal', function (event) {
    const trigger = event.relatedTarget; // the Register button that was clicked
    activeCol = trigger ? trigger.closest('.event-col') : null;
    activeEvent = trigger ? trigger.dataset.event : '';
    modalEventName.textContent = activeEvent;
    resetForm();
  });

  regModalEl.addEventListener('shown.bs.modal', function () {
    nameInput.focus();
  });

  regForm.addEventListener('submit', function (event) {
    event.preventDefault();

    const results = [validateName(), validateEmail(), validateTicket(), validateTerms()];
    if (results.indexOf(false) !== -1) {
      const firstInvalid = regForm.querySelector('.is-invalid');
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    if (!activeCol || Number(activeCol.dataset.seats) <= 0) {
      return;
    }

    const personName = nameInput.value.trim();

    // Live updates: one seat less on the card, one more registration overall
    activeCol.dataset.seats = String(Number(activeCol.dataset.seats) - 1);
    registrationCount += 1;
    renderSeats(activeCol);
    updateTotals();

    // Close the modal and confirm with a toast that mentions the person and the event
    registerModal.hide();
    toastMessage.textContent = 'Thank you, ' + personName + '! You are registered for ' + activeEvent + '.';
    successToast.show();
  });

  /* ---------- Filter buttons ---------- */
  filterGroup.addEventListener('click', function (event) {
    const clicked = event.target.closest('button[data-filter]');
    if (!clicked) {
      return;
    }
    const filter = clicked.dataset.filter;

    filterGroup.querySelectorAll('button[data-filter]').forEach(function (btn) {
      const isActive = btn === clicked;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });

    eventCols.forEach(function (col) {
      const hide = filter !== 'all' && col.dataset.category !== filter;
      col.classList.toggle('d-none', hide);
    });
  });

  /* ---------- Dark mode (data-bs-theme) ---------- */
  function applyTheme(theme) {
    root.setAttribute('data-bs-theme', theme);
    const isDark = theme === 'dark';
    themeIcon.textContent = isDark ? '\u2600\uFE0F' : '\uD83C\uDF19'; // sun or moon
    themeBtn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem('pp-theme');
    } catch (error) {
      return null;
    }
  }

  themeBtn.addEventListener('click', function () {
    const next = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem('pp-theme', next);
    } catch (error) {
      /* storage not available: the theme just won't be remembered */
    }
  });

  /* ---------- Hero button and navbar ---------- */
  exploreBtn.addEventListener('click', function () {
    document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
  });

  // Close the collapsed navbar after choosing a link on a phone
  document.querySelectorAll('#mainNav .nav-link').forEach(function (link) {
    link.addEventListener('click', function () {
      if (navCollapseEl.classList.contains('show')) {
        bootstrap.Collapse.getOrCreateInstance(navCollapseEl).hide();
      }
    });
  });

  /* ---------- Start-up ---------- */
  applyTheme(getSavedTheme() === 'dark' ? 'dark' : 'light');
  eventCols.forEach(renderSeats);
  updateTotals();
})();
