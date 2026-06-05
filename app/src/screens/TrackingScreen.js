import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
<<<<<<< HEAD
  Pressable,
} from "react-native";
import { COLORS } from "../constants/colors";
import { getProjects, updateProject } from "../storage/projectStorage";
=======
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";
>>>>>>> main

export default function TrackingScreen({ route, navigation }) {
  const routeProject = route.params?.project;
  const routeSteps = route.params?.steps || [];

  const [project, setProject] = useState(
    routeProject || { name: "Projeto Sem Nome", id: "1", etapas: [] },
  );
  const [steps, setSteps] = useState(
    routeSteps.length > 0 ? routeSteps : project.etapas || project.steps || [],
  );

  useEffect(() => {
    const load = async () => {
      if (!project?.id) return;
      const all = await getProjects();
      const found = all.find((p) => p.id === project.id);
      if (found) {
        setProject(found);
        setSteps(found.etapas || found.steps || []);
      }
    };

    load();
  }, [route.params]);

  const nextPendingStep = useMemo(
    () => steps.find((step) => !step.completed),
    [steps],
  );

  const completedCount = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;
<<<<<<< HEAD

  const toggleStep = async (stepId) => {
    const nextSteps = steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step,
    );

    const nextCompletedCount = nextSteps.filter(
      (step) => step.completed,
    ).length;
    const nextTotalSteps = nextSteps.length;
    const nextProgressPercent = nextTotalSteps
      ? Math.round((nextCompletedCount / nextTotalSteps) * 100)
      : 0;

    const nextProject = {
      ...project,
      etapas: nextSteps,
      progresso: nextProgressPercent,
    };

    setProject(nextProject);
    setSteps(nextSteps);

    try {
      await updateProject(nextProject);
    } catch (_error) {
      // Persistência local falhou, mas a UI continua funcionando.
    }
  };
