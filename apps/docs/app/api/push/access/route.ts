import { authorizePushAccess, getPushAccess } from '~/lib/push-access'

export const runtime = 'nodejs'
export const GET = getPushAccess
export const POST = authorizePushAccess
