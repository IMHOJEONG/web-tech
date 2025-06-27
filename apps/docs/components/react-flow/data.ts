export const NODES = [
    {
        id: 'node-a',
        type: 'start',
        position: { x: 50, y: 50 },
        data: {
            label: 'React',
            description: 'data',
        },
    },
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
]
