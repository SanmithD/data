import { ChevronDown, RotateCcw, Search } from "lucide-react"; // Assuming lucide-react is used, or replace with SVGs
import { useEffect, useState } from "react";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";
import { useCardSearchStore } from "../store/useCardSearchStore";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const {
    cards,
    fetchCards,
    fetchCardsByTimeline,
    currentPage,
    totalPages,
    loading,
  } = useCardStore();

  const { timelineCards, fetchTimelineCards } = useTimelineCardStore();
  const {
    searchResults,
    currentPage: searchPage,
    totalPages: searchTotalPages,
    loading: searchLoading,
    searchCards,
    clearSearch,
  } = useCardSearchStore();

  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(10);

  useEffect(() => {
    fetchCards(1, perPage, false);
    fetchTimelineCards();
  }, [fetchCards, fetchTimelineCards, perPage]);

  const handleTimelineClick = (timeline) => {
    setSelectedTimeline(timeline.id);
    fetchCardsByTimeline(1, perPage, false, timeline.id);
    clearSearch();
    setSearchText("");
  };

  const handleSearch = () => {
    if (!searchText.trim()) {
      clearSearch();
      return;
    }
    searchCards(
      1,
      perPage,
      [
        {
          basicSearchKey: "title",
          basicSearchValue: searchText,
          basicSearchType: "regex-string",
        },
      ],
      [],
      { sortKey: "position", sortType: 1 },
    );
    setSelectedTimeline(null);
  };

  const handleReset = () => {
    setSearchText("");
    setSelectedTimeline(null);
    clearSearch();
    fetchCards(1, perPage, false);
  };

  const handleLoadMore = () => {
    const nextPage = (searchText.trim() ? searchPage : currentPage) + 1;
    if (searchText.trim()) {
      searchCards(
        nextPage,
        perPage,
        [
          {
            basicSearchKey: "title",
            basicSearchValue: searchText,
            basicSearchType: "regex-string",
          },
        ],
        [],
        { sortKey: "position", sortType: 1 },
        true,
      );
    } else if (selectedTimeline) {
      fetchCardsByTimeline(nextPage, perPage, true, selectedTimeline);
    } else {
      fetchCards(nextPage, perPage, true);
    }
  };

  const activeCards = searchText.trim() ? searchResults : cards;
  const activeLoading = searchText.trim() ? searchLoading : loading;
  const activeCurrentPage = searchText.trim() ? searchPage : currentPage;
  const activeTotalPages = searchText.trim() ? searchTotalPages : totalPages;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* --- HERO SECTION --- */}
      <section className="relative bg-slate-900 text-white py-10 px-6 overflow-hidden">
        <div className="absolute right-5 text-sm flex gap-2">
          <a href="https://marudhararts.com/contact" target="__blank">
            <h1 className="text-sm cursor-pointer hover:text-red-300">Contact</h1>
          </a>  
          <h1
            className="text-sm cursor-pointer hover:text-red-300"
            onClick={() => navigate("/about")}
          >
            About
          </h1>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="max-w-6xl mx-auto text-center relative z-10 px-4 py-10">
          <div className="flex flex-col items-center gap-6 mb-6">
            {/* Logo */}
            <div className="p-1 rounded-2xl bg-white shadow-xl shadow-gray-200/40">
              <img
                src="/download.png"
                alt="logo"
                className="h-20 w-20 object-contain"
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-200">
              My Diary
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-gray-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Capture your thoughts, relive your moments, and preserve your
            memories in a clean, beautiful timeline.
          </p>
        </div>
      </section>

      {/* --- TOOLBAR: SEARCH & LIMIT --- */}
      <section className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="relative w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full md:pl-11 md:pr-4 md:py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Limit Selector */}
            <div className="relative flex-1 md:w-32">
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 pl-4 pr-10 py-3 rounded-xl font-medium text-gray-700 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

            {/* Actions */}
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
            >
              Search
            </button>
            <button
              onClick={handleReset}
              className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all"
              title="Reset Filters"
            >
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* --- TIMELINE SECTION --- */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-800">Timeline Filter</h2>
          <button
            onClick={() => {
              fetchCards(1, 10, false);
              setSelectedTimeline(null);
              clearSearch();
              setSearchText("");
            }}
            className="bg-gray-800 cursor-pointer hover:bg-gray-700 text-white px-5 py-1.5 rounded-md font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
          >
            Reset
          </button>
        </div>

        <section className="py-6 px-6 max-w-7xl mx-auto overflow-x-auto">
          <div className="relative min-w-max py-8 px-4">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full" />

            <div className="flex items-center gap-24 relative z-10">
              {timelineCards
                .sort((a, b) => b.year - a.year)
                .map((timeline) => {
                  const isSelected = selectedTimeline === timeline.id;

                  return (
                    <button
                      key={timeline.id}
                      onClick={() => handleTimelineClick(timeline)}
                      className="group relative cursor-pointer flex flex-col items-center justify-center focus:outline-none hover:animate-pulse"
                    >
                      <span
                        className={`absolute -top-10 whitespace-nowrap font-medium transition-all duration-300 ${
                          isSelected
                            ? "text-blue-600 scale-110"
                            : "text-gray-500 group-hover:text-blue-500"
                        }`}
                      >
                        {timeline.timeline}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-4 transition-all duration-300 ${
                          isSelected
                            ? "bg-blue-600 border-blue-200 scale-125 shadow-md"
                            : "bg-white border-gray-300 group-hover:border-blue-400 group-hover:scale-110"
                        }`}
                      />
                    </button>
                  );
                })}
            </div>
          </div>
        </section>
      </section>

      {/* --- CARDS GRID --- */}
      <section className="py-8 px-6 max-w-7xl mx-auto min-h-[400px]">
        {activeLoading && activeCards.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-gray-200 animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : activeCards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">
              {searchText.trim()
                ? `No results for "${searchText}"`
                : "No entries found in this period."}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {activeCards.map((card) => (
                <CardItem key={card._id} id={card._id} card={card} />
              ))}
            </div>

            {/* --- PAGINATION / LOAD MORE --- */}
            <div className="mt-16 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500 font-medium">
                Showing page{" "}
                <span className="text-gray-900">{activeCurrentPage}</span> of{" "}
                <span className="text-gray-900">{activeTotalPages}</span>
              </p>

              {activeCurrentPage < activeTotalPages && (
                <button
                  onClick={handleLoadMore}
                  disabled={activeLoading}
                  className="group relative px-10 py-4 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm flex items-center gap-3 disabled:opacity-50"
                >
                  {activeLoading ? (
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent animate-spin rounded-full" />
                  ) : (
                    "Load More Entries"
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      <AddCardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        parentId={null}
      />
    </div>
  );
}
