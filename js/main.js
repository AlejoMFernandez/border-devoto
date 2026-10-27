// BORDER · demo. De día se escribe, de noche se prende.
import { initKit } from '../kit/kit.js?v=18';
import { toast, copiar } from '../kit/core/ui.js?v=18';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IG_DM = 'https://ig.me/m/borderdevoto';
const TZ = 'America/Argentina/Buenos_Aires';

/* ---------- bloqueo de scroll que funciona en iPhone ---------- */
let locks = 0, lockY = 0;
function lock() {
  if (locks++ > 0) return;
  lockY = window.scrollY;
  Object.assign(document.body.style, { position: 'fixed', top: `-${lockY}px`, left: '0', right: '0', width: '100%' });
}
function unlock() {
  if (locks === 0 || --locks > 0) return;
  Object.assign(document.body.style, { position: '', top: '', left: '', right: '', width: '' });
  html.style.scrollBehavior = 'auto'; window.scrollTo(0, lockY); html.style.scrollBehavior = '';
}
let kitLocked = false;
new MutationObserver(() => {
  const on = html.classList.contains('kit-lock');
  if (on && !kitLocked) { kitLocked = true; lock(); } else if (!on && kitLocked) { kitLocked = false; unlock(); }
}).observe(html, { attributes: true, attributeFilter: ['class'] });

/* ---------- intro ---------- */
const hero = $('.hero'), barra = $('#barra');
let entro = false;
function entrar() {
  if (entro) return; entro = true;
  html.classList.remove('con-intro');
  requestAnimationFrame(() => { hero.classList.add('adentro'); barra.classList.add('adentro'); });
}
if (html.classList.contains('con-intro')) {
  const intro = $('.intro');
  intro.addEventListener('animationend', (e) => { if (e.animationName === 'intro-fuera' || e.animationName === 'intro-seguro') entrar(); });
  // la intro espera la foto del hero y las fuentes, pero nunca más de ~2,6 s
  const heroImg = $('.hero__foto img');
  const listo = Promise.all([
    heroImg.complete ? 0 : new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }),
    document.fonts ? document.fonts.ready : 0,
  ]);
  // el cartel se prende recién con la fuente cargada; desde ahí dura lo que tiene que durar
  const minimo = innerWidth < 900 ? 1350 : 1750;
  (window.__fuente || Promise.resolve()).then(() => {
    const t0 = performance.now();
    Promise.race([listo, new Promise(r => setTimeout(r, 2600))]).then(() => {
      const falta = Math.max(0, minimo - (performance.now() - t0));
      setTimeout(() => html.classList.add('intro-lista'), falta);
    });
  });
  setTimeout(entrar, 5200);
} else entrar();

/* ---------- barra y menú ---------- */
const onScroll = () => {
  barra.classList.toggle('con-fondo', window.scrollY > 40 || html.classList.contains('menu-abierto'));
  html.classList.toggle('paso-hero', window.scrollY > hero.offsetHeight * 0.6);
};
let ticking = false;
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { onScroll(); ticking = false; }); } }, { passive: true });
onScroll();

const menu = $('#menu'), btnMenu = $('#abrirMenu');
function abrirMenu(abrir) {
  if (abrir === btnMenu.getAttribute('aria-expanded').includes('true')) return;
  btnMenu.setAttribute('aria-expanded', String(abrir));
  btnMenu.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
  html.classList.toggle('menu-abierto', abrir);
  if (abrir) { menu.hidden = false; lock(); requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('abierto'))); setTimeout(() => $('a', menu).focus({ preventScroll: true }), 80); }
  else { menu.classList.remove('abierto'); menu.hidden = true; unlock(); }
  onScroll();
}
btnMenu.addEventListener('click', () => abrirMenu(btnMenu.getAttribute('aria-expanded') !== 'true'));
menu.addEventListener('click', (e) => {
  const a = e.target.closest('a'); if (!a) return;
  const destino = a.getAttribute('href');
  abrirMenu(false);
  if (destino && destino.startsWith('#') && !a.hasAttribute('data-kit-open')) { e.preventDefault(); $(destino)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && html.classList.contains('menu-abierto')) { abrirMenu(false); btnMenu.focus(); } });

