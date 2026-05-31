"""
AI Pothole Severity Scorer.
Uses basic file size and metadata heuristics when CV libraries are unavailable.
Full CV analysis available when opencv-python-headless is installed locally.
"""

import os
from typing import Dict, Any
from loguru import logger


async def score_image_severity(image_path: str) -> Dict[str, Any]:
    """
    Analyze a road damage image and return severity classification.
    Uses OpenCV when available, falls back to heuristic scoring.
    """
    # Try OpenCV first (available in local/Docker environment)
    try:
        import cv2
        import numpy as np
        return _cv_score(image_path, cv2, np)
    except ImportError:
        pass

    # Fallback: heuristic based on file size
    # Larger images with more detail tend to show more damage
    try:
        size = os.path.getsize(image_path)
        if size > 2_000_000:
            return {"severity": "HIGH", "confidence": 0.55,
                    "description": "Large image submitted — likely significant damage. Manual review recommended.",
                    "damage_area_pct": 0.0}
        elif size > 500_000:
            return {"severity": "MEDIUM", "confidence": 0.50,
                    "description": "Moderate-sized image. Severity assessed as MEDIUM pending manual review.",
                    "damage_area_pct": 0.0}
        else:
            return {"severity": "LOW", "confidence": 0.45,
                    "description": "Small image submitted. Severity assessed as LOW pending manual review.",
                    "damage_area_pct": 0.0}
    except Exception:
        return _default_severity()


def _cv_score(image_path: str, cv2, np) -> Dict[str, Any]:
    """Full CV-based scoring when OpenCV is available."""
    img = cv2.imread(image_path)
    if img is None:
        return _default_severity()

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    height, width = gray.shape

    edges = cv2.Canny(gray, 50, 150)
    edge_density = float(np.sum(edges > 0)) / (height * width)

    _, dark_mask = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)
    dark_ratio = float(np.sum(dark_mask > 0)) / (height * width)

    contours, _ = cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    large_contours = [c for c in contours if cv2.contourArea(c) > 500]
    damage_area = sum(cv2.contourArea(c) for c in large_contours)
    damage_area_pct = min((damage_area / (height * width)) * 100, 100.0)

    score = (edge_density * 40 + dark_ratio * 30 + min(damage_area_pct / 30, 1.0) * 30) * 100

    if score >= 70:
        return {"severity": "CRITICAL", "confidence": 0.90,
                "description": f"Critical damage covering ~{damage_area_pct:.1f}% of visible area.",
                "damage_area_pct": round(damage_area_pct, 2)}
    elif score >= 45:
        return {"severity": "HIGH", "confidence": 0.82,
                "description": "Significant road damage. Repair recommended within 2 weeks.",
                "damage_area_pct": round(damage_area_pct, 2)}
    elif score >= 20:
        return {"severity": "MEDIUM", "confidence": 0.70,
                "description": "Moderate damage. Schedule for maintenance.",
                "damage_area_pct": round(damage_area_pct, 2)}
    else:
        return {"severity": "LOW", "confidence": 0.65,
                "description": "Minor surface wear. Monitor and schedule routine maintenance.",
                "damage_area_pct": round(damage_area_pct, 2)}


def _default_severity() -> Dict[str, Any]:
    return {
        "severity": "MEDIUM",
        "confidence": 0.5,
        "description": "Image analysis unavailable. Severity set to MEDIUM. Please describe the issue in the complaint form.",
        "damage_area_pct": 0.0,
    }
