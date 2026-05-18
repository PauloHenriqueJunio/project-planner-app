import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
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

  const completedCount = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{project.titulo || project.name}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressLabel}>Progresso do Projeto</Text>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View
            style={[styles.progressBarFill, { width: `${progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressDetails}>
          {completedCount} de {totalSteps} etapas concluídas
        </Text>
      </View>

      <Text style={styles.stepsTitle}>Etapas do Projeto</Text>

      <FlatList
        data={steps}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StepItem step={item} onToggle={toggleStep} />
        )}
        contentContainerStyle={styles.stepsList}
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
      />

      <TouchableOpacity
        style={styles.trackingButton}
        onPress={() =>
          navigation.navigate("Tracking", {
            project,
            steps,
          })
        }
      >
        <Text style={styles.trackingButtonText}>Acompanhar Progresso</Text>
      </TouchableOpacity>
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
    flex: 1,
    textAlign: "center",
  },
  progressSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: COLORS.border,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 6,
  },
  progressDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "right",
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  stepCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  checkmark: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  stepTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  stepDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeCompleted: {
    backgroundColor: `${COLORS.success}20`,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  statusTextCompleted: {
    color: COLORS.success,
  },
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
  trackingButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  trackingButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
});
