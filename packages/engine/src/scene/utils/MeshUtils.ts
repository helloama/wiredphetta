import { Document, Mesh } from "@gltf-transform/core";
import { nanoid } from "nanoid";

import { PrimitiveUtils } from "./PrimitiveUtils";
import { Utils } from "./types";

type PrimitiveId = string;

type BoxMesh = {
  type: "Box";
  width: number;
  height: number;
  depth: number;
};

type SphereMesh = {
  type: "Sphere";
  radius: number;
  widthSegments: number;
  heightSegments: number;
};

type CylinderMesh = {
  type: "Cylinder";
  radiusTop: number;
  radiusBottom: number;
  height: number;
  radialSegments: number;
};

type ModelMesh = {
  type: "Model";
  uri: string;
};

export type MeshExtras = {
  customMesh?: BoxMesh | SphereMesh | CylinderMesh | ModelMesh;
};

export interface MeshJSON {
  primitives: PrimitiveId[];
  weights: number[];
  extras?: MeshExtras;
}

export class MeshUtils implements Utils<Mesh, MeshJSON> {
  #doc: Document;
  #primitive: PrimitiveUtils;

  store = new Map<string, Mesh>();

  constructor(doc: Document, primitive: PrimitiveUtils) {
    this.#doc = doc;
    this.#primitive = primitive;
  }

  getId(mesh: Mesh) {
    for (const [id, m] of this.store) {
      if (m === mesh) return id;
    }
  }

  create(json: Partial<MeshJSON> = {}, id?: string) {
    const mesh = this.#doc.createMesh();
    this.applyJSON(mesh, json);

    const { id: meshId } = this.process(mesh, id);

    return { id: meshId, object: mesh };
  }

  process(mesh: Mesh, id?: string) {
    const meshId = id ?? nanoid();
    this.store.set(meshId, mesh);

    mesh.addEventListener("dispose", () => {
      this.store.delete(meshId);
    });

    return { id: meshId };
  }

  processChanges() {
    const changed: Mesh[] = [];

    // Add new meshes
    this.#doc
      .getRoot()
      .listMeshes()
      .forEach((mesh) => {
        const meshId = this.getId(mesh);
        if (meshId) return;

        this.process(mesh);
        changed.push(mesh);
      });

    return changed;
  }

  applyJSON(mesh: Mesh, json: Partial<MeshJSON>) {
    if (json.primitives) {
      for (const primitiveId of json.primitives) {
        const primitive = this.#primitive.store.get(primitiveId);
        if (!primitive) throw new Error("Primitive not found");

        mesh.addPrimitive(primitive);
      }
    }

    if (json.weights) {
      mesh.setWeights(json.weights);
    }

    if (json.extras) {
      mesh.setExtras(json.extras);
    }
  }

  toJSON(mesh: Mesh): MeshJSON {
    const primitiveIds = mesh.listPrimitives().map((primitive) => {
      const id = this.#primitive.getId(primitive);
      if (!id) throw new Error("Primitive not found");
      return id;
    });

    return {
      primitives: primitiveIds,
      weights: mesh.getWeights(),
      extras: mesh.getExtras() as MeshExtras,
    };
  }
}
