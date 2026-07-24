// ==UserScript==
// @name         FeedBan
// @namespace    https://github.com/feedban/userscript
// @version      1.1.0
// @description  Highlight or block X accounts whose display names or bios match your emoji and text filters.
// @author       geekzahra
// @match        https://x.com/*
// @match        https://twitter.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_getResourceURL
// @resource     Vazirmatn https://cdn.jsdelivr.net/npm/@fontsource-variable/vazirmatn@5.3.0/files/vazirmatn-arabic-wght-normal.woff2
// @downloadURL  https://raw.githubusercontent.com/geekzahra/FeedBan/master/feedban.user.js
// @updateURL    https://raw.githubusercontent.com/geekzahra/FeedBan/master/feedban.user.js
// @run-at       document-idle
// ==/UserScript==

(() => {
  'use strict';

  /*
   * FeedBan deliberately uses X's visible menu and confirmation controls.
   * It does not inspect session credentials or call undocumented private APIs.
   */

  // ---------------------------------------------------------------------------
  // 1. Configuration & state store
  // ---------------------------------------------------------------------------

  const APP_ID = 'feedban';
  const STORAGE_KEY = 'feedban.settings.v1';
  const FIXED_ACTION_DELAY_MS = 1500;
  const DEFAULTS = Object.freeze({
    enabled: true,
    dryRun: true,
    collapsed: false,
    language: 'en',
    filters: ['🇵🇸', '🎒'],
    totalBlocked: 0,
    activityLog: [],
  });

  const SELECTORS = Object.freeze({
    scanRoot: '[data-testid="primaryColumn"], main[role="main"]',
    candidate: [
      '[data-testid="cellInner"]',
      '[data-testid="UserCell"]',
      '[data-testid="tweet"]',
      '[data-testid="User-Name"]',
      '[data-testid="UserName"]',
    ].join(','),
    userName: '[data-testid="User-Name"], [data-testid="UserName"]',
    bio: '[data-testid="UserDescription"]',
    moreButton: [
      'button[data-testid="caret"]',
      '[data-testid="caret"]',
      'button[aria-label="More"]',
      'button[aria-label^="More"]',
    ].join(','),
    blockMenuItem: '[data-testid="block"]',
    confirmButton: '[data-testid="confirmationSheetConfirm"]',
  });

  const RESERVED_PATHS = new Set([
    'compose', 'explore', 'hashtag', 'home', 'i', 'intent', 'login', 'logout',
    'messages', 'notifications', 'search', 'settings', 'share', 'signup',
  ]);

  const I18N = Object.freeze({
    en: {
      panelLabel: 'FeedBan controls',
      title: 'FeedBan',
      switchLanguage: 'Switch to Persian',
      expand: 'Expand FeedBan',
      minimize: 'Minimize FeedBan',
      automaticScanning: 'Automatic scanning',
      enabled: 'FeedBan is on',
      paused: 'FeedBan is paused',
      automaticSwitch: 'Pause or resume FeedBan',
      dryRun: 'Test / Dry Run',
      dryRunHint: 'Highlight matches without blocking',
      dryRunSwitch: 'Toggle dry-run mode',
      filters: 'Filters',
      filtersHint: 'Literal, case-insensitive text and emoji matching',
      newFilter: 'New filter',
      filterPlaceholder: 'Emoji or phrase…',
      add: 'Add',
      blockedSession: 'Blocked this session',
      totalBlocked: 'Total blocked',
      recentActivity: 'Recent activity',
      footer: 'First install starts in safe dry-run mode.',
      noActivity: 'No block attempts yet.',
      unknownAccount: 'Unknown account',
      recorded: 'Recorded',
      removeFilter: 'Remove filter {filter}',
      duplicateFilter: 'That filter already exists.',
      filterLimit: 'The 100-filter limit has been reached.',
      circuitPause: 'Safety pause active. Blocking resumes in {seconds}s.',
      dryRunMatch: 'Dry-run match',
      uiActionFailed: 'UI action failed',
      cardLeftPage: 'Account card left the page',
      moreUnavailable: 'More menu unavailable',
      blockUnavailable: 'Block command unavailable',
      alreadyBlocked: 'Already blocked',
      confirmationUnavailable: 'Confirmation unavailable',
      blocked: 'Blocked',
      match: 'Match',
      block: 'Block',
    },
    fa: {
      panelLabel: 'کنترل‌های فیدبان',
      title: 'فیدبان',
      switchLanguage: 'تغییر زبان به انگلیسی',
      expand: 'باز کردن فیدبان',
      minimize: 'کوچک کردن فیدبان',
      automaticScanning: 'بررسی خودکار',
      enabled: 'فیدبان روشن است',
      paused: 'فیدبان متوقف است',
      automaticSwitch: 'توقف یا ادامه بررسی خودکار',
      dryRun: 'حالت آزمایشی',
      dryRunHint: 'پیدا کردن موارد بدون بلاک کردن',
      dryRunSwitch: 'روشن یا خاموش کردن حالت آزمایشی',
      filters: 'فیلترها',
      filtersHint: 'پیدا کردن متن و ایموجی بدون تفاوت حروف بزرگ و کوچک',
      newFilter: 'فیلتر جدید',
      filterPlaceholder: 'ایموجی یا عبارت…',
      add: 'افزودن',
      blockedSession: 'بلاک‌شده در این نشست',
      totalBlocked: 'مجموع بلاک‌شده‌ها',
      recentActivity: 'فعالیت‌های اخیر',
      footer: 'اولین اجرا با حالت آزمایشی امن شروع می‌شود.',
      noActivity: 'هنوز تلاشی برای بلاک انجام نشده.',
      unknownAccount: 'حساب ناشناس',
      recorded: 'ثبت‌شده',
      removeFilter: 'حذف فیلتر {filter}',
      duplicateFilter: 'این فیلتر از قبل وجود دارد.',
      filterLimit: 'حداکثر ۱۰۰ فیلتر قابل افزودن است.',
      circuitPause: 'توقف ایمنی فعال است. بلاک کردن تا {seconds} ثانیه دیگر ادامه پیدا می‌کند.',
      dryRunMatch: 'پیدا شده در حالت آزمایشی',
      uiActionFailed: 'اجرای عملیات ناموفق بود',
      cardLeftPage: 'کارت حساب از صفحه خارج شد',
      moreUnavailable: 'منوی بیشتر در دسترس نیست',
      blockUnavailable: 'گزینه بلاک در دسترس نیست',
      alreadyBlocked: 'از قبل بلاک شده',
      confirmationUnavailable: 'دکمه تأیید در دسترس نیست',
      blocked: 'بلاک شد',
      match: 'تطابق',
      block: 'بلاک',
    },
  });

  const runtime = {
    settings: loadSettings(),
    sessionBlocked: 0,
    checkedHandles: new Set(),
    checkedFingerprints: new Map(),
    matchedHandles: new Map(),
    queuedHandles: new Set(),
    queue: [],
    blockTimestamps: [],
    circuitPausedUntil: 0,
    timerId: null,
    observer: null,
    portalObserver: null,
    observerRoot: null,
    pendingNodes: new Set(),
    scanScheduled: false,
    ui: null,
  };

  function loadSettings() {
    try {
      const saved = GM_getValue(STORAGE_KEY, {});
      const parsed = typeof saved === 'string' ? JSON.parse(saved) : saved;
      const merged = { ...DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) };

      merged.filters = sanitizeFilters(merged.filters);
      merged.language = merged.language === 'fa' ? 'fa' : 'en';
      delete merged.actionDelayMs;
      merged.totalBlocked = Math.max(0, Number(merged.totalBlocked) || 0);
      merged.activityLog = Array.isArray(merged.activityLog)
        ? merged.activityLog.slice(0, 100)
        : [];
      return merged;
    } catch (error) {
      console.warn('[FeedBan] Could not load settings; using defaults.', error);
      return { ...DEFAULTS, filters: [...DEFAULTS.filters], activityLog: [] };
    }
  }

  function saveSettings() {
    try {
      GM_setValue(STORAGE_KEY, runtime.settings);
    } catch (error) {
      console.warn('[FeedBan] Could not persist settings.', error);
    }
  }

  function sanitizeFilters(filters) {
    const seen = new Set();
    return (Array.isArray(filters) ? filters : DEFAULTS.filters)
      .map((value) => String(value).trim())
      .filter((value) => {
        const key = normalizeForMatch(value);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 100);
  }

  function addLog(entry) {
    runtime.settings.activityLog.unshift({
      at: new Date().toISOString(),
      ...entry,
    });
    runtime.settings.activityLog = runtime.settings.activityLog.slice(0, 100);
    saveSettings();
    renderActivity();
  }

  function t(key, variables = {}) {
    const dictionary = I18N[runtime.settings.language] || I18N.en;
    let text = dictionary[key] ?? I18N.en[key] ?? key;
    for (const [name, value] of Object.entries(variables)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
    return text;
  }

  function localizedNumber(value) {
    return Number(value).toLocaleString(runtime.settings.language === 'fa' ? 'fa-IR' : 'en-US');
  }

  function getVazirmatnFontFace() {
    try {
      const resourceUrl = GM_getResourceURL('Vazirmatn');
      if (!resourceUrl) return '';
      return `
        @font-face {
          font-family: "Vazirmatn Variable";
          src: url("${resourceUrl}") format("woff2");
          font-style: normal;
          font-weight: 100 900;
          font-display: swap;
        }
      `;
    } catch (error) {
      console.warn('[FeedBan] Vazirmatn could not be loaded; using a system fallback.', error);
      return '';
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Shadow DOM UI injector
  // ---------------------------------------------------------------------------

  function injectUI() {
    if (document.getElementById(`${APP_ID}-host`)) return;

    const host = document.createElement('div');
    host.id = `${APP_ID}-host`;
    host.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; right: 18px; bottom: 18px;';
    const shadow = host.attachShadow({ mode: 'open' });
    const vazirmatnFontFace = getVazirmatnFontFace();

    shadow.innerHTML = `
      <style>
        ${vazirmatnFontFace}
        :host {
          --fb-bg: #ffffff;
          --fb-surface: #f7f9f9;
          --fb-text: #0f1419;
          --fb-muted: #536471;
          --fb-border: #cfd9de;
          --fb-accent: #1d9bf0;
          --fb-danger: #f4212e;
          --fb-warning: #ffd400;
          color-scheme: light dark;
        }
        * { box-sizing: border-box; }
        button, input { font: inherit; }
        button { color: inherit; }
        .panel {
          width: min(350px, calc(100vw - 24px));
          max-height: min(680px, calc(100vh - 36px));
          overflow: hidden auto;
          border: 1px solid var(--fb-border);
          border-radius: 18px;
          background: var(--fb-bg);
          color: var(--fb-text);
          box-shadow: 0 10px 35px rgb(0 0 0 / 24%);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 14px;
          line-height: 1.35;
          text-align: start;
        }
        .panel[dir="rtl"] {
          font-family: "Vazirmatn Variable", Vazirmatn, Tahoma, Arial, sans-serif;
          line-height: 1.55;
        }
        .header {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          padding: 10px 12px 10px 16px;
          background: var(--fb-bg);
          border-bottom: 1px solid var(--fb-border);
        }
        .title { font-size: 17px; font-weight: 800; letter-spacing: -.2px; }
        .header-actions { display: flex; align-items: center; gap: 7px; }
        .language-toggle {
          direction: ltr;
          min-width: 38px;
          height: 30px;
          padding: 0 9px;
          border: 1px solid var(--fb-border);
          border-radius: 999px;
          background: transparent;
          color: var(--fb-accent);
          font-weight: 800;
          cursor: pointer;
        }
        .language-toggle:hover { background: var(--fb-surface); }
        .icon-button {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 0;
          border-radius: 999px;
          background: var(--fb-surface);
          cursor: pointer;
        }
        .icon-button:hover { background: var(--fb-border); }
        .body { padding: 14px 16px 16px; }
        .panel.collapsed { width: auto; border-radius: 999px; overflow: hidden; }
        .panel.collapsed .header { gap: 8px; border: 0; padding: 7px 8px 7px 14px; }
        .panel.collapsed .body, .panel.collapsed .title-long { display: none; }
        .section { margin-top: 16px; }
        .section:first-child { margin-top: 0; }
        .row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .label { font-weight: 700; }
        .hint { margin-top: 3px; color: var(--fb-muted); font-size: 12px; }
        .switch { position: relative; display: inline-flex; flex: 0 0 auto; }
        .switch input { position: absolute; opacity: 0; pointer-events: none; }
        .track {
          position: relative;
          width: 46px;
          height: 26px;
          border-radius: 999px;
          background: var(--fb-border);
          cursor: pointer;
          transition: background .18s ease;
        }
        .track::after {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px rgb(0 0 0 / 35%);
          content: "";
          transition: transform .18s ease;
        }
        .switch input:checked + .track { background: var(--fb-accent); }
        .switch input:checked + .track::after { transform: translateX(20px); }
        .panel[dir="rtl"] .track::after { right: 3px; left: auto; }
        .panel[dir="rtl"] .switch input:checked + .track::after { transform: translateX(-20px); }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 9px;
        }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 100%;
          padding: 5px 7px 5px 10px;
          border: 1px solid var(--fb-border);
          border-radius: 999px;
          background: var(--fb-surface);
        }
        .chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .chip-remove {
          display: grid;
          width: 19px;
          height: 19px;
          place-items: center;
          border: 0;
          border-radius: 50%;
          background: transparent;
          color: var(--fb-muted);
          cursor: pointer;
        }
        .chip-remove:hover { background: var(--fb-border); color: var(--fb-danger); }
        .add-filter { display: flex; gap: 7px; margin-top: 9px; }
        .text-input {
          min-width: 0;
          flex: 1;
          padding: 8px 10px;
          border: 1px solid var(--fb-border);
          border-radius: 9px;
          outline: none;
          background: var(--fb-bg);
          color: var(--fb-text);
        }
        .text-input:focus { border-color: var(--fb-accent); box-shadow: 0 0 0 1px var(--fb-accent); }
        .primary-button {
          border: 0;
          border-radius: 9px;
          padding: 8px 13px;
          background: var(--fb-accent);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .metric { padding: 10px; border-radius: 11px; background: var(--fb-surface); }
        .metric-value { display: block; font-size: 20px; font-weight: 800; }
        .metric-label { color: var(--fb-muted); font-size: 11px; }
        .banner {
          display: none;
          margin-bottom: 12px;
          padding: 9px 10px;
          border: 1px solid color-mix(in srgb, var(--fb-warning) 55%, var(--fb-border));
          border-radius: 10px;
          background: color-mix(in srgb, var(--fb-warning) 18%, var(--fb-bg));
          font-size: 12px;
        }
        .banner.visible { display: block; }
        details { border-top: 1px solid var(--fb-border); padding-top: 11px; }
        summary { color: var(--fb-muted); font-size: 12px; font-weight: 700; cursor: pointer; }
        .activity { max-height: 130px; margin-top: 8px; overflow: auto; }
        .activity-item {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          padding: 5px 0;
          border-bottom: 1px solid var(--fb-border);
          font-size: 12px;
        }
        .activity-item:last-child { border: 0; }
        .activity-result { color: var(--fb-muted); text-align: end; }
        .empty { padding: 7px 0; color: var(--fb-muted); font-size: 12px; }
        .footer { margin-top: 12px; color: var(--fb-muted); font-size: 11px; text-align: center; }
        :focus-visible { outline: 2px solid var(--fb-accent); outline-offset: 2px; }
      </style>
      <section class="panel" aria-label="FeedBan controls">
        <header class="header">
          <div class="title"><span data-i18n="title">FeedBan</span> <span class="title-long">🛡️</span></div>
          <div class="header-actions">
            <button class="language-toggle" type="button" aria-label="Switch to Persian" title="Switch to Persian">فا</button>
            <button class="icon-button collapse" type="button" aria-label="Minimize FeedBan" title="Minimize">−</button>
          </div>
        </header>
        <div class="body">
          <div class="banner" role="status" aria-live="polite"></div>

          <div class="section row">
            <div>
              <div class="label" data-i18n="automaticScanning">Automatic scanning</div>
              <div class="hint master-state">FeedBan is on</div>
            </div>
            <label class="switch master-switch" title="Pause or resume FeedBan">
              <input class="master-toggle" type="checkbox">
              <span class="track"></span>
            </label>
          </div>

          <div class="section row">
            <div>
              <div class="label" data-i18n="dryRun">Test / Dry Run</div>
              <div class="hint" data-i18n="dryRunHint">Highlight matches without blocking</div>
            </div>
            <label class="switch dry-switch" title="Toggle dry-run mode">
              <input class="dry-toggle" type="checkbox">
              <span class="track"></span>
            </label>
          </div>

          <div class="section">
            <div class="label" data-i18n="filters">Filters</div>
            <div class="hint" data-i18n="filtersHint">Literal, case-insensitive text and emoji matching</div>
            <div class="chips"></div>
            <form class="add-filter">
              <input class="text-input filter-input" type="text" maxlength="80"
                aria-label="New filter" placeholder="Emoji or phrase…" autocomplete="off">
              <button class="primary-button" type="submit" data-i18n="add">Add</button>
            </form>
          </div>

          <div class="section metrics">
            <div class="metric">
              <span class="metric-value session-count">0</span>
              <span class="metric-label" data-i18n="blockedSession">Blocked this session</span>
            </div>
            <div class="metric">
              <span class="metric-value total-count">0</span>
              <span class="metric-label" data-i18n="totalBlocked">Total blocked</span>
            </div>
          </div>

          <div class="section">
            <details>
              <summary data-i18n="recentActivity">Recent activity</summary>
              <div class="activity"></div>
            </details>
          </div>

          <div class="footer" data-i18n="footer">First install starts in safe dry-run mode.</div>
        </div>
      </section>
    `;

    document.documentElement.appendChild(host);

    const $ = (selector) => shadow.querySelector(selector);
    runtime.ui = {
      host,
      shadow,
      panel: $('.panel'),
      languageToggle: $('.language-toggle'),
      collapse: $('.collapse'),
      masterSwitch: $('.master-switch'),
      masterToggle: $('.master-toggle'),
      masterState: $('.master-state'),
      drySwitch: $('.dry-switch'),
      dryToggle: $('.dry-toggle'),
      chips: $('.chips'),
      filterForm: $('.add-filter'),
      filterInput: $('.filter-input'),
      sessionCount: $('.session-count'),
      totalCount: $('.total-count'),
      banner: $('.banner'),
      activity: $('.activity'),
    };

    bindUIEvents();
    renderUI();
    updateTheme();
  }

  function bindUIEvents() {
    const ui = runtime.ui;

    ui.languageToggle.addEventListener('click', () => {
      runtime.settings.language = runtime.settings.language === 'fa' ? 'en' : 'fa';
      saveSettings();
      runtime.ui.banner.classList.remove('visible');
      renderUI();
    });

    ui.collapse.addEventListener('click', () => {
      runtime.settings.collapsed = !runtime.settings.collapsed;
      saveSettings();
      renderUI();
    });

    ui.masterToggle.addEventListener('change', () => {
      runtime.settings.enabled = ui.masterToggle.checked;
      saveSettings();
      renderUI();
      if (runtime.settings.enabled) {
        clearScanCache();
        attachTargetedObserver();
        if (runtime.observerRoot) scanNode(runtime.observerRoot);
        scheduleQueue();
      }
    });

    ui.dryToggle.addEventListener('change', () => {
      runtime.settings.dryRun = ui.dryToggle.checked;
      runtime.queue.length = 0;
      runtime.queuedHandles.clear();
      clearScanCache();
      clearHighlights();
      saveSettings();
      renderUI();
      if (runtime.settings.enabled) {
        attachTargetedObserver();
        if (runtime.observerRoot) scanNode(runtime.observerRoot);
      }
    });

    ui.filterForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const value = ui.filterInput.value.trim();
      if (!value) return;

      const key = normalizeForMatch(value);
      const duplicate = runtime.settings.filters.some((item) => normalizeForMatch(item) === key);
      if (!duplicate && runtime.settings.filters.length < 100) {
        runtime.settings.filters.push(value);
        ui.filterInput.value = '';
        onFiltersChanged();
      } else {
        showBanner(t(duplicate ? 'duplicateFilter' : 'filterLimit'), 3500);
      }
    });

    ui.chips.addEventListener('click', (event) => {
      const button = event.target.closest('[data-filter-index]');
      if (!button) return;
      runtime.settings.filters.splice(Number(button.dataset.filterIndex), 1);
      onFiltersChanged();
    });

  }

  function onFiltersChanged() {
    runtime.queue.length = 0;
    runtime.queuedHandles.clear();
    clearScanCache();
    clearHighlights();
    saveSettings();
    renderFilters();
    if (runtime.settings.enabled) {
      attachTargetedObserver();
      if (runtime.observerRoot) scanNode(runtime.observerRoot);
    }
  }

  function renderUI() {
    if (!runtime.ui) return;
    const { settings } = runtime;
    const ui = runtime.ui;

    applyLanguage();
    ui.panel.classList.toggle('collapsed', settings.collapsed);
    ui.collapse.textContent = settings.collapsed ? '+' : '−';
    ui.collapse.setAttribute('aria-label', t(settings.collapsed ? 'expand' : 'minimize'));
    ui.collapse.title = t(settings.collapsed ? 'expand' : 'minimize');
    ui.masterToggle.checked = settings.enabled;
    ui.masterState.textContent = t(settings.enabled ? 'enabled' : 'paused');
    ui.dryToggle.checked = settings.dryRun;
    ui.sessionCount.textContent = localizedNumber(runtime.sessionBlocked);
    ui.totalCount.textContent = localizedNumber(settings.totalBlocked);
    renderFilters();
    renderActivity();
    renderCircuitState();
  }

  function applyLanguage() {
    const ui = runtime.ui;
    const isPersian = runtime.settings.language === 'fa';
    const direction = isPersian ? 'rtl' : 'ltr';

    ui.panel.dir = direction;
    ui.panel.lang = isPersian ? 'fa' : 'en';
    ui.panel.setAttribute('aria-label', t('panelLabel'));
    ui.host.setAttribute('dir', direction);

    ui.shadow.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });

    ui.languageToggle.textContent = isPersian ? 'EN' : 'فا';
    ui.languageToggle.setAttribute('aria-label', t('switchLanguage'));
    ui.languageToggle.title = t('switchLanguage');
    ui.masterSwitch.title = t('automaticSwitch');
    ui.drySwitch.title = t('dryRunSwitch');
    ui.filterInput.placeholder = t('filterPlaceholder');
    ui.filterInput.setAttribute('aria-label', t('newFilter'));
  }

  function renderFilters() {
    if (!runtime.ui) return;
    runtime.ui.chips.replaceChildren(...runtime.settings.filters.map((filter, index) => {
      const chip = document.createElement('span');
      chip.className = 'chip';

      const text = document.createElement('span');
      text.className = 'chip-text';
      text.textContent = filter;
      text.title = filter;

      const remove = document.createElement('button');
      remove.className = 'chip-remove';
      remove.type = 'button';
      remove.dataset.filterIndex = String(index);
      remove.setAttribute('aria-label', t('removeFilter', { filter }));
      remove.textContent = '×';

      chip.append(text, remove);
      return chip;
    }));
  }

  function renderActivity() {
    if (!runtime.ui) return;
    const items = runtime.settings.activityLog.slice(0, 15);
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = t('noActivity');
      runtime.ui.activity.replaceChildren(empty);
      return;
    }

    runtime.ui.activity.replaceChildren(...items.map((item) => {
      const row = document.createElement('div');
      row.className = 'activity-item';

      const handle = document.createElement('span');
      handle.textContent = item.handle ? `@${item.handle}` : t('unknownAccount');
      handle.dir = 'ltr';

      const result = document.createElement('span');
      result.className = 'activity-result';
      result.textContent = translateActivityText(item.result || item.action);
      result.title = new Date(item.at).toLocaleString(runtime.settings.language === 'fa' ? 'fa-IR' : 'en-US');

      row.append(handle, result);
      return row;
    }));
  }

  function translateActivityText(value) {
    const keys = {
      'Dry-run match': 'dryRunMatch',
      'UI action failed': 'uiActionFailed',
      'Account card left the page': 'cardLeftPage',
      'More menu unavailable': 'moreUnavailable',
      'Block command unavailable': 'blockUnavailable',
      'Already blocked': 'alreadyBlocked',
      'Confirmation unavailable': 'confirmationUnavailable',
      Blocked: 'blocked',
      match: 'match',
      block: 'block',
    };
    return value ? t(keys[value] || value) : t('recorded');
  }

  function showBanner(message, durationMs = 0, kind = 'temporary') {
    if (!runtime.ui) return;
    runtime.ui.banner.textContent = message;
    runtime.ui.banner.dataset.kind = kind;
    runtime.ui.banner.classList.add('visible');
    if (durationMs > 0) {
      const expected = message;
      window.setTimeout(() => {
        if (runtime.ui?.banner.textContent === expected && runtime.ui.banner.dataset.kind === kind
          && Date.now() >= runtime.circuitPausedUntil) {
          runtime.ui.banner.classList.remove('visible');
        }
      }, durationMs);
    }
  }

  function renderCircuitState() {
    if (!runtime.ui) return;
    const remaining = runtime.circuitPausedUntil - Date.now();
    if (remaining > 0) {
      showBanner(t('circuitPause', {
        seconds: localizedNumber(Math.ceil(remaining / 1000)),
      }), 0, 'circuit');
    } else if (runtime.ui.banner.dataset.kind === 'circuit') {
      runtime.ui.banner.classList.remove('visible');
    }
  }

  function updateTheme() {
    if (!runtime.ui) return;
    const bodyColor = parseRgb(getComputedStyle(document.body || document.documentElement).backgroundColor);
    const luminance = bodyColor ? relativeLuminance(bodyColor) : 1;
    const root = runtime.ui.host;

    if (luminance < 0.04) {
      setTheme(root, '#000000', '#16181c', '#e7e9ea', '#71767b', '#2f3336');
    } else if (luminance < 0.35) {
      setTheme(root, '#15202b', '#1e2732', '#f7f9f9', '#8b98a5', '#38444d');
    } else {
      setTheme(root, '#ffffff', '#f7f9f9', '#0f1419', '#536471', '#cfd9de');
    }
  }

  function setTheme(element, bg, surface, text, muted, border) {
    element.style.setProperty('--fb-bg', bg);
    element.style.setProperty('--fb-surface', surface);
    element.style.setProperty('--fb-text', text);
    element.style.setProperty('--fb-muted', muted);
    element.style.setProperty('--fb-border', border);
  }

  function parseRgb(value) {
    const match = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    return match ? match.slice(1, 4).map(Number) : null;
  }

  function relativeLuminance([red, green, blue]) {
    const [r, g, b] = [red, green, blue].map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // ---------------------------------------------------------------------------
  // 3. Unicode-aware emoji/text matching engine
  // ---------------------------------------------------------------------------

  function normalizeForMatch(value) {
    return String(value)
      .normalize('NFKC')
      .replace(/\uFE0F/gu, '')
      .toLocaleLowerCase();
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function findMatch(values) {
    const haystack = normalizeForMatch(values.filter(Boolean).join('\n'));
    if (!haystack) return null;

    for (const filter of runtime.settings.filters) {
      const normalizedFilter = normalizeForMatch(filter);
      if (!normalizedFilter) continue;
      const matcher = new RegExp(escapeRegExp(normalizedFilter), 'iu');
      if (matcher.test(haystack)) return filter;
    }
    return null;
  }

  function extractCandidate(node) {
    const root = resolveCandidateRoot(node);
    if (!root || root.closest(`#${APP_ID}-host`)) return null;

    const userNameNode = root.matches(SELECTORS.userName)
      ? root
      : root.querySelector(SELECTORS.userName);
    const bioNodes = [...root.querySelectorAll(SELECTORS.bio)];
    const handle = extractHandle(userNameNode || root);
    if (!handle) return null;

    const displayName = extractDisplayName(userNameNode, handle);
    const bios = bioNodes.map(extractTextWithRenderedEmoji).filter(Boolean);
    const fingerprint = normalizeForMatch([displayName, ...bios].join('\n'));

    return {
      handle,
      displayName,
      bios,
      fingerprint,
      root,
      userNameNode,
    };
  }

  function resolveCandidateRoot(node) {
    if (!(node instanceof Element)) return null;
    if (node.matches('[data-testid="UserCell"], [data-testid="tweet"], [data-testid="cellInner"]')) {
      return node;
    }
    return node.closest('[data-testid="UserCell"], [data-testid="tweet"], [data-testid="cellInner"]')
      || node;
  }

  function extractHandle(root) {
    if (!root) return null;
    const textMatch = root.textContent?.match(/@([A-Za-z0-9_]{1,15})\b/);
    if (textMatch) return textMatch[1];

    for (const anchor of root.querySelectorAll?.('a[href]') || []) {
      const firstSegment = new URL(anchor.href, location.origin).pathname.split('/').filter(Boolean)[0];
      if (
        firstSegment
        && /^[A-Za-z0-9_]{1,15}$/.test(firstSegment)
        && !RESERVED_PATHS.has(firstSegment.toLocaleLowerCase())
      ) {
        return firstSegment;
      }
    }
    return null;
  }

  function extractDisplayName(userNameNode, handle) {
    if (!userNameNode) return '';
    const lines = extractTextWithRenderedEmoji(userNameNode)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return lines
      .filter((line) => line !== `@${handle}` && !line.startsWith('@'))
      .join('\n');
  }

  function extractTextWithRenderedEmoji(element) {
    if (!element) return '';

    const visibleText = element.innerText || element.textContent || '';
    const renderedEmoji = [
      ...element.querySelectorAll('img[alt], [aria-label]'),
    ]
      .map((node) => node.getAttribute('alt') || node.getAttribute('aria-label') || '')
      .filter((label) => containsEmojiCodePoint(label));

    return [visibleText, ...renderedEmoji]
      .map((value) => value.trim())
      .filter(Boolean)
      .join('\n');
  }

  function containsEmojiCodePoint(value) {
    return /[\u{1F000}-\u{1FAFF}\u{1F1E6}-\u{1F1FF}\u{2300}-\u{23FF}\u{2600}-\u{27BF}]/u.test(value);
  }

  // ---------------------------------------------------------------------------
  // 4. DOM mutation observer & scan queue
  // ---------------------------------------------------------------------------

  function startScanner() {
    ensurePageHighlightStyle();
    attachTargetedObserver();
    window.setInterval(() => {
      attachTargetedObserver();
      updateTheme();
      renderCircuitState();
    }, 1000);
  }

  function attachTargetedObserver() {
    const target = document.querySelector(SELECTORS.scanRoot);
    if (!target || target === runtime.observerRoot) return;

    runtime.observer?.disconnect();
    runtime.observerRoot = target;
    runtime.observer = new MutationObserver((mutations) => {
      if (!runtime.settings.enabled) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) queuePendingNode(node);
        }
      }
      schedulePendingScan();
    });
    runtime.observer.observe(target, { childList: true, subtree: true });
    scanNode(target);
    attachPortalObserver();
  }

  function attachPortalObserver() {
    if (runtime.portalObserver || !document.body) return;
    const userCardSelector = '[data-testid="UserCell"], [data-testid="UserName"], [data-testid="UserDescription"]';

    runtime.portalObserver = new MutationObserver((mutations) => {
      if (!runtime.settings.enabled) return;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element) || runtime.observerRoot?.contains(node)) continue;
          if (node.matches(userCardSelector) || node.querySelector(userCardSelector)) {
            queuePendingNode(node);
          }
        }
      }
      schedulePendingScan();
    });
    runtime.portalObserver.observe(document.body, { childList: true, subtree: true });
  }

  function queuePendingNode(node) {
    for (const pending of runtime.pendingNodes) {
      if (pending.contains(node)) return;
      if (node.contains(pending)) runtime.pendingNodes.delete(pending);
    }
    runtime.pendingNodes.add(node);
  }

  function schedulePendingScan() {
    if (runtime.scanScheduled) return;
    runtime.scanScheduled = true;
    const run = () => {
      runtime.scanScheduled = false;
      const nodes = [...runtime.pendingNodes];
      runtime.pendingNodes.clear();
      for (const node of nodes) scanNode(node);
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(run, { timeout: 750 });
    } else {
      window.setTimeout(run, 100);
    }
  }

  function scanNode(node) {
    if (!runtime.settings.enabled || !(node instanceof Element)) return;
    const candidates = [];
    if (node.matches(SELECTORS.candidate)) candidates.push(node);
    candidates.push(...node.querySelectorAll(SELECTORS.candidate));

    for (const candidateNode of new Set(candidates)) {
      evaluateCandidate(candidateNode);
    }
  }

  function evaluateCandidate(node) {
    const candidate = extractCandidate(node);
    if (!candidate) return;

    const previousFingerprint = runtime.checkedFingerprints.get(candidate.handle);
    if (runtime.checkedHandles.has(candidate.handle) && previousFingerprint === candidate.fingerprint) {
      const cachedMatch = runtime.matchedHandles.get(candidate.handle);
      if (cachedMatch?.fingerprint === candidate.fingerprint) {
        markMatch(candidate.root, cachedMatch.filter);
      }
      return;
    }
    runtime.checkedHandles.add(candidate.handle);
    runtime.checkedFingerprints.set(candidate.handle, candidate.fingerprint);

    const matchedFilter = findMatch([candidate.displayName, ...candidate.bios]);
    if (!matchedFilter) {
      runtime.matchedHandles.delete(candidate.handle);
      return;
    }

    runtime.matchedHandles.set(candidate.handle, {
      fingerprint: candidate.fingerprint,
      filter: matchedFilter,
    });
    markMatch(candidate.root, matchedFilter);
    if (runtime.settings.dryRun) {
      addLogOncePerFingerprint(candidate, matchedFilter, 'Dry-run match');
      return;
    }

    enqueueBlock(candidate, matchedFilter);
  }

  function addLogOncePerFingerprint(candidate, filter, result) {
    const key = `${candidate.handle}\0${candidate.fingerprint}\0${filter}`;
    const recentlyLogged = runtime.settings.activityLog.some((item) => item.key === key && item.result === result);
    if (!recentlyLogged) addLog({ key, handle: candidate.handle, filter, action: 'match', result });
  }

  function enqueueBlock(candidate, matchedFilter) {
    if (runtime.queuedHandles.has(candidate.handle)) return;
    runtime.queuedHandles.add(candidate.handle);
    runtime.queue.push({ ...candidate, matchedFilter });
    scheduleQueue();
  }

  function clearScanCache() {
    runtime.checkedHandles.clear();
    runtime.checkedFingerprints.clear();
    runtime.matchedHandles.clear();
  }

  function ensurePageHighlightStyle() {
    if (document.getElementById(`${APP_ID}-page-style`)) return;
    const style = document.createElement('style');
    style.id = `${APP_ID}-page-style`;
    style.textContent = `
      [data-feedban-match="true"] {
        outline: 3px solid #ffd400 !important;
        outline-offset: -3px !important;
        background: rgb(244 33 46 / 10%) !important;
      }
    `;
    document.head.appendChild(style);
  }

  function markMatch(element, filter) {
    element.dataset.feedbanMatch = 'true';
    element.dataset.feedbanFilter = filter;
    element.title ||= `FeedBan match: ${filter}`;
  }

  function clearHighlights() {
    document.querySelectorAll('[data-feedban-match]').forEach((element) => {
      delete element.dataset.feedbanMatch;
      delete element.dataset.feedbanFilter;
      if (element.title?.startsWith('FeedBan match:')) element.removeAttribute('title');
    });
  }

  // ---------------------------------------------------------------------------
  // 5. UI-driven block controller and rate-limit circuit breaker
  // ---------------------------------------------------------------------------

  function scheduleQueue() {
    if (runtime.timerId || !runtime.queue.length || !runtime.settings.enabled || runtime.settings.dryRun) {
      return;
    }

    const waitForCircuit = Math.max(0, runtime.circuitPausedUntil - Date.now());
    const delay = Math.max(FIXED_ACTION_DELAY_MS, waitForCircuit);
    runtime.timerId = window.setTimeout(async () => {
      runtime.timerId = null;
      if (!runtime.settings.enabled || runtime.settings.dryRun) return;

      if (Date.now() < runtime.circuitPausedUntil) {
        renderCircuitState();
        scheduleQueue();
        return;
      }

      const job = runtime.queue.shift();
      if (!job) return;

      try {
        const result = await blockThroughVisibleUI(job);
        if (result.ok) {
          recordSuccessfulBlock(job);
        } else {
          addLog({
            handle: job.handle,
            filter: job.matchedFilter,
            action: 'block',
            result: result.reason,
          });
        }
      } catch (error) {
        console.warn(`[FeedBan] Block attempt failed for @${job.handle}.`, error);
        addLog({
          handle: job.handle,
          filter: job.matchedFilter,
          action: 'block',
          result: 'UI action failed',
        });
      } finally {
        runtime.queuedHandles.delete(job.handle);
        scheduleQueue();
      }
    }, delay);
  }

  async function blockThroughVisibleUI(job) {
    if (!job.root.isConnected) return { ok: false, reason: 'Account card left the page' };

    const moreButton = findVisible(job.root.querySelectorAll(SELECTORS.moreButton));
    if (!moreButton) return { ok: false, reason: 'More menu unavailable' };

    moreButton.click();
    const blockItem = await waitForVisible(SELECTORS.blockMenuItem, 2500);
    if (!blockItem) {
      dismissOpenMenu();
      return { ok: false, reason: 'Block command unavailable' };
    }

    const menuText = normalizeForMatch(blockItem.textContent || '');
    if (menuText.includes('unblock')) {
      dismissOpenMenu();
      return { ok: false, reason: 'Already blocked' };
    }

    blockItem.click();
    const confirmButton = await waitForVisible(SELECTORS.confirmButton, 2500);
    if (!confirmButton) {
      dismissOpenMenu();
      return { ok: false, reason: 'Confirmation unavailable' };
    }

    confirmButton.click();
    await wait(350);
    return { ok: true };
  }

  function recordSuccessfulBlock(job) {
    const now = Date.now();
    runtime.sessionBlocked += 1;
    runtime.settings.totalBlocked += 1;
    runtime.blockTimestamps.push(now);
    runtime.blockTimestamps = runtime.blockTimestamps.filter((timestamp) => now - timestamp <= 60_000);

    addLog({
      handle: job.handle,
      filter: job.matchedFilter,
      action: 'block',
      result: 'Blocked',
    });
    renderUI();

    if (runtime.blockTimestamps.length > 20) {
      runtime.circuitPausedUntil = now + 120_000;
      runtime.blockTimestamps = [];
      renderCircuitState();
    }
  }

  function findVisible(elements) {
    return [...elements].find((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }) || null;
  }

  async function waitForVisible(selector, timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const found = findVisible(document.querySelectorAll(selector));
      if (found) return found;
      await wait(80);
    }
    return null;
  }

  function dismissOpenMenu() {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
    }));
  }

  function wait(milliseconds) {
    return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  function bootstrap() {
    injectUI();
    startScanner();

    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style'],
    });

    console.info('[FeedBan] Ready.', {
      enabled: runtime.settings.enabled,
      dryRun: runtime.settings.dryRun,
      filterCount: runtime.settings.filters.length,
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
  } else {
    bootstrap();
  }
})();
