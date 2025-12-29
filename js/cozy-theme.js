/* Minimal JS enhancements for cozy theme:
   - Smooth anchor scrolling with header offset
   - Optional reveal-on-scroll for product cards
*/
(function(){
  'use strict';

  function initHeaderCollapse(){
    var body = document.body;
    if (!body) return;

    // Only enable if a header-like block exists on the page.
    var hasHeader = !!(
      document.querySelector('.site-header') ||
      document.querySelector('#rec1147829631') ||
      document.querySelector('#nav1147775986') ||
      document.querySelector('#rec1147775986')
    );
    if (!hasHeader) return;

    var lastState = null;
    var ticking = false;

    function update(){
      ticking = false;
      var collapsed = (window.pageYOffset || 0) > 16;
      if (collapsed === lastState) return;
      body.classList.toggle('is-header-collapsed', collapsed);
      lastState = collapsed;
    }

    window.addEventListener('scroll', function(){
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, {passive:true});

    update();
  }

  function initAutoNudgeFromNameField(){
    var body = document.body;
    if (!body) return;

    // We use the left gap of the "Ваше имя" field as a reference.
    var nameInput = document.querySelector(
      '#rec1147674066 input#input_1493283059688, #rec1147674066 input[placeholder="Ваше имя"]'
    );
    if (!nameInput || !nameInput.getBoundingClientRect) return;

    function apply(){
      var rect = nameInput.getBoundingClientRect();
      if (!rect || !isFinite(rect.left)) return;

      // For 100%-width inputs, `rightGap` is usually ~0. Use the left gap instead.
      // Practical behavior: when the block sticks to the left edge, nudge it
      // to match our mobile gutter.
      var leftGap = rect.left;
      if (!isFinite(leftGap)) return;

      var gutter = 14;
      try{
        var cssGutter = window.getComputedStyle(document.documentElement).getPropertyValue('--cozy-gutter');
        var parsed = parseFloat(cssGutter);
        if (isFinite(parsed) && parsed > 0) gutter = parsed;
      }catch(e){}

      // Clamp to a safe range to avoid weird shifts.
      var nudge = Math.round(Math.max(0, Math.min(24, gutter - leftGap)));
      document.documentElement.style.setProperty('--cozy-auto-nudge', nudge + 'px');
      body.classList.toggle('has-cozy-auto-nudge', nudge >= 1);
    }

    // Run once now and again after layout settles.
    apply();
    setTimeout(apply, 80);
    setTimeout(apply, 250);

    window.addEventListener('resize', function(){ apply(); }, {passive:true});
    window.addEventListener('orientationchange', function(){ setTimeout(apply, 120); });
  }

  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function getHeaderOffset(){
    var candidates = [
      document.querySelector('.site-header'),
      document.querySelector('#nav1147775986'),
      document.querySelector('#rec1147829631')
    ].filter(Boolean);
    if (!candidates.length) return 0;
    var maxH = 0;
    candidates.forEach(function(el){
      var rect = el.getBoundingClientRect();
      if (rect.height && rect.height > maxH) maxH = rect.height;
    });
    return Math.max(0, Math.round(maxH));
  }

  function smoothScrollTo(hash){
    if (!hash || hash.charAt(0) !== '#') return;
    var id = decodeURIComponent(hash.slice(1));
    if (!id) return;
    var target = document.getElementById(id) || document.querySelector('a[name="' + CSS.escape(id) + '"]');
    if (!target) return;

    var top = target.getBoundingClientRect().top + window.pageYOffset;
    var offset = getHeaderOffset() + 18;

    window.scrollTo({
      top: Math.max(0, top - offset),
      behavior: prefersReducedMotion() ? 'auto' : 'smooth'
    });
  }

  function bindAnchors(){
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      if (!a) return;
      // Only handle links explicitly marked for cozy smooth-scroll.
      if (!a.hasAttribute('data-cozy-scroll')) return;
      var href = a.getAttribute('href');
      if (!href) return;

      // only same-page anchors
      if (href.charAt(0) === '#'){
        var id = href.slice(1);
        if (!id) return;
        e.preventDefault();
        history.pushState(null, '', href);
        smoothScrollTo(href);
      }
    }, {passive:false});

    // On first load, if hash present, adjust offset
    if (location.hash){
      setTimeout(function(){ smoothScrollTo(location.hash); }, 50);
    }
  }

  function revealOnScroll(){
    var cards = Array.prototype.slice.call(document.querySelectorAll('.js-product'));
    if (!cards.length) return;

    // If already styled elsewhere, do nothing
    cards.forEach(function(el){
      if (!el.classList.contains('dh-inview')) el.classList.add('dh-will-reveal');
    });

    if (prefersReducedMotion() || !('IntersectionObserver' in window)){
      cards.forEach(function(el){ el.classList.add('dh-inview'); });
      return;
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add('dh-inview');
          io.unobserve(entry.target);
        }
      });
    }, {root:null, rootMargin:'0px 0px -10% 0px', threshold:0.12});

    cards.forEach(function(el){ io.observe(el); });
  }

  function enhanceProductGrid(){
    var grid = document.querySelector('#rec1147674086 .t754__parent');
    if (!grid) return;

    var items = Array.prototype.slice.call(grid.querySelectorAll('.t754__col.js-product'));
    if (!items.length) return;

    var stories = [
      'Тёплая вещь, которая бережно поддерживает суставы и напоминает о домашних вечерах с пледом.',
      'Натуральная шерсть мериноса пропускает воздух, снимает усталость и делает тепло живым.',
      'Сшито в России маленькой партией: каждая штука проходит руки мастеров.',
      'Создано для долгой службы: мягко облегает тело и не парит даже днём.',
      'Добавьте в корзину, если нужен подарок с заботой и фактурой настоящей шерсти.'
    ];

    items.forEach(function(item, idx){
      if (item.dataset.dhDecorated) return;
      var wrap = item.querySelector('.t754__textwrapper');
      if (!wrap) return;

      var descr = wrap.querySelector('.t754__descr');

      var row = document.createElement('div');
      row.className = 'dh-badge-row';

      [
        ['Мериносовая шерсть', 'dh-icon-merino'],
        ['Сделано в России', 'dh-icon-russia'],
        ['Ручная работа', 'dh-icon-hand']
      ].forEach(function(tuple){
        var badge = document.createElement('span');
        badge.className = 'dh-badge ' + tuple[1];
        badge.textContent = tuple[0];
        row.appendChild(badge);
      });

      var story = document.createElement('div');
      story.className = 'dh-story';
      story.textContent = stories[idx % stories.length];

      if (descr && descr.parentNode){
        descr.parentNode.insertBefore(row, descr.nextSibling);
        descr.parentNode.insertBefore(story, row.nextSibling);
      }else{
        wrap.appendChild(row);
        wrap.appendChild(story);
      }

      item.dataset.dhDecorated = '1';
    });
  }

  function addTrustNotes(){
    var forms = Array.prototype.slice.call(document.querySelectorAll('#rec1147674066 .t-form, #rec1169926406 .t-form'));
    forms.forEach(function(form){
      if (form.dataset.dhTrust) return;
      var note = document.createElement('div');
      note.className = 'dh-trust-note';
      note.textContent = 'Отвечаем за 10 минут. Без спама, только по делу.';
      form.appendChild(note);

      var inputs = form.querySelectorAll('input, textarea');
      inputs.forEach(function(input){
        if (input.placeholder && input.placeholder.indexOf('Ваше имя') !== -1){
          input.placeholder = 'Как к вам обращаться?';
        }else if (input.placeholder && input.placeholder.indexOf('Телефон') !== -1){
          input.placeholder = 'Телефон для быстрого ответа';
        }
      });

      form.dataset.dhTrust = '1';
    });
  }

  function initBackToTop(){
    var btn = document.querySelector('.cozy-to-top');
    if (!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cozy-to-top';
      btn.setAttribute('aria-label', 'Вверх');
      btn.textContent = '↑';
      document.body.appendChild(btn);
    }

    var lastVisible = false;
    function toggle(){
      var shouldShow = (window.pageYOffset || 0) > 280;
      if (shouldShow === lastVisible) return;
      btn.classList.toggle('is-visible', shouldShow);
      lastVisible = shouldShow;
    }

    btn.addEventListener('click', function(){
      window.scrollTo({top:0, behavior: prefersReducedMotion() ? 'auto' : 'smooth'});
    });

    window.addEventListener('scroll', toggle, {passive:true});
    toggle();
  }

  function markActiveNav(){
    var sections = [
      {id:'main', links: findLinks('#main')},
      {id:'about', links: findLinks('#about')},
      {id:'items', links: findLinks('#items')},
      {id:'lookbook', links: findLinks('#lookbook')},
      {id:'otzuv', links: findLinks('#otzuv')},
      {id:'contact', links: findLinks('#contact')}
    ];

    if (!('IntersectionObserver' in window)) return;

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var match = sections.find(function(s){ return s.el === entry.target; });
        if (!match) return;
        match.links.forEach(function(link){
          link.classList.toggle('is-active', entry.isIntersecting);
        });
      });
    }, {root:null, threshold:0.34, rootMargin:'0px 0px -30% 0px'});

    sections.forEach(function(s){
      var el = document.getElementById(s.id) || document.querySelector('a[name="' + CSS.escape(s.id) + '"]');
      s.el = el;
      if (el) io.observe(el);
    });

    function findLinks(hash){
      return Array.prototype.slice.call(document.querySelectorAll('a[href="' + hash + '"]'));
    }
  }

  function injectContactActions(){
    var block = document.querySelector('#rec1324703161 .t564');
    if (!block || block.dataset.dhCta) return;
    var actions = document.createElement('div');
    actions.className = 'dh-contact-actions';
    actions.innerHTML = [
      '<a href="tel:+7" aria-label="Позвонить">Позвонить</a>',
      '<a href="https://wa.me/7" aria-label="WhatsApp">WhatsApp</a>',
      '<a href="https://t.me/" aria-label="Telegram">Telegram</a>'
    ].join('');
    block.appendChild(actions);
    block.dataset.dhCta = '1';
  }

  document.addEventListener('DOMContentLoaded', function(){
    bindAnchors();
    revealOnScroll();
    initHeaderCollapse();
    initAutoNudgeFromNameField();
    enhanceProductGrid();
    addTrustNotes();
    initBackToTop();
    markActiveNav();
    injectContactActions();
  });

  document.addEventListener('cozy:tildaLoaded', function(){
    // Newly injected product cards need reveal observer
    revealOnScroll();
    // In case header comes from injected Tilda blocks
    initHeaderCollapse();
    initAutoNudgeFromNameField();
    enhanceProductGrid();
    addTrustNotes();
    initBackToTop();
    markActiveNav();
    injectContactActions();
    // If we opened with a hash, re-apply offset once targets exist
    if (location.hash){
      setTimeout(function(){ smoothScrollTo(location.hash); }, 50);
    }
  });
})();
