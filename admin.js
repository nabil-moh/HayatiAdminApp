(() => {
  "use strict";

  const cfg = window.HAYATI_CONFIG || {};
  const sb = window.supabase;

  const $ = (id) => document.getElementById(id);

  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !sb) {
    const msg = $("loginMsg");
    if (msg) {
      msg.textContent = "إعدادات Supabase غير موجودة أو لم يتم تحميلها.";
    }
    return;
  }

  const db = sb.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

  const state = {
    orders: [],
    products: [],
    selectedOrder: null,
    settings: null,
    loadingSettings: false
  };

  const DEFAULT_ADMIN_COLOR = "#7c3aed";
  const DEFAULT_STORE_COLOR = "#d9a5b8";

  function setCssVariable(name, value) {
    if (!value) return;
    document.documentElement.style.setProperty(name, value);
  }

  function setAdminColor(color) {
    const value = color || DEFAULT_ADMIN_COLOR;

    setCssVariable("--admin-color", value);
    setCssVariable("--primary-color", value);
    setCssVariable("--accent-color", value);
    setCssVariable("--admin-primary", value);
    setCssVariable("--admin-accent", value);
    setCssVariable("--primary", value);
  }

  function setStoreColor(color) {
    const value = color || DEFAULT_STORE_COLOR;

    setCssVariable("--store-color", value);
    setCssVariable("--store-primary-color", value);
    setCssVariable("--store-primary", value);
    setCssVariable("--store-accent", value);
    setCssVariable("--store-color-primary", value);
  }

  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;"
        })[char]
    );
  }

  function fmtDate(value) {
    if (!value) return "";

    try {
      return new Date(value).toLocaleString("ar-DZ");
    } catch {
      return String(value);
    }
  }

  function showMessage(id, text) {
    const element = $(id);
    if (element) {
      element.textContent = text || "";
    }
  }

  function updateBadge() {
    const badge = $("notificationCount");

    if (badge) {
      badge.textContent = String(state.orders.length);
    }
  }

  function showSection(name) {
    document.querySelectorAll(".section").forEach((section) => {
      section.classList.remove("active");
    });

    const target = $(name);

    if (target) {
      target.classList.add("active");
    }

    $("sideMenu")?.classList.remove("open");
  }

  function applySettings(data) {
    if (!data) return;

    state.settings = data;

    const adminColor =
      data.admin_color || DEFAULT_ADMIN_COLOR;

    const storeColor =
      data.store_color || DEFAULT_STORE_COLOR;

    setAdminColor(adminColor);
    setStoreColor(storeColor);

    const adminInput = $("adminColor");

    if (adminInput) {
      adminInput.value = adminColor;
    }

    const storeInput = $("storeColor");

    if (storeInput) {
      storeInput.value = storeColor;
    }

    const preview = $("logoPreview");

    if (data.logo_url && preview) {
      preview.src = data.logo_url;
      preview.hidden = false;
    }

    document.querySelectorAll("[data-site-logo]").forEach((img) => {
      if (data.logo_url) {
        img.src = data.logo_url;
      }
    });
  }

  async function getSettingsRow() {
    const { data, error } = await db
      .from("site_settings")
      .select("*")
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("getSettingsRow:", error);
      return null;
    }

    return data || null;
  }

  async function loadSettings() {
    if (state.loadingSettings) return;

    state.loadingSettings = true;

    try {
      const { data, error } = await db
        .from("site_settings")
        .select("*")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("loadSettings:", error);

        setAdminColor(DEFAULT_ADMIN_COLOR);
        setStoreColor(DEFAULT_STORE_COLOR);

        showMessage(
          "settingsMsg",
          "تعذر تحميل الإعدادات: " + error.message
        );

        return;
      }

      if (!data) {
        setAdminColor(DEFAULT_ADMIN_COLOR);
        setStoreColor(DEFAULT_STORE_COLOR);

        const adminInput = $("adminColor");
        const storeInput = $("storeColor");

        if (adminInput) {
          adminInput.value = DEFAULT_ADMIN_COLOR;
        }

        if (storeInput) {
          storeInput.value = DEFAULT_STORE_COLOR;
        }

        return;
      }

      applySettings(data);
    } finally {
      state.loadingSettings = false;
    }
  }

  async function saveColors() {
    const adminInput = $("adminColor");
    const storeInput = $("storeColor");

    const adminColor =
      adminInput?.value || DEFAULT_ADMIN_COLOR;

    const storeColor =
      storeInput?.value || DEFAULT_STORE_COLOR;

    showMessage("settingsMsg", "جارٍ حفظ الألوان...");

    setAdminColor(adminColor);
    setStoreColor(storeColor);

    try {
      const current = await getSettingsRow();

      let result;

      if (current?.id !== undefined) {
        result = await db
          .from("site_settings")
          .update({
            admin_color: adminColor,
            store_color: storeColor,
            updated_at: new Date().toISOString()
          })
          .eq("id", current.id)
          .select()
          .maybeSingle();
      } else {
        result = await db
          .from("site_settings")
          .insert({
            admin_color: adminColor,
            store_color: storeColor,
            logo_url: null,
            updated_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();
      }

      if (result.error) {
        console.error("saveColors:", result.error);

        showMessage(
          "settingsMsg",
          "❌ تعذر حفظ الألوان: " + result.error.message
        );

        return;
      }

      state.settings =
        result.data || {
          ...(state.settings || {}),
          admin_color: adminColor,
          store_color: storeColor
        };

      showMessage(
        "settingsMsg",
        "✅ تم حفظ الألوان بنجاح."
      );
    } catch (error) {
      console.error("saveColors exception:", error);

      showMessage(
        "settingsMsg",
        "❌ حدث خطأ أثناء حفظ الألوان."
      );
    }
  }

  function setupLogoPreview() {
    const input = $("logoFile");

    if (!input) return;

    input.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      const preview = $("logoPreview");

      if (!file) return;

      if (!file.type.startsWith("image/")) {
        showMessage(
          "settingsMsg",
          "الرجاء اختيار صورة صحيحة."
        );

        input.value = "";
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showMessage(
          "settingsMsg",
          "حجم الصورة كبير جدًا. الحد الأقصى 10MB."
        );

        input.value = "";
        return;
      }

      if (preview) {
        if (preview.dataset.objectUrl) {
          URL.revokeObjectURL(
            preview.dataset.objectUrl
          );
        }

        const url = URL.createObjectURL(file);

        preview.src = url;
        preview.hidden = false;
        preview.dataset.objectUrl = url;
      }

      showMessage(
        "settingsMsg",
        "تم اختيار الشعار. اضغط حفظ الشعار."
      );
    });
  }

  async function saveLogo() {
    const input = $("logoFile");
    const file = input?.files?.[0];
    const preview = $("logoPreview");

    if (!file) {
      showMessage(
        "settingsMsg",
        "اختَر صورة الشعار أولًا."
      );

      return;
    }

    if (!file.type.startsWith("image/")) {
      showMessage(
        "settingsMsg",
        "الملف المختار ليس صورة."
      );

      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showMessage(
        "settingsMsg",
        "حجم الصورة كبير جدًا. الحد الأقصى 10MB."
      );

      return;
    }

    showMessage(
      "settingsMsg",
      "جارٍ رفع الشعار..."
    );

    try {
      const originalExtension =
        file.name.includes(".")
          ? file.name.split(".").pop().toLowerCase()
          : "jpg";

      const extension =
        originalExtension.replace(
          /[^a-z0-9]/g,
          ""
        ) || "jpg";

      const path =
        "logo-" +
        Date.now() +
        "-" +
        Math.random().toString(36).slice(2, 8) +
        "." +
        extension;

      const { error: uploadError } =
        await db.storage
          .from("hayati-assets")
          .upload(path, file, {
            upsert: false,
            contentType: file.type || "image/jpeg",
            cacheControl: "3600"
          });

      if (uploadError) {
        console.error(
          "logo upload:",
          uploadError
        );

        showMessage(
          "settingsMsg",
          "❌ تعذر رفع الشعار: " +
            uploadError.message
        );

        return;
      }

      const { data: publicData } =
        db.storage
          .from("hayati-assets")
          .getPublicUrl(path);

      const logoUrl =
        publicData?.publicUrl;

      if (!logoUrl) {
        showMessage(
          "settingsMsg",
          "تم رفع الشعار لكن تعذر الحصول على الرابط."
        );

        return;
      }

      showMessage(
        "settingsMsg",
        "جارٍ حفظ الشعار..."
      );

      const current = await getSettingsRow();

      let result;

      if (current?.id !== undefined) {
        result = await db
          .from("site_settings")
          .update({
            logo_url: logoUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", current.id)
          .select()
          .maybeSingle();
      } else {
        result = await db
          .from("site_settings")
          .insert({
            admin_color: DEFAULT_ADMIN_COLOR,
            store_color: DEFAULT_STORE_COLOR,
            logo_url: logoUrl,
            updated_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();
      }

      if (result.error) {
        console.error(
          "logo settings:",
          result.error
        );

        showMessage(
          "settingsMsg",
          "تم رفع الشعار لكن تعذر حفظه: " +
            result.error.message
        );

        return;
      }

      state.settings =
        result.data || {
          ...(state.settings || {}),
          logo_url: logoUrl
        };

      if (preview) {
        preview.src = logoUrl;
        preview.hidden = false;
        delete preview.dataset.objectUrl;
      }

      document.querySelectorAll("[data-site-logo]").forEach((img) => {
        img.src = logoUrl;
      });

      input.value = "";

      showMessage(
        "settingsMsg",
        "✅ تم حفظ الشعار بنجاح."
      );
    } catch (error) {
      console.error(
        "saveLogo exception:",
        error
      );

      showMessage(
        "settingsMsg",
        "❌ حدث خطأ أثناء حفظ الشعار."
      );
    }
  }

  async function loadOrders() {
    const box = $("ordersList");

    if (!box) return;

    box.innerHTML =
      "<p>جارٍ تحميل الطلبات...</p>";

    try {
      const { data, error } =
        await db
          .from("orders")
          .select("*")
          .order("created_at", {
            ascending: false
          });

      if (error) {
        box.innerHTML =
          "<p>تعذر تحميل الطلبات: " +
          esc(error.message) +
          "</p>";

        return;
      }

      state.orders = data || [];

      const stat = $("ordersStat");

      if (stat) {
        stat.textContent =
          String(state.orders.length);
      }

      updateBadge();
      renderOrders();
    } catch (error) {
      console.error(
        "loadOrders:",
        error
      );

      box.innerHTML =
        "<p>حدث خطأ أثناء تحميل الطلبات.</p>";
    }
  }

  function renderOrders() {
    const box = $("ordersList");

    if (!box) return;

    if (!state.orders.length) {
      box.innerHTML =
        "<p>لا توجد طلبات.</p>";

      return;
    }

    box.innerHTML =
      state.orders
        .map(
          (order, index) => `
            <div
              class="order-card"
              data-order="${index}"
            >
              <b>طلب #${index + 1}</b>
              <br>

              ${esc(
                order.customer_name ||
                  order.name ||
                  "بدون اسم"
              )}

              —

              ${esc(
                order.phone ||
                  "بدون هاتف"
              )}

              <br>

              <small>
                ${esc(
                  fmtDate(order.created_at)
                )}

                —

                الإجمالي:
                ${esc(
                  String(
                    order.total ??
                      "غير محدد"
                  )
                )}
              </small>
            </div>
          `
        )
        .join("");

    box
      .querySelectorAll(".order-card")
      .forEach((card) => {
        card.addEventListener(
          "click",
          () => {
            openOrder(
              Number(
                card.dataset.order
              )
            );
          }
        );
      });
  }

  function openOrder(index) {
    const order =
      state.orders[index];

    if (!order) return;

    state.selectedOrder = order;

    const details =
      $("orderDetails");

    const modal =
      $("orderModal");

    if (!details || !modal) return;

    const items =
      Array.isArray(order.items)
        ? order.items
        : [];

    details.innerHTML = `
      <p>
        <b>الاسم:</b>
        ${esc(
          order.customer_name ||
            order.name ||
            ""
        )}
      </p>

      <p>
        <b>الهاتف:</b>
        ${esc(order.phone || "")}
      </p>

      <p>
        <b>الولاية:</b>
        ${esc(order.wilaya || "")}
      </p>

      <p>
        <b>العنوان:</b>
        ${esc(order.address || "")}
      </p>

      <p>
        <b>ملاحظات:</b>
        ${esc(order.notes || "")}
      </p>

      <p>
        <b>الحالة:</b>
        ${esc(order.status || "")}
      </p>

      <p>
        <b>التاريخ:</b>
        ${esc(fmtDate(order.created_at))}
      </p>

      <hr>

      <h3>المنتجات</h3>

      ${
        items.length
          ? items
              .map(
                (item) => `
                  <div class="order-item">
                    ${
                      item.image_url ||
                      item.image
                        ? `
                          <img
                            src="${esc(
                              item.image_url ||
                                item.image
                            )}"
                            alt=""
                          >
                        `
                        : ""
                    }

                    <div>
                      <b>
                        ${esc(
                          item.name ||
                            item.title ||
                            "منتج"
                        )}
                      </b>

                      <br>

                      الكمية:
                      ${esc(
                        String(
                          item.quantity ??
                            item.qty ??
                            1
                        )
                      )}

                      <br>

                      السعر:
                      ${esc(
                        String(
                          item.price ?? ""
                        )
                      )}
                    </div>
                  </div>
                `
              )
              .join("")
          : "<p>لا توجد تفاصيل منتجات داخل الطلب.</p>"
      }

      <h3>
        الإجمالي:
        ${esc(
          String(
            order.total ??
              "غير محدد"
          )
        )}
      </h3>
    `;

    modal.classList.remove("hidden");
  }

  async function deleteOrder() {
    const order =
      state.selectedOrder;

    if (!order?.id) {
      alert(
        "معرّف الطلب غير موجود."
      );

      return;
    }

    if (
      !confirm(
        "هل تريد حذف هذا الطلب نهائيًا؟"
      )
    ) {
      return;
    }

    const { error } =
      await db
        .from("orders")
        .delete()
        .eq("id", order.id);

    if (error) {
      alert(
        "تعذر حذف الطلب: " +
          error.message
      );

      return;
    }

    state.selectedOrder = null;

    $("orderModal")
      ?.classList.add("hidden");

    await loadOrders();
  }

  async function loadProducts() {
    const box =
      $("productsList");

    if (!box) return;

    box.innerHTML =
      "<p>جارٍ تحميل المنتجات...</p>";

    try {
      const { data, error } =
        await db
          .from("products")
          .select("*")
          .order("created_at", {
            ascending: false
          });

      if (error) {
        box.innerHTML =
          "<p>تعذر تحميل المنتجات. تأكد من جدول products.</p>";

        console.error(
          "loadProducts:",
          error
        );

        return;
      }

      state.products = data || [];

      const stat =
        $("productsStat");

      if (stat) {
        stat.textContent =
          String(
            state.products.length
          );
      }

      renderProducts();
    } catch (error) {
      console.error(
        "loadProducts exception:",
        error
      );

      box.innerHTML =
        "<p>حدث خطأ أثناء تحميل المنتجات.</p>";
    }
  }

  function renderProducts() {
    const box =
      $("productsList");

    if (!box) return;

    if (!state.products.length) {
      box.innerHTML =
        "<p>لا توجد منتجات في جدول المنتجات.</p>";

      return;
    }

    box.innerHTML =
      state.products
        .map(
          (product, index) => {
            const image =
              product.image_url ||
              product.image ||
              "";

            return `
              <div class="product-card">

                ${
                  image
                    ? `
                      <img
                        src="${esc(image)}"
                        alt=""
                      >
                    `
                    : "<div></div>"
                }

                <div>
                  <b>
                    ${esc(
                      product.name ||
                        "بدون اسم"
                    )}
                  </b>

                  <br>

                  الفئة:
                  ${esc(
                    product.category ||
                      ""
                  )}

                  <br>

                  السعر:
                  ${esc(
                    String(
                      product.price ?? ""
                    )
                  )}

                  ${
                    product.old_price !== null &&
                    product.old_price !== undefined &&
                    product.old_price !== ""
                      ? `
                        — القديم:
                        ${esc(
                          String(
                            product.old_price
                          )
                        )}
                      `
                      : ""
                  }

                  <br>

                  المخزون:
                  ${esc(
                    String(
                      product.stock ??
                        "غير محدد"
                    )
                  )}
                </div>

                <div class="actions">

                  <button
                    class="secondary"
                    data-edit="${index}"
                  >
                    ✏️ تعديل
                  </button>

                  <button
                    class="danger"
                    data-del="${index}"
                  >
                    🗑️ حذف
                  </button>

                </div>
              </div>
            `;
          }
        )
        .join("");

    box
      .querySelectorAll("[data-edit]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            editProduct(
              Number(
                button.dataset.edit
              )
            );
          }
        );
      });

    box
      .querySelectorAll("[data-del]")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            deleteProduct(
              Number(
                button.dataset.del
              )
            );
          }
        );
      });
  }

  function editProduct(index) {
    const product =
      state.products[index];

    if (!product) return;

    $("productId").value =
      product.id || "";

    $("productName").value =
      product.name || "";

    $("productCategory").value =
      product.category || "";

    $("productPrice").value =
      product.price ?? "";

    $("productOldPrice").value =
      product.old_price ?? "";

    $("productStock").value =
      product.stock ?? "";

    $("productImage").value =
      product.image_url ||
      product.image ||
      "";

    $("productDescription").value =
      product.description || "";

    $("productModal")
      ?.classList.remove("hidden");
  }

  async function saveProduct() {
    const id =
      $("productId")?.value;

    if (!id) {
      alert(
        "لم يتم تحديد المنتج."
      );

      return;
    }

    const priceValue =
      $("productPrice")?.value;

    const oldPriceValue =
      $("productOldPrice")?.value;

    const stockValue =
      $("productStock")?.value;

    const patch = {
      name:
        $("productName")
          ?.value
          .trim() || "",

      category:
        $("productCategory")
          ?.value
          .trim() || "",

      price:
        priceValue === ""
          ? 0
          : Number(priceValue),

      old_price:
        oldPriceValue === ""
          ? null
          : Number(oldPriceValue),

      stock:
        stockValue === ""
          ? null
          : Number(stockValue),

      image_url:
        $("productImage")
          ?.value
          .trim() || "",

      description:
        $("productDescription")
          ?.value
          .trim() || ""
    };

    const { error } =
      await db
        .from("products")
        .update(patch)
        .eq("id", id);

    if (error) {
      alert(
        "تعذر حفظ المنتج: " +
          error.message
      );

      return;
    }

    $("productModal")
      ?.classList.add("hidden");

    await loadProducts();
  }

  async function deleteProduct(index) {
    const product =
      state.products[index];

    if (!product?.id) return;

    if (
      !confirm(
        "هل تريد حذف هذا المنتج؟"
      )
    ) {
      return;
    }

    const { error } =
      await db
        .from("products")
        .delete()
        .eq("id", product.id);

    if (error) {
      alert(
        "تعذر حذف المنتج: " +
          error.message
      );

      return;
    }

    await loadProducts();
  }

  let applicationLoading = false;

  async function showApplication() {
    if (applicationLoading) return;

    applicationLoading = true;

    try {
      $("loginScreen")
        ?.classList.add("hidden");

      $("app")
        ?.classList.remove("hidden");

      await Promise.all([
        loadOrders(),
        loadProducts(),
        loadSettings()
      ]);
    } finally {
      applicationLoading = false;
    }
  }

  async function login() {
    const email =
      $("email")
        ?.value
        .trim() || "";

    const password =
      $("password")
        ?.value || "";

    if (!email || !password) {
      showMessage(
        "loginMsg",
        "أدخل البريد الإلكتروني وكلمة المرور."
      );

      return;
    }

    showMessage(
      "loginMsg",
      "جارٍ الدخول..."
    );

    try {
      const { error } =
        await db.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        console.error(
          "login:",
          error
        );

        showMessage(
          "loginMsg",
          "تعذر تسجيل الدخول: " +
            error.message
        );

        return;
      }

      showMessage(
        "loginMsg",
        "تم تسجيل الدخول..."
      );
    } catch (error) {
      console.error(
        "login exception:",
        error
      );

      showMessage(
        "loginMsg",
        "حدث خطأ أثناء تسجيل الدخول."
      );
    }
  }

  async function restoreSession() {
    try {
      const { data, error } =
        await db.auth.getSession();

      if (error) {
        console.error(
          "session:",
          error
        );

        return;
      }

      if (data?.session) {
        await showApplication();
      }
    } catch (error) {
      console.error(
        "restoreSession:",
        error
      );
    }
  }

  db.auth.onAuthStateChange(
    (event, session) => {
      if (
        event === "SIGNED_IN" &&
        session
      ) {
        setTimeout(() => {
          showApplication();
        }, 0);
      }
    }
  );

  $("loginBtn")
    ?.addEventListener(
      "click",
      login
    );

  $("password")
    ?.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          login();
        }
      }
    );

  $("passwordToggle")
    ?.addEventListener(
      "click",
      () => {
        const password =
          $("password");

        if (!password) return;

        password.type =
          password.type === "password"
            ? "text"
            : "password";
      }
    );

  $("logoutBtn")
    ?.addEventListener(
      "click",
      async () => {
        await db.auth.signOut();
        location.reload();
      }
    );

  $("menuBtn")
    ?.addEventListener(
      "click",
      () => {
        $("sideMenu")
          ?.classList.toggle(
            "open"
          );
      }
    );

  document
    .querySelectorAll(
      "#sideMenu [data-section]"
    )
    .forEach((button) => {
      button.addEventListener(
        "click",
        () => {
          showSection(
            button.dataset.section
          );
        }
      );
    });

  $("notificationBtn")
    ?.addEventListener(
      "click",
      () => {
        showSection("orders");
      }
    );

  $("ordersRefresh")
    ?.addEventListener(
      "click",
      loadOrders
    );

  $("productsRefresh")
    ?.addEventListener(
      "click",
      loadProducts
    );

  $("homeRefresh")
    ?.addEventListener(
      "click",
      async () => {
        await Promise.all([
          loadOrders(),
          loadProducts(),
          loadSettings()
        ]);
      }
    );

  $("deleteOrderBtn")
    ?.addEventListener(
      "click",
      deleteOrder
    );

  $("closeOrderModal")
    ?.addEventListener(
      "click",
      () => {
        $("orderModal")
          ?.classList.add(
            "hidden"
          );
      }
    );

  $("closeProductModal")
    ?.addEventListener(
      "click",
      () => {
        $("productModal")
          ?.classList.add(
            "hidden"
          );
      }
    );

  $("saveProduct")
    ?.addEventListener(
      "click",
      saveProduct
    );

  $("saveColors")
    ?.addEventListener(
      "click",
      saveColors
    );

  $("saveLogo")
    ?.addEventListener(
      "click",
      saveLogo
    );

  $("adminColor")
    ?.addEventListener(
      "input",
      (event) => {
        setAdminColor(
          event.target.value
        );
      }
    );

  $("storeColor")
    ?.addEventListener(
      "input",
      (event) => {
        setStoreColor(
          event.target.value
        );
      }
    );

  window.addEventListener(
    "click",
    (event) => {
      const orderModal =
        $("orderModal");

      const productModal =
        $("productModal");

      if (
        event.target ===
        orderModal
      ) {
        orderModal.classList.add(
          "hidden"
        );
      }

      if (
        event.target ===
        productModal
      ) {
        productModal.classList.add(
          "hidden"
        );
      }
    }
  );

  db.channel("hayati-orders")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders"
      },
      () => {
        loadOrders();
      }
    )
    .subscribe();

  setAdminColor(
    DEFAULT_ADMIN_COLOR
  );

  setStoreColor(
    DEFAULT_STORE_COLOR
  );

  setupLogoPreview();

  restoreSession();
})();
