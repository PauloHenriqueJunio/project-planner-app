import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { COLORS } from "../constants/colors";
import { useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";
import { Platform } from "react-native";

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

const ProgressBar = ({ progress }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
  );
};

const ProjectCard = ({ project, onPress, onEdit, onDelete }) => {
  const computedProgress = (() => {
    if (typeof project.progress === "number") return project.progress;
    if (Array.isArray(project.steps) && project.steps.length > 0) {
      const done = project.steps.filter((s) => s.completed).length;
      return Math.round((done / project.steps.length) * 100);
    }
    return 0;
  })();

  return (
    <View style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.progressText}>{computedProgress}%</Text>
      </View>

      <Text style={styles.projectDescription}>{project.description}</Text>

      <ProgressBar progress={computedProgress} />

      <View style={styles.cardActionsRow}>
        <TouchableOpacity style={styles.iconButton} onPress={onEdit}>
          <Text style={styles.iconButtonText}>✏️</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconButton, styles.deleteIconButton]} onPress={onDelete}>
          <Text style={styles.iconButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
        <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function DashboardScreen({ navigation }) {
  const { projects, deleteProject } = useContext(ProjectContext);
  const handleViewDetails = (project) => {
    navigation.navigate("ProjectDetail", { projectId: project.id, project, steps: project.steps || [] });
  };

  const handleEditProject = (project) => {
    navigation.navigate("CreateProject", { project });
  };

  const handleDeleteProject = (project) => {
    const doDelete = () => deleteProject(project.id);
    if (Platform.OS === "web" && typeof globalThis.confirm === "function") {
      if (globalThis.confirm(`Excluir o projeto \"${project.name}\"?`)) doDelete();
      return;
    }

    Alert.alert("Excluir projeto", `Deseja realmente excluir \"${project.name}\"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: doDelete },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Projetos</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            try {
              console.log("Dashboard: create button pressed");
            } catch (e) {}
            navigation.navigate("CreateProject");
          }}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {/* Fallback visível no web: botão de texto abaixo do header */}
      {Platform.OS === "web" && (
        <View style={styles.webFallbackContainer}>
          <TouchableOpacity
            style={styles.webFallbackButton}
            onPress={() => navigation.navigate("CreateProject")}
          >
            <Text style={styles.webFallbackText}>Criar Projeto</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Botão flutuante alternativo caso o header esteja sobreposto (nativo/web) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          try {
            console.log("FAB create pressed");
          } catch (e) {}
          navigation.navigate("CreateProject");
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <FlatList
        data={projects && projects.length ? projects : mockProjects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard
            project={item}
            onPress={() => handleViewDetails(item)}
            onEdit={() => handleEditProject(item)}
            onDelete={() => handleDeleteProject(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.text,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 28,
    color: COLORS.text,
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: COLORS.text,
    fontWeight: "bold",
  },
  webFallbackContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "flex-end",
  },
  webFallbackButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  webFallbackText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  projectCard: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  projectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  projectDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  progressContainer: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  detailsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  cardActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIconButton: {
    backgroundColor: COLORS.error,
  },
  iconButtonText: {
    fontSize: 16,
  },
});
