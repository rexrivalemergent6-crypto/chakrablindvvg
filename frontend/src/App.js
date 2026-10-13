import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SwapPage from "./pages/SwapPage";
import DocsPage from "./pages/DocsPage";
import TrackOrderPage from "./pages/TrackOrderPage";
import ShieldPage from "./pages/ShieldPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/shield" element={<ShieldPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
