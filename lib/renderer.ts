/// <reference types="@webgpu/types" />
import { mat4, vec3 } from "gl-matrix";
import compute from "./shaders/compute.wgsl";
import compute_debug from "./shaders/compute_debug.wgsl";
import vertex_frag from "./shaders/vertex_frag.wgsl";
import vertex_frag_debug from "./shaders/vertex_frag_debug.wgsl";
import { getTransformationMatrix } from "./matrix";

export class Renderer {
  canvas: HTMLCanvasElement | null;

  // Device/Context objects
  adapter: GPUAdapter | null;
  device: GPUDevice | null;
  context: GPUCanvasContext | null;
  format: GPUTextureFormat | null;

  //Assets
  color_buffer: GPUTexture | null;
  color_buffer_view: GPUTextureView | null;
  sampler: GPUSampler | null;

  // Pipeline objects
  ray_tracing_pipeline: GPUComputePipeline | null;
  ray_tracing_bind_group: GPUBindGroup | null;
  screen_pipeline: GPURenderPipeline | null;
  screen_bind_group: GPUBindGroup | null;
  uniformBuffer: GPUBuffer | null;
  rotBuffer: GPUBuffer | null;
  parsBuffer: GPUBuffer | null;
  transformationBuffer: GPUBuffer | null;

  movement: vec3 | null;
  rotX: number | null;
  rotY: number | null;
  rotZ: number | null;
  pars: vec3 | null;

  constructor(canvas: HTMLCanvasElement | null) {
    this.canvas = canvas;
    this.adapter = null;
    this.device = null;
    this.context = null;
    this.format = null;
    this.color_buffer = null;
    this.color_buffer_view = null;
    this.sampler = null;
    this.ray_tracing_pipeline = null;
    this.ray_tracing_bind_group = null;
    this.screen_pipeline = null;
    this.screen_bind_group = null;
    this.uniformBuffer = null;
    this.rotBuffer = null;
    this.parsBuffer = null;
    this.movement = null;
    this.transformationBuffer = null;
    this.rotX = null;
    this.rotY = null;
    this.rotZ = null;
    this.pars = null;
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
    this.context = <GPUCanvasContext>this.canvas?.getContext("webgpu");
    this.format = "bgra8unorm";
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
    });
  }

  async makePipeline() {
    if (this.device) {
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
      this.transformationBuffer = this.device.createBuffer({
        size: 4 * 4 * 4,
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
            // code: compute,
            code: compute_debug,
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
          {
            binding: 2,
            visibility: GPUShaderStage.VERTEX,
            buffer: {},
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
          {
            binding: 2,
            resource: {
              buffer: this.transformationBuffer,
            },
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
            code: vertex_frag_debug,
            // code: vertex_frag,
          }),
          entryPoint: "vert_main",
        },

        fragment: {
          module: this.device.createShaderModule({
            code: vertex_frag_debug,
            // code: vertex_frag,
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
  }

  async createAssets() {
    if (this.canvas && this.device) {
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
    }

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

  clearTransforms = () => {
    this.movement[0] = 0;
    this.movement[1] = 0;
    this.movement[2] = 0;
    this.rotX = 0;
    this.rotY = 0;
    this.rotZ = 0;
  };

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

    const transformationMatrix = getTransformationMatrix(
      this.canvas,
      this.movement[0],
      this.movement[1],
      this.movement[2],
      this.rotX,
      this.rotY,
      this.rotZ
    );
    this.device.queue.writeBuffer(
      this.transformationBuffer,
      0,
      transformationMatrix
    );

    console.log("!! mov.z is: %o", this.movement[2]);

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
    if (this.canvas) {
      ray_trace_pass.dispatchWorkgroups(
        Math.floor((this.canvas.width + 7) / 8),
        Math.floor((this.canvas.height + 7) / 8),
        1
      );
    }
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
    // renderpass.draw(6, 1, 0, 0);
    renderpass.draw(36, 1, 0, 0);

    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  };
}
