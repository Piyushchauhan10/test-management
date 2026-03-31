"use client";

import { useState, useEffect } from "react";
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

const TESTCASE_API =
  "http://72.61.244.79:4004/odata/v4/test-management/TestCases";

const TESTSTEP_API =
  "http://72.61.244.79:4004/odata/v4/test-management/TestSteps";

export default function TestCaseManager({ selected }: any) {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [filtered, setFiltered] = useState<TestCase[]>([]);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string | null>(
    null,
  );

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [showModal, setShowModal] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);

  const [editingStepId, setEditingStepId] = useState<string | null>(null);

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
        { cache: "no-store" },
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
    try {
      const res = await fetch(
        `${TESTSTEP_API}?$filter=testCase_ID eq '${testCaseId}'`,
        { cache: "no-store" },
      );

      if (!res.ok) throw new Error();

      const data = await res.json();
      setSteps(data.value || []);
    } catch {
      toast.error("Failed to fetch steps");
    }
  };

  useEffect(() => {
    if (selected && !selected.children?.length) {
      fetchTestCases(selected.ID);
    }
  }, [selected]);

  useEffect(() => {
    let data = [...testCases];

    if (search) {
      data = data.filter((tc) =>
        tc.title.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (priorityFilter !== "All") {
      data = data.filter((tc) => tc.priority === priorityFilter);
    }

    setFiltered(data);
  }, [search, priorityFilter, testCases]);

  // ================= CREATE =================
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

  // ================= UPDATE =================
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

  // ================= DELETE =================
  const confirmDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete?")) return;

    try {
      const res = await fetch(`${TESTCASE_API}('${id}')`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      toast.success("Deleted");
      fetchTestCases(selected.ID);
    } catch {
      toast.error("Delete failed");
    }
  };

  // ================= STEPS =================
  const addStep = async () => {
    if (!stepForm.action || !stepForm.expectedResult)
      return toast.error("Fill all fields");

    const nextStep = Math.max(0, ...steps.map((s) => s.stepNumber)) + 1;

    await fetch(TESTSTEP_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepNumber: nextStep,
        ...stepForm,
        testCase_ID: selectedTestCaseId,
      }),
    });

    setStepForm({ action: "", expectedResult: "" });
    fetchSteps(selectedTestCaseId!);
  };

  const updateStep = async (id: string) => {
    await fetch(`${TESTSTEP_API}('${id}')`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editStepForm),
    });

    setEditingStepId(null);
    fetchSteps(selectedTestCaseId!);
  };

  const deleteStep = async (id: string) => {
    if (!confirm("Delete this step?")) return;

    await fetch(`${TESTSTEP_API}('${id}')`, {
      method: "DELETE",
    });

    fetchSteps(selectedTestCaseId!);
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
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-xl shadow hover:scale-105 transition"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Title</th>
              <th className="p-3">Preconditions</th>
              <th className="p-3">Priority</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center p-6">
                  <Loader2 className="animate-spin mx-auto" />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center p-6">
                  No test cases found
                </td>
              </tr>
            ) : (
              filtered.map((tc) => (
                <tr
                  key={tc.ID}
                  onClick={() => {
                    if (selectedTestCaseId === tc.ID) return;
                    setSelectedTestCaseId(tc.ID);
                    fetchSteps(tc.ID);
                  }}
                  className="border-t hover:bg-gray-50 cursor-pointer"
                >
                  <td className="p-3 font-medium">{tc.title}</td>
                  <td className="p-3 text-gray-600">
                    {tc.preconditions || "-"}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-600 text-xs">
                      {tc.priority}
                    </span>
                  </td>

                  <td className="p-3 flex justify-end gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTestCase(tc);
                        setForm({
                          title: tc.title,
                          preconditions: tc.preconditions || "",
                          priority: tc.priority,
                        });
                        setShowModal(true);
                      }}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(tc.ID);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* STEPS */}
      {/* STEPS */}
      {!selectedTestCaseId ? (
        <div className="bg-white border rounded-xl p-8 shadow-sm text-center text-gray-500">
          Select a test case to view steps
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Test Steps</h3>

          {/* ADD */}
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  className="input"
                  placeholder="Action"
                  value={stepForm.action}
                  onChange={(e) =>
                    setStepForm({ ...stepForm, action: e.target.value })
                  }
                />
                <input
                  className="input"
                  placeholder="Expected"
                  value={stepForm.expectedResult}
                  onChange={(e) =>
                    setStepForm({
                      ...stepForm,
                      expectedResult: e.target.value,
                    })
                  }
                />

                <button
                  onClick={addStep}
                  className="bg-blue-600 col-span-2 text-white px-4 py-2 rounded mb-4"
                >
                  Add Step
                </button>
              </div>
            </CardContent>
          </Card>

          {/* TABLE */}
          <table className="w-full text-sm">
            <tbody>
              {steps.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-6 text-gray-500">
                    No steps added yet
                  </td>
                </tr>
              ) : (
                steps.map((s) => (
                  <tr key={s.ID} className="border-t group">
                    <td className="p-2">{s.stepNumber}</td>

                    <td className="p-2">
                      {editingStepId === s.ID ? (
                        <input
                          value={editStepForm.action}
                          onChange={(e) =>
                            setEditStepForm({
                              ...editStepForm,
                              action: e.target.value,
                            })
                          }
                          className="input"
                        />
                      ) : (
                        s.action
                      )}
                    </td>

                    <td className="p-2">
                      {editingStepId === s.ID ? (
                        <input
                          value={editStepForm.expectedResult}
                          onChange={(e) =>
                            setEditStepForm({
                              ...editStepForm,
                              expectedResult: e.target.value,
                            })
                          }
                          className="input"
                        />
                      ) : (
                        s.expectedResult
                      )}
                    </td>

                    <td className="p-2 w-24">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        {editingStepId === s.ID ? (
                          <>
                            <button
                              onClick={() => updateStep(s.ID)}
                              className="hover:text-green-600"
                            >
                              <Check size={16} />
                            </button>

                            <button
                              onClick={() => setEditingStepId(null)}
                              className="hover:text-gray-600"
                            >
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
                            className="hover:text-blue-600"
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        <button
                          onClick={() => deleteStep(s.ID)}
                          className="hover:text-red-600"
                        >
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-lg font-semibold">
              {editingTestCase ? "Edit Test Case" : "Create Test Case"}
            </h3>

            <input
              className="input"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <textarea
              className="input h-24 resize-none"
              placeholder="Preconditions"
              value={form.preconditions}
              onChange={(e) =>
                setForm({ ...form, preconditions: e.target.value })
              }
            />

            <select
              className="input"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={editingTestCase ? handleUpdate : handleCreate}
                className="bg-blue-600 text-white px-5 py-2 rounded"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <style >{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          padding: 10px;
          border-radius: 10px;
          outline: none;
          transition: 0.2s;
        }
        .input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
}
