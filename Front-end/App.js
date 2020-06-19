import 'react-native-gesture-handler';

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  Alert,
  StatusBar,
  YellowBox,
} from 'react-native';

import {
  Header,
  LearnMoreLinks,
  Colors,
  DebugInstructions,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

import {Content, Form, Item, Input, Label } from 'native-base';
import {NavigationContainer, BaseRouter} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import { navigationRef } from './components/root_navigator';
import Home from './login';
import Select_languages from './select_langs';
import LoadScreen from "./loadscreen"
import Home_likes from "./home_like"
import match_selector from "./match"
import effect from "./components/lib/effects"
import CState from "./state"
import Eff from "./eff"
import Bar from "./bar"

import * as Root_Navigator from './components/root_navigator';

const Stack = createStackNavigator();

YellowBox.ignoreWarnings([
  'Non-serializable values were found in the navigation state',
]);  // Remember our status has hook-functions that primaly changes that component see the problem here
     //  :  https://reactnavigation.org/docs/troubleshooting/#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state


YellowBox.ignoreWarnings([
      'Unrecognized WebSocket connection option(s) `agent`, `perMessageDeflate`, `pfx`, `key`, `passphrase`, `cert`, `ca`, `ciphers`, `rejectUnauthorized`. Did you mean to put these under `headers`?'
  ]);

function checkServer(socket, sucess) {
  return effect.timeout(socket) (effect.socket_package("ping")(1000*10)) (effect.continuation(sucess)(noConnectionAlert));
}

const initial_state = {
  effects : {
    [Eff.LOAD_EFFECT_STATE] : {value : {actived : false}},
    [Eff.Login] : {} ,
    queue : [],
    bar : {status : {actived : false, interactable : false}, handlers : {
      home : (State) => Root_Navigator.navigate("matchs_selector", {State : State}),
      likes : (State) => Root_Navigator.navigate("home_like", {State : State}),
      chat : (State) => Root_Navigator.navigate("sim", {State : State})
    }}
  }
}

function stand(State) {
  State.on("connect", () => {
    State.on("login_sucess", async () => {
   //    remember to send a message if login isn't successful
      await State.send_message(Eff.SUCESS_LOGIN)({})
      await State.send_message(Eff.REQUEST_HOME_PAGE)({}) ()
      State.set_status_bar({actived : true})
    })

    State.on("first_acess", async ({data}) => {
      await State.send_message(Eff.LOAD_EFFECT_STATE) (Data => ({value : {actived : false}}))
      State.set_status_bar({interactable : false})
      State.send_queue(() => Root_Navigator.navigate("select_languages", {State : State, Data : data}))
    })

    State.on("home_like", async () => {
      await State.send_message(Eff.LOAD_EFFECT_STATE) (Data => ({value : {actived : false}}))
      State.set_status_bar({interactable : true})
      State.send_queue(async () => {
        Root_Navigator.navigate("home_like", {State : State, Data : {}})
      })
    })
  })
}


const App: () => React$Node = () => {

   const [state, set_state] = useState(initial_state)
   const State = CState([state, set_state])
   const [socket] = useState() 

   useEffect(() => {
    for (const f of State.get_queue()) {
      f()
    }

    State.reset_queue()
  }, [state])

  useEffect(() => {
    (async () => {
      stand(State)
    })()
  }, [socket])

   if (State.get(Eff.LOAD_EFFECT_STATE)) {
    return (<View><LoadScreen/></View>)
   }

    return (
      <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          initialParams = {
            {State : State}
          }
          component={Home}
          options = {{
            headerShown : false
          }}
        />
        <Stack.Screen
          name="select_languages"
          component={Select_languages}
          options = {{
            headerShown : false
          }}
        />
        <Stack.Screen
          name="home_like"
          component={Home_likes}
          options = {{
            headerShown : false
          }}
        />
        <Stack.Screen
          name="matchs_selector"
          component={match_selector}
          options = {{
            headerShown : false
          }}
        />
      </Stack.Navigator>
      <Bar State = {State}/>
    </NavigationContainer>)
};

export default App;
