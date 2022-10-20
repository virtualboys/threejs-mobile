import { easeInQuad, easeOutQuad, easeOutQuart } from "./easing-functions.js";
import { easeVec, forEachMat } from "./utils.js";

export abstract class Effect {

  obj: THREE.Object3D;

  constructor(obj: THREE.Object3D) {
    this.obj = obj;
  }

  abstract update(dt: number): void;
}

export class RotateEffect extends Effect {

  rotsPerSec: number;
  axis: THREE.Vector3;

  private rotQuat: THREE.Quaternion;

  constructor(obj: THREE.Object3D, rotsPerSec: number, axis: THREE.Vector3) {
    super(obj);
    this.rotsPerSec = rotsPerSec;
    this.axis = axis;

    this.rotQuat = new THREE.Quaternion();

    //random offset
    this.rotQuat.setFromAxisAngle(axis, 2 * Math.PI * Math.random());
    obj.quaternion.multiply(this.rotQuat);
  }
  update(dt: number): void {
    this.rotQuat.setFromAxisAngle(this.axis, 2 * Math.PI * dt * this.rotsPerSec);
    this.obj.quaternion.multiply(this.rotQuat);
  }
}

export class HoverEffect extends Effect {

  height: number;
  frequency: number;
  axis: THREE.Vector3 = new THREE.Vector3();
  slow = false;

  private startPos = new THREE.Vector3();
  private newPos = new THREE.Vector3();

  private t = .5;

  constructor(obj: THREE.Object3D, height: number, frequency: number, axis: THREE.Vector3) {
    super(obj);

    this.height = height;
    this.frequency = frequency;
    this.axis.copy(axis);
    this.startPos.copy(this.obj.position);
  }

  update(dt: number): void {
    this.t += this.frequency * dt * ((this.slow) ? .1 : 1)
    // d.multiplyScalar(height * Math.sin(2 * Math.PI * t));
    // obj.position.add(d);
    this.newPos.copy(this.axis);
    this.newPos.multiplyScalar(this.height * Math.sin(2 * Math.PI * this.t));
    this.newPos.add(this.startPos);
    this.obj.position.copy(this.newPos);
  }
}

export class BloomModEffect extends Effect {

  pos: THREE.Vector3;
  targetThreshold: number;
  targetStrength: number;
  targetRadius: number;
  effectRadius: number;

  private bloomPass;

  private startThreshold: number;
  private startStrength: number;
  private startRadius: number;

  private d = new THREE.Vector3();
  private isAnimating = false;

  constructor(pos: THREE.Vector3, player: THREE.Object3D, bloomPass, targetThreshold: number, targetStrength: number, targetRadius: number, effectRadius: number) {
    super(player);

    this.pos = pos;
    this.bloomPass = bloomPass;
    this.targetThreshold = targetThreshold;
    this.targetStrength = targetStrength;
    this.targetRadius = targetRadius;
    this.effectRadius = effectRadius;

    this.startThreshold = bloomPass.threshold;
    this.startStrength = bloomPass.strength;
    this.startRadius = bloomPass.radius;
  }

  update(dt: number): void {
    this.d.copy(this.pos);
    this.d.set(this.d.x, this.obj.position.y, this.d.z);
    this.d.sub(this.obj.position);
    if (this.d.lengthSq() > this.effectRadius * this.effectRadius) {
      if (this.isAnimating) {
        this.bloomPass.threshold = this.startThreshold;
        this.bloomPass.strength = this.startStrength;
        this.bloomPass.radius = this.startRadius;
        this.isAnimating = false;
      }
      return;
    } else {
      this.isAnimating = true;
      const t = 1 - (this.d.length() / this.effectRadius);
      this.bloomPass.threshold = easeOutQuart(t, this.startThreshold, this.targetThreshold - this.startThreshold, 1);
      this.bloomPass.strength = easeOutQuart(t, this.startStrength, this.targetStrength - this.startStrength, 1);
      this.bloomPass.radius = easeOutQuart(t, this.startRadius, this.targetRadius - this.startRadius, 1)
    }
  }
}

export class ShoeFocusEffect extends Effect {

  proximity = 4;
  scaleAmt = 1.6;
  animDuration = 1;
  // scaleAmt = 1;

  camera: THREE.PerspectiveCamera;
  onShowHide: (show: boolean) => void;

  private rotateEffect: RotateEffect;
  private hoverEffect: HoverEffect;
  private baseScale = new THREE.Vector3();
  private shoeWorld = new THREE.Vector3();
  private cameraWorld = new THREE.Vector3();
  private d = new THREE.Vector3();
  private isFocused = false;
  private baseRotSpeed: number;
  private meshes: THREE.Mesh[] = [];
  private shoeScene: THREE.Scene;
  private overlayShoes: THREE.Object3D;

  private animTime = this.animDuration;
  private animScaleTarget = new THREE.Vector3();


