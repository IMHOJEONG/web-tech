import { updatePushSubscription } from '~/lib/push-api'

export const runtime = 'nodejs'
export function POST(request: Request) {
    return updatePushSubscription(request, 'POST')
}
export function DELETE(request: Request) {
    return updatePushSubscription(request, 'DELETE')
}
