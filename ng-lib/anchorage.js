angular.module('anchorage', [])
    .directive('card', function()
    {
      return {
        restrict: 'E',
        replace: true,
        transclude: true,
        //scope: {ngcard: '@'},
        template: '<div class="card {{ngcard.suit}} {{ngcard.classes}}" id="card_{{ngcard.number}}_{{ngcard.suit}}">' +
          '<div class="front">' + 
            '<div class="corner top">' +
              '<span class="number">{{ngcard.number}}</span>' +
              '<span>{{ngcard.suit_symbol}}</span>' +
            '</div>' +
            '<span ng-repeat="symbol in ngcard.symbols" class="suit {{symbol}}">{{ngcard.suit_symbol}}</span>' +
            '<div class="corner bottom">' +
              '<span class="number">{{ngcard.number}}</span>' +
              '<span>{{ngcard.suit_symbol}}</span>' +
            '</div>' +
          '</div>' + 
          '<div class="back"></div>' +
        '</div>',
        controller: CardController
      }
    });

function CardController($scope, $element, $timeout) {

  var board = document.getElementById('board');
  var CARD_SIZE = {width: 200, height: 280, scale: 0.7};
  // Generate board targets

  var boardWidth = board.clientWidth;
  var boardHeight = board.clientHeight;
  var boardCenter = {x: boardWidth/2, y: boardHeight/2};

  var players = [
  {
    hand: {x: boardWidth/2, y: boardHeight},
    pile: {x: boardWidth/1.33, y: boardHeight},
    play: {x: boardCenter.x, y: boardCenter.y + 160},
    orientation: 0
  },

  {
    hand: {x: 0, y: boardHeight/2},
    pile: {x: 0, y: boardHeight/1.33},
    play: {x: boardCenter.x - 160, y: boardCenter.y},
    orientation: 90
  },

  {
    hand: {x: boardWidth/2, y: 0},
    pile: {x: boardWidth/1.33, y: 0},
    play: {x: boardCenter.x, y: boardCenter.y - 160},
    orientation: 180
  },

  {
    hand: {x: boardWidth, y: boardHeight/2},
    pile: {x: boardWidth, y: boardHeight/1.33},
    play: {x: boardCenter.x + 160, y: boardCenter.y},
    orientation: 270
  }
  ];

  $scope.$watch('ngcard', function(ngcard) {
    $timeout(function() {
      var to = {  x: boardCenter.x + (ngcard.cardindex - (ngcard.totalcards / 2)) / (ngcard.totalcards) * CARD_SIZE.width * CARD_SIZE.scale,
                  y: boardHeight / 4 * ngcard.playerid };
      console.log(to);
      console.log($element.get(0));
      move($element.get(0)).duration(500).translate(to).end();
    }, 0);
  });
}

function GameController($scope) {
  $scope.CARDS = 52;

  // All array indices correlate to player ID
  $scope.players = [];
  $scope.started = false;

  // TODO: endgame.
  
  $scope.start = function(cb) {
    // TODO: validate numPlayers.
    $scope.numPlayers = $scope.players.length;
    $scope.totalRounds = $scope.CARDS / $scope.numPlayers;
  
    var deck = new Deck();
    deck.shuffle();

    for (var i = 0; i < this.numPlayers; ++i) {
      for (var j = 0; j < this.totalRounds; ++j) {
        this.players[i].deal(deck.deal());
      }
      this.players[i].sortHand();
    }

  
    // Currently...
    $scope.round = 0;
    $scope.turn = 0;
    // Keyed on player id.
    $scope.plays = []; // {card: card, call: call}
    $scope.junk = [];
    $scope.states = [];
  
    $scope.started = true;
    // TODO: cb with state of cards.
  };
  
  $scope.startRound = function() {
    $scope.round += 1;
    $scope.turn = 0;
    $scope.plays = [];
  };
  
  $scope.join = function() {
    var player = new Player($scope.players.length);
    $scope.players.push(player);
    return player;
  };
  
  // current player given the turn and round.
  $scope.currentPlayer = function() {
    var id = ($scope.round + $scope.turn) % $scope.numPlayers;
    return $scope.players[id];
  };
  
  // Call: {value: [0-9]+, special: boolean}
  $scope.play = function(card, call, cb) {
    $scope.validateCall(call);
  
    var player = $scope.currentPlayer();
    if (player.play(card, cb)) {
      $scope.plays[player.id] = {
        card: card,
        call: call
      };
      // TODO: VALIDATE CALL@#$KL@$J
    } else {
      throw new Error('you suck');
    }
    var state = {}
    state[card.value + card.suit] = ''; // TODO
    $scope.states.push(state);
  
    $scope.turn += 1;
    if ($scope.turn === $scope.numPlayers) {
      $scope.score();
      $scope.startRound();
    }
  
    if (cb) {
      cb($scope.states);
      $scope.states = [];
    }
  };
  
  $scope.validateCall = function(call) {
    if (call.special && (call.value < 2)) {
      throw new Error("Can't use a special call with value of " + call.value);
    }
  };
  
  $scope.score = function() {
    var losers = [];
    var winnings = [];
    var sorted = $scope.plays.map(function(play) {
      return Deck.valueMap[play.card.value];
    }).sort(function(a, b) { return a - b });
  
    // Score specials.
    for (var i = 0, ii = $scope.players.length; i < ii; i += 1) {
      var player = $scope.players[i];
      var play = $scope.plays[i];
      if (play.call.special && losers.indexOf(i) === -1) {
        var result = $scope.scoreCall(player, play);
        winnings = winnings.concat(result.winning);
        losers = losers.concat(result.losers);
        player.winCards(result.winning);
      }
    }
  
    // Score non-specials.
    for (var i = 0, ii = $scope.players.length; i < ii; i += 1) {
      var player = $scope.players[i];
      var play = $scope.plays[i];
      if (!play.call.special && losers.indexOf(i) === -1) {
        if (sorted.lastIndexOf(Deck.valueMap[play.card.value]) === play.call.value) {
          var winning = [play.card];
          winnings = winnings.concat(winning);
          player.winCards(winning);
        }
      }
    }
  
    var junkCards = [];
    for (var i = 0, ii = $scope.plays.length; i < ii; i += 1) {
      if (winnings.indexOf($scope.plays[i].card) < 0) {
        junkCards.push($scope.plays[i].card);
      }
    }
  
    $scope.junk = $scope.junk.concat(junkCards);
  
    // TODO: push state to $scope.states
  };
  
  // (*￣m￣)
  $scope.scoreCall = function(prayer, pray) {
    var matches = [pray.card];
    var losers = [];
    var loseValue = {
      losers: [],
      winning: []
    };
  
    var carr = pray.call;
    for (var i = 0, ii = $scope.plays.length; i < ii; i += 1) {
      if (prayer.id !== i) {
        var play = $scope.plays[i];
  
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
  
  // debug
  $scope.dumpHands = function() {
    for (var i = 0, ii = $scope.players.length; i < ii; i += 1) {
      console.log($scope.players[i].dump());
    }
  };
  
  $scope.printWinnings = function() {
    for (var i = 0, ii = $scope.players.length; i < ii; i += 1) {
      console.log($scope.players[i].won.map(function(card) {
        return card.value + card.suit;
      }));
    }
  }
};
