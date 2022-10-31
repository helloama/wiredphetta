import { nanoid } from "nanoid";
import { BehaviorSubject } from "rxjs";

import { Primitive } from "./Primitive";
import { PrimitivesMeshJSON } from "./types";

export class PrimitivesMesh {
  readonly type = "Primitives";

  id = nanoid();
  isInternal = false;

  name$ = new BehaviorSubject<string | null>(null);

  primitives: Primitive[] = [];

  constructor(id?: string) {
    if (id) this.id = id;
  }

  get name() {
    return this.name$.value;
  }

  set name(name: string | null) {
    this.name$.next(name);
  }

  destroy() {
    this.name$.complete();
  }

  toJSON(): PrimitivesMeshJSON {
    const primitives = this.primitives.map((primitive) => primitive.toJSON());
    return {
      type: this.type,
      id: this.id,
      name: this.name,
      primitives,
    };
  }

  applyJSON(json: Partial<PrimitivesMeshJSON>) {
    if (json.name !== undefined) this.name = json.name;
    if (json.primitives !== undefined)
      this.primitives = json.primitives.map((primitiveJSON) => {
        const primitive = new Primitive();
        primitive.applyJSON(primitiveJSON);
        return primitive;
      });
  }

  static fromJSON(json: PrimitivesMeshJSON) {
    const mesh = new PrimitivesMesh(json.id);
    mesh.applyJSON(json);
    return mesh;
  }
}
