/* eslint-disable no-console */
import { createSuperAdminUser } from './user.seed';
import { createCategories } from './category.seed';
import { createTransactions } from './transaction.seed';
import { loadTransactionData } from './data-loader';
import { prisma } from './prisma';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    console.log('📖 Loading transaction data...');
    const transactions = loadTransactionData();
    console.log(`📊 Loaded ${transactions.length} transactions`);

    const user = await createSuperAdminUser();

    const { createdCategories, createdSubcategories } = await createCategories(
      user.id,
      transactions,
    );

    await createTransactions(
      user.id,
      transactions,
      createdCategories,
      createdSubcategories,
    );

    console.log('🎉 Database seeding completed successfully!');

    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const transactionCount = await prisma.transaction.count();

    console.log('\n📈 Database Summary:');
    console.log(`👤 Users: ${userCount}`);
    console.log(`📂 Categories: ${categoryCount}`);
    console.log(`💰 Transactions: ${transactionCount}`);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Run the seeder if this file is executed directly
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
