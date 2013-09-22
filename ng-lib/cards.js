angular.module('anchorage', [])
    .directive('card', function()
    {
      return {
        restrict: 'E',
        replace: true,
        template: '<div class="card {{card.suit}} {{card.classes}}" id="card_{{card.number}}_{{card.suit}}">' +
          '<div class="corner top">' +
            '<span class="number">{{card.number}}</span>' +
            '<span>{{card.suit_symbol}}</span>' +
          '</div>' +
          '<span ng-repeat="symbol in card.symbols" class="suit {{symbol}}">{{card.suit_symbol}}</span>' +
          '<div class="corner bottom">' +
            '<span class="number">{{card.number}}</span>' +
            '<span>{{card.suit_symbol}}</span>' +
          '</div>' +
        '</div>',
      }
    });

function CardsController($scope)
{
  $scope.cards = [];
  var numbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  var classes = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine','ten', 'jack', 'queen', 'king', 'ace'];
  var suits = ['club', 'diamond', 'heart', 'spade'];
  var suit_symbols = [']', '[', '{', '}'];

  for (var i = 0; i < 52; ++i)
  {
    var suit = Math.floor(i / 13);
    var card_obj = {
      'number': numbers[i % 13],
      'suit': suits[suit],
      'suit_symbol': suit_symbols[suit],
      'classes' : classes[i],
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

    var j;
    for (j = 0; j < symbol_locs_fns.length; ++j)
    {
      var symbol_loc_fn = symbol_locs_fns[j];
      var res = symbol_loc_fn(numbers[i % 13]);
      if (res)
      {
        symbol_locs.push(res);
      }
    }
    card_obj.symbols = symbol_locs;

    $scope.cards.push(card_obj);
  }
}

