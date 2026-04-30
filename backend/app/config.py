from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App
    APP_NAME: str = "SupplyGuard AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "change-in-production"

    # Database
    DATABASE_URL: str
    ASYNC_DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379"

    # Kafka
    KAFKA_BOOTSTRAP_SERVERS: str = "localhost:9092"

    # ML
    MODEL_PATH: str = "./ml_engine/models/"
    PREDICTION_THRESHOLD: float = 0.7
    
    NEWS_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()