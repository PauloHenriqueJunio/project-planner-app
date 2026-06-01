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
    subtaskList: [{ id: `sub-${seed}-0`, title: "", description: "", links: [], linksInputOpen: false }],
  };
}

function normalizeUrl(url) {
  const trimmed = String(url || "").trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return "";
}

function normalizeLinks(rawLinks, stepIdx, subIdx) {
  if (!Array.isArray(rawLinks)) return [];

  return rawLinks
    .map((link, linkIdx) => {
      if (typeof link === "string") {
        const url = normalizeUrl(link);
        if (!url) return null;
        return {
          id: `link-${stepIdx}-${subIdx}-${linkIdx}`,
          label: `Link ${linkIdx + 1}`,
          url,
          reason: "",
        };
      }

      if (link && typeof link === "object") {
        const url = normalizeUrl(link.url || link.href || link.link || "");
        if (!url) return null;
        return {
          id: link.id || `link-${stepIdx}-${subIdx}-${linkIdx}`,
          label: (link.label || link.title || link.name || `Link ${linkIdx + 1}`).trim(),
          url,
          reason: (link.reason || "").trim(),
        };
      }

      return null;
    })
    .filter(Boolean)
    .slice(0, 3);
}

function parseLinksInput(text) {
  if (!text) return [];
  const raw = text
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

  return normalizeLinks(raw, "manual", "manual");
}

function linksToInputText(links) {
  if (!Array.isArray(links) || !links.length) return "";
  return links.map((l) => l.url).join(", ");
}

function normalizeSubtasks(rawSubtasks, stepIdx) {
  if (!Array.isArray(rawSubtasks) || !rawSubtasks.length) {
    return [{ id: `sub-fallback-${stepIdx}-0`, title: "", description: "", links: [], linksInputOpen: false }];
  }

  return rawSubtasks.map((sub, subIdx) => {
    if (typeof sub === "string") {
      return { id: `sub-${stepIdx}-${subIdx}`, title: sub, description: "", links: [], linksInputOpen: false };
    }

    if (sub && typeof sub === "object") {
      const rawLinks = Array.isArray(sub.links)
        ? sub.links
        : Array.isArray(sub.product_links)
          ? sub.product_links
          : Array.isArray(sub.productLinks)
            ? sub.productLinks
            : [];
      return {
        id: sub.id || `sub-${stepIdx}-${subIdx}`,
        title: (sub.title || sub.name || "").trim(),
        description: (sub.description || sub.details || sub.how_to || "").trim(),
        links: normalizeLinks(rawLinks, stepIdx, subIdx),
        linksInputOpen: false,
      };
    }

    return { id: `sub-${stepIdx}-${subIdx}`, title: "", description: "", links: [], linksInputOpen: false };
  });
}

