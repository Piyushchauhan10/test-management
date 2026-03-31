"use client";

import { useState, useEffect } from "react";
import TestCaseManager from "./TestCaseManager";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

type FolderNode = {
  ID: string;
  name: string;
  parentFolder_ID: string | null;
  children?: FolderNode[];
};

const FOLDER_API =
  "http://72.61.244.79:4004/odata/v4/test-management/Folders";

export default function TestLibrary() {
  const [tree, setTree] = useState<FolderNode[]>([]);
  const [selected, setSelected] = useState<FolderNode | null>(null);

  const [history, setHistory] = useState<FolderNode[]>([]);
  const [future, setFuture] = useState<FolderNode[]>([]);

  // 🔥 Build Tree (Optimized)
  const buildTree = (data: FolderNode[]) => {
    const map: Record<string, FolderNode> = {};
    const roots: FolderNode[] = [];

    data.forEach((item) => {
      map[item.ID] = { ...item, children: [] };
    });

    data.forEach((item) => {
      if (item.parentFolder_ID) {
        map[item.parentFolder_ID]?.children?.push(map[item.ID]);
      } else {
        roots.push(map[item.ID]);
      }
    });

    return roots;
  };

  // 🔥 Fetch Folders
  const fetchFolders = async () => {
    try {
      const res = await fetch(FOLDER_API);
      const data = await res.json();
      setTree(buildTree(data.value));
    } catch {
      toast.error("Failed to load folders");
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // 🔥 Folder Selection (ONLY RESPONSIBILITY)
  const handleSelect = (folder: FolderNode) => {
    if (selected) {
      setHistory((prev) => [...prev, selected]);
      setFuture([]);
    }

    setSelected(folder);
  };

  // 🔥 Navigation
  const handleBack = () => {
    if (!history.length) return;

    const prev = history[history.length - 1];

    setHistory((h) => h.slice(0, -1));
    setFuture((f) => (selected ? [selected, ...f] : f));
    setSelected(prev);
  };

  const handleForward = () => {
    if (!future.length) return;

    const next = future[0];

    setFuture((f) => f.slice(1));
    setHistory((h) => (selected ? [...h, selected] : h));
    setSelected(next);
  };

  // 🔥 Folder Actions
  const createFolder = async (parentId: string | null) => {
    try {
      await fetch(FOLDER_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Folder",
          parentFolder_ID: parentId,
        }),
      });

      toast.success("Folder created");
      fetchFolders();
    } catch {
      toast.error("Failed to create folder");
    }
  };

  const deleteFolder = async (id: string) => {
    if (!confirm("Delete this folder?")) return;

    try {
      await fetch(`${FOLDER_API}('${id}')`, {
        method: "DELETE",
      });

      toast.success("Folder deleted");
      fetchFolders();
    } catch {
      toast.error("Failed to delete folder");
    }
  };

  const renameFolder = async (id: string, name: string) => {
    try {
      await fetch(`${FOLDER_API}('${id}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      toast.success("Folder renamed");
      fetchFolders();
    } catch {
      toast.error("Rename failed");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-900">
      
      {/* 🔥 SIDEBAR */}
      <div className="w-72 border-r bg-white dark:bg-zinc-900">
        <div className="h-16 flex items-center px-6 border-b font-semibold">
          Test Library

          <Plus
            size={16}
            className="ml-auto cursor-pointer"
            onClick={() => createFolder(null)}
          />
        </div>

        <div className="p-2 overflow-y-auto">
          {tree.map((node) => (
            <TreeItem
              key={node.ID}
              node={node}
              level={0}
              onSelect={handleSelect}
              createFolder={createFolder}
              deleteFolder={deleteFolder}
              renameFolder={renameFolder}
            />
          ))}
        </div>
      </div>

      {/* 🔥 MAIN CONTENT */}
      <div className="flex-1 flex flex-col">

        {/* HEADER */}
        <div className="h-16 border-b px-6 flex items-center gap-3">
          <button onClick={handleBack} disabled={!history.length}>
            <ArrowLeft size={18} />
          </button>

          <button onClick={handleForward} disabled={!future.length}>
            <ArrowRight size={18} />
          </button>

          <h2 className="font-semibold">
            {selected ? selected.name : "Select Folder"}
          </h2>
        </div>

        {/* 🔥 IMPORTANT: Manager handles EVERYTHING */}
        <div className="flex-1 overflow-y-auto">
          <TestCaseManager selected={selected} />
        </div>
      </div>
    </div>
  );
}

function TreeItem({
  node,
  level,
  onSelect,
  createFolder,
  deleteFolder,
  renameFolder,
}: any) {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);

  return (
    <div>
      <div
        className="group flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 cursor-pointer"
        style={{ marginLeft: level * 14 }}
        onClick={() => {
          setOpen(!open);
          onSelect(node);
        }}
      >
        {node.children?.length ? (
          open ? <ChevronDown size={14} /> : <ChevronRight size={14} />
        ) : (
          <div style={{ width: 14 }} />
        )}

        <Folder size={16} />

        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              if (editName.trim() && editName !== node.name) {
                renameFolder(node.ID, editName);
              }
              setIsEditing(false);
            }}
            className="text-sm border rounded px-1 py-0.5 w-full"
          />
        ) : (
          <span className="text-sm">{node.name}</span>
        )}

        <div className="hidden group-hover:flex gap-2 ml-auto">
          <Plus
            size={14}
            onClick={(e) => {
              e.stopPropagation();
              createFolder(node.ID);
            }}
          />

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            ✏️
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteFolder(node.ID);
            }}
          >
            🗑️
          </button>
        </div>
      </div>

      {open &&
        node.children?.map((child: any) => (
          <TreeItem
            key={child.ID}
            node={child}
            level={level + 1}
            onSelect={onSelect}
            createFolder={createFolder}
            deleteFolder={deleteFolder}
            renameFolder={renameFolder}
          />
        ))}
    </div>
  );
}