type DocumentSourcePolicyInput<T> = {
    includeRemote: boolean
    localDoc?: T | null
    remoteDoc?: T | null
}

export function selectDocumentBySourcePolicy<T>({
    includeRemote,
    localDoc,
    remoteDoc,
}: DocumentSourcePolicyInput<T>) {
    if (includeRemote) {
        return remoteDoc ?? localDoc ?? null
    }

    return localDoc ?? remoteDoc ?? null
}
