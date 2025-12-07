import { FLOW } from '~/shared/constants'
import { makeID } from '~/shared/make-flow'

export const APPLICATION_NODES = [
    {
        id: makeID([FLOW.NODE, FLOW.APPLICATION]),
        type: `${FLOW.START}-${FLOW.END}`,
        position: { x: 0, y: 200 },
        data: {
            label: 'Application Layer',
            description: 'Web Application',
        },
    },
]
