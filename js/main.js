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
    cart.forEach(item=>{
        const subtotal = (item.price||0) * (item.qty||0);
        total += subtotal;

        const row = document.createElement('div');
        row.className = 'cart-row';
        row.dataset.id = item.id;
        row.innerHTML = `
            <div class="meta">
                <h4>${item.name}</h4>
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
            const id = e.target.closest('.cart-row').dataset.id;
            const cart = getCart();
            const it = cart.find(x=>x.id===id);
            if(it){ it.qty = Math.min(999, it.qty+1); saveCart(cart); updateHeaderCountUI(); renderCartModal(); }
        });
    });
    root.querySelectorAll('.ci-decrease').forEach(b=>{
        b.addEventListener('click', e=>{
            const id = e.target.closest('.cart-row').dataset.id;
            const cart = getCart();
            const it = cart.find(x=>x.id===id);
            if(it){ it.qty = Math.max(1, it.qty-1); saveCart(cart); updateHeaderCountUI(); renderCartModal(); }
        });
    });
    root.querySelectorAll('.ci-remove').forEach(b=>{
        b.addEventListener('click', e=>{
            const id = e.target.closest('.cart-row').dataset.id;
            let cart = getCart();
            cart = cart.filter(x=>x.id !== id);
            saveCart(cart); updateHeaderCountUI(); renderCartModal();
        });
    });

    // attach checkout button listener (fix: previously missing)
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
        const address = (document.getElementById('co-address')?.value || '').trim();
        const phone = (document.getElementById('co-phone')?.value || '').trim();
        const errEl = document.getElementById('co-error');

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

        // جهّز نص الرسالة
        let lines = [];
        lines.push('طلب من متجر سويجات');
        if(name) lines.push('الاسم: ' + name);
        lines.push('العنوان: ' + address);
        lines.push('الهاتف: ' + phone);
        lines.push('---');
        lines.push('المنتجات:');

        let total = 0;
        cart.forEach(it=>{
            const subtotal = (it.price||0) * (it.qty||0);
            total += subtotal;
            lines.push(`- ${it.name} × ${it.qty} = ${formatCurrency(subtotal)}`);
        });
        lines.push('---');
        lines.push('المجموع: ' + formatCurrency(total));

        const message = encodeURIComponent(lines.join('\n'));

        // افتح واتساب ويب/تطبيق (يفتح في تبويب جديد)
        const waUrl = `https://wa.me/${WHATSAPP_RECIPIENT_INTL}?text=${message}`;
        window.open(waUrl, '_blank');

        // اغلاق النافذة (اختياري)
        closeCartModal();
    });
}

// wire UI
document.addEventListener('DOMContentLoaded', ()=>{

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
            const btn = e.target.closest('.qty-btn, .add-cart-btn');
            if(!btn) return;

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
        });
    }

});