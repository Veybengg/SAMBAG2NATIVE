import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, Dimensions, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import tw from 'twrnc';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TermsAndConditionsModal = ({ visible, onAgree }) => {
  const [isChecked, setIsChecked] = useState(false);
  const { width, height } = Dimensions.get('window');

  const handleAgree = async () => {
    if (isChecked) {
      try {
        await AsyncStorage.setItem('termsAgreed', 'true');
        onAgree();
      } catch (error) {
        Alert.alert('Error', 'An error occurred while saving agreement status.');
      }
    } else {
      Alert.alert('Agreement Required', 'You must agree to the terms and conditions to continue.');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        
        {/* Modal Container */}
        <View style={[
          tw`bg-white rounded-lg shadow-lg overflow-hidden`,
          { width: width * 0.85, maxHeight: height * 0.93 }
        ]}>
          
          {/* Header Section */}
          <View style={tw`bg-[#800000] p-4`}>
            <Text style={tw`text-white text-lg font-bold text-center`}>Terms and Conditions</Text>
          </View>

          {/* Scrollable Content Section */}
          <ScrollView 
            style={tw`px-5`} 
            contentContainerStyle={{ paddingBottom: 10 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={tw`text-sm mb-3 mt-5`}>
              <Text style={tw`font-bold`}>1. Acceptance of Terms</Text>{'\n'}
              By accessing or using the Sambag 2 Alert System ("the System"), you agree to be bound by these Terms and Conditions. If you do not agree with these terms, you may not use the System.{'\n\n'}
              
              <Text style={tw`font-bold`}>2. Purpose of the System</Text>{'\n'}
              The System is designed to facilitate efficient emergency communication between residents of Barangay Sambag 2 and local authorities. It aims to provide timely alerts related to fires, crimes, noise disturbances, and other emergencies.{'\n\n'}
              
              <Text style={tw`font-bold`}>3. User Responsibilities</Text>{'\n'}
              <Text style={tw`text-sm`}>
                {`\u2022`} You agree to use the System only for its intended purpose and to provide accurate information when reporting incidents.{'\n'}
                {`\u2022`} Misuse of the System, including sending false alerts or inappropriate content, is strictly prohibited and may result in suspension or termination of your access.{'\n'}
                {`\u2022`} You are responsible for maintaining the confidentiality of your account credentials and for all activities conducted through your account.{'\n\n'}
              </Text>

              <Text style={tw`font-bold`}>4. Privacy and Data Use</Text>{'\n'}
              <Text style={tw`text-sm`}>
                {`\u2022`} The System may collect personal information to ensure efficient communication during emergencies. By using the System, you consent to the collection, storage, and use of your information as outlined in our Privacy Policy.{'\n'}
                {`\u2022`} Your information will not be shared with unauthorized parties and will only be used to enhance the safety and communication within Barangay Sambag 2.
              </Text>
            </Text>

            {/* Checkbox Section */}
            <View style={tw`flex-row items-center mb-1 mt-5`}>
              <TouchableOpacity onPress={() => setIsChecked(!isChecked)} style={tw`mr-2`}>
                <Icon
                  name={isChecked ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={isChecked ? 'green' : '#800000'}
                />
              </TouchableOpacity>
              <Text style={tw`text-sm flex-shrink`}>
                I agree and accept the terms and conditions
              </Text>
            </View>
          </ScrollView>

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              tw`w-full h-12 justify-center items-center rounded-lg`,
              { backgroundColor: isChecked ? '#800000' : '#ccc' }
            ]}
            onPress={handleAgree}
          >
            <Text style={tw`text-white text-lg font-bold`}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TermsAndConditionsModal;
