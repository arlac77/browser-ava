export function calculateSummary(testModules) {
  let failed = 0,
    knownFailure = 0,
    todo = 0;

  for (const tm of testModules) {
    for (const test of tm.tests) {
      if (!test.skip) {
        if (test.todo) {
          todo++;
        } else {
          if (!test.passed) {
            if (test.failing) {
              knownFailure++;
            } else {
              failed++;
            }
          }
        }
      }
    }
  }

  return { failed, knownFailure, todo };
}
