'use client'

import {
    addEdge,
    Connection,
    ReactFlow,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'
import { useCallback, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import CustomEdge from './custom-edge'
import { EndNode, StartNode } from './custom-node'
import { EDGES, NODES } from './data'
import { connectionLineStyle, edgeOptions } from './edge/edge-style'

const nodeTypes = { start: StartNode, end: EndNode }
const edgeTypes = {
    'custom-edge': CustomEdge,
}

function FlowContent() {
    const { fitView } = useReactFlow()

    const debouncedFitView = useDebouncedCallback(
        // function
        () => {
            fitView({ padding: 0.2 })
        },
        // delay in ms
        500
    )

    useEffect(() => {
        fitView({ padding: 0.2 }) // padding은 0 ~ 1 사이 비율 값 (20% 여유 공간)

        window.addEventListener('resize', debouncedFitView)
        return () => window.removeEventListener('resize', debouncedFitView)
    }, [debouncedFitView, fitView])

    return null
}

export default function Node() {
    const [nodes, setNodes, onNodesChange] = useNodesState(NODES)
    const [edges, setEdges, onEdgesChange] = useEdgesState(EDGES)
    const onConnect = useCallback(
        (connection: Connection) => {
            console.log(connection)
            const edge: {
                id: string
                type: string
                source: string
                target: string
            } = {
                id: `${connection.source}-${connection.target}`,
                ...connection,
                type: 'custom-edge',
            }
            setEdges((eds) => addEdge(edge, eds))
        },
        [setEdges]
    )

    return (
        <div className="flex size-full">
            <ReactFlow
                panOnDrag={false} // 배경 드래그로 panning 비활성화
                panOnScroll={false} // 스크롤 휠로 panning 비활성화
                zoomOnScroll={false} // 휠로 zoom 비활성화 (선택사항)
                zoomOnPinch={false}
                nodes={nodes}
                edges={edges}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={edgeOptions}
                connectionLineStyle={connectionLineStyle}
                // fitView
            >
                <FlowContent />
            </ReactFlow>
        </div>
    )
}
