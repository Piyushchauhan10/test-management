"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@ui5/webcomponents-fiori/dist/FlexibleColumnLayout.js";
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

type FCLLayout =
  | "OneColumn"
  | "TwoColumnsStartExpanded"
  | "TwoColumnsMidExpanded"
  | "ThreeColumnsMidExpanded"
  | "ThreeColumnsEndExpanded"
  | "ThreeColumnsStartExpandedEndHidden"
  | "ThreeColumnsMidExpandedEndHidden"
  | "ThreeColumnsStartHiddenMidExpanded"
  | "ThreeColumnsStartHiddenEndExpanded"
  | "MidColumnFullScreen"
  | "EndColumnFullScreen";

type FlexibleColumnLayoutElement = HTMLElement & {
  layout: FCLLayout;
};

const FOLDER_API = "http://72.61.244.79:4004/odata/v4/test-management/Folders";
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

export default function TestLibrary() {
  const fclRef = useRef<FlexibleColumnLayoutElement | null>(null);
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);
  const [history, setHistory] = useState<FolderNode[]>([]);
  const [future, setFuture] = useState<FolderNode[]>([]);
  const [treeSearch, setTreeSearch] = useState("");
  const [layout, setLayout] = useState<FCLLayout>("OneColumn");

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
    try {
      const res = await fetch(FOLDER_API);
      if (!res.ok) throw new Error();

      const data = await res.json();
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
    setCasesLoading(true);

    try {
      const res = await fetch(`${TESTCASE_API}?$filter=folder_ID eq '${folderId}'`);
      if (!res.ok) throw new Error();

      const data = await res.json();
      const items = data.value || [];
      setTestCases(items);

      setSelectedTestCaseId((currentId) =>
        currentId && items.some((item: TestCase) => item.ID === currentId) ? currentId : null,
      );
    } catch {
      toast.error("Failed to fetch test cases");
    } finally {
      setCasesLoading(false);
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
    void fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    const nextLayout: FCLLayout = !selectedFolder
      ? "OneColumn"
      : selectedTestCaseId
        ? "ThreeColumnsMidExpanded"
        : "TwoColumnsMidExpanded";

    setLayout(nextLayout);

    if (fclRef.current) {
      fclRef.current.layout = nextLayout;
    }
  }, [selectedFolder, selectedTestCaseId]);

  useEffect(() => {
    const fcl = fclRef.current;
    if (!fcl) return;

    const handleLayoutChange = () => {
      setLayout(fcl.layout);
    };

    fcl.addEventListener("layout-change", handleLayoutChange);

    return () => {
      fcl.removeEventListener("layout-change", handleLayoutChange);
    };
  }, []);

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

  const handleSelectFolder = (folder: FolderNode) => {
    if (selectedFolder?.ID === folder.ID) return;

    setHistory((value) => (selectedFolder ? [...value, selectedFolder] : value));
    setFuture([]);
    setSelectedFolder(folder);
  };

  const handleBack = () => {
    if (!history.length) return;

    const previousFolder = history[history.length - 1];
    setHistory((value) => value.slice(0, -1));
    setFuture((value) => (selectedFolder ? [selectedFolder, ...value] : value));
    setSelectedFolder(previousFolder);
  };

  const handleForward = () => {
    if (!future.length) return;

    const nextFolder = future[0];
    setFuture((value) => value.slice(1));
    setHistory((value) => (selectedFolder ? [...value, selectedFolder] : value));
    setSelectedFolder(nextFolder);
  };

  const closeCasesColumn = () => {
    setSelectedFolder(null);
    setSelectedTestCaseId(null);
  };

  const closeStepsColumn = () => {
    setSelectedTestCaseId(null);
    setShowStepForm(false);
    setEditingStepId(null);
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
        setSelectedFolder(null);
        setSelectedTestCaseId(null);
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
    } catch {
      toast.error("Create failed");
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

      if (!res.ok) throw new Error();

      toast.success("Test case updated");
      setShowCaseDialog(false);
      setEditingTestCase(null);
      await fetchTestCases(selectedFolder.ID);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDeleteCase = async () => {
    if (!selectedFolder?.ID || !deleteCaseId) return;

    try {
      const res = await fetch(`${TESTCASE_API}('${deleteCaseId}')`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Test case deleted");
      setShowDeleteDialog(false);

      if (selectedTestCaseId === deleteCaseId) {
        setSelectedTestCaseId(null);
      }

      await fetchTestCases(selectedFolder.ID);
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

  return (
    <>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.14),_transparent_34%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-4 text-slate-900 md:p-5">
        <div className="mx-auto flex max-w-[1700px] flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="pl-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Test Management
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight">Test Library</h1>
              {/* <p className="mt-1 pl-5 text-sm text-slate-500">
                Clean three-column flow: folders, test cases, and test steps.
              </p> */}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <div className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 shadow-sm">
                Layout: {layout}
              </div>
              <div className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 shadow-sm">
                {allFolders.length} folders
              </div>
              <div className="rounded-full border border-white/70 bg-white/80 px-3 py-1.5 shadow-sm">
                {selectedFolder ? countNestedFolders(selectedFolder) : 0} nested
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <ui5-flexible-column-layout
              ref={fclRef}
              layout={layout}
              className="block h-[calc(100vh-11rem)] w-full bg-transparent"
            >
              <section
                slot="startColumn"
                className="flex h-full min-h-0 flex-col border-r border-slate-200/80 bg-slate-50/80"
              >
                <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Folders</div>
                    <div className="text-xs text-slate-500">All folders and subfolders</div>
                  </div>

                  <Button size="icon-sm" onClick={() => void createFolder(null)}>
                    <Plus className="size-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={treeSearch}
                      onChange={(event) => setTreeSearch(event.target.value)}
                      placeholder="Search folders"
                      className="h-9 rounded-xl border-slate-200 bg-white pl-9"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                  <span>{allFolders.length} items</span>
                  <span>{selectedFolder ? selectedFolder.children?.length ?? 0 : 0} children</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
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
                    <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm text-slate-500">
                      No folders found.
                    </div>
                  )}
                </div>
              </section>

              <section
                slot="midColumn"
                className="flex h-full min-h-0 flex-col border-r border-slate-200/80 bg-white/80"
              >
                <div className="flex flex-col gap-3 border-b border-slate-200/80 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={handleBack}
                        disabled={!history.length}
                      >
                        <ArrowLeft className="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={handleForward}
                        disabled={!future.length}
                      >
                        <ArrowRight className="size-4" />
                      </Button>
                      <span className="rounded-full border bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                        Test Cases
                      </span>
                      {selectedFolder && (
                        <Button variant="ghost" size="icon-sm" onClick={closeCasesColumn}>
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {selectedFolder ? selectedFolder.name : "Select a folder"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedPath.length
                          ? selectedPath.map((folder) => folder.name).join(" / ")
                          : "Select any folder or subfolder from the first column to load its test cases here."}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <div className="rounded-xl border bg-white px-3 py-2 shadow-sm">
                      Cases: {filteredCases.length}
                    </div>
                    <div className="rounded-xl border bg-white px-3 py-2 shadow-sm">
                      Depth: {selectedPath.length || 0}
                    </div>
                    <Button size="sm" onClick={openCreateDialog} disabled={!selectedFolder}>
                      <Plus className="size-4" />
                      New
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 border-b border-slate-200/80 px-4 py-4">
                  <div className="flex flex-col gap-2 lg:flex-row">
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

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-9 w-full rounded-xl border-slate-200 lg:w-32">
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
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-3">
                  {!selectedFolder ? (
                    <Card className="flex h-full min-h-[30rem] items-center justify-center rounded-[24px] border-dashed bg-slate-50/70 shadow-none">
                      <CardContent className="text-center">
                        <FolderOpen className="mx-auto size-8 text-slate-400" />
                        <h2 className="mt-4 text-lg font-semibold">Select a folder</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          The first column contains the full folder and subfolder hierarchy. Pick one item to load its test cases.
                        </p>
                      </CardContent>
                    </Card>
                  ) : casesLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm text-slate-500">
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading test cases...
                    </div>
                  ) : filteredCases.length ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <Table className="table-fixed">
                        <TableHeader className="bg-slate-50/80">
                          <TableRow className="hover:bg-slate-50/80">
                            <TableHead className="w-[38%] px-4">Title</TableHead>
                            <TableHead className="w-[37%] px-4">Preconditions</TableHead>
                            <TableHead className="w-[13%] px-4">Priority</TableHead>
                            <TableHead className="w-[12%] px-4 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCases.map((testCase) => (
                            <TableRow
                              key={testCase.ID}
                              onClick={() => {
                                setSelectedTestCaseId((current) =>
                                  current === testCase.ID ? null : testCase.ID,
                                );
                                setEditingStepId(null);
                                setShowStepForm(false);
                              }}
                              className={cn(
                                "cursor-pointer",
                                selectedTestCase?.ID === testCase.ID
                                  ? "bg-slate-100 hover:bg-slate-100"
                                  : "hover:bg-slate-50",
                              )}
                            >
                              <TableCell className="px-4 py-3 align-top">
                                <p className="truncate font-medium text-slate-900 ">
                                  {testCase.title}
                                </p>
                              </TableCell>
                              <TableCell className="px-4 py-3 align-top">
                                <p className="line-clamp-2 whitespace-normal text-sm text-slate-500">
                                  {testCase.preconditions || "No preconditions"}
                                </p>
                              </TableCell>
                              <TableCell className="px-4 py-3 align-top">
                                <span
                                  className={cn(
                                    "inline-flex rounded px-2 py-1 text-xs font-medium",
                                    priorityTone[testCase.priority] || priorityTone.Medium,
                                  )}
                                >
                                  {testCase.priority}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3 align-top">
                                <div className="flex justify-end">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <MoreHorizontal className="size-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 rounded-xl">
                                      <DropdownMenuItem
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          openEditDialog(testCase);
                                        }}
                                      >
                                        <Pencil className="size-4" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-rose-600 focus:text-rose-700"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          setDeleteCaseId(testCase.ID);
                                          setShowDeleteDialog(true);
                                        }}
                                      >
                                        <Trash2 className="size-4" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* {!selectedTestCase && (
                        <div className="border-t border-dashed bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          Click any row to open its test steps in the third column.
                        </div>
                      )} */}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
                      No test cases found.
                    </div>
                  )}
                </div>
              </section>

              <section slot="endColumn" className="h-full min-h-0 bg-white/75">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 px-4 py-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-500">Test Steps</div>
                      <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">
                        {selectedTestCase?.title || "Select a test case"}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedTestCase?.preconditions || "Open a test case from the middle column to manage its steps."}
                      </p>
                    </div>

                    {selectedTestCase && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowStepForm((value) => !value)}
                        >
                          <Plus className="size-4" />
                          Add Step
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={closeStepsColumn}>
                          <X className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 border-b border-slate-200/80 px-4 py-3 text-sm text-slate-600">
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

                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
                    {!selectedTestCase ? (
                      <Card className="flex h-full min-h-[30rem] items-center justify-center rounded-[24px] border-dashed bg-slate-50/70 shadow-none">
                        <CardContent className="text-center">
                          <FolderOpen className="mx-auto size-8 text-slate-400" />
                          <h2 className="mt-4 text-lg font-semibold">Select a test case</h2>
                          <p className="mt-1 text-sm text-slate-500">
                            The third column stays focused only on test steps to keep the UI clean.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {showStepForm && (
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
                        )}

                        {stepsLoading ? (
                          <div className="flex h-full items-center justify-center text-sm text-slate-500">
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            Loading steps...
                          </div>
                        ) : steps.length ? (
                          <div className="min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                            <Table className="table-fixed">
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
                                          <p className="whitespace-normal text-sm text-slate-700">
                                            {step.action}
                                          </p>
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
                                              <Button
                                                size="icon-sm"
                                                onClick={() => void updateStep(step.ID)}
                                              >
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
                                              <DropdownMenuContent
                                                align="end"
                                                className="w-36 rounded-xl"
                                              >
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
                </div>
              </section>
            </ui5-flexible-column-layout>
          </div>
        </div>
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
            <Button onClick={() => void (editingTestCase ? handleUpdateCase() : handleCreateCase())}>
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
          className="flex min-w-0 items-center gap-2 text-left"
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
