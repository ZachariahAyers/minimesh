/**
 * Get a subset of random elements from an array.
 * @param {T[]} arr - Array to get random elements from.
 * @return {T[]} - Array of random elements.
 * @category (Utils)
 * @author Zach Ayers
 */
export const getRandomElementSubset = <T>(arr: T[]): T[] => {
  let len = arr.length;
  let counter = Math.floor(Math.random() * 5) + 1;
  const result = new Array(counter);
  const taken = new Array(len);

  while (counter--) {
    const x = Math.floor(Math.random() * len);
    result[counter] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }

  return result;
};

/**
 * Reduce an array and merge any similar keys into an object.
 * @param {any[]} arr - Array to reduce.
 * @param {any} mainKey - Key to use as the main key.
 * @param {any} mergeKey - Key to use as the merge key.
 * @return {any} - Reduced array.
 * @author Zach Ayers
 */
export const reduceAndMergeKeys = <T>(
  arr: any[],
  mainKey: keyof T,
  mergeKey: keyof T
) => {
  return arr.reduce((c: Record<string, unknown[]>, v: T) => {
    const k = v[mainKey] as unknown as string;
    c[k] = c[k] || [];
    c[k].push(v[mergeKey]);
    return c;
  }, {});
};

/**
 * Get a specific 'page' from an array.
 * @param {any[]} array - Array to get page from.
 * @param {number} pageSize - Size of page to get.
 * @param {number} pageNumber - Page number to get.
 * @return {any[]} - Array of page elements.
 * @author Zach Ayers
 */
export const paginate = <T>(
  array: T[],
  pageSize: number,
  pageNumber: number
): T[] => array.slice(pageNumber * pageSize, pageNumber * pageSize + pageSize);

/**
 * Get all Distinct keys from an array.
 * @param {unknown[]} arr - Array to get distinct keys from.
 * @param {unknown} key - Key to get distinct values from.
 * @return {unknown} - Array of distinct values.
 * @author Zach Ayers
 */
export const getDistinctKeys = <T>(arr: T[], key: keyof T): T[typeof key][] =>
  Array.from(new Set(arr.map((u) => u[key])));
