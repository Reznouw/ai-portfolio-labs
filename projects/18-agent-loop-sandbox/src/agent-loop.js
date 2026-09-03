const ACTION_COSTS = {
  trim: 2,
  lowercase: 2,
  dedupe: 3,
  sort: 3,
  reverse: 1
};

const ACTIONS = {
  trim: (items) => items.map((item) => item.trim()),
  lowercase: (items) => items.map((item) => item.toLowerCase()),
  dedupe: (items) => Array.from(new Set(items)),
  sort: (items) => [...items].sort((left, right) => left.localeCompare(right)),
  reverse: (items) => [...items].reverse()
};

export function runTasks(tasks) {
  return {
    generatedAt: 'deterministic-offline-run',
    taskCount: tasks.length,
    actionBudgetTable: ACTION_COSTS,
    tasks: tasks.map(runLoop)
  };
}

export function runLoop(task) {
  validateTask(task);

  let output = [...task.input];
  let spent = 0;
  const completedActions = [];
  const iterations = [];
  let finalEvaluation = evaluate(output, task.expected, task.requiredActions, completedActions);

  for (let index = 1; index <= task.maxIterations; index += 1) {
    if (finalEvaluation.passed) break;

    const plan = planNextAction(task, completedActions, finalEvaluation);
    const cost = ACTION_COSTS[plan.action];

    if (spent + cost > task.budget) {
      iterations.push({
        iteration: index,
        plan,
        execute: {
          skipped: true,
          reason: 'budget_exhausted',
          cost,
          spent,
          remainingBudget: task.budget - spent,
          output
        },
        evaluate: finalEvaluation
      });
      break;
    }

    output = ACTIONS[plan.action](output);
    spent += cost;
    completedActions.push(plan.action);
    finalEvaluation = evaluate(output, task.expected, task.requiredActions, completedActions);

    iterations.push({
      iteration: index,
      plan,
      execute: {
        skipped: false,
        cost,
        spent,
        remainingBudget: task.budget - spent,
        output
      },
      evaluate: finalEvaluation
    });
  }

  const stopReason = getStopReason(finalEvaluation, iterations, task);

  return {
    id: task.id,
    title: task.title,
    controls: {
      maxIterations: task.maxIterations,
      budget: task.budget
    },
    input: task.input,
    expected: task.expected,
    requiredActions: task.requiredActions,
    spent,
    stopReason,
    passed: finalEvaluation.passed,
    finalOutput: output,
    iterations
  };
}

function validateTask(task) {
  const requiredFields = ['id', 'title', 'input', 'expected', 'requiredActions', 'maxIterations', 'budget'];
  for (const field of requiredFields) {
    if (!(field in task)) throw new Error(`Task is missing required field: ${field}`);
  }
  if (!Array.isArray(task.input) || !Array.isArray(task.expected) || !Array.isArray(task.requiredActions)) {
    throw new Error(`Task ${task.id} has invalid array fields`);
  }
  if (!Number.isInteger(task.maxIterations) || task.maxIterations < 1) {
    throw new Error(`Task ${task.id} has invalid maxIterations`);
  }
  if (!Number.isInteger(task.budget) || task.budget < 0) {
    throw new Error(`Task ${task.id} has invalid budget`);
  }
  for (const action of task.requiredActions) {
    if (!ACTIONS[action]) throw new Error(`Task ${task.id} uses unknown action: ${action}`);
  }
}

function planNextAction(task, completedActions, evaluation) {
  const action = task.requiredActions.find((candidate) => !completedActions.includes(candidate));
  if (!action) {
    return {
      action: 'sort',
      reason: 'All required actions were completed, but output still differs; apply deterministic sort as the safe final repair.'
    };
  }

  return {
    action,
    reason: evaluation.missingActions.length > 0
      ? `Next missing required action is ${action}.`
      : `Output differs from expected; apply ${action}.`
  };
}

function evaluate(output, expected, requiredActions, completedActions) {
  const missingActions = requiredActions.filter((action) => !completedActions.includes(action));
  const outputMatches = arraysEqual(output, expected);

  return {
    passed: outputMatches && missingActions.length === 0,
    outputMatches,
    missingActions,
    expectedLength: expected.length,
    actualLength: output.length,
    diff: diffArrays(output, expected)
  };
}

function getStopReason(evaluation, iterations, task) {
  if (evaluation.passed) return 'success';
  if (iterations.some((iteration) => iteration.execute.skipped && iteration.execute.reason === 'budget_exhausted')) {
    return 'budget_exhausted';
  }
  if (iterations.length >= task.maxIterations) return 'max_iterations';
  return 'stopped';
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function diffArrays(output, expected) {
  const width = Math.max(output.length, expected.length);
  const diff = [];
  for (let index = 0; index < width; index += 1) {
    if (output[index] !== expected[index]) {
      diff.push({
        index,
        actual: output[index] ?? null,
        expected: expected[index] ?? null
      });
    }
  }
  return diff;
}

export function renderMarkdown(report) {
  const lines = [
    '# Agent Loop Trace',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Controls',
    '',
    '- External APIs: disabled',
    '- Determinism: local rules only',
    '- Allowed actions: trim, lowercase, dedupe, sort, reverse',
    '- Stop conditions: success, max_iterations, budget_exhausted',
    '',
    '## Action Costs',
    ''
  ];

  for (const [action, cost] of Object.entries(report.actionBudgetTable)) {
    lines.push(`- ${action}: ${cost}`);
  }

  for (const task of report.tasks) {
    lines.push('', `## Task: ${task.id}`, '', task.title, '');
    lines.push(`- Stop reason: ${task.stopReason}`);
    lines.push(`- Passed: ${task.passed ? 'yes' : 'no'}`);
    lines.push(`- Budget: ${task.spent}/${task.controls.budget}`);
    lines.push(`- Iterations recorded: ${task.iterations.length}`);
    lines.push(`- Final output: ${JSON.stringify(task.finalOutput)}`);
    lines.push('');
    lines.push('| Iteration | Plan | Cost | Remaining | Evaluation |');
    lines.push('| --- | --- | ---: | ---: | --- |');
    for (const iteration of task.iterations) {
      const evaluation = iteration.evaluate.passed
        ? 'passed'
        : `missing ${iteration.evaluate.missingActions.join(', ') || 'none'}`;
      const cost = iteration.execute.skipped ? 0 : iteration.execute.cost;
      lines.push(`| ${iteration.iteration} | ${iteration.plan.action} | ${cost} | ${iteration.execute.remainingBudget} | ${evaluation} |`);
    }
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}
