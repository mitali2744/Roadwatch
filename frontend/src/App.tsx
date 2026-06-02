// RoadWatch Frontend — Road Safety Hackathon 2026
// Build: 2026-06-03
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import MapPage from "./pages/MapPage";
import ComplaintPage from "./pages/ComplaintPage";
import TrackPage from "./pages/TrackPage";
import DashboardPage from "./pages/DashboardPage";
import ChatbotPage from "./pages/ChatbotPage";
import RoadDetailPage from "./pages/RoadDetailPage";
import FeedPage from "./pages/FeedPage";
import AdminPage from "./pages/AdminPage";

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
        <Route path="feed" element={<FeedPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}
