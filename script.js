// ============================================
// Scroll-linked hero: headline crossfades into tagline as the
// user scrolls through the pinned video section.
// ============================================
const heroEl = document.getElementById('hero');
const heroA = document.getElementById('hero-a');
const heroB = document.getElementById('hero-b');
const navEl = document.getElementById('nav');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateHero() {
  if (!heroEl || prefersReducedMotion) {
    if (navEl) navEl.classList.toggle('solid', window.scrollY > 40);
    return;
  }
  const scrollableHeight = heroEl.offsetHeight - window.innerHeight;
  const rect = heroEl.getBoundingClientRect();
  const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(scrollableHeight, 1));
  const progress = scrollableHeight > 0 ? scrolled / scrollableHeight : 0;

  const fadeA = Math.max(0, 1 - progress * 2.4);
  const fadeB = Math.max(0, Math.min(1, (progress - 0.32) * 2.4));

  if (heroA) {
    heroA.style.opacity = fadeA;
    heroA.style.transform = 'translateY(' + (-progress * 50) + 'px)';
    heroA.style.pointerEvents = fadeA > 0.5 ? 'auto' : 'none';
  }
  if (heroB) {
    heroB.style.opacity = fadeB;
    heroB.style.transform = 'translate(-50%, ' + ((1 - fadeB) * 24) + 'px)';
  }
  if (navEl) navEl.classList.toggle('solid', progress > 0.92);
}

window.addEventListener('scroll', updateHero, { passive: true });
window.addEventListener('resize', updateHero);
updateHero();

// ============================================
// Feature carousel — arrows, dots, and light autoplay
// ============================================
const carouselTrack = document.querySelector('.feature-carousel-track');
const carouselSlides = document.querySelectorAll('.feature-slide');
const carouselDots = document.querySelectorAll('.carousel-dot');
const carouselArrows = document.querySelectorAll('.carousel-arrow');
let carouselIndex = 0;
let carouselTimer = null;

function goToSlide(index) {
  if (!carouselTrack || carouselSlides.length === 0) return;
  carouselIndex = (index + carouselSlides.length) % carouselSlides.length;
  carouselTrack.style.transform = 'translateX(-' + carouselIndex * 100 + '%)';
  carouselSlides.forEach(function (slide, i) {
    slide.classList.toggle('is-active', i === carouselIndex);
  });
  carouselDots.forEach(function (dot, i) {
    dot.classList.toggle('is-active', i === carouselIndex);
  });
}

function startCarouselAutoplay() {
  if (prefersReducedMotion) return;
  clearInterval(carouselTimer);
  carouselTimer = setInterval(function () {
    goToSlide(carouselIndex + 1);
  }, 6000);
}

carouselArrows.forEach(function (arrow) {
  arrow.addEventListener('click', function () {
    const dir = parseInt(arrow.getAttribute('data-dir'), 10);
    goToSlide(carouselIndex + dir);
    startCarouselAutoplay();
  });
});

carouselDots.forEach(function (dot, i) {
  dot.addEventListener('click', function () {
    goToSlide(i);
    startCarouselAutoplay();
  });
});

if (carouselTrack && carouselSlides.length > 0) {
  goToSlide(0);
  startCarouselAutoplay();
}

// ============================================
// FAQ accordion
// ============================================
document.querySelectorAll('.accordion-trigger').forEach(function (trigger) {
  trigger.addEventListener('click', function () {
    trigger.closest('.accordion-item').classList.toggle('is-open');
  });
});

// ============================================
// Logo cloud — real, live integrations only.
// ============================================
const INTEGRATIONS = [
  { name: 'Slack', src: 'assets/logos/slack.svg' },
  { name: 'Gmail', src: 'https://cdn.simpleicons.org/gmail/111111' },
  { name: 'Stripe', src: 'https://cdn.simpleicons.org/stripe/111111' },
  { name: 'Notion', src: 'https://cdn.simpleicons.org/notion/111111' },
  { name: 'GitHub', src: 'https://cdn.simpleicons.org/github/111111' },
  { name: 'Linear', src: 'https://cdn.simpleicons.org/linear/111111' },
  { name: 'HubSpot', src: 'https://cdn.simpleicons.org/hubspot/111111' },
  { name: 'Salesforce', src: 'assets/logos/salesforce.svg' },
  { name: 'Zendesk', src: 'https://cdn.simpleicons.org/zendesk/111111' },
  { name: 'Dropbox', src: 'https://cdn.simpleicons.org/dropbox/111111' },
  { name: 'Zoom', src: 'https://cdn.simpleicons.org/zoom/111111' },
  { name: 'Figma', src: 'https://cdn.simpleicons.org/figma/111111' },
  { name: 'Intercom', src: 'https://cdn.simpleicons.org/intercom/111111' },
  { name: 'Asana', src: 'https://cdn.simpleicons.org/asana/111111' },
  { name: 'Shopify', src: 'https://cdn.simpleicons.org/shopify/111111' },
  { name: 'Airtable', src: 'https://cdn.simpleicons.org/airtable/111111' },
];
// Slack and Salesforce are self-hosted (assets/logos/) — both brands had
// their slugs removed from the simpleicons.org CDN (takedown request),
// which is why those two chips were rendering as broken images.

function renderLogoChips(container) {
  INTEGRATIONS.forEach(function (item) {
    const chip = document.createElement('div');
    chip.className = 'logo-chip';
    chip.innerHTML =
      '<img src="' + item.src + '" alt="" width="19" height="19" loading="lazy">' +
      '<span>' + item.name + '</span>';
    container.appendChild(chip);
  });
}

const marqueeA = document.getElementById('marquee-a');
const marqueeB = document.getElementById('marquee-b');
if (marqueeA && marqueeB) {
  renderLogoChips(marqueeA);
  renderLogoChips(marqueeB);
}

// ============================================
// Waitlist form -> posts to the Cloudflare Worker proxy, which writes to
// Airtable. Replace WAITLIST_ENDPOINT below with your deployed worker URL
// once you've followed the setup steps in waitlist-worker.js.
// ============================================
const WAITLIST_ENDPOINT = 'https://gluu-waitlist.shennylaurencia-work.workers.dev';

const form = document.getElementById('waitlist-form');
const note = document.getElementById('waitlist-note');

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const input = form.querySelector('.waitlist-input');
    const email = input.value.trim();
    if (!email) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Joining…';

    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });

      if (!res.ok) throw new Error('Request failed');

      note.textContent = "You're on the list. We'll email you when it's your turn.";
      form.reset();
    } catch (err) {
      note.textContent = "Something went wrong, please try again.";
      console.error('Waitlist submit failed:', err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}
