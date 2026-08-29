import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
    REACT_GRAB_SCRIPT_SRC,
    REACT_SCAN_SCRIPT_SRC,
    shouldLoadReactInspectionTools,
} from './react-inspection-tools.ts'

test('loads react inspection tools only when development debug flag is enabled', () => {
    assert.equal(shouldLoadReactInspectionTools('development', 'true'), true)
    assert.equal(shouldLoadReactInspectionTools('development', 'TRUE'), true)
    assert.equal(shouldLoadReactInspectionTools('development', 'false'), false)
    assert.equal(
        shouldLoadReactInspectionTools('development', undefined),
        false
    )
    assert.equal(shouldLoadReactInspectionTools('production', 'true'), false)
    assert.equal(shouldLoadReactInspectionTools('test', 'true'), false)
    assert.equal(shouldLoadReactInspectionTools(undefined, 'true'), false)
})

test('pins react inspection tool CDN versions', () => {
    assert.match(REACT_SCAN_SCRIPT_SRC, /react-scan@0\.5\.7/)
    assert.match(REACT_GRAB_SCRIPT_SRC, /react-grab@0\.2\.0/)
    assert.doesNotMatch(REACT_SCAN_SCRIPT_SRC, /react-scan\/dist/)
    assert.doesNotMatch(REACT_GRAB_SCRIPT_SRC, /react-grab\/dist/)
})
