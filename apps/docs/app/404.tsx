export const ERROR = () => {
    return (
        <>
            <h1 className="text-3xl font-bold">404: Address Not Allocated</h1>
            <p className="mt-2 text-gray-600">
                The memory you're trying to access isn't mapped in this segment.
                Try navigating back to a valid heap region.
            </p>
        </>
    )
}
