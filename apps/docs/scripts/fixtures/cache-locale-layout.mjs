// Copied as app/layout.tsx only inside the experiment.
// This relaxes static-shell validation, not the request's locale selection.
export const instant = false
export {
    default,
    generateMetadata,
    generateStaticParams,
} from './layout.cache-base'
