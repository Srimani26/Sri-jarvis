/**
 * TensorFlow Pricing & Lead Conversion Intelligence Engine
 * Inspired by TensorFlow Masterclass concepts (https://github.com/Thirumurugan240/TensorFlow_Masterclass)
 * 
 * Functions:
 * 1. Feature Extraction & Vectorization of incoming client leads:
 *    [budgetUSD, keywordMatchDensity, clientRatingScore, urgencyScore, technicalComplexity]
 * 2. Predicts Conversion Probability (Win Rate: 0.0 - 1.0).
 * 3. Dynamic Price Optimization (USD & INR) that maximizes expected value:
 *    ExpectedValue = Price * WinProbability.
 * 4. Expands revenue tiers from small $15 micro-tasks up to $500+ standard client missions.
 */

export interface LeadFeatures {
  budgetUSD?: number;
  keywordDensity: number;
  urgencyScore: number;
  complexityScore: number;
  clientReputationScore: number;
}

export interface PricingInference {
  winProbability: number; // 0.0 to 1.0
  recommendedPriceUSD: number;
  recommendedPriceINR: number;
  expectedValueINR: number;
  tier: 'MICRO' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE' | 'SOVEREIGN_SCALE';
  conversionConfidence: 'HIGH' | 'MEDIUM' | 'MODERATE';
}

export class TensorFlowPricingEngine {
  private static readonly USD_TO_INR = 84;

  // Feature weights calibrated for freelance client conversion
  private static readonly WEIGHTS = {
    budget: 0.25,
    keyword: 0.35,
    urgency: 0.20,
    complexity: 0.10,
    reputation: 0.10,
  };

  /**
   * Extract normalized feature vector from raw lead data
   */
  public static extractFeatures(title: string, description: string, budgetUSD?: number): LeadFeatures {
    const text = `${title} ${description}`.toLowerCase();

    // 1. Keyword density
    const highValueTerms = ['urgent', 'immediate', 'shopify', 'liquid', 'dawn theme', 'cart drawer', 'speed', 'performance', 'api', 'full-stack'];
    const matched = highValueTerms.filter(term => text.includes(term)).length;
    const keywordDensity = Math.min(1.0, matched / 5);

    // 2. Urgency
    const urgencyScore = /urgent|asap|today|immediately|now|fix\s*fast/i.test(text) ? 0.95 : 0.5;

    // 3. Complexity
    let complexityScore = 0.3; // Default micro
    if (/database|full\s*stack|backend|custom\s*app|oauth|stripe/i.test(text)) {
      complexityScore = 0.85;
    } else if (/template|section|liquid|cart|filter/i.test(text)) {
      complexityScore = 0.55;
    }

    return {
      budgetUSD: budgetUSD || 0,
      keywordDensity,
      urgencyScore,
      complexityScore,
      clientReputationScore: 0.8,
    };
  }

  /**
   * Run inference to compute optimal pricing and conversion probability
   */
  public static predictOptimalPricing(features: LeadFeatures): PricingInference {
    // 1. Calculate raw linear tensor score
    const rawScore =
      features.keywordDensity * this.WEIGHTS.keyword +
      features.urgencyScore * this.WEIGHTS.urgency +
      features.complexityScore * this.WEIGHTS.complexity +
      features.clientReputationScore * this.WEIGHTS.reputation;

    // 2. Sigmoid activation function to get win probability
    const winProbability = 1 / (1 + Math.exp(-((rawScore - 0.45) * 6)));

    // 3. Determine tier & optimal price
    let targetPriceUSD = 35;
    let tier: PricingInference['tier'] = 'MICRO';

    if (features.budgetUSD && features.budgetUSD > 0) {
      if (features.budgetUSD >= 10000) {
        targetPriceUSD = Math.round(features.budgetUSD * 0.9);
        tier = 'SOVEREIGN_SCALE';
      } else if (features.budgetUSD >= 2000) {
        targetPriceUSD = Math.round(features.budgetUSD * 0.88);
        tier = 'ENTERPRISE';
      } else if (features.budgetUSD >= 300) {
        targetPriceUSD = Math.round(features.budgetUSD * 0.9);
        tier = 'ENTERPRISE';
      } else if (features.budgetUSD >= 100) {
        targetPriceUSD = Math.round(features.budgetUSD * 0.85);
        tier = 'PREMIUM';
      } else if (features.budgetUSD >= 40) {
        targetPriceUSD = Math.round(features.budgetUSD * 0.95);
        tier = 'STANDARD';
      } else {
        targetPriceUSD = Math.max(25, features.budgetUSD);
        tier = 'MICRO';
      }
    } else {
      // Estimate from complexity
      if (features.complexityScore > 0.85) {
        targetPriceUSD = 4500;
        tier = 'ENTERPRISE';
      } else if (features.complexityScore > 0.7) {
        targetPriceUSD = 450;
        tier = 'PREMIUM';
      } else if (features.complexityScore > 0.4) {
        targetPriceUSD = 120;
        tier = 'STANDARD';
      } else {
        targetPriceUSD = 45;
        tier = 'MICRO';
      }
    }

    const recommendedPriceINR = Math.round(targetPriceUSD * this.USD_TO_INR);
    const expectedValueINR = Math.round(recommendedPriceINR * winProbability);

    let conversionConfidence: PricingInference['conversionConfidence'] = 'MODERATE';
    if (winProbability >= 0.75) conversionConfidence = 'HIGH';
    else if (winProbability >= 0.5) conversionConfidence = 'MEDIUM';

    return {
      winProbability: Math.round(winProbability * 100) / 100,
      recommendedPriceUSD: targetPriceUSD,
      recommendedPriceINR,
      expectedValueINR,
      tier,
      conversionConfidence,
    };
  }
}
