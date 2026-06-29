import {View, Text, TextInput, TouchableOpacity} from 'react-native'
import {CustomInputProps} from "@/type";
import {useState} from "react";
import cn from "clsx";
import { Feather } from '@expo/vector-icons';

const CustomInput = ({
    placeholder = 'Enter text',
    value,
    onChangeText,
    label,
    secureTextEntry = false,
    keyboardType="default"
}: CustomInputProps) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPasswordField = secureTextEntry;

    return (
        <View className="w-full">
            <Text className="label">{label}</Text>

            <View className={cn('input flex-row items-center', isFocused ? 'border-primary' : 'border-gray-300')}>
                <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={isPasswordField && !isPasswordVisible}
                    keyboardType={keyboardType}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    placeholderTextColor="#888"
                    className="flex-1 text-dark-100 font-quicksand-medium text-base"
                />
                {isPasswordField && (
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} className="p-2">
                        <Feather name={isPasswordVisible ? "eye" : "eye-off"} size={20} color="#888" />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    )
}
export default CustomInput
