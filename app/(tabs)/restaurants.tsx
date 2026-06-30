import {
    View, Text, FlatList, TouchableOpacity,
    TextInput, Image, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import { LOCAL_RESTAURANTS } from '@/lib/data';
import { Restaurant } from '@/type';
import { images } from '@/constants';
import CartButton from '@/components/CartButton';

const CUISINE_FILTERS = ['All', 'Burgers', 'Pizzas', 'Wraps', 'Burritos', 'Sandwiches', 'Bowls', 'Indian'];

const StarBadge = ({ rating }: { rating: number }) => (
    <View className="flex-row items-center gap-x-1 bg-white/20 rounded-full px-2 py-0.5">
        <Text style={{ color: '#FFF', fontSize: 11 }}>★</Text>
        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{rating.toFixed(1)}</Text>
    </View>
);

const RestaurantCard = ({ item, onPress }: { item: Restaurant; onPress: () => void }) => (
    <TouchableOpacity
        onPress={onPress}
        className="mb-4 rounded-3xl overflow-hidden bg-white"
        style={{
            elevation: Platform.OS === 'android' ? 6 : 0,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
        }}
        activeOpacity={0.88}
    >
        {/* Color Banner */}
        <View style={{ backgroundColor: item.color, height: 100, justifyContent: 'space-between', padding: 14 }}>
            <View className="flex-row items-start justify-between">
                <View>
                    {item.tags.map((tag) => (
                        <View key={tag} className="bg-white/20 rounded-full px-3 py-0.5 mb-1 self-start">
                            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{tag}</Text>
                        </View>
                    ))}
                </View>
                <StarBadge rating={item.rating} />
            </View>
            <Text style={{ fontSize: 44 }}>{item.emoji}</Text>
        </View>

        {/* Info */}
        <View className="p-4">
            <View className="flex-row items-center justify-between mb-1">
                <Text className="paragraph-bold text-dark-100" style={{ fontSize: 16 }}>{item.name}</Text>
                <Text className="body-medium text-gray-200">{item.priceRange}</Text>
            </View>
            <Text className="body-regular text-gray-200 mb-3">{item.cuisine}</Text>

            <View className="flex-row items-center gap-x-4">
                <View className="flex-row items-center gap-x-1">
                    <Image source={images.clock} className="size-4" resizeMode="contain" tintColor="#5D5F6D" />
                    <Text className="body-medium text-gray-200">{item.deliveryTime} min</Text>
                </View>
                <View className="flex-row items-center gap-x-1">
                    <Image source={images.location} className="size-4" resizeMode="contain" tintColor="#5D5F6D" />
                    <Text className="body-medium text-gray-200">{item.distance} km</Text>
                </View>
                <View className="flex-1" />
                <TouchableOpacity
                    onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: item.categoryFilter } } as never)}
                    className="bg-primary rounded-full px-4 py-1.5"
                >
                    <Text className="small-bold text-white">Order Now</Text>
                </TouchableOpacity>
            </View>
        </View>
    </TouchableOpacity>
);

export default function Restaurants() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState('All');

    const filtered = useMemo(() => {
        let list = LOCAL_RESTAURANTS as Restaurant[];
        if (selectedCuisine !== 'All') {
            list = list.filter((r) => r.cuisine === selectedCuisine);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((r) =>
                r.name.toLowerCase().includes(q) ||
                r.cuisine.toLowerCase().includes(q)
            );
        }
        return list;
    }, [searchQuery, selectedCuisine]);

    return (
        <SafeAreaView className="flex-1 bg-white">
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <RestaurantCard
                        item={item}
                        onPress={() => router.push({ pathname: '/(tabs)/search', params: { category: item.categoryFilter } } as never)}
                    />
                )}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={() => (
                    <View className="pt-4 pb-2">
                        {/* Title row */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View>
                                <Text className="small-bold text-primary uppercase">Near You</Text>
                                <Text className="h3-bold text-dark-100">Restaurants</Text>
                            </View>
                            <CartButton />
                        </View>

                        {/* Search bar */}
                        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-3 mb-4 gap-x-3">
                            <Image source={images.search} className="size-4" resizeMode="contain" tintColor="#5D5F6D" />
                            <TextInput
                                placeholder="Search restaurants..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                className="flex-1 body-medium text-dark-100"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>

                        {/* Cuisine filters */}
                        <FlatList
                            data={CUISINE_FILTERS}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(c) => c}
                            contentContainerStyle={{ gap: 8, paddingBottom: 16 }}
                            renderItem={({ item: cuisine }) => {
                                const active = selectedCuisine === cuisine;
                                return (
                                    <TouchableOpacity
                                        onPress={() => setSelectedCuisine(cuisine)}
                                        className={`px-5 py-2.5 rounded-full ${active ? 'bg-primary' : 'bg-gray-100'}`}
                                    >
                                        <Text className={`body-medium ${active ? 'text-white' : 'text-dark-100'}`}>{cuisine}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />

                        <Text className="body-regular text-gray-200 mb-4">{filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} found</Text>
                    </View>
                )}
                ListEmptyComponent={() => (
                    <View className="items-center justify-center py-20">
                        <Text style={{ fontSize: 48, marginBottom: 16 }}>🍽️</Text>
                        <Text className="h3-bold text-dark-100 text-center">No restaurants found</Text>
                        <Text className="paragraph-medium text-gray-200 text-center mt-2">Try a different filter or search term</Text>
                    </View>
                )}
            />
        </SafeAreaView>
    );
}
