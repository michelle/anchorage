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
  $scope.numbers = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A'];
  $scope.classes = ['two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine','ten', 'jack', 'queen', 'king', 'ace'];
  $scope.suits = ['club', 'diamond', 'heart', 'spade'];
  $scope.suit_symbols = [']', '[', '{', '}'];

  for (var i = 0; i < 52; ++i)
  {
    var suit = Math.floor(i / 13);
    var card_obj = {
      'number': $scope.numbers[i % 13],
      'suit': $scope.suits[suit],
      'suit_symbol': $scope.suit_symbols[suit],
      'classes' : $scope.classes[i],
    };

    var class_adder = function(class_name, array) { return function(number) { return array.indexOf(number) != -1 ? class_name : ''; }; };

    var arr1 = [4, 5, 6, 7, 8, 9, 10];
    var top_left = class_adder('top_left', arr1);
    var top_right = class_adder('top_right', arr1);
    var bottom_left = class_adder('bottom_left', arr1);
    var bottom_right = class_adder('bottom_right', arr1);

    var arr2 = [2, 3]
    var top_center = class_adder('top_center', arr2);
    var bottom_center = class_adder('bottom_center', arr2);

    var arr3 = [3, 5, 9, 'J', 'Q', 'K', 'A'];
    var middle_center = class_adder('middle_center', arr3);

    var arr4 = [6, 7, 8];
    var middle_left = class_adder('middle_left', arr4);
    var middle_right = class_adder('middle_right', arr4);

    var arr5 = [9, 10];
    var middle_top_left = class_adder('middle_top_left', arr5);
    var middle_top_right = class_adder('middle_top_right', arr5);
    var middle_bottom_left = class_adder('middle_bottom_left', arr5);
    var middle_bottom_right = class_adder('middle_bottom_right', arr5);

    var middle_top_center = class_adder('middle_top_center', [7, 8, 10]);
    var middle_bottom_center = class_adder('middle_bottom_center', [8, 10]);

    // TODO: Refactor
    var symbol_locs_fns = [top_left, top_right, bottom_left, bottom_right, top_center,
      bottom_center, middle_center, middle_left, middle_right, middle_top_left,
      middle_top_right, middle_bottom_left, middle_bottom_right, middle_top_center,
      middle_bottom_center];

    var symbol_locs = [];

    var j;
    for (j = 0; j < symbol_locs_fns.length; ++j)
    {
      var symbol_loc_fn = symbol_locs_fns[j];
      var res = symbol_loc_fn($scope.numbers[i % 13]);
      if (res)
      {
        symbol_locs.push(res);
      }
    }
    card_obj.symbols = symbol_locs;

    $scope.cards.push(card_obj);
  }
}

