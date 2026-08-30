export const REACT_SCAN_SCRIPT_SRC =
    '//unpkg.com/react-scan@0.5.7/dist/auto.global.js'
export const REACT_GRAB_SCRIPT_SRC =
    '//unpkg.com/react-grab@0.2.0/dist/index.global.js'

export function shouldLoadReactInspectionTools(
    nodeEnv = process.env.NODE_ENV,
    enabled = process.env.DOCS_ENABLE_REACT_INSPECTION
) {
    return nodeEnv === 'development' && enabled?.toLowerCase() === 'true'
}
