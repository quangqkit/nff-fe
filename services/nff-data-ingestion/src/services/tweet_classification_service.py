import asyncio
import json
import os
from typing import Any, Dict, List, Optional
from openai import AsyncOpenAI, RateLimitError, APIError
from utils.logger import get_logger
from config import settings

logger = get_logger(__name__)


class TweetClassificationService:
    # Taxonomy structure for classification
    TAXONOMY = {
        "Company": [
            "Earnings",
            "Guidance",
            "Analysts Rating",
            "M&A",
            "Capital Actions",
            "Management & Board",
            "Product / Technology",
            "Partnership / Contracts",
            "Legal / Compliance",
            "Operations / KPIs"
        ],
        "Macro & Economy": [
            "Central Banks",
            "Inflation",
            "Labor",
            "Growth / Activity",
            "Fiscal / Policy",
            "Trade / Geopolitics",
            "Housing"
        ],
        "Market Structure & Flows": [
            "Options & Gamma",
            "CTA / Systematic",
            "ETF & Index",
            "Short Interest",
            "Dark Pools / Block Trades",
            "Fund Flows",
            "Insider Transactions"
        ],
        "Commodities, FX & Crypto": [
            "Oil & Gas",
            "Metals / Agriculture",
            "FX / Rates",
            "Crypto"
        ],
        "Technical & Market Dynamics": [
            "Breakouts / Levels",
            "Volatility",
            "Breadth / Momentum",
            "Seasonality / Patterns"
        ],
        "Data & Sentiment": [
            "Alt-Data",
            "Surveys / Sentiment",
            "Media / PR"
        ]
    }

    # Valid sectors list
    SECTORS = [
        "Information Technology",
        "Communication Services",
        "Consumer Discretionary",
        "Consumer Staples",
        "Financials",
        "Health Care",
        "Industrials",
        "Energy",
        "Materials",
        "Utilities",
        "Real Estate"
    ]

    def __init__(self) -> None:
        api_key = settings.OPENAI_API_KEY
        self.openai_client = (
            AsyncOpenAI(api_key=api_key) if api_key else None
        )
        self.model = os.getenv("OPENAI_CLASSIFICATION_MODEL", "gpt-4o-mini")
        self.max_concurrency = int(
            os.getenv("TWEET_CLASSIFICATION_CONCURRENCY", "5")
        )

    async def classify_tweets(
        self, tweets: List[Dict[str, Any]], custom_prompt: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not tweets or not self.openai_client:
            if not self.openai_client:
                logger.error("OpenAI client is not configured")
            return []

        semaphore = asyncio.Semaphore(max(1, self.max_concurrency))
        tasks = [
            self._classify_with_semaphore(semaphore, tweet, custom_prompt)
            for tweet in tweets
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        classifications: List[Dict[str, Any]] = []
        for result in results:
            if isinstance(result, dict):
                # Return all classification results, even if empty
                # Filtering logic will be handled later by the user
                classifications.append(result)
            elif isinstance(result, Exception):
                logger.error(f"Classification task failed: {result}", exc_info=result if isinstance(result, Exception) else None)
            elif result is None:
                logger.warning("Classification returned None (likely parse error)")
        return classifications

    async def _classify_with_semaphore(self, semaphore, tweet, custom_prompt):
        async with semaphore:
            return await self._classify_single(tweet, custom_prompt)

    async def _classify_single(
        self, tweet: Dict[str, Any], custom_prompt: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        if custom_prompt:
            prompt = self._build_custom_prompt(tweet, custom_prompt)
        else:
            prompt = self._build_prompt(tweet)
        
        system_message = (
            "You are a financial tweet classifier. "
            "Always respond with valid JSON."
        )
        
        try:
            response = await self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_message,
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.0,
                max_tokens=2000,  # Increased to handle full taxonomy and classification response
            )
            content = response.choices[0].message.content
            
            # Check if response was truncated
            finish_reason = response.choices[0].finish_reason
            if finish_reason == "length":
                logger.warning(
                    f"Response truncated for tweet_id={tweet.get('tweet_id')} (max_tokens reached)"
                )
            
            return self._parse_response(tweet["tweet_id"], content)
        except RateLimitError as exc:
            logger.error(f"OpenAI rate limit error: {str(exc)}")
        except APIError as exc:
            logger.error(f"OpenAI API error: {str(exc)}")
        except Exception as exc:
            logger.error(f"OpenAI classification error: {str(exc)}")
        return None

    def _build_prompt(self, tweet: Dict[str, Any]) -> str:
        urls = ", ".join(tweet.get("urls") or []) or "None"
        symbols = ", ".join(tweet.get("symbols_raw") or []) or "None"
        
        # Build taxonomy JSON for prompt
        taxonomy_json = json.dumps(self.TAXONOMY, indent=2)
        
        # Build sectors list
        sectors_list = "\n".join([f"- {sector}" for sector in self.SECTORS])
        
        return (
            "You are an expert financial markets analyst. Your task is to CLASSIFY the tweet below into categories and sub-categories.\n\n"
            
            "## TAXONOMY (Use this to classify the tweet):\n"
            f"{taxonomy_json}\n\n"
            
            "## VALID SECTORS (Use EXACT names only):\n"
            f"{sectors_list}\n\n"
            
            "## YOUR TASK:\n"
            "Analyze the tweet below and classify it using the taxonomy above. Return ONLY a JSON object with this exact structure:\n"
            "{\n"
            '  "categories": ["CategoryName1", "CategoryName2"],\n'
            '  "sub_categories": {\n'
            '    "CategoryName1": ["SubCategory1", "SubCategory2"],\n'
            '    "CategoryName2": ["SubCategory3"]\n'
            '  },\n'
            '  "tickers": ["NVDA", "AMD"],\n'
            '  "sectors": ["Information Technology"]\n'
            "}\n\n"
            
            "## RULES:\n"
            "- Select 1-3 categories from the taxonomy that match the tweet\n"
            "- For each category, select relevant sub-categories from that category's list\n"
            "- Extract tickers (stock symbols) mentioned in the tweet\n"
            "- Identify sectors based on tickers or content\n"
            "- Use EXACT names from taxonomy and sectors list\n"
            "- Return ONLY the JSON object, nothing else\n\n"
            
            "## TWEET TO CLASSIFY:\n"
            f"ID: {tweet.get('tweet_id')}\n"
            f"Text: {tweet.get('text')}\n"
            f"Timestamp: {tweet.get('timestamp') or 'N/A'}\n"
            f"Symbols: {symbols}\n"
            f"URLs: {urls}\n\n"
            
            "## YOUR RESPONSE (JSON only, no other text):"
        )

    def _build_custom_prompt(
        self, tweet: Dict[str, Any], custom_prompt_template: str
    ) -> str:
        urls = ", ".join(tweet.get("urls") or []) or "None"
        symbols = ", ".join(tweet.get("symbols_raw") or []) or "None"
        
        # Check if custom prompt has placeholders (like {text}, {timestamp}, etc.)
        has_placeholders = any(
            placeholder in custom_prompt_template
            for placeholder in ["{text}", "{timestamp}", "{urls}", "{symbols}", "{symbols_raw}"]
        )
        
        if has_placeholders:
            # Custom prompt has placeholders, format it
            try:
                prompt = custom_prompt_template.format(
                    text=tweet.get("text", ""),
                    timestamp=tweet.get("timestamp", ""),
                    urls=urls,
                    symbols=symbols,
                    symbols_raw=symbols,
                )
                return prompt
            except KeyError as e:
                logger.warning(
                    f"Missing placeholder in custom prompt: {e}. Using default prompt."
                )
                return self._build_prompt(tweet)
        else:
            # Custom prompt is just text, use default prompt (which includes taxonomy)
            return self._build_prompt(tweet)

    def _parse_response(
        self, tweet_id: str, response_text: str
    ) -> Optional[Dict[str, Any]]:
        if not response_text or not response_text.strip():
            logger.error(f"Empty response for tweet_id={tweet_id}")
            return None
            
        try:
            cleaned = response_text.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:]
                cleaned = cleaned.strip()
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3].strip()
            
            # Try to find JSON object in response (in case LLM adds extra text)
            json_start = cleaned.find("{")
            json_end = cleaned.rfind("}")
            if json_start != -1 and json_end != -1 and json_end > json_start:
                cleaned = cleaned[json_start:json_end+1]
            
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            logger.error(
                f"Failed to parse JSON for tweet_id={tweet_id}: {str(exc)}"
            )
            # Try to extract partial data if possible
            return self._try_extract_partial_data(tweet_id, response_text)

        # Parse categories (array of strings)
        categories_raw = data.get("categories") or []
        if not isinstance(categories_raw, list):
            categories_raw = []
        
        categories = [
            cat.strip()
            for cat in categories_raw
            if cat and cat.strip() and cat.strip() in self.TAXONOMY
        ]

        # Parse sub_categories (object with category -> sub_categories mapping)
        sub_categories_raw = data.get("sub_categories") or {}
        if not isinstance(sub_categories_raw, dict):
            sub_categories_raw = {}
        
        sub_categories = {}
        for category_name, sub_cats in sub_categories_raw.items():
            if category_name in self.TAXONOMY:
                valid_sub_cats = [
                    sc.strip()
                    for sc in (sub_cats if isinstance(sub_cats, list) else [])
                    if sc and sc.strip() and sc.strip() in self.TAXONOMY.get(category_name, [])
                ]
                if valid_sub_cats:
                    sub_categories[category_name] = valid_sub_cats

        # Parse tickers
        tickers = [
            ticker.strip().upper()
            for ticker in data.get("tickers") or []
            if ticker and ticker.strip()
        ]

        # Parse sectors (validate against valid sectors list)
        sectors_raw = data.get("sectors") or []
        sectors = [
            sector.strip()
            for sector in sectors_raw
            if sector and sector.strip() and sector.strip() in self.SECTORS
        ]

        # Validate: must have at least categories or sub_categories
        if not categories and not sub_categories:
            logger.warning(
                f"No valid categories or sub_categories for tweet_id={tweet_id}"
            )
            # Return empty result instead of None so user can see what happened
            return {
                "tweet_id": tweet_id,
                "categories": [],
                "sub_categories": {},
                "tickers": tickers,
                "sectors": sectors,
            }

        return {
            "tweet_id": tweet_id,
            "categories": categories,
            "sub_categories": sub_categories,
            "tickers": tickers,
            "sectors": sectors,
        }
    
    def _try_extract_partial_data(self, tweet_id: str, response_text: str) -> Optional[Dict[str, Any]]:
        """Try to extract partial data from malformed JSON response"""
        try:
            # Try to find any JSON-like structures
            import re
            # Look for categories array
            categories_match = re.search(r'"categories"\s*:\s*\[(.*?)\]', response_text, re.DOTALL)
            # Look for tickers array
            tickers_match = re.search(r'"tickers"\s*:\s*\[(.*?)\]', response_text, re.DOTALL)
            
            categories = []
            tickers = []
            
            if categories_match:
                try:
                    categories_str = "[" + categories_match.group(1) + "]"
                    categories_list = json.loads(categories_str)
                    categories = [str(c).strip() for c in categories_list if c and str(c).strip() in self.TAXONOMY]
                except:
                    pass
            
            if tickers_match:
                try:
                    tickers_str = "[" + tickers_match.group(1) + "]"
                    tickers_list = json.loads(tickers_str)
                    tickers = [str(t).strip().upper() for t in tickers_list if t and str(t).strip()]
                except:
                    pass
            
            if categories or tickers:
                logger.info(
                    f"Extracted partial data for tweet_id={tweet_id}: "
                    f"categories={len(categories)}, tickers={len(tickers)}"
                )
                return {
                    "tweet_id": tweet_id,
                    "categories": categories,
                    "sub_categories": {},
                    "tickers": tickers,
                    "sectors": [],
                }
        except Exception as e:
            logger.error(f"Failed to extract partial data: {e}")
        
        return None

    def get_prompt(self, tweet: Dict[str, Any]) -> Dict[str, Any]:
        prompt = self._build_prompt(tweet)
        system_message = (
            "You are a financial tweet classifier. "
            "Always respond with valid JSON."
        )
        return {
            "tweet_id": tweet.get("tweet_id"),
            "system_message": system_message,
            "user_prompt": prompt,
            "model": self.model,
            "temperature": 0.0,
            "max_tokens": 2000,  # Increased to handle full taxonomy and classification response
        }

