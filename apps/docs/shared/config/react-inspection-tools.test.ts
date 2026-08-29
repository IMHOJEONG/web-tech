import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shouldLoadReactInspectionTools } from './react-inspection-tools.ts'

test('loads react inspection tools only in development', () => {
    assert.equal(shouldLoadReactInspectionTools('development'), true)
    assert.equal(shouldLoadReactInspectionTools('production'), false)
    assert.equal(shouldLoadReactInspectionTools('test'), false)
    assert.equal(shouldLoadReactInspectionTools(undefined), false)
})
