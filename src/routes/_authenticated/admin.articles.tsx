import { pageHead } from '@/lib/seo';
import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/admin/CrudPage";

export const Route = createFileRoute("/_authenticated/admin/articles")({
  head: () => pageHead('Administrare articole', 'Panoul intern al Partidului Verde.', '/admin/articles'),
  component: () => (
    <CrudPage
      title="Articole & comunicate"
      table="articles"
      section="articles"
      searchField="title"
      fields={[
        { name: "title", label: "Titlu", required: true, inList: true },
        { name: "slug", label: "Slug (URL)", required: true },
        { name: "kind", label: "Tip", type: "select", required: true, inList: true, options: [{ value: "articol", label: "Articol" }, { value: "comunicat", label: "Comunicat" }] },
        { name: "category", label: "Categorie", required: true, inList: true },
        { name: "author_name", label: "Autor", inList: true },
        { name: "status", label: "Status", type: "select", required: true, inList: true, options: [{ value: "draft", label: "Draft" }, { value: "publicat", label: "Publicat" }] },
        { name: "published_at", label: "Data publicării", type: "datetime-local", inList: true },
        { name: "image_url", label: "Adresă imagine" },
        { name: "excerpt", label: "Rezumat" },
        { name: "content", label: "Conținut", type: "textarea", required: true },
      ]}
    />
  ),
});
