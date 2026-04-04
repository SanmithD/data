import { AlertTriangle, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />

      <h1 className="text-7xl font-bold text-gray-800">404</h1>

      <h2 className="text-2xl font-semibold mt-2 text-gray-700">
        Page Not Found
      </h2>

      <p className="text-gray-500 mt-2 max-w-md">
        Bro... this page doesn’t exist. You probably typed some weird URL 💀
      </p>

      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
      >
        <Home size={18} />
        Go Home
      </Link>
    </div>
  );
}