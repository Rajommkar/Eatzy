import {images} from "@/constants";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useCallback } from "react";
import { Image, TextInput, TouchableOpacity, View } from "react-native";

const Searchbar = () => {
    const params = useLocalSearchParams<{ query: string }>();
    const [query, setQuery] = useState(params.query ?? '');

    // Debounce: update route param 400ms after user stops typing
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((text: string) => {
        setQuery(text);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            if (text.trim()) {
                router.setParams({ query: text.trim() });
            } else {
                router.setParams({ query: undefined });
            }
        }, 400);
    }, []);

    const handleSubmit = () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (query?.trim()) router.setParams({ query: query.trim() });
        else router.setParams({ query: undefined });
    };

    return (
        <View className="searchbar">
            <TextInput
                className="flex-1 p-5"
                placeholder="Search for pizzas, burgers..."
                value={query}
                onChangeText={handleSearch}
                onSubmitEditing={handleSubmit}
                placeholderTextColor="#A0A0A0"
                returnKeyType="search"
                autoCorrect={false}
            />
            <TouchableOpacity
                className="pr-5"
                onPress={handleSubmit}
            >
                <Image
                    source={images.search}
                    className="size-6"
                    resizeMode="contain"
                    tintColor="#5D5F6D"
                />
            </TouchableOpacity>
        </View>
    );
};

export default Searchbar;
