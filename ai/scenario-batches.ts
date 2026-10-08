import { scenarioContentKey, type Scenario, type Suggestions } from './scenarios';

/** Remove only normalized, fully equivalent scenarios with identical requirement mapping. */
export function mergeScenarioBatches(batches: Suggestions[], renumber = true) {
  const scenarios: Scenario[] = [];
  const duplicates: {
    batch: number;
    removed: Scenario;
    retainedId: string;
    before?: Scenario;
    after?: Scenario;
  }[] = [];
  const changes: {
    batch: number;
    scenarioId: string;
    action: string;
    before: Scenario;
    after: Scenario;
  }[] = [];
  const seen = new Map<string, number>();
  batches.forEach((batch, index) => {
    for (const source of batch.scenarios) {
      const key = scenarioContentKey(source);
      const retainedIndex = seen.get(key);
      const retained = retainedIndex === undefined ? undefined : scenarios[retainedIndex];
      if (retained) {
        const priority = { critical: 3, normal: 2, minor: 1 } as const;
        if (priority[source.priority] > priority[retained.priority]) {
          const before = structuredClone(retained);
          retained.title = source.title;
          retained.steps = [...source.steps];
          retained.expectedResult = source.expectedResult;
          retained.priority = source.priority;
          duplicates.push({
            batch: index + 1,
            removed: structuredClone(source),
            retainedId: retained.id,
            before,
            after: structuredClone(retained),
          });
          changes.push({
            batch: index + 1,
            scenarioId: retained.id,
            action: 'Kept the higher-priority version of normalized equivalent content.',
            before,
            after: structuredClone(retained),
          });
        } else {
          duplicates.push({
            batch: index + 1,
            removed: structuredClone(source),
            retainedId: retained.id,
          });
          changes.push({
            batch: index + 1,
            scenarioId: source.id,
            action: 'Removed normalized equivalent content with identical requirement mapping.',
            before: structuredClone(source),
            after: structuredClone(retained),
          });
        }
        continue;
      }
      const scenario = structuredClone(source);
      if (renumber) {
        scenario.id = 'S-' + String(scenarios.length + 1).padStart(3, '0');
        if (scenario.id !== source.id)
          changes.push({
            batch: index + 1,
            scenarioId: scenario.id,
            action: 'Assigned a unique scenario ID during batch merge.',
            before: structuredClone(source),
            after: structuredClone(scenario),
          });
      }
      seen.set(key, scenarios.length);
      scenarios.push(scenario);
    }
  });
  return { suggestions: { scenarios }, duplicates, changes };
}
