"use strict";
let audioContext = null;
let analyser = null;
let mediaStreamSource = null;
let noteElem = null;
let freqElem = null;
let buflen = 2048;
const maxPitch = Math.log10(622.25);//D#5
let buf = new Float32Array( buflen );
let noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
let charElem = null;
let ObTElem = null;
let ObBElem = null;
let ObT2Elem = null;
let ObB2Elem = null;
let scoreElem = null;
let score = 0;
let insideObstacle = false;
let canvasHeight = 572;
let charHeight = 60;
let series = 0;

//Altezza in pixel - nota
//Sistemare interfaccia
//Score: 1 -> 'score:' scompare dopo

//Aggiunte:
//Note sugli ostacoli, gettone in mezzo al buco che viene preso

//Sfondo con righe per le note (solo per beta test)

let fraMartino = [5, 7, 9, 5, 5, 7, 9, 5, 9, 10, 12, 12,  9, 10, 12, 12];
//console.log(fraMartino.length);
for(let i=0; i<fraMartino.length; i++){
	fraMartino[i] = (fraMartino[i]+12) * 16;
}

function starting() {

	series = 0;

	noteElem = document.getElementById( "note" );
	freqElem = document.getElementById( "freq" );
	charElem = document.getElementById( "character" );
	ObTElem = document.getElementById("obstacleT");
	ObBElem = document.getElementById("obstacleB");
	ObT2Elem = document.getElementById("obstacleT2");
	ObB2Elem = document.getElementById("obstacleB2");
	scoreElem = document.getElementById("score");
	
	function GenerationHoleRandom(ObB, ObT){
		let halfHole = 55;
		let random = Math.random() * (canvasHeight - halfHole * 2);
		let heightHole = Math.max(halfHole * 2, random);
		ObB.style.height = heightHole - halfHole + "px";
		ObT.style.height = canvasHeight - heightHole - halfHole + "px";
	}

	function GenerationHoleSeries(ObB, ObT){
	
		ObB.style.height = fraMartino[series] - 8 + "px";
		ObT.style.height = canvasHeight - fraMartino[series] - 110 + "px";
		series++;
		if(series == fraMartino.length)
			series = 0;
		//console.log(series);
		console.log(fraMartino);
	}

	function GenerationObstacle(){
		ObTElem.style.animation = 'none';
		ObBElem.style.animation = 'none'
		ObTElem.offsetHeight;
		ObBElem.offsetHeight;
		ObTElem.style.animation = 'obstacle 4s linear'; //Cambiati da 6 a 4
		ObBElem.style.animation = 'obstacle 4s linear';
		GenerationHoleSeries(ObBElem, ObTElem);
		//GenerationHoleRandom(ObBElem, ObTElem);
	}

	function GenerationObstacle2(){
		ObT2Elem.style.animation = 'none';
		ObB2Elem.style.animation = 'none'
		ObT2Elem.offsetHeight;
		ObB2Elem.offsetHeight;
		ObT2Elem.style.animation = 'obstacle 4s linear';
		ObB2Elem.style.animation = 'obstacle 4s linear';
		GenerationHoleSeries(ObB2Elem, ObT2Elem);
		//GenerationHoleRandom(ObB2Elem, ObT2Elem);
	}

	GenerationObstacle();
	setTimeout(GenerationObstacle2, 2000); //cambiato da 3000 a 2000

	ObBElem.addEventListener('animationend', () => {
		GenerationObstacle();
	});

	ObB2Elem.addEventListener('animationend', () => {
		GenerationObstacle2();
	});

	setInterval(function(){ 
		let ObstacleTLeft = parseInt(window.getComputedStyle(ObTElem).getPropertyValue("left"))+15;
		let ObstacleBLeft = parseInt(window.getComputedStyle(ObBElem).getPropertyValue("left"))+15;
		let ObstacleTBottom = parseInt(window.getComputedStyle(ObTElem).getPropertyValue("height"))-10;
		let ObstacleBTop = parseInt(window.getComputedStyle(ObBElem).getPropertyValue("height"))-10;
		let ObstacleT2Left = parseInt(window.getComputedStyle(ObT2Elem).getPropertyValue("left"))+15;
		let ObstacleB2Left = parseInt(window.getComputedStyle(ObB2Elem).getPropertyValue("left"))+15;
		let ObstacleT2Bottom = parseInt(window.getComputedStyle(ObT2Elem).getPropertyValue("height"))-10;
		let ObstacleB2Top = parseInt(window.getComputedStyle(ObB2Elem).getPropertyValue("height"))-10;
		let charY = parseInt(window.getComputedStyle(charElem).getPropertyValue("bottom"));
	
		if(((ObstacleTLeft < 100) && (ObstacleTLeft > 50)) || ((ObstacleT2Left < 100) && (ObstacleT2Left > 50))){// score incrementation
			insideObstacle = true;
		}else{
			if(insideObstacle == true){
			score += 1;
			scoreElem.innerHTML = score;
			insideObstacle = false;
			}
		}

		/*if(((ObstacleTLeft && ObstacleBLeft) < 100) && ((ObstacleTLeft && ObstacleBLeft) > 50)) {// collision detection
			if((charY < ObstacleBTop) || (charY > canvasHeight-charHeight - ObstacleTBottom)){
				alert("Game Over!");
			}
		}
		if(((ObstacleT2Left && ObstacleB2Left) < 100) && ((ObstacleT2Left && ObstacleB2Left) > 50)) {
			if((charY < ObstacleB2Top) || (charY > canvasHeight-charHeight - ObstacleT2Bottom)){
				alert("Game Over!");
			}
		}*/
	},10);
	
    navigator.mediaDevices.getUserMedia({audio: true}).then(gotStream);
}


