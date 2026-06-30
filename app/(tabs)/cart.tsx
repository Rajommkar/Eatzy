import {View, Text, FlatList, Image, TouchableOpacity} from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import {useCartStore} from "@/store/cart.store";
import CustomHeader from "@/components/CustomHeader";
import cn from "clsx";
import CustomButton from "@/components/CustomButton";
import CartItem from "@/components/CartItem";
import { PaymentInfoStripeProps } from "@/type";
import { images } from "@/constants";
import { router } from "expo-router";

const PaymentInfoStripe = ({ label,  value,  labelStyle,  valueStyle, }: PaymentInfoStripeProps) => (
    <View className="flex-between flex-row my-1">
        <Text className={cn("paragraph-medium text-gray-200", labelStyle)}>
            {label}
        </Text>
        <Text className={cn("paragraph-bold text-dark-100", valueStyle)}>
            {value}
        </Text>
    </View>
);

const EmptyCart = () => (
    <View className="flex-1 items-center justify-center px-8 mt-16">
        <View className="bg-primary/10 rounded-full p-8 mb-6">
            <Image
                source={images.bag}
                className="size-16"
                resizeMode="contain"
                tintColor="#FE8C00"
            />
        </View>
        <Text className="h3-bold text-dark-100 text-center mb-2">
            Your cart is empty!
        </Text>
        <Text className="paragraph-medium text-gray-200 text-center mb-8 leading-6">
            Looks like you haven't added anything yet. Explore our menu and find something delicious!
        </Text>
        <TouchableOpacity
            className="bg-primary rounded-full px-10 py-4 flex-row items-center gap-x-2"
            onPress={() => router.push('/(tabs)/search' as never)}
            activeOpacity={0.8}
        >
            <Image source={images.search} className="size-5" resizeMode="contain" tintColor="#ffffff" />
            <Text className="paragraph-bold text-white">Browse Menu</Text>
        </TouchableOpacity>
    </View>
);

const Cart = () => {
    const { items, getTotalItems, getTotalPrice } = useCartStore();

    const totalItems = getTotalItems();
    const totalPrice = getTotalPrice();

    return (
        <SafeAreaView className="bg-white h-full">
            <FlatList
                data={items}
                renderItem={({ item }) => <CartItem item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerClassName="pb-28 px-5 pt-5"
                ListHeaderComponent={() => <CustomHeader title="Your Cart" />}
                ListEmptyComponent={() => <EmptyCart />}
                ListFooterComponent={() => totalItems > 0 && (
                    <View className="gap-5">
                        <View className="mt-6 border border-gray-200 p-5 rounded-2xl">
                            <Text className="h3-bold text-dark-100 mb-5">
                                Payment Summary
                            </Text>

                            <PaymentInfoStripe
                                label={`Total Items (${totalItems})`}
                                value={`₹${totalPrice.toFixed(2)}`}
                            />
                            <PaymentInfoStripe
                                label={`Delivery Fee`}
                                value={`₹49.00`}
                            />
                            <PaymentInfoStripe
                                label={`Discount`}
                                value={`- ₹10.00`}
                                valueStyle="!text-success"
                            />
                            <View className="border-t border-gray-300 my-2" />
                            <PaymentInfoStripe
                                label={`Total`}
                                value={`₹${(totalPrice + 49 - 10).toFixed(2)}`}
                                labelStyle="base-bold !text-dark-100"
                                valueStyle="base-bold !text-dark-100 !text-right"
                            />
                        </View>

                        <CustomButton
                            title="Proceed to Payment 💳"
                            onPress={() => router.push('/payment' as never)}
                        />
                    </View>
                )}
            />
        </SafeAreaView>
    )
}

export default Cart
