const BLOCKED_EXACT_PATHS = new Set([
    '/.env',
    '/.env.local',
    '/.env.production',
    '/.git/config',
    '/admin',
    '/backup',
    '/backup.zip',
    '/config.php',
    '/phpinfo.php',
    '/wp-admin',
    '/wp-login.php',
    '/xmlrpc.php',
])

const BLOCKED_PREFIXES = [
    '/.git/',
    '/.svn/',
    '/phpmyadmin',
    '/wp-content/',
    '/wp-includes/',
]

const ROOT_YEAR_ARCHIVE_PATTERN = /^\/(?:19|20)\d{2}\/?$/
const SENSITIVE_FILE_PATTERN =
    /(?:^|\/)(?:\.env(?:\.[a-z0-9_-]+)*|\.htaccess|composer\.json|composer\.lock|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)(?:$|[?#])/
const BACKUP_FILE_PATTERN =
    /\.(?:bak|backup|old|orig|save|sql|tar|tgz|zip)(?:$|[?#])/

function normalizePathname(pathname: string) {
    const normalizedPathname = pathname.trim() || '/'

    try {
        return decodeURIComponent(normalizedPathname).toLowerCase()
    } catch {
        return normalizedPathname.toLowerCase()
    }
}

export function getRequestBlockReason(pathname: string, method = 'GET') {
    const normalizedPathname = normalizePathname(pathname)
    const normalizedMethod = method.toUpperCase()

    if (
        normalizedMethod === 'HEAD' &&
        ROOT_YEAR_ARCHIVE_PATTERN.test(normalizedPathname)
    ) {
        return 'root-year-head-probe'
    }

    if (BLOCKED_EXACT_PATHS.has(normalizedPathname)) {
        return 'known-probe-path'
    }

    if (
        BLOCKED_PREFIXES.some((prefix) => normalizedPathname.startsWith(prefix))
    ) {
        return 'known-probe-prefix'
    }

    if (SENSITIVE_FILE_PATTERN.test(normalizedPathname)) {
        return 'sensitive-file-probe'
    }

    if (BACKUP_FILE_PATTERN.test(normalizedPathname)) {
        return 'backup-file-probe'
    }

    return null
}
