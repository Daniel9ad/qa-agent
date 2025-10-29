import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Project } from '@/types';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectId: string | null;
}

const initialState: ProjectState = {
  projects: [],
  selectedProject: null,
  selectedProjectId: null,
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjects: (state, action: PayloadAction<Project[]>) => {
      state.projects = action.payload;
      // Si no hay proyecto seleccionado y hay proyectos, seleccionar el primero
      if (!state.selectedProjectId && action.payload.length > 0) {
        state.selectedProjectId = action.payload[0].id;
        state.selectedProject = action.payload[0];
      }
    },
    setSelectedProject: (state, action: PayloadAction<string>) => {
      state.selectedProjectId = action.payload;
      state.selectedProject = state.projects.find(p => p.id === action.payload) || null;
    },
    clearProject: (state) => {
      state.projects = [];
      state.selectedProject = null;
      state.selectedProjectId = null;
    },
  },
});

export const { 
  setProjects,
  setSelectedProject,
  clearProject
} = projectSlice.actions;

export default projectSlice.reducer;