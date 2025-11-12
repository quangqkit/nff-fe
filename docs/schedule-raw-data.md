# Schedule and Fetch Raw Data Flow - QA Documentation

## Overview

The system automatically fetches tweet data from **Lobstr** according to predefined schedules and stores it in the database. This flow runs completely automatically without manual intervention.

**Lobstr** is a platform for collecting Twitter data. Our system integrates with Lobstr to:
1. Automatically run according to schedules from Lobstr
2. Fetch the latest data (raw data)
3. Store it in the database for later processing

---

## Business Flow

### Overview Flow

```
┌─────────────────┐
│  Lobstr Platform │  Runs schedules automatically, creates runs and exports CSV
│                 │  according to configured schedule
└────────┬────────┘
         │
         │ (Cron Job automatically checks)
         ▼
┌─────────────────┐
│  Our System     │  At the scheduled time, the system automatically:
│                 │  1. Checks Lobstr API for new runs
│                 │  2. Gets CSV download link
│                 │  3. Downloads and processes CSV
│                 │  4. Saves tweets to database
└─────────────────┘
```

---

## Automatic Schedules

The system has **4 schedules** that run automatically every day (according to Israel time - Asia/Jerusalem):

| Time | Schedule ID | Description |
|------|-------------|-------------|
| **03:10** | `3ad05df5458b44ab862b81d4f9d108dd` | Runs after Lobstr schedule 03:00 completes |
| **11:10** | `73457dc6f5ae4da894e5c1610bbf9a06` | Runs after Lobstr schedule 11:00 completes |
| **14:10** | `a4e63ed9d96848748d2bdd91f534c504` | Runs after Lobstr schedule 14:00 completes |
| **15:43** | `e5f0850a18764aadbe08bd6c507ce26c` | Runs after Lobstr schedule 15:33 completes |

**Note**: The system runs **10 minutes later** (or 43 minutes) to ensure Lobstr has completed exporting the data.

---

## Automatic Processing Flow

### Step 1: Cron Job is triggered
- At the scheduled time, the system automatically runs the cron job
- The cron job identifies which schedule needs to be processed based on the current time

### Step 2: Get runs list from Lobstr
- The system calls Lobstr API to get the list of created runs
- Selects the latest run to process
- **API**: `GET /v1/runs?squid={scheduleId}`

### Step 3: Get CSV download link
- For the selected run, the system calls the API to get the CSV file download link
- **API**: `GET /v1/runs/{runId}/download`
- Returns URL to download the CSV file containing tweets

### Step 4: Process and save data
- The system calls Python service to:
  - Download CSV file from URL
  - Read and parse data from CSV
  - Save tweets to database (`TweetRaw` table)
  - Skip tweets that already exist (duplicates)

### Step 5: Completion
- Update run status in database
- Log processing information (number of tweets saved, number skipped)

---

## Stored Data

### Schedule Information
- Schedule ID from Lobstr
- Schedule name
- Status (active/inactive)
- Timezone and cron expression

### Run Information
- Run ID from Lobstr
- Schedule ID
- Status: `pending`, `running`, `completed`, `failed`
- Number of tweets fetched
- Number of tweets processed
- Number of tweets skipped (duplicates)
- Start and end time

### Tweet Information (Raw Data)
- Tweet ID (from Twitter)
- Tweet content (text)
- Author (author ID and handle)
- Tweet creation time and fetch time
- Number of likes, retweets, views, etc.
- Stock symbols mentioned (e.g., $AAPL, $TSLA)
- URLs in the tweet
- Whether it's a reply or retweet

---

## APIs for Manual Testing

### 1. Get runs list from Lobstr

**Endpoint**: `GET https://api.lobstr.io/v1/runs?squid={scheduleId}`

**Headers**:
```
Authorization: Token {LOBSTR_API_KEY}
```

**Response**: List of runs, newest run first

**How to test**:
- Replace `{scheduleId}` with one of the 4 schedule IDs above
- Check if response contains runs
- Note the `runId` of the newest run

---

### 2. Get CSV download link

**Endpoint**: `GET https://api.lobstr.io/v1/runs/{runId}/download`

**Headers**:
```
Authorization: Token {LOBSTR_API_KEY}
```

**Response**: 
```json
{
  "download_url": "https://lobstr.s3.amazonaws.com/...",
  "s3": "https://lobstr.s3.amazonaws.com/..."
}
```

**How to test**:
- Replace `{runId}` with run ID from step 1
- Copy `download_url` to use in step 3

---

### 3. Process data (Process Raw Data)

**Endpoint**: `POST http://{PYTHON_SERVICE_URL}/api/v1/lobstr/process`

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "download_url": "https://lobstr.s3.amazonaws.com/...",
  "schedule_id": "3ad05df5458b44ab862b81d4f9d108dd",
  "run_id": "run_abc123"
}
```

**Success Response**:
```json
{
  "status": "success",
  "message": "Successfully processed 150 tweets",
  "processed_count": 150,
  "duplicates_skipped": 10,
  "run_id": "run_abc123",
  "schedule_id": "3ad05df5458b44ab862b81d4f9d108dd"
}
```

**How to test**:
- Use `download_url` from step 2
- Replace `schedule_id` and `run_id` correctly
- Check if response has `status: "success"`
- Check `processed_count` and `duplicates_skipped`

---

### 4. Get raw data list

**Endpoint**: `GET http://{API_GATEWAY_URL}/lobstr/raw-data`

