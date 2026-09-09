export const CLASS_NAMES = ["circle", "triangle", "square", "shirt", "pants"];

const ACTIVE_PIXELS = new Set(["#", "1", "X", "x", "@", "*"]);

const PROTOTYPES = {
  circle: {
    density: 0.74,
    aspect: 1.0,
    horizontalSymmetry: 0.95,
    verticalSymmetry: 0.95,
    topMass: 0.24,
    middleMass: 0.4,
    bottomMass: 0.36,
    topBottomBalance: 0.12,
    centerGapBottom: 0.05,
    sleeveMass: 0.35,
    edgeMass: 0.16
  },
  triangle: {
    density: 0.5,
    aspect: 1.0,
    horizontalSymmetry: 0.9,
    verticalSymmetry: 0.62,
    topMass: 0.12,
    middleMass: 0.34,
    bottomMass: 0.54,
    topBottomBalance: 0.42,
    centerGapBottom: 0.0,
    sleeveMass: 0.2,
    edgeMass: 0.56
  },
  square: {
    density: 0.85,
    aspect: 0.8,
    horizontalSymmetry: 0.96,
    verticalSymmetry: 0.96,
    topMass: 0.33,
    middleMass: 0.26,
    bottomMass: 0.41,
    topBottomBalance: 0.08,
    centerGapBottom: 0.25,
    sleeveMass: 0.55,
    edgeMass: 0.5
  },
  shirt: {
    density: 0.62,
    aspect: 1.0,
    horizontalSymmetry: 0.96,
    verticalSymmetry: 0.78,
    topMass: 0.34,
    middleMass: 0.31,
    bottomMass: 0.35,
    topBottomBalance: 0.0,
    centerGapBottom: 0.0,
    sleeveMass: 0.56,
    edgeMass: 0.2
  },
  pants: {
    density: 0.44,
    aspect: 0.78,
    horizontalSymmetry: 0.84,
    verticalSymmetry: 0.7,
    topMass: 0.4,
    middleMass: 0.3,
    bottomMass: 0.3,
    topBottomBalance: -0.1,
    centerGapBottom: 0.72,
    sleeveMass: 0.16,
    edgeMass: 0.58
  }
};

const WEIGHTS = {
  density: 0.9,
  aspect: 1.0,
  horizontalSymmetry: 0.6,
  verticalSymmetry: 1.2,
  topMass: 0.9,
  middleMass: 0.45,
  bottomMass: 0.9,
  topBottomBalance: 1.15,
  centerGapBottom: 1.45,
  sleeveMass: 1.1,
  edgeMass: 1.8
};

export function parseImage(input) {
  if (Array.isArray(input?.matrix)) {
    return normalizeMatrix(input.matrix);
  }

  const rows = Array.isArray(input?.grid) ? input.grid : input;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("Image must include grid rows or a matrix.");
  }

  return normalizeMatrix(rows.map((row) => String(row).split("").map((cell) => ACTIVE_PIXELS.has(cell) ? 1 : 0)));
}

export function extractFeatures(input) {
  const matrix = parseImage(input);
  const height = matrix.length;
  const width = matrix[0].length;
  const active = [];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (matrix[y][x] === 1) {
        active.push({ x, y });
      }
    }
  }

  if (active.length === 0) {
    throw new Error("Image must contain at least one active pixel.");
  }

  const minX = Math.min(...active.map((pixel) => pixel.x));
  const maxX = Math.max(...active.map((pixel) => pixel.x));
  const minY = Math.min(...active.map((pixel) => pixel.y));
  const maxY = Math.max(...active.map((pixel) => pixel.y));
  const boxWidth = maxX - minX + 1;
  const boxHeight = maxY - minY + 1;
  const cropped = cropMatrix(matrix, minX, maxX, minY, maxY);
  const topRows = rangeRows(cropped, 0, 0.34);
  const middleRows = rangeRows(cropped, 0.34, 0.67);
  const bottomRows = rangeRows(cropped, 0.67, 1);
  const topMass = countActive(topRows) / active.length;
  const middleMass = countActive(middleRows) / active.length;
  const bottomMass = countActive(bottomRows) / active.length;

  return {
    density: round(active.length / (boxWidth * boxHeight)),
    aspect: round(boxWidth / boxHeight),
    horizontalSymmetry: round(symmetry(cropped, "horizontal")),
    verticalSymmetry: round(symmetry(cropped, "vertical")),
    topMass: round(topMass),
    middleMass: round(middleMass),
    bottomMass: round(bottomMass),
    topBottomBalance: round(bottomMass - topMass),
    centerGapBottom: round(centerGap(bottomRows)),
    sleeveMass: round(sideMass(topRows)),
    edgeMass: round(edgeMass(cropped)),
    activePixels: active.length,
    width,
    height,
    boxWidth,
    boxHeight
  };
}

