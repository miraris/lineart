/* eslint no-await-in-loop: 0, no-loop-func: 0 */
require('events').EventEmitter.prototype._maxListeners = 200;

const Pool = require('worker-threads-pool');
const got = require('got');
const { MongoClient } = require('mongodb');

const WORKERS = Number(process.env.WORKERS) || 5;

const pool = new Pool({ max: WORKERS });

process.setMaxListeners(0);

(async () => {
  const url = 'mongodb://mongo';
  const client = new MongoClient(url, { useNewUrlParser: true });

  await client.connect();
  const db = client.db('lineart');
  await db.collection('images').createIndex({ score: 1, rating: 1 });

  let page = 1;

  while (1) {
    try {
      const response = await got(
        `https://danbooru.donmai.us/posts.json?tags=lineart&limit=200&page=${page}`,
        { json: true },
      );

      const { length } = response.body;

      if (!length) {
        client.close();
        pool.destroy();
        break;
      }

      // for (const piece of chunk(response.body, Math.max(length / WORKERS))) {

      // idk whether there's a need to chunk here since a worker can just work on it's own page
      // still memory leaks for some reason because of a large queue?
      pool.acquire('./worker.js', { workerData: response.body }, (err, worker) => {
        if (err) throw err;
        console.log(`worker spawned (pool size: ${pool.size})`);

        worker.on('exit', () => {
          console.log(`worker exited (pool size: ${pool.size})`);
        });

        worker.on('message', (imgs) => {
          if (!imgs.val) return;
          console.log(`Done in ${imgs.timeDiff}s`);
          db.collection('images').updateOne(imgs.val, imgs.val, { upsert: true });
        });
      });

      page++;
    } catch (error) {
      console.log(error.response);
      client.close();
      pool.destroy();
      break;
    }
  }
})();
