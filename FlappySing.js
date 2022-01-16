"use strict";							
let audioContext = null;
let analyser = null;
let mediaStreamSource = null;
let noteElem = null;
let freqElem = null;
let buflen = 2048;
let buf = new Float32Array( buflen );
let noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
let charElem = null;											//MIDI
let ObTElem = null;			// G2:0, G#2:1, A2:2, A#2:3, B2:4, C3:5, C#3:6, D3:7, D#3:8, E3:9, F3:10, F#3:11, G3: 12
let ObBElem = null;
let ObT2Elem = null;
let ObB2Elem = null;
let scoreElem = null;
let score = 0;
let insideObstacle = false;
let series = 0;
//PARAMETRI
const maxPitch = Math.log10(622.25);//D#5
let charFallVelocity = 4;
let charToTargetVelocity = 0.4;
let ObVel = 3; //Obstacle velocity  //si potrebbe legare la ObVel alla charToTargetVelocity con qualche relazione furba
let canvasHeight = 572;
let charHeight = 60;
let PxSemitone = 16; //pixxel a semitono
let errorMargin = 20; //pixxel che separano il personaggio dagli ostacoli supponendo una perfetta intonazione

//songs library  // la canzone dovrebbe contenere anche la velocità degli ostacoli e le velocità di movimento del pg
let fraMartino = [5, 7, 9, 5, 5, 7, 9, 5, 9, 10, 12, 12, 9, 10, 12, 12];
let perElisa = [21, 20, 21, 20, 21, 16, 19, 17, 14, 14, 5, 9, 14, 16, 16, 9, 13, 16, 17, 17, 9];

//game mode
let choosenSong = perElisa; 
let mode = true;// if true => random mode, if false => songs

//Altezza in pixel - nota
//Sistemare interfaccia
//Score: 1 -> 'score:' scompare dopo

//Aggiunte:
//Note sugli ostacoli, gettone in mezzo al buco che viene preso

//Sfondo con righe per le note (solo per beta test)

<<<<<<< HEAD

=======
let fraMartino = [5, 7, 9, 5, 5, 7, 9, 5, 9, 10, 12, 12,  9, 10, 12, 12];
//console.log(fraMartino.length);
for(let i=0; i<fraMartino.length; i++){
	fraMartino[i] = (fraMartino[i]) * 16;
}
>>>>>>> main

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
	
	function GenerationHoleRandom(ObB, ObT){ //da modificare usando errorMargin come in GenerationHoleSeries
		let halfHole = 55;
		let random = Math.random() * (canvasHeight - halfHole * 2);
		let heightHole = Math.max(halfHole * 2, random);
		ObB.style.height = heightHole - halfHole + "px";
		ObT.style.height = canvasHeight - heightHole - halfHole + "px";
	}

	function GenerationHoleSeries(ObB, ObT, song){
	
		ObB.style.height = song[series]*PxSemitone - errorMargin + "px";
		ObT.style.height = canvasHeight - song[series]*PxSemitone - charHeight - errorMargin + "px";
		series++;
		if(series == song.length)
			series = 0;
		//console.log(fraMartino);
	}

	function GenerationObstacle(song, mode){
		ObTElem.style.animation = 'none';
		ObBElem.style.animation = 'none'
		ObTElem.offsetHeight;
		ObBElem.offsetHeight;
		ObTElem.style.animation = 'obstacle ' + ObVel + 's linear'; //Generalizzato a ObstacleVelocity
		ObBElem.style.animation = 'obstacle ' + ObVel + 's linear';
		if (mode){
			GenerationHoleRandom(ObBElem, ObTElem);
		}else{
			GenerationHoleSeries(ObBElem, ObTElem, song);
		}
	}

	function GenerationObstacle2(song, mode){
		ObT2Elem.style.animation = 'none';
		ObB2Elem.style.animation = 'none'
		ObT2Elem.offsetHeight;
		ObB2Elem.offsetHeight;
		ObT2Elem.style.animation = 'obstacle ' + ObVel + 's linear';
		ObB2Elem.style.animation = 'obstacle ' + ObVel + 's linear';
		if (mode){
			GenerationHoleRandom(ObB2Elem, ObT2Elem);
		}else{
			GenerationHoleSeries(ObB2Elem, ObT2Elem, song);
		}
	}

	GenerationObstacle(choosenSong, mode);//chiamata iniziale
	setTimeout(function(){
		GenerationObstacle2(choosenSong, mode);
	}, ObVel/2 * 1000); 

	ObBElem.addEventListener('animationend', () => {
		GenerationObstacle(choosenSong, mode);
	});

	ObB2Elem.addEventListener('animationend', () => {
		GenerationObstacle2(choosenSong, mode);
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
			scoreElem.innerHTML = `score: ${score}`; //ho modificato qua
			insideObstacle = false;
			}
		}

		if(((ObstacleTLeft && ObstacleBLeft) < 100) && ((ObstacleTLeft && ObstacleBLeft) > 50)) {// collision detection
			if((charY < ObstacleBTop) || (charY > canvasHeight-charHeight - ObstacleTBottom)){
				alert("Game Over!");
			}
		}
		if(((ObstacleT2Left && ObstacleB2Left) < 100) && ((ObstacleT2Left && ObstacleB2Left) > 50)) {
			if((charY < ObstacleB2Top) || (charY > canvasHeight-charHeight - ObstacleT2Bottom)){
				alert("Game Over!");
			}
		}
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
	if (rms<0.01) // not enough signal
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
		charElem.style.transition = "bottom " + charFallVelocity +  "s";
		charElem.style.bottom = 0;
    }else { //manca la scala note-px
        let note =  noteFromPitch( pitch );
        noteElem.innerHTML = noteStrings[note%12];
		freqElem.innerHTML = Math.round(pitch) + "Hz";
		charElem.style.transition = "bottom " + charToTargetVelocity + "s linear";  //16px a semitono 
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
