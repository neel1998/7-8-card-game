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
values = {
	"1" : 14,
	"7" : 7,
	"8" : 8,
	"9" : 9,
	"10" : 10,
	"j" : 11,
	"q" : 12,
	"k" : 13
};
R_CARDS = [];
JOKER = [];
TABLE_CARDS = [];
var can_play = 0;
s.on('connection',function(ws){
	ws.on('message',function(message){

		var data = JSON.parse(message);
		console.log("Received:"+ data.type);
		if (data.type == "create") {
				var i = ROOM.length;
				ROOM[i] = [];
				NAMES[i] = [];
				TABLE_CARDS[i] = [];
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
					"cards" : R_CARDS[i].slice(0, 15),
					"o_cards" : R_CARDS[i].slice(15, 30)
				};
				var msg2 = {
					"type" : "play",
					"room" : i,
					"hands" : 8,
					"data" : "You will do 8 hands",
					"cards" : R_CARDS[i].slice(15, 30),
					"o_cards" : R_CARDS[i].slice(0, 15)
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
				JOKER[i] = JOKER[i].toLowerCase();
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
			var player_no = data.player_no;
			var win;
			var msg = {
				"type" : "turn",
				"room" : i,
				"data" : data.name + " Played " + data.card,
				"turn" : 0,
				"win" : "",
				"pos" : data.pos,
				"card" : data.card,
				"name" : "",
				"player_no" : player_no
 			};
			TABLE_CARDS[i][TABLE_CARDS[i].length] = data.card;
			if ( TABLE_CARDS[i].length%2 == 0 ) {
					win = Check(player_no, i);
					msg.win = NAMES[i][win] + " won this hand"
					msg.name = NAMES[i][win];
					if (win == 1){
						ROOM[i][0].send(JSON.stringify(msg));
					}
					else {
						ROOM[i][1].send(JSON.stringify(msg));
					}
					msg.turn = 1;
					ROOM[i][win].send(JSON.stringify(msg));
			}
			else {
				ROOM[i][player_no].send(JSON.stringify(msg));
				msg.turn = 1;
			  	if (player_no == 1){
						ROOM[i][0].send(JSON.stringify(msg));
					}
					else {
						ROOM[i][1].send(JSON.stringify(msg));
					}
			}
		}
	});
});
function Check(player_no, room_no) {
		var win;
		var card_1 = TABLE_CARDS[room_no][TABLE_CARDS[room_no].length - 2];
		var card_2 = TABLE_CARDS[room_no][TABLE_CARDS[room_no].length - 1];
		var card1_val = values[card_1.slice(0,-1)];
		var card2_val = values[card_2.slice(0,-1)];
		var card1_joker = card_1.slice(-1);
		var card2_joker = card_2.slice(-1);
		//both joker
		if ( card1_joker == JOKER[room_no] && card2_joker == JOKER[room_no] ) {
			if (card1_val > card2_val) {
				if (player_no == 0) {
					win = 1;
				}
				else {
					win = 0;
				}
			}
			else {
				win = player_no;
			}
		}
		//1st joker
		else if ( card1_joker == JOKER[room_no] && card2_joker != JOKER[room_no] ) {
			if (player_no == 0) {
				win = 1;
			}
			else {
				win = 0;
			}

		}
		//2nd joker
		else if ( card1_joker != JOKER[room_no] && card2_joker == JOKER[room_no] ) {
				win = player_no;
		}
		//none joker
		else {
			if ( card1_joker == card2_joker ) {
					if (card1_val > card2_val) {
						if (player_no == 0) {
							win = 1;
						}
						else {
							win = 0;
						}
					}
					else {
						win = player_no;
					}
			}
			else {
				if (player_no == 0) {
					win = 1;
				}
				else {
					win = 0;
				}
			}
		}

		return win;
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
