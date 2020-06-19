import React, { Component, useState } from 'react';
import { AppRegistry, View, Text, Dimensions } from 'react-native';
import { Icon } from 'react-native-elements'
import Eff from "./eff"

export default function Bar(props) {
  const { State } = props
  const status_ref = () => State.getBarStatus()
  const handlers_ref = () => State.getBarHandlers()

  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;
  const length = height * 0.05
  const size = length * 0.4

  if (!status_ref().actived) {
    return null;
  }

  return (
    <View style={{ height: length, width: width, top: height - length, backgroundColor: "rgba(254, 251, 251, 0.6)", position: "absolute" }}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 15 }}>
        <Icon
          name='home'
          type='antdesign'
          color='rgba(0, 0, 0, 0.6)'
          size={size}
          onPress={() => status_ref().interactable ? handlers_ref().home(State) : {}}
          reverse
        />

        <Icon
          name='image-filter-none'
          type='material-community'
          color='rgba(0, 0, 0, 0.6)'
          size={size}
          onPress={() => status_ref().interactable ? handlers_ref().likes(State) : {}}
          reverse
        />

        <Icon
          name='message-circle'
          type='feather'
          color='rgba(0, 0, 0, 0.6)'
          size={size}
          onPress={() => status_ref().interactable ? handlers_ref().chat(State) : {}}
          reverse
        />

      </View>

    </View>
  )
}