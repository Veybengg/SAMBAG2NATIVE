// components/TutorialModal.js

import React, { useEffect, useRef } from 'react';
import { Modal, View, Button, StyleSheet } from 'react-native';
import { Video } from 'expo-av';

const TutorialModal = ({ visible, onClose }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (visible && videoRef.current) {
      videoRef.current.playAsync();
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Video
            ref={videoRef}
            source={{ uri: 'https://path-to-your-tutorial-video.mp4' }}
            style={styles.video}
            useNativeControls
            resizeMode="contain"
            onPlaybackStatusUpdate={(status) => {
              if (status.didJustFinish) {
                onClose();  // Close modal when the video ends
              }
            }}
          />
          <Button title="Skip Tutorial" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: 300,
  },
});

export default TutorialModal;
