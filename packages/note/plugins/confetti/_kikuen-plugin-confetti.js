/** @type {Config} */
const CONFIG = {
  successKey: ["2", "3", "4"], // key to press to launch confetti
  failKey: ["1"], // key to press to shake expression
  maxCombo: 10, // press count to reach max combo
  failStreak: 4, // consecutive fail presses to trigger roseBurst
  particleCount: [20, 100], // number of particles [initial, max]
  startVelocity: [45, 60], // initial speed [initial, max]
  gravity: [1.5, 2], // how fast particles fall [initial, max]
  spread: [45, 60], // launch angle spread [initial, max]
  fireworksCheckpoints: [10, 20, 40, 60, 80, 100, 150, 200, 300, 400, 500, 1000], // combo counts that trigger a fireworks burst
  fireworksDuration: 1 * 1000, // how long fireworks last (ms)
  confettiAudioVolume: [0.1, 0.2], // confetti sound volume [initial, max]
  failAudioVolume: 0.2, // fail sound volume
  fail2AudioVolume: 0.3, // fail2 sound volume
  fireworksAudioVolume: 0.3, // fireworks sound volume
};

const CDN_URL = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.4/+esm";
const GLOBAL = /** @type {{ __comboState?: ComboState }} */ (globalThis);
const __comboState = (GLOBAL.__comboState ??= {
  lastFire: 0,
  combo: 0,
  consecutiveFails: 0,
  loaded: false,
});

/**
 * @param {number} progress
 * @param {[number, number]} range
 */
function lerp(progress, [min, max]) {
  return min + (progress / CONFIG.maxCombo) * (max - min);
}

/** @param {number} min @param {number} max */
function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * @param {Confetti} confetti
 * @param {number} duration
 */
function fireworks(confetti, duration) {
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = 50 * (timeLeft / duration);
    const origin1 = { x: random(0.1, 0.3), y: Math.random() - 0.2 };
    const origin2 = { x: random(0.7, 0.9), y: Math.random() - 0.2 };
    void confetti({ ...defaults, particleCount, origin: origin1 });
    void confetti({ ...defaults, particleCount, origin: origin2 });
  }, 250);
}

/**
 * @param {Confetti} confetti
 */
function starBurst(confetti) {
  const colors = ["FFE400", "FFBD00", "E89400", "FFCA6C", "FDFFB8"];
  const defaults = { spread: 360, ticks: 50, gravity: 0, decay: 0.94, startVelocity: 30, colors };

  function shoot() {
    void confetti({ ...defaults, particleCount: 40, scalar: 1.2, shapes: ["star"] });
    void confetti({ ...defaults, particleCount: 10, scalar: 0.75, shapes: ["circle"] });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

/**
 * @param {Confetti} confetti
 */
function roseBurst(confetti) {
  const scalar = 3;
  const emoji1 = confetti.shapeFromText({ text: "🥀", scalar });
  const colors = ["#ff4d4d", "#e60000", "#ff8080"];

  const defaults = {
    spread: 360,
    ticks: 60,
    gravity: 0,
    decay: 0.96,
    startVelocity: 20,
    shapes: [emoji1],
    scalar,
  };

  function shoot() {
    void confetti({ ...defaults, particleCount: 30 });
    void confetti({ ...defaults, particleCount: 5, flat: true });
    void confetti({
      ...defaults,
      particleCount: 15,
      scalar: scalar / 2,
      shapes: ["circle"],
      colors,
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

/** @param {number} progress */
function playConfettiAudio(progress) {
  const a = new Audio("_confetti.mp3");
  a.volume = lerp(progress, CONFIG.confettiAudioVolume);
  a.play().catch(() => {});
}

function playFailAudio() {
  const a = new Audio("_fail.mp3");
  a.volume = CONFIG.failAudioVolume;
  a.play().catch(() => {});
}

function playFail2Audio() {
  const a = new Audio("_fail2.mp3");
  a.volume = CONFIG.fail2AudioVolume;
  a.play().catch(() => {});
}

function playFireworksAudio() {
  const a = new Audio("_fireworks.mp3");
  a.volume = CONFIG.fireworksAudioVolume;
  a.play().catch(() => {});
}

/**
 * @param {Confetti} confetti
 * @param {KeyboardEvent} e
 */
function handleKeyup(confetti, e) {
  if (CONFIG.successKey.includes(e.key) || CONFIG.failKey.includes(e.key)) {
    const now = Date.now();
    if (now - __comboState.lastFire < 300) return;
    __comboState.lastFire = now;
  }

  if (CONFIG.failKey.includes(e.key)) {
    const host = document.querySelector("#kikuen-host");
    const shadow = host?.shadowRoot;
    const el = shadow?.querySelector(".expression");
    if (el instanceof HTMLElement) {
      el.classList.remove("shake");
      void el.offsetWidth;
      el.classList.add("shake");
      setTimeout(() => el.classList.remove("shake"), 200);
      __comboState.combo = 0;
      playFailAudio();
    }

    if (++__comboState.consecutiveFails >= CONFIG.failStreak) {
      __comboState.consecutiveFails = 0;
      roseBurst(confetti);
      playFail2Audio();
    }
  }

  if (CONFIG.successKey.includes(e.key)) {
    __comboState.consecutiveFails = 0;
    const count = ++__comboState.combo;

    const progress = Math.min(count, CONFIG.maxCombo);
    const spread = lerp(progress, CONFIG.spread);
    const particleCount = Math.round(lerp(progress, CONFIG.particleCount));
    const startVelocity = lerp(progress, CONFIG.startVelocity);
    const gravity = lerp(progress, CONFIG.gravity);
    const origin1 = { x: 0, y: 1 };
    const origin2 = { x: 1, y: 1 };

    void confetti({ angle: 60, origin: origin1, spread, particleCount, startVelocity, gravity });
    void confetti({ angle: 120, origin: origin2, spread, particleCount, startVelocity, gravity });
    playConfettiAudio(progress);

    if (CONFIG.fireworksCheckpoints.includes(count)) {
      fireworks(confetti, CONFIG.fireworksDuration);
      starBurst(confetti);
      playFireworksAudio();
    }
  }
}

export function setupConfetti() {
  if (__comboState.loaded) return;
  __comboState.loaded = true;

  import(CDN_URL)
    .then((mod) => {
      const confetti = /** @type {Confetti} */ (mod.default);
      document.addEventListener("keyup", (e) => handleKeyup(confetti, e));
    })
    .catch(() => {});
}

/**
 * @typedef {typeof import("./canvas-convetti")} Confetti
 * @typedef {{ lastFire: number; combo: number; consecutiveFails: number; loaded: boolean }} ComboState
 * @typedef {{
 *   successKey: string[];
 *   failKey: string[];
 *   maxCombo: number;
 *   fireworksCheckpoints: number[];
 *   particleCount: [number, number];
 *   startVelocity: [number, number];
 *   gravity: [number, number];
 *   spread: [number, number];
 *   fireworksDuration: number;
 *   failStreak: number;
 *   confettiAudioVolume: [number, number];
 *   failAudioVolume: number;
 *   fail2AudioVolume: number;
 *   fireworksAudioVolume: number;
 * }} Config
 */
