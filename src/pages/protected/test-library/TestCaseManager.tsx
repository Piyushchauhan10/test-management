"use client";

import { useState, useEffect, useMemo } from "react";
import { Pencil, Trash2, Plus, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

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

const TESTCASE_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestCases`;
const TESTSTEP_API = `${import.meta.env.VITE_BACKEND_API_URL}/TestSteps`;

export default function TestCaseManager({ selected }: any) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [steps, setSteps] = useState<TestStep[]>([]);

  const [loading, setLoading] = useState(false);
  const [stepsLoading, setStepsLoading] = useState(false);

  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [editingStepId, setEditingStepId] = useState<string | null>(null);

  const [showStepForm, setShowStepForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    preconditions: "",
    priority: "Medium",
  });

  const [stepForm, setStepForm] = useState({
    action: "",
    expectedResult: "",
  });

  const [editStepForm, setEditStepForm] = useState({
    action: "",
    expectedResult: "",
  });

  // ================= FETCH =================

  const fetchTestCases = async (folderId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${TESTCASE_API}?$filter=folder_ID eq '${folderId}'`,
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setTestCases(data.value || []);
    } catch {
      toast.error("Failed to fetch test cases");
    } finally {
      setLoading(false);
    }
  };

  const fetchSteps = async (testCaseId: string) => {
    setStepsLoading(true);
    try {
      const res = await fetch(
        `${TESTSTEP_API}?$filter=testCase_ID eq '${testCaseId}'`,
      );

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
  };

  useEffect(() => {
    if (selected && !selected.children?.length) {
      fetchTestCases(selected.ID);
    }
  }, [selected]);

  // ================= FILTER =================

  const filtered = useMemo(() => {
    let data = [...testCases];

    if (search) {
      data = data.filter((tc) =>
        tc.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (priorityFilter !== "All") {
      data = data.filter((tc) => tc.priority === priorityFilter);
    }

    return data;
  }, [testCases, search, priorityFilter]);

  // ================= TEST CASE CRUD =================

  const handleCreate = async () => {
    if (!form.title.trim()) return toast.error("Title required");

    try {
      const res = await fetch(TESTCASE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          folder_ID: selected?.ID,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Created");

      setShowModal(false);
      resetForm();
      fetchTestCases(selected.ID);
    } catch {
      toast.error("Create failed");
    }
  };

  const handleUpdate = async () => {
    if (!editingTestCase) return;

    try {
      const res = await fetch(`${TESTCASE_API}('${editingTestCase.ID}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast.success("Updated");

      setShowModal(false);
      setEditingTestCase(null);
      fetchTestCases(selected.ID);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${TESTCASE_API}('${deleteId}')`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Deleted");
      setShowDeleteModal(false);
      fetchTestCases(selected.ID);
    } catch {
      toast.error("Delete failed");
    }
  };

  // ================= STEP CRUD =================

  const addStep = async () => {
    if (!selectedTestCaseId) return;

    if (!stepForm.action || !stepForm.expectedResult)
      return toast.error("Fill all fields");

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

      setStepForm({ action: "", expectedResult: "" });
      fetchSteps(selectedTestCaseId);
    } catch {
      toast.error("Add step failed");
    }
  };

  const updateStep = async (id: string) => {
    if (!editStepForm.action || !editStepForm.expectedResult) {
      return toast.error("Fields cannot be empty");
    }

    try {
      const res = await fetch(`${TESTSTEP_API}('${id}')`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStepForm),
      });

      if (!res.ok) throw new Error();

      setEditingStepId(null);
      fetchSteps(selectedTestCaseId!);
    } catch {
      toast.error("Update step failed");
    }
  };

  const deleteStep = async (id: string) => {
    try {
      const res = await fetch(`${TESTSTEP_API}('${id}')`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      fetchSteps(selectedTestCaseId!);
    } catch {
      toast.error("Delete step failed");
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      preconditions: "",
      priority: "Medium",
    });
  };

  if (!selected) return <div className="p-8">Select folder</div>;

  return (
    <div className="p-8 space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test Cases</h2>

        <button
          onClick={() => {
            resetForm();
            setEditingTestCase(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex gap-4">
        <input
          placeholder="Search..."
          className="input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="input w-40"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          <option>All</option>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left">Title</th>
              <th className="p-4">Preconditions</th>
              <th className="p-4">Priority</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((tc:any) => (
              <tr
                key={tc.ID}
                onClick={() => {
                  setSelectedTestCaseId(tc.ID);
                  fetchSteps(tc.ID);
                }}
                className="border-t hover:bg-gray-50 group cursor-pointer"
              >
                <td className="p-4">{tc.title}</td>
                <td className="p-4">{tc.preconditions || "-"}</td>
                <td className="p-4">{tc.priority}</td>

                <td className="p-4 text-right">
                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTestCase(tc);
                        setForm(tc);
                        setShowModal(true);
                      }}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(tc.ID);
                        setShowDeleteModal(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!selectedTestCaseId ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500 shadow-sm">
          Select a test case to view steps
        </div>
      ) : (
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          {/* HEADER */}
          <div className="flex justify-between items-center p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-lg">Test Steps</h3>

            <button
              onClick={() => setShowStepForm(!showStepForm)}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
            >
              <Plus size={14} /> Add Step
            </button>
          </div>

          {/* ADD STEP FORM */}
          {showStepForm && (
            <div className="p-4 border-b bg-gray-50">
              <div className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className="input focus:ring-2 focus:ring-blue-500 border-gray-300"
                    placeholder="Action"
                    value={stepForm.action}
                    onChange={(e) =>
                      setStepForm({ ...stepForm, action: e.target.value })
                    }
                  />

                  <input
                    className="input focus:ring-2 focus:ring-blue-500 border-gray-300"
                    placeholder="Expected Result"
                    value={stepForm.expectedResult}
                    onChange={(e) =>
                      setStepForm({
                        ...stepForm,
                        expectedResult: e.target.value,
                      })
                    }
                  />

                  <div className="col-span-2 flex justify-end gap-2 pt-2 border-t">
                    <button
                      onClick={() => setShowStepForm(false)}
                      className="px-3 py-1 rounded border hover:bg-gray-100 transition"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={async () => {
                        await addStep();
                        setShowStepForm(false);
                      }}
                      className="btn-primary flex items-center gap-1 shadow hover:scale-[1.02] transition"
                    >
                      <Check size={14} /> Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TABLE */}
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="p-3 w-12 text-left">#</th>
                <th className="p-3 text-center">Action</th>
                <th className="p-3 text-center">Expected Result</th>
                <th className="p-3 text-right w-24">Actions</th>
              </tr>
            </thead>

            <tbody>
              {stepsLoading ? (
                <tr>
                  <td colSpan={4} className="text-left p-6">
                    <Loader2 className="animate-spin mx-auto" />
                  </td>
                </tr>
              ) : steps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-gray-500">
                    No steps yet
                  </td>
                </tr>
              ) : (
                steps.map((s) => (
                  <tr
                    key={s.ID}
                    className="border-t hover:bg-gray-50 group transition"
                  >
                    {/* STEP NUMBER */}
                    <td className="p-3 text-gray-500">{s.stepNumber}</td>

                    {/* ACTION */}
                    <td className="p-3">
                      {editingStepId === s.ID ? (
                        <input
                          className="input"
                          value={editStepForm.action}
                          onChange={(e) =>
                            setEditStepForm({
                              ...editStepForm,
                              action: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span className="text-gray-800">{s.action}</span>
                      )}
                    </td>

                    {/* EXPECTED */}
                    <td className="p-3">
                      {editingStepId === s.ID ? (
                        <input
                          className="input"
                          value={editStepForm.expectedResult}
                          onChange={(e) =>
                            setEditStepForm({
                              ...editStepForm,
                              expectedResult: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span className="text-gray-600">
                          {s.expectedResult}
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        {editingStepId === s.ID ? (
                          <>
                            <button onClick={() => updateStep(s.ID)}>
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingStepId(null)}>
                              <X size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingStepId(s.ID);
                              setEditStepForm({
                                action: s.action,
                                expectedResult: s.expectedResult,
                              });
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        <button onClick={() => deleteStep(s.ID)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODALS */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <h3 className="font-semibold mb-4">
              {editingTestCase ? "Edit" : "Create"}
            </h3>

            <input
              className="input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              className="input mt-3"
              placeholder="Preconditions"
              value={form.preconditions}
              onChange={(e) =>
                setForm({ ...form, preconditions: e.target.value })
              }
            />

            <select
              className="input mt-3"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowModal(false)}>Cancel</button>

              <button
                onClick={editingTestCase ? handleUpdate : handleCreate}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-80">
            <h3 className="font-semibold mb-3">Delete Test Case?</h3>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          padding: 10px;
          border-radius: 8px;
        }
        .btn-primary {
          background: #2563eb;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
