const bubbleTargets = document.querySelectorAll(".folder, .nav-hotspots .hotspot, .light-toggle");
const messageForm = document.querySelector(".message-form");
const popSound = document.querySelector("#bubble-pop-sound");
const stage = document.querySelector(".stage");
const lightToggle = document.querySelector(".light-toggle");
const lightToggleText = document.querySelector(".light-toggle-text");
const themeStorageKey = "lyra-light-mode";
const darkImageTargets = [
  {
    elements: document.querySelectorAll(".portrait-scene img"),
    darkSrc: "assets/dark-portrait-scene.png",
  },
  {
    elements: document.querySelectorAll(".folder img"),
    darkSrc: "assets/dark-folder-icon.png",
  },
];

let audioUnlocked = false;
let lastPopAt = 0;

function makeSoundCopy() {
  const sound = popSound.cloneNode(true);
  sound.volume = popSound.volume;
  sound.muted = false;
  return sound;
}

function playBubblePop(force = false) {
  if (!popSound) {
    return;
  }

  const now = Date.now();

  if (!force && now - lastPopAt < 140) {
    return;
  }

  lastPopAt = now;

  const sound = makeSoundCopy();
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function unlockAudio() {
  if (audioUnlocked || !popSound) {
    return;
  }

  popSound.volume = 0.78;
  popSound.load();
  audioUnlocked = true;
}

["pointerdown", "keydown", "touchstart"].forEach((eventName) => {
  window.addEventListener(eventName, unlockAudio, { once: true, capture: true });
});

bubbleTargets.forEach((target) => {
  const handleEnter = () => {
    target.classList.add("is-hovered");
    playBubblePop();
  };

  target.addEventListener("pointerenter", handleEnter);
  target.addEventListener("mouseenter", handleEnter);

  target.addEventListener("pointerleave", () => {
    target.classList.remove("is-hovered");
  });

  target.addEventListener("pointerdown", () => {
    playBubblePop(true);
  });

  target.addEventListener("focus", () => {
    target.classList.add("is-hovered");
  });

  target.addEventListener("blur", () => {
    target.classList.remove("is-hovered");
  });
});

if (messageForm) {
  messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });
}

function setLightMode(isDark) {
  if (!stage || !lightToggle) {
    return;
  }

  stage.classList.toggle("is-dark", isDark);
  document.body.classList.toggle("is-dark", isDark);
  lightToggle.setAttribute("aria-pressed", String(isDark));
  swapDarkImages(isDark);

  if (lightToggleText) {
    lightToggleText.textContent = isDark ? "LIGHT ON" : "LIGHT OFF";
  }
}

function swapDarkImages(isDark) {
  darkImageTargets.forEach(({ elements, darkSrc }) => {
    elements.forEach((image) => {
      if (!image.dataset.lightSrc) {
        image.dataset.lightSrc = image.getAttribute("src");
      }

      image.setAttribute("src", isDark ? darkSrc : image.dataset.lightSrc);
    });
  });
}

function saveLightMode(isDark) {
  try {
    localStorage.setItem(themeStorageKey, isDark ? "dark" : "light");
  } catch (error) {
    return;
  }
}

function readLightMode() {
  try {
    return localStorage.getItem(themeStorageKey) === "dark";
  } catch (error) {
    return false;
  }
}

setLightMode(readLightMode());

if (lightToggle) {
  lightToggle.addEventListener("click", () => {
    const nextIsDark = !stage.classList.contains("is-dark");
    setLightMode(nextIsDark);
    saveLightMode(nextIsDark);
  });
}
