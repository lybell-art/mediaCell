import * as THREE from './libs/three.module.js';
import {isCanvasOffscreen, renderScene, getMousePosition} from './common.js';
import {MediaCellSingle} from './object.js';

const container=document.getElementById("canvas1");
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera( 75, 1, 1, 2000 );

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let mediaCell=null;
let isMousePressed=false;

function initLight()
{
	// LIGHTS
	let light = new THREE.DirectionalLight( 0xffffff );
	light.intensity=0.5;
	light.position.set( 0.5, 0.5, 1 );
	scene.add( light );

	let pointLight = new THREE.PointLight( 0x888888 );
	pointLight.position.set( 50, 50, 100 );
	scene.add( pointLight );

	let ambientLight = new THREE.AmbientLight( 0x999999 );
	scene.add( ambientLight );
}

function debugSphere()
{
	const geometry = new THREE.SphereGeometry( 15, 32, 16 );
	const material = new THREE.MeshPhongMaterial( { color: 0x00ff00 } );
	const sphere = new THREE.Mesh( geometry, material );
	sphere.position.z=0;
	scene.add( sphere );
}

function init()
{
	camera.position.set( 0, 0, 300 );
	scene.background=new THREE.Color(BGColor());
	initLight();
//	debugSphere();

	mediaCell=new MediaCellSingle();
	mediaCell.addScene(scene);

	container.addEventListener("mousemove", onMouseMove, false);
	container.addEventListener("mousedown", onMousePressed);
	window.addEventListener( 'mouseup', onMouseReleased );
}

function animate(delta)
{
	let bright=(1-level);
	scene.background.setRGB(bright,bright,bright);
	mediaCell.update(level, delta);
}

function render(renderer, delta)
{
	if(isCanvasOffscreen(renderer, container)) return;
	animate(delta);
	renderScene(scene, camera, renderer, container);
}

function onMouseMove( e ) {
	if(current_scene != 1) return;

	let mousePos=getMousePosition(e.clientX, e.clientY, container);
	mouse.set(mousePos.x, mousePos.y);

	if(isMousePressed)
	{
		nudge(4);
	}
}

function onMousePressed(e) {
	isMousePressed=true;
	let mousePos=getMousePosition(e.clientX, e.clientY, container);
	mouse.set(mousePos.x, mousePos.y);
	nudge(12);
}
function onMouseReleased(e) {
	isMousePressed=false;
}

function nudge(force)
{
	raycaster.setFromCamera( mouse, camera );
	const intersect = raycaster.intersectObject( mediaCell.membrane);
	if(intersect.length>0) mediaCell.press(intersect[0].face, intersect[0].point, force, myHue);
}

export {init, render};