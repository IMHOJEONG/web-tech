import { Handle, Position } from '@xyflow/react'

const handleStyle = { left: 10 }

export const StartHandle = () => {
    return (
        <Handle
            type="source"
            position={Position.Bottom}
            id="a"
            // style={handleStyle}
        />
    )
}
export const EndHandle = () => {
    return (
        <Handle
            type="target"
            position={Position.Top}
            id="b"
            // style={handleStyle}
        />
    )
}

export const StartEndHandle = () => {
    return (
        <Handle
            type="target"
            position={Position.Top}
            id="b"
            // style={handleStyle}
        />
    )
}
