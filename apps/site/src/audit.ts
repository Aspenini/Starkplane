// Local opt-in verification only (?audit=1). This bundle is not loaded in normal visits.
import axe from "axe-core";
const panel = document.createElement("div");
panel.className = "ui-panel";
panel.style.margin = "16px 0";
const button = document.createElement("button");
button.className = "ui-button ui-button--secondary";
button.type = "button";
button.textContent = "Run accessibility audit";
const result = document.createElement("pre");
result.id = "accessibility-results";
result.style.whiteSpace = "pre-wrap";
result.style.fontSize = "12px";
result.setAttribute("role", "status");
panel.append(button, result);
document.querySelector("main")!.prepend(panel);
button.addEventListener("click", async () => {
  button.disabled = true;
  result.textContent = "Running accessibility checks…";
  try {
    const report = await axe.run(document, { preload: false, runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
    result.textContent = JSON.stringify({ view: location.hash || "overview", userAgent: navigator.userAgent, violations: report.violations.map(issue => ({ id: issue.id, impact: issue.impact, description: issue.description, nodes: issue.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), incomplete: report.incomplete.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) })), passes: report.passes.length }, null, 2);
  } finally { button.disabled = false; }
});
