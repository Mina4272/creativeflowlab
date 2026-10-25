const bubbleTargets = document.querySelectorAll(".folder, .nav-hotspots .hotspot, .light-toggle, .language-toggle");
const messageForm = document.querySelector(".message-form");
const popSound = document.querySelector("#bubble-pop-sound");
const stage = document.querySelector(".stage");
const lightToggle = document.querySelector(".light-toggle");
const lightToggleText = document.querySelector(".light-toggle-text");
const languageToggle = document.querySelector(".language-toggle");
const languageToggleText = document.querySelector("[data-language-text]");
const brandWebsiteView = document.querySelector(".brand-website-view");
const articlesView = document.querySelector(".articles-view");
const galleryDesktop = document.querySelector(".gallery-desktop");
const galleryWindow = document.querySelector(".gallery-window");
const galleryGrid = document.querySelector(".gallery-grid");
const galleryViewer = document.querySelector(".gallery-viewer");
const galleryViewerImage = document.querySelector("[data-gallery-viewer-image]");
const galleryCaption = document.querySelector("[data-gallery-caption]");
const galleryUploadInput = document.querySelector("[data-gallery-upload]");
const galleryDeleteButtons = [...document.querySelectorAll("[data-gallery-delete]")];
const galleryStatus = document.querySelector("[data-gallery-status]");
let galleryFiles = [...document.querySelectorAll(".gallery-file")];
const themeStorageKey = "lyra-light-mode";
const languageStorageKey = "lyra-language-v2";
const galleryDeletedStorageKey = "lyra-gallery-deleted-defaults-v1";
const galleryDatabaseName = "lyra-gallery-v1";
const galleryStoreName = "images";
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
let activeGalleryIndex = 0;
let activeGalleryId = null;
let galleryDrag = null;
let galleryDatabasePromise = null;
const galleryObjectUrls = new Map();

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
}

function setArticlesView(isVisible) {
  if (!articlesView) {
    return;
  }

  articlesView.setAttribute("aria-hidden", String(!isVisible));
  articlesView.style.display = isVisible ? "block" : "none";
}

function setGalleryStatus(message, isError = false) {
  if (!galleryStatus) {
    return;
  }

  galleryStatus.textContent = message;
  galleryStatus.classList.toggle("is-error", isError);
}

function refreshGalleryFiles() {
  galleryFiles = [...document.querySelectorAll(".gallery-file")];
  galleryFiles.forEach((file, index) => {
    file.dataset.galleryIndex = String(index);
  });
}

function setGallerySelection(file) {
  activeGalleryId = file?.dataset.galleryId || null;
  galleryFiles.forEach((item) => {
    item.classList.toggle("is-selected", item === file);
  });
  galleryDeleteButtons.forEach((button) => {
    button.disabled = !file;
  });
}

function readDeletedGalleryDefaults() {
  try {
    const stored = JSON.parse(localStorage.getItem(galleryDeletedStorageKey) || "[]");
    return Array.isArray(stored) ? new Set(stored) : new Set();
  } catch {
    return new Set();
  }
}

function saveDeletedGalleryDefaults(ids) {
  localStorage.setItem(galleryDeletedStorageKey, JSON.stringify([...ids]));
}

function openGalleryDatabase() {
  if (!galleryDatabasePromise) {
    galleryDatabasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(galleryDatabaseName, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(galleryStoreName)) {
          database.createObjectStore(galleryStoreName, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  return galleryDatabasePromise;
}

async function readUploadedGalleryImages() {
  const database = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(galleryStoreName, "readonly").objectStore(galleryStoreName).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => a.createdAt - b.createdAt));
    request.onerror = () => reject(request.error);
  });
}

