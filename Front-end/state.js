
import Eff from "./eff"
import Protocols from "./protocols"
import AsyncStorage from '@react-native-community/async-storage';
import io from 'socket.io-client';

const socket = io("http://192.168.1.101:8080")
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

const getUser = async () => {
  const user = JSON.parse(await AsyncStorage.getItem('@user'))
  return {...user.user, token : user.idToken}
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
                   return async () => protocol.send_info_langs(await getUser())(v)
                 }
               case (Eff.REQUEST_HOME_PAGE)
               : {
                  return async () => protocol.request_home_page(await getUser())(v) 
                 }
               case (Eff.REQUEST_TOPICS_LIKE) 
               : {
                  return async () => protocol.request_topics_like(await getUser())(v) 
                 }
               case (Eff.REQUEST_LIKE_TOPIC)
               : {
                 return async () => protocol.request_like_topic(await getUser())(v) 
                 }
                case (Eff.REQUEST_PARTNERS)
                : {
                  return async () => protocol.request_partners(await getUser())(v) 
                  }
                case (Eff.SEND_LIKE) 
                : {
                  return new Promise(async resolve => {protocol.request_like(await getUser())(v); resolve()})
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

    on : (path, f) => {socket.on(path, f)},
    off : (path) => {socket.off(path)},

    createHandlers : (obj_handler) => {
      let responser = []
      for (const v of Object.entries(obj_handler)) {
        const [id, effect] = v
        responser.push(id)
        module.exports([state, set]).on(id, ({data}) => effect(data))
      }

      return responser
    },

    kill_handlers : (responser) => {
      responser.map(x => module.exports([state, set]).off(x))
    },

    set_bar : (status, handlers) => {
      state.effects.bar.status = status
      state.effects.bar.handlers = handlers
    },
    set_status_bar : (status) =>  state.effects.bar.status = {...module.exports([state, set]).getBarStatus(), ...status},
    getBarStatus : () => state.effects.bar.status,
    getBarHandlers : () => state.effects.bar.handlers


})