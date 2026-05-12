// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://rjzutiiebzecqlnelrzw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_F9T0ucdfNyItaawCMcQowQ_Yr11boR0';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── CONFIGURACIÓN ────────────────────────────────────────────────────────────
const CONFIG = {
    dealershipName: "MDZ",
    tagline: "Los mejores vehículos al mejor precio",
    whatsappPhone: "5491130836981",
    adminPassword: "marthi0116",
    currency: "ARS"
};

// ─── COMPRESIÓN DE IMÁGENES ───────────────────────────────────────────────────
function compressImage(file, maxWidthPx = 1200, quality = 0.75) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidthPx) {
                    height = Math.round((height * maxWidthPx) / width);
                    width = maxWidthPx;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// ─── UTILIDADES ───────────────────────────────────────────────────────────────
function formatUSD(amount) {
    if (!amount && amount !== 0) return '—';
    return 'USD ' + Number(amount).toLocaleString('es-AR');
}

function formatARS(amount) {
    if (!amount && amount !== 0) return null;
    return '$ ' + Number(amount).toLocaleString('es-AR');
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 400);
    }, 3000);
}

// ─── DATOS — SUPABASE ─────────────────────────────────────────────────────────
async function getVehicles() {
    const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('added_at', { ascending: false });
    if (error) { console.error('Error leyendo vehículos:', error); return []; }
    return (data || []).map(dbToLocal);
}

async function saveVehicle(vehicle) {
    const row = localToDB(vehicle);
    if (vehicle.id) {
        const { error } = await supabase.from('vehicles').update(row).eq('id', vehicle.id);
        if (error) { console.error('Error actualizando:', error); return false; }
    } else {
        const { error } = await supabase.from('vehicles').insert([row]);
        if (error) { console.error('Error insertando:', error); return false; }
    }
    return true;
}

async function deleteVehicleDB(id) {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) { console.error('Error eliminando:', error); return false; }
    return true;
}

async function updateVehicleStatus(id, status, soldAt = null) {
    const update = { status };
    if (soldAt !== undefined) update.sold_at = soldAt;
    const { error } = await supabase.from('vehicles').update(update).eq('id', id);
    if (error) { console.error('Error actualizando status:', error); return false; }
    return true;
}

// Convierte fila de Supabase → objeto local
function dbToLocal(row) {
    return {
        id: row.id,
        brand: row.brand,
        model: row.model,
        year: row.year,
        km: row.km,
        fuel: row.fuel,
        transmission: row.transmission,
        traction: row.traction,
        vehicleType: row.vehicle_type,
        color: row.color,
        doors: row.doors,
        engine: row.engine,
        priceUSD: row.price_usd,
        priceARS: row.price_ars,
        costoARS: row.costo_ars,
        condition: row.condition,
        description: row.description,
        images: row.images || [],
        status: row.status || 'disponible',
        addedAt: row.added_at,
        soldAt: row.sold_at
    };
}

// Convierte objeto local → fila de Supabase
function localToDB(v) {
    const row = {
        brand: v.brand,
        model: v.model,
        year: v.year,
        km: v.km || null,
        fuel: v.fuel || null,
        transmission: v.transmission || null,
        traction: v.traction || null,
        vehicle_type: v.vehicleType || null,
        color: v.color || null,
        doors: v.doors || null,
        engine: v.engine || null,
        price_usd: v.priceUSD,
        price_ars: v.priceARS || null,
        costo_ars: v.costoARS || null,
        condition: v.condition || null,
        description: v.description || null,
        images: v.images || [],
        status: v.status || 'disponible',
        sold_at: v.soldAt || null
    };
    if (v.id) row.id = v.id;
    return row;
}

// ─── SETTINGS (foto de fondo) ─────────────────────────────────────────────────
async function getSetting(key) {
    const { data } = await supabase.from('settings').select('value').eq('key', key).single();
    return data ? data.value : null;
}

async function setSetting(key, value) {
    await supabase.from('settings').upsert({ key, value });
}

async function deleteSetting(key) {
    await supabase.from('settings').delete().eq('key', key);
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function checkAdminAuth() {
    return sessionStorage.getItem('admin_authenticated') === 'true';
}

function setAdminAuth(val) {
    sessionStorage.setItem('admin_authenticated', val ? 'true' : 'false');
}

function promptAdminPassword() {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.85);display:flex;align-items:center;
            justify-content:center;z-index:9999;
        `;
        overlay.innerHTML = `
            <div style="background:var(--black-2);padding:3rem;border-radius:8px;
                border:1px solid var(--gold-1);max-width:400px;width:90%;">
                <h2 style="color:var(--gold-1);text-align:center;margin-bottom:2rem;">
                    Panel de Administrador
                </h2>
                <div class="form-group">
                    <label>Contraseña:</label>
                    <input type="password" id="auth-password" placeholder="Ingresá la contraseña" autofocus
                        style="width:100%;padding:10px;background:var(--black-3);border:1px solid rgba(255,255,255,0.1);
                        border-radius:6px;color:#fff;font-size:1rem;margin-top:6px;">
                </div>
                <button id="auth-submit" class="btn" style="width:100%;margin-top:1rem;">Acceder</button>
                <div id="auth-error" style="color:#ff6b6b;margin-top:1rem;text-align:center;display:none;">
                    Contraseña incorrecta
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        function tryLogin() {
            const pwd = overlay.querySelector('#auth-password').value;
            if (pwd === CONFIG.adminPassword) {
                setAdminAuth(true);
                overlay.remove();
                resolve(true);
            } else {
                overlay.querySelector('#auth-error').style.display = 'block';
            }
        }

        overlay.querySelector('#auth-submit').addEventListener('click', tryLogin);
        overlay.querySelector('#auth-password').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') tryLogin();
        });
    });
}

// ─── LOADING ──────────────────────────────────────────────────────────────────
function showLoading(container, message = 'Cargando...') {
    container.innerHTML = `
        <div style="text-align:center;padding:4rem;color:var(--text-faint);">
            <div style="font-size:2rem;margin-bottom:1rem;animation:pulse-dot 1s infinite">⏳</div>
            <p>${message}</p>
        </div>`;
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
function getCurrentRoute() {
    return window.location.hash.substring(1) || 'home';
}

function navigateTo(route) {
    window.location.hash = route;
}

async function handleRouteChange() {
    const route = getCurrentRoute();

    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`a[href="#${route}"]`);
    if (activeLink) activeLink.classList.add('active');

    const nameEl = document.getElementById('dealership-name');
    if (nameEl) nameEl.textContent = CONFIG.dealershipName;

    const nav = document.getElementById('nav');
    if (nav) nav.style.display = (route === 'home' || route === '') ? 'none' : '';

    switch (route) {
        case 'home':
        case '':
            renderHome();
            break;
        case 'catalog':
            renderCatalog();
            break;
        case 'comparar':
            renderComparePage();
            break;
        case 'admin':
            if (!checkAdminAuth()) {
                const ok = await promptAdminPassword();
                if (!ok) { navigateTo('catalog'); return; }
            }
            renderAdmin('add');
            break;
        case 'stats':
            if (!checkAdminAuth()) {
                const ok = await promptAdminPassword();
                if (!ok) { navigateTo('catalog'); return; }
            }
            renderStats();
            break;
        default:
            if (route.startsWith('vehicle?id=')) {
                renderVehicleDetail(route.split('=')[1]);
            } else {
                renderHome();
            }
    }
}

