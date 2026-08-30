import {
    Children,
    cloneElement,
    isValidElement,
    type ReactElement,
    type ReactNode,
} from 'react'
import {
    CALLOUT_MARKER_PATTERN,
    getCalloutVariantFromText,
    type CalloutVariant,
} from './callout.ts'

export function getNodeTextContent(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node)
    }

    if (Array.isArray(node)) {
        return node.map(getNodeTextContent).join('')
    }

    if (isValidElement<{ children?: ReactNode }>(node)) {
        return getNodeTextContent(node.props.children)
    }

    return ''
}

export function getCalloutVariantFromChildren(
    children: ReactNode
): CalloutVariant | null {
    return getCalloutVariantFromText(getNodeTextContent(children))
}

function stripCalloutMarkerFromText(value: string) {
    return value.replace(CALLOUT_MARKER_PATTERN, '').replace(/^\s+/, '')
}

export function stripCalloutMarkerFromNode(node: ReactNode): {
    node: ReactNode
    stripped: boolean
} {
    if (typeof node === 'string' || typeof node === 'number') {
        const value = String(node)

        if (!CALLOUT_MARKER_PATTERN.test(value)) {
            return {
                node: value.trim() ? node : null,
                stripped: false,
            }
        }

        return {
            node: stripCalloutMarkerFromText(value),
            stripped: true,
        }
    }

    if (Array.isArray(node)) {
        let stripped = false
        const nodes = Children.toArray(node).map((child) => {
            if (stripped) {
                return child
            }

            const result = stripCalloutMarkerFromNode(child)
            stripped = result.stripped

            return result.node
        })

        return {
            node: nodes,
            stripped,
        }
    }

    if (isValidElement<{ children?: ReactNode }>(node)) {
        const result = stripCalloutMarkerFromNode(node.props.children)

        if (!result.stripped) {
            return {
                node,
                stripped: false,
            }
        }

        const nextText = getNodeTextContent(result.node).trim()
        const nextNode = nextText
            ? cloneElement(
                  node as ReactElement<{ children?: ReactNode }>,
                  undefined,
                  result.node
              )
            : null

        return {
            node: nextNode,
            stripped: true,
        }
    }

    return {
        node,
        stripped: false,
    }
}
