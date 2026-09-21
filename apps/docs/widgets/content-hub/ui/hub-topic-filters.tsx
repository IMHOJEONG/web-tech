import { Button, buttonVariants } from '@web-tech/ui/components/button'
import { cn } from '@web-tech/ui/lib/utils'
import { Check, ChevronDown } from 'lucide-react'
import { Link } from '~/shared/i18n/navigation'
import {
    getHubTopicHref,
    splitHubTopics,
    type HubTopic,
} from '../model/hub-topic-filter'

type Props = {
    pathname: string
    topics: HubTopic[]
    selected?: string
    total: number
    labels: { title: string; all: string; more: string; less: string }
}

export function HubTopicFilters({
    pathname,
    topics,
    selected,
    total,
    labels,
}: Props) {
    const { visible, remaining } = splitHubTopics(topics, selected)
    const renderTopic = (topic: HubTopic) => {
        const active = topic.value === (selected ?? '')
        return (
            <Button
                asChild
                variant="ghost"
                key={topic.value}
                className={cn(
                    'ds-focus-ring h-auto min-h-11 min-w-0 max-w-full justify-start rounded-full border px-3 py-2 text-sm shadow-none transition-colors motion-reduce:transition-none',
                    active
                        ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary dark:hover:bg-primary/15'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container hover:text-on-surface dark:hover:bg-surface-container'
                )}
            >
                <Link
                    href={getHubTopicHref(pathname, topic.value)}
                    scroll={false}
                    prefetch={false}
                    aria-current={active ? 'true' : undefined}
                >
                    {active && (
                        <Check aria-hidden="true" className="size-3.5" />
                    )}
                    <span className="min-w-0 whitespace-normal break-words [overflow-wrap:anywhere]">
                        {topic.label}
                    </span>
                    <span className="shrink-0 text-xs tabular-nums">
                        {topic.count}
                    </span>
                </Link>
            </Button>
        )
    }
    return (
        <nav
            aria-label={labels.title}
            data-testid="hub-topic-filters"
            className="min-w-0 space-y-3"
        >
            <p className="text-xs font-medium text-on-surface-variant">
                {labels.title}
            </p>
            <div className="flex min-w-0 flex-wrap gap-2">
                {renderTopic({ value: '', label: labels.all, count: total })}
                {visible.map(renderTopic)}
            </div>
            {remaining.length > 0 && (
                <details
                    key={selected ?? 'all'}
                    className="group/topics min-w-0"
                >
                    <summary
                        className={cn(
                            buttonVariants({ variant: 'ghost', size: 'sm' }),
                            'ds-focus-ring min-h-11 w-fit max-w-full cursor-pointer whitespace-normal text-on-surface-variant'
                        )}
                    >
                        <span className="group-open/topics:hidden">
                            {labels.more}
                        </span>
                        <span className="hidden group-open/topics:inline">
                            {labels.less}
                        </span>
                        <ChevronDown
                            aria-hidden="true"
                            className="size-3.5 transition-transform group-open/topics:rotate-180 motion-reduce:transition-none"
                        />
                    </summary>
                    <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                        {remaining.map(renderTopic)}
                    </div>
                </details>
            )}
        </nav>
    )
}
