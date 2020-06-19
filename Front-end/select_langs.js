import React, { Component, useState, useEffect, useRef }  from 'react';
import { AppRegistry, StyleSheet, View, ActivityIndicator, Text, FlatList } from 'react-native';
import Backgroud_slide from './components/slider';
import Eff from "./eff"
import { ListItem, CheckBox, Overlay, Rating, Button, Icon } from 'react-native-elements'
import {pair, cons} from './components/lib/func.js';
import {langs, contries} from "./components/lib/lang_json";

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

 const {State, Data} = route.params

 const language_state = useRef(
   (() => {
     let obj = {}
     for (const v of Object.keys(langs)) {
       obj[v] = {choosed : false}
     }
     for (const v of Data) {
      obj[v.lang] = {choosed : true}
     }

    return obj
   }) ()
 )
 
const state_current = useRef({current : null, store : Data.reduce((x, y) => 
  {
    x[y.lang] = {lang : y.lang, native : y.native, level : y.level}
    return x
  }, new Object())})

const show_selector = useRef()

const set_current_state = new_state => {
  if (typeof(new_state) == "function") {
    state_current.current = new_state(state_current.current)
    return;
  }

  state_current.current = new_state
}

const get_state = () => state_current.current

 const resetCurrentState = () => {
    
    set_current_state(prev => {
      language_state.current[prev.current.id].choosed = false
      language_state.current[prev.current.id].func(false)
      return {...prev, current : null}
    })
    
    show_selector.current(false)
 }

 const saveCurrentState = (native) => (level) => {
     set_current_state(prev => {
      language_state.current[prev.current.id].choosed = true
      language_state.current[prev.current.id].func(true)
      return ({current : null, store : {...prev.store, [prev.current.id] : {lang : prev.current.id, native : native, level : level}}})
     })
     show_selector.current(false)
 }

 const Option_lang_component = props => {
   const {item} = props
 
   const [on, setActivation] = useState(language_state.current[item.id].choosed)
   language_state.current[item.id].func = setActivation

   return (
    <ListItem
      title={
        <View>
          <Text>
            {item.name + " (" + item.native +")"}
          </Text>
         <View style = {{left : "80%"}}>
          <CheckBox 
            checked={on}
            onPress = {() => {
              if (!language_state.current[item.id].choosed) {
                set_current_state(prev => ({...prev, current : item}))
                show_selector.current(true)
              } else {
               set_current_state(prev => {
                 return ({current : null, store : {...prev.store, [item.id] : null}})
                })
                setActivation(false)
                language_state.current[item.id].choosed = false
              }
            }}
          />
         </View>
        </View>
    }
      subtitle={(item.flags.slice(0, 3).toString()) + (item.flags.length > 3 ? " ..." : "")}
      bottomDivider
      key = {item.id}
  />)
 }

 const OverlaySelector = (props) => {

  const [show, set_show] = useState(false)
  props.reference.current = set_show

  useEffect(() => {console.log(show)}, [])
  if (show) {
    return (<OverSelector language = {get_state().current} pair_botton = {pair (saveCurrentState)(resetCurrentState)} />)
  }

  return null;
 }

 const keyExtractor = (item, index) => index.toString()
 const renderItem = ({ item }) => (
    <Option_lang_component item = {item}/>
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
       for (const k of Object.keys(get_state().store)) {
         language_state.current[k].func(false)
         language_state.current[k] = {choosed : false};
       }
       
       set_current_state({current : null, store : []})
     }}
    />

   <Icon
     reverse
     name='arrow-circle-right'
     type='font-awesome'
     size = {35}
     color = "rgba(236, 54, 54, 0.8)"
     onPress = {async () => {
       let rs = [...Object.entries(get_state().store)]
       rs.forEach(
         (value, index, array) => {
          array[index] = array[index][1]
         }
        ) 
        await State.send_message(Eff.EDIT_LANGS_PROFILE)  (rs) ()
       }
     }
    />

    </View>

    <OverlaySelector reference = {show_selector}/>

    </View>
  )

}