/* ---------- momento día / noche ---------- */
const momentoBtn = $('#momento');
let modoElegido = false; // si la persona eligió carta a mano, el interruptor no se la cambia
function setMomento(m) {
  html.dataset.momento = m;
  momentoBtn.setAttribute('aria-label', m === 'noche' ? 'Border de noche. Cambiar a día' : 'Border de día. Cambiar a noche');
  if (!modoElegido) carta.modo(m === 'noche' ? 'n' : 'd', false);
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = '#141514';
}
momentoBtn.addEventListener('click', () => {
  const m = html.dataset.momento === 'noche' ? 'dia' : 'noche';
  html.classList.add('cambia'); setTimeout(() => html.classList.remove('cambia'), 500);
  setMomento(m);
});

/* ---------- estado abierto / cerrado ---------- */
const DIAS = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
function ahora() {
  const p = {};
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dow, min: Number(p.hour) % 24 * 60 + Number(p.minute) };
}
const aMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + (m || 0); };
function horaTxt(min) {
  min = ((min % 1440) + 1440) % 1440;
  if (min === 0) return 'la medianoche';
  const h = Math.floor(min / 60), m = min % 60;
  return `${h === 1 ? 'la' : 'las'} ${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}
function estado(horarios) {
  const { dow, min } = ahora();
  const fr = (d) => (horarios[DIAS[(d + 7) % 7]] || []).map(([a, c]) => { const i = aMin(a); let f = aMin(c); if (f <= i) f += 1440; return [i, f]; });
  const abierta = [...fr(dow - 1).map(([a, b]) => [a - 1440, b - 1440]), ...fr(dow)].find(([a, b]) => min >= a && min < b);
  if (abierta) return { abierto: true, txt: `Abierto · hasta ${horaTxt(abierta[1])}` };
  for (let k = 0; k < 7; k++) {
    const f = fr(dow + k).find(([a]) => k > 0 || a > min);
    if (f) return { abierto: false, txt: `Cerrado · abre ${k === 0 ? 'hoy' : k === 1 ? 'mañana' : ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'][(dow + k) % 7]} a ${horaTxt(f[0])}` };
  }
  return { abierto: false, txt: 'Cerrado' };
}
function pintarEstado(horarios) {
  const e = estado(horarios), el = $('#estado');
  el.classList.toggle('cerrado', !e.abierto);
  $('.estado__txt', el).textContent = e.txt;
  const { dow } = ahora();
  $$('#horarios [data-dia]').forEach(d => d.classList.toggle('hoy', Number(d.dataset.dia) === dow));
}

