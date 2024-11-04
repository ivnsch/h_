import { Renderer } from "../view/renderer";
import { Scene } from "../model/scene";

export class App {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  scene: Scene;

  //Labels for displaying state
  keyLabel: HTMLElement;
  mouseXLabel: HTMLElement;
  mouseYLabel: HTMLElement;
  setKeyText: (value: string) => void;
  setMouseXLabel: (value: string) => void;
  setMouseYLabel: (value: string) => void;

  forwards_amount: number;
  right_amount: number;

  constructor(
    canvas: HTMLCanvasElement,
    setKeyText: (value: string) => void,
    setMouseXLabel: (value: string) => void,
    setMouseYLabel: (value: string) => void,
    document: Document
  ) {
    this.canvas = canvas;

    this.renderer = new Renderer(canvas);

    this.scene = new Scene();

    this.setKeyText = setKeyText;
    this.setMouseXLabel = setMouseXLabel;
    this.setMouseYLabel = setMouseYLabel;

    this.forwards_amount = 0;
    this.right_amount = 0;

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

    this.scene.update();
    this.scene.move_player(this.forwards_amount, this.right_amount);

    this.renderer.render(
      this.scene.get_player(),
      this.scene.get_triangles(),
      this.scene.triangle_count
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
  }

  handle_mouse_move(event: MouseEvent) {
    this.setMouseXLabel(event.clientX.toString());
    this.setMouseYLabel(event.clientY.toString());
    this.scene.spin_player(event.movementX / 5, event.movementY / 5);
  }
}
