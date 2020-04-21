import React, { Component, useState, useEffect }  from 'react';
import { AppRegistry, StyleSheet, View, Dimensions, ImageBackground  } from 'react-native';
import { Container, Header, Content, Text, Button, Form, Item, Input, Label } from 'native-base';
import { SocialIcon } from 'react-native-elements'
import Effect from "./components/lib/effects"
import {Maybe, immutable} from "./components/lib/func"
import Backgroud_slide from './components/slider';
import * as Root_Navigator from './components/root_navigator';
import Eff from "./eff"

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';

const noConnectionAlert = () => alert_msg(effect.immutable({msg : "Seems you don't have connection", title : "Internet Connection"}))

async function login({navigation, route}) {
  const {State} = route.params
  let signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn()
      return (Maybe.Just(userInfo))
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Effect.alert_msg(immutable({title : "Signin Cancelled", msg : "Please continue with your google account\n"}))
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Effect.alert_msg(immutable({title : "Unkown Error", msg : "Please continue with your google account\n"}))
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Effect.alert_msg(immutable({title : "Signin Cancelled", msg : "Please install the google play services and continue the login"}))
      } else {
        Effect.alert_msg(immutable({title : "Unkown Error", msg : "Please continue with your google account\n"}))
      }
      return Maybe.Nothing();
    }
  };
  await GoogleSignin.hasPlayServices();
  let x = await signIn()
  Maybe.match_optional(
    async x => {
     console.log(x)
     await State.send_message(Eff.LOAD_EFFECT_STATE) (Data => ({value : {actived : true}}))
     await State.send_message(Eff.LOGIN) (x)
    })
    (y => {}) // Just stay in home screen
    (x)

}

function stand(State) {
  State.on("connect", () => {
    State.on("login_sucess", async () => {
   //    remember to send a message if login isn't successful
      await State.send_message(Eff.SUCESS_LOGIN)({})
    })

    State.on("first_acess", async () => {
      console.log("FIRST ACESS")
      await State.send_message(Eff.LOAD_EFFECT_STATE) (Data => ({value : {actived : false}}))
      State.send_queue(() => Root_Navigator.navigate("select_languages", {State : State}))
 
    })

  })
}

export default function Home({navigation, route}) {
  const {State} = route.params
  const [socket] = useState() 
 
  useEffect(() => {
    (async () => {
      stand(State)
    })()
  }, [socket])

  GoogleSignin.configure({
    webClientId : "967694831382-dp9j71kr5gkun6hp6f763v4a4mst7f42.apps.googleusercontent.com"
  })

    return (
    <View>
      <Backgroud_slide images = {Eff.images}/>
      <View style ={styles.container}>
        <Text style = {styles.logo}>
          Skear
         </Text>
         <View style = {styles.container_login}>
           <Text style = {{color : "white", fontWeight : "bold"}}>
             Continue with your google account :)
            </Text>
           <SocialIcon type='google' style = {{width : "90%"}} onPress = {() => login({navigation, route})}/>
         </View>
       </View>  
    </View>
    )
}

const styles = StyleSheet.create({
  logo : {
    top : '30%',
    position : 'absolute'
  },

  container: {
    alignItems : 'center',
    justifyContent : 'center',
    position: 'absolute',
    height : '100%',
    width : '100%',
    position : 'absolute'
  },

  container_login: {
    position : 'absolute',
    top : '70%',
    alignItems : 'center',
    justifyContent : 'center',
  },
});
