"use strict";

import { autoCorrelate } from "./AutoCorrelate";
import { toDiffMenu, toGameOverMenu, toMainMenu, toModeMenu, toOptionsMenu, toSongMenu, toStartingScreen, toggleScreen } from "./ChangeMenu";

let audioContext = null; //will be created on page load
//Filter section: 90 - 1k bandpass
let filterNode1 = null; //created on page load
let filterNode2 = null; //created on page load
let analyser = null; //for pitch detection
let mediaStreamSource = null; //mic input node
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
let oldNote = 14;

//Pitch guiding
let pitchGuiding = false; //activation flag
let oscStorage = null; //global oscillator node variable
let gainStorage = null; //global gain node variable
let pitch1 = null; //pitch of obstacle 1
let pitch2 = null; //pitch of obstacle 2
let currentPitch = [null,null]; //pitch pipeline

//PARAMETRI
const maxFreq = 622.25;//D#5
const maxPitch = Math.log10(maxFreq);//D#5
let charFallVelocity = 4;
let charToTargetVelocity = 0.3;
let ObVel = 4; //Obstacle velocity in random mode
let canvasHeight = 572;
let charHeight = 60;
let PxSemitone = 16; //pixxel a semitono
let errorMargin = 20; //pixxel che separano il personaggio dagli ostacoli supponendo una perfetta intonazione
let lowerNoteLimit = 5; //G2 = 0; default to B2 = 4
let upperNoteLimit = 27; //default to B2+24 = B4; Max possible note is G5
let collisionDetection = true; //Disables collision flag (one time playing)
let intervalsVector = [];

//Songs library  // il primo elemento rappresenta la ObVel
let fraMartino = [2, 5, 7, 9, 5, 5, 7, 9, 5, 9, 10, 12, "*", 9, 10, 12, "*"]; //"*" => pausa
let perElisa = [1.5, 21, 20, 21, 20, 21, 16, 19, 17, 14, "*", 5, 9, 14, 16, "*", 9, 13, 16, 17, "*", 9];
let halo = [2, 9, 11, 12, 11, 14, 12, 11, 9, "*", 16, 17, 19, "*", 17, 14, 17, 16, "*", "*", 4, 7, 9, 12, 14, 11, "*", 9, 12, 11, 9, 11, 7, "*", 9, "*"]

//Game mode
let choosenSong = fraMartino; 
let mode = false;// if true => random mode, if false => songs


//Elements gets
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


function gameOverReset(refreshIntervalID,intervalOb1,intervalOb2,timeOutOb2){

	//STOP OSCILLATORS!!
	if(pitchGuiding){
		oscStop();
		oscStorage.stop();
	}

	//Reset pitch storage
	currentPitch[0] = null;
	currentPitch[1] = null;

	//Intervals stopping
	clearTimeout(timeOutOb2); //Clear the timeout for the generation of obstacle 2 (if still running)
	clearInterval(refreshIntervalID); //Stop the refreshing
	clearInterval(intervalOb1); //Stop Ob1 generation
	clearInterval(intervalOb2); //Stop Ob2 generation

	//Obstacle style manual reset
	ObTElem.style.left = 850 + "px";
	ObBElem.style.left = 850 + "px";
	ObT2Elem.style.left = 850 + "px";
	ObB2Elem.style.left = 850 + "px";

	ObTElem.style.animation = 'none';
	ObBElem.style.animation = 'none'
	ObTElem.offsetHeight;
	ObBElem.offsetHeight;

	ObT2Elem.style.animation = 'none';
	ObB2Elem.style.animation = 'none'
	ObT2Elem.offsetHeight;
	ObB2Elem.offsetHeight;

	targetNoteElem.innerHTML = null;
	targetNote2Elem.innerHTML = null;
	
	//Variables reset
	insideObstacle = false;
	allowMovement = 0;
	series = 1;
	score = 0;
	oldNote = 14;
	scoreElem.innerHTML = `score: ${score}`;
	
	//Screen toggling
	toGameOverMenu();

}

//Obstacles and Holes generation
function GenerationHoleRandom(ObB, ObT, targetNote){
	ObT.style.animation = 'none';
	ObB.style.animation = 'none';
	ObT.offsetHeight;
	ObB.offsetHeight;
	ObT.style.animation = 'obstacle ' + ObVel + 's linear';
	ObB.style.animation = 'obstacle ' + ObVel + 's linear';

	let randomInterval = intervalsVector[Math.round(Math.random() * (intervalsVector.length-1))]
	let randomNote = oldNote + randomInterval ;
	if ((randomNote < lowerNoteLimit) || (randomNote > upperNoteLimit)){
		randomNote = oldNote - randomInterval;
	}

	ObB.style.height = randomNote * PxSemitone - errorMargin + "px";
	ObT.style.height = canvasHeight - randomNote * PxSemitone - charHeight - errorMargin + "px";
	oldNote = randomNote;
	targetNote.innerHTML = noteString2[randomNote%12];
	targetNote.style.animation = 'none';
	targetNote.offsetHeight;
	targetNote.style.animation = 'obstacle ' + ObVel + 's linear';
	targetNote.style.bottom = randomNote * PxSemitone  + "px";

	let randomPitch = 98*Math.pow(2,randomNote/12);

	return randomPitch;

}