// ─── HOME / SPLASH ────────────────────────────────────────────────────────────
function renderHome() {
    const main = document.getElementById('main');
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = 'none';

    main.innerHTML = `
        <div class="splash-screen">
            <img
                src="logo.png"
                class="splash-logo-bg"
                alt="MDZ Logo"
                onerror="this.style.display='none'"
            >
            <div class="splash-bg-overlay"></div>
            <div class="splash-custom-bg" id="splash-custom-bg"></div>
            <div class="splash-content">
                <img src="logo.png" class="splash-logo-mobile" alt="MDZ Autos" onerror="this.style.display='none'">
                <div class="splash-title-block">
                    <div class="splash-mdz-text">MDZ</div>
                    <div class="splash-autos-text">AUTOS</div>
                </div>
                <div class="splash-divider">
                    <div class="splash-line"></div>
                    <div class="splash-diamond">◆</div>
                    <div class="splash-line"></div>
                </div>
                <button class="splash-btn" onclick="goToCatalog()">
                    <span>Encontrá tu auto</span>
                    <span class="splash-btn-arrow">→</span>
                </button>
                <div class="splash-change-photo" id="splash-change-photo" style="display:none">
                    <label for="splash-photo-input" class="splash-photo-btn">
                        📷 Cambiar foto de fondo
                        <input type="file" id="splash-photo-input" accept="image/*" style="display:none">
                    </label>
                    <button class="splash-photo-remove" onclick="removeSplashPhoto()" id="splash-photo-remove" style="display:none">✕ Quitar foto</button>
                </div>
            </div>
            <div class="splash-footer">
                <span>MDZ Autos</span>
                <span class="splash-footer-dot"></span>
                <span>Argentina</span>
            </div>
        </div>
    `;

    setTimeout(() => { loadSplashPhoto(); maybeShowSplashEdit(); }, 0);
}

function goToCatalog() {
    const nav = document.getElementById('nav');
    if (nav) nav.style.display = '';
    navigateTo('catalog');
}

// ── FOTO DE FONDO DEL SPLASH ──────────────────────────────────────────────────
async function loadSplashPhoto() {
    const saved = await getSetting('splash_bg_photo');
    const el = document.getElementById('splash-custom-bg');
    if (saved && el) {
        el.innerHTML = '';
        const img = document.createElement('img');
        img.src = saved;
        img.alt = 'Foto de fondo';
        el.appendChild(img);
        el.style.opacity = '1';
        const removeBtn = document.getElementById('splash-photo-remove');
        if (removeBtn) removeBtn.style.display = 'inline-flex';
    }
}

function setupSplashPhotoInput() {
    const input = document.getElementById('splash-photo-input');
    if (!input) return;
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        showToast('⏳ Subiendo foto...');
        const compressed = await compressImage(file, 1920, 0.82);
        await setSetting('splash_bg_photo', compressed);
        loadSplashPhoto();
        showToast('✅ Foto de fondo actualizada');
    });
}

async function removeSplashPhoto() {
    await deleteSetting('splash_bg_photo');
    const el = document.getElementById('splash-custom-bg');
    if (el) { el.innerHTML = ''; el.style.opacity = '0'; }
    const removeBtn = document.getElementById('splash-photo-remove');
    if (removeBtn) removeBtn.style.display = 'none';
    showToast('Foto de fondo eliminada');
}

function maybeShowSplashEdit() {
    if (checkAdminAuth()) {
        const btn = document.getElementById('splash-change-photo');
        if (btn) btn.style.display = 'flex';
        setupSplashPhotoInput();
    }
}

// ─── CATÁLOGO ─────────────────────────────────────────────────────────────────
async function renderCatalog() {
    const main = document.getElementById('main');
    main.innerHTML = `<div class="catalog-wrap"><div id="catalog-inner"></div></div>`;
    const inner = document.getElementById('catalog-inner');
    showLoading(inner, 'Cargando vehículos...');

    const allVehicles = await getVehicles();
    const vehicles = allVehicles.filter(v => v.status !== 'oculto');
    const brands = [...new Set(allVehicles.map(v => v.brand).filter(Boolean))].sort();

    inner.innerHTML = `
        <div class="catalog-hero">
            <h1>${CONFIG.dealershipName}</h1>
            <p>${CONFIG.tagline}</p>
            <div class="gold-divider"></div>
        </div>

        <div class="search-wrap">
            <div class="search-bar">
                <input type="text" id="search-input" placeholder="Buscar por marca, modelo...">
            </div>
        </div>

        <div class="filters">
            <div class="filters-title">Filtros</div>
            <div class="filter-row">
                <div>
                    <label for="brand-filter">Marca</label>
                    <select id="brand-filter">
                        <option value="">Todas las marcas</option>
                        ${brands.map(b => `<option value="${b}">${b}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label for="year-min">Año desde</label>
                    <input type="number" id="year-min" placeholder="Año mínimo">
                </div>
                <div>
                    <label for="year-max">Año hasta</label>
                    <input type="number" id="year-max" placeholder="Año máximo">
                </div>
                <div>
                    <label for="price-max">Precio máximo (USD)</label>
                    <input type="number" id="price-max" placeholder="Precio máximo">
                </div>
            </div>
            <div class="filter-row">
                <div class="checkbox-group">
                    <label><input type="checkbox" value="Nafta" class="fuel-filter"> Nafta</label>
                    <label><input type="checkbox" value="Diesel" class="fuel-filter"> Diesel</label>
                    <label><input type="checkbox" value="Eléctrico" class="fuel-filter"> Eléctrico</label>
                    <label><input type="checkbox" value="Híbrido" class="fuel-filter"> Híbrido</label>
                    <label><input type="checkbox" value="GNC" class="fuel-filter"> GNC</label>
                </div>
            </div>
            <div class="filter-row">
                <div class="checkbox-group">
                    <label><input type="checkbox" value="Manual" class="transmission-filter"> Manual</label>
                    <label><input type="checkbox" value="Automático" class="transmission-filter"> Automático</label>
                    <label><input type="checkbox" value="CVT" class="transmission-filter"> CVT</label>
                </div>
            </div>
        </div>

        <div class="results-counter" id="results-counter">Mostrando ${vehicles.length} de ${vehicles.length} vehículos</div>
        <div class="vehicle-grid" id="vehicle-grid">
            ${renderVehicleCards(vehicles)}
        </div>
    `;

    setupFilters(allVehicles);
}

function renderVehicleCards(vehicles) {
    if (vehicles.length === 0) {
        return `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);">
            No se encontraron vehículos con esos filtros.
        </div>`;
    }
    return vehicles.map((v, i) => {
        const arsText = v.priceARS ? `<div class="price-ars">${formatARS(v.priceARS)}</div>` : '';
        const specs = [v.km ? v.km.toLocaleString('es-AR') + ' km' : null, v.fuel, v.transmission]
            .filter(Boolean).join(' • ');
        return `
        <div class="vehicle-card ${v.status === 'vendido' ? 'sold' : ''}"
             style="animation-delay:${i * 0.07}s"
             onclick="navigateTo('vehicle?id=${v.id}')">
            ${v.status === 'vendido' ? '<div class="sold-stamp">VENDIDO</div>' : ''}
            <div class="card-img-wrap">
                <img src="${v.images[0]}" alt="${v.brand} ${v.model}" loading="lazy">
                <div class="card-img-overlay">
                    <h3>${v.brand} ${v.model} ${v.year}</h3>
                </div>
            </div>
            <div class="vehicle-card-content">
                ${specs ? `<div class="specs">${specs}</div>` : ''}
                <div class="price-block">
                    <div class="price-usd-main">${formatUSD(v.priceUSD)}</div>
                    ${arsText}
                </div>
                <div class="status ${v.status === 'disponible' ? 'available' : 'sold-badge'}">${v.status.toUpperCase()}</div>
                <div class="card-actions">
                    <a href="#vehicle?id=${v.id}" class="btn" onclick="event.stopPropagation()">Ver detalle</a>
                    <button type="button" class="btn btn-outline" onclick="event.stopPropagation();startCompare('${v.id}')">↔ Comparar</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function setupFilters(allVehicles) {
    const si = document.getElementById('search-input');
    const bf = document.getElementById('brand-filter');
    const ymi = document.getElementById('year-min');
    const yma = document.getElementById('year-max');
    const pm = document.getElementById('price-max');

    function applyFilters() {
        const visible = allVehicles.filter(v => v.status !== 'oculto');
        const q = si.value.toLowerCase();
        const brand = bf.value;
        const yMin = ymi.value ? parseInt(ymi.value) : null;
        const yMax = yma.value ? parseInt(yma.value) : null;
        const pMax = pm.value ? parseFloat(pm.value) : null;
        const fuels = [...document.querySelectorAll('.fuel-filter:checked')].map(c => c.value);
        const trans = [...document.querySelectorAll('.transmission-filter:checked')].map(c => c.value);

        const filtered = visible.filter(v => {
            if (q && !`${v.brand} ${v.model} ${v.description || ''}`.toLowerCase().includes(q)) return false;
            if (brand && v.brand !== brand) return false;
            if (yMin && v.year < yMin) return false;
            if (yMax && v.year > yMax) return false;
            if (pMax && v.priceUSD > pMax) return false;
            if (fuels.length && !fuels.includes(v.fuel)) return false;
            if (trans.length && !trans.includes(v.transmission)) return false;
            return true;
        });

        document.getElementById('results-counter').textContent =
            `Mostrando ${filtered.length} de ${visible.length} vehículos`;
        document.getElementById('vehicle-grid').innerHTML = renderVehicleCards(filtered);
    }

    [si, bf, ymi, yma, pm].forEach(el => el && el.addEventListener('input', applyFilters));
    document.querySelectorAll('.fuel-filter, .transmission-filter')
        .forEach(cb => cb.addEventListener('change', applyFilters));
}

