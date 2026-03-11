"use client"

import { useState, useEffect } from "react"
import {
  Folder,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  ArrowRight,
  X,
} from "lucide-react"
import { toast } from "sonner"

type FolderNode = {
  ID: string
  name: string
  parentFolder_ID: string | null
  children?: FolderNode[]
}

type TestCase = {
  ID: string
  title: string
  priority: string
  preconditions?: string
}

const FOLDER_API =
  "http://72.61.244.79:4004/odata/v4/test-management/Folders"

const TESTCASE_API =
  "http://72.61.244.79:4004/odata/v4/test-management/TestCases"

export default function TestLibrary() {
  const [tree, setTree] = useState<FolderNode[]>([])
  const [selected, setSelected] = useState<FolderNode | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [showModal, setShowModal] = useState(false)

  const [history, setHistory] = useState<FolderNode[]>([])
  const [future, setFuture] = useState<FolderNode[]>([])

  const [form, setForm] = useState({
    title: "",
    preconditions: "",
    priority: "Medium",
  })

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
    const res = await fetch(FOLDER_API)
    const data = await res.json()
    setTree(buildTree(data.value))
  }

  const fetchTestCases = async (folderId: string) => {
    const res = await fetch(
      `${TESTCASE_API}?$filter=folder_ID eq '${folderId}'`
    )
    const data = await res.json()
    setTestCases(data.value || [])
  }

  useEffect(() => {
    fetchFolders()
  }, [])

  const handleSelect = (folder: FolderNode) => {
    if (selected) {
      setHistory((prev) => [...prev, selected])
      setFuture([])
    }

    setSelected(folder)

    if (folder.children && folder.children.length > 0) {
      setTestCases([])
    } else {
      fetchTestCases(folder.ID)
    }
  }

  const handleBack = () => {
    if (!history.length) return
    const prev = history[history.length - 1]

    setHistory((h) => h.slice(0, -1))
    setFuture((f) => (selected ? [selected, ...f] : f))
    setSelected(prev)

    if (prev.children && prev.children.length > 0) {
      setTestCases([])
    } else {
      fetchTestCases(prev.ID)
    }
  }

  const handleForward = () => {
    if (!future.length) return
    const next = future[0]

    setFuture((f) => f.slice(1))
    setHistory((h) => (selected ? [...h, selected] : h))
    setSelected(next)

    if (next.children && next.children.length > 0) {
      setTestCases([])
    } else {
      fetchTestCases(next.ID)
    }
  }

  const createFolder = async (parentId: string | null) => {
    await fetch(FOLDER_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Folder",
        parentFolder_ID: parentId,
      }),
    })

    toast.success("Folder created")
    fetchFolders()
  }

  const deleteFolder = async (id: string) => {
    await fetch(`${FOLDER_API}('${id}')`, { method: "DELETE" })

    toast.success("Folder deleted")
    fetchFolders()
  }

  const renameFolder = async (id: string, name: string) => {
    await fetch(`${FOLDER_API}('${id}')`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    })

    toast.success("Folder renamed")
    fetchFolders()
  }

  const handleCreateTestCase = async () => {
    if (!selected || !form.title.trim()) {
      toast.error("Title required")
      return
    }

    await fetch(TESTCASE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        folder_ID: selected.ID,
      }),
    })

    toast.success("Test case created")

    setShowModal(false)

    setForm({
      title: "",
      preconditions: "",
      priority: "Medium",
    })

    fetchTestCases(selected.ID)
  }

  const deleteTestCase = async (id: string) => {
    await fetch(`${TESTCASE_API}('${id}')`, {
      method: "DELETE",
    })

    toast.success("Deleted")

    if (selected) fetchTestCases(selected.ID)
  }

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300"
      case "Medium":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
      default:
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100">

      <div className="w-64 sm:w-72 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 flex flex-col">

        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-zinc-700 font-semibold">
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

      <div className="flex-1 flex flex-col">

        <div className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700 px-4 sm:px-8 flex items-center gap-3">

          <button onClick={handleBack} disabled={!history.length}>
            <ArrowLeft size={18} />
          </button>

          <button onClick={handleForward} disabled={!future.length}>
            <ArrowRight size={18} />
          </button>

          <h2 className="font-semibold text-lg">
            {selected ? selected.name : "Select Folder"}
          </h2>

        </div>

        <div className="flex-1 p-4 sm:p-8 overflow-y-auto">

          {selected &&
            selected.children &&
            selected.children.length > 0 && (

              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {selected.children.map((child) => (
                  <div
                    key={child.ID}
                    onClick={() => handleSelect(child)}
                    className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 hover:shadow-md transition cursor-pointer"
                  >
                    <Folder size={28} />

                    <p className="mt-3 text-sm font-medium">
                      {child.name}
                    </p>

                  </div>
                ))}

              </div>

            )}

          {selected &&
            (!selected.children ||
              selected.children.length === 0) && (

              <>

                <button
                  onClick={() => setShowModal(true)}
                  className="mb-6 bg-black dark:bg-white dark:text-black text-white px-5 py-2.5 rounded-md text-sm"
                >
                  + New Test Case
                </button>

                {testCases.length === 0 ? (
                  <div className="text-gray-400 mt-6">
                    No test cases available
                  </div>
                ) : (

                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                    {testCases.map((tc) => (

                      <div
                        key={tc.ID}
                        className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl p-6 flex flex-col justify-between hover:shadow-md transition"
                      >

                        <div>
                          <h3 className="font-semibold text-base truncate">
                            {tc.title}
                          </h3>

                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                            {tc.preconditions}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-6">

                          <span
                            className={`px-3 py-1 text-xs rounded-full font-medium ${getPriorityStyle(
                              tc.priority
                            )}`}
                          >
                            {tc.priority}
                          </span>

                          <Trash2
                            size={16}
                            className="cursor-pointer text-gray-400 hover:text-red-500"
                            onClick={() => deleteTestCase(tc.ID)}
                          />

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </>
            )}

        </div>

      </div>

      {showModal && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl p-6 border border-gray-200 dark:border-zinc-700">

            <div className="flex justify-between items-center mb-4">

              <h3 className="font-semibold">
                Create Test Case
              </h3>

              <X
                size={16}
                className="cursor-pointer"
                onClick={() => setShowModal(false)}
              />

            </div>

            <input
              placeholder="Title"
              className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 rounded mb-3"
              value={form.title}
              onChange={(e) =>
                setForm({ ...form, title: e.target.value })
              }
            />

            <textarea
              placeholder="Preconditions"
              className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 rounded mb-3"
              value={form.preconditions}
              onChange={(e) =>
                setForm({
                  ...form,
                  preconditions: e.target.value,
                })
              }
            />

            <select
              className="w-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2 rounded mb-4"
              value={form.priority}
              onChange={(e) =>
                setForm({
                  ...form,
                  priority: e.target.value,
                })
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-gray-200 dark:border-zinc-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleCreateTestCase}
                className="px-4 py-2 bg-black dark:bg-white dark:text-black text-white rounded"
              >
                Create
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}

function TreeItem({
  node,
  level,
  onSelect,
  createFolder,
  deleteFolder,
  renameFolder,
}: any) {

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(node.name)

  return (
    <div>

      <div
        className="group flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
        style={{ marginLeft: level * 14 }}
        onClick={() => {
          setOpen(!open)
          onSelect(node)
        }}
      >

        {node.children && node.children.length > 0
          ? open
            ? <ChevronDown size={14} />
            : <ChevronRight size={14} />
          : <div style={{ width: 14 }} />}

        <Folder size={16} />

        {editing ? (
          <input
            className="flex-1 text-sm border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 rounded"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => {
              renameFolder(node.ID, value)
              setEditing(false)
            }}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <span className="text-sm gap-10 ">
            {node.name}
          </span>
        )}

        <div className="  items-left hidden group-hover:flex gap-2 text-gray-400">

          <Plus
            size={14}
            onClick={(e) => {
              e.stopPropagation()
              createFolder(node.ID)
            }}
          />

          <Pencil
            size={14}
            onClick={(e) => {
              e.stopPropagation()
              setEditing(true)
            }}
          />

          <Trash2
            size={14}
            onClick={(e) => {
              e.stopPropagation()
              deleteFolder(node.ID)
            }}
          />

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
  )
}