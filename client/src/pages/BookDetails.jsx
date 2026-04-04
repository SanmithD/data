import {
  AlignJustify,
  ArrowLeft,
  BookMarked,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Maximize2,
  Search,
  Tag,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { useBookStore } from "../store/useBookStore";
import { usePageStore } from "../store/usePageStore";
import useDocumentTitle from "../utils/useDocumentTitle";

export default function BookDetails() {
  useDocumentTitle("Book Details | NumisVault");

  const { bookId } = useParams();
  const navigate = useNavigate();

  const { fetchBooks } = useBookStore();
  const {
    currentPageData,
    fetchPageByNumber,
    fetchPageCount,
    totalPagesCount,
  } = usePageStore();

  const [bookDetails, setBookDetails] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [openLightbox, setOpenLightbox] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);
  const [loadingPage, setLoadingPage] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageInput, setPageInput] = useState("1");

  const loadBook = async (customSearchQuery = searchQuery) => {
    try {
      setLoadingPage(true);
      const data = await fetchBooks(
        "n",
        1,
        10,
        customSearchQuery,
        [
          {
            basicSearchKey: "id",
            basicSearchValue: Number(bookId),
            basicSearchType: "number",
          },
        ],
        [],
        { sortKey: "createdAt", sortType: -1 },
        false,
      );
      if (data?.books?.length > 0) setBookDetails(data.books[0]);
      await fetchPageCount(bookId);
      await fetchPageByNumber(bookId, 1);
      setCurrentPage(1);
      setPageInput("1");
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    if (bookId) loadBook();
  }, [bookId]);

  const goToPage = async (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPagesCount) return;
    setLoadingPage(true);
    setCurrentPage(pageNumber);
    setPageInput(String(pageNumber));
    await fetchPageByNumber(bookId, pageNumber);
    setLoadingPage(false);
  };

  const nextPage = () => {
    if (currentPage < totalPagesCount) goToPage(currentPage + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  };
  const handleTouchStart = (e) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) nextPage();
    if (diff < -50) prevPage();
  };

  const handlePageJump = async (e) => {
    e.preventDefault();
    const target = Number(pageInput);
    if (!target || target < 1 || target > totalPagesCount) return;
    await goToPage(target);
  };

  const progress =
    totalPagesCount > 0 ? (currentPage / totalPagesCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#fdf8f0] text-[#2d2416]">
      {/* ── Rich text styles ── */}
      <style>{`
        .book-content h1 { font-size: 1.65rem; font-weight: 800; color: #1a1208; margin: 0 0 0.9rem; line-height: 1.25; }
        .book-content h2 { font-size: 1.35rem; font-weight: 700; color: #1a1208; margin: 1.4rem 0 0.7rem; line-height: 1.3; }
        .book-content h3 { font-size: 1.15rem; font-weight: 700; color: #2d2416; margin: 1.2rem 0 0.5rem; }
        .book-content h4, .book-content h5, .book-content h6 { font-weight: 700; color: #2d2416; margin: 1rem 0 0.4rem; }
        .book-content p { margin: 0 0 1em; }
        .book-content p:last-child { margin-bottom: 0; }
        .book-content p:empty { display: none; }
        .book-content blockquote {
          border-left: 3px solid #d4a84b;
          margin: 1.4rem 0;
          padding: 0.75rem 1.25rem;
          background: #faf4e6;
          border-radius: 0 10px 10px 0;
          color: #6b5a3e;
          font-style: italic;
        }
        .book-content blockquote p { margin: 0; }
        .book-content ul { list-style: disc; padding-left: 1.6rem; margin: 0.8rem 0 1rem; }
        .book-content ol { list-style: decimal; padding-left: 1.6rem; margin: 0.8rem 0 1rem; }
        .book-content li { margin-bottom: 0.35rem; }
        .book-content strong, .book-content b { font-weight: 700; color: #1a1208; }
        .book-content em, .book-content i { font-style: italic; }
        .book-content a { color: #b45309; text-decoration: underline; }
        .book-content code { background: #f0e8d8; border-radius: 4px; padding: 0.1em 0.4em; font-size: 0.88em; font-family: monospace; color: #92400e; }
        .book-content pre { background: #f0e8d8; border-radius: 10px; padding: 1rem 1.2rem; overflow-x: auto; margin: 1.2rem 0; }
        .book-content pre code { background: none; padding: 0; font-size: 0.9em; }
        .book-content hr { border: none; border-top: 1px solid #e8dcc8; margin: 1.8rem 0; }
        .book-content img { max-width: 100%; border-radius: 8px; margin: 0.8rem 0; display: block; }
        .book-content table { width: 100%; border-collapse: collapse; margin: 1.2rem 0; font-size: 0.95em; }
        .book-content th, .book-content td { border: 1px solid #e8dcc8; padding: 0.5rem 0.9rem; text-align: left; }
        .book-content th { background: #faf4e6; font-weight: 700; }
        /* hide number input spinners */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* ── TOP NAV ── */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-gray-200 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-13 flex items-center gap-3 py-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition shrink-0"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate text-gray-900 leading-tight">
              {bookDetails?.title || "Loading…"}
            </h1>
            <p className="text-xs truncate text-gray-400 leading-tight">
              {bookDetails?.author}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 shrink-0">
            <BookOpen size={12} />
            {currentPage} / {totalPagesCount || 0}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-5 grid grid-cols-1 xl:grid-cols-[264px_1fr] gap-5">
        {/* ── SIDEBAR ── */}
        <aside className="xl:sticky xl:top-[60px] h-fit flex flex-col gap-3">
          {/* Book card */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <div className="relative group">
              {bookDetails?.cover_image?.url ? (
                <img
                  src={bookDetails.cover_image.url}
                  alt={bookDetails.title}
                  onClick={() => setOpenLightbox(true)}
                  className="w-full h-56 object-cover cursor-pointer"
                />
              ) : (
                <div className="w-full h-56 flex items-center justify-center bg-gray-100">
                  <BookMarked size={36} className="text-gray-300" />
                </div>
              )}
              <button
                onClick={() => setOpenLightbox(true)}
                className="absolute bottom-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 transition backdrop-blur-sm"
              >
                <Maximize2 size={11} /> Preview
              </button>
            </div>

            <div className="p-4">
              <h2 className="text-base font-bold leading-snug text-gray-900">
                {bookDetails?.title || "Untitled"}
              </h2>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                <User size={12} /> {bookDetails?.author || "Unknown Author"}
              </div>

              {bookDetails?.category && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 mt-2.5">
                  <Tag size={9} /> {bookDetails.category}
                </span>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl p-2.5 bg-amber-50 border border-amber-100">
                  <p className="text-xs text-gray-400 mb-0.5">Price</p>
                  <p className="text-sm font-bold flex items-center gap-0.5 text-amber-700">
                    <IndianRupee size={12} />
                    {bookDetails?.price?.toLocaleString("en-IN") || 0}
                  </p>
                </div>
                <div className="rounded-xl p-2.5 bg-blue-50 border border-blue-100">
                  <p className="text-xs text-gray-400 mb-0.5">Pages</p>
                  <p className="text-sm font-bold flex items-center gap-1 text-blue-700">
                    <BookOpen size={12} />
                    {totalPagesCount || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation controls */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3">
              Navigation
            </p>

            <div className="flex flex-col gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadBook(searchQuery)}
                  placeholder="Search book…"
                  className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition text-gray-800 placeholder-gray-400"
                />
              </div>

              {/* Go to page */}
              <form onSubmit={handlePageJump} className="flex gap-1.5">
                <input
                  type="number"
                  min="1"
                  max={totalPagesCount || 1}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  placeholder="Page no."
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition text-gray-800"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition shrink-0"
                >
                  Go
                </button>
              </form>

              {/* Progress bar */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Progress</span>
                  <span className="text-xs font-bold text-amber-600">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Prev / Next */}
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  onClick={prevPage}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={13} /> Prev
                </button>
                <button
                  onClick={nextPage}
                  disabled={currentPage === totalPagesCount}
                  className="flex items-center justify-center gap-1 py-2 text-xs font-semibold rounded-lg bg-gray-900 text-white hover:bg-black transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* ── READER ── */}
        <main className="min-w-0">
          <div className="relative">
            {/* Floating side arrows (desktop) */}
            <div className="absolute inset-y-0 left-0 hidden lg:flex items-center -translate-x-6 z-10 pointer-events-none">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="pointer-events-auto w-10 h-10 rounded-full border border-gray-200 bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition disabled:opacity-25 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={17} />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 hidden lg:flex items-center translate-x-6 z-10 pointer-events-none">
              <button
                onClick={nextPage}
                disabled={currentPage === totalPagesCount}
                className="pointer-events-auto w-10 h-10 rounded-full border border-gray-200 bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition disabled:opacity-25 disabled:cursor-not-allowed"
              >
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Book paper */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="bg-[#fffdf8] border border-[#e8dcc8] rounded-3xl overflow-hidden shadow-xl"
            >
              {/* Paper header */}
              <div className="px-8 md:px-12 py-3.5 border-b border-[#e8dcc8] bg-[#faf4e6] flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <BookMarked size={11} className="text-[#c8a96e] shrink-0" />
                  <span className="text-sm font-semibold text-[#1a1208] truncate">
                    {currentPageData?.title || bookDetails?.title || ""}
                  </span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-gray-400 shrink-0">
                  {currentPage} of {totalPagesCount || 0}
                </span>
              </div>

              {/* Content */}
              <div className="px-8 md:px-14 lg:px-20 py-10 md:py-12 min-h-[62vh]">
                {loadingPage ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <div className="w-9 h-9 rounded-full border-4 border-gray-200 border-t-amber-500 animate-spin" />
                    <p className="text-sm text-gray-400">Loading page…</p>
                  </div>
                ) : currentPageData ? (
                  <article
                    className={`book-content max-w-none text-[#2d2416]`}
                    style={{
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                    dangerouslySetInnerHTML={{
                      __html: currentPageData.content || "",
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-300">
                    <AlignJustify size={34} />
                    <p className="text-sm font-medium">
                      No content on this page.
                    </p>
                  </div>
                )}
              </div>

              {/* Paper footer */}
              <div className="px-8 md:px-12 py-3.5 border-t border-[#e8dcc8] bg-[#faf4e6] flex items-center justify-between">
                <span className="text-xs text-gray-400 truncate max-w-[50%]">
                  {bookDetails?.author}
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPagesCount, 9) }).map(
                      (_, i) => {
                        const isActive =
                          i ===
                          Math.min(
                            Math.floor(
                              (currentPage / totalPagesCount) *
                                Math.min(totalPagesCount, 9),
                            ),
                            Math.min(totalPagesCount, 9) - 1,
                          );
                        return (
                          <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${isActive ? "w-4 bg-amber-500" : "w-1.5 bg-gray-200"}`}
                          />
                        );
                      },
                    )}
                  </div>
                  <span className="text-xs font-medium tabular-nums text-gray-400">
                    pg. {currentPage}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom navigation */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 shadow-sm transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={15} /> Previous
            </button>

            <span className="text-sm font-medium tabular-nums text-gray-500">
              {currentPage}{" "}
              <span className="text-gray-300">/ {totalPagesCount || 0}</span>
            </span>

            <button
              onClick={nextPage}
              disabled={currentPage === totalPagesCount}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gray-900 hover:bg-black text-white text-sm font-semibold shadow-sm transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </main>
      </div>

      <Lightbox
        open={openLightbox}
        close={() => setOpenLightbox(false)}
        slides={
          bookDetails?.cover_image?.url
            ? [{ src: bookDetails.cover_image.url }]
            : []
        }
      />
    </div>
  );
}
