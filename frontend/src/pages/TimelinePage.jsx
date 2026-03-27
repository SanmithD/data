import { useEffect, useState } from "react";
import { useTimelineCardStore } from "../store/timelineCardStore";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, X, Move } from "lucide-react";
import { useNavigate } from "react-router-dom";

// DnD Kit
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

/* ================= SORTABLE ITEM ================= */
function SortableItem({ card, openModal, handleDelete, movingId }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: card?._id || "" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: movingId === card?._id ? 0.5 : 1,
  };

  if (!card) return null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex justify-between items-center bg-white p-5 rounded-xl shadow hover:shadow-lg transition"
    >
      <div className="flex items-center gap-4">
        <div>
          <p className="text-gray-800 font-semibold text-lg">{card.timeline}</p>

          {card.note && (
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {card.note}
            </p>
          )}
        </div>

        <div>
          {card.timeline_image?.length > 0 &&
            card.timeline_image[0]?.image?.url && (
              <div>
                <img
                  src={card.timeline_image[0].image.url}
                  alt="image"
                  className="w-16 h-16 object-cover rounded-lg"
                />
              </div>
            )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => openModal(card)}
          className="p-2 bg-yellow-100 text-yellow-600 rounded-lg"
        >
          <Pencil size={16} />
        </button>

        <button
          onClick={() => handleDelete(card._id)}
          className="p-2 bg-red-100 text-red-600 rounded-lg"
        >
          <Trash2 size={16} />
        </button>

        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-2 bg-blue-100 text-blue-600 rounded-lg"
        >
          <Move />
        </div>
      </div>
    </div>
  );
}

/* ================= MAIN PAGE ================= */
export default function TimelinePage() {
  const {
    timelineCards,
    fetchTimelineCards,
    createTimelineCard,
    updateTimelineCard,
    deleteTimelineCard,
    reorderTimeCards,
    loading,
  } = useTimelineCardStore();

  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  const [timeline, setTimeline] = useState("");
  const [note, setNote] = useState("");
  const [image, setImage] = useState("");

  const [movingId, setMovingId] = useState(null);

  useEffect(() => {
    fetchTimelineCards();
  }, []);

  /* ================= MODAL ================= */
  const openModal = (card = null) => {
    setEditingCard(card);
    setTimeline(card ? card.timeline : "");
    setNote(card?.note || "");
    setImage(card?.timeline_image?.[0]?.image?.url || "");
    setShowModal(true);
  };

  const closeModal = () => {
    setEditingCard(null);
    setTimeline("");
    setNote("");
    setImage("");
    setShowModal(false);
  };

  /* ================= IMAGE ================= */
  const handleImageChange = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result); // base64
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleImageChange(file);
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!timeline.trim()) {
      toast.error("Timeline is required");
      return;
    }

    try {
      if (editingCard) {
        await updateTimelineCard(editingCard._id, {
          timeline,
          note,
          image,
        });
        await fetchTimelineCards();
      } else {
        await createTimelineCard({
          timeline,
          note,
          image,
        });
        await fetchTimelineCards();
      }

      closeModal();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (confirm("Delete this timeline?")) {
      await deleteTimelineCard(id);
    }
  };

  /* ================= DND ================= */
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = timelineCards.findIndex((c) => c._id === active.id);
    const newIndex = timelineCards.findIndex((c) => c._id === over.id);

    const newOrder = arrayMove([...timelineCards], oldIndex, newIndex);

    setMovingId(active.id);
    await reorderTimeCards(newOrder);
    setMovingId(null);
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto mb-8 flex justify-between items-center">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded-md"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        <h1 className="text-3xl font-bold">Timeline Manager</h1>

        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg"
        >
          <Plus size={18} />
          Add Timeline
        </button>
      </div>

      {/* LIST */}
      <div className="max-w-5xl mx-auto space-y-4">
        {timelineCards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow border border-dashed">
            <p>No timelines yet</p>
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
                  movingId={movingId}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          <div className="bg-white p-6 rounded-xl w-full max-w-md z-10">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">
                {editingCard ? "Edit" : "Add"} Timeline
              </h2>
              <button onClick={closeModal}>
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* TIMELINE */}
              <input
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="Timeline"
                className="w-full border p-2 rounded"
              />

              {/* NOTE */}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Note"
                className="w-full border p-2 rounded"
              />

              {/* DRAG & DROP IMAGE */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed p-4 rounded text-center cursor-pointer"
              >
                <input
                  type="file"
                  onChange={(e) => handleImageChange(e.target.files[0])}
                  className="hidden"
                  id="imageUpload"
                />

                <label htmlFor="imageUpload" className="cursor-pointer">
                  Drag & drop image here or click to upload
                </label>
              </div>

              {/* PREVIEW */}
              {image && (
                <img
                  src={image}
                  className="h-32 mt-2 rounded object-cover w-full"
                />
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  {loading && "Loading..."}
                  {!loading && (editingCard ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
