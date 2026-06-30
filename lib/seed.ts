import { ID, Permission, Role, Query } from "react-native-appwrite";
import { appwriteConfig, databases } from "./appwrite";
import dummyData from "./data";

interface Category {
    name: string;
    description: string;
}

interface Customization {
    name: string;
    price: number;
    type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
    name: string;
    description: string;
    image_url: string;
    price: number;
    rating: number;
    calories: number;
    protein: number;
    category_name: string;
    customizations: string[];
}

interface DummyData {
    categories: Category[];
    customizations: Customization[];
    menu: MenuItem[];
}

const data = dummyData as DummyData;

// Permissions attached to every created document
// Note: Appwrite does NOT support 'create' permission on documents.
// Use 'write' (which covers create+update+delete) or individual read/update/delete.
const docPermissions = [
    Permission.read(Role.any()),
    Permission.write(Role.users()),
];

async function seed(): Promise<void> {
    // ── Step 1: Build categoryMap ─────────────────────────────────────────────
    const categoryMap: Record<string, string> = {};

    // First fetch already-existing categories from Appwrite
    try {
        const existing = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.categoriesCollectionId,
            [Query.limit(100)]
        );
        for (const doc of existing.documents) {
            categoryMap[doc.name] = doc.$id;
        }
        console.log(`Found ${existing.documents.length} existing categories.`);
    } catch (e) {
        console.warn('Could not fetch existing categories.');
    }

    // Create any categories that are missing
    for (const cat of data.categories) {
        if (categoryMap[cat.name]) continue; // already exists
        try {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.categoriesCollectionId,
                ID.unique(),
                cat,
                docPermissions
            );
            categoryMap[cat.name] = doc.$id;
            console.log(`✅ Category: ${cat.name}`);
        } catch (e: any) {
            console.warn(`Could not create category "${cat.name}":`, e?.message);
        }
    }

    // ── Step 2: Build customizationMap ───────────────────────────────────────
    const customizationMap: Record<string, string> = {};

    // Fetch already-existing customizations
    try {
        const existing = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.customizationsCollectionId,
            [Query.limit(100)]
        );
        for (const doc of existing.documents) {
            customizationMap[doc.name] = doc.$id;
        }
        console.log(`Found ${existing.documents.length} existing customizations.`);
    } catch (e) {
        console.warn('Could not fetch existing customizations.');
    }

    // Create any customizations that are missing
    for (const cus of data.customizations) {
        if (customizationMap[cus.name]) continue; // already exists
        try {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.customizationsCollectionId,
                ID.unique(),
                { name: cus.name, price: cus.price, type: cus.type },
                docPermissions
            );
            customizationMap[cus.name] = doc.$id;
            console.log(`✅ Customization: ${cus.name}`);
        } catch (e: any) {
            console.warn(`Could not create customization "${cus.name}":`, e?.message);
        }
    }

    // ── Step 3: Seed menu items ───────────────────────────────────────────────
    for (const item of data.menu) {
        try {
            const doc = await databases.createDocument(
                appwriteConfig.databaseId,
                appwriteConfig.menuCollectionId,
                ID.unique(),
                {
                    name: item.name,
                    description: item.description,
                    image_url: item.image_url,
                    price: item.price,
                    rating: item.rating,
                    calories: item.calories,
                    protein: item.protein,
                    categories: categoryMap[item.category_name] ?? null,
                },
                docPermissions
            );

            // Step 4: Link customizations
            for (const cusName of item.customizations) {
                if (customizationMap[cusName]) {
                    try {
                        await databases.createDocument(
                            appwriteConfig.databaseId,
                            appwriteConfig.menuCustomizationsCollectionId,
                            ID.unique(),
                            {
                                menu: doc.$id,
                                customizations: customizationMap[cusName],
                            },
                            docPermissions
                        );
                    } catch (e) { /* not critical */ }
                }
            }

            console.log(`✅ Added menu item: ${item.name}`);
        } catch (e: any) {
            throw new Error(`Failed to add "${item.name}": ${e?.message}`);
        }
    }

    console.log("✅ Seeding complete!");
}

export default seed;
