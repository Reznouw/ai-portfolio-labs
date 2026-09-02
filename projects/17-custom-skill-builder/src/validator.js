export const REQUIRED_SECTIONS = [
  "## Description",
  "## When To Use",
  "## Inputs",
  "## Workflow",
  "## Output Format",
  "## Constraints",
  "## Examples"
];

export function validateSkill(content) {
  const missing = [];

  if (!/^#\s+.+/m.test(content)) {
    missing.push("# <Skill Name>");
  }

  for (const section of REQUIRED_SECTIONS) {
    if (!content.includes(section)) {
      missing.push(section);
    }
  }

  return {
    ok: missing.length === 0,
    missing
  };
}
