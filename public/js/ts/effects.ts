export interface Effect {
  update: (dt: number) => void;
}
export const rotateEffect = (
  obj: THREE.Object3D,
  rotsPerSec: number,
  axis: THREE.Vector3
): Effect => {
  const rotQuat = new THREE.Quaternion();
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
