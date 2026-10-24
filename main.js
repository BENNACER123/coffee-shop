"use strict";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ------------------------------------------------------------
   1. Mobile menu (hamburger)
------------------------------------------------------------ */
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.getElementById("site-nav");

function setMenu(open) {
  siteNav.classList.toggle("open", open);
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";
  setMenu(!isOpen);
});

// Close the menu after choosing a link
siteNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

// Close with the Escape key and give focus back to the button
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && siteNav.classList.contains("open")) {
    setMenu(false);
    navToggle.focus();
  }
});

// Reset when the screen becomes wide again
window.matchMedia("(min-width: 769px)").addEventListener("change", (event) => {
  if (event.matches) setMenu(false);
});

/* ------------------------------------------------------------
   2. Active link while scrolling
------------------------------------------------------------ */
const navLinks = document.querySelectorAll('nav a[href^="#"]');
const trackedSections = document.querySelectorAll("[data-section]");

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.dataset.section;
      navLinks.forEach((link) => {
        const isActive = link.getAttribute("href") === `#${id}`;
        link.classList.toggle("active", isActive);
        if (isActive) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    });
  },
  // A section is "current" when it crosses the middle of the screen
  { rootMargin: "-45% 0px -50% 0px" },
);
trackedSections.forEach((section) => sectionObserver.observe(section));

/* ------------------------------------------------------------
   3. Scroll reveal
------------------------------------------------------------ */
const revealItems = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-visible");
        observer.unobserve(el);

        // Remove the helper classes when done, so hover effects work normally
        el.addEventListener("transitionend", function cleanup(event) {
          if (event.target !== el || event.propertyName !== "opacity") return;
          el.classList.remove("reveal", "is-visible");
          el.removeEventListener("transitionend", cleanup);
        });
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
  );
  revealItems.forEach((el) => revealObserver.observe(el));
} else {
  revealItems.forEach((el) => el.classList.remove("reveal"));
}

/* ------------------------------------------------------------
   4. Counter animation
------------------------------------------------------------ */
function animateCount(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  const duration = 1600;
  const start = performance.now();

  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

if (!prefersReducedMotion) {
  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.8 },
  );
  document
    .querySelectorAll("[data-count]")
    .forEach((el) => counterObserver.observe(el));
}

/* ------------------------------------------------------------
   5. Menu tabs
------------------------------------------------------------ */
const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
const panels = tabs.map((tab) =>
  document.getElementById(tab.getAttribute("aria-controls")),
);

function selectTab(selectedTab, moveFocus = false) {
  tabs.forEach((tab, index) => {
    const isSelected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    panels[index].hidden = !isSelected;
  });
  if (moveFocus) selectedTab.focus();
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));

  // Keyboard: arrows, Home and End
  tab.addEventListener("keydown", (event) => {
    let nextTab = null;
    if (event.key === "ArrowRight") nextTab = tabs[(index + 1) % tabs.length];
    if (event.key === "ArrowLeft")
      nextTab = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === "Home") nextTab = tabs[0];
    if (event.key === "End") nextTab = tabs[tabs.length - 1];
    if (nextTab) {
      event.preventDefault();
      selectTab(nextTab, true);
    }
  });
});

// "Discover" buttons open the matching tab
document.querySelectorAll("[data-tab]").forEach((link) => {
  link.addEventListener("click", () => {
    const tab = document.getElementById(`tab-${link.dataset.tab}`);
    if (tab) selectTab(tab);
  });
});

selectTab(tabs[0]); // show only the first panel at start

/* ------------------------------------------------------------
   6. Contact form: validation + feedback
------------------------------------------------------------ */
const form = document.getElementById("contact-form");
const formStatus = form.querySelector(".form-status");
const submitButton = form.querySelector('button[type="submit"]');

// Each rule returns true, or an error message
const rules = {
  name: (value) =>
    value.trim().length >= 2 ||
    "Please enter your name (2 characters or more).",
  email: (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
    "Please enter a valid email address.",
  message: (value) =>
    value.trim().length >= 10 ||
    "Your message should be at least 10 characters.",
};

function validateField(input) {
  const result = rules[input.id](input.value);
  const isValid = result === true;
  input.setAttribute("aria-invalid", String(!isValid));
  document.getElementById(`${input.id}-error`).textContent = isValid
    ? ""
    : result;
  return isValid;
}

const fields = Array.from(form.querySelectorAll("input, textarea"));

fields.forEach((input) => {
  input.addEventListener("blur", () => validateField(input));
  input.addEventListener("input", () => {
    // Once a field showed an error, update it live while the user types
    if (input.getAttribute("aria-invalid") === "true") validateField(input);
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  formStatus.textContent = "";

  const invalidFields = fields.filter((input) => !validateField(input));
  if (invalidFields.length > 0) {
    invalidFields[0].focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Sending…";

  // Demo only: no server yet. Replace this timeout with a real request
  // (for example fetch() to Formspree) when you want messages delivered.
  setTimeout(() => {
    form.reset();
    fields.forEach((input) => input.removeAttribute("aria-invalid"));
    submitButton.disabled = false;
    submitButton.textContent = "Send message";
    formStatus.textContent = "Thank you! Your message has been sent.";
  }, 900);
});
