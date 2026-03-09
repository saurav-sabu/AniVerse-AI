import streamlit as st
from pipeline.pipeline import AnimeRecommendationPipeline
from dotenv import load_dotenv

st.set_page_config(page_title="Anime Recommendation",layout="wide")

load_dotenv()

@st.cache_resource
def init_pipeline():
    return AnimeRecommendationPipeline()

pipeline = init_pipeline()

st.title("Anime Recommentation System")

query = st.text_input("Enter your anime preferences: ")
if query:
    with st.spinner("Fetching recommentations for you"):
        response = pipeline.recommend(query)
        st.markdown("### Recommendation")
        st.write(response)