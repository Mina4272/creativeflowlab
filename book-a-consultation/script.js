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
      setStatus("Please complete the required fields.", "error");
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "SENDING...";

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (!response.ok) throw new Error("Submission failed");

      form.reset();
      form.querySelectorAll("[aria-invalid]").forEach((field) => field.removeAttribute("aria-invalid"));
      setStatus("Thank you. Your inquiry has been sent.", "success");
    } catch (error) {
      setStatus("The message could not be sent. Please try again later.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "SEND INQUIRY";
    }
  });
}


const stage = document.querySelector(".consultation-page");
const lightToggle = document.querySelector(".light-toggle");
const lightToggleText = document.querySelector(".light-toggle-text");
const popSound = document.querySelector("#bubble-pop-sound");
const messageForm = document.querySelector(".message-form");
const themeStorageKey = "lyra-light-mode";

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

setLightMode(readLightMode());
lightToggle?.addEventListener("click", () => {
  const next = !stage.classList.contains("is-dark");
  setLightMode(next);
  saveLightMode(next);
  playPop();
});

document.querySelectorAll(".nav-hotspots .hotspot, .floating-folder").forEach((target) => {
  target.addEventListener("pointerenter", playPop);
});

messageForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  document.querySelector("#consultation-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
});
