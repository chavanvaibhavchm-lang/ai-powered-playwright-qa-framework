import ts from 'typescript';
import { readdir, readFile } from 'node:fs/promises';
import { relative, join } from 'node:path';
import { createHash } from 'node:crypto';
import { projectPath, type Inspection } from './application';
import { verifiedElements } from './scenario-evidence';
export interface PomMethod {
  id: string;
  file: string;
  className: string;
  name: string;
  parameters: { name: string; type: string }[];
  locators: { property: string; expression: string; uiId: string }[];
  reusable: boolean;
  reason: string;
  sourceHash: string;
}
export const digest = (text: string) => createHash('sha256').update(text).digest('hex');
export function normalizeLocator(source: string): string | undefined {
  const ast = ts.createSourceFile('locator.ts', source, ts.ScriptTarget.Latest, true);
  const statement = ast.statements[0];
  if (
    ast.statements.length !== 1 ||
    !statement ||
    !ts.isExpressionStatement(statement) ||
    !ts.isCallExpression(statement.expression)
  )
    return undefined;
  const call = statement.expression;
  if (
    !ts.isPropertyAccessExpression(call.expression) ||
    call.expression.expression.getText(ast) !== 'page' ||
    call.arguments.some((a) => !literal(a))
  )
    return undefined;
  function value(node: ts.Expression): unknown {
    if (ts.isStringLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isObjectLiteralExpression(node))
      return Object.fromEntries(
        node.properties
          .filter(ts.isPropertyAssignment)
          .map((p) => [
            ts.isIdentifier(p.name) || ts.isStringLiteral(p.name) ? p.name.text : '',
            value(p.initializer),
          ])
          .sort(([a], [b]) => String(a).localeCompare(String(b))),
      );
    return undefined;
  }
  return JSON.stringify([call.expression.name.text, call.arguments.map(value)]);
}
export async function discoverPoms(
  root: string,
  directory: string,
  inspection: Inspection,
): Promise<PomMethod[]> {
  if (!directory) return [];
  const base = await projectPath(root, directory);
  const files: string[] = [];
  async function walk(dir: string, depth: number) {
    if (depth > 4) throw new Error('POM directory exceeds depth limit');
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory() && !['node_modules', '.git', '.local'].includes(entry.name))
        await walk(join(dir, entry.name), depth + 1);
      if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts'))
        files.push(join(dir, entry.name));
      if (files.length > 40) throw new Error('POM discovery exceeds 40 files');
    }
  }
  await walk(base, 0);
  const results: PomMethod[] = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    if (source.length > 100_000) throw new Error('POM file too large');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const classes = ast.statements.filter(ts.isClassDeclaration);
    let moduleSafe =
      classes.length === 1 &&
      ast.statements.every(
        (n) =>
          ts.isClassDeclaration(n) ||
          (ts.isImportDeclaration(n) &&
            ts.isStringLiteral(n.moduleSpecifier) &&
            n.moduleSpecifier.text === '@playwright/test'),
      );
    for (const c of classes) {
      const className = c.name?.text ?? '';
      if (
        !c.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ||
        c.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword) ||
        !className ||
        c.heritageClauses ||
        ts.getDecorators(c)?.length ||
        c.members.filter(ts.isConstructorDeclaration).length !== 1
      )
        moduleSafe = false;
      const definitions = new Map<string, string>();
      const methods = c.members.filter(ts.isMethodDeclaration);
      for (const member of c.members) {
        if (
          (ts.canHaveDecorators(member) && ts.getDecorators(member)?.length) ||
          (member.name && !ts.isIdentifier(member.name))
        )
          moduleSafe = false;
        if (ts.isPropertyDeclaration(member)) {
          if (
            member.initializer ||
            member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
          )
            moduleSafe = false;
        } else if (ts.isConstructorDeclaration(member)) {
          if (
            member.parameters.some(
              (p) => p.initializer || p.dotDotDotToken || ts.getDecorators(p)?.length,
            ) ||
            member.parameters.length !== 1 ||
            member.parameters[0]?.name.getText(ast) !== 'page' ||
            member.parameters[0]?.type?.getText(ast) !== 'Page'
          )
            moduleSafe = false;
          for (const stmt of member.body?.statements ?? []) {
            const text = stmt.getText(ast);
            const match =
              /^this\.(\w+)\s*=\s*(?:this\.)?page\.(locator|getByRole|getByLabel|getByTestId|getByPlaceholder)\(([\s\S]*)\);?$/.exec(
                text,
              );
            if (!match) {
              moduleSafe = false;
              continue;
            }
            const expr = 'page.' + match[2] + '(' + match[3] + ')';
            // The entire RHS must consist solely of literals and object literal options.
            const assignment =
              ts.isExpressionStatement(stmt) && ts.isBinaryExpression(stmt.expression)
                ? stmt.expression.right
                : undefined;
            if (
              !assignment ||
              !ts.isCallExpression(assignment) ||
              assignment.arguments.some((a) => !literal(a))
            )
              moduleSafe = false;
            definitions.set(match[1]!, expr);
          }
        } else if (!ts.isMethodDeclaration(member)) moduleSafe = false;
      }
      const parsed = methods.map((m) => {
        const name = m.name.getText(ast);
        if (
          m.parameters.some(
            (p) =>
              p.initializer ||
              p.dotDotDotToken ||
              !ts.isIdentifier(p.name) ||
              ts.getDecorators(p)?.length,
          )
        )
          moduleSafe = false;
        const parameters = m.parameters.map((p) => ({
          name: p.name.getText(ast),
          type: p.type?.getText(ast) ?? 'unknown',
        }));
        const refs: string[] = [];
        let safe =
          !!m.body &&
          !m.modifiers?.some((mod) =>
            [
              ts.SyntaxKind.PrivateKeyword,
              ts.SyntaxKind.ProtectedKeyword,
              ts.SyntaxKind.StaticKeyword,
            ].includes(mod.kind),
          );
        for (const statement of m.body?.statements ?? []) {
          let expr = ts.isExpressionStatement(statement)
            ? statement.expression
            : ts.isReturnStatement(statement)
              ? statement.expression
              : undefined;
          if (expr && ts.isAwaitExpression(expr)) expr = expr.expression;
          if (
            !expr ||
            !ts.isCallExpression(expr) ||
            !ts.isPropertyAccessExpression(expr.expression)
          ) {
            safe = false;
            continue;
          }
          const call = expr.expression;
          const target = call.expression.getText(ast);
          const action = call.name.text;
          const property = /^this\.(\w+)$/.exec(target)?.[1];
          if (
            property === 'page' &&
            action === 'goto' &&
            expr.arguments.length === 1 &&
            ts.isStringLiteral(expr.arguments[0]!)
          )
            continue;
          if (
            !property ||
            !definitions.has(property) ||
            !['click', 'fill', 'isVisible', 'textContent', 'selectOption', 'check'].includes(action)
          ) {
            safe = false;
            continue;
          }
          refs.push(property);
          if (
            ['fill', 'selectOption'].includes(action) &&
            (expr.arguments.length !== 1 ||
              !ts.isIdentifier(expr.arguments[0]!) ||
              !parameters.some(
                (p) => p.name === expr.arguments[0]!.getText(ast) && p.type === 'string',
              ))
          )
            safe = false;
          if (
            expr.arguments.some(
              (a) =>
                !literal(a) &&
                !(
                  ts.isIdentifier(a) &&
                  parameters.some((p) => p.name === a.text && p.type === 'string')
                ),
            )
          )
            safe = false;
        }
        return { name, parameters, refs, safe };
      });
      // Imported POM modules must be passive and every method statically restricted.
      moduleSafe &&= parsed.every((m) => m.safe);
      for (const m of parsed) {
        const locators = m.refs.map((property) => {
          const expression = definitions.get(property)!;
          const normalized = normalizeLocator(expression);
          const element = verifiedElements(inspection).find((e) =>
            e.verifiedLocators.some((l) => normalized && normalizeLocator(l) === normalized),
          );
          return { property, expression, uiId: element?.id ?? '' };
        });
        const credentialMethod = locators.some(
          (l) =>
            inspection.elements.find((e) => e.id === l.uiId)?.inputType === 'password' ||
            /password|credential/i.test(l.property + ' ' + l.expression),
        );
        const reusable =
          moduleSafe &&
          !credentialMethod &&
          m.safe &&
          locators.length > 0 &&
          locators.every((l) => l.uiId) &&
          m.parameters.every((p) => p.type === 'string');
        results.push({
          id: relative(root, file).replace(/\\/g, '/') + '#' + className + '.' + m.name,
          file: relative(root, file).replace(/\\/g, '/'),
          className,
          name: m.name,
          parameters: m.parameters,
          locators,
          reusable,
          reason: reusable
            ? 'Verified simple POM method'
            : credentialMethod
              ? 'Credential entry is blocked. Use local authenticated storage state and inspect the destination.'
              : !moduleSafe || !m.safe
                ? 'Source uses unsupported POM structure or dynamic methods. Review source; automatic reuse is disabled.'
                : !locators.length
                  ? 'Method has no verified control references; navigation alone is not locator evidence.'
                  : 'Referenced controls are not verified on ' +
                    inspection.url +
                    ': ' +
                    locators
                      .filter((l) => !l.uiId)
                      .map((l) => l.property)
                      .join(', ') +
                    '. Inspect the relevant page before reuse.',
          sourceHash: digest(source),
        });
      }
    }
  }
  return results.slice(0, 200);
}
function literal(n: ts.Node): boolean {
  return (
    ts.isStringLiteral(n) ||
    ts.isNumericLiteral(n) ||
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(n.kind) ||
    (ts.isObjectLiteralExpression(n) &&
      n.properties.every(
        (p) =>
          ts.isPropertyAssignment(p) &&
          (ts.isIdentifier(p.name) || ts.isStringLiteral(p.name)) &&
          literal(p.initializer),
      ))
  );
}
export function relevantPoms(methods: PomMethod[], title: string, steps: string[]): PomMethod[] {
  const words = (title + ' ' + steps.join(' ')).toLowerCase().match(/[a-z]{3,}/g) ?? [];
  return methods
    .filter(
      (m) =>
        m.reusable && words.some((w) => (m.className + ' ' + m.name).toLowerCase().includes(w)),
    )
    .slice(0, 5);
}
