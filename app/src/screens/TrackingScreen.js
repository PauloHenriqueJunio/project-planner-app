import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";

export default function TrackingScreen({ route, navigation }) {
  const project = route.params?.project || {
    name: "Projeto Sem Nome",
    id: "1",
  };
  const steps = route.params?.steps || [];

  const nextPendingStep = steps.find((step) => !step.completed);
  const completedCount = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;

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
              <Text style={styles.nextStepTitle}>{nextPendingStep.title}</Text>
              {!!nextPendingStep.description && (
                <Text style={styles.nextStepDescription}>
                  {nextPendingStep.description}
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

        {steps.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Todas as etapas</Text>
            {steps.map((step, index) => (
              <View
                key={step.id}
                style={[styles.stepItemList, step.completed && styles.stepItemCompleted]}
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
                    {step.title}
                  </Text>
                  {!!step.description && (
                    <Text style={styles.stepItemDesc}>{step.description}</Text>
                  )}
                </View>
              </View>
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
