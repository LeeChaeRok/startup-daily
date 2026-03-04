#!/usr/bin/env node
/**
 * Daily startup data generator using Claude API
 * Runs via GitHub Actions cron every morning
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, "../src/data/startups.json");

const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

async function main() {
  const client = new Anthropic();

  // Load existing data to avoid duplicates
  const existing = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  const existingNames = existing.map((s) => s.name_en);
  const existingDates = [...new Set(existing.map((s) => s.date))];

  // Check if today's data already exists
  if (existingDates.includes(today)) {
    console.log(`Data for ${today} already exists. Skipping.`);
    process.exit(0);
  }

  // Keep only last 7 days of data
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoff = sevenDaysAgo.toISOString().split("T")[0];

  console.log(`Generating 5 startups for ${today}...`);
  console.log(`Existing startups to avoid: ${existingNames.join(", ")}`);

  const prompt = `You are a startup research analyst. Generate data for 5 trending startups for date ${today}.

IMPORTANT RULES:
- Do NOT include any of these already-covered startups: ${existingNames.join(", ")}
- Select startups from at least 3 different categories and 3 different regions
- Focus on early-to-mid stage startups with recent funding, media coverage, or Product Hunt rankings
- All text content should be in Korean (한국어), with proper nouns in English
- Return ONLY a valid JSON array, no markdown code blocks, no explanation

Each startup must follow this exact JSON schema:
{
  "id": "slug-yyyy (unique)",
  "date": "${today}",
  "name_en": "English Name",
  "name_ko": "한국어 이름",
  "tagline": "한 줄 소개",
  "category": ["Category1", "Category2"],
  "founded_year": 2024,
  "headquarters": {"city": "City", "country": "XX", "country_ko": "국가명"},
  "company_stage": "Seed/Series A/B/C+",
  "employee_count": "11-50",
  "website": "https://example.com",
  "logo_url": "",
  "logo_svg_description": "로고 설명",
  "founders": [{"name_en": "Name", "name_ko": "이름", "role": "CEO", "background": "배경", "linkedin": "", "notable_achievement": "성과"}],
  "team_highlights": "팀 특징",
  "product": {
    "summary": "제품 요약 3-4문장",
    "problem_statement": "해결하는 문제 2-3문장",
    "solution": "솔루션 설명 3-4문장",
    "key_features": ["기능1", "기능2", "기능3"],
    "tech_stack_or_innovation": "기술 혁신 설명",
    "target_customer": "타겟 고객",
    "business_model": "비즈니스 모델",
    "demo_or_screenshot_url": ""
  },
  "competitive_landscape": {
    "direct_competitors": [{"name": "Competitor", "comparison": "비교 설명"}],
    "key_differentiator": "핵심 차별점",
    "moat": "경쟁 우위",
    "competitive_position_summary": "포지션 요약"
  },
  "trending_reason": {
    "summary": "주목받는 이유 2-3문장",
    "catalysts": ["촉매1", "촉매2"],
    "media_mentions": [{"source": "매체명", "title": "기사 제목", "url": "", "date": "YYYY-MM-DD"}],
    "growth_metrics": "성장 지표"
  },
  "funding": {
    "total_raised": "$XXM",
    "latest_round": {"stage": "Series A", "amount": "$XXM", "date": "YYYY-MM", "lead_investor": "투자사", "notable_investors": ["투자자1"]},
    "valuation_estimate": "기업가치 추정",
    "funding_history": [{"stage": "Seed", "amount": "$XM", "date": "YYYY-MM", "investors": ["투자자"]}]
  },
  "market_outlook": {
    "tam_sam_som": "시장 규모",
    "market_trend": "시장 트렌드 2-3문장",
    "growth_potential": "성장 잠재력 2-3문장",
    "risks": ["리스크1", "리스크2", "리스크3"],
    "risk_mitigation": "리스크 대응 전략"
  },
  "related_links": [{"label": "공식 사이트", "url": "https://..."}],
  "editor_pick_comment": "에디터 코멘트 한 줄"
}

Return exactly 5 startups as a JSON array. Ensure diversity in categories (AI, FinTech, HealthTech, CleanTech, SaaS, Web3, BioTech, EdTech, SpaceTech, Robotics, etc.) and regions (North America, Europe, Asia, etc.).`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].text.trim();

  // Parse JSON (handle potential markdown code blocks)
  let jsonStr = text;
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const newStartups = JSON.parse(jsonStr);

  if (!Array.isArray(newStartups) || newStartups.length !== 5) {
    throw new Error(`Expected 5 startups, got ${newStartups?.length}`);
  }

  // Filter out old data (keep last 7 days)
  const recentData = existing.filter((s) => s.date >= cutoff);
  const merged = [...newStartups, ...recentData];

  fs.writeFileSync(DATA_PATH, JSON.stringify(merged, null, 2), "utf-8");

  console.log(`Success! Added 5 startups for ${today}`);
  console.log(`Total entries: ${merged.length} (removed ${existing.length - recentData.length} old entries)`);
  console.log("New startups:", newStartups.map((s) => s.name_en).join(", "));
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
