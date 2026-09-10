/**
 * Reuse indexes for immutable state/content arrays. Replace the array when its
 * membership changes, as gameplay transitions do; persisted values stay arrays.
 * Only the latest snapshot is held strongly. Older indexes can be collected.
 */
export function createMembershipIndex<T>() {
  const indexes = new WeakMap<readonly T[], ReadonlySet<T>>();
  let previous: readonly T[] | undefined;
  let previousIndex: ReadonlySet<T> | undefined;

  return (values: readonly T[]): ReadonlySet<T> => {
    if (values === previous && previousIndex) return previousIndex;
    let index = indexes.get(values);
    if (!index) {
      index = new Set(values);
      indexes.set(values, index);
    }
    previous = values;
    previousIndex = index;
    return index;
  };
}
