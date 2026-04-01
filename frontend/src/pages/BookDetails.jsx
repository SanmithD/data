import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useBookStore } from "../store/useBookStore";
import { usePageStore } from "../store/usePageStore";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function BookDetails() {
  const { bookId } = useParams();

  const navigate = useNavigate();
  const { bookDetails, fetchBookById } = useBookStore();
  const {
    currentPageData,
    fetchPageByNumber,
    fetchPageCount,
    totalPagesCount,
  } = usePageStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [openLightbox, setOpenLightbox] = useState(false);
  const [touchStartX, setTouchStartX] = useState(0);

  useEffect(() => {
    fetchBookById(bookId);
    fetchPageCount(bookId);
    fetchPageByNumber(bookId, 1);
  }, [bookId]);

  /*
  👉 NEXT PAGE
  */
  const nextPage = () => {
    if (currentPage < totalPagesCount) {
      const next = currentPage + 1;
      setCurrentPage(next);
      fetchPageByNumber(bookId, next);
    }
  };

  /*
  👉 PREVIOUS PAGE
  */
  const prevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      fetchPageByNumber(bookId, prev);
    }
  };

  /*
  👉 SWIPE SUPPORT
  */
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;

    if (diff > 50) nextPage(); // swipe left
    if (diff < -50) prevPage(); // swipe right
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
        <button onClick={() => navigate(-1)} className="text-gray-600 mb-4">
            Back
        </button>
      {/* HEADER */}
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6 mb-6">
        
        <div className="flex gap-6">
          {/* COVER */}
          <img
            src={bookDetails?.cover_image?.url}
            alt="cover"
            onClick={() => setOpenLightbox(true)}
            className="w-40 h-56 object-cover rounded cursor-pointer hover:scale-105 transition"
          />

          {/* INFO */}
          <div>
            <h1 className="text-2xl font-bold">{bookDetails?.title}</h1>
            <p className="text-gray-600">{bookDetails?.author}</p>

            <p className="mt-3 text-blue-600 font-semibold">
              ₹{bookDetails?.price?.toLocaleString()}
            </p>

            <p className="mt-3 text-sm text-gray-500">
              Total Pages: {totalPagesCount}
            </p>
          </div>
        </div>
      </div>

      {/* 📖 READER */}
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-8">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="min-h-100 text-lg leading-relaxed"
        >
          {currentPageData ? (
            <div
              dangerouslySetInnerHTML={{
                __html: currentPageData.content,
              }}
            />
          ) : (
            <p className="text-gray-400">Loading page...</p>
          )}
        </div>

        {/* FOOTER CONTROLS */}
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            ← Previous
          </button>

          <span className="text-sm text-gray-500">
            Page {currentPage} / {totalPagesCount}
          </span>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPagesCount}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      </div>

      {/* 🔍 LIGHTBOX */}
      <Lightbox
        open={openLightbox}
        close={() => setOpenLightbox(false)}
        slides={[{ src: bookDetails?.cover_image?.url }]}
      />
    </div>
  );
}
