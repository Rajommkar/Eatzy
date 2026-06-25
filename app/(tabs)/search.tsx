import {FlatList, Text, View, Image} from 'react-native'
import {SafeAreaView} from "react-native-safe-area-context";
import useAppwrite from "@/lib/useAppwrite";
import {getCategories, getMenu} from "@/lib/appwrite";
import {useLocalSearchParams} from "expo-router";
import {useEffect} from "react";
import CartButton from "@/components/CartButton";
import cn from "clsx";
import MenuCard from "@/components/MenuCard";
import {MenuItem, Category} from "@/type";

import Filter from "@/components/Filter";
import SearchBar from "@/components/SearchBar";
import { images } from "@/constants";

const EmptySearch = ({ query }: { query?: string }) => (
    <View className="flex-1 items-center justify-center px-8 mt-12">
        <View className="bg-primary/10 rounded-full p-8 mb-6">
            <Image source={images.search} className="size-16" resizeMode="contain" tintColor="#FE8C00" />
        </View>
        <Text className="h3-bold text-dark-100 text-center mb-2">
            {query ? 'No results found' : 'No food items yet'}
        </Text>
        <Text className="paragraph-medium text-gray-200 text-center leading-6">
            {query
                ? `We couldn't find anything for "${query}". Try a different keyword!`
                : 'Go to your Profile and tap "⚡ Setup Menu Data" to load all foods.'}
        </Text>
    </View>
)

const Search = () => {
    const { category, query } = useLocalSearchParams<{query: string; category: string}>()

    const { data, refetch, loading } = useAppwrite({ fn: getMenu, params: { category,  query,  limit: 20, } });
    const { data: categories } = useAppwrite({ fn: getCategories });

    useEffect(() => {
        refetch({ category, query, limit: 20})
    }, [category, query]);

    return (
        <SafeAreaView className="bg-white h-full">
            <FlatList
                data={data}
                renderItem={({ item, index }) => {
                    const isFirstRightColItem = index % 2 === 0;

                    return (
                        <View className={cn("flex-1 max-w-[48%]", !isFirstRightColItem ? 'mt-10': 'mt-0')}>
                            <MenuCard item={item as unknown as MenuItem} />
                        </View>
                    )
                }}
                keyExtractor={item => item.$id}
                numColumns={2}
                columnWrapperClassName="gap-7"
                contentContainerClassName="gap-7 px-5 pb-32"
                ListHeaderComponent={() => (
                    <View className="my-5 gap-5">
                        <View className="flex-between flex-row w-full">
                            <View className="flex-start">
                                <Text className="small-bold uppercase text-primary">Search</Text>
                                <View className="flex-start flex-row gap-x-1 mt-0.5">
                                    <Text className="paragraph-semibold text-dark-100">Find your favorite food</Text>
                                </View>
                            </View>

                            <CartButton />
                        </View>

                        <SearchBar />

                        <Filter categories={categories as unknown as Category[]} />
                    </View>
                )}
                ListEmptyComponent={() => !loading ? <EmptySearch query={query} /> : null}
            />
        </SafeAreaView>
    )
}

export default Search