// ─── DETALLE ──────────────────────────────────────────────────────────────────
async function renderVehicleDetail(id) {
    const main = document.getElementById('main');
    showLoading(main, 'Cargando vehículo...');

    const vehicles = await getVehicles();
    const vehicle = vehicles.find(v => v.id === id);

    if (!vehicle) { main.innerHTML = '<p style="padding:2rem">Vehículo no encontrado.</p>'; return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Registrar vista en Supabase settings como contador simple
    const viewKey = `views_${id}`;
    const currentViews = parseInt(await getSetting(viewKey) || '0') + 1;
    setSetting(viewKey, String(currentViews));

    const thumbs = vehicle.images.length > 1
        ? `<div class="thumbnails">${vehicle.images.map((img, i) =>
            `<img src="${img}" class="thumbnail ${i === 0 ? 'active' : ''}" data-index="${i}" alt="Foto ${i+1}">`
          ).join('')}</div>` : '';

    const specRows = [
        ['Marca', vehicle.brand],
        ['Modelo', vehicle.model],
        ['Año', vehicle.year],
        vehicle.km !== undefined ? ['Kilómetros', vehicle.km.toLocaleString('es-AR')] : null,
        vehicle.fuel ? ['Combustible', vehicle.fuel] : null,
        vehicle.transmission ? ['Transmisión', vehicle.transmission] : null,
        vehicle.traction ? ['Tracción', vehicle.traction] : null,
        vehicle.vehicleType ? ['Tipo', vehicle.vehicleType] : null,
        vehicle.color ? ['Color', vehicle.color] : null,
        vehicle.doors ? ['Puertas', vehicle.doors] : null,
        vehicle.engine ? ['Motor', vehicle.engine] : null,
        vehicle.condition ? ['Condición', vehicle.condition] : null,
    ].filter(Boolean);

    const arsText = vehicle.priceARS
        ? `<div class="detail-price-ars">${formatARS(vehicle.priceARS)}</div>` : '';

    main.innerHTML = `
        <div class="vehicle-detail-wrap">
        <div class="vehicle-detail">
            <a href="#catalog" class="btn btn-ghost back-btn" onclick="const n=document.getElementById('nav');if(n)n.style.display=''">← Volver</a>
            <div class="detail-layout">
                <div class="detail-gallery">
                    <div class="main-img-wrap">
                        ${vehicle.images.length > 1 ? `
                            <button class="gallery-nav prev" onclick="galleryNav(-1)">‹</button>
                            <button class="gallery-nav next" onclick="galleryNav(1)">›</button>` : ''}
                        <img src="${vehicle.images[0]}" id="main-image" class="main-image"
                             alt="${vehicle.brand} ${vehicle.model}"
                             onclick="openLightbox(window._currentImages, window._currentImgIndex)">
                    </div>
                    ${thumbs}
                </div>
                <div class="detail-info">
                    <h1>${vehicle.brand} ${vehicle.model} ${vehicle.year}</h1>
                    <div class="detail-price-block">
                        <div class="detail-price-usd">${formatUSD(vehicle.priceUSD)}</div>
                        ${arsText}
                    </div>
                    <ul class="vehicle-spec-list">
                        ${specRows.map(([k,v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}
                    </ul>
                    ${vehicle.description ? `<div class="description">"${vehicle.description}"</div>` : ''}
                    <div class="detail-actions">
                        <a href="https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent(`Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year}. ¿Está disponible?`)}"
                           class="btn" target="_blank">💬 Consultar por WhatsApp</a>
                        <button class="btn btn-outline" onclick="generatePDF('${vehicle.id}')">📄 Generar ficha PDF</button>
                        <button class="btn btn-outline" onclick="startCompare('${vehicle.id}')">↔ Comparar</button>
                    </div>
                </div>
            </div>
        </div>
        </div>
    `;

    window._currentImages = vehicle.images;
    window._currentImgIndex = 0;

    document.querySelectorAll('.thumbnail').forEach(t => {
        t.addEventListener('click', () => {
            const i = parseInt(t.dataset.index);
            window._currentImgIndex = i;
            document.getElementById('main-image').src = vehicle.images[i];
            document.querySelectorAll('.thumbnail').forEach(x => x.classList.remove('active'));
            t.classList.add('active');
        });
    });
}

window.galleryNav = function(dir) {
    const imgs = window._currentImages;
    if (!imgs) return;
    window._currentImgIndex = (window._currentImgIndex + dir + imgs.length) % imgs.length;
    document.getElementById('main-image').src = imgs[window._currentImgIndex];
    document.querySelectorAll('.thumbnail').forEach((t, i) => {
        t.classList.toggle('active', i === window._currentImgIndex);
    });
};

window.openLightbox = function(images, startIndex = 0) {
    window._lbImages = images;
    window._lbIndex = startIndex;
    document.getElementById('lightbox-img').src = images[startIndex];
    document.getElementById('lightbox').style.display = 'flex';
};

window.closeLightbox = function() {
    document.getElementById('lightbox').style.display = 'none';
};

window.lightboxNav = function(dir) {
    const imgs = window._lbImages;
    window._lbIndex = (window._lbIndex + dir + imgs.length) % imgs.length;
    document.getElementById('lightbox-img').src = imgs[window._lbIndex];
};

// ─── COMPARAR ─────────────────────────────────────────────────────────────────
function startCompare(id) {
    sessionStorage.setItem('compare_a', id);
    sessionStorage.removeItem('compare_b');
    navigateTo('comparar');
}

async function renderComparePage() {
    const main = document.getElementById('main');
    showLoading(main, 'Cargando comparador...');

    const vehicles = await getVehicles();
    const aId = sessionStorage.getItem('compare_a');
    const bId = sessionStorage.getItem('compare_b');
    const vA = vehicles.find(v => v.id === aId) || null;
    const vB = vehicles.find(v => v.id === bId) || null;

    main.innerHTML = `
        <section class="compare-page">
            <div class="compare-header">
                <h1>Comparar Vehículos</h1>
                <div class="gold-divider"></div>
            </div>
            <div class="compare-columns">
                ${renderCompareColumn('compare_a', vA, vB)}
                ${renderCompareColumn('compare_b', vB, vA)}
            </div>
            ${vA && vB ? renderComparisonTable(vA, vB) : ''}
            <div id="compare-selector-panel"></div>
        </section>
    `;

    window._compareVehicles = vehicles;
}

function renderCompareColumn(slot, vehicle, other) {
    if (!vehicle) return `
        <div class="compare-column">
            <div class="compare-placeholder" onclick="openCompareSelector('${slot}')">
                <div class="plus-icon">+</div>
                <p>Seleccioná un vehículo para comparar</p>
            </div>
        </div>`;

    const arsText = vehicle.priceARS ? `<span class="compare-price-ars">${formatARS(vehicle.priceARS)}</span>` : '';
    return `
        <div class="compare-column">
            <img src="${vehicle.images[0]}" alt="${vehicle.brand} ${vehicle.model}" class="compare-img">
            <div class="compare-title">${vehicle.brand} ${vehicle.model} ${vehicle.year}</div>
            <div class="compare-price">
                <span class="compare-price-usd">${formatUSD(vehicle.priceUSD)}</span>
                ${arsText}
            </div>
            <div class="compare-actions">
                <button class="btn btn-outline" onclick="openCompareSelector('${slot}')">Cambiar vehículo</button>
                <a href="https://wa.me/${CONFIG.whatsappPhone}?text=${encodeURIComponent(`Hola, me interesa el ${vehicle.brand} ${vehicle.model} ${vehicle.year}. ¿Está disponible?`)}"
                   class="btn" target="_blank">WhatsApp</a>
                <a href="#vehicle?id=${vehicle.id}" class="btn btn-outline">Ver detalle</a>
            </div>
        </div>`;
}

