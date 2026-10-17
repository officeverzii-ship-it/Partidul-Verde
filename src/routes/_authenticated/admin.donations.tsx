import { pageHead } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/_authenticated/admin/donations")({
  head: () => pageHead('Administrare donații', 'Panoul intern al Partidului Verde.', '/admin/donations'),
  component: () => (
    <CrudPage
      title="Donații"
      table="donations"
      section="donations"
      searchField="donor_name"
      fields={[
        { name: "donor_name", label: "Donator", required: true, inList: true },
        { name: "donor_email", label: "Email", type: "email", required: true, inList: true },
        { name: "amount", label: "Sumă (lei)", type: "number", required: true, inList: true },
        { name: "method", label: "Metodă", type: "select", required: true, inList: true, options: [
          { value: "card", label: "Card" }, { value: "transfer", label: "Transfer bancar" }, { value: "numerar", label: "Numerar" },
        ] },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [
          { value: "in_asteptare", label: "În așteptare" }, { value: "confirmata", label: "Confirmată" }, { value: "esuata", label: "Eșuată" }, { value: "rambursata", label: "Rambursată" },
        ] },
      ]}
    />
  ),
});
