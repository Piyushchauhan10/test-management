import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useHttp from "@/hooks/use-http";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Requirement = {
  ID: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  project_ID: string;
  sprint_ID?: string | null;
};

type Project = {
  ID: string;
  name: string;
};

type Sprint = {
  ID: string;
  name: string;
};

type Props = {
  update: boolean;
  data?: Requirement | null;
};

type FormData = {
  title: string;
  description: string;
  priority: string;
  status: string;
  project_ID: string;
  sprint_ID: string;
};

export default function RequirementForm({ update, data }: Props) {
  const navigate = useNavigate();
  const http = useHttp();

  const [sprints, setSprints] = useState<Sprint[]>([]);

  const { register, handleSubmit, setValue, watch } = useForm<FormData>();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: "Write detailed requirement description...",
      }),
    ],
    content: data?.description || "",
    onUpdate: ({ editor }) => {
      setValue("description", editor.getHTML());
    },
  });

  const fetchSprints = async (projectId: string) => {
    try {
      const res = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Sprints?$filter=project_ID eq '${projectId}'`,
      );
      const sprintData = res?.data?.value || res?.data || [];
      setSprints(sprintData);
    } catch {
      toast.error("Failed to load sprints");
    }
  };

  useEffect(() => {
    let projectId = localStorage.getItem("projectId");
    if (projectId) {
      fetchSprints(projectId);
    }
  }, []);

  useEffect(() => {
    if (update && data) {
      setValue("title", data.title);
      setValue("description", data.description);
      setValue("priority", data.priority);
      setValue("status", data.status);
      setValue("project_ID", data.project_ID);
      setValue("sprint_ID", data.sprint_ID || "");

      if (data.project_ID) fetchSprints(data.project_ID);
    }
  }, [update, data, setValue]);

  useEffect(() => {}, [setValue]);

  const onSubmit = async (values: FormData) => {
    try {
      const isEdit = Boolean(update && data?.ID);

      const url =
        import.meta.env.VITE_BACKEND_API_URL +
        (isEdit ? `/Requirements('${data?.ID}')` : `/Requirements`);

      await http.sendRequest(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      toast.success(`Requirement ${isEdit ? "updated" : "created"}`);
      navigate("/admin/requirements");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <Label className="text-xs   leading-none">Title</Label>
              <Input
                {...register("title")}
                placeholder="Enter requirement title"
                className="h-11 px-3 rounded-xl border-muted focus-visible:ring-1 focus-visible:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs   leading-none">Priority</Label>
              <Select
                value={watch("priority")}
                onValueChange={(v) => setValue("priority", v)}
              >
                <SelectTrigger className="w-full h-11 px-3 rounded-xl border-muted focus:ring-1 focus:ring-primary/30">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs   leading-none">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger className="w-full h-11 px-3 rounded-xl border-muted focus:ring-1 focus:ring-primary/30">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-xs   leading-none">Sprint</Label>
              <Select
                value={watch("sprint_ID")}
                onValueChange={(v) => setValue("sprint_ID", v)}
              >
                <SelectTrigger className="w-full h-11 px-3 rounded-xl border-muted focus:ring-1 focus:ring-primary/30">
                  <SelectValue placeholder="Select Sprint" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {sprints.map((sprint) => (
                    <SelectItem key={sprint.ID} value={sprint.ID}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium ">Description</Label>

            <div className="rounded-2xl border bg-background shadow-sm overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <div className="flex items-center gap-1 px-3 py-2 border-b bg-muted/40">
                <Button
                  type="button"
                  size="sm"
                  variant={editor?.isActive("bold") ? "secondary" : "ghost"}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className="h-8 px-2"
                >
                  <span className="font-bold">B</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={editor?.isActive("italic") ? "secondary" : "ghost"}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className="h-8 px-2 italic"
                >
                  I
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant={
                    editor?.isActive("underline") ? "secondary" : "ghost"
                  }
                  onClick={() =>
                    editor?.chain().focus().toggleUnderline().run()
                  }
                  className="h-8 px-2 underline"
                >
                  U
                </Button>

                <div className="w-px h-5 bg-border mx-2" />

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor?.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className="h-8 px-2 text-xs font-semibold"
                >
                  H2
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor?.chain().focus().toggleBulletList().run()
                  }
                  className="h-8 px-2"
                >
                  •
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor?.chain().focus().toggleOrderedList().run()
                  }
                  className="h-8 px-2"
                >
                  1.
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor?.chain().focus().toggleBlockquote().run()
                  }
                  className="h-8 px-2"
                >
                  ❝
                </Button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    editor?.chain().focus().toggleCodeBlock().run()
                  }
                  className="h-8 px-2 text-xs"
                >
                  {"</>"}
                </Button>
              </div>

              {/* ✨ EDITOR AREA */}
              <div className="px-4 py-3 min-h-[220px] max-h-[450px] overflow-y-auto">
                <div className="[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:text-sm [&_.ProseMirror]:text-left [&_.ProseMirror_p]:my-2">
                  {editor && <EditorContent editor={editor} />}
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base font-medium">
            {update ? "Update Requirement" : "Add Requirement"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
