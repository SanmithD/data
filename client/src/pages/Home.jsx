import { useEffect, useState } from "react";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";

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

  const [selectedTimeline, setSelectedTimeline] = useState(null);

  // DnD Sensors

  // Fetch cards and timelines on mount
  useEffect(() => {
    fetchCards(1, 10, false);
    fetchTimelineCards();
  }, [fetchCards, fetchTimelineCards]);

  // Timeline click handler
  const handleTimelineClick = (timeline) => {
    setSelectedTimeline(timeline.id); // use `id` field
    fetchCardsByTimeline(1, 10, false, timeline.id);
  };

  // Load more handler
  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      if (selectedTimeline) {
        fetchCardsByTimeline(currentPage + 1, 10, true, selectedTimeline);
      } else {
        fetchCards(currentPage + 1, 10, true);
      }
    }
  };

  return (
    <div className="font-sans text-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4">
            <img
              src="/download.png"
              alt="logo"
              className="w-14 h-14 md:w-20 md:h-20 object-contain"
            />
            <h1 className="text-4xl md:text-6xl font-extrabold">My Diary</h1>
          </div>
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-blue-100">
            Your diary. Organized, secure, and always at your fingertips.
          </p>
        </div>
      </section>

      {/* Timeline Filter Bar */}
      <section className="py-12 px-6 max-w-7xl mx-auto overflow-x-auto">
        <div className="relative min-w-max py-8 px-4">
          {/* Continuous Horizontal Background Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0 rounded-full" />

          <div className="flex items-center gap-24 relative z-10">
            {timelineCards
              .sort((a, b) => b.year - a.year) // sort descending
              .map((timeline) => {
                const isSelected = selectedTimeline === timeline.id;

                return (
                  <button
                    key={timeline.id}
                    onClick={() => handleTimelineClick(timeline)}
                    className="group relative flex flex-col items-center justify-center focus:outline-none"
                  >
                    {/* Year Label */}
                    <span
                      className={`absolute -top-10 whitespace-nowrap font-medium transition-all duration-300 ${
                        isSelected
                          ? "text-blue-600 scale-110"
                          : "text-gray-500 group-hover:text-blue-500"
                      }`}
                    >
                      {timeline.timeline}
                    </span>

                    {/* Node / Dot */}
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

            {/* Reset Button */}
            <button
              onClick={() => {
                fetchCards(1, 10, false);
                // ADD THIS: Clear the selected state so the blue dot resets
                setSelectedTimeline(null);
              }}
              className="absolute right-0 bg-gray-800 hover:bg-gray-700 text-white px-5 py-1.5 rounded-md font-semibold text-sm shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 z-10"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto">

        {loading && cards.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No cards found yet.</p>
          </div>
        ) : (
          <>
            {/* Drag-and-drop container */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cards.map((card) => (
                <CardItem key={card._id} id={card._id} card={card} />
              ))}
            </div>

            {/* Load More */}
            {currentPage < totalPages && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className={`px-8 py-3 font-bold rounded-lg transition-all shadow-md ${
                    loading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-lg"
                  }`}
                >
                  {loading ? "Loading more..." : "Load More Cards"}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
