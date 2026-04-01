import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CardDetails from "./pages/CardDetails";
import Home from "./pages/Home";
import TimelinePage from "./pages/TimelinePage";
import AboutPage from "./pages/About";
import BookDetails from "./pages/BookDetails";
import Books from "./pages/Books";

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/card/:id" element={<CardDetails />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/books" element={<Books />} />
        <Route path="/view-book/:bookId" element={<BookDetails />} />
      </Routes>
    </BrowserRouter>
  );
}
