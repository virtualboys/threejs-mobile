// import { MathUtils } from "three";
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
  spinToDegrees: number;
  spinDir: number;

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
    if (this.spinToDegrees > 0) {
      const rotAmt = 20 * 2 * Math.PI * dt * this.rotsPerSec;
      this.spinToDegrees -= rotAmt;
      this.rotQuat.setFromAxisAngle(this.axis, this.spinDir * rotAmt);
    } else {
      this.rotQuat.setFromAxisAngle(this.axis, 2 * Math.PI * dt * this.rotsPerSec);
    }
    this.obj.quaternion.multiply(this.rotQuat);
  }

  spinTo(targetForward: THREE.Vector3) {
    const objQuat = new THREE.Quaternion();
    this.obj.children[0].getWorldQuaternion(objQuat);
    const objForward = new THREE.Vector3(0, 1, 0);
    objForward.applyQuaternion(objQuat);
    // this.obj.getWorldDirection(objForward);
    console.log('obj forward ', objForward, ' target forward: ', targetForward);
    this.spinToDegrees = objForward.angleTo(targetForward);
    this.spinDir = objForward.cross(targetForward).y > 0 ? 1 : -1;
    console.log('spinning to ', this.spinToDegrees);
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

  proximity = 3.4;
  scaleAmt = 1.9;
  animDuration = 1;
  lookAtDot = .94;
  // scaleAmt = 1;

  camera: THREE.PerspectiveCamera;
  onShowHide: (show: boolean) => void;

  private focusedShoeBackdrop: THREE.Material;
  private rotateEffect: RotateEffect;
  private hoverEffect: HoverEffect;
  private baseScale = new THREE.Vector3();
  private shoeWorld = new THREE.Vector3();
  private cameraWorld = new THREE.Vector3();
  private d = new THREE.Vector3();
  private isFocused = false;
  private baseRotSpeed: number;
  private meshes: THREE.Mesh[] = [];

  private animTime = this.animDuration;
  private animScaleTarget = new THREE.Vector3();
  private animOpacityTarget = 0;

  private setPos = false;


  constructor(shoe: THREE.Object3D, camera: THREE.PerspectiveCamera, focusedShoeBackdrop: THREE.Material, rotateEffect: RotateEffect, hoverEffect: HoverEffect, onShowHide: (show: boolean) => void) {
    super(shoe);

    this.camera = camera;
    this.focusedShoeBackdrop = focusedShoeBackdrop;
    this.rotateEffect = rotateEffect;
    this.hoverEffect = hoverEffect;
    this.baseRotSpeed = rotateEffect.rotsPerSec;
    this.baseScale.copy(shoe.scale);
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

    if (!this.setPos) {
      this.obj.getWorldPosition(this.shoeWorld);
      this.setPos = true;
    }
    this.camera.getWorldPosition(this.cameraWorld);
    this.d.copy(this.shoeWorld).sub(this.cameraWorld);

    this.d.y = 0;
    const inRange = this.d.lengthSq() < this.proximity * this.proximity;

    if (this.animTime < this.animDuration) {
      const t = this.animTime / this.animDuration;
      this.obj.scale.lerp(this.animScaleTarget, t);
      //@ts-ignore
      this.focusedShoeBackdrop.opacity = THREE.MathUtils.lerp(this.focusedShoeBackdrop.opacity, this.animOpacityTarget, t);
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
      if (this.d.dot(camLook) > this.lookAtDot) {
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
      this.animOpacityTarget = .9;
      this.animTime = 0;
      this.rotateEffect.rotsPerSec = .6 * this.baseRotSpeed;
      // this.rotateEffect.spinTo(this.d);
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
      this.animOpacityTarget = 0;
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
