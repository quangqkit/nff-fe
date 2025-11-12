import sentry_sdk

def init_sentry(dsn: str):
    sentry_sdk.init(
        dsn=dsn,
        traces_sample_rate=0.1,
        send_default_pii=False
    )