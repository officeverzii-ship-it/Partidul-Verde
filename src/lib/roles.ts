import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin_national"
  | "admin_filiala"
  | "editor"
  | "coordonator_voluntari"
  | "membru"
  | "voluntar";

export const roleLabels: Record<AppRole, string> = {
  admin_national: "Admin Național",
  admin_filiala: "Admin Filială",
  editor: "Editor",
  coordonator_voluntari: "Coordonator Voluntari",
  membru: "Membru",
  voluntar: "Voluntar",
};

export type Section = "articles" | "members" | "volunteers" | "branches" | "events" | "donations" | "pages" | "submissions" | "media" | "settings" | "contacts" | "tasks" | "dues" | "registrations" | "email";

/** Ce roluri văd fiecare secțiune în interfață. Securitatea reală e aplicată în baza de date. */
export const sectionAccess: Record<Section, AppRole[]> = {
  articles: ["admin_national", "editor"],
  members: ["admin_national", "admin_filiala"],
  volunteers: ["admin_national", "admin_filiala", "coordonator_voluntari"],
  branches: ["admin_national", "admin_filiala"],
  events: ["admin_national", "admin_filiala", "editor"],
  donations: ["admin_national"],
  pages: ["admin_national", "editor"],
  submissions: ["admin_national"],
  media: ["admin_national", "editor"],
  settings: ["admin_national", "editor"],
  contacts: ["admin_national", "admin_filiala"],
  tasks: ["admin_national", "admin_filiala", "coordonator_voluntari"],
  dues: ["admin_national", "admin_filiala"],
  registrations: ["admin_national", "admin_filiala", "editor"],
  email: ["admin_national", "editor"],
};

export function useMyRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { email: "", roles: [] as AppRole[] };
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      if (error) throw error;
      return { email: u.user.email ?? "", roles: (data ?? []).map((r) => r.role as AppRole) };
    },
  });
}

export function canAccess(roles: AppRole[], section: Section) {
  return roles.some((r) => sectionAccess[section].includes(r));
}
