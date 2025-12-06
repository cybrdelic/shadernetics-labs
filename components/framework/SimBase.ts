import React from 'react';
import { SimParam } from '../../types';
import { Mat4, Vec3 } from './MathUtils';

export class SimBase {
  public device: GPUDevice;
  public ctx: GPUCanvasContext;
  public format: GPUTextureFormat;
  public width = 0;
  public height = 0;

  // Built-in Camera
  public cameraPos = Vec3.create(5, 5, 5);
  public target = Vec3.create(0, 0, 0);
  public up = Vec3.create(0, 1, 0);
  public viewProjMat = Mat4.create();
  
  // Interaction State
  protected isDragging = false;
  protected lastMouse = { x: 0, y: 0 };
  protected yaw = -0.78;
  protected pitch = 0.5;
  protected dist = 10;

  // Params Registry
  private params: SimParam[] = [];
  protected paramValues: Record<string, any> = {};

  constructor(device: GPUDevice, ctx: GPUCanvasContext, format: GPUTextureFormat) {
    this.device = device;
    this.ctx = ctx;
    this.format = format;
  }

  // -- API FOR USER --

  // Register a parameter to appear in the UI
  addParam(param: SimParam) {
    this.params.push(param);
    this.paramValues[param.id] = param.value;
  }

  // Get current value of a param
  getParam(id: string) {
    return this.paramValues[id];
  }

  // Override this to handle updates (upload to GPU)
  onParamUpdate(id: string, value: any) {}

  // Helper to create a basic pipeline
  createPipeline(shaderCode: string, layout: 'auto' | GPUPipelineLayout = 'auto', topology: GPUPrimitiveTopology = 'triangle-list'): GPURenderPipeline {
    const module = this.device.createShaderModule({ code: shaderCode });
    return this.device.createRenderPipeline({
      layout,
      vertex: { module, entryPoint: 'vs_main' },
      fragment: { 
          module, 
          entryPoint: 'fs_main', 
          targets: [{ 
              format: this.format,
              blend: {
                  color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
                  alpha: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              }
          }] 
      },
      primitive: { topology },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      }
    });
  }

  // -- FRAMEWORK INTERNALS --

  getSchema() {
    return this.params;
  }

  setParam(id: string, value: any) {
    this.paramValues[id] = value;
    // Update internal param definition
    const p = this.params.find(x => x.id === id);
    if (p) p.value = value;
    
    this.onParamUpdate(id, value);
  }

  resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.ctx.canvas.width = w;
    this.ctx.canvas.height = h;
    this.updateCamera();
  }

  updateCamera() {
    // Standard Orbit Logic
    this.cameraPos[0] = Math.sin(this.yaw) * Math.cos(this.pitch) * this.dist;
    this.cameraPos[1] = Math.sin(this.pitch) * this.dist;
    this.cameraPos[2] = Math.cos(this.yaw) * Math.cos(this.pitch) * this.dist;

    const view = Mat4.create();
    const proj = Mat4.create();
    Mat4.lookAt(view, this.cameraPos, this.target, this.up);
    Mat4.perspective(proj, Math.PI / 4, this.width / this.height, 0.1, 200);
    Mat4.multiply(this.viewProjMat, proj, view);
  }

  onMouseDown(e: React.MouseEvent) {
    this.isDragging = true;
    this.lastMouse = { x: e.clientX, y: e.clientY };
  }

  onMouseMove(e: React.MouseEvent) {
    if (!this.isDragging) return;
    const dx = e.clientX - this.lastMouse.x;
    const dy = e.clientY - this.lastMouse.y;
    this.yaw -= dx * 0.005;
    this.pitch += dy * 0.005;
    this.pitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    this.lastMouse = { x: e.clientX, y: e.clientY };
    this.updateCamera();
  }

  onMouseUp() {
    this.isDragging = false;
  }
  
  onWheel(e: React.WheelEvent) {
      this.dist += e.deltaY * 0.01;
      this.dist = Math.max(2.0, Math.min(100.0, this.dist));
      this.updateCamera();
  }
}