const FALLBACK_SUBETAPA = "Estudar conceitos básicos";

function parseEtapas(secoes) {
  if (!Array.isArray(secoes) || secoes.length === 0) {
    return [];
  }

  const etapas = [];

  for (let index = 0; index < secoes.length && etapas.length < 5; index += 3) {
    const titulo =
      typeof secoes[index] === "string" ? secoes[index].trim() : "";

    if (!titulo) {
      continue;
    }

    const primeiraSubetapa =
      typeof secoes[index + 1] === "string" && secoes[index + 1].trim()
        ? secoes[index + 1].trim()
        : FALLBACK_SUBETAPA;

    const segundaSubetapa =
      typeof secoes[index + 2] === "string" && secoes[index + 2].trim()
        ? secoes[index + 2].trim()
        : FALLBACK_SUBETAPA;

    etapas.push({
      titulo,
      subetapas: [primeiraSubetapa, segundaSubetapa],
    });
  }

  return etapas;
}

module.exports = parseEtapas;