/* ---------- entradas al hacer scroll ---------- */
const io = new IntersectionObserver((ents) => ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
$$('.aparece, .zigzag, .revela').forEach(el => io.observe(el));
// la píldora del panel no se mete entre los botones de la carta
new IntersectionObserver(([en]) => html.classList.toggle('en-carta', en.isIntersecting), { rootMargin: '-20% 0px -10% 0px' }).observe($('#carta'));

/* ---------- CARTA: día / noche / sin TACC, una sección por vez ---------- */
const NOMBRES_MODO = { d: 'carta de día', n: 'carta de noche', t: 'carta sin TACC' };
const carta = (() => {
  const seccion = $('#cartaSeccion'), pasos = $('.carta__pasos'), ant = $('#cartaAnt'), sig = $('#cartaSig');
  let el = null, modo = html.dataset.momento === 'noche' ? 'n' : 'd';
  const tabs = () => el ? $$('.kit-tab', el) : [];
  const delModo = () => tabs().filter(t => t.dataset.modo === modo);
  const activa = () => tabs().find(t => t.classList.contains('is-on'));

  function organizar(e) {
    el = e.detail.el;
    tabs().forEach(t => {
      const cat = t.dataset.cat || '';
      t.dataset.modo = cat.split('-')[0];
      t.textContent = t.textContent.replace(/^.*?·\s*/, '');
    });
    const tabsBox = $('.kit-tabs', el);
    if (tabsBox) tabsBox.after(seccion); else el.prepend(seccion);
    el.append(pasos);
    modo_(modo, false, true);
  }

  function modo_(m, scroll, forzar) {
    const cambio = m !== modo;
    modo = m;
    $$('.modo').forEach(b => b.setAttribute('aria-selected', String(b.dataset.modo === m)));
    if (!el) return;
    tabs().forEach(t => t.classList.toggle('fuera', t.dataset.modo !== m));
    const a = activa();
    if (!a || a.dataset.modo !== m || (cambio && !forzar)) { const p = delModo()[0]; if (p && p !== a) p.click(); else pintar(); }
    else pintar();
    if (scroll) irArriba();
  }

  function pintar() {
    const a = activa(); if (!a) return;
    const lista = delModo(), i = lista.indexOf(a);
    const panel = $('#' + a.getAttribute('aria-controls'));
    const items = panel ? $$('.kit-item', panel) : [];
    const pedibles = items.filter(x => x.querySelector('[data-kit-qty]')).length;
    $('#cartaNombre').textContent = a.textContent;
    const n = `${items.length} ${items.length === 1 ? 'opción' : 'opciones'}`;
    $('#cartaInfo').innerHTML = pedibles === items.length ? `${n} · se pueden pedir <b>para llevar</b>`
      : pedibles === 0 ? `${n} · para disfrutar en el salón`
      : `${n} · las que tienen <b>Agregar</b> se piden para llevar`;
    const prev = lista[i - 1], next = lista[i + 1];
    ant.disabled = !prev; sig.disabled = !next;
    $('.paso__txt', ant).textContent = prev ? prev.textContent : '';
    $('.paso__txt', sig).textContent = next ? next.textContent : '';
    const box = a.parentElement;
    if (box && box.scrollWidth > box.clientWidth) box.scrollTo({ left: a.offsetLeft - box.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
  }

  function irArriba() {
    const top = $('#carta .carta__control').getBoundingClientRect();
    const destino = seccion.getBoundingClientRect().top + scrollY - (innerWidth >= 1100 ? 100 : (top.height + parseInt(getComputedStyle(html).getPropertyValue('--barra')) + 70));
    if (Math.abs(destino - scrollY) > 40) window.scrollTo({ top: destino, behavior: reduce ? 'auto' : 'smooth' });
  }

  document.addEventListener('kit:carta', organizar);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.kit-tab'); if (t && el && el.contains(t)) { requestAnimationFrame(pintar); return; }
    const b = e.target.closest('.modo'); if (b) { modoElegido = true; modo_(b.dataset.modo, false); return; }
    const ir = e.target.closest('[data-ir-carta]'); if (ir) { modo_(ir.dataset.irCarta, false); }
  });
  ant.addEventListener('click', () => { const l = delModo(), i = l.indexOf(activa()); if (l[i - 1]) { l[i - 1].click(); irArriba(); } });
  sig.addEventListener('click', () => { const l = delModo(), i = l.indexOf(activa()); if (l[i + 1]) { l[i + 1].click(); irArriba(); } });
  $$('.modo').forEach(b => b.setAttribute('aria-selected', String(b.dataset.modo === modo)));
  return { modo: modo_ };
})();

const ICO_SALON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h10l-1 7a4 4 0 0 1-8 0L7 3Z"/><path d="M12 14v6M8 20h8"/></svg>';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function plato(p, ctx) {
  const tags = (p.etiquetas || []).filter(t => t !== 'salon');
  const salon = (p.etiquetas || []).includes('salon');
  const precio = p.precio === 0 ? 'Sin cargo' : (ctx.money(p.precio) ?? '<span class="kit-price--na">Consultar</span>');
  const pedible = !salon && p.precio > 0 && p.disponible !== false;
  const foto = p.foto ? `<button type="button" class="plato__mini" data-foto="${esc(ctx.asset(p.foto))}" data-nombre="${esc(p.nombre)}" aria-label="Ver foto de ${esc(p.nombre)}"><img src="${esc(ctx.asset(p.foto))}" alt="" width="72" height="72" loading="lazy" decoding="async"></button>` : '';
  return `
    <div class="plato__fila${foto ? ' plato__fila--foto' : ''}">
      ${foto}
      <div class="plato__cuerpo">
        <h4 class="plato__nombre">${esc(p.nombre)} ${tags.map(t => ctx.etiquetaHTML(t)).join('')}</h4>
        ${p.descripcion ? `<p class="plato__desc">${esc(p.descripcion)}</p>` : ''}
      </div>
      <span class="plato__precio">${precio}</span>
    </div>
    ${salon ? `<div class="plato__pie"><span class="plato__salon">${ICO_SALON}Solo en el salón</span></div>`
      : pedible ? `<div class="plato__pie"><span class="plato__llevar">Para llevar</span><div class="kit-qty" data-kit-qty="${esc(p.id)}"></div></div>`
      : p.disponible === false ? '<div class="plato__pie"><span class="plato__salon">Hoy no hay</span></div>' : ''}`;
}

