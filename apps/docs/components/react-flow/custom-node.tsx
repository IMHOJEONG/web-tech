import type { Node, NodeProps } from '@xyflow/react'

import { useCallback } from 'react'
import { EndHandle, StartEndHandle, StartHandle } from './custom-handle'

type DataNode = Node<
    {
        label: string
        description: string
    },
    'string'
>

interface CustomNodeComponentProps {
    data: DataNode['data']
    children?: React.ReactNode
}
const CustomNodeComponent = ({ data, children }: CustomNodeComponentProps) => {
    return (
        <div className="custom-node">
            <div className="rounded-2xl shadow-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 w-48 p-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer select-none">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-full"></div>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                        {data.label}
                    </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {data.description}
                </p>
            </div>

            {children}
        </div>
    )
}

export const StartNode = ({ data }: NodeProps<DataNode>) => {
    const onChange = useCallback((evt: any) => {
        console.log(evt.target.value)
    }, [])

    return (
        <CustomNodeComponent data={data}>
            <StartHandle />
        </CustomNodeComponent>
    )
}

export const EndNode = ({ data }: NodeProps<DataNode>) => {
    const onChange = useCallback((evt: any) => {
        console.log(evt.target.value)
    }, [])

    return (
        <CustomNodeComponent data={data}>
            <EndHandle />
        </CustomNodeComponent>
    )
}

export const StartEndNode = ({ data }: NodeProps<DataNode>) => {
    const onChange = useCallback((evt: any) => {
        console.log(evt.target.value)
    }, [])

    return (
        <CustomNodeComponent data={data}>
            <StartEndHandle />
        </CustomNodeComponent>
    )
}
