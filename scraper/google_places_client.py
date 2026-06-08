import os
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"), override=True)

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText"


def search_nearby_places(
    product: str,
    lat: float,
    lng: float,
    radius_meters: float = 3000,
    max_results: int = 5,
) -> list[dict[str, Any]]:
    if not GOOGLE_MAPS_API_KEY:
        raise RuntimeError("GOOGLE_MAPS_API_KEY environment variable is not set")

    query = f"{product} loja perto de mim"
    payload = {
        "textQuery": query,
        "languageCode": "pt-BR",
        "maxResultCount": max(1, min(max_results, 10)),
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": max(100, min(radius_meters, 50000)),
            }
        },
    }
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY,
        "X-Goog-FieldMask": ",".join(
            [
                "places.id",
                "places.displayName",
                "places.formattedAddress",
                "places.location",
                "places.rating",
                "places.googleMapsUri",
            ]
        ),
    }

    response = requests.post(
        PLACES_TEXT_SEARCH_URL,
        headers=headers,
        json=payload,
        timeout=20,
    )
    response.raise_for_status()

    data = response.json()
    places = data.get("places") or []
    normalized = []
    for place in places:
        location = place.get("location") or {}
        display_name = place.get("displayName") or {}
        normalized.append(
            {
                "id": place.get("id"),
                "name": display_name.get("text") or "Local sem nome",
                "address": place.get("formattedAddress") or "",
                "rating": place.get("rating"),
                "lat": location.get("latitude"),
                "lng": location.get("longitude"),
                "mapsUrl": place.get("googleMapsUri") or "",
            }
        )

    return normalized