function renderComparisonTable(vA, vB) {
    const rows = [
        ['Tipo de vehículo', vA.vehicleType, vB.vehicleType],
        ['Motor', vA.engine, vB.engine],
        ['Combustible', vA.fuel, vB.fuel],
        ['Transmisión', vA.transmission, vB.transmission],
        ['Tracción', vA.traction, vB.traction],
        ['Kilometraje', vA.km ? vA.km.toLocaleString('es-AR') : '—', vB.km ? vB.km.toLocaleString('es-AR') : '—'],
        ['Año', vA.year, vB.year],
        ['Puertas', vA.doors, vB.doors],
        ['Color', vA.color, vB.color],
        ['Condición', vA.condition, vB.condition],
        ['Precio USD', formatUSD(vA.priceUSD), formatUSD(vB.priceUSD)],
        ['Precio ARS', vA.priceARS ? formatARS(vA.priceARS) : '—', vB.priceARS ? formatARS(vB.priceARS) : '—'],
    ];

    const betterPriceA = vA.priceUSD && vB.priceUSD && vA.priceUSD < vB.priceUSD;
    const betterPriceB = vA.priceUSD && vB.priceUSD && vB.priceUSD < vA.priceUSD;
    const lessKmA = vA.km !== undefined && vB.km !== undefined && vA.km < vB.km;
    const lessKmB = vA.km !== undefined && vB.km !== undefined && vB.km < vA.km;

    return `
        <div class="compare-table-wrap">
            <h3>Comparación detallada</h3>
            <table class="compare-table">
                <thead>
                    <tr><th>Especificación</th><th>${vA.brand} ${vA.model}</th><th>${vB.brand} ${vB.model}</th></tr>
                </thead>
                <tbody>
                    ${rows.map(([label, a, b]) => {
                        const diff = String(a) !== String(b);
                        const badgeA = (label === 'Precio USD' && betterPriceA) || (label === 'Kilometraje' && lessKmA)
                            ? '<span class="badge-green">✓ Mejor</span>' : '';
                        const badgeB = (label === 'Precio USD' && betterPriceB) || (label === 'Kilometraje' && lessKmB)
                            ? '<span class="badge-green">✓ Mejor</span>' : '';
                        return `<tr class="${diff ? 'different' : ''}">
                            <td>${label}${diff ? ' <span class="diff-icon">≠</span>' : ''}</td>
                            <td>${a || '—'} ${badgeA}</td>
                            <td>${b || '—'} ${badgeB}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

function openCompareSelector(slot) {
    const vehicles = (window._compareVehicles || []).filter(v => v.status === 'disponible');
    const otherId = sessionStorage.getItem(slot === 'compare_a' ? 'compare_b' : 'compare_a');
    const available = vehicles.filter(v => v.id !== otherId);

    const panel = document.getElementById('compare-selector-panel');
    if (!panel) return;

    panel.innerHTML = `
        <div class="compare-selection">
            <h3>${slot === 'compare_a' ? 'Elegí el vehículo A' : 'Elegí el vehículo B'}</h3>
            <div class="compare-selection-grid">
                ${available.map(v => `
                    <div class="compare-selection-card" onclick="selectCompareVehicle('${slot}','${v.id}')">
                        <img src="${v.images[0]}" alt="${v.brand} ${v.model}">
                        <h4>${v.brand} ${v.model} ${v.year}</h4>
                        <p>${formatUSD(v.priceUSD)}</p>
                    </div>`).join('')}
            </div>
            <button class="btn btn-outline" onclick="closeCompareSelector()" style="margin-top:1rem">Cancelar</button>
        </div>`;
    panel.scrollIntoView({ behavior: 'smooth' });
}

function selectCompareVehicle(slot, id) {
    sessionStorage.setItem(slot, id);
    renderComparePage();
}

function closeCompareSelector() {
    const panel = document.getElementById('compare-selector-panel');
    if (panel) panel.innerHTML = '';
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────
function renderAdmin(section = 'add') {
    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="admin-wrap">
        <div class="admin-panel">
            <div class="admin-sidebar">
                <div class="admin-sidebar-title">Administración</div>
                <ul>
                    <li><a href="#" class="admin-nav-link ${section==='add'?'active':''}" data-section="add">➕ Agregar Vehículo</a></li>
                    <li><a href="#" class="admin-nav-link ${section==='list'?'active':''}" data-section="list">📋 Lista de Vehículos</a></li>
                    <li><a href="#" class="admin-nav-link ${section==='backup'?'active':''}" data-section="backup">💾 Backup & Restore</a></li>
                    <li><a href="#stats" class="admin-nav-link">📊 Estadísticas</a></li>
                </ul>
            </div>
            <div class="admin-content" id="admin-content"></div>
        </div>
        </div>
    `;

    loadAdminSection(section);
    setupAdminNav();
}

function setupAdminNav() {
    document.querySelectorAll('.admin-nav-link[data-section]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            document.querySelectorAll('.admin-nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            loadAdminSection(link.dataset.section);
        });
    });
}

function loadAdminSection(section) {
    const content = document.getElementById('admin-content');
    if (!content) return;
    switch (section) {
        case 'add':
            content.innerHTML = renderAddVehicleForm(null);
            setupVehicleForm(null);
            break;
        case 'list':
            renderVehicleList();
            break;
        case 'backup':
            content.innerHTML = renderBackupSection();
            break;
    }
}

// ─── FORMULARIO VEHÍCULO ──────────────────────────────────────────────────────
function renderAddVehicleForm(vehicle = null) {
    const isEdit = !!vehicle;
    const v = vehicle || {};

    const opt = (val, label, current) =>
        `<option value="${val}" ${current === val ? 'selected' : ''}>${label}</option>`;

    return `
        <h2>${isEdit ? 'Editar' : 'Agregar'} Vehículo</h2>
        <form id="vehicle-form" autocomplete="off">

            <div class="form-section-title">Información básica</div>
            <div class="form-row">
                <div class="form-group">
                    <label>Marca <span class="required">*</span></label>
                    <input type="text" id="brand" placeholder="Ej: Toyota" value="${v.brand || ''}">
                </div>
                <div class="form-group">
                    <label>Modelo <span class="required">*</span></label>
                    <input type="text" id="model" placeholder="Ej: Corolla" value="${v.model || ''}">
                </div>
                <div class="form-group">
                    <label>Año <span class="required">*</span></label>
                    <input type="number" id="year" placeholder="Ej: 2021" value="${v.year || ''}">
                </div>
            </div>

            <div class="form-section-title">Precio</div>
            <div class="form-row">
                <div class="form-group">
                    <label>Precio USD <span class="required">*</span></label>
                    <input type="number" id="priceUSD" placeholder="Ej: 15000" value="${v.priceUSD || ''}">
                </div>
                <div class="form-group">
                    <label>Precio ARS <span class="optional">(opcional)</span></label>
                    <input type="number" id="priceARS" placeholder="Ej: 15000000" value="${v.priceARS || ''}">
                </div>
                <div class="form-group">
                    <label>Costo de compra USD <span class="optional">(solo vos lo ves)</span></label>
                    <input type="number" id="costoARS" placeholder="Ej: 12000" value="${v.costoARS || ''}">
                </div>
            </div>

            <div class="form-section-title">Especificaciones <span class="optional">(todas opcionales)</span></div>
            <div class="form-row">
                <div class="form-group">
                    <label>Kilómetros</label>
                    <input type="number" id="km" placeholder="Ej: 45000" value="${v.km || ''}">
                </div>
                <div class="form-group">
                    <label>Combustible</label>
                    <select id="fuel">
                        <option value="">Seleccionar</option>
                        ${['Nafta','Diesel','Eléctrico','Híbrido','GNC'].map(f => opt(f,f,v.fuel)).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Transmisión</label>
                    <select id="transmission">
                        <option value="">Seleccionar</option>
                        ${['Manual','Automático','CVT'].map(f => opt(f,f,v.transmission)).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tracción</label>
                    <select id="traction">
                        <option value="">Seleccionar</option>
                        ${['Delantera','Trasera','4x4','AWD'].map(f => opt(f,f,v.traction)).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Tipo de vehículo</label>
                    <select id="vehicleType">
                        <option value="">Seleccionar</option>
                        ${['Sedán','Hatchback','SUV','Pickup','Coupé','Familiar','Van','Convertible'].map(f => opt(f,f,v.vehicleType)).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Motor / Cilindrada</label>
                    <select id="engine">
                        <option value="">Seleccionar</option>
                        ${['1.0','1.4','1.6','1.8','2.0','2.4','2.5','3.0','3.5','4.0','Otro'].map(f => opt(f,f,v.engine)).join('')}
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Color</label>
                    <input type="text" id="color" placeholder="Ej: Blanco" value="${v.color || ''}">
                </div>
                <div class="form-group">
                    <label>Puertas</label>
                    <select id="doors">
                        <option value="">Seleccionar</option>
                        ${['2','3','4','5'].map(f => opt(f,f, v.doors ? String(v.doors) : '')).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Condición</label>
                    <select id="condition">
                        <option value="">Seleccionar</option>
                        ${['Nuevo','Usado'].map(f => opt(f,f,v.condition)).join('')}
                    </select>
                </div>
            </div>

            <div class="form-section-title">Fotos <span class="required">*</span></div>
            <div class="form-group">
                <label>Fotos del vehículo (podés subir varias)</label>
                <input type="file" id="images" multiple accept="image/*">
                <p class="field-hint">La primera foto es la portada. Para seleccionar varias, usá Ctrl (o Cmd en Mac).</p>
                <div class="image-preview" id="image-preview"></div>
            </div>

            <div class="form-section-title">Descripción <span class="optional">(opcional)</span></div>
            <div class="form-group">
                <textarea id="description" placeholder="Detalles adicionales del vehículo...">${v.description || ''}</textarea>
            </div>

            <div id="form-error" class="form-error" style="display:none"></div>
            <button type="button" id="btn-save-vehicle" class="btn btn-large">
                ${isEdit ? '✅ Actualizar Vehículo' : '✅ Guardar Vehículo'}
            </button>
        </form>
    `;
}

function setupVehicleForm(vehicleToEdit = null) {
    const imageInput = document.getElementById('images');
    let currentImages = vehicleToEdit ? [...vehicleToEdit.images] : [];

    updateImagePreview();

    imageInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const preview = document.getElementById('image-preview');
        if (preview) preview.innerHTML = `<p class="field-hint">⏳ Procesando ${files.length} imagen(es), por favor espera...</p>`;

        const results = await Promise.allSettled(files.map(f => compressImage(f, 1200, 0.75)));
        results.forEach((r, i) => {
            if (r.status === 'fulfilled') currentImages.push(r.value);
            else console.error(`Error procesando imagen ${i+1}:`, r.reason);
        });

        imageInput.value = '';
        updateImagePreview();
    });

    function updateImagePreview() {
        const preview = document.getElementById('image-preview');
        if (!preview) return;
        if (currentImages.length === 0) {
            preview.innerHTML = '<p class="field-hint">Aún no hay imágenes cargadas.</p>';
            return;
        }
        preview.innerHTML = currentImages.map((img, i) => `
            <div class="image-item">
                ${i === 0 ? '<div class="cover-badge">Portada</div>' : ''}
                <img src="${img}" alt="Imagen ${i+1}">
                <button type="button" class="remove-image" data-index="${i}">✕</button>
            </div>`).join('');

        preview.querySelectorAll('.remove-image').forEach(btn => {
            btn.addEventListener('click', () => {
                currentImages.splice(parseInt(btn.dataset.index), 1);
                updateImagePreview();
            });
        });
    }

    const btnSave = document.getElementById('btn-save-vehicle');
    const errorDiv = document.getElementById('form-error');

    btnSave.addEventListener('click', async () => {
        errorDiv.style.display = 'none';

        const brand = document.getElementById('brand').value.trim();
        const model = document.getElementById('model').value.trim();
        const year = document.getElementById('year').value.trim();
        const priceUSD = document.getElementById('priceUSD').value.trim();

        const errors = [];
        if (!brand) errors.push('Marca es obligatorio');
        if (!model) errors.push('Modelo es obligatorio');
        if (!year) errors.push('Año es obligatorio');
        if (!priceUSD) errors.push('Precio USD es obligatorio');
        if (currentImages.length === 0) errors.push('Agregá al menos una foto');

        if (errors.length > 0) {
            errorDiv.innerHTML = '⚠️ ' + errors.join(' · ');
            errorDiv.style.display = 'block';
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        btnSave.disabled = true;
        btnSave.textContent = '⏳ Guardando...';

        const formData = {
            brand, model,
            year: parseInt(year),
            priceUSD: parseFloat(priceUSD),
            images: currentImages
        };

        const optFields = {
            km: 'int', priceARS: 'int', costoARS: 'int', doors: 'int',
            fuel: 'str', transmission: 'str', traction: 'str',
            vehicleType: 'str', color: 'str', engine: 'str',
            condition: 'str', description: 'str'
        };
        Object.entries(optFields).forEach(([fieldId, type]) => {
            const el = document.getElementById(fieldId);
            if (el && el.value && el.value.trim() !== '') {
                formData[fieldId] = type === 'int' ? parseInt(el.value) : el.value.trim();
            }
        });

        if (vehicleToEdit) {
            formData.id = vehicleToEdit.id;
            formData.status = vehicleToEdit.status;
            formData.addedAt = vehicleToEdit.addedAt;
            formData.soldAt = vehicleToEdit.soldAt;
        } else {
            formData.status = 'disponible';
            formData.soldAt = null;
        }

        const ok = await saveVehicle(formData);
        btnSave.disabled = false;
        btnSave.textContent = vehicleToEdit ? '✅ Actualizar Vehículo' : '✅ Guardar Vehículo';

        if (ok) {
            showToast(vehicleToEdit ? '✅ Vehículo actualizado' : '✅ Vehículo guardado');
            if (vehicleToEdit) {
                renderAdmin('list');
            } else {
                document.getElementById('vehicle-form').reset();
                currentImages = [];
                updateImagePreview();
                errorDiv.style.display = 'none';
            }
        } else {
            errorDiv.innerHTML = '❌ Error al guardar. Revisá tu conexión.';
            errorDiv.style.display = 'block';
        }
    });
}

// ─── LISTA DE VEHÍCULOS ───────────────────────────────────────────────────────
async function renderVehicleList() {
    const content = document.getElementById('admin-content');
    showLoading(content, 'Cargando lista...');
    const vehicles = await getVehicles();

    const statusLabel = { disponible: '🟢 Disponible', vendido: '🔴 Vendido', oculto: '⚫ Oculto' };
    const eyeIcon = v => v.status === 'oculto'
        ? `<button class="action-btn" title="Mostrar" onclick="toggleHidden('${v.id}')">👁️</button>`
        : `<button class="action-btn" title="Ocultar" onclick="toggleHidden('${v.id}')">🙈</button>`;

    content.innerHTML = `
        <h2>Lista de Vehículos (${vehicles.length})</h2>
        <div style="overflow-x:auto">
        <table class="vehicle-table">
            <thead>
                <tr>
                    <th>Foto</th><th>Vehículo</th><th>Año</th>
                    <th>Precio USD</th><th>Estado</th><th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                ${vehicles.map(v => `
                    <tr class="${v.status === 'oculto' ? 'row-hidden' : ''}">
                        <td><img src="${v.images[0]}" alt="${v.brand}" style="width:60px;height:45px;object-fit:cover;border-radius:4px"></td>
                        <td>${v.brand} ${v.model}</td>
                        <td>${v.year}</td>
                        <td>${formatUSD(v.priceUSD)}</td>
                        <td>${statusLabel[v.status] || v.status}</td>
                        <td class="actions-column">
                            <button class="action-btn" title="Editar" onclick="editVehicle('${v.id}')">✏️</button>
                            <button class="action-btn" title="${v.status === 'disponible' ? 'Marcar vendido' : 'Marcar disponible'}"
                                onclick="toggleSold('${v.id}')">${v.status === 'disponible' ? '💰' : '↩️'}</button>
                            ${eyeIcon(v)}
                            <button class="action-btn" title="Eliminar" onclick="deleteVehicle('${v.id}')">🗑️</button>
                        </td>
                    </tr>`).join('')}
            </tbody>
        </table>
        </div>`;
}

async function editVehicle(id) {
    const vehicles = await getVehicles();
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;
    const content = document.getElementById('admin-content');
    content.innerHTML = renderAddVehicleForm(vehicle);
    setupVehicleForm(vehicle);
    content.scrollIntoView({ behavior: 'smooth' });
}

async function toggleSold(id) {
    const vehicles = await getVehicles();
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    if (v.status === 'disponible') {
        await updateVehicleStatus(id, 'vendido', new Date().toISOString());
        showToast('Vehículo marcado como vendido');
    } else {
        await updateVehicleStatus(id, 'disponible', null);
        showToast('Vehículo marcado como disponible');
    }
    renderVehicleList();
}

async function toggleHidden(id) {
    const vehicles = await getVehicles();
    const v = vehicles.find(x => x.id === id);
    if (!v) return;
    if (v.status === 'oculto') {
        await updateVehicleStatus(id, 'disponible');
        showToast('👁️ Vehículo visible en el catálogo');
    } else {
        await updateVehicleStatus(id, 'oculto');
        showToast('🙈 Vehículo ocultado del catálogo');
    }
    renderVehicleList();
}

async function deleteVehicle(id) {
    if (!confirm('¿Eliminar este vehículo? Esta acción no se puede deshacer.')) return;
    const ok = await deleteVehicleDB(id);
    if (ok) {
        showToast('🗑️ Vehículo eliminado');
        renderVehicleList();
    } else {
        showToast('❌ Error al eliminar', 'error');
    }
}

// ─── BACKUP ───────────────────────────────────────────────────────────────────
function renderBackupSection() {
    return `
        <h2>Backup & Restore</h2>
        <div class="backup-section">
            <div class="backup-block">
                <h3>📤 Exportar datos</h3>
                <p>Descargá un archivo JSON con todos tus vehículos e imágenes como backup.</p>
                <button class="btn" onclick="exportData()">Exportar datos (JSON)</button>
            </div>
            <div class="backup-block">
                <h3>📥 Importar datos</h3>
                <p>Seleccioná un archivo JSON exportado anteriormente.
                   <strong>Esto agrega los vehículos del archivo a los existentes.</strong></p>
                <input type="file" id="import-file" accept=".json" style="margin-bottom:1rem">
                <button class="btn" onclick="importData()">Importar datos (JSON)</button>
            </div>
        </div>`;
}

async function exportData() {
    const vehicles = await getVehicles();
    const data = { vehicles, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mdz_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✅ Datos exportados correctamente');
}

async function importData() {
    const file = document.getElementById('import-file').files[0];
    if (!file) { alert('Seleccioná un archivo primero'); return; }
    const reader = new FileReader();
    reader.onload = async e => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.vehicles && Array.isArray(data.vehicles)) {
                showToast('⏳ Importando vehículos...');
                for (const v of data.vehicles) {
                    delete v.id;
                    await saveVehicle(v);
                }
                showToast(`✅ ${data.vehicles.length} vehículos importados correctamente`);
            } else {
                alert('Archivo inválido: no contiene vehículos.');
            }
        } catch { alert('Error al leer el archivo. Verificá que sea un JSON válido.'); }
    };
    reader.readAsText(file);
}

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────
async function renderStats() {
    const main = document.getElementById('main');
    main.innerHTML = `
        <div class="stats-page">
            <div class="stats-header">
                <div class="stats-header-top">
                    <div>
                        <h1 class="stats-title">Panel de Estadísticas</h1>
                        <p class="stats-subtitle">Seguimiento en tiempo real de tu negocio</p>
                    </div>
                    <a href="#admin" class="btn btn-outline" style="align-self:center">← Volver al Admin</a>
                </div>
                <div class="gold-divider"></div>
                <div class="stats-controls">
                    <div class="stats-period-bar">
                        <span class="period-label">Período:</span>
                        <div class="period-btns">
                            <button class="period-btn active" data-months="1">Este mes</button>
                            <button class="period-btn" data-months="3">3 meses</button>
                            <button class="period-btn" data-months="6">6 meses</button>
                            <button class="period-btn" data-months="12">Este año</button>
                            <button class="period-btn" data-months="0">Histórico</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="stats-tabs">
                <button class="stats-tab active" data-tab="resumen"><span class="tab-icon">📊</span><span>Resumen</span></button>
                <button class="stats-tab" data-tab="rentabilidad"><span class="tab-icon">💰</span><span>Rentabilidad</span></button>
                <button class="stats-tab" data-tab="stock"><span class="tab-icon">🚗</span><span>Stock</span></button>
                <button class="stats-tab" data-tab="interes"><span class="tab-icon">👁️</span><span>Interés</span></button>
            </div>
            <div id="stats-content" class="stats-content-area">
                <div style="text-align:center;padding:3rem;color:var(--text-faint);">⏳ Cargando estadísticas...</div>
            </div>
        </div>`;

    const allVehicles = await getVehicles();
    let currentMonths = 1;
    let currentTab = 'resumen';

    function renderTab() {
        const now = new Date();
        const filtered = currentMonths === 0 ? allVehicles : allVehicles.filter(v => {
            const d = new Date(v.addedAt);
            return (now - d) / (1000 * 60 * 60 * 24 * 30) <= currentMonths;
        });
        const content = document.getElementById('stats-content');
        if (!content) return;

        switch (currentTab) {
            case 'resumen':
                content.innerHTML = renderStatsResumen(allVehicles, filtered, currentMonths);
                renderResumenCharts(filtered);
                break;
            case 'rentabilidad':
                content.innerHTML = renderStatsRentabilidad(allVehicles, filtered);
                break;
            case 'stock':
                content.innerHTML = renderStatsStock(allVehicles);
                setTimeout(() => renderStockCharts(allVehicles), 50);
                break;
            case 'interes':
                content.innerHTML = renderStatsInteres(allVehicles);
                renderInteresCharts(allVehicles);
                break;
        }
    }

    document.querySelectorAll('.stats-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderTab();
        });
    });

    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMonths = parseInt(btn.dataset.months);
            renderTab();
        });
    });

    renderTab();
}

function renderStatsResumen(allVehicles, filtered, months) {
    const available = allVehicles.filter(v => v.status === 'disponible');
    const sold = allVehicles.filter(v => v.status === 'vendido');
    const soldFiltered = filtered.filter(v => v.status === 'vendido');

    const avgDays = sold.filter(v => v.soldAt).length
        ? Math.round(sold.filter(v => v.soldAt).reduce((sum, v) =>
            sum + (new Date(v.soldAt) - new Date(v.addedAt)) / 86400000, 0)
          / sold.filter(v => v.soldAt).length)
        : null;

    const totalValueUSD = available.reduce((s, v) => s + (v.priceUSD || 0), 0);
    const lastSales = allVehicles.filter(v => v.status === 'vendido' && v.soldAt)
        .sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt)).slice(0, 10);

    return `
        <div class="stats-section-intro"><p>Visión general del negocio en el período seleccionado.</p></div>
        <div class="stats-kpi-grid">
            <div class="kpi-card kpi-gold"><div class="kpi-icon-wrap">🚗</div><div class="kpi-value">${available.length}</div><div class="kpi-label">Vehículos en stock</div><div class="kpi-sub">disponibles ahora</div></div>
            <div class="kpi-card kpi-green"><div class="kpi-icon-wrap">✅</div><div class="kpi-value">${soldFiltered.length}</div><div class="kpi-label">Vendidos</div><div class="kpi-sub">en el período</div></div>
            <div class="kpi-card"><div class="kpi-icon-wrap">⏱️</div><div class="kpi-value">${avgDays !== null ? avgDays + ' d' : '—'}</div><div class="kpi-label">Tiempo promedio de venta</div></div>
            <div class="kpi-card kpi-blue"><div class="kpi-icon-wrap">💵</div><div class="kpi-value kpi-value-sm">${formatUSD(totalValueUSD)}</div><div class="kpi-label">Valor del inventario</div></div>
        </div>
        <div class="charts-row">
            <div class="chart-box">
                <div class="chart-box-header"><h3>Actividad mensual</h3><span class="chart-legend-hint">Últimos 12 meses</span></div>
                <canvas id="chart-activity" height="140"></canvas>
            </div>
            <div class="chart-box">
                <div class="chart-box-header"><h3>Estado del stock</h3></div>
                <canvas id="chart-status" height="140"></canvas>
            </div>
        </div>
        <div class="stats-table-section">
            <div class="stats-table-header"><h3>Últimas ventas</h3><span class="badge-count">${lastSales.length} registros</span></div>
            <div style="overflow-x:auto">
            <table class="vehicle-table">
                <thead><tr><th>Vehículo</th><th>Fecha de venta</th><th>Precio USD</th><th>Días en stock</th></tr></thead>
                <tbody>
                    ${lastSales.map(v => {
                        const dias = Math.round((new Date(v.soldAt) - new Date(v.addedAt)) / 86400000);
                        return `<tr>
                            <td><strong>${v.brand} ${v.model}</strong> <span style="color:var(--text-muted)">${v.year}</span></td>
                            <td>${new Date(v.soldAt).toLocaleDateString('es-AR')}</td>
                            <td><strong style="color:var(--gold-1)">${formatUSD(v.priceUSD)}</strong></td>
                            <td>${dias <= 15 ? `<span class="badge-green">⚡ ${dias} días</span>` : `${dias} días`}</td>
                        </tr>`;
                    }).join('') || '<tr><td colspan="4" class="table-empty">Sin ventas registradas aún</td></tr>'}
                </tbody>
            </table>
            </div>
        </div>`;
}

function renderResumenCharts(vehicles) {
    setTimeout(() => {
        const monthsData = getLast12MonthsData(vehicles);
        const actCtx = document.getElementById('chart-activity');
        if (actCtx) {
            new Chart(actCtx, {
                type: 'bar',
                data: {
                    labels: monthsData.labels,
                    datasets: [
                        { label: 'Ingresados', data: monthsData.added, backgroundColor: 'rgba(201,168,76,0.7)', borderColor: '#c9a84c', borderWidth: 1 },
                        { label: 'Vendidos', data: monthsData.sold, backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1 }
                    ]
                },
                options: chartOptions()
            });
        }
        const available = vehicles.filter(v => v.status === 'disponible').length;
        const sold = vehicles.filter(v => v.status === 'vendido').length;
        const hidden = vehicles.filter(v => v.status === 'oculto').length;
        const stCtx = document.getElementById('chart-status');
        if (stCtx) {
            new Chart(stCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Disponibles', 'Vendidos', 'Ocultos'],
                    datasets: [{ data: [available, sold, hidden], backgroundColor: ['rgba(201,168,76,0.8)', 'rgba(100,200,100,0.7)', 'rgba(80,80,80,0.7)'], borderColor: ['#c9a84c', '#64c864', '#505050'], borderWidth: 2 }]
                },
                options: { ...chartOptions(), cutout: '65%' }
            });
        }
    }, 50);
}

function renderStatsRentabilidad(allVehicles, filtered) {
    const sold = allVehicles.filter(v => v.status === 'vendido');
    const available = allVehicles.filter(v => v.status === 'disponible');
    const withCost = sold.filter(v => v.costoARS);
    const totalRevenue = sold.reduce((s, v) => s + (v.priceUSD || 0), 0);
    const totalProfit = withCost.reduce((s, v) => s + ((v.priceUSD || 0) - (v.costoARS || 0)), 0);
    const avgMargin = withCost.length
        ? Math.round(withCost.reduce((s, v) => s + (((v.priceUSD - v.costoARS) / v.costoARS) * 100), 0) / withCost.length)
        : null;
    const investUSD = available.reduce((s, v) => s + (v.priceUSD || 0), 0);
    const ticketAvg = sold.length ? Math.round(totalRevenue / sold.length) : 0;

    return `
        <div class="stats-kpi-grid">
            <div class="kpi-card"><div class="kpi-icon-wrap">📥</div><div class="kpi-value">${formatUSD(investUSD)}</div><div class="kpi-label">Inversión en stock actual</div></div>
            <div class="kpi-card"><div class="kpi-icon-wrap">📈</div><div class="kpi-value">${formatUSD(totalRevenue)}</div><div class="kpi-label">Facturación histórica</div></div>
            <div class="kpi-card"><div class="kpi-icon-wrap">💸</div><div class="kpi-value">${withCost.length ? formatUSD(totalProfit) : '—'}</div><div class="kpi-label">Ganancia bruta estimada</div></div>
            <div class="kpi-card"><div class="kpi-icon-wrap">%</div><div class="kpi-value">${avgMargin !== null ? avgMargin + '%' : '—'}</div><div class="kpi-label">Margen promedio</div></div>
            <div class="kpi-card"><div class="kpi-icon-wrap">🎫</div><div class="kpi-value">${formatUSD(ticketAvg)}</div><div class="kpi-label">Ticket promedio</div></div>
        </div>
        ${withCost.length === 0 ? `<div class="stats-info-box">💡 Para ver la rentabilidad, cargá el <strong>Costo de compra USD</strong> al registrar cada vehículo.</div>` : ''}
        <div class="chart-box" style="margin-top:2rem">
            <h3>Detalle por vehículo vendido</h3>
            <div style="overflow-x:auto">
            <table class="vehicle-table">
                <thead><tr><th>Vehículo</th><th>Precio venta</th><th>Costo</th><th>Ganancia</th><th>Margen</th><th>Días en stock</th></tr></thead>
                <tbody>
                    ${sold.sort((a,b) => new Date(b.soldAt||0) - new Date(a.soldAt||0)).map(v => {
                        const ganancia = v.costoARS ? (v.priceUSD - v.costoARS) : null;
                        const margen = v.costoARS ? Math.round((ganancia / v.costoARS) * 100) : null;
                        const dias = v.soldAt ? Math.round((new Date(v.soldAt) - new Date(v.addedAt)) / 86400000) : '—';
                        return `<tr>
                            <td>${v.brand} ${v.model} ${v.year}</td>
                            <td>${formatUSD(v.priceUSD)}</td>
                            <td>${v.costoARS ? formatUSD(v.costoARS) : '—'}</td>
                            <td>${ganancia !== null ? formatUSD(ganancia) : '—'}</td>
                            <td>${margen !== null ? `<span class="${margen >= 0 ? 'badge-green' : 'badge-red'}">${margen}%</span>` : '—'}</td>
                            <td>${dias}</td>
                        </tr>`;
                    }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Sin ventas registradas</td></tr>'}
                </tbody>
            </table>
            </div>
        </div>`;
}

function renderStatsStock(allVehicles) {
    const available = allVehicles.filter(v => v.status === 'disponible');
    const now = new Date();
    function daysInStock(v) { return Math.floor((now - new Date(v.addedAt)) / 86400000); }
    function alertBadge(days) {
        if (days >= 60) return '<span class="badge-red">⚠️ Revisar precio</span>';
        if (days >= 30) return '<span class="badge-yellow">⏳ Atención</span>';
        return '<span class="badge-green">✓ Reciente</span>';
    }
    const sorted = [...available].sort((a, b) => daysInStock(b) - daysInStock(a));

    return `
        <div class="stats-kpi-grid">
            <div class="kpi-card"><div class="kpi-icon-wrap">🟢</div><div class="kpi-value">${available.filter(v=>daysInStock(v)<30).length}</div><div class="kpi-label">Menos de 30 días</div></div>
            <div class="kpi-card"><div class="kpi-icon-wrap">🟡</div><div class="kpi-value">${available.filter(v=>daysInStock(v)>=30&&daysInStock(v)<60).length}</div><div class="kpi-label">Entre 30 y 60 días</div></div>
            <div class="kpi-card"><div class="kpi-icon-wrap">🔴</div><div class="kpi-value">${available.filter(v=>daysInStock(v)>=60).length}</div><div class="kpi-label">Más de 60 días</div></div>
        </div>
        <div class="chart-box">
            <h3>Stock activo — antigüedad</h3>
            <div style="overflow-x:auto">
            <table class="vehicle-table">
                <thead><tr><th>Foto</th><th>Vehículo</th><th>Precio USD</th><th>Días en stock</th><th>Estado</th></tr></thead>
                <tbody>
                    ${sorted.map(v => `<tr>
                        <td><img src="${v.images[0]}" style="width:50px;height:38px;object-fit:cover;border-radius:4px"></td>
                        <td>${v.brand} ${v.model} ${v.year}</td>
                        <td>${formatUSD(v.priceUSD)}</td>
                        <td>${daysInStock(v)}</td>
                        <td>${alertBadge(daysInStock(v))}</td>
                    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Sin vehículos en stock</td></tr>'}
                </tbody>
            </table>
            </div>
        </div>
        <div class="charts-row" style="margin-top:2rem">
            <div class="chart-box"><h3>Por tipo de vehículo</h3><canvas id="chart-type" height="160"></canvas></div>
            <div class="chart-box"><h3>Por combustible</h3><canvas id="chart-fuel" height="160"></canvas></div>
        </div>`;
}

function renderStockCharts(allVehicles) {
    const available = allVehicles.filter(v => v.status === 'disponible');
    const byType = {};
    const byFuel = {};
    available.forEach(v => {
        const t = v.vehicleType || 'Sin tipo';
        byType[t] = (byType[t] || 0) + 1;
        const f = v.fuel || 'N/D';
        byFuel[f] = (byFuel[f] || 0) + 1;
    });
    const colors = ['rgba(201,168,76,0.8)','rgba(240,208,96,0.7)','rgba(138,106,26,0.8)','rgba(255,255,255,0.2)','rgba(100,180,100,0.6)','rgba(180,100,100,0.6)'];
    const tCtx = document.getElementById('chart-type');
    if (tCtx) new Chart(tCtx, { type: 'bar', data: { labels: Object.keys(byType), datasets: [{ data: Object.values(byType), backgroundColor: 'rgba(201,168,76,0.8)', borderColor: '#c9a84c', borderWidth: 1 }] }, options: chartOptions() });
    const fCtx = document.getElementById('chart-fuel');
    if (fCtx) new Chart(fCtx, { type: 'doughnut', data: { labels: Object.keys(byFuel), datasets: [{ data: Object.values(byFuel), backgroundColor: colors, borderColor: '#1a1a1a', borderWidth: 2 }] }, options: { ...chartOptions(), cutout: '55%' } });
}

async function renderStatsInteres(allVehicles) {
    const viewPromises = allVehicles.map(async v => ({
        ...v,
        views: parseInt(await getSetting(`views_${v.id}`) || '0')
    }));
    const withViews = (await Promise.all(viewPromises)).sort((a, b) => b.views - a.views);

    const content = document.getElementById('stats-content');
    if (!content) return;

    content.innerHTML = `
        <div class="chart-box">
            <h3>🔥 Top 10 vehículos más vistos</h3>
            <table class="vehicle-table">
                <thead><tr><th>Foto</th><th>Vehículo</th><th>Vistas</th><th>Precio USD</th><th>Estado</th></tr></thead>
                <tbody>
                    ${withViews.slice(0, 10).map(v => `<tr>
                        <td><img src="${v.images[0]}" style="width:50px;height:38px;object-fit:cover;border-radius:4px"></td>
                        <td>${v.brand} ${v.model} ${v.year}</td>
                        <td><strong style="color:var(--gold-1)">${v.views}</strong></td>
                        <td>${formatUSD(v.priceUSD)}</td>
                        <td>${v.status}</td>
                    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Sin vistas registradas aún</td></tr>'}
                </tbody>
            </table>
        </div>
        <div class="charts-row" style="margin-top:2rem">
            <div class="chart-box"><h3>Interés por tipo de vehículo</h3><canvas id="chart-interest" height="160"></canvas></div>
        </div>`;

    renderInteresCharts(withViews);
}

function renderInteresCharts(vehicles) {
    setTimeout(() => {
        const byType = {};
        vehicles.forEach(v => {
            const t = v.vehicleType || 'Sin tipo';
            byType[t] = (byType[t] || 0) + (v.views || 0);
        });
        const ctx = document.getElementById('chart-interest');
        if (ctx) {
            new Chart(ctx, {
                type: 'bar',
                data: { labels: Object.keys(byType), datasets: [{ label: 'Vistas', data: Object.values(byType), backgroundColor: 'rgba(201,168,76,0.7)', borderColor: '#c9a84c', borderWidth: 1 }] },
                options: { ...chartOptions(), indexAxis: 'y' }
            });
        }
    }, 50);
}

function getLast12MonthsData(vehicles) {
    const now = new Date();
    const labels = [], added = [], sold = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        labels.push(key);
        added.push(vehicles.filter(v => v.addedAt && v.addedAt.startsWith(key)).length);
        sold.push(vehicles.filter(v => v.soldAt && v.soldAt.startsWith(key)).length);
    }
    return { labels, added, sold };
}

function chartOptions() {
    return {
        responsive: true,
        plugins: { legend: { labels: { color: '#ffffff', font: { size: 12 } } } },
        scales: {
            x: { ticks: { color: '#aaaaaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#aaaaaa' }, grid: { color: 'rgba(255,255,255,0.05)' }, beginAtZero: true }
        }
    };
}

// ─── PDF ──────────────────────────────────────────────────────────────────────
async function generatePDF(vehicleId) {
    const vehicles = await getVehicles();
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22);
    doc.setTextColor(201, 168, 76);
    doc.text(CONFIG.dealershipName, 105, 18, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(180, 180, 180);
    doc.text(CONFIG.tagline, 105, 28, { align: 'center' });
    doc.setFontSize(16);
    doc.setTextColor(50, 50, 50);
    doc.text(`${vehicle.brand} ${vehicle.model} ${vehicle.year}`, 20, 55);

    const rows = [
        ['Marca', vehicle.brand], ['Modelo', vehicle.model], ['Año', vehicle.year],
        vehicle.km !== undefined ? ['Kilómetros', vehicle.km.toLocaleString('es-AR')] : null,
        vehicle.fuel ? ['Combustible', vehicle.fuel] : null,
        vehicle.transmission ? ['Transmisión', vehicle.transmission] : null,
        vehicle.color ? ['Color', vehicle.color] : null,
        vehicle.doors ? ['Puertas', vehicle.doors] : null,
        vehicle.engine ? ['Motor', vehicle.engine] : null,
        vehicle.condition ? ['Condición', vehicle.condition] : null,
        ['Precio USD', formatUSD(vehicle.priceUSD)],
        vehicle.priceARS ? ['Precio ARS', formatARS(vehicle.priceARS)] : null,
    ].filter(Boolean);

    doc.autoTable({ startY: 62, head: [['Especificación', 'Valor']], body: rows, theme: 'grid', headStyles: { fillColor: [201, 168, 76], textColor: [0, 0, 0], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [245, 245, 245] } });

    if (vehicle.description) {
        const y = doc.lastAutoTable.finalY + 12;
        doc.setFontSize(12); doc.setTextColor(201, 168, 76);
        doc.text('Descripción', 20, y);
        doc.setFontSize(10); doc.setTextColor(50, 50, 50);
        doc.text(doc.splitTextToSize(vehicle.description, 170), 20, y + 8);
    }

    const ph = doc.internal.pageSize.height;
    doc.setFillColor(10, 10, 10);
    doc.rect(0, ph - 18, 210, 18, 'F');
    doc.setFontSize(8); doc.setTextColor(201, 168, 76);
    doc.text(`${CONFIG.dealershipName} • WhatsApp: ${CONFIG.whatsappPhone}`, 105, ph - 7, { align: 'center' });
    doc.save(`${vehicle.brand}_${vehicle.model}_${vehicle.year}.pdf`);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('keydown', async (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        const authenticated = await promptAdminPassword();
        if (authenticated) navigateTo('admin');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    handleRouteChange();
});

window.addEventListener('hashchange', handleRouteChange);