(() => {
"use strict";
const cfg = window.HAYATI_CONFIG || {};
const sb = window.supabase;
if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) {
  document.getElementById("loginMsg").textContent = "إعدادات Supabase غير موجودة في config.js";
  return;
}
const db = sb.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
const $ = id => document.getElementById(id);
const state = { orders: [], products: [], selectedOrder: null };

function setAdminColor(c){ document.documentElement.style.setProperty("--admin-color", c || "#7c3aed"); }
function updateBadge(){ $("notificationCount").textContent = String(state.orders.length); }
function showSection(name){
  document.querySelectorAll(".section").forEach(x=>x.classList.remove("active"));
  $(name).classList.add("active");
  $("sideMenu").classList.remove("open");
}
async function loadOrders(){
  const {data,error}=await db.from("orders").select("*").order("created_at",{ascending:false});
  if(error){ $("ordersList").innerHTML="<p>تعذر تحميل الطلبات.</p>"; return; }
  state.orders=data||[];
  $("ordersStat").textContent=state.orders.length;
  updateBadge();
  renderOrders();
}
function renderOrders(){
  if(!state.orders.length){ $("ordersList").innerHTML="<p>لا توجد طلبات.</p>"; return; }
  $("ordersList").innerHTML=state.orders.map((o,i)=>`
    <div class="order-card" data-order="${i}">
      <b>طلب #${i+1}</b><br>
      ${esc(o.customer_name||o.name||"بدون اسم")} — ${esc(o.phone||"بدون هاتف")}<br>
      <small>${fmtDate(o.created_at)} — الإجمالي: ${esc(String(o.total??"غير محدد"))}</small>
    </div>`).join("");
  document.querySelectorAll(".order-card").forEach(el=>el.onclick=()=>openOrder(Number(el.dataset.order)));
}
function openOrder(i){
  const o=state.orders[i]; state.selectedOrder=o;
  const items=Array.isArray(o.items)?o.items:[];
  $("orderDetails").innerHTML=`
    <p><b>الاسم:</b> ${esc(o.customer_name||o.name||"")}</p>
    <p><b>الهاتف:</b> ${esc(o.phone||"")}</p>
    <p><b>الولاية:</b> ${esc(o.wilaya||"")}</p>
    <p><b>العنوان:</b> ${esc(o.address||"")}</p>
    <p><b>ملاحظات:</b> ${esc(o.notes||"")}</p>
    <p><b>الحالة:</b> ${esc(o.status||"")}</p>
    <p><b>التاريخ:</b> ${fmtDate(o.created_at)}</p>
    <hr>
    <h3>المنتجات</h3>
    ${items.length?items.map(it=>`<div class="order-item">
      ${it.image_url||it.image?`<img src="${esc(it.image_url||it.image)}" alt="">`:""}
      <div><b>${esc(it.name||it.title||"منتج")}</b><br>الكمية: ${esc(String(it.quantity??it.qty??1))}<br>السعر: ${esc(String(it.price??""))}</div>
    </div>`).join(""):"<p>لا توجد تفاصيل منتجات داخل الطلب.</p>"}
    <h3>الإجمالي: ${esc(String(o.total??"غير محدد"))}</h3>`;
  $("orderModal").classList.remove("hidden");
}
async function deleteOrder(){
  if(!state.selectedOrder?.id) return alert("معرّف الطلب غير موجود.");
  if(!confirm("هل تريد حذف هذا الطلب نهائيًا؟")) return;
  const {error}=await db.from("orders").delete().eq("id",state.selectedOrder.id);
  if(error){ alert("تعذر حذف الطلب: "+error.message); return; }
  $("orderModal").classList.add("hidden");
  await loadOrders();
}
async function loadProducts(){
  const {data,error}=await db.from("products").select("*").order("created_at",{ascending:false});
  if(error){ $("productsList").innerHTML="<p>تعذر تحميل المنتجات. تأكد من جدول products.</p>"; return; }
  state.products=data||[];
  $("productsStat").textContent=state.products.length;
  renderProducts();
}
function renderProducts(){
  if(!state.products.length){ $("productsList").innerHTML="<p>لا توجد منتجات في جدول المنتجات.</p>"; return; }
  $("productsList").innerHTML=state.products.map((p,i)=>{
    const img=p.image_url||p.image||"";
    return `<div class="product-card">
      ${img?`<img src="${esc(img)}" alt="">`:`<div></div>`}
      <div><b>${esc(p.name||"بدون اسم")}</b><br>
      الفئة: ${esc(p.category||"")}<br>
      السعر: ${esc(String(p.price??""))}${p.old_price?` — القديم: ${esc(String(p.old_price))}`:""}<br>
      المخزون: ${esc(String(p.stock??"غير محدد"))}</div>
      <div class="actions"><button class="secondary" data-edit="${i}">✏️ تعديل</button><button class="danger" data-del="${i}">🗑️ حذف</button></div>
    </div>`;
  }).join("");
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editProduct(Number(b.dataset.edit)));
  document.querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>deleteProduct(Number(b.dataset.del)));
}
function editProduct(i){
  const p=state.products[i];
  $("productId").value=p.id||"";
  $("productName").value=p.name||"";
  $("productCategory").value=p.category||"";
  $("productPrice").value=p.price??"";
  $("productOldPrice").value=p.old_price??"";
  $("productStock").value=p.stock??"";
  $("productImage").value=p.image_url||p.image||"";
  $("productDescription").value=p.description||"";
  $("productModal").classList.remove("hidden");
}
async function saveProduct(){
  const id=$("productId").value;
  if(!id) return;
  const patch={name:$("productName").value.trim(),category:$("productCategory").value.trim(),
    price:Number($("productPrice").value||0),old_price:$("productOldPrice").value===""?null:Number($("productOldPrice").value),
    stock:$("productStock").value===""?null:Number($("productStock").value),image_url:$("productImage").value.trim(),
    description:$("productDescription").value.trim()};
  const {error}=await db.from("products").update(patch).eq("id",id);
  if(error){alert("تعذر حفظ المنتج: "+error.message);return}
  $("productModal").classList.add("hidden"); await loadProducts();
}
async function deleteProduct(i){
  const p=state.products[i];
  if(!p?.id || !confirm("هل تريد حذف هذا المنتج؟")) return;
  const {error}=await db.from("products").delete().eq("id",p.id);
  if(error){alert("تعذر حذف المنتج: "+error.message);return}
  await loadProducts();
}
async function loadSettings(){
  const {data}=await db.from("site_settings").select("*").limit(1).maybeSingle();
  if(data){
    if(data.admin_color){$("adminColor").value=data.admin_color;setAdminColor(data.admin_color)}
    if(data.store_color) $("storeColor").value=data.store_color;
    if(data.logo_url) $("logoPreview").src=data.logo_url;
  }
}
async function saveColors(){
  const patch={admin_color:$("adminColor").value,store_color:$("storeColor").value};
  const {error}=await db.from("site_settings").upsert(patch,{onConflict:"id"});
  if(error){$("settingsMsg").textContent="تعذر حفظ الألوان: "+error.message;return}
  setAdminColor(patch.admin_color); $("settingsMsg").textContent="تم حفظ الألوان.";
}
async function saveLogo(){
  const f=$("logoFile").files[0]; if(!f) return;
  const path="logo-"+Date.now()+"-"+f.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  const {error}=await db.storage.from("hayati-assets").upload(path,f,{upsert:true});
  if(error){$("settingsMsg").textContent="تعذر رفع الشعار: "+error.message;return}
  const {data}=db.storage.from("hayati-assets").getPublicUrl(path);
  const logo_url=data.publicUrl;
  const {error:e}=await db.from("site_settings").upsert({logo_url},{onConflict:"id"});
  if(e){$("settingsMsg").textContent="تم الرفع لكن تعذر حفظ الرابط.";return}
  $("logoPreview").src=logo_url; $("settingsMsg").textContent="تم حفظ الشعار.";
}
function fmtDate(v){try{return new Date(v).toLocaleString("ar-DZ")}catch{return v||""}}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

