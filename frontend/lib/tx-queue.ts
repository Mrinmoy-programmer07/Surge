// Simple in-memory transaction queue to serialize wallet writes
// This avoids nonce clashes when multiple API routes send txs simultaneously using the same account.

let last: Promise<any> = Promise.resolve();

export function enqueueWalletTx<T>(task: () => Promise<T>): Promise<T> {
  const run = last.then(task, task);
  // Chain to ensure next waits for this one to settle
  last = run.catch(() => {});
  return run;
}
