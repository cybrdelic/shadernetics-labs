import { SimBase } from './SimBase';

// USER CODE START
export class WebGPURenderer extends SimBase {
  
  // GPU Resources
  pipeline: GPURenderPipeline;
  uniformBuffer: GPUBuffer;
  bindGroup: GPUBindGroup;
  
  depthTexture: GPUTexture | null = null;
  depthTextureView: GPUTextureView | null = null;

  // CPU buffer to match shader struct
  uniformData = new Float32Array(32); 

  constructor(device: GPUDevice, ctx: GPUCanvasContext, format: GPUTextureFormat) {
    super(device, ctx, format);

    // 1. Define UI Controls
    this.addParam({ id: 'gridColor', label: 'Grid Color', type: 'vec3', value: [0.3, 0.32, 0.35] });
    this.addParam({ id: 'axisWidth', label: 'Axis Thickness', type: 'float', value: 0.05, min: 0.01, max: 0.2, step: 0.01 });
    this.addParam({ id: 'distortion', label: 'Wave Distortion', type: 'float', value: 0.0, min: 0.0, max: 5.0, step: 0.1 });
    this.addParam({ id: 'showFog', label: 'Distance Fog', type: 'bool', value: true });

    // 2. Setup Buffer
    this.uniformBuffer = device.createBuffer({
      size: 128, // 32 floats
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      label: 'Uniforms'
    });

    // 3. Create Pipeline (Shader)
    this.pipeline = this.createPipeline(`
        struct Uniforms {
          viewProj: mat4x4<f32>,
          gridColor: vec3<f32>,
          axisWidth: f32,
          distortion: f32,
          showFog: f32, // bool as float
        }
        @group(0) @binding(0) var<uniform> uniforms: Uniforms;

        struct VertexOutput {
          @builtin(position) Position: vec4<f32>,
          @location(0) worldPos: vec3<f32>,
        }

        @vertex
        fn vs_main(@builtin(vertex_index) VertexIndex: u32) -> VertexOutput {
          var pos = array<vec2<f32>, 6>(
            vec2<f32>(-200.0, 200.0),  vec2<f32>(200.0, 200.0),  vec2<f32>(-200.0, -200.0),
            vec2<f32>(-200.0, -200.0), vec2<f32>(200.0, 200.0),  vec2<f32>(200.0, -200.0)
          );
          
          let worldPos = vec3<f32>(pos[VertexIndex].x, 0.0, pos[VertexIndex].y);
          var output: VertexOutput;
          
          var distortedPos = worldPos;
          distortedPos.y += sin(worldPos.x * 0.1 + worldPos.z * 0.1) * uniforms.distortion * 2.0;

          output.Position = uniforms.viewProj * vec4<f32>(distortedPos, 1.0);
          output.worldPos = distortedPos;
          return output;
        }

        @fragment
        fn fs_main(@location(0) worldPos: vec3<f32>) -> @location(0) vec4<f32> {
          let gridColor = uniforms.gridColor; 
          
          let coord = worldPos.xz;
          let derivative = fwidth(coord);
          let gridDist = abs(fract(coord - 0.5) - 0.5) / derivative;
          let line = min(gridDist.x, gridDist.y);
          let gridAlpha = 1.0 - min(line, 1.0);
          
          let axisWidth = uniforms.axisWidth;
          let axisX = smoothstep(axisWidth + derivative.x, axisWidth - derivative.x, abs(worldPos.z));
          let axisZ = smoothstep(axisWidth + derivative.y, axisWidth - derivative.y, abs(worldPos.x));
          
          var color = gridColor;
          var alpha = gridAlpha * 0.3;
          
          if (axisX > 0.0) { color = mix(color, vec3(0.8, 0.2, 0.2), axisX); alpha = max(alpha, axisX); }
          if (axisZ > 0.0) { color = mix(color, vec3(0.2, 0.2, 0.8), axisZ); alpha = max(alpha, axisZ); }
          
          if (uniforms.showFog > 0.5) {
             let dist = length(worldPos);
             alpha *= (1.0 - smoothstep(20.0, 150.0, dist));
          }
          
          if (alpha <= 0.0) { discard; }
          return vec4<f32>(color * alpha, alpha);
        }
    `);

    // 4. Bind Group
    this.bindGroup = device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }]
    });

    this.uploadUniforms();
  }

  // Handle Dynamic Updates
  onParamUpdate() {
      this.uploadUniforms();
  }

  uploadUniforms() {
    // 0-15: Matrix (handled by SimBase, we just copy it)
    this.uniformData.set(this.viewProjMat, 0);

    // 16-18: Grid Color
    const c = this.getParam('gridColor');
    if (c) { this.uniformData[16] = c[0]; this.uniformData[17] = c[1]; this.uniformData[18] = c[2]; }

    // 19: Axis Width
    this.uniformData[19] = this.getParam('axisWidth');
    // 20: Distortion
    this.uniformData[20] = this.getParam('distortion');
    // 21: Fog
    this.uniformData[21] = this.getParam('showFog') ? 1.0 : 0.0;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniformData);
  }

  // Override Resize to update depth texture
  resize(w: number, h: number) {
      super.resize(w, h); // Handles camera aspect ratio
      
      if (this.depthTexture) this.depthTexture.destroy();
      this.depthTexture = this.device.createTexture({
          size: [w, h],
          format: 'depth24plus',
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
      });
      this.depthTextureView = this.depthTexture.createView();
      
      this.uploadUniforms(); // Re-upload matrix
  }

  // Main Loop
  render() {
    if (!this.depthTextureView) return;

    // Update Matrix every frame in case of mouse movement
    this.uploadUniforms();

    const cmd = this.device.createCommandEncoder();
    const pass = cmd.beginRenderPass({
      colorAttachments: [{
        view: this.ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.09, g: 0.09, b: 0.10, a: 1.0 }, 
        loadOp: 'clear', storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: this.depthTextureView,
        depthClearValue: 1.0, depthLoadOp: 'clear', depthStoreOp: 'store',
      },
    });

    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(6);
    pass.end();

    this.device.queue.submit([cmd.finish()]);
  }
}