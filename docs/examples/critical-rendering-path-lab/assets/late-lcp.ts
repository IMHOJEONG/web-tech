const slot = document.querySelector<HTMLElement>("#hero-slot");
const delayMs = Number.parseInt(slot?.dataset.delay ?? "0", 10);

window.setTimeout(() => {
  const image = new Image(1200, 600);
  image.alt = "Layered browser rendering pipeline illustration";
  image.className = "hero";
  image.fetchPriority = "high";
  image.src = "/assets/hero.svg";
  slot?.replaceWith(image);
}, delayMs);
