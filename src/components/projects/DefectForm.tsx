import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useHttp from "@/hooks/use-http";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { getDefaultClassNames } from "react-day-picker";

type Defect = {
  ID: string;
  title: string;
  description: string;
  severity: string;
  status: string;
};

type Props = {
  update: boolean;
  data?: Defect | null;
};

type FormData = {
  title: string;
  description: string;
  severity: string;
  status: string;
};

export default function DefectForm({ update, data }: Props) {
  const navigate = useNavigate();
  const http = useHttp();

  const { register, handleSubmit, setValue, watch } = useForm<FormData>();

  // PREFILL (EDIT)
  useEffect(() => {
    if (update && data) {
      setValue("title", data.title);
      setValue("description", data.description);
      setValue("severity", data.severity);
      setValue("status", data.status);
    }
  }, [update, data]);

  const onSubmit = async (values: FormData) => {
    try {
      const isEdit = Boolean(update && data?.ID);

      const url =
        import.meta.env.VITE_BACKEND_API_URL +
        (isEdit ? `/Defects('${data?.ID}')` : `/Defects`);

      await http.sendRequest(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      toast.success(`Defect ${isEdit ? "updated" : "created"}`);
      navigate("/admin/defects");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* TITLE */}
            <div>
              <Label>Title</Label>
              <Input {...register("title")} />
            </div>

            {/* SEVERITY */}
            <div className="w-full ">
              <Label>Severity</Label>

              <Select
                value={watch("severity") || ""}
                onValueChange={(v) => setValue("severity", v)}
              >
                <SelectTrigger className="w-full h-11 ">
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Major">Major</SelectItem>
                  <SelectItem value="Minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* STATUS */}
            <div className="w-full ">
              <Label>Status</Label>

              <Select
                value={watch("status") || ""}
                onValueChange={(v) => setValue("status", v)}
              >
                <SelectTrigger className="w-full h-11">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <Label>Description</Label>
            <Textarea {...register("description")} />
          </div>

          <Button type="submit" className="w-full">
            {update ? "Update Defect" : "Create Defect"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
