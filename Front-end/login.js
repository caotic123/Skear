import React, { Component, useState, useEffect }  from 'react';
import { AppRegistry, StyleSheet, View, Dimensions, ImageBackground  } from 'react-native';
import { Container, Header, Content, Text, Button, Form, Item, Input, Label } from 'native-base';
import { SocialIcon } from 'react-native-elements'
import Effect from "./components/lib/effects"
import {Maybe, immutable} from "./components/lib/func"
import Backgroud_slide from './components/slider';
import Eff from "./eff"

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';

const noConnectionAlert = () => alert_msg(effect.immutable({msg : "Seems you don't have connection", title : "Internet Connection"}))

async function login({navigation, route}, dev = undefined) {
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

  if (dev == null) {
    await GoogleSignin.hasPlayServices();
    let x = await signIn()
    Maybe.match_optional(
      async x => {
       await State.send_message(Eff.LOAD_EFFECT_STATE) (Data => ({value : {actived : true}}))
       await State.send_message(Eff.LOGIN) (x)
      })
    (y => {}) // Just stay in home screen
    (x)
  } else {
    await State.send_message(Eff.LOAD_EFFECT_STATE) (Data => ({value : {actived : true}}))
    await State.send_message(Eff.LOGIN) (dev)
  }

}

export default function Home({navigation, route}) {
  const {State} = route.params

  GoogleSignin.configure({
    webClientId : "967694831382-dp9j71kr5gkun6hp6f763v4a4mst7f42.apps.googleusercontent.com"
  })

  const ids = ["7bd61756-20d3-4f54-bad7-1f285bf805d1",
                "2960e56c-209c-43a2-85ce-24c4077d0482", 
                "337a8939-bf70-4397-905e-07c79f028ea2",
                "4480bf9c-ccd8-4a0e-958f-2cd2dce560b0",
                "dbfda8d7-397c-47d3-a67d-8db47e08198d", 
                "e7a7ce32-74b1-4fb6-a7b0-365602a19c5a",
                "44204a85-3461-429e-9f22-865864657e0b",
                "a49561fd-a5cd-4358-88fe-641b5af4d24b",
                "d01aecfb-b56a-4a95-8721-1416645c1f16"
               ]
   // "f61182ce-3f35-4548-8000-ea11942059f7"
  const id = ids[ids.length-1]

  const login_request = () => login({navigation, route}, {user : {id : id}, idToken : id})

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
           <SocialIcon type='google' style = {{width : "90%"}} onPress = {login_request}/>
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
