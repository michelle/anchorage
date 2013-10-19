function Display(board, name, id) {
  EventEmitter.call(this);

  // Sets the default board parameters
  this._setDefaults(board);
  // Adds functions to move class so we can move cards elegantly
  this._setMoveFunctions();

  this._initializeCards();
  this._addUIElements();

  this._setHoverFunctions();
  this._setActionHandlers();
  // So I can identify myself later.
  this.id = id;
  this.name = name;
}

util.inherits(Display, EventEmitter);

Display.prototype._initializeCards = function() {
  $('.card_container').each(function() {
    move(this).rotate(25).translate(-25, -45).end();
  });
};

Display.prototype._setHoverFunctions = function() {
  var self = this;
  $(document).on('mouseover', '.in-hand', function() {
    if (!$(this).hasClass('selected')) {
      var data = this.dataset['transforms'];
      this.dataset['transformsold'] = data;
      // Ugh
      var arrData = JSON.parse(data);
      move(this).restore(arrData).rotate(10).translate(0, -100).end();
    }
  });

  $(document).on('mouseout', '.in-hand', function() {
    var el = this;
    if (!$(el).hasClass('selected')) {
      self._unselectCard(el);
    }
  });
};

Display.prototype._unselectAllCards = function() {
  var self = this;
  $('.card_container.in-hand.selected').each(function(){
    self._unselectCard(this);
  });
};

Display.prototype._unselectCard = function(el) {
  var data;
  try {
    data = JSON.parse(el.dataset['transformsold']);
  } catch (e) {
    return;
  }
  $(el).removeClass('selected');
  move(el).restore(data).end();
};

Display.prototype._setActionHandlers = function() {
  var self = this;

  $(document).on('click', '.in-hand', function() {
    if (self.canPlayCard) {
      var oldCard = self.selectedCard;
      self.selectedCard = self.cardObject($(this).children('.card').attr('class'));
      // Unselect currently selected cards
      self._unselectAllCards();
      // Set this card as selected so it doesn't disappear on mouseout
      if (self.selectedCard == oldCard) {
        // They just clicked the same card, deselect
        self.selectedCard = null;
        return;
      }
      $(this).addClass('selected');
      if (self.selectedCall) {
        self.sendMove();
      }
    }
  });

  $(document).on('click', '.call-button', function() {
    if (self.canPlayCard) {
      var val = this.dataset.val;
      self.selectedCall = {value: parseInt(val[0], 10), special: val[1] == 's'};
      $('.in-show-chip').each(function(){
        move(this).player(self.playerId).toChipHome().end();
      });
      if (self.selectedCard) {
        self.sendMove();
      }
      move(this).player(self.playerId).toChipPlay().end();
    }
  });

  $(document).on('click', '#HACK', function() {
    self.emit('start');
    $(this).remove();
  });
};

Display.prototype.sendMove = function() {
  this.emit('play', {playerId: this.playerId, call: this.selectedCall, card: this.selectedCard});
  this._unselectAllCards();
  this.canPlayCard = false;
};