=======
>>>>>>> main

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhamento</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Projeto</Text>
          <Text style={styles.heroTitle}>{project.name}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.heroMeta}>{progressPercent}% concluído</Text>
        </View>

        <View style={styles.statsGrid}>
          <MetricCard label="Etapas" value={totalSteps} />
          <MetricCard label="Concluídas" value={completedCount} tone="success" />
          <MetricCard
            label="Pendentes"
            value={Math.max(totalSteps - completedCount, 0)}
            tone="warning"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Próximo passo</Text>
          {nextPendingStep ? (
            <View style={styles.nextStepCard}>
<<<<<<< HEAD
              <View style={styles.nextStepIcon}>
                <Text style={styles.nextStepIconText}>📍</Text>
              </View>
              <View style={styles.nextStepContent}>
                <Text style={styles.nextStepTitle}>
                  {nextPendingStep.title || nextPendingStep.titulo}
                </Text>
=======
              <Text style={styles.nextStepTitle}>{nextPendingStep.title}</Text>
              {!!nextPendingStep.description && (
>>>>>>> main
                <Text style={styles.nextStepDescription}>
                  {nextPendingStep.description ||
                    nextPendingStep.subetapas?.join(" • ")}
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.completedCard}>
              <Text style={styles.completedText}>
                Parabéns! Todos os passos foram concluídos.
              </Text>
            </View>
          )}
        </View>

<<<<<<< HEAD
        {/* Informações do Projeto */}
        <View style={styles.projectInfoSection}>
          <Text style={styles.sectionTitle}>Informações do Projeto</Text>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nome do Projeto</Text>
            <Text style={styles.infoValue}>
              {project.name || project.titulo}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Total de Etapas</Text>
            <Text style={styles.infoValue}>{totalSteps}</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Concluídas</Text>
            <Text style={styles.infoValue} style={{ color: COLORS.success }}>
              {completedCount}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Pendentes</Text>
            <Text style={styles.infoValue} style={{ color: COLORS.warning }}>
              {totalSteps - completedCount}
            </Text>
          </View>
        </View>

        {/* Progresso Geral */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progresso Geral</Text>

          <View style={styles.progressCard}>
            <View style={styles.progressCircle}>
              <Text style={styles.progressPercent}>{progressPercent}%</Text>
            </View>

            <View style={styles.progressBarVertical}>
              <View
                style={[
                  styles.progressBarVerticalFill,
                  { height: `${progressPercent}%` },
                ]}
              />
            </View>

            <View style={styles.progressStats}>
              <View style={styles.statItem}>
                <View
                  style={[styles.statDot, { backgroundColor: COLORS.success }]}
                />
                <Text style={styles.statLabel}>Concluído</Text>
                <Text style={styles.statValue}>{completedCount}</Text>
              </View>

              <View style={styles.statItem}>
                <View
                  style={[styles.statDot, { backgroundColor: COLORS.border }]}
                />
                <Text style={styles.statLabel}>Pendente</Text>
                <Text style={styles.statValue}>
                  {totalSteps - completedCount}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Etapas Restantes */}
        {steps.length > 0 && (
          <View style={styles.stepsSection}>
            <Text style={styles.sectionTitle}>Todas as Etapas</Text>

            {steps.map((step) => (
              <Pressable
                key={step.id}
                onPress={() => toggleStep(step.id)}
                style={[
                  styles.stepItemList,
                  step.completed && styles.stepItemCompleted,
                ]}
=======
        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todas as etapas</Text>
            {steps.map((step, index) => (
              <View
                key={step.id}
                style={[styles.stepItemList, step.completed && styles.stepItemCompleted]}
>>>>>>> main
              >
                <View
                  style={[
                    styles.stepItemIcon,
                    step.completed && styles.stepItemIconDone,
                  ]}
                >
                  <Text style={styles.stepItemIconText}>
                    {step.completed ? "✓" : index + 1}
                  </Text>
                </View>
                <View style={styles.stepItemContent}>
                  <Text
                    style={[
                      styles.stepItemTitle,
                      step.completed && styles.stepItemTitleCompleted,
                    ]}
                  >
                    {step.title || step.titulo}
                  </Text>
                  <Text style={styles.stepItemDesc}>
                    {step.description || step.subetapas?.join(" • ")}
                  </Text>
<<<<<<< HEAD
=======
                  {!!step.description && (
                    <Text style={styles.stepItemDesc}>{step.description}</Text>
                  )}
>>>>>>> main
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.actionButton}>
        <TouchableOpacity
          style={styles.markCompleteButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.markCompleteText}>Voltar ao projeto</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function MetricCard({ label, value, tone }) {
  const color =
    tone === "success"
      ? COLORS.success
      : tone === "warning"
        ? COLORS.warning
        : COLORS.primary;

  return (
    <View style={styles.metricCard}>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
  backButton: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  content: {
    padding: UI.spacing.lg,
    paddingBottom: 100,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: UI.spacing.lg,
    marginBottom: UI.spacing.lg,
    ...UI.shadow,
  },
  heroLabel: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: UI.spacing.lg,
  },
  progressBar: {
    height: 10,
    borderRadius: UI.radius.sm,
    backgroundColor: COLORS.border,
    overflow: "hidden",
    marginBottom: UI.spacing.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  heroMeta: { color: COLORS.textSecondary, fontSize: 12, textAlign: "right" },
  statsGrid: {
    flexDirection: "row",
    gap: UI.spacing.sm,
    marginBottom: UI.spacing.xl,
  },
  metricCard: {
    flex: 1,
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: UI.spacing.md,
  },
  metricValue: { fontSize: 22, fontWeight: "800", marginBottom: 2 },
  metricLabel: { color: COLORS.textSecondary, fontSize: 12 },
  section: {
    marginBottom: UI.spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: UI.spacing.md,
  },
  nextStepCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    padding: UI.spacing.lg,
    borderWidth: 1,
    borderColor: `${COLORS.primary}55`,
  },
  nextStepTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },
  nextStepDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  completedCard: {
    backgroundColor: `${COLORS.success}14`,
    borderWidth: 1,
    borderColor: `${COLORS.success}66`,
    borderRadius: UI.radius.lg,
    padding: UI.spacing.lg,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.success,
    textAlign: "center",
  },
  stepItemList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    padding: UI.spacing.md,
    marginBottom: UI.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: UI.spacing.md,
  },
  stepItemCompleted: {
    opacity: 0.72,
  },
  stepItemIcon: {
    width: 28,
    height: 28,
    borderRadius: UI.radius.sm,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepItemIconDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepItemIconText: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORS.text,
  },
  stepItemContent: {
    flex: 1,
  },
  stepItemTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 2,
  },
  stepItemTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textMuted,
  },
  stepItemDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  actionButton: {
    paddingHorizontal: UI.spacing.lg,
    paddingVertical: UI.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  markCompleteButton: {
    paddingVertical: 13,
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.md,
    alignItems: "center",
  },
  markCompleteText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.background,
  },
});
