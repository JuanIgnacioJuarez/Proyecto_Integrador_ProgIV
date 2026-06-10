from dotenv import load_dotenv

load_dotenv()

from backend.seeds.seed_data import run_all_seeds  # noqa: E402

__all__ = ["run_all_seeds"]
