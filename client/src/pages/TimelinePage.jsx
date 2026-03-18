import { useEffect, useState } from "react";
import { useTimelineCardStore } from "../store/timelineCardStore";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown, Move } from "lucide-react";
import { useNavigate } from "react-router-dom";

// DnD Kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Sortable Item Component ---
function SortableItem({ card, openModal, handleDelete, movingId }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: movingId === card._id ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex justify-between items-center bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
    >
      <div>
        <p className="text-gray-800 font-semibold text-lg">{card.timeline}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => openModal(card)}
          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition"
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={() => handleDelete(card._id)}
          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
        >
          <Trash2 size={16} />
        </button>

        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 bg-blue-100 text-blue-600 rounded-lg"
        >
          <Move/>
        </div>
      </div>
    </div>
  );
}

// --- Timeline Page ---
export default function TimelinePage() {
  const {
    timelineCards,
    fetchTimelineCards,
    createTimelineCard,
    updateTimelineCard,
    deleteTimelineCard,
    reorderTimeCards,
  } = useTimelineCardStore();

  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [timeline, setTimeline] = useState("");
  const [movingId, setMovingId] = useState(null);

  useEffect(() => {
    fetchTimelineCards();
  }, [fetchTimelineCards]);

  const openModal = (card = null) => {
    setEditingCard(card);
    setTimeline(card ? card.timeline : "");
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingCard(null);
    setTimeline("");
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!timeline.trim()) {
      toast.error("Timeline is required");
      return;
    }

    try {
      if (editingCard) {
        await updateTimelineCard(editingCard._id, { timeline });
      } else {
        await createTimelineCard({ timeline });
      }
      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this timeline?")) {
      await deleteTimelineCard(id);
    }
  };

  // --- DnD Kit setup ---
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = timelineCards.findIndex((c) => c._id === active.id);
    const newIndex = timelineCards.findIndex((c) => c._id === over.id);

    const newOrder = arrayMove([...timelineCards], oldIndex, newIndex);
    setMovingId(active.id); // show moving state
    await reorderTimeCards(newOrder);
    setMovingId(null);
  };

  // --- Move buttons logic ---
  const moveCard = async (id, direction) => {
    const index = timelineCards.findIndex((c) => c._id === id);
    let newIndex = index;

    if (direction === "up" && index > 0) newIndex = index - 1;
    if (direction === "down" && index < timelineCards.length - 1)
      newIndex = index + 1;

    if (newIndex !== index) {
      setMovingId(id);
      const newOrder = arrayMove([...timelineCards], index, newIndex);
      await reorderTimeCards(newOrder);
      setMovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button
        className="px-3 py-1 rounded-md bg-blue-500 cursor-pointer text-white"
        onClick={() => navigate(-1)}
      >
        Back
      </button>

      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Timeline Manager</h1>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow hover:scale-105 transition"
        >
          <Plus size={18} />
          Add Timeline
        </button>
      </div>

      {/* Timeline List */}
      <div className="max-w-5xl mx-auto space-y-4">
        {timelineCards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow border border-dashed">
            <p className="text-gray-500 mb-3">No timelines yet</p>
            <button
              onClick={() => openModal()}
              className="text-blue-600 hover:underline"
            >
              Create your first timeline
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={timelineCards.map((c) => c._id)}
              strategy={verticalListSortingStrategy}
            >
              {timelineCards.map((card) => (
                <SortableItem
                  key={card._id}
                  card={card}
                  openModal={openModal}
                  handleDelete={handleDelete}
                  moveCard={moveCard}
                  movingId={movingId}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 z-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCard ? "Edit Timeline" : "Add Timeline"}
              </h2>
              <button onClick={closeModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Timeline
                </label>
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  placeholder="e.g. 1500-600-300-0 (BCE)"
                  className="w-full mt-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCard ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
