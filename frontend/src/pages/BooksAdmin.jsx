import { useEffect } from "react";
import { useBookStore } from "../store/useBookStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function BooksAdmin() {
  const { books, fetchBooks, deleteBook, loading } = useBookStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = (bookId) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <span>Are you sure you want to delete?</span>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t.id);

              await deleteBook(bookId);
              if (loading) {
                toast.loading("Deleting...");
              }

              fetchBooks();
            }}
            className="bg-red-500 text-white px-2 py-1 rounded"
          >
            Yes
          </button>

          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-300 px-2 py-1 rounded"
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/')} className="text-gray-600">
          ← Back
        </button>

        <h1 className="text-2xl font-bold">Book Library</h1>

        <button
          onClick={() => navigate("/manage-books")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow"
        >
          + Add Book
        </button>
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

                  {/* STATUS */}
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                      book.isPublished
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {book.isPublished ? "Published" : "Draft"}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex justify-between mt-4 z-999">
                  <button
                    onClick={() => navigate(`/manage-books/${book.id}`)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(book.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Delete
                  </button>
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
