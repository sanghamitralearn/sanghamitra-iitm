/**
 * Beginner-friendly Vitest reporter.
 * Uses process.stdout.write (never console.log) so Vitest cannot capture it.
 * Collects results via onTaskUpdate, prints summary in onFinished.
 */

const w = (s) => process.stdout.write(s)

export default class PrettyReporter {
  constructor() {
    this.ctx      = null
    this.results  = []   // { file, suite, name, state, error }
  }

  onInit(ctx) {
    this.ctx = ctx
  }

  onTaskUpdate(packs) {
    if (!this.ctx?.state?.idMap) return

    for (const [id, result] of packs) {
      if (!result || result.state === 'run' || result.state === 'skip') continue

      const task = this.ctx.state.idMap.get(id)
      if (!task || task.type !== 'test') continue

      const raw   = task.file?.filepath || task.file?.name || ''
      const file  = raw.replace(/.*[/\\]__tests__[/\\]/, '').replace(/\.test\.[jt]sx?$/, '')
      const suite = task.suite?.name || ''

      this.results.push({
        file,
        suite,
        name:  task.name,
        state: result.state,            // 'pass' | 'fail'
        error: result.errors?.[0]?.message?.split('\n').find(l => l.trim()) || '',
      })
    }
  }

  onFinished() {
    // Group by file
    const byFile = {}
    for (const r of this.results) {
      ;(byFile[r.file] = byFile[r.file] || []).push(r)
    }

    let totalPassed = 0
    let totalFailed = 0

    w('\n')

    for (const [file, tests] of Object.entries(byFile)) {
      const passed = tests.filter(t => t.state === 'pass').length
      const failed = tests.length - passed
      totalPassed += passed
      totalFailed += failed

      // ── File header ──────────────────────────────────────────────────────
      w(failed > 0
        ? `\n❌  ${file}  (${passed} passed, ${failed} FAILED)\n`
        : `\n✅  ${file}  (${passed} passed)\n`)
      w('─'.repeat(65) + '\n')

      // ── Each test ────────────────────────────────────────────────────────
      for (const t of tests) {
        const ok   = t.state === 'pass'
        const icon = ok ? '  ✅' : '  ❌'
        w(`${icon}  ${t.name}\n`)

        if (!ok && t.error) {
          w(`        ⚠️  ${t.error.trim().slice(0, 110)}\n`)
        }
      }
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const total = totalPassed + totalFailed
    w('\n' + '═'.repeat(65) + '\n')
    if (totalFailed === 0) {
      w(`  ✅  All ${total} tests PASSED\n`)
    } else {
      w(`  ✅  ${totalPassed} passed     ❌  ${totalFailed} FAILED\n`)
      w('\n  Failed tests:\n')
      for (const r of this.results.filter(r => r.state !== 'pass')) {
        w(`    ❌  [${r.file}]  ${r.name}\n`)
      }
    }
    w('═'.repeat(65) + '\n\n')
  }
}
