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

/* ------------------------------------------- VIDEO NHỎ TRONG SECTION AI */
// Bấm play để phát; video có data-autoplay tự phát MỘT lần khi vào view (muted).
// Không loop — hết thì hiện lại nút play để xem lại.
(function initAiVideos() {
  var boxes = [].slice.call(document.querySelectorAll('[data-aivideo]'));
  if (!boxes.length) return;

  boxes.forEach(function (box) {
    var video = box.querySelector('video');
    var btn = box.querySelector('.aivideo__play');
    if (!video) return;

    // Màn hẹp: dùng bản dọc 4:5 (chữ trong cửa sổ chat đọc được trên điện thoại)
    if (box.dataset.srcMobile && window.innerWidth < 760) {
      video.src = box.dataset.srcMobile;
      if (box.dataset.posterMobile) video.poster = box.dataset.posterMobile;
      box.classList.add('is-portrait');
    }

    box.playFromStart = function () {
      try { video.currentTime = 0; } catch (e) {}
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };

    if (btn) btn.addEventListener('click', function () {
      if (video.ended || video.currentTime > 0.2) box.playFromStart();
      else { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
    });
    video.addEventListener('play', function () { box.classList.add('is-playing'); });
    video.addEventListener('pause', function () { box.classList.remove('is-playing'); });
    video.addEventListener('ended', function () { box.classList.remove('is-playing'); });
    video.addEventListener('click', function () { if (!video.paused) video.pause(); });
  });

  if (!HAS_IO || REDUCE_MOTION) return;
  var autoIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      autoIO.unobserve(entry.target);
      entry.target.playFromStart();
    });
  }, { threshold: 0.55 });
  boxes.forEach(function (box) {
    if (box.hasAttribute('data-autoplay')) autoIO.observe(box);
  });
})();

