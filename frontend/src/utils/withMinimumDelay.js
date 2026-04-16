export async function withMinimumDelay(task, delayMs = 2000) {
  const result = await Promise.all([task, new Promise((resolve) => setTimeout(resolve, delayMs))]);
  return result[0];
}
