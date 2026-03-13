import { useEffect, useState } from "react";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem";
import { useCardStore } from "../store/cardStore";

export default function Home() {
  // ✅ 1. Extract the new pagination variables and loading state from the store
  const { cards, fetchCards, currentPage, totalPages, loading } =
    useCardStore();
  const [showModal, setShowModal] = useState(false);

  // ✅ 2. Fetch the first page on component mount
  useEffect(() => {
    // (page: 1, limit: 10, append: false)
    fetchCards(1, 10, false);
  }, [fetchCards]);

  // ✅ 3. Function to handle loading the next page
  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      // Fetch next page and append to the existing cards array
      fetchCards(currentPage + 1, 10, true);
    }
  };

  return (
    <div className="font-sans text-gray-900">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Logo + Title */}
          <div className="flex items-center justify-center gap-4">
            <img
              src="/download.png"
              alt="logo"
              className="w-14 h-14 md:w-20 md:h-20 object-contain"
            />
            <h1 className="text-4xl md:text-6xl font-extrabold">My Diary</h1>
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto text-blue-100">
            Your diary. Organized, secure, and always at your fingertips.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => setShowModal(true)}
            className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:scale-105 hover:bg-gray-100 transition-all duration-200"
          >
            + Create New Diary
          </button>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">My Diaries</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
          >
            + New Diary
          </button>
        </div>

        {/* ✅ 4. Handle initial loading state */}
        {loading && cards.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-4">No cards found yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-blue-600 font-medium hover:underline"
            >
              Create your first Diary
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cards.map((card) => (
                <CardItem key={card._id} card={card} />
              ))}
            </div>

            {/* ✅ 5. Render "Load More" button if there are more pages */}
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

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center rounded-xl max-w-7xl mx-auto my-10">
        <h3 className="text-3xl font-bold mb-4">Ready to get started?</h3>
        <p className="mb-6 text-lg">
          Create your first Diary and see how easy it is to stay organized.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-lg shadow-lg hover:bg-gray-100 transition-all"
        >
          + Create Diary Now
        </button>
      </section>

      {/* Modal */}
      <AddCardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        parentId={null}
      />
    </div>
  );
}
