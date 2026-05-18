import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { COLORS } from "../constants/colors";
import { generateSteps } from "../services/scraperService";
import { saveProject } from "../storage/projectStorage";

export default function CreateProjectScreen({ navigation }) {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    "Aprendizado",
    "TCC",
    "Desenvolvimento de Software",
    "Empreendedorismo",
  ];

  const getScraperCategory = (value) => {
    const categories = {
      "": "",
      Aprendizado: "Aprendizado de Habilidade",
      TCC: "TCC / Pesquisa Acadêmica",
      "Desenvolvimento de Software": "Desenvolvimento de Software",
      Empreendedorismo: "Empreendedorismo",
    };

    return categories[value] ?? value;
  };

  const buildFallbackEtapas = (titulo) => [
    {
      titulo: `Planejar ${titulo}`,
      subetapas: [
        `Definir o objetivo de ${titulo}`,
        `Listar recursos para ${titulo}`,
      ],
    },
    {
      titulo: `Estruturar ${titulo}`,
      subetapas: [
        `Organizar as etapas principais de ${titulo}`,
        "Definir prazos e prioridades",
      ],
    },
    {
      titulo: `Executar ${titulo}`,
      subetapas: [
        `Colocar a primeira versão de ${titulo} em prática`,
        "Revisar e ajustar os próximos passos",
      ],
    },
  ];

  const handleCreate = async () => {
    if (projectName.trim() === "") {
      alert("Por favor, insira um nome para o projeto");
      return;
    }

    setIsGenerating(true);

    try {
      const response = await generateSteps(
        projectName.trim(),
        getScraperCategory(category),
      );

      const categoriaDetectada =
        response.categoriaDetectada ||
        getScraperCategory(category) ||
        "Aprendizado de Habilidade";

      const etapas = (response.etapas || []).map((etapa, index) => ({
        id: `${Date.now()}-${index}`,
        titulo: etapa.titulo,
        subetapas: Array.isArray(etapa.subetapas) ? etapa.subetapas : [],
        completed: false,
      }));

      const project = {
        id: Date.now().toString(),
        titulo: projectName.trim(),
        name: projectName.trim(),
        descricao: description.trim(),
        prioridade: "Média",
        categoria:
          getScraperCategory(category) ||
          categoriaDetectada ||
          "Aprendizado de Habilidade",
        categoriaDetectada,
        progresso: 0,
        scraped: true,
        etapas,
      };

      await saveProject(project);

      navigation.navigate("ProjectDetail", { project });
    } catch (_error) {
      const fallbackCategoria =
        getScraperCategory(category) || "Aprendizado de Habilidade";
      const fallbackEtapas = buildFallbackEtapas(projectName.trim());

      const project = {
        id: Date.now().toString(),
        titulo: projectName.trim(),
        name: projectName.trim(),
        descricao: description.trim(),
        prioridade: "Média",
        categoria: fallbackCategoria,
        categoriaDetectada: fallbackCategoria,
        progresso: 0,
        scraped: false,
        etapas: fallbackEtapas.map((etapa, index) => ({
          id: `${Date.now()}-fallback-${index}`,
          titulo: etapa.titulo,
          subetapas: etapa.subetapas,
          completed: false,
        })),
      };

      await saveProject(project);
      navigation.navigate("ProjectDetail", { project });
      return;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Projeto</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Nome do Projeto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: App de Planejamento"
            placeholderTextColor={COLORS.textSecondary}
            value={projectName}
            onChangeText={setProjectName}
            maxLength={50}
          />
          <Text style={styles.charCount}>{projectName.length}/50</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Descreva o seu projeto..."
            placeholderTextColor={COLORS.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Categoria</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker}
              dropdownIconColor={COLORS.primary}
            >
              <Picker.Item label="Detectar automaticamente" value="" />
              {categories.map((cat) =>
                cat ? <Picker.Item key={cat} label={cat} value={cat} /> : null,
              )}
            </Picker>
          </View>
          <Text style={styles.categoryHint}>
            Deixe em branco para detectar automaticamente
          </Text>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>💡 Dica</Text>
          <Text style={styles.infoText}>
            Você poderá adicionar etapas depois de criar o projeto.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isGenerating}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            isGenerating && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.text} />
              <Text style={styles.createButtonText}>Gerando etapas...</Text>
            </View>
          ) : (
            <Text style={styles.createButtonText}>Criar Projeto</Text>
          )}
        </TouchableOpacity>
      </View>

      {isGenerating && (
        <View style={styles.loadingOverlay} pointerEvents="auto">
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Gerando etapas...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  textArea: {
    textAlignVertical: "top",
    paddingVertical: 12,
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: "right",
  },
  pickerContainer: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    color: COLORS.text,
    height: 50,
  },
  categoryHint: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoBox: {
    backgroundColor: COLORS.cardBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonDisabled: {
    opacity: 0.8,
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loadingText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
});
