let current_scene=0;
let level=0;
const cursorDiv = document.getElementById('cursor');
let myHue=15;
let masterChannel = new Tone.Channel(1.0, 0.0).toDestination();
let bubbleSampler, sound, distortSampler;
let muted=false;

function setButtonFunc()
{
	//button active function
	const navButton=[];
	for(let i=1; i<=3;i++)
	{
		const button=document.getElementById('scene' + i + '_ico');
		if(button == null) continue;
		navButton.push(button);
	}

	//transition function
	const main=document.getElementsByTagName("main")[0];
	const nav=document.getElementsByTagName("nav")[0];
	const navCur=document.getElementById("navBar_cursor");
	const muteButton=document.getElementById("muteButton");
	const generateButtonFunc=function(to){
		return function()
		{
			main.style.transform = 'translateX(-' + to*25 + "%)";
			if(current_scene != 0) navButton[current_scene-1].classList.remove('aciveIco');
			if(to == 0) nav.classList.remove('is_open');
			else
			{
				nav.classList.add('is_open');
				navButton[to-1].classList.add('aciveIco');
				navCur.style.transform="translate("+(-32 + 102 * to)+"px, -10px)";
			}
			current_scene=to;
		};
	}

	for(let i=0; i<3;i++)
	{
		const button=navButton[i];
		button.addEventListener('click', generateButtonFunc(i+1));
	}

	let sceneNo=1;
	for(let name of ["intro","scene1","scene2","scene3"])
	{
		sceneNo = sceneNo % 4;
		const scene=document.getElementById(name);
		if(scene == null) continue;

		//search button
		const buttons=scene.getElementsByClassName("nextButton");
		for(let i=0;i<buttons.length;i++)
		{
			buttons[i].addEventListener('click', generateButtonFunc(sceneNo));
			if(name == "intro") buttons[i].addEventListener('click', function(){
				bubbleSampler.triggerAttackRelease(["C1"], 0.5);
				Tone.start();});
		}
		sceneNo++;
	}
	for(let sceneNo=1;sceneNo<=3;sceneNo++)
	{
		const desc=document.getElementById("overlayDesc"+sceneNo);
		if(desc == null) continue;

		//search button
		const buttons=desc.getElementsByClassName("nextButton");
		for(let i=0;i<buttons.length;i++)
		{
			buttons[i].addEventListener('click', generateButtonFunc( (sceneNo+1)%4 ) );
		}
	}

	muteButton.addEventListener('click', toggleMute);
}

function cloneDesc(scene, overlay)
{
	const mainDescs = scene.getElementsByClassName("desc_in_main");

	if(mainDescs.length == 0) return;
	const mainDesc = mainDescs[0];

	let children = mainDesc.children;
	let wrapper = document.createElement('div');
	wrapper.classList.add('textWrapper');

	for(let i=0;i<children.length;i++)
	{
		let node = children[i].cloneNode(true);

		let buttonNodes=node.getElementsByClassName('nextButton');
		if(buttonNodes.length != 0)
		{
			buttonNodes[0].classList.add('black');
		}
		else node.classList.add('black');

		wrapper.appendChild(node);
	}

	overlay.appendChild(wrapper);
}

function setMobileDesc()
{
	//transition function
	const toggleMobbileDesc=function(overlay, on){
		return function()
		{
			if(on)
			{
				if(window.innerWidth > 720) return;
				overlay.classList.add('is_open');
			}
			else overlay.classList.remove('is_open');
		};
	}

	let no=0;
	for(let name of ["scene1","scene2","scene3"])
	{
		no++;
		const scene=document.getElementById(name);
		if(scene == null) continue;

		//overlay
		const overlay=document.getElementById("overlayDesc"+no);
		const titles=scene.getElementsByClassName("title");

		if(overlay == null || titles.length == 0) continue;
		const title=titles[0];

		//clone description
		cloneDesc(scene, overlay);

		//add click event
		title.addEventListener('click', toggleMobbileDesc(overlay, true));
		overlay.addEventListener('click', toggleMobbileDesc(overlay, false));

	}
}

function BGColor()
{
	return "hsl(0, 0%, "+ (1-level)*100 +"%)";
}

