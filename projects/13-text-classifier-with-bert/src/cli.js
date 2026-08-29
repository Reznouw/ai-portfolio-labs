import {
  classifyText,
  evaluateModel,
  loadDataset,
  loadModel,
  loadVocabulary,
  saveMetrics,
  saveModel,
  trainPrototypeModel
} from "./classifier.js";

const command = process.argv[2] ?? "help";
const inputText = process.argv.slice(3).join(" ");

try {
  if (command === "train") {
    await train();
  } else if (command === "eval") {
    await evaluate();
  } else if (command === "classify") {
    await classify(inputText);
  } else if (command === "verify") {
    await verify();
  } else {
    help();
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

async function train() {
  const dataset = await loadDataset();
  const vocabulary = await loadVocabulary();
  const model = trainPrototypeModel(dataset, vocabulary);
  const modelPath = await saveModel(model);
  console.log(`trained ${model.kind}`);
  console.log(`labels: ${model.labels.join(", ")}`);
  console.log(`train examples: ${model.trainExamples}`);
  console.log(`wrote ${modelPath}`);
}

async function evaluate() {
  const dataset = await loadDataset();
  const vocabulary = await loadVocabulary();
  const model = await getOrCreateModel(dataset, vocabulary);
  const metrics = evaluateModel(dataset, model, vocabulary);
  const metricsPath = await saveMetrics(metrics);
  console.log(`accuracy: ${metrics.accuracy} (${metrics.correct}/${metrics.total})`);
  console.log(`wrote ${metricsPath}`);
}

async function classify(text) {
  if (!text) {
    throw new Error("usage: npm run classify -- \"your text here\"");
  }

  const dataset = await loadDataset();
  const vocabulary = await loadVocabulary();
  const model = await getOrCreateModel(dataset, vocabulary);
  const prediction = classifyText(text, model, vocabulary);
  console.log(JSON.stringify(prediction, null, 2));
}

async function verify() {
  const dataset = await loadDataset();
  const vocabulary = await loadVocabulary();
  const model = trainPrototypeModel(dataset, vocabulary);
  await saveModel(model);

  const metrics = evaluateModel(dataset, model, vocabulary);
  await saveMetrics(metrics);

  const smoke = classifyText(
    "central bank investors watch stocks and inflation",
    model,
    vocabulary
  );

  console.log(`verify accuracy: ${metrics.accuracy} (${metrics.correct}/${metrics.total})`);
  console.log(`smoke label: ${smoke.label}`);

  if (metrics.accuracy < 0.75) {
    throw new Error("verification failed: expected accuracy >= 0.75");
  }

  if (smoke.label !== "business") {
    throw new Error("verification failed: smoke classification should be business");
  }

  console.log("verification passed");
}

async function getOrCreateModel(dataset, vocabulary) {
  try {
    return await loadModel();
  } catch {
    const model = trainPrototypeModel(dataset, vocabulary);
    await saveModel(model);
    return model;
  }
}

function help() {
  console.log(`Text Classifier With BERT Simulator

Commands:
  npm run train
  npm run eval
  npm run classify -- "new text to classify"
  npm run verify
`);
}
