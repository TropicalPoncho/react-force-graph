// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

export const easings = {
  linear: t => t,
  easeIn: t => t * t,
  easeOut: t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  sine: t => (Math.sin(t * Math.PI * 2 - Math.PI / 2) + 1) / 2,
  bounce: t => {
    if (t < 1 / 2.75) return 7.5625 * t * t;
    if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
    if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
    t -= 2.625 / 2.75;
    return 7.5625 * t * t + 0.984375;
  }
};

// ---------------------------------------------------------------------------
// Interpolation helpers
// ---------------------------------------------------------------------------

function lerp(from, to, t) {
  if (typeof from === 'number' && typeof to === 'number') {
    return from + (to - from) * t;
  }
  if (Array.isArray(from) && Array.isArray(to)) {
    return from.map((v, i) => v + ((to[i] ?? v) - v) * t);
  }
  return from;
}

function setUniformValue(uniform, value) {
  if (uniform == null) return;

  if (typeof value === 'number') {
    uniform.value = value;
    return;
  }

  // Array value — update vector components in-place if possible
  if (Array.isArray(value)) {
    const target = uniform.value;
    if (target && typeof target === 'object') {
      if ('x' in target) target.x = value[0] ?? 0;
      if ('y' in target) target.y = value[1] ?? 0;
      if ('z' in target && value.length >= 3) target.z = value[2] ?? 0;
      if ('w' in target && value.length >= 4) target.w = value[3] ?? 0;
    } else {
      uniform.value = value;
    }
    return;
  }

  uniform.value = value;
}

// ---------------------------------------------------------------------------
// Animation Manager
// ---------------------------------------------------------------------------

export class NodeAnimationManager {
  constructor() {
    this._types = new Map();    // typeName -> { animations, materials: Set }
    this._rafId = null;
    this._startTime = null;
    this._running = false;
  }

  registerType(typeName, animations) {
    if (!this._types.has(typeName)) {
      this._types.set(typeName, { animations, materials: new Set() });
    }
  }

  registerMaterial(typeName, material) {
    const typeInfo = this._types.get(typeName);
    if (typeInfo) {
      typeInfo.materials.add(material);
    }
  }

  unregisterMaterial(typeName, material) {
    const typeInfo = this._types.get(typeName);
    if (typeInfo) {
      typeInfo.materials.delete(material);
    }
  }

  hasAnimatedTypes() {
    return this._types.size > 0;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._startTime = null;
    this._scheduleFrame();
  }

  stop() {
    this._running = false;
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  dispose() {
    this.stop();
    this._types.clear();
  }

  _scheduleFrame() {
    this._rafId = requestAnimationFrame((timestamp) => this.tick(timestamp));
  }

  tick(timestamp) {
    if (!this._running) return;

    if (this._startTime === null) {
      this._startTime = timestamp;
    }
    const elapsedMs = timestamp - this._startTime;
    const elapsedSec = elapsedMs / 1000;

    for (const [, typeInfo] of this._types) {
      for (const material of typeInfo.materials) {
        // Update u_time
        if (material.uniforms && material.uniforms.u_time) {
          material.uniforms.u_time.value = elapsedSec;
        }

        // Drive each declared animation
        for (const anim of typeInfo.animations) {
          const animElapsed = Math.max(0, elapsedMs - (anim.delay || 0));
          let t = anim.duration > 0 ? animElapsed / anim.duration : 1;

          // Apply loop mode
          const loop = anim.loop || 'loop';
          switch (loop) {
            case 'once':
              t = Math.min(t, 1);
              break;
            case 'loop':
              t = t % 1;
              break;
            case 'pingPong':
              t = 1 - Math.abs((t % 2) - 1);
              break;
          }

          // Apply easing
          const easingFn = easings[anim.easing || 'linear'];
          t = easingFn ? easingFn(t) : t;

          // Interpolate and set
          const value = lerp(anim.from, anim.to, t);
          if (material.uniforms) {
            setUniformValue(material.uniforms[anim.uniform], value);
          }
        }

        if (material.uniformsNeedUpdate !== undefined) {
          material.uniformsNeedUpdate = true;
        }
      }
    }

    this._scheduleFrame();
  }
}
