import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlignLeft,
  Bug,
  ClipboardCheck,
  Flag,
  FolderKanban,
  ListChecks,
  Save,
  Sparkles,
  Target,
  UserCheck,
  UserSearch,
  X,
} from "lucide-react";

import useHttp from "@/hooks/use-http";
import { ApiRequestError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
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

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormData>({
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
  const selectedSeverity = watch("severity");
  const selectedStatus = watch("status");
  const selectedCycleId = watch("testCycle_ID");
  const selectedAssigneeId = watch("assignedTo_ID");
  const selectedReporterId = watch("detectedBy_ID");
  const selectedProjectName =
    projects.find((project) => project.ID === selectedProjectId)?.name ||
    "Current project";
  const selectedSprintName =
    sprints.find((sprint) => sprint.ID === selectedSprintId)?.name ||
    "No sprint";
  const selectedCycleName =
    testCycles.find((cycle) => cycle.ID === selectedCycleId)?.name ||
    "No test cycle";
  const selectedAssigneeName =
    users.find((user) => user.ID === selectedAssigneeId)?.username ||
    "Unassigned";
  const selectedReporterName =
    users.find((user) => user.ID === selectedReporterId)?.username ||
    "Not specified";

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
                Defect Details
              </h3>
              {/* <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Capture the problem, impact level, and current workflow state.
              </p> */}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Bug className="size-4 text-emerald-600 dark:text-emerald-400" />
                Title
              </Label>
              <Input
                {...register("title")}
                placeholder="Enter defect title"
                className="h-11 border-slate-200 bg-slate-50/70 shadow-none transition focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <FolderKanban className="size-4 text-sky-600 dark:text-sky-400" />
                Project
              </Label>
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
                    <SelectTrigger className="h-11 w-full cursor-not-allowed border-slate-200 bg-slate-100/80 text-slate-500 shadow-none dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <ListChecks className="size-4 text-emerald-600 dark:text-emerald-400" />
                Sprint
              </Label>
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
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Target className="size-4 text-sky-600 dark:text-sky-400" />
                Test Cycle
              </Label>
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
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <Flag className="size-4 text-amber-600 dark:text-amber-400" />
                Severity
              </Label>
              <Controller
                control={control}
                name="severity"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <ClipboardCheck className="size-4 text-teal-600 dark:text-teal-400" />
                Status
              </Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <UserCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
                Assign To
              </Label>
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
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
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
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <UserSearch className="size-4 text-sky-600 dark:text-sky-400" />
                Detected By
              </Label>
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
                    <SelectTrigger className="h-11 w-full border-slate-200 bg-slate-50/70 shadow-none focus:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60">
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
        </div>

        <aside className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-950/70 dark:bg-sky-950/20">
          <p className="text-xs font-semibold uppercase text-sky-700 dark:text-sky-300">
            Defect Summary
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedSeverity || "Severity not set"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Severity helps triage release and testing risk.
              </p>
            </div>
            <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedStatus || "Status not set"}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Keep workflow state visible for the team.
              </p>
            </div>
            <div className="border-t border-sky-200/70 pt-3 dark:border-sky-900/70">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedAssigneeName}
              </p>
              <p className="mt-1 text-slate-600 dark:text-slate-400">
                Assigned owner for follow-up and resolution.
              </p>
            </div>
          </div>
        </aside>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300">
            <AlignLeft className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
              Description
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Add steps, impact, expected behavior, actual behavior, and mention teammates.
            </p>
          </div>
        </div>

        <Controller
          control={control}
          name="description"
          render={({ field }) => (
            <RichTextEditor
              value={field.value}
              onChange={field.onChange}
              placeholder="Write the defect details, impact, and context..."
              className="border-slate-200 bg-slate-50/70 shadow-none focus-within:border-emerald-500 focus-within:ring-emerald-500/20 dark:border-slate-800 dark:bg-slate-900/60"
              minHeightClassName="min-h-[220px]"
              mentionItems={mentionItems}
            />
          )}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 sm:p-5">
          <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            Placement
          </p>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedProjectName}
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Project</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedSprintName}
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Sprint</p>
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedCycleName}
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">Test cycle</p>
            </div>
          </div>
        </div>

        <aside className="rounded-lg border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-950/70 dark:bg-sky-950/20">
          <p className="text-xs font-semibold uppercase text-sky-700 dark:text-sky-300">
            Reporter
          </p>
          <p className="mt-4 text-sm font-medium text-slate-900 dark:text-slate-100">
            {selectedReporterName}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Person who detected or reported the defect.
          </p>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 dark:border-slate-800 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="h-10 sm:min-w-28"
          onClick={() => navigate("/admin/defects")}
        >
          <X className="size-4" />
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-10 bg-emerald-600 text-white shadow-sm shadow-emerald-900/10 hover:bg-emerald-700 sm:min-w-40 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
        >
          <Save className="size-4" />
          {isSubmitting
            ? update
              ? "Updating..."
              : "Creating..."
            : update
              ? "Update Defect"
              : "Create Defect"}
        </Button>
      </div>
    </form>
  );
}