/* foto del plato: un toque en el celu, al pasar el mouse en desktop */
let fotoPop = null;
function cerrarFoto() {
  if (!fotoPop) return;
  const p = fotoPop; fotoPop = null; p.classList.remove('abierta'); html.classList.remove('foto-abierta'); unlock();
  setTimeout(() => p.remove(), 260);
}
function abrirFoto(src, nombre) {
  cerrarFoto();
  const p = document.createElement('div');
  p.className = 'foto-plato'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', nombre);
  p.innerHTML = `<figure><img src="${esc(src)}" alt="${esc(nombre)}"><figcaption>${esc(nombre)}</figcaption></figure><button type="button" class="foto-plato__x" aria-label="Cerrar foto">✕</button>`;
  p.addEventListener('click', (e) => { if (!e.target.closest('figure') || e.target.closest('.foto-plato__x')) cerrarFoto(); });
  document.body.append(p); fotoPop = p; html.classList.add('foto-abierta'); lock();
  requestAnimationFrame(() => requestAnimationFrame(() => p.classList.add('abierta')));
  $('.foto-plato__x', p).focus({ preventScroll: true });
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && fotoPop) cerrarFoto(); });
const desk = matchMedia('(min-width: 1100px) and (hover: hover)');
document.addEventListener('click', (e) => {
  const b = e.target.closest('.plato__mini'); if (!b) return;
  abrirFoto(b.dataset.foto, b.dataset.nombre);
});
// desktop: foto que flota al costado al pasar por un plato con foto
const flota = document.createElement('div'); flota.className = 'foto-flota'; flota.innerHTML = '<img alt="">'; document.body.append(flota);
let fx = 0, fy = 0, fRaf = 0, fActual = null;
const posFlota = () => { fRaf = 0; flota.style.left = Math.min(innerWidth - 260, fx + 28) + 'px'; flota.style.top = Math.max(80, Math.min(innerHeight - 260, fy - 120)) + 'px'; };
document.addEventListener('pointerover', (e) => {
  if (!desk.matches || e.pointerType !== 'mouse') return;
  const it = e.target.closest('#carta .kit-item[data-photo]');
  if (it === fActual) return; fActual = it;
  if (it) { const img = flota.firstChild; if (img.getAttribute('src') !== it.dataset.photo) img.src = it.dataset.photo; flota.classList.add('ve'); } else flota.classList.remove('ve');
});
document.addEventListener('pointermove', (e) => { if (!fActual) return; fx = e.clientX; fy = e.clientY; if (!fRaf) fRaf = requestAnimationFrame(posFlota); }, { passive: true });

/* ---------- DM de Instagram (en vez de WhatsApp) ---------- */
async function dm(texto, aviso = 'Copiamos el mensaje: pegalo en el DM de @borderdevoto.') {
  const ok = await copiar(texto);
  window.open(IG_DM, '_blank', 'noopener');
  toast(ok ? aviso : 'Abrimos el DM de @borderdevoto.', 'ok', 4200);
}
document.addEventListener('click', (e) => { const b = e.target.closest('[data-dm]'); if (b) { e.preventDefault(); dm(b.dataset.dm); } });
// después de pedir una mesa, el botón "Avisar por DM" también copia el mensaje
document.addEventListener('kit:reserva', (e) => {
  const r = e.detail || {};
  setTimeout(() => {
    const a = $$('.kit-resv .kit-done a[href*="ig.me"]').pop(); if (!a) return;
    a.addEventListener('click', (ev) => { ev.preventDefault(); dm(`Hola Border! Pedí una mesa para ${r.personas} el ${r.fecha} a las ${r.hora}, a nombre de ${r.nombre}.`); });
  }, 60);
});