Display.prototype._setDefaults = function(board) {
  this.CARD_SIZE = {width: 200, height: 280, scale: 0.6};
  this.CHIP_SIZE = {width: 80, height: 80, scale: 0.6};
  // Generate board targets

  var boardWidth = board.clientWidth;
  var boardHeight = board.clientHeight;
  var boardCenter = {x: boardWidth/2, y: boardHeight/2};
  this.CARD_SIZE.scale = Math.min(boardHeight / 1100, 1);

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

  // This is terribly hardcoded.
  this.players = [
    {
      hand: {
        x: boardWidth/2 - cardWidth / 2,
        y: boardHeight + cardHeight / 2,
        lastAngle: - Math.PI / 6,
        radius: 1.2 * cardHeight
      },
      pile: {x: boardWidth * .15, y: boardHeight - 0.3 * cardHeight},
      play: {x: boardCenter.x, y: boardCenter.y + this.CARD_SIZE.scale * cardWidth / 0.9},
      orientation: 0
    },

    {
      hand: {
        x: 0 - 0.9 * cardHeight,
        y: boardHeight / 2 - 0.67 * cardHeight,
        lastAngle: Math.PI / 3,
        radius: 0.5 * cardHeight
      },
      pile: {x: - 0.55 * cardHeight, y: boardHeight/1.33 - 0.5 * cardWidth},
      play: {x: boardCenter.x - this.CARD_SIZE.scale * cardWidth / 0.9, y: boardCenter.y},
      orientation: 90
    },

    {
      hand: {
        x: boardWidth / 2 - cardWidth / 2,
        y: - cardHeight,
        lastAngle: 5 * Math.PI / 6,
        radius: 0.5 * cardHeight
      },
      pile: {x: boardWidth/1.33, y: - 0.7 * cardHeight},
      play: {x: boardCenter.x, y: boardCenter.y - this.CARD_SIZE.scale * cardWidth / 0.9},
      orientation: 180
    },

    {
      hand: {
        x: boardWidth + cardWidth / 4,
        y: boardHeight / 2 - 0.67 * cardHeight,
        lastAngle: 4 * Math.PI / 3,
        radius: 0.5 * cardHeight
      },
      pile: {x: boardWidth - 0.2 * cardHeight, y: boardHeight / 1.33 - 0.5 * cardWidth},
      play: {x: boardCenter.x + this.CARD_SIZE.scale * cardWidth / 0.9, y: boardCenter.y},
      orientation: 270
    }
  ];

  // Display the chips so they can be selected
  this.chipDisplay = [];
  var chipMargin = 15;
  var chipVerticalOffset = 30;
  var chipWidth = (this.CHIP_SIZE.width * this.CHIP_SIZE.scale) + chipMargin;
  var horizontalOffset = chipWidth * 7 / 2;
  for (var i = 0; i < 7; i++) {
    this.chipDisplay.push({
      x: boardCenter.x - horizontalOffset + i * chipWidth,
      y: boardCenter.y + chipVerticalOffset
    });
  }

  // Post process
  for (var i = 0; i < this.players.length; i++) {
    var player = this.players[i];
    player.play.x -= this.CARD_SIZE.width / 2;
    player.play.y -= this.CARD_SIZE.height / 2;

    // Lower center & set radius for fanning.
    player.hand.angleIncrement = Math.PI / 39;
  }

  this._addUIElements();

  this._globalZ = 5;
  this._globalTopZ = 200000;
};

Display.prototype._addUIElements = function() {
  // Attach:
  //  scores
  //  chips (should be on beforehand)
  //  videos

  // spotlights
  this.spotlights = {
    $deck: $('.spotlight.deck'),
    $player: $('.spotlight.player'),
    $center: $('.spotlight.center')
  };

  this.spotlights.$player.css('left', this.boardWidth / 2 - this.spotlights.$player.width() / 2);
};

