import { useEffect } from "react";
import { useBookStore } from "../store/useBookStore";
import { useNavigate } from "react-router-dom";

export default function Books() {
  const { books, fetchBooks, } = useBookStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="text-gray-600">
          ← Back
        </button>

        <h1 className="text-2xl font-bold">Book Library</h1>
      </div>

      {/* GRID VIEW */}
      {books?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
            >
              {/* COVER IMAGE */}
              <div className="h-48 bg-gray-200">
                <img
                  src={book.cover_image?.url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* CONTENT */}
              <div className="p-4">
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(`/view-book/${book.id}`)}
                >
                  <h2 className="font-semibold text-lg truncate">
                    {book.title}
                  </h2>
                  <p className="text-sm text-gray-600">{book.author}</p>

                  <p className="mt-2 font-bold text-blue-600">
                    ₹{book.price?.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-20">
          📭 No books available
        </div>
      )}
    </div>
  );
}
