import {
  PRICING_BY_BEDROOM,
  BOX_DIMENSIONS,
  DEFAULT_PACK_ID,
} from "./pricing.js";

const AUTO_ADVANCE_DELAY = 350;
const TOTAL_STEPS = 8;
const API = {
  checkZip: "/api/check-zip",
  config: "/api/config",
  leads: "/api/leads",
  lead: (id) => `/api/leads/${encodeURIComponent(id)}`,
  paymentIntent: "/api/create-payment-intent",
};

const state = {
  recordId: null,
  bedrooms: null,
  packId: DEFAULT_PACK_ID,
  stripe: null,
  elements: null,
  paymentElement: null,
  clientSecret: null,
  paymentIntentId: null,
  stripeCustomerId: null,
  config: null,
  mapsReady: false,
  autocomplete: null,
};

const form = document.getElementById("quoteForm");
const steps = Array.from(document.querySelectorAll(".form-step"));
const successPanel = document.getElementById("successPanel");
const formError = document.getElementById("formError");
const heroHeader = document.getElementById("heroHeader");
const backBtn = document.getElementById("backBtn");
const stepLabel = document.getElementById("stepLabel");
const stepPercent = document.getElementById("stepPercent");
const stepProgressFill = document.getElementById("stepProgressFill");
const packOptionsEl = document.getElementById("packOptions");

let currentStep = 0;
let advancing = false;

document.getElementById("year").textContent = new Date().getFullYear();

function digitsOnly(value) {
  return value.replace(/\D/g, "");
}

function isValidZip(value) {
  return /^\d{5}$/.test(value);
}

function normalizePhoneDigits(value) {
  let digits = digitsOnly(value);
  if (digits.length === 11 && digits.charAt(0) === "1") {
    digits = digits.slice(1);
  }
  return digits;
}

function isValidPhone(value) {
  const digits = normalizePhoneDigits(value);
  if (digits.length !== 10) return false;
  if (digits.charAt(0) === "1" || digits.charAt(0) === "0") return false;
  if (digits.charAt(3) === "0" || digits.charAt(3) === "1") return false;
  return true;
}

function getRadioValue(name) {
  const selected = form.querySelector(`input[name="${name}"]:checked`);
  return selected ? selected.value : "";
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.add("visible");
}

function hideFormError() {
  formError.classList.remove("visible");
}

function updateProgress() {
  const stepNum = currentStep + 1;
  const pct = Math.round((stepNum / TOTAL_STEPS) * 100);
  stepLabel.textContent = `Step ${stepNum} of ${TOTAL_STEPS}`;
  stepPercent.textContent = `${pct}%`;
  stepProgressFill.style.width = `${pct}%`;
  backBtn.hidden = currentStep === 0;
}

function focusStepInput(stepEl) {
  const focusable = stepEl.querySelector(
    'input:not([type=radio]):not([type=hidden]):not([readonly]), button[data-continue], button[data-submit-contact], button[data-pay]'
  );
  if (focusable) {
    setTimeout(() => focusable.focus(), 320);
  }
}

function syncStepFieldState(activeIndex) {
  steps.forEach((step, i) => {
    const inactive = i !== activeIndex;
    step.querySelectorAll("input, select, textarea").forEach((el) => {
      el.disabled = inactive;
    });
  });
}

function showStep(index) {
  if (index < 0 || index >= steps.length) return;

  steps.forEach((step, i) => {
    step.classList.toggle("active", i === index);
  });

  currentStep = index;
  syncStepFieldState(index);
  updateProgress();
  focusStepInput(steps[index]);
  hideFormError();

  if (index === 3) {
    renderPackOptions();
  }
  if (index === 5) {
    initAddressAutocomplete();
  }
  if (index === 7) {
    initPaymentStep();
  }
}

function goNext() {
  if (advancing || currentStep >= steps.length - 1) return;
  advancing = true;
  showStep(currentStep + 1);
  setTimeout(() => {
    advancing = false;
  }, AUTO_ADVANCE_DELAY);
}

function goBack() {
  if (currentStep <= 0) return;
  showStep(currentStep - 1);
}

