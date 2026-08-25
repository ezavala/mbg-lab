const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('#nav');toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',open)});nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}));
// Enlarge research figures when a research card is clicked.
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.querySelector("#research-modal");
  const modalImg = document.querySelector("#research-modal-image");
  const modalTitle = document.querySelector("#research-modal-title");
  const closeBtn = document.querySelector(".research-modal-close");
  const backdrop = document.querySelector(".research-modal-backdrop");
  const cards = [...document.querySelectorAll(".research-card")];

  if (!modal || !modalImg || !modalTitle || !closeBtn || !backdrop) return;

  let lastFocusedCard = null;

  function openCard(card){
    const img = card.querySelector(".research-schematic img");
    const title = card.querySelector("h3");
    if (!img) return;

    lastFocusedCard = card;
    modalImg.src = img.getAttribute("src");
    modalImg.alt = img.alt || "";
    modalTitle.textContent = title ? title.textContent : "";
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    closeBtn.focus();
  }

  function closeModal(){
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    modalImg.removeAttribute("src");
    document.body.classList.remove("modal-open");
    if (lastFocusedCard) lastFocusedCard.focus();
  }

  cards.forEach(card => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      openCard(card);
    });

    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openCard(card);
      }
    });
  });

  closeBtn.addEventListener("click", closeModal);
  backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });
});


// Progressive reveal for Engagement items.
document.addEventListener("DOMContentLoaded", () => {
  const feed = document.querySelector(".engagement-feed");
  const section = document.querySelector("#engage");
  if (!feed || !section) return;

  const items = [...feed.querySelectorAll(".engagement-item")];
  const ENGAGEMENT_INITIAL_COUNT = 5;

  if (items.length <= ENGAGEMENT_INITIAL_COUNT) return;

  // Avoid duplicates if this script is ever initialised more than once.
  section.querySelector(".engagement-toggle-wrap")?.remove();

  const wrap = document.createElement("div");
  wrap.className = "engagement-toggle-wrap";

  const toggle = document.createElement("button");
  toggle.className = "engagement-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");
  wrap.appendChild(toggle);
  feed.insertAdjacentElement("afterend", wrap);

  let expanded = false;

  function applyEngagementState() {
    items.forEach((item, index) => {
      const hide = !expanded && index >= ENGAGEMENT_INITIAL_COUNT;
      item.hidden = hide;
      item.style.display = hide ? "none" : "";
    });

    toggle.setAttribute("aria-expanded", expanded ? "true" : "false");
    toggle.innerHTML = expanded
      ? 'Show fewer <span aria-hidden="true">↑</span>'
      : 'View all engagement <span aria-hidden="true">↓</span>';
  }

  toggle.addEventListener("click", () => {
    expanded = !expanded;
    applyEngagementState();

    if (!expanded) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  applyEngagementState();
});

