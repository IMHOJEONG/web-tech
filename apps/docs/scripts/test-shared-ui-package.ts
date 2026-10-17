import { preparePackedUiConsumer } from './test-utils/packed-ui-consumer.ts'

const consumer = await preparePackedUiConsumer()
await consumer.cleanup()
