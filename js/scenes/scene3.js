import * as THREE from '../libs/three.module.js';
import {Globals} from '../global.js';
import {getPeak, distortBGM} from '../sound.js';
import {isCanvasOffscreen, renderScene, getMousePosition, clamp} from '../common.js';
import {MediaCellBlobs_World as MediaCells} from './object.js';

const container=document.getElementById("canvas3");
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 2000 );

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let mediaCell=null;
let pickedCell=null;
let isMousePressed=false;

//for mobile
const hammertime = new Hammer(container);
hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });

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

function initEventListeners()
{
	// EVENTS
	container.addEventListener( 'mousedown', onMousePressed );
	document.addEventListener( 'mousemove', onMouseMoved , false);
	window.addEventListener( 'mouseup', onMouseReleased );
	window.addEventListener( 'resize', onWindowResize );
	if(Globals.IS_MOBILE)
	{
		hammertime.on('panstart', function(e){
			mouse.x = e.center.x- window.innerWidth /2;
			mouse.y = -(e.center.y - window.innerHeight/2);
			onMousePressed(null);
		});
		hammertime.on('panmove', function(e){
			onDragged(e.center.x, e.center.y, e.velocityY/20, e.velocityX/20);
		});
		hammertime.on('panend', onMouseReleased);
	}
}

function init()
{
	camera.position.set( 0, 0, 0 );
	camera.rotation.order = 'YXZ';

	const bgCol = new THREE.Color(Globals.BGColor());
	scene.background=bgCol;
	scene.fog = new THREE.Fog(bgCol, 900, 1200);

	initLight();

	mediaCell=new MediaCells();
	mediaCell.addScene(scene);

	initEventListeners();
}

function animate(delta)
{
	let bright=(1-Globals.LEVEL());
	scene.background.setRGB(bright,bright,bright);
	scene.fog.color.setRGB(bright,bright,bright);

	let amp=getPeak()*(1- 0.5*Globals.LEVEL()) + 1;
	mediaCell.update(Globals.LEVEL(), delta, amp);
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
	if(Globals.CURRENT_SCENE() != 3) return;

	isMousePressed=true;
	pickedCell=mediaCell.pick(camera, mouse);
	if(pickedCell != null)
	{
		pickedCell.obj.lock();
		let newColor=new THREE.Color();
		newColor.setHSL(Globals.HUE()/360.0, 1.0, 0.75 );
		pickedCell.obj.changeColor(newColor);
		distortBGM(600+mouse.x);
	}
}
function onMouseMoved(e)
{
	onDragged(e.clientX, e.clientY, e.movementY/500, e.movementX/500);
}
function onDragged(xPos, yPos, xDelta, yDelta)
{
	if(Globals.CURRENT_SCENE() != 3) return;
	mouse.x = xPos- window.innerWidth /2;
	mouse.y = -(yPos - window.innerHeight/2);
	if(isMousePressed)
	{
		if(pickedCell == null)
		{
			camera.rotation.x = clamp(camera.rotation.x += xDelta, -Math.PI/2, Math.PI/2);
			camera.rotation.y += yDelta;
		}
		else
		{
			mediaCell.drag(pickedCell, camera, mouse, pickedCell.mouseDist);
			distortBGM(600+xPos);
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
	distortBGM(30000);
}

export {init, render};