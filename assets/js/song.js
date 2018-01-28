
// Initialize Firebase
var config = {
	apiKey: "AIzaSyBvKsqUnBdWiH2BEhalq1m4gupvEWfV1ak",
	authDomain: "musepanel-181904.firebaseapp.com",
	databaseURL: "https://musepanel-181904.firebaseio.com",
	projectId: "musepanel-181904",
	storageBucket: "",
	messagingSenderId: "199451268657"
};
firebase.initializeApp(config);

var database = firebase.database();

var songTable = {};
var keyTable = {};
var rankToKey = {
	0: "C",
	0.5: "Db",
	1: "D",
	1.5: "Eb",
	2: "E",
	2.5: "F",
	3: "Gb",
	3.5: "G",
	4: "Ab",
	4.5: "A",
	5: "Bb",
	5.5: "B"
}

var keyToRank = {
	"C": 0,
	"Db": 0.5,
	"D": 1,
	"Eb": 1.5,
	"E": 2,
	"F": 2.5,
	"Gb": 3,
	"G": 3.5,
	"Ab": 4,
	"A": 4.5,
	"Bb": 5,
	"B": 5.5
}

var songRecs;
var songObj;
var pageLoaded = false;

function recordSongHit(song, artist) {
	var hash = utils.hashSong(song, artist);

	var countRef = database.ref('songs/' + hash + '/count');
	countRef.once('value').then(function(snapshot) {
		if (snapshot.val() == null){
			database.ref('songs/' + hash).set({
		     	count: 1
		    });
		} else {
			database.ref('songs/' + hash).update({
				count: snapshot.val() + 1
			});
		}
	});
}

$(document).ready(function(){
	$("#back").attr("href", window.location.origin);

	database.ref('songdb/').once('value').then(function(snapshot) {
		var allSongs = snapshot.val();

		for (var key in allSongs){
			initDataObjects(allSongs[key].song, allSongs[key].artist, allSongs[key].key, allSongs[key].note, allSongs[key].keyType);
		}

		initPage();
	});

	// event handlers
	$("#refresh").on('click', function(){
		$("#rec-section").empty();
		fillRecommendations(songRecs);
	})

	$(".download").on('click', function(){
		openLink(this.id.split('-')[1]);
	})

	$("#diff-select").on('change', function(){
		$("#rec-section").empty();
		setTimeout(populateRecSection(getSongObj()), 100);
	})

	$("#request-change > a").on('click', function(){
		$("#song-input").val(songObj["title"]);
		$("#artist-input").val(songObj["artist"]);
		$("#key-select").val(songObj["note"]);
		$("#interval-select").val(songObj["keyType"]);
	});

	$("#request-change-button").click(function(){

		var song = $("#song-input").val();
		var artist = $("#artist-input").val();
		
		if (song.length == 0 || artist.length == 0){
			$(".modal").effect("shake");
			$("#missing-fields").show();
		} else {
			$("#cancel-modal").hide();
			$("#missing-fields").hide();
			$("#add-song-button").text("Sending Request...");

			var newRequestRef = database.ref('request/').push();
			newRequestRef.set({
			  old: songObj,
			  new: {
			  	song: $("#song-input").val(),
			  	artist: $("#artist-input").val(),
			  	note: $("#key-select").val(),
			  	keyType: $("#interval-select").val(),
			  	key: $("#key-select").val() + " " + $("#interval-select").val(),
			  	rank: keyToRank[$("#key-select").val()]
			  }
			}, function(error){
				if (error){
					alert(error);
				} else {
					$(".modal-body").hide(400);
					$(".modal-footer").hide(400);

					$("#requestChangeModalTitle").html('Request received! Thanks for helping improve MusePanel!');
				}
			});
		}
	})

});

function initDataObjects(song, artist, key, note, keyType){
	var rank = keyToRank[note];

	var hash = utils.hashSong(song, artist);

	songTable[hash] = {
		title: song, 
		artist: artist,
		key: key,
		note: note,
		keyType: keyType,
		rank: rank
	}

	if (!(key in keyTable)) keyTable[key] = [];
	keyTable[key].push(hash);
}

function openLink(mp3Type){
	var link = "http://www.instamp3.tv/download/";
	var query = songObj["title"] + " " + songObj["artist"];
	if (mp3Type == 'instrumental') 
		query += " instrumental";

	var win = window.open(link + query.replace(" ", "-") + ".html", '_blank');
	if (win) {
	    //Browser has allowed it to be opened
	    win.focus();
	} else {
	    //Browser has blocked it
	    alert('Please allow popups for this website');
	}
}