/* ------------------------------------------- DEMO CLAUDE (terminal) */
(function initAiDemo() {
  var root = document.querySelector('[data-aidemo]');
  if (!root) return;

  var ORDER = ['skill', 'motion', 'thumb', 'notion'];
  var NAMES = { skill: 'Bộ skill AI', motion: 'Dựng hình & sub', thumb: 'Làm thumbnail', notion: 'Giao việc trên Notion' };
  var tabs = [].slice.call(root.querySelectorAll('.aidemo__tab'));
  var replayBtn = root.querySelector('[data-demo-replay]');
  var nextBtns = [].slice.call(root.querySelectorAll('[data-demo-next]'));
  var nextBtn = nextBtns[0];
  var stage = root.querySelector('.aidemo__stage');
  var current = 'skill';
  var timers = [];

  // Giữ nguyên câu lệnh gốc (cũng là nội dung hiển thị khi không có JS)
  root.querySelectorAll('.term__typed').forEach(function (el) { el.dataset.full = el.textContent; });

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  function pauseVideos() {
    root.querySelectorAll('video').forEach(function (v) { if (!v.paused) v.pause(); });
  }

  function show(id) {
    current = id;
    tabs.forEach(function (t) {
      var on = t.dataset.demo === id;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
    });
    root.querySelectorAll('.term__pane').forEach(function (p) {
      var on = p.dataset.pane === id;
      p.classList.toggle('is-active', on);
      if (on) {
        var tool = root.querySelector('.term__tool'), where = root.querySelector('.term__where');
        if (tool) tool.textContent = p.dataset.tool || 'Claude Code';
        if (where) where.textContent = '~/' + (p.dataset.where || '');
      }
    });
    root.querySelectorAll('.aiout__pane').forEach(function (p) { p.classList.toggle('is-active', p.dataset.out === id); });
    // tab không có phiên terminal (danh mục skill) thì khung kết quả chiếm cả bề ngang
    if (stage) stage.classList.toggle('is-catalog', !root.querySelector('.term__pane[data-pane="' + id + '"]'));
  }

  function setNext() {
    var i = ORDER.indexOf(current);
    var isLast = i === ORDER.length - 1;
    nextBtns.forEach(function (b) {
      b.innerHTML = isLast
        ? 'Xem lại từ đầu <span aria-hidden="true">→</span>'
        : 'Xem tiếp: ' + NAMES[ORDER[i + 1]] + ' <span aria-hidden="true">→</span>';
    });
  }

  function finish(pane, out, id) {
    pane.querySelector('.term__done').classList.remove('is-wait');
    out.classList.remove('is-waiting');
    if (id === 'motion') {
      var box = out.querySelector('[data-aivideo]');
      if (box && box.playFromStart) later(function () { box.playFromStart(); }, 250);
    }
    if (nextBtn) nextBtn.classList.remove('is-hidden');
  }

  function run(id) {
    clearTimers();
    pauseVideos();
    show(id);
    setNext();

    var pane = root.querySelector('.term__pane[data-pane="' + id + '"]');
    var out = root.querySelector('.aiout__pane[data-out="' + id + '"]');
    if (!pane) { out.classList.remove('is-waiting'); return; }
    var typed = pane.querySelector('.term__typed');
    var steps = [].slice.call(pane.querySelectorAll('.term__steps li'));
    var done = pane.querySelector('.term__done');

    if (REDUCE_MOTION) {
      typed.textContent = typed.dataset.full;
      steps.forEach(function (li) { li.className = 'is-done'; });
      done.classList.remove('is-wait');
      out.classList.remove('is-waiting');
      if (nextBtn) nextBtn.classList.remove('is-hidden');
      return;
    }

    // Trạng thái chờ
    typed.textContent = '';
    typed.classList.add('is-typing');
    steps.forEach(function (li) { li.className = 'is-wait'; });
    done.classList.add('is-wait');
    out.classList.add('is-waiting');
    if (nextBtn) nextBtn.classList.add('is-hidden');

    // 1. Gõ câu lệnh (tổng ~1,4s dù câu dài hay ngắn)
    var full = typed.dataset.full;
    var perChar = Math.max(9, Math.min(22, 1400 / full.length));
    var i = 0;
    (function type() {
      i += 1;
      typed.textContent = full.slice(0, i);
      if (i < full.length) later(type, perChar);
      else later(startSteps, 380);
    })();

    // 2. Các bước chạy lần lượt
    function startSteps() {
      typed.classList.remove('is-typing');
      var t = 0;
      steps.forEach(function (li, k) {
        later(function () { li.className = 'is-run'; }, t);
        t += k === steps.length - 1 ? 620 : 520 + (k % 2) * 160;
        later(function () { li.className = 'is-done'; }, t);
      });
      later(function () { finish(pane, out, id); }, t + 260);
    }
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { run(tab.dataset.demo); });
  });
  if (replayBtn) replayBtn.addEventListener('click', function () { run(current); });
  nextBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var i = ORDER.indexOf(current);
      run(ORDER[(i + 1) % ORDER.length]);
    });
  });

  // Chạy demo đầu tiên khi khối vào view (một lần)
  if (!HAS_IO) { run(ORDER[0]); return; }
  var started = false;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting || started) return;
      started = true;
      io.disconnect();
      run(ORDER[0]);
    });
  }, { threshold: 0.35 });
  io.observe(root);
})();

/* ------------------------------------------- ẢNH CHỤP NOTION + MŨI TÊN */
// Mũi tên ngắn vẽ tay (SVG do Codex vẽ, assets/img/arrows) đặt sát chú thích, hướng vào ảnh.
// Kiểu mũi tên chọn theo chênh lệch giữa vị trí chú thích (--at) và điểm đích (data-y).
// Màn hẹp (<900px): chấm số trên ảnh + danh sách đánh số bên dưới.
(function initAshots() {
  var figs = [].slice.call(document.querySelectorAll('[data-ashot]'));
  if (!figs.length) return;

  function pick(left, dy, i) {
    if (left) {
      if (dy < -5) return ['arc-up-right', false];
      if (dy > 5) return ['arc-down-right', false];
      return [i % 2 ? 's-right' : 'loop-right', false];
    }
    if (dy > 5) return ['loop-down-left', false];
    if (dy < -5) return ['arc-up-right', true];      // lật ngang thành "lên-trái"
    return [i % 2 ? 'arc-left' : 'loop-left', false];
  }

  figs.forEach(function (fig) {
    var shot = fig.querySelector('.ashot__shot');
    fig.querySelectorAll('.ashot__side li').forEach(function (li, i) {
      var left = !!li.closest('.ashot__side--l');
      var at = parseFloat(li.style.getPropertyValue('--at')) || 0;
      var dy = parseFloat(li.dataset.y) - at;
      var p = pick(left, dy, i);
      var arw = document.createElement('i');
      arw.className = 'ashot__arw ashot__arw--' + (dy < -5 ? 'up' : dy > 5 ? 'down' : 'mid');
      arw.setAttribute('aria-hidden', 'true');
      arw.style.setProperty('--m', 'url("' + new URL('assets/img/arrows/' + p[0] + '.svg', document.baseURI).href + '")');
      arw.style.setProperty('--i', i);
      if (p[1]) arw.classList.add('is-flip');
      li.appendChild(arw);

      // chấm số trên ảnh cho màn hẹp
      var pin = document.createElement('span');
      pin.className = 'ashot__pin';
      pin.setAttribute('aria-hidden', 'true');
      pin.textContent = li.querySelector('.ashot__n').textContent;
      pin.style.left = li.dataset.x + '%';
      pin.style.top = li.dataset.y + '%';
      shot.appendChild(pin);
    });
  });

  // mũi tên "vẽ" ra khi ảnh vào view lần đầu
  if (!HAS_IO || REDUCE_MOTION) {
    figs.forEach(function (f) { f.classList.add('is-drawn'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        e.target.classList.add('is-drawn');
      });
    }, { threshold: 0.3 });
    figs.forEach(function (f) { io.observe(f); });
  }

})();

