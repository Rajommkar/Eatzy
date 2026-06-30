import {
    View, Text, ScrollView, TouchableOpacity,
    Image, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useState } from 'react';
import { useCartStore } from '@/store/cart.store';
import { images } from '@/constants';
import * as MailComposer from 'expo-mail-composer';
import useAuthStore from '@/store/auth.store';

type PaymentMethod = 'upi' | 'card' | 'cod';
type UpiApp = 'gpay' | 'phonepe' | 'paytm';

const UPI_APPS = [
    { id: 'gpay' as UpiApp, name: 'Google Pay', emoji: '🟢', color: '#1A73E8', bg: '#EBF3FE' },
    { id: 'phonepe' as UpiApp, name: 'PhonePe', emoji: '🟣', color: '#6739B7', bg: '#F3EEFF' },
    { id: 'paytm' as UpiApp, name: 'Paytm', emoji: '🔵', color: '#00BAF2', bg: '#E6F8FF' },
];

export default function Payment() {
    const { items, getTotalPrice, clearCart } = useCartStore();
    const { user } = useAuthStore();
    const [method, setMethod] = useState<PaymentMethod>('upi');
    const [upiApp, setUpiApp] = useState<UpiApp>('gpay');
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const subtotal = getTotalPrice();
    const delivery = 49;
    const discount = 10;
    const total = subtotal + delivery - discount;
    const orderId = `EZY${Math.floor(100000 + Math.random() * 900000)}`;

    const sendOrderEmail = async () => {
        try {
            const isAvailable = await MailComposer.isAvailableAsync();
            if (!isAvailable) return;

            const itemLines = items.map(item =>
                `${item.name} x${item.quantity}${item.customizations?.length ? ' (+ ' + item.customizations.map(c => c.name).join(', ') + ')' : ''} — ₹${(item.price * item.quantity).toFixed(2)}`
            ).join('\n');

            const body = `Congratulations on ordering food! This is your food details:

Order ID: ${orderId}

Order Summary:
${itemLines}

Total: Rs. ${total.toFixed(2)}

Thank you for choosing Eatzy!`;

            await MailComposer.composeAsync({
                recipients: user?.email ? [user.email] : [],
                subject: `🍕 Order Confirmed! #${orderId} — Eatzy`,
                body,
            });
            setEmailSent(true);
        } catch {
            // Email failed silently — don't block flow
        }
    };

    const handlePay = () => {
        setProcessing(true);
        setTimeout(async () => {
            clearCart();
            await sendOrderEmail();
            setProcessing(false);
            setSuccess(true);
            setTimeout(() => {
                router.replace('/tracking' as never);
            }, 2000);
        }, 2500);
    };

    if (success) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-8">
                <View className="size-28 bg-green-100 rounded-full items-center justify-center mb-6">
                    <Text style={{ fontSize: 56 }}>🎉</Text>
                </View>
                <Text className="h3-bold text-dark-100 text-center mb-2">Order Placed!</Text>
                <Text className="paragraph-medium text-gray-200 text-center mb-3">
                    Your order has been placed successfully.
                </Text>
                {user?.email && (
                    <View className="flex-row items-center gap-x-2 bg-green-50 rounded-full px-4 py-2 mb-4">
                        <Text style={{ fontSize: 16 }}>📧</Text>
                        <Text className="body-medium text-green-700">Bill sent to {user.email}</Text>
                    </View>
                )}
                <Text className="body-regular text-gray-200 text-center">Redirecting to tracking...</Text>
                <ActivityIndicator size="small" color="#FE8C00" style={{ marginTop: 16 }} />
            </View>
        );
    }

    if (processing) {
        return (
            <View className="flex-1 bg-white items-center justify-center px-8">
                <ActivityIndicator size="large" color="#FE8C00" />
                <Text className="h3-bold text-dark-100 text-center mt-6 mb-2">Processing Payment</Text>
                <Text className="paragraph-medium text-gray-200 text-center">
                    Please wait while we confirm your payment...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header */}
            <View className="flex-row items-center px-5 pt-2 pb-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="size-10 rounded-full bg-gray-100 items-center justify-center mr-4">
                    <Image source={images.arrowBack} className="size-5" resizeMode="contain" />
                </TouchableOpacity>
                <Text className="h3-bold text-dark-100">Payment</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 20, paddingTop: 16 }}>

                {/* Order Summary */}
                <Text className="base-bold text-dark-100 mb-3">🛒 Order Summary</Text>
                <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                    {items.map((item, idx) => (
                        <View key={`${item.id}_${idx}`} className="flex-row items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <View className="flex-1 pr-3">
                                <Text className="paragraph-bold text-dark-100" numberOfLines={1}>{item.name}</Text>
                                {item.customizations && item.customizations.length > 0 && (
                                    <Text className="body-regular text-gray-200" numberOfLines={1}>
                                        + {item.customizations.map(c => c.name).join(', ')}
                                    </Text>
                                )}
                            </View>
                            <Text className="body-medium text-gray-200 mr-4">x{item.quantity}</Text>
                            <Text className="paragraph-bold text-dark-100">₹{(item.price * item.quantity).toFixed(0)}</Text>
                        </View>
                    ))}

                    <View className="border-t border-gray-200 mt-3 pt-3 gap-y-1">
                        <View className="flex-row justify-between">
                            <Text className="body-medium text-gray-200">Subtotal</Text>
                            <Text className="body-medium text-dark-100">₹{subtotal.toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="body-medium text-gray-200">Delivery Fee</Text>
                            <Text className="body-medium text-dark-100">₹{delivery.toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="body-medium text-gray-200">Discount</Text>
                            <Text className="body-medium text-green-500">− ₹{discount.toFixed(2)}</Text>
                        </View>
                        <View className="border-t border-gray-200 mt-2 pt-2 flex-row justify-between">
                            <Text className="paragraph-bold text-dark-100">Total</Text>
                            <Text className="paragraph-bold text-primary">₹{total.toFixed(2)}</Text>
                        </View>
                    </View>
                </View>

                {/* Payment Method */}
                <Text className="base-bold text-dark-100 mb-3">💳 Payment Method</Text>
                <View className="gap-y-3 mb-6">
                    {/* UPI */}
                    <TouchableOpacity
                        onPress={() => setMethod('upi')}
                        className={`rounded-2xl border-2 p-4 ${method === 'upi' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                        style={Platform.OS === 'android' ? { elevation: 2 } : {}}
                    >
                        <View className="flex-row items-center justify-between mb-3">
                            <View className="flex-row items-center gap-x-3">
                                <Text style={{ fontSize: 22 }}>📱</Text>
                                <Text className="paragraph-bold text-dark-100">UPI Payment</Text>
                            </View>
                            <View className={`size-5 rounded-full border-2 items-center justify-center ${method === 'upi' ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}>
                                {method === 'upi' && <View className="size-2 bg-white rounded-full" />}
                            </View>
                        </View>

                        {method === 'upi' && (
                            <View className="flex-row gap-x-3 mt-1">
                                {UPI_APPS.map((app) => (
                                    <TouchableOpacity
                                        key={app.id}
                                        onPress={() => setUpiApp(app.id)}
                                        className="flex-1 items-center py-3 rounded-xl"
                                        style={{ backgroundColor: upiApp === app.id ? app.bg : '#F9FAFB', borderWidth: 1.5, borderColor: upiApp === app.id ? app.color : '#E5E7EB' }}
                                    >
                                        <Text style={{ fontSize: 20, marginBottom: 4 }}>{app.emoji}</Text>
                                        <Text className="body-medium text-dark-100" style={{ color: upiApp === app.id ? app.color : '#374151', fontSize: 11 }}>{app.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Card */}
                    <TouchableOpacity
                        onPress={() => setMethod('card')}
                        className={`rounded-2xl border-2 p-4 ${method === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                        style={Platform.OS === 'android' ? { elevation: 2 } : {}}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-x-3">
                                <Text style={{ fontSize: 22 }}>💳</Text>
                                <View>
                                    <Text className="paragraph-bold text-dark-100">Credit / Debit Card</Text>
                                    <Text className="body-regular text-gray-200">Visa, Mastercard, RuPay</Text>
                                </View>
                            </View>
                            <View className={`size-5 rounded-full border-2 items-center justify-center ${method === 'card' ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}>
                                {method === 'card' && <View className="size-2 bg-white rounded-full" />}
                            </View>
                        </View>
                    </TouchableOpacity>

                    {/* COD */}
                    <TouchableOpacity
                        onPress={() => setMethod('cod')}
                        className={`rounded-2xl border-2 p-4 ${method === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}
                        style={Platform.OS === 'android' ? { elevation: 2 } : {}}
                    >
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center gap-x-3">
                                <Text style={{ fontSize: 22 }}>💵</Text>
                                <View>
                                    <Text className="paragraph-bold text-dark-100">Cash on Delivery</Text>
                                    <Text className="body-regular text-gray-200">Pay when your order arrives</Text>
                                </View>
                            </View>
                            <View className={`size-5 rounded-full border-2 items-center justify-center ${method === 'cod' ? 'border-primary bg-primary' : 'border-gray-300 bg-white'}`}>
                                {method === 'cod' && <View className="size-2 bg-white rounded-full" />}
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Delivery Address */}
                <Text className="base-bold text-dark-100 mb-3">📍 Delivery Address</Text>
                <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center gap-x-3">
                    <Image source={images.location} className="size-5" resizeMode="contain" tintColor="#FE8C00" />
                    <View className="flex-1">
                        <Text className="paragraph-bold text-dark-100">Home</Text>
                        <Text className="body-regular text-gray-200">Your delivery address will be used</Text>
                    </View>
                    <TouchableOpacity>
                        <Text className="body-medium text-primary">Change</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Pay CTA */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white px-5 py-4"
                style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingBottom: Platform.OS === 'android' ? 16 : 28 }}
            >
                <TouchableOpacity
                    onPress={handlePay}
                    className="bg-primary rounded-full py-4 items-center justify-center"
                    activeOpacity={0.85}
                >
                    <Text className="paragraph-bold text-white text-base">
                        {method === 'cod' ? '🚀 Place Order — ₹' : '💳 Pay Now — ₹'}{total.toFixed(2)}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
