function Display(board, playerId) {
  this.id = playerId;
  // Sets the default board parameters
  this._setDefaults(board);
  // Adds functions to move class so we can move cards elegantly
  this._setMoveFunctions();

}

Display.prototype._setDefaults = function(board) {
 this.CARD_SIZE = {width: 200, height: 280, scale: 0.7};
  // Generate board targets

  var boardWidth = board.clientWidth;
  var boardHeight = board.clientHeight;
  var boardCenter = {x: boardWidth/2, y: boardHeight/2};

  this.board = board;
  this.boardWidth = boardWidth;
  this.boardHeight = boardHeight;

  this.players = [
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

  if (this.id !== 0) {
    this.players = this.players.slice(this.id, this.players.length).concat(this.players.slice(0, this.id));
  }

  // Post process
  for (var i = 0; i < this.players.length; i++) {
    var player = this.players[i];
    player.hand.x -= this.CARD_SIZE.width / 2;
    player.pile.x -= this.CARD_SIZE.width / 2;
    player.play.x -= this.CARD_SIZE.width / 2;
    player.hand.y -= this.CARD_SIZE.height / 2;
    player.pile.y -= this.CARD_SIZE.height / 2;
    player.play.y -= this.CARD_SIZE.height / 2;
  }

  this._globalZ = 5;
};

Display.prototype._setMoveFunctions = function() {
  var self = this;

  // Add movement directives
  move.prototype.player = function(player){
    this.player = player;
    return this;
  };
  move.prototype.toHand = function(){
    return this.to(self.players[this.player].hand.x, self.players[this.player].hand.y);
  };
  move.prototype.toPile = function(){
    return this.to(self.players[this.player].pile.x, self.players[this.player].pile.y);
  };
  move.prototype.toPlay = function(){
    return this.to(self.players[this.player].play.x, self.players[this.player].play.y);
  };
  move.prototype.toOrientation = function(){
    return this.rotate(self.players[this.player].orientation);
  };
  move.prototype._end = move.prototype.end;
  move.prototype.end = function(cb) {
    this.scale(self.CARD_SIZE.scale);
    this.toOrientation();
    this.el.style.zIndex = self._globalZ++;

    if (this.player === self.id) {
      $(this.el).children('.card').addClass('flipped');
    }

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
  console.log('recieved', name, data);

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
      break;
    case 'turn-start':
      this.turnStart(data.playerId);
      break;
    case 'turn-end':
      this.turnEnd(data.playerId, data.play);
      break;
    case 'round-end':
      this.roundEnd(data);
      break;
    case 'game-end':
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
  this.profile(playerId).text('Guessed ' + play.call);
  move(this.card(play.card)).player(playerId).toPlay().end();
}

Display.prototype.roundEnd = function(outcome) {
  for (var playerId in outcome) {
    var action = outcome[playerId];
    for (var i = 0; i < action.cardsWon.length; i++) {
      move(this.card(action.cardsWon[i])).player(playerId).toPile().end();
    }
    this.profile(playerId).text('Score ', action.score);
  }
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
