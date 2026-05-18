require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  console.log("🔍 Testando Gemini API...\n");
  console.log(`📌 Chave carregada: ${apiKey ? "✓ SIM" : "✗ NÃO"}`);

  if (!apiKey) {
    console.log("❌ ERRO: Chave GEMINI_API_KEY não encontrada no .env");
    process.exit(1);
  }

  if (apiKey === "sua_chave_aqui" || apiKey.length < 10) {
    console.log("❌ ERRO: Chave parece inválida (placeholder ou muito curta)");
    process.exit(1);
  }

  try {
    console.log("\n⏳ Conectando ao Gemini...");
    const genAI = new GoogleGenerativeAI(apiKey);

    // Tentar diferentes modelos
    let model;
    let modelName = "gemini-2.5-flash";

    try {
      model = genAI.getGenerativeModel({ model: modelName });
      console.log(`✓ Cliente Gemini criado (modelo: ${modelName})`);
    } catch (e) {
      console.log(`⚠️  ${modelName} não disponível, tentando gemini-pro...`);
      modelName = "gemini-pro";
      model = genAI.getGenerativeModel({ model: modelName });
      console.log(`✓ Cliente Gemini criado (modelo: ${modelName})`);
    }

    console.log("\n⏳ Testando geração de conteúdo...");
    const result = await model.generateContent("Diga olá em português");

    console.log("✓ Resposta recebida:");
    console.log(`\n"${result.response.text()}"\n`);

    console.log("✓ Testando classificação de categoria...");
    const categoryResult = await model.generateContent(
      `Classifique o projeto "Criar um site" em exatamente uma dessas categorias: "Aprendizado de Habilidade", "TCC / Pesquisa Acadêmica", "Desenvolvimento de Software", "Empreendedorismo". Responda apenas o nome da categoria exato, sem pontuação, sem explicação e sem nenhum texto adicional.`,
    );

    const categoryText = categoryResult.response.text().trim();
    console.log(`\nCategoria detectada: "${categoryText}"`);

    console.log("\n✅ SUCESSO! A chave de API está funcionando corretamente.");
    console.log(`📝 Modelo em uso: ${modelName}\n`);
  } catch (error) {
    console.log("\n❌ ERRO ao conectar com Gemini:");
    console.log(`\n${error.message}\n`);

    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized")
    ) {
      console.log("💡 Dica: Chave de API inválida ou sem permissão");
    } else if (
      error.message.includes("404") ||
      error.message.includes("not found")
    ) {
      console.log("💡 Dica 1: A chave de API pode estar inválida ou revogada");
      console.log("💡 Dica 2: Ou o modelo de IA solicitado não existe");
      console.log(
        "💡 Solução: Copie uma chave NOVA de https://aistudio.google.com/apikey",
      );
    } else if (error.message.includes("429")) {
      console.log(
        "💡 Dica: Limite de requisições excedido. Aguarde alguns minutos.",
      );
    } else if (
      error.message.includes("network") ||
      error.message.includes("fetch")
    ) {
      console.log("💡 Dica: Problema de conexão. Verifique sua internet.");
    }

    console.log("\n📄 Detalhes completos do erro:");
    console.log(error);

    process.exit(1);
  }
}

testGemini();
