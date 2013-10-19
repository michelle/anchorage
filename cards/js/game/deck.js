function Deck() {
  Deck.values = '234567890jqka'.split('');
  Deck.suits = 'dchs'.split('');

  this.cards = [];
  Deck.valueMap = {};

  for(var i = 0; i < Deck.values.length; i++) {
    Deck.valueMap[Deck.values[i]] = i;
    for(var j = 0; j < Deck.suits.length; j++) {
      this.cards.push({
        value: Deck.values[i],
        suit: Deck.suits[j]
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

Deck.frontendCard = function(card) {
  return card.suit + '-' + card.value;
};

Deck.cardToAngularCard = function(card) {

  var numbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  var classes = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine','ten', 'jack', 'queen', 'king', 'ace'];
  var suits = ['club', 'diamond', 'heart', 'spade'];
  var suit_symbols = [']', '[', '{', '}'];

  var suit = Deck.suits.indexOf(card.suit);
  var index = Deck.valueMap[card.value];
  var card_obj = {
    'number': numbers[index],
    'suit': suits[suit],
    'suit_symbol': suit_symbols[suit],
    'classes' : classes[index],
  };

  var gen_symbol = function(class_name, array) { return function(number) { return array.indexOf(number) != -1 ? class_name : ''; }; };

  var corner_syms = [4, 5, 6, 7, 8, 9, 10];
  var top_bottom_center_syms = [2, 3]
  var middle_inner_syms = [6, 7, 8];
  var middle_outer_syms = [9, 10];

  var symbol_locs_fns = [
  gen_symbol('top_left', corner_syms),
  gen_symbol('top_right', corner_syms),

  gen_symbol('bottom_left', corner_syms),
  gen_symbol('bottom_right', corner_syms),

  gen_symbol('top_center', top_bottom_center_syms),
  gen_symbol('bottom_center', top_bottom_center_syms),
  gen_symbol('middle_center', [3, 5, 9, 'J', 'Q', 'K', 'A']),

  gen_symbol('middle_left', middle_inner_syms),
  gen_symbol('middle_right', middle_inner_syms),

  gen_symbol('middle_top_left', middle_outer_syms),
  gen_symbol('middle_top_right', middle_outer_syms),
  gen_symbol('middle_bottom_left', middle_outer_syms),
  gen_symbol('middle_bottom_right', middle_outer_syms),

  gen_symbol('middle_top_center', [7, 8, 10]),
  gen_symbol('middle_bottom_center', [8, 10]),
  ];

  var symbol_locs = [];

  for (var i = 0; i < symbol_locs_fns.length; ++i)
  {
    var symbol_loc_fn = symbol_locs_fns[i];
    var res = symbol_loc_fn(numbers[index]);
    if (res)
    {
      symbol_locs.push(res);
    }
  }
  card_obj.symbols = symbol_locs; 

  return card_obj;
}
