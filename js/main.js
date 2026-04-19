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
function loadImageAsDataURL(src){
    return new Promise(resolve => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const SIZE = 400;
            const canvas = document.createElement('canvas');
            canvas.width = SIZE;
            canvas.height = SIZE;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#0c1018';
            ctx.fillRect(0, 0, SIZE, SIZE);
            const scale = Math.min(SIZE / img.naturalWidth, SIZE / img.naturalHeight) * 0.85;
            const w = img.naturalWidth * scale;
            const h = img.naturalHeight * scale;
            ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

function generateCatalog(){
    if(!window.jspdf || !window.jspdf.jsPDF){
        alert('مكتبة PDF لم تُحمّل بعد، يرجى الانتظار ثم المحاولة مرة أخرى.');
        return;
    }

    const btn = document.getElementById('download-catalog');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ جاري إنشاء الكتالوج...';
    btn.disabled = true;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const cards = Array.from(document.querySelectorAll('.product-card'));
    const IMG_SIZE = 45; // uniform square size for all product images in PDF

    // --- Cover Page ---
    doc.setFillColor(8, 12, 24);
    doc.rect(0, 0, W, H, 'F');
    doc.setFillColor(108, 92, 231);
    doc.roundedRect(20, 20, 170, 4, 2, 2, 'F');
    doc.setTextColor(240, 240, 240);
    doc.setFontSize(40);
    doc.text('SWAYJO', W / 2, 90, { align: 'center' });
    doc.setFontSize(14);
    doc.setTextColor(162, 155, 254);
    doc.text('Smart Home Solutions', W / 2, 105, { align: 'center' });
    doc.setFontSize(18);
    doc.setTextColor(200, 200, 200);
    doc.text('Product Catalog', W / 2, 140, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(140, 140, 140);
    doc.text(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }), W / 2, 155, { align: 'center' });
    doc.setFillColor(108, 92, 231);
    doc.roundedRect(20, H - 24, 170, 4, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('wa.me/9647774823205  |  @swi.cho', W / 2, H - 12, { align: 'center' });

    // Preload all images at uniform size
    const imagePromises = cards.map(card => {
        const imgEl = card.querySelector('img');
        return loadImageAsDataURL(imgEl ? imgEl.src : '');
    });

    Promise.all(imagePromises).then(images => {
        // --- Product Pages (4 products per page, grid 2×2) ---
        const COLS = 2, ROWS = 2, PER_PAGE = COLS * ROWS;
        const MARGIN = 14, GAP = 8, HEADER_H = 16;
        const cellW = (W - MARGIN * 2 - GAP) / COLS;
        const cellH = (H - MARGIN - HEADER_H - 30 - GAP) / ROWS; // 30 for footer area
        const pageCount = Math.ceil(cards.length / PER_PAGE);

        for(let page = 0; page < pageCount; page++){
            doc.addPage();
            // Background
            doc.setFillColor(8, 12, 24);
            doc.rect(0, 0, W, H, 'F');
            // Header bar
            doc.setFillColor(108, 92, 231);
            doc.rect(0, 0, W, HEADER_H, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('SWAYJO - Product Catalog', W / 2, HEADER_H - 4, { align: 'center' });

            const startIdx = page * PER_PAGE;
            const pageItems = cards.slice(startIdx, startIdx + PER_PAGE);

            pageItems.forEach((card, i) => {
                const col = i % COLS;
                const row = Math.floor(i / COLS);
                const x = MARGIN + col * (cellW + GAP);
                const y = HEADER_H + 6 + row * (cellH + GAP);

                const imgData = images[startIdx + i];
                const name = card.querySelector('h3').textContent;
                const rawPrice = Number(card.dataset.price || 0);
                const desc = card.dataset.description || '';
                const category = card.querySelector('.card-category')?.textContent || '';

                // Card bg
                doc.setFillColor(16, 20, 36);
                doc.roundedRect(x, y, cellW, cellH, 4, 4, 'F');
                doc.setDrawColor(40, 44, 60);
                doc.setLineWidth(0.3);
                doc.roundedRect(x, y, cellW, cellH, 4, 4, 'S');

                // Image - centered, uniform size
                const imgX = x + (cellW - IMG_SIZE) / 2;
                const imgY = y + 6;
                if(imgData){
                    try { doc.addImage(imgData, 'JPEG', imgX, imgY, IMG_SIZE, IMG_SIZE); } catch(e){}
                }

                // Text area below image
                const textY = imgY + IMG_SIZE + 5;
                const textX = x + 6;
                const textW = cellW - 12;

                // Category
                doc.setFillColor(108, 92, 231);
                doc.roundedRect(textX, textY, 28, 6, 2, 2, 'F');
                doc.setFontSize(6);
                doc.setTextColor(255, 255, 255);
                doc.text(category, textX + 14, textY + 4.3, { align: 'center' });

                // Name
                doc.setFontSize(11);
                doc.setTextColor(240, 240, 240);
                const nameLines = doc.splitTextToSize(name, textW);
                doc.text(nameLines[0], textX, textY + 14);

                // Price
                doc.setFontSize(10);
                doc.setTextColor(0, 184, 148);
                doc.text(rawPrice.toLocaleString('en-US') + ' IQD', textX, textY + 22);

                // Discount prices
                const price10 = Math.round(rawPrice * 0.9);
                const price20 = Math.round(rawPrice * 0.8);
                doc.setFontSize(7);
                doc.setTextColor(162, 155, 254);
                doc.text('10+ pcs: ' + price10.toLocaleString('en-US') + ' IQD  (-10%)', textX, textY + 29);
                doc.setTextColor(255, 180, 80);
                doc.text('20+ pcs: ' + price20.toLocaleString('en-US') + ' IQD  (-20%)', textX, textY + 35);

                // Description
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                const descLines = doc.splitTextToSize(desc, textW);
                doc.text(descLines.slice(0, 2), textX, textY + 43);

                // Color dots
                const colorDots = card.querySelectorAll('.color-dot');
                if(colorDots.length){
                    let cx = textX;
                    colorDots.forEach(dot => {
                        const bg = dot.style.background || dot.style.backgroundColor;
                        if(bg.includes('fff') || bg.includes('white')){
                            doc.setFillColor(230, 230, 230);
                        } else {
                            doc.setFillColor(30, 30, 30);
                        }
                        doc.circle(cx + 3, textY + 54, 3, 'F');
                        doc.setDrawColor(80, 80, 80);
                        doc.circle(cx + 3, textY + 54, 3, 'S');
                        cx += 9;
                    });
                }
            });

            // Footer
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text((page + 2) + ' / ' + (pageCount + 2), W / 2, H - 6, { align: 'center' });
        }

        // --- Discount Info Page ---
        doc.addPage();
        doc.setFillColor(8, 12, 24);
        doc.rect(0, 0, W, H, 'F');
        doc.setFillColor(108, 92, 231);
        doc.rect(0, 0, W, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('SWAYJO - Wholesale Discounts', W / 2, 10, { align: 'center' });

        doc.setFontSize(20);
        doc.setTextColor(240, 240, 240);
        doc.text('Wholesale Pricing', W / 2, 50, { align: 'center' });

        // Discount tier 1
        doc.setFillColor(16, 20, 36);
        doc.roundedRect(30, 65, 150, 35, 4, 4, 'F');
        doc.setDrawColor(108, 92, 231);
        doc.setLineWidth(0.5);
        doc.roundedRect(30, 65, 150, 35, 4, 4, 'S');
        doc.setFontSize(16);
        doc.setTextColor(162, 155, 254);
        doc.text('10%  OFF', W / 2, 80, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(180, 180, 180);
        doc.text('When ordering 10+ pieces of any product', W / 2, 92, { align: 'center' });

        // Discount tier 2
        doc.setFillColor(16, 20, 36);
        doc.roundedRect(30, 110, 150, 35, 4, 4, 'F');
        doc.setDrawColor(255, 180, 80);
        doc.setLineWidth(0.5);
        doc.roundedRect(30, 110, 150, 35, 4, 4, 'S');
        doc.setFontSize(16);
        doc.setTextColor(255, 180, 80);
        doc.text('20%  OFF  (MAX)', W / 2, 125, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(180, 180, 180);
        doc.text('When ordering 20+ pieces of any product', W / 2, 137, { align: 'center' });

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text('Contact us on WhatsApp for wholesale orders', W / 2, 165, { align: 'center' });
        doc.text('wa.me/9647774823205', W / 2, 177, { align: 'center' });

        // --- Back Cover ---
        doc.addPage();
        doc.setFillColor(8, 12, 24);
        doc.rect(0, 0, W, H, 'F');
        doc.setFillColor(108, 92, 231);
        doc.roundedRect(60, 100, 90, 3, 1.5, 1.5, 'F');
        doc.setTextColor(240, 240, 240);
        doc.setFontSize(22);
        doc.text('SWAYJO', W / 2, 125, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(162, 155, 254);
        doc.text('Smart Home Solutions', W / 2, 137, { align: 'center' });
        doc.setFontSize(10);
        doc.setTextColor(180, 180, 180);
        doc.text('WhatsApp: +964 777 482 3205', W / 2, 165, { align: 'center' });
        doc.text('Instagram: @swi.cho', W / 2, 177, { align: 'center' });
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text('Alexa  |  Google Home  |  Smart Life', W / 2, 200, { align: 'center' });

        doc.save('Swayjo-Catalog.pdf');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }).catch(err => {
        console.error('Catalog generation error:', err);
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
