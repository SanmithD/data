/* eslint-disable react-hooks/set-state-in-effect */
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";
import { usePageTitleStore } from "../store/usePageTitleStore";

export default function CardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Card store
  const {
    cardDetails,
    fetchCardById,
    childCards,
    fetchChildCards,
    totalChildren,
    loading,
  } = useCardStore();

  const {
      pageTitles,
      fetchPageTitles
    } = usePageTitleStore();

  // Timeline store
  const { timelineCards, fetchTimelineCards } = useTimelineCardStore();

  // Local state to track page
  const [childPage, setChildPage] = useState(1);

  // Fetch card & first page of children on mount
  useEffect(() => {
    if (id) {
      setChildPage(1);
      fetchCardById(id);
      fetchChildCards(id, 1, 10, false);
    }
  }, [id, fetchCardById, fetchChildCards]);

  useEffect(() => {
    if (id) {
      fetchPageTitles(id); // 👈 parentCardId = current card
    }
  }, [id, fetchPageTitles]);

  // Fetch timelines
  useEffect(() => {
    fetchTimelineCards();
  }, [fetchTimelineCards]);

  // Handle load more
  const handleLoadMoreChildren = () => {
    if (!loading && childCards.length < totalChildren) {
      const nextPage = childPage + 1;
      setChildPage(nextPage);
      fetchChildCards(id, nextPage, 10, true);
    }
  };

  if (!cardDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-lg animate-pulse">
          Loading details...
        </p>
      </div>
    );
  }

  const formattedDate = new Date(cardDetails.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={20} /> Back
        </button>
      </div>

      {/* Card Details */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-10 relative">
        {cardDetails.image && (
          <div className="relative">
            <img
              src={cardDetails.image}
              alt={cardDetails.title}
              className="w-full h-64 md:h-96 object-cover pointer-events-auto"
            />
          </div>
        )}
        <div className="p-6 md:p-10">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800">
              {cardDetails.title}
            </h1>
            {cardDetails.category && (
              <span className="bg-blue-100 text-blue-800 text-sm font-bold px-4 py-1.5 rounded-full">
                {cardDetails.category}
              </span>
            )}
          </div>

          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: cardDetails.description }}
          />

          {cardDetails.timelineId && (
            <p className="text-gray-500 mb-2">
              Timeline:{" "}
              {timelineCards.find((t) => t.id === cardDetails.timelineId)
                ?.timeline || "N/A"}
            </p>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-6">
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
      </div>

      {/* Sub-Cards */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            {pageTitles.length > 0 ? pageTitles[0].title : "Sub Diaries"}
          </h2>
        </div>

        {loading && childCards.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : !childCards || childCards.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-3">No sub-cards found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Add the first sub-card
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {childCards.map((subCard) => (
                <CardItem key={subCard._id} card={subCard} />
              ))}
            </div>

            {childCards.length < totalChildren && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMoreChildren}
                  disabled={loading}
                  className={`px-8 py-3 font-bold rounded-lg transition-all shadow-md ${
                    loading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-lg"
                  }`}
                >
                  {loading ? "Loading..." : "Load More Sub-Cards"}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <AddCardModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setChildPage(1);
          fetchChildCards(id, 1, 10, false);
        }}
        parentId={cardDetails._id}
      />
    </div>
  );
}
