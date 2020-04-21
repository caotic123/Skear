import React, { Component, useState }  from 'react';
import { AppRegistry, StyleSheet, View, Image, ImageBackground  } from 'react-native';
import { Container, Header, Content, Text, Button, Form, Item, Input, Label } from 'native-base';

export default function Home({navigator, route}) {
    return (
     <View style ={styles.container}>


     <Image
        style = {{height : 100, width : 200, left : '25%', top : '14%'}}
        source={require('./assets/arrow.png')}
      />
      <Image/>


     </View>
    )
}

const styles = StyleSheet.create({
  input : {
    top : '80%',
    backgroundColor : 'rgba(211, 207, 207, 0.2)',
    width : '90%',
    height : '15%'
  },

  container: {
    flex : 1,
    padding : 40,
    alignItems : 'center',
    justifyContent : 'space-between',
    height : '100%',
    width : '100%',
    backgroundColor : 'black'
  },

  container_login: {
    position : 'absolute',
    top : '50%',
    backgroundColor: 'rgba(211, 207, 207, 0.7)'
  },
});
