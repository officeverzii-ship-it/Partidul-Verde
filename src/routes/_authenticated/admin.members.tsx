import { pageHead } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage, useBranchOptions } from "@/components/admin/CrudPage";
import { ExportButton } from "@/components/admin/ExportButton";

export const Route = createFileRoute("/_authenticated/admin/members")({
  head: () => pageHead('Administrare membri', 'Panoul intern al Partidului Verde.', '/admin/members'),
  component: MembersAdmin,
});

function MembersAdmin() {
  const { data: branches = [] } = useBranchOptions();
  return (
    <CrudPage
      title="Membri"
      table="members"
      section="members"
      searchField="full_name"
      toolbar={<ExportButton dataset="members" />}
      fields={[
        { name: "full_name", label: "Nume", required: true, inList: true },
        { name: "email", label: "Email", type: "email", required: true, inList: true },
        { name: "phone", label: "Telefon", inList: true },
        { name: "branch_id", label: "Filială", type: "select", options: branches, inList: true },
        { name: "role", label: "Rol în partid", required: true },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [
          { value: "in_asteptare", label: "În așteptare" }, { value: "activ", label: "Activ" }, { value: "suspendat", label: "Suspendat" }, { value: "retras", label: "Retras" },
        ] },
        { name: "joined_at", label: "Data înscrierii", type: "date", inList: true },
        { name: "dues_paid", label: "Cotizații plătite (lei)", type: "number" },
        { name: "address", label: "Adresă" },
        { name: "cnp", label: "CNP" },
        { name: "birth_date", label: "Data nașterii", type: "date" },
        { name: "county", label: "Județ" },
        { name: "city", label: "Localitate" },
        { name: "profession", label: "Profesie" },
        { name: "workplace", label: "Loc de muncă" },
        { name: "activity_type", label: "Activitate", type: "select", options: [{value:"activ",label:"Activ"},{value:"simpatizant",label:"Simpatizant"}] },
        { name: "education", label: "Studii" },
        { name: "mother_tongue", label: "Limba maternă" },
        { name: "other_languages", label: "Alte limbi" },
        { name: "motivation", label: "Mesaj", type: "textarea" },
      ]}
    />
  );
}
