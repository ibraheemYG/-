// === SWAYJO - Main JS ===

// -- Cart Helpers --
function getCart(){
    try { return JSON.parse(localStorage.getItem('swayjat_cart') || '[]'); }
    catch { return []; }
}
function saveCart(cart){ localStorage.setItem('swayjat_cart', JSON.stringify(cart)); }
function cartTotalCount(){ return getCart().reduce((s, i) => s + (i.qty || 0), 0); }
function updateHeaderCountUI(){
    const el = document.getElementById('cart-count');
    if(el) el.textContent = cartTotalCount();
}
function formatCurrency(n){ return Number(n).toLocaleString('en-US') + ' د.ع'; }

// -- Cart Modal --
function openCartModal(){
    document.getElementById('cart-overlay').classList.add('open');
    document.getElementById('cart-modal').classList.add('open');
    renderCartModal();
}
function closeCartModal(){
    document.getElementById('cart-overlay').classList.remove('open');
    document.getElementById('cart-modal').classList.remove('open');
}

function renderCartModal(){
    const root = document.getElementById('cart-modal-content');
    if(!root) return;
    const cart = getCart();
    root.innerHTML = '';

    if(cart.length === 0){
        root.innerHTML = '<p style="text-align:center;color:var(--muted);padding:24px">العربة فارغة</p>';
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        const subtotal = (item.price || 0) * (item.qty || 0);
        total += subtotal;
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.dataset.index = index;
        const colorHtml = item.color ? `<div style="font-size:0.8em;color:var(--muted);margin-top:4px">اللون: ${item.color}</div>` : '';
        row.innerHTML = `
            <div class="meta"><h4>${item.name}</h4>${colorHtml}</div>
            <div class="row-controls">
                <button class="ci-decrease" aria-label="إنقاص">−</button>
                <div style="min-width:20px;text-align:center;font-weight:700">${item.qty}</div>
                <button class="ci-increase" aria-label="زيادة">+</button>
                <button class="ci-remove" title="حذف" style="color:#e17055">✕</button>
            </div>
            <div class="price">${formatCurrency(subtotal)}</div>
        `;
        root.appendChild(row);
    });

    const summary = document.createElement('div');
    summary.className = 'cart-summary-modal';
    summary.innerHTML = `<div>الإجمالي: <strong>${formatCurrency(total)}</strong></div><div><button id="modal-checkout" class="btn btn-primary" style="padding:10px 24px">إتمام الطلب</button></div>`;
    root.appendChild(summary);

    // Handlers
    root.querySelectorAll('.ci-increase').forEach(b => {
        b.addEventListener('click', e => {
            const idx = Number(e.target.closest('.cart-row').dataset.index);
            const c = getCart();
            if(c[idx]){ c[idx].qty = Math.min(999, c[idx].qty + 1); saveCart(c); updateHeaderCountUI(); renderCartModal(); }
        });
    });
    root.querySelectorAll('.ci-decrease').forEach(b => {
        b.addEventListener('click', e => {
            const idx = Number(e.target.closest('.cart-row').dataset.index);
            const c = getCart();
            if(c[idx]){ c[idx].qty = Math.max(1, c[idx].qty - 1); saveCart(c); updateHeaderCountUI(); renderCartModal(); }
        });
    });
    root.querySelectorAll('.ci-remove').forEach(b => {
        b.addEventListener('click', e => {
            const idx = Number(e.target.closest('.cart-row').dataset.index);
            const c = getCart();
            c.splice(idx, 1);
            saveCart(c); updateHeaderCountUI(); renderCartModal();
        });
    });

    const checkoutBtn = document.getElementById('modal-checkout');
    if(checkoutBtn){
        checkoutBtn.addEventListener('click', ev => {
            ev.preventDefault();
            const rootEl = document.getElementById('cart-modal-content');
            if(rootEl.querySelector('.checkout-form')){
                rootEl.querySelector('.checkout-form').scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            showCheckoutForm();
        });
    }
}

// -- Checkout Form --
const WHATSAPP_RECIPIENT_LOCAL = '07774823205';
const WHATSAPP_RECIPIENT_INTL = '964' + WHATSAPP_RECIPIENT_LOCAL.replace(/^0+/, '');

