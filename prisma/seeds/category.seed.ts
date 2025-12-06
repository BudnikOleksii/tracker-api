/* eslint-disable no-console */
import { TransactionType } from '../../generated/prisma/enums';
import { prisma } from './prisma';
import { TransactionData } from './types';

const createCategory = async ({
  userId,
  name,
  type,
  parentCategoryId,
}: {
  userId: string;
  name: string;
  type: TransactionType;
  parentCategoryId?: string;
}) => {
  const categoryLevel = parentCategoryId ? 'subcategory' : 'category';

  const existingCategory = await prisma.category.findFirst({
    where: { userId, name },
  });

  if (existingCategory) {
    console.log(`📂 Found existing ${categoryLevel}: ${name}`);

    return existingCategory;
  } else {
    const category = await prisma.category.create({
      data: {
        name,
        type,
        userId,
        parentCategoryId,
      },
    });
    console.log(`✅ Created ${categoryLevel}: ${name} (${type})`);

    return category;
  }
};

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
      categoryMap.get(categoryName)?.subcategories.add(transaction.Subcategory);
    }
  });

  const createdCategories = new Map<string, string>(); // categoryName -> categoryId
  const createdSubcategories = new Map<string, string>(); // subcategoryName -> subcategoryId

  for (const [categoryName, { type, subcategories }] of categoryMap) {
    const category = await createCategory({ userId, name: categoryName, type });

    createdCategories.set(categoryName, category.id);

    for (const subcategoryName of subcategories) {
      const subcategory = await createCategory({
        userId,
        name: subcategoryName,
        type,
        parentCategoryId: category.id,
      });

      createdSubcategories.set(subcategoryName, subcategory.id);
    }
  }

  return { createdCategories, createdSubcategories };
};
