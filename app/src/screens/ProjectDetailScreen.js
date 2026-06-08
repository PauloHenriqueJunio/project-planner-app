<<<<<<< HEAD
import React, { useMemo, useState } from "react";
=======
import React, { useContext, useEffect, useMemo, useState } from "react";
>>>>>>> main
import {
  FlatList,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
<<<<<<< HEAD
  Pressable,
} from "react-native";
import { COLORS } from "../constants/colors";
import { updateProject } from "../storage/projectStorage";

const StepItem = ({ step, onToggle }) => {
  return (
    <Pressable style={styles.stepCard} onPress={() => onToggle(step.id)}>
      <View style={styles.stepHeader}>
        <Pressable
          style={[styles.checkbox, step.completed && styles.checkboxCompleted]}
          onPress={() => onToggle(step.id)}
        >
          {step.completed && <Text style={styles.checkmark}>✓</Text>}
        </Pressable>

        <View style={styles.stepInfo}>
          <Text
            style={[
              styles.stepTitle,
              step.completed && styles.stepTitleCompleted,
            ]}
          >
            {step.title}
          </Text>
          <Text style={styles.stepDescription} numberOfLines={2}>
            {step.subetapas?.join(" • ") || "Sem subetapas geradas"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default function ProjectDetailScreen({ route, navigation }) {
  const projectFromRoute = route.params?.project || {
    id: "1",
    titulo: "Projeto Sem Nome",
    name: "Projeto Sem Nome",
    etapas: [],
    progresso: 0,
  };

  const [project, setProject] = useState(projectFromRoute);

  const steps = useMemo(() => {
    return (project.etapas || []).map((step, index) => ({
      id: step.id || `${project.id}-${index}`,
      titulo: step.titulo || step.title || `Etapa ${index + 1}`,
      title: step.title || step.titulo || `Etapa ${index + 1}`,
      subetapas: step.subetapas || [],
      completed: Boolean(step.completed),
    }));
  }, [project]);

  const persistProject = async (nextProject) => {
    setProject(nextProject);
    await updateProject(nextProject);
  };

  const toggleStep = async (stepId) => {
    const nextSteps = steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step,
=======
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";
import { ProjectContext } from "../context/ProjectContext";

const mockSteps = [
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

function normalizeSubtasks(step, stepIdx) {
  const raw = Array.isArray(step.subtaskList) ? step.subtaskList : [];
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
            id: link.id || `${step.id || stepIdx}-sub-${subIdx}-link-${linkIdx}`,
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
      title: st.title || `Sub-tarefa ${subIdx + 1}`,
      description: st.description || "",
      links,
      completed: Boolean(st.completed),
    };
  });
}

function normalizeSteps(input) {
  const arr = Array.isArray(input) && input.length ? input : mockSteps;
  return arr.map((s, idx) => {
    const subtasks = normalizeSubtasks(s, idx);
    const completedBySubtasks =
      subtasks.length > 0 && subtasks.every((st) => st.completed);
    return {
      id: s.id || String(idx + 1),
      title: s.title || `Etapa ${idx + 1}`,
      description: s.description || "",
      subtaskList: subtasks,
      completed: subtasks.length > 0 ? completedBySubtasks : Boolean(s.completed),
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
      <View style={[styles.stepNumber, step.completed && styles.stepNumberDone]}>
        <Text style={styles.stepNumberText}>{index + 1}</Text>
      </View>
      <View style={styles.stepInfo}>
        <Text style={[styles.stepTitle, step.completed && styles.textCompleted]}>
          {step.title}
        </Text>
        {!!step.description && (
          <Text style={styles.stepDescription}>{step.description}</Text>
        )}
      </View>
      <TouchableOpacity
        style={[styles.completeButton, step.completed && styles.completeButtonDone]}
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
              <Text style={styles.checkButtonText}>{st.completed ? "✓" : ""}</Text>
            </TouchableOpacity>

            <View style={styles.subtaskContent}>
              <Text style={[styles.subtaskText, st.completed && styles.textCompleted]}>
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
                    st.description ? `${st.title}: ${st.description}` : st.title,
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
  const { updateProject } = useContext(ProjectContext);
  const incomingSteps = route.params?.steps;
  const project = route.params?.project || { name: "Projeto Sem Nome", id: "1" };
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
>>>>>>> main
    );

    const completedCount = nextSteps.filter((step) => step.completed).length;
    const totalSteps = nextSteps.length;
    const progressPercent = totalSteps
      ? Math.round((completedCount / totalSteps) * 100)
      : 0;

    const nextProject = {
      ...project,
      etapas: nextSteps,
      progresso: progressPercent,
    };

    await persistProject(nextProject);
  };

<<<<<<< HEAD
  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;
=======
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
        alert("Não foi possível abrir este link.");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      alert("Não foi possível abrir este link.");
    }
  };
>>>>>>> main

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
<<<<<<< HEAD
        <Text style={styles.headerTitle}>{project.titulo || project.name}</Text>
=======
        <Text style={styles.headerTitle} numberOfLines={1}>
          {project.name}
        </Text>
>>>>>>> main
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.progressSection}>
        <Text style={styles.categoryText}>
          Categoria:{" "}
          {project.categoriaDetectada ||
            project.categoria ||
            "Não identificada"}
        </Text>
        <View style={styles.progressInfo}>
          <View>
            <Text style={styles.progressLabel}>Progresso do projeto</Text>
            <Text style={styles.progressDetails}>
              {completedCount} de {steps.length} etapas concluídas
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
        contentContainerStyle={styles.stepsList}
<<<<<<< HEAD
        scrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nenhuma etapa gerada</Text>
            <Text style={styles.emptyStateText}>
              Este projeto foi salvo no modo manual. Você pode adicionar etapas
              depois.
            </Text>
          </View>
        }
=======
>>>>>>> main
      />

      <TouchableOpacity
        style={styles.trackingButton}
        onPress={() => navigation.navigate("Tracking", { project, steps })}
      >
        <Text style={styles.trackingButtonText}>Acompanhar progresso</Text>
      </TouchableOpacity>
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
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "700" },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
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
  textCompleted: { textDecorationLine: "line-through", color: COLORS.textMuted },
  stepDescription: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
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
    fontSize: 13,
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
<<<<<<< HEAD
  emptyState: {
    padding: 20,
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 16,
    marginTop: 12,
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
=======
  chatButtonText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "800" },
>>>>>>> main
  trackingButton: {
    marginHorizontal: UI.spacing.lg,
    marginBottom: UI.spacing.lg,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.md,
    alignItems: "center",
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.background,
  },
});
