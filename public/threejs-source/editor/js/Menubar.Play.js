import { UIPanel } from './libs/ui.js';

function MenubarPlay( editor ) {

	const signals = editor.signals;
	const strings = editor.strings;

	const container = new UIPanel();
	container.setClass( 'menu' );

	let isPlaying = false;

	const title = new UIPanel();
	title.setClass( 'title' );
	title.setTextContent( strings.getKey( 'menubar/play' ) );
	title.onClick( function () {

		if ( isPlaying === false ) {

			// isPlaying = true;
			// title.setTextContent( strings.getKey( 'menubar/play/stop' ) );
			
			openPreview();
			// signals.startPlayer.dispatch();

		} else {

			// isPlaying = false;
			// title.setTextContent( strings.getKey( 'menubar/play/play' ) );
			// signals.stopPlayer.dispatch();

		}

	} );
	async function openPreview () {

		const scene = editor.scene;
		// const animations = getAnimations( scene );

		const { GLTFExporter } = await import( '../../examples/jsm/exporters/GLTFExporter.js' );

		const exporter = new GLTFExporter();

		exporter.parse( scene, function ( result ) {

			editor.storage.savePreview( JSON.stringify( result, null, 2 ), function() {
				window.open('/index.html');
			});

		}, undefined );


	} 

	container.add( title );

	return container;

}

export { MenubarPlay };
