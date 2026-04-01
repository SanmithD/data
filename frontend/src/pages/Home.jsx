import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ChevronDown, RotateCcw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
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
    reorderCards,
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

  const { fetchTimelineDetail, timelineDetail, clearTimelineDetail } =
    useTimelineDetailStore();

  const [selectedTimeline, setSelectedTimeline] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor));

  // Fetch cards and timelines on mount
  useEffect(() => {
    fetchCards(1, perPage, false);
    fetchTimelineCards();
  }, [fetchCards, fetchTimelineCards, perPage]);

  // Timeline click handler
  const handleTimelineClick = (timeline) => {
    setSelectedTimeline(timeline.id);
    fetchTimelineDetail(timeline.id);
    fetchCardsByTimeline(1, perPage, false, timeline.id);
    clearSearch(); // clear search when timeline selected
    setSearchText("");
  };

  // Search handler
  const handleSearch = () => {
    if (!searchText.trim()) {
      clearSearch();
      return;
    }
    searchCards({
      page: 1,
      limit: perPage,
      searchQuery: searchText.trim() || undefined,
      searchDeatils: [
        {
          basicSearchKey: "title",
          basicSearchValue: searchText,
          basicSearchType: "regex-string",
        },
      ],
      sortDetails: { sortKey: "position", sortType: 1 },
    });
    setSelectedTimeline(null); // deselect timeline
  };

  // Load more handler
  const handleLoadMore = () => {
    if (searchText.trim()) {
      if (searchPage < searchTotalPages && !searchLoading) {
        searchCards(
          searchPage + perPage,
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
      }
    } else {
      if (currentPage < totalPages && !loading) {
        if (selectedTimeline) {
          fetchCardsByTimeline(currentPage + 1, 10, true, selectedTimeline);
        } else {
          fetchCards(currentPage + 1, perPage, true);
        }
      }
    }
  };

  // Drag-and-drop handler
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const targetCards = searchText.trim() ? searchResults : cards;
    const oldIndex = targetCards.findIndex((c) => c._id === active.id);
    const newIndex = targetCards.findIndex((c) => c._id === over.id);

    const newCards = arrayMove(targetCards, oldIndex, newIndex);

    if (searchText.trim()) {
      // Update search results order
      useCardSearchStore.setState({ searchResults: newCards });
    } else {
      reorderCards(newCards);
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
                navigate("/slide-images");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:-translate-x-0.5"
            >
              Slide Images
            </button>

            <button
              // onClick={() => {
              //   setShowModal(true);
              //   setMenuOpen(false);
              // }}
              onClick={() => {
                navigate("/addCard");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:-translate-x-0.5"
            >
              + Create Diary
            </button>

            <button
              onClick={() => {
                navigate("/timeline");
                setMenuOpen(false);
              }}
              className="text-right px-4 py-2 text-white text-sm font-medium cursor-pointer tracking-wide
  rounded-lg transition duration-300
  hover:bg-white/10 hover:text-red-300 hover:-translate-x-0.5"
            >
              Timeline
            </button>

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

      {/* --- TOOLBAR --- */}
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
                className="sm:w-4 sm:h-4 md:w-4.5 md:h-4.5"
              />
            </button>
          </div>
        </div>
      </section>

      {/* --- TIMELINE --- */}
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

      {/* --- TIMELINE DETAIL IMAGE --- */}
      {timelineDetail && timelineDetail.image?.url ? (
        <section className="max-w-7xl mx-auto px-6 mb-8">
          <div className="bg-white rounded-2xl shadow">
            <img
              src={timelineDetail.image.url}
              alt="timeline"
              onClick={() => setLightboxOpen(true)}
              className="w-full max-h-100 object-cover rounded-xl cursor-pointer"
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

      {/* --- CARDS --- */}
      <section className="py-8 px-6 max-w-7xl mx-auto min-h-100">
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
            <p className="text-gray-500">
              {searchText.trim() ? "No results found." : "No entries yet."}
            </p>
          </div>
        ) : (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activeCards.map((c) => c._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {activeCards.map((card) => (
                    <CardItem key={card._id} id={card._id} card={card} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Pagination */}
            <div className="mt-16 flex flex-col items-center gap-4">
              <p className="text-sm text-gray-500">
                Page <span className="text-gray-900">{activeCurrentPage}</span>{" "}
                of <span className="text-gray-900">{activeTotalPages}</span>
              </p>

              {activeCurrentPage < activeTotalPages && (
                <button
                  onClick={handleLoadMore}
                  disabled={activeLoading}
                  title="Load More"
                  className="px-8 py-3 bg-white border cursor-pointer border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  {activeLoading ? "Loading..." : "Load More"}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