  constructor(shoe: THREE.Object3D, camera: THREE.PerspectiveCamera, shoeScene: THREE.Scene, rotateEffect: RotateEffect, hoverEffect: HoverEffect, onShowHide: (show: boolean) => void) {
    super(shoe);

    this.camera = camera;
    this.rotateEffect = rotateEffect;
    this.hoverEffect = hoverEffect;
    this.baseRotSpeed = rotateEffect.rotsPerSec;
    this.baseScale.copy(shoe.scale);
    this.shoeScene = shoeScene;
    this.onShowHide = onShowHide;

    shoe.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.meshes.push(child);
        forEachMat(child, (mat) => {
          mat.transparent = true;
          console.log(mat);
        });
        child.renderOrder = 9;
      }
    });

    // const ghostMat =  new THREE.ShaderMaterial({
    //   fragmentShader: fragmentShader(),
    //   vertexShader: vertexShader(),
    // });
    // this.overlayShoes = new THREE.Group();
    this.meshes.forEach((mesh) => {
      console.log(mesh.material);
      // mesh.layers.set(8);
      // this.overlayShoes.add(mesh);

        // ghostMesh.position.copy(mesh.getWorldPosition());
        // ghostMesh.scale.copy()

      //   mesh.add(ghostMesh);
      //   ghostMesh.renderOrder = 2;
    });
    // this.shoeScene.add(this.overlayShoes);
  }

  update(dt: number): void {
    this.obj.getWorldPosition(this.shoeWorld);
    this.camera.getWorldPosition(this.cameraWorld);
    this.d.copy(this.shoeWorld).sub(this.cameraWorld);

    this.d.y = 0;
    const inRange = this.d.lengthSq() < this.proximity * this.proximity;

    if (this.animTime < this.animDuration) {

      this.obj.scale.lerp(this.animScaleTarget, this.animTime / this.animDuration);
      this.animTime += dt;
      if (this.animTime >= this.animDuration) {
        this.obj.scale.copy(this.animScaleTarget);
      }
    }

    let lookingAt = false;
    if (inRange) {
      this.d.normalize();
      let camLook = new THREE.Vector3();
      this.camera.getWorldDirection(camLook);
      if (this.d.dot(camLook) > .95) {
        var frustum = new THREE.Frustum();
        var projScreenMatrix = new THREE.Matrix4();
        projScreenMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);

        frustum.setFromProjectionMatrix(projScreenMatrix);
        lookingAt = frustum.containsPoint(this.shoeWorld);
      }
    }

    const shouldFocus = lookingAt && inRange;

    if (shouldFocus && !this.isFocused) {
      // this.obj.scale.copy(this.baseScale).multiplyScalar(this.scaleAmt);
      this.onShowHide(true);
      this.isFocused = true;

      this.animScaleTarget.copy(this.baseScale);
      this.animScaleTarget.multiplyScalar(this.scaleAmt);
      this.animTime = 0;
      this.rotateEffect.rotsPerSec = .7 * this.baseRotSpeed;
      this.hoverEffect.slow = true;
      this.meshes.forEach((mesh) => {
        mesh.layers.set(8);
      });
      // this.animStartScale.copy(this.obj.scale);
      // this.animTargetScale.copy(this.baseScale);
      // console.log('scaling ', shoe.name);
    }
    else if (!shouldFocus && this.isFocused) {
      // this.obj.scale.copy(this.baseScale);
      this.onShowHide(false);
      this.isFocused = false;

      this.animScaleTarget.copy(this.baseScale);
      this.animTime = 0;
      this.rotateEffect.rotsPerSec = this.baseRotSpeed;
      this.hoverEffect.slow = false;
      // this.ani

      this.meshes.forEach((mesh) => {
        mesh.layers.set(1);
      });
    }

    if (this.animTime < this.animDuration) {

      this.animTime += dt;
      // easeInQuad()
      if (this.animTime >= this.animDuration) {

      }
    }
  }
}

function vertexShader() {
  return `
  #include <common>
  #include <uv_pars_vertex>
  #include <uv2_pars_vertex>
  #include <envmap_pars_vertex>
  #include <color_pars_vertex>
  #include <fog_pars_vertex>
  #include <morphtarget_pars_vertex>
  #include <skinning_pars_vertex>
  #include <logdepthbuf_pars_vertex>
  #include <clipping_planes_pars_vertex>
  void main() {
    #include <uv_vertex>
    #include <uv2_vertex>
    #include <color_vertex>
    #include <morphcolor_vertex>
    #if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
      #include <beginnormal_vertex>
      #include <morphnormal_vertex>
      #include <skinbase_vertex>
      #include <skinnormal_vertex>
      #include <defaultnormal_vertex>
    #endif
    #include <begin_vertex>
    #include <morphtarget_vertex>
    #include <skinning_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>
    #include <worldpos_vertex>
    #include <envmap_vertex>
    #include <fog_vertex>
  }
  `;
}
  
function fragmentShader() {
  return `
  uniform vec3 diffuse;
  uniform float opacity;
  #ifndef FLAT_SHADED
    varying vec3 vNormal;
  #endif
  #include <common>
  #include <dithering_pars_fragment>
  #include <color_pars_fragment>
  #include <uv_pars_fragment>
  #include <uv2_pars_fragment>
  #include <map_pars_fragment>
  #include <alphamap_pars_fragment>
  #include <alphatest_pars_fragment>
  #include <aomap_pars_fragment>
  #include <lightmap_pars_fragment>
  #include <envmap_common_pars_fragment>
  #include <envmap_pars_fragment>
  #include <cube_uv_reflection_fragment>
  #include <fog_pars_fragment>
  #include <specularmap_pars_fragment>
  #include <logdepthbuf_pars_fragment>
  #include <clipping_planes_pars_fragment>
  void main() {
    #include <clipping_planes_fragment>
    vec4 diffuseColor = vec4( diffuse, opacity );
    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    // accumulation (baked indirect lighting only)
    #ifdef USE_LIGHTMAP
      vec4 lightMapTexel = texture2D( lightMap, vUv2 );
      reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
    #else
      reflectedLight.indirectDiffuse += vec3( 1.0 );
    #endif
    // modulation
    #include <aomap_fragment>
    reflectedLight.indirectDiffuse *= diffuseColor.rgb;
    vec3 outgoingLight = reflectedLight.indirectDiffuse;
    #include <envmap_fragment>
    #include <output_fragment>
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
    #include <premultiplied_alpha_fragment>
    #include <dithering_fragment>
  }
  `
}