async function checkZipServiced(zip, errorEl, inputEl) {
  if (!isValidZip(zip)) {
    inputEl.classList.add("invalid");
    errorEl.textContent = "Enter a valid 5-digit zip code.";
    errorEl.classList.add("visible");
    return false;
  }

  try {
    const res = await fetch(API.checkZip, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Zip check failed");
    }
    if (!data.serviced) {
      inputEl.classList.add("invalid");
      errorEl.textContent =
        data.message || "We don't service moving to that zip code yet.";
      errorEl.classList.add("visible");
      return false;
    }
    inputEl.classList.remove("invalid");
    errorEl.classList.remove("visible");
    return true;
  } catch {
    showFormError("Unable to verify zip code. Please try again.");
    return false;
  }
}

function renderPackOptions() {
  const bedroomKey = state.bedrooms || getRadioValue("bedrooms");
  state.bedrooms = bedroomKey;
  const tier = PRICING_BY_BEDROOM[bedroomKey];
  if (!tier || !packOptionsEl) return;

  packOptionsEl.innerHTML = "";
  const packOrder = ["light", "standard", "heavy"];

  packOrder.forEach((packKey) => {
    const pack = tier.packs[packKey];
    const id = `pack-${packKey}`;
    const checked = packKey === (state.packId || DEFAULT_PACK_ID);

    const article = document.createElement("article");
    article.className = "pack-card option";
    article.innerHTML = `
      <input type="radio" name="pack" id="${id}" value="${packKey}" ${checked ? "checked" : ""}>
      <label for="${id}">
        <span class="pack-title">${pack.icon} ${pack.name}</span>
        <ul class="pack-features">
          <li>${pack.boxes} boxes (${BOX_DIMENSIONS})</li>
          <li>${pack.dollies} dolly${pack.dollies > 1 ? "ies" : ""}</li>
          <li>${pack.packingPaperLbs} lbs packing paper</li>
          <li>Dry erase markers</li>
          <li>Free delivery &amp; pickup</li>
        </ul>
        <p class="pack-price"><strong>$${pack.weekly}/week</strong> · $${pack.additionalWeek}/additional week</p>
      </label>
    `;
    packOptionsEl.appendChild(article);
  });

  state.packId = getRadioValue("pack") || DEFAULT_PACK_ID;
  packOptionsEl.querySelectorAll('input[name="pack"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      state.packId = radio.value;
    });
  });
}

function getSelectedPack() {
  const bedroomKey = state.bedrooms || getRadioValue("bedrooms");
  const packKey = getRadioValue("pack") || state.packId || DEFAULT_PACK_ID;
  const tier = PRICING_BY_BEDROOM[bedroomKey];
  if (!tier) return null;
  return { bedroomKey, tier, pack: tier.packs[packKey], packKey };
}

function packDetailsLine(pack) {
  return `${pack.boxes} boxes, ${pack.dollies} dolly, ${pack.packingPaperLbs} lbs paper, dry erase markers`;
}

function collectLeadPayload(partial = {}) {
  const selection = getSelectedPack();
  const pack = selection?.pack;

  return {
    zipFrom: document.getElementById("zipFrom").value,
    zipTo: document.getElementById("zipTo").value,
    rooms: selection?.tier?.label || "",
    packName: pack ? `${pack.icon} ${pack.name}` : "",
    weeklyRate: pack?.weekly ?? null,
    additionalWeekRate: pack?.additionalWeek ?? null,
    packDetails: pack ? packDetailsLine(pack) : "",
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    phone: normalizePhoneDigits(document.getElementById("phone").value),
    submittedAt: new Date().toISOString(),
    source: "landing-page",
    depositStatus: "Pending",
    ...partial,
  };
}

function syncDropoffStreetFromSearch() {
  const street = document.getElementById("addressSearch").value.trim();
  document.getElementById("dropoffStreet").value = street;
  return street;
}

function resetAddressDetails() {
  document.getElementById("dropoffStreet").value = "";
  document.getElementById("dropoffCity").value = "";
  document.getElementById("dropoffState").value = "";
  document.getElementById("dropoffZip").value = "";
  document.getElementById("addressFields").hidden = true;
  document.getElementById("addressSearch").classList.remove("invalid");
  ["dropoffCity", "dropoffState", "dropoffZip"].forEach((id) => {
    document.getElementById(id).classList.remove("invalid");
  });
}

