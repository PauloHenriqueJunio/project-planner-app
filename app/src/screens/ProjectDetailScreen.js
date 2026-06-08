import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { COLORS, UI } from "../constants/colors";
import { ProjectContext } from "../context/ProjectContext";

const fallbackSteps = [
  {
    id: "1",
    title: "Planejamento",
    description: "Definir escopo e objetivos",
    completed: false,
    subtaskList: [
      { id: "1-1", title: "Definir escopo", completed: false },
      { id: "1-2", title: "Definir objetivos", completed: false },
    ],
  },
];

function normalizeUrl(rawUrl) {
  const candidate = String(rawUrl || "").trim();
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (/^www\./i.test(candidate)) return `https://${candidate}`;
  return "";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildProjectPdfHtml({ project, steps, completedCount, progressPercent }) {
  const projectName = project.name || project.titulo || "Projeto Sem Nome";
  const category =
    project.categoriaDetectada || project.categoria || "Nao identificada";
  const generatedAt = new Date().toLocaleString("pt-BR");
  const totalSubtasks = steps.reduce(
    (sum, step) => sum + (step.subtaskList || []).length,
    0,
  );
  const completedSubtasks = steps.reduce(
    (sum, step) =>
      sum + (step.subtaskList || []).filter((subtask) => subtask.completed).length,
    0,
  );

  const stepItems = steps
    .map((step, stepIdx) => {
      const subtasks = (step.subtaskList || [])
        .map((subtask) => {
          const links = (subtask.links || [])
            .map(
              (link) =>
                `<li><a href="${escapeHtml(link.url)}">${escapeHtml(
                  link.label || link.url,
                )}</a></li>`,
            )
            .join("");

          return `
            <div class="subtask">
              <div class="subtask-title">
                <span class="${subtask.completed ? "status done" : "status"}">
                  ${subtask.completed ? "Concluida" : "Pendente"}
                </span>
                ${escapeHtml(subtask.title)}
              </div>
              ${
                subtask.description
                  ? `<p>${escapeHtml(subtask.description)}</p>`
                  : ""
              }
              ${links ? `<ul class="links">${links}</ul>` : ""}
            </div>
          `;
        })
        .join("");

      return `
        <section class="step">
          <div class="step-heading">
            <span class="step-number">${stepIdx + 1}</span>
            <div>
              <h2>${escapeHtml(step.title)}</h2>
              ${
                step.description
                  ? `<p class="step-description">${escapeHtml(step.description)}</p>`
                  : ""
              }
            </div>
            <span class="${step.completed ? "badge done" : "badge"}">
              ${step.completed ? "Concluida" : "Pendente"}
            </span>
          </div>
          ${subtasks || '<p class="empty">Sem subtarefas cadastradas.</p>'}
        </section>
      `;
    })
    .join("");

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(projectName)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            color: #0f172a;
            background: #f8fafc;
            font-family: Arial, Helvetica, sans-serif;
            line-height: 1.45;
          }
          .page {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 32px;
          }
          h1 { margin: 0 0 8px; font-size: 28px; }
          h2 { margin: 0; font-size: 18px; }
          p { margin: 6px 0 0; }
          .meta { color: #475569; font-size: 13px; }
          .summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 24px 0;
          }
          .summary-card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            background: #f8fafc;
          }
          .summary-label {
            color: #64748b;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
          }
          .summary-value {
            display: block;
            margin-top: 6px;
            color: #0284c7;
            font-size: 22px;
            font-weight: 800;
          }
          .progress {
            height: 10px;
            background: #e2e8f0;
            border-radius: 999px;
            overflow: hidden;
            margin: 8px 0 24px;
          }
          .progress-fill {
            width: ${progressPercent}%;
            height: 100%;
            background: #0284c7;
          }
          .step {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            margin-top: 20px;
            break-inside: avoid;
          }
          .step-heading {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          .step-number {
            min-width: 30px;
            height: 30px;
            border-radius: 8px;
            background: #e0f2fe;
            color: #0369a1;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
          }
          .step-description, .subtask p, .empty {
            color: #475569;
            font-size: 13px;
          }
          .badge, .status {
            border: 1px solid #cbd5e1;
            border-radius: 999px;
            color: #475569;
            display: inline-block;
            font-size: 11px;
            font-weight: 800;
            padding: 4px 8px;
            white-space: nowrap;
          }
          .badge { margin-left: auto; }
          .done {
            border-color: #86efac;
            background: #dcfce7;
            color: #166534;
          }
          .subtask {
            margin-left: 42px;
            padding: 12px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .subtask-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 800;
          }
          .links {
            margin: 8px 0 0 20px;
            padding: 0;
            font-size: 13px;
          }
          a { color: #0284c7; }
          @media print {
            body { background: #ffffff; padding: 0; }
            .page { border: 0; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <main class="page">
          <h1>${escapeHtml(projectName)}</h1>
          <p class="meta">Categoria: ${escapeHtml(category)}</p>
          <p class="meta">Gerado em ${escapeHtml(generatedAt)}</p>

          <div class="summary">
            <div class="summary-card">
              <span class="summary-label">Progresso</span>
              <span class="summary-value">${progressPercent}%</span>
            </div>
            <div class="summary-card">
              <span class="summary-label">Etapas</span>
              <span class="summary-value">${completedCount}/${steps.length}</span>
            </div>
            <div class="summary-card">
              <span class="summary-label">Subtarefas</span>
              <span class="summary-value">${completedSubtasks}/${totalSubtasks}</span>
            </div>
          </div>

          <div class="progress"><div class="progress-fill"></div></div>
          ${stepItems || '<p class="empty">Sem etapas cadastradas.</p>'}
        </main>
      </body>
    </html>
  `;
}

function normalizeSubtasks(step, stepIdx) {
  const raw = Array.isArray(step.subtaskList)
    ? step.subtaskList
    : Array.isArray(step.subtasks)
      ? step.subtasks
      : Array.isArray(step.subetapas)
        ? step.subetapas
        : [];

  return raw.map((st, subIdx) => {
    if (typeof st === "string") {
      return {
        id: `${step.id || stepIdx}-sub-${subIdx}`,
        title: st,
        description: "",
        links: [],
        completed: false,
      };
    }

    const rawLinks = Array.isArray(st.links)
      ? st.links
      : Array.isArray(st.product_links)
        ? st.product_links
        : Array.isArray(st.productLinks)
          ? st.productLinks
          : [];

    const links = rawLinks
      .map((link, linkIdx) => {
        if (typeof link === "string") {
          const url = normalizeUrl(link);
          if (!url) return null;
          return {
            id: `${step.id || stepIdx}-sub-${subIdx}-link-${linkIdx}`,
            label: `Link ${linkIdx + 1}`,
            url,
          };
        }

        if (link && typeof link === "object") {
          const url = normalizeUrl(link.url || link.href || link.link);
          if (!url) return null;
          return {
            id:
              link.id || `${step.id || stepIdx}-sub-${subIdx}-link-${linkIdx}`,
            label: (
              link.label ||
              link.title ||
              link.name ||
              `Link ${linkIdx + 1}`
            ).trim(),
            url,
          };
        }

        return null;
      })
      .filter(Boolean)
      .slice(0, 3);

    return {
      id: st.id || `${step.id || stepIdx}-sub-${subIdx}`,
      title: st.title || st.name || `Sub-tarefa ${subIdx + 1}`,
      description: st.description || st.details || "",
      links,
      completed: Boolean(st.completed),
    };
  });
}

function normalizeSteps(input) {
  const arr = Array.isArray(input) && input.length ? input : fallbackSteps;
  return arr.map((s, idx) => {
    const subtasks = normalizeSubtasks(s, idx);
    const completedBySubtasks =
      subtasks.length > 0 && subtasks.every((st) => st.completed);
    return {
      id: s.id || String(idx + 1),
      title: s.title || s.titulo || `Etapa ${idx + 1}`,
      description: s.description || "",
      subtaskList: subtasks,
      completed:
        subtasks.length > 0 ? completedBySubtasks : Boolean(s.completed),
    };
  });
}

const StepItem = ({
  step,
  index,
  onToggleStep,
  onToggleSubtask,
  onOpenChat,
  onOpenLink,
}) => (
  <View style={styles.stepCard}>
    <View style={styles.stepHeader}>
      <View
        style={[styles.stepNumber, step.completed && styles.stepNumberDone]}
      >
        <Text style={styles.stepNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.stepInfo}>
        <Text
          style={[styles.stepTitle, step.completed && styles.textCompleted]}
        >
          {step.title}
        </Text>
        {!!step.description && (
          <Text style={styles.stepDescription}>{step.description}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.completeButton,
          step.completed && styles.completeButtonDone,
        ]}
        onPress={() => onToggleStep(step.id)}
      >
        <Text style={styles.completeButtonText}>
          {step.completed ? "Reabrir" : "Concluir"}
        </Text>
      </TouchableOpacity>
    </View>

    {Array.isArray(step.subtaskList) && step.subtaskList.length > 0 && (
      <View style={styles.subtasksContainer}>
        {step.subtaskList.map((st) => (
          <View key={st.id} style={styles.subtaskRow}>
            <TouchableOpacity
              style={[
                styles.checkButton,
                st.completed && styles.checkButtonDone,
              ]}
              onPress={() => onToggleSubtask(step.id, st.id)}
            >
              <Text style={styles.checkButtonText}>
                {st.completed ? "OK" : ""}
              </Text>
            </TouchableOpacity>

            <View style={styles.subtaskContent}>
              <Text
                style={[
                  styles.subtaskText,
                  st.completed && styles.textCompleted,
                ]}
              >
                {st.title}
              </Text>
              {!!st.description && (
                <Text style={styles.subtaskDescription}>{st.description}</Text>
              )}

              {Array.isArray(st.links) && st.links.length > 0 && (
                <View style={styles.subtaskLinksRow}>
                  {st.links.map((link) => (
                    <TouchableOpacity
                      key={link.id || `${st.id}-${link.url}`}
                      style={styles.subtaskLinkChip}
                      onPress={() => onOpenLink(link.url)}
                    >
                      <Text style={styles.subtaskLinkChipText}>
                        {link.label || "Abrir link"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.chatButton}
                onPress={() =>
                  onOpenChat(
                    st.description
                      ? `${st.title}: ${st.description}`
                      : st.title,
                    step.title,
                  )
                }
              >
                <Text style={styles.chatButtonText}>Pedir ajuda da IA</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    )}
  </View>
);

export default function ProjectDetailScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const { updateProject } = useContext(ProjectContext);
  const incomingSteps = route.params?.steps;
  const project = route.params?.project || {
    name: "Projeto Sem Nome",
    id: "1",
  };
  const [steps, setSteps] = useState(() => normalizeSteps(incomingSteps));

  const completedCount = useMemo(
    () => steps.filter((s) => s.completed).length,
    [steps],
  );
  const totalSteps = steps.length || 1;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  useEffect(() => {
    if (!project?.id) return;
    updateProject(project.id, (prev) => ({
      ...prev,
      steps,
      progress: progressPercent,
    }));
  }, [project?.id, steps, progressPercent, updateProject]);

  const toggleStep = (stepId) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step;
        const nextCompleted = !step.completed;
        const nextSubtasks = (step.subtaskList || []).map((st) => ({
          ...st,
          completed: nextCompleted,
        }));
        return {
          ...step,
          completed: nextCompleted,
          subtaskList: nextSubtasks,
        };
      }),
    );
  };

  const toggleSubtask = (stepId, subtaskId) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step;
        const nextSubtasks = (step.subtaskList || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st,
        );
        const nextCompleted =
          nextSubtasks.length > 0 && nextSubtasks.every((st) => st.completed);
        return { ...step, subtaskList: nextSubtasks, completed: nextCompleted };
      }),
    );
  };

  const openChat = (subtask, stepTitle) => {
    navigation.navigate("Chat", { project, stepTitle, subtask });
  };

  const openLink = async (url) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        alert("Nao foi possivel abrir este link.");
        return;
      }
      await Linking.openURL(url);
    } catch (_error) {
      alert("Nao foi possivel abrir este link.");
    }
  };

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  const goTracking = () => {
    navigation.navigate("Tracking", { project, steps });
  };

  const exportProjectPdf = async () => {
    const html = buildProjectPdfHtml({
      project,
      steps,
      completedCount,
      progressPercent,
    });

    try {
      if (Platform.OS === "web") {
        const printWindow = globalThis.window?.open("", "_blank");
        if (!printWindow) {
          alert("Nao foi possivel abrir a janela de impressao.");
          return;
        }

        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
        return;
      }

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Exportar projeto em PDF",
          UTI: "com.adobe.pdf",
        });
        return;
      }

      Alert.alert("PDF gerado", `Arquivo salvo em:\n${uri}`);
    } catch (_error) {
      Alert.alert("Erro", "Nao foi possivel exportar o PDF agora.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        {!isMobile && (
          <TouchableOpacity style={styles.headerTextButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Voltar</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project.name || project.titulo}
        </Text>
        {!isMobile && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerGhostButton} onPress={goHome}>
              <Text style={styles.headerGhostButtonText}>HOME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerGhostButton} onPress={exportProjectPdf}>
              <Text style={styles.headerGhostButtonText}>PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerPrimaryButton} onPress={goTracking}>
              <Text style={styles.headerPrimaryButtonText}>Acompanhar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.categoryText}>
          Categoria:{" "}
          {project.categoriaDetectada ||
            project.categoria ||
            "Nao identificada"}
        </Text>
        <View style={styles.progressInfo}>
          <View>
            <Text style={styles.progressLabel}>Progresso do projeto</Text>
            <Text style={styles.progressDetails}>
              {completedCount} de {steps.length} etapas concluidas
            </Text>
          </View>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      <FlatList
        data={steps}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <StepItem
            step={item}
            index={index}
            onToggleStep={toggleStep}
            onToggleSubtask={toggleSubtask}
            onOpenChat={openChat}
            onOpenLink={openLink}
          />
        )}
        ListHeaderComponent={<Text style={styles.stepsTitle}>Etapas</Text>}
        contentContainerStyle={[
          styles.stepsList,
          isMobile && styles.stepsListMobile,
        ]}
        scrollEnabled
      />

      {isMobile && (
        <View style={styles.mobileActionBar}>
          <TouchableOpacity style={styles.mobileSecondaryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.mobileSecondaryButtonText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobilePrimaryButton} onPress={goTracking}>
            <Text style={styles.mobilePrimaryButtonText}>Acompanhar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileSecondaryButton} onPress={exportProjectPdf}>
            <Text style={styles.mobileSecondaryButtonText}>PDF</Text>
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
  container: { flex: 1, backgroundColor: COLORS.background },
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
    paddingHorizontal: UI.spacing.lg,
  },
  headerTextButton: {
    width: 92,
  },
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    width: 210,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: UI.spacing.sm,
  },
  headerGhostButton: {
    height: 36,
    paddingHorizontal: UI.spacing.md,
    borderRadius: UI.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerGhostButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "900",
  },
  headerPrimaryButton: {
    height: 36,
    paddingHorizontal: UI.spacing.md,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerPrimaryButtonText: {
    color: COLORS.background,
    fontSize: 12,
    fontWeight: "900",
  },
  progressSection: {
    margin: UI.spacing.lg,
    padding: UI.spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...UI.shadow,
  },
  categoryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
    fontWeight: "600",
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: UI.spacing.md,
    gap: UI.spacing.md,
  },
  progressLabel: { fontSize: 14, fontWeight: "800", color: COLORS.text },
  progressPercent: { fontSize: 28, fontWeight: "800", color: COLORS.primary },
  progressBarContainer: {
    height: 10,
    backgroundColor: COLORS.border,
    borderRadius: UI.radius.sm,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.sm,
  },
  progressDetails: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: UI.spacing.md,
  },
  stepsList: { paddingHorizontal: UI.spacing.lg, paddingBottom: 96 },
  stepsListMobile: { paddingBottom: 112 },
  stepCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    padding: UI.spacing.lg,
    marginBottom: UI.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...UI.shadow,
  },
  stepHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: UI.radius.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepNumberDone: {
    backgroundColor: `${COLORS.success}24`,
    borderColor: `${COLORS.success}55`,
  },
  stepNumberText: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  stepInfo: { flex: 1 },
  stepTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  textCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  stepDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: UI.radius.md,
  },
  completeButtonDone: { backgroundColor: COLORS.success },
  completeButtonText: {
    color: COLORS.background,
    fontWeight: "800",
    fontSize: 12,
  },
  subtasksContainer: { marginTop: UI.spacing.lg, gap: UI.spacing.md },
  subtaskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: UI.spacing.md,
    paddingTop: UI.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  checkButtonDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkButtonText: {
    color: COLORS.background,
    fontSize: 10,
    fontWeight: "800",
  },
  subtaskContent: { flex: 1 },
  subtaskDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 18,
  },
  subtaskText: { color: COLORS.text, fontSize: 13, fontWeight: "700" },
  subtaskLinksRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: UI.spacing.sm,
  },
  subtaskLinkChip: {
    backgroundColor: `${COLORS.primary}18`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}55`,
    borderRadius: UI.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  subtaskLinkChipText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  chatButton: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: UI.radius.md,
    marginTop: UI.spacing.sm,
  },
  chatButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "800",
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
  mobilePrimaryButton: {
    flex: 1.4,
    minHeight: 52,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  mobilePrimaryButtonText: {
    color: COLORS.background,
    fontSize: 13,
    fontWeight: "900",
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
});
