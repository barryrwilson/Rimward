## Security Review: WAVE71 boot pins (`scripts/boot-test.mjs`)

### Risk Level: Low

### Summary
PR5 only adds harness pins. It does not change `src/**`. Restore pins use stub ctx objects. Live dock Digit 2 uses the existing station overlay. Source pins are regex on files, not `eval`.

### Findings
None CRITICAL/HIGH.

### Passed Checks
- [x] No secrets in pins
- [x] Proto job ids stay dropped
- [x] Live complete/expire run on the harness world at the end of the file
