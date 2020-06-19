
const {langs, contries} = require("./lang_json.js")

module.exports = {
  $ : (x, y) => _ => y(x(_)),
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
        check_null : x => !!x ? module.exports.Maybe.Just(x) : module.exports.Maybe.Nothing(),
        check_empty : x => !!x && x.length > 0 ? module.exports.Maybe.Just(x) : module.exports.Maybe.Nothing(),
        unsafe_fromJust : x => x.value,
  },

   unit : {I : 1},
   bind_seq : g => f => {g(); f(); return module.exports.unit},
   pair : x => y => module.exports.immutable ({fst : x, snd : y}),
   swap_pair : p => module.exports.immutable ({fst : p.snd, snd : p.fst}),
   justWait : time => {return new Promise(rev => {setTimeout(rev, time)})},
   continuation : x => y => {
       return App.immutable({next : x, back : y})
   },
   isOkay : xs => xs.length == 0 ? module.exports.Maybe.Just(xs) : module.exports.Maybe.Nothing(),

   cons : x => y => {
       let xs = x.push(y)
       return x
   },

   select : y => x => y.length <= 0 ? {} : {...module.exports.select(y.slice(1, y.length))(x), [y[0]] : x[y[0]]}, 

   unique_list : {
       new : R => ({relation : R, struct : module.exports.pair ({}) ([])}),
       insert : (structured, value) => ({...structured, 
        struct : module.exports.pair({...structured.struct.fst, [structured.relation(value)] : module.exports.Maybe.Just(structured.struct.snd.length)})
          (module.exports.cons(structured.struct.snd)(value))
        }),
        find : (structured, value) => 
          module.exports.Maybe.check_null(structured.struct.fst[structured.relation(value)]),
        insertAll : (structured, values) => 
          values.reduce((x, y) => module.exports.Maybe.match_optional (v => x)
           (() => module.exports.unique_list.insert(x, y)) 
           (module.exports.unique_list.find(x, y)), structured),
        empty : structured => module.exports.unique_list.new(structured.relation),
        getList : structured => structured.struct.snd,
        get_unsafe : (structured, value) => 
        structured.struct.snd[structured.struct.fst[structured.relation(value)].value]

   },
  

   certification : {
       
       Proposition : {
         isNonNullable : {check_func : (v) => true},
         isList : {check_func : (v) => Array.isArray(v)},
         isListNotEmpty : {check_func : (v) => Array.isArray(v) && v.length > 0},
         isInteger : {check_func : (v) => Number.isInteger(v)},
         isBool : {check_func : (v) => typeof(v) == "boolean"},
         isString : {check_func : (v) => typeof(v) == "string"},
         isValidString : {check_func : (v) => v.length >= 3 && v.length <= 40},
         isAvaliableLanguage : {check_func : (v) => !!langs[v]},
         isValidPaternSize : {check_func: v => v <= 4}
       },

       check : ls => data => ls.reduce((c, v) => { 
          const _ = module.exports
          return typeof(v.fst) == "string" ?
                    (data != null && data[v.fst] != null && v.snd.check_func(data[v.fst]) ? c : _.cons(c)(v)) :
                    (v.fst() != null && v.snd.check_func(v.fst()) ? c : _.cons(c)(v))
       }, [])

   }


}