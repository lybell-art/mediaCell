import * as THREE from './libs/three.module.js';
import {mergeVertices} from './libs/plugins/BufferGeometryUtils.js';
import { MarchingCubes } from './libs/plugins/MarchingCubes.js';
import {getScreenPos, getMouseSphereLocation} from './common.js';

const CELL_DELETE = 0;
const CELL_PORTAL = 1;

/* For Scene 1 */
class springVertex
{
	constructor(x,y,z)
	{
		this.near=[];
		this.position=new THREE.Vector3(x,y,z);
		this.velocity=new THREE.Vector3();
	}
	addNearVertex(other)
	{
		let length=this.position.distanceTo(other.position);
		for(let i=0;i<this.near.length;i++)
		{
			if(other == this.near[i].obj) return;
		}
		this.near.push({obj:other, length:length});
	}
	addForce(dir, force)
	{
		this.velocity.set(0,0,0);
		this.velocity.addScaledVector(dir, force);
	}
	simulate(mass, stiff, damper)
	{
		let accel = new THREE.Vector3();
		for(let i=0;i<this.near.length;i++)
		{
			let other = this.near[i].obj;
			let l0 = this.near[i].length;

			let dir = this.position.clone().sub(other.position);
			let dist = dir.length();
			dir.normalize();

			let F1 = dir.clone().multiplyScalar(-(dist - l0) * stiff);
			let velDot = new THREE.Vector3().subVectors(this.velocity, other.velocity).dot(dir);
			let F2 = dir.clone().multiplyScalar(-velDot * damper);

			let F = new THREE.Vector3().addVectors(F1, F2).multiplyScalar(mass);
			accel.add(F);
		}

		accel.multiplyScalar(1/this.near.length);
		accel.addScaledVector(this.velocity, -damper);
		this.velocity.add(accel);
		this.position.add(this.velocity);
	}
}

class MediaCellSingle
{
	constructor()
	{
		this.springVertices=[];	//spring Vertex
		this.originVertex=new springVertex(0,0,0);	//origin spring vertex
		this.indices=[];	//vertex's indices

		//core mesh
		const coreGeometry = new THREE.SphereGeometry( 60, 24, 16 );
		const coreMaterial = new THREE.MeshPhongMaterial( {color:0x049ef4, shininess:24.0});
		coreMaterial.flatShading=true;
		this.core=new THREE.Mesh(coreGeometry, coreMaterial);

		//membrane mesh
		const membraneMaterial = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.clone( WireframeShader.uniforms ),
			vertexShader: WireframeShader.vertexShader,
			fragmentShader: WireframeShader.fragmentShader,
			side: THREE.DoubleSide,
			alphaToCoverage: true // only works when WebGLRenderer's "antialias" is set to "true"
		} );

		this.membraneGeo=new THREE.IcosahedronBufferGeometry(180, 3);
		wireframeSetupAttributes(this.membraneGeo);
		this.membrane=new THREE.Mesh(this.membraneGeo, membraneMaterial);
		this.membraneGeo.attributes.position.usage = THREE.DynamicDrawUsage;

		this.setSpring();
	}
	setSpring()
	{
		let geometry = this.membraneGeo;
		let position = geometry.attributes.position;


		const isSame=function(x1,x2,x3,y1,y2,y3)
		{
			let delta = 1e-3;
			const equal = (a, b)=>(Math.abs(a-b)<delta);
			return equal(x1,y1) && equal(x2,y2) && equal(x3,y3);
		}

		let vertices=[];

		//non-duped vertex
		for(let i=0;i<position.count;i++)
		{
			let j=0;
			let x=position.getX(i), y=position.getY(i), z=position.getZ(i);
			for(j=0;j<vertices.length;j++)
			{
				if(isSame(x,y,z, vertices[j].x, vertices[j].y, vertices[j].z)) break;
			}
			//j:vertex's index
			if(j == vertices.length)
			{
				vertices.push({x:x, y:y, z:z});
				
				let spring=new springVertex(x, y, z);
				spring.addNearVertex(this.originVertex);
				this.springVertices.push(spring);
			}
			this.indices.push(j);
		}

		//connect vertex triangle
		for(let i=0;i<this.indices.length;i+=3)
		{
			let v=[this.indices[i], this.indices[i+1], this.indices[i+2]];
			for(let p=0;p<3;p++)
			{
				for(let q=0;q<3;q++)
				{
					if(v[p] == v[q]) continue;
					let v1=this.springVertices[v[p]];
					let v2=this.springVertices[v[q]];
					v1.addNearVertex(v2);
				}
			}
		}
	}

	addScene(scene)
	{
		scene.add(this.membrane);
		scene.add(this.core);
	}
	simulate()
	{
		const mass=1, stiff=0.15, damper=0.05;
		for(let i=0;i<this.springVertices.length;i++)
		{
			this.springVertices[i].simulate(mass, stiff, damper);
		}

		const geoPos=this.membraneGeo.attributes.position;
		for(let i=0;i<this.indices.length;i++)
		{
			let index=this.indices[i];
			let position=this.springVertices[index].position;
			
			geoPos.setXYZ(i, position.x, position.y, position.z);
		}
		geoPos.needsUpdate = true;
	}
	press(face, point, force, color=null)
	{
		let v=[null, null, null];
		v[0]=this.springVertices[ this.indices[face.a] ];
		v[1]=this.springVertices[ this.indices[face.b] ];
		v[2]=this.springVertices[ this.indices[face.c] ];

		let normal=face.normal.clone();

		for(let i=0;i<3;i++)
		{
			v[i].addForce(normal, -force);
		}
		if(typeof color == 'number')
		{
			this.core.material.color.setHSL(color/360.0, 1.0, 0.75 );
		}
	}
	update(level, delta)
	{
		this.membrane.material.uniforms.level.value = level;
		let scales=(level / 2 + 0.5);
		this.membrane.scale.setScalar(scales);
		this.simulate();
		this.core.rotation.y -= 0.3*delta;
		this.membrane.rotation.y += 0.15*delta;
	}
}

