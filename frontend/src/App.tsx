import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import ComplaintPage from "./pages/ComplaintPage";
import TrackPage from "./pages/TrackPage";
import DashboardPage from "./pages/DashboardPage";
import ChatbotPage from "./pages/ChatbotPage";
import RoadDetailPage from "./pages/RoadDetailPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="map" element={<MapPage />} />
        <Route path="report" element={<ComplaintPage />} />
        <Route path="track" element={<TrackPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="chat" element={<ChatbotPage />} />
        <Route path="road/:id" element={<RoadDetailPage />} />
      </Route>
    </Routes>
  );
}
