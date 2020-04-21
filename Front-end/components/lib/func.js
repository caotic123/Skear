
module.exports = {
  immutable : obj => Object.assign(obj),
  Maybe : {
        Just: (x) => {
            let try_ = {
                empty: false,
                value: x
            }
            return try_
        },
    
        Nothing: (optinal_msg = '') => {
            let try_ = {
                empty: true,
                msg_error: optinal_msg
            }
            return try_
        },
    
        match_optional : f => fx => x => x.empty ? fx(x.msg_error) : f(x.value),
        bind: (x, f, op_msg = '') => module.exports.Maybe.match_optional(f, m => Maybe.Nothing(m), x),
        check_null : x => !!x ? module.exports.Maybe.Just(x) : module.exports.Maybe.Nothing()
   },

   unit : {I : 1},
   bind_seq : g => f => {g(); f(); return module.exports.unit},
   pair : x => y => module.exports.immutable ({fst : x, snd : y}),
   swap_pair : p => module.exports.immutable ({fst : p.snd, snd : p.fst}),
   justWait : time => {return new Promise(rev => {setTimeout(rev, time)})},
   continuation : x => y => {
       return App.immutable({next : x, back : y})
   },
   bind_xs : x => f => f1 => x.length > 0 ? f(module.exports.immutable({value : x[0]})) : f1(),
   cons : x => y => {
       let xs = x.push(y)
       return x
   },


}