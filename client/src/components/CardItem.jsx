import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CardItem({ card, id }) {
  const navigate = useNavigate();

  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, handle: true });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  useEffect(() => {
    console.log("Card:", card);
  }, []);

  const formattedDate = new Date(card.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const plainText = card.description.replace(/<[^>]+>/g, "");

  // Category color mapping for visual variance
  const categoryColors = {
    default: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
    Tech: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    Design: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
    Business: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    Science: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  };

  const catStyle =
    categoryColors[card.category] || categoryColors.default;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col h-full
        shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        transition-all duration-300 ease-out hover:-translate-y-0.5"
    >

      {/* Card Image */}
      {card.image && (
        <div
          className="relative w-full h-44 overflow-hidden cursor-pointer shrink-0"
          onClick={() => navigate(`/card/${card._id}`)}
        >
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Subtle gradient overlay at bottom of image */}
          <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
        </div>
      )}

      {/* Card Body */}
      <div className="flex flex-col grow p-5 gap-3">

        {/* Category Badge */}
        {card.category && (
          <div className="flex items-center gap-1.5 w-fit">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase ${catStyle.bg} ${catStyle.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${catStyle.dot}`} />
              {card.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h2
          className="text-[15px] font-bold text-gray-900 leading-snug cursor-pointer
            hover:text-blue-600 transition-colors duration-150 line-clamp-2"
          onClick={() => navigate(`/card/${card._id}`)}
          title="Title"
        >
          {card.title}
        </h2>

        {/* Description */}
        <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-3 flex-grow">
          {plainText}
        </p>

        {/* Meta Tags Row */}
        {(card?.start_time || card?.timelineData?.[0]?.timeline) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {card?.start_time && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-500"
              >
                <Clock size={10} strokeWidth={2.5} className="text-gray-400" />
                From {card.start_time} to {card.end_time || "?"}
              </span>
            )}
            {/* {card?.timelineData?.[0]?.timeline && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                bg-gray-50 border border-gray-100 text-[11px] font-medium text-gray-500">
                <GitBranch size={10} strokeWidth={2.5} className="text-gray-400" />
                Timeline {card.timelineData[0].timeline}
              </span>
            )} */}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-50 mt-auto pt-3" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Date */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
            <CalendarDays size={11} strokeWidth={2} />
            {formattedDate}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {card.url && (
              <a
                href={card.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500
                  hover:bg-blue-50 transition-all duration-150"
                title="Open link"
              >
                <ExternalLink size={14} strokeWidth={2} />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}