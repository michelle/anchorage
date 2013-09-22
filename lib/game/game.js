function Game() {
  this.CARDS = 52;

  // All array indices correlate to player ID
  this.players = [];
};

// TODO: endgame.

Game.prototype.start = function() {
  // TODO: validate numPlayers.
  this.numPlayers = this.players.length;
  this.totalRounds = this.CARDS / this.numPlayers;

  var deck = new Deck();
  deck.shuffle();
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
  var player = this.currentPlayer();
  if (player.play(card, cb)) {
    this.plays[player.id] = {
      card: card,
      call: call
    };
    // TODO: VALIDATE CALL@#$KL@$J
  } else {
    throw Error('fuck you');
  }

  this.turn += 1;
  if (this.turn === this.numPlayers) {
    this.score();
    this.startRound();
  }

  if (cb) {
    // CALLBACK WITH GAMESTATE?
    cb();
  }
};

Game.prototype.score = function() {
  var losers = [];
  var winnings = [];
  var sorted = this.plays.map(function(card) {
    return valueMap[card.value];
  }).sort();

  // Score specials.
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    var player = this.players[i];
    var play = this.plays[i];
    if (play.call.special && losers.indexOf(i) === -1) {
      var result = this.scoreCall(player, play);
      winnings = winnings.concat(result.winning);
      losers = losers.concat(result.losers);
      player.winCards(winning);
    }
  }

  // Score non-specials.
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    var player = this.players[i];
    var play = this.plays[i];
    if (!play.call.special && losers.indexOf(i) === -1 {
      if (sorted.indexOf(valueMap[play.card.value]) {
        var winning = [play.card];
        winnings = winnings.concat(winning);
        player.winCards(winning);
      }
    }
  }

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

Game.prototype.scor
