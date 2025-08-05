import { readFileSync, writeFileSync } from "fs";

/** make full filename from short name */
export const filename = (name: string) => `${name}.json`;

/** save json data to file */
export const save = (data: unknown, name: string) =>
  writeFileSync(filename(name), JSON.stringify(data, null, 2), "utf-8");

/** load json data from file */
export const load = (name: string) =>
  JSON.parse(readFileSync(filename(name), "utf-8"));


/** load and save json data as cache */
export const cache = async <Data>(func: () => Promise<Data>, name: string) => {
  console.log(name);
  try {
    return load(name) as Data;
  } catch (error) {
    const data = await func();
    save(data, name);
    return data;
  }
};
