/** split array into adjacent pairs */
export const pairs = <Item>(array: Item[]): [Item, Item][] =>
  array
    .map((_, index) => array.slice(index, index + 2) as [Item, Item])
    .slice(0, -1);

/** calculate sum */
export const sum = (array: number[]) => array.reduce((a, b) => a + b, 0);

/** calculate average */
export const avg = (array: number[]) => sum(array) / array.length;

/** calculate median */
export const med = (array: number[]) => {
  const first = Math.ceil(array.length / 2) - 1;
  const second = Math.floor(array.length / 2) + 1;
  const sorted = [...array].sort((a, b) => a - b);
  return avg(sorted.slice(first, second));
};
