/* ===========================================================
   Patience Fundraiser - script.js
   -----------------------------------------------------------
   HOW TO USE EACH TIME YOU RUN A FUNDRAISER:
   1. Add your collection date(s) to EVENT_DATES below.
   2. That's it - the page works out the deadline, countdown,
      and automatically closes / hides itself.

   To SKIP a period: leave EVENT_DATES empty ([]) or remove
   past dates. The page will show "No active fundraiser".
   =========================================================== */

/* ============================================================
   CONFIG - THIS IS THE ONLY PART YOU EDIT EACH TIME
   ============================================================ */
const CONFIG = {

  // 1) COLLECTION DATE(S) - format: "YYYY-MM-DD"
  //    Add one or more. The page shows the next upcoming one.
  EVENT_DATES: [
    "2026-06-26"
  ],

  // 2) COLLECTION TIME & PLACE (shown to customers)
  COLLECTION_TIME: "17h00 onwards",
  COLLECTION_PLACE: "30 Farmfield Road, Schaapkraal",

  // 3) ORDER DEADLINE - days before collection that orders close.
  DEADLINE_DAYS_BEFORE: 1,
  DEADLINE_HOUR: 23,        // 23 = 23:00 / 11pm

  // 4) PASTE YOUR GOOGLE APPS SCRIPT URL HERE (from setup)
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyXEQUbdLm9Ac7Ge8YwU7yeC97DhoJAu817sQc7CgmquseyCmJJ_KThVUs34O8MbVQ/exec"
};

/* ============================================================
   END OF CONFIG - you don't need to edit below this
   ============================================================ */

/* ---------- MENU (prices) ---------- */
const MENU = {
  combo:     { label: "Combo Deal",                price: 160 },
  chicken:   { label: "Chicken Burger & Chips",    price: 50  },
  beef:      { label: "Beef Burger & Chips",       price: 50  },
  boerewors: { label: "Boerewors & Chips",         price: 40  },
  drink:     { label: "330ml Bashew Drink",        price: 10  }
};

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

