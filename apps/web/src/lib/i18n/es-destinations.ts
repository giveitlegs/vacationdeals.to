/**
 * Spanish localizations for priority Mexican/Caribbean destinations.
 *
 * URL pattern: /es/{es-slug}   e.g., /es/cancun-ofertas-vacacionales
 * Maps to English canonical: /{en-slug}  e.g., /cancun
 *
 * Hreflang pairs are emitted on both the English parent and Spanish child
 * so Google understands the two as translations.
 */

export interface SpanishDestination {
  esSlug: string;            // Spanish URL slug under /es/
  enSlug: string;            // canonical English city slug
  cityName: string;          // localized display name (often identical)
  h1: string;                // Spanish H1
  heroSub: string;           // hero paragraph
  aboutHtml: string;         // 400+ word about section (HTML)
  faqs: { q: string; a: string }[];
  metaTitle: string;
  metaDescription: string;
}

export const ES_DESTINATIONS: SpanishDestination[] = [
  // ─── Cancún ──────────────────────────────────────────────────────
  {
    esSlug: "cancun-ofertas-vacacionales",
    enSlug: "cancun",
    cityName: "Cancún",
    metaTitle: "Ofertas Vacacionales en Cancún desde $499 | VacationDeals.to",
    metaDescription: "Ofertas todo incluido de 4-5 noches en Cancún desde $499. Compara paquetes vacacionales de Bahia Principe, BookVIP y Villa Group. Reserva hoy.",
    h1: "Ofertas Vacacionales en Cancún, México",
    heroSub: "Paquetes todo incluido de 4 y 5 noches desde $499 con comidas, bebidas y traslados al aeropuerto incluidos.",
    aboutHtml: `<p>Cancún es la capital de los paquetes vacacionales todo incluido en el Caribe mexicano. Los grandes complejos hoteleros — Bahia Principe, Villa del Palmar, Pueblo Bonito — operan programas de preview que te permiten hospedarte por 4-5 noches a precios 70-80% por debajo del valor público. La única contraprestación es una presentación de venta de 90 minutos durante tu estancia.</p>
<p>A diferencia de un hotel regular donde pagas por noche, un paquete vacacional en Cancún incluye:</p>
<ul>
<li>Alojamiento en suite o habitación estándar</li>
<li>Todas las comidas (buffet + restaurantes a la carta)</li>
<li>Bebidas ilimitadas (cerveza, vino, cócteles, licores premium)</li>
<li>Deportes acuáticos no motorizados, acceso a piscinas y playa</li>
<li>Entretenimiento nocturno</li>
<li>En muchos casos, traslados al aeropuerto</li>
</ul>
<p>El promedio de los paquetes que rastreamos está entre $499 y $799 por 5 noches para dos adultos. Comparado con las tarifas públicas de los mismos hoteles ($349-$499 por noche), el ahorro total ronda los $1,500-$2,500 por estancia.</p>
<p>La presentación de venta en México es un poco más suave que la versión estadounidense. Los representantes se enfocan más en la "membresía vacacional" que en la compra directa de un timeshare. La duración estándar es de 90 minutos. Nada te obliga a comprar.</p>
<p>El mejor momento para visitar Cancún es diciembre a abril cuando el clima está seco, fresco y hay menor riesgo de huracanes. La temporada de huracanes oficial corre de junio a noviembre, con el pico en agosto-septiembre. Las ofertas son más baratas durante la temporada baja pero el clima es menos confiable.</p>
<p>Playa del Carmen, Tulum y la Riviera Maya están todas a 45-90 minutos del aeropuerto de Cancún. Muchos paquetes te permiten hacer un cambio de hotel durante tu estancia si quieres explorar la costa. Las excursiones populares incluyen Xcaret, Xel-Ha, las ruinas de Chichén Itzá y los cenotes de la Riviera Maya.</p>
<p>El tipo de cambio actual hace que los gastos fuera del resort (taxis, compras, propinas) sean aproximadamente 60% más baratos que en destinos del Caribe similar en Jamaica o Barbados.</p>`,
    faqs: [
      { q: "¿Qué incluye un paquete vacacional todo incluido en Cancún?", a: "Alojamiento, todas las comidas, bebidas ilimitadas (incluyendo alcohol premium), deportes acuáticos no motorizados, acceso a piscinas y entretenimiento nocturno. Algunos paquetes también incluyen traslados al aeropuerto." },
      { q: "¿Cuánto duran las presentaciones de venta?", a: "90 minutos. Las presentaciones en México son generalmente más suaves que las versiones estadounidenses y se centran en membresías vacacionales en lugar de compras directas de timeshare." },
      { q: "¿Necesito un pasaporte para ir a Cancún?", a: "Sí, un pasaporte válido por al menos 6 meses desde la fecha de entrada. También necesitarás un permiso de turista (FMM) emitido en migración; no hay costo para estancias menores a 180 días." },
      { q: "¿Cuál es la mejor época para visitar Cancún?", a: "Diciembre a abril es la temporada alta con clima seco y temperaturas de 25-30°C. La temporada de huracanes oficial corre de junio a noviembre con pico en agosto-septiembre." },
      { q: "¿Los paquetes vacacionales son seguros y legítimos?", a: "Sí. Los grandes complejos (Bahia Principe, Pueblo Bonito, Villa Group) operan programas de preview por décadas. Tu depósito reembolsable vuelve a tu tarjeta después de completar la presentación de 90 minutos." },
      { q: "¿Puedo llevar a mis hijos?", a: "La mayoría de los complejos permiten niños. Algunos, como las secciones adults-only dentro de resorts grandes, requieren todos los huéspedes mayores de 18 o 21 años." },
      { q: "¿Cuál es el depósito reembolsable?", a: "Normalmente $99-$199, reembolsable completamente en tu tarjeta después de completar la presentación de venta de 90 minutos." },
      { q: "¿Está incluido el transporte desde el aeropuerto?", a: "Muchos paquetes sí, especialmente los de Bahia Principe. Siempre confirma al reservar. Un taxi independiente de Cancún al hotel cuesta entre $60-$80 USD." },
      { q: "¿Se puede beber el agua del grifo?", a: "No. Bebe solo agua embotellada. Todos los principales resorts proporcionan agua embotellada ilimitada como parte del paquete todo incluido." },
      { q: "¿Qué edad mínima se requiere?", a: "La persona que reserva debe tener 25+ años (algunos complejos requieren 28+). Los acompañantes pueden ser de cualquier edad adulta." },
    ],
  },
  // ─── Cabo San Lucas ──────────────────────────────────────────────
  {
    esSlug: "cabo-san-lucas-ofertas",
    enSlug: "cabo-san-lucas",
    cityName: "Cabo San Lucas",
    metaTitle: "Ofertas Vacacionales en Cabo San Lucas desde $699 | VacationDeals.to",
    metaDescription: "Paquetes de lujo todo incluido en Cabo desde $699 por 4 noches. Pueblo Bonito, Villa del Palmar, TAFER. Compara y reserva.",
    h1: "Ofertas Vacacionales en Cabo San Lucas",
    heroSub: "Paquetes premium de 4 noches todo incluido desde $699 en resorts de lujo del Cabo.",
    aboutHtml: `<p>Cabo San Lucas y los Cabos se posicionan como un mercado de paquetes vacacionales de gama alta. A diferencia de Cancún donde el rango empieza en $499, los paquetes en Cabo comienzan en $699 por 4 noches y pueden llegar a $1,499 para experiencias premium en Pueblo Bonito Rosé o Velas Resorts.</p>
<p>Las marcas principales que operan programas de preview aquí son:</p>
<ul>
<li>Pueblo Bonito (Sunset, Rosé, Pacifica) — $799-$1,299</li>
<li>Villa del Palmar Cabo — $699-$999</li>
<li>TAFER (Garza Blanca) — $899-$1,499</li>
<li>Riu Palace Baja California — $749-$999</li>
</ul>
<p>Las inclusiones típicas de los paquetes de Cabo van más allá de lo básico: servicio de concierge, acceso a clubs de playa privados, cenas gourmet en restaurantes à la carte, y deportes motorizados en algunos casos. Los traslados al aeropuerto generalmente están incluidos dado que SJD está a 40 minutos del corredor turístico.</p>
<p>La presentación de venta en Cabo es notablemente más suave que en Cancún. Los representantes son bilingües y se enfocan en ventas consultativas en lugar de presión alta. Duración estándar 90 minutos, rara vez más.</p>
<p>Cabo es un destino para parejas y grupos pequeños. No es ideal para familias con niños pequeños dado que la playa principal (Playa del Amor) tiene corrientes fuertes y no hay la misma oferta familiar que en Cancún. Pero las parejas encuentran aquí una de las mejores combinaciones de lujo, gastronomía y paisaje del Pacífico mexicano.</p>
<p>La pesca deportiva es la actividad insignia de Cabo, seguida por el golf (varios campos top-100 del mundo), el spa, y los recorridos al Arco. Los avistamientos de ballenas jorobadas son excepcionales entre diciembre y abril.</p>
<p>Los paquetes vacacionales en Cabo son más caros que otros destinos mexicanos, pero comparados con reservar directamente el mismo resort ($450-$700 por noche pública), el ahorro es del 60-75%. Para una luna de miel de 4 noches o una escapada de aniversario, el costo total se puede mantener por debajo de $2,000 todo incluido.</p>`,
    faqs: [
      { q: "¿Cuánto cuesta un paquete vacacional en Cabo?", a: "Entre $699 y $1,499 por 4 noches todo incluido. Los paquetes básicos están en $699-$899 y los premium van de $999-$1,499." },
      { q: "¿Cabo es bueno para familias?", a: "Mejor para parejas y grupos pequeños. La playa principal tiene corrientes fuertes y Cabo se orienta más a experiencias de lujo que a actividades familiares. Para familias, considera Cancún o Puerto Vallarta." },
      { q: "¿Los traslados están incluidos?", a: "Sí en la mayoría de los paquetes de Pueblo Bonito, Villa del Palmar y TAFER. Siempre confirma al reservar — un taxi de SJD cuesta entre $80-$120 USD." },
      { q: "¿Cuándo es la mejor temporada?", a: "Octubre a mayo es la temporada alta con clima seco y temperaturas agradables. Junio a septiembre es más cálido, húmedo y hay posibilidad de huracanes." },
      { q: "¿Puedo ver ballenas?", a: "Sí, diciembre a abril. Las ballenas jorobadas migran por la bahía y los avistamientos son frecuentes desde la costa y en tours en barco." },
      { q: "¿Qué hay que hacer en Cabo?", a: "Pesca deportiva, tour al Arco, golf, spa, recorridos a Todos Santos, snorkel en la Bahía de Santa María, y cenas en los restaurantes del corredor San José-Cabo." },
      { q: "¿El agua es segura para beber?", a: "No. Bebe solo agua embotellada, que todos los resorts proporcionan ilimitadamente como parte del paquete todo incluido." },
      { q: "¿La presentación es agresiva?", a: "No. Las presentaciones en Cabo son consultivas y suaves. 90 minutos estándar. Los representantes no usan tácticas de alta presión comunes en Estados Unidos." },
      { q: "¿Los paquetes aceptan solteros?", a: "Sí. Algunos complejos requieren que la persona que reserva tenga 25-28 años mínimo, pero no requieren pareja." },
      { q: "¿Se requiere pasaporte?", a: "Sí, válido por al menos 6 meses desde la fecha de entrada." },
    ],
  },
  // ─── Puerto Vallarta ─────────────────────────────────────────────
  {
    esSlug: "puerto-vallarta-ofertas",
    enSlug: "puerto-vallarta",
    cityName: "Puerto Vallarta",
    metaTitle: "Ofertas Vacacionales en Puerto Vallarta desde $599 | VacationDeals.to",
    metaDescription: "Paquetes todo incluido en Puerto Vallarta desde $599. Villa del Palmar, Pueblo Bonito. Pacífico mexicano auténtico.",
    h1: "Ofertas Vacacionales en Puerto Vallarta, Jalisco",
    heroSub: "Paquetes de 4-5 noches todo incluido desde $599 en el corazón del Pacífico mexicano.",
    aboutHtml: `<p>Puerto Vallarta combina lo mejor de ambos mundos: la auténtica experiencia mexicana con la infraestructura turística de un destino de playa grande. A diferencia de Cancún (que es esencialmente una franja de hoteles) o Cabo (que es premium-solo), Puerto Vallarta es una ciudad real con centro histórico caminable, malecón activo, y una comunidad local fuerte.</p>
<p>Los paquetes vacacionales aquí generalmente están entre $599 y $999 por 4-5 noches todo incluido. Los operadores principales son:</p>
<ul>
<li>Villa Group (Villa del Palmar, Villa La Estancia) — $699-$999</li>
<li>Pueblo Bonito Vallarta — $799-$1,099</li>
<li>Marriott Puerto Vallarta (cuando está disponible) — $899-$1,299</li>
<li>Paquetes de corredor (BookVIP, Monster Reservations) — $599-$799</li>
</ul>
<p>La Zona Hotelera Nueva (al norte del aeropuerto PVR) concentra la mayoría de los complejos todo incluido. La Zona Romántica (Viejo Vallarta, al sur del centro) tiene hoteles más boutique y el mejor ambiente de ciudad. El aeropuerto está en el medio, a 20 minutos de ambas zonas.</p>
<p>La playa de Playa de Oro (junto a los grandes hoteles) es amplia y familiar. Para playas más tranquilas, Yelapa (accesible solo por barco) y Boca de Tomatlán son opciones de escapada diaria.</p>
<p>La presentación de venta aquí sigue el patrón mexicano: 90 minutos, enfoque consultivo, representantes bilingües, oferta de membresía vacacional. Villa Group es particularmente conocido por su programa Flex que permite usar noches en diferentes propiedades.</p>
<p>Actividades recomendadas: paseo en el malecón al atardecer, cena en La Zona Romántica (restaurante El Arrayán para cocina mexicana tradicional), mercado de domingo en Vallarta viejo, crucero al atardecer a Los Arcos, canopy en la Sierra Madre.</p>
<p>Puerto Vallarta es particularmente buena para viajes de luna de miel, aniversarios, y grupos mixtos de parejas con diferentes preferencias (algunos quieren ciudad, otros quieren playa). La infraestructura LGBTQ+ en la Zona Romántica es la más desarrollada de México.</p>
<p>El clima es estable casi todo el año con dos estaciones: seca (noviembre-mayo) y húmeda (junio-octubre). La temporada de huracanes es menos intensa que en el Caribe dado que la bahía está protegida por la Sierra Madre.</p>`,
    faqs: [
      { q: "¿Qué es especial de Puerto Vallarta comparado con Cancún?", a: "Puerto Vallarta es una ciudad real con centro histórico caminable y una comunidad local auténtica, a diferencia de Cancún que es principalmente una franja de hoteles. Las experiencias culturales son más ricas." },
      { q: "¿Dónde es mejor hospedarse: Zona Hotelera o Viejo Vallarta?", a: "Zona Hotelera Nueva para resorts todo incluido y playas amplias. La Zona Romántica (Viejo Vallarta) para hoteles boutique y mejor vida nocturna." },
      { q: "¿Cuánto cuesta un paquete vacacional típico?", a: "$599-$999 para 4-5 noches todo incluido por dos personas. Los paquetes premium de Marriott pueden llegar a $1,299." },
      { q: "¿La temporada de huracanes afecta a Puerto Vallarta?", a: "Menos que el Caribe. La Sierra Madre protege la bahía. Junio-octubre es más húmedo pero los huracanes directos son raros." },
      { q: "¿Es caminable la ciudad?", a: "Sí. El malecón tiene 12 cuadras y la Zona Romántica es completamente peatonal. Taxis son baratos ($3-$6 USD por viaje dentro de la ciudad)." },
      { q: "¿Es bueno para LGBTQ+?", a: "Puerto Vallarta es conocido como el destino gay-friendly más desarrollado de México, especialmente la Zona Romántica que concentra bares, restaurantes y eventos." },
      { q: "¿Puedo ir a Yelapa?", a: "Sí, pero solo por barco. Los ferries salen de Los Muertos pier varias veces al día. Vale la pena un día completo." },
      { q: "¿Cuál es la mejor comida local?", a: "El Arrayán (cocina mexicana tradicional), Café des Artistes (fine dining), Joe Jack's Fish Shack (casual), y los puestos de tacos en la Zona Romántica." },
      { q: "¿Se habla inglés en los resorts?", a: "Sí, el personal de los resorts es bilingüe. Fuera del resort, el inglés es menos común pero básico se maneja en restaurantes y tiendas turísticas." },
      { q: "¿Los paquetes incluyen traslados?", a: "Muchos paquetes de Villa Group y Pueblo Bonito sí incluyen traslados. Confirma al reservar. Un taxi de PVR al hotel cuesta $15-$25 USD." },
    ],
  },
  // ─── Punta Cana ──────────────────────────────────────────────────
  {
    esSlug: "punta-cana-ofertas",
    enSlug: "punta-cana",
    cityName: "Punta Cana",
    metaTitle: "Ofertas Vacacionales en Punta Cana desde $499 | VacationDeals.to",
    metaDescription: "Paquetes todo incluido en Punta Cana desde $499 por 4-5 noches. Bahia Principe, BookVIP. República Dominicana.",
    h1: "Ofertas Vacacionales en Punta Cana, República Dominicana",
    heroSub: "Paquetes todo incluido de 4-5 noches en Bavaro Beach desde $499.",
    aboutHtml: `<p>Punta Cana es la puerta de entrada más fácil al Caribe para viajeros desde Estados Unidos. Los vuelos desde Miami duran 3 horas, desde Nueva York 4 horas, y el aeropuerto PUJ es pequeño y eficiente. La infraestructura turística está construida casi exclusivamente para resorts todo incluido, lo que hace los paquetes vacacionales particularmente competitivos.</p>
<p>Los paquetes principales rastreados aquí van de $499 a $899 por 4-5 noches todo incluido para dos personas. Las marcas operadoras son:</p>
<ul>
<li>Bahia Principe Grand Punta Cana — $499-$699</li>
<li>Bahia Principe Grand Bavaro — $599-$799</li>
<li>BookVIP (corredor con varios complejos) — $499-$699</li>
<li>Occasional Excellence Punta Cana (premium) — $899+</li>
</ul>
<p>Playa Bavaro (donde se concentran los complejos) se considera una de las mejores playas del Caribe: 40 km de arena blanca, aguas turquesas, protegida por un arrecife de coral que mantiene el mar tranquilo. La natación es segura para niños, el snorkel es decente (no espectacular), y la arena no se calienta al punto de no poderse caminar al mediodía.</p>
<p>Los paquetes típicos incluyen todas las comidas, bebidas ilimitadas, acceso a piscinas y playa, deportes acuáticos no motorizados, y entretenimiento nocturno. Los paquetes de Bahia Principe generalmente incluyen traslados al aeropuerto — lo que ahorra $60-$120 en transporte.</p>
<p>La presentación de venta sigue el patrón del Caribe: 90 minutos, representantes bilingües, enfoque en membresía vacacional. El depósito reembolsable es entre $99 y $199.</p>
<p>Excursiones populares: Saona Island (playa blanca + almuerzo + bar abierto, $100-$130), Hoyo Azul (cenote + tirolinas, $90-$120), catamarán al atardecer ($75-$95), y nado con delfines ($150-$180). La Carretera Internacional entre Punta Cana y Santo Domingo (3 horas) permite excursiones de un día a la capital histórica.</p>
<p>Moneda: peso dominicano pero dólares estadounidenses se aceptan universalmente en zonas turísticas. Las propinas esperadas son $1-$5 por servicio, y el presupuesto total de propinas para un viaje de 5 noches es $40-$60.</p>
<p>La mejor época es diciembre-abril para clima estable. Junio-noviembre es temporada de huracanes con pico en septiembre, pero Punta Cana está menos expuesta que Cancún por su posición geográfica.</p>`,
    faqs: [
      { q: "¿Cuánto dura el vuelo desde Estados Unidos?", a: "3 horas desde Miami, 4 horas desde Nueva York, 4 horas desde Atlanta. Vuelos directos desde la mayoría de las ciudades principales." },
      { q: "¿Necesito pasaporte?", a: "Sí, válido por la duración de tu estancia. Una tarjeta de turista (TUI) cuesta $10-$15 USD y se paga al llegar al aeropuerto." },
      { q: "¿Es seguro Punta Cana?", a: "Las zonas turísticas son seguras. Evita áreas fuera de las zonas de resort de noche. Los taxis oficiales son la forma más segura de moverse." },
      { q: "¿Los traslados al aeropuerto están incluidos?", a: "Usualmente sí en paquetes de Bahia Principe. Confirma al reservar. Un taxi privado desde PUJ cuesta $35-$50 USD." },
      { q: "¿Cuál es la mejor playa?", a: "Playa Bavaro, donde se concentran los resorts. 40 km de arena blanca, aguas turquesas, protegida por arrecife. Segura para niños." },
      { q: "¿Puedo ir a Santo Domingo desde Punta Cana?", a: "Sí, 3 horas en auto por la Carretera Internacional. Muchos tours ofrecen excursiones de un día al centro histórico colonial." },
      { q: "¿El agua del grifo es segura?", a: "No. Bebe solo agua embotellada, que todos los complejos proporcionan ilimitada como parte del paquete todo incluido." },
      { q: "¿Cuándo es la temporada de huracanes?", a: "Junio-noviembre, pico en septiembre. Punta Cana está menos expuesta que Cancún geográficamente, pero los riesgos existen." },
      { q: "¿Qué moneda se usa?", a: "Peso dominicano, pero el dólar estadounidense se acepta universalmente en zonas turísticas." },
      { q: "¿Cuánto propina debo dejar?", a: "$1-$5 USD por servicio. Presupuesta $40-$60 total para propinas en un viaje de 5 noches." },
    ],
  },
  // ─── Nassau ──────────────────────────────────────────────────────
  {
    esSlug: "nassau-ofertas-bahamas",
    enSlug: "nassau",
    cityName: "Nassau",
    metaTitle: "Ofertas Vacacionales en Nassau Bahamas desde $399 | VacationDeals.to",
    metaDescription: "Paquetes en Nassau, Bahamas desde $399 por 4 noches. Atlantis Paradise Island, British Colonial. A 45 minutos de Miami.",
    h1: "Ofertas Vacacionales en Nassau, Bahamas",
    heroSub: "Escapadas rápidas al Caribe desde $399 por 4 noches. Vuelo de 45 minutos desde Miami.",
    aboutHtml: `<p>Nassau es el destino caribeño más cercano a Estados Unidos — un vuelo de 45 minutos desde Miami te pone en las Bahamas. Para una escapada rápida sin el compromiso de una semana completa, Nassau ofrece paquetes vacacionales desde $399 por 4 noches.</p>
<p>A diferencia de Cancún o Punta Cana donde el mercado de paquetes es más grande, Nassau tiene un inventario más limitado pero de alta calidad:</p>
<ul>
<li>Atlantis Paradise Island — $499-$799 (4-5 noches con acceso al parque acuático Aquaventure)</li>
<li>British Colonial Hilton — $399-$549 (4 noches en el centro histórico)</li>
<li>SLS Baha Mar — $699-$999 (premium)</li>
</ul>
<p>Atlantis es el destino icónico de Nassau y el principal operador de paquetes vacacionales. Incluye acceso completo al complejo acuático Aquaventure (más de 20 toboganes, río lento, playa privada), el Marine Habitat (más de 100 especies marinas), un casino de 60,000 pies cuadrados, y múltiples piscinas y restaurantes. El paquete vacacional te da acceso idéntico al que tienen los huéspedes pagando tarifa completa.</p>
<p>Nassau centro es una ciudad colonial caminable con arquitectura británica, Parliament Square, el histórico hotel British Colonial, y el Queen's Staircase (66 escalones tallados en piedra caliza por esclavos en el siglo XVIII). El Straw Market para souvenirs y la zona histórica de Bay Street para compras de duty-free son atractivos principales.</p>
<p>Excursiones recomendadas: Blue Lagoon Island (nado con delfines, snorkel, $120-$180), Exuma Day Tour (cerdos nadadores + banco de arena, $200-$250), y tours culinarios en el Fish Fry de Arawak Cay ($60-$80 por persona).</p>
<p>La moneda es el dólar bahameño (BSD) vinculado al dólar estadounidense (1:1). Los dólares americanos se aceptan universalmente. No necesitas cambiar dinero.</p>
<p>La mejor época es diciembre-abril para clima agradable. Junio-noviembre es temporada de huracanes, con pico en septiembre. Los precios bajan durante esta temporada pero el riesgo climático es real.</p>
<p>Para turistas estadounidenses, Nassau es particularmente atractivo porque: (1) es el destino caribeño más cercano con vuelos de 45-90 minutos desde hubs de Florida, (2) el dólar americano se usa en todas partes, (3) el inglés es el idioma oficial, (4) los vuelos son económicos comparado con otros destinos caribeños similares.</p>`,
    faqs: [
      { q: "¿Cuánto dura el vuelo a Nassau?", a: "45 minutos desde Miami, 2.5 horas desde Atlanta, 3 horas desde Nueva York. Vuelos frecuentes durante el día." },
      { q: "¿Necesito pasaporte?", a: "Sí, un pasaporte estadounidense válido por la duración de tu estancia. No hay visa requerida." },
      { q: "¿Qué incluye un paquete en Atlantis?", a: "Alojamiento, acceso completo a Aquaventure, Marine Habitat, todas las piscinas y restaurantes del complejo. El casino es adulto-solo." },
      { q: "¿Nassau es seguro?", a: "Las zonas turísticas sí. Evita el barrio Over-the-Hill de noche. Los taxis oficiales son la mejor opción." },
      { q: "¿Qué moneda usar?", a: "Dólar bahameño, vinculado 1:1 al dólar estadounidense. Los dólares americanos se aceptan universalmente." },
      { q: "¿Puedo usar los puntos de Hilton en British Colonial?", a: "No en paquetes vacacionales — estos son tarifas de preview separadas del programa de lealtad. Puedes ganar puntos pero no redimir." },
      { q: "¿Cuándo evitar Nassau?", a: "Septiembre es pico de temporada de huracanes. Marzo durante las vacaciones de primavera puede ser caótico. Diciembre-abril es ideal." },
      { q: "¿Los paquetes son de todo incluido?", a: "Limitado. Nassau tiene pocas opciones de todo incluido. La mayoría son 'habitación más comida al día' o 'habitación con acceso a amenidades'." },
      { q: "¿Se puede tomar el agua del grifo?", a: "La mayoría de los hoteles sí. Fuera del hotel, prefiere agua embotellada." },
      { q: "¿Nassau vs Atlantis?", a: "Atlantis es un complejo autónomo en Paradise Island. Nassau centro (British Colonial) te pone en la ciudad histórica. Elige según si quieres parque acuático o cultura urbana." },
    ],
  },
];

export const ES_TO_EN: Record<string, string> = Object.fromEntries(
  ES_DESTINATIONS.map((d) => [d.esSlug, d.enSlug]),
);

export const EN_TO_ES: Record<string, string> = Object.fromEntries(
  ES_DESTINATIONS.map((d) => [d.enSlug, d.esSlug]),
);
