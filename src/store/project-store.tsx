import React, { createContext, useEffect, useState } from "react";

type ProjectContextType = {
    currentProject: string;
    setCurrentProject: (project: string) => void;
};

export const ProjectContext = createContext<ProjectContextType>({
    currentProject: "",
    setCurrentProject: () => { },
});

export const ProjectProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentProject, setCurrentProject] = useState("");

    useEffect(() => {
        let currProject = localStorage.getItem("projectId");
        if (currProject) {
            setCurrentProject(currProject);
        }
    }, []);

    return (
        <ProjectContext.Provider value={{ currentProject, setCurrentProject }}>
            {children}
        </ProjectContext.Provider>
    );
};