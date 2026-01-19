import { AppShell } from "@jimbo77/ui";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import ProjectDetail from "./pages/ProjectDetail";
import { useEffect } from "react";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function AppContent() {
    return (
        <AppShell 
            topbar={<div style={{ padding: "10px 20px", fontFamily: "monospace", fontSize: "12px", color: "#666" }}>JIMBO77 // MAGNET_OS v1.0</div>} 
            footer={<div style={{ padding: "20px", textAlign: "center", fontSize: "12px", color: "#444", fontFamily: "monospace" }}>© 2026 JIMBO77 DEVZ INC. All systems nominal.</div>}
        >
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route path="*" element={<div style={{ padding: "50px", textAlign: "center" }}>404 // SECTOR_NOT_FOUND</div>} />
            </Routes>
        </AppShell>
    );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
