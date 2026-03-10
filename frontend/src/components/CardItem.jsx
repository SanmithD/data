import { ExternalLink, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCardStore } from "../store/cardStore";

export default function CardItem({ card }) {
  const navigate = useNavigate();
  const deleteCard = useCardStore((s) => s.deleteCard);

  // Format the date to a readable format
  const formattedDate = new Date(card.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      
      {/* Card Image */}
      {card.image && (
        <div 
          className="w-full h-48 overflow-hidden cursor-pointer"
          onClick={() => navigate(`/card/${card._id}`)}
        >
          <img 
            src={card.image} 
            alt={card.title} 
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-grow">
        
        {/* Header: Title & Category */}
        <div className="flex justify-between items-start mb-3 gap-2">
          <h2
            className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors line-clamp-2"
            onClick={() => navigate(`/card/${card._id}`)}
          >
            {card.title}
          </h2>
          {card.category && (
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
              {card.category}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 flex-grow line-clamp-3">
          {card.description}
        </p>

        {/* Footer: Date, Link, and Delete */}
        <div className="flex items-center justify-between pt-4 mt-auto border-t border-gray-100">
          <div className="flex items-center gap-4">
            {/* Date */}
            <span className="text-xs text-gray-400 font-medium">
              {formattedDate}
            </span>

            {/* External URL */}
            {card.url && (
              <a 
                href={card.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-500 transition-colors"
                title="Visit link"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>

          {/* Delete Button */}
          <button
            onClick={() => deleteCard(card._id)}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
            title="Delete Card"
          >
            <Trash size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}