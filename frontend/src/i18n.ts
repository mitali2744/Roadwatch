import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "app.name": "RoadWatch",
      "nav.home": "Home",
      "nav.map": "Map",
      "nav.report": "Report",
      "nav.track": "Track",
      "nav.dashboard": "Dashboard",
      "nav.chat": "AI Chat",
      "complaint.submit": "Submit Complaint",
      "complaint.type": "Issue Type",
      "complaint.description": "Description",
      "complaint.location": "Capture GPS Location",
      "complaint.success": "Complaint Submitted!",
      "track.title": "Track Complaint",
      "track.placeholder": "Enter ticket number",
    },
  },
  hi: {
    translation: {
      "app.name": "रोडवॉच",
      "nav.home": "होम",
      "nav.map": "नक्शा",
      "nav.report": "रिपोर्ट",
      "nav.track": "ट्रैक",
      "nav.dashboard": "डैशबोर्ड",
      "nav.chat": "AI चैट",
      "complaint.submit": "शिकायत दर्ज करें",
      "complaint.type": "समस्या का प्रकार",
      "complaint.description": "विवरण",
      "complaint.location": "GPS स्थान कैप्चर करें",
      "complaint.success": "शिकायत दर्ज हो गई!",
      "track.title": "शिकायत ट्रैक करें",
      "track.placeholder": "टिकट नंबर दर्ज करें",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