function initPage(){
	if (!pageLoaded){
		songObj = getSongObj(); // get from param

		recordSongHit(songObj["title"], songObj["artist"]); // record view 

		document.title = "MusePanel - " + songObj["title"];
		$("#song-title").html(songObj["title"]);
		$("#song-artist").html(songObj["artist"]);
		$("#song-key").html(songObj["key"]);

		embedYoutubeVid(songObj);
	}

	populateRecSection(songObj);
}

function populateRecSection(songObj){
	var rank = songObj["rank"];
	var keyType = songObj["keyType"];
	var songs = getSongs(songObj["note"], keyType, $("#diff-select").val());

	// get songs of relative major/minor
	if (keyType == "minor")
		songs = songs.concat(getSongs(rankToKey[convertRank(rank + 1.5)], "Major", 0));
	else
		songs = songs.concat(getSongs(rankToKey[convertRank(rank - 1.5)], "minor", 0));

	songs = shuffle(songs);
	fillRecommendations(songs);
}


function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function embedYoutubeVid(songObj){
	var query = songObj["title"] + " " + songObj["artist"] + " full audio song"; 
	$.getJSON("https://www.googleapis.com/youtube/v3/search?part=Id&q=" + query.replace(" ", "+") + "&maxResults=1&key=AIzaSyArHKHtQbB9JCXhkm0DkyX1H-oF4Mfv-lM", function(data) {
		var link = "https://www.youtube.com/embed/" + data["items"][0]["id"]["videoId"] + "?autoplay=1";
		$("#songVid").attr("src", link);
	});
}

function fillRecommendations(songs){
	for (var i = 0; i < 12; i++){
		if (songObj["title"] != songs[0]["title"] && songObj["artist"] != songs[0]["artist"])
			$("#rec-section").append(getSongPanel(songs[0]));
		else
			i -= 1;
		songs.push(songs.shift());
	}
	songRecs = songs;
}

function findKeyDifference(key, keyType){
	// find the difference in key between song and recommended song
	var currSongRank = songObj["rank"];
	var recSongRank = keyToRank[key.split(" ")[0]];

	// relative interval
	if (songObj["keyType"] != keyType)
		return "relative " + keyType;

	if (recSongRank == currSongRank)
		return "";

	var pitchDiff = closerHigher(recSongRank, currSongRank);

	if (!pitchDiff && (recSongRank > currSongRank))
		recSongRank = recSongRank - 6;
	else if (pitchDiff && (recSongRank < currSongRank))
		recSongRank = 6 + recSongRank;

	var keyDiffObj = {
		0.5: "1/2 step",
		1: "1 step",
		1.5: "1 1/2 steps",
		2: "2 steps"
	}

	return "" + keyDiffObj[Math.abs(currSongRank - recSongRank)] + (pitchDiff ? " higher" : " lower") + "";
}

function closerHigher(recSongRank, currSongRank){
	// tells you whether the recommended song is closer in higher steps
	if (currSongRank > recSongRank)
		return (currSongRank - recSongRank) > (6 - currSongRank + recSongRank);
	return (recSongRank - currSongRank) < (6 - recSongRank + currSongRank);
}

function getSongPanel(song){
	var href = "../song?title=" + escape(song["title"]) + "&artist=" + escape(song["artist"]);
	var info = findKeyDifference(song["key"], song["keyType"]);
	return $("<a href='" + href + "' class='song-wrapper'></a>")
			.append($("<div class='song-item'></div>")
	       		.append("<div class='song-title'>" + utils.shorten(song["title"], 20) + "</div>")
	       		.append("<div class='song-info'>" + info + "</div>")
	       		.append("<div class='song-key'>" + song["key"] + "</div>")
	       		.append("<div class='song-artist'>" + song["artist"] + "</div>")
	       	)
}

function getSongs(note, keyType, diff){
	// ripple algorithm
	var songs = [];
	pushSongs(songs, note + " " + keyType);

	var pitchDiff = 0.5, lowerNote, higherNote;
	while(pitchDiff <= diff){
		lowerNote = rankToKey[convertRank(keyToRank[note] - pitchDiff)] + " " + keyType;
		pushSongs(songs, lowerNote);

		higherNote = rankToKey[convertRank(keyToRank[note] + pitchDiff)] + " " + keyType;
		pushSongs(songs, higherNote);

		pitchDiff += 0.5;
	}

	return songs;
}

function pushSongs(songs, note){
	if (note in keyTable){
		keyTable[note].map(function(songHash){
			songs.push(songTable[songHash]);
		})
	}
}

function convertRank(i){
	if (i < 0)
		return i + 6;
	if (i > 5.5)
		return i - 6;

	return i;
}

function getSongObj(){
	var search = location.search.substring(1);
	var params = search?JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}',
	                 function(key, value) { return key===""?value:decodeURIComponent(value) }):{}
	return songTable[utils.hashSong(params["title"], params["artist"])];
}