function GenerationHoleSeries(ObB, ObT, song, targetNote){
	if(song[series] != "*"){//per pausa
		ObT.style.animation = 'none';
		ObB.style.animation = 'none';
		ObT.offsetHeight;
		ObB.offsetHeight;
		ObT.style.animation = 'obstacle ' + ObVel + 's linear';
		ObB.style.animation = 'obstacle ' + ObVel + 's linear';
		ObB.style.height = song[series]*PxSemitone - errorMargin + "px";
		ObT.style.height = canvasHeight - song[series]*PxSemitone - charHeight - errorMargin + "px";
		targetNote.innerHTML = noteString2[song[series]%12];
		targetNote.style.animation = 'none';
		targetNote.offsetHeight;
		targetNote.style.animation = 'obstacle ' + ObVel + 's linear';
		targetNote.style.bottom = song[series] * PxSemitone  + "px";
	}
	series++;
	if(series == song.length){
		series = 1;
	}

	let seriesPitch = null;

	if(song[series] != '*'){
		seriesPitch = 98*Math.pow(2,song[series]/12);
	}
		
	return seriesPitch;

}

function GenerationObstacle(song, mode){
	if (mode){
		pitch1 = GenerationHoleRandom(ObBElem, ObTElem, targetNoteElem);
	}else{
		ObVel = song[0];
		pitch1 = GenerationHoleSeries(ObBElem, ObTElem, song, targetNoteElem);
	}

	currentPitch[0] = currentPitch[1];
	currentPitch[1] = pitch1;

	if(pitchGuiding && (currentPitch[0] != null))
		oscPlay(currentPitch[0]);


}

function GenerationObstacle2(song, mode){
	if (mode){
		pitch2 = GenerationHoleRandom(ObB2Elem, ObT2Elem, targetNote2Elem);
	}else{
		ObVel = song[0];
		pitch2 = GenerationHoleSeries(ObB2Elem, ObT2Elem, song, targetNote2Elem);
	}

	currentPitch[0] = currentPitch[1];
	currentPitch[1] = pitch2;

	if(pitchGuiding && (currentPitch[0] != null))
		oscPlay(currentPitch[0]);

}


//Main function
function starting() {

	toStartingScreen();

	series = 1;
	
	charElem.style.bottom = 256 + "px"; //Reposition character

	GenerationObstacle(choosenSong, mode); //initial call

	setTimeout(function(){ //second obstacle call
		GenerationObstacle2(choosenSong, mode);
	}, ObVel/2 * 1000);

	var intervalOb1 = setInterval(function(){ 
		GenerationObstacle(choosenSong, mode)
	}, ObVel*1000);

	let intervalOb2 = null;
	var timeOutOb2 = setTimeout(function(){
		intervalOb2 = setInterval(function(){
			GenerationObstacle2(choosenSong, mode)
		}, ObVel*1000);
	}, ObVel/2 * 1000); 

	var refreshIntervalID = setInterval(function(){ 
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
			if(pitchGuiding){
				oscStop();
			}
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
		

		//COLLISION DETECTION:
		if(collisionDetection){
			if(((ObstacleTLeft && ObstacleBLeft) < 100) && ((ObstacleTLeft && ObstacleBLeft) > 50)) {
				if((charY < ObstacleBTop) || (charY > canvasHeight-charHeight - ObstacleTBottom)){
					gameOverReset(refreshIntervalID,intervalOb1,intervalOb2,timeOutOb2);
				}
			}
			if(((ObstacleT2Left && ObstacleB2Left) < 100) && ((ObstacleT2Left && ObstacleB2Left) > 50)) {
				if((charY < ObstacleB2Top) || (charY > canvasHeight-charHeight - ObstacleT2Bottom)){
					gameOverReset(refreshIntervalID,intervalOb1,intervalOb2,timeOutOb2);
				}
			}
		}
		

	},10);
	
}


//Input stream management
function noteFromPitch( frequency ) {
	let noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
	return Math.round( noteNum ) + 69;
}

