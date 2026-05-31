import React, { useContext, useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../constants/colors";
import { ProjectContext } from "../context/ProjectContext";

function createEmptyStep(seed) {
  return {
    id: `step-${seed}`,
    title: "",
    description: "",
    subtaskList: [{ id: `sub-${seed}-0`, title: "" }],
  };
}

export default function CreateProjectScreen({ navigation, route }) {
  const { addProject, updateProject } = useContext(ProjectContext);
  const editingProject = route?.params?.project || null;

  const [projectName, setProjectName] = useState(editingProject?.name || "");
  const [description, setDescription] = useState(editingProject?.description || "");
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedSteps, setGeneratedSteps] = useState(() => {
    const existingSteps = editingProject?.steps;
    if (Array.isArray(existingSteps) && existingSteps.length > 0) {
      return existingSteps.map((s, idx) => ({
        id: s.id || `step-existing-${idx}`,
        title: s.title || "",
        description: s.description || "",
        subtaskList: (s.subtaskList || []).map((st, sidx) => ({
          id: `sub-existing-${idx}-${sidx}`,
          title: typeof st === "string" ? st : st.title || "",
        })),
      }));
    }
    return [createEmptyStep(Date.now())];
  });

  const API_BASE = "http://127.0.0.1:8000";

  const addStep = () => {
    const seed = Date.now();
    setGeneratedSteps((prev) => [...prev, createEmptyStep(seed)]);
  };

  const removeStep = (stepIndex) => {
    setGeneratedSteps((prev) => {
      const next = prev.filter((_, idx) => idx !== stepIndex);
      return next.length ? next : [createEmptyStep(Date.now())];
    });
  };

  const updateStepField = (stepIndex, field, value) => {
    setGeneratedSteps((prev) =>
      prev.map((step, idx) => (idx === stepIndex ? { ...step, [field]: value } : step)),
    );
  };

  const addSubtask = (stepIndex) => {
    const seed = Date.now();
    setGeneratedSteps((prev) =>
      prev.map((step, idx) =>
        idx === stepIndex
          ? {
              ...step,
              subtaskList: [...(step.subtaskList || []), { id: `sub-${seed}`, title: "" }],
            }
          : step,
      ),
    );
  };

  const updateSubtask = (stepIndex, subIndex, value) => {
    setGeneratedSteps((prev) =>
      prev.map((step, idx) =>
        idx === stepIndex
          ? {
              ...step,
              subtaskList: (step.subtaskList || []).map((sub, sidx) =>
                sidx === subIndex ? { ...sub, title: value } : sub,
              ),
            }
          : step,
      ),
    );
  };

  const removeSubtask = (stepIndex, subIndex) => {
    setGeneratedSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        const nextSubs = (step.subtaskList || []).filter((_, sidx) => sidx !== subIndex);
        return {
          ...step,
          subtaskList: nextSubs.length ? nextSubs : [{ id: `sub-${Date.now()}`, title: "" }],
        };
      }),
    );
  };

  const generatePlanFromAI = async () => {
    const theme = description.trim() || projectName.trim();
    if (!theme) {
      alert("Preencha nome ou descrição para gerar o plano.");
      return;
    }

    setLoadingPlan(true);
    try {
      const resp = await fetch(`${API_BASE}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme }),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || `HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const plan = data.plan || data.plan_text || data;
      const rawSteps = Array.isArray(plan.steps) ? plan.steps : [];

      if (!rawSteps.length) {
        alert("A IA não retornou etapas. Você pode preencher manualmente abaixo.");
        return;
      }

      const mapped = rawSteps.map((s, idx) => {
        const title = typeof s === "string" ? s : s?.title || `Etapa ${idx + 1}`;
        const subtaskStrings = Array.isArray(s?.subtasks)
          ? s.subtasks
          : typeof s === "string"
            ? []
            : [];

        return {
          id: `step-ai-${Date.now()}-${idx}`,
          title: title || `Etapa ${idx + 1}`,
          description: typeof s === "object" ? s.description || "" : "",
          subtaskList: (subtaskStrings.length ? subtaskStrings : [""]).map((st, sidx) => ({
            id: `sub-ai-${idx}-${sidx}`,
            title: st,
          })),
        };
      });

      setGeneratedSteps(mapped);
    } catch (err) {
      console.error(err);
      alert(`Erro ao gerar plano: ${err.message}`);
    } finally {
      setLoadingPlan(false);
    }
  };

  const finalizeCreate = async () => {
    if (!projectName.trim()) {
      alert("Por favor, insira um nome para o projeto.");
      return;
    }

    const cleanedSteps = generatedSteps
      .map((step, idx) => ({
        id: step.id || `step-${idx + 1}`,
        title: (step.title || "").trim(),
        description: (step.description || "").trim(),
        subtaskList: (step.subtaskList || [])
          .map((sub) => (typeof sub === "string" ? sub : sub.title || ""))
          .map((t) => t.trim())
          .filter(Boolean),
        completed: false,
      }))
      .filter((step) => step.title.length > 0);

    if (!cleanedSteps.length) {
      alert("Adicione pelo menos uma etapa com título para criar o projeto.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProject?.id) {
        const updated = {
          ...editingProject,
          name: projectName.trim(),
          description: description.trim(),
          steps: cleanedSteps,
        };
        updateProject(editingProject.id, updated);
        navigation.navigate("ProjectDetail", { project: updated, steps: cleanedSteps });
      } else {
        const project = { name: projectName.trim(), id: String(Date.now()), description: description.trim() };
        const projectWithSteps = { ...project, steps: cleanedSteps };
        addProject(projectWithSteps);
        navigation.navigate("ProjectDetail", { project, steps: cleanedSteps });
      }
    } catch (e) {
      console.warn(e);
      alert("Não foi possível criar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <>
      <View style={styles.formGroup}>
        <Text style={styles.label}>Nome do Projeto</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Meu Projeto"
          placeholderTextColor={COLORS.textSecondary}
          value={projectName}
          onChangeText={setProjectName}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Descrição / Tema</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Descreva o tema"
          placeholderTextColor={COLORS.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 Etapas geradas</Text>
        <Text style={styles.infoText}>
          Você pode preencher manualmente etapa e sub-etapas. Se quiser, use "Gerar com IA" para preencher automático.
        </Text>
      </View>

      <View style={styles.generatedContainer}>
        <Text style={styles.label}>Etapas geradas (edite se quiser)</Text>
        {generatedSteps.map((step, idx) => (
          <View key={step.id} style={styles.stepEditor}>
            <TextInput
              style={styles.input}
              value={step.title}
              onChangeText={(v) => updateStepField(idx, "title", v)}
              placeholder={`Etapa ${idx + 1}`}
              placeholderTextColor={COLORS.textSecondary}
            />

            <View style={styles.stepButtonsRow}>
              <TouchableOpacity style={styles.smallButton} onPress={() => addSubtask(idx)}>
                <Text style={styles.smallButtonText}>+ Sub-etapa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.smallDanger} onPress={() => removeStep(idx)}>
                <Text style={styles.smallButtonText}>Remover Etapa</Text>
              </TouchableOpacity>
            </View>

            {(step.subtaskList || []).map((sub, sidx) => (
              <View key={sub.id || `${step.id}-${sidx}`} style={styles.subtaskRowEditor}>
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  value={typeof sub === "string" ? sub : sub.title}
                  onChangeText={(v) => updateSubtask(idx, sidx, v)}
                  placeholder={`Sub-etapa ${sidx + 1}`}
                  placeholderTextColor={COLORS.textSecondary}
                />
                <TouchableOpacity style={styles.smallDanger} onPress={() => removeSubtask(idx, sidx)}>
                  <Text style={styles.smallButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={[styles.smallButton, { alignSelf: "flex-start" }]} onPress={addStep}>
          <Text style={styles.smallButtonText}>+ Adicionar Etapa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inlineActionRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={generatePlanFromAI}>
          <Text style={styles.secondaryButtonText}>{loadingPlan ? "Gerando..." : "Gerar com IA"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={finalizeCreate}>
          <Text style={styles.createButtonText}>{isSubmitting ? "Criando..." : "Criar Projeto"}</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editingProject ? "Editar Projeto" : "Novo Projeto"}</Text>
        <View style={{ width: 50 }} />
      </View>

      {Platform.OS === "web" ? (
        <View style={styles.webScrollArea}>
          <View style={styles.content}>{formContent}</View>
        </View>
      ) : (
        <View style={styles.scrollContainer}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {formContent}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  scrollContainer: { flex: 1 },
  scrollView: { flex: 1 },
  webScrollArea: {
    flex: 1,
    overflowY: "scroll",
    scrollbarWidth: "auto",
  },
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  content: { padding: 20, paddingBottom: 24 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "600", color: COLORS.text, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: 8,
  },
  textArea: { textAlignVertical: "top", height: 80 },
  infoBox: {
    backgroundColor: COLORS.cardBg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  infoTitle: { fontSize: 14, fontWeight: "bold", color: COLORS.primary, marginBottom: 4 },
  infoText: { fontSize: 13, color: COLORS.textSecondary },
  generatedContainer: { marginTop: 8 },
  stepEditor: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepButtonsRow: { flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 8 },
  smallButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 6,
    marginRight: 8,
  },
  smallDanger: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.error,
    borderRadius: 6,
  },
  smallButtonText: { color: COLORS.text, fontWeight: "600" },
  subtaskRowEditor: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  inlineActionRow: { flexDirection: "row", gap: 12, marginTop: 12, marginBottom: 24 },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: { color: COLORS.primary, fontWeight: "600", fontSize: 14 },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
});
