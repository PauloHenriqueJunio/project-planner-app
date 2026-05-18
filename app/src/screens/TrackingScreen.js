import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { COLORS } from "../constants/colors";

export default function TrackingScreen({ route, navigation }) {
  const project = route.params?.project || {
    name: "Projeto Sem Nome",
    titulo: "Projeto Sem Nome",
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
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Acompanhamento</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Próximo Passo em Destaque */}
        <View style={styles.nextStepContainer}>
          <Text style={styles.nextStepLabel}>Próximo Passo</Text>

          {nextPendingStep ? (
            <View style={styles.nextStepCard}>
              <View style={styles.nextStepIcon}>
                <Text style={styles.nextStepIconText}>📍</Text>
              </View>
              <View style={styles.nextStepContent}>
                <Text style={styles.nextStepTitle}>
                  {nextPendingStep.title || nextPendingStep.titulo}
                </Text>
                <Text style={styles.nextStepDescription}>
                  {nextPendingStep.description ||
                    nextPendingStep.subetapas?.join(" • ")}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.completedCard}>
              <Text style={styles.completedIcon}>🎉</Text>
              <Text style={styles.completedText}>
                Parabéns! Todos os passos foram concluídos!
              </Text>
            </View>
          )}
        </View>

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
              <View
                key={step.id}
                style={[
                  styles.stepItemList,
                  step.completed && styles.stepItemCompleted,
                ]}
              >
                <View style={styles.stepItemIcon}>
                  {step.completed ? (
                    <Text style={styles.stepItemIconText}>✓</Text>
                  ) : (
                    <Text style={styles.stepItemIconText}>•</Text>
                  )}
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
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {nextPendingStep && (
        <View style={styles.actionButton}>
          <TouchableOpacity
            style={styles.markCompleteButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.markCompleteText}>Voltar</Text>
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
  content: {
    paddingVertical: 16,
    paddingBottom: 100,
  },
  nextStepContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  nextStepLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  nextStepCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  nextStepIcon: {
    fontSize: 32,
    marginTop: 4,
  },
  nextStepIconText: {
    fontSize: 28,
  },
  nextStepContent: {
    flex: 1,
  },
  nextStepTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  nextStepDescription: {
    fontSize: 13,
    color: COLORS.text,
    opacity: 0.9,
  },
  completedCard: {
    backgroundColor: COLORS.cardBg,
    borderWidth: 2,
    borderColor: COLORS.success,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  completedIcon: {
    fontSize: 40,
  },
  completedText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.success,
    textAlign: "center",
  },
  projectInfoSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  progressSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  progressCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  progressPercent: {
    fontSize: 40,
    fontWeight: "bold",
    color: COLORS.text,
  },
  progressBarVertical: {
    height: 150,
    backgroundColor: COLORS.border,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 20,
    justifyContent: "flex-end",
  },
  progressBarVerticalFill: {
    backgroundColor: COLORS.primary,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  statDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
  },
  stepsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  stepItemList: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepItemCompleted: {
    opacity: 0.6,
  },
  stepItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepItemIconText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
  },
  stepItemContent: {
    flex: 1,
  },
  stepItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 2,
  },
  stepItemTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  stepItemDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  markCompleteButton: {
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  markCompleteText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
});
