import confetti from 'canvas-confetti';

/** Standard celebration burst (e.g. perfect score, match win) */
export function celebrationBurst() {
  const count = 200;
  const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
}

/** Smaller burst for minor achievements (e.g. badge earned) */
export function smallBurst() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    zIndex: 9999,
  });
}

/** Gold/star themed burst (e.g. streak milestones) */
export function starBurst() {
  const defaults = {
    spread: 360,
    ticks: 80,
    gravity: 0.4,
    decay: 0.94,
    startVelocity: 20,
    zIndex: 9999,
    colors: ['#FFD700', '#FFA500', '#FF6347'],
  };

  confetti({ ...defaults, particleCount: 30, origin: { x: 0.3, y: 0.5 } });
  confetti({ ...defaults, particleCount: 30, origin: { x: 0.7, y: 0.5 } });
}
