import { queryOptions } from '@tanstack/react-query';
import { getPublicContent } from './public-content.functions';
export const publicContentOptions = queryOptions({ queryKey: ['public-content'], queryFn: () => getPublicContent(), staleTime: 30_000 });
export type PublicContent = Awaited<ReturnType<typeof getPublicContent>>;
export type PublicArticle = PublicContent['articles'][number];
