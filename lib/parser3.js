"use strict";

var assert = require('assert');

exports.or = or;
exports.then = then;
exports.thens = thens;
exports.char = chars;
exports.chars = chars;
exports.command = createCommand();

/*
function or(a, b) {
  return function(text, pos) {
    var ra = a(text, pos);
    var rb = b(text, pos);
    if (failed(ra) === failed(rb)) {
      // if both have succeeded or failed, return all the results
      return ra.concat(rb);
    } else {
      // otherwise just return the open and succ results
      if (failed(ra)) return rb;
      if (failed(rb)) return ra;
    }
  }
}
*/

function or() {
  var args = Array.prototype.slice.call(arguments);
  var label;
  if (typeof args[args.length - 1] === 'string') {
    label = args[args.length - 1];
    args = args.slice(0, args.length - 1);
  }
  return function(text, pos) {
    var r = [];
    var allFailed = true;
    for (var i in args) {
      if (typeof args[i] !== 'function') {
        var mol = 42;
      }
      r[i] = args[i](text, pos);
      if (!failed(r[i])) {
        allFailed = false;
      }
    }
    if (allFailed) {
      // if both have failed, return all the results
      var ret = [];
      for (var i in r) {
        ret = ret.concat(r[i]);
      }
      return sortAndDeDup(ret);
    } else {
      // otherwise just return the non-failed results
      var ret = [];
      for (var i in r) {
        if (!failed(r[i])) {
          for (var j in r[i]) {
            if (r[i][j].succ && label) {
              var value = {};
              value[label] = r[i][j].succ.value;
              var nsucc = {pos:r[i][j].succ.pos,value:value};
              ret.push({succ:nsucc});
            } else {
              ret.push(r[i][j]);
            }
          }
        }
      }
      return sortAndDeDup(ret);
    }
  }
}

function then() {
  var args = Array.prototype.slice.call(arguments);
  var label;
  if (typeof args[args.length - 1] === 'string') {
    label = args[args.length - 1];
    args = args.slice(0, args.length - 1);
  }
  // TODO: automate this for N args
  if (args.length == 2) return _then(args[0], args[1], label);
  if (args.length == 3) return _then(args[0], _then(args[1], args[2]), label);
  if (args.length == 4) return _then(args[0], _then(args[1], _then(args[2], args[3])), label);
  if (args.length == 5) return _then(args[0], _then(args[1], _then(args[2], _then(args[3], args[4]))), label);
  if (args.length == 6) return _then(args[0], _then(args[1], _then(args[2], _then(args[3], _then(args[4], args[5])))), label);
  if (args.length == 7) return _then(args[0], _then(args[1], _then(args[2], _then(args[3], _then(args[4], _then(args[5], args[6]))))), label);
}

function thens() {
  var args = Array.prototype.slice.call(arguments);
  var label;
  if (typeof args[args.length - 1] === 'string') {
    label = args[args.length - 1];
    args = args.slice(0, args.length - 1);
  }
  var space = chars(' ', 'space');
  // TODO: automate this for N args
  if (args.length == 2) return _then(args[0], _then(space, args[1]), label);
  if (args.length == 3) return _then(args[0], _then(space, _then(args[1], _then(space, args[2]))), label);
  if (args.length == 4) return _then(args[0], _then(space, _then(args[1], _then(space, _then(args[2], _then(space, args[3]))))), label);
}

function _then(a, b, label) {
  return function(text, pos) {
    var ra = a(text, pos);
    if (failed(ra)) return ra;
    var ret = [];
    for (var i in ra) {
      // all of the results are either open or succ
      var result = ra[i];
      if (result.succ) {
        var rb = b(text, result.succ.pos);
        for (var j in rb) {
          var result_b = rb[j];
          if (result_b.succ) {
            var aval = result.succ.value;
            var bval = result_b.succ.value;
            var raw_value;
            if (typeof aval === 'string' && typeof bval === 'string') {
              raw_value = aval + bval;
            } else if (Object.prototype.toString.call(bval) === '[object Array]') {
              raw_value = [aval].concat(bval);
            } else {
              raw_value = [aval, bval];
            }
            var value;
            if (label) {
              value = {};
              value[label] = raw_value;
            } else {
              value = raw_value;
            }
            var nsucc = {pos:result_b.succ.pos,value:value};
            ret.push({succ:nsucc});
          } else {
            ret.push(result_b);
          }
        }
      } else {
        assert(result.open);
        assert(result.open.pos === text.length);
        // try adding the completion and parsing with b, to get longer completions
        var tmp = text + result.open.comp;
        var last = tmp[tmp.length - 1];
        if (last === ' ') {
          // cut on spaces
          ret.push(result);
        } else {
          var rb = b(tmp, result.open.pos + result.open.comp.length)
          for (var j in rb) {
            var result_b = rb[j];
            assert(result_b.open);
            var nopen = {pos: result.open.pos, comp: result.open.comp + result_b.open.comp};
            ret.push({open: nopen});
          }
        }
      }
    }
    return ret;
  }
}

