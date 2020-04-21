import React, { Component, useState, useEffect }  from 'react';
import { AppRegistry, StyleSheet, View, ActivityIndicator, Text, FlatList } from 'react-native';
import Backgroud_slide from './components/slider';
import Eff from "./eff"
import { ListItem, CheckBox, Overlay, Rating, Button, Icon } from 'react-native-elements'
import {pair, cons} from './components/lib/func.js';
import {langs, contries} from "./eff";

const list = (() => {
  let list = []
  for (const v of Object.keys(langs)) {
    list.push({...(langs[v]), ...{id : v, flags : langs[v].contries.map(x => contries[x].emoji)}})
  }

  return list
}) ()

function OverSelector(props) {
  const {language, pair_botton} = props

  const [native, set_native] = useState(false)
  const [lang_level, set_level] = useState(1) 

  useEffect(() => {
    (native ? set_level(5) : set_level(1))
  }, [native])

  return (<Overlay isVisible={!!language}>
    
    <View style = {{flex : 1,  flexDirection : "column"}}>
      <View style = {{alignItems : "center"}}>
        <Text style = {{fontWeight : "bold"}}>
          {language.name}
        </Text>
      </View>

      <View style = {{flex : 0.1, justifyContent:'space-around', flexDirection : "row", flexWrap : "wrap"}}>
       {(language.flags).map(x =>
         (<Text key = {x}>
           {x}
          </Text>)
        )}
     </View>

      <View style = {{top : "30%"}}>
      <CheckBox title={"Are you a " + language.name + " native?"} onPress = {() => set_native(prev => !prev)} checked = {native} iconRight/>
      <Text style = {{fontWeight : "bold"}}>
        Rate your fluency :  
      </Text>
        <Rating
          type = "rocket"
          startingValue={lang_level}
          count={4}
          readonly = {native}
          defaultRating={3}
          onFinishRating = {x => {
            set_level(x)
         }}/>
      </View>

      <View style = {{flex : 1, top : "80%", flexDirection : "row", justifyContent: 'space-between', padding : 20}}>
        <Button onPress = {() => pair_botton.fst(native)(lang_level)} title = "Add Language"/>
        <Button onPress = {pair_botton.snd} title = "Cancel"/>
      </View>

     </View>
    </Overlay>)
}

export default function first_acess({route}) {

 const {State} = route.params

 const [language_state, set_language_state] = useState(
   (() => {
     let obj = {}
     for (const v of Object.keys(langs)) {
       obj[v] = {choosed : false}
    }
    return obj
   }) ()
 )

 const [state_current, set_current_state] = useState({current : null, store : []})

 const resetCurrentState = () => {
    set_current_state({...state_current, current : null})
 }

 const saveCurrentState = (native) => (level) => {
     set_current_state(prev => {
       set_language_state(rev => ({...rev, [state_current.current.id] : {choosed : true}}))
       return ({current : null, store : {...prev.store, [state_current.current.id] : {lang : prev.current.id, native : native, level : level}}})
      })
 }

 keyExtractor = (item, index) => index.toString()
 renderItem = ({ item }) => (
     <ListItem
       title={
         <View>
           <Text>
             {item.name + " (" + item.native +")"}
           </Text>
          <View style = {{left : "80%"}}>
           <CheckBox 
             checked={language_state[item.id].choosed}
             onPress = {() => {
               if (!language_state[item.id].choosed) {
                 set_current_state(prev => ({...prev, current : item}))
               } else {
                set_current_state(prev => {
                  set_language_state(rev => ({...rev, [item.id] : {choosed : false}}))
                  return ({current : null, store : {...prev.store, [item.id] : null}})
                 })
               }
             }}
           />
          </View>
         </View>
     }
       subtitle={(item.flags.slice(0, 3).toString()) + (item.flags.length > 3 ? " ..." : "")}
       bottomDivider
       key = {item.id}
   />
   )

   return (
    <View style>
      <View style = {{backgroundColor : "rgba(224, 21, 21, 0.2)"}}>
        <Text style = {{fontWeight : "bold"}}>
          Choose your native language or a learning language
        </Text>
      </View>

    <FlatList
      contentContainerStyle={{  zIndex: 1, overflow: "visible" }}
      keyExtractor={keyExtractor}
      data={list}
      renderItem={renderItem}
    />

    <View style = {{flex : 1, flexDirection : 'row', justifyContent : "space-between", position : 'absolute', top : "82%", left : "50%"}}>
    <Icon
     reverse
     name='restore'
     type='material-community'
     size = {35}
     color = "rgba(236, 54, 54, 0.8)"
     onPress = {() => {
       let v = {}
       for (const k of Object.keys(state_current.store)) {
         v[k] = {choosed : false};
       }

       set_language_state(prev => ({...prev, ...v}))
       set_current_state({current : null, store : []})
     }}
    />

   <Icon
     reverse
     name='arrow-circle-right'
     type='font-awesome'
     size = {35}
     color = "rgba(236, 54, 54, 0.8)"
     onPress = {() => {
        State.send_message(Eff.EDIT_LANGS_PROFILE) (state_current.store)
       }
     }
    />

    </View>

    {(!!state_current.current) ? 
     (<OverSelector language = {state_current.current} pair_botton = {pair (saveCurrentState)(resetCurrentState)} />) 
       : null}

    </View>
  )

}
