var Game = function() { };

Game.prototype.init = function() {
  this.numPlayers = 4;
  this.currentTurn = 0;
  this.currentPlayer = 0;

  // All array indices correlate to player ID
  this.currentCards = [];
  this.currentCalls = [];
  this.wonCards = [];

  this.scores = [0, 0, 0, 0];
};

Game.prototype.doMove = function(player, card, call) {
  this.currentCards[player] = card;
  this.currentCalls[player] = call;
};

Game.prototype.scoreTrick = function() {
  this.countCards();
  this.score();
};

/*
 * {
 *   2 => {
 *     'a' => [p0, p1]
 *   },
 *   3 => {
 *     '5' => [p4]
 *   }
 */
Game.prototype.specialCalls = function() {
  this.specialCalls = {};
  for (var i = 0; ii = this.currentCards.length; i < ii; i+= 1) {
    var call = this.currentCalls[i];
    var value = call.card.value;
    if (call.special != undefined) {
      var specialHash = specialCalls[call.special];
      if (specialHash != undefined) {
        specialHash[value] = specialHash[value] || [];
        specialHash[value].push(i)
      }
    }
  }
};

Game.prototype.countCards = function() {
  this.cardCounts = {};
  for (var i = 0, ii = this.currentCards.length; i < ii; i += 1) {
    var card = this.currentCards[i].value;
    var call = this.currentCalls[i];
    this.sortedCards[card] = this.sortedCards[card] || 0;
    this.sortedCards[card] += 1;
  }
};

Game.prototype.hasCorrectParity = function(player) {
  var matches = 0;
  for (var i = 0; i < this.currentCards.length; i ++) {
    if (this.currentCards[i] === this.currentCalls[player].card) {
      matches += 1;
    }
  }
  return this.currentCalls[player].parity === matches;
};

Game.prototype.score = function() {
  for (var i = 0; i < this.numPlayers; i += 1) {
    var call = this.currentCalls[i]; // card, call, special
    if (call.special !== undefined) {
      if (this.cardCounts[call.card.value] === call.special) {
        
      }
    } else {


    }

    
  }
};
