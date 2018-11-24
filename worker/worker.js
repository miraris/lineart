/* eslint no-await-in-loop: 0 */

// const { Database } = require('sqlite3');
const { parentPort, workerData } = require('worker_threads');
const Jimp = require('jimp');

const imageRegex = /\.(gif|jpe?g|tiff|png)$/i;
const distance = (p1, p2) => (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2;

const findNearestIndex = (point, list) => {
  let nearestDistSquared = Infinity;
  let nearestIndex;

  for (let i = 0; i < list.length; i++) {
    const curPoint = list[i];
    const distsq = distance(point, curPoint);

    if (distsq < nearestDistSquared) {
      nearestDistSquared = distsq;
      nearestIndex = i;
    }
  }

  return nearestIndex;
};

const order = (arr) => {
  const orderedList = [arr.shift()];

  while (arr.length > 0) {
    const nearestIndex = findNearestIndex(orderedList[orderedList.length - 1], arr);
    orderedList.push(arr.splice(nearestIndex, 1)[0]);
  }

  return orderedList;
};

(async () => {
  const images = workerData.filter(m => m.file_url && m.score > 4 && imageRegex.test(m.file_url));

  for (const m of images) {
    const start = Date.now();

    const val = await Jimp.read(m.file_url)
      .then((image) => {
        let pixels = [];

        if (image.bitmap.width > 800) {
          image = image.resize(800, Jimp.AUTO);
        }
        if (image.bitmap.height > 800) {
          image = image.resize(Jimp.AUTO, 800);
        }

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function scan(x, y, idx) {
          const red = this.bitmap.data[idx + 0];
          const green = this.bitmap.data[idx + 1];
          const blue = this.bitmap.data[idx + 2];

          if (red <= 230 && green <= 230 && blue <= 230) {
            pixels.push([x, y]);
          }
        });

        if (pixels.length > 10e4) return undefined;

        // TODO: better algorithm for sorting nearby pixels
        pixels = order(pixels);

        return {
          imageId: m.id,
          score: m.score,
          rating: m.rating,
          data: JSON.stringify(pixels),
        };
      })
      .catch(err => console.error(err));

    parentPort.postMessage({ val, timeDiff: Date.now() - start });
  }
})();
