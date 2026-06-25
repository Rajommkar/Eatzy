import { Account, Avatars, Client, Databases, ID, Permission, Query, Role, Storage } from "react-native-appwrite";
import { CreateUserParams, GetMenuParams, SignInParams } from "@/type";

export const appwriteConfig = {
    endpoint: 'https://nyc.cloud.appwrite.io/v1',
    projectId: '6a3bde0100378b1da0af',
    databaseId: '6a3c146f001de1c4737b',
    categoriesCollectionId: 'categories',
    customizationsCollectionId: 'customizations',
    menuCollectionId: 'menu',
    menuCustomizationsCollectionId: 'menu_customizations',
    bucketId: '6a3c14e7002ac8b7b78f',
    platform: "com.yourname.eatzy",
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
            'users',
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
        if(!currentAccount) throw Error;
        return currentAccount;
    } catch (e) {
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
