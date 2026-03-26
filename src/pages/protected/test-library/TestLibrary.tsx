"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

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

const FOLDER_API =
"http://72.61.244.79:4004/odata/v4/test-management/Folders";

const TESTCASE_API =
"http://72.61.244.79:4004/odata/v4/test-management/TestCases";

export default function TestLibrary() {

const [tree, setTree] = useState<FolderNode[]>([]);
const [selected, setSelected] = useState<FolderNode | null>(null);
const [testCases, setTestCases] = useState<TestCase[]>([]);
const [showModal, setShowModal] = useState(false);

const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

const [history, setHistory] = useState<FolderNode[]>([]);
const [future, setFuture] = useState<FolderNode[]>([]);

const [form, setForm] = useState({
title: "",
preconditions: "",
priority: "Medium",
});

const buildTree = (data: FolderNode[]) => {
const map: Record<string, FolderNode> = {};

data.forEach((item) => {
map[item.ID] = { ...item, children: [] };
});

const roots: FolderNode[] = [];

data.forEach((item) => {
if (item.parentFolder_ID) {
map[item.parentFolder_ID]?.children?.push(map[item.ID]);
} else {
roots.push(map[item.ID]);
}
});

return roots;
};

const fetchFolders = async () => {
const res = await fetch(FOLDER_API);
const data = await res.json();
setTree(buildTree(data.value));
};

const fetchTestCases = async (folderId: string) => {
const res = await fetch(
`${TESTCASE_API}?$filter=folder_ID eq '${folderId}'`
);
const data = await res.json();
setTestCases(data.value || []);
};

const fetchSingleTestCase = async (id: string) => {
try {
const res = await fetch(`${TESTCASE_API}('${id}')`);
const data = await res.json();

setEditingTestCase(data);

setForm({
title: data.title || "",
preconditions: data.preconditions || "",
priority: data.priority || "Medium",
});

setShowModal(true);

} catch {
toast.error("Failed to load test case");
}
};

useEffect(() => {
fetchFolders();
}, []);

const handleSelect = (folder: FolderNode) => {
if (selected) {
setHistory((prev) => [...prev, selected]);
setFuture([]);
}

setSelected(folder);

if (folder.children && folder.children.length > 0) {
setTestCases([]);
} else {
fetchTestCases(folder.ID);
}
};

const handleBack = () => {
if (!history.length) return;
const prev = history[history.length - 1];

setHistory((h) => h.slice(0, -1));
setFuture((f) => (selected ? [selected, ...f] : f));
setSelected(prev);

if (prev.children && prev.children.length > 0) {
setTestCases([]);
} else {
fetchTestCases(prev.ID);
}
};

const handleForward = () => {
if (!future.length) return;
const next = future[0];

setFuture((f) => f.slice(1));
setHistory((h) => (selected ? [...h, selected] : h));
setSelected(next);

if (next.children && next.children.length > 0) {
setTestCases([]);
} else {
fetchTestCases(next.ID);
}
};

const createFolder = async (parentId: string | null) => {
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
};

const deleteFolder = async (id: string) => {
await fetch(`${FOLDER_API}('${id}')`, { method: "DELETE" });

toast.success("Folder deleted");
fetchFolders();
};

const renameFolder = async (id: string, name: string) => {
await fetch(`${FOLDER_API}('${id}')`, {
method: "PATCH",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ name }),
});

toast.success("Folder renamed");
fetchFolders();
};

const handleCreateTestCase = async () => {
if (!selected || !form.title.trim()) {
toast.error("Title required");
return;
}

await fetch(TESTCASE_API, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
...form,
folder_ID: selected.ID,
}),
});

toast.success("Test case created");

setShowModal(false);
setForm({ title: "", preconditions: "", priority: "Medium" });

fetchTestCases(selected.ID);
};

const updateTestCase = async () => {
if (!editingTestCase) return;

await fetch(`${TESTCASE_API}('${editingTestCase.ID}')`, {
method: "PATCH",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(form),
});

toast.success("Test case updated");

setShowModal(false);
setEditingTestCase(null);
setForm({ title: "", preconditions: "", priority: "Medium" });

if (selected) fetchTestCases(selected.ID);
};

const deleteTestCase = async (id: string) => {
await fetch(`${TESTCASE_API}('${id}')`, {
method: "DELETE",
});

toast.success("Deleted");

if (selected) fetchTestCases(selected.ID);
};

