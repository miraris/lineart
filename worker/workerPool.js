/* eslint no-await-in-loop: 0, no-loop-func: 0 */

const Pool = require('worker-threads-pool');
const got = require('got');
const { MongoClient } = require('mongodb');

const WORKERS = Number(process.env.WORKERS) || 5;
const pool = new Pool({ max: WORKERS });

(async () => {
  const client = new MongoClient('mongodb://mongo', { useNewUrlParser: true });
  await client.connect();

  const db = client.db('lineart');
  await db.collection('images').createIndex({ imageId: 1, score: 1, rating: 1 }, { unique: true });

  const handler = (err, worker) => {
    if (err) throw err;
    console.log(`worker spawned (pool size: ${pool.size})`);

    worker.on('exit', () => {
      console.log(`worker exited (pool size: ${pool.size})`);
    });

    worker.on('message', (imgs) => {
      if (!imgs.val) return;
      console.log(`Done in ${imgs.timeDiff / 10e2}s | id: ${imgs.val.imageId}`);
      db.collection('images')
        .insertOne(imgs.val)
        .catch(() => {});
    });
  };

  let page = 1;

  for (;;) {
    try {
      const response = await got(
        `https://danbooru.donmai.us/posts.json?limit=200&page=${page}`,
        { json: true },
      );

      if (!response.body.length) break;

      // idk whether there's a need to chunk here since a worker can just work on it's own page
      // still memory leaks for some reason because of a large queue?
      pool.acquire('./worker.js', { workerData: response.body }, handler);

      page++;
    } catch (error) {
      console.log(error.response);
      client.close();
      pool.destroy();
      break;
    }
  }

  // check pool length every 10 seconds, exit once it's empty
  const queueCheck = setInterval(() => {
    if (pool._queue.length !== 0) return;

    client.close();
    pool.destroy();
    clearInterval(queueCheck);
  }, 10e3);
})();
