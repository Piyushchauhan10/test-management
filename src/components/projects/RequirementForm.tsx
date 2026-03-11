import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useHttp from "@/hooks/use-http";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Requirement = {
  ID: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  project_ID: string;
  sprint_ID?: string | null;
};

type Project = {
  ID: string;
  name: string;
};

type Sprint = {
  ID: string;
  name: string;
};

type Props = {
  update: boolean;
  data?: Requirement | null;
};

type FormData = {
  title: string;
  description: string;
  priority: string;
  status: string;
  project_ID: string;
  sprint_ID: string;
};

export default function RequirementForm({ update, data }: Props) {
  const navigate = useNavigate();
  const http = useHttp();

  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);

  const { register, handleSubmit, setValue, watch } = useForm<FormData>();

  const selectedProject = watch("project_ID");

  const fetchProjects = async () => {
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects`,
      );

      const projectData = res?.data?.value || res?.data || [];

      setProjects(projectData);
    } catch (error) {
      console.error("Project fetch failed", error);
      toast.error("Failed to load projects");
    }
  };

  const fetchSprints = async (projectId: string) => {
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Sprints?$filter=project_ID eq '${projectId}'`,
      );

      const sprintData = res?.data?.value || res?.data || [];

      setSprints(sprintData);
    } catch (error) {
      console.error("Sprint fetch failed", error);
      toast.error("Failed to load sprints");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (update && data) {
      setValue("title", data.title);
      setValue("description", data.description);
      setValue("priority", data.priority);
      setValue("status", data.status);
      setValue("project_ID", data.project_ID);
      setValue("sprint_ID", data.sprint_ID || "");

      if (data.project_ID) {
        fetchSprints(data.project_ID);
      }
    }
  }, [update, data]);

  useEffect(() => {
    if (selectedProject) {
      fetchSprints(selectedProject);
      setValue("sprint_ID", "");
    }
  }, [selectedProject]);

  const onSubmit = async (values: FormData) => {
    try {
      const isEdit = Boolean(update && data?.ID);

      const url =
        import.meta.env.VITE_BACKEND_API_URL +
        (isEdit ? `/Requirements('${data?.ID}')` : `/Requirements`);

      await http.sendRequest(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      toast.success(`Requirement ${isEdit ? "updated" : "created"}`);

      navigate("/admin/requirements");
    } catch (error) {
      toast.error("Something went wrong");
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register("title")} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input {...register("description")} />
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>

              <Select
                value={watch("priority")}
                onValueChange={(v) => setValue("priority", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>

              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>

              <Select
                value={watch("project_ID")}
                onValueChange={(v) => setValue("project_ID", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>

                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.ID} value={project.ID}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sprint</Label>

              <Select
                value={watch("sprint_ID")}
                onValueChange={(v) => setValue("sprint_ID", v)}
                disabled={!selectedProject}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Sprint" />
                </SelectTrigger>

                <SelectContent>
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.ID} value={sprint.ID}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full">
            {update ? "Update Requirement" : "Add Requirement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