function noteFromPitch( frequency ) {
	let noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
	return Math.round( noteNum ) + 69;
}

function autoCorrelate( buf, sampleRate ) {
	// Implements the ACF2+ algorithm
	let SIZE = buf.length;
	let rms = 0;

	for (let i=0;i<SIZE;i++) {
		const val = buf[i];
		rms += val*val;
	}
	rms = Math.sqrt(rms/SIZE);
	if (rms<0.02) // not enough signal
		return -1;

	var r1=0, r2=SIZE-1, thres=0.2;
	for (var i=0; i<SIZE/2; i++)
		if (Math.abs(buf[i])<thres) { r1=i; break; }
	for (var i=1; i<SIZE/2; i++)
		if (Math.abs(buf[SIZE-i])<thres) { r2=SIZE-i; break; }

	buf = buf.slice(r1,r2);
	SIZE = buf.length;

	let c = new Array(SIZE).fill(0);
	for (var i=0; i<SIZE; i++)
		for (let j=0; j<SIZE-i; j++)
			c[i] = c[i] + buf[j]*buf[j+i];

	let d=0; while (c[d]>c[d+1]) d++;
	let maxval=-1, maxpos=-1;
	for (let i=d; i<SIZE; i++) {
		if (c[i] > maxval) {
			maxval = c[i];
			maxpos = i;
		}
	}
	let T0 = maxpos;

	let x1=c[T0-1], x2=c[T0], x3=c[T0+1];
	let a = (x1 + x3 - 2*x2)/2;
	let b = (x3 - x1)/2;
	if (a) T0 = T0 - b/(2*a);

	return sampleRate/T0;
}

function updatePitch() {//it also update the character y position
	analyser.getFloatTimeDomainData( buf );
	let pitch = autoCorrelate( buf, audioContext.sampleRate );
    if (pitch == -1){
        noteElem.innerHTML = "--"
		freqElem.innerHTML = "--Hz";
		charElem.style.transition = "bottom 4s";
		charElem.style.bottom = 0;
    }else { //manca la scala note-px
        let note =  noteFromPitch( pitch );
        noteElem.innerHTML = noteStrings[note%12];
		freqElem.innerHTML = Math.round(pitch) + "Hz";
		//Velocità del pg aumentata da 0.7 a 0.4
		charElem.style.transition = "bottom 0.4s linear";  //16px a semitono 
		let pitchCor = Math.max(Math.log10(98), Math.log10(pitch))
		let buff1 = Math.min(pitchCor, maxPitch)-Math.log10(98);
		let buff2 = maxPitch - Math.log10(98);
		charElem.style.bottom =  buff1/buff2 * (canvasHeight-charHeight) + "px";
    }
}

function gotStream(stream) {
	audioContext = new AudioContext();
	mediaStreamSource = audioContext.createMediaStreamSource(stream);
	analyser = audioContext.createAnalyser();
	analyser.fftSize = buflen;
	mediaStreamSource.connect( analyser );
	setInterval(updatePitch, 100);
}

window.addEventListener("load", () => {
	starting();
});
