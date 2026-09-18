import { ArticlePageShell } from '~/shared/ui/article-page-shell'

export default function Layout({ children }: { children: React.ReactNode }) {
    return <ArticlePageShell>{children}</ArticlePageShell>
}
