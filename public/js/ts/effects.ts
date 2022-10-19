import { easeInQuad, easeOutQuad, easeOutQuart } from "./easing-functions.js";

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
    this.t += this.frequency * dt;
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

  proximity = 6;
  scaleAmt = 1.8;

  camera: THREE.Object3D;
  onShowHide: (show: boolean) => void;

  private startScale = new THREE.Vector3();
  private shoeWorld = new THREE.Vector3();
  private cameraWorld = new THREE.Vector3();
  private d = new THREE.Vector3();
  private isFocused = false;

  constructor(shoe: THREE.Object3D, camera: THREE.Object3D, onShowHide: (show: boolean) => void) {
    super(shoe);

    this.camera = camera;
    this.startScale.copy(shoe.scale);
    this.onShowHide = onShowHide;
    shoe.getWorldPosition(this.shoeWorld);
  }

  update(dt: number): void {
    this.camera.getWorldPosition(this.cameraWorld);
    this.d.copy(this.shoeWorld).sub(this.cameraWorld);
    this.d.y = 0;

    const shouldFocus = this.d.lengthSq() < this.proximity * this.proximity;
    if (shouldFocus && !this.isFocused) {
      this.obj.scale.copy(this.startScale).multiplyScalar(this.scaleAmt);
      this.onShowHide(true);
      this.isFocused = true;
      // console.log('scaling ', shoe.name);
    }
    else if (!shouldFocus && this.isFocused) {
      this.obj.scale.copy(this.startScale);
      this.onShowHide(false);
      this.isFocused = false;
    }
  }
}
