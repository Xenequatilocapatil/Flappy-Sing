
// Screen functions

export function toggleScreen(id,toggle){
	let element = document.getElementById(id);
	let display = ( toggle ) ? "block" : "none" ;
	element.style.display = display;
}


export function toStartingScreen(){
	toggleScreen('start-screen',false);
	toggleScreen('gameover-screen',false);
	toggleScreen('game',true);
	toggleScreen('indicators', true);
	toggleScreen('options-screen',false);
	toggleScreen('mode-screen',false);
	toggleScreen('song-screen',false);
	toggleScreen('diff-screen',false);
}

export function toMainMenu(){
	toggleScreen('start-screen',true);
	toggleScreen('gameover-screen',false);
	toggleScreen('game',false);
	toggleScreen('indicators', false);
	toggleScreen('options-screen',false);
	toggleScreen('mode-screen',false);
	toggleScreen('song-screen',false);
	toggleScreen('diff-screen',false);
}

export function toOptionsMenu(){
	toggleScreen('start-screen',false);
	toggleScreen('gameover-screen',false);
	toggleScreen('game',false);
	toggleScreen('indicators', false);
	toggleScreen('options-screen',true);
	toggleScreen('mode-screen',false);
	toggleScreen('song-screen',false);
	toggleScreen('diff-screen',false);
}

export function toGameOverMenu(){
	toggleScreen('start-screen',false);
	toggleScreen('gameover-screen',true);
	toggleScreen('game',false);
	toggleScreen('indicators', false);
	toggleScreen('options-screen',false);
	toggleScreen('mode-screen',false);
	toggleScreen('song-screen',false);
	toggleScreen('diff-screen',false);
}

export function toModeMenu(){
	toggleScreen('start-screen',false);
	toggleScreen('gameover-screen',false);
	toggleScreen('game',false);
	toggleScreen('indicators', false);
	toggleScreen('options-screen',false);
	toggleScreen('mode-screen',true);
	toggleScreen('song-screen',false);
	toggleScreen('diff-screen',false);
}

export function toDiffMenu(){
	toggleScreen('start-screen',false);
	toggleScreen('gameover-screen',false);
	toggleScreen('game',false);
	toggleScreen('indicators', false);
	toggleScreen('options-screen',false);
	toggleScreen('mode-screen',false);
	toggleScreen('song-screen',false);
	toggleScreen('diff-screen',true);
}

export function toSongMenu(){
	toggleScreen('start-screen',false);
	toggleScreen('gameover-screen',false);
	toggleScreen('game',false);
	toggleScreen('indicators', false);
	toggleScreen('options-screen',false);
	toggleScreen('mode-screen',false);
	toggleScreen('song-screen',true);
	toggleScreen('diff-screen',false);
}