import { FLOW } from '~/shared/constants'
import { makeID } from '~/shared/make-flow'

export const DATABASE_NODES = [
    {
        id: makeID([FLOW.NODE, FLOW.DATABASE]),
        type: FLOW.END,
        position: { x: 0, y: 400 },
        data: {
            label: 'Database Layer',
            description: 'Database',
        },
    },
    // {
    //     id: 'node-c',
    //     type: 'start',
    //     position: { x: 100, y: 50 },
    //     data: {
    //         label: 'Svelte',
    //         description: 'data',
    //     },
    // },
]
