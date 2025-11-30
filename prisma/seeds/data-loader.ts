import * as fs from 'fs';
import * as path from 'path';

export interface TransactionData {
  Date: string;
  Category: string;
  Type: string;
  Amount: number;
  Currency: string;
  Subcategory?: string;
}

export const loadTransactionData = async (): Promise<TransactionData[]> => {
  const dataPath = path.join(__dirname, 'data', 'transactions-02.03.25.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');

  return JSON.parse(rawData);
};
