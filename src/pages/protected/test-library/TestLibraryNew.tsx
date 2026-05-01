"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ApiRequestError,
  parseApiErrorResponse,
  prioritizeApiErrorMessages,
} from "@/lib/api-error";
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

type MobilePanel = "folders" | "cases" | "steps";

const FOLDER_API = `${import.meta.env.VITE_BACKEND_API_URL}/Folders`;
const TESTCASE_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestCases`;
const TESTSTEP_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestSteps`;
const PANEL_LAYOUT_KEY = "test-library-new-layout-v1";
const RIGHT_PANEL_LAYOUT_KEY = "test-library-new-right-layout-v1";
const DEFAULT_HORIZONTAL_LAYOUT = [22, 78];
const CLOSED_HORIZONTAL_LAYOUT = [0, 100];
const DEFAULT_VERTICAL_LAYOUT = [38, 62];
const CASES_FOCUS_LAYOUT = [100, 0];
const STEPS_FOCUS_LAYOUT = [0, 100];
const MIN_LEFT_PANEL = 0;
const MIN_MAIN_PANEL = 0;
const MIN_CASES_PANEL = 0;
const MIN_STEPS_PANEL = 0;
const LAYOUT_TOLERANCE = 2;
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

const buildTree = (data: FolderNode[]) => {
  const map: Record<string, FolderNode> = {};
  const roots: FolderNode[] = [];

  data.forEach((item) => {
    map[item.ID] = { ...item, children: [] };
  });

  data.forEach((item) => {
    if (item.parentFolder_ID && map[item.parentFolder_ID]) {
      map[item.parentFolder_ID].children?.push(map[item.ID]);
    } else {
      roots.push(map[item.ID]);
    }
  });

  return roots;
};

const flattenTree = (nodes: FolderNode[]): FolderNode[] =>
  nodes.flatMap((node) => [node, ...(node.children ? flattenTree(node.children) : [])]);

const filterTree = (nodes: FolderNode[], query: string): FolderNode[] => {
  if (!query.trim()) return nodes;

  const normalizedQuery = query.trim().toLowerCase();

  return nodes.reduce<FolderNode[]>((acc, node) => {
    const filteredChildren = filterTree(node.children ?? [], normalizedQuery);
    const matches = node.name.toLowerCase().includes(normalizedQuery);

    if (matches || filteredChildren.length) {
      acc.push({ ...node, children: filteredChildren });
    }

    return acc;
  }, []);
};

const countNestedFolders = (node: FolderNode): number =>
  (node.children?.length ?? 0) +
  (node.children?.reduce((sum, child) => sum + countNestedFolders(child), 0) ?? 0);

const isNearLayout = (current: number[], target: number[]) =>
  current.length === target.length &&
  current.every((value, index) => Math.abs(value - target[index]) <= LAYOUT_TOLERANCE);

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const showApiErrorToast = (error: unknown, fallbackTitle: string) => {
  const messages = prioritizeApiErrorMessages(
    error instanceof ApiRequestError
      ? error.messages
      : [error instanceof Error ? error.message : fallbackTitle],
  );

  toast.error(messages[0] || fallbackTitle, {
    description: messages.length > 1 ? messages.slice(1).join("\n") : undefined,
  });
};

