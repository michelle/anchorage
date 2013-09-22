function Deck() {
  var values = '234567890jqka'.split('');
  var suits = 'dchs'.split('');

  this.cards = [];
  Deck.valueMap = {};

  for(var i = 0; i < values.length; i++) {
    Deck.valueMap[values[i]] = i;
    for(var j = 0; j < suits.length; j++) {
      this.cards.push({
        value: values[i],
        suit: suits[j]
      });
    }
  }
};



Deck.prototype.shuffle = function() {
  var m = this.cards.length;
  var temp, i;

  while (m) {
    i = Math.floor(Math.random() * m--);
    temp = this.cards[m];
    this.cards[m] = this.cards[i];
    this.cards[i] = temp;
  }
};

Deck.prototype.deal = function() {
  return this.cards.pop();
};