function getProjAxis(vec)
{
	let arr=vec.toArray();
	let big=-1, bigIndex=-1;
	for(let i=0;i<3;i++)
	{
		if(Math.abs(arr[i]) > big){
			big = arr[i];
			bigIndex = i;
		}
	}
	return bigIndex;
}

/* For Scene 3 */

function getLattice(vec)
{
	let res=[[0,0,0],[0,0,0],[0,0,0]];
	for(let i=0;i<3;i++)
	{
		for(let j=0;j<3;j++) res[i][j]=vec[i]*vec[j];
	}
	return res;
}

const textureCube=new THREE.CubeTextureLoader()
	.setPath( 'assets/' )
	.load( [
		'bg1.png',
		'bg1.png',
		'bg1.png',
		'bg1.png',
		'bg1.png',
		'bg1.png'
	] );
textureCube.mapping=THREE.CubeRefractionMapping;

const BLOB_MATERIAL = new THREE.MeshPhysicalMaterial( {
	color: 0xffffff,
	metalness: 0.15,
	roughness: 0.08,
	envMap: textureCube,
	envMapIntensity: 1,
	transmission: 0.85, // use material.transmission for glass materials
	specularIntensity: 1,
	opacity: 0.5,
	transparent: true
} );

class MediaCell
{
	static geometry=new THREE.SphereBufferGeometry(30, 12, 9);

