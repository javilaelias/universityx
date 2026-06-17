from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    port:         int    = 4006
    mongo_url:    str
    database_url: str
    jwt_secret:   str
    node_env:     str    = "development"

    class Config:
        env_file = ".env"

settings = Settings()
