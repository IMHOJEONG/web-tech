import { PropsWithChildren } from 'react'

interface LandingBoxProps extends PropsWithChildren {
    name?: string
}

export const LandingBox = (props: LandingBoxProps) => {
    const { name, children } = props

    return (
        <div
            className="size-full flex flex-1
            bg-stone-100 px-4 sm:px-6 md:px"
            key={name}
        >
            {children}
        </div>
    )
}
