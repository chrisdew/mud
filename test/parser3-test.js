"use strict";

var assert = require("assert");
var p = require('../lib/parser3');
var or = p.or;
var then = p.thens;
var then_raw = p.then;
var char = p.char;
var chars = p.chars;

describe('the parser3 module', function() {
  it('should have a working char', function () {
    var parse = char('a');
    assert.deepEqual([{open:{pos:0,comp:'a'}}], parse(''));
    assert.deepEqual([{succ:{pos:1,value:'a'}}], parse('a'));
    assert.deepEqual([{fail:{pos:0,error:{expected:'a',found:'b'}}}], parse('b'));
  });
  it('should have a working or', function () {
    var parse = or(char('a'), char('b'));
    assert.deepEqual([
      {open:{pos:0,comp:'a'}},
      {open:{pos:0,comp:'b'}}
    ], parse(''));
    assert.deepEqual([{succ:{pos:1,value:'a'}}], parse('a'));
    assert.deepEqual([{succ:{pos:1,value:'b'}}], parse('b'));
    assert.deepEqual([
      {fail:{pos:0,error:{expected:'a',found:'c'}}},
      {fail:{pos:0,error:{expected:'b',found:'c'}}}
    ], parse('c'));
  });
  it('should have a working then', function () {
    var parse = then_raw(char('a'), char('b'));
    assert.deepEqual([{open:{pos:0,comp:'ab'}}], parse(''));
    assert.deepEqual([{open:{pos:1,comp:'b'}}], parse('a'));
    assert.deepEqual([{succ:{pos:2,value:'ab'}}], parse('ab'));
    assert.deepEqual([{fail:{pos:0,error:{expected:'a',found:'c'}}}], parse('c'));
    assert.deepEqual([{fail:{pos:1,error:{expected:'b',found:'c'}}}], parse('ac'));
  });
  it('should have a working chars', function () {
    var parse = char('take');
    assert.deepEqual([{open:{pos:0,comp:'take'}}], parse(''));
    assert.deepEqual([{open:{pos:3,comp:'e'}}], parse('tak'));
    assert.deepEqual([{succ:{pos:4,value:'take'}}], parse('take'));
    assert.deepEqual([{fail:{pos:1,error:{expected:'ake',found:'ell'}}}], parse('tell'));
  });
  it('should have a working labelled chars', function () {
    var parse = char('take', 'verb');
    assert.deepEqual([{succ: {pos: 4, value: {verb:'take'}}}], parse('take'));
  });
  it('should have a working labelled then', function () {
    var parse = then(chars('brass', 'adj'), chars('lamp', 'noun'), 'noun_phrase');
    assert.deepEqual([{succ:{pos:10,value:{noun_phrase:[{adj:'brass'},{space:' '},{noun:'lamp'}]}}}], parse('brass lamp'));
  });
  it('should have a working labelled or', function () {
    var parse = or(chars('sword'), chars('lamp'), chars('bucket'), 'noun');
    assert.deepEqual([{succ:{pos:4,value:{noun:'lamp'}}}], parse('lamp'));
  });
  it('should handle a complex or', function () {
    var parse = or(chars('boa'), chars('boat'), chars('boathouse'), 'noun');
    assert.deepEqual([
      {open:{pos:3,comp:'t'}},
      {open:{pos:3,comp:'thouse'}},
      {succ:{pos:3,value:{noun:'boa'}}}
    ], parse('boa'));
  });
  describe('should handle a complex command', function () {
    var space = chars(' ');
    var direction = or(chars('north'), chars('east'), chars('south'), chars('west'), 'direction');
    var direction_phrase = or(
      chars('go', 'verb'),
      then(chars('go', 'verb'), direction),
      'direction_phrase'
    );
    var verb = or(chars('get'), chars('drop'), 'verb');
    var adj = or(chars('little'), chars('brass'), 'adj');
    var noun = or(chars('lamp'), chars('lampshade'), chars('sword'), 'noun');
    var noun_phrase = or(
      then(adj, noun),
      noun,
      'noun_phrase'
    );
    var command = or(
      direction_phrase,
      then(verb, noun_phrase),
      'command'
    );

    it('and parse ""', function() {
      var parsed = command('');
      console.log(JSON.stringify(parsed));
      assert.deepEqual([
        {open: {pos: 0, comp: 'drop '}},
        {open: {pos: 0, comp: 'get '}},
        {open: {pos: 0, comp: 'go '}},
        {open: {pos: 0, comp: 'go'}}
      ], parsed);
    });

    it('and parse "g"', function() {
      var parsed = command('g');
      console.log(JSON.stringify(parsed));
      assert.deepEqual([
        { open: { pos: 1, comp: 'et ' } },
        { open: { pos: 1, comp: 'o ' } },
        { open: { pos: 1, comp: 'o' } }
      ], parsed);
    });

    it('and parse "get "', function() {
      var parsed = command('get ');
      console.log(JSON.stringify(parsed));
      assert.deepEqual([
        { open: { pos: 4, comp: 'brass ' } },
        { open: { pos: 4, comp: 'lamp' } },
        { open: { pos: 4, comp: 'lampshade' } },
        { open: { pos: 4, comp: 'little ' } },
        { open: { pos: 4, comp: 'sword' } }
      ], parsed);
    });

    it('and parse "get brass lamp"', function() {
      var parsed = command('get brass lamp');
      console.log(JSON.stringify(parsed));
      assert.deepEqual([
        { open: { pos: 14, comp: 'shade' } },
        {
          succ: {
            pos: 14,
            value: {
              command: [
                { verb: "get" },
                { space: " " },
                {
                  noun_phrase: [
                    { adj: "brass" },
                    { space: " " },
                    { noun: "lamp" }
                  ]
                }
              ]
            }
          }
        }
      ], parsed);
    });
  });

  describe('should handle real commands', function () {
    var command = p.command;

    it('and parse ""', function() {
      var parsed = command('');
      console.log(JSON.stringify(parsed));
      assert.deepEqual([
        {"open":{"pos":0,"comp":"drink "}},
        {"open":{"pos":0,"comp":"drop "}},
        {"open":{"pos":0,"comp":"exit "}},
        {"open":{"pos":0,"comp":"exit"}},
        {"open":{"pos":0,"comp":"go "}},
        {"open":{"pos":0,"comp":"hang "}},
        {"open":{"pos":0,"comp":"sip "}},
        {"open":{"pos":0,"comp":"walk "}}
      ], parsed);
    });

    it('and parse "drink from "', function() {
      var parsed = command('drink from ');
      console.log(JSON.stringify(parsed));
      assert.deepEqual([
        { open: { pos: 11, comp: 'bottle' } },
        { open: { pos: 11, comp: 'drink' } },
        { open: { pos: 11, comp: 'river' } }
      ], parsed);
      console.log(process.version);
      console.log(process.versions.v8);
    });
  });
});

var cod = {
  $inventory: {
    Container: {
      contents: {
        $cloak: {
          noun: 'cloak',
          adj: 'velvet',
          Item: {
            desc: `A handsome cloak, of velvet trimmed with with satin, and slightly splattered with raindrops.` +
                  `Its blackness is so deep that it almost seems to suck light from the room.`
          }
        }
      }
    }
  },
  $foyer: {
    Container: {
      Room: {
        noun: 'foyer',
        article: 'the',
        sdesc: 'Foyer of the Opera House',
        desc: `You are standing in a spacious hall, splendidly decorated in red and gold, with glittering chandeliers ` +
              `overhead. The entrance from the street is to the north, and there are doorways south and west.`,
        south: '$bar',
        west: '$cloakroom',
        north: "You've only just arrived, and besides, the weather outside seems to be getting worse."
      },
      contents: {
      }
    }
  },
  $cloakroom: {
    Container: {
      Room: {
        noun: 'cloakroom',
        article: 'the',
        desc: `The walls of this small room were clearly once lined with hooks, though now only one remains. The exit ` +
              `is a door to the east.`,
        east: '$foyer'
      }
    }
  }
};

