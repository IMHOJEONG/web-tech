// Synthetic MDX, injected only by the test server's request-scoped filesystem probe.
const gap = '<div aria-hidden="true" style={{ height: "70vh" }} />'
export const headingFixtureBody = [
    '<h2 id="intro">Authored introduction</h2>',
    '## Intro',
    gap,
    ...[1, 2, 3, 4].flatMap((depth) => [
        `${'#'.repeat(depth)} Repeated level ${depth}`,
        gap,
        `${'#'.repeat(depth)} Repeated level ${depth}`,
        gap,
    ]),
    '## Compatibility 1/5 — timing',
    gap,
    '##### Deep five',
    gap,
    '###### Deep six',
    gap,
    '<div id={"intro-1"} />',
].join('\n\n')

export function withHeadingFixture(source: string) {
    const frontmatter = source.match(
        /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/
    )?.[0]
    if (!frontmatter)
        throw new Error('Heading fixture requires existing frontmatter')
    return `${frontmatter}\n${headingFixtureBody}\n`
}
