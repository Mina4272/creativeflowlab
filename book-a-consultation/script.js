const form = document.querySelector("#consultation-form");
const statusElement = document.querySelector("#form-status");

const FORM_ENDPOINT = "https://formsubmit.co/ajax/yuchieh4272@gmail.com";

function setStatus(message, type = "") {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.className = `form-status${type ? ` is-${type}` : ""}`;
}

function validateForm() {
  if (!form) return false;
  let isValid = true;

  form.querySelectorAll("[required]").forEach((field) => {
    const valid = field.checkValidity();
    field.setAttribute("aria-invalid", String(!valid));
    if (!valid) isValid = false;
  });

  return isValid;
}

if (form) {
  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      if (field.hasAttribute("aria-invalid")) {
        field.setAttribute("aria-invalid", String(!field.checkValidity()));
      }
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    const honeypot = form.querySelector(".honeypot");
    if (honeypot && honeypot.value) return;

    if (!validateForm()) {
      setStatus(localizedText("Please complete the required fields.", "請完成必填欄位。"), "error");
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = localizedText("SENDING...", "送出中...");

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Submission failed");

      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
      setStatus(localizedText("Thank you. Your inquiry has been sent.", "謝謝你，諮詢需求已送出。"), "success");
    } catch (error) {
      setStatus(localizedText("The message could not be sent. Please try again later.", "訊息暫時無法送出，請稍後再試。"), "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = localizedText("SEND INQUIRY", "送出諮詢");
    }
  });
}


const stage = document.querySelector(".consultation-page");
const lightToggle = document.querySelector(".light-toggle");
const lightToggleText = document.querySelector(".light-toggle-text");
const languageToggle = document.querySelector(".consult-language-toggle");
const languageToggleText = document.querySelector("[data-language-text]");
const popSound = document.querySelector("#bubble-pop-sound");
const messageForm = document.querySelector(".message-form");
const themeStorageKey = "lyra-light-mode";
const languageStorageKey = "lyra-consultation-language";
let currentLanguage = "zh";

function setLightMode(isDark) {
  if (!stage || !lightToggle) return;
  stage.classList.toggle("is-dark", isDark);
  document.body.classList.toggle("is-dark", isDark);
  lightToggle.setAttribute("aria-pressed", String(isDark));
  if (lightToggleText) lightToggleText.textContent = isDark ? "LIGHT ON" : "LIGHT OFF";

  document.querySelectorAll(".floating-folder img").forEach((image) => {
    if (!image.dataset.lightSrc) image.dataset.lightSrc = image.getAttribute("src");
    image.setAttribute("src", isDark ? "../assets/dark-folder-icon.png" : image.dataset.lightSrc);
  });
}

function readLightMode() {
  try { return localStorage.getItem(themeStorageKey) === "dark"; } catch (_) { return false; }
}
function saveLightMode(isDark) {
  try { localStorage.setItem(themeStorageKey, isDark ? "dark" : "light"); } catch (_) {}
}
function playPop() {
  if (!popSound) return;
  const sound = popSound.cloneNode(true);
  sound.volume = 0.72;
  sound.play().catch(() => {});
}

function localizedText(en, zh) {
  return currentLanguage === "zh" ? zh : en;
}

function setLanguage(language) {
  currentLanguage = language === "en" ? "en" : "zh";
  const isChinese = currentLanguage === "zh";

  document.documentElement.lang = isChinese ? "zh-Hant" : "en";
  document.title = isChinese ? "預約諮詢 | Creative Flow Lab" : "Book a Consultation | Creative Flow Lab";

  if (stage) {
    stage.classList.toggle("is-zh", isChinese);
    stage.setAttribute("aria-label", isChinese ? "預約諮詢" : "Book a Consultation");
  }

  const description = document.querySelector("meta[name='description']");
  if (description) {
    description.setAttribute(
      "content",
      isChinese
        ? "預約 Creative Flow Lab 諮詢，討論品牌、網站、App、系統與數位專案。"
        : "Book a consultation with Creative Flow Lab for branding, websites, apps, systems, and digital projects."
    );
  }

  document.querySelectorAll("[data-en][data-zh]").forEach((element) => {
    element.innerHTML = element.dataset[currentLanguage] || element.dataset.en;
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

function readLanguage() {
  try {
    return localStorage.getItem(languageStorageKey) === "en" ? "en" : "zh";
  } catch (_) {
    return "zh";
  }
}

function saveLanguage(language) {
  try {
    localStorage.setItem(languageStorageKey, language);
  } catch (_) {}
}

setLightMode(readLightMode());
setLanguage(readLanguage());
lightToggle?.addEventListener("click", () => {
  const next = !stage.classList.contains("is-dark");
  setLightMode(next);
  saveLightMode(next);
  playPop();
});

languageToggle?.addEventListener("click", () => {
  const nextLanguage = currentLanguage === "zh" ? "en" : "zh";
  setLanguage(nextLanguage);
  saveLanguage(nextLanguage);
  playPop();
});

document.querySelectorAll(".nav-hotspots .hotspot, .floating-folder, .consult-language-toggle").forEach((target) => {
  target.addEventListener("pointerenter", playPop);
});

messageForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#consultation-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
});
