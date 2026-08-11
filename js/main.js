// Kênh Tay Trái — mỗi tính năng là một khối độc lập.
// Luật: không thư viện ngoài, không scroll listener mới, mọi motion tôn trọng prefers-reduced-motion.

document.documentElement.classList.add('js');

var REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var HAS_IO = 'IntersectionObserver' in window;

/* ---------------------------------------------------------------- NAV */
(function initNav() {
  var nav = document.getElementById('nav');
  if (!nav) return;
  var bar = document.getElementById('navProgress');
  var ticking = false;

  var paint = function () {
    ticking = false;
    nav.classList.toggle('is-stuck', window.scrollY > 8);
    if (!bar) return;
    var doc = document.documentElement;
    var max = (doc.scrollHeight || 0) - (window.innerHeight || doc.clientHeight || 0);
    var p = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
  };

  var onScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(paint);
  };

  paint();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
})();

/* -------------------------------------------------- POP-UP ĐĂNG KÝ */
(function initModal() {
  var modal = document.getElementById('dang-ky');
  if (!modal) return;

  var open = function (e) {
    if (e) e.preventDefault();
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    // Modal không đi qua reveal observer nên phải tự vẽ underline, không thì gạch chân vô hình.
    modal.querySelectorAll('.mark--underline').forEach(function (m) {
      m.classList.add('is-drawn');
    });
    var first = modal.querySelector('.signup__step.is-active input, .signup__step.is-active select, .signup__step.is-active textarea');
    if (first) first.focus();
  };
  var close = function () {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  };

  document.querySelectorAll('a[href="#dang-ky"]').forEach(function (a) {
    a.addEventListener('click', open);
  });
  modal.querySelectorAll('[data-modal-close]').forEach(function (el) {
    el.addEventListener('click', close);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
})();

/* ------------------------------------------- REVEAL + COUNT-UP + SPY */
(function initScrollEffects() {
  // Gom mọi thứ cần IntersectionObserver vào đúng 2 observer.
  var groups = [].slice.call(document.querySelectorAll('[data-reveal-group]'));
  var singles = [].slice.call(document.querySelectorAll('.reveal'));
  var counters = [].slice.call(document.querySelectorAll('[data-count]'));

  // Fallback: không IO hoặc reduced-motion thì hiện hết ngay, không animate.
  if (!HAS_IO || REDUCE_MOTION) {
    groups.forEach(function (g) {
      childrenOf(g).forEach(function (el) { el.classList.add('rv-in'); });
    });
    singles.forEach(function (el) { el.classList.add('is-in'); });
    counters.forEach(function (el) { el.textContent = el.dataset.count; });
    markAllUnderlines();
    initSpy();
    return;
  }

  function childrenOf(group) {
    var sel = group.dataset.revealItems;
    return sel
      ? [].slice.call(group.querySelectorAll(sel))
      : [].slice.call(group.children);
  }

  function markAllUnderlines() {
    document.querySelectorAll('.mark--underline').forEach(function (m) {
      m.classList.add('is-drawn');
    });
  }

  function revealNow(el, stagger) {
    if (el.dataset.revealed) return;
    el.dataset.revealed = '1';

    if (el.hasAttribute('data-reveal-group')) {
      childrenOf(el).forEach(function (child, i) {
        if (stagger === false) child.classList.add('rv-in');
        else setTimeout(function () { child.classList.add('rv-in'); }, i * 80);
      });
    } else {
      el.classList.add('is-in');
    }

    // Underline coral vẽ theo khi khối chứa nó lộ ra.
    el.querySelectorAll('.mark--underline').forEach(function (m) {
      m.classList.add('is-drawn');
    });
    if (el.classList.contains('mark--underline')) el.classList.add('is-drawn');
  }

  var targets = groups.concat(singles);

  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      revealIO.unobserve(entry.target);
      revealNow(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  targets.forEach(function (el) { revealIO.observe(el); });

  // An toàn 1: phần tử đã nằm trong viewport ngay lúc tải — một số trình duyệt
  // không bắn callback đầu tiên đáng tin cậy.
  requestAnimationFrame(function () {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    targets.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) revealNow(el);
    });
  });

  // An toàn 2: nếu observer không bao giờ bắn (IO lỗi / môi trường lạ),
  // hiện sạch sau 2.5s. Nội dung KHÔNG BAO GIỜ được phép ở lại opacity:0.
  setTimeout(function () {
    targets.forEach(function (el) { revealNow(el, false); });
  }, 2500);

  // ---- Count-up (một lần, khi số vào view) ----
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      countIO.unobserve(entry.target);
      countUp(entry.target);
    });
  }, { threshold: 0.6 });

  counters.forEach(function (el) { countIO.observe(el); });

  // An toàn: IO không bắn thì số phải hiện đúng giá trị, không kẹt ở 0.
  setTimeout(function () {
    counters.forEach(function (el) {
      if (!el.dataset.counted) el.textContent = el.dataset.count;
    });
  }, 2500);

  function countUp(el) {
    el.dataset.counted = '1';
    var full = el.dataset.count;                 // vd "200K+" hoặc "16 triệu"
    var match = full.match(/[\d.,]+/);
    if (!match) { el.textContent = full; return; }
    var raw = match[0];
    var target = parseFloat(raw.replace(/,/g, '.'));
    if (isNaN(target)) { el.textContent = full; return; }

    var prefix = full.slice(0, match.index);
    var suffix = full.slice(match.index + raw.length);
    var start = performance.now();
    var DUR = 800;

    function frame(now) {
      var p = Math.min((now - start) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3);        // ease-out cubic
      var val = target * eased;
      el.textContent = prefix + (p === 1 ? raw : Math.round(val)) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    el.textContent = prefix + '0' + suffix;
    requestAnimationFrame(frame);
  }

  // Nét khoanh coral trên ảnh chứng minh để TĨNH.
  // Đã thử cho tự vẽ bằng stroke-dash, nhưng SVG này dùng
  // vector-effect:non-scaling-stroke + preserveAspectRatio="none" nên độ dài dash
  // không khớp độ dài path thật ⇒ nét bị đứt quãng. Không đáng đánh đổi.

  initSpy();

  // ---- Scroll-spy cho nav ----
  function initSpy() {
    if (!HAS_IO) return;
    var links = [].slice.call(document.querySelectorAll('.nav__links a[href^="#"]:not(.btn)'));
    if (!links.length) return;

    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) map[id] = a;
    });

    var spyIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = map[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('is-current'); });
          link.classList.add('is-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) {
      spyIO.observe(document.getElementById(id));
    });
  }
})();

