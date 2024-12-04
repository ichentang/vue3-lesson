const queue = []; // 缓存当前要执行的队列

let isFlushing = false;

const resolvePromise = Promise.resolve();

// 在组建中更新多个状态，job为同一个
export function queueJob(job) {
  if (!queue.includes(job)) {
    queue.push(job);
  }

  if (!isFlushing) {
    isFlushing = true;

    resolvePromise.then(() => {
      isFlushing = false;
      const copy = queue.slice(0); //先拷贝在执行
      queue.length = 0;
      copy.forEach((job) => job());
      copy.length = 0;
    });
  }
}
