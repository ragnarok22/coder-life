import type { GameData } from "./types";

const DB = "coder-life";
export interface SaveFile {
  version: 1;
  savedAt: number;
  game: GameData;
}
let database: Promise<IDBDatabase> | undefined;
function open() {
  database ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("saves");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      database = undefined;
      reject(req.error);
    };
  });
  return database;
}
async function transaction<T>(
  mode: IDBTransactionMode,
  action: (s: IDBObjectStore) => IDBRequest<T>,
) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction("saves", mode);
    const req = action(tx.objectStore("saves"));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error ?? new Error("Save transaction interrupted"));
  });
}
export async function saveGame(game: GameData) {
  await transaction("readwrite", (s) =>
    s.put(
      { version: 1, savedAt: Date.now(), game } satisfies SaveFile,
      "current",
    ),
  );
}
export async function loadGame(): Promise<SaveFile | null> {
  const value = await transaction("readonly", (s) => s.get("current"));
  if (!value) return null;
  if (
    value.version !== 1 ||
    !value.game ||
    !["home", "commute", "office"].includes(value.game.location) ||
    !Number.isFinite(value.game.minutes) ||
    !Array.isArray(value.game.position) ||
    value.game.position.length !== 2 ||
    !value.game.position.every(Number.isFinite) ||
    !value.game.stats ||
    !Array.isArray(value.game.flags) ||
    !Number.isFinite(value.game.energy) ||
    !Number.isFinite(value.game.stress) ||
    !Number.isFinite(value.game.productivity)
  ) {
    throw new Error(
      "This save is incompatible or damaged. You can start a new day.",
    );
  }
  return value as SaveFile;
}
export async function resetSave() {
  await transaction("readwrite", (s) => s.delete("current"));
}
