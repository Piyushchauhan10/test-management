"use client"

import { useState, useEffect, useRef } from "react"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"

type FolderNode = {
  ID: string
  name: string
  description: string
  parentFolder_ID: string | null
  children?: FolderNode[]
}

const API_URL =
  "http://72.61.244.79:4004/odata/v4/test-management/Folders"

export default function TestLibrary() {
  const [tree, setTree] = useState<FolderNode[]>([])
  const [selected, setSelected] = useState<FolderNode | null>(null)
  const [history, setHistory] = useState<FolderNode[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const buildTree = (data: FolderNode[]) => {
    const map: Record<string, FolderNode> = {}
    data.forEach((item) => {
      map[item.ID] = { ...item, children: [] }
    })

    const roots: FolderNode[] = []
    data.forEach((item) => {
      if (item.parentFolder_ID) {
        map[item.parentFolder_ID]?.children?.push(map[item.ID])
      } else {
        roots.push(map[item.ID])
      }
    })
    return roots
  }

  const fetchFolders = async () => {
    try {
      const res = await fetch(API_URL)
      const data = await res.json()
      if (data?.value) setTree(buildTree(data.value))
    } catch {
      toast.error("Failed to fetch folders")
    }
  }

  useEffect(() => {
    fetchFolders()
  }, [])

  const navigateTo = (folder: FolderNode) => {
    const newHistory = history.slice(0, currentIndex + 1)
    newHistory.push(folder)
    setHistory(newHistory)
    setCurrentIndex(newHistory.length - 1)
    setSelected(folder)
  }

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setSelected(history[currentIndex - 1])
    }
  }

  const goForward = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setSelected(history[currentIndex + 1])
    }
  }

  const addFolder = async (parentId: string | null) => {
    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Folder",
          description: "",
          parentFolder_ID: parentId,
        }),
      })
      toast.success("Folder created")
      fetchFolders()
    } catch {
      toast.error("Create failed")
    }
  }

  const deleteFolder = async (id: string) => {
    try {
      await fetch(`${API_URL}('${id}')`, {
        method: "DELETE",
      })
      toast.success("Deleted successfully")
      fetchFolders()
      setSelected(null)
    } catch {
      toast.error("Delete failed")
    }
  }

  const renameFolder = async (id: string, name: string) => {
    try {
      await fetch(`${API_URL}('${id}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      toast.success("Renamed successfully")
      fetchFolders()
    } catch {
      toast.error("Rename failed")
    }
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "Inter, sans-serif",
        background: "#f9fafb",
      }}
    >
    
      <div
        style={{
          width: 310,
          borderRight: "1px solid #e5e7eb",
          padding: 20,
          background: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ fontWeight: 600 }}>Test Library</h3>

          <button onClick={() => addFolder(null)} style={iconButton}>
            <Plus size={16} />
          </button>
        </div>

        {tree.map((node) => (
          <TreeItem
            key={node.ID}
            node={node}
            level={0}
            selected={selected}
            onSelect={navigateTo}
            addFolder={addFolder}
            deleteFolder={deleteFolder}
            renameFolder={renameFolder}
          />
        ))}
      </div>

      
      <div style={{ flex: 1, padding: 30 }}>
        {selected ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 25,
              }}
            >
              <button onClick={goBack} disabled={currentIndex <= 0} style={iconButton}>
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={goForward}
                disabled={currentIndex >= history.length - 1}
                style={iconButton}
              >
                <ArrowRight size={16} />
              </button>

              <h2 style={{ fontWeight: 600 }}>{selected.name}</h2>
            </div>

            <div style={gridContainer}>
              {selected.children?.length ? (
                selected.children.map((child) => (
                  <div
                    key={child.ID}
                    onClick={() => navigateTo(child)}
                    style={folderCard}
                  >
                    <Folder size={36} color="#2563eb" />
                    <span style={{ marginTop: 10 }}>{child.name}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#9ca3af" }}>No subfolders</p>
              )}
            </div>
          </>
        ) : (
          <div style={emptyState}>
            <Folder size={50} />
            <p style={{ marginTop: 10 }}>Select a folder</p>
          </div>
        )}
      </div>
    </div>
  )
}

function TreeItem({
  node,
  level,
  selected,
  onSelect,
  addFolder,
  deleteFolder,
  renameFolder,
}: any) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(node.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const isActive = selected?.ID === node.ID

  const handleRename = () => {
    if (!value.trim()) return
    renameFolder(node.ID, value.trim())
    setEditing(false)
  }

  return (
    <div>
      <div
        className="folder-row"
        style={{
          marginLeft: level * 18,
          display: "flex",
          alignItems: "center",
          padding: "6px 10px",
          borderRadius: 8,
          background: isActive ? "#e0f2fe" : "transparent",
          minHeight: 36,
        }}
      >
        <div
          onClick={() => setOpen(!open)}
          style={{ width: 20, display: "flex", justifyContent: "center" }}
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        <div style={{ width: 22 }}>
          {open ? (
            <FolderOpen size={18} color="#2563eb" />
          ) : (
            <Folder size={18} color="#2563eb" />
          )}
        </div>

        {editing ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleRename}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              padding: "2px 6px",
              fontSize: 13,
              flex: 1,
            }}
          />
        ) : (
          <div onClick={() => onSelect(node)} style={{ flex: 1 }}>
            {node.name}
          </div>
        )}

        <div className="actions">
          <Pencil size={14} onClick={() => setEditing(true)} />
          <Trash2 size={14} onClick={() => deleteFolder(node.ID)} />
          <Plus size={14} onClick={() => addFolder(node.ID)} />
        </div>
      </div>

      {open &&
        node.children?.map((child: any) => (
          <TreeItem
            key={child.ID}
            node={child}
            level={level + 1}
            selected={selected}
            onSelect={onSelect}
            addFolder={addFolder}
            deleteFolder={deleteFolder}
            renameFolder={renameFolder}
          />
        ))}

      <style>{`
        .folder-row:hover {
          background: #f3f4f6;
        }

        .actions {
          display: flex;
          gap: 8px;
          width: 70px;
          justify-content: flex-end;
          color: #9ca3af;
          visibility: hidden;
        }

        .folder-row:hover .actions {
          visibility: visible;
        }

        .actions svg:hover {
          color: #111827;
        }
      `}</style>
    </div>
  )
}

const iconButton = {
  height: 32,
  width: 32,
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
}

const gridContainer = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 20,
}

const folderCard = {
  width: 150,
  height: 120,
  border: "1px solid #e5e7eb",
  borderRadius: 14,
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  background: "#ffffff",
}

const emptyState = {
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
  flexDirection: "column" as const,
}