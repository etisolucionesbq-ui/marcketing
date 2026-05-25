const settingsForm = document.getElementById("settings-form");
const productsEditor = document.getElementById("products-editor");
const heroBannersEditor = document.getElementById("hero-banners-editor");
const promoBannersEditor = document.getElementById("promo-banners-editor");
const toast = document.getElementById("toast");

let settings = {};
let products = [];
let banners = { hero: [], promos: [] };

const localApi = {
  products: "/api/products",
  settings: "/api/settings",
  banners: "/api/banners"
};

const netlifyApi = {
  products: "/.netlify/functions/content?file=products",
  settings: "/.netlify/functions/content?file=settings",
  banners: "/.netlify/functions/content?file=banners"
};

function apiUrl(name) {
  return location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? localApi[name]
    : netlifyApi[name];
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  setTimeout(() => toast.classList.remove("is-visible"), 2200);
}

function escapeAttr(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function fillSettings() {
  Object.entries(settings).forEach(([key, value]) => {
    const field = settingsForm.elements[key];
    if (field) field.value = value || "";
  });
}

function collectSettings() {
  const formData = new FormData(settingsForm);
  settings = Object.fromEntries(formData.entries());
}

function renderProductsEditor() {
  productsEditor.innerHTML = products.map((product, index) => `
    <article class="product-editor" data-index="${index}">
      <img src="${escapeAttr(product.image)}" alt="">
      <div class="product-fields">
        <label>Nombre<input data-field="name" value="${escapeAttr(product.name)}"></label>
        <label>Categoria<input data-field="category" value="${escapeAttr(product.category)}"></label>
        <label>Etiqueta<input data-field="badge" value="${escapeAttr(product.badge)}"></label>
        <label>Precio<input data-field="price" type="number" value="${escapeAttr(product.price)}"></label>
        <label>Precio anterior<input data-field="oldPrice" type="number" value="${escapeAttr(product.oldPrice)}"></label>
        <label>Imagen URL<input data-field="image" value="${escapeAttr(product.image)}"></label>
        <label class="wide">Descripcion<textarea data-field="description" rows="3">${escapeAttr(product.description)}</textarea></label>
        <button class="remove-product" type="button" data-remove="${index}">Eliminar producto</button>
      </div>
    </article>
  `).join("");
}

function renderHeroBannersEditor() {
  heroBannersEditor.innerHTML = banners.hero.map((banner, index) => `
    <article class="product-editor" data-hero-index="${index}">
      <img src="${escapeAttr(banner.image)}" alt="">
      <div class="product-fields">
        <label>Kicker<input data-field="kicker" value="${escapeAttr(banner.kicker)}"></label>
        <label>Titulo<input data-field="title" value="${escapeAttr(banner.title)}"></label>
        <label>Texto boton<input data-field="buttonText" value="${escapeAttr(banner.buttonText)}"></label>
        <label>URL boton<input data-field="buttonUrl" value="${escapeAttr(banner.buttonUrl)}"></label>
        <label class="wide">Imagen URL<input data-field="image" value="${escapeAttr(banner.image)}"></label>
        <label class="wide">Subtitulo<textarea data-field="subtitle" rows="3">${escapeAttr(banner.subtitle)}</textarea></label>
        <button class="remove-product" type="button" data-remove-hero="${index}">Eliminar banner</button>
      </div>
    </article>
  `).join("");
}

function renderPromoBannersEditor() {
  promoBannersEditor.innerHTML = banners.promos.map((promo, index) => `
    <article class="product-editor" data-promo-index="${index}">
      <img src="${escapeAttr(promo.image)}" alt="">
      <div class="product-fields">
        <label>Titulo<input data-field="title" value="${escapeAttr(promo.title)}"></label>
        <label>Subtitulo<input data-field="subtitle" value="${escapeAttr(promo.subtitle)}"></label>
        <label class="wide">Imagen URL<input data-field="image" value="${escapeAttr(promo.image)}"></label>
        <button class="remove-product" type="button" data-remove-promo="${index}">Eliminar aviso</button>
      </div>
    </article>
  `).join("");
}

function collectBannerGroup(editor, selector) {
  return [...editor.querySelectorAll(selector)].map((card) => {
    const item = {};
    card.querySelectorAll("[data-field]").forEach((field) => {
      item[field.dataset.field] = field.value;
    });
    return item;
  });
}

function collectBanners() {
  banners = {
    hero: collectBannerGroup(heroBannersEditor, "[data-hero-index]"),
    promos: collectBannerGroup(promoBannersEditor, "[data-promo-index]")
  };
}

function collectProducts() {
  products = [...productsEditor.querySelectorAll(".product-editor")].map((card) => {
    const item = {};
    card.querySelectorAll("[data-field]").forEach((field) => {
      const key = field.dataset.field;
      item[key] = field.type === "number" ? Number(field.value || 0) : field.value;
    });
    return item;
  });
}

async function saveJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("No se pudo guardar");
}