function scrollBG(e)
{
	if(current_scene == 0) return;

	//change level
	let scr=e.deltaY / 5000;
	let prevLevel = level;
	level +=scr;
	if(level <0) level =0;
	else if(level > 1) level = 1;

	//change background color
	document.body.style.backgroundColor=BGColor();
	if(prevLevel < 0.5 && level >= 0.5) document.body.classList.add("black");
	else if(prevLevel > 0.5 && level <= 0.5) document.body.classList.remove("black");
}

function makeBGNoise(freq, volume=0)
{
	const noise = new Tone.Noise("pink").start();
	const filter = new Tone.Filter({gain:12, frequency:50, type:"lowpass", Q:10}).connect(masterChannel);
	const filter2 = new Tone.Filter({gain:40, frequency:freq, type:"bandpass", Q:90}).connect(masterChannel);

	noise.connect(filter);
	noise.connect(filter2);
//	noise.connect(masterChannel);
	noise.volume.value = volume;
}

function makeBGAmbient(freq, volume=0)
{
	const ambient = new Tone.Oscillator({
			"frequency":freq,
			"partialCount": 3,
			"partials": [
				1,
				0.005,
				1
			],
			"phase": 90,
			"type":"sine"
		}).start();
	ambient.connect(masterChannel);
	ambient.volume.value = volume;
}

function makeSFX()
{
	bubbleSampler = new Tone.Sampler({
	urls: {
		C1: "assets/bubble.wav",
	}
	});
	bubbleSampler.volume.value = -5;
	bubbleSampler.connect(masterChannel);

	const limiter = new Tone.Limiter(-5);
	limiter.connect(masterChannel);

    const masterDelay = new Tone.PingPongDelay(0.25);
    masterDelay.wet = 0.3;
    masterDelay.connect(limiter);

    sound = new Tone.Synth({
		"volume": -10,
		"detune": 0,
		"portamento": 0.02,
		"envelope": {
			"attack": 0.05,
			"attackCurve": "exponential",
			"decay": 0.01,
			"decayCurve": "exponential",
			"release": 2,
			"releaseCurve": "exponential",
			"sustain": 0.5
		},
		"oscillator": {
			"partialCount": 3,
			"partials": [
				1,
				0.005,
				1
			],
			"phase": 90,
			"type":"sine"
		}
	});

	sound.connect(masterDelay);
}

function makeBGM()
{
	makeBGNoise(100, 0);
	makeBGNoise(540, -6);
	makeBGNoise(720, -12);
//	makeBGAmbient(180, -24);
	distortSampler = new Tone.Filter({gain:12, frequency:30000, type:"highpass", Q:10});
	distortSampler.connect(masterChannel);
}

function playSFX(hue)
{
	let hue2 = Math.floor(hue/15)-12;
	let freq = Math.pow(2,((hue2)/12))*440;
	sound.triggerAttackRelease(freq, 0.1);
	bubbleSampler.triggerAttackRelease("C1", 1.0);
	
}

function distortBGM(freq)
{
	distortSampler.frequency.value=freq;
}

function toggleMute()
{
	muted = !muted;
	const muteButton=document.getElementById("muteButton");
	const muteTxt=document.getElementById("muteTxt");
	console.log(masterChannel.muted);
	if(muted)
	{
		muteButton.classList.add("muted");
		muteTxt.innerText="Unmute";
		masterChannel.mute=true;
		
	}
	else{
		muteButton.classList.remove("muted");
		muteTxt.innerText="Mute";
		masterChannel.mute=false;
	}
}


function initialize()
{
	makeBGM();
	makeSFX();
	setMobileDesc();
	setButtonFunc();
	document.addEventListener('wheel', scrollBG);
	document.addEventListener('mousemove', moveCursor);
	document.addEventListener('mousedown', changeCursor, true);
	cursorDiv.addEventListener("animationend", endCursor, false);
}

//dynamic cursor
function moveCursor(e)
{
	cursorDiv.style.top=e.clientY + "px";
	cursorDiv.style.left=e.clientX + "px";
}
function changeCursor(e)
{
	cursorDiv.classList.add('clicked');
	let former = cursorDiv.style.getPropertyValue("--cursorHue");
	myHue=math.randomInt(0, 360);
	cursorDiv.style.setProperty('--cursorHue', myHue);
	cursorDiv.style.setProperty('--cursorHue2', former);
}
function endCursor(e)
{
	cursorDiv.classList.remove('clicked');
	let former = cursorDiv.style.getPropertyValue("--cursorHue");
	cursorDiv.style.setProperty('--cursorHue2', former);
}

initialize();