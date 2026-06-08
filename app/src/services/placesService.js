import { Platform } from "react-native";
import * as Location from "expo-location";
import { API_BASE } from "../constants/config";
import { readResponseBody } from "../utils/chatHelpers";

function getWebLocation() {
  return new Promise((resolve, reject) => {
    const geolocation = globalThis.navigator?.geolocation;
    if (!geolocation) {
      reject(new Error("Localizacao indisponivel neste navegador."));
      return;
    }

    geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords || {};
        if (typeof latitude !== "number" || typeof longitude !== "number") {
          reject(new Error("Nao foi possivel ler sua localizacao."));
          return;
        }
        resolve({ latitude, longitude });
      },
      reject,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}

async function getNativeLocation() {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== "granted") {
    throw new Error("Permissao de localizacao negada.");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  const { latitude, longitude } = position.coords || {};
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("Nao foi possivel ler sua localizacao.");
  }

  return { latitude, longitude };
}

export function getCurrentLocation() {
  return Platform.OS === "web" ? getWebLocation() : getNativeLocation();
}

export async function fetchNearbyPlaces(product, latitude, longitude) {
  const response = await fetch(`${API_BASE}/places/nearby`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      product,
      lat: latitude,
      lng: longitude,
      radius_meters: 5000,
      max_results: 5,
    }),
  });
  const data = await readResponseBody(response);
  if (!response.ok) {
    const detail = data.detail || data.error || `HTTP ${response.status}`;
    throw new Error(String(detail));
  }
  return Array.isArray(data.places) ? data.places : [];
}
