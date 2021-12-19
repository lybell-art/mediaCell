import * as THREE from '../libs/three.module.js';
import * as SCENE1 from './scene1.js';
import * as SCENE2 from './scene2.js';
import * as SCENE3 from './scene3.js';

let renderer;
let canvas;
const clock = new THREE.Clock();

function initRenderer()
{
	canvas = document.getElementById( 'c' );
	renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true, alpha:true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.setClearColor( 0xffffff, 1 );
	renderer.setPixelRatio( window.devicePixelRatio );
}

function onWindowResize() {
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function init()
{
	SCENE1.init();
	SCENE2.init();
	SCENE3.init();
	initRenderer();
	window.addEventListener( 'resize', onWindowResize );
}
function animate()
{
	requestAnimationFrame( animate );
	const delta = clock.getDelta();

	renderer.setClearColor( 0xffffff, 0 );
	renderer.setScissorTest( false );
	renderer.clear();
	renderer.setScissorTest( true );
	SCENE1.render(renderer, delta);
	SCENE2.render(renderer, delta);
	SCENE3.render(renderer, delta);
}

function start_canvas()
{
	init();
	animate();
}

export {start_canvas};