const state = {
  products: [],
  settings: {},
  banners: { hero: [], promos: [] },
  slideIndex: 0,
  slideTimer: null,
  category: "Todos",
  query: "",
  cart: {}
};

const cartKey = "up-gamer-cart";

function text(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function money(value) {
  return Number(value || 0).toLocaleString("es-CO");
}

function readCart() {
  try {
    state.cart = JSON.parse(localStorage.getItem(cartKey)) || {};
  } catch {
    state.cart = {};
  }
}

function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify(state.cart));
}

function cartEntries() {
  return Object.entries(state.cart)
    .map(([id, qty]) => ({
      product: state.products.find((item) => item.id === id),
      qty: Number(qty)
    }))
    .filter((entry) => entry.product && entry.qty > 0);
}

function cartTotal() {
  return cartEntries().reduce((total, entry) => total + Number(entry.product.price || 0) * entry.qty, 0);
}

function cartCount() {
  return cartEntries().reduce((total, entry) => total + entry.qty, 0);
}

function whatsappBaseUrl() {
  return (state.settings.ctaUrl || "https://wa.me/573000000000").split("?")[0];
}

function whatsappCartUrl() {
  const entries = cartEntries();
  const lines = [
    `Hola, quiero hacer este pedido en ${state.settings.storeName || "UP Gamer"}:`,
    "",
    ...entries.map((entry) => {
      const subtotal = Number(entry.product.price || 0) * entry.qty;
      return `- ${entry.qty} x ${entry.product.name} - $${money(subtotal)}`;
    }),
    "",
    `Total: $${money(cartTotal())}`,
    "",
    "Quedo atento para confirmar disponibilidad y envio."
  ];
  return `${whatsappBaseUrl()}?text=${encodeURIComponent(lines.join("\n"))}`;
}

function visibleProducts() {
  return state.products.filter((product) => {
    const matchesCategory = state.category === "Todos" || product.category === state.category;
    const haystack = `${product.name} ${product.description} ${product.category}`.toLowerCase();
    return matchesCategory && haystack.includes(state.query.toLowerCase());
  });
}

function renderCategories() {
  const categories = ["Todos", ...new Set(state.products.map((product) => product.category).filter(Boolean))];
  document.getElementById("category-nav").innerHTML = categories.map((category) => `
    <button class="category-button ${category === state.category ? "is-active" : ""}" type="button" data-category="${text(category)}">
      ${text(category)}
    </button>
  `).join("");
}

function renderCard(product) {
  const hasOldPrice = Number(product.oldPrice) > Number(product.price);
  return `
    <article class="product-card">
      <div class="image-wrap">
        <span class="badge">${text(product.badge || "Oferta")}</span>
        <img src="${text(product.image)}" alt="${text(product.name)}">
      </div>
      <div class="product-info">
        <small>${text(product.category || "Producto")}</small>
        <h3>${text(product.name)}</h3>
        <p>${text(product.description)}</p>
        ${hasOldPrice ? `<span class="old-price">$${money(product.oldPrice)}</span>` : ""}
        <strong class="price">$${money(product.price)}</strong>
        <button class="buy-button" type="button" data-add-cart="${text(product.id)}">Agregar al carrito</button>
      </div>
    </article>
  `;
}

function renderProducts() {
  const products = visibleProducts();
  const newest = [...products].reverse();
  document.getElementById("products-grid").innerHTML = products.length
    ? products.map(renderCard).join("")
    : `<p class="empty-state">No hay productos para esta busqueda.</p>`;
  document.getElementById("new-products-grid").innerHTML = newest.length
    ? newest.map(renderCard).join("")
    : "";
}

function slideFallback() {
  return [{
    kicker: "Ofertas activas",
    title: state.settings.title || "Ofertas",
    subtitle: state.settings.subtitle || "",
    buttonText: state.settings.ctaText || "Ver ofertas",
    buttonUrl: "#catalogo",
    image: state.settings.heroImage || ""
  }];
}

