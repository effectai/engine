export function estimatedWaitTime(workerCount: number): string {
  const mins = Math.round(workerCount * 3);
  return `Results usually ready in ${mins}–${mins + 15} minutes`;
}
