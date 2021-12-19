//from p5.peakDetect.js
//tone.js version

function getEnergy(fft, frequency1, frequency2)
{
	let nyquist = fft.getFrequencyOfIndex(1);
	if (frequency1 > frequency2) {
		let swap = frequency2;
		frequency2 = frequency1;
		frequency1 = swap;
	}

	let lowIndex = Math.round(frequency1 / nyquist);
	let highIndex = Math.round(frequency2 / nyquist);

	let total = 0;
	let numFrequencies = 0; 

	let freq=fft.getValue();
	for (let i = lowIndex; i <= highIndex; i++) {
		total += freq[i] * 128;
		numFrequencies += 1;
	} 

	let toReturn = total / numFrequencies;
	return toReturn;
}

class PeakDetect {
	// framesPerPeak determines how often to look for a beat.
	// If a beat is provided, try to look for a beat based on bpm
	constructor(freq1, freq2, threshold, _framesPerPeak) {
		this.framesPerPeak = _framesPerPeak || 20;
		this.framesSinceLastPeak = 0;
		this.decayRate = 0.95;

		this.threshold = threshold || 0.35;
		this.cutoff = 0;

		// how much to increase the cutoff
		this.cutoffMult = 1.5;

		this.energy = 0;
		this.penergy = 0;

		this.currentValue = 0;

		/**
		 *  isDetected is set to true when a peak is detected.
		 *
		 *  @attribute isDetected {Boolean}
		 *  @default  false
		 */
		this.isDetected = false;

		this.f1 = freq1 || 40;
		this.f2 = freq2 || 20000;

		// function to call when a peak is detected
		this._onPeak = function () {};
	}

	/**
	*  The update method is run in the draw loop.
	*
	*  Accepts an FFT object. You must call .analyze()
	*  on the FFT object prior to updating the peakDetect
	*  because it relies on a completed FFT analysis.
	*
	*  @method  update
	*  @param  {tone.FFT} fftObject A tone.FFT object
	*/
	update(fftObject) {
		let nrg = (this.energy = getEnergy(fftObject, this.f1, this.f2));
		if (nrg > this.cutoff && nrg > this.threshold && nrg - this.penergy > 0) {
			// trigger callback
			this._onPeak();
			this.isDetected = true;

			// debounce
			this.cutoff = nrg * this.cutoffMult;
			this.framesSinceLastPeak = 0;
		} 
		else
		{
			this.isDetected = false;
			if (this.framesSinceLastPeak <= this.framesPerPeak) this.framesSinceLastPeak++;
			else
			{
				this.cutoff *= this.decayRate;
				this.cutoff = Math.max(this.cutoff, this.threshold);
			}
		}

		this.currentValue = nrg;
		this.penergy = nrg;
	}
	onPeak(callback, val) {
		var self = this;

		self._onPeak = function () {callback(self.energy, val);};
	}
}

export {PeakDetect};