import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import useHttp from "@/hooks/use-http";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { ChevronDown, ChevronUp, Search, Pencil } from "lucide-react";

type TeamFormProps = {
  update: boolean;
  teamId?: string;
};

type TeamFormData = {
  name: string;
  description?: string;
};

type User = {
  ID: string;
  username: string;
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
};

export default function TeamForm({ update, teamId }: TeamFormProps) {
  const navigate = useNavigate();
  const http = useHttp();

  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [search, setSearch] = useState("");
 
  const [editingField, setEditingField] = useState<
    "name" | "description" | null
  >(null);

  const { register, handleSubmit, setValue, watch } = useForm<TeamFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchTeam = async () => {
    try {
      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${teamId}`,
      );

      if (response?.success && response.data) {
        setValue("name", response.data.name);
        setValue("description", response.data.description);
      }
    } catch (error) {
      toast.error("Failed to load team");
    }
  };

  const fetchTeamUsers = async () => {
    if (!teamId) return;

    try {
      setLoadingUsers(true);

      const response = await http.sendRequest(
        `${import.meta.env.VITE_BACKEND_API_URL}/Users?$filter=team_ID eq '${teamId}'`,
      );

      let userData: User[] = [];

      if (Array.isArray(response?.data)) {
        userData = response.data;
      } else if (Array.isArray(response?.data?.value)) {
        userData = response.data.value;
      }

      setUsers(userData);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (update && teamId) {
      fetchTeam();
      fetchTeamUsers();
    }
  }, [update, teamId]);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(search.toLowerCase()),
  );

  const onSubmit = async (values: TeamFormData) => {
    try {
      const url = update
        ? `${import.meta.env.VITE_BACKEND_API_URL}/Teams/${teamId}`
        : `${import.meta.env.VITE_BACKEND_API_URL}/Teams`;

      const method = update ? "PUT" : "POST";

      await http.sendRequest(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      toast.success(
        update ? "Team updated successfully" : "Team created successfully",
      );
      navigate("/admin/teams");
    } catch (error) {
      toast.error(update ? "Failed to update team" : "Failed to create team");
    }
  };

  return (
    <Card className="border shadow-sm rounded-2xl">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* TEAM NAME */}
          <div className="space-y-2 group relative">
            <Label>Team Name</Label>

            {!update ? (
              <Input
                {...register("name", { required: true })}
                className="h-11 rounded-lg"
              />
            ) : editingField === "name" ? (
              <Input
                {...register("name", { required: true })}
                className="h-11 rounded-lg"
                autoFocus
                onBlur={() => setEditingField(null)}
              />
            ) : (
              <div className="h-11 flex items-center px-3 rounded-lg border bg-muted/40 text-sm">
                {watch("name") || "—"}
              </div>
            )}

            {update && editingField !== "name" && (
              <button
                type="button"
                onClick={() => setEditingField("name")}
                className="absolute right-2 top-7 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs bg-white border shadow-sm px-2 py-1 rounded-md hover:bg-muted"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
 
          <div className="space-y-2 group relative">
            <Label>Description</Label>

            {!update ? (
              <Input {...register("description")} className="h-11 rounded-lg" />
            ) : editingField === "description" ? (
              <Input
                {...register("description")}
                className="h-11 rounded-lg"
                autoFocus
                onBlur={() => setEditingField(null)}
              />
            ) : (
              <div className="h-11 flex items-center px-3 rounded-lg border bg-muted/40 text-sm">
                {watch("description") || "—"}
              </div>
            )}

            {update && editingField !== "description" && (
              <button
                type="button"
                onClick={() => setEditingField("description")}
                className="absolute right-2 top-7 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs bg-white border shadow-sm px-2 py-1 rounded-md hover:bg-muted"
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
 
          {update && (
            <div className="space-y-2">
              <Label>Team Members</Label>

              <div className="border rounded-xl bg-white dark:bg-muted shadow-sm">
                <div
                  onClick={() => setOpenDropdown(!openDropdown)}
                  className="flex justify-between items-center px-4 py-3 cursor-pointer hover:bg-muted/50 transition"
                >
                  <span className="text-sm font-medium">
                    {users.length} Members
                  </span>

                  {openDropdown ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </div>

                {openDropdown && (
                  <div className="border-t p-3 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-10"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {loadingUsers ? (
                        <p className="text-sm">Loading users...</p>
                      ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <div
                            key={user.ID}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition"
                          >
                            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-semibold">
                              {getInitials(user.username)}
                            </div>

                            <span className="text-sm">{user.username}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No users found
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-lg text-sm font-medium"
          >
            {update ? "Update Team" : "Add Team"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
