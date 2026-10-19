import Dexie, { type EntityTable } from "dexie";
import type { Workspace } from "./model";
export type Asset = { id: string; blob: Blob; name: string; createdAt: number };
const db = new Dexie("simpelin-v1") as Dexie & {
  workspace: EntityTable<{ id: string; data: Workspace }, "id">;
  assets: EntityTable<Asset, "id">;
};
db.version(1).stores({ workspace: "id", assets: "id" });
export default db;

export async function saveImageAsset(file: File, assetId: string) {
  await db.assets.put({
    id: assetId,
    blob: file,
    name: file.name,
    createdAt: Date.now(),
  });
}
