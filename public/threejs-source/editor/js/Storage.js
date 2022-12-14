function Storage() {

	const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

	if ( indexedDB === undefined ) {

		console.warn( 'Storage: IndexedDB not available.' );
		return { init: function () {}, get: function () {}, set: function () {}, clear: function () {} };

	}

	const name = 'threejs-editor';
	const version = 1;

	let database;

	return {

		init: function ( callback ) {

			const request = indexedDB.open( name, version );
			request.onupgradeneeded = function ( event ) {

				const db = event.target.result;

				if ( db.objectStoreNames.contains( 'states' ) === false ) {

					db.createObjectStore( 'states' );

				}
				if ( db.objectStoreNames.contains( 'gltfCache' ) === false ) {

					db.createObjectStore( 'gltfCache' );

				}

			};

			request.onsuccess = function ( event ) {

				database = event.target.result;

				callback();

			};

			request.onerror = function ( event ) {

				console.error( 'IndexedDB', event );

			};


		},

		get: function ( callback ) {

			const transaction = database.transaction( [ 'states' ], 'readwrite' );
			const objectStore = transaction.objectStore( 'states' );
			const request = objectStore.get( 0 );
			request.onsuccess = function ( event ) {

				callback( event.target.result );

			};

		},

		set: function ( data ) {

			const start = performance.now();

			const transaction = database.transaction( [ 'states' ], 'readwrite' );
			const objectStore = transaction.objectStore( 'states' );
			const request = objectStore.put( data, 0 );
			request.onsuccess = function () {

				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved state to IndexedDB. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );

			};

		},

		savePreview: function ( data, callback ) {

			const start = performance.now();

			const transaction = database.transaction( [ 'gltfCache' ], 'readwrite' );
			const objectStore = transaction.objectStore( 'gltfCache' );
			const request = objectStore.put( data, 0 );
			request.onsuccess = function () {

				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Saved gltf to IndexedDB. ' + ( performance.now() - start ).toFixed( 2 ) + 'ms' );
				callback();

			};

		},

		getPreview: function ( callback ) {

			const transaction = database.transaction( [ 'gltfCache' ], 'readwrite' );
			const objectStore = transaction.objectStore( 'gltfCache' );
			const request = objectStore.get( 0 );
			request.onsuccess = function ( event ) {

				callback( event.target.result );

			};

		},

		clear: function () {

			if ( database === undefined ) return;

			const transaction = database.transaction( [ 'states' ], 'readwrite' );
			const objectStore = transaction.objectStore( 'states' );
			const request = objectStore.clear();
			request.onsuccess = function () {

				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Cleared IndexedDB.' );

			};
		},

		clearPreview: function(onSuccess) {
			const transaction2 = database.transaction( [ 'gltfCache' ], 'readwrite' );
			const objectStore2 = transaction2.objectStore( 'gltfCache' );
			const request2 = objectStore2.clear();
			request2.onsuccess = function () {

				console.log( '[' + /\d\d\:\d\d\:\d\d/.exec( new Date() )[ 0 ] + ']', 'Cleared gltf preview.' );
				onSuccess();
			};
		}

	};

}

export { Storage };
