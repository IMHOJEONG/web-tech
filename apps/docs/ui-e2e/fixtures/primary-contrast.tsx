import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Button } from '@web-tech/ui/components/button'
import { Badge } from '@web-tech/ui/components/badge'

function PrimaryContrast() {
    const [activations, setActivations] = useState(0)
    return (
        <main className="space-y-6 p-8">
            <h1>Primary contrast regression</h1>
            <div className="flex flex-wrap gap-6">
                <Button
                    id="primary"
                    onClick={() => setActivations((v) => v + 1)}
                >
                    Primary action
                </Button>
                <Button id="small" size="xs">
                    Small primary
                </Button>
                <Button
                    id="disabled"
                    disabled
                    onClick={() => setActivations((v) => v + 1)}
                >
                    Disabled action
                </Button>
                <a id="cta" href="#destination" className="ds-button-primary">
                    Read articles
                </a>
                <Badge id="badge">Published</Badge>
                <Badge id="badge-anchor" render={<a href="#destination" />}>
                    Article category
                </Badge>
            </div>
            <output id="activations">{activations}</output>
            <p id="destination">Destination</p>
        </main>
    )
}

document.documentElement.classList.toggle(
    'dark',
    matchMedia('(prefers-color-scheme: dark)').matches
)
createRoot(document.getElementById('root')!).render(<PrimaryContrast />)
