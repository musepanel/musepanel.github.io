var utils = {};

utils.shorten = function(str, maxLength){
	return str.length <= maxLength ? str : str.substr(0, maxLength) + "...";
}

utils.properCaps = function(song, inp){
	return song.substr(song.toLowerCase().indexOf(inp), inp.length);
}

utils.hashSong = function(song, artist){
	return (song + "-" + artist).split(' ').join('').toLowerCase();
}

// utils.spellKey = function(key){
// 	return key.slice(0, -1) + (key[key.length-1] == key[key.length-1].toLowerCase() ? " minor" : " Major");
// }
