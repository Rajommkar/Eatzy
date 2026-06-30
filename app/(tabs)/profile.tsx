import { View, Text, Image, ImageSourcePropType, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import useAuthStore from '@/store/auth.store'
import { images } from '@/constants'
import { signOut } from '@/lib/appwrite'
import { router } from 'expo-router'
import { useState } from 'react'
import seed from '@/lib/seed'

const ProfileField = ({ icon, label, value }: { icon: ImageSourcePropType; label: string; value: string }) => (
    <View className="profile-field">
        <View className="profile-field__icon">
            <Image source={icon} className="size-5" resizeMode="contain" tintColor="#FE8C00" />
        </View>
        <View className="flex-1">
            <Text className="small-bold text-gray-200 uppercase tracking-widest">{label}</Text>
            <Text className="paragraph-bold text-dark-100 mt-0.5" numberOfLines={1}>{value}</Text>
        </View>
    </View>
)

const Profile = () => {
    const { user, setIsAuthenticated, setUser } = useAuthStore()
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [isSeeding, setIsSeeding] = useState(false)

    const handleLogout = async () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoggingOut(true)
                        try {
                            await signOut()
                            setIsAuthenticated(false)
                            setUser(null)
                            router.replace('/(auth)/sign-in' as never)
                        } catch (e: unknown) {
                            Alert.alert('Error', e instanceof Error ? e.message : 'An error occurred')
                        } finally {
                            setIsLoggingOut(false)
                        }
                    }
                }
            ]
        )
    }

    const handleSeed = async () => {
        Alert.alert(
            'Setup Menu Data',
            'This will populate your Appwrite database with food items. This should only be done once. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes, Setup',
                    onPress: async () => {
                        setIsSeeding(true)
                        try {
                            await seed()
                            Alert.alert('✅ Success', 'Menu data has been added! Go to the Search tab to see all foods.')
                        } catch (e: unknown) {
                            Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong during seeding.')
                        } finally {
                            setIsSeeding(false)
                        }
                    }
                }
            ]
        )
    }

    // Get initials for avatar fallback
    const initials = user?.name
        ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
        : '?'

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Banner */}
                <View className="h-32 bg-primary/10 rounded-b-3xl mb-16 relative">
                    <View className="absolute -bottom-14 self-center">
                        <View className="profile-avatar overflow-hidden bg-primary/20 border-4 border-white shadow-md shadow-dark-100/20">
                            {user?.avatar ? (
                                <Image
                                    source={{ uri: user.avatar }}
                                    className="size-full"
                                    resizeMode="cover"
                                />
                            ) : (
                                <View className="size-full items-center justify-center bg-primary">
                                    <Text className="h1-bold text-white">{initials}</Text>
                                </View>
                            )}
                        </View>
                        <TouchableOpacity className="profile-edit" activeOpacity={0.8}>
                            <Image source={images.pencil} className="size-3" resizeMode="contain" tintColor="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* User Name & Email */}
                <View className="items-center mb-8 px-5">
                    <Text className="h3-bold text-dark-100 mt-1">{user?.name || 'Guest User'}</Text>
                    <Text className="paragraph-medium text-gray-200 mt-1">{user?.email || ''}</Text>
                </View>

                {/* Info Cards */}
                <View className="mx-5 bg-white rounded-2xl shadow-md shadow-dark-100/10 p-5 mb-5">
                    <Text className="base-bold text-dark-100 mb-4">Personal Information</Text>

                    <ProfileField
                        icon={images.person}
                        label="Full Name"
                        value={user?.name || 'Not set'}
                    />
                    <ProfileField
                        icon={images.envelope}
                        label="Email Address"
                        value={user?.email || 'Not set'}
                    />
                    <ProfileField
                        icon={images.phone}
                        label="Phone Number"
                        value={user?.phone || 'Not set'}
                    />
                    <ProfileField
                        icon={images.location}
                        label="Delivery Location"
                        value="Set your delivery address"
                    />
                </View>

                {/* Order Stats */}
                <View className="mx-5 bg-primary rounded-2xl p-5 mb-5 flex-row justify-around">
                    <View className="items-center">
                        <Text className="h3-bold text-white">0</Text>
                        <Text className="body-medium text-white/80 mt-1">Orders</Text>
                    </View>
                    <View className="w-px bg-white/30" />
                    <View className="items-center">
                        <Text className="h3-bold text-white">₹0</Text>
                        <Text className="body-medium text-white/80 mt-1">Total Spent</Text>
                    </View>
                    <View className="w-px bg-white/30" />
                    <View className="items-center">
                        <Text className="h3-bold text-white">⭐ 0</Text>
                        <Text className="body-medium text-white/80 mt-1">Reviews</Text>
                    </View>
                </View>

                {/* Seed Database Button */}
                <View className="mx-5 mb-5">
                    <TouchableOpacity
                        className="border-2 border-dashed border-primary/40 rounded-2xl p-4 flex-row items-center gap-x-3"
                        onPress={handleSeed}
                        activeOpacity={0.7}
                        disabled={isSeeding}
                    >
                        <View className="bg-primary/10 rounded-full p-2">
                            {isSeeding
                                ? <ActivityIndicator size="small" color="#FE8C00" />
                                : <Image source={images.plus} className="size-5" resizeMode="contain" tintColor="#FE8C00" />
                            }
                        </View>
                        <View className="flex-1">
                            <Text className="paragraph-bold text-dark-100">
                                {isSeeding ? 'Setting up menu...' : '⚡ Setup Menu Data'}
                            </Text>
                            <Text className="body-regular text-gray-200">
                                Tap once to populate all food items
                            </Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Logout Button */}
                <View className="mx-5">
                    <TouchableOpacity
                        className="bg-error/10 rounded-2xl p-4 flex-row items-center gap-x-3"
                        onPress={handleLogout}
                        activeOpacity={0.7}
                        disabled={isLoggingOut}
                    >
                        <View className="bg-error/20 rounded-full p-2">
                            {isLoggingOut
                                ? <ActivityIndicator size="small" color="#F14141" />
                                : <Image source={images.logout} className="size-5" resizeMode="contain" tintColor="#F14141" />
                            }
                        </View>
                        <Text className="paragraph-bold text-error">
                            {isLoggingOut ? 'Logging out...' : 'Log Out'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Profile
