/* ==========================================================================
   KidDo API Developer Portal
   Additive UI shell around the stock Swagger UI rendered by swagger-ui-express.
   This script never talks to the API directly; it only presents the existing
   OpenAPI document and delegates all API testing to Swagger UI (window.ui).
   ========================================================================== */

(function () {
  'use strict';

  var SPEC_URL = '/api-docs.json';

  var ENVIRONMENTS = [
    { id: 'development', label: 'Development', url: 'https://dev.kiddoapp.in/api/v1' },
    { id: 'staging', label: 'Staging', url: 'https://staging.kiddoapp.in/api/v1' },
    { id: 'production', label: 'Production', url: 'https://kiddo-backend-950978285173.asia-south1.run.app/api/v1' }
  ];

  var LINKS = [
    { label: 'OpenAPI', href: '/api-docs.json', title: 'OpenAPI specification (JSON)' },
    { label: 'GitHub', href: 'https://github.com/kiddoappindia-app/kiddo-backend', title: 'KidDo backend repository' }
  ];

  var STORAGE_KEYS = {
    env: 'kiddo.portal.env',
    sidebar: 'kiddo.portal.sidebar-collapsed'
  };

  var ICONS = {
    logo: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3v18M6 12l7.5-9M6 12l8 9" stroke="#22c55e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="18.5" cy="4.6" r="2" fill="#22c55e"/></svg>',
    search: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="5.5" stroke="currentColor" stroke-width="1.7"/><path d="m13.3 13.3 3.2 3.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4.5" y="8.5" width="11" height="8" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M7 8.5v-2a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.6"/></svg>',
    menu: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m5.5 5.5 9 9m0-9-9 9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    chevron: '<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    copy: '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="7" y="7" width="9" height="9" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M13 7V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h1" stroke="currentColor" stroke-width="1.5"/></svg>'
  };

  var state = {
    spec: null,
    index: null,
    ui: null,
    ready: false,
    env: ENVIRONMENTS[0],
    opElements: {},
    navLinks: {},
    tagLinks: {},
    searchItems: [],
    activeResult: -1,
    refs: {}
  };

  /* ------------------------------------------------------------------ utils */

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function textOf(node) {
    return node ? node.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    var attributes = attrs || {};
    Object.keys(attributes).forEach(function (key) {
      var value = attributes[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key.indexOf('on') === 0 && typeof value === 'function') node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === 'dataset') Object.keys(value).forEach(function (dataKey) { node.dataset[dataKey] = value[dataKey]; });
      else node.setAttribute(key, value === true ? '' : String(value));
    });
    var list = Array.isArray(children) ? children : children ? [children] : [];
    list.forEach(function (child) {
      if (child === null || child === undefined) return;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return node;
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var context = this;
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { fn.apply(context, args); }, wait);
    };
  }

  function onFrame(fn) {
    var scheduled = false;
    return function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        fn();
      });
    };
  }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  }

  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* ignore */ }
  }

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function scrollToElement(node, offset) {
    if (!node) return;
    var header = $('.kiddo-header');
    var top = node.getBoundingClientRect().top + window.scrollY - ((header ? header.offsetHeight : 64) + (offset || 14));
    window.scrollTo({ top: top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  function flash(node, className) {
    if (!node) return;
    node.classList.add(className || 'kiddo-flash');
    window.setTimeout(function () { node.classList.remove(className || 'kiddo-flash'); }, 1600);
  }

  function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(value).then(function () { return true; }, function () { return legacyCopy(value); });
    }
    return Promise.resolve(legacyCopy(value));
  }

  function legacyCopy(value) {
    try {
      var area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', 'readonly');
      area.style.position = 'fixed';
      area.style.top = '-1000px';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(area);
      return ok;
    } catch (error) {
      return false;
    }
  }

  function isEditable(node) {
    if (!node) return false;
    var tag = (node.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || node.isContentEditable;
  }

  /* ------------------------------------------------------------------- shell */

  function buildHero() {
    var baseUrl = el('code', { id: 'kiddo-baseurl-value', text: state.env.url });
    var copyButton = el('button', { type: 'button', class: 'kiddo-copy-btn', 'aria-label': 'Copy base URL to clipboard' }, [
      el('span', { class: 'kiddo-copy-icon', 'aria-hidden': 'true', html: ICONS.copy }),
      el('span', { class: 'kiddo-copy-label', text: 'Copy' })
    ]);
    copyButton.addEventListener('click', function () {
      copyText(textOf($('#kiddo-baseurl-value'))).then(function (ok) {
        copyButton.classList.toggle('is-copied', ok);
        var label = $('.kiddo-copy-label', copyButton);
        if (label) label.textContent = ok ? 'Copied' : 'Copy failed';
        window.setTimeout(function () {
          copyButton.classList.remove('is-copied');
          if (label) label.textContent = 'Copy';
        }, 1800);
      });
    });

    var hero = el('section', { class: 'kiddo-hero', id: 'kiddo-hero', 'aria-labelledby': 'kiddo-hero-title' }, [
      el('p', { class: 'kiddo-hero-eyebrow', text: 'KidDo Developer Platform' }),
      el('h1', { class: 'kiddo-hero-title', id: 'kiddo-hero-title', text: 'KidDo API' }),
      el('p', { class: 'kiddo-hero-sub', text: 'Build powerful integrations with the KidDo platform.' }),
      el('div', { class: 'kiddo-badges' }, [
        el('span', { class: 'kiddo-badge', id: 'kiddo-version-badge', text: 'v1.0.0' }),
        el('span', { class: 'kiddo-badge', text: 'OpenAPI 3.0' }),
        el('span', { class: 'kiddo-badge', text: 'REST API' })
      ]),
      el('div', { class: 'kiddo-baseurl' }, [
        el('span', { class: 'kiddo-baseurl-label', text: 'Base URL' }),
        baseUrl,
        copyButton
      ])
    ]);

    state.refs.baseUrl = baseUrl;
    return hero;
  }

  function buildOverview() {
    return el('section', { class: 'kiddo-overview', id: 'kiddo-overview', 'aria-labelledby': 'kiddo-overview-title' }, [
      el('h2', { class: 'kiddo-section-title', id: 'kiddo-overview-title', text: 'Welcome to KidDo API' }),
      el('p', { class: 'kiddo-section-lead', text: 'The KidDo API provides secure REST APIs for the KidDo mobile and admin applications.' }),
      el('div', { class: 'kiddo-overview-grid' }, [
        el('div', { class: 'kiddo-card' }, [
          el('h3', { text: 'Quick start' }),
          el('ol', { class: 'kiddo-steps' }, [
            el('li', { text: 'Authenticate using /auth/login, /auth/parent/register, or Google mobile login.' }),
            el('li', { text: 'Receive an access token and a refresh token.' }),
            el('li', { text: 'Select Authorize above and paste the access token.' }),
            el('li', { text: 'Call any endpoint below with Try it out.' })
          ])
        ]),
        el('div', { class: 'kiddo-card' }, [
          el('h3', { text: 'Authentication' }),
          el('p', { html: 'JWT Bearer authentication. Send <code>Authorization: Bearer &lt;token&gt;</code> with every request.' }),
          el('p', { text: 'Access tokens are short-lived. Use the refresh flow to rotate them safely.' })
        ]),
        el('div', { class: 'kiddo-card' }, [
          el('h3', { text: 'Architecture' }),
          el('ol', { class: 'kiddo-flow', 'aria-label': 'Request flow' }, [
            el('li', { text: 'Client' }),
            el('li', { text: 'KidDo API' }),
            el('li', { text: 'Authentication' }),
            el('li', { text: 'Application Services' }),
            el('li', { text: 'MongoDB' })
          ])
        ])
      ])
    ]);
  }

  function buildShell() {
    document.body.classList.add('kiddo-portal');

    var skipLink = el('a', { class: 'kiddo-skip-link', href: '#kiddo-overview', text: 'Skip to documentation' });

    var envSelect = el('select', { class: 'kiddo-select', id: 'kiddo-env-select', 'aria-label': 'API environment' });
    ENVIRONMENTS.forEach(function (environment) {
      envSelect.appendChild(el('option', { value: environment.id, text: environment.label }));
    });
    envSelect.addEventListener('change', function () { setEnvironment(envSelect.value, true); });

    var versionSelect = el('select', { class: 'kiddo-select', id: 'kiddo-version-select', 'aria-label': 'API version' });
    versionSelect.appendChild(el('option', { value: 'v1', text: 'v1.0.0' }));

    var searchInput = el('input', {
      type: 'search',
      id: 'kiddo-search-input',
      class: 'kiddo-search-input',
      placeholder: 'Search documentation',
      'aria-label': 'Search documentation',
      role: 'combobox',
      'aria-expanded': 'false',
      'aria-controls': 'kiddo-search-results',
      'aria-autocomplete': 'list',
      autocomplete: 'off',
      spellcheck: 'false'
    });

    var searchResults = el('div', {
      id: 'kiddo-search-results',
      class: 'kiddo-search-results',
      role: 'listbox',
      'aria-label': 'Search results',
      hidden: true
    });

    var menuButton = el('button', {
      type: 'button',
      class: 'kiddo-icon-btn kiddo-menu-btn',
      'aria-label': 'Open API navigation',
      'aria-expanded': 'false',
      'aria-controls': 'kiddo-sidebar',
      html: ICONS.menu
    });
    menuButton.addEventListener('click', toggleMobileSidebar);

    var authorizeButton = el('button', {
      type: 'button',
      id: 'kiddo-authorize-btn',
      class: 'kiddo-authorize-btn',
      'aria-haspopup': 'dialog',
      'aria-label': 'Authorize'
    }, [
      el('span', { class: 'kiddo-authorize-icon', 'aria-hidden': 'true', html: ICONS.lock }),
      el('span', { class: 'kiddo-authorize-label', text: 'Authorize' })
    ]);
    authorizeButton.addEventListener('click', openAuthorizeDialog);

    var header = el('header', { class: 'kiddo-header' }, [
      el('div', { class: 'kiddo-header-inner' }, [
        el('a', { class: 'kiddo-brand', href: '/api-docs', 'aria-label': 'KidDo API documentation home' }, [
          el('span', { class: 'kiddo-logo', 'aria-hidden': 'true', html: ICONS.logo }),
          el('span', { class: 'kiddo-brand-text' }, [
            el('span', { class: 'kiddo-brand-title', text: 'KidDo API' }),
            el('span', { class: 'kiddo-brand-subtitle', text: 'Developer Documentation' })
          ])
        ]),
        menuButton,
        el('div', { class: 'kiddo-header-tools' }, [
          el('label', { class: 'kiddo-field kiddo-field-env' }, [
            el('span', { class: 'kiddo-sr-only', text: 'Environment' }),
            envSelect
          ]),
          el('label', { class: 'kiddo-field kiddo-field-version' }, [
            el('span', { class: 'kiddo-sr-only', text: 'API version' }),
            versionSelect
          ]),
          el('div', { class: 'kiddo-search' }, [
            el('span', { class: 'kiddo-search-icon', 'aria-hidden': 'true', html: ICONS.search }),
            searchInput,
            el('kbd', { class: 'kiddo-kbd', 'aria-hidden': 'true', text: '/' }),
            searchResults
          ]),
          el('nav', { class: 'kiddo-header-links', 'aria-label': 'Documentation links' },
            LINKS.map(function (link) {
              return el('a', { href: link.href, target: '_blank', rel: 'noopener noreferrer', title: link.title, text: link.label });
            })
          ),
          authorizeButton
        ])
      ])
    ]);

    var sidebarNav = el('nav', { class: 'kiddo-sidebar-nav', 'aria-label': 'API navigation' });

    var sidebarFilter = el('input', {
      type: 'search',
      id: 'kiddo-sidebar-filter',
      placeholder: 'Filter endpoints',
      'aria-label': 'Filter endpoints',
      autocomplete: 'off'
    });

    var collapseButton = el('button', {
      type: 'button',
      class: 'kiddo-icon-btn kiddo-sidebar-collapse',
      'aria-label': 'Collapse navigation',
      'aria-expanded': 'true',
      html: ICONS.chevron
    });
    collapseButton.addEventListener('click', function () {
      var collapsed = !document.body.classList.contains('kiddo-sidebar-collapsed');
      setSidebarCollapsed(collapsed);
    });

    var closeButton = el('button', {
      type: 'button',
      class: 'kiddo-icon-btn kiddo-sidebar-close',
      'aria-label': 'Close navigation',
      html: ICONS.close
    });
    closeButton.addEventListener('click', function () { closeMobileSidebar(true); });

    var sidebar = el('aside', { class: 'kiddo-sidebar', id: 'kiddo-sidebar' }, [
      el('div', { class: 'kiddo-sidebar-header' }, [
        el('span', { class: 'kiddo-sidebar-title', text: 'API Reference' }),
        collapseButton,
        closeButton
      ]),
      el('div', { class: 'kiddo-sidebar-filter' }, [sidebarFilter]),
      sidebarNav
    ]);

    var overlay = el('div', { class: 'kiddo-sidebar-overlay' });
    overlay.addEventListener('click', function () { closeMobileSidebar(true); });

    sidebarFilter.addEventListener('input', debounce(function () {
      applySidebarFilter(sidebarFilter.value);
    }, 120));

    searchInput.addEventListener('input', debounce(function () { handleSearchInput(searchInput.value); }, 120));
    searchInput.addEventListener('focus', function () {
      if (searchInput.value.trim()) handleSearchInput(searchInput.value);
    });
    searchInput.addEventListener('keydown', handleSearchKeydown);

    var endpointsSection = el('section', { class: 'kiddo-endpoints', id: 'kiddo-endpoints', 'aria-labelledby': 'kiddo-endpoints-title' }, [
      el('div', { class: 'kiddo-endpoints-head' }, [
        el('h2', { id: 'kiddo-endpoints-title', text: 'API Endpoints' }),
        el('p', { text: 'Every endpoint is generated from the live OpenAPI specification. Select Try it out to send a request.' })
      ])
    ]);

    var swaggerRoot = document.getElementById('swagger-ui');
    if (swaggerRoot) endpointsSection.appendChild(swaggerRoot);

    var footer = el('footer', { class: 'kiddo-footer' }, [
      el('span', { text: 'KidDo API' }),
      el('span', { text: 'OpenAPI 3.0' }),
      el('span', { text: '© ' + new Date().getFullYear() + ' KidDo' })
    ]);

    var main = el('main', { class: 'kiddo-main', id: 'kiddo-main' }, [buildHero(), buildOverview(), endpointsSection, footer]);
    var layout = el('div', { class: 'kiddo-layout' }, [sidebar, main]);

    document.body.insertBefore(layout, document.body.firstChild);
    document.body.insertBefore(header, layout);
    document.body.insertBefore(skipLink, header);
    document.body.appendChild(overlay);

    state.refs.envSelect = envSelect;
    state.refs.versionSelect = versionSelect;
    state.refs.searchInput = searchInput;
    state.refs.searchResults = searchResults;
    state.refs.sidebarNav = sidebarNav;
    state.refs.sidebarFilter = sidebarFilter;
    state.refs.collapseButton = collapseButton;
    state.refs.menuButton = menuButton;
    state.refs.authorizeButton = authorizeButton;
    state.refs.overview = document.getElementById('kiddo-overview');

    if (storageGet(STORAGE_KEYS.sidebar) === '1') setSidebarCollapsed(true);
  }

  function setSidebarCollapsed(collapsed) {
    document.body.classList.toggle('kiddo-sidebar-collapsed', collapsed);
    if (state.refs.collapseButton) state.refs.collapseButton.setAttribute('aria-expanded', String(!collapsed));
    storageSet(STORAGE_KEYS.sidebar, collapsed ? '1' : '0');
  }

  function toggleMobileSidebar() {
    if (document.body.classList.contains('kiddo-sidebar-open')) {
      closeMobileSidebar(true);
    } else {
      document.body.classList.add('kiddo-sidebar-open');
      if (state.refs.menuButton) state.refs.menuButton.setAttribute('aria-expanded', 'true');
    }
  }

  function closeMobileSidebar(restoreFocus) {
    if (!document.body.classList.contains('kiddo-sidebar-open')) return;
    document.body.classList.remove('kiddo-sidebar-open');
    if (state.refs.menuButton) {
      state.refs.menuButton.setAttribute('aria-expanded', 'false');
      if (restoreFocus) state.refs.menuButton.focus();
    }
  }

  /* --------------------------------------------------------------- spec data */

  function ensureSpec() {
    if (state.spec) return Promise.resolve(state.spec);
    return fetch(SPEC_URL, { headers: { Accept: 'application/json' } }).then(function (response) {
      if (!response.ok) throw new Error('Failed to load the OpenAPI specification (HTTP ' + response.status + ')');
      return response.json();
    }).then(function (spec) {
      state.spec = spec;
      state.index = buildIndex(spec);
      return spec;
    });
  }

  function buildIndex(spec) {
    var methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];
    var groups = [];
    var groupsByTag = {};
    var byKey = {};

    ((spec.tags) || []).forEach(function (tag) {
      var group = { name: tag.name, description: tag.description || '', ops: [] };
      groupsByTag[tag.name] = group;
      groups.push(group);
    });

    Object.keys(spec.paths || {}).forEach(function (path) {
      var pathItem = spec.paths[path] || {};
      methods.forEach(function (method) {
        var operation = pathItem[method];
        if (!operation) return;
        var tags = (operation.tags && operation.tags.length) ? operation.tags : ['Default'];
        var security = operation.security !== undefined ? operation.security : spec.security;
        var entry = {
          method: method,
          path: path,
          summary: operation.summary || '',
          description: operation.description || '',
          requiresAuth: Array.isArray(security) ? security.length > 0 : Boolean(security),
          tags: tags
        };
        byKey[method + ' ' + path] = entry;
        tags.forEach(function (tagName) {
          if (!groupsByTag[tagName]) {
            groupsByTag[tagName] = { name: tagName, description: '', ops: [] };
            groups.push(groupsByTag[tagName]);
          }
          groupsByTag[tagName].ops.push(entry);
        });
      });
    });

    var schemas = Object.keys((spec.components && spec.components.schemas) || {});
    return { groups: groups, byKey: byKey, schemas: schemas };
  }

  function updateVersionFromSpec() {
    if (!state.spec || !state.spec.info) return;
    var version = 'v' + (state.spec.info.version || '1.0.0');
    var badge = document.getElementById('kiddo-version-badge');
    if (badge) badge.textContent = version;
    if (state.refs.versionSelect && state.refs.versionSelect.options.length) {
      state.refs.versionSelect.options[0].textContent = version;
      state.refs.versionSelect.options[0].value = state.spec.info.version || 'v1';
    }
  }

  /* ---------------------------------------------------------------- sidebar */

  function buildSidebar() {
    var nav = state.refs.sidebarNav;
    if (!nav || !state.index) return;
    nav.textContent = '';
    state.navLinks = {};
    state.tagLinks = {};

    var overviewLink = el('button', { type: 'button', class: 'kiddo-nav-overview is-active' }, [
      el('span', { 'aria-hidden': 'true', html: '<svg viewBox="0 0 20 20" width="15" height="15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4.5h12M4 10h12M4 15.5h7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' }),
      el('span', { text: 'Overview' })
    ]);
    overviewLink.addEventListener('click', function () {
      setActiveNav('overview');
      scrollToElement(document.getElementById('kiddo-overview'), 20);
      closeMobileSidebar(false);
    });
    nav.appendChild(overviewLink);
    state.navLinks.overview = overviewLink;

    state.index.groups.forEach(function (group) {
      if (!group.ops.length) return;
      var groupEl = el('div', { class: 'kiddo-nav-group', dataset: { tag: group.name } });
      var toggle = el('button', { type: 'button', class: 'kiddo-nav-tag', 'aria-expanded': 'true' }, [
        el('span', { class: 'kiddo-nav-tag-label', text: group.name }),
        el('span', { class: 'kiddo-nav-tag-count', text: String(group.ops.length) }),
        el('span', { class: 'kiddo-nav-tag-chevron', 'aria-hidden': 'true', html: ICONS.chevron })
      ]);
      toggle.addEventListener('click', function () {
        var collapsed = groupEl.classList.toggle('is-collapsed');
        toggle.setAttribute('aria-expanded', String(!collapsed));
      });

      var list = el('ul', { class: 'kiddo-nav-ops' });
      group.ops.forEach(function (operation) {
        var key = operation.method + ' ' + operation.path;
        var link = el('button', {
          type: 'button',
          class: 'kiddo-nav-op',
          dataset: { op: key },
          title: operation.method.toUpperCase() + ' ' + operation.path
        }, [
          el('span', { class: 'kiddo-method kiddo-method-' + operation.method, text: operation.method.toUpperCase() }),
          el('span', { class: 'kiddo-nav-op-path', text: operation.path })
        ]);
        link.addEventListener('click', function () { revealOperation(key, true); });
        list.appendChild(el('li', {}, [link]));
        state.navLinks[key] = link;
      });

      groupEl.appendChild(toggle);
      groupEl.appendChild(list);
      nav.appendChild(groupEl);
      state.tagLinks[group.name] = toggle;
    });
  }

  function applySidebarFilter(query) {
    var value = (query || '').trim().toLowerCase();
    $$('.kiddo-nav-group', state.refs.sidebarNav).forEach(function (groupEl) {
      var visible = 0;
      $$('.kiddo-nav-op', groupEl).forEach(function (link) {
        var haystack = (link.dataset.op + ' ' + link.textContent).toLowerCase();
        var match = !value || haystack.indexOf(value) !== -1;
        link.parentElement.hidden = !match;
        if (match) visible += 1;
      });
      groupEl.hidden = Boolean(value) && visible === 0;
      if (value && visible > 0) groupEl.classList.remove('is-collapsed');
    });
  }

  function setActiveNav(key) {
    Object.keys(state.navLinks).forEach(function (navKey) {
      state.navLinks[navKey].classList.toggle('is-active', navKey === key);
    });
    Object.keys(state.tagLinks).forEach(function (tagName) {
      state.tagLinks[tagName].classList.remove('is-active');
    });
    if (key === 'overview' || !key) return;
    var link = state.navLinks[key];
    if (!link) return;
    var group = link.closest('.kiddo-nav-group');
    if (!group) return;
    group.classList.remove('is-collapsed');
    var tagButton = $('.kiddo-nav-tag', group);
    if (tagButton) tagButton.classList.add('is-active');
    ensureSidebarVisible(link);
  }

  function ensureSidebarVisible(link) {
    var sidebar = document.getElementById('kiddo-sidebar');
    if (!sidebar || sidebar.scrollHeight <= sidebar.clientHeight) return;
    var linkRect = link.getBoundingClientRect();
    var sidebarRect = sidebar.getBoundingClientRect();
    if (linkRect.top < sidebarRect.top + 56) {
      sidebar.scrollTop -= (sidebarRect.top + 56) - linkRect.top;
    } else if (linkRect.bottom > sidebarRect.bottom - 12) {
      sidebar.scrollTop += linkRect.bottom - (sidebarRect.bottom - 12);
    }
  }

  /* ----------------------------------------------------------------- search */

  function handleSearchInput(query) {
    if (!state.index) return;
    var value = (query || '').trim();
    if (!value) {
      closeSearchPanel();
      return;
    }
    renderSearchResults(value);
  }

  function renderSearchResults(query) {
    var results = searchIndex(query);
    var panel = state.refs.searchResults;
    var input = state.refs.searchInput;
    if (!panel) return;

    state.searchItems = [];
    state.activeResult = -1;
    panel.textContent = '';

    var hasResults = results.groups.length > 0 || results.schemas.length > 0;

    if (!hasResults) {
      panel.appendChild(el('div', { class: 'kiddo-search-empty', text: 'No matches for "' + query + '"' }));
    } else {
      results.groups.forEach(function (group) {
        var groupEl = el('div', { class: 'kiddo-search-group' }, [
          el('div', { class: 'kiddo-search-group-title', text: group.name })
        ]);
        group.ops.forEach(function (operation) {
          groupEl.appendChild(createOperationResult(operation));
        });
        panel.appendChild(groupEl);
      });

      if (results.schemas.length) {
        var schemaGroup = el('div', { class: 'kiddo-search-group' }, [
          el('div', { class: 'kiddo-search-group-title', text: 'Schemas' })
        ]);
        results.schemas.forEach(function (name) {
          schemaGroup.appendChild(createSchemaResult(name));
        });
        panel.appendChild(schemaGroup);
      }
    }

    openSearchPanel(input, panel);
  }

  function searchIndex(query) {
    var value = query.toLowerCase();
    var groups = [];
    state.index.groups.forEach(function (group) {
      var tagMatches = group.name.toLowerCase().indexOf(value) !== -1;
      var ops = group.ops.filter(function (operation) {
        if (tagMatches) return true;
        var haystack = (operation.method + ' ' + operation.path + ' ' + operation.summary + ' ' + operation.description).toLowerCase();
        return haystack.indexOf(value) !== -1;
      });
      if (ops.length) groups.push({ name: group.name, ops: ops });
    });
    var schemas = state.index.schemas.filter(function (name) {
      return name.toLowerCase().indexOf(value) !== -1;
    });
    return { groups: groups, schemas: schemas };
  }

  function createOperationResult(operation) {
    var key = operation.method + ' ' + operation.path;
    var item = el('button', {
      type: 'button',
      class: 'kiddo-search-item',
      id: 'kiddo-search-option-' + state.searchItems.length,
      role: 'option',
      'aria-selected': 'false',
      dataset: { op: key }
    }, [
      el('span', { class: 'kiddo-method kiddo-method-' + operation.method, text: operation.method.toUpperCase() }),
      el('span', { class: 'kiddo-search-item-path', text: operation.path }),
      el('span', { class: 'kiddo-search-item-summary', text: operation.summary })
    ]);
    item.addEventListener('click', function () { revealOperation(key, true); });
    state.searchItems.push(item);
    return item;
  }

  function createSchemaResult(name) {
    var item = el('button', {
      type: 'button',
      class: 'kiddo-search-item',
      id: 'kiddo-search-option-' + state.searchItems.length,
      role: 'option',
      'aria-selected': 'false',
      dataset: { schema: name }
    }, [
      el('span', { class: 'kiddo-method kiddo-method-head', text: 'SCHEMA' }),
      el('span', { class: 'kiddo-search-item-path', text: name })
    ]);
    item.addEventListener('click', function () { revealSchema(name); });
    state.searchItems.push(item);
    return item;
  }

  function openSearchPanel(input, panel) {
    panel.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  }

  function closeSearchPanel() {
    var panel = state.refs.searchResults;
    var input = state.refs.searchInput;
    if (panel) panel.hidden = true;
    if (input) input.setAttribute('aria-expanded', 'false');
    state.activeResult = -1;
    state.searchItems.forEach(function (item) {
      item.classList.remove('is-active');
      item.setAttribute('aria-selected', 'false');
    });
  }

  function moveSearchActive(delta) {
    if (!state.searchItems.length) return;
    state.activeResult = (state.activeResult + delta + state.searchItems.length) % state.searchItems.length;
    state.searchItems.forEach(function (item, itemIndex) {
      var active = itemIndex === state.activeResult;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    var activeItem = state.searchItems[state.activeResult];
    activeItem.scrollIntoView({ block: 'nearest' });
    state.refs.searchInput.setAttribute('aria-activedescendant', activeItem.id);
  }

  function handleSearchKeydown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveSearchActive(event.key === 'ArrowDown' ? 1 : -1);
    } else if (event.key === 'Enter') {
      if (state.activeResult >= 0 && state.searchItems[state.activeResult]) {
        event.preventDefault();
        state.searchItems[state.activeResult].click();
      }
    } else if (event.key === 'Escape') {
      closeSearchPanel();
      state.refs.searchInput.blur();
    }
  }

  /* -------------------------------------------------------------- reveal ops */

  function findOpElement(key) {
    if (state.opElements[key]) return state.opElements[key];
    var ops = $$('.swagger-ui .opblock');
    for (var index = 0; index < ops.length; index += 1) {
      var opblock = ops[index];
      if (opblock.dataset.kiddoOp === key) return opblock;
      var method = textOf($('.opblock-summary-method', opblock)).toLowerCase();
      var pathNode = $('.opblock-summary-path', opblock);
      var path = pathNode ? (pathNode.getAttribute('data-path') || textOf(pathNode)) : '';
      if (method + ' ' + path === key) return opblock;
    }
    return null;
  }

  function revealOperation(key, expand) {
    var target = findOpElement(key);
    closeSearchPanel();
    if (state.refs.searchInput) state.refs.searchInput.value = '';
    if (!target) return;
    if (expand && !target.classList.contains('is-open')) {
      var control = $('.opblock-summary-control', target) || $('.opblock-summary', target);
      if (control) control.click();
    }
    window.setTimeout(function () {
      scrollToElement(target, 18);
      flash(target);
    }, expand ? 200 : 0);
    setActiveNav(key);
    closeMobileSidebar(false);
  }

  function revealSchema(name) {
    closeSearchPanel();
    if (state.refs.searchInput) state.refs.searchInput.value = '';
    expandAndRevealSchema(name, 0);
  }

  function findModelContainer(models, name) {
    var direct = $('.swagger-ui .model-container[data-name="' + name.replace(/"/g, '\\"') + '"]', models);
    if (direct) return direct;
    var found = null;
    $$('.model-container', models).forEach(function (container) {
      if (found) return;
      var title = $('.model-title', container);
      if (title && textOf(title).replace(/^#\/components\/schemas\//, '') === name) found = container;
    });
    return found;
  }

  function expandAndRevealSchema(name, attempt) {
    var models = $('.swagger-ui .models');
    if (!models) return;

    var target = findModelContainer(models, name);
    if (!target && attempt < 2) {
      var modelsControl = $('.models-control', models);
      if (modelsControl) {
        modelsControl.click();
        window.setTimeout(function () { expandAndRevealSchema(name, attempt + 1); }, 260);
        return;
      }
    }
    if (!target) return;

    var expandControl = $('.model-box-control', target);
    var needsExpand = Boolean(expandControl) && expandControl.getAttribute('aria-expanded') !== 'true';
    if (needsExpand) expandControl.click();

    window.setTimeout(function () {
      scrollToElement(target, 20);
      flash(target);
    }, needsExpand ? 220 : 0);
  }

  /* ------------------------------------------------------------ decorations */

  function statusClass(code) {
    var match = /^(\d)/.exec((code || '').trim());
    return match ? match[1] + 'xx' : 'default';
  }

  function decorate() {
    if (!state.index) return;
    state.opElements = {};

    $$('.swagger-ui .opblock').forEach(function (opblock) {
      var method = textOf($('.opblock-summary-method', opblock)).toLowerCase();
      var pathNode = $('.opblock-summary-path', opblock);
      var path = pathNode ? (pathNode.getAttribute('data-path') || textOf(pathNode)) : '';
      if (!method || !path) return;
      var key = method + ' ' + path;
      state.opElements[key] = opblock;
      opblock.dataset.kiddoOp = key;
      var meta = state.index.byKey[key];
      opblock.dataset.kiddoAuth = meta && meta.requiresAuth ? 'required' : 'public';
    });

    $$('.swagger-ui .responses-table .response').forEach(function (row) {
      row.dataset.kiddoStatus = statusClass(textOf($('.response-col_status', row)));
    });

    $$('.swagger-ui .opblock-body h5').forEach(function (heading) {
      var label = textOf(heading).toLowerCase();
      if (label === 'request duration' || label === 'response headers') {
        if (heading.parentElement) heading.parentElement.classList.add('kiddo-metric');
      }
    });

    decorateAuthDialog();
    syncAuthorizeState();
  }

  function getNativeAuthorizeButton() {
    var buttons = $$('.swagger-ui .auth-wrapper > .btn.authorize');
    return buttons.length ? buttons[0] : null;
  }

  function openAuthorizeDialog() {
    var nativeButton = getNativeAuthorizeButton();
    if (nativeButton) {
      nativeButton.click();
      window.setTimeout(decorateAuthDialog, 50);
    }
  }

  function decorateAuthDialog() {
    var dialog = $('.swagger-ui .dialog-ux');
    if (!dialog) return;
    var inner = $('.modal-ux-inner', dialog);
    if (!inner) return;

    if (!inner.querySelector('.kiddo-auth-note')) {
      var note = el('p', {
        class: 'kiddo-auth-note',
        html: 'This API uses JWT Bearer authentication. The token is sent as <code>Authorization: Bearer &lt;token&gt;</code>. ' +
          'The token stays in this browser tab and is never rendered into the page source.'
      });
      var header = $('.modal-ux-header', inner);
      inner.insertBefore(note, header && header.nextSibling ? header.nextSibling : inner.firstChild);
    }

    $$('input', dialog).forEach(function (input) {
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');
    });
  }

  function syncAuthorizeState() {
    var nativeButton = getNativeAuthorizeButton();
    var button = state.refs.authorizeButton;
    if (!nativeButton || !button) return;
    var authorized = nativeButton.classList.contains('locked');
    button.classList.toggle('is-authorized', authorized);
    button.setAttribute('aria-label', authorized ? 'Authorized. Manage authorization' : 'Authorize');
  }

  function updateActiveFromScroll() {
    if (!state.index) return;
    var header = $('.kiddo-header');
    var offset = (header ? header.offsetHeight : 64) + 46;
    var opblocks = $$('.swagger-ui .opblock');
    var currentKey = null;
    var lastAbove = null;

    for (var index = 0; index < opblocks.length; index += 1) {
      var rect = opblocks[index].getBoundingClientRect();
      if (rect.top <= offset && rect.bottom > offset) {
        currentKey = opblocks[index].dataset.kiddoOp;
        break;
      }
      if (rect.top <= offset) lastAbove = opblocks[index];
    }
    if (!currentKey && lastAbove) currentKey = lastAbove.dataset.kiddoOp;

    if (!currentKey) {
      var overview = document.getElementById('kiddo-overview');
      if (overview) {
        var overviewRect = overview.getBoundingClientRect();
        if (overviewRect.top <= offset + 120) {
          setActiveNav('overview');
          return;
        }
      }
      return;
    }

    var lastActive = $('.kiddo-nav-op.is-active', state.refs.sidebarNav);
    if (lastActive && lastActive.dataset.op === currentKey) return;
    setActiveNav(currentKey);
  }

  /* -------------------------------------------------------------- environment */

  function setEnvironment(id, applyToSwagger) {
    var environment = ENVIRONMENTS.filter(function (item) { return item.id === id; })[0] || ENVIRONMENTS[0];
    state.env = environment;
    if (state.refs.envSelect && state.refs.envSelect.value !== environment.id) state.refs.envSelect.value = environment.id;
    if (state.refs.baseUrl) state.refs.baseUrl.textContent = environment.url;
    storageSet(STORAGE_KEYS.env, environment.id);
    if (applyToSwagger) applyEnvironmentToSwagger(environment);
  }

  function applyEnvironmentToSwagger(environment) {
    if (!state.ui || !state.spec || typeof state.ui.specActions.updateJsonSpec !== 'function') return;
    var nextSpec;
    try {
      nextSpec = JSON.parse(JSON.stringify(state.spec));
    } catch (error) {
      return;
    }
    nextSpec.servers = [{ url: environment.url, description: environment.label }];
    state.ui.specActions.updateJsonSpec(nextSpec);
    window.setTimeout(decorate, 400);
    window.setTimeout(decorate, 1400);
  }

  function resolveInitialEnvironment() {
    var stored = storageGet(STORAGE_KEYS.env);
    if (stored && ENVIRONMENTS.some(function (item) { return item.id === stored; })) return stored;

    var originMatch = ENVIRONMENTS.filter(function (item) {
      try { return new URL(item.url).origin === window.location.origin; } catch (error) { return false; }
    })[0];
    if (originMatch) return originMatch.id;

    var servers = (state.spec && state.spec.servers) || [];
    for (var index = 0; index < servers.length; index += 1) {
      var match = ENVIRONMENTS.filter(function (item) { return item.url === servers[index].url; })[0];
      if (match) return match.id;
    }
    return ENVIRONMENTS[0].id;
  }

  /* -------------------------------------------------------------------- boot */

  function initPortal() {
    if (state.ready) return;
    state.ready = true;
    state.ui = window.ui;

    ensureSpec().then(function () {
      updateVersionFromSpec();
      buildSidebar();
      setEnvironment(resolveInitialEnvironment(), true);

      var swaggerRoot = document.getElementById('swagger-ui');
      if (swaggerRoot && window.MutationObserver) {
        var observer = new MutationObserver(debounce(decorate, 120));
        observer.observe(swaggerRoot, { childList: true, subtree: true });
      }

      window.addEventListener('scroll', onFrame(updateActiveFromScroll), { passive: true });
      window.addEventListener('resize', onFrame(updateActiveFromScroll), { passive: true });

      decorate();
      window.setTimeout(decorate, 500);
    }).catch(function (error) {
      if (window.console && window.console.error) window.console.error('[KidDo Portal]', error);
      var nav = state.refs.sidebarNav;
      if (nav) {
        nav.textContent = '';
        nav.appendChild(el('p', {
          class: 'kiddo-sidebar-error',
          text: 'Unable to load the OpenAPI specification. Swagger UI below is still fully functional.'
        }));
      }
    });
  }

  function waitForSwaggerUi() {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (window.ui && document.querySelector('.swagger-ui .opblock')) {
        window.clearInterval(timer);
        initPortal();
      } else if (attempts > 120) {
        window.clearInterval(timer);
        initPortal();
      }
    }, 120);
  }

  function bindGlobalHandlers() {
    document.addEventListener('click', function (event) {
      var search = $('.kiddo-search');
      if (search && !search.contains(event.target)) closeSearchPanel();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === '/' && !isEditable(event.target)) {
        event.preventDefault();
        if (state.refs.searchInput) state.refs.searchInput.focus();
      } else if (event.key === 'Escape') {
        closeSearchPanel();
        closeMobileSidebar(true);
      }
    });
  }

  buildShell();
  bindGlobalHandlers();

  if (document.readyState === 'complete') {
    waitForSwaggerUi();
  } else {
    window.addEventListener('load', waitForSwaggerUi);
  }
})();
