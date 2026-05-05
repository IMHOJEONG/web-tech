import { PropsWithChildren } from 'react'

interface LandingBoxProps extends PropsWithChildren {
    name?: string
}

export const LandingBox = (props: LandingBoxProps) => {
    const { name, children } = props

    return (
        <div key={name} className="flex size-full flex-1 px-4 sm:px-6 md:px-8">
            {children}
        </div>
    )
}
