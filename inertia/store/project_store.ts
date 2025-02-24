import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface ProjectState {
    step: number
    subStep?: number
    project?: object
}

interface ProjectStore {
    projectState: ProjectState
    setStep: (step: number) => void
    setSubStep: (subStep?: number) => void
    setProject: (project: object) => void
    resetState: () => void
}

const initialState: ProjectState = {
    step: 0,
    project: undefined,
    subStep: undefined,
}

export const useProjectStore = create<ProjectStore>()(
    devtools((set) => ({
        projectState: initialState,
        setProject: (project) =>
            set((state) => ({ projectState: { ...state.projectState, project } })),
        setStep: (step) => set((state) => ({ projectState: { ...state.projectState, step } })),
        setSubStep: (subStep) =>
            set((state) => ({ projectState: { ...state.projectState, subStep } })),
        resetState: () => set({ projectState: initialState }),
    }))
)
