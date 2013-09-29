﻿function Display(board, playerId, game) {
  this.id = playerId;
  // Sets the default board parameters
  this._setDefaults(board);
  // Adds functions to move class so we can move cards elegantly
  this._setMoveFunctions();

  // HACK HACK HACK UNDO THIS!
  this.game = game;
  this._setHoverFunctions();
}

Display.prototype._setHoverFunctions = function() {
  var self = this;
  $(document).on('mouseover', '.in-hand', function() {
    var data = this.dataset['transforms'];
    this.dataset['transformsold'] = data;

    // Ugh
    var arrData = JSON.parse(data);
    /*
    for (var i = 0, ii = arrData.length; i < ii; i += 1) {
      if (arrData[i].indexOf('rotate') !== -1) {
        arrData[i] = 'rotate(0deg)';
      }
    }*/
    move(this).restore(arrData).rotate(10).translate(0, -100).end();
  });

  $(document).on('mouseout', '.in-hand', function() {
    var data = JSON.parse(this.dataset['transformsold']);
    move(this).restore(data).end();
  });


  // TODO: delurk these.
  function toUsableCard(classname) {
    var lurk = classname.split('-');
    var card = {suit: lurk[0][lurk[0].length - 1], value: lurk[1][0]};
    return card;
  }
  $(document).on('click', '.in-hand', function() {
    var card = toUsableCard($(this).children('.card').attr('class'));
    try {
      self.game.play(card, self.game.randomPlay());
    } catch (e) {
    }
  });
  $(document).on('click', '#HACK', function() {
    self.game.startMockGame(true);
  });
};

Display.prototype._setDefaults = function(board) {
 this.CARD_SIZE = {width: 200, height: 280, scale: 0.7};
  // Generate board targets

  var boardWidth = board.clientWidth;
  var boardHeight = board.clientHeight;
  var boardCenter = {x: boardWidth/2, y: boardHeight/2};

  this.board = board;
  this.boardWidth = boardWidth;
  this.boardHeight = boardHeight;

  // TODO
  this.junk = {
    x: this.boardWidth + 100,
    y: this.boardHeight + 100
  };

  var cardWidth = this.CARD_SIZE.width;
  var cardHeight = this.CARD_SIZE.height;

  this.players = [
    {
      hand: {
        x: boardWidth/2 - cardWidth / 2,
        y: boardHeight + cardHeight / 2,
        lastAngle: - Math.PI / 6,
        radius: 1.2 * cardHeight
      },
      pile: {x: boardWidth/1.33, y: boardHeight},
      play: {x: boardCenter.x, y: boardCenter.y + 150},
      orientation: 0
    },

    {
      hand: {
        x: 0 - 0.9 * cardHeight,
        y: boardHeight / 2 - cardHeight / 2,
        lastAngle: Math.PI / 3,
        radius: 0.5 * cardHeight
      },
      pile: {x: 0, y: boardHeight/1.33},
      play: {x: boardCenter.x - 150, y: boardCenter.y},
      orientation: 90
    },

    {
      hand: {
        x: boardWidth / 2 - cardWidth / 2,
        y: - cardHeight,
        lastAngle: 5 * Math.PI / 6,
        radius: 0.5 * cardHeight
      },
      pile: {x: boardWidth/1.33, y: 0},
      play: {x: boardCenter.x, y: boardCenter.y - 150},
      orientation: 180
    },

    {
      hand: {
        x: boardWidth + cardWidth / 4,
        y: boardHeight / 2 - cardHeight / 2,
        lastAngle: 4 * Math.PI / 3,
        radius: 0.5 * cardHeight
      },
      pile: {x: boardWidth, y: boardHeight/1.33},
      play: {x: boardCenter.x + 150, y: boardCenter.y},
      orientation: 270
    }
  ];

  if (this.id !== 0) {
    this.players = this.players.slice(this.id, this.players.length).concat(this.players.slice(0, this.id));
  }

  // Post process
  for (var i = 0; i < this.players.length; i++) {
    var player = this.players[i];
    player.pile.x -= this.CARD_SIZE.width / 2;
    player.play.x -= this.CARD_SIZE.width / 2;
    player.pile.y -= this.CARD_SIZE.height / 2;
    player.play.y -= this.CARD_SIZE.height / 2;

    // Lower center & set radius for fanning.
    player.hand.angleIncrement = Math.PI / 39;
  }

  this._globalZ = 5;
};