$("passwordToggle").onclick=()=>{const p=$("password");p.type=p.type==="password"?"text":"password"};
$("loginBtn").onclick=async()=>{
  const {error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  if(error){$("loginMsg").textContent=error.message;return}
  $("loginScreen").classList.add("hidden");$("app").classList.remove("hidden");
  await Promise.all([loadOrders(),loadProducts(),loadSettings()]);
};
$("logoutBtn").onclick=async()=>{await db.auth.signOut();location.reload()};
$("menuBtn").onclick=()=>$("sideMenu").classList.toggle("open");
document.querySelectorAll("#sideMenu [data-section]").forEach(b=>b.onclick=()=>showSection(b.dataset.section));
$("notificationBtn").onclick=()=>showSection("orders");
$("ordersRefresh").onclick=loadOrders;
$("productsRefresh").onclick=loadProducts;
$("homeRefresh").onclick=async()=>{await loadOrders();await loadProducts()};
$("deleteOrderBtn").onclick=deleteOrder;
$("closeOrderModal").onclick=()=>$("orderModal").classList.add("hidden");
$("closeProductModal").onclick=()=>$("productModal").classList.add("hidden");
$("saveProduct").onclick=saveProduct;
$("saveColors").onclick=saveColors;
$("saveLogo").onclick=saveLogo;
$("adminColor").oninput=e=>setAdminColor(e.target.value);

db.channel("hayati-orders").on("postgres_changes",{event:"*",schema:"public",table:"orders"},()=>loadOrders()).subscribe();
})();