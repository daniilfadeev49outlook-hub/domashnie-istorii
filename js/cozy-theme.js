/* Minimal JS enhancements for cozy theme:
   - Smooth anchor scrolling with header offset
   - Optional reveal-on-scroll for product cards
*/
(function(){
  'use strict';

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
  });

  document.addEventListener('cozy:tildaLoaded', function(){
    // Newly injected product cards need reveal observer
    revealOnScroll();
    // If we opened with a hash, re-apply offset once targets exist
    if (location.hash){
      setTimeout(function(){ smoothScrollTo(location.hash); }, 50);
    }
  });
})();
