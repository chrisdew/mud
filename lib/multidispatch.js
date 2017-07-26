function popcnt(x) {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  x = (x + (x >> 4)) & 0x0F0F0F0F;
  x = x + (x >> 8);
  x = x + (x >> 16);
  return x & 0x0000003F;
}

function weigh(traits) {
  console.log('a', trait);
  var acc = 0;
  for (var p in traits) {
    var trait = traits[p];
    console.log('p', p, trait);
    acc += popcnt(trait);
  }
  return acc;
}

class Dispatcher {
 constructor() {
  this.next_trait = 1;
  this.registeredFns = []; // [{traits:[...], fn:..., weight:...}, ...]
 }

 registerFunction(traits, fn, extra_weight) {
   var weight = weigh(traits) + (!!extra_weight ? extra_weight : 0);
   for (var i in this.registeredFns) {
     if (weight === this.registeredFns[i].weight) {
       console.error("Duplicate weight error, traits: " + JSON.stringify(traits) + " conflict with " + JSON.stringify(this.registeredFns[i].traits) + " fn: " + this.registeredFns[i].fn);
       throw new Error("Duplicate weight error.");
     }
   }
   this.registeredFns.push({traits:traits, fn: fn, weight: weight});
   this.registeredFns.sort(function(a,b) {
     return b.weight - a.weight; // sort descending on weight
   });
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
