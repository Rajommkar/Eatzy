import { View, Text, Alert } from 'react-native';
import { router, useLocalSearchParams } from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import { useState, useEffect } from "react";
import { resetPassword } from "@/lib/appwrite";
import CustomHeader from "@/components/CustomHeader";
import { SafeAreaView } from 'react-native-safe-area-context';

const ResetPassword = () => {
    const params = useLocalSearchParams<{ userId?: string, secret?: string }>();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verificationLink, setVerificationLink] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        // If the user arrived here via deep link, we can pre-fill or parse automatically
        if (params.userId && params.secret) {
            setVerificationLink(`https://eatzy.app/reset?userId=${params.userId}&secret=${params.secret}`);
        }
    }, [params]);

    const submit = async () => {
        if (!verificationLink) return Alert.alert('Error', 'Please paste the verification link.');
        if (!password || !confirmPassword) return Alert.alert('Error', 'Please enter your new password.');
        if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match.');
        if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters long.');

        setIsSubmitting(true);

        try {
            // Extract userId and secret from the pasted link
            let userId = params.userId;
            let secret = params.secret;

            if (verificationLink.includes('userId=') && verificationLink.includes('secret=')) {
                const urlParams = new URLSearchParams(verificationLink.split('?')[1]);
                userId = urlParams.get('userId') || userId;
                secret = urlParams.get('secret') || secret;
            }

            if (!userId || !secret) {
                throw new Error('Invalid verification link. Please make sure you copied the entire link from your email.');
            }

            await resetPassword(userId, secret, password);
            Alert.alert('Success', 'Your password has been reset successfully. You can now login.');
            router.replace('/(auth)/sign-in' as never);
        } catch (err) {
            const error = err as Error;
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="bg-white h-full px-5 pt-5">
            <CustomHeader title="Reset Password" />
            
            <View className="gap-6 mt-10">
                <Text className="base-medium text-gray-200">
                    Paste the verification link you received in your email and create a new password.
                </Text>

                <CustomInput
                    placeholder="Paste the full link here..."
                    value={verificationLink}
                    onChangeText={setVerificationLink}
                    label="Verification Link"
                />

                <CustomInput
                    placeholder="Enter new password"
                    value={password}
                    onChangeText={setPassword}
                    label="New Password"
                    secureTextEntry={true}
                />

                <CustomInput
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    label="Confirm Password"
                    secureTextEntry={true}
                />

                <View className="mt-4">
                    <CustomButton
                        title="Reset Password"
                        isLoading={isSubmitting}
                        onPress={submit}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ResetPassword;
