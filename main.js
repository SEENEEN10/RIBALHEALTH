// RIBAL site shell — language toggle, 3-layer product drill-down,
// interactive Assessment form, dual delivery (email + WhatsApp).
(function () {
  'use strict';

  const STORAGE_KEY = 'ribal-lang';
  const PHONE_WA  = '966599343529';
  const EMAIL_TO  = 'dsinai@calx.sa';

  // ============ LANGUAGE ============
  function applyLang(lang) {
    const html = document.documentElement, body = document.body;
    body.classList.remove('lang-ar', 'lang-fr');
    if (lang === 'ar') {
      body.classList.add('lang-ar');
      html.setAttribute('lang', 'ar'); html.setAttribute('dir', 'rtl');
    } else if (lang === 'fr') {
      body.classList.add('lang-fr');
      html.setAttribute('lang', 'fr'); html.setAttribute('dir', 'ltr');
    } else {
      html.setAttribute('lang', 'en'); html.setAttribute('dir', 'ltr');
    }
    if (window.RIBAL_TITLES && window.RIBAL_TITLES[lang]) document.title = window.RIBAL_TITLES[lang];
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      const a = b.dataset.lang === lang;
      b.classList.toggle('active', a); b.setAttribute('aria-pressed', a ? 'true' : 'false');
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}

    const m = document.getElementById('product-modal');
    if (m && m.classList.contains('open')) {
      const slug = m.getAttribute('data-product');
      const layer = m.getAttribute('data-layer') || '2';
      const aspect = m.getAttribute('data-aspect');
      if (layer === 'form' || layer === 'form-success') return;
      if (slug) {
        if (layer === '3' && aspect) renderDashboard(slug, aspect);
        else                          renderCards(slug);
      }
    }
  }
  function initLang() {
    let lang;
    try { lang = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    if (!lang) {
      const docLang = document.documentElement.getAttribute('lang');
      if (docLang && docLang.startsWith('ar')) lang = 'ar';
      else if (docLang && docLang.startsWith('fr')) lang = 'fr';
      else lang = 'en';
    }
    applyLang(lang);
  }
  function bindLang() {
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.addEventListener('click', () => applyLang(b.dataset.lang));
    });
  }
  function bindMenu() {
    const nav = document.querySelector('.nav');
    const btn = document.querySelector('.menu-btn');
    if (!nav || !btn) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('.nav-links a').forEach(a => {
      a.addEventListener('click', () => nav.classList.remove('open'));
    });
  }

  // ============ DOM HELPERS ============
  function el(tag, attrs, ...children) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'html') e.innerHTML = attrs[k];
      else if (k.startsWith('on') && typeof attrs[k] === 'function') e.addEventListener(k.substring(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return e;
  }
  function biling(b) {
    return el('span', null,
      el('span', { class: 'en-only' }, b.en),
      el('span', { class: 'fr-only' }, b.fr != null ? b.fr : b.en),
      el('span', { class: 'ar-only' }, b.ar));
  }

  const UI = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>',
    back:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>',
    up:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>',
    down:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    flat:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
  };

  // ============ ICON GRID ============
  function renderIconGrid() {
    const root = document.getElementById('icon-grid');
    if (!root || !window.RIBAL_PRODUCTS) return;
    root.innerHTML = '';
    for (const p of window.RIBAL_PRODUCTS) {
      const icon = (window.RIBAL_ICONS && window.RIBAL_ICONS[p.iconKey]) || '';
      const tag = p.isLink ? 'a' : 'button';
      const attrs = p.isLink
        ? { class: 'icon-tile', href: p.href || 'contact.html', 'aria-label': p.name.en, 'data-slug': p.slug }
        : { class: 'icon-tile', type: 'button', 'aria-label': p.name.en, 'data-slug': p.slug };
      const tile = el(tag, attrs,
        el('span', { class: 'icon-tile-art', style: p.color ? ('--icon-bg:' + p.color) : '', html: icon }),
        el('span', { class: 'icon-tile-label' }, biling(p.name))
      );
      if (!p.isLink) tile.addEventListener('click', () => openProduct(p.slug));
      root.appendChild(tile);
    }
  }

  // ============ MODAL ============
  function ensureModal() {
    let m = document.getElementById('product-modal');
    if (m) return m;
    m = el('div', { class: 'modal', id: 'product-modal', role: 'dialog', 'aria-modal': 'true' });
    m.addEventListener('click', (e) => { if (e.target === m) closeModal(); });
    document.body.appendChild(m);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    return m;
  }
  function openModal() {
    ensureModal().classList.add('open');
    document.body.classList.add('modal-open');
  }
  function closeModal() {
    const m = document.getElementById('product-modal');
    if (m) m.classList.remove('open');
    document.body.classList.remove('modal-open');
  }
  function openProduct(slug) { renderCards(slug); openModal(); }

  // ============ LAYER 2 — cards ============
  function renderCards(slug) {
    const m = ensureModal();
    const p = (window.RIBAL_PRODUCTS || []).find(x => x.slug === slug);
    if (!p) return;
    m.setAttribute('data-product', slug);
    m.setAttribute('data-layer', '2');
    m.removeAttribute('data-aspect');

    const icon = (window.RIBAL_ICONS && window.RIBAL_ICONS[p.iconKey]) || '';
    const head = el('div', { class: 'modal-head' },
      el('div', { class: 'modal-head-left' },
        el('span', { class: 'modal-icon', html: icon }),
        el('div', null,
          el('div', { class: 'modal-eyebrow' }, biling(p.chips[0] || { en: 'Product', fr: 'Produit', ar: 'منتج' })),
          el('h2', null, biling(p.name)),
          el('p',  null, biling(p.tagline))
        )
      ),
      el('div', { class: 'modal-head-right' },
        el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Close', onclick: closeModal, html: UI.close })
      )
    );

    function makeCard(aspect, eyebrow, title, body, tint) {
      const card = el('button', { class: `summary-card ${tint || ''}`, type: 'button', 'data-aspect': aspect },
        el('div', { class: 'summary-card-top' },
          el('span', { class: 'tag' }, biling(eyebrow)),
          el('span', { class: 'open-hint', html: UI.arrow })
        ),
        el('h3', null, biling(title)), body
      );
      card.addEventListener('click', () => renderDashboard(slug, aspect));
      return card;
    }

    const card1 = makeCard('overview', { en: 'Overview', fr: 'Aperçu', ar: 'نظرة عامة' }, p.name,
      el('p', null, biling(p.overview.what)));
    const audienceList = el('ul', { class: 'inline-list' },
      ...p.audience.list.slice(0,4).map(a => el('li', null, el('strong', null, biling(a.h)), ' — ', biling(a.p))));
    const card2 = makeCard('audience', { en: "Who it's for", fr: 'À qui ça s\'adresse', ar: 'لمن هو' },
      { en: 'Four primary audiences', fr: 'Quatre publics cibles', ar: 'أربع فئات أساسية' }, audienceList);
    const featStrip = el('ul', { class: 'feature-strip' },
      ...p.features.list.map(f => el('li', null, biling(f.h))));
    const card3 = makeCard('features', { en: 'Key features', fr: 'Fonctionnalités clés', ar: 'أبرز الميزات' },
      { en: 'Three capabilities that compound', fr: 'Trois capacités qui se renforcent', ar: 'ثلاث قدرات تتراكم' }, featStrip, 'mint');
    const proofStats = el('div', { class: 'mini-stats' },
      ...p.proof.stats.map(s => el('div', { class: 'mini-stat' },
        el('div', { class: 'v' }, s.v),
        el('div', { class: 'l' }, biling(s.l)))));
    const card4 = makeCard('proof', { en: 'Proof at scale', fr: 'Résultats à grande échelle', ar: 'إثبات على نطاق واسع' },
      { en: 'Verified, not slideware', fr: 'Validé sur le terrain', ar: 'مُتحقَّق منه' }, proofStats, 'dark');
    const phaseStrip = el('ol', { class: 'phase-strip' },
      ...p.phases.map(ph => el('li', null,
        el('span', { class: 'ph-step' }, 'P' + ph.step),
        el('span', null, biling(ph.h)))));
    const card5 = makeCard('phases', { en: 'How it works', fr: 'Comment ça fonctionne', ar: 'كيف يعمل' },
      { en: 'Three phases', fr: 'Trois phases', ar: 'ثلاث مراحل' }, phaseStrip);
    const pm = p.performance.metrics[0];
    const perfBlock = el('div', { class: 'perf-headline' },
      el('div', { class: 'pv' }, pm.v),
      el('div', { class: 'pl' }, biling(pm.l)));
    const card6 = makeCard('performance', { en: 'Performance', fr: 'Performance', ar: 'الأداء' },
      { en: 'Numbers from the field', fr: 'Chiffres du terrain', ar: 'أرقام من الميدان' }, perfBlock, 'tint');

    const grid = el('div', { class: 'modal-card-grid' }, card1, card2, card3, card4, card5, card6);

    const topCTAs = (slug === 'assessment')
      ? el('div', { class: 'top-cta-strip' },
          el('div', { class: 'top-cta-msg' },
            el('div', { class: 'top-cta-title' }, biling({ en: 'Ready to take the assessment?', fr: 'Prêt à lancer l\'évaluation ?', ar: 'مستعدون للتقييم؟' })),
            el('div', { class: 'top-cta-sub' }, biling({ en: 'Two parts — ~10 minutes online.', fr: 'Deux parties — environ 10 minutes en ligne.', ar: 'جزءان — ١٠ دقائق.' }))),
          el('div', { class: 'top-cta-btns' },
            el('a', { class: 'btn btn-light', href: 'contact.html' }, biling({ en: 'Talk to us first', fr: 'Parlons-en d\'abord', ar: 'تواصل أولًا' })),
            el('button', { class: 'btn btn-primary', type: 'button', onclick: openAssessmentForm },
              biling({ en: '▶︎ Take the Assessment', fr: '▶︎ Lancer l\'évaluation', ar: '▶︎ ابدأ التقييم' }))))
      : null;

    const hint = el('p', { class: 'modal-hint' },
      biling({ en: 'Tap any card to open a detailed dashboard view →', fr: 'Cliquez sur une carte pour ouvrir le tableau de bord détaillé →', ar: '← اضغط على أي بطاقة' }));
    const body = el('div', { class: 'modal-body' }, topCTAs, hint, grid);

    const foot = (slug === 'assessment')
      ? el('div', { class: 'modal-foot' },
          el('button', { class: 'btn btn-light', type: 'button', onclick: closeModal }, biling({ en: 'Close', fr: 'Fermer', ar: 'إغلاق' })),
          el('a', { class: 'btn btn-ghost', href: 'contact.html' }, biling({ en: 'Book a call', fr: 'Réserver un appel', ar: 'احجز' })))
      : el('div', { class: 'modal-foot' },
          el('a', { class: 'btn btn-light',  href: 'contact.html' }, biling({ en: 'Request brochure', fr: 'Demander la brochure', ar: 'اطلب الكُتيّب' })),
          el('a', { class: 'btn btn-primary',href: 'contact.html' }, biling({ en: 'Book Discovery Call', fr: 'Réserver un appel de découverte', ar: 'احجز مكالمة' })));

    const dialog = el('div', { class: 'modal-dialog' }, head, body, foot);
    m.innerHTML = ''; m.appendChild(dialog);
  }

  // ============ LAYER 3 — dashboard ============
  function renderDashboard(slug, aspect) {
    const m = ensureModal();
    const p = (window.RIBAL_PRODUCTS || []).find(x => x.slug === slug);
    if (!p) return;
    m.setAttribute('data-product', slug); m.setAttribute('data-layer', '3'); m.setAttribute('data-aspect', aspect);

    const icon = (window.RIBAL_ICONS && window.RIBAL_ICONS[p.iconKey]) || '';
    const labels = {
      overview: { en: 'Overview', fr: 'Aperçu', ar: 'نظرة عامة' },
      audience: { en: "Who it's for", fr: 'À qui ça s\'adresse', ar: 'لمن هو' },
      features: { en: 'Key features', fr: 'Fonctionnalités clés', ar: 'أبرز الميزات' },
      proof:    { en: 'Proof at scale', fr: 'Résultats à grande échelle', ar: 'إثبات على نطاق واسع' },
      phases:   { en: 'How it works', fr: 'Comment ça fonctionne', ar: 'كيف يعمل' },
      performance: { en: 'Performance', fr: 'Performance', ar: 'الأداء' },
    };
    const head = el('div', { class: 'modal-head' },
      el('div', { class: 'modal-head-left' },
        el('button', { class: 'modal-back', type: 'button', onclick: () => renderCards(slug), html: UI.back }),
        el('span', { class: 'modal-icon', html: icon }),
        el('div', null,
          el('div', { class: 'modal-eyebrow' }, biling(p.name)),
          el('h2', null, biling(labels[aspect] || { en: 'Detail', fr: 'Détail', ar: 'تفاصيل' })))),
      el('div', { class: 'modal-head-right' },
        el('button', { class: 'modal-close', type: 'button', onclick: closeModal, html: UI.close })));

    const body = el('div', { class: 'modal-body' });
    if (aspect === 'overview')     body.appendChild(buildOverview(p));
    else if (aspect === 'audience') body.appendChild(buildAudience(p));
    else if (aspect === 'features') body.appendChild(buildFeatures(p));
    else if (aspect === 'proof')    body.appendChild(buildProof(p));
    else if (aspect === 'phases')   body.appendChild(buildPhases(p));
    else if (aspect === 'performance') body.appendChild(buildPerformance(p));

    const foot = el('div', { class: 'modal-foot' },
      el('button', { class: 'btn btn-light', type: 'button', onclick: () => renderCards(slug) },
        biling({ en: '← Back to cards', fr: '← Retour aux cartes', ar: 'عودة للبطاقات →' })),
      el('a', { class: 'btn btn-primary', href: 'contact.html' }, biling({ en: 'Book Discovery Call', fr: 'Réserver un appel de découverte', ar: 'احجز مكالمة' })));

    const dialog = el('div', { class: 'modal-dialog' }, head, body, foot);
    m.innerHTML = ''; m.appendChild(dialog);
  }

  function dashGrid(...kids){return el('div',{class:'dash-grid'},...kids)}
  function tile(cls,...kids){return el('div',{class:'dash-tile '+(cls||'')},...kids)}

  function buildOverview(p) {
    const kpis = el('div', { class: 'dash-kpis' },
      ...p.overview.kpis.map(k => el('div',{class:'dash-kpi'},
        el('div',{class:'k-v'},k.v), el('div',{class:'k-l'}, biling(k.l)))));
    const wide = tile('span-2',
      el('h4', null, biling({en:'About', fr:'À propos', ar:'عن المنتج'})),
      el('p', { class: 'lede' }, biling(p.overview.what)));
    const chips = tile('',
      el('h4', null, biling({en:'Positioning', fr:'Positionnement', ar:'التموضع'})),
      el('div', { class: 'chip-row' },
        ...p.chips.map(c => el('span',{class:'chip-sm '+(c.tone||'')}, biling(c)))),
      el('p', null, biling(p.tagline)));
    return dashGrid(el('div',{class:'span-3'},kpis), wide, chips);
  }
  function buildAudience(p) {
    return dashGrid(...p.audience.list.map((a,i) => tile('',
      el('div',{class:'tile-num'}, String(i+1).padStart(2,'0')),
      el('h3', null, biling(a.h)),
      el('p',  null, biling(a.p)),
      el('span',{class:'tile-tag'}, biling({en:'Primary fit', fr:'Cible prioritaire', ar:'ملاءمة أساسية'})))));
  }
  function buildFeatures(p) {
    return el('div', { class:'feat-stack' },
      ...p.features.list.map((f,i) => el('div', {class:'feat-row'},
        el('div',{class:'feat-num'}, String(i+1).padStart(2,'0')),
        el('div',{class:'feat-body'},
          el('h3', null, biling(f.h)),
          el('p',  null, biling(f.p)),
          el('ul',{class:'feat-bullets'}, ...(f.sub||[]).map(s => el('li', null, biling(s))))))));
  }
  function buildProof(p) {
    const stats = p.proof.stats || [];
    const wide = tile('span-3 dark',
      el('h4', null, biling({en:'Proof at scale', fr:'Résultats à grande échelle', ar:'إثبات على نطاق واسع'})),
      el('p', { class: 'lede' }, biling(p.proof.summary)));
    return dashGrid(wide, ...stats.map(s => tile('',
      el('div',{class:'stat-big'}, s.v),
      el('div',{class:'stat-lbl'}, biling(s.l)))));
  }
  function buildPhases(p) {
    return el('div', {class:'phase-track'},
      ...p.phases.map(ph => el('div',{class:'phase-step'},
        el('div',{class:'phase-marker'},
          el('span',{class:'phase-marker-num'}, String(ph.step)),
          el('span',{class:'phase-marker-line'})),
        el('div',{class:'phase-content'},
          el('div',{class:'phase-when'}, biling(ph.when)),
          el('h3', null, biling(ph.h)),
          el('p',  null, biling(ph.p)),
          el('div',{class:'phase-deliv'},
            el('span',{class:'lbl'}, biling({en:'Deliverable', fr:'Livrable', ar:'المُخرج'})),
            biling(ph.deliv))))));
  }
  function buildPerformance(p) {
    const kpiRow = el('div',{class:'dash-kpis kpi-row-4'},
      ...p.performance.metrics.map(m => {
        const ic = m.t==='up' ? UI.up : m.t==='down' ? UI.down : UI.flat;
        return el('div',{class:'dash-kpi trend-'+(m.t||'flat')},
          el('div',{class:'k-trend', html: ic}),
          el('div',{class:'k-v'}, m.v),
          el('div',{class:'k-l'}, biling(m.l)));
      }));
    const barBlock = el('div',{class:'dash-bars'},
      el('h4', null, biling({en:'Capability coverage', fr:'Couverture fonctionnelle', ar:'تغطية القدرات'})),
      ...p.performance.bars.map(b => el('div',{class:'bar-row'},
        el('div',{class:'bar-label'}, biling(b.l)),
        el('div',{class:'bar-track'}, el('div',{class:'bar-fill', style:'width:'+b.pct+'%'})),
        el('div',{class:'bar-pct'}, b.pct+'%'))));
    return el('div',{class:'dash-perf'},
      el('div',{class:'span-3'}, kpiRow),
      el('div',{class:'span-3'}, barBlock));
  }

  // ============ ASSESSMENT FORM ============
  function openAssessmentForm() { renderAssessmentForm(); }
  function renderAssessmentForm() {
    const m = ensureModal();
    m.setAttribute('data-product','assessment'); m.setAttribute('data-layer','form'); m.removeAttribute('data-aspect');
    const icon = (window.RIBAL_ICONS && window.RIBAL_ICONS.assessment) || '';
    const head = el('div',{class:'modal-head'},
      el('div',{class:'modal-head-left'},
        el('button',{class:'modal-back', type:'button', onclick: () => renderCards('assessment'), html: UI.back}),
        el('span',{class:'modal-icon', html: icon}),
        el('div', null,
          el('div',{class:'modal-eyebrow'}, biling({en:'Assessment · interactive form', fr:'Évaluation · formulaire interactif', ar:'تقييم تفاعلي'})),
          el('h2', null, biling({en:'Tell us about your environment', fr:'Parlez-nous de votre environnement', ar:'أخبرنا عن بيئتكم'})))),
      el('div',{class:'modal-head-right'},
        el('button',{class:'modal-close', type:'button', onclick: closeModal, html: UI.close})));
    const body = el('div',{class:'modal-body'}, buildAssessmentForm());
    const dialog = el('div',{class:'modal-dialog asmt-dialog'}, head, body);
    m.innerHTML = ''; m.appendChild(dialog);
  }

  function buildAssessmentForm() {
    const form = el('form', { class:'asmt-form', novalidate:'novalidate' });
    form.addEventListener('submit', handleAssessmentSubmit);

    form.appendChild(asmtCard('01',
      { en:'About you', fr:'Vos coordonnées', ar:'بياناتكم' }, { en:'Required', fr:'Champs obligatoires', ar:'حقول مطلوبة' }, [
      field({ name:'hospital_name', required:true, label:{en:'Hospital / Organization name', fr:'Nom de l\'hôpital ou de l\'établissement', ar:'اسم المستشفى'} }),
      field({ name:'contact_name',  required:true, label:{en:'Your full name', fr:'Votre nom complet', ar:'اسمكم الكامل'} }),
      field({ name:'contact_email', type:'email', required:true, label:{en:'Work email', fr:'Email professionnel', ar:'البريد المهني'} }),
      field({ name:'contact_phone', type:'tel', label:{en:'Phone / WhatsApp', fr:'Téléphone / WhatsApp', ar:'الجوّال / واتساب'} }),
      radioBlock('contact_role', {en:'Your role', fr:'Votre fonction', ar:'منصبكم'}, [
        ['CEO','CEO / GM'], ['CIO','CIO / Head of IT'], ['CMIO','CMIO / Medical Director'],
        ['COO','COO'], ['CFO','CFO'], ['Procurement', {en:'Procurement', fr:'Achats', ar:'المشتريات'}],
        ['IT', {en:'IT manager / engineer', fr:'Responsable / ingénieur informatique', ar:'مدير/مهندس تقنية'}],
        ['Clinical', {en:'Clinical lead', fr:'Responsable clinique', ar:'قائد سريري'}],
        ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ]),
      radioBlock('country', {en:'Country', fr:'Pays', ar:'الدولة'}, [
        ['KSA','Saudi Arabia / المملكة'], ['UAE','UAE / الإمارات'], ['Qatar','Qatar / قطر'],
        ['Bahrain','Bahrain / البحرين'], ['Kuwait','Kuwait / الكويت'], ['Oman','Oman / عُمان'],
        ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ]),
    ]));

    form.appendChild(asmtCard('02',
      { en:'What are you assessing?', fr:'Que souhaitez-vous évaluer ?', ar:'ما الذي تُقيّمونه؟' }, { en:'Tick all that apply', fr:'Cochez tout ce qui s\'applique', ar:'اختر' }, [
      checkBlock('modules', [
        ['HIS', {en:'HIS — Hospital Information System', fr:'HIS — Système d\'information hospitalier', ar:'HIS'}],
        ['PACS', {en:'PACS — imaging archive', fr:'PACS — archivage d\'imagerie', ar:'PACS'}],
        ['LIS', {en:'LIS — laboratory', fr:'LIS — laboratoire', ar:'LIS'}],
        ['ICU', {en:'ICU iVital', fr:'ICU iVital', ar:'iVital'}],
        ['XEye', {en:'X-Eye AI', fr:'X-Eye IA', ar:'X-Eye'}],
        ['Tele', {en:'Tele-radiology', fr:'Télé-radiologie', ar:'الأشعة عن بُعد'}],
        ['Nefro', {en:'TeleDialysis (Nefro)', fr:'Télé-dialyse (Nefro)', ar:'Nefro'}],
        ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ])
    ]));

    form.appendChild(asmtCard('03',
      { en:'Hospital size', fr:'Taille de l\'hôpital', ar:'حجم المستشفى' }, { en:'Pick the closest range', fr:'Choisissez la plage la plus proche', ar:'النطاق الأقرب' }, [
      radioBlock('beds', {en:'Number of beds', fr:'Nombre de lits', ar:'عدد الأسرّة'}, [
        ['<50','Under 50'], ['50-150','50 – 150'], ['150-300','150 – 300'],
        ['300-500','300 – 500'], ['500-1000','500 – 1,000'], ['1000+','1,000+'] ]),
      radioBlock('users', {en:'Users (doctors + nurses + staff)', fr:'Utilisateurs (médecins, soignants, personnel)', ar:'المستخدمون'}, [
        ['<50','Under 50'], ['50-200','50 – 200'], ['200-500','200 – 500'],
        ['500-1500','500 – 1,500'], ['1500+','1,500+'] ]),
      radioBlock('daily_opd', {en:'Daily outpatient volume', fr:'Volume quotidien de consultations externes', ar:'المرضى الخارجيون يوميًا'}, [
        ['<100','Under 100'], ['100-300','100 – 300'], ['300-800','300 – 800'],
        ['800-1500','800 – 1,500'], ['1500+','1,500+'] ]),
      radioBlock('new_build', {en:'Facility status', fr:'État de l\'établissement', ar:'حالة المنشأة'}, [
        ['new', {en:'Newly built', fr:'Nouvelle construction', ar:'جديدة'}],
        ['existing', {en:'Existing, operating', fr:'Existant et en activité', ar:'قائمة وتعمل'}],
        ['expanding', {en:'Expanding / renovating', fr:'Extension ou rénovation', ar:'في توسعة'}] ]),
      checkBlock('departments', [
        ['ED', {en:'Emergency', fr:'Urgences', ar:'الطوارئ'}], ['OPD', {en:'Outpatient', fr:'Consultations externes', ar:'العيادات'}],
        ['IPD', {en:'Inpatient', fr:'Hospitalisation', ar:'التنويم'}], ['Surgery', {en:'Surgery', fr:'Chirurgie', ar:'الجراحة'}],
        ['ICU', {en:'ICU', fr:'Soins intensifs', ar:'العناية'}], ['Maternity', {en:'Maternity', fr:'Maternité', ar:'الولادة'}],
        ['Pediatrics', {en:'Pediatrics', fr:'Pédiatrie', ar:'الأطفال'}], ['Cardiology', {en:'Cardiology', fr:'Cardiologie', ar:'القلب'}],
        ['Oncology', {en:'Oncology', fr:'Oncologie', ar:'الأورام'}], ['Radiology', {en:'Radiology', fr:'Radiologie', ar:'الأشعة'}],
        ['Lab', {en:'Laboratory', fr:'Laboratoire', ar:'المختبر'}], ['Pharmacy', {en:'Pharmacy', fr:'Pharmacie', ar:'الصيدلية'}],
        ['Dental', {en:'Dental', fr:'Dentaire', ar:'الأسنان'}], ['Dialysis', {en:'Dialysis', fr:'Dialyse', ar:'غسيل الكلى'}],
        ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ], {en:'Departments / specialties present', fr:'Services / spécialités présents', ar:'الأقسام'} ),
    ]));

    form.appendChild(asmtCard('04',
      { en:'Existing systems', fr:'Systèmes existants', ar:'الأنظمة الحالية' }, { en:'Pick what you currently run', fr:'Sélectionnez ce que vous utilisez aujourd\'hui', ar:'الأنظمة الحالية' }, [
      radioBlock('current_his', {en:'Current HIS / EMR', fr:'HIS / DPI actuel', ar:'HIS / EMR الحالي'}, [
        ['None', {en:'None', fr:'Aucun', ar:'لا يوجد'}], ['Cerner','Oracle Cerner'], ['Epic','Epic'],
        ['Intersystems','InterSystems TrakCare'], ['Meditech','Meditech'],
        ['Local', {en:'Local Saudi vendor', fr:'Fournisseur local saoudien', ar:'مورّد محلي'}],
        ['InHouse', {en:'In-house / custom-built', fr:'Développement interne', ar:'داخلي'}],
        ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ]),
      radioBlock('current_pacs', {en:'Current PACS', fr:'PACS actuel', ar:'PACS الحالي'}, [
        ['None', {en:'None / using film', fr:'Aucun / encore sur film', ar:'لا يوجد / أفلام'}],
        ['Sectra','Sectra'], ['Fujifilm','Fujifilm Synapse'], ['Agfa','Agfa'],
        ['GE','GE Healthcare'], ['Philips','Philips'], ['Carestream','Carestream'],
        ['Siemens','Siemens Syngo'], ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ]),
      radioBlock('current_lis', {en:'Current LIS', fr:'LIS actuel', ar:'LIS الحالي'}, [
        ['None', {en:'None', fr:'Aucun', ar:'لا يوجد'}], ['CernerLab','Cerner Lab'], ['Sunquest','Sunquest'],
        ['LabWare','LabWare'], ['Sysmex','Sysmex'],
        ['Local', {en:'Local Saudi vendor', fr:'Fournisseur local saoudien', ar:'مورّد محلي'}],
        ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ]),
      radioBlock('data_migration', {en:'Data migration required?', fr:'Migration de données nécessaire ?', ar:'هل ستحتاجون نقل بيانات؟'}, [
        ['yes','Yes'], ['no','No'], ['unsure', {en:'Not sure', fr:'Pas encore décidé', ar:'غير محدّد'}] ]),
      radioBlock('nphies_status', {en:'NPHIES integration', fr:'Intégration NPHIES', ar:'تكامل نفيس'}, [
        ['live', {en:'Already live', fr:'Déjà en production', ar:'مُفعّل'}],
        ['inprogress', {en:'In progress', fr:'En cours', ar:'قيد التنفيذ'}],
        ['planned', {en:'Planned', fr:'Planifié', ar:'مخطّط'}],
        ['na', {en:'N/A', fr:'Non applicable', ar:'لا ينطبق'}] ]),
    ]));

    form.appendChild(asmtCard('05',
      { en:'AI · imaging environment', fr:'IA · environnement d\'imagerie', ar:'بيئة الذكاء والأشعة' }, { en:'For PACS / Tele-rad / X-Eye', fr:'Pour PACS / télé-radiologie / X-Eye', ar:'للأشعة' }, [
      checkBlock('modalities', [
        ['CT', {en:'CT', fr:'Scanner', ar:'مقطعية'}], ['MRI','MRI'], ['XRay','X-Ray'],
        ['Mammography','Mammography'], ['Ultrasound','Ultrasound'],
        ['PET','PET / PET-CT'], ['Fluoroscopy', {en:'Fluoroscopy', fr:'Fluoroscopie', ar:'تنظير ومضي'}],
        ['DentalImg', {en:'Dental imaging', fr:'Imagerie dentaire', ar:'تصوير الأسنان'}],
        ['Other', {en:'Other', fr:'Autre', ar:'أخرى'}] ], {en:'Modalities you operate', fr:'Modalités d\'imagerie utilisées', ar:'الأجهزة'} ),
      radioBlock('daily_exams', {en:'Daily imaging exams', fr:'Examens d\'imagerie par jour', ar:'الفحوصات اليومية'}, [
        ['<50','Under 50'], ['50-200','50 – 200'], ['200-500','200 – 500'],
        ['500-1000','500 – 1,000'], ['1000+','1,000+'] ]),
      radioBlock('radiologists', {en:'Number of radiologists', fr:'Nombre de radiologues', ar:'عدد أطباء الأشعة'}, [
        ['0-2','0 – 2'], ['3-5','3 – 5'], ['6-10','6 – 10'], ['11-20','11 – 20'], ['20+','20+'] ]),
      radioBlock('analog_to_digital', {en:'Analogue equipment to digitize?', fr:'Équipements analogiques à numériser ?', ar:'أجهزة تناظرية للرقمنة؟'}, [
        ['none', {en:'None — all digital', fr:'Aucun — tout est numérique', ar:'لا يوجد'}],
        ['some', {en:'Some', fr:'Quelques-uns', ar:'بعضها'}],
        ['many', {en:'Many', fr:'Beaucoup', ar:'الكثير'}],
        ['unsure', {en:'Not sure', fr:'Pas encore décidé', ar:'غير محدّد'}] ]),
      radioBlock('ai_interest', {en:'AI use cases of interest', fr:'Cas d\'usage IA qui vous intéressent', ar:'حالات الذكاء'}, [
        ['mammo', {en:'Breast / mammography', fr:'Sein / mammographie', ar:'الثدي'}],
        ['chest', {en:'Chest X-Ray / CT', fr:'Radio / scanner thoracique', ar:'الصدر'}],
        ['multi', {en:'Multiple modalities', fr:'Plusieurs modalités', ar:'عدّة أجهزة'}],
        ['screen', {en:'Population screening', fr:'Dépistage de population', ar:'مسح سكاني'}],
        ['exploring', {en:'Just exploring', fr:'En phase exploratoire', ar:'استكشاف'}] ]),
    ]));

    form.appendChild(asmtCard('06',
      { en:'ICU / Lab / Dialysis ranges', fr:'Soins intensifs / Labo / Dialyse — volumes', ar:'العناية والمختبر والغسيل' }, { en:'Skip what does not apply', fr:'Passez ce qui ne s\'applique pas', ar:'تجاوز ما لا ينطبق' }, [
      radioBlock('icu_beds', {en:'ICU beds (total)', fr:'Lits de soins intensifs (total)', ar:'أسرّة العناية'}, [
        ['none', {en:'None', fr:'Aucun', ar:'لا يوجد'}], ['1-10','1 – 10'], ['10-30','10 – 30'],
        ['30-60','30 – 60'], ['60+','60+'] ]),
      radioBlock('icu_paper', {en:'ICU charts today?', fr:'Dossiers de soins intensifs aujourd\'hui ?', ar:'سجلات العناية حاليًا'}, [
        ['paper', {en:'Paper-based', fr:'Sur papier', ar:'ورقية'}],
        ['mixed', {en:'Mixed', fr:'Mixte', ar:'مختلطة'}],
        ['digital', {en:'Already digital', fr:'Déjà numérisés', ar:'رقمية'}],
        ['na', {en:'No ICU', fr:'Pas de soins intensifs', ar:'لا يوجد'}] ]),
      radioBlock('lab_tests_day', {en:'Lab tests per day', fr:'Analyses de laboratoire par jour', ar:'الفحوصات اليومية'}, [
        ['<100','Under 100'], ['100-500','100 – 500'], ['500-2000','500 – 2,000'],
        ['2000-5000','2,000 – 5,000'], ['5000+','5,000+'],
        ['na', {en:'No on-site lab', fr:'Pas de laboratoire sur site', ar:'لا مختبر'}] ]),
      radioBlock('dialysis_devices', {en:'Hemodialysis devices', fr:'Appareils d\'hémodialyse', ar:'أجهزة الغسيل'}, [
        ['none','None'], ['1-10','1 – 10'], ['10-30','10 – 30'],
        ['30-50','30 – 50'], ['50+','50+'] ]),
    ]));

    form.appendChild(asmtCard('07',
      { en:'Timeline & notes', fr:'Calendrier et remarques', ar:'الجدول والملاحظات' }, { en:'Final stretch', fr:'Dernière étape', ar:'الجزء الأخير' }, [
      radioBlock('go_live_target', {en:'Target go-live', fr:'Mise en production visée', ar:'الموعد المستهدف'}, [
        ['asap', {en:'ASAP (under 3 months)', fr:'Le plus tôt possible (moins de 3 mois)', ar:'بأسرع وقت'}],
        ['3-6','3 – 6 months'], ['6-12','6 – 12 months'],
        ['12-24','12 – 24 months'],
        ['strategic', {en:'Strategic / >2 years', fr:'Stratégique / plus de 2 ans', ar:'استراتيجي'}] ]),
      radioBlock('budget_range', {en:'Indicative budget (optional)', fr:'Budget indicatif (optionnel)', ar:'نطاق الميزانية'}, [
        ['na', {en:'Prefer not to say', fr:'Préfère ne pas répondre', ar:'أفضّل عدم الإفصاح'}],
        ['<500k','Under 500k SAR'], ['500k-2m','500k – 2M SAR'],
        ['2m-5m','2M – 5M SAR'], ['5m-10m','5M – 10M SAR'], ['10m+','10M+ SAR'] ]),
      radioBlock('decision_status', {en:'Decision stage', fr:'Étape décisionnelle', ar:'مرحلة القرار'}, [
        ['exploring', {en:'Just exploring', fr:'En phase exploratoire', ar:'استكشاف'}],
        ['shortlist', {en:'Building a shortlist', fr:'Constitution d\'une liste restreinte', ar:'قائمة مختصرة'}],
        ['rfp', {en:'Active RFP', fr:'Appel d\'offres en cours', ar:'مناقصة نشطة'}],
        ['selected', {en:'Vendor selected', fr:'Fournisseur retenu', ar:'اختيار البائع'}] ]),
      field({ name:'notes', type:'textarea', label:{en:'Anything else? (optional)', fr:'Autres remarques ? (optionnel)', ar:'ملاحظات؟'},
              placeholder:'Constraints, must-haves, deal-breakers…' }),
    ]));

    form.appendChild(el('p', { class:'consent center' },
      biling({en:'By submitting, you agree to be contacted by RIBAL about this assessment.',
              fr:'En soumettant ce formulaire, vous acceptez d\'être contacté par RIBAL à propos de cette évaluation.',
              ar:'بالإرسال، توافقون على تواصل ريبال بشأن هذا التقييم.'})));
    form.appendChild(el('div', { class:'asmt-submit-row' },
      el('button', { type:'button', class:'btn btn-light', onclick: () => renderCards('assessment') },
        biling({en:'← Back', fr:'← Retour', ar:'عودة'})),
      el('button', { type:'submit', class:'btn btn-primary' },
        biling({en:'Submit assessment →', fr:'Envoyer l\'évaluation →', ar:'إرسال التقييم'}))));
    return form;
  }

  function asmtCard(num, title, eyebrow, kids) {
    return el('section', { class:'asmt-card' },
      el('div', { class:'asmt-card-head' },
        el('span', { class:'asmt-num' }, num),
        el('div', null,
          el('div', { class:'asmt-eyebrow' }, biling(eyebrow)),
          el('h3', { class:'asmt-title' }, biling(title)))),
      el('div', { class:'asmt-card-body' }, ...kids));
  }
  function field(opts) {
    const id = 'f-' + opts.name;
    const wrap = el('div', { class:'asmt-field' });
    const labelEls = [biling(opts.label)];
    if (opts.required) labelEls.push(el('span', { class:'req' }, ' *'));
    wrap.appendChild(el('label', { for:id }, ...labelEls));
    let input;
    if (opts.type === 'textarea')
      input = el('textarea', { id, name:opts.name, placeholder:opts.placeholder || '' });
    else
      input = el('input', { id, name:opts.name, type:opts.type || 'text', placeholder:opts.placeholder || '' });
    if (opts.required) input.setAttribute('required','required');
    wrap.appendChild(input);
    return wrap;
  }
  function radioBlock(name, label, options) {
    const wrap = el('div', { class:'asmt-block' });
    wrap.appendChild(el('label', { class:'asmt-sublabel', for:'s-'+name }, biling(label)));
    const select = el('select', { id:'s-'+name, name:name, class:'asmt-select' });
    const ph = el('option', { value:'' }, '— Select —');
    ph.setAttribute('disabled','disabled'); ph.setAttribute('selected','selected');
    select.appendChild(ph);
    options.forEach(([val, lbl]) => {
      const text = (typeof lbl === 'string') ? lbl : (lbl.en + ' / ' + lbl.ar);
      select.appendChild(el('option', { value:val }, text));
    });
    wrap.appendChild(select);
    if (options.some(o => o[0] === 'Other')) {
      const ti = el('input', { type:'text', name:name+'_other', class:'asmt-other-input', placeholder:'Please specify…' });
      ti.disabled = true;
      select.addEventListener('change', () => {
        const isOther = select.value === 'Other';
        ti.disabled = !isOther;
        if (isOther) ti.focus();
      });
      wrap.appendChild(ti);
    }
    return wrap;
  }
  function checkBlock(name, options, label) {
    const wrap = el('div', { class:'asmt-block' });
    if (label) wrap.appendChild(el('label', { class:'asmt-sublabel', for:'m-'+name },
      biling(label),
      el('span',{class:'asmt-hint'}, biling({en:' · pick one or more', fr:' · cochez un ou plusieurs', ar:' · اختر واحد أو أكثر'}))));
    const select = el('select', { id:'m-'+name, name:name, class:'asmt-select asmt-multi', multiple:'multiple', size:'6' });
    options.forEach(([val,lbl]) => {
      const text = (typeof lbl === 'string') ? lbl : (lbl.en + ' / ' + lbl.ar);
      select.appendChild(el('option', { value:val }, text));
    });
    wrap.appendChild(select);
    if (options.some(o => o[0] === 'Other')) {
      const ti = el('input', { type:'text', name:name+'_other', class:'asmt-other-input', placeholder:'Other: please specify…' });
      ti.disabled = true;
      select.addEventListener('change', () => {
        const vs = Array.from(select.selectedOptions).map(o => o.value);
        ti.disabled = !vs.includes('Other');
      });
      wrap.appendChild(ti);
    }
    return wrap;
  }

  const LABELS = { HIS:'HIS', PACS:'PACS', LIS:'LIS', ICU:'ICU iVital', XEye:'X-Eye AI', Tele:'Tele-radiology', Nefro:'TeleDialysis (Nefro)' };

  function summarise(fd) {
    function many(name) {
      const vs = fd.getAll(name).map(v => LABELS[v] || v);
      const other = (fd.get(name+'_other') || '').trim();
      if (vs.includes('Other')) { const i = vs.indexOf('Other'); vs[i] = 'Other' + (other ? ' ('+other+')' : ''); }
      return vs.join(', ');
    }
    function one(name) {
      let v = (fd.get(name) || '').trim();
      const other = (fd.get(name+'_other') || '').trim();
      if (v === 'Other') v = 'Other' + (other ? ' ('+other+')' : '');
      return v;
    }
    return {
      hospital:(fd.get('hospital_name')||'').trim(), contact:(fd.get('contact_name')||'').trim(),
      role:one('contact_role'), email:(fd.get('contact_email')||'').trim(), phone:(fd.get('contact_phone')||'').trim(),
      country:one('country'), modules:many('modules'),
      beds:one('beds'), users:one('users'), daily_opd:one('daily_opd'), new_build:one('new_build'),
      departments:many('departments'),
      current_his:one('current_his'), current_pacs:one('current_pacs'), current_lis:one('current_lis'),
      data_migration:one('data_migration'), nphies_status:one('nphies_status'),
      modalities:many('modalities'), daily_exams:one('daily_exams'), radiologists:one('radiologists'),
      analog_to_digital:one('analog_to_digital'), ai_interest:one('ai_interest'),
      icu_beds:one('icu_beds'), icu_paper:one('icu_paper'), lab_tests_day:one('lab_tests_day'),
      dialysis_devices:one('dialysis_devices'),
      go_live_target:one('go_live_target'), budget_range:one('budget_range'),
      decision_status:one('decision_status'), notes:(fd.get('notes')||'').trim(),
    };
  }
  function emailBody(s) {
    const L = (k,v) => v ? `${k}: ${v}\n` : '';
    return `RIBAL Assessment — new submission
==================================

ABOUT
${L('Hospital', s.hospital)}${L('Contact', s.contact)}${L('Role', s.role)}${L('Email', s.email)}${L('Phone', s.phone)}${L('Country', s.country)}
MODULES OF INTEREST
${s.modules || '(none picked)'}

HOSPITAL SIZE
${L('Beds', s.beds)}${L('Users', s.users)}${L('Daily OPD', s.daily_opd)}${L('Status', s.new_build)}${L('Departments', s.departments)}
EXISTING SYSTEMS
${L('Current HIS', s.current_his)}${L('Current PACS', s.current_pacs)}${L('Current LIS', s.current_lis)}${L('Data migration', s.data_migration)}${L('NPHIES', s.nphies_status)}
AI · IMAGING
${L('Modalities', s.modalities)}${L('Daily exams', s.daily_exams)}${L('Radiologists', s.radiologists)}${L('Analogue → digital', s.analog_to_digital)}${L('AI interest', s.ai_interest)}
ICU / LAB / DIALYSIS
${L('ICU beds', s.icu_beds)}${L('ICU charts today', s.icu_paper)}${L('Lab tests/day', s.lab_tests_day)}${L('Dialysis devices', s.dialysis_devices)}
TIMELINE
${L('Go-live target', s.go_live_target)}${L('Budget band', s.budget_range)}${L('Decision stage', s.decision_status)}
NOTES
${s.notes || '(none)'}
`;
  }
  function waText(s) {
    const lines = [`*RIBAL Assessment*`, s.hospital, `${s.contact}${s.role ? ' · '+s.role : ''}`,
      `${s.email}${s.phone ? ' · '+s.phone : ''}`, '',
      `Modules: ${s.modules || '—'}`,
      `Beds: ${s.beds || '—'} · OPD/day: ${s.daily_opd || '—'} · Users: ${s.users || '—'}`,
      `HIS: ${s.current_his || '—'} · PACS: ${s.current_pacs || '—'} · LIS: ${s.current_lis || '—'}`,
      `Imaging: ${s.modalities || '—'} (${s.daily_exams || '—'}/day, ${s.radiologists || '—'} rads)`,
      `ICU beds: ${s.icu_beds || '—'} · Lab tests/day: ${s.lab_tests_day || '—'} · Dialysis: ${s.dialysis_devices || '—'}`,
      `Go-live: ${s.go_live_target || '—'} · Budget: ${s.budget_range || '—'}`];
    if (s.notes) lines.push('', 'Notes: '+s.notes);
    return lines.join('\n');
  }
  async function handleAssessmentSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    for (const r of form.querySelectorAll('input[required]')) {
      if (!r.value.trim()) { r.focus(); r.reportValidity?.(); return; }
    }
    const s = summarise(new FormData(form));
    const subject = `RIBAL Assessment — ${s.hospital || 'submission'}`;
    const mailHref = `mailto:${EMAIL_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody(s))}`;
    const waHref   = `https://wa.me/${PHONE_WA}?text=${encodeURIComponent(waText(s))}`;

    // 1. Try the secure backend endpoint (Netlify Function). The key lives
    //    on the server — never in this file.
    let backendOk = false;
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'Assessment',
          subject,
          fields: s,
          summary: emailBody(s),
          replyTo: s.email,
        }),
      });
      const j = await res.json().catch(() => ({}));
      backendOk = !!j.ok;
    } catch (_) { /* network down, fall through to manual path */ }

    // 2. Show the success screen. If the backend already delivered, the
    //    two buttons act as resend/backup. If it didn't, they are the
    //    primary delivery path.
    showAssessmentSuccess({ mailHref, waHref, backendOk });
  }
  function showAssessmentSuccess({ mailHref, waHref, backendOk }) {
    const m = ensureModal();
    m.setAttribute('data-layer','form-success');
    const dialog = el('div',{class:'modal-dialog asmt-dialog asmt-success'},
      el('div',{class:'modal-head'},
        el('div',{class:'modal-head-left'},
          el('span',{class:'modal-icon', html: window.RIBAL_ICONS.assessment || ''}),
          el('div', null,
            el('div',{class:'modal-eyebrow'}, biling({en:'Assessment ready', fr:'Évaluation prête', ar:'التقييم جاهز'})),
            el('h2', null, biling({en:'Send it both ways', fr:'Envoyez-la par les deux canaux', ar:'أرسلوه بكلتا الطريقتَين'})))),
        el('div',{class:'modal-head-right'},
          el('button',{class:'modal-close', type:'button', onclick: closeModal, html: UI.close}))),
      el('div',{class:'modal-body'},
        el('div',{class:'asmt-success-msg'},
          el('div',{class:'asmt-success-check'},'✓'),
          (backendOk
            ? el('h3', null, biling({en:'Submitted ✓ — copy delivered to RIBAL.', fr:'Envoyé ✓ — copie transmise à RIBAL.', ar:'تم الإرسال ✓ — وصلت النسخة إلى ريبال.'}))
            : el('h3', null, biling({en:'Tap each button below to deliver your assessment.', fr:'Cliquez sur chaque bouton ci-dessous pour transmettre votre évaluation.', ar:'اضغط على كل زر أدناه'}))),
          el('p', null, biling(backendOk
            ? {en:'You can optionally also send a WhatsApp copy below.', fr:'Vous pouvez également envoyer une copie par WhatsApp ci-dessous, si vous le souhaitez.', ar:'يمكنكم أيضًا إرسال نسخة واتساب أدناه.'}
            : {en:'Server delivery did not complete — please tap Send in either app below.', fr:'L\'envoi côté serveur n\'a pas abouti — cliquez sur Envoyer dans l\'une des deux applications ci-dessous.', ar:'لم يكتمل الإرسال — اضغط على إرسال من أحد الزرَّين.'}))),
        el('div',{class:'asmt-delivery'},
          el('a',{class:'asmt-delivery-btn email', href: mailHref},
            el('span',{class:'asmt-delivery-icon'},'✉'),
            el('span',{class:'asmt-delivery-text'},
              el('strong', null, biling({en:'Send via Email', fr:'Envoyer par email', ar:'إرسال عبر البريد'})),
              el('span', null, 'dsinai@calx.sa'))),
          el('a',{class:'asmt-delivery-btn whatsapp', href: waHref, target:'_blank', rel:'noopener'},
            el('span',{class:'asmt-delivery-icon'},'💬'),
            el('span',{class:'asmt-delivery-text'},
              el('strong', null, biling({en:'Send via WhatsApp', fr:'Envoyer par WhatsApp', ar:'إرسال عبر واتساب'})),
              el('span', null, '+966 59 934 3529')))),
        el('p',{class:'asmt-success-foot'},
          biling({en:'Dani Sinai will reply within 1 business day.', fr:'Dani Sinai vous répondra sous un jour ouvré.', ar:'سيردّ داني سيناي خلال يوم عمل.'}))),
      el('div',{class:'modal-foot'},
        el('button',{class:'btn btn-light', type:'button', onclick: () => renderCards('assessment')},
          biling({en:'← Back to assessment', fr:'← Retour à l\'évaluation', ar:'عودة للتقييم'})),
        el('button',{class:'btn btn-primary', type:'button', onclick: closeModal},
          biling({en:'Done', fr:'Terminé', ar:'تم'}))));
    m.innerHTML = ''; m.appendChild(dialog);
  }

  function checkDeepLink() {
    const params = new URLSearchParams(location.search);
    const slug = params.get('product');
    const aspect = params.get('aspect');
    if (!slug) return;
    if (aspect) { openProduct(slug); setTimeout(() => renderDashboard(slug, aspect), 50); }
    else openProduct(slug);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLang(); bindLang(); bindMenu();
    renderIconGrid();
    checkDeepLink();
  });
})();
