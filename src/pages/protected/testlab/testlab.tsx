"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TESTLAB_STORAGE_KEY = "testlab_local_data_v1";
const FOLDER_API = "http://72.61.244.79:4004/odata/v4/test-management/Folders";
const TESTCASE_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestCases`;
const SPRINT_API = `${import.meta.env.VITE_BACKEND_API_URL}/Sprints`;
const TESTSTEP_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestSteps`;

type FolderNode = {
  ID: string;
  name: string;
  parentFolder_ID: string | null;
  testCycle_ID?: string | null;
  children?: FolderNode[];
};

type Sprint = {
  ID: string;
  name: string;
  project_ID: string;
};

type TestCase = {
  ID: string;
  title: string;
  priority?: string;
  preconditions?: string;
  folder_ID: string;
};

type TestStep = {
  ID: string;
  stepNumber: number;
  action: string;
  expectedResult: string;
  testCase_ID: string;
};

type TestLabStore = {
  sprints: Sprint[];
  sprintAssignments?: Record<string, string[]>;
};

type AssignedTreeNode = Omit<FolderNode, "children"> & {
  children: AssignedTreeNode[];
  testCases: TestCase[];
};

const defaultTestLabStore: TestLabStore = {
  sprints: [],
  sprintAssignments: {
    "sprint-1": ["folder-1", "folder-2"],
    "sprint-2": ["folder-4", "folder-5"],
    "sprint-3": ["folder-6"],
  },
};

const readTestLabStore = (): TestLabStore => {
  if (typeof window === "undefined") {
    return defaultTestLabStore;
  }

  const saved = window.localStorage.getItem(TESTLAB_STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      TESTLAB_STORAGE_KEY,
      JSON.stringify(defaultTestLabStore),
    );
    return defaultTestLabStore;
  }

  try {
    const parsed = JSON.parse(saved) as TestLabStore;

    return {
      ...defaultTestLabStore,
      ...parsed,
      sprintAssignments: parsed.sprintAssignments || {},
    };
  } catch {
    window.localStorage.setItem(
      TESTLAB_STORAGE_KEY,
      JSON.stringify(defaultTestLabStore),
    );
    return defaultTestLabStore;
  }
};

const writeTestLabStore = (store: TestLabStore) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TESTLAB_STORAGE_KEY, JSON.stringify(store));
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
      return;
    }

    roots.push(map[item.ID]);
  });

  return roots;
};

