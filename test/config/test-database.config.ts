export const testDatabaseConfig = {
  url:
    process.env.TEST_DATABASE_URL ||
    'postgresql://tracker:tracker123@localhost:5433/tracker_test',
};
