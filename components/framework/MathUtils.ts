

// Minimal Math Library for WebGPU Camera

export class Vec3 {
  static create(x = 0, y = 0, z = 0): Float32Array {
    return new Float32Array([x, y, z]);
  }

  static normalize(out: Float32Array, a: Float32Array): Float32Array {
    const x = a[0], y = a[1], z = a[2];
    let len = x * x + y * y + z * z;
    if (len > 0) {
      len = 1 / Math.sqrt(len);
      out[0] = a[0] * len;
      out[1] = a[1] * len;
      out[2] = a[2] * len;
    }
    return out;
  }

  static subtract(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  }

  static cross(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
}

export class Mat4 {
  static create(): Float32Array {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  static perspective(out: Float32Array, fovy: number, aspect: number, near: number, far: number): Float32Array {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
  }

  static lookAt(out: Float32Array, eye: Float32Array, center: Float32Array, up: Float32Array): Float32Array {
    let x0 = 0, x1 = 0, x2 = 0, y0 = 0, y1 = 0, y2 = 0, z0 = 0, z1 = 0, z2 = 0, len = 0;
    const eyex = eye[0], eyey = eye[1], eyez = eye[2];
    const upx = up[0], upy = up[1], upz = up[2];
    const centerx = center[0], centery = center[1], centerz = center[2];

    if (Math.abs(eyex - centerx) < 0.00001 &&
        Math.abs(eyey - centery) < 0.00001 &&
        Math.abs(eyez - centerz) < 0.00001) {
      return Mat4.identity(out);
    }

    let z0_ = eyex - centerx;
    let z1_ = eyey - centery;
    let z2_ = eyez - centerz;

    len = 1 / Math.sqrt(z0_ * z0_ + z1_ * z1_ + z2_ * z2_);
    z0_ *= len;
    z1_ *= len;
    z2_ *= len;

    let x0_ = upy * z2_ - upz * z1_;
    let x1_ = upz * z0_ - upx * z2_;
    let x2_ = upx * z1_ - upy * z0_;
    len = Math.sqrt(x0_ * x0_ + x1_ * x1_ + x2_ * x2_);
    if (!len) {
      x0_ = 0;
      x1_ = 0;
      x2_ = 0;
    } else {
      len = 1 / len;
      x0_ *= len;
      x1_ *= len;
      x2_ *= len;
    }

    let y0_ = z1_ * x2_ - z2_ * x1_;
    let y1_ = z2_ * x0_ - z0_ * x2_;
    let y2_ = z0_ * x1_ - z1_ * x0_;

    len = Math.sqrt(y0_ * y0_ + y1_ * y1_ + y2_ * y2_);
    if (!len) {
      y0_ = 0;
      y1_ = 0;
      y2_ = 0;
    } else {
      len = 1 / len;
      y0_ *= len;
      y1_ *= len;
      y2_ *= len;
    }

    out[0] = x0_;
    out[1] = y0_;
    out[2] = z0_;
    out[3] = 0;
    out[4] = x1_;
    out[5] = y1_;
    out[6] = z1_;
    out[7] = 0;
    out[8] = x2_;
    out[9] = y2_;
    out[10] = z2_;
    out[11] = 0;
    out[12] = -(x0_ * eyex + x1_ * eyey + x2_ * eyez);
    out[13] = -(y0_ * eyex + y1_ * eyey + y2_ * eyez);
    out[14] = -(z0_ * eyex + z1_ * eyey + z2_ * eyez);
    out[15] = 1;

    return out;
  }

  static identity(out: Float32Array): Float32Array {
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  }
  
  static multiply(out: Float32Array, a: Float32Array, b: Float32Array): Float32Array {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    let b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
  }
}