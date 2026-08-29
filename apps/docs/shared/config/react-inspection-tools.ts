export const REACT_SCAN_SCRIPT_SRC =
    '//unpkg.com/react-scan/dist/auto.global.js'
export const REACT_GRAB_SCRIPT_SRC =
    '//unpkg.com/react-grab/dist/index.global.js'

export function shouldLoadReactInspectionTools(nodeEnv = process.env.NODE_ENV) {
    return nodeEnv === 'development'
}