function currentSlides() {
  return state.banners.hero.length ? state.banners.hero : slideFallback();
}

function renderHeroCarousel() {
  const slides = currentSlides();
  const track = document.getElementById("hero-track");
  const dots = document.getElementById("hero-dots");

  state.slideIndex = Math.min(state.slideIndex, slides.length - 1);
  track.style.transform = `translateX(-${state.slideIndex * 100}%)`;
  track.innerHTML = slides.map((slide) => `
    <article class="hero-slide">
      <img src="${text(slide.image)}" alt="${text(slide.title)}">
      <div class="hero-copy">
        <p class="hero-kicker">${text(slide.kicker || "Ofertas activas")}</p>
        <h1>${text(slide.title || state.settings.title || "Ofertas")}</h1>
        <p>${text(slide.subtitle || state.settings.subtitle || "")}</p>
        <a class="hero-button" href="${text(slide.buttonUrl || "#catalogo")}">${text(slide.buttonText || "Ver ofertas")}</a>
      </div>
    </article>
  `).join("");

  dots.innerHTML = slides.map((_, index) => `
    <button class="${index === state.slideIndex ? "is-active" : ""}" type="button" data-slide="${index}" aria-label="Ir al banner ${index + 1}"></button>
  `).join("");
}

function goToSlide(index) {
  const slides = currentSlides();
  state.slideIndex = (index + slides.length) % slides.length;
  renderHeroCarousel();
}

function startCarousel() {
  clearInterval(state.slideTimer);
  if (currentSlides().length <= 1) return;
  state.slideTimer = setInterval(() => goToSlide(state.slideIndex + 1), 5500);
}

function renderPromos() {
  const promos = state.banners.promos.length ? state.banners.promos : [
    {
      title: "Tu experiencia gamer",
      subtitle: "al maximo nivel",
      image: state.settings.promoImageOne || ""
    },
    {
      title: "Setup listo",
      subtitle: "para jugar y crear",
      image: state.settings.promoImageTwo || ""
    }
  ];

  document.getElementById("promo-grid").innerHTML = promos.map((promo) => `
    <article class="promo-card">
      <img src="${text(promo.image)}" alt="${text(promo.title)}">
      <div>
        <strong>${text(promo.title)}</strong>
        <span>${text(promo.subtitle)}</span>
      </div>
    </article>
  `).join("");
}

