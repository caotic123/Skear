import {bind_seq , pair, swap_pair, unit} from './lib/func.js';
import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, ImageBackground, StyleSheet, Dimensions } from 'react-native';

function useInterval(callback, delay) {
  const savedCallback = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    let id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}

export default function Backgroud_slide (props) {
  const width = Dimensions.get('window').width;
  const height = Dimensions.get('window').height;
  const [position] = useState([new Animated.Value(width), new Animated.Value(0)])
  const callback = useRef();
  const [pair_I, setPair] = useState(pair(0)(1))

  const try_non_seq_random = x => y =>
  {
      const r = (Math.floor (Math.random()* y))
      return (y <= 1) ? x : (r == x) ?
            try_non_seq_random (x) (y) : r
  }

  const [image_choosen, setImageIndex] = (() => {
    let n = (Math.floor (Math.random()* props.images.length))
    let n1 = try_non_seq_random (n) (props.images.length)
    return useState ([n, n1])
  }) ()
  

 const effects = [(pair(0) (-width)), (pair(width)(0))]
 const speed = [1000, 900]
 useEffect(() => {
   callback.current = p => 
    Animated.parallel([
      Animated.timing(position[0], {
        toValue: effects[p.fst].fst,
        duration : speed[1-p.fst],
        useNativeDriver: false
      }),
    Animated.timing(position[1], {
      toValue: effects[p.fst].snd,
      duration : speed[p.fst],
      useNativeDriver: false
    })
     ]).start(() => {
      setImageIndex((prev => {
        let n = [prev[0], prev[1]]
        n[p.snd] = try_non_seq_random (prev[p.fst]) (props.images.length)
        return n;
      }))})
  }, []) 

  useInterval(() => {
    callback.current(pair_I)
    setPair(prev => swap_pair(pair_I))
  }, 1000*10)
  

    return (
    
    <View style={{height : '100%'}}>

      <Animated.View style={{position : 'absolute', height : '100%', width : width, top : 0, left : position[0]}}>
        <ImageBackground source={props.images[image_choosen[0]]} style={{width: '100%', height: '100%'}} > 
        </ImageBackground>
      </Animated.View>

      <Animated.View style={{position : 'absolute', height : '100%', width : width, top : 0, left : position[1]}}>
        <ImageBackground source={props.images[image_choosen[1]]} style={{width: '100%', height: '100%'}} > 
        </ImageBackground>
      </Animated.View>

    </View>
  )
}
