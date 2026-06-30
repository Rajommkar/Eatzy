import { Account, Avatars, Client, Databases, ID, Permission, Query, Role, Storage } from "react-native-appwrite";
import { CreateUserParams, GetMenuParams, SignInParams } from "@/type";
import { LOCAL_CATEGORIES, LOCAL_MENU_ITEMS } from "./data";

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

export const createUser = async ({ email, password, name, phone }: CreateUserParams) => {
    try {
        const newAccount = await account.create(ID.unique(), email, password, name);
        if(!newAccount) throw Error;

        await signIn({ email, password });

        const avatarUrl = avatars.getInitialsURL(name);

        const docData: Record<string, string> = {
            email, name, accountId: newAccount.$id, avatar: avatarUrl.toString(),
        };
        if (phone) docData.phone = phone;

        try {
            return await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                ID.unique(),
                docData,
                [
                    Permission.read(Role.any()),
                    Permission.update(Role.user(newAccount.$id)),
                    Permission.delete(Role.user(newAccount.$id)),
                ]
            );
        } catch {
            // Collection may not allow client-side create — return constructed object
            return {
                $id: newAccount.$id,
                accountId: newAccount.$id,
                email, name, phone: phone ?? '',
                avatar: avatarUrl.toString(),
            };
        }
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

        // Try querying by accountId (requires the attribute to be indexed in Appwrite)
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
            // accountId may not be indexed — fall back to listing all and filtering client-side
            try {
                const allUsers = await databases.listDocuments(
                    appwriteConfig.databaseId,
                    appwriteConfig.userCollectionId,
                    [Query.limit(100)]
                );
                const found = allUsers.documents.find(doc => doc.accountId === currentAccount.$id);
                if (found) userDoc = found;
            } catch (fallbackErr) {
                console.warn("Failed to list user documents:", fallbackErr);
            }
        }

        if (!userDoc) {
            // We cannot create the document client-side because Appwrite collection
            // permissions block client-side create. Return a constructed object instead.
            // The real user document is created server-side during sign-up (createUser).
            return {
                $id: currentAccount.$id,
                accountId: currentAccount.$id,
                email: currentAccount.email,
                phone: currentAccount.phone || '',
                name: currentAccount.name || 'User',
                avatar: "https://ui-avatars.com/api/?name=" + encodeURIComponent(currentAccount.name || 'User'),
            };
        }

        // Merge account phone if doc doesn't have it
        if (!userDoc.phone && currentAccount.phone) {
            userDoc.phone = currentAccount.phone;
        }

        return userDoc;
    } catch (e) {
        console.warn("getCurrentUser error:", e);
        return null;
    }
}

export const updateUserPhone = async (userId: string, docId: string, phone: string) => {
    try {
        if (!docId) return null;
        return await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            docId,
            { phone }
        );
    } catch (e) {
        console.warn("Failed to update phone:", e);
        return null;
    }
}

export const getMenu = async ({ category, query, limit }: GetMenuParams) => {
    try {
        let results = [...LOCAL_MENU_ITEMS];

        // Filter by category (category_name field)
        if (category && category !== 'all') {
            results = results.filter((doc) =>
                (doc as unknown as { category_name?: string }).category_name?.toLowerCase() === category.toLowerCase() ||
                (doc as unknown as { categories?: string }).categories === category
            );
        }

        // Client-side name/description filter
        if (query && query.trim()) {
            const lowerQuery = query.toLowerCase().trim();
            results = results.filter((doc) =>
                doc.name?.toLowerCase().includes(lowerQuery) ||
                doc.description?.toLowerCase().includes(lowerQuery)
            );
        }

        // Apply limit after client-side filtering
        if (limit && limit < 100) {
            results = results.slice(0, limit);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return results as any;
    } catch (e) {
        throw new Error(e as string);
    }
}

export const getMenuById = async (id: string) => {
    // Check local data first (fast, no network)
    const local = LOCAL_MENU_ITEMS.find(item => item.$id === id);
    if (local) return local;

    // Try Appwrite
    try {
        const doc = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.menuCollectionId,
            id,
        );
        return doc;
    } catch {
        return null;
    }
}

export const getCategories = async () => {
    try {
        // Force local categories
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return LOCAL_CATEGORIES as any;
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
