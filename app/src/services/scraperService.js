import axios from "axios";

const SCRAPER_URL = "http://192.168.0.110:3000/scrape";
const SCRAPER_TIMEOUT = 15000;

export async function generateSteps(titulo, categoria) {
  try {
    const response = await axios.post(
      SCRAPER_URL,
      { titulo, categoria },
      { timeout: SCRAPER_TIMEOUT },
    );

    return response.data?.etapas ?? [];
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
