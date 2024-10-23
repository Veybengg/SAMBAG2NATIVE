import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View,Text, Dimensions } from 'react-native';
import { Video } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';

export default function Splashscreen() {
  const video = useRef(null);
  const navigation = useNavigation();
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    const playVideo = async () => {
      if (video.current) {
        await video.current.playAsync();
      }
    };

    playVideo();

    const timer = setTimeout(() => {
      navigation.navigate('Homescreen'); 
    }, 6000);

    return () => clearTimeout(timer); 
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Video
        ref={video}
        style={[styles.video, { width, height }]} 
        source={require("../assets/splash.mp4")}
        resizeMode="cover" 
        isLooping
        shouldPlay 
        useNativeControls={false} 
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