function collectDropoffPayload() {
  return {
    dropoffStreet: syncDropoffStreetFromSearch(),
    dropoffCity: document.getElementById("dropoffCity").value.trim(),
    dropoffState: document.getElementById("dropoffState").value.trim(),
    dropoffZip: document.getElementById("dropoffZip").value.trim(),
    dropoffDate: document.getElementById("dropoffDate").value,
    dropoffTime: document.getElementById("dropoffTime").value,
  };
}

function validateDropoffAddress() {
  const searchEl = document.getElementById("addressSearch");
  const detailsEl = document.getElementById("addressFields");
  const street = syncDropoffStreetFromSearch();
  let valid = true;

  if (!street) {
    searchEl.classList.add("invalid");
    valid = false;
  } else {
    searchEl.classList.remove("invalid");
  }

  if (detailsEl.hidden) {
    valid = false;
  }

  ["dropoffCity", "dropoffState", "dropoffZip"].forEach((id) => {
    const el = document.getElementById(id);
    const empty = !el.value.trim();
    el.classList.toggle("invalid", empty);
    if (empty) valid = false;
  });

  document.getElementById("addressError").classList.toggle("visible", !valid);
  return valid;
}

function validateDropoffSchedule() {
  const dateEl = document.getElementById("dropoffDate");
  const timeEl = document.getElementById("dropoffTime");
  let valid = true;
  if (!dateEl.value) {
    dateEl.classList.add("invalid");
    valid = false;
  } else {
    dateEl.classList.remove("invalid");
  }
  if (!timeEl.value) {
    timeEl.classList.add("invalid");
    valid = false;
  } else {
    timeEl.classList.remove("invalid");
  }
  document.getElementById("scheduleError").classList.toggle("visible", !valid);
  return valid;
}

function validateContactStep() {
  const firstName = document.getElementById("firstName");
  const lastName = document.getElementById("lastName");
  const phone = document.getElementById("phone");
  const phoneErr = document.getElementById("phoneError");
  let valid = true;

  [firstName, lastName].forEach((el) => {
    const empty = !el.value.trim();
    el.classList.toggle("invalid", empty);
    if (empty) valid = false;
  });

  phoneErr.classList.remove("visible");
  phone.classList.remove("invalid");

  if (!isValidPhone(phone.value)) {
    phone.classList.add("invalid");
    phoneErr.classList.add("visible");
    valid = false;
  }

  return valid;
}

function bindZipInput(input, errorEl) {
  input.addEventListener("input", () => {
    const cleaned = digitsOnly(input.value).slice(0, 5);
    if (input.value !== cleaned) input.value = cleaned;
    input.classList.toggle("invalid", cleaned.length > 0 && cleaned.length !== 5);
    errorEl.classList.remove("visible");
  });
}

function bindPhoneInput(input, errorEl) {
  input.addEventListener("input", () => {
    let digits = normalizePhoneDigits(input.value).slice(0, 10);
    if (digits.length > 0 && digits.charAt(0) === "1") {
      digits = digits.slice(1);
    }
    if (input.value !== digits) input.value = digits;
    errorEl.classList.remove("visible");
    input.classList.remove("invalid");
  });
}

bindZipInput(document.getElementById("zipFrom"), document.getElementById("zipFromError"));
bindZipInput(document.getElementById("zipTo"), document.getElementById("zipToError"));
bindPhoneInput(document.getElementById("phone"), document.getElementById("phoneError"));

document.querySelectorAll("[data-auto-advance]").forEach((stepEl) => {
  stepEl.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      if (parseInt(stepEl.dataset.step, 10) !== currentStep) return;
      if (radio.name === "bedrooms") {
        state.bedrooms = radio.value;
        state.packId = DEFAULT_PACK_ID;
      }
      setTimeout(goNext, AUTO_ADVANCE_DELAY);
    });
  });
});

