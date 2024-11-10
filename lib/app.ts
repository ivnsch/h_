import { vec3 } from "gl-matrix";
import { Renderer } from "./renderer";

export class App {
  canvas: HTMLCanvasElement;
  renderer: Renderer;

  keyLabel: HTMLElement;
  mouseXLabel: HTMLElement;
  mouseYLabel: HTMLElement;
  setKeyText: (value: string) => void;
  setMouseXLabel: (value: string) => void;
  setMouseYLabel: (value: string) => void;

  forwards_amount: number;
  right_amount: number;
  rotXAmount: number;
  rotYAmount: number;
  rotZAmount: number;
  n: () => string;
  l: () => string;
  m: () => string;

  constructor(
    canvas: HTMLCanvasElement,
    setKeyText: (value: string) => void,
    setMouseXLabel: (value: string) => void,
    setMouseYLabel: (value: string) => void,
    n: () => string,
    l: () => string,
    m: () => string,
    document: Document
  ) {
    this.canvas = canvas;

    this.renderer = new Renderer(canvas);

    this.setKeyText = setKeyText;
    this.setMouseXLabel = setMouseXLabel;
    this.setMouseYLabel = setMouseYLabel;

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

    this.canvas.onclick = () => {
      this.canvas.requestPointerLock();
    };
    this.canvas.addEventListener("mousemove", (event: MouseEvent) => {
      this.handle_mouse_move(event);
    });
  }

  async Initialize() {
    await this.renderer.Initialize();
  }

  run = () => {
    var running: boolean = true;

    let v = vec3.fromValues(this.right_amount, 0, this.forwards_amount);
    this.renderer.render(
      v,
      this.rotXAmount,
      this.rotYAmount,
      this.rotZAmount,
      parseFloat(this.n()),
      parseFloat(this.l()),
      parseFloat(this.m())
    );

    if (running) {
      requestAnimationFrame(this.run);
    }
  };

  handle_keypress(event: any) {
    this.setKeyText(event.code);

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

  handle_keyrelease(event: any) {
    this.setKeyText(event.code);

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

  handle_mouse_move(event: MouseEvent) {
    this.setMouseXLabel(event.clientX.toString());
    this.setMouseYLabel(event.clientY.toString());
  }

  clearTransforms = () => {
    this.renderer.clearTransforms();
  };
}
