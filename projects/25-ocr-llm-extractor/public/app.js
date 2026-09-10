const fixtureSelect = document.querySelector("#fixture");
const documentType = document.querySelector("#documentType");
const confidence = document.querySelector("#confidence");
const fields = document.querySelector("#fields");
const json = document.querySelector("#json");

fixtureSelect.addEventListener("change", () => loadFixture(fixtureSelect.value));
loadFixture(fixtureSelect.value);

async function loadFixture(fixture) {
  const response = await fetch(`/api/extract?fixture=${encodeURIComponent(fixture)}`);
  const result = await response.json();
  documentType.textContent = result.fields.documentType;
  confidence.textContent = `Confidence ${Math.round(result.fields.confidence * 100)} percent`;
  fields.innerHTML = flattenFields(result.fields)
    .slice(0, 10)
    .map(([key, value]) => `<div class="field"><span>${label(key)}</span><span>${String(value)}</span></div>`)
    .join("");
  json.textContent = JSON.stringify(result, null, 2);
}

function flattenFields(object, prefix = "") {
  return Object.entries(object).flatMap(([key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (Array.isArray(value)) return [[nextKey, `${value.length} item(s)`]];
    if (value && typeof value === "object") return flattenFields(value, nextKey);
    return [[nextKey, value]];
  });
}

function label(key) {
  return key.replace(/[.]/g, " / ").replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}
