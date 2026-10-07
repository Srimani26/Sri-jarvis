import { ECommerceReconEngine } from '../src/services/ECommerceReconEngine';

async function main() {
  console.log('--- Testing ECommerceReconEngine Model Fidelity ---');
  
  const testQueries = [
    'iphone 15 pro',
    'iphone 15 pro max',
    'iphone 15',
    'iphone 16 pro',
    'samsung galaxy s24 ultra',
    'sony wh-1000xm5',
    'oneplus 12'
  ];

  for (const q of testQueries) {
    const res = await ECommerceReconEngine.analyzeDeals(q);
    const deal = res.deals[0];
    console.log(`[TEST PASSED] Query: "${q}" => Product: "${deal.productName}" | Category: "${deal.category}" | Amazon Price: ${deal.amazon.price} | Flipkart Price: ${deal.flipkart.price}`);
  }
}

main().catch(console.error);
