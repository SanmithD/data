import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Maximize2,
  RefreshCcw,
  Search,
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

  const [limit, setLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageInput, setPageInput] = useState("1");

  const loadBook = async (
    customSearchQuery = searchQuery,
    customLimit = limit,
  ) => {
    try {
      setLoadingPage(true);

      const data = await fetchBooks(
        "n",
        1,
        customLimit,
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

      if (data?.books?.length > 0) {
        setBookDetails(data.books[0]);
      }

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

  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50) nextPage();
    if (diff < -50) prevPage();
  };

  const handleApplyFilters = async () => {
    await loadBook(searchQuery, Number(limit));
  };

  const handlePageJump = async (e) => {
    e.preventDefault();
    const targetPage = Number(pageInput);
    if (!targetPage || targetPage < 1 || targetPage > totalPagesCount) return;
    await goToPage(targetPage);
  };

  const progress =
    totalPagesCount > 0 ? (currentPage / totalPagesCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-gray-800">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 backdrop-blur-md bg-white/80 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="min-w-0">
              <h1 className="text-sm md:text-base font-semibold truncate">
                {bookDetails?.title || "Loading book..."}
              </h1>
              <p className="text-xs text-gray-500 truncate">
                {bookDetails?.author || "Author"}
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 text-sm text-gray-600">
            <span className="px-3 py-1 rounded-full bg-gray-100">
              Page {currentPage} / {totalPagesCount || 0}
            </span>
          </div>
        </div>

        <div className="h-1 w-full bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="xl:sticky xl:top-24 h-fit space-y-6">
          <div className="bg-white/90 border border-black/5 shadow-sm rounded-3xl overflow-hidden">
            <div className="p-5">
              <div className="relative group">
                <img
                  src={bookDetails?.cover_image?.url}
                  alt={bookDetails?.title || "Book Cover"}
                  onClick={() => setOpenLightbox(true)}
                  className="w-full h-[380px] object-cover rounded-2xl cursor-pointer shadow-md"
                />
                <button
                  onClick={() => setOpenLightbox(true)}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-black/70 text-white text-xs opacity-0 group-hover:opacity-100 transition"
                >
                  <Maximize2 size={14} />
                  Preview
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold leading-tight">
                    {bookDetails?.title || "Untitled Book"}
                  </h2>
                  <p className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                    <User size={15} />
                    {bookDetails?.author || "Unknown Author"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Price
                    </p>
                    <p className="mt-1 font-semibold text-amber-700 flex items-center gap-1">
                      <IndianRupee size={15} />
                      {bookDetails?.price?.toLocaleString?.() || 0}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-500">
                      Pages
                    </p>
                    <p className="mt-1 font-semibold text-blue-700 flex items-center gap-2">
                      <BookOpen size={15} />
                      {totalPagesCount || 0}
                    </p>
                  </div>
                </div>

                {bookDetails?.category && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                      Category
                    </p>
                    <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700">
                      {bookDetails.category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Filters / Controls */}
          <div className="bg-white/90 border border-black/5 shadow-sm rounded-3xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Reader Controls
            </h3>

            <div className="space-y-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Search Query
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search book..."
                    className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Limit */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Limit
                </label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-sm"
                >
                  <option value={1}>1</option>
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Jump Page */}
              <form onSubmit={handlePageJump}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Go To Page
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={totalPagesCount || 1}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="Page no."
                    className="flex-1 px-3 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-sm font-medium hover:bg-black transition"
                  >
                    Go
                  </button>
                </div>
              </form>

              {/* Apply */}
              <button
                onClick={handleApplyFilters}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
              >
                <RefreshCcw size={16} />
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Reader */}
        <main className="min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 hidden md:flex items-center -translate-x-1/2 z-10">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="h-12 w-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={20} />
              </button>
            </div>

            <div className="absolute inset-y-0 right-0 hidden md:flex items-center translate-x-1/2 z-10">
              <button
                onClick={nextPage}
                disabled={currentPage === totalPagesCount}
                className="h-12 w-12 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="bg-[#fffdf8] border border-[#e9dfc7] shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] overflow-hidden"
            >
              <div className="px-6 md:px-10 py-5 border-b border-[#efe5d0] bg-gradient-to-r from-[#faf5e8] to-[#fffaf0] flex items-center justify-between">
                <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-gray-500">
                  {bookDetails?.title || "Book"}
                </span>
                <span className="text-xs md:text-sm text-gray-500">
                  {currentPage} / {totalPagesCount || 0}
                </span>
              </div>

              <div className="px-6 md:px-12 lg:px-16 py-10 md:py-14 min-h-[65vh]">
                {loadingPage ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <div className="text-center">
                      <div className="mx-auto h-10 w-10 rounded-full border-4 border-amber-200 border-t-amber-500 animate-spin" />
                      <p className="mt-4 text-sm text-gray-500">
                        Loading page...
                      </p>
                    </div>
                  </div>
                ) : currentPageData ? (
                  <article className="rich-content text-[17px] leading-8 text-gray-700 max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: currentPageData.content || "",
                      }}
                    />
                  </article>
                ) : (
                  <div className="py-20 text-center text-gray-400">
                    No page content found.
                  </div>
                )}
              </div>

              <div className="px-6 md:px-10 py-4 border-t border-[#efe5d0] bg-gradient-to-r from-[#fffaf0] to-[#faf5e8] flex items-center justify-center text-sm text-gray-500">
                End of page {currentPage}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
              Previous Page
            </button>

            <div className="text-sm text-gray-500 text-center">
              Page <span className="font-semibold">{currentPage}</span> of{" "}
              <span className="font-semibold">{totalPagesCount || 0}</span>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === totalPagesCount}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gray-900 text-white shadow-sm hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next Page
              <ChevronRight size={18} />
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
