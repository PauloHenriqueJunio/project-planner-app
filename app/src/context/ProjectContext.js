import React, { createContext, useState, useEffect } from "react";
import { Alert } from "react-native";
let AsyncStorage;
try {
  AsyncStorage = require("@react-native-async-storage/async-storage").default;
} catch (e) {
  AsyncStorage = null;
}

export const ProjectContext = createContext({
  projects: [],
  addProject: () => {},
  updateProject: () => {},
  deleteProject: () => {},
  loadProjects: () => {},
});

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    if (!AsyncStorage) return;
    try {
      const raw = await AsyncStorage.getItem("projects_v1");
      if (raw) setProjects(JSON.parse(raw));
    } catch (e) {
      console.warn("failed to load projects", e);
    }
  };

  const persist = async (next) => {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem("projects_v1", JSON.stringify(next));
    } catch (e) {
      console.warn("failed to persist projects", e);
    }
  };

  const addProject = (project) => {
    setProjects((prev) => {
      const next = [project, ...prev];
      persist(next);
      return next;
    });
  };

  const updateProject = (projectId, patchOrUpdater) => {
    setProjects((prev) => {
      const next = prev.map((p) => {
        if (p.id !== projectId) return p;
        if (typeof patchOrUpdater === "function") {
          return patchOrUpdater(p);
        }
        return { ...p, ...patchOrUpdater };
      });
      persist(next);
      return next;
    });
  };

  const deleteProject = (projectId) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== projectId);
      persist(next);
      return next;
    });
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProject, deleteProject, loadProjects }}>
      {children}
    </ProjectContext.Provider>
  );
}
