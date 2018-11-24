/**
 * Chunk an array
 * @param {Array} source - source array
 * @param {number} size - chunk size
 */
// module.exports = function* chunk(source, size) {
//   const iter = source[Symbol.iterator]();

//   while (1) {
//     const result = [];
//     let i = 0;

//     while (i < size) {
//       const step = iter.next();
//       if (step.done) break;
//       result[i++] = step.value;
//     }
//     yield result;
//     if (i !== size) return;
//   }
// };

module.exports = (arr, size) => arr.reduce(
  (chunks, el, i) => (i % size ? chunks[chunks.length - 1].push(el) : chunks.push([el])) && chunks,
  [],
);
