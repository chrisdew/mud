/**
 * Created by chris on 02/08/16.
 * translated from http://www.firthworks.com/roger/cloak/tads/source.html
 */

var action = new m.Dispatcher();
var describe = new m.Dispatcher();
var go = new m.Dispatcher();

describe.use(location->location.ldesc);
describe.use(location->location.sdesc).when((location,actor)->actor.visited(location));

action.use((actor,verb)->{
  go(actor,dethunk(actor.location[verb]))
});



var cloakroom;
var startroom = new Room({
  sdesc: "Foyer of the Opera House",
  ldesc: "You are standing in a spacious hall, splendidly decorated in red " +
         "and gold, with glittering chandeliers overhead. The entrance from " +
         "the street is to the north, and there are doorways south and we,st. ",
  south: bar,
  west: cloakroom,
  north: "You've only just arrived, and besides, the weather outside " +
         "seems to be getting worse. "
});

cloakroom = new Room({
  inherits: room,
  sdesc: "Cloakroom",
  ldesc: "The walls of this small room were clearly once lined with hooks, " +
         "though now only one remains. The exit is a door to the east.",
  east: startroom
});

var hook = new FixedItem({
  inherits: [fixeditem, surface, item],
  sdesc: "small brass hook",
  ldesc: function () {
    return "It's just a small brass hook, " +
    this.contains(cloak) ? "with a cloak hanging on it. " : "screwed to the wall. ";
  },
  noun: ['hook', 'peg'],
  adjective: ['small', 'brass'],
  location: cloakroom
});
hook.inherits(Surface, Item);

var bar = new DarkRoom({
  lightsOn: function() {
    return !this.contains(cloak)
  },
  sdesc: "Foyer bar",
  ldesc: "The bar, much rougher than you'd have guessed after the opulence " +
         "of the foyer to the north, is completely empty. There seems to " +
         "be some sort of message scrawled in the sawdust on the floor. ",
  north: startroom,
  roomCheck: function(verb) {
    if (!this.islit) {
      if (isclass(verb, travelVerb)) {
        if (verb != nVerb) {
          message.number += 2;
          throw "Blundering around in the dark isn't a good idea!";
        }
      } else if (!isclass(verb, sysverb)) {
        message.number += 1;
        throw "In the dark? You could easily disturb something!";
      }
    }
    return true;
  }
});
/*


message: fixeditem, readable
number = 0
sdesc = "scrawled message"
ldesc =
  {
    if (self.number < 2)
{
  incscore(1);
  "The message, neatly marked in the sawdust, reads...";
  endGame(true); // this function will print "you have won" and quit.
}
else
{
  "The message has been carelessly trampled, making it difficult to read.
  You can just distinguish the words...";
  endGame(nil); // this function will print "you have lost" and quit.
}
}
noun = 'message' 'sawdust' 'floor' 'dust'
adjective = 'saw'
location = bar
;

cloak: clothingItem
sdesc = "velvet cloak"
ldesc = "A handsome cloak, of velvet trimmed with satin, and slightly
spattered with raindrops. Its blackness is so deep that it
almost seems to suck light from the room.",
noun = 'cloak'
adjective = 'handsome' 'dark' 'black' 'velvet' 'satin' 'cloak'
location = Me
isworn = true
hooked = nil
doPutOn(actor, iobj) =
{
  if (iobj = hook and not hooked)
{
  incscore(1);
  hooked := true;
}
pass doPutOn;
}
verDoDrop(actor) =
  {
    if (actor.location = cloakroom)
"Why put it on the floor when there's a perfectly good hook!";
else
"This isn't the best place to leave a smart cloak lying around.";
}
;

replace init: function
{
  "\b\bHurrying through the rainswept November night, you're glad to see the
  bright lights of the Opera House. It's surprising that there aren't more
  people about but, hey, what do you expect in a cheap demo game...?\b\b";
  version.sdesc;
  "\b";
  Me.location := startroom;
  Me.location.lookAround(true);
  Me.location.isseen := true;
  setdaemon(turncount, nil);
  scoreStatus(0,0);
}

endGame: function(won)
{
  "\b";
  if (won)
    "*** You have won ***";
  else
    "*** You have lost ***";
  "\b";
  scoreRank();
  "[Hit any key to continue]\n";
  inputkey();
  quit();
}
  */