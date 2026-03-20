import React from "react";
import { ExternalLink, Phone, Globe, ArrowBigLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AboutPage() {
  const naviagte = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <button onClick={() => naviagte(-1)} className="cursor-pointer" ><ArrowBigLeft/></button>
      {/* Header */}
      <h1 className="text-4xl font-bold text-gray-800 mb-6">
        About Marudhar Arts
      </h1>

      {/* Intro */}
      <p className="text-gray-600 leading-relaxed mb-8">
        Marudhar Arts is one of India’s leading numismatic auction houses, based
        in Bangalore, specializing in rare coins, banknotes, stamps, and
        historical collectibles. Established in 1966, the company has grown into
        a trusted platform for collectors and investors across the globe.
      </p>

      {/* Links */}
      <div className="flex flex-wrap gap-4 mb-10">
        <a
          href="https://www.marudhararts.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Globe size={18} />
          Visit Website
        </a>

        <a
          href="https://www.marudhararts.com/contact"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition"
        >
          <Phone size={18} />
          Contact Us
        </a>
      </div>

      {/* About Theme */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">Our Theme</h2>
        <p className="text-gray-600 leading-relaxed">
          Our core philosophy revolves around preserving history through
          collectibles. Marudhar Arts bridges the gap between the past and
          present by bringing rare and valuable artifacts to collectors
          worldwide through transparent and secure auction systems.
        </p>
      </section>

      {/* Ownership */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Three Generations of Expertise
        </h2>

        <ul className="space-y-4 text-gray-600">
          <li>
            <strong>First Generation:</strong> Founded in 1966 as a passion for
            collecting coins and stamps, laying the foundation of the business.
          </li>
          <li>
            <strong>Second Generation:</strong> Expanded operations into a
            professional numismatic business, introducing expertise in rare
            collectibles and auctions.
          </li>
          <li>
            <strong>Third Generation:</strong> Modernized the company by
            introducing online auctions, making it one of Asia’s pioneers in
            digital numismatic trading.
          </li>
        </ul>
      </section>

      {/* Second Company */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Marudhara Arts Inc.
        </h2>
        <p className="text-gray-600 leading-relaxed mb-2">
          Alongside Marudhar Arts, the group also operates{" "}
          <strong>Marudhara Arts Inc.</strong>, a textile and home furnishing
          company based in Jaipur.
        </p>

        <p className="text-gray-600 leading-relaxed">
          This division specializes in manufacturing and exporting products such
          as bed linens, quilts, cushion covers, and home décor items, catering
          to both domestic and international markets.
        </p>
      </section>

      {/* Closing */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Legacy & Trust
        </h2>
        <p className="text-gray-600 leading-relaxed">
          With decades of experience and a strong reputation in the field,
          Marudhar Arts continues to serve collectors, historians, and investors
          by providing authentic, rare, and valuable collectibles through a
          trusted auction platform.
        </p>
      </section>
    </div>
  );
}
