import type { Metadata } from "next";
import Link from "next/link";
import { ES_DESTINATIONS } from "@/lib/i18n/es-destinations";

export const metadata: Metadata = {
  title: "Ofertas Vacacionales en Español | VacationDeals.to",
  description: "Paquetes vacacionales todo incluido en Cancún, Cabo, Puerto Vallarta, Punta Cana y Bahamas. Compara ofertas y reserva desde $399.",
  alternates: {
    canonical: "https://vacationdeals.to/es",
    languages: {
      "es": "https://vacationdeals.to/es",
      "en": "https://vacationdeals.to/",
      "x-default": "https://vacationdeals.to/",
    },
  },
  openGraph: {
    title: "Ofertas Vacacionales en Español",
    description: "Paquetes todo incluido en destinos latinos desde $399.",
    locale: "es_MX",
    alternateLocale: "en_US",
    url: "https://vacationdeals.to/es",
    type: "website",
  },
};

export default function SpanishHomePage() {
  return (
    <div>
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 px-8 py-12 text-white">
        <h1 className="mb-2 text-3xl font-bold sm:text-4xl">Ofertas Vacacionales Todo Incluido</h1>
        <p className="max-w-2xl text-lg text-white/90">
          Paquetes de 4-5 noches en los mejores destinos latinos y del Caribe desde $399.
        </p>
      </div>

      <div className="mb-4 flex justify-end">
        <Link href="/" className="text-sm text-gray-500 underline hover:text-blue-600" hrefLang="en">
          English version →
        </Link>
      </div>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Destinos Disponibles</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ES_DESTINATIONS.map((d) => (
            <Link
              key={d.esSlug}
              href={`/es/${d.esSlug}`}
              className="rounded-xl border border-gray-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-teal-500 hover:shadow-md"
            >
              <h3 className="text-lg font-bold text-gray-900">{d.cityName}</h3>
              <p className="mt-2 text-sm text-gray-600">{d.heroSub}</p>
              <p className="mt-3 text-sm font-semibold text-teal-600">Ver ofertas →</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-6">
        <h2 className="mb-3 text-lg font-bold text-gray-900">¿Qué son los paquetes vacacionales?</h2>
        <p className="text-sm leading-relaxed text-gray-700">
          Los paquetes vacacionales (también llamados "preview packages" o "vacpacks") son estancias de 4-5 noches
          en resorts de lujo a precios 70-80% por debajo del valor público. La contraprestación es una presentación
          de venta de 90 minutos durante tu estancia. No hay obligación de comprar nada.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-700">
          Rastreamos paquetes de los principales operadores del Caribe y el Pacífico mexicano: Bahia Principe,
          Villa Group, Pueblo Bonito, Atlantis Paradise Island, y más. Los precios se actualizan cada 6 horas.
        </p>
      </section>
    </div>
  );
}
