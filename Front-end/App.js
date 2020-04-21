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
import select_languages from './select_langs';
import LoadScreen from "./loadscreen"
import effect from "./components/lib/effects"
import CState from "./state"
import Eff from "./eff"

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
    queue : []
  }
}

const App: () => React$Node = () => {

   const [state, set_state] = useState(initial_state)
   const State = CState([state, set_state])
   useEffect(() => {
    for (const f of State.get_queue()) {
      f()
    }

    State.reset_queue()
  }, [state])

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
          component={select_languages}
          options = {{
            headerShown : false
          }}
        />
      
      </Stack.Navigator>
    </NavigationContainer>)
};

export default App;
