(function () {
  "use strict";

  window.lucide?.createIcons();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = () => document.querySelectorAll(".editorial-hero,.agent-card,.identity-card,.route-grid,.closet-grid,.section-heading,.panel,.data-result,.tryon-inputs,.profile-group");
  revealTargets().forEach((element) => element.setAttribute("data-reveal", ""));

  if (reduced || !("IntersectionObserver" in window)) {
    revealTargets().forEach((element) => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -24px" });

  revealTargets().forEach((element) => observer.observe(element));

  document.addEventListener("pointermove", (event) => {
    if (event.pointerType === "touch") return;
    const card = event.target.closest(".reference-card,.closet-card");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -3;
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 3;
    card.style.transform = `perspective(700px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  document.addEventListener("pointerout", (event) => {
    const card = event.target.closest(".reference-card,.closet-card");
    if (card && !card.contains(event.relatedTarget)) card.style.transform = "";
  });
})();
