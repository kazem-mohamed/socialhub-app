import React from "react";
import { Link } from "react-router-dom";

export default function Notfound() {
  return (
    <section className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-7xl font-extrabold tracking-tight text-[#00298d] md:text-9xl">404</h1>
      <p className="text-lg text-gray-600">Page not found</p>
      <Link
        to="/"
        className="rounded-full bg-[#00298d] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-85"
      >
        Back to Home
      </Link>
    </section>
  );
}
