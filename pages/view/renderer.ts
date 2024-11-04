import shader from "./shaders/shaders.wgsl";
import { TriangleMesh } from "./triangle_mesh";
import { mat4 } from "gl-matrix";
import { Camera } from "../model/camera";
import { Triangle } from "../model/triangle";

export class Renderer {
  canvas: HTMLCanvasElement;

  // Device/Context objects
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;

  // Pipeline objects
  uniformBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  pipeline: GPURenderPipeline;

  // Depth stencil

  depthStencilState: GPUDepthStencilState;
  depthStencilBuffer: GPUTexture;
  depthStencilView: GPUTextureView;
  depthStencilAttachment: GPURenderPassDepthStencilAttachment;

  uniformBuffer2: GPUBuffer;
  t: number = 0.0;

  // Assets
  triangleMesh: TriangleMesh;

  objectBuffer: GPUBuffer;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.t = 0.0;
  }

  async Initialize() {
    await this.setupDevice();

    await this.createAssets();

    await this.makeDepthBufferResources();

    await this.makePipeline();
  }

  async setupDevice() {
    //adapter: wrapper around (physical) GPU.
    //Describes features and limits
    this.adapter = <GPUAdapter>await navigator.gpu?.requestAdapter();
    //device: wrapper around GPU functionality
    //Function calls are made through the device
    this.device = <GPUDevice>await this.adapter?.requestDevice();
    //context: similar to vulkan instance (or OpenGL context)
    this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
    this.format = "bgra8unorm";
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
    });
  }

  async makeDepthBufferResources() {
    this.depthStencilState = {
      format: "depth24plus-stencil8",
      depthWriteEnabled: true,
      depthCompare: "less-equal",
    };

    const size: GPUExtent3D = {
      width: this.canvas.width,
      height: this.canvas.height,
      depthOrArrayLayers: 1,
    };

    const depthBufferDescriptor: GPUTextureDescriptor = {
      size: size,
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    };

    this.depthStencilBuffer = this.device.createTexture(depthBufferDescriptor);

    const viewDescriptor: GPUTextureViewDescriptor = {
      format: "depth24plus-stencil8",
      dimension: "2d",
      aspect: "all",
    };
    this.depthStencilView = this.depthStencilBuffer.createView();

    this.depthStencilAttachment = {
      view: this.depthStencilView,
      depthClearValue: 1.0,
      depthLoadOp: "clear",
      depthStoreOp: "store",
      stencilLoadOp: "clear",
      stencilStoreOp: "discard",
    };
  }

  async makePipeline() {
    this.uniformBuffer = this.device.createBuffer({
      size: 64 * 2,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.uniformBuffer2 = this.device.createBuffer({
      size: 4, // one f32
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.VERTEX,
          buffer: {
            type: "read-only-storage",
            hasDynamicOffset: false,
          },
        },
      ],
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
        {
          binding: 1,
          resource: {
            buffer: this.uniformBuffer2,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this.objectBuffer,
          },
        },
      ],
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      vertex: {
        module: this.device.createShaderModule({
          code: shader,
        }),
        entryPoint: "vs_main",
        buffers: [this.triangleMesh.bufferLayout],
      },

      fragment: {
        module: this.device.createShaderModule({
          code: shader,
        }),
        entryPoint: "fs_main",
        targets: [
          {
            format: this.format,
          },
        ],
      },

      primitive: {
        topology: "triangle-list",
      },

      depthStencil: this.depthStencilState,

      layout: pipelineLayout,
    });
  }

  async createAssets() {
    this.triangleMesh = new TriangleMesh(this.device);

    const modelBufferDescriptor: GPUBufferDescriptor = {
      size: 64 * 1024,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    };
    this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);
  }

  async render(camera: Camera, triangles: Float32Array, triangleCount: number) {
    this.t += 0.001;
    if (this.t > 2.0 * Math.PI) {
      this.t -= 2.0 * Math.PI;
    }

    //make transforms
    const projection = mat4.create();
    mat4.perspective(projection, Math.PI / 4, 800 / 600, 0.1, 10);

    const view = camera.get_view();

    this.device.queue.writeBuffer(
      this.objectBuffer,
      0,
      triangles,
      0,
      triangles.length
    );
    this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
    this.device.queue.writeBuffer(
      this.uniformBuffer,
      64,
      <ArrayBuffer>projection
    );

    const arrayBuffer = new ArrayBuffer(4);
    const floatArray = new Float32Array(arrayBuffer);
    floatArray[0] = this.t;
    this.device.queue.writeBuffer(this.uniformBuffer2, 0, arrayBuffer);

    //command encoder: records draw commands for submission
    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();
    //texture view: image view to the color buffer in this case
    const textureView: GPUTextureView = this.context
      .getCurrentTexture()
      .createView();
    //renderpass: holds draw commands, allocated from command encoder
    const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: this.depthStencilAttachment,
    });

    renderpass.setPipeline(this.pipeline);
    renderpass.setVertexBuffer(0, this.triangleMesh.buffer);
    renderpass.setBindGroup(0, this.bindGroup);
    renderpass.draw(3, triangleCount, 0, 0);
    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }
}
