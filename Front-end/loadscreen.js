import React, { Component, useState }  from 'react';
import { AppRegistry, StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import Backgroud_slide from './components/slider';
import Eff from "./eff"

export default function Home({navigator, route}) {
    return (
     <View style ={styles.container}>
       <Backgroud_slide images= {Eff.images}/>
       <View style ={styles.view_loading}>
       <Text style = {{color : 'white'}}>
         Please, wait us :)
       </Text>
       <ActivityIndicator size={60} color="rgba(200, 40, 30, 0.8)" style = {styles.load}/>
       </View>
     </View>
    )
}

const styles = StyleSheet.create({
  container: {
    height : '100%',
    width : '100%',
  },
  view_loading : {
    position : 'absolute',
    alignItems : 'center',
    justifyContent : 'center',
    top : "26%",
    height : '100%',
    width : '100%'
  },
  load : {
    top : "2%"
  }

});
