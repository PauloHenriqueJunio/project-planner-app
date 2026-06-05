import React, { useContext } from "react";
import {
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS, UI } from "../constants/colors";
import { ProjectContext } from "../context/ProjectContext";

const mockProjects = [
  {
    id: "1",
    name: "App de Planejamento",
    progress: 65,
    description: "Desenvolvendo aplicativo móvel",
  },
  {
    id: "2",
    name: "Curso React Native",
    progress: 40,
    description: "Aprendizado de desenvolvimento mobile",
  },
];

const ProgressBar = ({ progress }) => (
  <View style={styles.progressContainer}>
    <View style={[styles.progressBar, { width: `${progress}%` }]} />
  </View>
);

function getProgress(project) {
  if (typeof project.progress === "number") return project.progress;
  if (Array.isArray(project.steps) && project.steps.length > 0) {
    const done = project.steps.filter((s) => s.completed).length;
    return Math.round((done / project.steps.length) * 100);
  }
  return 0;
}

const ProjectCard = ({ project, onPress, onEdit, onDelete }) => {
  const computedProgress = getProgress(project);

  return (
    <View style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <View style={styles.projectTitleBlock}>
          <Text style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
          <Text style={styles.projectDescription} numberOfLines={2}>
            {project.description || "Sem descrição"}
          </Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>{computedProgress}%</Text>
        </View>
      </View>

      <ProgressBar progress={computedProgress} />

      <View style={styles.cardActionsRow}>
        <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
          <Text style={styles.detailsButtonText}>Ver detalhes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
          <Text style={styles.iconButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconButton, styles.deleteIconButton]}
          onPress={onDelete}
        >
          <Text style={[styles.iconButtonText, styles.deleteIconButtonText]}>
            Excluir
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function DashboardScreen({ navigation }) {
  const { projects, deleteProject } = useContext(ProjectContext);
  const visibleProjects = projects && projects.length ? projects : mockProjects;
  const totalProjects = visibleProjects.length;
  const averageProgress = Math.round(
    visibleProjects.reduce((sum, project) => sum + getProgress(project), 0) /
      Math.max(totalProjects, 1),
  );

  const handleViewDetails = (project) => {
    navigation.navigate("ProjectDetail", {
      projectId: project.id,
      project,
      steps: project.steps || [],
    });
  };

  const handleEditProject = (project) => {
    navigation.navigate("CreateProject", { project });
  };

  const handleDeleteProject = (project) => {
    const doDelete = () => deleteProject(project.id);
    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
      if (globalThis.confirm(`Excluir o projeto "${project.name}"?`)) doDelete();
      return;
    }

    Alert.alert("Excluir projeto", `Deseja realmente excluir "${project.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: doDelete },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Project Planner</Text>
          <Text style={styles.headerTitle}>Meus projetos</Text>
        </View>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateProject")}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryBand}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalProjects}</Text>
          <Text style={styles.summaryLabel}>Projetos</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{averageProgress}%</Text>
          <Text style={styles.summaryLabel}>Média concluída</Text>
        </View>
      </View>

      <FlatList
        data={visibleProjects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => handleViewDetails(item)}
            onEdit={() => handleEditProject(item)}
            onDelete={() => handleDeleteProject(item)}
          />
        )}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>Projetos recentes</Text>
        }
        contentContainerStyle={styles.listContent}
        scrollEnabled
      />
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
    paddingHorizontal: UI.spacing.xl,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerEyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: UI.radius.lg,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 28,
    color: COLORS.background,
    fontWeight: "800",
  },
  summaryBand: {
    margin: UI.spacing.lg,
    padding: UI.spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    ...UI.shadow,
  },
  summaryItem: { flex: 1 },
  summaryValue: { color: COLORS.text, fontSize: 24, fontWeight: "800" },
  summaryLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: COLORS.border,
    marginHorizontal: UI.spacing.lg,
  },
  listContent: {
    paddingHorizontal: UI.spacing.lg,
    paddingBottom: 32,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: UI.spacing.md,
  },
  projectCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: UI.radius.lg,
    padding: UI.spacing.lg,
    marginBottom: UI.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...UI.shadow,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: UI.spacing.md,
    marginBottom: 14,
  },
  projectTitleBlock: { flex: 1 },
  projectName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
  },
  projectDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: UI.radius.sm,
    backgroundColor: `${COLORS.primary}1F`,
    borderWidth: 1,
    borderColor: `${COLORS.primary}55`,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.primary,
  },
  progressContainer: {
    height: 7,
    backgroundColor: COLORS.border,
    borderRadius: UI.radius.sm,
    overflow: "hidden",
    marginBottom: 14,
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.sm,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: UI.spacing.sm,
  },
  detailsButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: UI.spacing.lg,
    backgroundColor: COLORS.primary,
    borderRadius: UI.radius.md,
    alignItems: "center",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.background,
  },
  iconButton: {
    paddingHorizontal: UI.spacing.md,
    borderRadius: UI.radius.md,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteIconButton: {
    backgroundColor: `${COLORS.error}14`,
    borderColor: `${COLORS.error}55`,
  },
  iconButtonText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  deleteIconButtonText: {
    color: COLORS.error,
  },
});
