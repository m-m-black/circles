let currentCircle;
let circles;
let sessionStarted;
const MAX_CIRCLES = 5;
const C_MAJOR = [48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72];

function setup() {
	createCanvas(windowWidth, windowHeight);
	circles = [];
	sessionStarted = false;
}

function draw() {
	background(0);
	noFill();
	stroke(200);
	if (sessionStarted) {
		// Blank screen ready for drawing circles
		strokeWeight(2);
		circles.forEach(function(item, index, array) {
			item.display();
		})
	} else {
		// Welcome text
		fill(200);
		textSize(width / 50);
		textAlign(CENTER, CENTER);
		textFont("Comfortaa")
		text("INSTRUCTIONS:\nClick and drag to draw circles", width/2, height*(1/3));
		text("Click anywhere to start",  width/2, height*(2/3));
	}
}

function mousePressed() {
	if (sessionStarted) {
		// Create new circle
		let c = new Circle(mouseX, mouseY);
		circles.push(c);
		currentCircle = c;
		// Remove oldest circle
		if (circles.length > MAX_CIRCLES) {
			let oldC = circles.shift();
			oldC.osc.amp(0, 2.0);
			oldC.osc.stop(2.0);
		}
	} else {
		// First click of the game will go here
		sessionStarted = true;
	}
}

function mouseDragged() {
	if (sessionStarted && circles.length > 0) {
		let startX = currentCircle.x;
		let startY = currentCircle.y;
		// Add 1 to d value in case int() returns a value between 0 and 1
		let d = int(dist(startX, startY, mouseX, mouseY)) + 1;
		currentCircle.diameter = d;
		currentCircle.maxDiameter = d;
		if (!currentCircle.created) {
			currentCircle.created = true;
		}
	}
}

function mouseReleased() {
	// Don't start the oscillator playing until the mouse is released
	if (sessionStarted && circles.length  > 0) {
		// Circle must have been created first, by dragging
		if (currentCircle.created) {
			currentCircle.playing = true;
		} else {
			circles.pop();
		}
	}
}

class Circle {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.created = false; // Circle will only be created if mouse was dragged
		this.diameter = 0;
		this.maxDiameter = 0;
		this.playing = false;
		this.expanding = false;
		this.maxCutoff = 500;
		// Audio stuff
		this.filter = new p5.LowPass();

		// START - quantise frequency to C major scale
		this.rawFreq = map(this.x, 0, windowWidth, 120, 530);
		this.freq = quantise(this.rawFreq);
		// END - quantise frequency to C major scale

		// START - quantise frequency to chromatic scale
		// this.rawFreq = map(this.x, 0, windowWidth, 100, 1000);
		// this.midi = freqToMidi(this.rawFreq);
		// this.freq = midiToFreq(this.midi);
		// END - quantise frequency to chromatic scale

		this.osc = new p5.Oscillator(this.freq, 'sawtooth');
		this.osc.disconnect();
		this.osc.connect(this.filter);
		this.osc.start();
		this.osc.amp(0);
	}

	oscillate() {
		// First, we update the diameter of the circle
		if (this.expanding) {
			if (this.diameter < this.maxDiameter) {
				this.diameter += 5;
			} else {
				this.expanding = false;
			}
		} else {
			if (this.diameter > 5) {
				this.diameter -= 5;
			} else {
				this.expanding = true;
			}
		}
		// Then we update the filter cutoff frequency
		let freq = map(this.diameter, 0, this.maxDiameter, 50, this.maxCutoff);
		freq = constrain(freq, 100, this.maxCutoff);
		this.filter.freq(freq);
	}

	display() {
		ellipse(this.x, this.y, this.diameter, this.diameter);
		if (this.playing) {
			this.osc.amp(0.1, 0.5);
			this.oscillate();
		}
	}
}

// Take raw frequency as input, return that frequency quantised to a scale degree
function quantise(f) {
	let freq = null;
	for (let i = 0; i < C_MAJOR.length; i++) {
		if (f < midiToFreq(C_MAJOR[i])) {
			freq = midiToFreq(C_MAJOR[i]);
			break;
		}
	}
	return freq;
}
