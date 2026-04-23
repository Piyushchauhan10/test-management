"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderTree,
  FlaskConical,
  Loader2,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const TESTLAB_STORAGE_KEY = "testlab_local_data_v1";

type FolderNode = {
  ID: string;
  name: string;
  parentFolder_ID: string | null;
  testCycle_ID?: string | null;
  children?: FolderNode[];
};

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
  sprint_ID: string;
};

type TestCase = {
  ID: string;
  title: string;
  priority?: string;
  preconditions?: string;
  folder_ID: string;
};

type TestLabStore = {
  folders: FolderNode[];
  projects: Project[];
  sprints: Sprint[];
  cycles: TestCycle[];
  testCases: TestCase[];
};

const defaultTestLabStore: TestLabStore = {
  projects: [
    { ID: "project-1", name: "Website Revamp" },
    { ID: "project-2", name: "Mobile App QA" },
  ],
  sprints: [
    { ID: "sprint-1", name: "Sprint 1", project_ID: "project-1" },
    { ID: "sprint-2", name: "Sprint 2", project_ID: "project-1" },
    { ID: "sprint-3", name: "Regression Sprint", project_ID: "project-2" },
  ],
  cycles: [
    { ID: "cycle-1", name: "Smoke Cycle", sprint_ID: "sprint-1" },
    { ID: "cycle-2", name: "Regression Cycle", sprint_ID: "sprint-2" },
    { ID: "cycle-3", name: "Android Cycle", sprint_ID: "sprint-3" },
  ],
  folders: [
    {
      ID: "folder-1",
      name: "Authentication",
      parentFolder_ID: null,
      testCycle_ID: "cycle-1",
    },
    {
      ID: "folder-2",
      name: "Login",
      parentFolder_ID: "folder-1",
      testCycle_ID: "cycle-1",
    },
    {
      ID: "folder-3",
      name: "Forgot Password",
      parentFolder_ID: "folder-1",
      testCycle_ID: null,
    },
    {
      ID: "folder-4",
      name: "Checkout",
      parentFolder_ID: null,
      testCycle_ID: "cycle-2",
    },
    {
      ID: "folder-5",
      name: "Payments",
      parentFolder_ID: "folder-4",
      testCycle_ID: "cycle-2",
    },
    {
      ID: "folder-6",
      name: "Profile",
      parentFolder_ID: null,
      testCycle_ID: "cycle-3",
    },
  ],
  testCases: [
    {
      ID: "tc-1",
      title: "User can log in with valid credentials",
      priority: "High",
      preconditions: "User account is active",
      folder_ID: "folder-2",
    },
    {
      ID: "tc-2",
      title: "User cannot log in with invalid password",
      priority: "Medium",
      preconditions: "User account exists",
      folder_ID: "folder-2",
    },
    {
      ID: "tc-3",
      title: "Forgot password sends reset email",
      priority: "High",
      preconditions: "Email inbox is reachable",
      folder_ID: "folder-3",
    },
    {
      ID: "tc-4",
      title: "Card payment completes checkout",
      priority: "High",
      preconditions: "Cart contains at least one item",
      folder_ID: "folder-5",
    },
    {
      ID: "tc-5",
      title: "Profile page loads saved details",
      priority: "Low",
      preconditions: "User is logged in",
      folder_ID: "folder-6",
    },
  ],
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
    return JSON.parse(saved) as TestLabStore;
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

const getVisibleTree = (nodes: FolderNode[], query: string): FolderNode[] => {
  if (!query.trim()) return nodes;

  const normalizedQuery = query.toLowerCase();

  return nodes.reduce<FolderNode[]>((acc, node) => {
    const visibleChildren = getVisibleTree(node.children || [], query);
    const matches = node.name.toLowerCase().includes(normalizedQuery);

    if (matches || visibleChildren.length) {
      acc.push({
        ...node,
        children: visibleChildren,
      });
    }

    return acc;
  }, []);
};

const priorityTone: Record<string, string> = {
  High: "bg-rose-100 text-rose-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

export default function TestLab() {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [assignedFolders, setAssignedFolders] = useState<FolderNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<FolderNode | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [cycles, setCycles] = useState<TestCycle[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [selectedSprint, setSelectedSprint] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("");

  const [folderSearch, setFolderSearch] = useState("");
  const [testCaseSearch, setTestCaseSearch] = useState("");

  const [pageLoading, setPageLoading] = useState(true);
  const [treeLoading, setTreeLoading] = useState(false);
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [testCaseLoading, setTestCaseLoading] = useState(false);
  const [draggingFolderId, setDraggingFolderId] = useState<string | null>(null);

  const fetchFolders = async () => {
    setTreeLoading(true);

    try {
      const store = readTestLabStore();
      const folderData = store.folders || [];

      setTree(buildTree(folderData));
    } catch {
      toast.error("Failed to load folders");
    } finally {
      setTreeLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const store = readTestLabStore();
      setProjects(store.projects || []);
    } catch {
      toast.error("Failed to load projects");
    }
  };

  const fetchSprints = async (projectId: string) => {
    try {
      const store = readTestLabStore();
      setSprints(
        (store.sprints || []).filter((sprint) => sprint.project_ID === projectId),
      );
    } catch {
      toast.error("Failed to load sprints");
    }
  };

  const fetchCycles = async (sprintId: string) => {
    try {
      const store = readTestLabStore();
      setCycles(
        (store.cycles || []).filter((cycle) => cycle.sprint_ID === sprintId),
      );
    } catch {
      toast.error("Failed to load test cycles");
    }
  };

  const fetchAssignedFolders = async (cycleId: string) => {
    try {
      const store = readTestLabStore();
      const nextFolders = (store.folders || []).filter(
        (folder) => folder.testCycle_ID === cycleId,
      );

      setAssignedFolders(nextFolders);

      if (!nextFolders.length) {
        setSelectedFolder(null);
        setTestCases([]);
        return;
      }

      const nextSelected =
        nextFolders.find(
          (folder: FolderNode) => folder.ID === selectedFolder?.ID,
        ) || nextFolders[0];

      setSelectedFolder(nextSelected);
      await fetchTestCases(nextSelected);
    } catch {
      toast.error("Failed to load assigned folders");
    }
  };

  const fetchTestCases = async (folder: FolderNode) => {
    setTestCaseLoading(true);

    try {
      const store = readTestLabStore();
      const nextTestCases = (store.testCases || []).filter(
        (testCase) => testCase.folder_ID === folder.ID,
      );
      setSelectedFolder(folder);
      setTestCases(nextTestCases);
    } catch {
      toast.error("Failed to load test cases");
    } finally {
      setTestCaseLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      await Promise.all([fetchFolders(), fetchProjects()]);
      setPageLoading(false);
    };

    load();
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setSprints([]);
      setCycles([]);
      setAssignedFolders([]);
      setSelectedSprint("");
      setSelectedCycle("");
      setSelectedFolder(null);
      setTestCases([]);
      return;
    }

    setSelectedSprint("");
    setSelectedCycle("");
    setCycles([]);
    setAssignedFolders([]);
    setSelectedFolder(null);
    setTestCases([]);
    fetchSprints(selectedProject);
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedSprint) {
      setCycles([]);
      setAssignedFolders([]);
      setSelectedCycle("");
      setSelectedFolder(null);
      setTestCases([]);
      return;
    }

    setSelectedCycle("");
    setAssignedFolders([]);
    setSelectedFolder(null);
    setTestCases([]);
    fetchCycles(selectedSprint);
  }, [selectedSprint]);

  useEffect(() => {
    if (!selectedCycle) {
      setAssignedFolders([]);
      setSelectedFolder(null);
      setTestCases([]);
      return;
    }

    fetchAssignedFolders(selectedCycle);
    // The selected cycle is the only trigger we want for the initial folder sync.
    // Refreshes after save/remove are handled explicitly by the action handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCycle]);

  const handleDragStart = (folder: FolderNode) => {
    setDraggingFolderId(folder.ID);
  };

  const handleTreeSelect = (folder: FolderNode) => {
    const isAssignedToSelectedCycle = assignedFolders.some(
      (assignedFolder) => assignedFolder.ID === folder.ID,
    );

    if (isAssignedToSelectedCycle) {
      void fetchTestCases(folder);
      return;
    }

    setSelectedFolder(folder);
    setTestCases([]);
  };

  const handleAssignFolder = async (folderId: string) => {
    if (!selectedCycle) {
      toast.error("Select a test cycle first");
      return;
    }

    setAssignmentSaving(true);

    try {
      const store = readTestLabStore();
      const folderExists = store.folders.some((folder) => folder.ID === folderId);

      if (!folderExists) {
        throw new Error();
      }

      const nextFolders = store.folders.map((folder) =>
        folder.ID === folderId
          ? { ...folder, testCycle_ID: selectedCycle }
          : folder,
      );

      writeTestLabStore({ ...store, folders: nextFolders });
      await Promise.all([fetchFolders(), fetchAssignedFolders(selectedCycle)]);
      toast.success("Folder added to the right panel");
    } catch {
      toast.error("Failed to assign folder");
    } finally {
      setAssignmentSaving(false);
      setDraggingFolderId(null);
    }
  };

  const handleUnassignFolder = async (folderId: string) => {
    if (!selectedCycle) return;

    setAssignmentSaving(true);

    try {
      const store = readTestLabStore();
      const nextFolders = store.folders.map((folder) =>
        folder.ID === folderId ? { ...folder, testCycle_ID: null } : folder,
      );

      writeTestLabStore({ ...store, folders: nextFolders });
      await Promise.all([fetchFolders(), fetchAssignedFolders(selectedCycle)]);
      toast.success("Folder removed from the right panel");
    } catch {
      toast.error("Failed to remove folder");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const filteredTree = getVisibleTree(tree, folderSearch);

  const filteredTestCases = testCases.filter((testCase) => {
    if (!testCaseSearch.trim()) return true;

    const query = testCaseSearch.toLowerCase();
    return (
      testCase.title.toLowerCase().includes(query) ||
      (testCase.preconditions || "").toLowerCase().includes(query) ||
      (testCase.priority || "").toLowerCase().includes(query)
    );
  });

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,0.85)_100%)] p-4 md:p-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader className="gap-3 border-b">
              <div className="space-y-1">
                <CardTitle>Folder Library</CardTitle>
                <CardDescription>
                  Select a project, sprint, and cycle, then click an assigned
                  folder to load its test cases.
                </CardDescription>
              </div>

              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <Input
                  value={folderSearch}
                  onChange={(event) => setFolderSearch(event.target.value)}
                  placeholder="Search folders"
                  className="pl-9"
                />
              </div>
            </CardHeader>

            <CardContent className="p-3">
              <div className="max-h-[720px] overflow-y-auto pr-1">
                {treeLoading ? (
                  <EmptyState
                    icon={<Loader2 className="size-5 animate-spin" />}
                    title="Loading folders"
                    description="Fetching the latest folder tree from the backend."
                  />
                ) : filteredTree.length ? (
                  <div className="space-y-1">
                    {filteredTree.map((node) => (
                      <TreeItem
                        key={node.ID}
                        node={node}
                        level={0}
                        activeId={selectedFolder?.ID || null}
                        draggingId={draggingFolderId}
                        onDragStart={handleDragStart}
                        onSelect={handleTreeSelect}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Search className="size-5" />}
                    title="No folders found"
                    description="Try a different search term to find the folder you want."
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader className="gap-3">
                <CardTitle>Workspace Filters</CardTitle>
                <CardDescription>
                  Pick a project, sprint, and cycle before dropping folders into
                  the execution plan.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FilterSelect
                  placeholder="Choose project"
                  value={selectedProject}
                  onValueChange={setSelectedProject}
                  options={projects}
                />
                <FilterSelect
                  placeholder="Choose sprint"
                  value={selectedSprint}
                  onValueChange={setSelectedSprint}
                  options={sprints}
                  disabled={!selectedProject}
                />
                <FilterSelect
                  placeholder="Choose test cycle"
                  value={selectedCycle}
                  onValueChange={setSelectedCycle}
                  options={cycles}
                  disabled={!selectedSprint}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader className="gap-3 border-b">
                <CardTitle>Dropped Folders</CardTitle>
                <CardDescription>
                  Drag folders from the left list and drop them here to show
                  them in this panel.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const folderId = event.dataTransfer.getData("text/plain");
                    if (folderId) {
                      void handleAssignFolder(folderId);
                    }
                  }}
                  className={`rounded-2xl border border-dashed p-5 transition ${
                    selectedCycle
                      ? "border-sky-200 bg-sky-50/60"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">
                        Drop zone
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedCycle
                          ? "Drop a folder here and it will appear below."
                          : "Choose a test cycle first, then drag a folder here."}
                      </p>
                    </div>

                    {assignmentSaving && (
                      <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm">
                        <Loader2 className="size-3 animate-spin" />
                        Saving...
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {assignedFolders.length ? (
                      assignedFolders.map((folder) => (
                        <button
                          key={folder.ID}
                          type="button"
                          onClick={() => void fetchTestCases(folder)}
                          className={`group rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                            selectedFolder?.ID === folder.ID
                              ? "border-sky-400 ring-2 ring-sky-100"
                              : "border-slate-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl bg-sky-100 p-2 text-sky-700">
                                <Folder className="size-4" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {folder.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Click to load test cases
                                </p>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-70 transition group-hover:opacity-100"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleUnassignFolder(folder.ID);
                              }}
                            >
                              <Trash2 className="size-4 text-rose-600" />
                            </Button>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="md:col-span-2">
                        <EmptyState
                          icon={<FolderTree className="size-5" />}
                          title="No folders dropped yet"
                          description="Pick a folder from the left side and drag it into this drop zone."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/70 shadow-sm">
              <CardHeader className="gap-4 border-b">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {selectedFolder
                        ? `Test Cases for ${selectedFolder.name}`
                        : "Test Cases"}
                    </CardTitle>
                    <CardDescription>
                      Review test coverage for the selected folder saved inside
                      the active cycle.
                    </CardDescription>
                  </div>

                  <div className="relative w-full lg:max-w-sm">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                    <Input
                      value={testCaseSearch}
                      onChange={(event) =>
                        setTestCaseSearch(event.target.value)
                      }
                      placeholder="Search title, priority, or preconditions"
                      className="pl-9"
                      disabled={!selectedFolder}
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {!selectedFolder ? (
                  <div className="p-6">
                    <EmptyState
                      icon={<FlaskConical className="size-5" />}
                      title="Pick an assigned folder"
                      description="Once you choose a folder from the execution board, its test cases will load here from the backend."
                    />
                  </div>
                ) : testCaseLoading ? (
                  <div className="flex min-h-64 items-center justify-center">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Loading test cases...
                    </div>
                  </div>
                ) : filteredTestCases.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="px-6">Title</TableHead>
                        <TableHead>Preconditions</TableHead>
                        <TableHead>Priority</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTestCases.map((testCase) => (
                        <TableRow key={testCase.ID}>
                          <TableCell className="px-6 py-4 font-medium text-slate-900">
                            {testCase.title}
                          </TableCell>
                          <TableCell className="py-4 whitespace-normal text-muted-foreground">
                            {testCase.preconditions || "-"}
                          </TableCell>
                          <TableCell className="py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                priorityTone[testCase.priority || ""] ||
                                "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {testCase.priority || "Unspecified"}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-6">
                    <EmptyState
                      icon={<Search className="size-5" />}
                      title="No matching test cases"
                      description="This folder has no test cases for the current search, or the backend returned an empty result."
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ ID: string; name: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.ID} value={option.ID}>
            {option.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-8 text-center">
      <div className="mb-3 rounded-full bg-white p-3 text-slate-600 shadow-sm">
        {icon}
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function TreeItem({
  node,
  level,
  activeId,
  draggingId,
  onDragStart,
  onSelect,
}: {
  node: FolderNode;
  level: number;
  activeId: string | null;
  draggingId: string | null;
  onDragStart: (folder: FolderNode) => void;
  onSelect: (folder: FolderNode) => void;
}) {
  const [open, setOpen] = useState(level === 0);

  return (
    <div>
      <div
        draggable
        onDragStart={(event) => {
          event.dataTransfer.setData("text/plain", node.ID);
          onDragStart(node);
        }}
        onClick={() => {
          if (node.children?.length) {
            setOpen((prev) => !prev);
          }

          onSelect(node);
        }}
        className={`group flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 transition ${
          activeId === node.ID
            ? "bg-sky-50 text-sky-900"
            : "text-slate-700 hover:bg-slate-100"
        } ${draggingId === node.ID ? "opacity-60" : ""}`}
        style={{ marginLeft: level * 14 }}
      >
        {node.children?.length ? (
          open ? (
            <ChevronDown className="size-4 text-slate-400" />
          ) : (
            <ChevronRight className="size-4 text-slate-400" />
          )
        ) : (
          <div className="size-4" />
        )}

        <Folder className="size-4 text-sky-600" />
        <span className="truncate text-sm font-medium">{node.name}</span>
      </div>

      {open &&
        node.children?.map((child) => (
          <TreeItem
            key={child.ID}
            node={child}
            level={level + 1}
            activeId={activeId}
            draggingId={draggingId}
            onDragStart={onDragStart}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
