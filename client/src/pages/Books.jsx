import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookStore } from "../store/useBookStore";
import { CATEGORIES } from "../utils/categories_list";
import useDocumentTitle from "../utils/useDocumentTitle";

export default function BooksAdmin() {
  useDocumentTitle("Manage Books | NumisVault");

  const { books, fetchBooks, loading } = useBookStore();
  const navigate = useNavigate();

  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Filter states
  const [isPublished, setIsPublished] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const buildSearchDetails = () => {
    const details = [];

    if (isPublished === 1) {
      details.push({
        basicSearchKey: "isPublished",
        basicSearchValue: 1,
        basicSearchType: "number",
      });
    } else if (isPublished === 2) {
      details.push({
        basicSearchKey: "isPublished",
        basicSearchValue: 0,
        basicSearchType: "number",
      });
    }

    if (selectedCategory) {
      details.push({
        basicSearchKey: "category",
        basicSearchValue: selectedCategory,
        basicSearchType: "string",
      });
    }

    if (authorFilter.trim()) {
      details.push({
        basicSearchKey: "author",
        basicSearchValue: authorFilter.trim(),
        basicSearchType: "string",
      });
    }

    if (priceMin !== "") {
      details.push({
        basicSearchKey: "price",
        basicSearchValue: Number(priceMin),
        basicSearchType: "number",
      });
    }

    if (priceMax !== "") {
      details.push({
        basicSearchKey: "price",
        basicSearchValue: Number(priceMax),
        basicSearchType: "number",
      });
    }

    return details;
  };

  const loadBooks = async (
    customPage = page,
    customLimit = limit,
    customSearch = searchQuery,
  ) => {
    try {
      const details = buildSearchDetails();
      await fetchBooks(
        "y",
        Number(customPage),
        customLimit,
        customSearch,
        details,
        [],
        { sortKey: "createdAt", sortType: -1 },
        false,
      );
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const handleApplyFilters = () => {
    setPage(1);
    loadBooks(1, limit, searchQuery);
  };

  const handleResetFilters = () => {
    setIsPublished(0);
    setSelectedCategory("");
    setAuthorFilter("");
    setPriceMin("");
    setPriceMax("");
    setSearchQuery("");
    setPage(1);
    setTimeout(() => loadBooks(1, limit, ""), 0);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1) return;
    setPage(newPage);
    loadBooks(newPage, limit, searchQuery);
  };

  const activeFilterCount = [
    isPublished !== 0,
    selectedCategory !== "",
    authorFilter !== "",
    priceMin !== "",
    priceMax !== "",
  ].filter(Boolean).length;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', 'Inter', sans-serif",
        background: "#f4f5f7",
      }}
      className="min-h-screen"
    >
      {/* TOP NAV */}
      <header
        style={{ background: "#fff", borderBottom: "1px solid #e5e7eb" }}
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            style={{ color: "#6b7280", fontSize: 13 }}
            className="flex items-center gap-1 hover:text-gray-900 transition"
          >
            <ChevronLeft size={15} /> Dashboard
          </button>
          <span style={{ color: "#d1d5db" }}>·</span>
          <div className="flex items-center gap-2">
            <BookOpen size={16} style={{ color: "#2563eb" }} />
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#111827",
                letterSpacing: "-0.02em",
              }}
            >
              Book Library
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "6px 12px",
              fontSize: 13,
              color: "#374151",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
            }}
            className="hover:bg-gray-50 transition"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeFilterCount > 0 && (
              <span
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "0 6px",
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <div className="flex" style={{ minHeight: "calc(100vh - 57px)" }}>
        {/* LEFT SIDEBAR FILTERS */}
        {sidebarOpen && (
          <aside
            style={{
              width: 256,
              minWidth: 256,
              background: "#fff",
              borderRight: "1px solid #e5e7eb",
              padding: "20px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 0,
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#374151",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Filters
              </span>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleResetFilters}
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: "none",
                    border: "none",
                  }}
                  className="hover:text-red-500 transition"
                >
                  <X size={12} /> Reset all
                </button>
              )}
            </div>

            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Search
              </label>
              <div style={{ position: "relative" }}>
                <Search
                  size={13}
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyFilters()}
                  placeholder="Title, keyword…"
                  style={{
                    width: "100%",
                    paddingLeft: 30,
                    paddingRight: 10,
                    paddingTop: 7,
                    paddingBottom: 7,
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#111827",
                  }}
                />
              </div>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f3f4f6",
                margin: "4px 0 16px",
              }}
            />

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f3f4f6",
                margin: "4px 0 16px",
              }}
            />

            {/* Category */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Category
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    color: selectedCategory === "" ? "#2563eb" : "#374151",
                    fontWeight: selectedCategory === "" ? 600 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ""}
                    onChange={() => setSelectedCategory("")}
                    style={{ accentColor: "#2563eb" }}
                  />
                  All Categories
                </label>
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      color: selectedCategory === cat ? "#2563eb" : "#374151",
                      fontWeight: selectedCategory === cat ? 600 : 400,
                    }}
                  >
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                      style={{ accentColor: "#2563eb" }}
                    />
                    {cat}
                  </label>
                ))}
              </div>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f3f4f6",
                margin: "4px 0 16px",
              }}
            />

            {/* Author */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Author
              </label>
              <input
                type="text"
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                placeholder="Author name…"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                  color: "#111827",
                }}
              />
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f3f4f6",
                margin: "4px 0 16px",
              }}
            />

            {/* Price Range */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Price Range (₹)
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Min"
                  style={{
                    width: "50%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#111827",
                  }}
                />
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Max"
                  style={{
                    width: "50%",
                    padding: "7px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                    color: "#111827",
                  }}
                />
              </div>
            </div>

            {/* Apply */}
            <button
              onClick={handleApplyFilters}
              style={{
                width: "100%",
                padding: "9px 0",
                borderRadius: 8,
                background: "#2563eb",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
              className="hover:opacity-90 transition"
            >
              <RefreshCcw size={13} />
              Apply Filters
            </button>

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f3f4f6",
                margin: "16px 0 12px",
              }}
            />

            {/* Results per page */}
            <div>
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9ca3af",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Per page
              </label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  loadBooks(page, Number(e.target.value), searchQuery);
                }}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#f9fafb",
                  fontSize: 13,
                  outline: "none",
                  color: "#374151",
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n} books
                  </option>
                ))}
              </select>
            </div>
          </aside>
        )}

        {/* MAIN CONTENT */}
        <main style={{ flex: 1, padding: "24px", overflow: "auto" }}>
          {/* STATS BAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                  margin: 0,
                }}
              >
                All Books
              </h2>
              <p style={{ fontSize: 13, color: "#6b7280", margin: "2px 0 0" }}>
                {books?.length > 0
                  ? `${books.length} result${books.length !== 1 ? "s" : ""} found`
                  : "No results"}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                style={{
                  padding: "6px 10px",
                  borderRadius: 7,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: page <= 1 ? "#d1d5db" : "#374151",
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <span
                style={{
                  fontSize: 13,
                  color: "#374151",
                  fontWeight: 500,
                  padding: "0 4px",
                }}
              >
                Page {page}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={!books || books.length < limit}
                style={{
                  padding: "6px 10px",
                  borderRadius: 7,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: !books || books.length < limit ? "#d1d5db" : "#374151",
                  cursor:
                    !books || books.length < limit ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          {/* BOOK GRID */}
          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  <div
                    style={{
                      height: 200,
                      background: "#f3f4f6",
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <div style={{ padding: 14 }}>
                    <div
                      style={{
                        height: 14,
                        borderRadius: 6,
                        background: "#f3f4f6",
                        marginBottom: 8,
                      }}
                    />
                    <div
                      style={{
                        height: 12,
                        borderRadius: 6,
                        background: "#f3f4f6",
                        width: "60%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : books?.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 16,
              }}
            >
              {books.map((book) => (
                <div
                  key={book.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    overflow: "hidden",
                    border: "1px solid #f0f1f3",
                    transition: "box-shadow 0.18s, transform 0.18s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(0,0,0,0.10)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Cover */}
                  <div
                    style={{
                      height: 200,
                      background: "#f3f4f6",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onClick={() => navigate(`/view-book/${book.id}`)}
                  >
                    {book.cover_image?.url ? (
                      <img
                        src={book.cover_image.url}
                        alt={book.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <BookOpen size={40} style={{ color: "#d1d5db" }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div onClick={() => navigate(`/view-book/${book.id}`)}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#111827",
                          letterSpacing: "-0.01em",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {book.title}
                      </h3>
                      <p
                        style={{
                          margin: "3px 0 0",
                          fontSize: 12,
                          color: "#6b7280",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {book.author}
                      </p>
                      {book.category && (
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 11,
                            color: "#9ca3af",
                          }}
                        >
                          {book.category}
                        </p>
                      )}
                      <p
                        style={{
                          margin: "8px 0 0",
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#2563eb",
                        }}
                      >
                        ₹{book.price?.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 340,
                gap: 12,
              }}
            >
              <div
                style={{
                  background: "#f3f4f6",
                  borderRadius: 16,
                  padding: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <BookOpen size={36} style={{ color: "#9ca3af" }} />
              </div>
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#374151",
                  margin: 0,
                }}
              >
                No books found
              </p>
            </div>
          )}

          {/* PAGINATION FOOTER */}
          {books?.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 32,
              }}
            >
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: page <= 1 ? "#d1d5db" : "#374151",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <span
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {page}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={books.length < limit}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: books.length < limit ? "#d1d5db" : "#374151",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: books.length < limit ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
