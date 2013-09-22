function Player(id) {
  this.id = id;
  this.hand = {}; // suit => {values => 1};
  this.won = [];
};

Player.prototype.play = function(card) {
  if (this.hand[card.suit]) {
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