function renderCart() {
  const entries = cartEntries();
  const cartItems = document.getElementById("cart-items");
  const checkout = document.getElementById("cart-whatsapp");

  document.getElementById("product-count").textContent = String(cartCount());
  document.getElementById("cart-total").textContent = `$${money(cartTotal())}`;

  if (!entries.length) {
    cartItems.innerHTML = `<p class="cart-empty">Tu carrito esta vacio.</p>`;
    checkout.href = "#";
    checkout.classList.add("is-disabled");
    return;
  }

  cartItems.innerHTML = entries.map(({ product, qty }) => {
    const subtotal = Number(product.price || 0) * qty;
    return `
      <article class="cart-item">
        <img src="${text(product.image)}" alt="${text(product.name)}">
        <div>
          <h3>${text(product.name)}</h3>
          <small>$${money(product.price)} c/u</small>
          <strong>$${money(subtotal)}</strong>
          <div class="quantity-control">
            <button type="button" data-cart-dec="${text(product.id)}">-</button>
            <span>${qty}</span>
            <button type="button" data-cart-inc="${text(product.id)}">+</button>
            <button class="remove-item" type="button" data-cart-remove="${text(product.id)}">Quitar</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  checkout.href = whatsappCartUrl();
  checkout.classList.remove("is-disabled");
}

function openCart() {
  document.getElementById("cart-backdrop").hidden = false;
  document.getElementById("cart-drawer").setAttribute("aria-hidden", "false");
  document.body.classList.add("cart-is-open");
}

function closeCart() {
  document.getElementById("cart-backdrop").hidden = true;
  document.getElementById("cart-drawer").setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart-is-open");
}

function addToCart(productId) {
  state.cart[productId] = Number(state.cart[productId] || 0) + 1;
  saveCart();
  renderCart();
  openCart();
}

function updateCart(productId, nextQty) {
  if (nextQty <= 0) {
    delete state.cart[productId];
  } else {
    state.cart[productId] = nextQty;
  }
  saveCart();
  renderCart();
}

function renderSettings() {
  const settings = state.settings;
  const root = document.documentElement;
  const logoImage = document.getElementById("logo-image");
  const logoText = document.querySelector(".logo span");
  const logoSubtext = document.querySelector(".logo small");

  document.title = `${settings.storeName || "UP Gamer"} | ${settings.title || "Ofertas"}`;
  document.body.dataset.layout = settings.siteLayout || "full";
  document.body.dataset.theme = settings.themeStyle || "gamer";

  root.style.setProperty("--nav", settings.navColor || "#071735");
  root.style.setProperty("--nav-deep", settings.navDeepColor || "#041024");
  root.style.setProperty("--cyan", settings.accentColor || "#00c8ee");
  root.style.setProperty("--orange", settings.secondaryColor || "#ff6b2b");
  root.style.setProperty("--pink", settings.highlightColor || "#ed2e8f");
  root.style.setProperty("--green", settings.whatsappColor || "#18d36c");
  root.style.setProperty("--paper", settings.pageBackground || "#f4f6fb");
  root.style.setProperty("--card", settings.cardBackground || "#ffffff");
  root.style.setProperty("--hero-height", `${Number(settings.heroHeight || 420)}px`);
  root.style.setProperty("--card-radius", `${Number(settings.cardRadius || 8)}px`);
  root.style.setProperty("--content-width", `${Number(settings.contentWidth || 1180)}px`);
  root.style.setProperty("--product-image-fit", settings.productImageFit || "contain");

  if (settings.logoImage) {
    logoImage.src = settings.logoImage;
    logoImage.hidden = false;
    logoText.hidden = true;
    logoSubtext.hidden = true;
  } else {
    logoImage.hidden = true;
    logoText.hidden = false;
    logoSubtext.hidden = false;
    logoText.textContent = settings.storeName?.split(" ")[0] || "UP";
    logoSubtext.textContent = settings.storeName?.split(" ").slice(1).join(" ") || "Gamer";
  }
}

async function loadSite() {

  try {

    const loadJson = async (apiPath, staticPath) => {

      try {

        const response = await fetch(apiPath);

        if (response.ok) {
          return await response.json();
        }

      } catch (error) {
        console.warn("API fallback:", apiPath, error);
      }

      const fallback = await fetch(staticPath);

      if (!fallback.ok) {
        throw new Error(`No se pudo cargar ${staticPath}`);
      }

      return await fallback.json();
    };

    const [productsData, settingsData, bannersData] = await Promise.all([
      loadJson("/api/products", "./data/products.json"),
      loadJson("/api/settings", "./data/site-settings.json"),
      loadJson("/api/banners", "./data/banners.json")
    ]);

    const rawProducts =
      Array.isArray(productsData)
        ? productsData
        : productsData.items || [];

    state.products = rawProducts.map((product, index) => ({
      ...product,
      id: String(product.id || `${index}-${product.name}`)
    }));

    state.settings = settingsData || {};

    state.banners = {
      hero: Array.isArray(bannersData.hero)
        ? bannersData.hero
        : [],
      promos: Array.isArray(bannersData.promos)
        ? bannersData.promos
        : []
    };

    readCart();

    renderSettings();
    renderHeroCarousel();
    renderPromos();
    renderCategories();
    renderProducts();
    renderCart();
    startCarousel();

    console.log("UP Gamer cargado correctamente");

  } catch (error) {

    console.error("ERROR LOAD SITE:", error);

    document.getElementById("products-grid").innerHTML =
      `<p class="empty-state">No se pudo cargar el catalogo.</p>`;
  }
}

document.getElementById("category-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  renderCategories();
  renderProducts();
});

document.getElementById("search-input").addEventListener("input", (event) => {
  state.query = event.target.value;
  renderProducts();
});

document.getElementById("hero-prev").addEventListener("click", () => {
  goToSlide(state.slideIndex - 1);
  startCarousel();
});

document.getElementById("hero-next").addEventListener("click", () => {
  goToSlide(state.slideIndex + 1);
  startCarousel();
});

document.getElementById("hero-dots").addEventListener("click", (event) => {
  const button = event.target.closest("[data-slide]");
  if (!button) return;
  goToSlide(Number(button.dataset.slide));
  startCarousel();
});

document.body.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-cart]");
  const incButton = event.target.closest("[data-cart-inc]");
  const decButton = event.target.closest("[data-cart-dec]");
  const removeButton = event.target.closest("[data-cart-remove]");

  if (addButton) addToCart(addButton.dataset.addCart);
  if (incButton) updateCart(incButton.dataset.cartInc, Number(state.cart[incButton.dataset.cartInc] || 0) + 1);
  if (decButton) updateCart(decButton.dataset.cartDec, Number(state.cart[decButton.dataset.cartDec] || 0) - 1);
  if (removeButton) updateCart(removeButton.dataset.cartRemove, 0);
});

document.getElementById("cart-open").addEventListener("click", openCart);
document.getElementById("whatsapp-float").addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
document.getElementById("cart-backdrop").addEventListener("click", closeCart);
document.getElementById("cart-clear").addEventListener("click", () => {
  state.cart = {};
  saveCart();
  renderCart();
});
document.getElementById("cart-whatsapp").addEventListener("click", (event) => {
  if (!cartEntries().length) event.preventDefault();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeCart();
});

loadSite();
/* =========================
   MENU LATERAL
========================= */

const menuOpen = document.getElementById("menu-open");
const menuClose = document.getElementById("menu-close");
const sideMenu = document.getElementById("side-menu");
const menuBackdrop = document.getElementById("menu-backdrop");

if (menuOpen && menuClose && sideMenu && menuBackdrop) {

  menuOpen.addEventListener("click", () => {
    sideMenu.classList.add("open");
    sideMenu.setAttribute("aria-hidden", "false");
    menuBackdrop.hidden = false;
  });

  menuClose.addEventListener("click", closeMenu);

  menuBackdrop.addEventListener("click", closeMenu);

  function closeMenu() {
    sideMenu.classList.remove("open");
    sideMenu.setAttribute("aria-hidden", "true");
    menuBackdrop.hidden = true;
  }
}

/* =========================
   SINCRONIZAR CATEGORIAS
========================= */

const categoryNav = document.getElementById("category-nav");
const sideMenuNav = document.getElementById("side-menu-nav");

if (categoryNav && sideMenuNav) {

  const syncMenu = () => {

    const items = categoryNav.querySelectorAll("button, a");

    if (!items.length) {
      setTimeout(syncMenu, 300);
      return;
    }

    sideMenuNav.innerHTML = "";

    items.forEach((item, index) => {

      const clone = item.cloneNode(true);

      clone.addEventListener("click", () => {

        const updatedItems =
          categoryNav.querySelectorAll("button, a");

        if (updatedItems[index]) {
          updatedItems[index].click();
        }

        sideMenu.classList.remove("open");
        sideMenu.setAttribute("aria-hidden", "true");
        menuBackdrop.hidden = true;
      });

      sideMenuNav.appendChild(clone);
    });
  };

  syncMenu();

  const observer = new MutationObserver(() => {
    syncMenu();
  });

  observer.observe(categoryNav, {
    childList: true,
    subtree: true
  });
}
