import { Edge, MarkerType } from '@xyflow/react'
import { makeEdge, makeID } from '~/shared/make-flow'
import { APPLICATION_NODES } from './layer/application'
import { DATABASE_NODES } from './layer/database'
import { PRESENTATION_NODES } from './layer/presentation'

export const NODES = [
    ...APPLICATION_NODES,
    ...DATABASE_NODES,
    ...PRESENTATION_NODES,
]

export const EDGES: Edge[] = [
    {
        id: makeEdge({
            source: 'presentation',
            target: 'application',
        }),
        type: 'custom-edge',
        source: makeID(['node', 'presentation']),
        target: makeID(['node', 'application']),
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'white',
        },
        markerStart: {
            type: MarkerType.ArrowClosed,
            color: 'white',
        },
    },
    {
        id: makeEdge({
            source: 'application',
            target: 'database',
        }),
        type: 'custom-edge',
        source: makeID(['node', 'application']),
        target: makeID(['node', 'database']),
        markerEnd: {
            type: MarkerType.ArrowClosed,
            color: 'white',
        },
        markerStart: {
            type: MarkerType.ArrowClosed,
            color: 'white',
        },
    },
]
