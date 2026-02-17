import { useState, useEffect, useRef } from "react"
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Pencil,
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
  const [tree, setTree] = useState<FolderNode | null>(null)

 
  const buildTreeWithRoot = (data: FolderNode[]) => {
    const map: Record<string, FolderNode> = {}

    data.forEach((item) => {
      map[item.ID] = { ...item, children: [] }
    })

    const root: FolderNode = {
      ID: "root",
      name: "Test Library",
      description: "",
      parentFolder_ID: null,
      children: [],
    }

    data.forEach((item) => {
      if (item.parentFolder_ID) {
        map[item.parentFolder_ID]?.children?.push(map[item.ID])
      } else {
        root.children?.push(map[item.ID])
      }
    })

    return root
  }

   
  const fetchFolders = async () => {
    try {
      const res = await fetch(API_URL)

      if (!res.ok) throw new Error()

      const data = await res.json()

      if (data?.value) {
        setTree(buildTreeWithRoot(data.value))
      }
    } catch {
      toast.error("Failed to fetch folders")
    }
  }

  useEffect(() => {
    fetchFolders()
  }, [])

 
  const addFolder = async (parentId: string) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Folder",
          description: "",
          parentFolder_ID: parentId === "root" ? null : parentId,
        }),
      })

      if (!res.ok) throw new Error()

      toast.success("Folder created")
      fetchFolders()
    } catch {
      toast.error("Create failed")
    }
  }

  
  const deleteFolder = async (id: string) => {
    if (id === "root") return

    try {
      const res = await fetch(`${API_URL}('${id}')`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error()

      toast.success("Deleted successfully")
      fetchFolders()
    } catch {
      toast.error("Delete failed")
    }
  }

   
  const renameFolder = async (id: string, name: string) => {
    if (id === "root") return

    try {
      const res = await fetch(`${API_URL}('${id}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!res.ok) throw new Error()

      toast.success("Renamed successfully")
      fetchFolders()
    } catch {
      toast.error("Rename failed")
    }
  }

  return (
    <div style={{ padding: 20 }}>
      {tree && (
        <TreeItem
          node={tree}
          level={0}
          addFolder={addFolder}
          deleteFolder={deleteFolder}
          renameFolder={renameFolder}
        />
      )}
    </div>
  )
}

 

function TreeItem({
  node,
  level,
  addFolder,
  deleteFolder,
  renameFolder,
}: {
  node: FolderNode
  level: number
  addFolder: (parentId: string) => void
  deleteFolder: (id: string) => void
  renameFolder: (id: string, name: string) => void
}) {
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(node.name)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const handleRename = () => {
    if (!value.trim()) return
    renameFolder(node.ID, value.trim())
    setEditing(false)
  }

  const isRoot = node.ID === "root"

  return (
    <div>
      <div
        style={{
          marginLeft: level * 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 0",
        }}
      >
        <span
          onClick={() => setOpen(!open)}
          style={{ cursor: "pointer" }}
        >
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </span>

        {open ? <FolderOpen size={20} /> : <Folder size={20} />}

        {editing && !isRoot ? (
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename()
              if (e.key === "Escape") setEditing(false)
            }}
          />
        ) : (
          <span style={{ fontWeight: isRoot ? 700 : 500 }}>
            {node.name}
          </span>
        )}

        {!isRoot && (
          <>
            <Pencil
              size={16}
              style={{ cursor: "pointer" }}
              onClick={() => setEditing(true)}
            />
            <Trash2
              size={16}
              style={{ cursor: "pointer" }}
              onClick={() => deleteFolder(node.ID)}
            />
          </>
        )}

        <Plus
          size={16}
          style={{ cursor: "pointer" }}
          onClick={() => addFolder(node.ID)}
        />
      </div>

      {open &&
        node.children?.map((child) => (
          <TreeItem
            key={child.ID}
            node={child}
            level={level + 1}
            addFolder={addFolder}
            deleteFolder={deleteFolder}
            renameFolder={renameFolder}
          />
        ))}
    </div>
  )
}
