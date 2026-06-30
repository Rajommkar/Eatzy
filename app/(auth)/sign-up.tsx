import {View, Text, Alert, ScrollView} from 'react-native'
import {Link, router} from "expo-router";
import CustomInput from "@/components/CustomInput";
import CustomButton from "@/components/CustomButton";
import {useState} from "react";
import {createUser} from "@/lib/appwrite";
import useAuthStore from "@/store/auth.store";

const SignUp = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
    const { fetchAuthenticatedUser } = useAuthStore();

    const submit = async () => {
        const { name, email, phone, password } = form;

        if (!name || !email || !password) {
            return Alert.alert('Error', 'Please fill in all required fields.');
        }

        // Validate phone if provided
        if (phone && !/^\+?[0-9]{10,13}$/.test(phone.replace(/\s/g, ''))) {
            return Alert.alert('Error', 'Please enter a valid phone number (10–13 digits).');
        }

        setIsSubmitting(true);

        try {
            await createUser({ email, password, name, phone });
            await fetchAuthenticatedUser();
            router.replace('/');
        } catch(err) {
            const error = err as Error;
            Alert.alert('Error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View className="gap-8 bg-white rounded-lg p-5 mt-5">
                <CustomInput
                    placeholder="Enter your full name"
                    value={form.name}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
                    label="Full Name *"
                />
                <CustomInput
                    placeholder="Enter your email"
                    value={form.email}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
                    label="Email Address *"
                    keyboardType="email-address"
                />
                <CustomInput
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
                    label="Mobile Number"
                    keyboardType="phone-pad"
                />
                <CustomInput
                    placeholder="Create a password"
                    value={form.password}
                    onChangeText={(text) => setForm((prev) => ({ ...prev, password: text }))}
                    label="Password *"
                    secureTextEntry={true}
                />

                <CustomButton
                    title="Create Account"
                    isLoading={isSubmitting}
                    onPress={submit}
                />

                <View className="flex justify-center mt-3 flex-row gap-2">
                    <Text className="base-regular text-gray-100">
                        Already have an account?
                    </Text>
                    <Link href={"/(auth)/sign-in" as never}>
                        <Text className="base-bold text-primary">Sign In</Text>
                    </Link>
                </View>
            </View>
        </ScrollView>
    )
}

export default SignUp
