import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem";
import { useCardStore } from "../store/cardStore";

export default function CardDetails() {
  const { id } = useParams(); // Gets the card ID from the URL
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // FIXED: Changed currentCard to cardDetails to match your store!
  // Added childCards and fetchChildCards to properly load sub-cards
  const { cardDetails, fetchCardById, childCards, fetchChildCards } = useCardStore();

  // Fetch both the main card details and its children when the page loads
  useEffect(() => {
    if (id) {
      fetchCardById(id);
      fetchChildCards(id);
    }
  }, [id, fetchCardById, fetchChildCards]);

  // Loading state (using cardDetails now)
  if (!cardDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 text-lg animate-pulse">Loading details...</p>
      </div>
    );
  }

  // Format date
  const formattedDate = new Date(cardDetails.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 transition-colors"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* Main Card Details Section */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-10">
        {cardDetails.image && (
          <img 
            src={cardDetails.image} 
            alt={cardDetails.title} 
            className="w-full h-64 md:h-96 object-cover"
          />
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

          <p className="text-gray-600 text-lg mb-6 leading-relaxed">
            {cardDetails.description}
          </p>

          <div className="flex items-center gap-6 text-sm text-gray-500 border-t pt-6">
            <p>Created on: <span className="font-semibold text-gray-700">{formattedDate}</span></p>
            
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

      {/* Sub-Cards Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Sub-Cards</h2>
          
          {/* Add Sub-Card Button */}
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            + Add Sub-Card
          </button>
        </div>

        {/* Display Sub-cards Grid (Using childCards from the store) */}
        {!childCards || childCards.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-3">No sub-cards found.</p>
            <button onClick={() => setShowModal(true)} className="text-blue-600 font-medium hover:underline">
              Add the first sub-card
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {childCards.map((subCard) => (
              <CardItem key={subCard._id} card={subCard} />
            ))}
          </div>
        )}
      </div>

      {/* 
        Modal to Add Sub-Card 
      */}
      <AddCardModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          // Optional: Re-fetch the child cards when modal closes so the new card shows up immediately!
          fetchChildCards(id); 
        }}
        parentId={cardDetails._id} 
      />
    </div>
  );
}