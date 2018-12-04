var server = require('ws').Server;
var s = new server({ port:8080 });
var ip = require('ip');
console.log(ip.address());
console.log(s.address());
CLIENTS = [];
NAMES = [];
ROOM = [];
CARDS = [ "7h","7s",
					"8h","8s","8d","8c",
				  "9h","9s","9d","9c",
				  "10h","10s","10d","10c",
				  "jh","js","jd","jc",
				  "qh","qs","qd","qc",
				  "kh","ks","kd","kc",
					"1h","1s","1d","1c",];
R_CARDS = [];
JOKER = [];
var can_play = 0;
s.on('connection',function(ws){
	ws.on('message',function(message){

		var data = JSON.parse(message);
		console.log("Received:"+ data.type);
		if (data.type == "create") {
				var i = ROOM.length;
				ROOM[i] = [];
				NAMES[i] = [];
				ROOM[i][0] = ws;
				NAMES[i][0] = data.name;
				var msg = {
					"type" : "create",
					"room" : i,
					"data" : data.name + " created room " + i
				};
				ROOM[i][0].send(JSON.stringify(msg));
		}
		else if (data.type == "join") {
			var i = data.room;
			if (i > ROOM.length || ROOM[i].length != 1){
				var msg = {
					"type" : "full",
					"data" : data.room + " can't be joined"
				};
				ws.send(JSON.stringify(msg));
			}
			else {
				ROOM[i][1] = ws;
				NAMES[i][1] = data.name;
				var msg = {
					"type" : "join",
					"room" : i,
					"data" : data.name + " joined room"
				};
				ROOM[i][0].send(JSON.stringify(msg));
				ROOM[i][1].send(JSON.stringify(msg));
			}
		}
		else if (data.type == "play") {
				var i = data.room;
				R_CARDS[i] = shuffle(CARDS);
				var msg1 = {
					"type" : "play",
					"room" : i,
					"hands" : 7,
					"data" : "You will do 7 hands",
					"cards" : R_CARDS[i].slice(0,15)
				};
				var msg2 = {
					"type" : "play",
					"room" : i,
					"hands" : 8,
					"data" : "You will do 8 hands",
					"cards" : R_CARDS[i].slice(15,30)
				};
				if (Math.random() < 0.5 ) {
					ROOM[i][0].send(JSON.stringify(msg1));
					ROOM[i][1].send(JSON.stringify(msg2));
				}
				else {
					ROOM[i][0].send(JSON.stringify(msg2));
					ROOM[i][1].send(JSON.stringify(msg1));
				}

		}
		else if (data.type == "joker") {
				var i = data.room;
				JOKER[i] = data.joker;
				var msg = {
					"type" : "joker",
					"room" : i,
					"joker": data.joker,
					"data" : data.name + " set joker = " + data.joker,
				};
				ROOM[i][0].send(JSON.stringify(msg));
				ROOM[i][1].send(JSON.stringify(msg));
		}
		else if (data.type == "move") {
			var i = data.room;
			var msg = {
				"type" : "turn",
				"room" : i,
				"data" : data.name + " Played " + data.card,
				"turn" : 0
 			};
			ROOM[i][data.player_no].send(JSON.stringify(msg));
			msg.turn = 1;
			if (data.player_no == 1){
					ROOM[i][0].send(JSON.stringify(msg));
			}
			else {
				ROOM[i][1].send(JSON.stringify(msg));
			}

		}
	});
});
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
