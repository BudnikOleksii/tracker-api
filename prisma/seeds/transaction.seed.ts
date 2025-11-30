import { CurrencyCode, TransactionType } from '../../generated/prisma/enums';
import { prisma } from './prisma';

interface TransactionData {
  Date: string;
  Category: string;
  Type: string;
  Amount: number;
  Currency: string;
  Subcategory?: string;
}

export const createTransactions = async (
  userId: string,
  transactions: TransactionData[],
  categories: Map<string, string>,
  subcategories: Map<string, string>,
) => {
  console.log('💰 Creating transactions...');

  let createdCount = 0;
  const batchSize = 100;

  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);

    const transactionData = batch.map((transaction) => {
      const categoryId = categories.get(transaction.Category);
      const subcategoryId = transaction.Subcategory
        ? subcategories.get(transaction.Subcategory)
        : null;

      if (!categoryId) {
        throw new Error(`Category not found: ${transaction.Category}`);
      }

      return {
        amount: transaction.Amount,
        date: new Date(transaction.Date),
        description: `${transaction.Category}${transaction.Subcategory ? ` - ${transaction.Subcategory}` : ''}`,
        currencyCode: transaction.Currency as CurrencyCode,
        type:
          transaction.Type === 'Income'
            ? TransactionType.INCOME
            : TransactionType.EXPENSE,
        userId,
        categoryId: subcategoryId ? subcategoryId : categoryId,
      };
    });

    await prisma.transaction.createMany({
      data: transactionData,
      skipDuplicates: true,
    });

    createdCount += transactionData.length;
    console.log(
      `📊 Processed ${createdCount}/${transactions.length} transactions...`,
    );
  }

  console.log(`✅ Created ${createdCount} transactions`);
};