async function saveUploadedGalleryImage(image) {
  const database = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(galleryStoreName, "readwrite").objectStore(galleryStoreName).put(image);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function removeUploadedGalleryImage(id) {
  const database = await openGalleryDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(galleryStoreName, "readwrite").objectStore(galleryStoreName).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function galleryLabelFromName(name) {
  return name.replace(/\.[^.]+$/, "").slice(0, 48) || "uploaded_image";
}

function createUploadedGalleryFile(image) {
  const file = document.createElement("button");
  const thumbnail = document.createElement("img");
  const label = document.createElement("span");
  const objectUrl = URL.createObjectURL(image.blob);

  galleryObjectUrls.set(image.id, objectUrl);
  file.className = "gallery-file";
  file.type = "button";
  file.dataset.galleryId = image.id;
  file.dataset.galleryKind = "uploaded";
  thumbnail.src = objectUrl;
  thumbnail.alt = image.name;
  label.textContent = galleryLabelFromName(image.name);
  file.append(thumbnail, label);
  return file;
}

async function initializeGalleryStorage() {
  if (!galleryGrid) {
    return;
  }

  const deletedDefaults = readDeletedGalleryDefaults();
  galleryFiles.forEach((file) => {
    if (deletedDefaults.has(file.dataset.galleryId)) {
      file.remove();
    }
  });

  try {
    const uploadedImages = await readUploadedGalleryImages();
    uploadedImages.forEach((image) => galleryGrid.append(createUploadedGalleryFile(image)));
  } catch {
    setGalleryStatus("Uploads are unavailable in this browser.", true);
  }

  refreshGalleryFiles();
}

async function uploadGalleryImages(files) {
  const images = [...files].filter((file) => file.type.startsWith("image/"));

  if (!images.length) {
    setGalleryStatus("Choose an image file.", true);
    return;
  }

  setGalleryStatus("Uploading...");
  let uploadedCount = 0;

  try {
    for (const imageFile of images) {
      const id = `upload-${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`;
      const image = {
        id,
        name: imageFile.name,
        type: imageFile.type,
        blob: imageFile,
        createdAt: Date.now() + uploadedCount,
      };
      await saveUploadedGalleryImage(image);
      galleryGrid.append(createUploadedGalleryFile(image));
      uploadedCount += 1;
    }

    refreshGalleryFiles();
    setGalleryStatus(`${uploadedCount} image${uploadedCount === 1 ? "" : "s"} uploaded.`);
  } catch {
    setGalleryStatus("The upload could not be saved.", true);
  }
}

async function deleteSelectedGalleryImage() {
  const file = galleryFiles.find((item) => item.dataset.galleryId === activeGalleryId);
  if (!file) {
    return;
  }

  const label = file.querySelector("span")?.textContent || "this image";
  if (!window.confirm(`Delete ${label}?`)) {
    return;
  }

  const removedIndex = galleryFiles.indexOf(file);

  try {
    if (file.dataset.galleryKind === "uploaded") {
      await removeUploadedGalleryImage(activeGalleryId);
      const objectUrl = galleryObjectUrls.get(activeGalleryId);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        galleryObjectUrls.delete(activeGalleryId);
      }
    } else {
      const deletedDefaults = readDeletedGalleryDefaults();
      deletedDefaults.add(activeGalleryId);
      saveDeletedGalleryDefaults(deletedDefaults);
    }

    file.remove();
    refreshGalleryFiles();
    activeGalleryId = null;

    if (galleryFiles.length && galleryViewer?.classList.contains("is-open")) {
      openGalleryImage(Math.min(removedIndex, galleryFiles.length - 1));
    } else {
      closeGalleryImage();
      setGallerySelection(null);
    }

    setGalleryStatus(`${label} deleted.`);
  } catch {
    setGalleryStatus("The image could not be deleted.", true);
  }
}

function setGalleryView(isVisible) {
  if (!galleryDesktop) {
    return;
  }

  galleryDesktop.classList.toggle("is-visible", isVisible);
  galleryDesktop.setAttribute("aria-hidden", String(!isVisible));

  if (galleryWindow) {
    galleryWindow.classList.add("is-minimized");
  }

  closeGalleryImage();
}

function openGalleryImage(index) {
  const file = galleryFiles[index];
  const image = file?.querySelector("img");
  const label = file?.querySelector("span")?.textContent;

  if (!file || !image || !galleryViewer || !galleryViewerImage) {
    return;
  }

  activeGalleryIndex = index;
  setGallerySelection(file);
  galleryViewerImage.src = image.src;
  galleryViewerImage.alt = image.alt;
  if (galleryCaption) {
    galleryCaption.textContent = label || image.alt;
  }
  galleryViewer.classList.add("is-open");
  galleryViewer.setAttribute("aria-hidden", "false");

  const previousButton = galleryViewer.querySelector("[data-gallery-prev]");
  const nextButton = galleryViewer.querySelector("[data-gallery-next]");
  if (previousButton) {
    previousButton.disabled = index === 0;
  }
  if (nextButton) {
    nextButton.disabled = index === galleryFiles.length - 1;
  }
}

function closeGalleryImage() {
  if (!galleryViewer) {
    return;
  }

  galleryViewer.classList.remove("is-open");
  galleryViewer.setAttribute("aria-hidden", "true");
}

function syncHashView() {
  const isBrandView = ["#vanchuan-design", "#vanchaun-design", "#brand-websites"].includes(window.location.hash);
  const isArticlesView = window.location.hash === "#articles";
  const isGalleryView = window.location.hash === "#gallery";
  setBrandWebsiteView(isBrandView);
  setArticlesView(isArticlesView);
  setGalleryView(isGalleryView);

  const isFullScreenView = isBrandView || isArticlesView || isGalleryView;
  document.documentElement.style.overflow = isFullScreenView ? "hidden" : "";
  document.body.style.overflow = isFullScreenView ? "hidden" : "";

  if (isFullScreenView) {
    requestAnimationFrame(() => window.scrollTo(0, 0));
  }
}

setLightMode(readLightMode());
setLanguage(readLanguage());
syncHashView();
initializeGalleryStorage();

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

galleryGrid?.addEventListener("click", (event) => {
  const file = event.target.closest(".gallery-file");
  if (!file) {
    return;
  }

  openGalleryImage(galleryFiles.indexOf(file));
});

galleryUploadInput?.addEventListener("change", async () => {
  await uploadGalleryImages(galleryUploadInput.files || []);
  galleryUploadInput.value = "";
});

galleryDeleteButtons.forEach((button) => {
  button.addEventListener("click", deleteSelectedGalleryImage);
});

document.querySelectorAll("[data-gallery-open]").forEach((button) => {
  button.addEventListener("click", () => {
    galleryWindow?.classList.remove("is-minimized");
  });
});

document.querySelector("[data-gallery-minimize]")?.addEventListener("click", () => {
  closeGalleryImage();
  galleryWindow?.classList.add("is-minimized");
});

document.querySelector("[data-gallery-maximize]")?.addEventListener("click", () => {
  galleryWindow?.classList.toggle("is-maximized");
  galleryWindow.style.transform = "";
});

document.querySelector("[data-gallery-close]")?.addEventListener("click", () => {
  closeGalleryImage();
  galleryWindow?.classList.add("is-minimized");
});

document.querySelector("[data-gallery-viewer-close]")?.addEventListener("click", closeGalleryImage);
document.querySelector("[data-gallery-prev]")?.addEventListener("click", () => openGalleryImage(activeGalleryIndex - 1));
document.querySelector("[data-gallery-next]")?.addEventListener("click", () => openGalleryImage(activeGalleryIndex + 1));

document.querySelector("[data-gallery-drag]")?.addEventListener("pointerdown", (event) => {
  if (!galleryWindow || galleryWindow.classList.contains("is-maximized") || event.target.closest("button")) {
    return;
  }

  galleryDrag = {
    startX: event.clientX,
    startY: event.clientY,
    offsetX: galleryWindow.offsetLeft,
    offsetY: galleryWindow.offsetTop,
  };
  event.currentTarget.setPointerCapture(event.pointerId);
});

window.addEventListener("pointermove", (event) => {
  if (!galleryDrag || !galleryWindow) {
    return;
  }

  const maxX = Math.max(0, window.innerWidth - galleryWindow.offsetWidth);
  const maxY = Math.max(0, window.innerHeight - galleryWindow.offsetHeight - 42);
  const nextX = Math.min(maxX, Math.max(0, galleryDrag.offsetX + event.clientX - galleryDrag.startX));
  const nextY = Math.min(maxY, Math.max(0, galleryDrag.offsetY + event.clientY - galleryDrag.startY));
  galleryWindow.style.left = `${nextX}px`;
  galleryWindow.style.top = `${nextY}px`;
});

window.addEventListener("pointerup", () => {
  galleryDrag = null;
});

window.addEventListener("keydown", (event) => {
  if (!galleryViewer?.classList.contains("is-open")) {
    return;
  }

  if (event.key === "Escape") {
    closeGalleryImage();
  } else if (event.key === "ArrowLeft" && activeGalleryIndex > 0) {
    openGalleryImage(activeGalleryIndex - 1);
  } else if (event.key === "ArrowRight" && activeGalleryIndex < galleryFiles.length - 1) {
    openGalleryImage(activeGalleryIndex + 1);
  }
});
