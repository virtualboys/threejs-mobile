import { easeInQuad, easeOutQuad, easeOutQuart } from "./easing-functions.js";

export interface Effect {
  update: (dt: number) => void;
}
export const rotateEffect = (
  obj: THREE.Object3D,
  rotsPerSec: number,
  axis: THREE.Vector3
): Effect => {
  const rotQuat = new THREE.Quaternion();

  //random offset
  rotQuat.setFromAxisAngle(axis, 2 * Math.PI * Math.random());
  obj.quaternion.multiply(rotQuat);

  return {
    update: (dt: number) => {
      rotQuat.setFromAxisAngle(axis, 2 * Math.PI * dt * rotsPerSec);
      obj.quaternion.multiply(rotQuat);
    },
  };
};

export function hoverEffect(obj, height, frequency, axis): Effect {
  const d = new THREE.Vector3();
  let t = 0.5;
  return {
    update: (dt) => {
      d.copy(axis);
      t += frequency * dt;
      d.multiplyScalar(height * Math.sin(2 * Math.PI * t));
      obj.position.add(d);
    },
  };
}

export function bloomModEffect(pos: THREE.Vector3, player: THREE.Object3D, bloomPass, targetThreshold, targetStrength, targetRadius, effectRadius): Effect {
  const startThreshold = bloomPass.threshold;
  const startStrength = bloomPass.strength;
  const startRadius = bloomPass.radius;
  const d = new THREE.Vector3();
  let isAnimating = false;
  return {
    update: (dt) => {
      d.copy(pos);
      d.set(d.x, player.position.y, d.z);
      d.sub(player.position);
      if (d.lengthSq() > effectRadius * effectRadius) {
        if (isAnimating) {
          bloomPass.threshold = startThreshold;
          bloomPass.strength = startStrength;
          bloomPass.radius = startRadius;
          isAnimating = false;
        }
        return;
      } else {
        isAnimating = true;
        const t = 1 - (d.length() / effectRadius);
        bloomPass.threshold = easeOutQuart(t, startThreshold, targetThreshold - startThreshold, 1);
        bloomPass.strength = easeOutQuart(t, startStrength, targetStrength - startStrength, 1);
        bloomPass.radius = easeOutQuart(t, startRadius, targetRadius - startRadius, 1)
      }
    },
  };
}

export function shoeEffect(shoe: THREE.Object3D, camera: THREE.Object3D): Effect {
  const proximity = 6;
  const startScale = shoe.scale.clone();
  const scaleAmt = 1.8;
  const shoeWorld = new THREE.Vector3();

  shoe.getWorldPosition(shoeWorld);
  // const shoeBox = new THREE.Box3();
  // shoe.updateWorldMatrix(false, true);
  // shoeBox.setFromObject(shoe);
  // shoeBox.getCenter(shoeWorld);

  const cameraWorld = new THREE.Vector3();
  const d = new THREE.Vector3();
  return {
    update: (dt) => {
      camera.getWorldPosition(cameraWorld);
      d.copy(shoeWorld).sub(cameraWorld);
      d.y = 0;
      
      if(d.lengthSq() < proximity * proximity) {
        shoe.scale.copy(startScale).multiplyScalar(scaleAmt);
        // console.log('scaling ', shoe.name);
      }
      else {
        shoe.scale.copy(startScale);
      }
    }
  };
}
