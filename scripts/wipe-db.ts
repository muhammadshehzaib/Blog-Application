/**
 * Drops the entire database referenced by DBURI.
 *
 * Run with:  npx ts-node scripts/wipe-db.ts
 */
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DBURI = process.env.DBURI;

if (!DBURI) {
  console.error('DBURI is not set. Add it to your .env file.');
  process.exit(1);
}

async function main() {
  await mongoose.connect(DBURI!);
  const name = mongoose.connection.name;
  console.log(`connected to mongo (db: ${name})`);

  await mongoose.connection.dropDatabase();
  console.log(`dropped database '${name}'`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
