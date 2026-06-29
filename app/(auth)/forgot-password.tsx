import { View, Text, Alert } from 'react-native';
import { router } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState } from "react";
import { sendPasswordRecovery } from "@/lib/appwrite";
import CustomHeader from "@/components/CustomHeader";
import { SafeAreaView } from 'react-native-safe-area-context';

const ForgotPassword = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [email, setEmail] = useState('');

    const submit = async () => {
        if (!email) return Alert.alert('Error', 'Please enter a valid email address.');

        setIsSubmitting(true);

        try {
            await sendPasswordRecovery(email);
            Alert.alert('Success', 'Verification link has been sent to your email.');
            router.push('/(auth)/reset-password' as never);
        } catch (err) {
            const error = err as Error;
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="bg-white h-full px-5 pt-5">
            <CustomHeader title="Forgot Password" />
            
            <View className="gap-8 mt-10">
                <Text className="base-medium text-gray-200">
                    Enter your registered email address. We will send a verification link to reset your password.
                </Text>

                <CustomInput
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    label="Email Address"
                    keyboardType="email-address"
                />

                <CustomButton
                    title="Send Verification Link"
                    isLoading={isSubmitting}
                    onPress={submit}
                />
            </View>
        </SafeAreaView>
    );
};

export default ForgotPassword;