function formatLegacyProducts(products) {
  if (!Array.isArray(products)) return "";
  const names = products
    .map((product) => {
      if (typeof product === "string") return product.trim();
      if (product && typeof product === "object") return (product.name || product.title || "").trim();
      return "";
    })
    .filter(Boolean);

  if (!names.length) return "";
  return `Produtos recomendados nesta etapa: ${names.join(", ")}.`;
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
        subtaskList: normalizeSubtasks(s.subtaskList, idx),
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
              subtaskList: [
                ...(step.subtaskList || []),
                { id: `sub-${seed}`, title: "", description: "", links: [], linksInputOpen: false },
              ],
            }
          : step,
      ),
    );
  };

  const updateSubtask = (stepIndex, subIndex, field, value) => {
    setGeneratedSteps((prev) =>
      prev.map((step, idx) =>
        idx === stepIndex
          ? {
              ...step,
              subtaskList: (step.subtaskList || []).map((sub, sidx) =>
                sidx === subIndex ? { ...sub, [field]: value } : sub,
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
          subtaskList: nextSubs.length
            ? nextSubs
            : [{ id: `sub-${Date.now()}`, title: "", description: "", links: [], linksInputOpen: false }],
        };
      }),
    );
  };

  const toggleSubtaskLinksInput = (stepIndex, subIndex) => {
    setGeneratedSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return {
          ...step,
          subtaskList: (step.subtaskList || []).map((sub, sidx) =>
            sidx === subIndex ? { ...sub, linksInputOpen: !sub.linksInputOpen } : sub,
          ),
        };
      }),
    );
  };

  const updateSubtaskLinks = (stepIndex, subIndex, text) => {
    setGeneratedSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return {
          ...step,
          subtaskList: (step.subtaskList || []).map((sub, sidx) =>
            sidx === subIndex
              ? {
                  ...sub,
                  links: parseLinksInput(text),
                }
              : sub,
          ),
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
        const rawSubtasks = Array.isArray(s?.subtasks) ? s.subtasks : [];
        const legacyProducts = Array.isArray(s?.suggested_products)
          ? s.suggested_products
          : Array.isArray(s?.suggestedProducts)
            ? s.suggestedProducts
            : Array.isArray(s?.products)
              ? s.products
              : [];
        const baseDescription = typeof s === "object" ? (s.description || "") : "";
        const legacyProductsText = formatLegacyProducts(legacyProducts);
        const mergedDescription = [baseDescription.trim(), legacyProductsText].filter(Boolean).join("\n\n");

        return {
          id: `step-ai-${Date.now()}-${idx}`,
          title: title || `Etapa ${idx + 1}`,
          description: mergedDescription,
          subtaskList: normalizeSubtasks(rawSubtasks.length ? rawSubtasks : [""], idx),
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
          .map((sub, subIdx) => {
            if (typeof sub === "string") {
              return {
                id: `sub-${step.id || idx}-${subIdx}`,
                title: sub.trim(),
                description: "",
                completed: false,
              };
            }

            return {
              id: sub.id || `sub-${step.id || idx}-${subIdx}`,
              title: (sub.title || "").trim(),
              description: (sub.description || "").trim(),
              links: normalizeLinks(sub.links || [], idx, subIdx),
              completed: Boolean(sub.completed),
            };
          })
          .filter((sub) => sub.title.length > 0),
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
          Você pode preencher manualmente etapa e sub-etapas. Inclua no texto como executar e, quando necessário, quais itens usar.
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

            <TextInput
              style={[styles.input, styles.textArea]}
              value={step.description}
              onChangeText={(v) => updateStepField(idx, "description", v)}
              placeholder="Como executar esta etapa (inclua produtos quando fizer sentido)"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              numberOfLines={3}
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
                <View style={styles.subtaskEditorContent}>
                  <TextInput
                    style={[styles.input, { marginBottom: 6 }]}
                    value={typeof sub === "string" ? sub : sub.title}
                    onChangeText={(v) => updateSubtask(idx, sidx, "title", v)}
                    placeholder={`Sub-etapa ${sidx + 1}`}
                    placeholderTextColor={COLORS.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, styles.subtaskDescriptionInput]}
                    value={typeof sub === "string" ? "" : sub.description || ""}
                    onChangeText={(v) => updateSubtask(idx, sidx, "description", v)}
                    placeholder="Como fazer esta sub-etapa (com itens necessários, se houver)"
                    placeholderTextColor={COLORS.textSecondary}
                    multiline
                    numberOfLines={2}
                  />

                  {typeof sub !== "string" && (
                    <>
                      <TouchableOpacity
                        style={styles.optionalLinksButton}
                        onPress={() => toggleSubtaskLinksInput(idx, sidx)}
                      >
                        <Text style={styles.optionalLinksButtonText}>
                          {sub.linksInputOpen || (sub.links || []).length ? "Editar links" : "+ Links (opcional)"}
                        </Text>
                      </TouchableOpacity>

                      {(sub.linksInputOpen || (sub.links || []).length > 0) && (
                        <View style={styles.linksEditorBlock}>
                          <TextInput
                            style={[styles.input, styles.linksInput]}
                            value={linksToInputText(sub.links || [])}
                            onChangeText={(v) => updateSubtaskLinks(idx, sidx, v)}
                            placeholder="https://loja.com/produto-1, https://loja.com/produto-2"
                            placeholderTextColor={COLORS.textSecondary}
                          />
                          <Text style={styles.linksHint}>Até 3 links por sub-etapa.</Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
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
  subtaskEditorContent: { flex: 1 },
  subtaskDescriptionInput: { textAlignVertical: "top", minHeight: 56, marginBottom: 0 },
  optionalLinksButton: { alignSelf: "flex-start", marginTop: 8, marginBottom: 6 },
  optionalLinksButtonText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },
  linksEditorBlock: { marginBottom: 2 },
  linksInput: { marginBottom: 4 },
  linksHint: { fontSize: 11, color: COLORS.textSecondary },
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