document.querySelectorAll("[data-continue]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const stepEl = btn.closest(".form-step");
    const stepIndex = parseInt(stepEl.dataset.step, 10);
    if (stepIndex !== currentStep) return;

    hideFormError();
    btn.disabled = true;

    try {
      if (stepIndex === 0) {
        const zip = document.getElementById("zipFrom").value;
        const ok = await checkZipServiced(
          zip,
          document.getElementById("zipFromError"),
          document.getElementById("zipFrom")
        );
        if (!ok) return;
      } else if (stepIndex === 1) {
        const zip = document.getElementById("zipTo").value;
        const ok = await checkZipServiced(
          zip,
          document.getElementById("zipToError"),
          document.getElementById("zipTo")
        );
        if (!ok) return;
      } else if (stepIndex === 3) {
        state.packId = getRadioValue("pack") || DEFAULT_PACK_ID;
        if (!state.packId) return;
      } else if (stepIndex === 5) {
        if (!validateDropoffAddress()) return;
      } else if (stepIndex === 6) {
        if (!validateDropoffSchedule()) return;
      }

      goNext();
    } finally {
      btn.disabled = false;
    }
  });
});

document.querySelector('[data-submit-contact]')?.addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  if (currentStep !== 4) return;
  if (!validateContactStep()) {
    return;
  }

  hideFormError();
  btn.disabled = true;
  btn.textContent = "Saving…";

  try {
    const res = await fetch(API.leads, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(collectLeadPayload()),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Failed to save");
    }
    state.recordId = data.recordId;
    goNext();
  } catch (err) {
    showFormError(err.message || "Something went wrong. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Next";
  }
});

backBtn.addEventListener("click", goBack);

["zipFrom", "zipTo"].forEach((id, idx) => {
  document.getElementById(id).addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentStep === idx) {
        document.querySelector(`[data-step="${idx}"] [data-continue]`)?.click();
      }
    }
  });
});

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function ensureConfig() {
  if (state.config) return state.config;
  const res = await fetch(API.config);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Config unavailable");
  state.config = data;
  return data;
}

async function ensureGoogleMaps() {
  if (state.mapsReady) return;
  const config = await ensureConfig();
  if (!config.googleMapsApiKey) {
    throw new Error("Google Maps API key is not configured");
  }
  await loadScript(
    `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.googleMapsApiKey)}&libraries=places`
  );
  state.mapsReady = true;
}

function fillAddressFromPlace(place) {
  const components = {};
  for (const c of place.address_components || []) {
    const type = c.types[0];
    components[type] = c.long_name;
    if (c.types.includes("administrative_area_level_1")) {
      components.state = c.short_name;
    }
  }

  const streetNumber = components.street_number || "";
  const route = components.route || "";
  const street = [streetNumber, route].filter(Boolean).join(" ");
  const streetLine =
    street || place.name || place.formatted_address?.split(",")[0]?.trim() || "";

  const searchEl = document.getElementById("addressSearch");
  searchEl.value = streetLine;
  document.getElementById("dropoffStreet").value = streetLine;
  document.getElementById("dropoffCity").value =
    components.locality || components.postal_town || components.sublocality || "";
  document.getElementById("dropoffState").value = components.state || "";
  document.getElementById("dropoffZip").value = components.postal_code || "";

  searchEl.classList.remove("invalid");
  document.getElementById("addressError").classList.remove("visible");
  document.getElementById("addressFields").hidden = false;
}

async function initAddressAutocomplete() {
  try {
    await ensureGoogleMaps();
    const input = document.getElementById("addressSearch");
    if (!input || state.autocomplete) return;

    state.autocomplete = new google.maps.places.Autocomplete(input, {
      types: ["address"],
      componentRestrictions: { country: "us" },
      fields: ["address_components", "formatted_address", "name"],
    });

    state.autocomplete.addListener("place_changed", () => {
      const place = state.autocomplete.getPlace();
      if (!place || !place.address_components) return;
      fillAddressFromPlace(place);
    });

    input.addEventListener("input", () => {
      if (!input.value.trim()) {
        resetAddressDetails();
      }
    });
  } catch (err) {
    showFormError(err.message || "Address lookup is unavailable.");
  }
}

