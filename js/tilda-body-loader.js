/* Loads full Tilda exported body (files/page71962991body.html) into #tilda-root.
   Rationale: keep Tilda store/forms/cart logic intact without copying huge HTML into index.html.
*/
(function(){
  'use strict';

  function execScripts(container){
    var scripts = container.querySelectorAll('script');
    Array.prototype.forEach.call(scripts, function(oldScript){
      var s = document.createElement('script');
      // copy attributes
      Array.prototype.forEach.call(oldScript.attributes, function(attr){
        s.setAttribute(attr.name, attr.value);
      });
      // inline code
      if (!s.src) s.text = oldScript.textContent || '';
      oldScript.parentNode.replaceChild(s, oldScript);
    });
  }

  function showError(root, message){
    root.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.style.padding = '24px';
    wrap.style.textAlign = 'center';
    wrap.textContent = (message || 'Не удалось загрузить контент.');
    root.appendChild(wrap);
  }

  async function load(){
    var root = document.getElementById('tilda-root');
    if (!root) return;

    var src = root.getAttribute('data-src');
    if (!src) return;

    // When opened as a local file, browsers usually block fetch() to other local files.
    if (location.protocol === 'file:'){
      var fileName = (location.pathname || '').split('/').pop() || 'index.html';
      var localUrl = 'http://localhost:8000/' + fileName;
      showError(
        root,
        'Контент не загрузился, потому что страница открыта как локальный файл (file:///), а браузер блокирует загрузку через fetch(). ' +
        'Запустите локальный сервер: откройте serve.cmd (или serve.ps1), затем зайдите на ' + localUrl
      );
      return;
    }

    try {
      var res = await fetch(src, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var html = await res.text();

      var doc = new DOMParser().parseFromString(html, 'text/html');
      var allrecords = doc.querySelector('#allrecords');
      if (!allrecords) throw new Error('Missing #allrecords in ' + src);

      // Insert
      root.innerHTML = '';
      root.appendChild(document.importNode(allrecords, true));

      // Ensure global reference exists (some Tilda helpers read window.allrecords)
      window.allrecords = document.getElementById('allrecords');

      // Run inline init scripts from inserted markup
      execScripts(root);

      // Notify other scripts (e.g., theme reveal)
      document.dispatchEvent(new CustomEvent('cozy:tildaLoaded'));
    } catch (err) {
      showError(root, 'Не удалось загрузить контент (' + String(err && err.message ? err.message : err) + ').');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
