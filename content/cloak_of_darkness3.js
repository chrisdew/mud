/**
 * Created by chris on 02/08/16.
 * translated from http://www.firthworks.com/roger/cloak/tads/source.html
 */

var game = new Game();

g.defOneToMany('Container', 'contents', 'Item', 'location');
g.inherit('Room', 'Container');
g.def('Dark', 'Room.contents.LightSource');

g.create('startroom', 'Room', {
  sdesc: "Foyer of the Opera House",
  ldesc: "You are standing in a spacious hall, splendidly decorated in red " +
  "and gold, with glittering chandeliers overhead. The entrance from " +
  "the street is to the north, and there are doorways south and we,st. ",
  south: 'bar',
  west: 'cloakroom',
  north: "You've only just arrived, and besides, the weather outside " +
  "seems to be getting worse. "
});

g.create('hook', [FixedItem, Surface], {
  sdesc: "small brass hook",
  ldesc: function () {
    return "It's just a small brass hook, " +
    this.contains(cloak) ? "with a cloak hanging on it. " : "screwed to the wall. ";
  },
  noun: ['hook', 'peg'],
  adjective: ['small', 'brass'],
  location: 'cloakroom'
});
g.defRule({'action': 'ldesc', dobj: 'hook'}, "It's just a small brass hook, screwed to the wall.");
g.defRule({'action': 'ldesc', dobj: 'hook', 'dobj.contents': 'cloak'}, "It's just a small brass hook, with a cloak hanging on it. ");

