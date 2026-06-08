import React, { useContext, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";
import { API_BASE } from "../constants/config";
import Skeleton from "../components/Skeleton";
import { useToast } from "../context/ToastContext";
import { ProjectContext } from "../context/ProjectContext";

function createEmptyStep(seed) {
  return {
    id: `step-${seed}`,
    title: "",
    description: "",
    subtaskList: [
      {
        id: `sub-${seed}-0`,
        title: "",
        description: "",
        links: [],
        linksInputOpen: false,
      },
    ],
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
          label: (
            link.label ||
            link.title ||
            link.name ||
            `Link ${linkIdx + 1}`
          ).trim(),
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
    return [
      {
        id: `sub-fallback-${stepIdx}-0`,
        title: "",
        description: "",
        links: [],
        linksInputOpen: false,
      },
    ];
  }

  return rawSubtasks.map((sub, subIdx) => {
    if (typeof sub === "string") {
      return {
        id: `sub-${stepIdx}-${subIdx}`,
        title: sub,
        description: "",
        links: [],
        linksInputOpen: false,
      };
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
        description: (
          sub.description ||
          sub.details ||
          sub.how_to ||
          ""
        ).trim(),
        links: normalizeLinks(rawLinks, stepIdx, subIdx),
        linksInputOpen: false,
      };
    }

    return {
      id: `sub-${stepIdx}-${subIdx}`,
      title: "",
      description: "",
      links: [],
      linksInputOpen: false,
    };
  });
}

function formatLegacyProducts(products) {
  if (!Array.isArray(products)) return "";
  const names = products
    .map((product) => {
      if (typeof product === "string") return product.trim();
      if (product && typeof product === "object")
        return (product.name || product.title || "").trim();
      return "";
    })
    .filter(Boolean);

  if (!names.length) return "";
  return `Produtos recomendados nesta etapa: ${names.join(", ")}.`;
}

