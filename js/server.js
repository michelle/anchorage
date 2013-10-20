function Server(id) {
  EventEmitter.call(this);

  if (id === undefined) {
    this._setupGame();
  }
  this.id = id;
}

// emits messages in {event: 'bleh', data:{}} format.

util.inherits(Server, EventEmitter);

Server.prototype._setupGame = function() {
  this.game = new Game();

  var serverEvents = ['join', 'game-start', 'round-start', 'turn-start', 'turn-end', 'round-end', 'game-end'];
  async.each(clientEvents, function(event){
    game.on(event, function(data){
      this.emit(event, data);
      // and send to all peers.
    });
  });
};