function chars(expected, label) {
  return function(text, pos) {
    if (!pos) pos = 0;
    var found = text.substr(pos, expected.length);
    var num_same = numSame(found, expected);
    if (num_same === found.length) {
      if (found.length < expected.length) {
        return [{open:{pos:pos+found.length,comp:expected.substr(found.length)}}];
      } else {
        var value;
        if (label) {
          value = {};
          value[label] = found;
        } else {
          value = found;
        }
        return [{succ:{pos:pos+expected.length,value:value}}];
      }
    } else {
      return [{fail:{pos:pos + num_same,error:{expected:expected.substr(num_same),found:found.substr(num_same)}}}];
    }
  }
}

// find how many characters match
function numSame(a, b) {
  var i;
  for (i = 0; i < a.length && i < b.length; i++) {
    if (a[i] !== b[i]) break;
  }
  return i;
}

// are all the results failures
function failed(array) {
  var all_failed = true;
  var all_succ_or_open = true;
  for (var i in array) {
    for (var p in array[i]) {
      if (p !== 'fail') {
        all_failed = false;
      }
      if (p !== 'succ' && p !== 'open') {
        all_succ_or_open = false;
      }
    }
  }
  if (!all_failed && !all_succ_or_open) throw new Error('results must either be all failures, or all not failures');
  if (all_failed) return true;
  if (all_succ_or_open) return false;
}

// sort and dedup array
function sortAndDeDup(array) {
  var sorted = array.sort(function(a, b) {
    var aj = JSON.stringify(a);
    var bj = JSON.stringify(b);
    if (aj < bj) return -1;
    if (aj > bj) return 1;
    return 0;
  });
  var ret = [];
  for (var i = 0; i < sorted.length; i++) {
    if (i !== 0) {
      var aj = JSON.stringify(sorted[i - 1]);
      var bj = JSON.stringify(sorted[i]);
      if (aj === bj) continue; // skip dups
    }
    ret.push(sorted[i]);
  }
  return ret;
}

// define a rich parser
function createCommand() {
  var words = {
    bottle: { noun: { container: true, drinkable: true } },
    cloak: { noun: { item: true, wearable: true } },
    drink: { noun: { item: true, drinkable: true }, verb: true },
    drop: { noun: { abstract: true }, verb: true },
    east: { direction: true },
    exit: { noun: { feature: true }, verb: { parent: 'go' } },
    floor: { noun: { feature: true } },
    get: { verb: true },
    go: { verb: true },
    hang: { verb: { parent: 'put'} },
    hook: { noun: { feature: true }, verb: true },
    north: { direction: true },
    lamp: { noun: { item: true } },
    leave: { verb: { parents: ['drop', 'exit'] } },
    rock: { noun: { item: true }, verb: true },
    river: { noun: { container: true, drinkable: true } },
    sip: { noun: { abstract: true }, verb: { parent: 'drink' } },
    sleep: { verb: true },
    south: { direction: true },
    sword: { noun: { item: true } },
    walk: { noun: { abstract: true }, verb: { parent: 'go' } },
    west: { direction: true },
    zzz: { verb: { parent: 'sleep' } }
  };

  function word_or_children(type, name, arg) {
    var matches = [];
    for (var word in words) {
      var wwt = words[word][type];
      if (!wwt) continue;
      var found = false;
      if (word === arg)                      found = word;
      if (wwt.parent === arg)                found = word;
      if (wwt.parents && arg in wwt.parents) found = word;
      if (wwt[arg])                          found = word;
      if (!found) continue;
      matches.push(chars(found, name));
    }
    var arr = matches.concat([name]);
    return or.apply(null, arr);
  }

  function words_of_type(type) {
    var matches = [];
    for (var word in words) {
      if (words[word][type]) matches.push(word);
    }
    var arr = matches.concat([type]);
    return or.apply(arr);
  }

  var verb_drink = word_or_children('verb', 'verb_drink', 'drink');
  var verb_drop = word_or_children('verb', 'verb_drop', 'drop');
  var verb_exit = word_or_children('verb', 'verb_exit', 'exit');
  var verb_go = word_or_children('verb', 'verb_go', 'go');
  var verb_hang = word_or_children('verb', 'verb_hang', 'hang');
  var verb_put = word_or_children('verb', 'verb_put', 'put');
  var verb_throw = word_or_children('verb', 'verb_throw', 'throw');
  var noun_drinkable = word_or_children('noun', 'noun_drinkable', 'drinkable');
  var noun_item = word_or_children('noun', 'noun_item', 'item');

  var direction = words_of_type('direction');
  var noun = words_of_type('noun');

  var space = chars(' ');
  var prep = or(chars('on'), chars('in'), 'prep');

  var command = or(
    then(verb_drink, space, noun_drinkable),
    then(verb_drink, space, chars('from'), space, noun_drinkable),
    then(verb_drop, space, noun_item),
    verb_exit,
    then(verb_go, space, direction),
    then(verb_put, space, noun_item, space, prep, noun),
    then(verb_hang, space, noun_item, space, chars('on', 'prep'), noun),
    then(verb_throw, space, noun_item),
    'command'
  );

  return command;
}