/* ---------- filas deslizables también con el mouse ---------- */
function arrastrable(fila) {
  // arrastre con mouse: sigue al cursor cuadro a cuadro, conserva la inercia al soltar y recién ahí vuelve el snap
  let x0 = 0, s0 = 0, mov = false, activo = false, raf = 0, dx = 0, vel = 0, lastX = 0, lastT = 0, id = 0;
  const desliza = () => fila.scrollWidth > fila.clientWidth + 4;
  fila.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !desliza()) return;
    activo = true; mov = false; x0 = lastX = e.clientX; lastT = performance.now(); s0 = fila.scrollLeft; vel = 0; id = e.pointerId;
  });
  fila.addEventListener('pointermove', (e) => {
    if (!activo) return;
    dx = e.clientX - x0;
    if (!mov && Math.abs(dx) > 5) { mov = true; fila.classList.add('arrastrando'); try { fila.setPointerCapture(id); } catch (_) { /* nada */ } }
    if (!mov) return;
    const t = performance.now(); vel = 0.8 * ((e.clientX - lastX) / Math.max(1, t - lastT)) + 0.2 * vel; lastX = e.clientX; lastT = t;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; fila.scrollLeft = s0 - dx; });
  });
  const soltar = () => {
    if (!activo) return; activo = false;
    if (!mov) return;
    const cards = Array.from(fila.children); const pad = parseFloat(getComputedStyle(fila).scrollPaddingLeft) || parseFloat(getComputedStyle(fila).paddingLeft) || 0;
    const objetivo = fila.scrollLeft - vel * 220; // proyecta la inercia
    const near = cards.reduce((b, c) => Math.abs(c.offsetLeft - pad - objetivo) < Math.abs(b.offsetLeft - pad - objetivo) ? c : b, cards[0]);
    fila.scrollTo({ left: near.offsetLeft - pad, behavior: reduce ? 'auto' : 'smooth' });
    let listo = false;
    const fin = () => { if (listo) return; listo = true; fila.classList.remove('arrastrando'); };
    fila.addEventListener('scrollend', fin, { once: true }); setTimeout(fin, 650);
    const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); }; fila.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => fila.removeEventListener('click', stop, { capture: true }), 60);
  };
  fila.addEventListener('pointerup', soltar); fila.addEventListener('pointercancel', soltar);
  fila.addEventListener('dragstart', (e) => e.preventDefault());
}
arrastrable($('#filaAgenda'));

