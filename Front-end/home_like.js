import React, { Component, useState, useEffect, useRef, forwardRef, createRef}  from 'react';
import { Animated, FlatList, StyleSheet, View, Text, Image, Dimensions, Easing, TouchableOpacity, ActivityIndicator} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Icon, SearchBar } from 'react-native-elements'
import Eff from "./eff"
import {cons, pair, justWait, unique_list} from "./components/lib/func"

const AnimatedIcon = Animated.createAnimatedComponent(Icon);

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';
import { ceil } from 'react-native-reanimated';


/*
The Json input format
const list_ = [
  {
    topic : "XXXXXXXXXXXXX",
    likes : x,
    whoLikes : 
    [{name : "xxx", url : 'https://scontent.fipn4-1.fna.fbcdn.net/v/t1.0-9/13776046_1157832950947321_5266455840713287143_n.jpg?_nc_cat=107&_nc_sid=09cbfe&_nc_ohc=Z_j6X1F-XCQAX8rbjmX&_nc_ht=scontent.fipn4-1.fna&oh=2176552f3c86f3c38b7445b80e5c8f95&oe=5ECB814C'},
     {name : "xxx", url : 'https://scontent.fipn4-1.fna.fbcdn.net/v/t1.0-9/s960x960/75491730_2442553795780965_5540091440530456576_o.jpg?_nc_cat=108&_nc_sid=09cbfe&_nc_ohc=auH6qjp5tV0AX94RV04&_nc_ht=scontent.fipn4-1.fna&_nc_tp=7&oh=cc4e8614f33017215dfb6812c8aa25f7&oe=5ECC9931'},
     {name : "xxx", url : 'https://scontent.fipn4-1.fna.fbcdn.net/v/t1.0-9/93208850_2913929948645465_3569669983971573760_n.jpg?_nc_cat=106&_nc_sid=8bfeb9&_nc_ohc=z_nJLbrWXEEAX8_Ia1D&_nc_ht=scontent.fipn4-1.fna&oh=394738f913795c266e86b81db37a047f&oe=5ECAAE3A'}, 
     {name : "xxx", url : 'https://scontent.fipn4-1.fna.fbcdn.net/v/t1.0-9/s960x960/90125225_2860343817337412_6655355444980088832_o.jpg?_nc_cat=102&_nc_sid=8bfeb9&_nc_ohc=MRfnukhR6yoAX-rXBZb&_nc_ht=scontent.fipn4-1.fna&_nc_tp=7&oh=618bf068a0d125c09e075d9366227bca&oe=5ECC247D'}],
    liked : true
  },
]
*/

function Profiles(props) {
  const height_grid = (height/6)
  const width_grid = (width/3)

  function HeartLike(props) {
    const {status, reference} = props
    const on$ = on => on ? (width_grid/2)*(height_grid/2) * 0.02 : 0
    
    const [size] = useState(new Animated.Value(on$(status)));
 
    useEffect(() => {
     reference.current = ({on}) => Animated.spring(size, {
        toValue: on$(on), 
        speed : 8,
        bounciness : 0,
        useNativeDriver : false
      }).start()
    }, [])

    return (
    <AnimatedIcon
      name='heart-circle-outline'
      type='material-community'
      color='rgba(247, 70, 38, 0.9)'
      size = {size}
      />)

  }

  const {data, onPress, reference, likes_ref} = props

  return (
  <TouchableOpacity 
     style = {{height : height_grid, width_grid : width_grid, borderColor : "black", borderWidth : 1, alignItems : 'center', justifyContent : 'center'}}
     onPress = {() => {
       onPress(data)
     }}   
  >
    <View style = {{flex : 1, position : "absolute", zIndex : 2}}>
    <Text 
      style = 
      {{color : "white", fontWeight : "bold"}}>
      {data.topic}
    </Text>
    </View>
    
    <View style = {{position : "absolute"}}>
      <HeartLike status = {likes_ref[data.topic]} reference = {reference}/>
    </View>

    <View style = {{zIndex : 1, alignItems : 'center', justifyContent : 'center', opacity : 0.4, flexWrap : "wrap", margin : 1, height : height_grid, width : width_grid}}>
       {data.whoLikes.map((x, index) => 
      <View key = {index}>
        <Image
          style = {{height : height_grid/2, width : width_grid/2}}
          source={{
          uri: x.url,
         }}
        />
      
      </View>
      )
     }

    </View>
    </TouchableOpacity>
    )
}


const url_test = "https://cdn.business2community.com/wp-content/uploads/2017/08/blank-profile-picture-973460_640.png"

