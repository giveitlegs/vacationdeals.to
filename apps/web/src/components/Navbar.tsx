"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { href: "/deals", label: "All Deals" },
  { href: "/destinations", label: "Destinations" },
  { href: "/brands", label: "Brands" },
  { href: "/blog", label: "Blog" },
  { href: "/rate-recap", label: "Rate Recap" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {/* Icon mark */}
            <svg
              className="h-8 w-8 shrink-0"
              viewBox="0 0 48 48"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M24 4C15.163 4 8 11.163 8 20c0 11 16 26 16 26s16-15 16-26c0-8.837-7.163-16-16-16z"
                fill="#2563EB"
              />
              <circle cx="24" cy="17.5" r="6.5" fill="#FBBF24" />
              <path
                d="M14 22h20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M16 25c2-1.2 4-1.2 6 0s4 1.2 6 0"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            {/* Wordmark */}
            <span className="flex items-baseline gap-0">
              <span className="text-xl font-bold tracking-tight text-blue-600">
                Vacation
              </span>
              <span className="text-xl font-bold tracking-tight text-gray-900">
                Deals
              </span>
              <span className="ml-0.5 text-sm font-semibold text-gray-400">
                .to
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            aria-label="Open menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay — rendered outside <nav> to avoid its stacking context */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 md:hidden"
          onClick={() => setMobileOpen(false)}
        >
          {/* Drawer */}
          <div
            className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-col px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="nav-link rounded-lg px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-600"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
