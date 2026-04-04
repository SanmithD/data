import { ArrowBigLeft, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useDocumentTitle from "../utils/useDocumentTitle";

export default function AboutPage() {

  useDocumentTitle("About | NumisVault");

  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10">
      <button onClick={() => navigate(-1)} className="cursor-pointer mb-4">
        <ArrowBigLeft />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3">
        <img
          src="/numis-logo.png"
          alt="NumisVault Logo"
          className="h-16 mb-4"
        />
        <h1 className="text-4xl font-bold text-gray-800 mb-6">
          About NumisVault
        </h1>
      </div>

      {/* Intro */}
      <p className="text-gray-600 leading-relaxed mb-6">
        <strong>NumisVault</strong> is a dedicated platform for exploring the
        fascinating world of numismatics — from ancient coins and banknotes to
        the stories of civilizations behind them. Our goal is to make historical
        knowledge simple, engaging, and accessible for collectors, learners, and
        enthusiasts.
      </p>

      <p className="text-gray-600 leading-relaxed mb-10">
        Built as a knowledge extension of trusted industry platforms, NumisVault
        bridges the gap between historical research and modern collecting.
      </p>

      {/* Marudhar Arts Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          About Marudhar Arts
        </h2>

        {/* Logo */}
        <img
          src="/marudhara-logo.jpg"
          alt="Marudhar Arts Logo"
          className="h-16 mb-4"
        />

        <p className="text-gray-600 leading-relaxed mb-4">
          Founded in 1966 by <strong>Mr. Prem Ratan Maru</strong>, Marudhar Arts
          is one of India’s most trusted and respected numismatic auction houses
          based in Bangalore. It is the only company in South India to hold an
          official antique license, reflecting its credibility, expertise, and
          integrity in the field.
        </p>

        <p className="text-gray-600 leading-relaxed mb-4">
          What began as a hobby of collecting stamps in Bikaner, Rajasthan,
          evolved into a pioneering business that transformed coin and stamp
          collecting into a recognized investment avenue in India — while still
          preserving its core collector spirit.
        </p>

        <p className="text-gray-600 leading-relaxed mb-6">
          Under the leadership of <strong>Mr. Rajender Maru</strong>, the
          company expanded into global markets and became a digital pioneer by
          launching Asia’s first 100% online numismatic auction in 2007.
        </p>

        {/* Highlights */}
        <ul className="space-y-3 text-gray-600 mb-6">
          <li>• Established in 1966 with decades of trust</li>
          <li>• First numismatic company in Asia to conduct e-auctions</li>
          <li>
            • Organizer of India’s first National Numismatic Exhibition (2011)
          </li>
          <li>• Strong presence in global collector communities</li>
        </ul>

        <a
          href="https://www.marudhararts.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 flex items-center gap-1 hover:underline"
        >
          Visit Marudhar Arts <ExternalLink size={14} />
        </a>
      </section>

      {/* Leadership */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Leadership & Legacy
        </h2>

        <p className="text-gray-600 leading-relaxed mb-4">
          <strong>Mr. Rajender Maru</strong>, Chairman & CEO, is a globally
          recognized numismatist and author of{" "}
          <em>South Asian Coins and Paper Money</em>, one of the most respected
          references in the field.
        </p>

        <p className="text-gray-600 leading-relaxed mb-4">
          The legacy continues with <strong>Mr. Archie Maru</strong>, Director
          of Marudhar Arts, a qualified numismatist and auctioneer with academic
          specialization in Numismatics and Archaeology.
        </p>

        <p className="text-gray-600 leading-relaxed">
          Together, they represent three generations of expertise, combining
          traditional knowledge with modern digital innovation.
        </p>
      </section>

      {/* CollectNDeal */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          CollectNDeal Platform
        </h2>

        <img
          src="/cnd-logo.jpg"
          alt="CollectNDeal Logo"
          className="h-16 mb-4"
        />

        <p className="text-gray-600 leading-relaxed mb-4">
          CollectNDeal is a modern digital platform powered by Marudhar Arts,
          designed to connect collectors, dealers, and enthusiasts in one place.
        </p>

        <p className="text-gray-600 leading-relaxed mb-4">
          It enables users to explore exhibitions, discover collectibles, and
          engage with the numismatic community beyond traditional auctions.
        </p>

        <a
          href="https://collectndeal.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 flex items-center gap-1 hover:underline"
        >
          Visit CollectNDeal <ExternalLink size={14} />
        </a>
      </section>

      {/* Physical Presence */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Physical Gallery
        </h2>

        <p className="text-gray-600 leading-relaxed mb-4">
          Marudhar Arts operates an exclusive showroom in MG Road,
          Bangalore, showcasing rare coins from Ancient India, Mughal Era,
          British India, and Republic India.
        </p>

        <p className="text-gray-600 leading-relaxed">
          The collection also includes rare stamps, medals, badges, and
          historical artifacts, offering collectors a unique in-person
          experience.
        </p>
      </section>

      {/* Closing */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-800 mb-3">
          Our Vision
        </h2>
        <p className="text-gray-600 leading-relaxed">
          NumisVault builds upon this strong legacy to create a digital
          knowledge hub where history meets modern collectors — preserving the
          past while educating the future.
        </p>
      </section>
    </div>
  );
}
