/* eslint no-await-in-loop: 0, no-loop-func: 0 */

const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const got = require('got');
const gm = require('gm');
const Jimp = require('jimp');

const imageRegex = /\.(gif|jpe?g|tiff|png)$/i;
const distance = (p1, p2) => (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2;

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
  const images = workerData.filter(
    m => m.large_file_url && m.score > 30 && m.rating === 's' && imageRegex.test(m.large_file_url),
  );

  for (const m of images) {
    const start = Date.now();

    gm(got.stream(m.large_file_url))
      .edge(1)
      .negative()
      .normalize()
      .colorspace('gray')
      .blur(0, 0.5)
      .toBuffer(async (err, buffer) => {
        if (err) console.error(err);

        const val = await Jimp.read(buffer)
          .then((image) => {
            let pixels = [];
            let minX = Infinity;
            let minY;

            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function scan(x, y, idx) {
              const red = this.bitmap.data[idx + 0];
              const green = this.bitmap.data[idx + 1];
              const blue = this.bitmap.data[idx + 2];

              if (red <= 230 && green <= 230 && blue <= 230) {
                if (x < minX) minX = x;
                if (minY === undefined) minY = y;

                pixels.push([x, y]);
              }
            });

            const { length } = pixels;

            if (!length || length > 10e4) return undefined;

            /*
             * TODO: better algorithm for sorting nearby pixels
             * Also, this might be better off inside order() since
             * we're already iterating over the whole array there
             */
            for (let i = 0; i < length; i++) {
              const pixel = pixels[i];

              pixel[0] -= minX;
              pixel[1] -= minY;
            }

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
      });
  }
})();
