import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vacation Package Brands",
  description:
    "Browse vacation packages by brand. Westgate, Hilton Grand Vacations, Marriott, Wyndham, and more.",
};

export default function BrandsPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Brands</h1>
      <p className="text-gray-500">
        Brand listing will be populated from the database.
      </p>
    </div>
  );
}
