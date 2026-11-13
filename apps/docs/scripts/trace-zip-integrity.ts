import { execFileSync } from 'node:child_process'

const checkArchive = `
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as archive:
    if not archive.infolist():
        raise zipfile.BadZipFile("Trace ZIP is empty")
    if archive.testzip() is not None:
        raise zipfile.BadZipFile("Trace ZIP CRC validation failed")
`

export function assertTraceZipIntegrity(filePath: string): void {
    execFileSync('python3', ['-I', '-c', checkArchive, filePath], {
        stdio: 'pipe',
        timeout: 30000,
        maxBuffer: 1024 * 1024,
    })
}
