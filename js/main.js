// This file contains JavaScript code for interactivity on the website.

// -- all cart & UI logic --
// cart helpers (reuse)
function getCart(){
    try{ return JSON.parse(localStorage.getItem('swayjat_cart')||'[]'); }
    catch{ return []; }
}
function saveCart(cart){ localStorage.setItem('swayjat_cart', JSON.stringify(cart)); }
function cartTotalCount(){ return getCart().reduce((s,i)=> s + (i.qty||0), 0); }
function updateHeaderCountUI(){ const el = document.getElementById('cart-count'); if(el) el.textContent = cartTotalCount(); }

// open/close modal and render
function openCartModal(){ 
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-modal').classList.add('open');
    document.getElementById('cart-overlay').setAttribute('aria-hidden','false');
    document.getElementById('cart-modal').setAttribute('aria-hidden','false');
    renderCartModal();
}
function closeCartModal(){
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-modal').classList.remove('open');
    document.getElementById('cart-overlay').setAttribute('aria-hidden','true');
    document.getElementById('cart-modal').setAttribute('aria-hidden','true');
}

// render modal content (names only, no images)
function formatCurrency(n){ return Number(n).toLocaleString('en-US') + ' د.ع'; }

function renderCartModal(){
    const root = document.getElementById('cart-modal-content');
    if(!root) return;
    const cart = getCart();
    root.innerHTML = '';

    if(cart.length === 0){
        root.innerHTML = '<p>العربة فارغة.</p>';
        return;
    }

    let total = 0;
    cart.forEach((item, index)=>{
        const subtotal = (item.price||0) * (item.qty||0);
        total += subtotal;

        const row = document.createElement('div');
        row.className = 'cart-row';
        row.dataset.index = index;
        
        const colorHtml = item.color ? `<div style="font-size:0.85em;color:#aaa;margin-top:4px;">اللون: ${item.color}</div>` : '';

        row.innerHTML = `
            <div class="meta">
                <h4>${item.name}</h4>
                ${colorHtml}
            </div>
            <div class="row-controls">
                <button class="ci-decrease" aria-label="نقص">−</button>
                <div class="ci-qty">${item.qty}</div>
                <button class="ci-increase" aria-label="زيادة">+</button>
                <button class="ci-remove" title="حذف" style="margin-left:8px">حذف</button>
            </div>
            <div class="price">${formatCurrency(subtotal)}</div>
        `;
        root.appendChild(row);
    });

    const summary = document.createElement('div');
    summary.className = 'cart-summary-modal';
    summary.innerHTML = `<div>إجمالي: <strong>${formatCurrency(total)}</strong></div><div><button id="modal-checkout" class="add-cart-btn">إتمام الطلب</button></div>`;
    root.appendChild(summary);

    // attach handlers
    root.querySelectorAll('.ci-increase').forEach(b=>{
        b.addEventListener('click', e=>{
            const idx = Number(e.target.closest('.cart-row').dataset.index);
            const cart = getCart();
            if(cart[idx]){ 
                cart[idx].qty = Math.min(999, cart[idx].qty+1); 
                saveCart(cart); updateHeaderCountUI(); renderCartModal(); 
            }
        });
    });
    root.querySelectorAll('.ci-decrease').forEach(b=>{
        b.addEventListener('click', e=>{
            const idx = Number(e.target.closest('.cart-row').dataset.index);
            const cart = getCart();
            if(cart[idx]){ 
                cart[idx].qty = Math.max(1, cart[idx].qty-1); 
                saveCart(cart); updateHeaderCountUI(); renderCartModal(); 
            }
        });
    });
    root.querySelectorAll('.ci-remove').forEach(b=>{
        b.addEventListener('click', e=>{
            const idx = Number(e.target.closest('.cart-row').dataset.index);
            let cart = getCart();
            cart.splice(idx, 1);
            saveCart(cart); updateHeaderCountUI(); renderCartModal();
        });
    });

    // attach checkout button listener
    const checkoutBtn = document.getElementById('modal-checkout') || summary.querySelector('#modal-checkout');
    if(checkoutBtn){
        checkoutBtn.addEventListener('click', (ev)=>{
            ev.preventDefault();
            // if a checkout form already exists, scroll to it
            const rootEl = document.getElementById('cart-modal-content');
            if(rootEl.querySelector('.checkout-form')){
                rootEl.querySelector('.checkout-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            showCheckoutForm();
        });
    }
}

/* إضافة نموذج معلومات الشحن والتحقق وإرسال رسالة عبر واتساب */

// تحويل رقم المستلم المحلي إلى صيغة دولية بدون الصفر الابتدائي
const WHATSAPP_RECIPIENT_LOCAL = '07774823205';
const WHATSAPP_RECIPIENT_INTL = '964' + WHATSAPP_RECIPIENT_LOCAL.replace(/^0+/, '');

// تحقق بسيط لرقم الهاتف (يقبل 10 أو 11 رقماً ويجب أن يبدأ بـ07)
function isValidIraqPhone(phone){
    const cleaned = String(phone).replace(/\s|-/g,'');

    return /^07\d{8,9}$/.test(cleaned);
}

// عرض نموذج الإتمام داخل الـ modal
function showCheckoutForm(){
    const root = document.getElementById('cart-modal-content');
    if(!root) return;

    // remove existing checkout form if any (prevent duplicates)
    const existing = root.querySelector('.checkout-form');
    if(existing) existing.remove();

    // إنشاء النموذج
    const formWrap = document.createElement('div');
    formWrap.className = 'checkout-form';

    formWrap.innerHTML = `
        <h4 style="margin:0 0 8px">أدخل بيانات الشحن</h4>
        <label>الاسم (اختياري)
            <input type="text" id="co-name" placeholder="الاسم الكامل">
        </label>
        <label>المحافظة (مطلوب)
            <select id="co-governorate" style="padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,0.06);background:rgba(0,0,0,0.12);color:#fff;outline:none;">
                <option value="" disabled selected>اختر المحافظة</option>
                <option value="Baghdad">بغداد</option>
                <option value="Basra">البصرة</option>
                <option value="Nineveh">نينوى</option>
                <option value="Erbil">أربيل</option>
                <option value="Sulaymaniyah">السليمانية</option>
                <option value="Duhok">دهوك</option>
                <option value="Kirkuk">كركوك</option>
                <option value="Anbar">الأنبار</option>
                <option value="Diyala">ديالى</option>
                <option value="Babil">بابل</option>
                <option value="Karbala">كربلاء</option>
                <option value="Najaf">النجف</option>
                <option value="Wasit">واسط</option>
                <option value="Qadisiyah">الديوانية</option>
                <option value="Maysan">ميسان</option>
                <option value="DhiQar">ذي قار</option>
                <option value="Muthanna">المثنى</option>
                <option value="Saladin">صلاح الدين</option>
            </select>
        </label>
        <label>العنوان (مطلوب)
            <textarea id="co-address" placeholder="عنوان الشحن" rows="2"></textarea>
        </label>
        <label>رقم الهاتف (مثال: 0777xxxxxxx) - مطلوب
            <input type="tel" id="co-phone" placeholder="0777xxxxxxxx">
        </label>
        <div class="checkout-actions">
            <div class="checkout-error" id="co-error" aria-live="polite" style="color:#ffb5b5"></div>
            <div style="display:flex;gap:8px">
                <button id="co-send" class="add-cart-btn">إرسال عبر واتساب</button>
                <button id="co-cancel" class="cart-close" style="background:transparent;color:var(--muted)">إلغاء</button>
            </div>
        </div>
    `;

    // ضع النموذج أعلى المحتوى (أو تحت القائمة الإجمالية)
    root.appendChild(formWrap);
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // زر الغاء
    formWrap.querySelector('#co-cancel').addEventListener('click', ()=>{
        formWrap.remove();
    });

    // زر إرسال: تحقق ثم افتح واتساب مع رسالة مهيأة
    formWrap.querySelector('#co-send').addEventListener('click', ()=>{

        const name = (document.getElementById('co-name')?.value || '').trim();
        const governorateSelect = document.getElementById('co-governorate');
        const governorate = governorateSelect?.value;
        const governorateName = governorateSelect?.options[governorateSelect.selectedIndex]?.text;
        const address = (document.getElementById('co-address')?.value || '').trim();
        const phone = (document.getElementById('co-phone')?.value || '').trim();
        const errEl = document.getElementById('co-error');

        if(!governorate){
            errEl.textContent = 'الرجاء اختيار المحافظة.';
            return;
        }
        if(!address){
            errEl.textContent = 'الرجاء إدخال العنوان.';
            return;
        }
        if(!isValidIraqPhone(phone)){
            errEl.textContent = 'رقم الهاتف غير صالح. يجب أن يبدأ بـ 07 ويتكون من 10 أو 11 رقماً.';
            return;
        }

        // اجلب محتويات العربة
        const cart = getCart();
        if(!cart || cart.length === 0){
            errEl.textContent = 'العربة فارغة.';
            return;
        }

        // حساب التوصيل
        const deliveryFee = (governorate === 'Baghdad') ? 5000 : 6000;

        // جهّز نص الرسالة
        let lines = [];
        lines.push('طلب من متجر سويجو');
        if(name) lines.push('الاسم: ' + name);
        lines.push('المحافظة: ' + governorateName);
        lines.push('العنوان: ' + address);
        lines.push('الهاتف: ' + phone);
        lines.push('---');
        lines.push('المنتجات:');

        let total = 0;
        cart.forEach(it=>{
            const subtotal = (it.price||0) * (it.qty||0);
            total += subtotal;
            const colorStr = it.color ? ` (لون: ${it.color})` : '';
            lines.push(`- ${it.name}${colorStr} × ${it.qty} = ${formatCurrency(subtotal)}`);
        });
        lines.push('---');
        lines.push('مجموع المنتجات: ' + formatCurrency(total));
        lines.push('التوصيل: ' + formatCurrency(deliveryFee));
        lines.push('المجموع الكلي: ' + formatCurrency(total + deliveryFee));

        const message = encodeURIComponent(lines.join('\n'));

        // افتح واتساب ويب/تطبيق (يفتح في تبويب جديد)
        const waUrl = `https://wa.me/${WHATSAPP_RECIPIENT_INTL}?text=${message}`;
        window.open(waUrl, '_blank');

        // اغلاق النافذة (اختياري)
        closeCartModal();
    });
}

// -- Product Details Modal Logic --
function openProductModal(card) {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-overlay');
    const content = document.getElementById('product-modal-content');
    
    if(!modal || !overlay || !content) return;

    const img = card.querySelector('img').src;
    const title = card.querySelector('h3').textContent;
    const price = card.querySelector('.price').textContent;
    const description = card.dataset.description || 'لا يوجد وصف متاح حالياً.';
    const id = card.dataset.id;
    const priceVal = card.dataset.price;

    // Dynamic colors from card
    let colorsBlock = '';
    const sourceColors = card.querySelectorAll('.color-dot');
    if(sourceColors.length > 0){
        let dotsHtml = '';
        sourceColors.forEach(d => {
            // clone and resize for modal
            let clone = d.cloneNode(true);
            clone.style.width = '24px';
            clone.style.height = '24px';
            clone.style.margin = '0';
            dotsHtml += clone.outerHTML;
        });
        colorsBlock = `
            <div class="color-options" style="display:flex;gap:10px;margin:15px 0;align-items:center;">
                <span style="font-weight:bold;margin-left:5px;">الألوان:</span>
                ${dotsHtml}
            </div>
        `;
    }

    content.innerHTML = `
        <div class="product-detail-view">
            <img src="${img}" alt="${title}">
            <div class="product-detail-info">
                <h3>${title}</h3>
                <span class="price">${price}</span>
                <p>${description}</p>
                
                ${colorsBlock}

                <button class="add-cart-btn" id="modal-add-btn" style="width:100%">إضافة للعربة</button>
            </div>
        </div>
    `;

    // Handle Color Selection
    let selectedColor = null;
    const modalColors = content.querySelectorAll('.color-dot');
    if(modalColors.length > 0){
        // Default to first
        selectedColor = modalColors[0].title;
        
        const updateVisuals = () => {
            modalColors.forEach(d => {
                if(d.title === selectedColor){
                    d.style.outline = '3px solid #4a90e2';
                    d.style.outlineOffset = '2px';
                } else {
                    d.style.outline = 'none';
                }
            });
        };
        updateVisuals();

        modalColors.forEach(dot => {
            dot.addEventListener('click', () => {
                selectedColor = dot.title;
                updateVisuals();
            });
        });
    }

    // Add to cart from modal
    content.querySelector('#modal-add-btn').addEventListener('click', () => {
        const cart = getCart();
        // Check for existing item with same ID AND Color
        const existing = cart.find(i => i.id === id && i.color === selectedColor);

        if(existing){
            existing.qty += 1;
        } else {
            cart.push({ 
                id, 
                name: title, 
                price: Number(priceVal), 
                qty: 1, 
                img,
                color: selectedColor 
            });
        }
        saveCart(cart);
        updateHeaderCountUI();
        closeProductModal();
        
        // Animation feedback
        const elCount = document.getElementById('cart-count');
        if(elCount){
            elCount.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.2)' },
                { transform: 'scale(1)' }
            ], { duration: 300, easing: 'ease-out' });
        }
    });

    overlay.classList.add('open');
    modal.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-hidden', 'false');
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-overlay');
    
    if(modal) modal.classList.remove('open');
    if(overlay) overlay.classList.remove('open');
    if(modal) modal.setAttribute('aria-hidden', 'true');
    if(overlay) overlay.setAttribute('aria-hidden', 'true');
}

