import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCardSearchStore } from "../store/useCardSearchStore";
import CardItem from "./CardItem";

export default function CardSearch() {
  const { searchResults, currentPage, totalPages, loading, searchCards } =
    useCardSearchStore();

  const [searchText, setSearchText] = useState("");

  const sensors = useSensors(useSensor(PointerSensor));

  // Perform initial search or reset
  useEffect(() => {
    searchCards(1, 10, [], [], { sortKey: "position", sortType: 1 });
  }, []);

  // Load more results
  const handleLoadMore = () => {
    if (currentPage < totalPages && !loading) {
      searchCards(
        currentPage + 1,
        10,
        [
          {
            basicSearchKey: "title",
            basicSearchValue: searchText,
            basicSearchType: "regex-string",
          },
        ],
        [],
        { sortKey: "position", sortType: 1 },
        true,
      );
    }
  };

  // DnD reorder (optional for search)
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = searchResults.findIndex((c) => c._id === active.id);
    const newIndex = searchResults.findIndex((c) => c._id === over.id);

    const newCards = arrayMove(searchResults, oldIndex, newIndex);
    // Update local store (optional)
    useCardSearchStore.setState({ searchResults: newCards });
  };

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search cards..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="px-4 py-2 border rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          onClick={() =>
            searchCards(
              1,
              10,
              [
                {
                  basicSearchKey: "title",
                  basicSearchValue: searchText,
                  basicSearchType: "regex-string",
                },
              ],
              [],
              { sortKey: "position", sortType: 1 },
            )
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Search
        </button>

        {/* <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="position">Position</option>
          <option value="createdAt">Date</option>
          <option value="title">Title</option>
        </select>

        <select
          value={sortType}
          onChange={(e) => setSortType(Number(e.target.value))}
          className="px-4 py-2 border rounded-lg"
        >
          <option value={1}>Asc</option>
          <option value={-1}>Desc</option>
        </select> */}
      </div>

      {/* Cards Grid with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={searchResults.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchResults.map((card) => (
              <CardItem key={card._id} id={card._id} card={card} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Load More */}
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
            {loading ? "Loading..." : "Load More Results"}
          </button>
        </div>
      )}
    </div>
  );
}
