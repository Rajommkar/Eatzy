import { Account, Avatars, Client, Databases, ID, Permission, Query, Role, Storage } from "react-native-appwrite";
import { CreateUserParams, GetMenuParams, SignInParams } from "@/type";

export const appwriteConfig = {
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
    platform: process.env.EXPO_PUBLIC_APPWRITE_PLATFORM ?? "com.yourname.eatzy",
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
    bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!,
    userCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USER_COLLECTION_ID!,
    categoriesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CATEGORIES_COLLECTION_ID!,
    menuCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_COLLECTION_ID!,
    customizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CUSTOMIZATIONS_COLLECTION_ID!,
    menuCustomizationsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MENU_CUSTOMIZATIONS_COLLECTION_ID!,
};

export const client = new Client();

client
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId)
    .setPlatform(appwriteConfig.platform);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
const avatars = new Avatars(client);

export const createUser = async ({ email, password, name }: CreateUserParams) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name);
        if(!newAccount) throw Error;

        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name);

        return await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            { email, name, accountId: newAccount.$id, avatar: avatarUrl },
            [
                Permission.read(Role.any()),
                Permission.update(Role.user(newAccount.$id)),
                Permission.delete(Role.user(newAccount.$id)),
            ]
        );
    } catch (e) {
        throw new Error(e as string);
    }
}

export const signIn = async ({ email, password }: SignInParams) => {
    try {
        try {
            await account.deleteSession('current');
        } catch (e) {
            // Ignore if no session exists
        }
        await account.createEmailPasswordSession(email, password);
    } catch (e) {
        throw new Error(e as string);
    }
}

export const signOut = async () => {
    try {
        await account.deleteSession('current');
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();
        if(!currentAccount) return null;

        let userDoc = null;
        try {
            const currentUser = await databases.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [Query.equal('accountId', currentAccount.$id)]
            );
            if (currentUser && currentUser.documents.length > 0) {
                userDoc = currentUser.documents[0];
            }
        } catch (e) {
            console.warn("Failed to list documents:", e);
        }

        if (!userDoc) {
            // Attempt to recreate the user document
            try {
                // Use a default avatar URL to avoid any avatars.getInitials errors
                const avatarUrl = "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentAccount.name || 'User');
                
                userDoc = await databases.createDocument(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    ID.unique(),
                    { 
                        email: currentAccount.email, 
                        name: currentAccount.name || 'User', 
                        accountId: currentAccount.$id, 
                        avatar: avatarUrl 
                    },
                    [
                        Permission.read(Role.any()),
                        Permission.update(Role.user(currentAccount.$id)),
                        Permission.delete(Role.user(currentAccount.$id)),
                    ]
                );
            } catch (err) {
                console.warn("Failed to create missing user document:", err);
                
                // Fallback: return a constructed user object so the app doesn't break
                return {
                    $id: currentAccount.$id,
                    accountId: currentAccount.$id,
                    email: currentAccount.email,
                    name: currentAccount.name || 'User',
                    avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentAccount.name || 'User')
                };
            }
        }

        return userDoc;
    } catch (e) {
        console.warn("getCurrentUser error:", e);
        return null;
    }
}

export const getMenu = async ({ category, query, limit }: GetMenuParams) => {
    try {
        const queries: string[] = [];

        if(category && category !== 'all') queries.push(Query.equal('categories', category));
        if(limit) queries.push(Query.limit(100)); // fetch more so client-side search works

        const menus = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            queries,
        );

        let results = menus.documents;

        // Client-side name filter (avoids needing Appwrite Fulltext index)
        if (query && query.trim()) {
            const lowerQuery = query.toLowerCase().trim();
            results = results.filter(doc =>
                doc.name?.toLowerCase().includes(lowerQuery) ||
                doc.description?.toLowerCase().includes(lowerQuery)
            );
        }

        // Apply limit after client-side filtering
        if (limit && limit < 100) {
            results = results.slice(0, limit);
        }

        return results;
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getCategories = async () => {
    try {
        const categories = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
        );

        return categories.documents;
    } catch (e) {
        throw new Error(e as string);
    }
}

export const sendPasswordRecovery = async (email: string) => {
    try {
        // We use a dummy URL. The user will copy this link from their email and paste it in the app.
        await account.createRecovery(email, 'https://eatzy.app/reset');
    } catch (e) {
        throw new Error(e as string);
    }
}

export const resetPassword = async (userId: string, secret: string, newPassword: string) => {
    try {
        await account.updateRecovery(userId, secret, newPassword);
    } catch (e) {
        throw new Error(e as string);
    }
}
