const RETRY_DELAYS_MS = [500, 1500, 4500];

function sleep(ms, signal) {
  if (signal === undefined) return new Promise((resolve) => setTimeout(resolve, ms));
  if (signal.aborted) return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

function describeError(error) {
  const cause = error?.cause;
  if (cause?.code) return `${String(error)} [${cause.code}]`;
  if (cause?.message) return `${String(error)} (${cause.message})`;
  return String(error);
}

async function fetchWithRetry(input, init, signal) {
  const attempts = RETRY_DELAYS_MS.length + 1;
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1], signal);
    try {
      return await fetch(input, { ...init, ...(signal !== undefined ? { signal } : {}) });
    } catch (error) {
      if (signal?.aborted === true) throw error;
      lastError = error;
    }
  }
  throw lastError;
}

export { RETRY_DELAYS_MS, describeError, fetchWithRetry };
