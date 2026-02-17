from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str = ""
    gemini_api_keys_raw: str = ""
    database_url: str = "sqlite:///./data/vendorlens.db"
    cors_origins_raw: str = "http://localhost:5173,http://localhost:3000,http://localhost:8000"
    gemini_model: str = "gemini-2.5-flash"

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]

    @property
    def gemini_api_keys(self) -> list[str]:
        pool: list[str] = []
        for k in self.gemini_api_keys_raw.split(","):
            k = k.strip()
            if k and k not in pool:
                pool.append(k)
        if self.gemini_api_key and self.gemini_api_key not in pool:
            pool.append(self.gemini_api_key)
        return pool

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
