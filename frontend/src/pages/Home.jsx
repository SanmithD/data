import { useEffect, useState } from "react";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem"; // <-- Import the new CardItem component
import { useCardStore } from "../store/cardStore";

export default function Home() {
  const { cards, fetchCards } = useCardStore();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Cards</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg 
                     hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
        >
          + New Card
        </button>
      </div>

      {/* Card List */}
      {cards.length === 0 ? (
        // Empty State
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">No cards found yet.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-blue-600 font-medium hover:underline"
          >
            Create your first card
          </button>
        </div>
      ) : (
        // Responsive Grid layout
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <CardItem key={card._id} card={card} />
          ))}
        </div>
      )}

      {/* Modal — only renders when showModal is true */}
      <AddCardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        parentId={null}
      />
    </div>
  );
}