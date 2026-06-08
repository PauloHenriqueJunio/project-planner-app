import axios from "axios";

// Use the dev machine LAN IP so Expo/device can reach the backend
const SCRAPER_URL = "http://192.168.0.9:3000/scrape";
const SCRAPER_TIMEOUT = 60000;

export async function generateSteps(titulo, categoria) {
  try {
    const response = await axios.post(
      SCRAPER_URL,
      { titulo, categoria },
      { timeout: SCRAPER_TIMEOUT },
    );

    return response.data ?? { etapas: [] };
  } catch (error) {
    const isNetworkError =
      error.code === "ECONNABORTED" ||
      error.message?.includes("Network Error") ||
      !error.response;

    if (isNetworkError) {
      throw new Error("Não foi possível gerar etapas. Verifique sua conexão.");
    }

    throw error;
  }
}
