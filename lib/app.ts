import { vec3 } from "gl-matrix";
import { Renderer } from "./renderer";

export class App {
  canvas: HTMLCanvasElement | null;
  renderer: Renderer;

  forwards_amount: number;
  right_amount: number;
  rotXAmount: number;
  rotYAmount: number;
  rotZAmount: number;
  n: () => string | null;
  l: () => string | null;
  m: () => string | null;

  constructor(
    canvas: HTMLCanvasElement | null,
    n: () => string | null,
    l: () => string | null,
    m: () => string | null,
    document: Document
  ) {
    this.canvas = canvas;

    this.renderer = new Renderer(canvas);

    this.forwards_amount = 0;
    this.right_amount = 0;
    this.rotXAmount = 0;
    this.rotYAmount = 0;
    this.rotZAmount = 0;

    this.n = n;
    this.l = l;
    this.m = m;

    document.addEventListener("keydown", (e) => {
      this.handle_keypress(e);
    });
    document.addEventListener("keyup", (e) => {
      this.handle_keyrelease(e);
    });

    if (this.canvas) {
      this.canvas.onclick = () => {
        this.canvas?.requestPointerLock();
      };
    }
  }

  async Initialize() {
    await this.renderer.Initialize();
  }

  run = () => {
    const v = vec3.fromValues(this.right_amount, 0, this.forwards_amount);
    this.renderer.render(
      v,
      this.rotXAmount,
      this.rotYAmount,
      this.rotZAmount,
      parseFloat(this.n() ?? "1"),
      parseFloat(this.l() ?? "0"),
      parseFloat(this.m() ?? "0")
    );

    requestAnimationFrame(this.run);
  };

  handle_keypress(event: KeyboardEvent) {
    if (event.code == "KeyW") {
      this.forwards_amount = 0.02;
    }
    if (event.code == "KeyS") {
      this.forwards_amount = -0.02;
    }
    if (event.code == "KeyA") {
      this.right_amount = -0.02;
    }
    if (event.code == "KeyD") {
      this.right_amount = 0.02;
    }
    if (event.code == "KeyX") {
      this.rotXAmount = 0.02;
    }
    if (event.code == "KeyY") {
      this.rotYAmount = 0.02;
    }
    if (event.code == "KeyZ") {
      this.rotZAmount = 0.02;
    }
  }

  handle_keyrelease(event: KeyboardEvent) {
    if (event.code == "KeyW") {
      this.forwards_amount = 0;
    }
    if (event.code == "KeyS") {
      this.forwards_amount = 0;
    }
    if (event.code == "KeyA") {
      this.right_amount = 0;
    }
    if (event.code == "KeyD") {
      this.right_amount = 0;
    }
    if (event.code == "KeyX") {
      this.rotXAmount = 0;
    }
    if (event.code == "KeyY") {
      this.rotYAmount = 0;
    }
    if (event.code == "KeyZ") {
      this.rotZAmount = 0;
    }
  }

  clearTransforms = () => {
    this.renderer.clearTransforms();
  };
}
