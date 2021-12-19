export const Globals = (function(){
	let current_scene=0;
	let prevLevel=0;
	let level=0;
	let myHue=15;

	let _TO_BLACK=1;
	let _TO_WHITE=-1;

	function CURRENT_SCENE(){return current_scene;}
	function LEVEL(){return level;}
	function HUE(){return myHue;}
	function TO_BLACK(){return 1;}
	function TO_WHITE(){return -1;}

	//is mobile
	
	const isMobile=(function()
	{
		try { document.createEvent("TouchEvent"); return true; }
		catch (e) { return false; }
	})();

	//set current scene
	function moveScene(to)
	{
		current_scene=to;
	}

	//set level
	function addLevel(delta)
	{
		prevLevel=level;
		level+=delta;
		if(level <0) level =0;
		else if(level > 1) level = 1;
	}
	function setLevel(value)
	{
		prevLevel=level;
		level=value;
		if(level <0) level =0;
		else if(level > 1) level = 1;
	}
	function levelChanged()
	{
		if(prevLevel < 0.5 && level >= 0.5) return _TO_BLACK;
		else if(prevLevel > 0.5 && level <= 0.5) return _TO_WHITE;
		else return 0;
	}

	//color
	function BGColor()
	{
		return "hsl(0, 0%, "+ (1-level)*100 +"%)";
	}
	function setHue()
	{
		myHue=Math.floor(Math.random() * 360);
	}


	//closure
	return {
		CURRENT_SCENE:CURRENT_SCENE,
		LEVEL:LEVEL,
		HUE:HUE,
		TO_BLACK:TO_BLACK,
		TO_WHITE:TO_WHITE,
		IS_MOBILE:isMobile,

		moveScene:moveScene,
		BGColor:BGColor,
		addLevel:addLevel,
		setLevel:setLevel,
		levelChanged:levelChanged,
		setHue:setHue
	}
})();