import { Toaster } from "react-hot-toast";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import CardDetails from "./pages/CardDetails";
import Home from "./pages/Home";

export default function App() {

  return (
    <BrowserRouter>

      <Toaster />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/card/:id" element={<CardDetails />} />

      </Routes>

    </BrowserRouter>
  );
}