Display.prototype._setMoveFunctions = function() {
  var self = this;

  // Add movement directives
  move.prototype.player = function(player){
    this.playerId = player;
    return this;
  };
  move.prototype.preserveZ = function() {
    this.preserveZIndex = true;
    return this;
  };
  move.prototype.toTop = function() {
    this.toplevel = true;
    return this;
  };
  move.prototype.toHand = function() {
    if (this.playerId === self.playerId) {
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
    this.toplevel = true;

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
  move.prototype.toChipPlay = function() {
    this.toplevel = true;
    $(this.el).addClass('in-play-chip');
    this.jitter = 15;
    return this.to(self.players[this.playerId].play.x, self.players[this.playerId].play.y);
  };
  move.prototype.toChipShow = function(index) {
    // Display chips to select from
    $(this.el).addClass('in-show-chip');
    this.toplevel = true;
    return this.to(self.chipDisplay[index].x, self.chipDisplay[index].y);
  }
  move.prototype.toChipHome = function() {
    $(this.el).removeClass('in-show-chip');
    $(this.el).removeClass('in-play-chip');
    return this.to(self.players[this.playerId].hand.x, self.players[this.playerId].hand.y);
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
      if (this.playerId === self.playerId && self.playerId !== undefined) {
        $(this.el).children('.card').addClass('flipped');
      }
      if (!this.toplevel && !this.preserveZIndex) {
        this.el.style.zIndex = self._globalZ++;
      } else if (this.toplevel) {
        this.el.style.zIndex = self._globalTopZ++;
      }
    }


    this.el.dataset['transforms'] = JSON.stringify(this._transforms);
    this._end(cb);
  }
}

Display.prototype.card = function(name) {
  return document.querySelector('.' + name).parentNode;
}

Display.prototype.cardObject = function(classname) {
  var lurk = classname.split('-');
  var card = {suit: lurk[0][lurk[0].length - 1], value: lurk[1][0]};
  return card;
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
      // TODO: handle score. this.handleFinalScore(data.score);
      break;

  }

  // CLIENT TO SERVER EVENTS
  // join
  // play
  //

}

Display.prototype.join = function(playerId, info) {
  if (info.id === this.id) {
    this.playerId = playerId;
    if (this.playerId !== 0) {
      this.players = this.players.slice(this.playerId, this.players.length).concat(this.players.slice(0, this.playerId));
    }
  }
  this.profile(playerId).text(info.name);
};

Display.prototype.gameStart = function(players) {
  var self = this;
  var hands = [];
  for (var id in players) {
    hands.push(players[id].hand);
  }

  // fast shuffle
  var offset = 0;
  var delay = 0;
  for (var i = 12; i >= 0; i -= 1) {
    for (var j = 3; j >= 0; j -= 1) {
      (function(_i, _j, _offset, _delay) {
        setTimeout(function() {
          move(self.card(hands[_j][_i])).rotate(25).translate(-25 - _offset, -45 - _offset).end();
        }, _delay);
      })(i, j, offset, delay);
      delay += 20;
      offset += 0.2;
    }
  }

  function moveDeckLight() {
    move(self.spotlights.$deck[0]).preserveZ().translate(self.boardWidth / 2, self.boardHeight / 2).scale(1.7).end();
  }

  setTimeout(function() {
    async.timesSeries(13, function(i, nextSuit) {
      async.timesSeries(4, function(j, nextCard) {
        var card = hands[j][i];
        move(self.card(card)).player(j).toHand().duration(100).end(nextCard);
      }, nextSuit);
    }, moveDeckLight);
    //self.spotlights.$deck.fadeOut(8500);
  }, delay + 800);
}

Display.prototype.turnStart = function(playerId) {
  if (this.playerId === playerId) {
    this.canPlayCard = true;
    // Show all the chips
    $('.call-button').each(function(i){
      move(this).toChipShow(i).end();
    });
  }
  $('.player').removeClass('in-turn');
  this.profile(playerId).addClass('in-turn');
}

Display.prototype.turnEnd = function(playerId, play) {
  if (this.playerId === playerId) {
    this.canPlayCard = false;
    this.selectedCard = null;
    this.selectedCall = null;
  }

  move(this.card(play.card)).player(playerId).toPlay().end();

  if (this.playerId !== playerId) {
    var chip = $('.chip.player-'+playerId)[0];
    // Determine right class name for chip
    var val = play.call.value;
    if (play.call.special) {
      val += 's';
    }
    chip.dataset.val = val;
    move(chip).player(playerId).toChipPlay().duration(750).end();
  }
}

Display.prototype.handleOutcome = function(outcome) {
  var self = this;
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
    $('.in-play-chip').each(function() {
      var player = this.dataset.player || self.playerId; // The owning player of chip is either in dataset or is the current player
      move(this).player(player).toChipHome().end();
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
