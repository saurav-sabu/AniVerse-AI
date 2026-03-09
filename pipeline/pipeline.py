from src.vector_store import VectorStoreBuilder
from src.recommender import AnimeRecommendar
from utils.logger import get_logger
from utils.custom_exception import CustomException

logger = get_logger(__name__)

class AnimeRecommendationPipeline:

    def __init__(self,persist_dir="chroma_db"):

        try:
            logger.info("Initialization Recommendation Pipeline")
            vector_builder = VectorStoreBuilder(
                csv_path="",persist_dir=persist_dir
            )

            retriever = vector_builder.load_vector_store().as_retriever()

            self.recommender = AnimeRecommendar(
                retriever=retriever
            )

            logger.info("Pipeline Initialized Successfully")

        except Exception as e:
            logger.error(f"Failed to initialize pipeline: {str(e)}")
            raise CustomException(
                "Error during pipeline initialization",e
            )


    
    def recommend(self,query:str):

        try:
            logger.info(f"Received Query: {query}")
            return self.recommender.get_recommendation(query)
        
        except Exception as e:
            logger.error(f"Recommendation failed: {str(e)}")
            raise CustomException(
                "Error during recommendation",e
            )