export default function Default({navigation, route}) {
 
  const {State, Data} = route.params
  const [search, set_text] = useState("")
  const [loading, set_load] = useState(true)
  const false_state = useRef(true)

  const animation_liked = useRef({})
  const like_status = useRef({})
  const scrolling_state = useRef(0)
  const scroll = useRef()
  const resetScroll = () => {
    scrolling_state.current = 0

  }
  const next_scroll = () => {scrolling_state.current++}
  const timer_search = useRef({})
  const set_timer_search = v => timer_search.current = v(timer_search.current)

  const [list, set_topics_list] = useState(unique_list.new(x => x.topic))

  const remove_unnecessary_spaces = text => {
    const half = x => pair(x.slice(0, x.length/2))(x.slice(x.length/2, x.length))
    const {fst, snd} = half(text)
    return fst[fst.length - 1] == " " && snd[0] == " " ?
       remove_unnecessary_spaces(fst.slice(0, fst.length - 1).concat(snd)) :  (fst.length <= 1 && snd.length <= 1) ? fst.concat(snd) : (remove_unnecessary_spaces (fst)).concat(remove_unnecessary_spaces(snd))
  }
  
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        await State.send_message(Eff.REQUEST_TOPICS_LIKE) ({search : ""}) ()}) ()
      let handlers = State.createHandlers(
        {"info_topics_likes" : (data) => { 
          console.log("a")
          const topics = (data.search != null && scrolling_state.current == 0 &&
             !(data.list.reduce((x, y) => x || y.topic == data.search.topic, false))
               ? [data.search].concat(data.list.filter(x => x.topic != data.search)) : data.list)
       
          topics.map(x => {
            like_status.current[x.topic] = x.liked
            animation_liked.current[x.topic] = createRef()
          })

          topics.map(value => {
             const {whoLikes} = value
             value.whoLikes = [null, null, null, null].map((v, index) => whoLikes[index] != null ? whoLikes[index] : {name : "unavailable", url : url_test})
           })
          
          set_topics_list(list => 
            unique_list.insertAll(list, topics))
          
          topics.length > 0 ? next_scroll() : {}

          set_load(false)
        },
        "user_liked_topic" : ({topic, liked}) => {
          // Handlers are disabled when the user changes the navigation, but note here, let's supose that a user send 3x response to like some
          //   topic and promptly switches to other screen, then all handlers are disabled, but note if he/she back again to the screen the
          //  handlers are ressuscited again, once the information can be different it may a memory leak, once animation_liked.current[topic] maybe cannot exists.
          (animation_liked.current[topic] != null &&
             animation_liked.current[topic].current != null) ? animation_liked.current[topic].current({on : liked}) : {};
          like_status.current[topic] = liked;
        }

      })

      return () => {
        State.kill_handlers(handlers)
        set_load(true)
        animation_liked.current = {}
        set_topics_list(prev => unique_list.empty(prev))
      };
    }, [])
  );

  const keyExtractor = (item, index) => item.topic

  const renderItem = ({item}) => 
    <Profiles data = {item} likes_ref = {like_status.current} key = {item.topic} reference = {animation_liked.current[item.topic]} onPress = {async (data) => 
        {
          State.send_message(Eff.REQUEST_LIKE_TOPIC)({topic : data.topic}) ()
        } //do something
      }/>
  
    return (
    <View style = {{height : "100%", width : "100%"}}>
      <SearchBar
        placeholder="Search your topic.."
        onChangeText={async text => {
          set_text(text)
          const _ = text[text.length - 1] == " " ? text.slice(0, text.length - 1) : text
          const sendToFuture = async () => {
            if (timer_search.current.waiting) {
              set_timer_search(prev => ({...prev, repeat : true}))
              return;
            }
            
            set_timer_search(prev => ({...prev, waiting : true}))
            await justWait(1000)
            if (timer_search.current.repeat) {
              set_timer_search(prev => ({...prev, waiting : false, repeat : false}))
              return sendToFuture()
            }

            set_timer_search(prev => ({...prev, waiting : false}))
            timer_search.current.actual()
            
            return;
          }

          set_timer_search(prev =>
             ({...prev, 
                actual : () => {
                  scroll.current.scrollToOffset({index : 0, animated : false});
                  set_topics_list(list => unique_list.empty(list));
                  resetScroll();
                  
                  State.send_message(Eff.REQUEST_TOPICS_LIKE) 
                  ({search : _.length >= 3 ? remove_unnecessary_spaces(_) : null, from : 0}) ();
             }
            }))

          !(_.length < 3 && false_state.current) ?
              sendToFuture()
               : {}
          
           if (text.length >= 3) {false_state.current = false; set_load(true)} else {false_state.current = true}  

        }}

        value={search}
        lightTheme = {true}
        platform = {"ios"}
        cancelButtonTitle = {"Clean"}
        inputStyle = {{color : search.length < 3 || search.length > 40 ? "red" : "black"}}
      />

      <FlatList
       keyExtractor={keyExtractor}
       data={unique_list.getList(list)}
       numColumns = {3}
       ref = {scroll}
       renderItem={renderItem}
       ___onEndReached = {() => {
          State.send_message(Eff.REQUEST_TOPICS_LIKE) ({search : search.length >= 3 ? remove_unnecessary_spaces(search) : null, from : scrolling_state.current}) ()
          set_load(true)
        }
       }
       onScroll = {({nativeEvent}) => {
        const reach_end = ({layoutMeasurement, contentOffset, contentSize}) => layoutMeasurement.height + contentOffset.y >= contentSize.height
        if (reach_end(nativeEvent)) {
         State.send_message(Eff.REQUEST_TOPICS_LIKE) ({search : search.length >= 3 ? remove_unnecessary_spaces(search) : null, from : scrolling_state.current}) ()
         set_load(true)
         }
       }
      }
      />
      <ActivityIndicator animating = {loading} size={60} color="rgba(54, 12, 151, 1)" style = {{position : "absolute", left : "40%", top : "60%"}}/>

    </View>
    )
}