function updatePitch() {//it also update the character y position
	analyser.getFloatTimeDomainData( buf );
	let pitch = autoCorrelate( buf, audioContext.sampleRate );
	
    if ((pitch == -1) || (pitch < 98)){ //Note too low or pitch not found
        noteElem.innerHTML = "--"
		freqElem.innerHTML = "--Hz";
		charElem.style.transition = "bottom " + charFallVelocity +  "s";
		charElem.style.bottom = 0;
    }else{
        let note =  noteFromPitch( pitch );
		freqElem.innerHTML = Math.round(pitch) + "Hz";
		let pitchCor = Math.max(Math.log10(98), Math.log10(pitch))
		let buff1 = Math.min(pitchCor, maxPitch)-Math.log10(98);
		let buff2 = maxPitch - Math.log10(98);
		let consistencySamples = 3;

		for (let i=0; i<consistencySamples; i++){
			if(Math.abs(oldBuff[consistencySamples-1-i] - buff1) < 0.02){
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
		if(oldBuff.length == consistencySamples){
			oldBuff.shift();
		}
		oldBuff.push(buff1);
    }
}



function oscPlay(pitch){
	const o = new OscillatorNode(audioContext);
	o.frequency.value = pitch;
	var gain = new GainNode(audioContext);
	gain.connect(audioContext.destination);
	o.connect(gain);
	const now = audioContext.currentTime;
	gain.gain.setValueAtTime(0,now);
	let max_gain = 0.3;
	let attack = 0.2;

	if(pitch < 200){
		max_gain = 0.7;
		if(pitch < 150){
			max_gain = 1;
		}
	} else{
		if(pitch > 400)
			max_gain = 0.2;
	}

	gain.gain.linearRampToValueAtTime(max_gain,now + attack);
	//gain.gain.linearRampToValueAtTime(0,now + attack + decay); //For single test sound
	o.start();
	oscStorage = o;
	gainStorage = gain;
}

function oscFreq(pitch){
	oscStorage.frequency.value = pitch;
}

function oscStop(){
	const now = audioContext.currentTime;
	let decay = 0.1;
	gainStorage.gain.linearRampToValueAtTime(0, now + decay);
	oscStorage.stop();
}


function gotStream(stream) {

	//Creation
	audioContext = new AudioContext();
	filterNode1 = new BiquadFilterNode(audioContext);
	filterNode2 = new BiquadFilterNode(audioContext);
	
	//Filter settings
	filterNode1.type = 'highpass';
	filterNode2.type = 'lowpass';
	filterNode1.frequency.value = 90;
	filterNode2.frequency.value = 1000;

	//Mic input config
	mediaStreamSource = audioContext.createMediaStreamSource(stream);
	analyser = audioContext.createAnalyser();
	analyser.fftSize = buflen;

	//Connections
	mediaStreamSource.connect( filterNode1 );
	filterNode1.connect( filterNode2 );
	filterNode2.connect( analyser );

	setInterval(updatePitch, 50);
}

window.addEventListener("load", () => {
	navigator.mediaDevices.getUserMedia({audio: true}).then(gotStream);
});

function selectDifficulty(diff){
	mode = true;
	switch(diff){
		case 1 : //EASY
			ObVel = 5.5;
			charToTargetVelocity = 0.5;
			errorMargin = 30;
			intervalsVector = [0,1,2,3,4,5,7,12,-1,-2,-3,-4,-5,-7,-12];
			break;
		case 2: //NORMAL
			ObVel = 4;
			charToTargetVelocity = 0.4;
			errorMargin = 22;
			intervalsVector = [0,1,2,3,4,5,7,9,11,12,-1,-2,-3,-4,-5,-7,-9,-11,-12];
			break;
		case 3: //HARD
			ObVel = 3;
			charToTargetVelocity = 0.2;
			errorMargin = 16;
			intervalsVector = [0,1,2,3,4,5,6,7,8,9,10,11,12,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12];
			break;
		case 4: //SPEEDFREAK
			ObVel = 1.5;
			charToTargetVelocity = 0.1;
			errorMargin = 16;
			intervalsVector = [0,1,2,3,4,5,6,7,8,9,10,11,12,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12];
			break;
		case 5: //PERFECTPITCH
			ObVel = 4;
			charToTargetVelocity = 0.25;
			errorMargin = 3;
			intervalsVector = [0,1,2,3,4,5,6,7,8,9,10,11,12,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12];
			break;
		default:
			ObVel = 5.5;
			charToTargetVelocity = 0.5;
			errorMargin = 30;
			intervalsVector = [0,1,2,3,4,5,7,12,-1,-2,-3,-4,-5,-7,-12];
	}
	starting();
}

function selectSong(song_number){
	mode = false;
	switch (song_number){
		case 1 :
			choosenSong = fraMartino;
			break;
		case 2 :
			choosenSong = perElisa;
			break;
		case 3 :
			choosenSong = halo;
			break;
		default:
			choosenSong = fraMartino;
	}
	starting();
}

//GENERAL OPTIONS
/*
function charSpeedUpdate(value){
	charFallVelocity = value;
	charToTargetVelocity = charFallVelocity/14;
}

function obstacleSpeedUpdate(value){
	ObVel = value;
}
*/

function updateGuidePitch(){
	let checkbox = document.getElementById('pitch_guiding');
	if (checkbox.checked){
		pitchGuiding = true;
	}else{
		pitchGuiding = false;
	}
}

function updateDisableCollision(){
	let checkbox = document.getElementById('disable_collision');
	if (checkbox.checked){
		collisionDetection = false;
	}else{
		collisionDetection = true;
	}
}

window.optionFunctions = {updateGuidePitch, updateDisableCollision};
window.changeMenu = {toDiffMenu, toGameOverMenu, toMainMenu, toModeMenu, toOptionsMenu, toSongMenu, toStartingScreen, toggleScreen};
window.otherSelections = {selectSong,selectDifficulty,starting};