export default function TestLibraryNew() {
  const foldersRequestRef = useRef(0);
  const casesRequestRef = useRef(0);
  const stepsRequestRef = useRef(0);
  const desktopWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const desktopRightPanelRef = useRef<HTMLDivElement | null>(null);
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [history, setHistory] = useState<FolderNode[]>([]);
  const [future, setFuture] = useState<FolderNode[]>([]);
  const [treeSearch, setTreeSearch] = useState("");
  const [horizontalLayout, setHorizontalLayout] = useState<number[]>(DEFAULT_HORIZONTAL_LAYOUT);
  const [verticalLayout, setVerticalLayout] = useState<number[]>(DEFAULT_VERTICAL_LAYOUT);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("folders");

  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(null);
  const [caseSearch, setCaseSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteCaseId, setDeleteCaseId] = useState<string | null>(null);
  const [showStepForm, setShowStepForm] = useState(false);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [caseForm, setCaseForm] = useState<TestCaseForm>(defaultCaseForm);
  const [stepForm, setStepForm] = useState<StepForm>(defaultStepForm);
  const [editStepForm, setEditStepForm] = useState<StepForm>(defaultStepForm);

  const fetchFolders = useCallback(async () => {
    const requestId = ++foldersRequestRef.current;

    try {
      const res = await fetch(FOLDER_API);
      if (!res.ok) {
        throw new ApiRequestError(
          await parseApiErrorResponse(res, "Create failed"),
          "Create failed",
        );
      }

      const data = await res.json();
      if (requestId !== foldersRequestRef.current) return;

      const nextTree = buildTree(data.value || []);
      const nextFlatTree = flattenTree(nextTree);
      setTree(nextTree);

      setSelectedFolder((currentSelected) => {
        if (!currentSelected) return null;
        return nextFlatTree.find((item) => item.ID === currentSelected.ID) ?? null;
      });
    } catch {
      toast.error("Failed to load folders");
    }
  }, []);

  const fetchTestCases = useCallback(async (folderId: string) => {
    const requestId = ++casesRequestRef.current;
    setCasesLoading(true);

    try {
      const res = await fetch(`${TESTCASE_API}?$filter=folder_ID eq '${folderId}'`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (requestId !== casesRequestRef.current) return;

      const items = data.value || [];
      setTestCases(items);

      setSelectedTestCaseId((currentId) =>
        currentId && items.some((item: TestCase) => item.ID === currentId) ? currentId : null,
      );
    } catch {
      if (requestId === casesRequestRef.current) {
        toast.error("Failed to fetch test cases");
      }
    } finally {
      if (requestId === casesRequestRef.current) {
        setCasesLoading(false);
      }
    }
  }, []);

  const fetchSteps = useCallback(async (testCaseId: string) => {
    const requestId = ++stepsRequestRef.current;
    setStepsLoading(true);

    try {
      const res = await fetch(`${TESTSTEP_API}?$filter=testCase_ID eq '${testCaseId}'`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      if (requestId !== stepsRequestRef.current) return;

      const sorted = (data.value || []).sort(
        (a: TestStep, b: TestStep) => a.stepNumber - b.stepNumber,
      );
      setSteps(sorted);
    } catch {
      if (requestId === stepsRequestRef.current) {
        toast.error("Failed to fetch steps");
      }
    } finally {
      if (requestId === stepsRequestRef.current) {
        setStepsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedHorizontal = window.localStorage.getItem(PANEL_LAYOUT_KEY);
      const savedVertical = window.localStorage.getItem(RIGHT_PANEL_LAYOUT_KEY);

      if (savedHorizontal) {
        const parsed = JSON.parse(savedHorizontal) as number[];
        if (Array.isArray(parsed) && parsed.length === 2) {
          setHorizontalLayout(parsed);
        }
      }

      if (savedVertical) {
        const parsed = JSON.parse(savedVertical) as number[];
        if (Array.isArray(parsed) && parsed.length === 2) {
          setVerticalLayout(parsed);
        }
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PANEL_LAYOUT_KEY, JSON.stringify(horizontalLayout));
  }, [horizontalLayout]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(RIGHT_PANEL_LAYOUT_KEY, JSON.stringify(verticalLayout));
  }, [verticalLayout]);

  useEffect(() => {
    setSelectedTestCaseId(null);
    setSteps([]);
    setShowStepForm(false);
    setEditingStepId(null);
    setStepForm(defaultStepForm);
    setEditStepForm(defaultStepForm);

    if (selectedFolder?.ID) {
      void fetchTestCases(selectedFolder.ID);
    } else {
      setTestCases([]);
    }
  }, [fetchTestCases, selectedFolder?.ID]);

  useEffect(() => {
    if (selectedTestCaseId) {
      void fetchSteps(selectedTestCaseId);
    } else {
      setSteps([]);
    }
  }, [fetchSteps, selectedTestCaseId]);

  const allFolders = useMemo(() => flattenTree(tree), [tree]);
  const filteredTree = useMemo(() => filterTree(tree, treeSearch), [tree, treeSearch]);

  const selectedPath = useMemo(() => {
    if (!selectedFolder) return [];

    const byId = new Map(allFolders.map((folder) => [folder.ID, folder]));
    const path: FolderNode[] = [];
    let current: FolderNode | undefined = selectedFolder;

    while (current) {
      path.unshift(current);
      current = current.parentFolder_ID ? byId.get(current.parentFolder_ID) : undefined;
    }

    return path;
  }, [allFolders, selectedFolder]);

  const filteredCases = useMemo(() => {
    let data = [...testCases];

    if (caseSearch.trim()) {
      const normalizedQuery = caseSearch.trim().toLowerCase();
      data = data.filter((testCase) =>
        [testCase.title, testCase.preconditions || ""].join(" ").toLowerCase().includes(normalizedQuery),
      );
    }

    if (priorityFilter !== "All") {
      data = data.filter((testCase) => testCase.priority === priorityFilter);
    }

    return data;
  }, [caseSearch, priorityFilter, testCases]);

  const selectedTestCase =
    filteredCases.find((testCase) => testCase.ID === selectedTestCaseId) ||
    testCases.find((testCase) => testCase.ID === selectedTestCaseId) ||
    null;

  const isLeftCollapsed = isNearLayout(horizontalLayout, CLOSED_HORIZONTAL_LAYOUT);
  const isCasesExpanded = isNearLayout(verticalLayout, CASES_FOCUS_LAYOUT);
  const isStepsExpanded = isNearLayout(verticalLayout, STEPS_FOCUS_LAYOUT);

  const resetStepDrafts = useCallback(() => {
    setShowStepForm(false);
    setEditingStepId(null);
    setStepForm(defaultStepForm);
    setEditStepForm(defaultStepForm);
  }, []);

  const showBothRightPanels = useCallback(() => {
    setVerticalLayout(DEFAULT_VERTICAL_LAYOUT);
  }, []);

  const ensureCasesPanelVisible = useCallback(() => {
    setVerticalLayout((current) =>
      isNearLayout(current, STEPS_FOCUS_LAYOUT) ? DEFAULT_VERTICAL_LAYOUT : current,
    );
  }, []);

  const ensureStepsPanelVisible = useCallback(() => {
    setVerticalLayout((current) =>
      isNearLayout(current, CASES_FOCUS_LAYOUT) ? DEFAULT_VERTICAL_LAYOUT : current,
    );
  }, []);

  const clearSelectedTestCase = useCallback(() => {
    setSelectedTestCaseId(null);
    setSteps([]);
    resetStepDrafts();
  }, [resetStepDrafts]);

  const clearSelectedFolder = useCallback(() => {
    setSelectedFolder(null);
    setTestCases([]);
    clearSelectedTestCase();
    showBothRightPanels();
  }, [clearSelectedTestCase, showBothRightPanels]);

  const handleSelectTestCase = useCallback(
    (testCaseId: string) => {
      const isSameCase = selectedTestCaseId === testCaseId;

      if (isSameCase) {
        clearSelectedTestCase();
        showBothRightPanels();
        setMobilePanel("cases");
        return;
      }

      setSelectedTestCaseId(testCaseId);
      resetStepDrafts();
      ensureStepsPanelVisible();
      setMobilePanel("steps");
    },
    [
      clearSelectedTestCase,
      ensureStepsPanelVisible,
      resetStepDrafts,
      selectedTestCaseId,
      showBothRightPanels,
    ],
  );

  const toggleLeftPanel = () => {
    setHorizontalLayout(isLeftCollapsed ? DEFAULT_HORIZONTAL_LAYOUT : CLOSED_HORIZONTAL_LAYOUT);
  };

  const showCasesOnly = () => {
    setVerticalLayout(isCasesExpanded ? DEFAULT_VERTICAL_LAYOUT : CASES_FOCUS_LAYOUT);
  };

  const showStepsOnly = () => {
    setVerticalLayout(isStepsExpanded ? DEFAULT_VERTICAL_LAYOUT : STEPS_FOCUS_LAYOUT);
  };

  const resetRightPanels = () => {
    showBothRightPanels();
  };

  const startHorizontalResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const container = desktopWorkspaceRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const move = (moveEvent: PointerEvent) => {
        const nextLeft = clamp(
          ((moveEvent.clientX - rect.left) / rect.width) * 100,
          MIN_LEFT_PANEL,
          100 - MIN_MAIN_PANEL,
        );

        setHorizontalLayout([nextLeft, 100 - nextLeft]);
      };

      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
      event.preventDefault();
    },
    [],
  );

  const startVerticalResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const container = desktopRightPanelRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const move = (moveEvent: PointerEvent) => {
        const nextTop = clamp(
          ((moveEvent.clientY - rect.top) / rect.height) * 100,
          MIN_CASES_PANEL,
          100 - MIN_STEPS_PANEL,
        );

        setVerticalLayout([nextTop, 100 - nextTop]);
      };

      const stop = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
      };

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop, { once: true });
      event.preventDefault();
    },
    [],
  );

  const handleSelectFolder = (folder: FolderNode) => {
    if (selectedFolder?.ID === folder.ID) return;

    setHistory((value) => (selectedFolder ? [...value, selectedFolder] : value));
    setFuture([]);
    setSelectedFolder(folder);
    showBothRightPanels();
    setMobilePanel("cases");
  };

  const handleBack = () => {
    if (!history.length) return;

    const previousFolder = history[history.length - 1];
    setHistory((value) => value.slice(0, -1));
    setFuture((value) => (selectedFolder ? [selectedFolder, ...value] : value));
    setSelectedFolder(previousFolder);
    showBothRightPanels();
    setMobilePanel("cases");
  };

  const handleForward = () => {
    if (!future.length) return;

    const nextFolder = future[0];
    setFuture((value) => value.slice(1));
    setHistory((value) => (selectedFolder ? [...value, selectedFolder] : value));
    setSelectedFolder(nextFolder);
    showBothRightPanels();
    setMobilePanel("cases");
  };

  const createFolder = async (parentId: string | null) => {
    try {
      const res = await fetch(FOLDER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Folder",
          parentFolder_ID: parentId,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Folder created");
      await fetchFolders();
    } catch {
      toast.error("Failed to create folder");
    }
  };

  const deleteFolder = async (folder: FolderNode) => {
    if (!confirm(`Delete "${folder.name}" and its contents?`)) return;

    try {
      const res = await fetch(`${FOLDER_API}('${folder.ID}')`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Folder deleted");

      if (selectedFolder?.ID === folder.ID) {
        clearSelectedFolder();
      }

      setHistory((value) => value.filter((item) => item.ID !== folder.ID));
      setFuture((value) => value.filter((item) => item.ID !== folder.ID));

      await fetchFolders();
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  const renameFolder = async (id: string, name: string) => {
    try {
      const res = await fetch(`${FOLDER_API}('${id}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) throw new Error();

      toast.success("Folder renamed");
      await fetchFolders();
    } catch {
      toast.error("Rename failed");
    }
  };

  const openCreateDialog = () => {
    ensureCasesPanelVisible();
    setEditingTestCase(null);
    setCaseForm(defaultCaseForm);
    setShowCaseDialog(true);
  };

  const openEditDialog = (testCase: TestCase) => {
    ensureCasesPanelVisible();
    setEditingTestCase(testCase);
    setCaseForm({
      title: testCase.title,
      preconditions: testCase.preconditions || "",
      priority: testCase.priority,
    });
    setShowCaseDialog(true);
  };

  const handleCaseDialogChange = (open: boolean) => {
    setShowCaseDialog(open);

    if (!open) {
      setEditingTestCase(null);
      setCaseForm(defaultCaseForm);
    }
  };

  const handleDeleteDialogChange = (open: boolean) => {
    setShowDeleteDialog(open);

    if (!open) {
      setDeleteCaseId(null);
    }
  };

  const handleCreateCase = async () => {
    if (!selectedFolder?.ID) return;
    if (!caseForm.title.trim()) return toast.error("Title required");

    try {
      const res = await fetch(TESTCASE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...caseForm,
          folder_ID: selectedFolder.ID,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Test case created");
      setShowCaseDialog(false);
      setCaseForm(defaultCaseForm);
      await fetchTestCases(selectedFolder.ID);
      setSelectedTestCaseId(null);
      showBothRightPanels();
      setMobilePanel("cases");
    } catch (error) {
      showApiErrorToast(error, "Create failed");
    }
  };

  const handleUpdateCase = async () => {
    if (!selectedFolder?.ID || !editingTestCase) return;
    if (!caseForm.title.trim()) return toast.error("Title required");

    try {
      const res = await fetch(`${TESTCASE_API}('${editingTestCase.ID}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseForm),
      });

      if (!res.ok) {
        throw new ApiRequestError(
          await parseApiErrorResponse(res, "Update failed"),
          "Update failed",
        );
      }

      toast.success("Test case updated");
      setShowCaseDialog(false);
      await fetchTestCases(selectedFolder.ID);
      setSelectedTestCaseId(editingTestCase.ID);
      setEditingTestCase(null);
      ensureCasesPanelVisible();
      setMobilePanel("cases");
    } catch (error) {
      showApiErrorToast(error, "Update failed");
    }
  };

  const handleDeleteCase = async () => {
    if (!selectedFolder?.ID || !deleteCaseId) return;

    try {
      const res = await fetch(`${TESTCASE_API}('${deleteCaseId}')`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new ApiRequestError(
          await parseApiErrorResponse(res, "Add step failed"),
          "Add step failed",
        );
      }

      toast.success("Test case deleted");
      setShowDeleteDialog(false);
      setDeleteCaseId(null);

      if (selectedTestCaseId === deleteCaseId) {
        clearSelectedTestCase();
      }

      await fetchTestCases(selectedFolder.ID);
      ensureCasesPanelVisible();
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
      const nextStepNumber =
        steps.reduce((max, step) => Math.max(max, step.stepNumber), 0) + 1;

      const res = await fetch(TESTSTEP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepNumber: nextStepNumber,
          ...stepForm,
          testCase_ID: selectedTestCaseId,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Step added");
      setStepForm(defaultStepForm);
      setShowStepForm(false);
      await fetchSteps(selectedTestCaseId);
      ensureStepsPanelVisible();
      setMobilePanel("steps");
    } catch (error) {
      showApiErrorToast(error, "Add step failed");
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

      if (!res.ok) {
        throw new ApiRequestError(
          await parseApiErrorResponse(res, "Update step failed"),
          "Update step failed",
        );
      }

      toast.success("Step updated");
      setEditingStepId(null);
      await fetchSteps(selectedTestCaseId);
      ensureStepsPanelVisible();
      setMobilePanel("steps");
    } catch (error) {
      showApiErrorToast(error, "Update step failed");
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
      ensureStepsPanelVisible();
      setMobilePanel("steps");
    } catch {
      toast.error("Delete step failed");
    }
  };

  const foldersPanel = (
    <section className="flex h-full min-h-0 flex-col bg-slate-50/80">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">Folders</div>
          <div className="text-xs text-slate-500">All folders and subfolders</div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={toggleLeftPanel}>
            {isLeftCollapsed ? "Open" : "Close"}
          </Button>
          <Button size="icon-sm" onClick={() => void createFolder(null)}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={treeSearch}
            onChange={(event) => setTreeSearch(event.target.value)}
            placeholder="Search folders"
            className="h-9 rounded-xl border-slate-200 pl-9"
          />
        </div>

        <Button variant="outline" size="icon-sm" disabled={!history.length} onClick={handleBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={!future.length}
          onClick={handleForward}
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-slate-200/70 bg-white/60 px-4 py-3">
        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Total
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">{allFolders.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Nested
          </div>
          <div className="mt-1 text-lg font-semibold text-slate-900">
            {selectedFolder ? countNestedFolders(selectedFolder) : 0}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {filteredTree.length ? (
          filteredTree.map((node) => (
            <TreeItem
              key={node.ID}
              node={node}
              level={0}
              selectedId={selectedFolder?.ID ?? null}
              searchTerm={treeSearch}
              onSelect={handleSelectFolder}
              createFolder={createFolder}
              deleteFolder={deleteFolder}
              renameFolder={renameFolder}
            />
          ))
        ) : (
          <div className="flex h-full min-h-[20rem] items-center justify-center rounded-2xl border border-dashed bg-white/70 px-6 text-center text-sm text-slate-500">
            No folders found.
          </div>
        )}
      </div>
    </section>
  );

  const casesPanel = (
    <section className="flex h-full min-h-0 flex-col bg-white/95">
      <div className="space-y-3 border-b border-slate-200/80 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900">Test Cases</div>
            <div className="truncate text-xs text-slate-500">
              {selectedPath.length ? selectedPath.map((folder) => folder.name).join(" / ") : "Select a folder"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isCasesExpanded ? resetRightPanels : showCasesOnly}
            >
              {isCasesExpanded ? "Show both" : "Open cases only"}
            </Button>
            <Button size="sm" onClick={openCreateDialog} disabled={!selectedFolder}>
              <Plus className="size-4" />
              New
            </Button>
            {selectedFolder ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  clearSelectedFolder();
                  setMobilePanel("folders");
                }}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={caseSearch}
              onChange={(event) => setCaseSearch(event.target.value)}
              placeholder="Search test cases"
              className="h-9 rounded-xl border-slate-200 pl-9"
              disabled={!selectedFolder}
            />
          </div>

          <Select value={priorityFilter} onValueChange={setPriorityFilter} disabled={!selectedFolder}>
            <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 xl:w-32">
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

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            {selectedFolder ? `${filteredCases.length} visible cases` : "No folder selected"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            Filter: {priorityFilter}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!selectedFolder ? (
          <Card className="flex h-full min-h-[28rem] items-center justify-center rounded-[24px] border-dashed bg-slate-50/70 shadow-none">
            <CardContent className="text-center">
              <FolderOpen className="mx-auto size-8 text-slate-400" />
              <h2 className="mt-4 text-lg font-semibold">Select a folder</h2>
              <p className="mt-1 text-sm text-slate-500">
                The center panel shows the test cases for the active folder.
              </p>
            </CardContent>
          </Card>
        ) : casesLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading test cases...
          </div>
        ) : filteredCases.length ? (
          <div className="space-y-2">
            {filteredCases.map((testCase) => (
              <button
                key={testCase.ID}
                type="button"
                onClick={() => handleSelectTestCase(testCase.ID)}
                className={cn(
                  "w-full rounded-2xl border p-3 text-left transition",
                  selectedTestCase?.ID === testCase.ID
                    ? "border-slate-900 bg-slate-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
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
                        setDeleteCaseId(testCase.ID);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-slate-50 px-6 text-center text-sm text-slate-500">
            No test cases found.
          </div>
        )}
      </div>
    </section>
  );

  const stepsPanel = (
    <section className="flex h-full min-h-0 flex-col bg-white/95">
      <div className="space-y-4 border-b border-slate-200/80 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-500">Selected Test Case</div>
            <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
              {selectedTestCase?.title || "Choose a test case"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {selectedTestCase?.preconditions || "Open a test case to view and edit steps."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={isStepsExpanded ? resetRightPanels : showStepsOnly}
            >
              {isStepsExpanded ? "Show both" : "Open steps only"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStepForm((value) => !value)}
              disabled={!selectedTestCase}
            >
              <Plus className="size-4" />
              Add Step
            </Button>
            {selectedTestCase ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  clearSelectedTestCase();
                  showBothRightPanels();
                  setMobilePanel("cases");
                }}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-slate-600">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              priorityTone[selectedTestCase?.priority || "Medium"] || priorityTone.Medium,
            )}
          >
            {selectedTestCase?.priority || "No priority"}
          </span>
          <span className="rounded-full border px-2.5 py-1">{steps.length} steps</span>
          <span className="rounded-full border px-2.5 py-1">
            {selectedPath[selectedPath.length - 1]?.name || "Folder"}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
        {!selectedTestCase ? (
          <Card className="flex h-full min-h-[28rem] items-center justify-center rounded-[24px] border-dashed bg-slate-50/70 shadow-none">
            <CardContent className="text-center">
              <MoreHorizontal className="mx-auto size-8 text-slate-400" />
              <h2 className="mt-4 text-lg font-semibold">Select a test case</h2>
              <p className="mt-1 text-sm text-slate-500">
                The right panel stays focused on step editing and review.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {showStepForm ? (
              <div className="space-y-3 rounded-2xl border bg-slate-50 p-3">
                <Input
                  value={stepForm.action}
                  onChange={(event) =>
                    setStepForm((value) => ({ ...value, action: event.target.value }))
                  }
                  placeholder="Action"
                  className="rounded-xl"
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
            ) : null}

            {stepsLoading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading steps...
              </div>
            ) : steps.length ? (
              <div className="min-h-0 overflow-auto rounded-2xl border border-slate-200 bg-white">
                <Table className="min-w-[760px] table-fixed">
                  <TableHeader className="bg-slate-50/80">
                    <TableRow className="hover:bg-slate-50/80">
                      <TableHead className="w-[12%] px-4">Step</TableHead>
                      <TableHead className="w-[38%] px-4">Action</TableHead>
                      <TableHead className="w-[38%] px-4">Expected Result</TableHead>
                      <TableHead className="w-[12%] px-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {steps.map((step) => {
                      const isEditing = editingStepId === step.ID;

                      return (
                        <TableRow key={step.ID} className="align-top hover:bg-slate-50">
                          <TableCell className="px-4 py-3 align-top">
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                              {step.stepNumber}
                            </span>
                          </TableCell>
                          <TableCell className="px-4 py-3 align-top">
                            {isEditing ? (
                              <Textarea
                                value={editStepForm.action}
                                onChange={(event) =>
                                  setEditStepForm((value) => ({
                                    ...value,
                                    action: event.target.value,
                                  }))
                                }
                                className="min-h-24 whitespace-normal"
                              />
                            ) : (
                              <p className="whitespace-normal text-sm text-slate-700">{step.action}</p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 align-top">
                            {isEditing ? (
                              <Textarea
                                value={editStepForm.expectedResult}
                                onChange={(event) =>
                                  setEditStepForm((value) => ({
                                    ...value,
                                    expectedResult: event.target.value,
                                  }))
                                }
                                className="min-h-24 whitespace-normal"
                              />
                            ) : (
                              <p className="whitespace-normal text-sm text-slate-700">
                                {step.expectedResult}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 align-top">
                            <div className="flex justify-end gap-1">
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setEditingStepId(step.ID);
                                        setEditStepForm({
                                          action: step.action,
                                          expectedResult: step.expectedResult,
                                        });
                                      }}
                                    >
                                      <Pencil className="size-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-rose-600 focus:text-rose-700"
                                      onClick={() => void deleteStep(step.ID)}
                                    >
                                      <Trash2 className="size-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed bg-slate-50 text-sm text-slate-500">
                No steps yet.
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.11),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(15,23,42,0.06),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef3f8_100%)] p-3 text-slate-900 sm:p-4 lg:p-5">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-4">
          <div className="rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_10px_35px_rgba(15,23,42,0.05)] backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                {/* <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                  Test Management
                </p> */}
                <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Test Library New
                </h1>
                
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                <div className="flex flex-wrap items-center gap-1 rounded-full border border-white/70 bg-white/80 p-1 shadow-sm lg:hidden">
                  <Button
                    variant={mobilePanel === "folders" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMobilePanel("folders")}
                  >
                    Folders
                  </Button>
                  <Button
                    variant={mobilePanel === "cases" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMobilePanel("cases")}
                  >
                    Cases
                  </Button>
                  <Button
                    variant={mobilePanel === "steps" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMobilePanel("steps")}
                  >
                    Steps
                  </Button>
                </div>
                {/* <Button variant="outline" size="sm" onClick={toggleLeftPanel}>
                  {isLeftCollapsed ? <ChevronLast className="size-4" /> : <ChevronFirst className="size-4" />}
                  {isLeftCollapsed ? "Open folders" : "Close folders"}
                </Button> */}
                {/* <Button variant="outline" size="sm" onClick={showCasesOnly}>
                  <ArrowUp className="size-4" />
                  {isCasesExpanded ? "Show both" : "Open cases only"}
                </Button> */}
                {/* <Button variant="outline" size="sm" onClick={showStepsOnly}>
                  <ArrowRight className="size-4" />
                  {isStepsExpanded ? "Show both" : "Open steps only"}
                </Button> */}
                {/* <Button variant="outline" size="sm" onClick={resetRightPanels}>
                  Balanced view
                </Button> */}
                <div className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-sky-800 shadow-sm">
                  {allFolders.length} folders
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  {selectedFolder ? countNestedFolders(selectedFolder) : 0} nested
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  {filteredCases.length} cases
                </div>
                <div className="rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                  {steps.length} steps
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/70 backdrop-blur">
            <div className="hidden h-[calc(100vh-13.5rem)] min-h-[38rem] lg:block">
              <div ref={desktopWorkspaceRef} className="flex h-full w-full overflow-hidden">
                <div
                  className="min-h-0 min-w-0 shrink-0 overflow-hidden"
                  style={{ width: `${horizontalLayout[0]}%` }}
                >
                  {foldersPanel}
                </div>

                <div
                  role="separator"
                  tabIndex={0}
                  aria-orientation="vertical"
                  onPointerDown={startHorizontalResize}
                  className="group relative w-2 shrink-0 cursor-col-resize bg-slate-100/70 transition hover:bg-slate-200/80"
                >
                  <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200 group-hover:bg-slate-300" />
                  <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-1 text-slate-400 shadow-sm">
                    <MoreHorizontal className="size-3.5 rotate-90" />
                  </div>
                </div>

                <div
                  ref={desktopRightPanelRef}
                  className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
                  style={{ width: `${horizontalLayout[1]}%` }}
                >
                  <div
                    className="min-h-0 overflow-hidden"
                    style={{ height: `${verticalLayout[0]}%` }}
                  >
                    {casesPanel}
                  </div>

                  <div
                    role="separator"
                    tabIndex={0}
                    aria-orientation="horizontal"
                    onPointerDown={startVerticalResize}
                    className="group relative h-2 shrink-0 cursor-row-resize bg-slate-100/70 transition hover:bg-slate-200/80"
                  >
                    <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200 group-hover:bg-slate-300" />
                    <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white p-1 text-slate-400 shadow-sm">
                      <MoreHorizontal className="size-3.5" />
                    </div>
                  </div>

                  <div
                    className="min-h-0 overflow-hidden"
                    style={{ height: `${verticalLayout[1]}%` }}
                  >
                    {stepsPanel}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-[calc(100vh-15rem)] flex-col gap-4 p-4 lg:hidden">
              <div
                className={cn(
                  "min-h-[28rem] overflow-hidden rounded-[24px] border border-slate-200 bg-white",
                  mobilePanel !== "folders" && "hidden",
                )}
              >
                {foldersPanel}
              </div>
              <div
                className={cn(
                  "min-h-[28rem] overflow-hidden rounded-[24px] border border-slate-200 bg-white",
                  mobilePanel !== "cases" && "hidden",
                )}
              >
                {casesPanel}
              </div>
              <div
                className={cn(
                  "min-h-[28rem] overflow-hidden rounded-[24px] border border-slate-200 bg-white",
                  mobilePanel !== "steps" && "hidden",
                )}
              >
                {stepsPanel}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showCaseDialog} onOpenChange={handleCaseDialogChange}>
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
            <Button onClick={() => void (editingTestCase ? handleUpdateCase() : handleCreateCase())}>
              {editingTestCase ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={handleDeleteDialogChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete test case?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDeleteCase()}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type TreeItemProps = {
  node: FolderNode;
  level: number;
  selectedId: string | null;
  searchTerm: string;
  onSelect: (folder: FolderNode) => void;
  createFolder: (parentId: string | null) => Promise<void>;
  deleteFolder: (folder: FolderNode) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
};

function TreeItem({
  node,
  level,
  selectedId,
  searchTerm,
  onSelect,
  createFolder,
  deleteFolder,
  renameFolder,
}: TreeItemProps) {
  const [open, setOpen] = useState(level < 1);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  const isSelected = selectedId === node.ID;
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = open || Boolean(searchTerm);

  return (
    <div className="mb-1.5" style={{ marginLeft: level * 10 }}>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-xl border border-transparent px-2.5 py-2",
          isSelected
            ? "border-slate-200 bg-white text-slate-900 shadow-sm"
            : "text-slate-700 hover:border-slate-200/80 hover:bg-white/75",
        )}
      >
        <button
          type="button"
          className="flex size-6 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          onClick={() => hasChildren && setOpen((value) => !value)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />
          ) : (
            <span className="size-4" />
          )}
        </button>

        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          onClick={() => onSelect(node)}
        >
          {isExpanded ? (
            <FolderOpen className="size-4 text-sky-600" />
          ) : (
            <Folder className="size-4 text-slate-500" />
          )}

          {isEditing ? (
            <Input
              autoFocus
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              onBlur={async () => {
                const nextName = editName.trim();

                if (nextName && nextName !== node.name) {
                  await renameFolder(node.ID, nextName);
                } else {
                  setEditName(node.name);
                }

                setIsEditing(false);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }

                if (event.key === "Escape") {
                  setEditName(node.name);
                  setIsEditing(false);
                }
              }}
              className="h-8"
            />
          ) : (
            <span className="truncate text-sm">{node.name}</span>
          )}
        </button>

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation();
              void createFolder(node.ID);
            }}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation();
              setEditName(node.name);
              setIsEditing(true);
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
              void deleteFolder(node);
            }}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {isExpanded &&
        node.children?.map((child) => (
          <TreeItem
            key={child.ID}
            node={child}
            level={level + 1}
            selectedId={selectedId}
            searchTerm={searchTerm}
            onSelect={onSelect}
            createFolder={createFolder}
            deleteFolder={deleteFolder}
            renameFolder={renameFolder}
          />
        ))}
    </div>
  );
}
