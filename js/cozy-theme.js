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

  document.addEventListener('DOMContentLoaded', function(){
    bindAnchors();
    revealOnScroll();
    initHeaderCollapse();
    initAutoNudgeFromNameField();
  });

  document.addEventListener('cozy:tildaLoaded', function(){
    // Newly injected product cards need reveal observer
    revealOnScroll();
    // In case header comes from injected Tilda blocks
    initHeaderCollapse();
    initAutoNudgeFromNameField();
    // If we opened with a hash, re-apply offset once targets exist
    if (location.hash){
      setTimeout(function(){ smoothScrollTo(location.hash); }, 50);
    }
  });
})();
