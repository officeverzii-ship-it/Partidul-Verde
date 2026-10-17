import { Link } from '@tanstack/react-router';
import { ArrowUpRight } from 'lucide-react';
import logo from '@/assets/original/logo.png.asset.json';
import type { PublicArticle } from '@/lib/public-content';
export const dateLabel = (value: string | null) => value ? new Date(value).toLocaleDateString('ro-RO',{day:'numeric',month:'long',year:'numeric'}) : '';
export function ArticleCard({ article }: { article: PublicArticle }) {
 return <Link to={article.kind==='comunicat'?'/comunicate/$slug':'/articole/$slug'} params={{slug:article.slug}} className="news-card group block">
  {article.image_url?<img src={article.image_url} alt={article.title} width={640} height={420} loading="lazy" className="aspect-[1.55] w-full object-cover"/>:<div className="flex aspect-[1.55] items-center justify-center bg-brand text-brand"><img src={logo.url} alt="Partidul Verde" width={110} height={115} className="h-28 w-28 object-contain"/></div>}
  <div className="py-4"><p className="text-xs text-muted-foreground">{dateLabel(article.published_at)}</p><h3 className="mt-2 text-lg font-bold leading-snug group-hover:text-brand">{article.title}</h3><p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{article.excerpt}</p><ArrowUpRight className="mt-4 size-5 text-brand"/></div>
 </Link>;
}
