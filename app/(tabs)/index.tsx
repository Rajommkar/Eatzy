import {SafeAreaView} from "react-native-safe-area-context";
import { FlatList, Image, Pressable, Text, TouchableOpacity, View, ActivityIndicator, Modal, TextInput, Alert} from "react-native";
import {Fragment, useEffect, useState} from "react";
import cn from 'clsx';
import { router } from "expo-router";
import * as Location from 'expo-location';
import { updateUserPhone } from "@/lib/appwrite";

import CartButton from "@/components/CartButton";
import {images, offers} from "@/constants";
import useAuthStore from "@/store/auth.store";

export default function Index() {
  const { user, setUser } = useAuthStore();

  const [locationText, setLocationText] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  
  const [phonePromptVisible, setPhonePromptVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  useEffect(() => {
      if (user && !user.phone) {
          setPhonePromptVisible(true);
      }
  }, [user]);

  const handleUpdatePhone = async () => {
      if (!phoneNumber || !/^\+?[0-9]{10,13}$/.test(phoneNumber.replace(/\s/g, ''))) {
          Alert.alert('Error', 'Please enter a valid phone number (10–13 digits).');
          return;
      }
      setIsUpdatingPhone(true);
      try {
          if (user) {
              await updateUserPhone(user.$id, user.$id, phoneNumber);
              setUser({ ...user, phone: phoneNumber });
              setPhonePromptVisible(false);
          }
      } catch (error) {
          Alert.alert('Error', 'Could not update phone number. Please try again.');
      } finally {
          setIsUpdatingPhone(false);
      }
  };

  // Fetch real location on mount
  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationText(user?.name ? `${user.name}'s Location` : 'Set Location');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (address) {
          const parts = [address.street, address.district ?? address.subregion, address.city].filter(Boolean);
          setLocationText(parts.slice(0, 2).join(', ') || address.city || 'Current Location');
        } else {
          setLocationText('Current Location');
        }
      } catch {
        setLocationText(user?.name ? `${user.name}'s Location` : 'Set Location');
      } finally {
        setLoadingLocation(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayLocation = locationText ?? (user?.name ? `${user.name}'s Location` : 'Set Location');

  return (
      <SafeAreaView className="flex-1 bg-white">
          <FlatList
              data={offers}
              renderItem={({ item, index }) => {
                  const isEven = index % 2 === 0;

                  return (
                      <View>
                          <Pressable
                              className={cn("offer-card", isEven ? 'flex-row-reverse' : 'flex-row')}
                              style={{ backgroundColor: item.color }}
                              android_ripple={{ color: "#ffffff22"}}
                              onPress={() => router.push({ pathname: '/(tabs)/search', params: { query: item.searchQuery } } as never)}
                          >
                              {({ pressed }) => (
                                  <Fragment>
                                      <View className={cn("h-full w-1/2", pressed && 'opacity-80')}>
                                        <Image source={item.image} className={"size-full"} resizeMode={"contain"} />
                                      </View>

                                      <View className={cn("offer-card__info", isEven ? 'pl-10': 'pr-10')}>
                                          <Text className="h1-bold text-white leading-tight">
                                              {item.title}
                                          </Text>
                                          <Image
                                            source={images.arrowRight}
                                            className="size-10"
                                            resizeMode="contain"
                                            tintColor="#ffffff"
                                          />
                                      </View>
                                  </Fragment>
                              )}
                          </Pressable>
                      </View>
                  )
              }}
              contentContainerClassName="pb-28 px-5"
              ListHeaderComponent={() => (
                  <View className="flex-between flex-row w-full my-5">
                      <View className="flex-start">
                          <Text className="small-bold text-primary">DELIVER TO</Text>
                          <TouchableOpacity
                              className="flex-center flex-row gap-x-1 mt-0.5"
                              onPress={async () => {
                                  // Re-fetch location on tap
                                  setLoadingLocation(true);
                                  try {
                                      const { status } = await Location.requestForegroundPermissionsAsync();
                                      if (status !== 'granted') return;
                                      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                                      const [address] = await Location.reverseGeocodeAsync(loc.coords);
                                      if (address) {
                                          const parts = [address.street, address.district ?? address.subregion, address.city].filter(Boolean);
                                          setLocationText(parts.slice(0, 2).join(', ') || 'Current Location');
                                      }
                                  } catch { /* ignore */ } finally {
                                      setLoadingLocation(false);
                                  }
                              }}
                          >
                              <Image source={images.location} className="size-4" resizeMode="contain" tintColor="#FE8C00" />
                              {loadingLocation
                                  ? <ActivityIndicator size="small" color="#FE8C00" style={{ marginHorizontal: 4 }} />
                                  : <Text className="paragraph-bold text-dark-100" numberOfLines={1} style={{ maxWidth: 200 }}>
                                        {displayLocation}
                                    </Text>
                              }
                              <Image source={images.arrowDown} className="size-3" resizeMode="contain" />
                          </TouchableOpacity>
                      </View>

                      <CartButton />
                  </View>
              )}
          />

          <Modal
              visible={phonePromptVisible}
              transparent={true}
              animationType="slide"
          >
              <View className="flex-1 justify-center items-center bg-black/50 px-5">
                  <View className="bg-white w-full rounded-2xl p-6 items-center">
                      <Text className="h3-bold text-dark-100 mb-2">Complete Your Profile</Text>
                      <Text className="body-medium text-gray-200 text-center mb-6">
                          Please enter your mobile number for delivery updates and contact.
                      </Text>
                      
                      <View className="w-full bg-gray-50 rounded-xl px-4 py-3 mb-6">
                          <TextInput
                              placeholder="+91 XXXXX XXXXX"
                              value={phoneNumber}
                              onChangeText={setPhoneNumber}
                              keyboardType="phone-pad"
                              className="paragraph-medium text-dark-100"
                              placeholderTextColor="#A0A0A0"
                          />
                      </View>

                      <TouchableOpacity 
                          className="bg-primary w-full py-4 rounded-full items-center"
                          onPress={handleUpdatePhone}
                          disabled={isUpdatingPhone}
                      >
                          {isUpdatingPhone ? (
                              <ActivityIndicator color="white" />
                          ) : (
                              <Text className="paragraph-bold text-white">Save Mobile Number</Text>
                          )}
                      </TouchableOpacity>
                  </View>
              </View>
          </Modal>
      </SafeAreaView>
  );
}
