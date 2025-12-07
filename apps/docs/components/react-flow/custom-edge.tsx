import { BaseEdge, EdgeProps, getStraightPath } from '@xyflow/react'

export function CustomEdge({
    sourceX,
    sourceY,
    targetX,
    targetY,
    ...props
}: EdgeProps) {
    const [edgePath] = getStraightPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
    })

    const { id, label, labelStyle, markerStart, markerEnd, interactionWidth } =
        props

    // const [path] =

    return (
        <>
            {/* <svg style={{ position: 'absolute', top: 0, left: 0 }}>
                <defs>
                    <marker
                        className="react-flow__arrowhead"
                        id="selected-marker"
                        markerWidth="20"
                        markerHeight="20"
                        viewBox="-10 -10 20 20"
                        markerUnits="userSpaceOnUse"
                        orient="auto-start-reverse"
                        refX="0"
                        refY="0"
                    >
                        <polyline
                            className="arrowclosed"
                            style={{
                                strokeWidth: 1,
                                stroke: '#FFCC00',
                                fill: '#FFCC00',
                            }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points="-5,-4 0,0 -5,4 -5,-4"
                        />
                    </marker>
                </defs>
            </svg> */}

            <>
                <defs>
                    <marker
                        id="ArrowClosed"
                        markerWidth="12"
                        markerHeight="12"
                        refX="12"
                        refY="6"
                        orient="auto"
                    >
                        <path d="M0,0 L12,6 L0,12 z" />
                    </marker>
                </defs>

                {/* <path
                    id={id}
                    d={edgePath}
                    stroke="white"
                    strokeWidth={2}
                    fill="none"
                    markerStart={markerStart ? 'url(#ArrowClosed)' : undefined}
                    markerEnd={markerEnd ? 'url(#ArrowClosed)' : undefined}
                /> */}
            </>
            <BaseEdge
                path={edgePath}
                label={label}
                labelStyle={labelStyle}
                markerEnd={markerEnd}
                markerStart={markerStart}
                interactionWidth={interactionWidth}
            />
        </>
    )
}
