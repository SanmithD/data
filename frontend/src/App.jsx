import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HeroSliderAdmin from "./components/HeroSliderAdmin";
import AboutPage from "./pages/About";
import AddCardPage from "./pages/AddCardModal";
import AddEditBookPage from "./pages/AddEditBookPage";
import BookDetails from "./pages/BookDetails";
import BooksAdmin from "./pages/BooksAdmin";
import CardDetails from "./pages/CardDetails";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import TimelinePage from "./pages/TimelinePage";

export default function App() {

  return (
    <BrowserRouter>

      <Toaster />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/card/:id" element={<CardDetails />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/slide-images" element={<HeroSliderAdmin />} />
        <Route path="/addCard" element={<AddCardPage />} />
        <Route path="/addCard/:parentId" element={<AddCardPage />} />
        <Route path="/books" element={<BooksAdmin />} />
        <Route path="/manage-books" element={<AddEditBookPage />} />
        <Route path="/manage-books/:bookId" element={<AddEditBookPage />} />
        <Route path="/view-book/:bookId" element={<BookDetails />} />


        <Route path="/*" element={<NotFound />} />
      </Routes>

    </BrowserRouter>
  );
}