function buildTimeOptions() {
  const select = document.getElementById("dropoffTime");
  if (select.options.length > 1) return;
  for (let hour = 9; hour <= 20; hour++) {
    const value = `${String(hour).padStart(2, "0")}:00`;
    const label =
      hour === 12
        ? "12:00 PM"
        : hour < 12
          ? `${hour}:00 AM`
          : hour === 20
            ? "8:00 PM"
            : `${hour - 12}:00 PM`;
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    select.appendChild(opt);
  }
}

function setMinDropoffDate() {
  const dateEl = document.getElementById("dropoffDate");
  const today = new Date();
  const iso = today.toISOString().split("T")[0];
  dateEl.min = iso;
}

async function ensureStripe() {
  if (state.stripe) return state.stripe;
  const config = await ensureConfig();
  if (!config.stripePublishableKey) {
    throw new Error("Stripe is not configured");
  }
  await loadScript("https://js.stripe.com/v3/");
  state.stripe = Stripe(config.stripePublishableKey);
  return state.stripe;
}

async function initPaymentStep() {
  const mountEl = document.getElementById("paymentElement");
  const payBtn = document.getElementById("payBtn");
  const depositLabel = document.getElementById("depositLabel");

  if (!state.recordId) {
    showFormError("Please complete your contact information first.");
    return;
  }

  try {
    const config = await ensureConfig();
    depositLabel.textContent = `Pay ${config.depositAmountDisplay} deposit to reserve your boxes`;

    const stripe = await ensureStripe();

    if (!state.clientSecret) {
      const lead = collectLeadPayload();
      const res = await fetch(API.paymentIntent, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: state.recordId,
          firstName: lead.firstName,
          lastName: lead.lastName,
          phone: lead.phone,
          stripeCustomerId: state.stripeCustomerId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Payment setup failed");
      }
      state.clientSecret = data.clientSecret;
      state.paymentIntentId = data.paymentIntentId;
      state.stripeCustomerId = data.customerId;
    }

    if (!state.paymentElement) {
      state.elements = stripe.elements({ clientSecret: state.clientSecret });
      state.paymentElement = state.elements.create("payment", {
        paymentMethodOrder: ["card"],
        wallets: {
          applePay: "never",
          googlePay: "never",
          link: "never",
        },
      });
      state.paymentElement.mount(mountEl);
    }

    payBtn.onclick = handlePayment;
  } catch (err) {
    showFormError(err.message || "Payment could not be loaded.");
  }
}

async function handlePayment() {
  const payBtn = document.getElementById("payBtn");
  payBtn.disabled = true;
  payBtn.textContent = "Processing…";
  hideFormError();

  try {
    const stripe = await ensureStripe();
    const dropoff = collectDropoffPayload();

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements: state.elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (error) {
      throw new Error(error.message);
    }

    if (paymentIntent && paymentIntent.status !== "succeeded") {
      throw new Error("Payment was not completed. Please try again.");
    }

    const paymentMethodId =
      typeof paymentIntent?.payment_method === "string"
        ? paymentIntent.payment_method
        : paymentIntent?.payment_method?.id || null;

    const res = await fetch(API.lead(state.recordId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...dropoff,
        depositStatus: "Paid",
        paymentIntentId: state.paymentIntentId || paymentIntent?.id,
        stripeCustomerId: state.stripeCustomerId || paymentIntent?.customer || null,
        stripePaymentMethodId: paymentMethodId,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Failed to finalize booking");
    }

    showSuccess();
  } catch (err) {
    showFormError(err.message || "Payment failed. Please try again.");
    payBtn.disabled = false;
    payBtn.textContent = "Pay deposit & reserve";
  }
}

function showSuccess() {
  form.style.display = "none";
  heroHeader.style.display = "none";
  successPanel.classList.add("visible");

  loadScript("https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js")
    .then(() => {
      const duration = 2500;
      const end = Date.now() + duration;
      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#002d5b", "#c49a6c", "#ffffff"],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#002d5b", "#c49a6c", "#ffffff"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();
    })
    .catch(() => {});

  window.scrollTo({ top: 0, behavior: "smooth" });
}

buildTimeOptions();
setMinDropoffDate();
syncStepFieldState(0);
updateProgress();
