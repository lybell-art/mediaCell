import {PeakDetect} from './libs/tone.peakdetect.js';

let masterChannel = new Tone.Channel(1.0, 0.0).toDestination();
let bubbleSampler, sound, distortSampler;
let bgm1, bgm2, fft=new Tone.FFT(256);
fft.normalRange=true;
let muted=false;

let peakDetector=new PeakDetect(20,800);
let peakAmp=1.0;

function startSound(){
	bubbleSampler.triggerAttackRelease(["C1"], 0.5);
	bgm1.start();
	bgm2.start();
	Tone.start();
}

function changeBGM(from, to)
{
	let isF=(a)=>{return a<3;};
	let isS=(a)=>{return a==3;};
	if(isS(to) ) // scene 1/2 => scene 3
	{
		if(isF(from)) bgm1.volume.rampTo(-64,2, "+1");
		bgm2.volume.rampTo(-20,2);
	}
	else if(isF(to))
	{
		if(isS(from)) bgm2.volume.rampTo(-64,2, "+1");
		bgm1.volume.rampTo(0,2);
	}
}


function makeBGNoise(freq, volume=0)
{
	const noise = new Tone.Noise("pink").start();
	const filter = new Tone.Filter({gain:12, frequency:50, type:"lowpass", Q:10}).connect(masterChannel);
	const filter2 = new Tone.Filter({gain:40, frequency:freq, type:"bandpass", Q:90}).connect(masterChannel);

	noise.connect(filter);
	noise.connect(filter2);
	noise.volume.value = volume;
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

	const limiter = new Tone.Limiter(-5).connect(masterChannel);

    const masterDelay = new Tone.PingPongDelay(0.25);
    masterDelay.wet.value = 0.3;

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

	sound.chain(masterDelay, limiter);
}

function makeBGM()
{
	bgm1 = new Tone.Player("assets/bgm_1.mp3");
	bgm2 = new Tone.Player("assets/bgm_2.mp3");
	bgm1.loop=true; bgm2.loop=true;
	bgm1.volume.value=0; bgm2.volume.value=-64;
	bgm2.connect(fft);
	distortSampler = new Tone.Filter({gain:24, frequency:30000, type:"lowpass", Q:10}).connect(masterChannel);
	bgm1.connect(distortSampler);
	bgm2.connect(distortSampler);
}

function playSFX(hue, bubbleSound=false)
{
	let hue2 = Math.floor(hue/15)-12;
	let freq = Math.pow(2,((hue2)/12))*440;
	sound.triggerAttackRelease(freq, 0.02);
	if(bubbleSound) bubbleSampler.triggerAttackRelease("C1", 1.0);
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
	if(muted)
	{
		muteButton.classList.add("muted");
		muteTxt.innerText="Unmute";
		masterChannel.volume.rampTo(-64, 1);
		
	}
	else{
		muteButton.classList.remove("muted");
		muteTxt.innerText="Mute";
		masterChannel.volume.rampTo(0, 1);
	}
}

function initialize_Sound()
{
	makeBGM();
	makeSFX();
}

function getPeak()
{
	peakDetector.update(fft);
	if(peakDetector.isDetected) peakAmp=1;
	else peakAmp*=0.965;
	return peakAmp * (masterChannel.volume.value+64)/64 ;
}

export {startSound, changeBGM, initialize_Sound, playSFX, getPeak, distortBGM, toggleMute};