/* --------------------------------------------------- TAB LỘ TRÌNH */
(function initRoadmapTabs() {
  var tabs = [].slice.call(document.querySelectorAll('.roadmap__tab'));
  if (!tabs.length) return;

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var phase = tab.dataset.phase;
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active);
      });
      document.querySelectorAll('.roadmap__pane').forEach(function (pane) {
        pane.classList.toggle('is-active', pane.dataset.pane === phase);
      });
    });
  });
})();

/* --------------------------------------------------- TAB BA ĐIỀU */
(function initPillarTabs() {
  var tabs = [].slice.call(document.querySelectorAll('.pillars__tab'));
  if (!tabs.length) return;
  var panel = document.querySelector('.pillars__panel');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var pillar = tab.dataset.pillar;
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active);
      });
      document.querySelectorAll('.pillars__pane').forEach(function (pane) {
        pane.classList.toggle('is-active', pane.dataset.panel === pillar);
      });
      var activePane = document.querySelector('.pillars__pane.is-active');
      if (panel) {
        panel.classList.toggle('is-split', !!activePane && activePane.classList.contains('pillars__pane--split'));
      }
      // Mockchat chỉ chạy stagger lần đầu tab Cộng đồng được mở.
      if (activePane) {
        var chat = activePane.querySelector('.mockchat');
        if (chat && !chat.classList.contains('is-played')) chat.classList.add('is-played');
      }
    });
  });
})();

/* ------------------------------------------------------------- FAQ */
(function initFaq() {
  var qs = [].slice.call(document.querySelectorAll('.apply__q'));
  if (!qs.length) return;

  qs.forEach(function (q) {
    q.addEventListener('click', function () {
      var willOpen = !q.classList.contains('is-active');
      var answer = document.querySelector('.apply__a[data-faq-a="' + q.dataset.faq + '"]');
      q.classList.toggle('is-active', willOpen);
      q.setAttribute('aria-expanded', willOpen);
      if (answer) answer.classList.toggle('is-active', willOpen);
    });
  });
})();

