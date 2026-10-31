// Public, deterministic loopback fixtures. Never use these as real credentials.
export const articleFixtureCredentials = {
    content: 'article-e2e-only-token',
    control: 'article-e2e-only-control',
    revalidation: 'article-e2e-only-revalidation',
} as const

export function articleFixtureAuthorization(
    kind: keyof typeof articleFixtureCredentials
) {
    return `Bearer ${articleFixtureCredentials[kind]}`
}
