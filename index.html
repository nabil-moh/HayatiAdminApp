(() => {
  "use strict";

  const cfg = window.HAYATI_CONFIG || {};
  const supabaseLib = window.supabase;

  const $ = (selector) => document.querySelector(selector);

  const DEFAULT_STORE_COLOR = "#8b3f62";

  const demo = [
    {
      id: "demo-1",
      name: "فستان وردي ناعم",
      category: "ملابس",
      price: 2900,
      image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "demo-2",
      name: "بلوزة أنيقة",
      category: "ملابس",
      price: 1850,
      image: "https://images.unsplash.com/photo-1564257577054-0e5ab90e0f0f?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "demo-3",
      name: "عباية مطرزة",
      category: "ملابس",
      price: 3500,
      image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "demo-4",
      name: "عطر نسائي أنيق",
      category: "عطور",
      price: 2200,
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "demo-5",
      name: "سيروم للبشرة",
      category: "مواد التجميل",
      price: 1950,
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "demo-6",
      name: "أحمر شفاه مطفي",
      category: "مواد التجميل",
      price: 1250,
      image: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "demo-7",
      name: "حذاء نسائي أنيق",
      category: "أحذية",
      price: 3200,
      image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=700&q=80"
    },
    {
      id: "demo-8",
      name: "حذاء بكعب أنيق",
      category: "أحذية",
      price: 3900,
      image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=700&q=80"
    }
  ];

  const wilayas = [
    "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية",
    "بسكرة","بشار","البليدة","البويرة","تمنراست","تبسة",
    "تلمسان","تيارت","تيزي وزو","الجزائر","الجلفة","جيجل",
    "سطيف","سعيدة","سكيكدة","سيدي بلعباس","عنابة","قالمة",
    "قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة",
    "وهران","البيض","إليزي","برج بوعريريج","بومرداس",
    "الطارف","تندوف","تيسمسيلت","الوادي","خنشلة","سوق أهراس",
    "تيبازة","ميلة","عين الدفلى","النعامة","عين تموشنت",
    "غرداية","غليزان","تيميمون","برج باجي مختار","أولاد جلال",
    "بني عباس","عين صالح","عين قزام","تقرت","جانت","المغير",
    "المنيعة"
  ];

  const money = (value) =>
    new Intl.NumberFormat("ar-DZ").format(Number(value) || 0) + " دج";

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));

  let db = null;
  let products = [...demo];
  let cart = loadCart();
  let activeCat = "";
  let toastTimer = null;

  function loadCart() {
    try {
      const value = JSON.parse(
        localStorage.getItem("hayati_cart") || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem(
      "hayati_cart",
      JSON.stringify(cart)
    );

    renderCart();
  }

  function toast(text) {
    const element = $("#toast");

    if (!element) return;

    element.textContent = text;
    element.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      element.classList.remove("show");
    }, 2300);
  }

  function setStoreColor(color) {
    const value = color || DEFAULT_STORE_COLOR;

    const root = document.documentElement;

    root.style.setProperty("--store-color", value);
    root.style.setProperty("--store-primary", value);
    root.style.setProperty("--store-accent", value);
  }

  function applyLogo(url) {
    const logo = $("#siteLogo");
    const fallback = $("#brandFallback");

    if (!logo) return;

    if (url) {
      logo.src = url;
      logo.hidden = false;

      if (fallback) {
        fallback.hidden = true;
      }

      logo.onerror = () => {
        logo.hidden = true;

        if (fallback) {
          fallback.hidden = false;
        }
      };
    } else {
      logo.hidden = true;

      if (fallback) {
        fallback.hidden = false;
      }
    }
  }

  async function loadSiteSettings() {
    if (!db) return;

    try {
      const { data, error } = await db
        .from("site_settings")
        .select("logo_url,store_color")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn("site_settings:", error);
        setStoreColor(DEFAULT_STORE_COLOR);
        return;
      }

      if (!data) {
        setStoreColor(DEFAULT_STORE_COLOR);
        return;
      }

      setStoreColor(
        data.store_color || DEFAULT_STORE_COLOR
      );

      applyLogo(data.logo_url || "");
    } catch (error) {
      console.warn("loadSiteSettings:", error);
      setStoreColor(DEFAULT_STORE_COLOR);
    }
  }

  function renderProducts() {
    const list = $("#list");

    if (!list) return;

    const query =
      ($("#search")?.value || "")
        .trim()
        .toLowerCase();

    const filtered = products.filter((product) => {
      const matchesCategory =
        !activeCat ||
        String(product.category || "") === activeCat;

      const name =
        String(product.name || "").toLowerCase();

      const category =
        String(product.category || "").toLowerCase();

      const matchesSearch =
        !query ||
        name.includes(query) ||
        category.includes(query);

      return matchesCategory && matchesSearch;
    });

    if (!filtered.length) {
      list.innerHTML =
        '<div class="status">لا توجد منتجات حاليا.</div>';
      return;
    }

    list.innerHTML = filtered.map((product) => {
      const image =
        product.image_url ||
        product.image ||
        "";

      return `
        <article class="card">

          <div class="card-img">

            ${
              image
                ? `
                  <img
                    src="${esc(image)}"
                    alt="${esc(product.name)}"
                    loading="lazy"
                    onerror="this.style.display='none'"
                  >
                `
                : `
                  <div class="empty-image">
                    🛍️
                  </div>
                `
            }

          </div>

          <div class="card-body">

            <h3>
              ${esc(product.name || "منتج")}
            </h3>

            <span>
              ${esc(product.category || "")}
            </span>

            <div class="price">
              ${money(product.price)}
            </div>

            <button
              class="add"
              type="button"
              data-id="${esc(product.id)}"
            >
              أضيفي إلى السلة
            </button>

          </div>

        </article>
      `;
    }).join("");

    list
      .querySelectorAll("[data-id]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          add(button.dataset.id);
        });
      });
  }

  function renderCart() {
    const count = cart.reduce(
      (sum, item) =>
        sum + (Number(item.qty) || 0),
      0
    );

    const countElement = $("#cartCount");

    if (countElement) {
      countElement.textContent = String(count);
    }

    const total = cart.reduce(
      (sum, item) =>
        sum +
        (Number(item.price) || 0) *
        (Number(item.qty) || 0),
      0
    );

    const totalElement = $("#total");

    if (totalElement) {
      totalElement.textContent =
        new Intl.NumberFormat("ar-DZ").format(total);
    }

    const items = $("#cartItems");

    if (!items) return;

    if (!cart.length) {
      items.innerHTML =
        '<p class="status">السلة فارغة.</p>';
      return;
    }

    items.innerHTML = cart.map((item) => `
      <div class="cart-row">

        <span>
          <strong>${esc(item.name)}</strong>
          <br>
          <small>${money(item.price)}</small>
        </span>

        <span class="qty">

          <button
            type="button"
            data-minus="${esc(item.id)}"
          >
            −
          </button>

          ${item.qty}

          <button
            type="button"
            data-plus="${esc(item.id)}"
          >
            +
          </button>

          <button
            type="button"
            class="remove"
            data-remove="${esc(item.id)}"
          >
            حذف
          </button>

        </span>

      </div>
    `).join("");

    items
      .querySelectorAll("[data-minus]")
      .forEach((button) => {
        button.onclick = () =>
          change(button.dataset.minus, -1);
      });

    items
      .querySelectorAll("[data-plus]")
      .forEach((button) => {
        button.onclick = () =>
          change(button.dataset.plus, 1);
      });

    items
      .querySelectorAll("[data-remove]")
      .forEach((button) => {
        button.onclick = () => {
          cart = cart.filter(
            (item) =>
              String(item.id) !==
              String(button.dataset.remove)
          );

          saveCart();
        };
      });
  }

  function add(id) {
    const product = products.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (!product) return;

    const existing = cart.find(
      (item) =>
        String(item.id) === String(id)
    );

    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: Number(product.price) || 0,
        qty: 1
      });
    }

    saveCart();
    toast("تمت إضافة المنتج إلى السلة ✓");
  }

  function change(id, delta) {
    const item = cart.find(
      (entry) =>
        String(entry.id) === String(id)
    );

    if (!item) return;

    item.qty =
      (Number(item.qty) || 0) + delta;

    if (item.qty < 1) {
      cart = cart.filter(
        (entry) =>
          String(entry.id) !== String(id)
      );
    }

    saveCart();
  }

  function openModal(modal) {
    if (!modal) return;

    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal(modal) {
    if (!modal) return;

    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  async function loadProducts() {
    if (!db) return;

    try {
      const { data, error } =
        await db
          .from("products")
          .select("*")
          .order("created_at", {
            ascending: false
          });

      if (error) {
        console.warn("products:", error);
        return;
      }

      if (Array.isArray(data) && data.length) {
        products = data.map((product) => ({
          id: product.id,
          name:
            product.name ||
            product.title ||
            "منتج",
          category:
            product.category || "",
          price:
            Number(product.price) || 0,
          image:
            product.image_url ||
            product.image ||
            "",
          image_url:
            product.image_url ||
            product.image ||
            "",
          description:
            product.description || ""
        }));
      } else {
        products = [];
      }
    } catch (error) {
      console.warn("loadProducts:", error);
    }

    renderProducts();
  }

  async function connect() {
    if (
      !cfg.SUPABASE_URL ||
      !cfg.SUPABASE_ANON_KEY ||
      !supabaseLib
    ) {
      console.warn(
        "Supabase configuration missing."
      );

      setStoreColor(DEFAULT_STORE_COLOR);
      renderProducts();
      return;
    }

    try {
      db = supabaseLib.createClient(
        cfg.SUPABASE_URL,
        cfg.SUPABASE_ANON_KEY
      );

      window.HAYATI_DB = db;

      await Promise.all([
        loadSiteSettings(),
        loadProducts()
      ]);

      renderProducts();
    } catch (error) {
      console.warn("connect:", error);
      setStoreColor(DEFAULT_STORE_COLOR);
      renderProducts();
    }
  }

  function setupWilayas() {
    const select = $("#wilaya");

    if (!select) return;

    select.innerHTML =
      '<option value="">اختاري الولاية</option>' +
      wilayas
        .map(
          (wilaya) =>
            `<option value="${esc(wilaya)}">${esc(wilaya)}</option>`
        )
        .join("");
  }

  function setupCategories() {
    document
      .querySelectorAll(".category")
      .forEach((button) => {
        button.onclick = () => {

          activeCat =
            activeCat === button.dataset.cat
              ? ""
              : button.dataset.cat;

          document
            .querySelectorAll(".category")
            .forEach((item) => {
              item.classList.toggle(
                "active",
                item === button && !!activeCat
              );
            });

          renderProducts();

          $("#products")?.scrollIntoView({
            behavior: "smooth"
          });
        };
      });
  }

  function setupSearch() {
    $("#search")?.addEventListener(
      "input",
      renderProducts
    );

    $("#mobileSearchBtn")?.addEventListener(
      "click",
      () => {
        $("#searchWrap")?.classList.toggle("open");
        $("#search")?.focus();
      }
    );
  }

  function setupCart() {
    $("#cartBtn")?.addEventListener(
      "click",
      () => openModal($("#cartModal"))
    );

    $("#closeCart")?.addEventListener(
      "click",
      () => closeModal($("#cartModal"))
    );

    $("#checkoutBtn")?.addEventListener(
      "click",
      () => {

        if (!cart.length) {
          toast(
            "السلة فارغة، أضيفي منتجا أولا"
          );
          return;
        }

        closeModal($("#cartModal"));
        openModal($("#checkoutModal"));

        const message = $("#orderMsg");

        if (message) {
          message.textContent = "";
        }
      }
    );

    $("#closeCheckout")?.addEventListener(
      "click",
      () => closeModal($("#checkoutModal"))
    );

    document
      .querySelectorAll(".modal, .overlay")
      .forEach((modal) => {
        modal.addEventListener(
          "click",
          (event) => {
            if (event.target === modal) {
              closeModal(modal);
            }
          }
        );
      });
  }

  async function submitOrder(event) {
    event.preventDefault();

    const message = $("#orderMsg");

    if (!message) return;

    message.textContent =
      "جاري إرسال الطلب...";

    if (!db) {
      message.textContent =
        "تعذر الاتصال بقاعدة البيانات.";
      return;
    }

    const form = new FormData(event.target);

    const customer_name =
      String(
        form.get("customer_name") || ""
      ).trim();

    const phone =
      String(form.get("phone") || "").trim();

    const wilaya =
      String(form.get("wilaya") || "");

    const municipality =
      String(
        form.get("municipality") || ""
      ).trim();

    const pickup =
      String(
        form.get("pickup_point") || ""
      ).trim();

    if (
      !customer_name ||
      !phone ||
      !wilaya ||
      !municipality ||
      !pickup
    ) {
      message.textContent =
        "يرجى ملء جميع الخانات المطلوبة.";
      return;
    }

    const total = cart.reduce(
      (sum, item) =>
        sum +
        (Number(item.price) || 0) *
        (Number(item.qty) || 0),
      0
    );

    const base = {
      customer_name,
      phone,
      wilaya,
      municipality,
      items: cart,
      total
    };

    try {
      const variants = [
        {
          ...base,
          pickup_point: pickup
        },
        {
          ...base,
          address: pickup
        },
        {
          ...base,
          pickup_point: pickup,
          customer_address: pickup
        },
        {
          ...base,
          address: pickup,
          customer_address: pickup
        }
      ];

      let lastError = null;
      let success = false;

      for (const payload of variants) {
        const result =
          await db
            .from("orders")
            .insert(payload);

        if (!result.error) {
          success = true;
          break;
        }

        lastError = result.error;

        const text =
          String(
            result.error.message || ""
          ).toLowerCase();

        if (
          !/column|schema cache|does not exist|could not find|unknown/i.test(
            text
          )
        ) {
          break;
        }
      }

      if (!success) {
        throw (
          lastError ||
          new Error("تعذر حفظ الطلب")
        );
      }

      cart = [];
      saveCart();

      event.target.reset();

      message.textContent =
        "تم تأكيد طلبك بنجاح ✓";

      toast("تم تأكيد طلبك بنجاح ✓");

    } catch (error) {
      console.error("order:", error);

      const detail =
        String(error?.message || "");

      if (
        /row-level|permission|policy|rls/i.test(
          detail
        )
      ) {
        message.textContent =
          "الطلب جاهز، لكن صلاحية إضافة الطلبات في Supabase تحتاج إلى تفعيل.";
      } else {
        message.textContent =
          "تعذر إرسال الطلب إلى قاعدة البيانات.";
      }
    }
  }

  function setupOrderForm() {
    $("#orderForm")?.addEventListener(
      "submit",
      submitOrder
    );
  }

  $("#showAll")?.addEventListener(
    "click",
    () => {
      activeCat = "";

      document
        .querySelectorAll(".category")
        .forEach((item) =>
          item.classList.remove("active")
        );

      renderProducts();

      $("#products")?.scrollIntoView({
        behavior: "smooth"
      });
    }
  );

  setupWilayas();
  setupCategories();
  setupSearch();
  setupCart();
  setupOrderForm();

  renderCart();
  renderProducts();

  setStoreColor(DEFAULT_STORE_COLOR);

  applyLogo("");

  connect();

})();
