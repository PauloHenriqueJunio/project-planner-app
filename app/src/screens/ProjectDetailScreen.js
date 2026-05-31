import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../constants/colors";
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

function normalizeSubtasks(step, stepIdx) {
  const raw = Array.isArray(step.subtaskList) ? step.subtaskList : [];
  return raw.map((st, subIdx) => {
    if (typeof st === "string") {
      return { id: `${step.id || stepIdx}-sub-${subIdx}`, title: st, completed: false };
    }
    return {
      id: st.id || `${step.id || stepIdx}-sub-${subIdx}`,
      title: st.title || `Sub-tarefa ${subIdx + 1}`,
      completed: Boolean(st.completed),
    };
  });
}

function normalizeSteps(input) {
  const arr = Array.isArray(input) && input.length ? input : mockSteps;
  return arr.map((s, idx) => {
    const subtasks = normalizeSubtasks(s, idx);
    const completedBySubtasks = subtasks.length > 0 && subtasks.every((st) => st.completed);
    return {
      id: s.id || String(idx + 1),
      title: s.title || `Etapa ${idx + 1}`,
      description: s.description || "",
      subtaskList: subtasks,
      completed: subtasks.length > 0 ? completedBySubtasks : Boolean(s.completed),
    };
  });
}

const StepItem = ({ step, onToggleStep, onToggleSubtask, onOpenChat }) => {
  return (
    <View style={styles.stepCard}>
      <View style={styles.stepHeader}>
        <View style={styles.stepInfo}>
          <Text style={[styles.stepTitle, step.completed && styles.stepTitleCompleted]}>
            {step.title}
          </Text>
          {!!step.description && <Text style={styles.stepDescription}>{step.description}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.completeButton, step.completed && styles.completeButtonDone]}
          onPress={() => onToggleStep(step.id)}
        >
          <Text style={styles.completeButtonText}>{step.completed ? "Reabrir" : "Concluir"}</Text>
        </TouchableOpacity>
      </View>

      {Array.isArray(step.subtaskList) && step.subtaskList.length > 0 && (
        <View style={styles.subtasksContainer}>
          {step.subtaskList.map((st) => (
            <View key={st.id} style={styles.subtaskRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.subtaskText, st.completed && styles.stepTitleCompleted]}>{st.title}</Text>
              </View>

              <TouchableOpacity style={styles.chatButton} onPress={() => onOpenChat(st.title, step.title)}>
                <Text style={styles.chatButtonText}>Como fazer?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subtaskDoneButton, st.completed && styles.completeButtonDone]}
                onPress={() => onToggleSubtask(step.id, st.id)}
              >
                <Text style={styles.completeButtonText}>{st.completed ? "Reabrir" : "Concluir"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default function ProjectDetailScreen({ route, navigation }) {
  const { updateProject } = useContext(ProjectContext);
  const incomingSteps = route.params?.steps;
  const project = route.params?.project || { name: "Projeto Sem Nome", id: "1" };
  const [steps, setSteps] = useState(() => normalizeSteps(incomingSteps));

  const completedCount = useMemo(() => steps.filter((s) => s.completed).length, [steps]);
  const totalSteps = steps.length || 1;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  useEffect(() => {
    if (!project?.id) return;
    updateProject(project.id, (prev) => ({ ...prev, steps, progress: progressPercent }));
  }, [project?.id, steps, progressPercent, updateProject]);

  const toggleStep = (stepId) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step;
        const nextCompleted = !step.completed;
        const nextSubtasks = (step.subtaskList || []).map((st) => ({ ...st, completed: nextCompleted }));
        return { ...step, completed: nextCompleted, subtaskList: nextSubtasks };
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
        const nextCompleted = nextSubtasks.length > 0 && nextSubtasks.every((st) => st.completed);
        return { ...step, subtaskList: nextSubtasks, completed: nextCompleted };
      }),
    );
  };

  const openChat = (subtask, stepTitle) => {
    navigation.navigate("Chat", { project, stepTitle, subtask });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{project.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Progresso do Projeto</Text>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
        <Text style={styles.progressDetails}>
          {completedCount} de {steps.length} etapas concluídas
        </Text>
      </View>

      <Text style={styles.stepsTitle}>Etapas do Projeto</Text>

      <FlatList
        data={steps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StepItem
            step={item}
            onToggleStep={toggleStep}
            onToggleSubtask={toggleSubtask}
            onOpenChat={openChat}
          />
        )}
        contentContainerStyle={styles.stepsList}
      />

      <TouchableOpacity style={styles.trackingButton} onPress={() => navigation.navigate("Tracking", { project, steps })}>
        <Text style={styles.trackingButtonText}>Acompanhar Progresso</Text>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { fontSize: 14, color: COLORS.primary, fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.text, flex: 1, textAlign: "center" },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  progressPercent: { fontSize: 24, fontWeight: "bold", color: COLORS.primary },
  progressBarContainer: { height: 12, backgroundColor: COLORS.border, borderRadius: 6, overflow: "hidden", marginBottom: 8 },
  progressBarFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 6 },
  progressDetails: { fontSize: 12, color: COLORS.textSecondary, textAlign: "right" },
  stepsTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text, paddingHorizontal: 16, paddingVertical: 12 },
  stepsList: { paddingHorizontal: 16, paddingBottom: 20 },
  stepCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepInfo: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: "600", color: COLORS.text, marginBottom: 4 },
  stepTitleCompleted: { textDecorationLine: "line-through", color: COLORS.textSecondary },
  stepDescription: { fontSize: 12, color: COLORS.textSecondary },
  completeButton: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  completeButtonDone: { backgroundColor: COLORS.success },
  completeButtonText: { color: COLORS.text, fontWeight: "700", fontSize: 12 },
  subtasksContainer: { marginTop: 10, gap: 8 },
  subtaskRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subtaskText: { color: COLORS.text, fontSize: 13 },
  chatButton: { backgroundColor: `${COLORS.primary}30`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chatButtonText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  subtaskDoneButton: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  trackingButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  trackingButtonText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
});
