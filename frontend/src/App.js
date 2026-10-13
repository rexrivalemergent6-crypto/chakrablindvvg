import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ShieldPage from "./pages/ShieldPage";

// One single Darkinator site: every URL is served by the Bifrost v1 mirror
// (wallet, shield, trade, send, private route, privacy swap, track, docs, about).
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<ShieldPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
