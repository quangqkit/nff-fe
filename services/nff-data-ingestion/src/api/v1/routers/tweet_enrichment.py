"""
Tweet Enrichment Router
API endpoints for tweet enrichment and catalyst processing
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
from pydantic import BaseModel
from services.tweet_enrichment_service import TweetEnrichmentService
from services.catalyst_service import CatalystService
from utils.logger import get_logger
from config import settings

logger = get_logger(__name__)
router = APIRouter()

class EnrichmentRequest(BaseModel):
    run_id: str
    anchor_date_il: str | None = None
    market_context: Dict[str, Any] | None = None

class EnrichmentResponse(BaseModel):
    status: str
    message: str
    processed_count: int
    errors: int
    total_time: float
    quota_exceeded: bool = False

class CatalystRequest(BaseModel):
    time_window_hours: int = 1

class CatalystResponse(BaseModel):
    status: str
    message: str
    catalysts_created: int
    tweets_grouped: int
    total_time: float

@router.post("/enrichment/process", response_model=EnrichmentResponse)
async def process_tweet_enrichment(request: EnrichmentRequest):
    try:
        logger.info(f"Processing tweet enrichment for run {request.run_id}")
        
        service = TweetEnrichmentService()
        target_anchor_utc = None
        if request.anchor_date_il:
            from datetime import datetime
            from zoneinfo import ZoneInfo
            try:
                anchor_il = datetime.strptime(request.anchor_date_il, "%Y-%m-%d").replace(
                    hour=3, minute=0, second=0, microsecond=0, tzinfo=ZoneInfo("Asia/Jerusalem")
                )
                target_anchor_utc = anchor_il.astimezone(ZoneInfo("UTC"))
                logger.info(f"[DEBUG] Using anchor_date_il={request.anchor_date_il} -> UTC {target_anchor_utc.isoformat()}")
            except Exception as parse_err:
                logger.warning(f"Invalid anchor_date_il format: {request.anchor_date_il} ({parse_err}) - fallback to default")
        result = await service.enrich_tweets_batch(request.run_id, target_anchor_utc=target_anchor_utc, market_context_override=request.market_context)
        
        quota_exceeded = result.get('quota_exceeded', False)
        
        if quota_exceeded:
            status = "partial_success"
            message = f"Enrichment stopped due to quota: {result['processed_count']} tweets processed, {result['errors']} errors"
            logger.warning(message)
        else:
            status = "success"
            message = f"Successfully enriched {result['processed_count']} tweets"
        
        return EnrichmentResponse(
            status=status,
            message=message,
            processed_count=result['processed_count'],
            errors=result['errors'],
            total_time=result['total_time'],
            quota_exceeded=quota_exceeded
        )
        
    except Exception as e:
        logger.error(f"Failed to process tweet enrichment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process tweet enrichment: {str(e)}"
        )

@router.post("/catalyst/group", response_model=CatalystResponse)
async def group_tweets_to_catalysts(request: CatalystRequest):
    try:
        logger.info(f"Grouping tweets to catalysts with {request.time_window_hours}h window")
        
        service = CatalystService()
        result = await service.group_tweets_to_catalysts(request.time_window_hours)
        
        return CatalystResponse(
            status="success",
            message=f"Successfully created {result['catalysts_created']} catalysts",
            catalysts_created=result['catalysts_created'],
            tweets_grouped=result['tweets_grouped'],
            total_time=result['total_time']
        )
        
    except Exception as e:
        logger.error(f"Failed to group tweets to catalysts: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to group tweets to catalysts: {str(e)}"
        )

@router.post("/enrichment/process-background")
async def process_tweet_enrichment_background(
    request: EnrichmentRequest,
    background_tasks: BackgroundTasks
):
    try:
        logger.info(f"Queuing tweet enrichment for run {request.run_id}")
        
        service = TweetEnrichmentService()
        target_anchor_utc = None
        if request.anchor_date_il:
            from datetime import datetime
            from zoneinfo import ZoneInfo
            try:
                anchor_il = datetime.strptime(request.anchor_date_il, "%Y-%m-%d").replace(
                    hour=3, minute=0, second=0, microsecond=0, tzinfo=ZoneInfo("Asia/Jerusalem")
                )
                target_anchor_utc = anchor_il.astimezone(ZoneInfo("UTC"))
                logger.info(f"[DEBUG] Using anchor_date_il={request.anchor_date_il} -> UTC {target_anchor_utc.isoformat()} (background)")
            except Exception as parse_err:
                logger.warning(f"Invalid anchor_date_il format: {request.anchor_date_il} ({parse_err}) - fallback to default")
        background_tasks.add_task(service.enrich_tweets_batch, request.run_id, target_anchor_utc)
        
        return {
            "status": "queued",
            "message": f"Tweet enrichment queued for run {request.run_id}",
            "run_id": request.run_id
        }
        
    except Exception as e:
        logger.error(f"Failed to queue tweet enrichment: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to queue tweet enrichment: {str(e)}"
        )

@router.post("/catalyst/group-background")
async def group_tweets_to_catalysts_background(
    request: CatalystRequest,
    background_tasks: BackgroundTasks
):
    try:
        logger.info(f"Queuing catalyst grouping with {request.time_window_hours}h window")
        
        service = CatalystService()
        background_tasks.add_task(service.group_tweets_to_catalysts, request.time_window_hours)
        
        return {
            "status": "queued",
            "message": f"Catalyst grouping queued with {request.time_window_hours}h window",
            "time_window_hours": request.time_window_hours
        }
        
    except Exception as e:
        logger.error(f"Failed to queue catalyst grouping: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to queue catalyst grouping: {str(e)}"
        )

@router.get("/enrichment/health")
async def enrichment_health_check():
    return {
        "status": "ok",
        "service": "tweet-enrichment",
        "openai_configured": bool(settings.OPENAI_API_KEY) if hasattr(settings, 'OPENAI_API_KEY') else False
    }

# ========================================
# TEST ENDPOINTS - For Local Testing Only
# ========================================

@router.get("/test/openai-key-check")
async def test_openai_key_check():
    """
    TEST ENDPOINT: Check if OpenAI API key is valid and has credits
    """
    try:
        logger.info("🔍 [TEST] Starting OpenAI key check...")
        
        if not settings.OPENAI_API_KEY:
            logger.error("❌ [TEST] OpenAI API key not configured")
            return {
                "status": "error",
                "message": "OpenAI API key not configured",
                "key_configured": False,
                "key_preview": None
            }
        
        key_preview = f"{settings.OPENAI_API_KEY[:7]}...{settings.OPENAI_API_KEY[-4:]}" if len(settings.OPENAI_API_KEY) > 11 else "***"
        logger.info(f"✅ [TEST] OpenAI key found: {key_preview}")
        
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        logger.info("📞 [TEST] Testing OpenAI API with simple request...")
        
        try:
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Say 'OK' if you can read this."}],
                temperature=0.1,
                max_tokens=10
            )
            
            result_text = response.choices[0].message.content
            logger.info(f"✅ [TEST] OpenAI API response received: {result_text}")
            
            return {
                "status": "success",
                "message": "OpenAI API key is valid and working",
                "key_configured": True,
                "key_preview": key_preview,
                "test_response": result_text,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens
                }
            }
            
        except Exception as api_error:
            error_str = str(api_error)
            error_code = getattr(api_error, 'code', None)
            
            logger.error(f"❌ [TEST] OpenAI API error: {error_str}")
            
            if 'insufficient_quota' in error_str or error_code == 'insufficient_quota':
                return {
                    "status": "quota_exceeded",
                    "message": "OpenAI API key has no credits/quota",
                    "key_configured": True,
                    "key_preview": key_preview,
                    "error": error_str,
                    "error_code": error_code
                }
            elif 'invalid_api_key' in error_str or error_code == 'invalid_api_key':
                return {
                    "status": "invalid_key",
                    "message": "OpenAI API key is invalid",
                    "key_configured": True,
                    "key_preview": key_preview,
                    "error": error_str,
                    "error_code": error_code
                }
            else:
                return {
                    "status": "error",
                    "message": f"OpenAI API error: {error_str}",
                    "key_configured": True,
                    "key_preview": key_preview,
                    "error": error_str,
                    "error_code": error_code
                }
                
    except Exception as e:
        logger.error(f"❌ [TEST] Failed to check OpenAI key: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to check OpenAI key: {str(e)}",
            "key_configured": bool(settings.OPENAI_API_KEY),
            "key_preview": None
        }

@router.post("/test/enrichment")
async def test_enrichment(request: EnrichmentRequest):
    """
    TEST ENDPOINT: Test enrichment flow with detailed debug logging
    """
    try:
        logger.info(f"🧪 [TEST] Starting test enrichment for run {request.run_id}")
        
        service = TweetEnrichmentService()
        
        logger.info(f"📊 [TEST] Fetching raw tweets for run {request.run_id}...")
        result = await service.enrich_tweets_batch(request.run_id)
        
        quota_exceeded = result.get('quota_exceeded', False)
        failed_tweets = result.get('failed_tweets', [])
        
        logger.info(f"📈 [TEST] Test enrichment results:")
        logger.info(f"  - Processed: {result['processed_count']}")
        logger.info(f"  - Errors: {result['errors']}")
        logger.info(f"  - Quota exceeded: {quota_exceeded}")
        logger.info(f"  - Total time: {result['total_time']:.2f}s")
        
        if failed_tweets:
            logger.warning(f"  - Failed tweets (first 5): {failed_tweets[:5]}")
        
        if quota_exceeded:
            status = "partial_success"
            message = f"⚠️ Test enrichment stopped due to quota: {result['processed_count']} tweets processed, {result['errors']} errors"
        else:
            status = "success"
            message = f"✅ Test enrichment completed: {result['processed_count']} tweets processed"
        
        return {
            "status": status,
            "message": message,
            "test_mode": True,
            "processed_count": result['processed_count'],
            "errors": result['errors'],
            "quota_exceeded": quota_exceeded,
            "total_time": result['total_time'],
            "failed_tweets": failed_tweets[:5],
            "debug_info": {
                "run_id": request.run_id,
                "quota_status": "exceeded" if quota_exceeded else "ok"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ [TEST] Test enrichment failed: {str(e)}")
        import traceback
        logger.error(f"📋 [TEST] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Test enrichment failed: {str(e)}"
        )

@router.post("/test/catalyst")
async def test_catalyst(request: CatalystRequest):
    """
    TEST ENDPOINT: Test catalyst grouping flow with detailed debug logging
    """
    try:
        logger.info(f"🧪 [TEST] Starting test catalyst grouping with {request.time_window_hours}h window")
        
        service = CatalystService()
        
        logger.info(f"📊 [TEST] Fetching enriched tweets with moverFlag=true...")
        result = await service.group_tweets_to_catalysts(request.time_window_hours)
        
        logger.info(f"📈 [TEST] Test catalyst results:")
        logger.info(f"  - Catalysts created: {result['catalysts_created']}")
        logger.info(f"  - Tweets grouped: {result['tweets_grouped']}")
        logger.info(f"  - Total time: {result['total_time']:.2f}s")
        
        if result['catalysts_created'] == 0:
            logger.warning("⚠️ [TEST] No catalysts created - likely no enriched tweets with moverFlag=true")
        
        return {
            "status": "success",
            "message": f"✅ Test catalyst grouping completed: {result['catalysts_created']} catalysts created",
            "test_mode": True,
            "catalysts_created": result['catalysts_created'],
            "tweets_grouped": result['tweets_grouped'],
            "total_time": result['total_time'],
            "debug_info": {
                "time_window_hours": request.time_window_hours,
                "note": "Catalysts only created if >= 2 enriched tweets with moverFlag=true found"
            }
        }
        
    except Exception as e:
        logger.error(f"❌ [TEST] Test catalyst failed: {str(e)}")
        import traceback
        logger.error(f"📋 [TEST] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Test catalyst failed: {str(e)}"
        )

@router.post("/test/full-pipeline")
async def test_full_pipeline(request: EnrichmentRequest):
    """
    TEST ENDPOINT: Test full pipeline (enrichment + catalyst) with detailed debug logging
    """
    try:
        logger.info(f"🧪 [TEST] ========================================")
        logger.info(f"🧪 [TEST] Starting FULL PIPELINE TEST for run {request.run_id}")
        logger.info(f"🧪 [TEST] ========================================")
        
        # Step 1: Test OpenAI key
        logger.info("")
        logger.info("📍 [TEST] STEP 1: Checking OpenAI API key...")
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        try:
            test_response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "OK"}],
                max_tokens=5
            )
            logger.info("✅ [TEST] OpenAI key check: PASSED")
        except Exception as key_error:
            logger.error(f"❌ [TEST] OpenAI key check: FAILED - {str(key_error)}")
            return {
                "status": "error",
                "message": f"OpenAI key check failed: {str(key_error)}",
                "test_mode": True,
                "step": "key_check"
            }
        
        # Step 2: Run enrichment
        logger.info("")
        logger.info("📍 [TEST] STEP 2: Running enrichment...")
        enrichment_service = TweetEnrichmentService()
        enrichment_result = await enrichment_service.enrich_tweets_batch(request.run_id)
        
        logger.info(f"📊 [TEST] Enrichment results:")
        logger.info(f"  - Processed: {enrichment_result['processed_count']}")
        logger.info(f"  - Errors: {enrichment_result['errors']}")
        logger.info(f"  - Quota exceeded: {enrichment_result.get('quota_exceeded', False)}")
        
        if enrichment_result.get('quota_exceeded', False):
            return {
                "status": "partial_success",
                "message": "Enrichment stopped due to quota - catalyst step skipped",
                "test_mode": True,
                "enrichment": enrichment_result,
                "catalyst": {
                    "status": "skipped",
                    "reason": "enrichment_quota_exceeded"
                }
            }
        
        # Step 3: Run catalyst
        logger.info("")
        logger.info("📍 [TEST] STEP 3: Running catalyst grouping...")
        catalyst_service = CatalystService()
        catalyst_result = await catalyst_service.group_tweets_to_catalysts(time_window_hours=1)
        
        logger.info(f"📊 [TEST] Catalyst results:")
        logger.info(f"  - Catalysts created: {catalyst_result['catalysts_created']}")
        logger.info(f"  - Tweets grouped: {catalyst_result['tweets_grouped']}")
        
        logger.info("")
        logger.info("✅ [TEST] ========================================")
        logger.info("✅ [TEST] FULL PIPELINE TEST COMPLETED")
        logger.info("✅ [TEST] ========================================")
        
        return {
            "status": "success",
            "message": "Full pipeline test completed",
            "test_mode": True,
            "enrichment": enrichment_result,
            "catalyst": catalyst_result,
            "summary": {
                "tweets_processed": enrichment_result['processed_count'],
                "catalysts_created": catalyst_result['catalysts_created'],
                "total_time": enrichment_result['total_time'] + catalyst_result['total_time']
            }
        }
        
    except Exception as e:
        logger.error(f"❌ [TEST] Full pipeline test failed: {str(e)}")
        import traceback
        logger.error(f"📋 [TEST] Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Full pipeline test failed: {str(e)}"
        )