	constructor(pos, dir, power=1, alive=true, func=null)
	{
		this.color = new THREE.Color();
		this.color.setHSL( Math.random(), 1, Math.random() * 0.2 + 0.6 );
		const material = new THREE.MeshBasicMaterial( { color: this.color, wireframe:true } );

		this.mesh = new THREE.Mesh( MediaCell.geometry, material );
//		this.mesh.layers.enable(1); //raycast

		this.position = pos.clone();
		this.mesh.position.copy(this.position);
		this.direction = dir.clone();
		this.rd=0;
		this.repulsion=new THREE.Vector3();

		this.power=power;
		if(this.power != 1) this.mesh.scale.setScalar(power);

		this.locked=false;
		this.alive=alive;
		if(!alive) this.deactivate();

		this.connection=func;
	}
	get posArr()
	{
		return this.position.toArray();
	}
	get posMatrix()
	{
		let mat=math.matrix([this.posArr]);
		return math.transpose(mat);
	}
	addScene(scene)
	{
		scene.add(this.mesh);
	}
	boundaryPortal(boundary, boundaryBehavior=CELL_DELETE)
	{
		const b = boundary + 15 * this.power;
		if(boundaryBehavior == CELL_PORTAL)
		{
			if(this.position.x > b) this.position.x -= b*2;
			else if(this.position.x < -b) this.position.x += b*2;
			if(this.position.y > b) this.position.y -= b*2;
			else if(this.position.y < -b) this.position.y += b*2;
			if(this.position.z > b) this.position.z -= b*2;
			else if(this.position.z < -b) this.position.z += b*2;
		}
		else
		{
			const out=(a)=>{return a>b || a<-b;};
			if(out(this.position.x) || out(this.position.y) || out(this.position.z)) this.deactivate();
		}
	}
	update(delta, boundary, boundaryBehavior=CELL_DELETE)
	{
		if(!this.locked) this.position.addScaledVector(this.direction, delta*10);
		this.boundaryPortal(boundary, boundaryBehavior);

		this.mesh.position.copy(this.position);
	}
	applyRepulsion(force)
	{
		if(!this.alive) return;
		this.repulsion.multiplyScalar(0.92);
		this.repulsion.addScaledVector(force, 0.08);
		this.mesh.position.add(this.repulsion);
	}
	lock()
	{
		this.locked=true;
	}
	unlock()
	{
		this.locked=false;
	}
	activate(pos=null, dir=null)
	{
		this.alive=true;
		this.mesh.visible=true;

		if(pos!=null)
		{
			this.position.copy(pos);
			this.mesh.position.copy(this.position);
		}
		if(dir != null) this.direction.copy(dir);
	}
	deactivate()
	{
		this.alive=false;
		this.mesh.visible=false;
	}
	changeColor(color)
	{
		this.color.copy(color);
		this.mesh.material.color.copy(color);
	}
}

class MediaCellBlobs
{
	constructor(amount, scale, boundaryBehavior){
		this.boundary=scale;
		this.boundaryBehavior=boundaryBehavior;

		this.cells=[];
		this.hull=new THREE.Group();

		this.blob = new MarchingCubes( 56, BLOB_MATERIAL, true, true, 100000  );
		this.blob.position.set(0,0,0);
		this.blob.scale.multiplyScalar( this.boundary );
		this.blob.isolation = 160;
		this.blob.enableUvs = false;
		this.blob.enableColors = false;
		this.hull.add(this.blob);

		this.level=1;

		for(let i=0;i<amount;i++)
		{
			let pos=new THREE.Vector3().randomDirection();
			pos.multiplyScalar( (Math.random()*0.5 + 0.2) * this.boundary);
			let dir=new THREE.Vector3().randomDirection();
			dir.multiplyScalar(Math.random()*8 + 5);
			this.addCell(pos, dir);
		}
		this.updateBlobs();
		this.hull.add(this.blob);

		this.active_cell_amount=amount;
	}
	get cell_amount()
	{
		return this.cells.length;
	}
	addScene(scene)
	{
		scene.add(this.hull);
	}
	addCell(pos, dir, power=1, active=true, func=null)
	{
		let newCell=new MediaCell(pos, dir, power, active, func);
		this.cells.push(newCell);
		newCell.addScene(this.hull);
		this.active_cell_amount++;
	}
	getMeanVector()
	{
		let vecs=[];
		for(let i=0;i<this.cell_amount;i++)
		{
			vecs.push(this.cells[i].posArr);
		}
		return math.mean(vecs, 0);
	}
	PCA()
	{
		//get covariance matrix
		let covariance=math.zeros(3,3);
		let mean=this.getMeanVector();
		let vvecs=[];
		for(let i=0;i<this.cell_amount;i++)
		{
			let pos=this.cells[i].posArr;
			let xi=[ pos[0]-mean[0], pos[1]-mean[1], pos[2]-mean[2] ]; //direct calculation is faster than using math.sub()
			vvecs.push(xi);

//			let lattice = math.multiply( math.transpose([xi]) , [xi] );
			let lattice=getLattice(xi);
			covariance=math.add( covariance, lattice );
		}
		covariance = math.divide(covariance, this.cell_amount);

		//get principal Vector
		let ans = math.eigs(covariance);
		let eigenvalue=ans.values.toArray();
		let eigenIndex=0;

		for(let i=2;i>=0;i--)
		{
			if(math.typeOf(eigenvalue[i]) == "complex" ) continue;
			if(eigenvalue[i] > 0) eigenIndex=i; break;
		}

		let principalVector=ans.vectors.toArray()[eigenIndex];

		//dimensionality reduction
		for(let i=0;i<this.cell_amount;i++)
		{
			let innerProd=math.multiply(vvecs[i], principalVector);
			this.cells[i].rd=innerProd;
		}

		return principalVector;
	}
	cellSort()
	{
		this.cells.sort(function (a, b) {
			if(a.alive && !b.alive) return -1;
			else if(b.alive && !a.alive) return 1;
			return a.rd - b.rd;
		});
	}
	repulsion(level=1)
	{
//		const maxDist=160*level;
//		const surfaceDist = (30 + 30 * level) * myCell.power;
		for(let i=0;i<this.active_cell_amount;i++)
		{
			let myCell=this.cells[i];
			let repulsiveVector=new THREE.Vector3(0,0,0);

			const maxDist=160*level * myCell.power;
			const surfaceDist = (30 + 30 * level) * myCell.power;

			for(let buho=-1;buho<2;buho+=2)
			{
				let j=i;
				while(Math.abs(myCell.rd - this.cells[j].rd) < surfaceDist)
				{
					j+=buho;
					if(j<0 || j>=this.active_cell_amount) break;

					const targetCell=this.cells[j];
					const targetPos=this.cells[j].position;

					let dist = myCell.position.distanceTo(targetPos);
					let prevDist = myCell.position.distanceTo(targetPos.clone().sub(targetCell.direction));
					if(dist < surfaceDist && prevDist > surfaceDist)
					{
						if(myCell.connection != null) myCell.connection(targetCell);
					}

					if(dist > maxDist) continue;
					let F=32*level/dist;
					let force=myCell.position.clone().sub(targetPos);
					repulsiveVector.addScaledVector(force, F);
				}
			}
			myCell.applyRepulsion(repulsiveVector);
		}
	}

