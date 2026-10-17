import { pageHead } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useBranchOptions } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/_authenticated/admin/events")({
  head: () => pageHead('Administrare evenimente', 'Panoul intern al Partidului Verde.', '/admin/events'),
  component: EventsAdmin,
});

function EventsAdmin() {
  const { data: branches = [] } = useBranchOptions();
  return (
    <CrudPage
      title="Evenimente"
      table="events"
      section="events"
      searchField="title"
      orderBy="starts_at"
      fields={[
        { name: "title", label: "Titlu", required: true, inList: true },
        { name: "starts_at", label: "Data", type: "datetime-local", required: true, inList: true },
        { name: "location", label: "Locație", inList: true },
        { name: "branch_id", label: "Filială", type: "select", options: branches, inList: true },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [{ value: "draft", label: "Draft" }, { value: "publicat", label: "Publicat" }] },
        { name: "description", label: "Descriere", type: "textarea" },
      ]}
    />
  );
}
