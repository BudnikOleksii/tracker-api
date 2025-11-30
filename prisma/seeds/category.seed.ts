import { TransactionType } from '../../generated/prisma/enums';
import { prisma } from './prisma';

interface TransactionData {
  Date: string;
  Category: string;
  Type: string;
  Amount: number;
  Currency: string;
  Subcategory?: string;
}

export const createCategories = async (
  userId: string,
  transactions: TransactionData[],
) => {
  console.log('📂 Creating categories and subcategories...');

  // Get unique categories and subcategories from transactions
  const categoryMap = new Map<
    string,
    { type: TransactionType; subcategories: Set<string> }
  >();

  transactions.forEach((transaction) => {
    const categoryName = transaction.Category;
    const type =
      transaction.Type === 'Income'
        ? TransactionType.INCOME
        : TransactionType.EXPENSE;

    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, { type, subcategories: new Set() });
    }

    if (transaction.Subcategory) {
      categoryMap.get(categoryName)!.subcategories.add(transaction.Subcategory);
    }
  });

  const createdCategories = new Map<string, string>(); // categoryName -> categoryId
  const createdSubcategories = new Map<string, string>(); // subcategoryName -> subcategoryId

  // Create parent categories
  for (const [categoryName, { type, subcategories }] of categoryMap) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: categoryName,
      },
    });

    let category;
    if (existingCategory) {
      category = existingCategory;
      console.log(`📂 Found existing category: ${categoryName}`);
    } else {
      category = await prisma.category.create({
        data: {
          name: categoryName,
          type,
          userId,
        },
      });
      console.log(`✅ Created category: ${categoryName} (${type})`);
    }

    createdCategories.set(categoryName, category.id);

    // Create subcategories for this category
    for (const subcategoryName of subcategories) {
      const existingSubcategory = await prisma.category.findFirst({
        where: {
          userId,
          name: subcategoryName,
        },
      });

      let subcategory;
      if (existingSubcategory) {
        subcategory = existingSubcategory;
        console.log(`  📂 Found existing subcategory: ${subcategoryName}`);
      } else {
        subcategory = await prisma.category.create({
          data: {
            name: subcategoryName,
            type,
            userId,
            parentCategoryId: category.id,
          },
        });
        console.log(`  └─ Created subcategory: ${subcategoryName}`);
      }

      createdSubcategories.set(subcategoryName, subcategory.id);
    }
  }

  return { createdCategories, createdSubcategories };
};
