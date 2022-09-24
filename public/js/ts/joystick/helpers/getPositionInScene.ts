// import { PerspectiveCamera, Vector3 } from 'three';

/**
 * Takes a touch point and converts it to a vector that represents that
 * position in the 3d world
 */
const getPositionInScene = (
  clientX: number,
  clientY: number,
  camera: THREE.PerspectiveCamera,
  yOffset: number,
  scale = 10,
): THREE.Vector3 => {
  const relativeX = (clientX / window.innerWidth) * 2 - 1;
  const relativeY = -(clientY / window.innerHeight) * 2 + 1;

  const inSceneTouchVector = new THREE.Vector3(relativeX, relativeY, 0)
    .unproject(camera)
    .sub(camera.position)
    .normalize()
    .multiplyScalar(scale);
  


  return camera
    .position
    .clone()
    .add(inSceneTouchVector)
    .add(new THREE.Vector3(0,yOffset,0));
};

export default getPositionInScene;
