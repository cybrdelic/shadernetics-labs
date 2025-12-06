

export enum ViewMode {
  GRID = 'GRID',
  FOCUSED = 'FOCUSED',
  LIST = 'LIST'
}

export enum ToolType {
  DATA = 'DATA_VIS',
  AI = 'REASONING_ENGINE',
  LOGS = 'SYSTEM_LOGS',
  CONTROLS = 'PARAM_CONTROLS',
  WEBGPU_DEBUG = 'WEBGPU_DEBUG',
  VIEWPORT = 'VIEWPORT',
  SYSTEM_INFO = 'SYSTEM_INFO',
  DOCS = 'DOCUMENTATION'
}

export interface MenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
  items?: MenuItem[];
}

export interface WindowState {
  id: string;
  type: ToolType;
  title: string;
  isOpen: boolean;
  position: { x: number; y: number };
  size?: { w: number; h: number };
  zIndex: number;
}

// -- Real WebGPU Types --

export interface LogEntry {
  id: number;
  ts: string;
  level: 'INFO' | 'WARN' | 'ERR' | 'OK';
  category: string;
  msg: string;
}

export interface GPUResourceRecord {
  id: string;
  type: 'Buffer' | 'Texture' | 'ShaderModule' | 'Pipeline';
  label: string;
  details: Record<string, string | number>;
}

// -- Sim Framework Types --

export type ParamType = 'float' | 'int' | 'bool' | 'color' | 'vec3';

export interface SimParam {
  id: string;
  label: string;
  type: ParamType;
  value: any;
  min?: number;
  max?: number;
  step?: number;
}

export interface SimState {
  params: SimParam[];
  // Helper to get value by id
  get: (id: string) => any; 
}

// -- WebGPU Global Augmentation --
declare global {
  type GPUTextureFormat = string;
  type GPUPrimitiveTopology = 'point-list' | 'line-list' | 'line-strip' | 'triangle-list' | 'triangle-strip';

  interface GPURequestAdapterOptions {
    powerPreference?: 'low-power' | 'high-performance';
    forceFallbackAdapter?: boolean;
  }

  interface Navigator {
    gpu: GPU;
  }

  interface GPU {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
    getPreferredCanvasFormat(): GPUTextureFormat;
  }

  interface GPUAdapterInfo {
    vendor: string;
    architecture: string;
    device: string;
    description: string;
  }

  interface GPUAdapter {
    name: string;
    features: Set<string>;
    limits: Record<string, number>;
    info?: GPUAdapterInfo;
    requestDevice(): Promise<GPUDevice>;
    requestAdapterInfo(): Promise<GPUAdapterInfo>;
  }

  interface GPUDevice {
    createBuffer(descriptor: any): GPUBuffer;
    createTexture(descriptor: any): GPUTexture;
    createShaderModule(descriptor: any): GPUShaderModule;
    createRenderPipeline(descriptor: any): GPURenderPipeline;
    createCommandEncoder(descriptor?: any): GPUCommandEncoder;
    createBindGroup(descriptor: any): GPUBindGroup;
    createBindGroupLayout(descriptor: any): GPUBindGroupLayout;
    createPipelineLayout(descriptor: any): GPUPipelineLayout;
    queue: GPUQueue;
    addEventListener(type: string, listener: (event: any) => void): void;
    [key: string]: any;
  }

  interface GPUQueue {
    writeBuffer(buffer: GPUBuffer, bufferOffset: number, data: BufferSource | SharedArrayBuffer, dataOffset?: number, size?: number): void;
    submit(commandBuffers: GPUCommandBuffer[]): void;
  }

  interface GPUCommandEncoder {
    beginRenderPass(descriptor: any): GPURenderPassEncoder;
    finish(): GPUCommandBuffer;
  }

  interface GPURenderPassEncoder {
    setPipeline(pipeline: GPURenderPipeline): void;
    setBindGroup(index: number, bindGroup: GPUBindGroup): void;
    draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
    end(): void;
  }

  interface GPUBuffer {
    destroy(): void;
  }
  interface GPUTexture {
    createView(descriptor?: any): GPUTextureView;
    destroy(): void;
  }
  interface GPUTextureView {}
  interface GPUShaderModule {}
  interface GPURenderPipeline {
    getBindGroupLayout(index: number): GPUBindGroupLayout;
  }
  interface GPUBindGroup {}
  interface GPUBindGroupLayout {}
  interface GPUPipelineLayout {}
  interface GPUCommandBuffer {}
  interface GPUCanvasContext {
    canvas: HTMLCanvasElement;
    configure(config: any): void;
    getCurrentTexture(): GPUTexture;
  }

  interface HTMLCanvasElement {
    getContext(contextId: 'webgpu'): GPUCanvasContext | null;
  }

  interface GPUUncapturedErrorEvent extends Event {
    error: { message: string };
  }

  var GPUBufferUsage: {
    UNIFORM: number;
    COPY_DST: number;
    VERTEX: number;
    INDEX: number;
    STORAGE: number;
    [key: string]: number;
  };

  var GPUTextureUsage: {
    RENDER_ATTACHMENT: number;
    COPY_DST: number;
    TEXTURE_BINDING: number;
    [key: string]: number;
  };
  
  var GPUShaderStage: {
    VERTEX: number;
    FRAGMENT: number;
    COMPUTE: number;
  };
}