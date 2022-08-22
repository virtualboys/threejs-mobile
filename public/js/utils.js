function CANNONVec(vec3) {
	return new CANNON.Vec3(vec3.x, vec3.y, vec3.z);
}

function THREEVec(vec3) {
	return new THREE.Vector3(vec3.x, vec3.y, vec3.z);
}

function copyBodyTransform(body, mesh) {
	mesh.position.x = body.position.x;
	mesh.position.y = body.position.y;
	mesh.position.z = body.position.z;
	mesh.quaternion.x = body.quaternion.x;
	mesh.quaternion.y = body.quaternion.y;
	mesh.quaternion.z = body.quaternion.z;
	mesh.quaternion.w = body.quaternion.w;
}

function copyBodyRot(body, mesh) {
	mesh.quaternion.x = body.quaternion.x;
	mesh.quaternion.y = body.quaternion.y;
	mesh.quaternion.z = body.quaternion.z;
	mesh.quaternion.w = body.quaternion.w;
}

function copyMeshTransform(body, mesh) {
	body.position.x = mesh.position.x;
	body.position.y = mesh.position.y;
	body.position.z = mesh.position.z;
	body.quaternion.x = mesh.quaternion.x;
	body.quaternion.y = mesh.quaternion.y;
	body.quaternion.z = mesh.quaternion.z;
	body.quaternion.w = mesh.quaternion.w;
}

function copyMeshRot(body, mesh) {
	body.quaternion.x = mesh.quaternion.x;
	body.quaternion.y = mesh.quaternion.y;
	body.quaternion.z = mesh.quaternion.z;
	body.quaternion.w = mesh.quaternion.w;
}