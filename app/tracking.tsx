import {
    View, Text, ScrollView, TouchableOpacity,
    Image, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { images } from '@/constants';

const STEPS = [
    { id: 1, title: 'Order Placed', subtitle: 'Your order has been received', emoji: '✅', delay: 0 },
    { id: 2, title: 'Preparing', subtitle: 'The restaurant is preparing your food', emoji: '👨‍🍳', delay: 3000 },
    { id: 3, title: 'Out for Delivery', subtitle: 'Your rider is on the way', emoji: '🛵', delay: 7000 },
    { id: 4, title: 'Delivered', subtitle: 'Enjoy your meal!', emoji: '🎉', delay: 12000 },
];

const RIDER = { name: 'Rahul Kumar', rating: 4.8, vehicleNo: 'MH 02 AB 1234' };

function useCountdown(seconds: number) {
    const [remaining, setRemaining] = useState(seconds);
    useEffect(() => {
        if (remaining <= 0) return;
        const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
        return () => clearTimeout(t);
    }, [remaining]);
    return remaining;
}

export default function Tracking() {
    const [activeStep, setActiveStep] = useState(0);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const riderAnim = useRef(new Animated.Value(0)).current;
    const eta = useCountdown(25 * 60); // 25 min countdown

    const etaMin = Math.floor(eta / 60);
    const etaSec = eta % 60;

    // Animate through delivery steps
    useEffect(() => {
        STEPS.forEach((step, idx) => {
            if (idx === 0) { setActiveStep(0); return; }
            const t = setTimeout(() => setActiveStep(idx), step.delay);
            return () => clearTimeout(t);
        });
    }, []);

    // Pulse animation for active step
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, [pulseAnim]);

    // Rider slide in when step >= 2
    useEffect(() => {
        if (activeStep >= 2) {
            Animated.spring(riderAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
        }
    }, [activeStep, riderAnim]);

    const orderId = `EZY${Math.floor(100000 + Math.random() * 900000)}`;

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-5 pt-2 pb-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.replace('/(tabs)' as never)} className="size-10 rounded-full bg-gray-100 items-center justify-center mr-4">
                    <Image source={images.arrowBack} className="size-5" resizeMode="contain" />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="h3-bold text-dark-100">Live Tracking</Text>
                    <Text className="body-regular text-gray-200">Order #{orderId}</Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>

                {/* ETA Card */}
                <View className="bg-primary rounded-3xl p-5 mb-6 flex-row items-center justify-between"
                    style={{ elevation: Platform.OS === 'android' ? 8 : 0 }}>
                    <View>
                        <Text className="body-medium text-white/80">Estimated Arrival</Text>
                        <Text className="h1-bold text-white mt-1">
                            {activeStep >= 3 ? '🎉 Delivered!' : `${etaMin}:${etaSec.toString().padStart(2, '0')} min`}
                        </Text>
                        <Text className="body-regular text-white/70 mt-1">
                            {STEPS[activeStep]?.title ?? 'On the way'}
                        </Text>
                    </View>
                    <Animated.View style={{ transform: [{ scale: activeStep < 3 ? pulseAnim : 1 }] }}>
                        <Text style={{ fontSize: 52 }}>{STEPS[activeStep]?.emoji ?? '✅'}</Text>
                    </Animated.View>
                </View>

                {/* Delivery Timeline */}
                <Text className="base-bold text-dark-100 mb-4">Delivery Progress</Text>
                <View className="mb-6">
                    {STEPS.map((step, idx) => {
                        const isDone = idx < activeStep;
                        const isActive = idx === activeStep;
                        return (
                            <View key={step.id} className="flex-row">
                                {/* Line + dot */}
                                <View className="items-center mr-4" style={{ width: 32 }}>
                                    <Animated.View
                                        style={[
                                            {
                                                width: 32, height: 32, borderRadius: 16,
                                                alignItems: 'center', justifyContent: 'center',
                                                backgroundColor: isDone ? '#FE8C00' : isActive ? '#FFF5EB' : '#F3F4F6',
                                                borderWidth: isActive ? 2 : 0,
                                                borderColor: '#FE8C00',
                                            },
                                            isActive ? { transform: [{ scale: pulseAnim }] } : {},
                                        ]}
                                    >
                                        {isDone
                                            ? <Text style={{ fontSize: 16 }}>✓</Text>
                                            : <Text style={{ fontSize: 16 }}>{step.emoji}</Text>}
                                    </Animated.View>
                                    {idx < STEPS.length - 1 && (
                                        <View style={{
                                            width: 2, flex: 1, minHeight: 32,
                                            backgroundColor: isDone ? '#FE8C00' : '#E5E7EB',
                                            marginVertical: 4,
                                        }} />
                                    )}
                                </View>

                                {/* Content */}
                                <View className="flex-1 pb-6">
                                    <Text className={`paragraph-bold ${isActive || isDone ? 'text-dark-100' : 'text-gray-200'}`}>
                                        {step.title}
                                    </Text>
                                    <Text className="body-regular text-gray-200 mt-0.5">{step.subtitle}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Rider Card — visible from step 2 */}
                <Animated.View style={{
                    opacity: riderAnim,
                    transform: [{ translateY: riderAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
                }}>
                    <Text className="base-bold text-dark-100 mb-3">Your Delivery Rider</Text>
                    <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center gap-x-4 mb-6"
                        style={{ elevation: Platform.OS === 'android' ? 2 : 0 }}>
                        <View className="size-14 bg-primary/20 rounded-full items-center justify-center">
                            <Text style={{ fontSize: 28 }}>🧑‍🦱</Text>
                        </View>
                        <View className="flex-1">
                            <Text className="paragraph-bold text-dark-100">{RIDER.name}</Text>
                            <Text className="body-regular text-gray-200">{RIDER.vehicleNo}</Text>
                            <View className="flex-row items-center mt-1 gap-x-1">
                                <Text style={{ color: '#FE8C00', fontSize: 13 }}>★</Text>
                                <Text className="body-medium text-dark-100">{RIDER.rating}</Text>
                            </View>
                        </View>
                        <View className="flex-row gap-x-3">
                            <TouchableOpacity className="size-10 bg-primary rounded-full items-center justify-center">
                                <Text style={{ fontSize: 18 }}>📞</Text>
                            </TouchableOpacity>
                            <TouchableOpacity className="size-10 bg-dark-100 rounded-full items-center justify-center">
                                <Text style={{ fontSize: 18 }}>💬</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>

                {/* Map Placeholder */}
                <Text className="base-bold text-dark-100 mb-3">Live Location</Text>
                <View className="rounded-2xl overflow-hidden mb-6" style={{ height: 180, backgroundColor: '#E8F5E9' }}>
                    <View className="flex-1 items-center justify-center gap-y-2">
                        <Text style={{ fontSize: 40 }}>🗺️</Text>
                        <Text className="paragraph-bold text-dark-100">Rider en route</Text>
                        <Text className="body-regular text-gray-200">Real-time GPS tracking</Text>
                        {activeStep >= 2 && (
                            <View className="flex-row items-center gap-x-2 bg-white rounded-full px-4 py-2 mt-1"
                                style={{ elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 }}>
                                <Text style={{ fontSize: 16 }}>🛵</Text>
                                <Text className="body-medium text-dark-100">Rahul is 1.2 km away</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Back to Home */}
                {activeStep >= 3 && (
                    <TouchableOpacity
                        onPress={() => router.replace('/(tabs)' as never)}
                        className="bg-primary rounded-full py-4 items-center"
                        activeOpacity={0.85}
                    >
                        <Text className="paragraph-bold text-white">🏠 Back to Home</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
