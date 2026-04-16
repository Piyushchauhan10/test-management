"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ClipboardList, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FolderNode = {
  ID: string;
  name: string;
  parentFolder_ID: string | null;
  children?: FolderNode[];
};

type TestCase = {
  ID: string;
  title: string;
  priority: string;
  preconditions?: string;
};

type TestStep = {
  ID: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
  testCase_ID: string;
};

type TestCaseForm = {
  title: string;
  preconditions: string;
  priority: string;
};

type StepForm = {
  action: string;
  expectedResult: string;
};

const TESTCASE_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestCases`;
const TESTSTEP_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestSteps`;

const defaultCaseForm: TestCaseForm = {
  title: "",
  preconditions: "",
  priority: "Medium",
};

const defaultStepForm: StepForm = {
  action: "",
  expectedResult: "",
};

const priorityTone: Record<string, string> = {
  High: "bg-rose-50 text-rose-700",
  Medium: "bg-amber-50 text-amber-700",
  Low: "bg-emerald-50 text-emerald-700",
};

export default function TestCaseManager({
  selected,
  selectedPath = [],
}: {
  selected: FolderNode | null;
  selectedPath?: FolderNode[];
}) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [showStepForm, setShowStepForm] = useState(false);
  const [caseForm, setCaseForm] = useState<TestCaseForm>(defaultCaseForm);
  const [stepForm, setStepForm] = useState<StepForm>(defaultStepForm);
  const [editStepForm, setEditStepForm] = useState<StepForm>(defaultStepForm);

  const fetchTestCases = useCallback(async (folderId: string) => {
    setLoading(true);

    try {
      const res = await fetch(`${TESTCASE_API}?$filter=folder_ID eq '${folderId}'`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      const items = data.value || [];
      setTestCases(items);

      setSelectedTestCaseId((currentSelectedId) => {
        if (currentSelectedId && items.some((item: TestCase) => item.ID === currentSelectedId)) {
          return currentSelectedId;
        }

        return null;
      });
    } catch {
      toast.error("Failed to fetch test cases");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSteps = useCallback(async (testCaseId: string) => {
    setStepsLoading(true);

    try {
      const res = await fetch(`${TESTSTEP_API}?$filter=testCase_ID eq '${testCaseId}'`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      const sorted = (data.value || []).sort(
        (a: TestStep, b: TestStep) => a.stepNumber - b.stepNumber,
      );
      setSteps(sorted);
    } catch {
      toast.error("Failed to fetch steps");
    } finally {
      setStepsLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedTestCaseId(null);
    setSteps([]);
    setShowStepForm(false);
    setEditingStepId(null);
    setEditStepForm(defaultStepForm);
    setStepForm(defaultStepForm);

    if (selected?.ID) {
      void fetchTestCases(selected.ID);
    } else {
      setTestCases([]);
    }
  }, [fetchTestCases, selected?.ID]);

  useEffect(() => {
    if (selectedTestCaseId) {
      void fetchSteps(selectedTestCaseId);
    } else {
      setSteps([]);
    }
  }, [fetchSteps, selectedTestCaseId]);

  const filteredCases = useMemo(() => {
    let data = [...testCases];

    if (search.trim()) {
      const normalizedQuery = search.trim().toLowerCase();
      data = data.filter((testCase) =>
        [testCase.title, testCase.preconditions || ""].join(" ").toLowerCase().includes(normalizedQuery),
      );
    }

    if (priorityFilter !== "All") {
      data = data.filter((testCase) => testCase.priority === priorityFilter);
    }

    return data;
  }, [priorityFilter, search, testCases]);

  const selectedTestCase =
    filteredCases.find((testCase) => testCase.ID === selectedTestCaseId) ||
    testCases.find((testCase) => testCase.ID === selectedTestCaseId) ||
    null;

  const hasActiveCase = Boolean(selectedTestCase);

  const openCreateDialog = () => {
    setEditingTestCase(null);
    setCaseForm(defaultCaseForm);
    setShowCaseDialog(true);
  };

  const openEditDialog = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setCaseForm({
      title: testCase.title,
      preconditions: testCase.preconditions || "",
      priority: testCase.priority,
    });
    setShowCaseDialog(true);
  };

  const handleCreate = async () => {
    if (!selected?.ID) return;
    if (!caseForm.title.trim()) return toast.error("Title required");

    try {
      const res = await fetch(TESTCASE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...caseForm,
          folder_ID: selected.ID,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Test case created");
      setShowCaseDialog(false);
      setCaseForm(defaultCaseForm);
      await fetchTestCases(selected.ID);
    } catch {
      toast.error("Create failed");
    }
  };

  const handleUpdate = async () => {
    if (!selected?.ID || !editingTestCase) return;
    if (!caseForm.title.trim()) return toast.error("Title required");

    try {
      const res = await fetch(`${TESTCASE_API}('${editingTestCase.ID}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseForm),
      });

      if (!res.ok) throw new Error();

      toast.success("Test case updated");
      setShowCaseDialog(false);
      setEditingTestCase(null);
      await fetchTestCases(selected.ID);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    if (!selected?.ID || !deleteId) return;

    try {
      const res = await fetch(`${TESTCASE_API}('${deleteId}')`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Test case deleted");
      setShowDeleteDialog(false);

      if (selectedTestCaseId === deleteId) {
        setSelectedTestCaseId(null);
      }

      await fetchTestCases(selected.ID);
    } catch {
      toast.error("Delete failed");
    }
  };

  const addStep = async () => {
    if (!selectedTestCaseId) return;
    if (!stepForm.action.trim() || !stepForm.expectedResult.trim()) {
      return toast.error("Fill both step fields");
    }

    try {
      const res = await fetch(TESTSTEP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepNumber: steps.length + 1,
          ...stepForm,
          testCase_ID: selectedTestCaseId,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Step added");
      setStepForm(defaultStepForm);
      setShowStepForm(false);
      await fetchSteps(selectedTestCaseId);
    } catch {
      toast.error("Add step failed");
    }
  };

  const updateStep = async (id: string) => {
    if (!selectedTestCaseId) return;
    if (!editStepForm.action.trim() || !editStepForm.expectedResult.trim()) {
      return toast.error("Fields cannot be empty");
    }

    try {
      const res = await fetch(`${TESTSTEP_API}('${id}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStepForm),
      });

      if (!res.ok) throw new Error();

      toast.success("Step updated");
      setEditingStepId(null);
      await fetchSteps(selectedTestCaseId);
    } catch {
      toast.error("Update step failed");
    }
  };

  const deleteStep = async (id: string) => {
    if (!selectedTestCaseId) return;

    try {
      const res = await fetch(`${TESTSTEP_API}('${id}')`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Step removed");
      await fetchSteps(selectedTestCaseId);
    } catch {
      toast.error("Delete step failed");
    }
  };

  if (!selected) {
    return (
      <Card className="flex h-full min-h-[480px] items-center justify-center">
        <CardContent className="text-center">
          <ClipboardList className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-4 text-lg font-semibold">Select a folder</h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a folder to view test cases and steps.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div
        className={cn(
          "grid h-full gap-4",
          hasActiveCase ? "xl:grid-cols-[360px_minmax(0,1fr)]" : "xl:grid-cols-[minmax(0,1fr)]",
        )}
      >
        <Card className="h-[calc(100vh-15rem)]">
          <CardHeader className="space-y-3 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Test Cases</CardTitle>
                <CardDescription>{selectedPath.map((folder) => folder.name).join(" / ")}</CardDescription>
              </div>

              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="size-4" />
                New
              </Button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search test cases"
                  className="pl-9"
                />
              </div>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="h-[calc(100%-8.5rem)] overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading test cases...
              </div>
            ) : filteredCases.length ? (
              <div className="space-y-2">
                {filteredCases.map((testCase) => (
                  <button
                    key={testCase.ID}
                    type="button"
                    onClick={() => {
                      setSelectedTestCaseId((current) =>
                        current === testCase.ID ? null : testCase.ID,
                      );
                      setEditingStepId(null);
                      setShowStepForm(false);
                    }}
                    className={cn(
                      "w-full rounded-md border p-3 text-left",
                      selectedTestCase?.ID === testCase.ID
                        ? "border-slate-900 bg-slate-50"
                        : "hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{testCase.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                          {testCase.preconditions || "No preconditions"}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            "rounded px-2 py-1 text-xs font-medium",
                            priorityTone[testCase.priority] || priorityTone.Medium,
                          )}
                        >
                          {testCase.priority}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditDialog(testCase);
                          }}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-rose-600 hover:text-rose-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteId(testCase.ID);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </button>
                ))}

                {!hasActiveCase && (
                  <div className="rounded-md border border-dashed bg-slate-50 px-4 py-3 text-sm text-slate-500">
                    Click any test case to open its steps and details.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-md border border-dashed p-4 text-sm text-slate-500">
                No test cases found.
              </div>
            )}
          </CardContent>
        </Card>

        {selectedTestCase && (
          <Card className="h-[calc(100vh-15rem)]">
          <CardHeader className="space-y-3 border-b pb-4">
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-base">{selectedTestCase.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedTestCase.preconditions || "No preconditions"}
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowStepForm((value) => !value)}
                    >
                      <Plus className="size-4" />
                      Add Step
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setSelectedTestCaseId(null);
                        setShowStepForm(false);
                        setEditingStepId(null);
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 text-sm text-slate-600">
                  <span
                    className={cn(
                      "rounded px-2 py-1 font-medium",
                      priorityTone[selectedTestCase.priority] || priorityTone.Medium,
                    )}
                  >
                    {selectedTestCase.priority}
                  </span>
                  <span className="rounded border px-2 py-1">{steps.length} steps</span>
                </div>
              </>
          </CardHeader>

          <CardContent className="flex h-[calc(100%-7rem)] flex-col gap-4 overflow-hidden p-4">
            {selectedTestCase && showStepForm && (
              <div className="space-y-3 rounded-md border bg-slate-50 p-3">
                <Input
                  value={stepForm.action}
                  onChange={(event) =>
                    setStepForm((value) => ({ ...value, action: event.target.value }))
                  }
                  placeholder="Action"
                />
                <Textarea
                  value={stepForm.expectedResult}
                  onChange={(event) =>
                    setStepForm((value) => ({
                      ...value,
                      expectedResult: event.target.value,
                    }))
                  }
                  placeholder="Expected result"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStepForm(false);
                      setStepForm(defaultStepForm);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => void addStep()}>
                    <Check className="size-4" />
                    Save
                  </Button>
                </div>
              </div>
            )}

            {stepsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading steps...
              </div>
            ) : steps.length ? (
              <div className="min-h-0 space-y-3 overflow-y-auto">
                {steps.map((step) => {
                  const isEditing = editingStepId === step.ID;

                  return (
                    <div key={step.ID} className="rounded-md border p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-slate-600">
                          Step {step.stepNumber}
                        </span>

                        <div className="flex gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="outline"
                                size="icon-sm"
                                onClick={() => {
                                  setEditingStepId(null);
                                  setEditStepForm(defaultStepForm);
                                }}
                              >
                                <X className="size-4" />
                              </Button>
                              <Button size="icon-sm" onClick={() => void updateStep(step.ID)}>
                                <Check className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setEditingStepId(step.ID);
                                setEditStepForm({
                                  action: step.action,
                                  expectedResult: step.expectedResult,
                                });
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-rose-600 hover:text-rose-700"
                            onClick={() => void deleteStep(step.ID)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-3 lg:grid-cols-2">
                        <div>
                          <p className="mb-1 text-xs font-medium uppercase text-slate-400">Action</p>
                          {isEditing ? (
                            <Textarea
                              value={editStepForm.action}
                              onChange={(event) =>
                                setEditStepForm((value) => ({
                                  ...value,
                                  action: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            <p className="text-sm text-slate-700">{step.action}</p>
                          )}
                        </div>

                        <div>
                          <p className="mb-1 text-xs font-medium uppercase text-slate-400">
                            Expected Result
                          </p>
                          {isEditing ? (
                            <Textarea
                              value={editStepForm.expectedResult}
                              onChange={(event) =>
                                setEditStepForm((value) => ({
                                  ...value,
                                  expectedResult: event.target.value,
                                }))
                              }
                            />
                          ) : (
                            <p className="text-sm text-slate-700">{step.expectedResult}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No steps yet.
              </div>
            )}
          </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestCase ? "Edit test case" : "Create test case"}</DialogTitle>
            <DialogDescription>Add the basic details for this test case.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
              <Input
                value={caseForm.title}
                onChange={(event) =>
                  setCaseForm((value) => ({ ...value, title: event.target.value }))
                }
                placeholder="Enter test case title"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Preconditions</label>
              <Textarea
                value={caseForm.preconditions}
                onChange={(event) =>
                  setCaseForm((value) => ({
                    ...value,
                    preconditions: event.target.value,
                  }))
                }
                placeholder="Enter preconditions"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
              <Select
                value={caseForm.priority}
                onValueChange={(value) =>
                  setCaseForm((current) => ({ ...current, priority: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCaseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => void (editingTestCase ? handleUpdate() : handleCreate())}>
              {editingTestCase ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete test case?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