**Query Parameters**:
- `runId` (required): Filter by run ID (Lobstr run ID, not internal DB ID)
- `pageNumber` (optional): Page number (default: 1, min: 1)
- `pageSize` (optional): Number of records per page (default: 50, max: 100)

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "tweetId": "1234567890",
      "runId": "e4751c9b1b394dc587408aab4ea5c545",
      "scheduleId": "5b55b744592a4129bfa59ef4f1eb5dbc",
      "authorHandle": "@username",
      "text": "Tweet content here...",
      "createdAt": "2025-01-20T10:00:00.000Z",
      "fetchedAt": "2025-01-20T10:05:00.000Z",
      "isReply": false,
      "isRetweet": false,
      "publicMetrics": {
        "likes": 10,
        "retweets": 5,
        "views": 100
      },
      "symbols": ["AAPL", "TSLA"],
      "lang": "en"
    }
  ],
  "total": 150,
  "pageNumber": 1,
  "pageSize": 50,
  "totalPages": 3,
  "hasMore": true
}
```

**How to test**:
- Get raw data for a specific run: `GET /lobstr/raw-data?runId=e4751c9b1b394dc587408aab4ea5c545`
- With pagination: `GET /lobstr/raw-data?runId=e4751c9b1b394dc587408aab4ea5c545&pageNumber=1&pageSize=20`

**Example Requests**:
```bash
# Get raw data for specific run (first page, 50 items)
GET /lobstr/raw-data?runId=e4751c9b1b394dc587408aab4ea5c545

# Get raw data with custom pagination
GET /lobstr/raw-data?runId=e4751c9b1b394dc587408aab4ea5c545&pageNumber=2&pageSize=20
```

---

### 5. Manual trigger fetch raw data (Test without cron)

**Endpoint**: `POST http://{API_GATEWAY_URL}/lobstr/raw-data/fetch`

**Purpose**: Manually trigger the fetch raw data flow without waiting for cron job. This uses the same logic as the automatic scheduler.

**Query Parameters**:
- `scheduleId` (required): Lobstr schedule ID (e.g., `5b55b744592a4129bfa59ef4f1eb5dbc`)

**How it works**:
1. Takes `scheduleId` and finds the corresponding window time from schedule configurations
2. Calls `executeScheduledTask` with the window time (same logic as cron jobs)
3. Gets the latest run from Lobstr for that schedule
4. Gets download URL from Lobstr
5. Calls Python service to download and process CSV
6. Saves tweets to database

**Response**: Same as automatic scheduler - processes the latest run and saves to database.

**Example Request**:
```bash
# Process latest run for a schedule
POST /lobstr/raw-data/fetch?scheduleId=5b55b744592a4129bfa59ef4f1eb5dbc
```

**Use cases**:
- Test the flow immediately without waiting for cron
- Re-process a run that failed
- Fetch data for a manually triggered run
- Verify that the flow works correctly with specific schedules

**Note**: This endpoint uses the exact same logic as `executeScheduledTask`, ensuring consistency and code reuse. The `scheduleId` must be one of the configured schedule IDs in the system.

---

## Log Checking

### Logs from NestJS (API Gateway)

Important logs to check:
- `[DEBUG] Processing schedule {scheduleId} for window {scheduleTime}` - Starting processing
- `[DEBUG] Calling Lobstr API getRunsList...` - Calling Lobstr API
- `[DEBUG] Latest run: {runId}` - Found new run
- `[DEBUG] Download URL: {url}` - Got download URL
- `[DEBUG] Calling Python service for processing` - Calling Python service
- `[DEBUG] Successfully processed run {runId}` - Completed successfully

Error logs to watch:
- `No runs found for schedule {scheduleId}` - No runs
- `No download URL available for run {runId}` - No download URL
- `Error executing scheduled task` - Error during processing

### Logs from Python Service

Important logs to check:
- `[DEBUG] Starting Lobstr CSV processing for run {runId}` - Starting CSV processing
- `[DEBUG] CSV downloaded successfully in {time}s` - Download successful
- `[DEBUG] Parsed {count} tweets from CSV` - Parse successful
- `[DEBUG] Successfully processed {count} tweets` - Database save successful
- `[DEBUG] Duplicates skipped: {count}` - Number of duplicates

---

## Troubleshooting Guide

### Issue: Cron job not running

**Check**:
1. Verify system is running
2. Check logs for any cron job errors
3. Verify timezone is Asia/Jerusalem
4. Check with dev if cron job is enabled

**Solution**: Request dev to check cron job configuration or enable test cron to run immediately

---

### Issue: No runs from Lobstr

**Check**:
1. Verify schedule ID is correct
2. Check on Lobstr platform if schedule is running
3. Check if Lobstr API credentials are correct
4. Verify there are new runs on Lobstr platform

**Solution**: 
- Wait for schedule on Lobstr to complete
- Or trigger manual run on Lobstr platform

---

### Issue: No download URL

**Check**:
1. Verify run has completed on Lobstr
2. Check if run has exported data
3. Wait a bit (Lobstr may need time to generate URL)

**Solution**: Wait a few more minutes and try again, or choose a different run

---

### Issue: Tweets not saved to database

**Check**:
1. Check Python service logs for errors
2. Verify database connection
3. Check if response from API `/api/v1/lobstr/process` is successful
4. Verify run record exists in database

**Solution**: 
- Review detailed logs to find the cause
- Request dev to check database connection and schema

---

### Issue: Tweet count mismatch

**Check**:
1. Compare `tweetsProcessed` in run record with count in TweetRaw
2. Check if `duplicates_skipped` is reasonable
3. Verify there are no errors during processing

**Solution**: 
- Check logs to see if any tweets failed during parsing
- Verify duplicate detection works correctly

---

## References

- Lobstr Platform: https://lobstr.io
- API Documentation: Contact dev team for detailed API endpoints information
- Database Schema: Contact dev team for detailed schema

---