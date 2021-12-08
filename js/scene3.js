import * as THREE from './libs/three.module.js';
import {isCanvasOffscreen, renderScene, getMousePosition} from './common.js';
import {MediaCellBlobs_World as MediaCells} from './object.js';

const container=document.getElementById("canvas3");
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000 );

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let mediaCell=null;
let pickedCell=null;
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

function init()
{
	camera.position.set( 0, 0, 0 );
	camera.rotation.order = 'YXZ';

	const bgCol = new THREE.Color(BGColor());
	scene.background=bgCol;
	scene.fog = new THREE.Fog(bgCol, 900, 1200);

	initLight();

	mediaCell=new MediaCells();
	mediaCell.addScene(scene);

	// EVENTS
	container.addEventListener( 'mousedown', onMousePressed );
	document.addEventListener( 'mousemove', onMouseMoved , false);
	window.addEventListener( 'mouseup', onMouseReleased );
	window.addEventListener( 'resize', onWindowResize );
}

function animate(delta)
{
	let bright=(1-level);
	scene.background.setRGB(bright,bright,bright);
	scene.fog.color.setRGB(bright,bright,bright);

	mediaCell.update(level, delta);
}

function render(renderer, delta)
{
	if(isCanvasOffscreen(renderer, container)) return;

	animate(delta);
	renderScene(scene, camera, renderer, container);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
}

function onMousePressed(e) {
	isMousePressed=true;
	pickedCell=mediaCell.pick(camera, mouse);
	if(pickedCell != null) pickedCell.obj.lock();
}
function onMouseMoved(e)
{
	if(current_scene != 3) return;
	mouse.x = e.clientX - window.innerWidth /2;
	mouse.y = -(e.clientY - window.innerHeight/2);
	if(isMousePressed)
	{
		if(pickedCell == null)
		{
			camera.rotation.x += e.movementY/500;
			camera.rotation.y += e.movementX/500;
		}
		else
		{
			mediaCell.drag(pickedCell, camera, mouse, pickedCell.mouseDist);
		}
	}
}
function onMouseReleased(e) {
	isMousePressed=false;
	if(pickedCell != null)
	{
		pickedCell.obj.unlock();
		pickedCell=null;
	}
}

export {init, render};