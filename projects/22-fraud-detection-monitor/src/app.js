const percent = (value) => `${Math.round(value * 1000) / 10}%`;

function metricCard(label, value) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function severityClass(severity) {
  return `severity-${severity}`;
}

async function loadReport() {
  const response = await fetch("/report.json");
  if (!response.ok) throw new Error("Unable to load report.json");
  return response.json();
}

function render(report) {
  document.querySelector("#drift-status").textContent = report.drift.summary;
  document.querySelector("#drift-status").className = severityClass(report.drift.summary);

  document.querySelector("#metrics").innerHTML = [
    metricCard("Precision", percent(report.metrics.precision)),
    metricCard("Recall", percent(report.metrics.recall)),
    metricCard("F1", percent(report.metrics.f1)),
    metricCard("Accuracy", percent(report.metrics.accuracy))
  ].join("");

  document.querySelector("#drift-checks").innerHTML = report.drift.checks
    .map(
      (check) => `
        <article class="check">
          <span>${check.name.replaceAll("_", " ")}</span>
          <strong class="${severityClass(check.severity)}">${check.value.toFixed(4)}</strong>
          <span>${check.severity}</span>
        </article>
      `
    )
    .join("");

  const flagged = report.scoredTransactions.filter((row) => row.predicted_fraud === 1);
  document.querySelector("#flagged-count").textContent = `${flagged.length} flagged`;
  document.querySelector("#transactions").innerHTML = flagged
    .map(
      (row) => `
        <tr>
          <td>${row.transaction_id}</td>
          <td>$${row.amount.toFixed(2)}</td>
          <td>${row.merchant_category}</td>
          <td>${row.score}</td>
          <td>${row.is_fraud}</td>
          <td>${row.reasons.join(", ")}</td>
        </tr>
      `
    )
    .join("");
}

loadReport()
  .then(render)
  .catch((error) => {
    document.body.innerHTML = `<main class="shell"><section class="panel"><div class="panel-head"><h1>${error.message}</h1></div></section></main>`;
  });
