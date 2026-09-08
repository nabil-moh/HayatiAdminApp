(() => {
"use strict";

const cfg = window.HAYATI_CONFIG || {};
const sb = window.supabase;

const $ = id => document.getElementById(id);

/* =========================
التحقق من Supabase
========================= */

if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !sb) {
const msg = $("loginMsg");

if (msg) {
  msg.textContent =
    "إعدادات Supabase غير موجودة أو لم يتم تحميلها.";
}

return;

}

const db = sb.createClient(
cfg.SUPABASE_URL,
cfg.SUPABASE_ANON_KEY
);

/* =========================
حالة التطبيق
========================= */

const state = {
orders: [],
products: [],
selectedOrder: null,
settings: null
};

/* =========================
أدوات عامة
========================= */

function setCssVariable(name, value) {
if (!value) return;

document.documentElement.style.setProperty(
  name,
  value
);

}

function setAdminColor(color) {
const value =
color ||
"#7c3aed";

setCssVariable(
  "--admin-color",
  value
);

setCssVariable(
  "--primary-color",
  value
);

setCssVariable(
  "--accent-color",
  value
);

setCssVariable(
  "--admin-primary",
  value
);

setCssVariable(
  "--admin-accent",
  value
);

setCssVariable(
  "--primary",
  value
);

}

function setStoreColor(color) {
const value =
color ||
"#d9a5b8";

setCssVariable(
  "--store-color",
  value
);

setCssVariable(
  "--store-primary-color",
  value
);

setCssVariable(
  "--store-primary",
  value
);

setCssVariable(
  "--store-accent",
  value
);

setCssVariable(
  "--store-color-primary",
  value
);

}

function applySettings(data) {
if (!data) return;

state.settings = data;

if (data.admin_color) {
  setAdminColor(
    data.admin_color
  );

  if ($("adminColor")) {
    $("adminColor").value =
      data.admin_color;
  }
}

if (data.store_color) {
  setStoreColor(
    data.store_color
  );

  if ($("storeColor")) {
    $("storeColor").value =
      data.store_color;
  }
}

if (data.logo_url) {
  const preview =
    $("logoPreview");

  if (preview) {
    preview.src =
      data.logo_url;

    preview.hidden =
      false;
  }

  /*
   * إذا كانت هناك صورة شعار في الواجهة
   * يتم تحديثها أيضًا.
   */
  document
    .querySelectorAll(
      "[data-site-logo]"
    )
    .forEach(img => {
      img.src =
        data.logo_url;
    });
}

}

function updateBadge() {
const badge =
$("notificationCount");

if (badge) {
  badge.textContent =
    String(
      state.orders.length
    );
}

}

function showSection(name) {
document
.querySelectorAll(".section")
.forEach(section => {
section.classList.remove(
"active"
);
});

const target =
  $(name);

if (target) {
  target.classList.add(
    "active"
  );
}

const menu =
  $("sideMenu");

if (menu) {
  menu.classList.remove(
    "open"
  );
}

}

function fmtDate(value) {
try {
return value
? new Date(value).toLocaleString(
"ar-DZ"
)
: "";
} catch {
return value || "";
}
}

function esc(value) {
return String(
value ?? ""
).replace(
/[&<>"']/g,
char =>
({
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
}[char])
);
}

/* =========================
الطلبات
========================= */

async function loadOrders() {
const box =
$("ordersList");

if (!box) return;

box.innerHTML =
  "<p>جارٍ تحميل الطلبات...</p>";

const {
  data,
  error
} = await db
  .from("orders")
  .select("*")
  .order(
    "created_at",
    {
      ascending: false
    }
  );

if (error) {
  box.innerHTML =
    "<p>تعذر تحميل الطلبات: " +
    esc(error.message) +
    "</p>";

  return;
}

state.orders =
  data || [];

const stat =
  $("ordersStat");

if (stat) {
  stat.textContent =
    state.orders.length;
}

updateBadge();
renderOrders();

}

function renderOrders() {
const box =
$("ordersList");

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
            ${fmtDate(
              order.created_at
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

document
  .querySelectorAll(
    ".order-card"
  )
  .forEach(card => {
    card.onclick = () => {
      openOrder(
        Number(
          card.dataset.order
        )
      );
    };
  });

}

function openOrder(index) {
const order =
state.orders[index];

if (!order) return;

state.selectedOrder =
  order;

const items =
  Array.isArray(
    order.items
  )
    ? order.items
    : [];

const details =
  $("orderDetails");

const modal =
  $("orderModal");

if (!details || !modal) {
  return;
}

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
    ${esc(
      order.phone ||
      ""
    )}
  </p>

  <p>
    <b>الولاية:</b>
    ${esc(
      order.wilaya ||
      ""
    )}
  </p>

  <p>
    <b>العنوان:</b>
    ${esc(
      order.address ||
      ""
    )}
  </p>

  <p>
    <b>ملاحظات:</b>
    ${esc(
      order.notes ||
      ""
    )}
  </p>

  <p>
    <b>الحالة:</b>
    ${esc(
      order.status ||
      ""
    )}
  </p>

  <p>
    <b>التاريخ:</b>
    ${fmtDate(
      order.created_at
    )}
  </p>

  <hr>

  <h3>المنتجات</h3>

  ${
    items.length
      ? items
          .map(
            item => `
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
                      item.price ??
                      ""
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

modal.classList.remove(
  "hidden"
);

}

async function deleteOrder() {
if (
!state.selectedOrder?.id
) {
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

const {
  error
} = await db
  .from("orders")
  .delete()
  .eq(
    "id",
    state.selectedOrder.id
  );

if (error) {
  alert(
    "تعذر حذف الطلب: " +
    error.message
  );

  return;
}

const modal =
  $("orderModal");

if (modal) {
  modal.classList.add(
    "hidden"
  );
}

state.selectedOrder =
  null;

await loadOrders();

}

/* =========================
المنتجات
========================= */

async function loadProducts() {
const box =
$("productsList");

if (!box) return;

box.innerHTML =
  "<p>جارٍ تحميل المنتجات...</p>";

const {
  data,
  error
} = await db
  .from("products")
  .select("*")
  .order(
    "created_at",
    {
      ascending: false
    }
  );

if (error) {
  box.innerHTML =
    "<p>تعذر تحميل المنتجات. تأكد من جدول products.</p>";

  return;
}

state.products =
  data || [];

const stat =
  $("productsStat");

if (stat) {
  stat.textContent =
    state.products.length;
}

renderProducts();

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
                    src="${esc(
                      image
                    )}"
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
                  product.price ??
                  ""
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
      }
    )
    .join("");

document
  .querySelectorAll(
    "[data-edit]"
  )
  .forEach(button => {
    button.onclick = () => {
      editProduct(
        Number(
          button.dataset.edit
        )
      );
    };
  });

document
  .querySelectorAll(
    "[data-del]"
  )
  .forEach(button => {
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

if ($("productId")) {
  $("productId").value =
    product.id || "";
}

if ($("productName")) {
  $("productName").value =
    product.name || "";
}

if ($("productCategory")) {
  $("productCategory").value =
    product.category || "";
}

if ($("productPrice")) {
  $("productPrice").value =
    product.price ?? "";
}

if ($("productOldPrice")) {
  $("productOldPrice").value =
    product.old_price ?? "";
}

if ($("productStock")) {
  $("productStock").value =
    product.stock ?? "";
}

if ($("productImage")) {
  $("productImage").value =
    product.image_url ||
    product.image ||
    "";
}

if ($("productDescription")) {
  $("productDescription").value =
    product.description ||
    "";
}

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
$("productId")?.value ||
"";

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

const {
  error
} = await db
  .from("products")
  .update(patch)
  .eq(
    "id",
    id
  );

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

const {
  error
} = await db
  .from("products")
  .delete()
  .eq(
    "id",
    product.id
  );

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
const {
data,
error
} = await db
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

/*
 * إذا كان صف الإعدادات موجودًا:
 * نحدّثه بدل إنشاء صف جديد.
 */
if (
  current &&
  current.id !== undefined &&
  current.id !== null
) {
  return await db
    .from("site_settings")
    .update(patch)
    .eq(
      "id",
      current.id
    );
}

/*
 * إذا لم يوجد صف:
 * ننشئ صف الإعدادات.
 */
return await db
  .from("site_settings")
  .insert({
    admin_color:
      patch.admin_color ||
      "#7c3aed",

    store_color:
      patch.store_color ||
      "#d9a5b8",

    logo_url:
      patch.logo_url ||
      null
  });

}

async function loadSettings() {
const {
data,
error
} = await db
.from("site_settings")
.select("*")
.limit(1)
.maybeSingle();

if (error) {
  console.error(
    "تعذر تحميل إعدادات الموقع:",
    error
  );

  const msg =
    $("settingsMsg");

  if (msg) {
    msg.textContent =
      "تعذر تحميل الإعدادات: " +
      error.message;
  }

  return;
}

if (!data) {
  /*
   * إعدادات افتراضية حتى لا تبقى
   * الواجهة بدون ألوان.
   */
  setAdminColor(
    "#7c3aed"
  );

  setStoreColor(
    "#d9a5b8"
  );

  return;
}

applySettings(data);

}

async function saveColors() {
const adminColor =
$("adminColor")
?.value ||
"#7c3aed";

const storeColor =
  $("storeColor")
    ?.value ||
  "#d9a5b8";

const msg =
  $("settingsMsg");

if (msg) {
  msg.textContent =
    "جارٍ حفظ الألوان...";
}

/*
 * تطبيق فوري قبل انتظار Supabase.
 */
setAdminColor(
  adminColor
);

setStoreColor(
  storeColor
);

const {
  data,
  error
} = await (async () => {
  const current =
    await getSettingsRow();

  if (
    current &&
    current.id !== undefined
  ) {
    return await db
      .from("site_settings")
      .update({
        admin_color:
          adminColor,

        store_color:
          storeColor
      })
      .eq(
        "id",
        current.id
      )
      .select()
      .maybeSingle();
  }

  return await db
    .from("site_settings")
    .insert({
      admin_color:
        adminColor,

      store_color:
        storeColor
    })
    .select()
    .maybeSingle();
})();

if (error) {
  console.error(
    "saveColors:",
    error
  );

  if (msg) {
    msg.textContent =
      "❌ تعذر حفظ الألوان: " +
      error.message;
  }

  return;
}

if (data) {
  state.settings =
    data;
}

if (msg) {
  msg.textContent =
    "✅ تم حفظ الألوان بنجاح.";
}

}

/* =========================
معاينة الشعار
========================= */

function setupLogoPreview() {
const input =
$("logoFile");

if (!input) return;

input.addEventListener(
  "change",
  event => {
    const file =
      event.target.files?.[0];

    const preview =
      $("logoPreview");

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      const msg =
        $("logoMsg") ||
        $("settingsMsg");

      if (msg) {
        msg.textContent =
          "الرجاء اختيار صورة صحيحة.";
      }

      input.value =
        "";

      return;
    }

    if (preview) {
      if (
        preview.dataset
          .objectUrl
      ) {
        URL.revokeObjectURL(
          preview.dataset
            .objectUrl
        );
      }

      const url =
        URL.createObjectURL(
          file
        );

      preview.src =
        url;

      preview.hidden =
        false;

      preview.dataset
        .objectUrl =
        url;
    }

    const msg =
      $("logoMsg") ||
      $("settingsMsg");

    if (msg) {
      msg.textContent =
        "تم اختيار الشعار. اضغط حفظ الشعار.";
    }
  }
);

}

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
      "اختَر صورة الشعار أولًا.";
  }

  return;
}

if (
  !file.type.startsWith(
    "image/"
  )
) {
  if (msg) {
    msg.textContent =
      "الملف المختار ليس صورة.";
  }

  return;
}

/*
 * حماية بسيطة من الصور الضخمة جدًا.
 */
if (
  file.size >
  10 * 1024 * 1024
) {
  if (msg) {
    msg.textContent =
      "حجم الصورة كبير جدًا. الحد الأقصى 10MB.";
  }

  return;
}

if (msg) {
  msg.textContent =
    "جارٍ رفع الشعار...";
}

const extension =
  (
    file.name
      .split(".")
      .pop() ||
    "jpg"
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9]/g,
      ""
    );

const path =
  "logo-" +
  Date.now() +
  "." +
  extension;

const {
  error: uploadError
} = await db
  .storage
  .from("hayati-assets")
  .upload(
    path,
    file,
    {
      upsert: false,
      contentType:
        file.type ||
        "image/jpeg",
      cacheControl:
        "3600"
    }
  );

if (uploadError) {
  console.error(
    "logo upload:",
    uploadError
  );

  if (msg) {
    msg.textContent =
      "❌ تعذر رفع الشعار: " +
      uploadError.message;
  }

  return;
}

const {
  data:
    publicData
} = db
  .storage
  .from(
    "hayati-assets"
  )
  .getPublicUrl(
    path
  );

const logoUrl =
  publicData?.publicUrl;

if (!logoUrl) {
  if (msg) {
    msg.textContent =
      "تم رفع الشعار لكن تعذر الحصول على الرابط.";
  }

  return;
}

if (msg) {
  msg.textContent =
    "جارٍ حفظ رابط الشعار...";
}

const {
  data,
  error:
    settingsError
} = await (async () => {
  const current =
    await getSettingsRow();

  if (
    current &&
    current.id !== undefined
  ) {
    return await db
      .from("site_settings")
      .update({
        logo_url:
          logoUrl
      })
      .eq(
        "id",
        current.id
      )
      .select()
      .maybeSingle();
  }

  return await db
    .from("site_settings")
    .insert({
      admin_color:
        "#7c3aed",

      store_color:
        "#d9a5b8",

      logo_url:
        logoUrl
    })
    .select()
    .maybeSingle();
})();

if (settingsError) {
  console.error(
    "logo settings:",
    settingsError
  );

  if (msg) {
    msg.textContent =
      "تم رفع الشعار لكن تعذر حفظه في الإعدادات: " +
      settingsError.message;
  }

  return;
}

if (data) {
  state.settings =
    data;
} else if (state.settings) {
  state.settings.logo_url =
    logoUrl;
}

if (preview) {
  preview.src =
    logoUrl;

  preview.hidden =
    false;
}

document
  .querySelectorAll(
    "[data-site-logo]"
  )
  .forEach(img => {
    img.src =
      logoUrl;
  });

if (msg) {
  msg.textContent =
    "✅ تم حفظ الشعار بنجاح.";
}

input.value =
  "";

}

/* =========================
تسجيل الدخول
========================= */

async function login() {
const email =
$("email")
?.value
.trim() ||
"";

const password =
  $("password")
    ?.value ||
  "";

const msg =
  $("loginMsg");

if (!email || !password) {
  if (msg) {
    msg.textContent =
      "أدخل البريد الإلكتروني وكلمة المرور.";
  }

  return;
}

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
  console.error(
    "login:",
    error
  );

  if (msg) {
    msg.textContent =
      "تعذر تسجيل الدخول: " +
      error.message;
  }

  return;
}

await showApplication();

}

async function showApplication() {
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

/* =========================
التحقق من الجلسة
========================= */

async function restoreSession() {
try {
const {
data,
error
} = await db.auth
.getSession();

  if (error) {
    console.error(
      "session:",
      error
    );

    return;
  }

  if (
    data?.session
  ) {
    await showApplication();
  }
} catch (error) {
  console.error(
    "restoreSession:",
    error
  );
}

}

/* =========================
مراقبة حالة الدخول
========================= */

db.auth.onAuthStateChange(
async (
event,
session
) => {
if (
event ===
"SIGNED_IN" &&
session
) {
await showApplication();
}
}
);

/* =========================
كلمة المرور
========================= */

$("passwordToggle")
?.addEventListener(
"click",
() => {
const password =
$("password");

    if (!password)
      return;

    password.type =
      password.type ===
      "password"
        ? "text"
        : "password";
  }
);

$("password")
?.addEventListener(
"keydown",
event => {
if (
event.key ===
"Enter"
) {
login();
}
}
);

$("loginBtn")
?.addEventListener(
"click",
login
);

/* =========================
تسجيل الخروج
========================= */

$("logoutBtn")
?.addEventListener(
"click",
async () => {
await db.auth.signOut();

    location.reload();
  }
);

/* =========================
القائمة
========================= */

$("menuBtn")
?.addEventListener(
"click",
() => {
$("sideMenu")
?.classList
.toggle(
"open"
);
}
);

document
.querySelectorAll(
"#sideMenu [data-section]"
)
.forEach(button => {
button.onclick =
() => {
showSection(
button.dataset
.section
);
};
});

/* =========================
الإشعارات
========================= */

$("notificationBtn")
?.addEventListener(
"click",
() =>
showSection(
"orders"
)
);

/* =========================
تحديث البيانات
========================= */

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
await loadOrders();
await loadProducts();
await loadSettings();
}
);

/* =========================
الطلب
========================= */

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
?.classList
.add(
"hidden"
);
}
);

/* =========================
المنتج
========================= */

$("closeProductModal")
?.addEventListener(
"click",
() => {
$("productModal")
?.classList
.add(
"hidden"
);
}
);

$("saveProduct")
?.addEventListener(
"click",
saveProduct
);

/* =========================
الإعدادات
========================= */

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
event => {
setAdminColor(
event.target.value
);
}
);

$("storeColor")
?.addEventListener(
"input",
event => {
setStoreColor(
event.target.value
);
}
);

/* =========================
إغلاق النوافذ عند الضغط
خارجها
========================= */

window.addEventListener(
"click",
event => {
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

/* =========================
تحديث الطلبات مباشرة
========================= */

db.channel(
"hayati-orders"
)
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

/* =========================
تشغيل التطبيق
========================= */

setupLogoPreview();

restoreSession();

})();
