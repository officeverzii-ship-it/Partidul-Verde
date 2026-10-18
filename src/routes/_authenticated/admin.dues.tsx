import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/dues")({
  head: () => pageHead("Cotizații", "Panoul intern al Partidului Verde.", "/admin/dues"),
  component: DuesAdmin,
});

function DuesAdmin() {
  return (
    <CrudPage
      title="Cotizații"
      table="dues"
      section="dues"
      searchField="member_id"
      fields={[
        { name: "member_id", label: "ID membru", required: true, inList: true },
        { name: "year", label: "An", type: "number", required: true, inList: true },
        { name: "amount", label: "Sumă (lei)", type: "number", required: true, inList: true },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [
          { value: "neplatita", label: "Neplătită" }, { value: "platita", label: "Plătită" }, { value: "scutita", label: "Scutită" },
        ] },
        { name: "paid_at", label: "Plătită la", type: "datetime-local" },
      ]}
    />
  );
}
