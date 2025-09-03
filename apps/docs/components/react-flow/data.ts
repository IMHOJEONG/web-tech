export const START_NODES = [
    {
        id: 'node-a',
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
            label: 'React',
            description: 'data',
        },
    },
    {
        id: 'node-c',
        type: 'start',
        position: { x: 100, y: 50 },
        data: {
            label: 'Svelte',
            description: 'data',
        },
    },
    {
        id: 'node-d',
        type: 'start',
        position: { x: 150, y: 150 },
        data: {
            label: 'OS',
            description: 'data',
        },
    },
]

export const NODES = [
    ...START_NODES,
    {
        id: 'node-b',
        type: 'end',
        position: { x: 50, y: 500 },
        data: { label: 'Computer Science', description: 'data' },
    },
]

export const EDGES = [
    {
        id: 'a->b',
        type: 'custom-edge',
        // sourceHandle: 'a',
        // targetHandle: 'b',
        source: 'node-a',
        target: 'node-b',
    },
    {
        id: 'c->b',
        type: 'custom-edge',
        // sourceHandle: 'a',
        // targetHandle: 'b',
        source: 'node-c',
        target: 'node-b',
    },
    {
        id: 'd->b',
        type: 'custom-edge',
        // sourceHandle: 'a',
        // targetHandle: 'b',
        source: 'node-d',
        target: 'node-b',
    },
]
