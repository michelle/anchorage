var values = '234567890jqka'.split('');
var suits = 'dchs'.split('');

var valueMap = {};
var cards = [];

for(var i = 0; i < values.length; i++) {
  valueMap[values[i]] = i;
  for(var j = 0; j < suits.length; j++) {
    cards.push({
      value: values[i],
      suit: suits[j]
    });
  }
}

var GameUtils = function() { };

GameUtils.prototype.shuffle = function() {
  var m = cards.length, temp, i;

  while (m) {
    i = Math.floor(Math.random() * m--);
    temp = cards[m];
    cards[m] = cards[i];
    cards[i] = temp;
  }

  return cards;
};

GameUtils.prototype.deal = function(cards, people) {
  var hands = [];
  for(var i = 0; i < people; i++) {
    hands.push([]);
  }
  for(var i = 0; i < cards.length; i++) {
    hands[i % people].push(cards[i]);
  }
  return hands;
};

