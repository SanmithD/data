/* eslint-disable react-hooks/set-state-in-effect */
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Image as ImageIcon,
  Pen,
  Save,
  Trash,
  UploadCloud,
  X,
} from "lucide-react";

import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import AddCardModal from "../components/AddCardModal";
import CardItem from "../components/CardItem";
import RichTextEditor from "../components/RichTextEditor";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";
import { usePageTitleStore } from "../store/usePageTitleStore";

export default function CardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    url: "",
    image: "",
    timelineId: 0,
  });

  // Card store
  const {
    cardDetails,
    fetchCardById,
    childCards,
    fetchChildCards,
    updateCard,
    totalChildren,
    loading,
    reorderChildCards,
  } = useCardStore();

  // Timeline store
  const { timelineCards, fetchTimelineCards } = useTimelineCardStore();

  const {
    pageTitles,
    fetchPageTitles,
    createPageTitle,
    updatePageTitle,
    deletePageTitle,
  } = usePageTitleStore();

  const [editingTitleId, setEditingTitleId] = useState(null);
  const [titleInput, setTitleInput] = useState("");

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

  // Fetch timelines
  useEffect(() => {
    fetchTimelineCards();
  }, [fetchTimelineCards]);

  // Sync edit form with cardDetails
  useEffect(() => {
    if (cardDetails && isEditing) {
      setEditFormData({
        title: cardDetails.title || "",
        description: cardDetails.description || "",
        category: cardDetails.category || "",
        url: cardDetails.url || "",
        image: cardDetails.image || "",
        timelineId: cardDetails.timelineId || 0,
      });
    }
  }, [cardDetails, isEditing]);

  useEffect(() => {
    if (id) {
      fetchPageTitles(id); // 👈 parentCardId = current card
    }
  }, [id, fetchPageTitles]);

  // Handle load more
  const handleLoadMoreChildren = () => {
    if (!loading && childCards.length < totalChildren) {
      const nextPage = childPage + 1;
      setChildPage(nextPage);
      fetchChildCards(id, nextPage, 10, true);
    }
  };

  // Save edit
  const handleSaveEdit = async () => {
    await updateCard(id, editFormData);
    setIsEditing(false);
  };

  const handleFormChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processImageFile(files[0]);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) processImageFile(files[0]);
  };

  const processImageFile = (file) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setEditFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Export functions
  const exportToExcel = () => {
    const data = childCards.map((card) => ({
      Title: card.title,
      Description: card.description,
      Category: card.category,
      URL: card.url,
      Timeline: card.timelineId || "",
      CreatedAt: new Date(card.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sub Diaries");
    XLSX.writeFile(workbook, "sub_diaries.xlsx");
  };

  // const exportToPDF = () => {
  //   const doc = new jsPDF();
  //   const tableColumn = [
  //     "Title",
  //     "Description",
  //     "Category",
  //     "URL",
  //     "Timeline",
  //     "Created",
  //   ];
  //   const tableRows = [];

  //   childCards.forEach((card) => {
  //     tableRows.push([
  //       card.title,
  //       card.description,
  //       card.category,
  //       card.url,
  //       card.timelineId || "",
  //       new Date(card.createdAt).toLocaleDateString(),
  //     ]);
  //   });

  //   doc.text("Sub Diaries", 14, 15);
  //   autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20 });
  //   doc.save("sub_diaries.pdf");
  // };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = childCards.findIndex((c) => c._id === active.id);
    const newIndex = childCards.findIndex((c) => c._id === over.id);

    const newOrder = arrayMove(childCards, oldIndex, newIndex);

    reorderChildCards(newOrder); // 🔥 IMPORTANT
  };

  const handleAddTitle = async () => {
    if (!titleInput.trim()) return;

    // prevent multiple titles
    if (pageTitles.length > 0) return;

    await createPageTitle({
      title: titleInput,
      parentCardId: id,
    });

    setEditingTitleId(null);
    setTitleInput("");
  };

  const handleUpdateTitle = async (titleId) => {
    if (!titleInput.trim()) return;

    await updatePageTitle(titleId, { title: titleInput });

    setEditingTitleId(null);
    setTitleInput("");
  };

  const handleDeleteTitle = async (titleId) => {
    if (confirm("Delete this title?")) {
      await deletePageTitle(titleId);

      // fallback to default
      setEditingTitleId(null);
      setTitleInput("");
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
        {!isEditing ? (
          <>
            {cardDetails.image && (
              <div className="relative">
                <img
                  src={cardDetails.image}
                  alt={cardDetails.title}
                  className="w-full h-64 md:h-96 object-cover pointer-events-auto"
                />
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className={`absolute z-50 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-md text-gray-600 hover:text-blue-600 hover:bg-white transition ${
                cardDetails.image ? "top-4 right-4" : "top-6 right-6"
              }`}
              title="Edit Card"
            >
              <Edit size={20} />
            </button>

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
          </>
        ) : (
          // Edit Mode
          <div className="p-6 md:p-10 bg-gray-50">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <Edit size={24} /> Edit Card Details
            </h2>
            <div className="space-y-6">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Image
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[200px] ${
                    isDragging
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                  />

                  {editFormData.image ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                      <img
                        src={editFormData.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium flex items-center gap-2">
                          <UploadCloud size={20} /> Click or drag to replace
                        </span>
                      </div>
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      <ImageIcon
                        size={48}
                        className="mx-auto mb-3 text-gray-400"
                      />
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload or drag & drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        SVG, PNG, JPG or GIF
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={editFormData.title}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                {/* <textarea
                  name="description"
                  value={editFormData.description}
                  onChange={handleFormChange}
                  rows="4"
                  className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                /> */}
                <RichTextEditor
                  value={editFormData.description}
                  onChange={handleFormChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editFormData.category}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    External Link URL
                  </label>
                  <input
                    type="text"
                    name="url"
                    value={editFormData.url}
                    onChange={handleFormChange}
                    placeholder="https://example.com"
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-gray-300"
                  />
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeline
                  </label>
                  <select
                    name="timelineId"
                    value={editFormData.timelineId}
                    onChange={(e) =>
                      setEditFormData((prev) => ({
                        ...prev,
                        timelineId: Number(e.target.value),
                      }))
                    }
                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={0}>Select Timeline</option>
                    {timelineCards.map((t) => (
                      <option key={t._id} value={t.id}>
                        {t.timeline}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 border-t pt-6">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition font-medium shadow-sm"
              >
                <Save size={18} /> Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                <X size={18} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Cards */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 justify-between mb-4">
            {/* LEFT SIDE */}
            <div className="flex items-center gap-3">
              {editingTitleId ? (
                <input
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="border p-2 rounded"
                  placeholder="Enter title"
                />
              ) : (
                <h2 className="text-2xl font-bold text-gray-800">
                  {pageTitles.length > 0 ? pageTitles[0].title : "Sub Diaries"}
                </h2>
              )}
            </div>

            {/* RIGHT SIDE ACTIONS */}
            <div className="flex gap-2">
              {editingTitleId ? (
                <button
                  onClick={() =>
                    pageTitles.length > 0
                      ? handleUpdateTitle(pageTitles[0]._id)
                      : handleAddTitle()
                  }
                  className="text-green-600 cursor-pointer font-medium"
                >
                  <Save size={18} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    setEditingTitleId(true);
                    setTitleInput(
                      pageTitles.length > 0 ? pageTitles[0].title : "",
                    );
                  }}
                  className="text-blue-600 cursor-pointer"
                >
                  <Pen size={18} />
                </button>
              )}

              {pageTitles.length > 0 && !editingTitleId && (
                <button
                  onClick={() => handleDeleteTitle(pageTitles[0]._id)}
                  className="text-red-600 cursor-pointer"
                >
                  <Trash size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export Excel
            </button>

            {/* <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Export PDF
            </button> */}

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Sub Diary
            </button>
          </div>
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
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={childCards.map((c) => c._id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {childCards.map((subCard) => (
                    <CardItem
                      key={subCard._id}
                      id={subCard._id}
                      card={subCard}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

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
