import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import HeroSliderAdmin from "./components/HeroSliderAdmin";
import AboutPage from "./pages/About";
import AddCardPage from "./pages/AddCardModal";
import CardDetails from "./pages/CardDetails";
import Home from "./pages/Home";
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
      </Routes>

    </BrowserRouter>
  );
}