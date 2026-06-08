import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
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

  const loadProjects = useCallback(async () => {
    if (!AsyncStorage) return;
    try {
      const raw = await AsyncStorage.getItem("projects_v1");
      if (raw) setProjects(JSON.parse(raw));
    } catch (e) {
      console.warn("failed to load projects", e);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const persist = useCallback(async (next) => {
    if (!AsyncStorage) return;
    try {
      await AsyncStorage.setItem("projects_v1", JSON.stringify(next));
    } catch (e) {
      console.warn("failed to persist projects", e);
    }
  }, []);

  const addProject = useCallback((project) => {
    setProjects((prev) => {
      const next = [project, ...prev];
      persist(next);
      return next;
    });
  }, [persist]);

  const updateProject = useCallback((projectId, patchOrUpdater) => {
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
  }, [persist]);

  const deleteProject = useCallback((projectId) => {
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== projectId);
      persist(next);
      return next;
    });
  }, [persist]);

  const contextValue = useMemo(
    () => ({ projects, addProject, updateProject, deleteProject, loadProjects }),
    [projects, addProject, updateProject, deleteProject, loadProjects],
  );

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}
