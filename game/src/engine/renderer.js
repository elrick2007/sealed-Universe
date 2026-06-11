// PSX-style render pipeline: low-resolution render target, nearest-neighbour
// upscale, ordered dithering, colour posterisation, grain, vertex snapping,
// plus a slow candle-light luminance flicker for atmosphere.
import * as THREE from 'three';

// internal vertical resolutions per quality setting
const QUALITY = {
  psx:      { height: 240, grain: 0.06,  posterise: 31.0 },
  enhanced: { height: 480, grain: 0.035, posterise: 63.0 },
};

const ditherFrag = `
uniform sampler2D tDiffuse;
uniform vec2 uRes;
uniform float uTime;
uniform float uGrain;
uniform float uLevels;
varying vec2 vUv;

float bayer4(vec2 p){
  int x = int(mod(p.x, 4.0));
  int y = int(mod(p.y, 4.0));
  int i = y * 4 + x;
  float m[16];
  m[0]=0.0;  m[1]=8.0;  m[2]=2.0;  m[3]=10.0;
  m[4]=12.0; m[5]=4.0;  m[6]=14.0; m[7]=6.0;
  m[8]=3.0;  m[9]=11.0; m[10]=1.0; m[11]=9.0;
  m[12]=15.0;m[13]=7.0; m[14]=13.0;m[15]=5.0;
  for(int k=0;k<16;k++){ if(k==i) return m[k]/16.0; }
  return 0.0;
}
float rnd(vec2 co){ return fract(sin(dot(co, vec2(12.9898,78.233))) * 43758.5453); }

void main(){
  vec2 px = floor(vUv * uRes);
  vec3 c = texture2D(tDiffuse, vUv).rgb;
  // linear -> sRGB (the scene renders in linear space)
  c = pow(max(c, 0.0), vec3(0.4545));
  // candle flicker — a slow, whole-frame luminance waver
  float fl = 1.0
    + 0.016 * sin(uTime * 9.7)  * sin(uTime * 3.1)
    + 0.012 * (rnd(vec2(floor(uTime * 18.0), 3.0)) - 0.5);
  c *= fl;
  // film grain, stronger in darkness
  float g = (rnd(px + fract(uTime)) - 0.5) * uGrain * (1.2 - c.r);
  c += g;
  // ordered dither + posterise
  float d = bayer4(px) - 0.5;
  c = floor(c * uLevels + d) / uLevels;
  gl_FragColor = vec4(c, 1.0);
}`;

const ditherVert = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export class PSXRenderer {
  constructor(canvas){
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias:false });
    this.renderer.setPixelRatio(1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.quality = QUALITY.psx;

    this.target = new THREE.WebGLRenderTarget(320, this.quality.height, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    });

    this.postScene = new THREE.Scene();
    this.postCam = new THREE.OrthographicCamera(-1,1,1,-1,0,1);
    this.postMat = new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: this.target.texture },
        uRes: { value: new THREE.Vector2(320, this.quality.height) },
        uTime: { value: 0 },
        uGrain: { value: this.quality.grain },
        uLevels: { value: this.quality.posterise },
      },
      vertexShader: ditherVert, fragmentShader: ditherFrag, depthTest:false,
    });
    this.postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2), this.postMat));

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  setQuality(name){
    this.quality = QUALITY[name] || QUALITY.psx;
    this.postMat.uniforms.uGrain.value = this.quality.grain;
    this.postMat.uniforms.uLevels.value = this.quality.posterise;
    this.resize();
  }

  resize(){
    const w = window.innerWidth, h = window.innerHeight;
    const rh = this.quality.height;
    this.renderer.setSize(w, h, false);
    const rw = Math.max(2, Math.round(rh * (w/h)));
    this.target.setSize(rw, rh);
    this.postMat.uniforms.uRes.value.set(rw, rh);
    this.aspect = w / h;
  }

  render(scene, camera, time){
    this.postMat.uniforms.uTime.value = time;
    this.renderer.setRenderTarget(this.target);
    this.renderer.render(scene, camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.postScene, this.postCam);
  }
}

// Patch a material so its vertices snap to the low-res grid — the PSX wobble.
export function psxMaterial(mat){
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSnap = { value: 96.0 };
    shader.vertexShader = 'uniform float uSnap;\n' + shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
       gl_Position.xyz /= gl_Position.w;
       gl_Position.xy = floor(gl_Position.xy * uSnap) / uSnap;
       gl_Position.xyz *= gl_Position.w;`
    );
  };
  return mat;
}
