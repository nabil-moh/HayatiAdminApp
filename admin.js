(() => {
  "use strict";

  const cfg = window.HAYATI_CONFIG || {};
  const sb = window.supabase;

  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !sb) {
    const msg = document.getElementById("loginMsg");
    if (msg) {
      msg.textContent = "إعدادات Supabase غير موجودة أو لم يتم تحميلها.";
    }
    return;
  }

  const db = sb.createClient(
    cfg.SUPABASE_URL,
    cfg.SUPABASE_ANON_KEY
  );

  const $ = id => document.getElementById(id);

  const state = {
    orders: [],
    products: [],
    selectedOrder: null
  };

  /* =========================
     أدوات عامة
  ========================= */

  function setAdminColor(color) {
    document.documentElement.style.setProperty(
      "--admin-color",
      color || "#7c3aed"
    );
  }

  function updateBadge() {
    const badge = $("notificationCount");
    if (badge) {
      badge.textContent = String(state.orders.length);
    }
  }

  function showSection(name) {
    document.querySelectorAll(".section").forEach(section => {
      section.classList.remove("active");
    });

    const target = $(name);
    if (target) {
      target.classList.add("active");
    }

    const menu = $("sideMenu");
    if (menu) {
      menu.classList.remove("open");
    }
  }

  function fmtDate(value) {
    try {
      return value
        ? new Date(value).toLocaleString("ar-DZ")
        : "";
    } catch {
      return value || "";
    }
  }

  function esc(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char])
    );
  }

  /* =========================
     الطلبات
  ========================= */

  async function loadOrders() {
    const box = $("ordersList");
    if (!box) return;

    box.innerHTML = "<p>جارٍ تحميل الطلبات...</p>";

    const { data, error } = await db
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

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
      stat.textContent = state.orders.length;
    }

    updateBadge();
    renderOrders();
  }

  function renderOrders() {
    const box = $("ordersList");
    if (!box) return;

    if (!state.orders.length) {
      box.innerHTML = "<p>لا توجد طلبات.</p>";
      return;
    }

    box.innerHTML = state.orders.map((order, index) => `
      <div class="order-card" data-order="${index}">
        <b>طلب #${index + 1}</b><br>
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
          ${fmtDate(order.created_at)}
          —
          الإجمالي:
          ${esc(String(order.total ?? "غير محدد"))}
        </small>
      </div>
    `).join("");

    document.querySelectorAll(".order-card").forEach(card => {
      card.onclick = () => {
        openOrder(Number(card.dataset.order));
      };
    });
  }

  function openOrder(index) {
    const order = state.orders[index];
    if (!order) return;

    state.selectedOrder = order;

    const items = Array.isArray(order.items)
      ? order.items
      : [];

    const details = $("orderDetails");
    const modal = $("orderModal");

    if (!details || !modal) return;

    details.innerHTML = `
      <p>
        <b>الاسم:</b>
        ${esc(order.customer_name || order.name || "")}
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
        ${fmtDate(order.created_at)}
      </p>

      <hr>

      <h3>المنتجات</h3>

      ${
        items.length
          ? items.map(item => `
              <div class="order-item">
                ${
                  item.image_url || item.image
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
            `).join("")
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
    if (!state.selectedOrder?.id) {
      alert("معرّف الطلب غير موجود.");
      return;
    }

    if (!confirm("هل تريد حذف هذا الطلب نهائيًا؟")) {
      return;
    }

    const { error } = await db
      .from("orders")
      .delete()
      .eq("id", state.selectedOrder.id);

    if (error) {
      alert(
        "تعذر حذف الطلب: " +
        error.message
      );
      return;
    }

    const modal = $("orderModal");
    if (modal) {
      modal.classList.add("hidden");
    }

    state.selectedOrder = null;

    await loadOrders();
  }

  /* =========================
     المنتجات
  ========================= */

  async function loadProducts() {
    const box = $("productsList");
    if (!box) return;

    box.innerHTML =
      "<p>جارٍ تحميل المنتجات...</p>";

    const { data, error } = await db
      .from("products")
      .select("*")
      .order("created_at", {
        ascending: false
      });

    if (error) {
      box.innerHTML =
        "<p>تعذر تحميل المنتجات. تأكد من جدول products.</p>";
      return;
    }

    state.products = data || [];

    const stat = $("productsStat");
    if (stat) {
      stat.textContent =
        state.products.length;
    }

    renderProducts();
  }

  function renderProducts() {
    const box = $("productsList");
    if (!box) return;

    if (!state.products.length) {
      box.innerHTML =
        "<p>لا توجد منتجات في جدول المنتجات.</p>";
      return;
    }

    box.innerHTML = state.products.map((product, index) => {
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
              product.old_price
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
    }).join("");

    document.querySelectorAll(
      "[data-edit]"
    ).forEach(button => {
      button.onclick = () => {
        editProduct(
          Number(
            button.dataset.edit
          )
        );
      };
    });

    document.querySelectorAll(
      "[data-del]"
    ).forEach(button => {
      button.onclick = () => {
        deleteProduct(
          Number(
            button.dataset.del
          )
        );
      };
    });
  }

  function editProduct(index) {
    const product =
      state.products[index];

    if (!product) return;

    if ($("productId"))
      $("productId").value =
        product.id || "";

    if ($("productName"))
      $("productName").value =
        product.name || "";

    if ($("productCategory"))
      $("productCategory").value =
        product.category || "";

    if ($("productPrice"))
      $("productPrice").value =
        product.price ?? "";

    if ($("productOldPrice"))
      $("productOldPrice").value =
        product.old_price ?? "";

    if ($("productStock"))
      $("productStock").value =
        product.stock ?? "";

    if ($("productImage"))
      $("productImage").value =
        product.image_url ||
        product.image ||
        "";

    if ($("productDescription"))
      $("productDescription").value =
        product.description ||
        "";

    const modal =
      $("productModal");

    if (modal) {
      modal.classList.remove(
        "hidden"
      );
    }
  }

  async function saveProduct() {
    const id =
      $("productId")?.value || "";

    if (!id) {
      alert(
        "لم يتم تحديد المنتج."
      );
      return;
    }

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
        Number(
          $("productPrice")
            ?.value || 0
        ),

      old_price:
        $("productOldPrice")
          ?.value === ""
          ? null
          : Number(
              $("productOldPrice")
                ?.value
            ),

      stock:
        $("productStock")
          ?.value === ""
          ? null
          : Number(
              $("productStock")
                ?.value
            ),

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

    const modal =
      $("productModal");

    if (modal) {
      modal.classList.add(
        "hidden"
      );
    }

    await loadProducts();
  }

  async function deleteProduct(index) {
    const product =
      state.products[index];

    if (
      !product?.id ||
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

  /* =========================
     إعدادات الموقع
  ========================= */

  async function getSettingsRow() {
    const { data, error } =
      await db
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (error) {
      console.error(
        "site_settings:",
        error
      );
      return null;
    }

    return data || null;
  }

  async function updateSettings(patch) {
    const current =
      await getSettingsRow();

    if (current?.id !== undefined) {
      return await db
        .from("site_settings")
        .update(patch)
        .eq("id", current.id);
    }

    return await db
      .from("site_settings")
      .insert(patch);
  }

  async function loadSettings() {
    const { data, error } =
      await db
        .from("site_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

    if (error) {
      console.error(
        "تعذر تحميل إعدادات الموقع:",
        error
      );
      return;
    }

    if (!data) return;

    if (
      data.admin_color &&
      $("adminColor")
    ) {
      $("adminColor").value =
        data.admin_color;

      setAdminColor(
        data.admin_color
      );
    }

    if (
      data.store_color &&
      $("storeColor")
    ) {
      $("storeColor").value =
        data.store_color;
    }

    if (
      data.logo_url &&
      $("logoPreview")
    ) {
      $("logoPreview").src =
        data.logo_url;

      $("logoPreview").hidden =
        false;
    }
  }

  async function saveColors() {
    const adminColor =
      $("adminColor")?.value ||
      "#7c3aed";

    const storeColor =
      $("storeColor")?.value ||
      "#d9a5b8";

    const { error } =
      await updateSettings({
        admin_color:
          adminColor,

        store_color:
          storeColor
      });

    const msg =
      $("settingsMsg");

    if (error) {
      if (msg) {
        msg.textContent =
          "تعذر حفظ الألوان: " +
          error.message;
      }
      return;
    }

    setAdminColor(
      adminColor
    );

    if (msg) {
      msg.textContent =
        "تم حفظ الألوان بنجاح.";
    }
  }

  /* =========================
     معاينة الشعار
  ========================= */

  $("logoFile")?.addEventListener(
    "change",
    event => {
      const file =
        event.target.files?.[0];

      const preview =
        $("logoPreview");

      if (!file || !preview) {
        return;
      }

      if (!file.type.startsWith("image/")) {
        const msg =
          $("logoMsg") ||
          $("settingsMsg");

        if (msg) {
          msg.textContent =
            "الرجاء اختيار صورة صحيحة.";
        }

        event.target.value = "";
        return;
      }

      const url =
        URL.createObjectURL(file);

      preview.src = url;
      preview.hidden = false;

      const msg =
        $("logoMsg") ||
        $("settingsMsg");

      if (msg) {
        msg.textContent =
          "تم اختيار الشعار. اضغطي حفظ الشعار.";
      }
    }
  );

  /* =========================
     حفظ الشعار
  ========================= */

  async function saveLogo() {
    const input =
      $("logoFile");

    const file =
      input?.files?.[0];

    const msg =
      $("logoMsg") ||
      $("settingsMsg");

    const preview =
      $("logoPreview");

    if (!file) {
      if (msg) {
        msg.textContent =
          "اختاري صورة الشعار أولًا.";
      }
      return;
    }

    if (!file.type.startsWith("image/")) {
      if (msg) {
        msg.textContent =
          "الملف المختار ليس صورة.";
      }
      return;
    }

    if (msg) {
      msg.textContent =
        "جارٍ رفع الشعار...";
    }

    const safeName =
      file.name
        .replace(
          /[^a-zA-Z0-9._-]/g,
          "_"
        );

    const path =
      "logo-" +
      Date.now() +
      "-" +
      safeName;

    const {
      error: uploadError
    } = await db
      .storage
      .from("hayati-assets")
      .upload(
        path,
        file,
        {
          upsert: true,
          contentType:
            file.type ||
            "image/jpeg"
        }
      );

    if (uploadError) {
      if (msg) {
        msg.textContent =
          "تعذر رفع الشعار: " +
          uploadError.message;
      }

      console.error(
        uploadError
      );

      return;
    }

    const {
      data: publicData
    } = db
      .storage
      .from("hayati-assets")
      .getPublicUrl(path);

    const logoUrl =
      publicData?.publicUrl;

    if (!logoUrl) {
      if (msg) {
        msg.textContent =
          "تم رفع الشعار لكن تعذر الحصول على رابطه.";
      }
      return;
    }

    if (msg) {
      msg.textContent =
        "جارٍ حفظ الشعار...";
    }

    const {
      error: settingsError
    } = await updateSettings({
      logo_url: logoUrl
    });

    if (settingsError) {
      if (msg) {
        msg.textContent =
          "تم رفع الشعار لكن تعذر حفظ الرابط: " +
          settingsError.message;
      }

      console.error(
        settingsError
      );

      return;
    }

    if (preview) {
      preview.src =
        logoUrl;

      preview.hidden =
        false;
    }

    if (msg) {
      msg.textContent =
        "✅ تم حفظ الشعار بنجاح.";
    }

    input.value = "";
  }

  /* =========================
     تسجيل الدخول
  ========================= */

  $("passwordToggle")?.addEventListener(
    "click",
    () => {
      const password =
        $("password");

      if (!password) return;

      password.type =
        password.type ===
        "password"
          ? "text"
          : "password";
    }
  );

  $("loginBtn")?.addEventListener(
    "click",
    async () => {
      const email =
        $("email")?.value
          .trim() || "";

      const password =
        $("password")?.value || "";

      const msg =
        $("loginMsg");

      if (msg) {
        msg.textContent =
          "جارٍ الدخول...";
      }

      const {
        error
      } = await db.auth
        .signInWithPassword({
          email,
          password
        });

      if (error) {
        if (msg) {
          msg.textContent =
            error.message;
        }
        return;
      }

      if ($("loginScreen")) {
        $("loginScreen")
          .classList
          .add("hidden");
      }

      if ($("app")) {
        $("app")
          .classList
          .remove("hidden");
      }

      await Promise.all([
        loadOrders(),
        loadProducts(),
        loadSettings()
      ]);
    }
  );

  /* =========================
     تسجيل الخروج
  ========================= */

  $("logoutBtn")?.addEventListener(
    "click",
    async () => {
      await db.auth.signOut();
      location.reload();
    }
  );

  /* =========================
     القائمة
  ========================= */

  $("menuBtn")?.addEventListener(
    "click",
    () => {
      $("sideMenu")?.classList.toggle(
        "open"
      );
    }
  );

  document
    .querySelectorAll(
      "#sideMenu [data-section]"
    )
    .forEach(button => {
      button.onclick = () => {
        showSection(
          button.dataset.section
        );
      };
    });

  $("notificationBtn")?.addEventListener(
    "click",
    () => showSection("orders")
  );

  $("ordersRefresh")?.addEventListener(
    "click",
    loadOrders
  );

  $("productsRefresh")?.addEventListener(
    "click",
    loadProducts
  );

  $("homeRefresh")?.addEventListener(
    "click",
    async () => {
      await loadOrders();
      await loadProducts();
    }
  );

  $("deleteOrderBtn")?.addEventListener(
    "click",
    deleteOrder
  );

  $("closeOrderModal")?.addEventListener(
    "click",
    () => {
      $("orderModal")?.classList.add(
        "hidden"
      );
    }
  );

  $("closeProductModal")?.addEventListener(
    "click",
    () => {
      $("productModal")?.classList.add(
        "hidden"
      );
    }
  );

  $("saveProduct")?.addEventListener(
    "click",
    saveProduct
  );

  $("saveColors")?.addEventListener(
    "click",
    saveColors
  );

  $("saveLogo")?.addEventListener(
    "click",
    saveLogo
  );

  $("adminColor")?.addEventListener(
    "input",
    event => {
      setAdminColor(
        event.target.value
      );
    }
  );

  /* =========================
     تحديث الطلبات مباشرة
  ========================= */

  db.channel("hayati-orders")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders"
      },
      () => loadOrders()
    )
    .subscribe();

})();