async function loadAdmin() {
  const [productsRes, settingsRes, bannersRes] = await Promise.all([
    fetch(apiUrl("products")),
    fetch(apiUrl("settings")),
    fetch(apiUrl("banners"))
  ]);
  const productsData = await productsRes.json();
  products = Array.isArray(productsData) ? productsData : productsData.items || [];
  settings = await settingsRes.json();
  const bannersData = await bannersRes.json();
  banners = {
    hero: Array.isArray(bannersData.hero) ? bannersData.hero : [],
    promos: Array.isArray(bannersData.promos) ? bannersData.promos : []
  };
  fillSettings();
  renderHeroBannersEditor();
  renderPromoBannersEditor();
  renderProductsEditor();
}

document.getElementById("save-settings").addEventListener("click", async () => {
  collectSettings();
  await saveJson(apiUrl("settings"), settings);
  showToast("Ajustes guardados");
});

document.getElementById("save-products").addEventListener("click", async () => {
  collectProducts();
  await saveJson(apiUrl("products"), { items: products });
  showToast("Productos guardados");
});

document.getElementById("save-banners").addEventListener("click", async () => {
  collectBanners();
  await saveJson(apiUrl("banners"), banners);
  showToast("Banners guardados");
});

document.getElementById("add-hero-banner").addEventListener("click", () => {
  collectBanners();
  banners.hero.push({
    kicker: "Nueva promo",
    title: "Titulo del banner",
    subtitle: "Texto corto para el banner principal.",
    buttonText: "Ver productos",
    buttonUrl: "#catalogo",
    image: "https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1600&q=80"
  });
  renderHeroBannersEditor();
});

document.getElementById("add-promo-banner").addEventListener("click", () => {
  collectBanners();
  banners.promos.push({
    title: "Nuevo aviso",
    subtitle: "Texto del aviso",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80"
  });
  renderPromoBannersEditor();
});

document.getElementById("add-product").addEventListener("click", () => {
  collectProducts();
  products.unshift({
    name: "Nuevo producto",
    description: "Descripcion corta del producto.",
    price: 0,
    oldPrice: 0,
    category: "Torres",
    badge: "Nuevo",
    image: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80"
  });
  renderProductsEditor();
});

productsEditor.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove]");
  if (!button) return;
  collectProducts();
  products.splice(Number(button.dataset.remove), 1);
  renderProductsEditor();
});

productsEditor.addEventListener("input", (event) => {
  if (event.target.dataset.field === "image") {
    const card = event.target.closest(".product-editor");
    card.querySelector("img").src = event.target.value;
  }
});

heroBannersEditor.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-hero]");
  if (!button) return;
  collectBanners();
  banners.hero.splice(Number(button.dataset.removeHero), 1);
  renderHeroBannersEditor();
});

promoBannersEditor.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-promo]");
  if (!button) return;
  collectBanners();
  banners.promos.splice(Number(button.dataset.removePromo), 1);
  renderPromoBannersEditor();
});

[heroBannersEditor, promoBannersEditor].forEach((editor) => {
  editor.addEventListener("input", (event) => {
    if (event.target.dataset.field === "image") {
      const card = event.target.closest(".product-editor");
      card.querySelector("img").src = event.target.value;
    }
  });
});

loadAdmin().catch(() => showToast("Abre el proyecto con npm run dev"));