/* ---------- USTEDES: mazo en el celu, galería desplegada desde tablet ---------- */
(() => {
  const mazo = $('#mazo'); if (!mazo) return;
  const todas = $$('.carta-foto', mazo);
  let cartas = todas.slice(); const total = cartas.length; let vistas = 0;
  const rots = [-4, 3, -2, 5, -5, 2, -3];
  const galeria = matchMedia('(min-width: 768px)');
  todas.forEach((c, i) => c.style.setProperty('--k', i));
  function acomodar() {
    if (galeria.matches) { todas.forEach(c => { c.style.zIndex = ''; c.style.transform = ''; c.removeAttribute('aria-hidden'); c.tabIndex = 0; c.setAttribute('role', 'button'); }); return; }
    cartas.forEach((c, i) => { c.removeAttribute('role'); c.tabIndex = -1; c.style.zIndex = String(total - i); c.style.setProperty('--r', (i === 0 ? 0 : rots[i % rots.length]) + 'deg'); c.style.transform = ''; c.setAttribute('aria-hidden', String(i !== 0)); });
    $('#mazoN').textContent = `${(vistas % total) + 1} / ${total}`;
  }
  function tirar(dir) {
    const c = cartas[0]; if (!c || c.classList.contains('sale')) return;
    c.classList.add('sale'); c.style.transform = `translateX(${dir * 130}%) rotate(${dir * 18}deg)`;
    setTimeout(() => { c.classList.remove('sale'); cartas.push(cartas.shift()); vistas++; c.style.transition = 'none'; acomodar(); void c.offsetWidth; c.style.transition = ''; }, 420);
  }
  let x0 = 0, dx = 0, drag = null, raf = 0;
  mazo.addEventListener('pointerdown', (e) => {
    if (galeria.matches) return;
    const c = e.target.closest('.carta-foto'); if (c !== cartas[0]) return;
    drag = c; x0 = e.clientX; dx = 0; c.classList.add('arrastra'); c.setPointerCapture(e.pointerId);
  });
  mazo.addEventListener('pointermove', (e) => {
    if (!drag) return; dx = e.clientX - x0;
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; if (drag) drag.style.transform = `translateX(${dx}px) rotate(${dx / 14}deg)`; });
  });
  const soltar = () => { if (!drag) return; const c = drag; drag = null; c.classList.remove('arrastra'); if (Math.abs(dx) > 80) tirar(Math.sign(dx)); else c.style.transform = ''; };
  mazo.addEventListener('pointerup', soltar); mazo.addEventListener('pointercancel', soltar);
  $('#mazoSig').addEventListener('click', () => tirar(1));
  // galería: tocar una foto la abre grande
  const abrirGrande = (c) => abrirFoto(c.querySelector('img').currentSrc || c.querySelector('img').src, c.querySelector('figcaption').textContent);
  mazo.addEventListener('click', (e) => { if (!galeria.matches) return; const c = e.target.closest('.carta-foto'); if (c) abrirGrande(c); });
  mazo.addEventListener('keydown', (e) => { if (!galeria.matches || (e.key !== 'Enter' && e.key !== ' ')) return; const c = e.target.closest('.carta-foto'); if (c) { e.preventDefault(); abrirGrande(c); } });
  galeria.addEventListener('change', acomodar);
  acomodar();
})();

/* ---------- KIT ---------- */
const kit = await initKit({
  config: 'cliente.json',
  carta: { template: plato, itemClass: 'plato', etiquetas: { casa: { label: 'De la casa' }, veggie: { label: 'Vegetariano' } } },
  carrito: { label: 'Para llevar' },
});
pintarEstado(kit.config.horarios);
setInterval(() => pintarEstado(kit.config.horarios), 60000);
setMomento(html.dataset.momento);

