import App from "./func"

import {
    Alert
} from 'react-native';
  
module.exports = {
  // Sockets effects
  socket_package : pack => timeout => {
      return App.immutable({pack : pack, timeout : timeout})
  },

  isOkay : x => !!x && x.okay, 

  timeout : socket => socket_info => continuation => (async () => {
    let aprov = false
    
    socket.on(socket_info.pack, function(){
      aprov = true;
    });
  
   await App.justWait (socket_info.timeout)

   return aprov ? continuation.next() : continuation.back()
   }) (),

   // Pure React-Componentes effects
  alert_msg : x => Alert.alert(x.title, x.msg,
    [
      {text: 'Ok'},
    ],
    {cancelable: false},
  )

}