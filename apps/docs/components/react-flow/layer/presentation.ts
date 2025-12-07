import { FLOW } from '~/shared/constants'
import { makeID } from '~/shared/make-flow'

export const PRESENTATION_NODES = [
    {
        id: makeID([FLOW.NODE, FLOW.PRESENTATION]),
        type: FLOW.START,
        position: { x: 0, y: 0 },
        data: {
            label: 'Presentation Layer',
            description: 'Web Presentation',
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