/* ---------- LA GARRA DE VINOS ---------- */
(async () => {
  const vidrio = $('#vidrio'), carro = $('#carro'), cable = $('#cable'), mano = $('#mano'), caja = $('#botellas');
  const aviso = $('#aviso'), bajar = $('#bajar'), ficha = $('#ficha');
  const VINOS = [
    { id: 'n-el-zorrito-naranjo', corto: 'Zorrito', c: '#F2A31A' },
    { id: 'n-el-burro-malbec', corto: 'Burro', c: '#B8323A' },
    { id: 'n-la-oveja-blanco', corto: 'Oveja', c: '#E8DC9C' },
    { id: 'n-flores-negras-pinot', corto: 'Flores', c: '#D98AA0' },
    { id: 'n-pyros-malbec-de-la-casa', corto: 'Pyros', c: '#9C4A3C' },
  ];
  let prods = [];
  try { prods = await kit.store.getProductos(); } catch (_) { /* sin datos: usa nombres cortos */ }
  kit.store.onChange?.(async () => { try { prods = await kit.store.getProductos(); } catch (_) { /* nada */ } });
  const botellaSVG = '<svg viewBox="0 0 52 150" aria-hidden="true"><path d="M20 4h12v30c0 6 14 14 14 30v78a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V64c0-16 14-24 14-30V4Z"/><path d="M20 12h12"/><rect class="etq" x="9" y="76" width="34" height="50" rx="3"/></svg>';
  caja.innerHTML = VINOS.map((v, i) => `<div class="botella" data-i="${i}" style="--c:${v.c}">${botellaSVG}<span class="botella__n">${v.corto}</span></div>`).join('');
  const botellas = $$('.botella', caja);
  let x = 0, ocupado = false;
  const W = () => vidrio.clientWidth;
  const setX = (v, anim = true) => { x = Math.max(8, Math.min(W() - 68, v)); carro.style.transition = anim ? '' : 'none'; carro.style.setProperty('--x', x + 'px'); };
  setX(W() / 2 - 30, false);
  addEventListener('resize', () => setX(x, false));

  let arrastra = false, ox = 0;
  vidrio.tabIndex = 0;
  vidrio.addEventListener('pointerdown', (e) => { if (ocupado) return; arrastra = true; ox = e.clientX - vidrio.getBoundingClientRect().left - 30; setX(ox); });
  addEventListener('pointermove', (e) => { if (!arrastra) return; setX(e.clientX - vidrio.getBoundingClientRect().left - 30, false); }, { passive: true });
  addEventListener('pointerup', () => { arrastra = false; });
  vidrio.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); setX(x - 30); } if (e.key === 'ArrowRight') { e.preventDefault(); setX(x + 30); } if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); soltarGarra(); } });
  $('#izq').addEventListener('click', () => !ocupado && setX(x - 40));
  $('#der').addEventListener('click', () => !ocupado && setX(x + 40));
  bajar.addEventListener('click', soltarGarra);

  const espera = (ms) => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  async function soltarGarra() {
    if (ocupado) return; ocupado = true; bajar.disabled = true; aviso.textContent = 'Bajando…';
    const vr = vidrio.getBoundingClientRect();
    const centro = x + 30;
    let mejor = null, dist = 1e9;
    botellas.forEach(b => { const r = b.getBoundingClientRect(); const c = r.left - vr.left + r.width / 2; const d = Math.abs(c - centro); if (d < dist) { dist = d; mejor = b; } });
    const topBotella = mejor.getBoundingClientRect().top - vr.top;
    const manoBase = 10 + 46 + 46; // carro + mano hasta las puntas
    const y = Math.max(0, topBotella - manoBase + 26);
    mano.style.setProperty('--y', y + 'px'); cable.style.setProperty('--baja', String((34 + y) / 34));
    await espera(720);
    mano.classList.add('cierra'); navigator.vibrate?.(25);
    await espera(260);
    const agarra = dist < 24;
    if (agarra) { mejor.style.transform = `translateY(${-y - 6}px)`; }
    mano.style.setProperty('--y', '0px'); cable.style.setProperty('--baja', '1');
    await espera(760);
    if (!agarra) {
      mano.classList.remove('cierra');
      aviso.textContent = dist < 60 ? '¡Uh, casi! Se te escapó por poquito. Probá de nuevo.' : 'La garra volvió vacía. Poné la garra arriba de una botella.';
      ocupado = false; bajar.disabled = false; return;
    }
    const v = VINOS[Number(mejor.dataset.i)];
    const p = prods.find(q => q.id === v.id) || { nombre: v.corto, descripcion: 'Botella.', precio: null };
    $('#fichaNombre').textContent = p.nombre;
    $('#fichaDesc').textContent = p.descripcion || 'Botella.';
    $('#fichaPrecio').textContent = kit.money(p.precio) || 'Consultar';
    $('#fichaFoto').src = p.foto ? kit.asset(p.foto) : 'img/carta/vinos.webp';
    $('#fichaFoto').alt = p.nombre;
    ficha.dataset.vino = p.nombre;
    ficha.hidden = false; ficha.style.animation = 'none'; void ficha.offsetWidth; ficha.style.animation = '';
    aviso.textContent = `¡Te tocó ${p.nombre}!`;
    if (innerWidth < 1100) ficha.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }
  function reset() {
    botellas.forEach(b => { b.style.transform = ''; });
    mano.classList.remove('cierra'); ficha.hidden = true; ocupado = false; bajar.disabled = false;
    aviso.textContent = 'Arrastrá la garra o usá las flechas.';
  }
  $('#fichaOtra').addEventListener('click', () => { reset(); vidrio.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }); });
  $('#fichaReservar').addEventListener('click', () => {
    kit.reservas?.abrir();
    setTimeout(() => {
      const ta = $$('.kit-pop .kit-resv textarea[name="comentario"]').pop();
      if (ta) { ta.value = `Queremos una botella de ${ficha.dataset.vino} (la sacamos de la garra)`; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    }, 80);
  });
})();
