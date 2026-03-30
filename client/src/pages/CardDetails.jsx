/* eslint-disable react-hooks/set-state-in-effect */
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Home,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import CardItem from "../components/CardItem";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";
import { useCardSearchStore } from "../store/useCardSearchStore";
import { usePageTitleStore } from "../store/usePageTitleStore";

// ── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl " +
  "placeholder:text-gray-400 outline-none transition-all " +
  "focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

export default function CardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ── Search state ─────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // ── Stores ───────────────────────────────────────────────────────────────
  const {
    cardDetails,
    fetchCardById,
    childCards,
    fetchChildCards,
    totalChildren,
    loading,
  } = useCardStore();

  const {
    searchResults,
    currentPage: searchPage,
    totalPages: searchTotalPages,
    loading: searchLoading,
    searchCards,
    clearSearch,
  } = useCardSearchStore();

  const { timelineCards, fetchTimelineCards } = useTimelineCardStore();

  const { pageTitles, fetchPageTitles } = usePageTitleStore();

  const [childPage, setChildPage] = useState(1);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      setChildPage(1);
      fetchCardById(id);
      fetchChildCards(id, 1, perPage, false);
    }
  }, [id]); // eslint-disable-line

  useEffect(() => {
    fetchTimelineCards();
  }, [fetchTimelineCards]);

  useEffect(() => {
    if (id) fetchPageTitles(id);
  }, [id, fetchPageTitles]);

  // ── Search helpers ───────────────────────────────────────────────────────

  // Only includes fromTime/toTime when BOTH are filled
  const buildSearchPayload = ({ page: pg = 1, limit = perPage } = {}) => {
    const hasTimeRange = startTime.trim() !== "" && endTime.trim() !== "";

    return {
      searchQuery: searchText.trim() || undefined,
      page: pg,
      limit,
      searchDetails: [
        {
          basicSearchKey: "parentCard",
          basicSearchValue: id,
          basicSearchType: "string",
        },
      ],
      ...(hasTimeRange && {
        fromTime: startTime,
        toTime: endTime,
      }),
    };
  };

  const handleSearch = () => {
    setIsSearchActive(true);
    searchCards(buildSearchPayload({ page: 1 }));
  };

  const handleSearchReset = () => {
    setSearchText("");
    setStartTime("");
    setEndTime("");
    setIsSearchActive(false);
    clearSearch();
    setChildPage(1);
    fetchChildCards(id, 1, perPage, false);
  };

  const handlePerPageChange = (e) => {
    const newPerPage = Number(e.target.value);
    setPerPage(newPerPage);
    if (isSearchActive) {
      searchCards(buildSearchPayload({ page: 1, limit: newPerPage }));
    } else {
      setChildPage(1);
      fetchChildCards(id, 1, newPerPage, false);
    }
  };

  const displayedCards = isSearchActive ? searchResults || [] : childCards;
  const isLoading = isSearchActive ? searchLoading : loading;
  const hasTimeRange = startTime.trim() !== "" && endTime.trim() !== "";
  const canSearch = searchText.trim() !== "" || hasTimeRange;

  // ── Load more ────────────────────────────────────────────────────────────
  const handleLoadMoreChildren = () => {
    if (!loading && childCards.length < totalChildren) {
      const nextPage = childPage + 1;
      setChildPage(nextPage);
      fetchChildCards(id, nextPage, perPage, true);
    }
  };

  // ── Guard ────────────────────────────────────────────────────────────────
  if (!cardDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={36} />
      </div>
    );
  }

  const formattedDate = new Date(cardDetails.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex gap-2 items-center justify-between">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft size={20} /> Back
        </button>

        {/* Home */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 cursor-pointer text-gray-600 hover:text-blue-600 transition-colors mb-6"
        >
          <Home size={20} /> Home
        </button>
      </div>

      {/* ── Card Details ── */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-10 relative">
        <>
          {cardDetails.image && (
            <div className="relative">
              <img
                src={cardDetails.image}
                alt={cardDetails.title}
                onClick={() => setLightboxOpen(true)}
                className="w-full h-64 md:h-96 object-cover cursor-pointer"
              />
              <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                slides={[{ src: cardDetails.image }]}
              />
            </div>
          )}

          <div className="p-6 md:p-10">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">
                {cardDetails.title}
              </h1>
              {cardDetails.category && (
                <span className="bg-blue-100 text-blue-800 text-sm font-bold px-4 py-1.5 rounded-full shrink-0 ml-4">
                  {cardDetails.category}
                </span>
              )}
            </div>

            <div
              className="prose max-w-none mb-4"
              dangerouslySetInnerHTML={{ __html: cardDetails.description }}
            />

            {cardDetails.timelineId && (
              <p className="text-gray-500 mb-2">
                Timeline:{" "}
                <span className="font-medium text-gray-700">
                  {timelineCards.find((t) => t.id === cardDetails.timelineId)
                    ?.timeline || "N/A"}
                </span>
              </p>
            )}

            {cardDetails.start_time && (
              <p className="text-gray-500 mb-2">
                From:{" "}
                <span className="font-medium text-gray-700">
                  {cardDetails.start_time}
                </span>
                To:{" "}
                <span className="font-medium text-gray-700">
                  {cardDetails.end_time ?? ""}
                </span>
              </p>
            )}

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-t pt-6 mt-4">
              <p>
                Created on:{" "}
                <span className="font-semibold text-gray-700">
                  {formattedDate}
                </span>
              </p>
              {cardDetails.url && (
                <a
                  href={cardDetails.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  <ExternalLink size={16} /> Visit Link
                </a>
              )}
            </div>
          </div>
        </>
      </div>

      {/* ── Sub-Cards Section ── */}
      <div className="mt-12">
        {/* Section header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          {/* Title + inline edit */}
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-800">
              {pageTitles.length > 0 ? pageTitles[0].title : "Sub Diaries"}
            </h2>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">
          {/* Row 1: Search input + per-page + buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search sub-cards…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={`${inputCls} pl-9`}
              />
            </div>

            <div className="relative w-full md:w-40">
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className={`${inputCls} appearance-none pr-8`}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white
                text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50
                disabled:cursor-not-allowed transition shadow-sm whitespace-nowrap"
            >
              <Search size={14} /> Search
            </button>

            {isSearchActive && (
              <button
                onClick={handleSearchReset}
                title="Clear search"
                className="flex items-center justify-center px-3.5 py-2.5 bg-gray-100
                  text-gray-600 rounded-xl hover:bg-gray-200 transition"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {/* Row 2: Time range — fromTime & toTime only sent when BOTH are filled */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                From Year
              </label>
              <input
                type="text"
                placeholder="e.g. -2000 (2000 BCE)"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                To Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Apply filter — disabled unless both time fields are filled */}
            <button
              onClick={handleSearch}
              disabled={!hasTimeRange}
              title={!hasTimeRange ? "Fill both From and To year to apply" : ""}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white
                text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40
                disabled:cursor-not-allowed transition shadow-sm whitespace-nowrap"
            >
              Apply Filter
            </button>
          </div>

          {/* Active filter pills */}
          {isSearchActive && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
              {searchText.trim() && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium
                  bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full"
                >
                  Query: "{searchText}"
                </span>
              )}
              {hasTimeRange && (
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-medium
                  bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full"
                >
                  Years: {startTime} → {endTime}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {displayedCards.length} result
                {displayedCards.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleSearchReset}
                className="text-xs text-red-500 hover:underline font-medium ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Cards grid ── */}
        {isLoading && displayedCards.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-3">
              {isSearchActive
                ? "No results found for your search."
                : "No sub-cards found."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCards.map((subCard) => (
                <CardItem key={subCard._id} id={subCard._id} card={subCard} />
              ))}
            </div>

            {/* Load more — normal mode only */}
            {!isSearchActive && childCards.length < totalChildren && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMoreChildren}
                  disabled={loading}
                  className={`px-8 py-3 font-bold rounded-xl transition-all shadow-md ${
                    loading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-lg"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Loading…
                    </span>
                  ) : (
                    "Load More Sub-Cards"
                  )}
                </button>
              </div>
            )}

            {/* Search pagination */}
            {isSearchActive && searchTotalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  disabled={searchPage <= 1 || searchLoading}
                  onClick={() =>
                    searchCards(buildSearchPayload({ page: searchPage - 1 }))
                  }
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl
                    hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 px-3">
                  Page {searchPage} of {searchTotalPages}
                </span>
                <button
                  disabled={searchPage >= searchTotalPages || searchLoading}
                  onClick={() =>
                    searchCards(buildSearchPayload({ page: searchPage + 1 }))
                  }
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl
                    hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