/* ---------- DATE HELPERS ---------- */
function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(date) {
  return `${DAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function getDeadline(eventDate) {
  const d = new Date(eventDate);
  d.setDate(d.getDate() - CONFIG.DEADLINE_DAYS_BEFORE);
  d.setHours(CONFIG.DEADLINE_HOUR, 0, 0, 0);
  return d;
}

function getFundraiserState() {
  const now = new Date();
  const upcoming = (CONFIG.EVENT_DATES || [])
    .map(parseDate)
    .filter(d => !isNaN(d))
    .sort((a, b) => a - b);

  for (const eventDate of upcoming) {
    const endOfEventDay = new Date(eventDate);
    endOfEventDay.setHours(23, 59, 59, 999);
    if (now <= endOfEventDay) {
      const deadline = getDeadline(eventDate);
      if (now > deadline) {
        return { status: "closed", eventDate, deadline };
      }
      return { status: "open", eventDate, deadline };
    }
  }
  return { status: "none" };
}

/* ---------- RENDER STATUS BANNER ---------- */
function daysBetween(from, to) {
  const ms = to.setHours(0,0,0,0) - new Date(from).setHours(0,0,0,0);
  return Math.round(ms / 86400000);
}

function renderStatus() {
  const banner = document.getElementById("statusBanner");
  const orderArea = document.getElementById("orderArea");
  const collectionLine = document.getElementById("collectionLine");
  const state = getFundraiserState();

  if (state.status === "open") {
    const collectStr = formatDate(state.eventDate);
    const deadlineStr = formatDate(state.deadline);
    const daysLeft = daysBetween(new Date(), new Date(state.deadline));
    let countdown;
    if (daysLeft > 1)        countdown = `${daysLeft} days left to order`;
    else if (daysLeft === 1) countdown = "Last day tomorrow!";
    else                     countdown = "Orders close today!";

    banner.className = "status-banner";
    banner.innerHTML = `
      <div class="collect-date">🕋 Collect: ${collectStr}, ${CONFIG.COLLECTION_TIME}</div>
      <div class="deadline">Order before ${deadlineStr}</div>
      <span class="countdown">${countdown}</span>
    `;
    collectionLine.textContent = `${collectStr}, ${CONFIG.COLLECTION_TIME}`;
    orderArea.classList.remove("disabled");

  } else if (state.status === "closed") {
    banner.className = "status-banner closed";
    banner.innerHTML = `
      <div class="collect-date">Orders are closed for this round</div>
      <div class="deadline">Shukran to everyone who ordered! 🌼</div>
    `;
    collectionLine.textContent = `${formatDate(state.eventDate)}, ${CONFIG.COLLECTION_TIME}`;
    orderArea.classList.add("disabled");
    disableForm();

  } else {
    banner.className = "status-banner none";
    banner.innerHTML = `
      <div class="collect-date">No active fundraiser right now</div>
      <div class="deadline">Check back soon, Insha Allah 🌼</div>
    `;
    collectionLine.textContent = "To be announced";
    orderArea.classList.add("disabled");
    disableForm();
  }
}

function disableForm() {
  const btn = document.getElementById("submitBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Ordering Closed"; }
}

/* ---------- STEPPERS & TOTAL ---------- */
function getQty(item) {
  const el = document.getElementById("qty-" + item);
  return el ? parseInt(el.value, 10) || 0 : 0;
}

function setQty(item, value) {
  const el = document.getElementById("qty-" + item);
  if (el) el.value = Math.max(0, value);
}

function updateSummary() {
  const list = document.getElementById("summaryList");
  const totalEl = document.getElementById("totalAmount");
  let total = 0;
  let rows = "";

  for (const key in MENU) {
    const qty = getQty(key);
    if (qty > 0) {
      const lineTotal = qty * MENU[key].price;
      total += lineTotal;
      rows += `<li><span>${qty} × ${MENU[key].label}</span><span>R${lineTotal}</span></li>`;
    }
  }

  list.innerHTML = rows || `<li class="empty">No items selected yet.</li>`;
  totalEl.textContent = "R" + total;
  return total;
}

function initSteppers() {
  document.querySelectorAll(".stepper").forEach(stepper => {
    const item = stepper.dataset.item;
    stepper.querySelector(".plus").addEventListener("click", () => {
      setQty(item, getQty(item) + 1);
      updateSummary();
    });
    stepper.querySelector(".minus").addEventListener("click", () => {
      setQty(item, getQty(item) - 1);
      updateSummary();
    });
  });
}

/* ---------- PAYMENT TOGGLE ---------- */
function initPaymentToggle() {
  const eft = document.getElementById("eftDetails");
  document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener("change", e => {
      eft.hidden = (e.target.value !== "EFT");
    });
  });
}

/* ---------- SUBMIT ---------- */
function initForm() {
  const form = document.getElementById("orderForm");
  const msg = document.getElementById("formMessage");
  const btn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.className = "form-message";
    msg.textContent = "";

    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const notes = document.getElementById("custNotes").value.trim();
    const paymentEl = document.querySelector('input[name="payment"]:checked');
    const total = updateSummary();

    if (total === 0)    return showError(msg, "Please select at least one item.");
    if (!name)          return showError(msg, "Please enter your name.");
    if (!phone)         return showError(msg, "Please enter your phone number.");
    if (!paymentEl)     return showError(msg, "Please choose a payment method.");

    const state = getFundraiserState();

    const order = {
      timestamp: new Date().toLocaleString("en-ZA"),
      collectionDate: state.eventDate ? formatDate(state.eventDate) : "",
      name, phone, notes,
      payment: paymentEl.value,
      combo: getQty("combo"),
      chicken: getQty("chicken"),
      beef: getQty("beef"),
      boerewors: getQty("boerewors"),
      drink: getQty("drink"),
      total: total
    };

    if (!CONFIG.SCRIPT_URL || CONFIG.SCRIPT_URL.startsWith("PASTE_")) {
      return showError(msg, "Setup not finished: Google Apps Script URL is missing.");
    }

    btn.disabled = true;
    btn.textContent = "Sending...";

    try {
      await fetch(CONFIG.SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(order)
      });
      showThankYou(name);
      form.reset();
      for (const key in MENU) setQty(key, 0);
      updateSummary();
      document.getElementById("eftDetails").hidden = true;
    } catch (err) {
      showError(msg, "Something went wrong sending your order. Please try again.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Place Order";
    }
  });

  document.getElementById("newOrderBtn").addEventListener("click", () => {
    document.getElementById("thankYou").hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function showError(msg, text) {
  msg.className = "form-message error";
  msg.textContent = text;
}

function showThankYou(name) {
  document.getElementById("thankYouMsg").textContent =
    `Shukran ${name}! Your order has been received. Please pay & collect on the day. 🌼`;
  document.getElementById("thankYou").hidden = false;
}

/* ---------- OPTIONAL PHOTO STRIP ---------- */
function initPhotoStrip() {
  const strip = document.getElementById("photoStrip");
  const candidates = [
    { el: document.getElementById("photo1"), src: "images/photo-1.jpg" },
    { el: document.getElementById("photo2"), src: "images/photo-2.jpg" }
  ];

  candidates.forEach(({ el, src }) => {
    const test = new Image();
    test.onload = () => {
      el.src = src;
      el.style.display = "block";
      strip.hidden = false;
    };
    test.onerror = () => { el.style.display = "none"; };
    test.src = src;
  });
}

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", () => {
  renderStatus();
  initSteppers();
  initPaymentToggle();
  initForm();
  initPhotoStrip();
  updateSummary();
});