const getPriorityStyle = (priority: string) => {
switch (priority) {
case "High":
return "bg-red-100 text-red-600";
case "Medium":
return "bg-yellow-100 text-yellow-700";
default:
return "bg-green-100 text-green-700";
}
};

return (

<div className="flex h-screen bg-gray-50 dark:bg-zinc-900">

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

{tree.map((node) => ( <TreeItem
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

<div className="flex-1 p-8 overflow-y-auto">

{selected &&
(!selected.children || selected.children.length === 0) && (
<>

<button
onClick={() => {
setEditingTestCase(null);
setForm({
title: "",
preconditions: "",
priority: "Medium",
});
setShowModal(true);
}}
className="mb-6 bg-black text-white px-5 py-2 rounded"

>

+ New Test Case

  </button>

<div className="grid gap-6 grid-cols-4">

{testCases.map((tc) => (

<div
key={tc.ID}
className="bg-white border rounded-xl p-6 flex flex-col justify-between"
>

<div>
<h3 className="font-semibold">{tc.title}</h3>

<p className="text-sm text-gray-500 mt-2">
{tc.preconditions}
</p>
</div>

<div className="flex justify-between mt-6">

<span className={`px-3 py-1 text-xs rounded ${getPriorityStyle(tc.priority)}`}>
{tc.priority} </span>

<div className="flex gap-3">

<Pencil
size={16}
className="cursor-pointer ml-2 mt-1"
onClick={() => fetchSingleTestCase(tc.ID)}
/>

<Trash2
size={16}
className="cursor-pointer text-red-500   mt-1"
onClick={() => deleteTestCase(tc.ID)}
/>

</div>
</div>

</div>

))}

</div>

</>
)}

</div>
</div>

{showModal && (

<div className="fixed inset-0 bg-black/40 flex items-center justify-center">

<div className="bg-white w-full max-w-md rounded-xl p-6">

<h3 className="font-semibold mb-4">
{editingTestCase ? "Edit Test Case" : "Create Test Case"}
</h3>

<input
placeholder="Title"
className="w-full border p-2 rounded mb-3"
value={form.title}
onChange={(e)=>setForm({...form,title:e.target.value})}
/>

<textarea
placeholder="Preconditions"
className="w-full border p-2 rounded mb-3"
value={form.preconditions}
onChange={(e)=>setForm({...form,preconditions:e.target.value})}
/>

<select
className="w-full border p-2 rounded mb-4"
value={form.priority}
onChange={(e)=>setForm({...form,priority:e.target.value})}
>

<option>Low</option>
<option>Medium</option>
<option>High</option>

</select>

<div className="flex justify-end gap-2">

<button
onClick={()=>setShowModal(false)}
className="px-4 py-2 border rounded"
>

Cancel
</button>

<button
onClick={editingTestCase ? updateTestCase : handleCreateTestCase}
className="px-4 py-2 bg-black text-white rounded"
>

{editingTestCase ? "Update" : "Create"}
</button>

</div>

</div>
</div>
)}

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
onClick={()=>{
setOpen(!open);
onSelect(node);
}}
>

{node.children && node.children.length > 0 ? (
open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>
) : (
<div style={{width:14}}/>
)}

<Folder size={16}/>
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
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        if (editName.trim() && editName !== node.name) {
          renameFolder(node.ID, editName);
        }
        setIsEditing(false);
      }
      if (e.key === "Escape") {
        setEditName(node.name);
        setIsEditing(false);
      }
    }}
    className="text-sm border rounded px-1 py-0.5 w-full bg-white dark:bg-zinc-800"
  />
) : (
  <span className="text-sm">{node.name}</span>
)}

<div className="hidden group-hover:flex gap-2 ml-auto items-center">

 <Plus
  size={14}
  onClick={(e)=>{
    e.stopPropagation();
    createFolder(node.ID);
  }}
/>

<Pencil
  size={14}
  onClick={(e)=>{
    e.stopPropagation();
    setIsEditing(true);
  }}
/>

<Trash2
  size={14}
  onClick={(e)=>{
    e.stopPropagation();
    deleteFolder(node.ID);
  }}
/>

</div>

</div>

{open && node.children?.map((child:any)=>(
<TreeItem
key={child.ID}
node={child}
level={level+1}
onSelect={onSelect}
createFolder={createFolder}
deleteFolder={deleteFolder}
renameFolder={renameFolder}
/>
))}

</div>
);
}
