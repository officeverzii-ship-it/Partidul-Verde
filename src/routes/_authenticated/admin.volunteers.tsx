import { pageHead } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useBranchOptions } from "@/components/admin/CrudPage";
import { ExportButton } from "@/components/admin/ExportButton";

export const Route = createFileRoute("/_authenticated/admin/volunteers")({
  head: () => pageHead('Administrare voluntari', 'Panoul intern al Partidului Verde.', '/admin/volunteers'),
  component: VolunteersAdmin,
});

function VolunteersAdmin() {
  const { data: branches = [] } = useBranchOptions();
  return (
    <CrudPage
      title="Voluntari"
      table="volunteers"
      section="volunteers"
      searchField="full_name"
      toolbar={<ExportButton dataset="volunteers" />}
      fields={[
        { name: "full_name", label: "Nume", required: true, inList: true },
        { name: "email", label: "Email", type: "email", required: true, inList: true },
        { name: "phone", label: "Telefon", inList: true },
        { name: "availability", label: "Disponibilitate", inList: true },
        { name: "branch_id", label: "Filială asignată", type: "select", options: branches, inList: true },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [
          { value: "nou", label: "Nou" }, { value: "activ", label: "Activ" }, { value: "inactiv", label: "Inactiv" },
        ] },
        { name: "skills", label: "Competențe", type: "textarea" },
      ]}
    />
  );
}
