gapi.hangout.onApiReady.add(function(eventObj) {
  if (eventObj.isApiReady) {
    // FIXME: Override some of the defaults for our sanity
    // Get these overrides working... 
    // Also do onStateChanged.add so that eventObj's objects are parsed

    // gapi.hangout.data.prototype._setValue = gapi.hangout.data.prototype.setValue;
    // gapi.hangout.data.prototype.setValue = function(key, value) {
    //   if (value) {
    //     value = JSON.stringify(value);
    //   }
    //   gapi.hangout.data.setValue(key, value);
    // }

    // gapi.hangout.data.prototype._getValue = gapi.hangout.data.prototype.getValue;
    // gapi.hangout.data.prototype.getValue = function(key) {
    //   var value = gapi.hangout.data.getValue(key);
    //   if (value) {
    //     value = JSON.parse(value);
    //   }
    //   return value;
    // }

    startAnchorage();
  }
});

function pushEvent(type, data, isClientServer) {
  // Updates the global event queue
  // This will call us back to send the event to display
  // so that the server can handle events the same way
  // as clients

  var eventPrefix = isClientServer ? 'cs' : 'sc'
  var events;
  if (isClientServer) {
    events = gapi.hangout.data.getValue(eventPrefix + '-events');
    events = events ? JSON.parse(events) : [];
  } else {
    events = gEvents;
  }

  var ev = {type: type, data: data};
  if (events) {
    events.push(ev);
  } else {
    events = [ev];
  }
  console.log('Pushing ' + eventPrefix + ' event: ' + JSON.stringify(ev));
  gapi.hangout.data.setValue(eventPrefix + '-events', JSON.stringify(events));
}

function startAnchorage() {
  eventId = 0;
  var isServer = false;

  var me = gapi.hangout.getLocalParticipant();
  var participants = gapi.hangout.getEnabledParticipants();

  display = new Display(board, me.person.displayName, me.person.id);

  // TODO: Is there a possible race condition here?
  var server = gapi.hangout.data.getValue('server');
  if (!server || server == me.person.id) {
    isServer = true;
    console.log('I am the server!');

    gEvents = gapi.hangout.data.getValue('sc-events');
    gEvents = gEvents ? JSON.parse(gEvents) : [];

    // Store my id as the server in case I get dropped out of the call
    gapi.hangout.data.setValue('server', me.person.id)

    // Set up new game object
    game = new Game();

    var serverEvents = ['join', 'game-start', 'round-start', 'turn-start', 'turn-end', 'round-end', 'game-end'];
    async.each(serverEvents, function(event) {
      game.on(event, function(data) {
        console.log(event, data);
        pushEvent(event, data, false);
        display.receive(event, data);
      });
    });

    // TODO: more client events for being ready, etc.
    // start is also currently not a real event.
    var clientEvents = ['start', 'play'];
    async.each(clientEvents, function(event) {
      display.on(event, function(data){
        console.log(event, data);
        game.receive(event, data);
      })
    });
  } else {
    // TODO: more client events for being ready, etc.
    var clientEvents = ['play'];
    async.each(clientEvents, function(event) {
      display.on(event, function(data){
        console.log(event, data);
        pushEvent(event, data, true);
      })
    });   
  }

  var players = gapi.hangout.data.getValue('players');
  var alreadyInGame = false;
  // Setup our event handlers before processing the event queue
  if (players) {
    var parsed = JSON.parse(players);
    if (!(me.person.id in parsed)) {
      parsed.push(me.person.id)
      gapi.hangout.data.setValue('players', JSON.stringify(parsed));
    } else {
      alreadyInGame = true;
    }
  } else {
    gapi.hangout.data.setValue('players', JSON.stringify([me.person.id]));
  }

  var onStateChange = function(eventObj) {
    var events;
    var eventQueue = isServer ? 'cs-events' : 'sc-events';

    console.log(eventObj.state[eventQueue]);
    if (!eventObj.state[eventQueue]) {
      console.log('returning early :(');
      return;
    }
    events = JSON.parse(eventObj.state[eventQueue]);

    console.log('processed up to', eventId);
    for (var i = eventId; i < events.length; ++i, ++eventId) {
      console.log('processing eventid', eventId)
      var ev = events[i];
      console.log(ev.type, ev.data);
      if (isServer) {
        game.receive(ev.type, ev.data)
      } else {
        display.receive(ev.type, ev.data);
      }
    }
  };

  gapi.hangout.data.onStateChanged.add(onStateChange);

  // var onParticipantsChange = function(eventObj) {
  //   participants_ = eventObj.participants;
  // };

  // gapi.hangout.onParticipantsChanged.add(onParticipantsChange);

  // TODO: how to do the ID??? :(

  if (!alreadyInGame) {
    pushEvent('join', {name: display.name, id: me.person.id}, true);
  }
}
