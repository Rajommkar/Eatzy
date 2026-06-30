import {
    View, Text, Image, ScrollView, TouchableOpacity,
    Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { getMenuById } from '@/lib/appwrite';
import { useCartStore } from '@/store/cart.store';
import { images } from '@/constants';
import { LocalCustomization, LocalMenuItem } from '@/type';

const { width } = Dimensions.get('window');

const StarRow = ({ rating }: { rating: number }) => (
    <View className="flex-row items-center gap-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <Text key={star} style={{ fontSize: 14, color: star <= Math.round(rating) ? '#FE8C00' : '#D1D5DB' }}>★</Text>
        ))}
        <Text className="body-medium text-gray-200 ml-1">{rating.toFixed(1)}</Text>
    </View>
);

export default function FoodDetail() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [item, setItem] = useState<LocalMenuItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedCustomizations, setSelectedCustomizations] = useState<LocalCustomization[]>([]);
    const { addItem, items } = useCartStore();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getMenuById(id as string);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setItem(data as any);
            setLoading(false);
        };
        if (id) load();
    }, [id]);

    const toggleCustomization = (cus: LocalCustomization) => {
        setSelectedCustomizations((prev) => {
            const exists = prev.find((c) => c.id === cus.id);
            return exists ? prev.filter((c) => c.id !== cus.id) : [...prev, cus];
        });
    };

    const totalPrice = item
        ? (item.price + selectedCustomizations.reduce((s, c) => s + c.price, 0)) * quantity
        : 0;

    const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

    const handleAddToCart = () => {
        if (!item) return;
        for (let i = 0; i < quantity; i++) {
            addItem({
                id: item.$id,
                name: item.name,
                price: item.price + selectedCustomizations.reduce((s, c) => s + c.price, 0),
                image_url: item.image_url,
                customizations: selectedCustomizations.map((c) => ({
                    id: c.id, name: c.name, price: c.price, type: c.type,
                })),
            });
        }
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#FE8C00" />
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
                <Text className="h3-bold text-dark-100 text-center">Item not found</Text>
                <TouchableOpacity className="mt-6 bg-primary rounded-full px-8 py-4" onPress={() => router.back()}>
                    <Text className="paragraph-bold text-white">Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const toppings = item.customizationList.filter((c) => c.type === 'topping');
    const sides = item.customizationList.filter((c) => c.type === 'side');

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <SafeAreaView edges={['top']} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
                <View className="flex-row items-center justify-between px-5 pt-2">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="size-10 rounded-full bg-white items-center justify-center"
                        style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6 }}
                    >
                        <Image source={images.arrowBack} className="size-5" resizeMode="contain" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/cart' as never)}
                        className="size-10 rounded-full bg-dark-100 items-center justify-center relative"
                    >
                        <Image source={images.bag} className="size-5" resizeMode="contain" tintColor="#ffffff" />
                        {cartCount > 0 && (
                            <View className="absolute -top-1 -right-1 size-5 bg-primary rounded-full items-center justify-center">
                                <Text className="text-white text-xs font-quicksand-bold">{cartCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Hero Image */}
                <View style={{ width, height: 300, backgroundColor: '#FFF5EB', alignItems: 'center', justifyContent: 'center' }}>
                    <Image
                        source={{ uri: item.image_url }}
                        style={{ width: width * 0.75, height: 260 }}
                        resizeMode="contain"
                    />
                </View>

                {/* Content */}
                <View className="px-5 pt-5">
                    {/* Name + Category Badge */}
                    <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 pr-4">
                            <Text className="h3-bold text-dark-100" style={{ fontSize: 24 }}>{item.name}</Text>
                        </View>
                        <View className="bg-primary/10 rounded-full px-3 py-1">
                            <Text className="small-bold text-primary">{item.category_name}</Text>
                        </View>
                    </View>

                    {/* Rating */}
                    <StarRow rating={item.rating} />

                    {/* Description */}
                    <Text className="paragraph-medium text-gray-200 mt-3 leading-6">{item.description}</Text>

                    {/* Nutrition */}
                    <View className="flex-row justify-between mt-5 bg-gray-50 rounded-2xl p-4">
                        <View className="items-center flex-1">
                            <Text className="h3-bold text-primary">{item.calories}</Text>
                            <Text className="small-bold text-gray-200 mt-0.5">CALORIES</Text>
                        </View>
                        <View className="w-px bg-gray-200" />
                        <View className="items-center flex-1">
                            <Text className="h3-bold text-primary">{item.protein}g</Text>
                            <Text className="small-bold text-gray-200 mt-0.5">PROTEIN</Text>
                        </View>
                        <View className="w-px bg-gray-200" />
                        <View className="items-center flex-1">
                            <Text className="h3-bold text-primary">★{item.rating}</Text>
                            <Text className="small-bold text-gray-200 mt-0.5">RATING</Text>
                        </View>
                    </View>

                    {/* Toppings */}
                    {toppings.length > 0 && (
                        <View className="mt-6">
                            <Text className="base-bold text-dark-100 mb-3">🧀 Add Toppings</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {toppings.map((cus) => {
                                    const selected = !!selectedCustomizations.find((c) => c.id === cus.id);
                                    return (
                                        <TouchableOpacity
                                            key={cus.id}
                                            onPress={() => toggleCustomization(cus)}
                                            className={`flex-row items-center px-4 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                            style={Platform.OS === 'android' ? { elevation: selected ? 0 : 2 } : {}}
                                        >
                                            <Text className={`body-medium ${selected ? 'text-white' : 'text-dark-100'}`}>{cus.name}</Text>
                                            <Text className={`body-medium ml-1 ${selected ? 'text-white/80' : 'text-gray-200'}`}>+₹{cus.price}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Sides */}
                    {sides.length > 0 && (
                        <View className="mt-6">
                            <Text className="base-bold text-dark-100 mb-3">🍟 Add Sides</Text>
                            <View className="flex-row flex-wrap gap-2">
                                {sides.map((cus) => {
                                    const selected = !!selectedCustomizations.find((c) => c.id === cus.id);
                                    return (
                                        <TouchableOpacity
                                            key={cus.id}
                                            onPress={() => toggleCustomization(cus)}
                                            className={`flex-row items-center px-4 py-2 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                            style={Platform.OS === 'android' ? { elevation: selected ? 0 : 2 } : {}}
                                        >
                                            <Text className={`body-medium ${selected ? 'text-white' : 'text-dark-100'}`}>{cus.name}</Text>
                                            <Text className={`body-medium ml-1 ${selected ? 'text-white/80' : 'text-gray-200'}`}>+₹{cus.price}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* Quantity */}
                    <View className="mt-6 flex-row items-center justify-between">
                        <Text className="base-bold text-dark-100">Quantity</Text>
                        <View className="flex-row items-center gap-x-4">
                            <TouchableOpacity
                                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="size-10 rounded-full bg-primary/10 items-center justify-center"
                            >
                                <Text className="paragraph-bold text-primary text-xl">−</Text>
                            </TouchableOpacity>
                            <Text className="h3-bold text-dark-100 w-6 text-center">{quantity}</Text>
                            <TouchableOpacity
                                onPress={() => setQuantity((q) => q + 1)}
                                className="size-10 rounded-full bg-primary items-center justify-center"
                            >
                                <Text className="paragraph-bold text-white text-xl">+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom CTA */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4"
                style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: Platform.OS === 'android' ? 16 : 28 }}
            >
                <TouchableOpacity
                    onPress={handleAddToCart}
                    className="bg-primary rounded-full py-4 flex-row items-center justify-center gap-x-3"
                    activeOpacity={0.85}
                >
                    <Image source={images.bag} className="size-5" resizeMode="contain" tintColor="#ffffff" />
                    <Text className="paragraph-bold text-white text-base">Add to Cart — ₹{totalPrice.toFixed(2)}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
