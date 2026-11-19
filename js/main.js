(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const closeMenu = () => {
    menuButton?.setAttribute('aria-expanded', 'false');
    navLinks?.classList.remove('open');
    document.body.classList.remove('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navLinks?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  });

  navLinks?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => requestAnimationFrame(closeMenu)));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 850) closeMenu();
  });

  document.querySelectorAll('[data-year]').forEach(item => {
    item.textContent = new Date().getFullYear();
  });

  const revealItems = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px' });
    revealItems.forEach(item => observer.observe(item));
  }

  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
        card.style.setProperty('--my', `${event.clientY - rect.top}px`);
      });
    });

    if (!reduceMotion) {
      document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('pointermove', event => {
          const rect = card.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width - 0.5;
          const y = (event.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = `rotateX(${3 - y * 7}deg) rotateY(${-5 + x * 9}deg) translateZ(0)`;
        });
        card.addEventListener('pointerleave', () => card.style.removeProperty('transform'));
      });
    }
  }

  document.querySelectorAll('.particle-canvas').forEach(canvas => {
    if (reduceMotion) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    let width = 0;
    let height = 0;
    let particles = [];

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: Math.min(44, Math.floor(width / 24)) }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.4,
        speed: Math.random() * 0.18 + 0.05,
        drift: Math.random() * Math.PI * 2
      }));
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      particles.forEach(particle => {
        particle.y -= particle.speed;
        particle.drift += 0.008;
        if (particle.y < -5) {
          particle.y = height + 5;
          particle.x = Math.random() * width;
        }
        context.beginPath();
        context.arc(particle.x + Math.sin(particle.drift) * 10, particle.y, particle.radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(184, 239, 98, ${0.12 + particle.radius * 0.1})`;
        context.fill();
      });
      requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  });

  const calculator = document.querySelector('#turf-calculator');
  if (calculator) {
    const length = calculator.querySelector('#length');
    const width = calculator.querySelector('#width');
    const result = document.querySelector('#area-result');
    const extra = document.querySelector('#area-extra');
    const whatsapp = document.querySelector('#calculator-whatsapp');
    let area = 0;

    const calculate = () => {
      const lengthValue = Number.parseFloat(length.value);
      const widthValue = Number.parseFloat(width.value);
      area = lengthValue > 0 && widthValue > 0 ? lengthValue * widthValue : 0;
      result.innerHTML = `${area.toLocaleString('en-ZA', { maximumFractionDigits: 1 })} <span>m²</span>`;
      extra.textContent = area > 0
        ? `Allow about ${Math.ceil(area * 1.05)} m² when ordering, including 5% extra for cuts and shaping.`
        : 'Enter your lawn measurements to calculate the area.';
      const message = area > 0
        ? `Hi GRASS EN ALL, my lawn is ${lengthValue} m × ${widthValue} m (approximately ${area.toFixed(1)} m²). Please help me with a turf quote.`
        : 'Hi GRASS EN ALL, please help me with an instant turf quote.';
      whatsapp.href = `https://wa.me/27645470866?text=${encodeURIComponent(message)}`;
    };

    length.addEventListener('input', calculate);
    width.addEventListener('input', calculate);
    calculator.addEventListener('submit', event => event.preventDefault());
    calculate();
  }

  const quoteForm = document.querySelector('#quote-form');
  quoteForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!quoteForm.reportValidity()) return;
    const data = new FormData(quoteForm);
    const lines = [
      'Hi GRASS EN ALL, I would like a lawn quote.',
      '',
      `Name: ${data.get('name')}`,
      `Phone: ${data.get('phone')}`,
      `Location: ${data.get('location')}`,
      `Service: ${data.get('service')}`,
      `Approximate area: ${data.get('area') || 'Not specified'}`,
      `Message: ${data.get('message') || 'No additional message'}`
    ];
    const url = `https://wa.me/27645470866?text=${encodeURIComponent(lines.join('\n'))}`;
    const status = document.querySelector('#form-status');
    if (status) status.textContent = 'Opening WhatsApp with your quote details…';
    window.open(url, '_blank', 'noopener,noreferrer');
  });

  const filterButtons = document.querySelectorAll('[data-filter]');
  const projectCards = document.querySelectorAll('.project-grid [data-category]');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      filterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      projectCards.forEach(card => {
        card.hidden = filter !== 'all' && card.dataset.category !== filter;
      });
    });
  });

  const lightbox = document.querySelector('#project-lightbox');
  if (lightbox) {
    const image = lightbox.querySelector('img');
    const caption = lightbox.querySelector('[data-lightbox-caption]');
    document.querySelectorAll('[data-lightbox]').forEach(card => {
      card.addEventListener('click', event => {
        event.preventDefault();
        image.src = card.href;
        image.alt = card.dataset.caption;
        caption.textContent = card.dataset.caption;
        lightbox.showModal();
      });
    });
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', () => lightbox.close());
    lightbox.addEventListener('click', event => {
      if (event.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener('close', () => {
      image.src = '';
    });
  }

  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('toggle', () => {
      if (!item.open) return;
      document.querySelectorAll('.faq-item[open]').forEach(other => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
