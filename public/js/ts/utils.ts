interface UniVec {
  x: number;
  y: number;
  z: number;
}
export function CANNONVec(vec3: UniVec) {
  return new CANNON.Vec3(vec3.x, vec3.y, vec3.z);
}

export function THREEVec(vec3: UniVec) {
  return new THREE.Vector3(vec3.x, vec3.y, vec3.z);
}

export function copyBodyTransform(body, mesh) {
  mesh.position.x = body.position.x;
  mesh.position.y = body.position.y;
  mesh.position.z = body.position.z;
  mesh.quaternion.x = body.quaternion.x;
  mesh.quaternion.y = body.quaternion.y;
  mesh.quaternion.z = body.quaternion.z;
  mesh.quaternion.w = body.quaternion.w;
}

export function copyBodyRot(body, mesh) {
  mesh.quaternion.x = body.quaternion.x;
  mesh.quaternion.y = body.quaternion.y;
  mesh.quaternion.z = body.quaternion.z;
  mesh.quaternion.w = body.quaternion.w;
}

export function copyMeshTransform(body, mesh) {
  body.position.x = mesh.position.x;
  body.position.y = mesh.position.y;
  body.position.z = mesh.position.z;
  body.quaternion.x = mesh.quaternion.x;
  body.quaternion.y = mesh.quaternion.y;
  body.quaternion.z = mesh.quaternion.z;
  body.quaternion.w = mesh.quaternion.w;
}

export function copyMeshRot(body, mesh) {
  body.quaternion.x = mesh.quaternion.x;
  body.quaternion.y = mesh.quaternion.y;
  body.quaternion.z = mesh.quaternion.z;
  body.quaternion.w = mesh.quaternion.w;
}

export function debounce(func){
  var timer;
  return function(event){
    if(timer) clearTimeout(timer);
    timer = setTimeout(func,100,event);
  };
}

function createParentAtCenter(obj) {
  console.log(obj, "reparenting obj at ", obj.position);

  // obj.geometry.computeBoundingBox();
  const bbox = new THREE.Box3();
  bbox.setFromObject(obj);
  console.log("bbox: ", bbox);
  // bbox.copy( obj.geometry.boundingBox ).applyMatrix4( obj.matrixWorld );
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  console.log("new center: ", center);

  const oldParent = obj.parent;
  obj.removeFromParent();

  const newParent = new THREE.Group();
  newParent.add(obj);
  oldParent.add(newParent);
  newParent.position.copy(center);
  console.log("ppos ", newParent.position, " pos; ", obj.position);

  return newParent;
}


