const bubbleTargets = document.querySelectorAll(".folder, .nav-hotspots .hotspot, .light-toggle, .language-toggle");
const messageForm = document.querySelector(".message-form");
const popSound = document.querySelector("#bubble-pop-sound");
const stage = document.querySelector(".stage");
const lightToggle = document.querySelector(".light-toggle");
const lightToggleText = document.querySelector(".light-toggle-text");
const languageToggle = document.querySelector(".language-toggle");
const languageToggleText = document.querySelector("[data-language-text]");
const brandWebsiteView = document.querySelector(".brand-website-view");
const themeStorageKey = "lyra-light-mode";
const languageStorageKey = "lyra-language-v2";
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

function setLanguage(language) {
  const isChinese = language === "zh";

  document.documentElement.lang = isChinese ? "zh-Hant" : "en";

  if (stage) {
    stage.classList.toggle("is-zh", isChinese);
  }

  document.querySelectorAll("[data-en][data-zh]").forEach((element) => {
    element.innerHTML = element.dataset[language] || element.dataset.en;
  });

  document.querySelectorAll("[data-placeholder-en][data-placeholder-zh]").forEach((element) => {
    element.setAttribute("placeholder", element.dataset[`placeholder${isChinese ? "Zh" : "En"}`]);
  });

  document.querySelectorAll("[data-aria-en][data-aria-zh]").forEach((element) => {
    element.setAttribute("aria-label", element.dataset[`aria${isChinese ? "Zh" : "En"}`]);
  });

  if (languageToggle) {
    languageToggle.setAttribute("aria-pressed", String(isChinese));
    languageToggle.setAttribute("aria-label", isChinese ? "Switch language to English" : "切換成中文");
  }

  if (languageToggleText) {
    languageToggleText.textContent = isChinese ? "英" : "中";
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch (error) {
    return;
  }
}

function readLanguage() {
  try {
    return localStorage.getItem(languageStorageKey) === "en" ? "en" : "zh";
  } catch (error) {
    return "zh";
  }
}

function setBrandWebsiteView(isVisible) {
  if (!stage || !brandWebsiteView) {
    return;
  }

  stage.classList.toggle("is-brand-view", isVisible);
  brandWebsiteView.setAttribute("aria-hidden", String(!isVisible));
  brandWebsiteView.style.display = isVisible ? "block" : "none";
  document.documentElement.style.overflow = isVisible ? "hidden" : "";
  document.body.style.overflow = isVisible ? "hidden" : "";
}

function syncHashView() {
  const isBrandView = window.location.hash === "#brand-website";
  setBrandWebsiteView(isBrandView);

  if (isBrandView) {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }
}

setLightMode(readLightMode());
setLanguage(readLanguage());
syncHashView();

if (lightToggle) {
  lightToggle.addEventListener("click", () => {
    const nextIsDark = !stage.classList.contains("is-dark");
    setLightMode(nextIsDark);
    saveLightMode(nextIsDark);
  });
}

if (languageToggle) {
  languageToggle.addEventListener("click", () => {
    const nextLanguage = stage.classList.contains("is-zh") ? "en" : "zh";
    setLanguage(nextLanguage);
    saveLanguage(nextLanguage);
  });
}

window.addEventListener("hashchange", syncHashView);
