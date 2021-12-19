import {Globals} from './global.js';
import {startSound, changeBGM, toggleMute} from './sound.js';
const cursorDiv = document.getElementById('cursor');
const slider=document.getElementById("levelSlider");

function toggleNavs(open)
{
	const nav=document.getElementsByTagName("nav")[0];
	const muteButton=document.getElementById("muteButton");
	const side=document.getElementById("sideBar");

	if(open)
	{
		nav.classList.add('is_open');
		muteButton.classList.add('is_open');
		side.classList.add('is_open');
	}
	else
	{
		nav.classList.remove('is_open');
		muteButton.classList.remove('is_open');
		side.classList.remove('is_open');
	}
}

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
	const navCur=document.getElementById("navBar_cursor");
	const muteButton=document.getElementById("muteButton");
	const generateButtonFunc=function(to){
		return function()
		{
			main.style.transform = 'translateX(-' + to*25 + "%)";
			if(Globals.CURRENT_SCENE() != 0) navButton[Globals.CURRENT_SCENE()-1].classList.remove('aciveIco');
			if(to == 0) toggleNavs(false);
			else
			{
				toggleNavs(true);
				navButton[to-1].classList.add('aciveIco');
				navCur.style.transform="translate("+(-32 + 102 * to)+"px, -10px)";
				if(Globals.CURRENT_SCENE() == 0) startSound();
				changeBGM(Globals.CURRENT_SCENE(), to);
			}
			Globals.moveScene(to);
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
		}
		sceneNo++;
	}

	//for mobile overlay description
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

function changeSlider(value)
{
	const arrow=document.getElementById("levelArrow");
	const bubble=document.getElementById("levelBubble");
	arrow.style.top=(-115+230*value) +"px";
	bubble.style.transform="scale("+ (0.5 + value*0.5) +")";
}

function setSliderFunc()
{
	const sideBar=document.getElementById("sideBar");
	if(Globals.IS_MOBILE) sideBar.classList.add("mobile");
	slider.addEventListener("input", () => {
		let value=parseFloat(slider.value);
		sliderBG(value);
		changeSlider(value);
	});
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

function scrollBG(e)
{
	if(Globals.CURRENT_SCENE() == 0) return;

	//change level
	let scr=e.deltaY / 5000;
	Globals.addLevel(scr);

	slider.value=Globals.LEVEL();
	changeSlider(Globals.LEVEL());

	changeLevelBGColor();
}

function sliderBG(value)
{
	if(Globals.CURRENT_SCENE() == 0) return;

	//change level
	Globals.setLevel(value);

	changeLevelBGColor();
}

function changeLevelBGColor()
{
	//change background color
	document.body.style.backgroundColor=Globals.BGColor();
	if(Globals.levelChanged() == Globals.TO_BLACK()) document.body.classList.add("black");
	else if(Globals.levelChanged() == Globals.TO_WHITE()) document.body.classList.remove("black");
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
	Globals.setHue();
	cursorDiv.style.setProperty('--cursorHue', Globals.HUE());
	cursorDiv.style.setProperty('--cursorHue2', former);
}
function endCursor(e)
{
	cursorDiv.classList.remove('clicked');
	let former = cursorDiv.style.getPropertyValue("--cursorHue");
	cursorDiv.style.setProperty('--cursorHue2', former);
}

function initialize_DOM()
{
	setMobileDesc();
	setButtonFunc();
	setSliderFunc();

	document.addEventListener('wheel', scrollBG);
	document.addEventListener('mousemove', moveCursor);
	document.addEventListener('mousedown', changeCursor, true);
	cursorDiv.addEventListener("animationend", endCursor, false);
}

export {initialize_DOM};