export const ErrorComponent = ({ error }: { error: Error }) => {
    return <div>Error... {error.toString()}</div>
}
