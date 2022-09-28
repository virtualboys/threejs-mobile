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

// export function copyMeshTransform(body: CANNON.Body, mesh: THREE.Object3D) {
//   const worldPos = mesh.getWorldPosition(new THREE.Vector3());
//   const worldQuat = mesh.getWorldQuaternion(new THREE.Quaternion());
//   // const worldScale = mesh.getWorldScale(new THREE.Vector3());
//   body.position.x = worldPos.x;
//   body.position.y = worldPos.y;
//   body.position.z = worldPos.z;
//   body.quaternion.x = worldQuat.x;
//   body.quaternion.y = worldQuat.y;
//   body.quaternion.z = worldQuat.z;
//   body.quaternion.w = worldQuat.w;
  
// }

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

export function reparentKeepWorldPos(obj: THREE.Object3D, newParent: THREE.Object3D) {
  const worldPos = obj.getWorldPosition(new THREE.Vector3());
  const worldQuat = obj.getWorldQuaternion(new THREE.Quaternion());
  const worldScale = obj.getWorldScale(new THREE.Vector3());
  
  obj.removeFromParent();
  obj.position.copy(worldPos);
  obj.quaternion.copy(worldQuat);
  obj.scale.copy(worldScale);
  
  newParent.attach(obj);
}

export function createParentAtCenter(obj: THREE.Object3D) : THREE.Object3D {
  console.log(obj, "reparenting obj at ", obj.position);
  // return obj;

  // obj.geometry.computeBoundingBox();
  const bbox = new THREE.Box3();
  bbox.setFromObject(obj, true);
  console.log("bbox: ", bbox);
  // bbox.copy( obj.geometry.boundingBox ).applyMatrix4( obj.matrixWorld );
  const center = new THREE.Vector3();
  bbox.getCenter(center);
  console.log("new center: ", center);

  const oldParent = obj.parent;
  obj.removeFromParent();

  const newParent = new THREE.Group();
  newParent.position.copy(center);

  newParent.add(obj);

  obj.traverse((child)=>{
    if((child as THREE.Mesh).isMesh) {
      const m = child as THREE.Mesh;
      m.geometry.center();
    }
  });

  // obj.geometry.center();
  oldParent.add(newParent);
  console.log("ppos ", newParent.position, " pos; ", obj.position);

  return newParent;
}