/* ------------------------------------------ FORM ĐĂNG KÝ NHIỀU BƯỚC */
(function initSignupForm() {
  var form = document.getElementById('signupForm');
  if (!form) return;

  var steps = [].slice.call(form.querySelectorAll('.signup__step'));
  var total = steps.length;
  var current = 0;
  var progressBar = document.querySelector('.signup__progress-bar');
  var prevBtn = document.querySelector('.signup__prev');
  var nextBtn = document.querySelector('.signup__next');
  var submitBtn = document.querySelector('.signup__submit');
  var doneEl = document.querySelector('.signup__done');

  function renderStep(dir) {
    form.setAttribute('data-dir', dir || 'next');
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
    if (progressBar) progressBar.style.width = (((current + 1) / total) * 100) + '%';
    if (prevBtn) prevBtn.disabled = current === 0;
    var isLast = current === total - 1;
    if (nextBtn) nextBtn.hidden = isLast;
    if (submitBtn) submitBtn.hidden = !isLast;
  }

  function currentStepValid() {
    var step = steps[current];
    var fields = [].slice.call(step.querySelectorAll('input[required], textarea[required], select[required]'));
    if (!fields.length) return true;
    var seen = {};
    var valid = true;
    fields.forEach(function (el) {
      if (el.type === 'radio') {
        if (seen[el.name]) return;
        seen[el.name] = true;
        if (!step.querySelector('input[name="' + el.name + '"]:checked')) valid = false;
      } else if (!el.value.trim()) {
        valid = false;
        if (el.reportValidity) el.reportValidity();
      }
    });
    return valid;
  }

  function goNext() {
    if (!currentStepValid()) return;
    if (current < total - 1) { current++; renderStep('next'); }
  }
  function goPrev() {
    if (current > 0) { current--; renderStep('prev'); }
  }

  if (nextBtn) nextBtn.addEventListener('click', goNext);
  if (prevBtn) prevBtn.addEventListener('click', goPrev);

  // Enter qua câu (textarea giữ Enter để xuống dòng)
  form.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (e.target.tagName === 'TEXTAREA') return;
    e.preventDefault();
    if (current < total - 1) goNext();
  });

  // Radio có data-autonext thì tự sang câu sau một nhịp ngắn
  steps.forEach(function (step) {
    var group = step.querySelector('.signup__choices[data-autonext="true"]');
    if (!group) return;
    group.addEventListener('change', function () {
      setTimeout(goNext, REDUCE_MOTION ? 0 : 320);
    });
  });

  // "Biết đến qua đâu" — chọn Khác thì hiện ô nhập tay
  var sourceSelect = form.querySelector('select[name="source"]');
  var sourceOther = form.querySelector('input[name="source_other"]');
  if (sourceSelect && sourceOther) {
    sourceSelect.addEventListener('change', function () {
      var isOther = sourceSelect.value === 'Khác';
      sourceOther.hidden = !isOther;
      sourceOther.required = isOther;
      if (!isOther) sourceOther.value = '';
      else sourceOther.focus();
    });
  }

  // Lưu đơn vào Supabase (bảng ktt_applications, project lctos).
  // Publishable key — an toàn ở client, RLS chỉ cho phép INSERT.
  var SUPABASE_URL = 'https://gedyrwfhqpjrfcptrnck.supabase.co';
  var SUPABASE_KEY = 'sb_publishable_ywvY3y_NilX7LnuOtwyToQ_lAnRT9Oe';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentStepValid()) return;

    var data = Object.fromEntries(new FormData(form).entries());
    if (data.source === 'Khác' && data.source_other) data.source = data.source_other;
    delete data.source_other;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    fetch(SUPABASE_URL + '/rest/v1/ktt_applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error('submit failed');
        form.hidden = true;
        if (progressBar) progressBar.parentElement.hidden = true;
        if (doneEl) {
          doneEl.classList.add('is-active');
          popSeeds(doneEl);
        }
      })
      .catch(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Hoàn tất đăng ký';
        alert('Có lỗi khi gửi đơn, bạn thử lại giúp mình nhé.');
      });
  });

  // 12 hướng cố định — deterministic, không dùng Math.random.
  var SEEDS = [
    [-118, -62], [-92, -96], [-52, -118], [0, -128], [52, -118], [92, -96],
    [118, -62], [124, 8], [86, 66], [0, 92], [-86, 66], [-124, 8]
  ];
  var SEED_COLORS = ['var(--mint)', 'var(--yellow)', 'var(--mint-soft)'];

  function popSeeds(host) {
    if (REDUCE_MOTION || host.dataset.popped) return;
    host.dataset.popped = '1';
    SEEDS.forEach(function (d, i) {
      var el = document.createElement('span');
      el.className = 'pop-seed';
      el.style.setProperty('--dx', d[0] + 'px');
      el.style.setProperty('--dy', d[1] + 'px');
      el.style.background = SEED_COLORS[i % SEED_COLORS.length];
      el.style.borderRadius = i % 2 ? '50%' : '2px';
      el.style.animationDelay = (i * 18) + 'ms';
      host.appendChild(el);
    });
    setTimeout(function () {
      host.querySelectorAll('.pop-seed').forEach(function (el) { el.remove(); });
    }, 1100);
  }

  renderStep('next');
})();
