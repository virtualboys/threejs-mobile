// import { BufferAttribute, BufferGeometry, Mesh, Object3D, Quaternion, Vector3 } from 'three';
// import type { Geometry } from '../../../../libs/threejs/deprecated/Geometry.js';

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q1 = new THREE.Quaternion();

/**
* Returns a single geometry for the given object. If the object is compound,
* its geometries are automatically merged. Bake world scale into each
* geometry, because we can't easily apply that to the cannonjs shapes later.
*/
export function getGeometry (object: THREE.Object3D): THREE.BufferGeometry | null {
	const meshes = getMeshes(object);
	if (meshes.length === 0) return null;

	// Single mesh. Return, preserving original type.
	if (meshes.length === 1) {
		return normalizeGeometry(meshes[0]);
	}

	// Multiple meshes. Merge and return.
	let mesh: THREE.Mesh | undefined;
	const geometries: THREE.BufferGeometry[] = [];
	while ((mesh = meshes.pop())) {
		geometries.push(simplifyGeometry(normalizeGeometry(mesh)));
	}

	return mergeBufferGeometries(geometries);
}

function normalizeGeometry (mesh: THREE.Mesh): THREE.BufferGeometry {
	let geometry: THREE.BufferGeometry = mesh.geometry;
	// if ((geometry as unknown as Geometry).toBufferGeometry) {
	// 	geometry = (geometry as unknown as Geometry).toBufferGeometry();
	// } else {
	// 	// Preserve original type, e.g. CylinderBufferGeometry.
		geometry = geometry.clone();
	// }

	mesh.updateMatrixWorld();
	mesh.matrixWorld.decompose(_v1, _q1, _v2);
	geometry.scale(_v2.x, _v2.y, _v2.z);
	return geometry;
}

/**
 * Greatly simplified version of BufferGeometryUtils.mergeBufferGeometries.
 * Because we only care about the vertex positions, and not the indices or
 * other attributes, we throw everything else away.
 */
function mergeBufferGeometries (geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
	let vertexCount = 0;
	for (let i = 0; i < geometries.length; i++) {
		const position = geometries[i].attributes.position;
		if (position && position.itemSize === 3) {
			vertexCount += position.count;
		}
	}

	const positionArray = new Float32Array(vertexCount * 3);

	let positionOffset = 0;
	for (let i = 0; i < geometries.length; i++) {
		const position = geometries[i].attributes.position;
		if (position && position.itemSize === 3) {
			for (let j = 0; j < position.count; j++) {
				positionArray[positionOffset++] = position.getX(j);
				positionArray[positionOffset++] = position.getY(j);
				positionArray[positionOffset++] = position.getZ(j);
			}
		}
	}

	return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
}

export function getVertices (geometry: THREE.BufferGeometry): Float32Array {
	const position = geometry.attributes.position;
	const vertices = new Float32Array(position.count * 3);
	for (let i = 0; i < position.count; i++) {
		vertices[i * 3] = position.getX(i);
		vertices[i * 3 + 1] = position.getY(i);
		vertices[i * 3 + 2] = position.getZ(i);
	}
	return vertices;
}

/**
* Returns a flat array of THREE.Mesh instances from the given object. If
* nested transformations are found, they are applied to child meshes
* as mesh.userData.matrix, so that each mesh has its position/rotation/scale
* independently of all of its parents except the top-level object.
*/
function getMeshes (object: THREE.Object3D): THREE.Mesh[] {
	const meshes: THREE.Mesh[] = [];
	object.traverse(function (o) {
		if ((o as THREE.Mesh).isMesh) {
			meshes.push(o as THREE.Mesh);
		}
	});
	return meshes;
}

export function getComponent(v: THREE.Vector3, component: string): number {
	switch(component) {
		case 'x': return v.x;
		case 'y': return v.y;
		case 'z': return v.z;
	}
	throw new Error(`Unexpected component ${component}`);
}

/**
* Modified version of BufferGeometryUtils.mergeVertices, ignoring vertex
* attributes other than position.
*
* @param {THREE.BufferGeometry} geometry
* @param {number} tolerance
* @return {THREE.BufferGeometry>}
*/
function simplifyGeometry (geometry: THREE.BufferGeometry, tolerance = 1e-4): THREE.BufferGeometry {

	tolerance = Math.max( tolerance, Number.EPSILON );

	// Generate an index buffer if the geometry doesn't have one, or optimize it
	// if it's already available.
	const hashToIndex: {[key: string]: number} = {};
	const indices = geometry.getIndex();
	const positions = geometry.getAttribute( 'position' );
	const vertexCount = indices ? indices.count : positions.count;

	// Next value for triangle indices.
	let nextIndex = 0;

	const newIndices = [];
	const newPositions = [];

	// Convert the error tolerance to an amount of decimal places to truncate to.
	const decimalShift = Math.log10( 1 / tolerance );
	const shiftMultiplier = Math.pow( 10, decimalShift );

	for ( let i = 0; i < vertexCount; i ++ ) {

		const index = indices ? indices.getX( i ) : i;

		// Generate a hash for the vertex attributes at the current index 'i'.
		let hash = '';

		// Double tilde truncates the decimal value.
		hash += `${ ~ ~ ( positions.getX( index ) * shiftMultiplier ) },`;
		hash += `${ ~ ~ ( positions.getY( index ) * shiftMultiplier ) },`;
		hash += `${ ~ ~ ( positions.getZ( index ) * shiftMultiplier ) },`;

		// Add another reference to the vertex if it's already
		// used by another index.
		if ( hash in hashToIndex ) {

			newIndices.push( hashToIndex[ hash ] );

		} else {

			newPositions.push( positions.getX( index ) );
			newPositions.push( positions.getY( index ) );
			newPositions.push( positions.getZ( index ) );

			hashToIndex[ hash ] = nextIndex;
			newIndices.push( nextIndex );
			nextIndex ++;

		}

	}

	// Construct merged BufferGeometry.

	const positionAttribute = new THREE.BufferAttribute(
		new Float32Array( newPositions ),
		positions.itemSize,
		positions.normalized
	);

	const result = new THREE.BufferGeometry();
	result.setAttribute( 'position', positionAttribute );
	result.setIndex( newIndices );

	return result;

}
