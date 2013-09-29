
$(function(){


  display = new Display();

  var events = ['join', 'game-start', 'round-start', 'turn-start', 'turn-end', 'round-end', 'game-end'];
  async.each(events, function(event){
    game.on(event, function(data){
      display.receive(event, data);
    });
  });


});

var game = new Game();
