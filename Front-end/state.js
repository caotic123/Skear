
import Eff from "./eff"
import Protocols from "./protocols"
import AsyncStorage from '@react-native-community/async-storage';
import io from 'socket.io-client';

const socket = io("http://192.168.1.105:8080")
const protocol = Protocols(socket)

const unique_state_effects = state => id => v => {
    let cpy = {... state}
    cpy.effects[id] = v;
    return cpy;
}

const send_msg = v => {
  Protocols.request_login(socket)(v)
}

const to_queue = state => f => {
  let cpy = {... state}
  cpy.effects.queue.push(f)
  return cpy;
}

const set_state = set => f => {
  return new Promise (rev => 
    set(prev => {rev(); return (f (prev))}
    )
  )
}

module.exports = ([state, set]) => ({
   
    initial_state : () => useState(state),
    send_message : id => v => {
        switch(id) {
            case (Eff.LOAD_EFFECT_STATE)
              : return set_state(set)(prev => unique_state_effects(prev)(Eff.LOAD_EFFECT_STATE)(v(prev)))      
              case (Eff.LOGIN)
              :  
                {
                  protocol.request_login(v)
                  return AsyncStorage.setItem('@user', JSON.stringify(v))
                }
              case (Eff.SUCESS_LOGIN)
              :    return AsyncStorage.setItem('@logged', "true")
              case (Eff.LOAD_NAVIGATION)
               : return set_state(set)(prev => set_navigator(prev)(v(prev.data)))
               case (Eff.EDIT_LANGS_PROFILE)
               : {
                   protocol.send_info_langs(v)
                 }
             default : 
        }
    },

    send_queue : f => to_queue(state)(f),
    get_queue : () => state.effects.queue,
    reset_queue : () => set(prev => {
      prev.effects.queue = []; 
      return prev;
    }),

    get : id => {
      switch(id) {
        case (Eff.LOAD_EFFECT_STATE)
          : return state.effects[id].value.actived
      }
    },

    on : (path, f) => {socket.on(path, f)}

})