export default function CreateProjectScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const { addProject, updateProject } = useContext(ProjectContext);
  const editingProject = route?.params?.project || null;

  const [projectName, setProjectName] = useState(editingProject?.name || "");
  const [description, setDescription] = useState(
    editingProject?.description || "",
  );
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

  // API base now centralized in app/src/constants/config.js

  const addStep = () => {
    const seed = Date.now();
    setGeneratedSteps((prev) => [...prev, createEmptyStep(seed)]);
  };

  const [collapsed, setCollapsed] = useState({});
  const toggleCollapsed = (id) => setCollapsed((s) => ({ ...s, [id]: !s[id] }));
  const { show } = useToast();

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  const removeStep = (stepIndex) => {
    setGeneratedSteps((prev) => {
      const next = prev.filter((_, idx) => idx !== stepIndex);
      return next.length ? next : [createEmptyStep(Date.now())];
    });
  };

  const updateStepField = (stepIndex, field, value) => {
    setGeneratedSteps((prev) =>
      prev.map((step, idx) =>
        idx === stepIndex ? { ...step, [field]: value } : step,
      ),
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
                {
                  id: `sub-${seed}`,
                  title: "",
                  description: "",
                  links: [],
                  linksInputOpen: false,
                },
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
        const nextSubs = (step.subtaskList || []).filter(
          (_, sidx) => sidx !== subIndex,
        );
        return {
          ...step,
          subtaskList: nextSubs.length
            ? nextSubs
            : [
                {
                  id: `sub-${Date.now()}`,
                  title: "",
                  description: "",
                  links: [],
                  linksInputOpen: false,
                },
              ],
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
            sidx === subIndex
              ? { ...sub, linksInputOpen: !sub.linksInputOpen }
              : sub,
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
      show("Preencha nome ou descrição para gerar o plano.");
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
        show(
          "A IA não retornou etapas. Você pode preencher manualmente abaixo.",
        );
        return;
      }

      const mapped = rawSteps.map((s, idx) => {
        const title =
          typeof s === "string" ? s : s?.title || `Etapa ${idx + 1}`;
        const rawSubtasks = Array.isArray(s?.subtasks) ? s.subtasks : [];
        const legacyProducts = Array.isArray(s?.suggested_products)
          ? s.suggested_products
          : Array.isArray(s?.suggestedProducts)
            ? s.suggestedProducts
            : Array.isArray(s?.products)
              ? s.products
              : [];
        const baseDescription =
          typeof s === "object" ? s.description || "" : "";
        const legacyProductsText = formatLegacyProducts(legacyProducts);
        const mergedDescription = [baseDescription.trim(), legacyProductsText]
          .filter(Boolean)
          .join("\n\n");

        return {
          id: `step-ai-${Date.now()}-${idx}`,
          title: title || `Etapa ${idx + 1}`,
          description: mergedDescription,
          subtaskList: normalizeSubtasks(
            rawSubtasks.length ? rawSubtasks : [""],
            idx,
          ),
        };
      });

      setGeneratedSteps(mapped);
    } catch (err) {
      show(`Erro ao gerar plano: ${err.message}`);
    } finally {
      setLoadingPlan(false);
    }
  };

  const finalizeCreate = async () => {
    if (!projectName.trim()) {
      show("Por favor, insira um nome para o projeto.");
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
      show("Adicione pelo menos uma etapa com título para criar o projeto.");
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
        navigation.navigate("ProjectDetail", {
          project: updated,
          steps: cleanedSteps,
        });
      } else {
        const project = {
          name: projectName.trim(),
          id: String(Date.now()),
          description: description.trim(),
        };
        const projectWithSteps = { ...project, steps: cleanedSteps };
        addProject(projectWithSteps);
        navigation.navigate("ProjectDetail", { project, steps: cleanedSteps });
      }
    } catch (e) {
      console.warn(e);
      show("Não foi possível criar o projeto.");
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
          Você pode preencher manualmente etapa e sub-etapas. Inclua no texto
          como executar e, quando necessário, quais itens usar.
        </Text>
      </View>

      <View style={styles.generatedContainer}>
        <Text style={styles.label}>Etapas geradas (edite se quiser)</Text>
        {loadingPlan ? (
          <View>
            <Skeleton height={18} style={{ width: "70%" }} />
            <Skeleton height={14} style={{ width: "90%" }} />
            <Skeleton height={14} style={{ width: "60%" }} />
          </View>
        ) : (
          generatedSteps.map((step, idx) => (
            <View key={step.id} style={styles.stepShell}>
              <TouchableOpacity
                style={styles.stepSummary}
                onPress={() => toggleCollapsed(step.id)}
                activeOpacity={0.82}
              >
                <View style={styles.stepIndexPill}>
                  <Text style={styles.stepIndexText}>{idx + 1}</Text>
                </View>
                <View style={styles.stepSummaryContent}>
                  <View style={styles.stepSummaryTopRow}>
                    <Text style={styles.stepSummaryTitle} numberOfLines={1}>
                      {step.title || `Etapa ${idx + 1}`}
                    </Text>
                    <Text style={styles.stepSummaryMeta}>
                      {(step.subtaskList || []).length} sub-etapa
                      {(step.subtaskList || []).length === 1 ? "" : "s"}
                    </Text>
                  </View>
                  {!!step.description && (
                    <Text
                      style={styles.stepSummaryDescription}
                      numberOfLines={2}
                    >
                      {step.description}
                    </Text>
                  )}
                </View>
                <View style={styles.collapseBadge}>
                  <Text style={styles.collapseBadgeText}>
                    {collapsed[step.id] ? ">" : "v"}
                  </Text>
                </View>
              </TouchableOpacity>

              {!collapsed[step.id] && (
                <View style={styles.stepEditor}>
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
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={() => addSubtask(idx)}
                    >
                      <Text style={styles.smallButtonText}>+ Sub-etapa</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.smallDanger}
                      onPress={() => removeStep(idx)}
                    >
                      <Text style={styles.smallButtonText}>Remover Etapa</Text>
                    </TouchableOpacity>
                  </View>

                  {(step.subtaskList || []).map((sub, sidx) => (
                    <View
                      key={sub.id || `${step.id}-${sidx}`}
                      style={styles.subtaskCard}
                    >
                      <View style={styles.subtaskCardHeader}>
                        <Text style={styles.subtaskCardTitle}>
                          Sub-etapa {sidx + 1}
                        </Text>
                        <TouchableOpacity
                          style={styles.subtaskRemoveButton}
                          onPress={() => removeSubtask(idx, sidx)}
                        >
                          <Text style={styles.subtaskRemoveText}>Remover</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.subtaskEditorContent}>
                        <TextInput
                          style={[styles.input, { marginBottom: 6 }]}
                          value={typeof sub === "string" ? sub : sub.title}
                          onChangeText={(v) =>
                            updateSubtask(idx, sidx, "title", v)
                          }
                          placeholder={`Sub-etapa ${sidx + 1}`}
                          placeholderTextColor={COLORS.textSecondary}
                        />
                        <TextInput
                          style={[styles.input, styles.subtaskDescriptionInput]}
                          value={
                            typeof sub === "string" ? "" : sub.description || ""
                          }
                          onChangeText={(v) =>
                            updateSubtask(idx, sidx, "description", v)
                          }
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
                                {sub.linksInputOpen || (sub.links || []).length
                                  ? "Editar links"
                                  : "+ Links (opcional)"}
                              </Text>
                            </TouchableOpacity>

                            {(sub.linksInputOpen ||
                              (sub.links || []).length > 0) && (
                              <View style={styles.linksEditorBlock}>
                                <TextInput
                                  style={[styles.input, styles.linksInput]}
                                  value={linksToInputText(sub.links || [])}
                                  onChangeText={(v) =>
                                    updateSubtaskLinks(idx, sidx, v)
                                  }
                                  placeholder="https://loja.com/produto-1, https://loja.com/produto-2"
                                  placeholderTextColor={COLORS.textSecondary}
                                />
                                <Text style={styles.linksHint}>
                                  Até 3 links por sub-etapa.
                                </Text>
                              </View>
                            )}
                          </>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.smallButton, { alignSelf: "flex-start" }]}
          onPress={addStep}
        >
          <Text style={styles.smallButtonText}>+ Adicionar Etapa</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inlineActionRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={generatePlanFromAI}
        >
          <Text style={styles.secondaryButtonText}>
            {loadingPlan ? "Gerando..." : "Gerar com IA"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.createButton} onPress={finalizeCreate}>
          <Text style={styles.createButtonText}>
            {isSubmitting ? "Criando..." : "Criar Projeto"}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator
      >
        <View style={[styles.header, isMobile && styles.headerMobile]}>
          {!isMobile && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Voltar</Text>
          </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {editingProject ? "Editar Projeto" : "Novo Projeto"}
          </Text>
          {!isMobile && (
          <TouchableOpacity
            style={styles.headerHomeButton}
            onPress={goHome}
          >
            <Text style={styles.headerHomeButtonText}>HOME</Text>
          </TouchableOpacity>
          )}
        </View>

        <Text style={styles.pageSubtitle}>
          Gere um plano com pesquisa web e IA, ou edite manualmente abaixo.
        </Text>
        {formContent}
      </ScrollView>
      {isMobile && (
        <View style={styles.mobileActionBar}>
          <TouchableOpacity
            style={styles.mobileSecondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.mobileSecondaryButtonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileSecondaryButton} onPress={goHome}>
            <Text style={styles.mobileSecondaryButtonText}>HOME</Text>
          </TouchableOpacity>
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
    paddingHorizontal: UI.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerMobile: {
    justifyContent: "center",
  },
  scrollView: { flex: 1 },
  scrollContent: {
    padding: UI.spacing.xl,
    paddingBottom: 96,
  },
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.text },
  headerHomeButton: {
    height: 36,
    paddingHorizontal: UI.spacing.md,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerHomeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "900",
  },
  mobileActionBar: {
    flexDirection: "row",
    gap: UI.spacing.sm,
    paddingHorizontal: UI.spacing.lg,
    paddingVertical: UI.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  mobileSecondaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mobileSecondaryButtonText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  content: { paddingBottom: 24 },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
    lineHeight: 20,
  },
  formGroup: { marginBottom: UI.spacing.lg },
  label: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: UI.spacing.sm,
  },
  input: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.radius.md,
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 11,
    color: COLORS.text,
    fontSize: 14,
    marginBottom: UI.spacing.sm,
  },
  textArea: { textAlignVertical: "top", height: 80 },
  infoBox: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: UI.radius.lg,
    padding: UI.spacing.lg,
    marginBottom: UI.spacing.lg,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
    marginBottom: 4,
  },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  generatedContainer: { marginTop: 8 },
  stepShell: {
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: "#334155",
    marginBottom: UI.spacing.lg,
    overflow: "hidden",
    ...UI.shadow,
  },
  stepSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: UI.spacing.lg,
    padding: UI.spacing.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepIndexPill: {
    width: 48,
    height: 48,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIndexText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
  },
  stepSummaryContent: { flex: 1 },
  stepSummaryTopRow: {
    gap: UI.spacing.xs,
  },
  stepSummaryTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
  stepSummaryMeta: {
    alignSelf: "flex-start",
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  stepSummaryDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: UI.spacing.sm,
  },
  collapseBadge: {
    width: 34,
    height: 34,
    borderRadius: UI.radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  collapseBadgeText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "800",
  },
  stepEditor: {
    padding: UI.spacing.lg,
    backgroundColor: COLORS.cardBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  stepButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  subtaskEditorContent: { flex: 1 },
  subtaskDescriptionInput: {
    textAlignVertical: "top",
    minHeight: 56,
    marginBottom: 0,
  },
  optionalLinksButton: {
    alignSelf: "flex-start",
    marginTop: 8,
    marginBottom: 6,
  },
  optionalLinksButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.primary,
  },
  linksEditorBlock: { marginBottom: 2 },
  linksInput: { marginBottom: 4 },
  linksHint: { fontSize: 11, color: COLORS.textSecondary },
  smallButton: {
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.md,
    marginRight: 8,
  },
  smallDanger: {
    paddingHorizontal: UI.spacing.md,
    paddingVertical: 8,
    backgroundColor: COLORS.error,
    borderRadius: UI.radius.md,
  },
  smallButtonText: { color: COLORS.background, fontWeight: "700" },
  subtaskCard: {
    backgroundColor: COLORS.surface,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: UI.spacing.md,
    marginTop: UI.spacing.md,
  },
  subtaskCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: UI.spacing.sm,
    marginBottom: UI.spacing.sm,
  },
  subtaskCardTitle: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  subtaskRemoveButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: UI.radius.sm,
    backgroundColor: `${COLORS.error}18`,
    borderWidth: 1,
    borderColor: `${COLORS.error}55`,
  },
  subtaskRemoveText: {
    color: COLORS.error,
    fontSize: 11,
    fontWeight: "800",
  },
  inlineActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: UI.radius.md,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  createButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.md,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.background,
  },
});