/* ------------------------------------------- HÀNH TRÌNH MỘT VIDEO (tour) */
// Cuộn tới chặng nào thì khung ảnh bên phải đổi sang màn của chặng đó và
// thanh chặng sáng lên. Bấm vào chặng trên thanh để cuộn tới chặng đó.
(function initJourney() {
  var root = document.querySelector('[data-jtour]');
  if (!root) return;
  var steps = [].slice.call(root.querySelectorAll('.jtour__step'));
  var pills = [].slice.call(root.querySelectorAll('.jtour__pill'));
  var shots = [].slice.call(root.querySelectorAll('.jtour__shot'));
  var current = 1;

  function setActive(j) {
    if (j === current) return;
    current = j;
    steps.forEach(function (s) { s.classList.toggle('is-active', +s.dataset.j === j); });
    shots.forEach(function (s) { s.classList.toggle('is-on', +s.dataset.j === j); });
    pills.forEach(function (p) {
      var n = +p.dataset.j;
      p.classList.toggle('is-active', n === j);
      p.classList.toggle('is-done', n < j);
      p.setAttribute('aria-current', n === j ? 'step' : 'false');
    });
    var pill = pills[j - 1];
    if (pill && window.innerWidth <= 900 && pill.scrollIntoView) {
      var rail = pill.parentElement.parentElement;
      rail.scrollTo({ left: pill.parentElement.offsetLeft - 16, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    }
  }

  // Căn khung ảnh giữa vùng nhìn (dưới menu + thanh chặng) và đặt "đường kích hoạt"
  // đúng tâm khung: chặng nào có khối chữ chạm đường này thì thành chặng đang xem.
  var stage = root.querySelector('.jtour__stage');
  var rail = root.querySelector('.jtour__rail');
  var io = null;
  function layout() {
    if (!stage || window.innerWidth <= 900) { if (io) io.disconnect(); io = null; return; }
    var nav = document.getElementById('nav');
    var top0 = (nav ? nav.offsetHeight : 68) + (rail ? rail.offsetHeight : 62);
    var H = stage.offsetHeight;
    var free = window.innerHeight - top0;
    var top = top0 + Math.max(12, (free - H) / 2);
    stage.style.top = top + 'px';
    if (!HAS_IO) return;
    var line = Math.round(top + H / 2);
    if (io) io.disconnect();
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) setActive(+e.target.dataset.j); });
    }, { rootMargin: '-' + line + 'px 0px -' + Math.max(0, window.innerHeight - line - 2) + 'px 0px' });
    steps.forEach(function (s) { io.observe(s.querySelector('.jtour__body')); });
  }
  steps.forEach(function (s) { s.querySelector('.jtour__body').dataset.j = s.dataset.j; });
  var t = 0;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(layout, 120); }, { passive: true });
  var firstImg = stage && stage.querySelector('img');
  if (firstImg && !firstImg.complete) firstImg.addEventListener('load', layout);
  layout();

  pills.forEach(function (p) {
    p.addEventListener('click', function () {
      var step = steps[+p.dataset.j - 1];
      if (!step) return;
      var body = step.querySelector('.jtour__body');
      var r = body.getBoundingClientRect();
      var line = stage && window.innerWidth > 900 ? parseFloat(stage.style.top) + stage.offsetHeight / 2 : window.innerHeight * 0.4;
      var y = r.top + window.scrollY + r.height / 2 - line;
      window.scrollTo({ top: y, behavior: REDUCE_MOTION ? 'auto' : 'smooth' });
    });
  });
})();
