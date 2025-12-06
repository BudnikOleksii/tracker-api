import * as fs from 'fs';
import * as path from 'path';

import { TransactionData } from './types';

export const loadTransactionData = (): TransactionData[] => {
  const dataPath = path.join(__dirname, 'data', 'transactions-02.03.25.json');
  const rawData = fs.readFileSync(dataPath, 'utf8');

  return JSON.parse(rawData) as TransactionData[];
};