	updateBlobs(level=1, multiplier)
	{
		const subtract = 12;
		const strength = ( (level * 0.2 + 0.1) * multiplier ) / ( ( Math.sqrt( this.cell_amount ) - 1 ) / 4 + 1 );

		this.blob.reset();
		for ( let i = 0; i < this.active_cell_amount; i ++ ) {
			const bally = this.cells[i].position.y / (this.boundary*2) + 0.5;
			const ballz = this.cells[i].position.z / (this.boundary*2) + 0.5;
			const ballx = this.cells[i].position.x / (this.boundary*2) + 0.5;
			this.blob.addBall( ballx, bally, ballz, strength * this.cells[i].power, subtract );

		}

	}
	update(level, delta)
	{
		this.active_cell_amount=0;
		for(let i=0;i<this.cell_amount;i++)
		{
			this.cells[i].update(delta, this.boundary, this.boundaryBehavior);
			if(this.cells[i].alive) this.active_cell_amount++;
		}
		this.PCA();
		this.cellSort();
		this.repulsion(level);
		this.updateBlobs(level);
		this.level=level;
	}
}

class MediaCellBlobs_Centre extends MediaCellBlobs
{
	constructor()
	{
		super(0, 150, CELL_DELETE);
		this.blob.init(20);

		let originCell=new MediaCell(new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0), 2, true, function(e){
			this.changeColor(e.color);
		});
		originCell.changeColor( new THREE.Color().setHSL(0.5,0.4,0.9) );
		this.cells.push(originCell);
		originCell.addScene(this.hull);
		this.active_cell_amount++;

		for(let i=0;i<20;i++)
		{
			this.addCell(new THREE.Vector3(), new THREE.Vector3(), 0.4, false);
		}

		//cube hull mesh
		const cubeMaterial = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.clone( WireframeShader.uniforms ),
			vertexShader: WireframeShader.vertexShader,
			fragmentShader: WireframeShader.fragmentShader,
			side: THREE.DoubleSide,
			alphaToCoverage: true // only works when WebGLRenderer's "antialias" is set to "true"
		} );

		const cubeGeo=new THREE.BoxBufferGeometry(300, 300, 300);
		wireframeSetupAttributes(cubeGeo);
		this.cube=new THREE.Mesh(cubeGeo, cubeMaterial);
		this.hull.add(this.cube);
	}
	activateCell(pos, dir, color=null)
	{
		if(this.active_cell_amount == this.cell_amount) return;
		this.cells[this.active_cell_amount].activate(pos, dir);
		if(color != null) this.cells[this.active_cell_amount].changeColor(color);
		this.active_cell_amount++;
	}
	updateBlobs(level=1)
	{
		super.updateBlobs(level, 40);
	}
	update(level, delta)
	{
		this.cube.material.uniforms.level.value = level;
		super.update(level, delta);
		this.hull.rotation.y += 0.15*delta;
	}
	shoot(face, position, color=null)
	{
		let pos=new THREE.Vector3().copy(position);
		let dir=pos.clone().normalize();
		dir.multiplyScalar(-0.5);
		dir.addScaledVector(face, -0.5);
		dir.multiplyScalar(16);

		let col=null;
		if(color != null) col = new THREE.Color().setHSL(color/360.0, 1.0, 0.75 );
		this.activateCell(pos,dir,col);

	}
}

