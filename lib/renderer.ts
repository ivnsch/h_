import { mat4, vec3 } from "gl-matrix";
import raytracer_kernel from "./shaders/raytracer_kernel.wgsl";
import screen_shader from "./shaders/screen_shader.wgsl";

export class Renderer {
  canvas: HTMLCanvasElement;

  // Device/Context objects
  adapter: GPUAdapter;
  device: GPUDevice;
  context: GPUCanvasContext;
  format: GPUTextureFormat;

  //Assets
  color_buffer: GPUTexture;
  color_buffer_view: GPUTextureView;
  sampler: GPUSampler;

  // Pipeline objects
  ray_tracing_pipeline: GPUComputePipeline;
  ray_tracing_bind_group: GPUBindGroup;
  screen_pipeline: GPURenderPipeline;
  screen_bind_group: GPUBindGroup;
  uniformBuffer: GPUBuffer;
  rotBuffer: GPUBuffer;
  parsBuffer: GPUBuffer;

  movement: vec3;
  rotX: number;
  rotY: number;
  rotZ: number;
  pars: vec3;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async Initialize() {
    this.movement = vec3.create();
    this.rotX = 0;
    this.rotY = 0;
    this.rotZ = 0;
    this.pars = vec3.create();

    await this.setupDevice();

    await this.createAssets();

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
    console.log("!! canvas: %o", this.canvas);
    this.context = <GPUCanvasContext>this.canvas.getContext("webgpu");
    this.format = "bgra8unorm";
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
    });
  }

  async makePipeline() {
    this.uniformBuffer = this.device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.rotBuffer = this.device.createBuffer({
      size: 4 * 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.parsBuffer = this.device.createBuffer({
      size: 4 * 4,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const ray_tracing_bind_group_layout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.COMPUTE,
          storageTexture: {
            access: "write-only",
            format: "rgba8unorm",
            viewDimension: "2d",
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {},
        },
        {
          binding: 2,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {},
        },
        {
          binding: 3,
          visibility: GPUShaderStage.COMPUTE,
          buffer: {},
        },
      ],
    });

    this.ray_tracing_bind_group = this.device.createBindGroup({
      layout: ray_tracing_bind_group_layout,
      entries: [
        {
          binding: 0,
          resource: this.color_buffer_view,
        },
        {
          binding: 1,
          resource: {
            buffer: this.uniformBuffer,
          },
        },
        {
          binding: 2,
          resource: {
            buffer: this.rotBuffer,
          },
        },
        {
          binding: 3,
          resource: {
            buffer: this.parsBuffer,
          },
        },
      ],
    });

    const ray_tracing_pipeline_layout = this.device.createPipelineLayout({
      bindGroupLayouts: [ray_tracing_bind_group_layout],
    });

    this.ray_tracing_pipeline = this.device.createComputePipeline({
      layout: ray_tracing_pipeline_layout,

      compute: {
        module: this.device.createShaderModule({
          code: raytracer_kernel,
        }),
        entryPoint: "main",
      },
    });

    const screen_bind_group_layout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {},
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {},
        },
      ],
    });

    this.screen_bind_group = this.device.createBindGroup({
      layout: screen_bind_group_layout,
      entries: [
        {
          binding: 0,
          resource: this.sampler,
        },
        {
          binding: 1,
          resource: this.color_buffer_view,
        },
      ],
    });

    const screen_pipeline_layout = this.device.createPipelineLayout({
      bindGroupLayouts: [screen_bind_group_layout],
    });

    this.screen_pipeline = this.device.createRenderPipeline({
      layout: screen_pipeline_layout,

      vertex: {
        module: this.device.createShaderModule({
          code: screen_shader,
        }),
        entryPoint: "vert_main",
      },

      fragment: {
        module: this.device.createShaderModule({
          code: screen_shader,
        }),
        entryPoint: "frag_main",
        targets: [
          {
            format: "bgra8unorm",
          },
        ],
      },

      primitive: {
        topology: "triangle-list",
      },
    });
  }

  async createAssets() {
    this.color_buffer = this.device.createTexture({
      size: {
        width: this.canvas.width,
        height: this.canvas.height,
      },
      format: "rgba8unorm",
      usage:
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.STORAGE_BINDING |
        GPUTextureUsage.TEXTURE_BINDING,
    });

    this.color_buffer_view = this.color_buffer.createView();

    const samplerDescriptor: GPUSamplerDescriptor = {
      addressModeU: "repeat",
      addressModeV: "repeat",
      magFilter: "linear",
      minFilter: "nearest",
      mipmapFilter: "nearest",
      maxAnisotropy: 1,
    };
    this.sampler = this.device.createSampler(samplerDescriptor);
  }

  render = (
    movement: vec3,
    rotX: number,
    rotY: number,
    rotZ: number,
    n: number,
    l: number,
    m: number
  ) => {
    this.movement[0] += movement[0];
    this.movement[1] += movement[1];
    this.movement[2] += movement[2];
    this.rotX += rotX;
    this.rotY += rotY;
    this.rotZ += rotZ;

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      <ArrayBuffer>this.movement
    );

    const rotMatrix = mat4.create();
    mat4.rotateX(rotMatrix, rotMatrix, this.rotX);
    mat4.rotateY(rotMatrix, rotMatrix, this.rotY);
    mat4.rotateZ(rotMatrix, rotMatrix, this.rotZ);
    this.device.queue.writeBuffer(this.rotBuffer, 0, <ArrayBuffer>rotMatrix);

    this.device.queue.writeBuffer(
      this.uniformBuffer,
      0,
      <ArrayBuffer>this.movement
    );

    this.pars[0] = n;
    this.pars[1] = l;
    this.pars[2] = m;
    this.device.queue.writeBuffer(this.parsBuffer, 0, <ArrayBuffer>this.pars);

    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();

    const ray_trace_pass: GPUComputePassEncoder =
      commandEncoder.beginComputePass();
    ray_trace_pass.setPipeline(this.ray_tracing_pipeline);
    ray_trace_pass.setBindGroup(0, this.ray_tracing_bind_group);
    ray_trace_pass.dispatchWorkgroups(
      Math.floor((this.canvas.width + 7) / 8),
      Math.floor((this.canvas.height + 7) / 8),
      1
    );
    ray_trace_pass.end();

    const textureView: GPUTextureView = this.context
      .getCurrentTexture()
      .createView();
    const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.5, g: 0.0, b: 0.25, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderpass.setPipeline(this.screen_pipeline);
    renderpass.setBindGroup(0, this.screen_bind_group);
    renderpass.draw(6, 1, 0, 0);

    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  };
}
