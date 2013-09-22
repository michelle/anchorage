function Player(id) {
  this.id = id;
  this.hand = {}; // suit => {values => 1};
  this.won = [];
};

Player.prototype.play = function(card) {
  if (this.hand[card.suit] && this.hand[card.suit][card.value]) {
    delete this.hand[card.suit][card.value];
    return true;
  }
  return false;
};

Player.prototype.winCards = function(cards) {
  this.won = this.won.concat(cards);
};

Player.prototype.deal = function(card) {
  this.hand[card.suit] = this.hand[card.suit] || {};
  this.hand[card.suit][card.value] = 1;
};


// Utils
Player.prototype.dump = function() {
  var suits = Object.keys(this.hand);
  var dump = [];
  for (var i = 0, ii = suits.length; i < ii; i += 1) {
    var suit = suits[i];
    var values = Object.keys(this.hand[suit]);
    for (var j = 0, jj = values.length; j < jj; j += 1) {
      var value = values[j];
      dump.push(value + suit);
    }
  }
  return dump;
};

function card(str) {
  return {
    suit: str[1],
    value: str[0]
  };
};
