(() => {
  const STORAGE_KEY = 'dh_cart_v1';

  const cartCountEl = document.getElementById('cartCount');
  const gridEl = document.getElementById('productGrid');
  const emptyEl = document.getElementById('emptyState');
  const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));

  const dialog = document.getElementById('detailsDialog');
  const detailsBody = document.getElementById('detailsBody');

  /** @returns {{items: Record<string, number>}} */
  function readCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { items: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.items || typeof parsed.items !== 'object') return { items: {} };
      return parsed;
    } catch {
      return { items: {} };
    }
  }

  /** @param {{items: Record<string, number>}} cart */
  function writeCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function cartCount(cart) {
    return Object.values(cart.items).reduce((acc, qty) => acc + (Number.isFinite(qty) ? qty : 0), 0);
  }

  function renderCartCount() {
    const cart = readCart();
    cartCountEl.textContent = String(cartCount(cart));
  }

  function setActiveFilter(filter) {
    for (const btn of filterButtons) {
      const isActive = btn.getAttribute('data-filter') === filter;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  }

  function applyFilter(filter) {
    const cards = Array.from(gridEl.querySelectorAll('.product-card'));
    let visibleCount = 0;

    for (const card of cards) {
      const cat = card.getAttribute('data-category');
      const isVisible = filter === 'all' ? true : cat === filter;
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) visibleCount += 1;
    }

    emptyEl.hidden = visibleCount !== 0;
  }

  function openDetails(productId) {
    const card = gridEl.querySelector(`.product-card[data-id="${CSS.escape(productId)}"]`);
    const title = card?.querySelector('.product-title')?.textContent?.trim() || 'Товар';
    const price = card?.querySelector('.price-tag')?.textContent?.trim() || '';
    const desc = card?.querySelector('.product-description')?.textContent?.trim() || '';

    detailsBody.innerHTML = `
      <p class="details__text"><strong>${escapeHtml(title)}</strong></p>
      <p class="details__text" style="margin-top:8px;">${escapeHtml(desc)}</p>
      <p class="details__text" style="margin-top:12px; opacity:.9;"><strong>Цена:</strong> ${escapeHtml(price)}</p>
      <p class="details__text" style="margin-top:12px;">Здесь можно подключить реальную карточку товара, фото‑галерею и характеристики.</p>
    `;

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      // Fallback на случай старого браузера
      alert(`${title}\n${desc}\nЦена: ${price}`);
    }
  }

  function closeDetails() {
    if (dialog.open) dialog.close();
  }

  function addToCart(productId) {
    const cart = readCart();
    cart.items[productId] = (cart.items[productId] || 0) + 1;
    writeCart(cart);
    renderCartCount();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function revealCardsSequentially() {
    const cards = Array.from(gridEl.querySelectorAll('.product-card'));
    for (const card of cards) {
      const delay = card.style.getPropertyValue('--delay') || '0ms';
      card.style.transitionDelay = delay;
    }

    requestAnimationFrame(() => {
      for (const card of cards) card.classList.add('is-visible');
    });
  }

  // Events
  document.addEventListener('click', (event) => {
    const target = /** @type {HTMLElement | null} */ (event.target instanceof HTMLElement ? event.target : null);
    if (!target) return;

    const filterBtn = target.closest('[data-filter]');
    if (filterBtn instanceof HTMLElement) {
      const filter = filterBtn.getAttribute('data-filter') || 'all';
      setActiveFilter(filter);
      applyFilter(filter);
      return;
    }

    const actionEl = target.closest('[data-action]');
    if (!(actionEl instanceof HTMLElement)) return;

    const action = actionEl.getAttribute('data-action');
    const id = actionEl.getAttribute('data-id');

    if (action === 'add' && id) {
      addToCart(id);
      return;
    }

    if (action === 'details' && id) {
      openDetails(id);
      return;
    }

    if (action === 'close') {
      closeDetails();
      return;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDetails();
  });

  // Init
  renderCartCount();
  setActiveFilter('all');
  applyFilter('all');
  revealCardsSequentially();
})();
