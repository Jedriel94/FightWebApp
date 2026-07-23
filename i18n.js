/* ============================================================================
 * i18n.js — Toggle Español / Inglés para el sitio público MFL
 * ----------------------------------------------------------------------------
 * El sitio está escrito en español (es el idioma fuente). Este script traduce
 * los textos de INTERFAZ a inglés cuando el visitante lo elige: menú, botones,
 * etiquetas de sección, formularios, footer.
 *
 * NO traduce el contenido de la base (nombres de peleadores, títulos de
 * noticias, nombres de evento): eso son datos, no interfaz, y no están en el
 * diccionario, así que se quedan intactos.
 *
 * Cómo funciona: recorre los nodos de texto, guarda el original en español y,
 * si el texto coincide EXACTO con una entrada del diccionario, lo cambia. Se
 * re-aplica cuando aparece contenido nuevo (lo que pinta Supabase), sin tocar
 * lo que no reconoce.
 * ========================================================================== */

(function () {
  'use strict'

  // Diccionario: texto en español (tal cual aparece) -> inglés.
  // La clave es el texto ORIGEN. Se compara con trim, así que los espacios
  // sobrantes del HTML no importan.
  const EN = {
    // — Navegación —
    'Inicio': 'Home',
    'Eventos': 'Events',
    'Peleadores': 'Roster',
    'Noticias': 'News',
    'Tienda': 'Store',
    'Quiero Pelear': 'Fighters',
    'Quiero pelear': 'Fighters',
    'Contacto': 'Contact',

    // — Hero / próximo evento —
    'Próximo Evento': 'Next Event',
    'PRÓXIMO EVENTO': 'NEXT EVENT',
    'Ver Cartelera': 'View Fight Card',
    'Boletos': 'Tickets',
    'En Vivo Ahora': 'Live Now',
    'No te puedes perder': "Don't miss it",

    // — Contador —
    'Días': 'Days',
    'Horas': 'Hours',
    'Min': 'Min',
    'Seg': 'Sec',
    'DÍAS': 'DAYS',
    'HORAS': 'HOURS',
    'MIN': 'MIN',
    'SEG': 'SEC',

    // — Secciones home —
    'Cartelera Principal': 'Main Card',
    'Cartelera por anunciar': 'Card to be announced',
    'Últimos Resultados': 'Latest Results',
    'Convocatoria Abierta': 'Open Tryouts',
    'Patrocinadores': 'Sponsors',
    'Ganador': 'Winner',

    // — Eventos —
    'Próximos': 'Upcoming',
    'Pasados': 'Past',
    'Cartelera Estelar': 'Main Event',
    'Resultados': 'Results',

    // — Peleadores —
    'Roster Oficial': 'Official Roster',
    'Ganadas': 'Wins',
    'Perdidas': 'Losses',
    'Empates': 'Draws',
    'Récord': 'Record',
    'Todas': 'All',

    // — Tienda —
    'Merch Oficial': 'Official Merch',
    'Merch certificado MFL': 'MFL Certified Merch',
    'Todo': 'All',
    'Todos los productos': 'All products',
    'Destacado': 'Featured',
    'Ver detalle': 'View details',
    'Agregar al carrito': 'Add to cart',
    'Envío Gratis': 'Free Shipping',
    'Entrega 3-5 días': 'Delivery 3-5 days',
    'Devoluciones': 'Returns',
    'Tallas': 'Sizes',
    'Colores': 'Colors',
    'Cantidad': 'Quantity',

    // — Carrito —
    'Mi Carrito': 'My Cart',
    'Resumen del pedido': 'Order Summary',
    'Subtotal': 'Subtotal',
    'Total': 'Total',
    'Envío': 'Shipping',
    'Eliminar': 'Remove',
    'Vaciar carrito': 'Empty cart',
    'Ver productos': 'View products',
    'Seguir comprando': 'Continue shopping',
    'Finalizar compra': 'Checkout',

    // — Checkout —
    'Finalizar Pedido': 'Complete Order',
    'Tu pedido': 'Your order',
    'Datos de envío': 'Shipping details',
    'Datos bancarios': 'Bank details',
    'Contactar por WhatsApp': 'Contact via WhatsApp',
    'Confirmar pedido': 'Confirm order',
    'Nombre': 'Name',
    'Correo': 'Email',
    'Teléfono': 'Phone',
    'Dirección': 'Address',
    'Ciudad': 'City',
    'Estado': 'State',
    'Código Postal': 'ZIP Code',
    'País': 'Country',
    'Notas': 'Notes',

    // — Quiero Pelear —
    'Formulario de Registro': 'Registration Form',
    'Nombre completo': 'Full name',
    'Edad': 'Age',
    'Gimnasio / Equipo': 'Gym / Team',
    'Experiencia': 'Experience',
    'Mensaje para MFL': 'Message for MFL',
    'Enviar solicitud': 'Send application',
    'Hazte ver': 'Get noticed',
    'Construye tu carrera': 'Build your career',
    'Pelea en el escenario': 'Fight on stage',

    // — Botones / modal comunes —
    'Ahora no': 'Not now',
    'CERRAR': 'CLOSE',
    'Cerrar': 'Close',
    'Cancelar': 'Cancel',
    'Volver': 'Back',
    'Enviar': 'Send',
  }

  // Frases de la cartelera que el JS arma pegadas ("Pelea Estelar · PESO POR
  // ANUNCIAR · 5 ROUNDS") y no coinciden exacto con el diccionario. Se
  // reemplazan como subcadena, pero SOLO dentro de los elementos de la lista
  // de abajo, que nunca contienen nombres de peleadores. Orden: primero las
  // frases largas, para que "PESO POR ANUNCIAR" gane antes que "Peso".
  const FRASES = [
    ['PESO POR ANUNCIAR', 'WEIGHT TBA'],
    ['Cartelera Principal', 'Main Card'],
    ['Pelea Estelar', 'Main Event'],
    ['Co-Estelar', 'Co-Main'],
    ['Preliminar', 'Prelim'],
    ['Por Anunciar', 'TBA'],
    ['Por anunciar', 'TBA'],
    ['Por Pelear', 'Scheduled'],
    ['Por pelear', 'Scheduled'],
    ['Peso', 'Weight'],
    ['Estado', 'State'],
    ['México', 'Mexico'],
    ['Estados Unidos', 'United States'],
  ]
  // Elementos gestionados por el paso de frases (y excluidos del walker principal)
  const SEL_FRASES = '.uf-tipo, .uf-tipo-top, .uf-dl, .uf-dv, .uf-pais'

  const STORAGE_KEY = 'mfl_lang'
  let current = localStorage.getItem(STORAGE_KEY) || 'es'

  // node -> texto original en español (para poder volver a ES sin recargar)
  const originales = new WeakMap()
  const vistos = new Set() // nodos ya registrados (WeakMap no es iterable)

  const SALTAR = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA'])

  function registrarYtraducir(root, lang) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT
        const p = n.parentNode
        if (!p || SALTAR.has(p.nodeName)) return NodeFilter.FILTER_REJECT
        if (p.closest && p.closest('[data-i18n-skip]')) return NodeFilter.FILTER_REJECT
        // Los elementos de la cartelera los maneja el paso de frases
        if (p.closest && p.closest(SEL_FRASES)) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      },
    })

    const pend = []
    let n
    while ((n = walker.nextNode())) pend.push(n)

    for (const node of pend) {
      // La clave SIEMPRE se saca del original en español, no del texto actual.
      // Si un nodo ya está en inglés ("Home"), su texto actual no es clave del
      // diccionario; usar el original guardado ("Inicio") permite volver a ES.
      let orig, clave
      if (vistos.has(node)) {
        orig = originales.get(node)
        clave = orig.trim()
      } else {
        clave = node.nodeValue.trim()
        if (!(clave in EN)) continue      // solo registramos textos del diccionario (en español)
        orig = node.nodeValue
        originales.set(node, orig)
        vistos.add(node)
      }
      node.nodeValue = lang === 'en'
        ? orig.replace(clave, EN[clave])   // conserva los espacios de alrededor
        : orig
    }
  }

  // Etiquetas de sección tipo "Cartelera Principal — MFL 5": el JS les pega el
  // nombre del evento, así que no coinciden exacto. Traducimos solo el prefijo
  // (antes de " — ") y conservamos el nombre del evento, que es dato.
  // Devuelve los elementos que cumplen un selector dentro de root, incluyendo
  // root mismo si lo cumple. Así el observer puede pasar una tarjeta recién
  // insertada y se procesa aunque ELLA sea la que hace match.
  function enRoot(root, sel) {
    const res = []
    if (root.nodeType === 1) {
      if (root.matches && root.matches(sel)) res.push(root)
      root.querySelectorAll(sel).forEach(e => res.push(e))
    }
    return res
  }

  function traducirSecciones(lang, root) {
    enRoot(root || document, '.section-label').forEach(el => {
      if (el.querySelector('*')) return // solo etiquetas de texto plano
      if (el.dataset.i18nEs == null) el.dataset.i18nEs = el.textContent
      const orig = el.dataset.i18nEs
      const sep = orig.indexOf(' — ')
      const prefijo = sep === -1 ? orig.trim() : orig.slice(0, sep).trim()
      const nuevo = (lang === 'en' && prefijo in EN)
        ? (sep === -1 ? EN[prefijo] : EN[prefijo] + orig.slice(sep))
        : orig
      // Solo escribir si cambia: textContent dispara el observer (childList) y
      // reescribir el mismo valor entraría en bucle.
      if (el.textContent !== nuevo) el.textContent = nuevo
    })
  }

  // Traduce las frases compuestas de la cartelera. Guarda el original por nodo
  // para poder volver a español sin recargar.
  const origFrase = new WeakMap()
  function traducirFrases(lang, root) {
    enRoot(root || document, SEL_FRASES).forEach(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let n
      while ((n = walker.nextNode())) {
        if (!n.nodeValue.trim()) continue
        if (!origFrase.has(n)) origFrase.set(n, n.nodeValue)
        let s = origFrase.get(n)
        if (lang === 'en') {
          for (const [es, en] of FRASES) if (s.indexOf(es) !== -1) s = s.split(es).join(en)
        }
        if (n.nodeValue !== s) n.nodeValue = s
      }
    })
  }

  let observer = null

  // Traduce un subárbol concreto (root). Es lo que corre por cada bloque que
  // inyecta Supabase: solo toca lo nuevo, no re-recorre el documento entero.
  function traducirRoot(root, lang) {
    registrarYtraducir(root, lang)
    traducirSecciones(lang, root)
    traducirFrases(lang, root)
  }

  // Pasada completa: init y click del toggle.
  function aplicar(lang) {
    current = lang
    localStorage.setItem(STORAGE_KEY, lang)
    document.documentElement.lang = lang
    traducirRoot(document.body, lang)
    actualizarBotones()
  }

  // Solo childList: nos interesa el contenido NUEVO que inyecta Supabase.
  // No observamos characterData a propósito: el contador reescribe los segundos
  // cada tic, y observarlo dispararía el motor una vez por segundo sin razón.
  const OBS_OPTS = { childList: true, subtree: true }

  // Traduce el contenido nuevo EN EL MISMO INSTANTE que aparece, así no hay un
  // salto visible de español a inglés después de que la tarjeta ya se dibujó.
  // Nuestras mutaciones son solo de texto (characterData), que este observer
  // NO escucha, así que no hace falta desconectarlo: no se re-dispara solo.
  function arrancarObserver() {
    observer = new MutationObserver(muts => {
      for (const m of muts) {
        for (const nodo of m.addedNodes) {
          if (nodo.nodeType === 1) {
            traducirRoot(nodo, current)                       // elemento nuevo
          } else if (nodo.nodeType === 3 && nodo.parentNode && nodo.parentNode.nodeType === 1) {
            traducirRoot(nodo.parentNode, current)            // texto nuevo (p.ej. label actualizado)
          }
        }
      }
    })
    observer.observe(document.body, OBS_OPTS)
  }

  // ── Botón toggle ──────────────────────────────────────────────────────────
  function crearToggle(estiloMovil) {
    const b = document.createElement('button')
    b.className = 'mfl-lang-toggle'
    b.setAttribute('data-i18n-skip', '')          // no traducir el botón a sí mismo
    b.setAttribute('aria-label', 'Cambiar idioma / Switch language')
    b.style.cssText =
      "font-family:'Oswald',sans-serif;font-size:12px;letter-spacing:1px;" +
      'background:transparent;border:1px solid #333;color:#888;cursor:pointer;' +
      'padding:5px 10px;border-radius:4px;line-height:1;transition:all .2s;' +
      (estiloMovil ? 'margin:14px 20px;align-self:flex-start;' : 'margin-left:4px;')
    b.onmouseenter = () => { b.style.borderColor = '#E8001D'; b.style.color = '#fff' }
    b.onmouseleave = () => { b.style.borderColor = '#333'; b.style.color = '#888' }
    b.onclick = () => aplicar(current === 'es' ? 'en' : 'es')
    return b
  }

  function actualizarBotones() {
    document.querySelectorAll('.mfl-lang-toggle').forEach(b => {
      // Resalta el idioma activo
      const es = current === 'es'
      b.innerHTML =
        `<span style="color:${es ? '#fff' : '#666'};font-weight:${es ? 700 : 400}">ES</span>` +
        `<span style="color:#444;margin:0 5px">|</span>` +
        `<span style="color:${!es ? '#fff' : '#666'};font-weight:${!es ? 700 : 400}">EN</span>`
    })
  }

  function montarToggles() {
    const desktop = document.getElementById('nav-desktop')
    if (desktop && !desktop.querySelector('.mfl-lang-toggle')) {
      desktop.appendChild(crearToggle(false))
    }
    const movil = document.getElementById('mobile-menu')
    if (movil && !movil.querySelector('.mfl-lang-toggle')) {
      movil.appendChild(crearToggle(true))
    }
    // Fallback: páginas sin nav-desktop (checkout) — lo colgamos del header
    if (!desktop && !movil) {
      const header = document.querySelector('header nav') || document.querySelector('header')
      if (header && !header.querySelector('.mfl-lang-toggle')) {
        const tog = crearToggle(false)
        tog.style.cssText += 'position:absolute;top:14px;right:16px;'
        header.appendChild(tog)
      }
    }
  }

  function init() {
    montarToggles()
    aplicar(current)
    arrancarObserver()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})();
