// Homescreen.js
import { StatusBar } from 'expo-status-bar';
import { Video } from 'expo-av';
import { Text, View, Image, ImageBackground, TouchableOpacity, Modal, Button, TextInput, Alert, PanResponder, ActivityIndicator, Platform } from 'react-native'; // Import Platform
import React, { Component } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import uuid from 'react-native-uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import tw from 'twrnc'; 
import { database } from '../Backend/firebaseConfig'; 
import { ref, get, set } from 'firebase/database';
import * as Location from 'expo-location'; // Location functionality
import TermsAndConditionsModal from './TermsAndConditionsModal';

const MAX_SUBMISSIONS = 10; // Maximum submissions allowed

// Function to get or generate a device ID (same on both platforms)
const getDeviceId = async () => {
  try {
    let deviceId = await AsyncStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = uuid.v4(); // Generate a new UUID if one doesn't exist
      await AsyncStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error retrieving device ID:', error);
    throw new Error('Unable to retrieve device ID');
  }
};

export default class Homescreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showTutorial: false,
      modalVisible: false,
      typeModalVisible: false,
      developerModalVisible: false,
      currentDeveloper: 0,
      avatarSource: null,
      isImageSelected: false,
      browseFilesModalVisible: false,
      fullScreenModalVisible: false,
      successModalVisible: false,
      name: '',         
      contact: '',  
      types: [],   
      type: '',
      otherType: '', 
      showOtherInput: false,
      isSubmitting: false,
      limitReachedModalVisible: false,
      remainingSubmissions: 0,
      termsModalVisible: false,
    };


    this.developers = [
      { id: 1, name: 'Jhun Paul Ceniza', role:'App & Arduino Developer', image: require('../assets/3.png'), description: '2nd Year BSIT, Southwestern University PHINMA' },
      { id: 2, name: 'Harvey De Gracia', role: 'Web Developer', image: require('../assets/4.png'), description: '2nd Year BSIT, Southwestern University PHINMA' },
      { id: 3, name: 'Aldrin Amantillo', role: 'Project Manager', image: require('../assets/2.png'), description: '2nd Year BSIT, Southwestern University PHINMA' },
      { id: 4, name: 'Hassein Lei Bate', role: 'UI/UX Designer', image: require('../assets/1.png'), description: '2nd Year BSIT, Southwestern University PHINMA' },
    ];

    // PanResponder remains platform-agnostic
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => { },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        if (dx > 30) {
          // Handle swipe gestures (works the same on both platforms)
        }
      }
    });
  }
  videoRef = React.createRef();

  async componentDidMount() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Sorry, we need camera roll permissions to make this work!');
  }
    this.requestLocationPermission();
    this.fetchTypes();
    this.checkIfTutorialSeen();
    await this.checkTermsAgreement();
    await this.checkRemainingSubmissions();   
  }

  checkRemainingSubmissions = async () => {
    try {
      const deviceId = await getDeviceId();
      const currentDay = new Date().toISOString().split('T')[0];
      const submissionsRef = ref(database, `led/submissions/${deviceId}/${currentDay}`);
      let submissionsSnapshot = await get(submissionsRef);
      let submissionCount = submissionsSnapshot.exists() ? submissionsSnapshot.val() : 0;

      // Calculate remaining submissions
      const remainingSubmissions = MAX_SUBMISSIONS - submissionCount;
      this.setState({ remainingSubmissions });
    } catch (error) {
      console.error('Error checking remaining submissions:', error.message);
    }
  };

  checkTermsAgreement = async () => {
    const termsAgreed = await AsyncStorage.getItem('termsAgreed');
    if (termsAgreed !== 'true') {
      this.setState({ termsModalVisible: true });
    }
  };

  handleAgreeToTerms = () => {
    this.setState({ termsModalVisible: false });
  };

  openDeveloperModal = () => {
    this.setState({ developerModalVisible: true });
  };
  
  closeDeveloperModal = () => {
    this.setState({ developerModalVisible: false });
  };

  nextDeveloper = () => {
    this.setState(prevState => ({
      currentDeveloper: (prevState.currentDeveloper + 1) % this.developers.length
    }));
  };
  
  prevDeveloper = () => {
    this.setState(prevState => ({
      currentDeveloper: (prevState.currentDeveloper - 1 + this.developers.length) % this.developers.length
    }));
  };

  checkIfTutorialSeen = async () => {
    const tutorialSeen = await AsyncStorage.getItem('tutorialSeen');
    if (tutorialSeen !== 'true') {
      this.setState({ showTutorial: true });
    } else {
      await AsyncStorage.removeItem('tutorialSeen'); // For testing
    }
  };

  closeTutorial = async () => {
    await AsyncStorage.setItem('tutorialSeen', 'true'); // Mark the tutorial as seen
    this.setState({ showTutorial: false });
    if (this.videoRef.current) {
      this.videoRef.current.stopAsync(); // Stop video playback
    }
  };

  // Request location permission (handle iOS and Android differently)
  requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required for this feature.');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    this.setState({ location });
  };


  fetchTypes = async () => {
    try {
      const typesRef = ref(database, 'led/Types');
      const snapshot = await get(typesRef);
      if (snapshot.exists()) {
        const typesData = snapshot.val();
        if (typesData && typeof typesData === 'object') {
          const typesArray = Object.keys(typesData).map(key => ({
            label: key,
            value: typesData[key]
          }));
          this.setState({ types: typesArray });
        }
      } else {
        console.log("No data available");
      }
    } catch (error) {
      console.error("Error fetching types:", error.message);
    }
  };

  handleTypeSelect = (type) => {
    // Log the selected type for debugging
    console.log(`Selected type: ${type}`);

    this.setState({
        typeModalVisible: false,
        type: type,
        showOtherInput: type === 'OTHERS', // Show additional input if "OTHERS" is selected
        otherType: '' // Reset otherType when a valid type is selected
    });
};


  handleSubmit = async () => {
    const { avatarSource, name, contact, type, otherType, isSubmitting, showOtherInput } = this.state;

    if (isSubmitting) {
      Alert.alert('Please wait', 'Submission is in progress.');
      return;
    }

    if (!name || !contact || (!type && !otherType)) {
      Alert.alert('Missing Information', 'Name, contact number, and type are required.');
      return;
    }

    const reportType = showOtherInput ? otherType : type;

    this.setState({ isSubmitting: true });

    try {
      const deviceId = await getDeviceId();
      const currentDay = new Date().toISOString().split('T')[0];
      const submissionsRef = ref(database, `led/submissions/${deviceId}/${currentDay}`);
      let submissionsSnapshot = await get(submissionsRef);
      let submissionCount = submissionsSnapshot.exists() ? submissionsSnapshot.val() : 0;

      if (submissionCount >= MAX_SUBMISSIONS) {
        this.setState({ limitReachedModalVisible: true, isSubmitting: false });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const locationString = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`;
      const reportId = -Date.now();

      let downloadUrl = null;
      if (avatarSource && avatarSource.uri) {
        const imageName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;
        const storage = getStorage();
        const storageReference = storageRef(storage, `ReportPicture/${imageName}`);
        const response = await fetch(avatarSource.uri);
        const blob = await response.blob();
        await uploadBytes(storageReference, blob);
        downloadUrl = await getDownloadURL(storageReference);
      }

      const timestamp = new Date().toLocaleString();
      const reportData = {
        reportId,
        name,
        contact,
        type: reportType,
        location: locationString,
        imageUrl: downloadUrl || 'No image provided',
        timestamp,
        deviceId,
      };

      await set(ref(database, `led/reports/${reportId}`), reportData);
      await set(submissionsRef, submissionCount + 1);

      // Update led/state in Firebase after successful submission
      const selectedType = this.state.types.find(t => t.label === reportType);
      if (selectedType) {
        await this.updateFirebaseState(selectedType.value);
      }

      this.setState({ 
        successModalVisible: true,
        remainingSubmissions: MAX_SUBMISSIONS - (submissionCount + 1), // Update remaining submissions
        type: '',
        otherType: '',
        showOtherInput: false,
        name: '',
        contact: '',
        avatarSource: null,
        isImageSelected: false,
      });
      this.closeModal();
    } catch (error) {
      console.error('Error uploading details:', error.message);
      Alert.alert('Error', `Error uploading details: ${error.message}`);
    } finally {
      this.setState({ isSubmitting: false });
    }
  };

  updateFirebaseState = async (selectedValue) => {
    try {
      const ledStateRef = ref(database, 'led/state');
      await set(ledStateRef, selectedValue); // Update led/state with selected value
    } catch (error) {
      console.error('Error updating led/state in Firebase:', error.message);
    }
  };



   // Improved renderTypeButtons function
renderTypeButtons = () => {
  const reportTypes = [
    { label: 'FIRE', icon: require('../assets/fire.png') },
    { label: 'ACCIDENT', icon: require('../assets/Accident.png') },
    { label: 'CRIME OR THIEF', icon: require('../assets/CrimeThief.png') },
    { label: 'NOISE', icon: require('../assets/Noise.png') },
    { label: 'OTHERS', icon: require('../assets/Other.png') },
  ];

  return reportTypes.map((type, index) => (
    <TouchableOpacity
      key={index}
      style={[
        tw`flex-row items-center my-2 rounded-lg px-4 py-3`,
        {
          backgroundColor: '#fff6f0',
          borderRadius: 15,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        },
      ]}
      activeOpacity={0.7} // Add active opacity for better feedback
      onPress={() => {
        this.handleTypeSelect(type.label); // Directly call the selection handler
      }}>
      <Image
        source={type.icon}
        style={{ width: 40, height: 40, marginRight: 10 }}
      />
      <Text style={tw`flex-1 text-lg font-bold text-center text-black`}>
        {type.label}
      </Text>
    </TouchableOpacity>
  ));
};
    

  handleGifPress = () => {
    this.setState({ modalVisible: true });
  };

  closeModal = () => {
    this.setState({ 
      modalVisible: false,
      avatarSource: null,
      isImageSelected: false,
      name: '',
      contact: '',
      type: '',
      otherType: '',
      showOtherInput: false,
    });
  };


  openFullScreenModal = () => {
    this.setState({ fullScreenModalVisible: true });
  };

  closeFullScreenModal = () => {
    this.setState({ fullScreenModalVisible: false });
  };

  handleBrowseFiles = () => {
    this.setState({ browseFilesModalVisible: true });
  };

  
  
  // Function to close the custom modal
  closeBrowseFilesModal = () => {
    this.setState({ browseFilesModalVisible: false });
  };

  handleCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert("Permission required", "Permission to access camera is required!");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,  // Disable cropping
      quality: 1,
    });

    if (!result.canceled) {
      const uniqueName = `${Date.now()}.jpg`;
      const newUri = FileSystem.documentDirectory + uniqueName;
  
      await FileSystem.moveAsync({
        from: result.assets[0].uri,
        to: newUri,
      });
  
      const asset = await MediaLibrary.createAssetAsync(newUri);
  
      this.setState({ 
        avatarSource: { uri: asset.uri },
        isImageSelected: true,
      });
    }
  };




  // Open image picker, with platform-specific settings if necessary
  pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.uri;

      // Platform-specific handling of file URI (required for Android vs iOS)
      if (Platform.OS === 'android') {
        // Convert the file URI if needed
        const fileUri = await FileSystem.getInfoAsync(imageUri);
      }

      this.setState({ avatarSource: imageUri, isImageSelected: true });
    }
  };

  // Handle media library permissions (iOS requires extra checks)
  requestMediaLibraryPermission = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need permission to access your media library.');
    }
  };

  handleLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,  
      quality: 1,
    });

    if (!result.canceled) {
      const source = { uri: result.assets[0].uri };
      this.setState({ avatarSource: source, isImageSelected: true });
    }
  };

  async openFilePicker() {
    try {
      // Request permission to access media library
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access media is required!');
        return;
      }
  
      // Open the media library to pick a file
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // You can change to Video, etc.
        allowsEditing: true,
        quality: 1,
      });
  
      if (!result.canceled) {
        // Save the selected image's URI to state or process the file
        this.setState({ avatarSource: result.uri, isImageSelected: true });
      }
    } catch (error) {
      console.error('Error opening file picker:', error);
    }
  }
  

  handleNameChange = (text) => {
    this.setState({ name: text });
  };

  handleContactChange = (text) => {
    this.setState({ contact: text });
  };

  
  
  render() {
    const {  showTutorial, modalVisible, developerModalVisible, typeModalVisible, 
      browseFilesModalVisible, currentDeveloper, avatarSource, 
      successModalVisible, type, name, contact, isImageSelected , remainingSubmissions, limitReachedModalVisible, showOtherInput, otherType,termsModalVisible ,
  } = this.state;
    const currentDev = this.developers[currentDeveloper];
    return (
      <ImageBackground
        source={require('../assets/image.png')}
        style={tw`flex-1 justify-center`}
      >
        
        <View style={tw`flex-1 items-center justify-center`}>
          <Text style={tw`text-32px text-black font-bold mt-18 ml-4`}>Are you in emergency?</Text>
          <Text style={tw`text-15px text-gray-500 font-bold mb-2 text-center mt-3`}>Press the button below, help will reach</Text>
          <Text style={tw`text-15px text-gray-500 font-bold mb-1 text-center`}>Soon!</Text>
  
          <TouchableOpacity onPress={this.handleGifPress}>
            <Image
              source={require('../assets/alarm.gif')}
              style={tw`w-70 h-70 mt-1`}
            />
          </TouchableOpacity>
  
          {/* Navigation Buttons */}
          <View style={tw`absolute bottom-1 left-2 flex-row`}>
            <TouchableOpacity
              style={tw`w-31 h-18 mr-1`} // Width and height of the button
              onPress={() => console.log('First Button Pressed')}
            >
              <ImageBackground
                source={require('../assets/10.png')}
                style={tw`w-full h-full justify-center items-center`}
                imageStyle={tw`rounded-r-2xl`} // Optional: if you want rounded corners for the background image
                resizeMode="cover" // Adjust image scaling as needed
              >
              </ImageBackground>
            </TouchableOpacity>
  
            <TouchableOpacity
              style={tw`w-31 h-16 mt-1`} 
              onPress={this.openDeveloperModal}  // Open Developer Modal
            >
              <ImageBackground
                source={require('../assets/8.png')}
                style={tw`w-full h-full justify-center items-center`}
                imageStyle={tw`rounded-r-2xl`} 
                resizeMode="cover"
              >
              </ImageBackground>
            </TouchableOpacity>
          </View>
          {/* Modals */}
        <TermsAndConditionsModal
          visible={termsModalVisible}
          onAgree={this.handleAgreeToTerms}
        />
  
       {/* Emergency Alert Modal */}
       <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={this.closeModal}
          >
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-20`}>
              <View style={tw`w-80 bg-[#fff6f0] rounded-lg p-6 items-center shadow-md relative`}>
                
                {/* Close Button on the Top Right */}
                <TouchableOpacity
                  style={tw`absolute top-4 right-4 w-8 h-8`}
                  onPress={this.closeModal}
                >
                  <Image
                    source={require('../assets/close_button.png')}
                    style={tw`w-8 h-8`}
                  />
                </TouchableOpacity>

                {/* Form Elements */}
                <View style={tw`w-full mb-4`}>
                  <View style={tw`items-center justify-center mb-1`}>
                    <TouchableOpacity onPress={this.handleGifPress}>
                      <Image
                        source={require('../assets/alarm.gif')}
                        style={tw`w-40 h-40`}
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Name Input */}
                  <Text style={tw`text-black text-base font-bold mb-1`}>NAME:</Text>
                  <TextInput
                    style={tw`w-full h-12 bg-white rounded-lg border border-gray-300 px-3 mb-1 text-black`}
                    placeholder="Enter your name"
                    placeholderTextColor="#868686"
                    onChangeText={(text) => this.setState({ name: text })}
                    value={name}
                  />

                  {/* Contact Input */}
                  <Text style={tw`text-black text-base font-bold mb-1`}>CONTACT:</Text>
                  <TextInput
                    style={tw`w-full h-12 bg-white rounded-lg border border-gray-300 px-3 mb-4 text-black`}
                    placeholder="Enter your contact"
                    placeholderTextColor="#868686"
                    onChangeText={(text) => this.setState({ contact: text })}
                    value={contact}
                  />

                        {/* Type of Emergency Dropdown */}
                        <TouchableOpacity
                  style={tw`w-full h-12 bg-white rounded-lg border border-gray-300 flex-row items-center justify-between px-3 mb-1`}
                  onPress={() => {
                    setTimeout(() => {
                      this.setState({ typeModalVisible: true });
                    }, 100);
                  }}
                >
                  <Text style={tw`text-black text-base`}>
                    {type ? type : 'TYPE OF EMERGENCY'}
                  </Text>
                  <Image source={require('../assets/arrowdown.png')} style={tw`w-6 h-6`} />
                </TouchableOpacity>

                 {/* Conditionally Render "Other (Specify)" Input */}
                    {showOtherInput && (
                      <View style={tw`w-full flex-row items-center mb-2 mt-3`}>
                        <View style={tw`bg-gray-300 w-23 h-12 px-3  justify-center rounded-l-lg`}>
                          <Text style={tw`text-black font-bold`}>Other (Specify):</Text>
                        </View>
                        <TextInput
                          style={tw`flex-1 h-12 bg-white rounded-r-lg border border-gray-300 px-3 text-black`}
                          placeholder="Enter type of emergency"
                          placeholderTextColor="#868686"
                          onChangeText={(text) => this.setState({ otherType: text })}
                          value={otherType}
                        />
                      </View>
                    )}


                  {/* Upload Image Section */}
                  <Text style={tw`text-black text-base font-bold mb-1`}>UPLOAD IMAGE</Text>
                  <View style={tw`w-full flex-row items-center justify-between bg-white border border-gray-300 rounded-lg p-2 mb-4`}>
                    {/* File Description Text or Selected Image Preview */}
                    {isImageSelected ? (
                      <Image
                        source={{ uri: avatarSource.uri }}
                        style={{ width: 60, height: 60, marginRight: 10, borderRadius: 5 }} // Adjust the style as needed
                      />
                    ) : (
                      <Text style={tw`text-gray-600 flex-1`}>CHOOSE FILE TO UPLOAD</Text>
                    )}

                    {/* Browse Files Button */}
                    <TouchableOpacity
                      style={tw`bg-gray-300 px-4 py-2 rounded-lg`}
                      onPress={this.handleBrowseFiles} // Updated to call the function to open the modal
                    >
                      <Text style={tw`text-black font-bold`}>BROWSE FILES</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit Button */}
                  <TouchableOpacity
                  style={tw`bg-[#800000] w-full h-12 justify-center items-center rounded-lg`}
                  onPress={this.handleSubmit}
                  disabled={this.state.isSubmitting} // Disable button when submitting
                >
                  {this.state.isSubmitting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={tw`text-white text-lg font-bold`}>SUBMIT</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>


        {/* Type of Report Modal */}
                    <Modal
              animationType="slide"
              transparent={true}
              visible={typeModalVisible}
              onRequestClose={() => this.setState({ typeModalVisible: false })}>
              <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-20`}>
                <View style={tw`w-80 bg-white rounded-3xl p-6 items-center shadow-md`}>
                  <TouchableOpacity
                    style={tw`absolute top-3 right-3`}
                    onPress={() => this.setState({ typeModalVisible: false })}>
                    <Image source={require('../assets/close_button.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
                  </TouchableOpacity>
                  <Text style={tw`text-2xl font-bold mt-4 mb-2 text-black`}> Type of Report</Text>
                  <View style={tw`w-full`}>
                    {this.renderTypeButtons()}
                  </View>
                </View>
              </View>
            </Modal>

  
          {/* Full Screen Image Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={this.state.fullScreenModalVisible}
            onRequestClose={this.closeFullScreenModal}
          >
            <View style={tw`flex-1 bg-black bg-opacity-80 justify-center items-center`}>
              {this.state.avatarSource && (
                <Image
                  source={this.state.avatarSource}
                  style={tw`w-full h-full`}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity style={tw`absolute top-5 right-5 w-10 h-10 justify-center items-center`} onPress={this.closeFullScreenModal}>
                <Text style={tw`text-white text-2xl font-bold`}>X</Text>
              </TouchableOpacity>
            </View>
          </Modal>
  
          {/* Success Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={successModalVisible}
            onRequestClose={() => this.setState({ successModalVisible: false })}
          >
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
              <View style={tw`w-70 bg-[#fff6f0] rounded-lg p-5 items-center`}>
                <Image
                  source={require('../assets/alarm.gif')}
                  style={tw`w-47 h-47`}
                />
                <Image
                  source={require('../assets/check.png')}
                  style={tw`w-20 h-20 mb-5`}
                />
                <Text style={tw`text-lg font-bold mb-2 text-black`}>Help is on the way. Stay safe!</Text>
                <Text style={tw`text-base font-bold text-black`}>You have {remainingSubmissions} reports left for today.</Text>
                <TouchableOpacity 
                  style={tw`w-22 h-11 mt-3 bg-[#800000] rounded-lg justify-center items-center`}
                  onPress={() => this.setState({ successModalVisible: false })}
                >
                  <Text style={tw`text-white text-lg font-bold`}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Reach the limit Modal */}
<Modal
  animationType="slide"
  transparent={true}
  visible={limitReachedModalVisible}
  onRequestClose={() => this.setState({ limitReachedModalVisible: false })}
>
  <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
    <View style={tw`w-70 bg-[#fff6f0] rounded-lg p-5 items-center`}>
      <Image
        source={require('../assets/alarm.gif')}
        style={tw`w-47 h-47`}
      />
      {/* Centering the Text */}
      <Text style={tw`text-lg font-bold mb-2 text-black text-center`}>
        You have reached your daily limit of 10 reports.
      </Text>
      <Text style={tw`text-base text-black text-center`}>
        Please try again tomorrow.
      </Text>
      <TouchableOpacity
        style={tw`w-22 h-11 mt-3 bg-[#800000] rounded-lg justify-center items-center`}
        onPress={() => this.setState({ limitReachedModalVisible: false })}
      >
        <Text style={tw`text-white text-lg font-bold`}>OK</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


          {/* Browse Files Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={browseFilesModalVisible}
            onRequestClose={this.closeBrowseFilesModal}
          >
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-20`}>
              <View style={tw`w-80 bg-[#fff6f0] rounded-3xl p-6 items-center shadow-md relative`}>
                
      
                {/* Modal Title */}
                <Text style={tw`text-xl font-bold mt-2 mb-4 text-black`}>Choose an option</Text>
      
                {/* Camera Button */}
                <TouchableOpacity
                  style={[
                    tw`flex-row items-center my-2 rounded-lg px-4 py-3 w-full`,
                    {
                      backgroundColor: '#fff',
                      borderRadius: 15,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                  ]}
                  onPress={() => {
                    this.closeBrowseFilesModal();
                    this.handleCamera();
                  }}
                >
                  <Image
                    source={require('../assets/camera.png')}
                    style={{ width: 40, height: 40, marginRight: 15 }}
                  />
                  <Text style={[tw`flex-1 text-lg font-bold text-black`]}>Take a picture</Text>
                </TouchableOpacity>
      
                {/* Photo Library Button */}
                <TouchableOpacity
                  style={[
                    tw`flex-row items-center my-2 rounded-lg px-4 py-3 w-full`,
                    {
                      backgroundColor: '#fff',
                      borderRadius: 15,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                  ]}
                  onPress={() => {
                    this.closeBrowseFilesModal();
                    this.handleLibrary();
                  }}
                >
                  <Image
                    source={require('../assets/upload.png')}
                    style={{ width: 40, height: 40, marginRight: 15 }}
                  />
                  <Text style={[tw`flex-1 text-lg font-bold text-black`]}>Upload a file</Text>
                </TouchableOpacity>
      
                {/* Cancel Button */}
                      <TouchableOpacity
                        style={[
                          tw`flex-row items-center justify-center my-2 rounded-lg px-4 py-3 w-40`,
                          {
                            backgroundColor: '#801B22', // Updated to use the correct color.
                            borderRadius: 15,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                          },
                        ]}
                        onPress={this.closeBrowseFilesModal}
                      >
                        <Text style={tw`text-2xl font-bold text-white text-center`}>CANCEL</Text>
                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </Modal>
  
                      {/* Developer Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={this.state.developerModalVisible}
              onRequestClose={this.closeDeveloperModal}
            >
              <View style={tw`flex-1 justify-center items-center`}>
                <View style={tw`w-80 bg-[#fff6f0] rounded-lg p-5 items-center shadow-md`}>
                  {/* Background color for the role text */}
                  <View style={tw`bg-gray-200 rounded p-2 mb-2`}>
                    <Text style={tw`text-lg font-bold text-center`}>
                      {this.developers[currentDeveloper].role}
                    </Text>
                  </View>

                  <Image
                    source={this.developers[currentDeveloper].image}
                    style={tw`w-40 h-40 mb-2 rounded-full`}
                  />

                  <Text style={tw`text-xl font-bold`}>{this.developers[currentDeveloper].name}</Text>
                            {/* Centered Description */}
                <View style={tw`mt-2 mb-4 flex items-center`}>
                  <Text style={tw`text-sm text-center font-bold`}>
                    {this.developers[currentDeveloper].description}
                  </Text>
                </View>
                  {/* Updated View for Navigation Buttons */}
                  <View style={tw`flex-row justify-between mt-4 w-full`}>
                    <TouchableOpacity
                      onPress={this.prevDeveloper}
                      style={tw`bg-red-600 h-10 w-15 rounded flex justify-center items-center`}
                    >
                      <Text style={tw`text-white text-2xl`}>&lt;</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={this.nextDeveloper}
                      style={tw`bg-red-600 h-10 w-15 rounded flex justify-center items-center`}
                    >
                      <Text style={tw`text-white text-2xl`}>&gt;</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity 
                    onPress={this.closeDeveloperModal} 
                    style={tw`mt-4 w-25 h-10 bg-red-600 rounded-lg justify-center items-center`}
                  >
                    <Text style={tw`text-xl text-white`}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>


  
          {/* Tutorial Modal */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={this.state.showTutorial}
            onRequestClose={this.closeTutorial}
            onShow={() => {
              if (this.videoRef.current) {
                this.videoRef.current.playAsync(); 
              }
            }}
          >
            <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-10`}>
              <View style={tw`w-70 bg-[#fff6f0] rounded-lg p-5 items-center mt-5`}>
                <Video
                  ref={this.videoRef} 
                  source={require('../assets/Tutorial.mp4')} 
                  style={tw`w-full h-118 mb-5`}
                  resizeMode="cover"
                  isLooping
                  shouldPlay 
                  useNativeControls={false} 
                  onPlaybackStatusUpdate={(status) => {
                  }}
                />
                
                <TouchableOpacity
                  style={tw`w-full h-12 bg-red-600 rounded-lg justify-center items-center`}
                  onPress={this.closeTutorial} // Call the closeTutorial directly
                >
                  <Text style={tw`text-white font-bold`}>Skip Tutorial</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <StatusBar style="auto" />
        </View>
      </ImageBackground>
    );
  }
}
