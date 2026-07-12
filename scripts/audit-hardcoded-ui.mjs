import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const roots = ["app", "src/components", "src/screens", "src/hooks"];
const displayFields = /^(accessibilityHint|accessibilityLabel|body|caption|description|detail|emptyText|error|helper|hint|label|message|placeholder|primaryLabel|secondaryLabel|statusText|subtitle|text|title)$/i;
const displayCalls = new Set([
  "Alert.alert", "setEmailError", "setError", "setErrorText", "setMessage",
  "setPasswordError", "showAlert",
]);
const technicalValue = /^(#|\/|`\/|padding$|height$|min$|max$|jpg$|mp4$|image$|video$|audio$|Any$|Both$|Male$|Female$|Prefer not to say$|admin$|moderator$|user$|pending$|suspend(ed)?$|ban(ned)?$|dismiss(ed)?$|Promoted from admin tools$|Demoted from admin tools$|Suspended from admin tools$|Banned from admin tools$)/i;

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(file) : /\.tsx?$/.test(file) ? [file] : [];
  });
}

function ancestor(node, predicate) {
  for (let current = node.parent; current; current = current.parent) {
    if (predicate(current)) return current;
  }
  return undefined;
}

function callName(node, source) {
  const call = ancestor(node, ts.isCallExpression);
  return call?.expression.getText(source);
}

function isDisplayedInJsx(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isJsxAttribute(current)) return false;
    if (ts.isJsxExpression(current)) return current.expression === node;
    if (ts.isConditionalExpression(current)) {
      if (current.condition === node) return false;
      if (current.whenTrue === node || current.whenFalse === node) return true;
    }
    if (ts.isBinaryExpression(current)) {
      if (current.operatorToken.kind !== ts.SyntaxKind.BarBarToken) return false;
      if (current.right === node) return true;
    }
    if (ts.isCallExpression(current) || ts.isJsxElement(current)) return false;
  }
  return false;
}

const findings = [];
for (const file of roots.flatMap(walk)) {
  const input = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

  function visit(node) {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateExpression(node)) {
      const raw = ts.isTemplateExpression(node) ? node.getText(source) : node.text;
      if (!/[A-Za-z]/.test(raw)) return;
      if (technicalValue.test(raw.trim())) return;
      if (ts.isTemplateExpression(node) && !/[A-Za-z]{2,}\s+[A-Za-z]{2,}/.test(raw)) return;
      if (ancestor(node, ts.isImportDeclaration)) return;
      if (ancestor(node, (item) => ts.isCallExpression(item) && item.expression.getText(source) === "StyleSheet.create")) return;
      if (ancestor(node, (item) => ts.isCallExpression(item) && ["t", "tx"].includes(item.expression.getText(source)))) return;
      if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) return;
      if (ts.isLiteralTypeNode(node.parent)) return;

      let reason;
      if (isDisplayedInJsx(node)) reason = "jsx-expression";

      const call = callName(node, source);
      if (call && displayCalls.has(call)) {
        const property = ancestor(node, ts.isPropertyAssignment);
        const callNode = ancestor(node, ts.isCallExpression);
        const directArgument = callNode?.arguments.some((argument) => argument === node);
        if (directArgument || (property && displayFields.test(property.name.getText(source)))) reason = call;
      }

      const property = ancestor(node, ts.isPropertyAssignment);
      if (
        property && property.initializer === node && displayFields.test(property.name.getText(source)) &&
        ancestor(property, ts.isFunctionLike)
      ) reason = `field:${property.name.getText(source)}`;

      const jsxAttribute = ancestor(node, ts.isJsxAttribute);
      if (
        jsxAttribute && displayFields.test(jsxAttribute.name.getText(source)) &&
        (jsxAttribute.initializer === node || isDisplayedInJsx(node))
      ) reason = `prop:${jsxAttribute.name.getText(source)}`;

      if (reason) {
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
        findings.push(`${file}:${line} [${reason}] ${raw.replace(/\s+/g, " ").slice(0, 180)}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}

console.log(findings.join("\n"));
console.error(`Found ${findings.length} likely hardcoded UI strings.`);
process.exitCode = findings.length ? 1 : 0;