Display.prototype._setMoveFunctions = function() {
  var self = this;

  // Add movement directives
  move.prototype.player = function(player){
    this.playerId = player;
    return this;
  };
  move.prototype.toHand = function() {
    if (this.playerId === self.id) {
      $(this.el).addClass('in-hand');
    }
    var player = self.players[this.playerId];
    var angle = player.hand.lastAngle + player.hand.angleIncrement;

    var xOffset = Math.sin(angle) * player.hand.radius;
    var yOffset = Math.cos(angle) * player.hand.radius;

    var x = player.hand.x + xOffset;
    var y = player.hand.y - yOffset;

    var orientation = self.players[this.playerId].orientation;
    var degAngle = angle * 180 / Math.PI;


    this.offset = degAngle - orientation;

    player.hand.lastAngle = angle;
    return this.to(x, y);
  };
  move.prototype.toPile = function() {
    $(this.el).removeClass('in-play');
    $(this.el).children('.card').removeClass('flipped');
    this.jitter = 10;
    return this.to(self.players[this.playerId].pile.x, self.players[this.playerId].pile.y);
  };
  move.prototype.toJunk = function() {
    $(this.el).removeClass('in-play');
    $(this.el).children('.card').removeClass('flipped');
    return this.to(self.junk.x, self.junk.y);
  };
  move.prototype.toPlay = function() {
    $(this.el).removeClass('in-hand');
    $(this.el).addClass('in-play');
    this.jitter = 15;
    return this.to(self.players[this.playerId].play.x, self.players[this.playerId].play.y);
  };
  move.prototype.toOrientation = function() {
    var orientation = self.players[this.playerId].orientation;
    if (this.jitter) {
      orientation += Math.random() * 2 * this.jitter - this.jitter;
    }
    if (this.offset) {
      orientation += this.offset;
    }
    return this.rotate(orientation);
  };
  move.prototype.restore = function(data) {
    this._transforms = data;
    this.restored = true;
    return this;
  };
  move.prototype._end = move.prototype.end;
  move.prototype.end = function(cb) {
    if (!this.restored) {
      this.scale(self.CARD_SIZE.scale);
      if (this.playerId !== undefined) {
        this.toOrientation();
      }
      if (this.playerId === self.id) {
        $(this.el).children('.card').addClass('flipped');
      }
      this.el.style.zIndex = self._globalZ++;
    }


    this.el.dataset['transforms'] = JSON.stringify(this._transforms);
    this._end(cb);
  }
}

Display.prototype.card = function(name) {
  return document.querySelector('.' + name).parentNode;
}

Display.prototype.profile = function(playerId) {
  return $('#player' + playerId);
}

Display.prototype.receive = function (name, data) {

  // SERVER TO CLIENT EVENTS
  //
  // join
  // game-start
  // round-start
  // turn-start
  // turn-end
  // round-end
  // game-end
  //
  switch (name) {
    case 'join':
      this.join(data.playerId, data.info);
      break;
    case 'game-start':
      this.gameStart(data);
      break;
    case 'round-start':
      this.handleOutcome(data);
      break;
    case 'turn-start':
      this.turnStart(data.playerId);
      break;
    case 'turn-end':
      this.turnEnd(data.playerId, data.play);
      break;
    case 'round-end':
      this.roundEnd();
      break;
    case 'game-end':
      this.handleOutcome(data.outcome);
      // TODO: handle score.
      break;

  }

  // CLIENT TO SERVER EVENTS
  // join
  // play
  //

}

Display.prototype.join = function(playerId, info) {
  this.profile(playerId).text(info.name);
};

Display.prototype.gameStart = function(players) {
  var self = this;
  var hands = [];
  for (var id in players) {
    hands.push(players[id].hand);
  }
  async.timesSeries(13, function(i, nextSuit){
    async.timesSeries(4, function(j, nextCard){
      var card = hands[j][i];
      move(self.card(card)).player(j).toHand().duration(100).end(nextCard);
    }, nextSuit);
  }, util.noop);
}

Display.prototype.turnStart = function(playerId) {
  $('.player').removeClass('in-turn');
  this.profile(playerId).addClass('in-turn');
}

Display.prototype.turnEnd = function(playerId, play) {
  this.profile(playerId).text('Guessed ' + play.call.value);
  move(this.card(play.card)).player(playerId).toPlay().end();
}

Display.prototype.handleOutcome = function(outcome) {
  if (outcome) {
    for (var playerId in outcome) {
      var action = outcome[playerId];
      for (var i = 0; i < action.cardsWon.length; i++) {
        move(this.card(action.cardsWon[i])).player(playerId).toPile().end();
      }
      this.profile(playerId).text('Score ' + action.score);
    }

    $('.in-play').each(function() {
      move(this).toJunk().end();
    });
  }
}

Display.prototype.roundEnd = function() {
  $('.in-play').children('.card').addClass('flipped');
}
// TEST
/*
var i = 0;

function rand (id) {
  i += 0.5;
  var node = document.getElementById('testcard').cloneNode(true);
  document.getElementById('board').appendChild(node);
  move(node).duration(0).to(i, i).end();
  node.id = id;
  return node;
}

for (j = 0; j < 52; j++) {
 // rand('card-' + j);
}
var dis = new Display(document.getElementById('board'));

function dealToHands() {
  async.timesSeries(52, function(j, next){
    move('#card-' + (51-j)).duration(100).player(j % 4).toHand().end(next);
  }, function(){});
}

function fakePlay() {
  async.timesSeries(4, function(j, next){
    move(randCard(j)).duration(500).player(j).toPlay().end(next);
  }, function(){});
}

function randCard(j) {
  return '#card-' + (Math.floor(Math.random() * 13) * 4 + (j || 0));
}
*/
