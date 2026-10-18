import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { ExportButton } from "@/components/admin/ExportButton";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/registrations")({
  head: () => pageHead("Înscrieri la evenimente", "Panoul intern al Partidului Verde.", "/admin/registrations"),
  component: RegistrationsAdmin,
});

function RegistrationsAdmin() {
  return (
    <CrudPage
      title="Înscrieri la evenimente"
      table="event_registrations"
      section="registrations"
      searchField="full_name"
      canCreate={false}
      toolbar={<ExportButton dataset="event_registrations" />}
      fields={[
        { name: "event_id", label: "ID eveniment", required: true, inList: true },
        { name: "full_name", label: "Nume", required: true, inList: true },
        { name: "email", label: "Email", type: "email", required: true, inList: true },
        { name: "phone", label: "Telefon", inList: true },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [
          { value: "nou", label: "Nou" }, { value: "confirmat", label: "Confirmat" }, { value: "anulat", label: "Anulat" },
        ] },
        { name: "created_at", label: "Înscris la", type: "datetime-local" },
      ]}
    />
  );
}
