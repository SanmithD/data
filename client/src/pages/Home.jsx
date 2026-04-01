import { ChevronDown, RotateCcw, Search } from "lucide-react"; // Assuming lucide-react is used, or replace with SVGs
import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem";
import HeroSlider from "../components/HeroSlider";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";
import { useCardSearchStore } from "../store/useCardSearchStore";
import { useTimelineDetailStore } from "../store/useTimelineDetailStore";
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
  const { fetchTimelineDetail, timelineDetail, clearTimelineDetail } =
    useTimelineDetailStore();

  const {
    searchResults,
    currentPage: searchPage,
    totalPages: searchTotalPages,
    loading: searchLoading,
    searchCards,
    clearSearch,
  } = useCardSearchStore();

  const [showModal, setShowModal] = useState(false);
  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchCards(1, perPage, false);
    fetchTimelineCards();
  }, [fetchCards, fetchTimelineCards, perPage]);

  const handleTimelineClick = (timeline) => {
    setSelectedTimeline(timeline.id);
    fetchTimelineDetail(timeline.id);
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
    clearTimelineDetail();
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
      <HeroSlider />

      {/* ===== TOP NAV ===== */}
      <div className="absolute right-5 top-5 z-999">
        {/* Hamburger Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="relative flex flex-col justify-center items-center w-7 h-6 md:w-10 md:h-10 
    backdrop-blur-md bg-black/40 rounded-full
    hover:bg-black/60 transition duration-300"
        >
          {/* Lines */}
          <span
            className={`absolute w-5 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "rotate-45" : "-translate-y-1.5"
            }`}
          />
          <span
            className={`absolute w-5 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`absolute w-5 h-0.5 bg-white transition-all duration-300 ${
              menuOpen ? "-rotate-45" : "translate-y-1.5"
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <div
          className={`absolute right-0 mt-3 w-40 md:w-52 z-999 origin-top-right transform transition-all duration-300 ${
            menuOpen
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          <div
            className="flex flex-col gap-0.5 md:gap-2 p-1 md:p-4 rounded-2xl
      bg-black/70 backdrop-blur-xl justify-center border border-white/10 shadow-2xl"
          >
            <button
              onClick={() => {
                navigate("/books");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:-translate-x-0.5"
            >
              Books
            </button>

            <a
              href="https://marudhararts.com/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:-translate-x-0.5"
            >
              Contact
            </a>

            <button
              onClick={() => {
                navigate("/about");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:-translate-x-0.5"
            >
              About
            </button>
          </div>
        </div>
      </div>

      {/* --- TOOLBAR: SEARCH & LIMIT --- */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 relative z-20">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-2 sm:p-3 md:p-5 flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
          {/* Search Input */}
          <div className="relative w-full">
            <Search
              className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={14}
              sm-size={16}
            />
            <input
              type="text"
              placeholder="Search..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-8 sm:pl-11 pr-2 sm:pr-3 py-1.5 sm:py-2 md:py-3 
          text-xs sm:text-sm md:text-base bg-gray-50 rounded-lg sm:rounded-xl 
          focus:ring-2 focus:ring-blue-500 outline-none border border-gray-200 
          sm:border-none placeholder:text-gray-400"
            />
          </div>

          {/* Actions Row */}
          <div className="flex flex-row gap-1.5 sm:gap-2 md:gap-3 w-full sm:w-auto">
            {/* Per Page Selector */}
            <div className="relative w-full sm:w-32 md:w-36">
              <select
                value={perPage}
                onChange={(e) => setPerPage(Number(e.target.value))}
                className="w-full appearance-none bg-gray-50 pl-2 sm:pl-3 md:pl-4 
            pr-6 sm:pr-8 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base 
            rounded-lg sm:rounded-xl font-medium text-gray-700 cursor-pointer 
            focus:ring-2 focus:ring-blue-500 outline-none border border-gray-200 
            sm:border-none"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
                <option value="100">100 / page</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 
            text-gray-400 pointer-events-none"
              />
            </div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="flex-1 sm:flex-none sm:w-auto px-3 sm:px-4 md:px-5 
          py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base bg-blue-600 
          text-white font-semibold rounded-lg sm:rounded-xl hover:bg-blue-700 
          transition-all shadow-md shadow-blue-200 whitespace-nowrap"
            >
              Search
            </button>

            {/* Reset Button */}
            <button
              onClick={() => {
                setSearchText("");
                setSelectedTimeline(null);
                clearTimelineDetail();
                handleReset();
                clearSearch();
                fetchCards(1, perPage, false);
                useTimelineDetailStore.setState({ timelineDetail: null });
              }}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 
          bg-gray-100 text-gray-600 rounded-lg sm:rounded-xl 
          hover:bg-gray-200 transition-all flex items-center justify-center"
            >
              <RotateCcw
                size={14}
                className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]"
              />
            </button>
          </div>
        </div>
      </section>

      {/* --- TIMELINE SECTION --- */}
      <section className="py-8 md:py-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-800">Timeline Filter</h2>
          <button
            onClick={() => {
              fetchCards(1, 10, false);
              setSelectedTimeline(null);
              clearTimelineDetail();
              clearSearch();
              setSearchText("");
            }}
            className="bg-gray-800 cursor-pointer hover:bg-gray-700 text-white px-5 py-1.5 rounded-md font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800"
          >
            Reset
          </button>
        </div>

        <section className="py-2 md:py-6 px-6 max-w-7xl mx-auto overflow-x-auto">
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

      {timelineDetail && timelineDetail.image?.url ? (
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-white rounded-2xl shadow p-4">
            <img
              src={timelineDetail.image.url}
              alt="timeline"
              onClick={() => setLightboxOpen(true)}
              className="w-full max-h-100 object-cover rounded-xl"
            />

            <Lightbox
              open={lightboxOpen}
              close={() => setLightboxOpen(false)}
              slides={[{ src: timelineDetail.image.url }]}
            />

            {timelineDetail.note && (
              <p className="mt-3 text-gray-700 text-sm">
                {timelineDetail.note}
              </p>
            )}
          </div>
        </section>
      ) : null}

      {/* --- CARDS GRID --- */}
      <section className="py-2 md:py-8 mb-4 px-6 max-w-7xl mx-auto min-h-[400px]">
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
