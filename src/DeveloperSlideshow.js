// DeveloperSlideshow.js
import React, { useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import tw from 'twrnc';

const DeveloperSlideshow = ({ developers, currentDeveloper, nextDeveloper, prevDeveloper }) => {
  const flatListRef = useRef(null);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: currentDeveloper, animated: true });
    }
  }, [currentDeveloper]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image
        source={item.image}
        style={styles.image}
      />
      <Text style={tw`text-lg font-bold mt-2`}>{item.name}</Text>
      <Text style={tw`text-md text-gray-500`}>{item.role}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={developers}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={currentDeveloper}
        getItemLayout={(data, index) => (
          { length: 250, offset: 250 * index, index }
        )}
        extraData={currentDeveloper}
      />
      {/* <View style={tw`flex-row justify-between w-full  mt-4 px-4`}>
        <TouchableOpacity onPress={prevDeveloper} disabled={currentDeveloper === 0}>
          <Text style={tw`text-white font-bold bg-red-600 rounded-lg `}>Previous</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={nextDeveloper} disabled={currentDeveloper === developers.length - 1}>
          <Text style={tw`text-white font-bold bg-red-600 rounded-lg `}>Next</Text>
        </TouchableOpacity>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250, // Width matching the card width
  },
  card: {
    width: 250,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  image: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140, // Adjust size as needed
    height: 140, // Adjust size as needed
    borderRadius: 9999, // 70% of 140 is 98 to achieve 70% rounded radius
    marginBottom: 10,
  },
});

export default DeveloperSlideshow;
