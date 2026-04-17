export function withMinimumDelay(task, delayMs = 2000) {
  if (typeof task === "function") {
    return async (...args) => {
      const result = await Promise.all([
        Promise.resolve().then(() => task(...args)),
        new Promise((resolve) => setTimeout(resolve, delayMs))
      ]);
      return result[0];
    };
  }

  return Promise.all([Promise.resolve(task), new Promise((resolve) => setTimeout(resolve, delayMs))]).then(
    (result) => result[0]
  );
}
