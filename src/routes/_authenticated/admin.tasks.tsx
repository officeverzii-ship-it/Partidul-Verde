import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useBranchOptions } from "@/components/admin/CrudPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/tasks")({
  head: () => pageHead("Sarcini", "Panoul intern al Partidului Verde.", "/admin/tasks"),
  component: TasksAdmin,
});

function TasksAdmin() {
  const { data: branches = [] } = useBranchOptions();
  return (
    <CrudPage
      title="Sarcini"
      table="tasks"
      section="tasks"
      searchField="title"
      fields={[
        { name: "title", label: "Titlu", required: true, inList: true },
        { name: "description", label: "Descriere", type: "textarea" },
        { name: "branch_id", label: "Filială", type: "select", options: branches, inList: true },
        { name: "due_date", label: "Termen", type: "date", inList: true },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [
          { value: "de_facut", label: "De făcut" }, { value: "in_lucru", label: "În lucru" },
          { value: "finalizat", label: "Finalizat" }, { value: "anulat", label: "Anulat" },
        ] },
      ]}
    />
  );
}
