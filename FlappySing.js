"use strict";							
let audioContext = null;
let analyser = null;
let mediaStreamSource = null;
let noteElem = null;
let freqElem = null;
let buflen = 2048;
let buf = new Float32Array( buflen );
let noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
let noteString2 = ["G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#"];//questa è una bella porcata
let charElem = null;											//MIDI
let ObTElem = null;			// G2:0, G#2:1, A2:2, A#2:3, B2:4, C3:5, C#3:6, D3:7, D#3:8, E3:9, F3:10, F#3:11, G3: 12
let ObBElem = null;
let ObT2Elem = null;
let ObB2Elem = null;
let scoreElem = null;
let targetNoteElem = null;
let targetNote2Elem = null;
let score = 0;
let insideObstacle = false;
let series = 0;
let oldBuff = [];
let allowMovement = 0
let oldNote;
//PARAMETRI
const maxPitch = Math.log10(622.25);//D#5
let charFallVelocity = 4;
let charToTargetVelocity = 0.4;
let charPitchOutOfRangeVelocity = 6;
let ObVel = 4; //Obstacle velocity  //si potrebbe legare la ObVel alla charToTargetVelocity con qualche relazione furba
let canvasHeight = 572;
let charHeight = 60;
let PxSemitone = 16; //pixxel a semitono
let errorMargin = 18; //pixxel che separano il personaggio dagli ostacoli supponendo una perfetta intonazione

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

function starting() {

	series = 0;
	noteElem = document.getElementById( "note" );
	freqElem = document.getElementById( "freq" );
	targetNoteElem = document.getElementById( "targetNote" );
	targetNote2Elem = document.getElementById( "targetNote2" );
	charElem = document.getElementById( "character" );
	ObTElem = document.getElementById("obstacleT");
	ObBElem = document.getElementById("obstacleB");
	ObT2Elem = document.getElementById("obstacleT2");
	ObB2Elem = document.getElementById("obstacleB2");
	scoreElem = document.getElementById("score");
	
	function GenerationHoleRandom(ObB, ObT){
		let randomNote = Math.round(Math.random() * 26) + 3; //escludo le 3 note più alte e le 3 più basse => 32-6
		if(randomNote - oldNote > 12){ //evitò di generare intervalli maggiori di un'ottava
			randomNote = randomNote -12;
		}else if(randomNote - oldNote < -12){
			randomNote = randomNote + 12;
		}
		ObB.style.height = randomNote * PxSemitone - errorMargin + "px";
		ObT.style.height = canvasHeight - randomNote * PxSemitone - charHeight - errorMargin + "px";
		oldNote = randomNote;
		return randomNote;
	}

	function GenerationHoleSeries(ObB, ObT, song){
	
		ObB.style.height = song[series]*PxSemitone - errorMargin + "px";
		ObT.style.height = canvasHeight - song[series]*PxSemitone - charHeight - errorMargin + "px";
		series++;
		if(series == song.length)
			series = 0;
	}

	function GenerationObstacle(song, mode){
		ObTElem.style.animation = 'none';
		ObBElem.style.animation = 'none'
		ObTElem.offsetHeight;
		ObBElem.offsetHeight;
		ObTElem.style.animation = 'obstacle ' + ObVel + 's linear';
		ObBElem.style.animation = 'obstacle ' + ObVel + 's linear';
		if (mode){
			let note = GenerationHoleRandom(ObBElem, ObTElem);
			targetNoteElem.innerHTML = noteString2[note%12];
			targetNoteElem.style.animation = 'none';
			targetNoteElem.offsetHeight;
			targetNoteElem.style.animation = 'obstacle ' + ObVel + 's linear';
			targetNoteElem.style.bottom = note * PxSemitone  + "px";
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
			let note = GenerationHoleRandom(ObB2Elem, ObT2Elem);
			targetNote2Elem.innerHTML = noteString2[note%12];
			targetNote2Elem.style.animation = 'none';
			targetNote2Elem.offsetHeight;
			targetNote2Elem.style.animation = 'obstacle ' + ObVel + 's linear';
			targetNote2Elem.style.bottom = note * PxSemitone + "px";

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
			scoreElem.innerHTML = `score: ${score}`;
			insideObstacle = false;
			}
		}
		if (ObstacleTLeft < 110){//gettone preso
			targetNoteElem.innerHTML = null;
		}else if(ObstacleT2Left < 110) {
			targetNote2Elem.innerHTML = null;
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
        
		freqElem.innerHTML = Math.round(pitch) + "Hz";
		let pitchCor = Math.max(Math.log10(98), Math.log10(pitch))
		let buff1 = Math.min(pitchCor, maxPitch)-Math.log10(98);
		let buff2 = maxPitch - Math.log10(98);
		for (let i=0; i<3; i++){
			if(Math.abs(oldBuff[2-i] - buff1) < 0.02){
				allowMovement++;

			}else{
				allowMovement = 0;
			}
		}
		if (allowMovement > 2){
			charElem.style.transition = "bottom " + charToTargetVelocity + "s linear"; 
			charElem.style.bottom =  buff1/buff2 * (canvasHeight-charHeight) + "px";
			noteElem.innerHTML = noteStrings[note%12];
			allowMovement = 0;
			
		}
		if(oldBuff.length == 3){
			oldBuff.shift();
		}
		oldBuff.push(buff1);
    }
}

function gotStream(stream) {
	audioContext = new AudioContext();
	mediaStreamSource = audioContext.createMediaStreamSource(stream);
	analyser = audioContext.createAnalyser();
	analyser.fftSize = buflen;
	mediaStreamSource.connect( analyser );
	setInterval(updatePitch, 50);
}

window.addEventListener("load", () => {
	starting();
});
