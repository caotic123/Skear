import React, { Component, useState, useEffect, useRef, forwardRef, createRef } from 'react';
import { Animated, View, Text, Image, Easing, ImageBackground, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { justWait, unique_list, Maybe, pair, cons } from "./components/lib/func"
import {
  PanGestureHandler, State
} from 'react-native-gesture-handler';
import { Icon } from 'react-native-elements'
const AnimatedIcon = Animated.createAnimatedComponent(Icon);
import Eff from "./eff"

const url_profile =
  [
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1000&q=80',
    'https://img.quizur.com/f/img5de0966174a627.99172593.png?lastEdited=1574999655',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcTMfuJeZEEniu-wLYUa3eQ_8h7-lWIRGDYmGvOV5X02fiZZKofG&usqp=CAU'
  ]

const width = Dimensions.get('window').width;
const height = Dimensions.get('window').height;

export default function Default({ navigation, route }) {

  const { State } = route.params
  const profiles_display = 3
  const { sizeHeight, sizeWidth, pureMargin } = { sizeHeight: height * 0.6, sizeWidth: width * 0.8, pureMargin: 1 }

  const profiles_position = useRef()
  const count_animation = useRef(false)

  const [scroll_] = useState((() => {
    let v = {}
    profiles_position.current = ({ posI: [], animate: [] })
    for (let i = 0; i <= profiles_display - 1; i++) {
      const k = sizeWidth * ((1 / profiles_display) * (i + 1))
      profiles_position.current.posI.push(k)
      v[k] = ({
        top: new Animated.Value(0),
        left: new Animated.Value(k - sizeWidth * (1 / profiles_display)),
        icon: { up: new Animated.Value(0), down: new Animated.Value(0) },
      })
    }
    return v;
  })());


  const State_Profile = {
    Loading: 1,
    Actived: 2,
    Desactived: 3
  }

  const profiles = useRef((() => {
    let v = {}
    for (let i = 0; i <= profiles_display - 1; i++) {
      v[profiles_position.current.posI[i]] = { status: State_Profile.Loading }
    }
    return v
  })())

  const set_profiles = f => {
    profiles.current = f(profiles.current)

    profiles_position.current.posI.map(x => {
      profiles.current[x].update()
    })

  }

  useFocusEffect(
    React.useCallback(() => {
      State.send_message(Eff.REQUEST_PARTNERS)({ size: profiles_display, avoid : [] })()
      let handlers = State.createHandlers({
        "user_partners": ({ partners }) => {
          profiles_position.current.posI.map((pos, i) => {
            Maybe.match_optional(() => {
              const { id, name, photo } = partners[i]
              set_profiles(prev => ({
                ...prev, [pos] :
                  {...prev[pos], status: State_Profile.Actived, id: id, name: name, backgroud: photo }
              }
              ))
              
            })(() => {
              set_profiles(prev => ({
                ...prev, [pos] : {...(prev[pos].status == State_Profile.Loading ? {status : State_Profile.Desactived} : prev[pos])}
              }))

            })(Maybe.check_null(partners[i]))

          })
        }
      })

      return () => {
        profiles_position.current.posI.map((pos, i) => {
          set_profiles(prev => ({
            ...prev, [pos] : {status : State_Profile.Loading}}))
        })
        State.kill_handlers(handlers)
      };

    }, []))

  const timer_search = useRef({ unique: unique_list.new(x => x.unique_id) })
  const set_timer_search = v => timer_search.current = v(timer_search.current)
  const sendToFuture = async () => {
    if (timer_search.current.waiting) {
      set_timer_search(prev => ({ ...prev, repeat: true }))
      return;
    }

    set_timer_search(prev => ({ ...prev, waiting: true }))
    await justWait(100)

    if (timer_search.current.repeat) {
      set_timer_search(prev => ({ ...prev, waiting: false, repeat: false }))
      return sendToFuture()
    }

    set_timer_search(prev => ({ ...prev, waiting: false }))
    timer_search.current.actual()
    return;
  }

  const Profile_GRID = (props) => {
    
    const [state, set_state] = useState(profiles.current[props.animation_id])

    profiles.current[props.animation_id].update = () => set_state(profiles.current[props.animation_id])

    props.interface[props.animation_id] = dir => (to_value) => pair_ => {

      const shift_profiles = () => {
        let m = { onShift: [], onFinish: [] }
        const take = xs => x => R => xs.length <= 0 ? [] :
          R(xs[0])(x) ? cons(take(xs.slice(1, xs.length))(x)(R))(xs[0]) :
            take(xs.slice(1, xs.length))(x)(R)
        take(profiles_position.current.posI)(props.animation_id)(x => y => x < y).map((ind, _) => {
          const k = take(profiles_position.current.posI)(ind)(x => y => x > y)

          m.onShift.push(Animated.timing(scroll_[ind].left, {
            toValue: scroll_[k[k.length - 1]].left._value,
            duration: 600,
            useNativeDriver: false
          }))

          const {fst, snd} = pair(scroll_[ind])(profiles.current[ind])
          m.onFinish.push(() => {
            scroll_[k[k.length - 1]] = fst
            profiles.current[k[k.length - 1]] = snd
          })


        })

        return m;
      }

      const direction = dir < 0 ? scroll_[props.animation_id].icon.up : scroll_[props.animation_id].icon.down
      const { onShift, onFinish } = shift_profiles()
      if (count_animation.current) { pair_.snd(); return; }
      count_animation.current = true;
      Animated.parallel([
        Animated.timing(scroll_[props.animation_id].top, {
          toValue: to_value,
          duration: 600,
          useNativeDriver: false
        }),
        Animated.spring(direction, {
          toValue: ((sizeWidth - (pureMargin * 2)) * 0.25 * sizeHeight) * 0.0024,
          speed: 2,
          bounciness: 8,
          useNativeDriver: false
        })].concat(onShift)).start(() => {
          scroll_[props.animation_id].top.setValue(0);
          scroll_[props.animation_id].left.setValue(0);
          scroll_[profiles_position.current.posI[0]] = scroll_[props.animation_id]
          profiles.current[profiles_position.current.posI[0]] = {...profiles.current[profiles_position.current.posI[0]], status : State_Profile.Loading}
          profiles.current[profiles_position.current.posI[0]].update()

          onFinish.map(x => x())
          direction.setValue(0);

  //        set_profiles(prev => {
    //        let obj = {...prev, [props.animation_id] : {status : State_Profile.Loading}}
      //      
        //    return obj
          //})
      

          pair_.fst(props.animation_id);
          count_animation.current = false;

        })
    }

    const Desactived_profile = () => {
      switch (state.status) {
        case State_Profile.Desactived :
          return (<View style={{ position: "absolute", top: "40%", alignItems: "center", justifyContent: "center" }}>
            <AnimatedIcon
              name='emoji-sad'
              type='entypo'
              color='rgba(166, 7, 12, 0.4)'
              size={((sizeWidth - (pureMargin * 2)) * 0.25 * sizeHeight) * 0.0024}
            />

            <Text style={{ left: "20%" }}>
              No more peoples
          </Text>
          </View>)
        case State_Profile.Loading : 
          return (<ActivityIndicator 
            size={((sizeWidth - (pureMargin * 2)) * 0.25 * sizeHeight) * 0.0024}
            style = {{position : "absolute", top : "40%"}}
            color="rgba(200, 40, 30, 0.8)"/>)

        case State_Profile.Actived :
          return null
      }
    }

    return (<Animated.View key={props.animation_id} style={{ width: (sizeWidth - (pureMargin * 2)) * (1 / profiles_display), left: scroll_[props.animation_id].left, alignItems: "center", height: sizeHeight, top: scroll_[props.animation_id].top, position: "absolute" }}>
      <Image source={{ uri: state.status == State_Profile.Actived ? state.backgroud : null }} key={props.item} style={{
        borderWidth: 0.6,
        borderColor: "white",
        zIndex: 0,
        width: "100%",
        height: "100%"
      }} />

      <AnimatedIcon
        name='heart'
        type='material-community'
        color='rgba(166, 7, 12, 0.4)'
        size={scroll_[props.animation_id].icon.up}
        containerStyle={{ position: "absolute", top: "40%" }}
      />

      <AnimatedIcon
        name='md-heart-dislike'
        type='ionicon'
        color='rgba(166, 7, 12, 0.4)'
        size={scroll_[props.animation_id].icon.down}
        containerStyle={{ position: "absolute", top: "40%" }}
      />

      <Desactived_profile />

    </Animated.View>)
  }


  const search_middle_values = values => value => {
    const half = values => pair(values.slice(0, values.length / 2))(values.slice(values.length / 2, values.length))

    const byIdentity = ([fst, snd]) => fst != null ? fst : snd != null ? snd : 0

    const { fst, snd } = half(values)
    const biggerHalf = value <= fst[fst.length - 1] ? fst : snd

    const [maxFst, minSnd] = [
      fst[fst.length - 1],
      snd[0]
    ]

    if (fst.length <= 0 || snd.lenght <= 0) {
      const v = byIdentity([maxFst, minSnd])
      return pair(v)(v)
    }

    return maxFst <= value && minSnd >= value ?
      pair(fst[fst.length - 1])(snd[0]) : search_middle_values(biggerHalf)(value)
  }


  return (
    <View style={{ height: "100%", justifyContent: "center", alignItems: "center" }}>

      <PanGestureHandler
        onGestureEvent={async (obj) => {

          const { nativeEvent } = obj
          const effectN = Math.round(width / nativeEvent.x)
          const moreLess = ({ fst, snd }) => x => Math.max(fst, snd)
          
          const coord = moreLess(search_middle_values(profiles_position.current.posI)(nativeEvent.x))(nativeEvent.x)
          if (profiles.current[coord].status != State_Profile.Actived) {
            return;
          }

          set_timer_search(prev => ({
            ...prev,
            unique: unique_list.insertAll(prev.unique, [({ unique_id: "first_tooch", value: nativeEvent.y })]),
            actual_movimentation: nativeEvent.x,
            actual: () => {
              set_timer_search(prev => {
                const { value } = unique_list.get_unsafe(prev.unique, { unique_id: "first_tooch" })
                const direction = Math.sign(nativeEvent.y - value)
                const _value = (sizeHeight + height) / (2 * direction)
                profiles_position.current.animate[coord](direction)(_value)(pair(
                  async (x) => {
                    const {id} = profiles.current[x]
                    await State.send_message(Eff.SEND_LIKE) ({partner : id})
                 
                    State.send_message(Eff.REQUEST_PARTNERS)({ size: 1, avoid : Object.entries(profiles.current).
                      filter(([_ , x]) => x.status == State_Profile.Actived && x.id != id).map(([_, {id}]) => id)})()
                    
                   }
                )(
                  () => { }
                ))
                return { unique: unique_list.empty(prev.unique) }
              })

            }
          }))

          await sendToFuture()

        }}

      >
        <View style={{
          position: "absolute", zIndex: 2, width: sizeWidth, height: sizeHeight, borderWidth: pureMargin, backgroundColor : "rgba(176, 176, 176, 0.2)",
        }}>
          {Object.entries(scroll_).map(([x, _]) => <Profile_GRID key={x} interface={profiles_position.current.animate} animation_id={x} />)}
        </View>



      </PanGestureHandler>
    </View>
  )
}