class MediaCellBlobs_World extends MediaCellBlobs
{
	constructor()
	{
		super(75, 1200, CELL_PORTAL);
	}
	pick(camera, mouse)
	{
		let short={obj:null, mouseDist:null, dist:Infinity};

		let mouseNormal = new THREE.Vector2();
		mouseNormal.x = mouse.x/window.innerWidth *2
		mouseNormal.y = mouse.y/window.innerHeight *2;

		const raycaster=new THREE.Raycaster();
		raycaster.setFromCamera(mouseNormal,camera);
		let ray=raycaster.ray;
		let axisZ=new THREE.Vector3();
		camera.getWorldDirection ( axisZ );
		const radius = 60 + 60 * this.level;

		for (let i=0;i<this.cell_amount;i++) {
			const ball=this.cells[i];

			//get distance from camera
			let dist=ball.position.distanceTo(ray.origin);
			if(dist > short.dist) continue;

			//check overrapping
			const pa=ball.position.clone().sub(ray.origin);
			let forward = pa.dot(axisZ);
			if(forward < 0) continue;
			let crossVect=pa.cross(ray.direction);

			if (crossVect.length() <= radius)
			{
				//get mouse dist
				let screenPos = getScreenPos(camera, ball.position);
				short.obj = ball;
				short.mouseDist = new THREE.Vector2(screenPos.x - mouse.x, screenPos.y - mouse.y);
	//			console.log(screenPos, mouse);
				short.dist = dist;
			}
		}
		if(short.obj == null) return null;
		return short;
	}
	updateBlobs(level=1)
	{
		super.updateBlobs(level, 3);
	}
	drag(cell, camera, mouse)
	{
		let distance=cell.dist;
		let newMouse=new THREE.Vector2(mouse.x + cell.mouseDist.x, mouse.y + cell.mouseDist.y);

		let newLoc=getMouseSphereLocation(camera, newMouse, distance);

		cell.obj.position.copy(newLoc);
	}
}


//wireframe shader(from https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_wireframe.html)
const WireframeShader = {
	uniforms:{
		'level': { value: 0.0 }
	},
	vertexShader:`
		attribute vec3 center;
		varying vec3 vCenter;

		void main() {
			vCenter = center;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
		}
	`,
	fragmentShader:`
		uniform float level;
		varying vec3 vCenter;

		void main() {
			float thickness = mix(1.0, 3.0, level) * (gl_FrontFacing ? 1.0 : 0.6);
			vec3 afwidth = abs(fwidth( vCenter.xyz ));
			vec3 edge3 = smoothstep( ( thickness - 1.0 ) * afwidth, thickness * afwidth, vCenter.xyz );
			float edge = 1.0 - min( min( edge3.x, edge3.y ), edge3.z );
			gl_FragColor.rgb = (level > 0.5) ? vec3(0.96, 0.96, 1.0) : vec3(0.04, 0.04, 0.05);
			gl_FragColor.a = (gl_FrontFacing ? 1.0 : 0.4) * edge;

		}
	`
}
function wireframeSetupAttributes( geometry ) {
	const vectors = [
		new THREE.Vector3( 1, 0, 0 ),
		new THREE.Vector3( 0, 1, 0 ),
		new THREE.Vector3( 0, 0, 1 )
	];
	const position = geometry.attributes.position;
	const centers = new Float32Array( position.count * 3 );
	for ( let i = 0, l = position.count; i < l; i ++ ) {
		vectors[ i % 3 ].toArray( centers, i * 3 );
	}
	geometry.setAttribute( 'center', new THREE.BufferAttribute( centers, 3 ) );
}

export {MediaCellSingle, MediaCellBlobs_Centre, MediaCellBlobs_World};