// -- Category Filtering Logic --
function initCategories() {
    const buttons = document.querySelectorAll('.cat-btn');
    const products = document.querySelectorAll('.product-card');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.dataset.filter;

            products.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                    // Re-trigger animation
                    card.style.animation = 'none';
                    card.offsetHeight; /* trigger reflow */
                    card.style.animation = 'floatUp .7s cubic-bezier(.2,.9,.3,1) both';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// wire UI
document.addEventListener('DOMContentLoaded', ()=>{

    initCategories();

    // Product Modal Events
    const productOverlay = document.getElementById('product-overlay');
    const productClose = document.getElementById('product-close');
    
    if(productOverlay) productOverlay.addEventListener('click', closeProductModal);
    if(productClose) productClose.addEventListener('click', closeProductModal);

    // update header count from persisted cart
    updateHeaderCountUI();

    // header cart button opens modal
    const headerBtn = document.getElementById('header-cart-btn');
    if(headerBtn) headerBtn.addEventListener('click', openCartModal);

    // overlay and close button
    const overlay = document.getElementById('cart-overlay');
    if(overlay) overlay.addEventListener('click', closeCartModal);
    const closeBtn = document.getElementById('cart-close');
    if(closeBtn) closeBtn.addEventListener('click', closeCartModal);

    // Delegate clicks inside product-list for qty and add buttons
    const productList = document.querySelector('.product-list');
    if(productList){
        productList.addEventListener('click', e=>{
            // 1. Check for controls (buttons)
            const btn = e.target.closest('.qty-btn, .add-cart-btn');
            if(btn) {
                const card = btn.closest('.product-card');
                if(!card) return;

                const qtyEl = card.querySelector('[data-qty]');
                let qty = Number(qtyEl?.textContent) || 1;

                if(btn.classList.contains('qty-increase')){
                    qty = Math.min(99, qty + 1);
                    if(qtyEl) qtyEl.textContent = qty;
                    return;
                }
                if(btn.classList.contains('qty-decrease')){
                    qty = Math.max(1, qty - 1);
                    if(qtyEl) qtyEl.textContent = qty;
                    return;
                }

                if(btn.classList.contains('add-cart-btn')){
                    const id = String(card.dataset.id || card.querySelector('h3')?.textContent || Math.random());
                    const name = card.querySelector('.card-body h3')?.textContent?.trim() || 'منتج';
                    const price = Number(card.dataset.price || 0);
                    const img = card.querySelector('img')?.getAttribute('src') || '';

                    const cart = getCart();
                    const existing = cart.find(i=> i.id === id);
                    if(existing){
                        existing.qty = Math.min(999, existing.qty + qty);
                    } else {
                        cart.push({ id, name, price, qty, img });
                    }
                    saveCart(cart);
                    updateHeaderCountUI();

                    // small animation on badge
                    const elCount = document.getElementById('cart-count');
                    if(elCount){
                        elCount.animate([
                            { transform: 'scale(1)' },
                            { transform: 'scale(1.2)' },
                            { transform: 'scale(1)' }
                        ], { duration: 300, easing: 'ease-out' });
                    }

                    // reset qty display to 1
                    if(qtyEl) qtyEl.textContent = '1';
                }
                return; // Stop here if it was a button click
            }

            // 2. Check for card click (for modal)
            // Ignore if clicked on controls container (just in case)
            if(e.target.closest('.card-controls')) return;
            
            const card = e.target.closest('.product-card');
            if(card) {
                openProductModal(card);
            }
        });
    }

});