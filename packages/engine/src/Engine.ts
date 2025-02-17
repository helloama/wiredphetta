import { BehaviorModule } from "./behavior/BehaviorModule";
import { DEFAULT_CONTROLS } from "./constants";
import { InputModule } from "./input/InputModule";
import { PhysicsModule } from "./physics/PhysicsModule";
import { PlayerModules } from "./player/PlayerModule";
import { RenderModule } from "./render/RenderModule";
import { SceneModule } from "./scene/SceneModule";
import { ControlsType } from "./types";

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
}

/**
 * The main engine class.
 *
 * Uses two canvases, one for rendering and one for UI elements.
 * Requires {@link https://web.dev/cross-origin-isolation-guide/ cross-origin isolation} to be enabled.
 */
export class Engine {
  readonly canvas: HTMLCanvasElement;
  readonly overlayCanvas: HTMLCanvasElement;

  readonly behavior: BehaviorModule;
  readonly input: InputModule;
  physics: PhysicsModule;
  readonly player: PlayerModules;
  readonly render: RenderModule;
  readonly scene: SceneModule;

  inputPosition: Int16Array;
  inputRotation: Int16Array;
  userPosition: Int32Array;
  userRotation: Int16Array;
  cameraPosition: Int32Array;
  cameraYaw: Int16Array;

  #isPlaying = false;
  #controls: ControlsType = DEFAULT_CONTROLS;
  #showColliders = false;
  #showBVH = false;

  /**
   * Creates a new engine instance.
   *
   * @param canvas The canvas to render to.
   * @param overlayCanvas The canvas to render the overlay to.
   */
  constructor({ canvas, overlayCanvas }: EngineOptions) {
    this.canvas = canvas;
    this.overlayCanvas = overlayCanvas;

    this.inputPosition = new Int16Array(new SharedArrayBuffer(Int16Array.BYTES_PER_ELEMENT * 2));
    this.inputRotation = new Int16Array(new SharedArrayBuffer(Int16Array.BYTES_PER_ELEMENT * 2));
    this.userPosition = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 3));
    this.userRotation = new Int16Array(new SharedArrayBuffer(Int16Array.BYTES_PER_ELEMENT * 4));
    this.cameraPosition = new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * 3));
    this.cameraYaw = new Int16Array(new SharedArrayBuffer(Int16Array.BYTES_PER_ELEMENT));

    this.behavior = new BehaviorModule(this);
    this.input = new InputModule(this);
    this.physics = new PhysicsModule(this);
    this.player = new PlayerModules(this);
    this.render = new RenderModule(this);
    this.scene = new SceneModule(this);
  }

  get controls() {
    return this.#controls;
  }

  set controls(value: ControlsType) {
    if (value === this.#controls) return;
    this.#controls = value;
    this.input.keyboard.controls = value;
    this.render.send({ subject: "set_controls", data: value });
    this.physics.send({ subject: "set_controls", data: value });
  }

  get showColliders() {
    return this.#showColliders;
  }

  set showColliders(value: boolean) {
    if (value === this.#showColliders) return;
    this.#showColliders = value;
    this.render.send({ subject: "toggle_collider_visuals", data: value });
    this.physics.send({ subject: "toggle_collider_visuals", data: value });
  }

  get showBVH() {
    return this.#showBVH;
  }

  set showBVH(value: boolean) {
    if (value === this.#showBVH) return;
    this.#showBVH = value;
    this.render.send({ subject: "toggle_bvh_visuals", data: value });
  }

  get isPlaying() {
    return this.#isPlaying;
  }

  start() {
    if (this.#isPlaying) return;
    this.#isPlaying = true;
    this.physics.send({ subject: "start", data: null });
  }

  stop() {
    if (!this.#isPlaying) return;
    this.#isPlaying = false;
    this.physics.send({ subject: "stop", data: null });
  }

  /**
   * Used to refresh the engine (such as during a hot reload).
   * The physics thread needs to be destroyed and recreated, something to do with wasm.
   */
  async reset() {
    this.scene.clear();
    await this.physics.reset();
  }

  destroy() {
    this.render.destroy();
    this.input.destroy();
    this.physics.destroy();
    this.behavior.destroy();
  }
}
