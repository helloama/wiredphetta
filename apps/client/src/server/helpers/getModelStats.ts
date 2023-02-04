import { Node, NodeIO } from "@gltf-transform/core";
import { extensions } from "engine";

import createDecoderModule from "../../../public/scripts/draco_decoder";

export type ModelStats = {
  fileSize: number;
  materialCount: number;
  meshCount: number;
  skinCount: number;
  boneCount: number;
  triangleCount: number;
};

export async function getModelStats(url: string): Promise<ModelStats> {
  // Fetch model
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const array = new Uint8Array(buffer);

  // Load model
  const io = new NodeIO()
    .registerExtensions(extensions)
    .registerDependencies({ "draco3d.decoder": await createDecoderModule() });

  const doc = await io.readBinary(array);

  // Get stats
  const materialCount = doc.getRoot().listMaterials().length;
  const meshCount = doc.getRoot().listMeshes().length;
  const skinCount = doc.getRoot().listSkins().length;

  const boneCount = doc
    .getRoot()
    .listSkins()
    .reduce((acc, skin) => {
      skin.listJoints().forEach((n) => acc.add(n));
      return acc;
    }, new Set<Node>()).size;

  const triangleCount = doc
    .getRoot()
    .listMeshes()
    .reduce((acc, mesh) => {
      return (
        acc +
        mesh.listPrimitives().reduce((acc, primitive) => {
          const mode = primitive.getMode();
          if (mode !== 4) return acc;

          const indices = primitive.getIndices();
          if (indices) return acc + indices.getCount() / 3;

          const position = primitive.getAttribute("POSITION");
          if (position) return acc + position.getCount() / 3;

          return acc;
        }, 0)
      );
    }, 0);

  return {
    fileSize: array.byteLength,
    materialCount,
    meshCount,
    skinCount,
    boneCount,
    triangleCount,
  };
}
