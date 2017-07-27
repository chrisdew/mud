// inspired by http://www.eblong.com/zarf/essays/rule-based-if/

function getArgs(func) {
  // First match everything inside the function argument parens.
  var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];

  // Split the arguments string into an array comma delimited.
  return args.split(',').map(function(arg) {
    // Ensure no inline comments are parsed and trim the whitespace.
    return arg.replace(/\/\*.*\*\//, '').trim();
  }).filter(function(arg) {
    // Ensure no undefined values are added.
    return arg;
  });
}

class Dispatcher {
 constructor() {
 }

 registerFunction(traits, extra_weight) {
 }

 dispatch(args) {
 }

 addTrait(trait, parent) {
   //console.log('t', trait, parent);
  this[trait] = this.next_trait + (!!parent ? parent : 0);
  this.next_trait *= 2;
   //console.log('t2', trait, parent);
 }

 getFunctions(argob) {
   var ret = [];
   outer: for (var i in this.registeredFns) {
     var reg = this.registeredFns[i];
     var traits = reg.traits;
     var fn = reg.fn;
     console.log('gf', traits, fn, argob, reg.weight);
     for (var p in traits) {
       console.log('gf p', p);
       if (!argob[p]) continue outer;
       var calc = argob[p].traits & traits[p];
       console.log('gf calc', calc, traits[p]);
       if (calc !== traits[p]) continue outer;
     }
     console.log('gf push');
     ret.push(fn);
   }
   return ret;
 }

 getFunction(argob) {
  var fns = this.getFunctions(argob);
  if (fns.length > 0) return fns[0];
  return null;
 }

 dispatch(argob) {
  var fn = this.getFunction(argob);
  if (fn) return fn.exec(argob);
  throw new Error("Undispatched function.");
 }
}

exports.Dispatcher = Dispatcher;
exports.popcnt = popcnt;
exports.weigh = weigh;
