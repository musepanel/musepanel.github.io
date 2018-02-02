var utils = {};

utils.shorten = function(str, maxLength){
	if (str.length <= maxLength)
		return str;
	
	var resultStr = str.substr(0, maxLength);
	return (resultStr[resultStr.length - 1] == " " ? resultStr.slice(0, -1) : resultStr) + "...";
}

utils.properCaps = function(song, inp){
	return song.substr(song.toLowerCase().indexOf(inp), inp.length);
}

utils.hashSong = function(song, artist){
	return (song + "-" + artist).split(' ').join('').toLowerCase();
}
