import { easings, NodeAnimationManager } from '../node-object-definition-animator.js';

// ---------------------------------------------------------------------------
// Mock requestAnimationFrame / cancelAnimationFrame
// ---------------------------------------------------------------------------

let rafCallbacks;
let nextRafId;

beforeEach(() => {
  rafCallbacks = new Map();
  nextRafId = 1;
  global.requestAnimationFrame = (cb) => {
    const id = nextRafId++;
    rafCallbacks.set(id, cb);
    return id;
  };
  global.cancelAnimationFrame = (id) => {
    rafCallbacks.delete(id);
  };
});

afterEach(() => {
  delete global.requestAnimationFrame;
  delete global.cancelAnimationFrame;
});

function fireRaf(timestamp) {
  // Fire all pending rAF callbacks (snapshot to avoid infinite recursion)
  const cbs = [...rafCallbacks.entries()];
  rafCallbacks.clear();
  for (const [, cb] of cbs) {
    cb(timestamp);
  }
}

// ---------------------------------------------------------------------------
// Easing functions
// ---------------------------------------------------------------------------

describe('easings', () => {
  test('linear returns t unchanged', () => {
    expect(easings.linear(0)).toBe(0);
    expect(easings.linear(0.5)).toBe(0.5);
    expect(easings.linear(1)).toBe(1);
  });

  test('easeIn starts slow (t^2)', () => {
    expect(easings.easeIn(0)).toBe(0);
    expect(easings.easeIn(0.5)).toBeCloseTo(0.25);
    expect(easings.easeIn(1)).toBe(1);
  });

  test('easeOut ends slow', () => {
    expect(easings.easeOut(0)).toBe(0);
    expect(easings.easeOut(1)).toBe(1);
    expect(easings.easeOut(0.5)).toBeCloseTo(0.75);
  });

  test('easeInOut is symmetric', () => {
    expect(easings.easeInOut(0)).toBe(0);
    expect(easings.easeInOut(1)).toBe(1);
    expect(easings.easeInOut(0.5)).toBeCloseTo(0.5);
  });

  test('sine produces smooth wave', () => {
    expect(easings.sine(0)).toBeCloseTo(0);
    expect(easings.sine(0.25)).toBeCloseTo(0.5);
    expect(easings.sine(0.5)).toBeCloseTo(1);
    expect(easings.sine(0.75)).toBeCloseTo(0.5);
    expect(easings.sine(1)).toBeCloseTo(0);
  });

  test('bounce starts and ends at correct values', () => {
    expect(easings.bounce(0)).toBeCloseTo(0);
    expect(easings.bounce(1)).toBeCloseTo(1);
    expect(easings.bounce(0.5)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// NodeAnimationManager - lifecycle
// ---------------------------------------------------------------------------

describe('NodeAnimationManager', () => {
  test('hasAnimatedTypes is false when empty', () => {
    const mgr = new NodeAnimationManager();
    expect(mgr.hasAnimatedTypes()).toBe(false);
  });

  test('hasAnimatedTypes is true after registerType', () => {
    const mgr = new NodeAnimationManager();
    mgr.registerType('pulse', [{ uniform: 'u_intensity', from: 0, to: 1, duration: 1000 }]);
    expect(mgr.hasAnimatedTypes()).toBe(true);
  });

  test('start begins rAF loop', () => {
    const mgr = new NodeAnimationManager();
    mgr.registerType('pulse', [{ uniform: 'u_intensity', from: 0, to: 1, duration: 1000 }]);
    mgr.start();
    expect(rafCallbacks.size).toBe(1);
    mgr.dispose();
  });

  test('stop cancels rAF loop', () => {
    const mgr = new NodeAnimationManager();
    mgr.registerType('pulse', [{ uniform: 'u_intensity', from: 0, to: 1, duration: 1000 }]);
    mgr.start();
    mgr.stop();
    expect(mgr._running).toBe(false);
  });

  test('dispose clears everything', () => {
    const mgr = new NodeAnimationManager();
    mgr.registerType('pulse', [{ uniform: 'u_intensity', from: 0, to: 1, duration: 1000 }]);
    mgr.start();
    mgr.dispose();
    expect(mgr.hasAnimatedTypes()).toBe(false);
    expect(mgr._running).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// NodeAnimationManager - tick behavior
// ---------------------------------------------------------------------------

describe('NodeAnimationManager tick', () => {
  function createMaterial(uniformNames) {
    const uniforms = {};
    for (const name of uniformNames) {
      uniforms[name] = { value: 0 };
    }
    return { uniforms, uniformsNeedUpdate: false };
  }

  test('updates u_time based on elapsed seconds', () => {
    const mgr = new NodeAnimationManager();
    const anims = [{ uniform: 'u_intensity', from: 0, to: 1, duration: 1000 }];
    mgr.registerType('pulse', anims);

    const mat = createMaterial(['u_time', 'u_intensity']);
    mgr.registerMaterial('pulse', mat);
    mgr.start();

    // First frame establishes start time
    fireRaf(1000);
    expect(mat.uniforms.u_time.value).toBe(0);

    // Second frame at +500ms
    fireRaf(1500);
    expect(mat.uniforms.u_time.value).toBeCloseTo(0.5);

    mgr.dispose();
  });

  test('interpolates uniform values linearly', () => {
    const mgr = new NodeAnimationManager();
    const anims = [{ uniform: 'u_val', from: 10, to: 20, duration: 1000, easing: 'linear', loop: 'once' }];
    mgr.registerType('test', anims);

    const mat = createMaterial(['u_time', 'u_val']);
    mgr.registerMaterial('test', mat);
    mgr.start();

    fireRaf(0);  // start time = 0
    fireRaf(500); // 500ms elapsed, t=0.5
    expect(mat.uniforms.u_val.value).toBeCloseTo(15);

    fireRaf(1000); // 1000ms elapsed, t=1.0
    expect(mat.uniforms.u_val.value).toBeCloseTo(20);

    mgr.dispose();
  });

  test('loop mode wraps around', () => {
    const mgr = new NodeAnimationManager();
    const anims = [{ uniform: 'u_val', from: 0, to: 10, duration: 1000, loop: 'loop' }];
    mgr.registerType('test', anims);

    const mat = createMaterial(['u_val']);
    mgr.registerMaterial('test', mat);
    mgr.start();

    fireRaf(0);
    fireRaf(1500); // 1500ms -> t = 1.5 % 1 = 0.5 -> value = 5
    expect(mat.uniforms.u_val.value).toBeCloseTo(5);

    mgr.dispose();
  });

  test('once mode clamps at 1', () => {
    const mgr = new NodeAnimationManager();
    const anims = [{ uniform: 'u_val', from: 0, to: 10, duration: 1000, loop: 'once' }];
    mgr.registerType('test', anims);

    const mat = createMaterial(['u_val']);
    mgr.registerMaterial('test', mat);
    mgr.start();

    fireRaf(0);
    fireRaf(2000); // 2000ms -> clamped to t=1 -> value = 10
    expect(mat.uniforms.u_val.value).toBeCloseTo(10);

    mgr.dispose();
  });

  test('pingPong mode bounces', () => {
    const mgr = new NodeAnimationManager();
    const anims = [{ uniform: 'u_val', from: 0, to: 10, duration: 1000, loop: 'pingPong' }];
    mgr.registerType('test', anims);

    const mat = createMaterial(['u_val']);
    mgr.registerMaterial('test', mat);
    mgr.start();

    fireRaf(0);
    fireRaf(1500); // 1500ms -> t=1.5, pingPong: 1-|1.5%2 - 1| = 1-0.5 = 0.5 -> value = 5
    expect(mat.uniforms.u_val.value).toBeCloseTo(5);

    mgr.dispose();
  });

  test('delay postpones animation start', () => {
    const mgr = new NodeAnimationManager();
    const anims = [{ uniform: 'u_val', from: 0, to: 10, duration: 1000, delay: 500, loop: 'once' }];
    mgr.registerType('test', anims);

    const mat = createMaterial(['u_val']);
    mgr.registerMaterial('test', mat);
    mgr.start();

    fireRaf(0);
    fireRaf(250); // 250ms - still within delay -> animElapsed=0 -> t=0 -> value=0
    expect(mat.uniforms.u_val.value).toBeCloseTo(0);

    fireRaf(1000); // 1000ms - 500 delay = 500ms elapsed -> t=0.5 -> value=5
    expect(mat.uniforms.u_val.value).toBeCloseTo(5);

    mgr.dispose();
  });

  test('sets uniformsNeedUpdate to true each frame', () => {
    const mgr = new NodeAnimationManager();
    mgr.registerType('test', [{ uniform: 'u_val', from: 0, to: 1, duration: 1000 }]);

    const mat = createMaterial(['u_val']);
    mat.uniformsNeedUpdate = false;
    mgr.registerMaterial('test', mat);
    mgr.start();

    fireRaf(0);
    expect(mat.uniformsNeedUpdate).toBe(true);

    mgr.dispose();
  });

  test('unregisterMaterial stops updates for that material', () => {
    const mgr = new NodeAnimationManager();
    mgr.registerType('test', [{ uniform: 'u_val', from: 0, to: 10, duration: 1000, loop: 'once' }]);

    const mat = createMaterial(['u_val']);
    mgr.registerMaterial('test', mat);
    mgr.start();

    fireRaf(0);
    fireRaf(500);
    expect(mat.uniforms.u_val.value).toBeCloseTo(5);

    mgr.unregisterMaterial('test', mat);
    mat.uniforms.u_val.value = 999; // set to something to verify it's not touched

    fireRaf(750);
    expect(mat.uniforms.u_val.value).toBe(999); // not updated

    mgr.dispose();
  });
});
