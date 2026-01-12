from prometheus_fastapi_instrumentator import Instrumentator

def setup_metrics(app):
    Instrumentator(
        should_group_status_codes=True,
        should_ignore_untemplated=True,
        should_respect_env_var=True,
        env_var_name="METRICS_ENABLED",
    ).instrument(app).expose(app, endpoint="/metrics", include_in_schema=False)
