const response = await fetch("/reports/customer-call.json");
const report = await response.json();

document.querySelector("#summary").textContent = report.summary;
document.querySelector("#sentiment").textContent = report.sentiment.label;
document.querySelector("#sentiment-detail").textContent = `Score ${report.sentiment.score}. Positive: ${formatList(report.sentiment.positiveHits)}. Negative: ${formatList(report.sentiment.negativeHits)}.`;
document.querySelector("#quality").textContent = `${Math.round(report.quality.averageConfidence * 100)}%`;
document.querySelector("#quality-detail").textContent = report.quality.note;
document.querySelector("#action-count").textContent = `${report.actionItems.length} detected`;

const actionList = document.querySelector("#actions");
actionList.replaceChildren(...report.actionItems.map(renderAction));

function renderAction(item) {
  const element = document.createElement("li");
  element.innerHTML = `
    <span class="badge">${escapeHtml(item.priority)}</span>
    <span class="task"><strong>${escapeHtml(item.owner)}</strong><span>${escapeHtml(item.task)}</span></span>
    <span class="due">${escapeHtml(item.due)}</span>
  `;
  return element;
}

function formatList(values) {
  return values.length ? values.join(", ") : "none";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
