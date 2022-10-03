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

export function summaryMessages(summary) {
  const messages = [];

  function pluralize(word, number) {
    return number > 1 ? word + "s" : word;
  }

  function message(number, word, template) {
    if (number >= 1) {
      messages.push(
        template
          .replace(/{number}/, number)
          .replace(/{word}/, pluralize(word, number))
      );
    }
  }

  message(summary.failed, "test", "{number} {word} failed");
  message(summary.knownFailure, "failure", "{number} known {word}");
  message(summary.todo, "test", "{number} {word} todo");

  return messages;
}
