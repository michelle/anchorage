// TESTING FRAMEWORK:
// var game = new Game(); game.join(); game.join(); game.join(); game.join(); game.start(); game.dumpHands(); var play = function(c, v, s) { var suit = 'shcd'[game.currentPlayer().id]; return game.play(card(c + suit), {value: v, special: s }) };

function Game() {
  this.CARDS = 52;

  // All array indices correlate to player ID
  this.players = [];
};


// SERVER TO CLIENT EVENTS
//
// join
// game-start
// round-start
// turn-start
// turn-end
// round-end
// game-end
//

// CLIENT TO SERVER EVENTS
// join
// play
//

util.inherits(Game, EventEmitter);

// TODO: endgame.

Game.prototype.start = function(cb) {
  // TODO: validate numPlayers.
  this.numPlayers = this.players.length;
  this.totalRounds = this.CARDS / this.numPlayers;

  var deck = new Deck();
//  deck.shuffle();
  var card;
  var playerId = 0;
  while (card = deck.deal()) {
    this.players[playerId].deal(card);
    playerId = (playerId + 1) % this.numPlayers;
  }

  // Currently...
  this.round = 0;
  this.turn = 0;
  // Keyed on player id.
  this.plays = []; // {card: card, call: call}
  this.junk = [];
  this.states = [];

  // TODO: cb with state of cards.
  cb();
};

Game.prototype.startRound = function() {
  this.round += 1;
  this.turn = 0;
  this.plays = [];
};

Game.prototype.join = function() {
  var player = new Player(this.players.length);
  this.players.push(player);
  return player;
};

// current player given the turn and round.
Game.prototype.currentPlayer = function() {
  var id = (this.round + this.turn) % this.numPlayers;
  return this.players[id];
};

// Call: {value: [0-9]+, special: boolean}
Game.prototype.play = function(card, call, cb) {
  this.validateCall(call);

  var player = this.currentPlayer();
  if (player.play(card, cb)) {
    this.plays[player.id] = {
      card: card,
      call: call
    };
    // TODO: VALIDATE CALL@#$KL@$J
  } else {
    throw new Error('you suck');
  }
  var state = {}
  state[card.value + card.suit] = ''; // TODO
  this.states.push(state);

  this.turn += 1;
  if (this.turn === this.numPlayers) {
    this.score();
    this.startRound();
  }

  if (cb) {
    cb(this.states);
    this.states = [];
  }
};

Game.prototype.validateCall = function(call) {
  if (call.special && (call.value < 2)) {
    throw new Error("Can't use a special call with value of " + call.value);
  }
};

Game.prototype.score = function() {
  var losers = [];
  var winnings = [];
  var sorted = this.plays.map(function(play) {
    return Deck.valueMap[play.card.value];
  }).sort(function(a, b) { return a - b });

  // Score specials.
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    var player = this.players[i];
    var play = this.plays[i];
    if (play.call.special && losers.indexOf(i) === -1) {
      var result = this.scoreCall(player, play);
      winnings = winnings.concat(result.winning);
      losers = losers.concat(result.losers);
      player.winCards(result.winning);
    }
  }

  // Score non-specials.
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    var player = this.players[i];
    var play = this.plays[i];
    if (!play.call.special && losers.indexOf(i) === -1) {
      if (sorted.lastIndexOf(Deck.valueMap[play.card.value]) === play.call.value) {
        var winning = [play.card];
        winnings = winnings.concat(winning);
        player.winCards(winning);
      }
    }
  }

  var junkCards = [];
  for (var i = 0, ii = this.plays.length; i < ii; i += 1) {
    if (winnings.indexOf(this.plays[i].card) < 0) {
      junkCards.push(this.plays[i].card);
    }
  }

  this.junk = this.junk.concat(junkCards);

  // TODO: push state to this.states
};

// (*￣m￣)
Game.prototype.scoreCall = function(prayer, pray) {
  var matches = [pray.card];
  var losers = [];
  var loseValue = {
    losers: [],
    winning: []
  };

  var carr = pray.call;
  for (var i = 0, ii = this.plays.length; i < ii; i += 1) {
    if (prayer.id !== i) {
      var play = this.plays[i];

      // There can only be one.
      if (play.card.value === pray.card.value) {
        matches.push(play.card);
        losers.push(i);
        if (play.call.special && play.call.value === carr.value) {
          return loseValue;
        }
      }
    }
  }
  if (matches.length === carr.value) {
    return {
      losers: losers,
      winning: matches
    };
  }
  return loseValue;
};

// debug
Game.prototype.dumpHands = function() {
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    console.log(this.players[i].dump());
  }
};

Game.prototype.printWinnings = function() {
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    console.log(this.players[i].won.map(function(card) {
      return card.value + card.suit;
    }));
  }
}
