import type { Metadata } from "next";
import config from "@payload-config";
import { RootLayout } from "@payloadcms/next/layouts";
import React from "react";
import "../globals.css";

type Args = {
  children: React.ReactNode;
};

export const metadata: Metadata = {
  title: "VacationDeals.to Admin",
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config}>{children}</RootLayout>
);

export default Layout;
