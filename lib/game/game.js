// TESTING FRAMEWORK:
// var game = new Game(); game.join(); game.join(); game.join(); game.join(); game.start(); game.dumpHands(); var play = function(c, v, s) { var suit = 'shcd'[game.currentPlayer().id]; return game.play(card(c + suit), {value: v, special: s }) };

function Game() {
  EventEmitter.call(this);

  this.CARDS = 52;

  // All array indices correlate to player ID
  this.players = [];
};


// SERVER TO CLIENT EVENTS
// join, {playerId: 0, info: {name: 'asdf'}}
// game-start, {0: {hand: ['s-5', 'c-0']}, ...}
// round-start, undefined
// turn-start, {playerId: 0}
// turn-end, {playerId: 0, play: {card: 's-9', call: '1'}} 
// round-end, {0: {cardsWon: ['s-5'], score: 3}, 1: ...}
// game-end, {0: {score: 4}, 1: {score: 5} ...}

// CLIENT TO SERVER EVENTS
// join
// play

util.inherits(Game, EventEmitter);

// Starting person should have eight of diamonds.
Game.START_CARD = 'd8';

Game.prototype.start = function() {
  // We'll strictly enforce 4 players for now.
  if (this.players.length !== 4) {
    throw new Error('Cannot start game without exactly 4 players.');
  }

  // TODO: 8 of diamonds plays first.
  this.numPlayers = this.players.length;
  this.maxRounds = this.CARDS / this.numPlayers;

  // Currently...
  this.round = 0;
  this.turn = 0;

  var deck = new Deck();
//  deck.shuffle();
  var card;
  var playerId = 0;

  while (card = deck.deal()) {
    this.players[playerId].deal(card);
    // Check if card dealt is the starting card.
    if (this.offset === undefined
        && card.suit === Game.START_CARD[0]
        && card.value === Game.START_CARD[1]) {
      this.offset = playerId;
    }
    playerId = (playerId + 1) % this.numPlayers;
  }

  // Keyed on player id.
  this.plays = []; // {card: card, call: call}
  this.junk = [];

  this.emit('game-start', this._dumpStart());
};

Game.prototype._startRound = function() {
  this.round += 1;
  if (this.round === this.maxRounds) {
    this.emit('game-end', {winners: this._findWinners()});
  } else {
    this.turn = 0;
    this.plays = [];
    this.emit('round-start');
  }
};

Game.prototype.join = function(metadata) {
  // Player ID is just its index for now.
  var player = new Player(this.players.length);
  this.players.push(player);
  this.emit('join', {playerId: player.id, info: metadata})
};

// current player given the turn and round.
Game.prototype.currentPlayer = function() {
  var id = (this.round + this.turn + this.offset) % this.numPlayers;
  return this.players[id];
};

// Call: {value: [0-9]+, special: boolean}
Game.prototype.play = function(card, call) {
  this._validateCall(call);

  var player = this.currentPlayer();
  if (player.play(card)) {
    this.plays[player.id] = {
      card: card,
      call: call
    };
  } else {
    throw new Error('you suck');
  }

  this.emit('turn-end', {
    playerId: this.currentPlayer().id,
    play: {
      card: Deck.frontendCard(card),
      call: call
    }
  });
  this.turn += 1;
  if (this.turn === this.numPlayers) {
    this._score();
    this._startRound();
  }
  this.emit('turn-start', {playerId: this.currentPlayer().id});
};

Game.prototype._validateCall = function(call) {
  if (call.special && (call.value < 2)) {
    throw new Error("Can't use a special call with value of " + call.value);
  }
};

Game.prototype._score = function() {
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
      var result = this._scoreCall(player, play);
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
  this.emit('round-end', this._dumpRoundEnd(winnings));
};

// (*￣m￣)
Game.prototype._scoreCall = function(prayer, pray) {
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


Game.prototype._dumpStart = function() {
  var hands = {};
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    hands[i] = {hand: this.players[i].dumpForFrontend()};
  }
  return hands;
};

Game.prototype._dumpRoundEnd = function(winnings) {
  var round = {};
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    round[i] = {
      cardsWon: winnings.map(Deck.frontendCard),
      score: this.players[i].won.length
    };
  }
  return round;
};

Game.prototype._findWinners = function() {
  var winners = [];
  var topScore = 0;
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    var player = this.players[i];
    if (topScore <= player.won.length) {
      if (topScore < player.won.length) {
        topScore = player.won.length;
        winners = [];
      }
      winners.push(player.id);
    }
  }
  return winners;
};

Game.prototype.printWinnings = function() {
  for (var i = 0, ii = this.players.length; i < ii; i += 1) {
    console.log(this.players[i].won.map(function(card) {
      return card.value + card.suit;
    }));
  }
}
