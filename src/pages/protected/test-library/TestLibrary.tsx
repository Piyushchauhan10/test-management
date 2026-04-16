"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TestCaseManager from "./TestCaseManager";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type FolderNode = {
  ID: string;
  name: string;
  parentFolder_ID: string | null;
  children?: FolderNode[];
};

const FOLDER_API = "http://72.61.244.79:4004/odata/v4/test-management/Folders";

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
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [selected, setSelected] = useState<FolderNode | null>(null);
  const [history, setHistory] = useState<FolderNode[]>([]);
  const [future, setFuture] = useState<FolderNode[]>([]);
  const [treeSearch, setTreeSearch] = useState("");

  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch(FOLDER_API);
      if (!res.ok) throw new Error();

      const data = await res.json();
      const nextTree = buildTree(data.value || []);
      setTree(nextTree);

      setSelected((currentSelected) => {
        if (!currentSelected) return null;
        return flattenTree(nextTree).find((item) => item.ID === currentSelected.ID) ?? null;
      });
    } catch {
      toast.error("Failed to load folders");
    }
  }, []);

  useEffect(() => {
    void fetchFolders();
  }, [fetchFolders]);

  const allFolders = useMemo(() => flattenTree(tree), [tree]);
  const filteredTree = useMemo(() => filterTree(tree, treeSearch), [tree, treeSearch]);

  const selectedPath = useMemo(() => {
    if (!selected) return [];

    const byId = new Map(allFolders.map((folder) => [folder.ID, folder]));
    const path: FolderNode[] = [];
    let current: FolderNode | undefined = selected;

    while (current) {
      path.unshift(current);
      current = current.parentFolder_ID ? byId.get(current.parentFolder_ID) : undefined;
    }

    return path;
  }, [allFolders, selected]);

  const handleSelect = (folder: FolderNode) => {
    if (selected?.ID === folder.ID) return;

    setHistory((value) => (selected ? [...value, selected] : value));
    setFuture([]);
    setSelected(folder);
  };

  const handleBack = () => {
    if (!history.length) return;

    const previousFolder = history[history.length - 1];
    setHistory((value) => value.slice(0, -1));
    setFuture((value) => (selected ? [selected, ...value] : value));
    setSelected(previousFolder);
  };

  const handleForward = () => {
    if (!future.length) return;

    const nextFolder = future[0];
    setFuture((value) => value.slice(1));
    setHistory((value) => (selected ? [...value, selected] : value));
    setSelected(nextFolder);
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

      if (selected?.ID === folder.ID) {
        setSelected(null);
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

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-900 md:p-6">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Test Library</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage folders, test cases, and steps in one simple workspace.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <Card className="h-[calc(100vh)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-4 ">
              <CardTitle className="text-base">Folders</CardTitle>
              <Button size="icon-sm" onClick={() => void createFolder(null)}>
                <Plus className="size-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex h-[calc(100%-4.5rem)] flex-col gap-3 ">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={treeSearch}
                  onChange={(event) => setTreeSearch(event.target.value)}
                  placeholder="Search folders"
                  className="pl-9"
                />
              </div>

              <div className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-600 ">
                <span>{allFolders.length} folders</span>
                <span>{selected ? countNestedFolders(selected) : 0} nested</span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {filteredTree.length ? (
                  filteredTree.map((node) => (
                    <TreeItem
                      key={node.ID}
                      node={node}
                      level={0}
                      selectedId={selected?.ID ?? null}
                      searchTerm={treeSearch}
                      onSelect={handleSelect}
                      createFolder={createFolder}
                      deleteFolder={deleteFolder}
                      renameFolder={renameFolder}
                    />
                  ))
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-sm text-slate-500">
                    No folders found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex min-h-0 flex-col gap-4">
            <Card>
              <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon-sm" onClick={handleBack} disabled={!history.length}>
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
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {selected ? selected.name : "Select a folder"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {selectedPath.length
                        ? selectedPath.map((folder) => folder.name).join(" / ")
                        : "Choose a folder from the left to start."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 text-sm text-slate-600">
                  <div className="rounded-md border px-3 py-2">
                    Child folders: {selected?.children?.length ?? 0}
                  </div>
                  <div className="rounded-md border px-3 py-2">
                    Depth: {selectedPath.length || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="min-h-0 flex-1">
              <TestCaseManager selected={selected} selectedPath={selectedPath} />
            </div>
          </div>
        </div>
      </div>
    </div>
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
    <div className="mb-1" style={{ marginLeft: level * 10 }}>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-md px-2 py-2",
          isSelected ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50",
        )}
      >
        <button
          type="button"
          className="flex size-6 items-center justify-center rounded text-slate-500 hover:bg-white"
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
            <FolderOpen className="size-4 text-slate-500" />
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

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
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
