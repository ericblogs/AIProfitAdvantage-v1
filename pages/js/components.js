import { isElement, query } from './utils.js';

export function setCurrentYear() {
  const year = query('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());
}

export function initializeNavigation() {
  const toggle = query('.menu-toggle');
  const navigation = query('.primary-nav');
  const toggleLabel = query('.sr-only', toggle);
  if (!toggle || !navigation || !toggleLabel) return;

  const closeNavigation = ({ returnFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', 'false');
    toggleLabel.textContent = 'Open menu';
    navigation.classList.remove('is-open');
    if (returnFocus) toggle.focus();
  };

  const openNavigation = () => {
    toggle.setAttribute('aria-expanded', 'true');
    toggleLabel.textContent = 'Close menu';
    navigation.classList.add('is-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeNavigation();
    else openNavigation();
  });

  navigation.addEventListener('click', (event) => {
    if (isElement(event.target) && event.target.closest('a')) closeNavigation();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeNavigation({ returnFocus: true });
    }
  });
}
