import { readFileSync, writeFileSync } from "fs";

export const filename = (name: string) => `${name}.json`;

export const save = (data: unknown, name: string) =>
  writeFileSync(filename(name), JSON.stringify(data, null, 2), "utf-8");

export const load = (name: string) =>
  JSON.parse(readFileSync(filename(name), "utf-8"));

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
