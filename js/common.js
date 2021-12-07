import {Vector2, Vector3, Raycaster} from './libs/three.module.js';
const raycaster=new Raycaster();

function isCanvasOffscreen(renderer, container)
{
	const rect = container.getBoundingClientRect();
	if ( rect.bottom < 0 || rect.top > renderer.domElement.clientHeight ||
		 rect.right < 0 || rect.left > renderer.domElement.clientWidth )
	{
		return true; // it's off screen
	}
	return false;
}

function renderScene(scene, camera, renderer, container)
{
	const rect = container.getBoundingClientRect();

	const width = rect.right - rect.left;
	const height = rect.bottom - rect.top;
	const left = rect.left;
	const bottom = renderer.domElement.clientHeight - rect.bottom;
	renderer.setViewport( left, bottom, width, height );
	renderer.setScissor( left, bottom, width, height );
	renderer.render(scene, camera);
}

function getMousePosition(mouseX, mouseY, container)
{
	const rect = container.getBoundingClientRect();
	const width = rect.right - rect.left;
	const height = rect.bottom - rect.top;
	const left = rect.left;
	const top = rect.top;

	let mouse={x:0, y:0};
	mouse.x = (mouseX - left) / width * 2 - 1;
	mouse.y = -(mouseY - top) / height * 2 + 1;

	return mouse;
}

function crossVector(a, b)
{
	const v=new Vector3();
	v.crossVectors(a,b);
	return v;
}

function getScreenPos(cam, pos)
{
	let camPos=cam.position.clone();
	let axisZ=new Vector3();
	cam.getWorldDirection ( axisZ );
	let axisX=crossVector(axisZ, new Vector3(0,1,0)).normalize();
	let axisY=crossVector(axisX, axisZ).normalize();

	let scaleBase=(window.innerHeight/2) / Math.tan(Math.PI * cam.fov/360);	
	let distZ=pos.dot(axisZ);

	let normalizedPos = pos.clone().multiplyScalar(scaleBase / distZ);
	let xPos = normalizedPos.dot(axisX);
	let yPos = normalizedPos.dot(axisY);

	return new Vector2(xPos, yPos);
}

function getMouseSphereLocation(camera, mousePos, radius)
{
	let mouseNormal = new Vector2();
	mouseNormal.x = mousePos.x/window.innerWidth *2
	mouseNormal.y = mousePos.y/window.innerHeight *2;

	raycaster.setFromCamera(mouseNormal,camera);
	let ray=raycaster.ray;

	let pos=ray.origin;
	let dir=ray.direction;

	let a=dir.lengthSq();
	let b=2 * pos.dot(dir);
	let c=pos.lengthSq() - radius * radius;

	let D=b*b - 4*a*c;

	if(D < 0) return null;
	else
	{
		let rootD=Math.sqrt(D);
		let mult1=(-b+rootD)/(2*a);
		let mult2=(-b-rootD)/(2*a);
		if(mult1 < 0) mult1 = Infinity;
		if(mult2 < 0) mult2 = Infinity;
		let resMult=Math.min(mult1, mult2);
		return pos.addScaledVector(dir, resMult);
	}
}

export {isCanvasOffscreen, renderScene, getMousePosition, getScreenPos, getMouseSphereLocation};