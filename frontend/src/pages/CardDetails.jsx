/* eslint-disable react-hooks/set-state-in-effect */
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import {
  ArrowLeft,
  ChevronDown,
  Edit,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Pen,
  RotateCcw,
  Save,
  Search,
  Trash,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import CardItem from "../components/CardItem";
import RichTextEditor from "../components/RichTextEditor";
import { useCardStore } from "../store/cardStore";
import { useTimelineCardStore } from "../store/timelineCardStore";
import { useCardSearchStore } from "../store/useCardSearchStore";
import { usePageTitleStore } from "../store/usePageTitleStore";

// ── Shared input class ───────────────────────────────────────────────────────
const inputCls =
  "w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl " +
  "placeholder:text-gray-400 outline-none transition-all " +
  "focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10";

export default function CardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ── Edit state ───────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    category: "",
    url: "",
    image: "",
    timelineId: 0,
  });

  // ── Search state ─────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");
  const [perPage, setPerPage] = useState(10);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // ── Stores ───────────────────────────────────────────────────────────────
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

  const {
    searchResults,
    currentPage: searchPage,
    totalPages: searchTotalPages,
    loading: searchLoading,
    searchCards,
    clearSearch,
  } = useCardSearchStore();

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
  const [childPage, setChildPage] = useState(1);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (id) {
      setChildPage(1);
      fetchCardById(id);
      fetchChildCards(id, 1, perPage, false);
    }
  }, [id]); // eslint-disable-line

  useEffect(() => {
    fetchTimelineCards();
  }, [fetchTimelineCards]);

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
    if (id) fetchPageTitles(id);
  }, [id, fetchPageTitles]);

  // ── Search helpers ───────────────────────────────────────────────────────

  // Only includes fromTime/toTime when BOTH are filled
  const buildSearchPayload = ({ page: pg = 1, limit = perPage } = {}) => {
    const hasTimeRange = startTime.trim() !== "" && endTime.trim() !== "";
    
    return {
      searchQuery: searchText.trim() || undefined,
      page: pg,
      limit,
      searchDetails: [
        {
          basicSearchKey: "parentCard",
          basicSearchValue: id,
          basicSearchType: "string",
        },
      ],
      ...(hasTimeRange && {
        fromTime: startTime,
        toTime: endTime,
      }),
    };
  };

  const handleSearch = () => {
    setIsSearchActive(true);
    searchCards(buildSearchPayload({ page: 1 }));
  };

  const handleSearchReset = () => {
    setSearchText("");
    setStartTime("");
    setEndTime("");
    setIsSearchActive(false);
    clearSearch();
    setChildPage(1);
    fetchChildCards(id, 1, perPage, false);
  };

  const handlePerPageChange = (e) => {
    const newPerPage = Number(e.target.value);
    setPerPage(newPerPage);
    if (isSearchActive) {
      searchCards(buildSearchPayload({ page: 1, limit: newPerPage }));
    } else {
      setChildPage(1);
      fetchChildCards(id, 1, newPerPage, false);
    }
  };

  const displayedCards = isSearchActive ? (searchResults || []) : childCards;
  const isLoading = isSearchActive ? searchLoading : loading;
  const hasTimeRange = startTime.trim() !== "" && endTime.trim() !== "";
  const canSearch = searchText.trim() !== "" || hasTimeRange;

  // ── Load more ────────────────────────────────────────────────────────────
  const handleLoadMoreChildren = () => {
    if (!loading && childCards.length < totalChildren) {
      const nextPage = childPage + 1;
      setChildPage(nextPage);
      fetchChildCards(id, nextPage, perPage, true);
    }
  };

  // ── Edit handlers ────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    await updateCard(id, editFormData);
    setIsEditing(false);
  };

  const handleFormChange = (e) =>
    setEditFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageDragOver = (e) => { e.preventDefault(); setIsDraggingImage(true); };
  const handleImageDragLeave = (e) => { e.preventDefault(); setIsDraggingImage(false); };
  const handleImageDrop = (e) => {
    e.preventDefault();
    setIsDraggingImage(false);
    if (e.dataTransfer.files?.[0]) processImageFile(e.dataTransfer.files[0]);
  };
  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) processImageFile(e.target.files[0]);
  };

  const processImageFile = (file) => {
    if (!file.type.startsWith("image/")) { alert("Please upload a valid image file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("Image must be smaller than 5MB."); return; }
    const reader = new FileReader();
    reader.onloadend = () =>
      setEditFormData((prev) => ({ ...prev, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const removeImage = (e) => {
    e.stopPropagation();
    setEditFormData((prev) => ({ ...prev, image: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Export ───────────────────────────────────────────────────────────────
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

  // ── DnD ──────────────────────────────────────────────────────────────────
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = childCards.findIndex((c) => c._id === active.id);
    const newIndex = childCards.findIndex((c) => c._id === over.id);
    reorderChildCards(arrayMove(childCards, oldIndex, newIndex));
  };

  // ── Page title handlers ──────────────────────────────────────────────────
  const handleAddTitle = async () => {
    if (!titleInput.trim() || pageTitles.length > 0) return;
    await createPageTitle({ title: titleInput, parentCardId: id });
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
      setEditingTitleId(null);
      setTitleInput("");
    }
  };

  // ── Guard ────────────────────────────────────────────────────────────────
  if (!cardDetails) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500" size={36} />
      </div>
    );
  }

  const formattedDate = new Date(cardDetails.createdAt).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-6"
      >
        <ArrowLeft size={20} /> Back
      </button>

      {/* ── Card Details ── */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 mb-10 relative">
        {!isEditing ? (
          <>
            {cardDetails.image && (
              <div className="relative">
                <img
                  src={cardDetails.image}
                  alt={cardDetails.title}
                  onClick={() => setLightboxOpen(true)}
                  className="w-full h-64 md:h-96 object-cover cursor-pointer"
                />
                <Lightbox
                  open={lightboxOpen}
                  close={() => setLightboxOpen(false)}
                  slides={[{ src: cardDetails.image }]}
                />
              </div>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className={`absolute z-50 bg-white/90 backdrop-blur-sm p-2.5 rounded-full shadow-md
                text-gray-600 hover:text-blue-600 hover:bg-white transition
                ${cardDetails.image ? "top-4 right-4" : "top-6 right-6"}`}
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
                  <span className="bg-blue-100 text-blue-800 text-sm font-bold px-4 py-1.5 rounded-full shrink-0 ml-4">
                    {cardDetails.category}
                  </span>
                )}
              </div>

              <div
                className="prose max-w-none mb-4"
                dangerouslySetInnerHTML={{ __html: cardDetails.description }}
              />

              {cardDetails.timelineId && (
                <p className="text-gray-500 mb-2">
                  Timeline:{" "}
                  <span className="font-medium text-gray-700">
                    {timelineCards.find((t) => t.id === cardDetails.timelineId)?.timeline || "N/A"}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 border-t pt-6 mt-4">
                <p>
                  Created on:{" "}
                  <span className="font-semibold text-gray-700">{formattedDate}</span>
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
          // ── Edit Mode ────────────────────────────────────────────────────
          <div className="p-6 md:p-10 bg-gray-50">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <Edit size={24} /> Edit Card Details
            </h2>

            <div className="space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Image
                </label>
                <div
                  onDragOver={handleImageDragOver}
                  onDragLeave={handleImageDragLeave}
                  onDrop={handleImageDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center
                    justify-center cursor-pointer transition-colors min-h-50
                    ${isDraggingImage ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:bg-gray-100"}`}
                >
                  <input
                    type="file" accept="image/*" hidden
                    ref={fileInputRef} onChange={handleFileSelect}
                  />
                  {editFormData.image ? (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden group">
                      <img
                        src={editFormData.image} alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center
                        opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <ImageIcon size={48} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-sm font-medium text-gray-700">Click to upload or drag & drop</p>
                      <p className="text-xs text-gray-400 mt-1">SVG, PNG, JPG or GIF · Max 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                <input
                  type="text" name="title" value={editFormData.title}
                  onChange={handleFormChange} className={inputCls}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <RichTextEditor
                  value={editFormData.description}
                  onChange={(content) =>
                    setEditFormData((prev) => ({ ...prev, description: content }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text" name="category" value={editFormData.category}
                    onChange={handleFormChange} className={inputCls}
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">External Link</label>
                  <input
                    type="text" name="url" value={editFormData.url}
                    onChange={handleFormChange} placeholder="https://example.com"
                    className={inputCls}
                  />
                </div>

                {/* Timeline */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Timeline</label>
                  <div className="relative">
                    <select
                      name="timelineId"
                      value={editFormData.timelineId}
                      onChange={(e) =>
                        setEditFormData((prev) => ({ ...prev, timelineId: Number(e.target.value) }))
                      }
                      className={`${inputCls} appearance-none pr-8`}
                    >
                      <option value={0}>Select Timeline</option>
                      {timelineCards.map((t) => (
                        <option key={t._id} value={t.id}>{t.timeline}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 border-t pt-6">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl
                  hover:bg-green-700 transition font-medium shadow-sm"
              >
                <Save size={18} /> Save Changes
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700
                  px-6 py-2.5 rounded-xl hover:bg-gray-50 transition font-medium"
              >
                <X size={18} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Sub-Cards Section ── */}
      <div className="mt-12">

        {/* Section header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          {/* Title + inline edit */}
          <div className="flex items-center gap-3">
            {editingTitleId ? (
              <input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter title"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-800">
                {pageTitles.length > 0 ? pageTitles[0].title : "Sub Diaries"}
              </h2>
            )}

            {editingTitleId ? (
              <button
                onClick={() =>
                  pageTitles.length > 0
                    ? handleUpdateTitle(pageTitles[0]._id)
                    : handleAddTitle()
                }
                className="text-green-600 hover:text-green-700 cursor-pointer"
              >
                <Save size={18} />
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingTitleId(true);
                  setTitleInput(pageTitles.length > 0 ? pageTitles[0].title : "");
                }}
                className="text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <Pen size={18} />
              </button>
            )}

            {pageTitles.length > 0 && !editingTitleId && (
              <button
                onClick={() => handleDeleteTitle(pageTitles[0]._id)}
                className="text-red-500 hover:text-red-600 cursor-pointer"
              >
                <Trash size={18} />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 text-sm font-medium transition"
            >
              Export Excel
            </button>
            <button
              onClick={() => navigate(`/addCard/${id}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium transition"
            >
              + Add Sub Diary
            </button>
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 space-y-4">

          {/* Row 1: Search input + per-page + buttons */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search sub-cards…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className={`${inputCls} pl-9`}
              />
            </div>

            <div className="relative w-full md:w-40">
              <select
                value={perPage}
                onChange={handlePerPageChange}
                className={`${inputCls} appearance-none pr-8`}
              >
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <button
              onClick={handleSearch}
              disabled={!canSearch}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white
                text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50
                disabled:cursor-not-allowed transition shadow-sm whitespace-nowrap"
            >
              <Search size={14} /> Search
            </button>

            {isSearchActive && (
              <button
                onClick={handleSearchReset}
                title="Clear search"
                className="flex items-center justify-center px-3.5 py-2.5 bg-gray-100
                  text-gray-600 rounded-xl hover:bg-gray-200 transition"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>

          {/* Row 2: Time range — fromTime & toTime only sent when BOTH are filled */}
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                From Year
              </label>
              <input
                type="text"
                placeholder="e.g. -2000 (2000 BCE)"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={inputCls}
              />
            </div>

            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                To Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2024"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={inputCls}
              />
            </div>

            {/* Apply filter — disabled unless both time fields are filled */}
            <button
              onClick={handleSearch}
              disabled={!hasTimeRange}
              title={!hasTimeRange ? "Fill both From and To year to apply" : ""}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white
                text-sm font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-40
                disabled:cursor-not-allowed transition shadow-sm whitespace-nowrap"
            >
              Apply Filter
            </button>
          </div>

          {/* Active filter pills */}
          {isSearchActive && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
              {searchText.trim() && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium
                  bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                  Query: "{searchText}"
                </span>
              )}
              {hasTimeRange && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium
                  bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                  Years: {startTime} → {endTime}
                </span>
              )}
              <span className="text-xs text-gray-400">
                {displayedCards.length} result{displayedCards.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleSearchReset}
                className="text-xs text-red-500 hover:underline font-medium ml-auto"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ── Cards grid ── */}
        {isLoading && displayedCards.length === 0 ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : displayedCards.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 mb-3">
              {isSearchActive ? "No results found for your search." : "No sub-cards found."}
            </p>
            {!isSearchActive && (
              <button
                onClick={() => navigate(`/addCard/${id}`)}
                className="text-blue-600 font-medium hover:underline text-sm"
              >
                Add the first sub-card
              </button>
            )}
          </div>
        ) : (
          <>
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={childCards.map((c) => c._id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedCards.map((subCard) => (
                    <CardItem key={subCard._id} id={subCard._id} card={subCard} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Load more — normal mode only */}
            {!isSearchActive && childCards.length < totalChildren && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={handleLoadMoreChildren}
                  disabled={loading}
                  className={`px-8 py-3 font-bold rounded-xl transition-all shadow-md ${
                    loading
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-lg"
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Loading…
                    </span>
                  ) : (
                    "Load More Sub-Cards"
                  )}
                </button>
              </div>
            )}

            {/* Search pagination */}
            {isSearchActive && searchTotalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  disabled={searchPage <= 1 || searchLoading}
                  onClick={() => searchCards(buildSearchPayload({ page: searchPage - 1 }))}
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl
                    hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 px-3">
                  Page {searchPage} of {searchTotalPages}
                </span>
                <button
                  disabled={searchPage >= searchTotalPages || searchLoading}
                  onClick={() => searchCards(buildSearchPayload({ page: searchPage + 1 }))}
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl
                    hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}