import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import useHttp from "@/hooks/use-http";
import { ApiRequestError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE_VALUE = "__none__";

type Project = {
  ID: string;
  name: string;
};

type Sprint = {
  ID: string;
  name: string;
  project_ID: string;
};

type TestCycle = {
  ID: string;
  name: string;
  project_ID: string;
  sprint_ID: string;
};

type User = {
  ID: string;
  username: string;
  email?: string;
};

type Defect = {
  ID: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  assignedTo_ID?: string | null;
  detectedBy_ID?: string | null;
  detectedCycle_ID?: string | null;
  targetCycle_ID?: string | null;
  targetCycle?: {
    ID: string;
    project_ID: string;
    sprint_ID: string;
  } | null;
  detectedCycle?: {
    ID: string;
    project_ID: string;
    sprint_ID: string;
  } | null;
};

type Props = {
  update: boolean;
  data?: Defect | null;
};

type FormData = {
  title: string;
  description: string;
  severity: string;
  status: string;
  project_ID: string;
  sprint_ID: string;
  testCycle_ID: string;
  assignedTo_ID: string;
  detectedBy_ID: string;
};

export default function DefectForm({ update, data }: Props) {
  const navigate = useNavigate();
  const { sendRequest } = useHttp();

  const activeProjectId = localStorage.getItem("projectId") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [testCycles, setTestCycles] = useState<TestCycle[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const { control, register, handleSubmit, reset, setValue, watch } =
    useForm<FormData>({
      defaultValues: {
        title: data?.title ?? "",
        description: data?.description ?? "",
        severity: data?.severity ?? "",
        status: data?.status ?? "",
        project_ID: activeProjectId,
        sprint_ID: data?.targetCycle?.sprint_ID ?? "",
        testCycle_ID: data?.targetCycle_ID ?? data?.detectedCycle_ID ?? "",
        assignedTo_ID: data?.assignedTo_ID ?? "",
        detectedBy_ID: data?.detectedBy_ID ?? "",
      },
    });

  const selectedProjectId = watch("project_ID");
  const selectedSprintId = watch("sprint_ID");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Projects`,
      );
      setProjects(res?.data?.value || res?.data || []);
    } catch {
      toast.error("Failed to load projects");
    }
  }, [sendRequest]);

  const fetchSprints = useCallback(
    async (projectId: string) => {
      if (!projectId) {
        setSprints([]);
        return;
      }

      try {
        const res = await sendRequest(
          `${import.meta.env.VITE_BACKEND_API_URL}/Sprints?$filter=project_ID eq '${projectId}'`,
        );
        setSprints(res?.data?.value || res?.data || []);
      } catch {
        toast.error("Failed to load sprints");
      }
    },
    [sendRequest],
  );

  const fetchTestCycles = useCallback(
    async (projectId: string, sprintId: string) => {
      if (!projectId || !sprintId) {
        setTestCycles([]);
        return;
      }

      try {
        const res = await sendRequest(
          `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles?$filter=project_ID eq '${projectId}' and sprint_ID eq '${sprintId}'`,
        );
        setTestCycles(res?.data?.value || res?.data || []);
      } catch {
        toast.error("Failed to load test cycles");
      }
    },
    [sendRequest],
  );

  const fetchUsers = useCallback(async () => {
    try {
      const res = await sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users`,
      );
      setUsers(res?.data?.value || res?.data || []);
    } catch {
      toast.error("Failed to load users");
    }
  }, [sendRequest]);

  const fetchCycleById = useCallback(
    async (cycleId: string) => {
      try {
        const res = await sendRequest(
          `${import.meta.env.VITE_BACKEND_API_URL}/TestCycles('${cycleId}')`,
        );
        return (res?.data || null) as TestCycle | null;
      } catch {
        toast.error("Failed to load selected test cycle");
        return null;
      }
    },
    [sendRequest],
  );

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, [fetchProjects, fetchUsers]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchSprints(selectedProjectId);
      return;
    }

    setSprints([]);
    setTestCycles([]);
  }, [fetchSprints, selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId && selectedSprintId) {
      fetchTestCycles(selectedProjectId, selectedSprintId);
      return;
    }

    setTestCycles([]);
  }, [fetchTestCycles, selectedProjectId, selectedSprintId]);

  useEffect(() => {
    let isMounted = true;

    const syncForm = async () => {
      const cycleId = data?.targetCycle_ID || data?.detectedCycle_ID || "";
      const expandedCycle = data?.targetCycle || data?.detectedCycle || null;
      const resolvedCycle =
        expandedCycle || (cycleId ? await fetchCycleById(cycleId) : null);

      const projectId =
        resolvedCycle?.project_ID ||
        activeProjectId ||
        data?.targetCycle?.project_ID ||
        "";
      const sprintId =
        resolvedCycle?.sprint_ID || data?.targetCycle?.sprint_ID || "";

      if (!isMounted) return;

      reset({
        title: data?.title ?? "",
        description: data?.description ?? "",
        severity: data?.severity ?? "",
        status: data?.status ?? "",
        project_ID: projectId,
        sprint_ID: sprintId,
        testCycle_ID: cycleId,
        assignedTo_ID: data?.assignedTo_ID ?? "",
        detectedBy_ID: data?.detectedBy_ID ?? "",
      });

      if (projectId) {
        fetchSprints(projectId);
      }

      if (projectId && sprintId) {
        fetchTestCycles(projectId, sprintId);
      }
    };

    syncForm();

    return () => {
      isMounted = false;
    };
  }, [
    activeProjectId,
    data,
    fetchCycleById,
    fetchSprints,
    fetchTestCycles,
    reset,
  ]);

  const mentionItems = useMemo(
    () =>
      users.map((user) => ({
        id: user.ID,
        label: user.username,
        sublabel: user.email,
      })),
    [users],
  );

  const onSubmit = async (values: FormData) => {
    try {
      const isEdit = Boolean(update && data?.ID);

      const payload = {
        title: values.title,
        description: values.description,
        severity: values.severity,
        status: values.status,
        assignedTo_ID: values.assignedTo_ID || null,
        detectedBy_ID: values.detectedBy_ID || null,
        detectedCycle_ID: values.testCycle_ID || null,
        targetCycle_ID: values.testCycle_ID || null,
      };

      const url =
        import.meta.env.VITE_BACKEND_API_URL +
        (isEdit ? `/Defects('${data?.ID}')` : "/Defects");

      await sendRequest(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast.success(`Defect ${isEdit ? "updated" : "created"}`);
      navigate("/admin/defects");
    } catch (err) {
      console.error(err);
      if (err instanceof ApiRequestError) {
        toast.error(err.messages[0], {
          description:
            err.messages.length > 1 ? err.messages.slice(1).join("\n") : undefined,
        });
        return;
      }

      toast.error("Something went wrong");
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input {...register("title")} placeholder="Enter defect title" />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Controller
                control={control}
                name="project_ID"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    disabled
                    onValueChange={(value) => {
                      field.onChange(value);
                      setValue("sprint_ID", "");
                      setValue("testCycle_ID", "");
                    }}
                  >
                    <SelectTrigger className="h-11 w-full bg-gray-100 cursor-not-allowed">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>

                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.ID} value={project.ID}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Sprint</Label>
              <Controller
                control={control}
                name="sprint_ID"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) => {
                      field.onChange(value === NONE_VALUE ? "" : value);
                      setValue("testCycle_ID", "");
                    }}
                    disabled={!selectedProjectId}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select sprint" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No sprint</SelectItem>
                      {sprints.map((sprint) => (
                        <SelectItem key={sprint.ID} value={sprint.ID}>
                          {sprint.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Test Cycle</Label>
              <Controller
                control={control}
                name="testCycle_ID"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? "" : value)
                    }
                    disabled={!selectedProjectId || !selectedSprintId}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select test cycle" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>No test cycle</SelectItem>
                      {testCycles.map((cycle) => (
                        <SelectItem key={cycle.ID} value={cycle.ID}>
                          {cycle.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Controller
                control={control}
                name="severity"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Critical">Critical</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Major">Major</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Minor">Minor</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Resolved">Resolved</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 ">
              <Label>Assign To</Label>
              <Controller
                control={control}
                name="assignedTo_ID"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Assign defect to a user" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Unassigned</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.ID} value={user.ID}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2">
              <Label>Detected By</Label>
              <Controller
                control={control}
                name="detectedBy_ID"
                render={({ field }) => (
                  <Select
                    value={field.value || NONE_VALUE}
                    onValueChange={(value) =>
                      field.onChange(value === NONE_VALUE ? "" : value)
                    }
                  >
                    <SelectTrigger className="h-11 w-full">
                      <SelectValue placeholder="Select user who detected the defect" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>Not specified</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.ID} value={user.ID}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Write the defect details, impact, and context..."
                  mentionItems={mentionItems}
                />
              )}
            />
          </div>

          <Button type="submit" className="w-full">
            {update ? "Update Defect" : "Create Defect"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