function isValidIraqPhone(phone){
    return /^07\d{8,9}$/.test(String(phone).replace(/\s|-/g, ''));
}

function showCheckoutForm(){
    const root = document.getElementById('cart-modal-content');
    if(!root) return;
    const existing = root.querySelector('.checkout-form');
    if(existing) existing.remove();

    const formWrap = document.createElement('div');
    formWrap.className = 'checkout-form';
    formWrap.innerHTML = `
        <h4 style="margin:0 0 8px">بيانات الشحن</h4>
        <label>الاسم (اختياري)<input type="text" id="co-name" placeholder="الاسم الكامل"></label>
        <label>المحافظة (مطلوب)
            <select id="co-governorate">
                <option value="" disabled selected>اختر المحافظة</option>
                <option value="Baghdad">بغداد</option><option value="Basra">البصرة</option>
                <option value="Nineveh">نينوى</option><option value="Erbil">أربيل</option>
                <option value="Sulaymaniyah">السليمانية</option><option value="Duhok">دهوك</option>
                <option value="Kirkuk">كركوك</option><option value="Anbar">الأنبار</option>
                <option value="Diyala">ديالى</option><option value="Babil">بابل</option>
                <option value="Karbala">كربلاء</option><option value="Najaf">النجف</option>
                <option value="Wasit">واسط</option><option value="Qadisiyah">الديوانية</option>
                <option value="Maysan">ميسان</option><option value="DhiQar">ذي قار</option>
                <option value="Muthanna">المثنى</option><option value="Saladin">صلاح الدين</option>
            </select>
        </label>
        <label>العنوان (مطلوب)<textarea id="co-address" placeholder="عنوان الشحن التفصيلي" rows="2"></textarea></label>
        <label>رقم الهاتف (مطلوب)<input type="tel" id="co-phone" placeholder="07XXXXXXXXX"></label>
        <div class="checkout-actions">
            <div id="co-error" style="color:#e17055;font-size:0.85rem"></div>
            <div style="display:flex;gap:8px">
                <button id="co-send" class="btn btn-primary" style="padding:10px 20px">إرسال عبر واتساب</button>
                <button id="co-cancel" class="btn btn-outline" style="padding:10px 16px">إلغاء</button>
            </div>
        </div>
    `;
    root.appendChild(formWrap);
    formWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });

    formWrap.querySelector('#co-cancel').addEventListener('click', () => formWrap.remove());
    formWrap.querySelector('#co-send').addEventListener('click', () => {
        const name = (document.getElementById('co-name')?.value || '').trim();
        const govSel = document.getElementById('co-governorate');
        const gov = govSel?.value;
        const govName = govSel?.options[govSel.selectedIndex]?.text;
        const address = (document.getElementById('co-address')?.value || '').trim();
        const phone = (document.getElementById('co-phone')?.value || '').trim();
        const errEl = document.getElementById('co-error');

        if(!gov){ errEl.textContent = 'الرجاء اختيار المحافظة'; return; }
        if(!address){ errEl.textContent = 'الرجاء إدخال العنوان'; return; }
        if(!isValidIraqPhone(phone)){ errEl.textContent = 'رقم الهاتف غير صالح (يبدأ بـ 07)'; return; }

        const cart = getCart();
        if(!cart.length){ errEl.textContent = 'العربة فارغة'; return; }

        const deliveryFee = gov === 'Baghdad' ? 5000 : 6000;
        let lines = ['طلب من متجر سويجو'];
        if(name) lines.push('الاسم: ' + name);
        lines.push('المحافظة: ' + govName, 'العنوان: ' + address, 'الهاتف: ' + phone, '---', 'المنتجات:');

        let total = 0;
        cart.forEach(it => {
            const sub = (it.price || 0) * (it.qty || 0);
            total += sub;
            const c = it.color ? ` (${it.color})` : '';
            lines.push(`- ${it.name}${c} × ${it.qty} = ${formatCurrency(sub)}`);
        });
        lines.push('---', 'المنتجات: ' + formatCurrency(total), 'التوصيل: ' + formatCurrency(deliveryFee), 'الإجمالي: ' + formatCurrency(total + deliveryFee));

        window.open(`https://wa.me/${WHATSAPP_RECIPIENT_INTL}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
        closeCartModal();
    });
}

// -- Product Modal --
function openProductModal(card){
    const modal = document.getElementById('product-modal');
    const overlay = document.getElementById('product-overlay');
    const content = document.getElementById('product-modal-content');
    if(!modal || !overlay || !content) return;

    const img = card.querySelector('img').src;
    const title = card.querySelector('h3').textContent;
    const price = card.querySelector('.price').textContent;
    const desc = card.dataset.description || '';
    const id = card.dataset.id;
    const priceVal = card.dataset.price;

    let colorsBlock = '';
    const dots = card.querySelectorAll('.color-dot');
    if(dots.length){
        let dotsHtml = '';
        dots.forEach(d => {
            const cl = d.cloneNode(true);
            cl.style.width = '24px';
            cl.style.height = '24px';
            dotsHtml += cl.outerHTML;
        });
        colorsBlock = `<div class="color-options" style="gap:10px;margin:12px 0"><span style="font-weight:700;margin-left:6px">الألوان:</span>${dotsHtml}</div>`;
    }

    content.innerHTML = `
        <div class="product-detail-view">
            <img src="${img}" alt="${title}">
            <div class="product-detail-info">
                <h3>${title}</h3>
                <span class="price">${price}</span>
                <p>${desc}</p>
                ${colorsBlock}
                <button class="btn btn-primary" id="modal-add-btn" style="width:100%">إضافة للعربة</button>
            </div>
        </div>
    `;

    let selectedColor = null;
    const modalColors = content.querySelectorAll('.color-dot');
    if(modalColors.length){
        selectedColor = modalColors[0].title;
        const updateSel = () => {
            modalColors.forEach(d => {
                d.style.outline = d.title === selectedColor ? '3px solid var(--accent)' : 'none';
                d.style.outlineOffset = '2px';
            });
        };
        updateSel();
        modalColors.forEach(d => d.addEventListener('click', () => { selectedColor = d.title; updateSel(); }));
    }

    content.querySelector('#modal-add-btn').addEventListener('click', () => {
        const cart = getCart();
        const existing = cart.find(i => i.id === id && i.color === selectedColor);
        if(existing){ existing.qty += 1; }
        else { cart.push({ id, name: title, price: Number(priceVal), qty: 1, img, color: selectedColor }); }
        saveCart(cart);
        updateHeaderCountUI();
        closeProductModal();
        const badge = document.getElementById('cart-count');
        if(badge) badge.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
    });

    overlay.classList.add('open');
    modal.classList.add('open');
}
function closeProductModal(){
    document.getElementById('product-modal')?.classList.remove('open');
    document.getElementById('product-overlay')?.classList.remove('open');
}

// -- Category Filter --
function initCategories(){
    const buttons = document.querySelectorAll('.cat-btn');
    const products = document.querySelectorAll('.product-card');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            products.forEach((card, i) => {
                const show = filter === 'all' || card.dataset.category === filter;
                card.style.display = show ? '' : 'none';
                if(show){
                    card.style.animation = 'none';
                    card.offsetHeight;
                    card.style.animation = `floatUp 0.4s ease ${i * 0.03}s both`;
                }
            });
        });
    });
}

// -- PDF Catalog --
function buildCatalogPage(htmlContent, width, height){
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `position:fixed;left:-9999px;top:0;width:${width}px;height:${height}px;overflow:hidden;z-index:-1;`;
    wrapper.innerHTML = htmlContent;
    document.body.appendChild(wrapper);
    return wrapper;
}

function renderPageToCanvas(el){
    return html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#060a14',
        width: el.offsetWidth,
        height: el.offsetHeight
    });
}

function generateCatalog(){
    if(!window.jspdf || !window.jspdf.jsPDF){
        alert('مكتبة PDF لم تُحمّل بعد، يرجى الانتظار ثم المحاولة مرة أخرى.');
        return;
    }
    if(typeof html2canvas === 'undefined'){
        alert('مكتبة html2canvas لم تُحمّل بعد، يرجى الانتظار ثم المحاولة مرة أخرى.');
        return;
    }

    const btn = document.getElementById('download-catalog');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ جاري إنشاء الكتالوج...';
    btn.disabled = true;

    const cards = Array.from(document.querySelectorAll('.product-card'));
    const PW = 794, PH = 1123; // A4 at 96dpi in px

    const fontFamily = "'VIP Hala Bold', 'Segoe UI', Tahoma, sans-serif";

    // --- Gather product data ---
    const products = cards.map(card => {
        const imgEl = card.querySelector('img');
        const price = Number(card.dataset.price || 0);
        return {
            name: card.querySelector('h3').textContent,
            price,
            price10: Math.round(price * 0.9),
            price20: Math.round(price * 0.8),
            desc: card.dataset.description || '',
            category: card.querySelector('.card-category')?.textContent || '',
            imgSrc: imgEl ? imgEl.src : '',
            colors: Array.from(card.querySelectorAll('.color-dot')).map(d => {
                const bg = d.style.background || d.style.backgroundColor;
                return { title: d.title, isWhite: bg.includes('fff') || bg.includes('white') };
            })
        };
    });

    // --- Build pages HTML ---
    const pages = [];

    // Cover
    pages.push(`<div dir="rtl" style="width:${PW}px;height:${PH}px;background:#060a14;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:${fontFamily};color:#f0f0f0;position:relative;">
        <div style="position:absolute;top:30px;left:30px;right:30px;height:5px;background:#6c5ce7;border-radius:4px"></div>
        <div style="font-size:72px;font-weight:700;letter-spacing:4px;margin-bottom:12px">SWAYJO</div>
        <div style="font-size:22px;color:#a29bfe;margin-bottom:50px">Smart Home Solutions</div>
        <div style="font-size:30px;color:#ccc;margin-bottom:16px">كتالوج المنتجات</div>
        <div style="font-size:18px;color:#888">${new Date().toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long' })}</div>
        <div style="position:absolute;bottom:60px;left:30px;right:30px;height:5px;background:#6c5ce7;border-radius:4px"></div>
        <div style="position:absolute;bottom:30px;font-size:14px;color:#666">wa.me/9647774823205 &nbsp;|&nbsp; @swi.cho</div>
    </div>`);

    // Product pages (4 per page)
    const PER_PAGE = 4;
    for(let i = 0; i < products.length; i += PER_PAGE){
        const pageProducts = products.slice(i, i + PER_PAGE);
        let cardsHtml = '';
        pageProducts.forEach(p => {
            const colorDots = p.colors.map(c =>
                `<span style="display:inline-block;width:20px;height:20px;border-radius:50%;background:${c.isWhite ? '#eee' : '#222'};border:2px solid ${c.isWhite ? '#ccc' : '#555'};margin-left:6px" title="${c.title}"></span>`
            ).join('');

            cardsHtml += `<div style="width:48%;background:#10142a;border:1px solid #282c44;border-radius:16px;overflow:hidden;display:flex;flex-direction:column;">
                <div style="height:220px;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(255,255,255,0.02)">
                    <img src="${p.imgSrc}" style="max-width:180px;max-height:180px;object-fit:contain" crossorigin="anonymous">
                </div>
                <div style="padding:14px 18px;flex:1;display:flex;flex-direction:column;gap:6px">
                    <span style="display:inline-block;width:fit-content;padding:3px 12px;background:rgba(108,92,231,0.2);color:#a29bfe;border-radius:20px;font-size:12px">${p.category}</span>
                    <div style="font-size:20px;font-weight:700;color:#f0f0f0;line-height:1.3">${p.name}</div>
                    <div style="font-size:20px;font-weight:700;color:#00b894">${p.price.toLocaleString('en-US')} د.ع</div>
                    <div style="display:flex;gap:12px;flex-wrap:wrap;margin:2px 0">
                        <span style="font-size:13px;color:#a29bfe;background:rgba(108,92,231,0.1);padding:3px 10px;border-radius:8px">١٠+ قطع: ${p.price10.toLocaleString('en-US')} د.ع (-10%)</span>
                        <span style="font-size:13px;color:#ffb450;background:rgba(255,180,80,0.1);padding:3px 10px;border-radius:8px">٢٠+ قطعة: ${p.price20.toLocaleString('en-US')} د.ع (-20%)</span>
                    </div>
                    <div style="font-size:13px;color:#999;line-height:1.5">${p.desc}</div>
                    ${p.colors.length ? `<div style="display:flex;align-items:center;gap:4px;margin-top:auto;padding-top:8px"><span style="font-size:12px;color:#888;margin-left:6px">الألوان:</span>${colorDots}</div>` : ''}
                </div>
            </div>`;
        });

        pages.push(`<div dir="rtl" style="width:${PW}px;height:${PH}px;background:#060a14;font-family:${fontFamily};color:#f0f0f0;display:flex;flex-direction:column;position:relative">
            <div style="height:40px;background:#6c5ce7;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700">SWAYJO — كتالوج المنتجات</div>
            <div style="flex:1;padding:20px 24px;display:flex;flex-wrap:wrap;gap:20px;align-content:flex-start;justify-content:center">
                ${cardsHtml}
            </div>
            <div style="text-align:center;padding:10px;font-size:12px;color:#555">${Math.floor(i / PER_PAGE) + 2} / ${Math.ceil(products.length / PER_PAGE) + 3}</div>
        </div>`);
    }

    // Discount page
    pages.push(`<div dir="rtl" style="width:${PW}px;height:${PH}px;background:#060a14;font-family:${fontFamily};color:#f0f0f0;display:flex;flex-direction:column;align-items:center;position:relative">
        <div style="height:40px;background:#6c5ce7;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:700;width:100%">SWAYJO — خصومات الجملة</div>
        <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;padding:40px">
            <div style="font-size:36px;font-weight:700;margin-bottom:20px">خصومات الجملة</div>
            <div style="width:500px;background:#10142a;border:2px solid #6c5ce7;border-radius:16px;padding:30px;text-align:center">
                <div style="font-size:36px;font-weight:700;color:#a29bfe;margin-bottom:8px">خصم 10%</div>
                <div style="font-size:18px;color:#bbb">عند شراء ١٠ قطع أو أكثر من أي منتج</div>
            </div>
            <div style="width:500px;background:#10142a;border:2px solid #ffb450;border-radius:16px;padding:30px;text-align:center">
                <div style="font-size:36px;font-weight:700;color:#ffb450;margin-bottom:8px">خصم 20% (الحد الأقصى)</div>
                <div style="font-size:18px;color:#bbb">عند شراء ٢٠ قطعة أو أكثر من أي منتج</div>
            </div>
            <div style="margin-top:30px;font-size:16px;color:#888;text-align:center;line-height:2">
                للطلب بالجملة تواصل معنا عبر واتساب<br>
                <span style="color:#a29bfe">wa.me/9647774823205</span>
            </div>
        </div>
    </div>`);

    // Back cover
    pages.push(`<div dir="rtl" style="width:${PW}px;height:${PH}px;background:#060a14;font-family:${fontFamily};color:#f0f0f0;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative">
        <div style="width:120px;height:4px;background:#6c5ce7;border-radius:4px;margin-bottom:30px"></div>
        <div style="font-size:48px;font-weight:700;margin-bottom:10px">SWAYJO</div>
        <div style="font-size:18px;color:#a29bfe;margin-bottom:50px">Smart Home Solutions</div>
        <div style="font-size:16px;color:#bbb;line-height:2.2;text-align:center">
            واتساب: 3205 482 777 964+<br>
            انستغرام: swi.cho@<br>
            <span style="font-size:14px;color:#888;margin-top:20px;display:block">Alexa &nbsp;|&nbsp; Google Home &nbsp;|&nbsp; Smart Life</span>
        </div>
    </div>`);

    // --- Render all pages ---
    const elements = pages.map(html => buildCatalogPage(html, PW, PH));

    // Wait for images to load
    const allImgs = [];
    elements.forEach(el => {
        el.querySelectorAll('img').forEach(img => {
            if(!img.complete){
                allImgs.push(new Promise(r => { img.onload = r; img.onerror = r; }));
            }
        });
    });

    Promise.all(allImgs).then(() => {
        // Small delay to ensure rendering
        return new Promise(r => setTimeout(r, 300));
    }).then(() => {
        // Render pages sequentially
        const canvasPromises = elements.reduce((chain, el) => {
            return chain.then(results => {
                return renderPageToCanvas(el).then(canvas => {
                    results.push(canvas);
                    return results;
                });
            });
        }, Promise.resolve([]));

        return canvasPromises;
    }).then(canvases => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        canvases.forEach((canvas, idx) => {
            if(idx > 0) doc.addPage();
            const imgData = canvas.toDataURL('image/jpeg', 0.92);
            doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        });

        doc.save('Swayjo-Catalog.pdf');

        // Cleanup
        elements.forEach(el => el.remove());
        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error('Catalog error:', err);
        elements.forEach(el => el.remove());
        alert('حدث خطأ أثناء إنشاء الكتالوج. يرجى المحاولة مرة أخرى.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

// -- Smooth Scroll Nav Highlight --
function initNavHighlight(){
    const links = document.querySelectorAll('.nav-link');
    const sections = ['home', 'products', 'catalog-section', 'contact'];

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY + 100;
        let current = 'home';
        sections.forEach(id => {
            const sec = document.getElementById(id);
            if(sec && sec.offsetTop <= scrollY) current = id;
        });
        links.forEach(l => {
            l.classList.toggle('active', l.getAttribute('href') === '#' + current);
        });
    });
}

// -- Init --
document.addEventListener('DOMContentLoaded', () => {
    // Year
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();

    initCategories();
    initNavHighlight();

    // Mobile menu
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    if(menuBtn && nav){
        menuBtn.addEventListener('click', () => nav.classList.toggle('open'));
        nav.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => nav.classList.remove('open')));
    }

    // Product modal
    document.getElementById('product-overlay')?.addEventListener('click', closeProductModal);
    document.getElementById('product-close')?.addEventListener('click', closeProductModal);

    // Cart modal
    updateHeaderCountUI();
    document.getElementById('header-cart-btn')?.addEventListener('click', openCartModal);
    document.getElementById('cart-overlay')?.addEventListener('click', closeCartModal);
    document.getElementById('cart-close')?.addEventListener('click', closeCartModal);

    // Catalog download
    document.getElementById('download-catalog')?.addEventListener('click', generateCatalog);

    // Product list delegation
    const productList = document.querySelector('.product-list');
    if(productList){
        productList.addEventListener('click', e => {
            const btn = e.target.closest('.qty-btn, .add-cart-btn');
            if(btn){
                const card = btn.closest('.product-card');
                if(!card) return;
                const qtyEl = card.querySelector('[data-qty]');
                let qty = Number(qtyEl?.textContent) || 1;

                if(btn.classList.contains('qty-increase')){
                    qtyEl.textContent = Math.min(99, qty + 1);
                    return;
                }
                if(btn.classList.contains('qty-decrease')){
                    qtyEl.textContent = Math.max(1, qty - 1);
                    return;
                }
                if(btn.classList.contains('add-cart-btn')){
                    const id = card.dataset.id;
                    const name = card.querySelector('h3')?.textContent?.trim() || 'منتج';
                    const price = Number(card.dataset.price || 0);
                    const img = card.querySelector('img')?.src || '';
                    const cart = getCart();
                    const existing = cart.find(i => i.id === id);
                    if(existing){ existing.qty = Math.min(999, existing.qty + qty); }
                    else { cart.push({ id, name, price, qty, img }); }
                    saveCart(cart);
                    updateHeaderCountUI();
                    const badge = document.getElementById('cart-count');
                    if(badge) badge.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
                    if(qtyEl) qtyEl.textContent = '1';
                }
                return;
            }
            if(e.target.closest('.card-actions')) return;
            const card = e.target.closest('.product-card');
            if(card) openProductModal(card);
        });
    }

    // Keyboard: Escape closes modals
    document.addEventListener('keydown', e => {
        if(e.key === 'Escape'){
            closeCartModal();
            closeProductModal();
        }
    });
});
