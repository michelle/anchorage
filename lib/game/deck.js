function Deck() {
  var values = '234567890jqka'.split('');
  var suits = 'dchs'.split('');

  this.cards = [];
  this.valueMap = {};

  for(var i = 0; i < values.length; i++) {
    valueMap[values[i]] = i;
    for(var j = 0; j < suits.length; j++) {
      cards.push({
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
    temp = cards[m];
    cards[m] = cards[i];
    cards[i] = temp;
  }
};

Deck.prototype.deal = function() {
  this.cards.pop();
};
