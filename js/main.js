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

// -- PDF Catalog (Canvas 2D API) --
function createPageCanvas(w, h, scale){
    const c = document.createElement('canvas');
    c.width = w * scale;
    c.height = h * scale;
    const ctx = c.getContext('2d');
    ctx.scale(scale, scale);
    return { canvas: c, ctx };
}

function roundRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function fillBg(ctx, w, h){
    ctx.fillStyle = '#060a14';
    ctx.fillRect(0, 0, w, h);
}

function drawTextRTL(ctx, text, x, y, font, color, align){
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align || 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y);
    ctx.restore();
}

function wrapTextRTL(ctx, text, x, y, maxW, lineH, font, color){
    ctx.save();
    ctx.direction = 'rtl';
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const words = text.split(' ');
    let line = '';
    let cy = y;
    for(let i = 0; i < words.length; i++){
        const test = line ? line + ' ' + words[i] : words[i];
        if(ctx.measureText(test).width > maxW && line){
            ctx.fillText(line, x, cy);
            line = words[i];
            cy += lineH;
        } else {
            line = test;
        }
    }
    if(line) ctx.fillText(line, x, cy);
    ctx.restore();
    return cy + lineH;
}

function loadImageAsync(src){
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

async function generateCatalog(){
    if(!window.jspdf || !window.jspdf.jsPDF){
        alert('مكتبة PDF لم تُحمّل بعد، يرجى الانتظار ثم المحاولة مرة أخرى.');
        return;
    }

    const btn = document.getElementById('download-catalog');
    const originalText = btn.innerHTML;
    btn.innerHTML = '⏳ جاري إنشاء الكتالوج...';
    btn.disabled = true;

    try {
    const cards = Array.from(document.querySelectorAll('.product-card'));
    const PW = 794, PH = 1123, SC = 2;
    const F = "'VIP Hala Bold', 'Segoe UI', Tahoma, Arial, sans-serif";

    // Wait for fonts
    if(document.fonts && document.fonts.ready) await document.fonts.ready;

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
            imgSrc: imgEl ? imgEl.src : ''
        };
    });

    // Pre-load all images
    const imgMap = {};
    await Promise.all(products.map(async p => {
        if(p.imgSrc) imgMap[p.imgSrc] = await loadImageAsync(p.imgSrc);
    }));

    const canvases = [];

    // ---- COVER PAGE ----
    {
        const { canvas, ctx } = createPageCanvas(PW, PH, SC);
        fillBg(ctx, PW, PH);
        // Top line
        ctx.fillStyle = '#6c5ce7';
        roundRect(ctx, 30, 30, PW - 60, 5, 3);
        ctx.fill();
        // Brand
        drawTextRTL(ctx, 'SWAYJO', PW/2, PH/2 - 80, `bold 72px ${F}`, '#f0f0f0');
        drawTextRTL(ctx, 'Smart Home Solutions', PW/2, PH/2 - 20, `22px ${F}`, '#a29bfe');
        drawTextRTL(ctx, 'كتالوج المنتجات', PW/2, PH/2 + 50, `bold 30px ${F}`, '#cccccc');
        const dateStr = new Date().toLocaleDateString('ar-IQ', { year:'numeric', month:'long' });
        drawTextRTL(ctx, dateStr, PW/2, PH/2 + 95, `18px ${F}`, '#888888');
        // Bottom line
        ctx.fillStyle = '#6c5ce7';
        roundRect(ctx, 30, PH - 65, PW - 60, 5, 3);
        ctx.fill();
        drawTextRTL(ctx, 'wa.me/9647774823205  |  @swi.cho', PW/2, PH - 35, `14px ${F}`, '#666666');
        canvases.push(canvas);
    }

    // ---- PRODUCT PAGES (4 per page, 2x2) ----
    const PER_PAGE = 4;
    const totalProdPages = Math.ceil(products.length / PER_PAGE);
    const totalPages = totalProdPages + 3; // cover + products + discount + back

    for(let pg = 0; pg < totalProdPages; pg++){
        const { canvas, ctx } = createPageCanvas(PW, PH, SC);
        fillBg(ctx, PW, PH);

        // Header bar
        ctx.fillStyle = '#6c5ce7';
        ctx.fillRect(0, 0, PW, 40);
        drawTextRTL(ctx, 'SWAYJO — كتالوج المنتجات', PW/2, 20, `bold 14px ${F}`, '#ffffff');

        const pageProds = products.slice(pg * PER_PAGE, (pg + 1) * PER_PAGE);
        const cardW = 360, cardH = 480;
        const gapX = 30, gapY = 24;
        const startX = (PW - 2 * cardW - gapX) / 2;
        const startY = 60;

        for(let i = 0; i < pageProds.length; i++){
            const p = pageProds[i];
            const col = i % 2, row = Math.floor(i / 2);
            const cx = startX + col * (cardW + gapX);
            const cy = startY + row * (cardH + gapY);

            // Card background
            ctx.fillStyle = '#10142a';
            roundRect(ctx, cx, cy, cardW, cardH, 16);
            ctx.fill();
            ctx.strokeStyle = '#282c44';
            ctx.lineWidth = 1;
            roundRect(ctx, cx, cy, cardW, cardH, 16);
            ctx.stroke();

            // Image area
            const imgAreaH = 190;
            const img = imgMap[p.imgSrc];
            if(img){
                const maxImgW = cardW - 40, maxImgH = imgAreaH - 20;
                let iw = img.naturalWidth, ih = img.naturalHeight;
                const ratio = Math.min(maxImgW / iw, maxImgH / ih, 1);
                iw *= ratio; ih *= ratio;
                const ix = cx + (cardW - iw) / 2;
                const iy = cy + (imgAreaH - ih) / 2;
                ctx.drawImage(img, ix, iy, iw, ih);
            }

            // Text area
            let ty = cy + imgAreaH + 10;
            const textX = cx + cardW - 16; // RTL right-aligned
            const textMaxW = cardW - 32;

            // Category badge
            if(p.category){
                ctx.save();
                const catFont = `12px ${F}`;
                ctx.font = catFont;
                ctx.direction = 'rtl';
                const cw = ctx.measureText(p.category).width + 20;
                ctx.fillStyle = 'rgba(108,92,231,0.2)';
                roundRect(ctx, cx + cardW - 16 - cw, ty - 2, cw, 22, 11);
                ctx.fill();
                ctx.fillStyle = '#a29bfe';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'top';
                ctx.fillText(p.category, textX - 10, ty + 2);
                ctx.restore();
                ty += 28;
            }

            // Product name
            ty = wrapTextRTL(ctx, p.name, textX, ty, textMaxW, 26, `bold 18px ${F}`, '#f0f0f0');
            ty += 4;

            // Price
            const priceText = p.price.toLocaleString('en-US') + ' د.ع';
            drawTextRTL(ctx, priceText, textX, ty + 8, `bold 18px ${F}`, '#00b894', 'right');
            ty += 30;

            // Discount badges
            ctx.save();
            ctx.direction = 'rtl';
            ctx.textBaseline = 'top';
            ctx.textAlign = 'right';

            // 10% badge
            const t10 = '١٠+ قطع: ' + p.price10.toLocaleString('en-US') + ' د.ع (-10%)';
            ctx.font = `12px ${F}`;
            const w10 = ctx.measureText(t10).width + 16;
            ctx.fillStyle = 'rgba(108,92,231,0.15)';
            roundRect(ctx, textX - w10, ty, w10, 22, 8);
            ctx.fill();
            ctx.fillStyle = '#a29bfe';
            ctx.fillText(t10, textX - 8, ty + 4);
            ty += 26;

            // 20% badge
            const t20 = '٢٠+ قطعة: ' + p.price20.toLocaleString('en-US') + ' د.ع (-20%)';
            const w20 = ctx.measureText(t20).width + 16;
            ctx.fillStyle = 'rgba(255,180,80,0.12)';
            roundRect(ctx, textX - w20, ty, w20, 22, 8);
            ctx.fill();
            ctx.fillStyle = '#ffb450';
            ctx.fillText(t20, textX - 8, ty + 4);
            ctx.restore();
            ty += 28;

            // Description
            if(p.desc){
                wrapTextRTL(ctx, p.desc, textX, ty, textMaxW, 18, `12px ${F}`, '#999999');
            }
        }

        // Footer
        const pageNum = `${pg + 2} / ${totalPages}`;
        drawTextRTL(ctx, pageNum, PW/2, PH - 16, `12px ${F}`, '#555555');
        canvases.push(canvas);
    }

    // ---- DISCOUNT PAGE ----
    {
        const { canvas, ctx } = createPageCanvas(PW, PH, SC);
        fillBg(ctx, PW, PH);

        // Header
        ctx.fillStyle = '#6c5ce7';
        ctx.fillRect(0, 0, PW, 40);
        drawTextRTL(ctx, 'SWAYJO — خصومات الجملة', PW/2, 20, `bold 14px ${F}`, '#ffffff');

        drawTextRTL(ctx, 'خصومات الجملة', PW/2, 180, `bold 36px ${F}`, '#f0f0f0');

        // 10% box
        const bw = 500, bh = 120;
        const bx = (PW - bw) / 2;
        ctx.strokeStyle = '#6c5ce7';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#10142a';
        roundRect(ctx, bx, 260, bw, bh, 16);
        ctx.fill();
        roundRect(ctx, bx, 260, bw, bh, 16);
        ctx.stroke();
        drawTextRTL(ctx, 'خصم 10%', PW/2, 300, `bold 36px ${F}`, '#a29bfe');
        drawTextRTL(ctx, 'عند شراء ١٠ قطع أو أكثر من أي منتج', PW/2, 345, `18px ${F}`, '#bbbbbb');

        // 20% box
        ctx.strokeStyle = '#ffb450';
        ctx.fillStyle = '#10142a';
        roundRect(ctx, bx, 430, bw, bh, 16);
        ctx.fill();
        roundRect(ctx, bx, 430, bw, bh, 16);
        ctx.stroke();
        drawTextRTL(ctx, 'خصم 20% (الحد الأقصى)', PW/2, 470, `bold 36px ${F}`, '#ffb450');
        drawTextRTL(ctx, 'عند شراء ٢٠ قطعة أو أكثر من أي منتج', PW/2, 515, `18px ${F}`, '#bbbbbb');

        drawTextRTL(ctx, 'للطلب بالجملة تواصل معنا عبر واتساب', PW/2, 620, `16px ${F}`, '#888888');
        drawTextRTL(ctx, 'wa.me/9647774823205', PW/2, 655, `16px ${F}`, '#a29bfe');

        const discPageNum = `${totalProdPages + 2} / ${totalPages}`;
        drawTextRTL(ctx, discPageNum, PW/2, PH - 16, `12px ${F}`, '#555555');
        canvases.push(canvas);
    }

    // ---- BACK COVER ----
    {
        const { canvas, ctx } = createPageCanvas(PW, PH, SC);
        fillBg(ctx, PW, PH);

        ctx.fillStyle = '#6c5ce7';
        roundRect(ctx, PW/2 - 60, PH/2 - 120, 120, 4, 2);
        ctx.fill();

        drawTextRTL(ctx, 'SWAYJO', PW/2, PH/2 - 70, `bold 48px ${F}`, '#f0f0f0');
        drawTextRTL(ctx, 'Smart Home Solutions', PW/2, PH/2 - 25, `18px ${F}`, '#a29bfe');

        drawTextRTL(ctx, 'واتساب: 3205 482 777 964+', PW/2, PH/2 + 50, `16px ${F}`, '#bbbbbb');
        drawTextRTL(ctx, 'انستغرام: swi.cho@', PW/2, PH/2 + 85, `16px ${F}`, '#bbbbbb');
        drawTextRTL(ctx, 'Alexa  |  Google Home  |  Smart Life', PW/2, PH/2 + 130, `14px ${F}`, '#888888');
        canvases.push(canvas);
    }

    // ---- BUILD PDF ----
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    canvases.forEach((c, idx) => {
        if(idx > 0) doc.addPage();
        const imgData = c.toDataURL('image/jpeg', 0.92);
        doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    });

    doc.save('Swayjo-Catalog.pdf');
    btn.innerHTML = originalText;
    btn.disabled = false;

    } catch(err) {
        console.error('Catalog error:', err);
        alert('حدث خطأ أثناء إنشاء الكتالوج: ' + err.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
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
