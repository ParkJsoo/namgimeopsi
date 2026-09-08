/** A closed review must never receive results from its pending requests. */
export function createReviewSession() {
  let generation = 0;
  const capture = () => {
    const captured = generation;
    return () => captured === generation;
  };
  return {
    capture,
    begin() {
      generation += 1;
      return capture();
    },
    invalidate() {
      generation += 1;
    },
  };
}
