// Small WebGL1 scene renderer. Matrices are column-major; angles are radians.
const TAU = Math.PI * 2;
const sub = (a, b) => a.map((v, i) => v - b[i]);
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const unit = a => { const d = Math.hypot(...a); return d ? a.map(v => v/d) : [0, 0, 0]; };

export function mat4Identity() {
  return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
}
export function mat4Multiply(a, b) {
  const out = Array(16).fill(0);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++)
    for (let k = 0; k < 4; k++) out[c*4+r] += a[k*4+r]*b[c*4+k];
  return out;
}
export function mat4Perspective(fovYRad, aspect, near, far) {
  const f = 1 / Math.tan(fovYRad/2), nf = 1/(near-far);
  return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0];
}
export function mat4LookAt(eye, target, up = [0,1,0]) {
  let z = unit(sub(eye, target));
  if (!Math.hypot(...z)) z = [0,0,1];
  let x = unit(cross(up, z));
  if (!Math.hypot(...x)) x = unit(cross(Math.abs(z[1]) < 0.99 ? [0,1,0] : [1,0,0], z));
  const y = cross(z, x);
  return [x[0],y[0],z[0],0, x[1],y[1],z[1],0, x[2],y[2],z[2],0,
    -dot(x,eye),-dot(y,eye),-dot(z,eye),1];
}
export function mat4Translate(m, x, y, z) {
  const t = mat4Identity(); t[12]=x; t[13]=y; t[14]=z;
  return mat4Multiply(m, t);
}
export function mat4RotateX(m, rad) {
  const c=Math.cos(rad), s=Math.sin(rad);
  return mat4Multiply(m, [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
}
export function mat4RotateY(m, rad) {
  const c=Math.cos(rad), s=Math.sin(rad);
  return mat4Multiply(m, [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
}
export function mat4RotateZ(m, rad) {
  const c=Math.cos(rad), s=Math.sin(rad);
  return mat4Multiply(m, [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
}
export function mat4Scale(m, x, y, z) {
  return mat4Multiply(m, [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
}
export function normalMatrix(m) {
  const a=[m[0],m[1],m[2]], b=[m[4],m[5],m[6]], c=[m[8],m[9],m[10]];
  const x=cross(b,c), y=cross(c,a), z=cross(a,b), det=dot(a,x);
  // Singular transforms have no inverse; their cofactors still give useful normals.
  const d = Math.abs(det) > 1e-12 ? 1/det : 1;
  return new Float32Array([...x,...y,...z].map(v => v*d));
}

function mesh() { return { positions:[], normals:[], uvs:[], colors:null, indices:[] }; }
function vertex(g, p, n, uv) {
  const i=g.positions.length/3;
  g.positions.push(...p); g.normals.push(...n); g.uvs.push(...uv);
  return i;
}
function finish(g) {
  if (g.positions.length/3 > 65536) throw new RangeError('Geometry exceeds WebGL1 Uint16 vertex limit');
  return { positions:new Float32Array(g.positions), normals:new Float32Array(g.normals),
    uvs:new Float32Array(g.uvs), colors:g.colors ? new Float32Array(g.colors) : null,
    indices:new Uint16Array(g.indices) };
}
function segments(n, min) {
  if (!Number.isFinite(n)) throw new RangeError('Segment count must be finite');
  return Math.max(min, Math.floor(n));
}
export function box(w, h, d) {
  const g=mesh(), x=w/2, y=h/2, z=d/2;
  const faces = [
    [[1,0,0], [[x,-y,z],[x,-y,-z],[x,y,-z],[x,y,z]]],
    [[-1,0,0], [[-x,-y,-z],[-x,-y,z],[-x,y,z],[-x,y,-z]]],
    [[0,1,0], [[-x,y,z],[x,y,z],[x,y,-z],[-x,y,-z]]],
    [[0,-1,0], [[-x,-y,-z],[x,-y,-z],[x,-y,z],[-x,-y,z]]],
    [[0,0,1], [[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]]],
    [[0,0,-1], [[x,-y,-z],[-x,-y,-z],[-x,y,-z],[x,y,-z]]]
  ];
  for (const [n, ps] of faces) {
    const base=g.positions.length/3;
    ps.forEach((p,i) => vertex(g,p,n,[[0,0],[1,0],[1,1],[0,1]][i]));
    g.indices.push(base,base+1,base+2,base,base+2,base+3);
  }
  return finish(g);
}
export function cylinder(rTop, rBottom, h, radialSegs=14, openEnded=false) {
  const g=mesh(), n=segments(radialSegs,3), slope=h ? (rBottom-rTop)/h : 0;
  for (let row=0; row<2; row++) for (let j=0; j<=n; j++) {
    const t=j/n*TAU, c=Math.cos(t), s=Math.sin(t), r=row ? rTop : rBottom;
    vertex(g,[r*c,(row-0.5)*h,r*s],unit([c,slope,s]),[j/n,row]);
  }
  for (let j=0; j<n; j++) {
    const a=j, b=j+n+1;
    g.indices.push(a,b,a+1,a+1,b,b+1);
  }
  if (!openEnded) for (const top of [false,true]) {
    const r=top ? rTop : rBottom;
    if (!r) continue;
    const y=(top ? 0.5 : -0.5)*h, normal=[0,top ? 1 : -1,0];
    const center=vertex(g,[0,y,0],normal,[0.5,0.5]);
    for (let j=0; j<=n; j++) {
      const t=j/n*TAU, c=Math.cos(t), s=Math.sin(t);
      vertex(g,[r*c,y,r*s],normal,[0.5+c/2,0.5+s/2]);
    }
    for (let j=0; j<n; j++) {
      const a=center+1+j, b=a+1;
      g.indices.push(center,top ? b : a,top ? a : b);
    }
  }
  return finish(g);
}
export function sphere(r, wSegs=18, hSegs=14) {
  const g=mesh(), w=segments(wSegs,3), h=segments(hSegs,2);
  for (let i=0; i<=h; i++) for (let j=0; j<=w; j++) {
    const v=i/h, u=j/w, phi=v*Math.PI, theta=u*TAU;
    const n=[Math.sin(phi)*Math.cos(theta),Math.cos(phi),Math.sin(phi)*Math.sin(theta)];
    vertex(g,n.map(x=>x*r),n,[u,1-v]);
  }
  for (let i=0; i<h; i++) for (let j=0; j<w; j++) {
    const a=i*(w+1)+j, b=a+w+1;
    if (i>0) g.indices.push(a,a+1,b);
    if (i<h-1) g.indices.push(a+1,b+1,b);
  }
  return finish(g);
}
export function lathe(profile, segs=20) {
  // Profile runs bottom to top; negative radii are unsupported. Ends remain open.
  const g=mesh(), n=segments(segs,3), count=profile.length;
  if (count<2) return finish(g);
  const lengths=[0], edgeNormals=[];
  for (let i=1; i<count; i++) {
    const dr=profile[i][0]-profile[i-1][0], dy=profile[i][1]-profile[i-1][1];
    lengths.push(lengths[i-1]+Math.hypot(dr,dy));
    const len=Math.hypot(dr,dy) || 1;
    edgeNormals.push([dy/len,-dr/len]);
  }
  for (let i=0; i<count; i++) {
    const a=edgeNormals[Math.max(0,i-1)], b=edgeNormals[Math.min(count-2,i)];
    const sn=unit([a[0]+b[0],a[1]+b[1],0]);
    for (let j=0; j<=n; j++) {
      const t=j/n*TAU, c=Math.cos(t), s=Math.sin(t);
      vertex(g,[profile[i][0]*c,profile[i][1],profile[i][0]*s],
        [sn[0]*c,sn[1],sn[0]*s],[j/n,lengths[i]/(lengths[count-1] || 1)]);
    }
  }
  for (let i=0; i<count-1; i++) for (let j=0; j<n; j++) {
    const a=i*(n+1)+j, b=a+n+1;
    g.indices.push(a,b,a+1,a+1,b,b+1);
  }
  return finish(g);
}
export function plane(w, h) {
  const g=mesh();
  [[-w/2,-h/2,0],[w/2,-h/2,0],[w/2,h/2,0],[-w/2,h/2,0]].forEach((p,i)=>
    vertex(g,p,[0,0,1],[[0,0],[1,0],[1,1],[0,1]][i]));
  g.indices.push(0,1,2,0,2,3);
  return finish(g);
}
export function torus(r, tube, radialSegs=10, tubularSegs=20) {
  // Ring lies in XY, with the hole along Z.
  const g=mesh(), rows=segments(radialSegs,3), cols=segments(tubularSegs,3);
  for (let i=0; i<=rows; i++) for (let j=0; j<=cols; j++) {
    const v=i/rows*TAU, u=j/cols*TAU, cv=Math.cos(v), sv=Math.sin(v);
    const cu=Math.cos(u), su=Math.sin(u);
    vertex(g,[(r+tube*cv)*cu,(r+tube*cv)*su,tube*sv],
      [cv*cu,cv*su,sv],[j/cols,i/rows]);
  }
  for (let i=0; i<rows; i++) for (let j=0; j<cols; j++) {
    const a=i*(cols+1)+j, b=a+cols+1;
    g.indices.push(a,a+1,b,a+1,b+1,b);
  }
  return finish(g);
}
export function disc(r, segs=24) {
  const g=mesh(), n=segments(segs,3);
  vertex(g,[0,0,0],[0,0,1],[0.5,0.5]);
  for (let j=0; j<=n; j++) {
    const t=j/n*TAU, c=Math.cos(t), s=Math.sin(t);
    vertex(g,[r*c,r*s,0],[0,0,1],[0.5+c/2,0.5+s/2]);
  }
  for (let j=0; j<n; j++) g.indices.push(0,j+1,j+2);
  return finish(g);
}

export function node(geometry=null, material=null, opts={}) {
  // Local matrix T * Rx * Ry * Rz * S: vertices rotate Z, then Y, then X.
  return { geometry, material:material || {}, p:opts.p || [0,0,0], r:opts.r || [0,0,0],
    s:opts.s ?? [1,1,1], children:opts.children || [], visible:opts.visible ?? true };
}
export function group(opts={}) { return node(null,null,opts); }

const VERTEX = `
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec2 aUV;
attribute vec3 aColor;
uniform mat4 uWorld;
uniform mat4 uViewProjection;
uniform mat3 uNormalMatrix;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUV;
varying vec3 vColor;
void main() {
  vec4 world = uWorld * vec4(aPosition, 1.0);
  vPosition = world.xyz;
  vNormal = uNormalMatrix * aNormal;
  vUV = aUV;
  vColor = aColor;
  gl_Position = uViewProjection * world;
}`;
const FRAGMENT = `
precision mediump float;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUV;
varying vec3 vColor;
uniform vec3 uEye, uLightDir, uLightColor, uSkyColor, uGroundColor;
uniform vec3 uRimColor, uFogColor, uColor, uEmissive;
uniform float uAmbient, uFogDensity, uAlpha, uBand, uRimBoost;
uniform bool uHasTexture, uVertexColors, uUnlit;
uniform sampler2D uTexture;
void main() {
  vec4 texel = vec4(1.0);
  if (uHasTexture) texel = texture2D(uTexture, vUV);
  vec3 base = uColor * texel.rgb;
  if (uVertexColors) base *= vColor;
  vec3 result = base;
  if (!uUnlit) {
    vec3 n = normalize(vNormal);
    vec3 viewDir = normalize(uEye - vPosition);
    float diffuse = max(dot(n, uLightDir), 0.0);
    if (uBand > 0.0) {
      float bands = max(1.0, uBand);
      float banded = floor(diffuse * bands + 0.5) / bands;
      diffuse = mix(diffuse, banded, 0.7);
    }
    vec3 hemi = mix(uGroundColor, uSkyColor, n.y * 0.5 + 0.5);
    vec3 halfDir = normalize(uLightDir + viewDir);
    float spec = pow(max(dot(n, halfDir), 0.0), 24.0) * 0.25;
    spec *= step(0.0001, dot(n, uLightDir));
    float rim = pow(1.0 - abs(dot(n, viewDir)), 3.0) * uRimBoost;
    result = base * (hemi * uAmbient + uLightColor * diffuse)
           + uLightColor * spec + uRimColor * rim;
  }
  result += uEmissive;
  float fog = 1.0 - exp(-uFogDensity * length(uEye - vPosition));
  result = mix(result, uFogColor, clamp(fog, 0.0, 1.0));
  gl_FragColor = vec4(result, texel.a * uAlpha);
}`;

// GL resources belong to a context; geometry/material caches live inside each renderer.
const programs = new WeakMap();
function programFor(gl) {
  if (programs.has(gl)) return programs.get(gl);
  function compile(type, source) {
    const shader=gl.createShader(type);
    gl.shaderSource(shader,source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) {
      const message=gl.getShaderInfoLog(shader); gl.deleteShader(shader);
      throw new Error(`GL3D shader: ${message}`);
    }
    return shader;
  }
  const vs=compile(gl.VERTEX_SHADER,VERTEX), fs=compile(gl.FRAGMENT_SHADER,FRAGMENT);
  const program=gl.createProgram();
  gl.attachShader(program,vs); gl.attachShader(program,fs); gl.linkProgram(program);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(program,gl.LINK_STATUS)) {
    const message=gl.getProgramInfoLog(program); gl.deleteProgram(program);
    throw new Error(`GL3D program: ${message}`);
  }
  const attributes={}, uniforms={};
  for (const name of ['Position','Normal','UV','Color'])
    attributes[name]=gl.getAttribLocation(program,`a${name}`);
  for (const name of ['World','ViewProjection','NormalMatrix','Eye','LightDir','LightColor',
    'SkyColor','GroundColor','RimColor','FogColor','Color','Emissive','Ambient','FogDensity',
    'Alpha','Band','RimBoost','HasTexture','VertexColors','Unlit','Texture'])
    uniforms[name]=gl.getUniformLocation(program,`u${name}`);
  const result={program,attributes,uniforms};
  programs.set(gl,result);
  return result;
}

export function createRenderer(canvas) {
  let gl;
  try {
    gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false})
      || canvas.getContext('experimental-webgl',{alpha:true,antialias:true,premultipliedAlpha:false});
  } catch { return null; }
  if (!gl) return null;
  const {program,attributes:a,uniforms:u}=programFor(gl);
  const buffers=new WeakMap(), textures=new WeakMap();
  function upload(geometry) {
    if (buffers.has(geometry)) return buffers.get(geometry);
    const result={count:geometry.indices.length};
    for (const [key,data] of Object.entries({Position:geometry.positions,Normal:geometry.normals,
      UV:geometry.uvs,Color:geometry.colors,Index:geometry.indices})) {
      if (!data) continue;
      const target=key==='Index' ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
      const buffer=gl.createBuffer(); gl.bindBuffer(target,buffer);
      gl.bufferData(target,data,gl.STATIC_DRAW); result[key]=buffer;
    }
    buffers.set(geometry,result);
    return result;
  }
  function textureFor(material) {
    // Canvas textures flip Y by default. Set material.flipY=false to opt out.
    // Set material.needsUpdate=true after repainting an already uploaded canvas.
    let cached=textures.get(material);
    const source=material.tex, flip=material.flipY !== false;
    if (!cached) {
      cached={texture:gl.createTexture()}; textures.set(material,cached);
    }
    gl.bindTexture(gl.TEXTURE_2D,cached.texture);
    if (cached.source!==source || cached.width!==source.width || cached.height!==source.height
      || cached.flip!==flip || material.needsUpdate) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,flip);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      Object.assign(cached,{source,width:source.width,height:source.height,flip});
      material.needsUpdate=false;
    }
  }
  function setSize(w,h) {
    canvas.width=Math.max(1,Math.floor(w)); canvas.height=Math.max(1,Math.floor(h));
    gl.viewport(0,0,canvas.width,canvas.height);
  }
  function render(sceneRoot, camera={}, env={}) {
    if (gl.isContextLost()) return;
    const eye=camera.pos || [0,0,5];
    const view=mat4LookAt(eye,camera.target || [0,0,0],[0,1,0]);
    const projection=mat4Perspective((camera.fov ?? 45)*Math.PI/180,
      Math.max(1,canvas.width)/Math.max(1,canvas.height),camera.near ?? 0.1,camera.far ?? 1000);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.useProgram(program); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    // Double-sided meshes allow inward sky domes and decorative paper-thin props.
    gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND); gl.depthMask(true);
    gl.clearColor(0,0,0,0); gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(u.ViewProjection,false,new Float32Array(mat4Multiply(projection,view)));
    const vec=(key,value)=>gl.uniform3fv(u[key],value);
    vec('Eye',eye); vec('LightDir',unit(env.lightDir || [-0.5,0.8,0.6]));
    vec('LightColor',env.lightColor || [1,0.85,0.7]);
    vec('SkyColor',env.skyColor || [0.4,0.6,1]);
    vec('GroundColor',env.groundColor || [0.4,0.15,0.3]);
    vec('RimColor',env.rimColor || [1,0.2,0.6]);
    vec('FogColor',env.fogColor || [0.65,0.3,0.6]);
    gl.uniform1f(u.Ambient,env.ambient ?? 0.65);
    gl.uniform1f(u.FogDensity,Math.max(0,env.fogDensity ?? 0));
    gl.activeTexture(gl.TEXTURE0); gl.uniform1i(u.Texture,0);
    const opaque=[], transparent=[];
    function visit(n,parent) {
      if (!n || n.visible===false) return;
      const p=n.p || [0,0,0], r=n.r || [0,0,0];
      const scale=n.s ?? 1, s=typeof scale==='number' ? [scale,scale,scale] : scale;
      let local=mat4Translate(mat4Identity(),...p);
      local=mat4RotateX(local,r[0]); local=mat4RotateY(local,r[1]);
      local=mat4RotateZ(local,r[2]); local=mat4Scale(local,...s);
      const world=mat4Multiply(parent,local);
      if (n.geometry) {
        const material=n.material || {};
        const entry={geometry:n.geometry,material,world};
        // Alpha-bearing textures can request this pass with transparent:true.
        (material.alpha < 1 || material.transparent ? transparent : opaque).push(entry);
      }
      for (const child of n.children || []) visit(child,world);
    }
    visit(sceneRoot,mat4Identity());
    // Back-to-front by camera-space origin, after opaque objects have written depth.
    const depth=e=>view[2]*e.world[12]+view[6]*e.world[13]+view[10]*e.world[14]+view[14];
    transparent.sort((a,b)=>depth(a)-depth(b));
    function draw({geometry,material:m,world}) {
      const b=upload(geometry);
      for (const [key,size] of [['Position',3],['Normal',3],['UV',2],['Color',3]]) {
        const location=a[key];
        if (location<0) continue;
        if (b[key] && (key!=='Color' || m.vertexColors)) {
          gl.bindBuffer(gl.ARRAY_BUFFER,b[key]); gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
        } else {
          gl.disableVertexAttribArray(location);
          if (size===2) gl.vertexAttrib2f(location,0,0);
          else gl.vertexAttrib3f(location,key==='Color' ? 1 : 0,key==='Color' ? 1 : 0,1);
        }
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,b.Index);
      gl.uniformMatrix4fv(u.World,false,new Float32Array(world));
      gl.uniformMatrix3fv(u.NormalMatrix,false,normalMatrix(world));
      vec('Color',m.color || [1,1,1]); vec('Emissive',m.emissive || [0,0,0]);
      gl.uniform1f(u.Alpha,m.alpha ?? 1); gl.uniform1f(u.Band,m.band ?? 0);
      gl.uniform1f(u.RimBoost,m.rimBoost ?? 1);
      gl.uniform1i(u.Unlit,!!m.unlit); gl.uniform1i(u.VertexColors,!!m.vertexColors);
      gl.uniform1i(u.HasTexture,!!m.tex);
      if (m.tex) textureFor(m);
      gl.drawElements(gl.TRIANGLES,b.count,gl.UNSIGNED_SHORT,0);
    }
    opaque.forEach(draw);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false); transparent.forEach(draw);
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  return {canvas,gl,setSize,render};
}