export function classify(input) {
  const features = extractFeatures(input);
  const predictions = CLASS_NAMES.map((name) => {
    const distance = weightedDistance(features, PROTOTYPES[name]);
    return {
      label: name,
      distance: round(distance),
      confidence: round(1 / (1 + distance))
    };
  }).sort((a, b) => b.confidence - a.confidence);

  const total = predictions.reduce((sum, prediction) => sum + prediction.confidence, 0);
  const normalized = predictions.map((prediction) => ({
    ...prediction,
    confidence: round(prediction.confidence / total)
  }));

  return {
    label: normalized[0].label,
    confidence: normalized[0].confidence,
    predictions: normalized,
    features
  };
}

function normalizeMatrix(matrix) {
  const width = matrix[0]?.length ?? 0;
  if (width === 0 || matrix.some((row) => row.length !== width)) {
    throw new Error("Image rows must have a consistent non-zero width.");
  }

  return matrix.map((row) => row.map((cell) => cell ? 1 : 0));
}

function cropMatrix(matrix, minX, maxX, minY, maxY) {
  return matrix.slice(minY, maxY + 1).map((row) => row.slice(minX, maxX + 1));
}

function rangeRows(matrix, startRatio, endRatio) {
  const start = Math.floor(matrix.length * startRatio);
  const end = Math.max(start + 1, Math.floor(matrix.length * endRatio));
  return matrix.slice(start, end);
}

function countActive(matrix) {
  return matrix.flat().reduce((sum, value) => sum + value, 0);
}

function symmetry(matrix, axis) {
  let matches = 0;
  let total = 0;
  const height = matrix.length;
  const width = matrix[0].length;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const mirrorY = axis === "vertical" ? height - y - 1 : y;
      const mirrorX = axis === "horizontal" ? width - x - 1 : x;
      matches += matrix[y][x] === matrix[mirrorY][mirrorX] ? 1 : 0;
      total += 1;
    }
  }

  return matches / total;
}

function centerGap(matrix) {
  if (matrix.length === 0) {
    return 0;
  }

  const width = matrix[0].length;
  const centerStart = Math.floor(width * 0.4);
  const centerEnd = Math.ceil(width * 0.6);
  let inactive = 0;
  let total = 0;

  for (const row of matrix) {
    for (let x = centerStart; x < centerEnd; x += 1) {
      inactive += row[x] === 0 ? 1 : 0;
      total += 1;
    }
  }

  return total === 0 ? 0 : inactive / total;
}

function sideMass(matrix) {
  const active = countActive(matrix);
  if (active === 0) {
    return 0;
  }

  const width = matrix[0].length;
  const leftEnd = Math.ceil(width * 0.25);
  const rightStart = Math.floor(width * 0.75);
  let sides = 0;

  for (const row of matrix) {
    for (let x = 0; x < width; x += 1) {
      if ((x < leftEnd || x >= rightStart) && row[x] === 1) {
        sides += 1;
      }
    }
  }

  return sides / active;
}

function edgeMass(matrix) {
  const active = countActive(matrix);
  if (active === 0) {
    return 0;
  }

  const height = matrix.length;
  const width = matrix[0].length;
  let edge = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (matrix[y][x] === 1 && (x === 0 || y === 0 || x === width - 1 || y === height - 1)) {
        edge += 1;
      }
    }
  }

  return edge / active;
}

function weightedDistance(features, prototype) {
  return Object.entries(WEIGHTS).reduce((sum, [key, weight]) => {
    const delta = Math.abs(features[key] - prototype[key]);
    return sum + delta * weight;
  }, 0);
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}
