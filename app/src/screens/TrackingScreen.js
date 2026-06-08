import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";

function normalizeSteps(input) {
  return (Array.isArray(input) ? input : []).map((step, index) => ({
    id: step.id || String(index + 1),
    title: step.title || step.titulo || `Etapa ${index + 1}`,
    description:
      step.description ||
      (Array.isArray(step.subetapas) ? step.subetapas.join(" - ") : ""),
    completed: Boolean(step.completed),
  }));
}

export default function TrackingScreen({ route, navigation }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 700;
  const routeProject = route.params?.project;
  const routeSteps = route.params?.steps || [];

  const [project] = useState(
    routeProject || { name: "Projeto Sem Nome", id: "1", steps: [] },
  );
  const [steps] = useState(() =>
    normalizeSteps(
      routeSteps.length > 0
        ? routeSteps
        : project.steps || project.etapas || [],
    ),
  );

  const nextPendingStep = useMemo(
    () => steps.find((step) => !step.completed),
    [steps],
  );

  const completedCount = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length;
  const progressPercent = totalSteps
    ? Math.round((completedCount / totalSteps) * 100)
    : 0;

  const goHome = () => {
    navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        {!isMobile && (
          <TouchableOpacity style={styles.headerTextButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>Voltar</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>Acompanhamento</Text>
        {!isMobile && (
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerGhostButton} onPress={goHome}>
              <Text style={styles.headerGhostButtonText}>HOME</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerPrimaryButton} onPress={() => navigation.goBack()}>
              <Text style={styles.headerPrimaryButtonText}>Projeto</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, isMobile && styles.contentMobile]}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Projeto</Text>
          <Text style={styles.heroTitle}>{project.name || project.titulo}</Text>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progressPercent}%` }]}
            />
          </View>
          <Text style={styles.heroMeta}>{progressPercent}% concluido</Text>
        </View>

        <View style={styles.statsGrid}>
          <MetricCard label="Etapas" value={totalSteps} />
          <MetricCard
            label="Concluidas"
            value={completedCount}
            tone="success"
          />
          <MetricCard
            label="Pendentes"
            value={Math.max(totalSteps - completedCount, 0)}
            tone="warning"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Proximo passo</Text>
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
                Parabens! Todos os passos foram concluidos.
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
                style={[
                  styles.stepItemList,
                  step.completed && styles.stepItemCompleted,
                ]}
              >
                <View
                  style={[
                    styles.stepItemIcon,
                    step.completed && styles.stepItemIconDone,
                  ]}
                >
                  <Text style={styles.stepItemIconText}>
                    {step.completed ? "OK" : index + 1}
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

      {isMobile && (
        <View style={styles.mobileActionBar}>
          <TouchableOpacity
            style={styles.mobilePrimaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.mobilePrimaryButtonText}>Projeto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mobileSecondaryButton} onPress={goHome}>
            <Text style={styles.mobileSecondaryButtonText}>HOME</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerMobile: {
    justifyContent: "center",
  },
  headerTextButton: {
    width: 92,
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
  headerActions: {
    width: 190,
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
  content: {
    padding: UI.spacing.lg,
    paddingBottom: 100,
  },
  contentMobile: {
    paddingBottom: 112,
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
    fontSize: 10,
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
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  mobilePrimaryButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: COLORS.background,
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
    fontSize: 12,
    fontWeight: "900",
    color: COLORS.text,
  },
});
