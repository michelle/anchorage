
$(function(){

  // TODO: how to do the ID??? :(
  display = new Display(board, 'Michelle' /* TODO: Plug in Google name */, 'top_secret_id');

  var serverEvents = ['join', 'game-start', 'round-start', 'turn-start', 'turn-end', 'round-end', 'game-end'];
  async.each(serverEvents, function(event){
    game.on(event, function(data){
      console.log(event, data);
      display.receive(event, data);
    });
  });

  var clientEvents = ['start', 'play'];
  // TODO: more client events for being ready, etc.
  // start is also currently not a real event.
  async.each(clientEvents, function(event){
    display.on(event, function(data){
      console.log(event, data);
      game.receive(event, data);
    });
  });

  game.receive('join', {name: display.name, id: display.id});

});

var game = new Game();
