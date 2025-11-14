const heroSilhouette = document.querySelector('.hero__silhouette');
const heroShimmer = document.querySelector('.hero__shimmer');
const carousel = document.querySelector('.editorial-carousel');

function handleParallax() {
  const scrollY = window.scrollY || window.pageYOffset;
  if (heroSilhouette) {
    const translate = Math.min(scrollY * 0.08, 32);
    heroSilhouette.style.transform = `translateY(${translate}px)`;
  }
  if (heroShimmer) {
    const shimmerTranslate = Math.min(scrollY * 0.05, 24);
    heroShimmer.style.setProperty('--scroll-shift', `${shimmerTranslate}px`);
  }
}

let parallaxRaf = null;

function onScroll() {
  if (parallaxRaf) return;
  parallaxRaf = window.requestAnimationFrame(() => {
    handleParallax();
    parallaxRaf = null;
  });
}

window.addEventListener('scroll', onScroll);
handleParallax();

// Gold sand sparkle effect
if (heroShimmer) {
  const particles = document.createDocumentFragment();
  const particleCount = 48;
  for (let i = 0; i < particleCount; i += 1) {
    const sparkle = document.createElement('span');
    sparkle.className = 'sparkle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${Math.random() * 6}s`;
    sparkle.style.animationDuration = `${4 + Math.random() * 6}s`;
    particles.appendChild(sparkle);
  }
  heroShimmer.appendChild(particles);
}

// Editorial carousel logic
if (carousel) {
  const track = carousel.querySelector('.carousel-track');
  const items = Array.from(carousel.querySelectorAll('.carousel-item'));
  const caption = carousel.querySelector('.carousel-caption');
  const prevButton = carousel.querySelector('.carousel-control.prev');
  const nextButton = carousel.querySelector('.carousel-control.next');

  let currentIndex = 0;

  function getItemExtent() {
    if (!items.length) return 0;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0');
    return items[0].getBoundingClientRect().width + gap;
  }

  function updateCarousel(index) {
    const itemExtent = getItemExtent();
    track.style.transform = `translateX(${-index * itemExtent}px)`;
    const currentItem = items[index];
    if (caption && currentItem) {
      caption.textContent = currentItem.dataset.caption || '';
    }
  }

  function move(direction) {
    currentIndex = (currentIndex + direction + items.length) % items.length;
    updateCarousel(currentIndex);
  }

  updateCarousel(currentIndex);

  prevButton?.addEventListener('click', () => move(-1));
  nextButton?.addEventListener('click', () => move(1));

  // Swipe support
  let startX = 0;
  let deltaX = 0;

  function onPointerDown(event) {
    startX = event.type.startsWith('touch')
      ? event.touches[0].clientX
      : event.clientX;
    track.style.transition = 'none';
    deltaX = 0;
    carousel.setPointerCapture?.(event.pointerId);
    carousel.addEventListener('pointermove', onPointerMove);
    carousel.addEventListener('pointerup', onPointerUp);
    carousel.addEventListener('pointercancel', onPointerUp);
  }

  function onPointerMove(event) {
    const clientX = event.clientX;
    deltaX = clientX - startX;
    const itemExtent = getItemExtent();
    track.style.transform = `translateX(${-currentIndex * itemExtent + deltaX}px)`;
  }

  function onPointerUp(event) {
    track.style.transition = '';
    if (Math.abs(deltaX) > 80) {
      move(deltaX > 0 ? -1 : 1);
    } else {
      updateCarousel(currentIndex);
    }
    if (event?.pointerId !== undefined) {
      carousel.releasePointerCapture?.(event.pointerId);
    }
    carousel.removeEventListener('pointermove', onPointerMove);
    carousel.removeEventListener('pointerup', onPointerUp);
    carousel.removeEventListener('pointercancel', onPointerUp);
  }

  carousel.addEventListener('pointerdown', onPointerDown);

  window.addEventListener('resize', () => updateCarousel(currentIndex));
}
