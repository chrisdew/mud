"use strict";

var assert = require("assert");
var m = require('../lib/multidispatch2');

describe('the multidispacth support functions', function() {
  it('should include a working popcnt', function() {
    assert.equal(0, m.popcnt(0));
    assert.equal(1, m.popcnt(1));
    assert.equal(2, m.popcnt(1+2));
    assert.equal(2, m.popcnt(1+4));
    assert.equal(2, m.popcnt(4+8));
    assert.equal(3, m.popcnt(1+2+4));
    assert.equal(3, m.popcnt(8+16+32));
  });
});

describe('the multidispatch module', function() {
  var d = new m.Dispatcher([
    'VERB',
    'LOCATION',
    'CONTAINER'
  ]);


  d.addTrait('VERB');
  d.addTrait('CONTAINER');
  d.addTrait('LOCATION', d.CONTAINER);
  d.addTrait('CLOSEABLE');
  d.addTrait('DARK');
  d.addTrait('ACTOR');
  d.addTrait('ILLITERATE',d.ACTOR);
  d.addTrait('OBJECT');
  d.addTrait('MOVABLE', d.OBJECT);
  d.addTrait('READABLE', d.OBJECT);

  var READ = {traits:d.VERB, means:['READ']};

  d.use(function(verb, location, actor) { return "too dark"; })
    // implicit condition that each argument has the TRAIT of its argument names
    .when(function(verb, location, actor) { return location.dark()});

  d.use(function(verb, location, actor)
    registerFunction({verb:d.READ, location:d.LOCATION, actor:d.ACTOR|d.ILLITERATE, indob:d.READABLE}, errCannotRead);

  function putInContainer() { return "You put it in the container." }
  d.registerFunction({verb:d.PUT, location:d.LOCATION, actor:d.ACTOR, indob:d.MOVABLE, auxob:d.CONTAINER|d.OBJECT}, putInContainer);

  function readIt() { return "You read it." }
  d.registerFunction({verb:d.READ, location:d.LOCATION, actor:d.ACTOR, indob:d.READABLE}, readIt);

  var put = {traits: d.PUT};
  var read = {traits: d.READ};
  var cave = {traits: d.LOCATION|d.DARK};
  var field = {traits: d.LOCATION};
  var barbarian = {traits: d.ACTOR|d.ILLITERATE};
  var wizard = {traits: d.ACTOR};
  var scroll = {traits: d.MOVABLE|d.READABLE};
  var box = {traits: d.CONTAINER|d.OBJECT};

  it('should include a working weight', function() {
    assert.equal(5, m.weigh({verb:d.VERB, location:d.DARK|d.LOCATION, actor:d.ACTOR}));
    assert.equal(7, m.weigh({verb:d.READ, location:d.LOCATION, actor:d.ACTOR, indob:d.READABLE}));
  });
  it('should dispatch "in the dark" actions to an error function', function () {
    assert.equal(d.getFunction({verb: put, location: cave, actor: wizard, indob: scroll, auxob: box}), errTooDark);
  });

  it('should dispatch "put scroll in box" actions to a success function', function () {
    assert.equal(d.getFunction({verb:put, location:field, actor:wizard, indob:scroll, auxob:box}), putInContainer);
  });

  it('should dispatch "illiterate attempts to read" actions to an error function', function () {
    assert.equal(d.getFunction({verb:read, location:field, actor:barbarian, indob:scroll}), errCannotRead);
  });

  it('should prefer the errTooDark to errCannotRead', function () {
    assert.equal(d.getFunction({verb:read, location:cave, actor:barbarian, indob:scroll}), errTooDark);
  });

  it('should dispatch "literate read" actions to a success function', function () {
    assert.equal(d.getFunction({verb:read, location:field, actor:wizard, indob:scroll}), readIt);
  });
});


