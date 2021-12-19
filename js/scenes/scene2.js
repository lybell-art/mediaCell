import * as THREE from '../libs/three.module.js';
import {Globals} from '../global.js';
import {playSFX} from '../sound.js';
import {isCanvasOffscreen, renderScene, getMousePosition} from '../common.js';
import {MediaCellBlobs_Centre as MediaCells} from './object.js';

const container=document.getElementById("canvas2");
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera( 30, 1, 1, 2000 );

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

	let ambientLight = new THREE.AmbientLight( 0x444444 );
	scene.add( ambientLight );
}

function init()
{
	camera.position.set( 0, 0, 1000 );
	scene.background=new THREE.Color(Globals.BGColor());
	initLight();

	mediaCell=new MediaCells();
	mediaCell.addScene(scene);

	container.addEventListener("mousedown", onMousePressed);
	window.addEventListener( 'mouseup', onMouseReleased );
}

function animate(delta)
{
	let bright=(1-Globals.LEVEL());
	scene.background.setRGB(bright,bright,bright);
	mediaCell.update(Globals.LEVEL(), delta);
}

function render(renderer, delta)
{
	if(isCanvasOffscreen(renderer, container)) return;
	animate(delta);
	renderScene(scene, camera, renderer, container);
}

function onMousePressed(e) {
	isMousePressed=true;
	let mousePos=getMousePosition(e.clientX, e.clientY, container);
	mouse.set(mousePos.x, mousePos.y);

	raycaster.setFromCamera( mouse, camera );
	const intersect = raycaster.intersectObject( mediaCell.cube);

	if(intersect.length>0)
	{
		let newPoint=intersect[0].point;
		let matrix=mediaCell.hull.matrix;
		matrix.invert();
		newPoint.applyMatrix4(matrix);

		mediaCell.shoot(intersect[0].face.normal, intersect[0].point, Globals.HUE());
	}

}
function onMouseReleased(e) {
	isMousePressed=false;
}


export {init, render};