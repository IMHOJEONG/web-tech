import { createRoot } from 'react-dom/client'
import { useState } from 'react'
import { Button } from '@web-tech/ui/components/button'
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from '@web-tech/ui/components/sheet'
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
} from '@web-tech/ui/components/tooltip'
import { buttonVariants } from '@web-tech/ui/lib/button-variants'

function Consumer() {
    const [count, setCount] = useState(0)
    return (
        <TooltipProvider delay={0}>
            <Button id="counter" onClick={() => setCount((value) => value + 1)}>
                Count {count}
            </Button>
            <a href="#reading" className={buttonVariants({ variant: 'link' })}>
                Reading link
            </a>
            <Tooltip>
                <TooltipTrigger render={<Button id="tip" />}>
                    Explain
                </TooltipTrigger>
                <TooltipContent>External package tooltip</TooltipContent>
            </Tooltip>
            <Sheet>
                <SheetTrigger render={<Button id="open" />}>
                    Open panel
                </SheetTrigger>
                <SheetContent>
                    <SheetTitle>External panel</SheetTitle>
                    <SheetDescription>
                        Packed package, no workspace source.
                    </SheetDescription>
                    <SheetClose render={<Button />}>Close panel</SheetClose>
                </SheetContent>
            </Sheet>
        </TooltipProvider>
    )
}

createRoot(document.getElementById('root')!).render(<Consumer />)
