import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { COLORS } from "../constants/colors";
import { getProjects } from "../storage/projectStorage";

function normalizeProject(project) {
  return {
    ...project,
    name: project.name || project.titulo || "Projeto sem nome",
    progress:
      typeof project.progress === "number"
        ? project.progress
        : typeof project.progresso === "number"
          ? project.progresso
          : 0,
    description: project.description || project.descricao || "Sem descrição",
  };
}

const ProgressBar = ({ progress }) => {
  return (
    <View style={styles.progressContainer}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
  );
};

const ProjectCard = ({ project, onPress }) => {
  return (
    <View style={styles.projectCard}>
      <View style={styles.projectHeader}>
        <Text style={styles.projectName}>{project.name}</Text>
        <Text style={styles.progressText}>{project.progress}%</Text>
      </View>

      <Text style={styles.projectDescription}>{project.description}</Text>

      <ProgressBar progress={project.progress} />

      <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
        <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function DashboardScreen({ navigation }) {
  const [projects, setProjects] = useState([]);

  const loadProjects = async () => {
    const storedProjects = await getProjects();
    setProjects(storedProjects.map(normalizeProject).reverse());
  };

  useEffect(() => {
    loadProjects();

    const unsubscribe = navigation.addListener("focus", loadProjects);

    return unsubscribe;
  }, [navigation]);

  const handleViewDetails = (project) => {
    navigation.navigate("ProjectDetail", { projectId: project.id, project });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Projetos</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("CreateProject")}
        >
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectCard project={item} onPress={() => handleViewDetails(item)} />
        )}
        contentContainerStyle={
          projects.length === 0 ? styles.emptyContent : styles.listContent
        }
        scrollEnabled={true}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nenhum projeto ainda</Text>
            <Text style={styles.emptyStateText}>
              Crie seu primeiro projeto para começar a gerar etapas e acompanhar
              o progresso.
            </Text>
          </View>
        }
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "center",
  },
  emptyState: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
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
});