const getVisibleTree = (
  nodes: FolderNode[],
  query: string,
  testCasesByFolder: Record<string, TestCase[]>,
): FolderNode[] => {
  if (!query.trim()) return nodes;

  const normalizedQuery = query.toLowerCase();

  return nodes.reduce<FolderNode[]>((acc, node) => {
    const visibleChildren = getVisibleTree(
      node.children || [],
      query,
      testCasesByFolder,
    );
    const matches = node.name.toLowerCase().includes(normalizedQuery);
    const matchesTestCase = (testCasesByFolder[node.ID] || []).some((testCase) =>
      [testCase.title, testCase.preconditions || "", testCase.priority || ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );

    if (matches || matchesTestCase || visibleChildren.length) {
      acc.push({
        ...node,
        children: visibleChildren,
      });
    }

    return acc;
  }, []);
};

const buildAssignedTree = (
  folders: FolderNode[],
  assignedIds: string[],
  testCases: TestCase[],
) => {
  const folderMap = new Map(folders.map((folder) => [folder.ID, folder]));
  const includedFolderIds = new Set<string>();
  const testCasesByFolder = testCases.reduce<Record<string, TestCase[]>>(
    (acc, testCase) => {
      acc[testCase.folder_ID] = [...(acc[testCase.folder_ID] || []), testCase];
      return acc;
    },
    {},
  );

  const collectDescendants = (folderId: string) => {
    if (includedFolderIds.has(folderId)) return;

    includedFolderIds.add(folderId);

    folders.forEach((folder) => {
      if (folder.parentFolder_ID === folderId) {
        collectDescendants(folder.ID);
      }
    });
  };

  assignedIds.forEach((folderId) => {
    if (folderMap.has(folderId)) {
      collectDescendants(folderId);
    }
  });

  const nodeMap = new Map<string, AssignedTreeNode>();

  includedFolderIds.forEach((folderId) => {
    const folder = folderMap.get(folderId);
    if (!folder) return;

    nodeMap.set(folderId, {
      ...folder,
      children: [],
      testCases: testCasesByFolder[folderId] || [],
    });
  });

  const roots: AssignedTreeNode[] = [];

  nodeMap.forEach((node) => {
    if (node.parentFolder_ID && nodeMap.has(node.parentFolder_ID)) {
      nodeMap.get(node.parentFolder_ID)?.children.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
};

export default function TestLab() {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [selectedSprint, setSelectedSprint] = useState("");
  const [folderSearch, setFolderSearch] = useState("");
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const loadAssignments = () => readTestLabStore();

  const fetchFolders = async () => {
    const res = await fetch(FOLDER_API);
    if (!res.ok) throw new Error();

    const data = await res.json();
    setFolders(data.value || []);
  };

  const fetchTestCases = async () => {
    const res = await fetch(TESTCASE_API);
    if (!res.ok) throw new Error();

    const data = await res.json();
    setTestCases(data.value || []);
  };

  const fetchTestSteps = async () => {
    const res = await fetch(TESTSTEP_API);
    if (!res.ok) throw new Error();

    const data = await res.json();
    setTestSteps(data.value || []);
  };

  const fetchSprints = async () => {
    const activeProjectId =
      typeof window !== "undefined" ? window.localStorage.getItem("projectId") || "" : "";
    const url = activeProjectId
      ? `${SPRINT_API}?$filter=project_ID eq '${activeProjectId}'`
      : SPRINT_API;

    const res = await fetch(url);
    if (!res.ok) throw new Error();

    const data = await res.json();
    const nextSprints = data.value || [];
    setSprints(nextSprints);

    setSelectedSprint((current) => {
      if (current && nextSprints.some((sprint: Sprint) => sprint.ID === current)) {
        return current;
      }

      return nextSprints[0]?.ID || "";
    });
  };

  const loadPageData = async () => {
    setPageLoading(true);

    try {
      await Promise.all([
        fetchFolders(),
        fetchTestCases(),
        fetchTestSteps(),
        fetchSprints(),
      ]);
    } catch {
      toast.error("Failed to load Test Lab data");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    void loadPageData();
    // Initial page hydration only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const folderTree = useMemo(() => buildTree(folders), [folders]);
  const testCasesByFolder = useMemo(
    () =>
      testCases.reduce<Record<string, TestCase[]>>((acc, testCase) => {
        acc[testCase.folder_ID] = [...(acc[testCase.folder_ID] || []), testCase];
        return acc;
      }, {}),
    [testCases],
  );
  const filteredTree = useMemo(
    () => getVisibleTree(folderTree, folderSearch, testCasesByFolder),
    [folderSearch, folderTree, testCasesByFolder],
  );
  const testStepsByTestCase = useMemo(
    () =>
      testSteps.reduce<Record<string, TestStep[]>>((acc, testStep) => {
        acc[testStep.testCase_ID] = [...(acc[testStep.testCase_ID] || []), testStep].sort(
          (a, b) => a.stepNumber - b.stepNumber,
        );
        return acc;
      }, {}),
    [testSteps],
  );

  const assignedFolderIds = useMemo(() => {
    if (!selectedSprint) return [];
    return loadAssignments().sprintAssignments?.[selectedSprint] || [];
  }, [selectedSprint, folders, sprints]);

  const assignedTree = useMemo(
    () => buildAssignedTree(folders, assignedFolderIds, testCases),
    [assignedFolderIds, folders, testCases],
  );

  const handleAssignFolder = async (folderId: string) => {
    if (!selectedSprint) {
      toast.error("Select a sprint first");
      return;
    }

    setAssignmentSaving(true);

    try {
      const store = loadAssignments();
      const currentAssignments = store.sprintAssignments?.[selectedSprint] || [];

      if (currentAssignments.includes(folderId)) {
        toast.info("Folder is already in the right tree");
        return;
      }

      writeTestLabStore({
        ...store,
        sprintAssignments: {
          ...(store.sprintAssignments || {}),
          [selectedSprint]: [...currentAssignments, folderId],
        },
      });

      await loadPageData();
      toast.success("Folder added to the sprint tree");
    } catch {
      toast.error("Failed to assign folder");
    } finally {
      setAssignmentSaving(false);
      setDraggingFolderId(null);
    }
  };

  const handleUnassignFolder = async (folderId: string) => {
    if (!selectedSprint) return;

    setAssignmentSaving(true);

    try {
      const store = loadAssignments();
      const currentAssignments = store.sprintAssignments?.[selectedSprint] || [];

      writeTestLabStore({
        ...store,
        sprintAssignments: {
          ...(store.sprintAssignments || {}),
          [selectedSprint]: currentAssignments.filter((id) => id !== folderId),
        },
      });

      await loadPageData();
      toast.success("Folder removed from the sprint tree");
    } catch {
      toast.error("Failed to remove folder");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId: string) => {
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("Delete this test case and its test steps?");

    if (!confirmed) return;

    try {
      const relatedSteps = testStepsByTestCase[testCaseId] || [];

      await Promise.all(
        relatedSteps.map(async (testStep) => {
          const response = await fetch(`${TESTSTEP_API}('${testStep.ID}')`, {
            method: "DELETE",
          });

          if (!response.ok && response.status !== 204) {
            throw new Error();
          }
        }),
      );

      const response = await fetch(`${TESTCASE_API}('${testCaseId}')`, {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 204) {
        throw new Error();
      }

      await loadPageData();
      toast.success("Test case deleted");
    } catch {
      toast.error("Failed to delete test case");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading Test Lab...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              Sprint Selection
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprints.map((sprint) => (
                  <SelectItem key={sprint.ID} value={sprint.ID}>
                    {sprint.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-base font-semibold">
                  Left Tree
                </CardTitle>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={folderSearch}
                    onChange={(event) => setFolderSearch(event.target.value)}
                    placeholder="Search folders"
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="min-h-[520px] p-4">
              {filteredTree.length ? (
                <div className="space-y-1">
                  {filteredTree.map((node) => (
                    <SourceTreeItem
                      key={node.ID}
                      node={node}
                      level={0}
                      testCasesByFolder={testCasesByFolder}
                      testStepsByTestCase={testStepsByTestCase}
                      onDeleteTestCase={handleDeleteTestCase}
                      searchTerm={folderSearch}
                      draggingId={draggingFolderId}
                      onDragStart={(folder) => setDraggingFolderId(folder.ID)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No folders found"
                  description="Try a different search term in the left tree."
                />
              )}
            </CardContent>
          </Card>

          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">
                Right Tree (Drop)
              </CardTitle>
            </CardHeader>
            <CardContent className="min-h-[520px] p-4">
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const folderId = event.dataTransfer.getData("text/plain");
                  if (folderId) {
                    void handleAssignFolder(folderId);
                  }
                }}
                className={`min-h-[488px] rounded-xl border border-dashed p-4 transition ${
                  selectedSprint
                    ? "border-slate-300 bg-white"
                    : "border-slate-200 bg-slate-100"
                }`}
              >
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <p className="text-sm text-slate-600">
                    {selectedSprint
                      ? "Drop folders here to build the sprint test lab tree."
                      : "Select a sprint before dropping folders."}
                  </p>
                  {assignmentSaving && (
                    <div className="inline-flex items-center gap-2 text-xs text-slate-500">
                      <Loader2 className="size-3 animate-spin" />
                      Saving...
                    </div>
                  )}
                </div>

                {assignedTree.length ? (
                  <div className="space-y-1">
                    {assignedTree.map((node) => (
                      <AssignedTreeItem
                        key={node.ID}
                        node={node}
                        level={0}
                        testStepsByTestCase={testStepsByTestCase}
                        onDeleteTestCase={handleDeleteTestCase}
                        onRemove={handleUnassignFolder}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No folders assigned"
                    description="Drag a folder from the left tree and drop it here."
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 text-center">
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function SourceTreeItem({
  node,
  level,
  testCasesByFolder,
  testStepsByTestCase,
  onDeleteTestCase,
  searchTerm,
  draggingId,
  onDragStart,
}: {
  node: FolderNode;
  level: number;
  testCasesByFolder: Record<string, TestCase[]>;
  testStepsByTestCase: Record<string, TestStep[]>;
  onDeleteTestCase: (testCaseId: string) => void | Promise<void>;
  searchTerm: string;
  draggingId: string | null;
  onDragStart: (folder: FolderNode) => void;
}) {
  const [open, setOpen] = useState(level === 0);
  const folderTestCases = testCasesByFolder[node.ID] || [];
  const hasChildren = Boolean(node.children?.length) || folderTestCases.length > 0;
  const isExpanded = open || Boolean(searchTerm);

  return (
    <div>
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", node.ID);
          onDragStart(node);
        }}
        onClick={() => {
          if (hasChildren) {
            setOpen((prev) => !prev);
          }
        }}
        className={`flex cursor-grab items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 ${
          draggingId === node.ID ? "opacity-60" : ""
        }`}
        style={{ marginLeft: level * 16 }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="size-4 text-slate-400" />
          ) : (
            <ChevronRight className="size-4 text-slate-400" />
          )
        ) : (
          <div className="size-4" />
        )}
        <Folder className="size-4 text-sky-600" />
        <span>{node.name}</span>
      </div>

      {isExpanded &&
        node.children?.map((child) => (
          <SourceTreeItem
            key={child.ID}
            node={child}
            level={level + 1}
            testCasesByFolder={testCasesByFolder}
            testStepsByTestCase={testStepsByTestCase}
            onDeleteTestCase={onDeleteTestCase}
            searchTerm={searchTerm}
            draggingId={draggingId}
            onDragStart={onDragStart}
          />
        ))}

      {isExpanded &&
        folderTestCases.map((testCase) => (
          <TreeTestCaseAccordion
            key={testCase.ID}
            testCase={testCase}
            testSteps={testStepsByTestCase[testCase.ID] || []}
            level={level}
            showExpectedResult={true}
            onDelete={() => void onDeleteTestCase(testCase.ID)}
          />
        ))}
    </div>
  );
}

function AssignedTreeItem({
  node,
  level,
  testStepsByTestCase,
  onDeleteTestCase,
  onRemove,
}: {
  node: AssignedTreeNode;
  level: number;
  testStepsByTestCase: Record<string, TestStep[]>;
  onDeleteTestCase: (testCaseId: string) => void | Promise<void>;
  onRemove: (folderId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children.length > 0 || node.testCases.length > 0;

  return (
    <div>
      <div
        className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-slate-50"
        style={{ marginLeft: level * 16 }}
      >
        <button
          type="button"
          onClick={() => hasChildren && setOpen((prev) => !prev)}
          className="flex flex-1 items-center gap-2 text-left text-sm text-slate-800"
        >
          {hasChildren ? (
            open ? (
              <ChevronDown className="size-4 text-slate-400" />
            ) : (
              <ChevronRight className="size-4 text-slate-400" />
            )
          ) : (
            <div className="size-4" />
          )}
          <Folder className="size-4 text-emerald-600" />
          <span className="font-medium">{node.name}</span>
        </button>

        <button
          type="button"
          onClick={() => void onRemove(node.ID)}
          className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Remove ${node.name}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {open && (
        <>
          {node.children.map((child) => (
            <AssignedTreeItem
              key={child.ID}
              node={child}
              level={level + 1}
              testStepsByTestCase={testStepsByTestCase}
              onDeleteTestCase={onDeleteTestCase}
              onRemove={onRemove}
            />
          ))}

          {node.testCases.map((testCase) => (
            <TreeTestCaseAccordion
              key={testCase.ID}
              testCase={testCase}
              testSteps={testStepsByTestCase[testCase.ID] || []}
              level={level}
              showExpectedResult={true}
              onDelete={() => void onDeleteTestCase(testCase.ID)}
            />
          ))}
        </>
      )}
    </div>
  );
}

function TreeTestCaseAccordion({
  testCase,
  testSteps,
  level,
  showExpectedResult,
  onDelete,
}: {
  testCase: TestCase;
  testSteps: TestStep[];
  level: number;
  showExpectedResult: boolean;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasSteps = testSteps.length > 0;

  return (
    <div>
      <div
        className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        style={{ marginLeft: (level + 1) * 16 + 20 }}
      >
        <button
          type="button"
          onClick={() => hasSteps && setOpen((prev) => !prev)}
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
        >
          {hasSteps ? (
            open ? (
              <ChevronDown className="mt-0.5 size-4 text-slate-400" />
            ) : (
              <ChevronRight className="mt-0.5 size-4 text-slate-400" />
            )
          ) : (
            <div className="size-4" />
          )}
          <FileText className="mt-0.5 size-4 text-slate-400" />
          <div className="min-w-0">
            <p className="truncate">{testCase.title}</p>
          </div>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          aria-label={`Delete ${testCase.title}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {open &&
        testSteps.map((testStep) => (
          <div
            key={testStep.ID}
            className="flex items-start gap-2 rounded-lg px-3 py-1.5 text-xs text-slate-500"
            style={{ marginLeft: (level + 2) * 16 + 32 }}
          >
            <div className="mt-1 size-1.5 rounded-full bg-slate-300" />
            <div className="min-w-0">
              <p className="truncate">
                Step {testStep.stepNumber}: {testStep.action}
              </p>
              {showExpectedResult ? (
                <p className="truncate text-[11px] text-slate-400">
                  {testStep.expectedResult}
                </p>
              ) : null}
            </div>
          </div>
        ))}
    </div>
  );
}
